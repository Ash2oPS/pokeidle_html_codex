import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeSaveSystem } from "../systems/save/runtime-save-system.js";
import {
  pickPreferredSaveCandidate,
  SAVE_SOURCE_DESKTOP,
  SAVE_SOURCE_INDEXED_DB,
  SAVE_SOURCE_LOCAL_STORAGE,
  SAVE_SOURCE_SESSION_STORAGE,
} from "../lib/browser-save-utils.js";

function createSaveBackendState() {
  return {
    indexedDbAvailable: null,
    syncStorageAvailable: true,
    indexedDbWriteInFlight: false,
    pendingSerializedSave: null,
    retryTimerId: 0,
    browserLastPersistSucceeded: true,
    desktopBridgeAvailable: null,
    desktopWriteInFlight: false,
    pendingDesktopSerializedSave: null,
    desktopRetryTimerId: 0,
    desktopLastPersistSucceeded: null,
    lastPersistSucceeded: true,
  };
}

function createFixture(options = {}) {
  const state = {
    saveData: null,
    saveBackend: createSaveBackendState(),
  };

  const readCounts = {
    desktop: 0,
    local: 0,
    session: 0,
    indexedDb: 0,
  };
  const writes = [];
  const legacyDeletes = [];
  const setTimerCalls = [];
  const clearTimerCalls = [];
  let timerIdSeed = 1;
  const scheduledTimers = [];

  let indexedDbWriteIndex = 0;
  let desktopWriteIndex = 0;
  const indexedDbWriteResults = Array.isArray(options.indexedDbWriteResults)
    ? options.indexedDbWriteResults
    : [true];
  const desktopWriteResults = Array.isArray(options.desktopWriteResults)
    ? options.desktopWriteResults
    : [true];

  const saveBackendValueEl = { textContent: "" };

  const system = createRuntimeSaveSystem({
    state,
    hasIndexedDbSaveSupport: () => Boolean(options.hasIndexedDb),
    hasDesktopSaveBridge: () => Boolean(options.hasDesktopBridge),
    serializeSaveData: (saveData) => `compact:${saveData.version}:${saveData.last_tick_epoch_ms}:${saveData.marker || ""}`,
    readSaveDataFromDesktopBridge: async () => {
      readCounts.desktop += 1;
      return options.desktopSave ?? null;
    },
    readSaveDataFromLocalStorage: () => {
      readCounts.local += 1;
      return options.localStorageSave ?? null;
    },
    readRawLegacySaveDataFromLocalStorage: () => {
      readCounts.local += 1;
      return options.legacyLocalStorageSave ?? null;
    },
    readRawLegacySaveDataFromSessionStorage: () => {
      readCounts.session += 1;
      return options.legacySessionStorageSave ?? null;
    },
    readSaveDataFromIndexedDb: async () => {
      readCounts.indexedDb += 1;
      return options.indexedDbSave ?? null;
    },
    readRawLegacySaveDataFromDesktopBridge: async () => {
      readCounts.desktop += 1;
      return options.legacyDesktopSave ?? null;
    },
    readRawLegacySaveDataFromIndexedDb: async () => {
      readCounts.indexedDb += 1;
      return options.legacyIndexedDbSave ?? null;
    },
    writeSerializedSaveToIndexedDb: async () => {
      const cursor = Math.min(indexedDbWriteIndex, indexedDbWriteResults.length - 1);
      indexedDbWriteIndex += 1;
      return Boolean(indexedDbWriteResults[cursor]);
    },
    writeSerializedSaveToDesktopBridge: async () => {
      const cursor = Math.min(desktopWriteIndex, desktopWriteResults.length - 1);
      desktopWriteIndex += 1;
      return Boolean(desktopWriteResults[cursor]);
    },
    writeSerializedSaveToStorageKey: (areaName, key, serializedSave) => {
      writes.push({ areaName, key, serializedSave });
      return true;
    },
    removeLegacySaveDataFromLocalStorage: () => {
      legacyDeletes.push("local");
      return true;
    },
    removeLegacySaveDataFromSessionStorage: () => {
      legacyDeletes.push("session");
      return true;
    },
    deleteLegacySaveDataFromIndexedDb: async () => {
      legacyDeletes.push("indexeddb");
      return true;
    },
    deleteLegacySaveDataFromDesktopBridge: async () => {
      legacyDeletes.push("desktop");
      return true;
    },
    pickPreferredSaveCandidate: options.pickPreferredSaveCandidate || pickPreferredSaveCandidate,
    createEmptySave: () => ({ version: 7, last_tick_epoch_ms: 0, marker: "empty" }),
    createSaveFromLegacyRawSave: async (rawSave) => ({ version: 7, last_tick_epoch_ms: 0, marker: `legacy:${rawSave?.marker || "save"}` }),
    repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    readSeededDevSaveData: async () => options.seededSave ?? null,
    saveVersion: 7,
    appVersion: "0.1.27",
    saveKey: "pokeidle_save_v4c",
    saveSourceDesktop: SAVE_SOURCE_DESKTOP,
    saveSourceLocalStorage: SAVE_SOURCE_LOCAL_STORAGE,
    saveSourceSessionStorage: SAVE_SOURCE_SESSION_STORAGE,
    saveSourceIndexedDb: SAVE_SOURCE_INDEXED_DB,
    saveBackendLabelBrowser: "Sauvegarde navigateur",
    saveBackendLabelDesktop: "Sauvegarde locale (Desktop)",
    saveBackendLabelUnavailable: "Sauvegarde indisponible",
    saveBackendValueEl,
    setTimeoutFn: (fn, delayMs = 0) => {
      const id = timerIdSeed;
      timerIdSeed += 1;
      setTimerCalls.push({ id, delayMs });
      scheduledTimers.push({ id, fn });
      return id;
    },
    clearTimeoutFn: (id) => {
      clearTimerCalls.push(id);
    },
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    nowMs: () => 123456,
  });

  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  async function runScheduledTimers() {
    while (scheduledTimers.length > 0) {
      const timer = scheduledTimers.shift();
      timer.fn();
      await flushMicrotasks();
    }
  }

  return {
    state,
    readCounts,
    writes,
    legacyDeletes,
    saveBackendValueEl,
    setTimerCalls,
    clearTimerCalls,
    getIndexedDbWriteCount: () => indexedDbWriteIndex,
    getDesktopWriteCount: () => desktopWriteIndex,
    system,
    flushMicrotasks,
    runScheduledTimers,
  };
}

test("loadSaveData prioritizes seeded save and bypasses backend reads", async () => {
  const fixture = createFixture({
    seededSave: { version: 7, last_tick_epoch_ms: 999, marker: "seeded" },
    hasDesktopBridge: true,
    hasIndexedDb: true,
    desktopSave: { version: 7, last_tick_epoch_ms: 100, marker: "desktop" },
    localStorageSave: { version: 7, last_tick_epoch_ms: 110, marker: "local" },
    legacySessionStorageSave: { version: 6, last_tick_epoch_ms: 120, marker: "session" },
    indexedDbSave: { version: 7, last_tick_epoch_ms: 130, marker: "indexeddb" },
  });

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.marker, "seeded");
  assert.deepEqual(fixture.readCounts, {
    desktop: 0,
    local: 0,
    session: 0,
    indexedDb: 0,
  });
  assert.equal(fixture.writes.length, 1);
});

test("loadSaveData honors tie-break preference and keeps desktop save when timestamps are equal", async () => {
  const fixture = createFixture({
    hasDesktopBridge: true,
    desktopSave: { version: 7, last_tick_epoch_ms: 777, marker: "desktop" },
    localStorageSave: { version: 7, last_tick_epoch_ms: 777, marker: "local" },
    legacySessionStorageSave: { version: 6, last_tick_epoch_ms: 700, marker: "session" },
    indexedDbSave: null,
  });

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.marker, "desktop");
  assert.equal(fixture.readCounts.desktop, 1);
  assert.equal(fixture.readCounts.local, 1);
  assert.equal(fixture.readCounts.session, 0);
  assert.equal(fixture.readCounts.indexedDb, 1);
});

test("loadSaveData ignores legacy saves when a current compact save exists", async () => {
  const fixture = createFixture({
    localStorageSave: { version: 7, last_tick_epoch_ms: 200, marker: "current" },
    legacySessionStorageSave: { version: 6, last_tick_epoch_ms: 999, marker: "legacy-session" },
  });

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.marker, "current");
  assert.deepEqual(fixture.legacyDeletes, []);
  assert.equal(fixture.readCounts.session, 0);
  assert.equal(fixture.writes.at(-1).serializedSave, "compact:7:200:current");
});

test("loadSaveData salvages legacy save when no current compact save exists", async () => {
  const fixture = createFixture({
    legacyLocalStorageSave: { version: 6, last_tick_epoch_ms: 400, marker: "legacy-local" },
    legacySessionStorageSave: { version: 6, last_tick_epoch_ms: 300, marker: "legacy-session" },
  });

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.marker, "legacy:legacy-local");
  assert.deepEqual(fixture.legacyDeletes, ["local", "session", "indexeddb", "desktop"]);
  assert.equal(fixture.writes.at(-1).serializedSave, "compact:7:0:legacy:legacy-local");
});

test("syncSerializedSaveToBrowserStorage retries indexeddb and desktop writes after transient failures", async () => {
  const fixture = createFixture({
    hasDesktopBridge: true,
    hasIndexedDb: true,
    indexedDbWriteResults: [false, true],
    desktopWriteResults: [false, true],
  });

  fixture.system.syncSerializedSaveToBrowserStorage("{\"version\":6,\"money\":42}");
  await fixture.flushMicrotasks();
  await fixture.runScheduledTimers();

  assert.equal(fixture.getIndexedDbWriteCount(), 2);
  assert.equal(fixture.getDesktopWriteCount(), 2);
  assert.equal(fixture.state.saveBackend.pendingSerializedSave, null);
  assert.equal(fixture.state.saveBackend.pendingDesktopSerializedSave, null);
  assert.equal(fixture.state.saveBackend.lastPersistSucceeded, true);
  assert.equal(fixture.saveBackendValueEl.textContent, "Sauvegarde locale (Desktop)");
  assert.equal(fixture.setTimerCalls.length >= 2, true);
});

test("save backend indicator falls back to browser label when desktop persistence is failing", () => {
  const fixture = createFixture({
    hasDesktopBridge: true,
  });
  fixture.state.saveBackend.syncStorageAvailable = true;
  fixture.state.saveBackend.desktopBridgeAvailable = true;
  fixture.state.saveBackend.desktopLastPersistSucceeded = false;

  fixture.system.refreshSaveBackendStatus();
  fixture.system.updateSaveBackendIndicator();

  assert.equal(fixture.state.saveBackend.lastPersistSucceeded, true);
  assert.equal(fixture.saveBackendValueEl.textContent, "Sauvegarde navigateur");
});

test("getSaveBackendTelemetryValue reports desktop bridge availability correctly", () => {
  const desktopFixture = createFixture({
    hasDesktopBridge: true,
  });
  desktopFixture.state.saveBackend.desktopBridgeAvailable = true;

  const browserFixture = createFixture({
    hasDesktopBridge: false,
  });

  assert.equal(desktopFixture.system.getSaveBackendTelemetryValue(), "desktop_bridge");
  assert.equal(browserFixture.system.getSaveBackendTelemetryValue(), "browser_storage");
});
