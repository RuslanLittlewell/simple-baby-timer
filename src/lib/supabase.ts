import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { logAuthDiagnostic } from '@/lib/auth-diagnostics';
import { authGeneration } from '@/lib/auth-generation';
import {
  authStatusClass,
  classifyAuthFailure,
  classifySessionRecovery,
  requiresSessionRefresh,
  type AccountCheckOutcome,
} from '@/lib/auth-lifecycle';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;
const isServerRendering = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'anon', {
  auth: {
    storage: isServerRendering ? undefined : AsyncStorage,
    autoRefreshToken: !isServerRendering,
    persistSession: !isServerRendering,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});



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
  
  
  
  
  const { error } = await supabase.auth.getUser();
  if (!error) {
    logAuthDiagnostic('account-check', { outcome: 'ok', statusClass: 'none' });
    return 'ok';
  }
  const failure = {
    status: error.status,
    code: error.code,
    retryable: isAuthRetryableFetchError(error),
  };
  if (requiresSessionRefresh(failure)) {
    const outcome = await recoverSessionByRefresh();
    logAuthDiagnostic('account-check', {
      outcome: outcome.result,
      statusClass: authStatusClass(outcome.status),
    });
    return outcome.result;
  }
  const outcome = classifyAuthFailure(failure);
  logAuthDiagnostic('account-check', {
    outcome,
    statusClass: authStatusClass(error.status),
  });
  return outcome;
}

interface SessionRecovery {
  result: AccountCheckOutcome;
  status?: number;
}

/**
 * Spends the refresh token to settle whether the rejected access token was
 * stale or the account is gone. A renewed session is proof the credentials
 * still hold; otherwise the refresh failure itself carries the verdict.
 */
async function recoverSessionByRefresh(): Promise<SessionRecovery> {
  const { data, error } = await supabase.auth.refreshSession();
  if (data.session && !error) return { result: 'ok' };
  if (!error) return { result: 'definitive-auth-loss' };
  return {
    result: classifyAuthFailure({
      status: error.status,
      code: error.code,
      retryable: isAuthRetryableFetchError(error),
    }),
    status: error.status,
  };
}



export async function signOutLocal(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}



export async function signOut(): Promise<void> {
  const generation = authGeneration.beginLogout();
  logAuthDiagnostic('logout-stage', {
    stage: 'started',
    authGeneration: generation,
    hasSession: true,
  });
  const { error } = await supabase.auth.signOut();
  
  
  
  logAuthDiagnostic('logout-stage', {
    stage: error ? 'failed' : 'completed',
    authGeneration: generation,
    outcome: error ? 'failed' : 'success',
  });
}




const REDIRECT_GRACE_MS = 1500;




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



let oauthAttemptGeneration = 0;

export class RetryableAuthError extends Error {
  constructor(readonly stage: 'provider-launch' | 'exchange' | 'session-verification') {
    super('Please try signing in again.');
    this.name = 'RetryableAuthError';
  }
}





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



export const signInWithApple = () => signInWithOAuthProvider('apple');
