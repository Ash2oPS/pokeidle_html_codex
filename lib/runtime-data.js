import Papa from "../vendor/papaparse.js";
import { z } from "../vendor/zod.js";

function formatZodIssues(error) {
  return error.issues
    .map((issue) => {
      const path = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function parseWithSchema(schema, payload, contextLabel) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`${contextLabel}: ${formatZodIssues(result.error)}`);
  }
  return result.data;
}

function assertCsvParseSucceeded(result, sourceName = "CSV") {
  const errors = Array.isArray(result?.errors)
    ? result.errors.filter((error) => error && error.code !== "UndetectableDelimiter")
    : [];
  if (errors.length <= 0) {
    return;
  }
  const first = errors[0];
  const rowInfo = Number.isFinite(first?.row) ? ` ligne ${Number(first.row) + 1}` : "";
  throw new Error(`${sourceName} invalide${rowInfo}: ${String(first?.message || "erreur de parsing")}`);
}

function normalizeCsvFieldValue(value) {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || typeof value === "undefined") {
    return "";
  }
  return String(value);
}

function normalizeCsvInput(rawCsv) {
  return String(rawCsv || "").replace(/\r\n?/g, "\n");
}

const csvHeaderTransform = (header) =>
  String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();

const rawCsvRowSchema = z.record(z.string(), z.unknown());
const rawSaveSchema = z.record(z.string(), z.unknown());
const saveBridgePayloadSchema = z
  .object({
    save: rawSaveSchema,
  })
  .passthrough();

const mapMarkerSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .passthrough();

const routeEncounterLevelWeightSchema = z
  .object({
    level: z.number().int().nonnegative(),
    weight: z.number().nonnegative(),
  })
  .passthrough();

const routeEncounterSchema = z
  .object({
    id: z.number().int().positive(),
    name_en: z.string().min(1),
    name_fr: z.string().optional().default(""),
    methods: z.array(z.string()).optional().default([]),
    spawn_weight: z.number().nonnegative().optional(),
    min_level: z.number().int().nonnegative().optional(),
    max_level: z.number().int().nonnegative().optional(),
    catch_rate: z.number().nonnegative().optional(),
    level_weights: z.array(routeEncounterLevelWeightSchema).optional(),
  })
  .passthrough();

const routeDataSchema = z
  .object({
    route_id: z.string().min(1),
    route_name_fr: z.string().optional().default(""),
    zone_type: z.string().optional().default("route"),
    combat_enabled: z.boolean().optional().default(true),
    unlock_mode: z.string().optional().default("defeats"),
    unlock_defeats_required: z.number().int().nonnegative().optional().default(0),
    background_image: z.string().optional().default(""),
    map_marker: mapMarkerSchema.nullable().optional(),
    encounters: z.array(routeEncounterSchema).optional().default([]),
  })
  .passthrough();

const pokemonStatsSchema = z
  .object({
    hp: z.number().int().nonnegative(),
    attack: z.number().int().nonnegative(),
    defense: z.number().int().nonnegative(),
    "special-attack": z.number().int().nonnegative(),
    "special-defense": z.number().int().nonnegative(),
    speed: z.number().int().nonnegative(),
  })
  .passthrough();

const evolutionMethodSchema = z
  .object({
    evolution_type: z.string().optional(),
    trigger: z.string().optional(),
    min_level: z.number().int().nonnegative().optional(),
    item: z.string().optional(),
    held_item: z.string().optional(),
    time_of_day: z.string().optional(),
    location: z.string().optional(),
    party_species: z.string().optional(),
    relative_physical_stats: z.number().optional(),
  })
  .passthrough();

const evolutionLinkSchema = z
  .object({
    id: z.number().int().positive().optional(),
    name_en: z.string().min(1).optional(),
    evolution_methods: z.array(evolutionMethodSchema).optional().default([]),
  })
  .passthrough();

const pokemonSpriteSchema = z
  .object({
    front: z.string().nullable().optional(),
    front_shiny: z.string().nullable().optional(),
  })
  .passthrough();

const pokemonSpriteVariantSchema = z
  .object({
    id: z.string().min(1).optional(),
    label_fr: z.string().optional(),
    generation: z.number().int().nonnegative().optional(),
    game_key: z.string().optional(),
    front: z.string().nullable().optional(),
    front_shiny: z.string().nullable().optional(),
  })
  .passthrough();

const pokemonPayloadSchema = z
  .object({
    pokedex_number: z.number().int().positive(),
    name_fr: z.string().optional().default(""),
    name_en: z.string().min(1),
    defensive_types: z.array(z.string().min(1)).optional().default([]),
    offensive_type: z.string().optional().default(""),
    evolves_from: evolutionLinkSchema.nullable().optional(),
    evolves_to: z.array(evolutionLinkSchema).optional().default([]),
    stats: pokemonStatsSchema,
    catch_rate: z.number().int().nonnegative().optional().default(45),
    sprites: pokemonSpriteSchema.optional().default({}),
    sprite_variants: z.array(pokemonSpriteVariantSchema).optional().default([]),
    default_sprite_variant_id: z.string().optional().default(""),
  })
  .passthrough();

const normalizedBallConfigSchema = z
  .object({
    type: z.string().min(1),
    nameFr: z.string().min(1),
    price: z.number().int().nonnegative(),
    captureMultiplier: z.number().positive(),
    description: z.string(),
    spritePath: z.string(),
    comingSoon: z.boolean(),
    sortOrder: z.number().int().nonnegative(),
  })
  .passthrough();

const normalizedShopItemConfigSchema = z
  .object({
    id: z.string().min(1),
    category: z.string().min(1),
    nameFr: z.string().min(1),
    description: z.string(),
    price: z.number().int().nonnegative(),
    spritePath: z.string(),
    itemType: z.string().min(1),
    effectKind: z.string(),
    effectValue: z.union([z.string(), z.number()]),
    effectDurationMs: z.number().int().nonnegative(),
    stockTracked: z.boolean(),
    sortOrder: z.number().int().nonnegative(),
    stoneType: z.string(),
    methodItem: z.string(),
  })
  .passthrough();

const normalizedEncounterSchema = z
  .object({
    id: z.number().int().positive(),
    name_en: z.string(),
    name_fr: z.string(),
    spawn_weight: z.number().int().positive(),
    min_level: z.number().int().positive(),
    max_level: z.number().int().positive(),
    methods: z.array(z.string()),
  })
  .passthrough();

export function parseCsvRows(rawCsv, sourceName = "CSV") {
  const normalizedCsv = normalizeCsvInput(rawCsv);
  const result = Papa.parse(normalizedCsv, {
    skipEmptyLines: "greedy",
  });
  assertCsvParseSucceeded(result, sourceName);
  return Array.isArray(result.data)
    ? result.data.map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCsvFieldValue(cell)) : []))
    : [];
}

export function parseCsvObjects(rawCsv, sourceName = "CSV") {
  const normalizedCsv = normalizeCsvInput(rawCsv);
  const result = Papa.parse(normalizedCsv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: csvHeaderTransform,
  });
  assertCsvParseSucceeded(result, sourceName);

  const rows = Array.isArray(result.data) ? result.data : [];
  const objects = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = parseWithSchema(rawCsvRowSchema, rows[index], `${sourceName} ligne ${index + 2}`);
    if (Object.prototype.hasOwnProperty.call(row, "__parsed_extra")) {
      throw new Error(`${sourceName} ligne ${index + 2}: colonnes en trop detectees`);
    }

    const normalized = {};
    let hasValue = false;
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = csvHeaderTransform(key);
      if (!normalizedKey) {
        continue;
      }
      const normalizedValue = normalizeCsvFieldValue(value);
      if (normalizedValue.trim() !== "") {
        hasValue = true;
      }
      normalized[normalizedKey] = normalizedValue;
    }
    if (hasValue) {
      objects.push(normalized);
    }
  }
  return objects;
}

export function readCsvCell(row, key) {
  if (!row || typeof row !== "object") {
    return "";
  }
  if (!Object.prototype.hasOwnProperty.call(row, key)) {
    return "";
  }
  return String(row[key] || "").trim();
}

export function readCsvBooleanCell(row, key, fallback = false) {
  const value = readCsvCell(row, key).toLowerCase();
  if (!value) {
    return Boolean(fallback);
  }
  if (["1", "true", "yes", "y", "oui", "o", "on"].includes(value)) {
    return true;
  }
  if (["0", "false", "no", "n", "non", "off"].includes(value)) {
    return false;
  }
  return Boolean(fallback);
}

export function readCsvNumberCell(row, key, fallback = 0) {
  const rawValue = readCsvCell(row, key);
  if (!rawValue) {
    return fallback;
  }
  const normalized = rawValue.replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function readCsvTypedValue(row, key, fallback = "") {
  const rawValue = readCsvCell(row, key);
  if (!rawValue) {
    return fallback;
  }
  const normalized = rawValue.replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : rawValue;
}

export function parseCsvMethods(valueRaw) {
  return String(valueRaw || "")
    .split("|")
    .map((method) => String(method || "").toLowerCase().trim())
    .filter(Boolean);
}

export function assertSaveObject(payload, contextLabel = "Save") {
  return parseWithSchema(rawSaveSchema, payload, contextLabel);
}

export function parseSerializedSave(payload, contextLabel = "Save") {
  return assertSaveObject(JSON.parse(String(payload || "")), contextLabel);
}

export function parseSaveBridgePayload(payload, contextLabel = "Save bridge") {
  const parsed = parseWithSchema(saveBridgePayloadSchema, payload, contextLabel);
  return parsed.save;
}

export function validateRouteDataPayload(payload, contextLabel = "Route data") {
  return parseWithSchema(routeDataSchema, payload, contextLabel);
}

export function validatePokemonPayload(payload, contextLabel = "Pokemon data") {
  return parseWithSchema(pokemonPayloadSchema, payload, contextLabel);
}

export function assertValidBallConfig(payload, contextLabel = "Ball config") {
  return parseWithSchema(normalizedBallConfigSchema, payload, contextLabel);
}

export function assertValidShopItemConfig(payload, contextLabel = "Shop item config") {
  return parseWithSchema(normalizedShopItemConfigSchema, payload, contextLabel);
}

export function assertValidEncounter(payload, contextLabel = "Encounter config") {
  return parseWithSchema(normalizedEncounterSchema, payload, contextLabel);
}
