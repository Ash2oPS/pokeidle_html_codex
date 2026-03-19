import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function collectFiles(rootDir) {
  const files = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!/\.(m?js)$/i.test(entry.name)) {
        continue;
      }
      files.push(fullPath);
    }
  }
  return files;
}

test("raw game design config is only imported by the runtime adapter", () => {
  const codeRoots = [
    path.join(repoRoot, "lib"),
    path.join(repoRoot, "core"),
    path.join(repoRoot, "systems"),
    path.join(repoRoot, "domain"),
    path.join(repoRoot, "tests"),
    path.join(repoRoot, "game-runtime.js"),
  ];
  const jsFiles = [];
  for (const codeRoot of codeRoots) {
    if (!fs.existsSync(codeRoot)) {
      continue;
    }
    const stat = fs.statSync(codeRoot);
    if (stat.isDirectory()) {
      jsFiles.push(...collectFiles(codeRoot));
      continue;
    }
    jsFiles.push(codeRoot);
  }

  const offenders = [];
  const directImportPattern = /(?:from\s+["'][^"']*game-design-config\.js["']|import\s*["'][^"']*game-design-config\.js["'])/;
  for (const filePath of jsFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    if (!directImportPattern.test(source)) {
      continue;
    }
    const normalized = path.relative(repoRoot, filePath).replace(/\\/g, "/");
    if (normalized === "lib/game-design-config-runtime.js") {
      continue;
    }
    offenders.push(normalized);
  }

  assert.deepEqual(offenders, []);
});

test("legacy mobile store settings system stays removed", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "game-settings.json")), false);
  assert.equal(fs.existsSync(path.join(repoRoot, "lib", "game-settings-runtime.js")), false);
});

test("repo-level AI guardrail docs exist", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(repoRoot, "docs", "ai-guidelines.md")), true);
  assert.equal(fs.existsSync(path.join(repoRoot, "game-design-config.js")), true);
});
