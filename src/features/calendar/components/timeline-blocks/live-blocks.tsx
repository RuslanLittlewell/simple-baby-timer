import { LinearGradient } from "expo-linear-gradient";

import { useActivityColors } from "@/hooks/use-activity-colors";

import { KIND_META } from "../../constants";
import { fmtTime, laneLeft } from "../../helpers";
import { BlockContent } from "./block-content";
import { blockVisibility } from "./helpers";
import { styles } from "./styles";
import { type LiveBlocksProps } from "./types";

export function LiveBlocks({ blocks, t }: LiveBlocksProps) {
  const { gradients, fg: fgColors, accent } = useActivityColors();

  return (
    <>
      {blocks.map((block) => {
        const meta = KIND_META[block.kind];
        const color = fgColors[meta.gradKey];
        const { showText, showTime } = blockVisibility(block.height);

        return (
          <LinearGradient
            key={`live-${block.kind}`}
            colors={gradients[meta.gradKey]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.block,
              styles.liveBlock,
              block.kind === "feeding" && styles.feedingBlock,
              {
                top: block.top,
                height: block.height,
                left: laneLeft(block.kind),
                borderColor: accent[meta.gradKey],
              },
            ]}
          >
            {showText && (
              <BlockContent
                icon={meta.icon}
                proDetails={block.proDetails}
                color={color}
                title={t(`kind.${block.kind}`)}
                time={
                  showTime
                    ? `${fmtTime(block.start)}–${t("calendar.now")}`
                    : undefined
                }
              />
            )}
          </LinearGradient>
        );
      })}
    </>
  );
}
