const DEFAULT_START_MINUTES = 9 * 60;
const DEFAULT_DURATION_MINUTES = 30;
const LAST_DAY_MINUTE = 23 * 60 + 59;

type TimeValue = { hours: number; minutes: number };

export type BuiltProDetails =
  | { type: 'settling'; methods: string[] }
  | { type: 'sleep'; place: string }
  | { type: 'feeding'; mode: 'breast'; side: string }
  | { type: 'feeding'; mode: 'bottle'; content: string; volumeMl?: number };

export interface ProDetailsInput {
  proActive: boolean;
  kind: string;
  eventKind: boolean;
  settlingMethods: string[];
  sleepPlace: string;
  feedingMode: 'breast' | 'bottle';
  breastSide: string;
  bottleContent: string;
  bottleVolume?: number;
}

export function formatMinutes(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const remainder = String(minutes % 60).padStart(2, '0');
  return `${hours}:${remainder}`;
}

export function initialTimeInputs(day: Date, now = new Date()) {
  const onToday =
    now.getFullYear() === day.getFullYear() &&
    now.getMonth() === day.getMonth() &&
    now.getDate() === day.getDate();
  const startMinutes = onToday ? now.getHours() * 60 + now.getMinutes() : DEFAULT_START_MINUTES;
  const endMinutes = Math.min(startMinutes + DEFAULT_DURATION_MINUTES, LAST_DAY_MINUTE);
  return { startInput: formatMinutes(startMinutes), endInput: formatMinutes(endMinutes) };
}

export function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function timeInputAsDate(input: string, now = new Date()): Date {
  const parsed = parseTimeInput(input) ?? { hours: 0, minutes: 0 };
  const date = new Date(now);
  date.setHours(parsed.hours, parsed.minutes, 0, 0);
  return date;
}

export function parsePositiveVolume(input: string): number | undefined {
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function sanitizeVolumeInput(input: string): string {
  return input.replace(/\D/g, '').slice(0, 4);
}

export function buildProDetails(input: ProDetailsInput): BuiltProDetails | undefined {
  if (!input.proActive || input.kind === 'awake' || input.eventKind) return undefined;
  if (input.kind === 'settling') return { type: 'settling', methods: input.settlingMethods };
  if (input.kind === 'sleep') return { type: 'sleep', place: input.sleepPlace };
  if (input.feedingMode === 'breast') {
    return { type: 'feeding', mode: 'breast', side: input.breastSide };
  }
  return {
    type: 'feeding',
    mode: 'bottle',
    content: input.bottleContent,
    volumeMl: input.bottleVolume,
  };
}

export type TimeRangeResult =
  | { range: { start: number; end: number }; error: null }
  | { range: null; error: 'format' | 'endAfterStart' };

export function buildTimeRange(input: {
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  eventKind: boolean;
  eventDurationMs: number;
}): TimeRangeResult {
  const startTime = parseTimeInput(input.startInput);
  const endTime = input.eventKind ? startTime : parseTimeInput(input.endInput);
  if (!startTime || !endTime) return { range: null, error: 'format' };

  const start = combineLocalDayTime(input.startDayMs, startTime);
  const end = input.eventKind
    ? start + input.eventDurationMs
    : combineLocalDayTime(input.endDayMs, endTime);
  if (end <= start) return { range: null, error: 'endAfterStart' };
  return { range: { start, end }, error: null };
}

function parseTimeInput(value: string): TimeValue | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function combineLocalDayTime(dayMs: number, time: TimeValue): number {
  const date = new Date(dayMs);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
  ).getTime();
}
