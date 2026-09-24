type GrowthLanguageCode = 'en' | 'ru' | 'ua' | 'pl' | 'es' | 'fr' | 'de' | 'pt' | 'it';

export interface GrowthMeasurement {
  id: string;
  childId: string;
  measuredOn: string;
  heightCm: number;
  weightKg: number;
  updatedAt: number;
}

export interface NewGrowthMeasurementInput {
  childId: string;
  measuredOn: string;
  heightCm: number;
  weightKg: number;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const LANGUAGE_LOCALES: Record<GrowthLanguageCode, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  ua: 'uk-UA',
  pl: 'pl-PL',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  it: 'it-IT',
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export function dateOnlyFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function dateFromDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
}

export function parseMeasurementNumber(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatMeasurementNumber(value: number, language: GrowthLanguageCode): string {
  return new Intl.NumberFormat(LANGUAGE_LOCALES[language], {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMeasurementDate(value: string): string {
  const date = dateFromDateOnly(value);
  if (!date) return value;
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function isValidGrowthMeasurement(
  measurement: Pick<GrowthMeasurement, 'measuredOn' | 'heightCm' | 'weightKg'>,
  birthday?: string,
  today = dateOnlyFromDate(new Date()),
): boolean {
  if (!dateFromDateOnly(measurement.measuredOn)) return false;
  if (measurement.measuredOn > today) return false;
  if (birthday && measurement.measuredOn < birthday) return false;
  return (
    Number.isFinite(measurement.heightCm) &&
    measurement.heightCm > 0 &&
    Number.isFinite(measurement.weightKg) &&
    measurement.weightKg > 0
  );
}

export function sortGrowthMeasurements(
  measurements: readonly GrowthMeasurement[],
): GrowthMeasurement[] {
  return [...measurements].sort(
    (a, b) => b.measuredOn.localeCompare(a.measuredOn) || b.id.localeCompare(a.id),
  );
}

export function latestGrowthMeasurement(
  measurements: readonly GrowthMeasurement[],
): GrowthMeasurement | null {
  return sortGrowthMeasurements(measurements)[0] ?? null;
}

export function sanitizeGrowthMeasurements(value: unknown): GrowthMeasurement[] {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, GrowthMeasurement>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<GrowthMeasurement>;
    if (
      typeof candidate.id !== 'string' ||
      !candidate.id ||
      typeof candidate.childId !== 'string' ||
      !candidate.childId ||
      typeof candidate.measuredOn !== 'string' ||
      typeof candidate.heightCm !== 'number' ||
      typeof candidate.weightKg !== 'number' ||
      typeof candidate.updatedAt !== 'number' ||
      !Number.isFinite(candidate.updatedAt) ||
      !isValidGrowthMeasurement(candidate as GrowthMeasurement)
    ) continue;
    const normalized: GrowthMeasurement = {
      id: candidate.id,
      childId: candidate.childId,
      measuredOn: candidate.measuredOn,
      heightCm: candidate.heightCm,
      weightKg: candidate.weightKg,
      updatedAt: candidate.updatedAt,
    };
    const existing = byId.get(normalized.id);
    if (!existing || normalized.updatedAt >= existing.updatedAt) byId.set(normalized.id, normalized);
  }
  return sortGrowthMeasurements([...byId.values()]);
}

export function createGrowthMeasurementId(now = Date.now()): string {
  return `${now}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addGrowthMeasurementToList(
  measurements: readonly GrowthMeasurement[],
  input: NewGrowthMeasurementInput,
  now = Date.now(),
  id = createGrowthMeasurementId(now),
): { measurement: GrowthMeasurement; measurements: GrowthMeasurement[] } {
  const measurement: GrowthMeasurement = { id, ...input, updatedAt: now };
  return {
    measurement,
    measurements: sortGrowthMeasurements([...measurements, measurement]),
  };
}

export function editGrowthMeasurementInList(
  measurements: readonly GrowthMeasurement[],
  id: string,
  input: Omit<NewGrowthMeasurementInput, 'childId'>,
  now = Date.now(),
): { measurement: GrowthMeasurement; measurements: GrowthMeasurement[] } | null {
  const current = measurements.find((item) => item.id === id);
  if (!current) return null;
  const measurement: GrowthMeasurement = { ...current, ...input, updatedAt: now };
  return {
    measurement,
    measurements: sortGrowthMeasurements(
      measurements.map((item) => (item.id === id ? measurement : item)),
    ),
  };
}

export function mergeGrowthMeasurementLists(
  local: readonly GrowthMeasurement[],
  incoming: readonly GrowthMeasurement[],
  pendingIds: ReadonlySet<string> = new Set(),
): GrowthMeasurement[] {
  const byId = new Map(local.map((item) => [item.id, item]));
  for (const remote of incoming) {
    const current = byId.get(remote.id);
    if (current && pendingIds.has(remote.id)) continue;
    if (!current || remote.updatedAt >= current.updatedAt) byId.set(remote.id, remote);
  }
  return sortGrowthMeasurements([...byId.values()]);
}
