import test from "node:test";
import assert from "node:assert/strict";
import {
  loadStepsFromSource,
  parseArgs,
  sanitizeCaptureName,
} from "../scripts/testing/playwright/web-game-playwright-client.mjs";

test("loadStepsFromSource accepts object payloads with steps", () => {
  const steps = loadStepsFromSource(
    JSON.stringify({
      steps: [
        { waitMs: 250 },
        { clickSelector: "#map-btn" },
        { setScrollTop: { selector: "#pokedex-grid", top: 1500 } },
        { evaluate: { expression: "return arg;", arg: { ok: true } } },
        { dispatch: { target: "document", type: "pokeidle:test" } },
      ],
    }),
  );

  assert.deepEqual(steps, [
    { waitMs: 250 },
    { clickSelector: "#map-btn" },
    { setScrollTop: { selector: "#pokedex-grid", top: 1500 } },
    { evaluate: { expression: "return arg;", arg: { ok: true } } },
    { dispatch: { target: "document", type: "pokeidle:test" } },
  ]);
});

test("sanitizeCaptureName normalizes gallery filenames", () => {
  assert.equal(sanitizeCaptureName("  Phone Map Modal  "), "phone-map-modal");
  assert.equal(sanitizeCaptureName("desktop_idle"), "desktop_idle");
  assert.equal(sanitizeCaptureName(""), "");
});

test("parseArgs keeps selector-driven action files compatible", () => {
  const args = parseArgs([
    "node",
    "client.mjs",
    "--url",
    "http://127.0.0.1:5326",
    "--actions-file",
    "gallery.json",
    "--screenshot-dir",
    "output/ui-state-gallery",
  ]);

  assert.equal(args.url, "http://127.0.0.1:5326");
  assert.equal(args.actionsFile, "gallery.json");
  assert.equal(args.screenshotDir, "output/ui-state-gallery");
  assert.equal(args.viewportWidth, 1366);
  assert.equal(args.viewportHeight, 768);
});
