import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  cancelAnimation,
  FadeInRight,
  FadeOutRight,
  LinearTransition,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { WheelField } from "@/components/wheel-field";
import { Spacing } from "@/constants/theme";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { type EventKind, type ProDetails } from "@/lib/activity-store";
import { useT } from "@/state/app-state";

import {
  AWAKE_ACTIVITY,
  CARD_HEIGHT,
  EVENTS,
  NIGHT_WAKING_EVENT,
  SLEEP_ACTIVITY,
} from "../../constants";
import { ActivityRow } from "../activity-row";
import { EventTile } from "../event-tile";
import {
  buildProDetails,
  formatClock,
  isNightWakingTime,
  parseVolumeMl,
  SETTLING_METHODS,
  toggleInSettlingMethods,
  withAlpha,
  type BottleContent,
  type BreastSide,
  type FeedingMode,
  type ProKind,
  type SettlingMethod,
  type SleepPlace,
} from "./helpers";
import { styles } from "./styles";




interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  onLogBottleFeeding: (
    startedAt: number,
    content: BottleContent,
    volumeMl?: number,
  ) => void | Promise<void>;
  
  
  onSaveMainActivity: (
    kind: "settling" | "sleep",
    details: ProDetails,
  ) => Promise<boolean>;
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
  onLogBottleFeeding,
  onSaveMainActivity,
  onDetailsChange,
  dismissSignal,
  onExpandedChange,
}: ProActivityPanelProps) {
  const t = useT();
  const { gradients, fg: fgColors, accent: accentColors } = useActivityColors();
  const cardRadius = 20;
  const [expandedKind, setExpandedKind] = useState<ProKind | null>(null);
  const [nightWakingVisible, setNightWakingVisible] = useState(
    isNightWakingTime,
  );
  const [layoutAnimationsReady, setLayoutAnimationsReady] = useState(false);
  
  const [mode, setMode] = useState<FeedingMode | null>(null);
  const [side, setSide] = useState<BreastSide | null>(null);
  const [bottleStart, setBottleStart] = useState(() => new Date());
  const [content, setContent] = useState<BottleContent>("formula");
  const [volume, setVolume] = useState("");
  const [sleepPlace, setSleepPlace] = useState<SleepPlace>("crib");
  const [settlingMethods, setSettlingMethods] = useState<SettlingMethod[]>([]);
  const [saving, setSaving] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 1, height: 1 });
  const [rects, setRects] = useState<Partial<Record<ProKind, Rect>>>({});
  const [sleepRowTop, setSleepRowTop] = useState(0);
  const [eventRowTop, setEventRowTop] = useState(0);
  const expansion = useSharedValue(0);
  
  const lift = useSharedValue(0);
  const cardRef = useRef<View>(null);
  const savingRef = useRef(false);
  const expanded = expandedKind !== null;
  const isSleep = expandedKind === "sleep";
  const isSettling = expandedKind === "settling";
  const expandedGradKey = isSettling ? "settling" : isSleep ? "sleep" : "feed";
  const fg = fgColors[expandedGradKey];
  const timerRunning = isSettling
    ? settlingActive
    : isSleep
      ? sleepActive
      : feedingActive;
  const isFeeding = expandedKind === "feeding";
  
  const formSaveDisabled = isFeeding && mode === "breast" && !side;
  
  
  
  const stopping = timerRunning && !(isFeeding && mode === "bottle");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLayoutAnimationsReady(true));
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimation(expansion);
      cancelAnimation(lift);
    };
  }, [expansion, lift]);

  useEffect(() => {
    const updateVisibility = () => setNightWakingVisible(isNightWakingTime());
    updateVisibility();
    const interval = setInterval(updateVisibility, 30_000);
    return () => clearInterval(interval);
  }, []);

  const captureRect = (kind: ProKind) => (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    const next: Rect = { x, y, width, height };
    setRects((current) => {
      const previous = current[kind];
      if (
        previous &&
        previous.x === next.x &&
        previous.y === next.y &&
        previous.width === next.width &&
        previous.height === next.height
      ) {
        return current;
      }
      return { ...current, [kind]: next };
    });
  };

  
  const open = (kind: ProKind) => {
    if (kind === "feeding") {
      setMode(null);
      setSide(null);
      setContent("formula");
      setVolume("");
    }
    setExpandedKind(kind);
    onExpandedChange(true);
    expansion.value = withTiming(1, { duration: 420 });
  };

  
  
  const chooseMode = (next: FeedingMode) => {
    setMode(next);
    if (next === "bottle") setBottleStart(new Date());
  };

  const back = () => {
    setMode(null);
    setSide(null);
  };

  const finishClose = () => {
    setExpandedKind(null);
    onExpandedChange(false);
    lift.value = 0;
  };

  const close = (stopTimer: boolean) => {
    if (savingRef.current) return;
    if (stopTimer && expandedKind === "settling" && settlingActive)
      void onToggleSettling();
    if (stopTimer && expandedKind === "sleep" && sleepActive)
      void onToggleSleep();
    if (stopTimer && expandedKind === "feeding" && feedingActive)
      void onToggleFeeding();
    expansion.value = withTiming(0, { duration: 360 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  useEffect(() => {
    if (expanded && dismissSignal > 0) close(false);
    
    
  }, [dismissSignal]);

  
  
  
  useEffect(() => {
    if (!expanded) return;
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      cardRef.current?.measureInWindow((_x, y, _width, height) => {
        
        const overlap = y + height + Spacing.two - event.endCoordinates.screenY;
        lift.value = withTiming(Math.max(0, lift.value + overlap), {
          duration: 220,
        });
      });
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      lift.value = withTiming(0, { duration: 220 });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [expanded, lift]);

  const volumeMl = parseVolumeMl(volume);

  
  
  const save = async (kind: ProKind | null) => {
    if (!kind) return false;
    const details = buildProDetails(kind, {
      settlingMethods,
      sleepPlace,
      mode,
      side,
      content,
      volumeMl,
    });
    if (!details) return false;
    if (kind === "feeding" && mode === "bottle") {
      await onLogBottleFeeding(bottleStart.getTime(), content, volumeMl);
      return true;
    }
    if (kind === "settling" || kind === "sleep") {
      
      
      return onSaveMainActivity(kind, details);
    }
    if (kind === "feeding" && !feedingActive) {
      await onToggleFeeding();
    }
    onDetailsChange(details);
    return true;
  };

  const stopExpandedTimer = async (kind: ProKind | null) => {
    if (kind === "settling" && settlingActive) await onToggleSettling();
    if (kind === "sleep" && sleepActive) await onToggleSleep();
    if (kind === "feeding" && feedingActive) await onToggleFeeding();
  };

  const handlePanelLayout = (event: LayoutChangeEvent) => {
    setPanelSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  const handleClosePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    close(false);
  };

  const toggleSettlingMethod = (method: SettlingMethod) => {
    setSettlingMethods((current) =>
      toggleInSettlingMethods(current, method),
    );
  };

  const handlePrimaryPress = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    let succeeded = false;
    try {
      if (stopping) {
        await stopExpandedTimer(expandedKind);
        succeeded = true;
      } else {
        succeeded = await save(expandedKind);
      }
    } catch {
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
    if (succeeded) close(false);
  };

  const measuredRect = expandedKind ? rects[expandedKind] : undefined;
  
  const originRect = measuredRect
    ? expandedKind === "feeding"
      ? { ...measuredRect, y: measuredRect.y + eventRowTop }
      : expandedKind === "sleep"
        ? { ...measuredRect, y: measuredRect.y + sleepRowTop }
      : measuredRect
    : undefined;

  const overlayStyle = useAnimatedStyle(() => {
    const origin = originRect ?? {
      x: 0,
      y: 0,
      width: panelSize.width,
      height: CARD_HEIGHT,
    };
    return {
      left: interpolate(expansion.value, [0, 1], [origin.x, 0]),
      top: interpolate(expansion.value, [0, 1], [origin.y, 0]),
      width: interpolate(
        expansion.value,
        [0, 1],
        [origin.width, panelSize.width],
      ),
      height: interpolate(
        expansion.value,
        [0, 1],
        [origin.height, panelSize.height],
      ),
      borderRadius: cardRadius,
      transform: [{ translateY: -lift.value }],
    };
  }, [cardRadius, originRect, panelSize]);

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0.88, 0.995], [0, 1], "clamp"),
    transform: [
      { translateY: interpolate(expansion.value, [0.88, 1], [8, 0], "clamp") },
    ],
  }));

  return (
    <View style={styles.panel} onLayout={handlePanelLayout}>
      <View onLayout={captureRect("settling")}>
        <ActivityRow
          icon="sleep"
          gradKey="settling"
          label={t("kind.settling")}
          isActive={settlingActive}
          onStop={() => void onToggleSettling()}
          onPress={() => open("settling")}
        />
      </View>
      <Animated.View
        style={styles.sleepActionRow}
        layout={layoutAnimationsReady ? LinearTransition.duration(280) : undefined}
        onLayout={(event) => setSleepRowTop(event.nativeEvent.layout.y)}
      >
        <Animated.View
          style={styles.sleepActionMain}
          layout={layoutAnimationsReady ? LinearTransition.duration(280) : undefined}
          onLayout={captureRect("sleep")}
        >
          <ActivityRow
            icon={SLEEP_ACTIVITY.icon}
            gradKey={SLEEP_ACTIVITY.gradKey}
            label={t("kind.sleep")}
            isActive={sleepActive}
            onStop={() => void onToggleSleep()}
            onPress={() => open("sleep")}
          />
        </Animated.View>
        {nightWakingVisible && (
          <Animated.View
            entering={layoutAnimationsReady ? FadeInRight.duration(240) : undefined}
            exiting={layoutAnimationsReady ? FadeOutRight.duration(200) : undefined}
            layout={layoutAnimationsReady ? LinearTransition.duration(280) : undefined}
            style={styles.nightWakingSlot}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("kind.nightWaking")}
              onPress={() => void onLogEvent(NIGHT_WAKING_EVENT.id)}
              style={({ pressed }) => [
                styles.nightWakingPressable,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={gradients[NIGHT_WAKING_EVENT.gradKey]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.nightWakingButton,
                  {
                    borderColor: withAlpha(
                      accentColors[NIGHT_WAKING_EVENT.gradKey],
                      0.68,
                    ),
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={NIGHT_WAKING_EVENT.icon}
                  size={24}
                  color={fgColors[NIGHT_WAKING_EVENT.gradKey]}
                />
                <ThemedText
                  numberOfLines={2}
                  style={[
                    styles.nightWakingLabel,
                    { color: fgColors[NIGHT_WAKING_EVENT.gradKey] },
                  ]}
                >
                  {t("kind.nightWaking")}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
      <ActivityRow
        icon={AWAKE_ACTIVITY.icon}
        gradKey={AWAKE_ACTIVITY.gradKey}
        label={t("kind.awake")}
        isActive={awakeActive}
        onPress={() => void onToggleAwake()}
      />
      <View
        style={styles.eventRow}
        onLayout={(event) => setEventRowTop(event.nativeEvent.layout.y)}
      >
        <View style={styles.eventWide} onLayout={captureRect("feeding")}>
          <ActivityRow
            icon="baby-bottle-outline"
            gradKey="feed"
            label={t("pro.feeding")}
            isActive={feedingActive}
            onStop={() => void onToggleFeeding()}
            onPress={() => open("feeding")}
          />
        </View>
        <View style={styles.eventNarrow}>
          <EventTile
            icon={EVENTS[0].icon}
            gradKey={EVENTS[0].gradKey}
            accessibilityLabel={t(`kind.${EVENTS[0].id}`)}
            onPress={() => void onLogEvent(EVENTS[0].id)}
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
          ref={cardRef}
          style={[styles.overlay, overlayStyle]}
          onTouchEnd={(event) => event.stopPropagation()}
        >
          <LinearGradient
            colors={gradients[expandedGradKey]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.card,
              {
                borderColor: withAlpha(accentColors[expandedGradKey], 0.68),
                borderRadius: cardRadius,
              },
            ]}
          >
            <Pressable onPress={() => close(false)} style={styles.header}>
              <MaterialCommunityIcons
                name={
                  isSettling
                    ? "sleep"
                    : isSleep
                      ? "moon-waning-crescent"
                      : "baby-bottle-outline"
                }
                size={26}
                color={fg}
              />
              <ThemedText style={[styles.title, { color: fg }]}>
                {t(
                  isSettling
                    ? "pro.settling"
                    : isSleep
                      ? "pro.sleep"
                      : "pro.feeding",
                )}
              </ThemedText>
              
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("editor.cancel")}
                hitSlop={10}
                onPress={handleClosePress}
                style={[
                  styles.closeButton,
                  {
                    borderColor: withAlpha(fg, 0.34),
                    backgroundColor: withAlpha(fg, 0.14),
                  },
                ]}
              >
                <MaterialCommunityIcons name="close" size={26} color={fg} />
              </Pressable>
            </Pressable>

            <Animated.ScrollView
              style={[styles.details, detailsStyle]}
              contentContainerStyle={styles.detailsContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
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
                            onPress={() => toggleSettlingMethod(method)}
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
                      label={t("pro.crib")}
                      selected={sleepPlace === "crib"}
                      onPress={() => setSleepPlace("crib")}
                    />
                    <Choice
                      tone="sleep"
                      icon="baby-carriage"
                      label={t("pro.stroller")}
                      selected={sleepPlace === "stroller"}
                      onPress={() => setSleepPlace("stroller")}
                    />
                    <Choice
                      tone="sleep"
                      icon="car-child-seat"
                      label={t("pro.carSeat")}
                      selected={sleepPlace === "carSeat"}
                      onPress={() => setSleepPlace("carSeat")}
                    />
                  </View>
                  <View style={styles.options}>
                    <Choice
                      tone="sleep"
                      icon="bed-double-outline"
                      label={t("pro.coSleeping")}
                      selected={sleepPlace === "coSleeping"}
                      onPress={() => setSleepPlace("coSleeping")}
                    />
                    <Choice
                      tone="sleep"
                      icon="kangaroo"
                      label={t("pro.carrier")}
                      selected={sleepPlace === "carrier"}
                      onPress={() => setSleepPlace("carrier")}
                    />
                    <Choice
                      tone="sleep"
                      icon="mother-heart"
                      label={t("pro.inArms")}
                      selected={sleepPlace === "inArms"}
                      onPress={() => setSleepPlace("inArms")}
                    />
                  </View>
                </View>
              ) : mode === null ? (
                <View style={[styles.step, styles.stepFill]}>
                  <Choice
                    icon="mother-heart"
                    label={t("pro.breast")}
                    selected={false}
                    onPress={() => chooseMode("breast")}
                  />
                  <Choice
                    icon="baby-bottle"
                    label={t("pro.bottle")}
                    selected={false}
                    onPress={() => chooseMode("bottle")}
                  />
                </View>
              ) : mode === "breast" ? (
                <View style={styles.breastSides}>
                  <View style={[styles.step, styles.breastSidesTop]}>
                    <Choice
                      label={t("pro.left")}
                      selected={side === "left"}
                      onPress={() => setSide("left")}
                    />
                    <Choice
                      label={t("pro.right")}
                      selected={side === "right"}
                      onPress={() => setSide("right")}
                    />
                  </View>
                  <View style={[styles.step, styles.breastSidesBottom]}>
                    <Choice
                      label={t("pro.both")}
                      selected={side === "both"}
                      onPress={() => setSide("both")}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.bottle}>
                  <View style={[styles.step, styles.bottleField]}>
                    <WheelField
                      mode="time"
                      value={bottleStart}
                      maximumDate={new Date()}
                      openOnMount
                      displayText={`${t("editor.start")} · ${formatClock(bottleStart)}`}
                      onChange={setBottleStart}
                      style={[
                        styles.wheel,
                        {
                          borderColor: withAlpha(fg, 0.34),
                          backgroundColor: withAlpha(fg, 0.1),
                        },
                      ]}
                      textStyle={[styles.wheelText, { color: fg }]}
                    />
                  </View>
                  <TextInput
                    accessibilityLabel={t("pro.volume")}
                    value={volume}
                    onChangeText={(value) =>
                      setVolume(value.replace(/\D/g, "").slice(0, 4))
                    }
                    keyboardType="number-pad"
                    placeholder={t("pro.volume")}
                    placeholderTextColor="rgba(62,45,25,0.58)"
                    style={[
                      styles.volume,
                      {
                        color: fg,
                        borderColor: withAlpha(fg, 0.34),
                        backgroundColor: withAlpha(fg, 0.1),
                      },
                    ]}
                  />
                  <View style={[styles.step, styles.bottleChoiceRow]}>
                    <Choice
                      label={t("pro.formula")}
                      selected={content === "formula"}
                      onPress={() => setContent("formula")}
                    />
                    <Choice
                      label={t("pro.breastMilk")}
                      selected={content === "breastMilk"}
                      onPress={() => setContent("breastMilk")}
                    />
                  </View>
                </View>
              )}
            </Animated.ScrollView>

            {(!isFeeding || mode !== null || timerRunning) && (
              <Animated.View style={[styles.footer, detailsStyle]}>
                {isFeeding && mode !== null && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={back}
                    style={({ pressed }) => [
                      styles.back,
                      {
                        borderColor: withAlpha(fg, 0.34),
                        backgroundColor: withAlpha(fg, 0.1),
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText style={[styles.backText, { color: fg }]}>
                      {t("pro.back")}
                    </ThemedText>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    busy: saving,
                    disabled: saving || (!stopping && formSaveDisabled),
                  }}
                  disabled={saving || (!stopping && formSaveDisabled)}
                  onPress={() => void handlePrimaryPress()}
                  style={({ pressed }) => [
                    styles.save,
                    {
                      borderColor: "rgba(255,255,255,0.82)",
                      backgroundColor: "#FFFFFF",
                    },
                    (saving || (!stopping && formSaveDisabled)) &&
                      styles.saveDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText style={styles.saveText}>
                    {t(stopping ? "pro.stop" : "editor.save")}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

interface ChoiceProps {
  tone?: "feed" | "sleep";
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  selected: boolean;
  multiline?: boolean;
  onPress: () => void;
}

function Choice({
  tone = "feed",
  icon,
  label,
  selected,
  multiline,
  onPress,
}: ChoiceProps) {
  const { fg } = useActivityColors();
  const sleep = tone === "sleep";
  const ink = fg.sleep;
  const contentColor = !sleep || selected ? "#3E2D19" : ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        sleep && [
          styles.choiceSleep,
          {
            borderColor: withAlpha(ink, 0.62),
            backgroundColor: withAlpha(ink, 0.14),
          },
        ],
        selected &&
          (sleep
            ? [styles.choiceSleepSelected, { borderColor: ink }]
            : styles.choiceSelected),
        pressed && styles.pressed,
      ]}
    >
      {icon && (
        <MaterialCommunityIcons name={icon} size={20} color={contentColor} />
      )}
      <ThemedText
        style={[styles.choiceText, { color: contentColor }]}
        numberOfLines={multiline ? 2 : 1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
