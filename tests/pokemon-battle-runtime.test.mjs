import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPokemonBattleRuntime } from "../systems/combat/pokemon-battle-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pokemonBattleManagerPath = path.resolve(__dirname, "../systems/combat/pokemon-battle-manager.js");

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

function createAttackDecision(overrides = {}) {
  return {
    action: "attack",
    reason: "test",
    passiveBehaviorId: "NONE",
    talentId: "NONE",
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
    defaultAttackMode: "projectile",
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

test("PokemonBattleManager no longer owns projectile sprite fabrication", () => {
  const source = fs.readFileSync(pokemonBattleManagerPath, "utf8");

  assert.doesNotMatch(source, /projectileSpriteCache/);
  assert.doesNotMatch(source, /drawProjectileGlyph/);
  assert.doesNotMatch(source, /createProjectileSprite/);
  assert.doesNotMatch(source, /getProjectileSprite/);
});

test("PokemonBattleManager keeps failed auto-captures in the capture sequence", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 20, isCritical: false }),
  });

  let captureOnCompleteCalls = 0;
  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    respawnDelayMs: 100,
    createEnemy,
    onEnemyDefeated: () => ({
      captured: false,
      capture_attempted: true,
      capture_ball_type: "hyper_ball",
      capture_chance_display: 0.42,
      capture_on_complete: () => {
        captureOnCompleteCalls += 1;
        return false;
      },
    }),
  });

  manager.enemy = {
    ...createEnemy(),
    hpCurrent: 1,
  };

  const applied = manager.applyLaserTick(0, state.layout, {
    forcedDecision: createAttackDecision(),
    forceImmediateResolution: true,
  });

  assert.equal(applied, true);
  assert.ok(manager.captureSequence);
  assert.equal(manager.captureSequence.captured, false);
  assert.equal(manager.captureSequence.ballType, "hyper_ball");
  assert.equal(manager.pendingRespawnMs, manager.captureSequence.totalMs);

  manager.update(manager.captureSequence.totalMs, state.layout);

  assert.equal(captureOnCompleteCalls, 1);
  assert.equal(manager.captureSequence, null);
  assert.equal(manager.enemy?.hpCurrent, 20);
});

test("PokemonBattleManager defaults to laser mode but preserves projectile overrides", () => {
  const runtime = createPokemonBattleRuntime({
    state: { timeMs: 0 },
    Tween: MockTween,
  });

  const manager = new runtime.PokemonBattleManager({
    team: [
      createAttacker(),
      createAttacker({
        id: 4,
        nameFr: "Salameche",
        offensiveType: "fire",
        defensiveTypes: ["fire"],
        attackMode: "projectile",
      }),
    ],
    attackIntervalMs: 420,
    createEnemy,
  });

  assert.equal(manager.resolveAttackModeForAttacker(0), "laser");
  assert.equal(manager.resolveAttackModeForAttacker(1), "projectile");
});

test("PokemonBattleManager normalizes plural projectile attack mode values from data", () => {
  const runtime = createPokemonBattleRuntime({
    state: { timeMs: 0 },
    Tween: MockTween,
  });

  const manager = new runtime.PokemonBattleManager({
    team: [
      createAttacker({
        attackMode: "projectiles",
      }),
    ],
    attackIntervalMs: 420,
    createEnemy,
  });

  assert.equal(manager.resolveAttackModeForAttacker(0), "projectile");
});

test("PokemonBattleManager lets morphing overrides copy and restore attack modes", () => {
  const state = { timeMs: 0, team: null };
  let morphCopiesSource = true;
  const morphBaseAttackMode = "projectile";
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    applyTeamTalentOverrides: (teamMembers) => {
      const morphingMember = teamMembers?.[0];
      if (!morphingMember) {
        return;
      }
      if (morphCopiesSource) {
        const source = teamMembers?.[1];
        morphingMember.attackMode = source?.attackMode || morphingMember.attackMode || morphBaseAttackMode;
        morphingMember.morphingSourceId = Number(source?.id || 0) || null;
        return;
      }
      morphingMember.attackMode = morphBaseAttackMode;
      morphingMember.morphingSourceId = null;
    },
  });

  const team = [
    createAttacker({
      id: 132,
      nameFr: "Metamorph",
      offensiveType: "normal",
      defensiveTypes: ["normal"],
      attackMode: morphBaseAttackMode,
    }),
    createAttacker({
      id: 1,
      nameFr: "Bulbizarre",
      attackMode: "laser",
    }),
  ];
  state.team = team;

  const manager = new runtime.PokemonBattleManager({
    team,
    attackIntervalMs: 420,
    createEnemy,
    defaultAttackMode: morphBaseAttackMode,
  });

  manager.syncTeam(team);
  assert.equal(manager.resolveAttackModeForAttacker(0), "laser");

  morphCopiesSource = false;
  manager.refreshPlacementDependentTalentOverrides();
  assert.equal(manager.resolveAttackModeForAttacker(0), "projectile");
});

test("PokemonBattleManager laser visuals anchor from ally center to enemy center", () => {
  const layout = createLayout();
  layout.centerX = 188;
  layout.centerY = 116;
  layout.enemyImpactX = 180;
  layout.enemyImpactY = 146;
  const state = { timeMs: 0, layout };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    createEnemy,
  });

  const laser = manager.updateLaserStateVisual(0, manager.team[0], layout, { attackType: "grass" });

  assert.equal(laser.sourceX, layout.teamSlots[0].x);
  assert.equal(laser.sourceY, layout.teamSlots[0].y);
  assert.equal(laser.targetX, layout.centerX);
  assert.equal(laser.targetY, layout.centerY);
  assert.ok(laser.visualSourceInsetPx > 0);
  assert.ok(laser.visualTargetInsetPx > 0);
});

test("PokemonBattleManager laser attacks tick every full interval without spawning projectiles", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 24, isCritical: false }),
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);

  assert.equal(manager.getLaserTickIntervalMs(), 420);
  assert.equal(manager.getProjectiles().length, 0);
  assert.equal(manager.getLasers().length, 1);

  const enemyHpBefore = manager.enemy.hpCurrent;
  const applied = manager.applyLaserTick(0, state.layout);

  assert.equal(applied, true);
  assert.equal(manager.enemy.hpCurrent, enemyHpBefore - 4);
  assert.equal(manager.getProjectiles().length, 0);
});

test("PokemonBattleManager laser ticks use per-tick +/-100ms jitter around attack interval", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const pendingRolls = [];
  const observedJitterRanges = [];
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    randomRange: (min, max) => {
      if (pendingRolls.length > 0) {
        observedJitterRanges.push([min, max]);
        return pendingRolls.shift();
      }
      return (Number(min) + Number(max)) * 0.5;
    },
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 800,
    createEnemy,
  });

  const laserState = manager.getLaserState(0);
  assert.equal(manager.getLaserTickIntervalMs(), 800);

  pendingRolls.push(700, 900);
  laserState.tickTimerMs = 0;
  manager.scheduleNextLaserTick(laserState);
  assert.equal(laserState.tickIntervalMs, 700);
  assert.equal(laserState.tickTimerMs, 700);

  laserState.tickTimerMs = -20;
  manager.scheduleNextLaserTick(laserState);
  assert.equal(laserState.tickIntervalMs, 900);
  assert.equal(laserState.tickTimerMs, 880);
  assert.deepEqual(observedJitterRanges, [
    [700, 900],
    [700, 900],
  ]);
});

test("PokemonBattleManager keeps jittered laser timers across refresh without clamping back to base", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 800,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);
  const laserState = manager.getLaserState(0);
  laserState.tickIntervalMs = 900;
  laserState.tickTimerMs = 880;

  manager.refreshLaserStates(state.layout);

  assert.equal(laserState.tickIntervalMs, 900);
  assert.equal(laserState.tickTimerMs, 880);
});

test("PokemonBattleManager exposes active laser states without cloning them every frame", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 24, isCritical: false }),
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);

  const lasers = manager.getLasers();
  assert.equal(manager.getActiveLaserCount(), 1);
  assert.equal(lasers.length, 1);
  assert.equal(lasers[0], manager.getLaserState(0));
});

test("PokemonBattleManager laser attacks accumulate fractional damage carry across ticks", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 5, isCritical: false }),
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);
  const enemyHpBefore = manager.enemy.hpCurrent;

  assert.equal(manager.applyLaserTick(0, state.layout), false);
  assert.equal(manager.enemy.hpCurrent, enemyHpBefore);
  assert.ok(Math.abs(manager.getLasers()[0].damageCarry - (5 / 6)) < 0.000001);

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.enemy.hpCurrent, enemyHpBefore - 1);
  assert.ok(Math.abs(manager.getLasers()[0].damageCarry - (4 / 6)) < 0.000001);

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.enemy.hpCurrent, enemyHpBefore - 2);
  assert.ok(Math.abs(manager.getLasers()[0].damageCarry - (3 / 6)) < 0.000001);
});

test("PokemonBattleManager laser hit resolution preserves attacker combat stats in snapshots", () => {
  const state = { timeMs: 0, layout: createLayout() };
  let observedAttacker = null;
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: (attacker) => {
      observedAttacker = attacker;
      return { damage: 72, isCritical: false };
    },
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [
      createAttacker({
        level: 37,
        stats: {
          hp: 120,
          attack: 84,
          defense: 63,
          "special-attack": 58,
          "special-defense": 61,
          speed: 72,
        },
      }),
    ],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);
  const enemyHpBefore = manager.enemy.hpCurrent;

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.enemy.hpCurrent, enemyHpBefore - 12);
  assert.equal(observedAttacker?.level, 37);
  assert.equal(observedAttacker?.stats?.attack, 84);
});

test("PokemonBattleManager laser ticks do not spawn floating damage texts while preserving hit visuals", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 24, isCritical: false }),
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.getFloatingTexts().length, 0);
  assert.equal(manager.getHitEffects().length > 0, true);

  manager.clearFloatingTexts();
  manager.hitEffects = [];
  manager.setEnemyDamageFlashMs(0);

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.getFloatingTexts().length, 0);
  assert.equal(manager.getHitEffects().length, 0);
  assert.equal(manager.getEnemyDamageFlashBlend(), 0);
});

test("PokemonBattleManager clears laser states when a new enemy spawns", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 5, isCritical: false }),
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [createAttacker()],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);
  manager.applyLaserTick(0, state.layout);
  assert.equal(manager.getLasers().length, 1);
  assert.ok(manager.getLasers()[0].damageCarry > 0);

  manager.spawnEnemy();

  assert.equal(manager.getLasers().length, 0);
  assert.equal(manager.getLaserState(0).damageCarry, 0);
});

test("PokemonBattleManager supports projectile and laser attackers in the same team", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 12, isCritical: false }),
    getProjectileTrailTypeVfxProfile: () => ({ spacingPx: 16 }),
    resolveCombatTurnDecision: () => createAttackDecision(),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [
      createAttacker({ attackMode: "projectile" }),
      createAttacker({
        id: 4,
        nameFr: "Salameche",
        offensiveType: "fire",
        defensiveTypes: ["fire"],
        attackMode: "laser",
      }),
    ],
    attackIntervalMs: 420,
    createEnemy,
    defaultAttackMode: "projectile",
  });

  manager.processAttackCadenceTick(state.layout);
  manager.processAttackCadenceTick(state.layout);

  assert.equal(manager.getProjectiles().length, 1);
  assert.equal(manager.getLasers().length, 1);
  assert.equal(manager.getLasers()[0].attackerNameFr, "Salameche");
});

test("PokemonBattleManager gates laser mind control follow-ups to cadence instead of every tick", () => {
  const state = { timeMs: 0, layout: createLayout() };
  const runtime = createPokemonBattleRuntime({
    state,
    Tween: MockTween,
    computeDamage: () => ({ damage: 12, isCritical: false }),
    resolveCombatTurnDecision: ({ attacker }) => (
      attacker?.id === 1
        ? createAttackDecision({ talentId: "MIND_CONTROL" })
        : createAttackDecision()
    ),
  });

  const manager = new runtime.PokemonBattleManager({
    team: [
      createAttacker(),
      createAttacker({
        id: 4,
        nameFr: "Salameche",
        offensiveType: "fire",
        defensiveTypes: ["fire"],
      }),
    ],
    attackIntervalMs: 420,
    createEnemy,
  });

  manager.processAttackCadenceTick(state.layout);

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.enemy.hpCurrent, 16);

  assert.equal(manager.applyLaserTick(0, state.layout), true);
  assert.equal(manager.enemy.hpCurrent, 14);
});
