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
  const saveBackendValueEl = { textContent: "" };

  const system = createRuntimeSaveSystem({
    state,
    hasIndexedDbSaveSupport: () => false,
    hasDesktopSaveBridge: () => false,
    readSaveDataFromDesktopBridge: async () => null,
    readSaveDataFromLocalStorage: () => ({ version: 6, last_tick_epoch_ms: 200 }),
    readSaveDataFromSessionStorage: () => ({ version: 6, last_tick_epoch_ms: 100 }),
    readSaveDataFromIndexedDb: async () => null,
    writeSerializedSaveToIndexedDb: async () => true,
    writeSerializedSaveToDesktopBridge: async () => true,
    writeSerializedSaveToStorageKey: (areaName, key, serializedSave) => {
      writes.push({ areaName, key, serializedSave });
      return true;
    },
    pickPreferredSaveCandidate: (candidates) => {
      const source = Array.isArray(candidates) ? candidates : [];
      return source.sort((a, b) => Number(b?.saveData?.last_tick_epoch_ms || 0) - Number(a?.saveData?.last_tick_epoch_ms || 0))[0];
    },
    createEmptySave: () => ({ version: 6, last_tick_epoch_ms: 0 }),
    repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    readSeededDevSaveData: async () => null,
    saveVersion: 6,
    appVersion: "0.1.27",
    saveKey: "pokeidle_save_v3",
    saveSessionKey: "pokeidle_save_v3_session",
    saveSourceDesktop: "desktop",
    saveSourceLocalStorage: "local_storage",
    saveSourceSessionStorage: "session_storage",
    saveSourceIndexedDb: "indexed_db",
    saveBackendLabelBrowser: "Sauvegarde navigateur",
    saveBackendLabelDesktop: "Sauvegarde locale (Desktop)",
    saveBackendLabelUnavailable: "Sauvegarde indisponible",
    saveBackendValueEl,
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
    saveBackendValueEl,
    system,
  };
}

test("loadSaveData picks freshest candidate and syncs serialized save", async () => {
  const fixture = createFixture();

  const loaded = await fixture.system.loadSaveData();

  assert.equal(loaded.last_tick_epoch_ms, 200);
  assert.equal(fixture.writes.length, 2);
  assert.equal(fixture.writes[0].areaName, "localStorage");
  assert.equal(fixture.writes[1].areaName, "sessionStorage");
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

  assert.equal(fixture.state.saveData.version, 6);
  assert.equal(fixture.state.saveData.app_build_version, "0.1.27");
  assert.equal(fixture.state.saveData.last_tick_epoch_ms, 123456);
  assert.equal(fixture.writes.length, 2);
});

test("syncSerializedSaveToBrowserStorage refreshes backend indicator label", () => {
  const fixture = createFixture();

  const lastPersistSucceeded = fixture.system.syncSerializedSaveToBrowserStorage("{\"version\":6}");

  assert.equal(lastPersistSucceeded, true);
  assert.equal(fixture.saveBackendValueEl.textContent, "Sauvegarde navigateur");
});
