import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

test("runtime wires evolution-ready notifications to the system notification bridge", () => {
  const source = readGameRuntimeSource();
  assert.match(source, /function isEvolutionReadySystemNotificationEnabled\(\)/);
  assert.match(source, /function notifyWindowsEvolutionReady\(candidate = \{\}\)/);
  assert.match(source, /sendWindowsSystemNotification\("Evolution prete", body,/);
  assert.match(
    source,
    /notifyWindowsEvolutionReady\(\{\s*fromId,\s*toId,\s*fromNameFr:\s*fromName,\s*toNameFr:\s*toName,\s*\}\);/,
  );
});
