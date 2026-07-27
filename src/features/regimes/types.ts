// A single step of a daily schedule (one row of the source table).
export type RegimeKind = 'sleep' | 'milk' | 'meal' | 'ritual' | 'wake' | 'play' | 'other';

export interface RegimeStep {
  time: string; // original label, e.g. "08:00–09:15", "07:00" or "После пробуждения"
  startMin: number | null; // minutes from midnight; null for descriptive times
  endMin: number | null; // present only for ranges
  action: string;
  note: string; // recommendation / comment shown on tap (may be empty)
  kind: RegimeKind;
}

export interface RegimeVariant {
  name: string; // e.g. "2 дневных сна"
  steps: RegimeStep[];
}

export interface RegimeSummary {
  sleep24: string;
  naps: string;
  wakeWindow: string;
  wakeUp: string;
  nightSleep: string;
  features: string;
}

export interface RegimeAge {
  age: string; // "7–9 месяцев"
  timed: boolean; // false for the 0–6 weeks cycle (no clock times)
  summary: RegimeSummary | null;
  source: string;
  variants: RegimeVariant[];
}
