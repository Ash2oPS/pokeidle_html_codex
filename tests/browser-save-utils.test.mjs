import test from "node:test";
import assert from "node:assert/strict";

import {
  pickPreferredSaveCandidate,
  SAVE_SOURCE_INDEXED_DB,
  SAVE_SOURCE_LOCAL_STORAGE,
  SAVE_SOURCE_SESSION_STORAGE,
} from "../lib/browser-save-utils.js";

test("pickPreferredSaveCandidate keeps the freshest browser save", () => {
  const selected = pickPreferredSaveCandidate([
    {
      source: SAVE_SOURCE_LOCAL_STORAGE,
      saveData: { last_tick_epoch_ms: 100 },
    },
    {
      source: SAVE_SOURCE_INDEXED_DB,
      saveData: { last_tick_epoch_ms: 240 },
    },
    {
      source: SAVE_SOURCE_SESSION_STORAGE,
      saveData: { last_tick_epoch_ms: 120 },
    },
  ]);

  assert.equal(selected?.source, SAVE_SOURCE_INDEXED_DB);
});

test("pickPreferredSaveCandidate prefers localStorage on equal timestamps", () => {
  const selected = pickPreferredSaveCandidate([
    {
      source: SAVE_SOURCE_SESSION_STORAGE,
      saveData: { last_tick_epoch_ms: 700 },
    },
    {
      source: SAVE_SOURCE_LOCAL_STORAGE,
      saveData: { last_tick_epoch_ms: 700 },
    },
  ]);

  assert.equal(selected?.source, SAVE_SOURCE_LOCAL_STORAGE);
});

test("pickPreferredSaveCandidate ignores invalid candidates", () => {
  const selected = pickPreferredSaveCandidate([
    null,
    {
      source: "weird",
      saveData: null,
    },
    {
      source: SAVE_SOURCE_LOCAL_STORAGE,
      saveData: { last_tick_epoch_ms: 42 },
    },
  ]);

  assert.equal(selected?.source, SAVE_SOURCE_LOCAL_STORAGE);
});
