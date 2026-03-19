import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createUiTextNormalizationRuntime } from "../lib/ui-text-normalization-runtime.js";

function createDom() {
  return new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
}

test("ui text normalization runtime normalizes initial subtree text and attributes", () => {
  const dom = createDom();
  const document = dom.window.document;
  const rootEl = document.getElementById("root");

  rootEl.innerHTML = `
    <button aria-label="Reglages Pokemon">Pokemon</button>
    <p>Route precedente | zones debloquees</p>
    <input placeholder="Nom du Pokemon" />
  `;

  const runtime = createUiTextNormalizationRuntime({
    rootEl,
    MutationObserverCtor: dom.window.MutationObserver,
  });
  runtime.start();

  assert.equal(rootEl.querySelector("button")?.getAttribute("aria-label"), "R\u00e9glages Pok\u00e9mon");
  assert.equal(rootEl.querySelector("button")?.textContent, "Pok\u00e9mon");
  assert.equal(rootEl.querySelector("p")?.textContent, "Route pr\u00e9c\u00e9dente | zones d\u00e9bloqu\u00e9es");
  assert.equal(rootEl.querySelector("input")?.getAttribute("placeholder"), "Nom du Pok\u00e9mon");
});

test("ui text normalization runtime repairs dynamic DOM updates", async () => {
  const dom = createDom();
  const document = dom.window.document;
  const rootEl = document.getElementById("root");

  const runtime = createUiTextNormalizationRuntime({
    rootEl,
    MutationObserverCtor: dom.window.MutationObserver,
  });
  runtime.start();

  const paragraph = document.createElement("p");
  paragraph.textContent = "Aucun Pokemon capture pour le moment.";
  paragraph.setAttribute("title", "Bientot disponible");
  rootEl.appendChild(paragraph);

  await Promise.resolve();

  assert.equal(paragraph.textContent, "Aucun Pok\u00e9mon captur\u00e9 pour le moment.");
  assert.equal(paragraph.getAttribute("title"), "Bient\u00f4t disponible");
});

test("ui text normalization runtime leaves wiring attributes untouched", () => {
  const dom = createDom();
  const document = dom.window.document;
  const rootEl = document.getElementById("root");

  rootEl.innerHTML = `
    <button id="shop-tab-evolutions" data-shop-tab="evolutions" aria-label="Evolution Pokemon">
      Evolutions
    </button>
  `;

  const runtime = createUiTextNormalizationRuntime({
    rootEl,
    MutationObserverCtor: dom.window.MutationObserver,
  });
  runtime.start();

  const button = rootEl.querySelector("button");
  assert.equal(button?.id, "shop-tab-evolutions");
  assert.equal(button?.getAttribute("data-shop-tab"), "evolutions");
  assert.equal(button?.getAttribute("aria-label"), "\u00c9volution Pok\u00e9mon");
  assert.equal(button?.textContent?.trim(), "\u00c9volutions");
});
