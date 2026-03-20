import {
  RUNTIME_ACTIVITY_BACKGROUND_LIVE,
  RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
} from "../lib/runtime-platform-utils.js";

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function isBackgroundActivityState(activityState) {
  return (
    activityState === RUNTIME_ACTIVITY_BACKGROUND_LIVE
    || activityState === RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED
  );
}

export function createRuntimeOrchestrator({
  state,
  nowMs,
  toSafeInt,
  ensureBackgroundTicker,
  stopBackgroundTicker,
  ensureForegroundCatchupPump,
  stopForegroundCatchupPump,
  tickSimulationFromRealtime,
  queueRealtimeElapsedMs,
  queueResumeCatchupFromRealtime,
  consumePendingSimulation,
  flushDeferredSaveIfNeeded,
  persistSaveData,
  render,
  hiddenSimBudgetMs,
  backgroundPumpMaxWorkMs,
  foregroundCatchupPumpMaxWorkMs,
  maxResumeCatchupMs,
  backgroundPersistDebounceMs,
  markSimulationPump,
} = {}) {
  const readNowMs = typeof nowMs === "function" ? nowMs : () => Date.now();
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const ensureBackgroundTickerFn = typeof ensureBackgroundTicker === "function" ? ensureBackgroundTicker : () => {};
  const stopBackgroundTickerFn = typeof stopBackgroundTicker === "function" ? stopBackgroundTicker : () => {};
  const ensureForegroundCatchupPumpFn =
    typeof ensureForegroundCatchupPump === "function" ? ensureForegroundCatchupPump : () => {};
  const stopForegroundCatchupPumpFn =
    typeof stopForegroundCatchupPump === "function" ? stopForegroundCatchupPump : () => {};
  const tickSimulationFromRealtimeFn =
    typeof tickSimulationFromRealtime === "function" ? tickSimulationFromRealtime : () => 0;
  const queueRealtimeElapsedMsFn = typeof queueRealtimeElapsedMs === "function" ? queueRealtimeElapsedMs : () => 0;
  const queueResumeCatchupFromRealtimeFn =
    typeof queueResumeCatchupFromRealtime === "function" ? queueResumeCatchupFromRealtime : () => 0;
  const consumePendingSimulationFn =
    typeof consumePendingSimulation === "function" ? consumePendingSimulation : () => 0;
  const flushDeferredSaveIfNeededFn =
    typeof flushDeferredSaveIfNeeded === "function" ? flushDeferredSaveIfNeeded : () => {};
  const persistSaveDataFn = typeof persistSaveData === "function" ? persistSaveData : () => {};
  const renderFn = typeof render === "function" ? render : () => {};
  const markSimulationPumpFn = typeof markSimulationPump === "function" ? markSimulationPump : () => {};
  const hiddenBudgetMs = Math.max(1, Number(hiddenSimBudgetMs) || 1);
  const backgroundPumpWorkLimitMs = Number.isFinite(Number(backgroundPumpMaxWorkMs))
    ? Math.max(0, Number(backgroundPumpMaxWorkMs))
    : Number.POSITIVE_INFINITY;
  const foregroundCatchupWorkLimitMs = Number.isFinite(Number(foregroundCatchupPumpMaxWorkMs))
    ? Math.max(0, Number(foregroundCatchupPumpMaxWorkMs))
    : Number.POSITIVE_INFINITY;
  const resumeCatchupLimit = Math.max(0, Number(maxResumeCatchupMs) || 0);
  const persistDebounceMs = Math.max(0, Number(backgroundPersistDebounceMs) || 0);

  function ensureBackgroundRuntimeState() {
    if (!state) {
      return null;
    }
    if (!state.backgroundRuntime || typeof state.backgroundRuntime !== "object") {
      state.backgroundRuntime = {
        activityState: "",
        lastBackgroundEnteredAtMs: 0,
        lastResumeAtMs: 0,
        lastResumeCatchupMs: 0,
        lastBackgroundReason: "",
        lastPersistAtMs: 0,
        lastLifecycleSource: "",
        suspendRequested: false,
        capacitorAppActive: null,
        capacitorAppSource: "",
        capacitorAppUpdatedAtMs: 0,
        debugOverlayEnabled: false,
      };
    }
    return state.backgroundRuntime;
  }

  function maybePersistLifecycleState(now, { force = false } = {}) {
    const backgroundRuntime = ensureBackgroundRuntimeState();
    const lastPersistAtMs = Math.max(0, safeToInt(backgroundRuntime?.lastPersistAtMs, 0));
    if (!force && persistDebounceMs > 0 && lastPersistAtMs > 0 && now - lastPersistAtMs < persistDebounceMs) {
      return false;
    }
    flushDeferredSaveIfNeededFn();
    persistSaveDataFn();
    return true;
  }

  function syncBackgroundRuntimeSnapshot(snapshot = {}, { source = "", now = readNowMs() } = {}) {
    const backgroundRuntime = ensureBackgroundRuntimeState();
    if (!backgroundRuntime) {
      return {
        previousActivityState: "",
        activityState: "",
        enteredBackground: false,
        resumedFromBackground: false,
      };
    }

    const previousActivityState = String(backgroundRuntime.activityState || "");
    const activityState = String(snapshot.activityState || previousActivityState || "");
    const previousWasBackground = isBackgroundActivityState(previousActivityState);
    const nextIsBackground = isBackgroundActivityState(activityState);

    backgroundRuntime.activityState = activityState;
    backgroundRuntime.lastLifecycleSource = String(source || snapshot.source || backgroundRuntime.lastLifecycleSource || "");
    backgroundRuntime.lastBackgroundReason = String(
      snapshot.backgroundReason || backgroundRuntime.lastBackgroundReason || "",
    );

    if (typeof snapshot.suspendRequested === "boolean") {
      backgroundRuntime.suspendRequested = snapshot.suspendRequested;
    }
    if (typeof snapshot.capacitorAppActive === "boolean" || snapshot.capacitorAppActive === null) {
      backgroundRuntime.capacitorAppActive = snapshot.capacitorAppActive;
    }

    const enteredBackground = nextIsBackground && !previousWasBackground;
    const resumedFromBackground = previousWasBackground && !nextIsBackground;

    if (enteredBackground) {
      backgroundRuntime.lastBackgroundEnteredAtMs = now;
    }
    if (resumedFromBackground) {
      backgroundRuntime.lastResumeAtMs = now;
    }

    return {
      previousActivityState,
      activityState,
      enteredBackground,
      resumedFromBackground,
    };
  }

  function handleRuntimeActivityChange(snapshot = {}, options = {}) {
    const now = Math.max(0, safeToInt(options.nowMs, readNowMs()));
    const source = String(options.source || snapshot.source || "");
    const transition = syncBackgroundRuntimeSnapshot(snapshot, { source, now });
    const backgroundRuntime = ensureBackgroundRuntimeState();
    const activityState = transition.activityState;
    const backgroundActivity = isBackgroundActivityState(activityState);

    if (backgroundActivity) {
      stopForegroundCatchupPumpFn();
      ensureBackgroundTickerFn();
      const consumedMs = tickSimulationFromRealtimeFn({
        activityState,
        forceIdleMode: true,
        budgetMs: hiddenBudgetMs,
        maxWorkMs: backgroundPumpWorkLimitMs,
        skipForegroundClamp: true,
      });
      if (consumedMs > 0) {
        markSimulationPumpFn(now);
      }
      maybePersistLifecycleState(now, {
        force: activityState === RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED || Boolean(options.forcePersist),
      });
      return {
        activityState,
        resumeCatchupMs: 0,
        consumedMs,
      };
    }

    stopBackgroundTickerFn();

    let resumeCatchupMs = 0;
    if (transition.resumedFromBackground) {
      stopForegroundCatchupPumpFn();
      resumeCatchupMs = queueResumeCatchupFromRealtimeFn(now, {
        activityState,
        maxCatchupMs: resumeCatchupLimit,
      });
      backgroundRuntime.lastResumeCatchupMs = resumeCatchupMs;
      const consumedMs = consumePendingSimulationFn({
        activityState,
        forceIdleMode: true,
        budgetMs: hiddenBudgetMs,
        maxWorkMs: foregroundCatchupWorkLimitMs,
      });
      if (resumeCatchupMs > 0 || consumedMs > 0) {
        markSimulationPumpFn(now);
      }
      if (Math.max(0, Number(state?.pendingSimMs) || 0) > 0.5) {
        ensureForegroundCatchupPumpFn();
      }
      renderFn();
      return {
        activityState,
        resumeCatchupMs,
        consumedMs,
      };
    }

    const consumedMs = tickSimulationFromRealtimeFn({
      activityState,
    });
    if (consumedMs > 0) {
      markSimulationPumpFn(now);
    }
    renderFn();
    return {
      activityState,
      resumeCatchupMs,
      consumedMs,
    };
  }

  function handlePageLifecyclePersist(snapshot = {}, options = {}) {
    const now = Math.max(0, safeToInt(options.nowMs, readNowMs()));
    const source = String(options.source || snapshot.source || "pagehide");
    const persistedSnapshot = {
      ...snapshot,
      activityState: snapshot.activityState || RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
      suspendRequested: snapshot.suspendRequested ?? true,
      backgroundReason: snapshot.backgroundReason || "page_lifecycle_persist",
      source,
    };
    stopForegroundCatchupPumpFn();
    syncBackgroundRuntimeSnapshot(persistedSnapshot, { source, now });
    queueRealtimeElapsedMsFn(now, {
      activityState: persistedSnapshot.activityState,
      skipForegroundClamp: true,
    });
    const consumedMs = consumePendingSimulationFn({
      activityState: persistedSnapshot.activityState,
      forceIdleMode: true,
      budgetMs: hiddenBudgetMs,
      maxWorkMs: backgroundPumpWorkLimitMs,
    });
    if (consumedMs > 0) {
      markSimulationPumpFn(now);
    }
    maybePersistLifecycleState(now, { force: true });
    return {
      activityState: persistedSnapshot.activityState,
      consumedMs,
    };
  }

  return {
    handleRuntimeActivityChange,
    handlePageLifecyclePersist,
  };
}
