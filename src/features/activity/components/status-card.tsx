import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_ACCENT } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { useT } from '@/state/app-state';

import { type GradKey } from '../constants';
import { formatElapsed } from '../helpers';

interface StatusCardProps {
  // Big timer: kind of the primary running session, or null when idle.
  primaryKind: string | null;
  gradKey: GradKey | null;
  elapsed: number;
  statusNote: string;
  // Secondary feeding line when it runs alongside a main session.
  feedingElapsed: number | null;
}

export function StatusCard({
  primaryKind,
  gradKey,
  elapsed,
  statusNote,
  feedingElapsed,
}: StatusCardProps) {
  const t = useT();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {primaryKind && gradKey ? (
        <>
          <View style={styles.head}>
            <View style={[styles.dot, { backgroundColor: ACTIVITY_ACCENT[gradKey] }]} />
            <ThemedText type="smallBold">{t(`kind.${primaryKind}`)}</ThemedText>
          </View>
          <ThemedText style={styles.timer}>{formatElapsed(elapsed)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {statusNote}
          </ThemedText>
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

      {feedingElapsed !== null && (
        <View style={styles.secondary}>
          <MaterialCommunityIcons
            name="baby-bottle-outline"
            size={18}
            color={ACTIVITY_ACCENT.feed}
          />
          <ThemedText type="smallBold" style={styles.secondaryLabel}>
            {t('kind.feeding')}
          </ThemedText>
          <ThemedText style={styles.secondaryTimer}>{formatElapsed(feedingElapsed)}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.four,
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
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  secondaryLabel: {
    marginRight: Spacing.one,
  },
  secondaryTimer: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
