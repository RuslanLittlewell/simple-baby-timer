import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parseRemoteChange } from '../src/lib/remote-change.ts';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('the iOS background task payload names the child whose mode changed', () => {
  const body = { type: 'live-changed', childId: 'child-1' };
  assert.deepEqual(
    parseRemoteChange({ data: { body, dataString: JSON.stringify(body) }, notification: null }),
    body,
  );
  assert.deepEqual(parseRemoteChange({ data: { dataString: JSON.stringify(body) } }), body);
});

test('payloads that are not a live change are ignored', () => {
  assert.equal(parseRemoteChange(null), null);
  assert.equal(parseRemoteChange({ data: {} }), null);
  assert.equal(parseRemoteChange({ data: { body: { type: 'other', childId: 'x' } } }), null);
  assert.equal(parseRemoteChange({ data: { body: { type: 'live-changed', childId: '' } } }), null);
  assert.equal(parseRemoteChange({ data: { dataString: '{not json' } }), null);
});

test('the push function wakes the other members\' apps with a background push', () => {
  const source = read('../supabase/functions/live-activity-push/index.ts');
  assert.match(source, /topic: BUNDLE_ID, pushType: 'background', priority: '5'/);
  assert.match(source, /'content-available': 1/);
  assert.match(source, /type: 'live-changed', childId/);
  assert.match(source, /const wakeups = await wakeMemberApps\(/);
});

test('the background task is defined at startup and backed by the iOS background mode', () => {
  const pkg = JSON.parse(read('../package.json'));
  assert.equal(pkg.main, 'index.ts');
  assert.match(read('../index.ts'), /import '@\/hooks\/remote-change-task'/);

  const plugins = JSON.parse(read('../app.json')).expo.plugins;
  const notifications = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications');
  assert.equal(notifications[1].enableBackgroundRemoteNotifications, true);

  const task = read('../src/hooks/remote-change-task.ts');
  assert.match(task, /TaskManager\.defineTask/);
  assert.match(task, /Notifications\.registerTaskAsync\(REMOTE_CHANGE_TASK\)/);
});

test('device tokens are reachable through the Data API under RLS', () => {
  const schema = read('../supabase/schema.sql');
  assert.match(schema, /public\.sync_push_devices,\n  public\.invites\nto authenticated, service_role;/);
  assert.match(schema, /alter table public\.sync_push_devices enable row level security;/);
  const migration = read('../supabase/migrations/20261121120000_sync_push_devices.sql');
  assert.match(migration, /grant select, insert, update, delete on public\.sync_push_devices to authenticated, service_role;/);
});

test('a Live Activity iOS refuses to start in the background does not abort reconciliation', () => {
  const source = read('../src/lib/live-activity.ts');
  assert.match(source, /try \{\n    id = LiveActivity\.startActivity\(/);
});
