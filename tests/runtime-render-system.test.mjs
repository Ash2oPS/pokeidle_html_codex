import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeSpriteOpaqueDrawPlacement,
  createRuntimeRenderSystem,
} from "../systems/ui/runtime-render-system.js";

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

test("getBattleViewportProfile keeps tall smartphone emulation in phone mode", () => {
  const renderSystem = createRenderSystem({
    isLikelySmartphoneBrowser: () => true,
  });

  const profile = renderSystem.getBattleViewportProfile(810, 1620);

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

test("getBattleViewportProfile promotes tall portrait browser test viewports to phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(810, 1620);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, true);
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
  assert.match(source, /packed_simple/);
  assert.match(source, /pixel_curved/);
  assert.match(source, /hero_curved/);
  assert.match(source, /drawLasers\(state\.battle \? state\.battle\.getLasers\(\) : \[\]\);/);
  assert.doesNotMatch(source, /new Function/);
  assert.doesNotMatch(source, /with \(scope\)/);
  assert.doesNotMatch(source, /RUNTIME_RENDER_CHUNK/);
  assert.doesNotMatch(source, /injectRuntimeRenderLaserSupport/);
});

test("runtime render system keeps laser budget independent from laser count and reuses point buffers", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.match(source, /const laserCurvePointBuffer = \[\];/);
  assert.match(source, /const laserRibbonPointBuffer = \[\];/);
  assert.match(source, /const laserMirrorRibbonPointBuffer = \[\];/);
  assert.match(source, /function getLaserRenderBudget\(qualityKey, distance\)/);
  assert.doesNotMatch(source, /safeLaserCount/);
  assert.doesNotMatch(source, /crowdPenalty/);
  assert.doesNotMatch(source, /packedCrowd/);
  assert.doesNotMatch(source, /const activeLaserCount = laserList\.length;/);
});

test("runtime render system owns projectile stamp caches and no longer depends on battle sprite factories", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.match(source, /projectileSpriteAtlasCache = new Map/);
  assert.match(source, /projectileTrailStampCache = new Map/);
  assert.match(source, /getProjectileSpriteStamp/);
  assert.match(source, /getProjectileTrailStamp/);
  assert.doesNotMatch(source, /getProjectileSprite\(/);
});

test("runtime render system draws lasers above combat sprites with a contrast underlay", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  const enemySpriteIndex = source.indexOf("drawPokemonSprite(state.enemy, layout.centerX, layout.centerY, enemySpriteSize, {");
  const teamSpriteIndex = source.indexOf("drawPokemonSprite(member, drawPosition.x, drawPosition.y, drawPosition.size || slot.size, {");
  const laserCallIndex = source.indexOf("drawLasers(state.battle ? state.battle.getLasers() : []);");

  assert.ok(enemySpriteIndex >= 0);
  assert.ok(teamSpriteIndex >= 0);
  assert.ok(laserCallIndex >= 0);
  assert.ok(laserCallIndex > enemySpriteIndex);
  assert.ok(laserCallIndex > teamSpriteIndex);
  assert.match(source, /function drawLaserContrastSegment\(/);
  assert.match(source, /function drawLaserContrastCurve\(/);
  assert.match(source, /ctx\.globalCompositeOperation = "source-over";/);
});

test("runtime render system trims laser visuals with per-end insets", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.match(source, /function getVisibleLaserSegment\(laser\)/);
  assert.match(source, /visualSourceInsetPx/);
  assert.match(source, /visualTargetInsetPx/);
  assert.match(source, /const visibleSegment = getVisibleLaserSegment\(laser\);/);
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

test("computeSpriteOpaqueDrawPlacement keeps tight sprites centered", () => {
  const placement = computeSpriteOpaqueDrawPlacement({
    renderSize: 96,
    sourceWidth: 64,
    sourceHeight: 64,
    opaqueMinX: 0,
    opaqueMinY: 0,
    opaqueWidth: 64,
    opaqueHeight: 64,
  });

  assert.equal(placement.drawX, -48);
  assert.equal(placement.drawY, -48);
  assert.equal(placement.visibleWidth, 96);
  assert.equal(placement.visibleHeight, 96);
  assert.equal(placement.visibleBottomY, 48);
});

test("computeSpriteOpaqueDrawPlacement recenters asymmetric opaque bounds", () => {
  const placement = computeSpriteOpaqueDrawPlacement({
    renderSize: 96,
    sourceWidth: 64,
    sourceHeight: 64,
    opaqueMinX: 8,
    opaqueMinY: 4,
    opaqueWidth: 40,
    opaqueHeight: 48,
  });

  assert.equal(placement.drawX, -42);
  assert.equal(placement.drawY, -42);
  assert.equal(placement.visibleWidth, 60);
  assert.equal(placement.visibleHeight, 72);
  assert.equal(placement.visibleBottomY, 36);
});
