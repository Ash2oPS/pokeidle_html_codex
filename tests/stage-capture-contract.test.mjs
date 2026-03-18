import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { mountRuntimeUi } from "../systems/ui/runtime-ui-dom-factory.js";

test("runtime DOM factory mounts capture root with stage shell and notifications", () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='runtime-ui-root'></div></body></html>");
  const { document } = dom.window;

  mountRuntimeUi(document);

  const captureRootEl = document.getElementById("game-capture-root");
  const stageEl = document.getElementById("game-stage");
  const worldUiLayerEl = document.getElementById("world-ui-layer");
  const notificationStackEl = document.getElementById("notification-stack");

  assert.ok(captureRootEl);
  assert.ok(stageEl);
  assert.ok(worldUiLayerEl);
  assert.ok(notificationStackEl);

  assert.equal(captureRootEl.contains(stageEl), true);
  assert.equal(stageEl.contains(worldUiLayerEl), true);
  assert.equal(captureRootEl.contains(notificationStackEl), true);
});
