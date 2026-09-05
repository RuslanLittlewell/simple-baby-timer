export type AccountCheckOutcome = 'ok' | 'definitive-auth-loss' | 'inconclusive';

export type AuthStatusClass = 'none' | '4xx' | '5xx' | 'other';

interface AuthFailureSummary {
  status?: number;
  code?: string;
  retryable: boolean;
}

export function classifySessionRecovery(
  hasSession: boolean,
  failure?: AuthFailureSummary,
  confirmedMissing = false,
): AccountCheckOutcome {
  if (hasSession) return 'ok';
  if (!failure) return confirmedMissing ? 'definitive-auth-loss' : 'inconclusive';
  return classifyAuthFailure(failure);
}

const INVALID_REFRESH_CODES = new Set([
  'refresh_token_not_found',
  'refresh_token_already_used',
]);

export function classifyAuthFailure({
  status,
  code,
  retryable,
}: AuthFailureSummary): Exclude<AccountCheckOutcome, 'ok'> {
  if (retryable) return 'inconclusive';
  if (code && INVALID_REFRESH_CODES.has(code)) return 'definitive-auth-loss';
  if (status === 401 || status === 403) return 'definitive-auth-loss';
  return 'inconclusive';
}

/**
 * An access token that merely went stale and an account that was really revoked
 * both answer 401/403, so that status alone must not end a session. Only the
 * refresh token can tell them apart, and this reports when it has to be asked.
 */
export function requiresSessionRefresh({
  status,
  code,
  retryable,
}: AuthFailureSummary): boolean {
  if (retryable) return false;
  if (code && INVALID_REFRESH_CODES.has(code)) return false;
  return status === 401 || status === 403;
}

export function authStatusClass(status?: number): AuthStatusClass {
  if (status === undefined || status === 0) return 'none';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return 'other';
}

export function isForegroundEdge(previous: string, next: string): boolean {
  return previous !== 'active' && next === 'active';
}

export function authEventRequiresGate(event: string, hasSession: boolean): boolean {
  if (hasSession) return false;
  return event === 'INITIAL_SESSION' || event === 'SIGNED_OUT';
}

export function accountOutcomeRequiresGate(outcome: AccountCheckOutcome): boolean {
  return outcome === 'definitive-auth-loss';
}
