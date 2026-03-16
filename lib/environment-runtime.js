function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function createEnvironmentRuntime({
  clamp,
  toSafeInt,
  state,
  defaultRouteId,
  backgroundDriftTravelMinMs,
  backgroundDriftTravelMaxMs,
  backgroundDriftHoldMinMs,
  backgroundDriftHoldMaxMs,
  localDayStartHour,
  localNightStartHour,
  environmentUpdateIntervalMs,
  randomRange,
  easeInOutSine,
  padTwoDigits,
  getRenderQualitySettings,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;

  function getBackgroundDriftRangePx() {
    const shortestSide = Math.max(220, Math.min(state.viewport.width || 0, state.viewport.height || 0));
    return safeClamp(shortestSide * 0.018, 5, 16);
  }

  function pickBackgroundDriftTargetAxis(currentValue, rangePx) {
    const current = Number(currentValue) || 0;
    const reverseBias = -current * randomRange(0.45, 1);
    const jitter = randomRange(-rangePx * 0.42, rangePx * 0.42);
    return safeClamp(reverseBias + jitter, -rangePx, rangePx);
  }

  function scheduleNextBackgroundDriftMove(options = {}) {
    const drift = state.backgroundDrift;
    const immediate = Boolean(options.immediate);
    const rangePx = getBackgroundDriftRangePx();

    drift.startX = Number(drift.currentX) || 0;
    drift.startY = Number(drift.currentY) || 0;
    drift.targetX = pickBackgroundDriftTargetAxis(drift.currentX, rangePx);
    drift.targetY = pickBackgroundDriftTargetAxis(drift.currentY, rangePx);
    drift.travelElapsedMs = 0;
    drift.travelDurationMs = immediate
      ? randomRange(2800, 5200)
      : randomRange(backgroundDriftTravelMinMs, backgroundDriftTravelMaxMs);
    drift.holdMs = 0;
  }

  function resetBackgroundDriftForRoute(routeId, options = {}) {
    const drift = state.backgroundDrift;
    const immediate = Boolean(options.immediate);
    drift.routeId = String(routeId || "");
    drift.currentX = 0;
    drift.currentY = 0;
    drift.startX = 0;
    drift.startY = 0;
    drift.targetX = 0;
    drift.targetY = 0;
    drift.travelElapsedMs = 0;
    drift.travelDurationMs = 0;
    drift.holdMs = immediate ? 0 : randomRange(backgroundDriftHoldMinMs, backgroundDriftHoldMaxMs);
    scheduleNextBackgroundDriftMove({ immediate });
  }

  function ensureBackgroundDriftRouteSync() {
    const activeRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || defaultRouteId);
    if (state.backgroundDrift.routeId !== activeRouteId) {
      resetBackgroundDriftForRoute(activeRouteId, { immediate: true });
    }
  }

  function updateBackgroundDrift(deltaMs) {
    if (!state.backgroundImage) {
      state.backgroundDrift.currentX = 0;
      state.backgroundDrift.currentY = 0;
      return;
    }

    ensureBackgroundDriftRouteSync();
    const drift = state.backgroundDrift;
    const dt = Math.max(0, Number(deltaMs) || 0);

    if (drift.holdMs > 0) {
      drift.holdMs = Math.max(0, drift.holdMs - dt);
      if (drift.holdMs === 0) {
        scheduleNextBackgroundDriftMove();
      }
      return;
    }

    drift.travelElapsedMs += dt;
    const duration = Math.max(1, Number(drift.travelDurationMs) || 1);
    const progress = safeClamp(drift.travelElapsedMs / duration, 0, 1);
    const eased = easeInOutSine(progress);
    drift.currentX = drift.startX + (drift.targetX - drift.startX) * eased;
    drift.currentY = drift.startY + (drift.targetY - drift.startY) * eased;

    if (progress >= 1) {
      drift.currentX = drift.targetX;
      drift.currentY = drift.targetY;
      drift.holdMs = randomRange(backgroundDriftHoldMinMs, backgroundDriftHoldMaxMs);
    }
  }

  function getBackgroundDriftOffset() {
    ensureBackgroundDriftRouteSync();
    return {
      x: Number(state.backgroundDrift.currentX) || 0,
      y: Number(state.backgroundDrift.currentY) || 0,
    };
  }

  function getLocalTimeProfile(nowMs = Date.now()) {
    const nowDate = new Date(Number.isFinite(nowMs) ? nowMs : Date.now());
    const hour = nowDate.getHours();
    const minute = nowDate.getMinutes();
    const second = nowDate.getSeconds() + nowDate.getMilliseconds() / 1000;
    const isDay = hour >= localDayStartHour && hour < localNightStartHour;
    const dayLight = isDay ? 1 : 0;
    const night = isDay ? 0 : 1;
    return {
      nowMs: nowDate.getTime(),
      hour,
      minute,
      second,
      label: `${padTwoDigits(hour)}:${padTwoDigits(minute)}`,
      dayLight,
      night,
      timeOfDayTag: isDay ? "day" : "night",
    };
  }

  function getEnvironmentSnapshot(nowMs = Date.now()) {
    const timeProfile = getLocalTimeProfile(nowMs);
    return {
      nowMs: timeProfile.nowMs,
      localTimeLabel: timeProfile.label,
      localHour: timeProfile.hour,
      localMinute: timeProfile.minute,
      localSecond: Math.floor(timeProfile.second),
      dayLight: timeProfile.dayLight,
      night: timeProfile.night,
      timeOfDayTag: timeProfile.timeOfDayTag,
    };
  }

  function updateEnvironment(nowMs = Date.now(), force = false) {
    const now = Math.max(0, safeToInt(nowMs, Date.now()));
    const nextAllowed = Math.max(0, safeToInt(state.environment?.nextUpdateAtMs, 0));
    if (!force && state.environment.snapshot && now < nextAllowed) {
      return;
    }

    state.environment.snapshot = getEnvironmentSnapshot(now);
    const quality = typeof getRenderQualitySettings === "function" ? getRenderQualitySettings() : {};
    const intervalMult = safeClamp(Number(quality.environmentUpdateIntervalMult) || 1, 0.6, 3);
    const intervalMs = Math.max(50, Math.round(environmentUpdateIntervalMs * intervalMult));
    state.environment.nextUpdateAtMs = now + intervalMs;
  }

  function getEnvironmentSnapshotForRender() {
    if (state.environment?.snapshot) {
      return state.environment.snapshot;
    }
    updateEnvironment(Date.now(), true);
    return state.environment.snapshot || getEnvironmentSnapshot(Date.now());
  }

  return {
    getBackgroundDriftRangePx,
    pickBackgroundDriftTargetAxis,
    scheduleNextBackgroundDriftMove,
    resetBackgroundDriftForRoute,
    ensureBackgroundDriftRouteSync,
    updateBackgroundDrift,
    getBackgroundDriftOffset,
    getLocalTimeProfile,
    getEnvironmentSnapshot,
    updateEnvironment,
    getEnvironmentSnapshotForRender,
  };
}
