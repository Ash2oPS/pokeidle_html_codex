import { buildSaveExportFilename, parseImportedCompactSave } from "../lib/save-transfer-utils.js";

function getDefaultDocument() {
  if (typeof document !== "undefined") {
    return document;
  }
  return null;
}

function getDefaultWindow() {
  if (typeof window !== "undefined") {
    return window;
  }
  return null;
}

function asFunction(value, fallback = () => {}) {
  return typeof value === "function" ? value : fallback;
}

function asAsyncFunction(value, fallback = async () => {}) {
  return typeof value === "function" ? value : fallback;
}

function createDependencyReader(options = {}) {
  const resolveBinding =
    typeof options.resolveBinding === "function" ? options.resolveBinding : null;
  const bindings =
    options.bindings && typeof options.bindings === "object"
      ? options.bindings
      : options;

  return function readDependency(name, fallbackValue = undefined) {
    if (bindings && Object.prototype.hasOwnProperty.call(bindings, name)) {
      return bindings[name];
    }
    if (resolveBinding) {
      const resolvedValue = resolveBinding(name);
      if (resolvedValue !== undefined) {
        return resolvedValue;
      }
    }
    return fallbackValue;
  };
}

export function createRuntimeBootstrapSystem(options = {}) {
  const read = createDependencyReader(options);

  const state = read("state", null);
  const documentRef = read("document", getDefaultDocument());
  const windowRef = read("window", getDefaultWindow());
  const requestAnimationFrameFn =
    typeof windowRef?.requestAnimationFrame === "function"
      ? windowRef.requestAnimationFrame.bind(windowRef)
      : (callback) => setTimeout(callback, 0);
  const setTimeoutFn =
    typeof windowRef?.setTimeout === "function"
      ? windowRef.setTimeout.bind(windowRef)
      : setTimeout;
  const clearTimeoutFn =
    typeof windowRef?.clearTimeout === "function"
      ? windowRef.clearTimeout.bind(windowRef)
      : clearTimeout;

  const getPokemonLoadTargets = asFunction(read("getPokemonLoadTargets"));
  const loadPokemonEntity = asAsyncFunction(read("loadPokemonEntity"), async () => null);
  const buildPokemonJsonPath = asFunction(read("buildPokemonJsonPath"), () => "");
  const applyPokemonTalentCsvToDefinitions = asFunction(read("applyPokemonTalentCsvToDefinitions"));

  const showLoadingScreen = asFunction(read("showLoadingScreen"));
  const hideLoadingScreen = asFunction(read("hideLoadingScreen"));
  const render = asFunction(read("render"));
  const updateEnvironment = asFunction(read("updateEnvironment"));
  const initializeWindowsNotificationSystem = asAsyncFunction(read("initializeWindowsNotificationSystem"));
  const resetNotificationSystem = asFunction(read("resetNotificationSystem"));
  const normalizeShopQuantityMode = asFunction(read("normalizeShopQuantityMode"), (mode) => String(mode || "1"));
  const clamp = asFunction(read("clamp"), (value, min, max) => Math.min(max, Math.max(min, value)));
  const toSafeInt = asFunction(
    read("toSafeInt"),
    (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
  );
  const clearMoneyGainFloaters = asFunction(read("clearMoneyGainFloaters"));
  const setBallConfigState = asFunction(read("setBallConfigState"));
  const setShopItemConfigState = asFunction(read("setShopItemConfigState"));
  const setZoneEncounterCsvState = asFunction(read("setZoneEncounterCsvState"));
  const setPokemonTalentCsvState = asFunction(read("setPokemonTalentCsvState"));
  const stopBackgroundTicker = asFunction(read("stopBackgroundTicker"));
  const stopForegroundCatchupPump = asFunction(read("stopForegroundCatchupPump"));
  const clearTeamDragState = asFunction(read("clearTeamDragState"));
  const closeTeamContextMenu = asFunction(read("closeTeamContextMenu"));
  const clearCanvasHoverState = asFunction(read("clearCanvasHoverState"));
  const closeRenameModal = asFunction(read("closeRenameModal"));
  const closeBoxesModal = asFunction(read("closeBoxesModal"));
  const closePokedexModal = asFunction(read("closePokedexModal"));
  const closeAppearanceModal = asFunction(read("closeAppearanceModal"));
  const closeGachaModal = asFunction(read("closeGachaModal"));
  const setMapOpen = asFunction(read("setMapOpen"));
  const setShopOpen = asFunction(read("setShopOpen"));
  const loadBallConfigCsv = asAsyncFunction(read("loadBallConfigCsv"), async () => null);
  const loadShopItemConfigCsv = asAsyncFunction(read("loadShopItemConfigCsv"), async () => null);
  const loadZoneEncounterCsv = asAsyncFunction(read("loadZoneEncounterCsv"), async () => null);
  const loadPokemonTalentCsv = asAsyncFunction(read("loadPokemonTalentCsv"), async () => null);
  const loadSaveData = asAsyncFunction(read("loadSaveData"), async () => null);
  const loadRouteCatalog = asAsyncFunction(read("loadRouteCatalog"), async () => new Map());
  const refreshOrderedCatalogRouteIds = asFunction(read("refreshOrderedCatalogRouteIds"));
  const ensureUnlockedRoutesForCurrentCatalog = asFunction(
    read("ensureUnlockedRoutesForCurrentCatalog"),
    () => [],
  );
  const getInitialAssetRouteIds = asFunction(read("getInitialAssetRouteIds"), () => []);
  const getRouteDataByIds = asFunction(read("getRouteDataByIds"), () => []);
  const reconcileEntityUnlockStates = asFunction(read("reconcileEntityUnlockStates"), () => false);
  const reconcileEntityAppearanceStates = asFunction(read("reconcileEntityAppearanceStates"), () => false);
  const repairRuntimeSaveAfterDefinitionsLoaded = asFunction(
    read("repairRuntimeSaveAfterDefinitionsLoaded"),
    () => ({ changed: false, recoveredTeam: false, hardResetApplied: false }),
  );
  const getTutorialProgress = asFunction(read("getTutorialProgress"), () => ({}));
  const ensureAppearanceEditorUnlockedFromProgress = asFunction(
    read("ensureAppearanceEditorUnlockedFromProgress"),
    () => false,
  );
  const preloadRouteBackgrounds = asAsyncFunction(read("preloadRouteBackgrounds"), async () => new Map());
  const preloadTypeIcons = asAsyncFunction(read("preloadTypeIcons"), async () => new Map());
  const preloadSelectedAppearanceAssetsForTeam = asAsyncFunction(
    read("preloadSelectedAppearanceAssetsForTeam"),
    async () => null,
  );
  const setActiveRoute = asFunction(read("setActiveRoute"), () => false);
  const ensureMoneyAndItems = asFunction(read("ensureMoneyAndItems"));
  const syncWindowsPokeballInventoryTracking = asFunction(read("syncWindowsPokeballInventoryTracking"));
  const rebuildTeamAndSyncBattle = asFunction(read("rebuildTeamAndSyncBattle"));
  const persistSaveData = asFunction(read("persistSaveData"));
  const queueOfflineCatchupFromSave = asFunction(read("queueOfflineCatchupFromSave"), () => 0);
  const renderStarterChoices = asFunction(read("renderStarterChoices"));
  const updateHud = asFunction(read("updateHud"));
  const showStarterModal = asFunction(read("showStarterModal"));
  const setTopMessage = asFunction(read("setTopMessage"));
  const hideStarterModal = asFunction(read("hideStarterModal"));
  const startBattle = asFunction(read("startBattle"));
  const queueDeferredRouteAssetWarmup = asFunction(read("queueDeferredRouteAssetWarmup"));
  const queueAppearanceTutorialIfNeeded = asFunction(read("queueAppearanceTutorialIfNeeded"));
  const tryOpenPendingTutorialFlow = asFunction(read("tryOpenPendingTutorialFlow"));
  const consumePendingSimulation = asFunction(read("consumePendingSimulation"), () => 0);
  const refreshLayoutIfNeeded = asFunction(read("refreshLayoutIfNeeded"));
  const ensureBackgroundTicker = asFunction(read("ensureBackgroundTicker"));

  const clearBrowserSaveRetry = asFunction(read("clearBrowserSaveRetry"));
  const clearDesktopSaveRetry = asFunction(read("clearDesktopSaveRetry"));
  const removeSaveDataFromStorageKey = asFunction(read("removeSaveDataFromStorageKey"), () => false);
  const deleteSaveDataFromIndexedDb = asAsyncFunction(read("deleteSaveDataFromIndexedDb"), async () => false);
  const deleteSaveDataFromDesktopBridge = asAsyncFunction(
    read("deleteSaveDataFromDesktopBridge"),
    async () => false,
  );
  const removeLegacySaveDataFromLocalStorage = asFunction(read("removeLegacySaveDataFromLocalStorage"), () => false);
  const removeLegacySaveDataFromSessionStorage = asFunction(read("removeLegacySaveDataFromSessionStorage"), () => false);
  const deleteLegacySaveDataFromIndexedDb = asAsyncFunction(
    read("deleteLegacySaveDataFromIndexedDb"),
    async () => false,
  );
  const deleteLegacySaveDataFromDesktopBridge = asAsyncFunction(
    read("deleteLegacySaveDataFromDesktopBridge"),
    async () => false,
  );
  const updateSaveBackendIndicator = asFunction(read("updateSaveBackendIndicator"));
  const createEmptySave = asFunction(read("createEmptySave"), () => ({}));
  const serializeSaveData = asFunction(read("serializeSaveData"), (saveData) => JSON.stringify(saveData));
  const isCompactSavePayload = asFunction(read("isCompactSavePayload"), () => false);
  const decodeCompactSave = asFunction(read("decodeCompactSave"), (saveData) => saveData);
  const repairNormalizedSaveSnapshot = asFunction(
    read("repairNormalizedSaveSnapshot"),
    (saveData) => ({ saveData }),
  );

  const gameStageEl = read("gameStageEl", null);
  const canvas = read("canvas", null);
  const tutorialModalEl = read("tutorialModalEl", null);
  const actionDockFullscreenMenuEl = read("actionDockFullscreenMenuEl", null);
  const actionDockPokeballToggleButtonEl = read("actionDockPokeballToggleButtonEl", null);
  const actionDockPokeballVisualEl = read("actionDockPokeballVisualEl", null);

  const LOADING_SCREEN_DEFAULT_TEXT = read("LOADING_SCREEN_DEFAULT_TEXT", "");
  const SHOP_TAB_POKEBALLS = read("SHOP_TAB_POKEBALLS", "");
  const SHOP_TAB_COMBAT = read("SHOP_TAB_COMBAT", "");
  const SHOP_TAB_EVOLUTIONS = read("SHOP_TAB_EVOLUTIONS", "");
  const BALL_INVENTORY_MAX_PER_TYPE = Number(read("BALL_INVENTORY_MAX_PER_TYPE", 999));
  const BALL_CONFIG_CSV_PATH = read("BALL_CONFIG_CSV_PATH", "");
  const SHOP_ITEMS_CSV_PATH = read("SHOP_ITEMS_CSV_PATH", "");
  const ROUTE_ENCOUNTERS_CSV_PATH = read("ROUTE_ENCOUNTERS_CSV_PATH", "");
  const POKEMON_TALENTS_CSV_PATH = read("POKEMON_TALENTS_CSV_PATH", "");
  const ROUTE_ID_ORDER = read("ROUTE_ID_ORDER", []);
  const DEFAULT_ROUTE_ID = read("DEFAULT_ROUTE_ID", "");
  const HIDDEN_SIM_BUDGET_MS = Number(read("HIDDEN_SIM_BUDGET_MS", 1));
  const SAVE_KEY = read("SAVE_KEY", "");
  const ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS = Number(
    read("ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS", 0),
  );

  let actionDockFullscreenMenuOpenTimeoutId = 0;
  let saveImportInputEl = null;

  function clearPendingSaveWrites() {
    state.saveBackend.pendingSerializedSave = null;
    state.saveBackend.pendingDesktopSerializedSave = null;
    clearBrowserSaveRetry();
    clearDesktopSaveRetry();
  }

  function resetTransientRuntimeState() {
    syncWindowsPokeballInventoryTracking(state.saveData?.pokeballs, { silent: true });
    state.team = [];
    state.enemy = null;
    state.battle = null;
    state.pendingSimMs = 0;
    state.deferredSaveDirty = false;
    state.teamLevelUpEffects = [];
    state.teamXpGainEffects = [];
    state.teamXpPulseMsBySlot = {};
    state.xpHud.teamXpBySlot = {};
    state.xpHud.enemyHpKey = null;
    state.xpHud.enemyHpFrontRatio = 1;
    state.xpHud.enemyHpLagRatio = 1;
    state.moneyHud.initialized = false;
    state.moneyHud.targetValue = 0;
    state.moneyHud.displayValue = 0;
    state.moneyHud.lastRawValue = 0;
    state.moneyHud.pulseMs = 0;
    clearMoneyGainFloaters();
    state.evolutionAnimation.current = null;
    state.evolutionAnimation.queue = [];
    state.tutorial.queue = [];
    state.tutorial.active = null;
    state.ui.tutorialOpen = false;
    if (tutorialModalEl) {
      tutorialModalEl.classList.add("hidden");
    }
    state.ui.shopTab = SHOP_TAB_POKEBALLS;
    state.ui.shopQuantityMode = "1";
    state.ui.shopCustomQuantity = 1;
    state.realClockLastMs = Date.now();
    state.environment.nextUpdateAtMs = 0;
    updateEnvironment(Date.now(), true);
    stopBackgroundTicker();
    stopForegroundCatchupPump();
    setMapOpen(false);
    setShopOpen(false);
    closeGachaModal({ force: true });
    closeRenameModal();
    closeBoxesModal();
    closePokedexModal();
    closeAppearanceModal();
    setActionDockFullscreenMenuOpen(false, { animate: false });
    closeTeamContextMenu();
    clearTeamDragState();
    clearCanvasHoverState();
    hideStarterModal();
  }

  async function applySaveAndRestart(nextSaveData, options = {}) {
    if (!nextSaveData || typeof nextSaveData !== "object") {
      throw new Error("La sauvegarde fournie est invalide.");
    }

    clearPendingSaveWrites();
    state.saveData = nextSaveData;
    resetTransientRuntimeState();
    persistSaveData();
    updateHud();
    await initializeScene();
    const successMessage = String(options.successMessage || "");
    if (successMessage && state.mode === "ready") {
      setTopMessage(successMessage, 2600);
    }
  }

  function downloadTextFile(filename, content, mimeType = "application/json;charset=utf-8") {
    if (!documentRef?.createElement || !windowRef?.URL?.createObjectURL || typeof Blob === "undefined") {
      throw new Error("Le telechargement de fichier n'est pas disponible ici.");
    }

    const blob = new Blob([content], { type: mimeType });
    const objectUrl = windowRef.URL.createObjectURL(blob);
    const link = documentRef.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    link.style.position = "fixed";
    link.style.left = "-9999px";
    if (documentRef.body?.appendChild) {
      documentRef.body.appendChild(link);
    }
    link.click();
    if (typeof link.remove === "function") {
      link.remove();
    }
    setTimeoutFn(() => {
      windowRef.URL.revokeObjectURL(objectUrl);
    }, 0);
  }

  function ensureSaveImportInput() {
    if (saveImportInputEl) {
      return saveImportInputEl;
    }
    if (!documentRef?.createElement) {
      return null;
    }
    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    if (documentRef.body?.appendChild) {
      documentRef.body.appendChild(input);
    }
    saveImportInputEl = input;
    return saveImportInputEl;
  }

  function requestSaveImportText() {
    const input = ensureSaveImportInput();
    if (!input) {
      return Promise.reject(new Error("L'import de fichier n'est pas disponible ici."));
    }

    return new Promise((resolve, reject) => {
      input.value = "";
      input.onchange = async () => {
        input.onchange = null;
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          resolve(await file.text());
        } catch (error) {
          reject(error);
        }
      };
      input.click();
    });
  }

  async function loadPokemonDefinitions(routeDataInput, runtimeOptions = {}) {
    const append = runtimeOptions?.append !== false;
    const defsById = append ? new Map(state?.pokemonDefsById) : new Map();
    const queuedIds = new Set();
    const queue = [];

    const enqueueTarget = (idRaw, nameEnRaw) => {
      const id = Number(idRaw || 0);
      const nameEn = String(nameEnRaw || "").toLowerCase().trim();
      if (id <= 0 || !nameEn || defsById.has(id) || queuedIds.has(id)) {
        return;
      }
      queuedIds.add(id);
      queue.push({ id, nameEn });
    };

    for (const target of getPokemonLoadTargets(routeDataInput)) {
      enqueueTarget(target.id, target.nameEn);
    }

    while (queue.length > 0) {
      const batch = queue.splice(0, Math.min(18, queue.length));
      const loadedBatch = await Promise.all(
        batch.map(async (entry) => {
          try {
            return await loadPokemonEntity(buildPokemonJsonPath(entry.id, entry.nameEn));
          } catch {
            return null;
          }
        }),
      );

      for (const def of loadedBatch) {
        if (!def || defsById.has(def.id)) {
          continue;
        }
        defsById.set(def.id, def);

        if (def.evolvesFrom?.id > 0 && def.evolvesFrom.nameEn) {
          enqueueTarget(def.evolvesFrom.id, def.evolvesFrom.nameEn);
        }
        for (const target of Array.isArray(def.evolvesTo) ? def.evolvesTo : []) {
          if (target?.id > 0 && target.nameEn) {
            enqueueTarget(target.id, target.nameEn);
          }
        }
      }
    }

    applyPokemonTalentCsvToDefinitions(defsById);
    if (state) {
      state.pokemonDefsById = defsById;
    }
  }

  async function initializeScene() {
    state.mode = "loading";
    showLoadingScreen(LOADING_SCREEN_DEFAULT_TEXT);
    state.pendingSimMs = 0;
    state.deferredSaveDirty = false;
    state.environment.nextUpdateAtMs = 0;
    updateEnvironment(Date.now(), true);
    await initializeWindowsNotificationSystem();
    resetNotificationSystem();
    state.ui.shopTab = [SHOP_TAB_POKEBALLS, SHOP_TAB_COMBAT, SHOP_TAB_EVOLUTIONS].includes(state.ui.shopTab)
      ? state.ui.shopTab
      : SHOP_TAB_POKEBALLS;
    state.ui.shopQuantityMode = normalizeShopQuantityMode(state.ui.shopQuantityMode || "1");
    state.ui.shopCustomQuantity = clamp(toSafeInt(state.ui.shopCustomQuantity, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
    state.teamLevelUpEffects = [];
    state.teamXpGainEffects = [];
    state.teamXpPulseMsBySlot = {};
    state.xpHud.teamXpBySlot = {};
    state.xpHud.enemyHpKey = null;
    state.xpHud.enemyHpFrontRatio = 1;
    state.xpHud.enemyHpLagRatio = 1;
    state.moneyHud.initialized = false;
    state.moneyHud.targetValue = 0;
    state.moneyHud.displayValue = 0;
    state.moneyHud.lastRawValue = 0;
    state.moneyHud.pulseMs = 0;
    clearMoneyGainFloaters();
    state.evolutionAnimation.current = null;
    state.evolutionAnimation.queue = [];
    state.tutorial.queue = [];
    state.tutorial.active = null;
    state.ui.tutorialOpen = false;
    if (tutorialModalEl) {
      tutorialModalEl.classList.add("hidden");
    }
    setBallConfigState(null);
    setShopItemConfigState(null);
    setZoneEncounterCsvState(null);
    setPokemonTalentCsvState(null);
    stopBackgroundTicker();
    stopForegroundCatchupPump();
    clearTeamDragState();
    closeTeamContextMenu();
    clearCanvasHoverState();
    closeRenameModal();
    closeBoxesModal();
    closePokedexModal();
    closeAppearanceModal();
    closeGachaModal({ force: true });
    setMapOpen(false);
    setShopOpen(false);
    try {
      let offlineCatchupMs = 0;
      const [ballCsvResult, shopItemCsvResult, zoneCsvResult, talentCsvResult] =
        await Promise.allSettled([
          loadBallConfigCsv(BALL_CONFIG_CSV_PATH),
          loadShopItemConfigCsv(SHOP_ITEMS_CSV_PATH),
          loadZoneEncounterCsv(ROUTE_ENCOUNTERS_CSV_PATH),
          loadPokemonTalentCsv(POKEMON_TALENTS_CSV_PATH),
        ]);

      if (ballCsvResult.status === "fulfilled") {
        setBallConfigState(ballCsvResult.value);
      } else {
        setBallConfigState(null);
        console.warn("Ball CSV indisponible, fallback config interne:", ballCsvResult.reason?.message || ballCsvResult.reason);
      }

      if (shopItemCsvResult.status === "fulfilled") {
        setShopItemConfigState(shopItemCsvResult.value);
      } else {
        setShopItemConfigState(null);
        console.warn(
          "Item CSV indisponible, fallback config interne:",
          shopItemCsvResult.reason?.message || shopItemCsvResult.reason,
        );
      }

      if (zoneCsvResult.status === "fulfilled") {
        setZoneEncounterCsvState(zoneCsvResult.value);
      } else {
        setZoneEncounterCsvState(null);
        console.warn("Zone CSV indisponible, fallback JSON:", zoneCsvResult.reason?.message || zoneCsvResult.reason);
      }

      if (talentCsvResult.status === "fulfilled") {
        setPokemonTalentCsvState(talentCsvResult.value);
        if (Array.isArray(talentCsvResult.value?.unresolvedTalentIds) && talentCsvResult.value.unresolvedTalentIds.length > 0) {
          console.warn(
            "Talents sans comportement passif code:",
            talentCsvResult.value.unresolvedTalentIds.join(", "),
          );
        }
      } else {
        setPokemonTalentCsvState(null);
        console.warn("Talent CSV indisponible, fallback JSON:", talentCsvResult.reason?.message || talentCsvResult.reason);
      }
      state.saveData = await loadSaveData();
      state.routeCatalog = await loadRouteCatalog(ROUTE_ID_ORDER);
      refreshOrderedCatalogRouteIds();
      const unlockedRouteIds = ensureUnlockedRoutesForCurrentCatalog();
      const preferredRouteId = typeof state.saveData.current_route_id === "string" ? state.saveData.current_route_id : DEFAULT_ROUTE_ID;
      const initialRouteId = unlockedRouteIds.includes(preferredRouteId) ? preferredRouteId : unlockedRouteIds[0];
      const initialAssetRouteIds = getInitialAssetRouteIds();
      const initialAssetRouteData = getRouteDataByIds(initialAssetRouteIds);
      await loadPokemonDefinitions(initialAssetRouteData, { append: false });
      const unlockStateReconciled = reconcileEntityUnlockStates();
      const appearanceStateReconciled = reconcileEntityAppearanceStates();
      const runtimeSaveRepair = repairRuntimeSaveAfterDefinitionsLoaded();
      const tutorialProgressBefore = JSON.stringify(state.saveData.tutorials || {});
      getTutorialProgress();
      const appearanceUnlockedFromProgress = ensureAppearanceEditorUnlockedFromProgress();
      const tutorialProgressAfter = JSON.stringify(state.saveData.tutorials || {});
      const tutorialProgressChanged = tutorialProgressBefore !== tutorialProgressAfter || appearanceUnlockedFromProgress;
      const routeBackgroundsById = await preloadRouteBackgrounds(getRouteDataByIds([initialRouteId]));
      state.routeBackgroundsById = routeBackgroundsById;
      Promise.allSettled([preloadTypeIcons(), preloadSelectedAppearanceAssetsForTeam()])
        .then(([typeIconResult, appearanceResult]) => {
          if (typeIconResult.status === "fulfilled" && typeIconResult.value instanceof Map) {
            state.typeIconImages = typeIconResult.value;
          } else if (typeIconResult.status === "rejected") {
            console.warn("Impossible de precharger les icones de type:", typeIconResult.reason?.message || typeIconResult.reason);
          }
          if (appearanceResult.status === "rejected") {
            console.warn(
              "Impossible de precharger les apparences d'equipe:",
              appearanceResult.reason?.message || appearanceResult.reason,
            );
          }
          if (state.mode === "ready") {
            render();
          }
        });

      setActiveRoute(initialRouteId, { announceUnlock: false });

      ensureMoneyAndItems();
      syncWindowsPokeballInventoryTracking(state.saveData?.pokeballs, { silent: true });
      rebuildTeamAndSyncBattle();
      if (
        unlockStateReconciled
        || appearanceStateReconciled
        || runtimeSaveRepair.changed
        || tutorialProgressChanged
      ) {
        persistSaveData();
      }
      offlineCatchupMs = queueOfflineCatchupFromSave(Date.now());

      renderStarterChoices();
      updateHud();

      if (state.saveData.starter_chosen && state.team.length === 0) {
        throw new Error("La sauvegarde est incoherente: impossible de reconstruire une equipe jouable.");
      }

      if (!state.saveData.starter_chosen) {
        state.team = [];
        state.battle = null;
        state.enemy = null;
        state.pendingSimMs = 0;
        showStarterModal();
        setTopMessage("Choisis ton starter pour debuter sur Route 1.", 2200);
      } else {
        hideStarterModal();
        startBattle();
        if (runtimeSaveRepair.recoveredTeam) {
          setTopMessage("Sauvegarde reparee: equipe restauree automatiquement.", 2600);
        } else if (runtimeSaveRepair.hardResetApplied) {
          setTopMessage("Sauvegarde incoherente nettoyee. Une nouvelle partie est prete.", 2600);
        }
      }

      if (runtimeSaveRepair.hardResetApplied && !state.saveData.starter_chosen) {
        setTopMessage("Sauvegarde incoherente nettoyee. Choisis un starter pour repartir proprement.", 3200);
      }

      state.mode = "ready";
      hideLoadingScreen();
      queueDeferredRouteAssetWarmup(initialAssetRouteIds);
      queueAppearanceTutorialIfNeeded();
      tryOpenPendingTutorialFlow();
      if (offlineCatchupMs > 0 && state.battle) {
        consumePendingSimulation({
          forceIdleMode: true,
          budgetMs: HIDDEN_SIM_BUDGET_MS,
        });
      }
    } catch (error) {
      state.mode = "error";
      state.error = error instanceof Error ? error.message : "Erreur inconnue";
      hideLoadingScreen({ immediate: true });
    }
    refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
    if (documentRef?.hidden) {
      ensureBackgroundTicker();
    }
    render();
  }

  async function resetSaveAndRestart() {
    const shouldReset = windowRef?.confirm?.("Supprimer toute la sauvegarde locale et recommencer ?");
    if (!shouldReset) {
      return;
    }

    clearPendingSaveWrites();
    const removedLocalStorage = removeSaveDataFromStorageKey("localStorage", SAVE_KEY);
    const [
      removedIndexedDb,
      removedDesktopSave,
      removedLegacyIndexedDb,
      removedLegacyDesktopSave,
    ] = await Promise.all([
      deleteSaveDataFromIndexedDb(),
      deleteSaveDataFromDesktopBridge(),
      deleteLegacySaveDataFromIndexedDb(),
      deleteLegacySaveDataFromDesktopBridge(),
    ]);
    const removedLegacyLocalStorage = removeLegacySaveDataFromLocalStorage();
    const removedLegacySessionStorage = removeLegacySaveDataFromSessionStorage();
    if (
      !removedLocalStorage
      && !removedIndexedDb
      && !removedDesktopSave
      && !removedLegacyLocalStorage
      && !removedLegacySessionStorage
      && !removedLegacyIndexedDb
      && !removedLegacyDesktopSave
    ) {
      windowRef?.alert?.("Impossible de supprimer la sauvegarde locale.");
      updateSaveBackendIndicator();
      return;
    }

    await applySaveAndRestart(createEmptySave());
  }

  async function exportSaveToFile() {
    try {
      if (!state.saveData) {
        windowRef?.alert?.("Aucune sauvegarde a exporter pour le moment.");
        return;
      }

      persistSaveData();
      const serializedSave = serializeSaveData(state.saveData);
      downloadTextFile(buildSaveExportFilename(new Date()), serializedSave);
      setTopMessage("Sauvegarde compacte exportee.", 2200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'export.";
      windowRef?.alert?.(`Export impossible: ${message}`);
    }
  }

  async function importSaveFromFile() {
    try {
      const importedText = await requestSaveImportText();
      if (!importedText) {
        return;
      }
      const importedSave = parseImportedCompactSave(importedText, {
        parseSerializedSave: (payload) => JSON.parse(String(payload || "{}")),
        isCompactSavePayload,
        decodeCompactSave,
        repairNormalizedSaveSnapshot,
      });
      await applySaveAndRestart(importedSave, {
        successMessage: "Sauvegarde importee avec succes.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'import.";
      windowRef?.alert?.(`Import impossible: ${message}`);
      updateSaveBackendIndicator();
    }
  }

  async function toggleFullscreen() {
    const fullscreenTarget = gameStageEl || canvas;
    if (!documentRef?.fullscreenElement) {
      await fullscreenTarget.requestFullscreen();
      return;
    }
    await documentRef.exitFullscreen();
  }

  function triggerActionDockPokeballSpin(direction) {
    if (!(actionDockPokeballVisualEl instanceof HTMLElement)) {
      return;
    }
    const spinClass = direction === "ccw" ? "is-spin-ccw" : "is-spin-cw";
    actionDockPokeballVisualEl.classList.remove("is-spin-cw", "is-spin-ccw");
    void actionDockPokeballVisualEl.offsetWidth;
    actionDockPokeballVisualEl.classList.add(spinClass);
  }

  function setActionDockFullscreenMenuOpen(nextOpen, runtimeOptions = {}) {
    if (!(actionDockFullscreenMenuEl instanceof HTMLElement)) {
      return;
    }
    const shouldAnimate = runtimeOptions?.animate !== false;
    const shouldOpen = Boolean(nextOpen);
    const currentlyOpen = isActionDockFullscreenMenuOpen();
    const isClosing = actionDockFullscreenMenuEl.classList.contains("is-closing");
    if (actionDockFullscreenMenuOpenTimeoutId) {
      clearTimeoutFn(actionDockFullscreenMenuOpenTimeoutId);
      actionDockFullscreenMenuOpenTimeoutId = 0;
    }

    if (shouldOpen === currentlyOpen && !isClosing) {
      if (actionDockPokeballToggleButtonEl) {
        actionDockPokeballToggleButtonEl.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        actionDockPokeballToggleButtonEl.setAttribute(
          "aria-label",
          shouldOpen ? "Masquer le menu principal" : "Afficher le menu principal",
        );
      }
      return;
    }

    if (shouldAnimate) {
      triggerActionDockPokeballSpin(shouldOpen ? "cw" : "ccw");
    }

    if (shouldOpen) {
      actionDockFullscreenMenuEl.classList.remove("hidden", "is-closing");
      requestAnimationFrameFn(() => {
        actionDockFullscreenMenuEl.classList.add("is-open");
      });
    } else {
      actionDockFullscreenMenuEl.classList.remove("is-open");
      actionDockFullscreenMenuEl.classList.add("is-closing");
      actionDockFullscreenMenuOpenTimeoutId = setTimeoutFn(() => {
        if (!(actionDockFullscreenMenuEl instanceof HTMLElement)) {
          return;
        }
        actionDockFullscreenMenuEl.classList.add("hidden");
        actionDockFullscreenMenuEl.classList.remove("is-closing");
        actionDockFullscreenMenuOpenTimeoutId = 0;
      }, ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS);
    }

    if (actionDockPokeballToggleButtonEl) {
      actionDockPokeballToggleButtonEl.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      actionDockPokeballToggleButtonEl.setAttribute(
        "aria-label",
        shouldOpen ? "Masquer le menu principal" : "Afficher le menu principal",
      );
    }
  }

  function isActionDockFullscreenMenuOpen() {
    if (!(actionDockFullscreenMenuEl instanceof HTMLElement)) {
      return false;
    }
    return !actionDockFullscreenMenuEl.classList.contains("hidden");
  }

  function toggleActionDockFullscreenMenu() {
    setActionDockFullscreenMenuOpen(!isActionDockFullscreenMenuOpen());
  }

  return {
    loadPokemonDefinitions,
    initializeScene,
    resetSaveAndRestart,
    exportSaveToFile,
    importSaveFromFile,
    toggleFullscreen,
    triggerActionDockPokeballSpin,
    setActionDockFullscreenMenuOpen,
    isActionDockFullscreenMenuOpen,
    toggleActionDockFullscreenMenu,
  };
}
