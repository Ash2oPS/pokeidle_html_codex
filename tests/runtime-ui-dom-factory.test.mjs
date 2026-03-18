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
