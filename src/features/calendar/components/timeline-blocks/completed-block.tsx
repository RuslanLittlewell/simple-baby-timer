import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";

import { type ActivitySession } from "@/lib/activity-store";

import { KIND_META, MIN_EVENT_HEIGHT } from "../../constants";
import { fmtTime, laneLeft, type Translate } from "../../helpers";
import { BlockContent } from "./block-content";
import { blockVisibility, durationBlockHeight } from "./helpers";
import { styles } from "./styles";
import { type SessionLayout, type TimelineGradient } from "./types";

interface CompletedBlockProps {
  session: ActivitySession;
  layout: SessionLayout;
  hourHeight: number;
  gradient: TimelineGradient;
  color: string;
  onEdit: (entry: ActivitySession) => void;
  t: Translate;
}

export function CompletedBlock({
  session,
  layout,
  hourHeight,
  gradient,
  color,
  onEdit,
  t,
}: CompletedBlockProps) {
  const height = durationBlockHeight(
    layout.spanHeight,
    hourHeight,
    MIN_EVENT_HEIGHT,
  );
  const { showText, showTime } = blockVisibility(height);
  const meta = KIND_META[session.kind];
  const detail =
    session.kind === "feeding" && session.milkMl
      ? ` · ${session.milkMl} ${t("unit.ml")}`
      : undefined;

  return (
    <Pressable
      accessibilityLabel={t("editor.editLabel", {
        label: t(`kind.${session.kind}`),
      })}
      onPress={() => onEdit(session)}
      style={({ pressed }) => [
        styles.block,
        styles.completedBlock,
        session.kind === "feeding" && styles.feedingBlock,
        { top: layout.top, height, left: laneLeft(session.kind) },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blockGradient}
      >
        {showText && (
          <BlockContent
            icon={meta.icon}
            proDetails={session.proDetails}
            color={color}
            title={t(`kind.${session.kind}`)}
            detail={detail}
            time={
              showTime
                ? `${fmtTime(layout.visibleStart)}–${fmtTime(layout.visibleEnd)}`
                : undefined
            }
          />
        )}
      </LinearGradient>
    </Pressable>
  );
}
