## Context

See `proposal.md` for motivation. Calendar blocks already receive structured feeding `proDetails`, derive a detail icon, and render completed and live content rows from the same timeline module. Breast details contain `left`, `right`, or `both`; bottle details use a different discriminated union branch.

## Goals / Non-Goals

**Goals:**

- Centralize the breast-side-to-marker mapping and reuse it for completed and live blocks.
- Insert a compact marker without disturbing the existing icon/title/time layout.
- Keep the mapping independently testable and safe for missing or non-breast details.

**Non-Goals:**

- Translating the `L`, `R`, and `RL` abbreviations.
- Changing how feeding details are recorded, edited, stored, or synchronized.
- Adding markers to activity-list rows or feeding statistics outside the calendar timeline.

## Decisions

### Derive the marker from discriminated `proDetails`

A pure calendar presentation helper will accept optional pro details and return `L`, `R`, `RL`, or `null`. It will first require feeding type and breast mode, then use an exhaustive side mapping. This prevents bottle and unrelated pro details from receiving accidental markers.

Deriving the marker from translated detail labels was rejected because translations are display text, are longer, and should not control logic.

### Render one text node after both icons

Both completed and live rows will calculate the marker beside the existing detail icon. When non-null, a small bold text node in the block foreground color will be inserted after the activity/detail icons and before the title. Existing row gap supplies spacing without changing block geometry.

Appending the letters to the feeding title was rejected because the user requested placement after the icons, and a separate node makes ordering and styling explicit.

### Preserve existing height thresholds

The marker will render only inside the existing content row, so very short blocks that currently suppress text remain icon-free/text-free according to existing behavior. No additional minimum height or width will be introduced.

## Risks / Trade-offs

- [Narrow blocks may truncate the feeding title slightly earlier] → Keep the marker to one or two characters and retain the title's existing single-line truncation.
- [A live session received without pro details cannot show a side] → Return no marker and preserve current rendering rather than guessing.

## Migration Plan

No stored-data migration is required. Existing sessions with structured breast-side details gain the marker automatically; sessions without them remain unchanged.
