import { isProductionGithubPagesLocation } from "../version.js";

export const DEFAULT_MAINTENANCE_MESSAGE = "Le jeu est en maintenance. Merci de r\u00e9essayer plus tard.";
export const DEFAULT_MAINTENANCE_TIMEZONE = "Europe/Paris";
export const PREVIEW_MAINTENANCE_QUERY_PARAM = "previewMaintenance";
export const OFFLINE_SERVICE_WORKER_FILE = "./service-worker.js";
export const OFFLINE_SERVICE_WORKER_CONTROL_TIMEOUT_MS = 2500;
export const BOOT_VENDOR_SCRIPTS = Object.freeze([
  "vendor/pako.min.js",
  "vendor/upng.js",
  "vendor/omggif.js",
]);
const MAINTENANCE_TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEEKDAY_ALIASES = Object.freeze({
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
  sun: "sunday",
  sunday: "sunday",
});
const WEEKDAY_FROM_INTL = Object.freeze({
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
  sun: "sunday",
});
const DATE_PARTS_FORMATTER_CACHE = new Map();

function defaultWarn(...args) {
  if (typeof console?.warn === "function") {
    console.warn(...args);
  }
}

function isTruthyFlagValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function getNormalizedTimeZone(rawTimeZone) {
  const normalized = typeof rawTimeZone === "string" ? rawTimeZone.trim() : "";
  if (!normalized) {
    return {
      value: DEFAULT_MAINTENANCE_TIMEZONE,
      valid: isValidTimeZone(DEFAULT_MAINTENANCE_TIMEZONE),
    };
  }
  return {
    value: normalized,
    valid: isValidTimeZone(normalized),
  };
}

function normalizeWeekdayName(rawDay) {
  const normalized = String(rawDay || "").trim().toLowerCase();
  return WEEKDAY_ALIASES[normalized] || "";
}

function parseTimeOfDayToMinute(rawTime) {
  const normalized = typeof rawTime === "string" ? rawTime.trim() : "";
  const match = normalized.match(MAINTENANCE_TIME_OF_DAY_PATTERN);
  if (!match) {
    return null;
  }
  return (Number(match[1]) * 60) + Number(match[2]);
}

function formatMinuteOfDay(minuteOfDay) {
  const safeMinuteOfDay = Math.max(0, Math.min(1439, Number(minuteOfDay) || 0));
  const hour = String(Math.floor(safeMinuteOfDay / 60)).padStart(2, "0");
  const minute = String(safeMinuteOfDay % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function sanitizeOptionalMessage(rawMessage) {
  return typeof rawMessage === "string" ? rawMessage.trim() : "";
}

function sanitizeWeeklyWindows(rawWeeklyWindows) {
  if (!Array.isArray(rawWeeklyWindows)) {
    return Object.freeze([]);
  }

  const sanitizedWindows = [];
  for (const rawWindow of rawWeeklyWindows) {
    if (!rawWindow || typeof rawWindow !== "object") {
      continue;
    }

    const uniqueDaysOfWeek = [];
    for (const rawDay of Array.isArray(rawWindow.daysOfWeek) ? rawWindow.daysOfWeek : []) {
      const dayName = normalizeWeekdayName(rawDay);
      if (dayName && !uniqueDaysOfWeek.includes(dayName)) {
        uniqueDaysOfWeek.push(dayName);
      }
    }

    const startMinuteOfDay = parseTimeOfDayToMinute(rawWindow.startTimeLocal);
    const endMinuteOfDay = parseTimeOfDayToMinute(rawWindow.endTimeLocal);
    if (!uniqueDaysOfWeek.length || startMinuteOfDay === null || endMinuteOfDay === null || endMinuteOfDay < startMinuteOfDay) {
      continue;
    }

    sanitizedWindows.push(Object.freeze({
      daysOfWeek: Object.freeze(uniqueDaysOfWeek),
      startTimeLocal: formatMinuteOfDay(startMinuteOfDay),
      endTimeLocal: formatMinuteOfDay(endMinuteOfDay),
      message: sanitizeOptionalMessage(rawWindow.message),
      startMinuteOfDay,
      endMinuteOfDay,
    }));
  }

  return Object.freeze(sanitizedWindows);
}

function getDatePartsFormatter(timeZone) {
  const cacheKey = String(timeZone || "");
  if (!DATE_PARTS_FORMATTER_CACHE.has(cacheKey)) {
    DATE_PARTS_FORMATTER_CACHE.set(cacheKey, new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }));
  }
  return DATE_PARTS_FORMATTER_CACHE.get(cacheKey);
}

function getCurrentMaintenanceWindowContext(nowDate, timeZone) {
  if (!(nowDate instanceof Date) || Number.isNaN(nowDate.getTime()) || !isValidTimeZone(timeZone)) {
    return null;
  }

  const parts = getDatePartsFormatter(timeZone).formatToParts(nowDate);
  let weekday = "";
  let hour = null;
  let minute = null;
  for (const part of parts) {
    if (part.type === "weekday") {
      weekday = WEEKDAY_FROM_INTL[String(part.value || "").trim().toLowerCase()] || "";
    }
    if (part.type === "hour") {
      hour = Number(part.value);
    }
    if (part.type === "minute") {
      minute = Number(part.value);
    }
  }

  if (!weekday || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  return {
    weekday,
    minuteOfDay: (hour * 60) + minute,
  };
}

function shouldUseScheduledMaintenance(config) {
  return config.enabled === true && config.alwaysOn !== true && config.scheduleConfigured === true;
}

function getActiveScheduledMaintenanceWindow(config, nowDate = new Date()) {
  if (!shouldUseScheduledMaintenance(config) || config.scheduleValid !== true) {
    return null;
  }

  const currentContext = getCurrentMaintenanceWindowContext(nowDate, config.timezone);
  if (!currentContext) {
    return null;
  }

  return config.weeklyWindows.find((windowConfig) => (
    windowConfig.daysOfWeek.includes(currentContext.weekday)
    && currentContext.minuteOfDay >= windowConfig.startMinuteOfDay
    && currentContext.minuteOfDay <= windowConfig.endMinuteOfDay
  )) || null;
}

function resolveMaintenanceMessage(config, nowDate = new Date()) {
  const activeWindow = getActiveScheduledMaintenanceWindow(config, nowDate);
  if (activeWindow?.message) {
    return activeWindow.message;
  }
  return String(config?.message || DEFAULT_MAINTENANCE_MESSAGE).trim() || DEFAULT_MAINTENANCE_MESSAGE;
}

export function sanitizeMaintenanceConfig(rawConfig = null) {
  const source = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  const enabled = source.enabled === true;
  const alwaysOn = source.alwaysOn === true;
  const rawMessage = sanitizeOptionalMessage(source.message);
  const timeZone = getNormalizedTimeZone(source.timezone);
  const scheduleConfigured = Array.isArray(source.weeklyWindows);
  const weeklyWindows = sanitizeWeeklyWindows(source.weeklyWindows);
  const scheduleValid = scheduleConfigured === false
    || (timeZone.valid === true && weeklyWindows.length > 0);
  return Object.freeze({
    enabled,
    alwaysOn,
    message: rawMessage || DEFAULT_MAINTENANCE_MESSAGE,
    timezone: timeZone.value,
    scheduleConfigured,
    scheduleValid,
    weeklyWindows,
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
  nowDate = new Date(),
} = {}) {
  const production = isProductionGithubPagesLocation(locationLike);
  if (production) {
    if (config?.enabled !== true) {
      return false;
    }
    if (config?.alwaysOn === true) {
      return true;
    }
    if (shouldUseScheduledMaintenance(config)) {
      return Boolean(getActiveScheduledMaintenanceWindow(config, nowDate));
    }
    return config?.scheduleConfigured !== true;
  }
  try {
    const params = new URLSearchParams(String(locationLike?.search || ""));
    return isTruthyFlagValue(params.get(previewQueryParam));
  } catch {
    return false;
  }
}

export function shouldRegisterOfflineServiceWorker(windowRef = globalThis.window) {
  return isProductionGithubPagesLocation(windowRef?.location)
    && typeof windowRef?.navigator?.serviceWorker?.register === "function";
}

export function waitForOfflineServiceWorkerControl(
  serviceWorkerContainer,
  timeoutMs = OFFLINE_SERVICE_WORKER_CONTROL_TIMEOUT_MS,
) {
  if (!serviceWorkerContainer || serviceWorkerContainer.controller) {
    return Promise.resolve(Boolean(serviceWorkerContainer?.controller));
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = null;
    const finish = (controlled) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      try {
        serviceWorkerContainer.removeEventListener?.("controllerchange", handleControllerChange);
      } catch {
        // Ignore listener cleanup failures.
      }
      resolve(Boolean(controlled));
    };
    const handleControllerChange = () => {
      finish(Boolean(serviceWorkerContainer.controller));
    };

    timeoutId = setTimeout(() => {
      finish(Boolean(serviceWorkerContainer.controller));
    }, Math.max(0, Number(timeoutMs) || 0));

    try {
      serviceWorkerContainer.addEventListener?.("controllerchange", handleControllerChange, { once: true });
    } catch {
      finish(Boolean(serviceWorkerContainer.controller));
      return;
    }

    Promise.resolve(serviceWorkerContainer.ready)
      .then(() => {
        if (serviceWorkerContainer.controller) {
          finish(true);
        }
      })
      .catch(() => {
        finish(Boolean(serviceWorkerContainer.controller));
      });
  });
}

export async function registerOfflineServiceWorkerIfNeeded({
  windowRef = globalThis.window,
  warn = defaultWarn,
  timeoutMs = OFFLINE_SERVICE_WORKER_CONTROL_TIMEOUT_MS,
} = {}) {
  if (!shouldRegisterOfflineServiceWorker(windowRef)) {
    return null;
  }
  const serviceWorkerContainer = windowRef.navigator.serviceWorker;
  try {
    const registration = await serviceWorkerContainer.register(OFFLINE_SERVICE_WORKER_FILE);
    await waitForOfflineServiceWorkerControl(serviceWorkerContainer, timeoutMs);
    return registration;
  } catch (error) {
    warn("[offline] Impossible d'enregistrer le service worker offline.", error);
    return null;
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
  nowDate = new Date(),
} = {}) {
  const config = await loadMaintenanceConfig({
    maintenanceConfigImporter,
    warn,
  });
  const maintenanceActive = shouldShowMaintenanceScreen({
    locationLike: windowRef?.location,
    config,
    nowDate,
  });
  const maintenanceMessage = resolveMaintenanceMessage(config, nowDate);

  if (maintenanceActive) {
    renderMaintenanceBootScreen(documentRef, { message: maintenanceMessage });
    try {
      windowRef.render_game_to_text = () => JSON.stringify({
        mode: "maintenance",
        boot_phase: "maintenance",
        loading_overlay_visible: true,
        visual_ready: true,
        message: maintenanceMessage,
      });
    } catch {
      // Ignore optional debug hook wiring failures.
    }
    return {
      mode: "maintenance",
      message: maintenanceMessage,
      config,
    };
  }

  await registerOfflineServiceWorkerIfNeeded({
    windowRef,
    warn,
  });
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
