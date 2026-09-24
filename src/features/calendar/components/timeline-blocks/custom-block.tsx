import { Pressable } from "react-native";

import { type ActivitySession } from "@/lib/activity-store";

import { KIND_META, MIN_EVENT_HEIGHT } from "../../constants";
import { fmtDateTimeRange, laneLeft, type Translate } from "../../helpers";
import { BlockContent } from "./block-content";
import { blockVisibility, durationBlockHeight } from "./helpers";
import { styles } from "./styles";
import { type SessionLayout } from "./types";

interface CustomBlockProps {
  session: ActivitySession;
  layout: SessionLayout;
  hourHeight: number;
  color: string;
  borderColor: string;
  backgroundColor: string;
  onEdit: (entry: ActivitySession) => void;
  t: Translate;
}

export function CustomBlock({
  session,
  layout,
  hourHeight,
  color,
  borderColor,
  backgroundColor,
  onEdit,
  t,
}: CustomBlockProps) {
  const height = durationBlockHeight(
    layout.spanHeight,
    hourHeight,
    MIN_EVENT_HEIGHT,
  );
  const { showText, showTime } = blockVisibility(height);
  const title = session.title?.trim() || t("kind.custom");
  // The whole span with its dates, even where the day cuts the block short.
  const span = fmtDateTimeRange(session.start, session.end);

  return (
    <Pressable
      accessibilityLabel={t("editor.editLabel", { label: title })}
      onPress={() => onEdit(session)}
      style={({ pressed }) => [
        styles.block,
        styles.customBlock,
        {
          top: layout.top,
          height,
          left: laneLeft(session.kind),
          backgroundColor,
          borderColor,
        },
        pressed && styles.pressed,
      ]}
    >
      {showText && (
        <BlockContent
          icon={KIND_META.custom.icon}
          color={color}
          title={title}
          time={showTime ? span : undefined}
        />
      )}
    </Pressable>
  );
}
