import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const MAP_DATA_DIR = path.join(ROOT_DIR, "map_data");

const RUNTIME_SUBSET_PATH = path.join(MAP_DATA_DIR, "hoenn_emerald_runtime_subset.json");
const PROPOSAL_PATH = path.join(MAP_DATA_DIR, "hoenn_emerald_integration_proposal.json");
const HOENN_MAP_IMAGE_PATH = "assets/maps/hoenn_map_emerald.png";

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function writeJson(jsonPath, payload) {
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildZonePayload(zone, generatedAtUtc) {
  const combatEnabled = zone?.combat_enabled !== false;
  const encounters = Array.isArray(zone?.runtime_encounters) ? zone.runtime_encounters : [];
  return {
    route_id: String(zone?.route_id || "").trim(),
    route_name_fr: String(zone?.route_name_fr || "").trim(),
    zone_type: String(zone?.zone_type || "route").trim(),
    combat_enabled: combatEnabled,
    unlock_mode: String(zone?.unlock_mode || (combatEnabled ? "defeats" : "visit")).trim().toLowerCase(),
    unlock_defeats_required: Math.max(0, Number(zone?.unlock_defeats_required || 0)),
    unlock_timer_ms: Math.max(1000, Number(zone?.unlock_timer_ms || 20000)),
    source_games: Array.isArray(zone?.source_games) ? zone.source_games : ["emerald"],
    source_location: String(zone?.source_location || "").trim(),
    source_location_areas: Array.isArray(zone?.source_location_areas) ? zone.source_location_areas : [],
    background_image: String(zone?.background_image || "").trim(),
    map_marker: zone?.map_marker && typeof zone.map_marker === "object" ? zone.map_marker : null,
    encounters: encounters.map((encounter) => ({
      id: Number(encounter?.pokemon_id || 0),
      name_en: String(encounter?.pokemon_name_en || "").trim().toLowerCase(),
      name_fr: String(encounter?.pokemon_name_fr || "").trim(),
      methods: Array.isArray(encounter?.methods)
        ? encounter.methods.map((method) => String(method || "").trim().toLowerCase()).filter(Boolean)
        : [],
      spawn_weight: Math.max(1, Number(encounter?.spawn_weight || 1)),
      min_level: Math.max(1, Number(encounter?.min_level || 1)),
      max_level: Math.max(1, Number(encounter?.max_level || encounter?.min_level || 1)),
    })),
    encounter_species_count_source: new Set(
      encounters.map((encounter) => Number(encounter?.pokemon_id || 0)).filter((pokemonId) => pokemonId > 0),
    ).size,
    source_url: String(zone?.source_url || "").trim(),
    source_urls: Array.isArray(zone?.source_urls) ? zone.source_urls : [],
    generated_from: String(zone?.generated_from || "pret/pokeemerald Emerald source data").trim(),
    generated_at_utc: generatedAtUtc,
  };
}

function assertRequiredFilesExist(zoneOrder) {
  const missing = zoneOrder.filter((zoneId) => !fs.existsSync(path.join(MAP_DATA_DIR, `${zoneId}.json`)));
  if (missing.length > 0) {
    throw new Error(`Missing Hoenn zone JSON files: ${missing.join(", ")}`);
  }
}

function buildCatalog(zoneOrder, generatedAtUtc) {
  const zones = zoneOrder.map((zoneId) => {
    const payload = readJson(path.join(MAP_DATA_DIR, `${zoneId}.json`));
    return {
      route_id: payload.route_id,
      route_name_fr: payload.route_name_fr,
      zone_type: payload.zone_type,
      combat_enabled: payload.combat_enabled !== false,
      unlock_mode: payload.unlock_mode,
      unlock_defeats_required: Number(payload.unlock_defeats_required || 0),
      source_location: payload.source_location || "",
      source_location_areas: Array.isArray(payload.source_location_areas) ? payload.source_location_areas : [],
      background_image: payload.background_image || "",
      encounter_species_count: new Set(
        (Array.isArray(payload.encounters) ? payload.encounters : [])
          .map((encounter) => Number(encounter?.id || 0))
          .filter((id) => id > 0),
      ).size,
      map_marker: payload.map_marker || null,
    };
  });

  return {
    source: "pret/pokeemerald Emerald data + Bulbagarden Archives backgrounds",
    games: ["emerald"],
    unlock_target_default: 20,
    map_image: HOENN_MAP_IMAGE_PATH,
    generated_at_utc: generatedAtUtc,
    zone_order: zoneOrder,
    zones,
  };
}

function main() {
  const runtimeSubset = readJson(RUNTIME_SUBSET_PATH);
  const proposal = readJson(PROPOSAL_PATH);
  const zones = Array.isArray(runtimeSubset?.zones) ? runtimeSubset.zones : [];
  const generatedAtUtc = new Date().toISOString();

  for (const zone of zones) {
    const payload = buildZonePayload(zone, generatedAtUtc);
    writeJson(path.join(MAP_DATA_DIR, `${payload.route_id}.json`), payload);
  }

  const zoneOrder = Array.isArray(proposal?.canonical_zone_order) ? proposal.canonical_zone_order : [];
  assertRequiredFilesExist(zoneOrder);
  writeJson(path.join(MAP_DATA_DIR, "hoenn_emerald_zones.json"), buildCatalog(zoneOrder, generatedAtUtc));

  console.log(`Generated ${zones.length} Hoenn zone JSON files.`);
  console.log(`Output: ${path.relative(ROOT_DIR, path.join(MAP_DATA_DIR, "hoenn_emerald_zones.json"))}`);
}

main();
