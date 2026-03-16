function getDefaultDocument() {
  if (typeof document !== "undefined") {
    return document;
  }
  return null;
}

export function createRuntimeOrchestrator({
  isHidden,
  ensureBackgroundTicker,
  stopBackgroundTicker,
  tickSimulationFromRealtime,
  queueRealtimeElapsedMs,
  consumePendingSimulation,
  flushDeferredSaveIfNeeded,
  persistSaveData,
  render,
  hiddenSimBudgetMs,
} = {}) {
  const readHidden =
    typeof isHidden === "function"
      ? isHidden
      : () => {
          const doc = getDefaultDocument();
          return Boolean(doc?.hidden);
        };
  const ensureBackgroundTickerFn = typeof ensureBackgroundTicker === "function" ? ensureBackgroundTicker : () => {};
  const stopBackgroundTickerFn = typeof stopBackgroundTicker === "function" ? stopBackgroundTicker : () => {};
  const tickSimulationFromRealtimeFn =
    typeof tickSimulationFromRealtime === "function" ? tickSimulationFromRealtime : () => 0;
  const queueRealtimeElapsedMsFn = typeof queueRealtimeElapsedMs === "function" ? queueRealtimeElapsedMs : () => 0;
  const consumePendingSimulationFn =
    typeof consumePendingSimulation === "function" ? consumePendingSimulation : () => 0;
  const flushDeferredSaveIfNeededFn =
    typeof flushDeferredSaveIfNeeded === "function" ? flushDeferredSaveIfNeeded : () => {};
  const persistSaveDataFn = typeof persistSaveData === "function" ? persistSaveData : () => {};
  const renderFn = typeof render === "function" ? render : () => {};
  const hiddenBudgetMs = Math.max(1, Number(hiddenSimBudgetMs) || 1);

  function handleVisibilityChange() {
    if (readHidden()) {
      ensureBackgroundTickerFn();
      tickSimulationFromRealtimeFn({
        forceIdleMode: true,
        budgetMs: hiddenBudgetMs,
      });
      flushDeferredSaveIfNeededFn();
      persistSaveDataFn();
      return;
    }

    stopBackgroundTickerFn();
    tickSimulationFromRealtimeFn();
    renderFn();
  }

  function handlePageLifecyclePersist() {
    queueRealtimeElapsedMsFn();
    consumePendingSimulationFn({
      forceIdleMode: true,
      budgetMs: hiddenBudgetMs,
    });
    flushDeferredSaveIfNeededFn();
    persistSaveDataFn();
  }

  return {
    handleVisibilityChange,
    handlePageLifecyclePersist,
  };
}
