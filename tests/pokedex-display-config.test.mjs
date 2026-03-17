import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEPRECATED_POKEMON_SPRITE_VARIANT_IDS,
  DEFAULT_POKEMON_SPRITE_VARIANT_PREFERENCE,
  POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3,
  POKEDEX_VARIANT_PREFERENCE_GEN_4,
} from "../lib/pokedex-display-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gameRuntimePath = path.resolve(__dirname, "../game-runtime.js");

test("sprite variant preferences no longer prioritize deprecated emerald skins", () => {
  assert.equal(DEPRECATED_POKEMON_SPRITE_VARIANT_IDS.has("emerald"), true);
  assert.equal(DEFAULT_POKEMON_SPRITE_VARIANT_PREFERENCE.includes("emerald"), false);
  assert.equal(POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3.includes("emerald"), false);
  assert.equal(POKEDEX_VARIANT_PREFERENCE_GEN_4.includes("emerald"), false);
});

test("game runtime drops deprecated sprite variants during normalization and lookup", () => {
  const source = fs.readFileSync(gameRuntimePath, "utf8");

  assert.match(source, /function normalizeSpriteVariantEntry[\s\S]*isDeprecatedSpriteVariantId\(id\)/);
  assert.match(source, /function getSpriteVariantsForDef\(def\)[\s\S]*!isDeprecatedSpriteVariantId\(entry\.id\)/);
});
