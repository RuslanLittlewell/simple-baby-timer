interface RegimeNoteModalHeightOptions {
  windowHeight: number;
  topInset: number;
  bottomInset: number;
  verticalOuterSpacing: number;
}

export const REGIME_NOTE_MODAL_MAX_HEIGHT = 600;

export function getRegimeNoteModalMaxHeight({
  windowHeight,
  topInset,
  bottomInset,
  verticalOuterSpacing,
}: RegimeNoteModalHeightOptions): number {
  return Math.min(
    REGIME_NOTE_MODAL_MAX_HEIGHT,
    Math.max(
      0,
      windowHeight - topInset - bottomInset - verticalOuterSpacing * 2,
    ),
  );
}
