import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
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

import { CARD_HEIGHT, EVENTS, MAIN_ACTIVITIES } from "../constants";
import { ActivityRow } from "./activity-row";
import { EventTile } from "./event-tile";

type FeedingMode = "breast" | "bottle";
type BreastSide = "left" | "right" | "both";
type BottleContent = "formula" | "breastMilk";
type ProKind = "settling" | "sleep" | "feeding";
type SleepPlace = Extract<ProDetails, { type: "sleep" }>["place"];
type SettlingMethod = Extract<
  ProDetails,
  { type: "settling" }
>["methods"][number];

const SETTLING_METHODS: SettlingMethod[][] = [
  ["rocking", "fitball", "inArms"],
  ["crib", "pacifier", "whiteNoise"],
  ["music", "swaddling", "darkRoom"],
  ["walk", "independent"],
];
const PANEL_GAP = Spacing.two;
const EVENT_GAP = Spacing.two;

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtClock = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

// Frame of the row that opens a panel, in panel coordinates. The expanding
// card grows out of it, so it is measured rather than derived from the layout
// rules — the bottom row nests its wide tile inside the event row.
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
  ) => Promise<void>;
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
  const { gradients, fg: fgColors } = useActivityColors();
  const [expandedKind, setExpandedKind] = useState<ProKind | null>(null);
  // Feeding opens on the mode step with nothing picked yet.
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
  const [eventRowTop, setEventRowTop] = useState(0);
  const expansion = useSharedValue(0);
  // How far the card is pushed up so the keyboard cannot bury the save button.
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
  // A breast feeding needs a side before it can be started.
  const formSaveDisabled = isFeeding && mode === "breast" && !side;
  // Opening the card of a running timer turns the primary button into a stop.
  // The bottle step is the exception: it is where the volume is typed, so it
  // keeps saving — that attaches the parameters to the feeding under way.
  const stopping = timerRunning && !(isFeeding && mode === "bottle");

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

  // Opening only reveals the options — the timer starts on "save".
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

  // Picking "bottle" reveals the wheel already set to the current time, so
  // saving straight away starts the timer from now.
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
    // A changed signal represents a new outside press.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissSignal]);

  // The card is absolutely positioned inside the panel, so the screen's
  // KeyboardAvoidingView cannot move it — measure how much of it the keyboard
  // covers and slide it up by exactly that.
  useEffect(() => {
    if (!expanded) return;
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      cardRef.current?.measureInWindow((_x, y, _width, height) => {
        // y already includes any lift applied, so the overlap is added to it.
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

  const parsedVolume = Number.parseInt(volume, 10);
  const volumeMl = Number.isFinite(parsedVolume) ? parsedVolume : undefined;

  const buildDetails = (kind: ProKind): ProDetails | null => {
    if (kind === "settling")
      return { type: "settling", methods: settlingMethods };
    if (kind === "sleep") return { type: "sleep", place: sleepPlace };
    if (mode === "breast")
      return side ? { type: "feeding", mode: "breast", side } : null;
    if (mode === "bottle")
      return { type: "feeding", mode: "bottle", content, volumeMl };
    return null;
  };

  // Breast feeding keeps the timer flow. Bottle feeding is written immediately
  // as a fixed-duration event by the parent screen.
  const save = async (kind: ProKind | null) => {
    if (!kind) return;
    const details = buildDetails(kind);
    if (!details) return;
    if (kind === "feeding" && mode === "bottle") {
      await onLogBottleFeeding(bottleStart.getTime(), content, volumeMl);
      return;
    }
    if (kind === "settling" || kind === "sleep") {
      await onSaveMainActivity(kind, details);
      return;
    }
    if (kind === "feeding" && !feedingActive) {
      await onToggleFeeding();
    }
    onDetailsChange(details);
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
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method],
    );
  };

  const handlePrimaryPress = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    let succeeded = false;
    try {
      if (stopping) await stopExpandedTimer(expandedKind);
      else await save(expandedKind);
      succeeded = true;
    } catch {
      // Keep the panel open so the user can retry the rejected operation.
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
    if (succeeded) close(false);
  };

  const measuredRect = expandedKind ? rects[expandedKind] : undefined;
  // The feeding tile is measured inside the event row, so its offset is added.
  const originRect = measuredRect
    ? expandedKind === "feeding"
      ? { ...measuredRect, y: measuredRect.y + eventRowTop }
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
      borderRadius: Spacing.four,
      transform: [{ translateY: -lift.value }],
    };
  }, [originRect, panelSize]);

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
      <View onLayout={captureRect("sleep")}>
        <ActivityRow
          icon={MAIN_ACTIVITIES[0].icon}
          gradKey={MAIN_ACTIVITIES[0].gradKey}
          label={t("kind.sleep")}
          isActive={sleepActive}
          onStop={() => void onToggleSleep()}
          onPress={() => open("sleep")}
        />
      </View>
      <ActivityRow
        icon={MAIN_ACTIVITIES[1].icon}
        gradKey={MAIN_ACTIVITIES[1].gradKey}
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
            style={styles.card}
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
              {/* Stopping lives in the footer button; the header only closes. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("editor.cancel")}
                hitSlop={10}
                onPress={handleClosePress}
              >
                <MaterialCommunityIcons name="close" size={26} color={fg} />
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
                    icon="baby-bottle-outline"
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
                  <View style={styles.step}>
                    <WheelField
                      mode="time"
                      value={bottleStart}
                      maximumDate={new Date()}
                      openOnMount
                      displayText={`${t("editor.start")} · ${fmtClock(bottleStart)}`}
                      onChange={setBottleStart}
                      style={styles.wheel}
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
                    style={[styles.volume, { color: fg }]}
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
            </Animated.View>

            {(!isFeeding || mode !== null || timerRunning) && (
              <Animated.View style={[styles.footer, detailsStyle]}>
                {isFeeding && mode !== null && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={back}
                    style={({ pressed }) => [
                      styles.back,
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

const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

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
  // Sleep chips sit on the sleep gradient, which is deep blue in the dark theme
  // and nearly white in the light one — so their ink follows the palette
  // instead of being hardcoded white, which vanished on the light card.
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

const styles = StyleSheet.create({
  panel: {
    alignSelf: "stretch",
    gap: PANEL_GAP,
  },
  eventRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: EVENT_GAP,
  },
  eventNarrow: {
    flex: 2,
  },
  eventWide: {
    flex: 6,
  },
  overlay: {
    position: "absolute",
    zIndex: 10,
    elevation: 10,
    overflow: "hidden",
  },
  card: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
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
    flexDirection: "row",
    gap: Spacing.two,
  },
  choice: {
    flex: 1,
    minHeight: 38,
    gap: Spacing.one,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(122, 78, 45, 0.58)",
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    backgroundColor: "rgba(255,255,255,0.56)",
  },
  choiceSelected: {
    borderWidth: 2,
    borderColor: "#7A4E2D",
    backgroundColor: "rgba(255,248,235,0.92)",
  },
  choiceSleep: {
    borderColor: "rgba(255,255,255,0.62)",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  choiceSleepSelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  choiceText: {
    color: "#3E2D19",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  // One step of the feeding flow: a row of controls that keeps its natural
  // height instead of stretching over the whole card.
  step: {
    flexDirection: "row",
    gap: Spacing.two,
    minHeight: 48,
  },
  // Feeding steps share out the whole card instead of leaving dead space.
  stepFill: {
    flex: 1,
  },
  breastSides: {
    flex: 1,
    gap: Spacing.two,
  },
  breastSidesTop: {
    flex: 7,
    minHeight: 0,
  },
  breastSidesBottom: {
    flex: 3,
    minHeight: 0,
  },
  bottle: {
    flex: 1,
    gap: Spacing.two,
  },
  bottleChoiceRow: {
    minHeight: 48,
    height: 48,
  },
  wheel: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#7A4E2D",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  wheelText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  volume: {
    minHeight: 100,
    height: 100,
    borderWidth: 1.5,
    borderColor: "#7A4E2D",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  back: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(122, 78, 45, 0.58)",
  },
  backText: {
    fontSize: 15,
    fontWeight: "700",
  },
  save: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: "#3E2D19",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
