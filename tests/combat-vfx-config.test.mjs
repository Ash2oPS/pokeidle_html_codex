import test from "node:test";
import assert from "node:assert/strict";

import {
  TYPE_VFX_DESCRIPTOR_BY_TYPE,
  getCombatVfxDescriptor,
  getLaserTypeVfxProfile,
  getProjectileTrailTypeVfxProfile,
  getProjectileTypeVfxProfile,
  normalizeCombatVfxType,
} from "../lib/combat-vfx-config.js";

test("combat vfx config exposes a single shared source of truth for all supported combat types", () => {
  assert.ok(TYPE_VFX_DESCRIPTOR_BY_TYPE.fire);
  assert.ok(TYPE_VFX_DESCRIPTOR_BY_TYPE.rock);
  assert.ok(TYPE_VFX_DESCRIPTOR_BY_TYPE.fairy);
  assert.equal(Object.isFrozen(TYPE_VFX_DESCRIPTOR_BY_TYPE), true);
});

test("combat vfx config normalizes unknown types to normal", () => {
  assert.equal(normalizeCombatVfxType("mystery"), "normal");
  assert.equal(getCombatVfxDescriptor("mystery").type, "normal");
});

test("combat vfx config keeps projectile, trail and laser profiles aligned per type", () => {
  const fireProjectile = getProjectileTypeVfxProfile("fire");
  const fireTrail = getProjectileTrailTypeVfxProfile("fire");
  const fireLaser = getLaserTypeVfxProfile("fire");

  assert.equal(fireProjectile.projectileKind, "ember_comet");
  assert.equal(fireTrail.mode, "ember");
  assert.equal(fireLaser.laserPattern, "flamethrower");
  assert.equal(fireLaser.beamPattern, "flame_band");

  const rockProjectile = getProjectileTypeVfxProfile("rock");
  const rockTrail = getProjectileTrailTypeVfxProfile("rock");
  const rockLaser = getLaserTypeVfxProfile("rock");

  assert.equal(rockProjectile.projectileKind, "rock_chunk");
  assert.equal(rockTrail.stampKind, "debris_chunk");
  assert.equal(rockLaser.laserPattern, "debris_stream");
});
