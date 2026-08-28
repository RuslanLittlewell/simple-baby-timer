import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Keyboard, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Spacing } from "@/constants/theme";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { type EventKind, type ProDetails } from "@/lib/activity-store";

import { CARD_HEIGHT } from "../../constants";
import { ExpandedDetails } from "./components/expanded-details";
import { ExpandedFooter } from "./components/expanded-footer";
import { ExpandedHeader } from "./components/expanded-header";
import { PanelActions } from "./components/panel-actions";
import {
  buildProDetails,
  isNightWakingTime,
  parseVolumeMl,
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
  disabled?: boolean;
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
  disabled = false,
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
      <PanelActions
        awakeActive={awakeActive}
        disabled={disabled}
        feedingActive={feedingActive}
        layoutAnimationsReady={layoutAnimationsReady}
        nightWakingVisible={nightWakingVisible}
        settlingActive={settlingActive}
        sleepActive={sleepActive}
        onCaptureRect={captureRect}
        onEventRowTop={setEventRowTop}
        onLogEvent={onLogEvent}
        onOpen={open}
        onSleepRowTop={setSleepRowTop}
        onToggleAwake={onToggleAwake}
        onToggleFeeding={onToggleFeeding}
        onToggleSettling={onToggleSettling}
        onToggleSleep={onToggleSleep}
      />

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
            <ExpandedHeader color={fg} kind={expandedKind} onClose={() => close(false)} />

            <Animated.ScrollView
              style={[styles.details, detailsStyle]}
              contentContainerStyle={styles.detailsContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <ExpandedDetails
                bottleStart={bottleStart}
                color={fg}
                content={content}
                kind={expandedKind}
                mode={mode}
                settlingMethods={settlingMethods}
                side={side}
                sleepPlace={sleepPlace}
                volume={volume}
                onBottleStartChange={setBottleStart}
                onChooseMode={chooseMode}
                onContentChange={setContent}
                onSettlingMethodToggle={toggleSettlingMethod}
                onSideChange={setSide}
                onSleepPlaceChange={setSleepPlace}
                onVolumeChange={setVolume}
              />
            </Animated.ScrollView>

            {(!isFeeding || mode !== null || timerRunning) && (
              <ExpandedFooter
                animatedStyle={detailsStyle}
                canSave={!formSaveDisabled}
                color={fg}
                disabled={disabled}
                saving={saving}
                showBack={isFeeding && mode !== null}
                stopping={stopping}
                onBack={back}
                onPrimaryPress={() => void handlePrimaryPress()}
              />
            )}
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}
