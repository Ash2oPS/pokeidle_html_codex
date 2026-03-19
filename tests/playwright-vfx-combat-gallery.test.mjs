import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCombatVfxSeedSave,
} from "../scripts/testing/playwright/vfx-combat-gallery-helpers.mjs";
import { matchesStateCriteria } from "../scripts/testing/playwright/web-game-playwright-client.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

test("vfx combat seed builder normalizes team ids and keeps combat entry state", () => {
  const seed = buildCombatVfxSeedSave({
    teamIds: [104, 100, 104, 105, 101, 106, 103],
    currentRouteId: "kanto_route_1",
    lastTickEpochMs: 123456,
  });

  assert.deepEqual(seed.team, [104, 100, 105, 101, 106, 103]);
  assert.equal(seed.starter_chosen, true);
  assert.equal(seed.current_route_id, "kanto_route_1");
  assert.equal(seed.last_tick_epoch_ms, 123456);
  assert.equal(seed.pokemon_entities["104"].entity_unlocked, true);
  assert.equal(seed.pokemon_entities["103"].level, 20);
});

test("vfx combat state matcher handles nested length and range criteria", () => {
  const state = {
    render_scale: 1,
    active_projectiles: [{}, {}, {}, {}],
    active_lasers: [{}, {}, {}],
    enemy: { attack_mode: "laser" },
  };

  assert.equal(
    matchesStateCriteria(state, {
      render_scale: 1,
      "active_projectiles.length": { min: 3 },
      "active_lasers.length": { eq: 3 },
      "enemy.attack_mode": { includes: "las" },
    }),
    true,
  );
});

test("vfx combat gallery action files cover the expected capture scenes", () => {
  const projectile = readJson("scripts/testing/playwright/actions/vfx-combat-projectile.json");
  const laser = readJson("scripts/testing/playwright/actions/vfx-combat-laser.json");
  const mixed = readJson("scripts/testing/playwright/actions/vfx-combat-mixed.json");

  assert.deepEqual(
    projectile.steps.map((step) => step.captureName).filter(Boolean),
    ["projectile-matrix", "six-projectiles-stress"],
  );
  assert.deepEqual(
    laser.steps.map((step) => step.captureName).filter(Boolean),
    ["laser-matrix"],
  );
  assert.deepEqual(
    mixed.steps.map((step) => step.captureName).filter(Boolean),
    ["mixed-three-projectiles-three-lasers"],
  );
  assert.deepEqual(projectile.steps[0].waitForState, {
    render_scale: 1,
    "active_projectiles.length": { min: 1 },
    "floating_damage_texts.length": { max: 0 },
    "ko_transition.active": false,
    "vfx_render_debug.projectile.active_count": { min: 1 },
  });
  assert.deepEqual(projectile.steps[1].waitForState, {
    render_scale: 1,
    "active_projectiles.length": { min: 1 },
    "floating_damage_texts.length": { max: 0 },
    "ko_transition.active": false,
    "vfx_render_debug.projectile.sprite_cache_size": { min: 3 },
  });
  assert.deepEqual(laser.steps[0].waitForState, {
    render_scale: 1,
    "active_lasers.length": { min: 3 },
    "ko_transition.active": false,
    "vfx_render_debug.laser.active_count": { min: 3 },
  });
  assert.deepEqual(mixed.steps[0].waitForState, {
    render_scale: 1,
    "active_projectiles.length": { min: 1 },
    "active_lasers.length": { min: 1 },
    "ko_transition.active": false,
    "vfx_render_debug.projectile.active_count": { min: 1 },
    "vfx_render_debug.laser.active_count": { min: 1 },
  });
});

test("vfx combat gallery scripts are wired in package.json", () => {
  const pkg = readJson("package.json");
  assert.equal(pkg.scripts["test:visual:gallery:vfx:combat:desktop"], "powershell -ExecutionPolicy Bypass -File scripts/testing/playwright/desktop-vfx-combat-gallery.ps1");
  assert.equal(pkg.scripts["test:visual:gallery:vfx:combat:mobile"], "powershell -ExecutionPolicy Bypass -File scripts/testing/playwright/mobile-vfx-combat-gallery.ps1");
  assert.match(pkg.scripts["test:perf:web-game:vfx-combat:regression"], /validate-runtime-performance\.mjs/);
});
