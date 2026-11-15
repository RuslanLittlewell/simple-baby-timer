import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { breastSideMarker } from '../src/features/calendar/breast-side-marker.ts';
import {
  blockVisibility,
  durationBlockHeight,
  eventBlockHeight,
  eventStripeCount,
  feedingGaps,
  minutesToPixels,
  sessionLayout,
} from '../src/features/calendar/components/timeline-blocks/helpers.ts';

test('breast sides map to compact calendar markers', () => {
  assert.equal(breastSideMarker({ type: 'feeding', mode: 'breast', side: 'left' }), 'L');
  assert.equal(breastSideMarker({ type: 'feeding', mode: 'breast', side: 'right' }), 'R');
  assert.equal(breastSideMarker({ type: 'feeding', mode: 'breast', side: 'both' }), 'RL');
});

test('non-breast and missing details do not produce a marker', () => {
  assert.equal(breastSideMarker({ type: 'feeding', mode: 'bottle' }), null);
  assert.equal(breastSideMarker({ type: 'sleep', place: 'crib' }), null);
  assert.equal(breastSideMarker({ type: 'settling', methods: ['rocking'] }), null);
  assert.equal(breastSideMarker(), null);
});

test('shared block content places the marker between icons and title', () => {
  const contentSource = readFileSync(
    new URL(
      '../src/features/calendar/components/timeline-blocks/block-content.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const completedSource = readFileSync(
    new URL(
      '../src/features/calendar/components/timeline-blocks/completed-block.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const liveSource = readFileSync(
    new URL('../src/features/calendar/components/timeline-blocks/live-blocks.tsx', import.meta.url),
    'utf8',
  );

  const detailIconIndex = contentSource.indexOf('{proIcon &&');
  const markerIndex = contentSource.indexOf('{sideMarker &&');
  const titleIndex = contentSource.indexOf('styles.blockTitle');

  assert.ok(detailIconIndex >= 0);
  assert.ok(markerIndex > detailIconIndex);
  assert.ok(titleIndex > markerIndex);
  assert.match(completedSource, /<BlockContent/);
  assert.match(liveSource, /<BlockContent/);
});

test('completed blocks show a note icon only when saved notes are not blank', () => {
  const contentSource = readFileSync(
    new URL(
      '../src/features/calendar/components/timeline-blocks/block-content.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const completedSource = readFileSync(
    new URL(
      '../src/features/calendar/components/timeline-blocks/completed-block.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(completedSource, /Boolean\(session\.notes\?\.trim\(\)\)/);
  assert.match(completedSource, /hasNotes=\{hasNotes\}/);
  assert.match(contentSource, /hasNotes &&[\s\S]*?name="note-text-outline"/);
});

test('completed bottle volume presentation remains intact', () => {
  const source = readFileSync(
    new URL(
      '../src/features/calendar/components/timeline-blocks/completed-block.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(
    source,
    /session\.kind === ["']feeding["'] && session\.milkMl[\s\S]*?` · \$\{session\.milkMl\} \$\{t\(["']unit\.ml["']\)\}`/,
  );
});

test('breast-side marker uses the same size as calendar icons', () => {
  const contentSource = readFileSync(
    new URL(
      '../src/features/calendar/components/timeline-blocks/block-content.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const stylesSource = readFileSync(
    new URL('../src/features/calendar/components/timeline-blocks/styles.ts', import.meta.url),
    'utf8',
  );

  assert.equal(contentSource.match(/size=\{14\}/g)?.length, 3);
  assert.match(stylesSource, /breastSideMarker:\s*\{\s*fontSize: 14,/);
  assert.match(stylesSource, /blockRow:\s*\{[\s\S]*?alignItems: 'baseline'/);
  assert.doesNotMatch(stylesSource, /breastSideMarker:\s*\{[\s\S]*?translateY/);
});

test('timeline layout clamps sessions to the visible day', () => {
  const dayStart = Date.UTC(2026, 7, 29);
  const layout = sessionLayout(dayStart - 60_000, dayStart + 90 * 60_000, dayStart, 60);

  assert.deepEqual(layout, {
    top: 0,
    spanHeight: 90,
    visibleStart: dayStart,
    visibleEnd: dayStart + 90 * 60_000,
  });
  assert.equal(sessionLayout(dayStart - 120_000, dayStart - 60_000, dayStart, 60), null);
  assert.equal(
    sessionLayout(dayStart + 24 * 60 * 60_000, dayStart + 25 * 60 * 60_000, dayStart, 60),
    null,
  );
});

test('timeline helpers preserve size thresholds and stripe calculation', () => {
  assert.equal(minutesToPixels(30, 60), 30);
  assert.deepEqual(blockVisibility(15), { showText: false, showTime: false });
  assert.deepEqual(blockVisibility(16), { showText: true, showTime: false });
  assert.deepEqual(blockVisibility(34), { showText: true, showTime: true });
  assert.equal(durationBlockHeight(2, 60, 8), 8);
  assert.equal(eventBlockHeight(2, 60, 8), 10);
  assert.equal(eventStripeCount(100, 10, 12), 10);
});

test('event presentation expressions are named before rendering', () => {
  const source = readFileSync(
    new URL('../src/features/calendar/components/timeline-blocks/event-block.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /const iconColor = isNightWaking/);
  assert.match(source, /const stripeSkew = isPoop/);
  assert.match(source, /color=\{iconColor\}/);
  assert.match(source, /skewX: stripeSkew/);
});

test('feeding gaps measure the break between one feeding ending and the next starting', () => {
  const dayStart = new Date(2026, 10, 15).getTime();
  const at = (hours, minutes = 0) => dayStart + (hours * 60 + minutes) * 60_000;

  const gaps = feedingGaps(
    [
      { start: at(12), end: at(12, 20) },
      { start: at(9), end: at(9, 30) },
      // Overlaps the 12:00 feeding, so no gap is drawn between them.
      { start: at(12, 10), end: at(12, 40) },
      { start: at(15), end: at(15, 10) },
    ],
    dayStart,
    60,
  );

  assert.deepEqual(gaps, [
    { from: at(9, 30), to: at(12), top: 570, height: 150 },
    { from: at(12, 40), to: at(15), top: 760, height: 140 },
  ]);
});

test('a feeding gap crossing midnight keeps its full duration and is clipped to the shown day', () => {
  const dayStart = new Date(2026, 10, 15).getTime();
  const at = (hours, minutes = 0) => dayStart + (hours * 60 + minutes) * 60_000;

  const gaps = feedingGaps(
    [
      { start: at(-2), end: at(-1) },
      { start: at(3), end: at(3, 30) },
      { start: at(26), end: at(27) },
      { start: at(30), end: at(31) },
    ],
    dayStart,
    60,
  );

  assert.deepEqual(gaps, [
    { from: at(-1), to: at(3), top: 0, height: 180 },
    { from: at(3, 30), to: at(26), top: 210, height: 1230 },
  ]);
});

test('feedings without a real break between them, or with a single feeding, draw no gap', () => {
  const dayStart = new Date(2026, 10, 15).getTime();
  const at = (hours, minutes = 0) => dayStart + (hours * 60 + minutes) * 60_000;

  assert.deepEqual(feedingGaps([], dayStart, 60), []);
  assert.deepEqual(feedingGaps([{ start: at(9), end: at(9, 30) }], dayStart, 60), []);
  assert.deepEqual(
    feedingGaps(
      [
        { start: at(9), end: at(9, 30) },
        { start: at(9, 30) + 30_000, end: at(10) },
        // Entirely on the next day, so its break is not part of the shown one.
        { start: at(25), end: at(26) },
        { start: at(28), end: at(29) },
      ],
      dayStart,
      60,
    ).map((gap) => [gap.from, gap.to]),
    [[at(10), at(25)]],
  );
});
