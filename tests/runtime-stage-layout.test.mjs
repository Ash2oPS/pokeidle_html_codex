import test from "node:test";
import assert from "node:assert/strict";

import {
  enrichRuntimeLayout,
  enrichViewportProfile,
  projectWorldToStage,
  resolveProductLayoutMode,
} from "../lib/runtime-stage-layout.js";

test("resolveProductLayoutMode promotes portrait and phone profiles to mobilePortrait", () => {
  assert.equal(resolveProductLayoutMode({ phone: true, portrait: false }), "mobilePortrait");
  assert.equal(resolveProductLayoutMode({ phone: false, portrait: true }), "mobilePortrait");
  assert.equal(resolveProductLayoutMode({ phone: false, portrait: false }), "desktopLandscape");
});

test("enrichViewportProfile annotates explicit product modes", () => {
  const profile = enrichViewportProfile({ compact: true, phone: false, portrait: false });

  assert.equal(profile.layoutMode, "desktopLandscape");
  assert.equal(profile.desktopLandscape, true);
  assert.equal(profile.mobilePortrait, false);
});

test("enrichRuntimeLayout derives safe areas, density and world rect", () => {
  const layout = enrichRuntimeLayout({
    viewportProfile: { compact: true, phone: true, portrait: true },
    safeBounds: {
      left: 12,
      top: 88,
      right: 378,
      bottom: 760,
      width: 366,
      height: 672,
    },
  }, {
    viewport: { width: 390, height: 844 },
  });

  assert.equal(layout.layoutMode, "mobilePortrait");
  assert.equal(layout.density, "compact");
  assert.equal(layout.modalBehavior, "fullscreen-preferred");
  assert.deepEqual(layout.safeAreas, {
    top: 88,
    right: 12,
    bottom: 84,
    left: 12,
  });
  assert.equal(layout.worldSafeRect.width, 366);
  assert.equal(layout.regions.topHud.height, 88);
});

test("projectWorldToStage converts world coordinates into stage-local and client points", () => {
  const projection = projectWorldToStage({
    worldX: 480,
    worldY: 270,
    viewport: { width: 960, height: 540 },
    stageRect: { left: 100, top: 40, width: 960, height: 540 },
    worldSafeRect: { left: 12, top: 88, right: 948, bottom: 500 },
  });

  assert.equal(projection.stageX, 480);
  assert.equal(projection.stageY, 270);
  assert.equal(projection.clientX, 580);
  assert.equal(projection.clientY, 310);
  assert.equal(projection.clamped, false);
  assert.equal(projection.visible, true);
});

test("projectWorldToStage clamps to the configured world safe rect", () => {
  const projection = projectWorldToStage({
    worldX: 8,
    worldY: 8,
    viewport: { width: 960, height: 540 },
    stageRect: { left: 0, top: 0, width: 960, height: 540 },
    worldSafeRect: { left: 32, top: 64, right: 928, bottom: 476 },
  });

  assert.equal(projection.stageX, 32);
  assert.equal(projection.stageY, 64);
  assert.equal(projection.clamped, true);
});
