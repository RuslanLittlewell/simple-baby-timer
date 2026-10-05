import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('every write to the session history notifies its listeners', () => {
  const store = read('../src/lib/activity-store.ts');
  for (const name of [
    'claimUnownedSessions',
    'deleteAllSessions',
    'deleteSessionsForChild',
    'mergeRemoteSessions',
    'saveSession',
    'deleteSession',
    'updateSession',
  ]) {
    const start = store.indexOf(`export async function ${name}(`);
    const body = store.slice(start, store.indexOf('\nexport ', start + 1));
    assert.match(body, /notifySessionsChanged\(\)/, name);
  }
});

test('the day adjustment is rebuilt from history instead of per completed sleep', () => {
  const appState = read('../src/state/app-state.ts');
  const editor = read('../src/features/calendar/components/entry-editor/use-entry-editor-form.ts');
  const hook = read('../src/hooks/use-regime-day-adjustment.ts');
  const layout = read('../src/app/_layout.tsx');

  assert.doesNotMatch(appState, /recordRegimeWakeUp|recordCompletedSleep/);
  assert.doesNotMatch(editor, /recordCompletedSleep/);
  assert.match(hook, /subscribeToSessionChanges\(scheduleRecalculation\)/);
  assert.match(hook, /state\.session !== previous\.session \|\| state\.remoteLive !== previous\.remoteLive/);
  assert.match(hook, /recalculateDailyAdjustment\(childId, sleeps, now\)/);
  assert.match(layout, /useRegimeDayAdjustment\(\);/);
});
