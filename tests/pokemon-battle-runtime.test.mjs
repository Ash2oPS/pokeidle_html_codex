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
