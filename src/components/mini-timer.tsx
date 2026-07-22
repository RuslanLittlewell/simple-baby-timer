import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_ACCENT } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type ActivityKind } from '@/lib/notifications';
import { useAppStore } from '@/state/app-state';

type Meta = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accentKey: keyof typeof ACTIVITY_ACCENT;
};

const META: Record<ActivityKind, Meta> = {
  sleep: { icon: 'moon-waning-crescent', accentKey: 'sleep' },
  feeding: { icon: 'baby-bottle-outline', accentKey: 'feed' },
  awake: { icon: 'white-balance-sunny', accentKey: 'awake' },
};

const BASE_TOP = 72;
const BASE_LEFT = 16;

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmt = (s: number) =>
  `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;

export function MiniTimer() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  // Кормление идёт параллельно основному режиму — в пилюле показываем обе дорожки.
  const running = [session, feeding].filter((item) => item !== null);

  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!session && !feeding) return;
    setNowTs(Date.now());
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session, feeding]);

  // Перетаскивание.
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const cardW = useSharedValue(0);
  const cardH = useSharedValue(0);
  const positioned = useRef(false);
  const screen = Dimensions.get('window');

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      const nx = startX.value + e.translationX;
      const ny = startY.value + e.translationY;
      const minX = 8 - BASE_LEFT;
      const maxX = screen.width - cardW.value - 8 - BASE_LEFT;
      const minY = 8 - BASE_TOP;
      const maxY = screen.height - cardH.value - 100 - BASE_TOP;
      tx.value = Math.min(Math.max(nx, minX), maxX);
      ty.value = Math.min(Math.max(ny, minY), maxY);
    });

  const goHome = () => router.navigate('/');
  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(goHome)();
  });
  const gesture = Gesture.Race(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  // Показываем, только когда идёт активность и мы НЕ на вкладке «Активность».
  if (running.length === 0 || pathname === '/') return null;

  return (
    <Animated.View
      style={[styles.wrap, animStyle]}
      onLayout={(e) => {
        cardW.value = e.nativeEvent.layout.width;
        cardH.value = e.nativeEvent.layout.height;
        // Стартовое положение — вверху справа (один раз, после первого замера).
        if (!positioned.current && cardW.value > 0) {
          positioned.current = true;
          tx.value = screen.width - cardW.value - 8 - BASE_LEFT;
        }
      }}>
      <GestureDetector gesture={gesture}>
        <ThemedView type="backgroundElement" style={styles.card}>
          {running.map((item) => {
            const meta = META[item.kind];
            const elapsed = Math.max(0, Math.floor((nowTs - item.startedAt) / 1000));
            return (
              <View key={item.kind} style={styles.line}>
                <View style={[styles.dot, { backgroundColor: ACTIVITY_ACCENT[meta.accentKey] }]} />
                <MaterialCommunityIcons name={meta.icon} size={20} color={theme.text} />
                <ThemedText style={styles.time}>{fmt(elapsed)}</ThemedText>
              </View>
            );
          })}
        </ThemedView>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: BASE_TOP,
    left: BASE_LEFT,
    zIndex: 1000,
  },
  card: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
