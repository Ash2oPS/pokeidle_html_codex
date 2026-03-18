import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

function readRuntimeUiInteractionSource() {
  return readFileSync(new URL("../systems/ui/runtime-ui-interaction-system.js", import.meta.url), "utf8");
}

test("runtime exposes the Mewtwo rename easter egg helper", () => {
  const source = readGameRuntimeSource();

  assert.match(source, /function maybeTriggerMewtwoRenameEasterEgg\(pokemonId, nickname\)/);
  assert.match(
    source,
    /incrementSpeciesStat\(LUGIA_RENAME_EASTER_EGG_UNLOCK_POKEMON_ID, "captured", true, 1\)/,
  );
  assert.match(
    source,
    /"maybeTriggerMewtwoRenameEasterEgg": \(\) => maybeTriggerMewtwoRenameEasterEgg/,
  );
});

test("first shiny capture notification can fall back to the save species name", () => {
  const source = readGameRuntimeSource();

  assert.match(source, /function getPokemonProgressDisplayNameById\(pokemonId\)/);
  assert.match(source, /species_name_en/);
  assert.match(source, /const pokemonName = getPokemonProgressDisplayNameById\(pokemonId\);/);
});

test("rename modal triggers the Mewtwo rename easter egg before syncing UI", () => {
  const source = readRuntimeUiInteractionSource();

  assert.match(
    source,
    /function applyRenameModal\(\)[\s\S]*maybeTriggerMewtwoRenameEasterEgg\(pokemonId, nextNickname\);[\s\S]*rebuildTeamAndSyncBattle\(\);/,
  );
});
