import { useIsFocused } from '@react-navigation/native';
import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// Native tabs switch screens instantly (UITabBarController has no transition),
// so the fade is applied to the screen content: every time a tab gains focus
// its content fades in, which reads as a cross-fade between tabs.
export function TabFade({ children }: PropsWithChildren) {
  const focused = useIsFocused();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!focused) return;
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [focused, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.fill, fade]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
