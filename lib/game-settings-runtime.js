const DEFAULT_MAINTENANCE_MESSAGE = "Le jeu est en maintenance. Merci de reessayer plus tard.";
const GAME_SETTINGS_JSON_PATH = "./game-settings.json";

const DEFAULT_GAME_SETTINGS_ROOT = Object.freeze({
  maintenance: {
    enabled: false,
    blockCurrentVersion: false,
    blockedVersions: [],
    message: DEFAULT_MAINTENANCE_MESSAGE,
  },
  notifications: {
    evolutionReadySystemEnabled: true,
  },
  store: {
    playStoreUrl: "",
    appStoreUrl: "",
    redirectAfterClicks: -1,
    redirectAfterClickDelayMs: -1,
  },
  tooltips: {
    maintenance: {
      enabled: "Bloque tout le jeu, quelle que soit la version.",
      blockCurrentVersion: "Bloque automatiquement la version actuellement en ligne.",
      blockedVersions: "Liste des versions a bloquer manuellement (ex: 0.1.28).",
      message: "Message affiche sur l'ecran de chargement pendant la maintenance.",
    },
    notifications: {
      evolutionReadySystemEnabled:
        "Active la notif systeme Desktop/Android quand un Pokemon peut evoluer hors premier plan.",
    },
    store: {
      playStoreUrl: "URL Play Store utilisee par les redirections publicitaires.",
      appStoreUrl: "URL App Store utilisee par les redirections publicitaires.",
      redirectAfterClicks: "Nombre de clics avant redirection auto. -1 desactive.",
      redirectAfterClickDelayMs: "Delai de redirection apres premier clic. -1 desactive.",
    },
  },
});

function sanitizeBoolean(value, fallback = false) {
  if (value === undefined || value === null) {
    return Boolean(fallback);
  }
  return Boolean(value);
}

function sanitizeString(value, fallback = "") {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return String(fallback || "");
  }
  return raw;
}

function sanitizeUrl(value) {
  return sanitizeString(value, "");
}

function sanitizeIntOrMinusOne(value, fallback = -1) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < -1) {
    return -1;
  }
  return parsed;
}

function sanitizeBlockedVersions(rawBlockedVersions) {
  if (!Array.isArray(rawBlockedVersions)) {
    return [];
  }
  const unique = new Set();
  for (const rawVersion of rawBlockedVersions) {
    const version = sanitizeString(rawVersion, "");
    if (!version) {
      continue;
    }
    unique.add(version);
  }
  return Array.from(unique.values());
}

function sanitizeMaintenance(rawMaintenance = {}) {
  const source = rawMaintenance && typeof rawMaintenance === "object" ? rawMaintenance : {};
  return {
    enabled: sanitizeBoolean(source.enabled, DEFAULT_GAME_SETTINGS_ROOT.maintenance.enabled),
    blockCurrentVersion: sanitizeBoolean(
      source.blockCurrentVersion,
      DEFAULT_GAME_SETTINGS_ROOT.maintenance.blockCurrentVersion,
    ),
    blockedVersions: sanitizeBlockedVersions(source.blockedVersions),
    message: sanitizeString(source.message, DEFAULT_MAINTENANCE_MESSAGE),
  };
}

function sanitizeNotifications(rawNotifications = {}) {
  const source = rawNotifications && typeof rawNotifications === "object" ? rawNotifications : {};
  return {
    evolutionReadySystemEnabled: sanitizeBoolean(
      source.evolutionReadySystemEnabled,
      DEFAULT_GAME_SETTINGS_ROOT.notifications.evolutionReadySystemEnabled,
    ),
  };
}

function sanitizeStore(rawStore = {}) {
  const source = rawStore && typeof rawStore === "object" ? rawStore : {};
  return {
    playStoreUrl: sanitizeUrl(source.playStoreUrl),
    appStoreUrl: sanitizeUrl(source.appStoreUrl),
    redirectAfterClicks: sanitizeIntOrMinusOne(
      source.redirectAfterClicks,
      DEFAULT_GAME_SETTINGS_ROOT.store.redirectAfterClicks,
    ),
    redirectAfterClickDelayMs: sanitizeIntOrMinusOne(
      source.redirectAfterClickDelayMs,
      DEFAULT_GAME_SETTINGS_ROOT.store.redirectAfterClickDelayMs,
    ),
  };
}

function sanitizeTooltipSection(rawSection = {}, defaultSection = {}) {
  const source = rawSection && typeof rawSection === "object" ? rawSection : {};
  const fallback = defaultSection && typeof defaultSection === "object" ? defaultSection : {};
  const result = {};
  for (const [key, fallbackValue] of Object.entries(fallback)) {
    result[key] = sanitizeString(source[key], fallbackValue);
  }
  return result;
}

function sanitizeTooltips(rawTooltips = {}) {
  const source = rawTooltips && typeof rawTooltips === "object" ? rawTooltips : {};
  return {
    maintenance: sanitizeTooltipSection(source.maintenance, DEFAULT_GAME_SETTINGS_ROOT.tooltips.maintenance),
    notifications: sanitizeTooltipSection(source.notifications, DEFAULT_GAME_SETTINGS_ROOT.tooltips.notifications),
    store: sanitizeTooltipSection(source.store, DEFAULT_GAME_SETTINGS_ROOT.tooltips.store),
  };
}

function buildDefaultMirror({ maintenance, notifications, store, tooltips }) {
  return {
    maintenance: { ...maintenance, blockedVersions: maintenance.blockedVersions.slice() },
    notifications: { ...notifications },
    store: { ...store },
    tooltips: {
      maintenance: { ...tooltips.maintenance },
      notifications: { ...tooltips.notifications },
      store: { ...tooltips.store },
    },
  };
}

export function sanitizeGameSettings(rawSettings = {}) {
  const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const maintenance = sanitizeMaintenance(source.maintenance);
  const notifications = sanitizeNotifications(source.notifications);
  const store = sanitizeStore(source.store);
  const tooltips = sanitizeTooltips(source.tooltips);
  const defaultMirror = buildDefaultMirror({ maintenance, notifications, store, tooltips });
  return {
    maintenance,
    notifications,
    store,
    tooltips,
    default: defaultMirror,
  };
}

export function toInternalGameSettings(rawSettings = {}) {
  return sanitizeGameSettings(rawSettings);
}

export function isGameMaintenanceActive(settings = {}, currentVersion = "") {
  const safeSettings = sanitizeGameSettings(settings);
  if (safeSettings.maintenance.enabled) {
    return true;
  }
  const normalizedVersion = sanitizeString(currentVersion, "");
  if (!normalizedVersion) {
    return false;
  }
  if (safeSettings.maintenance.blockCurrentVersion) {
    return true;
  }
  return safeSettings.maintenance.blockedVersions.includes(normalizedVersion);
}

export function getMaintenanceMessage(settings = {}) {
  const safeSettings = sanitizeGameSettings(settings);
  return sanitizeString(safeSettings.maintenance.message, DEFAULT_MAINTENANCE_MESSAGE);
}

export async function loadGameSettings({ fetchFn = null, path = GAME_SETTINGS_JSON_PATH } = {}) {
  const fetchRuntime = typeof fetchFn === "function"
    ? fetchFn
    : (input, init) => {
      if (typeof globalThis.fetch !== "function") {
        throw new Error("fetch indisponible");
      }
      return globalThis.fetch(input, init);
    };
  const resolvedPath = sanitizeString(path, GAME_SETTINGS_JSON_PATH);
  const requestPath = `${resolvedPath}?ts=${Date.now()}`;
  try {
    const response = await fetchRuntime(requestPath, { cache: "no-store" });
    if (!response?.ok) {
      throw new Error(`Impossible de charger ${resolvedPath}`);
    }
    const payload = await response.json();
    return {
      loaded: true,
      source: resolvedPath,
      settings: toInternalGameSettings(payload),
    };
  } catch (error) {
    return {
      loaded: false,
      source: resolvedPath,
      error: error instanceof Error ? error.message : String(error || ""),
      settings: toInternalGameSettings(DEFAULT_GAME_SETTINGS_ROOT),
    };
  }
}
