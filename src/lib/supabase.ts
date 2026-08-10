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

// Email OTP: Supabase emails a one-time code the user types into the app —
// no deep link needed. The "Magic Link" email template must contain {{ .Token }}.
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
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

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const returned = new URL(result.url);
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
  if (!accessToken || !refreshToken) return false;
  const { error: setError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (setError) throw setError;
  return true;
}

export const signInWithGoogle = () => signInWithOAuthProvider('google');
// Sign in with Apple via Supabase's hosted OAuth (not the native
// expo-apple-authentication flow), so no extra native module or entitlement
// is needed — just enable the Apple provider in the Supabase dashboard.
export const signInWithApple = () => signInWithOAuthProvider('apple');
