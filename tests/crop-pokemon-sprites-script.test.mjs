import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const cropScriptPath = path.join(repoRoot, "scripts", "crop_pokemon_sprites.py");
const tightPngSourcePath = path.join(
  repoRoot,
  "pokemon_data",
  "100_voltorb",
  "sprites",
  "100_voltorb_custom_100.png",
);
const paddedGifSourcePath = path.join(
  repoRoot,
  "pokemon_data",
  "100_voltorb",
  "sprites",
  "100_voltorb_black_white_front.gif",
);

function makeTempSpriteRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pokeidle-sprite-crop-"));
  const spriteDir = path.join(root, "pokemon_data", "999_testmon", "sprites");
  fs.mkdirSync(spriteDir, { recursive: true });
  return { root, spriteDir };
}

function runPython(args, options = {}) {
  return spawnSync("python", args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createPaddedPng(sourcePath, destinationPath) {
  const script = [
    "from PIL import Image",
    "import sys",
    "source_path, destination_path = sys.argv[1], sys.argv[2]",
    "with Image.open(source_path) as image:",
    "    rgba = image.convert('RGBA')",
    "    padded = Image.new('RGBA', (rgba.width + 6, rgba.height + 4), (0, 0, 0, 0))",
    "    padded.paste(rgba, (3, 2))",
    "    padded.save(destination_path)",
  ].join("\n");
  const result = runPython(["-c", script, sourcePath, destinationPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test("crop_pokemon_sprites reports GIF frame padding that still requires runtime tight fit", () => {
  const { root, spriteDir } = makeTempSpriteRoot();
  fs.copyFileSync(tightPngSourcePath, path.join(spriteDir, "tight.png"));
  fs.copyFileSync(paddedGifSourcePath, path.join(spriteDir, "anim.gif"));

  const result = runPython([cropScriptPath, "--root", path.join(root, "pokemon_data"), "--dry-run"]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /croppable_png:\s+0/);
  assert.match(result.stdout, /gif_runtime_tight_fit:\s+1/);
});

test("crop_pokemon_sprites fails validation when a PNG can still be cropped", () => {
  const { root, spriteDir } = makeTempSpriteRoot();
  createPaddedPng(tightPngSourcePath, path.join(spriteDir, "croppable.png"));

  const result = runPython([
    cropScriptPath,
    "--root",
    path.join(root, "pokemon_data"),
    "--dry-run",
    "--fail-on-croppable-png",
  ]);

  assert.equal(result.status, 3, result.stderr || result.stdout);
  assert.match(result.stdout, /croppable_png:\s+1/);
  assert.match(result.stdout, /\[error\] Croppable PNG sprites detected\./);
});
