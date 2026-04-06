import { z } from "zod";

const idSchema = z.string().min(1);
const mojibakePattern = /Ã.|Â.|â€™|â€œ|â€|�/u;

function rejectLikelyMojibake(value: string): boolean {
  return !mojibakePattern.test(value);
}

export const canonicalSourceMetadataSchema = z
  .object({
    source: z.string().min(1),
    sourceVersion: z.string().min(1),
    sourceId: z.string().min(1),
    sourceUrl: z.string().url().optional(),
    reviewStatus: z.enum(["imported", "reviewed", "disputed"]),
    reviewedBy: z.string().min(1).optional(),
    reviewedAt: z.string().datetime({ offset: true }).optional(),
    notes: z.string().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (value.reviewStatus === "imported") {
      return;
    }

    if (!value.reviewedBy) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "reviewedBy is required when reviewStatus is not imported.",
        path: ["reviewedBy"],
      });
    }

    if (!value.reviewedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "reviewedAt is required when reviewStatus is not imported.",
        path: ["reviewedAt"],
      });
    }

    if (value.reviewStatus === "disputed" && !value.notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "notes is required when reviewStatus is disputed.",
        path: ["notes"],
      });
    }
  });

export const localizedTextSchema = z.object({
  en: z.string().min(1).refine(rejectLikelyMojibake, "Likely mojibake detected in English text."),
  fr: z.string().min(1).refine(rejectLikelyMojibake, "Likely mojibake detected in French text."),
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
  canonicalLocationId: idSchema.optional(),
  name: localizedTextSchema,
  battle: zoneBattleSettingsSchema,
});

export const pacifistZoneDefinitionSchema = z.object({
  id: idSchema,
  kind: z.literal("pacifist"),
  canonicalLocationId: idSchema.optional(),
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
  captureRate: z.number().int().nonnegative(),
  growthRate: idSchema,
  eggGroups: z.array(idSchema),
  formIds: z.array(idSchema),
  talentId: z.string().nullable(),
  source: canonicalSourceMetadataSchema,
});

export const pokemonFormDefinitionSchema = z.object({
  id: idSchema,
  speciesId: idSchema,
  pokemonId: idSchema,
  name: localizedTextSchema,
  formName: localizedTextSchema,
  isDefault: z.boolean(),
  isBattleOnly: z.boolean(),
  defensiveTypes: z.array(idSchema).min(1),
  defaultOffensiveType: idSchema,
  frontSpriteUrl: z.string().url(),
  baseStats: baseStatsSchema,
  source: canonicalSourceMetadataSchema,
});

export const canonLocationAreaDefinitionSchema = z.object({
  id: idSchema,
  pokeApiLocationAreaId: z.number().int().positive(),
  name: localizedTextSchema,
});

export const canonLocationDefinitionSchema = z.object({
  id: idSchema,
  pokeApiLocationId: z.number().int().positive(),
  name: localizedTextSchema,
  regionId: idSchema,
  kind: idSchema,
  adjacentLocationIds: z.array(idSchema),
  areas: z.array(canonLocationAreaDefinitionSchema),
  source: canonicalSourceMetadataSchema,
});

export const canonEncounterSlotDefinitionSchema = z.object({
  speciesId: idSchema,
  formId: idSchema.optional(),
  minLevel: z.number().int().positive(),
  maxLevel: z.number().int().positive(),
  chance: z.number().nonnegative(),
  conditionIds: z.array(idSchema),
});

export const canonEncounterMethodDefinitionSchema = z.object({
  methodId: idSchema,
  rate: z.number().nonnegative(),
  slots: z.array(canonEncounterSlotDefinitionSchema).min(1),
});

export const canonEncounterTableDefinitionSchema = z.object({
  id: idSchema,
  locationId: idSchema,
  locationAreaId: idSchema,
  versionId: idSchema,
  methods: z.array(canonEncounterMethodDefinitionSchema).min(1),
  source: canonicalSourceMetadataSchema,
});

export const canonGymEnemyDefinitionSchema = z.object({
  speciesId: idSchema,
  formId: idSchema.optional(),
  level: z.number().int().positive(),
});

export const canonGymTeamDefinitionSchema = z.object({
  id: idSchema,
  label: localizedTextSchema,
  availability: z.enum(["main", "postgame"]),
  battleKind: z.enum(["gym", "rematch"]),
  battleLocationId: idSchema,
  enemyTeam: z.array(canonGymEnemyDefinitionSchema).min(1),
});

export const canonGymDefinitionSchema = z.object({
  id: idSchema,
  locationId: idSchema,
  leaderId: idSchema,
  leaderName: localizedTextSchema,
  badgeName: localizedTextSchema,
  specialtyTypeId: idSchema,
  teams: z.array(canonGymTeamDefinitionSchema).min(1),
  source: canonicalSourceMetadataSchema,
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
  canonicalGymId: idSchema.optional(),
  name: localizedTextSchema,
  timeLimitSeconds: z.number().positive(),
  teamSizeLimit: z.number().int().positive().optional(),
  unlockFlagOnWin: idSchema.optional(),
  enemyTeam: z.array(battleEnemyDefinitionSchema).min(1).optional(),
}).superRefine((value, context) => {
  if (value.kind === "gym" && !value.canonicalGymId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "canonicalGymId is required for gym battles.",
      path: ["canonicalGymId"],
    });
  }
});

export type WorldMapDefinitionInput = z.infer<typeof worldMapDefinitionSchema>;
export type WorldMapNodeInput = z.infer<typeof worldMapNodeSchema>;
export type WorldMapLinkInput = z.infer<typeof worldMapLinkSchema>;
export type ZoneActivityDefinitionInput = z.infer<typeof zoneActivityDefinitionSchema>;
export type ZoneDefinitionInput = z.infer<typeof zoneDefinitionSchema>;
export type BattleEnemyDefinitionInput = z.infer<typeof battleEnemyDefinitionSchema>;
export type PokemonSpeciesDefinitionInput = z.infer<typeof pokemonSpeciesDefinitionSchema>;
export type PokemonFormDefinitionInput = z.infer<typeof pokemonFormDefinitionSchema>;
export type CanonLocationDefinitionInput = z.infer<typeof canonLocationDefinitionSchema>;
export type CanonEncounterTableDefinitionInput = z.infer<typeof canonEncounterTableDefinitionSchema>;
export type CanonGymDefinitionInput = z.infer<typeof canonGymDefinitionSchema>;
export type CombatTuningDefinitionInput = z.infer<typeof combatTuningDefinitionSchema>;
export type DialogueDocumentInput = z.infer<typeof dialogueDocumentSchema>;
export type QuestDefinitionInput = z.infer<typeof questDefinitionSchema>;
export type QuestObjectiveDefinitionInput = z.infer<typeof questObjectiveDefinitionSchema>;
export type QuestRewardDefinitionInput = z.infer<typeof questRewardDefinitionSchema>;
export type BattleDefinitionInput = z.infer<typeof battleDefinitionSchema>;
