import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ROUTE_ID_ORDER, UNKNOWN_CAVE_ROUTE_ID } from "../lib/game-world-config.js";
import { validateRouteDataPayload } from "../lib/runtime-data.js";

const ROOT_DIR = process.cwd();
const MAP_DATA_DIR = path.join(ROOT_DIR, "map_data");
const JOHTO_CATALOG_PATH = path.join(MAP_DATA_DIR, "johto_hgss_zones.json");

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function resolveWorkspacePath(relativePath) {
  return path.join(ROOT_DIR, ...String(relativePath || "").split("/"));
}

test("Johto starts immediately after Unknown Cave in route progression", () => {
  const unknownCaveIndex = ROUTE_ID_ORDER.indexOf(UNKNOWN_CAVE_ROUTE_ID);
  assert.notEqual(unknownCaveIndex, -1, "Unknown Cave must exist in route order");
  assert.equal(
    ROUTE_ID_ORDER[unknownCaveIndex + 1],
    "johto_route_29",
    "The first Johto unlock after Unknown Cave must be Route 29",
  );
});

test("Johto catalog stays aligned with runtime route order", () => {
  const catalog = readJson(JOHTO_CATALOG_PATH);
  const johtoZoneOrder = Array.isArray(catalog?.zone_order) ? catalog.zone_order : [];
  assert.equal(johtoZoneOrder.length, 49, "Expected a full 49-zone Johto progression slice");

  const unknownCaveIndex = ROUTE_ID_ORDER.indexOf(UNKNOWN_CAVE_ROUTE_ID);
  const routeSlice = ROUTE_ID_ORDER.slice(unknownCaveIndex + 1, unknownCaveIndex + 1 + johtoZoneOrder.length);
  assert.deepEqual(routeSlice, johtoZoneOrder, "Runtime route order and generated Johto catalog must stay in sync");
});

test("All generated Johto zones validate and reference existing assets", () => {
  const catalog = readJson(JOHTO_CATALOG_PATH);
  const johtoZoneOrder = Array.isArray(catalog?.zone_order) ? catalog.zone_order : [];

  for (const zoneId of johtoZoneOrder) {
    const zonePath = path.join(MAP_DATA_DIR, `${zoneId}.json`);
    assert.ok(fs.existsSync(zonePath), `Missing zone JSON: ${zoneId}`);

    const payload = validateRouteDataPayload(readJson(zonePath), zoneId);
    assert.equal(payload.route_id, zoneId, `Unexpected route_id for ${zoneId}`);
    assert.ok(String(payload.background_image || "").trim().length > 0, `${zoneId} must define a background image`);
    assert.ok(
      fs.existsSync(resolveWorkspacePath(payload.background_image)),
      `${zoneId} background image must exist on disk`,
    );

    if (payload.combat_enabled !== false) {
      assert.ok(Array.isArray(payload.encounters) && payload.encounters.length > 0, `${zoneId} must contain encounters`);
    }

    assert.ok(payload.map_marker && Number.isFinite(payload.map_marker.x) && Number.isFinite(payload.map_marker.y), `${zoneId} must define a map marker`);
  }
});
