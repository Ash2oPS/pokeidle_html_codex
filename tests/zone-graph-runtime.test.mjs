import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRouteUnlockProgressState,
  getBlockedConnectedRouteStates,
  getConnectedRouteIds,
  getUnlockableConnectedRouteIds,
  normalizeUnlockedRouteIds,
  tryUnlockConnectedRoutes,
} from "../lib/zone-graph-runtime.js";

function createRouteCatalog() {
  return new Map([
    [
      "kanto_city_pallet_town",
      {
        route_id: "kanto_city_pallet_town",
        route_name_fr: "Bourg Palette",
        combat_enabled: false,
        unlock_mode: "visit",
        connected_route_ids: ["kanto_route_1", "hoenn_route_101"],
      },
    ],
    [
      "kanto_route_1",
      {
        route_id: "kanto_route_1",
        route_name_fr: "Route 1",
        combat_enabled: true,
        unlock_mode: "defeats",
        unlock_defeats_required: 2,
        unlock_timer_ms: 20000,
        connected_route_ids: ["kanto_city_viridian_city", "johto_route_29", "hoenn_route_101"],
      },
    ],
    [
      "kanto_city_viridian_city",
      {
        route_id: "kanto_city_viridian_city",
        route_name_fr: "Jadielle",
        combat_enabled: false,
        unlock_mode: "visit",
        connected_route_ids: ["kanto_route_2"],
      },
    ],
    [
      "johto_route_29",
      {
        route_id: "johto_route_29",
        route_name_fr: "Route 29",
        combat_enabled: true,
        unlock_mode: "defeats",
        unlock_defeats_required: 3,
        connected_route_ids: [],
        access_rules: {
          requires_flags_all: ["guide_spoken"],
          requires_flags_any: [],
          blocked_reason_fr: "Parle d'abord au guide.",
        },
      },
    ],
    [
      "hoenn_route_101",
      {
        route_id: "hoenn_route_101",
        route_name_fr: "Route 101",
        combat_enabled: true,
        unlock_mode: "defeats",
        unlock_defeats_required: 1,
        connected_route_ids: [],
        access_rules: {
          requires_flags_all: [],
          requires_flags_any: ["ferry_ticket", "badge_hoenn"],
          blocked_reason_fr: "Il te faut une autorisation pour traverser.",
        },
      },
    ],
  ]);
}

test("normalizeUnlockedRouteIds preserves sparse unlocks instead of recontiguizing", () => {
  const availableRouteIds = ["kanto_city_pallet_town", "kanto_route_1", "kanto_city_viridian_city", "johto_route_29"];

  const unlockedRouteIds = normalizeUnlockedRouteIds(
    ["kanto_city_pallet_town", "johto_route_29"],
    availableRouteIds,
    "kanto_city_pallet_town",
  );

  assert.deepEqual(unlockedRouteIds, ["kanto_city_pallet_town", "johto_route_29"]);
});

test("graph helpers expose multiple connected destinations including cross-region branches", () => {
  const routeCatalog = createRouteCatalog();

  const connectedRouteIds = getConnectedRouteIds("kanto_route_1", routeCatalog);

  assert.deepEqual(connectedRouteIds, ["kanto_city_viridian_city", "johto_route_29", "hoenn_route_101"]);
});

test("tryUnlockConnectedRoutes unlocks all reachable branches and keeps blocked ones visible", () => {
  const routeCatalog = createRouteCatalog();
  const availableRouteIds = Array.from(routeCatalog.keys());

  const result = tryUnlockConnectedRoutes({
    routeId: "kanto_route_1",
    routeCatalog,
    unlockedRouteIds: ["kanto_city_pallet_town", "kanto_route_1"],
    routeDefeatCounts: {
      kanto_route_1: 2,
    },
    zoneFlags: [],
    availableRouteIds,
    defaultRouteId: "kanto_city_pallet_town",
    fallbackUnlockTarget: 2,
  });

  assert.deepEqual(result.unlocked, ["kanto_city_viridian_city"]);
  assert.deepEqual(result.unlockedRouteIds, ["kanto_city_pallet_town", "kanto_route_1", "kanto_city_viridian_city"]);
  assert.deepEqual(
    result.blocked.map((entry) => entry.route_id),
    ["johto_route_29", "hoenn_route_101"],
  );
  assert.equal(result.blocked[0].blocked_reason_fr, "Parle d'abord au guide.");
});

test("flag-based access unlocks additional branches once conditions are met", () => {
  const routeCatalog = createRouteCatalog();

  const unlockableWithoutFlags = getUnlockableConnectedRouteIds({
    routeId: "kanto_route_1",
    routeCatalog,
    unlockedRouteIds: ["kanto_city_pallet_town", "kanto_route_1"],
    zoneFlags: [],
  });
  const unlockableWithFlags = getUnlockableConnectedRouteIds({
    routeId: "kanto_route_1",
    routeCatalog,
    unlockedRouteIds: ["kanto_city_pallet_town", "kanto_route_1"],
    zoneFlags: ["guide_spoken", "badge_hoenn"],
  });

  assert.deepEqual(unlockableWithoutFlags, ["kanto_city_viridian_city"]);
  assert.deepEqual(unlockableWithFlags, ["kanto_city_viridian_city", "johto_route_29", "hoenn_route_101"]);
});

test("buildRouteUnlockProgressState reports blocked branches and route access flags", () => {
  const routeCatalog = createRouteCatalog();
  const availableRouteIds = Array.from(routeCatalog.keys());

  const progressState = buildRouteUnlockProgressState({
    routeId: "kanto_route_1",
    routeCatalog,
    unlockedRouteIds: ["kanto_city_pallet_town", "kanto_route_1"],
    routeDefeatCounts: { kanto_route_1: 2 },
    zoneFlags: ["guide_spoken"],
    availableRouteIds,
    defaultRouteId: "kanto_city_pallet_town",
    fallbackUnlockTarget: 2,
    fallbackTimerMs: 20000,
  });

  assert.deepEqual(progressState.connectedRouteIds, ["kanto_city_viridian_city", "johto_route_29", "hoenn_route_101"]);
  assert.deepEqual(progressState.unlockableConnectedRouteIds, ["kanto_city_viridian_city", "johto_route_29"]);
  assert.deepEqual(
    progressState.blockedConnectedRoutes.map((entry) => entry.route_id),
    ["hoenn_route_101"],
  );
  assert.deepEqual(progressState.routeAccessFlags, ["guide_spoken"]);
  assert.equal(progressState.timerEnabled, true);
  assert.equal(progressState.timerDurationMs, 20000);
  assert.equal(progressState.connectedRouteIds[0], "kanto_city_viridian_city");
  assert.equal(progressState.connectedRouteIds[2], "hoenn_route_101");
});

test("getBlockedConnectedRouteStates exposes lock reasons for UI strips and map listings", () => {
  const routeCatalog = createRouteCatalog();

  const states = getBlockedConnectedRouteStates({
    routeId: "kanto_route_1",
    routeCatalog,
    unlockedRouteIds: ["kanto_city_pallet_town", "kanto_route_1"],
    zoneFlags: [],
  });

  const byId = new Map(states.map((entry) => [entry.route_id, entry]));
  assert.equal(byId.get("kanto_city_viridian_city")?.blocked, false);
  assert.equal(byId.get("johto_route_29")?.blocked, true);
  assert.equal(byId.get("johto_route_29")?.blocked_reason_fr, "Parle d'abord au guide.");
  assert.deepEqual(byId.get("johto_route_29")?.requires_flags_all, ["guide_spoken"]);
  assert.equal(byId.get("hoenn_route_101")?.blocked, true);
  assert.deepEqual(byId.get("hoenn_route_101")?.requires_flags_any, ["ferry_ticket", "badge_hoenn"]);
});
