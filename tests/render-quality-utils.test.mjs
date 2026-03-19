import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRenderQualityUtils } from "../lib/render-quality-utils.js";
import {
  RENDER_QUALITY_PRESETS,
  TARGET_RENDER_INTERVAL_MS,
} from "../lib/gameplay-ui-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gameRuntimePath = path.resolve(__dirname, "../game-runtime.js");

test("createRenderQualityUtils exposes projectile trail type VFX profiles", () => {
  const state = {
    performance: {
      quality: "medium",
    },
  };

  const utils = createRenderQualityUtils({
    state,
    renderQualityOrder: ["very_low", "low", "medium", "high"],
    renderQualityPresets: {
      medium: {
        renderFrameIntervalMs: 16,
        ambientOverlayEnabled: true,
        celebrationParticles: true,
      },
      low: {
        renderFrameIntervalMs: 20,
      },
    },
    projectileVisualProfile: {
      trailEnabled: true,
      trailMaxPoints: 4,
    },
    projectileTrailMaxPoints: 4,
    projectileTrailPointLifetimeMs: 160,
    targetFrameMs: 16,
    debugForceUltraShinyAllPokemon: false,
    perfShortEmaSmoothing: 0.2,
    perfLongEmaSmoothing: 0.08,
    perfCpuEmaSmoothing: 0.18,
    perfRenderEmaSmoothing: 0.18,
    perfSwitchCooldownMs: 1400,
    perfDowngradeStreak: 4,
    perfUpgradeStreak: 8,
    perfSlowFrameMarginMs: 2,
    perfVerySlowFrameMarginMs: 7,
    perfUpgradeHeadroomMs: 1.1,
    resizeCanvas: () => {},
  });

  const fireTrail = utils.getProjectileTrailTypeVfxProfile("fire");
  assert.equal(fireTrail.mode, "ember");
  assert.equal(fireTrail.spacingPx, 6.1);
  assert.deepEqual(fireTrail.accent, [255, 244, 196]);

  const defaultTrail = utils.getProjectileTrailTypeVfxProfile("mystery_type");
  assert.equal(defaultTrail.mode, "streak");
  assert.equal(defaultTrail.spacingPx, 7.8);
});

function createRenderQualityFixture(state, isHidden) {
  return createRenderQualityUtils({
    isHidden,
    state,
    renderQualityOrder: ["very_low", "low", "medium", "high"],
    renderQualityPresets: {
      medium: {
        renderFrameIntervalMs: 16,
        ambientOverlayEnabled: true,
        celebrationParticles: true,
      },
      low: {
        renderFrameIntervalMs: 20,
      },
    },
    projectileVisualProfile: {
      trailEnabled: true,
      trailMaxPoints: 4,
    },
    projectileTrailMaxPoints: 4,
    projectileTrailPointLifetimeMs: 160,
    targetFrameMs: 16,
    debugForceUltraShinyAllPokemon: false,
    perfShortEmaSmoothing: 0.2,
    perfLongEmaSmoothing: 0.08,
    perfCpuEmaSmoothing: 0.18,
    perfRenderEmaSmoothing: 0.18,
    perfSwitchCooldownMs: 1400,
    perfDowngradeStreak: 4,
    perfUpgradeStreak: 8,
    perfSlowFrameMarginMs: 2,
    perfVerySlowFrameMarginMs: 7,
    perfUpgradeHeadroomMs: 1.1,
    resizeCanvas: () => {},
  });
}

function createPerfState() {
  return {
    pendingSimMs: 400,
    performance: {
      quality: "medium",
      targetFrameMs: 16,
      shortFrameMsEma: 16,
      longFrameMsEma: 16,
      cpuFrameMsEma: 16,
      renderFrameMsEma: 16,
      autoAdjustEnabled: false,
      maxAutomaticQualityRank: 2,
      switchCooldownMs: 0,
      slowFrameStreak: 0,
      fastFrameStreak: 0,
    },
  };
}

test("createRenderQualityUtils honors the injected hidden reader for backlog pressure", () => {
  const visibleState = createPerfState();
  const hiddenState = createPerfState();
  const visibleUtils = createRenderQualityFixture(visibleState, () => false);
  const hiddenUtils = createRenderQualityFixture(hiddenState, () => true);

  visibleUtils.updateRenderQualityFromFrame(16, 4, 4);
  hiddenUtils.updateRenderQualityFromFrame(16, 4, 4);

  assert.ok(visibleState.performance.slowFrameStreak > 0);
  assert.ok(hiddenState.performance.fastFrameStreak > 0);
});

test("createRenderQualityUtils keeps runtime quality static when auto adjustment is disabled", () => {
  const state = createPerfState();
  state.performance.quality = "low";
  state.performance.maxAutomaticQualityRank = 3;
  state.performance.fastFrameStreak = 8;
  state.performance.cpuFrameMsEma = 4;
  state.performance.shortFrameMsEma = 10;
  state.performance.longFrameMsEma = 10;

  const utils = createRenderQualityFixture(state, () => false);

  assert.equal(utils.getMaxAutomaticRenderQualityRank(), 3);
  utils.updateRenderQualityFromFrame(16, 4, 4);
  assert.equal(state.performance.quality, "low");
});

test("runtime render quality presets slow the render loop on low-end tiers", () => {
  assert.equal(RENDER_QUALITY_PRESETS.low.renderFrameIntervalMs > TARGET_RENDER_INTERVAL_MS, true);
  assert.equal(RENDER_QUALITY_PRESETS.very_low.renderFrameIntervalMs > RENDER_QUALITY_PRESETS.low.renderFrameIntervalMs, true);
});

test("runtime resizeCanvas keeps the internal render scale locked to x1", () => {
  const source = fs.readFileSync(gameRuntimePath, "utf8");

  assert.match(source, /const deviceDpr = clamp\(Math\.max\(1, window\.devicePixelRatio \|\| 1\), 1, MAX_RENDER_DPR\);/);
  assert.match(source, /const renderScale = 1;/);
  assert.match(source, /const targetDpr = deviceDpr;/);
  assert.doesNotMatch(source, /quality\.maxDpr/);
  assert.doesNotMatch(source, /quality\.renderScale/);
  assert.doesNotMatch(source, /function syncDynamicLaserPerformanceProfile\(\)/);
  assert.doesNotMatch(source, /function getLaserCrowdRenderScalePenalty\(\)/);
  assert.doesNotMatch(source, /syncDynamicLaserPerformanceProfile\(\);/);
  assert.doesNotMatch(source, /syncDynamicRenderScalePenalty\(\);/);
});
