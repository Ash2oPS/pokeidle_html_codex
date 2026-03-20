import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSaveExportFilename,
  parseImportedCompactSave,
  parseImportedSaveText,
} from "../lib/save-transfer-utils.js";

test("buildSaveExportFilename produces a stable timestamped json filename", () => {
  const filename = buildSaveExportFilename(new Date("2026-03-19T14:05:09"));

  assert.equal(filename, "pokeidle-save-v4c-20260319-140509.json");
});

test("parseImportedCompactSave decodes and repairs compact imported save payloads", () => {
  const importedSave = parseImportedCompactSave('{"f":"pi4c","v":7,"w":[42,0]}', {
    parseSerializedSave: (payload) => JSON.parse(payload),
    isCompactSavePayload: (saveRaw) => saveRaw?.f === "pi4c" && Number(saveRaw?.v || 0) === 7,
    decodeCompactSave: (saveRaw) => ({
      version: 7,
      money: Array.isArray(saveRaw?.w) ? Number(saveRaw.w[0] || 0) : 0,
      normalized: true,
    }),
    repairNormalizedSaveSnapshot: (saveData) => ({
      saveData: { ...saveData, repaired: true },
    }),
  });

  assert.deepEqual(importedSave, {
    version: 7,
    money: 42,
    normalized: true,
    repaired: true,
  });
});

test("parseImportedSaveText rejects unsupported compact save payloads", () => {
  assert.throws(
    () => parseImportedSaveText('{"f":"nope","v":3}', {
      parseSerializedSave: (payload) => JSON.parse(payload),
      isCompactSavePayload: () => false,
      decodeCompactSave: (saveRaw) => saveRaw,
      repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    }),
    /pas compatible/i,
  );
});

test("parseImportedCompactSave rejects legacy verbose exports", () => {
  assert.throws(
    () => parseImportedCompactSave('{"version":6,"money":42}', {
      parseSerializedSave: (payload) => JSON.parse(payload),
      isCompactSavePayload: () => false,
      decodeCompactSave: (saveRaw) => saveRaw,
      repairNormalizedSaveSnapshot: (saveData) => ({ saveData }),
    }),
    /plus importables manuellement/i,
  );
});
