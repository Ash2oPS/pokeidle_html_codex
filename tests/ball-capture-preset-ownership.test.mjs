import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

test("ball capture presets evaluate owned state on the evolution family", () => {
  const source = readGameRuntimeSource();
  const functionStart = source.indexOf("function shouldCaptureEnemyWithBallType(ballType, enemy) {");
  const functionEnd = source.indexOf("\nfunction setActiveBallType(ballType) {", functionStart);

  assert.ok(functionStart >= 0);
  assert.ok(functionEnd > functionStart);

  const functionBody = source.slice(functionStart, functionEnd);

  assert.match(functionBody, /const familyOwned = enemyId > 0 \? isEvolutionFamilyOwned\(enemyId\) : false;/);
  assert.match(functionBody, /if \(rules\[BALL_CAPTURE_RULE_CAPTURE_UNOWNED\] && !familyOwned\) \{/);
  assert.match(functionBody, /if \(rules\[BALL_CAPTURE_RULE_CAPTURE_OWNED\] && familyOwned\) \{/);
  assert.doesNotMatch(functionBody, /isPokemonEntityUnlockedById\(enemyId\)/);
});
