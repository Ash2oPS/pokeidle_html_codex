import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeSaveSystem } from "../systems/save/runtime-save-system.js";

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

function createFixture() {
  const state = {
    saveData: null,
    saveBackend: createSaveBackendState(),
  };
  const writes = [];
  const legacyDeletes = [];
  const saveBackendValueEl = { textContent: "" };

  const system = createRuntimeSaveSystem({
    state,
    hasIndexedDbSaveSupport: () => false,
    hasDesktopSaveBridge: () => false,
    serializeSaveData: (saveData) => `compact:${saveData.version}:${saveData.last_tick_epoch_ms}`,
    readSaveDataFromDesktopBridge: async () => null,
    readSaveDataFromLocalStorage: () => ({ version: 7, last_tick_epoch_ms: 200 }),
    readSaveDataFromIndexedDb: async () => null,
    readRawLegacySaveDataFromDesktopBridge: async () => null,
    readRawLegacySaveDataFromLocalStorage: () => null,
    readRawLegacySaveDataFromSessionStorage: () => null,
    readRawLegacySaveDataFromIndexedDb: async () => null,
    writeSerializedSaveToIndexedDb: async () => true,
    writeSerializedSaveToDesktopBridge: async () => true,
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
    pickPreferredSaveCandidate: (candidates) => {
      const source = Array.isArray(candidates) ? candidates : [];
      return source.sort((a, b) => Number(b?.saveData?.last_tick_epoch_ms || 0) - Number(a?.saveData?.last_tick_epoch_ms || 0))[0];
    },
    createEmptySave: () => ({ version: 7, last_tick_epoch_ms: 0 }),
    createSaveFromLegacyRawSave: async (rawSave) => ({ version: 7, last_tick_epoch_ms: 0, marker: rawSave?.marker || "legacy" }),
    repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    readSeededDevSaveData: async () => null,
    saveVersion: 7,
    appVersion: "0.1.27",
    saveKey: "pokeidle_save_v4c",
    saveSourceDesktop: "desktop",
    saveSourceLocalStorage: "local_storage",
    saveSourceSessionStorage: "session_storage",
    saveSourceIndexedDb: "indexed_db",
    saveBackendLabelBrowser: "Sauvegarde navigateur",
    saveBackendLabelDesktop: "Sauvegarde locale (Desktop)",
    saveBackendLabelUnavailable: "Sauvegarde indisponible",
    saveBackendValueEl,
    shouldUseCanvasRuntimeShellLayout: () => false,
    setTimeoutFn: (fn) => {
      fn();
      return 1;
    },
    clearTimeoutFn: () => {},
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    nowMs: () => 123456,
  });

  return {
    state,
    writes,
    legacyDeletes,
    saveBackendValueEl,
    system,
  };
}

test("loadSaveData picks freshest candidate and syncs serialized save", async () => {
  const fixture = createFixture();

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.last_tick_epoch_ms, 200);
  assert.equal(fixture.writes.length, 1);
  assert.equal(fixture.writes[0].areaName, "localStorage");
  assert.equal(fixture.writes[0].serializedSave, "compact:7:200");
  assert.equal(fixture.state.saveBackend.indexedDbAvailable, false);
});

test("persistSaveData stamps save version/build/timestamp before sync", () => {
  const fixture = createFixture();
  fixture.state.saveData = {
    version: 0,
    app_build_version: "old",
    last_tick_epoch_ms: 0,
  };

  fixture.system.persistSaveData();

  assert.equal(fixture.state.saveData.version, 7);
  assert.equal(fixture.state.saveData.app_build_version, "0.1.27");
  assert.equal(fixture.state.saveData.last_tick_epoch_ms, 123456);
  assert.equal(fixture.writes.length, 1);
  assert.equal(fixture.writes[0].serializedSave, "compact:7:123456");
});

test("syncSerializedSaveToBrowserStorage refreshes backend indicator label", () => {
  const fixture = createFixture();

  const lastPersistSucceeded = fixture.system.syncSerializedSaveToBrowserStorage("{\"f\":\"pi4c\",\"v\":7}");

  assert.equal(lastPersistSucceeded, true);
  assert.equal(fixture.saveBackendValueEl.textContent, "Sauvegarde navigateur");
});

test("canvas-owned runtime shell keeps save backend label available without mutating the hidden DOM shadow", () => {
  const fixture = createFixture();
  fixture.system = createRuntimeSaveSystem({
    state: fixture.state,
    hasIndexedDbSaveSupport: () => false,
    hasDesktopSaveBridge: () => false,
    serializeSaveData: (saveData) => `compact:${saveData.version}:${saveData.last_tick_epoch_ms}`,
    readSaveDataFromDesktopBridge: async () => null,
    readSaveDataFromLocalStorage: () => null,
    readSaveDataFromIndexedDb: async () => null,
    readRawLegacySaveDataFromDesktopBridge: async () => null,
    readRawLegacySaveDataFromLocalStorage: () => null,
    readRawLegacySaveDataFromSessionStorage: () => null,
    readRawLegacySaveDataFromIndexedDb: async () => null,
    writeSerializedSaveToIndexedDb: async () => true,
    writeSerializedSaveToDesktopBridge: async () => true,
    writeSerializedSaveToStorageKey: () => true,
    removeLegacySaveDataFromLocalStorage: () => true,
    removeLegacySaveDataFromSessionStorage: () => true,
    deleteLegacySaveDataFromIndexedDb: async () => true,
    deleteLegacySaveDataFromDesktopBridge: async () => true,
    pickPreferredSaveCandidate: () => null,
    createEmptySave: () => ({ version: 7, last_tick_epoch_ms: 0 }),
    createSaveFromLegacyRawSave: async () => ({ version: 7, last_tick_epoch_ms: 0 }),
    repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    readSeededDevSaveData: async () => null,
    saveVersion: 7,
    appVersion: "0.1.27",
    saveKey: "pokeidle_save_v4c",
    saveSourceDesktop: "desktop",
    saveSourceLocalStorage: "local_storage",
    saveSourceSessionStorage: "session_storage",
    saveSourceIndexedDb: "indexed_db",
    saveBackendLabelBrowser: "Sauvegarde navigateur",
    saveBackendLabelDesktop: "Sauvegarde locale (Desktop)",
    saveBackendLabelUnavailable: "Sauvegarde indisponible",
    saveBackendValueEl: fixture.saveBackendValueEl,
    shouldUseCanvasRuntimeShellLayout: () => true,
    setTimeoutFn: (fn) => {
      fn();
      return 1;
    },
    clearTimeoutFn: () => {},
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    nowMs: () => 123456,
  });

  fixture.system.syncSerializedSaveToBrowserStorage("{\"f\":\"pi4c\",\"v\":7}");

  assert.equal(fixture.system.getSaveBackendIndicatorLabel(), "Sauvegarde navigateur");
  assert.equal(fixture.saveBackendValueEl.textContent, "");
});

test("loadSaveData salvages legacy shiny entitlements when no current save exists", async () => {
  const fixture = createFixture();
  fixture.system = createRuntimeSaveSystem({
    state: fixture.state,
    hasIndexedDbSaveSupport: () => false,
    hasDesktopSaveBridge: () => false,
    serializeSaveData: (saveData) => `compact:${saveData.marker || "empty"}`,
    readSaveDataFromDesktopBridge: async () => null,
    readSaveDataFromLocalStorage: () => null,
    readSaveDataFromIndexedDb: async () => null,
    readRawLegacySaveDataFromDesktopBridge: async () => null,
    readRawLegacySaveDataFromLocalStorage: () => ({ version: 6, last_tick_epoch_ms: 150, marker: "legacy-local" }),
    readRawLegacySaveDataFromSessionStorage: () => ({ version: 6, last_tick_epoch_ms: 100, marker: "legacy-session" }),
    readRawLegacySaveDataFromIndexedDb: async () => null,
    writeSerializedSaveToIndexedDb: async () => true,
    writeSerializedSaveToDesktopBridge: async () => true,
    writeSerializedSaveToStorageKey: (areaName, key, serializedSave) => {
      fixture.writes.push({ areaName, key, serializedSave });
      return true;
    },
    removeLegacySaveDataFromLocalStorage: () => {
      fixture.legacyDeletes.push("local");
      return true;
    },
    removeLegacySaveDataFromSessionStorage: () => {
      fixture.legacyDeletes.push("session");
      return true;
    },
    deleteLegacySaveDataFromIndexedDb: async () => {
      fixture.legacyDeletes.push("indexeddb");
      return true;
    },
    deleteLegacySaveDataFromDesktopBridge: async () => {
      fixture.legacyDeletes.push("desktop");
      return true;
    },
    pickPreferredSaveCandidate: (candidates) => candidates?.[0] || null,
    createEmptySave: () => ({ version: 7, last_tick_epoch_ms: 0, marker: "empty" }),
    createSaveFromLegacyRawSave: async (rawSave) => ({ version: 7, last_tick_epoch_ms: 0, marker: `salvaged:${rawSave.marker}` }),
    repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    readSeededDevSaveData: async () => null,
    saveVersion: 7,
    appVersion: "0.1.27",
    saveKey: "pokeidle_save_v4c",
    saveSourceDesktop: "desktop",
    saveSourceLocalStorage: "local_storage",
    saveSourceSessionStorage: "session_storage",
    saveSourceIndexedDb: "indexed_db",
    saveBackendLabelBrowser: "Sauvegarde navigateur",
    saveBackendLabelDesktop: "Sauvegarde locale (Desktop)",
    saveBackendLabelUnavailable: "Sauvegarde indisponible",
    saveBackendValueEl: fixture.saveBackendValueEl,
    shouldUseCanvasRuntimeShellLayout: () => false,
    setTimeoutFn: (fn) => {
      fn();
      return 1;
    },
    clearTimeoutFn: () => {},
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    nowMs: () => 123456,
  });

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.marker, "salvaged:legacy-local");
  assert.deepEqual(fixture.legacyDeletes, ["local", "session", "indexeddb", "desktop"]);
  assert.equal(fixture.writes.at(-1).serializedSave, "compact:salvaged:legacy-local");
});
