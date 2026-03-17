function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
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
    const narrowViewport = width > 0 && width <= 900;

    let coarsePointer = false;
    try {
      coarsePointer = typeof window?.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    } catch {
      coarsePointer = false;
    }

    return Boolean(mobileHint || mobileUserAgentMatch || (coarsePointer && touchPoints > 0 && narrowViewport));
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

  return {
    isTypingTarget,
    getDesktopBridge,
    hasDesktopSaveBridge,
    hasDesktopNotificationBridge,
    getDesktopWindowState,
    isDesktopRuntime,
    getCapacitorBridge,
    isCapacitorAndroidRuntime,
    getAndroidNotificationPlugin,
    hasAndroidNotificationBridge,
    getNotificationPlatformLabel,
    isLikelySmartphoneBrowser,
    getRuntimeClientType,
  };
}
