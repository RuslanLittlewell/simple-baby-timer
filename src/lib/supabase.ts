import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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

export type AccountCheck = 'ok' | 'signedOut' | 'missing' | 'unreachable';

// A stored session keeps working on the device until something actually asks
// the auth server, so an account deleted (or a token revoked) server-side stays
// invisible to the app. This asks. Only an outright rejection counts as gone —
// a flaky network or a server hiccup must never look like a deleted account.
export async function checkAccount(): Promise<AccountCheck> {
  if (!isSupabaseConfigured) return 'signedOut';
  const { data } = await supabase.auth.getSession();
  if (!data.session) return 'signedOut';
  // GET /auth/v1/user with the stored token. A deleted user answers 403, an
  // expired or revoked refresh token 400/401, a broken network throws a
  // retryable error and a bad day for the auth server gives 5xx — only the
  // first group means the account is really gone.
  const { error } = await supabase.auth.getUser();
  if (!error) return 'ok';
  if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) return 'unreachable';
  return 'missing';
}

// Drops the local session without calling the server — the token behind a
// deleted account cannot be revoked anymore, and the call would just fail.
export async function signOutLocal(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

// User-initiated sign-out: revoke the refresh token server-side when possible,
// but never leave the device signed in because the network was down.
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) await signOutLocal();
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
async function signInWithOAuthProvider(provider: 'google' | 'apple'): Promise<boolean> {
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('no auth url');

  const url = await awaitRedirect(data.url, redirectTo);
  // No redirect at all: the user closed the sheet.
  if (!url) return false;

  const returned = new URL(url);
  const code = returned.searchParams.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return true;
  }

  // Implicit-flow fallback: tokens arrive in the URL hash.
  const params = new URLSearchParams(returned.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error: setError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setError) throw setError;
    return true;
  }

  // Supabase reports provider-side failures on the redirect itself; surfacing
  // them beats returning to the form with no explanation.
  const providerError =
    returned.searchParams.get('error_description') ??
    returned.searchParams.get('error') ??
    params.get('error_description') ??
    params.get('error');
  throw new Error(providerError ?? `sign-in returned no credentials: ${returned.search}`);
}

export const signInWithGoogle = () => signInWithOAuthProvider('google');
// Sign in with Apple via Supabase's hosted OAuth (not the native
// expo-apple-authentication flow), so no extra native module or entitlement
// is needed — just enable the Apple provider in the Supabase dashboard.
export const signInWithApple = () => signInWithOAuthProvider('apple');
