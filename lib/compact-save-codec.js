export const COMPACT_SAVE_FORMAT_ID = "pi5z";
export const COMPACT_SAVE_BALL_ORDER = Object.freeze([
  "poke_ball",
  "super_ball",
  "hyper_ball",
]);
export const COMPACT_SAVE_ITEM_ORDER = Object.freeze([
  "water_stone",
  "fire_stone",
  "leaf_stone",
  "galarica_wreath",
  "ice_stone",
  "moon_stone",
  "sun_stone",
  "thunder_stone",
  "cable_link",
  "metal_coat",
]);

const POKEMON_FLAG_ENTITY_UNLOCKED = 1;
const POKEMON_FLAG_APPEARANCE_SHINY_MODE = 2;
const POKEMON_FLAG_APPEARANCE_ULTRA_SHINY_MODE = 4;

const FIRST_FREE_FLAG_CLAIMED = 1;
const FIRST_FREE_FLAG_GUARANTEED_PENDING = 2;

const TUTORIAL_FLAG_ROUTE_1_INTRO = 1;
const TUTORIAL_FLAG_EVOLUTION_INTRO = 2;
const TUTORIAL_FLAG_APPEARANCE_INTRO = 4;

const BALL_CAPTURE_RULE_FLAG_ALL = 1;
const BALL_CAPTURE_RULE_FLAG_UNOWNED = 2;
const BALL_CAPTURE_RULE_FLAG_OWNED = 4;
const BALL_CAPTURE_RULE_FLAG_SHINY = 8;
const BALL_CAPTURE_RULE_FLAG_ULTRA_SHINY = 16;

const DEFAULT_BALL_CAPTURE_RULE_KEYS = Object.freeze({
  all: "capture_all",
  unowned: "capture_unowned",
  owned: "capture_owned",
  shiny: "capture_shiny",
  ultraShiny: "capture_ultra_shiny",
});

const DEFAULT_POKEMON_COUNTERS = Object.freeze([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]);

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
}

function toSafeInt(value, fallback = 0, options = {}) {
  const readSafeInt = typeof options.toSafeInt === "function" ? options.toSafeInt : fallbackToSafeInt;
  return readSafeInt(value, fallback);
}

function clampNonNegativeInt(value, fallback = 0, options = {}) {
  return Math.max(0, toSafeInt(value, fallback, options));
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = [];
  for (const value of values) {
    const nextValue = String(value || "").trim();
    if (!nextValue || normalized.includes(nextValue)) {
      continue;
    }
    normalized.push(nextValue);
  }
  return normalized;
}

export function sanitizePositiveIntArray(values, options = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = [];
  for (const rawValue of values) {
    const numeric = clampNonNegativeInt(rawValue, 0, options);
    if (numeric <= 0 || normalized.includes(numeric)) {
      continue;
    }
    normalized.push(numeric);
  }
  normalized.sort((a, b) => a - b);
  return normalized;
}

function isMeaningfulPokemonEntityRecord(record, counters, flags, selectedVariant, ownedVariants, nickname, evolutionTargets, happinessBoxStreakMs, options = {}) {
  if (!record || typeof record !== "object") {
    return false;
  }
  const level = clampNonNegativeInt(record.level, 1, options);
  const xp = clampNonNegativeInt(record.xp, 0, options);
  if (level > 1 || xp > 0 || flags > 0 || happinessBoxStreakMs > 0) {
    return true;
  }
  if (Array.isArray(counters) && counters.some((value) => clampNonNegativeInt(value, 0, options) > 0)) {
    return true;
  }
  if (selectedVariant || nickname) {
    return true;
  }
  if ((Array.isArray(ownedVariants) && ownedVariants.length > 0) || (Array.isArray(evolutionTargets) && evolutionTargets.length > 0)) {
    return true;
  }
  return false;
}

function buildPokemonFlags(record) {
  let flags = 0;
  if (record?.entity_unlocked) {
    flags |= POKEMON_FLAG_ENTITY_UNLOCKED;
  }
  if (record?.appearance_shiny_mode) {
    flags |= POKEMON_FLAG_APPEARANCE_SHINY_MODE;
  }
  if (record?.appearance_ultra_shiny_mode) {
    flags |= POKEMON_FLAG_APPEARANCE_ULTRA_SHINY_MODE;
  }
  return flags;
}

function buildPokemonCounters(record, options = {}) {
  return [
    clampNonNegativeInt(record?.encountered_normal, 0, options),
    clampNonNegativeInt(record?.encountered_shiny, 0, options),
    clampNonNegativeInt(record?.encountered_ultra_shiny, 0, options),
    clampNonNegativeInt(record?.defeated_normal, 0, options),
    clampNonNegativeInt(record?.defeated_shiny, 0, options),
    clampNonNegativeInt(record?.defeated_ultra_shiny, 0, options),
    clampNonNegativeInt(record?.captured_normal, 0, options),
    clampNonNegativeInt(record?.captured_shiny, 0, options),
    clampNonNegativeInt(record?.captured_ultra_shiny, 0, options),
  ];
}

function trimTrailingTupleDefaults(tuple, defaults) {
  const trimmed = Array.isArray(tuple) ? [...tuple] : [];
  const fallbackDefaults = Array.isArray(defaults) ? defaults : [];
  while (trimmed.length > 4) {
    const index = trimmed.length - 1;
    const currentValue = trimmed[index];
    const defaultValue = fallbackDefaults[index];
    if (Array.isArray(defaultValue)) {
      if (Array.isArray(currentValue) && currentValue.length <= 0) {
        trimmed.pop();
        continue;
      }
      break;
    }
    if (currentValue === defaultValue) {
      trimmed.pop();
      continue;
    }
    break;
  }
  return trimmed;
}

function encodePokemonEntityTuple(record, options = {}) {
  const level = Math.max(1, clampNonNegativeInt(record?.level, 1, options));
  const xp = clampNonNegativeInt(record?.xp, 0, options);
  const flags = buildPokemonFlags(record);
  const counters = buildPokemonCounters(record, options);
  const selectedVariant = String(record?.appearance_selected_variant || "");
  const ownedVariants = sanitizeStringArray(record?.appearance_owned_variants);
  const nickname = String(record?.nickname || "");
  const evolutionTargets = sanitizeStringArray(record?.evolution_item_ready_targets);
  const happinessBoxStreakMs = clampNonNegativeInt(record?.happiness_box_streak_ms, 0, options);

  if (
    !isMeaningfulPokemonEntityRecord(
      record,
      counters,
      flags,
      selectedVariant,
      ownedVariants,
      nickname,
      evolutionTargets,
      happinessBoxStreakMs,
      options,
    )
  ) {
    return null;
  }

  return trimTrailingTupleDefaults(
    [
      level,
      xp,
      flags,
      counters,
      selectedVariant,
      ownedVariants,
      nickname,
      evolutionTargets,
      happinessBoxStreakMs,
    ],
    [
      1,
      0,
      0,
      DEFAULT_POKEMON_COUNTERS,
      "",
      [],
      "",
      [],
      0,
    ],
  );
}

function decodePokemonEntityTuple(rawTuple, pokemonId, options = {}) {
  if (!Array.isArray(rawTuple)) {
    return null;
  }
  const normalizePokemonEntityRecord =
    typeof options.normalizePokemonEntityRecord === "function" ? options.normalizePokemonEntityRecord : null;
  if (!normalizePokemonEntityRecord) {
    throw new Error("decodeCompactSave requiert normalizePokemonEntityRecord.");
  }

  const flags = clampNonNegativeInt(rawTuple[2], 0, options);
  const countersRaw = Array.isArray(rawTuple[3]) ? rawTuple[3] : DEFAULT_POKEMON_COUNTERS;
  const counters = [...DEFAULT_POKEMON_COUNTERS];
  for (let index = 0; index < counters.length; index += 1) {
    counters[index] = clampNonNegativeInt(countersRaw[index], 0, options);
  }

  return normalizePokemonEntityRecord(
    {
      id: pokemonId,
      level: Math.max(1, clampNonNegativeInt(rawTuple[0], 1, options)),
      xp: clampNonNegativeInt(rawTuple[1], 0, options),
      entity_unlocked: Boolean(flags & POKEMON_FLAG_ENTITY_UNLOCKED),
      appearance_shiny_mode: Boolean(flags & POKEMON_FLAG_APPEARANCE_SHINY_MODE),
      appearance_ultra_shiny_mode: Boolean(flags & POKEMON_FLAG_APPEARANCE_ULTRA_SHINY_MODE),
      encountered_normal: counters[0],
      encountered_shiny: counters[1],
      encountered_ultra_shiny: counters[2],
      defeated_normal: counters[3],
      defeated_shiny: counters[4],
      defeated_ultra_shiny: counters[5],
      captured_normal: counters[6],
      captured_shiny: counters[7],
      captured_ultra_shiny: counters[8],
      appearance_selected_variant: String(rawTuple[4] || ""),
      appearance_owned_variants: sanitizeStringArray(rawTuple[5]),
      nickname: String(rawTuple[6] || ""),
      evolution_item_ready_targets: sanitizeStringArray(rawTuple[7]),
      happiness_box_streak_ms: clampNonNegativeInt(rawTuple[8], 0, options),
    },
    pokemonId,
  );
}

function encodeBallInventorySeen(ballInventorySeen, ballInventory, ballOrder, options = {}) {
  let mask = 0;
  for (let index = 0; index < ballOrder.length; index += 1) {
    const ballType = ballOrder[index];
    const hasInventory = clampNonNegativeInt(ballInventory?.[ballType], 0, options) > 0;
    const seen = hasInventory || Boolean(ballInventorySeen?.[ballType]) || ballType === "poke_ball";
    if (seen) {
      mask |= 1 << index;
    }
  }
  return mask;
}

function decodeBallInventorySeen(mask, ballInventory, ballOrder, baseSeen, options = {}) {
  const normalized = baseSeen && typeof baseSeen === "object" ? { ...baseSeen } : {};
  const bitmask = clampNonNegativeInt(mask, 0, options);
  for (let index = 0; index < ballOrder.length; index += 1) {
    const ballType = ballOrder[index];
    normalized[ballType] =
      ballType === "poke_ball"
      || Boolean(bitmask & (1 << index))
      || clampNonNegativeInt(ballInventory?.[ballType], 0, options) > 0;
  }
  normalized.poke_ball = true;
  return normalized;
}

function encodeCaptureRuleMask(ruleSet, ruleKeys) {
  let mask = 0;
  if (ruleSet?.[ruleKeys.all]) {
    mask |= BALL_CAPTURE_RULE_FLAG_ALL;
  }
  if (ruleSet?.[ruleKeys.unowned]) {
    mask |= BALL_CAPTURE_RULE_FLAG_UNOWNED;
  }
  if (ruleSet?.[ruleKeys.owned]) {
    mask |= BALL_CAPTURE_RULE_FLAG_OWNED;
  }
  if (ruleSet?.[ruleKeys.shiny]) {
    mask |= BALL_CAPTURE_RULE_FLAG_SHINY;
  }
  if (ruleSet?.[ruleKeys.ultraShiny]) {
    mask |= BALL_CAPTURE_RULE_FLAG_ULTRA_SHINY;
  }
  return mask;
}

function decodeCaptureRuleMask(mask, fallbackRuleSet, ruleKeys, options = {}) {
  const normalized = fallbackRuleSet && typeof fallbackRuleSet === "object" ? { ...fallbackRuleSet } : {};
  const bitmask = clampNonNegativeInt(mask, 0, options);
  normalized[ruleKeys.all] = Boolean(bitmask & BALL_CAPTURE_RULE_FLAG_ALL);
  normalized[ruleKeys.unowned] = Boolean(bitmask & BALL_CAPTURE_RULE_FLAG_UNOWNED);
  normalized[ruleKeys.owned] = Boolean(bitmask & BALL_CAPTURE_RULE_FLAG_OWNED);
  normalized[ruleKeys.shiny] = Boolean(bitmask & BALL_CAPTURE_RULE_FLAG_SHINY);
  normalized[ruleKeys.ultraShiny] = Boolean(bitmask & BALL_CAPTURE_RULE_FLAG_ULTRA_SHINY);
  if (normalized[ruleKeys.all]) {
    normalized[ruleKeys.unowned] = true;
    normalized[ruleKeys.owned] = true;
    normalized[ruleKeys.shiny] = true;
    normalized[ruleKeys.ultraShiny] = true;
  }
  return normalized;
}

function encodeRouteTuple(saveData, routeIdOrder, options = {}) {
  const orderedRouteIds = Array.isArray(routeIdOrder) ? routeIdOrder.map((routeId) => String(routeId || "")) : [];
  const currentRouteId = String(saveData?.current_route_id || orderedRouteIds[0] || "");
  const unlockedRouteIds = Array.isArray(saveData?.unlocked_route_ids) ? saveData.unlocked_route_ids : [];
  const routeDefeatCounts = saveData?.route_defeat_counts && typeof saveData.route_defeat_counts === "object"
    ? saveData.route_defeat_counts
    : {};

  const currentIndex = Math.max(0, orderedRouteIds.indexOf(currentRouteId));
  const unlockedIndexes = [];
  for (const routeIdRaw of unlockedRouteIds) {
    const routeId = String(routeIdRaw || "");
    const index = orderedRouteIds.indexOf(routeId);
    if (index < 0 || unlockedIndexes.includes(index)) {
      continue;
    }
    unlockedIndexes.push(index);
  }
  if (currentIndex >= 0 && !unlockedIndexes.includes(currentIndex)) {
    unlockedIndexes.push(currentIndex);
  }
  if (orderedRouteIds.length > 0 && !unlockedIndexes.includes(0)) {
    unlockedIndexes.push(0);
  }
  unlockedIndexes.sort((a, b) => a - b);

  const sparsePairs = [];
  for (let index = 0; index < orderedRouteIds.length; index += 1) {
    const routeId = orderedRouteIds[index];
    const defeatCount = clampNonNegativeInt(routeDefeatCounts?.[routeId], 0, options);
    if (defeatCount <= 0) {
      continue;
    }
    sparsePairs.push(index, defeatCount);
  }

  return [currentIndex, unlockedIndexes, sparsePairs];
}

function decodeRouteTuple(routeTuple, routeIdOrder, defaultRouteId, baseCounts, options = {}) {
  const orderedRouteIds = Array.isArray(routeIdOrder) && routeIdOrder.length > 0
    ? routeIdOrder.map((routeId) => String(routeId || ""))
    : [String(defaultRouteId || "")];
  const counts = baseCounts && typeof baseCounts === "object" ? { ...baseCounts } : {};
  const rawTuple = Array.isArray(routeTuple) ? routeTuple : [];
  const currentIndex = clampNonNegativeInt(rawTuple[0], 0, options);
  const unlockedIndexesRaw = Array.isArray(rawTuple[1]) ? rawTuple[1] : [];
  const unlockedRouteIds = [];
  for (const rawIndex of unlockedIndexesRaw) {
    const routeIndex = clampNonNegativeInt(rawIndex, -1, options);
    if (routeIndex < 0 || routeIndex >= orderedRouteIds.length) {
      continue;
    }
    const routeId = orderedRouteIds[routeIndex];
    if (!routeId || unlockedRouteIds.includes(routeId)) {
      continue;
    }
    unlockedRouteIds.push(routeId);
  }
  if (orderedRouteIds[0] && !unlockedRouteIds.includes(orderedRouteIds[0])) {
    unlockedRouteIds.unshift(orderedRouteIds[0]);
  }
  const sparsePairs = Array.isArray(rawTuple[2]) ? rawTuple[2] : [];
  for (let cursor = 0; cursor < sparsePairs.length; cursor += 2) {
    const routeIndex = clampNonNegativeInt(sparsePairs[cursor], -1, options);
    if (routeIndex < 0 || routeIndex >= orderedRouteIds.length) {
      continue;
    }
    counts[orderedRouteIds[routeIndex]] = clampNonNegativeInt(sparsePairs[cursor + 1], 0, options);
  }
  if (unlockedRouteIds.length <= 0) {
    unlockedRouteIds.push(orderedRouteIds[0] || String(defaultRouteId || ""));
  }
  const currentRouteId = unlockedRouteIds.includes(orderedRouteIds[currentIndex])
    ? orderedRouteIds[currentIndex]
    : unlockedRouteIds[0] || String(defaultRouteId || "");

  return {
    currentRouteId,
    unlockedRouteIds,
    routeDefeatCounts: counts,
  };
}

function getRuleKeys(options = {}) {
  if (options.ballCaptureRuleKeys && typeof options.ballCaptureRuleKeys === "object") {
    return {
      all: String(options.ballCaptureRuleKeys.all || DEFAULT_BALL_CAPTURE_RULE_KEYS.all),
      unowned: String(options.ballCaptureRuleKeys.unowned || DEFAULT_BALL_CAPTURE_RULE_KEYS.unowned),
      owned: String(options.ballCaptureRuleKeys.owned || DEFAULT_BALL_CAPTURE_RULE_KEYS.owned),
      shiny: String(options.ballCaptureRuleKeys.shiny || DEFAULT_BALL_CAPTURE_RULE_KEYS.shiny),
      ultraShiny: String(options.ballCaptureRuleKeys.ultraShiny || DEFAULT_BALL_CAPTURE_RULE_KEYS.ultraShiny),
    };
  }
  return DEFAULT_BALL_CAPTURE_RULE_KEYS;
}

export function isCompactSavePayload(rawSave, options = {}) {
  const expectedVersion = clampNonNegativeInt(options.saveVersion, 0, options);
  if (!rawSave || typeof rawSave !== "object" || Array.isArray(rawSave)) {
    return false;
  }
  if (String(rawSave.f || "") !== String(options.formatId || COMPACT_SAVE_FORMAT_ID)) {
    return false;
  }
  return clampNonNegativeInt(rawSave.v, -1, options) === expectedVersion;
}

export function encodeCompactSave(saveData, options = {}) {
  const formatId = String(options.formatId || COMPACT_SAVE_FORMAT_ID);
  const saveVersion = clampNonNegativeInt(options.saveVersion, 0, options);
  const appVersion = String(saveData?.app_build_version || options.appVersion || "");
  const routeIdOrder = Array.isArray(options.routeIdOrder) ? options.routeIdOrder : [];
  const defaultRouteId = String(options.defaultRouteId || routeIdOrder[0] || "");
  const ballOrder = Array.isArray(options.ballOrder) ? options.ballOrder : COMPACT_SAVE_BALL_ORDER;
  const itemOrder = Array.isArray(options.itemOrder) ? options.itemOrder : COMPACT_SAVE_ITEM_ORDER;
  const ruleKeys = getRuleKeys(options);

  const pokemonEntries = {};
  const rawEntities = saveData?.pokemon_entities && typeof saveData.pokemon_entities === "object"
    ? Object.entries(saveData.pokemon_entities)
    : [];
  for (const [rawId, record] of rawEntities) {
    const pokemonId = clampNonNegativeInt(record?.id ?? rawId, 0, options);
    if (pokemonId <= 0) {
      continue;
    }
    const encodedRecord = encodePokemonEntityTuple(record, options);
    if (!encodedRecord) {
      continue;
    }
    pokemonEntries[String(pokemonId)] = encodedRecord;
  }

  const ballInventory = saveData?.ball_inventory && typeof saveData.ball_inventory === "object"
    ? saveData.ball_inventory
    : {};
  const ballInventorySeen = saveData?.ball_inventory_seen && typeof saveData.ball_inventory_seen === "object"
    ? saveData.ball_inventory_seen
    : {};
  const ballCaptureRules = saveData?.ball_capture_rules && typeof saveData.ball_capture_rules === "object"
    ? saveData.ball_capture_rules
    : {};

  return {
    f: formatId,
    v: saveVersion,
    b: appVersion,
    t: clampNonNegativeInt(saveData?.last_tick_epoch_ms, 0, options),
    r: encodeRouteTuple(
      {
        current_route_id: String(saveData?.current_route_id || defaultRouteId),
        unlocked_route_ids: saveData?.unlocked_route_ids,
        route_defeat_counts: saveData?.route_defeat_counts,
      },
      routeIdOrder,
      options,
    ),
    tm: sanitizePositiveIntArray(saveData?.team, options),
    p: pokemonEntries,
    w: [
      clampNonNegativeInt(saveData?.money, 0, options),
      clampNonNegativeInt(saveData?.coins, 0, options),
    ],
    bi: ballOrder.map((ballType) => clampNonNegativeInt(ballInventory?.[ballType], 0, options)),
    bs: encodeBallInventorySeen(ballInventorySeen, ballInventory, ballOrder, options),
    cr: ballOrder.map((ballType) => encodeCaptureRuleMask(ballCaptureRules?.[ballType], ruleKeys)),
    ab: Math.max(0, ballOrder.indexOf(String(saveData?.active_ball_type || ""))),
    si: itemOrder.map((itemId) => clampNonNegativeInt(saveData?.shop_items?.[itemId], 0, options)),
    ff:
      (saveData?.first_free_pokeball_claimed ? FIRST_FREE_FLAG_CLAIMED : 0)
      | (saveData?.first_free_pokeball_guaranteed_capture_pending ? FIRST_FREE_FLAG_GUARANTEED_PENDING : 0),
    ax: clampNonNegativeInt(saveData?.attack_boost_until_ms, 0, options),
    tu:
      (saveData?.tutorials?.route1_intro_seen ? TUTORIAL_FLAG_ROUTE_1_INTRO : 0)
      | (saveData?.tutorials?.evolution_intro_seen ? TUTORIAL_FLAG_EVOLUTION_INTRO : 0)
      | (saveData?.tutorials?.appearance_intro_seen ? TUTORIAL_FLAG_APPEARANCE_INTRO : 0),
    ls: sanitizePositiveIntArray(saveData?.legacy_shiny_family_root_ids, options),
    lu: sanitizePositiveIntArray(saveData?.legacy_ultra_shiny_family_root_ids, options),
    zf: sanitizeStringArray(saveData?.zone_flags),
    sd: sanitizeStringArray(saveData?.seen_dialogue_ids),
  };
}

export function decodeCompactSave(rawSave, options = {}) {
  const createEmptySave = typeof options.createEmptySave === "function" ? options.createEmptySave : null;
  if (!createEmptySave) {
    throw new Error("decodeCompactSave requiert createEmptySave.");
  }
  if (!isCompactSavePayload(rawSave, options)) {
    throw new Error("Payload de sauvegarde compacte invalide.");
  }

  const ballOrder = Array.isArray(options.ballOrder) ? options.ballOrder : COMPACT_SAVE_BALL_ORDER;
  const itemOrder = Array.isArray(options.itemOrder) ? options.itemOrder : COMPACT_SAVE_ITEM_ORDER;
  const routeIdOrder = Array.isArray(options.routeIdOrder) ? options.routeIdOrder : [];
  const defaultRouteId = String(options.defaultRouteId || routeIdOrder[0] || "");
  const ruleKeys = getRuleKeys(options);
  const base = createEmptySave();

  const routeResult = decodeRouteTuple(rawSave.r, routeIdOrder, defaultRouteId, base.route_defeat_counts, options);
  const team = sanitizePositiveIntArray(rawSave.tm, options);
  const pokemonEntities = {};
  if (rawSave.p && typeof rawSave.p === "object") {
    for (const [rawId, rawTuple] of Object.entries(rawSave.p)) {
      const pokemonId = clampNonNegativeInt(rawId, 0, options);
      if (pokemonId <= 0) {
        continue;
      }
      const normalizedRecord = decodePokemonEntityTuple(rawTuple, pokemonId, options);
      if (normalizedRecord) {
        pokemonEntities[String(pokemonId)] = normalizedRecord;
      }
    }
  }

  for (const pokemonId of team) {
    const key = String(pokemonId);
    if (!pokemonEntities[key]) {
      pokemonEntities[key] = decodePokemonEntityTuple([1, 0, POKEMON_FLAG_ENTITY_UNLOCKED, DEFAULT_POKEMON_COUNTERS], pokemonId, options);
    } else if (!pokemonEntities[key].entity_unlocked) {
      pokemonEntities[key].entity_unlocked = true;
    }
  }

  const ballInventory = base.ball_inventory && typeof base.ball_inventory === "object" ? { ...base.ball_inventory } : {};
  const rawBallInventory = Array.isArray(rawSave.bi) ? rawSave.bi : [];
  for (let index = 0; index < ballOrder.length; index += 1) {
    const ballType = ballOrder[index];
    ballInventory[ballType] = clampNonNegativeInt(rawBallInventory[index], 0, options);
  }

  const ballCaptureRules = base.ball_capture_rules && typeof base.ball_capture_rules === "object"
    ? { ...base.ball_capture_rules }
    : {};
  const rawRuleMasks = Array.isArray(rawSave.cr) ? rawSave.cr : [];
  for (let index = 0; index < ballOrder.length; index += 1) {
    const ballType = ballOrder[index];
    ballCaptureRules[ballType] = decodeCaptureRuleMask(rawRuleMasks[index], ballCaptureRules[ballType], ruleKeys, options);
  }

  const shopItems = base.shop_items && typeof base.shop_items === "object" ? { ...base.shop_items } : {};
  const rawShopItems = Array.isArray(rawSave.si) ? rawSave.si : [];
  for (let index = 0; index < itemOrder.length; index += 1) {
    shopItems[itemOrder[index]] = clampNonNegativeInt(rawShopItems[index], 0, options);
  }

  const activeBallIndex = clampNonNegativeInt(rawSave.ab, 0, options);
  const activeBallType = ballOrder[activeBallIndex] || String(base.active_ball_type || ballOrder[0] || "poke_ball");
  const tutorials = base.tutorials && typeof base.tutorials === "object" ? { ...base.tutorials } : {};
  const tutorialMask = clampNonNegativeInt(rawSave.tu, 0, options);
  tutorials.route1_intro_seen = Boolean(tutorialMask & TUTORIAL_FLAG_ROUTE_1_INTRO);
  tutorials.evolution_intro_seen = Boolean(tutorialMask & TUTORIAL_FLAG_EVOLUTION_INTRO);
  tutorials.appearance_intro_seen = Boolean(tutorialMask & TUTORIAL_FLAG_APPEARANCE_INTRO);

  const firstFreeFlags = clampNonNegativeInt(rawSave.ff, 0, options);
  const unlockedEntityIds = Object.values(pokemonEntities).filter((record) => record?.entity_unlocked);

  return {
    ...base,
    version: clampNonNegativeInt(options.saveVersion, base.version, options),
    app_build_version: String(rawSave.b || options.appVersion || base.app_build_version || ""),
    starter_chosen: team.length > 0 || unlockedEntityIds.length > 0,
    current_route_id: routeResult.currentRouteId,
    unlocked_route_ids: routeResult.unlockedRouteIds,
    route_defeat_counts: routeResult.routeDefeatCounts,
    last_tick_epoch_ms: clampNonNegativeInt(rawSave.t, 0, options),
    team,
    pokemon_entities: pokemonEntities,
    money: clampNonNegativeInt(rawSave.w?.[0], 0, options),
    coins: clampNonNegativeInt(rawSave.w?.[1], 0, options),
    first_free_pokeball_claimed: Boolean(firstFreeFlags & FIRST_FREE_FLAG_CLAIMED),
    first_free_pokeball_guaranteed_capture_pending: Boolean(firstFreeFlags & FIRST_FREE_FLAG_GUARANTEED_PENDING),
    ball_inventory: ballInventory,
    ball_inventory_seen: decodeBallInventorySeen(rawSave.bs, ballInventory, ballOrder, base.ball_inventory_seen, options),
    ball_capture_rules: ballCaptureRules,
    active_ball_type: activeBallType,
    shop_items: shopItems,
    attack_boost_until_ms: clampNonNegativeInt(rawSave.ax, 0, options),
    pokeballs: Object.values(ballInventory).reduce(
      (sum, value) => sum + clampNonNegativeInt(value, 0, options),
      0,
    ),
    tutorials,
    legacy_shiny_family_root_ids: sanitizePositiveIntArray(rawSave.ls, options),
    legacy_ultra_shiny_family_root_ids: sanitizePositiveIntArray(rawSave.lu, options),
    zone_flags: sanitizeStringArray(rawSave.zf),
    seen_dialogue_ids: sanitizeStringArray(rawSave.sd),
  };
}

function collectLegacyAppearanceSpeciesFromRecordEntries(entries, options = {}) {
  const shinySpeciesIds = [];
  const ultraShinySpeciesIds = [];
  for (const [rawId, rawRecord] of entries) {
    const pokemonId = clampNonNegativeInt(rawRecord?.id ?? rawId, 0, options);
    if (pokemonId <= 0) {
      continue;
    }
    if (clampNonNegativeInt(rawRecord?.captured_shiny, 0, options) > 0 && !shinySpeciesIds.includes(pokemonId)) {
      shinySpeciesIds.push(pokemonId);
    }
    if (clampNonNegativeInt(rawRecord?.captured_ultra_shiny, 0, options) > 0 && !ultraShinySpeciesIds.includes(pokemonId)) {
      ultraShinySpeciesIds.push(pokemonId);
    }
  }
  shinySpeciesIds.sort((a, b) => a - b);
  ultraShinySpeciesIds.sort((a, b) => a - b);
  return {
    shinySpeciesIds,
    ultraShinySpeciesIds,
  };
}

export function extractLegacyAppearanceSpecies(rawLegacySave, options = {}) {
  if (!rawLegacySave || typeof rawLegacySave !== "object") {
    return {
      shinySpeciesIds: [],
      ultraShinySpeciesIds: [],
    };
  }

  const pokemonEntities =
    rawLegacySave.pokemon_entities && typeof rawLegacySave.pokemon_entities === "object"
      ? Object.entries(rawLegacySave.pokemon_entities)
      : [];
  if (pokemonEntities.length > 0) {
    return collectLegacyAppearanceSpeciesFromRecordEntries(pokemonEntities, options);
  }

  const speciesStats =
    rawLegacySave.species_stats && typeof rawLegacySave.species_stats === "object"
      ? Object.entries(rawLegacySave.species_stats)
      : [];
  return collectLegacyAppearanceSpeciesFromRecordEntries(speciesStats, options);
}
