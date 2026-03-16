import test from "node:test";
import assert from "node:assert/strict";

import { createIndexedDbSaveStorage } from "../infra/storage/indexeddb-save-storage.js";

function createFakeIndexedDbWindow() {
  let storedRecord = null;
  const database = {
    objectStoreNames: {
      contains() {
        return true;
      },
    },
    createObjectStore() {},
    transaction() {
      const transaction = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore() {
          return {
            get() {
              const request = {
                onsuccess: null,
                onerror: null,
                result: null,
              };
              setTimeout(() => {
                request.result = storedRecord;
                request.onsuccess?.();
              }, 0);
              return request;
            },
            put(record) {
              storedRecord = record;
              setTimeout(() => {
                transaction.oncomplete?.();
              }, 0);
            },
            delete() {
              storedRecord = null;
              setTimeout(() => {
                transaction.oncomplete?.();
              }, 0);
            },
          };
        },
      };
      return transaction;
    },
  };

  const indexedDB = {
    open() {
      const request = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
        result: null,
      };
      setTimeout(() => {
        request.result = database;
        request.onsuccess?.();
      }, 0);
      return request;
    },
  };

  return {
    indexedDB,
  };
}

test("indexeddb adapter returns unsupported when indexedDB is unavailable", async () => {
  const availability = [];
  const adapter = createIndexedDbSaveStorage({
    getWindowObject: () => null,
    indexedDbName: "db",
    indexedDbStoreName: "store",
    indexedDbRecordKey: "main",
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: () => true,
    normalizeSave: (saveRaw) => saveRaw,
    setIndexedDbAvailable: (available) => availability.push(Boolean(available)),
    nowMs: () => 1,
  });

  const hasSupport = adapter.hasIndexedDbSaveSupport();
  const opened = await adapter.openSaveIndexedDb();

  assert.equal(hasSupport, false);
  assert.equal(opened, null);
  assert.equal(availability.at(-1), false);
});

test("indexeddb adapter writes, reads and deletes serialized saves", async () => {
  const availability = [];
  const adapter = createIndexedDbSaveStorage({
    getWindowObject: () => createFakeIndexedDbWindow(),
    indexedDbName: "db",
    indexedDbStoreName: "store",
    indexedDbRecordKey: "main",
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: (saveRaw) => Number(saveRaw?.version || 0) >= 6,
    normalizeSave: (saveRaw) => ({ ...saveRaw, normalized: true }),
    setIndexedDbAvailable: (available) => availability.push(Boolean(available)),
    nowMs: () => 123,
  });

  const writeOk = await adapter.writeSerializedSaveToIndexedDb('{"version":6,"money":50}');
  const saveData = await adapter.readSaveDataFromIndexedDb();
  const deleteOk = await adapter.deleteSaveDataFromIndexedDb();
  const saveAfterDelete = await adapter.readSaveDataFromIndexedDb();

  assert.equal(writeOk, true);
  assert.deepEqual(saveData, { version: 6, money: 50, normalized: true });
  assert.equal(deleteOk, true);
  assert.equal(saveAfterDelete, null);
  assert.equal(availability.includes(true), true);
});
