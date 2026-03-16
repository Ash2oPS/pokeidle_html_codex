import test from "node:test";
import assert from "node:assert/strict";

import { createBattleLifecycleSystem } from "../systems/combat/battle-lifecycle-system.js";

function createFixture() {
  const state = {
    team: [{ id: 1 }],
    battle: null,
    enemy: null,
    timeMs: 4321,
  };

  const calls = {
    syncActiveEnemyAppearance: 0,
    refreshLayout: [],
    createBattleManager: 0,
    createBattleManagerOptions: null,
    hideHoverPopup: 0,
    clearProjectiles: 0,
    clearFloatingTexts: 0,
    resetCombatVisualTweens: 0,
    resetQueuedAttackState: 0,
    resetEnemyTimer: 0,
    resetTurnOrder: [],
    spawnEnemy: 0,
    syncTeam: [],
    attackIntervalMs: 880,
  };

  let routeCombatEnabled = true;

  const battleManagerInstance = {
    getEnemy: () => ({ id: 9001 }),
  };

  const system = createBattleLifecycleSystem({
    state,
    hydrateTeamFromSave: () => [{ id: 7 }, { id: 25 }],
    syncActiveEnemyAppearance: () => {
      calls.syncActiveEnemyAppearance += 1;
    },
    refreshLayoutIfNeeded: (options) => {
      calls.refreshLayout.push(options);
    },
    createBattleManager: (options) => {
      calls.createBattleManager += 1;
      calls.createBattleManagerOptions = options;
      return battleManagerInstance;
    },
    getCurrentAttackIntervalMs: () => calls.attackIntervalMs,
    createRouteEnemyInstance: () => ({ id: 700 }),
    handleEnemySpawn: () => {},
    handleEnemyDefeated: () => ({ captured: false }),
    getEnemyTimerConfigForBattle: () => ({ enabled: true, durationMs: 18000, style: "route" }),
    handleEnemyTimerExpired: () => {},
    isCurrentRouteCombatEnabled: () => routeCombatEnabled,
    hideHoverPopup: () => {
      calls.hideHoverPopup += 1;
    },
  });

  return {
    state,
    calls,
    system,
    battleManagerInstance,
    setRouteCombatEnabled(nextValue) {
      routeCombatEnabled = Boolean(nextValue);
    },
  };
}

test("rebuildTeamAndSyncBattle refreshes team and battle sync when active", () => {
  const fixture = createFixture();
  fixture.state.battle = {
    syncTeam: (team) => {
      fixture.calls.syncTeam.push(team);
    },
  };

  fixture.system.rebuildTeamAndSyncBattle();

  assert.deepEqual(fixture.state.team, [{ id: 7 }, { id: 25 }]);
  assert.equal(fixture.calls.syncTeam.length, 1);
  assert.deepEqual(fixture.calls.syncTeam[0], [{ id: 7 }, { id: 25 }]);
  assert.equal(fixture.calls.syncActiveEnemyAppearance, 1);
});

test("rebuildTeamAndSyncBattle does not sync appearance when no battle exists", () => {
  const fixture = createFixture();

  fixture.system.rebuildTeamAndSyncBattle();

  assert.deepEqual(fixture.state.team, [{ id: 7 }, { id: 25 }]);
  assert.equal(fixture.calls.syncActiveEnemyAppearance, 0);
});

test("startBattle clears battle state when team is empty", () => {
  const fixture = createFixture();
  fixture.state.team = [];
  fixture.state.battle = { stale: true };
  fixture.state.enemy = { stale: true };

  fixture.system.startBattle();

  assert.equal(fixture.calls.refreshLayout.length, 1);
  assert.deepEqual(fixture.calls.refreshLayout[0], {
    force: true,
    nowMs: 4321,
  });
  assert.equal(fixture.state.battle, null);
  assert.equal(fixture.state.enemy, null);
  assert.equal(fixture.calls.createBattleManager, 0);
});

test("startBattle creates battle manager with delegated callbacks", () => {
  const fixture = createFixture();

  fixture.system.startBattle();

  assert.equal(fixture.calls.createBattleManager, 1);
  assert.equal(fixture.state.battle, fixture.battleManagerInstance);
  assert.deepEqual(fixture.state.enemy, { id: 9001 });
  assert.equal(fixture.calls.createBattleManagerOptions.attackIntervalMs, 880);
  fixture.calls.attackIntervalMs = 910;
  assert.equal(fixture.calls.createBattleManagerOptions.getAttackIntervalMs(), 910);
  assert.equal(typeof fixture.calls.createBattleManagerOptions.createEnemy, "function");
  assert.equal(typeof fixture.calls.createBattleManagerOptions.onEnemySpawn, "function");
  assert.equal(typeof fixture.calls.createBattleManagerOptions.onEnemyDefeated, "function");
  assert.equal(typeof fixture.calls.createBattleManagerOptions.getEnemyTimerConfig, "function");
  assert.equal(typeof fixture.calls.createBattleManagerOptions.onEnemyTimerExpired, "function");
  assert.equal(typeof fixture.calls.createBattleManagerOptions.canTeamAttack, "function");
  assert.equal(fixture.calls.createBattleManagerOptions.canTeamAttack(), true);
});

test("syncBattleForRouteChange starts battle when entering a combat-enabled route", () => {
  const fixture = createFixture();
  fixture.state.battle = null;
  fixture.state.enemy = null;
  fixture.setRouteCombatEnabled(true);

  fixture.system.syncBattleForRouteChange();

  assert.equal(fixture.calls.createBattleManager, 1);
  assert.deepEqual(fixture.state.enemy, { id: 9001 });
});

test("syncBattleForRouteChange respawns enemy when battle already exists", () => {
  const fixture = createFixture();
  fixture.state.battle = {
    resetTurnOrder: (...args) => {
      fixture.calls.resetTurnOrder.push(args);
    },
    spawnEnemy: () => {
      fixture.calls.spawnEnemy += 1;
    },
    getEnemy: () => ({ id: 55 }),
  };
  fixture.setRouteCombatEnabled(true);

  fixture.system.syncBattleForRouteChange();

  assert.equal(fixture.calls.createBattleManager, 0);
  assert.equal(fixture.calls.resetTurnOrder.length, 1);
  assert.deepEqual(fixture.calls.resetTurnOrder[0], [0, { resetAttackTimer: true }]);
  assert.equal(fixture.calls.spawnEnemy, 1);
  assert.deepEqual(fixture.state.enemy, { id: 55 });
  assert.equal(fixture.calls.hideHoverPopup, 0);
});

test("syncBattleForRouteChange clears battle artifacts on non-combat routes", () => {
  const fixture = createFixture();
  fixture.state.battle = {
    clearProjectiles: () => {
      fixture.calls.clearProjectiles += 1;
    },
    clearFloatingTexts: () => {
      fixture.calls.clearFloatingTexts += 1;
    },
    resetCombatVisualTweens: () => {
      fixture.calls.resetCombatVisualTweens += 1;
    },
    resetQueuedAttackState: () => {
      fixture.calls.resetQueuedAttackState += 1;
    },
    resetEnemyTimer: () => {
      fixture.calls.resetEnemyTimer += 1;
    },
  };
  fixture.state.enemy = { id: 333 };
  fixture.setRouteCombatEnabled(false);

  fixture.system.syncBattleForRouteChange();

  assert.equal(fixture.calls.clearProjectiles, 1);
  assert.equal(fixture.calls.clearFloatingTexts, 1);
  assert.equal(fixture.calls.resetCombatVisualTweens, 1);
  assert.equal(fixture.calls.resetQueuedAttackState, 1);
  assert.equal(fixture.calls.resetEnemyTimer, 1);
  assert.equal(fixture.state.battle, null);
  assert.equal(fixture.state.enemy, null);
  assert.equal(fixture.calls.hideHoverPopup, 1);
});
