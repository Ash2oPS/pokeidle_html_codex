import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MAP_DIR = path.join(ROOT, "map_data");
const BG_DIR = path.join(ROOT, "assets", "backgrounds");
const POKEMON_DIR = path.join(ROOT, "pokemon_data");
const FRLG = new Set(["firered", "leafgreen"]);
const ROUTE_NUMBERS = Array.from({ length: 25 }, (_, i) => i + 1);
const ROUTE_UNLOCK_GAMES = ["firered", "leafgreen"];
const ROUTE_UNLOCK_TARGET = 20;
const nowIso = new Date().toISOString();

function routeLocationSlug(routeNumber) {
  if (routeNumber >= 19 && routeNumber <= 21) {
    return `kanto-sea-route-${routeNumber}`;
  }
  return `kanto-route-${routeNumber}`;
}

function routeId(routeNumber) {
  return `kanto_route_${routeNumber}`;
}

function routeNameFr(routeNumber) {
  return `Route ${routeNumber} (Kanto)`;
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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function fetchJson(url, retries = 3) {
  let lastErr = null;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "pokeidle-route-generator/1.1" } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (error) {
      lastErr = error;
      await new Promise((r) => setTimeout(r, 180 * (i + 1)));
    }
  }
  throw lastErr;
}

async function fetchBuffer(url, retries = 3) {
  let lastErr = null;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "pokeidle-route-generator/1.1" } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (error) {
      lastErr = error;
      await new Promise((r) => setTimeout(r, 180 * (i + 1)));
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
      // ignore malformed files
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

async function resolveBulbagardenRouteImageUrl(routeNumber) {
  const title = `File:Kanto_Route_${routeNumber}_FRLG.png`;
  const api = `https://archives.bulbagarden.net/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  const data = await fetchJson(api);
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function generateAll() {
  ensureDir(MAP_DIR);
  ensureDir(BG_DIR);

  const frNames = loadFrenchNamesFromLocalData();
  const summaryRoutes = [];
  const routeOrder = [];

  for (const routeNumber of ROUTE_NUMBERS) {
    const locSlug = routeLocationSlug(routeNumber);
    const locUrl = `https://pokeapi.co/api/v2/location/${locSlug}`;
    const route = {
      route_number: routeNumber,
      route_id: routeId(routeNumber),
      route_name_fr: routeNameFr(routeNumber),
      source_games: [...ROUTE_UNLOCK_GAMES],
      source_location: locSlug,
      source_location_areas: [],
      background_image: `assets/backgrounds/kanto_route_${routeNumber}_frlg.png`,
      encounters: [],
      generated_from: "pokeapi + bulbagarden",
      generated_at_utc: nowIso,
    };

    let locationPayload = null;
    try {
      locationPayload = await fetchJson(locUrl);
    } catch (error) {
      console.warn(`[warn] missing location ${locSlug}: ${error?.message || error}`);
      continue;
    }

    const speciesById = new Map();
    const areas = Array.isArray(locationPayload?.areas) ? locationPayload.areas : [];
    for (const areaEntry of areas) {
      if (!areaEntry?.url) {
        continue;
      }
      const area = await fetchJson(areaEntry.url);
      route.source_location_areas.push(area.name);

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
    route.encounters = encounterRows;

    const bgUrl = await resolveBulbagardenRouteImageUrl(routeNumber);
    if (bgUrl) {
      try {
        const bgBuffer = await fetchBuffer(bgUrl);
        fs.writeFileSync(path.join(BG_DIR, `kanto_route_${routeNumber}_frlg.png`), bgBuffer);
      } catch (error) {
        console.warn(`[warn] route ${routeNumber} image download failed: ${error?.message || error}`);
      }
    } else {
      route.background_image = null;
      console.warn(`[warn] route ${routeNumber} image missing on Bulbagarden`);
    }

    const routeFile = path.join(MAP_DIR, `kanto_route_${routeNumber}.json`);
    fs.writeFileSync(routeFile, JSON.stringify(route, null, 2), "utf8");
    routeOrder.push(route.route_id);

    summaryRoutes.push({
      route_number: route.route_number,
      route_id: route.route_id,
      route_name_fr: route.route_name_fr,
      source_location: route.source_location,
      source_location_areas: route.source_location_areas,
      background_image: route.background_image,
      encounter_species_count: route.encounters.length,
    });

    console.log(`[ok] route ${routeNumber} -> encounters=${route.encounters.length}`);
  }

  const summary = {
    source: "pokeapi",
    games: [...ROUTE_UNLOCK_GAMES],
    unlock_target_per_route: ROUTE_UNLOCK_TARGET,
    generated_at_utc: nowIso,
    route_order: routeOrder,
    routes: summaryRoutes,
  };
  fs.writeFileSync(path.join(MAP_DIR, "kanto_frlg_routes.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log(`[done] generated ${summaryRoutes.length} routes`);
}

generateAll().catch((error) => {
  console.error(error);
  process.exit(1);
});
