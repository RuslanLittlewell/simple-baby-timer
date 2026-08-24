import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { WheelSelect } from '@/components/wheel-select';
import { ThemedText } from '@/components/themed-text';
import { WheelField } from '@/components/wheel-field';
import { WheelSheetHost } from '@/components/wheel-sheet';
import { NunitoSans, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import {
  eventDurationMs,
  deleteSession,
  updateSession,
  type ActivitySession,
  type EventKind,
  type ProDetails,
} from '@/lib/activity-store';
import { enqueueSessionDelete, enqueueSessionUpsert } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

import { combineDayTime, fmtTime, isEvent, parseTime, startOfDayMs } from '../helpers';
import { modalStyles } from '../modal-styles';
import {
  BOTTLE_CONTENTS,
  BREAST_SIDES,
  SETTLING_METHODS,
  SLEEP_PLACES,
  proDetailsIcon,
  proDetailsLabels,
  type SettlingMethod,
} from '../pro-details';
import { DayStepper } from './day-stepper';


interface EntryEditorProps {
  entry: ActivitySession | null;
  proActive: boolean;
  onClose: () => void;
  
  onChanged: () => void | Promise<void>;
}

export function EntryEditor({ entry, proActive, onClose, onChanged }: EntryEditorProps) {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const WEEKDAYS = WEEKDAYS_I18N[language];

  const remoteIdOf = (childId?: string) =>
    childId ? children.find((child) => child.id === childId)?.remoteId : undefined;

  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startDayMs, setStartDayMs] = useState(0);
  const [endDayMs, setEndDayMs] = useState(0);
  const [milkInput, setMilkInput] = useState('');
  const [error, setError] = useState('');
  const [settlingMethods, setSettlingMethods] = useState<SettlingMethod[]>([]);
  const [sleepPlace, setSleepPlace] = useState<(typeof SLEEP_PLACES)[number]>('crib');
  const [feedingMode, setFeedingMode] = useState<'breast' | 'bottle'>('breast');
  const [breastSide, setBreastSide] = useState<(typeof BREAST_SIDES)[number]>('left');
  const [bottleContent, setBottleContent] =
    useState<(typeof BOTTLE_CONTENTS)[number]>('formula');

  const timeAsDate = (input: string) => {
    const parsed = parseTime(input) ?? { hours: 0, minutes: 0 };
    const date = new Date();
    date.setHours(parsed.hours, parsed.minutes, 0, 0);
    return date;
  };

  useEffect(() => {
    if (!entry) return;
    setStartInput(fmtTime(entry.start));
    setEndInput(fmtTime(entry.end));
    setStartDayMs(startOfDayMs(entry.start));
    setEndDayMs(startOfDayMs(entry.end));
    setError('');
    const details = entry.proDetails;
    setSettlingMethods(details?.type === 'settling' ? details.methods : []);
    setSleepPlace(details?.type === 'sleep' ? details.place : 'crib');
    setFeedingMode(details?.type === 'feeding' ? details.mode : 'breast');
    setBreastSide(details?.type === 'feeding' && details.mode === 'breast' ? details.side : 'left');
    setBottleContent(
      details?.type === 'feeding' && details.mode === 'bottle'
        ? (details.content ?? 'formula')
        : 'formula',
    );
    
    const bottleVolume =
      details?.type === 'feeding' && details.mode === 'bottle' ? details.volumeMl : undefined;
    const amount = entry.milkMl ?? bottleVolume;
    setMilkInput(amount ? String(amount) : '');
  }, [entry]);

  const buildProDetails = (): ProDetails | undefined => {
    if (!entry) return undefined;
    if (entry.kind === 'settling') return { type: 'settling', methods: settlingMethods };
    if (entry.kind === 'sleep') return { type: 'sleep', place: sleepPlace };
    if (entry.kind === 'feeding') {
      if (feedingMode === 'breast') return { type: 'feeding', mode: 'breast', side: breastSide };
      
      const parsedVolume = Number.parseInt(milkInput, 10);
      return {
        type: 'feeding',
        mode: 'bottle',
        content: bottleContent,
        volumeMl: Number.isFinite(parsedVolume) && parsedVolume > 0 ? parsedVolume : undefined,
      };
    }
    return undefined;
  };

  const editingEvent = entry ? isEvent(entry.kind) : false;
  const editingDay = entry
    ? entry.kind === 'settling' || entry.kind === 'sleep' || entry.kind === 'awake'
    : false;
  const editableProKind =
    entry && (entry.kind === 'settling' || entry.kind === 'sleep' || entry.kind === 'feeding')
      ? entry.kind
      : null;

  const removeEntry = () => {
    if (!entry) return;
    Alert.alert(t('editor.deleteConfirm'), undefined, [
      { text: t('editor.cancel'), style: 'cancel' },
      {
        text: t('editor.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSession(entry.id, new Date(entry.start));
          const remoteId = remoteIdOf(entry.childId);
          if (remoteId) enqueueSessionDelete(remoteId, entry);
          await onChanged();
          onClose();
        },
      },
    ]);
  };

  const saveEntry = async () => {
    if (!entry) return;
    const fixedDuration = isEvent(entry.kind);
    const perDayDate =
      entry.kind === 'settling' || entry.kind === 'sleep' || entry.kind === 'awake';
    const startTime = parseTime(startInput);
    const endTime = fixedDuration ? startTime : parseTime(endInput);
    if (!startTime || !endTime) {
      setError(t('editor.errTimeFormat'));
      return;
    }

    const originalDate = new Date(entry.start);
    let start: number;
    let end: number;
    if (perDayDate) {
      start = combineDayTime(startDayMs, startTime);
      end = combineDayTime(endDayMs, endTime);
    } else {
      start = new Date(
        originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate(),
        startTime.hours, startTime.minutes,
      ).getTime();
      end = fixedDuration
        ? start + eventDurationMs(entry.kind as EventKind)
        : new Date(
            originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate(),
            endTime.hours, endTime.minutes,
          ).getTime();
      if (!fixedDuration && end < start) {
        end = new Date(
          originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate() + 1,
          endTime.hours, endTime.minutes,
        ).getTime();
      }
    }
    if (end <= start) {
      setError(t('editor.errEndAfterStart'));
      return;
    }

    const parsedMilk = Number.parseInt(milkInput, 10);
    if (entry.kind === 'feeding' && milkInput && (parsedMilk <= 0 || parsedMilk > 5000)) {
      setError(t('editor.errMilkRange'));
      return;
    }
    const milkMl = entry.kind === 'feeding' && milkInput ? parsedMilk : undefined;
    const proDetails = proActive ? buildProDetails() : entry.proDetails;
    await updateSession(entry.id, originalDate, { start, end, milkMl, proDetails });
    const remoteId = remoteIdOf(entry.childId);
    if (remoteId) enqueueSessionUpsert(remoteId, { ...entry, start, end, milkMl, proDetails });
    await onChanged();
    onClose();
  };

  return (
    <Modal visible={!!entry} transparent animationType="fade" onRequestClose={onClose}>
      <WheelSheetHost>
      <KeyboardAvoidingView
        style={modalStyles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={modalStyles.blur}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[modalStyles.card, { backgroundColor: theme.background }]}>
          <View style={modalStyles.header}>
            <ThemedText style={modalStyles.title}>
              {entry ? t(`kind.${entry.kind}`) : t('activity.title')}
            </ThemedText>
            <Pressable
              accessibilityLabel={t('editor.delete')}
              onPress={removeEntry}
              hitSlop={12}
              style={({ pressed }) => pressed && modalStyles.pressed}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color={theme.danger} />
            </Pressable>
          </View>
          {editableProKind &&
            (proActive ? (
              <View style={styles.proSection}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('editor.proParameters')}
                </ThemedText>

                {editableProKind === 'settling' && (
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
                )}

                {editableProKind === 'sleep' && (
                  <View style={styles.field}>
                    <WheelSelect
                      value={sleepPlace}
                      options={SLEEP_PLACES.map((item) => ({ value: item, label: t(`pro.${item}`) }))}
                      onSelect={(value) => setSleepPlace(value as (typeof SLEEP_PLACES)[number])}
                    />
                  </View>
                )}

                {editableProKind === 'feeding' && (
                  <>
                    <View style={styles.field}>
                      <WheelSelect
                        value={feedingMode}
                        options={(['breast', 'bottle'] as const).map((item) => ({
                          value: item,
                          label: t(`pro.${item}`),
                        }))}
                        onSelect={(value) => setFeedingMode(value as 'breast' | 'bottle')}
                      />
                    </View>
                    {feedingMode === 'breast' ? (
                      <View style={styles.field}>
                        <WheelSelect
                          value={breastSide}
                          options={BREAST_SIDES.map((item) => ({
                            value: item,
                            label: t(`pro.${item}`),
                          }))}
                          onSelect={(value) => setBreastSide(value as (typeof BREAST_SIDES)[number])}
                        />
                      </View>
                    ) : (
                      <>
                        <View style={styles.field}>
                          <WheelSelect
                            value={bottleContent}
                            options={BOTTLE_CONTENTS.map((item) => ({
                              value: item,
                              label: t(`pro.${item}`),
                            }))}
                            onSelect={(value) =>
                              setBottleContent(value as (typeof BOTTLE_CONTENTS)[number])
                            }
                          />
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            ) : entry?.proDetails ? (
              <View style={styles.proSection}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('editor.proParameters')}
                </ThemedText>
                <View style={[styles.proDetails, { backgroundColor: theme.backgroundElement }]}>
                  <MaterialCommunityIcons
                    name={proDetailsIcon(entry.proDetails) ?? 'star-outline'}
                    size={20}
                    color={theme.text}
                  />
                  <View style={styles.proDetailsColumn}>
                    {proDetailsLabels(entry.proDetails, t).map((label, index) => (
                      <ThemedText key={`${label}-${index}`} type="smallBold">
                        {label}
                      </ThemedText>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {t('manual.proRequired')}
              </ThemedText>
            ))}
          <View style={styles.timeFields}>
            <View style={styles.timeField}>
              <ThemedText type="small" themeColor="textSecondary">{t('editor.start')}</ThemedText>
              <WheelField
                mode="time"
                value={timeAsDate(startInput)}
                displayText={startInput || '00:00'}
                onChange={(date) => { setStartInput(fmtTime(date.getTime())); setError(''); }}
                style={[styles.timeInput, { backgroundColor: theme.backgroundElement }]}
                textStyle={[styles.timeInputText, { color: theme.text }]}
              />
              {editingDay && (
                <DayStepper
                  dayMs={startDayMs}
                  weekdays={WEEKDAYS}
                  textColor={theme.text}
                  backgroundColor={theme.backgroundElement}
                  onChange={(next) => { setStartDayMs(next); setError(''); }}
                  t={t}
                />
              )}
            </View>
            {!editingEvent && (
              <View style={styles.timeField}>
                <ThemedText type="small" themeColor="textSecondary">{t('editor.end')}</ThemedText>
                <WheelField
                  mode="time"
                  value={timeAsDate(endInput)}
                  displayText={endInput || '00:00'}
                  onChange={(date) => { setEndInput(fmtTime(date.getTime())); setError(''); }}
                  style={[styles.timeInput, { backgroundColor: theme.backgroundElement }]}
                  textStyle={[styles.timeInputText, { color: theme.text }]}
                />
                {editingDay && (
                  <DayStepper
                    dayMs={endDayMs}
                    weekdays={WEEKDAYS}
                    textColor={theme.text}
                    backgroundColor={theme.backgroundElement}
                    onChange={(next) => { setEndDayMs(next); setError(''); }}
                    t={t}
                  />
                )}
              </View>
            )}
          </View>
          {entry?.kind === 'feeding' && (
            <>
              <ThemedText type="small" themeColor="textSecondary">{t('editor.milkAmount')}</ThemedText>
              <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement }]}>
                <TextInput
                  value={milkInput}
                  onChangeText={(value) => { setMilkInput(value.replace(/[^0-9]/g, '')); setError(''); }}
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
          {!!error && (
            <ThemedText themeColor="danger" style={styles.errorText}>
              {error}
            </ThemedText>
          )}
          <Pressable
            onPress={saveEntry}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.text },
              pressed && modalStyles.pressed,
            ]}>
            <ThemedText style={[styles.saveButtonText, { color: theme.background }]}>
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
  proSection: {
    gap: Spacing.one,
  },
  proDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  proDetailsColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  field: {
    gap: Spacing.one,
    zIndex: 1,
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
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: 22,
    lineHeight: 28,
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
    fontFamily: NunitoSans.bold,
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
    fontSize: 13,
    lineHeight: 18,
  },
});
