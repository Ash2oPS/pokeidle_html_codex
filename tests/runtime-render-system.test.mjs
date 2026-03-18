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
      isCoarsePointerDevice: overrides.isCoarsePointerDevice ?? (() => false),
      isLikelySmartphoneBrowser: overrides.isLikelySmartphoneBrowser,
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

test("runtime render system materializes the laser renderer without dynamic code injection", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.match(source, /function drawLasers\(/);
  assert.match(source, /function drawPackedLaserBeam\(/);
  assert.match(source, /const packedLaserBeamTextureCache = \{\};/);
  assert.match(source, /drawLasers\(state\.battle \? state\.battle\.getLasers\(\) : \[\]\);/);
  assert.doesNotMatch(source, /new Function/);
  assert.doesNotMatch(source, /with \(scope\)/);
  assert.doesNotMatch(source, /RUNTIME_RENDER_CHUNK/);
  assert.doesNotMatch(source, /injectRuntimeRenderLaserSupport/);
});

test("runtime render system falls back to browser globals for builtins omitted from bindings", () => {
  const renderSystem = createRuntimeRenderSystem({
    bindings: {
      isCoarsePointerDevice: () => false,
    },
  });

  const profile = renderSystem.getBattleViewportProfile(540, 960);

  assert.equal(profile.layoutMode, "mobilePortrait");
  assert.equal(profile.phone, true);
});
