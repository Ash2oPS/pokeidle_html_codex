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
    isRawSaveSupported: (saveRaw) => saveRaw?.f === "pi4c" && Number(saveRaw?.v || 0) === 7,
    normalizeSave: (saveRaw) => ({ ...saveRaw, normalized: true }),
  });

  const serialized = JSON.stringify({ f: "pi4c", v: 7, w: [12, 0] });
  const writeOk = adapter.writeSerializedSaveToStorageKey("localStorage", "save_key", serialized);
  const rawRead = adapter.readRawSaveDataFromStorageKey("localStorage", "save_key", "local raw");
  const read = adapter.readSaveDataFromStorageKey("localStorage", "save_key", "local");
  const removeOk = adapter.removeSaveDataFromStorageKey("localStorage", "save_key");
  const readAfterRemove = adapter.readSaveDataFromStorageKey("localStorage", "save_key", "local");

  assert.equal(writeOk, true);
  assert.deepEqual(rawRead, { f: "pi4c", v: 7, w: [12, 0] });
  assert.deepEqual(read, { f: "pi4c", v: 7, w: [12, 0], normalized: true });
  assert.equal(removeOk, true);
  assert.equal(readAfterRemove, null);
});

test("browser adapter drops unsupported saves and clears storage key", () => {
  const localStorage = createMockStorage();
  localStorage.setItem("save_key", JSON.stringify({ version: 2, money: 99 }));

  const adapter = createBrowserSaveStorage({
    getWindowObject: () => ({ localStorage }),
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: (saveRaw) => saveRaw?.f === "pi4c" && Number(saveRaw?.v || 0) === 7,
    normalizeSave: (saveRaw) => saveRaw,
  });

  const read = adapter.readSaveDataFromStorageKey("localStorage", "save_key", "local");

  assert.equal(read, null);
  assert.equal(localStorage.getItem("save_key"), null);
});
