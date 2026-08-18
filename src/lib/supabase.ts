import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { logAuthDiagnostic } from '@/lib/auth-diagnostics';
import { authGeneration } from '@/lib/auth-generation';
import {
  authStatusClass,
  classifyAuthFailure,
  classifySessionRecovery,
  type AccountCheckOutcome,
} from '@/lib/auth-lifecycle';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
// New-style sb_publishable_… key; legacy anon key works as a fallback.
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'anon', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Thrown by sync operations that need an account; the UI reacts by showing
// the sign-in modal and retrying afterwards.
export class NotSignedInError extends Error {
  constructor() {
    super('not signed in');
    this.name = 'NotSignedInError';
  }
}

export async function requireSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new NotSignedInError();
}

export async function getIsSignedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// A stored session keeps working on the device until something actually asks
// the auth server, so an account deleted (or a token revoked) server-side stays
// invisible to the app. This asks. Only an outright rejection counts as gone —
// a flaky network or a server hiccup must never look like a deleted account.
export async function checkAccount(): Promise<AccountCheckOutcome> {
  if (!isSupabaseConfigured) return 'definitive-auth-loss';
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (!data.session) {
    const outcome = classifySessionRecovery(
      false,
      sessionError
        ? {
            status: sessionError.status,
            code: sessionError.code,
            retryable: isAuthRetryableFetchError(sessionError),
          }
        : undefined,
    );
    logAuthDiagnostic('account-check', {
      outcome,
      statusClass: authStatusClass(sessionError?.status),
    });
    return outcome;
  }
  // GET /auth/v1/user with the stored token. A deleted user answers 403, an
  // expired or revoked refresh token 400/401, a broken network throws a
  // retryable error and a bad day for the auth server gives 5xx — only the
  // first group means the account is really gone.
  const { error } = await supabase.auth.getUser();
  if (!error) {
    logAuthDiagnostic('account-check', { outcome: 'ok', statusClass: 'none' });
    return 'ok';
  }
  const outcome = classifyAuthFailure({
    status: error.status,
    code: error.code,
    retryable: isAuthRetryableFetchError(error),
  });
  logAuthDiagnostic('account-check', {
    outcome,
    statusClass: authStatusClass(error.status),
  });
  return outcome;
}

// Drops the local session without calling the server — the token behind a
// deleted account cannot be revoked anymore, and the call would just fail.
export async function signOutLocal(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

// User-initiated sign-out: revoke the refresh token server-side when possible,
// but never leave the device signed in because the network was down.
export async function signOut(): Promise<void> {
  const generation = authGeneration.beginLogout();
  logAuthDiagnostic('logout-stage', {
    stage: 'started',
    authGeneration: generation,
    hasSession: true,
  });
  const { error } = await supabase.auth.signOut();
  // The installed Supabase Auth client removes the local session before it
  // returns a remote-revocation error. A second local sign-out here could run
  // after a new OAuth session was saved and clear that newer session.
  logAuthDiagnostic('logout-stage', {
    stage: error ? 'failed' : 'completed',
    authGeneration: generation,
    outcome: error ? 'failed' : 'success',
  });
}

// How long to keep waiting for the deep link after the auth session closed.
// The system hands it over within a frame or two; anything longer is a real
// cancel.
const REDIRECT_GRACE_MS = 1500;

// The redirect home can arrive two ways: as the result of the auth session, or
// through Linking when the system routes the deep link to the app first. Only
// watching the first one makes a completed sign-in look like nothing happened.
async function awaitRedirect(authUrl: string, redirectTo: string): Promise<string | null> {
  let deliver: (url: string | null) => void = () => {};
  const viaLinking = new Promise<string | null>((resolve) => {
    deliver = resolve;
  });
  const subscription = Linking.addEventListener('url', ({ url }) => deliver(url));
  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
    if (result.type === 'success') return result.url;
    return await Promise.race([
      viaLinking,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), REDIRECT_GRACE_MS)),
    ]);
  } finally {
    subscription.remove();
  }
}

// Shared browser-based OAuth flow through Supabase; the redirect returns to
// the app via the babytimer:// scheme. Returns false when the user cancels.
let oauthAttemptGeneration = 0;

export class RetryableAuthError extends Error {
  constructor(readonly stage: 'provider-launch' | 'exchange' | 'session-verification') {
    super('Please try signing in again.');
    this.name = 'RetryableAuthError';
  }
}

// Between opening the provider sheet and exchanging the code there is
// legitimately no session, and the PKCE verifier for the exchange lives in the
// same storage a sign-out clears. Anything that reacts to "no session" must
// hold off while this is true.
let oauthInFlight = 0;

export const isOAuthInFlight = (): boolean => oauthInFlight > 0;

async function signInWithOAuthProvider(provider: 'google' | 'apple'): Promise<boolean> {
  oauthInFlight += 1;
  try {
    return await runOAuthProviderFlow(provider);
  } finally {
    oauthInFlight -= 1;
  }
}

async function runOAuthProviderFlow(provider: 'google' | 'apple'): Promise<boolean> {
  const attemptGeneration = ++oauthAttemptGeneration;
  const ensureLatestAttempt = () => {
    if (attemptGeneration === oauthAttemptGeneration) return;
    logAuthDiagnostic('oauth-stage', { stage: 'stale-rejected', attemptGeneration });
    throw new RetryableAuthError('session-verification');
  };
  const startingAuthGeneration = authGeneration.snapshot();
  logAuthDiagnostic('oauth-stage', {
    stage: 'provider-launch',
    attemptGeneration,
    authGeneration: startingAuthGeneration,
  });
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    logAuthDiagnostic('oauth-stage', { stage: 'failed', failedAt: 'provider-launch', attemptGeneration });
    throw new RetryableAuthError('provider-launch');
  }

  const url = await awaitRedirect(data.url, redirectTo);
  ensureLatestAttempt();
  // No redirect at all: the user closed the sheet.
  if (!url) {
    logAuthDiagnostic('oauth-stage', { stage: 'cancelled', attemptGeneration });
    return false;
  }
  logAuthDiagnostic('oauth-stage', { stage: 'redirect-received', attemptGeneration });

  const returned = new URL(url);
  const code = returned.searchParams.get('code');
  if (code) {
    logAuthDiagnostic('oauth-stage', { stage: 'exchange', attemptGeneration });
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      logAuthDiagnostic('oauth-stage', { stage: 'failed', failedAt: 'code-exchange', attemptGeneration });
      throw new RetryableAuthError('exchange');
    }
  } else {
    // Implicit-flow fallback: tokens arrive in the URL hash.
    const params = new URLSearchParams(returned.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      logAuthDiagnostic('oauth-stage', { stage: 'exchange', attemptGeneration });
      const { error: setError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setError) {
        logAuthDiagnostic('oauth-stage', { stage: 'failed', failedAt: 'set-session', attemptGeneration });
        throw new RetryableAuthError('exchange');
      }
    } else {
      // Provider payloads and callback values intentionally stay out of both
      // the UI and diagnostics.
      logAuthDiagnostic('oauth-stage', { stage: 'failed', failedAt: 'no-credentials', attemptGeneration });
      throw new RetryableAuthError('exchange');
    }
  }

  logAuthDiagnostic('oauth-stage', { stage: 'session-verification', attemptGeneration });
  const { data: verified, error: verificationError } = await supabase.auth.getSession();
  ensureLatestAttempt();
  if (verificationError || !verified.session) {
    logAuthDiagnostic('oauth-stage', { stage: 'failed', failedAt: 'session-verification', attemptGeneration });
    throw new RetryableAuthError('session-verification');
  }
  logAuthDiagnostic('oauth-stage', {
    stage: 'completed',
    attemptGeneration,
    authGeneration: authGeneration.snapshot(),
    hasSession: true,
  });
  return true;
}

export const signInWithGoogle = () => signInWithOAuthProvider('google');
// Sign in with Apple via Supabase's hosted OAuth (not the native
// expo-apple-authentication flow), so no extra native module or entitlement
// is needed — just enable the Apple provider in the Supabase dashboard.
export const signInWithApple = () => signInWithOAuthProvider('apple');
