import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeCompositionRoot } from "../core/runtime-composition-root.js";

test("createRuntimeCompositionRoot wires extracted systems and exposes stable APIs", () => {
  const state = {
    timeMs: 0,
    saveData: null,
    team: [],
    battle: null,
    routeData: null,
    pokemonDefsById: new Map(),
    ui: { shopTab: "pokeballs" },
    moneyHud: {
      initialized: false,
      targetValue: 0,
      displayValue: 0,
      lastRawValue: 0,
      pulseMs: 0,
    },
    notifications: {
      items: [],
      dirty: false,
      nextId: 1,
    },
  };

  const composition = createRuntimeCompositionRoot({
    rewardProgressionDeps: {
      state,
      ensureMoneyAndItems: () => {},
      toSafeInt: (value, fallback = 0) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
      },
      clamp: (value, min, max) => Math.min(max, Math.max(min, Number(value))),
      maxTeamSize: 6,
      enemyHpTeamScaleExponent: 1.4,
      enemyHpTeamScaleMaxBonus: 0.8,
      enemyRewardScaleExponent: 0.9,
      enemyRewardScaleBlend: 0.5,
      captureXpBase: 10,
      captureXpLevelMult: 1.2,
      captureXpStatFactor: 0.1,
      enemyMoneyBase: 4,
      enemyMoneyLevelMult: 0.6,
      enemyMoneyStatFactor: 0.1,
      maxLevel: 100,
      appearanceUnlockLevel: 12,
      getPokemonEntityRecord: () => null,
      getTalentMoneyMultiplier: () => 1,
      getBaseStatTotal: () => 0,
      getXpToNextLevelForSpecies: () => 1,
      setEntityLevel: () => {},
      ensureSpeciesStats: () => null,
      findNextEligibleEvolution: () => null,
      enqueueEvolutionReadyNotification: () => null,
      getPokemonDisplayNameById: () => "Pokemon",
      ensureAppearanceEditorUnlockedFromProgress: () => false,
    },
    notificationDeps: {
      state,
      toSafeInt: (value, fallback = 0) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
      },
      normalizeUiDisplayText: (value) => String(value || ""),
      nextNotificationId: () => {
        const id = state.notifications.nextId;
        state.notifications.nextId += 1;
        return id;
      },
      renderNotificationStackUi: () => {},
    },
    routeEncounterCombatDeps: {
      state,
      toSafeInt: (value, fallback = 0) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
      },
      isCurrentRouteCombatEnabled: () => false,
    },
    battleLifecycleDeps: {
      state,
      hydrateTeamFromSave: () => [],
      isCurrentRouteCombatEnabled: () => false,
    },
    runtimeHudDeps: {
      state,
      toSafeInt: (value, fallback = 0) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
      },
      ensureMoneyAndItems: () => {},
      setMoneyCounterTextValue: () => {},
      setCoinsCounterTextValue: () => {},
      refreshMoneyCounterTransform: () => {},
      refreshShopWalletPanel: () => {},
      updateSaveBackendIndicator: () => {},
      refreshRouteUi: () => {},
      renderGachaModal: () => {},
      renderDevLayoutPanel: () => {},
      spawnMoneyGainFloater: () => {},
      moneyCounterPulseMs: 300,
      shopTabPokeballs: "pokeballs",
      nowMs: () => 123,
    },
  });

  assert.equal(typeof composition.rewardProgressionSystem.addMoney, "function");
  assert.equal(typeof composition.runtimeNotificationSystem.pushTemporaryNotification, "function");
  assert.equal(typeof composition.routeEncounterCombatSystem.createRouteEnemyInstance, "function");
  assert.equal(typeof composition.battleLifecycleSystem.startBattle, "function");
  assert.equal(typeof composition.runtimeHudSystem.updateHud, "function");

  composition.runtimeHudSystem.updateHud();
  assert.equal(state.lastHudAutoUpdateMs, 123);
  assert.equal(composition.rewardProgressionSystem.getRewardMultipliersFromLevelDiff(-6).money, 0.65);
});
