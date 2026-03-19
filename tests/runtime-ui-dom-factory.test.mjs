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

  assert.equal(refs.shopTabEvolutionsButtonEl?.id, "shop-tab-evolutions");
  assert.equal(refs.shopTabEvolutionsButtonEl?.dataset?.shopTab, "evolutions");
  assert.equal(refs.shopTabPokeballsButtonEl?.dataset?.shopTab, "pokeballs");
  assert.equal(refs.shopTabCombatButtonEl?.dataset?.shopTab, "combat");
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
