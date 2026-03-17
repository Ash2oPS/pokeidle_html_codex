import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRuntimeRenderSystem } from "../systems/ui/runtime-render-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeRenderSystemPath = path.resolve(__dirname, "../systems/ui/runtime-render-system.js");

function createRenderSystem(overrides = {}) {
  return createRuntimeRenderSystem({
    bindings: {
      Math,
      Number,
    },
    resolveBinding(name) {
      if (name === "isCoarsePointerDevice") {
        return overrides.isCoarsePointerDevice ?? (() => false);
      }
      if (name === "isLikelySmartphoneBrowser") {
        return overrides.isLikelySmartphoneBrowser;
      }
      return undefined;
    },
  });
}

test("getBattleViewportProfile keeps narrow portrait viewports in phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(540, 960);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, true);
  assert.equal(profile.layoutMode, "mobilePortrait");
});

test("getBattleViewportProfile does not classify portrait tablets as phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(768, 1024);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, false);
  assert.equal(profile.portrait, true);
  assert.equal(profile.layoutMode, "mobilePortrait");
});

test("getBattleViewportProfile restores phone mode for modern smartphone browser widths", () => {
  const renderSystem = createRenderSystem({
    isLikelySmartphoneBrowser: () => true,
  });

  const profile = renderSystem.getBattleViewportProfile(600, 1200);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, true);
  assert.equal(profile.layoutMode, "mobilePortrait");
});

test("getBattleViewportProfile keeps landscape phones in phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(844, 390);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, false);
  assert.equal(profile.layoutMode, "mobilePortrait");
});

test("getProductLayoutMode keeps wide desktop landscapes in desktop mode", () => {
  const renderSystem = createRenderSystem();

  assert.equal(renderSystem.getProductLayoutMode(1366, 768), "desktopLandscape");
  assert.equal(renderSystem.getProductLayoutMode(390, 844), "mobilePortrait");
});

test("drawPokemonSprite fallback no longer slices nameFr directly when sprites are missing", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.ok(source.includes("fallbackInitial"));
  assert.doesNotMatch(source, /entity\\.nameFr\\.slice\\(0,\\s*1\\)/);
});
