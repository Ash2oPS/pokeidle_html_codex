import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimePlatformUtils } from "../lib/runtime-platform-utils.js";

function withWindow(nextWindow, callback) {
  const previousWindow = globalThis.window;
  globalThis.window = nextWindow;
  try {
    return callback();
  } finally {
    if (typeof previousWindow === "undefined") {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
}

function createUtils() {
  return createRuntimePlatformUtils({
    runtimeClientDesktopExePc: "desktop_exe_pc",
    runtimeClientBrowserSmartphone: "browser_smartphone",
    runtimeClientBrowserPc: "browser_pc",
  });
}

test("createRuntimePlatformUtils treats the Electron preload bridge as a desktop runtime", () => {
  withWindow(
    {
      pokeidleDesktop: {
        isDesktop: true,
      },
      navigator: {
        userAgent: "Mozilla/5.0 (Linux; Android 14; Mobile)",
        userAgentData: { mobile: true },
        maxTouchPoints: 5,
      },
      innerWidth: 390,
      matchMedia: () => ({ matches: true }),
    },
    () => {
      const utils = createUtils();
      assert.equal(utils.isDesktopRuntime(), true);
      assert.equal(utils.isLikelySmartphoneBrowser(), false);
      assert.equal(utils.getRuntimeClientType(), "desktop_exe_pc");
    },
  );
});

test("createRuntimePlatformUtils treats the Electron user agent as a desktop runtime fallback", () => {
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Electron/35.7.5 Chrome/134.0.0.0 Safari/537.36",
        userAgentData: { mobile: false },
        maxTouchPoints: 0,
      },
      innerWidth: 1440,
      matchMedia: () => ({ matches: false }),
    },
    () => {
      const utils = createUtils();
      assert.equal(utils.isDesktopRuntime(), true);
      assert.equal(utils.isLikelySmartphoneBrowser(), false);
      assert.equal(utils.getRuntimeClientType(), "desktop_exe_pc");
    },
  );
});

test("createRuntimePlatformUtils falls back to browser detection without a desktop bridge", () => {
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        userAgentData: { mobile: false },
        maxTouchPoints: 0,
      },
      innerWidth: 1440,
      matchMedia: () => ({ matches: false }),
    },
    () => {
      const utils = createUtils();
      assert.equal(utils.isDesktopRuntime(), false);
      assert.equal(utils.isLikelySmartphoneBrowser(), false);
      assert.equal(utils.getRuntimeClientType(), "browser_pc");
    },
  );
});
