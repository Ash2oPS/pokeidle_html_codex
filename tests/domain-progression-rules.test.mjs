import test from "node:test";
import assert from "node:assert/strict";

import {
  computeCaptureXpReward,
  computeDefeatMoneyReward,
  computeRewardMultipliersFromLevelDiff,
  computeXpMultiplierFromLevelDiff,
  scaleRewardByMultiplier,
} from "../domain/progression/reward-rules.js";

test("progression domain multipliers keep expected level diff buckets", () => {
  assert.deepEqual(computeRewardMultipliersFromLevelDiff(3), { xp: 1, money: 1, coin: 1 });
  assert.deepEqual(computeRewardMultipliersFromLevelDiff(-3), { xp: 0.75, money: 0.9, coin: 0.85 });
  assert.deepEqual(computeRewardMultipliersFromLevelDiff(-10), { xp: 0.4, money: 0.65, coin: 0.55 });
  assert.deepEqual(computeRewardMultipliersFromLevelDiff(-22), { xp: 0.15, money: 0.35, coin: 0.25 });
  assert.deepEqual(computeRewardMultipliersFromLevelDiff(-90), { xp: 0.05, money: 0.35, coin: 0.1 });

  assert.equal(computeXpMultiplierFromLevelDiff(0), 1);
  assert.equal(computeXpMultiplierFromLevelDiff(-4), 0.9);
  assert.equal(computeXpMultiplierFromLevelDiff(-7), 0.7);
  assert.equal(computeXpMultiplierFromLevelDiff(-16), 0.45);
  assert.equal(computeXpMultiplierFromLevelDiff(-50), 0.1);
});

test("progression domain reward scaling enforces minimum on positive rewards", () => {
  assert.equal(scaleRewardByMultiplier(100, 0.5), 50);
  assert.equal(scaleRewardByMultiplier(3, 0.01, { minimumIfPositive: 1 }), 1);
  assert.equal(scaleRewardByMultiplier(0, 999, { minimumIfPositive: 2 }), 0);
});

test("progression domain formulas account for level, stats and shiny bonuses", () => {
  const enemy = {
    level: 32,
    baseStats: { hp: 80, atk: 85, def: 75, spa: 90, spd: 80, spe: 70 },
    balanceRewardMultiplier: 1.25,
    isShiny: true,
  };

  const getBaseStatTotal = (stats) =>
    Object.values(stats || {}).reduce((total, value) => total + Number(value || 0), 0);

  const xpReward = computeCaptureXpReward({
    enemy,
    captureXpBase: 16,
    captureXpLevelMult: 2.4,
    captureXpStatFactor: 0.09,
    getBaseStatTotal,
  });
  const moneyReward = computeDefeatMoneyReward({
    enemy,
    enemyMoneyBase: 12,
    enemyMoneyLevelMult: 1.9,
    enemyMoneyStatFactor: 0.05,
    getBaseStatTotal,
  });

  assert.equal(xpReward, 230);
  assert.equal(moneyReward, 194);
});
