import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeNotificationSystem } from "../systems/notifications/runtime-notification-system.js";

function createFixture() {
  const state = {
    simulationIdleMode: false,
    timeMs: 1234,
    notifications: {
      items: [],
      nextId: 1,
      dirty: false,
    },
  };

  const calls = {
    renderStack: 0,
  };

  const system = createRuntimeNotificationSystem({
    state,
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    normalizeUiDisplayText: (value) => String(value || "").replace(/\s+/g, " ").trim(),
    nextNotificationId: () => {
      const id = state.notifications.nextId;
      state.notifications.nextId += 1;
      return id;
    },
    renderNotificationStackUi: () => {
      calls.renderStack += 1;
    },
  });

  return { state, calls, system };
}

test("pushTemporaryNotification creates a notification and renders stack", () => {
  const fixture = createFixture();

  const id = fixture.system.pushTemporaryNotification("Message test", 100, {
    tone: "first",
    title: "Titre",
    pokemonId: 25,
    pokemonIsShiny: true,
  });

  assert.equal(id, 1);
  assert.equal(fixture.state.notifications.items.length, 1);
  assert.equal(fixture.calls.renderStack, 1);
  assert.equal(fixture.state.notifications.dirty, true);

  const item = fixture.state.notifications.items[0];
  assert.equal(item.id, 1);
  assert.equal(item.type, "temporary");
  assert.equal(item.tone, "first");
  assert.equal(item.title, "Titre");
  assert.equal(item.message, "Message test");
  assert.equal(item.pokemonId, 25);
  assert.equal(item.pokemonIsShiny, true);
  assert.equal(item.expiresAt, fixture.state.timeMs + 650);
});

test("pushTemporaryNotification ignores empty input and idle simulation mode", () => {
  const fixture = createFixture();

  assert.equal(fixture.system.pushTemporaryNotification("   "), null);
  assert.equal(fixture.state.notifications.items.length, 0);
  assert.equal(fixture.calls.renderStack, 0);

  fixture.state.simulationIdleMode = true;
  assert.equal(fixture.system.pushTemporaryNotification("Should skip"), null);
  assert.equal(fixture.state.notifications.items.length, 0);
  assert.equal(fixture.calls.renderStack, 0);
});

test("setTopMessage normalizes text and delegates to temporary notifications", () => {
  const fixture = createFixture();

  const id = fixture.system.setTopMessage("  Salut    le  monde  ", 1900);

  assert.equal(id, 1);
  assert.equal(fixture.calls.renderStack, 1);
  assert.equal(fixture.state.notifications.items.length, 1);
  assert.equal(fixture.state.notifications.items[0].message, "Salut le monde");
  assert.equal(fixture.state.notifications.items[0].tone, "info");
});
