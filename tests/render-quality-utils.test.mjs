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
