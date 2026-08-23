import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import { type RegimeSummary } from '../types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;



const DROP_PHRASES = [
  'Обычно около ', 'Usually about ', 'Zwykle około ', 'Normalmente unas ', 'Habituellement environ ',
  '; индивидуальный разброс большой', '; wide individual variation', '; duże różnice indywidualne',
  '; gran variación individual', ' ; grande variation individuelle',
  ', включая дневной сон', ', including daytime sleep', ', wliczając sen dzienny',
  ', incluido el sueño diurno', ', sieste comprise',
];

const clean = (value: string) => {
  let out = value;
  for (const phrase of DROP_PHRASES) out = out.split(phrase).join('');
  return out.replace(/\s*[;,]\s*$/, '').trim();
};

interface RegimeSummaryCardProps {
  summary: RegimeSummary;
}

export function RegimeSummaryCard({ summary }: RegimeSummaryCardProps) {
  const theme = useTheme();
  const t = useT();

  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: 'sleep', label: t('regimes.sleep24'), value: clean(summary.sleep24) },
    { icon: 'timer-sand', label: t('regimes.wakeWindow'), value: clean(summary.wakeWindow) },
    { icon: 'weather-night', label: t('regimes.nightSleep'), value: clean(summary.nightSleep) },
    { icon: 'white-balance-sunny', label: t('regimes.wakeUp'), value: clean(summary.wakeUp) },
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.row}>
          <MaterialCommunityIcons name={fact.icon} size={18} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {fact.label}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.value}>
            {fact.value}
          </ThemedText>
        </View>
      ))}
      {!!summary.features && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.features}>
          {summary.features}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    width: 128,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  features: {
    marginTop: Spacing.one,
    lineHeight: 19,
  },
});
