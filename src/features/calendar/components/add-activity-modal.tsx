import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { WheelField } from '@/components/wheel-field';
import { WheelSheetHost } from '@/components/wheel-sheet';
import { WheelSelect } from '@/components/wheel-select';
import { NunitoSans, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import {
  eventDurationMs,
  type EventKind,
  type ProDetails,
  type SessionKind,
} from '@/lib/activity-store';
import { useAppStore, useT } from '@/state/app-state';

import { combineDayTime, fmtTime, isEvent, parseTime, startOfDayMs } from '../helpers';
import { modalStyles } from '../modal-styles';
import {
  BOTTLE_CONTENTS,
  BREAST_SIDES,
  SETTLING_METHODS,
  SLEEP_PLACES,
  type SettlingMethod,
} from '../pro-details';
import { DayStepper } from './day-stepper';

type ManualKind = SessionKind;

const KINDS: ManualKind[] = ['settling', 'sleep', 'awake', 'feeding', 'diaper', 'poop'];

interface AddActivityModalProps {
  visible: boolean;
  day: Date;
  proActive: boolean;
  onClose: () => void;
  onSave: (
    kind: ManualKind,
    start: number,
    end: number,
    proDetails?: ProDetails,
    milkMl?: number,
  ) => Promise<void>;
}

export function AddActivityModal({
  visible,
  day,
  proActive,
  onClose,
  onSave,
}: AddActivityModalProps) {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const WEEKDAYS = WEEKDAYS_I18N[language];
  const [kind, setKind] = useState<ManualKind>('settling');
  const [startInput, setStartInput] = useState('09:00');
  const [endInput, setEndInput] = useState('09:30');
  const [startDayMs, setStartDayMs] = useState(0);
  const [endDayMs, setEndDayMs] = useState(0);
  const [sleepPlace, setSleepPlace] = useState<(typeof SLEEP_PLACES)[number]>('crib');
  const [feedingMode, setFeedingMode] = useState<'breast' | 'bottle'>('breast');
  const [breastSide, setBreastSide] = useState<(typeof BREAST_SIDES)[number]>('left');
  const [bottleContent, setBottleContent] =
    useState<(typeof BOTTLE_CONTENTS)[number]>('formula');
  const [volume, setVolume] = useState('');
  const [settlingMethods, setSettlingMethods] = useState<SettlingMethod[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const timeAsDate = (input: string) => {
    const parsed = parseTime(input) ?? { hours: 0, minutes: 0 };
    const date = new Date();
    date.setHours(parsed.hours, parsed.minutes, 0, 0);
    return date;
  };

  useEffect(() => {
    if (!visible) return;
    const now = new Date();
    const onToday =
      now.getFullYear() === day.getFullYear() &&
      now.getMonth() === day.getMonth() &&
      now.getDate() === day.getDate();
    const startMinutes = onToday ? now.getHours() * 60 + now.getMinutes() : 9 * 60;
    const endMinutes = Math.min(startMinutes + 30, 23 * 60 + 59);
    const fmt = (minutes: number) =>
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    setKind('settling');
    setStartInput(fmt(startMinutes));
    setEndInput(fmt(endMinutes));
    setStartDayMs(startOfDayMs(day.getTime()));
    setEndDayMs(startOfDayMs(day.getTime()));
    setSleepPlace('crib');
    setFeedingMode('breast');
    setBreastSide('left');
    setBottleContent('formula');
    setVolume('');
    setSettlingMethods([]);
    setError('');
    setSaving(false);
  }, [day, visible]);

  const parsedVolume = Number.parseInt(volume, 10);
  const eventKind = isEvent(kind);
  const bottleVolume =
    kind === 'feeding' && feedingMode === 'bottle' && Number.isFinite(parsedVolume) && parsedVolume > 0
      ? parsedVolume
      : undefined;

  const buildDetails = (): ProDetails | undefined => {
    if (!proActive || kind === 'awake' || eventKind) return undefined;
    if (kind === 'settling') return { type: 'settling', methods: settlingMethods };
    if (kind === 'sleep') return { type: 'sleep', place: sleepPlace };
    if (feedingMode === 'breast') return { type: 'feeding', mode: 'breast', side: breastSide };
    return {
      type: 'feeding',
      mode: 'bottle',
      content: bottleContent,
      volumeMl: bottleVolume,
    };
  };

  const submit = async () => {
    const startTime = parseTime(startInput);
    const endTime = eventKind ? startTime : parseTime(endInput);
    if (!startTime || !endTime) {
      setError(t('editor.errTimeFormat'));
      return;
    }
    const start = combineDayTime(startDayMs, startTime);
    const end = eventKind
      ? start + eventDurationMs(kind as EventKind)
      : combineDayTime(endDayMs, endTime);
    if (end <= start) {
      setError(t('editor.errEndAfterStart'));
      return;
    }
    setSaving(true);
    try {
      await onSave(kind, start, end, buildDetails(), bottleVolume);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectField = (
    label: string,
    value: string,
    options: readonly { value: string; label: string }[],
    onSelect: (value: string) => void,
  ) => (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <WheelSelect value={value} options={options} onSelect={onSelect} />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <WheelSheetHost>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.backdrop}>
        <BlurView intensity={35} tint="dark" pointerEvents="none" style={modalStyles.blur} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[modalStyles.card, styles.card, { backgroundColor: theme.background }]}>
          <View style={modalStyles.header}>
            <ThemedText style={modalStyles.title}>{t('manual.title')}</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {selectField(
              t('manual.activity'),
              kind,
              KINDS.map((item) => ({
                value: item,
                label: item === 'poop' ? '💩' : t(`kind.${item}`),
              })),
              (value) => setKind(value as ManualKind),
            )}

            <View style={styles.timeRow}>
              <View style={[styles.field, styles.timeField]}>
                <ThemedText type="small" themeColor="textSecondary">{t('editor.start')}</ThemedText>
                <WheelField
                  mode="time"
                  value={timeAsDate(startInput)}
                  displayText={startInput || '00:00'}
                  onChange={(date) => { setStartInput(fmtTime(date.getTime())); setError(''); }}
                  style={[styles.timeInputBox, { backgroundColor: theme.backgroundElement }]}
                  textStyle={[styles.timeInputText, { color: theme.text }]}
                />
                <DayStepper
                  dayMs={startDayMs}
                  weekdays={WEEKDAYS}
                  textColor={theme.text}
                  backgroundColor={theme.backgroundElement}
                  onChange={(next) => { setStartDayMs(next); setError(''); }}
                  t={t}
                />
              </View>
              {!eventKind && (
                <View style={[styles.field, styles.timeField]}>
                  <ThemedText type="small" themeColor="textSecondary">{t('editor.end')}</ThemedText>
                  <WheelField
                    mode="time"
                    value={timeAsDate(endInput)}
                    displayText={endInput || '00:00'}
                    onChange={(date) => { setEndInput(fmtTime(date.getTime())); setError(''); }}
                    style={[styles.timeInputBox, { backgroundColor: theme.backgroundElement }]}
                    textStyle={[styles.timeInputText, { color: theme.text }]}
                  />
                  <DayStepper
                    dayMs={endDayMs}
                    weekdays={WEEKDAYS}
                    textColor={theme.text}
                    backgroundColor={theme.backgroundElement}
                    onChange={(next) => { setEndDayMs(next); setError(''); }}
                    t={t}
                  />
                </View>
              )}
            </View>

            {proActive && kind !== 'awake' && !eventKind && (
              <View style={styles.proBlock}>
                <ThemedText type="smallBold">{t('editor.proParameters')}</ThemedText>

                {kind === 'settling' && (
                  <View style={styles.field}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('manual.methods')}
                    </ThemedText>
                    <View style={styles.multiOptions}>
                      {SETTLING_METHODS.map((method) => {
                        const selected = settlingMethods.includes(method);
                        return (
                          <Pressable
                            key={method}
                            onPress={() =>
                              setSettlingMethods((current) =>
                                selected
                                  ? current.filter((item) => item !== method)
                                  : [...current, method],
                              )
                            }
                            style={[
                              styles.multiOption,
                              {
                                backgroundColor: selected
                                  ? theme.backgroundSelected
                                  : theme.backgroundElement,
                                borderColor: selected ? theme.text : theme.border,
                              },
                            ]}>
                            <ThemedText type="small">{t(`pro.${method}`)}</ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {kind === 'sleep' &&
                  selectField(
                    t('manual.place'),
                    sleepPlace,
                    SLEEP_PLACES.map((item) => ({ value: item, label: t(`pro.${item}`) })),
                    (value) => setSleepPlace(value as (typeof SLEEP_PLACES)[number]),
                  )}

                {kind === 'feeding' && (
                  <>
                    {selectField(
                      t('manual.feedingType'),
                      feedingMode,
                      (['breast', 'bottle'] as const).map((item) => ({
                        value: item,
                        label: t(`pro.${item}`),
                      })),
                      (value) => setFeedingMode(value as 'breast' | 'bottle'),
                    )}
                    {feedingMode === 'breast' ? (
                      selectField(
                        t('manual.side'),
                        breastSide,
                        BREAST_SIDES.map((item) => ({ value: item, label: t(`pro.${item}`) })),
                        (value) => setBreastSide(value as (typeof BREAST_SIDES)[number]),
                      )
                    ) : (
                      <>
                        {selectField(
                          t('manual.content'),
                          bottleContent,
                          BOTTLE_CONTENTS.map((item) => ({ value: item, label: t(`pro.${item}`) })),
                          (value) => setBottleContent(value as (typeof BOTTLE_CONTENTS)[number]),
                        )}
                        <View style={styles.field}>
                          <ThemedText type="small" themeColor="textSecondary">
                            {t('pro.volume')}
                          </ThemedText>
                          <TextInput
                            value={volume}
                            onChangeText={(value) => setVolume(value.replace(/\D/g, '').slice(0, 4))}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={theme.textSecondary}
                            style={[
                              styles.input,
                              { color: theme.text, backgroundColor: theme.backgroundElement },
                            ]}
                          />
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            )}

            {!proActive && !eventKind && (
              <ThemedText type="small" themeColor="textSecondary">
                {t('manual.proRequired')}
              </ThemedText>
            )}
            {error ? <ThemedText themeColor="danger">{error}</ThemedText> : null}
          </ScrollView>

          <Pressable
            disabled={saving}
            onPress={() => void submit()}
            style={[styles.save, { backgroundColor: theme.text }]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {t('editor.save')}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </WheelSheetHost>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    maxHeight: '88%',
  },
  content: {
    gap: Spacing.three,
  },
  scroll: {
    flexShrink: 1,
  },
  field: {
    gap: Spacing.one,
    zIndex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timeField: {
    flex: 1,
  },
  timeInputBox: {
    minHeight: 46,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputText: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    minHeight: 46,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: NunitoSans.regular,
  },
  proBlock: {
    gap: Spacing.three,
  },
  multiOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  multiOption: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  save: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
