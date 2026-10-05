import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  findEndedLiveActivityKeys,
  planLiveActivityReconciliation,
} from '../src/lib/live-activity-lifecycle.ts';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const require = createRequire(import.meta.url);

const desired = (overrides = {}) => ({
  ownerId: 'child-1',
  slot: 'session',
  kind: 'sleep',
  startedAt: 100,
  ...overrides,
});

test('records whose native activity ended are found so they can be restarted', () => {
  const alive = desired({ ownerId: 'child-1', id: 'alive' });
  const ended = desired({ ownerId: 'child-2', id: 'ended' });
  const placeholder = desired({ ownerId: 'child-3', startedAt: 0, id: 'pushed' });
  const probed = [];
  const keys = findEndedLiveActivityKeys([alive, ended, placeholder], (record) => {
    probed.push(record.id);
    return record.id !== 'ended';
  });
  assert.deepEqual(keys, ['child-2|session']);
  assert.deepEqual(probed, ['alive', 'ended']);

  const plan = planLiveActivityReconciliation([alive], [alive, desired({ ownerId: 'child-2' })]);
  assert.deepEqual(plan.start.map((item) => item.ownerId), ['child-2']);
});

test('stale persisted activity is stopped when no mode is active', () => {
  const plan = planLiveActivityReconciliation([desired()], []);
  assert.deepEqual(plan.stopKeys, ['child-1|session']);
  assert.deepEqual(plan.start, []);
});

test('a changed mode replaces the existing activity', () => {
  const plan = planLiveActivityReconciliation([desired()], [desired({ kind: 'awake', startedAt: 200 })]);
  assert.deepEqual(plan.stopKeys, ['child-1|session']);
  assert.equal(plan.start.length, 1);
  assert.equal(plan.start[0].kind, 'awake');
});

test('a push-created activity is adopted without creating a duplicate', () => {
  const plan = planLiveActivityReconciliation(
    [desired({ kind: 'awake', startedAt: 0 })],
    [desired()],
  );
  assert.deepEqual(plan.stopKeys, []);
  assert.equal(plan.adopt.length, 1);
  assert.deepEqual(plan.start, []);
});

test('repeated reconciliation keeps one matching activity', () => {
  const plan = planLiveActivityReconciliation([desired()], [desired(), desired()]);
  assert.deepEqual(plan.stopKeys, []);
  assert.deepEqual(plan.adopt, []);
  assert.deepEqual(plan.start, []);
});

test('session and feeding tracks remain independent', () => {
  const feeding = desired({ slot: 'feeding', kind: 'feeding' });
  const plan = planLiveActivityReconciliation([desired(), feeding], [feeding]);
  assert.deepEqual(plan.stopKeys, ['child-1|session']);
  assert.deepEqual(plan.start, []);
});

test('live activity presentation includes mode color, roomier padding, and last feeding', () => {
  const liveActivity = read('../src/lib/live-activity.ts');
  const appState = read('../src/state/app-state.ts');
  const syncHook = read('../src/hooks/use-sync.ts');
  const appConfig = JSON.parse(read('../app.json'));
  const liveActivityStyle = require('../plugins/with-live-activity-style.js');
  const nativeSourceDirectory = '../node_modules/expo-live-activity/ios-files/';
  const mediumView = liveActivityStyle.transformations['LiveActivityMediumView.swift'](
    read(`${nativeSourceDirectory}LiveActivityMediumView.swift`),
  );
  const smallView = liveActivityStyle.transformations['LiveActivitySmallView.swift'](
    read(`${nativeSourceDirectory}LiveActivitySmallView.swift`),
  );
  const widget = liveActivityStyle.transformations['LiveActivityWidget.swift'](
    read(`${nativeSourceDirectory}LiveActivityWidget.swift`),
  );
  const push = read('../supabase/functions/live-activity-push/index.ts');

  assert.match(liveActivity, /const visible = `\$\{translate\(language, 'stats\.lastFeeding'\)\}: \$\{lastFeeding\}`/);
  assert.match(liveActivity, /translate\(language, 'liveActivity\.ago'\)/);
  assert.match(liveActivity, /padding: \{ vertical: 14, horizontal: 16 \}/);
  assert.match(liveActivity, /LiveActivity\.updateActivity/);
  assert.match(liveActivity, /findEndedLiveActivityKeys\(Object\.values\(records\), isNativeActivityAlive\)/);
  assert.match(appState, /getLatestFeedingStart/);
  assert.match(appState, /updateLiveActivityLastFeeding/);
  assert.match(syncHook, /buildLiveActivityLabels/);
  assert.match(mediumView, /Circle\(\)[\s\S]*?fill\(progressViewTint/);
  assert.match(smallView, /Circle\(\)[\s\S]*?fill\(progressViewTint/);
  assert.match(widget, /dynamicIslandExpandedLeading\([\s\S]*?progressViewTint/);
  for (const view of [mediumView, smallView, widget]) {
    assert.match(view, /LiveActivitySubtitleText\(subtitle\)/);
    assert.doesNotMatch(view, /\bText\(subtitle\)/);
  }
  const viewHelpers = liveActivityStyle.transformations['ViewHelpers.swift'](
    read(`${nativeSourceDirectory}ViewHelpers.swift`),
  );
  assert.match(viewHelpers, /struct LiveActivitySubtitleText/);
  assert.match(viewHelpers, /components\(separatedBy: "\\u\{1F\}"\)/);
  assert.match(push, /lastFeedingSubtitle\(locale, subtitleFormat, lastFeedingTime, lastFeedingAt\)/);
  assert.match(push, /subtitleFormat < ELAPSED_SUBTITLE_FORMAT/);
  assert.equal((push.match(/locale, subtitle_format'\)/g) ?? []).length, 2);
  assert.match(read('../src/lib/live-activity-sync.ts'), /subtitle_format: LIVE_ACTIVITY_SUBTITLE_FORMAT/);
  assert.ok(appConfig.expo.plugins.includes('./plugins/with-live-activity-style'));
  assert.match(push, /const lastFeedingTitles/);
  assert.match(push, /paddingDetails: \{ vertical: 14, horizontal: 16 \}/);
  assert.match(push, /event: 'update'/);
});
