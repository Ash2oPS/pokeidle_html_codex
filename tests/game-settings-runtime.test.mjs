import test from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeGameSettings,
  isGameMaintenanceActive,
  getMaintenanceMessage,
  loadGameSettings,
} from "../lib/game-settings-runtime.js";

test("sanitizeGameSettings keeps required store redirect fields and default mirror", () => {
  const settings = sanitizeGameSettings({
    maintenance: {
      enabled: false,
      blockCurrentVersion: false,
      blockedVersions: ["0.1.28", "0.1.28", "  "],
      message: "Maintenance en cours",
    },
    store: {
      playStoreUrl: " https://play.google.com/store/apps/details?id=com.demo ",
      appStoreUrl: "https://apps.apple.com/app/id123",
      redirectAfterClicks: 3,
      redirectAfterClickDelayMs: 4500,
    },
  });

  assert.equal(settings.store.redirectAfterClicks, 3);
  assert.equal(settings.store.redirectAfterClickDelayMs, 4500);
  assert.equal(settings.default.store.redirectAfterClicks, 3);
  assert.equal(settings.default.store.redirectAfterClickDelayMs, 4500);
  assert.deepEqual(settings.maintenance.blockedVersions, ["0.1.28"]);
  assert.deepEqual(settings.default.maintenance.blockedVersions, ["0.1.28"]);
});

test("isGameMaintenanceActive supports global and current-version blocking", () => {
  const globallyBlocked = sanitizeGameSettings({
    maintenance: { enabled: true, blockCurrentVersion: false, blockedVersions: [] },
  });
  assert.equal(isGameMaintenanceActive(globallyBlocked, "0.1.28"), true);

  const currentVersionBlocked = sanitizeGameSettings({
    maintenance: { enabled: false, blockCurrentVersion: true, blockedVersions: [] },
  });
  assert.equal(isGameMaintenanceActive(currentVersionBlocked, "0.1.28"), true);

  const listedVersionBlocked = sanitizeGameSettings({
    maintenance: { enabled: false, blockCurrentVersion: false, blockedVersions: ["0.1.28"] },
  });
  assert.equal(isGameMaintenanceActive(listedVersionBlocked, "0.1.28"), true);
  assert.equal(isGameMaintenanceActive(listedVersionBlocked, "0.1.29"), false);
});

test("getMaintenanceMessage falls back to a safe default", () => {
  const custom = sanitizeGameSettings({
    maintenance: { message: "Le jeu est indisponible temporairement." },
  });
  assert.equal(getMaintenanceMessage(custom), "Le jeu est indisponible temporairement.");

  const fallback = sanitizeGameSettings({
    maintenance: { message: "   " },
  });
  assert.equal(
    getMaintenanceMessage(fallback),
    "Le jeu est en maintenance. Merci de reessayer plus tard.",
  );

  assert.equal(
    getMaintenanceMessage({ maintenance: { message: "" } }),
    "Le jeu est en maintenance. Merci de reessayer plus tard.",
  );
});

test("loadGameSettings returns safe fallback when fetch fails", async () => {
  const fetchFn = async () => ({
    ok: false,
    async json() {
      return {};
    },
  });

  const loaded = await loadGameSettings({ fetchFn, path: "./missing-settings.json" });
  assert.equal(loaded.loaded, false);
  assert.equal(loaded.source, "./missing-settings.json");
  assert.equal(isGameMaintenanceActive(loaded.settings, "0.1.28"), false);
  assert.equal(loaded.settings.store.redirectAfterClicks, -1);
  assert.equal(loaded.settings.store.redirectAfterClickDelayMs, -1);
});
