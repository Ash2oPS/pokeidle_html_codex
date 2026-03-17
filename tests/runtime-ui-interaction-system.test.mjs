import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeUiInteractionSystemPath = path.resolve(
  __dirname,
  "../systems/ui/runtime-ui-interaction-system.js",
);

test("runtime ui interaction system returns evolution animation helpers", () => {
  const source = fs.readFileSync(runtimeUiInteractionSystemPath, "utf8");

  assert.match(
    source,
    /return\s*\{[\s\S]*\bactivateNextEvolutionAnimationIfNeeded\b[\s\S]*\bupdateEvolutionAnimation\b[\s\S]*\};\\n\}"/,
  );
});

test("runtime ui interaction system prefers ruby_sapphire for offline Hoenn species sprites", () => {
  const source = fs.readFileSync(runtimeUiInteractionSystemPath, "utf8");

  assert.match(source, /function getPokedexPreferredOfflineVariantId[\s\S]*return \\\"ruby_sapphire\\\";/);
  assert.doesNotMatch(source, /function getPokedexPreferredOfflineVariantId[\s\S]*return \\\"emerald\\\";/);
});
