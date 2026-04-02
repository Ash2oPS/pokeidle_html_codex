import { z } from "zod";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
});

export const zoneLinkSchema = z.object({
  targetZoneId: z.string().min(1),
  requiresCompletion: z.boolean(),
  unlockFlag: z.string().min(1).optional(),
});

export const zoneBattleSettingsSchema = z.object({
  enemyPoolIds: z.array(z.string().min(1)),
  enemyTimerSeconds: z.number().positive(),
  defeatsRequired: z.number().int().positive(),
});

export const zoneDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["combat", "pacifist"]),
  name: localizedTextSchema,
  neighbors: z.array(zoneLinkSchema),
  battle: zoneBattleSettingsSchema.optional(),
});

export const baseStatsSchema = z.object({
  hp: z.number().nonnegative(),
  attack: z.number().nonnegative(),
  defense: z.number().nonnegative(),
  specialAttack: z.number().nonnegative(),
  specialDefense: z.number().nonnegative(),
  speed: z.number().nonnegative(),
});

export const pokemonSpeciesSummarySchema = z.object({
  id: z.string().min(1),
  dexNumber: z.number().int().positive(),
  familyId: z.string().min(1),
  name: localizedTextSchema,
  primaryType: z.string().min(1),
  secondaryType: z.string().min(1).optional(),
  spriteUrl: z.string().url(),
  baseStats: baseStatsSchema,
});

export const dialogueLineSchema = z.object({
  id: z.string().min(1),
  speakerId: z.string().min(1),
  text: localizedTextSchema,
});

export const dialogueDocumentSchema = z.object({
  id: z.string().min(1),
  title: localizedTextSchema,
  lines: z.array(dialogueLineSchema),
});

export type ZoneDefinitionInput = z.infer<typeof zoneDefinitionSchema>;
export type PokemonSpeciesSummaryInput = z.infer<typeof pokemonSpeciesSummarySchema>;
export type DialogueDocumentInput = z.infer<typeof dialogueDocumentSchema>;
