## Context

See proposal.md — Why. The shape of the current screen is what makes this a structural change rather than a styling one:

- `CalendarScreen` calls every hook, then returns early: `if (view === 'week') return <WeekView …>`, `if (view === 'month') return <MonthView …>`. Everything below those returns — the timeline, the `ScrollView`, `LiveBlocks`, `TimelineBlocks`, the now-line and `<GestureDetector gesture={pinchGesture}>` — exists only in the day branch.
- `usePinchZoom` owns the gesture and its shared values and is called before the returns, so the gesture outlives the component that attaches it.
- `goToDay` sets `didAutoScroll.current = false` and lets `onContentSizeChange` do the scrolling. That works only because the `ScrollView` is remounted on the way back from a period view.
- `WeekView` and `MonthView` both render `OverlayShell`, which already paints a full-screen gradient and its own `SafeAreaView`, and takes `onBack`, `onClose`, `onPrev`, `onNext`.

## Goals / Non-Goals

**Goals:**

- Stop unmounting the day view, which is the suspected cause of both the flicker and the crash.
- Keep `OverlayShell`, `WeekView` and `MonthView` rendering as they do; only what their shared control means changes.
- Preserve the two deliberately different scroll behaviours: stepping days keeps the position, picking a day recentres.

**Non-Goals:**

- Redesigning the week or month layouts.
- Turning the periods into router screens.
- Changing how the statistics modal, the entry editor or the add-activity modal are presented.
- Proving the crash diagnosis before the change lands — the crash log is still outstanding, so this is a strong hypothesis, not a confirmed fix.

## Decisions

**One `Modal`, one content flag.** `view: 'day' | 'week' | 'month'` becomes `overlay: 'none' | 'week' | 'month'`. The modal is rendered unconditionally with `visible={overlay !== 'none'}` and picks its child from the flag. Two nested modals were rejected: a `Modal` opened from inside another animates the outer one out and the inner one in, which trades the current flicker for a different one.

**`OverlayShell` becomes a card on `modalStyles`.** It paints its own full-screen gradient and `SafeAreaView` today, which is what a replacement screen needs and what a modal must not do. It moves onto the shared `modalStyles` — the centred backdrop, the `BlurView`, and the card at `maxWidth: 420` with the same radius, border and padding as the add-activity modal — plus a `maxHeight` of 70%. The alternative, keeping the gradient and merely shrinking it, would leave two different modal idioms in one screen.

**`WeekView` loses `fill`.** Its seven rows currently take `flex: 1` each to share the whole screen; inside a card that would either overflow or collapse. They become intrinsically sized rows, and the card scrolls if the content still exceeds its cap — which a six-row month can.

**`animationType="fade"`, matching the calendar's other three modals.** The current transition is an instant swap, so fade is the closest honest equivalent; a slide would read as a push and imply a hierarchy the toggle no longer has.

**The shared control becomes a toggle.** `OverlayShell`'s `onBack` is passed `() => setOverlay(overlay === 'week' ? 'month' : 'week')` from one place, instead of `onOpenMonth` in the week and `onBackToWeek` in the month. Its accessible label should name the period it switches to, since a chevron alone no longer describes the action. The week and month components keep taking a single callback, so neither needs to know about the other.

**Day picking scrolls explicitly.** With the `ScrollView` no longer remounting, `onContentSizeChange` never fires again after the first layout, so the `didAutoScroll` trick would silently stop recentring. `goToDay` instead calls `scrollRef.current?.scrollTo` with the same target the auto-scroll computes — the current time for today, the usual starting hour otherwise. `didAutoScroll` keeps its original job of guarding the very first layout.

**The per-second clock follows the overlay.** The `syncCurrentDate` interval is currently gated on `view === 'day'`; it becomes `overlay === 'none'` so it stops while the overlay covers the day. `syncCurrentDate` still runs once on close, so the now-line is correct on return rather than up to a second stale.

**`onRequestClose` closes the overlay.** The screen has no back handling today because the period views were full screens. As a modal it gets it for free, and Android needs it.

## Risks / Trade-offs

- **The crash is diagnosed, not observed** — the reasoning fits (a gesture reattached across remounts, failing after a few switches rather than the first), but no crash log has been read. → If it survives this change, the remount was not the cause and the log becomes essential; the change is still worth having for the flicker and the preserved scroll position.
- **A card cannot show as much as a screen could** — the week's rows and the month's grid were laid out against the full height and now share at most 70% of it. → The month's cells keep their square aspect and simply get smaller; the week's rows lose their stretch. Both need looking at on the narrowest supported screen.
- **A modal over a `GestureHandlerRootView`** — gesture-handler wants its root view above the modal's content to deliver touches inside it. The week and month views only use plain `Pressable`s, so nothing inside the overlay needs the gesture system, but this is the first modal in this screen rendered while a pinch gesture is attached underneath. → Verify that pinch still works after the overlay closes, and that taps inside the overlay register on both platforms.
- **The day view keeps running under the overlay** — its subscriptions and the sessions effect stay mounted rather than being torn down. → That is the point, and the per-second work is paused explicitly; the remaining listeners are cheap.
- **Losing the "one level up" reading** — a caregiver used to the chevron meaning "back" may expect it to close the overlay. → It never closed the overlay before either: in the week it went deeper, which is what prompted this change. The close control sits in the same top bar.
