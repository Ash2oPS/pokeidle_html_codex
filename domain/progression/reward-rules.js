function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function computeRewardMultipliersFromLevelDiff(levelDiff, { toSafeInt = fallbackToSafeInt } = {}) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const diff = toSafeIntFn(levelDiff, 0);
  if (diff >= 0) {
    return { xp: 1, money: 1, coin: 1 };
  }
  if (diff >= -5) {
    return { xp: 0.75, money: 0.9, coin: 0.85 };
  }
  if (diff >= -15) {
    return { xp: 0.4, money: 0.65, coin: 0.55 };
  }
  if (diff >= -30) {
    return { xp: 0.15, money: 0.35, coin: 0.25 };
  }
  return { xp: 0.05, money: 0.35, coin: 0.1 };
}

export function computeXpMultiplierFromLevelDiff(levelDiff, { toSafeInt = fallbackToSafeInt } = {}) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const diff = toSafeIntFn(levelDiff, 0);
  if (diff >= 0) {
    return 1;
  }
  if (diff >= -5) {
    return 0.9;
  }
  if (diff >= -10) {
    return 0.7;
  }
  if (diff >= -20) {
    return 0.45;
  }
  return 0.1;
}

export function scaleRewardByMultiplier(
  baseReward,
  multiplier,
  { minimumIfPositive = 0, toSafeInt = fallbackToSafeInt } = {},
) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const reward = Math.max(0, toSafeIntFn(baseReward, 0));
  if (reward <= 0) {
    return 0;
  }
  const scaled = Math.floor(reward * Math.max(0, Number(multiplier) || 0));
  const minimum = Math.max(0, toSafeIntFn(minimumIfPositive, 0));
  return Math.max(minimum, scaled);
}

export function computeCaptureXpReward({
  enemy,
  captureXpBase = 0,
  captureXpLevelMult = 0,
  captureXpStatFactor = 0,
  getBaseStatTotal = () => 0,
  toSafeInt = fallbackToSafeInt,
} = {}) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const getBaseStatTotalFn = typeof getBaseStatTotal === "function" ? getBaseStatTotal : () => 0;
  const enemyLevel = Math.max(1, toSafeIntFn(enemy?.level, 1));
  const baseStatTotal = getBaseStatTotalFn(enemy?.baseStats || enemy?.stats);
  const rewardScale = Math.max(1, Number(enemy?.balanceRewardMultiplier || 1));
  const baseReward =
    Math.max(0, Number(captureXpBase) || 0)
    + enemyLevel * Math.max(0, Number(captureXpLevelMult) || 0)
    + baseStatTotal * Math.max(0, Number(captureXpStatFactor) || 0);
  const shinyMultiplier = enemy?.isShiny ? 1.35 : 1;
  return Math.max(8, Math.round(baseReward * rewardScale * shinyMultiplier));
}

export function computeDefeatMoneyReward({
  enemy,
  enemyMoneyBase = 0,
  enemyMoneyLevelMult = 0,
  enemyMoneyStatFactor = 0,
  getBaseStatTotal = () => 0,
  toSafeInt = fallbackToSafeInt,
} = {}) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const getBaseStatTotalFn = typeof getBaseStatTotal === "function" ? getBaseStatTotal : () => 0;
  const enemyLevel = Math.max(1, toSafeIntFn(enemy?.level, 1));
  const baseStatTotal = getBaseStatTotalFn(enemy?.baseStats || enemy?.stats);
  const rewardScale = Math.max(1, Number(enemy?.balanceRewardMultiplier || 1));
  const baseReward =
    Math.max(0, Number(enemyMoneyBase) || 0)
    + enemyLevel * Math.max(0, Number(enemyMoneyLevelMult) || 0)
    + baseStatTotal * Math.max(0, Number(enemyMoneyStatFactor) || 0);
  const shinyMultiplier = enemy?.isShiny ? 1.6 : 1;
  return Math.max(4, Math.round(baseReward * rewardScale * shinyMultiplier));
}
