import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { NunitoSans, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  dateFromDateOnly,
  dateOnlyFromDate,
  formatMeasurementDate,
  formatMeasurementNumber,
  isValidGrowthMeasurement,
  parseMeasurementNumber,
  sortGrowthMeasurements,
  type GrowthMeasurement,
} from '@/lib/growth-measurements';
import { syncGrowthMeasurements } from '@/lib/sync';
import { type Child } from '@/lib/children';
import { useAppStore, useT } from '@/state/app-state';
import { useGrowthStore } from '@/state/growth-state';

interface GrowthHistoryModalProps {
  visible: boolean;
  child: Child | null;
  onClose: () => void;
}

const HISTORY_VISIBLE_ROW_COUNT = 4;
const HISTORY_ROW_HEIGHT = 52;
const HISTORY_LIST_MAX_HEIGHT =
  HISTORY_VISIBLE_ROW_COUNT * HISTORY_ROW_HEIGHT +
  (HISTORY_VISIBLE_ROW_COUNT - 1) * Spacing.two;

export function GrowthHistoryModal({ visible, child, onClose }: GrowthHistoryModalProps) {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const allMeasurements = useGrowthStore((state) => state.measurements);
  const addMeasurement = useGrowthStore((state) => state.addMeasurement);
  const updateMeasurement = useGrowthStore((state) => state.updateMeasurement);
  const [editing, setEditing] = useState<GrowthMeasurement | 'new' | null>(null);
  const historyScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) setEditing(null);
  }, [visible]);

  const measurements = useMemo(
    () => sortGrowthMeasurements(
      allMeasurements.filter((measurement) => measurement.childId === child?.id),
    ).reverse(),
    [allMeasurements, child?.id],
  );

  const scrollToLatest = () => {
    if (visible && !editing) {
      historyScrollRef.current?.scrollToEnd({ animated: false });
    }
  };

  const saveMeasurement = (
    measuredOn: string,
    heightCm: number,
    weightKg: number,
  ) => {
    if (!child) return;
    if (editing === 'new') {
      addMeasurement({ childId: child.id, measuredOn, heightCm, weightKg });
    } else if (editing) {
      updateMeasurement(editing.id, { measuredOn, heightCm, weightKg });
    }
    setEditing(null);
    void syncGrowthMeasurements(children).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <WheelSheetHost>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={45}
            tint="dark"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.card, { backgroundColor: theme.background }]}> 
            <View style={styles.header}>
              <ThemedText style={styles.title}>
                {editing
                  ? t(editing === 'new' ? 'growth.add' : 'growth.edit')
                  : t('growth.title')}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('editor.cancel')}
                onPress={editing ? () => setEditing(null) : onClose}
                hitSlop={10}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons
                  name={editing ? 'arrow-left' : 'close'}
                  size={24}
                  color={theme.text}
                />
              </Pressable>
            </View>

            {child && editing ? (
              <GrowthMeasurementEditor
                child={child}
                measurement={editing === 'new' ? null : editing}
                onCancel={() => setEditing(null)}
                onSave={saveMeasurement}
              />
            ) : (
              <>
                <ScrollView
                  ref={historyScrollRef}
                  style={styles.list}
                  contentContainerStyle={measurements.length ? styles.listContent : styles.emptyContent}
                  keyboardShouldPersistTaps="handled"
                  onLayout={scrollToLatest}
                  onContentSizeChange={scrollToLatest}
                  showsVerticalScrollIndicator>
                  {measurements.length ? measurements.map((measurement) => {
                    const height = formatMeasurementNumber(measurement.heightCm, language);
                    const weight = formatMeasurementNumber(measurement.weightKg, language);
                    return (
                      <Pressable
                        key={measurement.id}
                        accessibilityRole="button"
                        accessibilityLabel={t('growth.rowAccessibility', {
                          date: formatMeasurementDate(measurement.measuredOn, language),
                          height,
                          weight,
                        })}
                        onPress={() => setEditing(measurement)}
                        style={({ pressed }) => [
                          styles.row,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.rowDate}>
                          {formatMeasurementDate(measurement.measuredOn, language)}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          numberOfLines={1}
                          style={styles.rowValues}>
                          {weight} {t('unit.kg')} · {height} {t('unit.cm')}
                        </ThemedText>
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={18}
                          color={theme.textSecondary}
                          style={styles.rowEditIcon}
                        />
                      </Pressable>
                    );
                  }) : (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                      {t('growth.empty')}
                    </ThemedText>
                  )}
                </ScrollView>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('growth.add')}
                  onPress={() => setEditing('new')}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.text },
                    pressed && styles.pressed,
                  ]}>
                  <MaterialCommunityIcons name="plus" size={20} color={theme.background} />
                  <ThemedText style={[styles.primaryButtonText, { color: theme.background }]}>
                    {t('growth.add')}
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </WheelSheetHost>
    </Modal>
  );
}

interface GrowthMeasurementEditorProps {
  child: Child;
  measurement: GrowthMeasurement | null;
  onCancel: () => void;
  onSave: (measuredOn: string, heightCm: number, weightKg: number) => void;
}

function GrowthMeasurementEditor({
  child,
  measurement,
  onCancel,
  onSave,
}: GrowthMeasurementEditorProps) {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const today = dateOnlyFromDate(new Date());
  const birthday = child.birthday === undefined
    ? undefined
    : dateOnlyFromDate(new Date(child.birthday));
  const initialDate = measurement?.measuredOn ?? today;
  const [measuredOn, setMeasuredOn] = useState(initialDate);
  const [height, setHeight] = useState(
    measurement ? formatMeasurementNumber(measurement.heightCm, language) : '',
  );
  const [weight, setWeight] = useState(
    measurement ? formatMeasurementNumber(measurement.weightKg, language) : '',
  );
  const heightCm = parseMeasurementNumber(height);
  const weightKg = parseMeasurementNumber(weight);
  const valid = heightCm !== null && weightKg !== null && isValidGrowthMeasurement(
    { measuredOn, heightCm, weightKg },
    birthday,
    today,
  );
  const selectedDate = dateFromDateOnly(measuredOn) ?? new Date();

  return (
    <View style={styles.editor}>
      <ThemedText type="small" themeColor="textSecondary">{t('growth.date')}</ThemedText>
      <WheelField
        accessibilityLabel={t('growth.date')}
        mode="date"
        value={selectedDate}
        displayText={formatMeasurementDate(measuredOn, language)}
        onChange={(date) => setMeasuredOn(dateOnlyFromDate(date))}
        minimumDate={birthday ? dateFromDateOnly(birthday) ?? undefined : undefined}
        maximumDate={new Date()}
        style={[styles.dateField, { backgroundColor: theme.backgroundElement }]}
        textStyle={styles.dateFieldText}
      />

      <View style={styles.inputRow}>
        <View style={styles.inputField}>
          <ThemedText type="small" themeColor="textSecondary">{t('growth.weight')}</ThemedText>
          <TextInput
            accessibilityLabel={t('growth.weight')}
            value={weight}
            onChangeText={setWeight}
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder={t('growth.weightPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
        </View>
        <View style={styles.inputField}>
          <ThemedText type="small" themeColor="textSecondary">{t('growth.height')}</ThemedText>
          <TextInput
            accessibilityLabel={t('growth.height')}
            value={height}
            onChangeText={setHeight}
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder={t('growth.heightPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
        </View>
      </View>

      <View style={styles.editorActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('editor.cancel')}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold">{t('editor.cancel')}</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('children.save')}
          disabled={!valid}
          onPress={() => valid && onSave(measuredOn, heightCm!, weightKg!)}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.text },
            !valid && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <ThemedText style={[styles.primaryButtonText, { color: theme.background }]}>
            {t('children.save')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '72%',
    minHeight: 320,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#3A3D43',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
    maxHeight: HISTORY_LIST_MAX_HEIGHT,
  },
  listContent: {
    gap: Spacing.two,
  },
  emptyContent: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  row: {
    height: HISTORY_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowDate: {
    minWidth: 92,
    fontVariant: ['tabular-nums'],
  },
  rowValues: {
    flex: 1,
  },
  rowEditIcon: {
    marginLeft: 'auto',
  },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  editor: {
    gap: Spacing.three,
  },
  dateField: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  dateFieldText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  inputField: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: NunitoSans.bold,
    fontVariant: ['tabular-nums'],
  },
  editorActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
