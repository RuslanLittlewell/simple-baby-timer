import { useCallback, useMemo, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { DEFAULT_ZOOM, SCROLL_BOTTOM_PAD, ZOOM_MODES, ZOOM_STEP_RATIO } from './constants';

export function usePinchZoom() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const zoomRef = useRef(zoom);

  const [pinching, setPinching] = useState(false);
  // Applied via the contentOffset prop so the scroll correction lands in the
  // same commit as the new timeline height — a scrollTo against the not-yet
  // resized content gets clamped by the native side and flashes wrong hours.
  const [pinchOffset, setPinchOffset] = useState<{ x: number; y: number } | null>(null);
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const pendingScrollY = useRef<number | null>(null);
  const pinchAnchor = useRef({ hour: 0, screenY: 0 });
  const pinchRefScale = useRef(1);

  const beginPinch = useCallback((focalY: number) => {
    const base = ZOOM_MODES[zoomRef.current].hourHeight;
    pinchAnchor.current = { hour: (scrollY.current + focalY) / base, screenY: focalY };
    pinchRefScale.current = 1;
    setPinching(true);
  }, []);

  const applyPinch = useCallback((scale: number) => {
    const ratio = scale / pinchRefScale.current;
    const crossed = ratio >= ZOOM_STEP_RATIO || ratio <= 1 / ZOOM_STEP_RATIO;
    if (!crossed) return;

    const current = zoomRef.current;
    const next = Math.min(
      ZOOM_MODES.length - 1,
      Math.max(0, current + (ratio >= ZOOM_STEP_RATIO ? 1 : -1)),
    );
    pinchRefScale.current = scale;
    if (next === current) return;
    zoomRef.current = next;

    const height = ZOOM_MODES[next].hourHeight;
    const { hour, screenY } = pinchAnchor.current;
    const maxScroll = Math.max(0, 24 * height + SCROLL_BOTTOM_PAD - viewportHeight.current);
    const target = Math.min(maxScroll, Math.max(0, hour * height - screenY));
    pendingScrollY.current = target;
    scrollY.current = target;
    // Batched with setZoom: offset and new content height land in one commit.
    setZoom(next);
    setPinchOffset({ x: 0, y: target });
  }, []);

  const endPinch = useCallback(() => setPinching(false), []);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart((e) => {
          'worklet';
          runOnJS(beginPinch)(e.focalY);
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(applyPinch)(e.scale);
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(endPinch)();
        }),
    [beginPinch, applyPinch, endPinch],
  );

  const clearPinchOffset = useCallback(() => setPinchOffset(null), []);

  const { step: gridStep, hourHeight } = ZOOM_MODES[zoom];

  return {
    zoom,
    gridStep,
    hourHeight,
    pinching,
    pinchOffset,
    clearPinchOffset,
    pinchGesture,
    scrollY,
    viewportHeight,
    pendingScrollY,
  };
}
