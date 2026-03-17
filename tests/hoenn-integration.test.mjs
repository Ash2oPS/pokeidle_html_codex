import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID,
  MAP_REGION_COPY_BY_REGION_ID,
  ROUTE_ID_ORDER,
} from "../lib/game-world-config.js";
import { validateRouteDataPayload } from "../lib/runtime-data.js";

const ROOT_DIR = process.cwd();
const MAP_DATA_DIR = path.join(ROOT_DIR, "map_data");
const HOENN_CATALOG_PATH = path.join(MAP_DATA_DIR, "hoenn_emerald_zones.json");
const HOENN_REGION_MAP_PATH = path.join(ROOT_DIR, "assets", "maps", "hoenn_map_emerald.png");

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function readProjectFile(...segments) {
  return fs.readFileSync(path.join(ROOT_DIR, ...segments), "utf8");
}

function resolveWorkspacePath(relativePath) {
  return path.join(ROOT_DIR, ...String(relativePath || "").split("/"));
}

function getHoennZoneOrder() {
  const catalog = readJson(HOENN_CATALOG_PATH);
  return Array.isArray(catalog?.zone_order) ? catalog.zone_order : [];
}

function getZonePayload(zoneId) {
  const zonePath = path.join(MAP_DATA_DIR, `${zoneId}.json`);
  assert.ok(fs.existsSync(zonePath), `Missing zone JSON: ${zoneId}`);
  return validateRouteDataPayload(readJson(zonePath), zoneId);
}

function getEncounterNames(zoneId) {
  return getZonePayload(zoneId).encounters.map((encounter) => String(encounter?.name_en || "").trim().toLowerCase()).sort();
}

function assertExactEncounterSet(zoneId, expectedNames) {
  assert.deepEqual(getEncounterNames(zoneId), expectedNames.slice().sort(), `${zoneId} should match the Emerald encounter set`);
}

function getLastJohtoIndex() {
  let lastIndex = -1;
  for (let index = 0; index < ROUTE_ID_ORDER.length; index += 1) {
    if (String(ROUTE_ID_ORDER[index] || "").startsWith("johto_")) {
      lastIndex = index;
    }
  }
  return lastIndex;
}

test("Hoenn starts immediately after the final Johto zone", () => {
  const lastJohtoIndex = getLastJohtoIndex();
  assert.notEqual(lastJohtoIndex, -1, "Johto must exist in route order before Hoenn");
  assert.equal(ROUTE_ID_ORDER[lastJohtoIndex + 1], "hoenn_route_101", "Hoenn must begin with Route 101");
});

test("Hoenn catalog stays aligned with runtime route order", () => {
  const hoennZoneOrder = getHoennZoneOrder();
  assert.equal(hoennZoneOrder.length, 77, "Expected the full 77-zone Hoenn progression slice");

  const lastJohtoIndex = getLastJohtoIndex();
  const routeSlice = ROUTE_ID_ORDER.slice(lastJohtoIndex + 1, lastJohtoIndex + 1 + hoennZoneOrder.length);
  assert.deepEqual(routeSlice, hoennZoneOrder, "Runtime route order and generated Hoenn catalog must stay in sync");
});

test("Hoenn region config is wired in runtime and map copy", () => {
  assert.equal(
    MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID.hoenn,
    "assets/maps/hoenn_map_emerald.png",
    "Hoenn should use the Emerald region map asset",
  );
  assert.equal(MAP_REGION_COPY_BY_REGION_ID.hoenn?.title, "Carte de Hoenn", "Hoenn map copy should be registered");
  assert.ok(fs.existsSync(HOENN_REGION_MAP_PATH), "Hoenn region map image must exist on disk");

  const runtimeSource = readProjectFile("game-runtime.js");
  assert.match(
    runtimeSource,
    /if \(id\.startsWith\("hoenn_"\)\)\s*\{\s*return "hoenn";\s*\}/,
    "Runtime region detection should recognize hoenn_ route ids",
  );
});

test("All generated Hoenn zones validate and reference Emerald-specific assets", () => {
  const hoennZoneOrder = getHoennZoneOrder();

  for (const zoneId of hoennZoneOrder) {
    const payload = getZonePayload(zoneId);
    assert.equal(payload.route_id, zoneId, `Unexpected route_id for ${zoneId}`);
    assert.ok(String(payload.background_image || "").trim().length > 0, `${zoneId} must define a background image`);
    assert.ok(fs.existsSync(resolveWorkspacePath(payload.background_image)), `${zoneId} background image must exist on disk`);
    assert.ok(
      payload.map_marker && Number.isFinite(payload.map_marker.x) && Number.isFinite(payload.map_marker.y),
      `${zoneId} must define a map marker`,
    );

    assert.match(
      String(payload.background_image || ""),
      /^assets\/backgrounds\/hoenn_[a-z0-9_]+_emerald\.png$/,
      `${zoneId} should use a Hoenn Emerald background asset`,
    );
    assert.ok(!String(payload.background_image || "").includes("placeholder"), `${zoneId} should not reference placeholder art`);
    assert.ok(!String(payload.background_image || "").includes("kanto_"), `${zoneId} should not fall back to Kanto art`);
    assert.ok(!String(payload.background_image || "").includes("johto_"), `${zoneId} should not fall back to Johto art`);

    const sourceUrl = String(payload.source_url || "");
    assert.match(sourceUrl, /raw\.githubusercontent\.com\/pret\/pokeemerald\/master\/data\/maps\//, `${zoneId} should keep a pokeemerald source_url`);

    if (payload.combat_enabled !== false) {
      assert.ok(Array.isArray(payload.encounters) && payload.encounters.length > 0, `${zoneId} must contain encounters`);
    }
  }
});

test("Hoenn underwater zones are present, combat-enabled, and Sootopolis transit is absorbed", () => {
  const hoennZoneOrder = getHoennZoneOrder();
  const underwaterZoneIds = hoennZoneOrder.filter((zoneId) => zoneId.includes("underwater_route_"));
  assert.equal(underwaterZoneIds.length, 7, "Expected 7 standalone underwater Hoenn zones");

  const combatUnderwaterZoneIds = new Set(["hoenn_dungeon_underwater_route_124", "hoenn_dungeon_underwater_route_126"]);

  for (const zoneId of underwaterZoneIds) {
    const payload = getZonePayload(zoneId);
    const shouldCombat = combatUnderwaterZoneIds.has(zoneId);
    assert.equal(payload.combat_enabled, shouldCombat, `${zoneId} combat flag should match Emerald wild data availability`);
    if (!shouldCombat) {
      assert.deepEqual(payload.encounters, [], `${zoneId} should stay visit-only when Emerald defines no wild table there`);
      continue;
    }
    assert.ok(payload.encounters.length > 0, `${zoneId} should contain underwater encounters`);
    for (const encounter of payload.encounters) {
      assert.deepEqual(encounter.methods, ["surf"], `${zoneId} encounters should be normalized to surf for runtime compatibility`);
    }
  }

  assert.equal(
    fs.existsSync(path.join(MAP_DATA_DIR, "hoenn_dungeon_underwater_sootopolis_city.json")),
    false,
    "Underwater Sootopolis should not exist as its own runtime zone",
  );

  const sootopolisPayload = getZonePayload("hoenn_city_sootopolis_city");
  const sootopolisSourceUrls = Array.isArray(sootopolisPayload.source_urls) ? sootopolisPayload.source_urls.join("\n") : "";
  assert.match(
    sootopolisSourceUrls,
    /Underwater_SootopolisCity\/map\.json/,
    "Sootopolis should absorb the Underwater_SootopolisCity transit map",
  );
});

test("Hoenn sentinel zones keep Emerald encounter fidelity", () => {
  assertExactEncounterSet("hoenn_route_101", ["poochyena", "wurmple", "zigzagoon"]);
  assertExactEncounterSet("hoenn_route_111", ["barboach", "geodude", "goldeen", "magikarp", "marill"]);
  assertExactEncounterSet("hoenn_dungeon_route_111_desert", ["baltoy", "cacnea", "sandshrew", "trapinch"]);
  assertExactEncounterSet(
    "hoenn_route_119",
    ["carvanha", "kecleon", "linoone", "magikarp", "oddish", "pelipper", "tentacool", "tropius", "wingull", "zigzagoon"],
  );
  assertExactEncounterSet("hoenn_dungeon_new_mauville", ["electrode", "magnemite", "magneton", "voltorb"]);
  assertExactEncounterSet("hoenn_dungeon_underwater_route_126", ["chinchou", "clamperl", "relicanth"]);
  assertExactEncounterSet(
    "hoenn_dungeon_victory_road",
    ["aron", "barboach", "geodude", "golbat", "goldeen", "graveler", "hariyama", "lairon", "loudred", "magikarp", "makuhita", "mawile", "sableye", "whiscash", "whismur", "zubat"],
  );

  const route111Payload = getZonePayload("hoenn_route_111");
  assert.equal(
    route111Payload.encounters.some((encounter) => encounter.methods.includes("walk")),
    false,
    "Route 111 surface should exclude desert walk encounters",
  );

  const desertPayload = getZonePayload("hoenn_dungeon_route_111_desert");
  assert.equal(
    desertPayload.encounters.every((encounter) => encounter.methods.length === 1 && encounter.methods[0] === "walk"),
    true,
    "Route 111 Desert should only expose walk encounters",
  );
});

test("Hoenn story interiors do not invent fake encounters", () => {
  const weatherInstitute = getZonePayload("hoenn_dungeon_weather_institute");
  assert.equal(weatherInstitute.combat_enabled, false, "Weather Institute should remain a visit-only zone");
  assert.deepEqual(weatherInstitute.encounters, [], "Weather Institute should not invent wild encounters");

  const aquaHideout = getZonePayload("hoenn_dungeon_aqua_hideout");
  assert.equal(aquaHideout.combat_enabled, false, "Aqua Hideout should remain a visit-only zone");
  assert.deepEqual(aquaHideout.encounters, [], "Aqua Hideout should not invent wild encounters");

  const magmaHideout = getZonePayload("hoenn_dungeon_magma_hideout");
  assert.equal(magmaHideout.combat_enabled, true, "Magma Hideout should stay combat-enabled because Emerald has wild data there");
  assertExactEncounterSet("hoenn_dungeon_magma_hideout", ["geodude", "graveler", "torkoal"]);
});
