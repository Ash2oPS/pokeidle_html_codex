import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeHudSystem } from "../systems/ui/runtime-hud-system.js";

function createFixture() {
  const state = {
    saveData: null,
    ui: {
      shopTab: "pokeballs",
    },
    moneyHud: {
      initialized: false,
      targetValue: 0,
      displayValue: 0,
      lastRawValue: 0,
      pulseMs: 0,
    },
    lastHudAutoUpdateMs: 0,
  };

  const calls = {
    ensureMoneyAndItems: 0,
    moneyText: [],
    coinsText: [],
    moneyTransform: 0,
    walletPanels: [],
    backendIndicator: 0,
    routeUi: 0,
    gacha: 0,
    devPanel: 0,
    moneyFloaters: [],
  };

  let now = 1000;

  const system = createRuntimeHudSystem({
    state,
    ensureMoneyAndItems: () => {
      calls.ensureMoneyAndItems += 1;
    },
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    setMoneyCounterTextValue: (value) => {
      calls.moneyText.push(value);
    },
    setCoinsCounterTextValue: (value) => {
      calls.coinsText.push(value);
    },
    refreshMoneyCounterTransform: () => {
      calls.moneyTransform += 1;
    },
    refreshShopWalletPanel: (tab) => {
      calls.walletPanels.push(tab);
    },
    updateSaveBackendIndicator: () => {
      calls.backendIndicator += 1;
    },
    refreshRouteUi: () => {
      calls.routeUi += 1;
    },
    renderGachaModal: () => {
      calls.gacha += 1;
    },
    renderDevLayoutPanel: () => {
      calls.devPanel += 1;
    },
    spawnMoneyGainFloater: (value) => {
      calls.moneyFloaters.push(value);
    },
    moneyCounterPulseMs: 280,
    shopTabPokeballs: "pokeballs",
    nowMs: () => now,
  });

  return {
    state,
    calls,
    system,
    setNow(value) {
      now = Number(value);
    },
  };
}

test("updateHud resets HUD state when no save data is loaded", () => {
  const fixture = createFixture();
  fixture.state.moneyHud.initialized = true;
  fixture.state.moneyHud.targetValue = 120;

  fixture.system.updateHud();

  assert.equal(fixture.state.moneyHud.initialized, false);
  assert.equal(fixture.state.moneyHud.targetValue, 0);
  assert.equal(fixture.state.moneyHud.displayValue, 0);
  assert.equal(fixture.state.moneyHud.lastRawValue, 0);
  assert.equal(fixture.state.moneyHud.pulseMs, 0);
  assert.deepEqual(fixture.calls.moneyText, [0]);
  assert.deepEqual(fixture.calls.coinsText, [0]);
  assert.equal(fixture.calls.moneyTransform, 1);
  assert.deepEqual(fixture.calls.walletPanels, ["pokeballs"]);
  assert.equal(fixture.calls.backendIndicator, 1);
  assert.equal(fixture.calls.routeUi, 1);
  assert.equal(fixture.calls.gacha, 1);
  assert.equal(fixture.calls.devPanel, 1);
  assert.equal(fixture.state.lastHudAutoUpdateMs, 1000);
});

test("updateHud initializes money HUD snapshot from save data", () => {
  const fixture = createFixture();
  fixture.setNow(2050);
  fixture.state.saveData = {
    money: 42,
    coins: 7,
  };

  fixture.system.updateHud();

  assert.equal(fixture.calls.ensureMoneyAndItems, 1);
  assert.equal(fixture.state.moneyHud.initialized, true);
  assert.equal(fixture.state.moneyHud.targetValue, 42);
  assert.equal(fixture.state.moneyHud.displayValue, 42);
  assert.equal(fixture.state.moneyHud.lastRawValue, 42);
  assert.deepEqual(fixture.calls.moneyText, [42]);
  assert.deepEqual(fixture.calls.coinsText, [7]);
  assert.equal(fixture.calls.moneyTransform, 1);
  assert.deepEqual(fixture.calls.moneyFloaters, []);
  assert.equal(fixture.state.lastHudAutoUpdateMs, 2050);
});

test("updateHud emits money floater and pulse on positive money delta", () => {
  const fixture = createFixture();
  fixture.state.saveData = {
    money: 60,
    coins: 8,
  };
  fixture.state.moneyHud.initialized = true;
  fixture.state.moneyHud.lastRawValue = 40;
  fixture.state.moneyHud.targetValue = 40;
  fixture.state.moneyHud.displayValue = 40;
  fixture.setNow(3100);

  fixture.system.updateHud();

  assert.equal(fixture.state.moneyHud.targetValue, 60);
  assert.equal(fixture.state.moneyHud.lastRawValue, 60);
  assert.equal(fixture.state.moneyHud.pulseMs, 280);
  assert.deepEqual(fixture.calls.moneyFloaters, [20]);
  assert.deepEqual(fixture.calls.coinsText, [8]);
  assert.equal(fixture.calls.moneyText.length, 0);
  assert.equal(fixture.state.lastHudAutoUpdateMs, 3100);
});
