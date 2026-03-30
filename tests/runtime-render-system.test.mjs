import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeEvolutionAnimationBeatState,
  computeEvolutionAnimationViewportCenter,
  computeSpriteOpaqueDrawPlacement,
  createRuntimeRenderSystem,
} from "../systems/ui/runtime-render-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeRenderSystemPath = path.resolve(__dirname, "../systems/ui/runtime-render-system.js");
const gameRuntimePath = path.resolve(__dirname, "../game-runtime.js");
const gameplayUiConfigPath = path.resolve(__dirname, "../lib/gameplay-ui-config.js");
const stylesPath = path.resolve(__dirname, "../styles.css");

function createRenderSystem(overrides = {}) {
  return createRuntimeRenderSystem({
    bindings: {
      isCoarsePointerDevice: overrides.isCoarsePointerDevice ?? (() => false),
      isLikelySmartphoneBrowser: overrides.isLikelySmartphoneBrowser,
      state: overrides.state ?? {
        devLayout: {
          settings: {
            allySpriteScale: 1,
            enemySpriteScale: 1,
          },
        },
      },
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

test("runtime render system can override combat VFX with custom asset folders before procedural fallback", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.ok(source.includes('const CUSTOM_VFX_ASSET_ROOT = "assets/vfx-custom";'));
  assert.ok(source.includes("function getCustomProjectileSpriteOverride(typeName, variantIndex = 0)"));
  assert.ok(source.includes("function getCustomProjectileTrailOverride(typeName, trailStampKind = \"\")"));
  assert.ok(source.includes("function getCustomLaserBeamTexture(profile)"));
  assert.ok(source.includes("${CUSTOM_VFX_ASSET_ROOT}/projectiles/${safeType}/variant-"));
  assert.ok(source.includes("${CUSTOM_VFX_ASSET_ROOT}/projectile-trails/${safeType}/stamp"));
  assert.ok(source.includes("${CUSTOM_VFX_ASSET_ROOT}/lasers/${safeType}/beam"));
  assert.ok(source.includes("const customSprite = getCustomProjectileSpriteOverride(profile.type || typeName, safeVariant);"));
  assert.ok(source.includes("const customStamp = getCustomProjectileTrailOverride(profile.type || typeName, profile.trailStampKind);"));
  assert.ok(source.includes("const customPackedBeam = getCustomLaserBeamTexture(profile);"));
  assert.ok(source.includes("if (usingCustomPackedBeam) {"));
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

test("runtime render system suppresses the legacy ball canvas overlay when the topbar summary exists", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.match(source, /topbarBallSummaryVisible/);
  assert.match(source, /#topbar-balls-pill/);
  assert.match(source, /if \(topbarBallSummaryVisible\) \{\s*return;\s*\}/);
});

test("runtime render system draws canvas-owned runtime overlays after the HUD layer", () => {
  const source = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.match(source, /function drawCanvasRuntimeOverlays\(layout\)/);
  assert.match(source, /layout\?\.layoutMode === "desktopLandscape"/);
  assert.match(source, /if \(layout\?\.layoutMode === "mobilePortrait" \|\| layout\?\.viewportProfile\?\.phone\) \{\s*drawCanvasRuntimeMobileShell\(hitboxes\);\s*drawCanvasRuntimeZoneActions\(hitboxes\);\s*drawCanvasRuntimeHoverPopup\(layout\);\s*drawCanvasRuntimeTeamContextMenu\(layout, hitboxes\);\s*drawCanvasRuntimeBallCaptureMenu\(layout, hitboxes\);/s);
  assert.match(source, /drawCanvasRuntimeDesktopShell\(hitboxes\);/);
  assert.match(source, /drawCanvasRuntimeMobileShell\(hitboxes\);/);
  assert.match(source, /drawCanvasRuntimeZoneActions\(hitboxes\);/);
  assert.match(source, /drawCanvasRuntimeHoverPopup\(layout\);/);
  assert.match(source, /drawCanvasRuntimeTeamContextMenu\(layout, hitboxes\);/);
  assert.match(source, /drawCanvasRuntimeBallCaptureMenu\(layout, hitboxes\);/);
  assert.match(source, /state\.ui\.canvasOverlayActionHitboxes = hitboxes;/);
  assert.match(source, /drawBallInventoryOverlay\(layout\);\s*drawCanvasRuntimeOverlays\(layout\);\s*drawVersionOverlay\(\);/);
});

test("runtime render system hides desktop DOM shell owners once canvas shell rendering takes over", () => {
  const stylesSource = fs.readFileSync(stylesPath, "utf8");

  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] \.topbar-balls-pill,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] \.topbar-balls-pill,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] \.ui-topbar \.route-nav-wrap,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] \.ui-topbar \.route-nav-wrap,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] \.resource-strip\.currency-stack,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] \.resource-strip\.currency-stack,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] \.action-dock,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] \.action-dock,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] \.world-ui-layer \.zone-action-btn/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] \.world-ui-layer \.zone-action-btn,/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] #hover-popup\[data-canvas-runtime-owned="true"\],/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] #hover-popup\[data-canvas-runtime-owned="true"\],/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] #team-context-menu\[data-canvas-runtime-owned="true"\],/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] #team-context-menu\[data-canvas-runtime-owned="true"\],/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="desktopLandscape"\] #ball-capture-menu\[data-canvas-runtime-owned="true"\],/);
  assert.match(stylesSource, /#game-capture-root\[data-layout-mode="mobilePortrait"\] #ball-capture-menu\[data-canvas-runtime-owned="true"\]/);
  assert.match(stylesSource, /visibility:\s*hidden !important;/);
  assert.match(stylesSource, /pointer-events:\s*none !important;/);
});

test("runtime shell canvas bindings stay exposed through game runtime getters", () => {
  const gameRuntimeSource = fs.readFileSync(gameRuntimePath, "utf8");

  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.topbarBallsPillEl = \(\) => topbarBallsPillEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.moneyPillEl = \(\) => moneyPillEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.moneyValueEl = \(\) => moneyValueEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.coinsValueEl = \(\) => coinsValueEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.saveBackendValueEl = \(\) => saveBackendValueEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.routeNavPanelEl = \(\) => routeNavPanelEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.routeNavCurrentEl = \(\) => routeNavCurrentEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.routeNavRegionEl = \(\) => routeNavRegionEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.routeNavDrawerToggleButtonEl = \(\) => routeNavDrawerToggleButtonEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.routeNavDrawerToggleCountEl = \(\) => routeNavDrawerToggleCountEl;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.zoneActionButtonsById = \(\) => zoneActionButtonsById;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.canvasOverlayActionHitboxes = \(\) => Array\.isArray\(state\?\.ui\?\.canvasOverlayActionHitboxes\)/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.setMapOpen = \(\) => setMapOpen;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.setShopOpen = \(\) => setShopOpen;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.setGachaOpen = \(\) => setGachaOpen;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.toggleRouteNavDrawer = \(\) => toggleRouteNavDrawer;/);
  assert.match(gameRuntimeSource, /RUNTIME_BINDING_GETTERS\.triggerZoneAction = \(\) => triggerZoneAction;/);
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

test("computeEvolutionAnimationViewportCenter recenters the overlay on the viewport", () => {
  const center = computeEvolutionAnimationViewportCenter(
    {
      centerX: 640,
      centerY: 286,
    },
    {
      width: 1280,
      height: 720,
    },
  );

  assert.deepEqual(center, {
    centerX: 640,
    centerY: 360,
  });
});

test("computeEvolutionAnimationViewportCenter falls back to the combat layout when viewport data is unavailable", () => {
  const center = computeEvolutionAnimationViewportCenter({
    centerX: 412,
    centerY: 244,
  });

  assert.deepEqual(center, {
    centerX: 412,
    centerY: 244,
  });
});

test("computeEvolutionAnimationBeatState accelerates white swap timings before the final reveal", () => {
  const beatState = computeEvolutionAnimationBeatState({
    elapsedMs: 700,
    totalMs: 3600,
    whiteMs: 280,
    flashMs: 360,
    revealMs: 980,
    swapCount: 7,
  });

  assert.equal(beatState.stage, "oscillate");
  assert.equal(beatState.pulseCount, 7);
  assert.equal(beatState.pulseDurationsMs.length, 7);
  assert.ok(beatState.pulseDurationsMs[0] > beatState.pulseDurationsMs[6]);
  assert.ok(beatState.fromWhiteRatio >= 1);
  assert.ok(beatState.toWhiteRatio >= 1);
});

test("computeEvolutionAnimationBeatState ends on a colored evolution reveal with fireworks", () => {
  const beatState = computeEvolutionAnimationBeatState({
    elapsedMs: 3300,
    totalMs: 3600,
    whiteMs: 280,
    flashMs: 360,
    revealMs: 980,
    swapCount: 7,
  });

  assert.equal(beatState.stage, "reveal");
  assert.equal(beatState.dominantSprite, "to");
  assert.equal(beatState.fromAlpha, 0);
  assert.ok(beatState.toWhiteRatio < 1);
  assert.ok(beatState.toScale > 1);
  assert.ok(beatState.fireworkRatio > 0);
});

test("runtime render system removes phone-only sprite multipliers and mobile min floors", () => {
  const renderSystem = createRenderSystem();
  const compactLayout = { viewportProfile: { compact: true, phone: false } };
  const phoneLayout = { viewportProfile: { compact: true, phone: true } };
  const renderSource = fs.readFileSync(runtimeRenderSystemPath, "utf8");

  assert.equal(renderSystem.getTeamSpriteScale(phoneLayout), renderSystem.getTeamSpriteScale(compactLayout));
  assert.equal(renderSystem.getEnemySpriteRenderSize(phoneLayout, 120), renderSystem.getEnemySpriteRenderSize(compactLayout, 120));
  assert.doesNotMatch(renderSource, /TEAM_SPRITE_SCALE_PHONE_MULTIPLIER/);
  assert.doesNotMatch(renderSource, /ENEMY_SPRITE_SIZE_PHONE_MULTIPLIER/);
  assert.doesNotMatch(renderSource, /minRenderSizePx/);
  assert.doesNotMatch(renderSource, /getTeamSpriteMinRenderSize/);
});

test("pokemon sprite render sizing follows source pixels instead of pokemon data scale", () => {
  const gameRuntimeSource = fs.readFileSync(gameRuntimePath, "utf8");
  const gameplayUiConfigSource = fs.readFileSync(gameplayUiConfigPath, "utf8");

  assert.match(gameRuntimeSource, /function getPokemonDataSpriteScale\(entity\)\s*\{\s*void entity;\s*return 1;\s*\}/s);
  assert.match(gameRuntimeSource, /return sourcePixels \/ commonPpu;/);
  assert.match(gameRuntimeSource, /return baseSize \* getPokemonSpriteCommonPpuMultiplier\(source\);/);
  assert.doesNotMatch(gameRuntimeSource, /spriteScaleValue\s*:/);
  assert.doesNotMatch(gameplayUiConfigSource, /POKEMON_DATA_SPRITE_SCALE_MIN/);
  assert.doesNotMatch(gameplayUiConfigSource, /POKEMON_DATA_SPRITE_SCALE_MAX/);
  assert.doesNotMatch(gameplayUiConfigSource, /POKEMON_SPRITE_COMMON_PPU_MULTIPLIER_MIN/);
  assert.doesNotMatch(gameplayUiConfigSource, /POKEMON_SPRITE_COMMON_PPU_MULTIPLIER_MAX/);
});

test("runtime shell metrics stay synchronized between CSS overlays and canvas layout", () => {
  const renderSource = fs.readFileSync(runtimeRenderSystemPath, "utf8");
  const gameRuntimeSource = fs.readFileSync(gameRuntimePath, "utf8");
  const stylesSource = fs.readFileSync(stylesPath, "utf8");

  assert.match(renderSource, /function getRuntimeShellMetricHeight\(/);
  assert.match(renderSource, /--ui-runtime-topbar-height-px/);
  assert.match(renderSource, /--ui-runtime-dock-height-px/);
  assert.match(gameRuntimeSource, /function syncRuntimeShellMetrics\(/);
  assert.match(gameRuntimeSource, /function ensureRuntimeShellMetricsObserver\(/);
  assert.match(gameRuntimeSource, /new ResizeObserver\(/);
  assert.match(stylesSource, /--ui-runtime-topbar-height-px:\s*110px;/);
  assert.match(stylesSource, /--ui-runtime-dock-height-px:\s*92px;/);
  assert.match(stylesSource, /bottom:\s*calc\(\s*var\(--ui-runtime-dock-height-px,\s*92px\)/);
  assert.match(stylesSource, /max-height:\s*min\(\s*78svh,\s*calc\(\s*100dvh\s*-\s*var\(--ui-runtime-topbar-height-px,\s*110px\)/s);
  assert.match(stylesSource, /calc\(var\(--ui-runtime-dock-height-px,\s*92px\)\s*\+\s*28px\)/);
  assert.match(stylesSource, /calc\(env\(safe-area-inset-bottom\)\s*\+\s*var\(--ui-runtime-dock-height-px,\s*92px\)\s*\+\s*4px\)/);
  assert.match(stylesSource, /calc\(var\(--ui-runtime-dock-height-px,\s*92px\)\s*\+\s*env\(safe-area-inset-bottom\)\s*\+\s*40px\)/);
  assert.match(stylesSource, /calc\(var\(--ui-runtime-dock-height-px,\s*92px\)\s*\+\s*env\(safe-area-inset-bottom\)\s*\+\s*44px\)/);
  assert.match(stylesSource, /calc\(env\(safe-area-inset-bottom\)\s*\+\s*var\(--ui-runtime-dock-height-px,\s*92px\)\s*\+\s*20px\)/);
  assert.match(stylesSource, /\.map-modal-card,[\s\S]*?\.shop-modal-card,[\s\S]*?\.dialogue-modal-card,[\s\S]*?\.tutorial-card,[\s\S]*?\.starter-modal-card,[\s\S]*?\.gacha-card,[\s\S]*?max-height:\s*var\(--ui-modal-mobile-max-height-vh,\s*88svh\)/);
  assert.match(stylesSource, /\.boxes-card,[\s\S]*?max-height:\s*var\(--ui-modal-mobile-max-height-vh,\s*88svh\)/);
  assert.doesNotMatch(stylesSource, /\.notification-stack\s*\{[^}]*bottom:\s*calc\(72px\s*\+\s*env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /\.notification-stack\s*\{[^}]*bottom:\s*calc\(84px\s*\+\s*env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /\.notification-stack\s*\{[^}]*bottom:\s*calc\(124px\s*\+\s*env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /@media\s*\(max-width:\s*430px\)\s*\{[^}]*\.notification-stack\s*\{[^}]*bottom:\s*calc\(120px\s*\+\s*env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /\.map-modal-card\s*\{[^}]*max-height:\s*min\(90dvh,\s*920px\)/s);
  assert.doesNotMatch(stylesSource, /\.shop-modal-card\s*\{[^}]*max-height:\s*min\(90dvh,\s*920px\)/s);
  assert.doesNotMatch(stylesSource, /\.boxes-card\s*\{[^}]*max-height:\s*min\(90dvh,\s*920px\)/s);
  assert.doesNotMatch(stylesSource, /\.appearance-card\s*\{[^}]*max-height:\s*min\(90dvh,\s*920px\)/s);
  assert.doesNotMatch(stylesSource, /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.boxes-card\s*\{[^}]*width:\s*calc\(100vw - 4px\)[^}]*max-height:\s*calc\(100dvh - 4px - env\(safe-area-inset-top\) - env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.rename-card\s*\{[^}]*width:\s*calc\(100vw - 4px\)[^}]*max-height:\s*calc\(100dvh - 4px - env\(safe-area-inset-top\) - env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /\.route-nav-modal-card\s*\{[^}]*width:\s*calc\(100vw - 12px\)/s);
  assert.doesNotMatch(stylesSource, /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.shop-modal-card\s*\{[^}]*max-height:\s*calc\(100dvh - 4px - env\(safe-area-inset-top\) - env\(safe-area-inset-bottom\)\)/s);
  assert.doesNotMatch(stylesSource, /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.starter-modal-card\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*max-height:\s*var\(--ui-modal-mobile-max-height-vh,\s*88svh\)/s);
  assert.doesNotMatch(stylesSource, /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.gacha-card\s*\{[^}]*max-height:\s*calc\(100dvh - 12px\)/s);
});

test("computeSpriteOpaqueDrawPlacement preserves uniform pixel density when render size follows source ppu", () => {
  const tinyPlacement = computeSpriteOpaqueDrawPlacement({
    renderSize: 1,
    sourceWidth: 1,
    sourceHeight: 1,
    opaqueMinX: 0,
    opaqueMinY: 0,
    opaqueWidth: 1,
    opaqueHeight: 1,
  });
  const widePlacement = computeSpriteOpaqueDrawPlacement({
    renderSize: 96,
    sourceWidth: 96,
    sourceHeight: 56,
    opaqueMinX: 0,
    opaqueMinY: 0,
    opaqueWidth: 96,
    opaqueHeight: 56,
  });

  assert.equal(tinyPlacement.visibleWidth, 1);
  assert.equal(tinyPlacement.visibleHeight, 1);
  assert.equal(widePlacement.visibleWidth, 96);
  assert.equal(widePlacement.visibleHeight, 56);
});
