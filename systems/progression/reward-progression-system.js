import {
  computeCaptureXpReward as computeCaptureXpRewardRule,
  computeDefeatMoneyReward as computeDefeatMoneyRewardRule,
  computeRewardMultipliersFromLevelDiff as computeRewardMultipliersFromLevelDiffRule,
  computeXpMultiplierFromLevelDiff as computeXpMultiplierFromLevelDiffRule,
  scaleRewardByMultiplier as computeScaledRewardByMultiplierRule,
} from "../../domain/progression/reward-rules.js";
import {
  computeEnemyHpTeamScaleMultiplier as computeEnemyHpTeamScaleMultiplierRule,
  computeEnemyRewardScaleMultiplier as computeEnemyRewardScaleMultiplierRule,
} from "../../domain/combat/balance-rules.js";

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function fallbackClamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, numeric));
}

export function createRewardProgressionSystem({
  state,
  ensureMoneyAndItems,
  toSafeInt,
  clamp,
  maxTeamSize,
  enemyHpTeamScaleExponent,
  enemyHpTeamScaleMaxBonus,
  enemyRewardScaleExponent,
  enemyRewardScaleBlend,
  captureXpBase,
  captureXpLevelMult,
  captureXpStatFactor,
  enemyMoneyBase,
  enemyMoneyLevelMult,
  enemyMoneyStatFactor,
  maxLevel,
  appearanceUnlockLevel,
  getPokemonEntityRecord,
  getTalentMoneyMultiplier,
  getBaseStatTotal,
  getXpToNextLevelForSpecies,
  setEntityLevel,
  ensureSpeciesStats,
  findNextEligibleEvolution,
  enqueueEvolutionReadyNotification,
  getPokemonDisplayNameById,
  ensureAppearanceEditorUnlockedFromProgress,
} = {}) {
  const ensureMoneyAndItemsFn = typeof ensureMoneyAndItems === "function" ? ensureMoneyAndItems : () => {};
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const clampFn = typeof clamp === "function" ? clamp : fallbackClamp;
  const maxTeamSizeValue = Math.max(1, toSafeIntFn(maxTeamSize, 6));
  const enemyHpScaleExponent = Math.max(0, Number(enemyHpTeamScaleExponent) || 0);
  const enemyHpScaleMaxBonus = Math.max(0, Number(enemyHpTeamScaleMaxBonus) || 0);
  const rewardScaleExponent = Math.max(0, Number(enemyRewardScaleExponent) || 0);
  const rewardScaleBlend = clampFn(Number(enemyRewardScaleBlend) || 0, 0, 1);
  const captureXpBaseValue = Math.max(0, Number(captureXpBase) || 0);
  const captureXpLevelMultValue = Math.max(0, Number(captureXpLevelMult) || 0);
  const captureXpStatFactorValue = Math.max(0, Number(captureXpStatFactor) || 0);
  const enemyMoneyBaseValue = Math.max(0, Number(enemyMoneyBase) || 0);
  const enemyMoneyLevelMultValue = Math.max(0, Number(enemyMoneyLevelMult) || 0);
  const enemyMoneyStatFactorValue = Math.max(0, Number(enemyMoneyStatFactor) || 0);
  const maxLevelValue = Math.max(1, toSafeIntFn(maxLevel, 100));
  const appearanceUnlockLevelValue = Math.max(1, toSafeIntFn(appearanceUnlockLevel, 12));
  const getPokemonEntityRecordFn =
    typeof getPokemonEntityRecord === "function" ? getPokemonEntityRecord : () => null;
  const getTalentMoneyMultiplierFn =
    typeof getTalentMoneyMultiplier === "function" ? getTalentMoneyMultiplier : () => 1;
  const getBaseStatTotalFn = typeof getBaseStatTotal === "function" ? getBaseStatTotal : () => 0;
  const getXpToNextLevelForSpeciesFn =
    typeof getXpToNextLevelForSpecies === "function" ? getXpToNextLevelForSpecies : () => 1;
  const setEntityLevelFn = typeof setEntityLevel === "function" ? setEntityLevel : () => {};
  const ensureSpeciesStatsFn = typeof ensureSpeciesStats === "function" ? ensureSpeciesStats : () => null;
  const findNextEligibleEvolutionFn =
    typeof findNextEligibleEvolution === "function" ? findNextEligibleEvolution : () => null;
  const enqueueEvolutionReadyNotificationFn =
    typeof enqueueEvolutionReadyNotification === "function" ? enqueueEvolutionReadyNotification : () => null;
  const getPokemonDisplayNameByIdFn =
    typeof getPokemonDisplayNameById === "function" ? getPokemonDisplayNameById : (pokemonId) => `Pokemon ${pokemonId}`;
  const ensureAppearanceEditorUnlockedFromProgressFn =
    typeof ensureAppearanceEditorUnlockedFromProgress === "function"
      ? ensureAppearanceEditorUnlockedFromProgress
      : () => false;

  function addMoney(amount) {
    if (!state.saveData) {
      return;
    }
    ensureMoneyAndItemsFn();
    state.saveData.money += Math.max(0, toSafeIntFn(amount, 0));
  }

  function addCoins(amount) {
    if (!state.saveData) {
      return;
    }
    ensureMoneyAndItemsFn();
    state.saveData.coins += Math.max(0, toSafeIntFn(amount, 0));
  }

  function spendMoney(amount) {
    if (!state.saveData) {
      return false;
    }
    ensureMoneyAndItemsFn();
    const cost = Math.max(0, toSafeIntFn(amount, 0));
    if (state.saveData.money < cost) {
      return false;
    }
    state.saveData.money -= cost;
    return true;
  }

  function spendCoins(amount) {
    if (!state.saveData) {
      return false;
    }
    ensureMoneyAndItemsFn();
    const cost = Math.max(0, toSafeIntFn(amount, 0));
    if (state.saveData.coins < cost) {
      return false;
    }
    state.saveData.coins -= cost;
    return true;
  }

  function getActiveTeamSizeForBalance() {
    const battleTeam = Array.isArray(state.battle?.team) ? state.battle.team : [];
    const battleCount = battleTeam.reduce((count, member) => (member ? count + 1 : count), 0);
    if (battleCount > 0) {
      return clampFn(battleCount, 1, maxTeamSizeValue);
    }

    const runtimeTeam = Array.isArray(state.team) ? state.team : [];
    const runtimeCount = runtimeTeam.reduce((count, member) => (member ? count + 1 : count), 0);
    if (runtimeCount > 0) {
      return clampFn(runtimeCount, 1, maxTeamSizeValue);
    }

    const saveTeam = Array.isArray(state.saveData?.team) ? state.saveData.team : [];
    const saveCount = saveTeam.reduce((count, id) => (Number(id) > 0 ? count + 1 : count), 0);
    return clampFn(saveCount, 1, maxTeamSizeValue);
  }

  function getEnemyHpTeamScaleMultiplier(teamSize = getActiveTeamSizeForBalance()) {
    return computeEnemyHpTeamScaleMultiplierRule({
      teamSize,
      maxTeamSize: maxTeamSizeValue,
      enemyHpScaleExponent,
      enemyHpScaleMaxBonus,
      toSafeInt: toSafeIntFn,
      clamp: clampFn,
    });
  }

  function getEnemyRewardScaleMultiplier(teamHpScaleMultiplier = 1, isOnlyOneEncounter = false) {
    return computeEnemyRewardScaleMultiplierRule({
      teamHpScaleMultiplier,
      rewardScaleExponent,
      rewardScaleBlend,
      isOnlyOneEncounter,
      onlyOneBonus: 1.18,
      clamp: clampFn,
    });
  }

  function getRewardMultipliersFromLevelDiff(levelDiff) {
    return computeRewardMultipliersFromLevelDiffRule(levelDiff, {
      toSafeInt: toSafeIntFn,
    });
  }

  function getXpMultiplierFromLevelDiff(levelDiff) {
    return computeXpMultiplierFromLevelDiffRule(levelDiff, {
      toSafeInt: toSafeIntFn,
    });
  }

  function scaleRewardByMultiplier(baseReward, multiplier, minimumIfPositive = 0) {
    return computeScaledRewardByMultiplierRule(baseReward, multiplier, {
      minimumIfPositive,
      toSafeInt: toSafeIntFn,
    });
  }

  function getHighestTeamLevelForRewardScaling() {
    const battleTeam = Array.isArray(state.battle?.team) ? state.battle.team : [];
    let highestLevel = 0;
    for (const member of battleTeam) {
      highestLevel = Math.max(highestLevel, Math.max(1, toSafeIntFn(member?.level, 1)));
    }
    if (highestLevel > 0) {
      return highestLevel;
    }

    const runtimeTeam = Array.isArray(state.team) ? state.team : [];
    for (const member of runtimeTeam) {
      highestLevel = Math.max(highestLevel, Math.max(1, toSafeIntFn(member?.level, 1)));
    }
    if (highestLevel > 0) {
      return highestLevel;
    }

    const saveTeam = Array.isArray(state.saveData?.team) ? state.saveData.team : [];
    for (const rawId of saveTeam) {
      const pokemonId = Number(rawId);
      if (pokemonId <= 0) {
        continue;
      }
      const record = getPokemonEntityRecordFn(pokemonId);
      highestLevel = Math.max(highestLevel, Math.max(1, toSafeIntFn(record?.level, 1)));
    }
    return Math.max(1, highestLevel);
  }

  function getTeamMoneyTalentMultiplier(teamMembers = state.team) {
    if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
      return 1;
    }
    let multiplier = 1;
    for (const member of teamMembers) {
      if (!member) {
        continue;
      }
      multiplier = Math.max(multiplier, getTalentMoneyMultiplierFn(member?.talent, member?.id));
    }
    return Math.max(1, multiplier);
  }

  function computeCaptureXpReward(enemy) {
    return computeCaptureXpRewardRule({
      enemy,
      captureXpBase: captureXpBaseValue,
      captureXpLevelMult: captureXpLevelMultValue,
      captureXpStatFactor: captureXpStatFactorValue,
      getBaseStatTotal: getBaseStatTotalFn,
      toSafeInt: toSafeIntFn,
    });
  }

  function computeDefeatMoneyReward(enemy) {
    return computeDefeatMoneyRewardRule({
      enemy,
      enemyMoneyBase: enemyMoneyBaseValue,
      enemyMoneyLevelMult: enemyMoneyLevelMultValue,
      enemyMoneyStatFactor: enemyMoneyStatFactorValue,
      getBaseStatTotal: getBaseStatTotalFn,
      toSafeInt: toSafeIntFn,
    });
  }

  function applyExperienceToEntity(record, amount) {
    if (!record || amount <= 0 || record.level >= maxLevelValue) {
      return { gainedLevels: 0, newLevel: record?.level || 1 };
    }
    record.xp = Math.max(0, toSafeIntFn(record.xp, 0));
    record.xp += Math.max(0, toSafeIntFn(amount, 0));

    let gainedLevels = 0;
    while (record.level < maxLevelValue) {
      const required = getXpToNextLevelForSpeciesFn(record.id, record.level, record.stats);
      if (required <= 0 || record.xp < required) {
        break;
      }
      record.xp -= required;
      record.level += 1;
      gainedLevels += 1;
      setEntityLevelFn(record, record.level);
    }

    if (record.level >= maxLevelValue) {
      record.level = maxLevelValue;
      record.xp = 0;
      setEntityLevelFn(record, maxLevelValue);
    }

    return { gainedLevels, newLevel: record.level };
  }

  function awardCaptureXpToTeam(enemy, options = {}) {
    if (!state.saveData || !Array.isArray(state.saveData.team) || state.saveData.team.length === 0) {
      return { reward: 0, levelUps: [], evolutionReady: [], xpGains: [] };
    }
    const overrideReward = Number(options.reward);
    const rewardMultiplierResolver =
      typeof options.rewardMultiplierResolver === "function" ? options.rewardMultiplierResolver : null;
    const reward = Number.isFinite(overrideReward)
      ? Math.max(0, toSafeIntFn(overrideReward, 0))
      : computeCaptureXpReward(enemy);
    const levelUps = [];
    const evolutionReady = [];
    const xpGains = [];
    let reachedAppearanceUnlockLevelNow = false;
    const teamSnapshot = state.saveData.team.slice(0, maxTeamSizeValue).map((id) => Number(id));

    for (let slotIndex = 0; slotIndex < teamSnapshot.length; slotIndex += 1) {
      const pokemonId = teamSnapshot[slotIndex];
      if (pokemonId <= 0) {
        continue;
      }
      const record = ensureSpeciesStatsFn(pokemonId);
      if (!record) {
        continue;
      }
      const def = state.pokemonDefsById.get(Number(pokemonId));
      const rewardMultiplier = rewardMultiplierResolver
        ? Math.max(0, Number(rewardMultiplierResolver({
            pokemonId,
            slotIndex,
            enemy,
            record,
            teamLevel: Math.max(1, toSafeIntFn(record?.level, 1)),
          })) || 0)
        : 1;
      const memberReward = scaleRewardByMultiplier(reward, rewardMultiplier, 1);
      const beforeLevel = record.level;
      const result = applyExperienceToEntity(record, memberReward);
      if (beforeLevel < appearanceUnlockLevelValue && record.level >= appearanceUnlockLevelValue) {
        reachedAppearanceUnlockLevelNow = true;
      }
      if (memberReward > 0) {
        xpGains.push({
          id: Number(pokemonId),
          slotIndex,
          nameFr: def?.nameFr || `Pokemon ${pokemonId}`,
          amount: memberReward,
          gainedLevels: Math.max(0, toSafeIntFn(result.gainedLevels, 0)),
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

      const evolutionCandidate = findNextEligibleEvolutionFn(record);
      if (!evolutionCandidate) {
        continue;
      }
      const fromNameFr = evolutionCandidate.fromDef?.nameFr || getPokemonDisplayNameByIdFn(evolutionCandidate.fromId);
      const toNameFr = evolutionCandidate.toDef?.nameFr || getPokemonDisplayNameByIdFn(evolutionCandidate.toId);
      const queuedId = enqueueEvolutionReadyNotificationFn({
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
      ? ensureAppearanceEditorUnlockedFromProgressFn()
      : false;
    return { reward, levelUps, evolutionReady, xpGains, appearanceUnlockedNow };
  }

  return {
    addMoney,
    addCoins,
    spendMoney,
    spendCoins,
    getActiveTeamSizeForBalance,
    getEnemyHpTeamScaleMultiplier,
    getEnemyRewardScaleMultiplier,
    getRewardMultipliersFromLevelDiff,
    getXpMultiplierFromLevelDiff,
    scaleRewardByMultiplier,
    getHighestTeamLevelForRewardScaling,
    getTeamMoneyTalentMultiplier,
    computeCaptureXpReward,
    computeDefeatMoneyReward,
    applyExperienceToEntity,
    awardCaptureXpToTeam,
  };
}
