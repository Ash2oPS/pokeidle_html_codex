import test from "node:test";
import assert from "node:assert/strict";

import { createUiAnimationRuntime } from "../lib/ui-animation-runtime.js";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...tokens) {
    for (const token of tokens) {
      this.values.add(String(token));
    }
  }

  remove(...tokens) {
    for (const token of tokens) {
      this.values.delete(String(token));
    }
  }

  contains(token) {
    return this.values.has(String(token));
  }

  toggle(token, force = undefined) {
    const key = String(token);
    if (force === true) {
      this.values.add(key);
      return true;
    }
    if (force === false) {
      this.values.delete(key);
      return false;
    }
    if (this.values.has(key)) {
      this.values.delete(key);
      return false;
    }
    this.values.add(key);
    return true;
  }
}

function createFixture() {
  const loadingScreenEl = {
    classList: new FakeClassList(),
    style: {},
  };
  const loadingScreenTextEl = {
    textContent: "",
  };
  const originalWindow = globalThis.window;
  globalThis.window = {
    setTimeout,
    clearTimeout,
  };

  const runtime = createUiAnimationRuntime({
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    state: { timeMs: 0 },
    tweenGroup: null,
    tweenCtor: null,
    easing: {},
    loadingScreenEl,
    loadingScreenTextEl,
    loadingScreenDefaultText: "Chargement...",
    loadingScreenExitDurationMs: 10,
    uiTweenModalOpen: {},
    uiTweenModalClose: {},
    uiTweenPopupOpen: {},
    uiTweenPopupClose: {},
    floatingTextLifetimeMs: 1000,
    floatingTextEnterTweenMs: 180,
    floatingTextExitTweenMs: 180,
    floatingTextToneNormal: "normal",
    projectileTweenDurationMinMs: 80,
    projectileTweenDurationMaxMs: 360,
    getFloatingTextToneVisualStyle: () => ({
      enterDurationMs: 120,
      settleDurationMs: 120,
      exitDurationMs: 120,
      exitLifeRatio: 0.45,
      startScale: 1,
      peakScale: 1,
      settleScale: 1,
      exitScale: 1,
    }),
  });

  return {
    runtime,
    loadingScreenEl,
    loadingScreenTextEl,
    restoreWindow() {
      if (originalWindow === undefined) {
        delete globalThis.window;
      } else {
        globalThis.window = originalWindow;
      }
    },
  };
}

test("showLoadingScreen enables static pokeball class when requested", () => {
  const fixture = createFixture();
  try {
    fixture.runtime.showLoadingScreen("  Maintenance en cours  ", { disablePokeballSpin: true });
    assert.equal(fixture.loadingScreenTextEl.textContent, "Maintenance en cours");
    assert.equal(fixture.loadingScreenEl.classList.contains("is-static-pokeball"), true);
    assert.equal(fixture.loadingScreenEl.classList.contains("is-visible"), true);
  } finally {
    fixture.restoreWindow();
  }
});

test("hideLoadingScreen immediate clears static pokeball class", () => {
  const fixture = createFixture();
  try {
    fixture.runtime.showLoadingScreen("Maintenance", { disablePokeballSpin: true });
    fixture.runtime.hideLoadingScreen({ immediate: true });
    assert.equal(fixture.loadingScreenEl.classList.contains("is-static-pokeball"), false);
    assert.equal(fixture.loadingScreenEl.classList.contains("is-hidden"), true);
  } finally {
    fixture.restoreWindow();
  }
});
