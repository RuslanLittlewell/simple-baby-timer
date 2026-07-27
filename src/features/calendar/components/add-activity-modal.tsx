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
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type ProDetails } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';
import { useT } from '@/state/app-state';

import { combineDayTime, normalizeTimeInput, parseTime } from '../helpers';
import { modalStyles } from '../modal-styles';

type ManualKind = Extract<ActivityKind, 'settling' | 'sleep' | 'awake' | 'feeding'>;
type SelectKey = 'kind' | 'sleepPlace' | 'feedingMode' | 'breastSide' | 'bottleContent';
type SettlingMethod = Extract<ProDetails, { type: 'settling' }>['methods'][number];

const KINDS: ManualKind[] = ['settling', 'sleep', 'awake', 'feeding'];
const SLEEP_PLACES = ['crib', 'stroller', 'carSeat', 'coSleeping', 'carrier'] as const;
const BREAST_SIDES = ['left', 'right', 'both'] as const;
const BOTTLE_CONTENTS = ['formula', 'breastMilk', 'water'] as const;
const SETTLING_METHODS: SettlingMethod[] = [
  'rocking',
  'fitball',
  'inArms',
  'crib',
  'pacifier',
  'whiteNoise',
  'music',
  'swaddling',
  'darkRoom',
  'walk',
  'independent',
];

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
  const [kind, setKind] = useState<ManualKind>('settling');
  const [startInput, setStartInput] = useState('09:00');
  const [endInput, setEndInput] = useState('09:30');
  const [openSelect, setOpenSelect] = useState<SelectKey | null>(null);
  const [sleepPlace, setSleepPlace] = useState<(typeof SLEEP_PLACES)[number]>('crib');
  const [feedingMode, setFeedingMode] = useState<'breast' | 'bottle'>('breast');
  const [breastSide, setBreastSide] = useState<(typeof BREAST_SIDES)[number]>('left');
  const [bottleContent, setBottleContent] =
    useState<(typeof BOTTLE_CONTENTS)[number]>('formula');
  const [volume, setVolume] = useState('');
  const [settlingMethods, setSettlingMethods] = useState<SettlingMethod[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
    setOpenSelect(null);
    setSleepPlace('crib');
    setFeedingMode('breast');
    setBreastSide('left');
    setBottleContent('formula');
    setVolume('');
    setSettlingMethods([]);
    setError('');
    setSaving(false);
  }, [day, visible]);

  const selectStyle = [
    styles.select,
    { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
  ];

  const buildDetails = (): ProDetails | undefined => {
    if (!proActive || kind === 'awake') return undefined;
    if (kind === 'settling') return { type: 'settling', methods: settlingMethods };
    if (kind === 'sleep') return { type: 'sleep', place: sleepPlace };
    if (feedingMode === 'breast') return { type: 'feeding', mode: 'breast', side: breastSide };
    const parsedVolume = Number.parseInt(volume, 10);
    return {
      type: 'feeding',
      mode: 'bottle',
      content: bottleContent,
      volumeMl: Number.isFinite(parsedVolume) && parsedVolume > 0 ? parsedVolume : undefined,
    };
  };

  const submit = async () => {
    const startTime = parseTime(startInput);
    const endTime = parseTime(endInput);
    if (!startTime || !endTime) {
      setError(t('editor.errTimeFormat'));
      return;
    }
    const start = combineDayTime(day.getTime(), startTime);
    const end = combineDayTime(day.getTime(), endTime);
    if (end <= start) {
      setError(t('editor.errEndAfterStart'));
      return;
    }
    setSaving(true);
    try {
      await onSave(kind, start, end, buildDetails());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const Select = ({
    id,
    label,
    value,
    options,
    onSelect,
  }: {
    id: SelectKey;
    label: string;
    value: string;
    options: readonly string[];
    onSelect: (value: string) => void;
  }) => (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpenSelect((current) => (current === id ? null : id))}
        style={selectStyle}>
        <ThemedText type="smallBold">{value}</ThemedText>
        <MaterialCommunityIcons
          name={openSelect === id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.text}
        />
      </Pressable>
      {openSelect === id && (
        <View style={[styles.options, { borderColor: theme.backgroundSelected }]}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                setOpenSelect(null);
              }}
              style={[
                styles.option,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <ThemedText type="small">{option}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            <Select
              id="kind"
              label={t('manual.activity')}
              value={t(`kind.${kind}`)}
              options={KINDS.map((item) => t(`kind.${item}`))}
              onSelect={(label) => {
                const index = KINDS.findIndex((item) => t(`kind.${item}`) === label);
                setKind(KINDS[Math.max(0, index)]);
              }}
            />

            <View style={styles.timeRow}>
              {[
                [t('editor.start'), startInput, setStartInput],
                [t('editor.end'), endInput, setEndInput],
              ].map(([label, value, setter]) => (
                <View key={label as string} style={[styles.field, styles.timeField]}>
                  <ThemedText type="small" themeColor="textSecondary">{label as string}</ThemedText>
                  <TextInput
                    value={value as string}
                    onChangeText={(next) => {
                      (setter as (value: string) => void)(normalizeTimeInput(next));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="00:00"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  />
                </View>
              ))}
            </View>

            {proActive && kind !== 'awake' && (
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
                                borderColor: selected ? theme.text : theme.backgroundSelected,
                              },
                            ]}>
                            <ThemedText type="small">{t(`pro.${method}`)}</ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {kind === 'sleep' && (
                  <Select
                    id="sleepPlace"
                    label={t('manual.place')}
                    value={t(`pro.${sleepPlace}`)}
                    options={SLEEP_PLACES.map((item) => t(`pro.${item}`))}
                    onSelect={(label) => {
                      const place = SLEEP_PLACES.find((item) => t(`pro.${item}`) === label);
                      if (place) setSleepPlace(place);
                    }}
                  />
                )}

                {kind === 'feeding' && (
                  <>
                    <Select
                      id="feedingMode"
                      label={t('manual.feedingType')}
                      value={t(`pro.${feedingMode}`)}
                      options={['breast', 'bottle'].map((item) => t(`pro.${item}`))}
                      onSelect={(label) =>
                        setFeedingMode(label === t('pro.bottle') ? 'bottle' : 'breast')
                      }
                    />
                    {feedingMode === 'breast' ? (
                      <Select
                        id="breastSide"
                        label={t('manual.side')}
                        value={t(`pro.${breastSide}`)}
                        options={BREAST_SIDES.map((item) => t(`pro.${item}`))}
                        onSelect={(label) => {
                          const side = BREAST_SIDES.find((item) => t(`pro.${item}`) === label);
                          if (side) setBreastSide(side);
                        }}
                      />
                    ) : (
                      <>
                        <Select
                          id="bottleContent"
                          label={t('manual.content')}
                          value={t(`pro.${bottleContent}`)}
                          options={BOTTLE_CONTENTS.map((item) => t(`pro.${item}`))}
                          onSelect={(label) => {
                            const content = BOTTLE_CONTENTS.find(
                              (item) => t(`pro.${item}`) === label,
                            );
                            if (content) setBottleContent(content);
                          }}
                        />
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

            {!proActive && (
              <ThemedText type="small" themeColor="textSecondary">
                {t('manual.proRequired')}
              </ThemedText>
            )}
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
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
  },
  select: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  options: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
  option: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timeField: {
    flex: 1,
  },
  input: {
    minHeight: 46,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
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
  error: {
    color: '#FF6B6B',
  },
  save: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
