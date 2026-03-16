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

export function computeEnemyHpTeamScaleMultiplier({
  teamSize = 1,
  maxTeamSize = 6,
  enemyHpScaleExponent = 1,
  enemyHpScaleMaxBonus = 0,
  toSafeInt = fallbackToSafeInt,
  clamp = fallbackClamp,
} = {}) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const clampFn = typeof clamp === "function" ? clamp : fallbackClamp;
  const maxTeamSizeValue = Math.max(1, toSafeIntFn(maxTeamSize, 6));
  const normalizedTeamSize = clampFn(toSafeIntFn(teamSize, 1), 1, maxTeamSizeValue);
  const fillRatio = maxTeamSizeValue > 1 ? (normalizedTeamSize - 1) / (maxTeamSizeValue - 1) : 1;
  const bonus = Math.pow(fillRatio, Math.max(0, Number(enemyHpScaleExponent) || 0))
    * Math.max(0, Number(enemyHpScaleMaxBonus) || 0);
  return 1 + Math.max(0, bonus);
}

export function computeEnemyRewardScaleMultiplier({
  teamHpScaleMultiplier = 1,
  rewardScaleExponent = 1,
  rewardScaleBlend = 1,
  isOnlyOneEncounter = false,
  onlyOneBonus = 1.18,
  clamp = fallbackClamp,
} = {}) {
  const clampFn = typeof clamp === "function" ? clamp : fallbackClamp;
  const teamScale = Math.max(1, Number(teamHpScaleMultiplier) || 1);
  const easedTeamScale = Math.pow(teamScale, Math.max(0, Number(rewardScaleExponent) || 0));
  const blend = clampFn(Number(rewardScaleBlend) || 0, 0, 1);
  const blendedTeamScale = 1 + (easedTeamScale - 1) * blend;
  const onlyOneMultiplier = isOnlyOneEncounter ? Math.max(1, Number(onlyOneBonus) || 1) : 1;
  return Math.max(1, blendedTeamScale * onlyOneMultiplier);
}
