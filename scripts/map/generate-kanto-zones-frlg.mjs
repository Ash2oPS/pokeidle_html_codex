import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MAP_DIR = path.join(ROOT, "map_data");
const BG_DIR = path.join(ROOT, "assets", "backgrounds");
const MAP_ASSET_DIR = path.join(ROOT, "assets", "maps");
const POKEMON_DIR = path.join(ROOT, "pokemon_data");
const FRLG = new Set(["firered", "leafgreen"]);
const DEFAULT_UNLOCK_DEFEATS = 20;
const NOW_ISO = new Date().toISOString();

const MAP_IMAGE = {
  title: null,
  outPath: "assets/maps/kanto_map_reference_user.png",
};

function routeLocationSlug(routeNumber) {
  if (routeNumber >= 19 && routeNumber <= 21) {
    return `kanto-sea-route-${routeNumber}`;
  }
  return `kanto-route-${routeNumber}`;
}

function routeZone(routeNumber, marker) {
  return {
    id: `kanto_route_${routeNumber}`,
    nameFr: `Route ${routeNumber} (Kanto)`,
    zoneType: "route",
    locationSlug: routeLocationSlug(routeNumber),
    backgroundTitle: `Kanto_Route_${routeNumber}_FRLG.png`,
    backgroundFile: `kanto_route_${routeNumber}_frlg.png`,
    marker,
  };
}

function cityZone(idToken, nameFr, locationSlug, backgroundTitle, marker) {
  return {
    id: `kanto_city_${idToken}`,
    nameFr,
    zoneType: "town",
    locationSlug,
    backgroundTitle,
    backgroundFile: `kanto_city_${idToken}_frlg.png`,
    marker,
  };
}

function dungeonZone(idToken, nameFr, locationSlug, backgroundTitle, marker) {
  return {
    id: `kanto_dungeon_${idToken}`,
    nameFr,
    zoneType: "dungeon",
    locationSlug,
    backgroundTitle,
    backgroundFile: `kanto_dungeon_${idToken}_frlg.png`,
    marker,
  };
}

const STORY_ZONES = [
  cityZone("pallet_town", "Bourg Palette (Kanto)", "pallet-town", "Pallet_Town_FRLG.png", { x: 35, y: 89 }),
  routeZone(1, { x: 35, y: 82 }),
  cityZone("viridian_city", "Jadielle (Kanto)", "viridian-city", "Viridian_City_FRLG.png", { x: 35, y: 74 }),
  routeZone(2, { x: 35, y: 66 }),
  dungeonZone("viridian_forest", "Foret de Jade (Kanto)", "viridian-forest", "Viridian_Forest_FRLG.png", { x: 35, y: 61 }),
  cityZone("pewter_city", "Argenta (Kanto)", "pewter-city", "Pewter_City_FRLG.png", { x: 30, y: 53 }),
  routeZone(3, { x: 38, y: 52 }),
  dungeonZone("mt_moon", "Mont Selenite (Kanto)", "mt-moon", "Mt_Moon_1F_FRLG.png", { x: 46, y: 51 }),
  routeZone(4, { x: 53, y: 51 }),
  cityZone("cerulean_city", "Azuria (Kanto)", "cerulean-city", "Cerulean_City_FRLG.png", { x: 61, y: 48 }),
  routeZone(24, { x: 62, y: 40 }),
  routeZone(25, { x: 70, y: 39 }),
  routeZone(5, { x: 58, y: 57 }),
  routeZone(6, { x: 58, y: 66 }),
  cityZone("vermilion_city", "Carmin-sur-Mer (Kanto)", "vermilion-city", "Vermilion_City_FRLG.png", { x: 61, y: 73 }),
  routeZone(11, { x: 69, y: 73 }),
  dungeonZone("digletts_cave", "Cave Taupiqueur (Kanto)", "digletts-cave", "Diglett_Cave_FRLG.png", { x: 44, y: 72 }),
  routeZone(9, { x: 67, y: 50 }),
  routeZone(10, { x: 73, y: 56 }),
  dungeonZone("power_plant", "Centrale (Kanto)", "power-plant", "Power_Plant_interior_FRLG.png", { x: 81, y: 49 }),
  dungeonZone("rock_tunnel", "Tunnel Roche (Kanto)", "rock-tunnel", "Rock_Tunnel_1F_FRLG.png", { x: 75, y: 58 }),
  cityZone("lavender_town", "Lavanville (Kanto)", "lavender-town", "Lavender_Town_FRLG.png", { x: 74, y: 63 }),
  dungeonZone(
    "pokemon_tower",
    "Tour Pokemon (Kanto)",
    "pokemon-tower",
    "Pok\u00e9mon_Tower_1F_FRLG.png",
    { x: 74, y: 63 },
  ),
  routeZone(8, { x: 68, y: 63 }),
  cityZone("saffron_city", "Safrania (Kanto)", "saffron-city", "Saffron_City_FRLG.png", { x: 59, y: 63 }),
  routeZone(7, { x: 52, y: 63 }),
  cityZone("celadon_city", "Celadopole (Kanto)", "celadon-city", "Celadon_City_FRLG.png", { x: 45, y: 63 }),
  routeZone(16, { x: 39, y: 63 }),
  routeZone(17, { x: 34, y: 70 }),
  routeZone(18, { x: 39, y: 76 }),
  cityZone("fuchsia_city", "Parmanie (Kanto)", "fuchsia-city", "Fuchsia_City_FRLG.png", { x: 50, y: 80 }),
  dungeonZone("safari_zone", "Parc Safari (Kanto)", "kanto-safari-zone", "Safari_Zone_area_1_FRLG.png", { x: 58, y: 84 }),
  routeZone(15, { x: 59, y: 78 }),
  routeZone(14, { x: 66, y: 76 }),
  routeZone(13, { x: 73, y: 74 }),
  routeZone(12, { x: 79, y: 67 }),
  routeZone(19, { x: 53, y: 86 }),
  routeZone(20, { x: 45, y: 88 }),
  dungeonZone(
    "seafoam_islands",
    "Iles Ecume (Kanto)",
    "seafoam-islands",
    "Seafoam_Islands_1F_FRLG.png",
    { x: 31, y: 88 },
  ),
  cityZone("cinnabar_island", "Cramois'Ile (Kanto)", "cinnabar-island", "Cinnabar_Island_FRLG.png", { x: 36, y: 95 }),
  dungeonZone(
    "pokemon_mansion",
    "Manoir Pokemon (Kanto)",
    "pokemon-mansion",
    "Pok\u00e9mon_Mansion_1F_FRLG.png",
    { x: 36, y: 95 },
  ),
  routeZone(21, { x: 36, y: 91 }),
  routeZone(22, { x: 25, y: 74 }),
  routeZone(23, { x: 21, y: 63 }),
  dungeonZone(
    "victory_road",
    "Route Victoire (Kanto)",
    "kanto-victory-road-2",
    "Victory_Road_1F_FRLG.png",
    { x: 18, y: 53 },
  ),
  cityZone("indigo_plateau", "Plateau Indigo (Kanto)", "indigo-plateau", "Indigo_Plateau_FRLG.png", { x: 15, y: 49 }),
  dungeonZone("cerulean_cave", "Grotte Inconnue (Kanto)", "cerulean-cave", "Cerulean_Cave_1F_FRLG.png", { x: 66, y: 45 }),
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toSafeInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function parsePokemonIdFromUrl(url) {
  const value = String(url || "");
  const pokemonMatch = value.match(/\/pokemon\/(\d+)\/?$/);
  if (pokemonMatch) {
    return Number(pokemonMatch[1]);
  }
  const speciesMatch = value.match(/\/pokemon-species\/(\d+)\/?$/);
  if (speciesMatch) {
    return Number(speciesMatch[1]);
  }
  const anyId = value.match(/\/(\d+)\/?$/);
  if (anyId) {
    return Number(anyId[1]);
  }
  return 0;
}

async function fetchJson(url, retries = 3) {
  let lastErr = null;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "pokeidle-zone-generator/1.0" } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (error) {
      lastErr = error;
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw lastErr;
}

async function fetchBuffer(url, retries = 3) {
  let lastErr = null;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "pokeidle-zone-generator/1.0" } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (error) {
      lastErr = error;
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw lastErr;
}

function loadFrenchNamesFromLocalData() {
  const out = new Map();
  const dirs = fs.readdirSync(POKEMON_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const dirent of dirs) {
    const folder = dirent.name;
    const jsonPath = path.join(POKEMON_DIR, folder, `${folder}_data.json`);
    if (!fs.existsSync(jsonPath)) {
      continue;
    }
    try {
      const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const id = Number(payload?.pokedex_number || 0);
      const nameFr = String(payload?.name_fr || payload?.name_en || "").trim();
      if (id > 0 && nameFr) {
        out.set(id, nameFr);
      }
    } catch {
      // ignore malformed data
    }
  }
  return out;
}

function displayNameFromSlug(slug) {
  const base = String(slug || "").replace(/-/g, " ");
  return base
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function normalizeLevelWeights(levelWeightsRaw) {
  const levels = Object.keys(levelWeightsRaw)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (levels.length === 0) {
    return {
      minLevel: 2,
      maxLevel: 4,
      weights: [
        { level: 2, weight: 2 },
        { level: 3, weight: 3 },
        { level: 4, weight: 1 },
      ],
    };
  }

  const weights = levels.map((level) => ({
    level,
    weight: Math.max(1, Math.round(levelWeightsRaw[level])),
  }));

  return {
    minLevel: levels[0],
    maxLevel: levels[levels.length - 1],
    weights,
  };
}

function roundChance(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  return Math.round(n);
}

async function resolveBulbagardenImageUrl(fileTitle) {
  const title = `File:${fileTitle}`;
  const api = `https://archives.bulbagarden.net/w/api.php?action=query&titles=${encodeURIComponent(
    title,
  )}&prop=imageinfo&iiprop=url&format=json`;
  const data = await fetchJson(api);
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function downloadBulbagardenImage(fileTitle, outputPathAbs) {
  const imageUrl = await resolveBulbagardenImageUrl(fileTitle);
  if (!imageUrl) {
    throw new Error(`Image introuvable sur Bulbagarden: ${fileTitle}`);
  }
  const buffer = await fetchBuffer(imageUrl);
  ensureDir(path.dirname(outputPathAbs));
  fs.writeFileSync(outputPathAbs, buffer);
}

async function collectEncountersForLocation(locationSlug, frNames) {
  const locUrl = `https://pokeapi.co/api/v2/location/${locationSlug}`;
  const locationPayload = await fetchJson(locUrl);
  const areas = Array.isArray(locationPayload?.areas) ? locationPayload.areas : [];
  const sourceAreas = [];
  const speciesById = new Map();

  for (const areaEntry of areas) {
    if (!areaEntry?.url) {
      continue;
    }
    const area = await fetchJson(areaEntry.url);
    sourceAreas.push(String(area?.name || ""));

    const encounters = Array.isArray(area?.pokemon_encounters) ? area.pokemon_encounters : [];
    for (const encounter of encounters) {
      const speciesId = parsePokemonIdFromUrl(encounter?.pokemon?.url);
      if (speciesId <= 0) {
        continue;
      }

      const nameEn = String(encounter?.pokemon?.name || "").trim();
      const existing = speciesById.get(speciesId);
      const rec = existing || {
        id: speciesId,
        name_en: nameEn,
        name_fr: frNames.get(speciesId) || displayNameFromSlug(nameEn),
        methods: new Set(),
        max_chance_firered: 0,
        max_chance_leafgreen: 0,
        level_weights_raw: {},
      };

      let hasFrlgData = false;
      const versionDetails = Array.isArray(encounter?.version_details) ? encounter.version_details : [];
      for (const vd of versionDetails) {
        const versionName = String(vd?.version?.name || "");
        if (!FRLG.has(versionName)) {
          continue;
        }
        hasFrlgData = true;

        const maxChance = Math.max(0, Number(vd?.max_chance || 0));
        if (versionName === "firered") {
          rec.max_chance_firered = Math.max(rec.max_chance_firered, maxChance);
        }
        if (versionName === "leafgreen") {
          rec.max_chance_leafgreen = Math.max(rec.max_chance_leafgreen, maxChance);
        }

        const details = Array.isArray(vd?.encounter_details) ? vd.encounter_details : [];
        for (const detail of details) {
          const chance = Math.max(0, Number(detail?.chance || 0));
          const minLevel = Math.max(1, toSafeInt(detail?.min_level, 1));
          const maxLevel = Math.max(minLevel, toSafeInt(detail?.max_level, minLevel));
          const method = String(detail?.method?.name || "").trim();
          if (method) {
            rec.methods.add(method);
          }
          if (chance <= 0) {
            continue;
          }
          const span = Math.max(1, maxLevel - minLevel + 1);
          const perLevel = chance / span;
          for (let lvl = minLevel; lvl <= maxLevel; lvl += 1) {
            rec.level_weights_raw[lvl] = (rec.level_weights_raw[lvl] || 0) + perLevel;
          }
        }
      }

      if (hasFrlgData || existing) {
        speciesById.set(speciesId, rec);
      }
    }
  }

  const encounterRows = [];
  for (const rec of speciesById.values()) {
    const frlgChance = Math.max(rec.max_chance_firered, rec.max_chance_leafgreen);
    if (frlgChance <= 0 || rec.methods.size === 0) {
      continue;
    }

    const norm = normalizeLevelWeights(rec.level_weights_raw);
    const levelWeightSum = norm.weights.reduce((a, e) => a + e.weight, 0);
    const spawnWeight = Math.max(1, Math.round(Math.max(frlgChance, levelWeightSum * 0.12)));

    encounterRows.push({
      id: rec.id,
      name_en: rec.name_en,
      name_fr: rec.name_fr,
      methods: Array.from(rec.methods).sort(),
      max_chance_firered: roundChance(rec.max_chance_firered),
      max_chance_leafgreen: roundChance(rec.max_chance_leafgreen),
      spawn_weight: spawnWeight,
      min_level: norm.minLevel,
      max_level: norm.maxLevel,
      level_weights: norm.weights,
    });
  }

  encounterRows.sort((a, b) => b.spawn_weight - a.spawn_weight || a.id - b.id);
  return { sourceAreas, encounterRows };
}

async function generateZones() {
  ensureDir(MAP_DIR);
  ensureDir(BG_DIR);
  ensureDir(MAP_ASSET_DIR);

  const frNames = loadFrenchNamesFromLocalData();
  const summary = [];
  const zoneOrder = [];

  for (const zone of STORY_ZONES) {
    const combatEnabled = zone.zoneType !== "town";
    const unlockMode = zone.zoneType === "town" ? "visit" : "defeats";
    const unlockDefeatsRequired = unlockMode === "defeats" ? DEFAULT_UNLOCK_DEFEATS : 0;
    let sourceAreas = [];
    let encounterRows = [];

    try {
      const result = await collectEncountersForLocation(zone.locationSlug, frNames);
      sourceAreas = result.sourceAreas;
      encounterRows = result.encounterRows;
    } catch (error) {
      console.warn(`[warn] location ${zone.locationSlug} indisponible: ${error?.message || error}`);
    }

    const data = {
      route_id: zone.id,
      route_name_fr: zone.nameFr,
      zone_type: zone.zoneType,
      combat_enabled: combatEnabled,
      unlock_mode: unlockMode,
      unlock_defeats_required: unlockDefeatsRequired,
      source_games: ["firered", "leafgreen"],
      source_location: zone.locationSlug,
      source_location_areas: sourceAreas,
      background_image: `assets/backgrounds/${zone.backgroundFile}`,
      map_marker: {
        x: Number(zone.marker?.x || 0),
        y: Number(zone.marker?.y || 0),
      },
      encounters: combatEnabled ? encounterRows : [],
      encounter_species_count_source: encounterRows.length,
      generated_from: "pokeapi + bulbagarden",
      generated_at_utc: NOW_ISO,
    };

    const zoneFilePath = path.join(MAP_DIR, `${zone.id}.json`);
    fs.writeFileSync(zoneFilePath, JSON.stringify(data, null, 2), "utf8");
    zoneOrder.push(zone.id);

    const bgOutPath = path.join(BG_DIR, zone.backgroundFile);
    try {
      await downloadBulbagardenImage(zone.backgroundTitle, bgOutPath);
    } catch (error) {
      console.warn(`[warn] background ${zone.backgroundTitle} (${zone.id}): ${error?.message || error}`);
      data.background_image = null;
      fs.writeFileSync(zoneFilePath, JSON.stringify(data, null, 2), "utf8");
    }

    summary.push({
      route_id: zone.id,
      route_name_fr: zone.nameFr,
      zone_type: zone.zoneType,
      combat_enabled: combatEnabled,
      unlock_mode: unlockMode,
      unlock_defeats_required: unlockDefeatsRequired,
      source_location: zone.locationSlug,
      source_location_areas: sourceAreas,
      background_image: data.background_image,
      encounter_species_count: encounterRows.length,
      map_marker: data.map_marker,
    });

    console.log(`[ok] ${zone.id} -> encounters=${encounterRows.length} combat=${combatEnabled}`);
  }

  const mapOutPath = path.join(ROOT, MAP_IMAGE.outPath);
  if (MAP_IMAGE.title) {
    try {
      await downloadBulbagardenImage(MAP_IMAGE.title, mapOutPath);
    } catch (error) {
      console.warn(`[warn] map image ${MAP_IMAGE.title}: ${error?.message || error}`);
    }
  } else if (!fs.existsSync(mapOutPath)) {
    console.warn(`[warn] map image missing at ${MAP_IMAGE.outPath}; place the reference map manually before publishing.`);
  }

  const catalog = {
    source: "pokeapi + bulbagarden",
    games: ["firered", "leafgreen"],
    unlock_target_default: DEFAULT_UNLOCK_DEFEATS,
    map_image: MAP_IMAGE.outPath,
    generated_at_utc: NOW_ISO,
    zone_order: zoneOrder,
    zones: summary,
  };
  fs.writeFileSync(path.join(MAP_DIR, "kanto_frlg_zones.json"), JSON.stringify(catalog, null, 2), "utf8");
  console.log(`[done] zones generated: ${zoneOrder.length}`);
}

generateZones().catch((error) => {
  console.error(error);
  process.exit(1);
});
