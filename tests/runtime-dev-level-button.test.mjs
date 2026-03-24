import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

function readStylesSource() {
  return readFileSync(new URL("../styles.css", import.meta.url), "utf8");
}

test("dev level-all button wires the runtime bindings required by the boost action", () => {
  const source = readGameRuntimeSource();
  const blockStart = source.indexOf("bindings: buildRuntimeBindingSnapshot(RUNTIME_UI_INTERACTION_BINDING_KEYS, {");
  const blockEnd = source.indexOf("      }),", blockStart);

  assert.ok(blockStart >= 0);
  assert.ok(blockEnd > blockStart);

  const bindingsBlock = source.slice(blockStart, blockEnd);

  assert.match(bindingsBlock, /ensureAppearanceEditorUnlockedFromProgress,/);
  assert.match(bindingsBlock, /enqueueEvolutionReadyNotification,/);
  assert.match(bindingsBlock, /findNextEligibleEvolution,/);
  assert.match(bindingsBlock, /queueTeamLevelUpEffects,/);
  assert.match(bindingsBlock, /rebuildTeamAndSyncBattle,/);
  assert.match(bindingsBlock, /persistSaveData,/);
  assert.match(bindingsBlock, /setEntityLevel,/);
});

test("dev level-all button stays hidden while starter or tutorial blockers are open", () => {
  const source = readStylesSource();

  assert.match(source, /#starter-modal:not\(\.hidden\)\s*~\s*\.dev-level-all-button/);
  assert.match(source, /#tutorial-modal:not\(\.hidden\)\s*~\s*\.dev-level-all-button/);
});
