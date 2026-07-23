import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import { useAppStore } from '@/state/app-state';

import { isSameDay, pad2 } from '../helpers';
import { OverlayShell } from './overlay-shell';

interface WeekViewProps {
  weekStart: Date;
  shownDay: Date;
  today: Date;
  onShiftWeek: (delta: number) => void;
  onOpenMonth: () => void;
  onClose: () => void;
  onPickDay: (date: Date) => void;
}

export function WeekView({
  weekStart,
  shownDay,
  today,
  onShiftWeek,
  onOpenMonth,
  onClose,
  onPickDay,
}: WeekViewProps) {
  const theme = useTheme();
  const language = useAppStore((state) => state.language);
  const WEEKDAYS = WEEKDAYS_I18N[language];

  const weekDays = Array.from(
    { length: 7 },
    (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
  );
  const first = weekDays[0];
  const last = weekDays[6];
  const rangeLabel =
    `${pad2(first.getDate())}.${pad2(first.getMonth() + 1)} – ` +
    `${pad2(last.getDate())}.${pad2(last.getMonth() + 1)}`;

  return (
    <OverlayShell
      navLabel={rangeLabel}
      onBack={onOpenMonth}
      onClose={onClose}
      onPrev={() => onShiftWeek(-1)}
      onNext={() => onShiftWeek(1)}>
      <View style={styles.list}>
        {weekDays.map((d, i) => {
          const isTodayRow = isSameDay(d, today);
          const isSelected = isSameDay(d, shownDay);
          return (
            <Pressable
              key={i}
              onPress={() => onPickDay(d)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView
                type={isSelected ? 'backgroundSelected' : undefined}
                style={styles.dayRow}>
                <ThemedText
                  type={isTodayRow ? 'smallBold' : 'small'}
                  themeColor={isTodayRow ? 'text' : 'textSecondary'}
                  style={styles.dayName}>
                  {WEEKDAYS[i]}
                </ThemedText>
                <ThemedText
                  type={isTodayRow ? 'smallBold' : 'small'}
                  style={styles.dayDate}>
                  {pad2(d.getDate())}.{pad2(d.getMonth() + 1)}
                </ThemedText>
                {isTodayRow && <View style={styles.todayDot} />}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.textSecondary}
                />
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
    </OverlayShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.one,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    minHeight: 46,
  },
  dayName: {
    width: 40,
  },
  dayDate: {
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3c87f7',
  },
  pressed: {
    opacity: 0.5,
  },
});
