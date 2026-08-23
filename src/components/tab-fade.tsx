import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';




export function TabFade({ children }: PropsWithChildren) {
  return <Animated.View style={styles.fill}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
