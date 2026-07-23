import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_ACCENT } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import { formatDuration, type DayStats } from '../helpers';
import { modalStyles } from '../modal-styles';

export function StatsModal({
  visible,
  onClose,
  stats,
}: {
  visible: boolean;
  onClose: () => void;
  stats: DayStats;
}) {
  const theme = useTheme();
  const t = useT();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={modalStyles.blur}
        />
        <Pressable
          style={[modalStyles.card, { backgroundColor: theme.background }]}
          onPress={() => {}}>
          <ThemedText style={modalStyles.title}>{t('calendar.stats')}</ThemedText>
          <View style={styles.statRow}>
            <MaterialCommunityIcons
              name="moon-waning-crescent"
              size={24}
              color={ACTIVITY_ACCENT.sleep}
            />
            <ThemedText style={styles.statLabel}>{t('kind.sleep')}</ThemedText>
            <ThemedText type="smallBold">
              {formatDuration(stats.sleepMs, t('unit.hours'), t('unit.minutes'))}
            </ThemedText>
          </View>
          <View style={styles.statRow}>
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={24}
              color={ACTIVITY_ACCENT.awake}
            />
            <ThemedText style={styles.statLabel}>{t('kind.awake')}</ThemedText>
            <ThemedText type="smallBold">
              {formatDuration(stats.awakeMs, t('unit.hours'), t('unit.minutes'))}
            </ThemedText>
          </View>
          <View style={styles.statRow}>
            <MaterialCommunityIcons
              name="baby-bottle-outline"
              size={24}
              color={ACTIVITY_ACCENT.feed}
            />
            <ThemedText style={styles.statLabel}>{t('calendar.milk')}</ThemedText>
            <ThemedText type="smallBold">
              {stats.milkMl} {t('unit.ml')}
            </ThemedText>
          </View>
          <View
            style={styles.statRow}
            accessible
            accessibilityLabel={`${t('kind.poop')}: ${stats.poopCount}`}>
            <MaterialCommunityIcons name="emoticon-poop" size={24} color={ACTIVITY_ACCENT.poop} />
            <View style={styles.statSpacer} />
            <ThemedText type="smallBold">{stats.poopCount}</ThemedText>
          </View>
          <View
            style={styles.statRow}
            accessible
            accessibilityLabel={`${t('kind.diaper')}: ${stats.diaperCount}`}>
            <MaterialCommunityIcons
              name="diaper-outline"
              size={24}
              color={ACTIVITY_ACCENT.diaper}
            />
            <View style={styles.statSpacer} />
            <ThemedText type="smallBold">{stats.diaperCount}</ThemedText>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 40,
  },
  statLabel: {
    flex: 1,
  },
  statSpacer: {
    flex: 1,
  },
});
