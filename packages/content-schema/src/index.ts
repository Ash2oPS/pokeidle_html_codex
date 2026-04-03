import { z } from "zod";

const idSchema = z.string().min(1);

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
});

export const worldMapNodeSchema = z.object({
  id: idSchema,
  zoneId: idSchema,
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
});

export const worldMapLinkSchema = z.object({
  id: idSchema,
  fromZoneId: idSchema,
  toZoneId: idSchema,
  requiresCompletion: z.boolean(),
  unlockFlag: idSchema.optional(),
});

export const worldMapDefinitionSchema = z.object({
  id: idSchema,
  name: localizedTextSchema,
  nodes: z.array(worldMapNodeSchema).min(1),
  links: z.array(worldMapLinkSchema),
});

export const zoneBattleSettingsSchema = z.object({
  enemyPoolIds: z.array(idSchema).min(1),
  enemyTimerSeconds: z.number().positive(),
  defeatsRequired: z.number().int().positive(),
  enemyLevel: z.number().int().positive(),
});

export const zoneDialogueNpcActivitySchema = z.object({
  kind: z.literal("dialogue_npc"),
  id: idSchema,
  npcId: idSchema,
  label: localizedTextSchema,
  dialogueId: idSchema,
  grantsFlag: idSchema.optional(),
  startsQuestId: idSchema.optional(),
});

export const zoneTeamManagementActivitySchema = z.object({
  kind: z.literal("team_management"),
  id: idSchema,
  label: localizedTextSchema,
});

export const zoneGymBattleActivitySchema = z.object({
  kind: z.literal("gym_battle"),
  id: idSchema,
  label: localizedTextSchema,
  battleId: idSchema,
});

export const zoneActivityDefinitionSchema = z.discriminatedUnion("kind", [
  zoneDialogueNpcActivitySchema,
  zoneTeamManagementActivitySchema,
  zoneGymBattleActivitySchema,
]);

export const combatZoneDefinitionSchema = z.object({
  id: idSchema,
  kind: z.literal("combat"),
  name: localizedTextSchema,
  battle: zoneBattleSettingsSchema,
});

export const pacifistZoneDefinitionSchema = z.object({
  id: idSchema,
  kind: z.literal("pacifist"),
  name: localizedTextSchema,
  activities: z.array(zoneActivityDefinitionSchema).min(1),
});

export const zoneDefinitionSchema = z.discriminatedUnion("kind", [
  combatZoneDefinitionSchema,
  pacifistZoneDefinitionSchema,
]);

export const baseStatsSchema = z.object({
  hp: z.number().nonnegative(),
  attack: z.number().nonnegative(),
  defense: z.number().nonnegative(),
  specialAttack: z.number().nonnegative(),
  specialDefense: z.number().nonnegative(),
  speed: z.number().nonnegative(),
});

export const battleEnemyDefinitionSchema = z.object({
  speciesId: idSchema,
  level: z.number().int().positive(),
});

export const pokemonSpeciesDefinitionSchema = z.object({
  id: idSchema,
  dexNumber: z.number().int().positive(),
  familyId: idSchema,
  name: localizedTextSchema,
  defensiveTypes: z.array(idSchema).min(1),
  defaultOffensiveType: idSchema,
  frontSpriteUrl: z.string().url(),
  baseStats: baseStatsSchema,
  evolvesFromSpeciesId: idSchema.optional(),
  evolvesToSpeciesIds: z.array(idSchema),
  talentId: z.string().nullable(),
});

export const combatTuningDefinitionSchema = z.object({
  id: idSchema,
  slotIntervalMs: z.number().int().positive(),
  levelStatScalar: z.number().positive(),
  enemyHpMultiplier: z.number().positive(),
  damageConstant: z.number().positive(),
  wildActingXp: z.number().int().positive(),
  wildBenchXp: z.number().int().positive(),
  wildPokedollars: z.number().int().positive(),
  gymActingXp: z.number().int().positive(),
  gymBenchXp: z.number().int().positive(),
  gymClearPokedollars: z.number().int().positive(),
  xpBase: z.number().int().positive(),
  xpPerLevel: z.number().int().positive(),
});

export const dialogueParticipantSchema = z.object({
  id: idSchema,
  name: localizedTextSchema,
});

export const dialogueLineSchema = z.object({
  id: idSchema,
  speakerId: idSchema,
  text: localizedTextSchema,
});

export const dialogueDocumentSchema = z.object({
  id: idSchema,
  title: localizedTextSchema,
  participants: z.array(dialogueParticipantSchema).min(1),
  lines: z.array(dialogueLineSchema).min(1),
});

export const talkToNpcQuestObjectiveDefinitionSchema = z.object({
  kind: z.literal("talk_to_npc"),
  id: idSchema,
  description: localizedTextSchema,
  npcId: idSchema,
});

export const completeZoneQuestObjectiveDefinitionSchema = z.object({
  kind: z.literal("complete_zone"),
  id: idSchema,
  description: localizedTextSchema,
  zoneId: idSchema,
});

export const winBattleQuestObjectiveDefinitionSchema = z.object({
  kind: z.literal("win_battle"),
  id: idSchema,
  description: localizedTextSchema,
  battleId: idSchema,
});

export const questObjectiveDefinitionSchema = z.discriminatedUnion("kind", [
  talkToNpcQuestObjectiveDefinitionSchema,
  completeZoneQuestObjectiveDefinitionSchema,
  winBattleQuestObjectiveDefinitionSchema,
]);

export const pokedollarsQuestRewardDefinitionSchema = z.object({
  kind: z.literal("pokedollars"),
  amount: z.number().int().nonnegative(),
});

export const setFlagQuestRewardDefinitionSchema = z.object({
  kind: z.literal("set_flag"),
  flag: idSchema,
});

export const questRewardDefinitionSchema = z.discriminatedUnion("kind", [
  pokedollarsQuestRewardDefinitionSchema,
  setFlagQuestRewardDefinitionSchema,
]);

export const questDefinitionSchema = z.object({
  id: idSchema,
  category: z.enum(["main", "side"]),
  title: localizedTextSchema,
  summary: localizedTextSchema,
  prerequisiteQuestIds: z.array(idSchema),
  requiredFlags: z.array(idSchema),
  objectives: z.array(questObjectiveDefinitionSchema).min(1),
  rewards: z.array(questRewardDefinitionSchema),
});

export const battleDefinitionSchema = z.object({
  id: idSchema,
  kind: z.enum(["trainer", "gym"]),
  name: localizedTextSchema,
  timeLimitSeconds: z.number().positive(),
  teamSizeLimit: z.number().int().positive().optional(),
  unlockFlagOnWin: idSchema.optional(),
  enemyTeam: z.array(battleEnemyDefinitionSchema).min(1).optional(),
});

export type WorldMapDefinitionInput = z.infer<typeof worldMapDefinitionSchema>;
export type WorldMapNodeInput = z.infer<typeof worldMapNodeSchema>;
export type WorldMapLinkInput = z.infer<typeof worldMapLinkSchema>;
export type ZoneActivityDefinitionInput = z.infer<typeof zoneActivityDefinitionSchema>;
export type ZoneDefinitionInput = z.infer<typeof zoneDefinitionSchema>;
export type BattleEnemyDefinitionInput = z.infer<typeof battleEnemyDefinitionSchema>;
export type PokemonSpeciesDefinitionInput = z.infer<typeof pokemonSpeciesDefinitionSchema>;
export type CombatTuningDefinitionInput = z.infer<typeof combatTuningDefinitionSchema>;
export type DialogueDocumentInput = z.infer<typeof dialogueDocumentSchema>;
export type QuestDefinitionInput = z.infer<typeof questDefinitionSchema>;
export type QuestObjectiveDefinitionInput = z.infer<typeof questObjectiveDefinitionSchema>;
export type QuestRewardDefinitionInput = z.infer<typeof questRewardDefinitionSchema>;
export type BattleDefinitionInput = z.infer<typeof battleDefinitionSchema>;
