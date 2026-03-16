import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeInputSystem } from "../systems/ui/runtime-input-system.js";

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
    this.addCount = 0;
    this.removeCount = 0;
  }

  addEventListener(eventName, handler, options = undefined) {
    const key = String(eventName);
    const existing = this.listeners.get(key) || [];
    existing.push({ handler, options });
    this.listeners.set(key, existing);
    this.addCount += 1;
  }

  removeEventListener(eventName, handler, options = undefined) {
    const key = String(eventName);
    const existing = this.listeners.get(key) || [];
    const next = existing.filter((entry) => entry.handler !== handler || entry.options !== options);
    if (next.length > 0) {
      this.listeners.set(key, next);
    } else {
      this.listeners.delete(key);
    }
    this.removeCount += 1;
  }

  dispatchEvent(eventName, event = {}) {
    const entries = [...(this.listeners.get(String(eventName)) || [])];
    for (const entry of entries) {
      entry.handler(event);
    }
  }

  listenerCount() {
    let count = 0;
    for (const entries of this.listeners.values()) {
      count += entries.length;
    }
    return count;
  }
}

function createFixture() {
  const documentRef = new FakeEventTarget();
  const windowRef = new FakeEventTarget();
  const canvas = new FakeEventTarget();

  const calls = {
    clearTeamDragState: 0,
    clearCanvasHoverState: 0,
    render: 0,
    persist: 0,
  };

  const state = {
    ui: {
      teamDragActive: false,
      teamDragMoved: false,
      mapOpen: false,
      tutorialOpen: false,
      shopOpen: false,
      gachaOpen: false,
      appearanceOpen: false,
      pokedexOpen: false,
      boxesOpen: false,
      renameOpen: false,
      ballCaptureMenuOpen: false,
      teamContextMenuOpen: false,
      evolutionItemChoiceOpen: false,
    },
    tutorial: {
      active: null,
    },
  };

  const system = createRuntimeInputSystem({
    documentRef,
    windowRef,
    canvas,
    state,
    constants: {
      TEAM_DRAG_CLICK_SUPPRESS_MS: 80,
      MAX_TEAM_SIZE: 6,
    },
    actions: {
      clearTeamDragState() {
        calls.clearTeamDragState += 1;
      },
      clearCanvasHoverState() {
        calls.clearCanvasHoverState += 1;
      },
      render() {
        calls.render += 1;
      },
      handlePageLifecyclePersist() {
        calls.persist += 1;
      },
      toggleFullscreen() {
        return Promise.resolve();
      },
    },
  });

  return {
    system,
    state,
    calls,
    documentRef,
    windowRef,
    canvas,
  };
}

test("runtime input system init/dispose are idempotent and clean all listeners", () => {
  const fixture = createFixture();

  fixture.system.init();
  const firstDocumentCount = fixture.documentRef.listenerCount();
  const firstWindowCount = fixture.windowRef.listenerCount();
  const firstCanvasCount = fixture.canvas.listenerCount();
  assert.ok(firstDocumentCount > 0);
  assert.ok(firstWindowCount > 0);
  assert.ok(firstCanvasCount > 0);

  fixture.system.init();
  assert.equal(fixture.documentRef.listenerCount(), firstDocumentCount);
  assert.equal(fixture.windowRef.listenerCount(), firstWindowCount);
  assert.equal(fixture.canvas.listenerCount(), firstCanvasCount);

  fixture.system.dispose();
  assert.equal(fixture.documentRef.listenerCount(), 0);
  assert.equal(fixture.windowRef.listenerCount(), 0);
  assert.equal(fixture.canvas.listenerCount(), 0);

  fixture.system.dispose();
  assert.equal(fixture.documentRef.listenerCount(), 0);
  assert.equal(fixture.windowRef.listenerCount(), 0);
  assert.equal(fixture.canvas.listenerCount(), 0);
});

test("escape cancels team drag with expected priority", () => {
  const fixture = createFixture();
  fixture.state.ui.teamDragActive = true;
  fixture.state.ui.teamDragMoved = true;
  fixture.system.init();

  let prevented = false;
  fixture.documentRef.dispatchEvent("keydown", {
    key: "Escape",
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.calls.clearTeamDragState, 1);
  assert.equal(fixture.calls.clearCanvasHoverState, 1);
  assert.equal(fixture.calls.render, 1);
});

test("pagehide persists and disposes listeners", () => {
  const fixture = createFixture();
  fixture.state.ui.teamDragActive = true;
  fixture.system.init();

  fixture.windowRef.dispatchEvent("pagehide", {});
  assert.equal(fixture.calls.persist, 1);
  assert.equal(fixture.documentRef.listenerCount(), 0);
  assert.equal(fixture.windowRef.listenerCount(), 0);
  assert.equal(fixture.canvas.listenerCount(), 0);

  fixture.documentRef.dispatchEvent("keydown", {
    key: "Escape",
    preventDefault() {},
  });
  assert.equal(fixture.calls.clearTeamDragState, 0);
});
