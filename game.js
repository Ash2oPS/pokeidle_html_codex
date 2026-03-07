const STARTER_CHOICES = [
  { id: 1, nameEn: "bulbasaur" },
  { id: 4, nameEn: "charmander" },
  { id: 7, nameEn: "squirtle" },
];

const DEFAULT_ROUTE_ID = "kanto_city_pallet_town";
const ROUTE_DATA_DIR = "map_data";
const ROUTE_ENCOUNTERS_CSV_PATH = "map_data/kanto_zone_encounters.csv";
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
const ROUTE_UNLOCK_DEFEATS = 20;
const ROUTE_1_POWER_MULTIPLIER = 0.2;
const SAVE_KEY = "pokeidle_save_v3";
const SHINY_ODDS = 1024;
const SAVE_VERSION = 6;
const SAVE_FILE_DB_NAME = "pokeidle_save_file_db";
const SAVE_FILE_DB_STORE = "save_handles";
const SAVE_FILE_HANDLE_KEY = "main_handle";
const SAVE_FILE_SUGGESTED_NAME = "pokeidle_save.json";
const SAVE_BRIDGE_URL = "http://127.0.0.1:38475";
const SAVE_BRIDGE_TIMEOUT_MS = 260;
const SPRITE_VARIANT_BASE_PRICE = 900;
const SPRITE_VARIANT_GEN_PRICE_STEP = 230;
const SPRITE_VARIANT_INDEX_PRICE_STEP = 120;

const MAX_TEAM_SIZE = 6;
const BASE_STEP_MS = 1000 / 60;
const ATTACK_INTERVAL_MS = 500;
const ATTACK_CRIT_CHANCE = 0.05;
const ATTACK_CRIT_MULTIPLIER = 1.5;
const STARTER_LEVEL = 1;
const PROJECTILE_SPEED_PX_PER_SECOND = 520;
const DAMAGE_SCALE = 1.7;
const KO_RESPAWN_DELAY_MS = 420;
const KO_ANIMATION_DURATION_MS = 210;
const ATTACK_FLASH_DURATION_MS = 150;
const ATTACK_FLASH_WHITE_BLEND = 0.4;
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
const MAX_LEVEL = 100;
const SHOP_TAB_POKEBALLS = "pokeballs";
const SHOP_TAB_COMBAT = "combat";
const SHOP_TAB_EVOLUTIONS = "evolutions";
const BOOST_X_DURATION_MS = 2 * 60 * 1000;
const BOOST_X_ATTACK_INTERVAL_MULTIPLIER = 0.33;
const DEFAULT_WILD_LEVEL_MIN = 2;
const DEFAULT_WILD_LEVEL_MAX = 6;
const ENEMY_MONEY_BASE = 10;
const ENEMY_MONEY_LEVEL_MULT = 7;
const ENEMY_MONEY_STAT_FACTOR = 0.05;
const CAPTURE_XP_BASE = 16;
const CAPTURE_XP_LEVEL_MULT = 8;
const CAPTURE_XP_STAT_FACTOR = 0.045;
const FOREGROUND_FRAME_STEP_MS = 40;
const FOREGROUND_SIM_BUDGET_MS = 4200;
const HIDDEN_SIM_BUDGET_MS = 180000;
const BULK_IDLE_THRESHOLD_MS = 1200;
const MAX_OFFLINE_CATCHUP_MS = 1000 * 60 * 60 * 24 * 7;
const BACKGROUND_TICK_INTERVAL_MS = 1000;
const EVOLUTION_ANIM_TOTAL_MS = 1680;
const EVOLUTION_ANIM_WHITE_MS = 820;
const EVOLUTION_ANIM_FLASH_MS = 220;
const EVOLUTION_ANIM_REVEAL_MS = 520;
const BACKGROUND_DRIFT_TRAVEL_MIN_MS = 9000;
const BACKGROUND_DRIFT_TRAVEL_MAX_MS = 21000;
const BACKGROUND_DRIFT_HOLD_MIN_MS = 1200;
const BACKGROUND_DRIFT_HOLD_MAX_MS = 4200;
const TEAM_LEVEL_UP_EFFECT_DURATION_MS = 780;
const WEATHER_CHANGE_INTERVAL_MS = 30 * 60 * 1000;
const WEATHER_TRANSITION_DURATION_MS = 90 * 1000;
const WEATHER_LIGHTNING_WINDOW_MS = 1700;

const BALL_TYPE_ORDER = ["hyper_ball", "super_ball", "poke_ball"];
const BALL_TYPE_FALLBACK_ORDER = ["poke_ball", "super_ball", "hyper_ball"];
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
const BALL_CONFIG_BY_TYPE = {
  poke_ball: {
    type: "poke_ball",
    nameFr: "PokeBall",
    price: 200,
    captureMultiplier: 1,
    spritePath: "assets/items/poke_ball.png",
  },
  super_ball: {
    type: "super_ball",
    nameFr: "SuperBall",
    price: 2500,
    captureMultiplier: 2,
    spritePath: "assets/items/super_ball.png",
  },
  hyper_ball: {
    type: "hyper_ball",
    nameFr: "HyperBall",
    price: 15000,
    captureMultiplier: 4,
    spritePath: "assets/items/hyper_ball.png",
  },
};
const EVOLUTION_STONE_CONFIG_BY_TYPE = {
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
const SHOP_ITEM_CONFIG_BY_ID = {
  poke_ball: {
    id: "poke_ball",
    category: SHOP_TAB_POKEBALLS,
    nameFr: "PokeBall",
    description: "Balle standard pour capturer les Pokemon sauvages.",
    price: BALL_CONFIG_BY_TYPE.poke_ball.price,
    spritePath: BALL_CONFIG_BY_TYPE.poke_ball.spritePath,
    itemType: "ball",
    ballType: "poke_ball",
  },
  super_ball: {
    id: "super_ball",
    category: SHOP_TAB_POKEBALLS,
    nameFr: "SuperBall",
    description: "x2 chances de capture par rapport a une PokeBall.",
    price: BALL_CONFIG_BY_TYPE.super_ball.price,
    spritePath: BALL_CONFIG_BY_TYPE.super_ball.spritePath,
    itemType: "ball",
    ballType: "super_ball",
  },
  hyper_ball: {
    id: "hyper_ball",
    category: SHOP_TAB_POKEBALLS,
    nameFr: "HyperBall",
    description: "x2 chances de capture par rapport a une SuperBall.",
    price: BALL_CONFIG_BY_TYPE.hyper_ball.price,
    spritePath: BALL_CONFIG_BY_TYPE.hyper_ball.spritePath,
    itemType: "ball",
    ballType: "hyper_ball",
  },
  x_boost: {
    id: "x_boost",
    category: SHOP_TAB_COMBAT,
    nameFr: "Boost X",
    description: "Multiplie l'intervalle d'attaque par 0.33 pendant 2 minutes.",
    price: 20000,
    spritePath: "assets/items/x_boost.png",
    itemType: "boost",
  },
  water_stone: {
    id: "water_stone",
    category: SHOP_TAB_EVOLUTIONS,
    nameFr: "Pierre Eau",
    description: "Fait evoluer une espece compatible (si evo non deja possedee).",
    price: EVOLUTION_STONE_CONFIG_BY_TYPE.water_stone.price,
    spritePath: EVOLUTION_STONE_CONFIG_BY_TYPE.water_stone.spritePath,
    itemType: "stone",
    stoneType: "water_stone",
  },
  fire_stone: {
    id: "fire_stone",
    category: SHOP_TAB_EVOLUTIONS,
    nameFr: "Pierre Feu",
    description: "Fait evoluer une espece compatible (si evo non deja possedee).",
    price: EVOLUTION_STONE_CONFIG_BY_TYPE.fire_stone.price,
    spritePath: EVOLUTION_STONE_CONFIG_BY_TYPE.fire_stone.spritePath,
    itemType: "stone",
    stoneType: "fire_stone",
  },
  leaf_stone: {
    id: "leaf_stone",
    category: SHOP_TAB_EVOLUTIONS,
    nameFr: "Pierre Plante",
    description: "Fait evoluer une espece compatible (si evo non deja possedee).",
    price: EVOLUTION_STONE_CONFIG_BY_TYPE.leaf_stone.price,
    spritePath: EVOLUTION_STONE_CONFIG_BY_TYPE.leaf_stone.spritePath,
    itemType: "stone",
    stoneType: "leaf_stone",
  },
};

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
const ctx = canvas.getContext("2d");
const gameStageEl = document.getElementById("game-stage");
const starterModalEl = document.getElementById("starter-modal");
const starterChoicesEl = document.getElementById("starter-choices");
const hoverPopupEl = document.getElementById("hover-popup");
const resetSaveButtonEl = document.getElementById("reset-save-btn");
const mapButtonEl = document.getElementById("map-btn");
const mapModalEl = document.getElementById("map-modal");
const mapCloseButtonEl = document.getElementById("map-close-btn");
const mapImageEl = document.getElementById("map-image");
const mapMarkersEl = document.getElementById("map-markers");
const shopButtonEl = document.getElementById("shop-btn");
const shopModalEl = document.getElementById("shop-modal");
const shopModalSubtitleEl = document.getElementById("shop-modal-subtitle");
const shopGridEl = document.getElementById("shop-grid");
const shopPokeballQtyPanelEl = document.getElementById("shop-pokeball-qty-panel");
const shopCustomQtyInputEl = document.getElementById("shop-custom-qty-input");
const shopTabPokeballsButtonEl = document.getElementById("shop-tab-pokeballs");
const shopTabCombatButtonEl = document.getElementById("shop-tab-combat");
const shopTabEvolutionsButtonEl = document.getElementById("shop-tab-evolutions");
const shopTabButtonEls = Array.from(document.querySelectorAll("[data-shop-tab]"));
const shopQtyPresetButtonEls = Array.from(document.querySelectorAll("[data-shop-qty]"));
const linkSaveFileButtonEl = document.getElementById("link-save-file-btn");
const closeShopButtonEl = document.getElementById("close-shop-btn");
const moneyPillEl = document.getElementById("money-pill");
const moneyValueEl = document.getElementById("money-value");
const moneyAnimLayerEl = document.getElementById("money-anim-layer");
const pokeballValueEl = document.getElementById("pokeball-value");
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
const appearanceModalEl = document.getElementById("appearance-modal");
const appearanceTitleEl = document.getElementById("appearance-title");
const appearanceSubtitleEl = document.getElementById("appearance-subtitle");
const appearanceCloseButtonEl = document.getElementById("appearance-close-btn");
const appearanceShinyToggleButtonEl = document.getElementById("appearance-shiny-toggle-btn");
const appearanceShinyStatusEl = document.getElementById("appearance-shiny-status");
const appearanceGridEl = document.getElementById("appearance-grid");
const notificationStackEl = document.getElementById("notification-stack");
const linkSaveFileButtonLabelEl = linkSaveFileButtonEl?.querySelector(".btn-label") || null;
const projectileSpriteCache = new Map();
const pokemonSpriteImageCache = new Map();
const mapMarkerButtonsByRouteId = new Map();

const state = {
  mode: "loading",
  error: null,
  timeMs: 0,
  routeData: null,
  backgroundImage: null,
  routeCatalog: new Map(),
  routeBackgroundsById: new Map(),
  zoneEncounterCsvByRouteId: new Map(),
  zoneEncounterCsvRouteIds: new Set(),
  zoneEncounterCsvLoaded: false,
  pokemonDefsById: new Map(),
  saveData: null,
  team: [],
  enemy: null,
  battle: null,
  viewport: { width: 960, height: 540, dpr: 1 },
  layout: null,
  lastFrameTimestamp: 0,
  realClockLastMs: 0,
  pendingSimMs: 0,
  simulationIdleMode: false,
  deferredSaveDirty: false,
  backgroundTickHandle: null,
  notifications: {
    items: [],
    nextId: 1,
    dirty: true,
    nextEvolutionScanMs: 0,
  },
  teamLevelUpEffects: [],
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
  },
  ui: {
    mapOpen: false,
    shopOpen: false,
    shopTab: SHOP_TAB_POKEBALLS,
    shopQuantityMode: "1",
    shopCustomQuantity: 1,
    boxesOpen: false,
    boxesTargetSlotIndex: -1,
    boxesHoverEntityId: null,
    appearanceOpen: false,
    appearanceTargetSlotIndex: -1,
    appearancePokemonId: null,
  },
  saveBackend: {
    fileHandle: null,
    writesInFlight: Promise.resolve(),
    linkedFromDb: false,
    bridgeAvailable: false,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  moneyValueEl.textContent = String(Math.max(0, toSafeInt(value, 0)));
}

function spawnMoneyGainFloater(amount) {
  const gain = Math.max(0, toSafeInt(amount, 0));
  if (gain <= 0) {
    return;
  }
  const layer = getMoneyAnimationLayer();
  if (!layer) {
    return;
  }
  const floater = document.createElement("span");
  floater.className = "money-gain-floater";
  floater.textContent = "+" + String(gain);
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
  moneyValueEl.style.filter = `drop-shadow(0 0 ${Math.round(5 + pulse * 8)}px rgba(120, 215, 255, 0.42))`;
  moneyValueEl.style.textShadow = `0 0 ${Math.round(4 + pulse * 6)}px rgba(120, 220, 255, 0.35)`;
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

function renderNotificationStackUi() {
  if (!notificationStackEl) {
    return;
  }
  const items = Array.isArray(state.notifications.items) ? state.notifications.items : [];
  notificationStackEl.innerHTML = "";

  const sorted = items.slice().sort((a, b) => {
    const aTime = Number(a.createdAt || 0);
    const bTime = Number(b.createdAt || 0);
    return aTime - bTime;
  });

  for (const item of sorted) {
    const card = document.createElement("article");
    card.className = "game-notif";
    if (item.tone === "first") {
      card.classList.add("notif-first");
    } else if (item.tone === "shiny") {
      card.classList.add("notif-shiny");
    } else if (item.type === "evolution_ready") {
      card.classList.add("notif-evolution");
    }

    if (item.title) {
      const titleEl = document.createElement("div");
      titleEl.className = "game-notif-title";
      titleEl.textContent = item.title;
      card.appendChild(titleEl);
    }

    const textEl = document.createElement("div");
    textEl.className = "game-notif-text";
    textEl.textContent = item.message || "";
    card.appendChild(textEl);

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
  state.notifications.items.push({
    id,
    type: "temporary",
    tone: String(options.tone || "info"),
    title: options.title ? String(options.title) : "",
    message: text,
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
    createdAt: state.timeMs,
  });
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
    pushTemporaryNotification("Evolution impossible pour ce Pokemon.", 1800, { tone: "info", title: "Evolution" });
    return false;
  }

  queueEvolutionAnimationForResult(evolutionResult);
  removeNotificationById(id);
  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();
  render();
  pushTemporaryNotification(`${evolutionResult.fromNameFr} evolue en ${evolutionResult.toNameFr} !`, 2200, {
    tone: "first",
    title: "Evolution",
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
  const shinyLabel = isShiny ? " en shiny" : "";
  const actionLabel = category === "encountered" ? "vu" : "capture";
  const message = `${pokemonName} ${actionLabel} pour la premiere fois${shinyLabel}.`;

  pushTemporaryNotification(message, isShiny ? 4200 : 3200, {
    title: isShiny ? "Premiere fois shiny" : "Premiere fois",
    tone: isShiny ? "shiny" : "first",
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

function updateEnvironment() {
  state.environment.snapshot = getEnvironmentSnapshot(Date.now());
}

function getEnvironmentSnapshotForRender() {
  if (state.environment?.snapshot) {
    return state.environment.snapshot;
  }
  updateEnvironment();
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

function computeStatsAtLevel(baseStats, level) {
  const normalizedLevel = clamp(toSafeInt(level, 1), 1, MAX_LEVEL);
  const source = normalizeStatsPayload(baseStats);
  const iv = 20;

  const hp = Math.floor(((2 * source.hp + iv) * normalizedLevel) / 100) + normalizedLevel + 10;
  const attack = Math.floor(((2 * source.attack + iv) * normalizedLevel) / 100) + 5;
  const defense = Math.floor(((2 * source.defense + iv) * normalizedLevel) / 100) + 5;
  const specialAttack = Math.floor(((2 * source["special-attack"] + iv) * normalizedLevel) / 100) + 5;
  const specialDefense = Math.floor(((2 * source["special-defense"] + iv) * normalizedLevel) / 100) + 5;
  const speed = Math.floor(((2 * source.speed + iv) * normalizedLevel) / 100) + 5;

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
  const ratio = wild ? 7.1 : 7.6;
  return clamp(Math.round(hp * ratio + Number(level || 1) * 5.5), 40, 2600);
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
  const requirement = (45 + level * level * 5.2 + level * 18) * growth;
  return Math.max(45, Math.round(requirement));
}

function createEmptySpeciesStats() {
  return {
    encountered_normal: 0,
    encountered_shiny: 0,
    defeated_normal: 0,
    defeated_shiny: 0,
    captured_normal: 0,
    captured_shiny: 0,
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

function isDrawableImage(image) {
  return Boolean(
    image &&
      typeof image === "object" &&
      Number.isFinite(image.naturalWidth) &&
      Number.isFinite(image.naturalHeight) &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0,
  );
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
    generation: clamp(toSafeInt(rawVariant.generation, 1), 1, 9),
    gameKey: String(rawVariant.game_key || "").toLowerCase(),
    frontPath,
    frontShinyPath: resolveSpritePath(jsonPath, rawVariant.front_shiny),
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

function getDefaultSpriteVariantId(def) {
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return "";
  }
  const explicit = normalizeSpriteVariantId(def?.defaultSpriteVariantId);
  if (explicit && variants.some((entry) => entry.id === explicit)) {
    return explicit;
  }
  const frlg = variants.find((entry) => entry.id === "firered_leafgreen" || entry.gameKey === "firered-leafgreen");
  if (frlg) {
    return frlg.id;
  }
  return variants[0].id;
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
  const generationLabel = Number(variant.generation) > 0 ? "Gen " + String(variant.generation) : "";
  return generationLabel ? `${variant.labelFr} (${generationLabel})` : variant.labelFr;
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
    ...counters,
  };
}

function createPokemonEntityRecord(pokemonId, initialLevel = 1) {
  const level = clamp(toSafeInt(initialLevel, 1), 1, MAX_LEVEL);
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
    ...createEmptySpeciesStats(),
  };
}

function createDefaultBallInventory() {
  return {
    poke_ball: 0,
    super_ball: 0,
    hyper_ball: 0,
  };
}

function normalizeBallInventory(rawInventory) {
  const normalized = createDefaultBallInventory();
  const source = rawInventory && typeof rawInventory === "object" ? rawInventory : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = Math.max(0, toSafeInt(source[key], 0));
  }
  return normalized;
}

function createDefaultShopItemsInventory() {
  return {
    water_stone: 0,
    fire_stone: 0,
    leaf_stone: 0,
  };
}

function normalizeShopItemsInventory(rawInventory) {
  const normalized = createDefaultShopItemsInventory();
  const source = rawInventory && typeof rawInventory === "object" ? rawInventory : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = Math.max(0, toSafeInt(source[key], 0));
  }
  return normalized;
}

function getLegacyPokeballCount(rawSave) {
  return Math.max(0, toSafeInt(rawSave?.pokeballs, 0));
}

function createEmptySave() {
  return {
    version: SAVE_VERSION,
    starter_chosen: false,
    current_route_id: DEFAULT_ROUTE_ID,
    unlocked_route_ids: [DEFAULT_ROUTE_ID],
    route_defeat_counts: createRouteDefeatCounts(ROUTE_ID_ORDER),
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 0,
    ball_inventory: createDefaultBallInventory(),
    active_ball_type: "poke_ball",
    shop_items: createDefaultShopItemsInventory(),
    attack_boost_until_ms: 0,
    pokeballs: 0,
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
  const currentInventoryTotal = Object.values(ballInventory).reduce((sum, count) => sum + Math.max(0, toSafeInt(count, 0)), 0);
  if (currentInventoryTotal <= 0 && legacyPokeballs > 0) {
    ballInventory.poke_ball = legacyPokeballs;
  }

  const activeBallTypeRaw = String(rawSave.active_ball_type || "").toLowerCase().trim();
  const activeBallType = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeBallTypeRaw)
    ? activeBallTypeRaw
    : "poke_ball";
  const shopItems = normalizeShopItemsInventory(rawSave.shop_items);
  const attackBoostUntilMs = Math.max(0, toSafeInt(rawSave.attack_boost_until_ms, 0));
  const totalPokeballs = Object.values(ballInventory).reduce((sum, count) => sum + Math.max(0, toSafeInt(count, 0)), 0);

  return {
    version: SAVE_VERSION,
    starter_chosen:
      Boolean(rawSave.starter_chosen) || normalizedTeam.length > 0 || Object.values(entities).some((record) => isEntityUnlocked(record)),
    current_route_id: currentRouteId,
    unlocked_route_ids: unlockedRouteIds,
    route_defeat_counts: routeDefeatCounts,
    last_tick_epoch_ms: Math.max(0, toSafeInt(rawSave.last_tick_epoch_ms, 0)),
    team: normalizedTeam,
    pokemon_entities: entities,
    money: Math.max(0, toSafeInt(rawSave.money, 0)),
    ball_inventory: ballInventory,
    active_ball_type: activeBallType,
    shop_items: shopItems,
    attack_boost_until_ms: attackBoostUntilMs,
    pokeballs: Math.max(0, totalPokeballs),
  };
}

function supportsLocalFileSaveApi() {
  return (
    typeof window !== "undefined" &&
    typeof window.showSaveFilePicker === "function" &&
    typeof window.indexedDB !== "undefined"
  );
}

function refreshLocalFileLinkButtonState() {
  if (!linkSaveFileButtonEl) {
    return;
  }
  const supported = supportsLocalFileSaveApi();
  linkSaveFileButtonEl.disabled = !supported;

  if (supported) {
    if (linkSaveFileButtonLabelEl) {
      linkSaveFileButtonLabelEl.textContent = "Lier save locale";
    }
    linkSaveFileButtonEl.title = "Lier un fichier JSON de sauvegarde local (feature navigateur).";
    return;
  }

  if (linkSaveFileButtonLabelEl) {
    linkSaveFileButtonLabelEl.textContent = "Save locale indisponible";
  }
  linkSaveFileButtonEl.title =
    "Fonction non supportee sur ce navigateur (Firefox). Utilise la save AppData\\\\Roaming\\\\PokeIdle via le save bridge.";
}

function openSaveFileDb() {
  return new Promise((resolve, reject) => {
    if (!supportsLocalFileSaveApi()) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(SAVE_FILE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SAVE_FILE_DB_STORE)) {
        db.createObjectStore(SAVE_FILE_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IDB open failed"));
  });
}

async function readSaveFileHandleFromDb() {
  const db = await openSaveFileDb();
  if (!db) {
    return null;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_FILE_DB_STORE, "readonly");
    const store = tx.objectStore(SAVE_FILE_DB_STORE);
    const request = store.get(SAVE_FILE_HANDLE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("IDB get handle failed"));
  }).finally(() => {
    db.close();
  });
}

async function writeSaveFileHandleToDb(handle) {
  const db = await openSaveFileDb();
  if (!db) {
    return;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_FILE_DB_STORE, "readwrite");
    const store = tx.objectStore(SAVE_FILE_DB_STORE);
    const request = store.put(handle, SAVE_FILE_HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("IDB put handle failed"));
  }).finally(() => {
    db.close();
  });
}

async function restoreSaveFileHandleFromDb() {
  if (state.saveBackend.linkedFromDb) {
    return state.saveBackend.fileHandle;
  }
  state.saveBackend.linkedFromDb = true;
  try {
    const handle = await readSaveFileHandleFromDb();
    state.saveBackend.fileHandle = handle || null;
  } catch {
    state.saveBackend.fileHandle = null;
  }
  return state.saveBackend.fileHandle;
}

async function readSaveDataFromFileHandle(handle) {
  if (!handle) {
    return null;
  }
  try {
    const file = await handle.getFile();
    const text = await file.text();
    if (!text || !text.trim()) {
      return null;
    }
    return normalizeSave(JSON.parse(text));
  } catch {
    return null;
  }
}

async function writeSerializedSaveToFileHandle(handle, serializedSave) {
  if (!handle) {
    return false;
  }
  try {
    const writable = await handle.createWritable();
    await writable.write(serializedSave);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

function getSaveBridgeEndpoint(pathname = "") {
  const pathValue = String(pathname || "");
  if (!pathValue) {
    return SAVE_BRIDGE_URL;
  }
  if (pathValue.startsWith("/")) {
    return SAVE_BRIDGE_URL + pathValue;
  }
  return SAVE_BRIDGE_URL + "/" + pathValue;
}

async function fetchSaveBridge(pathname, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SAVE_BRIDGE_TIMEOUT_MS);
  try {
    return await fetch(getSaveBridgeEndpoint(pathname), {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readSaveDataFromBridge() {
  try {
    const response = await fetchSaveBridge("/save", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      state.saveBackend.bridgeAvailable = false;
      return { available: false, saveData: null };
    }

    const payload = await response.json();
    const saveRaw = payload && typeof payload === "object" ? payload.save : null;
    const saveData = saveRaw && typeof saveRaw === "object" ? normalizeSave(saveRaw) : null;
    state.saveBackend.bridgeAvailable = true;
    return { available: true, saveData };
  } catch {
    state.saveBackend.bridgeAvailable = false;
    return { available: false, saveData: null };
  }
}

async function writeSerializedSaveToBridge(serializedSave) {
  try {
    const response = await fetchSaveBridge("/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: serializedSave,
    });
    const ok = response.ok;
    state.saveBackend.bridgeAvailable = ok;
    return ok;
  } catch {
    state.saveBackend.bridgeAvailable = false;
    return false;
  }
}

function updateSaveBackendIndicator() {
  if (!saveBackendValueEl) {
    return;
  }
  if (state.saveBackend.bridgeAvailable) {
    saveBackendValueEl.textContent = "AppData\\Roaming\\PokeIdle";
    return;
  }
  saveBackendValueEl.textContent = state.saveBackend.fileHandle ? "fichier local" : "localStorage (bridge off)";
}

function getSaveTickEpochMs(savePayload) {
  return Math.max(0, toSafeInt(savePayload?.last_tick_epoch_ms, 0));
}

async function loadSaveData() {
  await restoreSaveFileHandleFromDb();
  const bridgeResult = await readSaveDataFromBridge();
  const bridgeSave = bridgeResult.saveData;

  let fileSave = null;
  if (state.saveBackend.fileHandle) {
    fileSave = await readSaveDataFromFileHandle(state.saveBackend.fileHandle);
  }

  let localSave = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      localSave = normalizeSave(JSON.parse(raw));
    }
  } catch {
    localSave = null;
  }

  const candidates = [bridgeSave, fileSave, localSave].filter(Boolean);
  let selected = null;
  if (candidates.length > 0) {
    selected = candidates.reduce((best, candidate) =>
      getSaveTickEpochMs(candidate) > getSaveTickEpochMs(best) ? candidate : best,
    candidates[0]);
  } else {
    selected = createEmptySave();
  }

  const serializedSelected = JSON.stringify(selected);
  localStorage.setItem(SAVE_KEY, serializedSelected);
  if (bridgeResult.available) {
    await writeSerializedSaveToBridge(serializedSelected);
  }
  updateSaveBackendIndicator();
  return selected;
}

function persistSaveData() {
  if (!state.saveData) {
    return;
  }
  state.saveData.last_tick_epoch_ms = Date.now();
  const serialized = JSON.stringify(state.saveData);
  localStorage.setItem(SAVE_KEY, serialized);

  const handle = state.saveBackend.fileHandle;

  state.saveBackend.writesInFlight = state.saveBackend.writesInFlight
    .then(async () => {
      await writeSerializedSaveToBridge(serialized);

      if (handle) {
        const written = await writeSerializedSaveToFileHandle(handle, serialized);
        if (!written) {
          throw new Error("save write failed");
        }
      }
    })
    .catch(() => {})
    .finally(() => {
      updateSaveBackendIndicator();
    });
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
  const budgetMs =
    Number.isFinite(budgetFromOptions) && budgetFromOptions > 0
      ? budgetFromOptions
      : hidden
        ? HIDDEN_SIM_BUDGET_MS
        : FOREGROUND_SIM_BUDGET_MS;

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
    updateHud();
  }
  return consumedMs;
}

function tickSimulationFromRealtime(options = {}) {
  const now = Date.now();
  if (state.mode !== "ready") {
    state.realClockLastMs = now;
    return 0;
  }
  queueRealtimeElapsedMs(now);
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

async function linkSaveFileFromUserAction() {
  if (!supportsLocalFileSaveApi()) {
    setTopMessage(
      "Firefox ne supporte pas ce bouton. La save principale passe par AppData\\Roaming\\PokeIdle via le save bridge.",
      3600,
    );
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: SAVE_FILE_SUGGESTED_NAME,
      types: [
        {
          description: "Poke Idle Save",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
    });
    if (!handle) {
      return;
    }

    state.saveBackend.fileHandle = handle;
    state.saveBackend.linkedFromDb = true;
    await writeSaveFileHandleToDb(handle);

    const loaded = await readSaveDataFromFileHandle(handle);
    let message = "Fichier de save local lie.";
    if (loaded) {
      state.saveData = loaded;
      message = "Save locale chargee depuis le fichier.";
    } else {
      if (!state.saveData) {
        state.saveData = createEmptySave();
      }
      await writeSerializedSaveToFileHandle(handle, JSON.stringify(state.saveData, null, 2));
    }

    persistSaveData();
    updateSaveBackendIndicator();
    await initializeScene();
    setTopMessage(message, 1900);
  } catch (error) {
    if (error && typeof error === "object" && error.name === "AbortError") {
      return;
    }
    setTopMessage("Impossible de lier le fichier de save local.", 2200);
  }
}

function ensureSpeciesStats(pokemonId) {
  if (!state.saveData) {
    return createPokemonEntityRecord(pokemonId, 1);
  }
  const key = String(pokemonId);
  if (!state.saveData.pokemon_entities[key]) {
    state.saveData.pokemon_entities[key] = createPokemonEntityRecord(pokemonId, 1);
  }
  return state.saveData.pokemon_entities[key];
}

function incrementSpeciesStat(pokemonId, kind, isShiny, amount = 1) {
  const record = ensureSpeciesStats(pokemonId);
  const suffix = isShiny ? "shiny" : "normal";
  const field = `${kind}_${suffix}`;
  const previousValue = toSafeInt(record[field], 0);
  const delta = Number(amount) || 0;
  const nextValue = Math.max(0, previousValue + delta);
  record[field] = nextValue;
  if (delta > 0) {
    notifyFirstTimeSpeciesProgress(pokemonId, kind, isShiny, previousValue, nextValue);
  }
}
function getOrderedCatalogRouteIds() {
  const availableRouteIds = state.routeCatalog?.size > 0 ? Array.from(state.routeCatalog.keys()) : ROUTE_ID_ORDER;
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

function getRouteMapMarker(routeId) {
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

function getRoutePowerMultiplier(routeId) {
  return String(routeId || "") === "kanto_route_1" ? ROUTE_1_POWER_MULTIPLIER : 1;
}

function getSpeciesStatsSummary(pokemonId) {
  const record = ensureSpeciesStats(pokemonId);
  const encounteredNormal = Math.max(0, toSafeInt(record.encountered_normal, 0));
  const encounteredShiny = Math.max(0, toSafeInt(record.encountered_shiny, 0));
  const defeatedNormal = Math.max(0, toSafeInt(record.defeated_normal, 0));
  const defeatedShiny = Math.max(0, toSafeInt(record.defeated_shiny, 0));
  const capturedNormal = Math.max(0, toSafeInt(record.captured_normal, 0));
  const capturedShiny = Math.max(0, toSafeInt(record.captured_shiny, 0));
  return {
    level: clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL),
    stats: normalizeStatsPayload(record.stats),
    entity_unlocked: isEntityUnlocked(record),
    encountered_normal: encounteredNormal,
    encountered_shiny: encounteredShiny,
    defeated_normal: defeatedNormal,
    defeated_shiny: defeatedShiny,
    captured_normal: capturedNormal,
    captured_shiny: capturedShiny,
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

function markEntityUnlocked(record, unlocked = true) {
  if (!record) {
    return;
  }
  record.entity_unlocked = Boolean(unlocked);
}

function isShinyAppearanceUnlockedForRecord(record) {
  if (!record) {
    return false;
  }
  return Math.max(0, toSafeInt(record.captured_shiny, 0)) > 0;
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
    return changed;
  }

  const validIds = new Set(variants.map((entry) => entry.id));
  const defaultVariantId = getDefaultSpriteVariantId(def);
  const ownedSet = new Set(
    normalizeSpriteVariantIdList(record.appearance_owned_variants).filter((variantId) => validIds.has(variantId)),
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

  let selectedId = normalizeSpriteVariantId(record.appearance_selected_variant);
  if (!selectedId || !ownedSet.has(selectedId)) {
    selectedId = orderedOwned[0] || defaultVariantId || variants[0].id;
  }
  if (selectedId !== record.appearance_selected_variant) {
    record.appearance_selected_variant = selectedId;
    changed = true;
  }

  if (record.appearance_shiny_mode && !isShinyAppearanceUnlockedForRecord(record)) {
    record.appearance_shiny_mode = false;
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
  if (selectedId) {
    const selectedVariant = owned.find((variant) => variant.id === selectedId);
    if (selectedVariant) {
      return selectedVariant;
    }
  }
  return owned[0] || variants[0] || null;
}

function resolveSpriteAppearanceForEntity(pokemonId, options = {}) {
  const id = Number(pokemonId || 0);
  const def = state.pokemonDefsById.get(id);
  if (!def) {
    return {
      variant: null,
      spritePath: "",
      spriteImage: null,
      shinyVisual: false,
      shinyUnlocked: false,
      shinyModeRequested: false,
    };
  }

  const record = getPokemonEntityRecord(id);
  if (record) {
    reconcileAppearanceForEntityRecord(record, id);
  }
  const variant = getSelectedOwnedSpriteVariantForRecord(record, def);
  const normalPath = variant?.frontPath || def.spritePath || "";
  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record);
  const shinyModeRequested = Boolean(options.forceShiny || (record?.appearance_shiny_mode && shinyUnlocked));
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
    shinyVisual: canRenderShiny,
    shinyUnlocked,
    shinyModeRequested,
  };
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
    return;
  }
  state.saveData.money = Math.max(0, toSafeInt(state.saveData.money, 0));
  const normalizedBallInventory = normalizeBallInventory(state.saveData.ball_inventory);
  const legacyBalls = Math.max(0, toSafeInt(state.saveData.pokeballs, 0));
  const normalizedInventoryTotal = Object.values(normalizedBallInventory).reduce(
    (sum, count) => sum + Math.max(0, toSafeInt(count, 0)),
    0,
  );
  if (normalizedInventoryTotal <= 0 && legacyBalls > 0) {
    normalizedBallInventory.poke_ball += legacyBalls;
  }
  state.saveData.ball_inventory = normalizedBallInventory;
  state.saveData.shop_items = normalizeShopItemsInventory(state.saveData.shop_items);
  state.saveData.attack_boost_until_ms = Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0));
  const activeBallType = String(state.saveData.active_ball_type || "").toLowerCase().trim();
  state.saveData.active_ball_type = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeBallType)
    ? activeBallType
    : "poke_ball";
  state.saveData.pokeballs = Object.values(normalizedBallInventory).reduce(
    (sum, count) => sum + Math.max(0, toSafeInt(count, 0)),
    0,
  );
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
  return Math.max(0, toSafeInt(state.saveData.ball_inventory?.[type], 0));
}

function getBallInventoryTotalCount() {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  return Object.values(state.saveData.ball_inventory || {}).reduce((sum, count) => sum + Math.max(0, toSafeInt(count, 0)), 0);
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
    return "poke_ball";
  }
  ensureMoneyAndItems();
  return String(state.saveData.active_ball_type || "poke_ball");
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
  state.saveData.ball_inventory[type] = Math.max(0, toSafeInt(state.saveData.ball_inventory[type], 0)) + delta;
  state.saveData.pokeballs = getBallInventoryTotalCount();
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
  state.saveData.pokeballs = getBallInventoryTotalCount();
  return true;
}

function getBallTypeForCapture() {
  if (!state.saveData) {
    return null;
  }
  ensureMoneyAndItems();
  const activeType = getActiveBallType();
  if (getBallInventoryCount(activeType) > 0) {
    return activeType;
  }
  for (const type of BALL_TYPE_ORDER) {
    if (getBallInventoryCount(type) > 0) {
      state.saveData.active_ball_type = type;
      return type;
    }
  }
  return null;
}

function consumeBallForCapture() {
  const ballType = getBallTypeForCapture();
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
    return Math.max(1, Number(BALL_CONFIG_BY_TYPE[type].captureMultiplier || 1));
  }
  return 1;
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
  return Math.max(65, Math.round(baseInterval * BOOST_X_ATTACK_INTERVAL_MULTIPLIER));
}

function activateAttackBoost(durationMs = BOOST_X_DURATION_MS) {
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
  if (!wasUnlocked) {
    setEntityLevel(record, initialLevel);
    record.xp = 0;
    markEntityUnlocked(record, true);
    reconcileAppearanceForEntityRecord(record, pokemonId);
  }
  return { record, wasUnlocked };
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

function isEvolutionMethodSatisfied(record, method) {
  if (!record || !method) {
    return false;
  }

  const trigger = String(method.trigger || method.evolutionType || "").toLowerCase();
  if (trigger !== "level-up") {
    return false;
  }

  if (method.minLevel != null && record.level < method.minLevel) {
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
    method.minHappiness != null ||
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
    if (!methods.some((method) => isEvolutionMethodSatisfied(record, method))) {
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

  const unlockResult = ensurePokemonEntityUnlocked(toId, 1);
  if (unlockResult.wasUnlocked) {
    return null;
  }

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
      const methods = Array.isArray(target.evolutionMethods) ? target.evolutionMethods : [];
      const hasItemMethod = methods.some((method) => {
        const trigger = String(method?.trigger || method?.evolutionType || "").toLowerCase();
        const methodItemToken = String(method?.item || "").toLowerCase().trim();
        return (trigger === "use-item" || trigger === "item") && methodItemToken === methodItem;
      });
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

function promptEvolutionStoneChoice(stoneType, candidates) {
  const stoneName = EVOLUTION_STONE_CONFIG_BY_TYPE[String(stoneType || "").toLowerCase().trim()]?.nameFr || "Pierre";
  if (!Array.isArray(candidates) || candidates.length <= 0) {
    return null;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  const lines = candidates.map(
    (entry, index) =>
      `${index + 1}. ${entry.fromNameFr} -> ${entry.toNameFr}${entry.teamSlotIndex >= 0 ? " (equipe)" : ""}`,
  );
  const answer = window.prompt(
    `${stoneName}: choisis une evolution a debloquer.\n${lines.join("\n")}\nEntrez un numero:`,
    "1",
  );
  if (answer == null) {
    return null;
  }
  const selectedIndex = toSafeInt(answer, 0) - 1;
  if (selectedIndex < 0 || selectedIndex >= candidates.length) {
    return null;
  }
  return candidates[selectedIndex];
}

function queueEvolutionAnimationForResult(evolutionResult) {
  if (!evolutionResult || !evolutionResult.fromDef || !evolutionResult.toDef) {
    return;
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

function resolveCaptureEntityUnlock(capturedPokemonId, isFirstCaptureOfSpecies) {
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

  if (isEvolutionSpecies && isFirstCaptureOfSpecies) {
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
    if (!isEvolutionSpecies || capturedTotal > 1) {
      markEntityUnlocked(record, true);
      changed = true;
    }
  }
  return changed;
}

function rebuildTeamAndSyncBattle() {
  state.team = hydrateTeamFromSave();
  if (state.battle) {
    state.battle.syncTeam(state.team);
  }
}

function queueTeamLevelUpEffects(levelUps) {
  if (!Array.isArray(levelUps) || levelUps.length <= 0) {
    return;
  }
  const layout = state.layout || computeLayout();
  const slots = Array.isArray(layout?.teamSlots) ? layout.teamSlots : [];

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
    const particleCount = 22;
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

function computeCaptureXpReward(enemy) {
  const enemyLevel = Math.max(1, toSafeInt(enemy?.level, 1));
  const baseStatTotal = getBaseStatTotal(enemy?.baseStats || enemy?.stats);
  const baseReward = CAPTURE_XP_BASE + enemyLevel * CAPTURE_XP_LEVEL_MULT + baseStatTotal * CAPTURE_XP_STAT_FACTOR;
  return Math.max(8, Math.round(baseReward * (enemy?.isShiny ? 1.35 : 1)));
}

function computeDefeatMoneyReward(enemy) {
  const enemyLevel = Math.max(1, toSafeInt(enemy?.level, 1));
  const baseStatTotal = getBaseStatTotal(enemy?.baseStats || enemy?.stats);
  const baseReward = ENEMY_MONEY_BASE + enemyLevel * ENEMY_MONEY_LEVEL_MULT + baseStatTotal * ENEMY_MONEY_STAT_FACTOR;
  return Math.max(4, Math.round(baseReward * (enemy?.isShiny ? 1.6 : 1)));
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

function awardCaptureXpToTeam(enemy) {
  if (!state.saveData || !Array.isArray(state.saveData.team) || state.saveData.team.length === 0) {
    return { reward: 0, levelUps: [], evolutionReady: [] };
  }
  const reward = computeCaptureXpReward(enemy);
  const levelUps = [];
  const evolutionReady = [];
  const teamSnapshot = state.saveData.team.slice(0, MAX_TEAM_SIZE).map((id) => Number(id));

  for (let slotIndex = 0; slotIndex < teamSnapshot.length; slotIndex += 1) {
    const pokemonId = teamSnapshot[slotIndex];
    if (pokemonId <= 0) {
      continue;
    }
    const record = ensureSpeciesStats(pokemonId);
    const beforeLevel = record.level;
    const result = applyExperienceToEntity(record, reward);
    if (result.gainedLevels > 0 && record.level > beforeLevel) {
      const def = state.pokemonDefsById.get(Number(pokemonId));
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

  rebuildTeamAndSyncBattle();
  return { reward, levelUps, evolutionReady };
}

function computeCatchChance(catchRate, ballMultiplier = 1) {
  const normalizedRate = clamp(Number(catchRate || 45), 1, 255) / 255;
  const baseChance = clamp(0.07 + normalizedRate * 0.75, 0.06, 0.94);
  const multiplier = Math.max(1, Number(ballMultiplier || 1));
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

function computeDamage(attacker, defender, attackType, typeMultiplier) {
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
  const levelFactor = (2 * level) / 5 + 2;
  const basePower = 70;
  const baseDamage = ((levelFactor * basePower * (attackStat / defenseStat)) / 50) + 2;

  const attackerTypes = Array.isArray(attacker?.defensiveTypes) ? attacker.defensiveTypes : [];
  const normalizedType = String(attackType || "normal").toLowerCase();
  const stab = attackerTypes.includes(normalizedType) || attacker?.offensiveType === normalizedType ? 1.25 : 1;
  const isCritical = Math.random() < ATTACK_CRIT_CHANCE;
  const crit = isCritical ? ATTACK_CRIT_MULTIPLIER : 1;
  const variance = 0.9 + Math.random() * 0.2;
  const total = baseDamage * stab * typeMultiplier * crit * variance * DAMAGE_SCALE;

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
  }) {
    this.team = Array.isArray(team) ? team : [];
    this.attackIntervalMs = attackIntervalMs;
    this.getAttackIntervalMs = typeof getAttackIntervalMs === "function" ? getAttackIntervalMs : null;
    this.enemyRespawnDelayMs = respawnDelayMs;
    this.createEnemy = typeof createEnemy === "function" ? createEnemy : () => null;
    this.onEnemySpawn = typeof onEnemySpawn === "function" ? onEnemySpawn : () => {};
    this.onEnemyDefeated = typeof onEnemyDefeated === "function" ? onEnemyDefeated : () => {};
    this.turnIndex = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.hitEffects = [];
    this.enemyHitPulseMs = 0;
    this.enemyDamageFlashMs = 0;
    this.lastImpact = null;
    this.enemiesDefeated = 0;
    this.attackTimerMs = attackIntervalMs;
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.slotRecoil = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.slotAttackFlash = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.enemy = null;
    this.spawnEnemy();
  }

  getEffectiveAttackIntervalMs() {
    const dynamicValue = this.getAttackIntervalMs ? Number(this.getAttackIntervalMs()) : NaN;
    if (Number.isFinite(dynamicValue) && dynamicValue > 0) {
      return dynamicValue;
    }
    return this.attackIntervalMs;
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
    return {
      phase: this.getCaptureSequencePhase(),
      captured: this.captureSequence.captured,
      critical: Boolean(this.captureSequence.isCritical),
      elapsed_ms: Math.round(this.captureSequence.elapsedMs),
      total_ms: Math.round(this.captureSequence.totalMs),
      remaining_ms: Math.max(0, Math.round(this.captureSequence.totalMs - this.captureSequence.elapsedMs)),
    };
  }

  getCaptureSequenceState() {
    return this.captureSequence;
  }

  getTurnIndicator(layout) {
    const slots = layout?.teamSlots;
    if (!Array.isArray(slots) || slots.length < MAX_TEAM_SIZE) {
      return null;
    }

    const interval = Math.max(1, this.attackIntervalMs);
    const normalizedTimer = ((this.attackTimerMs % interval) + interval) % interval;
    const progressToNextAttack = 1 - normalizedTimer / interval;
    const nextAttackSlotIndex = ((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    const pathPosition = (nextAttackSlotIndex - 1 + progressToNextAttack + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    const angle = -Math.PI / 2 + (Math.PI * 2 * pathPosition) / MAX_TEAM_SIZE;
    const nearestSlotIndex = ((Math.round(pathPosition) % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;

    const slot = slots[0];
    if (!slot) {
      return null;
    }

    const radius = layout.teamRadius || Math.hypot(slot.x - layout.centerX, slot.y - layout.centerY);
    const indicatorX = layout.centerX + Math.cos(angle) * radius;
    const indicatorY = layout.centerY + Math.sin(angle) * radius + slot.size * 0.34;
    return {
      slot_index: nextAttackSlotIndex,
      x: indicatorX,
      y: indicatorY,
      radius: clamp(slot.size * 0.24, 18, 30),
      has_pokemon: Boolean(this.team[nearestSlotIndex]),
    };
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
    const slotIndex = this.turnIndex % MAX_TEAM_SIZE;
    return this.team[slotIndex]?.nameFr || null;
  }

  flushRespawnForIdleMode() {
    if (this.pendingRespawnMs > 0 || this.captureSequence || (this.enemy && this.enemy.hpCurrent <= 0)) {
      this.pendingRespawnMs = 0;
      this.captureSequence = null;
      this.koAnimMs = 0;
      this.projectiles = [];
      this.floatingTexts = [];
      this.hitEffects = [];
      this.enemyHitPulseMs = 0;
      this.enemyDamageFlashMs = 0;
      if (!this.enemy || this.enemy.hpCurrent <= 0) {
        this.spawnEnemy();
      }
    }
  }

  simulateAttackTickInstant(layout) {
    const attackerIndex = this.turnIndex % MAX_TEAM_SIZE;
    const attacker = this.team[attackerIndex];
    this.turnIndex = (attackerIndex + 1) % MAX_TEAM_SIZE;

    if (!attacker || !this.enemy || this.enemy.hpCurrent <= 0) {
      return;
    }

    const attackType = attacker.offensiveType || attacker.defensiveTypes[0] || "normal";
    const targetX = layout.centerX;
    const targetY = layout.centerY - layout.enemySize * 0.16;
    this.applyHit(
      {
        attackType,
        attackerIndex,
        attackerNameFr: attacker.nameFr,
        targetX,
        targetY,
      },
      { idleMode: true },
    );
  }

  update(deltaMs, layout, options = {}) {
    const idleMode = Boolean(options.idleMode);
    this.attackIntervalMs = Math.max(65, toSafeInt(this.getEffectiveAttackIntervalMs(), ATTACK_INTERVAL_MS));
    this.updateFloatingTexts(deltaMs);
    this.updateHitEffects(deltaMs);
    this.updateKoTransition(deltaMs);
    this.updateSlotRecoil(deltaMs);
    this.updateSlotAttackFlash(deltaMs);
    if (!layout) {
      return;
    }

    if (idleMode) {
      this.flushRespawnForIdleMode();
      this.attackTimerMs -= deltaMs;
      let safety = 0;
      const safetyMax = Math.max(10, Math.floor(deltaMs / Math.max(1, this.attackIntervalMs)) + 10);
      while (this.attackTimerMs <= 0 && safety < safetyMax) {
        this.simulateAttackTickInstant(layout);
        this.attackTimerMs += this.attackIntervalMs;
        safety += 1;
      }
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

    this.attackTimerMs -= deltaMs;
    while (this.attackTimerMs <= 0) {
      this.spawnNextProjectile(layout);
      this.attackTimerMs += this.attackIntervalMs;
    }

    this.updateProjectiles(deltaMs, layout);
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

    sequence.elapsedMs = Math.min(sequence.totalMs, sequence.elapsedMs + deltaMs);
    const shakeEnd = CAPTURE_THROW_MS + CAPTURE_SHAKE_MS;

    if (sequence.captured && !sequence.burstSpawned && sequence.elapsedMs >= shakeEnd) {
      sequence.burstSpawned = true;
      const count = isCritical ? 52 : 32;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = (isCritical ? 120 : 90) + Math.random() * (isCritical ? 190 : 150);
        const lifeMs = (isCritical ? 360 : 320) + Math.random() * (isCritical ? 460 : 380);
        const color =
          isCritical
            ? i % 3 === 0
              ? [255, 236, 130]
              : i % 3 === 1
                ? [214, 174, 255]
                : [184, 231, 255]
            : i % 2 === 0
              ? [115, 240, 160]
              : [255, 255, 195];
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
      const pieces = 16;
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
          color: Math.random() < 0.5 ? [225, 48, 60] : [250, 250, 250],
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

  spawnNextProjectile(layout) {
    const attackerIndex = this.turnIndex % MAX_TEAM_SIZE;
    const attacker = this.team[attackerIndex];
    const slot = layout.teamSlots[attackerIndex];
    const nextTurnIndex = (attackerIndex + 1) % MAX_TEAM_SIZE;
    this.turnIndex = nextTurnIndex;

    if (!attacker || !slot || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    const attackType = attacker.offensiveType || attacker.defensiveTypes[0] || "normal";
    const startX = slot.x;
    const startY = slot.y - slot.size * 0.12;
    const targetX = layout.centerX;
    const targetY = layout.centerY - layout.enemySize * 0.16;
    this.triggerSlotRecoil(attackerIndex);
    this.triggerSlotAttackFlash(attackerIndex);
    this.addAttackLaunchEffects({ attackType, startX, startY });
    const initialDistance = Math.hypot(targetX - startX, targetY - startY) || 1;
    this.projectiles.push({
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
    });
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

    const launchCount = 8;
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

    for (const projectile of this.projectiles) {
      projectile.prevX = projectile.x;
      projectile.prevY = projectile.y;
      projectile.targetX = layout.centerX;
      projectile.targetY = layout.centerY - layout.enemySize * 0.16;
      projectile.lifetimeMs += deltaMs;
      const existingTrail = Array.isArray(projectile.trail) ? projectile.trail : [];
      for (const point of existingTrail) {
        point.lifeMs -= deltaMs;
      }
      projectile.trail = existingTrail.filter((point) => point.lifeMs > 0);
      projectile.trail.push({
        x: projectile.x,
        y: projectile.y,
        lifeMs: PROJECTILE_TRAIL_POINT_LIFETIME_MS,
        maxLifeMs: PROJECTILE_TRAIL_POINT_LIFETIME_MS,
      });
      if (projectile.trail.length > PROJECTILE_TRAIL_MAX_POINTS) {
        projectile.trail.splice(0, projectile.trail.length - PROJECTILE_TRAIL_MAX_POINTS);
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

  addFloatingDamageText({ damage, attackType, typeMultiplier, isCritical = false, targetX, targetY }) {
    const labelParts = [];
    if (isCritical) {
      labelParts.push("CRIT");
    }
    if (typeMultiplier >= 2) {
      labelParts.push("SUPER");
    } else if (typeMultiplier > 0 && typeMultiplier < 1) {
      labelParts.push("RESIST");
    } else if (typeMultiplier === 0) {
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
      damage,
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

    const particleCount = clamp(Math.round(6 + damage / 22), 6, 14);
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
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    const attacker = this.team[projectile.attackerIndex];
    if (!attacker) {
      return;
    }

    const typeMultiplier = getTypeMultiplier(projectile.attackType, this.enemy.defensiveTypes);
    const damageOutcome = computeDamage(attacker, this.enemy, projectile.attackType, typeMultiplier);
    const baseDamage = Math.max(0, Number(damageOutcome?.damage || 0));
    const isCriticalHit = Boolean(damageOutcome?.isCritical);
    const powerMultiplier = clamp(Number(this.enemy?.battlePowerMultiplier || 1), 0.05, 1);
    const damage = baseDamage <= 0 ? 0 : Math.max(1, Math.round(baseDamage / powerMultiplier));

    this.enemy.hpCurrent = clamp(this.enemy.hpCurrent - damage, 0, this.enemy.hpMax);
    if (damage > 0) {
      this.enemyDamageFlashMs = Math.max(this.enemyDamageFlashMs, ENEMY_DAMAGE_FLASH_DURATION_MS);
    }
    this.lastImpact = {
      attackerNameFr: attacker.nameFr,
      attackType: projectile.attackType,
      damage,
      typeMultiplier,
      enemyNameFr: this.enemy.nameFr,
      isCritical: isCriticalHit,
    };
    if (!idleMode) {
      this.addFloatingDamageText({
        damage,
        attackType: projectile.attackType,
        typeMultiplier,
        isCritical: isCriticalHit,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
      });
      this.addEnemyHitEffects({
        damage,
        attackType: projectile.attackType,
        typeMultiplier,
        isCritical: isCriticalHit,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
      });
    }

    if (this.enemy.hpCurrent <= 0) {
      const defeatedEnemy = this.enemy;
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
        this.captureSequence = {
          captured,
          isCritical: captureCritical,
          elapsedMs: 0,
          totalMs: this.buildCaptureTotalMs(captured),
          targetX: projectile.targetX,
          targetY: projectile.targetY + 6,
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
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.onEnemySpawn(this.enemy);
  }
}

async function loadPokemonEntity(jsonPath) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${jsonPath}`);
  }

  const payload = await response.json();
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
        generation: 3,
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
  const defaultVariant =
    variants.find((entry) => entry.id === defaultSpriteVariantId) ||
    variants.find((entry) => entry.id === "firered_leafgreen") ||
    variants[0] ||
    null;
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
    spritePath,
    shinySpritePath,
    spriteImage,
    spriteShinyImage,
    spriteVariants: variants,
    defaultSpriteVariantId: defaultVariant?.id || "",
    evolvesFrom,
    evolvesTo,
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
  const appearance = resolveSpriteAppearanceForEntity(pokemonId);
  const level = clamp(toSafeInt(record?.level, 1), 1, MAX_LEVEL);
  const stats = computeStatsAtLevel(record?.base_stats || def.stats, level);
  const xp = Math.max(0, toSafeInt(record?.xp, 0));
  const xpToNext = getXpToNextLevelForSpecies(pokemonId, level, record?.base_stats || def.stats);
  const hpMax = computeBattleHpMax(stats, level, false);
  return {
    ...def,
    level,
    xp,
    xpToNext,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    isShiny: false,
    isShinyVisual: appearance.shinyVisual,
    spritePath: appearance.spritePath || def.spritePath,
    spriteImage: appearance.spriteImage || def.spriteImage,
    spriteVariantId: appearance.variant?.id || getDefaultSpriteVariantId(def),
  };
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
  return uniqueIds.map(buildTeamMemberFromSaveEntry).filter(Boolean);
}

function applyAutoGrantedProgress(pokemonId, level = 1) {
  if (!state.saveData) {
    return { addedToTeam: false };
  }

  const { record, wasUnlocked } = ensurePokemonEntityUnlocked(pokemonId, level);
  incrementSpeciesStat(pokemonId, "encountered", false, 1);
  incrementSpeciesStat(pokemonId, "captured", false, 1);
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

function createRouteEnemyInstance() {
  if (!state.routeData || !isCurrentRouteCombatEnabled() || !Array.isArray(state.routeData.encounters)) {
    return null;
  }
  const picked = weightedPick(state.routeData.encounters);
  if (!picked) {
    return null;
  }
  const def = state.pokemonDefsById.get(Number(picked.id));
  if (!def) {
    return null;
  }

  const isShiny = Math.floor(Math.random() * SHINY_ODDS) === 0;
  const level = pickEncounterLevel(picked);
  const stats = computeStatsAtLevel(def.stats, level);
  const hpMax = computeBattleHpMax(stats, level, true);
  const routePowerMultiplier = getRoutePowerMultiplier(state.routeData?.route_id || DEFAULT_ROUTE_ID);
  const defaultVariant = getSpriteVariantById(def, getDefaultSpriteVariantId(def));
  const normalPath = defaultVariant?.frontPath || def.spritePath;
  const shinyPath = defaultVariant?.frontShinyPath || def.shinySpritePath || normalPath;
  const spritePath = isShiny ? shinyPath : normalPath;
  const cachedSpriteImage = getCachedSpriteImage(spritePath);
  const spriteImage = isDrawableImage(cachedSpriteImage)
    ? cachedSpriteImage
    : isShiny
      ? def.spriteShinyImage || def.spriteImage
      : def.spriteImage;
  return {
    ...def,
    level,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    battlePowerMultiplier: routePowerMultiplier,
    catchRate: Number(def.catchRate || picked.catch_rate || 45),
    isShiny,
    isShinyVisual: isShiny,
    spritePath,
    spriteImage: spriteImage || def.spriteImage,
    spriteVariantId: defaultVariant?.id || getDefaultSpriteVariantId(def),
  };
}

function handleEnemySpawn(enemy) {
  if (!enemy) {
    return;
  }
  state.enemy = enemy;
  ensureSpeciesStats(enemy.id);
  incrementSpeciesStat(enemy.id, "encountered", enemy.isShiny, 1);
  if (!state.simulationIdleMode) {
    setTopMessage(
      enemy.isShiny
        ? `Un ${enemy.nameFr} shiny sauvage apparait !`
        : `Un ${enemy.nameFr} sauvage apparait !`,
      1300,
    );
  }
  persistSaveDataForSimulationEvent();
  if (!state.simulationIdleMode) {
    updateHud();
  }
}

function handleEnemyDefeated(enemy) {
  if (!enemy) {
    return { captured: false, capture_attempted: false };
  }

  incrementSpeciesStat(enemy.id, "defeated", enemy.isShiny, 1);
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  incrementRouteDefeatCount(activeRouteId, 1);
  const routeUnlockResult = tryUnlockNextRouteAfterDefeat(activeRouteId);
  const moneyReward = computeDefeatMoneyReward(enemy);
  addMoney(moneyReward);
  let topMessage = `${enemy.nameFr} battu: +${moneyReward} Poke$`;
  let captureAttempted = false;
  let captured = false;
  let captureCritical = false;
  let addedToTeam = false;
  let xpSummary = null;
  let captureUnlockSummary = null;
  let leveledNames = [];
  let evolutionReadyNames = [];
  let usedBallType = null;

  if (getBallInventoryTotalCount() > 0) {
    const captureConsume = consumeBallForCapture();
    captureAttempted = Boolean(captureConsume.consumed);
    usedBallType = captureConsume.ballType;
    if (captureAttempted && usedBallType) {
      const usedBallLabel = getBallTypeLabel(usedBallType);
      const ballMultiplier = getBallCaptureMultiplier(usedBallType);
      captureCritical = Math.random() < CAPTURE_CRIT_CHANCE;
      const criticalMultiplier = captureCritical ? CAPTURE_CRIT_MULTIPLIER : 1;
      const catchChance = computeCatchChance(enemy.catchRate, ballMultiplier * criticalMultiplier);
      captured = Math.random() < catchChance;
      if (!captured) {
        const remaining = getBallInventoryCount(usedBallType);
        const criticalLabel = captureCritical ? " capture critique ratee" : " capture ratee";
        topMessage = `${enemy.nameFr} battu: +${moneyReward} Poke$ |${criticalLabel} (${usedBallLabel}: ${remaining})`;
      } else {
        const captureRecordBefore = ensureSpeciesStats(enemy.id);
        const firstCaptureOfSpecies = getCapturedTotal(captureRecordBefore) <= 0;
        incrementSpeciesStat(enemy.id, "captured", enemy.isShiny, 1);
        captureUnlockSummary = resolveCaptureEntityUnlock(enemy.id, firstCaptureOfSpecies);
        addedToTeam = Boolean(captureUnlockSummary?.addedToTeam);
        xpSummary = awardCaptureXpToTeam(enemy);
        leveledNames = xpSummary.levelUps.map((entry) => `${entry.nameFr} (${entry.toLevel})`);
        evolutionReadyNames = (xpSummary.evolutionReady || []).map((entry) => `${entry.fromNameFr} -> ${entry.toNameFr}`);
        if (!state.simulationIdleMode && Array.isArray(xpSummary.levelUps) && xpSummary.levelUps.length > 0) {
          queueTeamLevelUpEffects(xpSummary.levelUps);
        }

        const shinyLabel = enemy.isShiny ? " shiny" : "";
        let unlockLabel = "";
        if (captureUnlockSummary?.suppressedEvolvedEntityUnlock) {
          const grantedId = Number(captureUnlockSummary.grantedEntityId || 0);
          if (grantedId > 0 && grantedId !== enemy.id) {
            const grantedName = getPokemonDisplayNameById(grantedId);
            const teamLabel = captureUnlockSummary.addedToTeam ? " rejoint l'equipe" : "";
            unlockLabel = ` | Entite obtenue: ${grantedName}${teamLabel}`;
          } else {
            unlockLabel = " | Entite non obtenue pour cette evolution (1re capture)";
          }
        } else {
          const teamLabel = addedToTeam ? " rejoint l'equipe" : "";
          unlockLabel = teamLabel;
        }
        const criticalLabel = captureCritical ? "Capture CRITIQUE reussie" : "Capture reussie";
        topMessage = `${criticalLabel}: ${enemy.nameFr}${shinyLabel}${unlockLabel} | ${usedBallLabel} | +${moneyReward} Poke$`;
      }
    }
  } else {
    topMessage = `${enemy.nameFr} battu: +${moneyReward} Poke$ (plus de Poke Balls)`;
  }

  if (xpSummary?.reward) {
    topMessage += ` | +${xpSummary.reward} XP`;
  }
  if (leveledNames.length > 0) {
    topMessage += ` | Level up: ${leveledNames.join(", ")}`;
  }
  if (evolutionReadyNames.length > 0) {
    topMessage += ` | Evolutions pretes: ${evolutionReadyNames.join(", ")}`;
  }

  if (routeUnlockResult?.unlocked) {
    const routeLabel = routeUnlockResult.route_name_fr || "Route suivante";
    topMessage += " | Zone debloquee: " + routeLabel;
  }

  if (!state.simulationIdleMode) {
    setTopMessage(topMessage, 1900);
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
    added_to_team: addedToTeam,
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
  startBattle();
  state.mode = "ready";
  setTopMessage(`${def.nameFr} rejoint ton equipe. Direction Route 1 !`, 1700);
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
  const nextRouteId = getNextRouteId(currentRouteId);
  const unlockMode = getRouteUnlockMode(currentRouteId);
  const unlockTarget = getRouteUnlockDefeatTarget(currentRouteId);
  const currentDefeats = Math.min(getRouteDefeatCount(currentRouteId), unlockTarget);
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
      progressLabel = `${unlockedCount}/${totalCount} zones debloquees | ${currentDefeats}/${unlockTarget} KO pour ${nextRouteName}`;
    }
  } else {
    progressLabel = `${unlockedCount}/${totalCount} zones debloquees | Toutes les zones FR/LG sont debloquees`;
  }

  if (routeNavCurrentEl) {
    routeNavCurrentEl.textContent = orderIndex >= 0
      ? `${currentZoneType}: ${currentRouteName} (${orderIndex + 1}/${totalCount})`
      : `${currentZoneType}: ${currentRouteName}`;
  }
  if (routeNavProgressEl) {
    routeNavProgressEl.textContent = progressLabel;
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
  if (!state.saveData) {
    state.moneyHud.initialized = false;
    state.moneyHud.targetValue = 0;
    state.moneyHud.displayValue = 0;
    state.moneyHud.lastRawValue = 0;
    state.moneyHud.pulseMs = 0;
    setMoneyCounterTextValue(0);
    refreshMoneyCounterTransform();
    if (pokeballValueEl) {
      pokeballValueEl.textContent = "0";
    }
    updateSaveBackendIndicator();
    refreshRouteUi();
    if (state.ui.shopOpen) {
      renderShopModal();
    }
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
  if (pokeballValueEl) {
    pokeballValueEl.textContent = String(state.saveData.pokeballs);
    const activeType = getActiveBallType();
    const activeLabel = getBallTypeLabel(activeType);
    const activeStock = getBallInventoryCount(activeType);
    pokeballValueEl.title = `Actif: ${activeLabel} (${activeStock})`;
  }
  updateSaveBackendIndicator();
  refreshRouteUi();
  if (state.ui.shopOpen) {
    renderShopModal();
  }
}

function getShopItemsByTab(tabId) {
  const tab = String(tabId || SHOP_TAB_POKEBALLS);
  const items = Object.values(SHOP_ITEM_CONFIG_BY_ID).filter((entry) => entry.category === tab);
  if (tab === SHOP_TAB_POKEBALLS) {
    return BALL_TYPE_FALLBACK_ORDER.map((ballType) => items.find((item) => item.ballType === ballType)).filter(Boolean);
  }
  if (tab === SHOP_TAB_EVOLUTIONS) {
    return ["water_stone", "fire_stone", "leaf_stone"]
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean);
  }
  return items;
}

function normalizeShopQuantityMode(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (raw === "custom") {
    return "custom";
  }
  const numeric = Math.max(1, toSafeInt(raw, 1));
  const allowed = new Set([1, 5, 10, 50, 100]);
  return allowed.has(numeric) ? String(numeric) : "1";
}

function getSelectedShopBallQuantity() {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  if (mode === "custom") {
    return Math.max(1, toSafeInt(state.ui.shopCustomQuantity, 1));
  }
  return Math.max(1, toSafeInt(mode, 1));
}

function setShopQuantityMode(mode) {
  state.ui.shopQuantityMode = normalizeShopQuantityMode(mode);
  if (state.ui.shopQuantityMode !== "custom") {
    state.ui.shopCustomQuantity = getSelectedShopBallQuantity();
  } else {
    state.ui.shopCustomQuantity = Math.max(1, toSafeInt(state.ui.shopCustomQuantity, 1));
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
    shopCustomQtyInputEl.disabled = mode !== "custom";
    const value = Math.max(1, toSafeInt(state.ui.shopCustomQuantity, 1));
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

function useEvolutionStoneFromShop(stoneType) {
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

  const chosen = promptEvolutionStoneChoice(key, candidates);
  if (!chosen) {
    return false;
  }

  if (!consumeShopItemCount(key, 1)) {
    setTopMessage(`Aucune ${stoneConfig.nameFr} en stock.`, 1500);
    updateHud();
    return false;
  }

  const result = applyEvolutionUnlockAndTeamPlacement(chosen.fromId, chosen.toId, chosen.teamSlotIndex);
  if (!result) {
    addShopItemCount(key, 1);
    setTopMessage(`${stoneConfig.nameFr}: impossible de l'utiliser sur ce Pokemon.`, 1600);
    updateHud();
    renderShopModal();
    return false;
  }

  queueEvolutionAnimationForResult(result);
  rebuildTeamAndSyncBattle();
  render();
  persistSaveData();
  updateHud();
  setTopMessage(`${stoneConfig.nameFr} utilisee: ${result.fromNameFr} -> ${result.toNameFr}.`, 1800);
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
    const quantity = getSelectedShopBallQuantity();
    const totalCost = Math.max(0, toSafeInt(item.price, 0)) * quantity;
    if (!spendMoney(totalCost)) {
      setTopMessage(`Pas assez d'argent pour ${quantity} ${item.nameFr} (${totalCost} Poke$).`, 1500);
      updateHud();
      return false;
    }
    addBallItems(item.ballType, quantity);
    if (getBallInventoryCount(getActiveBallType()) <= 0) {
      setActiveBallType(item.ballType);
    }
    persistSaveData();
    updateHud();
    renderShopModal();
    setTopMessage(`Achat: ${quantity} ${item.nameFr} pour ${totalCost} Poke$.`, 1500);
    return true;
  }

  if (item.itemType === "boost") {
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    if (!spendMoney(totalCost)) {
      setTopMessage(`Pas assez d'argent pour ${item.nameFr}.`, 1500);
      updateHud();
      return false;
    }
    const remainingMs = activateAttackBoost(BOOST_X_DURATION_MS);
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

  if (item.spritePath) {
    const image = document.createElement("img");
    image.alt = item.nameFr;
    image.src = item.spritePath;
    card.appendChild(image);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "shop-item-fallback";
    fallback.textContent = item.nameFr.slice(0, 1).toUpperCase();
    card.appendChild(fallback);
  }

  const nameEl = document.createElement("div");
  nameEl.className = "shop-item-name";
  nameEl.textContent = item.nameFr;
  card.appendChild(nameEl);

  const priceEl = document.createElement("div");
  priceEl.className = "shop-item-price";
  priceEl.textContent = `${item.price} Poke$`;
  card.appendChild(priceEl);

  const descEl = document.createElement("div");
  descEl.className = "shop-item-desc";
  descEl.textContent = item.description;
  card.appendChild(descEl);

  const actionRow = document.createElement("div");
  actionRow.className = "shop-item-action-row";

  const stockEl = document.createElement("div");
  stockEl.className = "shop-item-stock";

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
    stockEl.textContent = isActive
      ? `Stock: ${stockCount} | Actif capture`
      : `Stock: ${stockCount}`;
    const quantity = getSelectedShopBallQuantity();
    primaryButton.textContent = `Acheter x${quantity}`;

    const equipButton = document.createElement("button");
    equipButton.type = "button";
    equipButton.className = "shop-item-buy-btn";
    equipButton.textContent = isActive ? "Actif" : "Equiper";
    equipButton.disabled = isActive || stockCount <= 0;
    equipButton.addEventListener("click", () => {
      setBallTypeAsActive(item.ballType);
    });
    actionRow.appendChild(equipButton);
  } else if (item.itemType === "boost") {
    const remainingMs = getAttackBoostRemainingMs();
    if (remainingMs > 0) {
      stockEl.textContent = `Actif: ${formatDurationToClock(remainingMs)} restantes`;
      primaryButton.textContent = "Prolonger";
    } else {
      stockEl.textContent = "Inactif";
      primaryButton.textContent = "Activer";
    }
  } else if (item.itemType === "stone") {
    const stoneStock = getShopItemCount(item.stoneType);
    stockEl.textContent = `Stock: ${stoneStock}`;
    primaryButton.textContent = "Acheter";

    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "shop-item-buy-btn";
    useButton.textContent = "Utiliser";
    useButton.disabled = stoneStock <= 0;
    useButton.addEventListener("click", () => {
      useEvolutionStoneFromShop(item.stoneType);
    });
    actionRow.appendChild(useButton);
  } else {
    stockEl.textContent = "";
  }

  actionRow.prepend(stockEl);
  card.appendChild(actionRow);
  return card;
}

function renderShopModal() {
  if (!shopGridEl || !state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  const activeTab = String(state.ui.shopTab || SHOP_TAB_POKEBALLS);
  const items = getShopItemsByTab(activeTab);

  if (shopModalSubtitleEl) {
    if (activeTab === SHOP_TAB_POKEBALLS) {
      shopModalSubtitleEl.textContent = "Achete des balls et choisis celle utilisee pour les captures.";
    } else if (activeTab === SHOP_TAB_COMBAT) {
      shopModalSubtitleEl.textContent = "Objets de combat temporaires pour accelerer les attaques.";
    } else {
      shopModalSubtitleEl.textContent = "Pierres d'evolution a acheter puis utiliser sur un Pokemon eligibile.";
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
  state.ui.shopOpen = Boolean(open);
  if (!shopModalEl) {
    return;
  }
  if (state.ui.shopOpen) {
    setMapOpen(false);
    hideHoverPopup();
    closeBoxesModal();
    closeAppearanceModal();
    shopModalEl.classList.remove("hidden");
    if (!state.ui.shopTab) {
      state.ui.shopTab = SHOP_TAB_POKEBALLS;
    }
    setShopTab(state.ui.shopTab);
  } else {
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
    button.style.left = `${marker.x}%`;
    button.style.top = `${marker.y}%`;
    button.disabled = !isUnlocked;
    button.title = `${zoneType}: ${zoneName}${isUnlocked ? "" : " (verrouillee)"}`;
  }

  for (const [routeId, button] of mapMarkerButtonsByRouteId.entries()) {
    if (renderedRouteIds.has(routeId)) {
      continue;
    }
    button.remove();
    mapMarkerButtonsByRouteId.delete(routeId);
  }
}

function setMapOpen(open) {
  state.ui.mapOpen = Boolean(open);
  if (!mapModalEl) {
    return;
  }
  if (state.ui.mapOpen) {
    hideHoverPopup();
    closeBoxesModal();
    closeAppearanceModal();
    setShopOpen(false);
    mapModalEl.classList.remove("hidden");
    renderMapModal();
  } else {
    mapModalEl.classList.add("hidden");
  }
}

function computeLayout() {
  const width = state.viewport.width;
  const height = state.viewport.height;
  const centerX = width * 0.5;
  const centerY = height * 0.5 + 18;
  const enemySize = clamp(Math.min(width, height) * 0.25, 130, 210);

  const teamRadius = clamp(Math.min(width, height) * 0.34, 120, 320);
  const teamSlots = [];

  for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / MAX_TEAM_SIZE;
    const x = centerX + Math.cos(angle) * teamRadius;
    const y = centerY + Math.sin(angle) * teamRadius;
    const size = clamp(enemySize * 0.62, 76, 128);
    teamSlots.push({ x, y, size });
  }

  return {
    centerX,
    centerY,
    enemySize,
    teamRadius,
    enemyNameY: centerY + enemySize * 0.58,
    enemyLevelOffsetY: 20,
    hpBarWidth: clamp(enemySize * 1.25, 150, 240),
    hpBarHeight: clamp(enemySize * 0.07, 10, 14),
    hpBarY: centerY + enemySize * 0.58 - 34,
    teamSlots,
  };
}

function drawShinySparkles(size, seed = 0, alpha = 1) {
  const sparkleCount = 8;
  const safeAlpha = clamp(Number(alpha), 0, 1);
  if (safeAlpha <= 0.02) {
    return;
  }

  const timeSeconds = state.timeMs / 1000;
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

    const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    glow.addColorStop(0, `rgba(${color}, ${0.75 * safeAlpha})`);
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.88 * safeAlpha})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPokemonSprite(entity, x, y, size, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  const drawAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  ctx.globalAlpha = drawAlpha;
  const scale = Number.isFinite(options.scale) ? Math.max(0, options.scale) : 1;
  ctx.scale(scale, scale);
  const shinyVisual = Boolean(options.shinyVisual || entity?.isShinyVisual || entity?.isShiny);
  const tintBlend = clamp(Number(options.tintBlend || 0), 0, 1);
  const tintColor = Array.isArray(options.tintColor) ? options.tintColor : [255, 255, 255];
  let spriteDrawX = -size * 0.5;
  let spriteDrawY = -size * 0.5;
  let spriteDrawWidth = size;
  let spriteDrawHeight = size;

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.34, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDrawableImage(entity.spriteImage)) {
    const ratio = entity.spriteImage.width / Math.max(entity.spriteImage.height, 1);
    let drawWidth = size;
    let drawHeight = size;
    if (ratio > 1) {
      drawHeight = size / ratio;
    } else {
      drawWidth = size * ratio;
    }
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    spriteDrawX = -drawWidth * 0.5;
    spriteDrawY = -drawHeight * 0.45;
    spriteDrawWidth = drawWidth;
    spriteDrawHeight = drawHeight;
    ctx.drawImage(entity.spriteImage, spriteDrawX, spriteDrawY, drawWidth, drawHeight);
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
    spriteDrawX = -size * 0.3;
    spriteDrawY = -size * 0.3;
    spriteDrawWidth = size * 0.6;
    spriteDrawHeight = size * 0.6;
    ctx.fillStyle = "rgba(180, 198, 232, 0.36)";
    ctx.strokeStyle = "rgba(226, 238, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fbff";
    ctx.font = `bold ${Math.round(size * 0.28)}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(entity.nameFr.slice(0, 1), 0, 0);
  }

  if (tintBlend > 0.001) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(${tintColor[0]}, ${tintColor[1]}, ${tintColor[2]}, ${tintBlend})`;
    ctx.fillRect(spriteDrawX - 1, spriteDrawY - 1, spriteDrawWidth + 2, spriteDrawHeight + 2);
    ctx.globalCompositeOperation = "source-over";
  }

  if (shinyVisual) {
    drawShinySparkles(size, Number(entity?.id || 0), drawAlpha);
  }

  ctx.restore();
}

function drawNameAndLevel(entity, x, y, enemy = false) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowBlur = 0;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillStyle = "#f7fbff";
  ctx.font = enemy ? "700 22px Trebuchet MS" : "700 18px Trebuchet MS";
  ctx.lineWidth = enemy ? 5 : 4;
  ctx.strokeText(entity.nameFr, x, y);
  ctx.fillText(entity.nameFr, x, y);

  ctx.fillStyle = "#bdd0ee";
  ctx.font = enemy ? "700 15px Trebuchet MS" : "700 15px Trebuchet MS";
  ctx.lineWidth = enemy ? 4 : 3;
  ctx.strokeText(`Niv. ${entity.level}`, x, y + (enemy ? 18 : 20));
  ctx.fillText(`Niv. ${entity.level}`, x, y + (enemy ? 18 : 20));
  ctx.restore();
}

function drawEnemyHpBar(enemy, centerX, centerY, width, height, options = {}) {
  const ratio = enemy.hpMax > 0 ? clamp(enemy.hpCurrent / enemy.hpMax, 0, 1) : 0;
  const x = centerX - width * 0.5;
  const y = centerY;
  const radius = height * 0.4;

  ctx.save();
  ctx.globalAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  ctx.fillStyle = "rgba(6, 16, 31, 0.82)";
  ctx.fillRect(x - 5, y - 4, width + 10, height + 8);

  ctx.fillStyle = "#3a1215";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  ctx.fillStyle = "#39cf72";
  ctx.beginPath();
  ctx.roundRect(x, y, width * ratio, height, radius);
  ctx.fill();

  ctx.strokeStyle = "rgba(248, 253, 255, 0.34)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7fbff";
  ctx.font = "700 10px Trebuchet MS";
  ctx.fillText(`${enemy.hpCurrent} / ${enemy.hpMax}`, x + width * 0.5, y + height * 0.52);
  ctx.restore();
}

function drawTeamXpBar(member, centerX, centerY, size) {
  if (!member || member.level >= MAX_LEVEL) {
    return;
  }
  const currentXp = Math.max(0, toSafeInt(member.xp, 0));
  const requiredXp = Math.max(1, toSafeInt(member.xpToNext, 1));
  const ratio = clamp(currentXp / requiredXp, 0, 1);
  const width = clamp(size * 0.66, 46, 90);
  const height = 3;
  const x = centerX - width * 0.5;
  const y = centerY + size * 0.39;

  ctx.save();
  ctx.fillStyle = "rgba(8, 23, 44, 0.85)";
  ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

  ctx.fillStyle = "rgba(22, 58, 108, 0.92)";
  ctx.fillRect(x, y, width, height);

  const fillGradient = ctx.createLinearGradient(x, y, x + width, y);
  fillGradient.addColorStop(0, "rgba(94, 174, 255, 0.95)");
  fillGradient.addColorStop(1, "rgba(159, 223, 255, 0.98)");
  ctx.fillStyle = fillGradient;
  ctx.fillRect(x, y, width * ratio, height);
  if (ratio > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(141, 217, 255, 0.35)";
    ctx.fillRect(x, y - 1, width * ratio, height + 2);
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.strokeStyle = "rgba(201, 232, 255, 0.52)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, width + 1, height + 1);
  ctx.restore();
}

function drawProjectiles(projectiles) {
  for (const projectile of projectiles || []) {
    const rgb = getTypeColor(projectile.attackType);
    const radius = projectile.radius || 8;
    const sprite = getProjectileSprite(projectile.attackType);
    const auraRadius = radius * 3.3;
    const trailPoints = Array.isArray(projectile.trail) ? projectile.trail : [];

    if (trailPoints.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const point of trailPoints) {
        const lifeRatio = clamp(point.lifeMs / Math.max(1, point.maxLifeMs), 0, 1);
        const pointRadius = radius * (0.8 + lifeRatio * 0.9);
        const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pointRadius * 2.6);
        glow.addColorStop(0, rgba(rgb, 0.26 * lifeRatio));
        glow.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (
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

    ctx.save();
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
    ctx.restore();

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
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawEnemyHitEffects(hitEffects) {
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
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = lifeRatio;
      const radius = (effect.size || 2) * (0.55 + lifeRatio * 0.9);
      const glow = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius * 3);
      glow.addColorStop(0, rgba(rgb, 0.95));
      glow.addColorStop(0.5, rgba(rgb, 0.5));
      glow.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

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
    ctx.strokeText(`-${text.damage}`, text.x, text.y);
    ctx.fillStyle = rgba(rgb, 0.98);
    ctx.fillText(`-${text.damage}`, text.x, text.y);

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
  const pulse = 0.72 + Math.sin(state.timeMs * 0.01) * 0.18;
  const radius = indicator.radius * (0.94 + pulse * 0.1);
  const alpha = indicator.has_pokemon ? 0.22 : 0.13;

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
  ctx.lineWidth = indicator.has_pokemon ? 2.2 : 1.6;
  if (!indicator.has_pokemon) {
    ctx.setLineDash([5, 5]);
  }
  ctx.beginPath();
  ctx.arc(indicator.x, indicator.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPokeball(x, y, radius, options = {}) {
  const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  const rotation = Number.isFinite(options.rotation) ? options.rotation : 0;
  const broken = Boolean(options.broken);
  const critical = Boolean(options.critical);
  const crackRatio = clamp(Number(options.crack_ratio || 0), 0, 1);
  const glowRatio = clamp(Number(options.glow_ratio || 0), 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);

  if (glowRatio > 0) {
    const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * (1.8 + glowRatio * 0.9));
    if (critical) {
      glow.addColorStop(0, `rgba(255, 226, 130, ${0.52 + glowRatio * 0.42})`);
      glow.addColorStop(0.62, `rgba(190, 150, 255, ${0.22 + glowRatio * 0.24})`);
    } else {
      glow.addColorStop(0, `rgba(176, 255, 202, ${0.42 + glowRatio * 0.4})`);
    }
    glow.addColorStop(1, "rgba(176, 255, 202, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1.8 + glowRatio * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#f7f7f7";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  const topFill = (() => {
    if (!critical) {
      return "#d5303e";
    }
    const gradient = ctx.createLinearGradient(-radius, -radius * 0.6, radius, radius * 0.2);
    gradient.addColorStop(0, "#f5cb4a");
    gradient.addColorStop(0.55, "#f07a93");
    gradient.addColorStop(1, "#8f81ff");
    return gradient;
  })();

  if (!broken || crackRatio < 0.45) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = topFill;
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
    ctx.fillStyle = topFill;
    ctx.fillRect(-radius - 1, -radius - 1, radius * 2 + 2, radius + 2);
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(12, 14, 18, 0.92)";
  ctx.lineWidth = Math.max(1.4, radius * 0.11);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1.6, radius * 0.18);
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();

  ctx.fillStyle = "#fafafa";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.33, 0, Math.PI * 2);
  ctx.fill();
  if (critical) {
    ctx.fillStyle = "rgba(252, 229, 126, 0.8)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(12, 14, 18, 0.85)";
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
  const throwRatio = CAPTURE_THROW_MS > 0 ? clamp(sequence.elapsedMs / CAPTURE_THROW_MS, 0, 1) : 1;
  const easedThrow = easeOutCubic(throwRatio);
  let ballX = sequence.targetX;
  let ballY = sequence.targetY;
  let ballRotation = 0;
  let broken = false;
  let crackRatio = 0;
  let glowRatio = 0;

  if (capturePhase === "throw") {
    ballX = sequence.startX + (sequence.targetX - sequence.startX) * easedThrow;
    ballY = sequence.startY + (sequence.targetY - sequence.startY) * easedThrow - Math.sin(throwRatio * Math.PI) * 70;
    ballRotation = easedThrow * Math.PI * 2.6;
    if (criticalCapture) {
      glowRatio = 0.45 + Math.sin(throwRatio * Math.PI) * 0.35;
    }
  } else if (capturePhase === "shake") {
    const localMs = sequence.elapsedMs - CAPTURE_THROW_MS;
    const shakeRatio = clamp(localMs / Math.max(1, CAPTURE_SHAKE_MS), 0, 1);
    const shakeAmpBase = criticalCapture ? 12 : 8;
    const shakeAmp = shakeAmpBase * (1 - shakeRatio * 0.35);
    ballX = sequence.targetX + Math.sin(localMs * 0.03) * shakeAmp;
    ballY = sequence.targetY;
    ballRotation = Math.sin(localMs * 0.028) * 0.28;
    if (criticalCapture) {
      glowRatio = 0.36 + Math.sin(localMs * 0.02) * 0.2;
    }
  } else if (capturePhase === "success") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS);
    const ratio = clamp(localMs / Math.max(1, CAPTURE_SUCCESS_BURST_MS), 0, 1);
    ballX = sequence.targetX;
    ballY = sequence.targetY;
    ballRotation = Math.sin(localMs * 0.024) * 0.08;
    glowRatio = (criticalCapture ? 1.35 : 1) - ratio * (criticalCapture ? 0.16 : 0.25);
  } else if (capturePhase === "break" || capturePhase === "reappear") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS);
    ballX = sequence.targetX;
    ballY = sequence.targetY;
    broken = true;
    crackRatio = clamp(localMs / Math.max(1, CAPTURE_FAIL_BREAK_MS), 0, 1);
    if (criticalCapture) {
      glowRatio = 0.3 * (1 - crackRatio);
    }
  } else {
    ballX = sequence.targetX;
    ballY = sequence.targetY;
  }

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
      const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, (particle.size || 2) * 3.2);
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

  drawPokeball(ballX, ballY, 14, {
    rotation: ballRotation,
    broken,
    crack_ratio: crackRatio,
    glow_ratio: glowRatio,
    critical: criticalCapture,
  });

  if (criticalCapture) {
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

  if (capturePhase === "success") {
    const pulse = 0.25 + Math.sin(state.timeMs * 0.02) * 0.15;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ringRadius = layout.enemySize * ((criticalCapture ? 0.36 : 0.28) + pulse);
    ctx.strokeStyle = criticalCapture ? "rgba(255, 233, 150, 0.76)" : "rgba(172, 255, 190, 0.62)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sequence.targetX, sequence.targetY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    if (criticalCapture) {
      ctx.strokeStyle = "rgba(199, 164, 255, 0.54)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sequence.targetX, sequence.targetY, ringRadius * 0.74, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    };
    return;
  }
}

function drawTeamLevelUpEffects() {
  if (!Array.isArray(state.teamLevelUpEffects) || state.teamLevelUpEffects.length <= 0) {
    return;
  }

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

    for (const particle of effect.particles || []) {
      const ratio = clamp(particle.lifeMs / Math.max(1, particle.maxLifeMs), 0, 1);
      const radius = (particle.size || 2) * (0.5 + ratio * 0.9);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 3.1);
      glow.addColorStop(0, `rgba(166, 224, 255, ${0.85 * ratio})`);
      glow.addColorStop(1, "rgba(166, 224, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius * 3.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(213, 242, 255, ${0.95 * ratio})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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
  const particleCount = Math.max(6, Math.round((width / 88) * amount));
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
  const streakCount = Math.max(18, Math.round((width / 26) * rainIntensity));
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
  const depth = clamp(Number(options.depth || 0), 0, 1);
  const time = state.timeMs * (0.00011 + depth * 0.00007);
  ctx.save();
  ctx.globalCompositeOperation = depth > 0.4 ? "screen" : "source-over";
  for (let i = 0; i < 3; i += 1) {
    const layerRatio = (i + 1) / 3;
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
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(214, 235, 255, ${(flashIntensity * 0.38).toFixed(3)})`;
  ctx.fillRect(0, 0, width, height);

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
  if (sunnyWeight > 0.001) {
    const sunnyIntensity = sunnyWeight * (0.55 + dayLight * 0.75);
    drawSunDust(width, height, sunnyIntensity);
  }

  const fogWeight =
    clamp(Number(weights.foggy || 0), 0, 1) * 1 +
    clamp(Number(weights.rainy || 0), 0, 1) * 0.42 +
    clamp(Number(weights.storm || 0), 0, 1) * 0.58;
  if (fogWeight > 0.001) {
    drawFogLayer(width, height, fogWeight, { depth: 0.25 });
  }
}

function drawEnvironmentForegroundLayer(width, height, environmentSnapshot) {
  if (!environmentSnapshot) {
    return;
  }
  const weights = environmentSnapshot.weatherWeights || { neutral: 1 };
  const rainWeight =
    clamp(Number(weights.rainy || 0), 0, 1) * 1 +
    clamp(Number(weights.storm || 0), 0, 1) * 1.65;
  if (rainWeight > 0.001) {
    drawRainStreakLayer(width, height, rainWeight);
  }

  const fogWeight =
    clamp(Number(weights.foggy || 0), 0, 1) * 0.58 +
    clamp(Number(weights.storm || 0), 0, 1) * 0.35;
  if (fogWeight > 0.001) {
    drawFogLayer(width, height, fogWeight, { depth: 0.78 });
  }

  drawStormLightningOverlay(width, height, environmentSnapshot.lightningIntensity || 0);
}

function drawViewportVignette(width, height, environmentSnapshot = null) {
  const centerX = width * 0.5;
  const centerY = height * 0.53;
  const night = clamp(Number(environmentSnapshot?.night) || 0, 0, 1);
  const stormWeight = clamp(Number(environmentSnapshot?.weatherWeights?.storm || 0), 0, 1);
  const intensityBoost = night * 0.14 + stormWeight * 0.11;
  const innerRadius = Math.max(width, height) * (0.34 - intensityBoost * 0.08);
  const outerRadius = Math.max(width, height) * 0.88;
  const vignette = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.72, `rgba(0, 0, 0, ${(0.07 + intensityBoost * 0.55).toFixed(3)})`);
  vignette.addColorStop(1, `rgba(0, 0, 0, ${(0.22 + intensityBoost * 0.92).toFixed(3)})`);

  ctx.save();
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
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

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, " + (0.24 + (1 - whiteRatio) * 0.2).toFixed(3) + ")";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.38, size * 0.32, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isDrawableImage(entity?.spriteImage)) {
    const ratio = entity.spriteImage.width / Math.max(entity.spriteImage.height, 1);
    let drawWidth = size;
    let drawHeight = size;
    if (ratio > 1) {
      drawHeight = size / ratio;
    } else {
      drawWidth = size * ratio;
    }
    const drawX = -drawWidth * 0.5;
    const drawY = -drawHeight * 0.45;
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(entity.spriteImage, drawX, drawY, drawWidth, drawHeight);
    if (whiteRatio > 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(255, 255, 255, " + whiteRatio.toFixed(3) + ")";
      ctx.fillRect(drawX - 1, drawY - 1, drawWidth + 2, drawHeight + 2);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
    ctx.fillStyle = "rgba(195, 215, 245, 0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    if (whiteRatio > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, " + whiteRatio.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
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

  ctx.save();
  ctx.fillStyle = "rgba(4, 8, 16, 0.62)";
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  const focusRadius = spriteSize * 1.3;
  const focus = ctx.createRadialGradient(centerX, centerY, spriteSize * 0.12, centerX, centerY, focusRadius);
  focus.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  focus.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = focus;
  ctx.beginPath();
  ctx.arc(centerX, centerY, focusRadius, 0, Math.PI * 2);
  ctx.fill();

  let title = `${current.fromNameFr} evolue !`;
  let subtitle = "";

  if (elapsed < whiteEnd) {
    const ratio = clamp(elapsed / whiteEnd, 0, 1);
    const whiteRatio = clamp(0.2 + ratio * 0.9, 0, 1);
    const scale = 0.96 + Math.sin(ratio * Math.PI) * 0.08;
    drawEvolutionSpriteFrame(current.fromDef, centerX, centerY, spriteSize, {
      alpha: 1,
      scale,
      whiteRatio,
    });
  } else if (elapsed < flashEnd) {
    const ratio = clamp((elapsed - whiteEnd) / Math.max(1, EVOLUTION_ANIM_FLASH_MS), 0, 1);
    drawEvolutionSpriteFrame(current.fromDef, centerX, centerY, spriteSize, {
      alpha: 1,
      scale: 1.03,
      whiteRatio: 1,
    });
    const flashAlpha = 0.42 + Math.sin(ratio * Math.PI) * 0.58;
    ctx.fillStyle = "rgba(255, 255, 255, " + flashAlpha.toFixed(3) + ")";
    ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);
  } else {
    const revealRatio = clamp((elapsed - flashEnd) / Math.max(1, EVOLUTION_ANIM_REVEAL_MS), 0, 1);
    const whiteRatio = clamp(1 - revealRatio * 1.06, 0, 1);
    const scale = 0.92 + revealRatio * 0.12;
    drawEvolutionSpriteFrame(current.toDef, centerX, centerY, spriteSize, {
      alpha: clamp(0.76 + revealRatio * 0.28, 0, 1),
      scale,
      whiteRatio,
    });
    subtitle = `${current.toNameFr} !`;
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

function drawBattleUiOverlay(layout, options = {}) {
  const teamDrawPositions = Array.isArray(options.teamDrawPositions) ? options.teamDrawPositions : [];
  if (options.showEnemyUi && state.enemy) {
    drawEnemyHpBar(
      state.enemy,
      layout.centerX,
      layout.hpBarY,
      layout.hpBarWidth,
      layout.hpBarHeight,
    );
    drawNameAndLevel(state.enemy, layout.centerX, layout.enemyNameY, true);
  }

  for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
    const member = state.team[i];
    const drawPosition = teamDrawPositions[i];
    if (!member || !drawPosition) {
      continue;
    }
    drawTeamXpBar(member, drawPosition.x, drawPosition.y, drawPosition.size);
    drawNameAndLevel(member, drawPosition.x, drawPosition.y + drawPosition.size * 0.62, false);
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
  ctx.fillStyle = "rgba(6, 19, 27, 0.54)";
  const width = clamp(state.viewport.width * 0.52, 300, 640);
  const height = 102;
  const x = layout.centerX - width * 0.5;
  const y = layout.centerY - height * 0.5;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(182, 223, 241, 0.42)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 26px Trebuchet MS";
  ctx.fillStyle = "#eff9ff";
  ctx.fillText(title, layout.centerX, y + 36);
  ctx.font = "700 14px Trebuchet MS";
  ctx.fillStyle = "#cae6ef";
  ctx.fillText(subtitle, layout.centerX, y + 62);
  ctx.fillStyle = "#8fd2f0";
  ctx.fillText(nextLabel, layout.centerX, y + 84);
  ctx.restore();
}

function render() {
  const { width, height } = state.viewport;
  ctx.clearRect(0, 0, width, height);

  if (state.mode === "loading") {
    drawLoadingOrError("Chargement de l'arene...");
    return;
  }
  if (state.mode === "error") {
    drawLoadingOrError(state.error || "Erreur de chargement");
    return;
  }

  const layout = state.layout || computeLayout();
  state.layout = layout;
  const combatView = isCurrentRouteCombatEnabled() && state.team.length > 0;
  const koTransition = state.battle ? state.battle.getKoTransition() : null;
  const enemyHitPulse = state.battle ? state.battle.getEnemyHitPulseRatio() : 0;
  const captureSequence = state.battle ? state.battle.getCaptureSequenceState() : null;
  const captureSnapshot = state.battle ? state.battle.getCaptureSequence() : null;
  const capturePhase = captureSnapshot?.phase || null;
  const captureEnemyVisual = getCaptureEnemyVisual(captureSequence, capturePhase);
  const turnIndicator = state.battle ? state.battle.getTurnIndicator(layout) : null;
  const enemyDamageTintBlend = state.battle ? state.battle.getEnemyDamageFlashBlend() : 0;
  const environmentSnapshot = getEnvironmentSnapshotForRender();

  drawBackground(width, height);
  drawEnvironmentBackgroundLayer(width, height, environmentSnapshot);
  if (combatView) {
    drawTurnIndicator(layout, turnIndicator);
    drawProjectiles(state.battle ? state.battle.getProjectiles() : []);
    if (!captureSequence) {
      drawEnemyKoEffect(layout, koTransition);
    }

    if (state.enemy) {
      const isKo = koTransition?.active;
      const shrinkProgress = isKo ? koTransition?.shrink_progress || 0 : 0;
      const shrinkActive = Boolean(koTransition?.shrink_active);
      const defaultEnemyScale = isKo
        ? (shrinkActive ? clamp(1 - shrinkProgress * 0.96, 0.04, 1) : 0)
        : 1 + enemyHitPulse * 0.06;
      const defaultEnemyAlpha = isKo
        ? (shrinkActive ? clamp(1 - shrinkProgress * 0.85, 0.12, 1) : 0)
        : 1;
      const enemyScale = captureSequence ? captureEnemyVisual.scale : defaultEnemyScale;
      const enemyAlpha = captureSequence ? captureEnemyVisual.alpha : defaultEnemyAlpha;
      const enemyVisible = captureSequence ? captureEnemyVisual.visible : enemyAlpha > 0.01 && enemyScale > 0.01;

      if (enemyVisible) {
        drawPokemonSprite(state.enemy, layout.centerX, layout.centerY, layout.enemySize, {
          alpha: enemyAlpha,
          scale: enemyScale,
          shinyVisual: Boolean(state.enemy.isShiny || state.enemy.isShinyVisual),
          tintBlend: enemyDamageTintBlend,
          tintColor: [255, 84, 84],
        });
      }
    }

    drawEnemyHitEffects(state.battle ? state.battle.getHitEffects() : []);
    drawCaptureSequence(layout, captureSequence, capturePhase);

    const teamDrawPositions = [];
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const member = state.team[i];
      const slot = layout.teamSlots[i];
      if (!slot) {
        continue;
      }
      const recoilOffset = state.battle ? state.battle.getSlotRecoilOffset(i, layout) : { x: 0, y: 0 };
      const drawX = slot.x + recoilOffset.x;
      const drawY = slot.y + recoilOffset.y;
      teamDrawPositions[i] = { x: drawX, y: drawY, size: slot.size };
      if (!member) {
        drawEmptyTeamSlot(slot);
        continue;
      }
      drawPokemonSprite(member, drawX, drawY, slot.size, {
        shinyVisual: Boolean(member.isShiny || member.isShinyVisual),
        tintBlend: state.battle ? state.battle.getSlotAttackFlashBlend(i) : 0,
        tintColor: [255, 255, 255],
      });
    }

    drawTeamLevelUpEffects();
    drawFloatingDamageTexts(state.battle ? state.battle.getFloatingTexts() : []);
    drawBattleUiOverlay(layout, {
      showEnemyUi: Boolean(state.enemy) && !koTransition?.active && !captureSequence,
      teamDrawPositions,
    });
  } else {
    drawNonCombatZoneOverlay(layout);
  }
  drawEnvironmentForegroundLayer(width, height, environmentSnapshot);
  drawViewportVignette(width, height, environmentSnapshot);
  drawEvolutionAnimationOverlay(layout);
}

function update(deltaMs, options = {}) {
  const idleMode = Boolean(options.idleMode);
  state.timeMs += deltaMs;
  updateEnvironment();
  updateNotificationSystem();
  updateBackgroundDrift(deltaMs);
  updateMoneyHudAnimation(deltaMs);
  updateTeamLevelUpEffects(deltaMs);
  const layout = computeLayout();
  state.layout = layout;
  const evolutionAnimActive = updateEvolutionAnimation(deltaMs);

  state.simulationIdleMode = idleMode;
  try {
    if (state.battle && !evolutionAnimActive) {
      state.battle.update(deltaMs, layout, { idleMode });
      state.enemy = state.battle.getEnemy();
    }
  } finally {
    state.simulationIdleMode = false;
  }
}

function gameLoop(timestamp) {
  if (!state.lastFrameTimestamp) {
    state.lastFrameTimestamp = timestamp;
  }
  state.lastFrameTimestamp = timestamp;
  tickSimulationFromRealtime();
  render();
  window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const maxWidth = 1200;
  const maxHeight = 760;
  const stageRect = gameStageEl?.getBoundingClientRect();
  const stageWidth = Math.floor(stageRect?.width || window.innerWidth - 16);
  const stageHeight = Math.floor(stageRect?.height || window.innerHeight - 16);
  const width = clamp(stageWidth - 2, 260, maxWidth);
  const height = clamp(stageHeight - 2, 220, maxHeight);
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.viewport = { width, height, dpr };
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
      return { slotIndex: i, member };
    }
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
  const shinyTag = entity.isShiny || entity.isShinyVisual ? " shiny" : "";
  hoverPopupEl.innerHTML = [
    `<strong>${entity.nameFr}${shinyTag}</strong>`,
    `Niv. ${entity.level}`,
    `Rencontres: ${stats.encountered_total} (N ${stats.encountered_normal} / S ${stats.encountered_shiny})`,
    `Battus: ${stats.defeated_total} (N ${stats.defeated_normal} / S ${stats.defeated_shiny})`,
    `Captures: ${stats.captured_total} (N ${stats.captured_normal} / S ${stats.captured_shiny})`,
  ].join("<br/>");

  const popupX = Math.round(clientX + 14);
  const popupY = Math.round(clientY + 14);
  hoverPopupEl.style.left = `${popupX}px`;
  hoverPopupEl.style.top = `${popupY}px`;
  hoverPopupEl.classList.remove("hidden");
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
    const appearance = resolveSpriteAppearanceForEntity(pokemonId);

    entries.push({
      id: pokemonId,
      nameFr: def?.nameFr || "Pokemon " + String(pokemonId),
      usableInTeam: Boolean(def),
      level,
      xp: Math.max(0, toSafeInt(record.xp, 0)),
      xpToNext: getXpToNextLevelForSpecies(pokemonId, level, baseStats),
      defensiveTypes: Array.isArray(def?.defensiveTypes) ? def.defensiveTypes : ["normal"],
      offensiveType: def?.offensiveType || "normal",
      spritePath: def?.spritePath || "",
      stats,
      baseStats,
      encounteredNormal,
      encounteredShiny,
      defeatedNormal,
      defeatedShiny,
      capturedNormal,
      capturedShiny,
      spriteVariantId: appearance.variant?.id || null,
      shinyVisual: appearance.shinyVisual,
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

function setBoxesInfoFromEntry(entry) {
  if (!boxesInfoPanelEl) {
    return;
  }
  if (!entry) {
    boxesInfoPanelEl.textContent = "Survole un Pokemon de la boite pour voir ses infos detaillees.";
    return;
  }

  const statLine = STAT_KEYS.map((statKey) => `${STAT_LABELS_FR[statKey]} ${entry.stats[statKey]}`).join(" | ");
  const baseTotal = getBaseStatTotal(entry.baseStats);
  const typesLabel = entry.defensiveTypes.join(" / ");
  const xpLabel =
    entry.level >= MAX_LEVEL
      ? "Niveau max"
      : `${entry.xp}/${Math.max(1, toSafeInt(entry.xpToNext, 1))} vers niv. ${Math.min(MAX_LEVEL, entry.level + 1)}`;

  boxesInfoPanelEl.innerHTML = [
    `<strong>${entry.nameFr} (#${entry.id})</strong>`,
    `Niv. ${entry.level}`,
    `Types: ${typesLabel}`,
    `Type offensif: ${entry.offensiveType}`,
    `XP: ${xpLabel}`,
    `Stats: ${statLine}`,
    `BST: ${Math.round(baseTotal)}`,
    `Rencontres: ${entry.encounteredTotal} (N ${entry.encounteredNormal} / S ${entry.encounteredShiny})`,
    `Battus: ${entry.defeatedTotal} (N ${entry.defeatedNormal} / S ${entry.defeatedShiny})`,
    `Captures: ${entry.capturedTotal} (N ${entry.capturedNormal} / S ${entry.capturedShiny})`,
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

    if (entry.spritePath) {
      const image = document.createElement("img");
      image.alt = entry.nameFr;
      image.src = entry.spritePath;
      button.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "boxes-mon-fallback";
      fallback.textContent = entry.nameFr.slice(0, 1).toUpperCase();
      button.appendChild(fallback);
    }

    const nameEl = document.createElement("span");
    nameEl.className = "boxes-mon-name";
    nameEl.textContent = entry.nameFr;
    button.appendChild(nameEl);

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
      const oldName = currentId > 0 ? getPokemonDisplayNameById(currentId) : "Pokemon";
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

  hideHoverPopup();
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
  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record);
  const shinyCaptures = Math.max(0, toSafeInt(record.captured_shiny, 0));
  const shinyModeActive = Boolean(record.appearance_shiny_mode && shinyUnlocked);
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
  if (appearanceShinyStatusEl) {
    if (!shinyUnlocked) {
      appearanceShinyStatusEl.textContent = "Capture un shiny de cette espece pour debloquer ce mode.";
    } else if (shinyModeActive && !selectedHasShiny) {
      appearanceShinyStatusEl.textContent =
        `Shiny debloque (${shinyCaptures} capture). Ce sprite n'a pas de version shiny.`;
    } else if (shinyModeActive) {
      appearanceShinyStatusEl.textContent = `Shiny debloque (${shinyCaptures} capture). Effets shiny actifs.`;
    } else {
      appearanceShinyStatusEl.textContent = `Shiny debloque (${shinyCaptures} capture). Active le mode shiny si voulu.`;
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

    card.addEventListener("click", () => {
      if (!state.saveData) {
        return;
      }

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
        rebuildTeamAndSyncBattle();
        persistSaveData();
        updateHud();
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
      rebuildTeamAndSyncBattle();
      persistSaveData();
      renderAppearanceModal();
      render();
      setTopMessage(`${def.nameFr}: sprite ${variant.labelFr} equipe.`, 1400);
    });

    appearanceGridEl.appendChild(card);
  }
}

function openAppearanceForTeamSlot(slotIndex) {
  if (!appearanceModalEl || !state.saveData || !Array.isArray(state.saveData.team)) {
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
  const record = getPokemonEntityRecord(pokemonId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!record || !def) {
    return;
  }

  hideHoverPopup();
  setShopOpen(false);
  state.ui.appearanceOpen = true;
  state.ui.appearanceTargetSlotIndex = index;
  state.ui.appearancePokemonId = pokemonId;
  appearanceModalEl.classList.remove("hidden");
  renderAppearanceModal();
}

function toggleAppearanceShinyMode() {
  if (!state.saveData) {
    return;
  }
  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const record = getPokemonEntityRecord(pokemonId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!record || !def) {
    return;
  }
  if (!isShinyAppearanceUnlockedForRecord(record)) {
    setTopMessage("Capture un shiny de cette espece pour debloquer ce mode.", 1700);
    renderAppearanceModal();
    return;
  }
  record.appearance_shiny_mode = !record.appearance_shiny_mode;
  reconcileAppearanceForEntityRecord(record, pokemonId);
  rebuildTeamAndSyncBattle();
  persistSaveData();
  renderAppearanceModal();
  render();
  setTopMessage(
    record.appearance_shiny_mode
      ? `${def.nameFr}: mode shiny active.`
      : `${def.nameFr}: mode shiny desactive.`,
    1400,
  );
}

function handleCanvasMouseMove(event) {
  if (state.mode !== "ready" || state.ui.boxesOpen || state.ui.appearanceOpen || state.evolutionAnimation.current) {
    hideHoverPopup();
    return;
  }
  if (!isCurrentRouteCombatEnabled()) {
    hideHoverPopup();
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const layout = state.layout || computeLayout();
  const hovered = findHoveredPokemon(worldX, worldY, layout);
  showHoverPopup(hovered, event.clientX, event.clientY);
}

function handleCanvasClick(event) {
  if (event.button !== 0) {
    return;
  }
  if (state.mode !== "ready" || state.ui.boxesOpen || state.ui.appearanceOpen || state.evolutionAnimation.current) {
    return;
  }
  if (!isCurrentRouteCombatEnabled()) {
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot) {
    return;
  }
  openBoxesForTeamSlot(hoveredTeamSlot.slotIndex);
}

function handleCanvasContextMenu(event) {
  event.preventDefault();
  if (state.mode !== "ready" || state.ui.boxesOpen || state.ui.appearanceOpen || state.evolutionAnimation.current) {
    return;
  }
  if (!isCurrentRouteCombatEnabled()) {
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot) {
    return;
  }
  openAppearanceForTeamSlot(hoveredTeamSlot.slotIndex);
}

function exportTextState() {
  const layout = state.layout || computeLayout();
  const battle = state.battle;
  const environmentSnapshot = getEnvironmentSnapshotForRender();

  const enemy = state.enemy
    ? {
        id: state.enemy.id,
        name_fr: state.enemy.nameFr,
        level: state.enemy.level,
        hp_current: state.enemy.hpCurrent,
        hp_max: state.enemy.hpMax,
        is_shiny: Boolean(state.enemy.isShiny),
        shiny_visual: Boolean(state.enemy.isShiny || state.enemy.isShinyVisual),
        sprite_variant_id: state.enemy.spriteVariantId || null,
        defensive_types: state.enemy.defensiveTypes,
        x: Math.round(layout.centerX),
        y: Math.round(layout.centerY),
      }
    : null;

  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const nextRouteId = getNextRouteId(currentRouteId);
  const unlockMode = getRouteUnlockMode(currentRouteId);
  const unlockTarget = unlockMode === "visit" ? 0 : getRouteUnlockDefeatTarget(currentRouteId);
  const appearancePokemonId = Number(state.ui.appearancePokemonId || 0);
  const appearanceRecord = appearancePokemonId > 0 ? getPokemonEntityRecord(appearancePokemonId) : null;

  const team = state.team.map((member, index) => {
    const slot = layout.teamSlots[index];
    return {
      id: member.id,
      name_fr: member.nameFr,
      level: member.level,
      xp: Math.max(0, toSafeInt(member.xp, 0)),
      xp_to_next: Math.max(0, toSafeInt(member.xpToNext, 0)),
      is_shiny: Boolean(member.isShiny),
      shiny_visual: Boolean(member.isShiny || member.isShinyVisual),
      sprite_variant_id: member.spriteVariantId || null,
      offensive_type: member.offensiveType,
      x: slot ? Math.round(slot.x) : null,
      y: slot ? Math.round(slot.y) : null,
    };
  });

  const payload = {
    mode: state.mode,
    coordinate_system: {
      origin: "top-left",
      x_axis: "right-positive",
      y_axis: "down-positive",
    },
    viewport: {
      width: Math.round(state.viewport.width),
      height: Math.round(state.viewport.height),
    },
    attack_interval_ms: getCurrentAttackIntervalMs(),
    attack_timer_ms: battle ? Math.round(Math.max(0, Number(battle.attackTimerMs) || 0)) : null,
    attack_boost_remaining_ms: getAttackBoostRemainingMs(),
    attack_slots_total: MAX_TEAM_SIZE,
    next_attacker: battle ? battle.getNextAttackerName() : null,
    next_attacker_slot_index: battle?.getTurnIndicator(layout)?.slot_index ?? null,
    enemies_defeated: battle ? battle.enemiesDefeated : 0,
    route_id: currentRouteId || null,
    route_name_fr: state.routeData?.route_name_fr || getRouteDisplayName(currentRouteId),
    route_zone_type: getRouteZoneType(currentRouteId),
    route_combat_enabled: isCurrentRouteCombatEnabled(),
    route_encounters_source: String(state.routeData?.encounters_source || (state.zoneEncounterCsvLoaded ? "csv" : "json")),
    zone_csv_loaded: Boolean(state.zoneEncounterCsvLoaded),
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
    route_unlock_progress_current: unlockTarget > 0 ? Math.min(getRouteDefeatCount(currentRouteId), unlockTarget) : 0,
    route_unlock_target: unlockTarget,
    next_route_id: nextRouteId,
    next_route_name_fr: nextRouteId ? getRouteDisplayName(nextRouteId) : null,
    starter_modal_visible: !starterModalEl.classList.contains("hidden"),
    hover_popup_visible: !hoverPopupEl.classList.contains("hidden"),
    save_team_size: state.saveData?.team?.length || 0,
    money: Math.max(0, toSafeInt(state.saveData?.money, 0)),
    pokeballs: Math.max(0, toSafeInt(state.saveData?.pokeballs, 0)),
    ball_inventory: state.saveData
      ? {
          poke_ball: getBallInventoryCount("poke_ball"),
          super_ball: getBallInventoryCount("super_ball"),
          hyper_ball: getBallInventoryCount("hyper_ball"),
          active_ball_type: getActiveBallType(),
        }
      : null,
    shop_items: state.saveData
      ? {
          water_stone: getShopItemCount("water_stone"),
          fire_stone: getShopItemCount("fire_stone"),
          leaf_stone: getShopItemCount("leaf_stone"),
        }
      : null,
    save_backend: state.saveBackend.bridgeAvailable
      ? "appdata_roaming"
      : state.saveBackend.fileHandle
        ? "local_file"
        : "local_storage",
    shop_open: Boolean(state.ui.shopOpen),
    map_open: Boolean(state.ui.mapOpen),
    shop_tab: String(state.ui.shopTab || SHOP_TAB_POKEBALLS),
    shop_ball_purchase_qty: getSelectedShopBallQuantity(),
    boxes_open: Boolean(state.ui.boxesOpen),
    boxes_target_slot_index: toSafeInt(state.ui.boxesTargetSlotIndex, -1),
    boxes_entity_count: state.saveData ? getCapturedEntityCount() : 0,
    appearance_open: Boolean(state.ui.appearanceOpen),
    appearance_target_slot_index: toSafeInt(state.ui.appearanceTargetSlotIndex, -1),
    appearance_pokemon_id: Number(state.ui.appearancePokemonId || 0) || null,
    appearance_selected_variant_id: appearanceRecord?.appearance_selected_variant || null,
    appearance_shiny_mode: Boolean(appearanceRecord?.appearance_shiny_mode),
    top_message: null,
    notifications_active: Array.isArray(state.notifications.items) ? state.notifications.items.length : 0,
    notifications_temporary: Array.isArray(state.notifications.items)
      ? state.notifications.items.filter((item) => item?.type === "temporary").length
      : 0,
    notifications_evolution_ready: Array.isArray(state.notifications.items)
      ? state.notifications.items.filter((item) => item?.type === "evolution_ready").length
      : 0,
    money_display_value: Math.max(0, Math.round(Number(state.moneyHud.displayValue) || 0)),
    team_level_up_effects_active: Array.isArray(state.teamLevelUpEffects) ? state.teamLevelUpEffects.length : 0,
    active_projectiles: (battle ? battle.getProjectiles() : []).map((projectile) => ({
      type: projectile.attackType,
      x: Math.round(projectile.x),
      y: Math.round(projectile.y),
      attacker_name_fr: projectile.attackerNameFr,
    })),
    floating_damage_texts: (battle ? battle.getFloatingTexts() : []).map((text) => ({
      damage: text.damage,
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

function getPokemonLoadTargets(routeDataInput) {
  const targetsById = new Map();
  for (const starter of STARTER_CHOICES) {
    targetsById.set(Number(starter.id), starter.nameEn);
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

function parseCsvRows(rawCsv) {
  const text = String(rawCsv || "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === "\"") {
        if (text[i + 1] === "\"") {
          field += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char === "\r") {
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseCsvObjects(rawCsv) {
  const rows = parseCsvRows(rawCsv);
  if (rows.length <= 0) {
    return [];
  }
  const header = rows[0].map((cell) =>
    String(cell || "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase(),
  );
  const objects = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!Array.isArray(row) || row.length <= 0) {
      continue;
    }
    const obj = {};
    let hasValue = false;
    for (let col = 0; col < header.length; col += 1) {
      const key = header[col];
      if (!key) {
        continue;
      }
      const value = String(row[col] || "");
      if (value.trim() !== "") {
        hasValue = true;
      }
      obj[key] = value;
    }
    if (hasValue) {
      objects.push(obj);
    }
  }
  return objects;
}

function readCsvCell(row, key) {
  if (!row || typeof row !== "object") {
    return "";
  }
  if (!Object.prototype.hasOwnProperty.call(row, key)) {
    return "";
  }
  return String(row[key] || "").trim();
}

function parseCsvMethods(valueRaw) {
  return String(valueRaw || "")
    .split("|")
    .map((method) => String(method || "").toLowerCase().trim())
    .filter(Boolean);
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
  const rows = parseCsvObjects(rawCsv);
  const routeIds = new Set();
  const encountersByRouteId = new Map();

  for (const row of rows) {
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
    encountersByRouteId.get(routeId).push(encounter);
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
  const routeData = await response.json();
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

async function preloadRouteBackgrounds(routeCatalog) {
  const entries = await Promise.all(
    Array.from(routeCatalog.values()).map(async (routeData) => [
      routeData.route_id,
      await loadImage(routeData.background_image || null),
    ]),
  );
  return new Map(entries);
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
  refreshRouteUi();
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

async function loadPokemonDefinitions(routeDataInput) {
  const defsById = new Map();
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

  state.pokemonDefsById = defsById;
}

async function initializeScene() {
  state.mode = "loading";
  state.pendingSimMs = 0;
  state.deferredSaveDirty = false;
  state.environment.snapshot = getEnvironmentSnapshot(Date.now());
  resetNotificationSystem();
  state.ui.shopTab = [SHOP_TAB_POKEBALLS, SHOP_TAB_COMBAT, SHOP_TAB_EVOLUTIONS].includes(state.ui.shopTab)
    ? state.ui.shopTab
    : SHOP_TAB_POKEBALLS;
  state.ui.shopQuantityMode = normalizeShopQuantityMode(state.ui.shopQuantityMode || "1");
  state.ui.shopCustomQuantity = Math.max(1, toSafeInt(state.ui.shopCustomQuantity, 1));
  state.teamLevelUpEffects = [];
  state.moneyHud.initialized = false;
  state.moneyHud.targetValue = 0;
  state.moneyHud.displayValue = 0;
  state.moneyHud.lastRawValue = 0;
  state.moneyHud.pulseMs = 0;
  clearMoneyGainFloaters();
  state.evolutionAnimation.current = null;
  state.evolutionAnimation.queue = [];
  setZoneEncounterCsvState(null);
  stopBackgroundTicker();
  refreshLocalFileLinkButtonState();
  hideHoverPopup();
  closeBoxesModal();
  closeAppearanceModal();
  setMapOpen(false);
  setShopOpen(false);
  try {
    let offlineCatchupMs = 0;
    state.saveData = await loadSaveData();
    try {
      const csvPayload = await loadZoneEncounterCsv(ROUTE_ENCOUNTERS_CSV_PATH);
      setZoneEncounterCsvState(csvPayload);
    } catch (error) {
      setZoneEncounterCsvState(null);
      console.warn("Zone CSV indisponible, fallback JSON:", error?.message || error);
    }
    state.routeCatalog = await loadRouteCatalog(ROUTE_ID_ORDER);
    await loadPokemonDefinitions(Array.from(state.routeCatalog.values()));
    const unlockStateReconciled = reconcileEntityUnlockStates();
    const appearanceStateReconciled = reconcileEntityAppearanceStates();
    state.routeBackgroundsById = await preloadRouteBackgrounds(state.routeCatalog);

    ensureUnlockedRoutesForCurrentCatalog();
    const preferredRouteId = typeof state.saveData.current_route_id === "string" ? state.saveData.current_route_id : DEFAULT_ROUTE_ID;
    const unlockedRouteIds = ensureUnlockedRoutesForCurrentCatalog();
    const initialRouteId = unlockedRouteIds.includes(preferredRouteId) ? preferredRouteId : unlockedRouteIds[0];
    setActiveRoute(initialRouteId, { announceUnlock: false });

    ensureMoneyAndItems();
    if (unlockStateReconciled || appearanceStateReconciled) {
      persistSaveData();
    }
    offlineCatchupMs = queueOfflineCatchupFromSave(Date.now());

    renderStarterChoices();
    rebuildTeamAndSyncBattle();
    updateHud();

    if (!state.saveData.starter_chosen || state.team.length === 0) {
      state.saveData.starter_chosen = false;
      state.saveData.team = [];
      state.team = [];
      state.battle = null;
      state.enemy = null;
      state.pendingSimMs = 0;
      showStarterModal();
      persistSaveData();
      setTopMessage("Choisis ton starter pour debuter sur Route 1.", 2200);
    } else {
      hideStarterModal();
      startBattle();
    }

    if (!state.saveBackend.bridgeAvailable && state.saveData.starter_chosen && state.team.length > 0) {
      setTopMessage(
        "Save bridge hors ligne: sauvegarde localeStorage. Lance run_local_game_with_save.ps1 pour AppData\\Roaming\\PokeIdle.",
        4200,
      );
    }

    state.mode = "ready";
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

function resetSaveAndRestart() {
  const shouldReset = window.confirm("Supprimer toute la sauvegarde locale et recommencer ?");
  if (!shouldReset) {
    return;
  }
  localStorage.removeItem(SAVE_KEY);
  state.saveData = createEmptySave();
  state.team = [];
  state.enemy = null;
  state.battle = null;
  state.pendingSimMs = 0;
  state.deferredSaveDirty = false;
  state.teamLevelUpEffects = [];
  state.moneyHud.initialized = false;
  state.moneyHud.targetValue = 0;
  state.moneyHud.displayValue = 0;
  state.moneyHud.lastRawValue = 0;
  state.moneyHud.pulseMs = 0;
  clearMoneyGainFloaters();
  state.evolutionAnimation.current = null;
  state.evolutionAnimation.queue = [];
  state.ui.shopTab = SHOP_TAB_POKEBALLS;
  state.ui.shopQuantityMode = "1";
  state.ui.shopCustomQuantity = 1;
  state.realClockLastMs = Date.now();
  state.environment.snapshot = getEnvironmentSnapshot(Date.now());
  stopBackgroundTicker();
  setMapOpen(false);
  setShopOpen(false);
  closeBoxesModal();
  closeAppearanceModal();
  persistSaveData();
  updateHud();
  hideHoverPopup();
  hideStarterModal();
  initializeScene().catch(() => {});
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await canvas.requestFullscreen();
    return;
  }
  await document.exitFullscreen();
}

document.addEventListener("keydown", (event) => {
  const key = String(event.key || "").toLowerCase();
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
canvas.addEventListener("mouseleave", hideHoverPopup);
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
if (linkSaveFileButtonEl) {
  linkSaveFileButtonEl.addEventListener("click", () => {
    linkSaveFileFromUserAction().catch(() => {});
  });
}
if (closeShopButtonEl) {
  closeShopButtonEl.addEventListener("click", () => {
    setShopOpen(false);
  });
}
if (mapCloseButtonEl) {
  mapCloseButtonEl.addEventListener("click", () => {
    setMapOpen(false);
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
    state.ui.shopCustomQuantity = Math.max(1, toSafeInt(shopCustomQtyInputEl.value, 1));
    if (state.ui.shopQuantityMode === "custom") {
      renderShopModal();
    }
  });
  shopCustomQtyInputEl.addEventListener("focus", () => {
    if (state.ui.shopQuantityMode !== "custom") {
      setShopQuantityMode("custom");
    }
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
if (shopModalEl) {
  shopModalEl.addEventListener("click", (event) => {
    if (event.target === shopModalEl) {
      setShopOpen(false);
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
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (state.ui.shopOpen) {
    const insideShopPanel = Boolean(target.closest(".shop-modal-card"));
    const onShopButton = shopButtonEl?.contains(target);
    if (!insideShopPanel && !onShopButton) {
      setShopOpen(false);
    }
  }
});
window.addEventListener("resize", resizeCanvas);
document.addEventListener("fullscreenchange", resizeCanvas);
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pagehide", handlePageLifecyclePersist);
window.addEventListener("beforeunload", handlePageLifecyclePersist);

resizeCanvas();
state.realClockLastMs = Date.now();
initializeScene();
window.requestAnimationFrame(gameLoop);



