import test from "node:test";
import assert from "node:assert/strict";

import { createPokemonBattleRuntime } from "../systems/combat/pokemon-battle-manager.js";

class MockTween {
  constructor(target, group) {
    this.target = target;
    this.group = group;
    this.onCompleteCallback = null;
  }

  to() {
    return this;
  }

  easing() {
    return this;
  }

  onComplete(callback) {
    this.onCompleteCallback = callback;
    return this;
  }

  start() {
    return this;
  }

  stop() {
    return this;
  }
}

function createEnemy() {
  return {
    id: 19,
    nameFr: "Rattata",
    hpMax: 20,
    hpCurrent: 20,
    defensiveTypes: ["normal"],
  };
}

function createLayout() {
  return {
    centerX: 100,
    centerY: 100,
    enemyImpactX: 100,
    enemyImpactY: 100,
    teamSlots: Array.from({ length: 6 }, (_, index) => ({
      x: 24 + index * 16,
      y: 72,
      size: 32,
    })),
  };
}

function createAttacker(overrides = {}) {
  return {
    id: 1,
    nameFr: "Bulbizarre",
    offensiveType: "grass",
    defensiveTypes: ["grass"],
    talent: null,
    ...overrides,
  };
}

test("PokemonBattleManager recoil tween uses provided tween group", () => {
  const state = { timeMs: 0 };
  const tweenGroupToken = { tag: "group" };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    tweenGroup: tweenGroupToken,
  });

  const manager = new runtime.PokemonBattleManager({
    team: [{ id: 1 }],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.triggerSlotRecoil(0);

  assert.ok(manager.slotRecoil[0]);
  assert.equal(manager.slotRecoil[0].tween.group, tweenGroupToken);
});

test("PokemonBattleManager recoil tween does not crash without tween group/easing deps", () => {
  const state = { timeMs: 0 };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
  });

  const manager = new runtime.PokemonBattleManager({
    team: [{ id: 4 }],
    attackIntervalMs: 420,
    createEnemy,
  });

  assert.doesNotThrow(() => {
    manager.triggerSlotRecoil(0);
    manager.triggerSlotAttackFlash(0);
  });
});

test("PokemonBattleManager keeps attack cadence running through non-capture respawn", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 20, isCritical: false }),
    getProjectileTrailTypeVfxProfile: () => ({ spacingPx: 16 }),
    resolveCombatTurnDecision: () => ({
      action: "attack",
      reason: "test",
      passiveBehaviorId: "NONE",
      talentId: "NONE",
    }),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    respawnDelayMs: 100,
    createEnemy,
    onEnemyDefeated: () => ({ captured: false, capture_attempted: false }),
  });

  manager.attackTimerMs = 150;
  manager.enemy = {
    ...createEnemy(),
    hpCurrent: 0,
  };
  manager.pendingRespawnMs = 100;
  manager.captureSequence = null;

  manager.update(60, state.layout);
  assert.equal(manager.attackTimerMs, 90);
  assert.equal(manager.pendingRespawnMs, 40);

  manager.update(60, state.layout);
  assert.equal(manager.attackTimerMs, 30);
  assert.equal(manager.pendingRespawnMs, 0);
  assert.equal(manager.enemy?.hpCurrent, 20);

  manager.update(40, state.layout);
  assert.equal(manager.getProjectiles().length, 1);
});

test("PokemonBattleManager pauses attack cadence during capture sequence", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    respawnDelayMs: 100,
    createEnemy,
  });

  manager.attackTimerMs = 150;
  manager.enemy = {
    ...createEnemy(),
    hpCurrent: 0,
  };
  manager.pendingRespawnMs = 100;
  manager.captureSequence = {
    captured: false,
    isCritical: false,
    ballType: "poke_ball",
    chanceDisplay: null,
    onComplete: null,
    onCompleteExecuted: false,
    elapsedMs: 0,
    totalMs: 200,
    targetX: 100,
    targetY: 100,
    startX: 120,
    startY: 120,
    burstSpawned: false,
    breakSpawned: false,
    particles: [],
  };

  manager.update(60, state.layout);
  assert.equal(manager.attackTimerMs, 150);
  assert.equal(manager.pendingRespawnMs, 40);
});
