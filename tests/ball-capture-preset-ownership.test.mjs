import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

test("ball capture presets evaluate owned state on the current species", () => {
  const source = readGameRuntimeSource();
  const functionStart = source.indexOf("function shouldCaptureEnemyWithBallType(ballType, enemy) {");
  const functionEnd = source.indexOf("\nfunction setActiveBallType(ballType) {", functionStart);

  assert.ok(functionStart >= 0);
  assert.ok(functionEnd > functionStart);

  const functionBody = source.slice(functionStart, functionEnd);

  assert.match(functionBody, /const speciesOwned = enemyId > 0 \? isPokemonEntityUnlockedById\(enemyId\) : false;/);
  assert.match(functionBody, /if \(rules\[BALL_CAPTURE_RULE_CAPTURE_UNOWNED\] && !speciesOwned\) \{/);
  assert.match(functionBody, /if \(rules\[BALL_CAPTURE_RULE_CAPTURE_OWNED\] && speciesOwned\) \{/);
  assert.doesNotMatch(functionBody, /isEvolutionFamilyOwned\(enemyId\)/);
});
