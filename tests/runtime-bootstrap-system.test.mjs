import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeBootstrapSystem } from "../core/runtime-bootstrap-system.js";

const originalHTMLElement = globalThis.HTMLElement;
if (typeof globalThis.HTMLElement !== "function") {
  globalThis.HTMLElement = class HTMLElement {};
}
test.after(() => {
  if (typeof originalHTMLElement === "function") {
    globalThis.HTMLElement = originalHTMLElement;
    return;
  }
  delete globalThis.HTMLElement;
});

function createClassList(hidden = false) {
  const classes = new Set(hidden ? ["hidden"] : []);
  return {
    add(...tokens) {
      for (const token of tokens) {
        classes.add(token);
      }
    },
    remove(...tokens) {
      for (const token of tokens) {
        classes.delete(token);
      }
    },
    contains(token) {
      return classes.has(token);
    },
  };
}

function createTestDocument({ importText = null, downloads = [] } = {}) {
  const bodyChildren = [];
  return {
    hidden: false,
    body: {
      appendChild(element) {
        bodyChildren.push(element);
        return element;
      },
    },
    createElement(tagName) {
      const tag = String(tagName || "div").toLowerCase();
      const element = {
        tagName: tag.toUpperCase(),
        style: {},
        classList: createClassList(tag === "input"),
        files: null,
        value: "",
        type: "",
        accept: "",
        tabIndex: 0,
        rel: "",
        href: "",
        download: "",
        onchange: null,
        setAttribute(name, value) {
          this[name] = value;
        },
        remove() {},
      };
      element.click = () => {
        if (tag === "a") {
          downloads.push({
            href: element.href,
            download: element.download,
          });
          return;
        }
        if (tag === "input") {
          element.files = importText == null
            ? []
            : [{
              async text() {
                return importText;
              },
            }];
          element.onchange?.();
        }
      };
      return element;
    },
  };
}

function createBootstrapState(saveData) {
  return {
    mode: "ready",
    error: "",
    timeMs: 0,
    realClockLastMs: 0,
    saveData,
    saveBackend: {
      pendingSerializedSave: "pending-browser",
      pendingDesktopSerializedSave: "pending-desktop",
      retryTimerId: 0,
      desktopRetryTimerId: 0,
    },
    team: Array.isArray(saveData?.team) ? saveData.team.filter(Boolean) : [],
    enemy: null,
    battle: null,
    pendingSimMs: 0,
    deferredSaveDirty: false,
    teamLevelUpEffects: [],
    teamXpGainEffects: [],
    teamXpPulseMsBySlot: {},
    xpHud: {
      teamXpBySlot: {},
      enemyHpKey: null,
      enemyHpFrontRatio: 1,
      enemyHpLagRatio: 1,
    },
    moneyHud: {
      initialized: false,
      targetValue: 0,
      displayValue: 0,
      lastRawValue: 0,
      pulseMs: 0,
    },
    evolutionAnimation: {
      current: null,
      queue: [],
    },
    tutorial: {
      queue: [],
      active: null,
    },
    ui: {
      tutorialOpen: false,
      shopTab: "pokeballs",
      shopQuantityMode: "1",
      shopCustomQuantity: 1,
    },
    environment: {
      nextUpdateAtMs: 0,
    },
    gacha: {
      spinning: false,
      lastReward: null,
      lastRewards: [],
    },
    notifications: {
      items: [],
    },
    routeCatalog: new Map(),
    routeBackgroundsById: new Map(),
    pokemonDefsById: new Map(),
    pokedexSpeciesCsvByPokemonId: new Map(),
    typeIconImages: new Map(),
  };
}

function createFixture(options = {}) {
  const downloads = [];
  const createdBlobs = [];
  const alerts = [];
  const topMessages = [];
  const removedKeys = [];
  const legacyDeletes = [];
  const persistedSnapshots = [];
  const state = createBootstrapState(options.initialSaveData || {
    version: 7,
    marker: "current",
    starter_chosen: true,
    team: [25],
    pokeballs: {},
  });

  const document = createTestDocument({
    importText: options.importText ?? null,
    downloads,
  });
  const windowObject = {
    confirm: () => options.confirm !== false,
    alert: (message) => {
      alerts.push(String(message || ""));
    },
    requestAnimationFrame: (callback) => {
      callback();
      return 1;
    },
    setTimeout: (callback) => {
      callback();
      return 1;
    },
    clearTimeout() {},
    URL: {
      createObjectURL(blob) {
        createdBlobs.push(blob);
        return `blob:${createdBlobs.length}`;
      },
      revokeObjectURL() {},
    },
  };

  const system = createRuntimeBootstrapSystem({
    state,
    document,
    window: windowObject,
    tutorialModalEl: { classList: createClassList(true) },
    saveBackendValueEl: { textContent: "" },
    SAVE_KEY: "pokeidle_save_v4c",
    SHOP_TAB_POKEBALLS: "pokeballs",
    SHOP_TAB_COMBAT: "combat",
    SHOP_TAB_EVOLUTIONS: "evolutions",
    BALL_INVENTORY_MAX_PER_TYPE: 999,
    ROUTE_ID_ORDER: ["kanto_route_1"],
    DEFAULT_ROUTE_ID: "kanto_route_1",
    HIDDEN_SIM_BUDGET_MS: 16,
    ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS: 0,
    showLoadingScreen: () => {},
    hideLoadingScreen: () => {},
    render: () => {},
    updateEnvironment: () => {},
    getPokemonLoadTargets: () => [],
    initializeWindowsNotificationSystem: async () => {},
    resetNotificationSystem: () => {},
    clearMoneyGainFloaters: () => {},
    setBallConfigState: () => {},
    setShopItemConfigState: () => {},
    setZoneEncounterCsvState: () => {},
    setPokemonTalentCsvState: () => {},
    stopBackgroundTicker: () => {},
    clearTeamDragState: () => {},
    closeTeamContextMenu: () => {},
    clearCanvasHoverState: () => {},
    closeRenameModal: () => {},
    closeBoxesModal: () => {},
    closePokedexModal: () => {},
    closeAppearanceModal: () => {},
    closeGachaModal: () => {},
    setMapOpen: () => {},
    setShopOpen: () => {},
    loadBallConfigCsv: async () => null,
    loadShopItemConfigCsv: async () => null,
    loadZoneEncounterCsv: async () => null,
    loadPokemonTalentCsv: async () => null,
    loadSaveData: async () => state.saveData,
    loadRouteCatalog: async () => new Map([["kanto_route_1", { id: "kanto_route_1" }]]),
    refreshOrderedCatalogRouteIds: () => {},
    ensureUnlockedRoutesForCurrentCatalog: () => ["kanto_route_1"],
    getInitialAssetRouteIds: () => [],
    getRouteDataByIds: () => [],
    reconcileEntityUnlockStates: () => false,
    reconcileEntityAppearanceStates: () => false,
    repairRuntimeSaveAfterDefinitionsLoaded: () => ({
      changed: false,
      recoveredTeam: false,
      hardResetApplied: false,
    }),
    getTutorialProgress: () => ({}),
    ensureAppearanceEditorUnlockedFromProgress: () => false,
    preloadRouteBackgrounds: async () => new Map(),
    preloadTypeIcons: async () => new Map(),
    preloadSelectedAppearanceAssetsForTeam: async () => null,
    setActiveRoute: () => true,
    ensureMoneyAndItems: () => {},
    syncWindowsPokeballInventoryTracking: () => {},
    rebuildTeamAndSyncBattle: () => {
      state.team = Array.isArray(state.saveData?.team) ? state.saveData.team.filter(Boolean) : [];
    },
    persistSaveData: () => {
      persistedSnapshots.push(JSON.parse(JSON.stringify(state.saveData || null)));
    },
    queueOfflineCatchupFromSave: () => 0,
    renderStarterChoices: () => {},
    updateHud: () => {},
    showStarterModal: () => {},
    hideStarterModal: () => {},
    setTopMessage: (message) => {
      topMessages.push(String(message || ""));
    },
    startBattle: () => {
      state.battle = {};
    },
    queueDeferredRouteAssetWarmup: () => {},
    queueAppearanceTutorialIfNeeded: () => {},
    tryOpenPendingTutorialFlow: () => {},
    consumePendingSimulation: () => 0,
    refreshLayoutIfNeeded: () => {},
    ensureBackgroundTicker: () => {},
    clearBrowserSaveRetry: () => {
      state.saveBackend.retryTimerId = 0;
    },
    clearDesktopSaveRetry: () => {
      state.saveBackend.desktopRetryTimerId = 0;
    },
    removeSaveDataFromStorageKey: (areaName, key) => {
      removedKeys.push(`${areaName}:${key}`);
      return true;
    },
    deleteSaveDataFromIndexedDb: async () => {
      legacyDeletes.push("current-indexeddb");
      return true;
    },
    deleteSaveDataFromDesktopBridge: async () => {
      legacyDeletes.push("current-desktop");
      return true;
    },
    removeLegacySaveDataFromLocalStorage: () => {
      legacyDeletes.push("legacy-local");
      return true;
    },
    removeLegacySaveDataFromSessionStorage: () => {
      legacyDeletes.push("legacy-session");
      return true;
    },
    deleteLegacySaveDataFromIndexedDb: async () => {
      legacyDeletes.push("legacy-indexeddb");
      return true;
    },
    deleteLegacySaveDataFromDesktopBridge: async () => {
      legacyDeletes.push("legacy-desktop");
      return true;
    },
    updateSaveBackendIndicator: () => {},
    createEmptySave: () => ({
      version: 7,
      marker: "empty",
      starter_chosen: false,
      team: [],
      pokeballs: {},
    }),
    serializeSaveData: (saveData) => JSON.stringify({
      f: "pi4c",
      v: 7,
      m: String(saveData?.marker || ""),
    }),
    isCompactSavePayload: (saveRaw) => saveRaw?.f === "pi4c" && Number(saveRaw?.v || 0) === 7,
    decodeCompactSave: (saveRaw) => ({
      version: 7,
      marker: String(saveRaw?.m || "imported"),
      starter_chosen: true,
      team: [25],
      pokeballs: {},
    }),
    repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
  });

  return {
    alerts,
    createdBlobs,
    document,
    downloads,
    legacyDeletes,
    persistedSnapshots,
    removedKeys,
    state,
    system,
    topMessages,
    windowObject,
  };
}

test("runtime bootstrap exports the compact save payload with the v4c filename", async () => {
  const fixture = createFixture({
    initialSaveData: {
      version: 7,
      marker: "exported",
      starter_chosen: true,
      team: [25],
      pokeballs: {},
    },
  });

  await fixture.system.exportSaveToFile();

  assert.equal(fixture.downloads.length, 1);
  assert.match(fixture.downloads[0].download, /^pokeidle-save-v4c-\d{8}-\d{6}\.json$/);
  assert.equal(await fixture.createdBlobs[0].text(), '{"f":"pi4c","v":7,"m":"exported"}');
  assert.match(fixture.topMessages.at(-1) || "", /sauvegarde compacte exportee/i);
});

test("runtime bootstrap reset deletes current and legacy save sources before restarting", async () => {
  const fixture = createFixture();

  await fixture.system.resetSaveAndRestart();

  assert.deepEqual(fixture.removedKeys, ["localStorage:pokeidle_save_v4c"]);
  assert.deepEqual(fixture.legacyDeletes, [
    "current-indexeddb",
    "current-desktop",
    "legacy-indexeddb",
    "legacy-desktop",
    "legacy-local",
    "legacy-session",
  ]);
  assert.equal(fixture.state.saveData.marker, "empty");
});

test("runtime bootstrap imports only compact saves and applies the decoded save", async () => {
  const fixture = createFixture({
    importText: '{"f":"pi4c","v":7,"m":"imported-compact"}',
  });

  await fixture.system.importSaveFromFile();

  assert.equal(fixture.state.saveData.marker, "imported-compact");
  assert.equal(fixture.state.mode, "ready", fixture.state.error);
  assert.equal(fixture.alerts.length, 0);
});
