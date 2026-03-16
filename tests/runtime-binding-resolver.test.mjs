import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeBindingResolver } from "../core/runtime-binding-resolver.js";

test("runtime binding resolver returns values from configured getters", () => {
  const resolve = createRuntimeBindingResolver({
    value: () => 42,
    fn: () => "ok",
  });

  assert.equal(resolve("value"), 42);
  assert.equal(resolve("fn"), "ok");
});

test("runtime binding resolver returns undefined for unknown names", () => {
  const resolve = createRuntimeBindingResolver({
    known: () => true,
  });

  assert.equal(resolve("unknown"), undefined);
  assert.equal(resolve(""), undefined);
  assert.equal(resolve(null), undefined);
});

test("runtime binding resolver swallows getter errors and returns undefined", () => {
  const resolve = createRuntimeBindingResolver({
    exploding: () => missingIdentifier,
  });

  assert.equal(resolve("exploding"), undefined);
});
