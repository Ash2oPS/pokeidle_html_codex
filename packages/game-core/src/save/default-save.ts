import type { GameSaveV1 } from "@pokeidle/contracts";

export const CURRENT_SAVE_VERSION = 1 as const;
export const DEFAULT_ACTIVE_ZONE_ID = "town-1";

export function createDefaultGameSave(nowIso = new Date().toISOString()): GameSaveV1 {
  return {
    version: CURRENT_SAVE_VERSION,
    meta: {
      createdAt: nowIso,
      updatedAt: nowIso,
      lastSavedAt: null,
    },
    preferences: {
      localeOverride: null,
    },
    player: {
      activeZoneId: DEFAULT_ACTIVE_ZONE_ID,
      pokedollars: 0,
    },
    slice: {
      activeDialogue: null,
    },
    species: {},
    families: {},
    zones: {},
    quests: {},
    flags: {},
  };
}
