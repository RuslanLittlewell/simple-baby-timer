import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutRight,
  LinearTransition,
} from "react-native-reanimated";

import { type EventKind } from "@/lib/activity-store";
import { useT } from "@/state/app-state";

import {
  AWAKE_ACTIVITY,
  EVENTS,
  NIGHT_WAKING_EVENT,
  SLEEP_ACTIVITY,
} from "../../../constants";
import { ActivityRow } from "../../activity-row";
import { EventTile } from "../../event-tile";
import { type ProKind } from "../helpers";
import { styles } from "../styles";
import { NightWakingButton } from "./night-waking-button";

interface PanelActionsProps {
  awakeActive: boolean;
  disabled: boolean;
  feedingActive: boolean;
  layoutAnimationsReady: boolean;
  nightWakingVisible: boolean;
  settlingActive: boolean;
  sleepActive: boolean;
  onCaptureRect: (kind: ProKind) => (event: LayoutChangeEvent) => void;
  onEventRowTop: (top: number) => void;
  onLogEvent: (kind: EventKind) => void | Promise<void>;
  onOpen: (kind: ProKind) => void;
  onSleepRowTop: (top: number) => void;
  onToggleAwake: () => void | Promise<void>;
  onToggleFeeding: () => void | Promise<void>;
  onToggleSettling: () => void | Promise<void>;
  onToggleSleep: () => void | Promise<void>;
}

export function PanelActions(props: PanelActionsProps) {
  const t = useT();
  const transition = props.layoutAnimationsReady
    ? LinearTransition.duration(280)
    : undefined;

  return (
    <>
      <View onLayout={props.onCaptureRect("settling")}>
        <ActivityRow
          disabled={props.disabled}
          icon="sleep"
          gradKey="settling"
          label={t("kind.settling")}
          isActive={props.settlingActive}
          onStop={() => void props.onToggleSettling()}
          onPress={() => props.onOpen("settling")}
        />
      </View>
      <Animated.View
        style={styles.sleepActionRow}
        layout={transition}
        onLayout={(event) => props.onSleepRowTop(event.nativeEvent.layout.y)}
      >
        <Animated.View
          style={styles.sleepActionMain}
          layout={transition}
          onLayout={props.onCaptureRect("sleep")}
        >
          <ActivityRow
            disabled={props.disabled}
            icon={SLEEP_ACTIVITY.icon}
            gradKey={SLEEP_ACTIVITY.gradKey}
            label={t("kind.sleep")}
            isActive={props.sleepActive}
            onStop={() => void props.onToggleSleep()}
            onPress={() => props.onOpen("sleep")}
          />
        </Animated.View>
        {props.nightWakingVisible && (
          <Animated.View
            entering={
              props.layoutAnimationsReady
                ? FadeInRight.duration(240)
                : undefined
            }
            exiting={
              props.layoutAnimationsReady
                ? FadeOutRight.duration(200)
                : undefined
            }
            layout={transition}
            style={styles.nightWakingSlot}
          >
            <NightWakingButton
              disabled={props.disabled}
              onPress={() => void props.onLogEvent(NIGHT_WAKING_EVENT.id)}
            />
          </Animated.View>
        )}
      </Animated.View>
      <ActivityRow
        disabled={props.disabled}
        icon={AWAKE_ACTIVITY.icon}
        gradKey={AWAKE_ACTIVITY.gradKey}
        label={t("kind.awake")}
        isActive={props.awakeActive}
        onPress={() => void props.onToggleAwake()}
      />
      <View
        style={styles.eventRow}
        onLayout={(event) => props.onEventRowTop(event.nativeEvent.layout.y)}
      >
        <View
          style={styles.eventWide}
          onLayout={props.onCaptureRect("feeding")}
        >
          <ActivityRow
            disabled={props.disabled}
            icon="baby-bottle-outline"
            gradKey="feed"
            label={t("pro.feeding")}
            isActive={props.feedingActive}
            onStop={() => void props.onToggleFeeding()}
            onPress={() => props.onOpen("feeding")}
          />
        </View>
        {EVENTS.slice(0, 2).map((event) => (
          <View key={event.id} style={styles.eventNarrow}>
            <EventTile
              disabled={props.disabled}
              icon={event.icon}
              gradKey={event.gradKey}
              accessibilityLabel={t(`kind.${event.id}`)}
              onPress={() => void props.onLogEvent(event.id)}
            />
          </View>
        ))}
      </View>
    </>
  );
}
