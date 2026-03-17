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

function createFixture(overrides = {}) {
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
    state: overrides.state || { timeMs: 0 },
    tweenGroup: overrides.tweenGroup ?? null,
    tweenCtor: overrides.tweenCtor ?? null,
    easing: overrides.easing || {},
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

test("createProjectileTravelTween uses cubic out easing", () => {
  const cubicOut = () => {};
  const createdTweens = [];

  class FakeTween {
    constructor(target) {
      this.target = target;
      this.toValues = null;
      this.durationMs = 0;
      this.easingFn = null;
      this.completeHandler = null;
      this.startedAt = null;
      createdTweens.push(this);
    }

    to(values, durationMs) {
      this.toValues = values;
      this.durationMs = durationMs;
      return this;
    }

    easing(easingFn) {
      this.easingFn = easingFn;
      return this;
    }

    onComplete(handler) {
      this.completeHandler = handler;
      return this;
    }

    start(startedAt) {
      this.startedAt = startedAt;
      return this;
    }

    stop() {
      return this;
    }
  }

  const fixture = createFixture({
    state: { timeMs: 42 },
    tweenCtor: FakeTween,
    easing: {
      Cubic: {
        Out: cubicOut,
      },
    },
  });

  try {
    const projectile = {};
    const tween = fixture.runtime.createProjectileTravelTween(projectile, 200);
    assert.equal(createdTweens.length, 1);
    assert.equal(tween, createdTweens[0]);
    assert.deepEqual(createdTweens[0].toValues, { progress: 1 });
    assert.equal(createdTweens[0].durationMs, 200);
    assert.equal(createdTweens[0].easingFn, cubicOut);
    assert.equal(createdTweens[0].startedAt, 42);
    assert.equal(projectile.travelTween, tween);
    assert.equal(projectile.travelTweenCompleted, false);
    assert.equal(projectile.travelTweenState?.progress, 0);
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
