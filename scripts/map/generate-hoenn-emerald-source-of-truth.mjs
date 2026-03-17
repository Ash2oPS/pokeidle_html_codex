import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { HOENN_ZONE_SPECS } from "./hoenn-emerald-zone-definitions.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const MAP_DATA_DIR = path.join(ROOT_DIR, "map_data");
const ASSETS_MAPS_DIR = path.join(ROOT_DIR, "assets", "maps");
const ASSETS_BACKGROUNDS_DIR = path.join(ROOT_DIR, "assets", "backgrounds");
const POKEMON_DATA_DIR = path.join(ROOT_DIR, "pokemon_data");

const SOURCE_REFERENCE = Object.freeze({
  repo: "https://github.com/pret/pokeemerald",
  wildEncountersUrl: "https://raw.githubusercontent.com/pret/pokeemerald/master/src/data/wild_encounters.json",
  mapGroupsUrl: "https://raw.githubusercontent.com/pret/pokeemerald/master/data/maps/map_groups.json",
  regionMapSectionsUrl:
    "https://raw.githubusercontent.com/pret/pokeemerald/master/src/data/region_map/region_map_sections.json",
  mapJsonBaseUrl: "https://raw.githubusercontent.com/pret/pokeemerald/master/data/maps",
});

const SECTION_GRID_WIDTH = 28;
const SECTION_GRID_HEIGHT = 15;
const DEFAULT_UNLOCK_DEFEATS = 20;
const DEFAULT_UNLOCK_TIMER_MS = 20000;
const HOENN_MAP_IMAGE_PATH = "assets/maps/hoenn_map_emerald.png";
const HOENN_MARKERS_OUTPUT_PATH = path.join(ASSETS_MAPS_DIR, "hoenn_map_markers_emerald.json");
const HOENN_BACKGROUND_BINDINGS_OUTPUT_PATH = path.join(ASSETS_BACKGROUNDS_DIR, "hoenn_background_bindings_emerald.csv");
const EXCLUDED_ZONE_HINTS = Object.freeze([
  "battle_frontier",
  "trainer_hill",
  "southern_island",
  "faraway_island",
  "birth_island",
  "navel_rock",
  "mirage_tower",
  "desert_underpass",
  "artisan_cave",
  "marine_cave",
  "terra_cave",
  "sealed_chamber",
  "desert_ruins",
  "island_cave",
  "ancient_tomb",
]);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function writeJson(jsonPath, payload) {
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, `${String(content || "").replace(/\r\n?/g, "\n").trimEnd()}\n`, "utf8");
}

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundPct(value) {
  return Number(Number(value).toFixed(3));
}

function normalizeTextKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePokemonNameKey(value) {
  return normalizeTextKey(value)
    .replace(/\bfemale\b/g, "f")
    .replace(/\bmale\b/g, "m")
    .replace(/\s/g, "");
}

function mapIdToSlug(mapId) {
  return String(mapId || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .replace(/(\d)([a-zA-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function normalizeMapIdKey(mapId) {
  return String(mapId || "")
    .replace(/^MAP_/, "")
    .replace(/[^a-z0-9]+/gi, "")
    .toUpperCase()
    .trim();
}

function routeIdToLocationSlug(routeId) {
  const value = String(routeId || "").trim().toLowerCase();
  if (value.startsWith("hoenn_route_")) {
    return `route-${value.replace(/^hoenn_route_/, "")}`;
  }
  return value.replace(/^hoenn_(city|route|dungeon)_/, "").replace(/_/g, "-");
}

function buildBackgroundFilePath(routeId) {
  return `assets/backgrounds/${routeId}_emerald.png`;
}

function buildPokemonLocalizationMap() {
  const map = new Map();
  const aliases = new Map([
    ["mrmime", "mr mime"],
    ["farfetchd", "farfetchd"],
    ["nidoranf", "nidoran female"],
    ["nidoranm", "nidoran male"],
    ["hooh", "ho oh"],
  ]);

  const entries = fs
    .readdirSync(POKEMON_DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const entry of entries) {
    const dataFilePath = path.join(POKEMON_DATA_DIR, entry.name, `${entry.name}_data.json`);
    if (!fs.existsSync(dataFilePath)) {
      continue;
    }
    try {
      const payload = readJson(dataFilePath);
      const pokemonId = Number(payload?.pokedex_number || 0);
      const nameEn = String(payload?.name_en || "").trim();
      const nameFr = String(payload?.name_fr || nameEn || "").trim();
      if (!nameEn || pokemonId <= 0) {
        continue;
      }
      map.set(normalizePokemonNameKey(nameEn), {
        pokemon_id: pokemonId,
        pokemon_name_en: nameEn.toLowerCase(),
        pokemon_name_fr: nameFr || nameEn,
      });
    } catch {
      // Ignore malformed local files.
    }
  }

  for (const [aliasKey, targetName] of aliases.entries()) {
    const target = map.get(normalizePokemonNameKey(targetName));
    if (target) {
      map.set(aliasKey, target);
    }
  }

  return map;
}

async function fetchJson(url, retries = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "pokeidle-hoenn-generator/1.0" } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

function speciesConstantToKey(speciesConstant) {
  return normalizePokemonNameKey(
    String(speciesConstant || "")
      .replace(/^SPECIES_/, "")
      .replace(/_/g, " "),
  );
}

function resolvePokemonIdentity(speciesConstant, localizationMap) {
  const primary = localizationMap.get(speciesConstantToKey(speciesConstant));
  if (primary) {
    return primary;
  }
  return {
    pokemon_id: null,
    pokemon_name_en: normalizeTextKey(String(speciesConstant || "").replace(/^SPECIES_/, "")).replace(/\s+/g, "-"),
    pokemon_name_fr: String(speciesConstant || "").replace(/^SPECIES_/, "").replace(/_/g, " "),
  };
}

function buildEncounterRateConfig(wildPayload) {
  const group = Array.isArray(wildPayload?.wild_encounter_groups) ? wildPayload.wild_encounter_groups[0] : null;
  const fields = Array.isArray(group?.fields) ? group.fields : [];
  const byType = new Map(fields.map((field) => [String(field?.type || ""), field]));
  return {
    walk: Array.isArray(byType.get("land_mons")?.encounter_rates) ? byType.get("land_mons").encounter_rates : [],
    surf: Array.isArray(byType.get("water_mons")?.encounter_rates) ? byType.get("water_mons").encounter_rates : [],
    rockSmash: Array.isArray(byType.get("rock_smash_mons")?.encounter_rates)
      ? byType.get("rock_smash_mons").encounter_rates
      : [],
    fishingRates: Array.isArray(byType.get("fishing_mons")?.encounter_rates)
      ? byType.get("fishing_mons").encounter_rates
      : [],
    fishingGroups:
      byType.get("fishing_mons")?.groups && typeof byType.get("fishing_mons").groups === "object"
        ? byType.get("fishing_mons").groups
        : {},
  };
}

function normalizeMethodSet(list) {
  return new Set((Array.isArray(list) ? list : []).map((item) => String(item || "").toLowerCase().trim()).filter(Boolean));
}

function buildMapLookup(mapGroupsPayload) {
  const lookup = new Set();
  for (const [groupName, entries] of Object.entries(mapGroupsPayload || {})) {
    if (groupName === "group_order" || !Array.isArray(entries)) {
      continue;
    }
    for (const mapId of entries) {
      lookup.add(String(mapId || "").trim());
    }
  }
  return lookup;
}

function buildSectionLookup(regionMapPayload) {
  const lookup = new Map();
  const sections = Array.isArray(regionMapPayload?.map_sections) ? regionMapPayload.map_sections : [];
  for (const section of sections) {
    const sectionId = String(section?.id || "").trim();
    if (sectionId) {
      lookup.set(sectionId, section);
    }
  }
  return lookup;
}

function buildEncounterLookup(wildPayload) {
  const lookup = new Map();
  const group = Array.isArray(wildPayload?.wild_encounter_groups) ? wildPayload.wild_encounter_groups[0] : null;
  const encounters = Array.isArray(group?.encounters) ? group.encounters : [];
  for (const entry of encounters) {
    const mapKey = normalizeMapIdKey(entry?.map || "");
    if (mapKey) {
      lookup.set(mapKey, entry);
    }
  }
  return lookup;
}

function fishingMethodNamesForIndex(index, fishingGroups) {
  const methods = [];
  for (const [groupKey, slotIndexes] of Object.entries(fishingGroups || {})) {
    if (!Array.isArray(slotIndexes) || !slotIndexes.includes(index)) {
      continue;
    }
    if (groupKey === "old_rod") {
      methods.push("old-rod");
    } else if (groupKey === "good_rod") {
      methods.push("good-rod");
    } else if (groupKey === "super_rod") {
      methods.push("super-rod");
    }
  }
  return methods;
}

function extractEncounterRows(mapId, encounterHeader, encounterRateConfig, localizationMap) {
  const rows = [];

  const pushRows = (method, rates, mons) => {
    const sourceMons = Array.isArray(mons) ? mons : [];
    for (let index = 0; index < sourceMons.length; index += 1) {
      const slot = sourceMons[index];
      const pokemon = resolvePokemonIdentity(slot?.species, localizationMap);
      if (!pokemon?.pokemon_id) {
        continue;
      }
      rows.push({
        source_map_id: mapId,
        method,
        spawn_weight: Math.max(1, toSafeInt(rates[index], 1)),
        min_level: Math.max(1, toSafeInt(slot?.min_level, 1)),
        max_level: Math.max(1, toSafeInt(slot?.max_level, slot?.min_level ?? 1)),
        pokemon_id: pokemon.pokemon_id,
        pokemon_name_en: pokemon.pokemon_name_en,
        pokemon_name_fr: pokemon.pokemon_name_fr,
      });
    }
  };

  if (Array.isArray(encounterHeader?.land_mons?.mons)) {
    pushRows("walk", encounterRateConfig.walk, encounterHeader.land_mons.mons);
  }
  if (Array.isArray(encounterHeader?.water_mons?.mons)) {
    pushRows("surf", encounterRateConfig.surf, encounterHeader.water_mons.mons);
  }
  if (Array.isArray(encounterHeader?.rock_smash_mons?.mons)) {
    pushRows("rock-smash", encounterRateConfig.rockSmash, encounterHeader.rock_smash_mons.mons);
  }

  const fishingMons = Array.isArray(encounterHeader?.fishing_mons?.mons) ? encounterHeader.fishing_mons.mons : [];
  for (let index = 0; index < fishingMons.length; index += 1) {
    const slot = fishingMons[index];
    const methods = fishingMethodNamesForIndex(index, encounterRateConfig.fishingGroups);
    const pokemon = resolvePokemonIdentity(slot?.species, localizationMap);
    if (!pokemon?.pokemon_id || methods.length <= 0) {
      continue;
    }
    for (const method of methods) {
      rows.push({
        source_map_id: mapId,
        method,
        spawn_weight: Math.max(1, toSafeInt(encounterRateConfig.fishingRates[index], 1)),
        min_level: Math.max(1, toSafeInt(slot?.min_level, 1)),
        max_level: Math.max(1, toSafeInt(slot?.max_level, slot?.min_level ?? 1)),
        pokemon_id: pokemon.pokemon_id,
        pokemon_name_en: pokemon.pokemon_name_en,
        pokemon_name_fr: pokemon.pokemon_name_fr,
      });
    }
  }

  return rows;
}

async function fetchMapPayload(mapId) {
  const url = `${SOURCE_REFERENCE.mapJsonBaseUrl}/${mapId}/map.json`;
  return {
    url,
    payload: await fetchJson(url),
  };
}

function computeMarker(markerSectionId, sectionLookup, nudgeCells = null) {
  const section = sectionLookup.get(String(markerSectionId || "").trim()) || null;
  if (!section) {
    return null;
  }
  const nudge = nudgeCells && typeof nudgeCells === "object" ? nudgeCells : {};
  const centerX = Number(section.x || 0) + Number(section.width || 1) / 2 + Number(nudge.x || 0);
  const centerY = Number(section.y || 0) + Number(section.height || 1) / 2 + Number(nudge.y || 0);
  return {
    x: roundPct(clamp((centerX / SECTION_GRID_WIDTH) * 100, 0, 100)),
    y: roundPct(clamp((centerY / SECTION_GRID_HEIGHT) * 100, 0, 100)),
  };
}

function mergeZoneEncounters(zoneSpec, mapContextById) {
  const includeMethods = normalizeMethodSet(zoneSpec.include_methods);
  const excludeMethods = normalizeMethodSet(zoneSpec.exclude_methods);
  const merged = new Map();

  for (const mapId of zoneSpec.source_maps) {
    const mapContext = mapContextById.get(mapId);
    if (!mapContext) {
      continue;
    }
    for (const row of mapContext.encounter_rows) {
      const method = String(row?.method || "").toLowerCase().trim();
      if (includeMethods.size > 0 && !includeMethods.has(method)) {
        continue;
      }
      if (excludeMethods.size > 0 && excludeMethods.has(method)) {
        continue;
      }
      const pokemonId = Number(row?.pokemon_id || 0);
      if (pokemonId <= 0) {
        continue;
      }
      const existing = merged.get(pokemonId) || {
        pokemon_id: pokemonId,
        pokemon_name_en: row.pokemon_name_en,
        pokemon_name_fr: row.pokemon_name_fr,
        methods: new Set(),
        source_maps: new Set(),
        spawn_weight: 0,
        min_level: Number.POSITIVE_INFINITY,
        max_level: 1,
      };
      existing.methods.add(method);
      existing.source_maps.add(mapId);
      existing.spawn_weight += Math.max(1, toSafeInt(row.spawn_weight, 1));
      existing.min_level = Math.min(existing.min_level, Math.max(1, toSafeInt(row.min_level, 1)));
      existing.max_level = Math.max(existing.max_level, Math.max(1, toSafeInt(row.max_level, row.min_level ?? 1)));
      merged.set(pokemonId, existing);
    }
  }

  return Array.from(merged.values())
    .map((entry) => ({
      pokemon_id: entry.pokemon_id,
      pokemon_name_en: String(entry.pokemon_name_en || "").trim().toLowerCase(),
      pokemon_name_fr: String(entry.pokemon_name_fr || "").trim(),
      methods: Array.from(entry.methods).sort(),
      source_maps: Array.from(entry.source_maps).sort(),
      spawn_weight: Math.max(1, toSafeInt(entry.spawn_weight, 1)),
      min_level: Math.max(1, Number.isFinite(entry.min_level) ? entry.min_level : 1),
      max_level: Math.max(1, toSafeInt(entry.max_level, entry.min_level)),
    }))
    .sort((a, b) => b.spawn_weight - a.spawn_weight || a.pokemon_id - b.pokemon_id);
}

function assertUniqueZoneIds(zoneSpecs) {
  const seen = new Set();
  const duplicates = [];
  for (const zoneSpec of zoneSpecs) {
    const routeId = String(zoneSpec?.route_id || "").trim();
    if (!routeId) {
      duplicates.push("<empty>");
      continue;
    }
    if (seen.has(routeId)) {
      duplicates.push(routeId);
      continue;
    }
    seen.add(routeId);
  }
  if (duplicates.length > 0) {
    throw new Error(`Duplicate Hoenn zone ids: ${duplicates.join(", ")}`);
  }
}

function buildProposal(zoneRecords, generatedAtUtc) {
  return {
    generated_at_utc: generatedAtUtc,
    integration_target: "append_after_johto",
    canonical_region: "hoenn_emerald",
    first_unlock_after_johto: zoneRecords[0]?.route_id || "",
    canonical_zone_order: zoneRecords.map((zone) => zone.route_id),
    non_route_zone_ids: zoneRecords.filter((zone) => zone.zone_type !== "route").map((zone) => zone.route_id),
    notes: [
      "Generated from pret/pokeemerald Emerald source data.",
      "Towns remain combat_enabled=false to match current runtime behavior.",
      "Story interiors without wild data stay visit-only and do not invent encounters.",
      "Markers for underwater and shared-section zones are nudged to avoid overlap on the map.",
    ],
    zones: zoneRecords.map((zone) => ({
      route_id: zone.route_id,
      route_name_fr: zone.route_name_fr,
      zone_type: zone.zone_type,
      source_maps: zone.source_maps,
      representative_map_id: zone.representative_map_id,
      source_location: zone.source_location,
      source_location_areas: zone.source_location_areas,
      marker_section_id: zone.marker_section_id || "",
      map_marker: zone.map_marker || null,
      background_image: zone.background_image,
      background_title_candidates: zone.background_title_candidates,
      include_methods: Array.isArray(zone.include_methods) ? zone.include_methods : [],
      exclude_methods: Array.isArray(zone.exclude_methods) ? zone.exclude_methods : [],
    })),
  };
}

function buildMarkersPayload(zoneRecords) {
  return {
    map_image: HOENN_MAP_IMAGE_PATH,
    markers: zoneRecords
      .filter((zone) => zone.map_marker && zone.zone_type === "route")
      .map((zone) => ({
        route_id: zone.route_id,
        x: zone.map_marker.x,
        y: zone.map_marker.y,
      })),
  };
}

function buildBindingsCsv(zoneRecords) {
  return [
    "route_id,background_image",
    ...zoneRecords.map((zone) => `${zone.route_id},${zone.background_image}`),
  ].join("\n");
}

function buildSourceMarkdown(sourcePayload) {
  const lines = [
    "# Hoenn Emerald Source Of Truth",
    "",
    `Generated at: ${sourcePayload.generated_at_utc}`,
    "",
    "## Sources",
    "",
    `- Repo: ${sourcePayload.source_reference.repo}`,
    `- Wild encounters: ${sourcePayload.source_reference.wildEncountersUrl}`,
    `- Map groups: ${sourcePayload.source_reference.mapGroupsUrl}`,
    `- Region map sections: ${sourcePayload.source_reference.regionMapSectionsUrl}`,
    "",
    "## Zone Summary",
    "",
  ];

  for (const zone of sourcePayload.zones) {
    lines.push(`- ${zone.route_id}: ${zone.zone_type}, combat=${zone.combat_enabled}, encounters=${zone.runtime_encounters.length}`);
  }

  return lines.join("\n");
}

function buildRuntimeSubsetMarkdown(runtimeSubset) {
  const lines = [
    "# Hoenn Emerald Runtime Subset",
    "",
    `Generated at: ${runtimeSubset.generated_at_utc}`,
    "",
    "| route_id | zone_type | combat_enabled | encounter_species | methods |",
    "| --- | --- | --- | ---: | --- |",
  ];

  for (const zone of runtimeSubset.zones) {
    lines.push(
      `| ${zone.route_id} | ${zone.zone_type} | ${zone.combat_enabled ? "yes" : "no"} | ${zone.runtime_encounters.length} | ${zone.runtime_methods_present.join(", ")} |`,
    );
  }

  return lines.join("\n");
}

function buildRuntimeSubsetCsv(runtimeSubset) {
  const rows = [
    "route_id,route_name_fr,zone_type,combat_enabled,encounter_species_count,methods,background_image,source_location",
  ];
  for (const zone of runtimeSubset.zones) {
    const values = [
      zone.route_id,
      zone.route_name_fr,
      zone.zone_type,
      zone.combat_enabled ? "true" : "false",
      String(zone.runtime_encounters.length),
      zone.runtime_methods_present.join("|"),
      zone.background_image,
      zone.source_location,
    ].map((value) => `"${String(value || "").replace(/"/g, '""')}"`);
    rows.push(values.join(","));
  }
  return rows.join("\n");
}

async function main() {
  ensureDir(MAP_DATA_DIR);
  ensureDir(ASSETS_MAPS_DIR);
  ensureDir(ASSETS_BACKGROUNDS_DIR);
  assertUniqueZoneIds(HOENN_ZONE_SPECS);

  const [wildPayload, mapGroupsPayload, regionMapPayload] = await Promise.all([
    fetchJson(SOURCE_REFERENCE.wildEncountersUrl),
    fetchJson(SOURCE_REFERENCE.mapGroupsUrl),
    fetchJson(SOURCE_REFERENCE.regionMapSectionsUrl),
  ]);
  const localizationMap = buildPokemonLocalizationMap();
  const mapLookup = buildMapLookup(mapGroupsPayload);
  const sectionLookup = buildSectionLookup(regionMapPayload);
  const encounterLookup = buildEncounterLookup(wildPayload);
  const encounterRateConfig = buildEncounterRateConfig(wildPayload);

  const uniqueMapIds = Array.from(new Set(HOENN_ZONE_SPECS.flatMap((zone) => zone.source_maps || []))).sort();
  const mapContextById = new Map();
  const mapPayloads = await Promise.all(uniqueMapIds.map((mapId) => fetchMapPayload(mapId).then((entry) => [mapId, entry])));

  for (const [mapId, { url, payload }] of mapPayloads) {
    if (!mapLookup.has(mapId)) {
      throw new Error(`Missing map in pokeemerald map_groups.json: ${mapId}`);
    }
    const encounterHeader = encounterLookup.get(normalizeMapIdKey(mapId)) || null;
    mapContextById.set(mapId, {
      map_id: mapId,
      source_url: url,
      region_map_section: String(payload?.region_map_section || "").trim(),
      encounter_rows: encounterHeader
        ? extractEncounterRows(mapId, encounterHeader, encounterRateConfig, localizationMap)
        : [],
    });
  }

  const generatedAtUtc = new Date().toISOString();
  const zoneRecords = [];

  for (const zoneSpec of HOENN_ZONE_SPECS) {
    const representativeMapId = String(zoneSpec.representative_map_id || zoneSpec.source_maps?.[0] || "").trim();
    const representativeMapContext = mapContextById.get(representativeMapId);
    if (!representativeMapContext) {
      throw new Error(`Missing representative map payload for ${zoneSpec.route_id}: ${representativeMapId}`);
    }

    const markerSectionId =
      String(zoneSpec.marker_section_id || representativeMapContext.region_map_section || "").trim() || null;
    const mergedEncounters = mergeZoneEncounters(zoneSpec, mapContextById);
    const runtimeMethodsPresent = Array.from(
      new Set(mergedEncounters.flatMap((entry) => (Array.isArray(entry.methods) ? entry.methods : []))),
    ).sort();
    const combatEnabled =
      zoneSpec.zone_type === "town"
        ? false
        : typeof zoneSpec.combat_enabled === "boolean"
          ? zoneSpec.combat_enabled
          : mergedEncounters.length > 0;
    const sourceLocation = String(zoneSpec.source_location || routeIdToLocationSlug(zoneSpec.route_id)).trim();
    const sourceLocationAreas = Array.isArray(zoneSpec.source_location_areas)
      ? zoneSpec.source_location_areas.slice()
      : zoneSpec.source_maps.map((mapId) => mapIdToSlug(mapId));

    const sourceUrls = zoneSpec.source_maps
      .map((mapId) => mapContextById.get(mapId)?.source_url || null)
      .filter(Boolean);

    zoneRecords.push({
      route_id: zoneSpec.route_id,
      route_name_fr: zoneSpec.route_name_fr,
      zone_type: zoneSpec.zone_type,
      combat_enabled: combatEnabled,
      unlock_mode: combatEnabled ? "defeats" : "visit",
      unlock_defeats_required: combatEnabled ? DEFAULT_UNLOCK_DEFEATS : 0,
      unlock_timer_ms: DEFAULT_UNLOCK_TIMER_MS,
      source_games: ["emerald"],
      source_location: sourceLocation,
      source_location_areas: sourceLocationAreas,
      source_maps: zoneSpec.source_maps.slice(),
      representative_map_id: representativeMapId,
      marker_section_id: markerSectionId || "",
      map_marker: computeMarker(markerSectionId, sectionLookup, zoneSpec.marker_nudge_cells),
      background_image: buildBackgroundFilePath(zoneSpec.route_id),
      background_title_candidates: Array.isArray(zoneSpec.background_title_candidates)
        ? zoneSpec.background_title_candidates.filter((entry) => String(entry || "").trim().length > 0)
        : [],
      include_methods: Array.isArray(zoneSpec.include_methods) ? zoneSpec.include_methods.slice() : [],
      exclude_methods: Array.isArray(zoneSpec.exclude_methods) ? zoneSpec.exclude_methods.slice() : [],
      source_url: sourceUrls[0] || representativeMapContext.source_url,
      source_urls: sourceUrls,
      runtime_methods_present: runtimeMethodsPresent,
      runtime_encounters: mergedEncounters,
      generated_from: "pret/pokeemerald Emerald wild encounters + region map sections",
      generated_at_utc: generatedAtUtc,
    });
  }

  const sourcePayload = {
    schema_version: 1,
    generated_at_utc: generatedAtUtc,
    source_reference: SOURCE_REFERENCE,
    exclusions: EXCLUDED_ZONE_HINTS,
    zones: zoneRecords,
  };

  const runtimeSubset = {
    schema_version: 1,
    generated_at_utc: generatedAtUtc,
    source_reference: "map_data/hoenn_emerald_source_of_truth.json",
    games_union: ["emerald"],
    zones: zoneRecords.map((zone) => ({
      route_id: zone.route_id,
      route_name_fr: zone.route_name_fr,
      zone_type: zone.zone_type,
      combat_enabled: zone.combat_enabled,
      unlock_mode: zone.unlock_mode,
      unlock_defeats_required: zone.unlock_defeats_required,
      unlock_timer_ms: zone.unlock_timer_ms,
      source_games: zone.source_games,
      source_location: zone.source_location,
      source_location_areas: zone.source_location_areas,
      source_maps: zone.source_maps,
      representative_map_id: zone.representative_map_id,
      source_url: zone.source_url,
      source_urls: zone.source_urls,
      background_image: zone.background_image,
      background_title_candidates: zone.background_title_candidates,
      map_marker: zone.map_marker,
      runtime_methods_present: zone.runtime_methods_present,
      runtime_encounters: zone.runtime_encounters,
      generated_from: zone.generated_from,
      generated_at_utc: zone.generated_at_utc,
    })),
  };

  writeJson(path.join(MAP_DATA_DIR, "hoenn_emerald_source_of_truth.json"), sourcePayload);
  writeText(path.join(MAP_DATA_DIR, "hoenn_emerald_source_of_truth.md"), buildSourceMarkdown(sourcePayload));
  writeJson(path.join(MAP_DATA_DIR, "hoenn_emerald_runtime_subset.json"), runtimeSubset);
  writeText(path.join(MAP_DATA_DIR, "hoenn_emerald_runtime_subset.md"), buildRuntimeSubsetMarkdown(runtimeSubset));
  writeText(path.join(MAP_DATA_DIR, "hoenn_emerald_runtime_subset.csv"), buildRuntimeSubsetCsv(runtimeSubset));
  writeJson(path.join(MAP_DATA_DIR, "hoenn_emerald_integration_proposal.json"), buildProposal(zoneRecords, generatedAtUtc));
  writeJson(HOENN_MARKERS_OUTPUT_PATH, buildMarkersPayload(zoneRecords));
  writeText(HOENN_BACKGROUND_BINDINGS_OUTPUT_PATH, buildBindingsCsv(zoneRecords));

  console.log(`Generated Hoenn Emerald source payload for ${zoneRecords.length} zones.`);
  console.log(`Output: ${path.relative(ROOT_DIR, path.join(MAP_DATA_DIR, "hoenn_emerald_source_of_truth.json"))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
