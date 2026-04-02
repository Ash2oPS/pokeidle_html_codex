export { createDefaultGameSave, CURRENT_SAVE_VERSION, DEFAULT_ACTIVE_ZONE_ID } from "./default-save";
export { IndexedDbSaveStorage } from "./indexeddb-storage";
export { GameSaveManager } from "./manager";
export type { SaveManagerState, SaveStatus } from "./manager";
export { migrateGameSave } from "./migrations";
