import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  REGIME_NOTE_MODAL_MAX_HEIGHT,
  getRegimeNoteModalMaxHeight,
} from '../src/features/regimes/components/regime-note-modal.helpers.ts';

const maxHeight = (windowHeight, topInset, bottomInset, verticalOuterSpacing = 24) =>
  getRegimeNoteModalMaxHeight({
    windowHeight,
    topInset,
    bottomInset,
    verticalOuterSpacing,
  });

test('iPhone 8 viewport reserves safe area and outer spacing', () => {
  assert.equal(maxHeight(667, 20, 0), 599);
});

test('iPhone 17 and other tall viewports use the explicit height cap', () => {
  assert.equal(REGIME_NOTE_MODAL_MAX_HEIGHT, 600);
  assert.equal(maxHeight(874, 59, 34), 600);
  assert.equal(maxHeight(844, 47, 34), 600);
});

test('rotated compact viewports still use their smaller available height', () => {
  assert.equal(maxHeight(375, 0, 21), 306);
});

test('modal height never becomes negative on an extremely small viewport', () => {
  assert.equal(maxHeight(40, 20, 20), 0);
});

test('modal applies a live maximum height while preserving natural card height', () => {
  const source = readFileSync(
    new URL('../src/features/regimes/components/regime-note-modal.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /useWindowDimensions\(\)/);
  assert.match(source, /useSafeAreaInsets\(\)/);
  assert.match(source, /maxHeight: maxCardHeight/);
  assert.doesNotMatch(source, /height: maxCardHeight/);
  assert.doesNotMatch(source, /maxHeight: ['"]82%['"]/);
});

test('long content scrolls inside the constrained card with a visible indicator', () => {
  const source = readFileSync(
    new URL('../src/features/regimes/components/regime-note-modal.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /<ScrollView\s+style=\{styles\.scrollView\}/);
  assert.match(source, /showsVerticalScrollIndicator>/);
  assert.doesNotMatch(source, /showsVerticalScrollIndicator=\{false\}/);
  assert.match(source, /scrollView:\s*\{\s*flexShrink: 1/);
  // flexShrink is inert against a flex item's automatic minimum size, so the
  // scroll container only shrinks inside the capped card once this is explicit.
  assert.match(source, /scrollView:[\s\S]*?minHeight: 0/);
  assert.match(source, /<Modal[^>]+onRequestClose=\{onClose\}/);
  // The dismiss layer must be a sibling drawn after the blur: as the backdrop's
  // parent it sat underneath the blur, which swallowed every outside tap.
  const blurIndex = source.indexOf('<BlurView');
  const dismissIndex = source.indexOf('<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />');
  const cardIndex = source.indexOf('styles.card,');
  assert.ok(blurIndex > 0 && dismissIndex > blurIndex && cardIndex > dismissIndex);
  assert.doesNotMatch(source, /<Pressable style=\{styles\.backdrop\} onPress=\{onClose\}>/);
});

test('shared guidance appears between the general note and the games', () => {
  const source = readFileSync(
    new URL('../src/features/regimes/components/regime-note-modal.tsx', import.meta.url),
    'utf8',
  );

  const noteIndex = source.indexOf('step.note ||');
  const guidanceIndex = source.indexOf('step.developmentalGamesGuidance');
  const gamesIndex = source.indexOf('step.games.map');
  assert.ok(noteIndex > 0 && guidanceIndex > noteIndex && gamesIndex > guidanceIndex);
});
