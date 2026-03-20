import { isProductionGithubPagesLocation } from "../version.js";

export const DEFAULT_MAINTENANCE_MESSAGE = "Le jeu est en maintenance. Merci de r\u00e9essayer plus tard.";
export const PREVIEW_MAINTENANCE_QUERY_PARAM = "previewMaintenance";
export const BOOT_VENDOR_SCRIPTS = Object.freeze([
  "vendor/pako.min.js",
  "vendor/upng.js",
  "vendor/omggif.js",
]);

function defaultWarn(...args) {
  if (typeof console?.warn === "function") {
    console.warn(...args);
  }
}

function isTruthyFlagValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function sanitizeMaintenanceConfig(rawConfig = null) {
  const source = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  const enabled = source.enabled === true;
  const rawMessage = typeof source.message === "string" ? source.message.trim() : "";
  return Object.freeze({
    enabled,
    message: rawMessage || DEFAULT_MAINTENANCE_MESSAGE,
  });
}

export async function loadMaintenanceConfig({
  maintenanceConfigImporter = () => {
    const configUrl = new URL("../maintenance-config.js", import.meta.url);
    configUrl.searchParams.set("_maintenance", `${Date.now()}`);
    return import(configUrl.toString());
  },
  warn = defaultWarn,
} = {}) {
  try {
    const module = await maintenanceConfigImporter();
    return sanitizeMaintenanceConfig(module?.MAINTENANCE_CONFIG);
  } catch (error) {
    warn("[maintenance] Impossible de charger maintenance-config.js, bootstrap normal conserve.", error);
    return sanitizeMaintenanceConfig(null);
  }
}

export function shouldShowMaintenanceScreen({
  locationLike,
  config = sanitizeMaintenanceConfig(null),
  previewQueryParam = PREVIEW_MAINTENANCE_QUERY_PARAM,
} = {}) {
  const production = isProductionGithubPagesLocation(locationLike);
  if (production) {
    return Boolean(config?.enabled);
  }
  try {
    const params = new URLSearchParams(String(locationLike?.search || ""));
    return isTruthyFlagValue(params.get(previewQueryParam));
  } catch {
    return false;
  }
}

function ensureBootScreenElements(documentRef) {
  const loadingScreenEl = documentRef?.getElementById?.("loading-screen") || null;
  const loadingTextEl = documentRef?.getElementById?.("loading-screen-text") || null;
  const loadingFlashEl = loadingScreenEl?.querySelector?.(".loading-screen-flash") || null;
  return {
    loadingScreenEl,
    loadingTextEl,
    loadingFlashEl,
  };
}

export function renderMaintenanceBootScreen(documentRef, {
  message = DEFAULT_MAINTENANCE_MESSAGE,
} = {}) {
  const elements = ensureBootScreenElements(documentRef);
  if (!elements.loadingScreenEl || !elements.loadingTextEl) {
    return false;
  }
  elements.loadingScreenEl.classList.add("is-visible", "maintenance-screen");
  elements.loadingScreenEl.dataset.bootMode = "maintenance";
  elements.loadingScreenEl.setAttribute("aria-label", "Maintenance");
  elements.loadingTextEl.textContent = String(message || DEFAULT_MAINTENANCE_MESSAGE).trim() || DEFAULT_MAINTENANCE_MESSAGE;
  elements.loadingTextEl.style.whiteSpace = "pre-line";
  if (elements.loadingFlashEl) {
    elements.loadingFlashEl.setAttribute("aria-hidden", "true");
  }
  return true;
}

export function loadClassicScript(scriptPath, {
  documentRef = globalThis.document,
  windowRef = globalThis.window,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!documentRef?.createElement) {
      reject(new Error(`Impossible de charger ${scriptPath}: document indisponible.`));
      return;
    }

    const resolvedUrl = new URL(String(scriptPath || ""), String(windowRef?.location?.href || documentRef.baseURI || "")).toString();
    const existingScript = Array.from(documentRef.querySelectorAll("script")).find((scriptEl) => {
      const rawSrc = String(scriptEl.getAttribute("src") || "");
      return rawSrc === scriptPath || scriptEl.src === resolvedUrl;
    });
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve(existingScript);
        return;
      }
      existingScript.addEventListener("load", () => resolve(existingScript), { once: true });
      existingScript.addEventListener("error", () => reject(new Error(`Le script ${scriptPath} a echoue au chargement.`)), {
        once: true,
      });
      return;
    }

    const scriptEl = documentRef.createElement("script");
    scriptEl.async = false;
    scriptEl.src = resolvedUrl;
    scriptEl.dataset.bootVendor = "true";
    scriptEl.addEventListener("load", () => {
      scriptEl.dataset.loaded = "true";
      resolve(scriptEl);
    }, { once: true });
    scriptEl.addEventListener("error", () => {
      reject(new Error(`Le script ${scriptPath} a echoue au chargement.`));
    }, { once: true });
    const parentNode = documentRef.head || documentRef.body || documentRef.documentElement;
    parentNode.appendChild(scriptEl);
  });
}

export async function loadBootVendorScripts({
  scriptLoader,
  vendorScripts = BOOT_VENDOR_SCRIPTS,
  documentRef = globalThis.document,
  windowRef = globalThis.window,
} = {}) {
  const loadScript = typeof scriptLoader === "function"
    ? scriptLoader
    : (scriptPath) => loadClassicScript(scriptPath, { documentRef, windowRef });
  for (const scriptPath of vendorScripts) {
    await loadScript(scriptPath);
  }
  return vendorScripts.slice();
}

export async function bootstrapGame({
  windowRef = globalThis.window,
  documentRef = globalThis.document,
  maintenanceConfigImporter,
  runtimeModuleImporter = () => import("../game-runtime.js"),
  scriptLoader,
  vendorScripts = BOOT_VENDOR_SCRIPTS,
  warn = defaultWarn,
} = {}) {
  const config = await loadMaintenanceConfig({
    maintenanceConfigImporter,
    warn,
  });
  const maintenanceActive = shouldShowMaintenanceScreen({
    locationLike: windowRef?.location,
    config,
  });

  if (maintenanceActive) {
    renderMaintenanceBootScreen(documentRef, { message: config.message });
    try {
      windowRef.render_game_to_text = () => JSON.stringify({
        mode: "maintenance",
        message: config.message,
      });
    } catch {
      // Ignore optional debug hook wiring failures.
    }
    return {
      mode: "maintenance",
      message: config.message,
      config,
    };
  }

  await loadBootVendorScripts({
    scriptLoader,
    vendorScripts,
    documentRef,
    windowRef,
  });
  await runtimeModuleImporter();
  return {
    mode: "runtime",
    config,
  };
}
