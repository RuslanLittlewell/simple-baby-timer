import { LinearGradient } from 'expo-linear-gradient';
import { View, type ViewProps } from 'react-native';

import { BackgroundGradient, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/app-state';

export interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  
  
  gradient?: boolean;
}

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  gradient,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();
  const mode = useAppStore((state) => state.themeMode);

  if (gradient) {
    const { colors, locations } = BackgroundGradient[mode];
    return (
      <LinearGradient
        colors={colors}
        locations={locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={style}
        {...otherProps}
      />
    );
  }

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
