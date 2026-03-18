export function createBattleLifecycleSystem({
  state,
  hydrateTeamFromSave,
  syncActiveEnemyAppearance,
  refreshLayoutIfNeeded,
  createBattleManager,
  getCurrentAttackIntervalMs,
  createRouteEnemyInstance,
  handleEnemySpawn,
  handleEnemyDefeated,
  getEnemyTimerConfigForBattle,
  handleEnemyTimerExpired,
  isCurrentRouteCombatEnabled,
  hideHoverPopup,
} = {}) {
  const hydrateTeamFromSaveFn = typeof hydrateTeamFromSave === "function" ? hydrateTeamFromSave : () => [];
  const syncActiveEnemyAppearanceFn =
    typeof syncActiveEnemyAppearance === "function" ? syncActiveEnemyAppearance : () => {};
  const refreshLayoutIfNeededFn = typeof refreshLayoutIfNeeded === "function" ? refreshLayoutIfNeeded : () => {};
  const createBattleManagerFn = typeof createBattleManager === "function" ? createBattleManager : () => null;
  const getCurrentAttackIntervalMsFn =
    typeof getCurrentAttackIntervalMs === "function" ? getCurrentAttackIntervalMs : () => 0;
  const createRouteEnemyInstanceFn =
    typeof createRouteEnemyInstance === "function" ? createRouteEnemyInstance : () => null;
  const handleEnemySpawnFn = typeof handleEnemySpawn === "function" ? handleEnemySpawn : () => {};
  const handleEnemyDefeatedFn = typeof handleEnemyDefeated === "function" ? handleEnemyDefeated : () => ({});
  const getEnemyTimerConfigForBattleFn =
    typeof getEnemyTimerConfigForBattle === "function"
      ? getEnemyTimerConfigForBattle
      : () => ({ enabled: false, durationMs: 0, style: "" });
  const handleEnemyTimerExpiredFn =
    typeof handleEnemyTimerExpired === "function" ? handleEnemyTimerExpired : () => {};
  const isCurrentRouteCombatEnabledFn =
    typeof isCurrentRouteCombatEnabled === "function" ? isCurrentRouteCombatEnabled : () => false;
  const hideHoverPopupFn = typeof hideHoverPopup === "function" ? hideHoverPopup : () => {};

  function rebuildTeamAndSyncBattle() {
    state.team = hydrateTeamFromSaveFn();
    if (state.battle && typeof state.battle.syncTeam === "function") {
      state.battle.syncTeam(state.team);
      syncActiveEnemyAppearanceFn();
    }
  }

  function startBattle() {
    refreshLayoutIfNeededFn({ force: true, nowMs: state.timeMs });
    if (!Array.isArray(state.team) || state.team.length <= 0 || !isCurrentRouteCombatEnabledFn()) {
      state.battle = null;
      state.enemy = null;
      return;
    }

    state.battle = createBattleManagerFn({
      team: state.team,
      attackIntervalMs: getCurrentAttackIntervalMsFn(),
      getAttackIntervalMs: () => getCurrentAttackIntervalMsFn(),
      createEnemy: createRouteEnemyInstanceFn,
      onEnemySpawn: handleEnemySpawnFn,
      onEnemyDefeated: handleEnemyDefeatedFn,
      getEnemyTimerConfig: (enemy) => getEnemyTimerConfigForBattleFn(enemy),
      onEnemyTimerExpired: handleEnemyTimerExpiredFn,
      canTeamAttack: () => isCurrentRouteCombatEnabledFn(),
    });
    state.enemy = typeof state.battle?.getEnemy === "function" ? state.battle.getEnemy() : null;
  }

  function syncBattleForRouteChange() {
    if (isCurrentRouteCombatEnabledFn()) {
      if (!state.battle) {
        startBattle();
      } else {
        if (typeof state.battle.resetTurnOrder === "function") {
          state.battle.resetTurnOrder(0, { resetAttackTimer: true });
        }
        if (typeof state.battle.spawnEnemy === "function") {
          state.battle.spawnEnemy();
        }
        state.enemy = typeof state.battle.getEnemy === "function" ? state.battle.getEnemy() : null;
      }
      return;
    }

    if (state.battle) {
      if (typeof state.battle.clearProjectiles === "function") {
        state.battle.clearProjectiles();
      }
      if (typeof state.battle.clearLasers === "function") {
        state.battle.clearLasers();
      }
      if (typeof state.battle.clearFloatingTexts === "function") {
        state.battle.clearFloatingTexts();
      }
      if (typeof state.battle.resetCombatVisualTweens === "function") {
        state.battle.resetCombatVisualTweens();
      }
      if (typeof state.battle.resetQueuedAttackState === "function") {
        state.battle.resetQueuedAttackState();
      }
      if (typeof state.battle.resetEnemyTimer === "function") {
        state.battle.resetEnemyTimer();
      }
    }
    state.battle = null;
    state.enemy = null;
    hideHoverPopupFn();
  }

  return {
    rebuildTeamAndSyncBattle,
    startBattle,
    syncBattleForRouteChange,
  };
}
