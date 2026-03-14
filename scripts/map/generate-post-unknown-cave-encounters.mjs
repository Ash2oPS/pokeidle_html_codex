import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const MAP_DIR = path.join(ROOT_DIR, "map_data");
const POKEMON_DIR = path.join(ROOT_DIR, "pokemon_data");
const CATALOG_PATH = path.join(MAP_DIR, "kanto_frlg_zones.json");
const BASE_ENCOUNTER_PATH = path.join(MAP_DIR, "kanto_zone_encounters.csv");
const OUTPUT_PATH = path.join(MAP_DIR, "kanto_zone_encounters_post_unknown_cave.csv");
const UTF8_BOM = "\uFEFF";

const STARTER_IDS = new Set([1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393]);

const LEGENDARY_OR_MYTHICAL_IDS_FROM_WEB = new Set([
  144, 145, 146, 150, 243, 244, 245, 249, 250,
  377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488,
  151, 251, 385, 386, 489, 490, 491, 492, 493,
]);

const TAG_TYPE_WEIGHTS = Object.freeze({
  plains: Object.freeze({ normal: 3, flying: 3, grass: 2, bug: 2, ground: 2, fighting: 1 }),
  forest: Object.freeze({ bug: 4, grass: 4, poison: 3, flying: 2, normal: 1 }),
  urban: Object.freeze({ normal: 3, poison: 2, electric: 2, psychic: 2, fighting: 1, dark: 1, steel: 1 }),
  cave: Object.freeze({ rock: 4, ground: 4, steel: 3, poison: 2, dark: 2, ghost: 2, fighting: 2 }),
  mountain: Object.freeze({ rock: 4, ground: 4, fighting: 3, fire: 2, dragon: 2, flying: 2 }),
  coast: Object.freeze({ water: 4, flying: 2, electric: 2, poison: 2, ice: 1, bug: 1 }),
  ocean: Object.freeze({ water: 5, ice: 3, dragon: 2, electric: 1, flying: 1 }),
  wetland: Object.freeze({ water: 4, grass: 3, bug: 3, poison: 3, ground: 2, normal: 1 }),
  haunted: Object.freeze({ ghost: 5, dark: 4, psychic: 3, poison: 2 }),
  industrial: Object.freeze({ electric: 5, steel: 4, poison: 2, normal: 1 }),
  fire: Object.freeze({ fire: 5, poison: 2, dark: 2, rock: 2, ghost: 1 }),
  ice: Object.freeze({ ice: 5, water: 3, flying: 1 }),
  psychic: Object.freeze({ psychic: 5, fighting: 2, ghost: 1, dark: 1 }),
  safari: Object.freeze({ grass: 4, bug: 4, ground: 3, normal: 3, poison: 3, water: 2, flying: 2 }),
});

const TYPE_RARITY_BONUS = new Set(["dragon", "steel", "ghost", "dark", "ice"]);

function csvEscape(value) {
  const raw = String(value ?? "");
  if (raw.includes("\"") || raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `\"${raw.replace(/\"/g, "\"\"")}\"`;
  }
  return raw;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toSafeInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function parseCsv(content) {
  const text = String(content || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"") {
      if (inQuote && next === "\"") {
        cell += "\"";
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (!inQuote && char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (!inQuote && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell);
      cell = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }
  return rows;
}

function hashToUnit(input) {
  const str = String(input ?? "");
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000000) / 1000000;
}

function loadCatalog() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const zoneById = new Map((catalog?.zones || []).map((zone) => [String(zone?.route_id || ""), zone]));
  const zoneOrder = Array.isArray(catalog?.zone_order)
    ? catalog.zone_order.map((routeId) => String(routeId || "")).filter(Boolean)
    : [];
  return { zoneById, zoneOrder };
}

function loadRouteJson(routeId) {
  const filePath = path.join(MAP_DIR, `${routeId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadSpecies() {
  const all = [];
  const dirents = fs.readdirSync(POKEMON_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const dirent of dirents) {
    const folder = String(dirent.name || "");
    const match = folder.match(/^(\d+)_/);
    if (!match) {
      continue;
    }
    const id = Number(match[1]);
    if (!Number.isFinite(id) || id <= 0 || id > 493) {
      continue;
    }
    const dataPath = path.join(POKEMON_DIR, folder, `${folder}_data.json`);
    if (!fs.existsSync(dataPath)) {
      continue;
    }
    let payload = null;
    try {
      payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch {
      continue;
    }
    const stats = payload?.stats && typeof payload.stats === "object" ? payload.stats : {};
    const bst = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"]
      .map((key) => toSafeInt(stats[key], 0))
      .reduce((sum, value) => sum + value, 0);
    const types = Array.isArray(payload?.defensive_types)
      ? payload.defensive_types.map((type) => String(type || "").toLowerCase().trim()).filter(Boolean)
      : [];
    all.push({
      id,
      nameEn: String(payload?.name_en || "").toLowerCase().trim(),
      nameFr: String(payload?.name_fr || payload?.name_en || "Pokemon").trim(),
      types,
      catchRate: clamp(toSafeInt(payload?.catch_rate, 120), 1, 255),
      bst: Math.max(120, bst),
      evolvesFromId: Number(payload?.evolves_from?.id || 0) || 0,
      isLegendary: Boolean(payload?.is_legendary),
      isMythical: Boolean(payload?.is_mythical),
    });
  }
  all.sort((a, b) => a.id - b.id);
  return all;
}

function loadLegacyOnlyOneRows() {
  if (!fs.existsSync(BASE_ENCOUNTER_PATH)) {
    return [];
  }
  const csvRows = parseCsv(fs.readFileSync(BASE_ENCOUNTER_PATH, "utf8"));
  if (csvRows.length <= 1) {
    return [];
  }
  const header = csvRows[0];
  const columnIndex = Object.fromEntries(header.map((name, index) => [String(name || ""), index]));
  const requiredColumns = [
    "route_id",
    "route_name_fr",
    "zone_type",
    "combat_enabled",
    "pokemon_id",
    "pokemon_name_en",
    "pokemon_name_fr",
    "spawn_weight",
    "min_level",
    "max_level",
    "methods",
  ];
  for (const columnName of requiredColumns) {
    if (!Number.isInteger(columnIndex[columnName])) {
      return [];
    }
  }

  const legacyRows = [];
  const dedupeKeys = new Set();
  for (const row of csvRows.slice(1)) {
    const methodsRaw = String(row[columnIndex.methods] || "").trim().toLowerCase();
    const methods = methodsRaw.split("|").map((method) => method.trim()).filter(Boolean);
    if (!methods.includes("only-one")) {
      continue;
    }
    const pokemonId = toSafeInt(row[columnIndex.pokemon_id], 0);
    if (pokemonId <= 0) {
      continue;
    }
    const routeId = String(row[columnIndex.route_id] || "").trim();
    if (!routeId) {
      continue;
    }
    const dedupeKey = `${routeId}:${pokemonId}`;
    if (dedupeKeys.has(dedupeKey)) {
      continue;
    }
    dedupeKeys.add(dedupeKey);
    legacyRows.push({
      route_id: routeId,
      route_name_fr: String(row[columnIndex.route_name_fr] || "").trim(),
      zone_type: String(row[columnIndex.zone_type] || "").trim(),
      combat_enabled: String(row[columnIndex.combat_enabled] || "true").trim().toLowerCase() === "false" ? "false" : "true",
      pokemon_id: pokemonId,
      pokemon_name_en: String(row[columnIndex.pokemon_name_en] || "").trim().toLowerCase(),
      pokemon_name_fr: String(row[columnIndex.pokemon_name_fr] || "").trim(),
      spawn_weight: clamp(toSafeInt(row[columnIndex.spawn_weight], 1), 1, 255),
      min_level: clamp(toSafeInt(row[columnIndex.min_level], 1), 1, 100),
      max_level: clamp(toSafeInt(row[columnIndex.max_level], 1), 1, 100),
      methods: "only-one",
    });
  }
  return legacyRows;
}

function buildRowsByRouteId(rows) {
  const rowsByRouteId = new Map();
  for (const row of rows) {
    const routeId = String(row?.route_id || "");
    if (!routeId) {
      continue;
    }
    if (!rowsByRouteId.has(routeId)) {
      rowsByRouteId.set(routeId, []);
    }
    rowsByRouteId.get(routeId).push(row);
  }
  return rowsByRouteId;
}

function inferRouteTags(routeId, zoneType) {
  const id = String(routeId || "");
  const tags = new Set();

  if (zoneType === "town") {
    tags.add("urban");
  }
  if (zoneType === "route") {
    tags.add("plains");
  }
  if (zoneType === "dungeon") {
    tags.add("cave");
  }

  if (id.includes("viridian_forest")) {
    tags.add("forest");
  }
  if (id.includes("mt_moon") || id.includes("rock_tunnel") || id.includes("digletts_cave") || id.includes("victory_road")) {
    tags.add("mountain");
    tags.add("cave");
  }
  if (id.includes("power_plant")) {
    tags.add("industrial");
  }
  if (id.includes("pokemon_tower") || id.includes("lavender_town")) {
    tags.add("haunted");
  }
  if (id.includes("safari_zone")) {
    tags.add("safari");
    tags.add("wetland");
    tags.add("forest");
  }
  if (id.includes("seafoam_islands")) {
    tags.add("ocean");
    tags.add("ice");
    tags.add("cave");
  }
  if (id.includes("pokemon_mansion") || id.includes("cinnabar_island")) {
    tags.add("fire");
  }
  if (id.includes("cerulean_cave")) {
    tags.add("cave");
    tags.add("psychic");
    tags.add("wetland");
  }

  if (id.includes("route_19") || id.includes("route_20") || id.includes("route_21")) {
    tags.add("ocean");
    tags.add("coast");
  }

  if (id.includes("route_12") || id.includes("route_13") || id.includes("route_14") || id.includes("route_15") || id.includes("route_18")) {
    tags.add("coast");
  }

  if (id.includes("route_24") || id.includes("route_25")) {
    tags.add("forest");
  }

  if (id.includes("route_16") || id.includes("route_17") || id.includes("route_22") || id.includes("route_23")) {
    tags.add("mountain");
  }

  if (id.includes("vermilion") || id.includes("fuchsia") || id.includes("cerulean")) {
    tags.add("coast");
  }

  if (tags.size === 0) {
    tags.add("plains");
  }

  return tags;
}

function getTargetEncounterCount(zoneType, routeId) {
  const id = String(routeId || "");
  if (zoneType === "town") {
    return 9;
  }
  if (zoneType === "dungeon") {
    if (id.includes("pokemon_tower")) {
      return 13;
    }
    if (id.includes("power_plant")) {
      return 14;
    }
    if (id.includes("safari_zone") || id.includes("seafoam") || id.includes("cerulean_cave") || id.includes("victory_road")) {
      return 18;
    }
    return 16;
  }
  if (id.includes("route_19") || id.includes("route_20") || id.includes("route_21")) {
    return 18;
  }
  if (id.includes("route_22") || id.includes("route_23") || id.includes("route_24") || id.includes("route_25")) {
    return 15;
  }
  return 14;
}

function buildRouteProfiles(zoneOrder, zoneById) {
  const profiles = [];
  const routeCount = Math.max(1, zoneOrder.length - 1);
  for (let index = 0; index < zoneOrder.length; index += 1) {
    const routeId = zoneOrder[index];
    const zone = zoneById.get(routeId) || {};
    const zoneType = String(zone?.zone_type || "route").toLowerCase().trim() || "route";
    const routeJson = loadRouteJson(routeId);
    const encounters = Array.isArray(routeJson?.encounters) ? routeJson.encounters : [];
    const minLevels = encounters.map((entry) => toSafeInt(entry?.min_level, 1)).filter((level) => level > 0);
    const maxLevels = encounters.map((entry) => toSafeInt(entry?.max_level, 1)).filter((level) => level > 0);
    const fallbackMin = clamp(2 + Math.floor(index * 1.35), 1, 88);
    const fallbackMax = clamp(fallbackMin + 12, fallbackMin + 2, 100);
    const baseMinLevel = minLevels.length > 0 ? Math.max(1, Math.min(...minLevels)) : fallbackMin;
    const baseMaxLevel = maxLevels.length > 0
      ? clamp(Math.max(...maxLevels), baseMinLevel + 2, 100)
      : fallbackMax;

    profiles.push({
      routeId,
      routeNameFr: String(zone?.route_name_fr || routeJson?.route_name_fr || routeId),
      zoneType,
      combatEnabled: zone?.combat_enabled !== false,
      tags: inferRouteTags(routeId, zoneType),
      targetCount: getTargetEncounterCount(zoneType, routeId),
      baseMinLevel,
      baseMaxLevel,
      difficulty: routeCount > 0 ? index / routeCount : 0,
    });
  }
  return profiles;
}

function buildFamilyData(speciesList) {
  const byId = new Map(speciesList.map((species) => [species.id, species]));

  const rootMemo = new Map();
  function getRootId(id) {
    if (rootMemo.has(id)) {
      return rootMemo.get(id);
    }
    const visited = new Set();
    let current = id;
    while (byId.has(current)) {
      const species = byId.get(current);
      const parent = Number(species?.evolvesFromId || 0);
      if (!parent || !byId.has(parent) || visited.has(parent)) {
        break;
      }
      visited.add(parent);
      current = parent;
    }
    rootMemo.set(id, current);
    return current;
  }

  const stageMemo = new Map();
  function getStageDepth(id) {
    if (stageMemo.has(id)) {
      return stageMemo.get(id);
    }
    const species = byId.get(id);
    if (!species) {
      stageMemo.set(id, 0);
      return 0;
    }
    const parent = Number(species.evolvesFromId || 0);
    if (!parent || !byId.has(parent) || parent === id) {
      stageMemo.set(id, 0);
      return 0;
    }
    const depth = 1 + getStageDepth(parent);
    stageMemo.set(id, depth);
    return depth;
  }

  for (const species of speciesList) {
    species.familyRootId = getRootId(species.id);
    species.stageDepth = clamp(getStageDepth(species.id), 0, 3);
  }
}

function getTypeAffinityScore(species, routeProfile) {
  let score = 0;
  for (const tag of routeProfile.tags) {
    const weights = TAG_TYPE_WEIGHTS[tag];
    if (!weights) {
      continue;
    }
    for (const type of species.types) {
      score += Number(weights[type] || 0);
    }
  }
  return score;
}

function getStarterRouteBonus(species, routeProfile) {
  if (!STARTER_IDS.has(species.id)) {
    return 0;
  }
  if (routeProfile.zoneType === "town") {
    return -3;
  }
  if (species.types.includes("water") && (routeProfile.tags.has("coast") || routeProfile.tags.has("ocean") || routeProfile.tags.has("wetland"))) {
    return 3;
  }
  if (species.types.includes("fire") && (routeProfile.tags.has("fire") || routeProfile.tags.has("mountain"))) {
    return 3;
  }
  if (species.types.includes("grass") && (routeProfile.tags.has("forest") || routeProfile.tags.has("safari") || routeProfile.tags.has("wetland"))) {
    return 3;
  }
  return 1;
}

function computeRouteSuitability(species, routeProfile) {
  const affinity = getTypeAffinityScore(species, routeProfile);
  const powerTier = clamp((species.bst - 260) / 360 + species.stageDepth * 0.08, 0, 1);
  const difficultyFit = 1 - Math.min(1, Math.abs(routeProfile.difficulty - powerTier));
  const catchEase = clamp(species.catchRate / 255, 0, 1);
  const catchFit = 1 - Math.min(1, Math.abs(routeProfile.difficulty - (1 - catchEase)));
  const routeNoise = hashToUnit(`${routeProfile.routeId}:${species.id}`) * 0.24;
  const starterBonus = getStarterRouteBonus(species, routeProfile);
  return affinity * 1.35 + difficultyFit * 2.15 + catchFit * 0.9 + routeNoise + starterBonus;
}

function pickBestRouteForSpecies(species, routeProfiles, routeAssignments, speciesUsage) {
  let bestRoute = null;
  let bestScore = -Infinity;
  for (const routeProfile of routeProfiles) {
    const assignedIds = routeAssignments.get(routeProfile.routeId);
    if (assignedIds.has(species.id)) {
      continue;
    }
    const count = assignedIds.size;
    const overCapacity = Math.max(0, count - routeProfile.targetCount);
    const crowdPenalty = overCapacity * 1.65 + (count / Math.max(1, routeProfile.targetCount)) * 0.22;
    const usagePenalty = Math.max(0, (speciesUsage.get(species.id) || 0) - 1) * 0.9;
    const score = computeRouteSuitability(species, routeProfile) - crowdPenalty - usagePenalty;
    if (score > bestScore) {
      bestScore = score;
      bestRoute = routeProfile;
    }
  }
  return bestRoute;
}

function assignSpeciesToRoutes(speciesList, routeProfiles) {
  const routeAssignments = new Map(routeProfiles.map((routeProfile) => [routeProfile.routeId, new Set()]));
  const speciesUsage = new Map(speciesList.map((species) => [species.id, 0]));
  const totalTarget = routeProfiles.reduce((sum, routeProfile) => sum + Math.max(1, routeProfile.targetCount), 0);

  const primaryQuotaByRouteId = new Map();
  let primaryQuotaTotal = 0;
  for (const routeProfile of routeProfiles) {
    const quotaRaw = Math.round((Math.max(1, routeProfile.targetCount) / Math.max(1, totalTarget)) * speciesList.length);
    const quota = clamp(quotaRaw, 3, Math.max(3, routeProfile.targetCount));
    primaryQuotaByRouteId.set(routeProfile.routeId, quota);
    primaryQuotaTotal += quota;
  }
  if (primaryQuotaTotal !== speciesList.length) {
    const sortedByNeed = routeProfiles
      .slice()
      .sort((a, b) => b.targetCount - a.targetCount || a.routeId.localeCompare(b.routeId));
    let diff = speciesList.length - primaryQuotaTotal;
    let guard = 0;
    while (diff !== 0 && guard < 10000) {
      guard += 1;
      for (const routeProfile of sortedByNeed) {
        const current = primaryQuotaByRouteId.get(routeProfile.routeId) || 0;
        if (diff > 0) {
          if (current >= routeProfile.targetCount) {
            continue;
          }
          primaryQuotaByRouteId.set(routeProfile.routeId, current + 1);
          diff -= 1;
        } else if (diff < 0) {
          if (current <= 3) {
            continue;
          }
          primaryQuotaByRouteId.set(routeProfile.routeId, current - 1);
          diff += 1;
        }
        if (diff === 0) {
          break;
        }
      }
    }
  }

  const candidateBreadth = new Map();
  for (const species of speciesList) {
    let positiveCount = 0;
    for (const routeProfile of routeProfiles) {
      if (getTypeAffinityScore(species, routeProfile) > 0) {
        positiveCount += 1;
      }
    }
    candidateBreadth.set(species.id, positiveCount);
  }

  const primaryPass = speciesList
    .slice()
    .sort((a, b) => {
      const breadthA = candidateBreadth.get(a.id) || 0;
      const breadthB = candidateBreadth.get(b.id) || 0;
      if (breadthA !== breadthB) {
        return breadthA - breadthB;
      }
      if (a.bst !== b.bst) {
        return b.bst - a.bst;
      }
      return a.id - b.id;
    });

  for (const species of primaryPass) {
    const quotaFilteredRoutes = routeProfiles.filter((routeProfile) => {
      const assigned = routeAssignments.get(routeProfile.routeId);
      const quota = primaryQuotaByRouteId.get(routeProfile.routeId) || 0;
      return assigned.size < quota;
    });
    const candidateRoutes = quotaFilteredRoutes.length > 0 ? quotaFilteredRoutes : routeProfiles;
    const routeProfile = pickBestRouteForSpecies(species, candidateRoutes, routeAssignments, speciesUsage);
    if (!routeProfile) {
      continue;
    }
    routeAssignments.get(routeProfile.routeId).add(species.id);
    speciesUsage.set(species.id, (speciesUsage.get(species.id) || 0) + 1);
  }

  let changed = true;
  let safety = 0;
  while (changed && safety < 2000) {
    changed = false;
    safety += 1;

    for (const routeProfile of routeProfiles) {
      const assigned = routeAssignments.get(routeProfile.routeId);
      if (assigned.size >= routeProfile.targetCount) {
        continue;
      }

      let bestCandidate = null;
      let bestScore = -Infinity;
      for (const species of speciesList) {
        if (assigned.has(species.id)) {
          continue;
        }
        const usage = speciesUsage.get(species.id) || 0;
        if (STARTER_IDS.has(species.id) && usage >= 1) {
          continue;
        }
        const usageBonus = 2.2 / (1 + usage);
        const score = computeRouteSuitability(species, routeProfile) + usageBonus - usage * 0.34;
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = species;
        }
      }

      if (!bestCandidate) {
        continue;
      }

      assigned.add(bestCandidate.id);
      speciesUsage.set(bestCandidate.id, (speciesUsage.get(bestCandidate.id) || 0) + 1);
      changed = true;
    }
  }

  return { routeAssignments, speciesUsage };
}

function computeSpawnWeight(species) {
  if (STARTER_IDS.has(species.id)) {
    return 1;
  }

  let weight = 10;
  if (species.bst <= 330) {
    weight = 16;
  } else if (species.bst <= 390) {
    weight = 13;
  } else if (species.bst <= 450) {
    weight = 10;
  } else if (species.bst <= 510) {
    weight = 6;
  } else if (species.bst <= 560) {
    weight = 4;
  } else {
    weight = 2;
  }

  if (species.stageDepth >= 2) {
    weight -= 2;
  } else if (species.stageDepth === 1) {
    weight -= 1;
  }

  if (species.catchRate <= 45) {
    weight -= 2;
  } else if (species.catchRate <= 75) {
    weight -= 1;
  }

  if (species.types.some((type) => TYPE_RARITY_BONUS.has(type))) {
    weight -= 1;
  }

  return clamp(weight, 1, 18);
}

function computeEncounterLevels(species, routeProfile) {
  const baseMin = clamp(toSafeInt(routeProfile.baseMinLevel, 1), 1, 96);
  const baseMax = clamp(toSafeInt(routeProfile.baseMaxLevel, baseMin + 2), baseMin + 2, 100);
  const baseSpan = Math.max(4, baseMax - baseMin);

  const powerOffset = Math.round((species.bst - 330) / 75) + species.stageDepth * 2;
  const minLevel = clamp(baseMin + powerOffset, 1, 97);
  const maxLevel = clamp(
    Math.max(minLevel + 2, minLevel + Math.round(baseSpan * 0.75) + species.stageDepth),
    minLevel,
    100,
  );

  return { minLevel, maxLevel };
}

function pickMethods(species, routeProfile) {
  const hasWater = species.types.includes("water");
  const hasRockGround = species.types.includes("rock") || species.types.includes("ground");
  const hasSteel = species.types.includes("steel");

  if (routeProfile.tags.has("ocean")) {
    if (hasWater) {
      if (species.stageDepth >= 2 || species.bst >= 520) {
        return "super-rod|surf";
      }
      if (species.stageDepth >= 1 || species.bst >= 430) {
        return "good-rod|surf";
      }
      return "old-rod|good-rod|surf";
    }
    return "walk";
  }

  if (routeProfile.tags.has("coast") || routeProfile.tags.has("wetland")) {
    if (hasWater) {
      if (species.stageDepth >= 2 || species.bst >= 500) {
        return "super-rod|surf";
      }
      if (species.stageDepth >= 1 || species.bst >= 400) {
        return "good-rod|surf";
      }
      return "old-rod|good-rod|surf";
    }
    return "walk";
  }

  if (routeProfile.tags.has("cave")) {
    if (hasRockGround || hasSteel) {
      return "rock-smash|walk";
    }
    if (hasWater) {
      return "surf|walk";
    }
    return "walk";
  }

  return "walk";
}

function buildRows(routeProfiles, routeAssignments, speciesById, legacyOnlyOneRowsByRouteId) {
  const rows = [];
  for (const routeProfile of routeProfiles) {
    const assignedIds = Array.from(routeAssignments.get(routeProfile.routeId) || []);
    const encounters = [];

    for (const speciesId of assignedIds) {
      const species = speciesById.get(speciesId);
      if (!species) {
        continue;
      }
      const levels = computeEncounterLevels(species, routeProfile);
      encounters.push({
        route_id: routeProfile.routeId,
        route_name_fr: routeProfile.routeNameFr,
        zone_type: routeProfile.zoneType,
        combat_enabled: routeProfile.combatEnabled ? "true" : "false",
        pokemon_id: species.id,
        pokemon_name_en: species.nameEn,
        pokemon_name_fr: species.nameFr,
        spawn_weight: computeSpawnWeight(species),
        min_level: levels.minLevel,
        max_level: levels.maxLevel,
        methods: pickMethods(species, routeProfile),
      });
    }

    const forcedRows = legacyOnlyOneRowsByRouteId.get(routeProfile.routeId) || [];
    for (const forcedRow of forcedRows) {
      encounters.push({
        route_id: routeProfile.routeId,
        route_name_fr: forcedRow.route_name_fr || routeProfile.routeNameFr,
        zone_type: forcedRow.zone_type || routeProfile.zoneType,
        combat_enabled: forcedRow.combat_enabled || (routeProfile.combatEnabled ? "true" : "false"),
        pokemon_id: forcedRow.pokemon_id,
        pokemon_name_en: forcedRow.pokemon_name_en,
        pokemon_name_fr: forcedRow.pokemon_name_fr,
        spawn_weight: forcedRow.spawn_weight,
        min_level: forcedRow.min_level,
        max_level: forcedRow.max_level,
        methods: "only-one",
      });
    }

    encounters.sort((a, b) => b.spawn_weight - a.spawn_weight || a.pokemon_id - b.pokemon_id);
    rows.push(...encounters);
  }
  return rows;
}

function rowKey(row) {
  return `${String(row?.route_id || "")}:${toSafeInt(row?.pokemon_id, 0)}:${String(row?.methods || "").trim().toLowerCase()}`;
}

function validateOutput(rows, speciesList, legacyOnlyOneRows) {
  const outputIds = new Set(rows.map((row) => Number(row.pokemon_id || 0)).filter((id) => id > 0));
  const eligibleIds = new Set(speciesList.map((species) => species.id));

  const missing = Array.from(eligibleIds).filter((id) => !outputIds.has(id));
  if (missing.length > 0) {
    throw new Error(`Des especes eligibles manquent dans le mapping: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? "..." : ""}`);
  }

  const allowedLegacyKeys = new Set(
    legacyOnlyOneRows
      .filter((row) => LEGENDARY_OR_MYTHICAL_IDS_FROM_WEB.has(Number(row.pokemon_id || 0)))
      .map((row) => rowKey(row)),
  );
  const forbiddenRows = rows.filter((row) => LEGENDARY_OR_MYTHICAL_IDS_FROM_WEB.has(Number(row.pokemon_id || 0)));
  const forbiddenUnexpected = forbiddenRows.filter((row) => !allowedLegacyKeys.has(rowKey(row)));
  if (forbiddenUnexpected.length > 0) {
    const ids = Array.from(new Set(forbiddenUnexpected.map((row) => Number(row.pokemon_id || 0)))).sort((a, b) => a - b);
    throw new Error(`Le mapping contient des IDs legendaires/fabuleux interdits: ${ids.join(", ")}`);
  }

  const outputForbiddenLegacyKeys = new Set(forbiddenRows.map((row) => rowKey(row)));
  const missingLegacyForbidden = Array.from(allowedLegacyKeys).filter((key) => !outputForbiddenLegacyKeys.has(key));
  if (missingLegacyForbidden.length > 0) {
    throw new Error("Des rencontres historiques only-one sont absentes du mapping post-grotte.");
  }
}

function writeCsv(rows) {
  const header = [
    "route_id",
    "route_name_fr",
    "zone_type",
    "combat_enabled",
    "pokemon_id",
    "pokemon_name_en",
    "pokemon_name_fr",
    "spawn_weight",
    "min_level",
    "max_level",
    "methods",
  ];
  const lines = [header.map(csvEscape).join(",")];

  for (const row of rows) {
    lines.push([
      row.route_id,
      row.route_name_fr,
      row.zone_type,
      row.combat_enabled,
      row.pokemon_id,
      row.pokemon_name_en,
      row.pokemon_name_fr,
      row.spawn_weight,
      row.min_level,
      row.max_level,
      row.methods,
    ].map(csvEscape).join(","));
  }

  fs.writeFileSync(OUTPUT_PATH, `${UTF8_BOM}${lines.join("\n")}\n`, "utf8");
}

function main() {
  const { zoneById, zoneOrder } = loadCatalog();
  const legacyOnlyOneRows = loadLegacyOnlyOneRows();
  const legacyOnlyOneRowsByRouteId = buildRowsByRouteId(legacyOnlyOneRows);
  const routeProfiles = buildRouteProfiles(zoneOrder, zoneById);

  const allSpecies = loadSpecies();
  buildFamilyData(allSpecies);

  const eligibleSpecies = allSpecies.filter((species) => {
    if (species.id <= 0 || species.id > 493) {
      return false;
    }
    if (species.isLegendary || species.isMythical) {
      return false;
    }
    if (LEGENDARY_OR_MYTHICAL_IDS_FROM_WEB.has(species.id)) {
      return false;
    }
    return true;
  });

  const speciesById = new Map(eligibleSpecies.map((species) => [species.id, species]));
  const { routeAssignments, speciesUsage } = assignSpeciesToRoutes(eligibleSpecies, routeProfiles);
  const rows = buildRows(routeProfiles, routeAssignments, speciesById, legacyOnlyOneRowsByRouteId);
  validateOutput(rows, eligibleSpecies, legacyOnlyOneRows);
  writeCsv(rows);

  const startersPlaced = eligibleSpecies.filter((species) => STARTER_IDS.has(species.id) && (speciesUsage.get(species.id) || 0) > 0).length;
  const uniqueSpeciesCount = new Set(rows.map((row) => Number(row.pokemon_id || 0)).filter((id) => id > 0)).size;

  console.log(`[ok] Mapping genere: ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
  console.log(` - Routes: ${routeProfiles.length}`);
  console.log(` - Lignes: ${rows.length}`);
  console.log(` - Especes uniques: ${uniqueSpeciesCount}`);
  console.log(` - Rencontres only-one historiques restaurees: ${legacyOnlyOneRows.length}`);
  console.log(` - Starters Gen1-4 places: ${startersPlaced}/${STARTER_IDS.size}`);
}

main();
