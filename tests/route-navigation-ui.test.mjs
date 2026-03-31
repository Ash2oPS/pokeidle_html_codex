import test from "node:test";
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import { createRouteNavigationUi } from "../systems/ui/route-navigation-ui.js";

function createRefs(documentRef) {
  const routeNavPanelEl = documentRef.createElement("section");
  const routeNavZoneTypeEl = documentRef.createElement("div");
  const routeNavRegionEl = documentRef.createElement("div");
  const routeNavCurrentEl = documentRef.createElement("div");
  const routeNavBadgesEl = documentRef.createElement("div");
  const routeNavProgressChipsEl = documentRef.createElement("div");
  const routeNavDrawerToggleCountEl = documentRef.createElement("span");
  const routeNavDrawerToggleButtonEl = documentRef.createElement("button");
  const routeNavDrawerEl = documentRef.createElement("div");
  const routeNavDrawerListEl = documentRef.createElement("div");
  const routeNavInfoPanelEl = documentRef.createElement("div");
  const mapConnectionsInfoPanelEl = documentRef.createElement("div");

  const modalCurrentValueEl = documentRef.createElement("div");
  modalCurrentValueEl.className = "route-nav-modal-current-value";
  const modalCurrentRegionEl = documentRef.createElement("div");
  modalCurrentRegionEl.className = "route-nav-modal-current-region";
  routeNavDrawerEl.append(modalCurrentValueEl, modalCurrentRegionEl, routeNavDrawerListEl);

  documentRef.body.append(
    routeNavPanelEl,
    routeNavZoneTypeEl,
    routeNavRegionEl,
    routeNavCurrentEl,
    routeNavBadgesEl,
    routeNavProgressChipsEl,
    routeNavDrawerToggleCountEl,
    routeNavDrawerToggleButtonEl,
    routeNavDrawerEl,
    routeNavInfoPanelEl,
    mapConnectionsInfoPanelEl,
  );

  return {
    routeNavPanelEl,
    routeNavZoneTypeEl,
    routeNavRegionEl,
    routeNavCurrentEl,
    routeNavBadgesEl,
    routeNavProgressChipsEl,
    routeNavDrawerToggleCountEl,
    routeNavDrawerToggleButtonEl,
    routeNavDrawerEl,
    routeNavDrawerListEl,
    routeNavInfoPanelEl,
    mapConnectionsInfoPanelEl,
  };
}

function createViewModel(overrides = {}) {
  return {
    hasCatalog: true,
    currentZoneHeader: {
      routeId: "kanto_route_2",
      routeNameFr: "Route 2 (Kanto)",
      zoneTypeLabel: "Route",
      regionId: "kanto",
      regionLabel: "Kanto",
      backgroundImagePath: "assets/backgrounds/route-2.png",
    },
    badgeGroups: [],
    progressChips: [
      { label: "8/173 zones debloquees", accent: true, title: "Progression" },
      { label: "Toutes ouvertes", tone: "success", title: "Toutes ouvertes" },
    ],
    destinationCards: [
      {
        routeId: "kanto_city_pallet_town",
        routeNameFr: "Bourg Palette",
        zoneTypeLabel: "Ville",
        regionLabel: "Kanto",
        backgroundImagePath: "assets/backgrounds/pallet-town.png",
        unlocked: true,
        statusLabel: "Ouverte",
        blockedReasonFr: "",
      },
      {
        routeId: "kanto_city_viridian_city",
        routeNameFr: "Jadielle",
        zoneTypeLabel: "Ville",
        regionLabel: "Kanto",
        backgroundImagePath: "assets/backgrounds/viridian-city.png",
        unlocked: false,
        statusLabel: "Verrouillee",
        blockedReasonFr: "3/20 KO requis.",
        lockDetailFr: "Completer la serie de KO.",
        progressionRequirementFr: "Completer la serie de KO.",
        connectionHintFr: "",
        requiresFlagsAll: [],
        requiresFlagsAny: [],
      },
    ],
    selectedLockedDestinationId: null,
    selectedLockedDestination: null,
    navigationDrawerOpen: true,
    ...overrides,
  };
}

function createUiFixture() {
  const { window } = new JSDOM("<!doctype html><html><body></body></html>");
  const documentRef = window.document;
  return {
    ui: createRouteNavigationUi({
      documentRef,
      normalizeUiDisplayText: (value) => String(value || ""),
      formatRouteAccessFlagLabel: (value) => String(value || ""),
    }),
    refs: createRefs(documentRef),
  };
}

test("renderPrimaryNavigation preserves drawer list button DOM when the route list state is unchanged", () => {
  const fixture = createUiFixture();
  const viewModel = createViewModel();

  fixture.ui.renderPrimaryNavigation({ viewModel, refs: fixture.refs });
  const firstCardEl = fixture.refs.routeNavDrawerListEl.querySelector("button.route-nav-destination-card.is-drawer-list");
  assert.ok(firstCardEl);
  assert.equal(firstCardEl.querySelectorAll(".route-nav-zone-preview-image").length, 1);

  fixture.ui.renderPrimaryNavigation({
    viewModel: JSON.parse(JSON.stringify(viewModel)),
    refs: fixture.refs,
  });
  const secondCardEl = fixture.refs.routeNavDrawerListEl.querySelector("button.route-nav-destination-card.is-drawer-list");
  assert.equal(secondCardEl, firstCardEl);
});

test("renderPrimaryNavigation rebuilds drawer list button DOM when the selected locked destination changes", () => {
  const fixture = createUiFixture();
  fixture.ui.renderPrimaryNavigation({
    viewModel: createViewModel(),
    refs: fixture.refs,
  });
  const firstLockedNodeEl = fixture.refs.routeNavDrawerListEl.querySelector('[data-route-id="kanto_city_viridian_city"]');
  assert.ok(firstLockedNodeEl);

  fixture.ui.renderPrimaryNavigation({
    viewModel: createViewModel({
      selectedLockedDestinationId: "kanto_city_viridian_city",
      selectedLockedDestination: {
        routeId: "kanto_city_viridian_city",
        routeNameFr: "Jadielle",
        zoneTypeLabel: "Ville",
        regionLabel: "Kanto",
        unlocked: false,
        statusLabel: "Verrouillee",
        blockedReasonFr: "3/20 KO requis.",
        lockDetailFr: "Completer la serie de KO.",
        progressionRequirementFr: "Completer la serie de KO.",
        connectionHintFr: "",
        requiresFlagsAll: [],
        requiresFlagsAny: [],
      },
    }),
    refs: fixture.refs,
  });
  const secondLockedNodeEl = fixture.refs.routeNavDrawerListEl.querySelector('[data-route-id="kanto_city_viridian_city"]');
  assert.notEqual(secondLockedNodeEl, firstLockedNodeEl);
});

test("buildRouteDestinationCard renders the zone background preview when available", () => {
  const fixture = createUiFixture();
  const cardEl = fixture.ui.buildRouteDestinationCard(createViewModel().destinationCards[0], {
    variant: "map-panel",
  });

  const previewImageEl = cardEl.querySelector(".route-nav-zone-preview-image");
  assert.ok(previewImageEl);
  assert.match(previewImageEl.getAttribute("src") || "", /pallet-town\.png$/);
  assert.equal(cardEl.querySelector(".route-nav-destination-label")?.textContent, "Bourg Palette");
  assert.equal(cardEl.querySelector(".route-nav-destination-meta"), null);
  assert.equal(cardEl.querySelector(".route-nav-destination-status"), null);
  assert.equal(cardEl.querySelector(".route-nav-destination-reason"), null);
});
