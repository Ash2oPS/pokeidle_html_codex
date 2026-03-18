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
    label: "Taille ennemi",
    min: 0.4,
    max: 2,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "allySpriteScale",
    label: "Taille allies",
    min: 0.4,
    max: 2,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "enemyCenterYOffset",
    label: "Y ennemi",
    min: -240,
    max: 240,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "allyRingYOffset",
    label: "Y allies",
    min: -240,
    max: 240,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "arcRotationDeg",
    label: "Rotation arc",
    min: -65,
    max: 65,
    step: 0.5,
    valueType: "deg",
  }),
  Object.freeze({
    key: "arcSpreadScale",
    label: "Ouverture arc",
    min: 0.55,
    max: 1.7,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "arcRadiusScale",
    label: "Rayon arc",
    min: 0.6,
    max: 2,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "hudXOffset",
    label: "X panneaux allies",
    min: -180,
    max: 180,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "hudYOffset",
    label: "Y panneaux allies",
    min: -220,
    max: 260,
    step: 1,
    valueType: "px",
  }),
  Object.freeze({
    key: "hudDepthScale",
    label: "Profondeur panneaux",
    min: 0.2,
    max: 2.5,
    step: 0.01,
    valueType: "scale",
  }),
  Object.freeze({
    key: "enemyUiYOffset",
    label: "Y HUD ennemi",
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
export const MAX_LEVEL = 100;
export const SHOP_TAB_POKEBALLS = "pokeballs";
export const SHOP_TAB_COMBAT = "combat";
export const SHOP_TAB_EVOLUTIONS = "evolutions";
export const SHOP_QUANTITY_MODE_CUSTOM = "custom";
export const SHOP_QUANTITY_MODE_MAX = "max";
export const SHOP_QUANTITY_PRESET_VALUES = Object.freeze(["1", "5", "10", "50", "100"]);
export const SHOP_QUANTITY_PRESET_SET = new Set(SHOP_QUANTITY_PRESET_VALUES);
export const BOOST_X_DURATION_MS = 2 * 60 * 1000;
export const BOOST_X_ATTACK_INTERVAL_MULTIPLIER = 0.33;
export const DEFAULT_WILD_LEVEL_MIN = 2;
export const DEFAULT_WILD_LEVEL_MAX = 6;
export const ENEMY_MONEY_BASE = 16;
export const ENEMY_MONEY_LEVEL_MULT = 9;
export const ENEMY_MONEY_STAT_FACTOR = 0.06;
export const CAPTURE_XP_BASE = 10;
export const CAPTURE_XP_LEVEL_MULT = 5;
export const CAPTURE_XP_STAT_FACTOR = 0.024;
export const KO_XP_RATIO_OF_CAPTURE = 0.3;
export const LEVEL_PROGRESSION_LINEAR_PER_STEP = 0.055;
export const LEVEL_PROGRESSION_CURVE_EXPONENT = 1.52;
export const LEVEL_PROGRESSION_CURVE_PER_STEP = 0.038;
export const ENEMY_HP_TEAM_SCALE_MAX_BONUS = 1.8;
export const ENEMY_HP_TEAM_SCALE_EXPONENT = 1.12;
export const ENEMY_REWARD_SCALE_EXPONENT = 0.45;
export const ENEMY_REWARD_SCALE_BLEND = 0.7;
export const APPEARANCE_UNLOCK_LEVEL = 10;
export const POKEMON_NICKNAME_MAX_LENGTH = 14;
export const FOREGROUND_FRAME_STEP_MS = 40;
export const HIDDEN_SIM_BUDGET_MS = 180000;
export const BULK_IDLE_THRESHOLD_MS = 1200;
export const MAX_OFFLINE_CATCHUP_MS = 1000 * 60 * 60 * 24 * 7;
export const BACKGROUND_TICK_INTERVAL_MS = 1000;
export const EVOLUTION_ANIM_TOTAL_MS = 2480;
export const EVOLUTION_ANIM_WHITE_MS = 1120;
export const EVOLUTION_ANIM_FLASH_MS = 280;
export const EVOLUTION_ANIM_REVEAL_MS = 820;
export const EVOLUTION_ANIM_BACKDROP_FADE_MS = 320;
export const EVOLUTION_ANIM_PARTICLE_COUNT = 14;
export const HAPPINESS_EVOLUTION_BOX_REQUIRED_MS = 3 * 60 * 60 * 1000;
export const CABLE_LINK_METHOD_ITEM = "cable-link";
export const BACKGROUND_DRIFT_TRAVEL_MIN_MS = 9000;
export const BACKGROUND_DRIFT_TRAVEL_MAX_MS = 21000;
export const BACKGROUND_DRIFT_HOLD_MIN_MS = 1200;
export const BACKGROUND_DRIFT_HOLD_MAX_MS = 4200;
export const TEAM_LEVEL_UP_EFFECT_DURATION_MS = 780;
export const TEAM_XP_GAIN_EFFECT_DURATION_MS = 920;
export const TEAM_XP_PULSE_DURATION_MS = 360;
export const TUTORIAL_FLOW_ROUTE_1 = "route1_intro";
export const TUTORIAL_FLOW_EVOLUTION = "evolution_intro";
export const TUTORIAL_FLOW_APPEARANCE = "appearance_intro";
export const TUTORIAL_FLOW_DEFINITIONS = Object.freeze({
  [TUTORIAL_FLOW_ROUTE_1]: Object.freeze({
    saveFlag: "route1_intro_seen",
    title: "Tuto Route 1",
    pages: Object.freeze([
      Object.freeze({
        title: "Combats automatiques",
        lines: Object.freeze([
          "Ton equipe attaque automatiquement les Pokemon sauvages.",
          "Quand l'ennemi tombe KO, le suivant apparait apres un court delai.",
          "En ville, ou apres avoir debloque la zone suivante, clique un Pokemon d'equipe pour ouvrir les Boites.",
        ]),
      }),
      Object.freeze({
        title: "Poke Balls et captures",
        lines: Object.freeze([
          "Pour capturer, il te faut des Poke Balls dans l'inventaire.",
          "Les balls se reglent et s'achetent dans le Shop.",
          "Une capture critique a plus de chances de reussir.",
        ]),
      }),
      Object.freeze({
        title: "Argent et progression",
        lines: Object.freeze([
          "Battre des Pokemon rapporte de l'argent (Poke$).",
          "L'argent sert a acheter des balls, boosts et objets d'evolution.",
          "Chaque zone se debloque en battant 20 Pokemon d'affilee, avec 20 secondes max par combat.",
        ]),
      }),
      Object.freeze({
        title: "XP et niveaux",
        lines: Object.freeze([
          "Un KO donne de l'XP a toute l'equipe.",
          "Une capture donne le bonus d'XP restant.",
          "Les niveaux montent les stats et debloquent ensuite les evolutions.",
        ]),
      }),
    ]),
  }),
  [TUTORIAL_FLOW_EVOLUTION]: Object.freeze({
    saveFlag: "evolution_intro_seen",
    title: "Tuto Evolution",
    pages: Object.freeze([
      Object.freeze({
        title: "Comment evoluer",
        lines: Object.freeze([
          "Quand un Pokemon remplit ses conditions, une notif permanente apparait avant l'evolution.",
          "Utilise le bouton Evoluer dans cette notif pour lancer l'animation.",
          "Tu conserves l'ancienne entite et gagnes l'entite d'evolution niveau 1.",
        ]),
      }),
    ]),
  }),
  [TUTORIAL_FLOW_APPEARANCE]: Object.freeze({
    saveFlag: "appearance_intro_seen",
    title: "Tuto Apparence",
    pages: Object.freeze([
      Object.freeze({
        title: "Skins et apparence",
        lines: Object.freeze([
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
export const ULTRA_SHINY_HUE_CYCLE_MS = 7600;
export const ULTRA_SHINY_SCINTILLATION_PERIOD_MS = 1150;
export const ULTRA_SHINY_SCINTILLATION_FLASH_MS = 220;
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
export const DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON = false;
export const BREATH_MIN_PERIOD_MS = 2500;
export const BREATH_MAX_PERIOD_MS = 4100;
export const BREATH_BASE_AMPLITUDE = 0.022;
export const BREATH_AMPLITUDE_VARIATION = 0.014;
export const BREATH_SECONDARY_WEIGHT = 0.24;
export const BREATH_SIDE_COMPENSATION = 0.42;
export const BREATH_OFFSET_RATIO = 0.022;
export const MAX_RENDER_DPR = 1.35;
export const TARGET_FPS = 60;
export const TARGET_FRAME_MS = 1000 / TARGET_FPS;
export const TARGET_RENDER_INTERVAL_MS = Math.round(TARGET_FRAME_MS);
export const MAX_FOREGROUND_PENDING_MS = 320;
export const HUD_AUTO_REFRESH_INTERVAL_MS = 200;
export const LAYOUT_RECOMPUTE_INTERVAL_MS = 220;
export const DEFERRED_ROUTE_WARMUP_CHUNK_SIZE = 2;
export const DEFERRED_ROUTE_WARMUP_DELAY_MS = 180;
export const LOADING_SCREEN_EXIT_DURATION_MS = 820;
export const LOADING_SCREEN_DEFAULT_TEXT = "Le code de ce jeu a \u00e9t\u00e9 enti\u00e8rement g\u00e9n\u00e9r\u00e9 par IA.";
export const LOCAL_DAY_START_HOUR = 7;
export const LOCAL_NIGHT_START_HOUR = 19;
export const ENVIRONMENT_UPDATE_INTERVAL_MS = 120;
export const RENDER_QUALITY_ORDER = Object.freeze(["very_low", "low", "medium", "high", "ultra"]);
export const RENDER_QUALITY_PRESETS = Object.freeze({
  ultra: Object.freeze({
    maxDpr: 1.25,
    renderScale: 0.9,
    renderFrameIntervalMs: TARGET_RENDER_INTERVAL_MS,
    foregroundSimBudgetMs: 72,
    environmentParticleScale: 0.45,
    environmentUpdateIntervalMult: 1.3,
    fogLayerCount: 1,
    ambientOverlayEnabled: true,
    celebrationParticles: true,
    enemyHitGlow: false,
    levelUpParticleStride: 2,
    lightningGlow: false,
    vignette: false,
  }),
  high: Object.freeze({
    maxDpr: 1.08,
    renderScale: 0.84,
    renderFrameIntervalMs: TARGET_RENDER_INTERVAL_MS,
    foregroundSimBudgetMs: 64,
    environmentParticleScale: 0.22,
    environmentUpdateIntervalMult: 1.6,
    fogLayerCount: 1,
    ambientOverlayEnabled: true,
    celebrationParticles: true,
    enemyHitGlow: false,
    levelUpParticleStride: 3,
    lightningGlow: false,
    vignette: false,
  }),
  medium: Object.freeze({
    maxDpr: 1,
    renderScale: 0.78,
    renderFrameIntervalMs: TARGET_RENDER_INTERVAL_MS,
    foregroundSimBudgetMs: 56,
    environmentParticleScale: 0.06,
    environmentUpdateIntervalMult: 2,
    fogLayerCount: 0,
    ambientOverlayEnabled: false,
    celebrationParticles: false,
    enemyHitGlow: false,
    levelUpParticleStride: 4,
    lightningGlow: false,
    vignette: false,
  }),
  low: Object.freeze({
    maxDpr: 1,
    renderScale: 0.68,
    renderFrameIntervalMs: 20,
    foregroundSimBudgetMs: 48,
    environmentParticleScale: 0,
    environmentUpdateIntervalMult: 2.4,
    fogLayerCount: 0,
    ambientOverlayEnabled: false,
    celebrationParticles: false,
    enemyHitGlow: false,
    levelUpParticleStride: 5,
    lightningGlow: false,
    vignette: false,
  }),
  very_low: Object.freeze({
    maxDpr: 1,
    renderScale: 0.58,
    renderFrameIntervalMs: 24,
    foregroundSimBudgetMs: 40,
    environmentParticleScale: 0,
    environmentUpdateIntervalMult: 2.8,
    fogLayerCount: 0,
    ambientOverlayEnabled: false,
    celebrationParticles: false,
    enemyHitGlow: false,
    levelUpParticleStride: 6,
    lightningGlow: false,
    vignette: false,
  }),
});
export const PERF_SHORT_EMA_SMOOTHING = 0.18;
export const PERF_LONG_EMA_SMOOTHING = 0.045;
export const PERF_CPU_EMA_SMOOTHING = 0.14;
export const PERF_RENDER_EMA_SMOOTHING = 0.2;
export const PERF_SWITCH_COOLDOWN_MS = 900;
export const PERF_DOWNGRADE_STREAK = 9;
export const PERF_UPGRADE_STREAK = 170;
export const PERF_SLOW_FRAME_MARGIN_MS = 1.4;
export const PERF_VERY_SLOW_FRAME_MARGIN_MS = 4.6;
export const PERF_UPGRADE_HEADROOM_MS = 2.6;

export const BALL_TYPE_ORDER = ["hyper_ball", "super_ball", "poke_ball"];
export const BALL_TYPE_FALLBACK_ORDER = ["poke_ball", "super_ball", "hyper_ball"];
export const BALL_INVENTORY_MAX_PER_TYPE = 9999;
export const BALL_CAPTURE_RULE_CAPTURE_ALL = "capture_all";
export const BALL_CAPTURE_RULE_CAPTURE_UNOWNED = "capture_unowned";
export const BALL_CAPTURE_RULE_CAPTURE_OWNED = "capture_owned";
export const BALL_CAPTURE_RULE_CAPTURE_SHINY = "capture_shiny";
export const BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY = "capture_ultra_shiny";
export const BALL_OVERLAY_UI_STYLE_BY_TYPE = Object.freeze({
  poke_ball: Object.freeze({
    rowFillTop: "rgba(48, 67, 96, 0.96)",
    rowFillBottom: "rgba(27, 42, 64, 0.98)",
    rowBorder: "rgba(135, 169, 209, 0.86)",
    rowBorderActive: "rgba(135, 169, 209, 0.86)",
    text: "rgba(244, 250, 255, 0.98)",
    caption: "rgba(173, 206, 238, 0.94)",
    iconTop: "rgba(255, 241, 177, 0.98)",
    iconBottom: "rgba(238, 189, 74, 0.98)",
    gaugeStart: "rgba(236, 132, 90, 0.98)",
    gaugeEnd: "rgba(191, 73, 61, 0.98)",
    phaseOffset: 0.24,
    glow: "rgba(130, 186, 255, 0.34)",
  }),
  super_ball: Object.freeze({
    rowFillTop: "rgba(48, 67, 96, 0.96)",
    rowFillBottom: "rgba(27, 42, 64, 0.98)",
    rowBorder: "rgba(135, 169, 209, 0.86)",
    rowBorderActive: "rgba(135, 169, 209, 0.86)",
    text: "rgba(244, 250, 255, 0.98)",
    caption: "rgba(173, 206, 238, 0.94)",
    iconTop: "rgba(255, 241, 177, 0.98)",
    iconBottom: "rgba(238, 189, 74, 0.98)",
    gaugeStart: "rgba(121, 170, 255, 0.98)",
    gaugeEnd: "rgba(80, 111, 227, 0.98)",
    phaseOffset: 1.18,
    glow: "rgba(130, 186, 255, 0.34)",
  }),
  hyper_ball: Object.freeze({
    rowFillTop: "rgba(48, 67, 96, 0.96)",
    rowFillBottom: "rgba(27, 42, 64, 0.98)",
    rowBorder: "rgba(135, 169, 209, 0.86)",
    rowBorderActive: "rgba(135, 169, 209, 0.86)",
    text: "rgba(244, 250, 255, 0.98)",
    caption: "rgba(173, 206, 238, 0.94)",
    iconTop: "rgba(255, 241, 177, 0.98)",
    iconBottom: "rgba(238, 189, 74, 0.98)",
    gaugeStart: "rgba(246, 202, 105, 0.98)",
    gaugeEnd: "rgba(198, 134, 56, 0.98)",
    phaseOffset: 2.04,
    glow: "rgba(130, 186, 255, 0.34)",
  }),
});
export const BALL_OVERLAY_UI_STYLE_DEFAULT = Object.freeze({
  rowFillTop: "rgba(48, 67, 96, 0.96)",
  rowFillBottom: "rgba(27, 42, 64, 0.98)",
  rowBorder: "rgba(135, 169, 209, 0.86)",
  rowBorderActive: "rgba(135, 169, 209, 0.86)",
  text: "rgba(244, 250, 255, 0.98)",
  caption: "rgba(173, 206, 238, 0.94)",
  iconTop: "rgba(255, 241, 177, 0.98)",
  iconBottom: "rgba(238, 189, 74, 0.98)",
  gaugeStart: "rgba(144, 185, 255, 0.98)",
  gaugeEnd: "rgba(91, 123, 219, 0.98)",
  glow: "rgba(130, 186, 255, 0.34)",
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
export const ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS = 340;
