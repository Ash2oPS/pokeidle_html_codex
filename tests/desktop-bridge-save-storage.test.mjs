import test from "node:test";
import assert from "node:assert/strict";

import { createDesktopBridgeSaveStorage } from "../infra/storage/desktop-bridge-save-storage.js";

test("desktop bridge adapter reads and normalizes valid save payload", async () => {
  const availability = [];
  const bridge = {
    async readSave() {
      return { ok: true, save: { version: 6, money: 45 } };
    },
    async writeSave() {
      return { ok: true };
    },
    async deleteSave() {
      return { ok: true };
    },
  };

  const adapter = createDesktopBridgeSaveStorage({
    hasDesktopSaveBridge: () => true,
    getDesktopBridge: () => bridge,
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: (saveRaw) => Number(saveRaw?.version || 0) >= 6,
    normalizeSave: (saveRaw) => ({ ...saveRaw, normalized: true }),
    setDesktopBridgeAvailable: (available) => availability.push(Boolean(available)),
  });

  const saveData = await adapter.readSaveDataFromDesktopBridge();

  assert.deepEqual(saveData, { version: 6, money: 45, normalized: true });
  assert.equal(availability.at(-1), true);
});

test("desktop bridge adapter deletes unsupported save payload", async () => {
  let deleteCalls = 0;
  const bridge = {
    async readSave() {
      return { ok: true, save: { version: 1, money: 999 } };
    },
    async writeSave() {
      return { ok: true };
    },
    async deleteSave() {
      deleteCalls += 1;
      return { ok: true };
    },
  };

  const adapter = createDesktopBridgeSaveStorage({
    hasDesktopSaveBridge: () => true,
    getDesktopBridge: () => bridge,
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: (saveRaw) => Number(saveRaw?.version || 0) >= 6,
    normalizeSave: (saveRaw) => saveRaw,
    setDesktopBridgeAvailable: () => {},
  });

  const saveData = await adapter.readSaveDataFromDesktopBridge();

  assert.equal(saveData, null);
  assert.equal(deleteCalls, 1);
});

test("desktop bridge adapter writes serialized save via bridge", async () => {
  let writtenPayload = null;
  const bridge = {
    async readSave() {
      return { ok: true, save: { version: 6 } };
    },
    async writeSave(payload) {
      writtenPayload = payload;
      return { ok: true };
    },
    async deleteSave() {
      return { ok: true };
    },
  };

  const adapter = createDesktopBridgeSaveStorage({
    hasDesktopSaveBridge: () => true,
    getDesktopBridge: () => bridge,
    parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
    isRawSaveSupported: () => true,
    normalizeSave: (saveRaw) => saveRaw,
    setDesktopBridgeAvailable: () => {},
  });

  const ok = await adapter.writeSerializedSaveToDesktopBridge('{"version":6,"money":12}');

  assert.equal(ok, true);
  assert.deepEqual(writtenPayload, { version: 6, money: 12 });
});
