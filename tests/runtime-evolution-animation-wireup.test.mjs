import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

test("runtime update wires evolution animation updates to runtime ui interaction system", () => {
  const source = readGameRuntimeSource();
  assert.match(source, /const runtimeUiInteraction = getRuntimeUiInteractionSystem\(\);/);
  assert.match(source, /runtimeUiInteraction\.updateEvolutionAnimation\(deltaMs\)/);
  assert.doesNotMatch(source, /runtimeRenderSystem\.updateEvolutionAnimation\(deltaMs\)/);
});
