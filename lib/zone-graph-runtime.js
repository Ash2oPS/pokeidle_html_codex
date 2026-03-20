function defaultToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function sanitizeStringList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = [];
  for (const value of values) {
    const nextValue = String(value || "").trim();
    if (!nextValue || normalized.includes(nextValue)) {
      continue;
    }
    normalized.push(nextValue);
  }
  return normalized;
}

function getOrderedRouteIds(availableRouteIds = [], defaultRouteId = "") {
  const ordered = sanitizeStringList(availableRouteIds);
  const fallbackRouteId = String(defaultRouteId || "").trim();
  if (fallbackRouteId && !ordered.includes(fallbackRouteId)) {
    ordered.unshift(fallbackRouteId);
  }
  return ordered;
}

function getRouteById(routeCatalog, routeId) {
  if (!(routeCatalog instanceof Map)) {
    return null;
  }
  return routeCatalog.get(String(routeId || "")) || null;
}

function getRouteUnlockMode(routeData) {
  const mode = String(routeData?.unlock_mode || (routeData?.combat_enabled === false ? "visit" : "defeats"))
    .toLowerCase()
    .trim();
  return mode === "visit" ? "visit" : "defeats";
}

function getRouteUnlockTarget(routeData, fallbackUnlockTarget = 0, toSafeInt = defaultToSafeInt) {
  return Math.max(0, toSafeInt(routeData?.unlock_defeats_required, fallbackUnlockTarget));
}

export function normalizeFlagIdList(values) {
  return sanitizeStringList(values);
}

export function normalizeUnlockedRouteIds(rawIds, availableRouteIds = [], defaultRouteId = "") {
  const ordered = getOrderedRouteIds(availableRouteIds, defaultRouteId);
  if (ordered.length <= 0) {
    return defaultRouteId ? [String(defaultRouteId)] : [];
  }
  const allowed = new Set(ordered);
  const normalized = [];
  for (const routeId of sanitizeStringList(rawIds)) {
    if (!allowed.has(routeId) || normalized.includes(routeId)) {
      continue;
    }
    normalized.push(routeId);
  }
  const fallbackRouteId = String(defaultRouteId || ordered[0] || "").trim();
  if (fallbackRouteId && allowed.has(fallbackRouteId) && !normalized.includes(fallbackRouteId)) {
    normalized.unshift(fallbackRouteId);
  }
  return normalized.filter((routeId) => allowed.has(routeId));
}

export function createRouteDefeatCounts(availableRouteIds = [], defaultRouteId = "") {
  const ordered = getOrderedRouteIds(availableRouteIds, defaultRouteId);
  const counts = {};
  for (const routeId of ordered) {
    counts[routeId] = 0;
  }
  return counts;
}

export function normalizeRouteDefeatCounts(rawCounts, availableRouteIds = [], defaultRouteId = "", toSafeInt = defaultToSafeInt) {
  const counts = createRouteDefeatCounts(availableRouteIds, defaultRouteId);
  const source = rawCounts && typeof rawCounts === "object" ? rawCounts : {};
  for (const routeId of Object.keys(counts)) {
    counts[routeId] = Math.max(0, toSafeInt(source[routeId], 0));
  }
  return counts;
}

export function normalizeAccessRules(rawRules) {
  const rules = rawRules && typeof rawRules === "object" ? rawRules : {};
  return {
    requires_flags_all: sanitizeStringList(rules.requires_flags_all),
    requires_flags_any: sanitizeStringList(rules.requires_flags_any),
    blocked_reason_fr: String(rules.blocked_reason_fr || "").trim(),
  };
}

export function getConnectedRouteIds(routeId, routeCatalog) {
  const routeData = getRouteById(routeCatalog, routeId);
  const connectedRouteIds = sanitizeStringList(routeData?.connected_route_ids);
  if (!(routeCatalog instanceof Map)) {
    return connectedRouteIds.filter((connectedRouteId) => connectedRouteId !== routeId);
  }
  return connectedRouteIds.filter((connectedRouteId) => connectedRouteId !== routeId && routeCatalog.has(connectedRouteId));
}

export function getRouteAccessState(routeData, zoneFlags = []) {
  const normalizedZoneFlags = normalizeFlagIdList(zoneFlags);
  const zoneFlagSet = new Set(normalizedZoneFlags);
  const accessRules = normalizeAccessRules(routeData?.access_rules);
  const requiresAll = accessRules.requires_flags_all.every((flagId) => zoneFlagSet.has(flagId));
  const requiresAny = accessRules.requires_flags_any.length <= 0
    || accessRules.requires_flags_any.some((flagId) => zoneFlagSet.has(flagId));
  const allowed = requiresAll && requiresAny;
  return {
    allowed,
    requires_flags_all: accessRules.requires_flags_all,
    requires_flags_any: accessRules.requires_flags_any,
    blocked_reason_fr: allowed ? "" : accessRules.blocked_reason_fr,
  };
}

export function getBlockedConnectedRouteStates({
  routeId,
  routeCatalog,
  unlockedRouteIds = [],
  zoneFlags = [],
} = {}) {
  const unlockedSet = new Set(normalizeUnlockedRouteIds(unlockedRouteIds, routeCatalog instanceof Map ? Array.from(routeCatalog.keys()) : [], ""));
  const connectedRouteIds = getConnectedRouteIds(routeId, routeCatalog);
  return connectedRouteIds.map((connectedRouteId) => {
    const routeData = getRouteById(routeCatalog, connectedRouteId);
    const accessState = getRouteAccessState(routeData, zoneFlags);
    return {
      route_id: connectedRouteId,
      route_name_fr: String(routeData?.route_name_fr || connectedRouteId),
      unlocked: unlockedSet.has(connectedRouteId),
      blocked: !accessState.allowed,
      blocked_reason_fr: accessState.blocked_reason_fr,
      requires_flags_all: accessState.requires_flags_all,
      requires_flags_any: accessState.requires_flags_any,
    };
  });
}

export function getUnlockableConnectedRouteIds({
  routeId,
  routeCatalog,
  unlockedRouteIds = [],
  zoneFlags = [],
} = {}) {
  return getBlockedConnectedRouteStates({
    routeId,
    routeCatalog,
    unlockedRouteIds,
    zoneFlags,
  })
    .filter((state) => !state.unlocked && !state.blocked)
    .map((state) => state.route_id);
}

export function tryUnlockConnectedRoutes({
  routeId,
  routeCatalog,
  unlockedRouteIds = [],
  routeDefeatCounts = {},
  zoneFlags = [],
  availableRouteIds = [],
  defaultRouteId = "",
  fallbackUnlockTarget = 0,
  toSafeInt = defaultToSafeInt,
} = {}) {
  const currentRouteId = String(routeId || defaultRouteId || "").trim();
  const routeData = getRouteById(routeCatalog, currentRouteId);
  const unlockMode = getRouteUnlockMode(routeData);
  const unlockTarget = unlockMode === "visit" ? 0 : getRouteUnlockTarget(routeData, fallbackUnlockTarget, toSafeInt);
  const rawDefeats = Math.max(0, toSafeInt(routeDefeatCounts?.[currentRouteId], 0));
  if (unlockMode !== "visit" && rawDefeats < unlockTarget) {
    return {
      unlockedRouteIds: normalizeUnlockedRouteIds(unlockedRouteIds, availableRouteIds, defaultRouteId),
      unlocked: [],
      blocked: getBlockedConnectedRouteStates({
        routeId: currentRouteId,
        routeCatalog,
        unlockedRouteIds,
        zoneFlags,
      }).filter((state) => state.blocked),
    };
  }

  const currentUnlocked = normalizeUnlockedRouteIds(unlockedRouteIds, availableRouteIds, defaultRouteId);
  const unlocked = [];
  for (const connectedRouteId of getUnlockableConnectedRouteIds({
    routeId: currentRouteId,
    routeCatalog,
    unlockedRouteIds: currentUnlocked,
    zoneFlags,
  })) {
    if (currentUnlocked.includes(connectedRouteId)) {
      continue;
    }
    currentUnlocked.push(connectedRouteId);
    unlocked.push(connectedRouteId);
  }

  return {
    unlockedRouteIds: normalizeUnlockedRouteIds(currentUnlocked, availableRouteIds, defaultRouteId),
    unlocked,
    blocked: getBlockedConnectedRouteStates({
      routeId: currentRouteId,
      routeCatalog,
      unlockedRouteIds: currentUnlocked,
      zoneFlags,
    }).filter((state) => state.blocked),
  };
}

export function buildRouteUnlockProgressState({
  routeId,
  routeCatalog,
  unlockedRouteIds = [],
  routeDefeatCounts = {},
  zoneFlags = [],
  availableRouteIds = [],
  defaultRouteId = "",
  fallbackUnlockTarget = 0,
  fallbackTimerMs = 0,
  toSafeInt = defaultToSafeInt,
} = {}) {
  const currentRouteId = String(routeId || defaultRouteId || "").trim();
  const routeData = getRouteById(routeCatalog, currentRouteId);
  const unlockMode = getRouteUnlockMode(routeData);
  const unlockTarget = unlockMode === "visit" ? 0 : getRouteUnlockTarget(routeData, fallbackUnlockTarget, toSafeInt);
  const rawDefeats = Math.max(0, toSafeInt(routeDefeatCounts?.[currentRouteId], 0));
  const blockedConnectedRoutes = getBlockedConnectedRouteStates({
    routeId: currentRouteId,
    routeCatalog,
    unlockedRouteIds,
    zoneFlags,
  });
  const unlockableConnectedRouteIds = blockedConnectedRoutes
    .filter((state) => !state.unlocked && !state.blocked)
    .map((state) => state.route_id);
  const timerEnabled = unlockMode === "defeats" && unlockableConnectedRouteIds.length > 0;
  return {
    routeId: currentRouteId,
    unlockMode,
    unlockTarget,
    currentDefeats: unlockTarget > 0 ? Math.min(rawDefeats, unlockTarget) : 0,
    rawDefeats,
    nextRouteId: unlockableConnectedRouteIds[0] || null,
    nextRouteIds: unlockableConnectedRouteIds,
    connectedRouteIds: blockedConnectedRoutes.map((state) => state.route_id),
    unlockableConnectedRouteIds,
    blockedConnectedRoutes: blockedConnectedRoutes.filter((state) => state.blocked),
    timerEnabled,
    timerDurationMs: timerEnabled ? Math.max(1000, toSafeInt(routeData?.unlock_timer_ms, fallbackTimerMs)) : 0,
    routeAccessFlags: normalizeFlagIdList(zoneFlags),
  };
}
