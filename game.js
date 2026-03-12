import {
  POKEIDLE_APP_VERSION,
  getDisplayedAppVersion,
  isProductionGithubPagesLocation,
  isVersionAtLeast,
} from "./version.js";
import { createAudioManager } from "./lib/audio-manager.js";
import {
  assertValidBallConfig,
  assertValidEncounter,
  assertValidShopItemConfig,
  parseCsvMethods,
  parseCsvObjects,
  parseSerializedSave,
  readCsvBooleanCell,
  readCsvCell,
  readCsvNumberCell,
  readCsvTypedValue,
  validatePokemonPayload,
  validateRouteDataPayload,
} from "./lib/runtime-data.js";
import {
  repairNormalizedSaveData,
  hasMeaningfulSaveProgress,
  getOwnedEntityIdsFromSave,
} from "./lib/save-consistency.js";
import {
  pickPreferredSaveCandidate,
  SAVE_SOURCE_INDEXED_DB,
  SAVE_SOURCE_LOCAL_STORAGE,
  SAVE_SOURCE_SESSION_STORAGE,
} from "./lib/browser-save-utils.js";
import {
  getPassiveBehaviorIdForTalentId,
  resolveCombatTurnDecision,
  TURN_ACTION_ATTACK,
} from "./lib/combat-passives.js";
import {
  TALENT_NONE_DESCRIPTION_FR,
  TALENT_NONE_ID,
  TALENT_NONE_NAME_FR,
  normalizeTalentDefinition,
  normalizeTalentId,
} from "./lib/talents.js";

const STARTER_CHOICES = [
  { id: 1, nameEn: "bulbasaur" },
  { id: 4, nameEn: "charmander" },
  { id: 7, nameEn: "squirtle" },
];

const DEFAULT_ROUTE_ID = "kanto_city_pallet_town";
const ROUTE_DATA_DIR = "map_data";
const ROUTE_ENCOUNTERS_CSV_PATH = "map_data/kanto_zone_encounters.csv";
const BALL_CONFIG_CSV_PATH = "item_data/pokeballs.csv";
const SHOP_ITEMS_CSV_PATH = "item_data/shop_items.csv";
const POKEMON_TALENTS_CSV_PATH = "pokemon_data/pokemon_talents.csv";
const ROUTE_ID_ORDER = [
  "kanto_city_pallet_town",
  "kanto_route_1",
  "kanto_city_viridian_city",
  "kanto_route_2",
  "kanto_dungeon_viridian_forest",
  "kanto_city_pewter_city",
  "kanto_route_3",
  "kanto_dungeon_mt_moon",
  "kanto_route_4",
  "kanto_city_cerulean_city",
  "kanto_route_24",
  "kanto_route_25",
  "kanto_route_5",
  "kanto_route_6",
  "kanto_city_vermilion_city",
  "kanto_route_11",
  "kanto_dungeon_digletts_cave",
  "kanto_route_9",
  "kanto_route_10",
  "kanto_dungeon_power_plant",
  "kanto_dungeon_rock_tunnel",
  "kanto_city_lavender_town",
  "kanto_dungeon_pokemon_tower",
  "kanto_route_8",
  "kanto_city_saffron_city",
  "kanto_route_7",
  "kanto_city_celadon_city",
  "kanto_route_16",
  "kanto_route_17",
  "kanto_route_18",
  "kanto_city_fuchsia_city",
  "kanto_dungeon_safari_zone",
  "kanto_route_15",
  "kanto_route_14",
  "kanto_route_13",
  "kanto_route_12",
  "kanto_route_19",
  "kanto_route_20",
  "kanto_dungeon_seafoam_islands",
  "kanto_city_cinnabar_island",
  "kanto_dungeon_pokemon_mansion",
  "kanto_route_21",
  "kanto_route_22",
  "kanto_route_23",
  "kanto_dungeon_victory_road",
  "kanto_city_indigo_plateau",
  "kanto_dungeon_cerulean_cave",
];
const ENCOUNTER_METHOD_UNLOCK_ROUTE_BY_ID = Object.freeze({
  "rock-smash": "kanto_dungeon_mt_moon",
  surf: "kanto_route_19",
  "old-rod": "kanto_city_lavender_town",
  "good-rod": "kanto_route_19",
  "super-rod": "kanto_route_19",
  pokeflute: "kanto_city_celadon_city",
});
const ENCOUNTER_METHOD_ALWAYS_UNLOCKED = Object.freeze({
  walk: true,
  gift: true,
});
const ENCOUNTER_METHOD_ONLY_ONE = "only-one";
const ENCOUNTER_METHOD_DISABLED = Object.freeze({
  [ENCOUNTER_METHOD_ONLY_ONE]: true,
});
const ENCOUNTER_METHOD_ONLY_ONE_ALLOW_SET = new Set([ENCOUNTER_METHOD_ONLY_ONE]);
const MAP_REFERENCE_IMAGE_PATH = "assets/maps/kanto_map_reference_user.png";
const MAP_MARKER_OVERRIDES_BY_ROUTE_ID = Object.freeze({
  kanto_route_1: Object.freeze({ x: 24.561, y: 55.11 }),
  kanto_route_2: Object.freeze({ x: 24.561, y: 37.914 }),
  kanto_route_3: Object.freeze({ x: 36.914, y: 20.373 }),
  kanto_route_4: Object.freeze({ x: 55.176, y: 16.851 }),
  kanto_route_5: Object.freeze({ x: 65.234, y: 27.693 }),
  kanto_route_6: Object.freeze({ x: 65.234, y: 41.644 }),
  kanto_route_7: Object.freeze({ x: 59.717, y: 35.152 }),
  kanto_route_8: Object.freeze({ x: 77.783, y: 35.083 }),
  kanto_route_9: Object.freeze({ x: 76.172, y: 17.818 }),
  kanto_route_10: Object.freeze({ x: 87.451, y: 28.108 }),
  kanto_route_11: Object.freeze({ x: 77.686, y: 55.318 }),
  kanto_route_12: Object.freeze({ x: 87.5, y: 46.961 }),
  kanto_route_13: Object.freeze({ x: 78.369, y: 71.616 }),
  kanto_route_14: Object.freeze({ x: 57.031, y: 76.243 }),
  kanto_route_15: Object.freeze({ x: 47.803, y: 80.18 }),
  kanto_route_16: Object.freeze({ x: 44.385, y: 31.077 }),
  kanto_route_17: Object.freeze({ x: 36.084, y: 50.345 }),
  kanto_route_18: Object.freeze({ x: 43.555, y: 80.663 }),
  kanto_route_19: Object.freeze({ x: 50.195, y: 84.945 }),
  kanto_route_20: Object.freeze({ x: 60.547, y: 95.856 }),
  kanto_route_21: Object.freeze({ x: 22.461, y: 82.044 }),
  kanto_route_22: Object.freeze({ x: 18.994, y: 46.892 }),
  kanto_route_23: Object.freeze({ x: 11.963, y: 37.845 }),
  kanto_route_24: Object.freeze({ x: 65.186, y: 10.635 }),
  kanto_route_25: Object.freeze({ x: 71.045, y: 5.939 }),
  kanto_city_pallet_town: Object.freeze({ x: 24.561, y: 64.779 }),
  kanto_city_viridian_city: Object.freeze({ x: 24.561, y: 46.754 }),
  kanto_city_pewter_city: Object.freeze({ x: 24.561, y: 20.649 }),
  kanto_city_cerulean_city: Object.freeze({ x: 65.186, y: 16.713 }),
  kanto_city_vermilion_city: Object.freeze({ x: 65.186, y: 55.11 }),
  kanto_city_lavender_town: Object.freeze({ x: 87.451, y: 35.221 }),
  kanto_city_saffron_city: Object.freeze({ x: 65.186, y: 35.014 }),
  kanto_city_celadon_city: Object.freeze({ x: 48.193, y: 31.146 }),
  kanto_city_fuchsia_city: Object.freeze({ x: 50.195, y: 80.456 }),
  kanto_city_cinnabar_island: Object.freeze({ x: 22.656, y: 94.682 }),
  kanto_city_indigo_plateau: Object.freeze({ x: 12.012, y: 16.298 }),
  kanto_dungeon_viridian_forest: Object.freeze({ x: 24.072, y: 30.525 }),
  kanto_dungeon_mt_moon: Object.freeze({ x: 46.387, y: 17.127 }),
  kanto_dungeon_digletts_cave: Object.freeze({ x: 23.047, y: 32.32 }),
  kanto_dungeon_power_plant: Object.freeze({ x: 82.422, y: 5.87 }),
  kanto_dungeon_rock_tunnel: Object.freeze({ x: 87.451, y: 17.887 }),
  kanto_dungeon_pokemon_tower: Object.freeze({ x: 91.992, y: 33.494 }),
  kanto_dungeon_safari_zone: Object.freeze({ x: 52.148, y: 66.022 }),
  kanto_dungeon_seafoam_islands: Object.freeze({ x: 39.062, y: 95.994 }),
  kanto_dungeon_pokemon_mansion: Object.freeze({ x: 24.609, y: 91.367 }),
  kanto_dungeon_victory_road: Object.freeze({ x: 12.012, y: 21.547 }),
  kanto_dungeon_cerulean_cave: Object.freeze({ x: 61.914, y: 29.834 }),
});
const ROUTE_UNLOCK_DEFEATS = 20;
const ROUTE_DEFEAT_TIMER_MS = 20000;
const ONLY_ONE_ENCOUNTER_INTERVAL = 50;
const ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN = ONLY_ONE_ENCOUNTER_INTERVAL - 1;
const ONLY_ONE_ENCOUNTER_HP_MULTIPLIER = 3;
const ONLY_ONE_ENCOUNTER_TIMER_MS = 150000;
const ENEMY_TIMER_STYLE_ROUTE = "route";
const ENEMY_TIMER_STYLE_ONLY_ONE = "only-one";
const ROUTE_1_TUTORIAL_ID = "kanto_route_1";
const SAVE_KEY = "pokeidle_save_v3";
const SAVE_SESSION_KEY = "pokeidle_save_v3_session";
const SAVE_INDEXED_DB_NAME = "pokeidle_browser_save_v1";
const SAVE_INDEXED_DB_STORE_NAME = "save_payloads";
const SAVE_INDEXED_DB_RECORD_KEY = "main";
const DEV_SEED_SAVE_QUERY_PARAM = "dev_seed_save";
const WINDOWS_NOTIFICATION_PREF_KEY = "pokeidle_windows_notifications_enabled_v1";
const SHINY_ODDS = 2048;
const ULTRA_SHINY_ODDS = 8192;
const SAVE_VERSION = 6;
const MIN_SUPPORTED_SAVE_VERSION = 0;
const MIN_SUPPORTED_SAVE_APP_VERSION = "0.1.3";
const APP_VERSION = POKEIDLE_APP_VERSION;
const DISPLAY_APP_VERSION = getDisplayedAppVersion(window.location, APP_VERSION);
const SPRITE_VARIANT_BASE_PRICE = 900;
const SPRITE_VARIANT_GEN_PRICE_STEP = 230;
const SPRITE_VARIANT_INDEX_PRICE_STEP = 120;
const DEFAULT_POKEMON_SPRITE_VARIANT_PREFERENCE = Object.freeze([
  "firered_leafgreen",
  "emerald",
  "ruby_sapphire",
  "heartgold_soulsilver",
  "platinum",
  "diamond_pearl",
  "crystal",
  "gold_silver",
  "yellow",
  "green",
  "red_blue",
  "transparent",
  "default",
]);
const TYPE_ICON_ASSET_DIR = "assets/type-icons";
const TYPE_ICON_TYPES = Object.freeze([
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);
const TYPE_LABELS_FR = Object.freeze({
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Electrik",
  grass: "Plante",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Tenebres",
  steel: "Acier",
  fairy: "Fee",
});
const TEAM_LEFT_SIDE_SLOT_INDEXES = new Set([0, 4, 5]);
const MAX_TEAM_SIZE = 6;
const TALENT_KEEN_EYE_ID = "KEEN_EYE";
const TALENT_VALIANT_EYE_ID = "VALIANT_EYE";
const TALENT_MORPHING_ID = "MORPHING";
const TALENT_MIND_CONTROL_ID = "MIND_CONTROL";
const TALENT_ORIGIN_MIMICRY_ID = "ORIGIN_MIMICRY";
const TALENT_OVERGROW_ID = "OVERGROW";
const TALENT_OVERGROW_PLUS_ID = "OVERGROW_PLUS";
const TALENT_OVERGROW_PLUS_PLUS_ID = "OVERGROW_PLUS_PLUS";
const TALENT_BLAZE_ID = "BLAZE";
const TALENT_BLAZE_PLUS_ID = "BLAZE_PLUS";
const TALENT_BLAZE_PLUS_PLUS_ID = "BLAZE_PLUS_PLUS";
const TALENT_TORRENT_ID = "TORRENT";
const TALENT_TORRENT_PLUS_ID = "TORRENT_PLUS";
const TALENT_TORRENT_PLUS_PLUS_ID = "TORRENT_PLUS_PLUS";
const TALENT_AURA_PROVIDER_BY_ID = Object.freeze({
  [TALENT_OVERGROW_ID]: Object.freeze({ offensiveType: "grass", attackBonus: 0.05 }),
  [TALENT_OVERGROW_PLUS_ID]: Object.freeze({ offensiveType: "grass", attackBonus: 0.1 }),
  [TALENT_OVERGROW_PLUS_PLUS_ID]: Object.freeze({ offensiveType: "grass", attackBonus: 0.15 }),
  [TALENT_BLAZE_ID]: Object.freeze({ offensiveType: "fire", attackBonus: 0.05 }),
  [TALENT_BLAZE_PLUS_ID]: Object.freeze({ offensiveType: "fire", attackBonus: 0.1 }),
  [TALENT_BLAZE_PLUS_PLUS_ID]: Object.freeze({ offensiveType: "fire", attackBonus: 0.15 }),
  [TALENT_TORRENT_ID]: Object.freeze({ offensiveType: "water", attackBonus: 0.05 }),
  [TALENT_TORRENT_PLUS_ID]: Object.freeze({ offensiveType: "water", attackBonus: 0.1 }),
  [TALENT_TORRENT_PLUS_PLUS_ID]: Object.freeze({ offensiveType: "water", attackBonus: 0.15 }),
});
const TALENT_ALWAYS_HIT_IDS = new Set([TALENT_KEEN_EYE_ID, TALENT_VALIANT_EYE_ID]);
const TALENT_CRIT_BONUS_CHANCE_BY_ID = Object.freeze({
  [TALENT_VALIANT_EYE_ID]: 0.1,
});
const MORPHING_SHADER_CONFIG = Object.freeze({
  hueRotateDeg: -18,
  saturate: 1.55,
  brightness: 1.05,
  contrast: 1.12,
});
const BASE_STEP_MS = 1000 / 60;
const ATTACK_INTERVAL_MS = 420;
const ATTACK_CRIT_CHANCE = 0.05;
const ATTACK_MISS_CHANCE = 0.05;
const ATTACK_CRIT_MULTIPLIER = 1.5;
const STARTER_LEVEL = 1;
const PROJECTILE_SPEED_PX_PER_SECOND = 520;
const DAMAGE_SCALE = 2.2;
const DAMAGE_LEVEL_PROGRESSION_EXPONENT = 0.62;
const KO_RESPAWN_DELAY_MS = 420;
const KO_ANIMATION_DURATION_MS = 210;
const ATTACK_FLASH_DURATION_MS = 150;
const ATTACK_FLASH_WHITE_BLEND = 0.4;
const ATTACK_CHARGE_MIN_WINDOW_MS = 120;
const ATTACK_CHARGE_WINDOW_RATIO = 0.42;
const ENEMY_DAMAGE_FLASH_DURATION_MS = 150;
const ENEMY_DAMAGE_FLASH_RED_BLEND = 0.4;
const FLOATING_TEXT_LIFETIME_MS = 950;
const MONEY_COUNTER_LERP_MS = 180;
const MONEY_COUNTER_PULSE_MS = 520;
const PROJECTILE_SPRITE_PX = 72;
const PROJECTILE_TRAIL_POINT_LIFETIME_MS = 170;
const PROJECTILE_TRAIL_MAX_POINTS = 10;
const CAPTURE_THROW_MS = 360;
const CAPTURE_SHAKE_MS = 560;
const CAPTURE_SUCCESS_BURST_MS = 560;
const CAPTURE_FAIL_BREAK_MS = 420;
const CAPTURE_FAIL_REAPPEAR_MS = 460;
const CAPTURE_POST_MS = 230;
const CAPTURE_CRIT_CHANCE = 0.1;
const CAPTURE_CRIT_MULTIPLIER = 2;
const CAPTURE_BALL_MULTIPLIER_NERF = 0.5;
const COIN_REWARD_PER_CAPTURE = 1;
const COIN_REWARD_FIRST_CAPTURE_BONUS = 5;
const COIN_REWARD_PER_EVOLUTION = 3;
const COIN_REWARD_FAMILY_OWNED_CAPTURE_CHANCE = 0.2;
const TEAM_SPRITE_SCALE = 1.18;
const POKEMON_DATA_SPRITE_SCALE_MIN = 0.8;
const POKEMON_DATA_SPRITE_SCALE_MAX = 1.2;
const MAX_LEVEL = 100;
const SHOP_TAB_POKEBALLS = "pokeballs";
const SHOP_TAB_COMBAT = "combat";
const SHOP_TAB_EVOLUTIONS = "evolutions";
const SHOP_QUANTITY_MODE_CUSTOM = "custom";
const SHOP_QUANTITY_MODE_MAX = "max";
const SHOP_QUANTITY_PRESET_VALUES = Object.freeze(["1", "5", "10", "50", "100"]);
const SHOP_QUANTITY_PRESET_SET = new Set(SHOP_QUANTITY_PRESET_VALUES);
const BOOST_X_DURATION_MS = 2 * 60 * 1000;
const BOOST_X_ATTACK_INTERVAL_MULTIPLIER = 0.33;
const DEFAULT_WILD_LEVEL_MIN = 2;
const DEFAULT_WILD_LEVEL_MAX = 6;
const ENEMY_MONEY_BASE = 16;
const ENEMY_MONEY_LEVEL_MULT = 9;
const ENEMY_MONEY_STAT_FACTOR = 0.06;
const CAPTURE_XP_BASE = 10;
const CAPTURE_XP_LEVEL_MULT = 5;
const CAPTURE_XP_STAT_FACTOR = 0.024;
const KO_XP_RATIO_OF_CAPTURE = 0.3;
const LEVEL_PROGRESSION_LINEAR_PER_STEP = 0.055;
const LEVEL_PROGRESSION_CURVE_EXPONENT = 1.52;
const LEVEL_PROGRESSION_CURVE_PER_STEP = 0.038;
const ENEMY_HP_TEAM_SCALE_MAX_BONUS = 1.8;
const ENEMY_HP_TEAM_SCALE_EXPONENT = 1.12;
const ENEMY_REWARD_SCALE_EXPONENT = 0.45;
const ENEMY_REWARD_SCALE_BLEND = 0.7;
const APPEARANCE_UNLOCK_LEVEL = 10;
const POKEMON_NICKNAME_MAX_LENGTH = 14;
const FOREGROUND_FRAME_STEP_MS = 40;
const HIDDEN_SIM_BUDGET_MS = 180000;
const BULK_IDLE_THRESHOLD_MS = 1200;
const MAX_OFFLINE_CATCHUP_MS = 1000 * 60 * 60 * 24 * 7;
const BACKGROUND_TICK_INTERVAL_MS = 1000;
const EVOLUTION_ANIM_TOTAL_MS = 2480;
const EVOLUTION_ANIM_WHITE_MS = 1120;
const EVOLUTION_ANIM_FLASH_MS = 280;
const EVOLUTION_ANIM_REVEAL_MS = 820;
const EVOLUTION_ANIM_BACKDROP_FADE_MS = 320;
const EVOLUTION_ANIM_PARTICLE_COUNT = 14;
const HAPPINESS_EVOLUTION_BOX_REQUIRED_MS = 3 * 60 * 60 * 1000;
const CABLE_LINK_METHOD_ITEM = "cable-link";
const BACKGROUND_DRIFT_TRAVEL_MIN_MS = 9000;
const BACKGROUND_DRIFT_TRAVEL_MAX_MS = 21000;
const BACKGROUND_DRIFT_HOLD_MIN_MS = 1200;
const BACKGROUND_DRIFT_HOLD_MAX_MS = 4200;
const TEAM_LEVEL_UP_EFFECT_DURATION_MS = 780;
const TEAM_XP_GAIN_EFFECT_DURATION_MS = 920;
const TEAM_XP_PULSE_DURATION_MS = 360;
const TUTORIAL_FLOW_ROUTE_1 = "route1_intro";
const TUTORIAL_FLOW_EVOLUTION = "evolution_intro";
const TUTORIAL_FLOW_APPEARANCE = "appearance_intro";
const TUTORIAL_FLOW_DEFINITIONS = Object.freeze({
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
          "Des qu'un Pokemon de ton equipe atteint le niveau 10, l'editeur d'apparence se debloque.",
          "Fais clic droit sur un Pokemon de ta team pour ouvrir ses skins.",
          "Tu peux acheter des sprites non possedes et equiper ceux debloques.",
        ]),
      }),
    ]),
  }),
});
const WEATHER_CHANGE_INTERVAL_MS = 30 * 60 * 1000;
const WEATHER_TRANSITION_DURATION_MS = 90 * 1000;
const WEATHER_LIGHTNING_WINDOW_MS = 1700;
const POKEMON_BACKDROP_ALPHA = 0.5;
const POKEMON_BACKDROP_RADIUS_RATIO = 0.36;
const POKEMON_SHADOW_ALPHA = 0.52;
const ULTRA_SHINY_HUE_CYCLE_MS = 7600;
const ULTRA_SHINY_SCINTILLATION_PERIOD_MS = 1150;
const ULTRA_SHINY_SCINTILLATION_FLASH_MS = 220;
const ULTRA_SHINY_OUTLINE_PX = 2;
const DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON = false;
const BREATH_MIN_PERIOD_MS = 2500;
const BREATH_MAX_PERIOD_MS = 4100;
const BREATH_BASE_AMPLITUDE = 0.022;
const BREATH_AMPLITUDE_VARIATION = 0.014;
const BREATH_SECONDARY_WEIGHT = 0.24;
const BREATH_SIDE_COMPENSATION = 0.42;
const BREATH_OFFSET_RATIO = 0.022;
const MAX_RENDER_DPR = 1.35;
const TARGET_FPS = 60;
const TARGET_FRAME_MS = 1000 / TARGET_FPS;
const TARGET_RENDER_INTERVAL_MS = Math.round(TARGET_FRAME_MS);
const MAX_FOREGROUND_PENDING_MS = 320;
const HUD_AUTO_REFRESH_INTERVAL_MS = 200;
const ENVIRONMENT_UPDATE_INTERVAL_MS = 120;
const RENDER_QUALITY_ORDER = Object.freeze(["very_low", "low", "medium", "high", "ultra"]);
const RENDER_QUALITY_PRESETS = Object.freeze({
  ultra: Object.freeze({
    maxDpr: 1.25,
    renderScale: 0.9,
    renderFrameIntervalMs: TARGET_RENDER_INTERVAL_MS,
    foregroundSimBudgetMs: 72,
    environmentParticleScale: 0.45,
    environmentUpdateIntervalMult: 1.3,
    fogLayerCount: 1,
    projectileTrailStride: 1,
    projectileTrailMaxPoints: 6,
    projectileTrailGlow: false,
    projectileStreak: true,
    projectileAura: false,
    projectileAuraScale: 0.8,
    projectileTrailEnabled: true,
    projectileSpriteDetail: true,
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
    projectileTrailStride: 2,
    projectileTrailMaxPoints: 4,
    projectileTrailGlow: false,
    projectileStreak: false,
    projectileAura: false,
    projectileAuraScale: 0.68,
    projectileTrailEnabled: true,
    projectileSpriteDetail: true,
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
    projectileTrailStride: 4,
    projectileTrailMaxPoints: 0,
    projectileTrailGlow: false,
    projectileStreak: false,
    projectileAura: false,
    projectileAuraScale: 0.5,
    projectileTrailEnabled: false,
    projectileSpriteDetail: false,
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
    renderFrameIntervalMs: TARGET_RENDER_INTERVAL_MS,
    foregroundSimBudgetMs: 48,
    environmentParticleScale: 0,
    environmentUpdateIntervalMult: 2.4,
    fogLayerCount: 0,
    projectileTrailStride: 4,
    projectileTrailMaxPoints: 0,
    projectileTrailGlow: false,
    projectileStreak: false,
    projectileAura: false,
    projectileAuraScale: 0.45,
    projectileTrailEnabled: false,
    projectileSpriteDetail: false,
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
    renderFrameIntervalMs: TARGET_RENDER_INTERVAL_MS,
    foregroundSimBudgetMs: 40,
    environmentParticleScale: 0,
    environmentUpdateIntervalMult: 2.8,
    fogLayerCount: 0,
    projectileTrailStride: 4,
    projectileTrailMaxPoints: 0,
    projectileTrailGlow: false,
    projectileStreak: false,
    projectileAura: false,
    projectileAuraScale: 0.4,
    projectileTrailEnabled: false,
    projectileSpriteDetail: false,
    ambientOverlayEnabled: false,
    celebrationParticles: false,
    enemyHitGlow: false,
    levelUpParticleStride: 6,
    lightningGlow: false,
    vignette: false,
  }),
});
const PERF_SHORT_EMA_SMOOTHING = 0.18;
const PERF_LONG_EMA_SMOOTHING = 0.045;
const PERF_CPU_EMA_SMOOTHING = 0.14;
const PERF_RENDER_EMA_SMOOTHING = 0.2;
const PERF_SWITCH_COOLDOWN_MS = 900;
const PERF_DOWNGRADE_STREAK = 9;
const PERF_UPGRADE_STREAK = 170;
const PERF_SLOW_FRAME_MARGIN_MS = 1.4;
const PERF_VERY_SLOW_FRAME_MARGIN_MS = 4.6;
const PERF_UPGRADE_HEADROOM_MS = 2.6;

const BALL_TYPE_ORDER = ["hyper_ball", "super_ball", "poke_ball"];
const BALL_TYPE_FALLBACK_ORDER = ["poke_ball", "super_ball", "hyper_ball"];
const BALL_INVENTORY_MAX_PER_TYPE = 9999;
const BALL_CAPTURE_RULE_CAPTURE_ALL = "capture_all";
const BALL_CAPTURE_RULE_CAPTURE_UNOWNED = "capture_unowned";
const BALL_CAPTURE_RULE_CAPTURE_SHINY = "capture_shiny";
const BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY = "capture_ultra_shiny";
const WEATHER_TYPES = ["neutral", "sunny", "rainy", "foggy", "storm"];
const WEATHER_WEIGHT_TABLE = [
  { type: "neutral", weight: 40 },
  { type: "sunny", weight: 20 },
  { type: "rainy", weight: 20 },
  { type: "foggy", weight: 10 },
  { type: "storm", weight: 10 },
];
const WEATHER_PROFILE_BY_TYPE = {
  neutral: {
    label: "Neutre",
    gradeOverlayColor: [255, 255, 255],
    gradeOverlayAlpha: 0,
    gradeScreenColor: [255, 255, 255],
    gradeScreenAlpha: 0,
    rain: 0,
    fog: 0,
    sun: 0,
    storm: 0,
  },
  sunny: {
    label: "Ensoleille",
    gradeOverlayColor: [255, 228, 168],
    gradeOverlayAlpha: 0.08,
    gradeScreenColor: [255, 244, 206],
    gradeScreenAlpha: 0.14,
    rain: 0,
    fog: 0.06,
    sun: 1,
    storm: 0,
  },
  rainy: {
    label: "Pluvieux",
    gradeOverlayColor: [78, 112, 160],
    gradeOverlayAlpha: 0.17,
    gradeScreenColor: [158, 214, 255],
    gradeScreenAlpha: 0.045,
    rain: 1,
    fog: 0.14,
    sun: 0,
    storm: 0,
  },
  foggy: {
    label: "Brumeux",
    gradeOverlayColor: [152, 168, 184],
    gradeOverlayAlpha: 0.2,
    gradeScreenColor: [228, 238, 255],
    gradeScreenAlpha: 0.05,
    rain: 0,
    fog: 0.5,
    sun: 0,
    storm: 0,
  },
  storm: {
    label: "Orage",
    gradeOverlayColor: [44, 70, 118],
    gradeOverlayAlpha: 0.3,
    gradeScreenColor: [168, 204, 255],
    gradeScreenAlpha: 0.04,
    rain: 1.6,
    fog: 0.24,
    sun: 0,
    storm: 1,
  },
};
function cloneConfigMap(source) {
  const clone = {};
  const entries = source && typeof source === "object" ? Object.entries(source) : [];
  for (const [key, value] of entries) {
    clone[key] = value && typeof value === "object" ? { ...value } : value;
  }
  return clone;
}

function replaceConfigMap(target, nextSource) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  for (const [key, value] of Object.entries(nextSource || {})) {
    target[key] = value && typeof value === "object" ? { ...value } : value;
  }
}

function replaceArrayContents(target, nextValues) {
  target.length = 0;
  const values = Array.isArray(nextValues) ? nextValues : [];
  for (const value of values) {
    target.push(value);
  }
}

function createDefaultBallConfigByType() {
  return {
    poke_ball: {
      type: "poke_ball",
      nameFr: "PokeBall",
      price: 350,
      captureMultiplier: 1,
      description: "Balle standard pour capturer les Pokemon sauvages.",
      spritePath: "assets/items/poke_ball.png",
      comingSoon: false,
      sortOrder: 10,
    },
    super_ball: {
      type: "super_ball",
      nameFr: "SuperBall",
      price: 10000,
      captureMultiplier: 2,
      description: "x2 chances de capture par rapport a une PokeBall.",
      spritePath: "assets/items/super_ball.png",
      comingSoon: false,
      sortOrder: 20,
    },
    hyper_ball: {
      type: "hyper_ball",
      nameFr: "HyperBall",
      price: 150000,
      captureMultiplier: 4,
      description: "x2 chances de capture par rapport a une SuperBall.",
      spritePath: "assets/items/hyper_ball.png",
      comingSoon: false,
      sortOrder: 30,
    },
  };
}

function createDefaultEvolutionStoneConfigByType() {
  return {
    water_stone: {
      type: "water_stone",
      nameFr: "Pierre Eau",
      price: 100000,
      spritePath: "assets/items/water_stone.png",
      methodItem: "water-stone",
    },
    fire_stone: {
      type: "fire_stone",
      nameFr: "Pierre Feu",
      price: 100000,
      spritePath: "assets/items/fire_stone.png",
      methodItem: "fire-stone",
    },
    leaf_stone: {
      type: "leaf_stone",
      nameFr: "Pierre Plante",
      price: 100000,
      spritePath: "assets/items/leaf_stone.png",
      methodItem: "leaf-stone",
    },
  };
}

function createDefaultExtraShopItemConfigById(stoneConfigByType = createDefaultEvolutionStoneConfigByType()) {
  return {
    x_boost: {
      id: "x_boost",
      category: SHOP_TAB_COMBAT,
      nameFr: "Boost X",
      description: "Multiplie l'intervalle d'attaque par 0.33 pendant 2 minutes.",
      price: 20000,
      spritePath: "assets/items/x_boost.png",
      itemType: "boost",
      effectKind: "attack_interval_multiplier",
      effectValue: 0.33,
      effectDurationMs: BOOST_X_DURATION_MS,
      stockTracked: false,
      sortOrder: 10,
    },
    water_stone: {
      id: "water_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.water_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.water_stone.price,
      spritePath: stoneConfigByType.water_stone.spritePath,
      itemType: "stone",
      stoneType: "water_stone",
      methodItem: stoneConfigByType.water_stone.methodItem,
      stockTracked: true,
      sortOrder: 10,
    },
    fire_stone: {
      id: "fire_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.fire_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.fire_stone.price,
      spritePath: stoneConfigByType.fire_stone.spritePath,
      itemType: "stone",
      stoneType: "fire_stone",
      methodItem: stoneConfigByType.fire_stone.methodItem,
      stockTracked: true,
      sortOrder: 20,
    },
    leaf_stone: {
      id: "leaf_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.leaf_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.leaf_stone.price,
      spritePath: stoneConfigByType.leaf_stone.spritePath,
      itemType: "stone",
      stoneType: "leaf_stone",
      methodItem: stoneConfigByType.leaf_stone.methodItem,
      stockTracked: true,
      sortOrder: 30,
    },
  };
}

function createShopItemConfigById(ballConfigByType = createDefaultBallConfigByType(), extraShopItemsById = {}) {
  const shopItems = {};
  for (const ballConfig of Object.values(ballConfigByType)) {
    if (!ballConfig?.type) {
      continue;
    }
    shopItems[ballConfig.type] = {
      id: ballConfig.type,
      category: SHOP_TAB_POKEBALLS,
      nameFr: ballConfig.nameFr,
      description: ballConfig.description,
      price: ballConfig.price,
      spritePath: ballConfig.spritePath,
      itemType: "ball",
      ballType: ballConfig.type,
      sortOrder: Math.max(0, toSafeInt(ballConfig.sortOrder, 0)),
    };
  }
  for (const [id, item] of Object.entries(extraShopItemsById || {})) {
    if (!id || !item || typeof item !== "object") {
      continue;
    }
    shopItems[id] = { ...item };
  }
  return shopItems;
}

const DEFAULT_BALL_CONFIG_BY_TYPE = createDefaultBallConfigByType();
const DEFAULT_EVOLUTION_STONE_CONFIG_BY_TYPE = createDefaultEvolutionStoneConfigByType();
const DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID = createDefaultExtraShopItemConfigById(DEFAULT_EVOLUTION_STONE_CONFIG_BY_TYPE);
const BALL_CONFIG_BY_TYPE = cloneConfigMap(DEFAULT_BALL_CONFIG_BY_TYPE);
const COMING_SOON_BALL_TYPES = new Set();
const EVOLUTION_STONE_CONFIG_BY_TYPE = cloneConfigMap(DEFAULT_EVOLUTION_STONE_CONFIG_BY_TYPE);
const EXTRA_SHOP_ITEM_CONFIG_BY_ID = cloneConfigMap(DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID);
const SHOP_ITEM_CONFIG_BY_ID = createShopItemConfigById(BALL_CONFIG_BY_TYPE, EXTRA_SHOP_ITEM_CONFIG_BY_ID);

function getSortedBallConfigs() {
  return Object.values(BALL_CONFIG_BY_TYPE)
    .filter((entry) => entry && typeof entry === "object" && entry.type)
    .sort(
      (a, b) =>
        Math.max(0, toSafeInt(a?.sortOrder, 0)) - Math.max(0, toSafeInt(b?.sortOrder, 0))
        || String(a?.nameFr || a?.type || "").localeCompare(String(b?.nameFr || b?.type || "")),
    );
}

function getDefaultActiveBallType() {
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, "poke_ball")) {
    return "poke_ball";
  }
  const ordered = getSortedBallConfigs();
  if (ordered.length > 0) {
    return String(ordered[0].type || "poke_ball");
  }
  return "poke_ball";
}

function getLegacyBallBackfillType() {
  return getDefaultActiveBallType();
}

function refreshBallConfigDerivedState() {
  const sortedBallConfigs = getSortedBallConfigs();
  const uiOrder = sortedBallConfigs.map((entry) => entry.type).filter(Boolean);
  replaceArrayContents(BALL_TYPE_FALLBACK_ORDER, uiOrder);
  replaceArrayContents(
    BALL_TYPE_ORDER,
    sortedBallConfigs
      .slice()
      .sort(
        (a, b) =>
          Math.max(0, Number(b?.captureMultiplier || 0)) - Math.max(0, Number(a?.captureMultiplier || 0))
          || Math.max(0, toSafeInt(a?.sortOrder, 0)) - Math.max(0, toSafeInt(b?.sortOrder, 0)),
      )
      .map((entry) => entry.type)
      .filter(Boolean),
  );
  COMING_SOON_BALL_TYPES.clear();
  for (const entry of sortedBallConfigs) {
    if (entry.comingSoon) {
      COMING_SOON_BALL_TYPES.add(entry.type);
    }
  }
}

function rebuildEvolutionStoneConfigState(extraShopItemsById = EXTRA_SHOP_ITEM_CONFIG_BY_ID) {
  const nextStoneConfigByType = {};
  for (const item of Object.values(extraShopItemsById || {})) {
    if (!item || item.itemType !== "stone") {
      continue;
    }
    const stoneType = String(item.stoneType || item.id || "").toLowerCase().trim();
    if (!stoneType) {
      continue;
    }
    nextStoneConfigByType[stoneType] = {
      type: stoneType,
      nameFr: item.nameFr,
      price: Math.max(0, toSafeInt(item.price, 0)),
      spritePath: String(item.spritePath || ""),
      methodItem: String(item.methodItem || ""),
    };
  }
  replaceConfigMap(EVOLUTION_STONE_CONFIG_BY_TYPE, nextStoneConfigByType);
}

function rebuildShopItemConfigState() {
  replaceConfigMap(SHOP_ITEM_CONFIG_BY_ID, createShopItemConfigById(BALL_CONFIG_BY_TYPE, EXTRA_SHOP_ITEM_CONFIG_BY_ID));
}

refreshBallConfigDerivedState();
rebuildEvolutionStoneConfigState(EXTRA_SHOP_ITEM_CONFIG_BY_ID);
rebuildShopItemConfigState();

const SPECIAL_ATTACK_TYPES = new Set([
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "psychic",
  "dragon",
  "dark",
]);

const TYPE_EFFECTIVENESS = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5, ice: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    fairy: 2,
    steel: 0.5,
  },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const TYPE_COLORS = {
  normal: [210, 200, 180],
  fire: [255, 122, 64],
  water: [76, 163, 255],
  electric: [255, 214, 60],
  grass: [122, 206, 106],
  ice: [145, 239, 255],
  fighting: [222, 92, 88],
  poison: [190, 98, 230],
  ground: [218, 176, 92],
  flying: [150, 178, 255],
  psychic: [255, 120, 185],
  bug: [175, 201, 75],
  rock: [191, 166, 110],
  ghost: [145, 120, 226],
  dragon: [117, 117, 255],
  dark: [124, 108, 97],
  steel: [163, 184, 199],
  fairy: [255, 176, 219],
};

const canvas = document.getElementById("game-canvas");
const ctx =
  canvas.getContext("2d", { alpha: false, desynchronized: true }) ||
  canvas.getContext("2d");
const spriteTintBufferCanvas = document.createElement("canvas");
const spriteTintBufferCtx = spriteTintBufferCanvas.getContext("2d");
const gameStageEl = document.getElementById("game-stage");
const gameOverlayEl = document.querySelector(".game-overlay");
const uiTopbarEl = document.querySelector(".ui-topbar");
const actionDockEl = document.querySelector(".action-dock");
const starterModalEl = document.getElementById("starter-modal");
const starterChoicesEl = document.getElementById("starter-choices");
const hoverPopupEl = document.getElementById("hover-popup");
const teamContextMenuEl = document.getElementById("team-context-menu");
const teamContextMenuTitleEl = document.getElementById("team-context-menu-title");
const teamContextMenuRenameButtonEl = document.getElementById("team-context-menu-rename");
const teamContextMenuBoxesButtonEl = document.getElementById("team-context-menu-boxes");
const teamContextMenuAppearanceButtonEl = document.getElementById("team-context-menu-appearance");
const ballCaptureMenuEl = document.getElementById("ball-capture-menu");
const ballCaptureMenuTitleEl = document.getElementById("ball-capture-menu-title");
const ballCaptureToggleAllButtonEl = document.getElementById("ball-capture-toggle-all");
const ballCaptureToggleUnownedButtonEl = document.getElementById("ball-capture-toggle-unowned");
const ballCaptureToggleShinyButtonEl = document.getElementById("ball-capture-toggle-shiny");
const ballCaptureToggleUltraButtonEl = document.getElementById("ball-capture-toggle-ultra");
const BALL_CAPTURE_TOGGLE_DEFINITIONS = [
  {
    key: BALL_CAPTURE_RULE_CAPTURE_ALL,
    label: "Tout capturer",
    buttonEl: ballCaptureToggleAllButtonEl,
  },
  {
    key: BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
    label: "Capturer les Pok\u00e9mon non poss\u00e9d\u00e9s",
    buttonEl: ballCaptureToggleUnownedButtonEl,
  },
  {
    key: BALL_CAPTURE_RULE_CAPTURE_SHINY,
    label: "Capturer les Pok\u00e9mon shiny",
    buttonEl: ballCaptureToggleShinyButtonEl,
  },
  {
    key: BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
    label: "Capturer les Pok\u00e9mon ultra shiny",
    buttonEl: ballCaptureToggleUltraButtonEl,
  },
];
const renameModalEl = document.getElementById("rename-modal");
const renameTitleEl = document.getElementById("rename-title");
const renameSubtitleEl = document.getElementById("rename-subtitle");
const renameFormEl = document.getElementById("rename-form");
const renameInputEl = document.getElementById("rename-input");
const renameCharCountEl = document.getElementById("rename-char-count");
const renameCloseButtonEl = document.getElementById("rename-close-btn");
const renameResetButtonEl = document.getElementById("rename-reset-btn");
const resetSaveButtonEl = document.getElementById("reset-save-btn");
const mapButtonEl = document.getElementById("map-btn");
const mapModalEl = document.getElementById("map-modal");
const mapCloseButtonEl = document.getElementById("map-close-btn");
const mapStageEl = document.querySelector(".map-stage");
const mapImageEl = document.getElementById("map-image");
const mapMarkersEl = document.getElementById("map-markers");
const shopButtonEl = document.getElementById("shop-btn");
const windowsNotificationButtonEl = document.getElementById("windows-notification-btn");
const windowsNotificationButtonLabelEl = document.getElementById("windows-notification-btn-label");
const shopModalEl = document.getElementById("shop-modal");
const shopModalSubtitleEl = document.getElementById("shop-modal-subtitle");
const shopGridEl = document.getElementById("shop-grid");
const shopPokeballQtyPanelEl = document.getElementById("shop-pokeball-qty-panel");
const shopCustomQtyInputEl = document.getElementById("shop-custom-qty-input");
const shopTabPokeballsButtonEl = document.getElementById("shop-tab-pokeballs");
const shopTabCombatButtonEl = document.getElementById("shop-tab-combat");
const shopTabEvolutionsButtonEl = document.getElementById("shop-tab-evolutions");
const shopWalletMoneyValueEl = document.getElementById("shop-wallet-money-value");
const shopWalletPokeballsValueEl = document.getElementById("shop-wallet-pokeballs-value");
const shopWalletQtyItemEl = document.getElementById("shop-wallet-qty-item");
const shopWalletQtyValueEl = document.getElementById("shop-wallet-qty-value");
const shopTabButtonEls = Array.from(document.querySelectorAll("[data-shop-tab]"));
const shopQtyPresetButtonEls = Array.from(document.querySelectorAll("[data-shop-qty]"));
const closeShopButtonEl = document.getElementById("close-shop-btn");
const evolutionItemModalEl = document.getElementById("evolution-item-modal");
const evolutionItemTitleEl = document.getElementById("evolution-item-title");
const evolutionItemSubtitleEl = document.getElementById("evolution-item-subtitle");
const evolutionItemListEl = document.getElementById("evolution-item-list");
const evolutionItemCloseButtonEl = document.getElementById("evolution-item-close-btn");
const moneyPillEl = document.getElementById("money-pill");
const moneyValueEl = document.getElementById("money-value");
const moneyAnimLayerEl = document.getElementById("money-anim-layer");
const coinsValueEl = document.getElementById("coins-value");
const saveBackendValueEl = document.getElementById("save-backend-value");
const routeNavCurrentEl = document.getElementById("route-nav-current");
const routeNavProgressEl = document.getElementById("route-nav-progress");
const routePrevButtonEl = document.getElementById("route-prev-btn");
const routeNextButtonEl = document.getElementById("route-next-btn");
const boxesModalEl = document.getElementById("boxes-modal");
const boxesGridEl = document.getElementById("boxes-grid");
const boxesInfoPanelEl = document.getElementById("boxes-info-panel");
const boxesCloseButtonEl = document.getElementById("boxes-close-btn");
const boxesSubtitleEl = document.getElementById("boxes-subtitle");
const boxesShinyCounterEl = document.getElementById("boxes-shiny-counter");
const appearanceModalEl = document.getElementById("appearance-modal");
const appearanceTitleEl = document.getElementById("appearance-title");
const appearanceSubtitleEl = document.getElementById("appearance-subtitle");
const appearanceCloseButtonEl = document.getElementById("appearance-close-btn");
const appearanceShinyToggleButtonEl = document.getElementById("appearance-shiny-toggle-btn");
const appearanceUltraShinyToggleButtonEl = document.getElementById("appearance-ultra-shiny-toggle-btn");
const appearanceShinyStatusEl = document.getElementById("appearance-shiny-status");
const appearanceGridEl = document.getElementById("appearance-grid");
const notificationStackEl = document.getElementById("notification-stack");
const tutorialModalEl = document.getElementById("tutorial-modal");
const tutorialTitleEl = document.getElementById("tutorial-title");
const tutorialPageTitleEl = document.getElementById("tutorial-page-title");
const tutorialBodyEl = document.getElementById("tutorial-body");
const tutorialProgressEl = document.getElementById("tutorial-progress");
const tutorialPrevButtonEl = document.getElementById("tutorial-prev-btn");
const tutorialNextButtonEl = document.getElementById("tutorial-next-btn");
const tutorialCloseButtonEl = document.getElementById("tutorial-close-btn");
const projectileSpriteCache = new Map();
const pokemonSpriteImageCache = new Map();
const pendingRouteDefinitionLoads = new Map();
const pendingRouteBackgroundLoads = new Map();
const ultraShinyOutlineCache = new Map();
const ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES = 220;
const mapMarkerButtonsByRouteId = new Map();
let evolutionItemChoiceResolver = null;
let evolutionItemChoiceStoneType = "";
let evolutionItemChoiceCandidates = [];

window.POKEIDLE_APP_VERSION = APP_VERSION;
window.POKEIDLE_DISPLAY_VERSION = DISPLAY_APP_VERSION;
const audioManager = createAudioManager();
window.POKEIDLE_AUDIO = audioManager;

const state = {
  mode: "loading",
  error: null,
  timeMs: 0,
  routeData: null,
  backgroundImage: null,
  routeCatalog: new Map(),
  routeCatalogOrderedIds: ROUTE_ID_ORDER.slice(),
  routeBackgroundsById: new Map(),
  zoneEncounterCsvByRouteId: new Map(),
  zoneEncounterCsvRouteIds: new Set(),
  zoneEncounterCsvLoaded: false,
  pokemonTalentCsvByPokemonId: new Map(),
  pokemonTalentCsvLoaded: false,
  ballConfigCsvLoaded: false,
  shopItemConfigCsvLoaded: false,
  configRevisions: {
    ball: 0,
    shopItem: 0,
  },
  economyNormalization: {
    saveDataRef: null,
    ballRevision: -1,
    shopItemRevision: -1,
  },
  pokemonDefsById: new Map(),
  typeIconImages: new Map(),
  saveData: null,
  onlyOneEncounterCycle: {
    routeId: "",
    normalCount: 0,
  },
  team: [],
  enemy: null,
  battle: null,
  viewport: { width: 960, height: 540, dpr: 1 },
  layout: null,
  lastFrameTimestamp: 0,
  lastRenderTimestamp: 0,
  realClockLastMs: 0,
  pendingSimMs: 0,
  lastHudAutoUpdateMs: 0,
  performance: {
    initialized: false,
    targetFrameMs: TARGET_FRAME_MS,
    shortFrameMsEma: TARGET_FRAME_MS,
    longFrameMsEma: TARGET_FRAME_MS,
    cpuFrameMsEma: TARGET_FRAME_MS,
    renderFrameMsEma: TARGET_FRAME_MS,
    quality: "low",
    maxAutomaticQualityRank: null,
    switchCooldownMs: 0,
    slowFrameStreak: 0,
    fastFrameStreak: 0,
  },
  simulationIdleMode: false,
  deferredSaveDirty: false,
  backgroundTickHandle: null,
  notifications: {
    items: [],
    nextId: 1,
    dirty: true,
    nextEvolutionScanMs: 0,
  },
  windowsNotifications: {
    supported: false,
    enabled: false,
    permission: "default",
    lastKnownPokeballTotal: null,
  },
  teamLevelUpEffects: [],
  teamXpGainEffects: [],
  teamXpPulseMsBySlot: {},
  xpHud: {
    teamXpBySlot: {},
    enemyHpKey: null,
    enemyHpFrontRatio: 1,
    enemyHpLagRatio: 1,
  },
  moneyHud: {
    initialized: false,
    targetValue: 0,
    displayValue: 0,
    lastRawValue: 0,
    pulseMs: 0,
  },
  evolutionAnimation: {
    current: null,
    queue: [],
  },
  tutorial: {
    queue: [],
    active: null,
  },
  backgroundDrift: {
    routeId: null,
    currentX: 0,
    currentY: 0,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    travelElapsedMs: 0,
    travelDurationMs: 0,
    holdMs: 0,
  },
  environment: {
    snapshot: null,
    nextUpdateAtMs: 0,
  },
  ui: {
    mapOpen: false,
    shopOpen: false,
    shopTab: SHOP_TAB_POKEBALLS,
    shopQuantityMode: "1",
    shopCustomQuantity: 1,
    evolutionItemChoiceOpen: false,
    evolutionItemChoiceStoneType: "",
    boxesOpen: false,
    boxesTargetSlotIndex: -1,
    boxesHoverEntityId: null,
    appearanceOpen: false,
    appearanceTargetSlotIndex: -1,
    appearancePokemonId: null,
    hoveredTeamSlotIndex: -1,
    hoveredBallOverlayType: "",
    ballOverlayHitboxes: [],
    ballCaptureMenuOpen: false,
    ballCaptureMenuBallType: "",
    teamContextMenuOpen: false,
    teamContextMenuSlotIndex: -1,
    teamContextMenuPokemonId: null,
    renameOpen: false,
    renameSlotIndex: -1,
    renamePokemonId: null,
    tutorialOpen: false,
  },
  saveBackend: {
    indexedDbAvailable: null,
    syncStorageAvailable: true,
    indexedDbWriteInFlight: false,
    pendingSerializedSave: null,
    retryTimerId: 0,
    lastPersistSucceeded: true,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function shouldForceUltraShinyAllPokemon() {
  return DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON;
}

function getRenderQualitySettings() {
  const key = String(state.performance?.quality || "low");
  return RENDER_QUALITY_PRESETS[key] || RENDER_QUALITY_PRESETS.low;
}

function getRenderQualityRank(qualityKey) {
  const key = String(qualityKey || "");
  const rank = RENDER_QUALITY_ORDER.indexOf(key);
  if (rank >= 0) {
    return rank;
  }
  return RENDER_QUALITY_ORDER.indexOf("medium");
}

function setRenderQualityByRank(rank) {
  const clampedRank = clamp(toSafeInt(rank, getRenderQualityRank("medium")), 0, RENDER_QUALITY_ORDER.length - 1);
  const nextQuality = RENDER_QUALITY_ORDER[clampedRank] || "medium";
  const perf = state.performance;
  if (!perf || perf.quality === nextQuality) {
    return false;
  }
  perf.quality = nextQuality;
  resizeCanvas();
  return true;
}

function isLikelyHighEndMobileDevice(coreCount, memoryGb, minSide, dpr, coarsePointer) {
  if (!coarsePointer) {
    return false;
  }
  const strongCpu = coreCount >= 8;
  const enoughMemory = memoryGb === null || memoryGb >= 6;
  const largeEnoughViewport = minSide >= 380;
  const manageableDpr = dpr <= 3.2;
  return strongCpu && enoughMemory && largeEnoughViewport && manageableDpr;
}

function refreshAutomaticRenderQualityRankCache() {
  const perf = state.performance;
  const coreCount = Math.max(1, toSafeInt(navigator?.hardwareConcurrency, 0));
  const memoryRaw = Number(navigator?.deviceMemory || 0);
  const memoryGb = Number.isFinite(memoryRaw) && memoryRaw > 0 ? memoryRaw : null;
  const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const highEndMobile = isLikelyHighEndMobileDevice(coreCount, memoryGb, minSide, dpr, coarsePointer);

  const rank =
    (highEndMobile || (!coarsePointer && coreCount >= 8 && (memoryGb === null || memoryGb >= 8) && minSide >= 900 && dpr <= 1.5))
      ? getRenderQualityRank("high")
      : getRenderQualityRank("medium");

  if (perf) {
    perf.maxAutomaticQualityRank = rank;
  }
  return rank;
}

function getMaxAutomaticRenderQualityRank() {
  const cachedRank = Number(state.performance?.maxAutomaticQualityRank);
  if (Number.isFinite(cachedRank)) {
    return cachedRank;
  }
  return refreshAutomaticRenderQualityRankCache();
}

function getInitialRenderQualityForDevice() {
  const maxAutomaticRank = getMaxAutomaticRenderQualityRank();
  let rank = Math.min(maxAutomaticRank, getRenderQualityRank("medium"));
  const coreCount = Math.max(1, toSafeInt(navigator?.hardwareConcurrency, 0));
  const memoryRaw = Number(navigator?.deviceMemory || 0);
  const memoryGb = Number.isFinite(memoryRaw) && memoryRaw > 0 ? memoryRaw : null;
  const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const highEndMobile = isLikelyHighEndMobileDevice(coreCount, memoryGb, minSide, dpr, coarsePointer);

  if ((memoryGb !== null && memoryGb <= 4) || coreCount <= 6) {
    rank = Math.min(rank, getRenderQualityRank("low"));
  }
  if ((memoryGb !== null && memoryGb <= 2) || coreCount <= 4) {
    rank = Math.min(rank, getRenderQualityRank("low"));
  }
  if ((memoryGb !== null && memoryGb <= 1) || coreCount <= 2) {
    rank = Math.min(rank, getRenderQualityRank("very_low"));
  }
  if (highEndMobile) {
    rank = Math.min(maxAutomaticRank, getRenderQualityRank("high"));
  } else if (coarsePointer) {
    rank = Math.min(rank, getRenderQualityRank("low"));
  }
  if (!highEndMobile && coarsePointer && minSide > 0 && minSide <= 430) {
    rank = Math.min(rank, getRenderQualityRank("very_low"));
  }
  if (!highEndMobile && minSide > 0 && minSide <= 720) {
    rank = Math.min(rank, getRenderQualityRank("low"));
  }
  if (!highEndMobile && dpr >= 2.4) {
    rank = Math.min(rank, getRenderQualityRank("low"));
  }
  if (!highEndMobile && dpr >= 3) {
    rank = Math.min(rank, getRenderQualityRank("very_low"));
  }

  return RENDER_QUALITY_ORDER[Math.min(rank, maxAutomaticRank)] || "low";
}

function applyInitialPerformanceProfile() {
  const perf = state.performance;
  if (!perf || perf.initialized) {
    return;
  }
  perf.initialized = true;
  refreshAutomaticRenderQualityRankCache();
  perf.quality = getInitialRenderQualityForDevice();
}

function getForegroundSimulationBudgetMs() {
  const quality = getRenderQualitySettings();
  const budget = Number(quality.foregroundSimBudgetMs);
  return clamp(Number.isFinite(budget) ? budget : 68, 24, 120);
}

function shouldRenderAmbientOverlays() {
  return Boolean(getRenderQualitySettings().ambientOverlayEnabled);
}

function shouldRenderCelebrationParticles() {
  return Boolean(getRenderQualitySettings().celebrationParticles);
}

function getProjectileTrailMaxPointsForQuality() {
  const quality = getRenderQualitySettings();
  if (!quality.projectileTrailEnabled) {
    return 0;
  }
  return Math.max(0, toSafeInt(quality.projectileTrailMaxPoints, PROJECTILE_TRAIL_MAX_POINTS));
}

function getRenderFrameIntervalMs() {
  const value = Number(getRenderQualitySettings().renderFrameIntervalMs);
  return clamp(Number.isFinite(value) ? value : TARGET_FRAME_MS, 16, 56);
}

function updateRenderQualityFromFrame(frameDeltaMs, cpuFrameMs = frameDeltaMs, renderDeltaMs = null) {
  const perf = state.performance;
  if (!perf) {
    return;
  }
  const frameDelta = clamp(Number(frameDeltaMs) || TARGET_FRAME_MS, 1, 120);
  const cpuDelta = clamp(Number(cpuFrameMs) || frameDelta, 0.1, 120);
  const hasRenderSample = Number.isFinite(renderDeltaMs) && Number(renderDeltaMs) > 0;
  const renderDelta = hasRenderSample ? clamp(Number(renderDeltaMs), 1, 240) : frameDelta;
  const shortCurrent = Number.isFinite(perf.shortFrameMsEma) ? perf.shortFrameMsEma : frameDelta;
  const longCurrent = Number.isFinite(perf.longFrameMsEma) ? perf.longFrameMsEma : frameDelta;
  const cpuCurrent = Number.isFinite(perf.cpuFrameMsEma) ? perf.cpuFrameMsEma : cpuDelta;
  const renderCurrent = Number.isFinite(perf.renderFrameMsEma) ? perf.renderFrameMsEma : renderDelta;
  perf.shortFrameMsEma = shortCurrent + (frameDelta - shortCurrent) * PERF_SHORT_EMA_SMOOTHING;
  perf.longFrameMsEma = longCurrent + (frameDelta - longCurrent) * PERF_LONG_EMA_SMOOTHING;
  perf.cpuFrameMsEma = cpuCurrent + (cpuDelta - cpuCurrent) * PERF_CPU_EMA_SMOOTHING;
  if (hasRenderSample) {
    perf.renderFrameMsEma = renderCurrent + (renderDelta - renderCurrent) * PERF_RENDER_EMA_SMOOTHING;
  }
  perf.switchCooldownMs = Math.max(0, (Number(perf.switchCooldownMs) || 0) - frameDelta);

  const target = Math.max(8, Number(perf.targetFrameMs) || TARGET_FRAME_MS);
  const cpuHealthThreshold = target * 0.62;
  const cpuHealthy = perf.cpuFrameMsEma <= cpuHealthThreshold;
  const frameComponent = cpuHealthy
    ? Math.min(perf.shortFrameMsEma, target + 0.8)
    : perf.shortFrameMsEma;
  const longComponent = cpuHealthy
    ? Math.min(perf.longFrameMsEma, target + 1.2)
    : perf.longFrameMsEma * 0.75;
  const backlogPressureMs = document.hidden
    ? 0
    : Math.max(0, (Math.max(0, Number(state.pendingSimMs) || 0) - target * 4) * 0.12);
  const stressFrameMs = Math.max(
    perf.cpuFrameMsEma * 1.12,
    frameComponent,
    longComponent,
  ) + backlogPressureMs;
  const overBudgetMs = stressFrameMs - target;
  const underBudgetMs = target - Math.max(perf.cpuFrameMsEma, perf.longFrameMsEma * 0.7);

  if (overBudgetMs > PERF_SLOW_FRAME_MARGIN_MS) {
    perf.slowFrameStreak += overBudgetMs > PERF_VERY_SLOW_FRAME_MARGIN_MS ? 2 : 1;
    perf.fastFrameStreak = 0;
  } else if (underBudgetMs > PERF_UPGRADE_HEADROOM_MS) {
    perf.fastFrameStreak += 1;
    perf.slowFrameStreak = Math.max(0, perf.slowFrameStreak - 1);
  } else {
    perf.slowFrameStreak = Math.max(0, perf.slowFrameStreak - 1);
    perf.fastFrameStreak = Math.max(0, perf.fastFrameStreak - 2);
  }

  if (perf.switchCooldownMs > 0) {
    return;
  }

  const currentRank = getRenderQualityRank(perf.quality);
  const maxAutomaticRank = getMaxAutomaticRenderQualityRank();
  if (perf.slowFrameStreak >= PERF_DOWNGRADE_STREAK && currentRank > 0) {
    const downgradeStep = overBudgetMs > PERF_VERY_SLOW_FRAME_MARGIN_MS ? 2 : 1;
    const nextRank = Math.max(0, currentRank - downgradeStep);
    if (setRenderQualityByRank(nextRank)) {
      perf.switchCooldownMs = PERF_SWITCH_COOLDOWN_MS;
      perf.slowFrameStreak = 0;
      perf.fastFrameStreak = 0;
    }
    return;
  }

  if (perf.fastFrameStreak >= PERF_UPGRADE_STREAK && currentRank < maxAutomaticRank) {
    const nextRank = Math.min(maxAutomaticRank, currentRank + 1);
    if (setRenderQualityByRank(nextRank)) {
      perf.switchCooldownMs = PERF_SWITCH_COOLDOWN_MS * 1.35;
      perf.slowFrameStreak = 0;
      perf.fastFrameStreak = 0;
    }
  }
}

function calcLevel(stats, bonus = 0) {
  const hp = Number(stats?.hp || 0);
  const attack = Number(stats?.attack || 0);
  const defense = Number(stats?.defense || 0);
  const speed = Number(stats?.speed || 0);
  const specialAttack = Number(stats?.["special-attack"] || 0);
  const specialDefense = Number(stats?.["special-defense"] || 0);
  const sum = hp + attack + defense + speed + specialAttack + specialDefense;
  return clamp(Math.round(sum / 12) + bonus, 1, 100);
}

function randomInt(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function randomRange(min, max) {
  const low = Number(min);
  const high = Number(max);
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return 0;
  }
  if (high <= low) {
    return low;
  }
  return low + Math.random() * (high - low);
}

function easeInOutSine(value) {
  const t = clamp(Number(value) || 0, 0, 1);
  return -(Math.cos(Math.PI * t) - 1) * 0.5;
}

function lerpNumber(a, b, t) {
  const start = Number(a) || 0;
  const end = Number(b) || 0;
  const ratio = clamp(Number(t) || 0, 0, 1);
  return start + (end - start) * ratio;
}

function pseudoRandomUnit(seed) {
  const value = Math.sin((Number(seed) || 0) * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function hashStringToUnit(text) {
  const source = String(text || "");
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function normalizeWeatherType(weatherTypeRaw) {
  const weatherType = String(weatherTypeRaw || "").toLowerCase().trim();
  return WEATHER_TYPES.includes(weatherType) ? weatherType : "neutral";
}

function getWeatherProfile(weatherTypeRaw) {
  const weatherType = normalizeWeatherType(weatherTypeRaw);
  return WEATHER_PROFILE_BY_TYPE[weatherType] || WEATHER_PROFILE_BY_TYPE.neutral;
}

function pickWeatherTypeFromRoll(unitRoll) {
  const roll = clamp(Number(unitRoll) || 0, 0, 0.9999999);
  const totalWeight = WEATHER_WEIGHT_TABLE.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0);
  if (totalWeight <= 0) {
    return "neutral";
  }
  let threshold = roll * totalWeight;
  for (const entry of WEATHER_WEIGHT_TABLE) {
    threshold -= Math.max(0, Number(entry.weight) || 0);
    if (threshold < 0) {
      return normalizeWeatherType(entry.type);
    }
  }
  return "neutral";
}

function getWeatherTypeForSlot(slotIndex) {
  const slot = Number.isFinite(Number(slotIndex)) ? Math.floor(Number(slotIndex)) : 0;
  const unitRoll = hashStringToUnit(`weather-slot:${slot}:kanto`);
  return pickWeatherTypeFromRoll(unitRoll);
}

function padTwoDigits(value) {
  return String(Math.max(0, toSafeInt(value, 0))).padStart(2, "0");
}

const COMPACT_NUMBER_SUFFIXES = Object.freeze([
  Object.freeze({ value: 1e15, suffix: "Qa" }),
  Object.freeze({ value: 1e12, suffix: "T" }),
  Object.freeze({ value: 1e9, suffix: "B" }),
  Object.freeze({ value: 1e6, suffix: "M" }),
  Object.freeze({ value: 1e3, suffix: "K" }),
]);

function trimCompactNumberFraction(text) {
  return String(text || "").replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
}

function formatCompactNumber(value, options = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  const absolute = Math.abs(numeric);
  const sign = numeric < 0 ? "-" : "";
  if (absolute < 1000) {
    return sign + String(Math.round(absolute));
  }

  const decimalsSmall = Math.max(0, toSafeInt(options.decimalsSmall, 2));
  const decimalsMedium = Math.max(0, toSafeInt(options.decimalsMedium, 1));
  const decimalsLarge = Math.max(0, toSafeInt(options.decimalsLarge, 0));
  for (let i = 0; i < COMPACT_NUMBER_SUFFIXES.length; i += 1) {
    const step = COMPACT_NUMBER_SUFFIXES[i];
    if (absolute < step.value) {
      continue;
    }
    const scaled = absolute / step.value;
    const decimals = scaled >= 100 ? decimalsLarge : scaled >= 10 ? decimalsMedium : decimalsSmall;
    const rounded = Number(scaled.toFixed(decimals));
    if (rounded >= 1000 && i > 0) {
      const largerStep = COMPACT_NUMBER_SUFFIXES[i - 1];
      const largerScaled = absolute / largerStep.value;
      const largerDecimals = largerScaled >= 100 ? decimalsLarge : largerScaled >= 10 ? decimalsMedium : decimalsSmall;
      const largerText = trimCompactNumberFraction(largerScaled.toFixed(largerDecimals));
      return `${sign}${largerText}${largerStep.suffix}`;
    }
    const numberText = trimCompactNumberFraction(scaled.toFixed(decimals));
    return `${sign}${numberText}${step.suffix}`;
  }

  return sign + String(Math.round(absolute));
}

function getMoneyAnimationLayer() {
  if (moneyAnimLayerEl) {
    return moneyAnimLayerEl;
  }
  if (!moneyPillEl) {
    return null;
  }
  const existing = moneyPillEl.querySelector(".money-anim-layer");
  if (existing instanceof HTMLElement) {
    return existing;
  }
  const layer = document.createElement("span");
  layer.className = "money-anim-layer";
  layer.setAttribute("aria-hidden", "true");
  moneyPillEl.appendChild(layer);
  return layer;
}

function setMoneyCounterTextValue(value) {
  if (!moneyValueEl) {
    return;
  }
  const nextText = formatCompactNumber(Math.max(0, toSafeInt(value, 0)), {
    decimalsSmall: 2,
    decimalsMedium: 1,
    decimalsLarge: 0,
  });
  if (moneyValueEl.textContent !== nextText) {
    moneyValueEl.textContent = nextText;
  }
}

function setCoinsCounterTextValue(value) {
  if (!coinsValueEl) {
    return;
  }
  const nextText = formatCompactNumber(Math.max(0, toSafeInt(value, 0)), {
    decimalsSmall: 2,
    decimalsMedium: 1,
    decimalsLarge: 0,
  });
  if (coinsValueEl.textContent !== nextText) {
    coinsValueEl.textContent = nextText;
  }
}

function formatPokeDollarValue(value) {
  return Math.max(0, toSafeInt(value, 0)).toLocaleString("fr-FR");
}

function refreshShopWalletPanel(activeTab = SHOP_TAB_POKEBALLS) {
  const hasWalletUi = Boolean(shopWalletMoneyValueEl || shopWalletPokeballsValueEl || shopWalletQtyValueEl);
  if (!hasWalletUi) {
    return;
  }
  const saveData = state.saveData;
  if (!saveData) {
    if (shopWalletMoneyValueEl) {
      shopWalletMoneyValueEl.textContent = "0 Poke$";
    }
    if (shopWalletPokeballsValueEl) {
      shopWalletPokeballsValueEl.textContent = "0";
    }
    if (shopWalletQtyValueEl) {
      shopWalletQtyValueEl.textContent = "x1";
    }
    if (shopWalletQtyItemEl) {
      shopWalletQtyItemEl.classList.add("hidden");
    }
    return;
  }

  const money = Math.max(0, toSafeInt(saveData.money, 0));
  const pokeballs = Math.max(0, toSafeInt(saveData.pokeballs, 0));
  if (shopWalletMoneyValueEl) {
    shopWalletMoneyValueEl.textContent = `${formatPokeDollarValue(money)} Poke$`;
  }
  if (shopWalletPokeballsValueEl) {
    shopWalletPokeballsValueEl.textContent = String(pokeballs);
  }
  if (shopWalletQtyValueEl) {
    shopWalletQtyValueEl.textContent = getSelectedShopBallQuantitySummaryLabel();
  }
  if (shopWalletQtyItemEl) {
    shopWalletQtyItemEl.classList.toggle("hidden", String(activeTab || "") !== SHOP_TAB_POKEBALLS);
  }
}

function spawnMoneyGainFloater(amount) {
  const gain = Math.max(0, toSafeInt(amount, 0));
  if (gain <= 0 || !shouldRenderCelebrationParticles()) {
    return;
  }
  const layer = getMoneyAnimationLayer();
  if (!layer) {
    return;
  }
  const floater = document.createElement("span");
  floater.className = "money-gain-floater";
  floater.textContent = "+" + formatCompactNumber(gain, {
    decimalsSmall: 2,
    decimalsMedium: 1,
    decimalsLarge: 0,
  });
  const jitter = randomRange(-14, 14);
  floater.style.setProperty("--money-float-x", `${Math.round(jitter)}px`);
  floater.addEventListener("animationend", () => {
    floater.remove();
  });
  layer.appendChild(floater);
}

function clearMoneyGainFloaters() {
  const layer = getMoneyAnimationLayer();
  if (!layer) {
    return;
  }
  layer.innerHTML = "";
}

function refreshMoneyCounterTransform() {
  if (!moneyValueEl) {
    return;
  }
  const pulseMs = Math.max(0, Number(state.moneyHud.pulseMs) || 0);
  if (pulseMs <= 0) {
    moneyValueEl.style.transform = "";
    moneyValueEl.style.filter = "";
    moneyValueEl.style.textShadow = "";
    return;
  }
  const ratio = clamp(pulseMs / MONEY_COUNTER_PULSE_MS, 0, 1);
  const pulse = Math.sin((1 - ratio) * Math.PI);
  const scale = 1 + pulse * 0.18;
  moneyValueEl.style.transform = `scale(${scale.toFixed(3)})`;
}

function updateMoneyHudAnimation(deltaMs) {
  if (!state.saveData) {
    state.moneyHud.initialized = false;
    state.moneyHud.targetValue = 0;
    state.moneyHud.displayValue = 0;
    state.moneyHud.lastRawValue = 0;
    state.moneyHud.pulseMs = 0;
    setMoneyCounterTextValue(0);
    clearMoneyGainFloaters();
    refreshMoneyCounterTransform();
    return;
  }
  if (!moneyValueEl) {
    return;
  }

  const target = Math.max(0, toSafeInt(state.moneyHud.targetValue, state.saveData.money));
  if (!state.moneyHud.initialized) {
    state.moneyHud.initialized = true;
    state.moneyHud.displayValue = target;
    state.moneyHud.lastRawValue = target;
    setMoneyCounterTextValue(target);
    refreshMoneyCounterTransform();
    return;
  }

  const current = Number(state.moneyHud.displayValue) || 0;
  const diff = target - current;
  if (Math.abs(diff) <= 0.5) {
    state.moneyHud.displayValue = target;
  } else {
    const smoothing = 1 - Math.exp(-Math.max(0.0001, Number(deltaMs) || 0) / MONEY_COUNTER_LERP_MS);
    state.moneyHud.displayValue = current + diff * smoothing;
  }

  setMoneyCounterTextValue(Math.round(state.moneyHud.displayValue));
  state.moneyHud.pulseMs = Math.max(0, state.moneyHud.pulseMs - Math.max(0, Number(deltaMs) || 0));
  refreshMoneyCounterTransform();
}

function supportsWindowsSystemNotifications() {
  return typeof window !== "undefined" && typeof Notification !== "undefined";
}

function normalizeNotificationPermission(permissionRaw) {
  const permission = String(permissionRaw || "default").toLowerCase().trim();
  if (permission === "granted" || permission === "denied" || permission === "default") {
    return permission;
  }
  return "default";
}

function getCurrentNotificationPermission() {
  if (!supportsWindowsSystemNotifications()) {
    return "unsupported";
  }
  return normalizeNotificationPermission(Notification.permission);
}

function readWindowsNotificationPreference() {
  try {
    const raw = localStorage.getItem(WINDOWS_NOTIFICATION_PREF_KEY);
    if (raw === "1") {
      return true;
    }
    if (raw === "0") {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}

function writeWindowsNotificationPreference(enabled) {
  try {
    localStorage.setItem(WINDOWS_NOTIFICATION_PREF_KEY, enabled ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}

function refreshWindowsNotificationButtonUi() {
  if (!windowsNotificationButtonEl) {
    return;
  }
  const supported = Boolean(state.windowsNotifications?.supported);
  const permission = String(state.windowsNotifications?.permission || "default");
  const enabled = Boolean(state.windowsNotifications?.enabled);

  let label = "Notifs Windows";
  let title = "Notifs systeme Windows pour les shiny et le stock vide quand le jeu n'est plus au premier plan.";
  if (!supported) {
    label = "Notifs non supportees";
    title = "Ce navigateur ne supporte pas l'API Notification.";
  } else if (permission === "denied") {
    label = "Notifs bloquees";
    title = "Autorise les notifications dans les reglages du navigateur.";
  } else if (enabled) {
    label = "Notifs Windows ON";
    title = "Notifications systeme actives pour les shiny et le stock vide quand le jeu n'est plus au premier plan.";
  } else {
    label = "Activer notifs";
    title = "Clique pour activer les notifications systeme hors premier plan.";
  }

  windowsNotificationButtonEl.setAttribute("aria-pressed", enabled ? "true" : "false");
  windowsNotificationButtonEl.title = title;
  if (windowsNotificationButtonLabelEl) {
    windowsNotificationButtonLabelEl.textContent = label;
  }
}

function syncWindowsNotificationStateFromEnvironment() {
  const supported = supportsWindowsSystemNotifications();
  const permission = supported ? getCurrentNotificationPermission() : "unsupported";
  const storedPreference = supported ? readWindowsNotificationPreference() : null;

  state.windowsNotifications.supported = supported;
  state.windowsNotifications.permission = permission;
  if (!supported || permission !== "granted") {
    state.windowsNotifications.enabled = false;
  } else {
    state.windowsNotifications.enabled = storedPreference == null ? true : Boolean(storedPreference);
  }

  refreshWindowsNotificationButtonUi();
}

function initializeWindowsNotificationSystem() {
  syncWindowsNotificationStateFromEnvironment();
}

async function requestWindowsNotificationPermission() {
  if (!supportsWindowsSystemNotifications()) {
    return "unsupported";
  }
  const permissionBefore = getCurrentNotificationPermission();
  if (permissionBefore !== "default") {
    return permissionBefore;
  }
  try {
    const requested = await Notification.requestPermission();
    return normalizeNotificationPermission(requested);
  } catch {
    return getCurrentNotificationPermission();
  }
}

function disableWindowsNotificationSystem() {
  state.windowsNotifications.enabled = false;
  writeWindowsNotificationPreference(false);
  refreshWindowsNotificationButtonUi();
}

async function enableWindowsNotificationSystem() {
  if (!supportsWindowsSystemNotifications()) {
    syncWindowsNotificationStateFromEnvironment();
    return { enabled: false, permission: "unsupported" };
  }
  let permission = getCurrentNotificationPermission();
  if (permission === "default") {
    permission = await requestWindowsNotificationPermission();
  }

  state.windowsNotifications.supported = true;
  state.windowsNotifications.permission = permission;
  if (permission === "granted") {
    state.windowsNotifications.enabled = true;
    writeWindowsNotificationPreference(true);
  } else {
    state.windowsNotifications.enabled = false;
  }
  refreshWindowsNotificationButtonUi();
  return { enabled: state.windowsNotifications.enabled, permission };
}

async function toggleWindowsNotificationSystemFromButton() {
  syncWindowsNotificationStateFromEnvironment();
  if (!state.windowsNotifications.supported) {
    setTopMessage("Notifications Windows indisponibles sur ce navigateur.", 2000);
    return;
  }
  if (state.windowsNotifications.enabled) {
    disableWindowsNotificationSystem();
    setTopMessage("Notifications Windows desactivees.", 1700);
    return;
  }

  const result = await enableWindowsNotificationSystem();
  if (result.enabled) {
    setTopMessage("Notifications Windows activees.", 1800);
    return;
  }
  if (result.permission === "denied") {
    setTopMessage("Notifications bloquees. Autorise-les dans le navigateur.", 2600);
    return;
  }
  setTopMessage("Permission de notification non accordee.", 1800);
}

function sendWindowsSystemNotification(title, body, options = {}) {
  if (!supportsWindowsSystemNotifications()) {
    return false;
  }
  const currentPermission = getCurrentNotificationPermission();
  if (currentPermission !== state.windowsNotifications.permission) {
    syncWindowsNotificationStateFromEnvironment();
  }
  if (!state.windowsNotifications.enabled || state.windowsNotifications.permission !== "granted") {
    return false;
  }
  if (isGamePageVisibleAndFocused()) {
    return false;
  }
  const safeTitle = String(title || "").trim();
  if (!safeTitle) {
    return false;
  }
  const safeBody = String(body || "").trim();
  const autoCloseMs = Math.max(0, toSafeInt(options.autoCloseMs, 9000));
  try {
    const notification = new Notification(safeTitle, {
      body: safeBody,
      tag: options.tag ? String(options.tag) : undefined,
      renotify: Boolean(options.renotify),
      requireInteraction: Boolean(options.requireInteraction),
    });
    if (autoCloseMs > 0) {
      window.setTimeout(() => {
        try {
          notification.close();
        } catch {}
      }, autoCloseMs);
    }
    return true;
  } catch {
    return false;
  }
}

function isGamePageVisibleAndFocused() {
  if (typeof document === "undefined") {
    return false;
  }
  const visibilityStateRaw = typeof document.visibilityState === "string" ? document.visibilityState : "";
  const visibilityState = visibilityStateRaw.toLowerCase().trim();
  const isVisible = visibilityState ? visibilityState === "visible" : !document.hidden;
  const hasWindowFocus = typeof document.hasFocus === "function" ? Boolean(document.hasFocus()) : true;
  return isVisible && hasWindowFocus;
}

function syncWindowsPokeballInventoryTracking(total, options = {}) {
  const nextTotal = Math.max(0, toSafeInt(total, 0));
  const previousRaw = state.windowsNotifications?.lastKnownPokeballTotal;
  const previousTotal = previousRaw == null ? null : Math.max(0, toSafeInt(previousRaw, 0));
  state.windowsNotifications.lastKnownPokeballTotal = nextTotal;
  if (options.silent || previousTotal == null) {
    return;
  }
  if (previousTotal > 0 && nextTotal <= 0) {
    notifyWindowsOutOfPokeballs(options);
  }
}

function notifyWindowsOutOfPokeballs(options = {}) {
  if (state.simulationIdleMode) {
    return;
  }
  const routeId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = getRouteDisplayName(routeId);
  const lastBallLabel = options.ballType ? getBallTypeLabel(options.ballType) : "Poke Ball";
  const bodyParts = [`Ta derniere ${lastBallLabel} vient d'etre utilisee.`];
  if (routeName) {
    bodyParts.push(`Zone: ${routeName}.`);
  }
  bodyParts.push("Passe au Shop pour refaire le stock.");
  sendWindowsSystemNotification("Plus de Poke Balls", bodyParts.join(" "), {
    tag: "pokeballs-empty",
    renotify: true,
    requireInteraction: true,
    autoCloseMs: 0,
  });
}

function notifyWindowsShinyEncounter(enemy) {
  if (!enemy || !enemy.isShiny || state.simulationIdleMode) {
    return;
  }
  const routeId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = getRouteDisplayName(routeId);
  const level = Math.max(1, toSafeInt(enemy.level, 1));
  const enemyName = enemy.nameFr || getPokemonDisplayNameById(enemy.id);
  sendWindowsSystemNotification(
    "Shiny rencontre",
    `${enemyName} shiny sauvage apercu (${routeName}, niv ${level}).`,
    {
      tag: `shiny-encounter-${enemy.id}-${Date.now()}`,
      autoCloseMs: 12000,
    },
  );
}

function notifyWindowsShinyCapture(enemy, options = {}) {
  if (!enemy || !enemy.isShiny || state.simulationIdleMode) {
    return;
  }
  const enemyName = enemy.nameFr || getPokemonDisplayNameById(enemy.id);
  const criticalSuffix = options.isCritical ? " (capture critique)" : "";
  sendWindowsSystemNotification("Shiny capture", `${enemyName} shiny capture${criticalSuffix} !`, {
    tag: `shiny-capture-${enemy.id}-${Date.now()}`,
    requireInteraction: true,
    autoCloseMs: 0,
  });
}

function resetNotificationSystem() {
  state.notifications.items = [];
  state.notifications.nextId = 1;
  state.notifications.dirty = true;
  state.notifications.nextEvolutionScanMs = state.timeMs + 500;
  renderNotificationStackUi();
}

function nextNotificationId() {
  const nextId = Math.max(1, toSafeInt(state.notifications.nextId, 1));
  state.notifications.nextId = nextId + 1;
  return nextId;
}

function shouldUseCompactNotificationStack() {
  const viewportWidth = Math.max(0, Number(window.innerWidth || state.viewport?.width || 0));
  return isCoarsePointerDevice() || viewportWidth <= 760;
}

function getVisibleNotificationItems(items) {
  const sorted = Array.isArray(items)
    ? items.slice().sort((a, b) => {
      const aTime = Number(a?.createdAt || 0);
      const bTime = Number(b?.createdAt || 0);
      return aTime - bTime;
    })
    : [];
  if (!shouldUseCompactNotificationStack()) {
    return sorted;
  }

  const temporaryItems = sorted.filter((item) => item?.type === "temporary");
  const evolutionItems = sorted.filter((item) => item?.type === "evolution_ready");
  const visible = [];

  if (temporaryItems.length > 0) {
    visible.push(temporaryItems[temporaryItems.length - 1]);
  }
  if (evolutionItems.length > 0) {
    visible.push(evolutionItems[evolutionItems.length - 1]);
  }
  if (evolutionItems.length > 1) {
    const extraCount = evolutionItems.length - 1;
    visible.push({
      id: "evolution-summary",
      type: "evolution_summary",
      tone: "evolution",
      title: "Autres evolutions",
      message: `${extraCount} autre${extraCount > 1 ? "s" : ""} evolution${extraCount > 1 ? "s" : ""} disponible${extraCount > 1 ? "s" : ""}.`,
      createdAt: Number(evolutionItems[evolutionItems.length - 1]?.createdAt || 0) + 0.01,
    });
  }

  return visible.sort((a, b) => {
    const aTime = Number(a?.createdAt || 0);
    const bTime = Number(b?.createdAt || 0);
    return aTime - bTime;
  });
}

function getNotificationPokemonId(item) {
  const directId = Number(item?.pokemonId || 0);
  if (directId > 0) {
    return directId;
  }
  const fallbackId = Number(item?.fromId || 0);
  return fallbackId > 0 ? fallbackId : 0;
}

function getNotificationPokemonSpritePath(item) {
  const pokemonId = getNotificationPokemonId(item);
  if (pokemonId <= 0) {
    return "";
  }
  const forceUltraShiny = Boolean(item?.pokemonIsUltraShiny);
  const forceShiny = forceUltraShiny || Boolean(item?.pokemonIsShiny);
  const appearance = resolveSpriteAppearanceForEntity(pokemonId, {
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
    forceShiny,
    forceUltraShiny,
    shinyVisual: forceShiny,
    ultraShinyVisual: forceUltraShiny,
  });
  const def = state.pokemonDefsById.get(pokemonId);
  const fallbackShinyPath = forceShiny ? appearance?.variant?.frontShinyPath || def?.shinySpritePath || "" : "";
  const fallbackNormalPath = appearance?.variant?.frontPath || def?.spritePath || "";
  return String(appearance?.spritePath || fallbackShinyPath || fallbackNormalPath || "").trim();
}

function renderNotificationStackUi() {
  if (!notificationStackEl) {
    return;
  }
  const items = Array.isArray(state.notifications.items) ? state.notifications.items : [];
  notificationStackEl.innerHTML = "";

  const sorted = getVisibleNotificationItems(items);

  for (const item of sorted) {
    const card = document.createElement("article");
    card.className = "game-notif";
    if (item.tone === "first") {
      card.classList.add("notif-first");
    } else if (item.tone === "shiny") {
      card.classList.add("notif-shiny");
    } else if (item.type === "evolution_ready" || item.type === "evolution_summary") {
      card.classList.add("notif-evolution");
    }

    const bodyEl = document.createElement("div");
    bodyEl.className = "game-notif-body";
    const pokemonId = getNotificationPokemonId(item);
    const spritePath = getNotificationPokemonSpritePath(item);
    if (spritePath) {
      const spriteWrapEl = document.createElement("div");
      spriteWrapEl.className = "game-notif-sprite-wrap";
      const spriteImgEl = document.createElement("img");
      spriteImgEl.className = "game-notif-sprite";
      spriteImgEl.src = spritePath;
      spriteImgEl.alt = pokemonId > 0 ? getPokemonDisplayNameById(pokemonId) : "Pokemon";
      spriteWrapEl.appendChild(spriteImgEl);
      bodyEl.appendChild(spriteWrapEl);
    }

    const contentEl = document.createElement("div");
    contentEl.className = "game-notif-content";
    if (item.title) {
      const titleEl = document.createElement("div");
      titleEl.className = "game-notif-title";
      titleEl.textContent = item.title;
      contentEl.appendChild(titleEl);
    }

    const textEl = document.createElement("div");
    textEl.className = "game-notif-text";
    textEl.textContent = item.message || "";
    contentEl.appendChild(textEl);
    bodyEl.appendChild(contentEl);
    card.appendChild(bodyEl);

    if (item.type === "evolution_ready") {
      const actions = document.createElement("div");
      actions.className = "game-notif-actions";

      const evolveButton = document.createElement("button");
      evolveButton.type = "button";
      evolveButton.className = "game-notif-btn";
      evolveButton.textContent = "Evoluer";
      evolveButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        triggerEvolutionFromNotification(item.id);
      });
      actions.appendChild(evolveButton);
      card.appendChild(actions);
    }

    notificationStackEl.appendChild(card);
  }
}

function pushTemporaryNotification(message, durationMs = 2600, options = {}) {
  const text = String(message || "").trim();
  if (!text) {
    return null;
  }
  if (state.simulationIdleMode) {
    return null;
  }

  const id = nextNotificationId();
  const duration = Math.max(650, toSafeInt(durationMs, 2600));
  const pokemonId = Number(options.pokemonId || 0);
  const pokemonIsUltraShiny = Boolean(options.pokemonIsUltraShiny);
  const pokemonIsShiny = pokemonIsUltraShiny || Boolean(options.pokemonIsShiny);
  state.notifications.items.push({
    id,
    type: "temporary",
    tone: String(options.tone || "info"),
    title: options.title ? String(options.title) : "",
    message: text,
    pokemonId: pokemonId > 0 ? pokemonId : 0,
    pokemonIsShiny,
    pokemonIsUltraShiny,
    createdAt: state.timeMs,
    expiresAt: state.timeMs + duration,
  });
  state.notifications.dirty = true;
  renderNotificationStackUi();
  return id;
}

function buildEvolutionNotificationKey(fromId, toId) {
  return `evo:${Number(fromId || 0)}->${Number(toId || 0)}`;
}

function hasEvolutionNotification(fromId, toId) {
  const key = buildEvolutionNotificationKey(fromId, toId);
  return state.notifications.items.some((item) => item?.type === "evolution_ready" && item.key === key);
}

function enqueueEvolutionReadyNotification(candidate) {
  const fromId = Number(candidate?.fromId || 0);
  const toId = Number(candidate?.toId || 0);
  if (fromId <= 0 || toId <= 0) {
    return null;
  }
  if (isPokemonEntityUnlockedById(toId)) {
    return null;
  }
  if (hasEvolutionNotification(fromId, toId)) {
    return null;
  }

  const fromName = candidate?.fromNameFr || getPokemonDisplayNameById(fromId);
  const toName = candidate?.toNameFr || getPokemonDisplayNameById(toId);
  const id = nextNotificationId();
  state.notifications.items.push({
    id,
    type: "evolution_ready",
    tone: "evolution",
    key: buildEvolutionNotificationKey(fromId, toId),
    title: "Evolution prete",
    message: `${fromName} peut evoluer en ${toName}.`,
    fromId,
    toId,
    pokemonId: fromId,
    createdAt: state.timeMs,
  });
  queueEvolutionTutorialIfNeeded();
  state.notifications.dirty = true;
  renderNotificationStackUi();
  return id;
}

function removeNotificationById(notificationId) {
  const id = toSafeInt(notificationId, 0);
  if (id <= 0) {
    return false;
  }
  const before = state.notifications.items.length;
  state.notifications.items = state.notifications.items.filter((item) => toSafeInt(item?.id, 0) !== id);
  if (state.notifications.items.length === before) {
    return false;
  }
  state.notifications.dirty = true;
  renderNotificationStackUi();
  return true;
}

function isEvolutionNotificationStillValid(item) {
  if (item?.type !== "evolution_ready") {
    return true;
  }
  const fromId = Number(item.fromId || 0);
  const toId = Number(item.toId || 0);
  if (fromId <= 0 || toId <= 0) {
    return false;
  }
  if (isPokemonEntityUnlockedById(toId)) {
    return false;
  }
  const record = getPokemonEntityRecord(fromId);
  if (!record || !isEntityUnlocked(record)) {
    return false;
  }
  const candidate = findNextEligibleEvolution(record);
  return Boolean(candidate && Number(candidate.toId) === toId);
}

function scanForEvolutionReadyNotifications() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return;
  }
  for (const [rawId, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    const candidate = findNextEligibleEvolution(record);
    if (!candidate) {
      continue;
    }
    enqueueEvolutionReadyNotification({
      fromId: candidate.fromId,
      toId: candidate.toId,
      fromNameFr: candidate.fromDef?.nameFr || getPokemonDisplayNameById(candidate.fromId),
      toNameFr: candidate.toDef?.nameFr || getPokemonDisplayNameById(candidate.toId),
    });
  }
}

function triggerEvolutionFromNotification(notificationId) {
  const id = toSafeInt(notificationId, 0);
  if (id <= 0) {
    return false;
  }
  const item = state.notifications.items.find((entry) => toSafeInt(entry?.id, 0) === id);
  if (!item || item.type !== "evolution_ready") {
    return false;
  }

  const fromId = Number(item.fromId || 0);
  const toId = Number(item.toId || 0);
  const fromRecord = getPokemonEntityRecord(fromId);
  if (!fromRecord || !isEntityUnlocked(fromRecord) || isPokemonEntityUnlockedById(toId)) {
    removeNotificationById(id);
    return false;
  }
  const candidate = findNextEligibleEvolution(fromRecord);
  if (!candidate || Number(candidate.toId) !== toId) {
    removeNotificationById(id);
    return false;
  }

  const preferredSlotIndex = Array.isArray(state.saveData?.team)
    ? state.saveData.team.findIndex((entryId) => Number(entryId) === fromId)
    : -1;
  const evolutionResult = applyEvolutionUnlockAndTeamPlacement(fromId, toId, preferredSlotIndex);
  if (!evolutionResult) {
    removeNotificationById(id);
    pushTemporaryNotification("Evolution impossible pour ce Pokemon.", 1800, {
      tone: "info",
      title: "Evolution",
      pokemonId: fromId,
    });
    return false;
  }

  queueEvolutionAnimationForResult(evolutionResult);
  addCoins(COIN_REWARD_PER_EVOLUTION);
  removeNotificationById(id);
  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();
  render();
  pushTemporaryNotification(`${evolutionResult.fromNameFr} evolue en ${evolutionResult.toNameFr} !`, 2200, {
    tone: "first",
    title: "Evolution",
    pokemonId: Number(evolutionResult.toId || toId || 0),
  });
  return true;
}

function updateNotificationSystem() {
  const beforeCount = state.notifications.items.length;
  const now = state.timeMs;
  state.notifications.items = state.notifications.items.filter((item) => {
    if (!item) {
      return false;
    }
    if (item.type === "temporary") {
      return Number(item.expiresAt || 0) > now;
    }
    return isEvolutionNotificationStillValid(item);
  });

  if (state.notifications.items.length !== beforeCount) {
    state.notifications.dirty = true;
  }

  if (state.mode === "ready" && now >= Math.max(0, Number(state.notifications.nextEvolutionScanMs) || 0)) {
    state.notifications.nextEvolutionScanMs = now + 1200;
    scanForEvolutionReadyNotifications();
  }

  if (state.notifications.dirty) {
    state.notifications.dirty = false;
    renderNotificationStackUi();
  }
}

function notifyFirstTimeSpeciesProgress(pokemonId, kind, isShiny, previousValue, nextValue) {
  if (state.mode !== "ready" || state.simulationIdleMode) {
    return;
  }
  if (nextValue <= 0 || previousValue > 0) {
    return;
  }
  const category = String(kind || "").toLowerCase();
  if (category !== "encountered" && category !== "captured") {
    return;
  }

  const pokemonName = getPokemonDisplayNameById(pokemonId);
  if (category === "encountered") {
    if (isShiny) {
      return;
    }
    pushTemporaryNotification(`${pokemonName} apparait pour la premiere fois.`, 3000, {
      title: "Apparition",
      tone: "first",
      pokemonId,
    });
    return;
  }

  if (isShiny) {
    pushTemporaryNotification(`${pokemonName} capture pour la premiere fois en shiny.`, 4400, {
      title: "Premiere capture shiny",
      tone: "shiny",
      pokemonId,
      pokemonIsShiny: true,
    });
    return;
  }

  pushTemporaryNotification(`${pokemonName} capture pour la premiere fois.`, 3200, {
    title: "Premiere capture",
    tone: "first",
    pokemonId,
  });
}

function notifyShinyEncounterUntilCaptured(enemy, speciesRecord = null) {
  if (!enemy || !enemy.isShiny || state.mode !== "ready" || state.simulationIdleMode) {
    return;
  }
  const record = speciesRecord || ensureSpeciesStats(enemy.id);
  const shinyCaptures = Math.max(0, toSafeInt(record?.captured_shiny, 0));
  if (shinyCaptures > 0) {
    return;
  }
  pushTemporaryNotification(`Un ${enemy.nameFr} shiny sauvage apparait !`, 4200, {
    title: "Shiny sauvage",
    tone: "shiny",
    pokemonId: Number(enemy.id || 0),
    pokemonIsShiny: true,
    pokemonIsUltraShiny: Boolean(enemy.isUltraShiny),
  });
}

function getBackgroundDriftRangePx() {
  const shortestSide = Math.max(220, Math.min(state.viewport.width || 0, state.viewport.height || 0));
  return clamp(shortestSide * 0.018, 5, 16);
}

function pickBackgroundDriftTargetAxis(currentValue, rangePx) {
  const current = Number(currentValue) || 0;
  const reverseBias = -current * randomRange(0.45, 1);
  const jitter = randomRange(-rangePx * 0.42, rangePx * 0.42);
  return clamp(reverseBias + jitter, -rangePx, rangePx);
}

function scheduleNextBackgroundDriftMove(options = {}) {
  const drift = state.backgroundDrift;
  const immediate = Boolean(options.immediate);
  const rangePx = getBackgroundDriftRangePx();

  drift.startX = Number(drift.currentX) || 0;
  drift.startY = Number(drift.currentY) || 0;
  drift.targetX = pickBackgroundDriftTargetAxis(drift.currentX, rangePx);
  drift.targetY = pickBackgroundDriftTargetAxis(drift.currentY, rangePx);
  drift.travelElapsedMs = 0;
  drift.travelDurationMs = immediate ? randomRange(2800, 5200) : randomRange(BACKGROUND_DRIFT_TRAVEL_MIN_MS, BACKGROUND_DRIFT_TRAVEL_MAX_MS);
  drift.holdMs = 0;
}

function resetBackgroundDriftForRoute(routeId, options = {}) {
  const drift = state.backgroundDrift;
  const immediate = Boolean(options.immediate);
  drift.routeId = String(routeId || "");
  drift.currentX = 0;
  drift.currentY = 0;
  drift.startX = 0;
  drift.startY = 0;
  drift.targetX = 0;
  drift.targetY = 0;
  drift.travelElapsedMs = 0;
  drift.travelDurationMs = 0;
  drift.holdMs = immediate ? 0 : randomRange(BACKGROUND_DRIFT_HOLD_MIN_MS, BACKGROUND_DRIFT_HOLD_MAX_MS);
  scheduleNextBackgroundDriftMove({ immediate });
}

function ensureBackgroundDriftRouteSync() {
  const activeRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  if (state.backgroundDrift.routeId !== activeRouteId) {
    resetBackgroundDriftForRoute(activeRouteId, { immediate: true });
  }
}

function updateBackgroundDrift(deltaMs) {
  if (!state.backgroundImage) {
    state.backgroundDrift.currentX = 0;
    state.backgroundDrift.currentY = 0;
    return;
  }

  ensureBackgroundDriftRouteSync();
  const drift = state.backgroundDrift;
  const dt = Math.max(0, Number(deltaMs) || 0);

  if (drift.holdMs > 0) {
    drift.holdMs = Math.max(0, drift.holdMs - dt);
    if (drift.holdMs === 0) {
      scheduleNextBackgroundDriftMove();
    }
    return;
  }

  drift.travelElapsedMs += dt;
  const duration = Math.max(1, Number(drift.travelDurationMs) || 1);
  const progress = clamp(drift.travelElapsedMs / duration, 0, 1);
  const eased = easeInOutSine(progress);
  drift.currentX = drift.startX + (drift.targetX - drift.startX) * eased;
  drift.currentY = drift.startY + (drift.targetY - drift.startY) * eased;

  if (progress >= 1) {
    drift.currentX = drift.targetX;
    drift.currentY = drift.targetY;
    drift.holdMs = randomRange(BACKGROUND_DRIFT_HOLD_MIN_MS, BACKGROUND_DRIFT_HOLD_MAX_MS);
  }
}

function getBackgroundDriftOffset() {
  ensureBackgroundDriftRouteSync();
  return {
    x: Number(state.backgroundDrift.currentX) || 0,
    y: Number(state.backgroundDrift.currentY) || 0,
  };
}

function getLocalTimeProfile(nowMs = Date.now()) {
  const nowDate = new Date(Number.isFinite(nowMs) ? nowMs : Date.now());
  const hour = nowDate.getHours();
  const minute = nowDate.getMinutes();
  const second = nowDate.getSeconds() + nowDate.getMilliseconds() / 1000;
  const totalMinutes = hour * 60 + minute + second / 60;
  const dayProgress = clamp(totalMinutes / (24 * 60), 0, 1);
  const solarCurve = Math.sin((dayProgress - 0.25) * Math.PI * 2);
  const dayLight = clamp((solarCurve + 0.22) / 1.22, 0, 1);
  const twilight = clamp(1 - Math.abs(solarCurve), 0, 1);
  return {
    nowMs: nowDate.getTime(),
    hour,
    minute,
    second,
    label: `${padTwoDigits(hour)}:${padTwoDigits(minute)}`,
    dayProgress,
    solarCurve,
    dayLight,
    twilight,
    night: clamp(1 - dayLight, 0, 1),
  };
}

function getWeatherBlendWeightsByTime(nowMs = Date.now()) {
  const currentMs = Number.isFinite(nowMs) ? Math.floor(nowMs) : Date.now();
  const slotIndex = Math.floor(currentMs / WEATHER_CHANGE_INTERVAL_MS);
  const slotStartMs = slotIndex * WEATHER_CHANGE_INTERVAL_MS;
  const slotElapsedMs = Math.max(0, currentMs - slotStartMs);
  const rawBlend = clamp(slotElapsedMs / WEATHER_TRANSITION_DURATION_MS, 0, 1);
  const blend = easeInOutSine(rawBlend);
  const previousType = getWeatherTypeForSlot(slotIndex - 1);
  const currentType = getWeatherTypeForSlot(slotIndex);
  if (previousType === currentType) {
    return {
      slotIndex,
      previousType,
      currentType,
      blend: 1,
      weights: {
        [currentType]: 1,
      },
    };
  }
  return {
    slotIndex,
    previousType,
    currentType,
    blend,
    weights: {
      [previousType]: 1 - blend,
      [currentType]: blend,
    },
  };
}

function getStormLightningIntensity(nowMs, stormWeight) {
  const weight = clamp(Number(stormWeight) || 0, 0, 1);
  if (weight <= 0.02) {
    return 0;
  }
  const currentMs = Number.isFinite(nowMs) ? Math.floor(nowMs) : Date.now();
  const bucketIndex = Math.floor(currentMs / WEATHER_LIGHTNING_WINDOW_MS);
  const bucketProgress = (currentMs % WEATHER_LIGHTNING_WINDOW_MS) / WEATHER_LIGHTNING_WINDOW_MS;
  const triggerRoll = hashStringToUnit(`lightning-roll:${bucketIndex}`);
  const triggerThreshold = lerpNumber(0.045, 0.18, weight);
  if (triggerRoll >= triggerThreshold) {
    return 0;
  }
  const startRatio = hashStringToUnit(`lightning-start:${bucketIndex}`) * 0.68;
  const durationRatio = lerpNumber(0.12, 0.28, hashStringToUnit(`lightning-dur:${bucketIndex}`));
  const endRatio = startRatio + durationRatio;
  if (bucketProgress < startRatio || bucketProgress > endRatio) {
    return 0;
  }
  const local = clamp((bucketProgress - startRatio) / Math.max(0.01, durationRatio), 0, 1);
  const pulse = Math.pow(Math.sin(local * Math.PI), 1.15);
  const strength = lerpNumber(0.6, 1, 1 - triggerRoll / Math.max(0.0001, triggerThreshold));
  return clamp(pulse * strength * weight, 0, 1);
}

function getEnvironmentSnapshot(nowMs = Date.now()) {
  const timeProfile = getLocalTimeProfile(nowMs);
  const weatherBlend = getWeatherBlendWeightsByTime(timeProfile.nowMs);
  const weights = weatherBlend.weights || { neutral: 1 };
  let dominantWeatherType = "neutral";
  let dominantWeatherWeight = -1;
  for (const weatherType of WEATHER_TYPES) {
    const weight = clamp(Number(weights[weatherType] || 0), 0, 1);
    if (weight > dominantWeatherWeight) {
      dominantWeatherWeight = weight;
      dominantWeatherType = weatherType;
    }
  }
  const stormWeight = clamp(Number(weights.storm || 0), 0, 1);
  const lightningIntensity = getStormLightningIntensity(timeProfile.nowMs, stormWeight);
  return {
    nowMs: timeProfile.nowMs,
    localTimeLabel: timeProfile.label,
    localHour: timeProfile.hour,
    localMinute: timeProfile.minute,
    localSecond: Math.floor(timeProfile.second),
    dayLight: timeProfile.dayLight,
    twilight: timeProfile.twilight,
    night: timeProfile.night,
    weatherSlotIndex: weatherBlend.slotIndex,
    weatherFrom: weatherBlend.previousType,
    weatherTo: weatherBlend.currentType,
    weatherTransitionBlend: weatherBlend.blend,
    weatherWeights: weights,
    dominantWeatherType,
    lightningIntensity,
  };
}

function updateEnvironment(nowMs = Date.now(), force = false) {
  const now = Math.max(0, toSafeInt(nowMs, Date.now()));
  const nextAllowed = Math.max(0, toSafeInt(state.environment?.nextUpdateAtMs, 0));
  if (!force && state.environment.snapshot && now < nextAllowed) {
    return;
  }

  state.environment.snapshot = getEnvironmentSnapshot(now);
  const quality = getRenderQualitySettings();
  const intervalMult = clamp(Number(quality.environmentUpdateIntervalMult) || 1, 0.6, 3);
  const intervalMs = Math.max(50, Math.round(ENVIRONMENT_UPDATE_INTERVAL_MS * intervalMult));
  state.environment.nextUpdateAtMs = now + intervalMs;
}

function getEnvironmentSnapshotForRender() {
  if (state.environment?.snapshot) {
    return state.environment.snapshot;
  }
  updateEnvironment(Date.now(), true);
  return state.environment.snapshot || getEnvironmentSnapshot(Date.now());
}

function weightedPick(entries) {
  if (!entries || entries.length === 0) {
    return null;
  }
  const total = entries.reduce((acc, entry) => acc + Math.max(1, Number(entry.spawn_weight || 1)), 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(1, Number(entry.spawn_weight || 1));
    if (roll <= 0) {
      return entry;
    }
  }
  return entries[entries.length - 1];
}

const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const STAT_LABELS_FR = {
  hp: "PV",
  attack: "Att",
  defense: "Def",
  "special-attack": "Att Spe",
  "special-defense": "Def Spe",
  speed: "Vit",
};

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function normalizeStatsPayload(stats) {
  const normalized = {};
  for (const key of STAT_KEYS) {
    normalized[key] = Math.max(1, toSafeInt(stats?.[key], 1));
  }
  return normalized;
}

function getBaseStatTotal(stats) {
  const source = stats || {};
  return STAT_KEYS.reduce((sum, key) => sum + Math.max(1, Number(source[key] || 1)), 0);
}

function getLevelProgressionMultiplier(level) {
  const normalizedLevel = clamp(toSafeInt(level, 1), 1, MAX_LEVEL);
  const step = normalizedLevel - 1;
  if (step <= 0) {
    return 1;
  }
  const linear = step * LEVEL_PROGRESSION_LINEAR_PER_STEP;
  const curved = Math.pow(step, LEVEL_PROGRESSION_CURVE_EXPONENT) * LEVEL_PROGRESSION_CURVE_PER_STEP;
  return 1 + linear + curved;
}

function computeStatsAtLevel(baseStats, level) {
  const normalizedLevel = clamp(toSafeInt(level, 1), 1, MAX_LEVEL);
  const source = normalizeStatsPayload(baseStats);
  const progression = getLevelProgressionMultiplier(normalizedLevel);

  const hp = Math.max(1, Math.round(source.hp * progression + normalizedLevel * 10));
  const attack = Math.max(1, Math.round(source.attack * progression * 1.02 + normalizedLevel * 8));
  const defense = Math.max(1, Math.round(source.defense * progression * 0.98 + normalizedLevel * 8));
  const specialAttack = Math.max(
    1,
    Math.round(source["special-attack"] * progression * 1.02 + normalizedLevel * 8),
  );
  const specialDefense = Math.max(
    1,
    Math.round(source["special-defense"] * progression * 0.98 + normalizedLevel * 8),
  );
  const speed = Math.max(1, Math.round(source.speed * progression * 0.95 + normalizedLevel * 7));

  return {
    hp,
    attack,
    defense,
    "special-attack": specialAttack,
    "special-defense": specialDefense,
    speed,
  };
}

function computeBattleHpMax(stats, level, wild = false) {
  const hp = Math.max(1, Number(stats?.hp || 1));
  const ratio = wild ? 1.7 : 1.95;
  const normalizedLevel = clamp(toSafeInt(level, 1), 1, MAX_LEVEL);
  const rawHp = Math.max(1, Math.round(hp * ratio + normalizedLevel * 9));

  let lowLevelDivider = 1;
  if (normalizedLevel <= 1) {
    lowLevelDivider = 3.6;
  } else if (normalizedLevel === 2) {
    lowLevelDivider = 3;
  } else if (normalizedLevel === 3) {
    lowLevelDivider = 1.9;
  } else if (normalizedLevel === 4) {
    lowLevelDivider = 1.35;
  }

  return Math.max(1, Math.round(rawHp / lowLevelDivider));
}

function getPokemonBaseStats(pokemonId, fallbackStats = null) {
  const def = state.pokemonDefsById.get(Number(pokemonId));
  if (def?.stats) {
    return normalizeStatsPayload(def.stats);
  }
  if (fallbackStats) {
    return normalizeStatsPayload(fallbackStats);
  }
  return {
    hp: 35,
    attack: 35,
    defense: 35,
    "special-attack": 35,
    "special-defense": 35,
    speed: 35,
  };
}

function getSpeciesGrowthFactor(baseStats) {
  const total = getBaseStatTotal(baseStats);
  return clamp(0.84 + total / 520, 0.9, 1.58);
}

function getXpToNextLevelForSpecies(pokemonId, level, fallbackStats = null) {
  if (level >= MAX_LEVEL) {
    return 0;
  }
  const baseStats = getPokemonBaseStats(pokemonId, fallbackStats);
  const growth = getSpeciesGrowthFactor(baseStats);
  const requirement = (58 + level * level * 5.8 + level * 18) * growth;
  return Math.max(58, Math.round(requirement));
}

function createEmptySpeciesStats() {
  return {
    encountered_normal: 0,
    encountered_shiny: 0,
    encountered_ultra_shiny: 0,
    defeated_normal: 0,
    defeated_shiny: 0,
    defeated_ultra_shiny: 0,
    captured_normal: 0,
    captured_shiny: 0,
    captured_ultra_shiny: 0,
  };
}

function normalizeSpeciesCounters(rawCounters) {
  const base = createEmptySpeciesStats();
  const output = { ...base };
  for (const key of Object.keys(base)) {
    output[key] = Math.max(0, toSafeInt(rawCounters?.[key], 0));
  }
  return output;
}

function normalizeSpriteVariantId(rawValue, fallbackValue = "") {
  const value = String(rawValue || fallbackValue || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return value || String(fallbackValue || "").trim().toLowerCase() || "";
}

function normalizeSpriteVariantIdList(rawList) {
  const output = [];
  const list = Array.isArray(rawList) ? rawList : [];
  for (const entry of list) {
    const id = normalizeSpriteVariantId(entry);
    if (!id || output.includes(id)) {
      continue;
    }
    output.push(id);
  }
  return output;
}

function registerSpriteImageInCache(imagePath, image) {
  if (!imagePath || !image) {
    return;
  }
  pokemonSpriteImageCache.set(imagePath, image);
}

function getCachedSpriteImage(imagePath) {
  if (!imagePath) {
    return null;
  }
  if (pokemonSpriteImageCache.has(imagePath)) {
    return pokemonSpriteImageCache.get(imagePath);
  }
  const image = new Image();
  image.src = imagePath;
  pokemonSpriteImageCache.set(imagePath, image);
  return image;
}

const spriteSourceStableIdOverrides = typeof WeakMap === "function" ? new WeakMap() : null;

function getImageCacheStableId(image) {
  if (!image || typeof image !== "object") {
    return "";
  }
  const overrideId = spriteSourceStableIdOverrides?.get?.(image);
  if (overrideId) {
    return overrideId;
  }
  const src = String(image.currentSrc || image.src || "");
  if (src) {
    return src;
  }
  const dims = getDrawableImageDimensions(image);
  return `img:${String(dims.width || 0)}x${String(dims.height || 0)}`;
}

const ANIMATED_SPRITE_CACHE_MAX_ENTRIES = 40;
const animatedSpriteFramesCache = new Map();

function destroyAnimatedSpriteFramesCacheEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return;
  }
  const frames = Array.isArray(entry.frames) ? entry.frames : [];
  for (const frame of frames) {
    const source = frame?.source;
    if (source && typeof source.close === "function") {
      try {
        source.close();
      } catch {
        // ignore
      }
    }
  }
  entry.frames = [];
  entry.frameStartsMs = [];
  entry.totalDurationMs = 0;
}

function trimAnimatedSpriteFramesCacheIfNeeded() {
  const extraCount = animatedSpriteFramesCache.size - ANIMATED_SPRITE_CACHE_MAX_ENTRIES;
  if (extraCount <= 0) {
    return;
  }
  const entries = Array.from(animatedSpriteFramesCache.values());
  entries.sort((a, b) => (Number(a?.lastAccessMs) || 0) - (Number(b?.lastAccessMs) || 0));
  for (let i = 0; i < extraCount; i += 1) {
    const entry = entries[i];
    const key = String(entry?.key || "");
    if (!key || !animatedSpriteFramesCache.has(key)) {
      continue;
    }
    animatedSpriteFramesCache.delete(key);
    destroyAnimatedSpriteFramesCacheEntry(entry);
  }
}

function buildAnimatedSpriteTimeline(frames) {
  const starts = [];
  let total = 0;
  const list = Array.isArray(frames) ? frames : [];
  for (const frame of list) {
    starts.push(total);
    total += Math.max(20, toSafeInt(frame?.durationMs, 100));
  }
  if (total <= 0 && list.length > 0) {
    total = Math.max(20, toSafeInt(list[0]?.durationMs, 100));
  }
  return { starts, totalDurationMs: total };
}

function resolveAnimatedSpriteFrame(entry, timeMs) {
  if (!entry || entry.status !== "ready") {
    return null;
  }
  const frames = Array.isArray(entry.frames) ? entry.frames : [];
  if (frames.length <= 0) {
    return null;
  }
  const total = Math.max(0, Number(entry.totalDurationMs) || 0);
  if (frames.length === 1 || total <= 0.1) {
    return { source: frames[0].source || null, frameIndex: 0 };
  }
  const t = Math.max(0, Number(timeMs) || 0);
  const targetMs = t % total;
  const starts = Array.isArray(entry.frameStartsMs) ? entry.frameStartsMs : [];
  for (let i = 0; i < frames.length; i += 1) {
    const start = Number(starts[i]) || 0;
    const duration = Math.max(20, toSafeInt(frames[i]?.durationMs, 100));
    if (targetMs < start + duration) {
      return { source: frames[i].source || null, frameIndex: i };
    }
  }
  const lastIndex = Math.max(0, frames.length - 1);
  return { source: frames[lastIndex]?.source || null, frameIndex: lastIndex };
}

async function createAnimatedFrameSourceFromRgba(rgba, width, height) {
  const w = Math.max(1, toSafeInt(width, 1));
  const h = Math.max(1, toSafeInt(height, 1));
  const data = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba);
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(new ImageData(data, w, h));
      return bitmap;
    }
  } catch {
    // ignore
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const frameCtx = canvas.getContext("2d");
  if (!frameCtx) {
    return null;
  }
  frameCtx.putImageData(new ImageData(data, w, h), 0, 0);
  return canvas;
}

function clearRgbaRect(buffer, canvasWidth, canvasHeight, rect) {
  if (!buffer || !Number.isFinite(canvasWidth) || !Number.isFinite(canvasHeight) || !rect) {
    return;
  }
  const x = clamp(toSafeInt(rect.x, 0), 0, Math.max(0, canvasWidth - 1));
  const y = clamp(toSafeInt(rect.y, 0), 0, Math.max(0, canvasHeight - 1));
  const w = clamp(toSafeInt(rect.width, 0), 0, Math.max(0, canvasWidth - x));
  const h = clamp(toSafeInt(rect.height, 0), 0, Math.max(0, canvasHeight - y));
  if (w <= 0 || h <= 0) {
    return;
  }
  for (let row = 0; row < h; row += 1) {
    const start = ((y + row) * canvasWidth + x) * 4;
    buffer.fill(0, start, start + w * 4);
  }
}

function normalizeGifFrameDelayMs(delayHundredths) {
  const raw = Math.max(0, toSafeInt(delayHundredths, 0));
  const ms = raw > 0 ? raw * 10 : 100;
  return clamp(Math.round(ms), 20, 2000);
}

async function decodeGifToAnimatedFrames(arrayBuffer, stableKey) {
  const GifReader = globalThis.GifReader;
  if (typeof GifReader !== "function") {
    throw new Error("GifReader indisponible (vendor/omggif.js).");
  }
  const reader = new GifReader(new Uint8Array(arrayBuffer));
  const width = Math.max(1, toSafeInt(reader.width, 1));
  const height = Math.max(1, toSafeInt(reader.height, 1));
  const frameCount = Math.max(1, toSafeInt(reader.numFrames(), 1));

  const working = new Uint8ClampedArray(width * height * 4);
  const frames = [];
  let previousFrameInfo = null;
  let previousRestore = null;

  for (let i = 0; i < frameCount; i += 1) {
    if (previousFrameInfo) {
      const previousDisposal = toSafeInt(previousFrameInfo.disposal, 0);
      if (previousDisposal === 2) {
        clearRgbaRect(working, width, height, previousFrameInfo);
      } else if (previousDisposal === 3 && previousRestore) {
        working.set(previousRestore);
      }
    }

    const frameInfo = reader.frameInfo(i);
    const restore = toSafeInt(frameInfo?.disposal, 0) === 3 ? working.slice() : null;
    reader.decodeAndBlitFrameRGBA(i, working);

    const delayMs = normalizeGifFrameDelayMs(frameInfo?.delay);
    const rgbaCopy = working.slice();
    const source = await createAnimatedFrameSourceFromRgba(rgbaCopy, width, height);
    if (!source) {
      previousFrameInfo = frameInfo;
      previousRestore = restore;
      continue;
    }
    spriteSourceStableIdOverrides?.set?.(source, `${stableKey}#frame${i}`);
    frames.push({ source, durationMs: delayMs });

    previousFrameInfo = frameInfo;
    previousRestore = restore;
  }

  return { width, height, frames };
}

async function decodeApngToAnimatedFrames(arrayBuffer, stableKey) {
  const UPNG = globalThis.UPNG;
  if (!UPNG || typeof UPNG.decode !== "function" || typeof UPNG.toRGBA8 !== "function") {
    throw new Error("UPNG indisponible (vendor/upng.js).");
  }
  const decoded = UPNG.decode(new Uint8Array(arrayBuffer));
  const width = Math.max(1, toSafeInt(decoded?.width, 1));
  const height = Math.max(1, toSafeInt(decoded?.height, 1));
  const rgbaBuffers = Array.isArray(UPNG.toRGBA8(decoded)) ? UPNG.toRGBA8(decoded) : [];

  const frames = [];
  for (let i = 0; i < rgbaBuffers.length; i += 1) {
    const rgba = new Uint8ClampedArray(rgbaBuffers[i]);
    const delayMs = clamp(toSafeInt(decoded?.frames?.[i]?.delay, 100), 20, 2000);
    const source = await createAnimatedFrameSourceFromRgba(rgba, width, height);
    if (!source) {
      continue;
    }
    spriteSourceStableIdOverrides?.set?.(source, `${stableKey}#frame${i}`);
    frames.push({ source, durationMs: delayMs });
  }

  if (frames.length <= 0) {
    const single = rgbaBuffers.length > 0 ? new Uint8ClampedArray(rgbaBuffers[0]) : new Uint8ClampedArray(width * height * 4);
    const source = await createAnimatedFrameSourceFromRgba(single, width, height);
    if (source) {
      spriteSourceStableIdOverrides?.set?.(source, `${stableKey}#frame0`);
      frames.push({ source, durationMs: 100 });
    }
  }

  return { width, height, frames };
}

async function loadAnimatedSpriteFrames(spritePath) {
  const response = await fetch(spritePath);
  if (!response.ok) {
    throw new Error(`Impossible de telecharger ${spritePath} (${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const cleanPath = String(spritePath).split("#")[0].split("?")[0].toLowerCase();
  if (cleanPath.endsWith(".gif")) {
    return decodeGifToAnimatedFrames(arrayBuffer, spritePath);
  }
  if (cleanPath.endsWith(".png")) {
    return decodeApngToAnimatedFrames(arrayBuffer, spritePath);
  }
  throw new Error(`Format de sprite anime non supporte: ${spritePath}`);
}

function ensureAnimatedSpriteFramesEntry(spritePath) {
  const key = String(spritePath || "");
  if (!key) {
    return null;
  }
  if (animatedSpriteFramesCache.has(key)) {
    const entry = animatedSpriteFramesCache.get(key);
    if (entry) {
      entry.lastAccessMs = performance.now();
    }
    return entry || null;
  }
  const entry = {
    key,
    status: "loading",
    frames: [],
    frameStartsMs: [],
    totalDurationMs: 0,
    width: 0,
    height: 0,
    lastAccessMs: performance.now(),
    error: "",
    loadPromise: null,
  };
  entry.loadPromise = loadAnimatedSpriteFrames(key)
    .then((result) => {
      entry.width = Math.max(1, toSafeInt(result?.width, 1));
      entry.height = Math.max(1, toSafeInt(result?.height, 1));
      entry.frames = Array.isArray(result?.frames) ? result.frames : [];
      const timeline = buildAnimatedSpriteTimeline(entry.frames);
      entry.frameStartsMs = timeline.starts;
      entry.totalDurationMs = timeline.totalDurationMs;
      entry.status = entry.frames.length > 0 ? "ready" : "error";
      if (entry.status !== "ready") {
        entry.error = "Aucune frame decodee";
      }
    })
    .catch((error) => {
      entry.status = "error";
      entry.error = error instanceof Error ? error.message : String(error || "");
    });
  animatedSpriteFramesCache.set(key, entry);
  trimAnimatedSpriteFramesCacheIfNeeded();
  return entry;
}

function resolveAnimatedSpriteFrameSource(spritePath, timeMs) {
  const entry = ensureAnimatedSpriteFramesEntry(spritePath);
  if (!entry) {
    return null;
  }
  if (entry.status !== "ready") {
    return null;
  }
  entry.lastAccessMs = performance.now();
  return resolveAnimatedSpriteFrame(entry, timeMs);
}

function resolveEntitySpriteDrawSource(entity, timeMs = state.timeMs) {
  const base = entity?.spriteImage || null;
  if (!entity?.spriteAnimated) {
    return { source: base, frameIndex: -1 };
  }
  const spritePath = String(entity?.spritePath || base?.currentSrc || base?.src || "");
  if (!spritePath) {
    return { source: base, frameIndex: -1 };
  }
  const resolved = resolveAnimatedSpriteFrameSource(spritePath, timeMs);
  if (resolved?.source) {
    return { source: resolved.source, frameIndex: toSafeInt(resolved.frameIndex, -1) };
  }
  return { source: base, frameIndex: -1 };
}

function normalizePokemonSpriteScaleValue(rawValue) {
  if (rawValue === null || typeof rawValue === "undefined" || rawValue === "") {
    return 0.5;
  }
  const numeric = Number(rawValue);
  return Number.isFinite(numeric) ? clamp(numeric, 0, 1) : 0.5;
}

function getPokemonDataSpriteScale(entity) {
  const scaleValue = normalizePokemonSpriteScaleValue(entity?.spriteScaleValue ?? entity?.size);
  return lerpNumber(POKEMON_DATA_SPRITE_SCALE_MIN, POKEMON_DATA_SPRITE_SCALE_MAX, scaleValue);
}

function trimUltraShinyOutlineCacheIfNeeded() {
  if (ultraShinyOutlineCache.size <= ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES) {
    return;
  }
  const toDeleteCount = ultraShinyOutlineCache.size - ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES;
  const keys = ultraShinyOutlineCache.keys();
  for (let i = 0; i < toDeleteCount; i += 1) {
    const key = keys.next().value;
    if (typeof key === "undefined") {
      break;
    }
    ultraShinyOutlineCache.delete(key);
  }
}

function getUltraShinyOutlineTexture(image, drawWidth, drawHeight, outlinePx) {
  if (!isDrawableImage(image)) {
    return null;
  }

  const sourceWidth = Math.max(1, Math.round(Number(drawWidth) || 0));
  const sourceHeight = Math.max(1, Math.round(Number(drawHeight) || 0));
  const outline = Math.max(0, Number(outlinePx) || 0);
  if (outline <= 0.001) {
    return null;
  }

  const outlineKey = Math.round(outline * 100) / 100;
  const imageKey = getImageCacheStableId(image);
  const cacheKey = `${imageKey}|${sourceWidth}x${sourceHeight}|${outlineKey}`;
  if (ultraShinyOutlineCache.has(cacheKey)) {
    return ultraShinyOutlineCache.get(cacheKey);
  }

  const whiteSpriteCanvas = document.createElement("canvas");
  whiteSpriteCanvas.width = sourceWidth;
  whiteSpriteCanvas.height = sourceHeight;
  const whiteSpriteCtx = whiteSpriteCanvas.getContext("2d");
  if (!whiteSpriteCtx) {
    return null;
  }
  whiteSpriteCtx.imageSmoothingEnabled = false;
  whiteSpriteCtx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  whiteSpriteCtx.globalCompositeOperation = "source-in";
  whiteSpriteCtx.fillStyle = "rgba(255, 255, 255, 1)";
  whiteSpriteCtx.fillRect(0, 0, sourceWidth, sourceHeight);
  whiteSpriteCtx.globalCompositeOperation = "source-over";

  const pad = Math.max(1, Math.ceil(outline) + 1);
  const textureWidth = sourceWidth + pad * 2;
  const textureHeight = sourceHeight + pad * 2;
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = textureWidth;
  outlineCanvas.height = textureHeight;
  const outlineCtx = outlineCanvas.getContext("2d");
  if (!outlineCtx) {
    return null;
  }
  outlineCtx.imageSmoothingEnabled = false;
  const unitOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-0.707, -0.707],
    [-0.707, 0.707],
    [0.707, -0.707],
    [0.707, 0.707],
  ];
  for (const [dx, dy] of unitOffsets) {
    outlineCtx.drawImage(
      whiteSpriteCanvas,
      Math.round(pad + dx * outline),
      Math.round(pad + dy * outline),
      sourceWidth,
      sourceHeight,
    );
  }

  const texture = {
    canvas: outlineCanvas,
    pad,
  };
  ultraShinyOutlineCache.set(cacheKey, texture);
  trimUltraShinyOutlineCacheIfNeeded();
  return texture;
}

async function ensureSpriteImageLoaded(imagePath) {
  if (!imagePath) {
    return null;
  }
  const cachedImage = pokemonSpriteImageCache.get(imagePath);
  if (isDrawableImage(cachedImage)) {
    return cachedImage;
  }
  const loadedImage = await loadImage(imagePath);
  if (loadedImage) {
    registerSpriteImageInCache(imagePath, loadedImage);
  }
  return loadedImage;
}

async function ensureVariantAppearanceAssetsLoaded(def, variant, options = {}) {
  const includeShiny = options.includeShiny === true;
  const paths = [variant?.frontPath || def?.spritePath || ""];
  if (includeShiny) {
    paths.push(variant?.frontShinyPath || def?.shinySpritePath || "");
  }
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  await Promise.all(uniquePaths.map((imagePath) => ensureSpriteImageLoaded(imagePath)));
}

function isDrawableImage(image) {
  const dims = getDrawableImageDimensions(image);
  return dims.width > 0 && dims.height > 0;
}

function getDrawableImageDimensions(image) {
  if (!image || typeof image !== "object") {
    return { width: 0, height: 0 };
  }
  const naturalWidth = Number(image.naturalWidth);
  const naturalHeight = Number(image.naturalHeight);
  if (
    Number.isFinite(naturalWidth) &&
    naturalWidth > 0 &&
    Number.isFinite(naturalHeight) &&
    naturalHeight > 0
  ) {
    return { width: naturalWidth, height: naturalHeight };
  }
  const width = Number(image.width);
  const height = Number(image.height);
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width, height };
  }
  return { width: 0, height: 0 };
}

function normalizeSpriteVariantEntry(rawVariant, jsonPath, fallbackIndex = 0) {
  if (!rawVariant || typeof rawVariant !== "object") {
    return null;
  }

  const id = normalizeSpriteVariantId(rawVariant.id || rawVariant.game_key || `variant_${fallbackIndex + 1}`);
  if (!id) {
    return null;
  }
  const frontPath = resolveSpritePath(jsonPath, rawVariant.front);
  if (!frontPath) {
    return null;
  }

  return {
    id,
    labelFr: String(rawVariant.label_fr || rawVariant.label || id),
    generation: clamp(toSafeInt(rawVariant.generation, 0), 0, 9),
    gameKey: String(rawVariant.game_key || "").toLowerCase(),
    frontPath,
    frontShinyPath: resolveSpritePath(jsonPath, rawVariant.front_shiny),
    animated: Boolean(rawVariant.animated),
  };
}

function getSpriteVariantsForDef(def) {
  return Array.isArray(def?.spriteVariants) ? def.spriteVariants.filter((entry) => entry?.frontPath) : [];
}

function getSpriteVariantById(def, variantId) {
  const targetId = normalizeSpriteVariantId(variantId);
  if (!targetId) {
    return null;
  }
  return getSpriteVariantsForDef(def).find((entry) => entry.id === targetId) || null;
}

function getPreferredDefaultSpriteVariant(def) {
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return null;
  }
  const variantsById = new Map(variants.map((entry) => [entry.id, entry]));
  for (const preferredId of DEFAULT_POKEMON_SPRITE_VARIANT_PREFERENCE) {
    if (variantsById.has(preferredId)) {
      return variantsById.get(preferredId) || null;
    }
  }
  const explicit = normalizeSpriteVariantId(def?.defaultSpriteVariantId);
  if (explicit && variantsById.has(explicit)) {
    return variantsById.get(explicit) || null;
  }
  return variants[0];
}

function getDefaultSpriteVariantId(def) {
  return getPreferredDefaultSpriteVariant(def)?.id || "";
}

function shouldPromoteLegacyTransparentSelection(selectedVariantId, ownedVariantIds, defaultVariantId) {
  const preferredId = normalizeSpriteVariantId(defaultVariantId);
  if (!preferredId || preferredId === "transparent") {
    return false;
  }
  const selectedId = normalizeSpriteVariantId(selectedVariantId);
  if (selectedId !== "transparent") {
    return false;
  }
  const ownedIds = normalizeSpriteVariantIdList(ownedVariantIds);
  return ownedIds.length > 0 && ownedIds.every((variantId) => variantId === "transparent");
}

function getSpriteVariantOrderIndex(def, variantId) {
  const targetId = normalizeSpriteVariantId(variantId);
  if (!targetId) {
    return Number.MAX_SAFE_INTEGER;
  }
  const index = getSpriteVariantsForDef(def).findIndex((entry) => entry.id === targetId);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function getSpriteVariantDisplayLabel(variant) {
  if (!variant) {
    return "Sprite";
  }
  let label = variant.labelFr;
  if (variant.id === "transparent" && variant.gameKey === "home") {
    label = "Home";
  }
  const generationLabel = Number(variant.generation) > 0 ? "Gen " + String(variant.generation) : "";
  return generationLabel ? `${label} (${generationLabel})` : label;
}

function normalizeEvolutionItemReadyTargets(rawTargets) {
  if (!Array.isArray(rawTargets)) {
    return [];
  }
  const seen = new Set();
  const normalized = [];
  for (const rawTarget of rawTargets) {
    const targetId = Number(rawTarget);
    if (!Number.isFinite(targetId) || targetId <= 0 || seen.has(targetId)) {
      continue;
    }
    seen.add(targetId);
    normalized.push(targetId);
  }
  return normalized;
}

function getTalentDefinitionForPokemonId(pokemonId) {
  const csvTalent = getPokemonTalentCsvForPokemonId(pokemonId);
  if (csvTalent) {
    return normalizeTalentDefinition(csvTalent);
  }
  const def = state.pokemonDefsById.get(Number(pokemonId || 0));
  return normalizeTalentDefinition(def?.talent);
}

function resolveTalentDefinition(rawTalent, pokemonId = 0) {
  const normalized = normalizeTalentDefinition(rawTalent);
  if (normalized.id !== TALENT_NONE_ID) {
    return normalized;
  }
  return getTalentDefinitionForPokemonId(pokemonId);
}

function formatTalentLabelFr(rawTalent, pokemonId = 0) {
  return resolveTalentDefinition(rawTalent, pokemonId).nameFr || TALENT_NONE_NAME_FR;
}

function getEntityTalentId(entity, fallbackPokemonId = 0) {
  return normalizeTalentId(resolveTalentDefinition(entity?.talent, fallbackPokemonId || entity?.id).id);
}

function getTalentCritBonusChance(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return Math.max(0, Number(TALENT_CRIT_BONUS_CHANCE_BY_ID[talentId] || 0));
}

function hasAlwaysHitTalent(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return TALENT_ALWAYS_HIT_IDS.has(talentId);
}

function shouldApplyMorphingTalent(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return talentId === TALENT_MORPHING_ID;
}

function getEntityOffensiveType(entity, fallbackType = "normal") {
  return normalizeType(entity?.offensiveType || entity?.defensiveTypes?.[0] || fallbackType);
}

function getTeamAuraProviderConfig(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return TALENT_AURA_PROVIDER_BY_ID[talentId] || null;
}

function getStackedTeamAuraAttackBonus(teamMembers, targetSlotIndex, targetOffensiveType) {
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return 0;
  }

  const targetType = normalizeType(targetOffensiveType || "normal");
  let totalBonus = 0;
  for (let i = 0; i < teamMembers.length; i += 1) {
    if (i === targetSlotIndex) {
      continue;
    }
    const teammate = teamMembers[i];
    if (!teammate) {
      continue;
    }
    const aura = getTeamAuraProviderConfig(teammate?.talent, teammate?.id);
    if (!aura) {
      continue;
    }
    if (normalizeType(aura.offensiveType) !== targetType) {
      continue;
    }
    totalBonus += Math.max(0, Number(aura.attackBonus || 0));
  }
  return Math.max(0, totalBonus);
}

function getTeamAuraAttackBonusBySlot(teamMembers) {
  const bonuses = Array.from({ length: MAX_TEAM_SIZE }, () => 0);
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return bonuses;
  }
  for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
    const member = teamMembers[i];
    if (!member) {
      continue;
    }
    bonuses[i] = getStackedTeamAuraAttackBonus(teamMembers, i, getEntityOffensiveType(member));
  }
  return bonuses;
}

function sanitizePokemonNickname(rawValue) {
  const normalized = String(rawValue ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  if (!normalized) {
    return "";
  }
  return Array.from(normalized).slice(0, POKEMON_NICKNAME_MAX_LENGTH).join("");
}

function getPokemonNicknameLength(rawValue) {
  return Array.from(sanitizePokemonNickname(rawValue)).length;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPokemonNicknameById(pokemonId) {
  const record = getPokemonEntityRecord(pokemonId);
  return sanitizePokemonNickname(record?.nickname);
}

function getPokemonDisplayNameForOwnedEntity(pokemonId, fallbackName = "") {
  const nickname = getPokemonNicknameById(pokemonId);
  if (nickname) {
    return nickname;
  }
  return String(fallbackName || getPokemonDisplayNameById(pokemonId));
}

function normalizePokemonEntityRecord(rawEntity, pokemonId) {
  const id = Number(pokemonId);
  const counters = normalizeSpeciesCounters(rawEntity);
  const level = clamp(toSafeInt(rawEntity?.level, 1), 1, MAX_LEVEL);
  const xp = Math.max(0, toSafeInt(rawEntity?.xp, 0));
  const baseStats = getPokemonBaseStats(id, rawEntity?.base_stats || rawEntity?.stats);
  const stats = computeStatsAtLevel(baseStats, level);
  const capturedTotal = Math.max(0, toSafeInt(counters.captured_normal, 0)) + Math.max(0, toSafeInt(counters.captured_shiny, 0));
  const hasEntityUnlockedField =
    rawEntity && typeof rawEntity === "object" && Object.prototype.hasOwnProperty.call(rawEntity, "entity_unlocked");
  const entityUnlocked = hasEntityUnlockedField ? Boolean(rawEntity.entity_unlocked) : capturedTotal > 0;
  const appearanceOwnedVariants = normalizeSpriteVariantIdList(rawEntity?.appearance_owned_variants);
  const appearanceSelectedVariant = normalizeSpriteVariantId(rawEntity?.appearance_selected_variant);
  const appearanceShinyMode = Boolean(rawEntity?.appearance_shiny_mode);
  const appearanceUltraShinyMode = Boolean(rawEntity?.appearance_ultra_shiny_mode);
  const evolutionItemReadyTargets = normalizeEvolutionItemReadyTargets(rawEntity?.evolution_item_ready_targets);
  const nickname = sanitizePokemonNickname(rawEntity?.nickname ?? rawEntity?.custom_name ?? rawEntity?.customName ?? "");
  const happinessBoxStreakMs = Math.max(
    0,
    toSafeInt(rawEntity?.happiness_box_streak_ms ?? rawEntity?.happinessBoxStreakMs, 0),
  );
  const speciesNameEn = String(rawEntity?.species_name_en ?? rawEntity?.name_en ?? "").toLowerCase().trim();
  const talent = resolveTalentDefinition(
    rawEntity?.talent ?? {
      id: rawEntity?.talent_id ?? rawEntity?.talentId,
      name_fr: rawEntity?.talent_name_fr,
      name_en: rawEntity?.talent_name_en,
      description_fr: rawEntity?.talent_description_fr,
    },
    id,
  );

  return {
    id,
    level,
    xp,
    entity_unlocked: entityUnlocked,
    base_stats: baseStats,
    stats,
    appearance_owned_variants: appearanceOwnedVariants,
    appearance_selected_variant: appearanceSelectedVariant,
    appearance_shiny_mode: appearanceShinyMode,
    appearance_ultra_shiny_mode: appearanceUltraShinyMode,
    evolution_item_ready_targets: evolutionItemReadyTargets,
    nickname,
    happiness_box_streak_ms: happinessBoxStreakMs,
    species_name_en: speciesNameEn,
    talent,
    ...counters,
  };
}

function createPokemonEntityRecord(pokemonId, initialLevel = 1) {
  const level = clamp(toSafeInt(initialLevel, 1), 1, MAX_LEVEL);
  const def = state.pokemonDefsById.get(Number(pokemonId));
  const baseStats = getPokemonBaseStats(pokemonId);
  const stats = computeStatsAtLevel(baseStats, level);
  return {
    id: Number(pokemonId),
    level,
    xp: 0,
    entity_unlocked: false,
    base_stats: baseStats,
    stats,
    appearance_owned_variants: [],
    appearance_selected_variant: "",
    appearance_shiny_mode: false,
    appearance_ultra_shiny_mode: false,
    evolution_item_ready_targets: [],
    nickname: "",
    happiness_box_streak_ms: 0,
    species_name_en: String(def?.nameEn || "").toLowerCase().trim(),
    talent: getTalentDefinitionForPokemonId(pokemonId),
    ...createEmptySpeciesStats(),
  };
}

function createDefaultBallInventory() {
  const inventory = {};
  for (const ballType of Object.keys(BALL_CONFIG_BY_TYPE)) {
    inventory[ballType] = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(inventory, "poke_ball")) {
    inventory.poke_ball = 0;
  }
  return inventory;
}

function clampBallInventoryCount(value) {
  return clamp(toSafeInt(value, 0), 0, BALL_INVENTORY_MAX_PER_TYPE);
}

function normalizeBallInventory(rawInventory) {
  const normalized = createDefaultBallInventory();
  const source = rawInventory && typeof rawInventory === "object" ? rawInventory : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = clampBallInventoryCount(source[key]);
  }
  return normalized;
}

function createDefaultBallInventorySeen() {
  const seen = {};
  for (const ballType of Object.keys(BALL_CONFIG_BY_TYPE)) {
    seen[ballType] = ballType === "poke_ball";
  }
  if (!Object.prototype.hasOwnProperty.call(seen, "poke_ball")) {
    seen.poke_ball = true;
  }
  return seen;
}

function normalizeBallInventorySeen(rawSeen, ballInventory = null) {
  const normalized = createDefaultBallInventorySeen();
  const source = rawSeen && typeof rawSeen === "object" ? rawSeen : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = Boolean(source[key]);
  }
  const inventory = ballInventory && typeof ballInventory === "object" ? ballInventory : {};
  for (const key of Object.keys(normalized)) {
    if (Math.max(0, toSafeInt(inventory[key], 0)) > 0) {
      normalized[key] = true;
    }
  }
  normalized.poke_ball = true;
  return normalized;
}

function createDefaultSingleBallCaptureRules() {
  return {
    [BALL_CAPTURE_RULE_CAPTURE_ALL]: true,
    [BALL_CAPTURE_RULE_CAPTURE_UNOWNED]: true,
    [BALL_CAPTURE_RULE_CAPTURE_SHINY]: true,
    [BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]: true,
  };
}

function normalizeSingleBallCaptureRules(rawRules) {
  const source = rawRules && typeof rawRules === "object" ? rawRules : {};
  const normalized = {
    [BALL_CAPTURE_RULE_CAPTURE_ALL]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_ALL]),
    [BALL_CAPTURE_RULE_CAPTURE_UNOWNED]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_UNOWNED]),
    [BALL_CAPTURE_RULE_CAPTURE_SHINY]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_SHINY]),
    [BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]),
  };
  if (!Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_ALL)) {
    normalized[BALL_CAPTURE_RULE_CAPTURE_ALL] = true;
  }
  if (
    !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_UNOWNED)
    && !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_SHINY)
    && !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY)
  ) {
    normalized[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_SHINY] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY] = true;
  }
  if (normalized[BALL_CAPTURE_RULE_CAPTURE_ALL]) {
    normalized[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_SHINY] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY] = true;
  }
  return normalized;
}

function createDefaultBallCaptureRulesByType() {
  const rulesByType = {};
  for (const ballType of Object.keys(BALL_CONFIG_BY_TYPE)) {
    rulesByType[ballType] = createDefaultSingleBallCaptureRules();
  }
  if (!Object.prototype.hasOwnProperty.call(rulesByType, "poke_ball")) {
    rulesByType.poke_ball = createDefaultSingleBallCaptureRules();
  }
  return rulesByType;
}

function normalizeBallCaptureRulesByType(rawRulesByType) {
  const normalized = createDefaultBallCaptureRulesByType();
  const source = rawRulesByType && typeof rawRulesByType === "object" ? rawRulesByType : {};
  for (const ballType of Object.keys(normalized)) {
    normalized[ballType] = normalizeSingleBallCaptureRules(source[ballType]);
  }
  return normalized;
}

function computeBallInventoryTotal(ballInventory) {
  if (!ballInventory || typeof ballInventory !== "object") {
    return 0;
  }
  return Object.values(ballInventory).reduce((sum, count) => sum + clampBallInventoryCount(count), 0);
}

function hasStructuredBallInventory(rawInventory) {
  if (!rawInventory || typeof rawInventory !== "object") {
    return false;
  }
  const defaultInventory = createDefaultBallInventory();
  return Object.keys(defaultInventory).some((key) => Object.prototype.hasOwnProperty.call(rawInventory, key));
}

function isBallTypeComingSoon(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  return COMING_SOON_BALL_TYPES.has(type);
}

function createDefaultShopItemsInventory() {
  const inventory = {};
  for (const item of Object.values(SHOP_ITEM_CONFIG_BY_ID)) {
    if (!item || item.itemType === "ball" || !item.stockTracked) {
      continue;
    }
    inventory[item.id] = 0;
  }
  return inventory;
}

function normalizeShopItemsInventory(rawInventory) {
  const normalized = createDefaultShopItemsInventory();
  const source = rawInventory && typeof rawInventory === "object" ? rawInventory : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = Math.max(0, toSafeInt(source[key], 0));
  }
  return normalized;
}

function createDefaultTutorialProgress() {
  return {
    route1_intro_seen: false,
    evolution_intro_seen: false,
    appearance_intro_seen: false,
    appearance_editor_unlocked: false,
  };
}

function hasUnlockedEntityAtLeastLevelFromRecords(rawEntities, minLevel = APPEARANCE_UNLOCK_LEVEL) {
  if (!rawEntities || typeof rawEntities !== "object") {
    return false;
  }
  const targetLevel = clamp(toSafeInt(minLevel, APPEARANCE_UNLOCK_LEVEL), 1, MAX_LEVEL);
  for (const [rawId, rawRecord] of Object.entries(rawEntities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    const level = clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL);
    if (level >= targetLevel) {
      return true;
    }
  }
  return false;
}

function normalizeTutorialProgress(rawTutorials, rawEntities = null) {
  const source = rawTutorials && typeof rawTutorials === "object" ? rawTutorials : {};
  const normalized = createDefaultTutorialProgress();
  normalized.route1_intro_seen = Boolean(source.route1_intro_seen);
  normalized.evolution_intro_seen = Boolean(source.evolution_intro_seen);
  normalized.appearance_intro_seen = Boolean(source.appearance_intro_seen);
  normalized.appearance_editor_unlocked = Boolean(source.appearance_editor_unlocked);

  if (hasUnlockedEntityAtLeastLevelFromRecords(rawEntities, APPEARANCE_UNLOCK_LEVEL)) {
    normalized.appearance_editor_unlocked = true;
  }
  return normalized;
}

function getLegacyPokeballCount(rawSave) {
  return Math.max(0, toSafeInt(rawSave?.pokeballs, 0));
}

function markEconomyNormalizationDirty() {
  state.economyNormalization.saveDataRef = null;
}

function createEmptySave() {
  return {
    version: SAVE_VERSION,
    app_build_version: APP_VERSION,
    starter_chosen: false,
    current_route_id: DEFAULT_ROUTE_ID,
    unlocked_route_ids: [DEFAULT_ROUTE_ID],
    route_defeat_counts: createRouteDefeatCounts(ROUTE_ID_ORDER),
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 0,
    coins: 0,
    first_free_pokeball_claimed: false,
    first_free_pokeball_guaranteed_capture_pending: false,
    ball_inventory: createDefaultBallInventory(),
    ball_inventory_seen: createDefaultBallInventorySeen(),
    ball_capture_rules: createDefaultBallCaptureRulesByType(),
    active_ball_type: getDefaultActiveBallType(),
    shop_items: createDefaultShopItemsInventory(),
    attack_boost_until_ms: 0,
    pokeballs: 0,
    tutorials: createDefaultTutorialProgress(),
  };
}

function getRawSaveVersion(rawSave) {
  return Math.max(0, toSafeInt(rawSave?.version, 0));
}

function getRawSaveAppVersion(rawSave) {
  if (!rawSave || typeof rawSave !== "object") {
    return "";
  }
  const buildVersion = String(rawSave.app_build_version || "").trim();
  if (buildVersion) {
    return buildVersion;
  }
  return String(rawSave.app_version || "").trim();
}

function isRawSaveVersionSupported(rawSave) {
  return getRawSaveVersion(rawSave) >= MIN_SUPPORTED_SAVE_VERSION;
}

function isRawSaveAppVersionSupported(rawSave) {
  return isVersionAtLeast(getRawSaveAppVersion(rawSave), MIN_SUPPORTED_SAVE_APP_VERSION);
}

function isRawSaveSupported(rawSave) {
  return isRawSaveVersionSupported(rawSave) && isRawSaveAppVersionSupported(rawSave);
}

function repairNormalizedSaveSnapshot(saveData) {
  const repairResult = repairNormalizedSaveData(saveData, {
    maxTeamSize: MAX_TEAM_SIZE,
    defaultRouteId: DEFAULT_ROUTE_ID,
  });

  if (!repairResult.orphanedProgress) {
    return {
      saveData,
      changed: repairResult.changed,
      recoveredTeam: repairResult.recoveredTeam,
      hardResetApplied: false,
    };
  }

  return {
    saveData: createEmptySave(),
    changed: true,
    recoveredTeam: false,
    hardResetApplied: true,
  };
}

function getRecoverableOwnedEntityIdsForRuntime() {
  if (!state.saveData) {
    return [];
  }
  return getOwnedEntityIdsFromSave(state.saveData, {
    maxTeamSize: MAX_TEAM_SIZE,
  }).filter((pokemonId) => state.pokemonDefsById.has(Number(pokemonId)));
}

function syncSpeciesIdentityForRecord(record, pokemonId) {
  if (!record) {
    return false;
  }
  const def = state.pokemonDefsById.get(Number(pokemonId));
  const speciesNameEn = String(def?.nameEn || "").toLowerCase().trim();
  if (!speciesNameEn || record.species_name_en === speciesNameEn) {
    return false;
  }
  record.species_name_en = speciesNameEn;
  return true;
}

function backfillSaveSpeciesIdentity() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return false;
  }

  let changed = false;
  for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(record?.id || rawId || 0);
    if (pokemonId <= 0 || !record) {
      continue;
    }
    if (syncSpeciesIdentityForRecord(record, pokemonId)) {
      changed = true;
    }
  }
  return changed;
}

function repairRuntimeSaveAfterDefinitionsLoaded() {
  if (!state.saveData) {
    return {
      changed: false,
      recoveredTeam: false,
      hardResetApplied: false,
    };
  }

  let changed = backfillSaveSpeciesIdentity();
  const ownedEntityIds = getOwnedEntityIdsFromSave(state.saveData, {
    maxTeamSize: MAX_TEAM_SIZE,
  });
  const recoverableOwnedIds = getRecoverableOwnedEntityIdsForRuntime();
  const recoverableOwnedSet = new Set(recoverableOwnedIds);
  const nextTeam = [];
  const currentTeam = Array.isArray(state.saveData.team) ? state.saveData.team : [];

  for (const rawId of currentTeam) {
    const id = Number(rawId);
    if (id <= 0 || nextTeam.includes(id) || !recoverableOwnedSet.has(id)) {
      continue;
    }
    nextTeam.push(id);
    if (nextTeam.length >= MAX_TEAM_SIZE) {
      break;
    }
  }

  let recoveredTeam = false;
  if (nextTeam.length <= 0 && recoverableOwnedIds.length > 0) {
    nextTeam.push(...recoverableOwnedIds.slice(0, MAX_TEAM_SIZE));
    recoveredTeam = true;
  }

  if (JSON.stringify(currentTeam) !== JSON.stringify(nextTeam)) {
    state.saveData.team = nextTeam;
    changed = true;
  }

  const shouldHaveStarter = nextTeam.length > 0 || ownedEntityIds.length > 0;
  if (Boolean(state.saveData.starter_chosen) !== shouldHaveStarter) {
    state.saveData.starter_chosen = shouldHaveStarter;
    changed = true;
  }

  if (!shouldHaveStarter && ownedEntityIds.length <= 0 && hasMeaningfulSaveProgress(state.saveData, DEFAULT_ROUTE_ID)) {
    state.saveData = createEmptySave();
    return {
      changed: true,
      recoveredTeam: false,
      hardResetApplied: true,
    };
  }

  return {
    changed,
    recoveredTeam,
    hardResetApplied: false,
  };
}

function normalizeUnlockedRouteIds(rawIds, availableRouteIds = ROUTE_ID_ORDER) {
  const ordered =
    Array.isArray(availableRouteIds) && availableRouteIds.length > 0
      ? availableRouteIds.map((routeId) => String(routeId || ""))
      : [DEFAULT_ROUTE_ID];
  const allowed = new Set(ordered);
  allowed.add(DEFAULT_ROUTE_ID);

  const normalized = [];
  const source = Array.isArray(rawIds) ? rawIds : [];
  for (const routeIdRaw of source) {
    const routeId = String(routeIdRaw || "");
    if (!allowed.has(routeId) || normalized.includes(routeId)) {
      continue;
    }
    normalized.push(routeId);
  }

  if (!normalized.includes(DEFAULT_ROUTE_ID)) {
    normalized.unshift(DEFAULT_ROUTE_ID);
  }

  let furthestIndex = -1;
  for (const unlockedId of normalized) {
    const idx = ordered.indexOf(unlockedId);
    if (idx > furthestIndex) {
      furthestIndex = idx;
    }
  }
  if (furthestIndex < 0) {
    return [DEFAULT_ROUTE_ID];
  }

  const contiguous = ordered.slice(0, furthestIndex + 1).filter((routeId) => allowed.has(routeId));
  if (!contiguous.includes(DEFAULT_ROUTE_ID)) {
    contiguous.unshift(DEFAULT_ROUTE_ID);
  }
  return contiguous;
}

function createRouteDefeatCounts(availableRouteIds = ROUTE_ID_ORDER) {
  const source =
    Array.isArray(availableRouteIds) && availableRouteIds.length > 0 ? availableRouteIds : [DEFAULT_ROUTE_ID];
  const counts = {};
  for (const routeIdRaw of source) {
    const routeId = String(routeIdRaw || "");
    if (!routeId) {
      continue;
    }
    counts[routeId] = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(counts, DEFAULT_ROUTE_ID)) {
    counts[DEFAULT_ROUTE_ID] = 0;
  }
  return counts;
}

function normalizeRouteDefeatCounts(rawCounts, availableRouteIds = ROUTE_ID_ORDER) {
  const counts = createRouteDefeatCounts(availableRouteIds);
  const source = rawCounts && typeof rawCounts === "object" ? rawCounts : {};
  for (const routeId of Object.keys(counts)) {
    counts[routeId] = Math.max(0, toSafeInt(source[routeId], 0));
  }
  return counts;
}

function normalizeSave(rawSave) {
  const base = createEmptySave();
  if (!rawSave || typeof rawSave !== "object") {
    return base;
  }

  const normalizedTeam = [];
  const rawTeamEntries = Array.isArray(rawSave.team) ? rawSave.team : [];
  for (const teamEntry of rawTeamEntries) {
    const id =
      typeof teamEntry === "number" ? Number(teamEntry) : Number(teamEntry?.id || teamEntry?.pokemon_id || 0);
    if (id <= 0 || normalizedTeam.includes(id)) {
      continue;
    }
    normalizedTeam.push(id);
    if (normalizedTeam.length >= MAX_TEAM_SIZE) {
      break;
    }
  }

  const entities = {};
  const rawEntities = rawSave.pokemon_entities;
  if (rawEntities && typeof rawEntities === "object") {
    for (const [key, rawEntity] of Object.entries(rawEntities)) {
      const id = Number(rawEntity?.id || key);
      if (id <= 0) {
        continue;
      }
      entities[String(id)] = normalizePokemonEntityRecord(rawEntity, id);
    }
  } else {
    const legacySpeciesStats = rawSave.species_stats && typeof rawSave.species_stats === "object" ? rawSave.species_stats : {};
    const legacyTeamEntries = Array.isArray(rawSave.team) ? rawSave.team : [];
    const allIds = new Set();
    for (const key of Object.keys(legacySpeciesStats)) {
      const id = Number(key);
      if (id > 0) {
        allIds.add(id);
      }
    }
    for (const teamEntry of legacyTeamEntries) {
      const id = Number(teamEntry?.id || teamEntry);
      if (id > 0) {
        allIds.add(id);
      }
    }

    for (const id of allIds) {
      const legacyStats = legacySpeciesStats[String(id)] || {};
      let level = 1;
      for (const teamEntry of legacyTeamEntries) {
        if (Number(teamEntry?.id || teamEntry) === id) {
          level = Math.max(level, clamp(toSafeInt(teamEntry?.level, 1), 1, MAX_LEVEL));
        }
      }

      const normalizedLegacy = normalizePokemonEntityRecord(
        {
          ...legacyStats,
          level,
          xp: 0,
        },
        id,
      );

      if (normalizedTeam.includes(id)) {
        normalizedLegacy.captured_normal = Math.max(1, normalizedLegacy.captured_normal);
        normalizedLegacy.encountered_normal = Math.max(
          normalizedLegacy.encountered_normal,
          normalizedLegacy.captured_normal,
        );
        normalizedLegacy.entity_unlocked = true;
      }

      entities[String(id)] = normalizedLegacy;
    }
  }

  for (const teamId of normalizedTeam) {
    const key = String(teamId);
    if (!entities[key]) {
      entities[key] = createPokemonEntityRecord(teamId, 1);
      entities[key].captured_normal = 1;
      entities[key].encountered_normal = 1;
    }
    markEntityUnlocked(entities[key], true);
  }

  const unlockedRouteIds = normalizeUnlockedRouteIds(rawSave.unlocked_route_ids, ROUTE_ID_ORDER);
  const currentRouteCandidate = typeof rawSave.current_route_id === "string" ? rawSave.current_route_id : base.current_route_id;
  const currentRouteId = unlockedRouteIds.includes(currentRouteCandidate) ? currentRouteCandidate : unlockedRouteIds[0];
  const routeDefeatCounts = normalizeRouteDefeatCounts(rawSave.route_defeat_counts, ROUTE_ID_ORDER);

  if (!rawSave.route_defeat_counts || typeof rawSave.route_defeat_counts !== "object") {
    let legacyTotalDefeats = 0;
    for (const record of Object.values(entities)) {
      legacyTotalDefeats += Math.max(0, toSafeInt(record?.defeated_normal, 0));
      legacyTotalDefeats += Math.max(0, toSafeInt(record?.defeated_shiny, 0));
    }
    routeDefeatCounts[currentRouteId] = Math.max(routeDefeatCounts[currentRouteId] || 0, legacyTotalDefeats);
  }

  const ballInventory = normalizeBallInventory(rawSave.ball_inventory);
  const legacyPokeballs = getLegacyPokeballCount(rawSave);
  const currentInventoryTotal = computeBallInventoryTotal(ballInventory);
  if (currentInventoryTotal <= 0 && legacyPokeballs > 0) {
    ballInventory[getLegacyBallBackfillType()] = legacyPokeballs;
  }
  const ballInventorySeen = normalizeBallInventorySeen(rawSave.ball_inventory_seen, ballInventory);
  const ballCaptureRules = normalizeBallCaptureRulesByType(rawSave.ball_capture_rules);

  const activeBallTypeRaw = String(rawSave.active_ball_type || "").toLowerCase().trim();
  const activeBallType = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeBallTypeRaw)
    ? activeBallTypeRaw
    : getDefaultActiveBallType();
  const shopItems = normalizeShopItemsInventory(rawSave.shop_items);
  const attackBoostUntilMs = Math.max(0, toSafeInt(rawSave.attack_boost_until_ms, 0));
  const totalPokeballs = computeBallInventoryTotal(ballInventory);
  const tutorials = normalizeTutorialProgress(rawSave.tutorials, entities);
  const hasFirstFreePokeballClaimedField = Object.prototype.hasOwnProperty.call(rawSave, "first_free_pokeball_claimed");
  const firstFreePokeballClaimed = hasFirstFreePokeballClaimedField
    ? Boolean(rawSave.first_free_pokeball_claimed)
    : totalPokeballs > 0;
  const firstFreePokeballGuaranteedCapturePending =
    firstFreePokeballClaimed && Boolean(rawSave.first_free_pokeball_guaranteed_capture_pending);

  return {
    version: SAVE_VERSION,
    app_build_version: APP_VERSION,
    starter_chosen:
      Boolean(rawSave.starter_chosen) || normalizedTeam.length > 0 || Object.values(entities).some((record) => isEntityUnlocked(record)),
    current_route_id: currentRouteId,
    unlocked_route_ids: unlockedRouteIds,
    route_defeat_counts: routeDefeatCounts,
    last_tick_epoch_ms: Math.max(0, toSafeInt(rawSave.last_tick_epoch_ms, 0)),
    team: normalizedTeam,
    pokemon_entities: entities,
    money: Math.max(0, toSafeInt(rawSave.money, 0)),
    coins: Math.max(0, toSafeInt(rawSave.coins, 0)),
    first_free_pokeball_claimed: firstFreePokeballClaimed,
    first_free_pokeball_guaranteed_capture_pending: firstFreePokeballGuaranteedCapturePending,
    ball_inventory: ballInventory,
    ball_inventory_seen: ballInventorySeen,
    ball_capture_rules: ballCaptureRules,
    active_ball_type: activeBallType,
    shop_items: shopItems,
    attack_boost_until_ms: attackBoostUntilMs,
    pokeballs: Math.max(0, totalPokeballs),
    tutorials,
  };
}

function getTutorialFlowDefinition(flowId) {
  return TUTORIAL_FLOW_DEFINITIONS[String(flowId || "")] || null;
}

function getTutorialProgress() {
  if (!state.saveData) {
    return createDefaultTutorialProgress();
  }
  state.saveData.tutorials = normalizeTutorialProgress(state.saveData.tutorials, state.saveData.pokemon_entities);
  return state.saveData.tutorials;
}

function isTutorialFlowSeen(flowId) {
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow) {
    return true;
  }
  const tutorials = getTutorialProgress();
  return Boolean(tutorials[flow.saveFlag]);
}

function markTutorialFlowSeen(flowId) {
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow || !state.saveData) {
    return false;
  }
  const tutorials = getTutorialProgress();
  if (tutorials[flow.saveFlag]) {
    return false;
  }
  tutorials[flow.saveFlag] = true;
  return true;
}

function hasUnlockedEntityAtLeastLevel(minLevel = APPEARANCE_UNLOCK_LEVEL) {
  return hasUnlockedEntityAtLeastLevelFromRecords(state.saveData?.pokemon_entities, minLevel);
}

function isAppearanceEditorUnlocked() {
  const tutorials = getTutorialProgress();
  return Boolean(tutorials.appearance_editor_unlocked);
}

function isTutorialFlowQueuedOrActive(flowId) {
  const id = String(flowId || "");
  if (!id) {
    return false;
  }
  if (String(state.tutorial.active?.flowId || "") === id) {
    return true;
  }
  return Array.isArray(state.tutorial.queue)
    && state.tutorial.queue.some((entry) => String(entry?.flowId || "") === id);
}

function enqueueTutorialFlow(flowId) {
  if (!state.saveData) {
    return false;
  }
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow) {
    return false;
  }
  if (isTutorialFlowSeen(flowId) || isTutorialFlowQueuedOrActive(flowId)) {
    return false;
  }
  state.tutorial.queue.push({
    flowId: String(flowId),
    pageIndex: 0,
  });
  return true;
}

function isStarterModalVisible() {
  return Boolean(starterModalEl && !starterModalEl.classList.contains("hidden"));
}

function canOpenTutorialModalNow() {
  if (!tutorialModalEl || !state.saveData || state.mode !== "ready") {
    return false;
  }
  if (!state.saveData.starter_chosen || isStarterModalVisible()) {
    return false;
  }
  if (state.ui.tutorialOpen) {
    return false;
  }
  if (state.evolutionAnimation.current) {
    return false;
  }
  if (state.ui.mapOpen || state.ui.shopOpen || state.ui.boxesOpen || state.ui.appearanceOpen) {
    return false;
  }
  return true;
}

function renderTutorialModal() {
  if (!tutorialModalEl || !state.ui.tutorialOpen) {
    return;
  }
  const active = state.tutorial.active;
  const flow = getTutorialFlowDefinition(active?.flowId);
  if (!active || !flow) {
    return;
  }
  const pages = Array.isArray(flow.pages) ? flow.pages : [];
  const pageCount = Math.max(1, pages.length);
  const pageIndex = clamp(toSafeInt(active.pageIndex, 0), 0, pageCount - 1);
  state.tutorial.active.pageIndex = pageIndex;
  const page = pages[pageIndex] || pages[0] || { title: "Tuto", lines: [] };

  if (tutorialTitleEl) {
    tutorialTitleEl.textContent = flow.title || "Tuto";
  }
  if (tutorialPageTitleEl) {
    tutorialPageTitleEl.textContent = page.title || "";
  }
  if (tutorialProgressEl) {
    tutorialProgressEl.textContent = `Etape ${pageIndex + 1}/${pageCount}`;
  }
  if (tutorialBodyEl) {
    tutorialBodyEl.innerHTML = "";
    const lines = Array.isArray(page.lines) ? page.lines : [];
    if (lines.length <= 0) {
      const fallback = document.createElement("p");
      fallback.textContent = "Aucune information supplementaire.";
      tutorialBodyEl.appendChild(fallback);
    } else {
      const list = document.createElement("ul");
      list.className = "tutorial-list";
      for (const line of lines) {
        const item = document.createElement("li");
        item.textContent = String(line || "");
        list.appendChild(item);
      }
      tutorialBodyEl.appendChild(list);
    }
  }
  if (tutorialPrevButtonEl) {
    tutorialPrevButtonEl.disabled = pageIndex <= 0;
  }
  if (tutorialNextButtonEl) {
    tutorialNextButtonEl.textContent = pageIndex >= pageCount - 1 ? "Terminer" : "Suivant";
  }
}

function closeTutorialModal() {
  state.ui.tutorialOpen = false;
  state.tutorial.active = null;
  if (tutorialModalEl) {
    tutorialModalEl.classList.add("hidden");
  }
  if (tutorialBodyEl) {
    tutorialBodyEl.innerHTML = "";
  }
  tryOpenPendingTutorialFlow();
}

function openTutorialFlow(flowId, initialPage = 0) {
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow || !canOpenTutorialModalNow()) {
    return false;
  }
  if (isTutorialFlowSeen(flowId)) {
    return false;
  }
  markTutorialFlowSeen(flowId);
  hideHoverPopup();
  setMapOpen(false);
  setShopOpen(false);
  closeBoxesModal();
  closeAppearanceModal();
  state.tutorial.active = {
    flowId: String(flowId),
    pageIndex: clamp(toSafeInt(initialPage, 0), 0, Math.max(0, (flow.pages?.length || 1) - 1)),
  };
  state.ui.tutorialOpen = true;
  tutorialModalEl.classList.remove("hidden");
  renderTutorialModal();
  persistSaveDataForSimulationEvent();
  return true;
}

function tryOpenPendingTutorialFlow() {
  if (!canOpenTutorialModalNow()) {
    return false;
  }
  while (Array.isArray(state.tutorial.queue) && state.tutorial.queue.length > 0) {
    const next = state.tutorial.queue.shift();
    const flowId = String(next?.flowId || "");
    if (!flowId || isTutorialFlowSeen(flowId)) {
      continue;
    }
    return openTutorialFlow(flowId, toSafeInt(next?.pageIndex, 0));
  }
  return false;
}

function queueRoute1TutorialIfNeeded(routeId = state.routeData?.route_id) {
  if (!state.saveData || String(routeId || "") !== ROUTE_1_TUTORIAL_ID) {
    return false;
  }
  const queued = enqueueTutorialFlow(TUTORIAL_FLOW_ROUTE_1);
  if (queued) {
    tryOpenPendingTutorialFlow();
  }
  return queued;
}

function queueEvolutionTutorialIfNeeded() {
  if (!state.saveData) {
    return false;
  }
  const queued = enqueueTutorialFlow(TUTORIAL_FLOW_EVOLUTION);
  if (queued) {
    tryOpenPendingTutorialFlow();
  }
  return queued;
}

function queueAppearanceTutorialIfNeeded() {
  if (!state.saveData || !isAppearanceEditorUnlocked()) {
    return false;
  }
  const queued = enqueueTutorialFlow(TUTORIAL_FLOW_APPEARANCE);
  if (queued) {
    tryOpenPendingTutorialFlow();
  }
  return queued;
}

function ensureAppearanceEditorUnlockedFromProgress() {
  if (!state.saveData) {
    return false;
  }
  const tutorials = getTutorialProgress();
  if (tutorials.appearance_editor_unlocked) {
    queueAppearanceTutorialIfNeeded();
    return false;
  }
  if (!hasUnlockedEntityAtLeastLevel(APPEARANCE_UNLOCK_LEVEL)) {
    return false;
  }
  tutorials.appearance_editor_unlocked = true;
  queueAppearanceTutorialIfNeeded();
  return true;
}

function getBrowserStorageArea(areaName) {
  try {
    return window?.[areaName] || null;
  } catch {
    return null;
  }
}

function readSaveDataFromStorageKey(areaName, key, contextLabel) {
  const storageArea = getBrowserStorageArea(areaName);
  if (!storageArea || typeof storageArea.getItem !== "function") {
    return null;
  }
  try {
    const raw = storageArea.getItem(key);
    if (!raw) {
      return null;
    }
    const saveRaw = parseSerializedSave(raw, contextLabel);
    if (!isRawSaveSupported(saveRaw)) {
      removeSaveDataFromStorageKey(areaName, key);
      return null;
    }
    return normalizeSave(saveRaw);
  } catch {
    return null;
  }
}

function writeSerializedSaveToStorageKey(areaName, key, serializedSave) {
  const storageArea = getBrowserStorageArea(areaName);
  if (!storageArea || typeof storageArea.setItem !== "function") {
    return false;
  }
  try {
    storageArea.setItem(key, serializedSave);
    return true;
  } catch {
    return false;
  }
}

function removeSaveDataFromStorageKey(areaName, key) {
  const storageArea = getBrowserStorageArea(areaName);
  if (!storageArea || typeof storageArea.removeItem !== "function") {
    return false;
  }
  try {
    storageArea.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readSaveDataFromLocalStorage() {
  return readSaveDataFromStorageKey("localStorage", SAVE_KEY, "localStorage save");
}

function readSaveDataFromSessionStorage() {
  return readSaveDataFromStorageKey("sessionStorage", SAVE_SESSION_KEY, "sessionStorage save");
}

function hasIndexedDbSaveSupport() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function getDevSeedSaveUrl() {
  if (isProductionGithubPagesLocation(window.location)) {
    return "";
  }

  try {
    const currentUrl = new URL(window.location.href);
    const rawValue = currentUrl.searchParams.get(DEV_SEED_SAVE_QUERY_PARAM);
    if (!rawValue) {
      return "";
    }
    const resolved = new URL(rawValue, currentUrl.href);
    return resolved.origin === currentUrl.origin ? resolved.toString() : "";
  } catch {
    return "";
  }
}

async function readSeededDevSaveData() {
  const seedUrl = getDevSeedSaveUrl();
  if (!seedUrl) {
    return null;
  }

  try {
    const response = await fetch(seedUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const saveRaw = parseSerializedSave(await response.text(), "dev seeded save");
    if (!isRawSaveSupported(saveRaw)) {
      return null;
    }
    return normalizeSave(saveRaw);
  } catch (error) {
    console.warn("Dev seed save ignoree:", error?.message || error);
    return null;
  }
}

let saveIndexedDbOpenPromise = null;

async function openSaveIndexedDb() {
  if (!hasIndexedDbSaveSupport()) {
    state.saveBackend.indexedDbAvailable = false;
    return null;
  }

  if (!saveIndexedDbOpenPromise) {
    saveIndexedDbOpenPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(SAVE_INDEXED_DB_NAME, 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(SAVE_INDEXED_DB_STORE_NAME)) {
            database.createObjectStore(SAVE_INDEXED_DB_STORE_NAME, { keyPath: "id" });
          }
        };
        request.onsuccess = () => {
          state.saveBackend.indexedDbAvailable = true;
          resolve(request.result);
        };
        request.onerror = () => {
          state.saveBackend.indexedDbAvailable = false;
          resolve(null);
        };
        request.onblocked = () => {
          state.saveBackend.indexedDbAvailable = false;
          resolve(null);
        };
      } catch {
        state.saveBackend.indexedDbAvailable = false;
        resolve(null);
      }
    });
  }

  return saveIndexedDbOpenPromise;
}

async function readSaveDataFromIndexedDb() {
  const database = await openSaveIndexedDb();
  if (!database) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(SAVE_INDEXED_DB_STORE_NAME, "readonly");
      const store = transaction.objectStore(SAVE_INDEXED_DB_STORE_NAME);
      const request = store.get(SAVE_INDEXED_DB_RECORD_KEY);
      request.onsuccess = () => {
        const serializedSave = typeof request.result?.serializedSave === "string" ? request.result.serializedSave : "";
        if (!serializedSave) {
          resolve(null);
          return;
        }
        try {
          const saveRaw = parseSerializedSave(serializedSave, "indexedDB save");
          if (!isRawSaveSupported(saveRaw)) {
            void deleteSaveDataFromIndexedDb();
            resolve(null);
            return;
          }
          state.saveBackend.indexedDbAvailable = true;
          resolve(normalizeSave(saveRaw));
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => {
        state.saveBackend.indexedDbAvailable = false;
        resolve(null);
      };
    } catch {
      state.saveBackend.indexedDbAvailable = false;
      resolve(null);
    }
  });
}

async function writeSerializedSaveToIndexedDb(serializedSave) {
  const database = await openSaveIndexedDb();
  if (!database) {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(SAVE_INDEXED_DB_STORE_NAME, "readwrite");
      transaction.oncomplete = () => {
        state.saveBackend.indexedDbAvailable = true;
        resolve(true);
      };
      transaction.onerror = () => {
        state.saveBackend.indexedDbAvailable = false;
        resolve(false);
      };
      transaction.onabort = () => {
        state.saveBackend.indexedDbAvailable = false;
        resolve(false);
      };
      const store = transaction.objectStore(SAVE_INDEXED_DB_STORE_NAME);
      store.put({
        id: SAVE_INDEXED_DB_RECORD_KEY,
        serializedSave,
        updatedAt: Date.now(),
      });
    } catch {
      state.saveBackend.indexedDbAvailable = false;
      resolve(false);
    }
  });
}

async function deleteSaveDataFromIndexedDb() {
  const database = await openSaveIndexedDb();
  if (!database) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(SAVE_INDEXED_DB_STORE_NAME, "readwrite");
      transaction.oncomplete = () => {
        state.saveBackend.indexedDbAvailable = true;
        resolve(true);
      };
      transaction.onerror = () => {
        state.saveBackend.indexedDbAvailable = false;
        resolve(false);
      };
      transaction.onabort = () => {
        state.saveBackend.indexedDbAvailable = false;
        resolve(false);
      };
      const store = transaction.objectStore(SAVE_INDEXED_DB_STORE_NAME);
      store.delete(SAVE_INDEXED_DB_RECORD_KEY);
    } catch {
      state.saveBackend.indexedDbAvailable = false;
      resolve(false);
    }
  });
}

function clearBrowserSaveRetry() {
  if (!state.saveBackend.retryTimerId) {
    return;
  }
  window.clearTimeout(state.saveBackend.retryTimerId);
  state.saveBackend.retryTimerId = 0;
}

function scheduleBrowserSaveRetry() {
  if (state.saveBackend.retryTimerId || !hasIndexedDbSaveSupport()) {
    return;
  }
  state.saveBackend.retryTimerId = window.setTimeout(() => {
    state.saveBackend.retryTimerId = 0;
    void drainPendingBrowserSaveWrites();
  }, 900);
}

async function drainPendingBrowserSaveWrites() {
  if (state.saveBackend.indexedDbWriteInFlight || !state.saveBackend.pendingSerializedSave) {
    return;
  }

  clearBrowserSaveRetry();
  state.saveBackend.indexedDbWriteInFlight = true;
  try {
    while (state.saveBackend.pendingSerializedSave) {
      const serializedSave = state.saveBackend.pendingSerializedSave;
      const ok = await writeSerializedSaveToIndexedDb(serializedSave);
      if (!ok) {
        if (state.saveBackend.indexedDbAvailable === false) {
          state.saveBackend.pendingSerializedSave = null;
          if (!state.saveBackend.syncStorageAvailable) {
            state.saveBackend.lastPersistSucceeded = false;
          }
        }
        break;
      }
      if (state.saveBackend.pendingSerializedSave === serializedSave) {
        state.saveBackend.pendingSerializedSave = null;
      }
      state.saveBackend.lastPersistSucceeded = true;
    }
  } finally {
    state.saveBackend.indexedDbWriteInFlight = false;
    updateSaveBackendIndicator();
    if (state.saveBackend.pendingSerializedSave && state.saveBackend.indexedDbAvailable !== false) {
      scheduleBrowserSaveRetry();
    }
  }
}

function queueBrowserSaveWrite(serializedSave) {
  if (!hasIndexedDbSaveSupport()) {
    state.saveBackend.indexedDbAvailable = false;
    return;
  }
  state.saveBackend.pendingSerializedSave = serializedSave;
  if (!state.saveBackend.indexedDbWriteInFlight) {
    void drainPendingBrowserSaveWrites();
  }
}

function syncSerializedSaveToBrowserStorage(serializedSave) {
  const localStorageOk = writeSerializedSaveToStorageKey("localStorage", SAVE_KEY, serializedSave);
  const sessionStorageOk = writeSerializedSaveToStorageKey("sessionStorage", SAVE_SESSION_KEY, serializedSave);
  state.saveBackend.syncStorageAvailable = localStorageOk || sessionStorageOk;
  state.saveBackend.lastPersistSucceeded = state.saveBackend.syncStorageAvailable || hasIndexedDbSaveSupport();
  queueBrowserSaveWrite(serializedSave);
  updateSaveBackendIndicator();
  return state.saveBackend.lastPersistSucceeded;
}

function updateSaveBackendIndicator() {
  if (!saveBackendValueEl) {
    return;
  }
  const nextLabel = state.saveBackend.lastPersistSucceeded
    ? "Sauvegarde navigateur"
    : "Sauvegarde indisponible";
  if (saveBackendValueEl.textContent !== nextLabel) {
    saveBackendValueEl.textContent = nextLabel;
  }
}

function getSaveTickEpochMs(savePayload) {
  return Math.max(0, toSafeInt(savePayload?.last_tick_epoch_ms, 0));
}

async function loadSaveData() {
  let selected = await readSeededDevSaveData();
  if (!selected) {
    const candidates = [];
    const localStorageSave = readSaveDataFromLocalStorage();
    if (localStorageSave) {
      candidates.push({
        source: SAVE_SOURCE_LOCAL_STORAGE,
        saveData: localStorageSave,
      });
    }

    const sessionStorageSave = readSaveDataFromSessionStorage();
    if (sessionStorageSave) {
      candidates.push({
        source: SAVE_SOURCE_SESSION_STORAGE,
        saveData: sessionStorageSave,
      });
    }

    const indexedDbSave = await readSaveDataFromIndexedDb();
    if (indexedDbSave) {
      candidates.push({
        source: SAVE_SOURCE_INDEXED_DB,
        saveData: indexedDbSave,
      });
    }

    selected = pickPreferredSaveCandidate(candidates)?.saveData || createEmptySave();
  }

  const repairResult = repairNormalizedSaveSnapshot(selected);
  selected = repairResult.saveData;
  syncSerializedSaveToBrowserStorage(JSON.stringify(selected));
  return selected;
}

function persistSaveData(_options = {}) {
  if (!state.saveData) {
    return;
  }
  state.saveData.version = SAVE_VERSION;
  state.saveData.app_build_version = APP_VERSION;
  state.saveData.last_tick_epoch_ms = Date.now();
  syncSerializedSaveToBrowserStorage(JSON.stringify(state.saveData));
}

function persistSaveDataForSimulationEvent() {
  if (state.simulationIdleMode) {
    state.deferredSaveDirty = true;
    return;
  }
  persistSaveData();
}

function flushDeferredSaveIfNeeded() {
  if (!state.deferredSaveDirty) {
    return;
  }
  state.deferredSaveDirty = false;
  persistSaveData();
}

function queueRealtimeElapsedMs(nowMs = Date.now()) {
  const now = Math.max(0, toSafeInt(nowMs, Date.now()));
  if (state.realClockLastMs <= 0) {
    state.realClockLastMs = now;
    return 0;
  }
  const elapsed = now - state.realClockLastMs;
  state.realClockLastMs = now;
  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    return 0;
  }
  state.pendingSimMs += elapsed;
  if (!document.hidden) {
    state.pendingSimMs = Math.min(state.pendingSimMs, MAX_FOREGROUND_PENDING_MS);
  }
  return elapsed;
}

function queueOfflineCatchupFromSave(nowMs = Date.now()) {
  const saveData = state.saveData;
  const now = Math.max(0, toSafeInt(nowMs, Date.now()));
  const lastTick = getSaveTickEpochMs(saveData);
  state.realClockLastMs = now;
  if (lastTick <= 0) {
    return 0;
  }
  const elapsed = now - lastTick;
  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    return 0;
  }
  const capped = Math.min(elapsed, MAX_OFFLINE_CATCHUP_MS);
  state.pendingSimMs += capped;
  return capped;
}

function consumePendingSimulation(options = {}) {
  if (state.mode !== "ready") {
    return 0;
  }

  if (!state.battle || !state.team.length) {
    state.pendingSimMs = 0;
    flushDeferredSaveIfNeeded();
    return 0;
  }

  const hidden = Boolean(document.hidden);
  const budgetFromOptions = Number(options.budgetMs);
  const foregroundBudgetMs = getForegroundSimulationBudgetMs();
  const budgetMs =
    Number.isFinite(budgetFromOptions) && budgetFromOptions > 0
      ? budgetFromOptions
      : hidden
        ? HIDDEN_SIM_BUDGET_MS
        : foregroundBudgetMs;

  let consumedMs = 0;
  let safety = 0;
  const currentAttackInterval = getCurrentAttackIntervalMs();
  const minStepForSafety = Math.max(1, Math.min(FOREGROUND_FRAME_STEP_MS, currentAttackInterval));
  const maxIterations = Math.max(64, Math.ceil(budgetMs / minStepForSafety) + 32);

  while (state.pendingSimMs > 0.5 && consumedMs < budgetMs && safety < maxIterations) {
    const remainingBudget = Math.max(0, budgetMs - consumedMs);
    if (remainingBudget <= 0) {
      break;
    }

    const remainingSim = state.pendingSimMs;
    const forceIdleMode = Boolean(options.forceIdleMode);
    const idleMode = forceIdleMode || hidden || remainingSim >= BULK_IDLE_THRESHOLD_MS;
    const idealStep = idleMode ? Math.max(currentAttackInterval, BULK_IDLE_THRESHOLD_MS) : FOREGROUND_FRAME_STEP_MS;
    const stepMs = Math.max(1, Math.min(remainingBudget, remainingSim, idealStep));

    update(stepMs, { idleMode });
    state.pendingSimMs = Math.max(0, state.pendingSimMs - stepMs);
    consumedMs += stepMs;
    safety += 1;
  }

  if (state.pendingSimMs <= 0.5) {
    state.pendingSimMs = 0;
  }

  flushDeferredSaveIfNeeded();
  if (consumedMs > 0) {
    const nowMs = Date.now();
    if (nowMs - Math.max(0, toSafeInt(state.lastHudAutoUpdateMs, 0)) >= HUD_AUTO_REFRESH_INTERVAL_MS) {
      updateHud();
    }
  }
  return consumedMs;
}

function tickSimulationFromRealtime(options = {}) {
  const now = Date.now();
  if (state.mode !== "ready") {
    state.realClockLastMs = now;
    return 0;
  }
  const elapsedMs = queueRealtimeElapsedMs(now);
  if (document.hidden || Boolean(options.forceIdleMode)) {
    const configuredBudgetMs = Number(options.budgetMs);
    const hiddenElapsedBudgetMs = elapsedMs > 0 ? elapsedMs : BACKGROUND_TICK_INTERVAL_MS;
    const cappedBudgetMs =
      Number.isFinite(configuredBudgetMs) && configuredBudgetMs > 0
        ? Math.min(configuredBudgetMs, hiddenElapsedBudgetMs)
        : hiddenElapsedBudgetMs;
    return consumePendingSimulation({
      ...options,
      budgetMs: cappedBudgetMs,
    });
  }
  return consumePendingSimulation(options);
}

function ensureBackgroundTicker() {
  if (state.backgroundTickHandle) {
    return;
  }
  state.backgroundTickHandle = window.setInterval(() => {
    if (!document.hidden) {
      return;
    }
    tickSimulationFromRealtime({
      forceIdleMode: true,
      budgetMs: HIDDEN_SIM_BUDGET_MS,
    });
  }, BACKGROUND_TICK_INTERVAL_MS);
}

function stopBackgroundTicker() {
  if (!state.backgroundTickHandle) {
    return;
  }
  window.clearInterval(state.backgroundTickHandle);
  state.backgroundTickHandle = null;
}

function handleVisibilityChange() {
  if (document.hidden) {
    ensureBackgroundTicker();
    tickSimulationFromRealtime({
      forceIdleMode: true,
      budgetMs: HIDDEN_SIM_BUDGET_MS,
    });
    flushDeferredSaveIfNeeded();
    persistSaveData();
    return;
  }

  stopBackgroundTicker();
  tickSimulationFromRealtime();
  render();
}

function handlePageLifecyclePersist() {
  queueRealtimeElapsedMs(Date.now());
  consumePendingSimulation({
    forceIdleMode: true,
    budgetMs: HIDDEN_SIM_BUDGET_MS,
  });
  flushDeferredSaveIfNeeded();
  persistSaveData();
}

function ensureSpeciesStats(pokemonId) {
  if (!state.saveData) {
    return createPokemonEntityRecord(pokemonId, 1);
  }
  const key = String(pokemonId);
  if (!state.saveData.pokemon_entities[key]) {
    state.saveData.pokemon_entities[key] = createPokemonEntityRecord(pokemonId, 1);
  }
  syncSpeciesIdentityForRecord(state.saveData.pokemon_entities[key], pokemonId);
  return state.saveData.pokemon_entities[key];
}

function incrementSpeciesStat(pokemonId, kind, isShiny, amount = 1, options = {}) {
  const record = ensureSpeciesStats(pokemonId);
  const suffix = isShiny ? "shiny" : "normal";
  const field = `${kind}_${suffix}`;
  const previousValue = toSafeInt(record[field], 0);
  const delta = Number(amount) || 0;
  const nextValue = Math.max(0, previousValue + delta);
  record[field] = nextValue;
  const isUltraShiny = Boolean(options?.isUltraShiny);
  if (isUltraShiny) {
    const ultraField = `${kind}_ultra_shiny`;
    const ultraPrevious = toSafeInt(record[ultraField], 0);
    record[ultraField] = Math.max(0, ultraPrevious + delta);
  }
  if (delta > 0) {
    notifyFirstTimeSpeciesProgress(pokemonId, kind, isShiny, previousValue, nextValue);
  }
}
function buildOrderedCatalogRouteIds(routeCatalog = state.routeCatalog) {
  const availableRouteIds = routeCatalog?.size > 0 ? Array.from(routeCatalog.keys()) : ROUTE_ID_ORDER;
  const ordered = ROUTE_ID_ORDER.filter((routeId) => availableRouteIds.includes(routeId));
  for (const routeId of availableRouteIds) {
    if (!ordered.includes(routeId)) {
      ordered.push(routeId);
    }
  }
  if (!ordered.includes(DEFAULT_ROUTE_ID)) {
    ordered.unshift(DEFAULT_ROUTE_ID);
  }
  return ordered;
}

function refreshOrderedCatalogRouteIds() {
  state.routeCatalogOrderedIds = buildOrderedCatalogRouteIds(state.routeCatalog);
  return state.routeCatalogOrderedIds;
}

function getOrderedCatalogRouteIds() {
  if (Array.isArray(state.routeCatalogOrderedIds) && state.routeCatalogOrderedIds.length > 0) {
    return state.routeCatalogOrderedIds;
  }
  return refreshOrderedCatalogRouteIds();
}

function ensureRouteDefeatCountsForCurrentCatalog() {
  const availableRouteIds = getOrderedCatalogRouteIds();
  if (!state.saveData) {
    return createRouteDefeatCounts(availableRouteIds);
  }

  const normalized = normalizeRouteDefeatCounts(state.saveData.route_defeat_counts, availableRouteIds);
  state.saveData.route_defeat_counts = normalized;
  return normalized;
}

function getRouteDefeatCount(routeId) {
  const counts = ensureRouteDefeatCountsForCurrentCatalog();
  const id = String(routeId || DEFAULT_ROUTE_ID);
  return Math.max(0, toSafeInt(counts[id], 0));
}

function incrementRouteDefeatCount(routeId, amount = 1) {
  if (!state.saveData) {
    return 0;
  }
  const counts = ensureRouteDefeatCountsForCurrentCatalog();
  const id = String(routeId || DEFAULT_ROUTE_ID);
  const delta = Math.max(0, toSafeInt(amount, 0));
  counts[id] = Math.max(0, toSafeInt(counts[id], 0)) + delta;
  state.saveData.route_defeat_counts = counts;
  return counts[id];
}

function setRouteDefeatCount(routeId, value = 0) {
  if (!state.saveData) {
    return 0;
  }
  const counts = ensureRouteDefeatCountsForCurrentCatalog();
  const id = String(routeId || DEFAULT_ROUTE_ID);
  counts[id] = Math.max(0, toSafeInt(value, 0));
  state.saveData.route_defeat_counts = counts;
  return counts[id];
}

function getRouteOrderIndex(routeId) {
  const id = String(routeId || DEFAULT_ROUTE_ID);
  return getOrderedCatalogRouteIds().indexOf(id);
}

function getNextRouteId(routeId) {
  const ordered = getOrderedCatalogRouteIds();
  const currentIndex = ordered.indexOf(String(routeId || DEFAULT_ROUTE_ID));
  if (currentIndex < 0 || currentIndex >= ordered.length - 1) {
    return null;
  }
  return ordered[currentIndex + 1];
}

function getOrderedUnlockedRouteIds() {
  if (!state.saveData) {
    return [DEFAULT_ROUTE_ID];
  }
  const ordered = getOrderedCatalogRouteIds();
  const unlocked = ensureUnlockedRoutesForCurrentCatalog();
  return ordered.filter((routeId) => unlocked.includes(routeId));
}

function getRouteDataById(routeId) {
  const id = String(routeId || "");
  return state.routeCatalog.get(id) || null;
}

function getRouteZoneType(routeId) {
  const routeData = getRouteDataById(routeId) || (state.routeData && state.routeData.route_id === routeId ? state.routeData : null);
  const zoneType = String(routeData?.zone_type || "route").toLowerCase().trim();
  if (zoneType === "town" || zoneType === "city") {
    return "town";
  }
  if (zoneType === "dungeon" || zoneType === "cave" || zoneType === "forest") {
    return "dungeon";
  }
  return "route";
}

function getRouteZoneTypeLabel(routeId) {
  const zoneType = getRouteZoneType(routeId);
  if (zoneType === "town") {
    return "Ville";
  }
  if (zoneType === "dungeon") {
    return "Donjon";
  }
  return "Route";
}

function isRouteCombatEnabled(routeInput = null) {
  const routeData =
    routeInput && typeof routeInput === "object"
      ? routeInput
      : getRouteDataById(routeInput || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID) ||
        state.routeData;
  if (!routeData) {
    return false;
  }
  if (routeData.combat_enabled === false) {
    return false;
  }
  const encounters = Array.isArray(routeData.encounters) ? routeData.encounters : [];
  return encounters.length > 0;
}

function isCurrentRouteCombatEnabled() {
  return isRouteCombatEnabled(state.routeData);
}

function getRouteUnlockMode(routeId) {
  const routeData = getRouteDataById(routeId) || state.routeData;
  const mode = String(routeData?.unlock_mode || (routeData?.combat_enabled === false ? "visit" : "defeats"))
    .toLowerCase()
    .trim();
  return mode === "visit" ? "visit" : "defeats";
}

function getRouteUnlockDefeatTarget(routeId) {
  const routeData = getRouteDataById(routeId) || state.routeData;
  return Math.max(1, toSafeInt(routeData?.unlock_defeats_required, ROUTE_UNLOCK_DEFEATS));
}

function getRouteUnlockProgressState(routeId) {
  const currentRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const nextRouteId = getNextRouteId(currentRouteId);
  const unlockMode = getRouteUnlockMode(currentRouteId);
  const unlockTarget = unlockMode === "visit" ? 0 : getRouteUnlockDefeatTarget(currentRouteId);
  const rawDefeats = unlockTarget > 0 ? getRouteDefeatCount(currentRouteId) : 0;
  const currentDefeats = unlockTarget > 0 ? Math.min(rawDefeats, unlockTarget) : 0;
  const nextUnlocked = nextRouteId ? isRouteUnlocked(nextRouteId) : false;
  const routeData = getRouteDataById(currentRouteId) || (state.routeData?.route_id === currentRouteId ? state.routeData : null);
  const timerEnabled = Boolean(state.saveData) && Boolean(nextRouteId) && unlockMode === "defeats" && !nextUnlocked;
  const timerDurationMs = timerEnabled
    ? Math.max(1000, toSafeInt(routeData?.unlock_timer_ms, ROUTE_DEFEAT_TIMER_MS))
    : 0;
  return {
    routeId: currentRouteId,
    nextRouteId,
    unlockMode,
    unlockTarget,
    currentDefeats,
    rawDefeats,
    nextUnlocked,
    timerEnabled,
    timerDurationMs,
  };
}

function getTeamBoxesAccessState(routeId = null) {
  const activeRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const progressState = getRouteUnlockProgressState(activeRouteId);
  return {
    routeId: activeRouteId,
    progressState,
    allowed: !progressState.timerEnabled,
  };
}

function getTeamBoxesLockedMessage(routeId = null) {
  const accessState = getTeamBoxesAccessState(routeId);
  if (accessState.allowed) {
    return "";
  }
  const { progressState } = accessState;
  const nextRouteName = progressState.nextRouteId ? getRouteDisplayName(progressState.nextRouteId) : "la zone suivante";
  return `Serie chrono active (${progressState.currentDefeats}/${progressState.unlockTarget} KO). Debloque ${nextRouteName} pour echanger la team.`;
}

function getRouteMapMarkerOverride(routeId) {
  const id = String(routeId || "").trim();
  if (!id) {
    return null;
  }
  const marker = MAP_MARKER_OVERRIDES_BY_ROUTE_ID[id];
  if (!marker) {
    return null;
  }
  const x = Number(marker?.x);
  const y = Number(marker?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
}

function getRouteMapMarker(routeId) {
  const markerOverride = getRouteMapMarkerOverride(routeId);
  if (markerOverride) {
    return markerOverride;
  }
  const routeData = getRouteDataById(routeId) || state.routeData;
  const marker = routeData?.map_marker;
  const x = Number(marker?.x ?? marker?.left_pct ?? marker?.left ?? NaN);
  const y = Number(marker?.y ?? marker?.top_pct ?? marker?.top ?? NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
}

function applyMapReferenceImage() {
  if (!mapImageEl) {
    return;
  }
  const currentSrc = String(mapImageEl.getAttribute("src") || "");
  if (currentSrc !== MAP_REFERENCE_IMAGE_PATH) {
    mapImageEl.setAttribute("src", MAP_REFERENCE_IMAGE_PATH);
  }
}

function syncMapMarkerLayerBounds() {
  if (!mapMarkersEl || !mapImageEl || !mapStageEl) {
    return;
  }
  const stageRect = mapStageEl.getBoundingClientRect();
  const imageRect = mapImageEl.getBoundingClientRect();
  if (stageRect.width <= 0 || stageRect.height <= 0 || imageRect.width <= 0 || imageRect.height <= 0) {
    mapMarkersEl.style.left = "0px";
    mapMarkersEl.style.top = "0px";
    mapMarkersEl.style.width = "100%";
    mapMarkersEl.style.height = "100%";
    return;
  }
  const left = clamp(imageRect.left - stageRect.left, 0, stageRect.width);
  const top = clamp(imageRect.top - stageRect.top, 0, stageRect.height);
  mapMarkersEl.style.left = `${left}px`;
  mapMarkersEl.style.top = `${top}px`;
  mapMarkersEl.style.width = `${Math.max(1, imageRect.width)}px`;
  mapMarkersEl.style.height = `${Math.max(1, imageRect.height)}px`;
}

function getSpeciesStatsSummary(pokemonId) {
  const record = ensureSpeciesStats(pokemonId);
  const encounteredNormal = Math.max(0, toSafeInt(record.encountered_normal, 0));
  const encounteredShiny = Math.max(0, toSafeInt(record.encountered_shiny, 0));
  const encounteredUltraShiny = Math.max(0, toSafeInt(record.encountered_ultra_shiny, 0));
  const defeatedNormal = Math.max(0, toSafeInt(record.defeated_normal, 0));
  const defeatedShiny = Math.max(0, toSafeInt(record.defeated_shiny, 0));
  const defeatedUltraShiny = Math.max(0, toSafeInt(record.defeated_ultra_shiny, 0));
  const capturedNormal = Math.max(0, toSafeInt(record.captured_normal, 0));
  const capturedShiny = Math.max(0, toSafeInt(record.captured_shiny, 0));
  const capturedUltraShiny = Math.max(0, toSafeInt(record.captured_ultra_shiny, 0));
  return {
    level: clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL),
    stats: normalizeStatsPayload(record.stats),
    talent: resolveTalentDefinition(record?.talent, pokemonId),
    entity_unlocked: isEntityUnlocked(record),
    encountered_normal: encounteredNormal,
    encountered_shiny: encounteredShiny,
    encountered_ultra_shiny: encounteredUltraShiny,
    defeated_normal: defeatedNormal,
    defeated_shiny: defeatedShiny,
    defeated_ultra_shiny: defeatedUltraShiny,
    captured_normal: capturedNormal,
    captured_shiny: capturedShiny,
    captured_ultra_shiny: capturedUltraShiny,
    encountered_total: encounteredNormal + encounteredShiny,
    defeated_total: defeatedNormal + defeatedShiny,
    captured_total: capturedNormal + capturedShiny,
  };
}

function getPokemonEntityRecord(pokemonId) {
  if (!state.saveData?.pokemon_entities) {
    return null;
  }
  return state.saveData.pokemon_entities[String(pokemonId)] || null;
}

function getCapturedTotal(record) {
  if (!record) {
    return 0;
  }
  return Math.max(0, toSafeInt(record.captured_normal, 0)) + Math.max(0, toSafeInt(record.captured_shiny, 0));
}

function ensureOwnedRecordHasAtLeastOneCapture(record) {
  if (!record || !isEntityUnlocked(record) || getCapturedTotal(record) > 0) {
    return false;
  }
  const nextCapturedNormal = Math.max(1, toSafeInt(record.captured_normal, 0));
  const nextEncounteredNormal = Math.max(toSafeInt(record.encountered_normal, 0), nextCapturedNormal);
  let changed = false;
  if (nextCapturedNormal !== toSafeInt(record.captured_normal, 0)) {
    record.captured_normal = nextCapturedNormal;
    changed = true;
  }
  if (nextEncounteredNormal !== toSafeInt(record.encountered_normal, 0)) {
    record.encountered_normal = nextEncounteredNormal;
    changed = true;
  }
  return changed;
}

function getEvolutionFamilySpeciesIds(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return [];
  }
  const rootId = getEvolutionRootSpeciesId(id);
  if (rootId <= 0 || !state.pokemonDefsById?.size) {
    return [id];
  }
  const familyIds = [];
  for (const [speciesId] of state.pokemonDefsById.entries()) {
    if (getEvolutionRootSpeciesId(speciesId) === rootId) {
      familyIds.push(Number(speciesId));
    }
  }
  if (!familyIds.includes(id)) {
    familyIds.push(id);
  }
  familyIds.sort((a, b) => a - b);
  return familyIds;
}

function applyNicknameToEvolutionFamily(pokemonId, nickname) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return { changed: false, familySize: 0 };
  }
  const nextNickname = sanitizePokemonNickname(nickname);
  const familyIds = getEvolutionFamilySpeciesIds(id);
  const targetIds = Array.from(new Set((familyIds.length > 0 ? familyIds : [id]).map((entry) => Number(entry || 0))))
    .filter((entry) => entry > 0);
  let changed = false;

  for (const familyId of targetIds) {
    const record = ensureSpeciesStats(familyId);
    const previousNickname = sanitizePokemonNickname(record?.nickname);
    if (previousNickname === nextNickname) {
      continue;
    }
    record.nickname = nextNickname;
    changed = true;
  }

  return {
    changed,
    familySize: targetIds.length,
  };
}

function getFamilyCounterTotal(pokemonId, counterField) {
  const field = String(counterField || "").trim();
  if (!field) {
    return 0;
  }
  const familyIds = getEvolutionFamilySpeciesIds(pokemonId);
  if (familyIds.length <= 0) {
    return Math.max(0, toSafeInt(getPokemonEntityRecord(pokemonId)?.[field], 0));
  }
  let total = 0;
  for (const familyId of familyIds) {
    const record = getPokemonEntityRecord(familyId);
    total += Math.max(0, toSafeInt(record?.[field], 0));
  }
  return total;
}

function isEntityUnlocked(record) {
  if (!record) {
    return false;
  }
  if (typeof record === "object" && Object.prototype.hasOwnProperty.call(record, "entity_unlocked")) {
    return Boolean(record.entity_unlocked);
  }
  return getCapturedTotal(record) > 0;
}

function isPokemonEntityUnlockedById(pokemonId) {
  return isEntityUnlocked(getPokemonEntityRecord(pokemonId));
}

function isEvolutionFamilyOwned(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const familyIds = getEvolutionFamilySpeciesIds(id);
  if (familyIds.length <= 0) {
    return isPokemonEntityUnlockedById(id);
  }
  return familyIds.some((familyId) => isPokemonEntityUnlockedById(familyId));
}

function markEntityUnlocked(record, unlocked = true) {
  if (!record) {
    return;
  }
  record.entity_unlocked = Boolean(unlocked);
}

function getFamilyShinyCaptureCount(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return 0;
  }
  return getFamilyCounterTotal(id, "captured_shiny");
}

function getFamilyUltraShinyCaptureCount(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return 0;
  }
  return getFamilyCounterTotal(id, "captured_ultra_shiny");
}

function isShinyAppearanceUnlockedForRecord(record, pokemonId = 0) {
  const id = Number(pokemonId || record?.id || 0);
  if (id > 0) {
    return getFamilyShinyCaptureCount(id) > 0;
  }
  if (!record) {
    return false;
  }
  return Math.max(0, toSafeInt(record.captured_shiny, 0)) > 0;
}

function isUltraShinyAppearanceUnlockedForRecord(record, pokemonId = 0) {
  const id = Number(pokemonId || record?.id || 0);
  if (id > 0) {
    return getFamilyUltraShinyCaptureCount(id) > 0;
  }
  if (!record) {
    return false;
  }
  return Math.max(0, toSafeInt(record.captured_ultra_shiny, 0)) > 0;
}

function normalizeEntityAppearanceConfig(record) {
  if (!record || typeof record !== "object") {
    return false;
  }
  let changed = false;

  const normalizedOwned = normalizeSpriteVariantIdList(record.appearance_owned_variants);
  if (
    !Array.isArray(record.appearance_owned_variants) ||
    normalizedOwned.length !== record.appearance_owned_variants.length ||
    normalizedOwned.some((id, idx) => id !== record.appearance_owned_variants[idx])
  ) {
    record.appearance_owned_variants = normalizedOwned;
    changed = true;
  }

  const normalizedSelected = normalizeSpriteVariantId(record.appearance_selected_variant);
  if (normalizedSelected !== String(record.appearance_selected_variant || "")) {
    record.appearance_selected_variant = normalizedSelected;
    changed = true;
  }

  const beforeShinyMode = record.appearance_shiny_mode;
  const shinyMode = Boolean(beforeShinyMode);
  if (beforeShinyMode !== shinyMode) {
    record.appearance_shiny_mode = shinyMode;
    changed = true;
  }

  const beforeUltraShinyMode = record.appearance_ultra_shiny_mode;
  const ultraShinyMode = Boolean(beforeUltraShinyMode);
  if (beforeUltraShinyMode !== ultraShinyMode) {
    record.appearance_ultra_shiny_mode = ultraShinyMode;
    changed = true;
  }

  return changed;
}

function reconcileAppearanceForEntityRecord(record, pokemonId) {
  if (!record) {
    return false;
  }
  let changed = normalizeEntityAppearanceConfig(record);
  const def = state.pokemonDefsById.get(Number(pokemonId || record.id || 0));
  if (!def) {
    return changed;
  }

  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    if (record.appearance_owned_variants?.length) {
      record.appearance_owned_variants = [];
      changed = true;
    }
    if (record.appearance_selected_variant) {
      record.appearance_selected_variant = "";
      changed = true;
    }
    if (record.appearance_shiny_mode) {
      record.appearance_shiny_mode = false;
      changed = true;
    }
    if (record.appearance_ultra_shiny_mode) {
      record.appearance_ultra_shiny_mode = false;
      changed = true;
    }
    return changed;
  }

  const validIds = new Set(variants.map((entry) => entry.id));
  const defaultVariantId = getDefaultSpriteVariantId(def);
  const normalizedOwned = normalizeSpriteVariantIdList(record.appearance_owned_variants).filter((variantId) =>
    validIds.has(variantId),
  );
  const ownedSet = new Set(normalizedOwned);
  const selectedIdBeforeMigration = normalizeSpriteVariantId(record.appearance_selected_variant);
  const shouldPromoteLegacyTransparent = shouldPromoteLegacyTransparentSelection(
    selectedIdBeforeMigration,
    normalizedOwned,
    defaultVariantId,
  );
  if (defaultVariantId) {
    ownedSet.add(defaultVariantId);
  }

  const orderedOwned = variants.map((entry) => entry.id).filter((variantId) => ownedSet.has(variantId));
  if (
    orderedOwned.length !== (record.appearance_owned_variants?.length || 0) ||
    orderedOwned.some((id, idx) => id !== record.appearance_owned_variants[idx])
  ) {
    record.appearance_owned_variants = orderedOwned;
    changed = true;
  }

  let selectedId = selectedIdBeforeMigration;
  if (shouldPromoteLegacyTransparent) {
    selectedId = defaultVariantId;
  }
  if (!selectedId || !ownedSet.has(selectedId)) {
    selectedId = orderedOwned[0] || defaultVariantId || variants[0].id;
  }
  if (selectedId !== record.appearance_selected_variant) {
    record.appearance_selected_variant = selectedId;
    changed = true;
  }

  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
  const ultraUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);

  if (record.appearance_shiny_mode && !shinyUnlocked) {
    record.appearance_shiny_mode = false;
    changed = true;
  }
  if (record.appearance_ultra_shiny_mode && !ultraUnlocked) {
    record.appearance_ultra_shiny_mode = false;
    changed = true;
  }
  if (record.appearance_ultra_shiny_mode && !record.appearance_shiny_mode) {
    record.appearance_shiny_mode = true;
    changed = true;
  }

  return changed;
}

function reconcileEntityAppearanceStates() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return false;
  }
  let changed = false;
  for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(record?.id || rawId || 0);
    if (pokemonId <= 0 || !record) {
      continue;
    }
    if (reconcileAppearanceForEntityRecord(record, pokemonId)) {
      changed = true;
    }
  }
  return changed;
}

function isSpriteVariantOwned(record, variantId) {
  if (!record) {
    return false;
  }
  const target = normalizeSpriteVariantId(variantId);
  if (!target) {
    return false;
  }
  const owned = normalizeSpriteVariantIdList(record.appearance_owned_variants);
  return owned.includes(target);
}

function getOwnedSpriteVariantsForRecord(record, def) {
  if (!record || !def) {
    return [];
  }
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return [];
  }
  const ownedIds = new Set(normalizeSpriteVariantIdList(record.appearance_owned_variants));
  return variants.filter((variant) => ownedIds.has(variant.id));
}

function getSelectedOwnedSpriteVariantForRecord(record, def) {
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return null;
  }
  const owned = getOwnedSpriteVariantsForRecord(record, def);
  const selectedId = normalizeSpriteVariantId(record?.appearance_selected_variant);
  const defaultVariantId = getDefaultSpriteVariantId(def);
  if (shouldPromoteLegacyTransparentSelection(selectedId, record?.appearance_owned_variants, defaultVariantId)) {
    return getSpriteVariantById(def, defaultVariantId) || owned[0] || variants[0] || null;
  }
  if (selectedId) {
    const selectedVariant = owned.find((variant) => variant.id === selectedId);
    if (selectedVariant) {
      return selectedVariant;
    }
  }
  return owned[0] || getSpriteVariantById(def, defaultVariantId) || variants[0] || null;
}

function resolveSpriteAppearanceForEntity(pokemonId, options = {}) {
  const id = Number(pokemonId || 0);
  const def = state.pokemonDefsById.get(id);
  if (!def) {
    return {
      variant: null,
      spritePath: "",
      spriteImage: null,
      animated: false,
      shinyVisual: false,
      shinyUnlocked: false,
      ultraShinyVisual: false,
      ultraShinyUnlocked: false,
      shinyModeRequested: false,
      ultraShinyModeRequested: false,
    };
  }

  const record = getPokemonEntityRecord(id);
  if (record) {
    reconcileAppearanceForEntityRecord(record, id);
  }
  const variant = getSelectedOwnedSpriteVariantForRecord(record, def);
  const normalPath = variant?.frontPath || def.spritePath || "";
  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, id);
  const ultraShinyUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, id);
  const respectAppearanceShinyMode = options.respectAppearanceShinyMode !== false;
  const respectAppearanceUltraShinyMode = options.respectAppearanceUltraShinyMode !== false;
  const forceUltraShiny = Boolean(options.forceUltraShiny || shouldForceUltraShinyAllPokemon());
  const hasExplicitShinyVisual = Object.prototype.hasOwnProperty.call(options, "shinyVisual");
  const hasExplicitUltraShinyVisual = Object.prototype.hasOwnProperty.call(options, "ultraShinyVisual");
  const forcedShinyVisual = forceUltraShiny || Boolean(options.forceShiny);
  const explicitShinyVisual = hasExplicitShinyVisual ? Boolean(options.shinyVisual) : false;
  const explicitUltraShinyVisual = hasExplicitUltraShinyVisual ? Boolean(options.ultraShinyVisual) : false;
  const ultraShinyModeRequested = hasExplicitUltraShinyVisual
    ? Boolean(explicitUltraShinyVisual || forceUltraShiny)
    : Boolean(forceUltraShiny || (respectAppearanceUltraShinyMode && record?.appearance_ultra_shiny_mode && ultraShinyUnlocked));
  const shinyModeRequested = hasExplicitShinyVisual
    ? Boolean(explicitShinyVisual || forcedShinyVisual || ultraShinyModeRequested)
    : Boolean(
        forcedShinyVisual
        || ultraShinyModeRequested
        || (respectAppearanceShinyMode && record?.appearance_shiny_mode && shinyUnlocked),
      );
  const ultraShinyVisual = Boolean(ultraShinyModeRequested);
  const shinyPath = variant?.frontShinyPath || def.shinySpritePath || "";
  const canRenderShiny = shinyModeRequested && Boolean(shinyPath);
  const resolvedPath = canRenderShiny ? shinyPath : normalPath;

  const fallbackImage = canRenderShiny ? def.spriteShinyImage || def.spriteImage : def.spriteImage;
  const cachedImage = resolvedPath ? getCachedSpriteImage(resolvedPath) : null;
  const resolvedImage = isDrawableImage(cachedImage) ? cachedImage : fallbackImage;

  return {
    variant,
    spritePath: resolvedPath || normalPath || def.spritePath || "",
    spriteImage: resolvedImage || null,
    animated: Boolean(variant?.animated),
    shinyVisual: Boolean(canRenderShiny || ultraShinyVisual),
    shinyUnlocked,
    ultraShinyVisual,
    ultraShinyUnlocked,
    shinyModeRequested,
    ultraShinyModeRequested,
  };
}

async function preloadSelectedAppearanceAssetsForTeam() {
  if (!state.saveData || !Array.isArray(state.saveData.team) || state.saveData.team.length <= 0) {
    return;
  }

  const uniqueTeamIds = [];
  for (const rawId of state.saveData.team) {
    const pokemonId = Number(rawId || 0);
    if (pokemonId <= 0 || uniqueTeamIds.includes(pokemonId)) {
      continue;
    }
    uniqueTeamIds.push(pokemonId);
    if (uniqueTeamIds.length >= MAX_TEAM_SIZE) {
      break;
    }
  }

  if (uniqueTeamIds.length <= 0) {
    return;
  }

  const preloadTasks = [];
  for (const pokemonId of uniqueTeamIds) {
    const def = state.pokemonDefsById.get(pokemonId);
    if (!def) {
      continue;
    }
    const record = getPokemonEntityRecord(pokemonId);
    if (record) {
      reconcileAppearanceForEntityRecord(record, pokemonId);
    }
    const selectedVariant = getSelectedOwnedSpriteVariantForRecord(record, def);
    const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
    const ultraUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);
    const includeShiny = Boolean(
      shouldForceUltraShinyAllPokemon()
      || (record?.appearance_shiny_mode && shinyUnlocked)
      || (record?.appearance_ultra_shiny_mode && ultraUnlocked),
    );
    preloadTasks.push(
      ensureVariantAppearanceAssetsLoaded(def, selectedVariant, {
        includeShiny,
      }),
    );
  }

  if (preloadTasks.length <= 0) {
    return;
  }
  await Promise.all(preloadTasks);
}

function syncActiveEnemyAppearance() {
  const enemy = state.battle?.getEnemy?.();
  if (!enemy) {
    if (state.battle) {
      state.enemy = null;
    }
    return;
  }

  const def = state.pokemonDefsById.get(Number(enemy.id || 0));
  const ultraShinyVisual = Boolean(enemy.isUltraShiny || enemy.isUltraShinyVisual || shouldForceUltraShinyAllPokemon());
  const shinyVisual = Boolean(enemy.isShiny || ultraShinyVisual);
  const appearance = resolveSpriteAppearanceForEntity(enemy.id, {
    shinyVisual,
    ultraShinyVisual,
    forceUltraShiny: ultraShinyVisual,
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
  });
  const fallbackPath = shinyVisual ? def?.shinySpritePath || def?.spritePath || "" : def?.spritePath || "";
  const fallbackImage = shinyVisual ? def?.spriteShinyImage || def?.spriteImage || null : def?.spriteImage || null;

  enemy.spritePath = appearance.spritePath || fallbackPath || enemy.spritePath || "";
  enemy.spriteImage = appearance.spriteImage || fallbackImage || enemy.spriteImage || null;
  enemy.spriteVariantId = appearance.variant?.id || getDefaultSpriteVariantId(def) || enemy.spriteVariantId || null;
  enemy.spriteAnimated = Boolean(appearance.animated);
  enemy.isShinyVisual = Boolean(shinyVisual || appearance.shinyVisual || appearance.ultraShinyVisual);
  enemy.isUltraShinyVisual = Boolean(ultraShinyVisual || appearance.ultraShinyVisual);
  state.enemy = enemy;
}

function getSpriteVariantPurchasePrice(def, variantId) {
  const variant = getSpriteVariantById(def, variantId);
  if (!variant) {
    return 0;
  }
  const defaultId = getDefaultSpriteVariantId(def);
  if (variant.id === defaultId) {
    return 0;
  }
  const orderIndex = getSpriteVariantOrderIndex(def, variant.id);
  const generationDelta = Math.max(0, toSafeInt(variant.generation, 1) - 1);
  const computed =
    SPRITE_VARIANT_BASE_PRICE + generationDelta * SPRITE_VARIANT_GEN_PRICE_STEP + orderIndex * SPRITE_VARIANT_INDEX_PRICE_STEP;
  return Math.max(200, Math.round(computed));
}

function setEntityLevel(record, level) {
  if (!record) {
    return;
  }
  const normalizedLevel = clamp(toSafeInt(level, 1), 1, MAX_LEVEL);
  const baseStats = getPokemonBaseStats(record.id, record.base_stats || record.stats);
  record.level = normalizedLevel;
  record.base_stats = baseStats;
  record.stats = computeStatsAtLevel(baseStats, normalizedLevel);
  if (record.level >= MAX_LEVEL) {
    record.xp = 0;
  } else {
    record.xp = Math.max(0, toSafeInt(record.xp, 0));
  }
}

function ensureMoneyAndItems() {
  if (!state.saveData) {
    markEconomyNormalizationDirty();
    return;
  }
  const normalizationState = state.economyNormalization;
  const ballRevision = Math.max(0, toSafeInt(state.configRevisions?.ball, 0));
  const shopItemRevision = Math.max(0, toSafeInt(state.configRevisions?.shopItem, 0));
  if (
    normalizationState.saveDataRef === state.saveData
    && normalizationState.ballRevision === ballRevision
    && normalizationState.shopItemRevision === shopItemRevision
  ) {
    return;
  }
  state.saveData.money = Math.max(0, toSafeInt(state.saveData.money, 0));
  state.saveData.coins = Math.max(0, toSafeInt(state.saveData.coins, 0));
  const rawBallInventory = state.saveData.ball_inventory;
  const normalizedBallInventory = normalizeBallInventory(rawBallInventory);
  const legacyBalls = Math.max(0, toSafeInt(state.saveData.pokeballs, 0));
  const normalizedInventoryTotal = computeBallInventoryTotal(normalizedBallInventory);
  if (!hasStructuredBallInventory(rawBallInventory) && normalizedInventoryTotal <= 0 && legacyBalls > 0) {
    const fallbackBallType = getLegacyBallBackfillType();
    normalizedBallInventory[fallbackBallType] =
      clampBallInventoryCount(Math.max(0, toSafeInt(normalizedBallInventory[fallbackBallType], 0)) + legacyBalls);
  }
  state.saveData.ball_inventory = normalizedBallInventory;
  state.saveData.ball_inventory_seen = normalizeBallInventorySeen(
    state.saveData.ball_inventory_seen,
    normalizedBallInventory,
  );
  state.saveData.ball_capture_rules = normalizeBallCaptureRulesByType(state.saveData.ball_capture_rules);
  state.saveData.shop_items = normalizeShopItemsInventory(state.saveData.shop_items);
  state.saveData.attack_boost_until_ms = Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0));
  const activeBallType = String(state.saveData.active_ball_type || "").toLowerCase().trim();
  state.saveData.active_ball_type = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeBallType)
    ? activeBallType
    : getDefaultActiveBallType();
  state.saveData.first_free_pokeball_claimed = Boolean(state.saveData.first_free_pokeball_claimed);
  state.saveData.first_free_pokeball_guaranteed_capture_pending =
    state.saveData.first_free_pokeball_claimed
    && Boolean(state.saveData.first_free_pokeball_guaranteed_capture_pending);
  state.saveData.pokeballs = computeBallInventoryTotal(normalizedBallInventory);
  normalizationState.saveDataRef = state.saveData;
  normalizationState.ballRevision = ballRevision;
  normalizationState.shopItemRevision = shopItemRevision;
}

function getBallInventoryCount(ballType) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return 0;
  }
  return clampBallInventoryCount(state.saveData.ball_inventory?.[type]);
}

function getBallInventoryRemainingCapacity(ballType) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return 0;
  }
  const currentCount = clampBallInventoryCount(state.saveData.ball_inventory?.[type]);
  return Math.max(0, BALL_INVENTORY_MAX_PER_TYPE - currentCount);
}

function getBallInventoryTotalCount() {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  return computeBallInventoryTotal(state.saveData.ball_inventory);
}

function hasBallInventoryBeenSeen(ballType) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  return Boolean(state.saveData.ball_inventory_seen?.[type]);
}

function markBallInventorySeen(ballType) {
  if (!state.saveData) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  if (!state.saveData.ball_inventory_seen || typeof state.saveData.ball_inventory_seen !== "object") {
    state.saveData.ball_inventory_seen = createDefaultBallInventorySeen();
  }
  state.saveData.ball_inventory_seen[type] = true;
  state.saveData.ball_inventory_seen.poke_ball = true;
}

function getBallCaptureRulesForType(ballType) {
  if (!state.saveData) {
    return createDefaultSingleBallCaptureRules();
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return createDefaultSingleBallCaptureRules();
  }
  return normalizeSingleBallCaptureRules(state.saveData.ball_capture_rules?.[type]);
}

function setBallCaptureRulesForType(ballType, nextRules) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  const previous = normalizeSingleBallCaptureRules(state.saveData.ball_capture_rules?.[type]);
  const normalizedNext = normalizeSingleBallCaptureRules(nextRules);
  if (JSON.stringify(previous) === JSON.stringify(normalizedNext)) {
    return false;
  }
  state.saveData.ball_capture_rules[type] = normalizedNext;
  return true;
}

function shouldCaptureEnemyWithBallType(ballType, enemy) {
  if (!enemy) {
    return false;
  }
  const rules = getBallCaptureRulesForType(ballType);
  if (rules[BALL_CAPTURE_RULE_CAPTURE_ALL]) {
    return true;
  }

  const enemyId = Number(enemy.id || 0);
  const familyOwned = enemyId > 0 ? isEvolutionFamilyOwned(enemyId) : false;
  if (rules[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] && !familyOwned) {
    return true;
  }
  if (Boolean(enemy.isUltraShiny)) {
    return Boolean(rules[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]);
  }
  if (Boolean(enemy.isShiny)) {
    return Boolean(rules[BALL_CAPTURE_RULE_CAPTURE_SHINY]);
  }
  return false;
}

function setActiveBallType(ballType) {
  if (!state.saveData) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  ensureMoneyAndItems();
  state.saveData.active_ball_type = type;
}

function getActiveBallType() {
  if (!state.saveData) {
    return getDefaultActiveBallType();
  }
  ensureMoneyAndItems();
  return String(state.saveData.active_ball_type || getDefaultActiveBallType());
}

function addBallItems(ballType, amount) {
  if (!state.saveData) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  ensureMoneyAndItems();
  const delta = Math.max(0, toSafeInt(amount, 0));
  if (delta <= 0) {
    return;
  }
  const currentCount = clampBallInventoryCount(state.saveData.ball_inventory[type]);
  const capacityLeft = Math.max(0, BALL_INVENTORY_MAX_PER_TYPE - currentCount);
  if (capacityLeft <= 0) {
    return;
  }
  const appliedDelta = Math.min(delta, capacityLeft);
  state.saveData.ball_inventory[type] = currentCount + appliedDelta;
  markBallInventorySeen(type);
  state.saveData.pokeballs = computeBallInventoryTotal(state.saveData.ball_inventory);
  syncWindowsPokeballInventoryTracking(state.saveData.pokeballs);
}

function consumeBallItem(ballType, amount = 1) {
  if (!state.saveData) {
    return false;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  ensureMoneyAndItems();
  const qty = Math.max(1, toSafeInt(amount, 1));
  const current = Math.max(0, toSafeInt(state.saveData.ball_inventory[type], 0));
  if (current < qty) {
    return false;
  }
  state.saveData.ball_inventory[type] = current - qty;
  state.saveData.pokeballs = computeBallInventoryTotal(state.saveData.ball_inventory);
  syncWindowsPokeballInventoryTracking(state.saveData.pokeballs, { ballType: type });
  return true;
}

function getBallTypeForCapture(enemy = null) {
  if (!state.saveData) {
    return null;
  }
  ensureMoneyAndItems();
  const targetEnemy = enemy || state.enemy;
  const activeType = getActiveBallType();
  if (getBallInventoryCount(activeType) > 0 && shouldCaptureEnemyWithBallType(activeType, targetEnemy)) {
    return activeType;
  }
  for (const type of BALL_TYPE_ORDER) {
    if (getBallInventoryCount(type) > 0 && shouldCaptureEnemyWithBallType(type, targetEnemy)) {
      state.saveData.active_ball_type = type;
      return type;
    }
  }
  return null;
}

function consumeBallForCapture(enemy = null) {
  const ballType = getBallTypeForCapture(enemy);
  if (!ballType) {
    return { consumed: false, ballType: null };
  }
  const consumed = consumeBallItem(ballType, 1);
  return {
    consumed,
    ballType: consumed ? ballType : null,
  };
}

function getBallTypeLabel(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return BALL_CONFIG_BY_TYPE[type].nameFr;
  }
  return "PokeBall";
}

function getBallCaptureMultiplier(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    const configuredMultiplier = Math.max(0.05, Number(BALL_CONFIG_BY_TYPE[type].captureMultiplier || 1));
    return Math.max(0.05, configuredMultiplier * CAPTURE_BALL_MULTIPLIER_NERF);
  }
  return CAPTURE_BALL_MULTIPLIER_NERF;
}

function getBallInventoryOverlayRows() {
  if (!state.saveData) {
    return [];
  }
  ensureMoneyAndItems();
  const rows = [];
  for (const ballType of BALL_TYPE_FALLBACK_ORDER) {
    const type = String(ballType || "").toLowerCase().trim();
    if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
      continue;
    }
    const count = Math.max(0, toSafeInt(state.saveData.ball_inventory?.[type], 0));
    const alwaysVisible = type === "poke_ball";
    if (!alwaysVisible && !hasBallInventoryBeenSeen(type) && count <= 0) {
      continue;
    }
    rows.push({
      type,
      count,
      spritePath: String(BALL_CONFIG_BY_TYPE[type]?.spritePath || ""),
    });
  }
  return rows;
}

function addShopItemCount(itemType, amount = 1) {
  if (!state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  const type = String(itemType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(state.saveData.shop_items, type)) {
    return;
  }
  const delta = Math.max(0, toSafeInt(amount, 0));
  state.saveData.shop_items[type] = Math.max(0, toSafeInt(state.saveData.shop_items[type], 0)) + delta;
}

function consumeShopItemCount(itemType, amount = 1) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const type = String(itemType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(state.saveData.shop_items, type)) {
    return false;
  }
  const qty = Math.max(1, toSafeInt(amount, 1));
  const current = Math.max(0, toSafeInt(state.saveData.shop_items[type], 0));
  if (current < qty) {
    return false;
  }
  state.saveData.shop_items[type] = current - qty;
  return true;
}

function getShopItemCount(itemType) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const type = String(itemType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(state.saveData.shop_items, type)) {
    return 0;
  }
  return Math.max(0, toSafeInt(state.saveData.shop_items[type], 0));
}

function isAttackBoostActive(nowMs = Date.now()) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  return Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0)) > Math.max(0, toSafeInt(nowMs, Date.now()));
}

function getAttackBoostConfig() {
  const config = SHOP_ITEM_CONFIG_BY_ID.x_boost;
  if (config && config.itemType === "boost") {
    return config;
  }
  return DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID.x_boost;
}

function getAttackBoostIntervalMultiplier() {
  const config = getAttackBoostConfig();
  const rawMultiplier = Number(config?.effectValue ?? BOOST_X_ATTACK_INTERVAL_MULTIPLIER);
  if (!Number.isFinite(rawMultiplier)) {
    return BOOST_X_ATTACK_INTERVAL_MULTIPLIER;
  }
  return clamp(rawMultiplier, 0.05, 20);
}

function getAttackBoostDurationMsFromConfig() {
  const config = getAttackBoostConfig();
  return Math.max(1000, toSafeInt(config?.effectDurationMs, BOOST_X_DURATION_MS));
}

function getAttackBoostRemainingMs(nowMs = Date.now()) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const untilMs = Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0));
  return Math.max(0, untilMs - Math.max(0, toSafeInt(nowMs, Date.now())));
}

function getCurrentAttackIntervalMs(nowMs = Date.now()) {
  const baseInterval = ATTACK_INTERVAL_MS;
  if (!isAttackBoostActive(nowMs)) {
    return baseInterval;
  }
  return Math.max(65, Math.round(baseInterval * getAttackBoostIntervalMultiplier()));
}

function activateAttackBoost(durationMs = getAttackBoostDurationMsFromConfig()) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const now = Date.now();
  const baseStart = Math.max(now, Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0)));
  const duration = Math.max(1000, toSafeInt(durationMs, BOOST_X_DURATION_MS));
  state.saveData.attack_boost_until_ms = baseStart + duration;
  return getAttackBoostRemainingMs(now);
}

function addMoney(amount) {
  if (!state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  state.saveData.money += Math.max(0, toSafeInt(amount, 0));
}

function addCoins(amount) {
  if (!state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  state.saveData.coins += Math.max(0, toSafeInt(amount, 0));
}

function spendMoney(amount) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const cost = Math.max(0, toSafeInt(amount, 0));
  if (state.saveData.money < cost) {
    return false;
  }
  state.saveData.money -= cost;
  return true;
}

function addPokeballs(amount) {
  addBallItems("poke_ball", amount);
}

function consumePokeball() {
  return consumeBallForCapture().consumed;
}

function ensurePokemonEntityUnlocked(pokemonId, initialLevel = 1) {
  const record = ensureSpeciesStats(pokemonId);
  reconcileAppearanceForEntityRecord(record, pokemonId);
  const wasUnlocked = isEntityUnlocked(record);
  let captureBackfilled = false;
  if (!wasUnlocked) {
    setEntityLevel(record, initialLevel);
    record.xp = 0;
    markEntityUnlocked(record, true);
    reconcileAppearanceForEntityRecord(record, pokemonId);
    captureBackfilled = ensureOwnedRecordHasAtLeastOneCapture(record);
  } else {
    captureBackfilled = ensureOwnedRecordHasAtLeastOneCapture(record);
  }
  return { record, wasUnlocked, captureBackfilled };
}

function addSpeciesToTeamIfPossible(pokemonId) {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return false;
  }
  const id = Number(pokemonId);
  if (id <= 0) {
    return false;
  }
  if (state.saveData.team.includes(id)) {
    return false;
  }
  if (state.saveData.team.length >= MAX_TEAM_SIZE) {
    return false;
  }
  state.saveData.team.push(id);
  return true;
}

function normalizeComparisonToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCurrentTimeOfDayTag(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 18 || hour < 5) {
    return "night";
  }
  if (hour >= 16) {
    return "dusk";
  }
  return "day";
}

function isEvolutionTimeOfDaySatisfied(requiredTimeOfDay) {
  const required = String(requiredTimeOfDay || "").toLowerCase().trim();
  if (!required) {
    return true;
  }
  const currentTag = getCurrentTimeOfDayTag();
  if (required === "day" || required === "morning" || required === "afternoon") {
    return currentTag === "day";
  }
  if (required === "dusk" || required === "evening") {
    return currentTag === "dusk" || currentTag === "night";
  }
  if (required === "night") {
    return currentTag === "night";
  }
  return false;
}

function doesCurrentRouteMatchEvolutionLocation(locationToken) {
  const token = normalizeComparisonToken(locationToken);
  if (!token) {
    return true;
  }

  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = state.routeData?.route_name_fr || getRouteDisplayName(activeRouteId);
  const routeIdToken = normalizeComparisonToken(activeRouteId);
  const routeNameToken = normalizeComparisonToken(routeName);
  return routeIdToken.includes(token) || routeNameToken.includes(token);
}

function hasEvolutionItemConditionReady(record, targetPokemonId) {
  const targetId = Number(targetPokemonId || 0);
  if (!record || targetId <= 0) {
    return false;
  }
  const readyTargets = normalizeEvolutionItemReadyTargets(record.evolution_item_ready_targets);
  return readyTargets.includes(targetId);
}

function setEvolutionItemConditionReady(fromPokemonId, toPokemonId) {
  const fromId = Number(fromPokemonId || 0);
  const toId = Number(toPokemonId || 0);
  if (fromId <= 0 || toId <= 0 || fromId === toId) {
    return false;
  }
  const record = getPokemonEntityRecord(fromId);
  if (!record || !isEntityUnlocked(record) || isPokemonEntityUnlockedById(toId)) {
    return false;
  }
  const readyTargets = normalizeEvolutionItemReadyTargets(record.evolution_item_ready_targets);
  if (!readyTargets.includes(toId)) {
    readyTargets.push(toId);
  }
  record.evolution_item_ready_targets = readyTargets;
  return true;
}

function consumeEvolutionItemConditionReady(record, targetPokemonId) {
  if (!record) {
    return;
  }
  const targetId = Number(targetPokemonId || 0);
  if (targetId <= 0) {
    return;
  }
  const readyTargets = normalizeEvolutionItemReadyTargets(record.evolution_item_ready_targets);
  record.evolution_item_ready_targets = readyTargets.filter((entry) => Number(entry) !== targetId);
}

function getHappinessEvolutionBoxStreakMs(record) {
  return Math.max(0, toSafeInt(record?.happiness_box_streak_ms, 0));
}

function hasHappinessEvolutionMethodForPokemon(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const def = state.pokemonDefsById.get(id);
  if (!def || !Array.isArray(def.evolvesTo) || def.evolvesTo.length <= 0) {
    return false;
  }
  return def.evolvesTo.some((target) => {
    const methods = Array.isArray(target?.evolutionMethods) ? target.evolutionMethods : [];
    return methods.some((method) => method?.minHappiness != null);
  });
}

function isHappinessEvolutionConditionSatisfied(record) {
  return getHappinessEvolutionBoxStreakMs(record) >= HAPPINESS_EVOLUTION_BOX_REQUIRED_MS;
}

function updateHappinessEvolutionBoxProgress(deltaMs) {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return;
  }
  const stepMs = Math.max(0, Number(deltaMs) || 0);
  const teamIds = new Set(
    Array.isArray(state.saveData.team)
      ? state.saveData.team
          .map((id) => Number(id))
          .filter((id) => id > 0)
      : [],
  );

  for (const [rawKey, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawKey || 0);
    if (pokemonId <= 0 || !rawRecord || typeof rawRecord !== "object" || !isEntityUnlocked(rawRecord)) {
      continue;
    }
    if (!hasHappinessEvolutionMethodForPokemon(pokemonId)) {
      continue;
    }
    if (teamIds.has(pokemonId)) {
      if (getHappinessEvolutionBoxStreakMs(rawRecord) > 0) {
        rawRecord.happiness_box_streak_ms = 0;
      }
      continue;
    }
    if (stepMs <= 0) {
      continue;
    }
    const nextValue = Math.min(
      HAPPINESS_EVOLUTION_BOX_REQUIRED_MS,
      getHappinessEvolutionBoxStreakMs(rawRecord) + stepMs,
    );
    rawRecord.happiness_box_streak_ms = Math.round(nextValue);
  }
}

function isEvolutionMethodSatisfied(record, method, targetPokemonId = 0) {
  if (!record || !method) {
    return false;
  }

  const trigger = String(method.trigger || method.evolutionType || "").toLowerCase();
  if (trigger === "use-item" || trigger === "item" || trigger === "trade") {
    return hasEvolutionItemConditionReady(record, targetPokemonId);
  }
  if (trigger !== "level-up") {
    return false;
  }

  if (method.minLevel != null && record.level < method.minLevel) {
    return false;
  }

  if (method.minHappiness != null && !isHappinessEvolutionConditionSatisfied(record)) {
    return false;
  }

  if (method.timeOfDay && !isEvolutionTimeOfDaySatisfied(method.timeOfDay)) {
    return false;
  }

  if (method.relativePhysicalStats != null) {
    const attack = Math.max(0, toSafeInt(record.stats?.attack, 0));
    const defense = Math.max(0, toSafeInt(record.stats?.defense, 0));
    if (method.relativePhysicalStats > 0 && attack <= defense) {
      return false;
    }
    if (method.relativePhysicalStats < 0 && attack >= defense) {
      return false;
    }
    if (method.relativePhysicalStats === 0 && attack !== defense) {
      return false;
    }
  }

  if (method.partySpecies != null) {
    const requiredPartySpecies = Number(method.partySpecies);
    if (
      requiredPartySpecies <= 0 ||
      !Array.isArray(state.saveData?.team) ||
      !state.saveData.team.some((id) => Number(id) === requiredPartySpecies)
    ) {
      return false;
    }
  }

  if (method.location && !doesCurrentRouteMatchEvolutionLocation(method.location)) {
    return false;
  }

  if (
    method.minBeauty != null ||
    method.gender ||
    method.item ||
    method.heldItem ||
    method.knownMove
  ) {
    return false;
  }

  return true;
}

function findNextEligibleEvolution(record) {
  const pokemonId = Number(record?.id || 0);
  if (pokemonId <= 0) {
    return null;
  }
  const fromDef = state.pokemonDefsById.get(pokemonId);
  if (!fromDef || !Array.isArray(fromDef.evolvesTo) || fromDef.evolvesTo.length === 0) {
    return null;
  }

  for (const target of fromDef.evolvesTo) {
    const toId = Number(target?.id || 0);
    if (toId <= 0 || toId === pokemonId) {
      continue;
    }
    if (isPokemonEntityUnlockedById(toId)) {
      continue;
    }
    const methods = Array.isArray(target.evolutionMethods) ? target.evolutionMethods : [];
    if (methods.length === 0) {
      continue;
    }
    if (!methods.some((method) => isEvolutionMethodSatisfied(record, method, toId))) {
      continue;
    }
    const toDef = state.pokemonDefsById.get(toId);
    if (!toDef) {
      continue;
    }
    return {
      fromId: pokemonId,
      toId,
      fromDef,
      toDef,
    };
  }

  return null;
}

function applyEvolutionUnlockAndTeamPlacement(fromPokemonId, toPokemonId, preferredSlotIndex = -1) {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return null;
  }

  const fromId = Number(fromPokemonId || 0);
  const toId = Number(toPokemonId || 0);
  if (fromId <= 0 || toId <= 0 || fromId === toId) {
    return null;
  }
  const fromRecord = getPokemonEntityRecord(fromId);
  if (!fromRecord || !isEntityUnlocked(fromRecord)) {
    return null;
  }

  const unlockResult = ensurePokemonEntityUnlocked(toId, 1);
  if (unlockResult.wasUnlocked) {
    return null;
  }
  consumeEvolutionItemConditionReady(fromRecord, toId);

  const team = state.saveData.team;
  const alreadyInTeam = team.some((id) => Number(id) === toId);
  let teamAction = "none";
  let slotIndex = -1;

  if (!alreadyInTeam) {
    if (team.length < MAX_TEAM_SIZE) {
      team.push(toId);
      teamAction = "added";
      slotIndex = team.length - 1;
    } else {
      let replaceIndex = -1;
      if (preferredSlotIndex >= 0 && preferredSlotIndex < team.length && Number(team[preferredSlotIndex]) === fromId) {
        replaceIndex = preferredSlotIndex;
      } else {
        replaceIndex = team.findIndex((id) => Number(id) === fromId);
      }
      if (replaceIndex >= 0) {
        team[replaceIndex] = toId;
        teamAction = "replaced";
        slotIndex = replaceIndex;
      }
    }
  }

  const fromDef = state.pokemonDefsById.get(fromId);
  const toDef = state.pokemonDefsById.get(toId);
  return {
    fromId,
    toId,
    fromDef: fromDef || null,
    toDef: toDef || null,
    fromNameFr: fromDef?.nameFr || "Pokemon " + String(fromId),
    toNameFr: toDef?.nameFr || "Pokemon " + String(toId),
    teamAction,
    teamSlotIndex: slotIndex,
  };
}

function getEvolutionStoneMethodItem(stoneType) {
  const key = String(stoneType || "").toLowerCase().trim();
  return EVOLUTION_STONE_CONFIG_BY_TYPE[key]?.methodItem || "";
}

function isEvolutionMethodCompatibleWithShopItem(method, methodItem) {
  if (!method) {
    return false;
  }
  const expectedMethodItem = String(methodItem || "").toLowerCase().trim();
  if (!expectedMethodItem) {
    return false;
  }

  const trigger = String(method.trigger || method.evolutionType || "").toLowerCase().trim();
  const itemToken = String(method.item || "").toLowerCase().trim();
  const heldItemToken = String(method.heldItem || "").toLowerCase().trim();
  if (trigger === "use-item" || trigger === "item") {
    return itemToken === expectedMethodItem;
  }
  if (trigger !== "trade") {
    return false;
  }
  if (itemToken) {
    return itemToken === expectedMethodItem;
  }
  if (heldItemToken) {
    return heldItemToken === expectedMethodItem;
  }
  return expectedMethodItem === CABLE_LINK_METHOD_ITEM;
}

function findEvolutionStoneCandidates(stoneType) {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return [];
  }
  const methodItem = getEvolutionStoneMethodItem(stoneType);
  if (!methodItem) {
    return [];
  }

  const team = Array.isArray(state.saveData.team) ? state.saveData.team.map((id) => Number(id)) : [];
  const candidates = [];

  for (const [rawId, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }

    const fromDef = state.pokemonDefsById.get(pokemonId);
    if (!fromDef || !Array.isArray(fromDef.evolvesTo) || fromDef.evolvesTo.length <= 0) {
      continue;
    }

    for (const target of fromDef.evolvesTo) {
      const toId = Number(target?.id || 0);
      if (toId <= 0 || isPokemonEntityUnlockedById(toId)) {
        continue;
      }
      if (hasEvolutionItemConditionReady(record, toId)) {
        continue;
      }
      const methods = Array.isArray(target.evolutionMethods) ? target.evolutionMethods : [];
      const hasItemMethod = methods.some((method) => isEvolutionMethodCompatibleWithShopItem(method, methodItem));
      if (!hasItemMethod) {
        continue;
      }
      const toDef = state.pokemonDefsById.get(toId);
      if (!toDef) {
        continue;
      }
      candidates.push({
        fromId: pokemonId,
        toId,
        fromDef,
        toDef,
        fromNameFr: fromDef.nameFr,
        toNameFr: toDef.nameFr,
        teamSlotIndex: team.findIndex((id) => id === pokemonId),
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.fromId !== b.fromId) {
      return a.fromId - b.fromId;
    }
    return a.toId - b.toId;
  });
  return candidates;
}

function getEvolutionItemChoiceStoneName(stoneType) {
  return EVOLUTION_STONE_CONFIG_BY_TYPE[String(stoneType || "").toLowerCase().trim()]?.nameFr || "Objet d'evolution";
}

function getEvolutionItemChoiceSpritePath(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return "";
  }
  const appearance = resolveSpriteAppearanceForEntity(id, {
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
    forceShiny: false,
    forceUltraShiny: false,
  });
  const def = state.pokemonDefsById.get(id);
  return String(appearance?.variant?.frontPath || def?.spritePath || appearance?.spritePath || "").trim();
}

function createEvolutionItemChoiceMonElement(pokemonId, nameFr, { silhouette = false } = {}) {
  const card = document.createElement("div");
  card.className = "evolution-item-choice-mon";

  const spriteWrap = document.createElement("div");
  spriteWrap.className = "evolution-item-choice-sprite-wrap";
  const spritePath = getEvolutionItemChoiceSpritePath(pokemonId);
  if (spritePath) {
    const spriteImg = document.createElement("img");
    spriteImg.className = `evolution-item-choice-sprite${silhouette ? " is-silhouette" : ""}`;
    spriteImg.src = spritePath;
    spriteImg.alt = nameFr || `Pokemon ${String(pokemonId || "")}`;
    spriteWrap.appendChild(spriteImg);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "evolution-item-choice-fallback";
    fallback.textContent = "???";
    spriteWrap.appendChild(fallback);
  }
  if (silhouette) {
    const question = document.createElement("span");
    question.className = "evolution-item-choice-question";
    question.textContent = "?";
    spriteWrap.appendChild(question);
  }
  card.appendChild(spriteWrap);

  const nameEl = document.createElement("div");
  nameEl.className = "evolution-item-choice-mon-name";
  nameEl.textContent = String(nameFr || "").trim() || `Pokemon ${String(pokemonId || "")}`;
  card.appendChild(nameEl);
  return card;
}

function renderEvolutionItemChoiceModal() {
  if (!evolutionItemTitleEl || !evolutionItemSubtitleEl || !evolutionItemListEl) {
    return;
  }
  const stoneName = getEvolutionItemChoiceStoneName(evolutionItemChoiceStoneType);
  const candidates = Array.isArray(evolutionItemChoiceCandidates) ? evolutionItemChoiceCandidates : [];
  evolutionItemTitleEl.textContent = stoneName;
  evolutionItemSubtitleEl.textContent = "Choisis un Pokemon compatible avec cet objet.";
  evolutionItemListEl.innerHTML = "";

  if (candidates.length <= 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "evolution-item-empty";
    emptyEl.textContent = "Aucun Pokemon compatible pour le moment.";
    evolutionItemListEl.appendChild(emptyEl);
    return;
  }

  for (const entry of candidates) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "evolution-item-choice-btn";

    const meta = document.createElement("div");
    meta.className = "evolution-item-choice-meta";
    const nameEl = document.createElement("div");
    nameEl.className = "evolution-item-choice-name";
    nameEl.textContent = `${entry.fromNameFr} -> ${entry.toNameFr}`;
    meta.appendChild(nameEl);
    if (entry.teamSlotIndex >= 0) {
      const teamEl = document.createElement("div");
      teamEl.className = "evolution-item-choice-team";
      teamEl.textContent = `Equipe #${entry.teamSlotIndex + 1}`;
      meta.appendChild(teamEl);
    }
    button.appendChild(meta);

    const row = document.createElement("div");
    row.className = "evolution-item-choice-row";
    row.appendChild(createEvolutionItemChoiceMonElement(entry.fromId, entry.fromNameFr, { silhouette: false }));
    const arrow = document.createElement("div");
    arrow.className = "evolution-item-choice-arrow";
    arrow.textContent = "→";
    row.appendChild(arrow);
    row.appendChild(createEvolutionItemChoiceMonElement(entry.toId, entry.toNameFr, { silhouette: true }));
    button.appendChild(row);

    button.addEventListener("click", () => {
      closeEvolutionItemChoiceModal(entry);
    });
    evolutionItemListEl.appendChild(button);
  }
}

function closeEvolutionItemChoiceModal(selectedCandidate = null) {
  const resolver = evolutionItemChoiceResolver;
  evolutionItemChoiceResolver = null;
  evolutionItemChoiceStoneType = "";
  evolutionItemChoiceCandidates = [];
  state.ui.evolutionItemChoiceOpen = false;
  state.ui.evolutionItemChoiceStoneType = "";
  if (evolutionItemModalEl) {
    evolutionItemModalEl.classList.add("hidden");
  }
  if (typeof resolver === "function") {
    resolver(selectedCandidate);
  }
}

function promptEvolutionStoneChoice(stoneType, candidates) {
  if (!Array.isArray(candidates) || candidates.length <= 0) {
    return Promise.resolve(null);
  }
  const key = String(stoneType || "").toLowerCase().trim();
  if (!evolutionItemModalEl || !evolutionItemTitleEl || !evolutionItemSubtitleEl || !evolutionItemListEl) {
    return Promise.resolve(candidates[0] || null);
  }

  if (typeof evolutionItemChoiceResolver === "function") {
    evolutionItemChoiceResolver(null);
  }
  evolutionItemChoiceStoneType = key;
  evolutionItemChoiceCandidates = candidates.slice();
  state.ui.evolutionItemChoiceOpen = true;
  state.ui.evolutionItemChoiceStoneType = key;
  renderEvolutionItemChoiceModal();
  evolutionItemModalEl.classList.remove("hidden");
  return new Promise((resolve) => {
    evolutionItemChoiceResolver = resolve;
  });
}

function queueEvolutionAnimationForResult(evolutionResult) {
  if (!evolutionResult || !evolutionResult.fromDef || !evolutionResult.toDef) {
    return;
  }
  const particles = [];
  const particleCount = shouldRenderCelebrationParticles()
    ? EVOLUTION_ANIM_PARTICLE_COUNT
    : Math.max(8, Math.round(EVOLUTION_ANIM_PARTICLE_COUNT * 0.65));
  const particleColors = [
    [145, 212, 255],
    [255, 243, 172],
    [214, 185, 255],
  ];
  for (let i = 0; i < particleCount; i += 1) {
    particles.push({
      startMs: randomRange(0, EVOLUTION_ANIM_TOTAL_MS * 0.68),
      durationMs: randomRange(760, 1320),
      baseAngle: randomRange(0, Math.PI * 2),
      spinTurns: randomRange(0.45, 1.15) * (Math.random() < 0.5 ? -1 : 1),
      radiusStart: randomRange(0.16, 0.34),
      radiusGrow: randomRange(0.12, 0.26),
      lift: randomRange(0.1, 0.24),
      heightOffset: randomRange(-0.12, 0.18),
      size: randomRange(1.5, 3.2),
      color: particleColors[i % particleColors.length],
    });
  }
  state.evolutionAnimation.queue.push({
    fromId: evolutionResult.fromId,
    toId: evolutionResult.toId,
    fromDef: evolutionResult.fromDef,
    toDef: evolutionResult.toDef,
    fromNameFr: evolutionResult.fromNameFr,
    toNameFr: evolutionResult.toNameFr,
    elapsedMs: 0,
    totalMs: EVOLUTION_ANIM_TOTAL_MS,
    particles,
  });
}

function getEvolutionRootSpeciesId(pokemonId) {
  let currentId = Number(pokemonId || 0);
  if (currentId <= 0) {
    return 0;
  }
  const visited = new Set();
  while (currentId > 0 && !visited.has(currentId)) {
    visited.add(currentId);
    const def = state.pokemonDefsById.get(currentId);
    const fromId = Number(def?.evolvesFrom?.id || 0);
    if (fromId <= 0) {
      return currentId;
    }
    currentId = fromId;
  }
  return Number(pokemonId || 0);
}

function resolveCaptureEntityUnlock(capturedPokemonId) {
  const pokemonId = Number(capturedPokemonId || 0);
  if (pokemonId <= 0) {
    return {
      grantedEntityId: null,
      addedToTeam: false,
      suppressedEvolvedEntityUnlock: false,
    };
  }

  const capturedDef = state.pokemonDefsById.get(pokemonId);
  const evolvesFromId = Number(capturedDef?.evolvesFrom?.id || 0);
  const isEvolutionSpecies = evolvesFromId > 0;

  if (isEvolutionSpecies) {
    const baseSpeciesId = getEvolutionRootSpeciesId(pokemonId);
    if (baseSpeciesId > 0 && baseSpeciesId !== pokemonId && !isPokemonEntityUnlockedById(baseSpeciesId)) {
      const baseUnlockResult = ensurePokemonEntityUnlocked(baseSpeciesId, 1);
      let addedToTeam = false;
      if (!baseUnlockResult.wasUnlocked) {
        addedToTeam = addSpeciesToTeamIfPossible(baseSpeciesId);
      }
      return {
        grantedEntityId: baseUnlockResult.wasUnlocked ? null : baseSpeciesId,
        addedToTeam,
        suppressedEvolvedEntityUnlock: true,
      };
    }
    return {
      grantedEntityId: null,
      addedToTeam: false,
      suppressedEvolvedEntityUnlock: true,
    };
  }

  const unlockResult = ensurePokemonEntityUnlocked(pokemonId, 1);
  let addedToTeam = false;
  if (!unlockResult.wasUnlocked) {
    addedToTeam = addSpeciesToTeamIfPossible(pokemonId);
  }
  return {
    grantedEntityId: unlockResult.wasUnlocked ? null : pokemonId,
    addedToTeam,
    suppressedEvolvedEntityUnlock: false,
  };
}

function reconcileEntityUnlockStates() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return false;
  }
  let changed = false;
  for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(record?.id || rawId || 0);
    if (pokemonId <= 0 || !record) {
      continue;
    }
    if (isEntityUnlocked(record)) {
      if (ensureOwnedRecordHasAtLeastOneCapture(record)) {
        changed = true;
      }
      continue;
    }
    const capturedTotal = getCapturedTotal(record);
    if (capturedTotal <= 0) {
      continue;
    }
    const def = state.pokemonDefsById.get(pokemonId);
    if (!def) {
      continue;
    }
    const isEvolutionSpecies = Number(def.evolvesFrom?.id || 0) > 0;
    if (!isEvolutionSpecies) {
      markEntityUnlocked(record, true);
      ensureOwnedRecordHasAtLeastOneCapture(record);
      changed = true;
    }
  }
  return changed;
}

function rebuildTeamAndSyncBattle() {
  state.team = hydrateTeamFromSave();
  if (state.battle) {
    state.battle.syncTeam(state.team);
    syncActiveEnemyAppearance();
  }
}

function queueTeamLevelUpEffects(levelUps) {
  if (!Array.isArray(levelUps) || levelUps.length <= 0) {
    return;
  }
  const layout = state.layout || computeLayout();
  const slots = Array.isArray(layout?.teamSlots) ? layout.teamSlots : [];
  const celebrationParticles = shouldRenderCelebrationParticles();

  for (const entry of levelUps) {
    const slotIndex = toSafeInt(entry?.slotIndex, -1);
    if (slotIndex < 0 || slotIndex >= slots.length) {
      continue;
    }
    const slot = slots[slotIndex];
    if (!slot) {
      continue;
    }
    const centerX = slot.x;
    const centerY = slot.y - slot.size * 0.04;
    const particles = [];
    const particleCount = celebrationParticles ? 12 : 0;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = randomRange(-Math.PI * 0.92, -Math.PI * 0.08);
      const speed = randomRange(36, 128);
      const lifeMs = randomRange(280, TEAM_LEVEL_UP_EFFECT_DURATION_MS);
      particles.push({
        x: centerX + randomRange(-6, 6),
        y: centerY + randomRange(-4, 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomRange(8, 24),
        size: randomRange(1.6, 3.6),
        lifeMs,
        maxLifeMs: lifeMs,
      });
    }

    state.teamLevelUpEffects.push({
      x: centerX,
      y: centerY,
      lifeMs: TEAM_LEVEL_UP_EFFECT_DURATION_MS,
      maxLifeMs: TEAM_LEVEL_UP_EFFECT_DURATION_MS,
      ringRadius: slot.size * 0.14,
      ringGrow: slot.size * 0.62,
      particles,
    });
  }
}

function queueTeamXpGainEffects(xpGains, options = {}) {
  if (!Array.isArray(xpGains) || xpGains.length <= 0) {
    return;
  }
  const layout = state.layout || computeLayout();
  const slots = Array.isArray(layout?.teamSlots) ? layout.teamSlots : [];
  const tone = String(options.tone || "defeat");

  for (const gain of xpGains) {
    const slotIndex = toSafeInt(gain?.slotIndex, -1);
    if (slotIndex < 0 || slotIndex >= slots.length) {
      continue;
    }
    const slot = slots[slotIndex];
    if (!slot) {
      continue;
    }
    const amount = Math.max(0, toSafeInt(gain?.amount, 0));
    if (amount <= 0) {
      continue;
    }
    const gainedLevels = Math.max(0, toSafeInt(gain?.gainedLevels, 0));
    const amountLabel = formatCompactNumber(amount, {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    });
    const text = gainedLevels > 0 ? `+${amountLabel} XP | Niv +${gainedLevels}` : `+${amountLabel} XP`;
    state.teamXpGainEffects.push({
      x: slot.x,
      y: slot.y - slot.size * 0.24,
      baseY: slot.y - slot.size * 0.24,
      text,
      tone,
      lifeMs: TEAM_XP_GAIN_EFFECT_DURATION_MS,
      maxLifeMs: TEAM_XP_GAIN_EFFECT_DURATION_MS,
      floatY: randomRange(-34, -50),
      particles: [],
    });
  }
}

function updateTeamLevelUpEffects(deltaMs) {
  if (!Array.isArray(state.teamLevelUpEffects) || state.teamLevelUpEffects.length <= 0) {
    return;
  }
  const dt = Math.max(0, Number(deltaMs) || 0) / 1000;
  const survivors = [];

  for (const effect of state.teamLevelUpEffects) {
    effect.lifeMs -= deltaMs;
    if (effect.lifeMs <= 0) {
      continue;
    }
    effect.ringRadius += effect.ringGrow * dt;
    const nextParticles = [];
    for (const particle of effect.particles || []) {
      particle.lifeMs -= deltaMs;
      if (particle.lifeMs <= 0) {
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 120 * dt;
      particle.vx *= clamp(1 - 1.8 * dt, 0.35, 1);
      nextParticles.push(particle);
    }
    effect.particles = nextParticles;
    survivors.push(effect);
  }

  state.teamLevelUpEffects = survivors;
}

function updateTeamXpGainEffects(deltaMs) {
  if (!Array.isArray(state.teamXpGainEffects) || state.teamXpGainEffects.length <= 0) {
    return;
  }
  const survivors = [];
  for (const effect of state.teamXpGainEffects) {
    effect.lifeMs -= deltaMs;
    if (effect.lifeMs <= 0) {
      continue;
    }
    const lifeRatio = clamp(effect.lifeMs / Math.max(1, effect.maxLifeMs), 0, 1);
    effect.y = effect.baseY + (1 - lifeRatio) * effect.floatY;
    survivors.push(effect);
  }
  state.teamXpGainEffects = survivors;
}

function getActiveTeamSizeForBalance() {
  const battleTeam = Array.isArray(state.battle?.team) ? state.battle.team : [];
  const battleCount = battleTeam.reduce((count, member) => (member ? count + 1 : count), 0);
  if (battleCount > 0) {
    return clamp(battleCount, 1, MAX_TEAM_SIZE);
  }

  const runtimeTeam = Array.isArray(state.team) ? state.team : [];
  const runtimeCount = runtimeTeam.reduce((count, member) => (member ? count + 1 : count), 0);
  if (runtimeCount > 0) {
    return clamp(runtimeCount, 1, MAX_TEAM_SIZE);
  }

  const saveTeam = Array.isArray(state.saveData?.team) ? state.saveData.team : [];
  const saveCount = saveTeam.reduce((count, id) => (Number(id) > 0 ? count + 1 : count), 0);
  return clamp(saveCount, 1, MAX_TEAM_SIZE);
}

function getEnemyHpTeamScaleMultiplier(teamSize = getActiveTeamSizeForBalance()) {
  const normalizedTeamSize = clamp(toSafeInt(teamSize, 1), 1, MAX_TEAM_SIZE);
  const fillRatio = MAX_TEAM_SIZE > 1 ? (normalizedTeamSize - 1) / (MAX_TEAM_SIZE - 1) : 1;
  const bonus = Math.pow(fillRatio, ENEMY_HP_TEAM_SCALE_EXPONENT) * ENEMY_HP_TEAM_SCALE_MAX_BONUS;
  return 1 + Math.max(0, bonus);
}

function getEnemyRewardScaleMultiplier(teamHpScaleMultiplier = 1, isOnlyOneEncounter = false) {
  const teamScale = Math.max(1, Number(teamHpScaleMultiplier || 1));
  const easedTeamScale = Math.pow(teamScale, ENEMY_REWARD_SCALE_EXPONENT);
  const blendedTeamScale = 1 + (easedTeamScale - 1) * ENEMY_REWARD_SCALE_BLEND;
  const onlyOneBonus = isOnlyOneEncounter ? 1.18 : 1;
  return Math.max(1, blendedTeamScale * onlyOneBonus);
}

function computeCaptureXpReward(enemy) {
  const enemyLevel = Math.max(1, toSafeInt(enemy?.level, 1));
  const baseStatTotal = getBaseStatTotal(enemy?.baseStats || enemy?.stats);
  const rewardScale = Math.max(1, Number(enemy?.balanceRewardMultiplier || 1));
  const baseReward = CAPTURE_XP_BASE + enemyLevel * CAPTURE_XP_LEVEL_MULT + baseStatTotal * CAPTURE_XP_STAT_FACTOR;
  const shinyMultiplier = enemy?.isShiny ? 1.35 : 1;
  return Math.max(8, Math.round(baseReward * rewardScale * shinyMultiplier));
}

function computeDefeatMoneyReward(enemy) {
  const enemyLevel = Math.max(1, toSafeInt(enemy?.level, 1));
  const baseStatTotal = getBaseStatTotal(enemy?.baseStats || enemy?.stats);
  const rewardScale = Math.max(1, Number(enemy?.balanceRewardMultiplier || 1));
  const baseReward = ENEMY_MONEY_BASE + enemyLevel * ENEMY_MONEY_LEVEL_MULT + baseStatTotal * ENEMY_MONEY_STAT_FACTOR;
  const shinyMultiplier = enemy?.isShiny ? 1.6 : 1;
  return Math.max(4, Math.round(baseReward * rewardScale * shinyMultiplier));
}

function applyExperienceToEntity(record, amount) {
  if (!record || amount <= 0 || record.level >= MAX_LEVEL) {
    return { gainedLevels: 0, newLevel: record?.level || 1 };
  }
  record.xp = Math.max(0, toSafeInt(record.xp, 0));
  record.xp += Math.max(0, toSafeInt(amount, 0));

  let gainedLevels = 0;
  while (record.level < MAX_LEVEL) {
    const required = getXpToNextLevelForSpecies(record.id, record.level, record.stats);
    if (required <= 0 || record.xp < required) {
      break;
    }
    record.xp -= required;
    record.level += 1;
    gainedLevels += 1;
    setEntityLevel(record, record.level);
  }

  if (record.level >= MAX_LEVEL) {
    record.level = MAX_LEVEL;
    record.xp = 0;
    setEntityLevel(record, MAX_LEVEL);
  }

  return { gainedLevels, newLevel: record.level };
}

function awardCaptureXpToTeam(enemy, options = {}) {
  if (!state.saveData || !Array.isArray(state.saveData.team) || state.saveData.team.length === 0) {
    return { reward: 0, levelUps: [], evolutionReady: [], xpGains: [] };
  }
  const overrideReward = Number(options.reward);
  const reward = Number.isFinite(overrideReward)
    ? Math.max(0, toSafeInt(overrideReward, 0))
    : computeCaptureXpReward(enemy);
  const levelUps = [];
  const evolutionReady = [];
  const xpGains = [];
  let reachedAppearanceUnlockLevelNow = false;
  const teamSnapshot = state.saveData.team.slice(0, MAX_TEAM_SIZE).map((id) => Number(id));

  for (let slotIndex = 0; slotIndex < teamSnapshot.length; slotIndex += 1) {
    const pokemonId = teamSnapshot[slotIndex];
    if (pokemonId <= 0) {
      continue;
    }
    const record = ensureSpeciesStats(pokemonId);
    const def = state.pokemonDefsById.get(Number(pokemonId));
    const beforeLevel = record.level;
    const result = applyExperienceToEntity(record, reward);
    if (beforeLevel < APPEARANCE_UNLOCK_LEVEL && record.level >= APPEARANCE_UNLOCK_LEVEL) {
      reachedAppearanceUnlockLevelNow = true;
    }
    if (reward > 0) {
      xpGains.push({
        id: Number(pokemonId),
        slotIndex,
        nameFr: def?.nameFr || `Pokemon ${pokemonId}`,
        amount: reward,
        gainedLevels: Math.max(0, toSafeInt(result.gainedLevels, 0)),
      });
    }
    if (result.gainedLevels > 0 && record.level > beforeLevel) {
      levelUps.push({
        id: Number(pokemonId),
        nameFr: def?.nameFr || `Pokemon ${pokemonId}`,
        fromLevel: beforeLevel,
        toLevel: record.level,
        slotIndex,
      });
    }

    const evolutionCandidate = findNextEligibleEvolution(record);
    if (!evolutionCandidate) {
      continue;
    }
    const fromNameFr = evolutionCandidate.fromDef?.nameFr || getPokemonDisplayNameById(evolutionCandidate.fromId);
    const toNameFr = evolutionCandidate.toDef?.nameFr || getPokemonDisplayNameById(evolutionCandidate.toId);
    const queuedId = enqueueEvolutionReadyNotification({
      fromId: evolutionCandidate.fromId,
      toId: evolutionCandidate.toId,
      fromNameFr,
      toNameFr,
      teamSlotIndex: slotIndex,
    });
    if (queuedId) {
      evolutionReady.push({
        fromId: evolutionCandidate.fromId,
        toId: evolutionCandidate.toId,
        fromNameFr,
        toNameFr,
      });
    }
  }

  const appearanceUnlockedNow = reachedAppearanceUnlockLevelNow
    ? ensureAppearanceEditorUnlockedFromProgress()
    : false;
  return { reward, levelUps, evolutionReady, xpGains, appearanceUnlockedNow };
}

function computeCatchChance(catchRate, ballMultiplier = 1) {
  const normalizedRate = clamp(Number(catchRate || 45), 1, 255) / 255;
  const baseChance = clamp(0.07 + normalizedRate * 0.75, 0.06, 0.94);
  const multiplier = Math.max(0.05, Number(ballMultiplier || 1));
  return clamp(baseChance * multiplier, 0.06, 0.99);
}

function buildPokemonJsonPath(pokemonId, nameEn) {
  return `pokemon_data/${pokemonId}_${nameEn}/${pokemonId}_${nameEn}_data.json`;
}

function resolveSpritePath(jsonPath, spriteRelativePath) {
  if (!spriteRelativePath) {
    return null;
  }
  const slashIndex = jsonPath.lastIndexOf("/");
  const folderPath = slashIndex >= 0 ? jsonPath.slice(0, slashIndex) : ".";
  return `${folderPath}/${spriteRelativePath}`;
}

function loadImage(imagePath) {
  if (!imagePath) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = imagePath;
  });
}

function buildTypeIconAssetPath(typeName) {
  return `${TYPE_ICON_ASSET_DIR}/${normalizeType(typeName)}.png`;
}

async function preloadTypeIcons() {
  const entries = await Promise.all(
    TYPE_ICON_TYPES.map(async (typeName) => [typeName, await loadImage(buildTypeIconAssetPath(typeName))]),
  );
  return new Map(entries);
}

function getDefensiveTypes(payload) {
  if (!Array.isArray(payload?.defensive_types) || payload.defensive_types.length === 0) {
    return ["normal"];
  }
  return payload.defensive_types.map((typeName) => String(typeName || "normal").toLowerCase());
}

function normalizeEvolutionMethod(rawMethod) {
  if (!rawMethod || typeof rawMethod !== "object") {
    return null;
  }

  const minLevelValue = Number(rawMethod.min_level ?? rawMethod.minLevel);
  const minHappinessValue = Number(rawMethod.min_happiness ?? rawMethod.minHappiness);
  const minBeautyValue = Number(rawMethod.min_beauty ?? rawMethod.minBeauty);
  const relativePhysicalStatsValue = Number(rawMethod.relative_physical_stats ?? rawMethod.relativePhysicalStats);
  const partySpeciesValue = Number(rawMethod.party_species ?? rawMethod.partySpecies);
  const genderValue = rawMethod.gender;
  const timeOfDayValue = rawMethod.time_of_day ?? rawMethod.timeOfDay;
  const itemValue = rawMethod.item;
  const heldItemValue = rawMethod.held_item ?? rawMethod.heldItem;
  const knownMoveValue = rawMethod.known_move ?? rawMethod.knownMove;
  const locationValue = rawMethod.location;

  return {
    evolutionType: String(rawMethod.evolution_type ?? rawMethod.evolutionType ?? rawMethod.trigger ?? "")
      .toLowerCase()
      .trim(),
    trigger: String(rawMethod.trigger ?? rawMethod.evolution_type ?? rawMethod.evolutionType ?? "")
      .toLowerCase()
      .trim(),
    minLevel: Number.isFinite(minLevelValue) ? clamp(Math.round(minLevelValue), 1, MAX_LEVEL) : null,
    minHappiness: Number.isFinite(minHappinessValue) ? Math.max(0, Math.round(minHappinessValue)) : null,
    minBeauty: Number.isFinite(minBeautyValue) ? Math.max(0, Math.round(minBeautyValue)) : null,
    relativePhysicalStats: Number.isFinite(relativePhysicalStatsValue)
      ? clamp(Math.round(relativePhysicalStatsValue), -1, 1)
      : null,
    partySpecies: Number.isFinite(partySpeciesValue) && partySpeciesValue > 0 ? Math.round(partySpeciesValue) : null,
    gender: genderValue == null ? null : String(genderValue).toLowerCase().trim(),
    timeOfDay: timeOfDayValue == null ? null : String(timeOfDayValue).toLowerCase().trim(),
    item: itemValue == null ? null : String(itemValue).toLowerCase().trim(),
    heldItem: heldItemValue == null ? null : String(heldItemValue).toLowerCase().trim(),
    knownMove: knownMoveValue == null ? null : String(knownMoveValue).toLowerCase().trim(),
    location: locationValue == null ? null : String(locationValue).toLowerCase().trim(),
  };
}

function normalizeEvolutionLink(rawLink) {
  if (!rawLink || typeof rawLink !== "object") {
    return null;
  }
  const id = Number(rawLink.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const methods = Array.isArray(rawLink.evolution_methods)
    ? rawLink.evolution_methods.map((method) => normalizeEvolutionMethod(method)).filter(Boolean)
    : [];
  return {
    id,
    nameEn: String(rawLink.name_en || "").toLowerCase().trim(),
    evolutionMethods: methods,
  };
}

function getTypeMultiplier(attackType, defenderTypes) {
  let multiplier = 1;
  const attackTable = TYPE_EFFECTIVENESS[String(attackType || "normal").toLowerCase()] || {};
  for (const defenderTypeRaw of defenderTypes || []) {
    const defenderType = String(defenderTypeRaw || "normal").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(attackTable, defenderType)) {
      multiplier *= attackTable[defenderType];
    }
  }
  return multiplier;
}

function getAttackStat(attacker, attackType) {
  const attackTypeNorm = String(attackType || "normal").toLowerCase();
  if (SPECIAL_ATTACK_TYPES.has(attackTypeNorm)) {
    return Math.max(1, Number(attacker?.stats?.["special-attack"] || attacker?.stats?.attack || 1));
  }
  return Math.max(1, Number(attacker?.stats?.attack || attacker?.stats?.["special-attack"] || 1));
}

function getDefenseStat(defender, attackType) {
  const attackTypeNorm = String(attackType || "normal").toLowerCase();
  if (SPECIAL_ATTACK_TYPES.has(attackTypeNorm)) {
    return Math.max(1, Number(defender?.stats?.["special-defense"] || defender?.stats?.defense || 1));
  }
  return Math.max(1, Number(defender?.stats?.defense || defender?.stats?.["special-defense"] || 1));
}

function computeDamage(attacker, defender, attackType, typeMultiplier, options = {}) {
  if (typeMultiplier <= 0) {
    return {
      damage: 0,
      isCritical: false,
      criticalMultiplier: 1,
    };
  }

  const level = Math.max(1, Number(attacker?.level || 1));
  const attackStat = getAttackStat(attacker, attackType);
  const defenseStat = getDefenseStat(defender, attackType);
  const progressionBoost = Math.pow(getLevelProgressionMultiplier(level), DAMAGE_LEVEL_PROGRESSION_EXPONENT);
  const levelFactor = (2 * level) / 5 + 2;
  const basePower = 70;
  const baseDamage = ((levelFactor * basePower * (attackStat / defenseStat)) / 50) + 2;

  const attackerTypes = Array.isArray(attacker?.defensiveTypes) ? attacker.defensiveTypes : [];
  const normalizedType = String(attackType || "normal").toLowerCase();
  const stab = attackerTypes.includes(normalizedType) || attacker?.offensiveType === normalizedType ? 1.25 : 1;
  const critChanceBonus = Math.max(0, Number(options?.critChanceBonus || 0));
  const critChance = clamp(ATTACK_CRIT_CHANCE + critChanceBonus, 0, 1);
  const forceCritical = Boolean(options?.forceCritical);
  const isCritical = forceCritical || Math.random() < critChance;
  const crit = isCritical ? ATTACK_CRIT_MULTIPLIER : 1;
  const damageMultiplier = Math.max(0, Number(options?.damageMultiplier ?? 1));
  const variance = 0.9 + Math.random() * 0.2;
  const total = baseDamage * stab * typeMultiplier * crit * variance * DAMAGE_SCALE * progressionBoost * damageMultiplier;

  return {
    damage: Math.max(1, Math.round(total)),
    isCritical,
    criticalMultiplier: crit,
  };
}

function rgba(rgb, alpha) {
  const color = Array.isArray(rgb) ? rgb : [220, 236, 255];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function getTypeColor(typeName) {
  return TYPE_COLORS[String(typeName || "normal").toLowerCase()] || [220, 236, 255];
}

function normalizeType(typeName) {
  return String(typeName || "normal").toLowerCase();
}

function formatTypeLabelFr(typeName) {
  const normalized = normalizeType(typeName);
  if (Object.prototype.hasOwnProperty.call(TYPE_LABELS_FR, normalized)) {
    return TYPE_LABELS_FR[normalized];
  }
  if (!normalized) {
    return TYPE_LABELS_FR.normal;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatTypeListFr(types) {
  if (!Array.isArray(types) || types.length <= 0) {
    return TYPE_LABELS_FR.normal;
  }
  return types.map((typeName) => formatTypeLabelFr(typeName)).join(" / ");
}

function isTeamLeftSideSlot(slotIndex, layout = state.layout) {
  const safeIndex = clamp(toSafeInt(slotIndex, 0), 0, MAX_TEAM_SIZE - 1);
  const slot = layout?.teamSlots?.[safeIndex];
  if (slot && Number.isFinite(slot.x) && Number.isFinite(layout?.centerX)) {
    return slot.x < layout.centerX;
  }
  return TEAM_LEFT_SIDE_SLOT_INDEXES.has(safeIndex);
}

function shouldFlipTeamSprite(slotIndex, layout = state.layout) {
  return isTeamLeftSideSlot(slotIndex, layout);
}

function getTypeIconImage(typeName) {
  return state.typeIconImages.get(normalizeType(typeName)) || null;
}

function formatTypeMultiplierLabel(multiplier) {
  const numericMultiplier = Number(multiplier);
  if (!Number.isFinite(numericMultiplier)) {
    return "x1";
  }
  const rounded = Math.round(numericMultiplier * 100) / 100;
  if (Math.abs(rounded) <= 0.001) {
    return "x0";
  }
  return `x${String(rounded).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}`;
}

function getTypeMatchupPalette(multiplier) {
  if (multiplier <= 0.001) {
    return {
      text: "#ffc7d2",
      border: "rgba(211, 106, 131, 0.86)",
      glow: "rgba(255, 151, 183, 0.28)",
      surfaceTop: "rgba(76, 37, 51, 0.98)",
      surfaceBottom: "rgba(43, 22, 31, 0.98)",
    };
  }
  if (multiplier > 1.001) {
    return {
      text: "#ffd989",
      border: "rgba(204, 151, 58, 0.86)",
      glow: "rgba(255, 221, 133, 0.28)",
      surfaceTop: "rgba(84, 63, 33, 0.98)",
      surfaceBottom: "rgba(49, 37, 19, 0.98)",
    };
  }
  if (multiplier < 0.999) {
    return {
      text: "#9bd6ff",
      border: "rgba(89, 145, 196, 0.82)",
      glow: "rgba(132, 200, 255, 0.24)",
      surfaceTop: "rgba(39, 58, 82, 0.98)",
      surfaceBottom: "rgba(24, 38, 56, 0.98)",
    };
  }
  return {
    text: "#dbe8f8",
    border: "rgba(95, 121, 151, 0.8)",
    glow: "rgba(166, 197, 230, 0.2)",
    surfaceTop: "rgba(40, 54, 74, 0.98)",
    surfaceBottom: "rgba(25, 35, 51, 0.98)",
  };
}

function traceRetroHudPath(x, y, width, height, cut = 10) {
  const safeWidth = Math.max(12, Number(width) || 0);
  const safeHeight = Math.max(12, Number(height) || 0);
  const safeCut = clamp(Number(cut) || 0, 4, Math.min(safeWidth, safeHeight) * 0.46);

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + safeWidth - safeCut, y);
  ctx.lineTo(x + safeWidth, y + safeCut);
  ctx.lineTo(x + safeWidth, y + safeHeight - safeCut * 0.18);
  ctx.lineTo(x + safeWidth - safeCut * 0.56, y + safeHeight);
  ctx.lineTo(x, y + safeHeight);
  ctx.closePath();
}

function drawRetroHudPanel(x, y, width, height, options = {}) {
  const safeWidth = Math.max(12, Number(width) || 0);
  const safeHeight = Math.max(12, Number(height) || 0);
  const cut = clamp(Number(options.cut) || Math.min(12, safeHeight * 0.58), 4, Math.min(safeWidth, safeHeight) * 0.46);
  const shadowOffsetY = Number.isFinite(options.shadowOffsetY) ? options.shadowOffsetY : 2;
  const shadowOffsetX = Number.isFinite(options.shadowOffsetX) ? options.shadowOffsetX : 0;
  const fillTop = options.fillTop || "rgba(43, 57, 79, 0.98)";
  const fillBottom = options.fillBottom || "rgba(25, 35, 52, 0.98)";
  const border = options.border || "rgba(102, 126, 155, 0.96)";
  const highlight = options.highlight || "rgba(188, 212, 237, 0.28)";
  const shadow = options.shadow || "rgba(0, 0, 0, 0.36)";
  const borderWidth = Math.max(0.75, Number(options.borderWidth) || 2);

  ctx.save();
  ctx.lineJoin = "miter";

  if (shadowOffsetX !== 0 || shadowOffsetY !== 0) {
    ctx.fillStyle = shadow;
    traceRetroHudPath(x + shadowOffsetX, y + shadowOffsetY, safeWidth, safeHeight, cut);
    ctx.fill();
  }

  const fill = ctx.createLinearGradient(x, y, x, y + safeHeight);
  fill.addColorStop(0, fillTop);
  fill.addColorStop(1, fillBottom);
  ctx.fillStyle = fill;
  traceRetroHudPath(x, y, safeWidth, safeHeight, cut);
  ctx.fill();

  ctx.strokeStyle = border;
  ctx.lineWidth = borderWidth;
  traceRetroHudPath(x, y, safeWidth, safeHeight, cut);
  ctx.stroke();

  if (highlight) {
    const inset = Math.max(1, borderWidth * 0.65);
    ctx.strokeStyle = highlight;
    ctx.lineWidth = Math.max(0.6, borderWidth * 0.5);
    traceRetroHudPath(
      x + inset,
      y + inset,
      Math.max(8, safeWidth - inset * 2),
      Math.max(8, safeHeight - inset * 2),
      Math.max(3, cut - inset * 1.6),
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawTypeIconGraphic(typeName, centerX, centerY, size, options = {}) {
  const safeSize = clamp(Number(size) || 0, 8, 56);
  const image = getTypeIconImage(typeName);
  const drawAlpha = clamp(Number(options.alpha ?? 1), 0, 1);

  ctx.save();
  ctx.globalAlpha = drawAlpha;

  if (isDrawableImage(image)) {
    const drawX = snapSpriteValue(centerX - safeSize * 0.5);
    const drawY = snapSpriteValue(centerY - safeSize * 0.5);
    const drawSize = snapSpriteDimension(safeSize);
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, drawX, drawY, drawSize, drawSize);
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
    ctx.translate(snapSpriteValue(centerX - safeSize * 0.5), snapSpriteValue(centerY - safeSize * 0.5));
    drawProjectileGlyph(ctx, normalizeType(typeName), safeSize);
  }

  ctx.restore();
}

function drawTypeIconBadge(typeName, centerX, centerY, size, options = {}) {
  const safeSize = clamp(Number(size) || 0, 14, 34);
  const outlineColor = Array.isArray(options.outlineColor) ? options.outlineColor : getTypeColor(typeName);
  const x = centerX - safeSize * 0.5;
  const y = centerY - safeSize * 0.5;
  drawRetroHudPanel(x, y, safeSize, safeSize, {
    cut: Math.max(4, safeSize * 0.28),
    fillTop: "rgba(50, 66, 89, 0.99)",
    fillBottom: "rgba(30, 42, 60, 0.99)",
    border: rgba(outlineColor, 0.78),
    highlight: "rgba(196, 218, 241, 0.3)",
    shadow: "rgba(0, 0, 0, 0.32)",
    borderWidth: Math.max(1, safeSize * 0.07),
  });

  drawTypeIconGraphic(typeName, centerX, centerY, safeSize * 0.76);
}

function drawTypeMatchupPill(anchorX, centerY, multiplier, defenderTypes, options = {}) {
  const safeDefenderTypes = Array.isArray(defenderTypes)
    ? defenderTypes.map((typeName) => normalizeType(typeName)).filter(Boolean).slice(0, 2)
    : [];
  const leadingType = normalizeType(options.typeIcon || "");
  const fontSize = clamp(Number(options.fontSize) || 0, 9, 14);
  const iconSize = clamp(Number(options.iconSize) || 0, 10, 16);
  const textPaddingX = clamp(Number(options.paddingX) || iconSize * 0.48, 4, 8);
  const textPaddingY = clamp(Number(options.paddingY) || fontSize * 0.42, 3, 7);
  const iconGap = clamp(iconSize * 0.2, 3, 5);
  const leadingGap = leadingType ? clamp(iconSize * 0.28, 3, 5) : 0;
  const contentGap = safeDefenderTypes.length > 0 ? clamp(iconSize * 0.38, 4, 8) : 0;
  const multiplierLabel = formatTypeMultiplierLabel(multiplier);
  const palette = getTypeMatchupPalette(multiplier);

  ctx.save();
  ctx.font = `700 ${fontSize}px Trebuchet MS`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const textWidth = Math.ceil(ctx.measureText(multiplierLabel).width);
  const leadingWidth = leadingType ? iconSize + leadingGap : 0;
  const iconsWidth = safeDefenderTypes.length > 0
    ? safeDefenderTypes.length * iconSize + Math.max(0, safeDefenderTypes.length - 1) * iconGap
    : 0;
  const width = textPaddingX * 2 + leadingWidth + textWidth + contentGap + iconsWidth;
  const height = Math.max(fontSize + textPaddingY * 2, iconSize + 6);
  let x =
    options.align === "center"
      ? anchorX - width * 0.5
      : options.align === "right"
        ? anchorX - width
        : anchorX;
  x = clamp(x, 8, state.viewport.width - width - 8);
  const y = clamp(centerY - height * 0.5, 8, state.viewport.height - height - 8);

  drawRetroHudPanel(x, y, width, height, {
    cut: Math.max(6, height * 0.35),
    fillTop: palette.surfaceTop,
    fillBottom: palette.surfaceBottom,
    border: palette.border,
    highlight: palette.glow,
    shadow: "rgba(78, 85, 100, 0.18)",
    borderWidth: 1.5,
  });

  ctx.shadowBlur = 0;
  ctx.fillStyle = palette.text;
  ctx.strokeStyle = "rgba(5, 10, 18, 0.72)";
  ctx.lineWidth = 2;
  let textX = x + textPaddingX;
  if (leadingType) {
    drawTypeIconBadge(leadingType, x + textPaddingX + iconSize * 0.5, y + height * 0.5, iconSize, {
      outlineColor: getTypeColor(leadingType),
    });
    textX += leadingWidth;
  }
  const textY = y + height * 0.53;
  ctx.strokeText(multiplierLabel, textX, textY);
  ctx.fillText(multiplierLabel, textX, textY);

  let iconX = textX + textWidth + contentGap;
  for (const defenderType of safeDefenderTypes) {
    drawTypeIconGraphic(defenderType, iconX + iconSize * 0.5, y + height * 0.5, iconSize);
    iconX += iconSize + iconGap;
  }
  ctx.restore();
}

function drawTeamTypeHud(member, slotIndex, slotAnchor, enemy) {
  if (!member || !slotAnchor || !enemy) {
    return;
  }
  const offensiveType = normalizeType(member.offensiveType || member.defensiveTypes?.[0] || "normal");
  const defenderTypes = Array.isArray(enemy.defensiveTypes) ? enemy.defensiveTypes : [];
  const multiplier = getTypeMultiplier(offensiveType, defenderTypes);
  const chipCenterX = Number(slotAnchor.hudCenterX || slotAnchor.x);
  const chipHeight = clamp(Number(slotAnchor.hudTypeChipHeight) || slotAnchor.size * 0.17, 11, 16);
  const chipCenterY = clamp(
    Number(slotAnchor.hudTopY || slotAnchor.y) - chipHeight * 0.74,
    chipHeight * 0.5 + 6,
    state.viewport.height - chipHeight * 0.5 - 6,
  );
  drawTypeMatchupPill(chipCenterX, chipCenterY, multiplier, [], {
    align: "center",
    typeIcon: offensiveType,
    fontSize: clamp(slotAnchor.size * 0.09, 8, 10),
    iconSize: clamp(chipHeight * 0.84, 10, 14),
    paddingX: clamp(slotAnchor.size * 0.064, 3, 5),
    paddingY: clamp(slotAnchor.size * 0.035, 2, 4),
  });
}

function drawEnemyDefensiveTypeHud(enemy, layout) {
  if (!enemy || !layout) {
    return;
  }

  const defensiveTypes = Array.isArray(enemy.defensiveTypes)
    ? enemy.defensiveTypes.map((typeName) => normalizeType(typeName)).filter(Boolean).slice(0, 2)
    : [];
  if (defensiveTypes.length <= 0) {
    return;
  }

  const iconSize = clamp(layout.enemySize * 0.12, 14, 20);
  const gap = clamp(iconSize * 0.25, 4, 6);
  const pillPaddingX = clamp(iconSize * 0.38, 5, 8);
  const pillPaddingY = clamp(iconSize * 0.18, 3, 5);
  const contentWidth = defensiveTypes.length * iconSize + Math.max(0, defensiveTypes.length - 1) * gap;
  const pillWidth = contentWidth + pillPaddingX * 2;
  const pillHeight = iconSize + pillPaddingY * 2;
  const centerY = clamp(
    Number(layout.enemyTypeHudY) || layout.hpBarY - pillHeight,
    pillHeight * 0.5 + 8,
    state.viewport.height - pillHeight * 0.5 - 8,
  );
  const x = clamp(layout.centerX - pillWidth * 0.5, 8, state.viewport.width - pillWidth - 8);
  const y = centerY - pillHeight * 0.5;
  drawRetroHudPanel(x, y, pillWidth, pillHeight, {
    cut: Math.max(6, pillHeight * 0.32),
    fillTop: "rgba(44, 62, 87, 0.98)",
    fillBottom: "rgba(27, 41, 59, 0.98)",
    border: "rgba(101, 134, 166, 0.92)",
    highlight: "rgba(181, 208, 236, 0.26)",
    shadow: "rgba(0, 0, 0, 0.34)",
    borderWidth: 1.5,
  });

  let iconCenterX = x + pillPaddingX + iconSize * 0.5;
  for (const defensiveType of defensiveTypes) {
    drawTypeIconBadge(defensiveType, iconCenterX, centerY, iconSize);
    iconCenterX += iconSize + gap;
  }
}

function drawProjectileGlyph(spriteCtx, typeName, size) {
  const mid = size * 0.5;
  const outer = size * 0.34;

  spriteCtx.save();
  spriteCtx.translate(mid, mid);
  spriteCtx.fillStyle = "rgba(255, 255, 255, 0.97)";
  spriteCtx.strokeStyle = "rgba(6, 11, 24, 0.35)";
  spriteCtx.lineWidth = Math.max(1.2, size * 0.03);

  switch (typeName) {
    case "fire": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer);
      spriteCtx.bezierCurveTo(outer * 0.6, -outer * 0.22, outer * 0.56, outer * 0.4, 0, outer * 0.86);
      spriteCtx.bezierCurveTo(-outer * 0.6, outer * 0.4, -outer * 0.62, -outer * 0.22, 0, -outer);
      spriteCtx.fill();
      break;
    }
    case "water": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer);
      spriteCtx.quadraticCurveTo(outer * 0.88, -outer * 0.1, outer * 0.34, outer * 0.58);
      spriteCtx.quadraticCurveTo(0, outer * 0.92, -outer * 0.34, outer * 0.58);
      spriteCtx.quadraticCurveTo(-outer * 0.88, -outer * 0.1, 0, -outer);
      spriteCtx.fill();
      break;
    }
    case "grass": {
      spriteCtx.beginPath();
      spriteCtx.ellipse(0, 0, outer * 0.86, outer * 0.56, -0.68, 0, Math.PI * 2);
      spriteCtx.fill();
      spriteCtx.strokeStyle = "rgba(6, 11, 24, 0.26)";
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.56, outer * 0.36);
      spriteCtx.lineTo(outer * 0.52, -outer * 0.32);
      spriteCtx.stroke();
      break;
    }
    case "electric": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.28, -outer * 0.82);
      spriteCtx.lineTo(outer * 0.1, -outer * 0.14);
      spriteCtx.lineTo(-outer * 0.06, -outer * 0.14);
      spriteCtx.lineTo(outer * 0.29, outer * 0.84);
      spriteCtx.lineTo(-outer * 0.12, outer * 0.14);
      spriteCtx.lineTo(outer * 0.08, outer * 0.14);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "ice": {
      spriteCtx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      spriteCtx.lineWidth = Math.max(1.8, size * 0.045);
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI / 3) * i;
        const dx = Math.cos(angle) * outer * 0.84;
        const dy = Math.sin(angle) * outer * 0.84;
        spriteCtx.beginPath();
        spriteCtx.moveTo(-dx, -dy);
        spriteCtx.lineTo(dx, dy);
        spriteCtx.stroke();
      }
      break;
    }
    case "psychic": {
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.82, 0, Math.PI * 2);
      spriteCtx.stroke();
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.38, 0, Math.PI * 2);
      spriteCtx.fill();
      break;
    }
    case "dragon": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.86);
      for (let i = 1; i < 8; i += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 8;
        const r = i % 2 === 0 ? outer * 0.85 : outer * 0.38;
        spriteCtx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "dark": {
      spriteCtx.beginPath();
      spriteCtx.arc(-outer * 0.12, 0, outer * 0.78, -Math.PI * 0.86, Math.PI * 0.86);
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "destination-out";
      spriteCtx.beginPath();
      spriteCtx.arc(outer * 0.28, -outer * 0.06, outer * 0.72, -Math.PI * 0.95, Math.PI * 0.95);
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "source-over";
      break;
    }
    case "fighting": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.88);
      spriteCtx.lineTo(outer * 0.28, -outer * 0.2);
      spriteCtx.lineTo(outer * 0.88, 0);
      spriteCtx.lineTo(outer * 0.28, outer * 0.2);
      spriteCtx.lineTo(0, outer * 0.88);
      spriteCtx.lineTo(-outer * 0.28, outer * 0.2);
      spriteCtx.lineTo(-outer * 0.88, 0);
      spriteCtx.lineTo(-outer * 0.28, -outer * 0.2);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "poison": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.9);
      spriteCtx.lineTo(outer * 0.82, 0);
      spriteCtx.lineTo(0, outer * 0.9);
      spriteCtx.lineTo(-outer * 0.82, 0);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "ground":
    case "rock": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.9, outer * 0.22);
      spriteCtx.lineTo(-outer * 0.4, -outer * 0.8);
      spriteCtx.lineTo(outer * 0.2, -outer * 0.62);
      spriteCtx.lineTo(outer * 0.84, -outer * 0.08);
      spriteCtx.lineTo(outer * 0.32, outer * 0.84);
      spriteCtx.lineTo(-outer * 0.62, outer * 0.64);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "flying": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.94, outer * 0.12);
      spriteCtx.quadraticCurveTo(-outer * 0.1, -outer * 0.84, outer * 0.94, outer * 0.12);
      spriteCtx.quadraticCurveTo(0, -outer * 0.2, -outer * 0.94, outer * 0.12);
      spriteCtx.fill();
      break;
    }
    case "bug": {
      spriteCtx.beginPath();
      spriteCtx.ellipse(0, 0, outer * 0.5, outer * 0.72, 0, 0, Math.PI * 2);
      spriteCtx.fill();
      for (const dir of [-1, 1]) {
        spriteCtx.beginPath();
        spriteCtx.moveTo(dir * outer * 0.3, -outer * 0.24);
        spriteCtx.lineTo(dir * outer * 0.86, -outer * 0.62);
        spriteCtx.moveTo(dir * outer * 0.38, 0);
        spriteCtx.lineTo(dir * outer * 0.96, 0);
        spriteCtx.moveTo(dir * outer * 0.32, outer * 0.26);
        spriteCtx.lineTo(dir * outer * 0.86, outer * 0.62);
        spriteCtx.stroke();
      }
      break;
    }
    case "ghost": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.72, outer * 0.56);
      spriteCtx.lineTo(-outer * 0.72, -outer * 0.1);
      spriteCtx.quadraticCurveTo(-outer * 0.72, -outer * 0.86, 0, -outer * 0.86);
      spriteCtx.quadraticCurveTo(outer * 0.72, -outer * 0.86, outer * 0.72, -outer * 0.1);
      spriteCtx.lineTo(outer * 0.72, outer * 0.56);
      spriteCtx.lineTo(outer * 0.38, outer * 0.34);
      spriteCtx.lineTo(0, outer * 0.58);
      spriteCtx.lineTo(-outer * 0.34, outer * 0.34);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "steel": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.92);
      spriteCtx.lineTo(outer * 0.8, -outer * 0.34);
      spriteCtx.lineTo(outer * 0.8, outer * 0.34);
      spriteCtx.lineTo(0, outer * 0.92);
      spriteCtx.lineTo(-outer * 0.8, outer * 0.34);
      spriteCtx.lineTo(-outer * 0.8, -outer * 0.34);
      spriteCtx.closePath();
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "destination-out";
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.3, 0, Math.PI * 2);
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "source-over";
      break;
    }
    case "fairy": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.9);
      for (let i = 1; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
        const r = i % 2 === 0 ? outer * 0.9 : outer * 0.42;
        spriteCtx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    default: {
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.72, 0, Math.PI * 2);
      spriteCtx.fill();
      break;
    }
  }

  spriteCtx.restore();
}

function createProjectileSprite(typeName) {
  const type = normalizeType(typeName);
  const size = PROJECTILE_SPRITE_PX;
  const rgb = getTypeColor(type);
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const spriteCtx = sprite.getContext("2d");
  if (!spriteCtx) {
    return null;
  }

  const mid = size * 0.5;
  const aura = spriteCtx.createRadialGradient(mid, mid, size * 0.08, mid, mid, size * 0.5);
  aura.addColorStop(0, rgba(rgb, 0.98));
  aura.addColorStop(0.4, rgba(rgb, 0.5));
  aura.addColorStop(1, rgba(rgb, 0));

  spriteCtx.fillStyle = aura;
  spriteCtx.beginPath();
  spriteCtx.arc(mid, mid, size * 0.5, 0, Math.PI * 2);
  spriteCtx.fill();

  spriteCtx.fillStyle = rgba(rgb, 0.86);
  spriteCtx.beginPath();
  spriteCtx.arc(mid, mid, size * 0.34, 0, Math.PI * 2);
  spriteCtx.fill();

  spriteCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  spriteCtx.lineWidth = Math.max(1.2, size * 0.022);
  spriteCtx.beginPath();
  spriteCtx.arc(mid, mid, size * 0.35, 0, Math.PI * 2);
  spriteCtx.stroke();

  drawProjectileGlyph(spriteCtx, type, size);

  spriteCtx.fillStyle = "rgba(255, 255, 255, 0.36)";
  spriteCtx.beginPath();
  spriteCtx.ellipse(size * 0.38, size * 0.3, size * 0.12, size * 0.07, -0.38, 0, Math.PI * 2);
  spriteCtx.fill();

  return sprite;
}

function getProjectileSprite(typeName) {
  const type = normalizeType(typeName);
  if (projectileSpriteCache.has(type)) {
    return projectileSpriteCache.get(type);
  }
  const sprite = createProjectileSprite(type);
  projectileSpriteCache.set(type, sprite);
  return sprite;
}

class PokemonBattleManager {
  constructor({
    team,
    attackIntervalMs,
    getAttackIntervalMs,
    respawnDelayMs = KO_RESPAWN_DELAY_MS,
    createEnemy,
    onEnemySpawn,
    onEnemyDefeated,
    getEnemyTimerConfig,
    onEnemyTimerExpired,
  }) {
    this.team = Array.isArray(team) ? team : [];
    this.attackIntervalMs = attackIntervalMs;
    this.getAttackIntervalMs = typeof getAttackIntervalMs === "function" ? getAttackIntervalMs : null;
    this.enemyRespawnDelayMs = respawnDelayMs;
    this.createEnemy = typeof createEnemy === "function" ? createEnemy : () => null;
    this.onEnemySpawn = typeof onEnemySpawn === "function" ? onEnemySpawn : () => {};
    this.onEnemyDefeated = typeof onEnemyDefeated === "function" ? onEnemyDefeated : () => {};
    this.getEnemyTimerConfig =
      typeof getEnemyTimerConfig === "function"
        ? getEnemyTimerConfig
        : () => ({ enabled: false, style: ENEMY_TIMER_STYLE_ROUTE });
    this.onEnemyTimerExpired = typeof onEnemyTimerExpired === "function" ? onEnemyTimerExpired : () => {};
    this.turnIndex = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.hitEffects = [];
    this.enemyHitPulseMs = 0;
    this.enemyDamageFlashMs = 0;
    this.lastImpact = null;
    this.lastTurnEvent = null;
    this.enemiesDefeated = 0;
    this.attackTimerMs = attackIntervalMs;
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.slotRecoil = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.slotAttackFlash = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.enemyTimerEnabled = false;
    this.enemyTimerDurationMs = 0;
    this.enemyTimerMs = 0;
    this.enemyTimerStyle = ENEMY_TIMER_STYLE_ROUTE;
    this.enemy = null;
    this.pendingEnemyDamage = 0;
    this.enemyDefeatReserved = false;
    this.enemyDefeatReservedBySlot = -1;
    this.spawnEnemy();
  }

  getEffectiveAttackIntervalMs() {
    const dynamicValue = this.getAttackIntervalMs ? Number(this.getAttackIntervalMs()) : NaN;
    if (Number.isFinite(dynamicValue) && dynamicValue > 0) {
      return dynamicValue;
    }
    return this.attackIntervalMs;
  }

  setAttackInterval(nextIntervalMs) {
    const nextInterval = Math.max(65, toSafeInt(nextIntervalMs, ATTACK_INTERVAL_MS));
    const prevInterval = Math.max(65, toSafeInt(this.attackIntervalMs, ATTACK_INTERVAL_MS));
    const timer = Number(this.attackTimerMs);
    if (!Number.isFinite(timer)) {
      this.attackIntervalMs = nextInterval;
      this.attackTimerMs = nextInterval;
      return;
    }
    if (Math.abs(nextInterval - prevInterval) > 0.01) {
      const remainingRatio = clamp(timer / prevInterval, 0, 1);
      this.attackTimerMs = nextInterval * remainingRatio;
    }
    this.attackIntervalMs = nextInterval;
  }

  syncTeam(team) {
    this.team = Array.isArray(team) ? team : [];
    this.turnIndex = this.team.length === 0 ? 0 : this.turnIndex % MAX_TEAM_SIZE;
  }

  getEnemy() {
    return this.enemy;
  }

  getProjectiles() {
    return this.projectiles;
  }

  getFloatingTexts() {
    return this.floatingTexts;
  }

  getHitEffects() {
    return this.hitEffects;
  }

  getEnemyHitPulseRatio() {
    return clamp(this.enemyHitPulseMs / 120, 0, 1);
  }

  isEnemyRespawning() {
    return this.pendingRespawnMs > 0;
  }

  getEnemyTimerConfigSnapshot() {
    const raw = this.getEnemyTimerConfig ? this.getEnemyTimerConfig(this.enemy) : null;
    const enabled = Boolean(raw?.enabled);
    const durationMs = enabled ? Math.max(1000, toSafeInt(raw?.durationMs, ROUTE_DEFEAT_TIMER_MS)) : 0;
    const style = raw?.style === ENEMY_TIMER_STYLE_ONLY_ONE ? ENEMY_TIMER_STYLE_ONLY_ONE : ENEMY_TIMER_STYLE_ROUTE;
    return { enabled, durationMs, style };
  }

  resetEnemyTimer() {
    const config = this.getEnemyTimerConfigSnapshot();
    this.enemyTimerEnabled = config.enabled;
    this.enemyTimerDurationMs = config.durationMs;
    this.enemyTimerMs = config.enabled ? config.durationMs : 0;
    this.enemyTimerStyle = config.style;
  }

  isEnemyTimerRunning() {
    return this.enemyTimerEnabled && Boolean(this.enemy) && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning();
  }

  getEnemyTimerState() {
    const durationMs = Math.max(0, toSafeInt(this.enemyTimerDurationMs, 0));
    const remainingMs = Math.max(0, Number(this.enemyTimerMs) || 0);
    const remainingRatio = durationMs > 0 ? clamp(remainingMs / durationMs, 0, 1) : 0;
    return {
      enabled: this.enemyTimerEnabled,
      running: this.isEnemyTimerRunning(),
      style: this.enemyTimerStyle,
      duration_ms: Math.round(durationMs),
      remaining_ms: Math.round(remainingMs),
      remaining_ratio: Math.round(remainingRatio * 1000) / 1000,
    };
  }

  advanceEnemyTimer(deltaMs) {
    if (!this.isEnemyTimerRunning()) {
      return;
    }
    this.enemyTimerMs = Math.max(0, this.enemyTimerMs - Math.max(0, Number(deltaMs) || 0));
  }

  expireEnemyFromTimer() {
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }
    const expiredEnemy = this.enemy;
    this.projectiles = [];
    this.floatingTexts = [];
    this.hitEffects = [];
    this.enemyHitPulseMs = 0;
    this.enemyDamageFlashMs = 0;
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.resetQueuedAttackState();
    this.lastImpact = null;
    this.lastTurnEvent = null;
    try {
      this.onEnemyTimerExpired(expiredEnemy);
    } catch {
      // Ignore callback failures and continue the combat loop.
    }
    this.spawnEnemy();
  }

  buildCaptureTotalMs(captured) {
    if (captured) {
      return CAPTURE_THROW_MS + CAPTURE_SHAKE_MS + CAPTURE_SUCCESS_BURST_MS + CAPTURE_POST_MS;
    }
    return CAPTURE_THROW_MS + CAPTURE_SHAKE_MS + CAPTURE_FAIL_BREAK_MS + CAPTURE_FAIL_REAPPEAR_MS + CAPTURE_POST_MS;
  }

  getCaptureSequencePhase(sequence = this.captureSequence) {
    if (!sequence) {
      return null;
    }

    const elapsed = sequence.elapsedMs;
    const shakeEnd = CAPTURE_THROW_MS + CAPTURE_SHAKE_MS;

    if (elapsed < CAPTURE_THROW_MS) {
      return "throw";
    }
    if (elapsed < shakeEnd) {
      return "shake";
    }

    if (sequence.captured) {
      return elapsed < shakeEnd + CAPTURE_SUCCESS_BURST_MS ? "success" : "post";
    }

    const breakEnd = shakeEnd + CAPTURE_FAIL_BREAK_MS;
    if (elapsed < breakEnd) {
      return "break";
    }
    return elapsed < breakEnd + CAPTURE_FAIL_REAPPEAR_MS ? "reappear" : "post";
  }

  getCaptureSequence() {
    if (!this.captureSequence) {
      return null;
    }
    const chanceDisplay = Number(this.captureSequence.chanceDisplay);
    const ballType = normalizeBallTypeForVisual(this.captureSequence.ballType);
    return {
      phase: this.getCaptureSequencePhase(),
      captured: this.captureSequence.captured,
      critical: Boolean(this.captureSequence.isCritical),
      ball_type: ballType,
      chance_display: Number.isFinite(chanceDisplay) ? Math.round(clamp(chanceDisplay, 0, 1) * 10000) / 10000 : null,
      elapsed_ms: Math.round(this.captureSequence.elapsedMs),
      total_ms: Math.round(this.captureSequence.totalMs),
      remaining_ms: Math.max(0, Math.round(this.captureSequence.totalMs - this.captureSequence.elapsedMs)),
    };
  }

  getCaptureSequenceState() {
    return this.captureSequence;
  }

  getEnemyImpactPoint(layout) {
    const fallbackX = Number(layout?.centerX) || 0;
    const fallbackY = Number(layout?.centerY) || 0;
    const x = Number(layout?.enemyImpactX);
    const y = Number(layout?.enemyImpactY);
    return {
      x: Number.isFinite(x) ? x : fallbackX,
      y: Number.isFinite(y) ? y : fallbackY,
    };
  }

  resetQueuedAttackState() {
    this.pendingEnemyDamage = 0;
    this.enemyDefeatReserved = false;
    this.enemyDefeatReservedBySlot = -1;
  }

  isEnemyDefeatReserved() {
    return Boolean(this.enemyDefeatReserved) && Boolean(this.enemy) && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning();
  }

  consumeQueuedProjectileDamage(projectile) {
    const plannedDamage = Math.max(0, Number(projectile?.plannedDamage) || 0);
    if (plannedDamage > 0) {
      this.pendingEnemyDamage = Math.max(0, this.pendingEnemyDamage - plannedDamage);
    }
    if (projectile?.reservesDefeat) {
      this.enemyDefeatReserved = false;
      this.enemyDefeatReservedBySlot = -1;
    }
  }

  buildPrecomputedHitOutcome(attackerIndex, attacker, attackType) {
    const resolvedType = String(attackType || attacker?.offensiveType || attacker?.defensiveTypes?.[0] || "normal");
    if (!attacker || !this.enemy || this.enemy.hpCurrent <= 0) {
      return {
        attackType: resolvedType,
        missed: false,
        typeMultiplier: 1,
        isCritical: false,
        damage: 0,
        teamAuraAttackBonus: 0,
      };
    }

    const cannotMiss = hasAlwaysHitTalent(attacker?.talent, attacker?.id);
    const missed = !cannotMiss && Math.random() < ATTACK_MISS_CHANCE;
    if (missed) {
      return {
        attackType: resolvedType,
        missed: true,
        typeMultiplier: 1,
        isCritical: false,
        damage: 0,
        teamAuraAttackBonus: 0,
      };
    }

    const typeMultiplier = getTypeMultiplier(resolvedType, this.enemy.defensiveTypes);
    const critChanceBonus = getTalentCritBonusChance(attacker?.talent, attacker?.id);
    const teamAuraAttackBonus = this.getTeamAuraAttackBonusForAttacker(attackerIndex, attacker);
    const damageOutcome = computeDamage(attacker, this.enemy, resolvedType, typeMultiplier, {
      critChanceBonus,
      damageMultiplier: 1 + teamAuraAttackBonus,
    });
    const baseDamage = Math.max(0, Number(damageOutcome?.damage || 0));
    const damage = baseDamage <= 0 ? 0 : Math.max(1, Math.round(baseDamage));

    return {
      attackType: resolvedType,
      missed: false,
      typeMultiplier,
      isCritical: Boolean(damageOutcome?.isCritical),
      damage,
      teamAuraAttackBonus,
    };
  }

  consumeTurnSlot() {
    const slotIndex = ((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    const attacker = this.team[slotIndex] || null;
    this.turnIndex = (slotIndex + 1) % MAX_TEAM_SIZE;
    return { slotIndex, attacker };
  }

  resolveTurnDecisionForSlot(slotIndex, attacker = this.team[slotIndex] || null) {
    const decision = resolveCombatTurnDecision({
      attacker,
      enemy: this.enemy,
    });
    const talentId = normalizeTalentId(decision.talentId || attacker?.talent?.id || TALENT_NONE_ID);
    return {
      action: decision.action,
      reason: decision.reason,
      talentId,
      passiveBehaviorId: String(decision.passiveBehaviorId || getPassiveBehaviorIdForTalentId(talentId)),
    };
  }

  getRandomAllySlotIndex(attackerIndex, options = {}) {
    const requireAttackReady = Boolean(options.requireAttackReady);
    const candidates = [];
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      if (i === attackerIndex) {
        continue;
      }
      const ally = this.team[i];
      if (!ally) {
        continue;
      }
      if (requireAttackReady) {
        const allyDecision = this.resolveTurnDecisionForSlot(i, ally);
        if (allyDecision.action !== TURN_ACTION_ATTACK) {
          continue;
        }
      }
      candidates.push(i);
    }
    if (candidates.length <= 0) {
      return -1;
    }
    const pickIndex = randomInt(0, candidates.length - 1);
    return candidates[pickIndex];
  }

  resolveAttackTypeForAttacker(attackerIndex, attacker = this.team[attackerIndex] || null) {
    const defaultType = attacker?.offensiveType || attacker?.defensiveTypes?.[0] || "normal";
    if (!attacker) {
      return String(defaultType || "normal");
    }
    const talentId = getEntityTalentId(attacker, attacker?.id);
    if (talentId !== TALENT_ORIGIN_MIMICRY_ID) {
      return String(defaultType || "normal");
    }
    const allyIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: false });
    if (allyIndex < 0) {
      return String(defaultType || "normal");
    }
    const ally = this.team[allyIndex];
    const copiedType = ally?.offensiveType || ally?.defensiveTypes?.[0] || defaultType;
    return String(copiedType || defaultType || "normal");
  }

  getTeamAuraAttackBonusForAttacker(attackerIndex, attacker = this.team[attackerIndex] || null) {
    if (!attacker) {
      return 0;
    }
    return getStackedTeamAuraAttackBonus(this.team, attackerIndex, getEntityOffensiveType(attacker));
  }

  recordTurnEvent(slotIndex, attacker, decision, overrides = {}) {
    const talentId = normalizeTalentId(decision?.talentId || attacker?.talent?.id || TALENT_NONE_ID);
    this.lastTurnEvent = {
      slot_index: slotIndex,
      attacker_name_fr: attacker?.nameFr || null,
      action: String(decision?.action || "skip"),
      reason: String(decision?.reason || "unknown"),
      talent_id: talentId,
      passive_behavior_id: String(decision?.passiveBehaviorId || getPassiveBehaviorIdForTalentId(talentId)),
      ...overrides,
    };
  }

  getLastTurnEvent() {
    return this.lastTurnEvent ? { ...this.lastTurnEvent } : null;
  }

  getNextTurnPreview() {
    const nextOccupied = this.getNextOccupiedSlotInfo();
    if (!nextOccupied) {
      return null;
    }
    const attacker = this.team[nextOccupied.slotIndex] || null;
    const decision = this.resolveTurnDecisionForSlot(nextOccupied.slotIndex, attacker);
    return {
      slot_index: nextOccupied.slotIndex,
      skipped_empty_slots: nextOccupied.skippedEmptySlots,
      attacker_name_fr: attacker?.nameFr || null,
      action: decision.action,
      reason: decision.reason,
      talent_id: decision.talentId,
      passive_behavior_id: decision.passiveBehaviorId,
    };
  }

  getNextOccupiedSlotInfo() {
    const baseSlotIndex = ((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    for (let offset = 0; offset < MAX_TEAM_SIZE; offset += 1) {
      const slotIndex = (baseSlotIndex + offset) % MAX_TEAM_SIZE;
      if (this.team[slotIndex]) {
        return {
          slotIndex,
          skippedEmptySlots: offset,
        };
      }
    }
    return null;
  }

  getNextAttackSlotTimeline() {
    const preview = this.getNextTurnPreview();
    if (!preview) {
      return null;
    }
    const interval = Math.max(1, this.attackIntervalMs);
    const normalizedTimer = ((this.attackTimerMs % interval) + interval) % interval;
    const progressToNextAttack = 1 - normalizedTimer / interval;
    const canAttack = preview.action === TURN_ACTION_ATTACK;
    const timeUntilAttackMs = normalizedTimer + preview.skipped_empty_slots * interval;
    return {
      preview,
      interval,
      normalizedTimer,
      progressToNextAttack,
      canAttack,
      timeUntilAttackMs: Math.max(0, timeUntilAttackMs),
    };
  }

  getTurnIndicator(layout) {
    const slots = layout?.teamSlots;
    if (!Array.isArray(slots) || slots.length < MAX_TEAM_SIZE) {
      return null;
    }

    const timeline = this.getNextAttackSlotTimeline();
    if (!timeline) {
      return null;
    }

    const nextAttackSlotIndex = timeline.preview.slot_index;
    const slot = slots[nextAttackSlotIndex];
    if (!slot) {
      return null;
    }

    return {
      slot_index: nextAttackSlotIndex,
      x: slot.x,
      y: slot.y + slot.size * 0.34,
      radius: clamp(slot.size * 0.3, 19, 34),
      has_pokemon: true,
      can_attack: timeline.canAttack,
      next_turn_action: timeline.preview.action,
      next_turn_reason: timeline.preview.reason,
      passive_behavior_id: timeline.preview.passive_behavior_id,
      progress_to_next_attack: Math.round(clamp(timeline.progressToNextAttack, 0, 1) * 1000) / 1000,
      time_until_attack_ms: Math.round(timeline.timeUntilAttackMs),
    };
  }

  getSlotChargeGlow(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (
      safeSlotIndex < 0
      || !this.enemy
      || this.enemy.hpCurrent <= 0
      || this.isEnemyRespawning()
    ) {
      return 0;
    }

    const timeline = this.getNextAttackSlotTimeline();
    if (!timeline || !timeline.canAttack || timeline.preview.slot_index !== safeSlotIndex) {
      return 0;
    }

    const chargeWindowMs = Math.min(
      Math.max(ATTACK_CHARGE_MIN_WINDOW_MS, timeline.interval * ATTACK_CHARGE_WINDOW_RATIO),
      Math.max(ATTACK_CHARGE_MIN_WINDOW_MS, timeline.interval - 12),
    );
    const timeUntilAttackMs = Math.max(0, timeline.timeUntilAttackMs);
    if (timeUntilAttackMs > chargeWindowMs) {
      return 0;
    }

    const ratio = clamp(1 - timeUntilAttackMs / Math.max(1, chargeWindowMs), 0, 1);
    const pulse = 0.84 + Math.sin((chargeWindowMs - timeUntilAttackMs) * 0.022 + safeSlotIndex * 0.7) * 0.16;
    return clamp(ratio * pulse, 0, 1);
  }

  getSlotRecoilOffset(slotIndex, layout) {
    const slot = layout?.teamSlots?.[slotIndex];
    const recoil = this.slotRecoil[slotIndex];
    if (!slot || !recoil) {
      return { x: 0, y: 0 };
    }

    const dx = slot.x - layout.centerX;
    const dy = slot.y - layout.centerY;
    const length = Math.hypot(dx, dy) || 1;
    const ratio = clamp(recoil.elapsedMs / Math.max(1, recoil.durationMs), 0, 1);
    const curve = Math.sin(Math.PI * ratio) * (1 - ratio * 0.55);
    const distance = (4 + slot.size * 0.07) * curve * recoil.strength;
    return {
      x: (dx / length) * distance,
      y: (dy / length) * distance,
    };
  }

  updateSlotRecoil(deltaMs) {
    for (let i = 0; i < this.slotRecoil.length; i += 1) {
      const recoil = this.slotRecoil[i];
      if (!recoil) {
        continue;
      }
      recoil.elapsedMs += deltaMs;
      if (recoil.elapsedMs >= recoil.durationMs) {
        this.slotRecoil[i] = null;
      }
    }
  }

  triggerSlotRecoil(slotIndex) {
    this.slotRecoil[slotIndex] = {
      elapsedMs: 0,
      durationMs: 240,
      strength: 1 + Math.random() * 0.18,
    };
  }

  updateSlotAttackFlash(deltaMs) {
    for (let i = 0; i < this.slotAttackFlash.length; i += 1) {
      const flash = this.slotAttackFlash[i];
      if (!flash) {
        continue;
      }
      flash.elapsedMs += deltaMs;
      if (flash.elapsedMs >= flash.durationMs) {
        this.slotAttackFlash[i] = null;
      }
    }
  }

  triggerSlotAttackFlash(slotIndex) {
    this.slotAttackFlash[slotIndex] = {
      elapsedMs: 0,
      durationMs: ATTACK_FLASH_DURATION_MS,
    };
  }

  getSlotAttackFlashBlend(slotIndex) {
    const flash = this.slotAttackFlash[slotIndex];
    if (!flash) {
      return 0;
    }
    const ratio = clamp(1 - flash.elapsedMs / Math.max(1, flash.durationMs), 0, 1);
    return ATTACK_FLASH_WHITE_BLEND * ratio;
  }

  getEnemyDamageFlashBlend() {
    if (this.enemyDamageFlashMs <= 0) {
      return 0;
    }
    const ratio = clamp(this.enemyDamageFlashMs / Math.max(1, ENEMY_DAMAGE_FLASH_DURATION_MS), 0, 1);
    return ENEMY_DAMAGE_FLASH_RED_BLEND * ratio;
  }

  getKoTransition() {
    const captureTotal = this.captureSequence?.totalMs || this.enemyRespawnDelayMs;
    return {
      active: this.isEnemyRespawning(),
      enemy_name_fr: this.defeatedEnemyName,
      remaining_ms: Math.max(0, Math.round(this.pendingRespawnMs)),
      total_ms: Math.round(captureTotal),
      shrink_active: this.koAnimMs > 0,
      shrink_progress: clamp(1 - this.koAnimMs / Math.max(1, KO_ANIMATION_DURATION_MS), 0, 1),
    };
  }

  getNextAttackerName() {
    return this.getNextTurnPreview()?.attacker_name_fr || null;
  }

  flushRespawnForIdleMode() {
    if (this.pendingRespawnMs > 0 || this.captureSequence || (this.enemy && this.enemy.hpCurrent <= 0)) {
      const completedCapture = this.captureSequence;
      if (completedCapture && typeof completedCapture.onComplete === "function" && !completedCapture.onCompleteExecuted) {
        completedCapture.onCompleteExecuted = true;
        try {
          completedCapture.onComplete();
        } catch {
          // Ignore reward callback failures and continue the combat loop.
        }
      }
      this.pendingRespawnMs = 0;
      this.captureSequence = null;
      this.koAnimMs = 0;
      this.resetQueuedAttackState();
      this.projectiles = [];
      this.floatingTexts = [];
      this.hitEffects = [];
      this.enemyHitPulseMs = 0;
      this.enemyDamageFlashMs = 0;
      this.lastTurnEvent = null;
      if (!this.enemy || this.enemy.hpCurrent <= 0) {
        this.spawnEnemy();
      }
    }
  }

  simulateAttackTickInstant(layout) {
    const turn = this.consumeTurnSlot();
    const attackerIndex = turn.slotIndex;
    const attacker = turn.attacker;
    const decision = this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    this.recordTurnEvent(attackerIndex, attacker, decision);
    if (decision.action !== TURN_ACTION_ATTACK) {
      return;
    }

    const attackType = this.resolveAttackTypeForAttacker(attackerIndex, attacker);
    const impactPoint = this.getEnemyImpactPoint(layout);
    const queuedHits = [
      {
        attackType,
        attackerIndex,
        attackerNameFr: attacker.nameFr,
        targetX: impactPoint.x,
        targetY: impactPoint.y,
        suppressTurnEvent: false,
      },
    ];
    if (decision.talentId === TALENT_MIND_CONTROL_ID) {
      const supportSlotIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: true });
      const supportAttacker = supportSlotIndex >= 0 ? this.team[supportSlotIndex] : null;
      if (supportAttacker) {
        queuedHits.push({
          attackType: this.resolveAttackTypeForAttacker(supportSlotIndex, supportAttacker),
          attackerIndex: supportSlotIndex,
          attackerNameFr: supportAttacker.nameFr,
          targetX: impactPoint.x,
          targetY: impactPoint.y,
          suppressTurnEvent: true,
        });
      }
    }
    for (const hit of queuedHits) {
      this.applyHit(
        {
          attackType: hit.attackType,
          attackerIndex: hit.attackerIndex,
          attackerNameFr: hit.attackerNameFr,
          targetX: hit.targetX,
          targetY: hit.targetY,
        },
        {
          idleMode: true,
          suppressTurnEvent: hit.suppressTurnEvent,
        },
      );
    }
  }

  updateIdleCombat(deltaMs, layout) {
    let remainingMs = Math.max(0, Number(deltaMs) || 0);
    let safety = 0;
    const safetyMax = Math.max(24, Math.ceil(remainingMs / Math.max(1, Math.min(this.attackIntervalMs, 250))) + 24);

    while (remainingMs > 0.01 && safety < safetyMax) {
      this.flushRespawnForIdleMode();
      if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
        break;
      }

      const timeToAttack = Math.max(0, Number(this.attackTimerMs) || 0);
      const timerRunning = this.isEnemyTimerRunning();
      const timeToTimeout = timerRunning ? Math.max(0, Number(this.enemyTimerMs) || 0) : Number.POSITIVE_INFINITY;
      let advanceMs = remainingMs;
      if (timeToAttack <= 0) {
        advanceMs = 0;
      } else {
        advanceMs = Math.min(advanceMs, timeToAttack);
      }
      if (timerRunning) {
        if (timeToTimeout <= 0) {
          advanceMs = 0;
        } else {
          advanceMs = Math.min(advanceMs, timeToTimeout);
        }
      }

      if (advanceMs > 0) {
        this.attackTimerMs -= advanceMs;
        this.advanceEnemyTimer(advanceMs);
        remainingMs -= advanceMs;
      }

      let eventHandled = false;
      if (this.attackTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        this.simulateAttackTickInstant(layout);
        this.attackTimerMs += this.attackIntervalMs;
        eventHandled = true;
      }
      if (this.isEnemyTimerRunning() && this.enemyTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        this.expireEnemyFromTimer();
        eventHandled = true;
      }

      safety += 1;
      if (!eventHandled && advanceMs <= 0) {
        break;
      }
    }
  }

  update(deltaMs, layout, options = {}) {
    const idleMode = Boolean(options.idleMode);
    this.setAttackInterval(this.getEffectiveAttackIntervalMs());
    this.updateFloatingTexts(deltaMs);
    this.updateHitEffects(deltaMs);
    this.updateKoTransition(deltaMs);
    this.updateSlotRecoil(deltaMs);
    this.updateSlotAttackFlash(deltaMs);
    if (!layout) {
      return;
    }

    if (idleMode) {
      this.resetQueuedAttackState();
      this.updateIdleCombat(deltaMs, layout);
      this.projectiles = [];
      this.floatingTexts = [];
      this.hitEffects = [];
      this.enemyHitPulseMs = 0;
      this.enemyDamageFlashMs = 0;
      return;
    }

    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    this.advanceEnemyTimer(deltaMs);
    this.attackTimerMs -= deltaMs;
    while (this.attackTimerMs <= 0) {
      if (this.isEnemyDefeatReserved()) {
        this.attackTimerMs = 0;
        break;
      }
      this.spawnNextProjectile(layout);
      this.attackTimerMs += this.attackIntervalMs;
    }

    this.updateProjectiles(deltaMs, layout);
    if (this.isEnemyTimerRunning() && this.enemyTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0) {
      this.expireEnemyFromTimer();
    }
  }

  updateKoTransition(deltaMs) {
    if (this.koAnimMs > 0) {
      this.koAnimMs = Math.max(0, this.koAnimMs - deltaMs);
    }
    this.updateCaptureSequence(deltaMs);

    if (this.pendingRespawnMs <= 0) {
      return;
    }

    this.pendingRespawnMs = Math.max(0, this.pendingRespawnMs - deltaMs);
    if (this.pendingRespawnMs === 0) {
      const completedCapture = this.captureSequence;
      if (completedCapture && typeof completedCapture.onComplete === "function" && !completedCapture.onCompleteExecuted) {
        completedCapture.onCompleteExecuted = true;
        try {
          completedCapture.onComplete();
        } catch {
          // Ignore reward callback failures and continue the combat loop.
        }
      }
      this.captureSequence = null;
      this.spawnEnemy();
    }
  }

  updateCaptureSequence(deltaMs) {
    const sequence = this.captureSequence;
    if (!sequence) {
      return;
    }
    const isCritical = Boolean(sequence.isCritical);
    const celebrationParticles = shouldRenderCelebrationParticles();
    const ballTheme = getBallRenderTheme(sequence.ballType);

    sequence.elapsedMs = Math.min(sequence.totalMs, sequence.elapsedMs + deltaMs);
    const shakeEnd = CAPTURE_THROW_MS + CAPTURE_SHAKE_MS;

    if (sequence.captured && !sequence.burstSpawned && sequence.elapsedMs >= shakeEnd) {
      sequence.burstSpawned = true;
      const count = celebrationParticles ? (isCritical ? 24 : 14) : 0;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = (isCritical ? 120 : 90) + Math.random() * (isCritical ? 190 : 150);
        const lifeMs = (isCritical ? 360 : 320) + Math.random() * (isCritical ? 460 : 380);
        const colorPool = isCritical ? ballTheme.criticalSuccessColors : ballTheme.successColors;
        const color = colorPool[i % colorPool.length] || [255, 255, 255];
        sequence.particles.push({
          kind: "success",
          x: sequence.targetX,
          y: sequence.targetY + 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 16,
          size: 1.8 + Math.random() * 2.6,
          lifeMs,
          maxLifeMs: lifeMs,
          color,
        });
      }
    }

    if (!sequence.captured && !sequence.breakSpawned && sequence.elapsedMs >= shakeEnd) {
      sequence.breakSpawned = true;
      const pieces = celebrationParticles ? 10 : 0;
      for (let i = 0; i < pieces; i += 1) {
        const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.42;
        const speed = 60 + Math.random() * 170;
        const lifeMs = 260 + Math.random() * 240;
        sequence.particles.push({
          kind: "break",
          x: sequence.targetX,
          y: sequence.targetY + 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 28,
          size: 2 + Math.random() * 2.7,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 9,
          lifeMs,
          maxLifeMs: lifeMs,
          color: ballTheme.breakColors[Math.floor(Math.random() * ballTheme.breakColors.length)] || [255, 255, 255],
        });
      }
    }

    const dt = deltaMs / 1000;
    const survivors = [];
    for (const particle of sequence.particles) {
      particle.lifeMs -= deltaMs;
      if (particle.lifeMs <= 0) {
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 220 * dt;
      particle.vx *= clamp(1 - 1.8 * dt, 0.2, 1);
      if (particle.kind === "break") {
        particle.rotation += particle.spin * dt;
      }
      survivors.push(particle);
    }
    sequence.particles = survivors;
  }

  updateFloatingTexts(deltaMs) {
    const survivors = [];
    for (const text of this.floatingTexts) {
      text.lifeMs -= deltaMs;
      if (text.lifeMs <= 0) {
        continue;
      }
      text.x += text.vx * (deltaMs / 1000);
      text.y += text.vy * (deltaMs / 1000);
      text.vy += 30 * (deltaMs / 1000);
      survivors.push(text);
    }
    this.floatingTexts = survivors;
  }

  updateHitEffects(deltaMs) {
    if (this.enemyHitPulseMs > 0) {
      this.enemyHitPulseMs = Math.max(0, this.enemyHitPulseMs - deltaMs);
    }
    if (this.enemyDamageFlashMs > 0) {
      this.enemyDamageFlashMs = Math.max(0, this.enemyDamageFlashMs - deltaMs);
    }

    const dt = deltaMs / 1000;
    const survivors = [];
    for (const effect of this.hitEffects) {
      effect.lifeMs -= deltaMs;
      if (effect.lifeMs <= 0) {
        continue;
      }

      if (effect.kind === "spark") {
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        const drag = clamp(1 - 3.2 * dt, 0.15, 1);
        effect.vx *= drag;
        effect.vy = effect.vy * drag + 24 * dt;
      } else if (effect.kind === "ring") {
        effect.radius += effect.expandSpeed * dt;
      }
      survivors.push(effect);
    }
    this.hitEffects = survivors;
  }

  enqueueAttackProjectile(layout, attackerIndex, attacker, options = {}) {
    const slot = layout?.teamSlots?.[attackerIndex];
    if (!attacker || !slot || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return null;
    }

    const attackType = String(options.attackType || this.resolveAttackTypeForAttacker(attackerIndex, attacker));
    const targetOffsetX = Number(options.targetOffsetX) || 0;
    const targetOffsetY = Number(options.targetOffsetY) || 0;
    const startX = slot.x;
    const startY = slot.y - slot.size * 0.12;
    const impactPoint = this.getEnemyImpactPoint(layout);
    const targetX = impactPoint.x + targetOffsetX;
    const targetY = impactPoint.y + targetOffsetY;
    const precomputedHit = this.buildPrecomputedHitOutcome(attackerIndex, attacker, attackType);
    const plannedDamage = Math.max(0, Number(precomputedHit.damage) || 0);
    const projectedHpAfter = Math.max(
      0,
      (Number(this.enemy.hpCurrent) || 0) - Math.max(0, Number(this.pendingEnemyDamage) || 0) - plannedDamage,
    );
    const reservesDefeat = plannedDamage > 0 && projectedHpAfter <= 0;
    if (plannedDamage > 0) {
      this.pendingEnemyDamage += plannedDamage;
    }
    if (reservesDefeat) {
      this.enemyDefeatReserved = true;
      this.enemyDefeatReservedBySlot = attackerIndex;
    }
    this.triggerSlotRecoil(attackerIndex);
    this.triggerSlotAttackFlash(attackerIndex);
    this.addAttackLaunchEffects({ attackType, startX, startY });
    const initialDistance = Math.hypot(targetX - startX, targetY - startY) || 1;
    const projectile = {
      x: startX,
      y: startY,
      prevX: startX,
      prevY: startY,
      targetX,
      targetY,
      initialDistance,
      speed: PROJECTILE_SPEED_PX_PER_SECOND,
      radius: clamp(slot.size * 0.11, 6, 12),
      attackType,
      attackerIndex,
      attackerNameFr: attacker.nameFr,
      spinPhase: Math.random() * Math.PI * 2,
      spinVelocity: (1.8 + Math.random() * 2.2) * (Math.random() < 0.5 ? -1 : 1),
      rotation: 0,
      lifetimeMs: 0,
      trail: [],
      precomputedHit,
      plannedDamage,
      reservesDefeat,
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  spawnNextProjectile(layout) {
    if (this.isEnemyDefeatReserved()) {
      return;
    }
    const turn = this.consumeTurnSlot();
    const attackerIndex = turn.slotIndex;
    const attacker = turn.attacker;
    const decision = this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    this.recordTurnEvent(attackerIndex, attacker, decision);
    if (decision.action !== TURN_ACTION_ATTACK || !attacker) {
      return;
    }

    const mainProjectile = this.enqueueAttackProjectile(layout, attackerIndex, attacker);
    if (!mainProjectile) {
      return;
    }

    if (decision.talentId === TALENT_MIND_CONTROL_ID && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyDefeatReserved()) {
      const supportSlotIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: true });
      const supportAttacker = supportSlotIndex >= 0 ? this.team[supportSlotIndex] : null;
      if (supportAttacker) {
        this.enqueueAttackProjectile(layout, supportSlotIndex, supportAttacker, {
          targetOffsetX: randomRange(-7, 7),
          targetOffsetY: randomRange(-5, 5),
        });
      }
    }
  }

  addAttackLaunchEffects({ attackType, startX, startY }) {
    const color = getTypeColor(attackType);
    this.hitEffects.push({
      kind: "ring",
      x: startX,
      y: startY,
      radius: 3,
      expandSpeed: 180,
      lifeMs: 125,
      maxLifeMs: 125,
      lineWidth: 1.6,
      color,
    });

    const launchCount = shouldRenderCelebrationParticles() ? 4 : 0;
    for (let i = 0; i < launchCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 58 + Math.random() * 120;
      const lifeMs = 100 + Math.random() * 150;
      this.hitEffects.push({
        kind: "spark",
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 22,
        lifeMs,
        maxLifeMs: lifeMs,
        size: 1.2 + Math.random() * 2.1,
        color,
      });
    }
  }

  updateProjectiles(deltaMs, layout) {
    const survivors = [];
    const dt = deltaMs / 1000;
    const trailMaxPoints = getProjectileTrailMaxPointsForQuality();

    for (const projectile of this.projectiles) {
      projectile.prevX = projectile.x;
      projectile.prevY = projectile.y;
      const impactPoint = this.getEnemyImpactPoint(layout);
      projectile.targetX = impactPoint.x;
      projectile.targetY = impactPoint.y;
      projectile.lifetimeMs += deltaMs;
      if (trailMaxPoints > 0) {
        const existingTrail = Array.isArray(projectile.trail) ? projectile.trail : [];
        let writeIndex = 0;
        for (const point of existingTrail) {
          point.lifeMs -= deltaMs;
          if (point.lifeMs > 0) {
            existingTrail[writeIndex] = point;
            writeIndex += 1;
          }
        }
        existingTrail.length = writeIndex;
        existingTrail.push({
          x: projectile.x,
          y: projectile.y,
          lifeMs: PROJECTILE_TRAIL_POINT_LIFETIME_MS,
          maxLifeMs: PROJECTILE_TRAIL_POINT_LIFETIME_MS,
        });
        if (existingTrail.length > trailMaxPoints) {
          existingTrail.splice(0, existingTrail.length - trailMaxPoints);
        }
        projectile.trail = existingTrail;
      } else if (Array.isArray(projectile.trail) && projectile.trail.length > 0) {
        projectile.trail.length = 0;
      }

      const dx = projectile.targetX - projectile.x;
      const dy = projectile.targetY - projectile.y;
      const distance = Math.hypot(dx, dy);
      const distanceRatio = clamp(
        1 - distance / Math.max(1, Number(projectile.initialDistance) || distance || 1),
        0,
        1,
      );
      const speedMultiplier = 0.8 + distanceRatio * 0.9;
      const frameDistance = projectile.speed * speedMultiplier * dt;

      if (distance <= frameDistance || distance <= 0.0001 || projectile.lifetimeMs > 1600) {
        this.applyHit(projectile);
        continue;
      }

      projectile.spinPhase += projectile.spinVelocity * dt;
      projectile.rotation = Math.atan2(dy, dx) + projectile.spinPhase * 0.33;
      projectile.x += (dx / distance) * frameDistance;
      projectile.y += (dy / distance) * frameDistance;
      survivors.push(projectile);
    }

    this.projectiles = survivors;
  }

  addFloatingDamageText({
    damage,
    attackType,
    typeMultiplier,
    isCritical = false,
    targetX,
    targetY,
    isMiss = false,
  }) {
    const labelParts = [];
    if (isCritical && !isMiss) {
      labelParts.push("CRIT");
    }
    if (!isMiss && typeMultiplier >= 2) {
      labelParts.push("SUPER");
    } else if (!isMiss && typeMultiplier > 0 && typeMultiplier < 1) {
      labelParts.push("RESIST");
    } else if (!isMiss && typeMultiplier === 0) {
      labelParts.push("IMMUNE");
    }
    const label = labelParts.join(" ");

    this.floatingTexts.push({
      x: targetX + (Math.random() - 0.5) * 26,
      y: targetY - 10,
      vx: (Math.random() - 0.5) * 26,
      vy: -92 - Math.random() * 24,
      lifeMs: FLOATING_TEXT_LIFETIME_MS,
      maxLifeMs: FLOATING_TEXT_LIFETIME_MS,
      damage: isMiss ? 0 : damage,
      isMiss,
      label,
      attackType,
      color: getTypeColor(attackType),
    });
  }

  addEnemyHitEffects({ attackType, typeMultiplier, isCritical = false, targetX, targetY, damage }) {
    const color = getTypeColor(attackType);
    const impactFactorBase = typeMultiplier >= 2 ? 1.25 : typeMultiplier > 0 && typeMultiplier < 1 ? 0.9 : 1;
    const impactFactor = impactFactorBase * (isCritical ? 1.18 : 1);
    this.enemyHitPulseMs = 120;

    this.hitEffects.push({
      kind: "ring",
      x: targetX,
      y: targetY,
      radius: 7,
      expandSpeed: 220 * impactFactor,
      lifeMs: 170,
      maxLifeMs: 170,
      lineWidth: 2.4,
      color,
    });

    const particleCount = shouldRenderCelebrationParticles()
      ? clamp(Math.round(4 + damage / 28), 4, 8)
      : 0;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (85 + Math.random() * 190) * impactFactor;
      const lifeMs = 150 + Math.random() * 190;
      this.hitEffects.push({
        kind: "spark",
        x: targetX + Math.cos(angle) * 4,
        y: targetY + Math.sin(angle) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 18,
        lifeMs,
        maxLifeMs: lifeMs,
        size: 1.8 + Math.random() * 2.8,
        color,
      });
    }
  }

  applyHit(projectile, options = {}) {
    const idleMode = Boolean(options.idleMode);
    const suppressTurnEvent = Boolean(options.suppressTurnEvent);
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      this.consumeQueuedProjectileDamage(projectile);
      return;
    }

    const attacker = this.team[projectile.attackerIndex];
    if (!attacker) {
      this.consumeQueuedProjectileDamage(projectile);
      return;
    }

    const precomputedHit = projectile?.precomputedHit && typeof projectile.precomputedHit === "object"
      ? projectile.precomputedHit
      : null;
    const attackType = String(
      precomputedHit?.attackType
      || projectile?.attackType
      || attacker.offensiveType
      || attacker.defensiveTypes?.[0]
      || "normal",
    );
    const missed = precomputedHit
      ? Boolean(precomputedHit.missed)
      : (!hasAlwaysHitTalent(attacker?.talent, attacker?.id) && Math.random() < ATTACK_MISS_CHANCE);
    if (missed) {
      this.consumeQueuedProjectileDamage(projectile);
      const decision = this.resolveTurnDecisionForSlot(projectile.attackerIndex, attacker);
      this.lastImpact = {
        attackerNameFr: attacker.nameFr,
        attackType,
        damage: 0,
        typeMultiplier: 1,
        enemyNameFr: this.enemy.nameFr,
        isCritical: false,
        missed: true,
      };
      if (!suppressTurnEvent) {
        this.recordTurnEvent(projectile.attackerIndex, attacker, {
          action: TURN_ACTION_ATTACK,
          reason: "hit_missed",
          talentId: decision.talentId,
          passiveBehaviorId: decision.passiveBehaviorId,
        }, {
          damage: 0,
          type_multiplier: 1,
          is_critical: false,
          missed: true,
        });
      }
      if (!idleMode) {
        this.addFloatingDamageText({
          damage: 0,
          attackType,
          typeMultiplier: 1,
          isCritical: false,
          targetX: projectile.targetX,
          targetY: projectile.targetY,
          isMiss: true,
        });
      }
      return;
    }

    let typeMultiplier;
    let teamAuraAttackBonus;
    let isCriticalHit;
    let baseDamage;
    if (precomputedHit) {
      typeMultiplier = Number(precomputedHit.typeMultiplier || 1);
      teamAuraAttackBonus = Math.max(0, Number(precomputedHit.teamAuraAttackBonus) || 0);
      isCriticalHit = Boolean(precomputedHit.isCritical);
      baseDamage = Math.max(0, Number(precomputedHit.damage || 0));
    } else {
      typeMultiplier = getTypeMultiplier(attackType, this.enemy.defensiveTypes);
      const critChanceBonus = getTalentCritBonusChance(attacker?.talent, attacker?.id);
      teamAuraAttackBonus = this.getTeamAuraAttackBonusForAttacker(projectile.attackerIndex, attacker);
      const damageOutcome = computeDamage(attacker, this.enemy, attackType, typeMultiplier, {
        critChanceBonus,
        damageMultiplier: 1 + teamAuraAttackBonus,
      });
      baseDamage = Math.max(0, Number(damageOutcome?.damage || 0));
      isCriticalHit = Boolean(damageOutcome?.isCritical);
    }
    const damage = baseDamage <= 0 ? 0 : Math.max(1, Math.round(baseDamage));

    this.consumeQueuedProjectileDamage(projectile);
    this.enemy.hpCurrent = clamp(this.enemy.hpCurrent - damage, 0, this.enemy.hpMax);
    if (damage > 0) {
      this.enemyDamageFlashMs = Math.max(this.enemyDamageFlashMs, ENEMY_DAMAGE_FLASH_DURATION_MS);
    }
    this.lastImpact = {
      attackerNameFr: attacker.nameFr,
      attackType,
      damage,
      typeMultiplier,
      enemyNameFr: this.enemy.nameFr,
      isCritical: isCriticalHit,
      missed: false,
    };
    const decision = this.resolveTurnDecisionForSlot(projectile.attackerIndex, attacker);
    if (!suppressTurnEvent) {
      this.recordTurnEvent(projectile.attackerIndex, attacker, {
        action: TURN_ACTION_ATTACK,
        reason: "hit_resolved",
        talentId: decision.talentId,
        passiveBehaviorId: decision.passiveBehaviorId,
      }, {
        damage,
        type_multiplier: Math.round(typeMultiplier * 1000) / 1000,
        is_critical: isCriticalHit,
        missed: false,
        team_aura_attack_bonus_pct: Math.round(Math.max(0, teamAuraAttackBonus) * 10000) / 100,
      });
    }
    if (!idleMode) {
      this.addFloatingDamageText({
        damage,
        attackType,
        typeMultiplier,
        isCritical: isCriticalHit,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
      });
      this.addEnemyHitEffects({
        damage,
        attackType,
        typeMultiplier,
        isCritical: isCriticalHit,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
      });
    }

    if (this.enemy && this.enemy.hpCurrent <= 0 && !this.isEnemyRespawning()) {
      const defeatedEnemy = this.enemy;
      this.resetQueuedAttackState();
      this.enemiesDefeated += 1;
      this.defeatedEnemyName = this.enemy.nameFr;
      let captureResult = { captured: false, capture_attempted: false };
      try {
        captureResult = this.onEnemyDefeated(defeatedEnemy) || captureResult;
      } catch {
        captureResult = { captured: false, capture_attempted: false };
      }

      const captured = Boolean(captureResult?.captured);
      const captureAttempted = Boolean(captureResult?.capture_attempted);
      const captureCritical = Boolean(captureResult?.capture_critical);
      if (idleMode) {
        this.captureSequence = null;
        this.pendingRespawnMs = 0;
        this.koAnimMs = 0;
        this.projectiles = [];
        this.enemyHitPulseMs = 0;
        this.enemyDamageFlashMs = 0;
        this.hitEffects = [];
        this.floatingTexts = [];
        this.spawnEnemy();
        return;
      }

       if (captureAttempted) {
         const captureChanceDisplay = Number(captureResult?.capture_chance_display);
         const captureOnComplete = captureResult?.capture_on_complete;
         const captureBallType = normalizeBallTypeForVisual(captureResult?.capture_ball_type || "poke_ball");
         this.captureSequence = {
           captured,
           isCritical: captureCritical,
           ballType: captureBallType,
           chanceDisplay: Number.isFinite(captureChanceDisplay) ? clamp(captureChanceDisplay, 0, 1) : null,
           onComplete: typeof captureOnComplete === "function" ? captureOnComplete : null,
           elapsedMs: 0,
           totalMs: this.buildCaptureTotalMs(captured),
           targetX: projectile.targetX,
           targetY: projectile.targetY,
           startX: projectile.targetX + 220,
          startY: projectile.targetY + 120,
          burstSpawned: false,
          breakSpawned: false,
          particles: [],
        };
        this.pendingRespawnMs = this.captureSequence.totalMs;
        this.koAnimMs = 0;
      } else {
        this.captureSequence = null;
        this.pendingRespawnMs = this.enemyRespawnDelayMs;
        this.koAnimMs = KO_ANIMATION_DURATION_MS;
      }
      this.projectiles = [];
      this.enemyHitPulseMs = 0;
      this.enemyDamageFlashMs = 0;
      this.hitEffects = [];
    }
  }

  spawnEnemy() {
    const source = this.createEnemy();
    if (!source) {
      this.enemy = null;
      this.resetQueuedAttackState();
      this.enemyTimerEnabled = false;
      this.enemyTimerDurationMs = 0;
      this.enemyTimerMs = 0;
      this.enemyTimerStyle = ENEMY_TIMER_STYLE_ROUTE;
      return;
    }

    this.enemy = {
      ...source,
      hpCurrent: source.hpMax,
    };
    this.projectiles = [];
    this.hitEffects = [];
    this.enemyHitPulseMs = 0;
    this.enemyDamageFlashMs = 0;
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.resetQueuedAttackState();
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.lastTurnEvent = null;
    this.resetEnemyTimer();
    this.onEnemySpawn(this.enemy);
  }
}

async function loadPokemonEntity(jsonPath) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${jsonPath}`);
  }

  const payload = validatePokemonPayload(await response.json(), `Pokemon data ${jsonPath}`);
  const variants = [];
  const rawVariants = Array.isArray(payload?.sprite_variants) ? payload.sprite_variants : [];
  for (let i = 0; i < rawVariants.length; i += 1) {
    const normalized = normalizeSpriteVariantEntry(rawVariants[i], jsonPath, i);
    if (!normalized || variants.some((entry) => entry.id === normalized.id)) {
      continue;
    }
    variants.push(normalized);
  }

  if (variants.length <= 0) {
    const fallbackFront = resolveSpritePath(jsonPath, payload?.sprites?.front);
    if (fallbackFront) {
      variants.push({
        id: "default",
        labelFr: "Sprite par defaut",
        generation: 0,
        gameKey: "default",
        frontPath: fallbackFront,
        frontShinyPath: resolveSpritePath(jsonPath, payload?.sprites?.front_shiny),
      });
    }
  }

  const defaultSpriteVariantId = getDefaultSpriteVariantId({
    spriteVariants: variants,
    defaultSpriteVariantId: normalizeSpriteVariantId(payload?.default_sprite_variant_id),
  });
  const defaultVariant = getPreferredDefaultSpriteVariant({
    spriteVariants: variants,
    defaultSpriteVariantId: normalizeSpriteVariantId(payload?.default_sprite_variant_id),
  });
  const spritePath = defaultVariant?.frontPath || resolveSpritePath(jsonPath, payload?.sprites?.front);
  const shinySpritePath = defaultVariant?.frontShinyPath || resolveSpritePath(jsonPath, payload?.sprites?.front_shiny);
  const [spriteImage, spriteShinyImage] = await Promise.all([loadImage(spritePath), loadImage(shinySpritePath)]);
  registerSpriteImageInCache(spritePath, spriteImage);
  registerSpriteImageInCache(shinySpritePath, spriteShinyImage);

  const defensiveTypes = getDefensiveTypes(payload);
  const offensiveType = String(payload?.offensive_type || defensiveTypes[0] || "normal").toLowerCase();
  const evolvesFrom = normalizeEvolutionLink(payload?.evolves_from);
  const evolvesTo = Array.isArray(payload?.evolves_to)
    ? payload.evolves_to.map((entry) => normalizeEvolutionLink(entry)).filter(Boolean)
    : [];
  const talent = normalizeTalentDefinition(
    payload?.talent ?? {
      id: payload?.talent_id ?? payload?.talent_name_en ?? payload?.talent_name_fr,
      name_fr: payload?.talent_name_fr,
      name_en: payload?.talent_name_en,
      description_fr: payload?.talent_description_fr,
    },
  );

  return {
    jsonPath,
    id: Number(payload.pokedex_number || 0),
    nameFr: payload.name_fr || payload.name_en || "Pokemon",
    nameEn: payload.name_en || "pokemon",
    level: calcLevel(payload.stats, 0),
    hpMax: 0,
    hpCurrent: 0,
    stats: payload.stats || {},
    defensiveTypes,
    offensiveType,
    catchRate: Number(payload?.catch_rate || 45),
    spriteScaleValue: normalizePokemonSpriteScaleValue(payload?.size),
    spritePath,
    shinySpritePath,
    spriteImage,
    spriteShinyImage,
    spriteVariants: variants,
    defaultSpriteVariantId: defaultVariant?.id || "",
    evolvesFrom,
    evolvesTo,
    talent,
  };
}

function hideStarterModal() {
  starterModalEl.classList.add("hidden");
}

function showStarterModal() {
  starterModalEl.classList.remove("hidden");
}

function renderStarterChoices() {
  starterChoicesEl.innerHTML = "";
  for (const choice of STARTER_CHOICES) {
    const def = state.pokemonDefsById.get(choice.id);
    if (!def) {
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "starter-choice";
    button.dataset.starterId = String(choice.id);

    const image = document.createElement("img");
    image.alt = def.nameFr;
    image.src = def.spritePath;

    const name = document.createElement("span");
    name.className = "starter-choice-name";
    name.textContent = def.nameFr;

    const level = document.createElement("span");
    level.className = "starter-choice-level";
    level.textContent = `Niv. ${STARTER_LEVEL}`;

    button.appendChild(image);
    button.appendChild(name);
    button.appendChild(level);
    button.addEventListener("click", () => {
      chooseStarter(choice.id);
    });

    starterChoicesEl.appendChild(button);
  }
}

function buildTeamMemberFromSaveEntry(entry) {
  const pokemonId = Number(entry);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!def) {
    return null;
  }
  const record = getPokemonEntityRecord(pokemonId);
  reconcileAppearanceForEntityRecord(record, pokemonId);
  const forceUltraShiny = shouldForceUltraShinyAllPokemon();
  const appearance = resolveSpriteAppearanceForEntity(pokemonId, {
    forceUltraShiny,
  });
  const ultraShinyVisual = Boolean(forceUltraShiny || appearance.ultraShinyVisual);
  const level = clamp(toSafeInt(record?.level, 1), 1, MAX_LEVEL);
  const stats = computeStatsAtLevel(record?.base_stats || def.stats, level);
  const xp = Math.max(0, toSafeInt(record?.xp, 0));
  const xpToNext = getXpToNextLevelForSpecies(pokemonId, level, record?.base_stats || def.stats);
  const hpMax = computeBattleHpMax(stats, level, false);
  const talent = resolveTalentDefinition(record?.talent, pokemonId);
  const baseNameFr = String(def.nameFr || `Pokemon ${pokemonId}`);
  const nickname = sanitizePokemonNickname(record?.nickname);
  const displayNameFr = nickname || baseNameFr;
  return {
    ...def,
    nameFr: displayNameFr,
    baseNameFr,
    nickname,
    level,
    xp,
    xpToNext,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    talent,
    isShiny: false,
    isUltraShiny: false,
    isShinyVisual: Boolean(appearance.shinyVisual || ultraShinyVisual),
    isUltraShinyVisual: ultraShinyVisual,
    spritePath: appearance.spritePath || def.spritePath,
    spriteImage: appearance.spriteImage || def.spriteImage,
    spriteVariantId: appearance.variant?.id || getDefaultSpriteVariantId(def),
    spriteAnimated: Boolean(appearance.animated),
  };
}

function applyTeamTalentOverrides(teamMembers) {
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return teamMembers;
  }

  for (let index = 0; index < teamMembers.length; index += 1) {
    const member = teamMembers[index];
    if (!member || !shouldApplyMorphingTalent(member?.talent, member?.id)) {
      continue;
    }

    const source = index > 0 ? teamMembers[index - 1] : null;
    member.morphingSourceId = Number(source?.id || 0) > 0 ? Number(source.id) : null;
    member.spriteShader = source ? MORPHING_SHADER_CONFIG : null;
    if (!source) {
      continue;
    }

    const level = clamp(toSafeInt(member.level, 1), 1, MAX_LEVEL);
    const sourceBaseStats = normalizeStatsPayload(source.baseStats || source.stats || {});
    const nextStats = computeStatsAtLevel(sourceBaseStats, level);
    const hpRatio = member.hpMax > 0 ? clamp(member.hpCurrent / member.hpMax, 0, 1) : 1;
    const hpMax = computeBattleHpMax(nextStats, level, false);

    member.baseStats = sourceBaseStats;
    member.stats = nextStats;
    member.hpMax = hpMax;
    member.hpCurrent = Math.max(1, Math.round(hpMax * hpRatio));
    member.defensiveTypes =
      Array.isArray(source.defensiveTypes) && source.defensiveTypes.length > 0
        ? source.defensiveTypes.slice(0, 2)
        : member.defensiveTypes;
    member.offensiveType = source.offensiveType || member.offensiveType;
    member.spritePath = source.spritePath || member.spritePath;
    member.spriteImage = source.spriteImage || member.spriteImage;
    member.spriteVariantId = source.spriteVariantId || member.spriteVariantId;
    member.spriteAnimated = Boolean(source.spriteAnimated);
  }

  return teamMembers;
}

function hydrateTeamFromSave() {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return [];
  }
  const uniqueIds = [];
  for (const rawId of state.saveData.team) {
    const id = Number(rawId);
    if (id > 0 && !uniqueIds.includes(id) && isPokemonEntityUnlockedById(id)) {
      uniqueIds.push(id);
    }
    if (uniqueIds.length >= MAX_TEAM_SIZE) {
      break;
    }
  }
  state.saveData.team = uniqueIds;
  const team = uniqueIds.map(buildTeamMemberFromSaveEntry).filter(Boolean);
  return applyTeamTalentOverrides(team);
}

function applyAutoGrantedProgress(pokemonId, level = 1) {
  if (!state.saveData) {
    return { addedToTeam: false };
  }

  const familyOwnedBeforeCapture = isEvolutionFamilyOwned(pokemonId);
  const { record, wasUnlocked } = ensurePokemonEntityUnlocked(pokemonId, level);
  const capturedBefore = getCapturedTotal(record);
  incrementSpeciesStat(pokemonId, "encountered", false, 1);
  incrementSpeciesStat(pokemonId, "captured", false, 1);
  const baseCaptureCoinReward = familyOwnedBeforeCapture
    ? (Math.random() < COIN_REWARD_FAMILY_OWNED_CAPTURE_CHANCE ? COIN_REWARD_PER_CAPTURE : 0)
    : COIN_REWARD_PER_CAPTURE;
  const firstCaptureBonus = capturedBefore <= 0 ? COIN_REWARD_FIRST_CAPTURE_BONUS : 0;
  addCoins(baseCaptureCoinReward + firstCaptureBonus);
  record.encountered_normal = Math.max(1, record.encountered_normal);
  record.captured_normal = Math.max(1, record.captured_normal);

  let addedToTeam = false;
  if (!wasUnlocked) {
    addedToTeam = addSpeciesToTeamIfPossible(pokemonId);
  } else if (state.saveData.team.length < MAX_TEAM_SIZE && !state.saveData.team.includes(Number(pokemonId))) {
    addedToTeam = addSpeciesToTeamIfPossible(pokemonId);
  }
  rebuildTeamAndSyncBattle();
  return { addedToTeam };
}

function pickEncounterLevel(encounter) {
  const activeRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  if (activeRouteId === ROUTE_1_TUTORIAL_ID) {
    return 1;
  }

  const levelWeights = Array.isArray(encounter?.level_weights)
    ? encounter.level_weights
        .map((entry) => ({
          level: clamp(toSafeInt(entry?.level, 1), 1, MAX_LEVEL),
          spawn_weight: Math.max(1, toSafeInt(entry?.weight, 1)),
        }))
        .filter((entry) => entry.level > 0)
    : [];
  if (levelWeights.length > 0) {
    const picked = weightedPick(levelWeights);
    if (picked?.level) {
      return picked.level;
    }
  }

  const minLevel = clamp(toSafeInt(encounter?.min_level, DEFAULT_WILD_LEVEL_MIN), 1, MAX_LEVEL);
  const maxLevel = clamp(
    toSafeInt(encounter?.max_level, Math.max(minLevel, DEFAULT_WILD_LEVEL_MAX)),
    minLevel,
    MAX_LEVEL,
  );
  return randomInt(minLevel, maxLevel);
}

function isEncounterMethodUnlocked(methodId) {
  const id = String(methodId || "").toLowerCase().trim();
  if (!id) {
    return true;
  }
  if (ENCOUNTER_METHOD_DISABLED[id]) {
    return false;
  }
  if (ENCOUNTER_METHOD_ALWAYS_UNLOCKED[id]) {
    return true;
  }
  const requiredRouteId = ENCOUNTER_METHOD_UNLOCK_ROUTE_BY_ID[id];
  if (!requiredRouteId) {
    return true;
  }
  return isRouteUnlocked(requiredRouteId);
}

function getEncounterMethods(encounter) {
  if (!Array.isArray(encounter?.methods)) {
    return [];
  }
  return encounter.methods
    .map((method) => String(method || "").toLowerCase().trim())
    .filter(Boolean);
}

function encounterHasMethod(encounter, methodId) {
  const id = String(methodId || "").toLowerCase().trim();
  if (!id) {
    return false;
  }
  const methods = getEncounterMethods(encounter);
  return methods.includes(id);
}

function isEncounterMethodUnlockedForSelection(methodId, options = {}) {
  const id = String(methodId || "").toLowerCase().trim();
  if (!id) {
    return true;
  }
  const allowDisabledMethods = options?.allowDisabledMethods instanceof Set ? options.allowDisabledMethods : null;
  if (allowDisabledMethods?.has(id)) {
    return true;
  }
  return isEncounterMethodUnlocked(id);
}

function isEncounterEntryUnlocked(encounter, options = {}) {
  const methods = getEncounterMethods(encounter);
  if (methods.length === 0) {
    return true;
  }
  for (const method of methods) {
    if (isEncounterMethodUnlockedForSelection(method, options)) {
      return true;
    }
  }
  return false;
}

function getUnlockedEncountersForRoute(routeData, options = {}) {
  const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  if (encounters.length === 0) {
    return [];
  }
  const requireMethod = String(options?.requireMethod || "").toLowerCase().trim();
  const excludeMethod = String(options?.excludeMethod || "").toLowerCase().trim();
  const allowDisabledMethods = options?.allowDisabledMethods instanceof Set ? options.allowDisabledMethods : null;
  return encounters.filter((encounter) => {
    if (requireMethod && !encounterHasMethod(encounter, requireMethod)) {
      return false;
    }
    if (excludeMethod && encounterHasMethod(encounter, excludeMethod)) {
      return false;
    }
    return isEncounterEntryUnlocked(encounter, { allowDisabledMethods });
  });
}

function ensureOnlyOneEncounterCycleRoute(routeId = null) {
  const activeRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  if (!state.onlyOneEncounterCycle || state.onlyOneEncounterCycle.routeId !== activeRouteId) {
    state.onlyOneEncounterCycle = {
      routeId: activeRouteId,
      normalCount: 0,
    };
  }
  return state.onlyOneEncounterCycle;
}

function resetOnlyOneEncounterCycle(routeId = null) {
  const cycle = ensureOnlyOneEncounterCycleRoute(routeId);
  cycle.normalCount = 0;
  return cycle;
}

function incrementOnlyOneEncounterCycle(routeId = null) {
  const cycle = ensureOnlyOneEncounterCycleRoute(routeId);
  cycle.normalCount = clamp(toSafeInt(cycle.normalCount, 0) + 1, 0, ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN);
  return cycle;
}

function shouldSpawnOnlyOneEncounter(routeId = null) {
  const cycle = ensureOnlyOneEncounterCycleRoute(routeId);
  return cycle.normalCount >= ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN;
}

function pickEncounterForCurrentRoute(routeData) {
  const activeRouteId = String(routeData?.route_id || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const normalEncounters = getUnlockedEncountersForRoute(routeData, {
    excludeMethod: ENCOUNTER_METHOD_ONLY_ONE,
  });
  const onlyOneEncounters = getUnlockedEncountersForRoute(routeData, {
    requireMethod: ENCOUNTER_METHOD_ONLY_ONE,
    allowDisabledMethods: ENCOUNTER_METHOD_ONLY_ONE_ALLOW_SET,
  });
  const hasOnlyOneEncounters = onlyOneEncounters.length > 0;
  if (hasOnlyOneEncounters && shouldSpawnOnlyOneEncounter(activeRouteId)) {
    const pickedOnlyOne = weightedPick(onlyOneEncounters);
    if (pickedOnlyOne) {
      resetOnlyOneEncounterCycle(activeRouteId);
      return {
        encounter: pickedOnlyOne,
        isOnlyOneEncounter: true,
      };
    }
  }

  const pickedNormal = weightedPick(normalEncounters);
  if (pickedNormal) {
    if (hasOnlyOneEncounters) {
      incrementOnlyOneEncounterCycle(activeRouteId);
    }
    return {
      encounter: pickedNormal,
      isOnlyOneEncounter: false,
    };
  }

  const fallbackOnlyOne = weightedPick(onlyOneEncounters);
  if (fallbackOnlyOne) {
    resetOnlyOneEncounterCycle(activeRouteId);
    return {
      encounter: fallbackOnlyOne,
      isOnlyOneEncounter: true,
    };
  }

  return {
    encounter: null,
    isOnlyOneEncounter: false,
  };
}

function isOnlyOneEncounterEnemy(enemy) {
  if (!enemy || typeof enemy !== "object") {
    return false;
  }
  if (enemy.isOnlyOneEncounter === true) {
    return true;
  }
  return encounterHasMethod({ methods: enemy.encounterMethods }, ENCOUNTER_METHOD_ONLY_ONE);
}

function createRouteEnemyInstance() {
  if (!state.routeData || !isCurrentRouteCombatEnabled() || !Array.isArray(state.routeData.encounters)) {
    return null;
  }
  const pickResult = pickEncounterForCurrentRoute(state.routeData);
  const picked = pickResult?.encounter || null;
  if (!picked) {
    return null;
  }
  const def = state.pokemonDefsById.get(Number(picked.id));
  if (!def) {
    return null;
  }

  const isUltraShiny = Math.floor(Math.random() * ULTRA_SHINY_ODDS) === 0;
  const isShiny = isUltraShiny || Math.floor(Math.random() * SHINY_ODDS) === 0;
  const forceUltraShiny = shouldForceUltraShinyAllPokemon();
  const ultraShinyVisual = Boolean(isUltraShiny || forceUltraShiny);
  const shinyVisual = Boolean(isShiny || ultraShinyVisual);
  const isOnlyOneEncounter = Boolean(pickResult?.isOnlyOneEncounter && encounterHasMethod(picked, ENCOUNTER_METHOD_ONLY_ONE));
  const level = pickEncounterLevel(picked);
  const stats = computeStatsAtLevel(def.stats, level);
  const baseHpMax = computeBattleHpMax(stats, level, true);
  const teamSizeForBalance = getActiveTeamSizeForBalance();
  const teamHpScaleMultiplier = getEnemyHpTeamScaleMultiplier(teamSizeForBalance);
  const encounterHpMultiplier = isOnlyOneEncounter ? ONLY_ONE_ENCOUNTER_HP_MULTIPLIER : 1;
  const hpBalanceMultiplier = teamHpScaleMultiplier * encounterHpMultiplier;
  const hpMax = Math.max(1, Math.round(baseHpMax * hpBalanceMultiplier));
  const rewardScaleMultiplier = getEnemyRewardScaleMultiplier(teamHpScaleMultiplier, isOnlyOneEncounter);
  const appearance = resolveSpriteAppearanceForEntity(def.id, {
    shinyVisual,
    ultraShinyVisual,
    forceUltraShiny: ultraShinyVisual,
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
  });
  const defaultVariant = getSpriteVariantById(def, getDefaultSpriteVariantId(def));
  const defaultNormalPath = defaultVariant?.frontPath || def.spritePath || "";
  const defaultShinyPath = defaultVariant?.frontShinyPath || def.shinySpritePath || defaultNormalPath;
  const spritePath = appearance.spritePath || (shinyVisual ? defaultShinyPath : defaultNormalPath);
  const cachedSpriteImage = spritePath ? getCachedSpriteImage(spritePath) : null;
  const spriteImage = isDrawableImage(cachedSpriteImage)
    ? cachedSpriteImage
    : appearance.spriteImage || (shinyVisual ? def.spriteShinyImage || def.spriteImage : def.spriteImage);
  return {
    ...def,
    level,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    catchRate: Number(def.catchRate || picked.catch_rate || 45),
    isShiny,
    isUltraShiny,
    isOnlyOneEncounter,
    enemyTimerStyle: isOnlyOneEncounter ? ENEMY_TIMER_STYLE_ONLY_ONE : ENEMY_TIMER_STYLE_ROUTE,
    encounterMethods: getEncounterMethods(picked),
    balanceTeamSize: teamSizeForBalance,
    balanceHpMultiplier: hpBalanceMultiplier,
    balanceRewardMultiplier: rewardScaleMultiplier,
    isShinyVisual: Boolean(shinyVisual || appearance.shinyVisual || appearance.ultraShinyVisual),
    isUltraShinyVisual: Boolean(ultraShinyVisual || appearance.ultraShinyVisual),
    spritePath,
    spriteImage: spriteImage || def.spriteImage,
    spriteVariantId: appearance.variant?.id || defaultVariant?.id || getDefaultSpriteVariantId(def),
    spriteAnimated: Boolean(appearance.animated),
  };
}

function handleEnemySpawn(enemy) {
  if (!enemy) {
    return;
  }
  state.enemy = enemy;
  if (enemy.isShiny) {
    notifyWindowsShinyEncounter(enemy);
  }
  const speciesRecord = ensureSpeciesStats(enemy.id);
  incrementSpeciesStat(enemy.id, "encountered", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
  notifyShinyEncounterUntilCaptured(enemy, speciesRecord);
  persistSaveDataForSimulationEvent();
  if (!state.simulationIdleMode) {
    updateHud();
  }
}

function getEnemyTimerConfigForBattle(enemy = null) {
  if (isOnlyOneEncounterEnemy(enemy)) {
    return {
      enabled: true,
      durationMs: ONLY_ONE_ENCOUNTER_TIMER_MS,
      style: ENEMY_TIMER_STYLE_ONLY_ONE,
    };
  }
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const progressState = getRouteUnlockProgressState(activeRouteId);
  return {
    enabled: progressState.timerEnabled,
    durationMs: progressState.timerDurationMs,
    style: ENEMY_TIMER_STYLE_ROUTE,
  };
}

function handleEnemyTimerExpired(enemy) {
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  if (isOnlyOneEncounterEnemy(enemy)) {
    resetOnlyOneEncounterCycle(activeRouteId);
  }
  const progressState = getRouteUnlockProgressState(activeRouteId);
  if (!progressState.timerEnabled) {
    return;
  }
  const previousStreak = Math.max(0, toSafeInt(progressState.rawDefeats, 0));
  if (previousStreak > 0) {
    setRouteDefeatCount(activeRouteId, 0);
    if (!state.simulationIdleMode) {
      setTopMessage(`Temps ecoule contre ${enemy?.nameFr || "le Pokemon"}. Serie de KO remise a zero.`, 1800);
    }
  }
}

function handleEnemyDefeated(enemy) {
  if (!enemy) {
    return { captured: false, capture_attempted: false };
  }

  incrementSpeciesStat(enemy.id, "defeated", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  incrementRouteDefeatCount(activeRouteId, 1);
  tryUnlockNextRouteAfterDefeat(activeRouteId);
  const moneyReward = computeDefeatMoneyReward(enemy);
  addMoney(moneyReward);
  const captureEquivalentXpReward = computeCaptureXpReward(enemy);
  const koXpReward = Math.max(1, Math.floor(captureEquivalentXpReward * KO_XP_RATIO_OF_CAPTURE));
  const captureBonusXpReward = Math.max(0, captureEquivalentXpReward - koXpReward);
  const applyXpSummaryEffects = (summary, tone) => {
    if (state.simulationIdleMode || !summary) {
      return;
    }
    if (Array.isArray(summary.levelUps) && summary.levelUps.length > 0) {
      queueTeamLevelUpEffects(summary.levelUps);
    }
    if (Array.isArray(summary.xpGains) && summary.xpGains.length > 0) {
      queueTeamXpGainEffects(summary.xpGains, { tone });
    }
  };
  let xpRewardGranted = false;
  const awardKoXpReward = () => {
    if (xpRewardGranted) {
      return null;
    }
    xpRewardGranted = true;
    const summary = awardCaptureXpToTeam(enemy, { reward: koXpReward });
    applyXpSummaryEffects(summary, "defeat");
    return summary;
  };
  const awardCaptureBonusXpReward = () => {
    if (xpRewardGranted) {
      return null;
    }
    xpRewardGranted = true;
    const summary = awardCaptureXpToTeam(enemy, { reward: captureBonusXpReward });
    applyXpSummaryEffects(summary, "capture");
    return summary;
  };
  let captureAttempted = false;
  let captured = false;
  let captureCritical = false;
  let captureChanceDisplay = null;
  let captureOnComplete = null;
  let addedToTeam = false;
  let captureXpSummary = null;
  let usedBallType = null;
  const familyOwnedBeforeCapture = isEvolutionFamilyOwned(enemy.id);
  const awardCaptureCoinReward = () => {
    const speciesRecord = ensureSpeciesStats(enemy.id);
    const isFirstCapture = getCapturedTotal(speciesRecord) <= 0;
    const baseCaptureCoinReward = familyOwnedBeforeCapture
      ? (Math.random() < COIN_REWARD_FAMILY_OWNED_CAPTURE_CHANCE ? COIN_REWARD_PER_CAPTURE : 0)
      : COIN_REWARD_PER_CAPTURE;
    addCoins(baseCaptureCoinReward + (isFirstCapture ? COIN_REWARD_FIRST_CAPTURE_BONUS : 0));
  };

  if (getBallInventoryTotalCount() > 0) {
    const captureConsume = consumeBallForCapture(enemy);
    captureAttempted = Boolean(captureConsume.consumed);
    usedBallType = captureConsume.ballType;
    if (captureAttempted && usedBallType) {
      const guaranteedCapture = consumePendingGuaranteedCaptureBonus();
      if (guaranteedCapture) {
        captureChanceDisplay = 1;
        captured = true;
      } else {
        const ballMultiplier = getBallCaptureMultiplier(usedBallType);
        captureCritical = Math.random() < CAPTURE_CRIT_CHANCE;
        const criticalMultiplier = captureCritical ? CAPTURE_CRIT_MULTIPLIER : 1;
        captureChanceDisplay = computeCatchChance(enemy.catchRate, ballMultiplier * criticalMultiplier);
        const shinyCaptureMultiplier = enemy.isUltraShiny ? 2 : enemy.isShiny ? 1.5 : 1;
        const catchChance = computeCatchChance(
          enemy.catchRate,
          ballMultiplier * criticalMultiplier * shinyCaptureMultiplier,
        );
        captured = Math.random() < catchChance;
      }
      if (captured) {
        if (state.simulationIdleMode) {
          awardCaptureCoinReward();
          incrementSpeciesStat(enemy.id, "captured", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
          if (enemy.isShiny) {
            notifyWindowsShinyCapture(enemy, { isCritical: captureCritical });
          }
          const captureUnlockSummary = resolveCaptureEntityUnlock(enemy.id);
          addedToTeam = Boolean(captureUnlockSummary?.addedToTeam);
          captureXpSummary = awardCaptureBonusXpReward();
        } else {
          captureOnComplete = () => {
            awardCaptureCoinReward();
            incrementSpeciesStat(enemy.id, "captured", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
            if (enemy.isShiny) {
              notifyWindowsShinyCapture(enemy, { isCritical: captureCritical });
            }
            const captureUnlockSummary = resolveCaptureEntityUnlock(enemy.id);
            const captureAddedToTeam = Boolean(captureUnlockSummary?.addedToTeam);
            awardCaptureBonusXpReward();

            rebuildTeamAndSyncBattle();
            persistSaveDataForSimulationEvent();
            if (!state.simulationIdleMode) {
              updateHud();
            }
            return captureAddedToTeam;
          };
        }
      } else {
        awardKoXpReward();
      }
    }
  }
  if (!captureAttempted || (!captured && !xpRewardGranted)) {
    awardKoXpReward();
  }

  rebuildTeamAndSyncBattle();
  persistSaveDataForSimulationEvent();
  if (!state.simulationIdleMode) {
    updateHud();
  }
  return {
    captured,
    capture_attempted: captureAttempted,
    capture_critical: captureCritical,
    capture_ball_type: usedBallType,
    added_to_team: addedToTeam,
    capture_chance_display: captureChanceDisplay,
    capture_on_complete: captureOnComplete,
  };
}

function chooseStarter(starterId) {
  if (!state.saveData) {
    return;
  }
  const def = state.pokemonDefsById.get(Number(starterId));
  if (!def) {
    return;
  }

  state.saveData.starter_chosen = true;
  applyAutoGrantedProgress(def.id, STARTER_LEVEL);
  if (!state.saveData.team.includes(def.id)) {
    state.saveData.team = [def.id, ...state.saveData.team].slice(0, MAX_TEAM_SIZE);
  }
  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();

  hideStarterModal();
  const movedToRoute1 = applyRouteChange(ROUTE_1_TUTORIAL_ID, { announce: false });
  if (!movedToRoute1) {
    startBattle();
  }
  state.mode = "ready";
  setTopMessage(`${def.nameFr} rejoint ton equipe. Direction Route 1 !`, 1700);
  tryOpenPendingTutorialFlow();
}

function startBattle() {
  state.layout = computeLayout();
  if (!state.team.length || !isCurrentRouteCombatEnabled()) {
    state.battle = null;
    state.enemy = null;
    return;
  }

  state.battle = new PokemonBattleManager({
    team: state.team,
    attackIntervalMs: getCurrentAttackIntervalMs(),
    getAttackIntervalMs: () => getCurrentAttackIntervalMs(),
    createEnemy: createRouteEnemyInstance,
    onEnemySpawn: handleEnemySpawn,
    onEnemyDefeated: handleEnemyDefeated,
    getEnemyTimerConfig: (enemy) => getEnemyTimerConfigForBattle(enemy),
    onEnemyTimerExpired: handleEnemyTimerExpired,
  });
  state.enemy = state.battle.getEnemy();
}

function setTopMessage(text, durationMs = 1200) {
  if (!text) {
    return null;
  }
  return pushTemporaryNotification(String(text), durationMs, { tone: "info" });
}

function getRouteDisplayName(routeId) {
  const id = String(routeId || DEFAULT_ROUTE_ID);
  return state.routeCatalog.get(id)?.route_name_fr || id;
}

function getRouteNavigationState() {
  const unlockedRouteIds = getOrderedUnlockedRouteIds();
  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const currentUnlockedIndex = unlockedRouteIds.indexOf(currentRouteId);
  return {
    unlockedRouteIds,
    currentRouteId,
    currentUnlockedIndex,
  };
}

function isRouteUnlocked(routeId) {
  const id = String(routeId || "");
  if (!id) {
    return false;
  }
  return getOrderedUnlockedRouteIds().includes(id);
}

function refreshRouteUi() {
  const hasCatalog = state.routeCatalog?.size > 0;
  const orderedRoutes = getOrderedCatalogRouteIds();
  const { unlockedRouteIds, currentRouteId, currentUnlockedIndex } = getRouteNavigationState();
  const currentRouteName = getRouteDisplayName(currentRouteId);
  const progressState = getRouteUnlockProgressState(currentRouteId);
  const nextRouteId = progressState.nextRouteId;
  const unlockMode = progressState.unlockMode;
  const unlockTarget = progressState.unlockTarget;
  const currentDefeats = progressState.currentDefeats;
  const unlockedCount = unlockedRouteIds.length;
  const totalCount = Math.max(1, orderedRoutes.length);
  const orderIndex = getRouteOrderIndex(currentRouteId);
  const currentZoneType = getRouteZoneTypeLabel(currentRouteId);

  let progressLabel = `${unlockedCount}/${totalCount} zones debloquees`;
  if (nextRouteId) {
    const nextRouteName = getRouteDisplayName(nextRouteId);
    const nextUnlocked = unlockedRouteIds.includes(nextRouteId);
    if (nextUnlocked) {
      progressLabel = `${unlockedCount}/${totalCount} zones debloquees | ${nextRouteName} deja debloquee`;
    } else if (unlockMode === "visit") {
      progressLabel = `${unlockedCount}/${totalCount} zones debloquees | Cette ville debloque automatiquement ${nextRouteName}`;
    } else {
      const timerLabel = progressState.timerEnabled
        ? ` | ${Math.round(progressState.timerDurationMs / 1000)}s max/combat`
        : "";
      progressLabel =
        `${unlockedCount}/${totalCount} zones debloquees | ${currentDefeats}/${unlockTarget} KO d'affilee pour ${nextRouteName}` +
        timerLabel;
    }
  } else {
    progressLabel = `${unlockedCount}/${totalCount} zones debloquees | Toutes les zones FR/LG sont debloquees`;
  }

  if (routeNavCurrentEl) {
    routeNavCurrentEl.textContent = currentRouteName;
  }
  if (routeNavProgressEl) {
    routeNavProgressEl.textContent = "";
  }

  if (state.ui.mapOpen) {
    renderMapModal();
  }

  if (routePrevButtonEl) {
    routePrevButtonEl.disabled = !hasCatalog || !state.saveData || currentUnlockedIndex <= 0;
  }
  if (routeNextButtonEl) {
    routeNextButtonEl.disabled =
      !hasCatalog || !state.saveData || currentUnlockedIndex < 0 || currentUnlockedIndex >= unlockedRouteIds.length - 1;
  }
}

function applyRouteChange(routeId, options = {}) {
  const announce = options?.announce !== false;
  if (!state.saveData) {
    return false;
  }

  const desiredRouteId = String(routeId || "");
  const unlockedRouteIds = getOrderedUnlockedRouteIds();
  if (!unlockedRouteIds.includes(desiredRouteId)) {
    if (announce) {
      setTopMessage("Zone non debloquee.", 1400);
    }
    refreshRouteUi();
    return false;
  }

  const changed = setActiveRoute(desiredRouteId, { announceUnlock: announce });
  if (!changed) {
    if (announce) {
      setTopMessage("Impossible de changer de route.", 1600);
    }
    return false;
  }

  if (isCurrentRouteCombatEnabled()) {
    if (!state.battle) {
      startBattle();
    } else {
      state.battle.spawnEnemy();
      state.enemy = state.battle.getEnemy();
    }
  } else {
    state.battle = null;
    state.enemy = null;
    hideHoverPopup();
  }
  closeTeamContextMenu();
  clearCanvasHoverState();

  persistSaveData();
  updateHud();
  state.layout = computeLayout();
  render();

  if (announce) {
    const zoneType = getRouteZoneTypeLabel(desiredRouteId);
    setTopMessage(`${zoneType} active: ${getRouteDisplayName(desiredRouteId)}`, 1500);
  }
  return true;
}

function navigateRouteByOffset(offset) {
  if (!state.saveData) {
    return false;
  }

  const delta = Math.sign(toSafeInt(offset, 0));
  if (delta === 0) {
    return false;
  }

  const { unlockedRouteIds, currentRouteId } = getRouteNavigationState();
  const currentIndex = unlockedRouteIds.indexOf(currentRouteId);
  if (currentIndex < 0) {
    return false;
  }

  const desiredIndex = currentIndex + delta;
  if (desiredIndex < 0 || desiredIndex >= unlockedRouteIds.length) {
    return false;
  }

  return applyRouteChange(unlockedRouteIds[desiredIndex], { announce: true });
}

function updateHud() {
  const nowMs = Date.now();
  if (!state.saveData) {
    state.moneyHud.initialized = false;
    state.moneyHud.targetValue = 0;
    state.moneyHud.displayValue = 0;
    state.moneyHud.lastRawValue = 0;
    state.moneyHud.pulseMs = 0;
    setMoneyCounterTextValue(0);
    setCoinsCounterTextValue(0);
    refreshMoneyCounterTransform();
    refreshShopWalletPanel(state.ui.shopTab || SHOP_TAB_POKEBALLS);
    updateSaveBackendIndicator();
    refreshRouteUi();
    state.lastHudAutoUpdateMs = nowMs;
    return;
  }

  ensureMoneyAndItems();
  const rawMoney = Math.max(0, toSafeInt(state.saveData.money, 0));
  if (!state.moneyHud.initialized) {
    state.moneyHud.initialized = true;
    state.moneyHud.targetValue = rawMoney;
    state.moneyHud.displayValue = rawMoney;
    state.moneyHud.lastRawValue = rawMoney;
    setMoneyCounterTextValue(rawMoney);
    refreshMoneyCounterTransform();
  } else {
    const previousRaw = Math.max(0, toSafeInt(state.moneyHud.lastRawValue, rawMoney));
    state.moneyHud.targetValue = rawMoney;
    if (rawMoney > previousRaw) {
      spawnMoneyGainFloater(rawMoney - previousRaw);
      state.moneyHud.pulseMs = MONEY_COUNTER_PULSE_MS;
    }
    state.moneyHud.lastRawValue = rawMoney;
  }
  setCoinsCounterTextValue(Math.max(0, toSafeInt(state.saveData.coins, 0)));
  refreshShopWalletPanel(state.ui.shopTab || SHOP_TAB_POKEBALLS);
  updateSaveBackendIndicator();
  refreshRouteUi();
  state.lastHudAutoUpdateMs = nowMs;
}

function compareShopItems(a, b) {
  return (
    Math.max(0, toSafeInt(a?.sortOrder, 0)) - Math.max(0, toSafeInt(b?.sortOrder, 0))
    || String(a?.nameFr || a?.id || "").localeCompare(String(b?.nameFr || b?.id || ""))
  );
}

function getShopItemsByTab(tabId) {
  const tab = String(tabId || SHOP_TAB_POKEBALLS);
  const items = Object.values(SHOP_ITEM_CONFIG_BY_ID).filter((entry) => entry.category === tab);
  if (tab === SHOP_TAB_POKEBALLS) {
    return BALL_TYPE_FALLBACK_ORDER.map((ballType) => items.find((item) => item.ballType === ballType)).filter(Boolean);
  }
  return items.slice().sort(compareShopItems);
}

function normalizeShopQuantityMode(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (raw === SHOP_QUANTITY_MODE_CUSTOM) {
    return SHOP_QUANTITY_MODE_CUSTOM;
  }
  if (raw === SHOP_QUANTITY_MODE_MAX) {
    return SHOP_QUANTITY_MODE_MAX;
  }
  const numeric = Math.max(1, toSafeInt(raw, 1));
  return SHOP_QUANTITY_PRESET_SET.has(String(numeric)) ? String(numeric) : "1";
}

function getShopBallUnitPrice(itemOrPrice) {
  if (itemOrPrice && typeof itemOrPrice === "object") {
    return Math.max(0, toSafeInt(itemOrPrice.price, 0));
  }
  return Math.max(0, toSafeInt(itemOrPrice, 0));
}

function getShopBallRemainingCapacity(itemOrPrice) {
  if (!itemOrPrice || typeof itemOrPrice !== "object") {
    return BALL_INVENTORY_MAX_PER_TYPE;
  }
  const ballType = String(itemOrPrice.ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, ballType)) {
    return BALL_INVENTORY_MAX_PER_TYPE;
  }
  return getBallInventoryRemainingCapacity(ballType);
}

function hasPendingFirstFreePokeballPurchase() {
  return Boolean(state.saveData && !state.saveData.first_free_pokeball_claimed);
}

function getShopBallPurchasePricing(itemOrPrice, quantity) {
  const unitPrice = getShopBallUnitPrice(itemOrPrice);
  const remainingCapacity = getShopBallRemainingCapacity(itemOrPrice);
  const requestedQuantity = Math.min(Math.max(0, toSafeInt(quantity, 0)), remainingCapacity);
  const freeQuantity = hasPendingFirstFreePokeballPurchase() ? Math.min(1, requestedQuantity) : 0;
  const paidQuantity = Math.max(0, requestedQuantity - freeQuantity);
  const totalCost = Math.max(0, unitPrice * paidQuantity);
  return {
    unitPrice,
    requestedQuantity,
    freeQuantity,
    paidQuantity,
    totalCost,
  };
}

function consumeFirstFreePokeballPurchaseBonus() {
  if (!state.saveData || !hasPendingFirstFreePokeballPurchase()) {
    return false;
  }
  state.saveData.first_free_pokeball_claimed = true;
  state.saveData.first_free_pokeball_guaranteed_capture_pending = true;
  return true;
}

function consumePendingGuaranteedCaptureBonus() {
  if (!state.saveData || !state.saveData.first_free_pokeball_guaranteed_capture_pending) {
    return false;
  }
  state.saveData.first_free_pokeball_guaranteed_capture_pending = false;
  return true;
}

function getMaxAffordableShopBallQuantity(itemOrPrice) {
  const unitPrice = getShopBallUnitPrice(itemOrPrice);
  const remainingCapacity = getShopBallRemainingCapacity(itemOrPrice);
  if (remainingCapacity <= 0) {
    return 0;
  }
  const currentMoney = Math.max(0, toSafeInt(state.saveData?.money, 0));
  if (unitPrice <= 0) {
    const bonusQuantity = hasPendingFirstFreePokeballPurchase() ? 1 : 0;
    return Math.max(0, Math.min(remainingCapacity, bonusQuantity));
  }
  const paidQuantity = currentMoney < unitPrice ? 0 : Math.max(0, Math.floor(currentMoney / unitPrice));
  const bonusQuantity = hasPendingFirstFreePokeballPurchase() ? 1 : 0;
  return Math.max(0, Math.min(remainingCapacity, paidQuantity + bonusQuantity));
}

function getSelectedShopBallQuantity(options = {}) {
  const mode = normalizeShopQuantityMode(options.mode ?? state.ui.shopQuantityMode);
  const itemOrPrice = options.item ?? options.unitPrice ?? options.price ?? null;
  let quantity = 0;
  if (mode === SHOP_QUANTITY_MODE_CUSTOM) {
    quantity = Math.max(1, toSafeInt(state.ui.shopCustomQuantity, 1));
  } else if (mode === SHOP_QUANTITY_MODE_MAX) {
    quantity = getMaxAffordableShopBallQuantity(itemOrPrice);
  } else {
    quantity = Math.max(1, toSafeInt(mode, 1));
  }
  const remainingCapacity = getShopBallRemainingCapacity(itemOrPrice);
  return Math.max(0, Math.min(quantity, remainingCapacity));
}

function getSelectedShopBallQuantitySummaryLabel() {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  if (mode === SHOP_QUANTITY_MODE_MAX) {
    return "MAX";
  }
  return `x${getSelectedShopBallQuantity({ mode })}`;
}

function getShopBuyQuantityButtonLabel(item) {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  const remainingCapacity = getShopBallRemainingCapacity(item);
  if (remainingCapacity <= 0) {
    return "Stock max atteint";
  }
  const quantity = getSelectedShopBallQuantity({ item, mode });
  if (mode === SHOP_QUANTITY_MODE_MAX) {
    return quantity > 0 ? `Acheter MAX (${quantity})` : "Acheter MAX";
  }
  return quantity > 0 ? `Acheter x${quantity}` : "Acheter";
}

function setShopQuantityMode(mode) {
  state.ui.shopQuantityMode = normalizeShopQuantityMode(mode);
  if (state.ui.shopQuantityMode === SHOP_QUANTITY_MODE_CUSTOM) {
    state.ui.shopCustomQuantity = clamp(toSafeInt(state.ui.shopCustomQuantity, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
  } else if (state.ui.shopQuantityMode !== SHOP_QUANTITY_MODE_MAX) {
    state.ui.shopCustomQuantity = clamp(toSafeInt(state.ui.shopQuantityMode, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
  }
  syncShopQuantityControls();
  renderShopModal();
}

function syncShopQuantityControls() {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  for (const button of shopQtyPresetButtonEls) {
    const buttonMode = normalizeShopQuantityMode(button.dataset.shopQty || "1");
    button.classList.toggle("is-active", buttonMode === mode);
  }
  if (shopCustomQtyInputEl) {
    shopCustomQtyInputEl.disabled = mode !== SHOP_QUANTITY_MODE_CUSTOM;
    const value = clamp(toSafeInt(state.ui.shopCustomQuantity, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
    if (toSafeInt(shopCustomQtyInputEl.value, value) !== value) {
      shopCustomQtyInputEl.value = String(value);
    }
  }
}

function setShopTab(tabId) {
  const requested = String(tabId || SHOP_TAB_POKEBALLS).toLowerCase();
  const valid = [SHOP_TAB_POKEBALLS, SHOP_TAB_COMBAT, SHOP_TAB_EVOLUTIONS].includes(requested)
    ? requested
    : SHOP_TAB_POKEBALLS;
  state.ui.shopTab = valid;
  for (const button of shopTabButtonEls) {
    const buttonTab = String(button.dataset.shopTab || "");
    button.classList.toggle("is-active", buttonTab === valid);
  }
  if (shopPokeballQtyPanelEl) {
    shopPokeballQtyPanelEl.classList.toggle("hidden", valid !== SHOP_TAB_POKEBALLS);
  }
  renderShopModal();
}

function formatDurationToClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Math.max(0, Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function useEvolutionStoneFromShop(stoneType) {
  if (!state.saveData) {
    return false;
  }
  const key = String(stoneType || "").toLowerCase().trim();
  const stoneConfig = EVOLUTION_STONE_CONFIG_BY_TYPE[key];
  if (!stoneConfig) {
    return false;
  }

  const candidates = findEvolutionStoneCandidates(key);
  if (candidates.length <= 0) {
    setTopMessage(`${stoneConfig.nameFr}: aucune evolution eligibile pour l'instant.`, 1700);
    return false;
  }

  const chosen = await promptEvolutionStoneChoice(key, candidates);
  if (!chosen) {
    return false;
  }

  if (!consumeShopItemCount(key, 1)) {
    setTopMessage(`Aucune ${stoneConfig.nameFr} en stock.`, 1500);
    updateHud();
    return false;
  }

  const conditionMarked = setEvolutionItemConditionReady(chosen.fromId, chosen.toId);
  if (!conditionMarked) {
    addShopItemCount(key, 1);
    setTopMessage(`${stoneConfig.nameFr}: impossible de l'utiliser sur ce Pokemon.`, 1600);
    updateHud();
    renderShopModal();
    return false;
  }

  enqueueEvolutionReadyNotification({
    fromId: chosen.fromId,
    toId: chosen.toId,
    fromNameFr: chosen.fromNameFr,
    toNameFr: chosen.toNameFr,
  });
  persistSaveData();
  updateHud();
  render();
  setTopMessage(`${stoneConfig.nameFr} utilisee: ${chosen.fromNameFr} est maintenant pret a evoluer.`, 1800);
  return true;
}

function setBallTypeAsActive(ballType) {
  if (!state.saveData) {
    return false;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  if (getBallInventoryCount(type) <= 0) {
    setTopMessage(`Aucune ${BALL_CONFIG_BY_TYPE[type].nameFr} en stock.`, 1400);
    return false;
  }
  if (isBallTypeComingSoon(type)) {
    setTopMessage(`${BALL_CONFIG_BY_TYPE[type].nameFr}: bientot disponible.`, 1400);
    return false;
  }
  setActiveBallType(type);
  persistSaveData();
  updateHud();
  renderShopModal();
  setTopMessage(`${BALL_CONFIG_BY_TYPE[type].nameFr} equipee pour les captures.`, 1400);
  return true;
}

function buyShopItem(itemId) {
  if (!state.saveData) {
    return false;
  }
  const item = SHOP_ITEM_CONFIG_BY_ID[String(itemId || "")];
  if (!item) {
    return false;
  }

  if (item.itemType === "ball") {
    if (isBallTypeComingSoon(item.ballType)) {
      setTopMessage(`${item.nameFr}: bientot disponible.`, 1400);
      return false;
    }
    const remainingCapacity = getBallInventoryRemainingCapacity(item.ballType);
    if (remainingCapacity <= 0) {
      setTopMessage(`Stock max atteint pour ${item.nameFr} (${BALL_INVENTORY_MAX_PER_TYPE}).`, 1600);
      updateHud();
      renderShopModal();
      return false;
    }
    const quantity = getSelectedShopBallQuantity({ item });
    const pricing = getShopBallPurchasePricing(item, quantity);
    if (pricing.requestedQuantity <= 0) {
      setTopMessage(`Pas assez d'argent pour acheter ${item.nameFr}.`, 1500);
      updateHud();
      renderShopModal();
      return false;
    }
    if (!spendMoney(pricing.totalCost)) {
      setTopMessage(
        `Pas assez d'argent pour ${pricing.requestedQuantity} ${item.nameFr} (${pricing.totalCost} Poke$).`,
        1500,
      );
      updateHud();
      return false;
    }
    addBallItems(item.ballType, pricing.requestedQuantity);
    const firstPurchaseBonusApplied = pricing.freeQuantity > 0 && consumeFirstFreePokeballPurchaseBonus();
    if (getBallInventoryCount(getActiveBallType()) <= 0) {
      setActiveBallType(item.ballType);
    }
    persistSaveData();
    updateHud();
    renderShopModal();
    if (firstPurchaseBonusApplied) {
      setTopMessage(
        `Achat: ${pricing.requestedQuantity} ${item.nameFr} pour ${pricing.totalCost} Poke$. 1ere PokeBall offerte, prochaine capture garantie.`,
        2200,
      );
    } else {
      setTopMessage(`Achat: ${pricing.requestedQuantity} ${item.nameFr} pour ${pricing.totalCost} Poke$.`, 1500);
    }
    return true;
  }

  if (item.itemType === "boost") {
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    if (!spendMoney(totalCost)) {
      setTopMessage(`Pas assez d'argent pour ${item.nameFr}.`, 1500);
      updateHud();
      return false;
    }
    const remainingMs = activateAttackBoost(getAttackBoostDurationMsFromConfig());
    persistSaveData();
    updateHud();
    renderShopModal();
    setTopMessage(`${item.nameFr} active (${formatDurationToClock(remainingMs)}).`, 1700);
    return true;
  }

  if (item.itemType === "stone") {
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    if (!spendMoney(totalCost)) {
      setTopMessage(`Pas assez d'argent pour ${item.nameFr}.`, 1500);
      updateHud();
      return false;
    }
    addShopItemCount(item.stoneType, 1);
    persistSaveData();
    updateHud();
    renderShopModal();
    setTopMessage(`Achat: ${item.nameFr} ajoutee au stock.`, 1500);
    return true;
  }

  return false;
}

function createShopItemCard(item) {
  const card = document.createElement("article");
  card.className = "shop-item-card";

  const media = document.createElement("div");
  media.className = "shop-item-media";
  if (item.spritePath) {
    const image = document.createElement("img");
    image.alt = item.nameFr;
    image.src = item.spritePath;
    media.appendChild(image);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "shop-item-fallback";
    fallback.textContent = item.nameFr.slice(0, 1).toUpperCase();
    media.appendChild(fallback);
  }
  card.appendChild(media);

  const content = document.createElement("div");
  content.className = "shop-item-content";

  const nameEl = document.createElement("div");
  nameEl.className = "shop-item-name";
  nameEl.textContent = item.nameFr;
  content.appendChild(nameEl);

  const priceEl = document.createElement("div");
  priceEl.className = "shop-item-price";
  priceEl.textContent = `${item.price} Poke$`;
  content.appendChild(priceEl);

  const descEl = document.createElement("div");
  descEl.className = "shop-item-desc";
  descEl.textContent = item.description;
  content.appendChild(descEl);
  card.appendChild(content);

  const footer = document.createElement("div");
  footer.className = "shop-item-footer";

  const stockEl = document.createElement("div");
  stockEl.className = "shop-item-stock";

  const actionRow = document.createElement("div");
  actionRow.className = "shop-item-actions";
  const currentMoney = Math.max(0, toSafeInt(state.saveData?.money, 0));
  let canAffordItem = true;
  let isComingSoonItem = false;

  const primaryButton = document.createElement("button");
  primaryButton.type = "button";
  primaryButton.className = "shop-item-buy-btn";
  primaryButton.textContent = "Acheter";
  primaryButton.addEventListener("click", () => {
    buyShopItem(item.id);
  });
  actionRow.appendChild(primaryButton);

  if (item.itemType === "ball") {
    const stockCount = getBallInventoryCount(item.ballType);
    const isActive = getActiveBallType() === item.ballType;
    const isComingSoon = isBallTypeComingSoon(item.ballType);
    const remainingCapacity = getBallInventoryRemainingCapacity(item.ballType);
    const stockMaxReached = remainingCapacity <= 0;
    const quantity = getSelectedShopBallQuantity({ item });
    const pricing = getShopBallPurchasePricing(item, quantity);
    const canAfford = !stockMaxReached && pricing.requestedQuantity > 0 && currentMoney >= pricing.totalCost;
    canAffordItem = canAfford;
    if (isComingSoon) {
      stockEl.textContent = "Bientot disponible";
      primaryButton.textContent = "Bientot disponible";
      primaryButton.disabled = true;
      primaryButton.title = "Cette ball sera ajoutee plus tard.";
      canAffordItem = false;
      isComingSoonItem = true;
    } else {
      stockEl.textContent = `Stock: ${stockCount}/${BALL_INVENTORY_MAX_PER_TYPE} • Actif: ${isActive ? "Oui" : "Non"}`;
      primaryButton.textContent = getShopBuyQuantityButtonLabel(item);
      if (pricing.freeQuantity > 0) {
        stockEl.textContent += " | 1ere ball offerte";
      }
      if (stockMaxReached) {
        primaryButton.textContent = "Stock max atteint";
        primaryButton.disabled = true;
        primaryButton.title = `Limite atteinte (${BALL_INVENTORY_MAX_PER_TYPE}).`;
        stockEl.textContent += " | Stock max atteint";
      } else {
        primaryButton.disabled = !canAfford;
        if (!canAfford) {
          primaryButton.title = "Pas assez d'argent.";
          const missingMoney = pricing.requestedQuantity > 0
            ? Math.max(0, pricing.totalCost - currentMoney)
            : Math.max(0, toSafeInt(item.price, 0) - currentMoney);
          stockEl.textContent += ` | Manque: ${formatPokeDollarValue(missingMoney)} Poke$`;
        }
      }

      const equipButton = document.createElement("button");
      equipButton.type = "button";
      equipButton.className = "shop-item-buy-btn is-secondary";
      equipButton.textContent = isActive ? "Actif" : "Equiper";
      equipButton.disabled = isActive || stockCount <= 0;
      equipButton.addEventListener("click", () => {
        setBallTypeAsActive(item.ballType);
      });
      actionRow.appendChild(equipButton);
    }
  } else if (item.itemType === "boost") {
    const remainingMs = getAttackBoostRemainingMs();
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    const canAfford = currentMoney >= totalCost;
    canAffordItem = canAfford;
    primaryButton.disabled = !canAfford;
    if (!canAfford) {
      primaryButton.title = "Pas assez d'argent.";
    }
    if (remainingMs > 0) {
      stockEl.textContent = `Actif: ${formatDurationToClock(remainingMs)} restantes`;
      primaryButton.textContent = "Prolonger";
    } else {
      stockEl.textContent = "Inactif";
      primaryButton.textContent = "Activer";
    }
    if (!canAfford) {
      const missingMoney = Math.max(0, totalCost - currentMoney);
      stockEl.textContent += ` | Manque: ${formatPokeDollarValue(missingMoney)} Poke$`;
    }
  } else if (item.itemType === "stone") {
    const stoneStock = getShopItemCount(item.stoneType);
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    const canAfford = currentMoney >= totalCost;
    canAffordItem = canAfford;
    stockEl.textContent = `Stock: ${stoneStock}`;
    primaryButton.textContent = "Acheter";
    primaryButton.disabled = !canAfford;
    if (!canAfford) {
      primaryButton.title = "Pas assez d'argent.";
      const missingMoney = Math.max(0, totalCost - currentMoney);
      stockEl.textContent += ` | Manque: ${formatPokeDollarValue(missingMoney)} Poke$`;
    }

    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "shop-item-buy-btn is-secondary";
    useButton.textContent = "Utiliser";
    useButton.disabled = stoneStock <= 0;
    useButton.addEventListener("click", () => {
      void useEvolutionStoneFromShop(item.stoneType);
    });
    actionRow.appendChild(useButton);
  } else {
    stockEl.textContent = "";
  }

  card.classList.toggle("is-coming-soon", isComingSoonItem);
  card.classList.toggle("is-expensive", !isComingSoonItem && !canAffordItem);
  card.classList.toggle("is-affordable", !isComingSoonItem && canAffordItem);
  footer.appendChild(stockEl);
  footer.appendChild(actionRow);
  card.appendChild(footer);
  return card;
}

function renderShopModal() {
  if (!shopGridEl || !state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  const activeTab = String(state.ui.shopTab || SHOP_TAB_POKEBALLS);
  const items = getShopItemsByTab(activeTab);
  refreshShopWalletPanel(activeTab);

  if (shopModalSubtitleEl) {
    if (activeTab === SHOP_TAB_POKEBALLS) {
      shopModalSubtitleEl.textContent = "Achete des balls et choisis celle utilisee pour les captures.";
    } else if (activeTab === SHOP_TAB_COMBAT) {
      shopModalSubtitleEl.textContent = "Objets de combat temporaires pour accelerer les attaques.";
    } else {
      shopModalSubtitleEl.textContent =
        "Objets d'evolution: leur usage remplit la condition puis ajoute une notif permanente 'Evoluer'.";
    }
  }

  syncShopQuantityControls();
  for (const button of shopTabButtonEls) {
    const buttonTab = String(button.dataset.shopTab || "");
    button.classList.toggle("is-active", buttonTab === activeTab);
  }
  if (shopPokeballQtyPanelEl) {
    shopPokeballQtyPanelEl.classList.toggle("hidden", activeTab !== SHOP_TAB_POKEBALLS);
  }

  shopGridEl.innerHTML = "";
  if (items.length <= 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "shop-empty";
    emptyEl.textContent = "Aucun objet dans cet onglet.";
    shopGridEl.appendChild(emptyEl);
    return;
  }

  for (const item of items) {
    shopGridEl.appendChild(createShopItemCard(item));
  }
}

function setShopOpen(open) {
  if (open && state.ui.tutorialOpen) {
    return;
  }
  state.ui.shopOpen = Boolean(open);
  if (!shopModalEl) {
    return;
  }
  if (state.ui.shopOpen) {
    setMapOpen(false);
    closeTeamContextMenu();
    clearCanvasHoverState();
    closeRenameModal();
    closeBoxesModal();
    closeAppearanceModal();
    closeEvolutionItemChoiceModal(null);
    shopModalEl.classList.remove("hidden");
    if (!state.ui.shopTab) {
      state.ui.shopTab = SHOP_TAB_POKEBALLS;
    }
    setShopTab(state.ui.shopTab);
  } else {
    closeEvolutionItemChoiceModal(null);
    shopModalEl.classList.add("hidden");
  }
}

function toggleShopPanel() {
  setShopOpen(!state.ui.shopOpen);
}

function handleMapMarkerClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const routeId = String(event?.currentTarget?.dataset?.routeId || "");
  if (!routeId) {
    return;
  }
  if (!isRouteUnlocked(routeId)) {
    setTopMessage("Zone non debloquee.", 1400);
    return;
  }
  applyRouteChange(routeId, { announce: true });
  setMapOpen(false);
}

function renderMapModal() {
  if (!mapMarkersEl || !state.routeCatalog?.size || !state.saveData) {
    return;
  }
  applyMapReferenceImage();
  syncMapMarkerLayerBounds();
  const orderedIds = getOrderedCatalogRouteIds();
  const unlockedIds = new Set(getOrderedUnlockedRouteIds());
  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const renderedRouteIds = new Set();

  for (const routeId of orderedIds) {
    const marker = getRouteMapMarker(routeId);
    if (!marker) {
      continue;
    }
    renderedRouteIds.add(routeId);
    const zoneName = getRouteDisplayName(routeId);
    const zoneTypeKey = getRouteZoneType(routeId);
    const zoneType = getRouteZoneTypeLabel(routeId);
    const isUnlocked = unlockedIds.has(routeId);
    const isCurrent = routeId === currentRouteId;

    let button = mapMarkerButtonsByRouteId.get(routeId);
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "map-marker-btn";
      button.dataset.routeId = routeId;
      button.addEventListener("click", handleMapMarkerClick);
      mapMarkerButtonsByRouteId.set(routeId, button);
    }
    if (button.parentElement !== mapMarkersEl) {
      mapMarkersEl.appendChild(button);
    }
    button.classList.toggle("is-unlocked", isUnlocked);
    button.classList.toggle("is-current", isCurrent);
    button.classList.toggle("is-locked", !isUnlocked);
    button.classList.toggle("is-route", zoneTypeKey === "route");
    button.classList.toggle("is-town", zoneTypeKey === "town");
    button.classList.toggle("is-dungeon", zoneTypeKey === "dungeon");
    button.dataset.routeType = zoneTypeKey;
    button.style.left = `${marker.x}%`;
    button.style.top = `${marker.y}%`;
    button.disabled = !isUnlocked;
    button.title = `${zoneType}: ${zoneName}${isUnlocked ? "" : " (verrouillee)"}`;
    button.setAttribute("aria-label", button.title);
  }

  for (const [routeId, button] of mapMarkerButtonsByRouteId.entries()) {
    if (renderedRouteIds.has(routeId)) {
      continue;
    }
    button.remove();
    mapMarkerButtonsByRouteId.delete(routeId);
  }
  window.requestAnimationFrame(() => {
    if (!state.ui.mapOpen) {
      return;
    }
    syncMapMarkerLayerBounds();
  });
}

function setMapOpen(open) {
  if (open && state.ui.tutorialOpen) {
    return;
  }
  state.ui.mapOpen = Boolean(open);
  if (!mapModalEl) {
    return;
  }
  if (state.ui.mapOpen) {
    closeTeamContextMenu();
    clearCanvasHoverState();
    closeRenameModal();
    closeBoxesModal();
    closeAppearanceModal();
    closeEvolutionItemChoiceModal(null);
    setShopOpen(false);
    applyMapReferenceImage();
    mapModalEl.classList.remove("hidden");
    syncMapMarkerLayerBounds();
    renderMapModal();
    window.requestAnimationFrame(() => {
      if (!state.ui.mapOpen) {
        return;
      }
      syncMapMarkerLayerBounds();
      renderMapModal();
    });
  } else {
    mapModalEl.classList.add("hidden");
  }
}

function isCoarsePointerDevice() {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

function getBattleViewportProfile(width, height) {
  const safeWidth = Math.max(1, Number(width) || 0);
  const safeHeight = Math.max(1, Number(height) || 0);
  const portrait = safeHeight > safeWidth * 1.05;
  const coarsePointer = isCoarsePointerDevice();
  const compact = coarsePointer || safeWidth <= 900 || safeHeight <= 640;
  const phone = compact && Math.min(safeWidth, safeHeight) <= 500;
  return {
    coarsePointer,
    compact,
    phone,
    portrait,
  };
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

function buildArcSlotPositions({ count, axis, spreadMain, arcDepth, baseX, baseY }) {
  const positions = [];
  if (count <= 0) {
    return positions;
  }
  const steps = count === 1 ? [0] : [-1, 0, 1].slice(0, count);
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

function computeLayout() {
  const width = Math.max(260, Number(state.viewport.width) || 0);
  const height = Math.max(220, Number(state.viewport.height) || 0);
  const profile = getBattleViewportProfile(width, height);
  const overlayPadding = getOverlayPaddingSnapshot();
  const topHudHeight =
    getElementClientHeight(uiTopbarEl)
    || clamp(height * (profile.phone ? 0.17 : profile.compact ? 0.13 : 0.1), 54, profile.phone ? 122 : 92);
  const bottomHudHeight =
    getElementClientHeight(actionDockEl)
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
  const enemySize = clamp(
    Math.min(playWidth, playHeight) * (useSplitRows ? 0.236 : profile.compact ? 0.278 : 0.305),
    useSplitRows ? 84 : 118,
    useSplitRows ? 168 : 236,
  );
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
    useSplitRows ? 106 : 172,
  );
  const teamHudHeight = clamp(
    teamHudBaseHeight * teamHudScale,
    28,
    useSplitRows ? 42 : 66,
  );
  const teamTypeChipHeight = clamp(teamSize * 0.17, 11, 18);
  const cardMargin = 6;
  const teamSlots = [];

  if (useSplitRows) {
    const rowInsetY = clamp(playHeight * 0.24, teamSize * 1.55, playHeight * 0.33);
    const topGroupY = clamp(
      playTop + rowInsetY,
      playTop + teamSize * 0.9,
      playTop + playHeight * 0.42,
    );
    const bottomGroupY = clamp(
      playBottom - rowInsetY,
      playTop + playHeight * 0.58,
      playBottom - teamSize * 0.9,
    );
    centerY = clamp(
      (topGroupY + bottomGroupY) * 0.5,
      playTop + enemySize * 0.88,
      playBottom - enemySize * 0.88,
    );
    const spreadX = clamp(playWidth * 0.255, teamSize * 1.45, teamSize * 2.2);
    const arcDepth = clamp(playHeight * 0.055, teamSize * 0.22, teamSize * 0.58);

    const topSlots = buildArcSlotPositions({
      count: 3,
      axis: "x",
      spreadMain: spreadX,
      arcDepth: -arcDepth,
      baseX: centerX,
      baseY: topGroupY,
    });
    const bottomSlots = buildArcSlotPositions({
      count: 3,
      axis: "x",
      spreadMain: spreadX,
      arcDepth,
      baseX: centerX,
      baseY: bottomGroupY,
    });
    const clockwisePortraitPlacement = [
      { row: "top", index: 0 },
      { row: "top", index: 1 },
      { row: "top", index: 2 },
      { row: "bottom", index: 2 },
      { row: "bottom", index: 1 },
      { row: "bottom", index: 0 },
    ];
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const placement = clockwisePortraitPlacement[i] || { row: "top", index: 1 };
      const isTopRow = placement.row === "top";
      const source = isTopRow ? topSlots[placement.index] : bottomSlots[placement.index];
      const x = clamp(source?.x ?? centerX, playLeft + teamSize * 0.6, playRight - teamSize * 0.6);
      let y = clamp(source?.y ?? centerY, playTop + teamSize * 0.65, playBottom - teamSize * 0.65);
      if (isTopRow) {
        y = Math.min(y, centerY - enemySize * 0.44);
      } else {
        y = Math.max(y, centerY + enemySize * 0.44);
      }
      const dirX = Math.sign(x - centerX) || (x >= centerX ? 1 : -1);
      const dirY = isTopRow ? -1 : 1;
      let hudCenterX = x + dirX * (teamSize * 0.38 + teamHudWidth * 0.28);
      let hudCenterY = y + dirY * (teamSize * 0.68 + teamHudHeight * 0.62);
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
    centerY = playTop + playHeight * 0.5;
    const spreadY = clamp(playHeight * 0.22, teamSize * 1.38, teamSize * 1.96);
    const arcDepth = clamp(playWidth * 0.055, teamSize * 0.24, teamSize * 0.66);
    const sideOffset = clamp(enemySize * 1.18 + teamSize * 0.44, teamSize * 1.72, playWidth * 0.3);
    const leftX = centerX - sideOffset;
    const rightX = centerX + sideOffset;
    const leftSlots = buildArcSlotPositions({
      count: 3,
      axis: "y",
      spreadMain: spreadY,
      arcDepth: -arcDepth,
      baseX: leftX,
      baseY: centerY,
    });
    const rightSlots = buildArcSlotPositions({
      count: 3,
      axis: "y",
      spreadMain: spreadY,
      arcDepth,
      baseX: rightX,
      baseY: centerY,
    });
    const clockwiseLandscapePlacement = [
      { side: "left", index: 0 },
      { side: "right", index: 0 },
      { side: "right", index: 1 },
      { side: "right", index: 2 },
      { side: "left", index: 2 },
      { side: "left", index: 1 },
    ];
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const placement = clockwiseLandscapePlacement[i] || { side: "left", index: 1 };
      const isLeftSide = placement.side === "left";
      const source = isLeftSide ? leftSlots[placement.index] : rightSlots[placement.index];
      let x = clamp(source?.x ?? centerX, playLeft + teamSize * 0.6, playRight - teamSize * 0.6);
      const y = clamp(source?.y ?? centerY, playTop + teamSize * 0.6, playBottom - teamSize * 0.6);
      if (isLeftSide) {
        x = Math.min(x, centerX - enemySize * 0.62);
      } else {
        x = Math.max(x, centerX + enemySize * 0.62);
      }
      const dirX = isLeftSide ? -1 : 1;
      const dirY = Math.sign(y - centerY);
      let hudCenterX = x + dirX * (teamSize * 0.85 + teamHudWidth * 0.54);
      let hudCenterY = y + dirY * (teamSize * 0.18);
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
  const enemyImpactY = clamp(
    centerY + enemySize * (useSplitRows ? 0.04 : 0.03),
    playTop + enemySize * 0.22,
    playBottom - enemySize * 0.22,
  );
  const enemyUiTop = centerY + enemySize * (useSplitRows ? 0.66 : 0.62);
  const hpBarMinY = centerY + enemySize * 0.42;
  const hpBarMaxY = playBottom - (useSplitRows ? 98 : 114);
  const hpBarY = clamp(enemyUiTop, Math.min(hpBarMinY, hpBarMaxY), Math.max(hpBarMinY, hpBarMaxY));
  const enemyNameMinY = hpBarY + hpBarHeight + 6;
  const enemyNameMaxY = playBottom - (useSplitRows ? 70 : 78);
  const enemyNameTopY = clamp(
    hpBarY + hpBarHeight + (useSplitRows ? 8 : 10),
    Math.min(enemyNameMinY, enemyNameMaxY),
    Math.max(enemyNameMinY, enemyNameMaxY),
  );
  const enemyTypeMinY = enemyNameTopY + 14;
  const enemyTypeMaxY = playBottom - 14;
  const enemyTypeHudY = clamp(
    enemyNameTopY + (useSplitRows ? 22 : 24),
    Math.min(enemyTypeMinY, enemyTypeMaxY),
    Math.max(enemyTypeMinY, enemyTypeMaxY),
  );

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
    enemyNamePlateWidth: clamp(hpBarWidth * 0.74, 108, useSplitRows ? 164 : 224),
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
  const baseColor = Array.isArray(tintColor) ? tintColor : [255, 255, 255];
  const wasSmoothing = ctx.imageSmoothingEnabled;
  const shaderFilter = buildSpriteShaderFilter(shader);

  if (blend <= 0.001 || !spriteTintBufferCtx) {
    ctx.imageSmoothingEnabled = false;
    const previousFilter = ctx.filter;
    if (shaderFilter !== "none") {
      ctx.filter = shaderFilter;
    }
    ctx.drawImage(image, snappedDrawX, snappedDrawY, snappedDrawWidth, snappedDrawHeight);
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
  bufferCtx.drawImage(image, 0, 0, width, height);
  bufferCtx.globalCompositeOperation = "source-atop";
  bufferCtx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${blend})`;
  bufferCtx.fillRect(0, 0, width, height);
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
  const offsetX = Number.isFinite(options.offsetX) ? options.offsetX : 0;
  const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : 0;
  ctx.translate(snapSpriteValue(x + offsetX), snapSpriteValue(y + offsetY));
  const drawAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  ctx.globalAlpha = drawAlpha;
  const baseScale = Number.isFinite(options.scale) ? Math.max(0, options.scale) : 1;
  const scaleX = Number.isFinite(options.scaleX) ? Math.max(0, options.scaleX) : baseScale;
  const scaleY = Number.isFinite(options.scaleY) ? Math.max(0, options.scaleY) : baseScale;
  const flipX = options.flipX ? -1 : 1;
  ctx.scale(scaleX * flipX, scaleY);
  const shinyVisual = Boolean(options.shinyVisual || entity?.isShinyVisual || entity?.isShiny);
  const ultraShinyVisual = Boolean(options.ultraShinyVisual || entity?.isUltraShinyVisual || entity?.isUltraShiny);
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
  const shaderConfig = mergeSpriteShaderConfig(customShaderConfig, ultraShaderConfig);
  const resolvedSpriteSource = resolveEntitySpriteDrawSource(entity);
  const spriteImage = resolvedSpriteSource.source;
  const renderSize = size * getPokemonDataSpriteScale(entity);
  let spriteDrawX = -renderSize * 0.5;
  let spriteDrawY = -renderSize * 0.5;
  let spriteDrawWidth = renderSize;
  let spriteDrawHeight = renderSize;
  let spriteUsedImage = false;

  ctx.fillStyle = `rgba(0, 0, 0, ${POKEMON_SHADOW_ALPHA})`;
  ctx.beginPath();
  ctx.ellipse(0, renderSize * 0.34, renderSize * 0.28, renderSize * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDrawableImage(spriteImage)) {
    const dims = getDrawableImageDimensions(spriteImage);
    const sourceWidth = dims.width;
    const sourceHeight = dims.height;
    const ratio = sourceWidth / Math.max(sourceHeight, 1);
    let drawWidth = snapSpriteDimension(renderSize);
    let drawHeight = snapSpriteDimension(renderSize);
    if (ratio > 1) {
      drawHeight = snapSpriteDimension(renderSize / ratio);
    } else {
      drawWidth = snapSpriteDimension(renderSize * ratio);
    }
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    spriteDrawX = snapSpriteValue(-drawWidth * 0.5);
    spriteDrawY = snapSpriteValue(-drawHeight * 0.45);
    spriteDrawWidth = drawWidth;
    spriteDrawHeight = drawHeight;
    spriteUsedImage = true;
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
    ctx.fillStyle = "#f7fbff";
    ctx.font = `bold ${Math.round(renderSize * 0.28)}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(entity.nameFr.slice(0, 1), 0, 0);
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
    ctx.font = `700 ${size}px Tahoma`;
    measuredWidth = Math.ceil(ctx.measureText(safeText).width);
    if (measuredWidth <= safeMaxWidth) {
      break;
    }
    size -= 1;
  }
  if (measuredWidth <= 0) {
    ctx.font = `700 ${size}px Tahoma`;
    measuredWidth = Math.ceil(ctx.measureText(safeText).width);
  }
  ctx.restore();
  return { size, width: measuredWidth };
}

function drawNameAndLevel(entity, centerX, topY, options = {}) {
  if (!entity) {
    return null;
  }
  const enemy = Boolean(options.enemy);
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
    const horizontalPadding = 12;
    const verticalPadding = 6;
    const gap = 10;
    const levelMetrics = getFittedFontMetrics(levelText, Math.max(34, maxWidth * 0.32), levelBaseSize, 9);
    const nameMetrics = getFittedFontMetrics(
      entity.nameFr,
      Math.max(48, maxWidth - horizontalPadding * 2 - levelMetrics.width - gap - 8),
      nameBaseSize,
      12,
    );
    cardWidth = clamp(
      nameMetrics.width + levelMetrics.width + gap + horizontalPadding * 2 + 6,
      124,
      maxWidth,
    );
    cardHeight = Math.round(Math.max(nameMetrics.size, levelMetrics.size) + verticalPadding * 2 + 2);
    x = clamp(centerX - cardWidth * 0.5, 8, state.viewport.width - cardWidth - 8);
    y = clamp(Number(topY) || 0, 8, state.viewport.height - cardHeight - 8);

    if (options.card !== false) {
      drawRetroHudPanel(x, y, cardWidth, cardHeight, {
        cut: 14,
        fillTop: "rgba(28, 39, 58, 0.995)",
        fillBottom: "rgba(13, 21, 35, 0.995)",
        border: "rgba(82, 109, 143, 0.94)",
        highlight: "rgba(157, 186, 219, 0.2)",
        shadow: "rgba(0, 0, 0, 0.44)",
        borderWidth: 2,
      });
    }

    const midY = y + cardHeight * 0.57;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `700 ${nameMetrics.size}px Tahoma`;
    ctx.fillStyle = "#eef6ff";
    ctx.fillText(entity.nameFr, x + horizontalPadding, midY);

    ctx.textAlign = "right";
    ctx.font = `700 ${levelMetrics.size}px Tahoma`;
    ctx.fillStyle = "#b8cee5";
    ctx.fillText(levelText, x + cardWidth - horizontalPadding + 1, midY);
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
    x = clamp(centerX - cardWidth * 0.5, 8, state.viewport.width - cardWidth - 8);
    y = clamp(Number(topY) || 0, 8, state.viewport.height - cardHeight - 8);
    const cardCenterX = x + cardWidth * 0.5;

    if (options.card !== false) {
      drawRetroHudPanel(x, y, cardWidth, cardHeight, {
        cut: 10,
        fillTop: "rgba(26, 37, 56, 0.995)",
        fillBottom: "rgba(12, 20, 33, 0.995)",
        border: "rgba(78, 106, 140, 0.9)",
        highlight: "rgba(154, 184, 218, 0.18)",
        shadow: "rgba(0, 0, 0, 0.44)",
        borderWidth: 1.4,
      });
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const nameBaseline = y + verticalPadding + nameMetrics.size;
    ctx.font = `700 ${nameMetrics.size}px Tahoma`;
    ctx.fillStyle = "#e8f2ff";
    ctx.fillText(entity.nameFr, cardCenterX, nameBaseline);

    const levelBaseline = nameBaseline + lineGap + levelMetrics.size;
    ctx.font = `700 ${levelMetrics.size}px Tahoma`;
    ctx.fillStyle = "#b2cae3";
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
    return {
      start: "rgba(112, 188, 82, 0.99)",
      end: "rgba(149, 208, 95, 0.99)",
      glow: "rgba(172, 224, 123, 0.34)",
    };
  }
  if (ratio >= 0.25) {
    return {
      start: "rgba(219, 165, 51, 0.99)",
      end: "rgba(240, 193, 77, 0.99)",
      glow: "rgba(255, 222, 140, 0.34)",
    };
  }
  return {
    start: "rgba(197, 98, 77, 0.99)",
    end: "rgba(225, 129, 95, 0.99)",
    glow: "rgba(239, 162, 122, 0.32)",
  };
}

function drawEnemyHpBar(enemy, centerX, topY, width, height, options = {}) {
  const targetRatio = enemy.hpMax > 0 ? clamp(enemy.hpCurrent / enemy.hpMax, 0, 1) : 0;
  const { front: frontRatio, lag: lagRatio } = getEnemyHpDisplayRatios(enemy, targetRatio);
  const panelHeight = Math.max(24, height + 10);
  const panelWidth = clamp(width + 96, 180, state.viewport.width - 18);
  const panelX = clamp(centerX - panelWidth * 0.5, 8, state.viewport.width - panelWidth - 8);
  const panelY = clamp(Number(topY) || 0, 8, state.viewport.height - panelHeight - 8) - 5;
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
  ctx.font = `700 ${Math.max(8, Math.round(panelHeight * 0.38))}px Tahoma`;
  const valueWidth = Math.ceil(ctx.measureText(hpLabel).width);
  const trackX = chipX + chipWidth + 8;
  const trackWidth = Math.max(50, panelWidth - (trackX - panelX) - valueWidth - 16);
  const trackRadius = Math.max(2, height * 0.32);

  drawRetroHudPanel(panelX, panelY, panelWidth, panelHeight, {
    cut: 14,
    fillTop: "rgba(44, 60, 84, 0.99)",
    fillBottom: "rgba(25, 36, 54, 0.99)",
    border: "rgba(102, 129, 161, 0.98)",
    highlight: "rgba(188, 212, 237, 0.3)",
    shadow: "rgba(0, 0, 0, 0.36)",
    borderWidth: 2,
  });

  drawRetroHudPanel(chipX, chipY, chipWidth, chipHeight, {
    cut: 6,
    fillTop: "rgba(243, 182, 84, 0.99)",
    fillBottom: "rgba(192, 117, 47, 0.99)",
    border: "rgba(151, 96, 40, 0.96)",
    highlight: "rgba(255, 232, 167, 0.56)",
    shadow: "rgba(0, 0, 0, 0)",
    shadowOffsetY: 0,
    borderWidth: 1.2,
  });

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(9, Math.round(chipHeight * 0.45))}px Tahoma`;
  ctx.fillStyle = "#fff9ef";
  ctx.fillText("HP", chipX + chipWidth * 0.5 - 0.5, chipY + chipHeight * 0.56);

  ctx.fillStyle = "rgba(82, 95, 116, 0.98)";
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, height, trackRadius);
  ctx.fill();

  if (lagRatio > 0.001) {
    ctx.fillStyle = "rgba(134, 121, 98, 0.68)";
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

  ctx.strokeStyle = "rgba(81, 89, 105, 0.96)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, height, trackRadius);
  ctx.stroke();

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(8, Math.round(panelHeight * 0.38))}px Tahoma`;
  ctx.fillStyle = "#c6dbf2";
  ctx.fillText(hpLabel, panelX + panelWidth - 8, panelY + panelHeight * 0.56);
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
  const currentXp = Math.max(0, toSafeInt(member.xp, 0));
  const requiredXp = Math.max(1, toSafeInt(member.xpToNext, 1));
  const ratio = clamp(currentXp / requiredXp, 0, 1);
  const display = getTeamXpDisplayRatios(member, slotIndex, ratio);
  const width = clamp(Number(options.width) || 72, 40, 96);
  const height = clamp(Number(options.height) || 4, 3, 5);
  const x = centerX - width * 0.5;
  const y = clamp(Number(topY) || 0, 8, state.viewport.height - height - 8);
  const radius = Math.max(2, height * 0.45);

  ctx.save();
  ctx.fillStyle = "rgba(19, 29, 44, 0.72)";
  ctx.beginPath();
  ctx.roundRect(x - 1.5, y - 1.5, width + 3, height + 3, radius + 1);
  ctx.fill();

  const trackGradient = ctx.createLinearGradient(x, y, x, y + height);
  trackGradient.addColorStop(0, "rgba(55, 75, 103, 0.98)");
  trackGradient.addColorStop(1, "rgba(36, 52, 73, 0.98)");
  ctx.fillStyle = trackGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  if (display.lag > 0.001) {
    ctx.fillStyle = "rgba(95, 129, 167, 0.5)";
    ctx.beginPath();
    ctx.roundRect(x, y, width * display.lag, height, radius);
    ctx.fill();
  }

  if (display.front > 0.001) {
    const fillGradient = ctx.createLinearGradient(x, y, x + width, y);
    fillGradient.addColorStop(0, "rgba(98, 156, 210, 0.99)");
    fillGradient.addColorStop(1, "rgba(137, 191, 235, 0.99)");
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width * display.front, height, radius);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(x + 1, y + 1, Math.max(0, width * display.front - 2), Math.max(1, height * 0.3));
  }

  ctx.strokeStyle = "rgba(129, 163, 201, 0.78)";
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
  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const unlockProgressState = getRouteUnlockProgressState(currentRouteId);
  const showDefeatCounter = unlockProgressState.unlockMode === "defeats" && unlockProgressState.unlockTarget > 0;
  const defeatCounterText = showDefeatCounter
    ? `${formatCompactNumber(unlockProgressState.currentDefeats)} / ${formatCompactNumber(unlockProgressState.unlockTarget)} Pokemon battus`
    : "";
  const isOnlyOneTimer = String(timerState?.style || "").toLowerCase() === ENEMY_TIMER_STYLE_ONLY_ONE;
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
  const y = Number.isFinite(safeTop)
    ? clamp(safeTop + verticalOffset, 24, state.viewport.height - height - 24)
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
    fillTop: "rgba(44, 60, 83, 0.99)",
    fillBottom: "rgba(26, 37, 54, 0.99)",
    border: "rgba(101, 128, 160, 0.98)",
    highlight: "rgba(183, 208, 235, 0.24)",
    shadow: "rgba(0, 0, 0, 0.34)",
    borderWidth: 1.7,
  });

  const trackGradient = ctx.createLinearGradient(x, y, x, y + height);
  trackGradient.addColorStop(0, "rgba(81, 95, 115, 0.98)");
  trackGradient.addColorStop(1, "rgba(57, 69, 86, 0.98)");
  ctx.fillStyle = trackGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  if (ratio > 0.001) {
    const fillGradient = ctx.createLinearGradient(x, y, x + width, y);
    if (isOnlyOneTimer) {
      fillGradient.addColorStop(0, "rgba(197, 126, 255, 0.99)");
      fillGradient.addColorStop(0.48, "rgba(162, 95, 237, 0.99)");
      fillGradient.addColorStop(1, "rgba(127, 63, 212, 0.99)");
    } else {
      fillGradient.addColorStop(0, "rgba(242, 181, 79, 0.98)");
      fillGradient.addColorStop(0.48, "rgba(219, 121, 59, 0.98)");
      fillGradient.addColorStop(1, "rgba(188, 77, 63, 0.98)");
    }
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width * ratio, height, radius);
    ctx.fill();

    ctx.fillStyle = isOnlyOneTimer
      ? `rgba(240, 220, 255, ${(0.12 + pulse).toFixed(3)})`
      : `rgba(255, 246, 219, ${(0.12 + pulse).toFixed(3)})`;
    ctx.fillRect(x + 1, y + 1, Math.max(0, width * ratio - 2), Math.max(1, height * 0.32));
  }

  ctx.strokeStyle = isOnlyOneTimer
    ? `rgba(183, 146, 255, ${(0.62 + pulse * 0.4).toFixed(3)})`
    : `rgba(141, 171, 205, ${(0.62 + pulse * 0.4).toFixed(3)})`;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();

  const timerTextSize = compactHud
    ? Math.max(8, Math.min(12, Math.round(height * 0.64)))
    : Math.max(10, Math.min(15, Math.round(height * 0.7)));
  ctx.font = `700 ${timerTextSize}px Tahoma`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = isOnlyOneTimer ? "rgba(52, 20, 84, 0.82)" : "rgba(45, 22, 18, 0.82)";
  ctx.fillStyle = "rgba(255, 250, 242, 0.96)";
  ctx.strokeText(timerText, x + width * 0.5, y + height * 0.5);
  ctx.fillText(timerText, x + width * 0.5, y + height * 0.5);

  if (defeatCounterText) {
    const counterTextSize = compactHud
      ? Math.max(8, Math.min(11, Math.round(height * 0.58)))
      : Math.max(10, Math.min(14, Math.round(height * 0.64)));
    const counterY = y + height + (compactHud ? 4 : 6);
    ctx.font = `700 ${counterTextSize}px Tahoma`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = "rgba(14, 20, 30, 0.74)";
    ctx.fillStyle = "rgba(236, 244, 252, 0.98)";
    ctx.strokeText(defeatCounterText, x + width * 0.5, counterY);
    ctx.fillText(defeatCounterText, x + width * 0.5, counterY);
  }
  ctx.restore();
}

function getProjectileTypeVfxProfile(typeName) {
  switch (normalizeType(typeName)) {
    case "fire":
      return { motif: "flame", accent: [255, 217, 146], intensity: 1.12 };
    case "water":
      return { motif: "droplet", accent: [205, 241, 255], intensity: 1 };
    case "grass":
      return { motif: "leaf", accent: [232, 255, 196], intensity: 1.02 };
    case "electric":
      return { motif: "bolt", accent: [255, 247, 166], intensity: 1.18 };
    case "ice":
      return { motif: "crystal", accent: [236, 251, 255], intensity: 0.96 };
    case "fighting":
      return { motif: "impact", accent: [255, 211, 189], intensity: 1.05 };
    case "poison":
      return { motif: "bubble", accent: [234, 196, 255], intensity: 0.96 };
    case "ground":
      return { motif: "dust", accent: [244, 214, 154], intensity: 0.99 };
    case "flying":
      return { motif: "wind", accent: [235, 245, 255], intensity: 1 };
    case "psychic":
      return { motif: "orbit", accent: [255, 224, 242], intensity: 1.08 };
    case "bug":
      return { motif: "wing", accent: [233, 255, 186], intensity: 0.98 };
    case "rock":
      return { motif: "shard", accent: [236, 214, 173], intensity: 0.95 };
    case "ghost":
      return { motif: "wisp", accent: [222, 212, 255], intensity: 1.04 };
    case "dragon":
      return { motif: "rune", accent: [212, 207, 255], intensity: 1.13 };
    case "dark":
      return { motif: "shadow", accent: [189, 177, 166], intensity: 0.95 };
    case "steel":
      return { motif: "gear", accent: [227, 240, 250], intensity: 1 };
    case "fairy":
      return { motif: "sparkle", accent: [255, 226, 247], intensity: 1.08 };
    case "normal":
      return { motif: "ring", accent: [244, 236, 220], intensity: 0.9 };
    default:
      return { motif: "ring", accent: [232, 240, 255], intensity: 0.94 };
  }
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

function drawProjectiles(projectiles) {
  const quality = getRenderQualitySettings();
  const trailStride = Math.max(1, toSafeInt(quality.projectileTrailStride, 1));
  const trailEnabled = Boolean(quality.projectileTrailEnabled);
  const trailGlow = Boolean(quality.projectileTrailGlow);
  const projectileStreak = Boolean(quality.projectileStreak);
  const projectileAura = Boolean(quality.projectileAura);
  const spriteDetail = Boolean(quality.projectileSpriteDetail);
  const auraScale = clamp(Number(quality.projectileAuraScale) || 1, 0.45, 1.5);
  for (const projectile of projectiles || []) {
    const rgb = getTypeColor(projectile.attackType);
    const radius = projectile.radius || 8;
    const sprite = spriteDetail ? getProjectileSprite(projectile.attackType) : null;
    const auraRadius = radius * 3.3 * auraScale;
    const trailPoints = trailEnabled && Array.isArray(projectile.trail) ? projectile.trail : [];

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
        const pointRadius = radius * (0.8 + lifeRatio * 0.9);
        if (trailGlow) {
          const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pointRadius * 2.6);
          glow.addColorStop(0, rgba(rgb, 0.26 * lifeRatio));
          glow.addColorStop(1, rgba(rgb, 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(point.x, point.y, pointRadius * 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.16 + lifeRatio * 0.2;
          ctx.fillStyle = rgba(rgb, 0.72);
          ctx.beginPath();
          ctx.arc(point.x, point.y, pointRadius * 1.35, 0, Math.PI * 2);
          ctx.fill();
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
    if (effect.kind === "ring") {
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
  for (const text of floatingTexts || []) {
    const lifeRatio = clamp(text.lifeMs / Math.max(1, text.maxLifeMs), 0, 1);
    const alpha = lifeRatio;
    const rgb = Array.isArray(text.color) ? text.color : [220, 236, 255];

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round";

    ctx.font = "700 24px Trebuchet MS";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(8, 15, 28, 0.9)";
    const mainText = text.isMiss
      ? "RATE"
      : `-${formatCompactNumber(text.damage, {
          decimalsSmall: 2,
          decimalsMedium: 1,
          decimalsLarge: 0,
        })}`;
    ctx.strokeText(mainText, text.x, text.y);
    ctx.fillStyle = rgba(rgb, 0.98);
    ctx.fillText(mainText, text.x, text.y);

    if (text.label) {
      ctx.font = "700 12px Trebuchet MS";
      ctx.lineWidth = 3;
      ctx.strokeText(text.label, text.x, text.y - 19);
      ctx.fillStyle = "#f5fbff";
      ctx.fillText(text.label, text.x, text.y - 19);
    }

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

function drawWeatherColorGrade(width, height, weatherType, strength, dayLight) {
  const profile = getWeatherProfile(weatherType);
  const weight = clamp(Number(strength) || 0, 0, 1);
  if (weight <= 0.001) {
    return;
  }

  const overlayAlpha = clamp(profile.gradeOverlayAlpha * weight, 0, 1);
  const screenAlpha = clamp(profile.gradeScreenAlpha * weight * (0.72 + Number(dayLight || 0) * 0.36), 0, 1);
  if (overlayAlpha > 0.001) {
    ctx.fillStyle = rgba(profile.gradeOverlayColor, overlayAlpha.toFixed(3));
    ctx.fillRect(0, 0, width, height);
  }
  if (screenAlpha > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = rgba(profile.gradeScreenColor, screenAlpha.toFixed(3));
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

function drawTimeOfDayColorGrade(width, height, environmentSnapshot) {
  const dayLight = clamp(Number(environmentSnapshot?.dayLight) || 0, 0, 1);
  const twilight = clamp(Number(environmentSnapshot?.twilight) || 0, 0, 1);
  const night = clamp(Number(environmentSnapshot?.night) || 0, 0, 1);

  ctx.save();
  if (night > 0.001) {
    const nightGradient = ctx.createLinearGradient(0, 0, 0, height);
    nightGradient.addColorStop(0, `rgba(20, 35, 78, ${(0.05 + night * 0.16).toFixed(3)})`);
    nightGradient.addColorStop(1, `rgba(8, 18, 46, ${(0.09 + night * 0.24).toFixed(3)})`);
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

  if (twilight > 0.001) {
    const twilightGradient = ctx.createLinearGradient(0, 0, 0, height);
    twilightGradient.addColorStop(0, `rgba(255, 176, 116, ${(twilight * 0.08).toFixed(3)})`);
    twilightGradient.addColorStop(0.58, "rgba(171, 128, 198, 0)");
    twilightGradient.addColorStop(1, `rgba(92, 126, 186, ${(twilight * 0.05).toFixed(3)})`);
    ctx.fillStyle = twilightGradient;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawSunDust(width, height, intensity) {
  const amount = Math.max(0, Number(intensity) || 0);
  if (amount <= 0.01) {
    return;
  }
  const quality = getRenderQualitySettings();
  const particleScale = clamp(Number(quality.environmentParticleScale) || 1, 0.05, 1.4);
  const particleCount = Math.round((width / 88) * amount * particleScale);
  if (particleCount <= 0) {
    return;
  }
  const time = state.timeMs * 0.00004;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < particleCount; i += 1) {
    const seed = i * 17.13 + 9.61;
    const driftSpeed = 0.34 + pseudoRandomUnit(seed * 2.3) * 0.92;
    const x = pseudoRandomUnit(seed) * width + Math.sin(time * driftSpeed * 13 + seed) * 18;
    const yBase = pseudoRandomUnit(seed * 5.1) * (height + 120);
    const y = (yBase - (time * (34 + driftSpeed * 46)) % (height + 120)) % (height + 120) - 60;
    const radius = 1 + pseudoRandomUnit(seed * 7.7) * (2.2 + amount * 1.4);
    const alpha = (0.1 + pseudoRandomUnit(seed * 3.7) * 0.16) * amount;
    ctx.fillStyle = `rgba(255, 248, 218, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRainStreakLayer(width, height, intensity) {
  const rainIntensity = Math.max(0, Number(intensity) || 0);
  if (rainIntensity <= 0.01) {
    return;
  }
  const quality = getRenderQualitySettings();
  const particleScale = clamp(Number(quality.environmentParticleScale) || 1, 0.05, 1.4);
  const streakCount = Math.round((width / 26) * rainIntensity * particleScale);
  if (streakCount <= 0) {
    return;
  }
  const wind = -0.32 - rainIntensity * 0.06;
  const time = state.timeMs * 0.001;

  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < streakCount; i += 1) {
    const seed = i * 19.37 + 4.71;
    const xBase = pseudoRandomUnit(seed) * (width + 160) - 80;
    const speed = 240 + pseudoRandomUnit(seed * 3.17) * 250 + rainIntensity * 70;
    const length = 10 + pseudoRandomUnit(seed * 6.9) * 16 + rainIntensity * 3;
    const thickness = 0.7 + pseudoRandomUnit(seed * 8.3) * 0.75 + rainIntensity * 0.2;
    const y = (pseudoRandomUnit(seed * 2.1) * (height + 180) + (time * speed) % (height + 180)) % (height + 180) - 90;
    const alpha = 0.16 + rainIntensity * 0.1 + pseudoRandomUnit(seed * 9.7) * 0.1;
    ctx.strokeStyle = `rgba(198, 228, 255, ${alpha.toFixed(3)})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(xBase, y);
    ctx.lineTo(xBase + wind * length, y + length);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFogLayer(width, height, intensity, options = {}) {
  const fogIntensity = Math.max(0, Number(intensity) || 0);
  if (fogIntensity <= 0.01) {
    return;
  }
  const quality = getRenderQualitySettings();
  const layerCount = Math.max(0, toSafeInt(quality.fogLayerCount, 3));
  if (layerCount <= 0) {
    return;
  }
  const depth = clamp(Number(options.depth || 0), 0, 1);
  const time = state.timeMs * (0.00011 + depth * 0.00007);
  ctx.save();
  ctx.globalCompositeOperation = depth > 0.4 ? "screen" : "source-over";
  for (let i = 0; i < layerCount; i += 1) {
    const layerRatio = (i + 1) / layerCount;
    const x = width * (0.12 + layerRatio * 0.31) + Math.sin(time * (0.8 + layerRatio * 0.9) + i * 1.7) * width * 0.2;
    const y = height * (0.18 + layerRatio * 0.28) + Math.cos(time * (1.1 + layerRatio * 0.6) + i * 0.6) * height * 0.11;
    const radius = width * (0.26 + layerRatio * 0.2);
    const alpha = fogIntensity * (0.08 + layerRatio * 0.08) * (0.6 + depth * 0.6);
    const gradient = ctx.createRadialGradient(x, y, radius * 0.16, x, y, radius);
    gradient.addColorStop(0, `rgba(220, 232, 245, ${alpha.toFixed(3)})`);
    gradient.addColorStop(1, "rgba(220, 232, 245, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStormLightningOverlay(width, height, intensity) {
  const flashIntensity = clamp(Number(intensity) || 0, 0, 1);
  if (flashIntensity <= 0.001) {
    return;
  }
  const quality = getRenderQualitySettings();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(214, 235, 255, ${(flashIntensity * 0.38).toFixed(3)})`;
  ctx.fillRect(0, 0, width, height);
  if (!quality.lightningGlow) {
    ctx.restore();
    return;
  }

  const flashX = width * (0.18 + pseudoRandomUnit(Math.floor(state.timeMs * 0.01) + 17) * 0.64);
  const flashY = height * 0.05;
  const flashRadius = width * (0.35 + flashIntensity * 0.4);
  const glow = ctx.createRadialGradient(flashX, flashY, flashRadius * 0.08, flashX, flashY, flashRadius);
  glow.addColorStop(0, `rgba(236, 246, 255, ${(flashIntensity * 0.56).toFixed(3)})`);
  glow.addColorStop(1, "rgba(236, 246, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawEnvironmentBackgroundLayer(width, height, environmentSnapshot) {
  if (!environmentSnapshot) {
    return;
  }
  if (!shouldRenderAmbientOverlays()) {
    return;
  }
  const quality = getRenderQualitySettings();
  const particleScale = clamp(Number(quality.environmentParticleScale) || 1, 0, 1.5);
  drawTimeOfDayColorGrade(width, height, environmentSnapshot);

  const weights = environmentSnapshot.weatherWeights || { neutral: 1 };
  const dayLight = clamp(Number(environmentSnapshot.dayLight) || 0, 0, 1);
  for (const weatherType of WEATHER_TYPES) {
    const weight = clamp(Number(weights[weatherType] || 0), 0, 1);
    if (weight <= 0.001) {
      continue;
    }
    drawWeatherColorGrade(width, height, weatherType, weight, dayLight);
  }

  const sunnyWeight = clamp(Number(weights.sunny || 0), 0, 1);
  if (sunnyWeight > 0.001 && particleScale > 0.01) {
    const sunnyIntensity = sunnyWeight * (0.55 + dayLight * 0.75) * particleScale;
    drawSunDust(width, height, sunnyIntensity);
  }

  const fogWeight =
    clamp(Number(weights.foggy || 0), 0, 1) * 1 +
    clamp(Number(weights.rainy || 0), 0, 1) * 0.42 +
    clamp(Number(weights.storm || 0), 0, 1) * 0.58;
  if (fogWeight > 0.001 && particleScale > 0.01) {
    drawFogLayer(width, height, fogWeight * (0.45 + particleScale * 0.55), { depth: 0.25 });
  }
}

function drawEnvironmentForegroundLayer(width, height, environmentSnapshot) {
  if (!environmentSnapshot) {
    return;
  }
  if (!shouldRenderAmbientOverlays()) {
    return;
  }
  const quality = getRenderQualitySettings();
  const particleScale = clamp(Number(quality.environmentParticleScale) || 1, 0, 1.5);
  const weights = environmentSnapshot.weatherWeights || { neutral: 1 };
  const rainWeight =
    clamp(Number(weights.rainy || 0), 0, 1) * 1 +
    clamp(Number(weights.storm || 0), 0, 1) * 1.65;
  if (rainWeight > 0.001 && particleScale > 0.01) {
    drawRainStreakLayer(width, height, rainWeight * particleScale);
  }

  const fogWeight =
    clamp(Number(weights.foggy || 0), 0, 1) * 0.58 +
    clamp(Number(weights.storm || 0), 0, 1) * 0.35;
  if (fogWeight > 0.001 && particleScale > 0.01) {
    drawFogLayer(width, height, fogWeight * (0.42 + particleScale * 0.58), { depth: 0.78 });
  }

  drawStormLightningOverlay(width, height, environmentSnapshot.lightningIntensity || 0);
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
  const renderSize = size * getPokemonDataSpriteScale(entity);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, " + (0.24 + (1 - whiteRatio) * 0.2).toFixed(3) + ")";
  ctx.beginPath();
  ctx.ellipse(0, renderSize * 0.38, renderSize * 0.32, renderSize * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDrawableImage(entity?.spriteImage)) {
    const ratio = entity.spriteImage.width / Math.max(entity.spriteImage.height, 1);
    let drawWidth = renderSize;
    let drawHeight = renderSize;
    if (ratio > 1) {
      drawHeight = renderSize / ratio;
    } else {
      drawWidth = renderSize * ratio;
    }
    const drawX = -drawWidth * 0.5;
    const drawY = -drawHeight * 0.45;
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    drawSpriteImageWithTint(entity.spriteImage, drawX, drawY, drawWidth, drawHeight, [255, 255, 255], whiteRatio);
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
    const alpha = Math.sin(ratio * Math.PI) * 0.72;
    if (alpha <= 0.01) {
      continue;
    }
    const baseAngle = Number(particle.baseAngle) || 0;
    const angle = baseAngle + ratio * (Number(particle.spinTurns) || 0) * Math.PI * 2;
    const orbitRadius = spriteSize * ((Number(particle.radiusStart) || 0.2) + ratio * (Number(particle.radiusGrow) || 0.12));
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y =
      centerY
      + (Number(particle.heightOffset) || 0) * spriteSize
      + Math.sin(angle * 0.7 + baseAngle) * spriteSize * 0.08
      - ratio * spriteSize * (Number(particle.lift) || 0.14);
    const size = Math.max(0.8, (Number(particle.size) || 2) * (0.82 + (1 - ratio) * 0.35));
    const color = Array.isArray(particle.color) ? particle.color : [190, 225, 255];

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

  const whiteEnd = Math.max(1, EVOLUTION_ANIM_WHITE_MS);
  const flashEnd = whiteEnd + Math.max(1, EVOLUTION_ANIM_FLASH_MS);
  const revealEnd = flashEnd + Math.max(1, EVOLUTION_ANIM_REVEAL_MS);
  const elapsed = clamp(current.elapsedMs, 0, current.totalMs);
  const centerX = layout.centerX;
  const centerY = layout.centerY - layout.enemySize * 0.03;
  const spriteSize = clamp(layout.enemySize * 1.5, 170, 300);
  const growthRatio = clamp(elapsed / whiteEnd, 0, 1);
  const growthEase = easeInOutSine(growthRatio);
  const flashRatio =
    elapsed <= whiteEnd ? 0 : clamp((elapsed - whiteEnd) / Math.max(1, EVOLUTION_ANIM_FLASH_MS), 0, 1);
  const flashEase = easeInOutSine(flashRatio);
  const revealRatio =
    elapsed <= flashEnd ? 0 : clamp((elapsed - flashEnd) / Math.max(1, EVOLUTION_ANIM_REVEAL_MS), 0, 1);
  const revealEase = easeInOutSine(revealRatio);
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
  const baseBackdropAlpha = clamp((0.54 + (1 - revealEase) * 0.16) * backdropPresence, 0, 0.86);
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
  const vignetteAlpha = clamp((0.36 + (1 - revealEase) * 0.34) * backdropPresence, 0, 0.9);
  vignette.addColorStop(0, `rgba(4, 9, 17, ${(vignetteAlpha * 0.06).toFixed(3)})`);
  vignette.addColorStop(0.52, `rgba(4, 9, 17, ${(vignetteAlpha * 0.4).toFixed(3)})`);
  vignette.addColorStop(1, `rgba(4, 9, 17, ${vignetteAlpha.toFixed(3)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  const focusRadius = spriteSize * 1.3;
  const focus = ctx.createRadialGradient(centerX, centerY, spriteSize * 0.12, centerX, centerY, focusRadius);
  focus.addColorStop(0, `rgba(255, 255, 255, ${(0.18 + (1 - revealEase) * 0.1).toFixed(3)})`);
  focus.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = focus;
  ctx.beginPath();
  ctx.arc(centerX, centerY, focusRadius, 0, Math.PI * 2);
  ctx.fill();
  drawEvolutionAnimationParticles(current, centerX, centerY, spriteSize, elapsed);

  let title = `${current.fromNameFr} evolue !`;
  let subtitle = "";
  const baseOrbRadius = spriteSize * 0.52;
  const maxOrbRadius = spriteSize * 0.64;
  const minOrbRadius = spriteSize * 0.08;
  let orbRadius = baseOrbRadius;
  let orbAlpha = 0;

  if (elapsed < whiteEnd) {
    const whiteRatio = clamp(0.16 + growthEase * 0.84, 0, 1);
    const scale = lerpNumber(1.03, 0.52, growthEase);
    drawEvolutionSpriteFrame(current.fromDef, centerX, centerY, spriteSize, {
      alpha: clamp(1 - growthEase * 0.94, 0.05, 1),
      scale,
      whiteRatio,
    });
    orbRadius = lerpNumber(baseOrbRadius, maxOrbRadius, growthEase);
    orbAlpha = clamp(0.82 + growthEase * 0.18, 0, 1);
  } else if (elapsed < flashEnd) {
    const pulse = Math.sin(flashEase * Math.PI);
    drawEvolutionSpriteFrame(current.fromDef, centerX, centerY, spriteSize, {
      alpha: 0.03,
      scale: 0.5,
      whiteRatio: 1,
    });
    orbRadius = maxOrbRadius * (0.98 + pulse * 0.03);
    orbAlpha = 1;
    const flashAlpha = 0.05 + pulse * 0.12;
    ctx.fillStyle = "rgba(255, 255, 255, " + flashAlpha.toFixed(3) + ")";
    ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);
  } else {
    orbRadius = lerpNumber(maxOrbRadius, minOrbRadius, revealEase);
    orbAlpha = clamp(1 - revealEase * 1.08, 0, 1);
    const whiteRatio = clamp(1 - revealEase * 1.08, 0, 1);
    const scale = lerpNumber(0.82, 1.04, revealEase);
    drawEvolutionSpriteFrame(current.toDef, centerX, centerY, spriteSize, {
      alpha: clamp(0.18 + revealEase * 0.82, 0, 1),
      scale,
      whiteRatio,
    });
    if (revealRatio > 0.18) {
      subtitle = `${current.toNameFr} !`;
    }
  }

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

  if (elapsed >= revealEnd) {
    drawEvolutionSpriteFrame(current.toDef, centerX, centerY, spriteSize, {
      alpha: 1,
      scale: 1.04,
      whiteRatio: 0,
    });
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
  drawBackground(width, height);
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

  const safeBounds = layout?.safeBounds || {
    left: 8,
    top: 8,
    right: Math.max(8, state.viewport.width - 8),
    bottom: Math.max(8, state.viewport.height - 8),
  };
  const viewportProfile = layout?.viewportProfile || {};
  const compact = Boolean(viewportProfile.phone || viewportProfile.compact);
  const iconSize = compact ? 17 : 21;
  const rowGap = compact ? 5 : 7;
  const panelPaddingX = compact ? 8 : 10;
  const panelPaddingY = compact ? 7 : 9;
  const iconTextGap = compact ? 7 : 9;
  const fontSize = compact ? 12 : 14;
  const rowHeight = iconSize;

  ctx.save();
  ctx.font = `700 ${fontSize}px Tahoma`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let maxLabelWidth = 0;
  for (const row of rows) {
    const label = formatPokeDollarValue(row.count);
    maxLabelWidth = Math.max(maxLabelWidth, Math.ceil(ctx.measureText(label).width));
  }

  const panelWidth = Math.ceil(panelPaddingX * 2 + iconSize + iconTextGap + maxLabelWidth);
  const panelHeight = Math.ceil(panelPaddingY * 2 + rows.length * rowHeight + Math.max(0, rows.length - 1) * rowGap);
  const panelX = clamp(safeBounds.left + 6, 6, state.viewport.width - panelWidth - 6);
  const panelY = clamp(safeBounds.top + 6, 6, state.viewport.height - panelHeight - 6);

  drawRetroHudPanel(panelX, panelY, panelWidth, panelHeight, {
    cut: compact ? 8 : 10,
    fillTop: "rgba(36, 51, 72, 0.92)",
    fillBottom: "rgba(20, 31, 47, 0.92)",
    border: "rgba(142, 176, 210, 0.88)",
    highlight: "rgba(198, 223, 248, 0.22)",
    shadow: "rgba(0, 0, 0, 0.34)",
    borderWidth: 1.3,
  });

  const hitboxes = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const centerY = panelY + panelPaddingY + iconSize * 0.5 + i * (rowHeight + rowGap);
    const rowTop = centerY - rowHeight * 0.5;
    const rowBottom = centerY + rowHeight * 0.5;
    const iconCenterX = panelX + panelPaddingX + iconSize * 0.5;
    const image = row.spritePath ? getCachedSpriteImage(row.spritePath) : null;
    const label = formatPokeDollarValue(row.count);

    if (isDrawableImage(image)) {
      const drawX = snapSpriteValue(iconCenterX - iconSize * 0.5);
      const drawY = snapSpriteValue(centerY - iconSize * 0.5);
      const drawSize = snapSpriteDimension(iconSize);
      const wasSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, drawX, drawY, drawSize, drawSize);
      ctx.imageSmoothingEnabled = wasSmoothing;
    } else {
      drawPokeball(iconCenterX, centerY, iconSize * 0.48, {
        alpha: 0.92,
      });
    }

    const textX = panelX + panelPaddingX + iconSize + iconTextGap;
    ctx.strokeStyle = "rgba(6, 12, 20, 0.84)";
    ctx.lineWidth = 3;
    ctx.fillStyle = "rgba(232, 242, 255, 0.96)";
    ctx.strokeText(label, textX, centerY + 0.2);
    ctx.fillText(label, textX, centerY + 0.2);
    hitboxes.push({
      ballType: row.type,
      x: panelX + 2,
      y: Math.max(panelY + 2, rowTop - 2),
      width: Math.max(8, panelWidth - 4),
      height: Math.max(8, (rowBottom - rowTop) + 4),
    });
  }

  state.ui.ballOverlayHitboxes = hitboxes;
  ctx.restore();
}

function drawBattleUiOverlay(layout, options = {}) {
  if (options.showEnemyUi && state.enemy) {
    drawEnemyHpBar(
      state.enemy,
      layout.centerX,
      layout.hpBarY,
      layout.hpBarWidth,
      layout.hpBarHeight,
    );
    const enemyNameCard = drawNameAndLevel(state.enemy, layout.centerX, layout.enemyNameTopY, {
      enemy: true,
      maxWidth: layout.enemyNamePlateWidth,
    });
    const enemyTypeHudY = Math.max(
      Number(layout.enemyTypeHudY) || 0,
      Number(enemyNameCard?.bottom || layout.enemyNameTopY) + 14,
    );
    drawEnemyDefensiveTypeHud(state.enemy, {
      ...layout,
      enemyTypeHudY,
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
      nameFontSize: isPhoneViewport ? 12 : isCompactViewport ? 15 : 19,
      levelFontSize: isPhoneViewport ? 9 : isCompactViewport ? 11 : 13,
    });
    drawTeamTypeHud(member, i, {
      ...slot,
      hudCenterX: nameCard?.centerX ?? slot.hudCenterX,
      hudTopY: nameCard?.y ?? slot.hudTopY,
    }, state.enemy);
    drawTeamXpBar(member, i, nameCard?.centerX ?? slot.hudCenterX, (nameCard?.bottom ?? slot.hudTopY) + 4, {
      width: Math.max(40, (nameCard?.width ?? slot.hudWidth) - 16),
      height: isPhoneViewport ? 3.5 : isCompactViewport ? 4.4 : 5.2,
    });
  }
}

function drawNonCombatZoneOverlay(layout) {
  const zoneId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const zoneType = getRouteZoneType(zoneId);
  const nextRouteId = getNextRouteId(zoneId);
  const title = zoneType === "town" ? "Ville paisible" : "Zone sans combat";
  const subtitle = zoneType === "town"
    ? "Aucun combat ici. Passe a la zone suivante."
    : "Aucun Pokemon sauvage dans cette zone.";
  const nextLabel = nextRouteId
    ? `Suivante: ${getRouteDisplayName(nextRouteId)}`
    : "Derniere zone debloquee.";

  ctx.save();
  const width = clamp(state.viewport.width * 0.52, 300, 640);
  const height = 102;
  const x = layout.centerX - width * 0.5;
  const y = layout.centerY - height * 0.5;
  drawRetroHudPanel(x, y, width, height, {
    cut: 18,
    fillTop: "rgba(46, 62, 86, 0.98)",
    fillBottom: "rgba(27, 39, 56, 0.98)",
    border: "rgba(103, 132, 164, 0.98)",
    highlight: "rgba(186, 210, 237, 0.25)",
    shadow: "rgba(0, 0, 0, 0.36)",
    borderWidth: 2,
  });

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 24px Tahoma";
  ctx.fillStyle = "#e6f0fe";
  ctx.fillText(title, layout.centerX, y + 36);
  ctx.font = "700 13px Tahoma";
  ctx.fillStyle = "#aec2d9";
  ctx.fillText(subtitle, layout.centerX, y + 62);
  ctx.fillStyle = "#e6b55d";
  ctx.fillText(nextLabel, layout.centerX, y + 84);
  ctx.restore();
}

function drawVersionOverlay() {
  const label = `v${DISPLAY_APP_VERSION}`;
  const fontSize = state.viewport.width <= 760 ? 10 : 11;
  const paddingX = 8;
  const paddingY = 5;
  const x = 16;
  const bottom = state.viewport.height - 16;

  ctx.save();
  ctx.font = `700 ${fontSize}px Tahoma`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const textWidth = Math.ceil(ctx.measureText(label).width);
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;
  const y = bottom - pillHeight;
  drawRetroHudPanel(x, y, pillWidth, pillHeight, {
    cut: 8,
    fillTop: "rgba(45, 61, 84, 0.95)",
    fillBottom: "rgba(26, 37, 54, 0.95)",
    border: "rgba(103, 130, 161, 0.88)",
    highlight: "rgba(184, 208, 236, 0.22)",
    shadow: "rgba(0, 0, 0, 0.34)",
    borderWidth: 1.3,
  });
  ctx.fillStyle = "rgba(212, 228, 247, 0.88)";
  ctx.fillText(label, x + paddingX, bottom - paddingY);
  ctx.restore();

  drawFpsOverlay();
}

function drawFpsOverlay() {
  const frameMs = Number(state.performance?.renderFrameMsEma) || Number(state.performance?.shortFrameMsEma) || TARGET_FRAME_MS;
  const fps = Math.round(1000 / Math.max(1, frameMs));
  const label = `${fps} FPS`;
  const fontSize = state.viewport.width <= 760 ? 10 : 11;
  const paddingX = 7;
  const paddingY = 5;
  const margin = 14;

  ctx.save();
  ctx.font = `700 ${fontSize}px Tahoma`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const textWidth = Math.ceil(ctx.measureText(label).width);
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;
  const right = Math.max(8, state.viewport.width - margin);
  const bottom = Math.max(8, state.viewport.height - margin);
  const x = right - pillWidth;
  const y = bottom - pillHeight;
  drawRetroHudPanel(x, y, pillWidth, pillHeight, {
    cut: 7,
    fillTop: "rgba(45, 61, 84, 0.84)",
    fillBottom: "rgba(26, 37, 54, 0.84)",
    border: "rgba(103, 130, 161, 0.78)",
    highlight: "rgba(184, 208, 236, 0.2)",
    shadow: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1.2,
  });
  ctx.fillStyle = "rgba(224, 238, 252, 0.92)";
  ctx.fillText(label, right - paddingX, bottom - paddingY);
  ctx.restore();
}

function render() {
  const { width, height } = state.viewport;
  ctx.clearRect(0, 0, width, height);

  if (state.mode === "loading") {
    drawLoadingOrError("Chargement de l'arene...");
    drawVersionOverlay();
    return;
  }
  if (state.mode === "error") {
    drawLoadingOrError(state.error || "Erreur de chargement");
    drawVersionOverlay();
    return;
  }

  const layout = state.layout || computeLayout();
  state.layout = layout;
  const forceUltraShinyAll = shouldForceUltraShinyAllPokemon();
  const routeCombatEnabled = isCurrentRouteCombatEnabled();
  const hasTeamMembers = state.team.length > 0;
  const koTransition = state.battle ? state.battle.getKoTransition() : null;
  const enemyHitPulse = state.battle ? state.battle.getEnemyHitPulseRatio() : 0;
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
      const spriteSize = slot.size * TEAM_SPRITE_SCALE;
      const hoverLift = hoverPulse > 0 ? slot.size * (0.045 + hoverPulse * 0.01) : 0;
      const drawX = slot.x + recoilOffset.x;
      const drawY = slot.y + recoilOffset.y - hoverLift;
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
        hoverScale: hoverPulse > 0 ? 1.03 + hoverPulse * 0.015 : 1,
        chargeScale: chargeGlow > 0 ? 1 + chargeGlow * 0.042 : 1,
      };
    }

    let enemyRenderState = null;
    if (state.enemy) {
      const isKo = koTransition?.active;
      const shrinkProgress = isKo ? koTransition?.shrink_progress || 0 : 0;
      const shrinkActive = Boolean(koTransition?.shrink_active);
      const enemyBreath = getPokemonBreathTransform(
        state.enemy,
        layout.enemySize,
        -1,
        {
          active: !captureSequence && !isKo,
        },
      );
      const defaultEnemyScale = isKo
        ? (shrinkActive ? clamp(1 - shrinkProgress * 0.96, 0.04, 1) : 0)
        : 1 + enemyHitPulse * 0.06;
      const defaultEnemyAlpha = isKo
        ? (shrinkActive ? clamp(1 - shrinkProgress * 0.85, 0.12, 1) : 0)
        : 1;
      const enemyScale = captureSequence ? captureEnemyVisual.scale : defaultEnemyScale;
      const enemyAlpha = captureSequence ? captureEnemyVisual.alpha : defaultEnemyAlpha;
      const enemyVisible = captureSequence ? captureEnemyVisual.visible : enemyAlpha > 0.01 && enemyScale > 0.01;
      enemyRenderState = {
        visible: enemyVisible,
        alpha: enemyAlpha,
        scaleX: enemyScale * enemyBreath.scaleX,
        scaleY: enemyScale * enemyBreath.scaleY,
        offsetY: enemyBreath.offsetY,
      };
    }

    if (enemyRenderState?.visible) {
      drawPokemonBackdropCircle(layout.centerX, layout.centerY, layout.enemySize);
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
      const spriteSize = slot.size * TEAM_SPRITE_SCALE;
      const auraBonus = Math.max(0, Number(teamAuraAttackBonusBySlot[i] || 0));
      drawPokemonBackdropCircle(slot.x, slot.y, spriteSize, {
        alpha: POKEMON_BACKDROP_ALPHA + hoverPulse * 0.11 + chargeGlow * 0.14,
      });
      if (auraBonus > 0.001) {
        drawTeamAuraIndicator(slot, member, auraBonus);
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
        drawPokemonSprite(state.enemy, layout.centerX, layout.centerY, layout.enemySize, {
          alpha: enemyRenderState.alpha,
          scaleX: enemyRenderState.scaleX,
          scaleY: enemyRenderState.scaleY,
          offsetY: enemyRenderState.offsetY,
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
      drawPokemonSprite(member, drawPosition.x, drawPosition.y, drawPosition.size || slot.size, {
        scaleX: teamBreath.scaleX * hoverScale * chargeScale,
        scaleY: teamBreath.scaleY * hoverScale * chargeScale,
        offsetY: teamBreath.offsetY,
        flipX: shouldFlipTeamSprite(i),
        shinyVisual: Boolean(forceUltraShinyAll || member.isShiny || member.isShinyVisual),
        ultraShinyVisual: Boolean(forceUltraShinyAll || member.isUltraShiny || member.isUltraShinyVisual),
        tintBlend: state.battle ? state.battle.getSlotAttackFlashBlend(i) : 0,
        tintColor: [255, 255, 255],
      });
    }

    drawTeamXpGainEffects();
    drawTeamLevelUpEffects();
    drawFloatingDamageTexts(state.battle ? state.battle.getFloatingTexts() : []);
    drawBattleUiOverlay(layout, {
      showEnemyUi: Boolean(state.enemy) && !koTransition?.active && !captureSequence,
      teamDrawPositions,
    });
  }
  if (!routeCombatEnabled) {
    drawNonCombatZoneOverlay(layout);
  }
  drawEnvironmentForegroundLayer(width, height, environmentSnapshot);
  drawRouteDefeatTimerBar(routeDefeatTimer, layout);
  drawEvolutionAnimationOverlay(layout);
  drawBallInventoryOverlay(layout);
  drawVersionOverlay();
}

function update(deltaMs, options = {}) {
  const idleMode = Boolean(options.idleMode);
  state.timeMs += deltaMs;
  updateEnvironment();
  updateHappinessEvolutionBoxProgress(deltaMs);
  updateNotificationSystem();
  tryOpenPendingTutorialFlow();
  updateBackgroundDrift(deltaMs);
  updateMoneyHudAnimation(deltaMs);
  updateTeamLevelUpEffects(deltaMs);
  updateTeamXpGainEffects(deltaMs);
  const layout = computeLayout();
  state.layout = layout;
  updateEvolutionAnimation(deltaMs);

  state.simulationIdleMode = idleMode;
  try {
    if (state.battle) {
      state.battle.update(deltaMs, layout, { idleMode });
      state.enemy = state.battle.getEnemy();
    }
  } finally {
    state.simulationIdleMode = false;
  }
}

function gameLoop(timestamp) {
  const now = Number.isFinite(Number(timestamp)) ? Number(timestamp) : 0;
  if (document.hidden) {
    state.lastFrameTimestamp = 0;
    state.lastRenderTimestamp = 0;
    window.requestAnimationFrame(gameLoop);
    return;
  }
  const frameDeltaMs = state.lastFrameTimestamp > 0
    ? clamp(now - state.lastFrameTimestamp, 1, 120)
    : BASE_STEP_MS;
  state.lastFrameTimestamp = now;
  tickSimulationFromRealtime();
  let frameCpuMs = TARGET_FRAME_MS;
  let renderDeltaMs = null;
  const renderIntervalMs = getRenderFrameIntervalMs();
  if (state.lastRenderTimestamp <= 0 || now - state.lastRenderTimestamp >= renderIntervalMs - 0.5) {
    const previousRenderTimestamp = state.lastRenderTimestamp;
    const frameStart = performance.now();
    render();
    frameCpuMs = Math.max(0, performance.now() - frameStart);
    renderDeltaMs = previousRenderTimestamp > 0 ? clamp(now - previousRenderTimestamp, 1, 240) : frameDeltaMs;
    state.lastRenderTimestamp = now;
  }
  updateRenderQualityFromFrame(frameDeltaMs, frameCpuMs, renderDeltaMs);
  window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  refreshAutomaticRenderQualityRankCache();
  const stageRect = gameStageEl?.getBoundingClientRect();
  const width = Math.max(260, Math.floor(stageRect?.width || window.innerWidth || 0));
  const height = Math.max(220, Math.floor(stageRect?.height || window.innerHeight || 0));
  const quality = getRenderQualitySettings();
  const dprLimit = clamp(Number(quality.maxDpr) || MAX_RENDER_DPR, 1, MAX_RENDER_DPR);
  const deviceDpr = clamp(Math.max(1, window.devicePixelRatio || 1), 1, dprLimit);
  const renderScale = clamp(Number(quality.renderScale) || 1, 0.5, 1);
  const targetDpr = Math.max(1, deviceDpr * renderScale);
  const nextCanvasWidth = Math.max(1, Math.round(width * targetDpr));
  const effectiveDpr = nextCanvasWidth / Math.max(1, width);
  const nextCanvasHeight = Math.max(1, Math.round(height * effectiveDpr));

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (canvas.width !== nextCanvasWidth) {
    canvas.width = nextCanvasWidth;
  }
  if (canvas.height !== nextCanvasHeight) {
    canvas.height = nextCanvasHeight;
  }
  ctx.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);

  state.viewport = { width, height, dpr: effectiveDpr, deviceDpr, renderScale };
  state.layout = computeLayout();
  render();
}

function getWorldCoordinatesFromPointerEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  return {
    worldX: ((event.clientX - rect.left) / width) * state.viewport.width,
    worldY: ((event.clientY - rect.top) / height) * state.viewport.height,
  };
}

function isCanvasBattleInteractionBlocked() {
  return Boolean(
    state.mode !== "ready"
    || state.ui.boxesOpen
    || state.ui.appearanceOpen
    || state.ui.renameOpen
    || state.ui.tutorialOpen
    || state.ui.mapOpen
    || state.ui.shopOpen
    || state.evolutionAnimation.current,
  );
}

function syncCanvasInteractionCursor() {
  if (!canvas) {
    return;
  }
  const hasOverlayHover = Boolean(state.ui.hoveredBallOverlayType);
  canvas.style.cursor =
    (state.ui.hoveredTeamSlotIndex >= 0 || hasOverlayHover)
      && !state.ui.teamContextMenuOpen
      && !state.ui.ballCaptureMenuOpen
      && !isCanvasBattleInteractionBlocked()
      ? "pointer"
      : "default";
}

function setHoveredBallOverlayType(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  const nextType = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type) ? type : "";
  if (state.ui.hoveredBallOverlayType === nextType) {
    syncCanvasInteractionCursor();
    return;
  }
  state.ui.hoveredBallOverlayType = nextType;
  syncCanvasInteractionCursor();
}

function setHoveredTeamSlotIndex(slotIndex) {
  const nextIndex = slotIndex >= 0 ? clamp(toSafeInt(slotIndex, -1), 0, MAX_TEAM_SIZE - 1) : -1;
  if (state.ui.hoveredTeamSlotIndex === nextIndex) {
    syncCanvasInteractionCursor();
    return;
  }
  state.ui.hoveredTeamSlotIndex = nextIndex;
  syncCanvasInteractionCursor();
}

function getBallCaptureMenuBallType() {
  const type = String(state.ui.ballCaptureMenuBallType || "").toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type) ? type : "";
}

function closeBallCaptureMenu() {
  state.ui.ballCaptureMenuOpen = false;
  state.ui.ballCaptureMenuBallType = "";
  if (ballCaptureMenuEl) {
    ballCaptureMenuEl.classList.add("hidden");
  }
  syncCanvasInteractionCursor();
}

function closeTeamContextMenu() {
  state.ui.teamContextMenuOpen = false;
  state.ui.teamContextMenuSlotIndex = -1;
  state.ui.teamContextMenuPokemonId = null;
  if (teamContextMenuEl) {
    teamContextMenuEl.classList.add("hidden");
  }
  syncCanvasInteractionCursor();
}

function refreshRenameCharCount() {
  if (!renameCharCountEl) {
    return;
  }
  const currentLength = getPokemonNicknameLength(renameInputEl?.value || "");
  renameCharCountEl.textContent = `${currentLength}/${POKEMON_NICKNAME_MAX_LENGTH}`;
}

function closeRenameModal() {
  state.ui.renameOpen = false;
  state.ui.renameSlotIndex = -1;
  state.ui.renamePokemonId = null;
  if (renameModalEl) {
    renameModalEl.classList.add("hidden");
  }
  if (renameInputEl) {
    renameInputEl.value = "";
  }
  refreshRenameCharCount();
}

function openRenameModalForTeamSlot(slotIndex) {
  if (!renameModalEl || !state.saveData || !Array.isArray(state.saveData.team)) {
    return false;
  }
  const index = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const pokemonId = Number(state.saveData.team[index] || 0);
  const record = getPokemonEntityRecord(pokemonId);
  if (index < 0 || pokemonId <= 0 || !record) {
    return false;
  }

  const baseNameFr = getPokemonDisplayNameById(pokemonId);
  const nickname = sanitizePokemonNickname(record?.nickname);
  state.ui.renameOpen = true;
  state.ui.renameSlotIndex = index;
  state.ui.renamePokemonId = pokemonId;

  if (renameTitleEl) {
    renameTitleEl.textContent = `Renommer | ${nickname || baseNameFr}`;
  }
  if (renameSubtitleEl) {
    renameSubtitleEl.textContent = `${baseNameFr} (${getTeamSlotLabel(index)}) | applique a la famille evolutive`;
  }
  if (renameInputEl) {
    renameInputEl.value = nickname;
  }
  refreshRenameCharCount();
  renameModalEl.classList.remove("hidden");
  window.requestAnimationFrame(() => {
    renameInputEl?.focus();
    renameInputEl?.select();
  });
  return true;
}

function applyRenameModal() {
  const pokemonId = Number(state.ui.renamePokemonId || 0);
  const slotIndex = clamp(toSafeInt(state.ui.renameSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const record = getPokemonEntityRecord(pokemonId);
  if (pokemonId <= 0 || slotIndex < 0 || !record) {
    closeRenameModal();
    return;
  }

  const previousDisplayName = getPokemonDisplayNameForOwnedEntity(pokemonId);
  const nextNickname = sanitizePokemonNickname(renameInputEl?.value || "");
  const renameResult = applyNicknameToEvolutionFamily(pokemonId, nextNickname);
  if (!renameResult.changed) {
    closeRenameModal();
    return;
  }

  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();
  render();
  closeRenameModal();

  const nextDisplayName = getPokemonDisplayNameForOwnedEntity(pokemonId);
  if (nextNickname) {
    setTopMessage(
      `Surnom de famille applique (${renameResult.familySize}): ${previousDisplayName} -> ${nextDisplayName}.`,
      1900,
    );
  } else {
    setTopMessage(`Surnom de famille retire (${renameResult.familySize} Pokemon).`, 1800);
  }
}

function clearCanvasHoverState() {
  setHoveredTeamSlotIndex(-1);
  setHoveredBallOverlayType("");
  hideHoverPopup();
}

function hideHoverPopup() {
  hoverPopupEl.classList.add("hidden");
}

function findHoveredTeamSlot(worldX, worldY, layout) {
  if (!layout) {
    return null;
  }
  for (let i = 0; i < state.team.length; i += 1) {
    const member = state.team[i];
    const slot = layout.teamSlots[i];
    if (!member || !slot) {
      continue;
    }
    const radius = slot.size * 0.34;
    if (Math.hypot(worldX - slot.x, worldY - slot.y) <= radius) {
      return { slotIndex: i, member, slot };
    }
  }
  return null;
}

function findHoveredBallOverlayHitbox(worldX, worldY) {
  const hitboxes = Array.isArray(state.ui.ballOverlayHitboxes) ? state.ui.ballOverlayHitboxes : [];
  for (const hitbox of hitboxes) {
    const x = Number(hitbox?.x || 0);
    const y = Number(hitbox?.y || 0);
    const width = Number(hitbox?.width || 0);
    const height = Number(hitbox?.height || 0);
    if (width <= 0 || height <= 0) {
      continue;
    }
    if (worldX < x || worldY < y || worldX > x + width || worldY > y + height) {
      continue;
    }
    const ballType = String(hitbox?.ballType || "").toLowerCase().trim();
    if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, ballType)) {
      continue;
    }
    return hitbox;
  }
  return null;
}

function findHoveredPokemon(worldX, worldY, layout) {
  if (!layout) {
    return null;
  }

  if (state.enemy && !(state.battle && state.battle.isEnemyRespawning())) {
    const enemyRadius = layout.enemySize * 0.38;
    if (Math.hypot(worldX - layout.centerX, worldY - layout.centerY) <= enemyRadius) {
      return state.enemy;
    }
  }

  return findHoveredTeamSlot(worldX, worldY, layout)?.member || null;
}

function showHoverPopup(entity, clientX, clientY) {
  if (!entity) {
    hideHoverPopup();
    return;
  }

  const stats = getSpeciesStatsSummary(entity.id);
  const ultraTag = entity.isUltraShiny || entity.isUltraShinyVisual ? " ultra shiny" : "";
  const shinyTag = ultraTag || (entity.isShiny || entity.isShinyVisual ? " shiny" : "");
  const talent = resolveTalentDefinition(entity?.talent, entity?.id);
  const safeDisplayName = escapeHtml(`${entity.nameFr}${shinyTag}`);
  hoverPopupEl.innerHTML = [
    `<strong>${safeDisplayName}</strong>`,
    `Niv. ${entity.level}`,
    `Talent: ${formatTalentLabelFr(talent, entity?.id)}`,
    `Effet talent: ${talent.descriptionFr || TALENT_NONE_DESCRIPTION_FR}`,
    `Rencontres: ${formatCompactNumber(stats.encountered_total)} (N ${formatCompactNumber(stats.encountered_normal)} / S ${formatCompactNumber(stats.encountered_shiny)})`,
    `Battus: ${formatCompactNumber(stats.defeated_total)} (N ${formatCompactNumber(stats.defeated_normal)} / S ${formatCompactNumber(stats.defeated_shiny)})`,
    `Captures: ${formatCompactNumber(stats.captured_total)} (N ${formatCompactNumber(stats.captured_normal)} / S ${formatCompactNumber(stats.captured_shiny)})`,
  ].join("<br/>");

  const popupX = Math.round(clientX + 14);
  const popupY = Math.round(clientY + 14);
  hoverPopupEl.style.left = `${popupX}px`;
  hoverPopupEl.style.top = `${popupY}px`;
  hoverPopupEl.classList.remove("hidden");
}

function positionFloatingMenuElement(menuEl, clientX, clientY) {
  if (!menuEl) {
    return;
  }
  const menuRect = menuEl.getBoundingClientRect();
  let left = clientX + 12;
  let top = clientY + 12;
  if (left + menuRect.width > window.innerWidth - 8) {
    left = clientX - menuRect.width - 12;
  }
  if (top + menuRect.height > window.innerHeight - 8) {
    top = clientY - menuRect.height - 12;
  }
  menuEl.style.left = `${Math.round(clamp(left, 8, window.innerWidth - menuRect.width - 8))}px`;
  menuEl.style.top = `${Math.round(clamp(top, 8, window.innerHeight - menuRect.height - 8))}px`;
}

function setBallCaptureToggleButtonState(buttonEl, label, enabled) {
  if (!buttonEl) {
    return;
  }
  const isEnabled = Boolean(enabled);
  buttonEl.disabled = false;
  buttonEl.setAttribute("aria-checked", isEnabled ? "true" : "false");
  buttonEl.setAttribute("aria-disabled", "false");
  buttonEl.classList.toggle("is-on", isEnabled);
  buttonEl.classList.remove("is-locked");
  buttonEl.textContent = "";

  const checkEl = document.createElement("span");
  checkEl.className = "ball-capture-toggle-check";
  checkEl.setAttribute("aria-hidden", "true");
  checkEl.textContent = isEnabled ? "\u2713" : "";

  const labelEl = document.createElement("span");
  labelEl.className = "ball-capture-toggle-label";
  labelEl.textContent = label;

  buttonEl.appendChild(checkEl);
  buttonEl.appendChild(labelEl);

}

function refreshBallCaptureMenu() {
  if (!ballCaptureMenuEl) {
    return;
  }
  const ballType = getBallCaptureMenuBallType();
  if (!ballType) {
    closeBallCaptureMenu();
    return;
  }
  const config = BALL_CONFIG_BY_TYPE[ballType];
  const rules = getBallCaptureRulesForType(ballType);

  if (ballCaptureMenuTitleEl) {
    ballCaptureMenuTitleEl.textContent = `${config.nameFr} | R\u00e9glages capture`;
  }

  for (const definition of BALL_CAPTURE_TOGGLE_DEFINITIONS) {
    const key = definition.key;
    const enabled = Boolean(rules[key]);
    setBallCaptureToggleButtonState(definition.buttonEl, definition.label, enabled);
  }
}

function openBallCaptureMenu(ballType, clientX, clientY) {
  if (!ballCaptureMenuEl) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  closeTeamContextMenu();
  state.ui.ballCaptureMenuOpen = true;
  state.ui.ballCaptureMenuBallType = type;
  setHoveredBallOverlayType(type);
  setHoveredTeamSlotIndex(-1);
  hideHoverPopup();
  refreshBallCaptureMenu();
  ballCaptureMenuEl.classList.remove("hidden");
  positionFloatingMenuElement(ballCaptureMenuEl, clientX, clientY);
}

function toggleBallCaptureRule(ruleKey) {
  const ballType = getBallCaptureMenuBallType();
  if (!ballType) {
    return;
  }
  const key = String(ruleKey || "");
  if (!BALL_CAPTURE_TOGGLE_DEFINITIONS.some((definition) => definition.key === key)) {
    return;
  }
  const currentRules = getBallCaptureRulesForType(ballType);
  let nextRules = { ...currentRules };
  if (key === BALL_CAPTURE_RULE_CAPTURE_ALL) {
    const nextCaptureAll = !Boolean(currentRules[BALL_CAPTURE_RULE_CAPTURE_ALL]);
    nextRules[BALL_CAPTURE_RULE_CAPTURE_ALL] = nextCaptureAll;
    if (nextCaptureAll) {
      nextRules[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] = true;
      nextRules[BALL_CAPTURE_RULE_CAPTURE_SHINY] = true;
      nextRules[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY] = true;
    }
  } else {
    nextRules[BALL_CAPTURE_RULE_CAPTURE_ALL] = false;
    nextRules[key] = !Boolean(currentRules[key]);
    const allSubRulesEnabled =
      Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_UNOWNED])
      && Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_SHINY])
      && Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]);
    if (allSubRulesEnabled) {
      nextRules[BALL_CAPTURE_RULE_CAPTURE_ALL] = true;
    }
  }

  const changed = setBallCaptureRulesForType(ballType, nextRules);
  refreshBallCaptureMenu();
  if (!changed) {
    return;
  }
  persistSaveData();
  render();
}

function refreshTeamContextMenu() {
  if (!teamContextMenuEl) {
    return;
  }
  const slotIndex = clamp(toSafeInt(state.ui.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const pokemonId = Number(state.ui.teamContextMenuPokemonId || 0);
  const member = pokemonId > 0 ? state.team[slotIndex] || state.pokemonDefsById.get(pokemonId) : null;
  const name = member?.nameFr || getPokemonDisplayNameById(pokemonId);
  const appearanceUnlocked = isAppearanceEditorUnlocked();
  const boxesAccess = getTeamBoxesAccessState();
  const hasNickname = Boolean(getPokemonNicknameById(pokemonId));

  if (teamContextMenuTitleEl) {
    teamContextMenuTitleEl.textContent = `${name} | ${getTeamSlotLabel(slotIndex)}`;
  }
  if (teamContextMenuRenameButtonEl) {
    teamContextMenuRenameButtonEl.disabled = slotIndex < 0 || pokemonId <= 0;
    teamContextMenuRenameButtonEl.textContent = hasNickname ? "Renommer (surnom actif)" : "Renommer";
  }
  if (teamContextMenuBoxesButtonEl) {
    teamContextMenuBoxesButtonEl.disabled = slotIndex < 0 || pokemonId <= 0 || !boxesAccess.allowed;
    teamContextMenuBoxesButtonEl.textContent = boxesAccess.allowed
      ? "Echanger avec la boite"
      : "Echanger avec la boite (verrouille)";
  }
  if (teamContextMenuAppearanceButtonEl) {
    teamContextMenuAppearanceButtonEl.disabled = slotIndex < 0 || pokemonId <= 0 || !appearanceUnlocked;
    teamContextMenuAppearanceButtonEl.textContent = appearanceUnlocked
      ? "Changer l'apparence"
      : `Changer l'apparence (niv ${APPEARANCE_UNLOCK_LEVEL})`;
  }
}

function openTeamContextMenu(slotIndex, member, clientX, clientY) {
  if (!teamContextMenuEl || !member) {
    return;
  }
  closeBallCaptureMenu();
  if (state.ui.renameOpen) {
    closeRenameModal();
  }
  state.ui.teamContextMenuOpen = true;
  state.ui.teamContextMenuSlotIndex = clamp(toSafeInt(slotIndex, -1), 0, MAX_TEAM_SIZE - 1);
  state.ui.teamContextMenuPokemonId = Number(member.id || 0);
  setHoveredTeamSlotIndex(slotIndex);
  hideHoverPopup();
  refreshTeamContextMenu();

  teamContextMenuEl.classList.remove("hidden");
  positionFloatingMenuElement(teamContextMenuEl, clientX, clientY);
}

function getTeamSlotLabel(slotIndex) {
  const index = Math.max(0, toSafeInt(slotIndex, 0));
  return "slot " + String(index + 1);
}

function getPokemonDisplayNameById(pokemonId) {
  const id = Number(pokemonId);
  return state.pokemonDefsById.get(id)?.nameFr || "Pokemon " + String(id);
}

function getCapturedEntityBoxesEntries() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return [];
  }
  const teamIds = Array.isArray(state.saveData.team) ? state.saveData.team.map((id) => Number(id)) : [];
  const entries = [];
  for (const [rawKey, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawKey || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    const capturedTotal = getCapturedTotal(record);
    const def = state.pokemonDefsById.get(pokemonId);
    const level = clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL);
    const baseStats = normalizeStatsPayload(record.base_stats || def?.stats || {});
    const stats = normalizeStatsPayload(record.stats || computeStatsAtLevel(baseStats, level));
    const encounteredNormal = Math.max(0, toSafeInt(record.encountered_normal, 0));
    const encounteredShiny = Math.max(0, toSafeInt(record.encountered_shiny, 0));
    const defeatedNormal = Math.max(0, toSafeInt(record.defeated_normal, 0));
    const defeatedShiny = Math.max(0, toSafeInt(record.defeated_shiny, 0));
    const capturedNormal = Math.max(0, toSafeInt(record.captured_normal, 0));
    const capturedShiny = Math.max(0, toSafeInt(record.captured_shiny, 0));
    const capturedUltraShiny = Math.max(0, toSafeInt(record.captured_ultra_shiny, 0));
    const shinyModeUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
    const ultraShinyModeUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);
    const appearance = resolveSpriteAppearanceForEntity(pokemonId);
    const talent = resolveTalentDefinition(record?.talent, pokemonId);
    const baseNameFr = def?.nameFr || "Pokemon " + String(pokemonId);
    const nickname = sanitizePokemonNickname(record?.nickname);
    const displayNameFr = nickname || baseNameFr;

    entries.push({
      id: pokemonId,
      nameFr: displayNameFr,
      baseNameFr,
      nickname,
      hasCustomName: Boolean(nickname),
      usableInTeam: Boolean(def),
      level,
      xp: Math.max(0, toSafeInt(record.xp, 0)),
      xpToNext: getXpToNextLevelForSpecies(pokemonId, level, baseStats),
      defensiveTypes: Array.isArray(def?.defensiveTypes) ? def.defensiveTypes : ["normal"],
      offensiveType: def?.offensiveType || "normal",
      spritePath: appearance.spritePath || def?.spritePath || "",
      stats,
      baseStats,
      encounteredNormal,
      encounteredShiny,
      defeatedNormal,
      defeatedShiny,
      capturedNormal,
      capturedShiny,
      capturedUltraShiny,
      talent,
      spriteVariantId: appearance.variant?.id || null,
      shinyVisual: appearance.shinyVisual,
      ultraShinyVisual: appearance.ultraShinyVisual,
      shinyModeUnlocked,
      ultraShinyModeUnlocked,
      encounteredTotal: encounteredNormal + encounteredShiny,
      defeatedTotal: defeatedNormal + defeatedShiny,
      capturedTotal: capturedNormal + capturedShiny,
      inTeamIndex: teamIds.indexOf(pokemonId),
    });
  }
  entries.sort((a, b) => a.id - b.id);
  return entries;
}

function getCapturedEntityCount() {
  return getCapturedEntityBoxesEntries().length;
}

function getTotalShinyCapturesGlobal() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return 0;
  }
  let total = 0;
  for (const [rawKey, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawKey || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    total += Math.max(0, toSafeInt(record.captured_shiny, 0));
  }
  return total;
}

function setBoxesInfoFromEntry(entry) {
  if (!boxesInfoPanelEl) {
    return;
  }
  if (!entry) {
    boxesInfoPanelEl.textContent = "Survole un Pokemon de la boite pour voir ses infos detaillees.";
    return;
  }

  const statLine = STAT_KEYS
    .map((statKey) => `${STAT_LABELS_FR[statKey]} ${formatCompactNumber(entry.stats[statKey], {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    })}`)
    .join(" | ");
  const baseTotal = getBaseStatTotal(entry.baseStats);
  const typesLabel = formatTypeListFr(entry.defensiveTypes);
  const talent = resolveTalentDefinition(entry?.talent, entry?.id);
  const displayName = escapeHtml(String(entry?.nameFr || ""));
  const baseName = escapeHtml(String(entry?.baseNameFr || displayName));
  const headerLine = entry?.hasCustomName
    ? `<strong>${displayName} (#${entry.id})</strong><small>${baseName}</small>`
    : `<strong>${displayName} (#${entry.id})</strong>`;
  const xpLabel =
    entry.level >= MAX_LEVEL
      ? "Niveau max"
      : `${formatCompactNumber(entry.xp, { decimalsSmall: 2, decimalsMedium: 1, decimalsLarge: 0 })}/${formatCompactNumber(Math.max(1, toSafeInt(entry.xpToNext, 1)), { decimalsSmall: 2, decimalsMedium: 1, decimalsLarge: 0 })} vers niv. ${Math.min(MAX_LEVEL, entry.level + 1)}`;

  boxesInfoPanelEl.innerHTML = [
    headerLine,
    `Niv. ${entry.level}`,
    `Talent: ${formatTalentLabelFr(talent, entry?.id)}`,
    `Effet talent: ${talent.descriptionFr || TALENT_NONE_DESCRIPTION_FR}`,
    `Types: ${typesLabel}`,
    `Type offensif: ${formatTypeLabelFr(entry.offensiveType)}`,
    `XP: ${xpLabel}`,
    `Stats: ${statLine}`,
    `BST: ${formatCompactNumber(Math.round(baseTotal))}`,
    `Rencontres: ${formatCompactNumber(entry.encounteredTotal)} (N ${formatCompactNumber(entry.encounteredNormal)} / S ${formatCompactNumber(entry.encounteredShiny)})`,
    `Battus: ${formatCompactNumber(entry.defeatedTotal)} (N ${formatCompactNumber(entry.defeatedNormal)} / S ${formatCompactNumber(entry.defeatedShiny)})`,
    `Captures: ${formatCompactNumber(entry.capturedTotal)} (N ${formatCompactNumber(entry.capturedNormal)} / S ${formatCompactNumber(entry.capturedShiny)})`,
    `Captures ultra shiny: ${formatCompactNumber(Math.max(0, toSafeInt(entry.capturedUltraShiny, 0)))}`,
  ].join("<br/>");
}

function closeBoxesModal() {
  state.ui.boxesOpen = false;
  state.ui.boxesTargetSlotIndex = -1;
  state.ui.boxesHoverEntityId = null;
  if (boxesModalEl) {
    boxesModalEl.classList.add("hidden");
  }
  if (boxesSubtitleEl) {
    boxesSubtitleEl.textContent = "Choisis un Pokemon pour remplacer ton slot d'equipe.";
  }
  if (boxesShinyCounterEl) {
    boxesShinyCounterEl.textContent = "Captures shiny (global): 0";
  }
  if (boxesGridEl) {
    boxesGridEl.innerHTML = "";
  }
  setBoxesInfoFromEntry(null);
}

function renderBoxesGrid() {
  if (!boxesGridEl || !state.saveData || !Array.isArray(state.saveData.team)) {
    return;
  }

  const targetSlotIndex = clamp(toSafeInt(state.ui.boxesTargetSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const currentTargetId = targetSlotIndex >= 0 ? Number(state.saveData.team[targetSlotIndex] || 0) : 0;
  const currentTargetName = currentTargetId > 0 ? getPokemonDisplayNameById(currentTargetId) : "Pokemon";
  const entries = getCapturedEntityBoxesEntries();

  if (boxesSubtitleEl) {
    if (targetSlotIndex >= 0) {
      boxesSubtitleEl.textContent =
        "Remplacement " +
        getTeamSlotLabel(targetSlotIndex) +
        " (" +
        currentTargetName +
        ") | " +
        String(entries.length) +
        " entites capturees";
    } else {
      boxesSubtitleEl.textContent = "Boite complete | " + String(entries.length) + " entites capturees";
    }
  }
  if (boxesShinyCounterEl) {
    const shinyCapturesTotal = getTotalShinyCapturesGlobal();
    boxesShinyCounterEl.textContent = "Captures shiny (global): " + String(shinyCapturesTotal);
  }

  boxesGridEl.innerHTML = "";
  if (entries.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "boxes-empty";
    emptyEl.textContent = "Aucun Pokemon capture pour le moment.";
    boxesGridEl.appendChild(emptyEl);
    setBoxesInfoFromEntry(null);
    return;
  }

  let hoverEntry = entries.find((entry) => entry.id === Number(state.ui.boxesHoverEntityId || 0)) || null;
  if (!hoverEntry) {
    hoverEntry = entries.find((entry) => entry.id === currentTargetId) || entries[0];
  }

  for (const entry of entries) {
    const isCurrent = entry.id === currentTargetId;
    const inAnotherSlot = entry.inTeamIndex >= 0 && entry.inTeamIndex !== targetSlotIndex;
    const unavailable = !entry.usableInTeam;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "boxes-mon-btn";
    if (isCurrent) {
      button.classList.add("is-current");
    }
    if (inAnotherSlot || unavailable) {
      button.classList.add("is-disabled");
      button.disabled = true;
    }

    const visualWrap = document.createElement("div");
    visualWrap.className = "boxes-mon-visual";

    if (entry.spritePath) {
      const image = document.createElement("img");
      image.alt = entry.nameFr;
      image.src = entry.spritePath;
      visualWrap.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "boxes-mon-fallback";
      fallback.textContent = entry.nameFr.slice(0, 1).toUpperCase();
      visualWrap.appendChild(fallback);
    }

    if (entry.shinyModeUnlocked || entry.ultraShinyModeUnlocked) {
      const badgeRow = document.createElement("span");
      badgeRow.className = "boxes-mode-badges";
      if (entry.shinyModeUnlocked) {
        const shinyBadge = document.createElement("span");
        shinyBadge.className = "boxes-mode-badge boxes-mode-badge-shiny";
        shinyBadge.textContent = "✦";
        shinyBadge.title = "Mode shiny debloque";
        badgeRow.appendChild(shinyBadge);
      }
      if (entry.ultraShinyModeUnlocked) {
        const ultraBadge = document.createElement("span");
        ultraBadge.className = "boxes-mode-badge boxes-mode-badge-ultra";
        ultraBadge.textContent = "✦";
        ultraBadge.title = "Mode ultra shiny debloque";
        badgeRow.appendChild(ultraBadge);
      }
      visualWrap.appendChild(badgeRow);
    }
    button.appendChild(visualWrap);

    const nameEl = document.createElement("span");
    nameEl.className = "boxes-mon-name";
    nameEl.textContent = entry.nameFr;
    button.appendChild(nameEl);
    if (entry.hasCustomName) {
      const originalNameEl = document.createElement("span");
      originalNameEl.className = "boxes-mon-original-name";
      originalNameEl.textContent = entry.baseNameFr;
      button.appendChild(originalNameEl);
    }

    const levelEl = document.createElement("span");
    levelEl.className = "boxes-mon-line";
    levelEl.textContent = "Niv. " + String(entry.level);
    button.appendChild(levelEl);

    const captureEl = document.createElement("span");
    captureEl.className = "boxes-mon-line";
    captureEl.textContent = "Captures: " + String(entry.capturedTotal);
    button.appendChild(captureEl);

    const tagEl = document.createElement("span");
    tagEl.className = "boxes-mon-tag";
    if (unavailable) {
      tagEl.textContent = "Indispo dans cette version";
    } else if (inAnotherSlot) {
      tagEl.textContent = "Deja en " + getTeamSlotLabel(entry.inTeamIndex);
    } else if (isCurrent) {
      tagEl.textContent = "Slot actuel";
    } else {
      tagEl.textContent = "Choisir";
    }
    button.appendChild(tagEl);

    button.addEventListener("mouseenter", () => {
      state.ui.boxesHoverEntityId = entry.id;
      setBoxesInfoFromEntry(entry);
    });
    button.addEventListener("focus", () => {
      state.ui.boxesHoverEntityId = entry.id;
      setBoxesInfoFromEntry(entry);
    });
    button.addEventListener("click", () => {
      if (unavailable) {
        setTopMessage("Pokemon indisponible dans les routes chargees.", 1600);
        return;
      }
      if (inAnotherSlot) {
        setTopMessage("Impossible: ce Pokemon est deja dans l'equipe.", 1600);
        return;
      }
      const targetIndex = state.ui.boxesTargetSlotIndex;
      if (targetIndex < 0 || targetIndex >= MAX_TEAM_SIZE) {
        return;
      }
      const currentId = Number(state.saveData?.team?.[targetIndex] || 0);
      if (currentId === entry.id) {
        closeBoxesModal();
        return;
      }
      const capturedRecord = getPokemonEntityRecord(entry.id);
      if (!capturedRecord || !isEntityUnlocked(capturedRecord)) {
        setTopMessage("Pokemon non disponible dans la boite.", 1500);
        return;
      }
      const duplicateIndex = state.saveData.team.findIndex((id, idx) => idx !== targetIndex && Number(id) === entry.id);
      if (duplicateIndex >= 0) {
        setTopMessage("Impossible: ce Pokemon est deja dans l'equipe.", 1600);
        renderBoxesGrid();
        return;
      }
      const oldName = currentId > 0 ? getPokemonDisplayNameForOwnedEntity(currentId) : "Pokemon";
      state.saveData.team[targetIndex] = entry.id;
      rebuildTeamAndSyncBattle();
      persistSaveData();
      updateHud();
      render();
      closeBoxesModal();
      setTopMessage(
        "Equipe mise a jour: " + oldName + " -> " + entry.nameFr + " (" + getTeamSlotLabel(targetIndex) + ")",
        1700,
      );
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (unavailable) {
        setTopMessage("Pokemon indisponible dans les routes chargees.", 1600);
        return;
      }
      state.ui.boxesHoverEntityId = entry.id;
      setBoxesInfoFromEntry(entry);
      openAppearanceForBoxPokemon(entry.id);
    });

    boxesGridEl.appendChild(button);
  }

  setBoxesInfoFromEntry(hoverEntry);
}

function openBoxesForTeamSlot(slotIndex) {
  if (!boxesModalEl || !state.saveData || !Array.isArray(state.saveData.team)) {
    return;
  }
  const index = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const currentId = Number(state.saveData.team[index] || 0);
  if (index < 0 || currentId <= 0) {
    return;
  }
  const boxesAccess = getTeamBoxesAccessState();
  if (!boxesAccess.allowed) {
    setTopMessage(getTeamBoxesLockedMessage(), 2100);
    return;
  }

  closeTeamContextMenu();
  clearCanvasHoverState();
  closeRenameModal();
  setShopOpen(false);
  state.ui.boxesOpen = true;
  state.ui.boxesTargetSlotIndex = index;
  state.ui.boxesHoverEntityId = currentId;
  boxesModalEl.classList.remove("hidden");
  renderBoxesGrid();
}

function closeAppearanceModal() {
  state.ui.appearanceOpen = false;
  state.ui.appearanceTargetSlotIndex = -1;
  state.ui.appearancePokemonId = null;
  if (appearanceModalEl) {
    appearanceModalEl.classList.add("hidden");
  }
  if (appearanceGridEl) {
    appearanceGridEl.innerHTML = "";
  }
}

function openAppearanceForPokemon(pokemonId, options = {}) {
  if (!appearanceModalEl || !state.saveData) {
    return false;
  }
  if (!isAppearanceEditorUnlocked()) {
    setTopMessage(
      `Atteins le niveau ${APPEARANCE_UNLOCK_LEVEL} avec un Pokemon pour debloquer l'apparence.`,
      1900,
    );
    return false;
  }

  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const record = getPokemonEntityRecord(id);
  const def = state.pokemonDefsById.get(id);
  if (!record || !def) {
    return false;
  }

  const preferredSlotIndex = clamp(toSafeInt(options.preferredSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  closeTeamContextMenu();
  clearCanvasHoverState();
  closeRenameModal();
  setShopOpen(false);
  state.ui.appearanceOpen = true;
  state.ui.appearanceTargetSlotIndex = preferredSlotIndex;
  state.ui.appearancePokemonId = id;
  appearanceModalEl.classList.remove("hidden");
  renderAppearanceModal();
  return true;
}

function renderAppearanceModal() {
  if (!appearanceGridEl || !state.saveData) {
    return;
  }

  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const def = state.pokemonDefsById.get(pokemonId);
  const record = getPokemonEntityRecord(pokemonId);
  if (!def || !record) {
    closeAppearanceModal();
    return;
  }

  const appearanceChanged = reconcileAppearanceForEntityRecord(record, pokemonId);
  const variants = getSpriteVariantsForDef(def);
  if (appearanceChanged) {
    rebuildTeamAndSyncBattle();
    persistSaveData();
  }

  const ownedVariants = getOwnedSpriteVariantsForRecord(record, def);
  const ownedSet = new Set(ownedVariants.map((variant) => variant.id));
  const selectedVariant = getSelectedOwnedSpriteVariantForRecord(record, def);
  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
  const ultraShinyUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);
  const shinyCapturesFamily = getFamilyShinyCaptureCount(pokemonId);
  const ultraShinyCapturesFamily = getFamilyUltraShinyCaptureCount(pokemonId);
  const shinyModeActive = Boolean(record.appearance_shiny_mode && shinyUnlocked);
  const ultraShinyModeActive = Boolean(record.appearance_ultra_shiny_mode && ultraShinyUnlocked);
  const selectedHasShiny = Boolean(selectedVariant?.frontShinyPath || def.shinySpritePath);

  if (appearanceTitleEl) {
    appearanceTitleEl.textContent = `Apparence | ${def.nameFr}`;
  }
  if (appearanceSubtitleEl) {
    appearanceSubtitleEl.textContent =
      `${ownedVariants.length}/${variants.length} sprites debloques | Clic gauche: boites | Clic droit: apparence`;
  }
  if (appearanceShinyToggleButtonEl) {
    appearanceShinyToggleButtonEl.disabled = !shinyUnlocked;
    appearanceShinyToggleButtonEl.textContent = shinyModeActive ? "Mode shiny: ON" : "Mode shiny: OFF";
  }
  if (appearanceUltraShinyToggleButtonEl) {
    appearanceUltraShinyToggleButtonEl.disabled = !ultraShinyUnlocked;
    appearanceUltraShinyToggleButtonEl.textContent = ultraShinyModeActive
      ? "Mode ultra shiny: ON"
      : "Mode ultra shiny: OFF";
  }
  if (appearanceShinyStatusEl) {
    if (!shinyUnlocked) {
      appearanceShinyStatusEl.textContent = "Capture un shiny de la famille evolutive pour debloquer ce mode.";
    } else if (!ultraShinyUnlocked) {
      appearanceShinyStatusEl.textContent = shinyModeActive
        ? `Shiny famille debloque (${shinyCapturesFamily} capture). Capture un ultra shiny de la famille pour debloquer le mode ultra shiny.`
        : `Shiny famille debloque (${shinyCapturesFamily} capture). Active le mode shiny si voulu.`;
    } else if (shinyModeActive && !selectedHasShiny) {
      appearanceShinyStatusEl.textContent =
        `Shiny/ultra debloques (famille: ${shinyCapturesFamily} shiny, ${ultraShinyCapturesFamily} ultra). Ce sprite n'a pas de version shiny.`;
    } else if (ultraShinyModeActive) {
      appearanceShinyStatusEl.textContent =
        `Ultra shiny actif (famille: ${ultraShinyCapturesFamily} capture ultra shiny).`;
    } else if (shinyModeActive) {
      appearanceShinyStatusEl.textContent =
        `Shiny actif (famille: ${shinyCapturesFamily} capture${shinyCapturesFamily > 1 ? "s" : ""}).`;
    } else {
      appearanceShinyStatusEl.textContent =
        `Shiny/ultra debloques (famille: ${shinyCapturesFamily} shiny, ${ultraShinyCapturesFamily} ultra). Active un mode si voulu.`;
    }
  }

  appearanceGridEl.innerHTML = "";
  if (variants.length <= 0) {
    const empty = document.createElement("div");
    empty.className = "appearance-empty";
    empty.textContent = "Aucun sprite disponible pour cette espece.";
    appearanceGridEl.appendChild(empty);
    return;
  }

  for (const variant of variants) {
    const owned = ownedSet.has(variant.id);
    const selected = selectedVariant?.id === variant.id;
    const price = getSpriteVariantPurchasePrice(def, variant.id);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "appearance-card-btn";
    if (owned) {
      card.classList.add("is-owned");
    } else {
      card.classList.add("is-locked");
    }
    if (selected) {
      card.classList.add("is-selected");
    }

    const preview = document.createElement("div");
    preview.className = "appearance-preview";
    if (owned) {
      const image = document.createElement("img");
      image.alt = `${def.nameFr} ${variant.labelFr}`;
      image.src = variant.frontPath;
      preview.appendChild(image);
    } else {
      const lockMark = document.createElement("span");
      lockMark.className = "appearance-lock-mark";
      lockMark.textContent = "?";
      preview.appendChild(lockMark);
    }
    card.appendChild(preview);

    const name = document.createElement("span");
    name.className = "appearance-variant-name";
    name.textContent = getSpriteVariantDisplayLabel(variant);
    card.appendChild(name);

    const action = document.createElement("span");
    action.className = "appearance-variant-action";
    if (owned) {
      action.textContent = selected ? "Equipe" : "Utiliser";
    } else {
      action.textContent = `Acheter ${price} Poke$`;
    }
    card.appendChild(action);

    card.addEventListener("click", async () => {
      if (!state.saveData) {
        return;
      }
      const shouldLoadShinyAppearance = Boolean(
        (record.appearance_shiny_mode && isShinyAppearanceUnlockedForRecord(record, pokemonId))
        || (record.appearance_ultra_shiny_mode && isUltraShinyAppearanceUnlockedForRecord(record, pokemonId)),
      );

      if (!owned) {
        if (price <= 0) {
          return;
        }
        if (!spendMoney(price)) {
          setTopMessage(`Pas assez d'argent pour ${variant.labelFr}.`, 1500);
          updateHud();
          return;
        }
        const ownedIds = normalizeSpriteVariantIdList(record.appearance_owned_variants);
        ownedIds.push(variant.id);
        record.appearance_owned_variants = ownedIds;
        record.appearance_selected_variant = variant.id;
        reconcileAppearanceForEntityRecord(record, pokemonId);
        renderAppearanceModal();
        await ensureVariantAppearanceAssetsLoaded(def, variant, { includeShiny: shouldLoadShinyAppearance });
        rebuildTeamAndSyncBattle();
        persistSaveData();
        updateHud();
        if (state.ui.boxesOpen) {
          renderBoxesGrid();
        }
        renderAppearanceModal();
        render();
        setTopMessage(`${def.nameFr}: sprite ${variant.labelFr} debloque.`, 1600);
        return;
      }

      if (selected) {
        return;
      }
      record.appearance_selected_variant = variant.id;
      reconcileAppearanceForEntityRecord(record, pokemonId);
      renderAppearanceModal();
      await ensureVariantAppearanceAssetsLoaded(def, variant, { includeShiny: shouldLoadShinyAppearance });
      rebuildTeamAndSyncBattle();
      persistSaveData();
      if (state.ui.boxesOpen) {
        renderBoxesGrid();
      }
      renderAppearanceModal();
      render();
      setTopMessage(`${def.nameFr}: sprite ${variant.labelFr} equipe.`, 1400);
    });

    appearanceGridEl.appendChild(card);
  }
}

function openAppearanceForTeamSlot(slotIndex) {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return;
  }
  const index = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  if (index < 0) {
    return;
  }
  const pokemonId = Number(state.saveData.team[index] || 0);
  if (pokemonId <= 0) {
    return;
  }
  openAppearanceForPokemon(pokemonId, { preferredSlotIndex: index });
}

function openAppearanceForBoxPokemon(pokemonId) {
  const entries = getCapturedEntityBoxesEntries();
  const entry = entries.find((item) => Number(item.id) === Number(pokemonId || 0)) || null;
  if (!entry) {
    return false;
  }
  return openAppearanceForPokemon(entry.id, { preferredSlotIndex: entry.inTeamIndex });
}

async function toggleAppearanceShinyMode() {
  if (!state.saveData) {
    return;
  }
  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const record = getPokemonEntityRecord(pokemonId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!record || !def) {
    return;
  }
  if (!isShinyAppearanceUnlockedForRecord(record, pokemonId)) {
    setTopMessage("Capture un shiny de la famille evolutive pour debloquer ce mode.", 1700);
    renderAppearanceModal();
    return;
  }
  record.appearance_shiny_mode = !record.appearance_shiny_mode;
  if (!record.appearance_shiny_mode) {
    record.appearance_ultra_shiny_mode = false;
  }
  reconcileAppearanceForEntityRecord(record, pokemonId);
  const selectedVariant = getSelectedOwnedSpriteVariantForRecord(record, def);
  await ensureVariantAppearanceAssetsLoaded(def, selectedVariant, {
    includeShiny: Boolean(record.appearance_shiny_mode || record.appearance_ultra_shiny_mode),
  });
  rebuildTeamAndSyncBattle();
  persistSaveData();
  if (state.ui.boxesOpen) {
    renderBoxesGrid();
  }
  renderAppearanceModal();
  render();
  setTopMessage(
    record.appearance_shiny_mode
      ? `${def.nameFr}: mode shiny active.`
      : `${def.nameFr}: mode shiny desactive.`,
    1400,
  );
}

async function toggleAppearanceUltraShinyMode() {
  if (!state.saveData) {
    return;
  }
  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const record = getPokemonEntityRecord(pokemonId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!record || !def) {
    return;
  }
  if (!isUltraShinyAppearanceUnlockedForRecord(record, pokemonId)) {
    setTopMessage("Capture un ultra shiny de la famille evolutive pour debloquer ce mode.", 1800);
    renderAppearanceModal();
    return;
  }

  const nextUltraMode = !Boolean(record.appearance_ultra_shiny_mode);
  record.appearance_ultra_shiny_mode = nextUltraMode;
  if (nextUltraMode) {
    record.appearance_shiny_mode = true;
  }
  reconcileAppearanceForEntityRecord(record, pokemonId);

  const selectedVariant = getSelectedOwnedSpriteVariantForRecord(record, def);
  await ensureVariantAppearanceAssetsLoaded(def, selectedVariant, {
    includeShiny: Boolean(record.appearance_shiny_mode || record.appearance_ultra_shiny_mode),
  });
  rebuildTeamAndSyncBattle();
  persistSaveData();
  if (state.ui.boxesOpen) {
    renderBoxesGrid();
  }
  renderAppearanceModal();
  render();
  setTopMessage(
    record.appearance_ultra_shiny_mode
      ? `${def.nameFr}: mode ultra shiny active.`
      : `${def.nameFr}: mode ultra shiny desactive.`,
    1500,
  );
}

function handleCanvasMouseMove(event) {
  if (isCanvasBattleInteractionBlocked()) {
    clearCanvasHoverState();
    return;
  }
  if (state.ui.teamContextMenuOpen || state.ui.ballCaptureMenuOpen) {
    setHoveredTeamSlotIndex(-1);
    hideHoverPopup();
    syncCanvasInteractionCursor();
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const hoveredBallOverlay = findHoveredBallOverlayHitbox(worldX, worldY);
  setHoveredBallOverlayType(hoveredBallOverlay?.ballType || "");
  if (hoveredBallOverlay) {
    setHoveredTeamSlotIndex(-1);
    hideHoverPopup();
    return;
  }
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  setHoveredTeamSlotIndex(hoveredTeamSlot?.slotIndex ?? -1);
  const hovered = findHoveredPokemon(worldX, worldY, layout);
  showHoverPopup(hovered, event.clientX, event.clientY);
}

function handleCanvasClick(event) {
  if (event.button !== 0) {
    return;
  }
  closeTeamContextMenu();
  if (isCanvasBattleInteractionBlocked()) {
    closeBallCaptureMenu();
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const hoveredBallOverlay = findHoveredBallOverlayHitbox(worldX, worldY);
  if (hoveredBallOverlay) {
    openBallCaptureMenu(hoveredBallOverlay.ballType, event.clientX, event.clientY);
    return;
  }
  closeBallCaptureMenu();
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot) {
    return;
  }
  openBoxesForTeamSlot(hoveredTeamSlot.slotIndex);
}

function handleCanvasContextMenu(event) {
  event.preventDefault();
  closeBallCaptureMenu();
  if (isCanvasBattleInteractionBlocked()) {
    closeTeamContextMenu();
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot) {
    closeTeamContextMenu();
    return;
  }
  openTeamContextMenu(hoveredTeamSlot.slotIndex, hoveredTeamSlot.member, event.clientX, event.clientY);
}

function exportTextState() {
  const layout = state.layout || computeLayout();
  const battle = state.battle;
  const turnIndicator = battle ? battle.getTurnIndicator(layout) : null;
  const nextTurnPreview = battle ? battle.getNextTurnPreview() : null;
  const environmentSnapshot = getEnvironmentSnapshotForRender();

  const enemy = state.enemy
    ? (() => {
        const enemyTalent = resolveTalentDefinition(state.enemy.talent, state.enemy.id);
        return {
          id: state.enemy.id,
          name_fr: state.enemy.nameFr,
          level: state.enemy.level,
          sprite_scale: Math.round(getPokemonDataSpriteScale(state.enemy) * 1000) / 1000,
          hp_current: state.enemy.hpCurrent,
          hp_max: state.enemy.hpMax,
          is_shiny: Boolean(state.enemy.isShiny),
          is_ultra_shiny: Boolean(state.enemy.isUltraShiny),
          shiny_visual: Boolean(state.enemy.isShiny || state.enemy.isShinyVisual || shouldForceUltraShinyAllPokemon()),
          ultra_shiny_visual: Boolean(
            state.enemy.isUltraShiny || state.enemy.isUltraShinyVisual || shouldForceUltraShinyAllPokemon(),
          ),
          sprite_variant_id: state.enemy.spriteVariantId || null,
          defensive_types: state.enemy.defensiveTypes,
          balance_team_size: Math.max(1, toSafeInt(state.enemy.balanceTeamSize, 1)),
          balance_hp_multiplier: Math.round(Math.max(0, Number(state.enemy.balanceHpMultiplier || 1)) * 1000) / 1000,
          balance_reward_multiplier:
            Math.round(Math.max(0, Number(state.enemy.balanceRewardMultiplier || 1)) * 1000) / 1000,
          talent_id: enemyTalent.id,
          talent_name_fr: enemyTalent.nameFr,
          talent_name_en: enemyTalent.nameEn,
          talent_description_fr: enemyTalent.descriptionFr,
          passive_behavior_id: getPassiveBehaviorIdForTalentId(enemyTalent.id),
          x: Math.round(layout.centerX),
          y: Math.round(layout.centerY),
        };
      })()
    : null;

  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeProgressState = getRouteUnlockProgressState(currentRouteId);
  const nextRouteId = routeProgressState.nextRouteId;
  const unlockMode = routeProgressState.unlockMode;
  const unlockTarget = routeProgressState.unlockTarget;
  const routeDefeatTimer = battle ? battle.getEnemyTimerState() : null;
  const appearancePokemonId = Number(state.ui.appearancePokemonId || 0);
  const appearanceRecord = appearancePokemonId > 0 ? getPokemonEntityRecord(appearancePokemonId) : null;
  const teamAuraAttackBonusBySlot = getTeamAuraAttackBonusBySlot(state.team);

  const team = state.team.map((member, index) => {
    const slot = layout.teamSlots[index];
    const offensiveType = normalizeType(member.offensiveType || member.defensiveTypes?.[0] || "normal");
    const enemyDefensiveTypes = Array.isArray(state.enemy?.defensiveTypes) ? state.enemy.defensiveTypes : [];
    const talent = resolveTalentDefinition(member?.talent, member?.id);
    const passiveBehaviorId = getPassiveBehaviorIdForTalentId(talent.id);
    return {
      id: member.id,
      name_fr: member.nameFr,
      level: member.level,
      sprite_scale: Math.round(getPokemonDataSpriteScale(member) * 1000) / 1000,
      xp: Math.max(0, toSafeInt(member.xp, 0)),
      xp_to_next: Math.max(0, toSafeInt(member.xpToNext, 0)),
      is_shiny: Boolean(member.isShiny),
      is_ultra_shiny: Boolean(member.isUltraShiny),
      shiny_visual: Boolean(member.isShiny || member.isShinyVisual || shouldForceUltraShinyAllPokemon()),
      ultra_shiny_visual: Boolean(member.isUltraShiny || member.isUltraShinyVisual || shouldForceUltraShinyAllPokemon()),
      sprite_variant_id: member.spriteVariantId || null,
      slot_index: index,
      sprite_flip_x: shouldFlipTeamSprite(index),
      offensive_type: offensiveType,
      talent_id: talent.id,
      talent_name_fr: talent.nameFr,
      talent_name_en: talent.nameEn,
      talent_description_fr: talent.descriptionFr,
      passive_behavior_id: passiveBehaviorId,
      team_aura_attack_bonus_pct: Math.round(Math.max(0, Number(teamAuraAttackBonusBySlot[index] || 0)) * 10000) / 100,
      type_multiplier_vs_enemy:
        enemyDefensiveTypes.length > 0 ? Math.round(getTypeMultiplier(offensiveType, enemyDefensiveTypes) * 100) / 100 : null,
      x: slot ? Math.round(slot.x) : null,
      y: slot ? Math.round(slot.y) : null,
    };
  });

  const payload = {
    app_version: DISPLAY_APP_VERSION,
    app_build_version: APP_VERSION,
    mode: state.mode,
    debug_force_ultra_shiny_all_pokemon: shouldForceUltraShinyAllPokemon(),
    coordinate_system: {
      origin: "top-left",
      x_axis: "right-positive",
      y_axis: "down-positive",
    },
    viewport: {
      width: Math.round(state.viewport.width),
      height: Math.round(state.viewport.height),
    },
    render_quality: String(state.performance?.quality || "medium"),
    render_scale: Math.round(clamp(Number(state.viewport?.renderScale) || 1, 0.1, 2) * 1000) / 1000,
    frame_ms_estimate: Math.round((Number(state.performance?.shortFrameMsEma) || TARGET_FRAME_MS) * 100) / 100,
    render_frame_ms_estimate: Math.round((Number(state.performance?.renderFrameMsEma) || TARGET_FRAME_MS) * 100) / 100,
    cpu_frame_ms_estimate: Math.round((Number(state.performance?.cpuFrameMsEma) || TARGET_FRAME_MS) * 100) / 100,
    fps_estimate:
      Math.round((1000 / Math.max(1, Number(state.performance?.shortFrameMsEma) || TARGET_FRAME_MS)) * 10) / 10,
    render_fps_estimate:
      Math.round((1000 / Math.max(1, Number(state.performance?.renderFrameMsEma) || TARGET_FRAME_MS)) * 10) / 10,
    attack_interval_ms: getCurrentAttackIntervalMs(),
    attack_timer_ms: battle ? Math.round(Math.max(0, Number(battle.attackTimerMs) || 0)) : null,
    attack_boost_remaining_ms: getAttackBoostRemainingMs(),
    attack_slots_total: MAX_TEAM_SIZE,
    next_attacker: nextTurnPreview?.attacker_name_fr ?? null,
    next_attacker_slot_index: turnIndicator?.slot_index ?? null,
    next_turn_action: nextTurnPreview?.action ?? null,
    next_turn_reason: nextTurnPreview?.reason ?? null,
    next_turn_passive_behavior_id: nextTurnPreview?.passive_behavior_id ?? null,
    turn_indicator_can_attack: turnIndicator ? Boolean(turnIndicator.can_attack) : null,
    last_turn_event: battle ? battle.getLastTurnEvent() : null,
    enemies_defeated: battle ? battle.enemiesDefeated : 0,
    route_id: currentRouteId || null,
    route_name_fr: state.routeData?.route_name_fr || getRouteDisplayName(currentRouteId),
    route_zone_type: getRouteZoneType(currentRouteId),
    route_combat_enabled: isCurrentRouteCombatEnabled(),
    route_encounters_source: String(state.routeData?.encounters_source || (state.zoneEncounterCsvLoaded ? "csv" : "json")),
    zone_csv_loaded: Boolean(state.zoneEncounterCsvLoaded),
    talents_csv_loaded: Boolean(state.pokemonTalentCsvLoaded),
    ball_csv_loaded: Boolean(state.ballConfigCsvLoaded),
    shop_items_csv_loaded: Boolean(state.shopItemConfigCsvLoaded),
    current_route_encounter_count: Array.isArray(state.routeData?.encounters) ? state.routeData.encounters.length : 0,
    current_route_encounter_preview: Array.isArray(state.routeData?.encounters)
      ? state.routeData.encounters.slice(0, 3).map((entry) => ({
          id: Number(entry?.id || 0),
          name_en: String(entry?.name_en || ""),
          spawn_weight: Math.max(1, toSafeInt(entry?.spawn_weight, 1)),
          min_level: Math.max(1, toSafeInt(entry?.min_level, 1)),
          max_level: Math.max(1, toSafeInt(entry?.max_level, 1)),
        }))
      : [],
    local_time: environmentSnapshot?.localTimeLabel || null,
    local_hour: Number.isFinite(Number(environmentSnapshot?.localHour)) ? Number(environmentSnapshot.localHour) : null,
    local_minute: Number.isFinite(Number(environmentSnapshot?.localMinute)) ? Number(environmentSnapshot.localMinute) : null,
    daylight_factor: Math.round(clamp(Number(environmentSnapshot?.dayLight) || 0, 0, 1) * 1000) / 1000,
    night_factor: Math.round(clamp(Number(environmentSnapshot?.night) || 0, 0, 1) * 1000) / 1000,
    weather_current: environmentSnapshot?.dominantWeatherType || "neutral",
    weather_from: environmentSnapshot?.weatherFrom || "neutral",
    weather_to: environmentSnapshot?.weatherTo || "neutral",
    weather_transition_blend:
      Math.round(clamp(Number(environmentSnapshot?.weatherTransitionBlend) || 0, 0, 1) * 1000) / 1000,
    weather_weights: environmentSnapshot?.weatherWeights || { neutral: 1 },
    weather_lightning_intensity:
      Math.round(clamp(Number(environmentSnapshot?.lightningIntensity) || 0, 0, 1) * 1000) / 1000,
    unlocked_route_ids: state.saveData ? getOrderedUnlockedRouteIds() : [DEFAULT_ROUTE_ID],
    route_unlock_mode: unlockMode,
    route_unlock_progress_current: routeProgressState.currentDefeats,
    route_unlock_target: unlockTarget,
    route_defeat_timer_active: Boolean(routeDefeatTimer?.enabled),
    route_defeat_timer_running: Boolean(routeDefeatTimer?.running),
    route_defeat_timer_duration_ms: routeDefeatTimer?.duration_ms ?? 0,
    route_defeat_timer_remaining_ms: routeDefeatTimer?.remaining_ms ?? 0,
    route_defeat_timer_ratio: routeDefeatTimer?.remaining_ratio ?? 0,
    next_route_id: nextRouteId,
    next_route_name_fr: nextRouteId ? getRouteDisplayName(nextRouteId) : null,
    starter_modal_visible: !starterModalEl.classList.contains("hidden"),
    hover_popup_visible: !hoverPopupEl.classList.contains("hidden"),
    hovered_team_slot_index: toSafeInt(state.ui.hoveredTeamSlotIndex, -1),
    save_team_size: state.saveData?.team?.length || 0,
    money: Math.max(0, toSafeInt(state.saveData?.money, 0)),
    coins: Math.max(0, toSafeInt(state.saveData?.coins, 0)),
    pokeballs: Math.max(0, toSafeInt(state.saveData?.pokeballs, 0)),
    ball_inventory: state.saveData
      ? {
          ...Object.fromEntries(BALL_TYPE_FALLBACK_ORDER.map((ballType) => [ballType, getBallInventoryCount(ballType)])),
          active_ball_type: getActiveBallType(),
        }
      : null,
    shop_items: state.saveData
      ? Object.fromEntries(
          Object.values(SHOP_ITEM_CONFIG_BY_ID)
            .filter((item) => item && item.itemType !== "ball" && item.stockTracked)
            .sort(compareShopItems)
            .map((item) => [item.id, getShopItemCount(item.id)]),
        )
      : null,
    ball_configs: getSortedBallConfigs().map((entry) => ({
      type: entry.type,
      name_fr: entry.nameFr,
      price: Math.max(0, toSafeInt(entry.price, 0)),
      capture_multiplier: Math.round(Number(entry.captureMultiplier || 1) * 1000) / 1000,
      coming_soon: Boolean(entry.comingSoon),
    })),
    shop_item_configs: Object.values(SHOP_ITEM_CONFIG_BY_ID)
      .filter((item) => item && item.itemType !== "ball")
      .sort(compareShopItems)
      .map((item) => ({
        id: item.id,
        name_fr: item.nameFr,
        item_type: item.itemType,
        category: item.category,
        price: Math.max(0, toSafeInt(item.price, 0)),
        effect_kind: item.effectKind || "",
        effect_value: item.effectValue ?? "",
        effect_duration_ms: Math.max(0, toSafeInt(item.effectDurationMs, 0)),
        stock_tracked: Boolean(item.stockTracked),
      })),
    save_backend: "browser_storage",
    shop_open: Boolean(state.ui.shopOpen),
    map_open: Boolean(state.ui.mapOpen),
    shop_tab: String(state.ui.shopTab || SHOP_TAB_POKEBALLS),
    shop_ball_purchase_mode: normalizeShopQuantityMode(state.ui.shopQuantityMode),
    shop_ball_purchase_qty:
      normalizeShopQuantityMode(state.ui.shopQuantityMode) === SHOP_QUANTITY_MODE_MAX
        ? null
        : getSelectedShopBallQuantity(),
    boxes_open: Boolean(state.ui.boxesOpen),
    boxes_target_slot_index: toSafeInt(state.ui.boxesTargetSlotIndex, -1),
    boxes_entity_count: state.saveData ? getCapturedEntityCount() : 0,
    boxes_shiny_capture_total: state.saveData ? getTotalShinyCapturesGlobal() : 0,
    appearance_editor_unlocked: isAppearanceEditorUnlocked(),
    appearance_open: Boolean(state.ui.appearanceOpen),
    appearance_target_slot_index: toSafeInt(state.ui.appearanceTargetSlotIndex, -1),
    appearance_pokemon_id: Number(state.ui.appearancePokemonId || 0) || null,
    team_context_menu_open: Boolean(state.ui.teamContextMenuOpen),
    team_context_menu_slot_index: toSafeInt(state.ui.teamContextMenuSlotIndex, -1),
    ball_capture_menu_open: Boolean(state.ui.ballCaptureMenuOpen),
    ball_capture_menu_ball_type: getBallCaptureMenuBallType() || null,
    ball_capture_rules: state.saveData
      ? Object.fromEntries(
          BALL_TYPE_FALLBACK_ORDER.map((ballType) => [ballType, getBallCaptureRulesForType(ballType)]),
        )
      : null,
    appearance_selected_variant_id: appearanceRecord?.appearance_selected_variant || null,
    appearance_shiny_mode: Boolean(appearanceRecord?.appearance_shiny_mode),
    appearance_ultra_shiny_mode: Boolean(appearanceRecord?.appearance_ultra_shiny_mode),
    appearance_shiny_unlocked_family: isShinyAppearanceUnlockedForRecord(appearanceRecord, appearancePokemonId),
    appearance_ultra_shiny_unlocked_family: isUltraShinyAppearanceUnlockedForRecord(appearanceRecord, appearancePokemonId),
    tutorial_open: Boolean(state.ui.tutorialOpen),
    tutorial_flow_id: state.ui.tutorialOpen ? String(state.tutorial.active?.flowId || "") : null,
    tutorial_page: state.ui.tutorialOpen ? Math.max(1, toSafeInt(state.tutorial.active?.pageIndex, 0) + 1) : 0,
    tutorial_page_count: state.ui.tutorialOpen
      ? Math.max(1, getTutorialFlowDefinition(state.tutorial.active?.flowId)?.pages?.length || 1)
      : 0,
    top_message: null,
    notifications_active: Array.isArray(state.notifications.items) ? state.notifications.items.length : 0,
    notifications_temporary: Array.isArray(state.notifications.items)
      ? state.notifications.items.filter((item) => item?.type === "temporary").length
      : 0,
    notifications_evolution_ready: Array.isArray(state.notifications.items)
      ? state.notifications.items.filter((item) => item?.type === "evolution_ready").length
      : 0,
    money_display_value: Math.max(0, Math.round(Number(state.moneyHud.displayValue) || 0)),
    coins_display_value: Math.max(0, toSafeInt(state.saveData?.coins, 0)),
    team_level_up_effects_active: Array.isArray(state.teamLevelUpEffects) ? state.teamLevelUpEffects.length : 0,
    team_xp_gain_effects_active: Array.isArray(state.teamXpGainEffects) ? state.teamXpGainEffects.length : 0,
    active_projectiles: (battle ? battle.getProjectiles() : []).map((projectile) => ({
      type: projectile.attackType,
      x: Math.round(projectile.x),
      y: Math.round(projectile.y),
      attacker_name_fr: projectile.attackerNameFr,
    })),
    floating_damage_texts: (battle ? battle.getFloatingTexts() : []).map((text) => ({
      damage: text.damage,
      missed: Boolean(text.isMiss),
      label: text.label || "",
      x: Math.round(text.x),
      y: Math.round(text.y),
      life_ms: Math.round(text.lifeMs),
    })),
    last_impact: battle ? battle.lastImpact : null,
    enemy_damage_flash_blend: battle ? Math.round(battle.getEnemyDamageFlashBlend() * 1000) / 1000 : 0,
    team_attack_flash_blends: battle
      ? Array.from({ length: MAX_TEAM_SIZE }, (_, index) => Math.round(battle.getSlotAttackFlashBlend(index) * 1000) / 1000)
      : [],
    ko_transition: battle ? battle.getKoTransition() : null,
    capture_sequence: battle ? battle.getCaptureSequence() : null,
    evolution_animation: state.evolutionAnimation.current
      ? {
          from_id: state.evolutionAnimation.current.fromId,
          to_id: state.evolutionAnimation.current.toId,
          from_name_fr: state.evolutionAnimation.current.fromNameFr,
          to_name_fr: state.evolutionAnimation.current.toNameFr,
          elapsed_ms: Math.round(state.evolutionAnimation.current.elapsedMs),
          total_ms: Math.round(state.evolutionAnimation.current.totalMs),
          queue_remaining: Math.max(0, state.evolutionAnimation.queue.length),
        }
      : null,
    background_drift: {
      x: Math.round((Number(state.backgroundDrift.currentX) || 0) * 100) / 100,
      y: Math.round((Number(state.backgroundDrift.currentY) || 0) * 100) / 100,
    },
    enemy,
    team,
  };

  return JSON.stringify(payload);
}

window.render_game_to_text = exportTextState;
window.advanceTime = (ms) => {
  const totalMs = Number.isFinite(ms) ? Math.max(0, Number(ms)) : 0;
  const steps = Math.max(1, Math.round(totalMs / BASE_STEP_MS));
  const stepMs = steps > 0 ? totalMs / steps : BASE_STEP_MS;
  for (let i = 0; i < steps; i += 1) {
    update(stepMs || BASE_STEP_MS);
  }
  render();
};

window.__pokeidle_debug_getSpriteFrameIndex = (target = "enemy", slotIndex = 0) => {
  const which = String(target || "").toLowerCase().trim();
  const slot = clamp(toSafeInt(slotIndex, 0), 0, MAX_TEAM_SIZE - 1);
  const entity = which === "enemy" ? state.enemy : state.team[slot];
  if (!entity) {
    return null;
  }
  const resolved = resolveEntitySpriteDrawSource(entity);
  const base = entity.spriteImage || null;
  const spritePath = String(entity.spritePath || base?.currentSrc || base?.src || "");
  const cacheEntry = spritePath ? animatedSpriteFramesCache.get(spritePath) : null;
  return {
    id: Number(entity.id || 0),
    sprite_variant_id: entity.spriteVariantId || null,
    sprite_path: spritePath || null,
    sprite_animated: Boolean(entity.spriteAnimated),
    frame_index: toSafeInt(resolved.frameIndex, -1),
    cache_status: cacheEntry?.status || null,
    cache_frames: Array.isArray(cacheEntry?.frames) ? cacheEntry.frames.length : 0,
    cache_error: cacheEntry?.error || null,
  };
};

function getPokemonLoadTargets(routeDataInput) {
  const targetsById = new Map();
  for (const starter of STARTER_CHOICES) {
    targetsById.set(Number(starter.id), starter.nameEn);
  }

  if (state.saveData?.pokemon_entities && typeof state.saveData.pokemon_entities === "object") {
    for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
      const id = Number(record?.id || rawId || 0);
      const speciesNameEn = String(record?.species_name_en || record?.name_en || "").toLowerCase().trim();
      if (id > 0 && speciesNameEn) {
        targetsById.set(id, speciesNameEn);
      }
    }
  }

  const routeDataList = Array.isArray(routeDataInput)
    ? routeDataInput
    : routeDataInput
      ? [routeDataInput]
      : [];

  for (const routeData of routeDataList) {
    const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
    for (const encounter of encounters) {
      const id = Number(encounter?.id || 0);
      const nameEn = String(encounter?.name_en || "").toLowerCase();
      if (id > 0 && nameEn) {
        targetsById.set(id, nameEn);
      }
    }
  }

  return Array.from(targetsById.entries()).map(([id, nameEn]) => ({ id, nameEn }));
}

function warnRuntimeDataValidation(message, error) {
  const detail = error instanceof Error ? error.message : String(error || "");
  console.warn(`[pokeidle:data] ${message}${detail ? `: ${detail}` : ""}`);
}

function normalizePokemonTalentFromCsvRow(row, fallbackTalent = null) {
  const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
  if (pokemonId <= 0) {
    return null;
  }

  const fallback = normalizeTalentDefinition(fallbackTalent);
  const talentId = normalizeTalentId(
    readCsvCell(row, "talent_id") ||
      readCsvCell(row, "talent_name_en") ||
      readCsvCell(row, "talent_name_fr") ||
      fallback.id,
  );
  const talent = normalizeTalentDefinition({
    id: talentId,
    name_fr: readCsvCell(row, "talent_name_fr") || fallback.nameFr,
    name_en: readCsvCell(row, "talent_name_en") || fallback.nameEn,
    description_fr: readCsvCell(row, "talent_description_fr") || fallback.descriptionFr,
  });
  return {
    pokemonId,
    talent,
  };
}

async function loadPokemonTalentCsv(csvPath = POKEMON_TALENTS_CSV_PATH) {
  const requestPath = `${String(csvPath || POKEMON_TALENTS_CSV_PATH)}?ts=${Date.now()}`;
  const response = await fetch(requestPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger " + csvPath);
  }
  const rawCsv = await response.text();
  const rows = parseCsvObjects(rawCsv, csvPath);
  const talentsByPokemonId = new Map();
  const unresolvedTalentIds = new Set();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
    if (pokemonId <= 0) {
      continue;
    }
    const fallbackTalent = talentsByPokemonId.get(pokemonId) || null;
    const normalized = normalizePokemonTalentFromCsvRow(row, fallbackTalent);
    if (!normalized) {
      continue;
    }
    talentsByPokemonId.set(normalized.pokemonId, normalized.talent);

    if (
      normalized.talent.id !== TALENT_NONE_ID &&
      getPassiveBehaviorIdForTalentId(normalized.talent.id) === TALENT_NONE_ID
    ) {
      unresolvedTalentIds.add(normalized.talent.id);
    }
  }

  return {
    path: csvPath,
    rowCount: rows.length,
    talentsByPokemonId,
    unresolvedTalentIds: Array.from(unresolvedTalentIds.values()),
  };
}

function setPokemonTalentCsvState(payload) {
  state.pokemonTalentCsvByPokemonId =
    payload?.talentsByPokemonId instanceof Map ? payload.talentsByPokemonId : new Map();
  state.pokemonTalentCsvLoaded = state.pokemonTalentCsvByPokemonId.size > 0;
}

function getPokemonTalentCsvForPokemonId(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return null;
  }
  if (!state.pokemonTalentCsvByPokemonId.has(id)) {
    return null;
  }
  return normalizeTalentDefinition(state.pokemonTalentCsvByPokemonId.get(id));
}

function applyPokemonTalentCsvToDefinitions(defsById = state.pokemonDefsById) {
  if (!(defsById instanceof Map) || defsById.size <= 0) {
    return;
  }
  for (const [pokemonId, def] of defsById.entries()) {
    if (!def || typeof def !== "object") {
      continue;
    }
    const csvTalent = getPokemonTalentCsvForPokemonId(pokemonId);
    if (!csvTalent) {
      continue;
    }
    def.talent = normalizeTalentDefinition(csvTalent);
  }
}

function normalizeBallConfigFromCsvRow(row, fallbackConfig = null) {
  const fallback = fallbackConfig && typeof fallbackConfig === "object" ? fallbackConfig : {};
  const type = String(readCsvCell(row, "ball_type") || readCsvCell(row, "type") || fallback.type || "")
    .toLowerCase()
    .trim();
  if (!type) {
    return null;
  }
  return {
    type,
    nameFr: readCsvCell(row, "name_fr") || fallback.nameFr || type,
    price: Math.max(0, toSafeInt(readCsvCell(row, "price"), fallback.price ?? 0)),
    captureMultiplier: Math.max(0.05, readCsvNumberCell(row, "capture_multiplier", Number(fallback.captureMultiplier || 1))),
    description: readCsvCell(row, "description") || fallback.description || "",
    spritePath: readCsvCell(row, "sprite_path") || fallback.spritePath || "",
    comingSoon: readCsvBooleanCell(row, "coming_soon", Boolean(fallback.comingSoon)),
    sortOrder: Math.max(0, toSafeInt(readCsvCell(row, "sort_order"), fallback.sortOrder ?? 0)),
  };
}

async function loadBallConfigCsv(csvPath = BALL_CONFIG_CSV_PATH) {
  const requestPath = `${String(csvPath || BALL_CONFIG_CSV_PATH)}?ts=${Date.now()}`;
  const response = await fetch(requestPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger " + csvPath);
  }
  const rawCsv = await response.text();
  const rows = parseCsvObjects(rawCsv, csvPath);
  const configsByType = {};
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const type = String(readCsvCell(row, "ball_type") || readCsvCell(row, "type") || "").toLowerCase().trim();
    if (!type) {
      continue;
    }
    const fallback = configsByType[type] || DEFAULT_BALL_CONFIG_BY_TYPE[type] || null;
    const config = normalizeBallConfigFromCsvRow(row, fallback);
    if (!config) {
      continue;
    }
    try {
      const validatedConfig = assertValidBallConfig(config, `${csvPath} ligne ${rowIndex + 2}`);
      configsByType[validatedConfig.type] = validatedConfig;
    } catch (error) {
      warnRuntimeDataValidation(`Ball config ignoree (${type})`, error);
    }
  }
  return {
    path: csvPath,
    configsByType,
  };
}

function setBallConfigState(payload) {
  const nextConfigByType = cloneConfigMap(DEFAULT_BALL_CONFIG_BY_TYPE);
  const sourceEntries =
    payload?.configsByType && typeof payload.configsByType === "object" ? Object.entries(payload.configsByType) : [];
  for (const [type, config] of sourceEntries) {
    const normalizedType = String(type || "").toLowerCase().trim();
    if (!normalizedType || !config || typeof config !== "object") {
      continue;
    }
    nextConfigByType[normalizedType] = {
      ...(nextConfigByType[normalizedType] || {}),
      ...config,
      type: normalizedType,
    };
  }
  replaceConfigMap(BALL_CONFIG_BY_TYPE, nextConfigByType);
  refreshBallConfigDerivedState();
  rebuildShopItemConfigState();
  state.ballConfigCsvLoaded = sourceEntries.length > 0;
  state.configRevisions.ball += 1;
}

function normalizeShopItemConfigFromCsvRow(row, fallbackConfig = null) {
  const fallback = fallbackConfig && typeof fallbackConfig === "object" ? fallbackConfig : {};
  const id = String(readCsvCell(row, "item_id") || readCsvCell(row, "id") || fallback.id || "")
    .toLowerCase()
    .trim();
  if (!id) {
    return null;
  }
  const itemType = String(readCsvCell(row, "item_type") || fallback.itemType || "")
    .toLowerCase()
    .trim();
  if (!itemType || itemType === "ball") {
    return null;
  }
  const category = String(readCsvCell(row, "category") || fallback.category || SHOP_TAB_COMBAT)
    .toLowerCase()
    .trim();
  const stockTrackedDefault = itemType === "stone";
  const stoneType = String(readCsvCell(row, "stone_type") || fallback.stoneType || id)
    .toLowerCase()
    .trim();
  return {
    id,
    category: category || SHOP_TAB_COMBAT,
    nameFr: readCsvCell(row, "name_fr") || fallback.nameFr || id,
    description: readCsvCell(row, "description") || fallback.description || "",
    price: Math.max(0, toSafeInt(readCsvCell(row, "price"), fallback.price ?? 0)),
    spritePath: readCsvCell(row, "sprite_path") || fallback.spritePath || "",
    itemType,
    effectKind: String(readCsvCell(row, "effect_kind") || fallback.effectKind || "")
      .toLowerCase()
      .trim(),
    effectValue: readCsvTypedValue(row, "effect_value", fallback.effectValue ?? ""),
    effectDurationMs: Math.max(0, toSafeInt(readCsvCell(row, "effect_duration_ms"), fallback.effectDurationMs ?? 0)),
    stockTracked: readCsvBooleanCell(row, "stock_tracked", fallback.stockTracked ?? stockTrackedDefault),
    sortOrder: Math.max(0, toSafeInt(readCsvCell(row, "sort_order"), fallback.sortOrder ?? 0)),
    stoneType,
    methodItem: readCsvCell(row, "method_item") || fallback.methodItem || "",
  };
}

async function loadShopItemConfigCsv(csvPath = SHOP_ITEMS_CSV_PATH) {
  const requestPath = `${String(csvPath || SHOP_ITEMS_CSV_PATH)}?ts=${Date.now()}`;
  const response = await fetch(requestPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger " + csvPath);
  }
  const rawCsv = await response.text();
  const rows = parseCsvObjects(rawCsv, csvPath);
  const configsById = {};
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const id = String(readCsvCell(row, "item_id") || readCsvCell(row, "id") || "").toLowerCase().trim();
    if (!id) {
      continue;
    }
    const fallback = configsById[id] || DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID[id] || null;
    const config = normalizeShopItemConfigFromCsvRow(row, fallback);
    if (!config) {
      continue;
    }
    try {
      const validatedConfig = assertValidShopItemConfig(config, `${csvPath} ligne ${rowIndex + 2}`);
      configsById[validatedConfig.id] = validatedConfig;
    } catch (error) {
      warnRuntimeDataValidation(`Shop item ignore (${id})`, error);
    }
  }
  return {
    path: csvPath,
    configsById,
  };
}

function setShopItemConfigState(payload) {
  const nextExtraShopItemsById = cloneConfigMap(DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID);
  const sourceEntries =
    payload?.configsById && typeof payload.configsById === "object" ? Object.entries(payload.configsById) : [];
  for (const [id, config] of sourceEntries) {
    const normalizedId = String(id || "").toLowerCase().trim();
    if (!normalizedId || !config || typeof config !== "object") {
      continue;
    }
    nextExtraShopItemsById[normalizedId] = {
      ...(nextExtraShopItemsById[normalizedId] || {}),
      ...config,
      id: normalizedId,
    };
  }
  replaceConfigMap(EXTRA_SHOP_ITEM_CONFIG_BY_ID, nextExtraShopItemsById);
  rebuildEvolutionStoneConfigState(EXTRA_SHOP_ITEM_CONFIG_BY_ID);
  rebuildShopItemConfigState();
  state.shopItemConfigCsvLoaded = sourceEntries.length > 0;
  state.configRevisions.shopItem += 1;
}

function normalizeEncounterFromCsvRow(row) {
  const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
  if (pokemonId <= 0) {
    return null;
  }
  const minLevel = clamp(toSafeInt(readCsvCell(row, "min_level"), DEFAULT_WILD_LEVEL_MIN), 1, MAX_LEVEL);
  const maxLevel = clamp(
    toSafeInt(readCsvCell(row, "max_level"), Math.max(minLevel, DEFAULT_WILD_LEVEL_MAX)),
    minLevel,
    MAX_LEVEL,
  );
  return {
    id: pokemonId,
    name_en: readCsvCell(row, "pokemon_name_en").toLowerCase(),
    name_fr: readCsvCell(row, "pokemon_name_fr"),
    spawn_weight: Math.max(1, toSafeInt(readCsvCell(row, "spawn_weight"), 1)),
    min_level: minLevel,
    max_level: maxLevel,
    methods: parseCsvMethods(readCsvCell(row, "methods")),
  };
}

async function loadZoneEncounterCsv(csvPath = ROUTE_ENCOUNTERS_CSV_PATH) {
  const requestPath = `${String(csvPath || ROUTE_ENCOUNTERS_CSV_PATH)}?ts=${Date.now()}`;
  const response = await fetch(requestPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger " + csvPath);
  }
  const rawCsv = await response.text();
  const rows = parseCsvObjects(rawCsv, csvPath);
  const routeIds = new Set();
  const encountersByRouteId = new Map();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const routeId = readCsvCell(row, "route_id");
    if (!routeId) {
      continue;
    }
    routeIds.add(routeId);
    if (!encountersByRouteId.has(routeId)) {
      encountersByRouteId.set(routeId, []);
    }
    const encounter = normalizeEncounterFromCsvRow(row);
    if (!encounter) {
      continue;
    }
    try {
      const validatedEncounter = assertValidEncounter(encounter, `${csvPath} ligne ${rowIndex + 2}`);
      encountersByRouteId.get(routeId).push(validatedEncounter);
    } catch (error) {
      warnRuntimeDataValidation(`Encounter ignore (${routeId})`, error);
    }
  }

  for (const list of encountersByRouteId.values()) {
    list.sort((a, b) => b.spawn_weight - a.spawn_weight || a.id - b.id);
  }

  return {
    path: csvPath,
    routeIds,
    encountersByRouteId,
  };
}

function setZoneEncounterCsvState(payload) {
  state.zoneEncounterCsvByRouteId = payload?.encountersByRouteId instanceof Map ? payload.encountersByRouteId : new Map();
  state.zoneEncounterCsvRouteIds = payload?.routeIds instanceof Set ? payload.routeIds : new Set();
  state.zoneEncounterCsvLoaded = state.zoneEncounterCsvRouteIds.size > 0;
}

function getZoneEncounterCsvForRoute(routeId) {
  const id = String(routeId || "");
  if (!id || !state.zoneEncounterCsvRouteIds.has(id)) {
    return null;
  }
  const list = state.zoneEncounterCsvByRouteId.get(id);
  return Array.isArray(list) ? list : [];
}

function mergeRouteEncountersFromCsv(routeData, csvEntries) {
  const sourceEntries = Array.isArray(csvEntries) ? csvEntries : [];
  const fallbackById = new Map();
  const fallbackEntries = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  for (const fallback of fallbackEntries) {
    const id = Number(fallback?.id || 0);
    if (id > 0 && !fallbackById.has(id)) {
      fallbackById.set(id, fallback);
    }
  }

  const merged = [];
  for (const entry of sourceEntries) {
    const id = Number(entry?.id || 0);
    if (id <= 0) {
      continue;
    }
    const fallback = fallbackById.get(id) || null;
    const nameEn = String(entry?.name_en || fallback?.name_en || "").toLowerCase().trim();
    if (!nameEn) {
      continue;
    }
    const minLevel = clamp(toSafeInt(entry?.min_level, fallback?.min_level ?? DEFAULT_WILD_LEVEL_MIN), 1, MAX_LEVEL);
    const maxLevel = clamp(
      toSafeInt(entry?.max_level, fallback?.max_level ?? Math.max(minLevel, DEFAULT_WILD_LEVEL_MAX)),
      minLevel,
      MAX_LEVEL,
    );
    merged.push({
      id,
      name_en: nameEn,
      name_fr: String(entry?.name_fr || fallback?.name_fr || nameEn).trim(),
      spawn_weight: Math.max(1, toSafeInt(entry?.spawn_weight, fallback?.spawn_weight ?? 1)),
      min_level: minLevel,
      max_level: maxLevel,
      methods:
        Array.isArray(entry?.methods) && entry.methods.length > 0
          ? entry.methods
          : Array.isArray(fallback?.methods)
            ? fallback.methods
            : [],
      catch_rate: fallback?.catch_rate,
    });
  }
  merged.sort((a, b) => b.spawn_weight - a.spawn_weight || a.id - b.id);
  return merged;
}

function buildRouteDataPath(routeId) {
  return ROUTE_DATA_DIR + "/" + routeId + ".json";
}

async function loadRouteData(routeId = DEFAULT_ROUTE_ID) {
  const routePath = buildRouteDataPath(routeId);
  const response = await fetch(routePath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger " + routePath);
  }
  const routeData = validateRouteDataPayload(await response.json(), `Route data ${routePath}`);
  if (!Array.isArray(routeData?.encounters)) {
    throw new Error("Aucune liste d'encounters configuree pour " + routeId);
  }
  const csvEncounters = getZoneEncounterCsvForRoute(routeData?.route_id || routeId);
  if (csvEncounters !== null) {
    routeData.encounters = mergeRouteEncountersFromCsv(routeData, csvEncounters);
    routeData.encounters_source = "csv";
  } else {
    routeData.encounters_source = "json";
  }
  const combatEnabled = routeData?.combat_enabled !== false;
  if (combatEnabled && routeData.encounters.length === 0) {
    throw new Error("Aucun Pokemon configure pour " + routeId);
  }
  return routeData;
}

async function loadRouteCatalog(routeIds = ROUTE_ID_ORDER) {
  const baseList = Array.isArray(routeIds) ? routeIds : [DEFAULT_ROUTE_ID];
  const uniqueRouteIds = Array.from(new Set(baseList.map((routeId) => String(routeId || ""))));
  if (!uniqueRouteIds.includes(DEFAULT_ROUTE_ID)) {
    uniqueRouteIds.unshift(DEFAULT_ROUTE_ID);
  }

  const catalog = new Map();
  for (const routeId of uniqueRouteIds) {
    try {
      const routeData = await loadRouteData(routeId);
      catalog.set(routeId, routeData);
    } catch (error) {
      if (routeId === DEFAULT_ROUTE_ID) {
        throw error;
      }
    }
  }

  if (!catalog.has(DEFAULT_ROUTE_ID)) {
    throw new Error("Route par defaut manquante: " + DEFAULT_ROUTE_ID);
  }

  return catalog;
}

function getRouteDataListFromInput(routeInput) {
  if (routeInput instanceof Map) {
    return Array.from(routeInput.values());
  }
  if (Array.isArray(routeInput)) {
    return routeInput.filter((routeData) => routeData && typeof routeData === "object");
  }
  return [];
}

function getRouteDataByIds(routeIds, routeCatalog = state.routeCatalog) {
  if (!(routeCatalog instanceof Map) || routeCatalog.size <= 0) {
    return [];
  }
  const sourceIds = Array.isArray(routeIds) ? routeIds : [routeIds];
  const uniqueIds = Array.from(new Set(sourceIds.map((routeId) => String(routeId || ""))));
  const routeDataList = [];
  for (const routeId of uniqueIds) {
    const routeData = routeCatalog.get(routeId) || null;
    if (routeData) {
      routeDataList.push(routeData);
    }
  }
  return routeDataList;
}

function getInitialAssetRouteIds() {
  const routeIds = new Set([DEFAULT_ROUTE_ID, ROUTE_1_TUTORIAL_ID]);
  const currentRouteId = String(state.saveData?.current_route_id || "");
  if (currentRouteId) {
    routeIds.add(currentRouteId);
  }
  const unlockedRouteIds = normalizeUnlockedRouteIds(state.saveData?.unlocked_route_ids, getOrderedCatalogRouteIds());
  for (const routeId of unlockedRouteIds) {
    routeIds.add(routeId);
  }
  return Array.from(routeIds).filter((routeId) => state.routeCatalog.has(routeId));
}

async function preloadRouteBackgrounds(routeInput) {
  const routeDataList = getRouteDataListFromInput(routeInput);
  const entries = await Promise.all(
    routeDataList.map(async (routeData) => [routeData.route_id, await loadImage(routeData.background_image || null)]),
  );
  return new Map(entries);
}

function queueDeferredRouteAssetWarmup(preloadedRouteIds = []) {
  if (!(state.routeCatalog instanceof Map) || state.routeCatalog.size <= 0) {
    return;
  }
  const alreadyLoaded = new Set(
    (Array.isArray(preloadedRouteIds) ? preloadedRouteIds : [preloadedRouteIds]).map((routeId) => String(routeId || "")),
  );
  const remainingRouteIds = getOrderedCatalogRouteIds().filter((routeId) => !alreadyLoaded.has(routeId));
  if (remainingRouteIds.length <= 0) {
    return;
  }

  const runWarmup = () => {
    const routeDataList = getRouteDataByIds(remainingRouteIds);
    if (routeDataList.length <= 0) {
      return;
    }
    Promise.all([loadPokemonDefinitions(routeDataList, { append: true }), preloadRouteBackgrounds(routeDataList)])
      .then(([, warmBackgrounds]) => {
        if (warmBackgrounds instanceof Map && warmBackgrounds.size > 0) {
          state.routeBackgroundsById = new Map([...state.routeBackgroundsById, ...warmBackgrounds]);
        }
      })
      .catch((error) => {
        console.warn(
          "Prechargement differe des assets de routes indisponible:",
          error instanceof Error ? error.message : String(error || ""),
        );
      });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(
      () => {
        runWarmup();
      },
      { timeout: 2500 },
    );
    return;
  }
  window.setTimeout(() => {
    runWarmup();
  }, 220);
}

function hasMissingRoutePokemonDefinitions(routeData) {
  const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  for (const encounter of encounters) {
    const id = Number(encounter?.id || 0);
    if (id > 0 && !state.pokemonDefsById.has(id)) {
      return true;
    }
  }
  return false;
}

function ensureRouteBackgroundLoaded(routeData) {
  const routeId = String(routeData?.route_id || "");
  if (!routeId) {
    return;
  }
  if (state.routeBackgroundsById.has(routeId) || pendingRouteBackgroundLoads.has(routeId)) {
    return;
  }
  const task = loadImage(routeData?.background_image || null)
    .then((image) => {
      state.routeBackgroundsById.set(routeId, image || null);
      if (state.routeData?.route_id === routeId) {
        state.backgroundImage = image || null;
        render();
      }
    })
    .finally(() => {
      pendingRouteBackgroundLoads.delete(routeId);
    });
  pendingRouteBackgroundLoads.set(routeId, task);
}

function ensureRouteDefinitionsLoaded(routeData) {
  const routeId = String(routeData?.route_id || "");
  if (!routeId || !hasMissingRoutePokemonDefinitions(routeData)) {
    return;
  }
  if (pendingRouteDefinitionLoads.has(routeId)) {
    return;
  }
  const task = loadPokemonDefinitions([routeData], { append: true })
    .then(() => {
      if (state.routeData?.route_id !== routeId) {
        return;
      }
      if (!state.battle || state.enemy || !isCurrentRouteCombatEnabled()) {
        return;
      }
      state.battle.spawnEnemy();
      state.enemy = state.battle.getEnemy();
      if (!state.simulationIdleMode) {
        updateHud();
      }
      render();
    })
    .catch((error) => {
      console.warn(
        `Impossible de precharger les definitions de ${routeId}:`,
        error instanceof Error ? error.message : String(error || ""),
      );
    })
    .finally(() => {
      pendingRouteDefinitionLoads.delete(routeId);
    });
  pendingRouteDefinitionLoads.set(routeId, task);
}

function ensureRouteAssetsLoaded(routeData) {
  if (!routeData || typeof routeData !== "object") {
    return;
  }
  ensureRouteBackgroundLoaded(routeData);
  ensureRouteDefinitionsLoaded(routeData);
}

function ensureUnlockedRoutesForCurrentCatalog() {
  if (!state.saveData) {
    return [DEFAULT_ROUTE_ID];
  }

  const availableRouteIds = getOrderedCatalogRouteIds();
  const normalizedUnlocked = normalizeUnlockedRouteIds(state.saveData.unlocked_route_ids, availableRouteIds);
  state.saveData.unlocked_route_ids = normalizedUnlocked;
  state.saveData.route_defeat_counts = normalizeRouteDefeatCounts(state.saveData.route_defeat_counts, availableRouteIds);
  return normalizedUnlocked;
}

function setActiveRoute(routeId, options = {}) {
  const announceUnlock = options?.announceUnlock === true;
  const desiredRouteId = String(routeId || DEFAULT_ROUTE_ID);
  const routeData = state.routeCatalog.get(desiredRouteId) || state.routeCatalog.get(DEFAULT_ROUTE_ID) || null;
  if (!routeData) {
    return false;
  }

  state.routeData = routeData;
  state.backgroundImage = state.routeBackgroundsById.get(routeData.route_id) || null;
  resetBackgroundDriftForRoute(routeData.route_id, { immediate: true });
  resetOnlyOneEncounterCycle(routeData.route_id);
  if (state.saveData) {
    state.saveData.current_route_id = routeData.route_id;
    ensureUnlockedRoutesForCurrentCatalog();
    if (getRouteUnlockMode(routeData.route_id) === "visit") {
      const unlockResult = tryUnlockNextRouteAfterDefeat(routeData.route_id);
      if (announceUnlock && unlockResult?.unlocked) {
        setTopMessage(`Zone debloquee: ${unlockResult.route_name_fr}`, 1700);
      }
    }
  }
  queueRoute1TutorialIfNeeded(routeData.route_id);
  refreshRouteUi();
  tryOpenPendingTutorialFlow();
  ensureRouteAssetsLoaded(routeData);
  return true;
}

function tryUnlockNextRouteAfterDefeat(routeId) {
  if (!state.saveData || !state.routeCatalog?.size) {
    return { unlocked: false, route_name_fr: null };
  }

  const currentRouteId = String(routeId || state.saveData.current_route_id || DEFAULT_ROUTE_ID);
  const orderedRouteIds = getOrderedCatalogRouteIds();
  const currentIndex = orderedRouteIds.indexOf(currentRouteId);
  if (currentIndex < 0) {
    return { unlocked: false, route_name_fr: null };
  }

  const nextRouteId = orderedRouteIds[currentIndex + 1] || null;
  if (!nextRouteId) {
    return { unlocked: false, route_name_fr: null };
  }

  const unlockedRouteIds = ensureUnlockedRoutesForCurrentCatalog();
  if (unlockedRouteIds.includes(nextRouteId)) {
    return { unlocked: false, route_name_fr: getRouteDisplayName(nextRouteId) };
  }

  const unlockMode = getRouteUnlockMode(currentRouteId);
  if (unlockMode !== "visit") {
    const defeatTarget = getRouteUnlockDefeatTarget(currentRouteId);
    if (getRouteDefeatCount(currentRouteId) < defeatTarget) {
      return { unlocked: false, route_name_fr: null };
    }
  }

  const nextUnlocked = normalizeUnlockedRouteIds([...unlockedRouteIds, nextRouteId], orderedRouteIds);
  state.saveData.unlocked_route_ids = nextUnlocked;

  return {
    unlocked: true,
    route_id: nextRouteId,
    route_name_fr: getRouteDisplayName(nextRouteId),
    unlock_mode: unlockMode,
  };
}

async function loadPokemonDefinitions(routeDataInput, options = {}) {
  const append = options?.append !== false;
  const defsById = append ? new Map(state.pokemonDefsById) : new Map();
  const queuedIds = new Set();
  const queue = [];

  const enqueueTarget = (idRaw, nameEnRaw) => {
    const id = Number(idRaw || 0);
    const nameEn = String(nameEnRaw || "").toLowerCase().trim();
    if (id <= 0 || !nameEn || defsById.has(id) || queuedIds.has(id)) {
      return;
    }
    queuedIds.add(id);
    queue.push({ id, nameEn });
  };

  for (const target of getPokemonLoadTargets(routeDataInput)) {
    enqueueTarget(target.id, target.nameEn);
  }

  while (queue.length > 0) {
    const batch = queue.splice(0, Math.min(18, queue.length));
    const loadedBatch = await Promise.all(
      batch.map(async (entry) => {
        try {
          return await loadPokemonEntity(buildPokemonJsonPath(entry.id, entry.nameEn));
        } catch {
          return null;
        }
      }),
    );

    for (const def of loadedBatch) {
      if (!def || defsById.has(def.id)) {
        continue;
      }
      defsById.set(def.id, def);

      if (def.evolvesFrom?.id > 0 && def.evolvesFrom.nameEn) {
        enqueueTarget(def.evolvesFrom.id, def.evolvesFrom.nameEn);
      }
      for (const target of Array.isArray(def.evolvesTo) ? def.evolvesTo : []) {
        if (target?.id > 0 && target.nameEn) {
          enqueueTarget(target.id, target.nameEn);
        }
      }
    }
  }

  applyPokemonTalentCsvToDefinitions(defsById);
  state.pokemonDefsById = defsById;
}

async function initializeScene() {
  state.mode = "loading";
  state.pendingSimMs = 0;
  state.deferredSaveDirty = false;
  state.environment.nextUpdateAtMs = 0;
  updateEnvironment(Date.now(), true);
  initializeWindowsNotificationSystem();
  resetNotificationSystem();
  state.ui.shopTab = [SHOP_TAB_POKEBALLS, SHOP_TAB_COMBAT, SHOP_TAB_EVOLUTIONS].includes(state.ui.shopTab)
    ? state.ui.shopTab
    : SHOP_TAB_POKEBALLS;
  state.ui.shopQuantityMode = normalizeShopQuantityMode(state.ui.shopQuantityMode || "1");
  state.ui.shopCustomQuantity = clamp(toSafeInt(state.ui.shopCustomQuantity, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
  state.teamLevelUpEffects = [];
  state.teamXpGainEffects = [];
  state.teamXpPulseMsBySlot = {};
  state.xpHud.teamXpBySlot = {};
  state.xpHud.enemyHpKey = null;
  state.xpHud.enemyHpFrontRatio = 1;
  state.xpHud.enemyHpLagRatio = 1;
  state.moneyHud.initialized = false;
  state.moneyHud.targetValue = 0;
  state.moneyHud.displayValue = 0;
  state.moneyHud.lastRawValue = 0;
  state.moneyHud.pulseMs = 0;
  clearMoneyGainFloaters();
  state.evolutionAnimation.current = null;
  state.evolutionAnimation.queue = [];
  state.tutorial.queue = [];
  state.tutorial.active = null;
  state.ui.tutorialOpen = false;
  if (tutorialModalEl) {
    tutorialModalEl.classList.add("hidden");
  }
  setBallConfigState(null);
  setShopItemConfigState(null);
  setZoneEncounterCsvState(null);
  setPokemonTalentCsvState(null);
  stopBackgroundTicker();
  closeTeamContextMenu();
  clearCanvasHoverState();
  closeRenameModal();
  closeBoxesModal();
  closeAppearanceModal();
  setMapOpen(false);
  setShopOpen(false);
  try {
    let offlineCatchupMs = 0;
    const [ballCsvResult, shopItemCsvResult, zoneCsvResult, talentCsvResult] = await Promise.allSettled([
      loadBallConfigCsv(BALL_CONFIG_CSV_PATH),
      loadShopItemConfigCsv(SHOP_ITEMS_CSV_PATH),
      loadZoneEncounterCsv(ROUTE_ENCOUNTERS_CSV_PATH),
      loadPokemonTalentCsv(POKEMON_TALENTS_CSV_PATH),
    ]);

    if (ballCsvResult.status === "fulfilled") {
      setBallConfigState(ballCsvResult.value);
    } else {
      setBallConfigState(null);
      console.warn("Ball CSV indisponible, fallback config interne:", ballCsvResult.reason?.message || ballCsvResult.reason);
    }

    if (shopItemCsvResult.status === "fulfilled") {
      setShopItemConfigState(shopItemCsvResult.value);
    } else {
      setShopItemConfigState(null);
      console.warn(
        "Item CSV indisponible, fallback config interne:",
        shopItemCsvResult.reason?.message || shopItemCsvResult.reason,
      );
    }

    if (zoneCsvResult.status === "fulfilled") {
      setZoneEncounterCsvState(zoneCsvResult.value);
    } else {
      setZoneEncounterCsvState(null);
      console.warn("Zone CSV indisponible, fallback JSON:", zoneCsvResult.reason?.message || zoneCsvResult.reason);
    }

    if (talentCsvResult.status === "fulfilled") {
      setPokemonTalentCsvState(talentCsvResult.value);
      if (Array.isArray(talentCsvResult.value?.unresolvedTalentIds) && talentCsvResult.value.unresolvedTalentIds.length > 0) {
        console.warn(
          "Talents sans comportement passif code:",
          talentCsvResult.value.unresolvedTalentIds.join(", "),
        );
      }
    } else {
      setPokemonTalentCsvState(null);
      console.warn("Talent CSV indisponible, fallback JSON:", talentCsvResult.reason?.message || talentCsvResult.reason);
    }
    state.saveData = await loadSaveData();
    state.routeCatalog = await loadRouteCatalog(ROUTE_ID_ORDER);
    refreshOrderedCatalogRouteIds();
    ensureUnlockedRoutesForCurrentCatalog();
    const initialAssetRouteIds = getInitialAssetRouteIds();
    const initialAssetRouteData = getRouteDataByIds(initialAssetRouteIds);
    await loadPokemonDefinitions(initialAssetRouteData, { append: false });
    const unlockStateReconciled = reconcileEntityUnlockStates();
    const appearanceStateReconciled = reconcileEntityAppearanceStates();
    const runtimeSaveRepair = repairRuntimeSaveAfterDefinitionsLoaded();
    const tutorialProgressBefore = JSON.stringify(state.saveData.tutorials || {});
    getTutorialProgress();
    const appearanceUnlockedFromProgress = ensureAppearanceEditorUnlockedFromProgress();
    const tutorialProgressAfter = JSON.stringify(state.saveData.tutorials || {});
    const tutorialProgressChanged = tutorialProgressBefore !== tutorialProgressAfter || appearanceUnlockedFromProgress;
    const [routeBackgroundsById, typeIconImages] = await Promise.all([
      preloadRouteBackgrounds(initialAssetRouteData),
      preloadTypeIcons(),
      preloadSelectedAppearanceAssetsForTeam(),
    ]);
    state.routeBackgroundsById = routeBackgroundsById;
    state.typeIconImages = typeIconImages;

    ensureUnlockedRoutesForCurrentCatalog();
    const preferredRouteId = typeof state.saveData.current_route_id === "string" ? state.saveData.current_route_id : DEFAULT_ROUTE_ID;
    const unlockedRouteIds = ensureUnlockedRoutesForCurrentCatalog();
    const initialRouteId = unlockedRouteIds.includes(preferredRouteId) ? preferredRouteId : unlockedRouteIds[0];
    setActiveRoute(initialRouteId, { announceUnlock: false });

    ensureMoneyAndItems();
    syncWindowsPokeballInventoryTracking(state.saveData?.pokeballs, { silent: true });
    rebuildTeamAndSyncBattle();
    if (
      unlockStateReconciled
      || appearanceStateReconciled
      || runtimeSaveRepair.changed
      || tutorialProgressChanged
    ) {
      persistSaveData();
    }
    offlineCatchupMs = queueOfflineCatchupFromSave(Date.now());

    renderStarterChoices();
    updateHud();

    if (state.saveData.starter_chosen && state.team.length === 0) {
      throw new Error("La sauvegarde est incoherente: impossible de reconstruire une equipe jouable.");
    }

    if (!state.saveData.starter_chosen) {
      state.team = [];
      state.battle = null;
      state.enemy = null;
      state.pendingSimMs = 0;
      showStarterModal();
      setTopMessage("Choisis ton starter pour debuter sur Route 1.", 2200);
    } else {
      hideStarterModal();
      startBattle();
      if (runtimeSaveRepair.recoveredTeam) {
        setTopMessage("Sauvegarde reparee: equipe restauree automatiquement.", 2600);
      } else if (runtimeSaveRepair.hardResetApplied) {
        setTopMessage("Sauvegarde incoherente nettoyee. Une nouvelle partie est prete.", 2600);
      }
    }

    if (runtimeSaveRepair.hardResetApplied && !state.saveData.starter_chosen) {
      setTopMessage("Sauvegarde incoherente nettoyee. Choisis un starter pour repartir proprement.", 3200);
    }

    state.mode = "ready";
    queueDeferredRouteAssetWarmup(initialAssetRouteIds);
    queueAppearanceTutorialIfNeeded();
    tryOpenPendingTutorialFlow();
    if (offlineCatchupMs > 0 && state.battle) {
      consumePendingSimulation({
        forceIdleMode: true,
        budgetMs: HIDDEN_SIM_BUDGET_MS,
      });
    }
  } catch (error) {
    state.mode = "error";
    state.error = error instanceof Error ? error.message : "Erreur inconnue";
  }
  state.layout = computeLayout();
  if (document.hidden) {
    ensureBackgroundTicker();
  }
  render();
}

async function resetSaveAndRestart() {
  const shouldReset = window.confirm("Supprimer toute la sauvegarde locale et recommencer ?");
  if (!shouldReset) {
    return;
  }

  state.saveBackend.pendingSerializedSave = null;
  clearBrowserSaveRetry();
  const removedLocalStorage = removeSaveDataFromStorageKey("localStorage", SAVE_KEY);
  const removedSessionStorage = removeSaveDataFromStorageKey("sessionStorage", SAVE_SESSION_KEY);
  const removedIndexedDb = await deleteSaveDataFromIndexedDb();
  if (!removedLocalStorage && !removedSessionStorage && !removedIndexedDb) {
    window.alert("Impossible de supprimer la sauvegarde navigateur.");
    updateSaveBackendIndicator();
    return;
  }

  state.saveData = createEmptySave();
  syncWindowsPokeballInventoryTracking(state.saveData?.pokeballs, { silent: true });
  state.team = [];
  state.enemy = null;
  state.battle = null;
  state.pendingSimMs = 0;
  state.deferredSaveDirty = false;
  state.teamLevelUpEffects = [];
  state.teamXpGainEffects = [];
  state.teamXpPulseMsBySlot = {};
  state.xpHud.teamXpBySlot = {};
  state.xpHud.enemyHpKey = null;
  state.xpHud.enemyHpFrontRatio = 1;
  state.xpHud.enemyHpLagRatio = 1;
  state.moneyHud.initialized = false;
  state.moneyHud.targetValue = 0;
  state.moneyHud.displayValue = 0;
  state.moneyHud.lastRawValue = 0;
  state.moneyHud.pulseMs = 0;
  clearMoneyGainFloaters();
  state.evolutionAnimation.current = null;
  state.evolutionAnimation.queue = [];
  state.tutorial.queue = [];
  state.tutorial.active = null;
  state.ui.tutorialOpen = false;
  if (tutorialModalEl) {
    tutorialModalEl.classList.add("hidden");
  }
  state.ui.shopTab = SHOP_TAB_POKEBALLS;
  state.ui.shopQuantityMode = "1";
  state.ui.shopCustomQuantity = 1;
  state.realClockLastMs = Date.now();
  state.environment.nextUpdateAtMs = 0;
  updateEnvironment(Date.now(), true);
  stopBackgroundTicker();
  setMapOpen(false);
  setShopOpen(false);
  closeRenameModal();
  closeBoxesModal();
  closeAppearanceModal();
  closeTeamContextMenu();
  persistSaveData();
  updateHud();
  clearCanvasHoverState();
  hideStarterModal();
  initializeScene().catch(() => {});
}

async function toggleFullscreen() {
  const fullscreenTarget = gameStageEl || canvas;
  if (!document.fullscreenElement) {
    await fullscreenTarget.requestFullscreen();
    return;
  }
  await document.exitFullscreen();
}

document.addEventListener("keydown", (event) => {
  const key = String(event.key || "").toLowerCase();
  if (key === "escape" && state.ui.evolutionItemChoiceOpen) {
    event.preventDefault();
    closeEvolutionItemChoiceModal(null);
    return;
  }
  if (key === "escape" && state.ui.renameOpen) {
    event.preventDefault();
    closeRenameModal();
    return;
  }
  if (key === "escape" && state.ui.ballCaptureMenuOpen) {
    event.preventDefault();
    closeBallCaptureMenu();
    return;
  }
  if (key === "escape" && state.ui.teamContextMenuOpen) {
    event.preventDefault();
    closeTeamContextMenu();
    return;
  }
  if (key === "escape" && state.ui.tutorialOpen) {
    event.preventDefault();
    closeTutorialModal();
    return;
  }
  if (key === "escape" && state.ui.mapOpen) {
    event.preventDefault();
    setMapOpen(false);
    return;
  }
  if (key === "escape" && state.ui.shopOpen) {
    event.preventDefault();
    setShopOpen(false);
    return;
  }
  if (key === "escape" && state.ui.appearanceOpen) {
    event.preventDefault();
    closeAppearanceModal();
    return;
  }
  if (key === "escape" && state.ui.boxesOpen) {
    event.preventDefault();
    closeBoxesModal();
    return;
  }
  if (key === "f") {
    event.preventDefault();
    toggleFullscreen().catch(() => {});
  }
});

document.addEventListener(
  "contextmenu",
  (event) => {
    event.preventDefault();
  },
  { capture: true },
);

canvas.addEventListener("mousemove", handleCanvasMouseMove);
canvas.addEventListener("click", handleCanvasClick);
canvas.addEventListener("contextmenu", handleCanvasContextMenu);
canvas.addEventListener("mouseleave", clearCanvasHoverState);
if (teamContextMenuRenameButtonEl) {
  teamContextMenuRenameButtonEl.addEventListener("click", () => {
    const slotIndex = clamp(toSafeInt(state.ui.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    closeTeamContextMenu();
    if (slotIndex >= 0) {
      openRenameModalForTeamSlot(slotIndex);
    }
  });
}
if (teamContextMenuBoxesButtonEl) {
  teamContextMenuBoxesButtonEl.addEventListener("click", () => {
    const slotIndex = clamp(toSafeInt(state.ui.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    closeTeamContextMenu();
    if (slotIndex >= 0) {
      openBoxesForTeamSlot(slotIndex);
    }
  });
}
if (teamContextMenuAppearanceButtonEl) {
  teamContextMenuAppearanceButtonEl.addEventListener("click", () => {
    const slotIndex = clamp(toSafeInt(state.ui.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    closeTeamContextMenu();
    if (slotIndex >= 0) {
      openAppearanceForTeamSlot(slotIndex);
    }
  });
}
if (ballCaptureToggleAllButtonEl) {
  ballCaptureToggleAllButtonEl.addEventListener("click", () => {
    toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_ALL);
  });
}
if (ballCaptureToggleUnownedButtonEl) {
  ballCaptureToggleUnownedButtonEl.addEventListener("click", () => {
    toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_UNOWNED);
  });
}
if (ballCaptureToggleShinyButtonEl) {
  ballCaptureToggleShinyButtonEl.addEventListener("click", () => {
    toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_SHINY);
  });
}
if (ballCaptureToggleUltraButtonEl) {
  ballCaptureToggleUltraButtonEl.addEventListener("click", () => {
    toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY);
  });
}
document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (state.ui.teamContextMenuOpen) {
    if (!teamContextMenuEl || !teamContextMenuEl.contains(target)) {
      closeTeamContextMenu();
    }
  }
  if (state.ui.ballCaptureMenuOpen) {
    if (!ballCaptureMenuEl || !ballCaptureMenuEl.contains(target)) {
      closeBallCaptureMenu();
    }
  }
});
if (resetSaveButtonEl) {
  resetSaveButtonEl.addEventListener("click", resetSaveAndRestart);
}
if (mapButtonEl) {
  mapButtonEl.addEventListener("click", () => {
    setMapOpen(!state.ui.mapOpen);
  });
}
if (shopButtonEl) {
  shopButtonEl.addEventListener("click", () => {
    toggleShopPanel();
  });
}
if (windowsNotificationButtonEl) {
  windowsNotificationButtonEl.addEventListener("click", () => {
    void toggleWindowsNotificationSystemFromButton();
  });
}
if (routePrevButtonEl) {
  routePrevButtonEl.addEventListener("click", () => {
    navigateRouteByOffset(-1);
  });
}
if (routeNextButtonEl) {
  routeNextButtonEl.addEventListener("click", () => {
    navigateRouteByOffset(1);
  });
}
if (closeShopButtonEl) {
  closeShopButtonEl.addEventListener("click", () => {
    setShopOpen(false);
  });
}
if (evolutionItemCloseButtonEl) {
  evolutionItemCloseButtonEl.addEventListener("click", () => {
    closeEvolutionItemChoiceModal(null);
  });
}
if (mapCloseButtonEl) {
  mapCloseButtonEl.addEventListener("click", () => {
    setMapOpen(false);
  });
}
if (mapImageEl) {
  mapImageEl.addEventListener("load", () => {
    if (!state.ui.mapOpen) {
      return;
    }
    syncMapMarkerLayerBounds();
    renderMapModal();
  });
}
if (shopTabPokeballsButtonEl) {
  shopTabPokeballsButtonEl.addEventListener("click", () => {
    setShopTab(SHOP_TAB_POKEBALLS);
  });
}
if (shopTabCombatButtonEl) {
  shopTabCombatButtonEl.addEventListener("click", () => {
    setShopTab(SHOP_TAB_COMBAT);
  });
}
if (shopTabEvolutionsButtonEl) {
  shopTabEvolutionsButtonEl.addEventListener("click", () => {
    setShopTab(SHOP_TAB_EVOLUTIONS);
  });
}
for (const button of shopQtyPresetButtonEls) {
  button.addEventListener("click", () => {
    const mode = button.dataset.shopQty || "1";
    setShopQuantityMode(mode);
  });
}
if (shopCustomQtyInputEl) {
  shopCustomQtyInputEl.addEventListener("input", () => {
    state.ui.shopCustomQuantity = clamp(toSafeInt(shopCustomQtyInputEl.value, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
    if (state.ui.shopQuantityMode === SHOP_QUANTITY_MODE_CUSTOM) {
      renderShopModal();
    }
  });
  shopCustomQtyInputEl.addEventListener("focus", () => {
    if (state.ui.shopQuantityMode !== SHOP_QUANTITY_MODE_CUSTOM) {
      setShopQuantityMode(SHOP_QUANTITY_MODE_CUSTOM);
    }
  });
}
if (renameCloseButtonEl) {
  renameCloseButtonEl.addEventListener("click", () => {
    closeRenameModal();
  });
}
if (renameResetButtonEl) {
  renameResetButtonEl.addEventListener("click", () => {
    if (renameInputEl) {
      renameInputEl.value = "";
      refreshRenameCharCount();
      renameInputEl.focus();
    }
  });
}
if (renameInputEl) {
  renameInputEl.addEventListener("input", () => {
    const sanitized = sanitizePokemonNickname(renameInputEl.value);
    if (renameInputEl.value !== sanitized) {
      renameInputEl.value = sanitized;
    }
    refreshRenameCharCount();
  });
}
if (renameFormEl) {
  renameFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    applyRenameModal();
  });
}
if (boxesCloseButtonEl) {
  boxesCloseButtonEl.addEventListener("click", () => {
    closeBoxesModal();
  });
}
if (appearanceCloseButtonEl) {
  appearanceCloseButtonEl.addEventListener("click", () => {
    closeAppearanceModal();
  });
}
if (appearanceShinyToggleButtonEl) {
  appearanceShinyToggleButtonEl.addEventListener("click", () => {
    toggleAppearanceShinyMode();
  });
}
if (appearanceUltraShinyToggleButtonEl) {
  appearanceUltraShinyToggleButtonEl.addEventListener("click", () => {
    toggleAppearanceUltraShinyMode();
  });
}
if (tutorialPrevButtonEl) {
  tutorialPrevButtonEl.addEventListener("click", () => {
    if (!state.ui.tutorialOpen || !state.tutorial.active) {
      return;
    }
    state.tutorial.active.pageIndex = Math.max(0, toSafeInt(state.tutorial.active.pageIndex, 0) - 1);
    renderTutorialModal();
  });
}
if (tutorialNextButtonEl) {
  tutorialNextButtonEl.addEventListener("click", () => {
    if (!state.ui.tutorialOpen || !state.tutorial.active) {
      return;
    }
    const flow = getTutorialFlowDefinition(state.tutorial.active.flowId);
    const pageCount = Math.max(1, Array.isArray(flow?.pages) ? flow.pages.length : 0);
    const pageIndex = clamp(toSafeInt(state.tutorial.active.pageIndex, 0), 0, pageCount - 1);
    if (pageIndex >= pageCount - 1) {
      closeTutorialModal();
      return;
    }
    state.tutorial.active.pageIndex = pageIndex + 1;
    renderTutorialModal();
  });
}
if (tutorialCloseButtonEl) {
  tutorialCloseButtonEl.addEventListener("click", () => {
    closeTutorialModal();
  });
}
if (boxesModalEl) {
  boxesModalEl.addEventListener("click", (event) => {
    if (event.target === boxesModalEl) {
      closeBoxesModal();
    }
  });
}
if (appearanceModalEl) {
  appearanceModalEl.addEventListener("click", (event) => {
    if (event.target === appearanceModalEl) {
      closeAppearanceModal();
    }
  });
}
if (renameModalEl) {
  renameModalEl.addEventListener("click", (event) => {
    if (event.target === renameModalEl) {
      closeRenameModal();
    }
  });
}
if (tutorialModalEl) {
  tutorialModalEl.addEventListener("click", (event) => {
    if (event.target === tutorialModalEl) {
      closeTutorialModal();
    }
  });
}
if (shopModalEl) {
  shopModalEl.addEventListener("click", (event) => {
    if (event.target === shopModalEl) {
      setShopOpen(false);
    }
  });
}
if (evolutionItemModalEl) {
  evolutionItemModalEl.addEventListener("click", (event) => {
    if (event.target === evolutionItemModalEl) {
      closeEvolutionItemChoiceModal(null);
    }
  });
}
if (mapModalEl) {
  mapModalEl.addEventListener("click", (event) => {
    if (event.target === mapModalEl) {
      setMapOpen(false);
    }
  });
}
refreshRenameCharCount();
function handleLayoutResize() {
  resizeCanvas();
  if (!state.ui.mapOpen) {
    return;
  }
  syncMapMarkerLayerBounds();
  renderMapModal();
}
window.addEventListener("resize", handleLayoutResize);
document.addEventListener("fullscreenchange", handleLayoutResize);
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pagehide", handlePageLifecyclePersist);
window.addEventListener("beforeunload", handlePageLifecyclePersist);

applyInitialPerformanceProfile();
resizeCanvas();
state.realClockLastMs = Date.now();
initializeScene();
window.requestAnimationFrame(gameLoop);
