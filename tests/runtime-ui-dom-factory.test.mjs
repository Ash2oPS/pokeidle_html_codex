import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  getMissingRuntimeUiRefKeys,
  mountRuntimeUi,
  RUNTIME_UI_CRITICAL_REF_KEYS,
} from "../systems/ui/runtime-ui-dom-factory.js";

function createDocument() {
  const dom = new JSDOM("<!doctype html><html><body><div id='runtime-ui-root'></div></body></html>");
  return dom.window.document;
}

test("mountRuntimeUi returns stable refs for critical runtime UI nodes", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  const missing = getMissingRuntimeUiRefKeys(refs, RUNTIME_UI_CRITICAL_REF_KEYS);
  assert.deepEqual(missing, []);
  assert.equal(Array.isArray(refs.shopTabButtonEls), true);
  assert.equal(refs.shopTabButtonEls.length >= 3, true);
  assert.equal(Array.isArray(refs.shopQtyPresetButtonEls), true);
  assert.equal(refs.shopQtyPresetButtonEls.length >= 7, true);
  assert.equal(refs.actionDockPokeballVisualEl?.classList?.contains("action-dock-loading-pokeball"), true);
});

test("mountRuntimeUi remounts without duplicating root runtime stage nodes", () => {
  const document = createDocument();

  mountRuntimeUi(document);
  mountRuntimeUi(document);

  assert.equal(document.querySelectorAll("#game-capture-root").length, 1);
  assert.equal(document.querySelectorAll("#game-canvas").length, 1);
  assert.equal(document.querySelectorAll("#notification-stack").length, 1);
});

test("mountRuntimeUi normalizes static French copy and labels", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  assert.equal(refs.canvas?.getAttribute("aria-label"), "Zone de jeu Pok\u00e9mon idle");
  assert.equal(refs.teamContextMenuTitleEl?.textContent?.trim(), "Pok\u00e9mon");
  assert.equal(refs.ballCaptureMenuEl?.getAttribute("aria-label"), "R\u00e9glages de capture par ball");
  assert.equal(refs.moneyValueEl?.closest("#money-pill")?.querySelector(".currency-pill-icon")?.textContent, "\u20bd");
  assert.equal(refs.pokedexButtonEl?.querySelector(".btn-label")?.textContent, "Pok\u00e9dex");
  assert.equal(
    refs.actionDockFullscreenMenuEl?.getAttribute("aria-label"),
    "Menu principal plein \u00e9cran",
  );
});

test("mountRuntimeUi preserves interactive ids and shop tab dataset values", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  assert.equal(refs.exportSaveButtonEl?.id, "export-save-btn");
  assert.equal(refs.importSaveButtonEl?.id, "import-save-btn");
  assert.equal(refs.shopTabEvolutionsButtonEl?.id, "shop-tab-evolutions");
  assert.equal(refs.shopTabEvolutionsButtonEl?.dataset?.shopTab, "evolutions");
  assert.equal(refs.shopTabPokeballsButtonEl?.dataset?.shopTab, "pokeballs");
  assert.equal(refs.shopTabCombatButtonEl?.dataset?.shopTab, "combat");
});

test("mountRuntimeUi exposes the graph navigation HUD contract", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  assert.equal(refs.routeNavPanelEl?.id, "route-nav-panel");
  assert.equal(refs.routeNavZoneTypeEl?.id, "route-nav-zone-type");
  assert.equal(refs.routeNavRegionEl?.id, "route-nav-region");
  assert.equal(refs.routeNavCurrentEl?.id, "route-nav-current");
  assert.equal(refs.routeNavBadgesEl?.id, "route-nav-badges");
  assert.equal(refs.routeNavProgressChipsEl?.id, "route-nav-progress-chips");
  assert.equal(refs.routeNavDestinationsEl?.id, "route-nav-destinations");
  assert.equal(refs.routeNavDrawerToggleButtonEl?.id, "route-nav-drawer-toggle");
  assert.equal(refs.routeNavDrawerToggleCountEl?.id, "route-nav-drawer-toggle-count");
  assert.equal(refs.routeNavDrawerEl?.id, "route-nav-drawer");
  assert.equal(refs.routeNavDrawerListEl?.id, "route-nav-drawer-list");
  assert.equal(refs.routeNavInfoPanelEl?.id, "route-nav-info-panel");
  assert.equal(refs.mapConnectionsInfoPanelEl?.id, "map-connections-info-panel");
});

test("mountRuntimeUi includes new route-navigation labels in French", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  assert.equal(document.querySelector(".route-nav-summary-copy .route-nav-section-label")?.textContent?.trim(), "Zone active");
  assert.equal(document.querySelector(".route-nav-destinations-copy .route-nav-section-label")?.textContent?.trim(), "Sorties connect\u00e9es");
  assert.equal(document.querySelector(".route-nav-destinations-copy .route-nav-section-copy")?.textContent?.trim(), "Choisis ta prochaine zone.");
  assert.equal(refs.routeNavDrawerToggleButtonEl?.querySelector(".route-nav-drawer-toggle-label")?.textContent, "Sorties");
  assert.equal(document.querySelector(".route-nav-drawer-title")?.textContent?.trim(), "Sorties depuis la zone active");
  assert.equal(refs.routeNavDrawerCloseButtonEl?.getAttribute("aria-label"), "Fermer les sorties");
  assert.equal(refs.mapConnectionsInfoPanelEl?.classList.contains("route-nav-info-panel-map"), true);
});

test("mountRuntimeUi exposes collection search inputs for boxes and pokedex", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  assert.equal(refs.boxesSearchInputEl?.id, "boxes-search-input");
  assert.equal(refs.boxesSearchInputEl?.getAttribute("placeholder"), "Nom, surnom ou n\u00b0 Pok\u00e9dex");
  assert.equal(refs.boxesSearchInputEl?.getAttribute("aria-label"), "Rechercher dans les bo\u00eetes");

  assert.equal(refs.pokedexSearchInputEl?.id, "pokedex-search-input");
  assert.equal(refs.pokedexSearchInputEl?.getAttribute("placeholder"), "Nom ou n\u00b0 Pok\u00e9dex");
  assert.equal(refs.pokedexSearchInputEl?.getAttribute("aria-label"), "Rechercher dans le Pok\u00e9dex");
});

test("mountRuntimeUi exposes the dev level-all button contract", () => {
  const document = createDocument();
  const refs = mountRuntimeUi(document);

  assert.equal(refs.devLevelAllButtonEl?.id, "dev-level-all-button");
  assert.equal(refs.devLevelAllButtonEl?.textContent?.trim(), "+1 niv");
  assert.equal(refs.devLevelAllButtonEl?.classList.contains("hidden"), true);
  assert.equal(
    refs.devLevelAllButtonEl?.getAttribute("aria-label"),
    "Faire gagner un niveau a tous les Pokemon de l'equipe et des boites",
  );
});
