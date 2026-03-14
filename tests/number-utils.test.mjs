import test from "node:test";
import assert from "node:assert/strict";

import { clamp, toSafeInt } from "../lib/number-utils.js";

test("clamp contraint une valeur dans la plage", () => {
  assert.equal(clamp(10, 0, 5), 5);
  assert.equal(clamp(-1, 0, 5), 0);
  assert.equal(clamp(3, 0, 5), 3);
});

test("toSafeInt retourne le fallback pour les valeurs invalides", () => {
  assert.equal(toSafeInt(undefined, 7), 7);
  assert.equal(toSafeInt("abc", 9), 9);
});

test("toSafeInt convertit en entier", () => {
  assert.equal(toSafeInt("12.8"), 12);
  assert.equal(toSafeInt(0), 0);
});
