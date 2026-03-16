export function resolveEnemyTimerConfig({
  routeCombatEnabled = false,
  isOnlyOneEncounterEnemy = false,
  onlyOneEncounterTimerMs = 0,
  enemyTimerStyleOnlyOne = "only_one",
  enemyTimerStyleRoute = "route",
  routeUnlockProgressState = null,
} = {}) {
  if (!routeCombatEnabled) {
    return {
      enabled: false,
      durationMs: 0,
      style: enemyTimerStyleRoute,
    };
  }

  if (isOnlyOneEncounterEnemy) {
    return {
      enabled: true,
      durationMs: Math.max(0, Number(onlyOneEncounterTimerMs) || 0),
      style: enemyTimerStyleOnlyOne,
    };
  }

  return {
    enabled: Boolean(routeUnlockProgressState?.timerEnabled),
    durationMs: Math.max(0, Number(routeUnlockProgressState?.timerDurationMs) || 0),
    style: enemyTimerStyleRoute,
  };
}
