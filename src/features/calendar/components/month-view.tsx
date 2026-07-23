import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MONTHS_I18N, WEEKDAYS_I18N } from '@/i18n';
import { useAppStore } from '@/state/app-state';

import { buildMonthCells } from '../helpers';
import { OverlayShell } from './overlay-shell';

interface MonthViewProps {
  monthCursor: Date;
  shownDay: Date;
  today: Date;
  onShiftMonth: (delta: number) => void;
  onBackToWeek: () => void;
  onClose: () => void;
  onPickDay: (day: number) => void;
}

export function MonthView({
  monthCursor,
  shownDay,
  today,
  onShiftMonth,
  onBackToWeek,
  onClose,
  onPickDay,
}: MonthViewProps) {
  const language = useAppStore((state) => state.language);
  const WEEKDAYS = WEEKDAYS_I18N[language];
  const MONTHS = MONTHS_I18N[language];

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const cells = buildMonthCells(year, month);
  const selectedInMonth = shownDay.getFullYear() === year && shownDay.getMonth() === month;

  return (
    <OverlayShell
      navLabel={`${MONTHS[month]} ${year}`}
      onBack={onBackToWeek}
      onClose={onClose}
      onPrev={() => onShiftMonth(-1)}
      onNext={() => onShiftMonth(1)}>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} style={styles.cell}>
            <ThemedText type="small" themeColor="textSecondary">
              {weekday}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={`e-${index}`} style={styles.cell} />;
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          const isSelected = selectedInMonth && shownDay.getDate() === day;
          return (
            <Pressable key={day} style={styles.cell} onPress={() => onPickDay(day)}>
              <ThemedView
                type={isSelected ? 'backgroundSelected' : undefined}
                style={styles.dayCircle}>
                <ThemedText type={isToday ? 'smallBold' : 'small'}>{day}</ThemedText>
                {isToday && <View style={styles.todayDot} />}
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
    </OverlayShell>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3c87f7',
  },
});
