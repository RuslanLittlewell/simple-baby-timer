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

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import {
  EVENT_DURATION_MS,
  deleteSession,
  updateSession,
  type ActivitySession,
} from '@/lib/activity-store';
import { enqueueSessionDelete, enqueueSessionUpsert } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

import { DANGER_COLOR } from '../constants';
import {
  combineDayTime,
  fmtTime,
  isEvent,
  normalizeTimeInput,
  parseTime,
  startOfDayMs,
} from '../helpers';
import { modalStyles } from '../modal-styles';
import { DayStepper } from './day-stepper';

interface EntryEditorProps {
  entry: ActivitySession | null;
  onClose: () => void;
  // Called after the entry was updated or deleted so the owner can reload.
  onChanged: () => void | Promise<void>;
}

export function EntryEditor({ entry, onClose, onChanged }: EntryEditorProps) {
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

  useEffect(() => {
    if (!entry) return;
    setStartInput(fmtTime(entry.start));
    setEndInput(fmtTime(entry.end));
    setStartDayMs(startOfDayMs(entry.start));
    setEndDayMs(startOfDayMs(entry.end));
    setMilkInput(entry.milkMl ? String(entry.milkMl) : '');
    setError('');
  }, [entry]);

  const editingEvent = entry ? isEvent(entry.kind) : false;
  const editingDay = entry ? entry.kind === 'sleep' || entry.kind === 'awake' : false;

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
    const perDayDate = entry.kind === 'sleep' || entry.kind === 'awake';
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
        ? start + EVENT_DURATION_MS
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
    await updateSession(entry.id, originalDate, { start, end, milkMl });
    const remoteId = remoteIdOf(entry.childId);
    if (remoteId) enqueueSessionUpsert(remoteId, { ...entry, start, end, milkMl });
    await onChanged();
    onClose();
  };

  return (
    <Modal visible={!!entry} transparent animationType="fade" onRequestClose={onClose}>
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
              <MaterialCommunityIcons name="trash-can-outline" size={24} color={DANGER_COLOR} />
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {editingEvent
              ? t('editor.editStart', { n: EVENT_DURATION_MS / 60000 })
              : t('editor.editTimes')}
          </ThemedText>
          <View style={styles.timeFields}>
            <View style={styles.timeField}>
              <ThemedText type="small" themeColor="textSecondary">{t('editor.start')}</ThemedText>
              <TextInput
                value={startInput}
                onChangeText={(value) => { setStartInput(normalizeTimeInput(value)); setError(''); }}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.timeInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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
                <TextInput
                  value={endInput}
                  onChangeText={(value) => { setEndInput(normalizeTimeInput(value)); setError(''); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="00:00"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.timeInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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
          {!!error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    color: DANGER_COLOR,
    fontSize: 13,
    lineHeight: 18,
  },
});
