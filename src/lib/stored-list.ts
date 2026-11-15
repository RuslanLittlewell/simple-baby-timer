import type { StringStorage } from './activity-history-loading';

/**
 * A list kept under one storage key. Changing it means reading it, building the
 * next list and writing that back, so changes take turns: two made side by side
 * would otherwise each write a copy that lacks the other's change.
 */
export class StoredList<T> {
  private tail: Promise<unknown> = Promise.resolve();
  private readonly storage: StringStorage;
  private readonly key: string;

  constructor(storage: StringStorage, key: string) {
    this.storage = storage;
    this.key = key;
  }

  async read(): Promise<T[]> {
    try {
      const raw = await this.storage.getItem(this.key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  update(change: (list: T[]) => T[]): Promise<void> {
    const run = this.tail.then(async () => {
      await this.storage.setItem(this.key, JSON.stringify(change(await this.read())));
    });
    this.tail = run.catch(() => {});
    return run;
  }

  /** Resolves once every change requested so far has been written. */
  async settled(): Promise<void> {
    await this.tail;
  }
}

/** Drops exactly the items that were sent, keeping any that changed in the meantime. */
export function withoutSent<T>(list: T[], sent: T[]): T[] {
  const sentCopies = new Set(sent.map((item) => JSON.stringify(item)));
  return list.filter((item) => !sentCopies.has(JSON.stringify(item)));
}
