import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';

import { type GradKey, type IconName } from '../constants';

interface ActivityRowProps {
  icon: IconName;
  gradKey: GradKey;
  label: string;
  isActive: boolean;
  dimmed?: boolean;
  onPress: () => void;
}

export function ActivityRow({ icon, gradKey, label, isActive, dimmed, onPress }: ActivityRowProps) {
  const fg = ACTIVITY_FG[gradKey];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={ACTIVITY_GRADIENTS[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.row, dimmed && styles.rowDimmed]}>
        <MaterialCommunityIcons name={icon} size={26} color={fg} />
        <ThemedText style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </ThemedText>
        <MaterialCommunityIcons
          name={isActive ? 'stop-circle' : 'play-circle'}
          size={28}
          color={fg}
        />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  rowDimmed: {
    opacity: 0.45,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
