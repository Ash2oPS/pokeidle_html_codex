import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

test("critical UI source files stay free of mojibake markers", () => {
  const uiSourceFiles = [
    "game-runtime.js",
    "lib/gameplay-ui-config.js",
    "lib/pokedex-display-config.js",
    "lib/game-world-config.js",
    "lib/text-normalization.js",
    "lib/ui-text-normalization-runtime.js",
    "systems/ui/runtime-ui-dom-factory.js",
    "systems/ui/runtime-ui-interaction-system.js",
  ];
  const mojibakePattern = /(?:Ã.|Â.|â€™|â€œ|â€\u009d|â€“|â€”|â‚½|\ufffd)/;
  const offenders = [];

  for (const relativePath of uiSourceFiles) {
    const absolutePath = path.join(repoRoot, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    if (mojibakePattern.test(source)) {
      offenders.push(relativePath);
    }
  }

  assert.deepEqual(offenders, []);
});
