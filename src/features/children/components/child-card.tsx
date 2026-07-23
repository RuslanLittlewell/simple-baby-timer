import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { type Child } from '@/lib/children';

import { CHILD_GRADIENT_FG, CHILD_GRADIENTS } from '../constants';
import { BabySvg } from './baby-svg';

interface ChildCardProps {
  child: Child;
  isActive: boolean;
  onPress: () => void;
}

export function ChildCard({ child, isActive, onPress }: ChildCardProps) {
  const fg = CHILD_GRADIENT_FG[child.gradientKey];

  return (
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
        <MaterialCommunityIcons
          name={isActive ? 'check-circle' : 'chevron-right'}
          size={26}
          color={fg}
        />
      </LinearGradient>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
});
