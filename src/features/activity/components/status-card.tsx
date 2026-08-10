import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import { type GradKey } from '../constants';
import { formatElapsed } from '../helpers';

interface StatusCardProps {
  // Big timer: kind of the primary running session, or null when idle.
  primaryKind: string | null;
  gradKey: GradKey | null;
  elapsed: number;
  statusNote: string;
  // Feeding also running alongside the primary session.
  feedingActive: boolean;
}

export function StatusCard({
  primaryKind,
  gradKey,
  elapsed,
  statusNote,
  feedingActive,
}: StatusCardProps) {
  const t = useT();
  const theme = useTheme();
  const { accent } = useActivityColors();

  return (
    <ThemedView
      type="surfaceElevated"
      style={[styles.card, { borderColor: theme.border }]}>
      {primaryKind && gradKey ? (
        <>
          <View style={styles.head}>
            <View style={[styles.dot, { backgroundColor: accent[gradKey] }]} />
            <ThemedText type="smallBold">{t(`kind.${primaryKind}`)}</ThemedText>
            {feedingActive && (
              <View style={[styles.dot, { backgroundColor: accent.feed }]} />
            )}
          </View>
          <ThemedText style={styles.timer}>{formatElapsed(elapsed)}</ThemedText>
          {!!statusNote && (
            <ThemedText type="small" themeColor="textSecondary">
              {statusNote}
            </ThemedText>
          )}
        </>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {t('activity.idle')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.timer}>
            00:00:00
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('activity.chooseBelow')}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.four,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timer: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
