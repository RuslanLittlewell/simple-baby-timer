export type CalendarWeek = {
  key: string;
  startMs: number;
  endMs: number;
};

export function calendarWeekOf(date: Date): CalendarWeek {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return {
    key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
}

export function calendarWeeksInRange(startMs: number, endMs: number): CalendarWeek[] {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return [];
  const first = calendarWeekOf(new Date(startMs));
  const finalStart = calendarWeekOf(new Date(endMs - 1)).startMs;
  const cursor = new Date(first.startMs);
  const weeks: CalendarWeek[] = [];
  while (cursor.getTime() <= finalStart) {
    weeks.push(calendarWeekOf(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

export function compoundCursorFilter(startMs: number, id: string): string {
  return `start_ms.gt.${startMs},and(start_ms.eq.${startMs},id.gt.${id})`;
}

export type CompoundCursor = { startMs: number; id: string };

export async function paginateCompound<T extends { startMs: number; id: string }>(
  pageSize: number,
  fetchPage: (cursor: CompoundCursor | null) => Promise<T[]>,
  applyPage: (rows: T[]) => Promise<void>,
): Promise<number> {
  let cursor: CompoundCursor | null = null;
  let applied = 0;
  for (;;) {
    const rows = await fetchPage(cursor);
    if (!rows.length) return applied;
    await applyPage(rows);
    applied += rows.length;
    if (rows.length < pageSize) return applied;
    const last = rows[rows.length - 1];
    cursor = { startMs: last.startMs, id: last.id };
  }
}

export function partitionDeletedRows<T extends { id: string; deleted: boolean }>(rows: T[]) {
  return {
    activeRows: rows.filter((row) => !row.deleted),
    deletedIds: rows.filter((row) => row.deleted).map((row) => row.id),
  };
}

export class WeekLoadCoordinator {
  private readonly inFlight = new Map<string, Promise<number>>();

  run(key: string, load: () => Promise<number>): Promise<number> {
    const current = this.inFlight.get(key);
    if (current) return current;
    const next = load().finally(() => {
      if (this.inFlight.get(key) === next) this.inFlight.delete(key);
    });
    this.inFlight.set(key, next);
    return next;
  }

  clear(): void {
    this.inFlight.clear();
  }
}

export interface StringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export class LoadedWeekRegistry {
  private writeTail: Promise<void> = Promise.resolve();
  private readonly storage: StringStorage;
  private readonly keyForChild: (remoteChildId: string) => string;

  constructor(
    storage: StringStorage,
    keyForChild: (remoteChildId: string) => string,
  ) {
    this.storage = storage;
    this.keyForChild = keyForChild;
  }

  private async read(remoteChildId: string): Promise<Set<string>> {
    try {
      const raw = await this.storage.getItem(this.keyForChild(remoteChildId));
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(
        Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [],
      );
    } catch {
      return new Set();
    }
  }

  async has(remoteChildId: string, weekKey: string): Promise<boolean> {
    await this.writeTail;
    return (await this.read(remoteChildId)).has(weekKey);
  }

  mark(remoteChildId: string, weekKey: string): Promise<void> {
    const write = this.writeTail.then(async () => {
      const loaded = await this.read(remoteChildId);
      loaded.add(weekKey);
      await this.storage.setItem(
        this.keyForChild(remoteChildId),
        JSON.stringify([...loaded].sort()),
      );
    });
    this.writeTail = write.catch(() => {});
    return write;
  }
}

export class WeekFreshnessRegistry {
  private readonly storage: StringStorage;
  private readonly keyForChild: (remoteChildId: string) => string;

  constructor(
    storage: StringStorage,
    keyForChild: (remoteChildId: string) => string,
  ) {
    this.storage = storage;
    this.keyForChild = keyForChild;
  }

  private async read(remoteChildId: string): Promise<Record<string, number>> {
    try {
      const raw = await this.storage.getItem(this.keyForChild(remoteChildId));
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === 'number' && Number.isFinite(entry[1]),
        ),
      );
    } catch {
      return {};
    }
  }

  async isFresh(
    remoteChildId: string,
    weekKey: string,
    maxAgeMs: number,
    now = Date.now(),
  ): Promise<boolean> {
    const refreshedAt = (await this.read(remoteChildId))[weekKey];
    return refreshedAt !== undefined && now >= refreshedAt && now - refreshedAt < maxAgeMs;
  }

  async mark(remoteChildId: string, weekKey: string, refreshedAt = Date.now()): Promise<void> {
    const timestamps = await this.read(remoteChildId);
    timestamps[weekKey] = refreshedAt;
    await this.storage.setItem(this.keyForChild(remoteChildId), JSON.stringify(timestamps));
  }
}
