function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function createPokemonCoreUtils({
  clamp,
  toSafeInt,
  state,
  statKeys,
  maxLevel,
  levelProgressionLinearPerStep,
  levelProgressionCurveExponent,
  levelProgressionCurvePerStep,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const keys = Array.isArray(statKeys) ? statKeys : [];

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

  function normalizeStatsPayload(stats) {
    const normalized = {};
    for (const key of keys) {
      normalized[key] = Math.max(1, safeToInt(stats?.[key], 1));
    }
    return normalized;
  }

  function getBaseStatTotal(stats) {
    const source = stats || {};
    return keys.reduce((sum, key) => sum + Math.max(1, Number(source[key] || 1)), 0);
  }

  function getLevelProgressionMultiplier(level) {
    const normalizedLevel = safeClamp(safeToInt(level, 1), 1, maxLevel);
    const step = normalizedLevel - 1;
    if (step <= 0) {
      return 1;
    }
    const linear = step * levelProgressionLinearPerStep;
    const curved = Math.pow(step, levelProgressionCurveExponent) * levelProgressionCurvePerStep;
    return 1 + linear + curved;
  }

  function computeStatsAtLevel(baseStats, level) {
    const normalizedLevel = safeClamp(safeToInt(level, 1), 1, maxLevel);
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
    const normalizedLevel = safeClamp(safeToInt(level, 1), 1, maxLevel);
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
    return safeClamp(0.84 + total / 520, 0.9, 1.58);
  }

  function getXpToNextLevelForSpecies(pokemonId, level, fallbackStats = null) {
    if (level >= maxLevel) {
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
      output[key] = Math.max(0, safeToInt(rawCounters?.[key], 0));
    }
    return output;
  }

  return {
    weightedPick,
    normalizeStatsPayload,
    getBaseStatTotal,
    getLevelProgressionMultiplier,
    computeStatsAtLevel,
    computeBattleHpMax,
    getPokemonBaseStats,
    getSpeciesGrowthFactor,
    getXpToNextLevelForSpecies,
    createEmptySpeciesStats,
    normalizeSpeciesCounters,
  };
}
