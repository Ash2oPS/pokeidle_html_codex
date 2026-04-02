import type { Locale } from "./index";

export type SaveVersion = 1;

export interface SpeciesBattleCounters {
  encountered: number;
  defeated: number;
  captured: number;
}

export interface SpeciesProgressState {
  unlocked: boolean;
  level: number;
  experience: number;
  highestLevelReached: number;
  counters: SpeciesBattleCounters;
}

export interface FamilyProgressState {
  capturedTotal: number;
  masteryTier: number;
}

export type QuestStateKind = "locked" | "available" | "active" | "completed" | "reward-claimed";

export interface QuestProgressState {
  state: QuestStateKind;
  objectiveProgress: number[];
}

export interface ZoneProgressState {
  accessible: boolean;
  completed: boolean;
  visible: boolean;
  bestDefeatCount: number;
}

export interface SavePreferencesState {
  localeOverride: Locale | null;
}

export interface SavePlayerState {
  activeZoneId: string;
  pokedollars: number;
  starterChoice: string | null;
  unlockedSpeciesIds: string[];
  teamSlots: Array<string | null>;
}

export interface SliceActiveDialogueState {
  zoneId: string;
  activityId: string;
  dialogueId: string;
  lineIndex: number;
}

export interface SliceProgressState {
  activeDialogue: SliceActiveDialogueState | null;
}

export interface WildBattleSessionState {
  kind: "wild";
  zoneId: string;
  startedAt: string;
  lastProcessedAt: string;
  currentSlotIndex: number;
  elapsedMs: number;
  defeatsThisRun: number;
  rngState: number;
  enemy: import("./index").BattleEnemyState;
}

export interface GymBattleSessionState {
  kind: "gym";
  zoneId: string;
  battleId: string;
  startedAt: string;
  lastProcessedAt: string;
  currentSlotIndex: number;
  elapsedMs: number;
  enemyIndex: number;
  enemy: import("./index").BattleEnemyState;
}

export type ActiveBattleSessionState = WildBattleSessionState | GymBattleSessionState;

export interface BattleProgressState {
  activeSession: ActiveBattleSessionState | null;
}

export interface GameSaveMeta {
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string | null;
}

export interface GameSaveV1 {
  version: 1;
  meta: GameSaveMeta;
  preferences: SavePreferencesState;
  player: SavePlayerState;
  slice: SliceProgressState;
  battle: BattleProgressState;
  species: Record<string, SpeciesProgressState>;
  families: Record<string, FamilyProgressState>;
  zones: Record<string, ZoneProgressState>;
  quests: Record<string, QuestProgressState>;
  flags: Record<string, boolean>;
}

export interface GameSaveExportV1 {
  format: "pokeidle-save";
  exportedAt: string;
  save: GameSaveV1;
}
