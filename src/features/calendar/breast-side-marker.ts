export type BreastSideMarker = 'L' | 'R' | 'RL';

type MarkerDetails = {
  type: string;
  mode?: string;
  side?: string;
};

export function breastSideMarker(details?: MarkerDetails): BreastSideMarker | null {
  if (!details || details.type !== 'feeding' || details.mode !== 'breast') return null;

  const markers: Record<string, BreastSideMarker> = {
    left: 'L',
    right: 'R',
    both: 'RL',
  };
  return details.side ? (markers[details.side] ?? null) : null;
}
