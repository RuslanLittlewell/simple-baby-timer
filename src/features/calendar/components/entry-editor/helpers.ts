type EntryDetails =
  | { type: 'settling'; methods: string[] }
  | { type: 'sleep'; place: string }
  | { type: 'feeding'; mode: 'breast'; side: string }
  | { type: 'feeding'; mode: 'bottle'; content?: string; volumeMl?: number };

export interface InitialEntry {
  kind: string;
  start: number;
  end: number;
  milkMl?: number;
  proDetails?: EntryDetails;
}

export interface EditorValuesInput {
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  milkInput: string;
  settlingMethods: string[];
  sleepPlace: string;
  feedingMode: 'breast' | 'bottle';
  breastSide: string;
  bottleContent: string;
}

const DAY_KINDS = new Set(['settling', 'sleep', 'awake']);
const EVENT_KINDS = new Set(['poop', 'diaper', 'nightWaking']);

export function editorKindFlags(kind?: string): {
  editingEvent: boolean;
  editingDay: boolean;
  editableProKind: 'settling' | 'sleep' | 'feeding' | null;
} {
  return {
    editingEvent: kind ? EVENT_KINDS.has(kind) : false,
    editingDay: kind ? DAY_KINDS.has(kind) : false,
    editableProKind:
      kind === 'settling' || kind === 'sleep' || kind === 'feeding' ? kind : null,
  };
}

export function initialEditorValues(entry: InitialEntry): EditorValuesInput {
  const details = entry.proDetails;
  const bottleVolume =
    details?.type === 'feeding' && details.mode === 'bottle' ? details.volumeMl : undefined;
  const amount = entry.milkMl ?? bottleVolume;
  return {
    startInput: formatTime(entry.start),
    endInput: formatTime(entry.end),
    startDayMs: startOfLocalDay(entry.start),
    endDayMs: startOfLocalDay(entry.end),
    milkInput: amount ? String(amount) : '',
    settlingMethods: details?.type === 'settling' ? details.methods : [],
    sleepPlace: details?.type === 'sleep' ? details.place : 'crib',
    feedingMode: details?.type === 'feeding' ? details.mode : 'breast',
    breastSide:
      details?.type === 'feeding' && details.mode === 'breast' ? details.side : 'left',
    bottleContent:
      details?.type === 'feeding' && details.mode === 'bottle'
        ? (details.content ?? 'formula')
        : 'formula',
  };
}

export function timeInputAsDate(input: string, now = new Date()): Date {
  const parsed = parseTime(input) ?? { hours: 0, minutes: 0 };
  const date = new Date(now);
  date.setHours(parsed.hours, parsed.minutes, 0, 0);
  return date;
}

export type EditedRangeResult =
  | { range: { start: number; end: number }; error: null }
  | { range: null; error: 'format' | 'endAfterStart' };

export function buildEditedRange(input: {
  kind: string;
  originalStart: number;
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  eventDurationMs: number;
}): EditedRangeResult {
  const flags = editorKindFlags(input.kind);
  const startTime = parseTime(input.startInput);
  const endTime = flags.editingEvent ? startTime : parseTime(input.endInput);
  if (!startTime || !endTime) return { range: null, error: 'format' };

  let start: number;
  let end: number;
  if (flags.editingDay) {
    start = combineDayTime(input.startDayMs, startTime);
    end = combineDayTime(input.endDayMs, endTime);
  } else {
    const original = new Date(input.originalStart);
    start = localTimestamp(original, 0, startTime);
    end = flags.editingEvent
      ? start + input.eventDurationMs
      : localTimestamp(original, 0, endTime);
    if (!flags.editingEvent && end < start) end = localTimestamp(original, 1, endTime);
  }
  if (end <= start) return { range: null, error: 'endAfterStart' };
  return { range: { start, end }, error: null };
}

export function sanitizeMilkInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function normalizeMilk(kind: string, input: string) {
  const parsed = Number.parseInt(input, 10);
  const invalid = kind === 'feeding' && !!input && (parsed <= 0 || parsed > 5000);
  return {
    milkMl: kind === 'feeding' && input ? parsed : undefined,
    error: invalid ? 'range' : null,
  } as const;
}

export function buildEditableProDetails(kind: string, values: EditorValuesInput): EntryDetails | undefined {
  if (kind === 'settling') return { type: 'settling', methods: values.settlingMethods };
  if (kind === 'sleep') return { type: 'sleep', place: values.sleepPlace };
  if (kind !== 'feeding') return undefined;
  if (values.feedingMode === 'breast') {
    return { type: 'feeding', mode: 'breast', side: values.breastSide };
  }
  const volume = normalizeMilk(kind, values.milkInput).milkMl;
  return {
    type: 'feeding',
    mode: 'bottle',
    content: values.bottleContent,
    volumeMl: volume,
  };
}

function parseTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function combineDayTime(dayMs: number, time: { hours: number; minutes: number }): number {
  const date = new Date(dayMs);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.hours, time.minutes).getTime();
}

function localTimestamp(
  original: Date,
  dayOffset: number,
  time: { hours: number; minutes: number },
): number {
  return new Date(
    original.getFullYear(),
    original.getMonth(),
    original.getDate() + dayOffset,
    time.hours,
    time.minutes,
  ).getTime();
}
