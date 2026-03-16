import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeRenderSystem } from "../systems/ui/runtime-render-system.js";

function createRenderSystem(overrides = {}) {
  return createRuntimeRenderSystem({
    bindings: {
      Math,
      Number,
    },
    resolveBinding(name) {
      if (name === "isCoarsePointerDevice") {
        return overrides.isCoarsePointerDevice ?? (() => false);
      }
      if (name === "isLikelySmartphoneBrowser") {
        return overrides.isLikelySmartphoneBrowser;
      }
      return undefined;
    },
  });
}

test("getBattleViewportProfile keeps narrow portrait viewports in phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(540, 960);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, true);
});

test("getBattleViewportProfile does not classify portrait tablets as phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(768, 1024);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, false);
  assert.equal(profile.portrait, true);
});

test("getBattleViewportProfile restores phone mode for modern smartphone browser widths", () => {
  const renderSystem = createRenderSystem({
    isLikelySmartphoneBrowser: () => true,
  });

  const profile = renderSystem.getBattleViewportProfile(600, 1200);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, true);
});

test("getBattleViewportProfile keeps landscape phones in phone mode", () => {
  const renderSystem = createRenderSystem();

  const profile = renderSystem.getBattleViewportProfile(844, 390);

  assert.equal(profile.compact, true);
  assert.equal(profile.phone, true);
  assert.equal(profile.portrait, false);
});