import {
  enrichRuntimeLayout,
  enrichViewportProfile,
  isPhoneLikeViewport,
  resolveProductLayoutMode,
} from '../../lib/runtime-stage-layout.js';
import { COMBAT_VFX_CONFIG } from '../../lib/combat-balance-config.js';
import { ZONE_UI_CANVAS_THEME } from '../../lib/gameplay-ui-config.js';
import {
  getLaserTypeVfxProfile,
  getProjectileTrailTypeVfxProfile as getSharedProjectileTrailTypeVfxProfile,
  getProjectileTypeVfxProfile as getSharedProjectileTypeVfxProfile,
} from '../../lib/combat-vfx-config.js';

function getRuntimeSystemBindings(options = {}) {
  const scope = {};
  if (options && typeof options === 'object' && options.bindings && typeof options.bindings === 'object') {
    Object.assign(scope, options.bindings);
  } else if (options && typeof options === 'object') {
    Object.assign(scope, options);
  }
  for (const key of Reflect.ownKeys(globalThis)) {
    if (Object.prototype.hasOwnProperty.call(scope, key)) {
      continue;
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(globalThis, key);
    if (!descriptor) {
      continue;
    }
    Object.defineProperty(scope, key, {
      configurable: true,
      enumerable: Boolean(descriptor.enumerable),
      get() {
        return Reflect.get(globalThis, key, globalThis);
      },
    });
  }
  return scope;
}

export function computeSpriteOpaqueDrawPlacement({
  renderSize = 0,
  sourceWidth = 1,
  sourceHeight = 1,
  opaqueMinX = 0,
  opaqueMinY = 0,
  opaqueWidth = sourceWidth,
  opaqueHeight = sourceHeight,
} = {}) {
  const safeRenderSize = Math.max(0, Number(renderSize) || 0);
  const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
  const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
  const safeOpaqueMinX = Math.min(
    safeSourceWidth - 1,
    Math.max(0, Math.round(Number(opaqueMinX) || 0)),
  );
  const safeOpaqueMinY = Math.min(
    safeSourceHeight - 1,
    Math.max(0, Math.round(Number(opaqueMinY) || 0)),
  );
  const safeOpaqueWidth = Math.min(
    safeSourceWidth - safeOpaqueMinX,
    Math.max(1, Math.round(Number(opaqueWidth) || safeSourceWidth)),
  );
  const safeOpaqueHeight = Math.min(
    safeSourceHeight - safeOpaqueMinY,
    Math.max(1, Math.round(Number(opaqueHeight) || safeSourceHeight)),
  );
  const ratio = safeSourceWidth / Math.max(safeSourceHeight, 1);
  let drawWidth = safeRenderSize;
  let drawHeight = safeRenderSize;
  if (ratio > 1) {
    drawHeight = safeRenderSize / ratio;
  } else {
    drawWidth = safeRenderSize * ratio;
  }

  const imageCenterX = safeSourceWidth * 0.5;
  const imageCenterY = safeSourceHeight * 0.5;
  const opaqueCenterX = safeOpaqueMinX + safeOpaqueWidth * 0.5;
  const opaqueCenterY = safeOpaqueMinY + safeOpaqueHeight * 0.5;
  const centerOffsetX = ((imageCenterX - opaqueCenterX) / safeSourceWidth) * drawWidth;
  const centerOffsetY = ((imageCenterY - opaqueCenterY) / safeSourceHeight) * drawHeight;
  const drawX = -drawWidth * 0.5 + centerOffsetX;
  const drawY = -drawHeight * 0.5 + centerOffsetY;
  const visibleWidth = drawWidth * (safeOpaqueWidth / safeSourceWidth);
  const visibleHeight = drawHeight * (safeOpaqueHeight / safeSourceHeight);
  const visibleBottomY = drawY + ((safeOpaqueMinY + safeOpaqueHeight) / safeSourceHeight) * drawHeight;

  return {
    drawWidth,
    drawHeight,
    drawX,
    drawY,
    visibleWidth,
    visibleHeight,
    visibleBottomY,
  };
}

export function computeEvolutionAnimationViewportCenter(layout = {}, viewport = {}) {
  const fallbackCenterX = Number(layout?.centerX) || 0;
  const fallbackCenterY = Number(layout?.centerY) || 0;
  const viewportWidth = Math.max(0, Number(viewport?.width) || 0);
  const viewportHeight = Math.max(0, Number(viewport?.height) || 0);

  return {
    centerX: viewportWidth > 0 ? viewportWidth * 0.5 : fallbackCenterX,
    centerY: viewportHeight > 0 ? viewportHeight * 0.5 : fallbackCenterY,
  };
}

function clampTimelineValue(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function easeInOutTimelineValue(value) {
  const ratio = clampTimelineValue(value, 0, 1);
  return 0.5 - Math.cos(ratio * Math.PI) * 0.5;
}

function buildEvolutionPulseDurations(totalMs = 0, pulseCount = 1) {
  const safeTotalMs = Math.max(0, Number(totalMs) || 0);
  const safePulseCount = Math.max(1, Math.round(Number(pulseCount) || 1));
  const weightSum = (safePulseCount * (safePulseCount + 1)) / 2;
  const durations = [];
  let remainingMs = safeTotalMs;
  for (let index = 0; index < safePulseCount; index += 1) {
    const weight = safePulseCount - index;
    const rawDuration = index === safePulseCount - 1
      ? remainingMs
      : (safeTotalMs * weight) / Math.max(1, weightSum);
    const durationMs = Math.max(0, rawDuration);
    durations.push(durationMs);
    remainingMs = Math.max(0, remainingMs - durationMs);
  }
  return durations;
}

export function computeEvolutionAnimationBeatState({
  elapsedMs = 0,
  totalMs = 0,
  whiteMs = 0,
  flashMs = 0,
  revealMs = 0,
  swapCount = 1,
} = {}) {
  const safeTotalMs = Math.max(1, Number(totalMs) || 1);
  const safeElapsedMs = clampTimelineValue(elapsedMs, 0, safeTotalMs);
  const safeIntroMs = clampTimelineValue(whiteMs, 0, safeTotalMs);
  const remainingAfterIntroMs = Math.max(0, safeTotalMs - safeIntroMs);
  const safeRevealMs = clampTimelineValue(revealMs, 0, remainingAfterIntroMs);
  const remainingBeforeRevealMs = Math.max(0, remainingAfterIntroMs - safeRevealMs);
  const safeFinalGrowMs = clampTimelineValue(flashMs, 0, remainingBeforeRevealMs);
  const oscillationMs = Math.max(0, remainingBeforeRevealMs - safeFinalGrowMs);
  const safeSwapCount = Math.max(1, Math.round(Number(swapCount) || 1));
  const pulseDurationsMs = buildEvolutionPulseDurations(oscillationMs, safeSwapCount);
  const oscillationEndMs = safeIntroMs + oscillationMs;
  const finalGrowEndMs = oscillationEndMs + safeFinalGrowMs;

  const result = {
    stage: "complete",
    elapsedMs: safeElapsedMs,
    introMs: safeIntroMs,
    oscillationMs,
    finalGrowMs: safeFinalGrowMs,
    revealMs: safeRevealMs,
    pulseCount: safeSwapCount,
    pulseDurationsMs,
    pulseIndex: pulseDurationsMs.length > 0 ? pulseDurationsMs.length - 1 : 0,
    pulseRatio: 1,
    dominantSprite: "to",
    fromAlpha: 0,
    fromScale: 0.36,
    fromWhiteRatio: 1,
    toAlpha: 1,
    toScale: 1.16,
    toWhiteRatio: 0,
    orbAlpha: 0.18,
    orbRadiusRatio: 0.72,
    energyRatio: 0.68,
    fireworkRatio: 1,
  };

  if (safeElapsedMs < safeIntroMs) {
    const introRatio = safeIntroMs > 0 ? safeElapsedMs / safeIntroMs : 1;
    const introEase = easeInOutTimelineValue(introRatio);
    result.stage = "intro";
    result.dominantSprite = "from";
    result.fromAlpha = 1;
    result.fromScale = 1.04 - introEase * 0.04;
    result.fromWhiteRatio = introEase;
    result.toAlpha = 0;
    result.toScale = 0.38;
    result.toWhiteRatio = 1;
    result.orbAlpha = 0.24 + introEase * 0.28;
    result.orbRadiusRatio = 0.34 + introEase * 0.1;
    result.energyRatio = 0.34 + introEase * 0.26;
    result.fireworkRatio = 0;
    return result;
  }

  if (safeElapsedMs < oscillationEndMs && oscillationMs > 0) {
    const oscillationElapsedMs = safeElapsedMs - safeIntroMs;
    let segmentStartMs = 0;
    let pulseIndex = 0;
    let pulseDurationMs = pulseDurationsMs[0] || oscillationMs;
    for (let index = 0; index < pulseDurationsMs.length; index += 1) {
      const durationMs = pulseDurationsMs[index];
      if (oscillationElapsedMs <= segmentStartMs + durationMs || index === pulseDurationsMs.length - 1) {
        pulseIndex = index;
        pulseDurationMs = durationMs;
        break;
      }
      segmentStartMs += durationMs;
    }
    const pulseRatio = pulseDurationMs > 0
      ? clampTimelineValue((oscillationElapsedMs - segmentStartMs) / pulseDurationMs, 0, 1)
      : 1;
    const pulseEase = easeInOutTimelineValue(pulseRatio);
    const startsFromSprite = pulseIndex % 2 === 0;
    const fromPresence = startsFromSprite ? 1 - pulseEase : pulseEase;
    const toPresence = 1 - fromPresence;
    const pulseWave = Math.sin(pulseRatio * Math.PI);

    result.stage = "oscillate";
    result.pulseIndex = pulseIndex;
    result.pulseRatio = pulseRatio;
    result.dominantSprite = toPresence >= fromPresence ? "to" : "from";
    result.fromAlpha = 0.16 + fromPresence * 0.84;
    result.fromScale = 0.34 + fromPresence * 0.74;
    result.fromWhiteRatio = 1;
    result.toAlpha = 0.16 + toPresence * 0.84;
    result.toScale = 0.34 + toPresence * 0.74;
    result.toWhiteRatio = 1;
    result.orbAlpha = 0.42 + pulseWave * 0.22;
    result.orbRadiusRatio = 0.42 + pulseWave * 0.1;
    result.energyRatio = 0.62 + pulseWave * 0.22;
    result.fireworkRatio = 0;
    return result;
  }

  if (safeElapsedMs < finalGrowEndMs && safeFinalGrowMs > 0) {
    const finalGrowRatio = safeFinalGrowMs > 0 ? (safeElapsedMs - oscillationEndMs) / safeFinalGrowMs : 1;
    const finalGrowEase = easeInOutTimelineValue(finalGrowRatio);
    result.stage = "finalGrow";
    result.dominantSprite = "to";
    result.fromAlpha = 0.12 * (1 - finalGrowEase);
    result.fromScale = 0.5 - finalGrowEase * 0.14;
    result.fromWhiteRatio = 1;
    result.toAlpha = 0.78 + finalGrowEase * 0.22;
    result.toScale = 0.98 + finalGrowEase * 0.18;
    result.toWhiteRatio = 1;
    result.orbAlpha = 0.7 + finalGrowEase * 0.18;
    result.orbRadiusRatio = 0.5 + finalGrowEase * 0.16;
    result.energyRatio = 0.84 + finalGrowEase * 0.12;
    result.fireworkRatio = 0;
    return result;
  }

  const revealRatio = safeRevealMs > 0
    ? clampTimelineValue((safeElapsedMs - finalGrowEndMs) / safeRevealMs, 0, 1)
    : 1;
  const revealEase = easeInOutTimelineValue(revealRatio);
  result.stage = safeElapsedMs >= safeTotalMs ? "complete" : "reveal";
  result.dominantSprite = "to";
  result.fromAlpha = 0;
  result.fromScale = 0.36;
  result.fromWhiteRatio = 1;
  result.toAlpha = 1;
  result.toScale = 1.08 + revealEase * 0.08;
  result.toWhiteRatio = 1 - revealEase;
  result.orbAlpha = (1 - revealEase) * 0.52;
  result.orbRadiusRatio = 0.66 + revealEase * 0.08;
  result.energyRatio = 0.86 - revealEase * 0.24;
  result.fireworkRatio = revealRatio;
  return result;
}

export const RUNTIME_RENDER_BINDING_KEYS = Object.freeze([
  "BALL_CONFIG_BY_TYPE",
  "BALL_OVERLAY_UI_STYLE_BY_TYPE",
  "BALL_OVERLAY_UI_STYLE_DEFAULT",
  "BREATH_AMPLITUDE_VARIATION",
  "BREATH_BASE_AMPLITUDE",
  "BREATH_MAX_PERIOD_MS",
  "BREATH_MIN_PERIOD_MS",
  "BREATH_OFFSET_RATIO",
  "BREATH_SECONDARY_WEIGHT",
  "BREATH_SIDE_COMPENSATION",
  "CAPTURE_FAIL_BREAK_MS",
  "CAPTURE_FAIL_REAPPEAR_MS",
  "CAPTURE_SHAKE_MS",
  "CAPTURE_SUCCESS_BURST_MS",
  "CAPTURE_THROW_MS",
  "DEFAULT_ROUTE_ID",
  "DEV_LAYOUT_SETTINGS_DEFAULTS",
  "DISPLAY_APP_VERSION",
  "ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER",
  "ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER",
  "ENEMY_TIMER_STYLE_ONLY_ONE",
  "EVOLUTION_ANIM_BACKDROP_FADE_MS",
  "EVOLUTION_ANIM_FLASH_MS",
  "EVOLUTION_ANIM_REVEAL_MS",
  "EVOLUTION_ANIM_SWAP_COUNT",
  "EVOLUTION_ANIM_TOTAL_MS",
  "EVOLUTION_ANIM_WHITE_MS",
  "FLOATING_TEXT_TONE_CRITICAL",
  "FLOATING_TEXT_TONE_MISS",
  "FLOATING_TEXT_TONE_NORMAL",
  "LAYOUT_RECOMPUTE_INTERVAL_MS",
  "LEGENDARY_FIELD_VFX_THEME_BY_KEY",
  "MAX_LEVEL",
  "MAX_TEAM_SIZE",
  "MORPHING_COLORIZE_FALLBACK_RGB",
  "MORPHING_MOTION_INTENSITY",
  "MORPHING_OUTLINE_ALPHA",
  "MORPHING_OUTLINE_PX",
  "MORPHING_OUTLINE_RGB",
  "MORPHING_SLIME_ALPHA",
  "MORPHING_SLIME_BASE_RGB",
  "MORPHING_SLIME_HIGHLIGHT_RGB",
  "MORPHING_WOBBLE_OFFSET_RATIO",
  "MORPHING_WOBBLE_ROTATION_DEG",
  "MORPHING_WOBBLE_SCALE_AMPLITUDE",
  "MORPHING_WOBBLE_SHEAR",
  "MORPHING_WOBBLE_VERTICAL_COMPENSATION",
  "POKEMON_BACKDROP_ALPHA",
  "POKEMON_BACKDROP_RADIUS_RATIO",
  "POKEMON_SHADOW_ALPHA",
  "PROJECTILE_VISUAL_PROFILE",
  "SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG",
  "TARGET_FRAME_MS",
  "TEAM_SPRITE_SCALE",
  "TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER",
  "ULTRA_SHINY_HUE_CYCLE_MS",
  "ULTRA_SHINY_OUTLINE_PX",
  "ULTRA_SHINY_SCINTILLATION_FLASH_MS",
  "ULTRA_SHINY_SCINTILLATION_PERIOD_MS",
  "actionDockEl",
  "actionDockPokeballToggleButtonEl",
  "blendRgb",
  "clamp",
  "coinsValueEl",
  "ctx",
  "drawEnemyDefensiveTypeHud",
  "drawRetroHudPanel",
  "drawTeamTypeHud",
  "easeInOutSine",
  "formatCompactNumber",
  "gameOverlayEl",
  "getBackgroundDriftOffset",
  "getBackgroundDriftRangePx",
  "getBallInventoryOverlayRows",
  "getCachedSpriteImage",
  "getDrawableImageDimensions",
  "getEntityOffensiveType",
  "getEnvironmentSnapshotForRender",
  "getFamilyShinyCaptureCount",
  "getFamilyUltraShinyCaptureCount",
  "getFloatingTextTonePalette",
  "getLegendaryFieldPresence",
  "getMorphingPaletteMappedTexture",
  "getNextRouteId",
  "getPokemonEntityRecord",
  "getPokemonSpriteRenderSize",
  "getRenderQualitySettings",
  "getRouteDisplayName",
  "getRouteUnlockProgressState",
  "getRouteZoneType",
  "getTeamAuraAttackBonusBySlot",
  "getTypeColor",
  "getUltraShinyOutlineTexture",
  "hashStringToUnit",
  "isCoarsePointerDevice",
  "isCurrentRouteCombatEnabled",
  "isDrawableImage",
  "isEntityUnlocked",
  "isEvolutionFamilyOwned",
  "isLikelySmartphoneBrowser",
  "lerpNumber",
  "moneyPillEl",
  "moneyValueEl",
  "normalizeRgbColor",
  "normalizeType",
  "pseudoRandomUnit",
  "resolveEntitySpriteDrawSource",
  "rgba",
  "routeNavCurrentEl",
  "routeNavDrawerToggleButtonEl",
  "routeNavDrawerToggleCountEl",
  "routeNavPanelEl",
  "routeNavRegionEl",
  "saveBackendValueEl",
  "shouldAllowDevLayoutOverflowPositions",
  "shouldFlipTeamSprite",
  "shouldForceUltraShinyAllPokemon",
  "shouldRenderAmbientOverlays",
  "shouldRenderCelebrationParticles",
  "spriteOutlineTintBufferCanvas",
  "spriteOutlineTintBufferCtx",
  "spriteTintBufferCanvas",
  "spriteTintBufferCtx",
  "state",
  "topbarBallsPillEl",
  "toSafeInt",
  "uiTopbarEl",
  "zoneActionButtonsById",
]);

export function createRuntimeRenderSystem(options = {}) {
  const scope = getRuntimeSystemBindings(options);
  const {
    Array,
    BALL_CONFIG_BY_TYPE,
    BALL_OVERLAY_UI_STYLE_BY_TYPE,
    BALL_OVERLAY_UI_STYLE_DEFAULT,
    BREATH_AMPLITUDE_VARIATION,
    BREATH_BASE_AMPLITUDE,
    BREATH_MAX_PERIOD_MS,
    BREATH_MIN_PERIOD_MS,
    BREATH_OFFSET_RATIO,
    BREATH_SECONDARY_WEIGHT,
    BREATH_SIDE_COMPENSATION,
    Boolean,
    CAPTURE_FAIL_BREAK_MS,
    CAPTURE_FAIL_REAPPEAR_MS,
    CAPTURE_SHAKE_MS,
    CAPTURE_SUCCESS_BURST_MS,
    CAPTURE_THROW_MS,
    DEFAULT_ROUTE_ID,
    DEV_LAYOUT_SETTINGS_DEFAULTS,
    DISPLAY_APP_VERSION,
    ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER,
    ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER,
    ENEMY_TIMER_STYLE_ONLY_ONE,
    EVOLUTION_ANIM_BACKDROP_FADE_MS,
    EVOLUTION_ANIM_FLASH_MS,
    EVOLUTION_ANIM_REVEAL_MS,
    EVOLUTION_ANIM_SWAP_COUNT,
    EVOLUTION_ANIM_TOTAL_MS,
    EVOLUTION_ANIM_WHITE_MS,
    Element,
    FLOATING_TEXT_TONE_CRITICAL,
    FLOATING_TEXT_TONE_MISS,
    FLOATING_TEXT_TONE_NORMAL,
    LAYOUT_RECOMPUTE_INTERVAL_MS,
    LEGENDARY_FIELD_VFX_THEME_BY_KEY,
    MAX_LEVEL,
    MAX_TEAM_SIZE,
    MORPHING_COLORIZE_FALLBACK_RGB,
    MORPHING_MOTION_INTENSITY,
    MORPHING_OUTLINE_ALPHA,
    MORPHING_OUTLINE_PX,
    MORPHING_OUTLINE_RGB,
    MORPHING_SLIME_ALPHA,
    MORPHING_SLIME_BASE_RGB,
    MORPHING_SLIME_HIGHLIGHT_RGB,
    MORPHING_WOBBLE_OFFSET_RATIO,
    MORPHING_WOBBLE_ROTATION_DEG,
    MORPHING_WOBBLE_SCALE_AMPLITUDE,
    MORPHING_WOBBLE_SHEAR,
    MORPHING_WOBBLE_VERTICAL_COMPENSATION,
    Math,
    Number,
    Object,
    OffscreenCanvas,
    POKEMON_BACKDROP_ALPHA,
    POKEMON_BACKDROP_RADIUS_RATIO,
    POKEMON_SHADOW_ALPHA,
    PROJECTILE_VISUAL_PROFILE,
    SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG,
    String,
    TARGET_FRAME_MS,
    TEAM_SPRITE_SCALE,
    TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER,
    ULTRA_SHINY_HUE_CYCLE_MS,
    ULTRA_SHINY_OUTLINE_PX,
    ULTRA_SHINY_SCINTILLATION_FLASH_MS,
    ULTRA_SHINY_SCINTILLATION_PERIOD_MS,
    actionDockEl,
    actionDockPokeballToggleButtonEl,
    blendRgb,
    clamp,
    coinsValueEl,
    ctx,
    document,
    drawEnemyDefensiveTypeHud,
    drawRetroHudPanel,
    drawTeamTypeHud,
    easeInOutSine,
    formatCompactNumber,
    gameOverlayEl,
    getBackgroundDriftOffset,
    getBackgroundDriftRangePx,
    getBallInventoryOverlayRows,
    getCachedSpriteImage,
    getDrawableImageDimensions,
    getEntityOffensiveType,
    getEnvironmentSnapshotForRender,
    getFamilyShinyCaptureCount,
    getFamilyUltraShinyCaptureCount,
    getFloatingTextTonePalette,
    getLegendaryFieldPresence,
    getMorphingPaletteMappedTexture,
    getNextRouteId,
    getPokemonEntityRecord,
    getPokemonSpriteRenderSize,
    getRenderQualitySettings,
    getRouteDisplayName,
    getRouteUnlockProgressState,
    getRouteZoneType,
    getTeamAuraAttackBonusBySlot,
    getTypeColor,
    getUltraShinyOutlineTexture,
    hashStringToUnit,
    isCoarsePointerDevice,
    isCurrentRouteCombatEnabled,
    isDrawableImage,
    isEntityUnlocked,
    isEvolutionFamilyOwned,
    isLikelySmartphoneBrowser,
    lerpNumber,
    moneyPillEl,
    moneyValueEl,
    normalizeRgbColor,
    normalizeType,
    parseFloat,
    pseudoRandomUnit,
    resolveEntitySpriteDrawSource,
    rgba,
    routeNavCurrentEl,
    routeNavDrawerToggleButtonEl,
    routeNavDrawerToggleCountEl,
    routeNavPanelEl,
    routeNavRegionEl,
    saveBackendValueEl,
    shouldAllowDevLayoutOverflowPositions,
    shouldFlipTeamSprite,
    shouldForceUltraShinyAllPokemon,
    shouldRenderAmbientOverlays,
    shouldRenderCelebrationParticles,
    spriteOutlineTintBufferCanvas,
    spriteOutlineTintBufferCtx,
    spriteTintBufferCanvas,
    spriteTintBufferCtx,
    state,
    topbarBallsPillEl,
    toSafeInt,
    uiTopbarEl,
    zoneActionButtonsById,
    undefined,
    window
  } = scope;
const laserCurvePointBuffer = [];
const laserRibbonPointBuffer = [];
const laserMirrorRibbonPointBuffer = [];
const laserRenderBudgetScratch = {};
const laserVisibleSegmentScratch = {};
const projectileSpriteAtlasCache = new Map();
const projectileTrailStampCache = new Map();
const projectileSpriteCacheStats = { hits: 0, misses: 0 };
const projectileTrailCacheStats = { hits: 0, misses: 0 };
const laserTextureCacheStats = { hits: 0, misses: 0 };
const CUSTOM_VFX_ASSET_ROOT = "assets/vfx-custom";

function normalizeCustomVfxAssetToken(value, fallback = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function getDrawableCustomVfxImage(imagePath) {
  if (!imagePath) {
    return null;
  }
  const image = getCachedSpriteImage(imagePath);
  return isDrawableImage(image) ? image : null;
}

function buildCustomProjectileSpriteAssetPath(typeName, variantIndex = 0) {
  const safeType = normalizeType(typeName || "normal");
  const safeVariant = Math.max(0, toSafeInt(variantIndex, 0));
  return `${CUSTOM_VFX_ASSET_ROOT}/projectiles/${safeType}/variant-${safeVariant}.png`;
}

function getCustomProjectileSpriteOverride(typeName, variantIndex = 0) {
  const safeVariant = Math.max(0, toSafeInt(variantIndex, 0));
  const directImage = getDrawableCustomVfxImage(buildCustomProjectileSpriteAssetPath(typeName, safeVariant));
  if (directImage) {
    return directImage;
  }
  if (safeVariant <= 0) {
    return null;
  }
  return getDrawableCustomVfxImage(buildCustomProjectileSpriteAssetPath(typeName, 0));
}

function buildCustomProjectileTrailAssetPath(typeName, trailStampKind = "") {
  const safeType = normalizeType(typeName || "normal");
  const safeKind = normalizeCustomVfxAssetToken(trailStampKind);
  return safeKind
    ? `${CUSTOM_VFX_ASSET_ROOT}/projectile-trails/${safeType}/stamp-${safeKind}.png`
    : `${CUSTOM_VFX_ASSET_ROOT}/projectile-trails/${safeType}/stamp.png`;
}

function getCustomProjectileTrailOverride(typeName, trailStampKind = "") {
  const typedStamp = getDrawableCustomVfxImage(buildCustomProjectileTrailAssetPath(typeName, trailStampKind));
  if (typedStamp) {
    return typedStamp;
  }
  if (!trailStampKind) {
    return null;
  }
  return getDrawableCustomVfxImage(buildCustomProjectileTrailAssetPath(typeName));
}

function buildCustomLaserBeamAssetPath(typeName, beamPattern = "") {
  const safeType = normalizeType(typeName || "normal");
  const safePattern = normalizeCustomVfxAssetToken(beamPattern);
  return safePattern
    ? `${CUSTOM_VFX_ASSET_ROOT}/lasers/${safeType}/beam-${safePattern}.png`
    : `${CUSTOM_VFX_ASSET_ROOT}/lasers/${safeType}/beam.png`;
}

function getCustomLaserBeamTexture(profile) {
  const safeType = normalizeType(profile?.type || "normal");
  const typedBeam = getDrawableCustomVfxImage(buildCustomLaserBeamAssetPath(safeType, profile?.beamPattern || ""));
  if (typedBeam) {
    return typedBeam;
  }
  if (!profile?.beamPattern) {
    return null;
  }
  return getDrawableCustomVfxImage(buildCustomLaserBeamAssetPath(safeType));
}

function getVfxRenderDebugState() {
  if (!state || typeof state !== "object") {
    return null;
  }
  if (!state.vfxRenderDebug || typeof state.vfxRenderDebug !== "object") {
    state.vfxRenderDebug = {
      qualityTier: "low",
      projectile: {
        activeCount: 0,
        stampDrawCount: 0,
        trailStampDrawCount: 0,
        spriteCacheSize: 0,
        spriteCacheHits: 0,
        spriteCacheMisses: 0,
        trailCacheSize: 0,
        trailCacheHits: 0,
        trailCacheMisses: 0,
      },
      laser: {
        activeCount: 0,
        renderPathCounts: {
          packed_simple: 0,
          pixel_curved: 0,
          hero_curved: 0,
        },
        segmentCount: 0,
        particleCount: 0,
        textureCacheSize: 0,
        textureCacheHits: 0,
        textureCacheMisses: 0,
      },
    };
  }
  return state.vfxRenderDebug;
}

function snapVfxPixel(value) {
  const step = Math.max(1, Number(COMBAT_VFX_CONFIG.pixelSnapStepPx) || 1);
  const numeric = Number(value) || 0;
  return Math.round(numeric / step) * step;
}

function setCanvasImageSmoothing(renderCtx, enabled) {
  if (!renderCtx || typeof renderCtx !== "object") {
    return;
  }
  if ("imageSmoothingEnabled" in renderCtx) {
    renderCtx.imageSmoothingEnabled = Boolean(enabled);
  }
}

function createVfxRuntimeCanvas(width, height) {
  const safeWidth = Math.max(1, Math.round(Number(width) || 0));
  const safeHeight = Math.max(1, Math.round(Number(height) || 0));
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(safeWidth, safeHeight);
  }
  if (typeof document === "object" && document && typeof document.createElement === "function") {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = safeWidth;
    canvasEl.height = safeHeight;
    return canvasEl;
  }
  return null;
}

const PROJECTILE_PIXEL_PATTERN_BY_KIND = Object.freeze({
  neutral_orb: Object.freeze([
    "...g...",
    "..gbg..",
    ".gbabg.",
    ".bbhbb.",
    ".gbabg.",
    "..gbg..",
    "...s...",
  ]),
  ember_comet: Object.freeze([
    "...g...",
    "..gah..",
    "..bab..",
    ".abbh..",
    ".bbhh..",
    "..bb...",
    "...s...",
  ]),
  pressure_drop: Object.freeze([
    "...h...",
    "..hah..",
    "..bab..",
    ".gbab..",
    ".gbbb..",
    "..bbb..",
    "...s...",
  ]),
  seed_leaf: Object.freeze([
    "...h...",
    "..hah..",
    ".abbb..",
    ".bbb...",
    "..bbb..",
    "...ba..",
    "...s...",
  ]),
  zig_bolt: Object.freeze([
    "..hh...",
    "..ab...",
    ".abb...",
    "...bb..",
    "..bb...",
    "..ba...",
    ".s.....",
  ]),
  ice_crystal: Object.freeze([
    "...h...",
    "..hah..",
    ".a.b.a.",
    "..bbb..",
    ".a.b.a.",
    "..sbs..",
    "...s...",
  ]),
  rock_chunk: Object.freeze([
    "..ss...",
    ".sbbb..",
    ".bbbba.",
    ".bbbab.",
    "..bbb..",
    "...ba..",
    "...s...",
  ]),
  earth_clod: Object.freeze([
    ".sss...",
    ".bbb...",
    "bbbba..",
    ".bbba..",
    "..bbb..",
    "...bb..",
    "...s...",
  ]),
  steel_rivet: Object.freeze([
    "..hhh..",
    ".hbbbh.",
    ".bbabb.",
    ".bbbbb.",
    ".bbabb.",
    ".hbbbh.",
    "..sss..",
  ]),
  poison_blob: Object.freeze([
    "..gg...",
    ".gaba..",
    ".abbba.",
    ".bbbba.",
    ".abbba.",
    "..bbb..",
    "...s...",
  ]),
  bug_stinger: Object.freeze([
    "..hh...",
    ".hbbb..",
    ".bbbba.",
    "..bbb..",
    ".abb...",
    ".b.....",
    ".s.....",
  ]),
  ghost_wisp: Object.freeze([
    "..gg...",
    ".gabh..",
    ".abbb..",
    ".bbbha.",
    ".abb...",
    "..bb...",
    "...s...",
  ]),
  shadow_orb: Object.freeze([
    "..gg...",
    ".gbbg..",
    ".bbbba.",
    ".bbbbb.",
    ".abbbb.",
    "..bbb..",
    "...s...",
  ]),
  sigil_orb: Object.freeze([
    "..hhh..",
    ".habah.",
    ".abbbb.",
    ".bbbba.",
    ".abbba.",
    ".hbbbh.",
    "..sss..",
  ]),
  dragon_fang: Object.freeze([
    "...h...",
    "..hah..",
    ".hbbb..",
    ".bbbba.",
    "..bbb..",
    "..bb...",
    "..s....",
  ]),
  petal_star: Object.freeze([
    "...h...",
    ".hahah.",
    "..bbb..",
    ".ababa.",
    "..bbb..",
    ".hahah.",
    "...s...",
  ]),
  feather_gust: Object.freeze([
    "..hh...",
    ".hbbb..",
    ".bbb...",
    ".abb...",
    "..bbb..",
    "...bb..",
    "....s..",
  ]),
  impact_fist: Object.freeze([
    "..hhh..",
    ".hbbbh.",
    ".bbabb.",
    ".bbbbb.",
    ".abbbb.",
    ".bbb...",
    "..ss...",
  ]),
});

const TRAIL_PIXEL_PATTERN_BY_KIND = Object.freeze({
  neutral_streak: Object.freeze([
    ".....",
    ".gb..",
    ".bbb.",
    "..ba.",
    ".....",
  ]),
  ember_spark: Object.freeze([
    "..h..",
    ".bab.",
    "..bb.",
    "...s.",
    ".....",
  ]),
  water_bead: Object.freeze([
    "..h..",
    ".bab.",
    ".bbb.",
    "..s..",
    ".....",
  ]),
  leaf_chip: Object.freeze([
    "..h..",
    ".abb.",
    ".bbb.",
    "..ba.",
    "...s.",
  ]),
  volt_spark: Object.freeze([
    "..h..",
    ".ab..",
    "..bb.",
    ".ba..",
    ".s...",
  ]),
  ice_shard: Object.freeze([
    "..h..",
    ".aba.",
    "..b..",
    ".sbs.",
    ".....",
  ]),
  debris_chunk: Object.freeze([
    ".ss..",
    ".bbb.",
    ".bba.",
    "..b..",
    ".....",
  ]),
  earth_lift: Object.freeze([
    ".ss..",
    ".bbb.",
    "bbba.",
    ".bb..",
    ".....",
  ]),
  metal_shard: Object.freeze([
    "..h..",
    ".bbb.",
    ".bab.",
    ".sbs.",
    ".....",
  ]),
  toxic_blob: Object.freeze([
    ".gg..",
    ".bab.",
    ".bbb.",
    "..s..",
    ".....",
  ]),
  swarm_chip: Object.freeze([
    "..h..",
    ".bbb.",
    "..ab.",
    ".s...",
    ".....",
  ]),
  spectral_wisp: Object.freeze([
    ".gg..",
    ".bab.",
    ".bbb.",
    "..ba.",
    "...s.",
  ]),
  shadow_lash: Object.freeze([
    ".gg..",
    ".bbb.",
    "..bb.",
    "...a.",
    "...s.",
  ]),
  rune_shard: Object.freeze([
    "..h..",
    ".bab.",
    ".bbb.",
    "..ab.",
    "..s..",
  ]),
  sigil_ring: Object.freeze([
    ".hhh.",
    ".bab.",
    ".bbb.",
    ".aba.",
    ".sss.",
  ]),
  petal_sparkle: Object.freeze([
    "..h..",
    ".aba.",
    "..b..",
    ".aha.",
    "..s..",
  ]),
  gust_slash: Object.freeze([
    "..h..",
    ".bbb.",
    ".ab..",
    "..bb.",
    "...s.",
  ]),
  impact_lane: Object.freeze([
    ".hhh.",
    ".bbb.",
    ".bab.",
    "..bb.",
    "..ss.",
  ]),
});

function getPixelPatternRowWidth(patternRows) {
  return patternRows.reduce((max, row) => Math.max(max, String(row || "").length), 0);
}

function resolveProjectilePixelPattern(kind, variantIndex = 0) {
  const basePattern = PROJECTILE_PIXEL_PATTERN_BY_KIND[kind] || PROJECTILE_PIXEL_PATTERN_BY_KIND.neutral_orb;
  if (Math.abs(toSafeInt(variantIndex, 0)) % 2 !== 1) {
    return basePattern;
  }
  return basePattern.map((row) => String(row).split("").reverse().join(""));
}

function resolveTrailPixelPattern(kind) {
  return TRAIL_PIXEL_PATTERN_BY_KIND[kind] || TRAIL_PIXEL_PATTERN_BY_KIND.neutral_streak;
}

function drawPixelPattern(renderCtx, patternRows, palette, drawSizePx, options = {}) {
  const rows = Array.isArray(patternRows) ? patternRows : [];
  if (!renderCtx || rows.length <= 0) {
    return 0;
  }
  const gridWidth = Math.max(1, getPixelPatternRowWidth(rows));
  const gridHeight = Math.max(1, rows.length);
  const maxGridSpan = Math.max(gridWidth, gridHeight);
  const safeDrawSize = Math.max(4, Math.round(Number(drawSizePx) || 0));
  const baseCellSize = Math.max(1, Math.floor(safeDrawSize / maxGridSpan));
  const scaleMul = clamp(Number(options.scaleMul) || 1, 0.5, 2.5);
  const cellSize = Math.max(1, Math.round(baseCellSize * scaleMul));
  const drawWidth = gridWidth * cellSize;
  const drawHeight = gridHeight * cellSize;
  const offsetX = Math.floor((safeDrawSize - drawWidth) * 0.5) + toSafeInt(options.offsetXPx, 0);
  const offsetY = Math.floor((safeDrawSize - drawHeight) * 0.5) + toSafeInt(options.offsetYPx, 0);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = String(rows[rowIndex] || "");
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const token = row[colIndex];
      const fillStyle = palette[token];
      if (!fillStyle) {
        continue;
      }
      renderCtx.fillStyle = fillStyle;
      renderCtx.fillRect(
        offsetX + colIndex * cellSize,
        offsetY + rowIndex * cellSize,
        cellSize,
        cellSize,
      );
    }
  }
  return cellSize;
}

function buildProjectilePixelPalette(profile, baseRgb) {
  const bodyRgb = blendRgb(baseRgb, profile.glow, 0.16);
  const accentRgb = blendRgb(bodyRgb, profile.accent, 0.6);
  const highlightRgb = blendRgb(profile.highlight, [255, 255, 255], 0.28);
  const glowAlpha = clamp(Number(COMBAT_VFX_CONFIG.projectileGlowAlpha) || 0.1, 0.04, 0.22);
  const shadowRgb = blendRgb(bodyRgb, [10, 14, 20], 0.72);
  return {
    s: rgba(shadowRgb, 0.94),
    g: rgba(profile.glow, glowAlpha),
    b: rgba(bodyRgb, 0.98),
    a: rgba(accentRgb, 0.98),
    h: rgba(highlightRgb, 0.98),
  };
}

function buildTrailPixelPalette(typeRgb, profile, trailColor) {
  const accentRgb = blendRgb(trailColor, profile.accent, 0.5);
  const shadowRgb = blendRgb(trailColor, [12, 16, 20], 0.74);
  return {
    s: rgba(shadowRgb, 0.86),
    g: rgba(profile.accent, 0.14),
    b: rgba(trailColor, 0.94),
    a: rgba(accentRgb, 0.94),
    h: rgba(blendRgb(profile.accent, [255, 255, 255], 0.35), 0.96),
  };
}

function snapVfxDimension(value, minimum = 1) {
  const safeMinimum = Math.max(1, toSafeInt(minimum, 1));
  return Math.max(safeMinimum, snapVfxPixel(Math.max(safeMinimum, Number(value) || 0)));
}

function buildSquareRadius(radius) {
  const safeRadius = Math.max(1, Number(radius) || 0);
  return Math.max(2, snapVfxDimension(safeRadius * 2, 2));
}

function drawPixelChunkBurst(x, y, size, fillStyle, accentStyle = null) {
  const chunkSize = buildSquareRadius(size);
  const half = Math.floor(chunkSize * 0.5);
  const centerX = snapVfxPixel(x);
  const centerY = snapVfxPixel(y);
  ctx.fillStyle = fillStyle;
  ctx.fillRect(centerX - half, centerY - half, chunkSize, chunkSize);
  if (accentStyle) {
    const accentSize = Math.max(1, Math.floor(chunkSize * 0.5));
    ctx.fillStyle = accentStyle;
    ctx.fillRect(centerX - accentSize, centerY - accentSize, accentSize, accentSize);
    ctx.fillRect(centerX, centerY, accentSize, accentSize);
  }
}

function drawPixelBurstRing(x, y, size, strokeStyle) {
  const ringSize = Math.max(4, snapVfxDimension(size * 2.2, 4));
  const half = Math.floor(ringSize * 0.5);
  const left = snapVfxPixel(x) - half;
  const top = snapVfxPixel(y) - half;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = Math.max(1, snapVfxDimension(ringSize * 0.1, 1));
  ctx.strokeRect(left, top, ringSize, ringSize);
}

function traceLaserSteppedPath(points) {
  if (!Array.isArray(points) || points.length <= 0) {
    return;
  }
  ctx.beginPath();
  let prevX = snapVfxPixel(points[0].x);
  let prevY = snapVfxPixel(points[0].y);
  ctx.moveTo(prevX, prevY);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const snappedX = snapVfxPixel(point.x);
    const snappedY = snapVfxPixel(point.y);
    if (snappedX === prevX && snappedY === prevY) {
      continue;
    }
    const deltaX = snappedX - prevX;
    const deltaY = snappedY - prevY;
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      if (snappedX !== prevX) {
        ctx.lineTo(snappedX, prevY);
      }
      if (snappedY !== prevY) {
        ctx.lineTo(snappedX, snappedY);
      }
    } else {
      if (snappedY !== prevY) {
        ctx.lineTo(prevX, snappedY);
      }
      if (snappedX !== prevX) {
        ctx.lineTo(snappedX, snappedY);
      }
    }
    prevX = snappedX;
    prevY = snappedY;
  }
}

function getReusableLaserPoint(buffer, index) {
  if (!buffer[index]) {
    buffer[index] = { x: 0, y: 0, offset: 0 };
  }
  return buffer[index];
}

function getBattleViewportProfile(width, height) {
  const safeWidth = Math.max(1, Number(width) || 0);
  const safeHeight = Math.max(1, Number(height) || 0);
  const portrait = safeHeight > safeWidth * 1.05;
  const coarsePointer = isCoarsePointerDevice();
  const runtimeSmartphone = typeof isLikelySmartphoneBrowser === "function" && isLikelySmartphoneBrowser();
  const compact = coarsePointer || runtimeSmartphone || safeWidth <= 900 || safeHeight <= 640;
  const phoneLikeViewport = isPhoneLikeViewport(safeWidth, safeHeight, { mobileSignal: runtimeSmartphone });
  const phone = compact && phoneLikeViewport;
  return {
    coarsePointer,
    compact,
    phone,
    portrait,
  };
}

function getTeamSpriteScale(layout = state.layout) {
  const viewportProfile = layout?.viewportProfile || {};
  const multiplier = viewportProfile.compact ? TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER : 1;
  const devScale = viewportProfile.phone
    ? 1
    : Math.max(0.2, Number(state.devLayout?.settings?.allySpriteScale || 1));
  return TEAM_SPRITE_SCALE * multiplier * devScale;
}

function getEnemySpriteRenderSize(layout = state.layout, baseSize = 0) {
  const safeBaseSize = Math.max(0, Number(baseSize) || 0);
  if (safeBaseSize <= 0) {
    return 0;
  }
  const viewportProfile = layout?.viewportProfile || {};
  const multiplier = viewportProfile.compact ? ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER : 1;
  const devScale = viewportProfile.phone
    ? 1
    : Math.max(0.2, Number(state.devLayout?.settings?.enemySpriteScale || 1));
  return safeBaseSize * multiplier * ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER * devScale;
}

function getOverlayPaddingSnapshot() {
  if (!gameOverlayEl || typeof window.getComputedStyle !== "function") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const styles = window.getComputedStyle(gameOverlayEl);
  return {
    top: Math.max(0, parseFloat(styles.paddingTop || "0") || 0),
    right: Math.max(0, parseFloat(styles.paddingRight || "0") || 0),
    bottom: Math.max(0, parseFloat(styles.paddingBottom || "0") || 0),
    left: Math.max(0, parseFloat(styles.paddingLeft || "0") || 0),
  };
}

function getElementClientHeight(element) {
  if (!(element instanceof Element)) {
    return 0;
  }
  const rect = element.getBoundingClientRect();
  return Math.max(0, Number(rect?.height) || 0);
}

function getRootCssPixelValue(name) {
  if (!name || !document?.documentElement || typeof window?.getComputedStyle !== "function") {
    return 0;
  }
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
  return Math.max(0, parseFloat(value || "0") || 0);
}

function getRuntimeShellMetricHeight(element, cssVariableName) {
  return getRootCssPixelValue(cssVariableName) || getElementClientHeight(element);
}

function buildArcSlotPositions({ count, axis, spreadMain, arcDepth, baseX, baseY }) {
  const positions = [];
  if (count <= 0) {
    return positions;
  }
  const steps = [];
  if (count === 1) {
    steps.push(0);
  } else {
    for (let i = 0; i < count; i += 1) {
      steps.push((i / (count - 1)) * 2 - 1);
    }
  }
  for (let i = 0; i < count; i += 1) {
    const t = steps[i] ?? 0;
    if (axis === "x") {
      positions.push({
        x: baseX + (Number(spreadMain) || 0) * t,
        y: baseY + (Number(arcDepth) || 0) * (1 - Math.abs(t)),
      });
    } else {
      positions.push({
        x: baseX + (Number(arcDepth) || 0) * (1 - Math.abs(t)),
        y: baseY + (Number(spreadMain) || 0) * t,
      });
    }
  }
  return positions;
}

function buildTownTeamSlots({
  profile,
  playLeft,
  playRight,
  playTop,
  playBottom,
  teamSize,
  teamHudWidth,
  teamHudHeight,
  teamTypeChipHeight,
  cardMargin,
}) {
  const slots = [];
  const safeWidth = Math.max(180, playRight - playLeft);
  const safeHeight = Math.max(180, playBottom - playTop);
  if (profile.phone) {
    const x = playRight - teamSize * 0.88;
    const topStart = playTop + teamSize * 0.92;
    const bottomEnd = playBottom - teamSize * 0.92;
    const step = MAX_TEAM_SIZE <= 1 ? 0 : (bottomEnd - topStart) / Math.max(1, MAX_TEAM_SIZE - 1);
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const y = topStart + step * i;
      const hudWidth = clamp(teamHudWidth * 0.98, 74, Math.min(176, safeWidth * 0.56));
      const hudCenterX = clamp(
        x - teamSize * 0.84 - hudWidth * 0.5,
        playLeft + hudWidth * 0.5 + cardMargin,
        playRight - hudWidth * 0.5 - cardMargin,
      );
      const hudCenterY = clamp(
        y - teamSize * 0.42,
        playTop + teamTypeChipHeight + teamHudHeight * 0.5 + cardMargin,
        playBottom - teamHudHeight * 0.5 - cardMargin,
      );
      slots.push({
        x,
        y,
        size: teamSize,
        hudCenterX,
        hudCenterY,
        hudTopY: hudCenterY - teamHudHeight * 0.5,
        hudWidth,
        hudHeight: teamHudHeight,
        hudTypeChipHeight: teamTypeChipHeight,
        hudDirectionX: -1,
        hudDirectionY: 0,
      });
    }
    return slots;
  }

  const y = playBottom - teamSize * 0.9;
  const startX = playLeft + teamSize * 0.92;
  const endX = playRight - teamSize * 0.92;
  const step = MAX_TEAM_SIZE <= 1 ? 0 : (endX - startX) / Math.max(1, MAX_TEAM_SIZE - 1);
  for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
    const x = startX + step * i;
    const hudWidth = clamp(teamHudWidth * 1.04, 90, Math.min(188, safeWidth * 0.24));
    const hudCenterX = clamp(
      x,
      playLeft + hudWidth * 0.5 + cardMargin,
      playRight - hudWidth * 0.5 - cardMargin,
    );
    const hudCenterY = clamp(
      y - teamSize * 0.96 - teamHudHeight * 0.5,
      playTop + teamTypeChipHeight + teamHudHeight * 0.5 + cardMargin,
      playBottom - teamHudHeight * 0.5 - cardMargin,
    );
    slots.push({
      x,
      y,
      size: teamSize,
      hudCenterX,
      hudCenterY,
      hudTopY: hudCenterY - teamHudHeight * 0.5,
      hudWidth,
      hudHeight: teamHudHeight,
      hudTypeChipHeight: teamTypeChipHeight,
      hudDirectionX: 0,
      hudDirectionY: -1,
    });
  }
  return slots;
}

function computeLayout() {
  const width = Math.max(260, Number(state.viewport.width) || 0);
  const height = Math.max(220, Number(state.viewport.height) || 0);
  const profile = getBattleViewportProfile(width, height);
  const overlayPadding = getOverlayPaddingSnapshot();
  const topHudHeight =
    getRuntimeShellMetricHeight(uiTopbarEl, "--ui-runtime-topbar-height-px")
    || clamp(height * (profile.phone ? 0.17 : profile.compact ? 0.13 : 0.1), 54, profile.phone ? 122 : 92);
  const bottomHudHeight =
    getRuntimeShellMetricHeight(actionDockEl, "--ui-runtime-dock-height-px")
    || clamp(height * (profile.phone ? 0.1 : profile.compact ? 0.085 : 0.072), 44, profile.phone ? 74 : 64);

  let safeTop = overlayPadding.top + topHudHeight + (profile.phone ? 8 : profile.compact ? 12 : 14);
  let safeBottom = overlayPadding.bottom + bottomHudHeight + (profile.phone ? 8 : profile.compact ? 10 : 12);
  const maxReservedVertical = height * (profile.phone ? 0.4 : profile.compact ? 0.34 : 0.29);
  const reservedVertical = safeTop + safeBottom;
  if (reservedVertical > maxReservedVertical && reservedVertical > 0) {
    const ratio = maxReservedVertical / reservedVertical;
    safeTop *= ratio;
    safeBottom *= ratio;
  }

  safeTop = clamp(safeTop, 40, height * (profile.phone ? 0.25 : 0.2));
  safeBottom = clamp(safeBottom, 40, height * (profile.phone ? 0.27 : 0.2));

  const sideInset = profile.phone ? 8 : profile.compact ? 12 : 18;
  const leftInset = clamp(overlayPadding.left + sideInset, 8, width * 0.14);
  const rightInset = clamp(overlayPadding.right + sideInset, 8, width * 0.14);
  const playLeft = leftInset;
  const playRight = Math.max(playLeft + 180, width - rightInset);
  const playTop = safeTop;
  const playBottom = Math.max(playTop + 180, height - safeBottom);
  const playWidth = Math.max(180, playRight - playLeft);
  const playHeight = Math.max(180, playBottom - playTop);
  const centerX = playLeft + playWidth * 0.5;
  let centerY = playTop + playHeight * 0.5;
  const useSplitRows = profile.phone || (profile.compact && profile.portrait);
  let enemySize = clamp(
    Math.min(playWidth, playHeight) * (useSplitRows ? 0.236 : profile.compact ? 0.278 : 0.305),
    useSplitRows ? 84 : 118,
    useSplitRows ? 168 : 236,
  );
  if (profile.phone) {
    enemySize = Math.min(196, enemySize * 1.16);
  }
  const teamSize = clamp(
    enemySize * (useSplitRows ? 0.58 : profile.compact ? 0.6 : 0.62),
    useSplitRows ? 56 : 72,
    useSplitRows ? 106 : 130,
  );
  const teamHudScale = profile.phone ? 1 : profile.compact ? 1.05 : profile.portrait ? 1.18 : 1.34;
  const teamHudBaseWidth = teamSize * (useSplitRows ? 1.14 : profile.compact ? 1.2 : 1.27);
  const teamHudBaseHeight = teamSize * (useSplitRows ? 0.5 : 0.52);
  const teamHudWidth = clamp(
    teamHudBaseWidth * teamHudScale,
    64,
    useSplitRows ? 86 : 172,
  );
  const teamHudHeight = clamp(
    teamHudBaseHeight * teamHudScale,
    24,
    useSplitRows ? 34 : 66,
  );
  const teamTypeChipHeight = clamp(teamSize * 0.17, 11, 18);
  const cardMargin = 6;
  const routeCombatEnabled = isCurrentRouteCombatEnabled();
  const teamSlots = [];
  const devLayoutSettings = state.devLayout?.settings || DEV_LAYOUT_SETTINGS_DEFAULTS;
  const usePhoneRowsLayout = Boolean(profile.phone);
  const enemyCenterYOffset = usePhoneRowsLayout
    ? 0
    : Number(devLayoutSettings.enemyCenterYOffset || 0);
  const allyRingYOffset = usePhoneRowsLayout
    ? 0
    : Number(devLayoutSettings.allyRingYOffset || 0);
  const arcRotationDeg = usePhoneRowsLayout
    ? 0
    : Number(devLayoutSettings.arcRotationDeg || 0);
  const arcSpreadScale = Math.max(
    0.2,
    Number(usePhoneRowsLayout ? 1 : (devLayoutSettings.arcSpreadScale || 1)),
  );
  const arcRadiusScale = Math.max(
    0.2,
    Number(usePhoneRowsLayout ? 1 : (devLayoutSettings.arcRadiusScale || 1)),
  );
  const hudXOffset = usePhoneRowsLayout ? 0 : Number(devLayoutSettings.hudXOffset || 0);
  const hudYOffset = usePhoneRowsLayout ? 0 : Number(devLayoutSettings.hudYOffset || 0);
  const hudDepthScale = usePhoneRowsLayout ? 1 : Math.max(0.1, Number(devLayoutSettings.hudDepthScale || 1));
  const enemyUiYOffset = usePhoneRowsLayout ? 0 : Number(devLayoutSettings.enemyUiYOffset || 0);
  const allowOverflowPositions = shouldAllowDevLayoutOverflowPositions();

  if (!routeCombatEnabled) {
    const townTeamSize = clamp(
      Math.min(
        playWidth / (profile.phone ? 4.9 : 7.3),
        playHeight / (profile.phone ? 8.6 : 4.8),
      ),
      profile.phone ? 56 : 70,
      profile.phone ? 94 : 112,
    );
    const townHudWidth = clamp(
      teamHudBaseWidth * (profile.phone ? 0.92 : 1.08),
      profile.phone ? 74 : 94,
      profile.phone ? 154 : 188,
    );
    const townHudHeight = clamp(
      teamHudBaseHeight * (profile.phone ? 0.94 : 1.04),
      profile.phone ? 24 : 26,
      profile.phone ? 40 : 52,
    );
    return {
      centerX: playLeft + playWidth * 0.5,
      centerY: playTop + playHeight * 0.48,
      enemyImpactX: playLeft + playWidth * 0.5,
      enemyImpactY: playTop + playHeight * 0.48,
      enemySize: 0,
      hpBarWidth: 0,
      hpBarHeight: 0,
      hpBarY: playTop + playHeight * 0.5,
      enemyNameTopY: playTop + playHeight * 0.5,
      enemyNamePlateWidth: 0,
      enemyTypeHudY: playTop + playHeight * 0.5,
      viewportProfile: profile,
      safeBounds: {
        top: playTop,
        bottom: playBottom,
        left: playLeft,
        right: playRight,
        width: playWidth,
        height: playHeight,
      },
      teamSlots: buildTownTeamSlots({
        profile,
        playLeft,
        playRight,
        playTop,
        playBottom,
        teamSize: townTeamSize,
        teamHudWidth: townHudWidth,
        teamHudHeight: townHudHeight,
        teamTypeChipHeight: clamp(townTeamSize * 0.16, 11, 18),
        cardMargin,
      }),
      townLayoutMode: profile.phone ? "mobile_right_column" : "desktop_bottom_row",
    };
  }

  const centerYBaseRatio = useSplitRows
    ? 0.64
    : profile.compact
      ? 0.62
      : 0.6;
  const centerYRaw = usePhoneRowsLayout
    ? height * 0.49 + enemyCenterYOffset
    : playTop + playHeight * centerYBaseRatio + enemyCenterYOffset;
  centerY = usePhoneRowsLayout
    ? centerYRaw
    : allowOverflowPositions
      ? centerYRaw
      : clamp(centerYRaw, playTop + enemySize * 1.02, playBottom - enemySize * 0.9);

  if (usePhoneRowsLayout) {
    const rowCount = Math.ceil(MAX_TEAM_SIZE / 2);
    const halfSpread = Math.min(playWidth * 0.34, enemySize * 1.95 + teamSize * 0.85);
    const topRowY = height * 0.34;
    const bottomRowY = height * 0.74;
    const slotBoundsLeft = playLeft + teamSize * 0.6;
    const slotBoundsRight = playRight - teamSize * 0.6;
    const slotBoundsTop = playTop + teamSize * 0.56;
    const slotBoundsBottom = playBottom - teamSize * 0.56;

    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const row = i < rowCount ? 0 : 1;
      const col = i % rowCount;
      const t = rowCount <= 1 ? 0 : (col / (rowCount - 1)) * 2 - 1;
      const xRaw = centerX + t * halfSpread;
      const yRaw = row === 0 ? topRowY : bottomRowY;
      const x = xRaw;
      const y = yRaw;
      const dirX = t === 0 ? (row === 0 ? -1 : 1) : Math.sign(t);
      const dirY = row === 0 ? -1 : 1;
      let hudCenterX = x + dirX * (teamSize * 0.16) + hudXOffset;
      let hudCenterY = y + (
        row === 0
          ? -(teamSize * 0.86 + teamHudHeight * 0.58)
          : (teamSize * 0.8 + teamHudHeight * 0.42)
      ) + hudYOffset;
      if (!allowOverflowPositions) {
        hudCenterX = clamp(
          hudCenterX,
          playLeft + teamHudWidth * 0.5 + cardMargin,
          playRight - teamHudWidth * 0.5 - cardMargin,
        );
        hudCenterY = clamp(
          hudCenterY,
          playTop + teamTypeChipHeight + teamHudHeight * 0.5 + cardMargin,
          playBottom - teamHudHeight * 0.5 - cardMargin,
        );
      }
      const cardTopY = hudCenterY - teamHudHeight * 0.5;
      teamSlots.push({
        x,
        y,
        size: teamSize,
        hudCenterX,
        hudCenterY,
        hudTopY: cardTopY,
        hudWidth: teamHudWidth,
        hudHeight: teamHudHeight,
        hudTypeChipHeight: teamTypeChipHeight,
        hudDirectionX: dirX,
        hudDirectionY: dirY,
      });
    }
  } else {
    const slotBoundsLeft = playLeft + teamSize * 0.6;
    const slotBoundsRight = playRight - teamSize * 0.6;
    const slotBoundsTop = playTop + teamSize * 0.56;
    const slotBoundsBottom = centerY - enemySize * 0.58;
    const baseArcStartDeg = useSplitRows ? 204 : profile.compact ? 206 : 208;
    const baseArcEndDeg = useSplitRows ? 336 : profile.compact ? 334 : 332;
    const baseArcCenterDeg = (baseArcStartDeg + baseArcEndDeg) * 0.5;
    const baseArcSpreadDeg = baseArcEndDeg - baseArcStartDeg;
    const arcCenterDeg = baseArcCenterDeg + arcRotationDeg;
    const arcSpreadDegRaw = baseArcSpreadDeg * arcSpreadScale;
    const arcSpreadDeg = allowOverflowPositions ? Math.max(4, arcSpreadDegRaw) : clamp(arcSpreadDegRaw, 48, 178);
    const arcStartDeg = arcCenterDeg - arcSpreadDeg * 0.5;
    const arcEndDeg = arcCenterDeg + arcSpreadDeg * 0.5;
    const arcStart = (arcStartDeg * Math.PI) / 180;
    const arcEnd = (arcEndDeg * Math.PI) / 180;
    const arcSpan = Math.max(0.01, arcEnd - arcStart);
    const preferredRadius = enemySize * (useSplitRows ? 1.58 : profile.compact ? 1.54 : 1.5) * arcRadiusScale;
    let slotRadius = Math.max(teamSize * 0.2, preferredRadius);
    if (!allowOverflowPositions) {
      const arcStartCosAbs = Math.max(0.001, Math.abs(Math.cos(arcStart)));
      const arcEndCosAbs = Math.max(0.001, Math.abs(Math.cos(arcEnd)));
      const arcEdgeSinAbs = Math.max(0.001, Math.abs(Math.sin(arcStart)));
      const radiusMaxByLeft = Math.max(0, (centerX - slotBoundsLeft) / arcStartCosAbs);
      const radiusMaxByRight = Math.max(0, (slotBoundsRight - centerX) / arcEndCosAbs);
      const radiusMaxByTop = Math.max(0, centerY - slotBoundsTop);
      const radiusCap = Math.max(teamSize * 1.35, Math.min(radiusMaxByLeft, radiusMaxByRight, radiusMaxByTop));
      const radiusMinByEnemyClearance = Math.max(0, (centerY - slotBoundsBottom) / arcEdgeSinAbs);
      const radiusFloor = Math.max(enemySize * 1.15, teamSize * 1.8, radiusMinByEnemyClearance);
      slotRadius = radiusFloor > radiusCap ? radiusCap : clamp(preferredRadius, radiusFloor, radiusCap);
    }

    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const t = MAX_TEAM_SIZE <= 1 ? 0.5 : i / (MAX_TEAM_SIZE - 1);
      const angle = arcStart + arcSpan * t;
      const xRaw = centerX + Math.cos(angle) * slotRadius;
      const yRaw = centerY + Math.sin(angle) * slotRadius + allyRingYOffset;
      const x = allowOverflowPositions ? xRaw : clamp(xRaw, slotBoundsLeft, slotBoundsRight);
      const y = allowOverflowPositions ? yRaw : clamp(yRaw, slotBoundsTop, slotBoundsBottom);
      const dirX = Math.sign(Math.cos(angle)) || (i < MAX_TEAM_SIZE * 0.5 ? -1 : 1);
      const centerProximity = 1 - Math.abs(2 * t - 1);
      const dirY = 1;
      let hudCenterX = x + dirX * (teamSize * (useSplitRows ? 0.2 : 0.14)) + hudXOffset;
      const radialDepthOffset = (1 - centerProximity) * teamHudHeight * (useSplitRows ? 1.15 : 0.58) * hudDepthScale;
      let hudCenterY = y + (
        teamSize * (useSplitRows ? 0.86 : 0.82)
        + teamHudHeight * (useSplitRows ? 0.44 : 0.42)
        + radialDepthOffset
      ) + hudYOffset;
      if (!allowOverflowPositions) {
        hudCenterX = clamp(
          hudCenterX,
          playLeft + teamHudWidth * 0.5 + cardMargin,
          playRight - teamHudWidth * 0.5 - cardMargin,
        );
        hudCenterY = clamp(
          hudCenterY,
          playTop + teamTypeChipHeight + teamHudHeight * 0.5 + cardMargin,
          Math.min(playBottom - teamHudHeight * 0.5 - cardMargin, centerY - enemySize * 0.12),
        );
      }
      const cardTopY = hudCenterY - teamHudHeight * 0.5;
      teamSlots.push({
        x,
        y,
        size: teamSize,
        hudCenterX,
        hudCenterY,
        hudTopY: cardTopY,
        hudWidth: teamHudWidth,
        hudHeight: teamHudHeight,
        hudTypeChipHeight: teamTypeChipHeight,
        hudDirectionX: dirX,
        hudDirectionY: dirY,
      });
    }
  }

  const hpBarWidth = clamp(
    enemySize * (useSplitRows ? 1.04 : 1.14),
    useSplitRows ? 124 : 154,
    useSplitRows ? 196 : 272,
  );
  const hpBarHeight = clamp(enemySize * 0.06, 9, 14);
  const enemyImpactX = centerX;
  const enemyImpactYRaw = centerY + enemySize * (useSplitRows ? 0.04 : 0.03) + enemyUiYOffset;
  const enemyImpactY = allowOverflowPositions
    ? enemyImpactYRaw
    : clamp(enemyImpactYRaw, playTop + enemySize * 0.22, playBottom - enemySize * 0.22);
  const enemyUiTop = centerY + enemySize * (useSplitRows ? 0.66 : 0.62) + enemyUiYOffset;
  const hpBarMinY = centerY + enemySize * 0.42;
  const hpBarMaxY = playBottom - (useSplitRows ? 98 : 114);
  const hpBarY = allowOverflowPositions
    ? enemyUiTop
    : clamp(enemyUiTop, Math.min(hpBarMinY, hpBarMaxY), Math.max(hpBarMinY, hpBarMaxY));
  const enemyNameMinY = hpBarY + hpBarHeight + 6;
  const enemyNameMaxY = playBottom - (useSplitRows ? 70 : 78);
  const enemyNameTopYRaw = hpBarY + hpBarHeight + (useSplitRows ? 8 : 10);
  const enemyNameTopY = allowOverflowPositions
    ? enemyNameTopYRaw
    : clamp(enemyNameTopYRaw, Math.min(enemyNameMinY, enemyNameMaxY), Math.max(enemyNameMinY, enemyNameMaxY));
  const enemyTypeMinY = enemyNameTopY + 14;
  const enemyTypeMaxY = playBottom - 14;
  const enemyTypeHudYRaw = enemyNameTopY + (useSplitRows ? 22 : 24);
  const enemyTypeHudY = allowOverflowPositions
    ? enemyTypeHudYRaw
    : clamp(enemyTypeHudYRaw, Math.min(enemyTypeMinY, enemyTypeMaxY), Math.max(enemyTypeMinY, enemyTypeMaxY));

  return {
    centerX,
    centerY,
    enemyImpactX,
    enemyImpactY,
    enemySize,
    hpBarWidth,
    hpBarHeight,
    hpBarY,
    enemyNameTopY,
    enemyNamePlateWidth: clamp(
      useSplitRows
        ? Math.max(hpBarWidth * 0.9, playWidth * 0.56)
        : hpBarWidth * 0.74,
      useSplitRows ? 126 : 108,
      Math.min(useSplitRows ? 236 : 224, Math.max(108, playWidth - 12)),
    ),
    enemyTypeHudY,
    viewportProfile: profile,
    safeBounds: {
      top: playTop,
      bottom: playBottom,
      left: playLeft,
      right: playRight,
      width: playWidth,
      height: playHeight,
    },
    teamSlots,
  };
}

function refreshLayoutIfNeeded(options = {}) {
  const force = options?.force === true;
  const nowMsRaw = options?.nowMs;
  const nowMs = Number.isFinite(nowMsRaw) ? Math.max(0, Number(nowMsRaw)) : Math.max(0, Number(state.timeMs) || 0);
  const viewportWidth = Math.max(0, Number(state.viewport?.width) || 0);
  const viewportHeight = Math.max(0, Number(state.viewport?.height) || 0);
  const refresh = state.layoutRefresh || {};
  const viewportChanged =
    viewportWidth !== Math.max(0, Number(refresh.viewportWidth) || 0)
    || viewportHeight !== Math.max(0, Number(refresh.viewportHeight) || 0);
  const dueAt = Math.max(0, Number(refresh.nextRecomputeAtMs) || 0);
  if (!force && state.layout && !viewportChanged && nowMs < dueAt) {
    return state.layout;
  }

  state.layout = computeLayout();
  state.layoutRefresh = {
    viewportWidth,
    viewportHeight,
    nextRecomputeAtMs: nowMs + LAYOUT_RECOMPUTE_INTERVAL_MS,
  };
  return state.layout;
}

function getShinySparkleCountForQuality() {
  const quality = String(state.performance?.quality || "medium");
  if (quality === "very_low") {
    return 2;
  }
  if (quality === "low") {
    return 3;
  }
  if (quality === "medium") {
    return 5;
  }
  return 8;
}

function drawShinySparkles(size, seed = 0, alpha = 1) {
  const sparkleCount = getShinySparkleCountForQuality();
  const safeAlpha = clamp(Number(alpha), 0, 1);
  if (safeAlpha <= 0.02) {
    return;
  }

  const timeSeconds = state.timeMs / 1000;
  const useSimpleSparkles = sparkleCount <= 3;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < sparkleCount; i += 1) {
    const phase = seed * 0.37 + i * 0.91;
    const orbitX = size * (0.36 + (i % 3) * 0.08);
    const orbitY = size * (0.28 + ((i + 1) % 3) * 0.07);
    const angle = timeSeconds * (0.8 + (i % 4) * 0.17) + phase;
    const px = Math.cos(angle) * orbitX;
    const py = Math.sin(angle * 1.18) * orbitY - size * 0.12;
    const twinkle = 0.4 + 0.6 * Math.sin(timeSeconds * 4.2 + phase * 2.4);
    const radius = 0.9 + twinkle * 1.7;
    const glowRadius = radius * 3.3;
    const color = i % 2 === 0 ? "255, 240, 174" : "212, 243, 255";

    if (!useSimpleSparkles) {
      const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
      glow.addColorStop(0, `rgba(${color}, ${0.75 * safeAlpha})`);
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${0.88 * safeAlpha})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function getUltraShinyShaderConfig(seed = 0) {
  const cycleMs = Math.max(400, ULTRA_SHINY_HUE_CYCLE_MS);
  const seededOffsetMs = (Math.abs(Number(seed) || 0) * 193.137) % cycleMs;
  const ratio = ((state.timeMs + seededOffsetMs) % cycleMs) / cycleMs;
  const wave = Math.sin(ratio * Math.PI * 2);
  const pulse = Math.sin(ratio * Math.PI * 4 + 0.8);
  return {
    hueRotateDeg: ratio * 360,
    saturate: clamp(1.38 + wave * 0.2, 1.05, 1.75),
    brightness: clamp(1.06 + pulse * 0.08, 0.95, 1.22),
    contrast: clamp(1.08 + wave * 0.06, 0.96, 1.24),
  };
}

function drawUltraShinyOutline(image, drawX, drawY, drawWidth, drawHeight, outlinePx = ULTRA_SHINY_OUTLINE_PX, alpha = 1) {
  if (!isDrawableImage(image)) {
    return;
  }
  const safeAlpha = clamp(Number(alpha), 0, 1);
  if (safeAlpha <= 0.01) {
    return;
  }
  const rawOutline = Number(outlinePx);
  const safeOutline = Number.isFinite(rawOutline) ? rawOutline : ULTRA_SHINY_OUTLINE_PX;
  // Keep width fully controllable: 0 disables outline, tiny values stay tiny.
  if (safeOutline <= 0.001) {
    return;
  }
  const texture = getUltraShinyOutlineTexture(image, drawWidth, drawHeight, safeOutline);
  if (!texture) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = safeAlpha;
  const wasSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(texture.canvas, drawX - texture.pad, drawY - texture.pad);
  ctx.imageSmoothingEnabled = wasSmoothing;
  ctx.restore();
}

function drawMorphingOutline(
  image,
  drawX,
  drawY,
  drawWidth,
  drawHeight,
  options = {},
) {
  if (!isDrawableImage(image) || !spriteOutlineTintBufferCtx) {
    return;
  }
  const safeAlpha = clamp(Number(options.alpha ?? MORPHING_OUTLINE_ALPHA), 0, 1);
  if (safeAlpha <= 0.01) {
    return;
  }
  const safeOutline = Math.max(0, Number(options.outlinePx ?? MORPHING_OUTLINE_PX) || MORPHING_OUTLINE_PX);
  if (safeOutline <= 0.001) {
    return;
  }
  const outlineRgb = normalizeRgbColor(options.color, MORPHING_OUTLINE_RGB);
  const texture = getUltraShinyOutlineTexture(image, drawWidth, drawHeight, safeOutline);
  if (!texture?.canvas) {
    return;
  }

  const textureCanvas = texture.canvas;
  const textureWidth = Math.max(1, toSafeInt(textureCanvas.width, 1));
  const textureHeight = Math.max(1, toSafeInt(textureCanvas.height, 1));
  if (
    spriteOutlineTintBufferCanvas.width !== textureWidth
    || spriteOutlineTintBufferCanvas.height !== textureHeight
  ) {
    spriteOutlineTintBufferCanvas.width = textureWidth;
    spriteOutlineTintBufferCanvas.height = textureHeight;
  }

  const tintCtx = spriteOutlineTintBufferCtx;
  const previousTintSmoothing = tintCtx.imageSmoothingEnabled;
  tintCtx.setTransform(1, 0, 0, 1, 0, 0);
  tintCtx.globalAlpha = 1;
  tintCtx.globalCompositeOperation = "source-over";
  tintCtx.imageSmoothingEnabled = false;
  tintCtx.clearRect(0, 0, textureWidth, textureHeight);
  tintCtx.drawImage(textureCanvas, 0, 0);
  tintCtx.globalCompositeOperation = "source-in";
  tintCtx.fillStyle = `rgba(${outlineRgb[0]}, ${outlineRgb[1]}, ${outlineRgb[2]}, 1)`;
  tintCtx.fillRect(0, 0, textureWidth, textureHeight);
  tintCtx.globalCompositeOperation = "source-over";
  tintCtx.imageSmoothingEnabled = previousTintSmoothing;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = safeAlpha;
  const previousSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spriteOutlineTintBufferCanvas, drawX - texture.pad, drawY - texture.pad);
  ctx.imageSmoothingEnabled = previousSmoothing;
  ctx.restore();
}

function drawMorphingSlimeEffect(size, seed = 0, alpha = 1) {
  const safeSize = Number(size) || 0;
  const safeAlpha = clamp(Number(alpha), 0, 1);
  if (safeSize <= 1 || safeAlpha <= 0.01) {
    return;
  }

  const time = state.timeMs * 0.0032 + Number(seed || 0) * 0.77;
  const motionScale = MORPHING_MOTION_INTENSITY;
  const radiusX = safeSize * 0.29;
  const topY = -safeSize * 0.06;
  const baseY = safeSize * 0.11;
  const dripAmplitude = safeSize * 0.165 * motionScale;
  const segmentCount = 16;
  const bodyAlpha = safeAlpha * MORPHING_SLIME_ALPHA * (0.92 + 0.08 * Math.sin(time * 1.1));

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.moveTo(-radiusX, topY);
  ctx.quadraticCurveTo(0, -safeSize * 0.22, radiusX, topY);
  for (let i = segmentCount; i >= 0; i -= 1) {
    const ratio = i / segmentCount;
    const x = lerpNumber(-radiusX, radiusX, ratio);
    const wave = Math.sin(time * 1.35 + ratio * Math.PI * 3.6 + seed * 0.19) * safeSize * 0.018 * motionScale;
    const dripNoise = Math.max(0, Math.sin(time * 1.9 + ratio * Math.PI * 7.2 + seed * 0.41));
    const dripShape = dripNoise * dripNoise;
    const edgeBias = 1 - Math.abs(ratio - 0.5) * 2;
    const drip = dripAmplitude * dripShape * (0.42 + edgeBias * 0.58);
    const y = baseY + wave + drip;
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  const slimeGradient = ctx.createLinearGradient(0, topY - safeSize * 0.12, 0, baseY + dripAmplitude * 1.25);
  slimeGradient.addColorStop(
    0,
    `rgba(${MORPHING_SLIME_HIGHLIGHT_RGB[0]}, ${MORPHING_SLIME_HIGHLIGHT_RGB[1]}, ${MORPHING_SLIME_HIGHLIGHT_RGB[2]}, ${(bodyAlpha * 0.82).toFixed(3)})`,
  );
  slimeGradient.addColorStop(
    1,
    `rgba(${MORPHING_SLIME_BASE_RGB[0]}, ${MORPHING_SLIME_BASE_RGB[1]}, ${MORPHING_SLIME_BASE_RGB[2]}, ${bodyAlpha.toFixed(3)})`,
  );
  ctx.fillStyle = slimeGradient;
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 238, 255, ${(safeAlpha * 0.2).toFixed(3)})`;
  ctx.lineWidth = Math.max(1, safeSize * 0.018);
  ctx.stroke();

  const dropletCount = 3;
  for (let i = 0; i < dropletCount; i += 1) {
    const ratio = (i + 1) / (dropletCount + 1);
    const drift = Math.sin(time * 1.6 + i * 1.17 + seed * 0.13) * safeSize * 0.012 * motionScale;
    const phase = ((time * 0.37 + i * 0.29 + seed * 0.07) % 1 + 1) % 1;
    const x = lerpNumber(-radiusX * 0.72, radiusX * 0.72, ratio) + drift;
    const y = baseY + safeSize * (0.08 + phase * 0.17 * motionScale);
    const radius = safeSize * (0.027 + (1 - phase) * 0.012);
    const dropAlpha = safeAlpha * 0.2 * (1 - phase * 0.55);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${MORPHING_SLIME_BASE_RGB[0]}, ${MORPHING_SLIME_BASE_RGB[1]}, ${MORPHING_SLIME_BASE_RGB[2]}, ${dropAlpha.toFixed(3)})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = `rgba(${MORPHING_SLIME_HIGHLIGHT_RGB[0]}, ${MORPHING_SLIME_HIGHLIGHT_RGB[1]}, ${MORPHING_SLIME_HIGHLIGHT_RGB[2]}, ${(dropAlpha * 0.55).toFixed(3)})`;
    ctx.arc(x - radius * 0.22, y - radius * 0.26, Math.max(0.5, radius * 0.36), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function getMorphingWobbleTransform(entity, size) {
  const safeSize = Math.max(1, Number(size) || 0);
  const motionScale = MORPHING_MOTION_INTENSITY;
  const seed =
    Number(entity?.id || 0) * 0.71
    + Number(entity?.morphingSourceId || 0) * 1.17
    + hashStringToUnit(String(entity?.spriteVariantId || "default")) * 37;
  const t = state.timeMs * 0.0054;
  const primary = Math.sin(t + seed);
  const secondary = Math.sin(t * 1.73 + seed * 0.63);
  const tertiary = Math.sin(t * 2.41 + seed * 1.17);
  const squashWave = primary * 0.7 + secondary * 0.3;
  const scaleX = clamp(1 + (squashWave * MORPHING_WOBBLE_SCALE_AMPLITUDE + tertiary * 0.03) * motionScale, 0.82, 1.28);
  const scaleY = clamp(
    1 - (squashWave * MORPHING_WOBBLE_VERTICAL_COMPENSATION + tertiary * 0.018) * motionScale,
    0.8,
    1.26,
  );
  const offsetX = safeSize * MORPHING_WOBBLE_OFFSET_RATIO * (primary * 0.7 + secondary * 0.3) * motionScale;
  const offsetY =
    safeSize
    * MORPHING_WOBBLE_OFFSET_RATIO
    * 0.62
    * (secondary * 0.65 - Math.abs(primary) * 0.35)
    * motionScale;
  const rotationRad =
    ((primary * 0.65 + tertiary * 0.35) * MORPHING_WOBBLE_ROTATION_DEG * motionScale * Math.PI) / 180;
  const shearX = clamp((secondary * 0.75 + tertiary * 0.25) * MORPHING_WOBBLE_SHEAR * motionScale, -0.24, 0.24);
  return {
    scaleX,
    scaleY,
    offsetX,
    offsetY,
    rotationRad,
    shearX,
  };
}

function drawUltraShinyScintillation(size, seed = 0, alpha = 1) {
  const safeAlpha = clamp(Number(alpha), 0, 1);
  if (safeAlpha <= 0.02) {
    return;
  }
  const periodMs = Math.max(300, ULTRA_SHINY_SCINTILLATION_PERIOD_MS);
  const flashWindowMs = clamp(ULTRA_SHINY_SCINTILLATION_FLASH_MS, 40, periodMs);
  const seededOffsetMs = (Math.abs(Number(seed) || 0) * 151.73) % periodMs;
  const phaseMs = (state.timeMs + seededOffsetMs) % periodMs;
  if (phaseMs > flashWindowMs) {
    return;
  }

  const ratio = phaseMs / flashWindowMs;
  const pulse = Math.sin(ratio * Math.PI);
  const travelAngle = seed * 0.61 + state.timeMs * 0.0023;
  const px = Math.cos(travelAngle) * size * 0.24;
  const py = Math.sin(travelAngle * 1.29) * size * 0.17 - size * 0.19;
  const glowRadius = size * (0.08 + pulse * 0.11);
  const lineLength = size * (0.09 + pulse * 0.14);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(px, py);
  ctx.rotate(seed * 0.17 + state.timeMs * 0.0017);

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
  glow.addColorStop(0, `rgba(255, 255, 255, ${(0.75 + pulse * 0.2) * safeAlpha})`);
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 255, 255, ${(0.46 + pulse * 0.52) * safeAlpha})`;
  ctx.lineWidth = Math.max(1.1, size * 0.015 * (0.9 + pulse));
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI / 4) * i;
    const dx = Math.cos(angle) * lineLength;
    const dy = Math.sin(angle) * lineLength;
    ctx.beginPath();
    ctx.moveTo(-dx, -dy);
    ctx.lineTo(dx, dy);
    ctx.stroke();
  }

  ctx.restore();
}

function getPokemonBreathTransform(entity, size, slotIndex = 0, options = {}) {
  if (!entity || !Number.isFinite(size) || size <= 0 || options.active === false) {
    return { scaleX: 1, scaleY: 1, offsetY: 0 };
  }

  const seedKey = `${Number(entity?.id || 0)}:${Number(slotIndex) || 0}:${String(entity?.spriteVariantId || "default")}`;
  const periodMs = lerpNumber(
    BREATH_MIN_PERIOD_MS,
    BREATH_MAX_PERIOD_MS,
    hashStringToUnit(`${seedKey}:period`),
  );
  const amplitude = clamp(
    BREATH_BASE_AMPLITUDE + (hashStringToUnit(`${seedKey}:amplitude`) - 0.5) * BREATH_AMPLITUDE_VARIATION,
    0.008,
    0.038,
  );
  const intensity = clamp(Number(options.intensity ?? 1), 0, 1.6);
  const primaryPhase = hashStringToUnit(`${seedKey}:phase_primary`) * Math.PI * 2;
  const secondaryPhase = hashStringToUnit(`${seedKey}:phase_secondary`) * Math.PI * 2;
  const timeRatio = state.timeMs / Math.max(1200, periodMs);
  const primary = Math.sin(timeRatio * Math.PI * 2 + primaryPhase);
  const secondary = Math.sin(timeRatio * Math.PI + secondaryPhase);

  let breath = primary * (1 - BREATH_SECONDARY_WEIGHT) + secondary * BREATH_SECONDARY_WEIGHT;
  // Slightly asymmetric inhale/exhale so it feels organic.
  breath = breath >= 0 ? Math.pow(breath, 1.3) : -Math.pow(-breath, 0.85);

  const breathingAmount = amplitude * intensity * breath;
  const inhale = clamp(breath, 0, 1);
  // Keep a uniform pulse on sprites to avoid aspect-ratio distortion on mobile GPUs.
  const uniformScale = clamp(1 + breathingAmount * (1 - BREATH_SIDE_COMPENSATION * 0.25), 0.94, 1.09);
  const offsetY = -size * BREATH_OFFSET_RATIO * inhale * intensity;
  return { scaleX: uniformScale, scaleY: uniformScale, offsetY };
}

function drawPokemonTerrainShadow(size, options = {}) {
  const safeSize = Number(size);
  if (!Number.isFinite(safeSize) || safeSize <= 0) {
    return;
  }
  const profile = String(options.profile || "team").trim().toLowerCase();
  const spriteAlpha = clamp(Number(options.spriteAlpha ?? 1), 0, 1);
  const baseAlpha = clamp(Number(options.alpha ?? POKEMON_SHADOW_ALPHA), 0, 1);
  const groundOffsetY = Number.isFinite(options.groundOffsetY) ? Number(options.groundOffsetY) : 0;
  const liftPx = Math.max(0, Number.isFinite(options.liftPx) ? Number(options.liftPx) : 0);
  const liftRatio = clamp(liftPx / Math.max(1, safeSize), 0, 1.5);

  let radiusXRatio = 0.34;
  let radiusYRatio = 0.16;
  let centerYRatio = 0.3;
  let profileAlpha = 1;
  if (profile === "enemy") {
    radiusXRatio = 0.37;
    radiusYRatio = 0.17;
    centerYRatio = 0.31;
    profileAlpha = 1.04;
  } else if (profile === "drag") {
    radiusXRatio = 0.31;
    radiusYRatio = 0.145;
    centerYRatio = 0.285;
    profileAlpha = 0.92;
  }

  const finalAlpha = clamp(baseAlpha * spriteAlpha * profileAlpha * (1 - liftRatio * 0.38), 0, 1);
  if (finalAlpha <= 0.01) {
    return;
  }

  const centerYOverride = Number.isFinite(options.centerY) ? Number(options.centerY) : null;
  const centerY = (centerYOverride == null ? safeSize * centerYRatio : centerYOverride) + groundOffsetY + liftPx * 0.2;
  const radiusX = safeSize * radiusXRatio * (1 - liftRatio * 0.08);
  const radiusY = safeSize * radiusYRatio * (1 - liftRatio * 0.42);
  if (!Number.isFinite(radiusX) || !Number.isFinite(radiusY) || radiusX <= 0.01 || radiusY <= 0.01) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const gradient = ctx.createRadialGradient(
    0,
    centerY - radiusY * 0.04,
    Math.max(0.1, radiusY * 0.14),
    0,
    centerY,
    Math.max(radiusX, radiusY),
  );
  gradient.addColorStop(0, `rgba(11, 24, 50, ${(finalAlpha * 0.74).toFixed(3)})`);
  gradient.addColorStop(0.68, `rgba(8, 16, 34, ${(finalAlpha * 0.4).toFixed(3)})`);
  gradient.addColorStop(1, "rgba(5, 9, 18, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPokemonBackdropCircle(x, y, size, options = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0) {
    return;
  }
  const alpha = clamp(Number(options.alpha ?? POKEMON_BACKDROP_ALPHA), 0, 1);
  if (alpha <= 0.001) {
    return;
  }
  const radius = size * POKEMON_BACKDROP_RADIUS_RATIO;
  const centerY = y + size * 0.02;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getHoveredTeamSlotPulse(slotIndex) {
  if (state.ui.hoveredTeamSlotIndex !== clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1)) {
    return 0;
  }
  return 0.76 + (Math.sin(state.timeMs * 0.015 + slotIndex) + 1) * 0.12;
}

function drawTeamHoverIndicator(slot, intensity = 1) {
  if (!slot || intensity <= 0.001) {
    return;
  }
  const centerY = slot.y + slot.size * 0.03;
  const radiusX = slot.size * (0.37 + intensity * 0.02);
  const radiusY = slot.size * (0.29 + intensity * 0.02);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 245, 173, ${(0.18 + intensity * 0.16).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.6, slot.size * 0.038);
  ctx.beginPath();
  ctx.ellipse(slot.x, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 236, 146, ${(0.09 + intensity * 0.08).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(slot.x, centerY, radiusX * 0.78, radiusY * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTeamDragSwapOverlay(layout) {
  if (!layout || !state.ui.teamDragActive || !state.ui.teamDragMoved) {
    return;
  }
  const sourceSlotIndex = clamp(toSafeInt(state.ui.teamDragSourceSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  if (sourceSlotIndex < 0) {
    return;
  }
  const sourceSlot = layout.teamSlots?.[sourceSlotIndex];
  const sourceMember = state.team[sourceSlotIndex];
  if (!sourceSlot || !sourceMember) {
    return;
  }

  const targetSlotIndex = clamp(toSafeInt(state.ui.teamDragTargetSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const targetSlot = targetSlotIndex >= 0 ? layout.teamSlots?.[targetSlotIndex] : null;
  const pointerXRaw = Number(state.ui.teamDragCurrentWorldX);
  const pointerYRaw = Number(state.ui.teamDragCurrentWorldY);
  const pointerX = Number.isFinite(pointerXRaw) ? pointerXRaw : sourceSlot.x;
  const pointerY = Number.isFinite(pointerYRaw) ? pointerYRaw : sourceSlot.y;
  const ghostSize = sourceSlot.size * getTeamSpriteScale(layout);
  const lineTargetX = targetSlot ? targetSlot.x : pointerX;
  const lineTargetY = targetSlot ? targetSlot.y : pointerY;
  const forceUltraShinyAll = shouldForceUltraShinyAllPokemon();

  drawTeamHoverIndicator(sourceSlot, 1.05);
  if (targetSlot) {
    drawTeamHoverIndicator(targetSlot, 1.24);
  }

  ctx.save();
  ctx.strokeStyle = targetSlot ? "rgba(111, 228, 186, 0.84)" : "rgba(143, 200, 255, 0.72)";
  ctx.lineWidth = Math.max(1.6, sourceSlot.size * 0.038);
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(sourceSlot.x, sourceSlot.y);
  ctx.lineTo(lineTargetX, lineTargetY);
  ctx.stroke();
  ctx.restore();

  drawPokemonBackdropCircle(pointerX, pointerY, ghostSize, {
    alpha: 0.32,
  });
  drawPokemonSprite(sourceMember, pointerX, pointerY, ghostSize, {
    alpha: 0.84,
    scaleX: 1.04,
    scaleY: 1.04,
    offsetY: -ghostSize * 0.02,
    shadowProfile: "drag",
    shadowAlpha: 0.42,
    shadowGroundOffsetY: 0,
    shadowLiftPx: ghostSize * 0.1,
    flipX: shouldFlipTeamSprite(targetSlotIndex >= 0 ? targetSlotIndex : sourceSlotIndex, layout),
    shinyVisual: Boolean(forceUltraShinyAll || sourceMember.isShiny || sourceMember.isShinyVisual),
    ultraShinyVisual: Boolean(forceUltraShinyAll || sourceMember.isUltraShiny || sourceMember.isUltraShinyVisual),
    tintBlend: 0.1,
    tintColor: [234, 248, 255],
  });
}

function drawTeamAttackChargeGlow(slot, member, slotIndex = 0, intensity = 0) {
  if (!slot || !member || intensity <= 0.001) {
    return;
  }
  const charge = clamp(Number(intensity) || 0, 0, 1);
  if (charge <= 0.001) {
    return;
  }

  const type = normalizeType(getEntityOffensiveType(member));
  const rgb = getTypeColor(type);
  const centerX = slot.x;
  const centerY = slot.y + slot.size * 0.02;
  const coreRadius = slot.size * (0.34 + charge * 0.08);
  const auraRadius = coreRadius * (1.75 + charge * 0.42);
  const pulse = 0.82 + Math.sin(state.timeMs * 0.02 + slotIndex * 0.73) * 0.18;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const aura = ctx.createRadialGradient(centerX, centerY, coreRadius * 0.16, centerX, centerY, auraRadius);
  aura.addColorStop(0, rgba(rgb, (0.2 + charge * 0.34) * pulse));
  aura.addColorStop(0.48, rgba(rgb, (0.12 + charge * 0.24) * pulse));
  aura.addColorStop(1, rgba(rgb, 0));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rgba(rgb, 0.26 + charge * 0.5);
  ctx.lineWidth = Math.max(1.4, slot.size * (0.016 + charge * 0.008));
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + slot.size * 0.02, coreRadius * 1.08, coreRadius * 0.78, 0, 0, Math.PI * 2);
  ctx.stroke();

  const sparkCount = 3;
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = state.timeMs * 0.008 + slotIndex * 0.48 + i * ((Math.PI * 2) / sparkCount);
    const orbit = coreRadius * (0.9 + charge * 0.36);
    const px = centerX + Math.cos(angle) * orbit;
    const py = centerY + Math.sin(angle * 1.35) * orbit * 0.62;
    const pointSize = slot.size * (0.016 + charge * 0.01);
    const pointGlow = pointSize * 3.2;
    const sparkle = ctx.createRadialGradient(px, py, 0, px, py, pointGlow);
    sparkle.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    sparkle.addColorStop(0.45, rgba(rgb, 0.76));
    sparkle.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = sparkle;
    ctx.beginPath();
    ctx.arc(px, py, pointGlow, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTeamAuraIndicator(slot, member, stackedBonus = 0) {
  if (!slot || !member) {
    return;
  }
  const bonus = Math.max(0, Number(stackedBonus || 0));
  if (bonus <= 0.001) {
    return;
  }

  const [r, g, b] = getTypeColor(getEntityOffensiveType(member));
  const centerY = slot.y + slot.size * 0.03;
  const pulse = 0.5 + Math.sin(state.timeMs * 0.006 + slot.x * 0.021 + slot.y * 0.014) * 0.5;
  const radiusX = slot.size * (0.43 + pulse * 0.05);
  const radiusY = slot.size * (0.31 + pulse * 0.04);
  const alphaBase = clamp(0.08 + bonus * 0.35, 0.08, 0.4);
  const glowRadius = slot.size * (0.52 + pulse * 0.07);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(slot.x, centerY, radiusY * 0.25, slot.x, centerY, glowRadius);
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(alphaBase * 0.95).toFixed(3)})`);
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(slot.x, centerY, glowRadius * 0.95, glowRadius * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alphaBase + pulse * 0.12).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.3, slot.size * (0.022 + bonus * 0.02));
  ctx.beginPath();
  ctx.ellipse(slot.x, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTeamTeleportBoostIndicator(slot, boostMultiplier = 1, visualIntensity = 0) {
  if (!slot) {
    return;
  }
  const boost = Math.max(1, Number(boostMultiplier || 1));
  const extraIntensity = clamp(Number(visualIntensity) || 0, 0, 1);
  if (boost <= 1.001 && extraIntensity <= 0.001) {
    return;
  }

  const [r, g, b] = getTypeColor("psychic");
  const centerX = slot.x;
  const centerY = slot.y + slot.size * 0.02;
  const pulse = 0.5 + Math.sin(state.timeMs * 0.008 + slot.x * 0.014 + slot.y * 0.017) * 0.5;
  const boostPower = clamp((boost - 1) / 0.5, 0, 1);
  const power = clamp(Math.max(extraIntensity, boostPower), 0, 1);
  const ringRadiusX = slot.size * (0.44 + pulse * 0.06 + power * 0.07);
  const ringRadiusY = slot.size * (0.31 + pulse * 0.05 + power * 0.05);
  const alphaBase = clamp(0.2 + power * 0.34, 0.16, 0.58);
  const glowRadius = slot.size * (0.6 + pulse * 0.08 + power * 0.08);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(centerX, centerY, ringRadiusY * 0.2, centerX, centerY, glowRadius);
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(alphaBase * 0.95).toFixed(3)})`);
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, glowRadius * 0.96, glowRadius * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();

  const lift = slot.size * (0.22 + power * 0.04);
  const beam = ctx.createLinearGradient(centerX, centerY + lift, centerX, centerY - lift);
  beam.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
  beam.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, ${(0.2 + power * 0.22).toFixed(3)})`);
  beam.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${(0.2 + power * 0.22).toFixed(3)})`);
  beam.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.strokeStyle = beam;
  ctx.lineWidth = Math.max(2.2, slot.size * (0.032 + power * 0.012));
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + lift);
  ctx.lineTo(centerX, centerY - lift);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alphaBase + pulse * 0.16).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.8, slot.size * 0.028);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  const spinA = state.timeMs * 0.0075;
  const spinB = -state.timeMs * 0.0063;
  ctx.strokeStyle = `rgba(255, 255, 255, ${(0.32 + power * 0.2).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.1, slot.size * 0.018);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, ringRadiusX * 0.78, ringRadiusY * 0.68, spinA, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, ringRadiusX * 0.62, ringRadiusY * 0.52, spinB, 0, Math.PI * 2);
  ctx.stroke();

  const sparkCount = 6;
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = state.timeMs * 0.01 + i * ((Math.PI * 2) / sparkCount);
    const px = centerX + Math.cos(angle) * ringRadiusX * 0.92;
    const py = centerY + Math.sin(angle * 1.25) * ringRadiusY * 0.85;
    const sparkRadius = slot.size * (0.028 + power * 0.008);
    const sparkGlow = ctx.createRadialGradient(px, py, 0, px, py, sparkRadius * 2.8);
    sparkGlow.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    sparkGlow.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.78)`);
    sparkGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = sparkGlow;
    ctx.beginPath();
    ctx.arc(px, py, sparkRadius * 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function getSpriteSnapFactor() {
  const dpr = Number(state.viewport?.dpr || 1);
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

function snapSpriteValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  const snapFactor = getSpriteSnapFactor();
  return Math.round(numericValue * snapFactor) / snapFactor;
}

function snapSpriteDimension(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1;
  }
  const snapFactor = getSpriteSnapFactor();
  const snapped = Math.round(numericValue * snapFactor) / snapFactor;
  return Math.max(1 / snapFactor, snapped);
}

function buildSpriteShaderFilter(shader = null) {
  if (!shader || typeof shader !== "object") {
    return "none";
  }

  const parts = [];
  const hueRotateDeg = Number(shader.hueRotateDeg);
  if (Number.isFinite(hueRotateDeg)) {
    parts.push(`hue-rotate(${hueRotateDeg.toFixed(2)}deg)`);
  }
  const saturate = Number(shader.saturate);
  if (Number.isFinite(saturate) && Math.abs(saturate - 1) > 0.001) {
    parts.push(`saturate(${saturate.toFixed(3)})`);
  }
  const brightness = Number(shader.brightness);
  if (Number.isFinite(brightness) && Math.abs(brightness - 1) > 0.001) {
    parts.push(`brightness(${brightness.toFixed(3)})`);
  }
  const contrast = Number(shader.contrast);
  if (Number.isFinite(contrast) && Math.abs(contrast - 1) > 0.001) {
    parts.push(`contrast(${contrast.toFixed(3)})`);
  }
  const invert = Number(shader.invert);
  if (Number.isFinite(invert) && Math.abs(invert) > 0.001) {
    parts.push(`invert(${clamp(invert, 0, 1).toFixed(3)})`);
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

function mergeSpriteShaderConfig(primaryShader = null, secondaryShader = null) {
  const primary = primaryShader && typeof primaryShader === "object" ? primaryShader : null;
  const secondary = secondaryShader && typeof secondaryShader === "object" ? secondaryShader : null;
  if (!primary && !secondary) {
    return null;
  }

  const readNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const multiplyOrDefault = (valueA, valueB) => {
    const numericA = readNumber(valueA);
    const numericB = readNumber(valueB);
    if (numericA == null && numericB == null) {
      return null;
    }
    return (numericA == null ? 1 : numericA) * (numericB == null ? 1 : numericB);
  };

  const huePrimary = readNumber(primary?.hueRotateDeg);
  const hueSecondary = readNumber(secondary?.hueRotateDeg);
  const saturate = multiplyOrDefault(primary?.saturate, secondary?.saturate);
  const brightness = multiplyOrDefault(primary?.brightness, secondary?.brightness);
  const contrast = multiplyOrDefault(primary?.contrast, secondary?.contrast);
  const invertPrimary = readNumber(primary?.invert);
  const invertSecondary = readNumber(secondary?.invert);
  const invert =
    invertPrimary == null && invertSecondary == null
      ? null
      : 1 - (1 - clamp(invertPrimary == null ? 0 : invertPrimary, 0, 1))
        * (1 - clamp(invertSecondary == null ? 0 : invertSecondary, 0, 1));
  const colorizePrimary = Array.isArray(primary?.colorizeRgb) ? normalizeRgbColor(primary.colorizeRgb, null) : null;
  const colorizeSecondary =
    Array.isArray(secondary?.colorizeRgb) ? normalizeRgbColor(secondary.colorizeRgb, null) : null;
  const colorizeBlendPrimary = clamp(readNumber(primary?.colorizeBlend) || 0, 0, 1);
  const colorizeBlendSecondary = clamp(readNumber(secondary?.colorizeBlend) || 0, 0, 1);
  const colorizeBlend = 1 - (1 - colorizeBlendPrimary) * (1 - colorizeBlendSecondary);
  const paletteKind = String(primary?.paletteKind || secondary?.paletteKind || "").trim().toLowerCase();
  const paletteStrengthPrimary = readNumber(primary?.paletteStrength);
  const paletteStrengthSecondary = readNumber(secondary?.paletteStrength);
  const paletteStrength =
    paletteStrengthPrimary != null
      ? clamp(paletteStrengthPrimary, 0, 1)
      : paletteStrengthSecondary != null
        ? clamp(paletteStrengthSecondary, 0, 1)
        : 1;

  const merged = {};
  if (huePrimary != null || hueSecondary != null) {
    merged.hueRotateDeg = (huePrimary || 0) + (hueSecondary || 0);
  }
  if (saturate != null) {
    merged.saturate = saturate;
  }
  if (brightness != null) {
    merged.brightness = brightness;
  }
  if (contrast != null) {
    merged.contrast = contrast;
  }
  if (invert != null && invert > 0.001) {
    merged.invert = clamp(invert, 0, 1);
  }
  const mergedColorize = colorizePrimary || colorizeSecondary || null;
  if (mergedColorize) {
    merged.colorizeRgb = mergedColorize;
  }
  if (colorizeBlend > 0.001 && mergedColorize) {
    merged.colorizeBlend = colorizeBlend;
  }
  if (paletteKind) {
    merged.paletteKind = paletteKind;
    merged.paletteStrength = paletteStrength;
  }
  return Object.keys(merged).length > 0 ? merged : null;
}

function drawSpriteImageWithTint(image, drawX, drawY, drawWidth, drawHeight, tintColor, tintBlend, shader = null) {
  const blend = clamp(Number(tintBlend || 0), 0, 1);
  const snapFactor = getSpriteSnapFactor();
  const snappedDrawX = snapSpriteValue(drawX);
  const snappedDrawY = snapSpriteValue(drawY);
  const snappedDrawWidth = snapSpriteDimension(drawWidth);
  const snappedDrawHeight = snapSpriteDimension(drawHeight);
  const width = Math.max(1, Math.round(snappedDrawWidth * snapFactor));
  const height = Math.max(1, Math.round(snappedDrawHeight * snapFactor));
  const baseColor = normalizeRgbColor(Array.isArray(tintColor) ? tintColor : [255, 255, 255], [255, 255, 255]);
  const shaderPaletteKind = String(shader?.paletteKind || "").trim().toLowerCase();
  const shaderPaletteStrength = clamp(Number(shader?.paletteStrength ?? 1), 0, 1);
  const preparedImage =
    shaderPaletteKind === "metamorph"
      ? getMorphingPaletteMappedTexture(image, width, height, shaderPaletteStrength)
      : image;
  const shaderColorizeRgb = Array.isArray(shader?.colorizeRgb)
    ? normalizeRgbColor(shader.colorizeRgb, MORPHING_COLORIZE_FALLBACK_RGB)
    : null;
  const shaderColorizeBlend = shaderColorizeRgb ? clamp(Number(shader?.colorizeBlend || 0), 0, 1) : 0;
  const hasShaderColorize = shaderColorizeBlend > 0.001 && Array.isArray(shaderColorizeRgb);
  const wasSmoothing = ctx.imageSmoothingEnabled;
  const shaderFilter = buildSpriteShaderFilter(shader);
  const hasAnyTintPass = blend > 0.001 || hasShaderColorize;

  if (!hasAnyTintPass || !spriteTintBufferCtx) {
    ctx.imageSmoothingEnabled = false;
    const previousFilter = ctx.filter;
    if (shaderFilter !== "none") {
      ctx.filter = shaderFilter;
    }
    ctx.drawImage(preparedImage, snappedDrawX, snappedDrawY, snappedDrawWidth, snappedDrawHeight);
    if (shaderFilter !== "none") {
      ctx.filter = previousFilter;
    }
    ctx.imageSmoothingEnabled = wasSmoothing;
    return;
  }

  if (spriteTintBufferCanvas.width !== width || spriteTintBufferCanvas.height !== height) {
    spriteTintBufferCanvas.width = width;
    spriteTintBufferCanvas.height = height;
  }

  const bufferCtx = spriteTintBufferCtx;
  const wasBufferSmoothing = bufferCtx.imageSmoothingEnabled;
  bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
  bufferCtx.globalCompositeOperation = "source-over";
  bufferCtx.globalAlpha = 1;
  bufferCtx.clearRect(0, 0, width, height);
  bufferCtx.imageSmoothingEnabled = false;
  bufferCtx.drawImage(preparedImage, 0, 0, width, height);
  if (blend > 0.001) {
    bufferCtx.globalCompositeOperation = "source-atop";
    bufferCtx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${blend})`;
    bufferCtx.fillRect(0, 0, width, height);
  }
  if (hasShaderColorize) {
    bufferCtx.globalCompositeOperation = "source-atop";
    bufferCtx.fillStyle =
      `rgba(${shaderColorizeRgb[0]}, ${shaderColorizeRgb[1]}, ${shaderColorizeRgb[2]}, ${shaderColorizeBlend})`;
    bufferCtx.fillRect(0, 0, width, height);
  }
  bufferCtx.globalCompositeOperation = "source-over";
  bufferCtx.imageSmoothingEnabled = wasBufferSmoothing;

  ctx.imageSmoothingEnabled = false;
  const previousFilter = ctx.filter;
  if (shaderFilter !== "none") {
    ctx.filter = shaderFilter;
  }
  ctx.drawImage(
    spriteTintBufferCanvas,
    0,
    0,
    width,
    height,
    snappedDrawX,
    snappedDrawY,
    snappedDrawWidth,
    snappedDrawHeight,
  );
  if (shaderFilter !== "none") {
    ctx.filter = previousFilter;
  }
  ctx.imageSmoothingEnabled = wasSmoothing;
}

function drawPokemonSprite(entity, x, y, size, options = {}) {
  ctx.save();
  const morphingShaderForTransform =
    entity?.spriteShader && typeof entity.spriteShader === "object" ? entity.spriteShader : null;
  const morphingVisualActive =
    Number(entity?.morphingSourceId || 0) > 0
    && String(morphingShaderForTransform?.paletteKind || "").toLowerCase() === "metamorph";
  const morphingWobble = morphingVisualActive ? getMorphingWobbleTransform(entity, size) : null;
  const offsetX = Number.isFinite(options.offsetX) ? options.offsetX : 0;
  const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : 0;
  const wobbleOffsetX = morphingWobble ? Number(morphingWobble.offsetX || 0) : 0;
  const wobbleOffsetY = morphingWobble ? Number(morphingWobble.offsetY || 0) : 0;
  ctx.translate(snapSpriteValue(x + offsetX + wobbleOffsetX), snapSpriteValue(y + offsetY + wobbleOffsetY));
  const drawAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  ctx.globalAlpha = drawAlpha;
  const baseScale = Number.isFinite(options.scale) ? Math.max(0, options.scale) : 1;
  const scaleX = Number.isFinite(options.scaleX) ? Math.max(0, options.scaleX) : baseScale;
  const scaleY = Number.isFinite(options.scaleY) ? Math.max(0, options.scaleY) : baseScale;
  const wobbleScaleX = morphingWobble ? Number(morphingWobble.scaleX || 1) : 1;
  const wobbleScaleY = morphingWobble ? Number(morphingWobble.scaleY || 1) : 1;
  const flipX = options.flipX ? -1 : 1;
  const rotationRad = Number.isFinite(options.rotationRad) ? Number(options.rotationRad) : 0;
  ctx.scale(scaleX * wobbleScaleX * flipX, scaleY * wobbleScaleY);
  if (morphingWobble) {
    const wobbleShearX = Number(morphingWobble.shearX || 0);
    const wobbleRotation = Number(morphingWobble.rotationRad || 0);
    if (Math.abs(wobbleShearX) > 0.0001) {
      ctx.transform(1, 0, wobbleShearX, 1, 0, 0);
    }
    if (Math.abs(wobbleRotation) > 0.0001) {
      ctx.rotate(wobbleRotation);
    }
  }
  const shinyVisual = Boolean(options.shinyVisual || entity?.isShinyVisual || entity?.isShiny);
  const ultraShinyVisual = Boolean(options.ultraShinyVisual || entity?.isUltraShinyVisual || entity?.isUltraShiny);
  const shinyNegativeFallbackVisual = Boolean(
    !ultraShinyVisual
    && (options.shinyNegativeFallbackVisual || entity?.isShinyNegativeFallbackVisual),
  );
  const tintBlend = clamp(Number(options.tintBlend || 0), 0, 1);
  const tintColor = Array.isArray(options.tintColor) ? options.tintColor : [255, 255, 255];
  const ultraSeed =
    Number(entity?.id || 0) * 0.73 + hashStringToUnit(String(entity?.spriteVariantId || "default")) * 19.7;
  const customShaderConfig =
    options?.shader && typeof options.shader === "object"
      ? options.shader
      : entity?.spriteShader && typeof entity.spriteShader === "object"
        ? entity.spriteShader
        : null;
  const ultraShaderConfig = ultraShinyVisual ? getUltraShinyShaderConfig(ultraSeed) : null;
  const shinyNegativeShaderConfig = shinyNegativeFallbackVisual ? SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG : null;
  const shaderWithUltra = mergeSpriteShaderConfig(customShaderConfig, ultraShaderConfig);
  const shaderConfig = mergeSpriteShaderConfig(shaderWithUltra, shinyNegativeShaderConfig);
  const resolvedSpriteSource = resolveEntitySpriteDrawSource(entity);
  const spriteImage = resolvedSpriteSource.source;
  const renderSize = getPokemonSpriteRenderSize(entity, size, resolvedSpriteSource);
  let spriteDrawX = -renderSize * 0.5;
  let spriteDrawY = -renderSize * 0.5;
  let spriteDrawWidth = renderSize;
  let spriteDrawHeight = renderSize;
  let spriteUsedImage = false;
  const shadowProfile = String(options.shadowProfile || "team").toLowerCase();
  const shadowGroundOffsetY = Number.isFinite(options.shadowGroundOffsetY)
    ? Number(options.shadowGroundOffsetY)
    : -(offsetY + wobbleOffsetY);
  const shadowLiftPx = Number.isFinite(options.shadowLiftPx)
    ? Math.max(0, Number(options.shadowLiftPx))
    : Math.max(0, -(offsetY + wobbleOffsetY));
  let predictedShadowSize = renderSize;
  let predictedShadowCenterY = renderSize * 0.5;
  if (isDrawableImage(spriteImage)) {
    const predictedDims = getDrawableImageDimensions(spriteImage);
    const predictedPlacement = computeSpriteOpaqueDrawPlacement({
      renderSize,
      sourceWidth: predictedDims.width,
      sourceHeight: predictedDims.height,
      opaqueMinX: resolvedSpriteSource?.opaqueMinX,
      opaqueMinY: resolvedSpriteSource?.opaqueMinY,
      opaqueWidth: resolvedSpriteSource?.opaqueWidth,
      opaqueHeight: resolvedSpriteSource?.opaqueHeight,
    });
    predictedShadowSize = Math.max(predictedPlacement.visibleWidth, predictedPlacement.visibleHeight);
    predictedShadowCenterY = predictedPlacement.visibleBottomY;
  } else {
    predictedShadowSize = renderSize * 0.6;
    predictedShadowCenterY = renderSize * 0.3;
  }
  drawPokemonTerrainShadow(predictedShadowSize, {
    profile: shadowProfile,
    spriteAlpha: drawAlpha,
    alpha: Number.isFinite(options.shadowAlpha) ? Number(options.shadowAlpha) : POKEMON_SHADOW_ALPHA,
    liftPx: shadowLiftPx,
    groundOffsetY: shadowGroundOffsetY,
    centerY: predictedShadowCenterY,
  });
  if (Math.abs(rotationRad) > 0.0001) {
    ctx.rotate(rotationRad);
  }

  if (isDrawableImage(spriteImage)) {
    const dims = getDrawableImageDimensions(spriteImage);
    const placement = computeSpriteOpaqueDrawPlacement({
      renderSize,
      sourceWidth: dims.width,
      sourceHeight: dims.height,
      opaqueMinX: resolvedSpriteSource?.opaqueMinX,
      opaqueMinY: resolvedSpriteSource?.opaqueMinY,
      opaqueWidth: resolvedSpriteSource?.opaqueWidth,
      opaqueHeight: resolvedSpriteSource?.opaqueHeight,
    });
    const drawWidth = snapSpriteDimension(placement.drawWidth);
    const drawHeight = snapSpriteDimension(placement.drawHeight);
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    spriteDrawX = snapSpriteValue(placement.drawX);
    spriteDrawY = snapSpriteValue(placement.drawY);
    spriteDrawWidth = drawWidth;
    spriteDrawHeight = drawHeight;
    spriteUsedImage = true;
    let morphingSeed = 0;
    if (morphingVisualActive) {
      morphingSeed =
        Number(entity?.morphingSourceId || 0) * 0.51
        + Number(entity?.id || 0) * 0.37
        + hashStringToUnit(String(entity?.spriteVariantId || "default")) * 9.3;
      drawMorphingSlimeEffect(renderSize, morphingSeed, 1);
      drawMorphingOutline(
        spriteImage,
        spriteDrawX,
        spriteDrawY,
        spriteDrawWidth,
        spriteDrawHeight,
      );
    }
    if (ultraShinyVisual) {
      drawUltraShinyOutline(
        spriteImage,
        spriteDrawX,
        spriteDrawY,
        spriteDrawWidth,
        spriteDrawHeight,
        ULTRA_SHINY_OUTLINE_PX,
        1,
      );
    }
    drawSpriteImageWithTint(
      spriteImage,
      spriteDrawX,
      spriteDrawY,
      drawWidth,
      drawHeight,
      tintColor,
      tintBlend,
      shaderConfig,
    );
    if (morphingVisualActive) {
      drawMorphingSlimeEffect(renderSize * 0.97, morphingSeed + 0.43, 0.72);
    }
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
    spriteDrawX = -renderSize * 0.3;
    spriteDrawY = -renderSize * 0.3;
    spriteDrawWidth = renderSize * 0.6;
    spriteDrawHeight = renderSize * 0.6;
    ctx.fillStyle = "rgba(180, 198, 232, 0.36)";
    ctx.strokeStyle = "rgba(226, 238, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, renderSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const fallbackInitial = String(entity?.nameFr || entity?.nameEn || entity?.name || "?").trim().charAt(0) || "?";
    ctx.fillStyle = "#f7fbff";
    ctx.font = `bold ${Math.round(renderSize * 0.28)}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fallbackInitial.toUpperCase(), 0, 0);
  }

  if (tintBlend > 0.001 && !spriteUsedImage) {
    // Fallback shape tinting when sprite image is unavailable.
    ctx.fillStyle = `rgba(${tintColor[0]}, ${tintColor[1]}, ${tintColor[2]}, ${(tintBlend * 0.62).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, renderSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (shinyVisual || ultraShinyVisual) {
    drawShinySparkles(renderSize, Number(entity?.id || 0), drawAlpha);
  }
  if (ultraShinyVisual) {
    drawUltraShinyScintillation(renderSize, ultraSeed, drawAlpha);
  }

  ctx.restore();
}

function getFittedFontMetrics(text, maxWidth, baseSize, minSize = 9) {
  const safeText = String(text || "");
  const safeMaxWidth = Math.max(16, Number(maxWidth) || 0);
  let size = clamp(Number(baseSize) || minSize, minSize, 28);
  let measuredWidth = 0;

  ctx.save();
  while (size > minSize) {
    ctx.font = `700 ${size}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    measuredWidth = Math.ceil(ctx.measureText(safeText).width);
    if (measuredWidth <= safeMaxWidth) {
      break;
    }
    size -= 1;
  }
  if (measuredWidth <= 0) {
    ctx.font = `700 ${size}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    measuredWidth = Math.ceil(ctx.measureText(safeText).width);
  }
  ctx.restore();
  return { size, width: measuredWidth };
}

function fitTextToWidthWithEllipsis(text, maxWidth, suffix = "...") {
  const source = Array.from(String(text || ""));
  if (source.length <= 0) {
    return "";
  }
  const safeMaxWidth = Math.max(0, Number(maxWidth) || 0);
  if (safeMaxWidth <= 0) {
    return "";
  }

  const fullText = source.join("");
  if (ctx.measureText(fullText).width <= safeMaxWidth) {
    return fullText;
  }

  const safeSuffix = String(suffix || "");
  if (!safeSuffix) {
    return "";
  }
  if (ctx.measureText(safeSuffix).width > safeMaxWidth) {
    return "";
  }

  let low = 0;
  let high = source.length;
  while (low < high) {
    const mid = Math.ceil((low + high) * 0.5);
    const candidate = source.slice(0, mid).join("") + safeSuffix;
    if (ctx.measureText(candidate).width <= safeMaxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  if (low <= 0) {
    return safeSuffix;
  }
  return source.slice(0, low).join("") + safeSuffix;
}

function getEnemyOwnershipBadgeState(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return {
      exactOwned: false,
      familyOwned: false,
      exactShiny: false,
      familyShiny: false,
      exactUltraShiny: false,
      familyUltraShiny: false,
    };
  }

  const record = getPokemonEntityRecord(id);
  const exactOwned = isEntityUnlocked(record);
  const familyOwned = isEvolutionFamilyOwned(id);
  const exactShiny = Math.max(0, toSafeInt(record?.captured_shiny, 0)) > 0;
  const familyShiny = getFamilyShinyCaptureCount(id) > 0;
  const exactUltraShiny = Math.max(0, toSafeInt(record?.captured_ultra_shiny, 0)) > 0;
  const familyUltraShiny = getFamilyUltraShinyCaptureCount(id) > 0;

  return {
    exactOwned,
    familyOwned,
    exactShiny,
    familyShiny,
    exactUltraShiny,
    familyUltraShiny,
  };
}

function buildEnemyOwnershipBadgeList(pokemonId) {
  const status = getEnemyOwnershipBadgeState(pokemonId);
  const badges = [];
  if (status.exactOwned || status.familyOwned) {
    badges.push({
      type: "owned",
      exact: status.exactOwned,
    });
  }
  if (status.exactShiny || status.familyShiny) {
    badges.push({
      type: "shiny",
      exact: status.exactShiny,
    });
  }
  if (status.exactUltraShiny || status.familyUltraShiny) {
    badges.push({
      type: "ultra_shiny",
      exact: status.exactUltraShiny,
    });
  }
  return badges;
}

function drawEnemyOwnershipBadge(centerX, centerY, size, badge = null) {
  if (!badge) {
    return;
  }
  const safeSize = clamp(Number(size) || 0, 10, 18);
  const exact = badge.exact === true;

  if (badge.type === "owned") {
    drawPokeball(centerX, centerY, safeSize * 0.45, {
      alpha: exact ? 0.98 : 0.52,
      ball_type: "poke_ball",
    });
    if (!exact) {
      ctx.save();
      ctx.fillStyle = "rgba(116, 128, 146, 0.5)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, safeSize * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(196, 211, 229, 0.55)";
      ctx.lineWidth = Math.max(1, safeSize * 0.07);
      ctx.beginPath();
      ctx.arc(centerX, centerY, safeSize * 0.43, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  ctx.save();
  ctx.globalAlpha = exact ? 1 : 0.58;
  const radius = safeSize * 0.5;
  const gradient =
    badge.type === "ultra_shiny"
      ? ctx.createConicGradient(0, centerX, centerY)
      : ctx.createRadialGradient(
          centerX - radius * 0.2,
          centerY - radius * 0.28,
          Math.max(0.2, radius * 0.06),
          centerX,
          centerY,
          radius,
        );
  if (badge.type === "ultra_shiny") {
    gradient.addColorStop(0, "#ff4f9b");
    gradient.addColorStop(1 / 6, "#ff9f3f");
    gradient.addColorStop(2 / 6, "#ffe24e");
    gradient.addColorStop(3 / 6, "#55d8ff");
    gradient.addColorStop(4 / 6, "#7a6dff");
    gradient.addColorStop(1, "#ff4f9b");
  } else {
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.62, "#cedef8");
    gradient.addColorStop(1, "#93a8cd");
  }
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(238, 248, 255, 0.62)";
  ctx.lineWidth = Math.max(1, safeSize * 0.075);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - ctx.lineWidth * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.font = `700 ${Math.max(8, Math.round(safeSize * 0.68))}px "Trebuchet MS", "Verdana", sans-serif`;
  ctx.lineWidth = Math.max(0.8, safeSize * 0.08);
  ctx.strokeStyle = "rgba(19, 30, 49, 0.72)";
  ctx.fillStyle = "#f8fbff";
  ctx.strokeText("\u2726", centerX, centerY + safeSize * 0.02);
  ctx.fillText("\u2726", centerX, centerY + safeSize * 0.02);
  ctx.restore();
}
function drawNameAndLevel(entity, centerX, topY, options = {}) {
  if (!entity) {
    return null;
  }
  const enemy = Boolean(options.enemy);
  const allowOverflow = options.allowOverflow === true;
  const maxWidth = clamp(Number(options.maxWidth) || (enemy ? 220 : 122), 56, state.viewport.width - 16);
  const nameBaseSize = clamp(Number(options.nameFontSize) || (enemy ? 20 : 16), 10, 24);
  const levelBaseSize = clamp(Number(options.levelFontSize) || (enemy ? 13 : 11), 8, 16);
  const levelText = `Lv${entity.level}`;

  let cardWidth = 0;
  let cardHeight = 0;
  let x = 0;
  let y = 0;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.shadowBlur = 0;

  if (enemy) {
    const ownershipBadges = buildEnemyOwnershipBadgeList(entity.id);
    const horizontalPadding = 12;
    const verticalPadding = 6;
    const levelGap = maxWidth <= 180 ? 10 : 14;
    const badgeSize = clamp(levelBaseSize + 1, 10, 15);
    const badgeGap = 3;
    const leftBadgeWidth = ownershipBadges.length > 0
      ? ownershipBadges.length * badgeSize + Math.max(0, ownershipBadges.length - 1) * badgeGap
      : 0;
    const badgeNameGap = ownershipBadges.length > 0 ? 7 : 0;
    const levelMetrics = getFittedFontMetrics(levelText, Math.max(34, maxWidth * 0.32), levelBaseSize, 9);
    const reservedRightWidth = levelMetrics.width + levelGap;
    const nameMetrics = getFittedFontMetrics(
      entity.nameFr,
      Math.max(36, maxWidth - horizontalPadding * 2 - leftBadgeWidth - badgeNameGap - reservedRightWidth - 4),
      nameBaseSize,
      12,
    );
    const contentWidth = leftBadgeWidth + badgeNameGap + nameMetrics.width + reservedRightWidth;
    const minCardWidth = Math.max(84, horizontalPadding * 2 + reservedRightWidth + leftBadgeWidth + 18);
    cardWidth = clamp(
      contentWidth + horizontalPadding * 2 + 8,
      minCardWidth,
      maxWidth,
    );
    cardHeight = Math.round(Math.max(nameMetrics.size, levelMetrics.size, badgeSize - 1) + verticalPadding * 2 + 2);
    const xRaw = centerX - cardWidth * 0.5;
    const yRaw = Number(topY) || 0;
    x = allowOverflow ? xRaw : clamp(xRaw, 8, state.viewport.width - cardWidth - 8);
    y = allowOverflow ? yRaw : clamp(yRaw, 8, state.viewport.height - cardHeight - 8);

    if (options.card !== false) {
      drawRetroHudPanel(x, y, cardWidth, cardHeight, {
        cut: 14,
        fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
        fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
        fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
        border: ZONE_UI_CANVAS_THEME.panel.border,
        highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
        shadow: "rgba(0, 0, 0, 0.44)",
        borderWidth: 2,
      });
    }

    const midY = y + cardHeight * 0.5;
    const contentStartX = x + horizontalPadding;

    if (ownershipBadges.length > 0) {
      let badgeCenterX = contentStartX + badgeSize * 0.5;
      for (const badge of ownershipBadges) {
        drawEnemyOwnershipBadge(badgeCenterX, midY, badgeSize, badge);
        badgeCenterX += badgeSize + badgeGap;
      }
    }

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `700 ${nameMetrics.size}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.panel.text;
    const nameX = contentStartX + leftBadgeWidth + badgeNameGap;
    const nameTextMaxWidth = Math.max(
      22,
      cardWidth - horizontalPadding * 2 - leftBadgeWidth - badgeNameGap - reservedRightWidth - 2,
    );
    const nameText = fitTextToWidthWithEllipsis(entity.nameFr, nameTextMaxWidth);
    ctx.fillText(nameText, nameX, midY);

    ctx.textAlign = "right";
    ctx.font = `700 ${levelMetrics.size}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.panel.textSoft;
    ctx.fillText(levelText, x + cardWidth - horizontalPadding, midY);
  } else {
    const horizontalPadding = 8;
    const verticalPadding = 5;
    const lineGap = 3;
    const nameMetrics = getFittedFontMetrics(entity.nameFr, maxWidth - horizontalPadding * 2, nameBaseSize, 10);
    const levelMetrics = getFittedFontMetrics(levelText, maxWidth - horizontalPadding * 2, levelBaseSize, 8);
    cardWidth = clamp(
      Math.max(nameMetrics.width, levelMetrics.width) + horizontalPadding * 2,
      72,
      maxWidth,
    );
    cardHeight = Math.round(verticalPadding * 2 + nameMetrics.size + lineGap + levelMetrics.size);
    const xRaw = centerX - cardWidth * 0.5;
    const yRaw = Number(topY) || 0;
    x = allowOverflow ? xRaw : clamp(xRaw, 8, state.viewport.width - cardWidth - 8);
    y = allowOverflow ? yRaw : clamp(yRaw, 8, state.viewport.height - cardHeight - 8);
    const cardCenterX = x + cardWidth * 0.5;

    if (options.card !== false) {
      drawRetroHudPanel(x, y, cardWidth, cardHeight, {
        cut: 10,
        fillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
        fillMid: ZONE_UI_CANVAS_THEME.subpanel.fillMid,
        fillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
        border: ZONE_UI_CANVAS_THEME.subpanel.border,
        highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
        shadow: "rgba(0, 0, 0, 0.44)",
        borderWidth: 1.4,
      });
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const nameBaseline = y + verticalPadding + nameMetrics.size;
    ctx.font = `700 ${nameMetrics.size}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.panel.text;
    ctx.fillText(entity.nameFr, cardCenterX, nameBaseline);

    const levelBaseline = nameBaseline + lineGap + levelMetrics.size;
    ctx.font = `700 ${levelMetrics.size}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.panel.textSoft;
    ctx.fillText(levelText, cardCenterX, levelBaseline);
  }
  ctx.restore();

  return {
    x,
    y,
    width: cardWidth,
    height: cardHeight,
    centerX: x + cardWidth * 0.5,
    bottom: y + cardHeight,
  };
}
function getEnemyHpDisplayRatios(enemy, targetRatio) {
  const key = `${Number(enemy?.id || 0)}:${Math.max(1, toSafeInt(enemy?.hpMax, 1))}`;
  const hud = state.xpHud;
  if (!hud || hud.enemyHpKey !== key || !Number.isFinite(hud.enemyHpFrontRatio)) {
    hud.enemyHpKey = key;
    hud.enemyHpFrontRatio = targetRatio;
    hud.enemyHpLagRatio = targetRatio;
    return { front: targetRatio, lag: targetRatio };
  }

  if (targetRatio >= 0.995 && hud.enemyHpFrontRatio <= 0.35) {
    hud.enemyHpFrontRatio = targetRatio;
    hud.enemyHpLagRatio = targetRatio;
    return { front: targetRatio, lag: targetRatio };
  }

  hud.enemyHpFrontRatio += (targetRatio - hud.enemyHpFrontRatio) * 0.34;
  if (targetRatio >= hud.enemyHpLagRatio) {
    hud.enemyHpLagRatio += (targetRatio - hud.enemyHpLagRatio) * 0.26;
  } else {
    hud.enemyHpLagRatio += (targetRatio - hud.enemyHpLagRatio) * 0.08;
  }

  if (Math.abs(hud.enemyHpFrontRatio - targetRatio) <= 0.002) {
    hud.enemyHpFrontRatio = targetRatio;
  }
  if (Math.abs(hud.enemyHpLagRatio - targetRatio) <= 0.002) {
    hud.enemyHpLagRatio = targetRatio;
  }

  hud.enemyHpFrontRatio = clamp(hud.enemyHpFrontRatio, 0, 1);
  hud.enemyHpLagRatio = clamp(hud.enemyHpLagRatio, 0, 1);
  return { front: hud.enemyHpFrontRatio, lag: hud.enemyHpLagRatio };
}

function getEnemyHpPalette(ratio) {
  if (ratio >= 0.55) {
    return ZONE_UI_CANVAS_THEME.hp.healthy;
  }
  if (ratio >= 0.25) {
    return ZONE_UI_CANVAS_THEME.hp.warning;
  }
  return ZONE_UI_CANVAS_THEME.hp.danger;
}

function parseRgbaColor(colorText, fallback = { r: 255, g: 255, b: 255, a: 1 }) {
  const match = String(colorText || "").match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/i,
  );
  if (!match) {
    return { ...fallback };
  }
  return {
    r: clamp(Number.parseFloat(match[1]) || 0, 0, 255),
    g: clamp(Number.parseFloat(match[2]) || 0, 0, 255),
    b: clamp(Number.parseFloat(match[3]) || 0, 0, 255),
    a: clamp(Number.parseFloat(match[4] ?? 1) || 1, 0, 1),
  };
}

function lerpColorChannel(start, end, t) {
  return start + (end - start) * clamp(Number(t) || 0, 0, 1);
}

function getColorLuminance(color) {
  const r = clamp((Number(color?.r) || 0) / 255, 0, 1);
  const g = clamp((Number(color?.g) || 0) / 255, 0, 1);
  const b = clamp((Number(color?.b) || 0) / 255, 0, 1);
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function pickContrastingHudTextColor(baseColor) {
  const luminance = getColorLuminance(baseColor);
  return luminance >= 0.56
    ? { fill: "rgba(18, 33, 51, 0.98)", stroke: "rgba(240, 248, 255, 0.9)" }
    : { fill: "rgba(244, 251, 255, 0.98)", stroke: "rgba(12, 22, 34, 0.92)" };
}

function drawEnemyHpBar(enemy, centerX, topY, width, height, options = {}) {
  const allowOverflow = options.allowOverflow === true;
  const targetRatio = enemy.hpMax > 0 ? clamp(enemy.hpCurrent / enemy.hpMax, 0, 1) : 0;
  const { front: frontRatio, lag: lagRatio } = getEnemyHpDisplayRatios(enemy, targetRatio);
  const panelHeight = Math.max(24, height + 10);
  const panelWidth = clamp(width + 96, 180, state.viewport.width - 18);
  const panelXRaw = centerX - panelWidth * 0.5;
  const panelYRaw = (Number(topY) || 0) - 5;
  const panelX = allowOverflow ? panelXRaw : clamp(panelXRaw, 8, state.viewport.width - panelWidth - 8);
  const panelY = allowOverflow ? panelYRaw : clamp(panelYRaw, 3, state.viewport.height - panelHeight - 8);
  const chipX = panelX + 5;
  const chipY = panelY + 4;
  const chipWidth = 26;
  const chipHeight = panelHeight - 8;
  const trackY = panelY + Math.round((panelHeight - height) * 0.5);
  const hpLabel = `${formatCompactNumber(Math.max(0, Math.round(enemy.hpCurrent)), {
    decimalsSmall: 2,
    decimalsMedium: 1,
    decimalsLarge: 0,
  })}/${formatCompactNumber(Math.max(0, Math.round(enemy.hpMax)), {
    decimalsSmall: 2,
    decimalsMedium: 1,
    decimalsLarge: 0,
  })}`;

  ctx.save();
  ctx.globalAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  ctx.font = `700 ${Math.max(8, Math.round(panelHeight * 0.38))}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const trackX = chipX + chipWidth + 8;
  const trackWidth = Math.max(50, panelX + panelWidth - trackX - 8);
  const trackRadius = Math.max(2, height * 0.32);

  drawRetroHudPanel(panelX, panelY, panelWidth, panelHeight, {
    cut: 14,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 2,
  });

  drawRetroHudPanel(chipX, chipY, chipWidth, chipHeight, {
    cut: 6,
    fillTop: ZONE_UI_CANVAS_THEME.goldChip.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.goldChip.fillTop,
    fillBottom: ZONE_UI_CANVAS_THEME.goldChip.fillBottom,
    border: ZONE_UI_CANVAS_THEME.goldChip.border,
    highlight: ZONE_UI_CANVAS_THEME.goldChip.highlight,
    shadow: "rgba(0, 0, 0, 0)",
    shadowOffsetY: 0,
    borderWidth: 1.2,
  });

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(9, Math.round(chipHeight * 0.45))}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.fillStyle = ZONE_UI_CANVAS_THEME.goldChip.text;
  ctx.fillText("HP", chipX + chipWidth * 0.5 - 0.5, chipY + chipHeight * 0.56);

  ctx.fillStyle = ZONE_UI_CANVAS_THEME.hp.track;
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, height, trackRadius);
  ctx.fill();

  if (lagRatio > 0.001) {
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.hp.lag;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackWidth * lagRatio, height, trackRadius);
    ctx.fill();
  }

  if (frontRatio > 0.001) {
    const palette = getEnemyHpPalette(frontRatio);
    const fillGradient = ctx.createLinearGradient(trackX, trackY, trackX + trackWidth, trackY);
    fillGradient.addColorStop(0, palette.start);
    fillGradient.addColorStop(1, palette.end);
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackWidth * frontRatio, height, trackRadius);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(trackX + 1, trackY + 1, Math.max(0, trackWidth * frontRatio - 2), Math.max(1, height * 0.32));

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = palette.glow;
    ctx.fillRect(trackX, trackY - 1, trackWidth * frontRatio, height + 2);
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.strokeStyle = ZONE_UI_CANVAS_THEME.hp.trackBorder;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, height, trackRadius);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const hpTextMinSize = 9;
  let hpTextSize = Math.max(hpTextMinSize, Math.round(panelHeight * 0.5));
  ctx.font = `700 ${hpTextSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const maxHpLabelWidth = Math.max(24, trackWidth - 10);
  while (hpTextSize > hpTextMinSize && ctx.measureText(hpLabel).width > maxHpLabelWidth) {
    hpTextSize -= 1;
    ctx.font = `700 ${hpTextSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  }
  const labelX = trackX + trackWidth * 0.5;
  const labelY = trackY + height * 0.52;
  const filledWidth = trackWidth * frontRatio;
  const trackBaseColor = parseRgbaColor(ZONE_UI_CANVAS_THEME.hp.track, { r: 82, g: 95, b: 116, a: 1 });
  const emptyTextStyle = pickContrastingHudTextColor(trackBaseColor);

  let fillTextStyle = emptyTextStyle;
  if (frontRatio > 0.001) {
    const palette = getEnemyHpPalette(frontRatio);
    const fillStart = parseRgbaColor(palette.start, trackBaseColor);
    const fillEnd = parseRgbaColor(palette.end, trackBaseColor);
    const sampledFillColor = {
      r: lerpColorChannel(fillStart.r, fillEnd.r, 0.5),
      g: lerpColorChannel(fillStart.g, fillEnd.g, 0.5),
      b: lerpColorChannel(fillStart.b, fillEnd.b, 0.5),
      a: lerpColorChannel(fillStart.a, fillEnd.a, 0.5),
    };
    fillTextStyle = pickContrastingHudTextColor(sampledFillColor);
  }

  const drawHpText = (style) => {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.7, hpTextSize * 0.24);
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(hpLabel, labelX, labelY);
    ctx.fillStyle = style.fill;
    ctx.fillText(hpLabel, labelX, labelY);
  };

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, height, trackRadius);
  ctx.clip();
  if (filledWidth > 0.25) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(trackX - 1, trackY - 2, filledWidth + 2, height + 4);
    ctx.clip();
    drawHpText(fillTextStyle);
    ctx.restore();
  }
  if (filledWidth < trackWidth - 0.25) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(trackX + filledWidth - 1, trackY - 2, trackWidth - filledWidth + 2, height + 4);
    ctx.clip();
    drawHpText(emptyTextStyle);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

function getTeamXpDisplayRatios(member, slotIndex, targetRatio) {
  const slotKey = String(Math.max(0, toSafeInt(slotIndex, 0)));
  const bySlot = state.xpHud?.teamXpBySlot || {};
  const memberId = Number(member?.id || 0);
  const memberLevel = Math.max(1, toSafeInt(member?.level, 1));
  let entry = bySlot[slotKey];

  if (
    !entry
    || Number(entry.memberId || 0) !== memberId
    || Math.max(1, toSafeInt(entry.level, 1)) !== memberLevel
    || !Number.isFinite(entry.front)
    || !Number.isFinite(entry.lag)
  ) {
    entry = {
      memberId,
      level: memberLevel,
      front: targetRatio,
      lag: targetRatio,
    };
    bySlot[slotKey] = entry;
    state.xpHud.teamXpBySlot = bySlot;
    return { front: targetRatio, lag: targetRatio };
  }

  entry.level = memberLevel;
  entry.front += (targetRatio - entry.front) * 0.26;
  if (targetRatio >= entry.lag) {
    entry.lag += (targetRatio - entry.lag) * 0.18;
  } else {
    entry.lag += (targetRatio - entry.lag) * 0.1;
  }
  if (Math.abs(entry.front - targetRatio) <= 0.0018) {
    entry.front = targetRatio;
  }
  if (Math.abs(entry.lag - targetRatio) <= 0.0018) {
    entry.lag = targetRatio;
  }
  entry.front = clamp(entry.front, 0, 1);
  entry.lag = clamp(entry.lag, 0, 1);
  return { front: entry.front, lag: entry.lag };
}

function drawTeamXpBar(member, slotIndex, centerX, topY, options = {}) {
  if (!member || member.level >= MAX_LEVEL) {
    return;
  }
  const allowOverflow = options.allowOverflow === true;
  const currentXp = Math.max(0, toSafeInt(member.xp, 0));
  const requiredXp = Math.max(1, toSafeInt(member.xpToNext, 1));
  const ratio = clamp(currentXp / requiredXp, 0, 1);
  const display = getTeamXpDisplayRatios(member, slotIndex, ratio);
  const width = clamp(Number(options.width) || 72, 40, 96);
  const height = clamp(Number(options.height) || 4, 3, 5);
  const x = centerX - width * 0.5;
  const yRaw = Number(topY) || 0;
  const y = allowOverflow ? yRaw : clamp(yRaw, 8, state.viewport.height - height - 8);
  const radius = Math.max(2, height * 0.45);

  ctx.save();
  ctx.fillStyle = "rgba(12, 22, 34, 0.74)";
  ctx.beginPath();
  ctx.roundRect(x - 1.5, y - 1.5, width + 3, height + 3, radius + 1);
  ctx.fill();

  const trackGradient = ctx.createLinearGradient(x, y, x, y + height);
  trackGradient.addColorStop(0, ZONE_UI_CANVAS_THEME.xp.trackTop);
  trackGradient.addColorStop(1, ZONE_UI_CANVAS_THEME.xp.trackBottom);
  ctx.fillStyle = trackGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  if (display.lag > 0.001) {
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.xp.lag;
    ctx.beginPath();
    ctx.roundRect(x, y, width * display.lag, height, radius);
    ctx.fill();
  }

  if (display.front > 0.001) {
    const fillGradient = ctx.createLinearGradient(x, y, x + width, y);
    fillGradient.addColorStop(0, ZONE_UI_CANVAS_THEME.xp.fillStart);
    fillGradient.addColorStop(1, ZONE_UI_CANVAS_THEME.xp.fillEnd);
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width * display.front, height, radius);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(x + 1, y + 1, Math.max(0, width * display.front - 2), Math.max(1, height * 0.3));
  }

  ctx.strokeStyle = ZONE_UI_CANVAS_THEME.xp.border;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.roundRect(x - 0.5, y - 0.5, width + 1, height + 1, radius + 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawRouteDefeatTimerBar(timerState, layout = null) {
  if (!timerState?.running || timerState.duration_ms <= 0) {
    return;
  }
  const isOnlyOneTimer = String(timerState?.style || "").toLowerCase() === ENEMY_TIMER_STYLE_ONLY_ONE;
  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const unlockProgressState = getRouteUnlockProgressState(currentRouteId);
  const showDefeatCounter =
    !isOnlyOneTimer &&
    unlockProgressState.unlockMode === "defeats" &&
    unlockProgressState.unlockTarget > 0;
  const defeatCounterText = showDefeatCounter
    ? `${formatCompactNumber(unlockProgressState.currentDefeats)} / ${formatCompactNumber(unlockProgressState.unlockTarget)} Pok\u00e9mon battus`
    : "";
  const remainingMs = Math.max(0, Number(timerState.remaining_ms) || 0);
  const remainingSeconds = Math.max(0, remainingMs / 1000);
  const remainingDisplaySeconds = Math.max(0, Math.ceil(remainingSeconds * 10) / 10);
  const timerText = `${remainingDisplaySeconds.toFixed(1)}s`;
  const ratio = clamp(Number(timerState.remaining_ratio) || 0, 0, 1);
  const danger = 1 - ratio;
  const compactHud = isCoarsePointerDevice() || state.viewport.width <= 760;
  const width = compactHud
    ? clamp(state.viewport.width * 0.44, 170, 420)
    : clamp(state.viewport.width * 0.58, 220, 540);
  const height = compactHud
    ? clamp(state.viewport.height * 0.019, 10, 14)
    : clamp(state.viewport.height * 0.028, 14, 20);
  const x = (state.viewport.width - width) * 0.5;
  const safeTop = Number(layout?.safeBounds?.top);
  const verticalOffset = compactHud
    ? clamp(state.viewport.height * 0.01, 8, 12)
    : clamp(state.viewport.height * 0.012, 10, 18);
  const overlayPaddingTop = getOverlayPaddingSnapshot().top;
  const topHudHeight = getRuntimeShellMetricHeight(uiTopbarEl, "--ui-runtime-topbar-height-px");
  const hudAnchorY = overlayPaddingTop + topHudHeight + (compactHud ? 2 : 4);
  const yFromSafeBounds = Number.isFinite(safeTop)
    ? safeTop + verticalOffset
    : state.viewport.height * 0.025;
  const topHudGap = compactHud ? 4 : 6;
  const preferredY = Number.isFinite(safeTop)
    ? Math.max(yFromSafeBounds, hudAnchorY + topHudGap)
    : state.viewport.height * 0.025;
  const y = Number.isFinite(safeTop)
    ? clamp(
      preferredY,
      compactHud ? 8 : 10,
      state.viewport.height - height - 24,
    )
    : clamp(state.viewport.height * 0.025, compactHud ? 8 : 10, compactHud ? 16 : 20);
  const radius = Math.max(2, height * 0.36);
  const pulse = ratio < 0.35 ? (0.5 + 0.5 * Math.sin(state.timeMs * 0.016)) * (0.08 + danger * 0.18) : 0;
  const panelPaddingX = compactHud ? 4 : 6;
  const panelPaddingY = compactHud ? 3 : 4;
  const panelX = x - panelPaddingX;
  const panelY = y - panelPaddingY;
  const panelWidth = width + panelPaddingX * 2;
  const panelHeight = height + panelPaddingY * 2;

  ctx.save();
  ctx.globalAlpha = 0.94;
  drawRetroHudPanel(panelX, panelY, panelWidth, panelHeight, {
    cut: 10,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.7,
  });

  const trackGradient = ctx.createLinearGradient(x, y, x, y + height);
  trackGradient.addColorStop(0, ZONE_UI_CANVAS_THEME.timer.trackTop);
  trackGradient.addColorStop(1, ZONE_UI_CANVAS_THEME.timer.trackBottom);
  ctx.fillStyle = trackGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  if (ratio > 0.001) {
    const fillGradient = ctx.createLinearGradient(x, y, x + width, y);
    if (isOnlyOneTimer) {
      fillGradient.addColorStop(0, ZONE_UI_CANVAS_THEME.timer.onlyOne.start);
      fillGradient.addColorStop(0.48, ZONE_UI_CANVAS_THEME.timer.onlyOne.mid);
      fillGradient.addColorStop(1, ZONE_UI_CANVAS_THEME.timer.onlyOne.end);
    } else {
      fillGradient.addColorStop(0, ZONE_UI_CANVAS_THEME.timer.standard.start);
      fillGradient.addColorStop(0.48, ZONE_UI_CANVAS_THEME.timer.standard.mid);
      fillGradient.addColorStop(1, ZONE_UI_CANVAS_THEME.timer.standard.end);
    }
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width * ratio, height, radius);
    ctx.fill();

    ctx.fillStyle = isOnlyOneTimer
      ? ZONE_UI_CANVAS_THEME.timer.onlyOne.sheen.replace("0.2", (0.12 + pulse).toFixed(3))
      : ZONE_UI_CANVAS_THEME.timer.standard.sheen.replace("0.18", (0.12 + pulse).toFixed(3));
    ctx.fillRect(x + 1, y + 1, Math.max(0, width * ratio - 2), Math.max(1, height * 0.32));
  }

  ctx.strokeStyle = isOnlyOneTimer
    ? ZONE_UI_CANVAS_THEME.timer.onlyOne.stroke.replace("0.82", (0.62 + pulse * 0.4).toFixed(3))
    : ZONE_UI_CANVAS_THEME.timer.standard.stroke.replace("0.82", (0.62 + pulse * 0.4).toFixed(3));
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();

  const timerTextSize = compactHud
    ? Math.max(8, Math.min(12, Math.round(height * 0.64)))
    : Math.max(10, Math.min(15, Math.round(height * 0.7)));
  ctx.font = `700 ${timerTextSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = isOnlyOneTimer
    ? ZONE_UI_CANVAS_THEME.timer.onlyOne.textStroke
    : ZONE_UI_CANVAS_THEME.timer.standard.textStroke;
  ctx.fillStyle = isOnlyOneTimer
    ? ZONE_UI_CANVAS_THEME.timer.onlyOne.textFill
    : ZONE_UI_CANVAS_THEME.timer.standard.textFill;
  ctx.strokeText(timerText, x + width * 0.5, y + height * 0.5);
  ctx.fillText(timerText, x + width * 0.5, y + height * 0.5);

  if (defeatCounterText) {
    const counterTextSize = compactHud
      ? Math.max(8, Math.min(11, Math.round(height * 0.58)))
      : Math.max(10, Math.min(14, Math.round(height * 0.64)));
    const counterY = y + height + (compactHud ? 4 : 6);
    ctx.font = `700 ${counterTextSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = ZONE_UI_CANVAS_THEME.timer.counterStroke;
    ctx.fillStyle = ZONE_UI_CANVAS_THEME.timer.counterFill;
    ctx.strokeText(defeatCounterText, x + width * 0.5, counterY);
    ctx.fillText(defeatCounterText, x + width * 0.5, counterY);
  }
  ctx.restore();
}

function getProjectileTypeVfxProfile(typeName) {
  return getSharedProjectileTypeVfxProfile(typeName);
}

function getProjectileTrailTypeVfxProfile(typeName) {
  return getSharedProjectileTrailTypeVfxProfile(typeName);
}

function drawProjectileTypeMotif(projectile, rgb, radius) {
  if (!projectile || !Number.isFinite(projectile.x) || !Number.isFinite(projectile.y)) {
    return;
  }
  const profile = getProjectileTypeVfxProfile(projectile.attackType);
  const accent = Array.isArray(profile.accent) ? profile.accent : [255, 255, 255];
  const intensity = clamp(Number(profile.intensity) || 1, 0.7, 1.4);
  const ageMs = Math.max(0, Number(projectile.lifetimeMs) || 0);
  const spin = Number(projectile.spinPhase) || 0;
  const pulse = 0.72 + Math.sin(ageMs * 0.018 + spin) * 0.28;
  const r = radius * intensity;

  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(Number(projectile.rotation) || 0);
  ctx.globalCompositeOperation = "lighter";

  switch (profile.motif) {
    case "flame": {
      for (let i = 0; i < 2; i += 1) {
        const fx = -r * (1.05 + i * 0.42);
        const fy = Math.sin(ageMs * 0.026 + i * 1.4) * r * 0.24;
        const fr = r * (0.95 - i * 0.18) * (0.85 + pulse * 0.25);
        const flame = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 1.9);
        flame.addColorStop(0, rgba(accent, 0.74));
        flame.addColorStop(0.48, rgba(rgb, 0.56));
        flame.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = flame;
        ctx.beginPath();
        ctx.arc(fx, fy, fr * 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "droplet": {
      ctx.strokeStyle = rgba(accent, 0.45 + pulse * 0.12);
      ctx.lineWidth = Math.max(1.1, r * 0.23);
      ctx.beginPath();
      ctx.arc(0, 0, r * (1.05 + pulse * 0.2), 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 2; i += 1) {
        const dx = -r * (0.85 + i * 0.4);
        const dy = Math.sin(ageMs * 0.018 + i * 1.3) * r * 0.32;
        ctx.fillStyle = rgba(accent, 0.68);
        ctx.beginPath();
        ctx.ellipse(dx, dy, r * 0.26, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "leaf": {
      for (let i = 0; i < 2; i += 1) {
        const angle = (i === 0 ? 0.62 : -0.62) + Math.sin(ageMs * 0.012 + i) * 0.12;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = rgba(accent, 0.68);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.78, r * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "bolt": {
      ctx.strokeStyle = rgba(accent, 0.88);
      ctx.lineWidth = Math.max(1.4, r * 0.26);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 1.05, -r * 0.16);
      ctx.lineTo(-r * 0.32, -r * 0.52);
      ctx.lineTo(-r * 0.18, -r * 0.06);
      ctx.lineTo(r * 0.76, -r * 0.33);
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 0.72);
      ctx.lineWidth = Math.max(1, r * 0.13);
      ctx.beginPath();
      ctx.moveTo(-r * 1.05, -r * 0.16);
      ctx.lineTo(-r * 0.32, -r * 0.52);
      ctx.lineTo(-r * 0.18, -r * 0.06);
      ctx.lineTo(r * 0.76, -r * 0.33);
      ctx.stroke();
      break;
    }
    case "crystal": {
      ctx.strokeStyle = rgba(accent, 0.78);
      ctx.lineWidth = Math.max(1.1, r * 0.16);
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI / 2) * i;
        const dx = Math.cos(angle) * r * 0.9;
        const dy = Math.sin(angle) * r * 0.9;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dx, dy);
        ctx.stroke();
      }
      break;
    }
    case "impact": {
      ctx.strokeStyle = rgba(accent, 0.72);
      ctx.lineWidth = Math.max(1.2, r * 0.18);
      for (let i = 0; i < 3; i += 1) {
        const offsetY = (i - 1) * r * 0.28;
        ctx.beginPath();
        ctx.moveTo(-r * 1.1, offsetY);
        ctx.lineTo(r * 0.86, offsetY * 0.45);
        ctx.stroke();
      }
      break;
    }
    case "bubble": {
      for (let i = 0; i < 3; i += 1) {
        const offset = i - 1;
        const bx = offset * r * 0.46;
        const by = Math.sin(ageMs * 0.01 + i * 1.3) * r * 0.28;
        ctx.strokeStyle = rgba(accent, 0.54);
        ctx.lineWidth = Math.max(1, r * 0.11);
        ctx.beginPath();
        ctx.arc(bx, by, r * (0.3 + i * 0.05), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "dust": {
      for (let i = 0; i < 3; i += 1) {
        const dx = -r * (0.55 + i * 0.35);
        const dy = Math.sin(ageMs * 0.014 + i * 1.1) * r * 0.24;
        ctx.fillStyle = rgba(accent, 0.56);
        ctx.beginPath();
        ctx.arc(dx, dy, r * (0.24 - i * 0.04), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "wind": {
      ctx.strokeStyle = rgba(accent, 0.7);
      ctx.lineWidth = Math.max(1.1, r * 0.17);
      for (let i = 0; i < 2; i += 1) {
        const stretch = 1 + i * 0.24;
        ctx.beginPath();
        ctx.ellipse(-r * 0.1, 0, r * 0.92 * stretch, r * 0.36, 0, Math.PI * 0.14, Math.PI * 1.74);
        ctx.stroke();
      }
      break;
    }
    case "orbit": {
      ctx.strokeStyle = rgba(accent, 0.52);
      ctx.lineWidth = Math.max(1.1, r * 0.13);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.02, r * 0.52, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 2; i += 1) {
        const angle = ageMs * 0.012 + i * Math.PI;
        const ox = Math.cos(angle) * r * 1.02;
        const oy = Math.sin(angle) * r * 0.52;
        ctx.fillStyle = rgba(accent, 0.88);
        ctx.beginPath();
        ctx.arc(ox, oy, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "wing": {
      for (let i = 0; i < 2; i += 1) {
        const sign = i === 0 ? -1 : 1;
        ctx.strokeStyle = rgba(accent, 0.62);
        ctx.lineWidth = Math.max(1, r * 0.14);
        ctx.beginPath();
        ctx.ellipse(sign * r * 0.18, 0, r * 0.58, r * 0.24, sign * 0.28, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "shard": {
      ctx.fillStyle = rgba(accent, 0.64);
      for (let i = 0; i < 2; i += 1) {
        const shift = i === 0 ? -r * 0.24 : r * 0.2;
        ctx.beginPath();
        ctx.moveTo(shift, -r * 0.48);
        ctx.lineTo(shift + r * 0.3, -r * 0.05);
        ctx.lineTo(shift + r * 0.08, r * 0.5);
        ctx.lineTo(shift - r * 0.24, r * 0.06);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "wisp": {
      const glow = ctx.createRadialGradient(-r * 0.28, 0, 0, -r * 0.28, 0, r * 1.55);
      glow.addColorStop(0, rgba(accent, 0.48 + pulse * 0.18));
      glow.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(-r * 0.28, 0, r * 1.55, r * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rune": {
      ctx.strokeStyle = rgba(accent, 0.78);
      ctx.lineWidth = Math.max(1.1, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(r * 0.78, r * 0.44);
      ctx.lineTo(-r * 0.78, r * 0.44);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "shadow": {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(25, 24, 34, 0.45)";
      ctx.beginPath();
      ctx.arc(r * 0.14, 0, r * 1.08, Math.PI * 0.15, Math.PI * 1.85);
      ctx.arc(-r * 0.28, 0, r * 0.8, Math.PI * 1.85, Math.PI * 0.15, true);
      ctx.fill();
      break;
    }
    case "gear": {
      ctx.strokeStyle = rgba(accent, 0.74);
      ctx.lineWidth = Math.max(1.2, r * 0.17);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, 0);
      ctx.lineTo(r * 0.9, 0);
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(0, r * 0.9);
      ctx.stroke();
      break;
    }
    case "sparkle": {
      ctx.strokeStyle = rgba(accent, 0.82);
      ctx.lineWidth = Math.max(1.1, r * 0.14);
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI / 4) * i + ageMs * 0.0009;
        const dx = Math.cos(angle) * r * 0.9;
        const dy = Math.sin(angle) * r * 0.9;
        ctx.beginPath();
        ctx.moveTo(-dx, -dy);
        ctx.lineTo(dx, dy);
        ctx.stroke();
      }
      break;
    }
    case "ring":
    default: {
      ctx.strokeStyle = rgba(accent, 0.6 + pulse * 0.12);
      ctx.lineWidth = Math.max(1, r * 0.13);
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.92 + pulse * 0.16), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

function getLaserVisualProfile(attackType, pulse, distance) {
  const sharedProfile = getLaserTypeVfxProfile(attackType);
  const rgb = getTypeColor(sharedProfile.type);
  const safeDistance = Math.max(0, Number(distance) || 0);
  const safePulse = clamp(Number(pulse) || 0, 0, 1);
  const baseAmplitude = clamp(
    safeDistance * sharedProfile.waveDistanceRatio,
    sharedProfile.waveAmplitudeMin,
    sharedProfile.waveAmplitudeMax,
  );
  const particleCount = clamp(
    Math.round(safeDistance / 54) + 2 + Math.round(sharedProfile.widthBoost * 1.4),
    3,
    10,
  );
  return {
    type: sharedProfile.type,
    rgb,
    laserPattern: sharedProfile.laserPattern,
    beamPattern: sharedProfile.beamPattern,
    accentRgb: sharedProfile.accentRgb,
    fringeRgb: sharedProfile.fringeRgb,
    glowRgb: sharedProfile.glowRgb,
    waveAmplitude: baseAmplitude * sharedProfile.waveAmplitudeMul * (0.92 + safePulse * 0.16),
    waveFrequency: sharedProfile.waveFrequency,
    secondaryWave: sharedProfile.secondaryWave,
    waveSpeed: sharedProfile.waveSpeed,
    particleSpeed: sharedProfile.particleSpeed,
    particleCount,
    particleSize: sharedProfile.particleSize,
    particleShape: sharedProfile.particleShape,
    ribbonAlpha: sharedProfile.ribbonAlpha,
    ribbonOffset: sharedProfile.ribbonOffset,
    ribbonDrift: sharedProfile.ribbonDrift,
    jaggedness: sharedProfile.jaggedness,
    widthBoost: sharedProfile.widthBoost,
    coreBoost: sharedProfile.coreBoost,
    sourceGlowBoost: sharedProfile.sourceGlowBoost,
    impactGlowBoost: sharedProfile.impactGlowBoost,
    emitterSpin: sharedProfile.emitterSpin,
    impactRingAlpha: sharedProfile.impactRingAlpha,
    impactRayCount: sharedProfile.impactRayCount,
  };
}

function drawLaserParticleShape(shape, x, y, size, angle, fillStyle, alpha, outlineStyle) {
  const safeAlpha = clamp(Number(alpha), 0, 1);
  if (safeAlpha <= 0.01 || size <= 0.05) {
    return;
  }
  const pixel = Math.max(1, snapVfxDimension(size * 0.55, 1));
  const centerX = snapVfxPixel(x);
  const centerY = snapVfxPixel(y);
  const fill = fillStyle || "rgba(255,255,255,1)";
  const outline = outlineStyle || fill;
  const drawCell = (cellX, cellY, style = fill) => {
    ctx.fillStyle = style;
    ctx.fillRect(centerX + cellX * pixel, centerY + cellY * pixel, pixel, pixel);
  };
  ctx.save();
  ctx.globalAlpha = safeAlpha;
  switch (shape) {
    case "ember":
      drawCell(0, -1, outline);
      drawCell(1, 0, fill);
      drawCell(0, 0, fill);
      drawCell(-1, 0, outline);
      drawCell(0, 1, fill);
      break;
    case "droplet":
      drawCell(0, -1, outline);
      drawCell(-1, 0, outline);
      drawCell(0, 0, fill);
      drawCell(1, 0, outline);
      drawCell(0, 1, fill);
      break;
    case "leaf":
      drawCell(-1, -1, outline);
      drawCell(-1, 0, fill);
      drawCell(0, 0, fill);
      drawCell(1, 0, fill);
      drawCell(1, 1, outline);
      break;
    case "spark":
      drawCell(0, -1, outline);
      drawCell(-1, 0, outline);
      drawCell(0, 0, fill);
      drawCell(1, 0, outline);
      drawCell(0, 1, outline);
      break;
    case "crystal":
    case "shard":
      drawCell(0, -1, outline);
      drawCell(1, 0, fill);
      drawCell(0, 0, fill);
      drawCell(0, 1, fill);
      drawCell(-1, 0, outline);
      break;
    case "ring":
      drawCell(-1, -1, outline);
      drawCell(0, -1, outline);
      drawCell(1, -1, outline);
      drawCell(-1, 0, outline);
      drawCell(1, 0, outline);
      drawCell(-1, 1, outline);
      drawCell(0, 1, outline);
      drawCell(1, 1, outline);
      drawCell(0, 0, fill);
      break;
    case "wisp":
      drawCell(-1, 0, outline);
      drawCell(0, -1, fill);
      drawCell(0, 0, fill);
      drawCell(1, 0, fill);
      drawCell(0, 1, fill);
      break;
    case "star":
      drawCell(0, -1, outline);
      drawCell(-1, 0, outline);
      drawCell(0, 0, fill);
      drawCell(1, 0, outline);
      drawCell(0, 1, outline);
      break;
    case "dust":
      drawCell(-1, 0, outline);
      drawCell(0, -1, fill);
      drawCell(0, 0, fill);
      drawCell(1, 0, outline);
      break;
    case "feather":
      drawCell(-1, -1, outline);
      drawCell(-1, 0, fill);
      drawCell(0, 0, fill);
      drawCell(1, 0, fill);
      drawCell(1, 1, outline);
      break;
    default:
      drawCell(0, -1, outline);
      drawCell(-1, 0, outline);
      drawCell(0, 0, fill);
      drawCell(1, 0, outline);
      drawCell(0, 1, outline);
      break;
  }
  ctx.restore();
}

function getLaserOffsetAtT(t, timeMs, phase, profile) {
  const taper = Math.sin(t * Math.PI);
  let offset = Math.sin(
    t * Math.PI * (1.18 + profile.waveFrequency * 1.68)
    - timeMs * profile.waveSpeed
    + phase
  ) * profile.waveAmplitude * taper;
  if (profile.secondaryWave > 0.001) {
    offset += Math.cos(
      t * Math.PI * (2.2 + profile.waveFrequency)
      + timeMs * profile.waveSpeed * 0.68
      + phase * 1.7
    ) * profile.waveAmplitude * profile.secondaryWave * taper;
  }
  if (profile.jaggedness > 0.001) {
    const tooth = Math.sin(t * Math.PI * 13 + phase * 1.4 + timeMs * profile.waveSpeed * 0.5);
    offset += (tooth >= 0 ? 1 : -1) * profile.waveAmplitude * profile.jaggedness * taper;
  }
  return offset;
}

function sampleLaserPoint(sourceX, sourceY, targetX, targetY, normalX, normalY, timeMs, phase, profile, t, output = null) {
  const offset = getLaserOffsetAtT(t, timeMs, phase, profile);
  const point = output || { x: 0, y: 0, offset: 0 };
  point.x = snapVfxPixel(sourceX + (targetX - sourceX) * t + normalX * offset);
  point.y = snapVfxPixel(sourceY + (targetY - sourceY) * t + normalY * offset);
  point.offset = offset;
  return point;
}

function traceLaserCurve(points) {
  traceLaserSteppedPath(points);
}

function traceLaserSegment(sourceX, sourceY, targetX, targetY) {
  ctx.beginPath();
  ctx.moveTo(snapVfxPixel(sourceX), snapVfxPixel(sourceY));
  ctx.lineTo(snapVfxPixel(targetX), snapVfxPixel(targetY));
}

function createLaserRuntimeCanvas(width, height) {
  return createVfxRuntimeCanvas(width, height);
}

const packedLaserBeamTextureCache = {};

function drawPackedLaserTextureBands(textureCtx, profile, width, height) {
  const centerY = Math.floor(height * 0.5);
  const pixel = Math.max(1, Math.floor(height / 8));
  const accentStyle = rgba(profile.accentRgb, 0.92);
  const fringeStyle = rgba(profile.fringeRgb, 0.98);
  const glowStyle = rgba(profile.glowRgb, 0.28);
  textureCtx.save();
  setCanvasImageSmoothing(textureCtx, false);
  switch (profile.beamPattern || profile.type) {
    case "flame_band":
      for (let i = 0; i < 4; i += 1) {
        const startX = Math.floor(width * (0.08 + i * 0.22));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(startX, centerY - pixel * 2 + (i % 2 === 0 ? 0 : pixel), pixel * 3, pixel);
        textureCtx.fillRect(startX + pixel * 2, centerY - pixel + (i % 2 === 0 ? pixel : 0), pixel * 3, pixel);
        textureCtx.fillStyle = glowStyle;
        textureCtx.fillRect(startX, centerY - pixel * 3, pixel * 2, pixel);
      }
      break;
    case "water_band":
      for (let i = 0; i < 3; i += 1) {
        const yOffset = (i - 1) * pixel * 2;
        textureCtx.fillStyle = i === 1 ? fringeStyle : accentStyle;
        for (let x = 0; x < width; x += pixel * 4) {
          textureCtx.fillRect(x, centerY + yOffset, pixel * 2, pixel);
        }
      }
      break;
    case "grass_band":
      for (let i = 0; i < 5; i += 1) {
        const x = Math.floor(width * (0.12 + i * 0.17));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x, centerY + pixel, pixel, pixel * 2);
        textureCtx.fillRect(x + pixel, centerY, pixel, pixel * 2);
        textureCtx.fillStyle = glowStyle;
        textureCtx.fillRect(x, centerY - pixel, pixel, pixel);
      }
      break;
    case "electric_band":
      for (let i = 0; i < 4; i += 1) {
        const startX = Math.floor(width * (0.06 + i * 0.23));
        textureCtx.fillStyle = fringeStyle;
        textureCtx.fillRect(startX, centerY - pixel * 2, pixel * 2, pixel);
        textureCtx.fillRect(startX + pixel, centerY - pixel, pixel * 2, pixel);
        textureCtx.fillRect(startX, centerY, pixel * 2, pixel);
        textureCtx.fillRect(startX + pixel * 2, centerY + pixel, pixel * 2, pixel);
      }
      break;
    case "ice_band":
      for (let i = 0; i < 6; i += 1) {
        const x = Math.floor(width * (0.1 + i * 0.14));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x, centerY - pixel * 2, pixel, pixel);
        textureCtx.fillRect(x + pixel, centerY - pixel, pixel, pixel);
        textureCtx.fillRect(x, centerY, pixel, pixel);
        textureCtx.fillRect(x + pixel, centerY + pixel, pixel, pixel);
      }
      break;
    case "rock_band":
    case "ground_band":
      for (let i = 0; i < 5; i += 1) {
        const x = Math.floor(width * (0.1 + i * 0.18));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x, centerY + pixel, pixel * 2, pixel);
        textureCtx.fillRect(x + pixel, centerY, pixel * 2, pixel);
        textureCtx.fillRect(x + pixel * 3, centerY + pixel, pixel, pixel);
      }
      break;
    case "steel_band":
      for (let i = 0; i < 6; i += 1) {
        const x = Math.floor(width * (0.08 + i * 0.15));
        textureCtx.fillStyle = fringeStyle;
        textureCtx.fillRect(x, centerY - pixel * 2, pixel, pixel * 4);
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x + pixel, centerY - pixel, pixel, pixel * 2);
      }
      break;
    case "poison_band":
      for (let i = 0; i < 4; i += 1) {
        const x = Math.floor(width * (0.18 + i * 0.2));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x, centerY + (i % 2 === 0 ? -pixel : pixel), pixel * 2, pixel * 2);
        textureCtx.fillStyle = glowStyle;
        textureCtx.fillRect(x + pixel, centerY, pixel, pixel);
      }
      break;
    case "psychic_band":
    case "ghost_band":
    case "dark_band":
      for (let i = 0; i < 3; i += 1) {
        const x = Math.floor(width * (0.22 + i * 0.26));
        textureCtx.fillStyle = glowStyle;
        textureCtx.fillRect(x, centerY - pixel * 2, pixel * 2, pixel * 4);
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x + pixel, centerY - pixel, pixel * 2, pixel * 2);
      }
      break;
    case "fairy_band":
      for (let i = 0; i < 4; i += 1) {
        const x = Math.floor(width * (0.14 + i * 0.18));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x - pixel, centerY, pixel * 3, pixel);
        textureCtx.fillRect(x, centerY - pixel, pixel, pixel * 3);
      }
      break;
    default:
      for (let i = 0; i < 4; i += 1) {
        const x = Math.floor(width * (0.14 + i * 0.2));
        textureCtx.fillStyle = accentStyle;
        textureCtx.fillRect(x, centerY - pixel, pixel * 2, pixel);
        textureCtx.fillRect(x + pixel, centerY, pixel * 2, pixel);
      }
      break;
  }
  textureCtx.restore();
}

function buildPackedLaserBeamTexture(profile) {
  const texture = createLaserRuntimeCanvas(
    COMBAT_VFX_CONFIG.laserPackedTextureWidthPx,
    COMBAT_VFX_CONFIG.laserPackedTextureHeightPx,
  );
  const textureCtx = texture?.getContext?.("2d");
  if (!textureCtx) {
    return null;
  }
  const width = Number(texture.width) || Math.max(32, Number(COMBAT_VFX_CONFIG.laserPackedTextureWidthPx) || 160);
  const height = Number(texture.height) || Math.max(16, Number(COMBAT_VFX_CONFIG.laserPackedTextureHeightPx) || 48);
  const centerY = Math.floor(height * 0.5);
  const pixel = Math.max(1, Math.floor(height / 8));
  setCanvasImageSmoothing(textureCtx, false);
  textureCtx.clearRect(0, 0, width, height);
  textureCtx.fillStyle = rgba(profile.glowRgb, 0.14);
  textureCtx.fillRect(0, centerY - pixel * 3, width, pixel * 6);
  textureCtx.fillStyle = rgba(profile.accentRgb, 0.78);
  textureCtx.fillRect(0, centerY - pixel * 2, width, pixel * 4);
  textureCtx.fillStyle = rgba(profile.fringeRgb, 0.98);
  textureCtx.fillRect(0, centerY - pixel, width, pixel * 2);
  textureCtx.fillStyle = rgba([255, 255, 255], 0.7);
  textureCtx.fillRect(0, centerY, width, pixel);
  textureCtx.fillStyle = rgba(profile.accentRgb, 0.24);
  for (let x = 0; x < width; x += pixel * 3) {
    textureCtx.fillRect(x, centerY - pixel * 3, pixel, pixel);
    textureCtx.fillRect(x + pixel, centerY + pixel * 2, pixel, pixel);
  }
  drawPackedLaserTextureBands(textureCtx, profile, width, height);
  return texture;
}

function getPackedLaserBeamTexture(profile) {
  const customTexture = getCustomLaserBeamTexture(profile);
  if (customTexture) {
    return customTexture;
  }
  const cacheKey = `${String(profile?.type || "normal")}:${String(profile?.beamPattern || "neutral_band")}`;
  if (packedLaserBeamTextureCache[cacheKey] !== undefined) {
    laserTextureCacheStats.hits += 1;
    return packedLaserBeamTextureCache[cacheKey];
  }
  laserTextureCacheStats.misses += 1;
  const texture = buildPackedLaserBeamTexture(profile);
  packedLaserBeamTextureCache[cacheKey] = texture;
  return texture;
}

function drawPackedLaserBeam(sourceX, sourceY, targetX, targetY, distance, profile, haloWidth, pulse, budget, textureOverride = null) {
  const texture = textureOverride || getPackedLaserBeamTexture(profile);
  if (!texture) {
    return false;
  }
  const usingCustomTexture = Boolean(textureOverride);
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const beamHeight = clamp(
    haloWidth * (profile.type === "electric" ? 1.7 : profile.type === "water" ? 1.9 : 1.82),
    9,
    30,
  );
  const snappedBeamHeight = snapVfxDimension(beamHeight, 8);
  const beamAlpha = usingCustomTexture ? 1 : clamp(0.9 + pulse * 0.08, 0.5, 1);
  ctx.save();
  ctx.globalCompositeOperation = budget.composite;
  ctx.globalAlpha = beamAlpha;
  setCanvasImageSmoothing(ctx, false);
  ctx.translate(snapVfxPixel(sourceX), snapVfxPixel(sourceY));
  ctx.rotate(angle);
  ctx.drawImage(texture, 0, -snappedBeamHeight * 0.5, snapVfxDimension(distance, 8), snappedBeamHeight);
  ctx.restore();
  return true;
}

function drawLaserContrastSegment(sourceX, sourceY, targetX, targetY, haloWidth, coreWidth, profile, pulse, flowPulse) {
  const contrastHaloRgb = blendRgb(profile.accentRgb, [8, 12, 22], 0.84);
  const contrastCoreRgb = blendRgb(profile.fringeRgb, [10, 16, 28], 0.76);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.setLineDash([]);
  ctx.strokeStyle = rgba(contrastHaloRgb, 0.14 + pulse * 0.04);
  ctx.lineWidth = Math.max(2, snapVfxDimension(haloWidth * 0.52, 2));
  traceLaserSegment(sourceX, sourceY, targetX, targetY);
  ctx.stroke();
  ctx.strokeStyle = rgba(contrastCoreRgb, 0.2 + flowPulse * 0.04);
  ctx.lineWidth = Math.max(1, snapVfxDimension(coreWidth * 0.92, 1));
  traceLaserSegment(sourceX, sourceY, targetX, targetY);
  ctx.stroke();
  ctx.restore();
}

function drawLaserContrastCurve(points, haloWidth, coreWidth, profile, pulse, flowPulse) {
  const contrastHaloRgb = blendRgb(profile.accentRgb, [8, 12, 22], 0.84);
  const contrastCoreRgb = blendRgb(profile.fringeRgb, [10, 16, 28], 0.76);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.setLineDash([]);
  ctx.strokeStyle = rgba(contrastHaloRgb, 0.16 + pulse * 0.04);
  ctx.lineWidth = Math.max(2, snapVfxDimension(haloWidth * 0.54, 2));
  traceLaserCurve(points);
  ctx.stroke();
  ctx.strokeStyle = rgba(contrastCoreRgb, 0.22 + flowPulse * 0.04);
  ctx.lineWidth = Math.max(1, snapVfxDimension(coreWidth * 0.96, 1));
  traceLaserCurve(points);
  ctx.stroke();
  ctx.restore();
}

function getLaserRenderBudget(qualityKey, distance) {
  const safeDistance = Math.max(0, Number(distance) || 0);
  const budget = laserRenderBudgetScratch;
  const nearThreshold = Math.max(48, Number(COMBAT_VFX_CONFIG.laserDistanceNearPx) || 110);
  const midThreshold = Math.max(nearThreshold + 1, Number(COMBAT_VFX_CONFIG.laserDistanceMidPx) || 220);
  const farThreshold = Math.max(midThreshold + 1, Number(COMBAT_VFX_CONFIG.laserDistanceFarPx) || 420);
  const phoneLike = Boolean(state.layout?.viewportProfile?.phone);
  const bucket = safeDistance <= nearThreshold ? "near" : safeDistance <= midThreshold ? "mid" : safeDistance <= farThreshold ? "far" : "far";
  let renderPath = "pixel_curved";
  switch (String(qualityKey || "medium")) {
    case "very_low":
    case "low":
      renderPath = "packed_simple";
      break;
    case "medium":
      renderPath = "packed_simple";
      break;
    case "high":
      renderPath = bucket === "far" ? "pixel_curved" : "packed_simple";
      break;
    case "ultra":
    default:
      renderPath = bucket === "near" ? "pixel_curved" : "hero_curved";
      break;
  }
  if (phoneLike && renderPath === "hero_curved") {
    renderPath = "pixel_curved";
  }
  const segmentMax = renderPath === "packed_simple"
    ? Math.max(1, toSafeInt(COMBAT_VFX_CONFIG.laserPackedSimpleSegmentMaxCount, 1))
    : renderPath === "pixel_curved"
      ? Math.max(2, toSafeInt(COMBAT_VFX_CONFIG.laserPixelCurvedSegmentMaxCount, 8))
      : Math.max(3, toSafeInt(COMBAT_VFX_CONFIG.laserHeroCurvedSegmentMaxCount, 14));
  const particleMax = renderPath === "packed_simple"
    ? Math.max(0, toSafeInt(COMBAT_VFX_CONFIG.laserPackedSimpleParticleMaxCount, 0))
    : renderPath === "pixel_curved"
      ? Math.max(0, toSafeInt(COMBAT_VFX_CONFIG.laserPixelCurvedParticleMaxCount, 2))
      : Math.max(0, toSafeInt(COMBAT_VFX_CONFIG.laserHeroCurvedParticleMaxCount, 4));
  const bucketMul = bucket === "near" ? 0.35 : bucket === "mid" ? 0.68 : 1;
  const phoneMul = phoneLike ? 0.5 : 1;
  budget.renderPath = renderPath;
  budget.distanceBucket = bucket;
  budget.simple = renderPath === "packed_simple";
  budget.curved = !budget.simple;
  budget.segmentDivisor = renderPath === "packed_simple"
    ? 999
    : renderPath === "pixel_curved"
      ? (bucket === "far" ? 44 : 56)
      : (bucket === "far" ? 24 : 34);
  budget.minSegments = renderPath === "packed_simple" ? 1 : renderPath === "pixel_curved" ? 3 : 5;
  budget.maxSegments = renderPath === "packed_simple"
    ? 1
    : Math.max(
        budget.minSegments,
        Math.round(segmentMax * (bucket === "near" ? 0.58 : bucket === "mid" ? 0.82 : 1)),
      );
  budget.waveAmplitudeMul = renderPath === "packed_simple" ? 0.1 : renderPath === "pixel_curved" ? 0.36 : 0.56;
  budget.secondaryWaveMul = renderPath === "packed_simple" ? 0.04 : renderPath === "pixel_curved" ? 0.18 : 0.3;
  budget.jaggednessMul = renderPath === "packed_simple" ? 0.28 : renderPath === "pixel_curved" ? 0.68 : 0.88;
  budget.ribbonEnabled = renderPath === "hero_curved" && !phoneLike;
  budget.ribbonAlphaMul = renderPath === "hero_curved" && !phoneLike ? 0.28 : 0;
  budget.beamParticles = Math.max(0, Math.round(particleMax * bucketMul * phoneMul));
  budget.sourceParticles = renderPath === "hero_curved" ? Math.min(2, budget.beamParticles) : 0;
  budget.impactParticles = renderPath === "hero_curved" ? Math.min(2, budget.beamParticles) : 0;
  budget.impactRayCountMax = renderPath === "hero_curved" ? 7 : renderPath === "pixel_curved" ? 4 : 0;
  budget.useLinearGradients = false;
  budget.useRadialGradients = false;
  budget.useShadowBlur = false;
  budget.shadowBlurMul = 0;
  budget.useSheath = renderPath === "hero_curved";
  budget.useFilament = false;
  budget.composite = "source-over";
  budget.widthMul = renderPath === "packed_simple"
    ? Math.max(0.4, Number(COMBAT_VFX_CONFIG.laserPackedSimpleWidthMultiplier) || 0.82)
    : renderPath === "pixel_curved"
      ? Math.max(0.4, Number(COMBAT_VFX_CONFIG.laserPixelCurvedWidthMultiplier) || 0.94)
      : Math.max(0.4, Number(COMBAT_VFX_CONFIG.laserHeroCurvedWidthMultiplier) || 1.04);
  budget.sourceGlowScale = renderPath === "packed_simple" ? 0.82 : renderPath === "pixel_curved" ? 0.96 : 1;
  budget.impactGlowScale = renderPath === "packed_simple" ? 0.86 : renderPath === "pixel_curved" ? 0.98 : 1;
  budget.electricDash = renderPath === "hero_curved";
  budget.renderImpactRing = renderPath !== "packed_simple";
  budget.renderEndpoints = true;
  budget.preferPackedBeam = renderPath === "packed_simple";
  return budget;
}

function getVisibleLaserSegment(laser) {
  const sourceX = Number(laser?.sourceX || 0);
  const sourceY = Number(laser?.sourceY || 0);
  const targetX = Number(laser?.targetX || 0);
  const targetY = Number(laser?.targetY || 0);
  const rawDx = targetX - sourceX;
  const rawDy = targetY - sourceY;
  const rawDistance = Math.hypot(rawDx, rawDy);
  if (rawDistance <= 0.01) {
    return null;
  }
  let sourceInset = Math.max(0, Number(laser?.visualSourceInsetPx) || 0);
  let targetInset = Math.max(0, Number(laser?.visualTargetInsetPx) || 0);
  const maxInsetTotal = Math.max(0, rawDistance - 6);
  const requestedInsetTotal = sourceInset + targetInset;
  if (requestedInsetTotal > maxInsetTotal && requestedInsetTotal > 0.001) {
    const insetScale = maxInsetTotal / requestedInsetTotal;
    sourceInset *= insetScale;
    targetInset *= insetScale;
  }
  const rawUnitX = rawDx / rawDistance;
  const rawUnitY = rawDy / rawDistance;
  const visibleSourceX = sourceX + rawUnitX * sourceInset;
  const visibleSourceY = sourceY + rawUnitY * sourceInset;
  const visibleTargetX = targetX - rawUnitX * targetInset;
  const visibleTargetY = targetY - rawUnitY * targetInset;
  const visibleDx = visibleTargetX - visibleSourceX;
  const visibleDy = visibleTargetY - visibleSourceY;
  const visibleDistance = Math.hypot(visibleDx, visibleDy);
  if (visibleDistance <= 0.01) {
    return null;
  }
  const segment = laserVisibleSegmentScratch;
  segment.sourceX = visibleSourceX;
  segment.sourceY = visibleSourceY;
  segment.targetX = visibleTargetX;
  segment.targetY = visibleTargetY;
  segment.dx = visibleDx;
  segment.dy = visibleDy;
  segment.distance = visibleDistance;
  segment.unitX = visibleDx / visibleDistance;
  segment.unitY = visibleDy / visibleDistance;
  segment.normalX = -visibleDy / visibleDistance;
  segment.normalY = visibleDx / visibleDistance;
  return segment;
}

function drawLasers(lasers) {
  const laserList = Array.isArray(lasers) ? lasers : [];
  const debug = getVfxRenderDebugState();
  if (debug) {
    debug.qualityTier = String(state.performance?.quality || "medium");
    debug.laser.activeCount = laserList.length;
    debug.laser.renderPathCounts.packed_simple = 0;
    debug.laser.renderPathCounts.pixel_curved = 0;
    debug.laser.renderPathCounts.hero_curved = 0;
    debug.laser.segmentCount = 0;
    debug.laser.particleCount = 0;
    debug.laser.textureCacheSize = Object.keys(packedLaserBeamTextureCache).length;
    debug.laser.textureCacheHits = laserTextureCacheStats.hits;
    debug.laser.textureCacheMisses = laserTextureCacheStats.misses;
  }
  if (laserList.length <= 0) {
    return;
  }
  const timeMs = Math.max(0, Number(state.timeMs) || 0);
  const qualityKey = String(state.performance?.quality || "medium");
  for (const laser of laserList) {
    const visibleSegment = getVisibleLaserSegment(laser);
    if (!visibleSegment) {
      continue;
    }
    const {
      sourceX,
      sourceY,
      targetX,
      targetY,
      dx,
      dy,
      distance,
      unitX,
      unitY,
      normalX,
      normalY,
    } = visibleSegment;
    const phase = Number(laser?.phaseOffset || 0);
    const pulse = 0.5 + 0.5 * Math.sin(timeMs * 0.011 + phase);
    const flowPulse = 0.5 + 0.5 * Math.sin(timeMs * 0.0065 + phase * 1.9);
    const baseAngle = Math.atan2(unitY, unitX);
    const profile = getLaserVisualProfile(laser?.attackType || "normal", pulse, distance);
    const budget = getLaserRenderBudget(qualityKey, distance);
    const customPackedBeam = getCustomLaserBeamTexture(profile);
    const usingCustomPackedBeam = Boolean(customPackedBeam);
    const beamParticleCount = usingCustomPackedBeam ? 0 : Math.max(0, Math.round(budget.beamParticles));
    const sourceParticleCount = usingCustomPackedBeam ? 0 : Math.max(0, Math.round(budget.sourceParticles));
    const impactParticleCount = usingCustomPackedBeam ? 0 : Math.max(0, Math.round(budget.impactParticles));
    if (debug) {
      const pathKey = usingCustomPackedBeam ? "packed_simple" : String(budget.renderPath || "packed_simple");
      if (Object.prototype.hasOwnProperty.call(debug.laser.renderPathCounts, pathKey)) {
        debug.laser.renderPathCounts[pathKey] += 1;
      }
      debug.laser.particleCount += beamParticleCount + sourceParticleCount + impactParticleCount;
    }
    const haloWidth = clamp((6.2 + distance * 0.008 + pulse * 2.6) * profile.widthBoost * budget.widthMul, 4.8, 20);
    const coreWidth = Math.max(1.8, haloWidth * 0.24 + profile.coreBoost);
    const sourceRadius = Math.max(3.2, coreWidth * (1.26 + profile.sourceGlowBoost * 0.24) * budget.sourceGlowScale);
    const impactRadius = Math.max(4.2, coreWidth * (1.55 + profile.impactGlowBoost * 0.28) * budget.impactGlowScale);

    if (usingCustomPackedBeam) {
      if (debug) {
        debug.laser.segmentCount += 1;
      }
      if (drawPackedLaserBeam(sourceX, sourceY, targetX, targetY, distance, profile, haloWidth, pulse, budget, customPackedBeam)) {
        continue;
      }
    }

    if (budget.simple) {
      if (debug) {
        debug.laser.segmentCount += 1;
      }
      if (budget.preferPackedBeam && drawPackedLaserBeam(sourceX, sourceY, targetX, targetY, distance, profile, haloWidth, pulse, budget)) {
        continue;
      }
      drawLaserContrastSegment(sourceX, sourceY, targetX, targetY, haloWidth, coreWidth, profile, pulse, flowPulse);
      ctx.save();
      ctx.globalCompositeOperation = budget.composite;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.setLineDash([]);
      ctx.strokeStyle = rgba(profile.accentRgb, 0.24 + pulse * 0.08);
      ctx.lineWidth = Math.max(2, snapVfxDimension(haloWidth, 2));
      traceLaserSegment(sourceX, sourceY, targetX, targetY);
      ctx.stroke();
      if (profile.type === "electric" && budget.electricDash) {
        ctx.setLineDash([
          Math.max(2, snapVfxDimension(haloWidth * 0.62, 2)),
          Math.max(2, snapVfxDimension(haloWidth * 0.4, 2)),
        ]);
        ctx.lineDashOffset = -timeMs * 0.06;
      }
      ctx.strokeStyle = rgba(profile.fringeRgb, 0.96);
      ctx.lineWidth = Math.max(1, snapVfxDimension(coreWidth, 1));
      traceLaserSegment(sourceX, sourceY, targetX, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      if (budget.renderEndpoints !== false) {
        drawPixelChunkBurst(sourceX, sourceY, sourceRadius * 1.2, rgba(profile.accentRgb, 0.42 + pulse * 0.12), rgba([255, 255, 255], 0.52));
        drawPixelChunkBurst(targetX, targetY, impactRadius * 1.36, rgba(profile.fringeRgb, 0.58 + flowPulse * 0.14), rgba(profile.accentRgb, 0.44));
      }
      if (budget.renderImpactRing) {
        drawPixelBurstRing(targetX, targetY, impactRadius * 1.08, rgba(profile.fringeRgb, 0.28 + flowPulse * 0.1));
      }
      ctx.restore();
      continue;
    }

    const renderProfile = {
      ...profile,
      waveAmplitude: profile.waveAmplitude * budget.waveAmplitudeMul,
      secondaryWave: profile.secondaryWave * budget.secondaryWaveMul,
      jaggedness: profile.jaggedness * budget.jaggednessMul,
      ribbonAlpha: budget.ribbonEnabled ? profile.ribbonAlpha * budget.ribbonAlphaMul : 0,
    };
    const segments = budget.curved
      ? clamp(
          Math.round(distance / budget.segmentDivisor),
          budget.minSegments,
          Math.max(budget.minSegments, budget.maxSegments),
        )
      : 1;
    if (debug) {
      debug.laser.segmentCount += segments;
    }
    const points = laserCurvePointBuffer;
    for (let i = 0; i <= segments; i += 1) {
      points[i] = sampleLaserPoint(
        sourceX,
        sourceY,
        targetX,
        targetY,
        normalX,
        normalY,
        timeMs,
        phase,
        renderProfile,
        i / segments,
        getReusableLaserPoint(points, i),
      );
    }
    points.length = segments + 1;
    const shouldRenderRibbon = renderProfile.ribbonAlpha > 0.01;
    const ribbonOffset = renderProfile.ribbonOffset * (0.8 + pulse * 0.5);
    const ribbonShift = Math.sin(timeMs * renderProfile.waveSpeed * 0.42 + phase * 1.3) * renderProfile.ribbonDrift * ribbonOffset;
    const ribbonPoints = shouldRenderRibbon ? laserRibbonPointBuffer : [];
    const mirrorRibbonPoints = shouldRenderRibbon ? laserMirrorRibbonPointBuffer : [];
    if (shouldRenderRibbon) {
      for (let index = 0; index <= segments; index += 1) {
        const point = points[index];
        const t = segments <= 0 ? 0 : index / segments;
        const taper = Math.sin(t * Math.PI);
        const ribbonPoint = getReusableLaserPoint(ribbonPoints, index);
        const mirrorRibbonPoint = getReusableLaserPoint(mirrorRibbonPoints, index);
        ribbonPoint.x = point.x + normalX * (ribbonShift + ribbonOffset * taper * 0.35);
        ribbonPoint.y = point.y + normalY * (ribbonShift + ribbonOffset * taper * 0.35);
        ribbonPoint.offset = point.offset;
        mirrorRibbonPoint.x = point.x - normalX * (ribbonShift * 0.65 + ribbonOffset * taper * 0.24);
        mirrorRibbonPoint.y = point.y - normalY * (ribbonShift * 0.65 + ribbonOffset * taper * 0.24);
        mirrorRibbonPoint.offset = point.offset;
      }
      ribbonPoints.length = segments + 1;
      mirrorRibbonPoints.length = segments + 1;
    }
    drawLaserContrastCurve(points, haloWidth, coreWidth, profile, pulse, flowPulse);
    let haloStrokeStyle = rgba(profile.accentRgb, 0.42 + pulse * 0.1);
    let coreStrokeStyle = rgba(profile.fringeRgb, 0.94);
    let sheathStrokeStyle = rgba(profile.accentRgb, 0.76);
    let filamentStrokeStyle = rgba(profile.fringeRgb, 0.64);
    if (budget.useLinearGradients) {
      const haloGradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
      haloGradient.addColorStop(0, rgba(profile.rgb, 0.14 + pulse * 0.04));
      haloGradient.addColorStop(0.34, rgba(profile.accentRgb, 0.38 + pulse * 0.08));
      haloGradient.addColorStop(0.72, rgba(profile.fringeRgb, 0.44 + flowPulse * 0.08));
      haloGradient.addColorStop(1, rgba(profile.accentRgb, 0.86));
      haloStrokeStyle = haloGradient;
      const coreGradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
      coreGradient.addColorStop(0, rgba(profile.accentRgb, 0.56));
      coreGradient.addColorStop(0.18, rgba(profile.fringeRgb, 0.96));
      coreGradient.addColorStop(0.6, rgba(blendRgb(profile.accentRgb, [255, 255, 255], 0.22), 0.92));
      coreGradient.addColorStop(1, rgba(profile.fringeRgb, 0.94));
      coreStrokeStyle = coreGradient;
      if (budget.useSheath) {
        const sheathGradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
        sheathGradient.addColorStop(0, rgba(profile.rgb, 0.18));
        sheathGradient.addColorStop(0.22, rgba(profile.accentRgb, 0.72));
        sheathGradient.addColorStop(0.74, rgba(profile.accentRgb, 0.84));
        sheathGradient.addColorStop(1, rgba(profile.fringeRgb, 0.78));
        sheathStrokeStyle = sheathGradient;
      }
      if (budget.useFilament) {
        const filamentGradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
        filamentGradient.addColorStop(0, rgba([255, 255, 255], 0.18));
        filamentGradient.addColorStop(0.28, rgba([255, 255, 255], 0.86));
        filamentGradient.addColorStop(1, rgba(profile.fringeRgb, 0.56));
        filamentStrokeStyle = filamentGradient;
      }
    }
    let sourceFillStyle = rgba(profile.accentRgb, 0.28 + pulse * 0.12);
    let impactFillStyle = rgba(profile.fringeRgb, 0.44 + flowPulse * 0.16);
    if (budget.useRadialGradients) {
      const sourceGradient = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, sourceRadius * 2.2);
      sourceGradient.addColorStop(0, rgba([255, 255, 255], 0.88));
      sourceGradient.addColorStop(0.38, rgba(profile.fringeRgb, 0.52 + pulse * 0.1));
      sourceGradient.addColorStop(1, rgba(profile.accentRgb, 0));
      sourceFillStyle = sourceGradient;
      const impactGradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, impactRadius * 2.45);
      impactGradient.addColorStop(0, rgba([255, 255, 255], 0.94));
      impactGradient.addColorStop(0.32, rgba(profile.fringeRgb, 0.68));
      impactGradient.addColorStop(0.72, rgba(profile.accentRgb, 0.34 + pulse * 0.08));
      impactGradient.addColorStop(1, rgba(profile.accentRgb, 0));
      impactFillStyle = impactGradient;
    }
    ctx.save();
    ctx.globalCompositeOperation = budget.composite;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.shadowColor = budget.useShadowBlur ? rgba(profile.accentRgb, 0.28 + pulse * 0.1) : "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = budget.useShadowBlur ? haloWidth * budget.shadowBlurMul * (1.2 + pulse * 0.35) : 0;
    ctx.strokeStyle = haloStrokeStyle;
    ctx.lineWidth = Math.max(2, snapVfxDimension(haloWidth, 2));
    ctx.setLineDash([]);
    traceLaserCurve(points);
    ctx.stroke();
    if (shouldRenderRibbon) {
      ctx.shadowBlur = budget.useShadowBlur ? haloWidth * budget.shadowBlurMul * 0.7 : 0;
      ctx.strokeStyle = rgba(profile.accentRgb, renderProfile.ribbonAlpha + pulse * 0.06);
      ctx.lineWidth = Math.max(1, snapVfxDimension(haloWidth * 0.5, 1));
      traceLaserCurve(ribbonPoints);
      ctx.stroke();
      ctx.strokeStyle = rgba(profile.fringeRgb, renderProfile.ribbonAlpha * 0.56 + flowPulse * 0.05);
      ctx.lineWidth = Math.max(1, snapVfxDimension(haloWidth * 0.28, 1));
      traceLaserCurve(mirrorRibbonPoints);
      ctx.stroke();
    }
    ctx.shadowBlur = budget.useShadowBlur ? haloWidth * budget.shadowBlurMul * 0.45 : 0;
    ctx.strokeStyle = coreStrokeStyle;
    ctx.lineWidth = Math.max(1, snapVfxDimension(coreWidth, 1));
    if (profile.type === "electric" && budget.electricDash) {
      ctx.setLineDash([
        Math.max(2, snapVfxDimension(haloWidth * 0.72, 2)),
        Math.max(2, snapVfxDimension(haloWidth * 0.45, 2)),
      ]);
      ctx.lineDashOffset = -timeMs * 0.08;
    } else {
      ctx.setLineDash([]);
    }
    traceLaserCurve(points);
    ctx.stroke();
    ctx.setLineDash([]);
    if (budget.useSheath) {
      ctx.shadowBlur = budget.useShadowBlur ? haloWidth * budget.shadowBlurMul * 0.36 : 0;
      ctx.strokeStyle = sheathStrokeStyle;
      ctx.lineWidth = Math.max(1, snapVfxDimension(coreWidth * 0.66, 1));
      traceLaserCurve(points);
      ctx.stroke();
    }
    if (budget.useFilament) {
      ctx.shadowBlur = budget.useShadowBlur ? haloWidth * budget.shadowBlurMul * 0.24 : 0;
      ctx.strokeStyle = filamentStrokeStyle;
      ctx.lineWidth = Math.max(1, snapVfxDimension(coreWidth * 0.34, 1));
      traceLaserCurve(points);
      ctx.stroke();
    }
    if (budget.renderEndpoints !== false) {
      drawPixelChunkBurst(sourceX, sourceY, sourceRadius * 1.22, sourceFillStyle, rgba([255, 255, 255], 0.56));
      drawPixelChunkBurst(targetX, targetY, impactRadius * 1.34, impactFillStyle, rgba(profile.accentRgb, 0.5));
    }
    if (budget.renderImpactRing) {
      drawPixelBurstRing(targetX, targetY, impactRadius * (1.1 + flowPulse * 0.08), rgba(profile.fringeRgb, profile.impactRingAlpha + flowPulse * 0.1));
    }
    const impactRayCount = Math.max(0, Math.min(Math.round(profile.impactRayCount), budget.impactRayCountMax));
    for (let rayIndex = 0; rayIndex < impactRayCount; rayIndex += 1) {
      const rayAngle = phase * 1.3 + rayIndex * ((Math.PI * 2) / Math.max(1, impactRayCount)) + timeMs * 0.0018;
      const innerRadius = impactRadius * (0.5 + flowPulse * 0.05);
      const outerRadius = impactRadius * (1.02 + (rayIndex % 2 === 0 ? 0.22 : 0.06));
      ctx.strokeStyle = rgba(profile.accentRgb, 0.22 + pulse * 0.08);
      ctx.lineWidth = Math.max(0.7, coreWidth * 0.1);
      ctx.beginPath();
      ctx.moveTo(targetX + Math.cos(rayAngle) * innerRadius, targetY + Math.sin(rayAngle) * innerRadius);
      ctx.lineTo(targetX + Math.cos(rayAngle) * outerRadius, targetY + Math.sin(rayAngle) * outerRadius);
      ctx.stroke();
    }
    for (let particleIndex = 0; particleIndex < beamParticleCount; particleIndex += 1) {
      const travel = (particleIndex / beamParticleCount + timeMs * profile.particleSpeed + phase * 0.11) % 1;
      const beamPoint = sampleLaserPoint(sourceX, sourceY, targetX, targetY, normalX, normalY, timeMs, phase, renderProfile, travel);
      const sideSway = Math.sin(travel * Math.PI * 10 + phase + timeMs * profile.waveSpeed * 1.2) * haloWidth * 0.12;
      const px = beamPoint.x + normalX * sideSway;
      const py = beamPoint.y + normalY * sideSway;
      const size = (1.18 + Math.sin(travel * Math.PI) * 0.72) * profile.particleSize * (0.74 + pulse * 0.24);
      const angle = baseAngle + Math.sin(travel * Math.PI * 8 + phase) * 0.2;
      drawLaserParticleShape(
        profile.particleShape,
        px,
        py,
        size,
        angle,
        rgba(profile.accentRgb, 0.94),
        0.5 + 0.22 * Math.sin(travel * Math.PI + flowPulse),
        rgba(profile.fringeRgb, 0.9)
      );
    }
    for (let emitterIndex = 0; emitterIndex < sourceParticleCount; emitterIndex += 1) {
      const orbit = phase + emitterIndex * ((Math.PI * 2) / sourceParticleCount) + timeMs * profile.emitterSpin * (0.8 + emitterIndex * 0.22);
      const orbitDistance = sourceRadius * (0.96 + 0.24 * Math.sin(timeMs * 0.005 + emitterIndex));
      const px = sourceX + Math.cos(orbit) * orbitDistance - unitX * sourceRadius * 0.22;
      const py = sourceY + Math.sin(orbit) * orbitDistance - unitY * sourceRadius * 0.22;
      drawLaserParticleShape(
        profile.particleShape,
        px,
        py,
        profile.particleSize * (1.04 + emitterIndex * 0.14),
        orbit,
        rgba(profile.fringeRgb, 0.94),
        0.46 + pulse * 0.14,
        rgba(profile.accentRgb, 0.88)
      );
    }
    for (let impactIndex = 0; impactIndex < impactParticleCount; impactIndex += 1) {
      const arcAngle = phase * 1.8 + impactIndex * ((Math.PI * 2) / impactParticleCount) - timeMs * 0.0016;
      const arcDistance = impactRadius * (0.94 + (impactIndex % 2 === 0 ? 0.34 : 0.12));
      const px = targetX + Math.cos(arcAngle) * arcDistance;
      const py = targetY + Math.sin(arcAngle) * arcDistance;
      drawLaserParticleShape(
        profile.particleShape,
        px,
        py,
        profile.particleSize * (1.04 + impactIndex * 0.1),
        arcAngle + Math.PI * 0.5,
        rgba(profile.accentRgb, 0.96),
        0.4 + flowPulse * 0.16,
        rgba(profile.fringeRgb, 0.92)
      );
    }
    ctx.restore();
  }
  if (debug) {
    debug.laser.textureCacheSize = Object.keys(packedLaserBeamTextureCache).length;
    debug.laser.textureCacheHits = laserTextureCacheStats.hits;
    debug.laser.textureCacheMisses = laserTextureCacheStats.misses;
  }
}

function getProjectileVariantIndex(projectile, projectileProfile) {
  const variantCount = Math.max(1, toSafeInt(projectileProfile?.projectileVariantCount, 1));
  if (variantCount <= 1) {
    return 0;
  }
  const seed = Math.round(
    (Number(projectile?.spinPhase) || 0) * 997
    + (Number(projectile?.rotation) || 0) * 271
    + (Number(projectile?.lifetimeMs) || 0) * 0.013,
  );
  return Math.abs(seed) % variantCount;
}

function drawProjectileGlyphShape(spriteCtx, profile, rgb, size, variantIndex = 0) {
  const patternRows = resolveProjectilePixelPattern(profile.projectileKind, variantIndex);
  const palette = buildProjectilePixelPalette(profile, rgb);
  const variantScale = clamp(0.84 + (Math.abs(toSafeInt(variantIndex, 0)) % 3) * 0.06, 0.8, 1);
  return drawPixelPattern(spriteCtx, patternRows, palette, size, { scaleMul: variantScale });
}

function buildProjectileSpriteStamp(typeName, variantIndex = 0) {
  const profile = getProjectileTypeVfxProfile(typeName);
  const type = normalizeType(profile.type || typeName);
  const rgb = getTypeColor(type);
  const size = Math.max(20, toSafeInt(COMBAT_VFX_CONFIG.projectileAtlasSizePx, 36));
  const sprite = createVfxRuntimeCanvas(size, size);
  const spriteCtx = sprite?.getContext?.("2d");
  if (!spriteCtx) {
    return null;
  }
  setCanvasImageSmoothing(spriteCtx, false);
  spriteCtx.clearRect(0, 0, size, size);
  drawProjectileGlyphShape(spriteCtx, profile, rgb, size, variantIndex);
  return sprite;
}

function getProjectileSpriteStamp(typeName, variantIndex = 0) {
  const profile = getProjectileTypeVfxProfile(typeName);
  const safeVariant = Math.max(0, Math.min(
    Math.max(1, toSafeInt(profile.projectileVariantCount, 1)) - 1,
    toSafeInt(variantIndex, 0),
  ));
  const customSprite = getCustomProjectileSpriteOverride(profile.type || typeName, safeVariant);
  if (customSprite) {
    return customSprite;
  }
  const cacheKey = `${normalizeType(profile.type || typeName)}:${safeVariant}`;
  if (projectileSpriteAtlasCache.has(cacheKey)) {
    projectileSpriteCacheStats.hits += 1;
    return projectileSpriteAtlasCache.get(cacheKey) || null;
  }
  projectileSpriteCacheStats.misses += 1;
  const sprite = buildProjectileSpriteStamp(typeName, safeVariant);
  projectileSpriteAtlasCache.set(cacheKey, sprite);
  return sprite;
}

function buildProjectileTrailStamp(typeName) {
  const profile = getProjectileTrailTypeVfxProfile(typeName);
  const type = normalizeType(profile.type || typeName);
  const rgb = getTypeColor(type);
  const trailColor = blendRgb(rgb, profile.accent, profile.accentMix);
  const size = Math.max(10, toSafeInt(COMBAT_VFX_CONFIG.projectileTrailStampSizePx, 18));
  const stamp = createVfxRuntimeCanvas(size, size);
  const stampCtx = stamp?.getContext?.("2d");
  if (!stampCtx) {
    return null;
  }
  setCanvasImageSmoothing(stampCtx, false);
  stampCtx.clearRect(0, 0, size, size);
  const patternRows = resolveTrailPixelPattern(profile.trailStampKind);
  const palette = buildTrailPixelPalette(rgb, profile, trailColor);
  drawPixelPattern(stampCtx, patternRows, palette, size, {
    scaleMul: profile.mode === "spark" || profile.mode === "sparkle" ? 0.78 : 0.86,
  });
  return stamp;
}

function getProjectileTrailStamp(typeName) {
  const profile = getProjectileTrailTypeVfxProfile(typeName);
  const customStamp = getCustomProjectileTrailOverride(profile.type || typeName, profile.trailStampKind);
  if (customStamp) {
    return customStamp;
  }
  const cacheKey = normalizeType(profile.type || typeName);
  if (projectileTrailStampCache.has(cacheKey)) {
    projectileTrailCacheStats.hits += 1;
    return projectileTrailStampCache.get(cacheKey) || null;
  }
  projectileTrailCacheStats.misses += 1;
  const stamp = buildProjectileTrailStamp(typeName);
  projectileTrailStampCache.set(cacheKey, stamp);
  return stamp;
}

function drawProjectiles(projectiles) {
  const projectileList = Array.isArray(projectiles) ? projectiles : [];
  const trailStride = Math.max(1, toSafeInt(PROJECTILE_VISUAL_PROFILE.trailStride, 1));
  const trailEnabled = Boolean(PROJECTILE_VISUAL_PROFILE.trailEnabled);
  const trailGlow = Boolean(PROJECTILE_VISUAL_PROFILE.trailGlow);
  const projectileStreak = Boolean(PROJECTILE_VISUAL_PROFILE.streak);
  const projectileAura = Boolean(PROJECTILE_VISUAL_PROFILE.aura);
  const spriteDetail = Boolean(PROJECTILE_VISUAL_PROFILE.spriteDetail);
  const auraScale = clamp(Number(PROJECTILE_VISUAL_PROFILE.auraScale) || 1, 0.45, 1.5);
  const debug = getVfxRenderDebugState();
  if (debug) {
    debug.qualityTier = String(state.performance?.quality || "medium");
    debug.projectile.activeCount = projectileList.length;
    debug.projectile.stampDrawCount = 0;
    debug.projectile.trailStampDrawCount = 0;
    debug.projectile.spriteCacheSize = projectileSpriteAtlasCache.size;
    debug.projectile.spriteCacheHits = projectileSpriteCacheStats.hits;
    debug.projectile.spriteCacheMisses = projectileSpriteCacheStats.misses;
    debug.projectile.trailCacheSize = projectileTrailStampCache.size;
    debug.projectile.trailCacheHits = projectileTrailCacheStats.hits;
    debug.projectile.trailCacheMisses = projectileTrailCacheStats.misses;
  }
  if (projectileList.length <= 0) {
    return;
  }
  const previousSmoothing = "imageSmoothingEnabled" in ctx ? ctx.imageSmoothingEnabled : null;
  setCanvasImageSmoothing(ctx, false);
  for (const projectile of projectileList) {
    const rgb = getTypeColor(projectile.attackType);
    const radius = Math.max(4, Number(projectile.radius) || 8);
    const projectileProfile = getProjectileTypeVfxProfile(projectile.attackType);
    const trailProfile = getProjectileTrailTypeVfxProfile(projectile.attackType);
    const variantIndex = getProjectileVariantIndex(projectile, projectileProfile);
    const sprite = spriteDetail ? getProjectileSpriteStamp(projectile.attackType, variantIndex) : null;
    const trailStamp = trailEnabled ? getProjectileTrailStamp(projectile.attackType) : null;
    const trailPoints = trailEnabled && Array.isArray(projectile.trail) ? projectile.trail : [];
    const movementX = Number(projectile.x) - Number(projectile.prevX);
    const movementY = Number(projectile.y) - Number(projectile.prevY);
    const movementDistance = Math.hypot(movementX, movementY);
    let trailAngle = Number(projectile.rotation) || 0;
    let trailDirX = Math.cos(trailAngle);
    let trailDirY = Math.sin(trailAngle);
    if (movementDistance > 0.0001) {
      trailDirX = movementX / movementDistance;
      trailDirY = movementY / movementDistance;
      trailAngle = Math.atan2(trailDirY, trailDirX);
    }

    if (trailPoints.length > 0 && trailStamp) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      for (let pointIndex = 0; pointIndex < trailPoints.length; pointIndex += trailStride) {
        const point = trailPoints[pointIndex];
        if (!point) {
          continue;
        }
        const lifeRatio = clamp(point.lifeMs / Math.max(1, point.maxLifeMs), 0, 1);
        const pointScale = clamp(Number(point.scale) || 1, 0.72, 1.4);
        const pointRadius = radius * trailProfile.radiusMul * (0.5 + lifeRatio * 0.82) * pointScale;
        const alpha = clamp(
          (trailProfile.alphaBase + lifeRatio * trailProfile.alphaLife) * (trailGlow ? 0.9 : 1),
          0.04,
          0.72,
        );
        const pointPhase = Number(point.phase) || 0;
        const drawWidth = snapVfxDimension(Math.max(4, pointRadius * 2.2 * trailProfile.stretch), 4);
        const drawHeight = snapVfxDimension(Math.max(4, pointRadius * 1.9), 4);
        const snappedX = snapVfxPixel(point.x);
        const snappedY = snapVfxPixel(point.y);
        ctx.save();
        ctx.translate(snappedX, snappedY);
        if (trailGlow) {
          ctx.globalAlpha = alpha * 0.24;
          ctx.drawImage(trailStamp, -drawWidth * 0.6, -drawHeight * 0.6, drawWidth * 1.2, drawHeight * 1.2);
          if (debug) {
            debug.projectile.trailStampDrawCount += 1;
          }
        }
        ctx.globalAlpha = alpha;
        ctx.drawImage(trailStamp, -drawWidth * 0.5, -drawHeight * 0.5, drawWidth, drawHeight);
        ctx.restore();
        if (debug) {
          debug.projectile.trailStampDrawCount += 1;
        }
      }
      ctx.restore();
    }

    const projectilePulse = 0.72 + Math.sin((Number(projectile.lifetimeMs) || 0) * 0.018 + (Number(projectile.spinPhase) || 0)) * 0.2;
    const snappedX = snapVfxPixel(projectile.x);
    const snappedY = snapVfxPixel(projectile.y);
    const spriteSize = snapVfxDimension(
      Math.max(12, radius * 5.2 * clamp(Number(projectileProfile.projectileScale) || 1, 0.75, 1.35)),
      12,
    );
    if (sprite) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.translate(snappedX, snappedY);
      if (projectileAura) {
        const auraSize = snapVfxDimension(spriteSize * (1.08 + auraScale * 0.08), spriteSize);
        ctx.globalAlpha = clamp((Number(COMBAT_VFX_CONFIG.projectileGlowAlpha) || 0.1) * projectilePulse, 0.04, 0.22);
        ctx.drawImage(sprite, -auraSize * 0.5, -auraSize * 0.5, auraSize, auraSize);
        if (debug) {
          debug.projectile.stampDrawCount += 1;
        }
      }
      ctx.globalAlpha = clamp(0.88 + projectilePulse * 0.12, 0.6, 1);
      ctx.drawImage(sprite, -spriteSize * 0.5, -spriteSize * 0.5, spriteSize, spriteSize);
      if (debug) {
        debug.projectile.stampDrawCount += 1;
      }
      if (projectileStreak && trailStamp && movementDistance > 0.0001) {
        const streakWidth = snapVfxDimension(Math.max(4, radius * 4 * trailProfile.stretch), 4);
        const streakHeight = snapVfxDimension(Math.max(4, radius * 1.6), 4);
        ctx.globalAlpha = 0.16 + projectilePulse * 0.06;
        ctx.drawImage(trailStamp, -spriteSize * 0.65, -streakHeight * 0.5, streakWidth, streakHeight);
        if (debug) {
          debug.projectile.stampDrawCount += 1;
        }
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      drawPixelChunkBurst(snappedX, snappedY, radius * 0.9, rgba(rgb, 0.96), rgba([255, 255, 255], 0.7));
      ctx.restore();
    }
  }
  if (previousSmoothing !== null) {
    ctx.imageSmoothingEnabled = previousSmoothing;
  }
  if (debug) {
    debug.projectile.spriteCacheSize = projectileSpriteAtlasCache.size;
    debug.projectile.spriteCacheHits = projectileSpriteCacheStats.hits;
    debug.projectile.spriteCacheMisses = projectileSpriteCacheStats.misses;
    debug.projectile.trailCacheSize = projectileTrailStampCache.size;
    debug.projectile.trailCacheHits = projectileTrailCacheStats.hits;
    debug.projectile.trailCacheMisses = projectileTrailCacheStats.misses;
  }
}

function drawProjectilesLegacyUnused(projectiles) {
  const trailStride = Math.max(1, toSafeInt(PROJECTILE_VISUAL_PROFILE.trailStride, 1));
  const trailEnabled = Boolean(PROJECTILE_VISUAL_PROFILE.trailEnabled);
  const trailGlow = Boolean(PROJECTILE_VISUAL_PROFILE.trailGlow);
  const projectileStreak = Boolean(PROJECTILE_VISUAL_PROFILE.streak);
  const projectileAura = Boolean(PROJECTILE_VISUAL_PROFILE.aura);
  const spriteDetail = Boolean(PROJECTILE_VISUAL_PROFILE.spriteDetail);
  const auraScale = clamp(Number(PROJECTILE_VISUAL_PROFILE.auraScale) || 1, 0.45, 1.5);
  for (const projectile of projectiles || []) {
    const rgb = getTypeColor(projectile.attackType);
    const radius = projectile.radius || 8;
    const trailProfile = getProjectileTrailTypeVfxProfile(projectile.attackType);
    const trailAccent = Array.isArray(trailProfile.accent) ? trailProfile.accent : rgb;
    const trailColor = blendRgb(rgb, trailAccent, trailProfile.accentMix);
    const sprite = spriteDetail ? getProjectileSpriteStamp(projectile.attackType, 0) : null;
    const auraRadius = radius * 3.3 * auraScale;
    const trailPoints = trailEnabled && Array.isArray(projectile.trail) ? projectile.trail : [];
    const movementX = Number(projectile.x) - Number(projectile.prevX);
    const movementY = Number(projectile.y) - Number(projectile.prevY);
    const movementDistance = Math.hypot(movementX, movementY);
    let trailAngle = Number(projectile.rotation) || 0;
    let trailDirX = Math.cos(trailAngle);
    let trailDirY = Math.sin(trailAngle);
    if (movementDistance > 0.0001) {
      trailDirX = movementX / movementDistance;
      trailDirY = movementY / movementDistance;
      trailAngle = Math.atan2(trailDirY, trailDirX);
    }
    const trailPerpX = -trailDirY;
    const trailPerpY = trailDirX;

    if (trailPoints.length > 0) {
      ctx.save();
      if (trailGlow) {
        ctx.globalCompositeOperation = "lighter";
      }
      for (let pointIndex = 0; pointIndex < trailPoints.length; pointIndex += trailStride) {
        const point = trailPoints[pointIndex];
        if (!point) {
          continue;
        }
        const lifeRatio = clamp(point.lifeMs / Math.max(1, point.maxLifeMs), 0, 1);
        const pointScale = clamp(Number(point.scale) || 1, 0.72, 1.4);
        const pointRadius = radius * trailProfile.radiusMul * (0.5 + lifeRatio * 0.82) * pointScale;
        if (trailGlow) {
          const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pointRadius * 2.6);
          glow.addColorStop(0, rgba(trailColor, 0.24 * lifeRatio));
          glow.addColorStop(1, rgba(trailColor, 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(point.x, point.y, pointRadius * 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const pointPhase = Number(point.phase) || 0;
          const alpha = clamp(
            (trailProfile.alphaBase + lifeRatio * trailProfile.alphaLife) * (0.78 + lifeRatio * 0.24),
            0.04,
            0.72,
          );
          ctx.globalAlpha = alpha;
          switch (trailProfile.mode) {
            case "ember": {
              const length = pointRadius * trailProfile.stretch;
              ctx.fillStyle = rgba(trailColor, 0.92);
              ctx.beginPath();
              ctx.ellipse(
                point.x - trailDirX * length * 0.28,
                point.y - trailDirY * length * 0.28,
                pointRadius * trailProfile.stretch,
                Math.max(0.8, pointRadius * 0.54),
                trailAngle,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.fillStyle = rgba(trailAccent, 0.74);
              ctx.beginPath();
              ctx.arc(point.x, point.y, Math.max(0.5, pointRadius * 0.32), 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "droplet": {
              const wobbleAngle = trailAngle + Math.sin(pointPhase + (projectile.lifetimeMs || 0) * 0.013) * 0.24;
              ctx.fillStyle = rgba(trailColor, 0.9);
              ctx.beginPath();
              ctx.ellipse(
                point.x - trailDirX * pointRadius * 0.18,
                point.y - trailDirY * pointRadius * 0.18,
                pointRadius * 1.08,
                Math.max(0.8, pointRadius * 0.68),
                wobbleAngle,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              if ((pointIndex & 1) === 0) {
                ctx.strokeStyle = rgba(trailAccent, 0.84);
                ctx.lineWidth = Math.max(0.9, pointRadius * 0.24);
                ctx.beginPath();
                ctx.arc(point.x, point.y, pointRadius * 0.82, 0, Math.PI * 2);
                ctx.stroke();
              }
              break;
            }
            case "leaf": {
              const leafAngle = trailAngle + Math.sin(pointPhase) * 0.52;
              ctx.fillStyle = rgba(trailColor, 0.9);
              ctx.beginPath();
              ctx.ellipse(point.x, point.y, pointRadius * 1.2, Math.max(0.72, pointRadius * 0.52), leafAngle, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "spark": {
              const length = pointRadius * trailProfile.stretch;
              ctx.strokeStyle = rgba(trailAccent, 0.94);
              ctx.lineWidth = Math.max(1, pointRadius * 0.42);
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(point.x - trailDirX * length, point.y - trailDirY * length);
              ctx.lineTo(point.x + trailDirX * length * 0.42, point.y + trailDirY * length * 0.42);
              if ((pointIndex & 1) === 0) {
                ctx.moveTo(point.x - trailPerpX * length * 0.42, point.y - trailPerpY * length * 0.42);
                ctx.lineTo(point.x + trailPerpX * length * 0.42, point.y + trailPerpY * length * 0.42);
              }
              ctx.stroke();
              break;
            }
            case "shard": {
              const length = pointRadius * trailProfile.stretch;
              const width = Math.max(0.6, pointRadius * 0.66);
              ctx.fillStyle = rgba(trailColor, 0.88);
              ctx.beginPath();
              ctx.moveTo(point.x + trailDirX * length, point.y + trailDirY * length);
              ctx.lineTo(point.x + trailPerpX * width, point.y + trailPerpY * width);
              ctx.lineTo(point.x - trailDirX * length * 0.86, point.y - trailDirY * length * 0.86);
              ctx.lineTo(point.x - trailPerpX * width, point.y - trailPerpY * width);
              ctx.closePath();
              ctx.fill();
              break;
            }
            case "dust": {
              const jitterX = Math.sin(pointPhase) * pointRadius * 0.2;
              const jitterY = Math.cos(pointPhase * 1.4) * pointRadius * 0.2;
              ctx.fillStyle = rgba(trailColor, 0.86);
              ctx.beginPath();
              ctx.arc(point.x + jitterX, point.y + jitterY, pointRadius * 1.06, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "wisp": {
              ctx.fillStyle = rgba(trailColor, 0.72);
              ctx.beginPath();
              ctx.arc(point.x, point.y, pointRadius * 1.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = rgba(trailAccent, 0.54);
              ctx.beginPath();
              ctx.arc(
                point.x - trailDirX * pointRadius * 0.58,
                point.y - trailDirY * pointRadius * 0.58,
                pointRadius * 0.62,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              break;
            }
            case "sparkle": {
              const length = pointRadius * trailProfile.stretch;
              ctx.strokeStyle = rgba(trailAccent, 0.9);
              ctx.lineWidth = Math.max(0.9, pointRadius * 0.24);
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(point.x - trailDirX * length, point.y - trailDirY * length);
              ctx.lineTo(point.x + trailDirX * length, point.y + trailDirY * length);
              ctx.moveTo(point.x - trailPerpX * length * 0.84, point.y - trailPerpY * length * 0.84);
              ctx.lineTo(point.x + trailPerpX * length * 0.84, point.y + trailPerpY * length * 0.84);
              ctx.stroke();
              break;
            }
            case "streak":
            default: {
              ctx.fillStyle = rgba(trailColor, 0.88);
              ctx.beginPath();
              ctx.ellipse(
                point.x - trailDirX * pointRadius * 0.24,
                point.y - trailDirY * pointRadius * 0.24,
                pointRadius * trailProfile.stretch,
                Math.max(0.7, pointRadius * 0.48),
                trailAngle,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              break;
            }
          }
        }
      }
      ctx.restore();
    }

    if (
      projectileStreak &&
      Number.isFinite(projectile.prevX) &&
      Number.isFinite(projectile.prevY) &&
      (Math.abs(projectile.x - projectile.prevX) > 0.01 || Math.abs(projectile.y - projectile.prevY) > 0.01)
    ) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const streak = ctx.createLinearGradient(projectile.prevX, projectile.prevY, projectile.x, projectile.y);
      streak.addColorStop(0, rgba(rgb, 0));
      streak.addColorStop(1, rgba(rgb, 0.7));
      ctx.strokeStyle = streak;
      ctx.lineWidth = Math.max(2, radius * 1.3);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(projectile.prevX, projectile.prevY);
      ctx.lineTo(projectile.x, projectile.y);
      ctx.stroke();
      ctx.restore();
    }

    if (projectileAura || spriteDetail) {
      ctx.save();
    }
    if (projectileAura) {
      const aura = ctx.createRadialGradient(
        projectile.x,
        projectile.y,
        Math.max(1, radius * 0.2),
        projectile.x,
        projectile.y,
        auraRadius,
      );
      aura.addColorStop(0, rgba(rgb, 0.72));
      aura.addColorStop(0.45, rgba(rgb, 0.38));
      aura.addColorStop(1, rgba(rgb, 0));

      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, auraRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (spriteDetail) {
      ctx.fillStyle = rgba(rgb, 0.26);
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, radius * 1.45, 0, Math.PI * 2);
      ctx.fill();
    }
    if (projectileAura || spriteDetail) {
      ctx.restore();
    }

    drawProjectileTypeMotif(projectile, rgb, radius);

    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(projectile.rotation || 0);
    if (sprite) {
      const pulse = 1 + Math.sin((projectile.lifetimeMs || 0) * 0.02) * 0.08;
      const size = Math.max(24, radius * 4.6) * pulse;
      ctx.drawImage(sprite, -size * 0.5, -size * 0.5, size, size);
    } else {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
      ctx.lineWidth = Math.max(1, radius * 0.2);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, radius * 0.42), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEnemyHitEffects(hitEffects) {
  const quality = getRenderQualitySettings();
  const useGlow = Boolean(quality.enemyHitGlow);
  for (const effect of hitEffects || []) {
    const lifeRatio = clamp(effect.lifeMs / Math.max(1, effect.maxLifeMs), 0, 1);
    const rgb = Array.isArray(effect.color) ? effect.color : [220, 236, 255];

    ctx.save();
    if (effect.kind === "teleport_trail") {
      const fromX = Number(effect.x) || 0;
      const fromY = Number(effect.y) || 0;
      const toX = Number(effect.toX) || fromX;
      const toY = Number(effect.toY) || fromY;
      const ctrlX = Number(effect.ctrlX);
      const ctrlY = Number(effect.ctrlY);
      const trailGradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
      trailGradient.addColorStop(0, rgba(rgb, 0));
      trailGradient.addColorStop(0.25, rgba(rgb, 0.35 + lifeRatio * 0.3));
      trailGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
      trailGradient.addColorStop(0.75, rgba(rgb, 0.35 + lifeRatio * 0.3));
      trailGradient.addColorStop(1, rgba(rgb, 0));
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(lifeRatio * 1.1, 0, 1);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = (effect.lineWidth || 2.2) * (0.65 + lifeRatio * 0.55);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      if (Number.isFinite(ctrlX) && Number.isFinite(ctrlY)) {
        ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY);
      } else {
        ctx.lineTo(toX, toY);
      }
      ctx.stroke();
    } else if (effect.kind === "teleport_flash") {
      const radius = Math.max(2, Number(effect.radius) || 2);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = clamp(lifeRatio * 1.15, 0, 1);
      const glow = ctx.createRadialGradient(effect.x, effect.y, radius * 0.08, effect.x, effect.y, radius * 1.65);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      glow.addColorStop(0.35, rgba(rgb, 0.74));
      glow.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius * 1.65, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.kind === "ring") {
      ctx.globalAlpha = lifeRatio * 0.9;
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = (effect.lineWidth || 2) * (0.7 + lifeRatio * 0.9);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const radius = (effect.size || 2) * (0.55 + lifeRatio * 0.9);
      if (useGlow) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = lifeRatio;
        const glow = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius * 3);
        glow.addColorStop(0, rgba(rgb, 0.95));
        glow.addColorStop(0.5, rgba(rgb, 0.5));
        glow.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = Math.max(0.12, lifeRatio * 0.7);
        ctx.fillStyle = rgba(rgb, 0.54);
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFloatingDamageTexts(floatingTexts) {
  const viewportWidth = Math.max(0, Number(state.viewport?.width) || 0);
  const viewportHeight = Math.max(0, Number(state.viewport?.height) || 0);
  const shortestSide = Math.max(220, Math.min(viewportWidth || 220, viewportHeight || 220));
  const phoneLike = shortestSide <= 500;
  const compactScale = phoneLike
    ? clamp(shortestSide / 500, 0.62, 0.86)
    : clamp(shortestSide / 900, 0.82, 0.96);
  for (const text of floatingTexts || []) {
    const lifeRatio = clamp(text.lifeMs / Math.max(1, text.maxLifeMs), 0, 1);
    const tone = String(text.tone || FLOATING_TEXT_TONE_NORMAL);
    const tonePalette = getFloatingTextTonePalette(tone);
    const tweenVisual = text.visualTween?.visual || null;
    const tweenAlpha = clamp(Number(tweenVisual?.alpha ?? 1), 0, 1);
    const tweenPulse = clamp(Number(tweenVisual?.pulse ?? 0), 0, 1);
    const baseScale = clamp(Number(text.scaleFactor ?? 1), 0.72, 1.72);
    const pulseStrength = clamp(Number(text.pulseStrength ?? 0.05), 0, 0.35);
    const scale = clamp((Number(tweenVisual?.scale ?? 1) * baseScale) * (1 + tweenPulse * pulseStrength), 0.52, 1.85);
    const alphaFactor = clamp(Number(text.alphaFactor ?? tonePalette.alpha ?? 1), 0.4, 1);
    const alpha = lifeRatio * tweenAlpha * alphaFactor;
    const rgb = Array.isArray(text.color) ? text.color : tonePalette.main;
    const rgbSecondary = Array.isArray(text.colorSecondary) ? text.colorSecondary : tonePalette.secondary;
    const numericDamage = Math.max(0, Number(text.damage) || 0);
    const dynamicFontBoost = clamp(Math.log10(numericDamage + 1) * 3.7, 0, 5);
    const mainFontSize = Math.round(((text.isMiss ? 16 : 19) + dynamicFontBoost + (tone === FLOATING_TEXT_TONE_CRITICAL ? 1 : 0)) * compactScale);
    ctx.save();
    ctx.translate(text.x, text.y);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round";

    ctx.font = `700 ${mainFontSize}px Trebuchet MS`;
    ctx.lineWidth = Math.max(2, mainFontSize * 0.16);
    ctx.strokeStyle = "rgba(8, 15, 28, 0.9)";
    const mainText = tone === FLOATING_TEXT_TONE_MISS && numericDamage <= 0
      ? "0"
      : `-${formatCompactNumber(text.damage, {
        decimalsSmall: 2,
        decimalsMedium: 1,
        decimalsLarge: 0,
      })}`;
    ctx.strokeText(mainText, 0, 0);
    if (Array.isArray(rgbSecondary) && (rgbSecondary[0] !== rgb[0] || rgbSecondary[1] !== rgb[1] || rgbSecondary[2] !== rgb[2])) {
      const gradient = ctx.createLinearGradient(0, -mainFontSize * 0.9, 0, mainFontSize * 0.35);
      gradient.addColorStop(0, rgba(rgbSecondary, 1));
      gradient.addColorStop(1, rgba(rgb, 0.98));
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = rgba(rgb, 0.98);
    }
    ctx.fillText(mainText, 0, 0);

    ctx.restore();
  }
}

function easeOutCubic(t) {
  const ratio = clamp(t, 0, 1);
  return 1 - (1 - ratio) ** 3;
}

function drawEmptyTeamSlot(slot) {
  if (!slot) {
    return;
  }
  const radius = slot.size * 0.19;
  ctx.save();
  ctx.strokeStyle = "rgba(215, 231, 255, 0.42)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(slot.x, slot.y + slot.size * 0.07, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(10, 22, 36, 0.38)";
  ctx.beginPath();
  ctx.ellipse(slot.x, slot.y + slot.size * 0.5, slot.size * 0.25, slot.size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTurnIndicator(layout, indicator) {
  if (!layout || !indicator) {
    return;
  }
  const canAttack = indicator.can_attack !== false;
  const pulse = 0.72 + Math.sin(state.timeMs * 0.01) * 0.18;
  const radius = indicator.radius * (0.94 + pulse * 0.1);
  const alpha = indicator.has_pokemon ? (canAttack ? 0.22 : 0.16) : 0.13;

  ctx.save();
  const glow = ctx.createRadialGradient(
    indicator.x,
    indicator.y,
    radius * 0.2,
    indicator.x,
    indicator.y,
    radius * 1.65,
  );
  glow.addColorStop(0, `rgba(255, 255, 255, ${alpha + 0.1})`);
  glow.addColorStop(0.65, `rgba(255, 255, 255, ${alpha})`);
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(indicator.x, indicator.y, radius * 1.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.2})`;
  ctx.lineWidth = indicator.has_pokemon && canAttack ? 2.2 : 1.6;
  if (!indicator.has_pokemon || !canAttack) {
    ctx.setLineDash([5, 5]);
  }
  ctx.beginPath();
  ctx.arc(indicator.x, indicator.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function normalizeBallTypeForVisual(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type) ? type : "poke_ball";
}

function getBallRenderTheme(ballType) {
  const type = normalizeBallTypeForVisual(ballType);
  if (type === "super_ball") {
    return {
      type,
      shell: [245, 248, 255],
      seam: [15, 20, 34],
      topA: [56, 148, 255],
      topB: [18, 73, 182],
      topHighlight: [190, 225, 255],
      glowCore: [102, 189, 255],
      glowOuter: [56, 112, 255],
      buttonOuter: [31, 48, 81],
      buttonCenter: [213, 233, 255],
      breakColors: [
        [56, 148, 255],
        [228, 68, 88],
        [248, 250, 255],
      ],
      successColors: [
        [103, 188, 255],
        [255, 116, 136],
        [241, 248, 255],
      ],
      criticalSuccessColors: [
        [255, 229, 138],
        [160, 220, 255],
        [223, 191, 255],
      ],
    };
  }
  if (type === "hyper_ball") {
    return {
      type,
      shell: [244, 247, 252],
      seam: [12, 16, 25],
      topA: [63, 69, 83],
      topB: [23, 27, 38],
      topHighlight: [152, 161, 183],
      glowCore: [255, 229, 122],
      glowOuter: [88, 98, 146],
      buttonOuter: [32, 38, 58],
      buttonCenter: [250, 220, 112],
      breakColors: [
        [248, 216, 86],
        [63, 69, 83],
        [243, 247, 252],
      ],
      successColors: [
        [255, 220, 122],
        [171, 183, 255],
        [244, 249, 255],
      ],
      criticalSuccessColors: [
        [255, 234, 150],
        [245, 202, 120],
        [203, 177, 255],
      ],
    };
  }
  return {
    type: "poke_ball",
    shell: [248, 248, 248],
    seam: [14, 17, 23],
    topA: [232, 68, 82],
    topB: [188, 39, 53],
    topHighlight: [255, 168, 174],
    glowCore: [176, 255, 202],
    glowOuter: [96, 208, 148],
    buttonOuter: [34, 41, 55],
    buttonCenter: [250, 250, 250],
    breakColors: [
      [225, 48, 60],
      [250, 250, 250],
    ],
    successColors: [
      [115, 240, 160],
      [255, 255, 195],
    ],
    criticalSuccessColors: [
      [255, 236, 130],
      [214, 174, 255],
      [184, 231, 255],
    ],
  };
}

function drawPokeball(x, y, radius, options = {}) {
  const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  const rotation = Number.isFinite(options.rotation) ? options.rotation : 0;
  const broken = Boolean(options.broken);
  const critical = Boolean(options.critical);
  const ballType = normalizeBallTypeForVisual(options.ball_type);
  const theme = getBallRenderTheme(ballType);
  const crackRatio = clamp(Number(options.crack_ratio || 0), 0, 1);
  const glowRatio = clamp(Number(options.glow_ratio || 0), 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);

  if (glowRatio > 0) {
    const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * (1.8 + glowRatio * 0.9));
    if (critical) {
      glow.addColorStop(0, rgba([255, 226, 130], 0.52 + glowRatio * 0.42));
      glow.addColorStop(0.62, rgba(theme.glowOuter, 0.22 + glowRatio * 0.24));
    } else {
      glow.addColorStop(0, rgba(theme.glowCore, 0.42 + glowRatio * 0.4));
    }
    glow.addColorStop(1, rgba(theme.glowOuter, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1.8 + glowRatio * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = rgba(theme.shell, 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  const topGradient = ctx.createLinearGradient(-radius, -radius * 0.8, radius, radius * 0.22);
  topGradient.addColorStop(0, rgba(theme.topA, 1));
  topGradient.addColorStop(0.7, rgba(theme.topB, 1));
  topGradient.addColorStop(1, rgba(theme.topB, 0.95));
  const topHighlight = ctx.createLinearGradient(-radius * 0.65, -radius * 0.9, radius * 0.4, -radius * 0.2);
  topHighlight.addColorStop(0, rgba(theme.topHighlight, 0.58));
  topHighlight.addColorStop(1, rgba(theme.topHighlight, 0));

  if (!broken || crackRatio < 0.45) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = topGradient;
    ctx.fillRect(-radius - 1, -radius - 1, radius * 2 + 2, radius + 2);
    ctx.fillStyle = topHighlight;
    ctx.fillRect(-radius - 1, -radius - 1, radius * 2 + 2, radius + 2);
    ctx.restore();
  } else {
    const missing = radius * (0.6 + crackRatio * 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius + 1, -Math.PI * 0.2, Math.PI * 0.2);
    ctx.closePath();
    ctx.clip();
    ctx.clearRect(-missing, -missing, missing * 2, missing * 2);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = topGradient;
    ctx.fillRect(-radius - 1, -radius - 1, radius * 2 + 2, radius + 2);
    ctx.fillStyle = topHighlight;
    ctx.fillRect(-radius - 1, -radius - 1, radius * 2 + 2, radius + 2);
    ctx.restore();
  }

  if (!broken || crackRatio < 0.9) {
    if (theme.type === "super_ball") {
      ctx.fillStyle = "rgba(227, 64, 86, 0.96)";
      for (const side of [-1, 1]) {
        const cx = side * radius * 0.52;
        const cy = -radius * 0.53;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.19, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(249, 231, 235, 0.92)";
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.085, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(227, 64, 86, 0.96)";
      }
    } else if (theme.type === "hyper_ball") {
      ctx.strokeStyle = "rgba(246, 214, 80, 0.96)";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.2, radius * 0.2);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.62, -radius * 0.56);
      ctx.lineTo(-radius * 0.2, -radius * 0.15);
      ctx.lineTo(0, -radius * 0.36);
      ctx.lineTo(radius * 0.2, -radius * 0.15);
      ctx.lineTo(radius * 0.62, -radius * 0.56);
      ctx.stroke();
      ctx.lineWidth = Math.max(1.1, radius * 0.12);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.22, -radius * 0.36);
      ctx.lineTo(radius * 0.22, -radius * 0.36);
      ctx.stroke();
    }
  }

  if (critical) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sheen = ctx.createRadialGradient(-radius * 0.2, -radius * 0.45, radius * 0.06, 0, -radius * 0.2, radius * 0.95);
    sheen.addColorStop(0, "rgba(255, 242, 179, 0.56)");
    sheen.addColorStop(0.68, "rgba(210, 183, 255, 0.12)");
    sheen.addColorStop(1, "rgba(210, 183, 255, 0)");
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.98, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = rgba(theme.seam, 0.92);
  ctx.lineWidth = Math.max(1.4, radius * 0.11);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1.6, radius * 0.18);
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();

  ctx.fillStyle = rgba(theme.buttonCenter, 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.33, 0, Math.PI * 2);
  ctx.fill();
  if (critical) {
    ctx.fillStyle = "rgba(252, 229, 126, 0.8)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(theme.buttonOuter, 0.9);
  ctx.lineWidth = Math.max(1.2, radius * 0.09);
  ctx.stroke();

  if (broken && crackRatio > 0.15) {
    ctx.strokeStyle = `rgba(27, 35, 46, ${0.55 + crackRatio * 0.45})`;
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.18);
    ctx.lineTo(-radius * 0.16, radius * 0.12);
    ctx.lineTo(radius * 0.12, -radius * 0.06);
    ctx.lineTo(radius * 0.36, radius * 0.28);
    ctx.stroke();
  }

  ctx.restore();
}

function getCaptureEnemyVisual(sequence, phase) {
  if (!sequence || !phase) {
    return { visible: false, alpha: 0, scale: 0 };
  }

  if (phase === "throw") {
    return { visible: true, alpha: 0.7, scale: 0.94 };
  }

  if (phase === "reappear") {
    const timeInPhase = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS + CAPTURE_FAIL_BREAK_MS);
    const ratio = clamp(timeInPhase / CAPTURE_FAIL_REAPPEAR_MS, 0, 1);
    const alpha = ratio < 0.34 ? ratio / 0.34 : 1 - (ratio - 0.34) / 0.66;
    return { visible: alpha > 0.02, alpha: clamp(alpha, 0, 1), scale: 0.78 + Math.sin(ratio * Math.PI) * 0.26 };
  }

  return { visible: false, alpha: 0, scale: 0 };
}

function drawCaptureSequence(layout, captureSequence, capturePhase) {
  if (!captureSequence || !capturePhase) {
    return;
  }

  const sequence = captureSequence;
  const criticalCapture = Boolean(sequence.isCritical);
  const ballType = normalizeBallTypeForVisual(sequence.ballType);
  const ballTheme = getBallRenderTheme(ballType);
  const celebrationParticles = shouldRenderCelebrationParticles();
  const throwRatio = CAPTURE_THROW_MS > 0 ? clamp(sequence.elapsedMs / CAPTURE_THROW_MS, 0, 1) : 1;
  const easedThrow = easeOutCubic(throwRatio);
  let ballX = sequence.targetX;
  let ballY = sequence.targetY;
  let ballRotation = 0;
  let ballRadius = 14;
  let broken = false;
  let crackRatio = 0;
  let glowRatio = 0;

  if (capturePhase === "throw") {
    ballX = sequence.startX + (sequence.targetX - sequence.startX) * easedThrow;
    ballY = sequence.startY + (sequence.targetY - sequence.startY) * easedThrow - Math.sin(throwRatio * Math.PI) * 70;
    ballRotation = easedThrow * Math.PI * 2.6;
    ballRadius = 13.2 + Math.sin(throwRatio * Math.PI) * 1.9;
    if (criticalCapture) {
      glowRatio = 0.48 + Math.sin(throwRatio * Math.PI) * 0.38;
    }
  } else if (capturePhase === "shake") {
    const localMs = sequence.elapsedMs - CAPTURE_THROW_MS;
    const shakeRatio = clamp(localMs / Math.max(1, CAPTURE_SHAKE_MS), 0, 1);
    const shakeAmpBase = criticalCapture ? 12 : 8;
    const shakeAmp = shakeAmpBase * (1 - shakeRatio * 0.35);
    const shakeWave = Math.sin(localMs * 0.036) * Math.exp(-shakeRatio * 0.5);
    ballX = sequence.targetX + shakeWave * shakeAmp;
    ballY = sequence.targetY + Math.abs(shakeWave) * 1.4;
    ballRotation = shakeWave * 0.34;
    ballRadius = 14.4 - shakeRatio * 0.95;
    if (criticalCapture) {
      glowRatio = 0.4 + Math.sin(localMs * 0.02) * 0.22;
    }
  } else if (capturePhase === "success") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS);
    const ratio = clamp(localMs / Math.max(1, CAPTURE_SUCCESS_BURST_MS), 0, 1);
    ballX = sequence.targetX;
    ballY = sequence.targetY - Math.sin(ratio * Math.PI) * 3.2;
    ballRotation = Math.sin(localMs * 0.024) * 0.12;
    ballRadius = 14 + Math.sin(ratio * Math.PI * 2.4) * 0.92 * (1 - ratio * 0.65);
    glowRatio = (criticalCapture ? 1.35 : 1) - ratio * (criticalCapture ? 0.16 : 0.25);
  } else if (capturePhase === "break") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS);
    ballX = sequence.targetX;
    ballY = sequence.targetY + clamp(localMs / 120, 0, 1) * 1.8;
    broken = true;
    crackRatio = clamp(localMs / Math.max(1, CAPTURE_FAIL_BREAK_MS), 0, 1);
    ballRadius = 14 - crackRatio * 0.82;
    if (criticalCapture) {
      glowRatio = 0.3 * (1 - crackRatio);
    }
  } else if (capturePhase === "reappear") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS + CAPTURE_FAIL_BREAK_MS);
    const ratio = clamp(localMs / Math.max(1, CAPTURE_FAIL_REAPPEAR_MS), 0, 1);
    ballX = sequence.targetX;
    ballY = sequence.targetY + ratio * 2.4;
    broken = true;
    crackRatio = 1;
    ballRadius = 13.2 - ratio * 0.55;
  } else {
    ballX = sequence.targetX;
    ballY = sequence.targetY;
  }

  if (capturePhase === "throw") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 1; i <= 5; i += 1) {
      const trailT = clamp(throwRatio - i * 0.085, 0, 1);
      if (trailT <= 0) {
        continue;
      }
      const easedTrail = easeOutCubic(trailT);
      const trailX = sequence.startX + (sequence.targetX - sequence.startX) * easedTrail;
      const trailY = sequence.startY + (sequence.targetY - sequence.startY) * easedTrail - Math.sin(trailT * Math.PI) * 70;
      const trailAlpha = (0.17 - i * 0.025) * (criticalCapture ? 1.25 : 1);
      ctx.fillStyle = rgba(ballTheme.glowCore, Math.max(0, trailAlpha));
      ctx.beginPath();
      ctx.arc(trailX, trailY, Math.max(2.2, ballRadius * (0.5 - i * 0.06)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const lift = Math.max(0, sequence.targetY - ballY);
  const shadowScale = clamp(1 - lift / 120, 0.3, 1);
  ctx.save();
  ctx.fillStyle = `rgba(6, 12, 20, ${0.13 + shadowScale * 0.19})`;
  ctx.beginPath();
  ctx.ellipse(ballX, sequence.targetY + ballRadius * 0.88, ballRadius * (0.95 + shadowScale * 0.55), ballRadius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (celebrationParticles) {
    for (const particle of sequence.particles || []) {
      const lifeRatio = clamp(particle.lifeMs / Math.max(1, particle.maxLifeMs), 0, 1);
      ctx.save();
      ctx.globalAlpha = lifeRatio;
      if (particle.kind === "break") {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);
        ctx.fillStyle = rgba(particle.color, 0.95);
        const size = particle.size || 2;
        ctx.fillRect(-size, -size * 0.56, size * 2, size * 1.12);
      } else {
        const glow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          (particle.size || 2) * 3.2,
        );
        glow.addColorStop(0, rgba(particle.color, 1));
        glow.addColorStop(1, rgba(particle.color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, (particle.size || 2) * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(particle.color, 0.98);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawPokeball(ballX, ballY, ballRadius, {
    rotation: ballRotation,
    broken,
    crack_ratio: crackRatio,
    glow_ratio: glowRatio,
    critical: criticalCapture,
    ball_type: ballType,
  });

  if (criticalCapture && celebrationParticles) {
    const pulse = 0.5 + Math.sin(state.timeMs * 0.018) * 0.5;
    const auraRadius = 26 + pulse * 8;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const aura = ctx.createRadialGradient(ballX, ballY, 2, ballX, ballY, auraRadius);
    aura.addColorStop(0, "rgba(255, 234, 166, 0.36)");
    aura.addColorStop(0.6, "rgba(209, 174, 255, 0.22)");
    aura.addColorStop(1, "rgba(209, 174, 255, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(ballX, ballY, auraRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (capturePhase === "success" && celebrationParticles) {
    const pulse = 0.25 + Math.sin(state.timeMs * 0.02) * 0.15;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ringRadius = layout.enemySize * ((criticalCapture ? 0.36 : 0.28) + pulse);
    const successPrimary = criticalCapture
      ? ballTheme.criticalSuccessColors[0] || [255, 233, 150]
      : ballTheme.successColors[0] || [172, 255, 190];
    const successSecondary = criticalCapture
      ? ballTheme.criticalSuccessColors[1] || [199, 164, 255]
      : ballTheme.successColors[1] || [186, 234, 255];
    ctx.strokeStyle = rgba(successPrimary, criticalCapture ? 0.76 : 0.62);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sequence.targetX, sequence.targetY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    if (criticalCapture) {
      ctx.strokeStyle = rgba(successSecondary, 0.54);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sequence.targetX, sequence.targetY, ringRadius * 0.74, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  const chanceDisplay = Number(sequence.chanceDisplay);
  if (Number.isFinite(chanceDisplay) && chanceDisplay > 0) {
    const percent = Math.round(clamp(chanceDisplay, 0, 1) * 100);
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = "700 12px Trebuchet MS";
    ctx.strokeText(`Chance de capture : ${percent}%`, sequence.targetX, sequence.targetY - layout.enemySize * 0.52);
    ctx.fillText(`Chance de capture : ${percent}%`, sequence.targetX, sequence.targetY - layout.enemySize * 0.52);
    ctx.restore();
  }
}

function drawEnemyKoEffect(layout, koTransition) {
  if (!koTransition?.shrink_active) {
    return;
  }

  const progress = koTransition.shrink_progress || 0;
  const pulse = 0.65 + 0.35 * Math.sin(state.timeMs * 0.06);
  const radius = layout.enemySize * (0.4 + progress * 0.66 + pulse * 0.05);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const burst = ctx.createRadialGradient(
    layout.centerX,
    layout.centerY,
    layout.enemySize * 0.12,
    layout.centerX,
    layout.centerY,
    radius * 1.9,
  );
  burst.addColorStop(0, "rgba(255, 247, 206, 0.58)");
  burst.addColorStop(0.45, "rgba(255, 150, 120, 0.28)");
  burst.addColorStop(1, "rgba(255, 120, 120, 0)");
  ctx.fillStyle = burst;
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, radius * 1.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 248, 225, " + (0.34 * (1 - progress) + 0.16) + ")";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function activateNextEvolutionAnimationIfNeeded() {
  if (state.evolutionAnimation.current) {
    return;
  }
  if (!Array.isArray(state.evolutionAnimation.queue) || state.evolutionAnimation.queue.length === 0) {
    return;
  }
  while (state.evolutionAnimation.queue.length > 0) {
    const next = state.evolutionAnimation.queue.shift();
    if (!next || !next.fromDef || !next.toDef) {
      continue;
    }
    state.evolutionAnimation.current = {
      ...next,
      elapsedMs: 0,
      totalMs: Math.max(260, toSafeInt(next.totalMs, EVOLUTION_ANIM_TOTAL_MS)),
      particles: Array.isArray(next.particles) ? next.particles : [],
    };
    return;
  }
}

function drawTeamLevelUpEffects() {
  if (!Array.isArray(state.teamLevelUpEffects) || state.teamLevelUpEffects.length <= 0) {
    return;
  }
  const quality = getRenderQualitySettings();
  const particleStride = Math.max(1, toSafeInt(quality.levelUpParticleStride, 1));
  const useGlow = Boolean(quality.enemyHitGlow);
  const celebrationParticles = shouldRenderCelebrationParticles();

  for (const effect of state.teamLevelUpEffects) {
    const effectRatio = clamp(effect.lifeMs / Math.max(1, effect.maxLifeMs), 0, 1);
    const ringAlpha = Math.min(1, effectRatio * 1.4);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = "rgba(126, 206, 255, 0.9)";
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (celebrationParticles) {
      const particles = Array.isArray(effect.particles) ? effect.particles : [];
      for (let particleIndex = 0; particleIndex < particles.length; particleIndex += particleStride) {
        const particle = particles[particleIndex];
        if (!particle) {
          continue;
        }
        const ratio = clamp(particle.lifeMs / Math.max(1, particle.maxLifeMs), 0, 1);
        const radius = (particle.size || 2) * (0.5 + ratio * 0.9);
        ctx.save();
        if (useGlow) {
          ctx.globalCompositeOperation = "lighter";
          const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 3.1);
          glow.addColorStop(0, `rgba(166, 224, 255, ${0.85 * ratio})`);
          glow.addColorStop(1, "rgba(166, 224, 255, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, radius * 3.1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = Math.max(0.12, ratio * 0.7);
          ctx.fillStyle = "rgba(166, 224, 255, 0.72)";
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, radius * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(213, 242, 255, ${0.95 * ratio})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

function getTeamXpPulseScale(slotIndex) {
  void slotIndex;
  return 1;
}

function drawTeamXpGainEffects() {
  if (!Array.isArray(state.teamXpGainEffects) || state.teamXpGainEffects.length <= 0) {
    return;
  }
  for (const effect of state.teamXpGainEffects) {
    const lifeRatio = clamp(effect.lifeMs / Math.max(1, effect.maxLifeMs), 0, 1);
    const textAlpha = clamp(lifeRatio * 1.25, 0, 1);
    const tone = String(effect.tone || "defeat");
    const textColor = tone === "capture" ? "rgba(171, 255, 211, 1)" : "rgba(160, 224, 255, 1)";
    const shadowColor = tone === "capture" ? "rgba(34, 98, 71, 0.82)" : "rgba(29, 62, 108, 0.84)";

    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = shadowColor;
    ctx.fillStyle = textColor;
    ctx.font = "700 13px Trebuchet MS";
    ctx.strokeText(effect.text, effect.x, effect.y);
    ctx.fillText(effect.text, effect.x, effect.y);
    ctx.restore();
  }
}

function drawTimeOfDayColorGrade(width, height, environmentSnapshot) {
  const dayLight = clamp(Number(environmentSnapshot?.dayLight) || 0, 0, 1);
  const night = clamp(Number(environmentSnapshot?.night) || 0, 0, 1);

  ctx.save();
  if (night > 0.001) {
    const nightGradient = ctx.createLinearGradient(0, 0, 0, height);
    nightGradient.addColorStop(0, `rgba(20, 35, 78, ${(0.18 + night * 0.18).toFixed(3)})`);
    nightGradient.addColorStop(1, `rgba(8, 18, 46, ${(0.22 + night * 0.24).toFixed(3)})`);
    ctx.fillStyle = nightGradient;
    ctx.fillRect(0, 0, width, height);
  }

  if (dayLight > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sunX = width * 0.2;
    const sunY = height * 0.02;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, width * 0.06, sunX, sunY, width * 0.86);
    sunGlow.addColorStop(0, `rgba(255, 240, 190, ${(0.07 + dayLight * 0.09).toFixed(3)})`);
    sunGlow.addColorStop(1, "rgba(255, 240, 190, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  ctx.restore();
}

function getScreenPerimeterPoint(width, height, loopRatio, margin = 0) {
  const safeMargin = Math.max(0, Number(margin) || 0);
  const safeWidth = Math.max(1, width - safeMargin * 2);
  const safeHeight = Math.max(1, height - safeMargin * 2);
  const perimeter = safeWidth * 2 + safeHeight * 2;
  if (perimeter <= 0) {
    return {
      x: width * 0.5,
      y: height * 0.5,
      nx: 0,
      ny: 0,
    };
  }
  let distance = (((Number(loopRatio) || 0) % 1) + 1) % 1;
  distance *= perimeter;
  if (distance <= safeWidth) {
    return {
      x: safeMargin + distance,
      y: safeMargin,
      nx: 0,
      ny: 1,
    };
  }
  distance -= safeWidth;
  if (distance <= safeHeight) {
    return {
      x: safeMargin + safeWidth,
      y: safeMargin + distance,
      nx: -1,
      ny: 0,
    };
  }
  distance -= safeHeight;
  if (distance <= safeWidth) {
    return {
      x: safeMargin + safeWidth - distance,
      y: safeMargin + safeHeight,
      nx: 0,
      ny: -1,
    };
  }
  distance -= safeWidth;
  return {
    x: safeMargin,
    y: safeMargin + safeHeight - distance,
    nx: 1,
    ny: 0,
  };
}

function drawLegendaryFieldEdgeAura(width, height, theme, intensity, pulseScale = 1) {
  const edgeThickness = Math.max(14, Math.round(Math.min(width, height) * 0.065));
  const alpha = clamp(Number(theme?.edgeAlpha || 0) * Math.max(0.6, Number(pulseScale) || 1) * intensity, 0, 1);
  if (alpha <= 0.001) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const topGradient = ctx.createLinearGradient(0, 0, 0, edgeThickness);
  topGradient.addColorStop(0, rgba(theme.edgeColor, (alpha * 1.2).toFixed(3)));
  topGradient.addColorStop(1, rgba(theme.edgeColor, 0));
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, width, edgeThickness);

  const bottomGradient = ctx.createLinearGradient(0, height, 0, height - edgeThickness);
  bottomGradient.addColorStop(0, rgba(theme.edgeColor, (alpha * 1.18).toFixed(3)));
  bottomGradient.addColorStop(1, rgba(theme.edgeColor, 0));
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, height - edgeThickness, width, edgeThickness);

  const leftGradient = ctx.createLinearGradient(0, 0, edgeThickness, 0);
  leftGradient.addColorStop(0, rgba(theme.edgeColor, (alpha * 1.02).toFixed(3)));
  leftGradient.addColorStop(1, rgba(theme.edgeColor, 0));
  ctx.fillStyle = leftGradient;
  ctx.fillRect(0, 0, edgeThickness, height);

  const rightGradient = ctx.createLinearGradient(width, 0, width - edgeThickness, 0);
  rightGradient.addColorStop(0, rgba(theme.edgeColor, (alpha * 1.02).toFixed(3)));
  rightGradient.addColorStop(1, rgba(theme.edgeColor, 0));
  ctx.fillStyle = rightGradient;
  ctx.fillRect(width - edgeThickness, 0, edgeThickness, height);
  ctx.restore();
}

function drawLegendaryFieldPerimeterParticles(width, height, theme, intensity, particleScale) {
  const density = Math.max(0.05, Number(particleScale) || 0);
  const particleCount = Math.round((16 + (width + height) / 120) * intensity * density);
  if (particleCount <= 0) {
    return;
  }
  const margin = Math.max(5, Math.round(Math.min(width, height) * 0.01));
  const time = state.timeMs * 0.00058;
  const color = Array.isArray(theme?.particleColor) ? theme.particleColor : [218, 240, 255];
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < particleCount; i += 1) {
    const seed = i * 17.73 + intensity * 37.1 + color[0] * 0.071;
    const speed = 0.06 + pseudoRandomUnit(seed * 1.73) * 0.16;
    const loopRatio = (pseudoRandomUnit(seed * 2.19) + time * speed) % 1;
    const edgePoint = getScreenPerimeterPoint(width, height, loopRatio, margin);
    const inward = 4 + pseudoRandomUnit(seed * 3.11) * 15;
    const x = edgePoint.x + edgePoint.nx * inward;
    const y = edgePoint.y + edgePoint.ny * inward;
    const phase = state.timeMs * (0.0034 + pseudoRandomUnit(seed * 4.67) * 0.0026) + seed;
    const alpha = (0.22 + pseudoRandomUnit(seed * 5.93) * 0.46) * intensity;

    if (theme?.key === "electric") {
      const length = 4 + pseudoRandomUnit(seed * 7.41) * 8;
      const jitterX = Math.sin(phase * 1.7) * 3.2;
      const jitterY = Math.cos(phase * 1.4) * 2.8;
      ctx.strokeStyle = rgba(color, alpha.toFixed(3));
      ctx.lineWidth = 1 + pseudoRandomUnit(seed * 8.27) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x + jitterX, y + jitterY);
      ctx.lineTo(x + jitterX + edgePoint.nx * length, y + jitterY + edgePoint.ny * length);
      ctx.stroke();
      continue;
    }

    if (theme?.key === "ardent") {
      const radius = 1.4 + pseudoRandomUnit(seed * 6.37) * 2.6;
      const driftX = Math.sin(phase) * 2.4;
      const driftY = Math.cos(phase * 0.8) * 1.9;
      ctx.fillStyle = rgba(color, (alpha * 0.82).toFixed(3));
      ctx.beginPath();
      ctx.arc(x + driftX, y + driftY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(theme.pulseColor, clamp(alpha * 1.08, 0, 1).toFixed(3));
      ctx.beginPath();
      ctx.arc(x + driftX, y + driftY, radius * 0.78, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    const radius = 1.1 + pseudoRandomUnit(seed * 6.91) * 2;
    const driftX = Math.sin(phase * 0.85) * 1.4;
    const driftY = Math.cos(phase * 0.9) * 1.4;
    ctx.fillStyle = rgba(color, alpha.toFixed(3));
    ctx.beginPath();
    ctx.moveTo(x + driftX, y + driftY - radius);
    ctx.lineTo(x + driftX + radius, y + driftY);
    ctx.lineTo(x + driftX, y + driftY + radius);
    ctx.lineTo(x + driftX - radius, y + driftY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawLegendaryFieldTrinityPulse(width, height, intensity) {
  const pulse = 0.52 + Math.sin(state.timeMs * 0.0023) * 0.48;
  const alpha = clamp((0.07 + pulse * 0.06) * intensity, 0, 1);
  if (alpha <= 0.001) {
    return;
  }
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const radius = Math.max(width, height) * (0.55 + pulse * 0.08);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.26, centerX, centerY, radius);
  glow.addColorStop(0, rgba([246, 251, 255], (alpha * 0.64).toFixed(3)));
  glow.addColorStop(0.6, rgba([213, 236, 255], (alpha * 0.28).toFixed(3)));
  glow.addColorStop(1, "rgba(213, 236, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const borderAlpha = clamp(alpha * 0.42, 0, 1);
  ctx.strokeStyle = rgba([212, 240, 255], borderAlpha.toFixed(3));
  ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) * 0.0034));
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.restore();
}

function drawLegendaryFieldScreenVfx(width, height, teamMembers) {
  const fields = getLegendaryFieldPresence(teamMembers);
  if (!fields.electric && !fields.ardent && !fields.arctic) {
    return;
  }
  const quality = getRenderQualitySettings();
  const qualityParticleScale = clamp(Number(quality.environmentParticleScale) || 0, 0, 1.5);
  const particleScale = 0.45 + qualityParticleScale * 1.7;
  const activeThemes = [];
  if (fields.electric) {
    activeThemes.push(LEGENDARY_FIELD_VFX_THEME_BY_KEY.electric);
  }
  if (fields.ardent) {
    activeThemes.push(LEGENDARY_FIELD_VFX_THEME_BY_KEY.ardent);
  }
  if (fields.arctic) {
    activeThemes.push(LEGENDARY_FIELD_VFX_THEME_BY_KEY.arctic);
  }

  const fieldIntensity = clamp(activeThemes.length / 3, 0.45, 1);
  for (let i = 0; i < activeThemes.length; i += 1) {
    const theme = activeThemes[i];
    const pulse = 0.72 + Math.sin(state.timeMs * 0.0022 + i * 1.48) * 0.28;
    const intensity = clamp((0.55 + fieldIntensity * 0.45) * pulse, 0.22, 1);
    drawLegendaryFieldEdgeAura(width, height, theme, intensity, pulse);
    drawLegendaryFieldPerimeterParticles(width, height, theme, intensity, particleScale);
  }

  if (fields.trinityActive) {
    drawLegendaryFieldTrinityPulse(width, height, fieldIntensity);
  }
}

function drawEnvironmentBackgroundLayer(width, height, environmentSnapshot) {
  if (!environmentSnapshot) {
    return;
  }
  drawTimeOfDayColorGrade(width, height, environmentSnapshot);
}

function drawEnvironmentForegroundLayer(width, height, environmentSnapshot) {
  if (!environmentSnapshot) {
    return;
  }
  if (!shouldRenderAmbientOverlays()) {
    return;
  }
  void width;
  void height;
  void environmentSnapshot;
}

function updateEvolutionAnimation(deltaMs) {
  activateNextEvolutionAnimationIfNeeded();
  const current = state.evolutionAnimation.current;
  if (!current) {
    return false;
  }
  current.elapsedMs = Math.min(current.totalMs, current.elapsedMs + Math.max(0, Number(deltaMs) || 0));
  if (current.elapsedMs >= current.totalMs) {
    state.evolutionAnimation.current = null;
    activateNextEvolutionAnimationIfNeeded();
  }
  return Boolean(state.evolutionAnimation.current);
}

function drawEvolutionSpriteFrame(entity, x, y, size, options = {}) {
  const alpha = clamp(Number(options.alpha ?? 1), 0, 1);
  const scale = Math.max(0.02, Number(options.scale ?? 1));
  const whiteRatio = clamp(Number(options.whiteRatio ?? 0), 0, 1);
  const resolvedSpriteSource = resolveEntitySpriteDrawSource(entity);
  const spriteImage = resolvedSpriteSource?.source || entity?.spriteImage || null;
  const renderSize = getPokemonSpriteRenderSize(entity, size, resolvedSpriteSource);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, " + (0.24 + (1 - whiteRatio) * 0.2).toFixed(3) + ")";
  ctx.beginPath();
  ctx.ellipse(0, renderSize * 0.38, renderSize * 0.32, renderSize * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDrawableImage(spriteImage)) {
    const dims = getDrawableImageDimensions(spriteImage);
    const placement = computeSpriteOpaqueDrawPlacement({
      renderSize,
      sourceWidth: dims.width,
      sourceHeight: dims.height,
      opaqueMinX: resolvedSpriteSource?.opaqueMinX,
      opaqueMinY: resolvedSpriteSource?.opaqueMinY,
      opaqueWidth: resolvedSpriteSource?.opaqueWidth,
      opaqueHeight: resolvedSpriteSource?.opaqueHeight,
    });
    const drawWidth = placement.drawWidth;
    const drawHeight = placement.drawHeight;
    const drawX = placement.drawX;
    const drawY = placement.drawY + drawHeight * 0.05;
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    drawSpriteImageWithTint(spriteImage, drawX, drawY, drawWidth, drawHeight, [255, 255, 255], whiteRatio);
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
    ctx.fillStyle = "rgba(195, 215, 245, 0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, renderSize * 0.28, 0, Math.PI * 2);
    ctx.fill();
    if (whiteRatio > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, " + whiteRatio.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(0, 0, renderSize * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawEvolutionAnimationParticles(current, centerX, centerY, spriteSize, elapsedMs) {
  const particles = Array.isArray(current?.particles) ? current.particles : [];
  if (particles.length <= 0) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const particle of particles) {
    const ageMs = elapsedMs - Math.max(0, Number(particle.startMs) || 0);
    const durationMs = Math.max(1, Number(particle.durationMs) || 1);
    if (ageMs < 0 || ageMs > durationMs) {
      continue;
    }

    const ratio = clamp(ageMs / durationMs, 0, 1);
    const travelRatio = Math.sin(ratio * Math.PI * 0.5);
    const fadeRatio = ratio < 0.62 ? 1 : 1 - clamp((ratio - 0.62) / 0.38, 0, 1);
    const alpha = fadeRatio * (0.22 + (1 - ratio) * 0.66);
    if (alpha <= 0.01) {
      continue;
    }
    const baseAngle = Number(particle.baseAngle) || 0;
    const curveAngle = baseAngle + (Number(particle.spinTurns) || 0) * ratio * Math.PI;
    const distance = spriteSize * (
      (Number(particle.radiusStart) || 0.08)
      + travelRatio * (Number(particle.radiusGrow) || 0.44)
    );
    const wobble = spriteSize * 0.04 * (1 - ratio);
    const x = centerX + Math.cos(baseAngle) * distance + Math.cos(curveAngle + Math.PI * 0.5) * wobble;
    const y =
      centerY
      + Math.sin(baseAngle) * distance
      + (Number(particle.heightOffset) || 0) * spriteSize
      - travelRatio * spriteSize * (Number(particle.lift) || 0.1);
    const size = Math.max(0.9, (Number(particle.size) || 2) * (1.12 - ratio * 0.5));
    const color = Array.isArray(particle.color) ? particle.color : [255, 255, 255];

    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3.2);
    glow.addColorStop(0, rgba(color, alpha));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba(color, Math.min(1, alpha + 0.16));
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEvolutionAnimationOverlay(layout) {
  const current = state.evolutionAnimation.current;
  if (!current || !layout) {
    return;
  }

  const elapsed = clamp(current.elapsedMs, 0, current.totalMs);
  const viewportCenter = computeEvolutionAnimationViewportCenter(layout, state.viewport);
  const centerX = viewportCenter.centerX;
  const centerY = viewportCenter.centerY;
  const spriteSize = clamp(layout.enemySize * 1.5, 170, 300);
  const beatState = computeEvolutionAnimationBeatState({
    elapsedMs: elapsed,
    totalMs: current.totalMs,
    whiteMs: EVOLUTION_ANIM_WHITE_MS,
    flashMs: EVOLUTION_ANIM_FLASH_MS,
    revealMs: EVOLUTION_ANIM_REVEAL_MS,
    swapCount: Number(EVOLUTION_ANIM_SWAP_COUNT) || 7,
  });
  const backdropFadeMs = clamp(
    Math.min(EVOLUTION_ANIM_BACKDROP_FADE_MS, current.totalMs * 0.26),
    120,
    Math.max(120, current.totalMs * 0.5),
  );
  const fadeIn = easeInOutSine(clamp(elapsed / backdropFadeMs, 0, 1));
  const fadeOutStart = Math.max(0, current.totalMs - backdropFadeMs);
  const fadeOut = 1 - easeInOutSine(clamp((elapsed - fadeOutStart) / backdropFadeMs, 0, 1));
  const backdropPresence = clamp(Math.min(fadeIn, fadeOut), 0, 1);

  ctx.save();
  const baseBackdropAlpha = clamp((0.54 + beatState.energyRatio * 0.18) * backdropPresence, 0, 0.88);
  ctx.fillStyle = `rgba(2, 6, 12, ${baseBackdropAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  const vignetteRadius = Math.hypot(state.viewport.width, state.viewport.height) * 0.72;
  const vignette = ctx.createRadialGradient(
    centerX,
    centerY,
    spriteSize * 0.34,
    centerX,
    centerY,
    vignetteRadius,
  );
  const vignetteAlpha = clamp((0.34 + beatState.energyRatio * 0.36) * backdropPresence, 0, 0.9);
  vignette.addColorStop(0, `rgba(4, 9, 17, ${(vignetteAlpha * 0.06).toFixed(3)})`);
  vignette.addColorStop(0.52, `rgba(4, 9, 17, ${(vignetteAlpha * 0.4).toFixed(3)})`);
  vignette.addColorStop(1, `rgba(4, 9, 17, ${vignetteAlpha.toFixed(3)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  const focusRadius = spriteSize * (1.08 + beatState.orbRadiusRatio * 0.8);
  const focus = ctx.createRadialGradient(centerX, centerY, spriteSize * 0.12, centerX, centerY, focusRadius);
  focus.addColorStop(0, `rgba(255, 255, 255, ${(0.16 + beatState.energyRatio * 0.16).toFixed(3)})`);
  focus.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = focus;
  ctx.beginPath();
  ctx.arc(centerX, centerY, focusRadius, 0, Math.PI * 2);
  ctx.fill();

  let title = `${current.fromNameFr} evolue !`;
  let subtitle = "";
  const orbRadius = spriteSize * (0.3 + beatState.orbRadiusRatio * 0.44);
  const orbAlpha = clamp(beatState.orbAlpha, 0, 1);
  const spriteLayers = [
    {
      entity: current.fromDef,
      alpha: beatState.fromAlpha,
      scale: beatState.fromScale,
      whiteRatio: beatState.fromWhiteRatio,
    },
    {
      entity: current.toDef,
      alpha: beatState.toAlpha,
      scale: beatState.toScale,
      whiteRatio: beatState.toWhiteRatio,
    },
  ]
    .filter((layer) => layer.alpha > 0.01 && layer.scale > 0.02)
    .sort((left, right) => left.scale - right.scale);

  for (const layer of spriteLayers) {
    drawEvolutionSpriteFrame(layer.entity, centerX, centerY, spriteSize, layer);
  }

  drawEvolutionAnimationParticles(current, centerX, centerY, spriteSize, elapsed);

  if (orbAlpha > 0.001 && orbRadius > 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, orbAlpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, 0.88 + orbAlpha * 0.12).toFixed(3)})`;
    ctx.lineWidth = clamp(orbRadius * 0.018, 2.6, 5.6);
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (beatState.stage === "reveal" || beatState.stage === "complete") {
    subtitle = `${current.toNameFr} !`;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(6, 10, 19, 0.9)";
  ctx.fillStyle = "#f7fbff";
  ctx.font = "700 30px Trebuchet MS";
  ctx.lineWidth = 6;
  ctx.strokeText(title, centerX, centerY - spriteSize * 0.72);
  ctx.fillText(title, centerX, centerY - spriteSize * 0.72);

  if (subtitle) {
    ctx.font = "700 34px Trebuchet MS";
    ctx.lineWidth = 7;
    ctx.strokeText(subtitle, centerX, centerY + spriteSize * 0.72);
    ctx.fillText(subtitle, centerX, centerY + spriteSize * 0.72);
  }
  ctx.restore();
}

function getRouteFallbackPalette(routeId) {
  const parts = String(routeId || "").match(/\d+/g);
  const routeNumber = parts && parts.length > 0 ? Math.max(1, Number(parts[parts.length - 1] || 1)) : 1;
  const hue = (routeNumber * 43) % 360;
  const top = "hsl(" + hue + ", 38%, 24%)";
  const bottom = "hsl(" + ((hue + 26) % 360) + ", 44%, 12%)";
  const accent = "hsla(" + ((hue + 52) % 360) + ", 70%, 68%, 0.12)";
  return { top, bottom, accent, routeNumber };
}

function drawBackground(width, height) {
  if (state.backgroundImage) {
    const image = state.backgroundImage;
    const drift = getBackgroundDriftOffset();
    const driftRange = getBackgroundDriftRangePx();
    const coverPadX = driftRange + Math.abs(drift.x) + 6;
    const coverPadY = driftRange + Math.abs(drift.y) + 6;
    const scale = Math.max((width + coverPadX * 2) / image.width, (height + coverPadY * 2) / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = (width - drawWidth) * 0.5 + drift.x;
    const drawY = (height - drawHeight) * 0.5 + drift.y;

    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.imageSmoothingEnabled = wasSmoothing;
    return;
  }

  const routeId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = state.routeData?.route_name_fr || getRouteDisplayName(routeId);
  const palette = getRouteFallbackPalette(routeId);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, palette.top);
  gradient.addColorStop(1, palette.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  const bandStep = Math.max(38, Math.min(84, 28 + palette.routeNumber * 3));
  for (let x = -height; x < width + height; x += bandStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - height * 0.5, height);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(235, 247, 255, 0.78)";
  ctx.font = "700 15px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(routeName, 18, 16);
  ctx.restore();
}

function drawLoadingOrError(text) {
  const { width, height } = state.viewport;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#f7fbff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 30px Trebuchet MS";
  ctx.fillText(text, width * 0.5, height * 0.48);
}

function drawBallInventoryOverlay(layout) {
  state.ui.ballOverlayHitboxes = [];
  const rows = getBallInventoryOverlayRows();
  if (rows.length <= 0) {
    return;
  }
  const topbarBallSummaryVisible = Boolean(uiTopbarEl?.querySelector?.("#topbar-balls-pill"));
  if (topbarBallSummaryVisible) {
    return;
  }

  const safeBounds = layout?.safeBounds || {
    left: 8,
    top: 8,
    right: Math.max(8, state.viewport.width - 8),
    bottom: Math.max(8, state.viewport.height - 8),
  };
  const viewportProfile = layout?.viewportProfile || {};
  const isPhone = Boolean(viewportProfile.phone);
  if (isPhone) {
    return;
  }
  const compact = Boolean(isPhone || viewportProfile.compact);
  const iconSize = isPhone ? 14 : compact ? 16 : 22;
  const rowGap = isPhone ? 3 : compact ? 4 : 6;
  const panelPaddingX = isPhone ? 5 : 6;
  const panelPaddingY = isPhone ? 5 : 6;
  const iconTextGap = isPhone ? 5 : compact ? 6 : 8;
  const valueFontSize = isPhone ? 12 : compact ? 13 : 16;
  const rowHeight = isPhone ? 30 : compact ? 34 : 44;
  const rightInset = isPhone ? 6 : compact ? 8 : 12;

  ctx.save();
  ctx.font = `800 ${valueFontSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let maxValueWidth = 0;
  for (const row of rows) {
    const value = String(Math.max(0, toSafeInt(row.count, 0)));
    maxValueWidth = Math.max(maxValueWidth, Math.ceil(ctx.measureText(value).width));
  }
  const dynamicPanelWidth = Math.ceil(panelPaddingX * 2 + iconSize + iconTextGap + maxValueWidth + rightInset);
  const targetDesktopRowWidth = 220;
  const targetCompactRowWidth = isPhone ? 102 : 116;
  const panelWidth = Math.max(dynamicPanelWidth, (compact ? targetCompactRowWidth : targetDesktopRowWidth) + 6);
  const panelHeight = Math.ceil(panelPaddingY * 2 + rows.length * rowHeight + Math.max(0, rows.length - 1) * rowGap);
  const overlayPadding = getOverlayPaddingSnapshot();
  const overlayPaddingLeft = overlayPadding.left;
  const overlayPaddingTop = overlayPadding.top;
  const topHudHeight = getRuntimeShellMetricHeight(uiTopbarEl, "--ui-runtime-topbar-height-px");
  const panelXDefault = clamp(safeBounds.left + 6, 6, state.viewport.width - panelWidth - 6);
  const panelXPhoneAligned = clamp(overlayPaddingLeft, 6, state.viewport.width - panelWidth - 6);
  const panelX = isPhone ? panelXPhoneAligned : panelXDefault;
  const panelTopDefault = safeBounds.top + 6;
  const panelTopDesktopAligned = overlayPaddingTop + 6;
  const panelTopPhoneAligned = overlayPaddingTop + Math.max(0, Math.round((Math.max(topHudHeight, panelHeight) - panelHeight) * 0.5));
  const panelTop = isPhone ? panelTopPhoneAligned : compact ? panelTopDefault : panelTopDesktopAligned;
  const panelY = clamp(panelTop, 6, state.viewport.height - panelHeight - 6);

  drawRetroHudPanel(panelX, panelY, panelWidth, panelHeight, {
    cut: compact ? 8 : 10,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.3,
  });

  const hitboxes = [];
  const hoveredType = String(state.ui.hoveredBallOverlayType || "").toLowerCase().trim();
  const timeMs = Number(state.timeMs) || 0;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const style = BALL_OVERLAY_UI_STYLE_BY_TYPE[row.type] || BALL_OVERLAY_UI_STYLE_DEFAULT;
    const isHovered = hoveredType === row.type;
    const hoverPulse = isHovered
      ? (Math.sin(timeMs * 0.018 + Number(style.phaseOffset || 0)) + 1) * 0.5
      : 0;
    const baseRowY = panelY + panelPaddingY + i * (rowHeight + rowGap);
    const baseRowX = panelX + 3;
    const baseRowWidth = panelWidth - 6;
    const baseRowHeight = rowHeight;
    const rowScale = isHovered ? 1.03 + hoverPulse * 0.02 : 1;
    const rowWidth = baseRowWidth * rowScale;
    const rowVisualHeight = baseRowHeight * rowScale;
    const rowX = baseRowX - (rowWidth - baseRowWidth) * 0.5;
    const rowY = baseRowY - (rowVisualHeight - baseRowHeight) * 0.5;
    const centerY = rowY + rowVisualHeight * 0.5;
    const rowTop = rowY;
    const rowBottom = rowY + rowVisualHeight;
    const iconCenterX = rowX + panelPaddingX + iconSize * 0.5;
    const image = row.spritePath ? getCachedSpriteImage(row.spritePath) : null;
    const valueText = String(Math.max(0, toSafeInt(row.count, 0)));

    drawRetroHudPanel(rowX, rowY, rowWidth, rowVisualHeight, {
      cut: compact ? 6 : 8,
      fillTop: style.rowFillTop,
      fillMid: style.rowFillTop,
      fillBottom: style.rowFillBottom,
      border: style.rowBorder,
      highlight: "rgba(255, 255, 255, 0.2)",
      shadow: isHovered ? style.glow : "rgba(0, 0, 0, 0.3)",
      borderWidth: isHovered ? 1.5 : 1.15,
    });

    const badgeRadius = iconSize * 0.6;
    const badgeGradient = ctx.createLinearGradient(
      iconCenterX - badgeRadius,
      centerY - badgeRadius,
      iconCenterX,
      centerY + badgeRadius,
    );
    badgeGradient.addColorStop(0, style.iconTop || BALL_OVERLAY_UI_STYLE_DEFAULT.iconTop);
    badgeGradient.addColorStop(1, style.iconBottom || BALL_OVERLAY_UI_STYLE_DEFAULT.iconBottom);
    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.arc(iconCenterX, centerY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const iconScale = isHovered ? 1 + 0.04 + hoverPulse * 0.05 : 1;
    const iconDrawSize = iconSize * iconScale * 0.95;
    if (isDrawableImage(image)) {
      const drawX = snapSpriteValue(iconCenterX - iconDrawSize * 0.5);
      const drawY = snapSpriteValue(centerY - iconDrawSize * 0.5);
      const drawSize = snapSpriteDimension(iconDrawSize);
      const wasSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, drawX, drawY, drawSize, drawSize);
      ctx.imageSmoothingEnabled = wasSmoothing;
    } else {
      drawPokeball(iconCenterX, centerY, iconDrawSize * 0.48, {
        alpha: 0.92,
      });
    }

    const textX = rowX + panelPaddingX + iconSize + iconTextGap;
    const valueY = rowY + (compact ? 21 : 24);
    ctx.strokeStyle = "rgba(6, 12, 20, 0.84)";
    ctx.lineWidth = 2.8;
    ctx.fillStyle = style.text;
    if (isHovered) {
      ctx.shadowColor = style.glow;
      ctx.shadowBlur = 10 + hoverPulse * 8;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    }
    ctx.font = `800 ${valueFontSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    ctx.strokeText(valueText, textX, valueY);
    ctx.fillText(valueText, textX, valueY);

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    hitboxes.push({
      ballType: row.type,
      x: panelX + 2,
      y: Math.max(panelY + 2, rowTop),
      width: Math.max(8, panelWidth - 4),
      height: Math.max(8, rowBottom - rowTop),
    });
  }

  state.ui.ballOverlayHitboxes = hitboxes;
  ctx.restore();
}

function getCanvasRuntimeOverlayBounds(layout) {
  const safeBounds = layout?.safeBounds || {};
  return {
    left: clamp(Number(safeBounds.left) || 8, 8, Math.max(8, state.viewport.width - 24)),
    top: clamp(Number(safeBounds.top) || 8, 8, Math.max(8, state.viewport.height - 24)),
    right: clamp(Number(safeBounds.right) || (state.viewport.width - 8), 24, state.viewport.width - 8),
    bottom: clamp(Number(safeBounds.bottom) || (state.viewport.height - 8), 24, state.viewport.height - 8),
  };
}

function resolveCanvasRuntimeOverlayRect(anchorX, anchorY, width, height, layout, options = {}) {
  const bounds = getCanvasRuntimeOverlayBounds(layout);
  const safeWidth = clamp(Number(width) || 0, 120, Math.max(120, bounds.right - bounds.left));
  const safeHeight = clamp(Number(height) || 0, 60, Math.max(60, bounds.bottom - bounds.top));
  const offsetX = Number(options.offsetX || 0);
  const offsetY = Number(options.offsetY || 0);
  const margin = Math.max(8, Number(options.margin || 12));
  const minLeft = bounds.left;
  const maxLeft = Math.max(minLeft, bounds.right - safeWidth);
  const minTop = bounds.top;
  const maxTop = Math.max(minTop, bounds.bottom - safeHeight);

  let left = Number(anchorX || 0) + offsetX;
  let top = Number(anchorY || 0) + offsetY;
  if (left + safeWidth + margin > bounds.right) {
    left = Number(anchorX || 0) - safeWidth - Math.max(10, Math.abs(offsetX));
  }
  if (top + safeHeight + margin > bounds.bottom) {
    top = Number(anchorY || 0) - safeHeight - Math.max(10, Math.abs(offsetY));
  }

  return {
    x: clamp(left, minLeft, maxLeft),
    y: clamp(top, minTop, maxTop),
    width: safeWidth,
    height: safeHeight,
  };
}

function resolveCanvasRuntimeBottomSheetRect(width, height, layout, options = {}) {
  const bounds = getCanvasRuntimeOverlayBounds(layout);
  const sideInset = Math.max(8, Number(options.sideInset || 12));
  const bottomOffset = Math.max(0, Number(options.bottomOffset || 0));
  const maxWidth = Math.max(120, bounds.right - bounds.left - sideInset * 2);
  const safeWidth = clamp(Number(width) || 0, 120, maxWidth);
  const safeHeight = clamp(Number(height) || 0, 60, Math.max(60, bounds.bottom - bounds.top));
  const minLeft = bounds.left;
  const maxLeft = Math.max(minLeft, bounds.right - safeWidth);
  const left = clamp((state.viewport.width - safeWidth) * 0.5, minLeft, maxLeft);
  const top = Math.max(bounds.top, bounds.bottom - safeHeight - bottomOffset);
  return {
    x: left,
    y: top,
    width: safeWidth,
    height: safeHeight,
  };
}

function resolveCanvasRuntimeCenteredModalRect(width, height, layout, options = {}) {
  const bounds = getCanvasRuntimeOverlayBounds(layout);
  const sideInset = Math.max(8, Number(options.sideInset || 12));
  const maxWidth = Math.max(120, bounds.right - bounds.left - sideInset * 2);
  const safeWidth = clamp(Number(width) || 0, 120, maxWidth);
  const safeHeight = clamp(Number(height) || 0, 60, Math.max(60, bounds.bottom - bounds.top));
  const minLeft = bounds.left;
  const maxLeft = Math.max(minLeft, bounds.right - safeWidth);
  const minTop = bounds.top;
  const maxTop = Math.max(minTop, bounds.bottom - safeHeight);
  const left = clamp((state.viewport.width - safeWidth) * 0.5, minLeft, maxLeft);
  const top = clamp((state.viewport.height - safeHeight) * 0.5, minTop, maxTop);
  return {
    x: left,
    y: top,
    width: safeWidth,
    height: safeHeight,
  };
}

function drawCanvasRuntimeOverlayText(text, x, y, options = {}) {
  const value = String(text || "");
  if (!value) {
    return;
  }
  const fontSize = Math.max(9, Number(options.fontSize) || 12);
  const weight = String(options.weight || "700");
  const fillStyle = String(options.fillStyle || ZONE_UI_CANVAS_THEME.panel.text);
  const strokeStyle = String(options.strokeStyle || "rgba(7, 14, 22, 0.84)");
  ctx.save();
  ctx.font = `${weight} ${fontSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.textAlign = String(options.textAlign || "left");
  ctx.textBaseline = String(options.textBaseline || "top");
  ctx.lineWidth = Number(options.lineWidth || 2.6);
  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle;
  ctx.strokeText(value, x, y);
  ctx.fillText(value, x, y);
  ctx.restore();
}

function drawCanvasRuntimeOverlayPill(x, y, width, height, label, options = {}) {
  const fillTop = String(options.fillTop || ZONE_UI_CANVAS_THEME.subpanel.fillTop);
  const fillBottom = String(options.fillBottom || ZONE_UI_CANVAS_THEME.subpanel.fillBottom);
  const border = String(options.border || ZONE_UI_CANVAS_THEME.subpanel.border);
  drawRetroHudPanel(x, y, width, height, {
    cut: 8,
    fillTop,
    fillMid: fillTop,
    fillBottom,
    border,
    highlight: "rgba(255, 255, 255, 0.2)",
    shadow: "rgba(0, 0, 0, 0.26)",
    borderWidth: 1.15,
    pill: true,
    radius: height * 0.5,
  });
  drawCanvasRuntimeOverlayText(label, x + width * 0.5, y + height * 0.5, {
    fontSize: Math.max(9, Math.round(height * 0.42)),
    textAlign: "center",
    textBaseline: "middle",
    fillStyle: String(options.textFill || ZONE_UI_CANVAS_THEME.panel.text),
    strokeStyle: "rgba(8, 16, 24, 0.84)",
    lineWidth: 2.2,
  });
}

function getCanvasRectFromDomElement(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return null;
  }
  const sourceRect = element.getBoundingClientRect();
  const widthPx = Math.max(0, Number(sourceRect?.width) || (Number(sourceRect?.right) - Number(sourceRect?.left)) || 0);
  const heightPx = Math.max(0, Number(sourceRect?.height) || (Number(sourceRect?.bottom) - Number(sourceRect?.top)) || 0);
  if (widthPx <= 0 || heightPx <= 0) {
    return null;
  }
  const canvasRect = typeof ctx?.canvas?.getBoundingClientRect === "function"
    ? ctx.canvas.getBoundingClientRect()
    : { left: 0, top: 0, width: state.viewport.width, height: state.viewport.height };
  const canvasWidth = Math.max(1, Number(canvasRect?.width) || Number(state.viewport.width) || 1);
  const canvasHeight = Math.max(1, Number(canvasRect?.height) || Number(state.viewport.height) || 1);
  const scaleX = Math.max(1, Number(state.viewport.width) || 1) / canvasWidth;
  const scaleY = Math.max(1, Number(state.viewport.height) || 1) / canvasHeight;
  return {
    x: (Number(sourceRect?.left || 0) - Number(canvasRect?.left || 0)) * scaleX,
    y: (Number(sourceRect?.top || 0) - Number(canvasRect?.top || 0)) * scaleY,
    width: widthPx * scaleX,
    height: heightPx * scaleY,
  };
}

function getElementText(element, fallback = "") {
  const text = String(element?.textContent || "").trim();
  return text || String(fallback || "");
}

function getClosestElement(element, selector) {
  return element && typeof element.closest === "function" ? element.closest(selector) : null;
}

function drawCanvasRuntimeDesktopShellTopbar(hitboxes) {
  const rect = getCanvasRectFromDomElement(topbarBallsPillEl);
  if (!rect) {
    return;
  }
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const isHovered = hoveredActionId === "runtime-shell-topbar-balls";
  drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
    cut: 14,
    fillTop: isHovered ? "rgba(26, 70, 102, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: isHovered ? "rgba(18, 54, 82, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: isHovered ? "rgba(8, 28, 44, 0.998)" : ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: isHovered ? "rgba(80, 150, 255, 0.32)" : ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: isHovered ? 1.55 : 1.35,
    radius: 24,
  });
  drawCanvasRuntimeOverlayText("Capture", rect.x + 12, rect.y + 9, {
    fontSize: 10,
    fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
    strokeStyle: "rgba(7, 14, 22, 0.72)",
  });

  const itemDefinitions = [
    { ballType: "poke_ball", itemId: "#topbar-ball-poke-item", countId: "#topbar-ball-poke-count" },
    { ballType: "super_ball", itemId: "#topbar-ball-super-item", countId: "#topbar-ball-super-count" },
    { ballType: "hyper_ball", itemId: "#topbar-ball-hyper-item", countId: "#topbar-ball-hyper-count" },
  ];
  const gridY = rect.y + 24;
  const gridHeight = Math.max(28, rect.height - 32);
  const cellGap = 6;
  const cellWidth = Math.max(36, (rect.width - 20 - cellGap * 2) / 3);
  const activeBallType = String(state.saveData?.active_ball_type || "").toLowerCase().trim();
  itemDefinitions.forEach((definition, index) => {
    const itemEl = topbarBallsPillEl?.querySelector?.(definition.itemId) || null;
    const countEl = topbarBallsPillEl?.querySelector?.(definition.countId) || null;
    const isActive = Boolean(itemEl?.classList?.contains?.("is-active")) || definition.ballType === activeBallType;
    const cellX = rect.x + 10 + index * (cellWidth + cellGap);
    drawRetroHudPanel(cellX, gridY, cellWidth, gridHeight, {
      cut: 9,
      fillTop: isActive ? "rgba(61, 120, 224, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: isActive ? "rgba(61, 120, 224, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillMid,
      fillBottom: isActive ? "rgba(33, 74, 166, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: isActive ? "rgba(197, 228, 255, 0.86)" : ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: isActive ? "rgba(80, 150, 255, 0.24)" : "rgba(0, 0, 0, 0.18)",
      borderWidth: isActive ? 1.35 : 1.1,
      radius: 18,
    });
    drawPokeball(cellX + cellWidth * 0.5, gridY + gridHeight * 0.42, Math.min(cellWidth, gridHeight) * 0.22, {
      alpha: isActive ? 0.98 : 0.9,
      ball_type: definition.ballType,
    });
    drawCanvasRuntimeOverlayText(getElementText(countEl, "0"), cellX + cellWidth * 0.5, gridY + gridHeight - 18, {
      fontSize: 11,
      weight: "800",
      textAlign: "center",
      fillStyle: ZONE_UI_CANVAS_THEME.panel.text,
    });
  });

  hitboxes.push({
    id: "runtime-shell-topbar-balls",
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    interactive: true,
    actionType: "topbar-ball-menu",
  });
}

function drawCanvasRuntimeDesktopShellRouteSummary(hitboxes) {
  const shellRect = getCanvasRectFromDomElement(routeNavPanelEl?.parentElement || routeNavPanelEl);
  const buttonRect = getCanvasRectFromDomElement(routeNavDrawerToggleButtonEl) || shellRect;
  if (!shellRect || !buttonRect) {
    return;
  }
  const destinationCount = Math.max(0, toSafeInt(getElementText(routeNavDrawerToggleCountEl, "0"), 0));
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const interactive = destinationCount > 0;
  const isHovered = interactive && hoveredActionId === "runtime-shell-route-nav-toggle";
  const drawerOpen = Boolean(state.ui.routeNavDrawerOpen);
  drawRetroHudPanel(shellRect.x, shellRect.y, shellRect.width, shellRect.height, {
    cut: 14,
    fillTop: drawerOpen ? "rgba(31, 73, 120, 0.99)" : isHovered ? "rgba(22, 63, 97, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: drawerOpen ? "rgba(20, 57, 97, 0.99)" : isHovered ? "rgba(16, 48, 77, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: drawerOpen ? "rgba(10, 31, 56, 0.998)" : isHovered ? "rgba(8, 28, 47, 0.998)" : ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: isHovered || drawerOpen ? "rgba(80, 150, 255, 0.28)" : ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: isHovered || drawerOpen ? 1.5 : 1.35,
    radius: 18,
  });
  drawCanvasRuntimeOverlayText("Zone active", shellRect.x + 14, shellRect.y + 10, {
    fontSize: 10,
    fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
    strokeStyle: "rgba(7, 14, 22, 0.72)",
  });

  const currentText = getElementText(routeNavCurrentEl, "Zone");
  const regionText = getElementText(routeNavRegionEl, "");
  ctx.save();
  ctx.font = `800 15px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const title = fitTextToWidthWithEllipsis(currentText, Math.max(80, shellRect.width - 96));
  ctx.restore();
  drawCanvasRuntimeOverlayText(title, shellRect.x + 14, shellRect.y + 28, {
    fontSize: 15,
    weight: "800",
  });
  if (regionText) {
    drawCanvasRuntimeOverlayText(regionText, shellRect.x + 14, shellRect.y + shellRect.height - 22, {
      fontSize: 10,
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(7, 14, 22, 0.72)",
    });
  }

  const pillWidth = 38;
  const pillHeight = 28;
  const pillX = shellRect.x + shellRect.width - pillWidth - 14;
  const pillY = shellRect.y + Math.max(12, (shellRect.height - pillHeight) * 0.5);
  drawCanvasRuntimeOverlayPill(pillX, pillY, pillWidth, pillHeight, String(destinationCount), {
    fillTop: interactive ? "rgba(69, 132, 237, 0.98)" : "rgba(78, 89, 102, 0.94)",
    fillBottom: interactive ? "rgba(37, 82, 171, 0.98)" : "rgba(48, 57, 70, 0.96)",
    border: interactive ? "rgba(205, 230, 255, 0.84)" : "rgba(166, 176, 189, 0.52)",
  });
  drawCanvasRuntimeOverlayText("›", shellRect.x + shellRect.width - 18, shellRect.y + shellRect.height * 0.5, {
    fontSize: 18,
    textAlign: "center",
    textBaseline: "middle",
    fillStyle: interactive ? ZONE_UI_CANVAS_THEME.panel.text : "rgba(208, 214, 220, 0.58)",
  });

  hitboxes.push({
    id: "runtime-shell-route-nav-toggle",
    x: buttonRect.x,
    y: buttonRect.y,
    width: buttonRect.width,
    height: buttonRect.height,
    interactive,
    actionType: "route-nav-drawer-toggle",
  });
}

function drawCanvasRuntimeDesktopShellResourceStrip() {
  const stripRect = getCanvasRectFromDomElement(moneyPillEl?.parentElement);
  if (!stripRect) {
    return;
  }
  drawRetroHudPanel(stripRect.x, stripRect.y, stripRect.width, stripRect.height, {
    cut: 14,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.35,
    radius: 18,
  });

  const pillEntries = [
    moneyPillEl,
    getClosestElement(coinsValueEl, ".resource-pill"),
    getClosestElement(saveBackendValueEl, ".resource-pill"),
  ].filter(Boolean);

  for (const pillEl of pillEntries) {
    const pillRect = getCanvasRectFromDomElement(pillEl);
    if (!pillRect) {
      continue;
    }
    const iconText = getElementText(pillEl.querySelector?.(".currency-pill-icon"), "");
    const captionText = getElementText(pillEl.querySelector?.(".currency-pill-caption"), "");
    const valueText = getElementText(
      pillEl.querySelector?.(".currency-pill-value") || pillEl.querySelector?.("#save-backend-value"),
      "",
    );
    drawRetroHudPanel(pillRect.x, pillRect.y, pillRect.width, pillRect.height, {
      cut: 10,
      fillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: ZONE_UI_CANVAS_THEME.subpanel.fillMid,
      fillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: "rgba(0, 0, 0, 0.16)",
      borderWidth: 1.1,
      radius: 14,
    });
    const iconRadius = Math.min(11, pillRect.height * 0.24);
    const iconCenterX = pillRect.x + 16;
    const iconCenterY = pillRect.y + pillRect.height * 0.5;
    const iconGradient = ctx.createLinearGradient(iconCenterX, iconCenterY - iconRadius, iconCenterX, iconCenterY + iconRadius);
    iconGradient.addColorStop(0, "#fff2b5");
    iconGradient.addColorStop(1, "#d59b2d");
    ctx.save();
    ctx.fillStyle = iconGradient;
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, iconRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawCanvasRuntimeOverlayText(iconText, iconCenterX, iconCenterY, {
      fontSize: 10,
      weight: "800",
      textAlign: "center",
      textBaseline: "middle",
      fillStyle: "rgba(24, 38, 56, 0.96)",
      strokeStyle: "rgba(255, 255, 255, 0.22)",
      lineWidth: 1.6,
    });
    ctx.save();
    ctx.font = `800 12px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const valueLabel = fitTextToWidthWithEllipsis(valueText, Math.max(36, pillRect.width - 44));
    ctx.restore();
    drawCanvasRuntimeOverlayText(valueLabel, pillRect.x + 32, pillRect.y + 9, {
      fontSize: 12,
      weight: "800",
    });
    drawCanvasRuntimeOverlayText(captionText, pillRect.x + 32, pillRect.y + pillRect.height - 16, {
      fontSize: 8,
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(7, 14, 22, 0.68)",
    });
  }
}

function drawCanvasRuntimeDesktopShellActionDock(hitboxes) {
  const shellRect = getCanvasRectFromDomElement(actionDockEl);
  const buttonRect = getCanvasRectFromDomElement(actionDockPokeballToggleButtonEl);
  if (!shellRect || !buttonRect) {
    return;
  }
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const isHovered = hoveredActionId === "runtime-shell-action-dock-toggle";
  const menuOpen = Boolean(actionDockPokeballToggleButtonEl?.getAttribute?.("aria-expanded") === "true");
  drawRetroHudPanel(shellRect.x, shellRect.y, shellRect.width, shellRect.height, {
    cut: 14,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.35,
    radius: 18,
  });
  const label = getElementText(
    actionDockPokeballToggleButtonEl?.querySelector?.(".action-dock-pokeball-toggle-label"),
    "Menu",
  );
  drawRetroHudPanel(buttonRect.x, buttonRect.y, buttonRect.width, buttonRect.height, {
    cut: 14,
    fillTop: menuOpen ? "rgba(63, 118, 220, 0.98)" : isHovered ? "rgba(54, 88, 147, 0.96)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillMid: menuOpen ? "rgba(63, 118, 220, 0.98)" : isHovered ? "rgba(54, 88, 147, 0.96)" : ZONE_UI_CANVAS_THEME.subpanel.fillMid,
    fillBottom: menuOpen ? "rgba(38, 72, 151, 0.98)" : isHovered ? "rgba(39, 64, 108, 0.96)" : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    border: menuOpen ? "rgba(208, 232, 255, 0.86)" : ZONE_UI_CANVAS_THEME.subpanel.border,
    highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
    shadow: isHovered || menuOpen ? "rgba(80, 150, 255, 0.28)" : "rgba(0, 0, 0, 0.18)",
    borderWidth: isHovered || menuOpen ? 1.4 : 1.12,
    radius: 22,
  });
  drawPokeball(buttonRect.x + 22, buttonRect.y + buttonRect.height * 0.5, Math.min(buttonRect.width, buttonRect.height) * 0.19, {
    alpha: 0.96,
    ball_type: "poke_ball",
  });
  drawCanvasRuntimeOverlayText(label, buttonRect.x + 42, buttonRect.y + buttonRect.height * 0.5 - 10, {
    fontSize: 14,
    weight: "800",
    textBaseline: "middle",
  });
  drawCanvasRuntimeOverlayText("Actions principales", buttonRect.x + 42, buttonRect.y + buttonRect.height * 0.5 + 8, {
    fontSize: 9,
    fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
    strokeStyle: "rgba(7, 14, 22, 0.72)",
    textBaseline: "middle",
  });
  hitboxes.push({
    id: "runtime-shell-action-dock-toggle",
    x: buttonRect.x,
    y: buttonRect.y,
    width: buttonRect.width,
    height: buttonRect.height,
    interactive: true,
    actionType: "action-dock-menu-toggle",
  });
}

function drawCanvasRuntimeMobileShellRouteSummary(hitboxes) {
  const shellRect = getCanvasRectFromDomElement(routeNavPanelEl?.parentElement || routeNavPanelEl);
  const buttonRect = getCanvasRectFromDomElement(routeNavDrawerToggleButtonEl) || shellRect;
  if (!shellRect || !buttonRect) {
    return;
  }
  const destinationCount = Math.max(0, toSafeInt(getElementText(routeNavDrawerToggleCountEl, "0"), 0));
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const interactive = destinationCount > 0;
  const isHovered = interactive && hoveredActionId === "runtime-shell-route-nav-toggle";
  const drawerOpen = Boolean(state.ui.routeNavDrawerOpen);
  drawRetroHudPanel(shellRect.x, shellRect.y, shellRect.width, shellRect.height, {
    cut: 16,
    fillTop: drawerOpen ? "rgba(31, 73, 120, 0.99)" : isHovered ? "rgba(22, 63, 97, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: drawerOpen ? "rgba(20, 57, 97, 0.99)" : isHovered ? "rgba(16, 48, 77, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: drawerOpen ? "rgba(10, 31, 56, 0.998)" : isHovered ? "rgba(8, 28, 47, 0.998)" : ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: isHovered || drawerOpen ? "rgba(80, 150, 255, 0.3)" : ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: isHovered || drawerOpen ? 1.55 : 1.35,
    radius: 20,
  });
  const currentText = getElementText(routeNavCurrentEl, "Zone");
  const regionText = getElementText(routeNavRegionEl, "");
  ctx.save();
  ctx.font = `800 18px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const title = fitTextToWidthWithEllipsis(currentText, Math.max(76, shellRect.width - 98));
  ctx.restore();
  drawCanvasRuntimeOverlayText(title, shellRect.x + shellRect.width * 0.5, shellRect.y + 18, {
    fontSize: 18,
    weight: "800",
    textAlign: "center",
  });
  if (regionText) {
    drawCanvasRuntimeOverlayText(regionText, shellRect.x + shellRect.width * 0.5, shellRect.y + shellRect.height - 22, {
      fontSize: 10,
      textAlign: "center",
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(7, 14, 22, 0.72)",
    });
  }
  const pillWidth = 34;
  const pillHeight = 24;
  const pillX = shellRect.x + shellRect.width - pillWidth - 18;
  const pillY = shellRect.y + Math.max(10, (shellRect.height - pillHeight) * 0.5);
  drawCanvasRuntimeOverlayPill(pillX, pillY, pillWidth, pillHeight, String(destinationCount), {
    fillTop: interactive ? "rgba(69, 132, 237, 0.98)" : "rgba(78, 89, 102, 0.94)",
    fillBottom: interactive ? "rgba(37, 82, 171, 0.98)" : "rgba(48, 57, 70, 0.96)",
    border: interactive ? "rgba(205, 230, 255, 0.84)" : "rgba(166, 176, 189, 0.52)",
  });
  drawCanvasRuntimeOverlayText("›", shellRect.x + shellRect.width - 10, shellRect.y + shellRect.height * 0.5, {
    fontSize: 16,
    textAlign: "center",
    textBaseline: "middle",
    fillStyle: interactive ? ZONE_UI_CANVAS_THEME.panel.text : "rgba(208, 214, 220, 0.58)",
  });
  hitboxes.push({
    id: "runtime-shell-route-nav-toggle",
    x: buttonRect.x,
    y: buttonRect.y,
    width: buttonRect.width,
    height: buttonRect.height,
    interactive,
    actionType: "route-nav-drawer-toggle",
  });
}

function drawCanvasRuntimeMobileShellTopbar(hitboxes) {
  const rect = getCanvasRectFromDomElement(topbarBallsPillEl);
  if (!rect) {
    return;
  }
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const isHovered = hoveredActionId === "runtime-shell-topbar-balls";
  drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
    cut: 14,
    fillTop: isHovered ? "rgba(26, 70, 102, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: isHovered ? "rgba(18, 54, 82, 0.995)" : ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: isHovered ? "rgba(8, 28, 44, 0.998)" : ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: isHovered ? "rgba(80, 150, 255, 0.3)" : ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: isHovered ? 1.5 : 1.3,
    radius: 18,
  });
  const itemDefinitions = [
    { ballType: "poke_ball", countId: "#topbar-ball-poke-count" },
    { ballType: "super_ball", countId: "#topbar-ball-super-count" },
    { ballType: "hyper_ball", countId: "#topbar-ball-hyper-count" },
  ];
  const activeBallType = String(state.saveData?.active_ball_type || "").toLowerCase().trim();
  const innerLeft = rect.x + 10;
  const innerRight = rect.x + rect.width - 10;
  const itemWidth = (innerRight - innerLeft) / itemDefinitions.length;
  itemDefinitions.forEach((definition, index) => {
    const countEl = topbarBallsPillEl?.querySelector?.(definition.countId) || null;
    const centerX = innerLeft + itemWidth * index + itemWidth * 0.5;
    const iconY = rect.y + rect.height * 0.37;
    const countY = rect.y + rect.height - 14;
    const isActive = definition.ballType === activeBallType;
    if (index > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(176, 205, 229, 0.24)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerLeft + itemWidth * index, rect.y + 10);
      ctx.lineTo(innerLeft + itemWidth * index, rect.y + rect.height - 10);
      ctx.stroke();
      ctx.restore();
    }
    if (isActive) {
      drawCanvasRuntimeOverlayPill(centerX - 18, rect.y + 7, 36, 16, "", {
        fillTop: "rgba(61, 120, 224, 0.32)",
        fillBottom: "rgba(33, 74, 166, 0.24)",
        border: "rgba(197, 228, 255, 0.4)",
      });
    }
    drawPokeball(centerX, iconY, Math.min(itemWidth, rect.height) * 0.14, {
      alpha: isActive ? 0.98 : 0.9,
      ball_type: definition.ballType,
    });
    drawCanvasRuntimeOverlayText(getElementText(countEl, "0"), centerX, countY, {
      fontSize: 11,
      weight: "800",
      textAlign: "center",
      fillStyle: ZONE_UI_CANVAS_THEME.panel.text,
    });
  });
  hitboxes.push({
    id: "runtime-shell-topbar-balls",
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    interactive: true,
    actionType: "topbar-ball-menu",
  });
}

function drawCanvasRuntimeMobileShellResourceStrip() {
  const stripRect = getCanvasRectFromDomElement(moneyPillEl?.parentElement);
  if (!stripRect) {
    return;
  }
  drawRetroHudPanel(stripRect.x, stripRect.y, stripRect.width, stripRect.height, {
    cut: 14,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.3,
    radius: 16,
  });
  const pillEntries = [
    moneyPillEl,
    getClosestElement(coinsValueEl, ".resource-pill"),
    getClosestElement(saveBackendValueEl, ".resource-pill"),
  ].filter(Boolean);
  for (const pillEl of pillEntries) {
    const pillRect = getCanvasRectFromDomElement(pillEl);
    if (!pillRect) {
      continue;
    }
    const iconText = getElementText(pillEl.querySelector?.(".currency-pill-icon"), "");
    const valueText = getElementText(
      pillEl.querySelector?.(".currency-pill-value") || pillEl.querySelector?.("#save-backend-value"),
      "",
    );
    drawRetroHudPanel(pillRect.x, pillRect.y, pillRect.width, pillRect.height, {
      cut: 10,
      fillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: ZONE_UI_CANVAS_THEME.subpanel.fillMid,
      fillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: "rgba(0, 0, 0, 0.16)",
      borderWidth: 1.1,
      radius: 14,
    });
    const iconRadius = Math.min(9, pillRect.height * 0.24);
    const iconCenterX = pillRect.x + 14;
    const iconCenterY = pillRect.y + pillRect.height * 0.5;
    const iconGradient = ctx.createLinearGradient(iconCenterX, iconCenterY - iconRadius, iconCenterX, iconCenterY + iconRadius);
    iconGradient.addColorStop(0, "#fff2b5");
    iconGradient.addColorStop(1, "#d59b2d");
    ctx.save();
    ctx.fillStyle = iconGradient;
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, iconRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawCanvasRuntimeOverlayText(iconText, iconCenterX, iconCenterY, {
      fontSize: 9,
      weight: "800",
      textAlign: "center",
      textBaseline: "middle",
      fillStyle: "rgba(24, 38, 56, 0.96)",
      strokeStyle: "rgba(255, 255, 255, 0.22)",
      lineWidth: 1.5,
    });
    drawCanvasRuntimeOverlayText(valueText, pillRect.x + pillRect.width - 12, pillRect.y + pillRect.height * 0.5, {
      fontSize: 12,
      weight: "800",
      textAlign: "right",
      textBaseline: "middle",
    });
  }
}

function drawCanvasRuntimeMobileShellActionDock(hitboxes) {
  const buttonRect = getCanvasRectFromDomElement(actionDockPokeballToggleButtonEl);
  if (!buttonRect) {
    return;
  }
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const isHovered = hoveredActionId === "runtime-shell-action-dock-toggle";
  const menuOpen = Boolean(actionDockPokeballToggleButtonEl?.getAttribute?.("aria-expanded") === "true");
  const label = getElementText(
    actionDockPokeballToggleButtonEl?.querySelector?.(".action-dock-pokeball-toggle-label"),
    "MENU",
  ).toUpperCase();
  const centerX = buttonRect.x + buttonRect.width * 0.5;
  const circleRadius = Math.min(buttonRect.width * 0.38, Math.max(22, buttonRect.height * 0.32));
  const circleCenterY = buttonRect.y + circleRadius + 4;
  ctx.save();
  ctx.shadowColor = menuOpen || isHovered ? "rgba(80, 150, 255, 0.34)" : "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = menuOpen || isHovered ? 18 : 12;
  ctx.fillStyle = menuOpen ? "rgba(224, 242, 255, 0.98)" : "rgba(244, 249, 255, 0.96)";
  ctx.beginPath();
  ctx.arc(centerX, circleCenterY, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.lineWidth = menuOpen || isHovered ? 2.4 : 2;
  ctx.strokeStyle = menuOpen || isHovered ? "rgba(99, 166, 255, 0.9)" : "rgba(34, 54, 74, 0.84)";
  ctx.beginPath();
  ctx.arc(centerX, circleCenterY, circleRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawPokeball(centerX, circleCenterY, circleRadius * 0.76, {
    alpha: 0.98,
    ball_type: "poke_ball",
  });
  const labelWidth = Math.min(buttonRect.width * 0.7, 54);
  const labelHeight = 15;
  const labelX = centerX - labelWidth * 0.5;
  const labelY = buttonRect.y + buttonRect.height - labelHeight - 4;
  drawRetroHudPanel(labelX, labelY, labelWidth, labelHeight, {
    cut: 8,
    fillTop: menuOpen ? "rgba(63, 118, 220, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillMid: menuOpen ? "rgba(63, 118, 220, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillMid,
    fillBottom: menuOpen ? "rgba(38, 72, 151, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    border: menuOpen ? "rgba(208, 232, 255, 0.86)" : ZONE_UI_CANVAS_THEME.subpanel.border,
    highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
    shadow: "rgba(0, 0, 0, 0.18)",
    borderWidth: 1.05,
    radius: 8,
  });
  drawCanvasRuntimeOverlayText(label, centerX, labelY + labelHeight * 0.5, {
    fontSize: 8,
    weight: "800",
    textAlign: "center",
    textBaseline: "middle",
  });
  hitboxes.push({
    id: "runtime-shell-action-dock-toggle",
    x: buttonRect.x,
    y: buttonRect.y,
    width: buttonRect.width,
    height: buttonRect.height,
    interactive: true,
    actionType: "action-dock-menu-toggle",
  });
}

function drawCanvasRuntimeZoneActions(hitboxes) {
  if (!(zoneActionButtonsById instanceof Map) || zoneActionButtonsById.size <= 0) {
    return;
  }
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  for (const [actionId, buttonEl] of zoneActionButtonsById.entries()) {
    if (!buttonEl || buttonEl.hidden || buttonEl.disabled) {
      continue;
    }
    const rect = getCanvasRectFromDomElement(buttonEl);
    if (!rect) {
      continue;
    }
    const id = `runtime-zone-action-${String(actionId || "").trim()}`;
    const isHovered = hoveredActionId === id;
    drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
      cut: 10,
      fillTop: isHovered ? "rgba(63, 118, 220, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: isHovered ? "rgba(63, 118, 220, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillMid,
      fillBottom: isHovered ? "rgba(38, 72, 151, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: isHovered ? "rgba(80, 150, 255, 0.26)" : "rgba(0, 0, 0, 0.18)",
      borderWidth: isHovered ? 1.35 : 1.1,
      radius: 14,
    });
    ctx.save();
    ctx.font = `800 11px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const label = fitTextToWidthWithEllipsis(getElementText(buttonEl, actionId), Math.max(28, rect.width - 18));
    ctx.restore();
    drawCanvasRuntimeOverlayText(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5, {
      fontSize: 11,
      weight: "800",
      textAlign: "center",
      textBaseline: "middle",
    });
    hitboxes.push({
      id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      interactive: true,
      actionType: "zone-action",
      actionId,
    });
  }
}

function drawCanvasRuntimeDesktopShell(hitboxes) {
  drawCanvasRuntimeDesktopShellTopbar(hitboxes);
  drawCanvasRuntimeDesktopShellRouteSummary(hitboxes);
  drawCanvasRuntimeDesktopShellResourceStrip();
  drawCanvasRuntimeDesktopShellActionDock(hitboxes);
}

function drawCanvasRuntimeMobileShell(hitboxes) {
  drawCanvasRuntimeMobileShellRouteSummary(hitboxes);
  drawCanvasRuntimeMobileShellTopbar(hitboxes);
  drawCanvasRuntimeMobileShellResourceStrip();
  drawCanvasRuntimeMobileShellActionDock(hitboxes);
}

function drawCanvasRuntimeHoverPopup(layout) {
  const model = state.ui.canvasHoverPopupModel;
  if (!model) {
    return;
  }
  const badges = Array.isArray(model.badges) ? model.badges : [];
  const metrics = Array.isArray(model.metrics) ? model.metrics.slice(0, 6) : [];
  const progress = Array.isArray(model.progress) ? model.progress.slice(0, 3) : [];
  if (layout?.viewportProfile?.phone) {
    const compactMetrics = metrics.slice(0, 3);
    const width = clamp(state.viewport.width - 24, 268, 360);
    const tagCount = (model.passivePill ? 1 : 0) + (model.typeSummaryText ? 1 : 0);
    const tagHeight = tagCount > 0 ? 24 : 0;
    const talentHeight = model.passiveLabel ? 18 : 0;
    const metricsHeight = compactMetrics.length > 0 ? 48 : 0;
    const height = 72 + tagHeight + talentHeight + metricsHeight + 16;
    const rect = resolveCanvasRuntimeBottomSheetRect(width, height, layout, {
      sideInset: 12,
    });

    drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
      cut: 12,
      fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
      fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
      fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.panel.border,
      highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
      shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
      borderWidth: 1.5,
    });

    const contentX = rect.x + 14;
    const contentWidth = rect.width - 28;
    let cursorY = rect.y + 12;
    ctx.save();
    ctx.font = `800 15px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const titleText = fitTextToWidthWithEllipsis(model.title, contentWidth);
    ctx.restore();
    drawCanvasRuntimeOverlayText(titleText, contentX, cursorY, {
      fontSize: 15,
      weight: "800",
    });
    cursorY += 20;
    if (model.subtitle) {
      ctx.save();
      ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
      const subtitleText = fitTextToWidthWithEllipsis(model.subtitle, contentWidth);
      ctx.restore();
      drawCanvasRuntimeOverlayText(subtitleText, contentX, cursorY, {
        fontSize: 10,
        fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
        strokeStyle: "rgba(8, 16, 24, 0.74)",
      });
      cursorY += 18;
    }
    if (tagCount > 0) {
      let pillX = contentX;
      if (model.passivePill) {
        ctx.save();
        ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
        const pillText = fitTextToWidthWithEllipsis(model.passivePill, 120);
        const pillWidth = Math.max(70, Math.min(128, Math.ceil(ctx.measureText(pillText).width) + 18));
        ctx.restore();
        drawCanvasRuntimeOverlayPill(pillX, cursorY, pillWidth, 22, pillText, {
          fillTop: "rgba(64, 121, 255, 0.96)",
          fillBottom: "rgba(41, 83, 180, 0.96)",
          border: "rgba(180, 215, 255, 0.8)",
        });
        pillX += pillWidth + 8;
      }
      if (model.typeSummaryText && pillX < contentX + contentWidth - 52) {
        ctx.save();
        ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
        const typeText = fitTextToWidthWithEllipsis(
          model.typeSummaryText,
          Math.max(72, contentWidth - (pillX - contentX) - 8),
        );
        const pillWidth = Math.max(72, Math.min(contentWidth - (pillX - contentX), Math.ceil(ctx.measureText(typeText).width) + 18));
        ctx.restore();
        drawCanvasRuntimeOverlayPill(pillX, cursorY, pillWidth, 22, typeText, {
          fillTop: "rgba(38, 57, 79, 0.96)",
          fillBottom: "rgba(25, 39, 56, 0.96)",
        });
      }
      cursorY += 30;
    }
    if (model.passiveLabel) {
      ctx.save();
      ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
      const passiveText = fitTextToWidthWithEllipsis(model.passiveLabel, contentWidth);
      ctx.restore();
      drawCanvasRuntimeOverlayText(passiveText, contentX, cursorY, {
        fontSize: 10,
        fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
        strokeStyle: "rgba(8, 16, 24, 0.74)",
      });
      cursorY += 18;
    }
    if (compactMetrics.length > 0) {
      const metricGap = 8;
      const metricWidth = Math.floor((contentWidth - metricGap * Math.max(0, compactMetrics.length - 1)) / compactMetrics.length);
      for (let index = 0; index < compactMetrics.length; index += 1) {
        const metric = compactMetrics[index];
        const boxX = contentX + index * (metricWidth + metricGap);
        const boxY = cursorY;
        const tone = String(metric.tone || "");
        const accentFillTop = tone === "accent"
          ? "rgba(63, 118, 220, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop;
        const accentFillBottom = tone === "accent"
          ? "rgba(38, 72, 151, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillBottom;
        drawRetroHudPanel(boxX, boxY, metricWidth, 44, {
          cut: 8,
          fillTop: accentFillTop,
          fillMid: accentFillTop,
          fillBottom: accentFillBottom,
          border: ZONE_UI_CANVAS_THEME.subpanel.border,
          highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
          shadow: "rgba(0, 0, 0, 0.18)",
          borderWidth: 1.1,
        });
        drawCanvasRuntimeOverlayText(metric.label, boxX + 8, boxY + 7, {
          fontSize: 9,
          fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
          strokeStyle: "rgba(8, 16, 24, 0.72)",
        });
        ctx.save();
        ctx.font = `800 11px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
        const metricValue = fitTextToWidthWithEllipsis(metric.value, metricWidth - 16);
        ctx.restore();
        drawCanvasRuntimeOverlayText(metricValue, boxX + 8, boxY + 20, {
          fontSize: 11,
          weight: "800",
        });
        if (metric.detail) {
          ctx.save();
          ctx.font = `700 8px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
          const metricDetail = fitTextToWidthWithEllipsis(metric.detail, metricWidth - 16);
          ctx.restore();
          drawCanvasRuntimeOverlayText(metricDetail, boxX + 8, boxY + 32, {
            fontSize: 8,
            fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
            strokeStyle: "rgba(8, 16, 24, 0.72)",
          });
        }
      }
    }
    return;
  }
  const width = clamp(state.viewport.width * 0.28, 276, 332);
  const headerHeight = 54;
  const badgeHeight = badges.length > 0 ? 28 : 0;
  const calloutHeight = 58 + (model.passiveDescription ? 18 : 0);
  const typeHeight = model.typeSummaryText ? 26 : 0;
  const metricRows = Math.max(1, Math.ceil(metrics.length / 2));
  const metricsHeight = metricRows * 48 + Math.max(0, metricRows - 1) * 8;
  const progressHeight = progress.length > 0 ? 58 : 0;
  const height = headerHeight + badgeHeight + calloutHeight + typeHeight + metricsHeight + progressHeight + 38;
  const rect = resolveCanvasRuntimeOverlayRect(model.anchorX, model.anchorY, width, height, layout, {
    offsetX: 16,
    offsetY: -20,
  });

  drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
    cut: 12,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.5,
  });

  const contentX = rect.x + 14;
  const contentWidth = rect.width - 28;
  let cursorY = rect.y + 12;
  ctx.save();
  ctx.font = `800 16px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const titleText = fitTextToWidthWithEllipsis(model.title, contentWidth - 8);
  ctx.restore();
  drawCanvasRuntimeOverlayText(titleText, contentX, cursorY, { fontSize: 16, weight: "800" });
  cursorY += 20;
  if (model.subtitle) {
    ctx.save();
    ctx.font = `700 11px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const subtitleText = fitTextToWidthWithEllipsis(model.subtitle, contentWidth);
    ctx.restore();
    drawCanvasRuntimeOverlayText(subtitleText, contentX, cursorY, {
      fontSize: 11,
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(8, 16, 24, 0.76)",
    });
    cursorY += 18;
  }

  if (badges.length > 0) {
    let pillX = contentX;
    for (const badge of badges.slice(0, 3)) {
      ctx.save();
      ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
      const badgeText = fitTextToWidthWithEllipsis(badge, 88);
      const pillWidth = Math.max(56, Math.min(96, Math.ceil(ctx.measureText(badgeText).width) + 18));
      ctx.restore();
      drawCanvasRuntimeOverlayPill(pillX, cursorY, pillWidth, 22, badgeText, {
        fillTop: "rgba(38, 57, 79, 0.96)",
        fillBottom: "rgba(25, 39, 56, 0.96)",
      });
      pillX += pillWidth + 8;
    }
    cursorY += 30;
  }

  drawRetroHudPanel(contentX, cursorY, contentWidth, calloutHeight, {
    cut: 10,
    fillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.subpanel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.subpanel.border,
    highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
    shadow: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1.2,
  });
  drawCanvasRuntimeOverlayText("Talent", contentX + 10, cursorY + 8, {
    fontSize: 10,
    fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
    strokeStyle: "rgba(8, 16, 24, 0.72)",
  });
  if (model.passivePill) {
    ctx.save();
    ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const pillText = fitTextToWidthWithEllipsis(model.passivePill, 96);
    const pillWidth = Math.max(62, Math.min(108, Math.ceil(ctx.measureText(pillText).width) + 18));
    ctx.restore();
    drawCanvasRuntimeOverlayPill(contentX + contentWidth - pillWidth - 10, cursorY + 6, pillWidth, 22, pillText, {
      fillTop: "rgba(64, 121, 255, 0.96)",
      fillBottom: "rgba(41, 83, 180, 0.96)",
      border: "rgba(180, 215, 255, 0.8)",
    });
  }
  drawCanvasRuntimeOverlayText(model.passiveLabel, contentX + 10, cursorY + 28, {
    fontSize: 12,
    weight: "800",
  });
  if (model.passiveDescription) {
    ctx.save();
    ctx.font = `700 10px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const passiveDescription = fitTextToWidthWithEllipsis(model.passiveDescription, contentWidth - 20);
    ctx.restore();
    drawCanvasRuntimeOverlayText(passiveDescription, contentX + 10, cursorY + 44, {
      fontSize: 10,
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(8, 16, 24, 0.72)",
    });
  }
  cursorY += calloutHeight + 10;

  if (model.typeSummaryText) {
    drawCanvasRuntimeOverlayText(model.typeSummaryText, contentX, cursorY, {
      fontSize: 11,
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(8, 16, 24, 0.74)",
    });
    cursorY += 26;
  }

  const metricWidth = Math.floor((contentWidth - 8) / 2);
  for (let index = 0; index < metrics.length; index += 1) {
    const metric = metrics[index];
    const column = index % 2;
    const row = Math.floor(index / 2);
    const boxX = contentX + column * (metricWidth + 8);
    const boxY = cursorY + row * 56;
    const tone = String(metric.tone || "");
    const accentFillTop = tone === "accent"
      ? "rgba(63, 118, 220, 0.96)"
      : tone === "danger"
        ? "rgba(136, 43, 55, 0.96)"
        : tone === "warn"
          ? "rgba(126, 91, 30, 0.96)"
          : tone === "weak"
            ? "rgba(66, 52, 96, 0.96)"
            : ZONE_UI_CANVAS_THEME.subpanel.fillTop;
    const accentFillBottom = tone === "accent"
      ? "rgba(38, 72, 151, 0.96)"
      : tone === "danger"
        ? "rgba(90, 24, 33, 0.96)"
        : tone === "warn"
          ? "rgba(92, 58, 18, 0.96)"
          : tone === "weak"
            ? "rgba(42, 31, 68, 0.96)"
            : ZONE_UI_CANVAS_THEME.subpanel.fillBottom;
    drawRetroHudPanel(boxX, boxY, metricWidth, 48, {
      cut: 8,
      fillTop: accentFillTop,
      fillMid: accentFillTop,
      fillBottom: accentFillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: "rgba(0, 0, 0, 0.18)",
      borderWidth: 1.1,
    });
    drawCanvasRuntimeOverlayText(metric.label, boxX + 8, boxY + 7, {
      fontSize: 9,
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(8, 16, 24, 0.72)",
    });
    ctx.save();
    ctx.font = `800 12px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const metricValue = fitTextToWidthWithEllipsis(metric.value, metricWidth - 16);
    ctx.restore();
    drawCanvasRuntimeOverlayText(metricValue, boxX + 8, boxY + 20, {
      fontSize: 12,
      weight: "800",
    });
    if (metric.detail) {
      ctx.save();
      ctx.font = `700 9px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
      const metricDetail = fitTextToWidthWithEllipsis(metric.detail, metricWidth - 16);
      ctx.restore();
      drawCanvasRuntimeOverlayText(metricDetail, boxX + 8, boxY + 34, {
        fontSize: 9,
        fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
        strokeStyle: "rgba(8, 16, 24, 0.72)",
      });
    }
  }
  cursorY += metricRows * 56 - 8;

  if (progress.length > 0) {
    const progressGap = 8;
    const progressWidth = Math.floor((contentWidth - progressGap * (progress.length - 1)) / progress.length);
    for (let index = 0; index < progress.length; index += 1) {
      const item = progress[index];
      const boxX = contentX + index * (progressWidth + progressGap);
      const boxY = cursorY;
      drawRetroHudPanel(boxX, boxY, progressWidth, 50, {
        cut: 8,
        fillTop: item.tone === "accent" ? "rgba(68, 122, 229, 0.96)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
        fillMid: item.tone === "accent" ? "rgba(68, 122, 229, 0.96)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
        fillBottom: item.tone === "accent" ? "rgba(42, 79, 172, 0.96)" : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
        border: ZONE_UI_CANVAS_THEME.subpanel.border,
        highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
        shadow: "rgba(0, 0, 0, 0.18)",
        borderWidth: 1.1,
      });
      drawCanvasRuntimeOverlayText(item.label, boxX + 8, boxY + 7, {
        fontSize: 9,
        fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
        strokeStyle: "rgba(8, 16, 24, 0.72)",
      });
      drawCanvasRuntimeOverlayText(item.value, boxX + 8, boxY + 20, {
        fontSize: 12,
        weight: "800",
      });
      if (item.detail) {
        ctx.save();
        ctx.font = `700 8px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
        const detailText = fitTextToWidthWithEllipsis(item.detail, progressWidth - 16);
        ctx.restore();
        drawCanvasRuntimeOverlayText(detailText, boxX + 8, boxY + 34, {
          fontSize: 8,
          fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
          strokeStyle: "rgba(8, 16, 24, 0.72)",
        });
      }
    }
  }
}

function drawCanvasRuntimeTeamContextMenu(layout, hitboxes) {
  const model = state.ui.canvasTeamContextMenuModel;
  if (!model) {
    return;
  }
  const buttonHeight = 54;
  const phoneMode = Boolean(layout?.viewportProfile?.phone);
  const width = phoneMode
    ? clamp(state.viewport.width - 24, 284, 360)
    : clamp(state.viewport.width * 0.24, 260, 308);
  const height = 62 + model.buttons.length * buttonHeight + Math.max(0, model.buttons.length - 1) * 8 + 18;
  const rect = phoneMode
    ? resolveCanvasRuntimeBottomSheetRect(width, height, layout, {
      sideInset: 12,
    })
    : resolveCanvasRuntimeOverlayRect(model.anchorX, model.anchorY, width, height, layout, {
      offsetX: 14,
      offsetY: 12,
    });
  drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
    cut: 12,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.5,
  });
  hitboxes.push({
    id: "team-context-panel",
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    interactive: false,
  });
  drawCanvasRuntimeOverlayText(model.title, rect.x + 14, rect.y + 12, {
    fontSize: 14,
    weight: "800",
  });
  let cursorY = rect.y + 40;
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  for (const button of model.buttons) {
    const isHovered = hoveredActionId === button.id && !button.disabled;
    const buttonX = rect.x + 12;
    const buttonWidth = rect.width - 24;
    drawRetroHudPanel(buttonX, cursorY, buttonWidth, buttonHeight, {
      cut: 9,
      fillTop: button.disabled
        ? "rgba(51, 59, 70, 0.9)"
        : isHovered
          ? "rgba(63, 118, 220, 0.98)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: button.disabled
        ? "rgba(51, 59, 70, 0.9)"
        : isHovered
          ? "rgba(63, 118, 220, 0.98)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillBottom: button.disabled
        ? "rgba(36, 43, 52, 0.94)"
        : isHovered
          ? "rgba(38, 72, 151, 0.98)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: isHovered ? "rgba(80, 150, 255, 0.32)" : "rgba(0, 0, 0, 0.16)",
      borderWidth: isHovered ? 1.35 : 1.1,
    });
    ctx.save();
    ctx.font = `800 12px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const label = fitTextToWidthWithEllipsis(button.label, buttonWidth - 20);
    ctx.restore();
    drawCanvasRuntimeOverlayText(label, buttonX + 10, cursorY + 10, {
      fontSize: 12,
      weight: "800",
      fillStyle: button.disabled ? "rgba(214, 225, 236, 0.72)" : ZONE_UI_CANVAS_THEME.panel.text,
    });
    if (button.meta) {
      ctx.save();
      ctx.font = `700 9px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
      const meta = fitTextToWidthWithEllipsis(button.meta, buttonWidth - 20);
      ctx.restore();
      drawCanvasRuntimeOverlayText(meta, buttonX + 10, cursorY + 28, {
        fontSize: 9,
        fillStyle: "rgba(219, 231, 241, 0.82)",
        strokeStyle: "rgba(8, 16, 24, 0.7)",
      });
    }
    hitboxes.push({
      id: button.id,
      x: buttonX,
      y: cursorY,
      width: buttonWidth,
      height: buttonHeight,
      interactive: !button.disabled,
      actionType: button.actionType,
      slotIndex: model.slotIndex,
    });
    cursorY += buttonHeight + 8;
  }
}

function drawCanvasRuntimeBallCaptureMenu(layout, hitboxes) {
  const model = state.ui.canvasBallCaptureMenuModel;
  if (!model) {
    return;
  }
  const phoneMode = Boolean(layout?.viewportProfile?.phone);
  const tabHeight = 40;
  const toggleHeight = 46;
  const width = phoneMode
    ? clamp(state.viewport.width - 24, 300, 372)
    : clamp(state.viewport.width * 0.28, 286, 344);
  const height = 78 + tabHeight + model.toggles.length * toggleHeight + Math.max(0, model.toggles.length - 1) * 8 + 22;
  const rect = phoneMode
    ? resolveCanvasRuntimeCenteredModalRect(width, height, layout, {
      sideInset: 12,
    })
    : resolveCanvasRuntimeOverlayRect(model.anchorX, model.anchorY, width, height, layout, {
      offsetX: 16,
      offsetY: 14,
    });
  drawRetroHudPanel(rect.x, rect.y, rect.width, rect.height, {
    cut: 12,
    fillTop: ZONE_UI_CANVAS_THEME.panel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.panel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.panel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.panel.border,
    highlight: ZONE_UI_CANVAS_THEME.panel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.5,
  });
  hitboxes.push({
    id: "ball-capture-panel",
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    interactive: false,
  });
  drawCanvasRuntimeOverlayText(model.title, rect.x + 14, rect.y + 12, {
    fontSize: 14,
    weight: "800",
  });
  const closeButtonSize = 24;
  const closeButtonX = rect.x + rect.width - closeButtonSize - 10;
  const closeButtonY = rect.y + 10;
  const hoveredActionId = String(state.ui.canvasOverlayHoveredActionId || "");
  const closeHovered = hoveredActionId === "ball-capture-close";
  drawRetroHudPanel(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize, {
    cut: 7,
    fillTop: closeHovered ? "rgba(63, 118, 220, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillMid: closeHovered ? "rgba(63, 118, 220, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillBottom: closeHovered ? "rgba(38, 72, 151, 0.98)" : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.subpanel.border,
    highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
    shadow: closeHovered ? "rgba(80, 150, 255, 0.28)" : "rgba(0, 0, 0, 0.14)",
    borderWidth: closeHovered ? 1.3 : 1.1,
  });
  drawCanvasRuntimeOverlayText("×", closeButtonX + closeButtonSize * 0.5, closeButtonY + closeButtonSize * 0.5, {
    fontSize: 12,
    weight: "900",
    textAlign: "center",
    textBaseline: "middle",
  });
  hitboxes.push({
    id: "ball-capture-close",
    x: closeButtonX,
    y: closeButtonY,
    width: closeButtonSize,
    height: closeButtonSize,
    interactive: true,
    actionType: "close-ball-menu",
  });
  drawCanvasRuntimeOverlayText(model.summary, rect.x + 14, rect.y + 32, {
    fontSize: 10,
    fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
    strokeStyle: "rgba(8, 16, 24, 0.72)",
  });

  const tabGap = 8;
  const tabWidth = Math.floor((rect.width - 28 - tabGap * 2) / 3);
  let cursorY = rect.y + 52;
  for (let index = 0; index < model.tabs.length; index += 1) {
    const tab = model.tabs[index];
    const tabX = rect.x + 14 + index * (tabWidth + tabGap);
    const isHovered = hoveredActionId === tab.id;
    drawRetroHudPanel(tabX, cursorY, tabWidth, tabHeight, {
      cut: 8,
      fillTop: tab.selected
        ? "rgba(63, 118, 220, 0.98)"
        : isHovered
          ? "rgba(54, 88, 147, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: tab.selected
        ? "rgba(63, 118, 220, 0.98)"
        : isHovered
          ? "rgba(54, 88, 147, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillBottom: tab.selected
        ? "rgba(38, 72, 151, 0.98)"
        : isHovered
          ? "rgba(39, 64, 108, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: isHovered || tab.selected ? "rgba(80, 150, 255, 0.28)" : "rgba(0, 0, 0, 0.16)",
      borderWidth: tab.selected ? 1.35 : 1.1,
    });
    drawCanvasRuntimeOverlayText(tab.label, tabX + tabWidth * 0.5, cursorY + 11, {
      fontSize: 10,
      weight: "800",
      textAlign: "center",
    });
    drawCanvasRuntimeOverlayText(formatCompactNumber(tab.count), tabX + tabWidth * 0.5, cursorY + 24, {
      fontSize: 10,
      textAlign: "center",
      fillStyle: ZONE_UI_CANVAS_THEME.panel.textSoft,
      strokeStyle: "rgba(8, 16, 24, 0.72)",
    });
    hitboxes.push({
      id: tab.id,
      x: tabX,
      y: cursorY,
      width: tabWidth,
      height: tabHeight,
      interactive: true,
      actionType: "ball-tab",
      ballType: tab.ballType,
    });
  }
  cursorY += tabHeight + 12;

  for (const toggle of model.toggles) {
    const rowX = rect.x + 14;
    const rowWidth = rect.width - 28;
    const isHovered = hoveredActionId === toggle.id;
    drawRetroHudPanel(rowX, cursorY, rowWidth, toggleHeight, {
      cut: 9,
      fillTop: toggle.enabled
        ? "rgba(44, 107, 74, 0.96)"
        : isHovered
          ? "rgba(54, 88, 147, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillMid: toggle.enabled
        ? "rgba(44, 107, 74, 0.96)"
        : isHovered
          ? "rgba(54, 88, 147, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillTop,
      fillBottom: toggle.enabled
        ? "rgba(27, 74, 49, 0.98)"
        : isHovered
          ? "rgba(39, 64, 108, 0.96)"
          : ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
      border: ZONE_UI_CANVAS_THEME.subpanel.border,
      highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
      shadow: isHovered || toggle.enabled ? "rgba(80, 150, 255, 0.24)" : "rgba(0, 0, 0, 0.16)",
      borderWidth: isHovered || toggle.enabled ? 1.3 : 1.1,
    });
    drawCanvasRuntimeOverlayPill(rowX + 8, cursorY + 11, 28, 24, toggle.enabled ? "ON" : "OFF", {
      fillTop: toggle.enabled ? "rgba(89, 205, 138, 0.98)" : "rgba(90, 103, 120, 0.96)",
      fillBottom: toggle.enabled ? "rgba(52, 148, 98, 0.98)" : "rgba(56, 66, 82, 0.96)",
      border: toggle.enabled ? "rgba(208, 252, 222, 0.86)" : "rgba(187, 198, 214, 0.62)",
    });
    ctx.save();
    ctx.font = `800 11px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
    const label = fitTextToWidthWithEllipsis(toggle.label, rowWidth - 54);
    ctx.restore();
    drawCanvasRuntimeOverlayText(label, rowX + 44, cursorY + 9, {
      fontSize: 11,
      weight: "800",
    });
    if (toggle.description) {
      ctx.save();
      ctx.font = `700 9px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
      const description = fitTextToWidthWithEllipsis(toggle.description, rowWidth - 54);
      ctx.restore();
      drawCanvasRuntimeOverlayText(description, rowX + 44, cursorY + 25, {
        fontSize: 9,
        fillStyle: "rgba(219, 231, 241, 0.82)",
        strokeStyle: "rgba(8, 16, 24, 0.7)",
      });
    }
    hitboxes.push({
      id: toggle.id,
      x: rowX,
      y: cursorY,
      width: rowWidth,
      height: toggleHeight,
      interactive: true,
      actionType: "ball-rule",
      ruleKey: toggle.ruleKey,
    });
    cursorY += toggleHeight + 8;
  }
}

function drawCanvasRuntimeOverlays(layout) {
  state.ui.canvasOverlayActionHitboxes = [];
  const hitboxes = [];
  if (layout?.layoutMode === "desktopLandscape") {
    drawCanvasRuntimeDesktopShell(hitboxes);
    drawCanvasRuntimeZoneActions(hitboxes);
    drawCanvasRuntimeHoverPopup(layout);
    drawCanvasRuntimeTeamContextMenu(layout, hitboxes);
    drawCanvasRuntimeBallCaptureMenu(layout, hitboxes);
    state.ui.canvasOverlayActionHitboxes = hitboxes;
    return;
  }
  if (layout?.layoutMode === "mobilePortrait" || layout?.viewportProfile?.phone) {
    drawCanvasRuntimeMobileShell(hitboxes);
    drawCanvasRuntimeZoneActions(hitboxes);
    drawCanvasRuntimeHoverPopup(layout);
    drawCanvasRuntimeTeamContextMenu(layout, hitboxes);
    drawCanvasRuntimeBallCaptureMenu(layout, hitboxes);
  }
  state.ui.canvasOverlayActionHitboxes = hitboxes;
}

function drawBattleUiOverlay(layout, options = {}) {
  const allowOverflowPositions = shouldAllowDevLayoutOverflowPositions();
  if (options.showEnemyUi && state.enemy) {
    drawEnemyHpBar(
      state.enemy,
      layout.centerX,
      layout.hpBarY,
      layout.hpBarWidth,
      layout.hpBarHeight,
      { allowOverflow: allowOverflowPositions },
    );
    const viewportProfile = layout.viewportProfile || {};
    const isPhoneViewport = Boolean(viewportProfile.phone);
    const isCompactViewport = Boolean(viewportProfile.compact);
    const enemyNameCard = drawNameAndLevel(state.enemy, layout.centerX, layout.enemyNameTopY, {
      enemy: true,
      maxWidth: layout.enemyNamePlateWidth,
      nameFontSize: isPhoneViewport ? 16 : isCompactViewport ? 18 : 20,
      levelFontSize: isPhoneViewport ? 11 : isCompactViewport ? 12 : 13,
      allowOverflow: allowOverflowPositions,
    });
    const enemyTypeHudY = Math.max(
      Number(layout.enemyTypeHudY) || 0,
      Number(enemyNameCard?.bottom || layout.enemyNameTopY) + 14,
    );
    drawEnemyDefensiveTypeHud(state.enemy, {
      ...layout,
      enemyTypeHudY,
    }, {
      allowOverflow: allowOverflowPositions,
    });
  }

  for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
    const member = state.team[i];
    const slot = layout.teamSlots[i];
    if (!member || !slot) {
      continue;
    }
    const viewportProfile = layout.viewportProfile || {};
    const isPhoneViewport = Boolean(viewportProfile.phone);
    const isCompactViewport = Boolean(viewportProfile.compact);
    const nameCard = drawNameAndLevel(member, slot.hudCenterX, slot.hudTopY, {
      maxWidth: slot.hudWidth,
      nameFontSize: isPhoneViewport ? 9 : isCompactViewport ? 15 : 19,
      levelFontSize: isPhoneViewport ? 7 : isCompactViewport ? 11 : 13,
      allowOverflow: allowOverflowPositions,
    });
    drawTeamTypeHud(member, i, {
      ...slot,
      hudCenterX: nameCard?.centerX ?? slot.hudCenterX,
      hudTopY: nameCard?.y ?? slot.hudTopY,
    }, state.enemy, {
      allowOverflow: allowOverflowPositions,
    });
    drawTeamXpBar(member, i, nameCard?.centerX ?? slot.hudCenterX, (nameCard?.bottom ?? slot.hudTopY) + 4, {
      width: Math.max(40, (nameCard?.width ?? slot.hudWidth) - 16),
      height: isPhoneViewport ? 3.5 : isCompactViewport ? 4.4 : 5.2,
      allowOverflow: allowOverflowPositions,
    });
  }
}

function getBottomHudSafeEdge(layout = state.layout) {
  const viewportHeight = Math.max(0, Number(state.viewport?.height) || 0);
  if (viewportHeight <= 0) {
    return 0;
  }

  const viewportProfile = layout?.viewportProfile || {};
  const margin = viewportProfile.phone ? 6 : 8;
  return clamp(viewportHeight - margin, 24, viewportHeight);
}

function drawVersionOverlay() {
  const layout = state.layout;
  const viewportProfile = layout?.viewportProfile || {};
  const label = `v${DISPLAY_APP_VERSION}`;
  const fontSize = viewportProfile.phone ? 11 : state.viewport.width <= 760 ? 10 : 11;
  const paddingX = 8;
  const paddingY = 5;
  const x = viewportProfile.phone ? 8 : 12;
  const bottom = getBottomHudSafeEdge(layout);

  ctx.save();
  ctx.font = `700 ${fontSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const textWidth = Math.ceil(ctx.measureText(label).width);
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;
  const y = bottom - pillHeight;
  drawRetroHudPanel(x, y, pillWidth, pillHeight, {
    cut: 8,
    fillTop: ZONE_UI_CANVAS_THEME.debugPill.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.debugPill.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.debugPill.fillBottom,
    border: ZONE_UI_CANVAS_THEME.debugPill.border,
    highlight: ZONE_UI_CANVAS_THEME.debugPill.highlight,
    shadow: ZONE_UI_CANVAS_THEME.panel.shadow,
    borderWidth: 1.3,
    pill: true,
    radius: pillHeight * 0.5,
  });
  ctx.fillStyle = ZONE_UI_CANVAS_THEME.debugPill.text;
  ctx.fillText(label, x + paddingX, bottom - paddingY);
  ctx.restore();

  drawFpsOverlay(layout, bottom);
}

function drawFpsOverlay(layout = state.layout, bottomLimit = null) {
  const frameMs = Number(state.performance?.renderFrameMsEma) || Number(state.performance?.shortFrameMsEma) || TARGET_FRAME_MS;
  const fps = Math.round(1000 / Math.max(1, frameMs));
  const label = `${fps} FPS`;
  const viewportProfile = layout?.viewportProfile || {};
  const fontSize = viewportProfile.phone ? 11 : state.viewport.width <= 760 ? 10 : 11;
  const paddingX = 7;
  const paddingY = 5;
  const margin = viewportProfile.phone ? 8 : 12;

  ctx.save();
  ctx.font = `700 ${fontSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const textWidth = Math.ceil(ctx.measureText(label).width);
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;
  const right = Math.max(8, state.viewport.width - margin);
  const maxBottom = Math.max(8, state.viewport.height - (viewportProfile.phone ? 6 : 8));
  const bottom = Number.isFinite(bottomLimit) ? Math.min(maxBottom, bottomLimit) : Math.min(maxBottom, getBottomHudSafeEdge(layout));
  const x = right - pillWidth;
  const y = bottom - pillHeight;
  drawRetroHudPanel(x, y, pillWidth, pillHeight, {
    cut: 7,
    fillTop: ZONE_UI_CANVAS_THEME.debugPill.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.debugPill.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.debugPill.fillBottom,
    border: ZONE_UI_CANVAS_THEME.debugPill.border,
    highlight: ZONE_UI_CANVAS_THEME.debugPill.highlight,
    shadow: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1.2,
    pill: true,
    radius: pillHeight * 0.5,
  });
  ctx.fillStyle = ZONE_UI_CANVAS_THEME.debugPill.text;
  ctx.fillText(label, right - paddingX, bottom - paddingY);
  ctx.restore();
}

function render() {
  const { width, height } = state.viewport;
  ctx.clearRect(0, 0, width, height);

  if (state.mode === "loading") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    return;
  }
  if (state.mode === "error") {
    drawLoadingOrError(state.error || "Erreur de chargement");
    drawVersionOverlay();
    return;
  }

  const layout = refreshLayoutIfNeeded({ nowMs: state.timeMs });
  const forceUltraShinyAll = shouldForceUltraShinyAllPokemon();
  const routeCombatEnabled = isCurrentRouteCombatEnabled();
  const hasTeamMembers = state.team.length > 0;
  const koTransition = state.battle ? state.battle.getKoTransition() : null;
  const enemyHitPulse = state.battle ? state.battle.getEnemyHitPulseRatio() : 0;
  const enemyEnterAnim = state.battle ? state.battle.getEnemyEnterAnimationState() : null;
  const captureSequence = state.battle ? state.battle.getCaptureSequenceState() : null;
  const captureSnapshot = state.battle ? state.battle.getCaptureSequence() : null;
  const capturePhase = captureSnapshot?.phase || null;
  const captureEnemyVisual = getCaptureEnemyVisual(captureSequence, capturePhase);
  const enemyDamageTintBlend = state.battle ? state.battle.getEnemyDamageFlashBlend() : 0;
  const routeDefeatTimer = state.battle ? state.battle.getEnemyTimerState() : null;
  const environmentSnapshot = getEnvironmentSnapshotForRender();

  drawBackground(width, height);
  drawEnvironmentBackgroundLayer(width, height, environmentSnapshot);
  if (hasTeamMembers) {
    const teamSpriteScale = getTeamSpriteScale(layout);
    const enemySpriteSize = getEnemySpriteRenderSize(layout, layout.enemySize);
    const teamDrawPositions = [];
    const teamAuraAttackBonusBySlot = getTeamAuraAttackBonusBySlot(state.team);
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const slot = layout.teamSlots[i];
      if (!slot) {
        continue;
      }
      const member = state.team[i];
      const recoilOffset = state.battle ? state.battle.getSlotRecoilOffset(i, layout) : { x: 0, y: 0 };
      const hoverPulse = getHoveredTeamSlotPulse(i);
      const chargeGlow = state.battle ? state.battle.getSlotChargeGlow(i) : 0;
      const teleportScale = state.battle ? state.battle.getSlotTeleportScale(i) : 1;
      const skipTurnVisual = state.battle ? state.battle.getSlotSkipTurnVisual(i) : null;
      const spriteSize = slot.size * teamSpriteScale;
      const hoverLift = hoverPulse > 0 ? slot.size * (0.045 + hoverPulse * 0.01) : 0;
      const drawX = slot.x + recoilOffset.x + Number(skipTurnVisual?.offsetX || 0);
      const drawY = slot.y + recoilOffset.y + Number(skipTurnVisual?.offsetY || 0) - hoverLift;
      const teamBreath = member
        ? getPokemonBreathTransform(member, spriteSize, i, { active: true })
        : { scaleX: 1, scaleY: 1, offsetY: 0 };
      teamDrawPositions[i] = {
        x: drawX,
        y: drawY,
        size: spriteSize,
        breath: teamBreath,
        hoverPulse,
        chargeGlow,
        teleportScale,
        skipScaleX: Number(skipTurnVisual?.scaleX || 1),
        skipScaleY: Number(skipTurnVisual?.scaleY || 1),
        skipGrayscaleBlend: clamp(Number(skipTurnVisual?.grayscaleBlend || 0), 0, 1),
        hoverScale: hoverPulse > 0 ? 1.03 + hoverPulse * 0.015 : 1,
        chargeScale: chargeGlow > 0 ? 1 + chargeGlow * 0.042 : 1,
      };
    }

    let enemyRenderState = null;
    if (state.enemy) {
      const isKo = koTransition?.active;
      const shrinkProgress = isKo ? koTransition?.shrink_progress || 0 : 0;
      const shrinkActive = Boolean(koTransition?.shrink_active);
      const enterActive = Boolean(enemyEnterAnim?.active);
      const enterOffsetX = Number(enemyEnterAnim?.offset_x || 0);
      const enterRotationRad = Number(enemyEnterAnim?.rotation_rad || 0);
      const enterAlpha = clamp(Number(enemyEnterAnim?.alpha ?? 1), 0, 1);
      const enemyBreath = getPokemonBreathTransform(
        state.enemy,
        enemySpriteSize,
        -1,
        {
          active: !captureSequence && !isKo && !enterActive,
        },
      );
      const defaultEnemyScale = isKo
        ? (shrinkActive ? clamp(1 - shrinkProgress * 0.96, 0.04, 1) : 0)
        : 1 + enemyHitPulse * 0.06;
      const defaultEnemyAlpha = (
        isKo
          ? (shrinkActive ? clamp(1 - shrinkProgress * 0.85, 0.12, 1) : 0)
          : 1
      ) * enterAlpha;
      const enemyScale = captureSequence ? captureEnemyVisual.scale : defaultEnemyScale;
      const enemyAlpha = captureSequence ? captureEnemyVisual.alpha : defaultEnemyAlpha;
      const enemyVisible = captureSequence ? captureEnemyVisual.visible : enemyAlpha > 0.01 && enemyScale > 0.01;
      enemyRenderState = {
        visible: enemyVisible,
        alpha: enemyAlpha,
        scaleX: enemyScale * enemyBreath.scaleX,
        scaleY: enemyScale * enemyBreath.scaleY,
        offsetX: enterOffsetX,
        offsetY: enemyBreath.offsetY,
        rotationRad: enterRotationRad,
      };
    }

    if (enemyRenderState?.visible) {
      drawPokemonBackdropCircle(layout.centerX, layout.centerY, enemySpriteSize);
    }
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const member = state.team[i];
      const slot = layout.teamSlots[i];
      const drawPosition = teamDrawPositions[i];
      if (!member || !slot) {
        continue;
      }
      const hoverPulse = getHoveredTeamSlotPulse(i);
      const chargeGlow = clamp(Number(drawPosition?.chargeGlow || 0), 0, 1);
      const spriteSize = slot.size * teamSpriteScale;
      const auraBonus = Math.max(0, Number(teamAuraAttackBonusBySlot[i] || 0));
      const teleportBoostMultiplier = state.battle ? state.battle.getTeleportDamageBoostForSlot(i) : 1;
      const teleportBoostVisualIntensity = state.battle
        ? state.battle.getTeleportBoostVisualIntensityForSlot(i)
        : 0;
      drawPokemonBackdropCircle(slot.x, slot.y, spriteSize, {
        alpha: POKEMON_BACKDROP_ALPHA + hoverPulse * 0.11 + chargeGlow * 0.14,
      });
      if (auraBonus > 0.001) {
        drawTeamAuraIndicator(slot, member, auraBonus);
      }
      if (teleportBoostMultiplier > 1.001 || teleportBoostVisualIntensity > 0.001) {
        drawTeamTeleportBoostIndicator(slot, teleportBoostMultiplier, teleportBoostVisualIntensity);
      }
      if (chargeGlow > 0.001) {
        drawTeamAttackChargeGlow(slot, member, i, chargeGlow);
      }
      if (hoverPulse > 0) {
        drawTeamHoverIndicator(slot, hoverPulse);
      }
    }

    drawProjectiles(state.battle ? state.battle.getProjectiles() : []);
    if (!captureSequence) {
      drawEnemyKoEffect(layout, koTransition);
    }

    if (state.enemy && enemyRenderState?.visible) {
        drawPokemonSprite(state.enemy, layout.centerX, layout.centerY, enemySpriteSize, {
          alpha: enemyRenderState.alpha,
          scaleX: enemyRenderState.scaleX,
          scaleY: enemyRenderState.scaleY,
          offsetX: enemyRenderState.offsetX,
          offsetY: enemyRenderState.offsetY,
          rotationRad: enemyRenderState.rotationRad,
          shadowProfile: "enemy",
          shadowAlpha: 0.58,
          shinyVisual: Boolean(forceUltraShinyAll || state.enemy.isShiny || state.enemy.isShinyVisual),
          ultraShinyVisual: Boolean(forceUltraShinyAll || state.enemy.isUltraShiny || state.enemy.isUltraShinyVisual),
          tintBlend: enemyDamageTintBlend,
          tintColor: [255, 84, 84],
        });
    }

    drawEnemyHitEffects(state.battle ? state.battle.getHitEffects() : []);
    drawCaptureSequence(layout, captureSequence, capturePhase);

    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const member = state.team[i];
      const slot = layout.teamSlots[i];
      const drawPosition = teamDrawPositions[i];
      if (!slot) {
        continue;
      }
      if (!member) {
        drawEmptyTeamSlot(slot);
        continue;
      }
      if (!drawPosition) {
        continue;
      }
      const teamBreath = drawPosition.breath || { scaleX: 1, scaleY: 1, offsetY: 0 };
      const hoverScale = drawPosition.hoverScale || 1;
      const chargeScale = drawPosition.chargeScale || 1;
      const teleportScale = drawPosition.teleportScale || 1;
      const skipScaleX = drawPosition.skipScaleX || 1;
      const skipScaleY = drawPosition.skipScaleY || 1;
      const skipGrayscaleBlend = clamp(Number(drawPosition.skipGrayscaleBlend || 0), 0, 1);
      const skipShader = skipGrayscaleBlend > 0.001
        ? {
            saturate: lerpNumber(1, 0, skipGrayscaleBlend),
            brightness: lerpNumber(1, 0.82, skipGrayscaleBlend),
            contrast: lerpNumber(1, 1.08, skipGrayscaleBlend),
          }
        : null;
      const memberShader = member?.spriteShader && typeof member.spriteShader === "object" ? member.spriteShader : null;
      drawPokemonSprite(member, drawPosition.x, drawPosition.y, drawPosition.size || slot.size, {
        scaleX: teamBreath.scaleX * hoverScale * chargeScale * teleportScale * skipScaleX,
        scaleY: teamBreath.scaleY * hoverScale * chargeScale * teleportScale * skipScaleY,
        offsetY: teamBreath.offsetY,
        shadowProfile: "team",
        shadowAlpha: 0.52,
        flipX: shouldFlipTeamSprite(i),
        shinyVisual: Boolean(forceUltraShinyAll || member.isShiny || member.isShinyVisual),
        ultraShinyVisual: Boolean(forceUltraShinyAll || member.isUltraShiny || member.isUltraShinyVisual),
        tintBlend: state.battle ? state.battle.getSlotAttackFlashBlend(i) : 0,
        tintColor: [255, 255, 255],
        shader: skipShader ? mergeSpriteShaderConfig(memberShader, skipShader) : null,
      });
    }
    drawLasers(state.battle ? state.battle.getLasers() : []);
    drawTeamDragSwapOverlay(layout);

    if (!captureSequence) {
      drawTeamXpGainEffects();
      drawTeamLevelUpEffects();
    }
    drawFloatingDamageTexts(state.battle ? state.battle.getFloatingTexts() : []);
    drawBattleUiOverlay(layout, {
      showEnemyUi: Boolean(state.enemy) && !koTransition?.active && !captureSequence,
      teamDrawPositions,
    });
  }
  drawEnvironmentForegroundLayer(width, height, environmentSnapshot);
  drawLegendaryFieldScreenVfx(width, height, state.team);
  drawRouteDefeatTimerBar(routeDefeatTimer, layout);
  drawEvolutionAnimationOverlay(layout);
  drawBallInventoryOverlay(layout);
  drawCanvasRuntimeOverlays(layout);
  drawVersionOverlay();
}

  const stateRef = state;
  const runtimeSystem = {
    getBattleViewportProfile,
    getTeamSpriteScale,
    getEnemySpriteRenderSize,
    computeLayout,
    refreshLayoutIfNeeded,
    render,
  };
  const enrichLayout = (layout) => enrichRuntimeLayout(layout, { viewport: stateRef?.viewport });

  return {
    ...runtimeSystem,
    getBattleViewportProfile(width, height) {
      return enrichViewportProfile(runtimeSystem.getBattleViewportProfile(width, height));
    },
    getProductLayoutMode(width, height) {
      return resolveProductLayoutMode(runtimeSystem.getBattleViewportProfile(width, height));
    },
    computeLayout() {
      return enrichLayout(runtimeSystem.computeLayout());
    },
    refreshLayoutIfNeeded(systemOptions = {}) {
      const nextLayout = enrichLayout(runtimeSystem.refreshLayoutIfNeeded(systemOptions));
      if (stateRef && stateRef.layout === nextLayout) {
        stateRef.layoutMode = nextLayout.layoutMode;
      } else if (stateRef && stateRef.layout && nextLayout) {
        stateRef.layout = nextLayout;
        stateRef.layoutMode = nextLayout.layoutMode;
      }
      return nextLayout;
    },
  };
}
