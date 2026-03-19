import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_DESIGN,
  GAME_DESIGN_SNAPSHOT,
  getGameDesignConfigSnapshot,
  sanitizeGameDesignConfig,
} from "../lib/game-design-config-runtime.js";
import {
  SHINY_ODDS,
  ULTRA_SHINY_ODDS,
} from "../lib/runtime-version-config.js";
import {
  ATTACK_INTERVAL_MS,
  CAPTURE_CRIT_CHANCE,
  GACHA_SPIN_COST_COINS,
} from "../lib/combat-balance-config.js";
import {
  BOOST_X_DURATION_MS,
  BACKGROUND_PERSIST_DEBOUNCE_MS,
  DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS,
  DESKTOP_BACKGROUND_WATCHDOG_STALL_MS,
  MAX_LEVEL,
  MAX_RESUME_CATCHUP_MS,
  TARGET_FPS,
} from "../lib/gameplay-ui-config.js";
import {
  ONLY_ONE_ENCOUNTER_INTERVAL,
  ROUTE_UNLOCK_DEFEATS,
} from "../lib/game-world-config.js";

test("game design runtime sanitizes invalid values and computes derived fields", () => {
  const sanitized = sanitizeGameDesignConfig({
    rarity: {
      shinyOdds: -5,
      ultraShinyOdds: 1,
    },
    combat: {
      attackIntervalMs: -10,
      boostX: {
        durationMs: "bad",
      },
    },
    capture: {
      critChance: 99,
    },
    progression: {
      maxLevel: 0,
    },
    routeUnlock: {
      onlyOneEncounterInterval: 0,
    },
    metrics: {
      targetFps: 0,
      renderQualityOrder: ["medium", "unknown"],
    },
    ui: {
      shopQuantityPresetValues: ["", "10", "10", "50"],
    },
  });

  assert.equal(sanitized.rarity.shinyOdds, 1);
  assert.equal(sanitized.rarity.ultraShinyOdds, 2);
  assert.equal(sanitized.rarity.nonUltraShinyOddsNumerator, 1);
  assert.equal(sanitized.rarity.nonUltraShinyOddsDenominator, 1);
  assert.equal(sanitized.combat.attackIntervalMs, 1);
  assert.equal(sanitized.combat.boostX.durationMs, GAME_DESIGN.combat.boostX.durationMs);
  assert.equal(sanitized.combat.vfx.projectileAtlasSizePx, GAME_DESIGN.combat.vfx.projectileAtlasSizePx);
  assert.equal(sanitized.combat.vfx.laserPackedSimpleSegmentMaxCount >= 1, true);
  assert.equal(sanitized.capture.critChance, 1);
  assert.equal(sanitized.progression.maxLevel, 1);
  assert.equal(sanitized.routeUnlock.onlyOneEncounterInterval, 1);
  assert.equal(sanitized.routeUnlock.onlyOneEncounterNormalsBeforeSpawn, 0);
  assert.equal(sanitized.metrics.targetFps, 1);
  assert.equal(sanitized.metrics.targetRenderIntervalMs, 1000);
  assert.equal(sanitized.metrics.maxRenderDpr, GAME_DESIGN.metrics.maxRenderDpr);
  assert.equal(sanitized.metrics.maxResumeCatchupMs, GAME_DESIGN.metrics.maxResumeCatchupMs);
  assert.equal(
    sanitized.metrics.desktopBackgroundWatchdogIntervalMs,
    GAME_DESIGN.metrics.desktopBackgroundWatchdogIntervalMs,
  );
  assert.deepEqual(sanitized.metrics.renderQualityOrder, ["medium", "very_low", "low", "high", "ultra"]);
  assert.equal("renderScale" in sanitized.metrics.renderQualityPresets.medium, false);
  assert.equal("maxDpr" in sanitized.metrics.renderQualityPresets.medium, false);
  assert.deepEqual(sanitized.ui.shopQuantityPresetValues, ["10", "50"]);
});

test("game design runtime exposes a compact immutable snapshot", () => {
  const snapshot = getGameDesignConfigSnapshot(GAME_DESIGN);

  assert.equal(snapshot.rarity.shinyOdds, GAME_DESIGN.rarity.shinyOdds);
  assert.equal(snapshot.combat.attackIntervalMs, GAME_DESIGN.combat.attackIntervalMs);
  assert.equal(snapshot.combat.vfx.projectileAtlasSizePx, GAME_DESIGN.combat.vfx.projectileAtlasSizePx);
  assert.equal(snapshot.combat.vfx.laserPackedTextureWidthPx, GAME_DESIGN.combat.vfx.laserPackedTextureWidthPx);
  assert.equal(snapshot.metrics.targetFps, GAME_DESIGN.metrics.targetFps);
  assert.equal(snapshot.metrics.maxResumeCatchupMs, GAME_DESIGN.metrics.maxResumeCatchupMs);
  assert.deepEqual(snapshot, GAME_DESIGN_SNAPSHOT);
  assert.equal(Object.isFrozen(snapshot), true);
});

test("compatibility facades stay aligned with the sanitized design config", () => {
  assert.equal(SHINY_ODDS, GAME_DESIGN.rarity.shinyOdds);
  assert.equal(ULTRA_SHINY_ODDS, GAME_DESIGN.rarity.ultraShinyOdds);
  assert.equal(ATTACK_INTERVAL_MS, GAME_DESIGN.combat.attackIntervalMs);
  assert.equal(CAPTURE_CRIT_CHANCE, GAME_DESIGN.capture.critChance);
  assert.equal(GACHA_SPIN_COST_COINS, GAME_DESIGN.gacha.spinCostCoins);
  assert.equal(BOOST_X_DURATION_MS, GAME_DESIGN.combat.boostX.durationMs);
  assert.equal(MAX_RESUME_CATCHUP_MS, GAME_DESIGN.metrics.maxResumeCatchupMs);
  assert.equal(BACKGROUND_PERSIST_DEBOUNCE_MS, GAME_DESIGN.metrics.backgroundPersistDebounceMs);
  assert.equal(
    DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS,
    GAME_DESIGN.metrics.desktopBackgroundWatchdogIntervalMs,
  );
  assert.equal(
    DESKTOP_BACKGROUND_WATCHDOG_STALL_MS,
    GAME_DESIGN.metrics.desktopBackgroundWatchdogStallMs,
  );
  assert.equal(MAX_LEVEL, GAME_DESIGN.progression.maxLevel);
  assert.equal(TARGET_FPS, GAME_DESIGN.metrics.targetFps);
  assert.equal(ROUTE_UNLOCK_DEFEATS, GAME_DESIGN.routeUnlock.routeUnlockDefeats);
  assert.equal(ONLY_ONE_ENCOUNTER_INTERVAL, GAME_DESIGN.routeUnlock.onlyOneEncounterInterval);
});
