import type { GameSaveExportV1, GameSaveV1, Locale } from "@pokeidle/contracts";
import { createDefaultGameSave } from "./default-save";
import { IndexedDbSaveStorage } from "./indexeddb-storage";
import { migrateGameSave } from "./migrations";

export type SaveStatus = "idle" | "loading" | "dirty" | "saving" | "error";

export interface SaveManagerState {
  snapshot: GameSaveV1;
  status: SaveStatus;
  loaded: boolean;
  lastError: string | null;
}

export interface SaveUpdateOptions {
  immediate?: boolean;
}

type SaveListener = (state: SaveManagerState) => void;
type SaveMutator = (draft: GameSaveV1) => void;

export class GameSaveManager {
  private readonly storage: IndexedDbSaveStorage;
  private readonly autoFlushDelayMs: number;
  private readonly backupLimit: number;
  private readonly listeners = new Set<SaveListener>();
  private readonly hiddenHandler = () => {
    if (document.visibilityState === "hidden") {
      void this.flush();
    }
  };
  private readonly pageHideHandler = () => {
    void this.flush();
  };

  private snapshot = createDefaultGameSave();
  private persistedSnapshot: GameSaveV1 | null = null;
  private status: SaveStatus = "idle";
  private loaded = false;
  private lastError: string | null = null;
  private flushTimer: number | null = null;
  private inFlightFlush: Promise<void> | null = null;

  constructor({
    storage = new IndexedDbSaveStorage(),
    autoFlushDelayMs = 5000,
    backupLimit = 3,
  }: {
    storage?: IndexedDbSaveStorage;
    autoFlushDelayMs?: number;
    backupLimit?: number;
  } = {}) {
    this.storage = storage;
    this.autoFlushDelayMs = autoFlushDelayMs;
    this.backupLimit = backupLimit;
  }

  getState(): SaveManagerState {
    return {
      snapshot: this.snapshot,
      status: this.status,
      loaded: this.loaded,
      lastError: this.lastError,
    };
  }

  subscribe(listener: SaveListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  async load(): Promise<GameSaveV1> {
    this.status = "loading";
    this.emit();

    try {
      const rawSave = await this.storage.readPrimary();
      this.snapshot = rawSave ? migrateGameSave(rawSave) : createDefaultGameSave();
      this.persistedSnapshot = structuredClone(this.snapshot);
      this.loaded = true;
      this.status = "idle";
      this.lastError = null;
      this.emit();

      return this.snapshot;
    } catch (error) {
      this.snapshot = createDefaultGameSave();
      this.persistedSnapshot = structuredClone(this.snapshot);
      this.loaded = true;
      this.status = "error";
      this.lastError = error instanceof Error ? error.message : "Failed to load save.";
      this.emit();

      return this.snapshot;
    }
  }

  attachLifecycle(): () => void {
    document.addEventListener("visibilitychange", this.hiddenHandler);
    window.addEventListener("pagehide", this.pageHideHandler);

    return () => {
      document.removeEventListener("visibilitychange", this.hiddenHandler);
      window.removeEventListener("pagehide", this.pageHideHandler);
    };
  }

  update(mutator: SaveMutator, options: SaveUpdateOptions = {}): void {
    const draft = structuredClone(this.snapshot);
    mutator(draft);
    draft.meta.updatedAt = new Date().toISOString();
    this.snapshot = draft;
    this.status = "dirty";
    this.lastError = null;
    this.emit();

    if (options.immediate) {
      void this.flush();
      return;
    }

    this.scheduleFlush();
  }

  setLocaleOverride(localeOverride: Locale | null): void {
    this.update((draft) => {
      draft.preferences.localeOverride = localeOverride;
    }, { immediate: true });
  }

  incrementSpeciesCounters(speciesId: string, update: Partial<Record<"encountered" | "defeated" | "captured", number>>): void {
    this.update((draft) => {
      const current = draft.species[speciesId] ?? {
        unlocked: false,
        level: 1,
        experience: 0,
        highestLevelReached: 1,
        counters: {
          encountered: 0,
          defeated: 0,
          captured: 0,
        },
      };

      current.counters.encountered += update.encountered ?? 0;
      current.counters.defeated += update.defeated ?? 0;
      current.counters.captured += update.captured ?? 0;

      if ((update.captured ?? 0) > 0) {
        current.unlocked = true;
      }

      draft.species[speciesId] = current;
    });
  }

  async flush(): Promise<void> {
    if (this.inFlightFlush) {
      await this.inFlightFlush;
      return;
    }

    if (this.status === "idle" || this.status === "loading") {
      return;
    }

    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.status = "saving";
    this.emit();

    this.inFlightFlush = (async () => {
      try {
        const snapshotToPersist = structuredClone(this.snapshot);
        snapshotToPersist.meta.updatedAt = new Date().toISOString();
        snapshotToPersist.meta.lastSavedAt = snapshotToPersist.meta.updatedAt;

        if (this.persistedSnapshot?.meta.lastSavedAt) {
          await this.storage.writeBackup(this.persistedSnapshot);
          await this.storage.trimBackups(this.backupLimit);
        }

        await this.storage.writePrimary(snapshotToPersist);
        this.snapshot = snapshotToPersist;
        this.persistedSnapshot = structuredClone(snapshotToPersist);
        this.status = "idle";
        this.lastError = null;
      } catch (error) {
        this.status = "error";
        this.lastError = error instanceof Error ? error.message : "Failed to save.";
      } finally {
        this.inFlightFlush = null;
        this.emit();
      }
    })();

    await this.inFlightFlush;
  }

  exportToString(): string {
    const payload: GameSaveExportV1 = {
      format: "pokeidle-save",
      exportedAt: new Date().toISOString(),
      save: this.snapshot,
    };

    return JSON.stringify(payload);
  }

  async importFromString(serializedSave: string): Promise<void> {
    const parsed = JSON.parse(serializedSave) as unknown;
    this.snapshot = migrateGameSave(parsed);
    this.snapshot.meta.updatedAt = new Date().toISOString();
    this.snapshot.meta.lastSavedAt = null;
    this.status = "dirty";
    this.lastError = null;
    this.emit();
    await this.flush();
  }

  async reset(): Promise<void> {
    this.snapshot = createDefaultGameSave();
    this.persistedSnapshot = null;
    this.status = "dirty";
    this.lastError = null;
    this.emit();
    await this.storage.clearAll();
    await this.flush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
    }

    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, this.autoFlushDelayMs);
  }

  private emit(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
