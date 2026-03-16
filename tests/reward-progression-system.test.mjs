import test from "node:test";
import assert from "node:assert/strict";

import { createRewardProgressionSystem } from "../systems/progression/reward-progression-system.js";

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function createFixture() {
  const state = {
    saveData: {
      money: 100,
      coins: 40,
      team: [1, 2],
      pokemon_entities: {
        1: { id: 1, level: 2, xp: 0, stats: { hp: 10 }, entity_unlocked: true },
        2: { id: 2, level: 1, xp: 0, stats: { hp: 8 }, entity_unlocked: true },
      },
    },
    pokemonDefsById: new Map([
      [1, { id: 1, nameFr: "Bulbizarre" }],
      [2, { id: 2, nameFr: "Salameche" }],
    ]),
    team: [{ id: 1, level: 12, talent: "rich" }, { id: 2, level: 8, talent: "none" }],
    battle: null,
  };

  const calls = {
    ensureMoneyAndItems: 0,
    enqueueEvolution: [],
    appearanceUnlockChecks: 0,
  };

  const system = createRewardProgressionSystem({
    state,
    ensureMoneyAndItems: () => {
      calls.ensureMoneyAndItems += 1;
    },
    toSafeInt,
    clamp,
    maxTeamSize: 6,
    enemyHpTeamScaleExponent: 1.5,
    enemyHpTeamScaleMaxBonus: 0.8,
    enemyRewardScaleExponent: 0.8,
    enemyRewardScaleBlend: 0.6,
    captureXpBase: 10,
    captureXpLevelMult: 2,
    captureXpStatFactor: 0.5,
    enemyMoneyBase: 4,
    enemyMoneyLevelMult: 1.2,
    enemyMoneyStatFactor: 0.25,
    maxLevel: 100,
    appearanceUnlockLevel: 3,
    getPokemonEntityRecord: (pokemonId) => state.saveData.pokemon_entities[String(pokemonId)] || null,
    getTalentMoneyMultiplier: (talentId) => (talentId === "rich" ? 1.35 : 1),
    getBaseStatTotal: (stats) => {
      const source = stats && typeof stats === "object" ? stats : {};
      return Object.values(source).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    },
    getXpToNextLevelForSpecies: () => 10,
    setEntityLevel: () => {},
    ensureSpeciesStats: (pokemonId) => {
      const key = String(pokemonId);
      if (!state.saveData.pokemon_entities[key]) {
        state.saveData.pokemon_entities[key] = { id: pokemonId, level: 1, xp: 0, stats: {}, entity_unlocked: true };
      }
      return state.saveData.pokemon_entities[key];
    },
    findNextEligibleEvolution: (record) => {
      if (Number(record?.id) === 1 && Number(record?.level) >= 3) {
        return {
          fromId: 1,
          toId: 3,
          fromDef: { nameFr: "Bulbizarre" },
          toDef: { nameFr: "Herbizarre" },
        };
      }
      return null;
    },
    enqueueEvolutionReadyNotification: (payload) => {
      calls.enqueueEvolution.push(payload);
      return 99;
    },
    getPokemonDisplayNameById: (pokemonId) => `Pokemon ${pokemonId}`,
    ensureAppearanceEditorUnlockedFromProgress: () => {
      calls.appearanceUnlockChecks += 1;
      return true;
    },
  });

  return { state, calls, system };
}

test("economy helpers mutate save resources and enforce spend guards", () => {
  const fixture = createFixture();

  fixture.system.addMoney(25.9);
  fixture.system.addCoins(10.4);
  assert.equal(fixture.state.saveData.money, 125);
  assert.equal(fixture.state.saveData.coins, 50);

  assert.equal(fixture.system.spendMoney(30), true);
  assert.equal(fixture.system.spendCoins(10), true);
  assert.equal(fixture.state.saveData.money, 95);
  assert.equal(fixture.state.saveData.coins, 40);

  assert.equal(fixture.system.spendMoney(9999), false);
  assert.equal(fixture.system.spendCoins(9999), false);
  assert.equal(fixture.calls.ensureMoneyAndItems, 6);
});

test("team-size and reward-scale helpers preserve balancing behavior", () => {
  const fixture = createFixture();

  assert.equal(fixture.system.getActiveTeamSizeForBalance(), 2);
  assert.equal(fixture.system.getEnemyHpTeamScaleMultiplier(6) > 1, true);
  assert.equal(fixture.system.getEnemyRewardScaleMultiplier(1.5, true) >= 1, true);

  fixture.state.battle = { team: [null, { id: 7 }, { id: 8 }] };
  assert.equal(fixture.system.getActiveTeamSizeForBalance(), 2);
});

test("level-diff multipliers match expected buckets", () => {
  const fixture = createFixture();

  assert.deepEqual(fixture.system.getRewardMultipliersFromLevelDiff(3), { xp: 1, money: 1, coin: 1 });
  assert.deepEqual(fixture.system.getRewardMultipliersFromLevelDiff(-6), { xp: 0.4, money: 0.65, coin: 0.55 });
  assert.equal(fixture.system.getXpMultiplierFromLevelDiff(-4), 0.9);
  assert.equal(fixture.system.getXpMultiplierFromLevelDiff(-17), 0.45);
  assert.equal(fixture.system.scaleRewardByMultiplier(40, 0.1, 6), 6);
});

test("reward formulas account for level, stats, shiny bonus and team talent", () => {
  const fixture = createFixture();
  const enemy = {
    level: 8,
    baseStats: { hp: 40, attack: 50 },
    balanceRewardMultiplier: 1.2,
    isShiny: true,
  };

  const captureXp = fixture.system.computeCaptureXpReward(enemy);
  const money = fixture.system.computeDefeatMoneyReward(enemy);
  const talentMoney = fixture.system.getTeamMoneyTalentMultiplier(fixture.state.team);

  assert.equal(captureXp > 8, true);
  assert.equal(money >= 4, true);
  assert.equal(talentMoney, 1.35);
});

test("awardCaptureXpToTeam applies per-member multipliers and queues evolution notifications", () => {
  const fixture = createFixture();

  const summary = fixture.system.awardCaptureXpToTeam(
    { level: 10, stats: { hp: 20 }, balanceRewardMultiplier: 1, isShiny: false },
    {
      reward: 20,
      rewardMultiplierResolver: ({ slotIndex }) => (slotIndex === 0 ? 1 : 0.5),
    },
  );

  assert.equal(summary.reward, 20);
  assert.equal(summary.xpGains.length, 2);
  assert.equal(summary.levelUps.length, 2);
  assert.equal(summary.evolutionReady.length, 1);
  assert.equal(summary.appearanceUnlockedNow, true);

  assert.equal(fixture.state.saveData.pokemon_entities["1"].level, 4);
  assert.equal(fixture.state.saveData.pokemon_entities["2"].level, 2);
  assert.equal(fixture.calls.enqueueEvolution.length, 1);
  assert.equal(fixture.calls.appearanceUnlockChecks, 1);
});
