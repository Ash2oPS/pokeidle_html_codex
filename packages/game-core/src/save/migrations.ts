import type {
  FamilyProgressState,
  GameSaveV1,
  QuestProgressState,
  SliceActiveDialogueState,
  SpeciesBattleCounters,
  SpeciesProgressState,
  ZoneProgressState,
} from "@pokeidle/contracts";
import { createDefaultGameSave, CURRENT_SAVE_VERSION, DEFAULT_ACTIVE_ZONE_ID } from "./default-save";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown, fallback: number, minimum = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(minimum, value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function migrateSpeciesCounters(value: unknown): SpeciesBattleCounters {
  const record = isRecord(value) ? value : {};

  return {
    encountered: readNumber(record.encountered, 0),
    defeated: readNumber(record.defeated, 0),
    captured: readNumber(record.captured, 0),
  };
}

function migrateSpeciesState(value: unknown): SpeciesProgressState {
  const record = isRecord(value) ? value : {};
  const level = readNumber(record.level, 1, 1);

  return {
    unlocked: readBoolean(record.unlocked, false),
    level,
    experience: readNumber(record.experience, 0),
    highestLevelReached: readNumber(record.highestLevelReached, level, 1),
    counters: migrateSpeciesCounters(record.counters),
  };
}

function migrateFamilyState(value: unknown): FamilyProgressState {
  const record = isRecord(value) ? value : {};

  return {
    capturedTotal: readNumber(record.capturedTotal, 0),
    masteryTier: readNumber(record.masteryTier, 0),
  };
}

function migrateZoneState(value: unknown): ZoneProgressState {
  const record = isRecord(value) ? value : {};

  return {
    accessible: readBoolean(record.accessible, false),
    completed: readBoolean(record.completed, false),
    visible: readBoolean(record.visible, false),
    bestDefeatCount: readNumber(record.bestDefeatCount, 0),
  };
}

function migrateQuestState(value: unknown): QuestProgressState {
  const record = isRecord(value) ? value : {};
  const rawState = readString(record.state, "locked");

  return {
    state:
      rawState === "available" ||
      rawState === "active" ||
      rawState === "completed" ||
      rawState === "reward-claimed"
        ? rawState
        : "locked",
    objectiveProgress: Array.isArray(record.objectiveProgress)
      ? record.objectiveProgress.map((entry) => readNumber(entry, 0))
      : [],
  };
}

function migrateActiveDialogueState(value: unknown): SliceActiveDialogueState | null {
  const record = isRecord(value) ? value : null;

  if (!record) {
    return null;
  }

  return {
    zoneId: readString(record.zoneId, DEFAULT_ACTIVE_ZONE_ID),
    activityId: readString(record.activityId, "unknown-activity"),
    dialogueId: readString(record.dialogueId, "unknown-dialogue"),
    lineIndex: readNumber(record.lineIndex, 0),
  };
}

function migrateRecord<T>(
  value: unknown,
  migrateEntry: (entry: unknown) => T,
): Record<string, T> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, migrateEntry(entry)]),
  );
}

function unwrapExport(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }

  if (raw.format === "pokeidle-save" && isRecord(raw.save)) {
    return raw.save;
  }

  return raw;
}

export function migrateGameSave(raw: unknown): GameSaveV1 {
  const nowIso = new Date().toISOString();
  const base = createDefaultGameSave(nowIso);
  const unwrapped = unwrapExport(raw);

  if (!isRecord(unwrapped)) {
    return base;
  }

  const version = readNumber(unwrapped.version, CURRENT_SAVE_VERSION);

  if (version !== CURRENT_SAVE_VERSION) {
    return base;
  }

  return {
    version: CURRENT_SAVE_VERSION,
    meta: {
      createdAt: readString(unwrapped.meta && isRecord(unwrapped.meta) ? unwrapped.meta.createdAt : undefined, nowIso),
      updatedAt: readString(unwrapped.meta && isRecord(unwrapped.meta) ? unwrapped.meta.updatedAt : undefined, nowIso),
      lastSavedAt:
        isRecord(unwrapped.meta) && typeof unwrapped.meta.lastSavedAt === "string"
          ? unwrapped.meta.lastSavedAt
          : null,
    },
    preferences: {
      localeOverride:
        isRecord(unwrapped.preferences) &&
        (unwrapped.preferences.localeOverride === "en" || unwrapped.preferences.localeOverride === "fr")
          ? unwrapped.preferences.localeOverride
          : null,
    },
    player: {
      activeZoneId: readString(
        isRecord(unwrapped.player) ? unwrapped.player.activeZoneId : undefined,
        DEFAULT_ACTIVE_ZONE_ID,
      ),
      pokedollars: readNumber(isRecord(unwrapped.player) ? unwrapped.player.pokedollars : undefined, 0),
    },
    slice: {
      activeDialogue: migrateActiveDialogueState(
        isRecord(unwrapped.slice) ? unwrapped.slice.activeDialogue : undefined,
      ),
    },
    species: migrateRecord(unwrapped.species, migrateSpeciesState),
    families: migrateRecord(unwrapped.families, migrateFamilyState),
    zones: migrateRecord(unwrapped.zones, migrateZoneState),
    quests: migrateRecord(unwrapped.quests, migrateQuestState),
    flags: isRecord(unwrapped.flags)
      ? Object.fromEntries(
          Object.entries(unwrapped.flags).map(([key, value]) => [key, readBoolean(value, false)]),
        )
      : {},
  };
}
