import test from "node:test";
import assert from "node:assert/strict";

import {
  LUGIA_RENAME_EASTER_EGG_UNLOCK_POKEMON_ID,
  MEWTWO_RENAME_EASTER_EGG_REQUIRED_NICKNAME,
  MEWTWO_RENAME_EASTER_EGG_SOURCE_POKEMON_ID,
  shouldUnlockLugiaShinyFromMewtwoRename,
} from "../lib/easter-egg-rules.js";

test("rename easter egg targets Mewtwo and unlocks Lugia shiny", () => {
  assert.equal(MEWTWO_RENAME_EASTER_EGG_SOURCE_POKEMON_ID, 150);
  assert.equal(LUGIA_RENAME_EASTER_EGG_UNLOCK_POKEMON_ID, 249);
  assert.equal(MEWTWO_RENAME_EASTER_EGG_REQUIRED_NICKNAME, "Armand");

  assert.equal(
    shouldUnlockLugiaShinyFromMewtwoRename({
      pokemonId: 150,
      nickname: "Armand",
      changed: true,
      alreadyUnlocked: false,
    }),
    true,
  );
});

test("rename easter egg ignores empty nicknames", () => {
  assert.equal(
    shouldUnlockLugiaShinyFromMewtwoRename({
      pokemonId: 150,
      nickname: "   ",
      changed: true,
      alreadyUnlocked: false,
    }),
    false,
  );
});

test("rename easter egg ignores non-Armand nicknames", () => {
  assert.equal(
    shouldUnlockLugiaShinyFromMewtwoRename({
      pokemonId: 150,
      nickname: "MiaouTwo",
      changed: true,
      alreadyUnlocked: false,
    }),
    false,
  );
});

test("rename easter egg ignores other species", () => {
  assert.equal(
    shouldUnlockLugiaShinyFromMewtwoRename({
      pokemonId: 149,
      nickname: "Armand",
      changed: true,
      alreadyUnlocked: false,
    }),
    false,
  );
});

test("rename easter egg does not retrigger when already unlocked", () => {
  assert.equal(
    shouldUnlockLugiaShinyFromMewtwoRename({
      pokemonId: 150,
      nickname: "Armand",
      changed: true,
      alreadyUnlocked: true,
    }),
    false,
  );
});

test("rename easter egg requires a real rename change", () => {
  assert.equal(
    shouldUnlockLugiaShinyFromMewtwoRename({
      pokemonId: 150,
      nickname: "Armand",
      changed: false,
      alreadyUnlocked: false,
    }),
    false,
  );
});
