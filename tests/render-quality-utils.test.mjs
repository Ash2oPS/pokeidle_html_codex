import test from "node:test";
import assert from "node:assert/strict";

import { createRenderQualityUtils } from "../lib/render-quality-utils.js";

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
  assert.deepEqual(fireTrail.accent, [255, 217, 146]);

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
