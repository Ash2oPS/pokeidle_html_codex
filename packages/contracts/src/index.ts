export type Locale = "en" | "fr";

export interface LocalizedText {
  en: string;
  fr: string;
}

export type LayoutMode = "desktop-landscape" | "mobile-portrait";

export interface WorldMapNode {
  id: string;
  zoneId: string;
  position: {
    x: number;
    y: number;
  };
}

export interface WorldMapLink {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  requiresCompletion: boolean;
  unlockFlag?: string | undefined;
}

export interface WorldMapDefinition {
  id: string;
  name: LocalizedText;
  nodes: WorldMapNode[];
  links: WorldMapLink[];
}

export interface ZoneBattleSettings {
  enemyPoolIds: string[];
  enemyTimerSeconds: number;
  defeatsRequired: number;
  enemyLevel: number;
}

export interface ZoneDialogueNpcActivity {
  kind: "dialogue_npc";
  id: string;
  npcId: string;
  label: LocalizedText;
  dialogueId: string;
  grantsFlag?: string | undefined;
  startsQuestId?: string | undefined;
}

export interface ZoneTeamManagementActivity {
  kind: "team_management";
  id: string;
  label: LocalizedText;
}

export interface ZoneGymBattleActivity {
  kind: "gym_battle";
  id: string;
  label: LocalizedText;
  battleId: string;
}

export type ZoneActivityDefinition =
  | ZoneDialogueNpcActivity
  | ZoneTeamManagementActivity
  | ZoneGymBattleActivity;

export interface CombatZoneDefinition {
  id: string;
  kind: "combat";
  name: LocalizedText;
  battle: ZoneBattleSettings;
}

export interface PacifistZoneDefinition {
  id: string;
  kind: "pacifist";
  name: LocalizedText;
  activities: ZoneActivityDefinition[];
}

export type ZoneDefinition = CombatZoneDefinition | PacifistZoneDefinition;

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface BattleEnemyDefinition {
  speciesId: string;
  level: number;
}

export interface BattleEnemyState {
  speciesId: string;
  level: number;
  currentHp: number;
  maxHp: number;
  defensiveTypes: string[];
  reactionState: "wet" | null;
}

export type AttackClass = "physical" | "special";

export type CombatReactionOutcome =
  | "none"
  | "wet-applied"
  | "wet-boost"
  | "wet-dampen";

export interface CombatResolvedAttackEvent {
  eventKey: string;
  sessionKey: string;
  slotIndex: number;
  attackerSpeciesId: string;
  enemySpeciesId: string;
  offensiveType: string;
  attackClass: AttackClass;
  damage: number;
  didDefeatEnemy: boolean;
  reactionOutcome: CombatReactionOutcome;
  enemyHpBefore: number;
  enemyHpAfter: number;
  enemyMaxHp: number;
}

export interface PokemonSpeciesDefinition {
  id: string;
  dexNumber: number;
  familyId: string;
  name: LocalizedText;
  defensiveTypes: string[];
  defaultOffensiveType: string;
  frontSpriteUrl: string;
  baseStats: BaseStats;
  evolvesFromSpeciesId?: string | undefined;
  evolvesToSpeciesIds: string[];
  talentId: string | null;
}

export interface CombatTuningDefinition {
  id: string;
  slotIntervalMs: number;
  levelStatScalar: number;
  enemyHpMultiplier: number;
  damageConstant: number;
  wildActingXp: number;
  wildBenchXp: number;
  wildPokedollars: number;
  gymActingXp: number;
  gymBenchXp: number;
  gymClearPokedollars: number;
  xpBase: number;
  xpPerLevel: number;
}

export interface DialogueParticipant {
  id: string;
  name: LocalizedText;
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  text: LocalizedText;
}

export interface DialogueDocument {
  id: string;
  title: LocalizedText;
  participants: DialogueParticipant[];
  lines: DialogueLine[];
}

export type QuestCategory = "main" | "side";

export interface TalkToNpcQuestObjectiveDefinition {
  kind: "talk_to_npc";
  id: string;
  description: LocalizedText;
  npcId: string;
}

export interface CompleteZoneQuestObjectiveDefinition {
  kind: "complete_zone";
  id: string;
  description: LocalizedText;
  zoneId: string;
}

export interface WinBattleQuestObjectiveDefinition {
  kind: "win_battle";
  id: string;
  description: LocalizedText;
  battleId: string;
}

export type QuestObjectiveDefinition =
  | TalkToNpcQuestObjectiveDefinition
  | CompleteZoneQuestObjectiveDefinition
  | WinBattleQuestObjectiveDefinition;

export interface PokedollarsQuestRewardDefinition {
  kind: "pokedollars";
  amount: number;
}

export interface SetFlagQuestRewardDefinition {
  kind: "set_flag";
  flag: string;
}

export type QuestRewardDefinition =
  | PokedollarsQuestRewardDefinition
  | SetFlagQuestRewardDefinition;

export interface QuestDefinition {
  id: string;
  category: QuestCategory;
  title: LocalizedText;
  summary: LocalizedText;
  prerequisiteQuestIds: string[];
  requiredFlags: string[];
  objectives: QuestObjectiveDefinition[];
  rewards: QuestRewardDefinition[];
}

export type BattleKind = "trainer" | "gym";

export interface BattleDefinition {
  id: string;
  kind: BattleKind;
  name: LocalizedText;
  timeLimitSeconds: number;
  teamSizeLimit?: number | undefined;
  unlockFlagOnWin?: string | undefined;
  enemyTeam?: BattleEnemyDefinition[] | undefined;
}

export * from "./save";
