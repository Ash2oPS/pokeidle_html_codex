function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.trunc(numeric);
}

function clampNumber(value, min, max) {
  const safeValue = Number(value);
  if (!Number.isFinite(safeValue)) {
    return min;
  }
  return Math.min(max, Math.max(min, safeValue));
}

function asFunction(value, fallback = () => {}) {
  return typeof value === "function" ? value : fallback;
}

function asPromiseFunction(value) {
  if (typeof value === "function") {
    return value;
  }
  return () => Promise.resolve();
}

export function createRuntimeInputSystem({
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : null,
  canvas = null,
  state = null,
  constants = {},
  elements = {},
  actions = {},
} = {}) {
  const TEAM_DRAG_CLICK_SUPPRESS_MS = Math.max(
    0,
    toSafeInt(constants.TEAM_DRAG_CLICK_SUPPRESS_MS, 0),
  );
  const MAX_TEAM_SIZE = Math.max(1, toSafeInt(constants.MAX_TEAM_SIZE, 6));
  const BALL_CAPTURE_RULE_CAPTURE_ALL = constants.BALL_CAPTURE_RULE_CAPTURE_ALL;
  const BALL_CAPTURE_RULE_CAPTURE_UNOWNED = constants.BALL_CAPTURE_RULE_CAPTURE_UNOWNED;
  const BALL_CAPTURE_RULE_CAPTURE_OWNED = constants.BALL_CAPTURE_RULE_CAPTURE_OWNED;
  const BALL_CAPTURE_RULE_CAPTURE_SHINY = constants.BALL_CAPTURE_RULE_CAPTURE_SHINY;
  const BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY = constants.BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY;
  const GACHA_SPIN_COST_COINS = Math.max(0, Number(constants.GACHA_SPIN_COST_COINS) || 0);
  const GACHA_BATCH_SPIN_COUNT = Math.max(1, toSafeInt(constants.GACHA_BATCH_SPIN_COUNT, 10));
  const GACHA_BATCH_SPIN_COST_COINS = Math.max(
    0,
    Number(constants.GACHA_BATCH_SPIN_COST_COINS) || 0,
  );
  const SHOP_TAB_POKEBALLS = constants.SHOP_TAB_POKEBALLS;
  const SHOP_TAB_COMBAT = constants.SHOP_TAB_COMBAT;
  const SHOP_TAB_EVOLUTIONS = constants.SHOP_TAB_EVOLUTIONS;
  const SHOP_QUANTITY_MODE_CUSTOM = constants.SHOP_QUANTITY_MODE_CUSTOM;
  const BALL_INVENTORY_MAX_PER_TYPE = Math.max(
    1,
    toSafeInt(constants.BALL_INVENTORY_MAX_PER_TYPE, 999),
  );

  const clearTeamDragState = asFunction(actions.clearTeamDragState);
  const clearCanvasHoverState = asFunction(actions.clearCanvasHoverState);
  const render = asFunction(actions.render);
  const isActionDockFullscreenMenuOpen = asFunction(actions.isActionDockFullscreenMenuOpen, () => false);
  const setActionDockFullscreenMenuOpen = asFunction(actions.setActionDockFullscreenMenuOpen);
  const closeEvolutionItemChoiceModal = asFunction(actions.closeEvolutionItemChoiceModal);
  const closeRenameModal = asFunction(actions.closeRenameModal);
  const closeBallCaptureMenu = asFunction(actions.closeBallCaptureMenu);
  const closeTeamContextMenu = asFunction(actions.closeTeamContextMenu);
  const closeTutorialModal = asFunction(actions.closeTutorialModal);
  const setMapOpen = asFunction(actions.setMapOpen);
  const setShopOpen = asFunction(actions.setShopOpen);
  const closeGachaModal = asFunction(actions.closeGachaModal);
  const closeAppearanceModal = asFunction(actions.closeAppearanceModal);
  const closePokedexModal = asFunction(actions.closePokedexModal);
  const closeBoxesModal = asFunction(actions.closeBoxesModal);
  const toggleFullscreen = asPromiseFunction(actions.toggleFullscreen);
  const handleCanvasPointerDown = asFunction(actions.handleCanvasPointerDown);
  const handleCanvasPointerMove = asFunction(actions.handleCanvasPointerMove);
  const handleCanvasPointerUp = asFunction(actions.handleCanvasPointerUp);
  const handleCanvasPointerCancel = asFunction(actions.handleCanvasPointerCancel);
  const handleCanvasClick = asFunction(actions.handleCanvasClick);
  const handleCanvasContextMenu = asFunction(actions.handleCanvasContextMenu);
  const getNormalizedPointerType = asFunction(
    actions.getNormalizedPointerType,
    (pointerType) => String(pointerType || "").toLowerCase().trim(),
  );
  const handleWindowPointerUpOutsideCanvas = asFunction(actions.handleWindowPointerUpOutsideCanvas);
  const cancelTeamContextTouchHold = asFunction(actions.cancelTeamContextTouchHold);
  const openRenameModalForTeamSlot = asFunction(actions.openRenameModalForTeamSlot);
  const openBoxesForTeamSlot = asFunction(actions.openBoxesForTeamSlot);
  const openAppearanceForTeamSlot = asFunction(actions.openAppearanceForTeamSlot);
  const toggleBallCaptureRule = asFunction(actions.toggleBallCaptureRule);
  const exportSaveToFile = asPromiseFunction(actions.exportSaveToFile);
  const importSaveFromFile = asPromiseFunction(actions.importSaveFromFile);
  const resetSaveAndRestart = asFunction(actions.resetSaveAndRestart);
  const toggleShopPanel = asFunction(actions.toggleShopPanel);
  const setGachaOpen = asFunction(actions.setGachaOpen);
  const toggleWindowsNotificationSystemFromButton = asFunction(
    actions.toggleWindowsNotificationSystemFromButton,
  );
  const toggleActionDockFullscreenMenu = asFunction(actions.toggleActionDockFullscreenMenu);
  const applyRouteChange = asFunction(actions.applyRouteChange, () => false);
  const toggleRouteNavDrawer = asFunction(actions.toggleRouteNavDrawer);
  const setRouteNavDrawerOpen = asFunction(actions.setRouteNavDrawerOpen);
  const openRouteNavigationInfo = asFunction(actions.openRouteNavigationInfo);
  const closeRouteNavigationInfo = asFunction(actions.closeRouteNavigationInfo);
  const startGachaSpin = asFunction(actions.startGachaSpin);
  const setShopTab = asFunction(actions.setShopTab);
  const setShopQuantityMode = asFunction(actions.setShopQuantityMode);
  const refreshRenameCharCount = asFunction(actions.refreshRenameCharCount);
  const sanitizePokemonNickname = asFunction(actions.sanitizePokemonNickname, (value) => String(value || ""));
  const applyRenameModal = asFunction(actions.applyRenameModal);
  const toggleAppearanceShinyMode = asFunction(actions.toggleAppearanceShinyMode);
  const toggleAppearanceUltraShinyMode = asFunction(actions.toggleAppearanceUltraShinyMode);
  const getTutorialFlowDefinition = asFunction(actions.getTutorialFlowDefinition, () => null);
  const renderTutorialModal = asFunction(actions.renderTutorialModal);
  const syncMapMarkerLayerBounds = asFunction(actions.syncMapMarkerLayerBounds);
  const renderMapModal = asFunction(actions.renderMapModal);
  const resizeCanvas = asFunction(actions.resizeCanvas);
  const handleRuntimeLifecycleSignal = asFunction(actions.handleRuntimeLifecycleSignal);
  const closeDialogueModal = asFunction(actions.closeDialogueModal);
  const advanceActiveDialogue = asFunction(actions.advanceActiveDialogue);
  const chooseActiveDialogueChoice = asFunction(actions.chooseActiveDialogueChoice);
  const triggerZoneAction = asFunction(actions.triggerZoneAction);
  const levelUpAllOwnedPokemonFromDev = asFunction(actions.levelUpAllOwnedPokemonFromDev);
  const setBoxesInfoFromEntry = asFunction(actions.setBoxesInfoFromEntry);
  const setPokedexInfoFromEntry = asFunction(actions.setPokedexInfoFromEntry);

  const ElementCtor = typeof Element !== "undefined" ? Element : null;
  const HTMLElementCtor = typeof HTMLElement !== "undefined" ? HTMLElement : null;
  const removeBindings = [];
  let initialized = false;

  function register(target, eventName, handler, options) {
    if (!target || typeof target.addEventListener !== "function" || typeof handler !== "function") {
      return;
    }
    target.addEventListener(eventName, handler, options);
    removeBindings.push(() => {
      target.removeEventListener(eventName, handler, options);
    });
  }

  function dispose() {
    if (!initialized && removeBindings.length <= 0) {
      return;
    }
    initialized = false;
    while (removeBindings.length > 0) {
      const remove = removeBindings.pop();
      try {
        remove?.();
      } catch {
        // Ignore teardown errors during page shutdown.
      }
    }
  }

  function init() {
    if (initialized) {
      return;
    }
    initialized = true;

    const {
      teamContextMenuEl = null,
      teamContextMenuRenameButtonEl = null,
      teamContextMenuBoxesButtonEl = null,
      teamContextMenuAppearanceButtonEl = null,
      ballCaptureMenuEl = null,
      ballCaptureToggleAllButtonEl = null,
      ballCaptureToggleUnownedButtonEl = null,
      ballCaptureToggleOwnedButtonEl = null,
      ballCaptureToggleShinyButtonEl = null,
      ballCaptureToggleUltraButtonEl = null,
      exportSaveButtonEl = null,
      importSaveButtonEl = null,
      resetSaveButtonEl = null,
      mapButtonEl = null,
      pokedexButtonEl = null,
      shopButtonEl = null,
      gachaButtonEl = null,
      windowsNotificationButtonEl = null,
      actionDockPokeballToggleButtonEl = null,
      actionDockPokeballVisualEl = null,
      actionDockFullscreenMenuEl = null,
      actionDockFullscreenGridEl = null,
      hoverPopupEl = null,
      routeNavPanelEl = null,
      routeNavDrawerToggleButtonEl = null,
      routeNavDrawerEl = null,
      routeNavDrawerCloseButtonEl = null,
      routeNavDrawerListEl = null,
      routeNavInfoPanelEl = null,
      routeNavDestinationsEl = null,
      closeShopButtonEl = null,
      gachaCloseButtonEl = null,
      gachaSpinButtonEl = null,
      gachaSpin10ButtonEl = null,
      evolutionItemCloseButtonEl = null,
      mapCloseButtonEl = null,
      mapImageEl = null,
      mapConnectionsListEl = null,
      mapConnectionsInfoPanelEl = null,
      shopTabPokeballsButtonEl = null,
      shopTabCombatButtonEl = null,
      shopTabEvolutionsButtonEl = null,
      shopQtyPresetButtonEls = [],
      shopCustomQtyInputEl = null,
      renameCloseButtonEl = null,
      renameResetButtonEl = null,
      renameInputEl = null,
      renameFormEl = null,
      boxesCloseButtonEl = null,
      boxesInfoPanelEl = null,
      pokedexCloseButtonEl = null,
      pokedexInfoPanelEl = null,
      appearanceCloseButtonEl = null,
      appearanceShinyToggleButtonEl = null,
      appearanceUltraShinyToggleButtonEl = null,
      devLevelAllButtonEl = null,
      tutorialPrevButtonEl = null,
      tutorialNextButtonEl = null,
      tutorialCloseButtonEl = null,
      boxesModalEl = null,
      pokedexModalEl = null,
      appearanceModalEl = null,
      renameModalEl = null,
      tutorialModalEl = null,
      shopModalEl = null,
      gachaModalEl = null,
      evolutionItemModalEl = null,
      mapModalEl = null,
      dialogueModalEl = null,
      dialogueChoiceListEl = null,
      dialogueNextButtonEl = null,
      dialogueCloseButtonEl = null,
      worldUiLayerEl = null,
    } = elements;

    function dismissRouteNavigationSurfaces() {
      closeRouteNavigationInfo();
      setRouteNavDrawerOpen(false);
    }

    function isPhoneUiViewport() {
      return Boolean(state?.layout?.viewportProfile?.phone);
    }

    function refreshUiOnboardingIndicators() {
      if (routeNavDrawerToggleButtonEl) {
        const routeNavHintVisible = !Boolean(state?.ui?.routeNavOnboardingSeen) && !Boolean(state?.ui?.routeNavDrawerOpen);
        routeNavDrawerToggleButtonEl.classList.toggle("is-onboarding-pulse", routeNavHintVisible);
        routeNavDrawerToggleButtonEl.setAttribute("data-onboarding-visible", routeNavHintVisible ? "true" : "false");
      }
      if (actionDockPokeballToggleButtonEl) {
        const actionMenuHintVisible = !Boolean(state?.ui?.actionMenuOnboardingSeen) && !isActionDockFullscreenMenuOpen();
        actionDockPokeballToggleButtonEl.classList.toggle("is-onboarding-pulse", actionMenuHintVisible);
        actionDockPokeballToggleButtonEl.setAttribute("data-onboarding-visible", actionMenuHintVisible ? "true" : "false");
      }
    }

    function dismissRouteNavOnboarding() {
      if (!state?.ui) {
        return;
      }
      state.ui.routeNavOnboardingSeen = true;
      refreshUiOnboardingIndicators();
    }

    function dismissActionMenuOnboarding() {
      if (!state?.ui) {
        return;
      }
      state.ui.actionMenuOnboardingSeen = true;
      refreshUiOnboardingIndicators();
    }

    function handleRouteNavigationTargetClick(event) {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const routeButton = canResolveTarget ? event.target.closest("[data-route-id]") : null;
      const routeId = String(routeButton?.getAttribute("data-route-id") || "");
      if (!routeId) {
        return;
      }
      const routeAction = String(routeButton?.getAttribute("data-route-action") || "travel").toLowerCase().trim();
      if (routeAction === "info") {
        openRouteNavigationInfo(routeId);
        return;
      }
      applyRouteChange(routeId);
    }

    function handleRouteNavigationInfoDismiss(event) {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const closeButton = canResolveTarget ? event.target.closest("[data-route-info-close='true']") : null;
      if (!closeButton) {
        return;
      }
      closeRouteNavigationInfo();
    }

    register(documentRef, "keydown", (event) => {
      const key = String(event?.key || "").toLowerCase();
      if (key === "escape" && state?.ui?.teamDragActive) {
        event.preventDefault();
        const dragMoved = Boolean(state.ui.teamDragMoved);
        clearTeamDragState({
          suppressClickMs: dragMoved ? TEAM_DRAG_CLICK_SUPPRESS_MS : 0,
        });
        clearCanvasHoverState();
        if (dragMoved) {
          render();
        }
        return;
      }
      if (key === "escape" && isActionDockFullscreenMenuOpen()) {
        event.preventDefault();
        setActionDockFullscreenMenuOpen(false);
        return;
      }
      if (key === "escape" && state?.ui?.routeNavInfoRouteId) {
        event.preventDefault();
        closeRouteNavigationInfo();
        return;
      }
      if (key === "escape" && state?.ui?.routeNavDrawerOpen) {
        event.preventDefault();
        setRouteNavDrawerOpen(false);
        return;
      }
      if (key === "escape" && state?.ui?.evolutionItemChoiceOpen) {
        event.preventDefault();
        closeEvolutionItemChoiceModal(null);
        return;
      }
      if (key === "escape" && state?.ui?.renameOpen) {
        event.preventDefault();
        closeRenameModal();
        return;
      }
      if (key === "escape" && state?.ui?.ballCaptureMenuOpen) {
        event.preventDefault();
        closeBallCaptureMenu();
        return;
      }
      if (key === "escape" && state?.ui?.teamContextMenuOpen) {
        event.preventDefault();
        closeTeamContextMenu();
        return;
      }
      if (key === "escape" && state?.ui?.tutorialOpen) {
        event.preventDefault();
        closeTutorialModal();
        return;
      }
      if (key === "escape" && state?.ui?.dialogueOpen) {
        event.preventDefault();
        closeDialogueModal();
        return;
      }
      if (key === "escape" && state?.ui?.mapOpen) {
        event.preventDefault();
        setMapOpen(false);
        return;
      }
      if (key === "escape" && state?.ui?.shopOpen) {
        event.preventDefault();
        setShopOpen(false);
        return;
      }
      if (key === "escape" && state?.ui?.gachaOpen) {
        event.preventDefault();
        closeGachaModal();
        return;
      }
      if (key === "escape" && state?.ui?.appearanceOpen) {
        event.preventDefault();
        closeAppearanceModal();
        return;
      }
      if (key === "escape" && state?.ui?.pokedexOpen) {
        event.preventDefault();
        closePokedexModal();
        return;
      }
      if (key === "escape" && state?.ui?.boxesOpen) {
        event.preventDefault();
        closeBoxesModal();
        return;
      }
      if (key === "f") {
        event.preventDefault();
        toggleFullscreen().catch(() => {});
      }
    });

    register(documentRef, "contextmenu", (event) => {
      event.preventDefault();
    }, { capture: true });

    register(canvas, "pointerdown", handleCanvasPointerDown);
    register(canvas, "pointermove", handleCanvasPointerMove);
    register(canvas, "pointerup", handleCanvasPointerUp);
    register(canvas, "pointercancel", handleCanvasPointerCancel);
    register(canvas, "lostpointercapture", handleCanvasPointerCancel);
    register(canvas, "click", handleCanvasClick);
    register(canvas, "contextmenu", handleCanvasContextMenu);
    register(canvas, "pointerleave", (event) => {
      if (state?.ui?.teamDragActive || getNormalizedPointerType(event?.pointerType) !== "mouse") {
        return;
      }
      clearCanvasHoverState();
    });

    register(windowRef, "pointerup", handleWindowPointerUpOutsideCanvas);
    register(windowRef, "blur", (event) => {
      cancelTeamContextTouchHold();
      if (!state?.ui?.teamDragActive) {
        handleRuntimeLifecycleSignal({
          source: "window",
          kind: "blur",
          event,
        });
        return;
      }
      const dragMoved = Boolean(state.ui.teamDragMoved);
      clearTeamDragState({
        suppressClickMs: dragMoved ? TEAM_DRAG_CLICK_SUPPRESS_MS : 0,
      });
      clearCanvasHoverState();
      if (dragMoved) {
        render();
      }
      handleRuntimeLifecycleSignal({
        source: "window",
        kind: "blur",
        event,
      });
    });
    register(windowRef, "focus", (event) => {
      handleRuntimeLifecycleSignal({
        source: "window",
        kind: "focus",
        event,
      });
    });

    register(teamContextMenuRenameButtonEl, "click", () => {
      const slotIndex = clampNumber(toSafeInt(state?.ui?.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
      closeTeamContextMenu();
      if (slotIndex >= 0) {
        openRenameModalForTeamSlot(slotIndex);
      }
    });
    register(teamContextMenuBoxesButtonEl, "click", () => {
      const slotIndex = clampNumber(toSafeInt(state?.ui?.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
      closeTeamContextMenu();
      if (slotIndex >= 0) {
        openBoxesForTeamSlot(slotIndex);
      }
    });
    register(teamContextMenuAppearanceButtonEl, "click", () => {
      const slotIndex = clampNumber(toSafeInt(state?.ui?.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
      closeTeamContextMenu();
      if (slotIndex >= 0) {
        openAppearanceForTeamSlot(slotIndex);
      }
    });
    register(ballCaptureToggleAllButtonEl, "click", () => toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_ALL));
    register(ballCaptureToggleUnownedButtonEl, "click", () => toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_UNOWNED));
    register(ballCaptureToggleOwnedButtonEl, "click", () => toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_OWNED));
    register(ballCaptureToggleShinyButtonEl, "click", () => toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_SHINY));
    register(ballCaptureToggleUltraButtonEl, "click", () => toggleBallCaptureRule(BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY));

    register(documentRef, "pointerdown", (event) => {
      const target = event?.target;
      if (state?.ui?.teamContextMenuOpen && (!teamContextMenuEl || !teamContextMenuEl.contains(target))) {
        closeTeamContextMenu();
      }
      if (state?.ui?.ballCaptureMenuOpen && (!ballCaptureMenuEl || !ballCaptureMenuEl.contains(target))) {
        closeBallCaptureMenu();
      }
      const clickedInsideRouteNav = Boolean(routeNavPanelEl && routeNavPanelEl.contains(target));
      const clickedInsideRouteNavDrawer = Boolean(routeNavDrawerEl && routeNavDrawerEl.contains(target));
      const clickedInsideMapInfo = Boolean(mapConnectionsInfoPanelEl && mapConnectionsInfoPanelEl.contains(target));
      const clickedInsideMapList = Boolean(mapConnectionsListEl && mapConnectionsListEl.contains(target));
      if (state?.ui?.routeNavDrawerOpen && !clickedInsideRouteNav && !clickedInsideRouteNavDrawer) {
        setRouteNavDrawerOpen(false);
      }
      if (
        state?.ui?.routeNavInfoRouteId
        && !clickedInsideRouteNav
        && !clickedInsideRouteNavDrawer
        && !clickedInsideMapInfo
        && !clickedInsideMapList
      ) {
        closeRouteNavigationInfo();
      }
      if (
        isPhoneUiViewport()
        && hoverPopupEl
        && !hoverPopupEl.classList.contains("hidden")
        && !hoverPopupEl.contains(target)
      ) {
        clearCanvasHoverState();
      }
      if (
        isPhoneUiViewport()
        && state?.ui?.boxesOpen
        && boxesModalEl
        && boxesModalEl.contains(target)
        && boxesInfoPanelEl
        && !boxesInfoPanelEl.contains(target)
      ) {
        state.ui.boxesHoverEntityId = null;
        setBoxesInfoFromEntry(null);
      }
      if (
        isPhoneUiViewport()
        && state?.ui?.pokedexOpen
        && pokedexModalEl
        && pokedexModalEl.contains(target)
        && pokedexInfoPanelEl
        && !pokedexInfoPanelEl.contains(target)
      ) {
        state.ui.pokedexHoverPokemonId = null;
        setPokedexInfoFromEntry(null);
      }
    });

    register(exportSaveButtonEl, "click", () => {
      void exportSaveToFile();
    });
    register(importSaveButtonEl, "click", () => {
      void importSaveFromFile();
    });
    register(resetSaveButtonEl, "click", resetSaveAndRestart);
    register(mapButtonEl, "click", () => {
      dismissRouteNavigationSurfaces();
      setMapOpen(!state?.ui?.mapOpen);
    });
    register(pokedexButtonEl, "click", () => {
      dismissRouteNavigationSurfaces();
      if (state?.ui?.pokedexOpen) {
        closePokedexModal();
        return;
      }
      actions.openPokedexModal?.();
    });
    register(shopButtonEl, "click", () => {
      dismissRouteNavigationSurfaces();
      toggleShopPanel();
    });
    register(gachaButtonEl, "click", () => {
      dismissRouteNavigationSurfaces();
      setGachaOpen(!state?.ui?.gachaOpen);
    });
    register(windowsNotificationButtonEl, "click", () => {
      void toggleWindowsNotificationSystemFromButton();
    });
    register(actionDockPokeballToggleButtonEl, "click", () => {
      dismissActionMenuOnboarding();
      toggleActionDockFullscreenMenu();
    });
    register(actionDockPokeballVisualEl, "animationend", () => {
      actionDockPokeballVisualEl?.classList.remove("is-spin-cw", "is-spin-ccw");
    });
    register(actionDockFullscreenMenuEl, "click", (event) => {
      if (event?.target === actionDockFullscreenMenuEl) {
        setActionDockFullscreenMenuOpen(false);
      }
    });
    register(actionDockFullscreenGridEl, "click", (event) => {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const actionButton = canResolveTarget ? event.target.closest("[data-action-target]") : null;
      const actionTarget = String(actionButton?.getAttribute("data-action-target") || "");
      if (!actionTarget) {
        return;
      }
      const sourceButton = documentRef?.getElementById?.(actionTarget);
      setActionDockFullscreenMenuOpen(false);
      if (HTMLElementCtor && sourceButton instanceof HTMLElementCtor) {
        sourceButton.click();
      }
    });
    register(routeNavDrawerToggleButtonEl, "click", () => {
      dismissRouteNavOnboarding();
      toggleRouteNavDrawer();
    });
    register(routeNavDrawerCloseButtonEl, "click", () => setRouteNavDrawerOpen(false));
    register(routeNavDestinationsEl, "click", handleRouteNavigationTargetClick);
    register(routeNavDrawerListEl, "click", handleRouteNavigationTargetClick);
    register(mapConnectionsListEl, "click", handleRouteNavigationTargetClick);
    register(routeNavInfoPanelEl, "click", handleRouteNavigationInfoDismiss);
    register(mapConnectionsInfoPanelEl, "click", handleRouteNavigationInfoDismiss);
    register(boxesInfoPanelEl, "click", (event) => {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const closeButton = canResolveTarget ? event.target.closest("[data-collection-sheet-close='boxes']") : null;
      if (!closeButton) {
        return;
      }
      state.ui.boxesHoverEntityId = null;
      setBoxesInfoFromEntry(null);
    });
    register(pokedexInfoPanelEl, "click", (event) => {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const closeButton = canResolveTarget ? event.target.closest("[data-collection-sheet-close='pokedex']") : null;
      if (!closeButton) {
        return;
      }
      state.ui.pokedexHoverPokemonId = null;
      setPokedexInfoFromEntry(null);
    });
    register(closeShopButtonEl, "click", () => setShopOpen(false));
    register(gachaCloseButtonEl, "click", () => closeGachaModal());
    register(gachaSpinButtonEl, "click", () => {
      void startGachaSpin({
        spinCount: 1,
        cost: GACHA_SPIN_COST_COINS,
      });
    });
    register(gachaSpin10ButtonEl, "click", () => {
      void startGachaSpin({
        spinCount: GACHA_BATCH_SPIN_COUNT,
        cost: GACHA_BATCH_SPIN_COST_COINS,
      });
    });
    register(evolutionItemCloseButtonEl, "click", () => closeEvolutionItemChoiceModal(null));
    register(mapCloseButtonEl, "click", () => setMapOpen(false));
    register(mapImageEl, "load", () => {
      if (!state?.ui?.mapOpen) {
        return;
      }
      syncMapMarkerLayerBounds();
      renderMapModal();
    });
    register(shopTabPokeballsButtonEl, "click", () => setShopTab(SHOP_TAB_POKEBALLS));
    register(shopTabCombatButtonEl, "click", () => setShopTab(SHOP_TAB_COMBAT));
    register(shopTabEvolutionsButtonEl, "click", () => setShopTab(SHOP_TAB_EVOLUTIONS));
    for (const button of Array.isArray(shopQtyPresetButtonEls) ? shopQtyPresetButtonEls : []) {
      register(button, "click", () => {
        const mode = button.dataset.shopQty || "1";
        setShopQuantityMode(mode);
      });
    }
    register(shopCustomQtyInputEl, "input", () => {
      if (!state?.ui) {
        return;
      }
      state.ui.shopCustomQuantity = clampNumber(
        toSafeInt(shopCustomQtyInputEl?.value, 1),
        1,
        BALL_INVENTORY_MAX_PER_TYPE,
      );
      if (state.ui.shopQuantityMode === SHOP_QUANTITY_MODE_CUSTOM) {
        actions.renderShopModal?.();
      }
    });
    register(shopCustomQtyInputEl, "focus", () => {
      if (state?.ui?.shopQuantityMode !== SHOP_QUANTITY_MODE_CUSTOM) {
        setShopQuantityMode(SHOP_QUANTITY_MODE_CUSTOM);
      }
    });

    register(renameCloseButtonEl, "click", () => closeRenameModal());
    register(renameResetButtonEl, "click", () => {
      if (renameInputEl) {
        renameInputEl.value = "";
        refreshRenameCharCount();
        renameInputEl.focus();
      }
    });
    register(renameInputEl, "input", () => {
      if (!renameInputEl) {
        return;
      }
      const sanitized = sanitizePokemonNickname(renameInputEl.value, { trimEdges: false });
      if (renameInputEl.value !== sanitized) {
        renameInputEl.value = sanitized;
      }
      refreshRenameCharCount();
    });
    register(renameFormEl, "submit", (event) => {
      event.preventDefault();
      applyRenameModal();
    });
    register(boxesCloseButtonEl, "click", () => closeBoxesModal());
    register(pokedexCloseButtonEl, "click", () => closePokedexModal());
    register(appearanceCloseButtonEl, "click", () => closeAppearanceModal());
    register(appearanceShinyToggleButtonEl, "click", () => toggleAppearanceShinyMode());
    register(appearanceUltraShinyToggleButtonEl, "click", () => toggleAppearanceUltraShinyMode());
    register(devLevelAllButtonEl, "click", () => {
      levelUpAllOwnedPokemonFromDev();
    });
    register(tutorialPrevButtonEl, "click", () => {
      if (!state?.ui?.tutorialOpen || !state?.tutorial?.active) {
        return;
      }
      state.tutorial.active.pageIndex = Math.max(
        0,
        toSafeInt(state.tutorial.active.pageIndex, 0) - 1,
      );
      renderTutorialModal();
    });
    register(tutorialNextButtonEl, "click", () => {
      if (!state?.ui?.tutorialOpen || !state?.tutorial?.active) {
        return;
      }
      const flow = getTutorialFlowDefinition(state.tutorial.active.flowId);
      const pageCount = Math.max(1, Array.isArray(flow?.pages) ? flow.pages.length : 0);
      const pageIndex = clampNumber(toSafeInt(state.tutorial.active.pageIndex, 0), 0, pageCount - 1);
      if (pageIndex >= pageCount - 1) {
        closeTutorialModal();
        return;
      }
      state.tutorial.active.pageIndex = pageIndex + 1;
      renderTutorialModal();
    });
    register(tutorialCloseButtonEl, "click", () => closeTutorialModal());
    register(dialogueNextButtonEl, "click", () => {
      advanceActiveDialogue();
    });
    register(dialogueCloseButtonEl, "click", () => {
      closeDialogueModal();
    });
    register(dialogueChoiceListEl, "click", (event) => {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const choiceButton = canResolveTarget ? event.target.closest("[data-dialogue-choice-id]") : null;
      const choiceId = String(choiceButton?.getAttribute("data-dialogue-choice-id") || "");
      if (!choiceId) {
        return;
      }
      chooseActiveDialogueChoice(choiceId);
    });
    register(worldUiLayerEl, "click", (event) => {
      const canResolveTarget = ElementCtor && event?.target instanceof ElementCtor;
      const actionButton = canResolveTarget ? event.target.closest("[data-zone-action-id]") : null;
      const actionId = String(actionButton?.getAttribute("data-zone-action-id") || "");
      if (!actionId) {
        return;
      }
      triggerZoneAction(actionId);
    });

    register(boxesModalEl, "click", (event) => {
      if (event?.target === boxesModalEl) {
        closeBoxesModal();
      }
    });
    register(pokedexModalEl, "click", (event) => {
      if (event?.target === pokedexModalEl) {
        closePokedexModal();
      }
    });
    register(appearanceModalEl, "click", (event) => {
      if (event?.target === appearanceModalEl) {
        closeAppearanceModal();
      }
    });
    register(renameModalEl, "click", (event) => {
      if (event?.target === renameModalEl) {
        closeRenameModal();
      }
    });
    register(tutorialModalEl, "click", (event) => {
      if (event?.target === tutorialModalEl) {
        closeTutorialModal();
      }
    });
    register(shopModalEl, "click", (event) => {
      if (event?.target === shopModalEl) {
        setShopOpen(false);
      }
    });
    register(gachaModalEl, "click", (event) => {
      if (event?.target === gachaModalEl) {
        closeGachaModal();
      }
    });
    register(evolutionItemModalEl, "click", (event) => {
      if (event?.target === evolutionItemModalEl) {
        closeEvolutionItemChoiceModal(null);
      }
    });
    register(mapModalEl, "click", (event) => {
      if (event?.target === mapModalEl) {
        setMapOpen(false);
      }
    });
    register(dialogueModalEl, "click", (event) => {
      if (event?.target === dialogueModalEl) {
        closeDialogueModal();
      }
    });

    refreshRenameCharCount();

    const handleLayoutResize = () => {
      resizeCanvas();
      refreshUiOnboardingIndicators();
      if (!state?.ui?.mapOpen) {
        return;
      }
      syncMapMarkerLayerBounds();
      renderMapModal();
    };

    register(windowRef, "resize", handleLayoutResize);
    register(documentRef, "fullscreenchange", handleLayoutResize);
    register(documentRef, "visibilitychange", (event) => {
      handleRuntimeLifecycleSignal({
        source: "document",
        kind: "visibilitychange",
        event,
      });
    });
    if ("onfreeze" in (documentRef || {})) {
      register(documentRef, "freeze", (event) => {
        handleRuntimeLifecycleSignal({
          source: "document",
          kind: "freeze",
          event,
        });
      });
    }
    if ("onresume" in (documentRef || {})) {
      register(documentRef, "resume", (event) => {
        handleRuntimeLifecycleSignal({
          source: "document",
          kind: "resume",
          event,
        });
      });
    }
    register(windowRef, "pageshow", (event) => {
      handleRuntimeLifecycleSignal({
        source: "window",
        kind: "pageshow",
        event,
      });
    });
    register(windowRef, "pagehide", (event) => {
      handleRuntimeLifecycleSignal({
        source: "window",
        kind: "pagehide",
        event,
      });
    });
    register(windowRef, "beforeunload", (event) => {
      handleRuntimeLifecycleSignal({
        source: "window",
        kind: "beforeunload",
        event,
      });
      dispose();
    });

    refreshUiOnboardingIndicators();
  }

  return {
    init,
    dispose,
  };
}
