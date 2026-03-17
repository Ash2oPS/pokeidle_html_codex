import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexHtmlPath = path.resolve(__dirname, "../index.html");

test("capture root contains stage shell, world ui layer and notifications", () => {
  const source = fs.readFileSync(indexHtmlPath, "utf8");

  const captureRootIndex = source.indexOf('id="game-capture-root"');
  const stageIndex = source.indexOf('id="game-stage"');
  const worldUiLayerIndex = source.indexOf('id="world-ui-layer"');
  const notificationIndex = source.indexOf('id="notification-stack"');

  assert.notEqual(captureRootIndex, -1);
  assert.notEqual(stageIndex, -1);
  assert.notEqual(worldUiLayerIndex, -1);
  assert.notEqual(notificationIndex, -1);
  assert.ok(captureRootIndex < stageIndex);
  assert.ok(stageIndex < worldUiLayerIndex);
  assert.ok(worldUiLayerIndex < notificationIndex);
});
