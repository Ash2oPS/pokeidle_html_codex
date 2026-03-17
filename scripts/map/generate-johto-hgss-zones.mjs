import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const mapDataDir = path.join(rootDir, "map_data");

const runtimeSubsetPath = path.join(mapDataDir, "johto_hgss_runtime_subset.json");
const proposalPath = path.join(mapDataDir, "johto_hgss_integration_proposal.json");
const routeMarkerPath = path.join(rootDir, "assets", "maps", "johto_map_markers_placeholder.json");
const backgroundBindingPath = path.join(rootDir, "assets", "backgrounds", "johto_background_bindings_placeholder.csv");

const ROUTE_UNLOCK_DEFEATS = 20;
const ROUTE_UNLOCK_TIMER_MS = 20000;
const JOHTO_MAP_IMAGE_PATH = "assets/maps/johto_map_placeholder.png";

const JOHTO_ZONE_ORDER = Object.freeze([
  "johto_route_29",
  "johto_city_new_bark_town",
  "johto_city_cherrygrove_city",
  "johto_route_30",
  "johto_route_31",
  "johto_city_violet_city",
  "johto_dungeon_sprout_tower",
  "johto_dungeon_ruins_of_alph",
  "johto_route_32",
  "johto_dungeon_union_cave",
  "johto_route_33",
  "johto_city_azalea_town",
  "johto_dungeon_slowpoke_well",
  "johto_dungeon_ilex_forest",
  "johto_route_34",
  "johto_city_goldenrod_city",
  "johto_dungeon_national_park",
  "johto_route_35",
  "johto_route_36",
  "johto_route_37",
  "johto_city_ecruteak_city",
  "johto_dungeon_burned_tower",
  "johto_dungeon_bell_tower",
  "johto_route_38",
  "johto_route_39",
  "johto_city_olivine_city",
  "johto_dungeon_johto_lighthouse",
  "johto_route_40",
  "johto_route_41",
  "johto_dungeon_whirl_islands",
  "johto_city_cianwood_city",
  "johto_route_42",
  "johto_dungeon_mt_mortar",
  "johto_route_43",
  "johto_dungeon_lake_of_rage",
  "johto_city_mahogany_town",
  "johto_dungeon_team_rocket_hq",
  "johto_route_44",
  "johto_dungeon_ice_path",
  "johto_city_blackthorn_city",
  "johto_dungeon_dragons_den",
  "johto_route_45",
  "johto_route_46",
  "johto_dungeon_dark_cave",
  "johto_dungeon_tohjo_falls",
  "johto_route_47",
  "johto_dungeon_cliff_cave",
  "johto_route_48",
  "johto_dungeon_johto_safari_zone",
]);

const MANUAL_MAP_MARKERS_BY_ZONE_ID = Object.freeze({
  johto_city_new_bark_town: { x: 7.92, y: 90.56 },
  johto_city_cherrygrove_city: { x: 13.75, y: 80.56 },
  johto_city_violet_city: { x: 24.58, y: 58.61 },
  johto_dungeon_sprout_tower: { x: 26.25, y: 56.94 },
  johto_dungeon_ruins_of_alph: { x: 33.33, y: 66.39 },
  johto_dungeon_union_cave: { x: 31.67, y: 76.11 },
  johto_city_azalea_town: { x: 36.25, y: 82.22 },
  johto_dungeon_slowpoke_well: { x: 37.5, y: 80.28 },
  johto_dungeon_ilex_forest: { x: 42.08, y: 88.06 },
  johto_city_goldenrod_city: { x: 41.67, y: 74.72 },
  johto_dungeon_national_park: { x: 49.17, y: 72.78 },
  johto_city_ecruteak_city: { x: 58.33, y: 54.72 },
  johto_dungeon_burned_tower: { x: 59.58, y: 52.78 },
  johto_dungeon_bell_tower: { x: 60.83, y: 50.83 },
  johto_city_olivine_city: { x: 67.08, y: 51.39 },
  johto_dungeon_johto_lighthouse: { x: 68.75, y: 49.17 },
  johto_dungeon_whirl_islands: { x: 75.42, y: 72.22 },
  johto_city_cianwood_city: { x: 68.75, y: 78.61 },
  johto_dungeon_mt_mortar: { x: 67.08, y: 44.44 },
  johto_dungeon_lake_of_rage: { x: 72.5, y: 27.22 },
  johto_city_mahogany_town: { x: 71.67, y: 34.72 },
  johto_dungeon_team_rocket_hq: { x: 73.75, y: 36.11 },
  johto_city_blackthorn_city: { x: 87.08, y: 18.33 },
  johto_dungeon_dragons_den: { x: 89.58, y: 16.67 },
  johto_dungeon_ice_path: { x: 82.08, y: 26.11 },
  johto_dungeon_dark_cave: { x: 82.92, y: 20.83 },
  johto_dungeon_tohjo_falls: { x: 92.92, y: 15.56 },
  johto_dungeon_cliff_cave: { x: 86.25, y: 61.39 },
  johto_dungeon_johto_safari_zone: { x: 94.58, y: 71.94 },
});

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function writeJson(jsonPath, payload) {
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseCsvBindings(csvText) {
  const lines = String(csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bindings = new Map();
  for (let index = 1; index < lines.length; index += 1) {
    const [routeIdRaw, backgroundRaw] = lines[index].split(",");
    const routeId = String(routeIdRaw || "").trim();
    const backgroundImage = String(backgroundRaw || "").trim();
    if (!routeId || !backgroundImage) {
      continue;
    }
    bindings.set(routeId, backgroundImage);
  }
  return bindings;
}

function normalizeZoneId(zoneId) {
  const raw = String(zoneId || "").trim();
  if (raw === "johto_sea_route_40") {
    return "johto_route_40";
  }
  if (raw === "johto_sea_route_41") {
    return "johto_route_41";
  }
  return raw;
}

function clampPct(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.min(100, Number(numeric.toFixed(3))));
}

function normalizeMarker(rawMarker) {
  if (!rawMarker || typeof rawMarker !== "object") {
    return null;
  }
  const x = clampPct(rawMarker.x);
  const y = clampPct(rawMarker.y);
  if (x == null || y == null) {
    return null;
  }
  return { x, y };
}

function buildMarkerMap() {
  const routeMarkerPayload = readJson(routeMarkerPath);
  const markers = new Map();
  const sourceMarkers = Array.isArray(routeMarkerPayload?.markers) ? routeMarkerPayload.markers : [];
  for (const marker of sourceMarkers) {
    const zoneId = normalizeZoneId(marker?.route_id);
    const normalized = normalizeMarker(marker);
    if (!zoneId || !normalized) {
      continue;
    }
    markers.set(zoneId, normalized);
  }
  for (const [zoneIdRaw, marker] of Object.entries(MANUAL_MAP_MARKERS_BY_ZONE_ID)) {
    const zoneId = normalizeZoneId(zoneIdRaw);
    const normalized = normalizeMarker(marker);
    if (!zoneId || !normalized) {
      continue;
    }
    markers.set(zoneId, normalized);
  }
  return markers;
}

function relativePathExists(relativePath) {
  const normalized = String(relativePath || "").trim();
  if (!normalized) {
    return false;
  }
  const absolutePath = path.join(rootDir, ...normalized.split("/"));
  return fs.existsSync(absolutePath);
}

function resolveBackgroundImage(zoneId, bindingsByZoneId, fallbackValue = "") {
  const normalizedZoneId = normalizeZoneId(zoneId);
  const directBinding = bindingsByZoneId.get(normalizedZoneId);
  if (directBinding && relativePathExists(directBinding)) {
    return directBinding;
  }
  const conventionPath = `assets/backgrounds/${normalizedZoneId}_hgss.png`;
  if (relativePathExists(conventionPath)) {
    return conventionPath;
  }
  return String(fallbackValue || "").trim();
}

function buildRoutePayload(route, generatedAtUtc, bindingsByZoneId, markersByZoneId) {
  const encounters = Array.isArray(route?.runtime_encounters) ? route.runtime_encounters : [];
  const routeKey = normalizeZoneId(route?.route_key);
  return {
    route_id: routeKey,
    route_name_fr: `${String(route?.route_name_en || `Route ${route?.route_number || ""}`).trim()} (Johto)`,
    zone_type: "route",
    combat_enabled: true,
    unlock_mode: "defeats",
    unlock_defeats_required: ROUTE_UNLOCK_DEFEATS,
    source_games: ["heartgold", "soulsilver"],
    source_location: `johto-route-${route?.route_number || ""}`,
    background_image: resolveBackgroundImage(routeKey, bindingsByZoneId),
    map_marker: markersByZoneId.get(routeKey) || null,
    encounters: encounters.map((encounter) => ({
      id: Number(encounter?.pokemon_id || 0),
      name_en: String(encounter?.pokemon_name_en || "").trim().toLowerCase(),
      name_fr: String(encounter?.pokemon_name_fr || "").trim(),
      methods: [String(encounter?.method || "").trim().toLowerCase()].filter(Boolean),
      spawn_weight: Math.max(1, Number(encounter?.spawn_weight || 1)),
      min_level: Math.max(1, Number(encounter?.min_level || 1)),
      max_level: Math.max(1, Number(encounter?.max_level || encounter?.min_level || 1)),
    })),
    encounter_species_count_source: new Set(encounters.map((encounter) => Number(encounter?.pokemon_id || 0)).filter((id) => id > 0)).size,
    source_url: String(route?.source_url || "").trim(),
    generated_from: "altissimo (HGSS standard union; radio/swarm/static excluded)",
    generated_at_utc: generatedAtUtc,
    unlock_timer_ms: ROUTE_UNLOCK_TIMER_MS,
  };
}

function updateNonRoutePayload(existingPayload, zoneId, bindingsByZoneId, markersByZoneId) {
  const payload = { ...existingPayload };
  payload.background_image = resolveBackgroundImage(zoneId, bindingsByZoneId, payload.background_image);
  const marker = markersByZoneId.get(zoneId);
  if (marker) {
    payload.map_marker = marker;
  }
  const encounters = Array.isArray(payload.encounters) ? payload.encounters : [];
  if (payload.combat_enabled !== false && encounters.length === 0) {
    payload.combat_enabled = false;
    payload.unlock_mode = "visit";
    payload.unlock_defeats_required = 0;
  }
  return payload;
}

function buildZoneCatalog(zoneOrder, generatedAtUtc) {
  const zones = zoneOrder.map((zoneId) => {
    const zonePath = path.join(mapDataDir, `${zoneId}.json`);
    const payload = readJson(zonePath);
    const encounterSpeciesCount = new Set(
      (Array.isArray(payload?.encounters) ? payload.encounters : [])
        .map((encounter) => Number(encounter?.id || 0))
        .filter((id) => id > 0),
    ).size;
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
      encounter_species_count: encounterSpeciesCount,
      map_marker: payload.map_marker || null,
    };
  });

  return {
    source: "altissimo + pokeapi + placeholders",
    games: ["heartgold", "soulsilver"],
    unlock_target_default: ROUTE_UNLOCK_DEFEATS,
    map_image: JOHTO_MAP_IMAGE_PATH,
    generated_at_utc: generatedAtUtc,
    zone_order: zoneOrder,
    zones,
  };
}

function assertRequiredFilesExist(zoneOrder) {
  const missing = zoneOrder.filter((zoneId) => !fs.existsSync(path.join(mapDataDir, `${zoneId}.json`)));
  if (missing.length > 0) {
    throw new Error(`Missing Johto zone JSON files: ${missing.join(", ")}`);
  }
}

function main() {
  const runtimeSubset = readJson(runtimeSubsetPath);
  const proposal = readJson(proposalPath);
  const bindingsByZoneId = parseCsvBindings(fs.readFileSync(backgroundBindingPath, "utf8"));
  const markersByZoneId = buildMarkerMap();
  const generatedAtUtc = new Date().toISOString();
  const routes = Array.isArray(runtimeSubset?.routes) ? runtimeSubset.routes : [];
  const routeKeys = new Set(routes.map((route) => normalizeZoneId(route?.route_key)));

  for (const route of routes) {
    const payload = buildRoutePayload(route, generatedAtUtc, bindingsByZoneId, markersByZoneId);
    writeJson(path.join(mapDataDir, `${payload.route_id}.json`), payload);
  }

  const proposalNonRouteIds = Array.isArray(proposal?.non_route_zone_ids) ? proposal.non_route_zone_ids : [];
  for (const zoneIdRaw of proposalNonRouteIds) {
    const zoneId = normalizeZoneId(zoneIdRaw);
    if (!zoneId || routeKeys.has(zoneId)) {
      continue;
    }
    const zonePath = path.join(mapDataDir, `${zoneId}.json`);
    if (!fs.existsSync(zonePath)) {
      continue;
    }
    const updatedPayload = updateNonRoutePayload(readJson(zonePath), zoneId, bindingsByZoneId, markersByZoneId);
    writeJson(zonePath, updatedPayload);
  }

  assertRequiredFilesExist(JOHTO_ZONE_ORDER);
  const zoneCatalog = buildZoneCatalog(JOHTO_ZONE_ORDER, generatedAtUtc);
  writeJson(path.join(mapDataDir, "johto_hgss_zones.json"), zoneCatalog);

  console.log(`Generated ${routes.length} Johto route JSON files.`);
  console.log(`Generated ${JOHTO_ZONE_ORDER.length} zone catalog entries.`);
  console.log(`Output: ${path.relative(rootDir, path.join(mapDataDir, "johto_hgss_zones.json"))}`);
}

main();
