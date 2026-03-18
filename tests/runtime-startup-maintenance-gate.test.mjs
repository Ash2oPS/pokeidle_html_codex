import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

test("runtime startup keeps maintenance gate bootstrap flow", () => {
  const source = readGameRuntimeSource();
  assert.match(source, /async function bootstrapRuntimeStartup\(\)/);
  assert.match(source, /loadGameSettings\(\)/);
  assert.match(source, /isProductionGithubPagesLocation\(window\.location\)/);
  assert.match(source, /isGameMaintenanceActive\(gameSettingsLoad\.settings,\s*APP_VERSION\)/);
  assert.match(source, /if\s*\(\s*isProductionRuntime\s*&&\s*maintenanceActive\s*\)/);
  assert.match(source, /showLoadingScreen\(maintenanceMessage,\s*\{\s*disablePokeballSpin:\s*true\s*\}\)/);
});
