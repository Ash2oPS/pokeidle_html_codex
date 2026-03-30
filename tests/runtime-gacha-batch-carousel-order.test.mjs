import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

test("batch gacha carousel targets the first reward so the first reveal matches the final silhouette", () => {
  const source = readGameRuntimeSource();

  assert.match(
    source,
    /const reward = isBatchSpin\s*\?\s*\(rewards\[0\] \|\| rewards\[rewards\.length - 1\] \|\| null\)\s*:\s*\(rewards\[rewards\.length - 1\] \|\| rewards\[0\] \|\| null\);/,
  );
});
