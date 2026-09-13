import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { type SessionKind } from '@/lib/activity-store';

import { KIND_META, MANUAL_KINDS } from '../constants';
import { type Translate } from '../helpers';

const HEADER_ACTION_WIDTH = 34;
const ITEM_SIZE = 44;
const ITEM_STEP = ITEM_SIZE + Spacing.two;
/** How far above its resting place an icon starts, so every icon drops out of the + button. */
const ITEM_DROP = ITEM_SIZE;
const STAGGER = 0.07;
const ITEM_SPAN = 1 - (MANUAL_KINDS.length - 1) * STAGGER;
const OPEN_DURATION_MS = 460;
const CLOSE_DURATION_MS = 220;
const TOGGLE_DURATION_MS = 200;
const BOUNCE = 1.6;

/** Ease-out-back: overshoots a little and settles exactly on 1, so icons land evenly spaced. */
function bounceOut(x: number) {
  'worklet';
  const t = x - 1;
  return 1 + (BOUNCE + 1) * t * t * t + BOUNCE * t * t;
}

interface ManualAddToggleIconProps {
  open: boolean;
  color: string;
}

/** The header + turns into a × while the menu is open. */
export function ManualAddToggleIcon({ open, color }: ManualAddToggleIconProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(open ? 45 : 0, { duration: TOGGLE_DURATION_MS });
  }, [open, rotation]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View style={style}>
      <MaterialCommunityIcons name="plus" size={24} color={color} />
    </Animated.View>
  );
}

interface ManualAddItemProps {
  kind: SessionKind;
  index: number;
  progress: SharedValue<number>;
  label: string;
  onPress: () => void;
}

function ManualAddItem({ kind, index, progress, label, onPress }: ManualAddItemProps) {
  const { gradients, fg, accent } = useActivityColors();
  const { gradKey, icon } = KIND_META[kind];

  const style = useAnimatedStyle(() => {
    // Each icon runs its own slice of the shared progress, one after another.
    const local = Math.min(1, Math.max(0, (progress.value - index * STAGGER) / ITEM_SPAN));
    const eased = bounceOut(local);
    return {
      opacity: interpolate(local, [0, 0.6], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: (1 - eased) * -(index * ITEM_STEP + ITEM_DROP) },
        { scale: 0.4 + 0.6 * eased },
      ],
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.itemButton, { borderColor: accent[gradKey] }, pressed && styles.pressed]}>
        <LinearGradient
          colors={gradients[gradKey]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <MaterialCommunityIcons name={icon} size={22} color={fg[gradKey]} />
      </Pressable>
    </Animated.View>
  );
}

interface ManualAddMenuProps {
  open: boolean;
  /** Where the header ends, so the icons hang right under the + button. */
  top: number;
  closeLabel: string;
  t: Translate;
  onSelect: (kind: SessionKind) => void;
  onClose: () => void;
}

export function ManualAddMenu({ open, top, closeLabel, t, onSelect, onClose }: ManualAddMenuProps) {
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, { duration: OPEN_DURATION_MS, easing: Easing.linear });
      return;
    }
    progress.value = withTiming(0, { duration: CLOSE_DURATION_MS, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [open, progress]);

  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View pointerEvents="none" style={[styles.dim, { top }, dimStyle]} />
      <Pressable accessibilityLabel={closeLabel} style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.column, { top: top + Spacing.two }]}>
        {MANUAL_KINDS.map((kind, index) => (
          <ManualAddItem
            key={kind}
            kind={kind}
            index={index}
            progress={progress}
            label={t(`kind.${kind}`)}
            onPress={() => onSelect(kind)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  dim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  column: {
    position: 'absolute',
    right: Spacing.four + HEADER_ACTION_WIDTH / 2 - ITEM_SIZE / 2,
    gap: Spacing.two,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  itemButton: {
    flex: 1,
    borderRadius: ITEM_SIZE / 2,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
