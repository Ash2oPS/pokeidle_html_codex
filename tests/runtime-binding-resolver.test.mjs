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

test("runtime binding resolver binds browser global methods to window", () => {
  const originalWindow = globalThis.window;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const fakeWindow = {
    callCount: 0,
    requestAnimationFrame(callback) {
      this.callCount += 1;
      callback(16);
      return this.callCount;
    },
  };

  globalThis.window = fakeWindow;
  globalThis.requestAnimationFrame = fakeWindow.requestAnimationFrame;

  try {
    const resolve = createRuntimeBindingResolver({
      requestAnimationFrame: () => globalThis.requestAnimationFrame,
    });

    const requestAnimationFrameFn = resolve("requestAnimationFrame");
    const result = requestAnimationFrameFn(() => {});

    assert.equal(result, 1);
    assert.equal(fakeWindow.callCount, 1);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }

    if (originalRequestAnimationFrame === undefined) {
      delete globalThis.requestAnimationFrame;
    } else {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    }
  }
});
