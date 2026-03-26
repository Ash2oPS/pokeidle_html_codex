import test from "node:test";
import assert from "node:assert/strict";

import {
  collectOfflineShellUrls,
  createOfflineShellManifest,
  createServiceWorkerSource,
} from "../scripts/build-web-dist.mjs";

test("web build shell manifest includes bootstrap code and excludes maintenance config", async () => {
  const shellUrls = await collectOfflineShellUrls();

  assert.equal(shellUrls.includes("./index.html"), true);
  assert.equal(shellUrls.includes("./game.js"), true);
  assert.equal(shellUrls.includes("./game-runtime.js"), true);
  assert.equal(shellUrls.includes("./lib/maintenance-bootstrap.js"), true);
  assert.equal(shellUrls.includes("./vendor/pako.min.js"), true);
  assert.equal(shellUrls.includes("./maintenance-config.js"), false);
});

test("web build service worker source is versioned and bypasses maintenance config", () => {
  const manifest = createOfflineShellManifest({
    appVersion: "9.8.7",
    shellUrls: ["./", "./index.html", "./game.js"],
  });
  const source = createServiceWorkerSource(manifest);

  assert.match(source, /pokeidle-shell-v9\.8\.7/);
  assert.match(source, /pokeidle-runtime-v9\.8\.7/);
  assert.match(source, /maintenance-config\.js/);
  assert.match(source, /request\.cache/);
  assert.match(source, /cacheName\.startsWith\(CACHE_PREFIX\)/);
});
