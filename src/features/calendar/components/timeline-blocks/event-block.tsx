import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { type ActivitySession } from "@/lib/activity-store";

import {
  KIND_META,
  MIN_EVENT_HEIGHT,
  SCREEN_WIDTH,
  STRIPE_PITCH,
  STRIPE_SKEW,
} from "../../constants";
import { laneLeft, type Translate } from "../../helpers";
import { eventBlockHeight, eventStripeCount } from "./helpers";
import { styles } from "./styles";
import { type SessionLayout } from "./types";

interface EventBlockProps {
  session: ActivitySession;
  layout: SessionLayout;
  hourHeight: number;
  stripeColor: string;
  foregroundColor: string;
  themeMode: string;
  onEdit: (entry: ActivitySession) => void;
  t: Translate;
}

export function EventBlock({
  session,
  layout,
  hourHeight,
  stripeColor,
  foregroundColor,
  themeMode,
  onEdit,
  t,
}: EventBlockProps) {
  const meta = KIND_META[session.kind];
  const height = eventBlockHeight(
    layout.spanHeight,
    hourHeight,
    MIN_EVENT_HEIGHT,
  );
  const blockWidth = SCREEN_WIDTH - laneLeft(session.kind) - Spacing.two;
  const stripes = eventStripeCount(blockWidth, height, STRIPE_PITCH);
  const isPoop = session.kind === "poop";
  const isNightWaking = session.kind === "nightWaking";
  const stripeSkew = isPoop ? "45deg" : STRIPE_SKEW;
  const iconColor = isNightWaking
    ? foregroundColor
    : isPoop && themeMode === "dark"
      ? "#FFFFFF"
      : "#000000";

  return (
    <Pressable
      accessibilityLabel={t("editor.editLabel", {
        label: t(`kind.${session.kind}`),
      })}
      onPress={() => onEdit(session)}
      style={({ pressed }) => [
        styles.eventBlock,
        isPoop && styles.poopEventBlock,
        isNightWaking && styles.nightWakingEventBlock,
        { top: layout.top, height, left: laneLeft(session.kind) },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.eventStripes} pointerEvents="none">
        {Array.from({ length: stripes }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.eventStripe,
              {
                left: index * STRIPE_PITCH - height,
                backgroundColor: stripeColor,
                transform: [{ skewX: stripeSkew }],
              },
            ]}
          />
        ))}
      </View>
      <MaterialCommunityIcons name={meta.icon} size={17} color={iconColor} />
    </Pressable>
  );
}
