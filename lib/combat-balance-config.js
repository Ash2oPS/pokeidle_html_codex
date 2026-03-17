import { Easing } from "../vendor/tween.js";

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
export const TALENT_LEGENDARY_FIELD_ATTACK_BONUS = 0.35;
export const TALENT_LEGENDARY_FIELD_ATTACK_INTERVAL_MULTIPLIER = 0.8;
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
  [TALENT_VALIANT_EYE_ID]: 0.1,
});
export const TALENT_MONEY_MULTIPLIER_BY_ID = Object.freeze({
  [TALENT_JACKPOT_ID]: 1.2,
  [TALENT_JACKPOT_PLUS_ID]: 1.4,
});
export const TALENT_TELEPORT_SWAP_CHANCE_BY_ID = Object.freeze({
  [TALENT_TELEPORT_ID]: 0.1,
  [TALENT_TELEPORT_PLUS_ID]: 0.2,
  [TALENT_TELEPORT_PLUS_PLUS_ID]: 0.3,
});
export const TALENT_TELEPORT_PLUS_PLUS_DAMAGE_MULTIPLIER = 1.5;
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
export const BASE_STEP_MS = 1000 / 60;
export const ATTACK_INTERVAL_MS = 420;
export const ATTACK_CRIT_CHANCE = 0.05;
export const ATTACK_MISS_CHANCE = 0.05;
export const ATTACK_CRIT_MULTIPLIER = 1.5;
export const STARTER_LEVEL = 1;
export const PROJECTILE_SPEED_PX_PER_SECOND = 910;
export const PROJECTILE_TWEEN_DURATION_MIN_MS = 80;
export const PROJECTILE_TWEEN_DURATION_MAX_MS = 354;
export const PROJECTILE_TWEEN_ARC_BASE_PX = 8;
export const PROJECTILE_TWEEN_ARC_RANDOM_PX = 14;
export const DAMAGE_SCALE = 2.2;
export const DAMAGE_LEVEL_PROGRESSION_EXPONENT = 0.62;
export const KO_RESPAWN_DELAY_MS = 110;
export const KO_ANIMATION_DURATION_MS = 110;
export const ENEMY_ENTER_ANIM_DURATION_MS = 140;
export const ENEMY_ENTER_ANIM_OFFSET_PX = 84;
export const ENEMY_ENTER_ANIM_ROTATION_DEG = 8;
export const ENEMY_ENTER_ANIM_FADE_RATIO = 0.58;
export const ENEMY_ENTER_ANIM_ROTATE_RATIO = 0.4;
export const ATTACK_FLASH_DURATION_MS = 150;
export const ATTACK_FLASH_WHITE_BLEND = 0.4;
export const SKIP_TURN_EFFECT_DURATION_MIN_MS = 190;
export const SKIP_TURN_EFFECT_DURATION_MAX_MS = 720;
export const SKIP_TURN_EFFECT_FADE_RATIO = 0.24;
export const SKIP_TURN_EFFECT_GRAYSCALE_MAX = 0.94;
export const ATTACK_CHARGE_MIN_WINDOW_MS = 120;
export const ATTACK_CHARGE_WINDOW_RATIO = 0.42;
export const TELEPORT_SWAP_SCALE_DURATION_MS = 130;
export const ENEMY_DAMAGE_FLASH_DURATION_MS = 150;
export const ENEMY_DAMAGE_FLASH_RED_BLEND = 0.4;
export const FLOATING_TEXT_LIFETIME_MS = 950;
export const FLOATING_TEXT_ENTER_TWEEN_MS = 120;
export const FLOATING_TEXT_EXIT_TWEEN_MS = 220;
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
export const MONEY_COUNTER_LERP_MS = 180;
export const MONEY_COUNTER_PULSE_MS = 520;
export const PROJECTILE_SPRITE_PX = 72;
export const PROJECTILE_TRAIL_POINT_LIFETIME_MS = 170;
export const PROJECTILE_TRAIL_MAX_POINTS = 10;
export const PROJECTILE_TRAIL_POINT_BASE_SPACING_PX = 7.2;
export const PROJECTILE_TRAIL_POINT_MIN_SPACING_PX = 4.5;
export const PROJECTILE_TRAIL_POINT_MAX_SPACING_PX = 13.5;
export const PROJECTILE_VISUAL_PROFILE = Object.freeze({
  trailEnabled: true,
  trailMaxPoints: 4,
  trailStride: 2,
  trailGlow: false,
  streak: false,
  aura: false,
  auraScale: 0.66,
  spriteDetail: true,
});
export const CAPTURE_THROW_MS = 360;
export const CAPTURE_SHAKE_MS = 560;
export const CAPTURE_SUCCESS_BURST_MS = 560;
export const CAPTURE_FAIL_BREAK_MS = 420;
export const CAPTURE_FAIL_REAPPEAR_MS = 460;
export const CAPTURE_POST_MS = 230;
export const CAPTURE_CRIT_CHANCE = 0.1;
export const CAPTURE_CRIT_MULTIPLIER = 2;
export const CAPTURE_BALL_MULTIPLIER_NERF = 0.5;
export const COIN_REWARD_PER_CAPTURE = 1;
export const COIN_REWARD_FIRST_CAPTURE_BONUS = 5;
export const COIN_REWARD_PER_EVOLUTION = 3;
export const MIN_LEVEL_DIFF_MONEY_MULTIPLIER = 0.35;
export const GACHA_SPIN_COST_COINS = 10;
export const GACHA_BATCH_SPIN_COUNT = 10;
export const GACHA_BATCH_SPIN_COST_COINS = 100;
export const GACHA_BASE_MAX_POKEMON_ID = 151;
export const GACHA_EXTENDED_MAX_POKEMON_ID = 493;
export const GACHA_REEL_TOTAL_ITEMS = 64;
export const GACHA_REEL_REWARD_INDEX = 44;
export const GACHA_SPIN_DURATION_MS = 2400;
export const GACHA_BATCH_SPIN_DURATION_MS = 3200;
export const GACHA_SPIN_FINAL_SNAP_DURATION_MS = 220;
export const GACHA_SPIN_MAIN_SCROLL_DURATION_MS = Math.max(200, GACHA_SPIN_DURATION_MS - GACHA_SPIN_FINAL_SNAP_DURATION_MS);
export const GACHA_BATCH_SPIN_MAIN_SCROLL_DURATION_MS = Math.max(
  200,
  GACHA_BATCH_SPIN_DURATION_MS - GACHA_SPIN_FINAL_SNAP_DURATION_MS,
);
export const GACHA_SPIN_FINAL_SNAP_LEAD_PX = 24;
export const GACHA_BATCH_SPOTLIGHT_POP_MS = 620;
export const GACHA_BATCH_SPOTLIGHT_TRANSFER_MS = 420;
export const GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS = 110;
export const GACHA_BATCH_SLOT_JUICE_MS = 560;
