import test from "node:test";
import assert from "node:assert/strict";

import { createRouteNavigationRuntime } from "../lib/route-navigation-runtime.js";

function createRuntimeFixture(overrides = {}) {
  const state = {
    routeCatalog: new Map([
      ["kanto_city_pallet_town", { route_id: "kanto_city_pallet_town", background_image: "assets/backgrounds/pallet-town.png" }],
      ["kanto_route_1", { route_id: "kanto_route_1", background_image: "assets/backgrounds/route-1.png" }],
      ["kanto_city_viridian_city", { route_id: "kanto_city_viridian_city", background_image: "assets/backgrounds/viridian-city.png" }],
    ]),
    routeData: { route_id: "kanto_route_1" },
    saveData: { current_route_id: "kanto_route_1" },
    ui: {
      routeNavDrawerOpen: false,
      routeNavInfoRouteId: null,
    },
    ...overrides.state,
  };
  return createRouteNavigationRuntime({
    state,
    defaultRouteId: "kanto_route_1",
    defaultRegionId: "kanto",
    normalizeUiDisplayText: (value) => String(value || ""),
    getOrderedCatalogRouteIds: () => ["kanto_city_pallet_town", "kanto_route_1", "kanto_city_viridian_city"],
    getRouteNavigationState: () => ({
      unlockedRouteIds: ["kanto_city_pallet_town", "kanto_route_1"],
      currentRouteId: "kanto_route_1",
    }),
    getRouteUnlockProgressState: () => ({
      unlockMode: "defeats",
      currentDefeats: 3,
      unlockTarget: 20,
      timerEnabled: true,
      timerDurationMs: 20000,
      blockedConnectedRoutes: [{ route_id: "kanto_city_viridian_city" }],
      unlockableConnectedRouteIds: ["kanto_city_viridian_city"],
    }),
    getConnectedRouteIds: () => ["kanto_city_pallet_town", "kanto_city_viridian_city"],
    getRouteAccessStateForRoute: () => ({
      allowed: true,
      requires_flags_all: [],
      requires_flags_any: [],
      blocked_reason_fr: "",
    }),
    isRouteUnlocked: (routeId) => routeId === "kanto_city_pallet_town" || routeId === "kanto_route_1",
    getRouteDisplayName: (routeId) => ({
      kanto_city_pallet_town: "Bourg Palette (Kanto)",
      kanto_route_1: "Route 1 (Kanto)",
      kanto_city_viridian_city: "Jadielle (Kanto)",
    })[routeId] || routeId,
    getRouteZoneTypeLabel: (routeId) => routeId.includes("city") ? "Ville" : "Route",
    getRouteRegionId: () => "kanto",
    getRouteCollectionBadgeState: () => ({ hasEncounterSpecies: false }),
    buildRouteNameStatusGroups: () => [],
    ...overrides.deps,
  });
}

test("buildRouteDisplayState marks a connected locked route as info-worthy progression", () => {
  const runtime = createRuntimeFixture();

  const routeState = runtime.buildRouteDisplayState("kanto_city_viridian_city");

  assert.equal(routeState.routeId, "kanto_city_viridian_city");
  assert.equal(routeState.unlocked, false);
  assert.equal(routeState.connectedFromCurrent, true);
  assert.equal(routeState.statusLabel, "\u00c0 ouvrir");
  assert.match(routeState.blockedReasonFr, /3\/20 KO requis/);
  assert.match(routeState.progressionRequirementFr, /Route 1/);
  assert.equal(routeState.backgroundImagePath, "assets/backgrounds/viridian-city.png");
});

test("buildRouteNavigationViewModel keeps selected blocked route info and drawer state", () => {
  const runtime = createRuntimeFixture({
    state: {
      ui: {
        routeNavDrawerOpen: true,
        routeNavInfoRouteId: "kanto_city_viridian_city",
      },
    },
  });

  const viewModel = runtime.buildRouteNavigationViewModel();

  assert.equal(viewModel.hasCatalog, true);
  assert.equal(viewModel.destinationCards.length, 2);
  assert.equal(viewModel.blockedCount, 1);
  assert.equal(viewModel.navigationDrawerOpen, true);
  assert.equal(viewModel.selectedLockedDestinationId, "kanto_city_viridian_city");
  assert.equal(viewModel.selectedLockedDestination.routeNameFr, "Jadielle (Kanto)");
  assert.equal(viewModel.currentZoneHeader.backgroundImagePath, "assets/backgrounds/route-1.png");
});
