import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildProDetails, buildTimeRange } from '../src/features/calendar/components/add-activity-modal/helpers.ts';
import {
  buildEditedRange,
  editorKindFlags,
  initialEditorValues,
} from '../src/features/calendar/components/entry-editor/helpers.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('a custom event spans the days the user picked', () => {
  const startDayMs = new Date(2026, 8, 24).getTime();
  const endDayMs = new Date(2026, 8, 26).getTime();
  const added = buildTimeRange({
    startInput: '16:00',
    endInput: '10:00',
    startDayMs,
    endDayMs,
    eventKind: false,
    eventDurationMs: 0,
  });
  assert.deepEqual(added.range, {
    start: new Date(2026, 8, 24, 16).getTime(),
    end: new Date(2026, 8, 26, 10).getTime(),
  });

  assert.deepEqual(editorKindFlags('custom'), {
    editingEvent: false,
    editingDay: true,
    editableProKind: null,
  });
  const edited = buildEditedRange({
    kind: 'custom',
    originalStart: added.range.start,
    startInput: '08:00',
    endInput: '09:00',
    startDayMs: endDayMs,
    endDayMs,
    eventDurationMs: 0,
  });
  assert.deepEqual(edited.range, {
    start: new Date(2026, 8, 26, 8).getTime(),
    end: new Date(2026, 8, 26, 9).getTime(),
  });
});

test('a custom event carries its title and no pro details', () => {
  const values = initialEditorValues({
    kind: 'custom',
    start: new Date(2026, 8, 24, 16).getTime(),
    end: new Date(2026, 8, 24, 18).getTime(),
    title: 'Vaccination',
  });
  assert.equal(values.titleInput, 'Vaccination');
  assert.equal(
    buildProDetails({
      proActive: true,
      kind: 'custom',
      eventKind: false,
      settlingMethods: [],
      sleepPlace: 'crib',
      feedingMode: 'bottle',
      breastSide: 'left',
      bottleContent: 'formula',
      bottleVolume: 120,
    }),
    undefined,
  );
});

test('custom events sit beneath every record and are offered in the manual menu', () => {
  const constants = read('../src/features/calendar/constants.ts');
  const zIndex = Object.fromEntries(
    [...constants.matchAll(/^\s+(\w+): (\d+),$/gm)]
      .filter(([, key]) => ['grid', 'custom', 'live', 'completed', 'event', 'ghost', 'now'].includes(key))
      .map(([, key, value]) => [key, Number(value)]),
  );
  for (const layer of ['live', 'completed', 'event', 'ghost', 'now']) {
    assert.ok(zIndex.custom < zIndex[layer], layer);
  }
  // Feeding sits one above events and must stay below the plan.
  assert.ok(zIndex.event + 1 < zIndex.ghost);
  assert.match(constants, /custom: \{ gradKey: 'custom', icon: 'exclamation-thick' \}/);
  assert.match(constants, /MANUAL_KINDS[\s\S]*'custom'/);

  const colors = read('../src/constants/activities.ts');
  // Both themes of the shared palette, plus the calendar's own light palette.
  assert.equal((colors.match(/custom: \['#FFFFFF', '#FFFFFF'\]/g) ?? []).length, 3);
});

test('custom event titles persist locally, sync to the cloud, and stay localized', () => {
  const activityStore = read('../src/lib/activity-store.ts');
  const sync = read('../src/lib/sync.ts');
  const schema = read('../supabase/schema.sql');
  const migration = read('../supabase/migrations/20260924120000_session_title.sql');
  const i18n = read('../src/i18n/index.ts');

  assert.match(activityStore, /title\?: string/);
  assert.match(sync, /title: row\.title \?\? undefined/);
  assert.match(sync, /title: op\.session\.title \?\? null/);
  assert.match(sync, /\.filter\(\(row\) => isSessionKind\(row\.kind\)\)/);
  assert.match(schema, /alter table public\.sessions add column if not exists title text/);
  assert.match(migration, /add column if not exists title text/);
  for (const key of ['kind.custom', 'editor.eventTitle', 'editor.eventTitlePlaceholder', 'editor.errTitleRequired']) {
    assert.equal((i18n.match(new RegExp(`'${key.replace('.', '\\.')}':`, 'g')) ?? []).length, 9, key);
  }
});
