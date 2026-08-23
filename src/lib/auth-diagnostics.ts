import type { AccountCheckOutcome, AuthStatusClass } from './auth-lifecycle.ts';

type AuthDiagnosticEvent =
  | 'app-state'
  | 'auth-event'
  | 'account-check'
  | 'sync-request'
  | 'sync-start'
  | 'sync-result'
  | 'logout-stage'
  | 'oauth-stage'
  | 'verified-session';

interface AuthDiagnosticDetails {
  previousAppState?: string;
  nextAppState?: string;
  authEvent?: string;
  hasSession?: boolean;
  outcome?: AccountCheckOutcome | 'success' | 'unavailable' | 'auth-required' | 'failed';
  statusClass?: AuthStatusClass;
  syncGeneration?: number;
  fresh?: boolean;
  authGeneration?: number;
  attemptGeneration?: number;
  stage?:
    | 'started'
    | 'provider-launch'
    | 'redirect-received'
    | 'cancelled'
    | 'exchange'
    | 'session-verification'
    | 'gate-transition'
    | 'stale-rejected'
    | 'completed'
    | 'failed';
  
  
  failedAt?:
    | 'provider-launch'
    | 'code-exchange'
    | 'set-session'
    | 'no-credentials'
    | 'session-verification';
}

export interface AuthDiagnosticRecord extends AuthDiagnosticDetails {
  event: AuthDiagnosticEvent;
}

const diagnosticsEnabled = typeof __DEV__ !== 'undefined' && __DEV__;

export function logAuthDiagnostic(
  event: AuthDiagnosticEvent,
  details: AuthDiagnosticDetails = {},
): void {
  if (!diagnosticsEnabled) return;
  console.info('[auth-lifecycle]', createAuthDiagnosticRecord(event, details));
}

export function createAuthDiagnosticRecord(
  event: AuthDiagnosticEvent,
  details: AuthDiagnosticDetails = {},
): AuthDiagnosticRecord {
  
  
  
  const record: AuthDiagnosticRecord = { event };
  if (details.previousAppState !== undefined) {
    record.previousAppState = details.previousAppState;
  }
  if (details.nextAppState !== undefined) record.nextAppState = details.nextAppState;
  if (details.authEvent !== undefined) record.authEvent = details.authEvent;
  if (details.hasSession !== undefined) record.hasSession = details.hasSession;
  if (details.outcome !== undefined) record.outcome = details.outcome;
  if (details.statusClass !== undefined) record.statusClass = details.statusClass;
  if (details.syncGeneration !== undefined) record.syncGeneration = details.syncGeneration;
  if (details.fresh !== undefined) record.fresh = details.fresh;
  if (details.authGeneration !== undefined) record.authGeneration = details.authGeneration;
  if (details.attemptGeneration !== undefined) {
    record.attemptGeneration = details.attemptGeneration;
  }
  if (details.stage !== undefined) record.stage = details.stage;
  if (details.failedAt !== undefined) record.failedAt = details.failedAt;
  return record;
}
