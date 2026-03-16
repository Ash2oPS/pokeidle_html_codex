function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function getDefaultDocument() {
  if (typeof document !== "undefined") {
    return document;
  }
  return null;
}

export function createRuntimeLoopKernel({
  state,
  update,
  updateHud,
  persistSaveData,
  getCurrentAttackIntervalMs,
  getForegroundSimulationBudgetMs,
  getSaveTickEpochMs,
  toSafeInt,
  isHidden,
  nowMs,
  maxForegroundPendingMs,
  maxOfflineCatchupMs,
  hiddenSimBudgetMs,
  bulkIdleThresholdMs,
  foregroundFrameStepMs,
  backgroundTickIntervalMs,
  hudAutoRefreshIntervalMs,
} = {}) {
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const updateFn = typeof update === "function" ? update : () => {};
  const updateHudFn = typeof updateHud === "function" ? updateHud : () => {};
  const persistSaveDataFn = typeof persistSaveData === "function" ? persistSaveData : () => {};
  const getAttackIntervalMs =
    typeof getCurrentAttackIntervalMs === "function" ? getCurrentAttackIntervalMs : () => 1;
  const getForegroundBudgetMs =
    typeof getForegroundSimulationBudgetMs === "function" ? getForegroundSimulationBudgetMs : () => 16;
  const getTickEpochMs =
    typeof getSaveTickEpochMs === "function"
      ? getSaveTickEpochMs
      : (savePayload) => Math.max(0, safeToInt(savePayload?.last_tick_epoch_ms, 0));
  const readNowMs = typeof nowMs === "function" ? nowMs : () => Date.now();
  const readHidden =
    typeof isHidden === "function"
      ? isHidden
      : () => {
          const doc = getDefaultDocument();
          return Boolean(doc?.hidden);
        };

  const foregroundPendingLimit = Math.max(0, Number(maxForegroundPendingMs) || 0);
  const offlineCatchupLimit = Math.max(0, Number(maxOfflineCatchupMs) || 0);
  const hiddenBudgetDefault = Math.max(1, Number(hiddenSimBudgetMs) || 1);
  const idleThresholdMs = Math.max(1, Number(bulkIdleThresholdMs) || 1);
  const foregroundStepMs = Math.max(1, Number(foregroundFrameStepMs) || 1);
  const backgroundTickMs = Math.max(1, Number(backgroundTickIntervalMs) || 1);
  const hudRefreshIntervalMs = Math.max(0, Number(hudAutoRefreshIntervalMs) || 0);

  function flushDeferredSaveIfNeeded() {
    if (!state?.deferredSaveDirty) {
      return;
    }
    state.deferredSaveDirty = false;
    persistSaveDataFn();
  }

  function queueRealtimeElapsedMs(inputNowMs = readNowMs()) {
    if (!state) {
      return 0;
    }
    const fallbackNow = readNowMs();
    const now = Math.max(0, safeToInt(inputNowMs, fallbackNow));
    if (state.realClockLastMs <= 0) {
      state.realClockLastMs = now;
      return 0;
    }
    const elapsed = now - state.realClockLastMs;
    state.realClockLastMs = now;
    if (!Number.isFinite(elapsed) || elapsed <= 0) {
      return 0;
    }
    state.pendingSimMs = Math.max(0, Number(state.pendingSimMs) || 0) + elapsed;
    if (!readHidden()) {
      state.pendingSimMs = Math.min(state.pendingSimMs, foregroundPendingLimit);
    }
    return elapsed;
  }

  function queueOfflineCatchupFromSave(inputNowMs = readNowMs()) {
    if (!state) {
      return 0;
    }
    const fallbackNow = readNowMs();
    const now = Math.max(0, safeToInt(inputNowMs, fallbackNow));
    const lastTick = getTickEpochMs(state.saveData);
    state.realClockLastMs = now;
    if (lastTick <= 0) {
      return 0;
    }
    const elapsed = now - lastTick;
    if (!Number.isFinite(elapsed) || elapsed <= 0) {
      return 0;
    }
    const capped = Math.min(elapsed, offlineCatchupLimit);
    state.pendingSimMs = Math.max(0, Number(state.pendingSimMs) || 0) + capped;
    return capped;
  }

  function consumePendingSimulation(options = {}) {
    if (!state || state.mode !== "ready") {
      return 0;
    }

    if (!state.battle || !state.team?.length) {
      state.pendingSimMs = 0;
      flushDeferredSaveIfNeeded();
      return 0;
    }

    const hidden = Boolean(readHidden());
    const budgetFromOptions = Number(options.budgetMs);
    const foregroundBudgetMs = getForegroundBudgetMs();
    const budgetMs =
      Number.isFinite(budgetFromOptions) && budgetFromOptions > 0
        ? budgetFromOptions
        : hidden
          ? hiddenBudgetDefault
          : foregroundBudgetMs;

    let consumedMs = 0;
    let safety = 0;
    const currentAttackInterval = getAttackIntervalMs();
    const minStepForSafety = Math.max(1, Math.min(foregroundStepMs, currentAttackInterval));
    const maxIterations = Math.max(64, Math.ceil(budgetMs / minStepForSafety) + 32);

    while (state.pendingSimMs > 0.5 && consumedMs < budgetMs && safety < maxIterations) {
      const remainingBudget = Math.max(0, budgetMs - consumedMs);
      if (remainingBudget <= 0) {
        break;
      }

      const remainingSim = state.pendingSimMs;
      const forceIdleMode = Boolean(options.forceIdleMode);
      const idleMode = forceIdleMode || hidden || remainingSim >= idleThresholdMs;
      const idealStep = idleMode ? Math.max(currentAttackInterval, idleThresholdMs) : foregroundStepMs;
      const stepMs = Math.max(1, Math.min(remainingBudget, remainingSim, idealStep));

      updateFn(stepMs, { idleMode });
      state.pendingSimMs = Math.max(0, state.pendingSimMs - stepMs);
      consumedMs += stepMs;
      safety += 1;
    }

    if (state.pendingSimMs <= 0.5) {
      state.pendingSimMs = 0;
    }

    flushDeferredSaveIfNeeded();
    if (consumedMs > 0) {
      const now = readNowMs();
      const lastHudUpdateMs = Math.max(0, safeToInt(state.lastHudAutoUpdateMs, 0));
      if (now - lastHudUpdateMs >= hudRefreshIntervalMs) {
        updateHudFn();
      }
    }
    return consumedMs;
  }

  function tickSimulationFromRealtime(options = {}) {
    if (!state) {
      return 0;
    }
    const now = readNowMs();
    if (state.mode !== "ready") {
      state.realClockLastMs = now;
      return 0;
    }
    const elapsedMs = queueRealtimeElapsedMs(now);
    if (readHidden() || Boolean(options.forceIdleMode)) {
      const configuredBudgetMs = Number(options.budgetMs);
      const hiddenElapsedBudgetMs = elapsedMs > 0 ? elapsedMs : backgroundTickMs;
      const cappedBudgetMs =
        Number.isFinite(configuredBudgetMs) && configuredBudgetMs > 0
          ? Math.min(configuredBudgetMs, hiddenElapsedBudgetMs)
          : hiddenElapsedBudgetMs;
      return consumePendingSimulation({
        ...options,
        budgetMs: cappedBudgetMs,
      });
    }
    return consumePendingSimulation(options);
  }

  return {
    queueRealtimeElapsedMs,
    queueOfflineCatchupFromSave,
    consumePendingSimulation,
    tickSimulationFromRealtime,
  };
}
