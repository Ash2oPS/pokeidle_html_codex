const STARTER_CHOICES = [
  { id: 1, nameEn: "bulbasaur" },
  { id: 4, nameEn: "charmander" },
  { id: 7, nameEn: "squirtle" },
];

const ROUTE_DATA_PATH = "map_data/kanto_route_1.json";
const SAVE_KEY = "pokeidle_save_v3";
const SHINY_ODDS = 4096;
const SAVE_VERSION = 4;
const SAVE_FILE_DB_NAME = "pokeidle_save_file_db";
const SAVE_FILE_DB_STORE = "save_handles";
const SAVE_FILE_HANDLE_KEY = "main_handle";
const SAVE_FILE_SUGGESTED_NAME = "pokeidle_save.json";

const MAX_TEAM_SIZE = 6;
const BASE_STEP_MS = 1000 / 60;
const ATTACK_INTERVAL_MS = 500;
const STARTER_LEVEL = 1;
const PROJECTILE_SPEED_PX_PER_SECOND = 520;
const DAMAGE_SCALE = 1.7;
const KO_RESPAWN_DELAY_MS = 420;
const KO_ANIMATION_DURATION_MS = 210;
const FLOATING_TEXT_LIFETIME_MS = 950;
const PROJECTILE_SPRITE_PX = 72;
const CAPTURE_THROW_MS = 360;
const CAPTURE_SHAKE_MS = 560;
const CAPTURE_SUCCESS_BURST_MS = 560;
const CAPTURE_FAIL_BREAK_MS = 420;
const CAPTURE_FAIL_REAPPEAR_MS = 460;
const CAPTURE_POST_MS = 230;
const MAX_LEVEL = 100;
const POKEBALL_PRICE = 200;
const SHOP_QUICK_BUY_AMOUNT = 5;
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
const starterModalEl = document.getElementById("starter-modal");
const starterChoicesEl = document.getElementById("starter-choices");
const hoverPopupEl = document.getElementById("hover-popup");
const resetSaveButtonEl = document.getElementById("reset-save-btn");
const shopButtonEl = document.getElementById("shop-btn");
const shopPanelEl = document.getElementById("shop-panel");
const linkSaveFileButtonEl = document.getElementById("link-save-file-btn");
const buyPokeballButtonEl = document.getElementById("buy-pokeball-btn");
const buyPokeballQuickButtonEl = document.getElementById("buy-pokeball-quick-btn");
const closeShopButtonEl = document.getElementById("close-shop-btn");
const moneyValueEl = document.getElementById("money-value");
const pokeballValueEl = document.getElementById("pokeball-value");
const saveBackendValueEl = document.getElementById("save-backend-value");
const projectileSpriteCache = new Map();

const state = {
  mode: "loading",
  error: null,
  timeMs: 0,
  routeData: null,
  backgroundImage: null,
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
  topMessage: null,
  ui: {
    shopOpen: false,
  },
  saveBackend: {
    fileHandle: null,
    writesInFlight: Promise.resolve(),
    linkedFromDb: false,
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

function normalizePokemonEntityRecord(rawEntity, pokemonId) {
  const id = Number(pokemonId);
  const counters = normalizeSpeciesCounters(rawEntity);
  const level = clamp(toSafeInt(rawEntity?.level, 1), 1, MAX_LEVEL);
  const xp = Math.max(0, toSafeInt(rawEntity?.xp, 0));
  const baseStats = getPokemonBaseStats(id, rawEntity?.base_stats || rawEntity?.stats);
  const stats = computeStatsAtLevel(baseStats, level);

  return {
    id,
    level,
    xp,
    base_stats: baseStats,
    stats,
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
    base_stats: baseStats,
    stats,
    ...createEmptySpeciesStats(),
  };
}

function createEmptySave() {
  return {
    version: SAVE_VERSION,
    starter_chosen: false,
    current_route_id: "kanto_route_1",
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 0,
    pokeballs: 0,
  };
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
  }

  return {
    version: SAVE_VERSION,
    starter_chosen:
      Boolean(rawSave.starter_chosen) || normalizedTeam.length > 0 || Object.values(entities).some((record) => getCapturedTotal(record) > 0),
    current_route_id: typeof rawSave.current_route_id === "string" ? rawSave.current_route_id : base.current_route_id,
    last_tick_epoch_ms: Math.max(0, toSafeInt(rawSave.last_tick_epoch_ms, 0)),
    team: normalizedTeam,
    pokemon_entities: entities,
    money: Math.max(0, toSafeInt(rawSave.money, 0)),
    pokeballs: Math.max(0, toSafeInt(rawSave.pokeballs, 0)),
  };
}

function supportsLocalFileSaveApi() {
  return (
    typeof window !== "undefined" &&
    typeof window.showSaveFilePicker === "function" &&
    typeof window.indexedDB !== "undefined"
  );
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

function updateSaveBackendIndicator() {
  if (!saveBackendValueEl) {
    return;
  }
  saveBackendValueEl.textContent = state.saveBackend.fileHandle ? "fichier local" : "localStorage";
}

function getSaveTickEpochMs(savePayload) {
  return Math.max(0, toSafeInt(savePayload?.last_tick_epoch_ms, 0));
}

async function loadSaveData() {
  await restoreSaveFileHandleFromDb();
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

  let selected = null;
  if (fileSave && localSave) {
    selected = getSaveTickEpochMs(fileSave) >= getSaveTickEpochMs(localSave) ? fileSave : localSave;
  } else if (fileSave) {
    selected = fileSave;
  } else if (localSave) {
    selected = localSave;
  } else {
    selected = createEmptySave();
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(selected));
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
  if (!handle) {
    updateSaveBackendIndicator();
    return;
  }

  state.saveBackend.writesInFlight = state.saveBackend.writesInFlight
    .then(() => writeSerializedSaveToFileHandle(handle, serialized))
    .then((written) => {
      if (!written) {
        throw new Error("save write failed");
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
  const minStepForSafety = Math.max(1, Math.min(FOREGROUND_FRAME_STEP_MS, ATTACK_INTERVAL_MS));
  const maxIterations = Math.max(64, Math.ceil(budgetMs / minStepForSafety) + 32);

  while (state.pendingSimMs > 0.5 && consumedMs < budgetMs && safety < maxIterations) {
    const remainingBudget = Math.max(0, budgetMs - consumedMs);
    if (remainingBudget <= 0) {
      break;
    }

    const remainingSim = state.pendingSimMs;
    const forceIdleMode = Boolean(options.forceIdleMode);
    const idleMode = forceIdleMode || hidden || remainingSim >= BULK_IDLE_THRESHOLD_MS;
    const idealStep = idleMode ? Math.max(ATTACK_INTERVAL_MS, BULK_IDLE_THRESHOLD_MS) : FOREGROUND_FRAME_STEP_MS;
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
    setTopMessage("Ton navigateur ne supporte pas la sauvegarde en fichier local.", 2200);
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
  if (typeof record[field] !== "number") {
    record[field] = 0;
  }
  record[field] += amount;
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
  state.saveData.pokeballs = Math.max(0, toSafeInt(state.saveData.pokeballs, 0));
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
  if (!state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  state.saveData.pokeballs += Math.max(0, toSafeInt(amount, 0));
}

function consumePokeball() {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  if (state.saveData.pokeballs <= 0) {
    return false;
  }
  state.saveData.pokeballs -= 1;
  return true;
}

function ensurePokemonEntityUnlocked(pokemonId, initialLevel = 1) {
  const record = ensureSpeciesStats(pokemonId);
  const wasUnlocked = getCapturedTotal(record) > 0;
  if (!wasUnlocked) {
    setEntityLevel(record, initialLevel);
    record.xp = 0;
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

function rebuildTeamAndSyncBattle() {
  state.team = hydrateTeamFromSave();
  if (state.battle) {
    state.battle.syncTeam(state.team);
  }
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
    return { reward: 0, levelUps: [] };
  }
  const reward = computeCaptureXpReward(enemy);
  const levelUps = [];

  for (const pokemonId of state.saveData.team.slice(0, MAX_TEAM_SIZE)) {
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
      });
    }
  }

  rebuildTeamAndSyncBattle();
  return { reward, levelUps };
}

function computeCatchChance(catchRate) {
  const normalizedRate = clamp(Number(catchRate || 45), 1, 255) / 255;
  return clamp(0.07 + normalizedRate * 0.75, 0.06, 0.94);
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
    return 0;
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
  const crit = Math.random() < 0.08 ? 1.5 : 1;
  const variance = 0.9 + Math.random() * 0.2;
  const total = baseDamage * stab * typeMultiplier * crit * variance * DAMAGE_SCALE;

  return Math.max(1, Math.round(total));
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
    respawnDelayMs = KO_RESPAWN_DELAY_MS,
    createEnemy,
    onEnemySpawn,
    onEnemyDefeated,
  }) {
    this.team = Array.isArray(team) ? team : [];
    this.attackIntervalMs = attackIntervalMs;
    this.enemyRespawnDelayMs = respawnDelayMs;
    this.createEnemy = typeof createEnemy === "function" ? createEnemy : () => null;
    this.onEnemySpawn = typeof onEnemySpawn === "function" ? onEnemySpawn : () => {};
    this.onEnemyDefeated = typeof onEnemyDefeated === "function" ? onEnemyDefeated : () => {};
    this.turnIndex = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.hitEffects = [];
    this.enemyHitPulseMs = 0;
    this.lastImpact = null;
    this.enemiesDefeated = 0;
    this.attackTimerMs = attackIntervalMs;
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.slotRecoil = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.enemy = null;
    this.spawnEnemy();
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
    this.updateFloatingTexts(deltaMs);
    this.updateHitEffects(deltaMs);
    this.updateKoTransition(deltaMs);
    this.updateSlotRecoil(deltaMs);
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
      return;
    }

    this.attackTimerMs -= deltaMs;
    while (this.attackTimerMs <= 0) {
      this.spawnNextProjectile(layout);
      this.attackTimerMs += this.attackIntervalMs;
    }

    if (!this.enemy) {
      return;
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

    sequence.elapsedMs = Math.min(sequence.totalMs, sequence.elapsedMs + deltaMs);
    const shakeEnd = CAPTURE_THROW_MS + CAPTURE_SHAKE_MS;

    if (sequence.captured && !sequence.burstSpawned && sequence.elapsedMs >= shakeEnd) {
      sequence.burstSpawned = true;
      const count = 32;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = 90 + Math.random() * 150;
        const lifeMs = 320 + Math.random() * 380;
        sequence.particles.push({
          kind: "success",
          x: sequence.targetX,
          y: sequence.targetY + 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 16,
          size: 1.8 + Math.random() * 2.6,
          lifeMs,
          maxLifeMs: lifeMs,
          color: i % 2 === 0 ? [115, 240, 160] : [255, 255, 195],
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
    this.projectiles.push({
      x: startX,
      y: startY,
      targetX,
      targetY,
      speed: PROJECTILE_SPEED_PX_PER_SECOND,
      radius: clamp(slot.size * 0.11, 6, 12),
      attackType,
      attackerIndex,
      attackerNameFr: attacker.nameFr,
      spinPhase: Math.random() * Math.PI * 2,
      spinVelocity: (1.8 + Math.random() * 2.2) * (Math.random() < 0.5 ? -1 : 1),
      rotation: 0,
      lifetimeMs: 0,
    });
  }

  updateProjectiles(deltaMs, layout) {
    const survivors = [];
    const dt = deltaMs / 1000;

    for (const projectile of this.projectiles) {
      projectile.targetX = layout.centerX;
      projectile.targetY = layout.centerY - layout.enemySize * 0.16;
      projectile.lifetimeMs += deltaMs;

      const dx = projectile.targetX - projectile.x;
      const dy = projectile.targetY - projectile.y;
      const distance = Math.hypot(dx, dy);
      const frameDistance = projectile.speed * dt;

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

  addFloatingDamageText({ damage, attackType, typeMultiplier, targetX, targetY }) {
    let label = "";
    if (typeMultiplier >= 2) {
      label = "SUPER";
    } else if (typeMultiplier > 0 && typeMultiplier < 1) {
      label = "RESIST";
    } else if (typeMultiplier === 0) {
      label = "IMMUNE";
    }

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

  addEnemyHitEffects({ attackType, typeMultiplier, targetX, targetY, damage }) {
    const color = getTypeColor(attackType);
    const impactFactor = typeMultiplier >= 2 ? 1.25 : typeMultiplier > 0 && typeMultiplier < 1 ? 0.9 : 1;
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
    const damage = computeDamage(attacker, this.enemy, projectile.attackType, typeMultiplier);

    this.enemy.hpCurrent = clamp(this.enemy.hpCurrent - damage, 0, this.enemy.hpMax);
    this.lastImpact = {
      attackerNameFr: attacker.nameFr,
      attackType: projectile.attackType,
      damage,
      typeMultiplier,
      enemyNameFr: this.enemy.nameFr,
    };
    if (!idleMode) {
      this.addFloatingDamageText({
        damage,
        attackType: projectile.attackType,
        typeMultiplier,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
      });
      this.addEnemyHitEffects({
        damage,
        attackType: projectile.attackType,
        typeMultiplier,
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
      if (idleMode) {
        this.captureSequence = null;
        this.pendingRespawnMs = 0;
        this.koAnimMs = 0;
        this.projectiles = [];
        this.enemyHitPulseMs = 0;
        this.hitEffects = [];
        this.floatingTexts = [];
        this.spawnEnemy();
        return;
      }

      if (captureAttempted) {
        this.captureSequence = {
          captured,
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
  const spritePath = resolveSpritePath(jsonPath, payload?.sprites?.front);
  const shinySpritePath = resolveSpritePath(jsonPath, payload?.sprites?.front_shiny);
  const [spriteImage, spriteShinyImage] = await Promise.all([loadImage(spritePath), loadImage(shinySpritePath)]);
  const defensiveTypes = getDefensiveTypes(payload);
  const offensiveType = String(payload?.offensive_type || defensiveTypes[0] || "normal").toLowerCase();

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
  const level = clamp(toSafeInt(record?.level, 1), 1, MAX_LEVEL);
  const stats = computeStatsAtLevel(record?.base_stats || def.stats, level);
  const hpMax = computeBattleHpMax(stats, level, false);
  return {
    ...def,
    level,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    isShiny: false,
    spriteImage: def.spriteImage,
  };
}

function hydrateTeamFromSave() {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return [];
  }
  const uniqueIds = [];
  for (const rawId of state.saveData.team) {
    const id = Number(rawId);
    if (id > 0 && !uniqueIds.includes(id)) {
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
  if (!state.routeData || !Array.isArray(state.routeData.encounters)) {
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
  return {
    ...def,
    level,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    catchRate: Number(def.catchRate || picked.catch_rate || 45),
    isShiny,
    spriteImage: isShiny ? def.spriteShinyImage || def.spriteImage : def.spriteImage,
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
  const moneyReward = computeDefeatMoneyReward(enemy);
  addMoney(moneyReward);
  let topMessage = `${enemy.nameFr} battu: +${moneyReward} Poke$`;
  let captureAttempted = false;
  let captured = false;
  let addedToTeam = false;
  let xpSummary = null;
  let leveledNames = [];

  if (state.saveData?.pokeballs > 0) {
    captureAttempted = consumePokeball();
    if (captureAttempted) {
      captured = Math.random() < computeCatchChance(enemy.catchRate);
      if (!captured) {
        topMessage = `${enemy.nameFr} battu: +${moneyReward} Poke$ | Capture ratee (${state.saveData.pokeballs} Pokeball)`;
      } else {
        const { wasUnlocked } = ensurePokemonEntityUnlocked(enemy.id, 1);
        incrementSpeciesStat(enemy.id, "captured", enemy.isShiny, 1);
        if (!wasUnlocked) {
          addedToTeam = addSpeciesToTeamIfPossible(enemy.id);
        }
        xpSummary = awardCaptureXpToTeam(enemy);
        leveledNames = xpSummary.levelUps.map((entry) => `${entry.nameFr} (${entry.toLevel})`);

        const shinyLabel = enemy.isShiny ? " shiny" : "";
        const teamLabel = addedToTeam ? " rejoint l'equipe" : "";
        topMessage = `Capture reussie: ${enemy.nameFr}${shinyLabel}${teamLabel} | +${moneyReward} Poke$`;
      }
    }
  } else {
    topMessage = `${enemy.nameFr} battu: +${moneyReward} Poke$ (plus de Pokeball)`;
  }

  if (xpSummary?.reward) {
    topMessage += ` | +${xpSummary.reward} XP`;
  }
  if (leveledNames.length > 0) {
    topMessage += ` | Level up: ${leveledNames.join(", ")}`;
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
  if (!state.team.length) {
    state.battle = null;
    state.enemy = null;
    return;
  }

  state.battle = new PokemonBattleManager({
    team: state.team,
    attackIntervalMs: ATTACK_INTERVAL_MS,
    createEnemy: createRouteEnemyInstance,
    onEnemySpawn: handleEnemySpawn,
    onEnemyDefeated: handleEnemyDefeated,
  });
  state.enemy = state.battle.getEnemy();
}

function setTopMessage(text, durationMs = 1200) {
  if (!text) {
    state.topMessage = null;
    return;
  }
  state.topMessage = {
    text,
    expiresAt: state.timeMs + Math.max(200, Number(durationMs) || 0),
  };
}

function updateHud() {
  if (!state.saveData) {
    if (moneyValueEl) {
      moneyValueEl.textContent = "0";
    }
    if (pokeballValueEl) {
      pokeballValueEl.textContent = "0";
    }
    updateSaveBackendIndicator();
    return;
  }

  ensureMoneyAndItems();
  if (moneyValueEl) {
    moneyValueEl.textContent = String(state.saveData.money);
  }
  if (pokeballValueEl) {
    pokeballValueEl.textContent = String(state.saveData.pokeballs);
  }
  updateSaveBackendIndicator();
}

function setShopOpen(open) {
  state.ui.shopOpen = Boolean(open);
  if (!shopPanelEl) {
    return;
  }
  if (state.ui.shopOpen) {
    shopPanelEl.classList.remove("hidden");
  } else {
    shopPanelEl.classList.add("hidden");
  }
}

function toggleShopPanel() {
  setShopOpen(!state.ui.shopOpen);
}

function buyPokeballs(amount) {
  const qty = Math.max(1, toSafeInt(amount, 1));
  const totalCost = qty * POKEBALL_PRICE;
  if (!state.saveData) {
    return false;
  }
  if (!spendMoney(totalCost)) {
    setTopMessage(`Pas assez d'argent pour ${qty} Pokeball (${totalCost} Poke$).`, 1500);
    updateHud();
    return false;
  }
  addPokeballs(qty);
  persistSaveData();
  updateHud();
  setTopMessage(`Achat: ${qty} Pokeball pour ${totalCost} Poke$.`, 1400);
  return true;
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

function drawPokemonSprite(entity, x, y, size, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  const scale = Number.isFinite(options.scale) ? Math.max(0, options.scale) : 1;
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.34, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  if (entity.spriteImage) {
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
    ctx.drawImage(entity.spriteImage, -drawWidth * 0.5, -drawHeight * 0.45, drawWidth, drawHeight);
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
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

function drawProjectiles(projectiles) {
  for (const projectile of projectiles || []) {
    const rgb = getTypeColor(projectile.attackType);
    const radius = projectile.radius || 8;
    const sprite = getProjectileSprite(projectile.attackType);
    const auraRadius = radius * 3.3;

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
    ctx.restore();

    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(projectile.rotation || 0);
    if (sprite) {
      const size = Math.max(24, radius * 4.6);
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
  const crackRatio = clamp(Number(options.crack_ratio || 0), 0, 1);
  const glowRatio = clamp(Number(options.glow_ratio || 0), 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);

  if (glowRatio > 0) {
    const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * (1.8 + glowRatio * 0.9));
    glow.addColorStop(0, `rgba(176, 255, 202, ${0.42 + glowRatio * 0.4})`);
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

  if (!broken || crackRatio < 0.45) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#d5303e";
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
    ctx.fillStyle = "#d5303e";
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
  } else if (capturePhase === "shake") {
    const localMs = sequence.elapsedMs - CAPTURE_THROW_MS;
    const shakeRatio = clamp(localMs / Math.max(1, CAPTURE_SHAKE_MS), 0, 1);
    const shakeAmp = 8 * (1 - shakeRatio * 0.35);
    ballX = sequence.targetX + Math.sin(localMs * 0.03) * shakeAmp;
    ballY = sequence.targetY;
    ballRotation = Math.sin(localMs * 0.028) * 0.28;
  } else if (capturePhase === "success") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS);
    const ratio = clamp(localMs / Math.max(1, CAPTURE_SUCCESS_BURST_MS), 0, 1);
    ballX = sequence.targetX;
    ballY = sequence.targetY;
    ballRotation = Math.sin(localMs * 0.024) * 0.08;
    glowRatio = 1 - ratio * 0.25;
  } else if (capturePhase === "break" || capturePhase === "reappear") {
    const localMs = sequence.elapsedMs - (CAPTURE_THROW_MS + CAPTURE_SHAKE_MS);
    ballX = sequence.targetX;
    ballY = sequence.targetY;
    broken = true;
    crackRatio = clamp(localMs / Math.max(1, CAPTURE_FAIL_BREAK_MS), 0, 1);
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
  });

  if (capturePhase === "success") {
    const pulse = 0.25 + Math.sin(state.timeMs * 0.02) * 0.15;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ringRadius = layout.enemySize * (0.28 + pulse);
    ctx.strokeStyle = "rgba(172, 255, 190, 0.62)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sequence.targetX, sequence.targetY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
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

function drawBackground(width, height) {
  if (state.backgroundImage) {
    const image = state.backgroundImage;
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = (width - drawWidth) * 0.5;
    const drawY = (height - drawHeight) * 0.5;

    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.imageSmoothingEnabled = wasSmoothing;
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#11253f");
  gradient.addColorStop(1, "#080f1e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
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

function drawTopMessage() {
  if (!state.topMessage) {
    return;
  }

  const remainingMs = state.topMessage.expiresAt - state.timeMs;
  if (remainingMs <= 0) {
    state.topMessage = null;
    return;
  }

  const alpha = clamp(remainingMs / 280, 0, 1);
  const width = clamp(state.viewport.width * 0.56, 220, 620);
  const height = 34;
  const x = (state.viewport.width - width) * 0.5;
  const y = 22;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(5, 15, 29, 0.78)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(190, 219, 255, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#f5fbff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 15px Trebuchet MS";
  ctx.fillText(state.topMessage.text, x + width * 0.5, y + height * 0.53);
  ctx.restore();
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
    drawNameAndLevel(member, drawPosition.x, drawPosition.y + drawPosition.size * 0.62, false);
  }
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
  const koTransition = state.battle ? state.battle.getKoTransition() : null;
  const enemyHitPulse = state.battle ? state.battle.getEnemyHitPulseRatio() : 0;
  const captureSequence = state.battle ? state.battle.getCaptureSequenceState() : null;
  const captureSnapshot = state.battle ? state.battle.getCaptureSequence() : null;
  const capturePhase = captureSnapshot?.phase || null;
  const captureEnemyVisual = getCaptureEnemyVisual(captureSequence, capturePhase);
  const turnIndicator = state.battle ? state.battle.getTurnIndicator(layout) : null;

  drawBackground(width, height);
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
    drawPokemonSprite(member, drawX, drawY, slot.size);
  }

  drawFloatingDamageTexts(state.battle ? state.battle.getFloatingTexts() : []);
  drawBattleUiOverlay(layout, {
    showEnemyUi: Boolean(state.enemy) && !koTransition?.active && !captureSequence,
    teamDrawPositions,
  });
  drawTopMessage();
}

function update(deltaMs, options = {}) {
  const idleMode = Boolean(options.idleMode);
  state.timeMs += deltaMs;
  const layout = computeLayout();
  state.layout = layout;

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
  const width = clamp(window.innerWidth - 32, 320, maxWidth);
  const height = clamp(window.innerHeight - 32, 280, maxHeight);
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

function hideHoverPopup() {
  hoverPopupEl.classList.add("hidden");
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

  for (let i = 0; i < state.team.length; i += 1) {
    const member = state.team[i];
    const slot = layout.teamSlots[i];
    if (!member || !slot) {
      continue;
    }
    const radius = slot.size * 0.34;
    if (Math.hypot(worldX - slot.x, worldY - slot.y) <= radius) {
      return member;
    }
  }

  return null;
}

function showHoverPopup(entity, clientX, clientY) {
  if (!entity) {
    hideHoverPopup();
    return;
  }

  const stats = getSpeciesStatsSummary(entity.id);
  const shinyTag = entity.isShiny ? " shiny" : "";
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

function handleCanvasMouseMove(event) {
  if (state.mode !== "ready") {
    hideHoverPopup();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const worldX = ((event.clientX - rect.left) / width) * state.viewport.width;
  const worldY = ((event.clientY - rect.top) / height) * state.viewport.height;
  const layout = state.layout || computeLayout();
  const hovered = findHoveredPokemon(worldX, worldY, layout);
  showHoverPopup(hovered, event.clientX, event.clientY);
}

function exportTextState() {
  const layout = state.layout || computeLayout();
  const battle = state.battle;

  const enemy = state.enemy
    ? {
        id: state.enemy.id,
        name_fr: state.enemy.nameFr,
        level: state.enemy.level,
        hp_current: state.enemy.hpCurrent,
        hp_max: state.enemy.hpMax,
        is_shiny: Boolean(state.enemy.isShiny),
        defensive_types: state.enemy.defensiveTypes,
        x: Math.round(layout.centerX),
        y: Math.round(layout.centerY),
      }
    : null;

  const team = state.team.map((member, index) => {
    const slot = layout.teamSlots[index];
    return {
      id: member.id,
      name_fr: member.nameFr,
      level: member.level,
      is_shiny: Boolean(member.isShiny),
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
    attack_interval_ms: ATTACK_INTERVAL_MS,
    attack_slots_total: MAX_TEAM_SIZE,
    next_attacker: battle ? battle.getNextAttackerName() : null,
    next_attacker_slot_index: battle?.getTurnIndicator(layout)?.slot_index ?? null,
    enemies_defeated: battle ? battle.enemiesDefeated : 0,
    route_id: state.routeData?.route_id || null,
    route_name_fr: state.routeData?.route_name_fr || null,
    starter_modal_visible: !starterModalEl.classList.contains("hidden"),
    hover_popup_visible: !hoverPopupEl.classList.contains("hidden"),
    save_team_size: state.saveData?.team?.length || 0,
    money: Math.max(0, toSafeInt(state.saveData?.money, 0)),
    pokeballs: Math.max(0, toSafeInt(state.saveData?.pokeballs, 0)),
    save_backend: state.saveBackend.fileHandle ? "local_file" : "local_storage",
    shop_open: Boolean(state.ui.shopOpen),
    top_message: state.topMessage?.text || null,
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
    ko_transition: battle ? battle.getKoTransition() : null,
    capture_sequence: battle ? battle.getCaptureSequence() : null,
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

function getPokemonLoadTargets(routeData) {
  const targetsById = new Map();
  for (const starter of STARTER_CHOICES) {
    targetsById.set(Number(starter.id), starter.nameEn);
  }
  const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  for (const encounter of encounters) {
    const id = Number(encounter?.id || 0);
    const nameEn = String(encounter?.name_en || "").toLowerCase();
    if (id > 0 && nameEn) {
      targetsById.set(id, nameEn);
    }
  }
  return Array.from(targetsById.entries()).map(([id, nameEn]) => ({ id, nameEn }));
}

async function loadRouteData() {
  const response = await fetch(ROUTE_DATA_PATH);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${ROUTE_DATA_PATH}`);
  }
  const routeData = await response.json();
  if (!Array.isArray(routeData?.encounters) || routeData.encounters.length === 0) {
    throw new Error("Aucun Pokemon configure pour la route");
  }
  return routeData;
}

async function loadPokemonDefinitions(routeData) {
  const targets = getPokemonLoadTargets(routeData);
  const loaded = await Promise.all(
    targets.map((entry) => loadPokemonEntity(buildPokemonJsonPath(entry.id, entry.nameEn))),
  );
  state.pokemonDefsById = new Map(loaded.map((entity) => [entity.id, entity]));
}

async function initializeScene() {
  state.mode = "loading";
  state.pendingSimMs = 0;
  state.deferredSaveDirty = false;
  stopBackgroundTicker();
  hideHoverPopup();
  setShopOpen(false);
  try {
    let offlineCatchupMs = 0;
    state.routeData = await loadRouteData();
    await loadPokemonDefinitions(state.routeData);
    state.backgroundImage = await loadImage(state.routeData.background_image || null);
    state.saveData = await loadSaveData();
    state.saveData.current_route_id = state.routeData.route_id || "kanto_route_1";
    ensureMoneyAndItems();
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
  state.topMessage = null;
  state.pendingSimMs = 0;
  state.deferredSaveDirty = false;
  state.realClockLastMs = Date.now();
  stopBackgroundTicker();
  setShopOpen(false);
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
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen().catch(() => {});
  }
});

canvas.addEventListener("mousemove", handleCanvasMouseMove);
canvas.addEventListener("mouseleave", hideHoverPopup);
if (resetSaveButtonEl) {
  resetSaveButtonEl.addEventListener("click", resetSaveAndRestart);
}
if (shopButtonEl) {
  shopButtonEl.addEventListener("click", () => {
    toggleShopPanel();
  });
}
if (linkSaveFileButtonEl) {
  linkSaveFileButtonEl.addEventListener("click", () => {
    linkSaveFileFromUserAction().catch(() => {});
  });
}
if (buyPokeballButtonEl) {
  buyPokeballButtonEl.addEventListener("click", () => {
    buyPokeballs(1);
  });
}
if (buyPokeballQuickButtonEl) {
  buyPokeballQuickButtonEl.addEventListener("click", () => {
    buyPokeballs(SHOP_QUICK_BUY_AMOUNT);
  });
}
if (closeShopButtonEl) {
  closeShopButtonEl.addEventListener("click", () => {
    setShopOpen(false);
  });
}
document.addEventListener("click", (event) => {
  if (!shopPanelEl || !state.ui.shopOpen) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const insidePanel = shopPanelEl.contains(target);
  const onShopButton = shopButtonEl?.contains(target);
  if (!insidePanel && !onShopButton) {
    setShopOpen(false);
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



