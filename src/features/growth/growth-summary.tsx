import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  formatMeasurementNumber,
  type GrowthMeasurement,
} from '@/lib/growth-measurements';
import { useAppStore, useT } from '@/state/app-state';

interface GrowthSummaryProps {
  measurement: GrowthMeasurement | null;
  onPress: () => void;
}

export function GrowthSummary({ measurement, onPress }: GrowthSummaryProps) {
  const t = useT();
  const language = useAppStore((state) => state.language);
  const height = measurement
    ? formatMeasurementNumber(measurement.heightCm, language)
    : null;
  const weight = measurement
    ? formatMeasurementNumber(measurement.weightKg, language)
    : null;
  const accessibilityLabel = measurement
    ? t('growth.summaryAccessibility', { height: height!, weight: weight! })
    : t('growth.addFirst');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      {measurement ? (
        <View style={styles.values}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
            {weight} {t('unit.kg')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.separator}>
            ·
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
            {height} {t('unit.cm')}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="small" themeColor="primary" style={styles.emptyText}>
          {t('growth.addFirst')}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  separator: {
    fontSize: 11,
    lineHeight: 14,
  },
  emptyText: {
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.65,
  },
});
