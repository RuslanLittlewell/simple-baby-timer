import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL('../src/state/app-state.ts', import.meta.url),
  'utf8',
);

test('durably finalized local sleeps record a regime wake-up', () => {
  const finalize = source.slice(
    source.indexOf('async function finalizeSession'),
    source.indexOf('function remoteIdOfChild'),
  );

  assert.match(finalize, /await saveSession\(session\);\s*recordRegimeWakeUp\(session\);/);
  assert.match(source, /if \(session\.kind !== 'sleep' \|\| !session\.childId\) return;/);
});

test('explicit shared sleep completion records the same wake-up adjustment', () => {
  const stopRemote = source.slice(
    source.indexOf('stopRemoteActivity: async'),
    source.indexOf('transitionMainActivity: async'),
  );
  const transitionStart = source.indexOf('transitionMainActivity: async', source.indexOf('stopRemoteActivity: async'));
  const transitionRemote = source.slice(
    transitionStart,
    source.indexOf('setSleepMinutes:', transitionStart),
  );

  assert.match(stopRemote, /await saveSession\(session\);\s*recordRegimeWakeUp\(session\);/);
  assert.match(
    transitionRemote,
    /await saveSession\(completed\);\s*recordRegimeWakeUp\(completed\);/,
  );
});

test('manual sleep history does not re-anchor the live daily plan', () => {
  const manual = source.slice(
    source.indexOf('addManualActivity: async'),
    source.indexOf('startActivity: async'),
  );

  assert.doesNotMatch(manual, /recordRegimeWakeUp/);
});
