import { memo } from "react";

import { useActivityColors } from "@/hooks/use-activity-colors";
import { useAppStore } from "@/state/app-state";

import { KIND_META, LANES } from "../../constants";
import { isEvent } from "../../helpers";
import { CompletedBlock } from "./completed-block";
import { CustomBlock } from "./custom-block";
import { EventBlock } from "./event-block";
import { sessionLayout } from "./helpers";
import { type TimelineBlocksProps } from "./types";

export const TimelineBlocks = memo(function TimelineBlocks({
  sessions,
  hourHeight,
  dayStartMs,
  onEdit,
  t,
}: TimelineBlocksProps) {
  const { timelineGradients: gradients, fg: foregroundColors, accent } = useActivityColors();
  const themeMode = useAppStore((state) => state.themeMode);
  const ordered = [...sessions].sort((a, b) => LANES[a.kind] - LANES[b.kind]);

  return (
    <>
      {ordered.map((session) => {
        const layout = sessionLayout(
          session.start,
          session.end,
          dayStartMs,
          hourHeight,
        );
        if (!layout) return null;

        const meta = KIND_META[session.kind];
        const foregroundColor = foregroundColors[meta.gradKey];

        if (session.kind === "custom") {
          return (
            <CustomBlock
              key={session.id}
              session={session}
              layout={layout}
              hourHeight={hourHeight}
              color={foregroundColor}
              borderColor={accent[meta.gradKey]}
              backgroundColor={gradients[meta.gradKey][0]}
              onEdit={onEdit}
              t={t}
            />
          );
        }

        if (isEvent(session.kind)) {
          return (
            <EventBlock
              key={session.id}
              session={session}
              layout={layout}
              hourHeight={hourHeight}
              stripeColor={gradients[meta.gradKey][0]}
              foregroundColor={foregroundColor}
              themeMode={themeMode}
              onEdit={onEdit}
              t={t}
            />
          );
        }

        return (
          <CompletedBlock
            key={session.id}
            session={session}
            layout={layout}
            hourHeight={hourHeight}
            gradient={gradients[meta.gradKey]}
            color={foregroundColor}
            onEdit={onEdit}
            t={t}
          />
        );
      })}
    </>
  );
});
