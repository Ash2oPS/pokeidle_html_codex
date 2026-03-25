import { GAME_DESIGN } from "./game-design-config-runtime.js";
import { normalizeUiDisplayText } from "./text-normalization.js";

const frUi = (value) => normalizeUiDisplayText(value, { frenchTypography: true });
const frUiLines = (lines) => Object.freeze(lines.map((line) => frUi(line)));

export const TEAM_SPRITE_SCALE = 1.18;
export const TEAM_SPRITE_SCALE_PHONE_MULTIPLIER = 1.24 * 0.7 * 1.1;
export const TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER = 1.1;
export const TEAM_SPRITE_MIN_RENDER_RATIO_PHONE = 0.96;
export const TEAM_SPRITE_MIN_RENDER_RATIO_COMPACT = 0.9;
export const ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER = 0.8625;
export const ENEMY_SPRITE_SIZE_PHONE_MULTIPLIER = 1.14 * 1.1;
export const ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER = 1.06;
export const DEV_LAYOUT_STORAGE_KEY = "pokeidle_dev_layout_v1";
export const DEV_LAYOUT_SETTINGS_DEFAULTS = Object.freeze({
  enemySpriteScale: 1.39,
  allySpriteScale: 1.09,
  enemyCenterYOffset: 71,
  allyRingYOffset: 60,
  arcRotationDeg: 0,
  arcSpreadScale: 1.41,
  arcRadiusScale: 1.44,
  hudXOffset: 0,
  hudYOffset: 7,
  hudDepthScale: 0.2,
  enemyUiYOffset: -21,
});
export const DEV_LAYOUT_CONTROL_DEFINITIONS = Object.freeze([
  Object.freeze({
    key: "enemySpriteScale",
    label: frUi("Taille ennemi"),
    min: 0.4,
    max: 2,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "allySpriteScale",
    label: frUi("Taille allies"),
    min: 0.4,
    max: 2,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "enemyCenterYOffset",
    label: frUi("Y ennemi"),
    min: -240,
    max: 240,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "allyRingYOffset",
    label: frUi("Y allies"),
    min: -240,
    max: 240,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "arcRotationDeg",
    label: frUi("Rotation arc"),
    min: -65,
    max: 65,
    step: 0.5,
    valueType: "deg",
  }),
  Object.freeze({
    key: "arcSpreadScale",
    label: frUi("Ouverture arc"),
    min: 0.55,
    max: 1.7,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "arcRadiusScale",
    label: frUi("Rayon arc"),
    min: 0.6,
    max: 2,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "hudXOffset",
    label: frUi("X panneaux allies"),
    min: -180,
    max: 180,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "hudYOffset",
    label: frUi("Y panneaux allies"),
    min: -220,
    max: 260,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "hudDepthScale",
    label: frUi("Profondeur panneaux"),
    min: 0.2,
    max: 2.5,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "enemyUiYOffset",
    label: frUi("Y HUD ennemi"),
    min: -220,
    max: 220,
    step: 1,
    valueType: "px",
  }),
]);
export const POKEMON_DATA_SPRITE_SCALE_MIN = 0.8;
export const POKEMON_DATA_SPRITE_SCALE_MAX = 1.2;
export const POKEMON_SPRITE_COMMON_PPU = 64;
export const POKEMON_SPRITE_USE_SOURCE_PPU_ADAPTATION = true;
export const POKEMON_SPRITE_COMMON_PPU_MULTIPLIER_MIN = 0.5;
export const POKEMON_SPRITE_COMMON_PPU_MULTIPLIER_MAX = 1.8;
export const MAX_LEVEL = GAME_DESIGN.progression.maxLevel;
export const SHOP_TAB_POKEBALLS = "pokeballs";
export const SHOP_TAB_COMBAT = "combat";
export const SHOP_TAB_EVOLUTIONS = "evolutions";
export const SHOP_QUANTITY_MODE_CUSTOM = "custom";
export const SHOP_QUANTITY_MODE_MAX = "max";
export const SHOP_QUANTITY_PRESET_VALUES = Object.freeze([...GAME_DESIGN.ui.shopQuantityPresetValues]);
export const SHOP_QUANTITY_PRESET_SET = new Set(SHOP_QUANTITY_PRESET_VALUES);
export const BOOST_X_DURATION_MS = GAME_DESIGN.combat.boostX.durationMs;
export const BOOST_X_ATTACK_INTERVAL_MULTIPLIER = GAME_DESIGN.combat.boostX.attackIntervalMultiplier;
export const DEFAULT_WILD_LEVEL_MIN = GAME_DESIGN.progression.defaultWildLevelMin;
export const DEFAULT_WILD_LEVEL_MAX = GAME_DESIGN.progression.defaultWildLevelMax;
export const ENEMY_MONEY_BASE = GAME_DESIGN.economy.enemyMoneyBase;
export const ENEMY_MONEY_LEVEL_MULT = GAME_DESIGN.economy.enemyMoneyLevelMult;
export const ENEMY_MONEY_STAT_FACTOR = GAME_DESIGN.economy.enemyMoneyStatFactor;
export const CAPTURE_XP_BASE = GAME_DESIGN.progression.captureXpBase;
export const CAPTURE_XP_LEVEL_MULT = GAME_DESIGN.progression.captureXpLevelMult;
export const CAPTURE_XP_STAT_FACTOR = GAME_DESIGN.progression.captureXpStatFactor;
export const KO_XP_RATIO_OF_CAPTURE = GAME_DESIGN.progression.koXpRatioOfCapture;
export const LEVEL_PROGRESSION_LINEAR_PER_STEP = GAME_DESIGN.progression.levelProgressionLinearPerStep;
export const LEVEL_PROGRESSION_CURVE_EXPONENT = GAME_DESIGN.progression.levelProgressionCurveExponent;
export const LEVEL_PROGRESSION_CURVE_PER_STEP = GAME_DESIGN.progression.levelProgressionCurvePerStep;
export const ENEMY_HP_TEAM_SCALE_MAX_BONUS = GAME_DESIGN.progression.enemyHpTeamScaleMaxBonus;
export const ENEMY_HP_TEAM_SCALE_EXPONENT = GAME_DESIGN.progression.enemyHpTeamScaleExponent;
export const ENEMY_REWARD_SCALE_EXPONENT = GAME_DESIGN.progression.enemyRewardScaleExponent;
export const ENEMY_REWARD_SCALE_BLEND = GAME_DESIGN.progression.enemyRewardScaleBlend;
export const APPEARANCE_UNLOCK_LEVEL = GAME_DESIGN.progression.appearanceUnlockLevel;
export const POKEMON_NICKNAME_MAX_LENGTH = GAME_DESIGN.progression.pokemonNicknameMaxLength;
export const FOREGROUND_FRAME_STEP_MS = GAME_DESIGN.metrics.foregroundFrameStepMs;
export const HIDDEN_SIM_BUDGET_MS = GAME_DESIGN.metrics.hiddenSimBudgetMs;
export const BACKGROUND_PUMP_MAX_WORK_MS = GAME_DESIGN.metrics.backgroundPumpMaxWorkMs;
export const BULK_IDLE_THRESHOLD_MS = GAME_DESIGN.metrics.bulkIdleThresholdMs;
export const MAX_OFFLINE_CATCHUP_MS = GAME_DESIGN.metrics.maxOfflineCatchupMs;
export const MAX_RESUME_CATCHUP_MS = GAME_DESIGN.metrics.maxResumeCatchupMs;
export const FOREGROUND_CATCHUP_PUMP_MAX_WORK_MS = GAME_DESIGN.metrics.foregroundCatchupPumpMaxWorkMs;
export const FOREGROUND_CATCHUP_PUMP_DELAY_MS = GAME_DESIGN.metrics.foregroundCatchupPumpDelayMs;
export const BACKGROUND_TICK_INTERVAL_MS = GAME_DESIGN.metrics.backgroundTickIntervalMs;
export const BACKGROUND_PERSIST_DEBOUNCE_MS = GAME_DESIGN.metrics.backgroundPersistDebounceMs;
export const DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS = GAME_DESIGN.metrics.desktopBackgroundWatchdogIntervalMs;
export const DESKTOP_BACKGROUND_WATCHDOG_STALL_MS = GAME_DESIGN.metrics.desktopBackgroundWatchdogStallMs;
export const EVOLUTION_ANIM_TOTAL_MS = GAME_DESIGN.ui.evolutionAnimTotalMs;
export const EVOLUTION_ANIM_WHITE_MS = GAME_DESIGN.ui.evolutionAnimWhiteMs;
export const EVOLUTION_ANIM_FLASH_MS = GAME_DESIGN.ui.evolutionAnimFlashMs;
export const EVOLUTION_ANIM_REVEAL_MS = GAME_DESIGN.ui.evolutionAnimRevealMs;
export const EVOLUTION_ANIM_BACKDROP_FADE_MS = GAME_DESIGN.ui.evolutionAnimBackdropFadeMs;
export const EVOLUTION_ANIM_PARTICLE_COUNT = GAME_DESIGN.ui.evolutionAnimParticleCount;
export const HAPPINESS_EVOLUTION_BOX_REQUIRED_MS = GAME_DESIGN.progression.happinessEvolutionBoxRequiredMs;
export const CABLE_LINK_METHOD_ITEM = "cable-link";
export const BACKGROUND_DRIFT_TRAVEL_MIN_MS = GAME_DESIGN.ui.backgroundDriftTravelMinMs;
export const BACKGROUND_DRIFT_TRAVEL_MAX_MS = GAME_DESIGN.ui.backgroundDriftTravelMaxMs;
export const BACKGROUND_DRIFT_HOLD_MIN_MS = GAME_DESIGN.ui.backgroundDriftHoldMinMs;
export const BACKGROUND_DRIFT_HOLD_MAX_MS = GAME_DESIGN.ui.backgroundDriftHoldMaxMs;
export const TEAM_LEVEL_UP_EFFECT_DURATION_MS = GAME_DESIGN.ui.teamLevelUpEffectDurationMs;
export const TEAM_XP_GAIN_EFFECT_DURATION_MS = GAME_DESIGN.ui.teamXpGainEffectDurationMs;
export const TEAM_XP_PULSE_DURATION_MS = GAME_DESIGN.ui.teamXpPulseDurationMs;
export const TUTORIAL_FLOW_ROUTE_1 = "route1_intro";
export const TUTORIAL_FLOW_EVOLUTION = "evolution_intro";
export const TUTORIAL_FLOW_APPEARANCE = "appearance_intro";
export const TUTORIAL_FLOW_DEFINITIONS = Object.freeze({
  [TUTORIAL_FLOW_ROUTE_1]: Object.freeze({
    saveFlag: "route1_intro_seen",
    title: frUi("Tuto Route 1"),
    pages: Object.freeze([
      Object.freeze({
        title: frUi("Combats automatiques"),
        lines: frUiLines([
          "Ton equipe attaque automatiquement les Pokemon sauvages.",
          "Quand l'ennemi tombe KO, le suivant apparait apres un court delai.",
          "En ville, ou apres avoir debloque la zone suivante, clique un Pokemon d'equipe pour ouvrir les Boites.",
        ]),
      }),
      Object.freeze({
        title: frUi("Poke Balls et captures"),
        lines: frUiLines([
          "Pour capturer, il te faut des Poke Balls dans l'inventaire.",
          "Les balls se reglent et s'achetent dans le Shop.",
          "Une capture critique a plus de chances de reussir.",
        ]),
      }),
      Object.freeze({
        title: frUi("Argent et progression"),
        lines: frUiLines([
          "Battre des Pokemon rapporte de l'argent (Poke$).",
          "L'argent sert a acheter des balls, boosts et objets d'evolution.",
          "Chaque zone se debloque en battant 20 Pokemon d'affilee, avec 20 secondes max par combat.",
        ]),
      }),
      Object.freeze({
        title: frUi("XP et niveaux"),
        lines: frUiLines([
          "Un KO donne de l'XP a toute l'equipe.",
          "Une capture donne le bonus d'XP restant.",
          "Les niveaux montent les stats et debloquent ensuite les evolutions.",
        ]),
      }),
    ]),
  }),
  [TUTORIAL_FLOW_EVOLUTION]: Object.freeze({
    saveFlag: "evolution_intro_seen",
    title: frUi("Tuto Evolution"),
    pages: Object.freeze([
      Object.freeze({
        title: frUi("Comment evoluer"),
        lines: frUiLines([
          "Quand un Pokemon remplit ses conditions, une notif permanente apparait avant l'evolution.",
          "Utilise le bouton Evoluer dans cette notif pour lancer l'animation.",
          "Tu conserves l'ancienne entite et gagnes l'entite d'evolution niveau 1.",
        ]),
      }),
    ]),
  }),
  [TUTORIAL_FLOW_APPEARANCE]: Object.freeze({
    saveFlag: "appearance_intro_seen",
    title: frUi("Tuto Apparence"),
    pages: Object.freeze([
      Object.freeze({
        title: frUi("Skins et apparence"),
        lines: frUiLines([
          "Le changement d'apparence est disponible des le debut.",
          "Des qu'un Pokemon de ton equipe atteint le niveau 10, ce tuto apparait une premiere fois.",
          "Fais clic droit sur un Pokemon de ta team pour ouvrir ses skins.",
          "Les skins se debloquent avec la machine Gacha. Ici, tu equipes seulement ceux deja debloques.",
        ]),
      }),
    ]),
  }),
});
export const POKEMON_BACKDROP_ALPHA = 0.5;
export const POKEMON_BACKDROP_RADIUS_RATIO = 0.36;
export const POKEMON_SHADOW_ALPHA = 0.52;
export const ULTRA_SHINY_HUE_CYCLE_MS = GAME_DESIGN.rarity.ultraShinyHueCycleMs;
export const ULTRA_SHINY_SCINTILLATION_PERIOD_MS = GAME_DESIGN.rarity.ultraShinyScintillationPeriodMs;
export const ULTRA_SHINY_SCINTILLATION_FLASH_MS = GAME_DESIGN.rarity.ultraShinyScintillationFlashMs;
export const ULTRA_SHINY_OUTLINE_PX = 2;
export const MORPHING_OUTLINE_PX = 1.9;
export const MORPHING_OUTLINE_RGB = Object.freeze([93, 49, 133]);
export const MORPHING_OUTLINE_ALPHA = 0.85;
export const MORPHING_SLIME_BASE_RGB = Object.freeze([173, 117, 208]);
export const MORPHING_SLIME_HIGHLIGHT_RGB = Object.freeze([225, 198, 241]);
export const MORPHING_SLIME_ALPHA = 0.56;
export const MORPHING_MOTION_INTENSITY = 0.3;
export const MORPHING_WOBBLE_SCALE_AMPLITUDE = 0.14;
export const MORPHING_WOBBLE_VERTICAL_COMPENSATION = 0.11;
export const MORPHING_WOBBLE_ROTATION_DEG = 7.5;
export const MORPHING_WOBBLE_SHEAR = 0.15;
export const MORPHING_WOBBLE_OFFSET_RATIO = 0.095;
export const DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON = GAME_DESIGN.rarity.debugForceUltraShinyAllPokemon;
export const BREATH_MIN_PERIOD_MS = 2500;
export const BREATH_MAX_PERIOD_MS = 4100;
export const BREATH_BASE_AMPLITUDE = 0.022;
export const BREATH_AMPLITUDE_VARIATION = 0.014;
export const BREATH_SECONDARY_WEIGHT = 0.24;
export const BREATH_SIDE_COMPENSATION = 0.42;
export const BREATH_OFFSET_RATIO = 0.022;
export const MAX_RENDER_DPR = GAME_DESIGN.metrics.maxRenderDpr;
export const TARGET_FPS = GAME_DESIGN.metrics.targetFps;
export const TARGET_FRAME_MS = GAME_DESIGN.metrics.targetFrameMs;
export const TARGET_RENDER_INTERVAL_MS = GAME_DESIGN.metrics.targetRenderIntervalMs;
export const MAX_FOREGROUND_PENDING_MS = GAME_DESIGN.metrics.maxForegroundPendingMs;
export const HUD_AUTO_REFRESH_INTERVAL_MS = GAME_DESIGN.metrics.hudAutoRefreshIntervalMs;
export const LAYOUT_RECOMPUTE_INTERVAL_MS = GAME_DESIGN.metrics.layoutRecomputeIntervalMs;
export const DEFERRED_ROUTE_WARMUP_CHUNK_SIZE = GAME_DESIGN.metrics.deferredRouteWarmupChunkSize;
export const DEFERRED_ROUTE_WARMUP_DELAY_MS = GAME_DESIGN.metrics.deferredRouteWarmupDelayMs;
export const LOADING_SCREEN_EXIT_DURATION_MS = GAME_DESIGN.ui.loadingScreenExitDurationMs;
export const LOADING_SCREEN_DEFAULT_TEXT = "Le code de ce jeu a \u00e9t\u00e9 enti\u00e8rement g\u00e9n\u00e9r\u00e9 par IA.";
export const LOCAL_DAY_START_HOUR = GAME_DESIGN.metrics.localDayStartHour;
export const LOCAL_NIGHT_START_HOUR = GAME_DESIGN.metrics.localNightStartHour;
export const ENVIRONMENT_UPDATE_INTERVAL_MS = GAME_DESIGN.metrics.environmentUpdateIntervalMs;
export const RENDER_QUALITY_ORDER = Object.freeze([...GAME_DESIGN.metrics.renderQualityOrder]);
export const RENDER_QUALITY_PRESETS = Object.freeze(
  Object.fromEntries(
    Object.entries(GAME_DESIGN.metrics.renderQualityPresets).map(([key, value]) => [key, Object.freeze({ ...value })]),
  ),
);
export const PERF_SHORT_EMA_SMOOTHING = GAME_DESIGN.metrics.perfShortEmaSmoothing;
export const PERF_LONG_EMA_SMOOTHING = GAME_DESIGN.metrics.perfLongEmaSmoothing;
export const PERF_CPU_EMA_SMOOTHING = GAME_DESIGN.metrics.perfCpuEmaSmoothing;
export const PERF_RENDER_EMA_SMOOTHING = GAME_DESIGN.metrics.perfRenderEmaSmoothing;
export const PERF_SWITCH_COOLDOWN_MS = GAME_DESIGN.metrics.perfSwitchCooldownMs;
export const PERF_DOWNGRADE_STREAK = GAME_DESIGN.metrics.perfDowngradeStreak;
export const PERF_UPGRADE_STREAK = GAME_DESIGN.metrics.perfUpgradeStreak;
export const PERF_SLOW_FRAME_MARGIN_MS = GAME_DESIGN.metrics.perfSlowFrameMarginMs;
export const PERF_VERY_SLOW_FRAME_MARGIN_MS = GAME_DESIGN.metrics.perfVerySlowFrameMarginMs;
export const PERF_UPGRADE_HEADROOM_MS = GAME_DESIGN.metrics.perfUpgradeHeadroomMs;

export const ZONE_UI_CANVAS_THEME = Object.freeze({
  fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
  chrome: Object.freeze({
    radiusPanel: 18,
    radiusCard: 14,
    radiusPill: 999,
    shadowOffsetY: 3,
  }),
  panel: Object.freeze({
    fillTop: "rgba(18, 47, 72, 0.99)",
    fillMid: "rgba(11, 34, 51, 0.992)",
    fillBottom: "rgba(8, 23, 37, 0.995)",
    border: "rgba(123, 201, 219, 0.9)",
    borderSoft: "rgba(102, 165, 188, 0.82)",
    highlight: "rgba(226, 246, 255, 0.18)",
    shadow: "rgba(0, 0, 0, 0.34)",
    textTitle: "rgba(244, 251, 255, 0.99)",
    text: "rgba(238, 247, 255, 0.98)",
    textSoft: "rgba(179, 209, 228, 0.94)",
    textMuted: "rgba(125, 154, 178, 0.9)",
  }),
  subpanel: Object.freeze({
    fillTop: "rgba(17, 43, 67, 0.98)",
    fillMid: "rgba(12, 32, 49, 0.985)",
    fillBottom: "rgba(8, 24, 38, 0.99)",
    border: "rgba(108, 183, 208, 0.72)",
    borderSoft: "rgba(91, 149, 172, 0.6)",
    highlight: "rgba(255, 255, 255, 0.08)",
    shadow: "rgba(0, 0, 0, 0.26)",
  }),
  elevated: Object.freeze({
    fillTop: "rgba(26, 63, 90, 0.985)",
    fillMid: "rgba(17, 43, 64, 0.992)",
    fillBottom: "rgba(10, 31, 49, 0.995)",
    border: "rgba(145, 220, 236, 0.84)",
    highlight: "rgba(228, 245, 255, 0.18)",
    shadow: "rgba(0, 0, 0, 0.28)",
    textTitle: "rgba(244, 251, 255, 0.99)",
    text: "rgba(235, 248, 255, 0.98)",
    textSoft: "rgba(183, 213, 227, 0.94)",
  }),
  goldChip: Object.freeze({
    fillTop: "rgba(246, 205, 117, 0.99)",
    fillBottom: "rgba(176, 111, 47, 0.99)",
    border: "rgba(149, 96, 40, 0.96)",
    highlight: "rgba(255, 235, 181, 0.5)",
    text: "rgba(255, 249, 239, 0.98)",
  }),
  hp: Object.freeze({
    track: "rgba(48, 66, 86, 0.98)",
    lag: "rgba(113, 100, 84, 0.56)",
    trackBorder: "rgba(104, 136, 163, 0.9)",
    healthy: Object.freeze({
      start: "rgba(92, 181, 131, 0.99)",
      end: "rgba(130, 211, 156, 0.99)",
      glow: "rgba(169, 237, 194, 0.3)",
    }),
    warning: Object.freeze({
      start: "rgba(228, 176, 86, 0.99)",
      end: "rgba(247, 205, 115, 0.99)",
      glow: "rgba(255, 229, 166, 0.3)",
    }),
    danger: Object.freeze({
      start: "rgba(203, 103, 92, 0.99)",
      end: "rgba(233, 131, 117, 0.99)",
      glow: "rgba(245, 173, 162, 0.28)",
    }),
  }),
  xp: Object.freeze({
    trackTop: "rgba(44, 67, 94, 0.98)",
    trackBottom: "rgba(23, 39, 58, 0.98)",
    lag: "rgba(102, 149, 188, 0.46)",
    fillStart: "rgba(92, 170, 224, 0.99)",
    fillEnd: "rgba(138, 210, 244, 0.99)",
    border: "rgba(133, 191, 228, 0.82)",
  }),
  timer: Object.freeze({
    trackTop: "rgba(41, 59, 82, 0.98)",
    trackBottom: "rgba(26, 40, 58, 0.98)",
    border: "rgba(113, 168, 194, 0.88)",
    standard: Object.freeze({
      start: "rgba(243, 183, 91, 0.99)",
      mid: "rgba(224, 130, 72, 0.99)",
      end: "rgba(190, 88, 76, 0.99)",
      sheen: "rgba(255, 245, 216, 0.18)",
      stroke: "rgba(145, 186, 215, 0.82)",
      textFill: "rgba(255, 248, 236, 0.98)",
      textStroke: "rgba(33, 19, 15, 0.82)",
    }),
    onlyOne: Object.freeze({
      start: "rgba(140, 184, 255, 0.99)",
      mid: "rgba(110, 145, 243, 0.99)",
      end: "rgba(79, 103, 214, 0.99)",
      sheen: "rgba(233, 244, 255, 0.2)",
      stroke: "rgba(170, 201, 255, 0.82)",
      textFill: "rgba(244, 249, 255, 0.98)",
      textStroke: "rgba(19, 34, 69, 0.82)",
    }),
    counterFill: "rgba(236, 244, 252, 0.98)",
    counterStroke: "rgba(14, 20, 30, 0.74)",
  }),
  typeMatchup: Object.freeze({
    immune: Object.freeze({
      text: "#ffd4df",
      border: "rgba(216, 118, 148, 0.86)",
      glow: "rgba(255, 171, 198, 0.24)",
      surfaceTop: "rgba(74, 39, 53, 0.98)",
      surfaceBottom: "rgba(39, 22, 31, 0.98)",
    }),
    advantage: Object.freeze({
      text: "#ffe0a3",
      border: "rgba(221, 176, 92, 0.86)",
      glow: "rgba(255, 228, 156, 0.24)",
      surfaceTop: "rgba(82, 65, 36, 0.98)",
      surfaceBottom: "rgba(43, 34, 19, 0.98)",
    }),
    disadvantage: Object.freeze({
      text: "#aee2ff",
      border: "rgba(107, 170, 212, 0.82)",
      glow: "rgba(155, 214, 255, 0.22)",
      surfaceTop: "rgba(34, 58, 83, 0.98)",
      surfaceBottom: "rgba(21, 37, 55, 0.98)",
    }),
    neutral: Object.freeze({
      text: "#d9e8f7",
      border: "rgba(102, 136, 171, 0.8)",
      glow: "rgba(172, 205, 235, 0.18)",
      surfaceTop: "rgba(36, 53, 76, 0.98)",
      surfaceBottom: "rgba(20, 34, 50, 0.98)",
    }),
  }),
  debugPill: Object.freeze({
    fillTop: "rgba(26, 63, 90, 0.985)",
    fillMid: "rgba(17, 43, 64, 0.992)",
    fillBottom: "rgba(10, 31, 49, 0.995)",
    border: "rgba(145, 220, 236, 0.84)",
    highlight: "rgba(228, 245, 255, 0.18)",
    text: "rgba(244, 251, 255, 0.99)",
    textSoft: "rgba(183, 213, 227, 0.94)",
  }),
});

export const BALL_TYPE_ORDER = ["hyper_ball", "super_ball", "poke_ball"];
export const BALL_TYPE_FALLBACK_ORDER = ["poke_ball", "super_ball", "hyper_ball"];
export const BALL_INVENTORY_MAX_PER_TYPE = GAME_DESIGN.ui.ballInventoryMaxPerType;
export const BALL_CAPTURE_RULE_CAPTURE_ALL = "capture_all";
export const BALL_CAPTURE_RULE_CAPTURE_UNOWNED = "capture_unowned";
export const BALL_CAPTURE_RULE_CAPTURE_OWNED = "capture_owned";
export const BALL_CAPTURE_RULE_CAPTURE_SHINY = "capture_shiny";
export const BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY = "capture_ultra_shiny";
export const BALL_OVERLAY_UI_STYLE_BY_TYPE = Object.freeze({
  poke_ball: Object.freeze({
    rowFillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    rowFillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    rowBorder: ZONE_UI_CANVAS_THEME.subpanel.border,
    rowBorderActive: ZONE_UI_CANVAS_THEME.panel.border,
    text: ZONE_UI_CANVAS_THEME.panel.text,
    caption: ZONE_UI_CANVAS_THEME.panel.textSoft,
    iconTop: "rgba(255, 241, 177, 0.98)",
    iconBottom: "rgba(238, 189, 74, 0.98)",
    gaugeStart: "rgba(236, 132, 90, 0.98)",
    gaugeEnd: "rgba(191, 73, 61, 0.98)",
    phaseOffset: 0.24,
    glow: "rgba(130, 199, 255, 0.28)",
  }),
  super_ball: Object.freeze({
    rowFillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    rowFillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    rowBorder: ZONE_UI_CANVAS_THEME.subpanel.border,
    rowBorderActive: ZONE_UI_CANVAS_THEME.panel.border,
    text: ZONE_UI_CANVAS_THEME.panel.text,
    caption: ZONE_UI_CANVAS_THEME.panel.textSoft,
    iconTop: "rgba(255, 241, 177, 0.98)",
    iconBottom: "rgba(238, 189, 74, 0.98)",
    gaugeStart: "rgba(121, 170, 255, 0.98)",
    gaugeEnd: "rgba(80, 111, 227, 0.98)",
    phaseOffset: 1.18,
    glow: "rgba(130, 199, 255, 0.28)",
  }),
  hyper_ball: Object.freeze({
    rowFillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    rowFillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    rowBorder: ZONE_UI_CANVAS_THEME.subpanel.border,
    rowBorderActive: ZONE_UI_CANVAS_THEME.panel.border,
    text: ZONE_UI_CANVAS_THEME.panel.text,
    caption: ZONE_UI_CANVAS_THEME.panel.textSoft,
    iconTop: "rgba(255, 241, 177, 0.98)",
    iconBottom: "rgba(238, 189, 74, 0.98)",
    gaugeStart: "rgba(246, 202, 105, 0.98)",
    gaugeEnd: "rgba(198, 134, 56, 0.98)",
    phaseOffset: 2.04,
    glow: "rgba(130, 199, 255, 0.28)",
  }),
});
export const BALL_OVERLAY_UI_STYLE_DEFAULT = Object.freeze({
  rowFillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
  rowFillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
  rowBorder: ZONE_UI_CANVAS_THEME.subpanel.border,
  rowBorderActive: ZONE_UI_CANVAS_THEME.panel.border,
  text: ZONE_UI_CANVAS_THEME.panel.text,
  caption: ZONE_UI_CANVAS_THEME.panel.textSoft,
  iconTop: "rgba(255, 241, 177, 0.98)",
  iconBottom: "rgba(238, 189, 74, 0.98)",
  gaugeStart: "rgba(144, 185, 255, 0.98)",
  gaugeEnd: "rgba(91, 123, 219, 0.98)",
  glow: "rgba(130, 199, 255, 0.28)",
  phaseOffset: 0,
});
export const SPRITE_OPAQUE_BOUNDS_CACHE_MAX_ENTRIES = 900;
export const MORPHING_COLOR_SAMPLE_CACHE_MAX_ENTRIES = 80;
export const MORPHING_PALETTE_TEXTURE_CACHE_MAX_ENTRIES = 180;
export const ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES = 220;
export const COMPACT_NUMBER_SUFFIXES = Object.freeze([
  Object.freeze({ value: 1e15, suffix: "Qa" }),
  Object.freeze({ value: 1e12, suffix: "T" }),
  Object.freeze({ value: 1e9, suffix: "B" }),
  Object.freeze({ value: 1e6, suffix: "M" }),
  Object.freeze({ value: 1e3, suffix: "K" }),
]);
export const ANIMATED_SPRITE_CACHE_MAX_ENTRIES = 40;
export const ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS = GAME_DESIGN.ui.actionDockFullscreenMenuTransitionMs;
