import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { type EventKind, type ProDetails } from '@/lib/activity-store';
import { useT } from '@/state/app-state';

import { EVENTS, MAIN_ACTIVITIES } from '../constants';
import { ActivityRow } from './activity-row';
import { EventTile } from './event-tile';

type FeedingMode = 'breast' | 'bottle';
type BreastSide = 'left' | 'right' | 'both';
type BottleContent = 'formula' | 'breastMilk' | 'water';
type ProKind = 'settling' | 'sleep' | 'feeding';
type SleepPlace = 'crib' | 'stroller' | 'carSeat' | 'coSleeping' | 'carrier';
type SettlingMethod = Extract<ProDetails, { type: 'settling' }>['methods'][number];

const SETTLING_METHODS: SettlingMethod[][] = [
  ['rocking', 'fitball', 'inArms'],
  ['crib', 'pacifier', 'whiteNoise'],
  ['music', 'swaddling', 'darkRoom'],
  ['walk', 'independent'],
];
const PANEL_GAP = Spacing.two;
const EVENT_GAP = Spacing.two;

interface ProActivityPanelProps {
  feedingActive: boolean;
  settlingActive: boolean;
  sleepActive: boolean;
  awakeActive: boolean;
  onToggleFeeding: () => void | Promise<void>;
  onToggleSettling: () => void | Promise<void>;
  onToggleSleep: () => void | Promise<void>;
  onToggleAwake: () => void | Promise<void>;
  onLogEvent: (kind: EventKind) => void | Promise<void>;
  onDetailsChange: (details: ProDetails) => void;
  dismissSignal: number;
  onExpandedChange: (expanded: boolean) => void;
}

export function ProActivityPanel({
  feedingActive,
  settlingActive,
  sleepActive,
  awakeActive,
  onToggleFeeding,
  onToggleSettling,
  onToggleSleep,
  onToggleAwake,
  onLogEvent,
  onDetailsChange,
  dismissSignal,
  onExpandedChange,
}: ProActivityPanelProps) {
  const t = useT();
  const [expandedKind, setExpandedKind] = useState<ProKind | null>(null);
  const [mode, setMode] = useState<FeedingMode>('breast');
  const [side, setSide] = useState<BreastSide>('left');
  const [content, setContent] = useState<BottleContent>('formula');
  const [volume, setVolume] = useState('');
  const [sleepPlace, setSleepPlace] = useState<SleepPlace>('crib');
  const [settlingMethods, setSettlingMethods] = useState<SettlingMethod[]>([]);
  const [panelSize, setPanelSize] = useState({ width: 1, height: 1 });
  const expansion = useSharedValue(0);
  const expanded = expandedKind !== null;
  const isSleep = expandedKind === 'sleep';
  const isSettling = expandedKind === 'settling';
  const fg = isSettling
    ? ACTIVITY_FG.settling
    : isSleep
      ? ACTIVITY_FG.sleep
      : ACTIVITY_FG.feed;

  const open = async (kind: ProKind) => {
    if (kind === 'settling' && !settlingActive) await onToggleSettling();
    if (kind === 'sleep' && !sleepActive) await onToggleSleep();
    if (kind === 'feeding' && !feedingActive) await onToggleFeeding();
    setExpandedKind(kind);
    onExpandedChange(true);
    expansion.value = withTiming(1, { duration: 420 });
  };

  const finishClose = () => {
    setExpandedKind(null);
    onExpandedChange(false);
  };

  const close = (stopTimer: boolean) => {
    if (stopTimer && expandedKind === 'settling' && settlingActive) void onToggleSettling();
    if (stopTimer && expandedKind === 'sleep' && sleepActive) void onToggleSleep();
    if (stopTimer && expandedKind === 'feeding' && feedingActive) void onToggleFeeding();
    expansion.value = withTiming(0, { duration: 360 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  useEffect(() => {
    if (expanded && dismissSignal > 0) close(false);
    // A changed signal represents a new outside press.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissSignal]);

  useEffect(() => {
    if (expandedKind === 'settling') {
      onDetailsChange({ type: 'settling', methods: settlingMethods });
    } else if (expandedKind === 'sleep') {
      onDetailsChange({ type: 'sleep', place: sleepPlace });
    } else if (expandedKind === 'feeding' && mode === 'breast') {
      onDetailsChange({ type: 'feeding', mode: 'breast', side });
    } else if (expandedKind === 'feeding') {
      const parsedVolume = Number.parseInt(volume, 10);
      onDetailsChange({
        type: 'feeding',
        mode: 'bottle',
        content,
        volumeMl: Number.isFinite(parsedVolume) && parsedVolume > 0 ? parsedVolume : undefined,
      });
    }
  }, [
    content,
    expandedKind,
    mode,
    onDetailsChange,
    settlingMethods,
    side,
    sleepPlace,
    volume,
  ]);

  const overlayStyle = useAnimatedStyle(() => {
    const fullWidthOrigin = isSleep || isSettling;
    const buttonLeft = fullWidthOrigin
      ? 0
      : panelSize.width * 0.2 + EVENT_GAP * 0.6;
    const buttonWidth = fullWidthOrigin
      ? panelSize.width
      : panelSize.width * 0.6 - EVENT_GAP * 1.2;
    const buttonHeight = 76;
    return {
      left: interpolate(expansion.value, [0, 1], [buttonLeft, 0]),
      top: interpolate(
        expansion.value,
        [0, 1],
        [
          isSettling
            ? 0
            : isSleep
              ? buttonHeight + PANEL_GAP
              : Math.max(0, panelSize.height - buttonHeight),
          0,
        ],
      ),
      width: interpolate(expansion.value, [0, 1], [buttonWidth, panelSize.width]),
      height: interpolate(expansion.value, [0, 1], [buttonHeight, panelSize.height]),
      borderRadius: interpolate(expansion.value, [0, 1], [Spacing.four, Spacing.four]),
    };
  }, [isSettling, isSleep, panelSize]);

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0.88, 0.995], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(expansion.value, [0.88, 1], [8, 0], 'clamp') },
    ],
  }));

  return (
    <View
      style={styles.panel}
      onLayout={(event) =>
        setPanelSize({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }>
      <ActivityRow
        icon="weather-sunset-down"
        gradKey="settling"
        label={t('kind.settling')}
        isActive={settlingActive}
        onStop={() => void onToggleSettling()}
        onPress={() => void open('settling')}
      />
      <ActivityRow
        icon={MAIN_ACTIVITIES[0].icon}
        gradKey={MAIN_ACTIVITIES[0].gradKey}
        label={t('kind.sleep')}
        isActive={sleepActive}
        onStop={() => void onToggleSleep()}
        onPress={() => void open('sleep')}
      />
      <ActivityRow
        icon={MAIN_ACTIVITIES[1].icon}
        gradKey={MAIN_ACTIVITIES[1].gradKey}
        label={t('kind.awake')}
        isActive={awakeActive}
        onPress={() => {
          void onToggleAwake();
        }}
      />
      <View style={styles.eventRow}>
        <View style={styles.eventNarrow}>
          <EventTile
            icon={EVENTS[0].icon}
            gradKey={EVENTS[0].gradKey}
            accessibilityLabel={t(`kind.${EVENTS[0].id}`)}
            onPress={() => void onLogEvent(EVENTS[0].id)}
          />
        </View>
        <View style={styles.eventWide}>
          <ActivityRow
            icon="baby-bottle-outline"
            gradKey="feed"
            label={t('pro.feeding')}
            isActive={feedingActive}
            onStop={() => void onToggleFeeding()}
            onPress={() => void open('feeding')}
          />
        </View>
        <View style={styles.eventNarrow}>
          <EventTile
            icon={EVENTS[1].icon}
            gradKey={EVENTS[1].gradKey}
            accessibilityLabel={t(`kind.${EVENTS[1].id}`)}
            onPress={() => void onLogEvent(EVENTS[1].id)}
          />
        </View>
      </View>

      {expanded && (
        <Animated.View
          style={[styles.overlay, overlayStyle]}
          onTouchEnd={(event) => event.stopPropagation()}>
          <LinearGradient
            colors={
              ACTIVITY_GRADIENTS[isSettling ? 'settling' : isSleep ? 'sleep' : 'feed']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <Pressable onPress={() => close(false)} style={styles.header}>
              <MaterialCommunityIcons
                name={
                  isSettling
                    ? 'weather-sunset-down'
                    : isSleep
                      ? 'moon-waning-crescent'
                      : 'baby-bottle-outline'
                }
                size={26}
                color={fg}
              />
              <ThemedText style={[styles.title, { color: fg }]}>
                {t(isSettling ? 'pro.settling' : isSleep ? 'pro.sleep' : 'pro.feeding')}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={(event) => {
                  event.stopPropagation();
                  close(true);
                }}>
                <MaterialCommunityIcons name="stop-circle" size={28} color={fg} />
              </Pressable>
            </Pressable>

            <Animated.View style={[styles.details, detailsStyle]}>
              {isSettling ? (
                <View style={styles.sleepOptions}>
                  {SETTLING_METHODS.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.options}>
                      {row.map((method) => {
                        const selected = settlingMethods.includes(method);
                        return (
                          <Choice
                            key={method}
                            tone="sleep"
                            label={t(`pro.${method}`)}
                            selected={selected}
                            multiline
                            onPress={() =>
                              setSettlingMethods((current) =>
                                selected
                                  ? current.filter((item) => item !== method)
                                  : [...current, method],
                              )
                            }
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              ) : isSleep ? (
                <View style={styles.sleepOptions}>
                  <View style={styles.options}>
                    <Choice
                      tone="sleep"
                      icon="bed-single-outline"
                      label={t('pro.crib')}
                      selected={sleepPlace === 'crib'}
                      onPress={() => setSleepPlace('crib')}
                    />
                    <Choice
                      tone="sleep"
                      icon="baby-carriage"
                      label={t('pro.stroller')}
                      selected={sleepPlace === 'stroller'}
                      onPress={() => setSleepPlace('stroller')}
                    />
                    <Choice
                      tone="sleep"
                      icon="car-child-seat"
                      label={t('pro.carSeat')}
                      selected={sleepPlace === 'carSeat'}
                      onPress={() => setSleepPlace('carSeat')}
                    />
                  </View>
                  <View style={styles.options}>
                    <Choice
                      tone="sleep"
                      icon="bed-double-outline"
                      label={t('pro.coSleeping')}
                      selected={sleepPlace === 'coSleeping'}
                      onPress={() => setSleepPlace('coSleeping')}
                    />
                    <Choice
                      tone="sleep"
                      icon="baby-face-outline"
                      label={t('pro.carrier')}
                      selected={sleepPlace === 'carrier'}
                      onPress={() => setSleepPlace('carrier')}
                    />
                  </View>
                </View>
              ) : (
                <>
              <View style={styles.segment}>
                <Choice
                  icon="mother-heart"
                  label={t('pro.breast')}
                  selected={mode === 'breast'}
                  onPress={() => setMode('breast')}
                />
                <Choice
                  icon="baby-bottle-outline"
                  label={t('pro.bottle')}
                  selected={mode === 'bottle'}
                  onPress={() => setMode('bottle')}
                />
              </View>

              {mode === 'breast' ? (
                <View style={styles.options}>
                  <Choice
                    label={t('pro.left')}
                    selected={side === 'left'}
                    onPress={() => setSide('left')}
                  />
                  <Choice
                    label={t('pro.right')}
                    selected={side === 'right'}
                    onPress={() => setSide('right')}
                  />
                  <Choice
                    label={t('pro.both')}
                    selected={side === 'both'}
                    onPress={() => setSide('both')}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.options}>
                    <Choice
                      label={t('pro.formula')}
                      selected={content === 'formula'}
                      onPress={() => setContent('formula')}
                    />
                    <Choice
                      label={t('pro.breastMilk')}
                      selected={content === 'breastMilk'}
                      onPress={() => setContent('breastMilk')}
                    />
                    <Choice
                      label={t('pro.water')}
                      selected={content === 'water'}
                      onPress={() => setContent('water')}
                    />
                  </View>
                  <View>
                    <TextInput
                      value={volume}
                      onChangeText={(value) => setVolume(value.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      placeholder={t('pro.volume')}
                      placeholderTextColor="rgba(62,45,25,0.58)"
                      style={[styles.volume, { color: fg }]}
                    />
                  </View>
                </>
              )}
                </>
              )}
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

interface ChoiceProps {
  tone?: 'feed' | 'sleep';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  selected: boolean;
  multiline?: boolean;
  onPress: () => void;
}

function Choice({ tone = 'feed', icon, label, selected, multiline, onPress }: ChoiceProps) {
  const sleep = tone === 'sleep';
  const contentColor = sleep && !selected ? '#FFFFFF' : '#3E2D19';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        sleep && styles.choiceSleep,
        selected && (sleep ? styles.choiceSleepSelected : styles.choiceSelected),
        pressed && styles.pressed,
      ]}>
      {icon && <MaterialCommunityIcons name={icon} size={20} color={contentColor} />}
      <ThemedText
        style={[styles.choiceText, { color: contentColor }]}
        numberOfLines={multiline ? 2 : 1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    gap: PANEL_GAP,
  },
  eventRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: EVENT_GAP,
  },
  eventNarrow: {
    flex: 2,
  },
  eventWide: {
    flex: 6,
  },
  overlay: {
    position: 'absolute',
    zIndex: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  details: {
    flex: 1,
    gap: Spacing.two,
  },
  sleepOptions: {
    flex: 1,
    gap: Spacing.two,
  },
  options: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  choice: {
    flex: 1,
    minHeight: 38,
    gap: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(122, 78, 45, 0.58)',
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  choiceSelected: {
    borderWidth: 2,
    borderColor: '#7A4E2D',
    backgroundColor: 'rgba(255,248,235,0.92)',
  },
  choiceSleep: {
    borderColor: 'rgba(255,255,255,0.62)',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  choiceSleepSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  choiceText: {
    color: '#3E2D19',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  volume: {
    minHeight: 42,
    borderWidth: 1.5,
    borderColor: '#7A4E2D',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
