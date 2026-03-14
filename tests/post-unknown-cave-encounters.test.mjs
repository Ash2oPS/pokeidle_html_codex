import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const CATALOG_PATH = path.join(ROOT_DIR, "map_data", "kanto_frlg_zones.json");
const ENCOUNTER_PATH = path.join(ROOT_DIR, "map_data", "kanto_zone_encounters_post_unknown_cave.csv");

const STARTER_IDS = new Set([1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393]);
const FORBIDDEN_IDS = new Set([
  144, 145, 146, 150, 243, 244, 245, 249, 250,
  377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488,
  151, 251, 385, 386, 489, 490, 491, 492, 493,
]);

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

test("post unknown cave encounters mapping stays balanced and excludes forbidden species", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const zoneOrder = Array.isArray(catalog?.zone_order) ? catalog.zone_order.map((routeId) => String(routeId || "")) : [];
  const csvRows = parseCsv(fs.readFileSync(ENCOUNTER_PATH, "utf8"));
  assert.ok(csvRows.length > 1, "CSV must contain a header and data rows");

  const header = csvRows[0];
  const data = csvRows.slice(1);
  const columnIndex = Object.fromEntries(header.map((name, index) => [String(name || ""), index]));
  const routeIdIndex = columnIndex.route_id;
  const pokemonIdIndex = columnIndex.pokemon_id;
  const spawnWeightIndex = columnIndex.spawn_weight;

  assert.ok(Number.isInteger(routeIdIndex), "route_id column is required");
  assert.ok(Number.isInteger(pokemonIdIndex), "pokemon_id column is required");
  assert.ok(Number.isInteger(spawnWeightIndex), "spawn_weight column is required");

  const countsByRoute = new Map();
  const uniqueSpeciesIds = new Set();
  const forbiddenFound = new Set();
  let starterWithWrongWeight = 0;

  for (const row of data) {
    const routeId = String(row[routeIdIndex] || "");
    const pokemonId = Math.max(0, Number(row[pokemonIdIndex] || 0));
    const spawnWeight = Math.max(0, Number(row[spawnWeightIndex] || 0));
    if (!routeId || pokemonId <= 0) {
      continue;
    }
    countsByRoute.set(routeId, (countsByRoute.get(routeId) || 0) + 1);
    uniqueSpeciesIds.add(pokemonId);
    if (FORBIDDEN_IDS.has(pokemonId)) {
      forbiddenFound.add(pokemonId);
    }
    if (STARTER_IDS.has(pokemonId) && spawnWeight !== 1) {
      starterWithWrongWeight += 1;
    }
  }

  for (const routeId of zoneOrder) {
    assert.ok(countsByRoute.has(routeId), `Route missing from mapping: ${routeId}`);
  }

  const encounterCounts = Array.from(countsByRoute.values());
  const minCount = Math.min(...encounterCounts);
  const maxCount = Math.max(...encounterCounts);

  assert.equal(starterWithWrongWeight, 0, "All Gen 1-4 starters must stay at 1% rarity weight");
  assert.deepEqual(Array.from(forbiddenFound.values()), [], "No legendary/mythical species should appear");
  assert.equal(uniqueSpeciesIds.size, 458, "Expected full non-legendary/non-mythical Gen 1-4 coverage");
  assert.ok(minCount >= 9, `Expected at least 9 species per route, found ${minCount}`);
  assert.ok(maxCount <= 18, `Expected at most 18 species per route, found ${maxCount}`);
});
