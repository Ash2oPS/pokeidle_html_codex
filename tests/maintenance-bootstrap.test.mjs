import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

import {
  BOOT_VENDOR_SCRIPTS,
  DEFAULT_MAINTENANCE_MESSAGE,
  bootstrapGame,
  loadBootVendorScripts,
  loadMaintenanceConfig,
  registerOfflineServiceWorkerIfNeeded,
  sanitizeMaintenanceConfig,
  shouldRegisterOfflineServiceWorker,
  shouldShowMaintenanceScreen,
  waitForOfflineServiceWorkerControl,
} from "../lib/maintenance-bootstrap.js";

const GAME_BOOTSTRAP_PATH = resolve(process.cwd(), "game.js");

function createBootDom(url = "https://ash2ops.github.io/pokeidle_html_codex/") {
  return new JSDOM(
    `<!doctype html>
    <html lang="fr">
      <body>
        <div id="runtime-ui-root">
          <div id="loading-screen" class="loading-screen is-visible" aria-label="Chargement">
            <div class="loading-screen-core">
              <div class="loading-screen-flash"></div>
              <div class="loading-pokeball"></div>
              <p id="loading-screen-text">Chargement...</p>
            </div>
          </div>
        </div>
      </body>
    </html>`,
    { url },
  );
}

test("sanitizeMaintenanceConfig normalizes invalid and custom values", () => {
  const fallbackConfig = sanitizeMaintenanceConfig({
    enabled: "true",
    message: "   ",
  });
  assert.deepEqual(fallbackConfig, {
    enabled: false,
    message: DEFAULT_MAINTENANCE_MESSAGE,
  });

  const customConfig = sanitizeMaintenanceConfig({
    enabled: true,
    message: "  Maintenance custom\nMerci de patienter.  ",
  });
  assert.deepEqual(customConfig, {
    enabled: true,
    message: "Maintenance custom\nMerci de patienter.",
  });
});

test("loadMaintenanceConfig fails open when maintenance-config.js cannot be loaded", async () => {
  const warnings = [];
  const config = await loadMaintenanceConfig({
    maintenanceConfigImporter: async () => {
      throw new Error("broken module");
    },
    warn: (...args) => warnings.push(args),
  });

  assert.deepEqual(config, {
    enabled: false,
    message: DEFAULT_MAINTENANCE_MESSAGE,
  });
  assert.equal(warnings.length, 1);
  assert.match(String(warnings[0][0]), /\[maintenance\]/);
});

test("shouldShowMaintenanceScreen stays prod-only and supports local preview", () => {
  assert.equal(shouldShowMaintenanceScreen({
    locationLike: new URL("https://ash2ops.github.io/pokeidle_html_codex/"),
    config: sanitizeMaintenanceConfig({ enabled: true }),
  }), true);

  assert.equal(shouldShowMaintenanceScreen({
    locationLike: new URL("https://example.com/pokeidle/"),
    config: sanitizeMaintenanceConfig({ enabled: true }),
  }), false);

  assert.equal(shouldShowMaintenanceScreen({
    locationLike: new URL("http://127.0.0.1:8080/"),
    config: sanitizeMaintenanceConfig({ enabled: true }),
  }), false);

  assert.equal(shouldShowMaintenanceScreen({
    locationLike: new URL("http://127.0.0.1:8080/?previewMaintenance=1"),
    config: sanitizeMaintenanceConfig({ enabled: false }),
  }), true);
});

test("shouldRegisterOfflineServiceWorker stays limited to production GitHub Pages", () => {
  assert.equal(shouldRegisterOfflineServiceWorker({
    location: new URL("https://ash2ops.github.io/pokeidle_html_codex/"),
    navigator: {
      serviceWorker: {
        register() {},
      },
    },
  }), true);

  assert.equal(shouldRegisterOfflineServiceWorker({
    location: new URL("http://127.0.0.1:8080/"),
    navigator: {
      serviceWorker: {
        register() {},
      },
    },
  }), false);
});

test("waitForOfflineServiceWorkerControl resolves when controllerchange fires", async () => {
  let controller = null;
  let controllerChangeHandler = null;
  const container = {
    get controller() {
      return controller;
    },
    ready: Promise.resolve({}),
    addEventListener(eventName, handler) {
      if (eventName === "controllerchange") {
        controllerChangeHandler = handler;
      }
    },
    removeEventListener() {},
  };

  const task = waitForOfflineServiceWorkerControl(container, 100);
  controller = { scriptURL: "https://ash2ops.github.io/pokeidle_html_codex/service-worker.js" };
  controllerChangeHandler?.();

  assert.equal(await task, true);
});

test("registerOfflineServiceWorkerIfNeeded registers on production GitHub Pages only", async () => {
  const registrations = [];
  const windowRef = {
    location: new URL("https://ash2ops.github.io/pokeidle_html_codex/"),
    navigator: {
      serviceWorker: {
        controller: { active: true },
        ready: Promise.resolve({}),
        async register(scriptPath) {
          registrations.push(scriptPath);
          return { scope: "https://ash2ops.github.io/pokeidle_html_codex/" };
        },
        addEventListener() {},
        removeEventListener() {},
      },
    },
  };

  const registration = await registerOfflineServiceWorkerIfNeeded({ windowRef });
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0], "./service-worker.js");
  assert.equal(registration?.scope, "https://ash2ops.github.io/pokeidle_html_codex/");

  const skippedRegistration = await registerOfflineServiceWorkerIfNeeded({
    windowRef: {
      location: new URL("http://127.0.0.1:8080/"),
      navigator: windowRef.navigator,
    },
  });
  assert.equal(skippedRegistration, null);
});

test("loadBootVendorScripts loads the boot vendors sequentially", async () => {
  const loadedScripts = [];
  const result = await loadBootVendorScripts({
    scriptLoader: async (scriptPath) => {
      loadedScripts.push(scriptPath);
    },
  });

  assert.deepEqual(loadedScripts, BOOT_VENDOR_SCRIPTS);
  assert.deepEqual(result, [...BOOT_VENDOR_SCRIPTS]);
});

test("bootstrapGame stops before vendors/runtime when production maintenance is active", async () => {
  const dom = createBootDom("https://ash2ops.github.io/pokeidle_html_codex/");
  const loadedScripts = [];
  let runtimeLoadCount = 0;
  const maintenanceMessage = "Maintenance custom\nMerci de revenir plus tard.";

  const result = await bootstrapGame({
    windowRef: dom.window,
    documentRef: dom.window.document,
    maintenanceConfigImporter: async () => ({
      MAINTENANCE_CONFIG: {
        enabled: true,
        message: maintenanceMessage,
      },
    }),
    scriptLoader: async (scriptPath) => {
      loadedScripts.push(scriptPath);
    },
    runtimeModuleImporter: async () => {
      runtimeLoadCount += 1;
    },
  });

  const loadingScreen = dom.window.document.getElementById("loading-screen");
  const loadingText = dom.window.document.getElementById("loading-screen-text");
  assert.equal(result.mode, "maintenance");
  assert.equal(result.message, maintenanceMessage);
  assert.deepEqual(loadedScripts, []);
  assert.equal(runtimeLoadCount, 0);
  assert.ok(loadingScreen.classList.contains("maintenance-screen"));
  assert.equal(loadingScreen.dataset.bootMode, "maintenance");
  assert.equal(loadingScreen.getAttribute("aria-label"), "Maintenance");
  assert.equal(loadingText.textContent, maintenanceMessage);
  assert.deepEqual(JSON.parse(dom.window.render_game_to_text()), {
    mode: "maintenance",
    boot_phase: "maintenance",
    loading_overlay_visible: true,
    visual_ready: true,
    message: maintenanceMessage,
  });
});

test("bootstrapGame ignores enabled maintenance in local/dev and still boots runtime", async () => {
  const dom = createBootDom("http://127.0.0.1:8080/");
  const loadedScripts = [];
  let runtimeLoadCount = 0;

  const result = await bootstrapGame({
    windowRef: dom.window,
    documentRef: dom.window.document,
    maintenanceConfigImporter: async () => ({
      MAINTENANCE_CONFIG: {
        enabled: true,
        message: "Ne devrait jamais bloquer le local.",
      },
    }),
    scriptLoader: async (scriptPath) => {
      loadedScripts.push(scriptPath);
    },
    runtimeModuleImporter: async () => {
      runtimeLoadCount += 1;
    },
  });

  assert.equal(result.mode, "runtime");
  assert.deepEqual(loadedScripts, BOOT_VENDOR_SCRIPTS);
  assert.equal(runtimeLoadCount, 1);
  assert.equal(dom.window.document.getElementById("loading-screen").classList.contains("maintenance-screen"), false);
});

test("bootstrapGame waits for the offline service worker before booting runtime on production web", async () => {
  const dom = createBootDom("https://ash2ops.github.io/pokeidle_html_codex/");
  const bootOrder = [];
  let controllerChangeHandler = null;
  let controller = null;
  dom.window.navigator.serviceWorker = {
    get controller() {
      return controller;
    },
    ready: Promise.resolve({}),
    async register(scriptPath) {
      bootOrder.push(`register:${scriptPath}`);
      queueMicrotask(() => {
        controller = { active: true };
        controllerChangeHandler?.();
      });
      return { scope: "https://ash2ops.github.io/pokeidle_html_codex/" };
    },
    addEventListener(eventName, handler) {
      if (eventName === "controllerchange") {
        controllerChangeHandler = handler;
      }
    },
    removeEventListener() {},
  };

  await bootstrapGame({
    windowRef: dom.window,
    documentRef: dom.window.document,
    maintenanceConfigImporter: async () => ({
      MAINTENANCE_CONFIG: {
        enabled: false,
        message: "",
      },
    }),
    scriptLoader: async (scriptPath) => {
      bootOrder.push(`vendor:${scriptPath}`);
    },
    runtimeModuleImporter: async () => {
      bootOrder.push("runtime");
    },
  });

  assert.equal(bootOrder[0], "register:./service-worker.js");
  assert.deepEqual(bootOrder.slice(1, 1 + BOOT_VENDOR_SCRIPTS.length), BOOT_VENDOR_SCRIPTS.map((scriptPath) => `vendor:${scriptPath}`));
  assert.equal(bootOrder.at(-1), "runtime");
});

test("bootstrapGame supports local maintenance preview without enabling runtime", async () => {
  const dom = createBootDom("http://127.0.0.1:8080/?previewMaintenance=1");
  const loadedScripts = [];
  let runtimeLoadCount = 0;

  const result = await bootstrapGame({
    windowRef: dom.window,
    documentRef: dom.window.document,
    maintenanceConfigImporter: async () => ({
      MAINTENANCE_CONFIG: {
        enabled: false,
        message: "",
      },
    }),
    scriptLoader: async (scriptPath) => {
      loadedScripts.push(scriptPath);
    },
    runtimeModuleImporter: async () => {
      runtimeLoadCount += 1;
    },
  });

  assert.equal(result.mode, "maintenance");
  assert.equal(result.message, DEFAULT_MAINTENANCE_MESSAGE);
  assert.deepEqual(loadedScripts, []);
  assert.equal(runtimeLoadCount, 0);
  assert.equal(dom.window.document.getElementById("loading-screen-text").textContent, DEFAULT_MAINTENANCE_MESSAGE);
});

test("game.js boots through the maintenance bootstrap instead of importing game-runtime directly", () => {
  const bootstrapSource = readFileSync(GAME_BOOTSTRAP_PATH, "utf8");

  assert.match(bootstrapSource, /bootstrapGame/);
  assert.doesNotMatch(bootstrapSource, /import\s+["']\.\/game-runtime\.js["']/);
});
