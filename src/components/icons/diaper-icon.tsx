import Svg, { Path } from 'react-native-svg';

interface DiaperIconProps {
  size?: number;
  color?: string;
}

export function DiaperIcon({ size = 24, color = '#D2D7E3' }: DiaperIconProps) {
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
      <Path d="M3 6.5Q3 5 4.5 5h15Q21 5 21 6.5v3c0 5.9-3.6 10-9 10s-9-4.1-9-10z" />
      <Path d="M3.1 8.9h3.6m10.6 0h3.6M3.5 12c3.6.1 6 2.7 6.3 7.2m10.7-7.2c-3.6.1-6 2.7-6.3 7.2" />
    </Svg>
  );
}
