import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserSaveStorage } from "../infra/storage/browser-save-storage.js";

function createMockStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    _map: map,
  };
}

test("browser adapter writes, reads and removes save payloads", () => {
  const localStorage = createMockStorage();
  const sessionStorage = createMockStorage();
  const adapter = createBrowserSaveStorage({
    getWindowObject: () => ({ localStorage, sessionStorage }),
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: (saveRaw) => Number(saveRaw?.version || 0) >= 6,
    normalizeSave: (saveRaw) => ({ ...saveRaw, normalized: true }),
  });

  const serialized = JSON.stringify({ version: 6, money: 12 });
  const writeOk = adapter.writeSerializedSaveToStorageKey("localStorage", "save_key", serialized);
  const read = adapter.readSaveDataFromStorageKey("localStorage", "save_key", "local");
  const removeOk = adapter.removeSaveDataFromStorageKey("localStorage", "save_key");
  const readAfterRemove = adapter.readSaveDataFromStorageKey("localStorage", "save_key", "local");

  assert.equal(writeOk, true);
  assert.deepEqual(read, { version: 6, money: 12, normalized: true });
  assert.equal(removeOk, true);
  assert.equal(readAfterRemove, null);
});

test("browser adapter drops unsupported saves and clears storage key", () => {
  const localStorage = createMockStorage();
  localStorage.setItem("save_key", JSON.stringify({ version: 2, money: 99 }));

  const adapter = createBrowserSaveStorage({
    getWindowObject: () => ({ localStorage }),
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: (saveRaw) => Number(saveRaw?.version || 0) >= 6,
    normalizeSave: (saveRaw) => saveRaw,
  });

  const read = adapter.readSaveDataFromStorageKey("localStorage", "save_key", "local");

  assert.equal(read, null);
  assert.equal(localStorage.getItem("save_key"), null);
});
