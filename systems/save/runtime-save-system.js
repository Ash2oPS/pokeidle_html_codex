function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function createRuntimeSaveSystem({
  state,
  hasIndexedDbSaveSupport,
  hasDesktopSaveBridge,
  readSaveDataFromDesktopBridge,
  readSaveDataFromLocalStorage,
  readSaveDataFromSessionStorage,
  readSaveDataFromIndexedDb,
  writeSerializedSaveToIndexedDb,
  writeSerializedSaveToDesktopBridge,
  writeSerializedSaveToStorageKey,
  pickPreferredSaveCandidate,
  createEmptySave,
  repairNormalizedSaveSnapshot,
  readSeededDevSaveData,
  saveVersion,
  appVersion,
  saveKey,
  saveSessionKey,
  saveSourceDesktop,
  saveSourceLocalStorage,
  saveSourceSessionStorage,
  saveSourceIndexedDb,
  saveBackendLabelBrowser,
  saveBackendLabelDesktop,
  saveBackendLabelUnavailable,
  saveBackendValueEl,
  setTimeoutFn,
  clearTimeoutFn,
  toSafeInt,
  nowMs,
} = {}) {
  const hasIndexedDbSupportFn = typeof hasIndexedDbSaveSupport === "function" ? hasIndexedDbSaveSupport : () => false;
  const hasDesktopBridgeFn = typeof hasDesktopSaveBridge === "function" ? hasDesktopSaveBridge : () => false;
  const readDesktopSaveFn = typeof readSaveDataFromDesktopBridge === "function" ? readSaveDataFromDesktopBridge : async () => null;
  const readLocalStorageSaveFn = typeof readSaveDataFromLocalStorage === "function" ? readSaveDataFromLocalStorage : () => null;
  const readSessionStorageSaveFn =
    typeof readSaveDataFromSessionStorage === "function" ? readSaveDataFromSessionStorage : () => null;
  const readIndexedDbSaveFn = typeof readSaveDataFromIndexedDb === "function" ? readSaveDataFromIndexedDb : async () => null;
  const writeIndexedDbSaveFn =
    typeof writeSerializedSaveToIndexedDb === "function" ? writeSerializedSaveToIndexedDb : async () => false;
  const writeDesktopSaveFn =
    typeof writeSerializedSaveToDesktopBridge === "function" ? writeSerializedSaveToDesktopBridge : async () => false;
  const writeStorageKeyFn =
    typeof writeSerializedSaveToStorageKey === "function" ? writeSerializedSaveToStorageKey : () => false;
  const pickPreferredSaveFn = typeof pickPreferredSaveCandidate === "function" ? pickPreferredSaveCandidate : () => null;
  const createEmptySaveFn = typeof createEmptySave === "function" ? createEmptySave : () => ({});
  const repairSaveSnapshotFn =
    typeof repairNormalizedSaveSnapshot === "function"
      ? repairNormalizedSaveSnapshot
      : (saveData) => ({ saveData });
  const readSeededSaveFn = typeof readSeededDevSaveData === "function" ? readSeededDevSaveData : async () => null;
  const setTimeoutSafe = typeof setTimeoutFn === "function" ? setTimeoutFn : setTimeout;
  const clearTimeoutSafe = typeof clearTimeoutFn === "function" ? clearTimeoutFn : clearTimeout;
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const readNowMs = typeof nowMs === "function" ? nowMs : () => Date.now();

  const sourceDesktop = String(saveSourceDesktop || "desktop");
  const sourceLocalStorage = String(saveSourceLocalStorage || "local_storage");
  const sourceSessionStorage = String(saveSourceSessionStorage || "session_storage");
  const sourceIndexedDb = String(saveSourceIndexedDb || "indexed_db");

  const labelBrowser = String(saveBackendLabelBrowser || "Sauvegarde navigateur");
  const labelDesktop = String(saveBackendLabelDesktop || "Sauvegarde locale (Desktop)");
  const labelUnavailable = String(saveBackendLabelUnavailable || "Sauvegarde indisponible");

  function clearBrowserSaveRetry() {
    if (!state?.saveBackend?.retryTimerId) {
      return;
    }
    clearTimeoutSafe(state.saveBackend.retryTimerId);
    state.saveBackend.retryTimerId = 0;
  }

  function clearDesktopSaveRetry() {
    if (!state?.saveBackend?.desktopRetryTimerId) {
      return;
    }
    clearTimeoutSafe(state.saveBackend.desktopRetryTimerId);
    state.saveBackend.desktopRetryTimerId = 0;
  }

  function refreshSaveBackendStatus() {
    const browserOk = Boolean(state.saveBackend.syncStorageAvailable) || hasIndexedDbSupportFn();
    state.saveBackend.browserLastPersistSucceeded = browserOk;

    if (hasDesktopBridgeFn()) {
      const desktopOk = state.saveBackend.desktopLastPersistSucceeded;
      state.saveBackend.lastPersistSucceeded = desktopOk == null ? browserOk : Boolean(desktopOk) || browserOk;
      return;
    }

    state.saveBackend.lastPersistSucceeded = browserOk;
  }

  function updateSaveBackendIndicator() {
    if (!saveBackendValueEl) {
      return;
    }
    const desktopReady = hasDesktopBridgeFn()
      && state.saveBackend.desktopBridgeAvailable !== false
      && state.saveBackend.desktopLastPersistSucceeded !== false;
    const nextLabel = desktopReady
      ? labelDesktop
      : state.saveBackend.lastPersistSucceeded
        ? labelBrowser
        : labelUnavailable;
    if (saveBackendValueEl.textContent !== nextLabel) {
      saveBackendValueEl.textContent = nextLabel;
    }
  }

  function scheduleBrowserSaveRetry() {
    if (state.saveBackend.retryTimerId || !hasIndexedDbSupportFn()) {
      return;
    }
    state.saveBackend.retryTimerId = setTimeoutSafe(() => {
      state.saveBackend.retryTimerId = 0;
      void drainPendingBrowserSaveWrites();
    }, 900);
  }

  function scheduleDesktopSaveRetry() {
    if (state.saveBackend.desktopRetryTimerId || !hasDesktopBridgeFn()) {
      return;
    }
    state.saveBackend.desktopRetryTimerId = setTimeoutSafe(() => {
      state.saveBackend.desktopRetryTimerId = 0;
      void drainPendingDesktopSaveWrites();
    }, 1300);
  }

  async function drainPendingBrowserSaveWrites() {
    if (state.saveBackend.indexedDbWriteInFlight || !state.saveBackend.pendingSerializedSave) {
      return;
    }

    clearBrowserSaveRetry();
    state.saveBackend.indexedDbWriteInFlight = true;
    try {
      while (state.saveBackend.pendingSerializedSave) {
        const serializedSave = state.saveBackend.pendingSerializedSave;
        const ok = await writeIndexedDbSaveFn(serializedSave);
        if (!ok) {
          if (state.saveBackend.indexedDbAvailable === false) {
            state.saveBackend.pendingSerializedSave = null;
          }
          break;
        }
        if (state.saveBackend.pendingSerializedSave === serializedSave) {
          state.saveBackend.pendingSerializedSave = null;
        }
      }
    } finally {
      state.saveBackend.indexedDbWriteInFlight = false;
      refreshSaveBackendStatus();
      updateSaveBackendIndicator();
      if (state.saveBackend.pendingSerializedSave && state.saveBackend.indexedDbAvailable !== false) {
        scheduleBrowserSaveRetry();
      }
    }
  }

  async function drainPendingDesktopSaveWrites() {
    if (state.saveBackend.desktopWriteInFlight || !state.saveBackend.pendingDesktopSerializedSave) {
      return;
    }

    clearDesktopSaveRetry();
    state.saveBackend.desktopWriteInFlight = true;
    try {
      while (state.saveBackend.pendingDesktopSerializedSave) {
        const serializedSave = state.saveBackend.pendingDesktopSerializedSave;
        const ok = await writeDesktopSaveFn(serializedSave);
        if (!ok) {
          state.saveBackend.desktopLastPersistSucceeded = false;
          if (state.saveBackend.desktopBridgeAvailable === false) {
            state.saveBackend.pendingDesktopSerializedSave = null;
          }
          break;
        }
        if (state.saveBackend.pendingDesktopSerializedSave === serializedSave) {
          state.saveBackend.pendingDesktopSerializedSave = null;
        }
        state.saveBackend.desktopLastPersistSucceeded = true;
      }
    } finally {
      state.saveBackend.desktopWriteInFlight = false;
      refreshSaveBackendStatus();
      updateSaveBackendIndicator();
      if (state.saveBackend.pendingDesktopSerializedSave && state.saveBackend.desktopBridgeAvailable !== false) {
        scheduleDesktopSaveRetry();
      }
    }
  }

  function queueBrowserSaveWrite(serializedSave) {
    if (!hasIndexedDbSupportFn()) {
      state.saveBackend.indexedDbAvailable = false;
      return;
    }
    state.saveBackend.pendingSerializedSave = serializedSave;
    if (!state.saveBackend.indexedDbWriteInFlight) {
      void drainPendingBrowserSaveWrites();
    }
  }

  function queueDesktopSaveWrite(serializedSave) {
    if (!hasDesktopBridgeFn()) {
      state.saveBackend.desktopBridgeAvailable = false;
      return;
    }
    state.saveBackend.pendingDesktopSerializedSave = serializedSave;
    if (!state.saveBackend.desktopWriteInFlight) {
      void drainPendingDesktopSaveWrites();
    }
  }

  function syncSerializedSaveToBrowserStorage(serializedSave) {
    const localStorageOk = writeStorageKeyFn("localStorage", saveKey, serializedSave);
    const sessionStorageOk = writeStorageKeyFn("sessionStorage", saveSessionKey, serializedSave);
    state.saveBackend.syncStorageAvailable = localStorageOk || sessionStorageOk;
    queueBrowserSaveWrite(serializedSave);
    queueDesktopSaveWrite(serializedSave);
    refreshSaveBackendStatus();
    updateSaveBackendIndicator();
    return state.saveBackend.lastPersistSucceeded;
  }

  function getSaveBackendTelemetryValue() {
    const hasDesktop = hasDesktopBridgeFn() && state.saveBackend.desktopBridgeAvailable !== false;
    return hasDesktop ? "desktop_bridge" : "browser_storage";
  }

  function getSaveTickEpochMs(savePayload) {
    return Math.max(0, safeToInt(savePayload?.last_tick_epoch_ms, 0));
  }

  async function loadSaveData() {
    let selected = await readSeededSaveFn();
    if (!selected) {
      const candidates = [];
      const desktopSave = await readDesktopSaveFn();
      if (desktopSave) {
        candidates.push({
          source: sourceDesktop,
          saveData: desktopSave,
        });
      }

      const localStorageSave = readLocalStorageSaveFn();
      if (localStorageSave) {
        candidates.push({
          source: sourceLocalStorage,
          saveData: localStorageSave,
        });
      }

      const sessionStorageSave = readSessionStorageSaveFn();
      if (sessionStorageSave) {
        candidates.push({
          source: sourceSessionStorage,
          saveData: sessionStorageSave,
        });
      }

      const indexedDbSave = await readIndexedDbSaveFn();
      if (indexedDbSave) {
        candidates.push({
          source: sourceIndexedDb,
          saveData: indexedDbSave,
        });
      }

      selected = pickPreferredSaveFn(candidates)?.saveData || createEmptySaveFn();
    }

    const repairResult = repairSaveSnapshotFn(selected);
    selected = repairResult.saveData;
    syncSerializedSaveToBrowserStorage(JSON.stringify(selected));
    return selected;
  }

  function persistSaveData() {
    if (!state.saveData) {
      return;
    }
    state.saveData.version = saveVersion;
    state.saveData.app_build_version = appVersion;
    state.saveData.last_tick_epoch_ms = readNowMs();
    syncSerializedSaveToBrowserStorage(JSON.stringify(state.saveData));
  }

  return {
    clearBrowserSaveRetry,
    clearDesktopSaveRetry,
    refreshSaveBackendStatus,
    updateSaveBackendIndicator,
    queueBrowserSaveWrite,
    queueDesktopSaveWrite,
    syncSerializedSaveToBrowserStorage,
    getSaveBackendTelemetryValue,
    getSaveTickEpochMs,
    loadSaveData,
    persistSaveData,
  };
}
