export type CalendarMonth = {
  key: string;
  startMs: number;
  endMs: number;
};

export function calendarMonthOf(date: Date): CalendarMonth {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    startMs: new Date(year, month, 1).getTime(),
    endMs: new Date(year, month + 1, 1).getTime(),
  };
}

export function calendarMonthsInRange(startMs: number, endMs: number): CalendarMonth[] {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return [];
  const first = new Date(startMs);
  const last = new Date(endMs - 1);
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const finalStart = new Date(last.getFullYear(), last.getMonth(), 1).getTime();
  const months: CalendarMonth[] = [];
  while (cursor.getTime() <= finalStart) {
    months.push(calendarMonthOf(cursor));
    cursor.setMonth(cursor.getMonth() + 1, 1);
  }
  return months;
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

export class MonthLoadCoordinator {
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

export class LoadedMonthRegistry {
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

  async has(remoteChildId: string, monthKey: string): Promise<boolean> {
    await this.writeTail;
    return (await this.read(remoteChildId)).has(monthKey);
  }

  mark(remoteChildId: string, monthKey: string): Promise<void> {
    const write = this.writeTail.then(async () => {
      const loaded = await this.read(remoteChildId);
      loaded.add(monthKey);
      await this.storage.setItem(
        this.keyForChild(remoteChildId),
        JSON.stringify([...loaded].sort()),
      );
    });
    this.writeTail = write.catch(() => {});
    return write;
  }
}
