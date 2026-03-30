import { GAME_DESIGN_CONFIG } from "../game-design-config.js";
import { clamp } from "./number-utils.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}

function readSection(source, key, fallback = {}) {
  return isPlainObject(source?.[key]) ? source[key] : fallback;
}

function readNumber(value, fallback, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const fallbackNumber = Number(fallback);
  let numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    numeric = Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
  }
  if (integer) {
    numeric = Math.floor(numeric);
  }
  return clamp(numeric, min, max);
}

function readString(value, fallback, { allowedValues = null } = {}) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    return fallback;
  }
  if (allowedValues && !allowedValues.has(normalized)) {
    return fallback;
  }
  return normalized;
}

function readBoolean(value, fallback) {
  return typeof value === "boolean" ? value : Boolean(fallback);
}

function readStringArray(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  const deduped = [];
  const seen = new Set();
  for (const entry of source) {
    const normalized = typeof entry === "string" ? entry.trim() : "";
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(normalized);
  }
  return deduped.length > 0 ? deduped : fallback.slice();
}

function sanitizeNumberRecord(source, fallback, options = {}) {
  const sanitized = {};
  const base = isPlainObject(source) ? source : {};
  for (const key of Object.keys(fallback || {})) {
    sanitized[key] = readNumber(base[key], fallback[key], options);
  }
  return sanitized;
}

function sanitizeProjectileVisualProfile(source, fallback) {
  const section = isPlainObject(source) ? source : {};
  return {
    trailEnabled: readBoolean(section.trailEnabled, fallback.trailEnabled),
    trailMaxPoints: readNumber(section.trailMaxPoints, fallback.trailMaxPoints, { min: 1, max: 32, integer: true }),
    trailStride: readNumber(section.trailStride, fallback.trailStride, { min: 1, max: 16, integer: true }),
    trailGlow: readBoolean(section.trailGlow, fallback.trailGlow),
    streak: readBoolean(section.streak, fallback.streak),
    aura: readBoolean(section.aura, fallback.aura),
    auraScale: readNumber(section.auraScale, fallback.auraScale, { min: 0.1, max: 4 }),
    spriteDetail: readBoolean(section.spriteDetail, fallback.spriteDetail),
  };
}

function sanitizeCombatVfxConfig(source, fallback) {
  const section = isPlainObject(source) ? source : {};
  return {
    projectileAtlasSizePx: readNumber(section.projectileAtlasSizePx, fallback.projectileAtlasSizePx, {
      min: 8,
      max: 256,
      integer: true,
    }),
    projectileTrailStampSizePx: readNumber(section.projectileTrailStampSizePx, fallback.projectileTrailStampSizePx, {
      min: 4,
      max: 128,
      integer: true,
    }),
    projectileVariantCount: readNumber(section.projectileVariantCount, fallback.projectileVariantCount, {
      min: 1,
      max: 8,
      integer: true,
    }),
    pixelSnapStepPx: readNumber(section.pixelSnapStepPx, fallback.pixelSnapStepPx, {
      min: 1,
      max: 8,
      integer: true,
    }),
    laserPackedTextureWidthPx: readNumber(section.laserPackedTextureWidthPx, fallback.laserPackedTextureWidthPx, {
      min: 16,
      max: 512,
      integer: true,
    }),
    laserPackedTextureHeightPx: readNumber(section.laserPackedTextureHeightPx, fallback.laserPackedTextureHeightPx, {
      min: 8,
      max: 256,
      integer: true,
    }),
    laserDistanceNearPx: readNumber(section.laserDistanceNearPx, fallback.laserDistanceNearPx, {
      min: 1,
      max: 4000,
      integer: true,
    }),
    laserDistanceMidPx: readNumber(section.laserDistanceMidPx, fallback.laserDistanceMidPx, {
      min: 1,
      max: 4000,
      integer: true,
    }),
    laserDistanceFarPx: readNumber(section.laserDistanceFarPx, fallback.laserDistanceFarPx, {
      min: 1,
      max: 4000,
      integer: true,
    }),
    laserPackedSimpleSegmentMaxCount: readNumber(
      section.laserPackedSimpleSegmentMaxCount,
      fallback.laserPackedSimpleSegmentMaxCount,
      { min: 1, max: 64, integer: true },
    ),
    laserPixelCurvedSegmentMaxCount: readNumber(
      section.laserPixelCurvedSegmentMaxCount,
      fallback.laserPixelCurvedSegmentMaxCount,
      { min: 1, max: 64, integer: true },
    ),
    laserHeroCurvedSegmentMaxCount: readNumber(
      section.laserHeroCurvedSegmentMaxCount,
      fallback.laserHeroCurvedSegmentMaxCount,
      { min: 1, max: 64, integer: true },
    ),
    laserPackedSimpleParticleMaxCount: readNumber(
      section.laserPackedSimpleParticleMaxCount,
      fallback.laserPackedSimpleParticleMaxCount,
      { min: 0, max: 64, integer: true },
    ),
    laserPixelCurvedParticleMaxCount: readNumber(
      section.laserPixelCurvedParticleMaxCount,
      fallback.laserPixelCurvedParticleMaxCount,
      { min: 0, max: 64, integer: true },
    ),
    laserHeroCurvedParticleMaxCount: readNumber(
      section.laserHeroCurvedParticleMaxCount,
      fallback.laserHeroCurvedParticleMaxCount,
      { min: 0, max: 64, integer: true },
    ),
    laserPackedSimpleWidthMultiplier: readNumber(
      section.laserPackedSimpleWidthMultiplier,
      fallback.laserPackedSimpleWidthMultiplier,
      { min: 0.2, max: 4 },
    ),
    laserPixelCurvedWidthMultiplier: readNumber(
      section.laserPixelCurvedWidthMultiplier,
      fallback.laserPixelCurvedWidthMultiplier,
      { min: 0.2, max: 4 },
    ),
    laserHeroCurvedWidthMultiplier: readNumber(
      section.laserHeroCurvedWidthMultiplier,
      fallback.laserHeroCurvedWidthMultiplier,
      { min: 0.2, max: 4 },
    ),
    laserGlowAlpha: readNumber(section.laserGlowAlpha, fallback.laserGlowAlpha, { min: 0, max: 1 }),
    projectileGlowAlpha: readNumber(section.projectileGlowAlpha, fallback.projectileGlowAlpha, { min: 0, max: 1 }),
  };
}

function sanitizeRenderQualityOrder(sourceOrder, fallbackOrder, knownKeys) {
  const allowed = new Set(knownKeys);
  const requested = readStringArray(sourceOrder, fallbackOrder);
  const filtered = requested.filter((entry) => allowed.has(entry));
  const ordered = filtered.length > 0 ? filtered : fallbackOrder.slice();
  for (const key of fallbackOrder) {
    if (allowed.has(key) && !ordered.includes(key)) {
      ordered.push(key);
    }
  }
  return ordered;
}

function sanitizeRenderQualityPreset(source, fallback, targetRenderIntervalMs) {
  const preset = isPlainObject(source) ? source : {};
  return {
    renderFrameIntervalMs: readNumber(
      preset.renderFrameIntervalMs,
      fallback.renderFrameIntervalMs ?? targetRenderIntervalMs,
      { min: 1, max: 1000, integer: true },
    ),
    foregroundSimBudgetMs: readNumber(preset.foregroundSimBudgetMs, fallback.foregroundSimBudgetMs, {
      min: 1,
      max: 1000,
      integer: true,
    }),
    environmentParticleScale: readNumber(preset.environmentParticleScale, fallback.environmentParticleScale, {
      min: 0,
      max: 10,
    }),
    environmentUpdateIntervalMult: readNumber(
      preset.environmentUpdateIntervalMult,
      fallback.environmentUpdateIntervalMult,
      { min: 0.1, max: 10 },
    ),
    fogLayerCount: readNumber(preset.fogLayerCount, fallback.fogLayerCount, { min: 0, max: 8, integer: true }),
    ambientOverlayEnabled: readBoolean(preset.ambientOverlayEnabled, fallback.ambientOverlayEnabled),
    celebrationParticles: readBoolean(preset.celebrationParticles, fallback.celebrationParticles),
    enemyHitGlow: readBoolean(preset.enemyHitGlow, fallback.enemyHitGlow),
    levelUpParticleStride: readNumber(preset.levelUpParticleStride, fallback.levelUpParticleStride, {
      min: 1,
      max: 32,
      integer: true,
    }),
    lightningGlow: readBoolean(preset.lightningGlow, fallback.lightningGlow),
    vignette: readBoolean(preset.vignette, fallback.vignette),
  };
}

export function sanitizeGameDesignConfig(rawConfig = GAME_DESIGN_CONFIG) {
  const raw = isPlainObject(rawConfig) ? rawConfig : {};
  const defaults = GAME_DESIGN_CONFIG;

  const raritySource = readSection(raw, "rarity", defaults.rarity);
  const defaultRarity = defaults.rarity;
  const shinyOdds = readNumber(raritySource.shinyOdds, defaultRarity.shinyOdds, {
    min: 1,
    max: 1_000_000_000,
    integer: true,
  });
  const ultraShinyOdds = Math.max(
    shinyOdds + 1,
    readNumber(raritySource.ultraShinyOdds, defaultRarity.ultraShinyOdds, {
      min: 2,
      max: 1_000_000_000,
      integer: true,
    }),
  );

  const combatSource = readSection(raw, "combat", defaults.combat);
  const defaultCombat = defaults.combat;
  const combatTimingsSource = readSection(combatSource, "timings", defaultCombat.timings);
  const combatProjectileSource = readSection(combatSource, "projectile", defaultCombat.projectile);
  const combatLaserSource = readSection(combatSource, "laser", defaultCombat.laser);
  const combatFloatingTextSource = readSection(combatSource, "floatingText", defaultCombat.floatingText);
  const combatTalentsSource = readSection(combatSource, "talents", defaultCombat.talents);
  const combatBoostXSource = readSection(combatSource, "boostX", defaultCombat.boostX);

  const captureSource = readSection(raw, "capture", defaults.capture);
  const progressionSource = readSection(raw, "progression", defaults.progression);
  const economySource = readSection(raw, "economy", defaults.economy);
  const routeUnlockSource = readSection(raw, "routeUnlock", defaults.routeUnlock);
  const trainerBattleSource = readSection(raw, "trainerBattle", defaults.trainerBattle);
  const gachaSource = readSection(raw, "gacha", defaults.gacha);
  const uiSource = readSection(raw, "ui", defaults.ui);
  const metricsSource = readSection(raw, "metrics", defaults.metrics);
  const defaultMetrics = defaults.metrics;

  const targetFps = readNumber(metricsSource.targetFps, defaultMetrics.targetFps, {
    min: 1,
    max: 240,
    integer: true,
  });
  const targetFrameMs = 1000 / targetFps;
  const targetRenderIntervalMs = Math.max(1, Math.round(targetFrameMs));

  const knownRenderQualityKeys = Object.keys(defaultMetrics.renderQualityPresets || {});
  const renderQualityOrder = sanitizeRenderQualityOrder(
    metricsSource.renderQualityOrder,
    defaultMetrics.renderQualityOrder,
    knownRenderQualityKeys,
  );
  const renderQualityPresets = {};
  const rawPresets = isPlainObject(metricsSource.renderQualityPresets) ? metricsSource.renderQualityPresets : {};
  for (const key of knownRenderQualityKeys) {
    renderQualityPresets[key] = sanitizeRenderQualityPreset(
      rawPresets[key],
      defaultMetrics.renderQualityPresets[key],
      targetRenderIntervalMs,
    );
  }

  const gachaSpinDurationMs = readNumber(gachaSource.spinDurationMs, defaults.gacha.spinDurationMs, {
    min: 200,
    max: 120000,
    integer: true,
  });
  const gachaBatchSpinDurationMs = readNumber(gachaSource.batchSpinDurationMs, defaults.gacha.batchSpinDurationMs, {
    min: 200,
    max: 120000,
    integer: true,
  });
  const gachaSpinFinalSnapDurationMs = readNumber(
    gachaSource.spinFinalSnapDurationMs,
    defaults.gacha.spinFinalSnapDurationMs,
    { min: 50, max: 10000, integer: true },
  );
  const onlyOneEncounterInterval = readNumber(
    routeUnlockSource.onlyOneEncounterInterval,
    defaults.routeUnlock.onlyOneEncounterInterval,
    { min: 1, max: 100000, integer: true },
  );
  const shopQuantityPresetValues = readStringArray(
    uiSource.shopQuantityPresetValues,
    defaults.ui.shopQuantityPresetValues,
  );
  const hudSource = isPlainObject(uiSource.hud) ? uiSource.hud : {};
  const defaultHud = isPlainObject(defaults.ui.hud) ? defaults.ui.hud : {};
  const modalSource = isPlainObject(uiSource.modal) ? uiSource.modal : {};
  const defaultModal = isPlainObject(defaults.ui.modal) ? defaults.ui.modal : {};
  const actionMenuSource = isPlainObject(uiSource.actionMenu) ? uiSource.actionMenu : {};
  const defaultActionMenu = isPlainObject(defaults.ui.actionMenu) ? defaults.ui.actionMenu : {};
  const notificationSource = isPlainObject(uiSource.notification) ? uiSource.notification : {};
  const defaultNotification = isPlainObject(defaults.ui.notification) ? defaults.ui.notification : {};
  const collectionLayoutSource = isPlainObject(uiSource.collectionLayout) ? uiSource.collectionLayout : {};
  const defaultCollectionLayout = isPlainObject(defaults.ui.collectionLayout) ? defaults.ui.collectionLayout : {};
  const mobileSafeAreaSource = isPlainObject(uiSource.mobileSafeArea) ? uiSource.mobileSafeArea : {};
  const defaultMobileSafeArea = isPlainObject(defaults.ui.mobileSafeArea) ? defaults.ui.mobileSafeArea : {};

  const sanitized = {
    rarity: {
      shinyOdds,
      ultraShinyOdds,
      nonUltraShinyOddsNumerator: Math.max(0, ultraShinyOdds - shinyOdds),
      nonUltraShinyOddsDenominator: Math.max(1, shinyOdds * Math.max(1, ultraShinyOdds - 1)),
      ultraShinyHueCycleMs: readNumber(
        raritySource.ultraShinyHueCycleMs,
        defaultRarity.ultraShinyHueCycleMs,
        { min: 100, max: 120000, integer: true },
      ),
      ultraShinyScintillationPeriodMs: readNumber(
        raritySource.ultraShinyScintillationPeriodMs,
        defaultRarity.ultraShinyScintillationPeriodMs,
        { min: 50, max: 120000, integer: true },
      ),
      ultraShinyScintillationFlashMs: readNumber(
        raritySource.ultraShinyScintillationFlashMs,
        defaultRarity.ultraShinyScintillationFlashMs,
        { min: 10, max: 120000, integer: true },
      ),
      debugForceUltraShinyAllPokemon: readBoolean(
        raritySource.debugForceUltraShinyAllPokemon,
        defaultRarity.debugForceUltraShinyAllPokemon,
      ),
    },
    combat: {
      baseStepMs: readNumber(combatSource.baseStepMs, defaultCombat.baseStepMs, { min: 1, max: 1000 }),
      starterLevel: readNumber(combatSource.starterLevel, defaultCombat.starterLevel, {
        min: 1,
        max: 1000,
        integer: true,
      }),
      attackIntervalMs: readNumber(combatSource.attackIntervalMs, defaultCombat.attackIntervalMs, {
        min: 1,
        max: 120000,
        integer: true,
      }),
      attackCritChance: readNumber(combatSource.attackCritChance, defaultCombat.attackCritChance, { min: 0, max: 1 }),
      attackMissChance: readNumber(combatSource.attackMissChance, defaultCombat.attackMissChance, { min: 0, max: 1 }),
      attackCritMultiplier: readNumber(combatSource.attackCritMultiplier, defaultCombat.attackCritMultiplier, {
        min: 1,
        max: 100,
      }),
      damageScale: readNumber(combatSource.damageScale, defaultCombat.damageScale, { min: 0.01, max: 1000 }),
      damageLevelProgressionExponent: readNumber(
        combatSource.damageLevelProgressionExponent,
        defaultCombat.damageLevelProgressionExponent,
        { min: 0.01, max: 10 },
      ),
      moneyCounterLerpMs: readNumber(combatSource.moneyCounterLerpMs, defaultCombat.moneyCounterLerpMs, {
        min: 1,
        max: 120000,
        integer: true,
      }),
      moneyCounterPulseMs: readNumber(combatSource.moneyCounterPulseMs, defaultCombat.moneyCounterPulseMs, {
        min: 1,
        max: 120000,
        integer: true,
      }),
      boostX: {
        durationMs: readNumber(combatBoostXSource.durationMs, defaultCombat.boostX.durationMs, {
          min: 1,
          max: 1200000,
          integer: true,
        }),
        attackIntervalMultiplier: readNumber(
          combatBoostXSource.attackIntervalMultiplier,
          defaultCombat.boostX.attackIntervalMultiplier,
          { min: 0.01, max: 100 },
        ),
      },
      projectile: {
        speedPxPerSecond: readNumber(
          combatProjectileSource.speedPxPerSecond,
          defaultCombat.projectile.speedPxPerSecond,
          { min: 1, max: 100000 },
        ),
        tweenDurationMinMs: readNumber(
          combatProjectileSource.tweenDurationMinMs,
          defaultCombat.projectile.tweenDurationMinMs,
          { min: 1, max: 120000, integer: true },
        ),
        tweenDurationMaxMs: readNumber(
          combatProjectileSource.tweenDurationMaxMs,
          defaultCombat.projectile.tweenDurationMaxMs,
          { min: 1, max: 120000, integer: true },
        ),
        tweenArcBasePx: readNumber(combatProjectileSource.tweenArcBasePx, defaultCombat.projectile.tweenArcBasePx, {
          min: 0,
          max: 10000,
        }),
        tweenArcRandomPx: readNumber(
          combatProjectileSource.tweenArcRandomPx,
          defaultCombat.projectile.tweenArcRandomPx,
          { min: 0, max: 10000 },
        ),
        spritePx: readNumber(combatProjectileSource.spritePx, defaultCombat.projectile.spritePx, {
          min: 1,
          max: 10000,
          integer: true,
        }),
        trailPointLifetimeMs: readNumber(
          combatProjectileSource.trailPointLifetimeMs,
          defaultCombat.projectile.trailPointLifetimeMs,
          { min: 1, max: 120000, integer: true },
        ),
        trailMaxPoints: readNumber(combatProjectileSource.trailMaxPoints, defaultCombat.projectile.trailMaxPoints, {
          min: 1,
          max: 128,
          integer: true,
        }),
        trailPointBaseSpacingPx: readNumber(
          combatProjectileSource.trailPointBaseSpacingPx,
          defaultCombat.projectile.trailPointBaseSpacingPx,
          { min: 0.1, max: 10000 },
        ),
        trailPointMinSpacingPx: readNumber(
          combatProjectileSource.trailPointMinSpacingPx,
          defaultCombat.projectile.trailPointMinSpacingPx,
          { min: 0.1, max: 10000 },
        ),
        trailPointMaxSpacingPx: readNumber(
          combatProjectileSource.trailPointMaxSpacingPx,
          defaultCombat.projectile.trailPointMaxSpacingPx,
          { min: 0.1, max: 10000 },
        ),
        visualProfile: sanitizeProjectileVisualProfile(
          combatProjectileSource.visualProfile,
          defaultCombat.projectile.visualProfile,
        ),
      },
      laser: {
        tickIntervalMultiplier: readNumber(
          combatLaserSource.tickIntervalMultiplier,
          defaultCombat.laser.tickIntervalMultiplier,
          { min: 0.01, max: 100 },
        ),
        tickJitterMs: readNumber(
          combatLaserSource.tickJitterMs,
          defaultCombat.laser.tickJitterMs,
          { min: 0, max: 120000, integer: true },
        ),
        damagePerTickDivisor: readNumber(
          combatLaserSource.damagePerTickDivisor,
          defaultCombat.laser.damagePerTickDivisor,
          { min: 1, max: 10000, integer: true },
        ),
      },
      vfx: sanitizeCombatVfxConfig(combatSource.vfx, defaultCombat.vfx),
      timings: {
        koRespawnDelayMs: readNumber(combatTimingsSource.koRespawnDelayMs, defaultCombat.timings.koRespawnDelayMs, {
          min: 0,
          max: 120000,
          integer: true,
        }),
        koAnimationDurationMs: readNumber(
          combatTimingsSource.koAnimationDurationMs,
          defaultCombat.timings.koAnimationDurationMs,
          { min: 0, max: 120000, integer: true },
        ),
        enemyEnterAnimDurationMs: readNumber(
          combatTimingsSource.enemyEnterAnimDurationMs,
          defaultCombat.timings.enemyEnterAnimDurationMs,
          { min: 0, max: 120000, integer: true },
        ),
        enemyEnterAnimOffsetPx: readNumber(
          combatTimingsSource.enemyEnterAnimOffsetPx,
          defaultCombat.timings.enemyEnterAnimOffsetPx,
          { min: 0, max: 10000 },
        ),
        enemyEnterAnimRotationDeg: readNumber(
          combatTimingsSource.enemyEnterAnimRotationDeg,
          defaultCombat.timings.enemyEnterAnimRotationDeg,
          { min: -360, max: 360 },
        ),
        enemyEnterAnimFadeRatio: readNumber(
          combatTimingsSource.enemyEnterAnimFadeRatio,
          defaultCombat.timings.enemyEnterAnimFadeRatio,
          { min: 0, max: 1 },
        ),
        enemyEnterAnimRotateRatio: readNumber(
          combatTimingsSource.enemyEnterAnimRotateRatio,
          defaultCombat.timings.enemyEnterAnimRotateRatio,
          { min: 0, max: 1 },
        ),
        attackFlashDurationMs: readNumber(
          combatTimingsSource.attackFlashDurationMs,
          defaultCombat.timings.attackFlashDurationMs,
          { min: 0, max: 120000, integer: true },
        ),
        attackFlashWhiteBlend: readNumber(
          combatTimingsSource.attackFlashWhiteBlend,
          defaultCombat.timings.attackFlashWhiteBlend,
          { min: 0, max: 1 },
        ),
        skipTurnEffectDurationMinMs: readNumber(
          combatTimingsSource.skipTurnEffectDurationMinMs,
          defaultCombat.timings.skipTurnEffectDurationMinMs,
          { min: 0, max: 120000, integer: true },
        ),
        skipTurnEffectDurationMaxMs: readNumber(
          combatTimingsSource.skipTurnEffectDurationMaxMs,
          defaultCombat.timings.skipTurnEffectDurationMaxMs,
          { min: 0, max: 120000, integer: true },
        ),
        skipTurnEffectFadeRatio: readNumber(
          combatTimingsSource.skipTurnEffectFadeRatio,
          defaultCombat.timings.skipTurnEffectFadeRatio,
          { min: 0, max: 1 },
        ),
        skipTurnEffectGrayscaleMax: readNumber(
          combatTimingsSource.skipTurnEffectGrayscaleMax,
          defaultCombat.timings.skipTurnEffectGrayscaleMax,
          { min: 0, max: 1 },
        ),
        attackChargeMinWindowMs: readNumber(
          combatTimingsSource.attackChargeMinWindowMs,
          defaultCombat.timings.attackChargeMinWindowMs,
          { min: 0, max: 120000, integer: true },
        ),
        attackChargeWindowRatio: readNumber(
          combatTimingsSource.attackChargeWindowRatio,
          defaultCombat.timings.attackChargeWindowRatio,
          { min: 0, max: 1 },
        ),
        teleportSwapScaleDurationMs: readNumber(
          combatTimingsSource.teleportSwapScaleDurationMs,
          defaultCombat.timings.teleportSwapScaleDurationMs,
          { min: 0, max: 120000, integer: true },
        ),
        enemyDamageFlashDurationMs: readNumber(
          combatTimingsSource.enemyDamageFlashDurationMs,
          defaultCombat.timings.enemyDamageFlashDurationMs,
          { min: 0, max: 120000, integer: true },
        ),
        enemyDamageFlashRedBlend: readNumber(
          combatTimingsSource.enemyDamageFlashRedBlend,
          defaultCombat.timings.enemyDamageFlashRedBlend,
          { min: 0, max: 1 },
        ),
      },
      floatingText: {
        lifetimeMs: readNumber(combatFloatingTextSource.lifetimeMs, defaultCombat.floatingText.lifetimeMs, {
          min: 1,
          max: 120000,
          integer: true,
        }),
        enterTweenMs: readNumber(combatFloatingTextSource.enterTweenMs, defaultCombat.floatingText.enterTweenMs, {
          min: 1,
          max: 120000,
          integer: true,
        }),
        exitTweenMs: readNumber(combatFloatingTextSource.exitTweenMs, defaultCombat.floatingText.exitTweenMs, {
          min: 1,
          max: 120000,
          integer: true,
        }),
      },
      talents: {
        legendaryFieldAttackBonus: readNumber(
          combatTalentsSource.legendaryFieldAttackBonus,
          defaultCombat.talents.legendaryFieldAttackBonus,
          { min: 0, max: 100 },
        ),
        legendaryFieldAttackIntervalMultiplier: readNumber(
          combatTalentsSource.legendaryFieldAttackIntervalMultiplier,
          defaultCombat.talents.legendaryFieldAttackIntervalMultiplier,
          { min: 0.01, max: 100 },
        ),
        critBonusChanceById: sanitizeNumberRecord(
          combatTalentsSource.critBonusChanceById,
          defaultCombat.talents.critBonusChanceById,
          { min: 0, max: 1 },
        ),
        moneyMultiplierById: sanitizeNumberRecord(
          combatTalentsSource.moneyMultiplierById,
          defaultCombat.talents.moneyMultiplierById,
          { min: 0.01, max: 100 },
        ),
        teleportSwapChanceById: sanitizeNumberRecord(
          combatTalentsSource.teleportSwapChanceById,
          defaultCombat.talents.teleportSwapChanceById,
          { min: 0, max: 1 },
        ),
        teleportPlusPlusDamageMultiplier: readNumber(
          combatTalentsSource.teleportPlusPlusDamageMultiplier,
          defaultCombat.talents.teleportPlusPlusDamageMultiplier,
          { min: 0.01, max: 100 },
        ),
      },
    },
    capture: {
      throwMs: readNumber(captureSource.throwMs, defaults.capture.throwMs, { min: 0, max: 120000, integer: true }),
      shakeMs: readNumber(captureSource.shakeMs, defaults.capture.shakeMs, { min: 0, max: 120000, integer: true }),
      successBurstMs: readNumber(captureSource.successBurstMs, defaults.capture.successBurstMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      failBreakMs: readNumber(captureSource.failBreakMs, defaults.capture.failBreakMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      failReappearMs: readNumber(captureSource.failReappearMs, defaults.capture.failReappearMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      postMs: readNumber(captureSource.postMs, defaults.capture.postMs, { min: 0, max: 120000, integer: true }),
      critChance: readNumber(captureSource.critChance, defaults.capture.critChance, { min: 0, max: 1 }),
      critMultiplier: readNumber(captureSource.critMultiplier, defaults.capture.critMultiplier, { min: 1, max: 100 }),
      ballMultiplierNerf: readNumber(captureSource.ballMultiplierNerf, defaults.capture.ballMultiplierNerf, {
        min: 0.01,
        max: 100,
      }),
    },
    progression: {
      maxLevel: readNumber(progressionSource.maxLevel, defaults.progression.maxLevel, {
        min: 1,
        max: 10000,
        integer: true,
      }),
      defaultWildLevelMin: readNumber(
        progressionSource.defaultWildLevelMin,
        defaults.progression.defaultWildLevelMin,
        { min: 1, max: 10000, integer: true },
      ),
      defaultWildLevelMax: readNumber(
        progressionSource.defaultWildLevelMax,
        defaults.progression.defaultWildLevelMax,
        { min: 1, max: 10000, integer: true },
      ),
      captureXpBase: readNumber(progressionSource.captureXpBase, defaults.progression.captureXpBase, {
        min: 0,
        max: 1_000_000,
      }),
      captureXpLevelMult: readNumber(
        progressionSource.captureXpLevelMult,
        defaults.progression.captureXpLevelMult,
        { min: 0, max: 1_000_000 },
      ),
      captureXpStatFactor: readNumber(
        progressionSource.captureXpStatFactor,
        defaults.progression.captureXpStatFactor,
        { min: 0, max: 1000 },
      ),
      koXpRatioOfCapture: readNumber(progressionSource.koXpRatioOfCapture, defaults.progression.koXpRatioOfCapture, {
        min: 0,
        max: 1,
      }),
      levelProgressionLinearPerStep: readNumber(
        progressionSource.levelProgressionLinearPerStep,
        defaults.progression.levelProgressionLinearPerStep,
        { min: 0, max: 1000 },
      ),
      levelProgressionCurveExponent: readNumber(
        progressionSource.levelProgressionCurveExponent,
        defaults.progression.levelProgressionCurveExponent,
        { min: 0.01, max: 10 },
      ),
      levelProgressionCurvePerStep: readNumber(
        progressionSource.levelProgressionCurvePerStep,
        defaults.progression.levelProgressionCurvePerStep,
        { min: 0, max: 1000 },
      ),
      enemyHpTeamScaleMaxBonus: readNumber(
        progressionSource.enemyHpTeamScaleMaxBonus,
        defaults.progression.enemyHpTeamScaleMaxBonus,
        { min: 0, max: 1000 },
      ),
      enemyHpTeamScaleExponent: readNumber(
        progressionSource.enemyHpTeamScaleExponent,
        defaults.progression.enemyHpTeamScaleExponent,
        { min: 0.01, max: 10 },
      ),
      enemyRewardScaleExponent: readNumber(
        progressionSource.enemyRewardScaleExponent,
        defaults.progression.enemyRewardScaleExponent,
        { min: 0, max: 10 },
      ),
      enemyRewardScaleBlend: readNumber(
        progressionSource.enemyRewardScaleBlend,
        defaults.progression.enemyRewardScaleBlend,
        { min: 0, max: 1 },
      ),
      appearanceUnlockLevel: readNumber(
        progressionSource.appearanceUnlockLevel,
        defaults.progression.appearanceUnlockLevel,
        { min: 1, max: 10000, integer: true },
      ),
      pokemonNicknameMaxLength: readNumber(
        progressionSource.pokemonNicknameMaxLength,
        defaults.progression.pokemonNicknameMaxLength,
        { min: 1, max: 200, integer: true },
      ),
      happinessEvolutionBoxRequiredMs: readNumber(
        progressionSource.happinessEvolutionBoxRequiredMs,
        defaults.progression.happinessEvolutionBoxRequiredMs,
        { min: 0, max: 1000 * 60 * 60 * 24 * 365, integer: true },
      ),
    },
    economy: {
      enemyMoneyBase: readNumber(economySource.enemyMoneyBase, defaults.economy.enemyMoneyBase, {
        min: 0,
        max: 1_000_000,
      }),
      enemyMoneyLevelMult: readNumber(economySource.enemyMoneyLevelMult, defaults.economy.enemyMoneyLevelMult, {
        min: 0,
        max: 1_000_000,
      }),
      enemyMoneyStatFactor: readNumber(economySource.enemyMoneyStatFactor, defaults.economy.enemyMoneyStatFactor, {
        min: 0,
        max: 1000,
      }),
      coinRewardPerCapture: readNumber(
        economySource.coinRewardPerCapture,
        defaults.economy.coinRewardPerCapture,
        { min: 0, max: 1_000_000, integer: true },
      ),
      coinRewardFirstCaptureBonus: readNumber(
        economySource.coinRewardFirstCaptureBonus,
        defaults.economy.coinRewardFirstCaptureBonus,
        { min: 0, max: 1_000_000, integer: true },
      ),
      coinRewardPerEvolution: readNumber(
        economySource.coinRewardPerEvolution,
        defaults.economy.coinRewardPerEvolution,
        { min: 0, max: 1_000_000, integer: true },
      ),
      minLevelDiffMoneyMultiplier: readNumber(
        economySource.minLevelDiffMoneyMultiplier,
        defaults.economy.minLevelDiffMoneyMultiplier,
        { min: 0, max: 100 },
      ),
    },
    routeUnlock: {
      routeUnlockDefeats: readNumber(routeUnlockSource.routeUnlockDefeats, defaults.routeUnlock.routeUnlockDefeats, {
        min: 1,
        max: 1_000_000,
        integer: true,
      }),
      routeDefeatTimerMs: readNumber(routeUnlockSource.routeDefeatTimerMs, defaults.routeUnlock.routeDefeatTimerMs, {
        min: 1000,
        max: 1000 * 60 * 60,
        integer: true,
      }),
      onlyOneEncounterInterval,
      onlyOneEncounterNormalsBeforeSpawn: Math.max(0, onlyOneEncounterInterval - 1),
      onlyOneEncounterHpMultiplier: readNumber(
        routeUnlockSource.onlyOneEncounterHpMultiplier,
        defaults.routeUnlock.onlyOneEncounterHpMultiplier,
        { min: 1, max: 1000 },
      ),
      onlyOneEncounterTimerMs: readNumber(
        routeUnlockSource.onlyOneEncounterTimerMs,
        defaults.routeUnlock.onlyOneEncounterTimerMs,
        { min: 1000, max: 1000 * 60 * 60, integer: true },
      ),
      enemyTimerStyleRoute: readString(
        routeUnlockSource.enemyTimerStyleRoute,
        defaults.routeUnlock.enemyTimerStyleRoute,
      ),
      enemyTimerStyleOnlyOne: readString(
        routeUnlockSource.enemyTimerStyleOnlyOne,
        defaults.routeUnlock.enemyTimerStyleOnlyOne,
      ),
    },
    trainerBattle: {
      trainerBattleTeamSizeCount: readNumber(
        trainerBattleSource.trainerBattleTeamSizeCount,
        defaults.trainerBattle.trainerBattleTeamSizeCount,
        { min: 1, max: 6, integer: true },
      ),
      trainerBattleEnemyHpMultiplier: readNumber(
        trainerBattleSource.trainerBattleEnemyHpMultiplier,
        defaults.trainerBattle.trainerBattleEnemyHpMultiplier,
        { min: 1, max: 100 },
      ),
      trainerBattleEnemyTimerMs: readNumber(
        trainerBattleSource.trainerBattleEnemyTimerMs,
        defaults.trainerBattle.trainerBattleEnemyTimerMs,
        { min: 1000, max: 1000 * 60 * 60, integer: true },
      ),
    },
    gacha: {
      spinCostCoins: readNumber(gachaSource.spinCostCoins, defaults.gacha.spinCostCoins, {
        min: 0,
        max: 1_000_000_000,
        integer: true,
      }),
      batchSpinCount: readNumber(gachaSource.batchSpinCount, defaults.gacha.batchSpinCount, {
        min: 1,
        max: 1000,
        integer: true,
      }),
      batchSpinCostCoins: readNumber(gachaSource.batchSpinCostCoins, defaults.gacha.batchSpinCostCoins, {
        min: 0,
        max: 1_000_000_000,
        integer: true,
      }),
      baseMaxPokemonId: readNumber(gachaSource.baseMaxPokemonId, defaults.gacha.baseMaxPokemonId, {
        min: 1,
        max: 5000,
        integer: true,
      }),
      extendedMaxPokemonId: readNumber(gachaSource.extendedMaxPokemonId, defaults.gacha.extendedMaxPokemonId, {
        min: 1,
        max: 5000,
        integer: true,
      }),
      reelTotalItems: readNumber(gachaSource.reelTotalItems, defaults.gacha.reelTotalItems, {
        min: 1,
        max: 10000,
        integer: true,
      }),
      rewardIndex: readNumber(gachaSource.rewardIndex, defaults.gacha.rewardIndex, {
        min: 0,
        max: 10000,
        integer: true,
      }),
      spinDurationMs: gachaSpinDurationMs,
      batchSpinDurationMs: gachaBatchSpinDurationMs,
      spinFinalSnapDurationMs: gachaSpinFinalSnapDurationMs,
      spinMainScrollDurationMs: Math.max(200, gachaSpinDurationMs - gachaSpinFinalSnapDurationMs),
      batchSpinMainScrollDurationMs: Math.max(200, gachaBatchSpinDurationMs - gachaSpinFinalSnapDurationMs),
      spinFinalSnapLeadPx: readNumber(gachaSource.spinFinalSnapLeadPx, defaults.gacha.spinFinalSnapLeadPx, {
        min: 0,
        max: 10000,
      }),
      batchSpotlightPopMs: readNumber(gachaSource.batchSpotlightPopMs, defaults.gacha.batchSpotlightPopMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      batchSpotlightTransferMs: readNumber(
        gachaSource.batchSpotlightTransferMs,
        defaults.gacha.batchSpotlightTransferMs,
        { min: 0, max: 120000, integer: true },
      ),
      batchSpotlightStepGapMs: readNumber(
        gachaSource.batchSpotlightStepGapMs,
        defaults.gacha.batchSpotlightStepGapMs,
        { min: 0, max: 120000, integer: true },
      ),
      batchSlotJuiceMs: readNumber(gachaSource.batchSlotJuiceMs, defaults.gacha.batchSlotJuiceMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
    },
    ui: {
      teamDragStartDistancePx: readNumber(uiSource.teamDragStartDistancePx, defaults.ui.teamDragStartDistancePx, {
        min: 0,
        max: 1000,
      }),
      teamDragClickSuppressMs: readNumber(uiSource.teamDragClickSuppressMs, defaults.ui.teamDragClickSuppressMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      teamContextTouchHoldDelayMs: readNumber(
        uiSource.teamContextTouchHoldDelayMs,
        defaults.ui.teamContextTouchHoldDelayMs,
        { min: 0, max: 120000, integer: true },
      ),
      teamContextTouchHoldCancelDistancePx: readNumber(
        uiSource.teamContextTouchHoldCancelDistancePx,
        defaults.ui.teamContextTouchHoldCancelDistancePx,
        { min: 0, max: 1000 },
      ),
      ballInventoryMaxPerType: readNumber(uiSource.ballInventoryMaxPerType, defaults.ui.ballInventoryMaxPerType, {
        min: 1,
        max: 1_000_000,
        integer: true,
      }),
      shopQuantityPresetValues,
      shopQuantityPresetSet: new Set(shopQuantityPresetValues),
      evolutionAnimTotalMs: readNumber(uiSource.evolutionAnimTotalMs, defaults.ui.evolutionAnimTotalMs, {
        min: 1,
        max: 120000,
        integer: true,
      }),
      evolutionAnimWhiteMs: readNumber(uiSource.evolutionAnimWhiteMs, defaults.ui.evolutionAnimWhiteMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      evolutionAnimFlashMs: readNumber(uiSource.evolutionAnimFlashMs, defaults.ui.evolutionAnimFlashMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      evolutionAnimRevealMs: readNumber(uiSource.evolutionAnimRevealMs, defaults.ui.evolutionAnimRevealMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      evolutionAnimBackdropFadeMs: readNumber(
        uiSource.evolutionAnimBackdropFadeMs,
        defaults.ui.evolutionAnimBackdropFadeMs,
        { min: 0, max: 120000, integer: true },
      ),
      evolutionAnimSwapCount: readNumber(
        uiSource.evolutionAnimSwapCount,
        defaults.ui.evolutionAnimSwapCount,
        { min: 1, max: 64, integer: true },
      ),
      evolutionAnimParticleCount: readNumber(
        uiSource.evolutionAnimParticleCount,
        defaults.ui.evolutionAnimParticleCount,
        { min: 0, max: 10000, integer: true },
      ),
      backgroundDriftTravelMinMs: readNumber(
        uiSource.backgroundDriftTravelMinMs,
        defaults.ui.backgroundDriftTravelMinMs,
        { min: 0, max: 1200000, integer: true },
      ),
      backgroundDriftTravelMaxMs: readNumber(
        uiSource.backgroundDriftTravelMaxMs,
        defaults.ui.backgroundDriftTravelMaxMs,
        { min: 0, max: 1200000, integer: true },
      ),
      backgroundDriftHoldMinMs: readNumber(
        uiSource.backgroundDriftHoldMinMs,
        defaults.ui.backgroundDriftHoldMinMs,
        { min: 0, max: 1200000, integer: true },
      ),
      backgroundDriftHoldMaxMs: readNumber(
        uiSource.backgroundDriftHoldMaxMs,
        defaults.ui.backgroundDriftHoldMaxMs,
        { min: 0, max: 1200000, integer: true },
      ),
      teamLevelUpEffectDurationMs: readNumber(
        uiSource.teamLevelUpEffectDurationMs,
        defaults.ui.teamLevelUpEffectDurationMs,
        { min: 0, max: 120000, integer: true },
      ),
      teamXpGainEffectDurationMs: readNumber(
        uiSource.teamXpGainEffectDurationMs,
        defaults.ui.teamXpGainEffectDurationMs,
        { min: 0, max: 120000, integer: true },
      ),
      teamXpPulseDurationMs: readNumber(uiSource.teamXpPulseDurationMs, defaults.ui.teamXpPulseDurationMs, {
        min: 0,
        max: 120000,
        integer: true,
      }),
      loadingScreenExitDurationMs: readNumber(
        uiSource.loadingScreenExitDurationMs,
        defaults.ui.loadingScreenExitDurationMs,
        { min: 0, max: 120000, integer: true },
      ),
      actionDockFullscreenMenuTransitionMs: readNumber(
        uiSource.actionDockFullscreenMenuTransitionMs,
        defaults.ui.actionDockFullscreenMenuTransitionMs,
        { min: 0, max: 120000, integer: true },
      ),
      hud: {
        desktopCurrentZoneMaxWidthPx: readNumber(
          hudSource.desktopCurrentZoneMaxWidthPx,
          defaultHud.desktopCurrentZoneMaxWidthPx,
          { min: 160, max: 2400, integer: true },
        ),
        desktopCurrentZoneHeightPx: readNumber(
          hudSource.desktopCurrentZoneHeightPx,
          defaultHud.desktopCurrentZoneHeightPx,
          { min: 44, max: 400, integer: true },
        ),
        desktopProgressHeightPx: readNumber(
          hudSource.desktopProgressHeightPx,
          defaultHud.desktopProgressHeightPx,
          { min: 12, max: 120, integer: true },
        ),
        mobileZoneHeaderHeightPx: readNumber(
          hudSource.mobileZoneHeaderHeightPx,
          defaultHud.mobileZoneHeaderHeightPx,
          { min: 44, max: 240, integer: true },
        ),
        mobileResourceRowHeightPx: readNumber(
          hudSource.mobileResourceRowHeightPx,
          defaultHud.mobileResourceRowHeightPx,
          { min: 32, max: 160, integer: true },
        ),
        mobileBallRailCellHeightPx: readNumber(
          hudSource.mobileBallRailCellHeightPx,
          defaultHud.mobileBallRailCellHeightPx,
          { min: 24, max: 120, integer: true },
        ),
        mobileBallRailMaxWidthPx: readNumber(
          hudSource.mobileBallRailMaxWidthPx,
          defaultHud.mobileBallRailMaxWidthPx,
          { min: 48, max: 240, integer: true },
        ),
        mobileTopStackMaxHeightPx: readNumber(
          hudSource.mobileTopStackMaxHeightPx,
          defaultHud.mobileTopStackMaxHeightPx,
          { min: 96, max: 360, integer: true },
        ),
        minimumTouchTargetPx: readNumber(
          hudSource.minimumTouchTargetPx,
          defaultHud.minimumTouchTargetPx,
          { min: 32, max: 96, integer: true },
        ),
        secondaryTextMinFontSizeDesktopPx: readNumber(
          hudSource.secondaryTextMinFontSizeDesktopPx,
          defaultHud.secondaryTextMinFontSizeDesktopPx,
          { min: 8, max: 24, integer: true },
        ),
        secondaryTextMinFontSizeMobilePx: readNumber(
          hudSource.secondaryTextMinFontSizeMobilePx,
          defaultHud.secondaryTextMinFontSizeMobilePx,
          { min: 8, max: 28, integer: true },
        ),
      },
      modal: {
        sizeSMaxWidthPx: readNumber(modalSource.sizeSMaxWidthPx, defaultModal.sizeSMaxWidthPx, {
          min: 240,
          max: 1600,
          integer: true,
        }),
        sizeMMaxWidthPx: readNumber(modalSource.sizeMMaxWidthPx, defaultModal.sizeMMaxWidthPx, {
          min: 320,
          max: 2000,
          integer: true,
        }),
        sizeLMaxWidthPx: readNumber(modalSource.sizeLMaxWidthPx, defaultModal.sizeLMaxWidthPx, {
          min: 480,
          max: 2400,
          integer: true,
        }),
        mobileSideInsetPx: readNumber(modalSource.mobileSideInsetPx, defaultModal.mobileSideInsetPx, {
          min: 4,
          max: 48,
          integer: true,
        }),
        mobileRadiusPx: readNumber(modalSource.mobileRadiusPx, defaultModal.mobileRadiusPx, {
          min: 0,
          max: 48,
          integer: true,
        }),
        mobileMaxHeightVh: readNumber(modalSource.mobileMaxHeightVh, defaultModal.mobileMaxHeightVh, {
          min: 40,
          max: 100,
        }),
      },
      actionMenu: {
        desktopPanelMaxWidthPx: readNumber(
          actionMenuSource.desktopPanelMaxWidthPx,
          defaultActionMenu.desktopPanelMaxWidthPx,
          { min: 320, max: 1600, integer: true },
        ),
        desktopGridColumns: readNumber(
          actionMenuSource.desktopGridColumns,
          defaultActionMenu.desktopGridColumns,
          { min: 1, max: 8, integer: true },
        ),
        mobileGridColumns: readNumber(
          actionMenuSource.mobileGridColumns,
          defaultActionMenu.mobileGridColumns,
          { min: 1, max: 4, integer: true },
        ),
        onboardingPulseDurationMs: readNumber(
          actionMenuSource.onboardingPulseDurationMs,
          defaultActionMenu.onboardingPulseDurationMs,
          { min: 200, max: 120000, integer: true },
        ),
        onboardingPulseRepeatDelayMs: readNumber(
          actionMenuSource.onboardingPulseRepeatDelayMs,
          defaultActionMenu.onboardingPulseRepeatDelayMs,
          { min: 0, max: 120000, integer: true },
        ),
      },
      notification: {
        desktopMaxWidthPx: readNumber(
          notificationSource.desktopMaxWidthPx,
          defaultNotification.desktopMaxWidthPx,
          { min: 220, max: 1200, integer: true },
        ),
        desktopMaxVisibleCount: readNumber(
          notificationSource.desktopMaxVisibleCount,
          defaultNotification.desktopMaxVisibleCount,
          { min: 1, max: 12, integer: true },
        ),
        mobileMaxVisibleCount: readNumber(
          notificationSource.mobileMaxVisibleCount,
          defaultNotification.mobileMaxVisibleCount,
          { min: 1, max: 8, integer: true },
        ),
        mobileCardHeightPx: readNumber(
          notificationSource.mobileCardHeightPx,
          defaultNotification.mobileCardHeightPx,
          { min: 40, max: 180, integer: true },
        ),
        mobileBottomOffsetPx: readNumber(
          notificationSource.mobileBottomOffsetPx,
          defaultNotification.mobileBottomOffsetPx,
          { min: 0, max: 80, integer: true },
        ),
      },
      collectionLayout: {
        desktopGridRatioPercent: readNumber(
          collectionLayoutSource.desktopGridRatioPercent,
          defaultCollectionLayout.desktopGridRatioPercent,
          { min: 20, max: 90, integer: true },
        ),
        desktopDetailRatioPercent: readNumber(
          collectionLayoutSource.desktopDetailRatioPercent,
          defaultCollectionLayout.desktopDetailRatioPercent,
          { min: 10, max: 80, integer: true },
        ),
        mobileDetailSheetHeightVh: readNumber(
          collectionLayoutSource.mobileDetailSheetHeightVh,
          defaultCollectionLayout.mobileDetailSheetHeightVh,
          { min: 20, max: 90 },
        ),
        mobileMapMinHeightVh: readNumber(
          collectionLayoutSource.mobileMapMinHeightVh,
          defaultCollectionLayout.mobileMapMinHeightVh,
          { min: 20, max: 90 },
        ),
      },
      mobileSafeArea: {
        sideInsetPx: readNumber(mobileSafeAreaSource.sideInsetPx, defaultMobileSafeArea.sideInsetPx, {
          min: 0,
          max: 48,
          integer: true,
        }),
        quickCardHeightPx: readNumber(
          mobileSafeAreaSource.quickCardHeightPx,
          defaultMobileSafeArea.quickCardHeightPx,
          { min: 80, max: 360, integer: true },
        ),
      },
    },
    metrics: {
      foregroundFrameStepMs: readNumber(
        metricsSource.foregroundFrameStepMs,
        defaultMetrics.foregroundFrameStepMs,
        { min: 1, max: 120000, integer: true },
      ),
      hiddenSimBudgetMs: readNumber(metricsSource.hiddenSimBudgetMs, defaultMetrics.hiddenSimBudgetMs, {
        min: 1,
        max: 1000 * 60 * 60 * 24 * 365,
        integer: true,
      }),
      backgroundPumpMaxWorkMs: readNumber(
        metricsSource.backgroundPumpMaxWorkMs,
        defaultMetrics.backgroundPumpMaxWorkMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      bulkIdleThresholdMs: readNumber(metricsSource.bulkIdleThresholdMs, defaultMetrics.bulkIdleThresholdMs, {
        min: 1,
        max: 1000 * 60 * 60,
        integer: true,
      }),
      maxOfflineCatchupMs: readNumber(metricsSource.maxOfflineCatchupMs, defaultMetrics.maxOfflineCatchupMs, {
        min: 1,
        max: 1000 * 60 * 60 * 24 * 365,
        integer: true,
      }),
      maxResumeCatchupMs: readNumber(metricsSource.maxResumeCatchupMs, defaultMetrics.maxResumeCatchupMs, {
        min: 1,
        max: 1000 * 60 * 60 * 24 * 365,
        integer: true,
      }),
      foregroundCatchupPumpMaxWorkMs: readNumber(
        metricsSource.foregroundCatchupPumpMaxWorkMs,
        defaultMetrics.foregroundCatchupPumpMaxWorkMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      foregroundCatchupPumpDelayMs: readNumber(
        metricsSource.foregroundCatchupPumpDelayMs,
        defaultMetrics.foregroundCatchupPumpDelayMs,
        { min: 0, max: 1000 * 60 * 60, integer: true },
      ),
      backgroundTickIntervalMs: readNumber(
        metricsSource.backgroundTickIntervalMs,
        defaultMetrics.backgroundTickIntervalMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      backgroundPersistDebounceMs: readNumber(
        metricsSource.backgroundPersistDebounceMs,
        defaultMetrics.backgroundPersistDebounceMs,
        { min: 0, max: 1000 * 60 * 60, integer: true },
      ),
      desktopBackgroundWatchdogIntervalMs: readNumber(
        metricsSource.desktopBackgroundWatchdogIntervalMs,
        defaultMetrics.desktopBackgroundWatchdogIntervalMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      desktopBackgroundWatchdogStallMs: readNumber(
        metricsSource.desktopBackgroundWatchdogStallMs,
        defaultMetrics.desktopBackgroundWatchdogStallMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      targetFps,
      targetFrameMs,
      targetRenderIntervalMs,
      maxForegroundPendingMs: readNumber(
        metricsSource.maxForegroundPendingMs,
        defaultMetrics.maxForegroundPendingMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      hudAutoRefreshIntervalMs: readNumber(
        metricsSource.hudAutoRefreshIntervalMs,
        defaultMetrics.hudAutoRefreshIntervalMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      layoutRecomputeIntervalMs: readNumber(
        metricsSource.layoutRecomputeIntervalMs,
        defaultMetrics.layoutRecomputeIntervalMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      deferredRouteWarmupChunkSize: readNumber(
        metricsSource.deferredRouteWarmupChunkSize,
        defaultMetrics.deferredRouteWarmupChunkSize,
        { min: 1, max: 10000, integer: true },
      ),
      deferredRouteWarmupDelayMs: readNumber(
        metricsSource.deferredRouteWarmupDelayMs,
        defaultMetrics.deferredRouteWarmupDelayMs,
        { min: 0, max: 1000 * 60 * 60, integer: true },
      ),
      localDayStartHour: readNumber(metricsSource.localDayStartHour, defaultMetrics.localDayStartHour, {
        min: 0,
        max: 23,
        integer: true,
      }),
      localNightStartHour: readNumber(metricsSource.localNightStartHour, defaultMetrics.localNightStartHour, {
        min: 0,
        max: 23,
        integer: true,
      }),
      environmentUpdateIntervalMs: readNumber(
        metricsSource.environmentUpdateIntervalMs,
        defaultMetrics.environmentUpdateIntervalMs,
        { min: 1, max: 1000 * 60 * 60, integer: true },
      ),
      maxRenderDpr: readNumber(metricsSource.maxRenderDpr, defaultMetrics.maxRenderDpr, { min: 0.1, max: 8 }),
      renderQualityOrder,
      renderQualityPresets,
      perfShortEmaSmoothing: readNumber(
        metricsSource.perfShortEmaSmoothing,
        defaultMetrics.perfShortEmaSmoothing,
        { min: 0.0001, max: 1 },
      ),
      perfLongEmaSmoothing: readNumber(
        metricsSource.perfLongEmaSmoothing,
        defaultMetrics.perfLongEmaSmoothing,
        { min: 0.0001, max: 1 },
      ),
      perfCpuEmaSmoothing: readNumber(metricsSource.perfCpuEmaSmoothing, defaultMetrics.perfCpuEmaSmoothing, {
        min: 0.0001,
        max: 1,
      }),
      perfRenderEmaSmoothing: readNumber(
        metricsSource.perfRenderEmaSmoothing,
        defaultMetrics.perfRenderEmaSmoothing,
        { min: 0.0001, max: 1 },
      ),
      perfSwitchCooldownMs: readNumber(
        metricsSource.perfSwitchCooldownMs,
        defaultMetrics.perfSwitchCooldownMs,
        { min: 0, max: 1000 * 60 * 60, integer: true },
      ),
      perfDowngradeStreak: readNumber(
        metricsSource.perfDowngradeStreak,
        defaultMetrics.perfDowngradeStreak,
        { min: 1, max: 100000, integer: true },
      ),
      perfUpgradeStreak: readNumber(metricsSource.perfUpgradeStreak, defaultMetrics.perfUpgradeStreak, {
        min: 1,
        max: 100000,
        integer: true,
      }),
      perfSlowFrameMarginMs: readNumber(
        metricsSource.perfSlowFrameMarginMs,
        defaultMetrics.perfSlowFrameMarginMs,
        { min: 0, max: 1000 },
      ),
      perfVerySlowFrameMarginMs: readNumber(
        metricsSource.perfVerySlowFrameMarginMs,
        defaultMetrics.perfVerySlowFrameMarginMs,
        { min: 0, max: 1000 },
      ),
      perfUpgradeHeadroomMs: readNumber(
        metricsSource.perfUpgradeHeadroomMs,
        defaultMetrics.perfUpgradeHeadroomMs,
        { min: 0, max: 1000 },
      ),
    },
  };

  return deepFreeze(sanitized);
}

export function getGameDesignConfigSnapshot(design = GAME_DESIGN) {
  const source = design && typeof design === "object" ? design : GAME_DESIGN;
  return deepFreeze({
    rarity: {
      shinyOdds: source.rarity.shinyOdds,
      ultraShinyOdds: source.rarity.ultraShinyOdds,
      nonUltraShinyOddsNumerator: source.rarity.nonUltraShinyOddsNumerator,
      nonUltraShinyOddsDenominator: source.rarity.nonUltraShinyOddsDenominator,
    },
    combat: {
      attackIntervalMs: source.combat.attackIntervalMs,
      attackCritChance: source.combat.attackCritChance,
      attackMissChance: source.combat.attackMissChance,
      attackCritMultiplier: source.combat.attackCritMultiplier,
      damageScale: source.combat.damageScale,
      damageLevelProgressionExponent: source.combat.damageLevelProgressionExponent,
      boostX: {
        durationMs: source.combat.boostX.durationMs,
        attackIntervalMultiplier: source.combat.boostX.attackIntervalMultiplier,
      },
      laser: {
        tickIntervalMultiplier: source.combat.laser.tickIntervalMultiplier,
        tickJitterMs: source.combat.laser.tickJitterMs,
        damagePerTickDivisor: source.combat.laser.damagePerTickDivisor,
      },
      vfx: {
        projectileAtlasSizePx: source.combat.vfx.projectileAtlasSizePx,
        projectileTrailStampSizePx: source.combat.vfx.projectileTrailStampSizePx,
        laserPackedTextureWidthPx: source.combat.vfx.laserPackedTextureWidthPx,
        laserPackedTextureHeightPx: source.combat.vfx.laserPackedTextureHeightPx,
      },
    },
    capture: {
      critChance: source.capture.critChance,
      critMultiplier: source.capture.critMultiplier,
      ballMultiplierNerf: source.capture.ballMultiplierNerf,
    },
    progression: {
      maxLevel: source.progression.maxLevel,
      defaultWildLevelMin: source.progression.defaultWildLevelMin,
      defaultWildLevelMax: source.progression.defaultWildLevelMax,
      appearanceUnlockLevel: source.progression.appearanceUnlockLevel,
      pokemonNicknameMaxLength: source.progression.pokemonNicknameMaxLength,
    },
    economy: {
      enemyMoneyBase: source.economy.enemyMoneyBase,
      enemyMoneyLevelMult: source.economy.enemyMoneyLevelMult,
      enemyMoneyStatFactor: source.economy.enemyMoneyStatFactor,
      coinRewardPerCapture: source.economy.coinRewardPerCapture,
      coinRewardFirstCaptureBonus: source.economy.coinRewardFirstCaptureBonus,
    },
    routeUnlock: {
      routeUnlockDefeats: source.routeUnlock.routeUnlockDefeats,
      routeDefeatTimerMs: source.routeUnlock.routeDefeatTimerMs,
      onlyOneEncounterInterval: source.routeUnlock.onlyOneEncounterInterval,
      onlyOneEncounterHpMultiplier: source.routeUnlock.onlyOneEncounterHpMultiplier,
      onlyOneEncounterTimerMs: source.routeUnlock.onlyOneEncounterTimerMs,
    },
    gacha: {
      spinCostCoins: source.gacha.spinCostCoins,
      batchSpinCount: source.gacha.batchSpinCount,
      batchSpinCostCoins: source.gacha.batchSpinCostCoins,
      baseMaxPokemonId: source.gacha.baseMaxPokemonId,
      extendedMaxPokemonId: source.gacha.extendedMaxPokemonId,
    },
    ui: {
      shopQuantityPresetValues: source.ui.shopQuantityPresetValues.slice(),
      teamDragStartDistancePx: source.ui.teamDragStartDistancePx,
      teamDragClickSuppressMs: source.ui.teamDragClickSuppressMs,
      teamContextTouchHoldDelayMs: source.ui.teamContextTouchHoldDelayMs,
      teamContextTouchHoldCancelDistancePx: source.ui.teamContextTouchHoldCancelDistancePx,
      loadingScreenExitDurationMs: source.ui.loadingScreenExitDurationMs,
      hud: {
        ...source.ui.hud,
      },
      modal: {
        ...source.ui.modal,
      },
      actionMenu: {
        ...source.ui.actionMenu,
      },
      notification: {
        ...source.ui.notification,
      },
      collectionLayout: {
        ...source.ui.collectionLayout,
      },
      mobileSafeArea: {
        ...source.ui.mobileSafeArea,
      },
    },
    metrics: {
      targetFps: source.metrics.targetFps,
      targetFrameMs: Math.round(source.metrics.targetFrameMs * 1000) / 1000,
      targetRenderIntervalMs: source.metrics.targetRenderIntervalMs,
      maxForegroundPendingMs: source.metrics.maxForegroundPendingMs,
      backgroundPumpMaxWorkMs: source.metrics.backgroundPumpMaxWorkMs,
      maxOfflineCatchupMs: source.metrics.maxOfflineCatchupMs,
      maxResumeCatchupMs: source.metrics.maxResumeCatchupMs,
      foregroundCatchupPumpMaxWorkMs: source.metrics.foregroundCatchupPumpMaxWorkMs,
      foregroundCatchupPumpDelayMs: source.metrics.foregroundCatchupPumpDelayMs,
      backgroundTickIntervalMs: source.metrics.backgroundTickIntervalMs,
      backgroundPersistDebounceMs: source.metrics.backgroundPersistDebounceMs,
      desktopBackgroundWatchdogIntervalMs: source.metrics.desktopBackgroundWatchdogIntervalMs,
      desktopBackgroundWatchdogStallMs: source.metrics.desktopBackgroundWatchdogStallMs,
      renderQualityOrder: source.metrics.renderQualityOrder.slice(),
    },
  });
}

export const GAME_DESIGN = sanitizeGameDesignConfig(GAME_DESIGN_CONFIG);
export const GAME_DESIGN_SNAPSHOT = getGameDesignConfigSnapshot(GAME_DESIGN);
