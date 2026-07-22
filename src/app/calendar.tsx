import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_ACCENT, ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS_I18N, WEEKDAYS_I18N } from '@/i18n';
import {
  getSessionsForDay,
  updateSession,
  type ActivitySession,
} from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';
import { useAppState } from '@/state/app-state';

const GUTTER = 52;
const NOW_COLOR = '#FF3B30';

const DEFAULT_HOUR_HEIGHT = 96;
const MIN_HOUR_HEIGHT = 24;
const MAX_HOUR_HEIGHT = 320;

type KindMeta = {
  gradKey: keyof typeof ACTIVITY_GRADIENTS;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const KIND_META: Record<ActivityKind, KindMeta> = {
  sleep: { gradKey: 'sleep', icon: 'moon-waning-crescent' },
  feeding: { gradKey: 'feed', icon: 'baby-bottle-outline' },
  awake: { gradKey: 'awake', icon: 'white-balance-sunny' },
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDuration = (milliseconds: number, hoursUnit: string, minutesUnit: string) => {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} ${minutesUnit}`;
  if (!minutes) return `${hours} ${hoursUnit}`;
  return `${hours} ${hoursUnit} ${minutes} ${minutesUnit}`;
};

const normalizeTimeInput = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

const parseTime = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

/** Ячейки месяца, неделя с понедельника. `null` — пустая ячейка. */
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const theme = useTheme();
  const blurTargetRef = useRef<View | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<'day' | 'month'>('day');
  const [shownDay, setShownDay] = useState<Date>(today);
  const [monthCursor, setMonthCursor] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const { dataVersion, session, language, t } = useAppState();
  const WEEKDAYS = WEEKDAYS_I18N[language];
  const MONTHS = MONTHS_I18N[language];
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ActivitySession | null>(null);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [milkInput, setMilkInput] = useState('');
  const [editorError, setEditorError] = useState('');

  // Перечитываем сессии при смене дня или после сохранения новой активности.
  useEffect(() => {
    let alive = true;
    getSessionsForDay(shownDay).then((list) => {
      if (alive) setSessions(list);
    });
    return () => {
      alive = false;
    };
  }, [shownDay, dataVersion]);

  const openEntryEditor = (entry: ActivitySession) => {
    setEntryToEdit(entry);
    setStartInput(fmtTime(entry.start));
    setEndInput(fmtTime(entry.end));
    setMilkInput(entry.milkMl ? String(entry.milkMl) : '');
    setEditorError('');
  };

  const closeEntryEditor = () => {
    setEntryToEdit(null);
    setStartInput('');
    setEndInput('');
    setMilkInput('');
    setEditorError('');
  };

  const saveEntry = async () => {
    if (!entryToEdit) return;
    const startTime = parseTime(startInput);
    const endTime = parseTime(endInput);
    if (!startTime || !endTime) {
      setEditorError(t('editor.errTimeFormat'));
      return;
    }

    const originalDate = new Date(entryToEdit.start);
    const start = new Date(
      originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate(),
      startTime.hours, startTime.minutes,
    ).getTime();
    const end = new Date(
      originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate(),
      endTime.hours, endTime.minutes,
    ).getTime();
    if (end <= start) {
      setEditorError(t('editor.errEndAfterStart'));
      return;
    }

    const parsedMilk = Number.parseInt(milkInput, 10);
    if (entryToEdit.kind === 'feeding' && milkInput && (parsedMilk <= 0 || parsedMilk > 5000)) {
      setEditorError(t('editor.errMilkRange'));
      return;
    }
    const milkMl = entryToEdit.kind === 'feeding' && milkInput ? parsedMilk : undefined;
    const updated = { ...entryToEdit, start, end, milkMl };
    await updateSession(entryToEdit.id, originalDate, { start, end, milkMl });
    setSessions((current) =>
      current.map((item) => (item.id === entryToEdit.id ? updated : item)).sort((a, b) => a.start - b.start),
    );
    closeEntryEditor();
  };

  // «Сейчас» тикает раз в секунду, пока смотрим сегодняшний день — линия времени
  // и активная сессия обновляются в реальном времени.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (view !== 'day' || !isSameDay(shownDay, today)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [view, shownDay, today]);

  // Масштаб шкалы + пинч-зум.
  const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT);
  const hourHeightRef = useRef(hourHeight);
  useEffect(() => {
    hourHeightRef.current = hourHeight;
  }, [hourHeight]);
  const pinchBase = useRef(hourHeight);

  const beginPinch = useCallback(() => {
    pinchBase.current = hourHeightRef.current;
  }, []);
  const applyPinch = useCallback((scale: number) => {
    const next = Math.round(
      Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, pinchBase.current * scale)),
    );
    setHourHeight(next);
  }, []);
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          'worklet';
          runOnJS(beginPinch)();
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(applyPinch)(e.scale);
        }),
    [beginPinch, applyPinch],
  );

  const openMonth = () => {
    setMonthCursor(new Date(shownDay.getFullYear(), shownDay.getMonth(), 1));
    setView('month');
  };
  const shiftMonth = (delta: number) =>
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  const pickDay = (day: number) => {
    setShownDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
    didAutoScroll.current = false;
    setView('day');
  };

  // ---- МЕСЯЧНЫЙ ВИД: выбор дня ----
  if (view === 'month') {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const cells = buildMonthCells(year, month);
    const selectedInMonth = shownDay.getFullYear() === year && shownDay.getMonth() === month;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.monthSafe}>
          <View style={styles.monthTop}>
            <ThemedText type="subtitle">{t('calendar.title')}</ThemedText>
            <Pressable
              onPress={() => setView('day')}
              hitSlop={12}
              style={({ pressed }) => pressed && styles.pressed}>
              <MaterialCommunityIcons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.monthCard}>
            <View style={styles.monthNav}>
              <Pressable
                onPress={() => shiftMonth(-1)}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
              </Pressable>
              <ThemedText type="smallBold">
                {MONTHS[month]} {year}
              </ThemedText>
              <Pressable
                onPress={() => shiftMonth(1)}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons name="chevron-right" size={28} color={theme.text} />
              </Pressable>
            </View>

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
                  <Pressable key={day} style={styles.cell} onPress={() => pickDay(day)}>
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
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ---- ДНЕВНОЙ ВИД: таймлайн ----
  const isToday = isSameDay(shownDay, today);
  const dayStartMs = new Date(
    shownDay.getFullYear(),
    shownDay.getMonth(),
    shownDay.getDate(),
  ).getTime();
  const nowMinutes = (now - dayStartMs) / 60000;
  const totalHeight = 24 * hourHeight;
  const px = (minutes: number) => (minutes / 60) * hourHeight;

  // Активная сессия рисуется живым блоком (растёт до «сейчас») на сегодняшнем дне.
  const clampDayMin = (m: number) => Math.max(0, Math.min(24 * 60, m));
  let live: { top: number; height: number; kind: ActivityKind; start: number } | null = null;
  if (isToday && session) {
    const startMin = clampDayMin((session.startedAt - dayStartMs) / 60000);
    const endMin = clampDayMin(nowMinutes);
    if (endMin > startMin) {
      live = { top: px(startMin), height: px(endMin) - px(startMin), kind: session.kind, start: session.startedAt };
    }
  }
  const liveMeta = live ? KIND_META[live.kind] : null;

  const completedSleepMs = sessions
    .filter((item) => item.kind === 'sleep')
    .reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0);
  const completedAwakeMs = sessions
    .filter((item) => item.kind === 'awake')
    .reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0);
  const liveDurationMs = live ? Math.max(0, now - live.start) : 0;
  const sleepMs = completedSleepMs + (live?.kind === 'sleep' ? liveDurationMs : 0);
  const awakeMs = completedAwakeMs + (live?.kind === 'awake' ? liveDurationMs : 0);
  const milkMl = sessions
    .filter((item) => item.kind === 'feeding')
    .reduce((sum, item) => sum + (item.milkMl ?? 0), 0);

  // Шаг линий и шаг подписей подбираем отдельно, чтобы у сетки при любом зуме были
  // подписи (линии — не ближе ~14px, подписи — не ближе ~22px, просто реже линий).
  let minorStep = 60;
  for (const s of [1, 5, 15, 30]) {
    if ((s / 60) * hourHeight >= 14) {
      minorStep = s;
      break;
    }
  }
  let labelStep = 60;
  for (const s of [1, 5, 15, 30]) {
    if ((s / 60) * hourHeight >= 22) {
      labelStep = s;
      break;
    }
  }
  const minorMarks: { top: number; label: string | null }[] = [];
  if (minorStep < 60) {
    for (let h = 0; h < 24; h++) {
      for (let m = minorStep; m < 60; m += minorStep) {
        const showLabel = labelStep < 60 && m % labelStep === 0;
        minorMarks.push({ top: px(h * 60 + m), label: showLabel ? pad2(m) : null });
      }
    }
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <BlurTargetView ref={blurTargetRef} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable
              onPress={openMonth}
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="chevron-left" size={32} color={theme.text} />
            </Pressable>
            <View style={styles.dateBlock}>
              <ThemedText style={styles.dateDay}>{pad2(shownDay.getDate())}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pad2(shownDay.getMonth() + 1)}.{shownDay.getFullYear()}
              </ThemedText>
            </View>
            <Pressable
              accessibilityLabel={t('calendar.stats')}
              onPress={() => setStatsVisible(true)}
              hitSlop={12}
              style={({ pressed }) => [styles.statsBtn, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="chart-box-outline" size={26} color={theme.text} />
            </Pressable>
          </View>

          <GestureDetector gesture={pinch}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (didAutoScroll.current) return;
                didAutoScroll.current = true;
                const targetY = isToday ? px(nowMinutes) - 140 : px(6 * 60) - 20;
                scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: false });
              }}>
              <View style={[styles.timeline, { height: totalHeight }]}>
                {/* Часовые линии и подписи */}
                {Array.from({ length: 25 }).map((_, h) => (
                  <View
                    key={`hl-${h}`}
                    pointerEvents="none"
                    style={[
                      styles.hourLine,
                      { top: h * hourHeight, backgroundColor: theme.backgroundSelected },
                    ]}
                  />
                ))}
                {Array.from({ length: 24 }).map((_, h) => (
                  <View
                    key={`ha-${h}`}
                    pointerEvents="none"
                    style={[styles.hourLabel, { top: h * hourHeight - 8 }]}>
                    <ThemedText style={styles.hourNum}>{pad2(h)}</ThemedText>
                    <ThemedText style={styles.hourSup} themeColor="textSecondary">
                      00
                    </ThemedText>
                  </View>
                ))}

                {/* Мелкая сетка (адаптивно по зуму) */}
                {minorMarks.map((mk, i) => (
                  <View key={`m-${i}`} pointerEvents="none">
                    <View
                      style={[
                        styles.minorLine,
                        { top: mk.top, backgroundColor: theme.backgroundElement },
                      ]}
                    />
                    {mk.label && (
                      <ThemedText
                        style={[styles.minorLabel, { top: mk.top - 8 }]}
                        themeColor="textSecondary">
                        {mk.label}
                      </ThemedText>
                    )}
                  </View>
                ))}

                {/* Блоки активностей из сохранённых сессий */}
                {sessions.map((s) => {
                  const startMin = (s.start - dayStartMs) / 60000;
                  const endMin = (s.end - dayStartMs) / 60000;
                  const clampedStart = Math.max(0, Math.min(24 * 60, startMin));
                  const clampedEnd = Math.max(0, Math.min(24 * 60, endMin));
                  if (clampedEnd <= clampedStart) return null;

                  const top = px(clampedStart);
                  const height = px(clampedEnd) - top;
                  const meta = KIND_META[s.kind];
                  const fg = ACTIVITY_FG[meta.gradKey];
                  const showText = height >= 16;
                  const showTime = height >= 34;

                  return (
                    <Pressable
                      key={s.id}
                      accessibilityLabel={t('editor.editLabel', { label: t(`kind.${s.kind}`) })}
                      onPress={() => openEntryEditor(s)}
                      style={({ pressed }) => [styles.block, { top, height }, pressed && styles.pressed]}>
                      <LinearGradient
                        colors={ACTIVITY_GRADIENTS[meta.gradKey]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.blockGradient}>
                        {showText && (
                          <View style={styles.blockContent}>
                            <View style={styles.blockRow}>
                              <MaterialCommunityIcons name={meta.icon} size={14} color={fg} />
                              <ThemedText
                                style={[styles.blockTitle, { color: fg }]}
                                numberOfLines={1}>
                                {t(`kind.${s.kind}`)}
                                {s.kind === 'feeding' && s.milkMl ? ` · ${s.milkMl} ${t('unit.ml')}` : ''}
                              </ThemedText>
                            </View>
                            {showTime && (
                              <ThemedText
                                style={[styles.blockTime, { color: fg }]}
                                numberOfLines={1}>
                                {fmtTime(s.start)}–{fmtTime(s.end)}
                              </ThemedText>
                            )}
                          </View>
                        )}
                      </LinearGradient>
                    </Pressable>
                  );
                })}

                {/* Активная сессия (растёт в реальном времени) */}
                {live && liveMeta && (
                  <LinearGradient
                    key="live"
                    colors={ACTIVITY_GRADIENTS[liveMeta.gradKey]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.block,
                      styles.liveBlock,
                      { top: live.top, height: live.height, borderColor: ACTIVITY_ACCENT[liveMeta.gradKey] },
                    ]}>
                    {live.height >= 16 && (
                      <View style={styles.blockContent}>
                        <View style={styles.blockRow}>
                          <MaterialCommunityIcons
                            name={liveMeta.icon}
                            size={14}
                            color={ACTIVITY_FG[liveMeta.gradKey]}
                          />
                          <ThemedText
                            style={[styles.blockTitle, { color: ACTIVITY_FG[liveMeta.gradKey] }]}
                            numberOfLines={1}>
                            {t(`kind.${live.kind}`)}
                          </ThemedText>
                        </View>
                        {live.height >= 34 && (
                          <ThemedText
                            style={[styles.blockTime, { color: ACTIVITY_FG[liveMeta.gradKey] }]}
                            numberOfLines={1}>
                            {fmtTime(live.start)}–{t('calendar.now')}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </LinearGradient>
                )}

                {/* Линия текущего времени */}
                {isToday && (
                  <View style={[styles.nowLine, { top: px(nowMinutes) }]} pointerEvents="none">
                    <View style={styles.nowDot} />
                    <View style={styles.nowBar} />
                  </View>
                )}
              </View>
            </ScrollView>
          </GestureDetector>

          {sessions.length === 0 && (
            <View style={styles.emptyOverlay} pointerEvents="none">
              <ThemedText type="small" themeColor="textSecondary">
                {t('calendar.empty')}
              </ThemedText>
            </View>
          )}

          <Modal visible={statsVisible} transparent animationType="fade" onRequestClose={() => setStatsVisible(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setStatsVisible(false)}>
              <BlurView
                blurTarget={blurTargetRef}
                blurMethod="dimezisBlurViewSdk31Plus"
                intensity={45}
                tint="dark"
                pointerEvents="none"
                style={styles.modalBlur}
              />
              <Pressable style={[styles.modalCard, { backgroundColor: theme.background }]} onPress={() => {}}>
                <ThemedText style={styles.modalTitle}>{t('calendar.stats')}</ThemedText>
                <View style={styles.statRow}>
                  <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={ACTIVITY_ACCENT.sleep} />
                  <ThemedText style={styles.statLabel}>{t('kind.sleep')}</ThemedText>
                  <ThemedText type="smallBold">
                    {formatDuration(sleepMs, t('unit.hours'), t('unit.minutes'))}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <MaterialCommunityIcons name="white-balance-sunny" size={24} color={ACTIVITY_ACCENT.awake} />
                  <ThemedText style={styles.statLabel}>{t('kind.awake')}</ThemedText>
                  <ThemedText type="smallBold">
                    {formatDuration(awakeMs, t('unit.hours'), t('unit.minutes'))}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <MaterialCommunityIcons name="baby-bottle-outline" size={24} color={ACTIVITY_ACCENT.feed} />
                  <ThemedText style={styles.statLabel}>{t('calendar.milk')}</ThemedText>
                  <ThemedText type="smallBold">{milkMl} {t('unit.ml')}</ThemedText>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <Modal visible={!!entryToEdit} transparent animationType="fade" onRequestClose={closeEntryEditor}>
            <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <BlurView
                blurTarget={blurTargetRef}
                blurMethod="dimezisBlurViewSdk31Plus"
                intensity={45}
                tint="dark"
                pointerEvents="none"
                style={styles.modalBlur}
              />
              <Pressable style={StyleSheet.absoluteFill} onPress={closeEntryEditor} />
              <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
                <ThemedText style={styles.modalTitle}>
                  {entryToEdit ? t(`kind.${entryToEdit.kind}`) : t('activity.title')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('editor.editTimes')}
                </ThemedText>
                <View style={styles.timeFields}>
                  <View style={styles.timeField}>
                    <ThemedText type="small" themeColor="textSecondary">{t('editor.start')}</ThemedText>
                    <TextInput
                      value={startInput}
                      onChangeText={(value) => { setStartInput(normalizeTimeInput(value)); setEditorError(''); }}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="00:00"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.timeInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                    />
                  </View>
                  <View style={styles.timeField}>
                    <ThemedText type="small" themeColor="textSecondary">{t('editor.end')}</ThemedText>
                    <TextInput
                      value={endInput}
                      onChangeText={(value) => { setEndInput(normalizeTimeInput(value)); setEditorError(''); }}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="00:00"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.timeInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                    />
                  </View>
                </View>
                {entryToEdit?.kind === 'feeding' && (
                  <>
                    <ThemedText type="small" themeColor="textSecondary">{t('editor.milkAmount')}</ThemedText>
                    <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement }]}>
                      <TextInput
                        value={milkInput}
                        onChangeText={(value) => { setMilkInput(value.replace(/[^0-9]/g, '')); setEditorError(''); }}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.milkInput, { color: theme.text }]}
                      />
                      <ThemedText type="smallBold">{t('unit.ml')}</ThemedText>
                    </View>
                  </>
                )}
                {!!editorError && <ThemedText style={styles.errorText}>{editorError}</ThemedText>}
                <Pressable
                  onPress={saveEntry}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: theme.text },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={[styles.saveButtonText, { color: theme.background }]}>{t('editor.save')}</ThemedText>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </SafeAreaView>
      </ThemedView>
      </BlurTargetView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingBottom: Spacing.three,
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.four,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBtn: {
    position: 'absolute',
    right: Spacing.four,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  timeline: {
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: GUTTER,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  minorLine: {
    position: 'absolute',
    left: GUTTER,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    position: 'absolute',
    left: 0,
    width: GUTTER - 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  hourNum: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  hourSup: {
    fontSize: 9,
    lineHeight: 11,
    marginLeft: 1,
  },
  minorLabel: {
    position: 'absolute',
    left: 0,
    width: GUTTER - 8,
    textAlign: 'right',
    fontSize: 9,
    lineHeight: 11,
  },
  block: {
    position: 'absolute',
    left: GUTTER,
    right: Spacing.two,
    borderRadius: 8,
    overflow: 'hidden',
  },
  blockGradient: {
    flex: 1,
  },
  liveBlock: {
    borderWidth: 2,
  },
  blockContent: {
    paddingHorizontal: Spacing.two,
    paddingTop: 2,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  blockTime: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
  nowLine: {
    position: 'absolute',
    left: GUTTER - 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NOW_COLOR,
  },
  nowBar: {
    flex: 1,
    height: 2,
    backgroundColor: NOW_COLOR,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#3A3D43',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 40,
  },
  statLabel: {
    flex: 1,
  },
  timeFields: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timeField: {
    flex: 1,
    gap: Spacing.one,
  },
  timeInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  milkInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: Spacing.three,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.35,
  },
  // Месячный вид
  monthSafe: {
    flex: 1,
    alignItems: 'center',
  },
  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  monthCard: {
    alignSelf: 'stretch',
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
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
