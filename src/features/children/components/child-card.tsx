import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { type Child } from '@/lib/children';

import { CHILD_GRADIENT_FG, CHILD_GRADIENTS } from '../constants';
import { BabySvg } from './baby-svg';

const DANGER_COLOR = '#E5484D';

interface ChildCardProps {
  child: Child;
  isActive: boolean;
  onPress: () => void;
  onShare: () => void;
  shareLabel: string;
  onDelete: () => void;
  deleteLabel: string;
}

export function ChildCard({
  child,
  isActive,
  onPress,
  onShare,
  shareLabel,
  onDelete,
  deleteLabel,
}: ChildCardProps) {
  const fg = CHILD_GRADIENT_FG[child.gradientKey];

  const renderDeleteAction = () => (
    <View style={styles.deleteWrap}>
      <Pressable
        accessibilityLabel={deleteLabel}
        onPress={onDelete}
        style={({ pressed }) => [styles.deleteAction, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="trash-can-outline" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={32}
      overshootRight={false}
      renderRightActions={renderDeleteAction}>
      <Pressable
        accessibilityLabel={child.name}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}>
        <LinearGradient
          colors={CHILD_GRADIENTS[child.gradientKey]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}>
          <BabySvg size={40} faceColor={fg} featureColor={CHILD_GRADIENTS[child.gradientKey][1]} />
          <ThemedText style={[styles.name, { color: fg }]} numberOfLines={1}>
            {child.name}
          </ThemedText>
          <Pressable
            accessibilityLabel={shareLabel}
            onPress={onShare}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}>
            <MaterialCommunityIcons name="share-variant" size={22} color={fg} />
          </Pressable>
          <MaterialCommunityIcons
            name={isActive ? 'check-circle' : 'chevron-right'}
            size={26}
            color={fg}
          />
        </LinearGradient>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  deleteWrap: {
    paddingLeft: Spacing.three,
  },
  deleteAction: {
    flex: 1,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.four,
    backgroundColor: DANGER_COLOR,
  },
  pressed: {
    opacity: 0.7,
  },
});
