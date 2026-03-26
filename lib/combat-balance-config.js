import { Easing } from "../vendor/tween.js";
import { GAME_DESIGN } from "./game-design-config-runtime.js";

export const TEAM_LEFT_SIDE_SLOT_INDEXES = new Set([0, 4, 5]);
export const MAX_TEAM_SIZE = 6;
export const TALENT_KEEN_EYE_ID = "KEEN_EYE";
export const TALENT_VALIANT_EYE_ID = "VALIANT_EYE";
export const TALENT_MORPHING_ID = "MORPHING";
export const TALENT_MIND_CONTROL_ID = "MIND_CONTROL";
export const TALENT_ORIGIN_MIMICRY_ID = "ORIGIN_MIMICRY";
export const TALENT_OVERGROW_ID = "OVERGROW";
export const TALENT_OVERGROW_PLUS_ID = "OVERGROW_PLUS";
export const TALENT_OVERGROW_PLUS_PLUS_ID = "OVERGROW_PLUS_PLUS";
export const TALENT_BLAZE_ID = "BLAZE";
export const TALENT_BLAZE_PLUS_ID = "BLAZE_PLUS";
export const TALENT_BLAZE_PLUS_PLUS_ID = "BLAZE_PLUS_PLUS";
export const TALENT_TORRENT_ID = "TORRENT";
export const TALENT_TORRENT_PLUS_ID = "TORRENT_PLUS";
export const TALENT_TORRENT_PLUS_PLUS_ID = "TORRENT_PLUS_PLUS";
export const TALENT_ELECTRIC_FIELD_ID = "ELECTRIC_FIELD";
export const TALENT_ARDENT_FIELD_ID = "ARDENT_FIELD";
export const TALENT_ARCTIC_FIELD_ID = "ARCTIC_FIELD";
export const TALENT_JACKPOT_ID = "JACKPOT";
export const TALENT_JACKPOT_PLUS_ID = "JACKPOT_PLUS";
export const TALENT_TELEPORT_ID = "TELEPORT";
export const TALENT_TELEPORT_PLUS_ID = "TELEPORT_PLUS";
export const TALENT_TELEPORT_PLUS_PLUS_ID = "TELEPORT_PLUS_PLUS";
export const TALENT_LEGENDARY_FIELD_ATTACK_BONUS = GAME_DESIGN.combat.talents.legendaryFieldAttackBonus;
export const TALENT_LEGENDARY_FIELD_ATTACK_INTERVAL_MULTIPLIER =
  GAME_DESIGN.combat.talents.legendaryFieldAttackIntervalMultiplier;
export const TALENT_AURA_PROVIDER_BY_ID = Object.freeze({
  [TALENT_OVERGROW_ID]: Object.freeze({ offensiveType: "grass", attackBonus: 0.05 }),
  [TALENT_OVERGROW_PLUS_ID]: Object.freeze({ offensiveType: "grass", attackBonus: 0.1 }),
  [TALENT_OVERGROW_PLUS_PLUS_ID]: Object.freeze({ offensiveType: "grass", attackBonus: 0.15 }),
  [TALENT_BLAZE_ID]: Object.freeze({ offensiveType: "fire", attackBonus: 0.05 }),
  [TALENT_BLAZE_PLUS_ID]: Object.freeze({ offensiveType: "fire", attackBonus: 0.1 }),
  [TALENT_BLAZE_PLUS_PLUS_ID]: Object.freeze({ offensiveType: "fire", attackBonus: 0.15 }),
  [TALENT_TORRENT_ID]: Object.freeze({ offensiveType: "water", attackBonus: 0.05 }),
  [TALENT_TORRENT_PLUS_ID]: Object.freeze({ offensiveType: "water", attackBonus: 0.1 }),
  [TALENT_TORRENT_PLUS_PLUS_ID]: Object.freeze({ offensiveType: "water", attackBonus: 0.15 }),
  [TALENT_ELECTRIC_FIELD_ID]: Object.freeze({
    offensiveType: "electric",
    attackBonus: TALENT_LEGENDARY_FIELD_ATTACK_BONUS,
    includeSelf: true,
  }),
  [TALENT_ARDENT_FIELD_ID]: Object.freeze({
    offensiveType: "fire",
    attackBonus: TALENT_LEGENDARY_FIELD_ATTACK_BONUS,
    includeSelf: true,
  }),
  [TALENT_ARCTIC_FIELD_ID]: Object.freeze({
    offensiveType: "ice",
    attackBonus: TALENT_LEGENDARY_FIELD_ATTACK_BONUS,
    includeSelf: true,
  }),
});
export const TALENT_LEGENDARY_FIELD_IDS = new Set([
  TALENT_ELECTRIC_FIELD_ID,
  TALENT_ARDENT_FIELD_ID,
  TALENT_ARCTIC_FIELD_ID,
]);
export const LEGENDARY_FIELD_VFX_THEME_BY_KEY = Object.freeze({
  electric: Object.freeze({
    key: "electric",
    edgeColor: [132, 228, 255],
    pulseColor: [202, 245, 255],
    edgeAlpha: 0.36,
    particleColor: [188, 241, 255],
  }),
  ardent: Object.freeze({
    key: "ardent",
    edgeColor: [255, 126, 78],
    pulseColor: [255, 206, 120],
    edgeAlpha: 0.35,
    particleColor: [255, 182, 132],
  }),
  arctic: Object.freeze({
    key: "arctic",
    edgeColor: [168, 234, 255],
    pulseColor: [228, 249, 255],
    edgeAlpha: 0.34,
    particleColor: [216, 245, 255],
  }),
});
export const TALENT_ALWAYS_HIT_IDS = new Set([TALENT_KEEN_EYE_ID, TALENT_VALIANT_EYE_ID]);
export const TALENT_CRIT_BONUS_CHANCE_BY_ID = Object.freeze({
  [TALENT_VALIANT_EYE_ID]: GAME_DESIGN.combat.talents.critBonusChanceById.VALIANT_EYE,
});
export const TALENT_MONEY_MULTIPLIER_BY_ID = Object.freeze({
  [TALENT_JACKPOT_ID]: GAME_DESIGN.combat.talents.moneyMultiplierById.JACKPOT,
  [TALENT_JACKPOT_PLUS_ID]: GAME_DESIGN.combat.talents.moneyMultiplierById.JACKPOT_PLUS,
});
export const TALENT_TELEPORT_SWAP_CHANCE_BY_ID = Object.freeze({
  [TALENT_TELEPORT_ID]: GAME_DESIGN.combat.talents.teleportSwapChanceById.TELEPORT,
  [TALENT_TELEPORT_PLUS_ID]: GAME_DESIGN.combat.talents.teleportSwapChanceById.TELEPORT_PLUS,
  [TALENT_TELEPORT_PLUS_PLUS_ID]: GAME_DESIGN.combat.talents.teleportSwapChanceById.TELEPORT_PLUS_PLUS,
});
export const TALENT_TELEPORT_PLUS_PLUS_DAMAGE_MULTIPLIER =
  GAME_DESIGN.combat.talents.teleportPlusPlusDamageMultiplier;
export const MORPHING_REFERENCE_POKEMON_ID = 132;
export const MORPHING_COLORIZE_FALLBACK_RGB = Object.freeze([214, 186, 228]);
export const MORPHING_DITTO_PALETTE_STOPS = Object.freeze([
  Object.freeze({ stop: 0, rgb: Object.freeze([150, 128, 183]) }),
  Object.freeze({ stop: 0.36, rgb: Object.freeze([177, 156, 206]) }),
  Object.freeze({ stop: 0.72, rgb: Object.freeze([204, 188, 228]) }),
  Object.freeze({ stop: 1, rgb: Object.freeze([233, 223, 246]) }),
]);
export const MORPHING_SHADER_CONFIG = Object.freeze({
  hueRotateDeg: -2,
  saturate: 1.03,
  brightness: 1.03,
  contrast: 1.06,
  paletteKind: "metamorph",
  paletteStrength: 0.76,
  colorizeBlend: 0.1,
});
export const SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG = Object.freeze({
  invert: 1,
  contrast: 1.08,
  brightness: 1.04,
  saturate: 0.92,
});
export const BASE_STEP_MS = GAME_DESIGN.combat.baseStepMs;
export const ATTACK_INTERVAL_MS = GAME_DESIGN.combat.attackIntervalMs;
export const ATTACK_CRIT_CHANCE = GAME_DESIGN.combat.attackCritChance;
export const ATTACK_MISS_CHANCE = GAME_DESIGN.combat.attackMissChance;
export const ATTACK_CRIT_MULTIPLIER = GAME_DESIGN.combat.attackCritMultiplier;
export const STARTER_LEVEL = GAME_DESIGN.combat.starterLevel;
export const PROJECTILE_SPEED_PX_PER_SECOND = GAME_DESIGN.combat.projectile.speedPxPerSecond;
export const PROJECTILE_TWEEN_DURATION_MIN_MS = GAME_DESIGN.combat.projectile.tweenDurationMinMs;
export const PROJECTILE_TWEEN_DURATION_MAX_MS = GAME_DESIGN.combat.projectile.tweenDurationMaxMs;
export const PROJECTILE_TWEEN_ARC_BASE_PX = GAME_DESIGN.combat.projectile.tweenArcBasePx;
export const PROJECTILE_TWEEN_ARC_RANDOM_PX = GAME_DESIGN.combat.projectile.tweenArcRandomPx;
export const LASER_TICK_INTERVAL_MULTIPLIER = GAME_DESIGN.combat.laser.tickIntervalMultiplier;
export const LASER_TICK_JITTER_MS = GAME_DESIGN.combat.laser.tickJitterMs;
export const LASER_DAMAGE_PER_TICK_DIVISOR = GAME_DESIGN.combat.laser.damagePerTickDivisor;
export const DAMAGE_SCALE = GAME_DESIGN.combat.damageScale;
export const DAMAGE_LEVEL_PROGRESSION_EXPONENT = GAME_DESIGN.combat.damageLevelProgressionExponent;
export const KO_RESPAWN_DELAY_MS = GAME_DESIGN.combat.timings.koRespawnDelayMs;
export const KO_ANIMATION_DURATION_MS = GAME_DESIGN.combat.timings.koAnimationDurationMs;
export const ENEMY_ENTER_ANIM_DURATION_MS = GAME_DESIGN.combat.timings.enemyEnterAnimDurationMs;
export const ENEMY_ENTER_ANIM_OFFSET_PX = GAME_DESIGN.combat.timings.enemyEnterAnimOffsetPx;
export const ENEMY_ENTER_ANIM_ROTATION_DEG = GAME_DESIGN.combat.timings.enemyEnterAnimRotationDeg;
export const ENEMY_ENTER_ANIM_FADE_RATIO = GAME_DESIGN.combat.timings.enemyEnterAnimFadeRatio;
export const ENEMY_ENTER_ANIM_ROTATE_RATIO = GAME_DESIGN.combat.timings.enemyEnterAnimRotateRatio;
export const ATTACK_FLASH_DURATION_MS = GAME_DESIGN.combat.timings.attackFlashDurationMs;
export const ATTACK_FLASH_WHITE_BLEND = GAME_DESIGN.combat.timings.attackFlashWhiteBlend;
export const SKIP_TURN_EFFECT_DURATION_MIN_MS = GAME_DESIGN.combat.timings.skipTurnEffectDurationMinMs;
export const SKIP_TURN_EFFECT_DURATION_MAX_MS = GAME_DESIGN.combat.timings.skipTurnEffectDurationMaxMs;
export const SKIP_TURN_EFFECT_FADE_RATIO = GAME_DESIGN.combat.timings.skipTurnEffectFadeRatio;
export const SKIP_TURN_EFFECT_GRAYSCALE_MAX = GAME_DESIGN.combat.timings.skipTurnEffectGrayscaleMax;
export const ATTACK_CHARGE_MIN_WINDOW_MS = GAME_DESIGN.combat.timings.attackChargeMinWindowMs;
export const ATTACK_CHARGE_WINDOW_RATIO = GAME_DESIGN.combat.timings.attackChargeWindowRatio;
export const TELEPORT_SWAP_SCALE_DURATION_MS = GAME_DESIGN.combat.timings.teleportSwapScaleDurationMs;
export const ENEMY_DAMAGE_FLASH_DURATION_MS = GAME_DESIGN.combat.timings.enemyDamageFlashDurationMs;
export const ENEMY_DAMAGE_FLASH_RED_BLEND = GAME_DESIGN.combat.timings.enemyDamageFlashRedBlend;
export const FLOATING_TEXT_LIFETIME_MS = GAME_DESIGN.combat.floatingText.lifetimeMs;
export const FLOATING_TEXT_ENTER_TWEEN_MS = GAME_DESIGN.combat.floatingText.enterTweenMs;
export const FLOATING_TEXT_EXIT_TWEEN_MS = GAME_DESIGN.combat.floatingText.exitTweenMs;
export const FLOATING_TEXT_TONE_MISS = "miss";
export const FLOATING_TEXT_TONE_RESIST = "resist";
export const FLOATING_TEXT_TONE_NORMAL = "normal";
export const FLOATING_TEXT_TONE_SUPER = "super";
export const FLOATING_TEXT_TONE_CRITICAL = "critical";
export const FLOATING_TEXT_TONE_PALETTES = Object.freeze({
  [FLOATING_TEXT_TONE_MISS]: Object.freeze({
    main: [158, 166, 180],
    secondary: [130, 139, 153],
    label: [216, 222, 232],
    alpha: 0.74,
  }),
  [FLOATING_TEXT_TONE_RESIST]: Object.freeze({
    main: [134, 129, 182],
    secondary: [111, 133, 172],
    label: [206, 216, 255],
    alpha: 0.95,
  }),
  [FLOATING_TEXT_TONE_NORMAL]: Object.freeze({
    main: [255, 191, 95],
    secondary: [255, 147, 82],
    label: [255, 236, 175],
    alpha: 0.98,
  }),
  [FLOATING_TEXT_TONE_SUPER]: Object.freeze({
    main: [255, 138, 62],
    secondary: [255, 79, 52],
    label: [255, 210, 156],
    alpha: 1,
  }),
  [FLOATING_TEXT_TONE_CRITICAL]: Object.freeze({
    main: [255, 82, 66],
    secondary: [255, 28, 38],
    label: [255, 182, 168],
    alpha: 1,
  }),
});
export const FLOATING_TEXT_TONE_VISUAL_STYLES = Object.freeze({
  [FLOATING_TEXT_TONE_MISS]: Object.freeze({
    enterDurationMs: 92,
    settleDurationMs: 138,
    exitDurationMs: 280,
    exitLifeRatio: 0.62,
    startScale: 0.72,
    peakScale: 0.92,
    settleScale: 0.88,
    exitScale: 0.74,
    pulseStrength: 0.02,
    spawnJitterX: 18,
    spawnLiftY: 8,
    horizontalDriftPx: 18,
    verticalRiseSpeed: 78,
    verticalRiseVariance: 16,
    enterEasing: Easing.Quadratic.Out,
    settleEasing: Easing.Quadratic.Out,
    exitEasing: Easing.Quadratic.In,
  }),
  [FLOATING_TEXT_TONE_RESIST]: Object.freeze({
    enterDurationMs: 116,
    settleDurationMs: 152,
    exitDurationMs: 252,
    exitLifeRatio: 0.52,
    startScale: 0.78,
    peakScale: 1.04,
    settleScale: 0.98,
    exitScale: 0.84,
    pulseStrength: 0.04,
    spawnJitterX: 22,
    spawnLiftY: 10,
    horizontalDriftPx: 22,
    verticalRiseSpeed: 90,
    verticalRiseVariance: 20,
    enterEasing: Easing.Back.Out,
    settleEasing: Easing.Cubic.Out,
    exitEasing: Easing.Quadratic.In,
  }),
  [FLOATING_TEXT_TONE_NORMAL]: Object.freeze({
    enterDurationMs: FLOATING_TEXT_ENTER_TWEEN_MS,
    settleDurationMs: 142,
    exitDurationMs: FLOATING_TEXT_EXIT_TWEEN_MS,
    exitLifeRatio: 0.48,
    startScale: 0.8,
    peakScale: 1.08,
    settleScale: 1,
    exitScale: 0.86,
    pulseStrength: 0.06,
    spawnJitterX: 24,
    spawnLiftY: 10,
    horizontalDriftPx: 24,
    verticalRiseSpeed: 94,
    verticalRiseVariance: 22,
    enterEasing: Easing.Back.Out,
    settleEasing: Easing.Cubic.Out,
    exitEasing: Easing.Quadratic.In,
  }),
  [FLOATING_TEXT_TONE_SUPER]: Object.freeze({
    enterDurationMs: 96,
    settleDurationMs: 166,
    exitDurationMs: 230,
    exitLifeRatio: 0.44,
    startScale: 0.82,
    peakScale: 1.2,
    settleScale: 1.06,
    exitScale: 0.92,
    pulseStrength: 0.12,
    spawnJitterX: 28,
    spawnLiftY: 11,
    horizontalDriftPx: 28,
    verticalRiseSpeed: 104,
    verticalRiseVariance: 24,
    enterEasing: Easing.Back.Out,
    settleEasing: Easing.Cubic.Out,
    exitEasing: Easing.Cubic.In,
  }),
  [FLOATING_TEXT_TONE_CRITICAL]: Object.freeze({
    enterDurationMs: 88,
    settleDurationMs: 174,
    exitDurationMs: 252,
    exitLifeRatio: 0.46,
    startScale: 0.86,
    peakScale: 1.3,
    settleScale: 1.12,
    exitScale: 0.94,
    pulseStrength: 0.18,
    spawnJitterX: 30,
    spawnLiftY: 12,
    horizontalDriftPx: 30,
    verticalRiseSpeed: 114,
    verticalRiseVariance: 28,
    enterEasing: Easing.Back.Out,
    settleEasing: Easing.Cubic.Out,
    exitEasing: Easing.Cubic.In,
  }),
});
export const MONEY_COUNTER_LERP_MS = GAME_DESIGN.combat.moneyCounterLerpMs;
export const MONEY_COUNTER_PULSE_MS = GAME_DESIGN.combat.moneyCounterPulseMs;
export const PROJECTILE_SPRITE_PX = GAME_DESIGN.combat.projectile.spritePx;
export const PROJECTILE_TRAIL_POINT_LIFETIME_MS = GAME_DESIGN.combat.projectile.trailPointLifetimeMs;
export const PROJECTILE_TRAIL_MAX_POINTS = GAME_DESIGN.combat.projectile.trailMaxPoints;
export const PROJECTILE_TRAIL_POINT_BASE_SPACING_PX = GAME_DESIGN.combat.projectile.trailPointBaseSpacingPx;
export const PROJECTILE_TRAIL_POINT_MIN_SPACING_PX = GAME_DESIGN.combat.projectile.trailPointMinSpacingPx;
export const PROJECTILE_TRAIL_POINT_MAX_SPACING_PX = GAME_DESIGN.combat.projectile.trailPointMaxSpacingPx;
export const PROJECTILE_VISUAL_PROFILE = Object.freeze({
  ...GAME_DESIGN.combat.projectile.visualProfile,
});
export const COMBAT_VFX_CONFIG = Object.freeze({
  ...GAME_DESIGN.combat.vfx,
});
export const CAPTURE_THROW_MS = GAME_DESIGN.capture.throwMs;
export const CAPTURE_SHAKE_MS = GAME_DESIGN.capture.shakeMs;
export const CAPTURE_SUCCESS_BURST_MS = GAME_DESIGN.capture.successBurstMs;
export const CAPTURE_FAIL_BREAK_MS = GAME_DESIGN.capture.failBreakMs;
export const CAPTURE_FAIL_REAPPEAR_MS = GAME_DESIGN.capture.failReappearMs;
export const CAPTURE_POST_MS = GAME_DESIGN.capture.postMs;
export const CAPTURE_CRIT_CHANCE = GAME_DESIGN.capture.critChance;
export const CAPTURE_CRIT_MULTIPLIER = GAME_DESIGN.capture.critMultiplier;
export const CAPTURE_BALL_MULTIPLIER_NERF = GAME_DESIGN.capture.ballMultiplierNerf;
export const COIN_REWARD_PER_CAPTURE = GAME_DESIGN.economy.coinRewardPerCapture;
export const COIN_REWARD_FIRST_CAPTURE_BONUS = GAME_DESIGN.economy.coinRewardFirstCaptureBonus;
export const COIN_REWARD_PER_EVOLUTION = GAME_DESIGN.economy.coinRewardPerEvolution;
export const MIN_LEVEL_DIFF_MONEY_MULTIPLIER = GAME_DESIGN.economy.minLevelDiffMoneyMultiplier;
export const GACHA_SPIN_COST_COINS = GAME_DESIGN.gacha.spinCostCoins;
export const GACHA_BATCH_SPIN_COUNT = GAME_DESIGN.gacha.batchSpinCount;
export const GACHA_BATCH_SPIN_COST_COINS = GAME_DESIGN.gacha.batchSpinCostCoins;
export const GACHA_BASE_MAX_POKEMON_ID = GAME_DESIGN.gacha.baseMaxPokemonId;
export const GACHA_EXTENDED_MAX_POKEMON_ID = GAME_DESIGN.gacha.extendedMaxPokemonId;
export const GACHA_REEL_TOTAL_ITEMS = GAME_DESIGN.gacha.reelTotalItems;
export const GACHA_REEL_REWARD_INDEX = GAME_DESIGN.gacha.rewardIndex;
export const GACHA_SPIN_DURATION_MS = GAME_DESIGN.gacha.spinDurationMs;
export const GACHA_BATCH_SPIN_DURATION_MS = GAME_DESIGN.gacha.batchSpinDurationMs;
export const GACHA_SPIN_FINAL_SNAP_DURATION_MS = GAME_DESIGN.gacha.spinFinalSnapDurationMs;
export const GACHA_SPIN_MAIN_SCROLL_DURATION_MS = GAME_DESIGN.gacha.spinMainScrollDurationMs;
export const GACHA_BATCH_SPIN_MAIN_SCROLL_DURATION_MS = GAME_DESIGN.gacha.batchSpinMainScrollDurationMs;
export const GACHA_SPIN_FINAL_SNAP_LEAD_PX = GAME_DESIGN.gacha.spinFinalSnapLeadPx;
export const GACHA_BATCH_SPOTLIGHT_POP_MS = GAME_DESIGN.gacha.batchSpotlightPopMs;
export const GACHA_BATCH_SPOTLIGHT_TRANSFER_MS = GAME_DESIGN.gacha.batchSpotlightTransferMs;
export const GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS = GAME_DESIGN.gacha.batchSpotlightStepGapMs;
export const GACHA_BATCH_SLOT_JUICE_MS = GAME_DESIGN.gacha.batchSlotJuiceMs;
