import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const GAME_RUNTIME_PATH = new URL("../game-runtime.js", import.meta.url);

test("game runtime wires the GitHub update checker during production bootstrap", async () => {
  const source = await fs.readFile(GAME_RUNTIME_PATH, "utf8");

  assert.equal(
    source.includes('import { initializeGithubUpdateChecker } from "./lib/github-update-checker.js";'),
    true,
  );
  assert.match(
    source,
    /if\s*\(\s*isProductionGithubPagesLocation\(window\.location\)\s*\)\s*\{\s*initializeGithubUpdateChecker\(\{\s*currentVersion:\s*APP_VERSION\s*\}\);\s*\}/,
  );
});
