import test from "node:test";
import assert from "node:assert/strict";

import {
  createRuntimePlatformUtils,
  RUNTIME_ACTIVITY_BACKGROUND_LIVE,
  RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
  RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED,
  shouldForceLifecyclePersistAfterTransition,
} from "../lib/runtime-platform-utils.js";

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

test("createRuntimePlatformUtils treats tall portrait browser test viewports as smartphone mode", () => {
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        userAgentData: { mobile: false },
        maxTouchPoints: 0,
      },
      innerWidth: 810,
      innerHeight: 1620,
      matchMedia: () => ({ matches: false }),
    },
    () => {
      const utils = createUtils();
      assert.equal(utils.isDesktopRuntime(), false);
      assert.equal(utils.isLikelySmartphoneBrowser(), true);
      assert.equal(utils.getRuntimeClientType(), "browser_smartphone");
    },
  );
});

test("getRuntimeActivitySnapshot reports background live for hidden browser tabs", () => {
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        userAgentData: { mobile: false },
        maxTouchPoints: 0,
      },
      innerWidth: 1440,
      innerHeight: 900,
      matchMedia: () => ({ matches: false }),
    },
    () => {
      const utils = createUtils();
      const snapshot = utils.getRuntimeActivitySnapshot({
        documentRef: {
          hidden: true,
          hasFocus: () => false,
        },
      });
      assert.equal(snapshot.activityState, RUNTIME_ACTIVITY_BACKGROUND_LIVE);
      assert.equal(snapshot.backgroundReason, "document_hidden");
    },
  );
});

test("getRuntimeActivitySnapshot reports foreground unfocused when visible but blurred", () => {
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        userAgentData: { mobile: false },
        maxTouchPoints: 0,
      },
      innerWidth: 1440,
      innerHeight: 900,
      matchMedia: () => ({ matches: false }),
    },
    () => {
      const utils = createUtils();
      const snapshot = utils.getRuntimeActivitySnapshot({
        documentRef: {
          hidden: false,
          hasFocus: () => false,
        },
      });
      assert.equal(snapshot.activityState, RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED);
      assert.equal(snapshot.backgroundReason, "document_unfocused");
    },
  );
});

test("getRuntimeActivitySnapshot reports background suspended for inactive Capacitor app state", () => {
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Linux; Android 14; Mobile)",
        userAgentData: { mobile: true },
        maxTouchPoints: 5,
      },
      innerWidth: 412,
      innerHeight: 915,
      matchMedia: () => ({ matches: true }),
      Capacitor: {
        platform: "android",
        getPlatform: () => "android",
        isNativePlatform: () => true,
        Plugins: {},
      },
    },
    () => {
      const utils = createUtils();
      const snapshot = utils.getRuntimeActivitySnapshot({
        documentRef: {
          hidden: true,
          hasFocus: () => false,
        },
        capacitorAppState: {
          isActive: false,
        },
      });
      assert.equal(snapshot.activityState, RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED);
      assert.equal(snapshot.backgroundReason, "capacitor_app_inactive");
    },
  );
});

test("subscribeCapacitorAppState wires App plugin lifecycle callbacks", async () => {
  const registrations = [];
  const removed = [];
  const events = [];
  withWindow(
    {
      navigator: {
        userAgent: "Mozilla/5.0 (Linux; Android 14; Mobile)",
        userAgentData: { mobile: true },
        maxTouchPoints: 5,
      },
      innerWidth: 412,
      innerHeight: 915,
      matchMedia: () => ({ matches: true }),
      Capacitor: {
        getPlatform: () => "android",
        isNativePlatform: () => true,
        Plugins: {
          App: {
            addListener(eventName, callback) {
              registrations.push({ eventName, callback });
              return Promise.resolve({
                remove() {
                  removed.push(eventName);
                  return Promise.resolve();
                },
              });
            },
          },
        },
      },
    },
    async () => {
      const utils = createUtils();
      const unsubscribe = utils.subscribeCapacitorAppState((payload) => {
        events.push(payload);
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.deepEqual(
        registrations.map((entry) => entry.eventName),
        ["appStateChange", "pause", "resume"],
      );

      registrations.find((entry) => entry.eventName === "appStateChange")?.callback({ isActive: false });
      registrations.find((entry) => entry.eventName === "pause")?.callback({});
      registrations.find((entry) => entry.eventName === "resume")?.callback({});

      assert.deepEqual(
        events.map((entry) => ({ source: entry.source, isActive: entry.isActive })),
        [
          { source: "appStateChange", isActive: false },
          { source: "pause", isActive: false },
          { source: "resume", isActive: true },
        ],
      );

      unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.deepEqual(removed.sort(), ["appStateChange", "pause", "resume"]);
    },
  );
});

test("shouldForceLifecyclePersistAfterTransition skips duplicate forced persist after suspended transitions", () => {
  assert.equal(
    shouldForceLifecyclePersistAfterTransition({
      kind: "freeze",
      activityState: RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
    }),
    false,
  );
  assert.equal(
    shouldForceLifecyclePersistAfterTransition({
      source: "capacitor",
      kind: "pause",
      activityState: RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
    }),
    false,
  );
  assert.equal(
    shouldForceLifecyclePersistAfterTransition({
      kind: "pagehide",
      activityState: RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
    }),
    false,
  );
});

test("shouldForceLifecyclePersistAfterTransition keeps beforeunload and non-suspended page lifecycle persist", () => {
  assert.equal(
    shouldForceLifecyclePersistAfterTransition({
      kind: "beforeunload",
      activityState: "foreground_active",
    }),
    true,
  );
  assert.equal(
    shouldForceLifecyclePersistAfterTransition({
      kind: "pagehide",
      activityState: RUNTIME_ACTIVITY_BACKGROUND_LIVE,
    }),
    true,
  );
});
