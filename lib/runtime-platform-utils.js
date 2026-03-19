import { isPhoneLikeViewport } from "./runtime-stage-layout.js";

export const RUNTIME_ACTIVITY_FOREGROUND_ACTIVE = "foreground_active";
export const RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED = "foreground_unfocused";
export const RUNTIME_ACTIVITY_BACKGROUND_LIVE = "background_live";
export const RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED = "background_suspended";

export const DEFAULT_DESKTOP_WINDOW_STATE = Object.freeze({
  minimized: false,
  visible: true,
  focused: true,
  occluded: false,
  backgrounded: false,
  updatedAtMs: 0,
});

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function shouldForceLifecyclePersistAfterTransition({
  source = "",
  kind = "",
  activityState = "",
} = {}) {
  const normalizedSource = String(source || "");
  const normalizedKind = String(kind || "").trim();
  const normalizedActivityState = String(activityState || "");
  const lifecyclePersistRequested = (
    normalizedKind === "freeze"
    || normalizedKind === "pagehide"
    || normalizedKind === "beforeunload"
    || (normalizedSource === "capacitor" && normalizedKind === "pause")
  );

  if (!lifecyclePersistRequested) {
    return false;
  }
  if (normalizedKind === "beforeunload") {
    return true;
  }
  return normalizedActivityState !== RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED;
}

export function createRuntimePlatformUtils({
  toSafeInt,
  runtimeClientDesktopExePc,
  runtimeClientBrowserSmartphone,
  runtimeClientBrowserPc,
} = {}) {
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;

  function isTypingTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      return true;
    }
    return Boolean(target.closest("[contenteditable='true']"));
  }

  function getDesktopBridge() {
    try {
      const bridge = window?.pokeidleDesktop;
      return bridge && typeof bridge === "object" ? bridge : null;
    } catch {
      return null;
    }
  }

  function hasDesktopSaveBridge() {
    const bridge = getDesktopBridge();
    return Boolean(
      bridge
      && typeof bridge.readSave === "function"
      && typeof bridge.writeSave === "function"
      && typeof bridge.deleteSave === "function",
    );
  }

  function hasDesktopNotificationBridge() {
    const bridge = getDesktopBridge();
    return Boolean(bridge && typeof bridge.notify === "function");
  }

  function getDesktopWindowState() {
    const bridge = getDesktopBridge();
    if (!bridge || typeof bridge.getWindowState !== "function") {
      return null;
    }
    try {
      const windowState = bridge.getWindowState();
      return windowState && typeof windowState === "object" ? windowState : null;
    } catch {
      return null;
    }
  }

  function normalizeDesktopWindowState(input = null) {
    const minimized = Boolean(input?.minimized);
    const visible = typeof input?.visible === "boolean" ? input.visible : true;
    const focused = typeof input?.focused === "boolean" ? input.focused : true;
    const occluded = Boolean(input?.occluded);
    const updatedAtMs = Number(input?.updatedAtMs);
    return {
      minimized,
      visible,
      focused,
      occluded,
      backgrounded: Boolean(input?.backgrounded ?? (minimized || !visible || !focused || occluded)),
      updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : Date.now(),
    };
  }

  function isDesktopWindowStateBackgrounded(windowState = null) {
    if (!windowState || typeof windowState !== "object") {
      return false;
    }
    return Boolean(
      windowState.backgrounded
      || windowState.minimized
      || !windowState.visible
      || !windowState.focused
      || windowState.occluded
    );
  }

  function isDesktopRuntime() {
    const bridge = getDesktopBridge();
    if (bridge && bridge.isDesktop === true) {
      return true;
    }
    const userAgent = String(window?.navigator?.userAgent || "").toLowerCase();
    if (userAgent.includes("electron/")) {
      return true;
    }
    return hasDesktopSaveBridge();
  }

  function getCapacitorBridge() {
    try {
      const bridge = window?.Capacitor;
      return bridge && typeof bridge === "object" ? bridge : null;
    } catch {
      return null;
    }
  }

  function isCapacitorAndroidRuntime() {
    const capacitorBridge = getCapacitorBridge();
    if (!capacitorBridge) {
      return false;
    }
    let platform = "";
    try {
      platform = typeof capacitorBridge.getPlatform === "function"
        ? String(capacitorBridge.getPlatform() || "").toLowerCase().trim()
        : String(capacitorBridge.platform || "").toLowerCase().trim();
    } catch {
      platform = "";
    }
    const nativeRuntime = typeof capacitorBridge.isNativePlatform === "function"
      ? Boolean(capacitorBridge.isNativePlatform())
      : platform === "android";
    return nativeRuntime && platform === "android";
  }

  function getCapacitorAppPlugin() {
    const capacitorBridge = getCapacitorBridge();
    const plugin = capacitorBridge?.Plugins?.App;
    if (plugin && typeof plugin.addListener === "function") {
      return plugin;
    }
    return null;
  }

  function subscribeCapacitorAppState(listener) {
    const plugin = getCapacitorAppPlugin();
    if (!plugin || typeof listener !== "function") {
      return () => {};
    }

    let disposed = false;
    const handles = [];
    const registerListener = async (eventName, mapPayload) => {
      try {
        const handle = await plugin.addListener(eventName, (event) => {
          listener({
            source: eventName,
            isActive: mapPayload(event),
            event,
          });
        });
        if (disposed) {
          await handle?.remove?.();
          return;
        }
        handles.push(handle);
      } catch {
        // Ignore optional platform bridge wiring failures.
      }
    };

    void registerListener("appStateChange", (event) => typeof event?.isActive === "boolean"
      ? event.isActive
      : null);
    void registerListener("pause", () => false);
    void registerListener("resume", () => true);

    return () => {
      disposed = true;
      for (const handle of handles.splice(0)) {
        try {
          void handle?.remove?.();
        } catch {
          // Ignore teardown failures from optional plugins.
        }
      }
    };
  }

  function getAndroidNotificationPlugin() {
    if (!isCapacitorAndroidRuntime()) {
      return null;
    }
    const capacitorBridge = getCapacitorBridge();
    const plugin = capacitorBridge?.Plugins?.LocalNotifications;
    if (
      plugin
      && typeof plugin.schedule === "function"
      && typeof plugin.checkPermissions === "function"
      && typeof plugin.requestPermissions === "function"
    ) {
      return plugin;
    }
    return null;
  }

  function hasAndroidNotificationBridge() {
    return Boolean(getAndroidNotificationPlugin());
  }

  function getNotificationPlatformLabel() {
    if (hasDesktopNotificationBridge()) {
      return "Desktop";
    }
    if (hasAndroidNotificationBridge()) {
      return "Android";
    }
    return "Windows";
  }

  function isLikelySmartphoneBrowser() {
    if (isDesktopRuntime()) {
      return false;
    }

    const userAgent = String(window?.navigator?.userAgent || "").toLowerCase();
    const mobileUserAgentMatch = /(iphone|ipod|android.*mobile|windows phone|mobile|blackberry|opera mini)/.test(userAgent);

    const mobileHint = Boolean(window?.navigator?.userAgentData?.mobile);
    const touchPoints = Math.max(0, safeToInt(window?.navigator?.maxTouchPoints, 0));
    const width = Math.max(0, safeToInt(window?.innerWidth, 0));
    const height = Math.max(0, safeToInt(window?.innerHeight, 0));

    let coarsePointer = false;
    try {
      coarsePointer = typeof window?.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    } catch {
      coarsePointer = false;
    }

    const mobileSignal = mobileHint || mobileUserAgentMatch || (coarsePointer && touchPoints > 0);
    return width > 0 && height > 0 && isPhoneLikeViewport(width, height, { mobileSignal });
  }

  function getRuntimeClientType() {
    if (isDesktopRuntime()) {
      return runtimeClientDesktopExePc;
    }
    if (isLikelySmartphoneBrowser()) {
      return runtimeClientBrowserSmartphone;
    }
    return runtimeClientBrowserPc;
  }

  function getDocumentActivityState(documentRef = typeof document !== "undefined" ? document : null) {
    const documentHidden = Boolean(documentRef?.hidden);
    let documentFocused = true;
    try {
      documentFocused = typeof documentRef?.hasFocus === "function" ? Boolean(documentRef.hasFocus()) : true;
    } catch {
      documentFocused = true;
    }
    return {
      documentHidden,
      documentFocused,
    };
  }

  function getRuntimeActivitySnapshot({
    documentRef = typeof document !== "undefined" ? document : null,
    desktopWindowState = null,
    capacitorAppState = null,
    suspendRequested = false,
  } = {}) {
    const desktopRuntime = isDesktopRuntime();
    const documentState = getDocumentActivityState(documentRef);
    const normalizedDesktopWindowState = desktopRuntime
      ? normalizeDesktopWindowState(desktopWindowState || getDesktopWindowState() || DEFAULT_DESKTOP_WINDOW_STATE)
      : null;
    const capacitorAppActive = typeof capacitorAppState?.isActive === "boolean" ? capacitorAppState.isActive : null;

    let activityState = RUNTIME_ACTIVITY_FOREGROUND_ACTIVE;
    let backgroundReason = "";
    if (suspendRequested || capacitorAppActive === false) {
      activityState = RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED;
      backgroundReason = suspendRequested ? "page_suspended" : "capacitor_app_inactive";
    } else if (
      (desktopRuntime && isDesktopWindowStateBackgrounded(normalizedDesktopWindowState))
      || documentState.documentHidden
    ) {
      activityState = RUNTIME_ACTIVITY_BACKGROUND_LIVE;
      backgroundReason = desktopRuntime && isDesktopWindowStateBackgrounded(normalizedDesktopWindowState)
        ? "desktop_window_backgrounded"
        : "document_hidden";
    } else if (!documentState.documentFocused) {
      activityState = RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED;
      backgroundReason = "document_unfocused";
    }

    return {
      activityState,
      backgroundReason,
      documentHidden: documentState.documentHidden,
      documentFocused: documentState.documentFocused,
      desktopRuntime,
      desktopWindowState: normalizedDesktopWindowState,
      capacitorAppActive,
      suspendRequested: Boolean(suspendRequested),
    };
  }

  return {
    isTypingTarget,
    getDesktopBridge,
    hasDesktopSaveBridge,
    hasDesktopNotificationBridge,
    getDesktopWindowState,
    normalizeDesktopWindowState,
    isDesktopWindowStateBackgrounded,
    isDesktopRuntime,
    getCapacitorBridge,
    getCapacitorAppPlugin,
    subscribeCapacitorAppState,
    isCapacitorAndroidRuntime,
    getAndroidNotificationPlugin,
    hasAndroidNotificationBridge,
    getNotificationPlatformLabel,
    isLikelySmartphoneBrowser,
    getRuntimeClientType,
    getDocumentActivityState,
    getRuntimeActivitySnapshot,
  };
}
