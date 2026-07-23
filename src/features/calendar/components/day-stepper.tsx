import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { pad2, shiftDayMs, type Translate } from '../helpers';

export const DayStepper = memo(function DayStepper({
  dayMs,
  weekdays,
  textColor,
  backgroundColor,
  onChange,
  t,
}: {
  dayMs: number;
  weekdays: readonly string[];
  textColor: string;
  backgroundColor: string;
  onChange: (next: number) => void;
  t: Translate;
}) {
  const d = new Date(dayMs);
  const label = `${weekdays[(d.getDay() + 6) % 7]}, ${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
  return (
    <View style={[styles.stepper, { backgroundColor }]}>
      <Pressable
        accessibilityLabel={t('editor.prevDay')}
        onPress={() => onChange(shiftDayMs(dayMs, -1))}
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}>
        <MaterialCommunityIcons name="chevron-left" size={22} color={textColor} />
      </Pressable>
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
      <Pressable
        accessibilityLabel={t('editor.nextDay')}
        onPress={() => onChange(shiftDayMs(dayMs, 1))}
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}>
        <MaterialCommunityIcons name="chevron-right" size={22} color={textColor} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    marginTop: Spacing.one,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.5,
  },
});
