import Svg, { G, Path, Rect } from 'react-native-svg';

interface FeedingBottleIconProps {
  size?: number;
  color?: string;
}

export function FeedingBottleIcon({ size = 24, color = '#F3C36B' }: FeedingBottleIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round">
      <G transform="rotate(-38 12 12)">
        <Path d="M8.4 7.3c.1-1.3.9-2 2.1-2.5V3.5a1.5 1.5 0 0 1 3 0v1.3c1.2.5 2 1.2 2.1 2.5" />
        <Rect x={7.3} y={7.4} width={9.4} height={2.9} rx={1.2} />
        <Path d="M8.8 10.4v1.1c0 1-.9 1.6-.9 3v4.8a2 2 0 0 0 2 2h4.2a2 2 0 0 0 2-2v-4.8c0-1.4-.9-2-.9-3v-1.1m.7 4.2h-2.7m2.9 3.2h-2" />
      </G>
    </Svg>
  );
}
