import type { GameSaveV1 } from "@pokeidle/contracts";

const DATABASE_NAME = "pokeidle-save-db";
const DATABASE_VERSION = 1;
const STORE_NAME = "save_entries";
const PRIMARY_SLOT = "primary";
const BACKUP_PREFIX = "backup:";

interface SaveEntryRecord {
  slot: string;
  payload: GameSaveV1;
  savedAt: string;
}

function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

export class IndexedDbSaveStorage {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async readPrimary(): Promise<GameSaveV1 | null> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const entry = (await wrapRequest(store.get(PRIMARY_SLOT))) as SaveEntryRecord | undefined;

    return entry?.payload ?? null;
  }

  async writePrimary(payload: GameSaveV1): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put({
      slot: PRIMARY_SLOT,
      payload,
      savedAt: payload.meta.lastSavedAt ?? new Date().toISOString(),
    } satisfies SaveEntryRecord);

    await this.awaitTransaction(transaction);
  }

  async writeBackup(payload: GameSaveV1): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const backupId = `${BACKUP_PREFIX}${payload.meta.lastSavedAt ?? new Date().toISOString()}`;

    store.put({
      slot: backupId,
      payload,
      savedAt: payload.meta.lastSavedAt ?? new Date().toISOString(),
    } satisfies SaveEntryRecord);

    await this.awaitTransaction(transaction);
  }

  async trimBackups(limit: number): Promise<void> {
    const backups = await this.listBackups();

    if (backups.length <= limit) {
      return;
    }

    const database = await this.getDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    backups
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
      .slice(limit)
      .forEach((entry) => {
        store.delete(entry.slot);
      });

    await this.awaitTransaction(transaction);
  }

  async clearAll(): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    await this.awaitTransaction(transaction);
  }

  private async listBackups(): Promise<SaveEntryRecord[]> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const entries = ((await wrapRequest(store.getAll())) as SaveEntryRecord[]) ?? [];

    return entries.filter((entry) => entry.slot.startsWith(BACKUP_PREFIX));
  }

  private async getDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
          const database = request.result;

          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: "slot" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
      });
    }

    return this.databasePromise;
  }

  private awaitTransaction(transaction: IDBTransaction): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
      transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    });
  }
}
