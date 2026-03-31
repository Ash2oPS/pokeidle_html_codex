import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

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

function createFixture(overrides = {}) {
  const documentRef = new FakeEventTarget();
  documentRef.onfreeze = null;
  documentRef.onresume = null;
  const windowRef = new FakeEventTarget();
  const canvas = new FakeEventTarget();

  const calls = {
    clearTeamDragState: 0,
    clearCanvasHoverState: 0,
    render: 0,
    lifecycleSignals: [],
  };

  const state = {
    ui: {
      teamDragActive: false,
      teamDragMoved: false,
      routeNavDrawerOpen: false,
      routeNavInfoRouteId: null,
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
      handleRuntimeLifecycleSignal(payload) {
        calls.lifecycleSignals.push(payload);
      },
      toggleFullscreen() {
        return Promise.resolve();
      },
      ...overrides.actions,
    },
    elements: {
      ...overrides.elements,
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

function createDomRouteNavFixture(overrides = {}) {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <canvas id="canvas"></canvas>
        <section id="route-nav-panel">
          <button id="route-nav-drawer-toggle" type="button">Sorties</button>
        </section>
        <div id="route-nav-drawer">
          <button id="route-nav-drawer-close" type="button">Fermer</button>
          <div id="route-nav-drawer-list"></div>
          <div id="route-nav-info-panel"></div>
        </div>
        <div id="map-connections-list"></div>
        <div id="map-connections-info-panel"></div>
        <div id="outside-target"></div>
      </body>
    </html>
  `, { pretendToBeVisual: true });
  const previousElement = globalThis.Element;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;

  const state = {
    ui: {
      routeNavDrawerOpen: false,
      routeNavInfoRouteId: null,
      mapOpen: false,
      tutorialOpen: false,
      dialogueOpen: false,
      shopOpen: false,
      gachaOpen: false,
      appearanceOpen: false,
      pokedexOpen: false,
      boxesOpen: false,
      renameOpen: false,
      ballCaptureMenuOpen: false,
      teamContextMenuOpen: false,
      evolutionItemChoiceOpen: false,
      teamDragActive: false,
      teamDragMoved: false,
    },
    tutorial: {
      active: null,
    },
  };
  const calls = [];
  const documentRef = dom.window.document;
  const windowRef = dom.window;
  const canvas = documentRef.getElementById("canvas");

  const system = createRuntimeInputSystem({
    documentRef,
    windowRef,
    canvas,
    state,
    constants: {
      TEAM_DRAG_CLICK_SUPPRESS_MS: 80,
      MAX_TEAM_SIZE: 6,
    },
    elements: {
      routeNavPanelEl: documentRef.getElementById("route-nav-panel"),
      routeNavDrawerToggleButtonEl: documentRef.getElementById("route-nav-drawer-toggle"),
      routeNavDrawerEl: documentRef.getElementById("route-nav-drawer"),
      routeNavDrawerCloseButtonEl: documentRef.getElementById("route-nav-drawer-close"),
      routeNavDrawerListEl: documentRef.getElementById("route-nav-drawer-list"),
      routeNavInfoPanelEl: documentRef.getElementById("route-nav-info-panel"),
      mapConnectionsListEl: documentRef.getElementById("map-connections-list"),
      mapConnectionsInfoPanelEl: documentRef.getElementById("map-connections-info-panel"),
      ...overrides.elements,
    },
    actions: {
      toggleFullscreen() {
        return Promise.resolve();
      },
      applyRouteChange(routeId) {
        calls.push({ type: "travel", routeId });
        return true;
      },
      toggleRouteNavDrawer() {
        state.ui.routeNavDrawerOpen = !state.ui.routeNavDrawerOpen;
        calls.push({ type: "toggle-drawer", open: state.ui.routeNavDrawerOpen });
      },
      setRouteNavDrawerOpen(open) {
        state.ui.routeNavDrawerOpen = Boolean(open);
        calls.push({ type: "set-drawer", open: state.ui.routeNavDrawerOpen });
      },
      openRouteNavigationInfo(routeId) {
        state.ui.routeNavInfoRouteId = routeId;
        calls.push({ type: "open-info", routeId });
      },
      closeRouteNavigationInfo() {
        state.ui.routeNavInfoRouteId = null;
        calls.push({ type: "close-info" });
      },
      setMapOpen(open) {
        state.ui.mapOpen = Boolean(open);
        calls.push({ type: "set-map", open: state.ui.mapOpen });
      },
      ...overrides.actions,
    },
  });

  function cleanup() {
    system.dispose();
    globalThis.Element = previousElement;
    globalThis.HTMLElement = previousHTMLElement;
    dom.window.close();
  }

  return {
    dom,
    documentRef,
    windowRef,
    canvas,
    state,
    calls,
    system,
    cleanup,
  };
}

function createDomOnboardingFixture(overrides = {}) {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <canvas id="canvas"></canvas>
        <button id="route-nav-drawer-toggle" type="button">Zone</button>
        <button id="action-dock-toggle" type="button">Menu</button>
      </body>
    </html>
  `, { pretendToBeVisual: true });
  const previousElement = globalThis.Element;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;

  const state = {
    layout: {
      viewportProfile: {
        phone: false,
      },
    },
    ui: {
      routeNavDrawerOpen: false,
      routeNavInfoRouteId: null,
      routeNavOnboardingSeen: false,
      actionMenuOnboardingSeen: false,
      mapOpen: false,
      tutorialOpen: false,
      dialogueOpen: false,
      shopOpen: false,
      gachaOpen: false,
      appearanceOpen: false,
      pokedexOpen: false,
      boxesOpen: false,
      renameOpen: false,
      ballCaptureMenuOpen: false,
      teamContextMenuOpen: false,
      evolutionItemChoiceOpen: false,
      teamDragActive: false,
      teamDragMoved: false,
    },
    tutorial: {
      active: null,
    },
  };
  const calls = [];
  const documentRef = dom.window.document;
  const windowRef = dom.window;
  const canvas = documentRef.getElementById("canvas");

  const system = createRuntimeInputSystem({
    documentRef,
    windowRef,
    canvas,
    state,
    constants: {
      TEAM_DRAG_CLICK_SUPPRESS_MS: 80,
      MAX_TEAM_SIZE: 6,
    },
    elements: {
      routeNavDrawerToggleButtonEl: documentRef.getElementById("route-nav-drawer-toggle"),
      actionDockPokeballToggleButtonEl: documentRef.getElementById("action-dock-toggle"),
      ...overrides.elements,
    },
    actions: {
      toggleFullscreen() {
        return Promise.resolve();
      },
      isActionDockFullscreenMenuOpen() {
        return Boolean(state.ui.actionMenuOpen);
      },
      toggleActionDockFullscreenMenu() {
        state.ui.actionMenuOpen = !state.ui.actionMenuOpen;
        calls.push({ type: "toggle-menu", open: state.ui.actionMenuOpen });
      },
      toggleRouteNavDrawer() {
        state.ui.routeNavDrawerOpen = !state.ui.routeNavDrawerOpen;
        calls.push({ type: "toggle-drawer", open: state.ui.routeNavDrawerOpen });
      },
      ...overrides.actions,
    },
  });

  function cleanup() {
    system.dispose();
    globalThis.Element = previousElement;
    globalThis.HTMLElement = previousHTMLElement;
    dom.window.close();
  }

  return {
    dom,
    state,
    calls,
    system,
    documentRef,
    cleanup,
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

test("blur and visibility lifecycle events are forwarded without breaking drag cleanup", () => {
  const fixture = createFixture();
  fixture.state.ui.teamDragActive = true;
  fixture.state.ui.teamDragMoved = true;
  fixture.system.init();

  fixture.windowRef.dispatchEvent("blur", { type: "blur" });
  fixture.documentRef.dispatchEvent("visibilitychange", { type: "visibilitychange" });

  assert.equal(fixture.calls.clearTeamDragState, 1);
  assert.equal(fixture.calls.clearCanvasHoverState, 1);
  assert.equal(fixture.calls.render, 1);
  assert.deepEqual(
    fixture.calls.lifecycleSignals.map((entry) => `${entry.source}:${entry.kind}`),
    ["window:blur", "document:visibilitychange"],
  );
});

test("beforeunload forwards lifecycle signal and disposes listeners", () => {
  const fixture = createFixture();
  fixture.system.init();

  fixture.windowRef.dispatchEvent("beforeunload", { type: "beforeunload" });

  assert.equal(fixture.calls.lifecycleSignals.length, 1);
  assert.equal(fixture.calls.lifecycleSignals[0].source, "window");
  assert.equal(fixture.calls.lifecycleSignals[0].kind, "beforeunload");
  assert.equal(fixture.documentRef.listenerCount(), 0);
  assert.equal(fixture.windowRef.listenerCount(), 0);
  assert.equal(fixture.canvas.listenerCount(), 0);
});

test("clicking import/export save buttons forwards to runtime save actions", async () => {
  const exportSaveButtonEl = new FakeEventTarget();
  const importSaveButtonEl = new FakeEventTarget();
  const calls = [];
  const fixture = createFixture({
    elements: {
      exportSaveButtonEl,
      importSaveButtonEl,
    },
    actions: {
      exportSaveToFile() {
        calls.push("export");
        return Promise.resolve();
      },
      importSaveFromFile() {
        calls.push("import");
        return Promise.resolve();
      },
    },
  });
  fixture.system.init();

  exportSaveButtonEl.dispatchEvent("click");
  importSaveButtonEl.dispatchEvent("click");
  await Promise.resolve();

  assert.deepEqual(calls, ["export", "import"]);
});

test("clicking the dev level-all button forwards to the dev boost action", () => {
  const devLevelAllButtonEl = new FakeEventTarget();
  let called = 0;
  const fixture = createFixture({
    elements: {
      devLevelAllButtonEl,
    },
    actions: {
      levelUpAllOwnedPokemonFromDev() {
        called += 1;
      },
    },
  });
  fixture.system.init();

  devLevelAllButtonEl.dispatchEvent("click");

  assert.equal(called, 1);
});

test("route navigation clicks travel for unlocked cards without pre-closing the drawer", () => {
  const fixture = createDomRouteNavFixture();
  fixture.documentRef.getElementById("route-nav-drawer-list").innerHTML = `
    <button type="button" data-route-id="kanto_route_2" data-route-action="travel"><span>Route 2</span></button>
  `;

  fixture.system.init();
  fixture.documentRef
    .querySelector("#route-nav-drawer-list [data-route-id='kanto_route_2']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));

  assert.deepEqual(fixture.calls, [
    { type: "travel", routeId: "kanto_route_2" },
  ]);
  fixture.cleanup();
});

test("route navigation opens info for locked cards", () => {
  const fixture = createDomRouteNavFixture();
  fixture.documentRef.getElementById("route-nav-drawer-list").innerHTML = `
    <button type="button" data-route-id="johto_route_29" data-route-action="info"><span>Route 29</span></button>
  `;

  fixture.system.init();
  fixture.documentRef
    .querySelector("#route-nav-drawer-list [data-route-id='johto_route_29']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));

  assert.deepEqual(fixture.calls, [
    { type: "open-info", routeId: "johto_route_29" },
  ]);
  fixture.cleanup();
});

test("route navigation drawer destination cards reuse the delegated travel/info handler", () => {
  const fixture = createDomRouteNavFixture();
  fixture.documentRef.getElementById("route-nav-drawer-list").innerHTML = `
    <button type="button" data-route-id="kanto_route_3" data-route-action="travel"><span>Route 3</span></button>
    <button type="button" data-route-id="johto_route_30" data-route-action="info"><span>Route 30</span></button>
  `;

  fixture.system.init();
  fixture.documentRef
    .querySelector("#route-nav-drawer-list [data-route-id='kanto_route_3']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));
  fixture.documentRef
    .querySelector("#route-nav-drawer-list [data-route-id='johto_route_30']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));

  assert.deepEqual(fixture.calls, [
    { type: "travel", routeId: "kanto_route_3" },
    { type: "open-info", routeId: "johto_route_30" },
  ]);
  fixture.cleanup();
});

test("route navigation uses the same delegated handler for map connections and close buttons", () => {
  const fixture = createDomRouteNavFixture();
  fixture.documentRef.getElementById("map-connections-list").innerHTML = `
    <button type="button" data-route-id="hoenn_route_101" data-route-action="info"><span>Route 101</span></button>
  `;
  fixture.documentRef.getElementById("route-nav-info-panel").innerHTML = `
    <button type="button" data-route-info-close="true">Fermer</button>
  `;
  fixture.documentRef.getElementById("map-connections-info-panel").innerHTML = `
    <button type="button" data-route-info-close="true">Fermer</button>
  `;

  fixture.system.init();
  fixture.documentRef
    .querySelector("#map-connections-list [data-route-id='hoenn_route_101']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));
  fixture.documentRef
    .querySelector("#route-nav-info-panel [data-route-info-close='true']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));
  fixture.documentRef
    .querySelector("#map-connections-info-panel [data-route-info-close='true']")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));

  assert.deepEqual(fixture.calls, [
    { type: "open-info", routeId: "hoenn_route_101" },
    { type: "close-info" },
    { type: "close-info" },
  ]);
  fixture.cleanup();
});

test("escape closes route nav info before drawer before map", () => {
  const calls = [];
  const fixture = createFixture({
    actions: {
      closeRouteNavigationInfo() {
        fixture.state.ui.routeNavInfoRouteId = null;
        calls.push("close-info");
      },
      setRouteNavDrawerOpen(open) {
        fixture.state.ui.routeNavDrawerOpen = Boolean(open);
        calls.push(`set-drawer:${Boolean(open)}`);
      },
      setMapOpen(open) {
        fixture.state.ui.mapOpen = Boolean(open);
        calls.push(`set-map:${Boolean(open)}`);
      },
    },
  });
  fixture.state.ui.routeNavInfoRouteId = "johto_route_29";
  fixture.state.ui.routeNavDrawerOpen = true;
  fixture.state.ui.mapOpen = true;
  fixture.system.init();

  for (let index = 0; index < 3; index += 1) {
    fixture.documentRef.dispatchEvent("keydown", {
      key: "Escape",
      preventDefault() {},
    });
  }

  assert.deepEqual(calls, ["close-info", "set-drawer:false", "set-map:false"]);
});

test("outside pointerdown dismisses route nav drawer and info panels", () => {
  const fixture = createDomRouteNavFixture();
  fixture.state.ui.routeNavDrawerOpen = true;
  fixture.state.ui.routeNavInfoRouteId = "johto_route_29";
  fixture.system.init();

  fixture.documentRef
    .getElementById("outside-target")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("pointerdown", { bubbles: true }));

  assert.deepEqual(fixture.calls, [
    { type: "set-drawer", open: false },
    { type: "close-info" },
  ]);
  fixture.cleanup();
});

test("pointerdown inside the route nav drawer keeps drawer and info open", () => {
  const fixture = createDomRouteNavFixture();
  fixture.state.ui.routeNavDrawerOpen = true;
  fixture.state.ui.routeNavInfoRouteId = "johto_route_29";
  fixture.system.init();

  fixture.documentRef
    .getElementById("route-nav-drawer")
    ?.dispatchEvent(new fixture.dom.window.MouseEvent("pointerdown", { bubbles: true }));

  assert.deepEqual(fixture.calls, []);
  fixture.cleanup();
});

test("pointerdown on canvas-owned runtime overlays does not dismiss open team or ball menus", () => {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <canvas id="canvas"></canvas>
        <div id="team-context-menu"></div>
        <div id="ball-capture-menu"></div>
      </body>
    </html>
  `, { pretendToBeVisual: true });
  const previousElement = globalThis.Element;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;

  const documentRef = dom.window.document;
  const windowRef = dom.window;
  const canvas = documentRef.getElementById("canvas");
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 320,
    height: 200,
    right: 320,
    bottom: 200,
  });

  const teamContextMenuEl = documentRef.getElementById("team-context-menu");
  const ballCaptureMenuEl = documentRef.getElementById("ball-capture-menu");
  const calls = [];
  const state = {
    viewport: { width: 320, height: 200 },
    ui: {
      routeNavDrawerOpen: false,
      routeNavInfoRouteId: null,
      mapOpen: false,
      tutorialOpen: false,
      dialogueOpen: false,
      shopOpen: false,
      gachaOpen: false,
      appearanceOpen: false,
      pokedexOpen: false,
      boxesOpen: false,
      renameOpen: false,
      ballCaptureMenuOpen: true,
      teamContextMenuOpen: true,
      evolutionItemChoiceOpen: false,
      teamDragActive: false,
      teamDragMoved: false,
      canvasOverlayActionHitboxes: [
        { x: 24, y: 24, width: 160, height: 92, interactive: true },
      ],
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
    elements: {
      teamContextMenuEl,
      ballCaptureMenuEl,
    },
    actions: {
      clearTeamDragState() {},
      clearCanvasHoverState() {},
      render() {},
      handleRuntimeLifecycleSignal() {},
      closeTeamContextMenu() {
        calls.push("team");
        state.ui.teamContextMenuOpen = false;
      },
      closeBallCaptureMenu() {
        calls.push("ball");
        state.ui.ballCaptureMenuOpen = false;
      },
      toggleFullscreen() {
        return Promise.resolve();
      },
    },
  });

  system.init();
  canvas.dispatchEvent(new dom.window.MouseEvent("pointerdown", {
    bubbles: true,
    clientX: 80,
    clientY: 60,
  }));

  assert.deepEqual(calls, []);
  assert.equal(state.ui.teamContextMenuOpen, true);
  assert.equal(state.ui.ballCaptureMenuOpen, true);

  system.dispose();
  globalThis.Element = previousElement;
  globalThis.HTMLElement = previousHTMLElement;
  dom.window.close();
});

test("onboarding pulse is shown until the route header is opened once", () => {
  const fixture = createDomOnboardingFixture();
  const routeButton = fixture.documentRef.getElementById("route-nav-drawer-toggle");

  fixture.system.init();
  assert.equal(routeButton.classList.contains("is-onboarding-pulse"), true);
  assert.equal(routeButton.getAttribute("data-onboarding-visible"), "true");

  routeButton.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));

  assert.equal(fixture.state.ui.routeNavOnboardingSeen, true);
  assert.equal(routeButton.classList.contains("is-onboarding-pulse"), false);
  assert.equal(routeButton.getAttribute("data-onboarding-visible"), "false");
  fixture.cleanup();
});

test("onboarding pulse is shown until the action menu is opened once", () => {
  const fixture = createDomOnboardingFixture();
  const actionButton = fixture.documentRef.getElementById("action-dock-toggle");

  fixture.system.init();
  assert.equal(actionButton.classList.contains("is-onboarding-pulse"), true);
  assert.equal(actionButton.getAttribute("data-onboarding-visible"), "true");

  actionButton.dispatchEvent(new fixture.dom.window.MouseEvent("click", { bubbles: true }));

  assert.equal(fixture.state.ui.actionMenuOnboardingSeen, true);
  assert.equal(actionButton.classList.contains("is-onboarding-pulse"), false);
  assert.equal(actionButton.getAttribute("data-onboarding-visible"), "false");
  fixture.cleanup();
});

test("mobile topbar balls pill and centered menu controls forward to the capture actions", () => {
  const topbarBallsPillEl = new FakeEventTarget();
  const ballCaptureMenuCloseButtonEl = new FakeEventTarget();
  const ballCaptureTabPokeButtonEl = new FakeEventTarget();
  const ballCaptureTabSuperButtonEl = new FakeEventTarget();
  const ballCaptureTabHyperButtonEl = new FakeEventTarget();
  const calls = [];
  const fixture = createFixture({
    elements: {
      topbarBallsPillEl,
      ballCaptureMenuCloseButtonEl,
      ballCaptureTabPokeButtonEl,
      ballCaptureTabSuperButtonEl,
      ballCaptureTabHyperButtonEl,
    },
    actions: {
      openTopbarBallCaptureMenu() {
        calls.push("open");
      },
      closeBallCaptureMenu() {
        calls.push("close");
      },
      setBallCaptureMenuBallType(ballType) {
        calls.push(ballType);
      },
    },
  });
  fixture.system.init();

  topbarBallsPillEl.dispatchEvent("click");
  fixture.state.ui.ballCaptureMenuOpen = true;
  topbarBallsPillEl.dispatchEvent("click");
  ballCaptureMenuCloseButtonEl.dispatchEvent("click");
  ballCaptureTabPokeButtonEl.dispatchEvent("click");
  ballCaptureTabSuperButtonEl.dispatchEvent("click");
  ballCaptureTabHyperButtonEl.dispatchEvent("click");

  assert.deepEqual(calls, [
    "open",
    "close",
    "close",
    "poke_ball",
    "super_ball",
    "hyper_ball",
  ]);
});
