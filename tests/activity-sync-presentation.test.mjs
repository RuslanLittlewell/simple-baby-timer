import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { activitySyncPresentation } from "../src/features/activity/activity-sync-presentation.ts";
import {
  LOADER_DURATION_MS,
  breathe,
  meridianPath,
  meridianPhase,
  pulse,
  rotationMatrix,
} from "../src/features/activity/components/activity-sync-loader/helpers.ts";

test("syncing shows the header loader and disables only activity actions", () => {
  assert.deepEqual(activitySyncPresentation(true), {
    showHeaderIndicator: true,
    activityActionsDisabled: true,
    nonActivityControlsDisabled: false,
  });
});

test("terminal sync state removes the loader and restores activity actions", () => {
  assert.deepEqual(activitySyncPresentation(false), {
    showHeaderIndicator: false,
    activityActionsDisabled: false,
    nonActivityControlsDisabled: false,
  });
});

test("sync loader is centered over activity actions outside the header", () => {
  const screenSource = readFileSync(
    new URL("../src/features/activity/activity-screen/activity-screen.tsx", import.meta.url),
    "utf8",
  );
  const stylesSource = readFileSync(
    new URL("../src/features/activity/activity-screen/styles.ts", import.meta.url),
    "utf8",
  );
  const loaderSource = readFileSync(
    new URL(
      "../src/features/activity/components/activity-sync-loader/activity-actions-sync-loader.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const loaderStylesSource = readFileSync(
    new URL(
      "../src/features/activity/components/activity-sync-loader/styles.ts",
      import.meta.url,
    ),
    "utf8",
  );

  const loaderIndex = screenSource.indexOf("<ActivityActionsSyncLoader");
  const actionsIndex = screenSource.indexOf("styles.activityActionsRegion");
  const headerStart = screenSource.indexOf("style={[styles.header");
  const headerEnd = screenSource.indexOf("</View>", headerStart);

  assert.ok(actionsIndex > 0 && loaderIndex > actionsIndex);
  assert.ok(headerStart > 0 && headerEnd > headerStart);
  assert.equal(
    screenSource.slice(headerStart, headerEnd).includes("ActivitySyncIndicator"),
    false,
  );
  assert.match(stylesSource, /activityActionsRegion:\s*\{\s*position: "relative"/);
  assert.match(loaderSource, /pointerEvents="none"/);
  assert.match(loaderStylesSource, /overlay:\s*\{\s*position: "absolute"/);
  assert.match(loaderStylesSource, /left: "50%"/);
  assert.match(loaderStylesSource, /top: "50%"/);
  assert.match(loaderStylesSource, /width: LOADER_WIDTH/);
  assert.match(loaderStylesSource, /height: LOADER_HEIGHT/);
  assert.match(loaderStylesSource, /translateX: -LOADER_WIDTH \/ 2/);
  assert.match(loaderStylesSource, /translateY: -LOADER_HEIGHT \/ 2/);
  assert.doesNotMatch(stylesSource, /syncIndicatorSlot/);
});

test("sync loader reproduces the source orb's three-second cycle", () => {
  assert.equal(LOADER_DURATION_MS, 3000);

  // The meridians sweep from the upper half of the cage, through a flat line,
  // out to the lower half - the signature move of the source animation.
  assert.equal(meridianPhase(0), -1);
  assert.equal(meridianPhase(0.5), 0);
  assert.equal(meridianPhase(1), 1);

  assert.equal(
    meridianPath(-1),
    "M200 0C200 -110.45695 110.45695 -200 0 -200C-110.45695 -200 -200 -110.45695 -200 0",
  );
  assert.equal(
    meridianPath(0),
    "M200 0C200 0 110.45695 0 0 0C-110.45695 0 -200 0 -200 0",
  );
  // Where the cycle ends is where a half-turn puts the pose it started from, so
  // the loop closes on itself with no visible seam.
  assert.equal(
    meridianPath(1),
    "M200 0C200 110.45695 110.45695 200 0 200C-110.45695 200 -200 110.45695 -200 0",
  );
});

test("sync loader breathing and rotation close seamlessly", () => {
  assert.equal(pulse(0), 0);
  assert.equal(pulse(1), 0);
  assert.equal(pulse(0.5), 1);

  assert.equal(breathe(0, 0.9), 1);
  assert.equal(breathe(0.5, 0.9), 0.9);
  assert.equal(breathe(1, 0.9), 1);

  assert.deepEqual(rotationMatrix(0), [1, 0, -0, 1, 0, 0]);
  assert.deepEqual(
    rotationMatrix(180).map((value) => Math.round(value)),
    [-1, 0, -0, -1, 0, 0],
  );
});

test("sync loader stacks the cage behind and in front of the orb", () => {
  const indicatorSource = readFileSync(
    new URL(
      "../src/features/activity/components/activity-sync-loader/activity-sync-indicator.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const artworkSource = readFileSync(
    new URL(
      "../src/features/activity/components/activity-sync-loader/artwork.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  const backIndex = indicatorSource.indexOf("<BackMeridiansArtwork");
  const coreIndex = indicatorSource.indexOf("<CoreArtwork");
  const frontIndex = indicatorSource.indexOf("<FrontRingsArtwork");

  assert.ok(backIndex > 0 && coreIndex > backIndex && frontIndex > coreIndex);
  // The front pair runs the sweep inverted, so the cage reads as one solid shape.
  assert.match(artworkSource, /meridianPath\(-meridianPhase\(progress\.value\)\)/);
  assert.match(indicatorSource, /withRepeat\(/);
  assert.match(indicatorSource, /\n\s+-1,\n\s+false,/);
});
