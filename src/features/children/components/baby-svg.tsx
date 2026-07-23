import Svg, { Circle, Path } from 'react-native-svg';

interface BabySvgProps {
  size?: number;
  faceColor?: string;
  featureColor?: string;
}

// Simple baby face: head with ears, a hair curl, eyes, cheeks and a smile.
export function BabySvg({
  size = 56,
  faceColor = '#FFFFFF',
  featureColor = '#2E3138',
}: BabySvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={11} cy={36} r={5} fill={faceColor} />
      <Circle cx={53} cy={36} r={5} fill={faceColor} />
      <Circle cx={32} cy={36} r={21} fill={faceColor} />
      <Path
        d="M32 15 C 31 8, 38 6, 41 10"
        stroke={featureColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={25} cy={34} r={2.6} fill={featureColor} />
      <Circle cx={39} cy={34} r={2.6} fill={featureColor} />
      <Circle cx={19} cy={41} r={3.2} fill={featureColor} opacity={0.14} />
      <Circle cx={45} cy={41} r={3.2} fill={featureColor} opacity={0.14} />
      <Path
        d="M26 43 Q 32 49, 38 43"
        stroke={featureColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
