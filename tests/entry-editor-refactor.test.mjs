import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildEditableProDetails,
  buildEditedRange,
  editorKindFlags,
  initialEditorValues,
  normalizeMilk,
  sanitizeMilkInput,
  timeInputAsDate,
} from '../src/features/calendar/components/entry-editor/helpers.ts';

test('entry editor initializes every detail branch and bottle volume fallback', () => {
  const start = new Date(2026, 7, 29, 9).getTime();
  const end = new Date(2026, 7, 29, 9, 30).getTime();
  const bottle = initialEditorValues({
    kind: 'feeding',
    start,
    end,
    proDetails: { type: 'feeding', mode: 'bottle', content: undefined, volumeMl: 80 },
  });
  assert.equal(bottle.startInput, '09:00');
  assert.equal(bottle.endInput, '09:30');
  assert.equal(bottle.feedingMode, 'bottle');
  assert.equal(bottle.bottleContent, 'formula');
  assert.equal(bottle.milkInput, '80');
  assert.equal(initialEditorValues({ ...{ kind: 'feeding', start, end }, milkMl: 120 }).milkInput, '120');
  assert.deepEqual(
    initialEditorValues({
      kind: 'settling',
      start,
      end,
      proDetails: { type: 'settling', methods: ['rocking'] },
    }).settlingMethods,
    ['rocking'],
  );
  assert.equal(
    initialEditorValues({
      kind: 'sleep',
      start,
      end,
      proDetails: { type: 'sleep', place: 'stroller' },
    }).sleepPlace,
    'stroller',
  );
});

test('entry editor flags and wheel conversion preserve kind behavior', () => {
  assert.deepEqual(editorKindFlags('poop'), {
    editingEvent: true,
    editingDay: false,
    editableProKind: null,
  });
  assert.deepEqual(editorKindFlags('sleep'), {
    editingEvent: false,
    editingDay: true,
    editableProKind: 'sleep',
  });
  const time = timeInputAsDate('06:45', new Date(2026, 7, 29, 15));
  assert.equal(time.getHours(), 6);
  assert.equal(time.getMinutes(), 45);
});

test('entry editor builds day, overnight, and fixed-duration ranges', () => {
  const original = new Date(2026, 7, 29, 10).getTime();
  const nextDay = new Date(2026, 7, 30).getTime();
  const dayRange = buildEditedRange({
    kind: 'sleep',
    originalStart: original,
    startInput: '23:00',
    endInput: '01:00',
    startDayMs: new Date(2026, 7, 29).getTime(),
    endDayMs: nextDay,
    eventDurationMs: 0,
  });
  assert.deepEqual(dayRange.range, {
    start: new Date(2026, 7, 29, 23).getTime(),
    end: new Date(2026, 7, 30, 1).getTime(),
  });

  const overnight = buildEditedRange({
    kind: 'feeding',
    originalStart: original,
    startInput: '23:00',
    endInput: '01:00',
    startDayMs: 0,
    endDayMs: 0,
    eventDurationMs: 0,
  });
  assert.equal(overnight.range?.end, new Date(2026, 7, 30, 1).getTime());

  const event = buildEditedRange({
    kind: 'poop',
    originalStart: original,
    startInput: '08:00',
    endInput: 'bad',
    startDayMs: 0,
    endDayMs: 0,
    eventDurationMs: 10 * 60_000,
  });
  assert.equal((event.range?.end ?? 0) - (event.range?.start ?? 0), 10 * 60_000);
});

test('entry editor validates milk and rebuilds pro details', () => {
  assert.equal(sanitizeMilkInput('12a3'), '123');
  assert.deepEqual(normalizeMilk('feeding', '5001'), { milkMl: 5001, error: 'range' });
  assert.deepEqual(normalizeMilk('feeding', '120'), { milkMl: 120, error: null });
  assert.deepEqual(normalizeMilk('sleep', '120'), { milkMl: undefined, error: null });
  const values = {
    startInput: '',
    endInput: '',
    startDayMs: 0,
    endDayMs: 0,
    milkInput: '90',
    settlingMethods: ['rocking'],
    sleepPlace: 'crib',
    feedingMode: 'bottle',
    breastSide: 'left',
    bottleContent: 'formula',
  };
  assert.deepEqual(buildEditableProDetails('feeding', values), {
    type: 'feeding',
    mode: 'bottle',
    content: 'formula',
    volumeMl: 90,
  });
  assert.deepEqual(buildEditableProDetails('settling', values), {
    type: 'settling',
    methods: ['rocking'],
  });
});

test('entry editor keeps stable exports, focused ownership, and side-effect ordering', () => {
  const folder = new URL('../src/features/calendar/components/entry-editor/', import.meta.url);
  const indexSource = readFileSync(new URL('index.ts', folder), 'utf8');
  const modalSource = readFileSync(new URL('entry-editor.tsx', folder), 'utf8');
  const hookSource = readFileSync(new URL('use-entry-editor-form.ts', folder), 'utf8');
  assert.match(indexSource, /export \{ EntryEditor \}/);
  for (const component of ['EditorHeader', 'EditableProSection', 'ReadonlyProSection', 'EditorTimeFields', 'MilkField', 'SaveButton']) {
    assert.match(modalSource, new RegExp(`<${component}`));
  }
  assert.match(modalSource, /props\.proActive \?/);
  assert.match(hookSource, /props\.proActive[\s\S]*?buildEditableProDetails[\s\S]*?: entry\.proDetails/);

  const saveSource = hookSource.slice(hookSource.indexOf('const saveEntry'), hookSource.indexOf('const confirmDelete'));
  assert.ok(saveSource.indexOf('await updateSession') < saveSource.indexOf('enqueueSessionUpsert'));
  assert.ok(saveSource.indexOf('enqueueSessionUpsert') < saveSource.indexOf('await props.onChanged'));
  assert.ok(saveSource.indexOf('await props.onChanged') < saveSource.indexOf('props.onClose'));
  const deleteSource = hookSource.slice(hookSource.indexOf('const confirmDelete'));
  assert.ok(deleteSource.indexOf('await deleteSession') < deleteSource.indexOf('enqueueSessionDelete'));
  assert.ok(deleteSource.indexOf('enqueueSessionDelete') < deleteSource.indexOf('await props.onChanged'));
  assert.equal(existsSync(new URL('../src/features/calendar/components/entry-editor.tsx', import.meta.url)), false);
});
