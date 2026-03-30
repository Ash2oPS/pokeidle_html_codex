import {
  buildRouteUnlockProgressState,
  normalizeFlagIdList,
  tryUnlockConnectedRoutes,
} from "../../lib/zone-graph-runtime.js";

function getRuntimeSystemBindings(options = {}) {
  const scope = {};
  if (options && typeof options === 'object' && options.bindings && typeof options.bindings === 'object') {
    Object.assign(scope, options.bindings);
  } else if (options && typeof options === 'object') {
    Object.assign(scope, options);
  }
  for (const key of Reflect.ownKeys(globalThis)) {
    if (Object.prototype.hasOwnProperty.call(scope, key)) {
      continue;
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(globalThis, key);
    if (!descriptor) {
      continue;
    }
    Object.defineProperty(scope, key, {
      configurable: true,
      enumerable: Boolean(descriptor.enumerable),
      get() {
        return Reflect.get(globalThis, key, globalThis);
      },
    });
  }
  return scope;
}

export const RUNTIME_UI_INTERACTION_BINDING_KEYS = Object.freeze([
  "APPEARANCE_UNLOCK_LEVEL",
  "APP_VERSION",
  "BALL_CAPTURE_RULE_CAPTURE_ALL",
  "BALL_CAPTURE_RULE_CAPTURE_OWNED",
  "BALL_CAPTURE_RULE_CAPTURE_SHINY",
  "BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY",
  "BALL_CAPTURE_RULE_CAPTURE_UNOWNED",
  "BALL_CAPTURE_TOGGLE_DEFINITIONS",
  "BALL_CONFIG_BY_TYPE",
  "BALL_CONFIG_CSV_PATH",
  "BALL_TYPE_FALLBACK_ORDER",
  "BASE_STEP_MS",
  "DEFAULT_BALL_CONFIG_BY_TYPE",
  "DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID",
  "DEFAULT_ROUTE_ID",
  "DEFAULT_WILD_LEVEL_MAX",
  "DEFAULT_WILD_LEVEL_MIN",
  "DEFERRED_ROUTE_WARMUP_CHUNK_SIZE",
  "DEFERRED_ROUTE_WARMUP_DELAY_MS",
  "DISPLAY_APP_VERSION",
  "GAME_DESIGN_SNAPSHOT",
  "EXTRA_SHOP_ITEM_CONFIG_BY_ID",
  "GACHA_BASE_MAX_POKEMON_ID",
  "GACHA_EXTENDED_MAX_POKEMON_ID",
  "GACHA_SPIN_COST_COINS",
  "MAX_LEVEL",
  "MAX_TEAM_SIZE",
  "POKEDEX_BASE_MAX_POKEMON_ID",
  "POKEDEX_EXTENDED_MAX_POKEMON_ID",
  "POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS",
  "POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS",
  "POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3",
  "POKEDEX_VARIANT_PREFERENCE_GEN_4",
  "POKEDEX_VIRTUAL_CARD_HEIGHT_PX",
  "POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX",
  "POKEDEX_VIRTUAL_GAP_PX",
  "POKEDEX_VIRTUAL_OVERSCAN_ROWS",
  "POKEMON_NICKNAME_MAX_LENGTH",
  "POKEMON_TALENTS_CSV_PATH",
  "ROUTE_1_TUTORIAL_ID",
  "ROUTE_DATA_DIR",
  "ROUTE_ENCOUNTERS_CSV_PATH",
  "RUNTIME_CLIENT_BROWSER_PC",
  "RUNTIME_CLIENT_BROWSER_SMARTPHONE",
  "RUNTIME_CLIENT_DESKTOP_EXE_PC",
  "SHOP_ITEMS_CSV_PATH",
  "SHOP_ITEM_CONFIG_BY_ID",
  "SHOP_QUANTITY_MODE_MAX",
  "SHOP_TAB_COMBAT",
  "SHOP_TAB_POKEBALLS",
  "STARTER_CHOICES",
  "STAT_KEYS",
  "STAT_LABELS_FR",
  "TALENT_NONE_DESCRIPTION_FR",
  "TARGET_FRAME_MS",
  "TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX",
  "TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS",
  "TEAM_DRAG_CLICK_SUPPRESS_MS",
  "TEAM_DRAG_START_DISTANCE_PX",
  "TEAM_SPRITE_SCALE",
  "TRAINER_BATTLE_ENEMY_HP_MULTIPLIER",
  "TRAINER_BATTLE_ENEMY_TIMER_MS",
  "TRAINER_BATTLE_TEAM_SIZE_COUNT",
  "TYPE_ICON_ASSET_DIR",
  "UNKNOWN_CAVE_ROUTE_ID",
  "animatedSpriteFramesCache",
  "appearanceGridEl",
  "appearanceModalEl",
  "appearanceShinyStatusEl",
  "appearanceShinyToggleButtonEl",
  "appearanceSubtitleEl",
  "appearanceTitleEl",
  "appearanceUltraShinyToggleButtonEl",
  "applyAppearanceModesToEvolutionFamily",
  "applyNicknameToEvolutionFamily",
  "applyTeamTalentOverrides",
  "assertValidBallConfig",
  "assertValidEncounter",
  "assertValidShopItemConfig",
  "activateNextEvolutionAnimationIfNeeded",
  "ballCaptureMenuEl",
  "ballCaptureMenuTitleEl",
  "ballCaptureMenuSummaryEl",
  "ballCaptureMenuCloseButtonEl",
  "ballCaptureMenuTabsEl",
  "ballCaptureTabPokeButtonEl",
  "ballCaptureTabSuperButtonEl",
  "ballCaptureTabHyperButtonEl",
  "boxesGridEl",
  "boxesHeaderCopyEl",
  "boxesHeaderDefaultEl",
  "boxesInfoPanelEl",
  "boxesMobileSelectionActionsEl",
  "boxesMobileSelectionCancelButtonEl",
  "boxesMobileSelectionConfirmButtonEl",
  "boxesMobileSelectionSummaryEl",
  "boxesModalEl",
  "boxesSearchInputEl",
  "boxesShinyCounterEl",
  "boxesSubtitleEl",
  "canvas",
  "clamp",
  "cloneConfigMap",
  "closeEvolutionItemChoiceModal",
  "closeGachaModal",
  "compareShopItems",
  "computeLayout",
  "computeStatsAtLevel",
  "createRuntimeConfigLoaders",
  "ensureAppearanceEditorUnlockedFromProgress",
  "ensureVariantAppearanceAssetsLoaded",
  "enqueueEvolutionReadyNotification",
  "escapeHtml",
  "formatCompactNumber",
  "formatTalentLabelFr",
  "formatTypeLabelFr",
  "formatTypeListFr",
  "getActiveBallType",
  "getAttackBoostRemainingMs",
  "getBallCaptureRulesForType",
  "getBallInventoryCount",
  "getBaseStatTotal",
  "getCapturedTotal",
  "getCurrentAttackIntervalMs",
  "getEnemySpriteRenderSize",
  "getEnvironmentSnapshotForRender",
  "getEvolutionFamilySpeciesIds",
  "getFamilyShinyCaptureCount",
  "getFamilyUltraShinyCaptureCount",
  "getGachaSkinCandidates",
  "getLegendaryFieldAttackIntervalMultiplier",
  "getLegendaryFieldPresence",
  "getOrderedCatalogRouteIds",
  "getOrderedUnlockedRouteIds",
  "getOwnedSpriteVariantsForRecord",
  "getPassiveBehaviorIdForTalentId",
  "getPokemonDataSpriteScale",
  "getPokemonDisplayNameForOwnedEntity",
  "getPokemonEntityRecord",
  "getPokemonNicknameById",
  "getPokemonNicknameLength",
  "getPreferredDefaultSpriteVariant",
  "getRouteDefeatCount",
  "getRouteDisplayName",
  "getRouteUnlockDefeatTarget",
  "getRouteUnlockMode",
  "getRouteUnlockProgressState",
  "getRouteZoneType",
  "getRuntimeClientType",
  "getSaveBackendTelemetryValue",
  "getSelectedOwnedSpriteVariantForRecord",
  "getSelectedShopBallQuantity",
  "getShopItemCount",
  "getSortedBallConfigs",
  "getSpeciesStatsSummary",
  "getSpriteVariantDisplayLabel",
  "getSpriteVariantsForDef",
  "getTeamAuraAttackBonusBySlot",
  "getTeamBoxesAccessState",
  "getTeamBoxesLockedMessage",
  "getTeamSpriteScale",
  "isTrainerBattleActive",
  "getTutorialFlowDefinition",
  "getTypeMultiplier",
  "getUiAnimationState",
  "getVariantShinySpritePath",
  "getXpToNextLevelForSpecies",
  "hasImplementedTalentEffect",
  "hideModalWithTween",
  "hidePopupWithTween",
  "hoverPopupEl",
  "isAppearanceEditorUnlocked",
  "isCurrentRouteCombatEnabled",
  "isEntityUnlocked",
  "isShinyAppearanceUnlockedForRecord",
  "isUltraShinyAppearanceUnlockedForRecord",
  "loadImage",
  "loadPokemonDefinitions",
  "normalizePokemonEntityRecord",
  "normalizeRouteDefeatCounts",
  "normalizeShopQuantityMode",
  "normalizeSpriteVariantId",
  "normalizeStatsPayload",
  "normalizeTalentDefinition",
  "normalizeTalentId",
  "normalizeType",
  "normalizeUiDisplayText",
  "normalizeUnlockedRouteIds",
  "parseCsvMethods",
  "parseCsvObjects",
  "pendingRouteBackgroundLoads",
  "pendingRouteDefinitionLoads",
  "persistSaveData",
  "pokedexCapturedStatEl",
  "pokedexEncounteredStatEl",
  "pokedexEntriesCacheById",
  "pokedexEntriesCacheCapturedSpeciesCount",
  "pokedexEntriesCacheDirty",
  "pokedexEntriesCacheEncounteredSpeciesCount",
  "pokedexEntriesCacheList",
  "pokedexEntriesCachePokemonDefsCount",
  "pokedexEntriesCacheSaveDataRef",
  "pokedexEntriesCacheShinySpeciesCount",
  "pokedexEntriesCacheSpeciesRef",
  "pokedexEntriesCacheUltraShinySpeciesCount",
  "pokedexGlobalCompletionEl",
  "pokedexGridEl",
  "pokedexInfoPanelEl",
  "pokedexModalEl",
  "pokedexSearchInputEl",
  "pokedexRenderRafHandle",
  "pokedexShinyStatEl",
  "pokedexSpritePrefetchStateByPath",
  "pokedexSubtitleEl",
  "pokedexUltraShinyStatEl",
  "pokedexViewportRenderRafHandle",
  "pokedexVirtualBottomSpacerEl",
  "pokedexVirtualColumnGapPx",
  "pokedexVirtualContentEl",
  "pokedexVirtualEventsBound",
  "pokedexVirtualLastEndIndex",
  "pokedexVirtualLastSliceKey",
  "pokedexVirtualLastStartIndex",
  "pokedexVirtualLayoutCacheKey",
  "pokedexVirtualPaddingBottomPx",
  "pokedexVirtualPaddingLeftPx",
  "pokedexVirtualPaddingRightPx",
  "pokedexVirtualPaddingTopPx",
  "pokedexVirtualResizeObserver",
  "pokedexVirtualRowGapPx",
  "pokedexVirtualTopSpacerEl",
  "preloadSelectedAppearanceAssetsForTeam",
  "queueTeamLevelUpEffects",
  "queueRoute1TutorialIfNeeded",
  "readCsvBooleanCell",
  "readCsvCell",
  "readCsvNumberCell",
  "readCsvTypedValue",
  "rebuildEvolutionStoneConfigState",
  "rebuildShopItemConfigState",
  "rebuildTeamAndSyncBattle",
  "reconcileAppearanceForEntityRecord",
  "refreshBallConfigDerivedState",
  "refreshRouteUi",
  "refreshZoneActionButtons",
  "renameCharCountEl",
  "renameInputEl",
  "renameModalEl",
  "renameSubtitleEl",
  "renameTitleEl",
  "render",
  "replaceConfigMap",
  "resetBackgroundDriftForRoute",
  "resetOnlyOneEncounterCycle",
  "resolveEntitySpriteDrawSource",
  "resolveSpriteAppearanceForEntity",
  "resolveTalentDefinition",
  "findNextEligibleEvolution",
  "sanitizePokemonNickname",
  "setEntityLevel",
  "setBallCaptureRulesForType",
  "setMapOpen",
  "setShopOpen",
  "setTopMessage",
  "shouldFlipTeamSprite",
  "shouldForceUltraShinyAllPokemon",
  "showModalWithTween",
  "showPopupWithTween",
  "showTooltipWithTween",
  "starterModalEl",
  "state",
  "teamContextMenuAppearanceButtonEl",
  "teamContextMenuBoxesButtonEl",
  "teamContextMenuEl",
  "teamContextMenuRenameButtonEl",
  "teamContextMenuTitleEl",
  "toSafeInt",
  "toggleActionDockFullscreenMenu",
  "toggleRouteNavDrawer",
  "trainerBattleSetupCancelButtonEl",
  "trainerBattleSetupCloseButtonEl",
  "trainerBattleSetupConfirmButtonEl",
  "trainerBattleSetupModalEl",
  "trainerBattleSetupRosterEl",
  "trainerBattleSetupRulesEl",
  "trainerBattleSetupSlotsEl",
  "trainerBattleSetupStatusEl",
  "trainerBattleSetupSubtitleEl",
  "trainerBattleSetupTitleEl",
  "triggerZoneAction",
  "tryOpenPendingTutorialFlow",
  "update",
  "updateEvolutionAnimation",
  "updateHud",
  "validateRouteDataPayload",
  "getTrainerBattleSetupDefinition",
]);

export function createRuntimeUiInteractionSystem(options = {}) {
  const scope = getRuntimeSystemBindings(options);
  let {
    APPEARANCE_UNLOCK_LEVEL,
    APP_VERSION,
    Array,
    BALL_CAPTURE_RULE_CAPTURE_ALL,
    BALL_CAPTURE_RULE_CAPTURE_OWNED,
    BALL_CAPTURE_RULE_CAPTURE_SHINY,
    BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
    BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
    BALL_CAPTURE_TOGGLE_DEFINITIONS,
    BALL_CONFIG_BY_TYPE,
    BALL_CONFIG_CSV_PATH,
    BALL_TYPE_FALLBACK_ORDER,
    BASE_STEP_MS,
    Boolean,
    DEFAULT_BALL_CONFIG_BY_TYPE,
    DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID,
    DEFAULT_ROUTE_ID,
    DEFAULT_WILD_LEVEL_MAX,
    DEFAULT_WILD_LEVEL_MIN,
    DEFERRED_ROUTE_WARMUP_CHUNK_SIZE,
    DEFERRED_ROUTE_WARMUP_DELAY_MS,
    DISPLAY_APP_VERSION,
    Date,
    GAME_DESIGN_SNAPSHOT,
    EXTRA_SHOP_ITEM_CONFIG_BY_ID,
    Element,
    Error,
    GACHA_BASE_MAX_POKEMON_ID,
    GACHA_EXTENDED_MAX_POKEMON_ID,
    GACHA_SPIN_COST_COINS,
    HTMLButtonElement,
    HTMLElement,
    HTMLImageElement,
    Image,
    JSON,
    MAX_LEVEL,
    MAX_TEAM_SIZE,
    Map,
    Math,
    Number,
    Object,
    POKEDEX_BASE_MAX_POKEMON_ID,
    POKEDEX_EXTENDED_MAX_POKEMON_ID,
    POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS,
    POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS,
    POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3,
    POKEDEX_VARIANT_PREFERENCE_GEN_4,
    POKEDEX_VIRTUAL_CARD_HEIGHT_PX,
    POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX,
    POKEDEX_VIRTUAL_GAP_PX,
    POKEDEX_VIRTUAL_OVERSCAN_ROWS,
    POKEMON_NICKNAME_MAX_LENGTH,
    POKEMON_TALENTS_CSV_PATH,
    Promise,
    ROUTE_1_TUTORIAL_ID,
    ROUTE_DATA_DIR,
    ROUTE_ENCOUNTERS_CSV_PATH,
    RUNTIME_CLIENT_BROWSER_PC,
    RUNTIME_CLIENT_BROWSER_SMARTPHONE,
    RUNTIME_CLIENT_DESKTOP_EXE_PC,
    ResizeObserver,
    SHOP_ITEMS_CSV_PATH,
    SHOP_ITEM_CONFIG_BY_ID,
    SHOP_QUANTITY_MODE_MAX,
    SHOP_TAB_COMBAT,
    SHOP_TAB_POKEBALLS,
    STARTER_CHOICES,
    STAT_KEYS,
    STAT_LABELS_FR,
    Set,
    String,
    TALENT_NONE_DESCRIPTION_FR,
    TARGET_FRAME_MS,
    TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX,
    TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS,
    TEAM_DRAG_CLICK_SUPPRESS_MS,
    TEAM_DRAG_START_DISTANCE_PX,
    TEAM_SPRITE_SCALE,
    TRAINER_BATTLE_ENEMY_HP_MULTIPLIER,
    TRAINER_BATTLE_ENEMY_TIMER_MS,
    TRAINER_BATTLE_TEAM_SIZE_COUNT,
    TYPE_ICON_ASSET_DIR,
    UNKNOWN_CAVE_ROUTE_ID,
    animatedSpriteFramesCache,
    appearanceGridEl,
    appearanceModalEl,
    appearanceShinyStatusEl,
    appearanceShinyToggleButtonEl,
    appearanceSubtitleEl,
    appearanceTitleEl,
    appearanceUltraShinyToggleButtonEl,
    applyAppearanceModesToEvolutionFamily,
    applyNicknameToEvolutionFamily,
    applyTeamTalentOverrides,
    assertValidBallConfig,
    assertValidEncounter,
    assertValidShopItemConfig,
    activateNextEvolutionAnimationIfNeeded,
    ballCaptureMenuEl,
    ballCaptureMenuTitleEl,
    ballCaptureMenuSummaryEl,
    ballCaptureMenuCloseButtonEl,
    ballCaptureMenuTabsEl,
    ballCaptureTabPokeButtonEl,
    ballCaptureTabSuperButtonEl,
    ballCaptureTabHyperButtonEl,
    boxesGridEl,
    boxesHeaderCopyEl,
    boxesHeaderDefaultEl,
    boxesInfoPanelEl,
    boxesMobileSelectionActionsEl,
    boxesMobileSelectionCancelButtonEl,
    boxesMobileSelectionConfirmButtonEl,
    boxesMobileSelectionSummaryEl,
    boxesModalEl,
    boxesSearchInputEl,
    boxesShinyCounterEl,
    boxesSubtitleEl,
    canvas,
    clamp,
    clearTimeout,
    cloneConfigMap,
    closeEvolutionItemChoiceModal,
    closeGachaModal,
    compareShopItems,
    computeLayout,
    computeStatsAtLevel,
    console,
    createRuntimeConfigLoaders,
    document,
    ensureAppearanceEditorUnlockedFromProgress,
    ensureVariantAppearanceAssetsLoaded,
    enqueueEvolutionReadyNotification,
    escapeHtml,
    fetch,
    formatCompactNumber,
    formatTalentLabelFr,
    formatTypeLabelFr,
    formatTypeListFr,
    getActiveBallType,
    getAppearanceUnlockState,
    getAttackBoostRemainingMs,
    getBallCaptureRulesForType,
    getBallInventoryCount,
    getBaseStatTotal,
    getCapturedTotal,
    getCurrentAttackIntervalMs,
    getEnemySpriteRenderSize,
    getEnvironmentSnapshotForRender,
    getEvolutionFamilySpeciesIds,
    getFamilyShinyCaptureCount,
    getFamilyUltraShinyCaptureCount,
    getGachaSkinCandidates,
    getLegendaryFieldAttackIntervalMultiplier,
    getLegendaryFieldPresence,
    getOrderedCatalogRouteIds,
    getOrderedUnlockedRouteIds,
    getOwnedSpriteVariantsForRecord,
    getPassiveBehaviorIdForTalentId,
    getPokemonDataSpriteScale,
    getPokemonDisplayNameForOwnedEntity,
    getPokemonEntityRecord,
    getPokemonNicknameById,
    getPokemonNicknameLength,
    getPreferredDefaultSpriteVariant,
    getRouteDefeatCount,
    getRouteDisplayName,
    getRouteUnlockDefeatTarget,
    getRouteUnlockMode,
    getRouteUnlockProgressState,
    getRouteZoneType,
    getRuntimeClientType,
    getSaveBackendTelemetryValue,
    getSelectedOwnedSpriteVariantForRecord,
    getSelectedShopBallQuantity,
    getShopItemCount,
    getSortedBallConfigs,
    getSpeciesStatsSummary,
    getSpriteVariantDisplayLabel,
    getSpriteVariantsForDef,
    getTeamAuraAttackBonusBySlot,
    getTeamBoxesAccessState,
    getTeamBoxesLockedMessage,
    getTeamSpriteScale,
    getTutorialFlowDefinition,
    getTypeMultiplier,
    getUiAnimationState,
    getVariantShinySpritePath,
    getXpToNextLevelForSpecies,
    hasImplementedTalentEffect,
    hideModalWithTween,
    hidePopupWithTween,
    hoverPopupEl,
    isAppearanceEditorUnlocked,
    isCurrentRouteCombatEnabled,
    isEntityUnlocked,
    isShinyAppearanceUnlockedForRecord,
    isUltraShinyAppearanceUnlockedForRecord,
    loadImage,
    loadPokemonDefinitions,
    navigator,
    normalizePokemonEntityRecord,
    normalizeRouteDefeatCounts,
    normalizeShopQuantityMode,
    normalizeSpriteVariantId,
    normalizeStatsPayload,
    normalizeTalentDefinition,
    normalizeTalentId,
    normalizeType,
    normalizeUiDisplayText,
    normalizeUnlockedRouteIds,
    parseCsvMethods,
    parseCsvObjects,
    pendingRouteBackgroundLoads,
    pendingRouteDefinitionLoads,
    persistSaveData,
    pokedexCapturedStatEl,
    pokedexEncounteredStatEl,
    pokedexEntriesCacheById,
    pokedexEntriesCacheCapturedSpeciesCount,
    pokedexEntriesCacheDirty,
    pokedexEntriesCacheEncounteredSpeciesCount,
    pokedexEntriesCacheList,
    pokedexEntriesCachePokemonDefsCount,
    pokedexEntriesCacheSaveDataRef,
    pokedexEntriesCacheShinySpeciesCount,
    pokedexEntriesCacheSpeciesRef,
    pokedexEntriesCacheUltraShinySpeciesCount,
    pokedexGlobalCompletionEl,
    pokedexGridEl,
    pokedexInfoPanelEl,
    pokedexModalEl,
    pokedexSearchInputEl,
    pokedexRenderRafHandle,
    pokedexShinyStatEl,
    pokedexSpritePrefetchStateByPath,
    pokedexSubtitleEl,
    pokedexUltraShinyStatEl,
    pokedexViewportRenderRafHandle,
    pokedexVirtualBottomSpacerEl,
    pokedexVirtualColumnGapPx,
    pokedexVirtualContentEl,
    pokedexVirtualEventsBound,
    pokedexVirtualLastEndIndex,
    pokedexVirtualLastSliceKey,
    pokedexVirtualLastStartIndex,
    pokedexVirtualLayoutCacheKey,
    pokedexVirtualPaddingBottomPx,
    pokedexVirtualPaddingLeftPx,
    pokedexVirtualPaddingRightPx,
    pokedexVirtualPaddingTopPx,
    pokedexVirtualResizeObserver,
    pokedexVirtualRowGapPx,
    pokedexVirtualTopSpacerEl,
    preloadSelectedAppearanceAssetsForTeam,
    queueTeamLevelUpEffects,
    queueRoute1TutorialIfNeeded,
    readCsvBooleanCell,
    readCsvCell,
    readCsvNumberCell,
    readCsvTypedValue,
    rebuildEvolutionStoneConfigState,
    rebuildShopItemConfigState,
    rebuildTeamAndSyncBattle,
    reconcileAppearanceForEntityRecord,
    refreshBallConfigDerivedState,
    refreshRouteUi,
    refreshZoneActionButtons,
    renameCharCountEl,
    renameInputEl,
    renameModalEl,
    renameSubtitleEl,
    renameTitleEl,
    render,
    replaceConfigMap,
    resetBackgroundDriftForRoute,
    resetOnlyOneEncounterCycle,
    resolveEntitySpriteDrawSource,
    resolveSpriteAppearanceForEntity,
    resolveTalentDefinition,
    findNextEligibleEvolution,
    sanitizePokemonNickname,
    setEntityLevel,
    setBallCaptureRulesForType,
    setMapOpen,
    setShopOpen,
    setTopMessage,
    shouldFlipTeamSprite,
    shouldForceUltraShinyAllPokemon,
    showModalWithTween,
    showPopupWithTween,
    showTooltipWithTween,
    loadingScreenEl,
    captureRootEl,
    routeNavPanelEl,
    routeNavInfoPanelEl,
    mapConnectionsInfoPanelEl,
    starterModalEl,
    state,
    teamContextMenuAppearanceButtonEl,
    teamContextMenuBoxesButtonEl,
    teamContextMenuEl,
    teamContextMenuRenameButtonEl,
    teamContextMenuTitleEl,
    toSafeInt,
    toggleActionDockFullscreenMenu,
    toggleRouteNavDrawer,
    trainerBattleSetupCancelButtonEl,
    trainerBattleSetupCloseButtonEl,
    trainerBattleSetupConfirmButtonEl,
    trainerBattleSetupModalEl,
    trainerBattleSetupRosterEl,
    trainerBattleSetupRulesEl,
    trainerBattleSetupSlotsEl,
    trainerBattleSetupStatusEl,
    trainerBattleSetupSubtitleEl,
    trainerBattleSetupTitleEl,
    triggerZoneAction,
    tryOpenPendingTutorialFlow,
    update,
    updateEvolutionAnimation,
    updateHud,
    validateRouteDataPayload,
    window,
    getTrainerBattleSetupDefinition = () => null,
    isTrainerBattleActive = () => false,
  } = scope;
  const pendingPokedexDefinitionLoads = new Map();
  const pendingDialogueWarmupLoads = new Map();
  let boxesSearchEventsBound = false;
  let pokedexSearchEventsBound = false;

function getWorldCoordinatesFromPointerEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  return {
    worldX: ((event.clientX - rect.left) / width) * state.viewport.width,
    worldY: ((event.clientY - rect.top) / height) * state.viewport.height,
  };
}

function isCanvasBattleInteractionBlocked() {
  const trainerBattleActive = typeof isTrainerBattleActive === "function" && isTrainerBattleActive();
  return Boolean(
    state.mode !== "ready"
    || state.ui.boxesOpen
    || state.ui.pokedexOpen
    || state.ui.appearanceOpen
    || state.ui.renameOpen
    || state.ui.tutorialOpen
    || state.ui.trainerBattleSetupOpen
    || state.ui.mapOpen
    || state.ui.shopOpen
    || state.ui.gachaOpen
    || trainerBattleActive
    || state.evolutionAnimation.current,
  );
}

function isTrainerBattleUiLocked() {
  return Boolean(
    state.ui.trainerBattleSetupOpen
    || (typeof isTrainerBattleActive === "function" && isTrainerBattleActive()),
  );
}

function syncCanvasInteractionCursor() {
  if (!canvas) {
    return;
  }
  if (state.ui.teamDragActive) {
    canvas.style.cursor = state.ui.teamDragMoved ? "grabbing" : "grab";
    return;
  }
  const hasOverlayHover = Boolean(state.ui.hoveredBallOverlayType);
  const hasCanvasOverlayHoverAction = Boolean(state.ui.canvasOverlayHoveredActionId);
  canvas.style.cursor =
    (
      hasCanvasOverlayHoverAction
      || (
        (state.ui.hoveredTeamSlotIndex >= 0 || hasOverlayHover)
        && !state.ui.teamContextMenuOpen
        && !state.ui.ballCaptureMenuOpen
      )
    )
      && !isCanvasBattleInteractionBlocked()
      ? "pointer"
      : "default";
}

function setHoveredBallOverlayType(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  const nextType = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type) ? type : "";
  if (state.ui.hoveredBallOverlayType === nextType) {
    syncCanvasInteractionCursor();
    return;
  }
  state.ui.hoveredBallOverlayType = nextType;
  syncCanvasInteractionCursor();
}

function setHoveredTeamSlotIndex(slotIndex) {
  const nextIndex = slotIndex >= 0 ? clamp(toSafeInt(slotIndex, -1), 0, MAX_TEAM_SIZE - 1) : -1;
  if (state.ui.hoveredTeamSlotIndex === nextIndex) {
    syncCanvasInteractionCursor();
    return;
  }
  state.ui.hoveredTeamSlotIndex = nextIndex;
  syncCanvasInteractionCursor();
}

function setHoveredCanvasOverlayActionId(actionId = "") {
  const nextId = String(actionId || "").trim();
  if (state.ui.canvasOverlayHoveredActionId === nextId) {
    syncCanvasInteractionCursor();
    return;
  }
  state.ui.canvasOverlayHoveredActionId = nextId;
  syncCanvasInteractionCursor();
}

function getNormalizedPointerType(pointerType) {
  return String(pointerType || "").toLowerCase().trim();
}

function isPrimaryCanvasPointerEvent(event) {
  const pointerType = getNormalizedPointerType(event?.pointerType);
  if (pointerType === "mouse") {
    return Number(event?.button) === 0;
  }
  if (typeof event?.isPrimary === "boolean" && !event.isPrimary) {
    return false;
  }
  return true;
}

function isEventFromActiveTeamDragPointer(event) {
  const activePointerId = toSafeInt(state.ui.teamDragPointerId, -1);
  if (activePointerId < 0) {
    return true;
  }
  return toSafeInt(event?.pointerId, -2) === activePointerId;
}

function captureCanvasPointer(pointerId) {
  const safePointerId = toSafeInt(pointerId, -1);
  if (!canvas || safePointerId < 0 || typeof canvas.setPointerCapture !== "function") {
    return;
  }
  try {
    canvas.setPointerCapture(safePointerId);
  } catch (_) {
    // Pointer capture can fail on unsupported devices; drag still works without it.
  }
}

function releaseCanvasPointer(pointerId) {
  const safePointerId = toSafeInt(pointerId, -1);
  if (!canvas || safePointerId < 0 || typeof canvas.releasePointerCapture !== "function") {
    return;
  }
  try {
    if (typeof canvas.hasPointerCapture === "function" && !canvas.hasPointerCapture(safePointerId)) {
      return;
    }
    canvas.releasePointerCapture(safePointerId);
  } catch (_) {
    // Ignore release errors if capture was already dropped by the browser.
  }
}

function getTeamDragActivationDistancePx(pointerType) {
  const normalizedPointerType = getNormalizedPointerType(pointerType || state.ui.teamDragPointerType);
  if (normalizedPointerType === "touch") {
    return TEAM_DRAG_START_DISTANCE_PX * 1.4;
  }
  return TEAM_DRAG_START_DISTANCE_PX;
}

function getTeamContextTouchHoldCancelDistancePx(pointerType) {
  const activationDistancePx = Number(getTeamDragActivationDistancePx(pointerType));
  const safeActivationDistancePx = Number.isFinite(activationDistancePx)
    ? activationDistancePx
    : TEAM_DRAG_START_DISTANCE_PX;
  return Math.max(TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX, safeActivationDistancePx);
}

function isTouchLikePointerType(pointerType) {
  const normalizedPointerType = getNormalizedPointerType(pointerType);
  return normalizedPointerType === "touch" || normalizedPointerType === "pen";
}

function resetTeamContextTouchHoldState() {
  state.ui.teamContextTouchHoldTimerId = 0;
  state.ui.teamContextTouchHoldPointerId = -1;
  state.ui.teamContextTouchHoldSlotIndex = -1;
  state.ui.teamContextTouchHoldClientX = 0;
  state.ui.teamContextTouchHoldClientY = 0;
  state.ui.teamContextTouchHoldStartClientX = 0;
  state.ui.teamContextTouchHoldStartClientY = 0;
}

function cancelTeamContextTouchHold(pointerId = null) {
  const activePointerId = toSafeInt(state.ui.teamContextTouchHoldPointerId, -1);
  if (pointerId !== null && activePointerId >= 0 && toSafeInt(pointerId, -2) !== activePointerId) {
    return false;
  }
  const timerId = toSafeInt(state.ui.teamContextTouchHoldTimerId, 0);
  if (timerId > 0) {
    clearTimeout(timerId);
  }
  resetTeamContextTouchHoldState();
  return true;
}

function triggerTeamContextTouchHold(pointerId) {
  const safePointerId = toSafeInt(pointerId, -1);
  if (safePointerId < 0 || toSafeInt(state.ui.teamContextTouchHoldPointerId, -1) !== safePointerId) {
    return false;
  }
  const slotIndex = clamp(toSafeInt(state.ui.teamContextTouchHoldSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const member = slotIndex >= 0 ? state.team[slotIndex] : null;
  const activeDragPointerId = toSafeInt(state.ui.teamDragPointerId, -1);
  const matchesActiveDragPointer = activeDragPointerId < 0 || activeDragPointerId === safePointerId;
  if (
    slotIndex < 0
    || !member
    || isCanvasBattleInteractionBlocked()
    || !state.ui.teamDragActive
    || !matchesActiveDragPointer
    || state.ui.teamDragMoved
  ) {
    cancelTeamContextTouchHold(safePointerId);
    return false;
  }

  const clientX = Number(state.ui.teamContextTouchHoldClientX || state.ui.teamDragStartClientX || 0);
  const clientY = Number(state.ui.teamContextTouchHoldClientY || state.ui.teamDragStartClientY || 0);
  cancelTeamContextTouchHold(safePointerId);
  clearTeamDragState({ suppressClickMs: TEAM_DRAG_CLICK_SUPPRESS_MS });
  openTeamContextMenu(slotIndex, member, clientX, clientY);
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(12);
  }
  render();
  return true;
}

function scheduleTeamContextTouchHold(slotIndex, member, event) {
  if (!isTouchLikePointerType(event?.pointerType) || !member) {
    cancelTeamContextTouchHold();
    return;
  }
  const pointerId = toSafeInt(event?.pointerId, -1);
  if (pointerId < 0) {
    cancelTeamContextTouchHold();
    return;
  }
  cancelTeamContextTouchHold();
  state.ui.teamContextTouchHoldPointerId = pointerId;
  state.ui.teamContextTouchHoldSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  state.ui.teamContextTouchHoldClientX = Number(event.clientX || 0);
  state.ui.teamContextTouchHoldClientY = Number(event.clientY || 0);
  state.ui.teamContextTouchHoldStartClientX = Number(event.clientX || 0);
  state.ui.teamContextTouchHoldStartClientY = Number(event.clientY || 0);
  state.ui.teamContextTouchHoldTimerId = window.setTimeout(() => {
    triggerTeamContextTouchHold(pointerId);
  }, TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS);
}

function updateTeamContextTouchHoldFromMove(event, worldX, worldY, layout) {
  const pointerId = toSafeInt(event?.pointerId, -1);
  if (pointerId < 0 || toSafeInt(state.ui.teamContextTouchHoldPointerId, -1) !== pointerId) {
    return;
  }
  state.ui.teamContextTouchHoldClientX = Number(event.clientX || state.ui.teamContextTouchHoldClientX || 0);
  state.ui.teamContextTouchHoldClientY = Number(event.clientY || state.ui.teamContextTouchHoldClientY || 0);
  const dx = state.ui.teamContextTouchHoldClientX - Number(state.ui.teamContextTouchHoldStartClientX || 0);
  const dy = state.ui.teamContextTouchHoldClientY - Number(state.ui.teamContextTouchHoldStartClientY || 0);
  const distanceSquared = dx * dx + dy * dy;
  const cancelDistance = getTeamContextTouchHoldCancelDistancePx(event?.pointerType);
  if (distanceSquared >= cancelDistance * cancelDistance) {
    cancelTeamContextTouchHold(pointerId);
    return;
  }
  const slotIndex = clamp(toSafeInt(state.ui.teamContextTouchHoldSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const hoveredSlot = findHoveredTeamSlot(worldX, worldY, layout, { pointerType: event?.pointerType });
  if (!hoveredSlot || hoveredSlot.slotIndex !== slotIndex) {
    cancelTeamContextTouchHold(pointerId);
  }
}

function isTeamSlotSwapAllowed(routeId = null) {
  return getTeamBoxesAccessState(routeId).allowed;
}

function clearTeamDragState(options = {}) {
  const suppressClickMs = Math.max(0, toSafeInt(options?.suppressClickMs, 0));
  if (suppressClickMs > 0) {
    state.ui.teamDragSuppressClickUntilMs = Math.max(
      Number(state.ui.teamDragSuppressClickUntilMs || 0),
      Date.now() + suppressClickMs,
    );
  }
  cancelTeamContextTouchHold(state.ui.teamDragPointerId);
  releaseCanvasPointer(state.ui.teamDragPointerId);
  state.ui.teamDragActive = false;
  state.ui.teamDragMoved = false;
  state.ui.teamDragSourceSlotIndex = -1;
  state.ui.teamDragTargetSlotIndex = -1;
  state.ui.teamDragStartClientX = 0;
  state.ui.teamDragStartClientY = 0;
  state.ui.teamDragCurrentWorldX = 0;
  state.ui.teamDragCurrentWorldY = 0;
  state.ui.teamDragPointerId = -1;
  state.ui.teamDragPointerType = "";
  syncCanvasInteractionCursor();
}

function beginTeamDragForSlot(slotIndex, pointerPosition) {
  const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  if (safeSlotIndex < 0 || !state.team[safeSlotIndex]) {
    clearTeamDragState();
    return false;
  }
  state.ui.teamDragActive = true;
  state.ui.teamDragMoved = false;
  state.ui.teamDragSourceSlotIndex = safeSlotIndex;
  state.ui.teamDragTargetSlotIndex = -1;
  state.ui.teamDragStartClientX = Number(pointerPosition?.clientX || 0);
  state.ui.teamDragStartClientY = Number(pointerPosition?.clientY || 0);
  state.ui.teamDragCurrentWorldX = Number(pointerPosition?.worldX || 0);
  state.ui.teamDragCurrentWorldY = Number(pointerPosition?.worldY || 0);
  state.ui.teamDragPointerId = toSafeInt(pointerPosition?.pointerId, -1);
  state.ui.teamDragPointerType = getNormalizedPointerType(pointerPosition?.pointerType);
  syncCanvasInteractionCursor();
  return true;
}

function isTeamDragClickSuppressed() {
  return Date.now() < Number(state.ui.teamDragSuppressClickUntilMs || 0);
}

function swapTeamSlotsFromUi(firstSlotIndex, secondSlotIndex) {
  const first = clamp(toSafeInt(firstSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const second = clamp(toSafeInt(secondSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  if (first < 0 || second < 0 || first === second) {
    return false;
  }
  if (!isTeamSlotSwapAllowed()) {
    setTopMessage(getTeamBoxesLockedMessage(), 2100);
    return false;
  }

  let swapped = false;
  if (state.battle && typeof state.battle.swapTeamSlots === "function") {
    swapped = state.battle.swapTeamSlots(first, second);
  } else if (Array.isArray(state.team) && Array.isArray(state.saveData?.team)) {
    const hasRuntimeSlots = first < state.team.length && second < state.team.length;
    const hasSaveSlots = first < state.saveData.team.length && second < state.saveData.team.length;
    if (hasRuntimeSlots && hasSaveSlots) {
      const runtimeTemp = state.team[first];
      state.team[first] = state.team[second];
      state.team[second] = runtimeTemp;
      const saveTemp = state.saveData.team[first];
      state.saveData.team[first] = state.saveData.team[second];
      state.saveData.team[second] = saveTemp;
      applyTeamTalentOverrides(state.team);
      swapped = true;
    }
  }

  if (!swapped) {
    return false;
  }
  persistSaveData();
  updateHud();
  render();
  return true;
}

function getBallCaptureMenuBallType() {
  const type = String(state.ui.ballCaptureMenuBallType || "").toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type) ? type : "";
}

function closeBallCaptureMenu() {
  state.ui.ballCaptureMenuOpen = false;
  state.ui.ballCaptureMenuBallType = "";
  state.ui.canvasBallCaptureMenuModel = null;
  state.ui.canvasOverlayActionHitboxes = [];
  setHoveredCanvasOverlayActionId("");
  syncCanvasRuntimeOverlayDomOwnership();
  if (ballCaptureMenuEl) {
    hidePopupWithTween(ballCaptureMenuEl);
  }
  syncCanvasInteractionCursor();
}

function closeTeamContextMenu() {
  state.ui.teamContextMenuOpen = false;
  state.ui.teamContextMenuSlotIndex = -1;
  state.ui.teamContextMenuPokemonId = null;
  state.ui.canvasTeamContextMenuModel = null;
  state.ui.canvasOverlayActionHitboxes = [];
  setHoveredCanvasOverlayActionId("");
  syncCanvasRuntimeOverlayDomOwnership();
  if (teamContextMenuEl) {
    hidePopupWithTween(teamContextMenuEl);
  }
  syncCanvasInteractionCursor();
}

function refreshRenameCharCount() {
  if (!renameCharCountEl) {
    return;
  }
  const currentLength = getPokemonNicknameLength(renameInputEl?.value || "", { trimEdges: false });
  renameCharCountEl.textContent = `${currentLength}/${POKEMON_NICKNAME_MAX_LENGTH}`;
}

function closeRenameModal() {
  state.ui.renameOpen = false;
  state.ui.renameSlotIndex = -1;
  state.ui.renamePokemonId = null;
  if (renameModalEl) {
    hideModalWithTween(renameModalEl);
  }
  if (renameInputEl) {
    renameInputEl.value = "";
  }
  refreshRenameCharCount();
}

function openRenameModalForTeamSlot(slotIndex) {
  if (!renameModalEl || !state.saveData || !Array.isArray(state.saveData.team)) {
    return false;
  }
  const index = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const pokemonId = Number(state.saveData.team[index] || 0);
  const record = getPokemonEntityRecord(pokemonId);
  if (index < 0 || pokemonId <= 0 || !record) {
    return false;
  }

  const baseNameFr = getPokemonDisplayNameById(pokemonId);
  const nickname = sanitizePokemonNickname(record?.nickname);
  state.ui.renameOpen = true;
  state.ui.renameSlotIndex = index;
  state.ui.renamePokemonId = pokemonId;

  if (renameTitleEl) {
    renameTitleEl.textContent = `Renommer | ${nickname || baseNameFr}`;
  }
  if (renameSubtitleEl) {
    renameSubtitleEl.textContent = `${baseNameFr} (${getTeamSlotLabel(index)}) | appliqu\u00e9 \u00e0 la famille \u00e9volutive`;
  }
  if (renameInputEl) {
    renameInputEl.value = nickname;
  }
  refreshRenameCharCount();
  showModalWithTween(renameModalEl);
  window.requestAnimationFrame(() => {
    renameInputEl?.focus();
    renameInputEl?.select();
  });
  return true;
}

function applyRenameModal() {
  const pokemonId = Number(state.ui.renamePokemonId || 0);
  const slotIndex = clamp(toSafeInt(state.ui.renameSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const record = getPokemonEntityRecord(pokemonId);
  if (pokemonId <= 0 || slotIndex < 0 || !record) {
    closeRenameModal();
    return;
  }

  const previousDisplayName = getPokemonDisplayNameForOwnedEntity(pokemonId);
  const nextNickname = sanitizePokemonNickname(renameInputEl?.value || "");
  const renameResult = applyNicknameToEvolutionFamily(pokemonId, nextNickname);
  if (!renameResult.changed) {
    closeRenameModal();
    return;
  }

  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();
  render();
  closeRenameModal();

  const nextDisplayName = getPokemonDisplayNameForOwnedEntity(pokemonId);
  if (nextNickname) {
    setTopMessage(
      `Surnom de famille appliqu\u00e9 (${renameResult.familySize}): ${previousDisplayName} -> ${nextDisplayName}.`,
      1900,
    );
  } else {
    setTopMessage(`Surnom de famille retir\u00e9 (${renameResult.familySize} Pokemon).`, 1800);
  }
}

function clearCanvasHoverState() {
  if (state.ui.teamDragActive) {
    state.ui.teamDragTargetSlotIndex = -1;
  }
  setHoveredTeamSlotIndex(-1);
  setHoveredBallOverlayType("");
  setHoveredCanvasOverlayActionId("");
  hideHoverPopup();
}

function isDesktopCanvasRuntimeOverlayMode() {
  return !isPhoneUiViewport();
}

function setCanvasRuntimeOwnedFlag(element, owned) {
  if (!element || typeof element !== "object" || !element.dataset) {
    return;
  }
  if (owned) {
    element.dataset.canvasRuntimeOwned = "true";
  } else {
    delete element.dataset.canvasRuntimeOwned;
  }
}

function syncCanvasRuntimeOverlayDomOwnership() {
  const useCanvasOverlay = isDesktopCanvasRuntimeOverlayMode();
  setCanvasRuntimeOwnedFlag(hoverPopupEl, useCanvasOverlay && Boolean(state.ui.canvasHoverPopupModel));
  setCanvasRuntimeOwnedFlag(teamContextMenuEl, useCanvasOverlay && Boolean(state.ui.canvasTeamContextMenuModel));
  setCanvasRuntimeOwnedFlag(ballCaptureMenuEl, useCanvasOverlay && Boolean(state.ui.canvasBallCaptureMenuModel));
}

function getCanvasLocalCoordinatesFromClient(clientX, clientY) {
  const fallbackX = Number.isFinite(Number(clientX)) ? Number(clientX) : (Number(state.viewport?.width) || 0) * 0.5;
  const fallbackY = Number.isFinite(Number(clientY)) ? Number(clientY) : (Number(state.viewport?.height) || 0) * 0.5;
  if (!canvas || typeof canvas.getBoundingClientRect !== "function") {
    return { x: fallbackX, y: fallbackY };
  }
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Number(rect?.width) || Number(state.viewport?.width) || 1);
  const height = Math.max(1, Number(rect?.height) || Number(state.viewport?.height) || 1);
  return {
    x: ((fallbackX - Number(rect?.left || 0)) / width) * Math.max(1, Number(state.viewport?.width) || 1),
    y: ((fallbackY - Number(rect?.top || 0)) / height) * Math.max(1, Number(state.viewport?.height) || 1),
  };
}

function getCanvasLocalCoordinatesFromPointerEvent(event) {
  return getCanvasLocalCoordinatesFromClient(event?.clientX, event?.clientY);
}

function findCanvasOverlayHitboxAtPoint(x, y, options = {}) {
  const hitboxes = Array.isArray(state.ui.canvasOverlayActionHitboxes) ? state.ui.canvasOverlayActionHitboxes : [];
  const interactiveOnly = options?.interactiveOnly === true;
  for (let index = hitboxes.length - 1; index >= 0; index -= 1) {
    const hitbox = hitboxes[index];
    const width = Number(hitbox?.width || 0);
    const height = Number(hitbox?.height || 0);
    if (width <= 0 || height <= 0) {
      continue;
    }
    if (interactiveOnly && hitbox?.interactive === false) {
      continue;
    }
    const hitboxX = Number(hitbox?.x || 0);
    const hitboxY = Number(hitbox?.y || 0);
    if (x < hitboxX || y < hitboxY || x > hitboxX + width || y > hitboxY + height) {
      continue;
    }
    return hitbox;
  }
  return null;
}

function buildCanvasHoverPopupModel({
  entity,
  clientX,
  clientY,
  anchorX,
  anchorY,
  title,
  subtitle,
  badges,
  passiveLabel,
  passivePill,
  passiveDescription,
  typeSummaryText,
  metrics,
  progress,
} = {}) {
  const anchor = Number.isFinite(Number(anchorX)) && Number.isFinite(Number(anchorY))
    ? { x: Number(anchorX), y: Number(anchorY) }
    : getCanvasLocalCoordinatesFromClient(clientX, clientY);
  return {
    anchorX: anchor.x,
    anchorY: anchor.y,
    title: String(title || entity?.nameFr || ""),
    subtitle: String(subtitle || ""),
    badges: Array.isArray(badges) ? badges.map((value) => String(value || "").trim()).filter(Boolean) : [],
    passiveLabel: String(passiveLabel || "").trim(),
    passivePill: String(passivePill || "").trim(),
    passiveDescription: String(passiveDescription || "").trim(),
    typeSummaryText: String(typeSummaryText || "").trim(),
    metrics: Array.isArray(metrics) ? metrics.map((metric) => ({
      label: String(metric?.label || "").trim(),
      value: String(metric?.value || "").trim(),
      detail: String(metric?.detail || "").trim(),
      tone: String(metric?.tone || "").trim(),
    })).filter((metric) => metric.label && metric.value) : [],
    progress: Array.isArray(progress) ? progress.map((entry) => ({
      label: String(entry?.label || "").trim(),
      value: String(entry?.value || "").trim(),
      detail: String(entry?.detail || "").trim(),
      tone: String(entry?.tone || "").trim(),
    })).filter((entry) => entry.label && entry.value) : [],
  };
}

function buildCanvasTeamContextMenuModel(slotIndex, member, clientX, clientY, options = {}) {
  if (!member) {
    return null;
  }
  const pokemonId = Number(member.id || 0);
  const name = member?.nameFr || getPokemonDisplayNameById(pokemonId);
  const appearanceUnlocked = isAppearanceEditorUnlocked();
  const boxesAccess = getTeamBoxesAccessState();
  const hasNickname = Boolean(getPokemonNicknameById(pokemonId));
  const anchor = Number.isFinite(Number(options?.anchorX)) && Number.isFinite(Number(options?.anchorY))
    ? { x: Number(options.anchorX), y: Number(options.anchorY) }
    : getCanvasLocalCoordinatesFromClient(clientX, clientY);
  return {
    anchorX: anchor.x,
    anchorY: anchor.y,
    slotIndex: clamp(toSafeInt(slotIndex, -1), 0, MAX_TEAM_SIZE - 1),
    title: `${name} • ${getTeamSlotLabel(slotIndex)}`,
    buttons: [
      {
        id: "team-context-rename",
        actionType: "rename",
        label: hasNickname ? "Gérer le surnom" : "Ajouter un surnom",
        meta: "Applique le changement à la famille évolutive.",
        disabled: slotIndex < 0 || pokemonId <= 0,
      },
      {
        id: "team-context-boxes",
        actionType: "boxes",
        label: boxesAccess.allowed ? "Échanger avec la boîte" : "Boîte verrouillée",
        meta: boxesAccess.allowed ? "Choisir un remplaçant pour ce slot." : "Disponible plus tard dans la progression.",
        disabled: slotIndex < 0 || pokemonId <= 0 || !boxesAccess.allowed,
      },
      {
        id: "team-context-appearance",
        actionType: "appearance",
        label: appearanceUnlocked ? "Changer l'apparence" : "Apparence verrouillée",
        meta: appearanceUnlocked ? "Équipe un sprite déjà débloqué." : `Débloque au niv. ${APPEARANCE_UNLOCK_LEVEL}.`,
        disabled: slotIndex < 0 || pokemonId <= 0 || !appearanceUnlocked,
      },
    ],
  };
}

function buildCanvasBallCaptureMenuModel(ballType, clientX, clientY, options = {}) {
  const type = getPreferredBallCaptureMenuType(ballType);
  if (!type) {
    return null;
  }
  const config = BALL_CONFIG_BY_TYPE[type];
  const count = Math.max(0, toSafeInt(getBallInventoryCount?.(type), 0));
  const rules = getBallCaptureRulesForType(type);
  const anchor = Number.isFinite(Number(options?.anchorX)) && Number.isFinite(Number(options?.anchorY))
    ? { x: Number(options.anchorX), y: Number(options.anchorY) }
    : getCanvasLocalCoordinatesFromClient(clientX, clientY);
  return {
    anchorX: anchor.x,
    anchorY: anchor.y,
    ballType: type,
    title: "Réglages capture",
    summary: `${config.nameFr} • ${count} disponibles`,
    tabs: [
      "poke_ball",
      "super_ball",
      "hyper_ball",
    ].map((candidateType) => {
      const candidateConfig = BALL_CONFIG_BY_TYPE[candidateType] || {};
      return {
        id: `ball-tab-${candidateType}`,
        ballType: candidateType,
        label: String(candidateConfig.nameFr || candidateType || "Ball"),
        count: Math.max(0, toSafeInt(getBallInventoryCount?.(candidateType), 0)),
        selected: candidateType === type,
      };
    }),
    toggles: Array.isArray(BALL_CAPTURE_TOGGLE_DEFINITIONS)
      ? BALL_CAPTURE_TOGGLE_DEFINITIONS.map((definition) => ({
        id: `ball-rule-${String(definition?.key || "")}`,
        ruleKey: String(definition?.key || ""),
        label: String(definition?.label || "").trim(),
        description: String(definition?.description || "").trim(),
        enabled: Boolean(rules[String(definition?.key || "")]),
      })).filter((definition) => definition.ruleKey && definition.label)
      : [],
  };
}

function getCanvasRuntimeOverlayHitboxFromPointerEvent(event, options = {}) {
  if (!isDesktopCanvasRuntimeOverlayMode()) {
    return null;
  }
  const point = getCanvasLocalCoordinatesFromPointerEvent(event);
  return findCanvasOverlayHitboxAtPoint(point.x, point.y, options);
}

function syncCanvasRuntimeOverlayHoverFromPointerEvent(event) {
  const hitbox = getCanvasRuntimeOverlayHitboxFromPointerEvent(event);
  setHoveredCanvasOverlayActionId(hitbox?.interactive === false ? "" : String(hitbox?.id || ""));
  return hitbox;
}

function handleCanvasRuntimeOverlayAction(hitbox) {
  const actionType = String(hitbox?.actionType || "").trim();
  if (!actionType || hitbox?.interactive === false) {
    return false;
  }
  switch (actionType) {
    case "rename":
      closeTeamContextMenu();
      openRenameModalForTeamSlot(hitbox.slotIndex);
      render();
      return true;
    case "boxes":
      closeTeamContextMenu();
      openBoxesForTeamSlot(hitbox.slotIndex);
      render();
      return true;
    case "appearance":
      closeTeamContextMenu();
      openAppearanceForTeamSlot(hitbox.slotIndex);
      render();
      return true;
    case "topbar-ball-menu":
      if (state.ui.ballCaptureMenuOpen) {
        closeBallCaptureMenu();
      } else {
        openTopbarBallCaptureMenu();
      }
      render();
      return true;
    case "route-nav-drawer-toggle":
      toggleRouteNavDrawer();
      return true;
    case "action-dock-menu-toggle":
      toggleActionDockFullscreenMenu();
      return true;
    case "ball-tab":
      if (setBallCaptureMenuBallType(hitbox.ballType)) {
        render();
        return true;
      }
      return false;
    case "ball-rule":
      toggleBallCaptureRule(hitbox.ruleKey);
      return true;
    case "zone-action":
      triggerZoneAction(hitbox.actionId);
      return true;
    default:
      return false;
  }
}

function hideHoverPopup() {
  state.ui.canvasHoverPopupModel = null;
  syncCanvasRuntimeOverlayDomOwnership();
  if (!hoverPopupEl) {
    return;
  }
  const popupState = getUiAnimationState(hoverPopupEl);
  if (hoverPopupEl.classList.contains("hidden") || popupState?.phase === "hiding") {
    return;
  }
  hidePopupWithTween(hoverPopupEl);
}

function isPhoneUiViewport() {
  return Boolean(state?.layout?.viewportProfile?.phone);
}

function isStylableUiElement(value) {
  return Boolean(
    value
    && typeof value === "object"
    && value.style
    && typeof value.style.removeProperty === "function"
    && typeof value.style.setProperty === "function"
    && value.classList
    && typeof value.classList.add === "function"
    && typeof value.classList.remove === "function",
  );
}

function readRootCssNumberVariable(variableName, fallback = 0) {
  if (typeof window?.getComputedStyle !== "function" || typeof document === "undefined") {
    return Number(fallback) || 0;
  }
  const rootEl = document.documentElement || document.body;
  if (!rootEl || typeof rootEl !== "object") {
    return Number(fallback) || 0;
  }
  const rawValue = window.getComputedStyle(rootEl).getPropertyValue(String(variableName || "")).trim();
  const numeric = Number.parseFloat(rawValue);
  return Number.isFinite(numeric) ? numeric : Number(fallback) || 0;
}

function getActionDockBottomSheetOffsetPx() {
  const fallbackOffsetPx = readRootCssNumberVariable("--ui-mobile-bottom-offset-px", 12);
  const runtimeDockHeightPx = Math.max(0, readRootCssNumberVariable("--ui-runtime-dock-height-px", 92));
  if (typeof document === "undefined") {
    return fallbackOffsetPx;
  }
  const dockToggleEl = document.getElementById("action-dock-pokeball-toggle");
  if (!dockToggleEl || typeof dockToggleEl.getBoundingClientRect !== "function") {
    return fallbackOffsetPx;
  }
  const rect = dockToggleEl.getBoundingClientRect();
  const viewportHeight = Math.max(0, Number(window?.innerHeight) || 0);
  const top = Number(rect?.top);
  const height = Math.max(0, Number(rect?.height) || 0);
  if (!Number.isFinite(top) || top <= 0 || height <= 0 || viewportHeight <= 0) {
    return fallbackOffsetPx;
  }
  const dockTop = Math.max(0, viewportHeight - runtimeDockHeightPx);
  const toggleProtrusionPx = Math.max(0, dockTop - top);
  return Math.max(fallbackOffsetPx, Math.ceil(toggleProtrusionPx + fallbackOffsetPx));
}

function getFloatingMenuViewportBounds(viewportWidth, viewportHeight) {
  const viewportPadding = 8;
  const fallbackBounds = {
    left: viewportPadding,
    top: viewportPadding,
    right: Math.max(viewportPadding, viewportWidth - viewportPadding),
    bottom: Math.max(viewportPadding, viewportHeight - viewportPadding),
  };
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return fallbackBounds;
  }
  const runtimeTopbarHeightPx = Math.max(0, readRootCssNumberVariable("--ui-runtime-topbar-height-px", 0));
  const runtimeDockHeightPx = Math.max(0, readRootCssNumberVariable("--ui-runtime-dock-height-px", 0));
  const top = Math.max(viewportPadding, Math.ceil(runtimeTopbarHeightPx + viewportPadding));
  const bottom = Math.max(
    top,
    Math.min(
      viewportHeight - viewportPadding,
      viewportHeight - Math.ceil(runtimeDockHeightPx + viewportPadding),
    ),
  );
  const usableHeight = bottom - top;
  if (usableHeight < Math.min(96, viewportHeight * 0.25)) {
    return fallbackBounds;
  }
  return {
    left: viewportPadding,
    top,
    right: fallbackBounds.right,
    bottom,
  };
}

function clearResponsiveFloatingMenuPosition(menuEl) {
  if (!isStylableUiElement(menuEl)) {
    return;
  }
  menuEl.classList.remove("is-mobile-bottom-sheet");
  menuEl.classList.remove("is-centered-modal");
  menuEl.style.removeProperty("--context-sheet-max-width");
  menuEl.style.removeProperty("--context-sheet-bottom-offset-px");
  menuEl.style.removeProperty("--context-modal-max-width");
  menuEl.style.removeProperty("right");
  menuEl.style.removeProperty("bottom");
}

function positionBottomSheetElement(menuEl, options = {}) {
  if (!isStylableUiElement(menuEl)) {
    return;
  }
  const defaultBottomOffsetPx = Math.max(0, readRootCssNumberVariable("--ui-mobile-bottom-offset-px", 12));
  const maxWidthPx = Math.max(220, Number(options?.maxWidthPx || 0) || 0);
  const bottomOffsetPx = Math.max(0, Number(options?.bottomOffsetPx || defaultBottomOffsetPx) || defaultBottomOffsetPx);
  menuEl.classList.add("is-mobile-bottom-sheet");
  menuEl.style.removeProperty("left");
  menuEl.style.removeProperty("right");
  menuEl.style.removeProperty("top");
  menuEl.style.setProperty("--context-sheet-max-width", `${Math.round(maxWidthPx)}px`);
  menuEl.style.setProperty("--context-sheet-bottom-offset-px", `${Math.round(bottomOffsetPx)}px`);
  menuEl.style.left = "50%";
  menuEl.style.top = "auto";
}

function positionCenteredModalElement(menuEl, options = {}) {
  if (!isStylableUiElement(menuEl)) {
    return;
  }
  const maxWidthPx = Math.max(300, Number(options?.maxWidthPx || 0) || 0);
  clearResponsiveFloatingMenuPosition(menuEl);
  menuEl.classList.add("is-centered-modal");
  menuEl.style.setProperty("--context-modal-max-width", `${Math.round(maxWidthPx)}px`);
  menuEl.style.removeProperty("right");
  menuEl.style.removeProperty("bottom");
  menuEl.style.left = "50%";
  menuEl.style.top = "50%";
}

function findHoveredTeamSlot(worldX, worldY, layout, options = {}) {
  if (!layout) {
    return null;
  }
  const pointerType = getNormalizedPointerType(options?.pointerType);
  const radiusMultiplier = pointerType === "touch" ? 0.46 : 0.34;
  const renderScale = clamp(getTeamSpriteScale(layout) / TEAM_SPRITE_SCALE, 1, 1.35);
  const hitRadiusScale = clamp(Math.sqrt(renderScale), 1, 1.2);
  for (let i = 0; i < state.team.length; i += 1) {
    const member = state.team[i];
    const slot = layout.teamSlots[i];
    if (!member || !slot) {
      continue;
    }
    const radius = slot.size * radiusMultiplier * hitRadiusScale;
    if (Math.hypot(worldX - slot.x, worldY - slot.y) <= radius) {
      return { slotIndex: i, member, slot };
    }
  }
  return null;
}

function findHoveredBallOverlayHitbox(worldX, worldY) {
  const hitboxes = Array.isArray(state.ui.ballOverlayHitboxes) ? state.ui.ballOverlayHitboxes : [];
  for (const hitbox of hitboxes) {
    const x = Number(hitbox?.x || 0);
    const y = Number(hitbox?.y || 0);
    const width = Number(hitbox?.width || 0);
    const height = Number(hitbox?.height || 0);
    if (width <= 0 || height <= 0) {
      continue;
    }
    if (worldX < x || worldY < y || worldX > x + width || worldY > y + height) {
      continue;
    }
    const ballType = String(hitbox?.ballType || "").toLowerCase().trim();
    if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, ballType)) {
      continue;
    }
    return hitbox;
  }
  return null;
}

function findHoveredPokemon(worldX, worldY, layout) {
  if (!layout) {
    return null;
  }

  if (state.enemy && !(state.battle && state.battle.isEnemyRespawning())) {
    const enemyRadius = getEnemySpriteRenderSize(layout, layout.enemySize) * 0.38;
    if (Math.hypot(worldX - layout.centerX, worldY - layout.centerY) <= enemyRadius) {
      return state.enemy;
    }
  }

  return findHoveredTeamSlot(worldX, worldY, layout)?.member || null;
}

function buildHoverPopupMetricMarkup(label, value, detail = "", toneClass = "") {
  return [
    `<div class="pokemon-info-micro hover-popup-metric${toneClass ? ` ${toneClass}` : ""}">`,
    `<span class="pokemon-info-micro-label">${escapeHtml(String(label || ""))}</span>`,
    `<span class="pokemon-info-micro-value">${escapeHtml(String(value || ""))}</span>`,
    detail
      ? `<span class="hover-popup-metric-detail">${escapeHtml(String(detail || ""))}</span>`
      : ``,
    `</div>`,
  ].join("");
}

function buildHoverPopupProgressStatMarkup(label, total, detail = "", toneClass = "") {
  return [
    `<div class="hover-popup-progress-stat${toneClass ? ` ${toneClass}` : ""}">`,
    `<span class="hover-popup-progress-stat-label">${escapeHtml(String(label || ""))}</span>`,
    `<span class="hover-popup-progress-stat-total">${escapeHtml(String(total || ""))}</span>`,
    detail
      ? `<span class="hover-popup-progress-stat-detail">${escapeHtml(String(detail || ""))}</span>`
      : ``,
    `</div>`,
  ].join("");
}

function formatHoverPopupCountBreakdown(normalCount, shinyCount, ultraCount = 0) {
  const parts = [`N ${formatCompactNumber(Math.max(0, toSafeInt(normalCount, 0)))}`];
  const shinyValue = Math.max(0, toSafeInt(shinyCount, 0));
  const ultraValue = Math.max(0, toSafeInt(ultraCount, 0));
  if (shinyValue > 0) {
    parts.push(`S ${formatCompactNumber(shinyValue)}`);
  }
  if (ultraValue > 0) {
    parts.push(`U ${formatCompactNumber(ultraValue)}`);
  }
  return parts.join(" · ");
}

function formatHoverPopupMultiplier(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  const rounded = Math.round(numeric * 100) / 100;
  const formatted = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(rounded >= 10 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  return `x${formatted}`;
}

function formatHoverPopupPercent(percentValue) {
  const numeric = Number(percentValue);
  if (!Number.isFinite(numeric)) {
    return "-";
  }
  const rounded = Math.round(numeric * 10) / 10;
  const formatted = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(/\.0$/, "");
  return `${rounded > 0 ? "+" : ""}${formatted}%`;
}

function formatHoverPopupEffectivenessLabel(multiplier) {
  const numeric = Number(multiplier);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "aucun effet";
  }
  if (numeric >= 1.75) {
    return "très efficace";
  }
  if (numeric > 1.01) {
    return "avantage";
  }
  if (numeric <= 0.26) {
    return "très résisté";
  }
  if (numeric < 0.99) {
    return "résisté";
  }
  return "neutre";
}

function getHoverPopupPassivePillLabel(passiveBehaviorId) {
  switch (String(passiveBehaviorId || "").trim().toUpperCase()) {
    case "TEAM_AURA_ATTACK":
      return "Aura d'équipe";
    case "TELEPORT_SWAP":
      return "Téléport";
    case "NO_ATTACK":
      return "Pacifiste";
    default:
      return "";
  }
}

function getHoverPopupPassiveDescription(talent, passiveBehaviorId, options = {}) {
  const safeDefaultDescription = String(TALENT_NONE_DESCRIPTION_FR || "").trim();
  const rawDescription = String(talent?.descriptionFr || "").trim();
  const normalizedBehaviorId = String(passiveBehaviorId || "").trim().toUpperCase();
  if (normalizedBehaviorId === "NO_ATTACK") {
    return "N'attaque pas pendant le combat.";
  }
  if (normalizedBehaviorId === "TEAM_AURA_ATTACK" && Number(options.teamAuraAttackBonusPct || 0) > 0.05) {
    return `Bonus d'équipe ${formatHoverPopupPercent(options.teamAuraAttackBonusPct)} d'attaque.`;
  }
  if (normalizedBehaviorId === "TELEPORT_SWAP" && Number(options.teleportDamageBoostMultiplier || 1) > 1.001) {
    return `Téléport chargé: ${formatHoverPopupMultiplier(options.teleportDamageBoostMultiplier)} dégâts.`;
  }
  if (!rawDescription || rawDescription === safeDefaultDescription) {
    return "";
  }
  return rawDescription;
}

function showHoverPopup(entity, clientX, clientY) {
  if (!entity) {
    hideHoverPopup();
    return;
  }

  const stats = getSpeciesStatsSummary(entity.id);
  const teamIndex = state.team.findIndex((member) => member === entity);
  const isTeamMember = teamIndex >= 0;
  const isEnemy = entity === state.enemy || !isTeamMember;
  const isUltraShiny = Boolean(entity.isUltraShiny || entity.isUltraShinyVisual);
  const isShiny = isUltraShiny || Boolean(entity.isShiny || entity.isShinyVisual);
  const talent = resolveTalentDefinition(entity?.talent, entity?.id);
  const passiveBehaviorId = getPassiveBehaviorIdForTalentId(talent.id);
  const safeDisplayName = escapeHtml(String(entity?.nameFr || ""));
  const levelLabel = formatCompactNumber(Math.max(1, toSafeInt(entity?.level, 1)));
  const levelValue = Math.max(1, toSafeInt(entity?.level, 1));
  const speciesLabel = `#${String(Math.max(0, toSafeInt(entity?.id, 0))).padStart(3, "0")}`;
  const safeSpeciesLabel = escapeHtml(speciesLabel);
  const roleLabel = normalizeUiDisplayText(
    isTeamMember ? `Équipe • Slot ${teamIndex + 1}` : "Adversaire",
    { frenchTypography: true },
  );
  const subtitleLabel = normalizeUiDisplayText(`${speciesLabel} • ${roleLabel}`, { frenchTypography: true });
  const attackModeLabel = formatPokemonAttackModeLabelFr(entity?.attackMode, isEnemy ? "projectile" : "");
  const talentLabelPlain = formatTalentLabelFr(talent, entity?.id);
  const safeTalentLabel = escapeHtml(talentLabelPlain);
  const hpCurrent = Math.max(0, toSafeInt(entity?.hpCurrent, 0));
  const hpMax = Math.max(hpCurrent, toSafeInt(entity?.hpMax, 0));
  const hasHpMetric = hpMax > 0;
  const teamAuraAttackBonusBySlot = isTeamMember ? getTeamAuraAttackBonusBySlot(state.team) : [];
  const teamAuraAttackBonusRatio = isTeamMember
    ? Math.max(0, Number(teamAuraAttackBonusBySlot?.[teamIndex] || 0))
    : 0;
  const teleportDamageBoostMultiplier = isTeamMember && state.battle
    ? Math.max(1, Number(state.battle.getTeleportDamageBoostForSlot(teamIndex) || 1))
    : 1;
  const offensiveType = isTeamMember
    ? normalizeType(entity?.offensiveType || entity?.defensiveTypes?.[0] || "normal") || "normal"
    : null;
  const enemyDefensiveTypes = Array.isArray(state.enemy?.defensiveTypes) ? state.enemy.defensiveTypes : [];
  const typeMultiplierVsEnemy = isTeamMember && enemyDefensiveTypes.length > 0
    ? Number(getTypeMultiplier(offensiveType, enemyDefensiveTypes))
    : null;
  const passiveDescription = getHoverPopupPassiveDescription(talent, passiveBehaviorId, {
    teamAuraAttackBonusPct: teamAuraAttackBonusRatio * 100,
    teleportDamageBoostMultiplier,
  });
  const passivePillLabel = getHoverPopupPassivePillLabel(passiveBehaviorId);
  const badgeMarkup = [
    `<span class="pokemon-info-badge is-active">Niv. ${escapeHtml(String(levelLabel || ""))}</span>`,
    `<span class="pokemon-info-badge hover-popup-badge--mode">${escapeHtml(String(attackModeLabel || ""))}</span>`,
  ];
  const badgeLabels = [
    `Niv. ${String(levelLabel || "").trim()}`,
    String(attackModeLabel || "").trim(),
  ];
  if (isUltraShiny) {
    badgeMarkup.push(`<span class="pokemon-info-badge pokemon-info-badge--ultra is-active">Ultra shiny</span>`);
    badgeLabels.push("Ultra shiny");
  } else if (isShiny) {
    badgeMarkup.push(`<span class="pokemon-info-badge is-active">Shiny</span>`);
    badgeLabels.push("Shiny");
  }

  const typeSummaryMarkup = isTeamMember
    ? buildPokemonTypeSummaryMarkup(entity?.defensiveTypes, offensiveType)
    : `<div class="pokemon-info-type-grid hover-popup-type-grid--single">${buildPokemonTypeGroupMarkup("Défensif", entity?.defensiveTypes, "normal")}</div>`;

  const defensiveTypesLabel = formatTypeListFr(entity?.defensiveTypes, "normal");
  const offensiveTypeLabel = isTeamMember ? formatTypeLabelFr(offensiveType) : "";
  const typeSummaryText = isTeamMember
    ? `Déf. ${defensiveTypesLabel} • Off. ${offensiveTypeLabel}`
    : `Déf. ${defensiveTypesLabel}`;

  const liveMetricsMarkup = [];
  const liveMetricsModel = [];
  if (hasHpMetric) {
    const hpRatio = hpMax > 0 ? clamp(hpCurrent / hpMax, 0, 1) : 0;
    const hpDetailLabel = hpRatio >= 0.999 ? "plein" : `${Math.round(hpRatio * 100)}% restants`;
    const hpToneClass = hpRatio <= 0.35 ? " hover-popup-metric--danger" : hpRatio <= 0.65 ? " hover-popup-metric--warn" : "";
    liveMetricsMarkup.push(
      buildHoverPopupMetricMarkup(
        "PV",
        `${formatCompactNumber(hpCurrent)}/${formatCompactNumber(hpMax)}`,
        hpDetailLabel,
        hpToneClass,
      ),
    );
    liveMetricsModel.push({
      label: "PV",
      value: `${formatCompactNumber(hpCurrent)}/${formatCompactNumber(hpMax)}`,
      detail: hpDetailLabel,
      tone: hpToneClass.includes("danger") ? "danger" : hpToneClass.includes("warn") ? "warn" : "",
    });
  }
  if (isTeamMember) {
    const xpCurrent = Math.max(0, toSafeInt(entity?.xp, 0));
    const xpToNext = Math.max(1, toSafeInt(entity?.xpToNext, 1));
    const xpValue = levelValue >= MAX_LEVEL
      ? "Max"
      : `${formatCompactNumber(xpCurrent)}/${formatCompactNumber(xpToNext)}`;
    const xpDetail = levelValue >= MAX_LEVEL ? "niveau max" : `vers niv. ${Math.min(MAX_LEVEL, levelValue + 1)}`;
    liveMetricsMarkup.push(
      buildHoverPopupMetricMarkup(
        "XP",
        xpValue,
        xpDetail,
        " pokemon-info-micro--accent",
      ),
    );
    liveMetricsModel.push({
      label: "XP",
      value: xpValue,
      detail: xpDetail,
      tone: "accent",
    });
    if (Number.isFinite(typeMultiplierVsEnemy)) {
      const matchupValue = formatHoverPopupMultiplier(typeMultiplierVsEnemy);
      const matchupDetail = formatHoverPopupEffectivenessLabel(typeMultiplierVsEnemy);
      liveMetricsMarkup.push(
        buildHoverPopupMetricMarkup(
          "Matchup",
          matchupValue,
          matchupDetail,
          typeMultiplierVsEnemy > 1.01
            ? " pokemon-info-micro--accent"
            : typeMultiplierVsEnemy < 0.99
              ? " hover-popup-metric--weak"
              : "",
        ),
      );
      liveMetricsModel.push({
        label: "Matchup",
        value: matchupValue,
        detail: matchupDetail,
        tone: typeMultiplierVsEnemy > 1.01 ? "accent" : typeMultiplierVsEnemy < 0.99 ? "weak" : "",
      });
    }
    if (teamAuraAttackBonusRatio > 0.001) {
      const auraValue = formatHoverPopupPercent(teamAuraAttackBonusRatio * 100);
      liveMetricsMarkup.push(
        buildHoverPopupMetricMarkup(
          "Aura",
          auraValue,
          "attaque équipe",
          " pokemon-info-micro--accent",
        ),
      );
      liveMetricsModel.push({
        label: "Aura",
        value: auraValue,
        detail: "attaque équipe",
        tone: "accent",
      });
    }
    if (teleportDamageBoostMultiplier > 1.001) {
      const teleportValue = formatHoverPopupMultiplier(teleportDamageBoostMultiplier);
      liveMetricsMarkup.push(
        buildHoverPopupMetricMarkup(
          "Téléport",
          teleportValue,
          "prochain tir",
          " pokemon-info-micro--accent",
        ),
      );
      liveMetricsModel.push({
        label: "Téléport",
        value: teleportValue,
        detail: "prochain tir",
        tone: "accent",
      });
    }
  } else {
    const balanceTeamSize = Math.max(1, toSafeInt(entity?.balanceTeamSize, 1));
    const balanceHpMultiplier = Math.max(1, Number(entity?.balanceHpMultiplier || 1));
    const balanceRewardMultiplier = Math.max(1, Number(entity?.balanceRewardMultiplier || 1));
    liveMetricsMarkup.push(
      buildHoverPopupMetricMarkup("Groupe", formatCompactNumber(balanceTeamSize), "slots visés"),
    );
    liveMetricsModel.push({
      label: "Groupe",
      value: formatCompactNumber(balanceTeamSize),
      detail: "slots visés",
      tone: "",
    });
    if (balanceHpMultiplier > 1.001) {
      const hpBonusValue = formatHoverPopupMultiplier(balanceHpMultiplier);
      liveMetricsMarkup.push(
        buildHoverPopupMetricMarkup("PV bonus", hpBonusValue, "échelle terrain"),
      );
      liveMetricsModel.push({
        label: "PV bonus",
        value: hpBonusValue,
        detail: "échelle terrain",
        tone: "",
      });
    }
    if (balanceRewardMultiplier > 1.001) {
      const rewardValue = formatHoverPopupMultiplier(balanceRewardMultiplier);
      liveMetricsMarkup.push(
        buildHoverPopupMetricMarkup(
          "Butin",
          rewardValue,
          "récompense",
          " pokemon-info-micro--accent",
        ),
      );
      liveMetricsModel.push({
        label: "Butin",
        value: rewardValue,
        detail: "récompense",
        tone: "accent",
      });
    }
  }

  const progressionModel = [
    {
      label: "Vu",
      value: formatCompactNumber(
        Math.max(0, toSafeInt(stats.encountered_total, 0)) + Math.max(0, toSafeInt(stats.encountered_ultra_shiny, 0)),
      ),
      detail: formatHoverPopupCountBreakdown(
        stats.encountered_normal,
        stats.encountered_shiny,
        stats.encountered_ultra_shiny,
      ),
      tone: "",
    },
    {
      label: "KO",
      value: formatCompactNumber(
        Math.max(0, toSafeInt(stats.defeated_total, 0)) + Math.max(0, toSafeInt(stats.defeated_ultra_shiny, 0)),
      ),
      detail: formatHoverPopupCountBreakdown(
        stats.defeated_normal,
        stats.defeated_shiny,
        stats.defeated_ultra_shiny,
      ),
      tone: "",
    },
    {
      label: "Capt.",
      value: formatCompactNumber(
        Math.max(0, toSafeInt(stats.captured_total, 0)) + Math.max(0, toSafeInt(stats.captured_ultra_shiny, 0)),
      ),
      detail: formatHoverPopupCountBreakdown(
        stats.captured_normal,
        stats.captured_shiny,
        stats.captured_ultra_shiny,
      ),
      tone: "accent",
    },
  ];
  const progressionMarkup = [
    buildHoverPopupProgressStatMarkup(
      progressionModel[0].label,
      progressionModel[0].value,
      progressionModel[0].detail,
    ),
    buildHoverPopupProgressStatMarkup(
      progressionModel[1].label,
      progressionModel[1].value,
      progressionModel[1].detail,
    ),
    buildHoverPopupProgressStatMarkup(
      progressionModel[2].label,
      progressionModel[2].value,
      progressionModel[2].detail,
      " hover-popup-progress-stat--accent",
    ),
  ].join("");

  const useMobileQuickCard = isPhoneUiViewport() && isTeamMember;
  if (useMobileQuickCard) {
    const quickMetricsMarkup = [];
    if (hasHpMetric) {
      quickMetricsMarkup.push(
        buildHoverPopupMetricMarkup(
          "PV",
          `${formatCompactNumber(hpCurrent)}/${formatCompactNumber(hpMax)}`,
          hpMax > 0 ? `${Math.round(clamp(hpCurrent / hpMax, 0, 1) * 100)}%` : "",
        ),
      );
    }
    const xpCurrent = Math.max(0, toSafeInt(entity?.xp, 0));
    const xpToNext = Math.max(1, toSafeInt(entity?.xpToNext, 1));
    quickMetricsMarkup.push(
      buildHoverPopupMetricMarkup(
        "XP",
        levelValue >= MAX_LEVEL
          ? "Max"
          : `${formatCompactNumber(xpCurrent)}/${formatCompactNumber(xpToNext)}`,
        levelValue >= MAX_LEVEL ? "niveau max" : `niv. ${Math.min(MAX_LEVEL, levelValue + 1)}`,
        " pokemon-info-micro--accent",
      ),
    );
    quickMetricsMarkup.push(
      buildHoverPopupMetricMarkup(
        "Attaque",
        attackModeLabel,
        "",
      ),
    );
    const quickTagMarkup = [];
    if (passivePillLabel) {
      quickTagMarkup.push(`<span class="hover-popup-pill">${escapeHtml(passivePillLabel)}</span>`);
    }
    if (typeSummaryMarkup) {
      quickTagMarkup.push(typeSummaryMarkup);
    }

    hoverPopupEl.innerHTML = [
      `<article class="pokemon-info-card pokemon-info-card--tooltip pokemon-info-card--quick">`,
      `<header class="pokemon-info-head">`,
      `<div class="pokemon-info-title-wrap">`,
      `<h3 class="pokemon-info-title">${safeDisplayName || safeSpeciesLabel}</h3>`,
      `<p class="pokemon-info-subtitle">${escapeHtml(subtitleLabel)}</p>`,
      `</div>`,
      `<div class="pokemon-info-badges">${badgeMarkup.join("")}</div>`,
      `</header>`,
      `<div class="hover-popup-quick-summary">`,
      quickTagMarkup.length > 0
        ? `<div class="hover-popup-quick-tags">${quickTagMarkup.join("")}</div>`
        : ``,
      safeTalentLabel
        ? `<span class="hover-popup-quick-talent">${escapeHtml(safeTalentLabel)}</span>`
        : ``,
      `</div>`,
      `<footer class="pokemon-info-micro-grid hover-popup-micro-grid hover-popup-micro-grid--quick">${quickMetricsMarkup.join("")}</footer>`,
      `</article>`,
    ].join("");

    showTooltipWithTween(hoverPopupEl);
    state.ui.canvasHoverPopupModel = null;
    syncCanvasRuntimeOverlayDomOwnership();
    positionBottomSheetElement(hoverPopupEl, {
      maxWidthPx: 360,
      bottomOffsetPx: getActionDockBottomSheetOffsetPx(),
    });
    return;
  }

  hoverPopupEl.innerHTML = [
    `<article class="pokemon-info-card pokemon-info-card--tooltip">`,
    `<header class="pokemon-info-head">`,
    `<div class="pokemon-info-title-wrap">`,
    `<h3 class="pokemon-info-title">${safeDisplayName || safeSpeciesLabel}</h3>`,
    `<p class="pokemon-info-subtitle">${escapeHtml(subtitleLabel)}</p>`,
    `</div>`,
    `<div class="pokemon-info-badges">${badgeMarkup.join("")}</div>`,
    `</header>`,
    `<div class="pokemon-info-feature-grid hover-popup-feature-grid">`,
    `<div class="hover-popup-callout">`,
    `<div class="hover-popup-callout-head">`,
    `<span class="pokemon-info-hint-label">Talent</span>`,
    passivePillLabel
      ? `<span class="hover-popup-pill">${escapeHtml(passivePillLabel)}</span>`
      : ``,
    `</div>`,
    `<span class="pokemon-info-hint-value">${safeTalentLabel}</span>`,
    passiveDescription
      ? `<span class="hover-popup-callout-meta">${escapeHtml(passiveDescription)}</span>`
      : ``,
    `</div>`,
    `<div class="pokemon-info-zone pokemon-info-zone--types">`,
    `<span class="pokemon-info-zone-label">Types</span>`,
    typeSummaryMarkup,
    `</div>`,
    `</div>`,
    `<div class="pokemon-info-micro-grid hover-popup-micro-grid">${liveMetricsMarkup.join("")}</div>`,
    `<footer class="hover-popup-progress-grid">${progressionMarkup}</footer>`,
    `</article>`,
  ].join("");

  showTooltipWithTween(hoverPopupEl);
  state.ui.canvasHoverPopupModel = isDesktopCanvasRuntimeOverlayMode()
    ? buildCanvasHoverPopupModel({
      entity,
      clientX,
      clientY,
      title: String(entity?.nameFr || ""),
      subtitle: subtitleLabel,
      badges: badgeLabels,
      passiveLabel: talentLabelPlain,
      passivePill: passivePillLabel,
      passiveDescription,
      typeSummaryText,
      metrics: liveMetricsModel,
      progress: progressionModel,
    })
    : null;
  syncCanvasRuntimeOverlayDomOwnership();
  positionFloatingMenuElement(hoverPopupEl, clientX, clientY);
}

function positionFloatingMenuElement(menuEl, clientX, clientY) {
  if (!menuEl) {
    return;
  }
  clearResponsiveFloatingMenuPosition(menuEl);
  const viewportWidth = Math.max(0, Number(window.innerWidth) || 0);
  const viewportHeight = Math.max(0, Number(window.innerHeight) || 0);
  const viewportBounds = getFloatingMenuViewportBounds(viewportWidth, viewportHeight);
  const anchorX = Number.isFinite(Number(clientX)) ? Number(clientX) : viewportWidth / 2;
  const anchorY = Number.isFinite(Number(clientY)) ? Number(clientY) : viewportHeight / 2;
  const menuRect = typeof menuEl.getBoundingClientRect === "function"
    ? menuEl.getBoundingClientRect()
    : { width: 0, height: 0 };
  let left = anchorX + 12;
  let top = anchorY + 12;
  if (left + menuRect.width > viewportBounds.right) {
    left = anchorX - menuRect.width - 12;
  }
  if (top + menuRect.height > viewportBounds.bottom) {
    top = anchorY - menuRect.height - 12;
  }
  const maxLeft = Math.max(viewportBounds.left, viewportBounds.right - menuRect.width);
  const maxTop = Math.max(viewportBounds.top, viewportBounds.bottom - menuRect.height);
  if (menuRect.width > viewportBounds.right - viewportBounds.left) {
    left = viewportBounds.left;
  }
  if (menuRect.height > viewportBounds.bottom - viewportBounds.top) {
    top = viewportBounds.top;
  }
  menuEl.style.left = `${Math.round(clamp(left, viewportBounds.left, maxLeft))}px`;
  menuEl.style.top = `${Math.round(clamp(top, viewportBounds.top, maxTop))}px`;
}

function setContextMenuButtonContent(buttonEl, title, meta = "") {
  if (!buttonEl) {
    return;
  }
  buttonEl.textContent = "";
  const copyEl = document.createElement("span");
  copyEl.className = "team-context-menu-copy";

  const titleEl = document.createElement("span");
  titleEl.className = "team-context-menu-btn-title";
  titleEl.textContent = String(title || "");
  copyEl.appendChild(titleEl);

  const metaText = String(meta || "").trim();
  if (metaText) {
    const metaEl = document.createElement("span");
    metaEl.className = "team-context-menu-btn-meta";
    metaEl.textContent = metaText;
    copyEl.appendChild(metaEl);
  }

  buttonEl.appendChild(copyEl);
}

function setBallCaptureToggleButtonState(buttonEl, label, enabled, description = "") {
  if (!buttonEl) {
    return;
  }
  const isEnabled = Boolean(enabled);
  buttonEl.disabled = false;
  buttonEl.setAttribute("aria-checked", isEnabled ? "true" : "false");
  buttonEl.setAttribute("aria-disabled", "false");
  buttonEl.classList.toggle("is-on", isEnabled);
  buttonEl.classList.remove("is-locked");
  buttonEl.textContent = "";

  const checkEl = document.createElement("span");
  checkEl.className = "ball-capture-toggle-check";
  checkEl.setAttribute("aria-hidden", "true");
  checkEl.textContent = isEnabled ? "\u2713" : "";

  const labelEl = document.createElement("span");
  labelEl.className = "ball-capture-toggle-label";
  labelEl.textContent = label;

  const copyEl = document.createElement("span");
  copyEl.className = "ball-capture-toggle-copy";
  copyEl.appendChild(labelEl);

  const descriptionText = String(description || "").trim();
  if (descriptionText) {
    const descriptionEl = document.createElement("span");
    descriptionEl.className = "ball-capture-toggle-description";
    descriptionEl.textContent = descriptionText;
    copyEl.appendChild(descriptionEl);
  }

  buttonEl.appendChild(checkEl);
  buttonEl.appendChild(copyEl);

}

function getPreferredBallCaptureMenuType(preferredBallType = "") {
  const preferredType = String(preferredBallType || "").toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, preferredType)) {
    return preferredType;
  }
  const activeType = String(getActiveBallType?.() || "").toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeType)) {
    return activeType;
  }
  for (const candidate of Array.isArray(BALL_TYPE_FALLBACK_ORDER) ? BALL_TYPE_FALLBACK_ORDER : []) {
    const type = String(candidate || "").toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
      return type;
    }
  }
  return "";
}

function setBallCaptureMenuTabButtonState(buttonEl, ballType, selected = false) {
  if (!buttonEl) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  const config = BALL_CONFIG_BY_TYPE[type] || {};
  const label = String(config.nameFr || type || "Ball");
  const count = Math.max(0, toSafeInt(getBallInventoryCount?.(type), 0));
  buttonEl.textContent = "";
  buttonEl.disabled = false;
  buttonEl.setAttribute("aria-selected", selected ? "true" : "false");
  buttonEl.setAttribute("tabindex", selected ? "0" : "-1");
  buttonEl.setAttribute("aria-label", `${label} ${count}`);
  buttonEl.classList.toggle("is-active", selected);

  const iconWrapEl = document.createElement("span");
  iconWrapEl.className = "ball-capture-menu-tab-icon-wrap";
  const spritePath = String(config.spritePath || "");
  if (spritePath) {
    const iconEl = document.createElement("img");
    iconEl.className = "ball-capture-menu-tab-icon";
    iconEl.src = spritePath;
    iconEl.alt = "";
    iconEl.setAttribute("aria-hidden", "true");
    iconWrapEl.appendChild(iconEl);
  } else {
    const fallbackEl = document.createElement("span");
    fallbackEl.className = "ball-capture-menu-tab-icon-fallback";
    fallbackEl.textContent = label.charAt(0).toUpperCase();
    fallbackEl.setAttribute("aria-hidden", "true");
    iconWrapEl.appendChild(fallbackEl);
  }

  const countEl = document.createElement("span");
  countEl.className = "ball-capture-menu-tab-count";
  countEl.textContent = formatCompactNumber(count, {
    decimalsSmall: 2,
    decimalsMedium: 1,
    decimalsLarge: 0,
  });

  buttonEl.appendChild(iconWrapEl);
  buttonEl.appendChild(countEl);
}

function setBallCaptureMenuBallType(ballType) {
  const nextType = getPreferredBallCaptureMenuType(ballType);
  if (!nextType) {
    return false;
  }
  state.ui.ballCaptureMenuBallType = nextType;
  setHoveredBallOverlayType(nextType);
  refreshBallCaptureMenu();
  syncCanvasInteractionCursor();
  return true;
}

function refreshBallCaptureMenu() {
  if (!ballCaptureMenuEl) {
    return;
  }
  const ballType = getBallCaptureMenuBallType();
  if (!ballType) {
    closeBallCaptureMenu();
    return;
  }
  const config = BALL_CONFIG_BY_TYPE[ballType];
  const rules = getBallCaptureRulesForType(ballType);
  const count = Math.max(0, toSafeInt(getBallInventoryCount?.(ballType), 0));

  if (ballCaptureMenuTitleEl) {
    ballCaptureMenuTitleEl.textContent = "R\u00e9glages capture";
  }
  if (ballCaptureMenuSummaryEl) {
    ballCaptureMenuSummaryEl.textContent = `${config.nameFr} \u2022 ${count} disponibles`;
  }

  const tabRefs = [
    { type: "poke_ball", buttonEl: ballCaptureTabPokeButtonEl },
    { type: "super_ball", buttonEl: ballCaptureTabSuperButtonEl },
    { type: "hyper_ball", buttonEl: ballCaptureTabHyperButtonEl },
  ];
  for (const tabRef of tabRefs) {
    setBallCaptureMenuTabButtonState(tabRef.buttonEl, tabRef.type, tabRef.type === ballType);
  }

  for (const definition of BALL_CAPTURE_TOGGLE_DEFINITIONS) {
    const key = definition.key;
    const enabled = Boolean(rules[key]);
    setBallCaptureToggleButtonState(definition.buttonEl, definition.label, enabled, definition.description);
  }
  const existingModel = state.ui.canvasBallCaptureMenuModel;
  state.ui.canvasBallCaptureMenuModel = isDesktopCanvasRuntimeOverlayMode()
    ? buildCanvasBallCaptureMenuModel(ballType, null, null, {
      anchorX: existingModel?.anchorX,
      anchorY: existingModel?.anchorY,
    })
    : null;
  syncCanvasRuntimeOverlayDomOwnership();
}

function openBallCaptureMenu(ballType, clientX, clientY) {
  if (!ballCaptureMenuEl) {
    return;
  }
  const type = getPreferredBallCaptureMenuType(ballType);
  if (!type) {
    return;
  }
  closeTeamContextMenu();
  state.ui.ballCaptureMenuOpen = true;
  state.ui.ballCaptureMenuBallType = type;
  setBallCaptureMenuBallType(type);
  setHoveredTeamSlotIndex(-1);
  hideHoverPopup();
  state.ui.canvasBallCaptureMenuModel = isDesktopCanvasRuntimeOverlayMode()
    ? buildCanvasBallCaptureMenuModel(type, clientX, clientY)
    : null;
  syncCanvasRuntimeOverlayDomOwnership();
  showPopupWithTween(ballCaptureMenuEl);
  positionCenteredModalElement(ballCaptureMenuEl, {
    maxWidthPx: isPhoneUiViewport() ? 420 : 460,
  });
}

function openTopbarBallCaptureMenu(preferredBallType = "") {
  const viewportWidth = Math.max(0, Number(window?.innerWidth) || 0);
  const viewportHeight = Math.max(0, Number(window?.innerHeight) || 0);
  openBallCaptureMenu(
    getPreferredBallCaptureMenuType(preferredBallType),
    viewportWidth * 0.5,
    viewportHeight * 0.5,
  );
}

function toggleBallCaptureRule(ruleKey) {
  const ballType = getBallCaptureMenuBallType();
  if (!ballType) {
    return;
  }
  const key = String(ruleKey || "");
  if (!BALL_CAPTURE_TOGGLE_DEFINITIONS.some((definition) => definition.key === key)) {
    return;
  }
  const currentRules = getBallCaptureRulesForType(ballType);
  let nextRules = { ...currentRules };
  if (key === BALL_CAPTURE_RULE_CAPTURE_ALL) {
    const nextCaptureAll = !Boolean(currentRules[BALL_CAPTURE_RULE_CAPTURE_ALL]);
    nextRules[BALL_CAPTURE_RULE_CAPTURE_ALL] = nextCaptureAll;
    if (nextCaptureAll) {
      nextRules[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] = true;
      nextRules[BALL_CAPTURE_RULE_CAPTURE_OWNED] = true;
      nextRules[BALL_CAPTURE_RULE_CAPTURE_SHINY] = true;
      nextRules[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY] = true;
    }
  } else {
    nextRules[BALL_CAPTURE_RULE_CAPTURE_ALL] = false;
    nextRules[key] = !Boolean(currentRules[key]);
    const allSubRulesEnabled =
      Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_UNOWNED])
      && Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_OWNED])
      && Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_SHINY])
      && Boolean(nextRules[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]);
    if (allSubRulesEnabled) {
      nextRules[BALL_CAPTURE_RULE_CAPTURE_ALL] = true;
    }
  }

  const changed = setBallCaptureRulesForType(ballType, nextRules);
  refreshBallCaptureMenu();
  if (!changed) {
    return;
  }
  persistSaveData();
  render();
}

function refreshTeamContextMenu() {
  if (!teamContextMenuEl) {
    return;
  }
  const slotIndex = clamp(toSafeInt(state.ui.teamContextMenuSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const pokemonId = Number(state.ui.teamContextMenuPokemonId || 0);
  const member = pokemonId > 0 ? state.team[slotIndex] || state.pokemonDefsById.get(pokemonId) : null;
  const name = member?.nameFr || getPokemonDisplayNameById(pokemonId);
  const appearanceUnlocked = isAppearanceEditorUnlocked();
  const boxesAccess = getTeamBoxesAccessState();
  const hasNickname = Boolean(getPokemonNicknameById(pokemonId));

  if (teamContextMenuTitleEl) {
    teamContextMenuTitleEl.textContent = `${name} \u2022 ${getTeamSlotLabel(slotIndex)}`;
  }
  if (teamContextMenuRenameButtonEl) {
    teamContextMenuRenameButtonEl.disabled = slotIndex < 0 || pokemonId <= 0;
    setContextMenuButtonContent(
      teamContextMenuRenameButtonEl,
      hasNickname ? "G\u00e9rer le surnom" : "Ajouter un surnom",
      "Applique le changement \u00e0 la famille \u00e9volutive.",
    );
  }
  if (teamContextMenuBoxesButtonEl) {
    teamContextMenuBoxesButtonEl.disabled = slotIndex < 0 || pokemonId <= 0 || !boxesAccess.allowed;
    setContextMenuButtonContent(
      teamContextMenuBoxesButtonEl,
      boxesAccess.allowed ? "\u00c9changer avec la bo\u00eete" : "Bo\u00eete verrouill\u00e9e",
      boxesAccess.allowed ? "Choisir un rempla\u00e7ant pour ce slot." : "Disponible plus tard dans la progression.",
    );
  }
  if (teamContextMenuAppearanceButtonEl) {
    teamContextMenuAppearanceButtonEl.disabled = slotIndex < 0 || pokemonId <= 0 || !appearanceUnlocked;
    setContextMenuButtonContent(
      teamContextMenuAppearanceButtonEl,
      appearanceUnlocked ? "Changer l'apparence" : "Apparence verrouill\u00e9e",
      appearanceUnlocked ? "\u00c9quipe un sprite d\u00e9j\u00e0 d\u00e9bloqu\u00e9." : `D\u00e9bloque au niv. ${APPEARANCE_UNLOCK_LEVEL}.`,
    );
  }
  const existingModel = state.ui.canvasTeamContextMenuModel;
  state.ui.canvasTeamContextMenuModel = isDesktopCanvasRuntimeOverlayMode() && member
    ? buildCanvasTeamContextMenuModel(slotIndex, member, null, null, {
      anchorX: existingModel?.anchorX,
      anchorY: existingModel?.anchorY,
    })
    : null;
  syncCanvasRuntimeOverlayDomOwnership();
}

function openTeamContextMenu(slotIndex, member, clientX, clientY) {
  if (!teamContextMenuEl || !member) {
    return;
  }
  closeBallCaptureMenu();
  if (state.ui.renameOpen) {
    closeRenameModal();
  }
  state.ui.teamContextMenuOpen = true;
  state.ui.teamContextMenuSlotIndex = clamp(toSafeInt(slotIndex, -1), 0, MAX_TEAM_SIZE - 1);
  state.ui.teamContextMenuPokemonId = Number(member.id || 0);
  setHoveredTeamSlotIndex(slotIndex);
  hideHoverPopup();
  refreshTeamContextMenu();
  state.ui.canvasTeamContextMenuModel = isDesktopCanvasRuntimeOverlayMode()
    ? buildCanvasTeamContextMenuModel(slotIndex, member, clientX, clientY)
    : null;
  syncCanvasRuntimeOverlayDomOwnership();

  showPopupWithTween(teamContextMenuEl);
  if (isPhoneUiViewport()) {
    positionBottomSheetElement(teamContextMenuEl, {
      maxWidthPx: 420,
      bottomOffsetPx: getActionDockBottomSheetOffsetPx(),
    });
  } else {
    positionFloatingMenuElement(teamContextMenuEl, clientX, clientY);
  }
}

function getTeamSlotLabel(slotIndex) {
  const index = Math.max(0, toSafeInt(slotIndex, 0));
  return "slot " + String(index + 1);
}

function getPokemonDisplayNameById(pokemonId) {
  const id = Number(pokemonId);
  return state.pokemonDefsById.get(id)?.nameFr || "Pokemon " + String(id);
}

function getTrainerBattleTeamSizeCount() {
  return Math.max(1, toSafeInt(TRAINER_BATTLE_TEAM_SIZE_COUNT, 3));
}

function getTrainerBattleSelectedTeamIds() {
  const teamSize = getTrainerBattleTeamSizeCount();
  if (!state.trainerBattle || typeof state.trainerBattle !== "object") {
    state.trainerBattle = {};
  }
  const rawTeamIds = Array.isArray(state.trainerBattle.selectedTeamIds)
    ? state.trainerBattle.selectedTeamIds
    : [];
  const normalized = Array.from({ length: teamSize }, (_, index) => {
    const pokemonId = Number(rawTeamIds[index] || 0);
    return pokemonId > 0 ? pokemonId : 0;
  });
  state.trainerBattle.selectedTeamIds = normalized.slice();
  return normalized;
}

function findFamilyConflictSlotIndexInTeamIds(teamIds, candidatePokemonId, ignoredSlotIndex = -1) {
  const candidateId = Number(candidatePokemonId || 0);
  if (candidateId <= 0 || !Array.isArray(teamIds)) {
    return -1;
  }
  const ignoredIndex = toSafeInt(ignoredSlotIndex, -1);
  const familyIds = getEvolutionFamilySpeciesIds(candidateId);
  const familyIdSet = new Set(
    (familyIds.length > 0 ? familyIds : [candidateId])
      .map((id) => Number(id || 0))
      .filter((id) => id > 0),
  );
  for (let index = 0; index < teamIds.length; index += 1) {
    if (index === ignoredIndex) {
      continue;
    }
    const teamPokemonId = Number(teamIds[index] || 0);
    if (teamPokemonId > 0 && familyIdSet.has(teamPokemonId)) {
      return index;
    }
  }
  return -1;
}

function findTeamFamilyConflictSlotIndex(candidatePokemonId, ignoredSlotIndex = -1) {
  return findFamilyConflictSlotIndexInTeamIds(state.saveData?.team, candidatePokemonId, ignoredSlotIndex);
}

function getCapturedEntityBoxesEntries() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return [];
  }
  const teamIds = Array.isArray(state.saveData.team) ? state.saveData.team.map((id) => Number(id)) : [];
  const entries = [];
  for (const [rawKey, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawKey || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    const capturedTotal = getCapturedTotal(record);
    const def = state.pokemonDefsById.get(pokemonId);
    const level = clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL);
    const baseStats = normalizeStatsPayload(record.base_stats || def?.stats || {});
    const stats = normalizeStatsPayload(record.stats || computeStatsAtLevel(baseStats, level));
    const encounteredNormal = Math.max(0, toSafeInt(record.encountered_normal, 0));
    const encounteredShiny = Math.max(0, toSafeInt(record.encountered_shiny, 0));
    const defeatedNormal = Math.max(0, toSafeInt(record.defeated_normal, 0));
    const defeatedShiny = Math.max(0, toSafeInt(record.defeated_shiny, 0));
    const capturedNormal = Math.max(0, toSafeInt(record.captured_normal, 0));
    const capturedShiny = Math.max(0, toSafeInt(record.captured_shiny, 0));
    const capturedUltraShiny = Math.max(0, toSafeInt(record.captured_ultra_shiny, 0));
    const shinyModeUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
    const ultraShinyModeUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);
    const appearance = resolveSpriteAppearanceForEntity(pokemonId);
    const talent = resolveTalentDefinition(record?.talent, pokemonId);
    const baseNameFr = def?.nameFr || "Pokemon " + String(pokemonId);
    const nickname = sanitizePokemonNickname(record?.nickname);
    const displayNameFr = nickname || baseNameFr;

    entries.push({
      id: pokemonId,
      nameFr: displayNameFr,
      baseNameFr,
      nickname,
      hasCustomName: Boolean(nickname),
      usableInTeam: Boolean(def),
      level,
      xp: Math.max(0, toSafeInt(record.xp, 0)),
      xpToNext: getXpToNextLevelForSpecies(pokemonId, level, baseStats),
      defensiveTypes: Array.isArray(def?.defensiveTypes) ? def.defensiveTypes : ["normal"],
      offensiveType: def?.offensiveType || "normal",
      attackMode: normalizePokemonAttackMode(def?.attackMode || record?.attack_mode || record?.attackMode),
      spritePath: appearance.spritePath || def?.spritePath || "",
      stats,
      baseStats,
      encounteredNormal,
      encounteredShiny,
      defeatedNormal,
      defeatedShiny,
      capturedNormal,
      capturedShiny,
      capturedUltraShiny,
      talent,
      spriteVariantId: appearance.variant?.id || null,
      shinyVisual: appearance.shinyVisual,
      shinyNegativeFallbackVisual: appearance.shinyNegativeFallbackVisual,
      ultraShinyVisual: appearance.ultraShinyVisual,
      shinyModeUnlocked,
      ultraShinyModeUnlocked,
      encounteredTotal: encounteredNormal + encounteredShiny,
      defeatedTotal: defeatedNormal + defeatedShiny,
      capturedTotal: capturedNormal + capturedShiny,
      inTeamIndex: teamIds.indexOf(pokemonId),
    });
  }
  entries.sort((a, b) => a.id - b.id);
  return entries;
}

function getCapturedEntityCount() {
  return getCapturedEntityBoxesEntries().length;
}

function getTotalShinyCapturesGlobal() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return 0;
  }
  let total = 0;
  for (const [rawKey, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawKey || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    total += Math.max(0, toSafeInt(record.captured_shiny, 0));
  }
  return total;
}

function levelUpAllOwnedPokemonFromDev() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    setTopMessage("Boost dev: aucun Pokemon a monter.", 1700);
    return { leveledCount: 0, queuedEvolutionCount: 0, teamLevelUps: [] };
  }

  const teamSlotIndexByPokemonId = new Map();
  const teamIds = Array.isArray(state.saveData.team) ? state.saveData.team : [];
  for (let slotIndex = 0; slotIndex < teamIds.length; slotIndex += 1) {
    const pokemonId = Number(teamIds[slotIndex] || 0);
    if (pokemonId > 0 && !teamSlotIndexByPokemonId.has(pokemonId)) {
      teamSlotIndexByPokemonId.set(pokemonId, slotIndex);
    }
  }

  let leveledCount = 0;
  let queuedEvolutionCount = 0;
  let unlockedAppearanceNow = false;
  const teamLevelUps = [];

  for (const [rawId, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }

    const record = getPokemonEntityRecord(pokemonId) || rawRecord;
    if (!record || !isEntityUnlocked(record)) {
      continue;
    }

    const beforeLevel = clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL);
    if (beforeLevel >= MAX_LEVEL) {
      continue;
    }

    const nextLevel = Math.min(MAX_LEVEL, beforeLevel + 1);
    setEntityLevel(record, nextLevel);
    leveledCount += 1;

    if (beforeLevel < APPEARANCE_UNLOCK_LEVEL && nextLevel >= APPEARANCE_UNLOCK_LEVEL) {
      unlockedAppearanceNow = true;
    }

    const slotIndex = teamSlotIndexByPokemonId.get(pokemonId);
    if (slotIndex >= 0) {
      teamLevelUps.push({
        id: pokemonId,
        nameFr: getPokemonDisplayNameById(pokemonId),
        fromLevel: beforeLevel,
        toLevel: nextLevel,
        slotIndex,
      });
    }

    const evolutionCandidate = findNextEligibleEvolution(record);
    if (!evolutionCandidate) {
      continue;
    }
    const fromNameFr = evolutionCandidate.fromDef?.nameFr || getPokemonDisplayNameById(evolutionCandidate.fromId);
    const toNameFr = evolutionCandidate.toDef?.nameFr || getPokemonDisplayNameById(evolutionCandidate.toId);
    const queuedId = enqueueEvolutionReadyNotification({
      fromId: evolutionCandidate.fromId,
      toId: evolutionCandidate.toId,
      fromNameFr,
      toNameFr,
      teamSlotIndex: slotIndex ?? -1,
    });
    if (queuedId) {
      queuedEvolutionCount += 1;
    }
  }

  if (leveledCount <= 0) {
    setTopMessage("Boost dev: tous les Pokemon sont deja au niveau max.", 1800);
    return { leveledCount: 0, queuedEvolutionCount: 0, teamLevelUps: [] };
  }

  if (unlockedAppearanceNow) {
    ensureAppearanceEditorUnlockedFromProgress();
  }
  if (teamLevelUps.length > 0) {
    queueTeamLevelUpEffects(teamLevelUps);
  }

  rebuildTeamAndSyncBattle();
  if (!state.simulationIdleMode) {
    updateHud();
  }
  if (state.ui?.boxesOpen) {
    renderBoxesGrid();
  }
  if (state.ui?.pokedexOpen) {
    renderPokedexGrid();
  }
  persistSaveData();
  render();

  const evolutionSuffix = queuedEvolutionCount > 0
    ? ` ${queuedEvolutionCount} evolution${queuedEvolutionCount > 1 ? "s" : ""} prete${queuedEvolutionCount > 1 ? "s" : ""}.`
    : "";
  setTopMessage(`Boost dev: +1 niveau pour ${leveledCount} Pokemon.${evolutionSuffix}`, 2200);

  return {
    leveledCount,
    queuedEvolutionCount,
    teamLevelUps,
  };
}

function sanitizeCollectionSearchQuery(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeCollectionSearchValue(value) {
  const normalized = normalizeUiDisplayText(String(value || ""), {
    frenchTypography: true,
  })
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return normalized.replace(/\s+/g, " ");
}

function getCollectionSearchTokens(value) {
  const normalized = normalizeCollectionSearchValue(value);
  return normalized ? normalized.split(" ") : [];
}

function doesCollectionSearchMatch(haystackParts, query) {
  const tokens = getCollectionSearchTokens(query);
  if (tokens.length <= 0) {
    return true;
  }
  const haystack = normalizeCollectionSearchValue(
    Array.isArray(haystackParts) ? haystackParts.filter(Boolean).join(" ") : String(haystackParts || ""),
  );
  return tokens.every((token) => haystack.includes(token));
}

function syncBoxesSearchInputValue() {
  if (!boxesSearchInputEl || typeof boxesSearchInputEl.value !== "string") {
    return;
  }
  const nextValue = String(state.ui?.boxesSearchQuery || "");
  if (boxesSearchInputEl.value !== nextValue) {
    boxesSearchInputEl.value = nextValue;
  }
}

function syncPokedexSearchInputValue() {
  if (!pokedexSearchInputEl || typeof pokedexSearchInputEl.value !== "string") {
    return;
  }
  const nextValue = String(state.ui?.pokedexSearchQuery || "");
  if (pokedexSearchInputEl.value !== nextValue) {
    pokedexSearchInputEl.value = nextValue;
  }
}

function clearBoxesSearchQuery() {
  if (!state.ui) {
    return;
  }
  state.ui.boxesSearchQuery = "";
  syncBoxesSearchInputValue();
}

function clearPokedexSearchQuery() {
  if (!state.ui) {
    return;
  }
  state.ui.pokedexSearchQuery = "";
  syncPokedexSearchInputValue();
}

function getFilteredBoxesEntries(entries = getCapturedEntityBoxesEntries()) {
  const query = String(state.ui?.boxesSearchQuery || "");
  if (!query.trim()) {
    return Array.isArray(entries) ? entries : [];
  }
  return (Array.isArray(entries) ? entries : []).filter((entry) => doesCollectionSearchMatch(
    [
      entry?.nameFr,
      entry?.baseNameFr,
      entry?.nickname,
      entry?.id,
      entry?.id > 0 ? String(entry.id).padStart(3, "0") : "",
    ],
    query,
  ));
}

function getFilteredPokedexEntries(entries = getPokedexEntries()) {
  const query = String(state.ui?.pokedexSearchQuery || "");
  if (!query.trim()) {
    return Array.isArray(entries) ? entries : [];
  }
  return (Array.isArray(entries) ? entries : []).filter((entry) => doesCollectionSearchMatch(
    [
      entry?.nameFr,
      entry?.nameEn,
      entry?.id,
      entry?.id > 0 ? String(entry.id).padStart(3, "0") : "",
      ...(Array.isArray(entry?.encounterZoneLabels) ? entry.encounterZoneLabels : []),
    ],
    query,
  ));
}

function bindBoxesSearchEventsIfNeeded() {
  if (!boxesSearchInputEl || boxesSearchEventsBound || typeof boxesSearchInputEl.addEventListener !== "function") {
    return;
  }
  boxesSearchInputEl.addEventListener("input", () => {
    if (!state.ui) {
      return;
    }
    state.ui.boxesSearchQuery = sanitizeCollectionSearchQuery(boxesSearchInputEl.value);
    if (boxesSearchInputEl.value !== state.ui.boxesSearchQuery) {
      boxesSearchInputEl.value = state.ui.boxesSearchQuery;
    }
    if (boxesGridEl) {
      boxesGridEl.scrollTop = 0;
    }
    renderBoxesGrid();
  });
  boxesSearchInputEl.addEventListener("keydown", (event) => {
    if (String(event?.key || "").toLowerCase() !== "escape" || !String(state.ui?.boxesSearchQuery || "").trim()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    clearBoxesSearchQuery();
    renderBoxesGrid();
  });
  boxesSearchEventsBound = true;
}

function bindPokedexSearchEventsIfNeeded() {
  if (!pokedexSearchInputEl || pokedexSearchEventsBound || typeof pokedexSearchInputEl.addEventListener !== "function") {
    return;
  }
  pokedexSearchInputEl.addEventListener("input", () => {
    if (!state.ui) {
      return;
    }
    state.ui.pokedexSearchQuery = sanitizeCollectionSearchQuery(pokedexSearchInputEl.value);
    if (pokedexSearchInputEl.value !== state.ui.pokedexSearchQuery) {
      pokedexSearchInputEl.value = state.ui.pokedexSearchQuery;
    }
    if (pokedexGridEl) {
      pokedexGridEl.scrollTop = 0;
    }
    renderPokedexGrid();
  });
  pokedexSearchInputEl.addEventListener("keydown", (event) => {
    if (String(event?.key || "").toLowerCase() !== "escape" || !String(state.ui?.pokedexSearchQuery || "").trim()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    clearPokedexSearchQuery();
    if (pokedexGridEl) {
      pokedexGridEl.scrollTop = 0;
    }
    renderPokedexGrid();
  });
  pokedexSearchEventsBound = true;
}

function cancelQueuedPokedexGridRender() {
  if (pokedexRenderRafHandle > 0) {
    window.cancelAnimationFrame(pokedexRenderRafHandle);
    pokedexRenderRafHandle = 0;
  }
}

function cancelQueuedPokedexViewportRender() {
  if (pokedexViewportRenderRafHandle > 0) {
    window.cancelAnimationFrame(pokedexViewportRenderRafHandle);
    pokedexViewportRenderRafHandle = 0;
  }
}

function invalidatePokedexEntriesCache(options = {}) {
  pokedexEntriesCacheDirty = true;
  if (options?.resetSlice) {
    pokedexVirtualLastSliceKey = "";
    pokedexVirtualLastStartIndex = 0;
    pokedexVirtualLastEndIndex = 0;
  }
}

function queuePokedexGridRender() {
  if (!state.ui.pokedexOpen || !state.saveData) {
    return;
  }
  if (pokedexRenderRafHandle > 0) {
    return;
  }
  pokedexRenderRafHandle = window.requestAnimationFrame(() => {
    pokedexRenderRafHandle = 0;
    if (!state.ui.pokedexOpen || !state.saveData) {
      return;
    }
    renderPokedexGrid();
  });
}

function queuePokedexViewportRender() {
  if (!state.ui.pokedexOpen || !state.saveData || !pokedexGridEl) {
    return;
  }
  if (pokedexViewportRenderRafHandle > 0) {
    return;
  }
  pokedexViewportRenderRafHandle = window.requestAnimationFrame(() => {
    pokedexViewportRenderRafHandle = 0;
    if (!state.ui.pokedexOpen || !state.saveData) {
      return;
    }
    renderPokedexViewportSlice();
  });
}

function buildPokedexSpeciesHintMap() {
  const hintsById = new Map();
  const setHint = (idRaw, hint = {}) => {
    const id = Number(idRaw || 0);
    if (id <= 0) {
      return;
    }
    const previous = hintsById.get(id) || {};
    const nameFr = String(hint.nameFr || previous.nameFr || "").trim();
    const nameEn = String(hint.nameEn || previous.nameEn || "").toLowerCase().trim();
    hintsById.set(id, { nameFr, nameEn });
  };

  for (const starter of STARTER_CHOICES) {
    setHint(starter.id, { nameEn: starter.nameEn });
  }

  if (state.routeCatalog instanceof Map) {
    for (const routeData of state.routeCatalog.values()) {
      const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
      for (const encounter of encounters) {
        setHint(encounter?.id, {
          nameFr: encounter?.name_fr,
          nameEn: encounter?.name_en,
        });
      }
    }
  }

  if (state.saveData?.pokemon_entities && typeof state.saveData.pokemon_entities === "object") {
    for (const [rawId, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
      const recordId = Number(rawRecord?.id || rawId || 0);
      setHint(recordId, {
        nameFr: rawRecord?.name_fr,
        nameEn: rawRecord?.species_name_en || rawRecord?.name_en,
      });
    }
  }

  for (const [id, def] of state.pokemonDefsById.entries()) {
    setHint(id, { nameFr: def?.nameFr, nameEn: def?.nameEn });
  }

  return hintsById;
}

function normalizePokedexSpeciesNameEn(value) {
  return String(value || "").toLowerCase().trim();
}

function getPokedexVariantPreferenceByPokemonId(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id >= 387 && id <= 493) {
    return POKEDEX_VARIANT_PREFERENCE_GEN_4;
  }
  return POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3;
}

function buildPokedexSpeciesSpritePathForVariant(pokemonId, nameEn, variantId) {
  const id = Number(pokemonId || 0);
  const normalizedNameEn = normalizePokedexSpeciesNameEn(nameEn);
  const normalizedVariantId = normalizeSpriteVariantId(variantId);
  if (id <= 0 || !normalizedNameEn || !normalizedVariantId) {
    return "";
  }
  return `pokemon_data/${id}_${normalizedNameEn}/sprites/${id}_${normalizedNameEn}_${normalizedVariantId}_front.png`;
}

function getPokedexPreferredOfflineVariantId(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id >= 387 && id <= 493) {
    return "diamond_pearl";
  }
  if (id > 0 && (id <= 151 || POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS.has(id))) {
    return "firered_leafgreen";
  }
  return "ruby_sapphire";
}

function buildPokedexSpeciesSpritePath(pokemonId, nameEn) {
  const id = Number(pokemonId || 0);
  const variantId = getPokedexPreferredOfflineVariantId(id);
  return buildPokedexSpeciesSpritePathForVariant(id, nameEn, variantId);
}

function getPokedexPreferredSpriteVariantFromDef(def, pokemonId) {
  if (!def || typeof def !== "object") {
    return null;
  }
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return null;
  }
  const variantsById = new Map(variants.map((entry) => [entry.id, entry]));
  for (const preferredId of getPokedexVariantPreferenceByPokemonId(pokemonId)) {
    const normalizedId = normalizeSpriteVariantId(preferredId);
    if (normalizedId && variantsById.has(normalizedId)) {
      return variantsById.get(normalizedId) || null;
    }
  }
  return getPreferredDefaultSpriteVariant(def) || variants[0] || null;
}

function resolvePokedexSpeciesSpritePath(pokemonId, nameEn, def = null) {
  const preferredVariant = getPokedexPreferredSpriteVariantFromDef(def, pokemonId);
  if (preferredVariant?.frontPath) {
    return String(preferredVariant.frontPath || "");
  }
  if (def?.spritePath) {
    return String(def.spritePath || "");
  }
  if (!def) {
    const offlinePreferredPath = buildPokedexSpeciesSpritePath(pokemonId, nameEn);
    if (offlinePreferredPath) {
      return offlinePreferredPath;
    }
  }
  const normalizedNameEn = normalizePokedexSpeciesNameEn(nameEn);
  const fallbackVariantOrder = getPokedexVariantPreferenceByPokemonId(pokemonId);
  for (const variantId of fallbackVariantOrder) {
    const candidatePath = buildPokedexSpeciesSpritePathForVariant(pokemonId, normalizedNameEn, variantId);
    if (candidatePath) {
      return candidatePath;
    }
  }
  return "";
}

function getPokedexSpeciesCatalogByPokemonId() {
  const speciesById = new Map();
  const maxPokemonId = getCurrentPokedexMaxPokemonId();
  if (state.pokedexSpeciesCsvByPokemonId instanceof Map && state.pokedexSpeciesCsvByPokemonId.size > 0) {
    for (const [rawPokemonId, rawSpecies] of state.pokedexSpeciesCsvByPokemonId.entries()) {
      const pokemonId = Number(rawPokemonId || rawSpecies?.id || 0);
      if (pokemonId <= 0 || pokemonId > maxPokemonId) {
        continue;
      }
      const def = state.pokemonDefsById.get(pokemonId) || null;
      const nameEn = normalizePokedexSpeciesNameEn(rawSpecies?.nameEn || def?.nameEn);
      const fallbackNameEn = String(nameEn || "").replace(/[_-]+/g, " ").trim();
      const fallbackName = fallbackNameEn
        ? fallbackNameEn.charAt(0).toUpperCase() + fallbackNameEn.slice(1)
        : `Pokemon ${pokemonId}`;
      const nameFr = normalizeUiDisplayText(String(rawSpecies?.nameFr || def?.nameFr || fallbackName), {
        frenchTypography: true,
      });
      const defensiveTypes =
        Array.isArray(def?.defensiveTypes) && def.defensiveTypes.length > 0
          ? getPokemonTypeList(def.defensiveTypes, "normal")
          : null;
      const offensiveType =
        defensiveTypes && defensiveTypes.length > 0
          ? normalizeType(def?.offensiveType || defensiveTypes[0] || "normal") || "normal"
          : "";
      speciesById.set(pokemonId, {
        id: pokemonId,
        nameFr,
        nameEn,
        spritePath: resolvePokedexSpeciesSpritePath(pokemonId, nameEn, def),
        defensiveTypes,
        offensiveType,
      });
    }
    return speciesById;
  }

  const hintsById = buildPokedexSpeciesHintMap();
  for (const [pokemonId, hint] of hintsById.entries()) {
    if (pokemonId <= 0 || pokemonId > maxPokemonId) {
      continue;
    }
    const def = state.pokemonDefsById.get(pokemonId) || null;
    const nameEn = normalizePokedexSpeciesNameEn(hint?.nameEn || def?.nameEn);
    const fallbackNameEn = String(nameEn || "").replace(/[_-]+/g, " ").trim();
    const fallbackName = fallbackNameEn
      ? fallbackNameEn.charAt(0).toUpperCase() + fallbackNameEn.slice(1)
      : `Pokemon ${pokemonId}`;
    const nameFr = normalizeUiDisplayText(String(hint?.nameFr || def?.nameFr || fallbackName), {
      frenchTypography: true,
    });
    const defensiveTypes =
      Array.isArray(def?.defensiveTypes) && def.defensiveTypes.length > 0
        ? getPokemonTypeList(def.defensiveTypes, "normal")
        : null;
    const offensiveType =
      defensiveTypes && defensiveTypes.length > 0
        ? normalizeType(def?.offensiveType || defensiveTypes[0] || "normal") || "normal"
        : "";
    speciesById.set(pokemonId, {
      id: pokemonId,
      nameFr,
      nameEn,
      spritePath: resolvePokedexSpeciesSpritePath(pokemonId, nameEn, def),
      defensiveTypes,
      offensiveType,
      attackMode: normalizePokemonAttackMode(def?.attackMode),
    });
  }
  return speciesById;
}

function getResolvedPokedexEntryTypes(species, def) {
  const defensiveTypes = getPokemonTypeList(
    (Array.isArray(def?.defensiveTypes) && def.defensiveTypes.length > 0)
      ? def.defensiveTypes
      : species?.defensiveTypes,
    "normal",
  );
  const offensiveType = normalizeType(def?.offensiveType || species?.offensiveType || defensiveTypes[0] || "normal") || "normal";
  return {
    defensiveTypes,
    offensiveType,
  };
}

function buildPokedexEncounterZonesByPokemonId() {
  const zonesByPokemonId = new Map();
  if (!(state.routeCatalog instanceof Map) || state.routeCatalog.size <= 0) {
    return zonesByPokemonId;
  }

  for (const routeData of state.routeCatalog.values()) {
    const routeNameRaw = String(routeData?.route_name_fr || routeData?.route_id || "").trim();
    if (!routeNameRaw) {
      continue;
    }
    const routeName = normalizeUiDisplayText(routeNameRaw, {
      frenchTypography: true,
    });
    if (!routeName) {
      continue;
    }

    const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
    for (const encounter of encounters) {
      const pokemonId = Number(encounter?.id || 0);
      if (pokemonId <= 0) {
        continue;
      }
      let zones = zonesByPokemonId.get(pokemonId);
      if (!Array.isArray(zones)) {
        zones = [];
        zonesByPokemonId.set(pokemonId, zones);
      }
      if (!zones.includes(routeName)) {
        zones.push(routeName);
      }
    }
  }

  return zonesByPokemonId;
}
function refreshPokedexEntriesCacheIfNeeded() {
  const saveDataRef = state.saveData || null;
  const speciesRef = state.pokedexSpeciesCsvByPokemonId;
  const pokemonDefsCount = state.pokemonDefsById instanceof Map ? state.pokemonDefsById.size : 0;
  if (
    !pokedexEntriesCacheDirty
    && pokedexEntriesCacheSaveDataRef === saveDataRef
    && pokedexEntriesCacheSpeciesRef === speciesRef
    && pokedexEntriesCachePokemonDefsCount === pokemonDefsCount
  ) {
    return;
  }

  const entries = [];
  const entriesById = new Map();
  let encounteredSpeciesCount = 0;
  let capturedSpeciesCount = 0;
  let shinySpeciesCount = 0;
  let ultraShinySpeciesCount = 0;
  const speciesById = getPokedexSpeciesCatalogByPokemonId();
  const encounterZonesByPokemonId = buildPokedexEncounterZonesByPokemonId();
  const sortedIds = Array.from(speciesById.keys()).sort((a, b) => a - b);

  for (const pokemonId of sortedIds) {
    const def = state.pokemonDefsById.get(pokemonId) || null;
    const rawRecord = state.saveData?.pokemon_entities?.[String(pokemonId)] || null;
    const record = rawRecord ? normalizePokemonEntityRecord(rawRecord, pokemonId) : null;

    const encounteredNormal = Math.max(0, toSafeInt(record?.encountered_normal, 0));
    const encounteredShiny = Math.max(0, toSafeInt(record?.encountered_shiny, 0));
    const encounteredUltraShiny = Math.max(0, toSafeInt(record?.encountered_ultra_shiny, 0));
    const capturedNormal = Math.max(0, toSafeInt(record?.captured_normal, 0));
    const capturedShiny = Math.max(0, toSafeInt(record?.captured_shiny, 0));
    const capturedUltraShiny = Math.max(0, toSafeInt(record?.captured_ultra_shiny, 0));
    const capturedShinyNonUltra = Math.max(0, capturedShiny - capturedUltraShiny);
    const encounteredTotal = encounteredNormal + encounteredShiny + encounteredUltraShiny;
    const capturedTotal = capturedNormal + capturedShiny + capturedUltraShiny;

    let discoveryState = "unknown";
    if (capturedTotal > 0) {
      discoveryState = "captured";
      capturedSpeciesCount += 1;
      encounteredSpeciesCount += 1;
    } else if (encounteredTotal > 0) {
      discoveryState = "encountered";
      encounteredSpeciesCount += 1;
    }
    if (capturedShinyNonUltra > 0) {
      shinySpeciesCount += 1;
    }
    if (capturedUltraShiny > 0) {
      ultraShinySpeciesCount += 1;
    }

    const species = speciesById.get(pokemonId) || null;
    const nameFr = normalizeUiDisplayText(String(species?.nameFr || def?.nameFr || `Pokemon ${pokemonId}`), {
      frenchTypography: true,
    });
    const { defensiveTypes, offensiveType } = getResolvedPokedexEntryTypes(species, def);

    const shinyModeUnlocked = record ? isShinyAppearanceUnlockedForRecord(record, pokemonId) : false;
    const ultraShinyModeUnlocked = record ? isUltraShinyAppearanceUnlockedForRecord(record, pokemonId) : false;
    const encounterZoneLabels = encounterZonesByPokemonId.get(pokemonId) || [];

    const entry = {
      id: pokemonId,
      nameFr,
      nameEn: normalizePokedexSpeciesNameEn(species?.nameEn || def?.nameEn || record?.species_name_en || ""),
      spritePath: String(species?.spritePath || resolvePokedexSpeciesSpritePath(pokemonId, species?.nameEn, def) || ""),
      defensiveTypes,
      offensiveType,
      attackMode: normalizePokemonAttackMode(def?.attackMode || species?.attackMode || record?.attack_mode || record?.attackMode),
      discoveryState,
      encounteredTotal,
      capturedTotal,
      encounteredNormal,
      encounteredShiny,
      encounteredUltraShiny,
      capturedNormal,
      capturedShiny,
      capturedUltraShiny,
      shinyModeUnlocked,
      ultraShinyModeUnlocked,
      encounterZoneLabels,
    };
    entries.push(entry);
    entriesById.set(entry.id, entry);
  }

  pokedexEntriesCacheList = entries;
  pokedexEntriesCacheById = entriesById;
  pokedexEntriesCacheEncounteredSpeciesCount = encounteredSpeciesCount;
  pokedexEntriesCacheCapturedSpeciesCount = capturedSpeciesCount;
  pokedexEntriesCacheShinySpeciesCount = shinySpeciesCount;
  pokedexEntriesCacheUltraShinySpeciesCount = ultraShinySpeciesCount;
  pokedexEntriesCacheSaveDataRef = saveDataRef;
  pokedexEntriesCacheSpeciesRef = speciesRef;
  pokedexEntriesCachePokemonDefsCount = pokemonDefsCount;
  pokedexEntriesCacheDirty = false;
}

function getPokedexEntries() {
  refreshPokedexEntriesCacheIfNeeded();
  return pokedexEntriesCacheList;
}

function getPokedexEntryByPokemonId(pokemonId) {
  refreshPokedexEntriesCacheIfNeeded();
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return null;
  }
  return pokedexEntriesCacheById.get(id) || null;
}

async function ensurePokedexEntryDefinitionLoaded(entryOrPokemonId) {
  const pokemonId = Number(entryOrPokemonId?.id || entryOrPokemonId || 0);
  if (pokemonId <= 0) {
    return null;
  }

  const existingDef = state.pokemonDefsById.get(pokemonId) || null;
  if (existingDef) {
    return existingDef;
  }

  if (pendingPokedexDefinitionLoads.has(pokemonId)) {
    return pendingPokedexDefinitionLoads.get(pokemonId);
  }

  const species = getPokedexSpeciesCatalogByPokemonId().get(pokemonId) || null;
  const nameEn = normalizePokedexSpeciesNameEn(
    entryOrPokemonId?.nameEn
    || species?.nameEn
    || state.saveData?.pokemon_entities?.[String(pokemonId)]?.species_name_en,
  );
  if (!nameEn) {
    return null;
  }

  const syntheticRouteData = {
    route_id: `pokedex_species_${String(pokemonId).padStart(3, "0")}`,
    encounters: [
      {
        id: pokemonId,
        name_en: nameEn,
        name_fr: String(species?.nameFr || entryOrPokemonId?.nameFr || "").trim(),
      },
    ],
  };

  const task = loadPokemonDefinitions([syntheticRouteData], { append: true })
    .then(() => {
      const loadedDef = state.pokemonDefsById.get(pokemonId) || null;
      if (!loadedDef) {
        return null;
      }
      invalidatePokedexEntriesCache();
      const activePokemonId = Number(state.ui.pokedexHoverPokemonId || 0);
      if (state.ui.pokedexOpen && activePokemonId === pokemonId) {
        const refreshedEntry = getPokedexEntryByPokemonId(pokemonId);
        if (refreshedEntry) {
          setPokedexInfoFromEntry(refreshedEntry);
        }
      }
      return loadedDef;
    })
    .catch((error) => {
      console.warn(
        `Impossible de charger la definition Pokedex #${String(pokemonId).padStart(3, "0")}:`,
        error instanceof Error ? error.message : String(error || ""),
      );
      return null;
    })
    .finally(() => {
      pendingPokedexDefinitionLoads.delete(pokemonId);
    });
  pendingPokedexDefinitionLoads.set(pokemonId, task);
  return task;
}

function getPokedexSpeciesProgressCounters() {
  refreshPokedexEntriesCacheIfNeeded();
  return {
    encounteredSpeciesCount: pokedexEntriesCacheEncounteredSpeciesCount,
    capturedSpeciesCount: pokedexEntriesCacheCapturedSpeciesCount,
    shinySpeciesCount: pokedexEntriesCacheShinySpeciesCount,
    ultraShinySpeciesCount: pokedexEntriesCacheUltraShinySpeciesCount,
  };
}

function formatPokedexSpeciesProgressPercent(count, total) {
  const safeTotal = Math.max(0, toSafeInt(total, 0));
  if (safeTotal <= 0) {
    return "0%";
  }
  const safeCount = Math.max(0, toSafeInt(count, 0));
  const ratio = clamp(safeCount / safeTotal, 0, 1);
  const percent = ratio * 100;
  const fractionDigits = percent >= 10 || Number.isInteger(percent) ? 0 : 1;
  return `${percent.toLocaleString("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 1,
  })}%`;
}

function formatPokedexCompletionPercentFromRatio(ratio) {
  const rawRatio = Number(ratio);
  const safeRatio = clamp(Number.isFinite(rawRatio) ? rawRatio : 0, 0, 1);
  const percent = safeRatio * 100;
  const fractionDigits = percent >= 10 || Number.isInteger(percent) ? 0 : 1;
  return `${percent.toLocaleString("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 1,
  })}%`;
}

function normalizePokedexUiText(value) {
  return normalizeUiDisplayText(String(value || ""), {
    frenchTypography: true,
  });
}

function getDefaultPokedexSubtitleText() {
  return normalizePokedexUiText("Toutes les esp\u00e8ces du jeu.");
}

function getPokedexSubtitleText(totalEntries, filteredEntries, query = "") {
  const total = Math.max(0, toSafeInt(totalEntries, 0));
  const filtered = Math.max(0, toSafeInt(filteredEntries, 0));
  if (total <= 0) {
    return getDefaultPokedexSubtitleText();
  }
  const parts = [`${formatCompactNumber(total)} esp\u00e8ce${total > 1 ? "s" : ""}`];
  if (String(query || "").trim()) {
    parts.push(`${formatCompactNumber(filtered)} r\u00e9sultat${filtered > 1 ? "s" : ""}`);
  }
  return normalizePokedexUiText(parts.join(" | "));
}

function buildPokedexHeaderCompletionMarkup(completionLabel, totalSpecies) {
  return [
    `<span class="pokedex-global-completion-kicker">${escapeHtml(normalizePokedexUiText("Completion"))}</span>`,
    `<span class="pokedex-global-completion-value">${escapeHtml(String(completionLabel || "0%"))}</span>`,
    `<span class="pokedex-global-completion-meta">${escapeHtml(normalizePokedexUiText(`${formatCompactNumber(totalSpecies)} esp\u00e8ce${totalSpecies !== 1 ? "s" : ""}`))}</span>`,
  ].join("");
}

function buildPokedexHeaderStatMarkup(label, valueLabel, percentLabel) {
  return [
    `<span class="pokedex-header-stat-label">${escapeHtml(String(label || ""))}</span>`,
    `<span class="pokedex-header-stat-value">${escapeHtml(String(valueLabel || ""))}</span>`,
    `<span class="pokedex-header-stat-meta">${escapeHtml(String(percentLabel || ""))}</span>`,
  ].join("");
}

function setPokedexHeaderProgressSummary(counters, totalSpecies) {
  const total = Math.max(0, toSafeInt(totalSpecies, 0));
  const encountered = Math.max(0, toSafeInt(counters?.encounteredSpeciesCount, 0));
  const captured = Math.max(0, toSafeInt(counters?.capturedSpeciesCount, 0));
  const shiny = Math.max(0, toSafeInt(counters?.shinySpeciesCount, 0));
  const ultra = Math.max(0, toSafeInt(counters?.ultraShinySpeciesCount, 0));
  const completionRatio = total > 0
    ? (
      clamp(encountered / total, 0, 1)
      + clamp(captured / total, 0, 1)
      + clamp(shiny / total, 0, 1)
      + clamp(ultra / total, 0, 1)
    ) / 4
    : 0;
  const completionLabel = formatPokedexCompletionPercentFromRatio(completionRatio);
  if (pokedexGlobalCompletionEl) {
    pokedexGlobalCompletionEl.innerHTML = buildPokedexHeaderCompletionMarkup(completionLabel, total);
  }
  if (pokedexEncounteredStatEl) {
    pokedexEncounteredStatEl.innerHTML = buildPokedexHeaderStatMarkup(
      normalizePokedexUiText("Rencontr\u00e9es"),
      `${formatCompactNumber(encountered)} / ${formatCompactNumber(total)}`,
      formatPokedexSpeciesProgressPercent(encountered, total),
    );
  }
  if (pokedexCapturedStatEl) {
    pokedexCapturedStatEl.innerHTML = buildPokedexHeaderStatMarkup(
      normalizePokedexUiText("Captur\u00e9es"),
      `${formatCompactNumber(captured)} / ${formatCompactNumber(total)}`,
      formatPokedexSpeciesProgressPercent(captured, total),
    );
  }
  if (pokedexShinyStatEl) {
    pokedexShinyStatEl.innerHTML = buildPokedexHeaderStatMarkup(
      "Shiny",
      `${formatCompactNumber(shiny)} / ${formatCompactNumber(total)}`,
      formatPokedexSpeciesProgressPercent(shiny, total),
    );
  }
  if (pokedexUltraShinyStatEl) {
    pokedexUltraShinyStatEl.innerHTML = buildPokedexHeaderStatMarkup(
      normalizePokedexUiText("Ultra"),
      `${formatCompactNumber(ultra)} / ${formatCompactNumber(total)}`,
      formatPokedexSpeciesProgressPercent(ultra, total),
    );
  }
}

function getPokemonTypeIconAssetPath(typeName) {
  const normalizedType = normalizeType(typeName || "normal") || "normal";
  const baseDir = String(TYPE_ICON_ASSET_DIR || "assets/type-icons").replace(/[\\/]+$/, "");
  return `${baseDir}/${normalizedType}.png`;
}

function getPokemonTypeList(typeNames, fallbackType = "normal") {
  const seenTypes = new Set();
  const normalizedTypes = [];
  const rawTypes = Array.isArray(typeNames) ? typeNames : [fallbackType];
  for (const typeName of rawTypes) {
    const normalizedType = normalizeType(typeName || fallbackType || "normal") || "normal";
    if (seenTypes.has(normalizedType)) {
      continue;
    }
    seenTypes.add(normalizedType);
    normalizedTypes.push(normalizedType);
  }
  if (normalizedTypes.length > 0) {
    return normalizedTypes;
  }
  return [normalizeType(fallbackType || "normal") || "normal"];
}

function buildPokemonTypeChipMarkup(typeName) {
  const normalizedType = normalizeType(typeName || "normal") || "normal";
  const label = escapeHtml(formatTypeLabelFr(normalizedType));
  const iconPath = escapeHtml(getPokemonTypeIconAssetPath(normalizedType));
  return [
    `<span class="pokemon-info-type-chip" data-type="${escapeHtml(normalizedType)}">`,
    `<img class="pokemon-info-type-chip-icon" src="${iconPath}" alt="" width="16" height="16" loading="lazy" decoding="async" aria-hidden="true" />`,
    `<span class="pokemon-info-type-chip-label">${label}</span>`,
    `</span>`,
  ].join("");
}

function buildPokemonTypeGroupMarkup(groupLabel, typeNames, fallbackType = "normal") {
  const safeLabel = escapeHtml(String(groupLabel || ""));
  const chips = getPokemonTypeList(typeNames, fallbackType)
    .map((typeName) => buildPokemonTypeChipMarkup(typeName))
    .join("");
  return [
    `<div class="pokemon-info-type-group">`,
    `<span class="pokemon-info-type-group-label">${safeLabel}</span>`,
    `<div class="pokemon-info-type-chip-list">${chips}</div>`,
    `</div>`,
  ].join("");
}

function buildPokemonTypeSummaryMarkup(defensiveTypes, offensiveType) {
  return [
    `<div class="pokemon-info-type-grid">`,
    buildPokemonTypeGroupMarkup("D\u00e9fensif", defensiveTypes, "normal"),
    buildPokemonTypeGroupMarkup("Offensif", [offensiveType], defensiveTypes?.[0] || "normal"),
    `</div>`,
  ].join("");
}

function normalizePokemonAttackMode(attackMode, fallback = "") {
  const normalizedAttackMode = String(attackMode || "").trim().toLowerCase();
  if (normalizedAttackMode === "laser") {
    return "laser";
  }
  if (normalizedAttackMode === "projectile" || normalizedAttackMode === "projectiles") {
    return "projectile";
  }
  const normalizedFallback = String(fallback || "").trim().toLowerCase();
  if (normalizedFallback === "laser") {
    return "laser";
  }
  if (normalizedFallback === "projectile" || normalizedFallback === "projectiles") {
    return "projectile";
  }
  return "";
}

function formatPokemonAttackModeLabelFr(attackMode, fallback = "") {
  const normalizedAttackMode = normalizePokemonAttackMode(attackMode, fallback);
  if (normalizedAttackMode === "laser") {
    return "Laser";
  }
  if (normalizedAttackMode === "projectile") {
    return "Projectiles";
  }
  return "Inconnu";
}

function buildPokemonAttackModeMarkup(attackMode, fallback = "") {
  return [
    `<p class="pokemon-info-zone pokemon-info-zone--attack">`,
    `<span class="pokemon-info-zone-label">Attaque</span>`,
    `<span class="pokemon-info-zone-value">${escapeHtml(formatPokemonAttackModeLabelFr(attackMode, fallback))}</span>`,
    `</p>`,
  ].join("");
}

function createPokemonAttackModeBadge(attackMode, fallback = "") {
  const normalizedAttackMode = normalizePokemonAttackMode(attackMode, fallback);
  if (!normalizedAttackMode) {
    return null;
  }
  const badge = document.createElement("span");
  badge.className = `boxes-mode-badge boxes-mode-badge-attack boxes-mode-badge-attack-${normalizedAttackMode}`;
  badge.dataset.attackMode = normalizedAttackMode;
  badge.title = normalizeUiDisplayText(
    `Attaque ${formatPokemonAttackModeLabelFr(normalizedAttackMode)}`,
    { frenchTypography: true },
  );
  badge.setAttribute("aria-hidden", "true");
  return badge;
}

function appendPokemonAttackModeBadge(visualWrap, attackMode, fallback = "") {
  const attackBadge = createPokemonAttackModeBadge(attackMode, fallback);
  if (!attackBadge) {
    return;
  }

  let badgeRow = null;
  for (const child of Array.from(visualWrap?.children || [])) {
    const classes = String(child?.className || "").split(/\s+/).filter(Boolean);
    if (classes.includes("boxes-mode-badges")) {
      badgeRow = child;
      break;
    }
  }
  if (!badgeRow) {
    badgeRow = document.createElement("span");
    badgeRow.className = "boxes-mode-badges";
    visualWrap.appendChild(badgeRow);
  }
  badgeRow.appendChild(attackBadge);
}

function buildPokedexTypeChipListMarkup(typeNames, fallbackType = "normal") {
  const chips = getPokemonTypeList(typeNames, fallbackType)
    .map((typeName) => buildPokemonTypeChipMarkup(typeName))
    .join("");
  return `<div class="pokemon-info-type-chip-list pokemon-info-type-chip-list--compact">${chips}</div>`;
}

function buildPokedexInfoVisualMarkup(entry, discoveryState, displayNameRaw) {
  const spritePath = escapeHtml(String(entry?.spritePath || "").trim());
  const visualClassName = [
    "pokemon-info-hero-visual",
    discoveryState === "unknown" ? "is-unknown" : "",
    !spritePath ? "is-fallback" : "",
  ].filter(Boolean).join(" ");
  if (spritePath) {
    return [
      `<div class="${visualClassName}">`,
      `<img class="pokemon-info-hero-sprite" src="${spritePath}" alt="" loading="lazy" decoding="async" aria-hidden="true" />`,
      `</div>`,
    ].join("");
  }
  return [
    `<div class="${visualClassName}">`,
    `<span class="pokemon-info-hero-fallback" aria-hidden="true">${escapeHtml(displayNameRaw ? String(displayNameRaw).slice(0, 1) : "?")}</span>`,
    `</div>`,
  ].join("");
}

function buildPokedexSummaryMetricMarkup(label, value, toneClass = "") {
  return [
    `<div class="pokemon-info-summary-stat${toneClass ? ` ${toneClass}` : ""}">`,
    `<span class="pokemon-info-summary-label">${escapeHtml(String(label || ""))}</span>`,
    `<span class="pokemon-info-summary-value">${escapeHtml(String(value || "0"))}</span>`,
    `</div>`,
  ].join("");
}

function buildPokedexBreakdownStatMarkup(label, value, toneClass = "") {
  return [
    `<div class="pokemon-info-breakdown-stat${toneClass ? ` ${toneClass}` : ""}">`,
    `<span class="pokemon-info-breakdown-label">${escapeHtml(String(label || ""))}</span>`,
    `<span class="pokemon-info-breakdown-value">${escapeHtml(String(value || "0"))}</span>`,
    `</div>`,
  ].join("");
}

function buildPokedexBreakdownBlockMarkup(title, totalValue, statsMarkup) {
  return [
    `<section class="pokemon-info-block pokemon-info-block--pokedex">`,
    `<div class="pokemon-info-block-head">`,
    `<h4 class="pokemon-info-block-title">${escapeHtml(String(title || ""))}</h4>`,
    `<span class="pokemon-info-block-total">${escapeHtml(String(totalValue || "0"))}</span>`,
    `</div>`,
    `<div class="pokemon-info-breakdown-grid">${statsMarkup}</div>`,
    `</section>`,
  ].join("");
}

function setPokedexInfoFromEntry(entry) {
  if (!pokedexInfoPanelEl) {
    return;
  }
  const useSheetLayout = isPhoneUiViewport();
  if (!entry) {
    pokedexInfoPanelEl.classList.add("is-empty");
    pokedexInfoPanelEl.classList.remove("is-sheet-open");
    pokedexInfoPanelEl.innerHTML = [
      `<article class="pokemon-info-card pokemon-info-card--empty">`,
      `<p class="pokemon-info-empty-title">${escapeHtml(normalizePokedexUiText("Fiche Pok\u00e9mon"))}</p>`,
      `<p class="pokemon-info-empty-text">${escapeHtml(normalizePokedexUiText(useSheetLayout ? "Touche un Pok\u00e9mon pour ouvrir sa fiche." : "Survole ou s\u00e9lectionne un Pok\u00e9mon pour afficher sa fiche."))}</p>`,
      `</article>`,
    ].join("");
    return;
  }

  const discoveryState = String(entry.discoveryState || "unknown");
  let discoveryLabel = normalizePokedexUiText("Inconnu");
  let discoveryTone = "unknown";
  if (discoveryState === "captured") {
    discoveryLabel = normalizePokedexUiText("Capture");
    discoveryTone = "captured";
  } else if (discoveryState === "encountered") {
    discoveryLabel = normalizePokedexUiText("Rencontre");
    discoveryTone = "encountered";
  }

  const displayNameRaw = discoveryState === "unknown" ? "???" : String(entry.nameFr || "");
  const displayName = escapeHtml(displayNameRaw || "???");
  const speciesId = Math.max(0, toSafeInt(entry.id, 0));
  const speciesLabel = `#${String(speciesId).padStart(3, "0")}`;

  const encounterZoneLabels = Array.isArray(entry.encounterZoneLabels) ? entry.encounterZoneLabels : [];
  const hasEncounteredSpecies = Math.max(0, toSafeInt(entry.encounteredTotal, 0)) > 0;
  const firstZoneRaw = hasEncounteredSpecies && encounterZoneLabels.length > 0
    ? String(encounterZoneLabels[0] || "").trim()
    : "";
  const otherZoneCount = Math.max(0, encounterZoneLabels.length - 1);
  const zoneSummaryRaw = firstZoneRaw
    ? (otherZoneCount > 0
      ? `${firstZoneRaw} (+${formatCompactNumber(otherZoneCount)} autres)`
      : firstZoneRaw)
    : "";
  const zoneSummary = escapeHtml(normalizePokedexUiText(zoneSummaryRaw));

  const summaryMetrics = [
    buildPokedexSummaryMetricMarkup(normalizePokedexUiText("Vues"), formatCompactNumber(entry.encounteredTotal), "pokemon-info-summary-stat--primary"),
    buildPokedexSummaryMetricMarkup(normalizePokedexUiText("Capt."), formatCompactNumber(entry.capturedTotal)),
    buildPokedexSummaryMetricMarkup("Shiny", formatCompactNumber(entry.capturedShiny), "pokemon-info-summary-stat--shiny"),
    buildPokedexSummaryMetricMarkup(normalizePokedexUiText("Ultra"), formatCompactNumber(entry.capturedUltraShiny), "pokemon-info-summary-stat--ultra"),
  ].join("");

  const defensiveTypeLine = [
    `<div class="pokemon-info-hero-types">`,
    `<span class="pokemon-info-zone-label">${escapeHtml(normalizePokedexUiText("Types"))}</span>`,
    buildPokedexTypeChipListMarkup(entry.defensiveTypes, "normal"),
    `</div>`,
  ].join("");

  const offensiveTypeLine = [
    `<div class="pokemon-info-zone pokemon-info-zone--offensive-type">`,
    `<span class="pokemon-info-zone-label">${escapeHtml(normalizePokedexUiText("Type off."))}</span>`,
    buildPokedexTypeChipListMarkup([entry.offensiveType], entry.defensiveTypes?.[0] || "normal"),
    `</div>`,
  ].join("");

  const badgeShinyClass = entry.shinyModeUnlocked ? "pokemon-info-badge is-active" : "pokemon-info-badge";
  const badgeUltraClass = entry.ultraShinyModeUnlocked
    ? "pokemon-info-badge pokemon-info-badge--ultra is-active"
    : "pokemon-info-badge pokemon-info-badge--ultra";

  const hintLine = discoveryTone === "unknown"
    ? [
      `<p class="pokemon-info-hint">`,
      `<span class="pokemon-info-hint-label">${escapeHtml(normalizePokedexUiText("\u00c9tat"))}</span>`,
      `<span class="pokemon-info-hint-value">${escapeHtml(normalizePokedexUiText("Esp\u00e8ce non rencontr\u00e9e."))}</span>`,
      `</p>`,
    ].join("")
    : "";
  const attackModeLine = buildPokemonAttackModeMarkup(entry.attackMode);
  const zoneLine = zoneSummary
    ? `<p class="pokemon-info-zone"><span class="pokemon-info-zone-label">${escapeHtml(normalizePokedexUiText("Zone"))}</span><span class="pokemon-info-zone-value">${zoneSummary}</span></p>`
    : "";
  const encounterBreakdown = buildPokedexBreakdownBlockMarkup(
    normalizePokedexUiText("Rencontres"),
    formatCompactNumber(entry.encounteredTotal),
    [
      buildPokedexBreakdownStatMarkup(normalizePokedexUiText("Norm."), formatCompactNumber(entry.encounteredNormal)),
      buildPokedexBreakdownStatMarkup("Shiny", formatCompactNumber(entry.encounteredShiny), "pokemon-info-breakdown-stat--shiny"),
      buildPokedexBreakdownStatMarkup(normalizePokedexUiText("Ultra"), formatCompactNumber(entry.encounteredUltraShiny), "pokemon-info-breakdown-stat--ultra"),
    ].join(""),
  );
  const captureBreakdown = buildPokedexBreakdownBlockMarkup(
    normalizePokedexUiText("Captures"),
    formatCompactNumber(entry.capturedTotal),
    [
      buildPokedexBreakdownStatMarkup(normalizePokedexUiText("Norm."), formatCompactNumber(entry.capturedNormal)),
      buildPokedexBreakdownStatMarkup("Shiny", formatCompactNumber(entry.capturedShiny), "pokemon-info-breakdown-stat--shiny"),
      buildPokedexBreakdownStatMarkup(normalizePokedexUiText("Ultra"), formatCompactNumber(entry.capturedUltraShiny), "pokemon-info-breakdown-stat--ultra"),
    ].join(""),
  );

  const sheetToolbar = useSheetLayout
    ? [
      `<div class="collection-info-sheet-toolbar">`,
      `<span class="collection-info-sheet-kicker">${escapeHtml(normalizePokedexUiText("Fiche Pok\u00e9dex"))}</span>`,
      `<button class="collection-info-sheet-close" type="button" data-collection-sheet-close="pokedex">${escapeHtml(normalizePokedexUiText("Fermer"))}</button>`,
      `</div>`,
    ].join("")
    : "";

  pokedexInfoPanelEl.classList.remove("is-empty");
  pokedexInfoPanelEl.classList.toggle("is-sheet-open", useSheetLayout);
  pokedexInfoPanelEl.innerHTML = [
    `<article class="pokemon-info-card pokemon-info-card--pokedex pokemon-info-state--${discoveryTone}">`,
    sheetToolbar,
    `<div class="pokemon-info-hero">`,
    `<div class="pokemon-info-hero-main">`,
    buildPokedexInfoVisualMarkup(entry, discoveryState, displayNameRaw),
    `<div class="pokemon-info-hero-copy">`,
    `<header class="pokemon-info-head">`,
    `<div class="pokemon-info-title-wrap">`,
    `<h3 class="pokemon-info-title">${displayName}</h3>`,
    `<p class="pokemon-info-subtitle">${escapeHtml(normalizePokedexUiText(`${speciesLabel} | ${discoveryLabel}`))}</p>`,
    `</div>`,
    `<div class="pokemon-info-badges">`,
    `<span class="${badgeShinyClass}">Shiny</span>`,
    `<span class="${badgeUltraClass}">Ultra</span>`,
    `</div>`,
    `</header>`,
    defensiveTypeLine,
    `</div>`,
    `</div>`,
    `<div class="pokemon-info-hero-summary">${summaryMetrics}</div>`,
    `</div>`,
    `<div class="pokemon-info-feature-grid pokemon-info-feature-grid--pokedex">`,
    offensiveTypeLine,
    attackModeLine,
    zoneLine,
    hintLine,
    `</div>`,
    `<div class="pokemon-info-detail-grid">`,
    encounterBreakdown,
    captureBreakdown,
    `</div>`,
    `</article>`,
  ].filter(Boolean).join("");
}

function resetPokedexVirtualDomReferences() {
  pokedexVirtualContentEl = null;
  pokedexVirtualTopSpacerEl = null;
  pokedexVirtualBottomSpacerEl = null;
  pokedexVirtualLastSliceKey = "";
  pokedexVirtualLastStartIndex = 0;
  pokedexVirtualLastEndIndex = 0;
  pokedexVirtualLayoutCacheKey = "";
}

function updatePokedexVirtualLayoutMetricsIfNeeded() {
  if (!pokedexGridEl) {
    return;
  }
  const layoutCacheKey = `${pokedexGridEl.clientWidth}x${pokedexGridEl.clientHeight}`;
  if (layoutCacheKey === pokedexVirtualLayoutCacheKey) {
    return;
  }
  pokedexVirtualLayoutCacheKey = layoutCacheKey;
  const style = window.getComputedStyle(pokedexGridEl);
  pokedexVirtualPaddingLeftPx = Math.max(0, Number.parseFloat(style.paddingLeft || "0") || 0);
  pokedexVirtualPaddingRightPx = Math.max(0, Number.parseFloat(style.paddingRight || "0") || 0);
  pokedexVirtualPaddingTopPx = Math.max(0, Number.parseFloat(style.paddingTop || "0") || 0);
  pokedexVirtualPaddingBottomPx = Math.max(0, Number.parseFloat(style.paddingBottom || "0") || 0);
  const columnGap = Number.parseFloat(style.columnGap || style.gap || "0");
  const rowGap = Number.parseFloat(style.rowGap || style.gap || "0");
  pokedexVirtualColumnGapPx = Number.isFinite(columnGap) && columnGap > 0 ? columnGap : POKEDEX_VIRTUAL_GAP_PX;
  pokedexVirtualRowGapPx = Number.isFinite(rowGap) && rowGap > 0 ? rowGap : POKEDEX_VIRTUAL_GAP_PX;
}

function getPokedexVirtualMetrics(totalEntriesCount) {
  if (!pokedexGridEl) {
    return null;
  }
  updatePokedexVirtualLayoutMetricsIfNeeded();
  const safeTotal = Math.max(0, toSafeInt(totalEntriesCount, 0));
  const innerWidth = Math.max(0, pokedexGridEl.clientWidth - pokedexVirtualPaddingLeftPx - pokedexVirtualPaddingRightPx);
  const innerHeight = Math.max(0, pokedexGridEl.clientHeight - pokedexVirtualPaddingTopPx - pokedexVirtualPaddingBottomPx);
  const cardWidth = POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX;
  const cardHeight = POKEDEX_VIRTUAL_CARD_HEIGHT_PX;
  const columnCount = Math.max(1, Math.floor((innerWidth + pokedexVirtualColumnGapPx) / (cardWidth + pokedexVirtualColumnGapPx)));
  const totalRows = Math.max(1, Math.ceil(safeTotal / columnCount));
  const rowStride = Math.max(1, cardHeight + pokedexVirtualRowGapPx);
  const firstVisibleRow = Math.max(0, Math.floor(Math.max(0, pokedexGridEl.scrollTop) / rowStride));
  const startRow = Math.max(0, firstVisibleRow - POKEDEX_VIRTUAL_OVERSCAN_ROWS);
  const visibleRows = Math.max(1, Math.ceil(innerHeight / rowStride) + POKEDEX_VIRTUAL_OVERSCAN_ROWS * 2);
  const endRowExclusive = Math.min(totalRows, startRow + visibleRows);
  const startIndex = Math.min(safeTotal, startRow * columnCount);
  const endIndex = Math.min(safeTotal, endRowExclusive * columnCount);
  const topSpacerHeight = Math.max(0, startRow * rowStride);
  const bottomSpacerHeight = Math.max(0, (totalRows - endRowExclusive) * rowStride);
  return {
    columnCount,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
  };
}

function resolvePokedexCardButtonFromEventTarget(target) {
  if (!(target instanceof Element) || !pokedexGridEl) {
    return null;
  }
  const button = target.closest(".pokedex-mon-btn[data-pokedex-id]");
  if (!(button instanceof HTMLButtonElement) || !pokedexGridEl.contains(button)) {
    return null;
  }
  return button;
}

function handlePokedexCardInteractionEvent(event) {
  const button = resolvePokedexCardButtonFromEventTarget(event?.target);
  if (!button) {
    return;
  }
  const pokemonId = Number(button.dataset.pokedexId || 0);
  if (pokemonId <= 0 || pokemonId === Number(state.ui.pokedexHoverPokemonId || 0)) {
    return;
  }
  const entry = getPokedexEntryByPokemonId(pokemonId);
  if (!entry) {
    return;
  }
  state.ui.pokedexHoverPokemonId = entry.id;
  setPokedexInfoFromEntry(entry);
  void ensurePokedexEntryDefinitionLoaded(entry);
}

function bindPokedexVirtualEventsIfNeeded() {
  if (!pokedexGridEl || pokedexVirtualEventsBound) {
    return;
  }
  pokedexGridEl.addEventListener("mouseover", handlePokedexCardInteractionEvent);
  pokedexGridEl.addEventListener("focusin", handlePokedexCardInteractionEvent);
  pokedexGridEl.addEventListener("click", handlePokedexCardInteractionEvent);
  pokedexGridEl.addEventListener(
    "scroll",
    () => {
      queuePokedexViewportRender();
    },
    { passive: true },
  );
  pokedexVirtualEventsBound = true;
}

function ensurePokedexVirtualResizeObserver() {
  if (!pokedexGridEl || pokedexVirtualResizeObserver || typeof ResizeObserver !== "function") {
    return;
  }
  pokedexVirtualResizeObserver = new ResizeObserver(() => {
    if (!state.ui.pokedexOpen) {
      return;
    }
    pokedexVirtualLastSliceKey = "";
    queuePokedexViewportRender();
  });
  pokedexVirtualResizeObserver.observe(pokedexGridEl);
}

function ensurePokedexVirtualElements() {
  if (!pokedexGridEl) {
    return false;
  }
  const stillMounted = Boolean(
    pokedexVirtualTopSpacerEl
      && pokedexVirtualBottomSpacerEl
      && pokedexVirtualContentEl
      && pokedexGridEl.contains(pokedexVirtualTopSpacerEl)
      && pokedexGridEl.contains(pokedexVirtualBottomSpacerEl)
      && pokedexGridEl.contains(pokedexVirtualContentEl),
  );
  if (!stillMounted) {
    const topSpacer = document.createElement("div");
    topSpacer.className = "pokedex-virtual-spacer";
    const content = document.createElement("div");
    content.className = "pokedex-virtual-content";
    const bottomSpacer = document.createElement("div");
    bottomSpacer.className = "pokedex-virtual-spacer";
    pokedexGridEl.replaceChildren(topSpacer, content, bottomSpacer);
    pokedexVirtualTopSpacerEl = topSpacer;
    pokedexVirtualContentEl = content;
    pokedexVirtualBottomSpacerEl = bottomSpacer;
    pokedexVirtualLastSliceKey = "";
  }
  bindPokedexVirtualEventsIfNeeded();
  ensurePokedexVirtualResizeObserver();
  return true;
}

function prefetchPokedexSpritePath(path) {
  const spritePath = String(path || "").trim();
  if (!spritePath || pokedexSpritePrefetchStateByPath.has(spritePath)) {
    return;
  }
  const image = new Image();
  image.decoding = "async";
  image.src = spritePath;
  pokedexSpritePrefetchStateByPath.set(spritePath, image);
}

function prefetchPokedexSpritesAroundSlice(entries, startIndex, endIndex, columnCount) {
  if (!Array.isArray(entries) || entries.length <= 0) {
    return;
  }
  const preloadRadius = Math.max(1, toSafeInt(columnCount, 1) * POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS);
  const prefetchStart = Math.max(0, toSafeInt(startIndex, 0) - preloadRadius);
  const prefetchEnd = Math.min(entries.length, Math.max(prefetchStart, toSafeInt(endIndex, 0)) + preloadRadius);
  for (let index = prefetchStart; index < prefetchEnd; index += 1) {
    const spritePath = entries[index]?.spritePath;
    if (spritePath) {
      prefetchPokedexSpritePath(spritePath);
    }
  }
}

function createPokedexLoadingIndicatorElement() {
  const indicator = document.createElement("span");
  indicator.className = "pokedex-loading-indicator";
  indicator.setAttribute("aria-hidden", "true");
  const pokeball = document.createElement("span");
  pokeball.className = "pokedex-loading-pokeball";
  indicator.appendChild(pokeball);
  return indicator;
}

function attachPokedexSpriteLoadingLifecycle(image, visualWrap, button) {
  if (!(image instanceof HTMLImageElement) || !(visualWrap instanceof HTMLElement)) {
    return;
  }
  let settled = false;
  const loadingIndicator = createPokedexLoadingIndicatorElement();
  visualWrap.classList.add("is-loading");
  visualWrap.appendChild(loadingIndicator);
  image.classList.add("is-pending");

  const settleLoadingState = (loaded) => {
    if (settled) {
      return;
    }
    settled = true;
    visualWrap.classList.remove("is-loading");
    image.classList.remove("is-pending");
    loadingIndicator.remove();
    if (!loaded) {
      image.remove();
      const fallback = document.createElement("span");
      fallback.className = "boxes-mon-fallback pokedex-mon-fallback";
      fallback.textContent = "?";
      visualWrap.appendChild(fallback);
      if (button instanceof HTMLButtonElement) {
        button.classList.add("is-loading-failed");
      }
    }
  };

  image.addEventListener(
    "load",
    () => {
      settleLoadingState(true);
    },
    { once: true },
  );
  image.addEventListener(
    "error",
    () => {
      settleLoadingState(false);
    },
    { once: true },
  );

  if (image.complete) {
    settleLoadingState(image.naturalWidth > 0);
  }
}

function createPokedexCardButton(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "boxes-mon-btn pokedex-mon-btn";
  button.classList.add(`is-${entry.discoveryState}`);
  if (entry.id === Number(state.ui.pokedexHoverPokemonId || 0)) {
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
  } else {
    button.setAttribute("aria-pressed", "false");
  }
  button.dataset.pokedexId = String(entry.id);
  button.setAttribute(
    "aria-label",
    normalizePokedexUiText(`${entry.discoveryState === "unknown" ? "Pok\u00e9mon inconnu" : entry.nameFr} #${String(entry.id).padStart(3, "0")}`),
  );

  const visualWrap = document.createElement("div");
  visualWrap.className = "boxes-mon-visual";
  if (entry.spritePath) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = entry.spritePath;
    image.loading = "eager";
    image.decoding = "async";
    image.draggable = false;
    image.className = "pokedex-mon-sprite";
    visualWrap.appendChild(image);
    attachPokedexSpriteLoadingLifecycle(image, visualWrap, button);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "boxes-mon-fallback pokedex-mon-fallback";
    fallback.textContent = "?";
    visualWrap.appendChild(fallback);
  }

  if (entry.shinyModeUnlocked || entry.ultraShinyModeUnlocked) {
    const badgeRow = document.createElement("span");
    badgeRow.className = "boxes-mode-badges";
    if (entry.shinyModeUnlocked) {
      const shinyBadge = document.createElement("span");
      shinyBadge.className = "boxes-mode-badge boxes-mode-badge-shiny";
      shinyBadge.textContent = "\u2726";
      shinyBadge.title = normalizePokedexUiText("Mode shiny d\u00e9bloqu\u00e9");
      badgeRow.appendChild(shinyBadge);
    }
    if (entry.ultraShinyModeUnlocked) {
      const ultraBadge = document.createElement("span");
      ultraBadge.className = "boxes-mode-badge boxes-mode-badge-ultra";
      ultraBadge.textContent = "\u2726";
      ultraBadge.title = normalizePokedexUiText("Mode ultra shiny d\u00e9bloqu\u00e9");
      badgeRow.appendChild(ultraBadge);
    }
    visualWrap.appendChild(badgeRow);
  }
  appendPokemonAttackModeBadge(visualWrap, entry.attackMode);
  button.appendChild(visualWrap);

  const numberEl = document.createElement("span");
  numberEl.className = "boxes-mon-line";
  numberEl.textContent = "#" + String(entry.id).padStart(3, "0");
  button.appendChild(numberEl);

  const nameEl = document.createElement("span");
  nameEl.className = "boxes-mon-name";
  nameEl.textContent = entry.discoveryState === "unknown" ? "???" : entry.nameFr;
  button.appendChild(nameEl);
  return button;
}

function renderPokedexViewportSlice(options = {}) {
  if (!state.ui.pokedexOpen || !state.saveData || !pokedexGridEl || !pokedexVirtualContentEl) {
    return;
  }
  const entries = getFilteredPokedexEntries();
  if (entries.length <= 0) {
    return;
  }
  const metrics = getPokedexVirtualMetrics(entries.length);
  if (!metrics) {
    return;
  }

  const { columnCount, startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = metrics;
  const sliceKey = `${columnCount}:${startIndex}:${endIndex}`;
  if (!options?.force && sliceKey === pokedexVirtualLastSliceKey) {
    prefetchPokedexSpritesAroundSlice(entries, startIndex, endIndex, columnCount);
    return;
  }
  pokedexVirtualLastSliceKey = sliceKey;
  pokedexVirtualLastStartIndex = startIndex;
  pokedexVirtualLastEndIndex = endIndex;

  pokedexVirtualContentEl.style.gridTemplateColumns = `repeat(${columnCount}, minmax(${POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX}px, 1fr))`;
  pokedexVirtualContentEl.style.columnGap = `${Math.max(0, pokedexVirtualColumnGapPx)}px`;
  pokedexVirtualContentEl.style.rowGap = `${Math.max(0, pokedexVirtualRowGapPx)}px`;
  const fragment = document.createDocumentFragment();
  for (let index = startIndex; index < endIndex; index += 1) {
    const entry = entries[index];
    if (!entry) {
      continue;
    }
    fragment.appendChild(createPokedexCardButton(entry));
  }
  pokedexVirtualContentEl.replaceChildren(fragment);
  if (pokedexVirtualTopSpacerEl) {
    pokedexVirtualTopSpacerEl.style.height = `${Math.max(0, topSpacerHeight)}px`;
  }
  if (pokedexVirtualBottomSpacerEl) {
    pokedexVirtualBottomSpacerEl.style.height = `${Math.max(0, bottomSpacerHeight)}px`;
  }
  prefetchPokedexSpritesAroundSlice(entries, startIndex, endIndex, columnCount);
}

function closePokedexModal() {
  state.ui.pokedexOpen = false;
  state.ui.pokedexHoverPokemonId = null;
  clearPokedexSearchQuery();
  cancelQueuedPokedexGridRender();
  cancelQueuedPokedexViewportRender();
  if (pokedexVirtualResizeObserver) {
    pokedexVirtualResizeObserver.disconnect();
    pokedexVirtualResizeObserver = null;
  }
  if (pokedexModalEl) {
    hideModalWithTween(pokedexModalEl);
  }
  if (pokedexSubtitleEl) {
    pokedexSubtitleEl.textContent = getDefaultPokedexSubtitleText();
  }
  setPokedexHeaderProgressSummary(
    {
      encounteredSpeciesCount: 0,
      capturedSpeciesCount: 0,
      shinySpeciesCount: 0,
      ultraShinySpeciesCount: 0,
    },
    0,
  );
  if (pokedexGridEl) {
    pokedexGridEl.innerHTML = "";
  }
  resetPokedexVirtualDomReferences();
  setPokedexInfoFromEntry(null);
}

function renderPokedexGrid() {
  if (!pokedexGridEl || !state.saveData) {
    return;
  }
  const useSheetLayout = isPhoneUiViewport();
  cancelQueuedPokedexGridRender();
  cancelQueuedPokedexViewportRender();
  invalidatePokedexEntriesCache();
  const allEntries = getPokedexEntries();
  const entries = getFilteredPokedexEntries(allEntries);
  const counters = getPokedexSpeciesProgressCounters();
  const searchQuery = String(state.ui?.pokedexSearchQuery || "");

  if (pokedexSubtitleEl) {
    pokedexSubtitleEl.textContent = getPokedexSubtitleText(allEntries.length, entries.length, searchQuery);
  }
  setPokedexHeaderProgressSummary(counters, allEntries.length);

  if (allEntries.length <= 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "boxes-empty";
    emptyEl.textContent = normalizePokedexUiText("Aucune esp\u00e8ce disponible pour le moment.");
    pokedexGridEl.replaceChildren(emptyEl);
    resetPokedexVirtualDomReferences();
    state.ui.pokedexHoverPokemonId = null;
    setPokedexInfoFromEntry(null);
    return;
  }

  if (entries.length <= 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "boxes-empty";
    emptyEl.textContent = normalizePokedexUiText("Aucun Pok\u00e9mon ne correspond \u00e0 la recherche.");
    pokedexGridEl.replaceChildren(emptyEl);
    resetPokedexVirtualDomReferences();
    state.ui.pokedexHoverPokemonId = null;
    setPokedexInfoFromEntry(null);
    return;
  }

  let hoverEntry = entries.find((entry) => entry.id === Number(state.ui.pokedexHoverPokemonId || 0)) || null;
  if (!hoverEntry && !useSheetLayout) {
    hoverEntry = entries[0] || null;
    state.ui.pokedexHoverPokemonId = hoverEntry ? hoverEntry.id : null;
  }
  if (!ensurePokedexVirtualElements()) {
    return;
  }
  renderPokedexViewportSlice({ force: true });
  setPokedexInfoFromEntry(hoverEntry);
  if (hoverEntry) {
    void ensurePokedexEntryDefinitionLoaded(hoverEntry);
  }
}

function openPokedexModal() {
  if (!pokedexModalEl || !state.saveData) {
    return;
  }
  if (state.ui.tutorialOpen) {
    return;
  }
  if (isTrainerBattleUiLocked()) {
    setTopMessage("Impossible d'ouvrir le Pokedex pendant un combat de dresseur.", 1800);
    return;
  }
  closeTeamContextMenu();
  closeBallCaptureMenu();
  clearCanvasHoverState();
  closeRenameModal();
  closeBoxesModal();
  closeAppearanceModal();
  closeEvolutionItemChoiceModal(null);
  setMapOpen(false);
  setShopOpen(false);
  closeGachaModal({ force: true });
  state.ui.pokedexOpen = true;
  state.ui.pokedexHoverPokemonId = null;
  bindPokedexSearchEventsIfNeeded();
  syncPokedexSearchInputValue();
  if (pokedexGridEl) {
    pokedexGridEl.scrollTop = 0;
  }
  pokedexVirtualLastSliceKey = "";
  showModalWithTween(pokedexModalEl);
  queuePokedexGridRender();
}

function getBoxesSelectionContext() {
  const boxesMode = String(state.ui.boxesMode || "team").toLowerCase().trim() === "trainer_battle"
    ? "trainer_battle"
    : "team";
  const targetTeamSize = boxesMode === "trainer_battle"
    ? getTrainerBattleTeamSizeCount()
    : MAX_TEAM_SIZE;
  const activeTeamIds =
    boxesMode === "trainer_battle"
      ? getTrainerBattleSelectedTeamIds()
      : (Array.isArray(state.saveData?.team) ? state.saveData.team : []);
  const targetSlotIndex = clamp(toSafeInt(state.ui.boxesTargetSlotIndex, -1), -1, targetTeamSize - 1);
  const currentTargetId = targetSlotIndex >= 0 ? Number(activeTeamIds[targetSlotIndex] || 0) : 0;
  const currentTargetName = currentTargetId > 0 ? getPokemonDisplayNameById(currentTargetId) : "Pokemon";
  return {
    useCompactSelectionUi: isPhoneUiViewport(),
    boxesMode,
    targetTeamSize,
    activeTeamIds,
    targetSlotIndex,
    currentTargetId,
    currentTargetName,
  };
}

function getBoxesEntrySelectionState(entry, context = getBoxesSelectionContext()) {
  const targetSlotIndex = clamp(toSafeInt(context?.targetSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const activeTeamIds = Array.isArray(context?.activeTeamIds) ? context.activeTeamIds : [];
  const currentTargetId = Number(context?.currentTargetId || 0);
  const selectedSlotIndex = activeTeamIds.findIndex((pokemonId) => Number(pokemonId || 0) === Number(entry?.id || 0));
  const inAnotherSlot = selectedSlotIndex >= 0 && selectedSlotIndex !== targetSlotIndex;
  const unavailable = !entry?.usableInTeam;
  const familyConflictSlotIndex = findFamilyConflictSlotIndexInTeamIds(activeTeamIds, entry?.id, targetSlotIndex);
  return {
    isCurrent: Number(entry?.id || 0) === currentTargetId,
    selectedSlotIndex,
    inAnotherSlot,
    unavailable,
    familyConflictSlotIndex,
    hasFamilyConflict: familyConflictSlotIndex >= 0,
  };
}

function renderBoxesMobileSelectionState(entry, context = getBoxesSelectionContext()) {
  if (
    !boxesHeaderDefaultEl
    || !boxesMobileSelectionSummaryEl
    || !boxesMobileSelectionActionsEl
    || !boxesMobileSelectionCancelButtonEl
    || !boxesMobileSelectionConfirmButtonEl
  ) {
    return;
  }

  const useCompactSelectionUi = Boolean(context?.useCompactSelectionUi);
  const hasSelection = useCompactSelectionUi && Boolean(entry);

  boxesHeaderDefaultEl.classList.toggle("hidden", hasSelection);
  if (boxesHeaderCopyEl?.classList) {
    boxesHeaderCopyEl.classList.toggle("is-mobile-selection-active", hasSelection);
  }
  boxesMobileSelectionSummaryEl.classList.toggle("hidden", !hasSelection);
  boxesMobileSelectionActionsEl.classList.toggle("hidden", !hasSelection);
  boxesMobileSelectionCancelButtonEl.disabled = !hasSelection;
  boxesMobileSelectionConfirmButtonEl.disabled = !hasSelection;
  boxesMobileSelectionCancelButtonEl.setAttribute("aria-disabled", hasSelection ? "false" : "true");
  boxesMobileSelectionConfirmButtonEl.setAttribute("aria-disabled", hasSelection ? "false" : "true");

  if (!hasSelection) {
    boxesMobileSelectionSummaryEl.innerHTML = "";
    return;
  }

  const selectionState = getBoxesEntrySelectionState(entry, context);
  const speciesId = Math.max(0, toSafeInt(entry?.id, 0));
  const speciesLabel = `#${String(speciesId).padStart(3, "0")}`;
  const displayName = escapeHtml(String(entry?.nameFr || ""));
  const baseName = escapeHtml(String(entry?.baseNameFr || ""));
  const hasCustomName = Boolean(entry?.hasCustomName && baseName && baseName !== displayName);
  const levelLabel = `Niv. ${formatCompactNumber(Math.max(1, toSafeInt(entry?.level, 1)))}`;
  const captureLabel = `Captures ${formatCompactNumber(Math.max(0, toSafeInt(entry?.capturedTotal, 0)))}`;
  const attackLabel = formatPokemonAttackModeLabelFr(entry?.attackMode);
  const slotLabel = context?.targetSlotIndex >= 0 ? getTeamSlotLabel(context.targetSlotIndex) : "Selection";
  const modeLabel = context?.boxesMode === "trainer_battle" ? "Preparation combat" : "Selection equipe";
  const selectionLabel = selectionState.isCurrent
    ? (context?.boxesMode === "trainer_battle" ? "Choix actuel" : "Slot actuel")
    : "Pret a confirmer";
  const spriteMarkup = String(entry?.spritePath || "").trim()
    ? `<img class="boxes-mobile-selection-sprite" src="${escapeHtml(String(entry.spritePath))}" alt="${displayName || speciesLabel}" />`
    : `<span class="boxes-mobile-selection-fallback">${escapeHtml(String(entry?.nameFr || "P").slice(0, 1).toUpperCase())}</span>`;
  const typeChips = Array.from(new Set([
    ...getPokemonTypeList(entry?.defensiveTypes, entry?.offensiveType || "normal"),
    ...getPokemonTypeList([entry?.offensiveType], entry?.defensiveTypes?.[0] || "normal"),
  ]))
    .slice(0, 3)
    .map((typeName) => buildPokemonTypeChipMarkup(typeName))
    .join("");

  boxesMobileSelectionSummaryEl.innerHTML = [
    `<p class="boxes-mobile-selection-kicker">${escapeHtml(modeLabel)} | ${escapeHtml(slotLabel)}</p>`,
    `<article class="boxes-mobile-selection-card">`,
    `<div class="boxes-mobile-selection-visual">${spriteMarkup}</div>`,
    `<div class="boxes-mobile-selection-copy">`,
    `<div class="boxes-mobile-selection-title-row">`,
    `<strong class="boxes-mobile-selection-title">${displayName || speciesLabel}</strong>`,
    `<span class="boxes-mobile-selection-status">${escapeHtml(selectionLabel)}</span>`,
    `</div>`,
    `<p class="boxes-mobile-selection-meta">${hasCustomName ? `${baseName} | ` : ""}${speciesLabel} | ${escapeHtml(levelLabel)} | ${escapeHtml(attackLabel)}</p>`,
    `<div class="boxes-mobile-selection-badges">`,
    `<span class="boxes-mobile-selection-badge">${escapeHtml(captureLabel)}</span>`,
    `<span class="boxes-mobile-selection-badge">${escapeHtml(context?.currentTargetName || "Pokemon")}</span>`,
    `</div>`,
    typeChips ? `<div class="boxes-mobile-selection-types">${typeChips}</div>` : "",
    `</div>`,
    `</article>`,
  ].join("");
}

function clearBoxesPendingSelection(options = {}) {
  state.ui.boxesHoverEntityId = null;
  setBoxesInfoFromEntry(null);
  renderBoxesMobileSelectionState(null);
  if (options?.rerender) {
    renderBoxesGrid();
  }
}

function applyBoxesEntrySelection(entry, context = getBoxesSelectionContext()) {
  if (!entry || !state.saveData) {
    return false;
  }

  const selectionState = getBoxesEntrySelectionState(entry, context);
  if (selectionState.unavailable) {
    setTopMessage("Pokemon indisponible dans les routes chargees.", 1600);
    return false;
  }
  if (selectionState.inAnotherSlot) {
    setTopMessage("Impossible: ce Pokemon est deja dans l'equipe.", 1600);
    return false;
  }
  if (selectionState.familyConflictSlotIndex >= 0) {
    setTopMessage("Impossible: un Pokemon de la meme famille est deja dans l'equipe.", 1700);
    return false;
  }

  const targetIndex = clamp(
    toSafeInt(context?.targetSlotIndex, -1),
    -1,
    Math.max(0, Number(context?.targetTeamSize || MAX_TEAM_SIZE) - 1),
  );
  if (targetIndex < 0) {
    return false;
  }

  const activeTeamIds = Array.isArray(context?.activeTeamIds) ? context.activeTeamIds : [];
  const currentId = Number(activeTeamIds[targetIndex] || 0);
  if (currentId === Number(entry.id || 0)) {
    closeBoxesModal();
    return true;
  }

  const capturedRecord = getPokemonEntityRecord(entry.id);
  if (!capturedRecord || !isEntityUnlocked(capturedRecord)) {
    setTopMessage("Pokemon non disponible dans la boite.", 1500);
    return false;
  }

  const duplicateIndex = activeTeamIds.findIndex((pokemonId, index) => index !== targetIndex && Number(pokemonId || 0) === Number(entry.id || 0));
  if (duplicateIndex >= 0) {
    setTopMessage("Impossible: ce Pokemon est deja dans l'equipe.", 1600);
    renderBoxesGrid();
    return false;
  }

  const duplicateFamilyIndex = findFamilyConflictSlotIndexInTeamIds(activeTeamIds, entry.id, targetIndex);
  if (duplicateFamilyIndex >= 0) {
    setTopMessage("Impossible: un Pokemon de la meme famille est deja dans l'equipe.", 1700);
    renderBoxesGrid();
    return false;
  }

  if (context?.boxesMode === "trainer_battle") {
    const nextSelectedTeamIds = getTrainerBattleSelectedTeamIds();
    nextSelectedTeamIds[targetIndex] = entry.id;
    state.trainerBattle.selectedTeamIds = nextSelectedTeamIds;
    state.trainerBattle.setupTargetSlotIndex = targetIndex;
    closeBoxesModal();
    renderTrainerBattleSetupModal();
    return true;
  }

  const oldName = currentId > 0 ? getPokemonDisplayNameForOwnedEntity(currentId) : "Pokemon";
  state.saveData.team[targetIndex] = entry.id;
  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();
  render();
  closeBoxesModal();
  setTopMessage(
    "Equipe mise a jour: " + oldName + " -> " + entry.nameFr + " (" + getTeamSlotLabel(targetIndex) + ")",
    1700,
  );
  return true;
}

function confirmBoxesSelection() {
  const pendingId = Number(state.ui.boxesHoverEntityId || 0);
  if (pendingId <= 0) {
    return false;
  }
  const entry = getCapturedEntityBoxesEntries().find((candidate) => Number(candidate?.id || 0) === pendingId) || null;
  if (!entry) {
    setTopMessage("Pokemon non disponible dans la boite.", 1500);
    clearBoxesPendingSelection({ rerender: true });
    return false;
  }
  return applyBoxesEntrySelection(entry);
}

function setBoxesInfoFromEntry(entry) {
  if (!boxesInfoPanelEl) {
    return;
  }
  if (!entry) {
    boxesInfoPanelEl.classList.add("is-empty");
    boxesInfoPanelEl.classList.remove("is-sheet-open");
    boxesInfoPanelEl.innerHTML = [
      `<article class="pokemon-info-card pokemon-info-card--empty">`,
      `<p class="pokemon-info-empty-title">Infos Pokemon</p>`,
      `<p class="pokemon-info-empty-text">Selectionne un Pokemon de la boite pour afficher ses details.</p>`,
      `</article>`,
    ].join("");
    return;
  }

  const talent = resolveTalentDefinition(entry?.talent, entry?.id);
  const baseTotal = getBaseStatTotal(entry.baseStats);
  const displayName = escapeHtml(String(entry?.nameFr || ""));
  const baseName = escapeHtml(String(entry?.baseNameFr || ""));
  const speciesId = Math.max(0, toSafeInt(entry?.id, 0));
  const speciesLabel = `#${String(speciesId).padStart(3, "0")}`;
  const hasCustomName = Boolean(entry?.hasCustomName && baseName && baseName !== displayName);

  const levelValue = Math.max(1, toSafeInt(entry?.level, 1));
  const xpCurrent = Math.max(0, toSafeInt(entry?.xp, 0));
  const xpToNext = Math.max(1, toSafeInt(entry?.xpToNext, 1));
  const xpLabel = levelValue >= MAX_LEVEL
    ? "Niveau max"
    : `${formatCompactNumber(xpCurrent, { decimalsSmall: 2, decimalsMedium: 1, decimalsLarge: 0 })}/${formatCompactNumber(xpToNext, { decimalsSmall: 2, decimalsMedium: 1, decimalsLarge: 0 })} vers niv. ${Math.min(MAX_LEVEL, levelValue + 1)}`;

  const talentLabel = escapeHtml(formatTalentLabelFr(talent, entry?.id));
  const talentDescription = escapeHtml(String(talent.descriptionFr || TALENT_NONE_DESCRIPTION_FR));
  const typeSummaryMarkup = buildPokemonTypeSummaryMarkup(entry.defensiveTypes, entry.offensiveType);
  const attackModeMarkup = buildPokemonAttackModeMarkup(entry?.attackMode);

  const buildMicroStat = (label, value, toneClass = "") => [
    `<div class="pokemon-info-micro${toneClass ? ` ${toneClass}` : ""}">`,
    `<span class="pokemon-info-micro-label">${escapeHtml(String(label || ""))}</span>`,
    `<span class="pokemon-info-micro-value">${value}</span>`,
    `</div>`,
  ].join("");

  const baseStatsCards = STAT_KEYS.map((statKey) => buildMicroStat(
    STAT_LABELS_FR[statKey],
    formatCompactNumber(entry.stats[statKey], {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    }),
    "pokemon-info-micro--stat",
  )).join("");

  const progressionCards = [
    buildMicroStat(
      "Rencontres",
      `${formatCompactNumber(entry.encounteredTotal)} (N ${formatCompactNumber(entry.encounteredNormal)} / S ${formatCompactNumber(entry.encounteredShiny)})`,
      "pokemon-info-micro--wide",
    ),
    buildMicroStat(
      "Battus",
      `${formatCompactNumber(entry.defeatedTotal)} (N ${formatCompactNumber(entry.defeatedNormal)} / S ${formatCompactNumber(entry.defeatedShiny)})`,
      "pokemon-info-micro--wide",
    ),
    buildMicroStat(
      "Captures",
      `${formatCompactNumber(entry.capturedTotal)} (N ${formatCompactNumber(entry.capturedNormal)} / S ${formatCompactNumber(entry.capturedShiny)})`,
      "pokemon-info-micro--wide",
    ),
    buildMicroStat(
      "Ultra shiny",
      formatCompactNumber(Math.max(0, toSafeInt(entry.capturedUltraShiny, 0))),
      "pokemon-info-micro--ultra",
    ),
  ].join("");

  boxesInfoPanelEl.classList.remove("is-empty");
  boxesInfoPanelEl.classList.remove("is-sheet-open");
  boxesInfoPanelEl.innerHTML = [
    `<article class="pokemon-info-card pokemon-info-card--boxes">`,
    `<header class="pokemon-info-head">`,
    `<div class="pokemon-info-title-wrap">`,
    `<h3 class="pokemon-info-title">${displayName || speciesLabel}</h3>`,
    `<p class="pokemon-info-subtitle">${hasCustomName ? `${baseName} | ${speciesLabel}` : speciesLabel}</p>`,
    `</div>`,
    `<div class="pokemon-info-badges">`,
    `<span class="pokemon-info-badge is-active">Niv. ${formatCompactNumber(levelValue)}</span>`,
    `<span class="pokemon-info-badge pokemon-info-badge--ultra is-active">BST ${formatCompactNumber(Math.round(baseTotal))}</span>`,
    `</div>`,
    `</header>`,
    `<div class="pokemon-info-feature-grid">`,
    `<div class="pokemon-info-zone pokemon-info-zone--types">`,
    `<span class="pokemon-info-zone-label">Types</span>`,
    typeSummaryMarkup,
    `</div>`,
    attackModeMarkup,
    `<p class="pokemon-info-hint">`,
    `<span class="pokemon-info-hint-label">Talent</span>`,
    `<span class="pokemon-info-hint-value">${talentLabel}</span>`,
    `<span class="pokemon-info-hint-meta">${talentDescription}</span>`,
    `</p>`,
    `</div>`,
    `<section class="pokemon-info-block">`,
    `<h4 class="pokemon-info-block-title">Progression</h4>`,
    `<div class="pokemon-info-micro-grid pokemon-info-micro-grid--summary">`,
    buildMicroStat("XP", xpLabel, "pokemon-info-micro--wide pokemon-info-micro--accent"),
    progressionCards,
    `</div>`,
    `</section>`,
    `<section class="pokemon-info-block">`,
    `<h4 class="pokemon-info-block-title">Stats actuelles</h4>`,
    `<div class="pokemon-info-micro-grid pokemon-info-micro-grid--stats">${baseStatsCards}</div>`,
    `</section>`,
    `</article>`,
  ].join("");
}

function closeBoxesModal() {
  const previousMode = String(state.ui.boxesMode || "team").toLowerCase().trim();
  const shouldReturnToTrainerSetup =
    previousMode === "trainer_battle"
    && Boolean(state.ui.trainerBattleSetupOpen)
    && Boolean(trainerBattleSetupModalEl);
  state.ui.boxesOpen = false;
  state.ui.boxesMode = "team";
  state.ui.boxesTargetSlotIndex = -1;
  state.ui.boxesHoverEntityId = null;
  clearBoxesSearchQuery();
  if (boxesModalEl) {
    hideModalWithTween(boxesModalEl);
  }
  if (boxesSubtitleEl) {
    boxesSubtitleEl.textContent = normalizeUiDisplayText("Choisis un Pokemon pour remplacer ton slot d equipe.", {
      frenchTypography: true,
    });
  }
  if (boxesShinyCounterEl) {
    boxesShinyCounterEl.textContent = "Captures shiny (global): 0";
  }
  if (boxesGridEl) {
    boxesGridEl.innerHTML = "";
  }
  setBoxesInfoFromEntry(null);
  renderBoxesMobileSelectionState(null);
  if (shouldReturnToTrainerSetup) {
    renderTrainerBattleSetupModal();
    showModalWithTween(trainerBattleSetupModalEl);
  }
}

function renderBoxesGrid() {
  if (!boxesGridEl || !state.saveData) {
    return;
  }
  const context = getBoxesSelectionContext();
  const {
    useCompactSelectionUi,
    boxesMode,
    activeTeamIds,
    targetSlotIndex,
    currentTargetId,
    currentTargetName,
  } = context;
  const allEntries = getCapturedEntityBoxesEntries();
  const entries = getFilteredBoxesEntries(allEntries);
  const searchQuery = String(state.ui?.boxesSearchQuery || "");
  if (boxesSubtitleEl) {
    let subtitle = "";
    if (targetSlotIndex >= 0) {
      subtitle = boxesMode === "trainer_battle"
        ? (
          "Preparation combat | "
          + getTeamSlotLabel(targetSlotIndex)
          + " ("
          + currentTargetName
          + ") | "
          + String(entries.length)
          + (searchQuery.trim() ? " / " + String(allEntries.length) : "")
          + " entites capturees"
        )
        : (
          "Remplacement "
          + getTeamSlotLabel(targetSlotIndex)
          + " ("
          + currentTargetName
          + ") | "
          + String(entries.length)
          + (searchQuery.trim() ? " / " + String(allEntries.length) : "")
          + " entites capturees"
        );
    } else {
      subtitle = boxesMode === "trainer_battle"
        ? (
          "Boite combat dresseur | "
          + String(entries.length)
          + (searchQuery.trim() ? " / " + String(allEntries.length) : "")
          + " entites capturees"
        )
        : (
          "Boite complete | "
          + String(entries.length)
          + (searchQuery.trim() ? " / " + String(allEntries.length) : "")
          + " entites capturees"
        );
    }
    boxesSubtitleEl.textContent = normalizeUiDisplayText(subtitle, {
      frenchTypography: true,
    });
  }
  if (boxesShinyCounterEl) {
    const shinyCapturesTotal = getTotalShinyCapturesGlobal();
    boxesShinyCounterEl.textContent = "Captures shiny (global): " + String(shinyCapturesTotal);
  }

  boxesGridEl.innerHTML = "";
  if (allEntries.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "boxes-empty";
    emptyEl.textContent = normalizeUiDisplayText("Aucun Pokemon capture pour le moment.", {
      frenchTypography: true,
    });
    boxesGridEl.appendChild(emptyEl);
    setBoxesInfoFromEntry(null);
    renderBoxesMobileSelectionState(null, context);
    return;
  }

  if (entries.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "boxes-empty";
    emptyEl.textContent = normalizeUiDisplayText("Aucun Pokemon ne correspond a la recherche.", {
      frenchTypography: true,
    });
    boxesGridEl.appendChild(emptyEl);
    const pendingEntry = allEntries.find((entry) => entry.id === Number(state.ui.boxesHoverEntityId || 0)) || null;
    setBoxesInfoFromEntry(pendingEntry);
    renderBoxesMobileSelectionState(pendingEntry, context);
    return;
  }

  let hoverEntry = entries.find((entry) => entry.id === Number(state.ui.boxesHoverEntityId || 0))
    || allEntries.find((entry) => entry.id === Number(state.ui.boxesHoverEntityId || 0))
    || null;
  if (!hoverEntry && !useCompactSelectionUi) {
    hoverEntry = entries.find((entry) => entry.id === currentTargetId) || entries[0];
  }

  for (const entry of entries) {
    const selectionState = getBoxesEntrySelectionState(entry, context);
    const {
      isCurrent,
      selectedSlotIndex,
      inAnotherSlot,
      unavailable,
      familyConflictSlotIndex,
      hasFamilyConflict,
    } = selectionState;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "boxes-mon-btn";
    button.dataset.boxEntityId = String(entry.id);
    if (isCurrent) {
      button.classList.add("is-current");
    }
    if (entry.id === Number(state.ui.boxesHoverEntityId || 0)) {
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }
    if (inAnotherSlot || unavailable || hasFamilyConflict) {
      button.classList.add("is-disabled");
      button.disabled = true;
    }

    const visualWrap = document.createElement("div");
    visualWrap.className = "boxes-mon-visual";

    if (entry.spritePath) {
      const image = document.createElement("img");
      image.alt = entry.nameFr;
      image.src = entry.spritePath;
      visualWrap.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "boxes-mon-fallback";
      fallback.textContent = entry.nameFr.slice(0, 1).toUpperCase();
      visualWrap.appendChild(fallback);
    }

    if (entry.shinyModeUnlocked || entry.ultraShinyModeUnlocked) {
      const badgeRow = document.createElement("span");
      badgeRow.className = "boxes-mode-badges";
      if (entry.shinyModeUnlocked) {
        const shinyBadge = document.createElement("span");
        shinyBadge.className = "boxes-mode-badge boxes-mode-badge-shiny";
        shinyBadge.textContent = "\u2726";
        shinyBadge.title = "Mode shiny débloqué";
        badgeRow.appendChild(shinyBadge);
      }
      if (entry.ultraShinyModeUnlocked) {
        const ultraBadge = document.createElement("span");
        ultraBadge.className = "boxes-mode-badge boxes-mode-badge-ultra";
        ultraBadge.textContent = "\u2726";
        ultraBadge.title = "Mode ultra shiny débloqué";
        badgeRow.appendChild(ultraBadge);
      }
      visualWrap.appendChild(badgeRow);
    }
    appendPokemonAttackModeBadge(visualWrap, entry.attackMode);
    button.appendChild(visualWrap);

    const nameEl = document.createElement("span");
    nameEl.className = "boxes-mon-name";
    nameEl.textContent = entry.nameFr;
    button.appendChild(nameEl);
    if (entry.hasCustomName) {
      const originalNameEl = document.createElement("span");
      originalNameEl.className = "boxes-mon-original-name";
      originalNameEl.textContent = entry.baseNameFr;
      button.appendChild(originalNameEl);
    }

    const levelEl = document.createElement("span");
    levelEl.className = "boxes-mon-line";
    levelEl.textContent = "Niv. " + String(entry.level);
    button.appendChild(levelEl);

    const captureEl = document.createElement("span");
    captureEl.className = "boxes-mon-line";
    captureEl.textContent = "Captures: " + String(entry.capturedTotal);
    button.appendChild(captureEl);

    const tagEl = document.createElement("span");
    tagEl.className = "boxes-mon-tag";
    if (unavailable) {
      tagEl.textContent = "Indispo dans cette version";
    } else if (inAnotherSlot) {
      tagEl.textContent = "Deja en " + getTeamSlotLabel(selectedSlotIndex);
    } else if (hasFamilyConflict) {
      tagEl.textContent = "Famille deja en " + getTeamSlotLabel(familyConflictSlotIndex);
    } else if (isCurrent) {
      tagEl.textContent = boxesMode === "trainer_battle" ? "Choix actuel" : "Slot actuel";
    } else {
      tagEl.textContent = "Choisir";
    }
    button.appendChild(tagEl);

    button.addEventListener("mouseenter", () => {
      state.ui.boxesHoverEntityId = entry.id;
      setBoxesInfoFromEntry(entry);
    });
    button.addEventListener("focus", () => {
      state.ui.boxesHoverEntityId = entry.id;
      setBoxesInfoFromEntry(entry);
    });
    button.addEventListener("click", () => {
      if (useCompactSelectionUi) {
        state.ui.boxesHoverEntityId = entry.id;
        setBoxesInfoFromEntry(entry);
        renderBoxesMobileSelectionState(entry, context);
        renderBoxesGrid();
        return;
      }
      applyBoxesEntrySelection(entry, context);
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (boxesMode === "trainer_battle") {
        setTopMessage("Apparence indisponible pendant la preparation du combat.", 1700);
        return;
      }
      if (unavailable) {
        setTopMessage("Pokemon indisponible dans les routes chargees.", 1600);
        return;
      }
      state.ui.boxesHoverEntityId = entry.id;
      setBoxesInfoFromEntry(entry);
      openAppearanceForBoxPokemon(entry.id);
    });

    boxesGridEl.appendChild(button);
  }

  setBoxesInfoFromEntry(hoverEntry);
  renderBoxesMobileSelectionState(hoverEntry, context);
}

function openBoxesForTeamSlot(slotIndex) {
  if (!boxesModalEl || !state.saveData || !Array.isArray(state.saveData.team)) {
    return;
  }
  if (isTrainerBattleUiLocked()) {
    setTopMessage("Equipe verrouillee pendant un combat de dresseur.", 1800);
    return;
  }
  const index = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const currentId = Number(state.saveData.team[index] || 0);
  if (index < 0 || currentId <= 0) {
    return;
  }
  const boxesAccess = getTeamBoxesAccessState();
  if (!boxesAccess.allowed) {
    setTopMessage(getTeamBoxesLockedMessage(), 2100);
    return;
  }

  closeTeamContextMenu();
  clearCanvasHoverState();
  closeRenameModal();
  setShopOpen(false);
  state.ui.boxesOpen = true;
  state.ui.boxesMode = "team";
  state.ui.boxesTargetSlotIndex = index;
  state.ui.boxesHoverEntityId = isPhoneUiViewport() ? null : currentId;
  bindBoxesSearchEventsIfNeeded();
  syncBoxesSearchInputValue();
  showModalWithTween(boxesModalEl);
  renderBoxesGrid();
}

function openBoxesForTrainerBattleSlot(slotIndex) {
  if (!boxesModalEl || !state.saveData || !state.ui?.trainerBattleSetupOpen) {
    return false;
  }
  const teamSize = getTrainerBattleTeamSizeCount();
  const index = clamp(toSafeInt(slotIndex, -1), -1, teamSize - 1);
  if (index < 0) {
    return false;
  }
  const selectedTeamIds = getTrainerBattleSelectedTeamIds();
  const currentId = Number(selectedTeamIds[index] || 0);
  closeTeamContextMenu();
  clearCanvasHoverState();
  closeRenameModal();
  setShopOpen(false);
  state.ui.boxesOpen = true;
  state.ui.boxesMode = "trainer_battle";
  state.ui.boxesTargetSlotIndex = index;
  state.ui.boxesHoverEntityId = isPhoneUiViewport() ? null : (currentId > 0 ? currentId : null);
  state.trainerBattle.setupTargetSlotIndex = index;
  if (trainerBattleSetupModalEl) {
    hideModalWithTween(trainerBattleSetupModalEl);
  }
  bindBoxesSearchEventsIfNeeded();
  syncBoxesSearchInputValue();
  showModalWithTween(boxesModalEl);
  renderBoxesGrid();
  return true;
}

function renderTrainerBattleSetupModal() {
  if (
    !trainerBattleSetupRosterEl
    || !trainerBattleSetupRulesEl
    || !trainerBattleSetupSlotsEl
    || !trainerBattleSetupStatusEl
    || !trainerBattleSetupConfirmButtonEl
  ) {
    return;
  }
  const definition = typeof getTrainerBattleSetupDefinition === "function"
    ? getTrainerBattleSetupDefinition()
    : null;
  const trainerNameFr = normalizeUiDisplayText(
    String(definition?.trainer_name_fr || "Dresseur"),
    { frenchTypography: true },
  );
  const teamSize = getTrainerBattleTeamSizeCount();
  const selectedTeamIds = getTrainerBattleSelectedTeamIds();
  const normalizedSelection = Array.from({ length: teamSize }, (_, index) => Number(selectedTeamIds[index] || 0));
  let validSelectionCount = 0;
  let familyConflictSlotIndex = -1;
  const seenFamilies = new Set();

  for (let index = 0; index < normalizedSelection.length; index += 1) {
    const pokemonId = Number(normalizedSelection[index] || 0);
    if (pokemonId <= 0 || !isEntityUnlocked(getPokemonEntityRecord(pokemonId))) {
      continue;
    }
    const familyIds = getEvolutionFamilySpeciesIds(pokemonId);
    const familyKey = String(
      Math.min(...(familyIds.length > 0 ? familyIds : [pokemonId]).map((id) => Number(id || 0)).filter((id) => id > 0)),
    );
    if (seenFamilies.has(familyKey)) {
      familyConflictSlotIndex = index;
      continue;
    }
    seenFamilies.add(familyKey);
    validSelectionCount += 1;
  }

  const selectionReady = validSelectionCount === teamSize && familyConflictSlotIndex < 0;

  if (trainerBattleSetupTitleEl) {
    trainerBattleSetupTitleEl.textContent = normalizeUiDisplayText(
      `Combat contre ${trainerNameFr}`,
      { frenchTypography: true },
    );
  }
  if (trainerBattleSetupSubtitleEl) {
    trainerBattleSetupSubtitleEl.textContent = normalizeUiDisplayText(
      `Prépare ${teamSize} Pokémon temporaires pour ce combat de dresseur.`,
      { frenchTypography: true },
    );
  }

  trainerBattleSetupRosterEl.innerHTML = "";
  const rosterEntries = Array.isArray(definition?.roster) ? definition.roster : [];
  for (const rosterEntry of rosterEntries) {
    const pokemonId = Number(rosterEntry?.pokemon_id || 0);
    const def = state.pokemonDefsById.get(pokemonId) || null;
    const cardEl = document.createElement("article");
    cardEl.className = "trainer-battle-setup-roster-card";
    const spriteWrapEl = document.createElement("div");
    spriteWrapEl.className = "trainer-battle-setup-roster-visual";
    const spritePath = String(def?.spritePath || "").trim();
    if (spritePath) {
      const spriteEl = document.createElement("img");
      spriteEl.src = spritePath;
      spriteEl.alt = String(def?.nameFr || `Pokemon ${pokemonId}`);
      spriteWrapEl.appendChild(spriteEl);
    } else {
      const fallbackEl = document.createElement("span");
      fallbackEl.className = "boxes-mon-fallback";
      fallbackEl.textContent = String(def?.nameFr || `Pokemon ${pokemonId}`).slice(0, 1).toUpperCase();
      spriteWrapEl.appendChild(fallbackEl);
    }
    const copyEl = document.createElement("div");
    copyEl.className = "trainer-battle-setup-roster-copy";
    const nameEl = document.createElement("strong");
    nameEl.textContent = normalizeUiDisplayText(String(def?.nameFr || `Pokemon ${pokemonId}`), {
      frenchTypography: true,
    });
    const levelEl = document.createElement("span");
    levelEl.textContent = normalizeUiDisplayText(`Niv. ${Math.max(1, toSafeInt(rosterEntry?.level, 1))}`, {
      frenchTypography: true,
    });
    copyEl.appendChild(nameEl);
    copyEl.appendChild(levelEl);
    cardEl.appendChild(spriteWrapEl);
    cardEl.appendChild(copyEl);
    trainerBattleSetupRosterEl.appendChild(cardEl);
  }

  trainerBattleSetupRulesEl.innerHTML = "";
  const ruleLines = [
    `${teamSize} Pokémon exactement.`,
    "Pas deux Pokémon de la même famille.",
    `Timer de ${Math.max(1, Math.round(Number(TRAINER_BATTLE_ENEMY_TIMER_MS || 0) / 1000))} s par adversaire.`,
    `PV des Pokémon de dresseur x${Math.max(1, Number(TRAINER_BATTLE_ENEMY_HP_MULTIPLIER || 1))}.`,
    "Aucune capture et aucune Poké Ball lancée.",
    "Ton équipe normale revient à la fin du combat.",
  ];
  for (const line of ruleLines) {
    const ruleEl = document.createElement("p");
    ruleEl.className = "trainer-battle-setup-rule";
    ruleEl.textContent = normalizeUiDisplayText(line, { frenchTypography: true });
    trainerBattleSetupRulesEl.appendChild(ruleEl);
  }

  trainerBattleSetupSlotsEl.innerHTML = "";
  for (let index = 0; index < teamSize; index += 1) {
    const pokemonId = Number(normalizedSelection[index] || 0);
    const def = pokemonId > 0 ? state.pokemonDefsById.get(pokemonId) || null : null;
    const record = pokemonId > 0 ? getPokemonEntityRecord(pokemonId) : null;
    const buttonEl = document.createElement("button");
    buttonEl.type = "button";
    buttonEl.className = "trainer-battle-setup-slot";
    buttonEl.dataset.trainerBattleSlotIndex = String(index);

    const slotKickerEl = document.createElement("span");
    slotKickerEl.className = "trainer-battle-setup-slot-kicker";
    slotKickerEl.textContent = normalizeUiDisplayText(`Slot ${index + 1}`, { frenchTypography: true });
    buttonEl.appendChild(slotKickerEl);

    if (pokemonId > 0 && def && isEntityUnlocked(record)) {
      const visualEl = document.createElement("div");
      visualEl.className = "trainer-battle-setup-slot-visual";
      if (def.spritePath) {
        const spriteEl = document.createElement("img");
        spriteEl.src = def.spritePath;
        spriteEl.alt = def.nameFr;
        visualEl.appendChild(spriteEl);
      }
      const copyEl = document.createElement("div");
      copyEl.className = "trainer-battle-setup-slot-copy";
      const nameEl = document.createElement("strong");
      nameEl.textContent = normalizeUiDisplayText(getPokemonDisplayNameForOwnedEntity(pokemonId), {
        frenchTypography: true,
      });
      const metaEl = document.createElement("span");
      metaEl.textContent = normalizeUiDisplayText(
        `${def.nameFr} • Niv. ${Math.max(1, toSafeInt(record?.level, 1))}`,
        { frenchTypography: true },
      );
      const hintEl = document.createElement("span");
      hintEl.className = "trainer-battle-setup-slot-hint";
      hintEl.textContent = normalizeUiDisplayText("Changer dans les boîtes", { frenchTypography: true });
      copyEl.appendChild(nameEl);
      copyEl.appendChild(metaEl);
      copyEl.appendChild(hintEl);
      buttonEl.appendChild(visualEl);
      buttonEl.appendChild(copyEl);
    } else {
      buttonEl.classList.add("is-empty");
      const emptyEl = document.createElement("span");
      emptyEl.className = "trainer-battle-setup-slot-empty";
      emptyEl.textContent = normalizeUiDisplayText("Choisir un Pokémon dans les boîtes", {
        frenchTypography: true,
      });
      buttonEl.appendChild(emptyEl);
    }

    trainerBattleSetupSlotsEl.appendChild(buttonEl);
  }

  if (familyConflictSlotIndex >= 0) {
    trainerBattleSetupStatusEl.textContent = normalizeUiDisplayText(
      `Conflit de famille détecté dans le slot ${familyConflictSlotIndex + 1}.`,
      { frenchTypography: true },
    );
    trainerBattleSetupStatusEl.classList.add("is-error");
    trainerBattleSetupStatusEl.classList.remove("is-ready");
  } else if (selectionReady) {
    trainerBattleSetupStatusEl.textContent = normalizeUiDisplayText(
      "Équipe prête. Le combat utilisera seulement cette sélection temporaire.",
      { frenchTypography: true },
    );
    trainerBattleSetupStatusEl.classList.add("is-ready");
    trainerBattleSetupStatusEl.classList.remove("is-error");
  } else {
    trainerBattleSetupStatusEl.textContent = normalizeUiDisplayText(
      `Sélection actuelle: ${validSelectionCount}/${teamSize}.`,
      { frenchTypography: true },
    );
    trainerBattleSetupStatusEl.classList.remove("is-ready", "is-error");
  }

  trainerBattleSetupConfirmButtonEl.disabled = !selectionReady || !definition;
  trainerBattleSetupConfirmButtonEl.setAttribute(
    "aria-disabled",
    trainerBattleSetupConfirmButtonEl.disabled ? "true" : "false",
  );
}

function closeAppearanceModal() {
  state.ui.appearanceOpen = false;
  state.ui.appearanceTargetSlotIndex = -1;
  state.ui.appearancePokemonId = null;
  if (appearanceModalEl) {
    hideModalWithTween(appearanceModalEl);
  }
  if (appearanceGridEl) {
    appearanceGridEl.innerHTML = "";
  }
}

function openAppearanceForPokemon(pokemonId, options = {}) {
  if (!appearanceModalEl || !state.saveData) {
    return false;
  }
  if (isTrainerBattleUiLocked()) {
    setTopMessage("Impossible de changer l'apparence pendant un combat de dresseur.", 1800);
    return false;
  }
  if (!isAppearanceEditorUnlocked()) {
    setTopMessage(
      `Atteins le niveau ${APPEARANCE_UNLOCK_LEVEL} avec un Pokemon pour debloquer l'apparence.`,
      1900,
    );
    return false;
  }

  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const record = getPokemonEntityRecord(id);
  const def = state.pokemonDefsById.get(id);
  if (!record || !def) {
    return false;
  }

  const preferredSlotIndex = clamp(toSafeInt(options.preferredSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  closeTeamContextMenu();
  clearCanvasHoverState();
  closeRenameModal();
  setShopOpen(false);
  state.ui.appearanceOpen = true;
  state.ui.appearanceTargetSlotIndex = preferredSlotIndex;
  state.ui.appearancePokemonId = id;
  showModalWithTween(appearanceModalEl);
  renderAppearanceModal();
  return true;
}

function renderAppearanceModal() {
  if (!appearanceGridEl || !state.saveData) {
    return;
  }

  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const def = state.pokemonDefsById.get(pokemonId);
  const record = getPokemonEntityRecord(pokemonId);
  if (!def || !record) {
    closeAppearanceModal();
    return;
  }

  const appearanceChanged = reconcileAppearanceForEntityRecord(record, pokemonId);
  const variants = getSpriteVariantsForDef(def);
  if (appearanceChanged) {
    rebuildTeamAndSyncBattle();
    persistSaveData();
  }

  const ownedVariants = getOwnedSpriteVariantsForRecord(record, def);
  const ownedSet = new Set(ownedVariants.map((variant) => variant.id));
  const selectedVariant = getSelectedOwnedSpriteVariantForRecord(record, def);
  const appearanceUnlockState = getAppearanceUnlockState(pokemonId);
  const shinyUnlocked = appearanceUnlockState.shinyUnlocked;
  const ultraShinyUnlocked = appearanceUnlockState.ultraUnlocked;
  const shinyCapturesFamily = appearanceUnlockState.familyShinyCaptures;
  const ultraShinyCapturesFamily = appearanceUnlockState.familyUltraShinyCaptures;
  const shinySource = appearanceUnlockState.shinySource;
  const ultraSource = appearanceUnlockState.ultraSource;
  const shinyModeActive = Boolean(record.appearance_shiny_mode && shinyUnlocked);
  const ultraShinyModeActive = Boolean(record.appearance_ultra_shiny_mode && ultraShinyUnlocked);
  const selectedHasShiny = Boolean(getVariantShinySpritePath(def, selectedVariant));

  if (appearanceTitleEl) {
    appearanceTitleEl.textContent = `Apparence | ${def.nameFr}`;
  }
  if (appearanceSubtitleEl) {
    appearanceSubtitleEl.textContent = ownedVariants.length < variants.length
      ? `${ownedVariants.length}/${variants.length} sprites d\u00e9bloqu\u00e9s. \u00c9quipe le skin actif et passe par la gacha pour le reste.`
      : `${ownedVariants.length}/${variants.length} sprites d\u00e9bloqu\u00e9s. Tous les skins de cette esp\u00e8ce sont pr\u00eats.`;
  }
  if (appearanceShinyToggleButtonEl) {
    appearanceShinyToggleButtonEl.disabled = !shinyUnlocked;
    appearanceShinyToggleButtonEl.textContent = shinyModeActive ? "Shiny famille ON" : "Shiny famille OFF";
  }
  if (appearanceUltraShinyToggleButtonEl) {
    appearanceUltraShinyToggleButtonEl.disabled = !ultraShinyUnlocked;
    appearanceUltraShinyToggleButtonEl.textContent = ultraShinyModeActive
      ? "Ultra famille ON"
      : "Ultra famille OFF";
  }
  if (appearanceShinyStatusEl) {
    if (!shinyUnlocked) {
      appearanceShinyStatusEl.textContent = "Capture un shiny de la famille evolutive pour debloquer ce mode.";
    } else if (shinySource === "legacy" && ultraSource === "none") {
      appearanceShinyStatusEl.textContent =
        shinyModeActive
          ? "Mode shiny herite d'une ancienne sauvegarde."
          : "Mode shiny herite d'une ancienne sauvegarde. Active le mode shiny si voulu.";
    } else if (shinySource === "legacy" && ultraSource === "current_save") {
      appearanceShinyStatusEl.textContent =
        ultraShinyModeActive
          ? `Ultra shiny actif (famille: ${ultraShinyCapturesFamily} capture ultra shiny). Mode shiny herite d'une ancienne sauvegarde.`
          : `Mode shiny herite d'une ancienne sauvegarde. Mode ultra shiny debloque via tes captures actuelles (${ultraShinyCapturesFamily}).`;
    } else if (shinySource === "legacy" && ultraSource === "legacy" && ultraShinyModeActive) {
      appearanceShinyStatusEl.textContent =
        "Mode ultra shiny herite d'une ancienne sauvegarde.";
    } else if (shinySource === "legacy" && ultraSource === "legacy") {
      appearanceShinyStatusEl.textContent =
        "Modes shiny et ultra shiny herites d'une ancienne sauvegarde.";
    } else if (!ultraShinyUnlocked) {
      appearanceShinyStatusEl.textContent = shinyModeActive
        ? `Shiny famille debloque (${shinyCapturesFamily} capture). Capture un ultra shiny de la famille pour debloquer le mode ultra shiny.`
        : `Shiny famille debloque (${shinyCapturesFamily} capture). Active le mode shiny si voulu.`;
    } else if (shinyModeActive && !selectedHasShiny) {
      appearanceShinyStatusEl.textContent =
        `Shiny/ultra debloques (famille: ${shinyCapturesFamily} shiny, ${ultraShinyCapturesFamily} ultra). Ce sprite n'a pas de version shiny.`;
    } else if (ultraShinyModeActive) {
      appearanceShinyStatusEl.textContent =
        `Ultra shiny actif (famille: ${ultraShinyCapturesFamily} capture ultra shiny).`;
    } else if (shinyModeActive) {
      appearanceShinyStatusEl.textContent =
        `Shiny actif (famille: ${shinyCapturesFamily} capture${shinyCapturesFamily > 1 ? "s" : ""}).`;
    } else {
      appearanceShinyStatusEl.textContent =
        `Shiny/ultra debloques (famille: ${shinyCapturesFamily} shiny, ${ultraShinyCapturesFamily} ultra). Active un mode si voulu.`;
    }
  }

  appearanceGridEl.innerHTML = "";
  if (variants.length <= 0) {
    const empty = document.createElement("div");
    empty.className = "appearance-empty";
    empty.textContent = "Aucun sprite disponible pour cette espece.";
    appearanceGridEl.appendChild(empty);
    return;
  }

  for (const variant of variants) {
    const owned = ownedSet.has(variant.id);
    const selected = selectedVariant?.id === variant.id;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "appearance-card-btn";
    card.dataset.appearanceState = !owned ? "locked" : (selected ? "equipped" : "owned");
    if (owned) {
      card.classList.add("is-owned");
    } else {
      card.classList.add("is-locked");
    }
    if (selected) {
      card.classList.add("is-selected");
    }

    const preview = document.createElement("div");
    preview.className = "appearance-preview";
    if (owned) {
      const image = document.createElement("img");
      image.alt = `${def.nameFr} ${variant.labelFr}`;
      image.src = variant.frontPath;
      preview.appendChild(image);
    } else {
      if (variant.frontPath) {
        const silhouetteImage = document.createElement("img");
        silhouetteImage.alt = "Silhouette mystere";
        silhouetteImage.src = variant.frontPath;
        silhouetteImage.classList.add("is-silhouette");
        preview.appendChild(silhouetteImage);
      } else {
        const lockMark = document.createElement("span");
        lockMark.className = "appearance-lock-mark";
        lockMark.textContent = "?";
        preview.appendChild(lockMark);
      }
    }
    card.appendChild(preview);

    const stateEl = document.createElement("span");
    stateEl.className = "appearance-variant-state";
    stateEl.textContent = owned
      ? (selected ? "\u00c9quip\u00e9" : "D\u00e9bloqu\u00e9")
      : "Gacha";
    card.appendChild(stateEl);

    const name = document.createElement("span");
    name.className = "appearance-variant-name";
    name.textContent = owned ? getSpriteVariantDisplayLabel(variant) : "Skin mystere";
    card.appendChild(name);

    const action = document.createElement("span");
    action.className = "appearance-variant-action";
    if (owned) {
      action.textContent = selected ? "Actif" : "\u00c9quiper";
    } else {
      action.textContent = "Verrouill\u00e9";
    }
    card.appendChild(action);

    card.addEventListener("click", async () => {
      if (!state.saveData) {
        return;
      }
      const shouldLoadShinyAppearance = Boolean(
        (record.appearance_shiny_mode && isShinyAppearanceUnlockedForRecord(record, pokemonId))
        || (record.appearance_ultra_shiny_mode && isUltraShinyAppearanceUnlockedForRecord(record, pokemonId)),
      );

      if (!owned) {
        setTopMessage(`Skin verrouille. Utilise Machine Gacha (${GACHA_SPIN_COST_COINS} Coins).`, 1700);
        return;
      }

      if (selected) {
        return;
      }
      record.appearance_selected_variant = variant.id;
      reconcileAppearanceForEntityRecord(record, pokemonId);
      renderAppearanceModal();
      await ensureVariantAppearanceAssetsLoaded(def, variant, { includeShiny: shouldLoadShinyAppearance });
      rebuildTeamAndSyncBattle();
      persistSaveData();
      if (state.ui.boxesOpen) {
        renderBoxesGrid();
      }
      renderAppearanceModal();
      render();
      setTopMessage(`${def.nameFr}: sprite ${variant.labelFr} \u00e9quip\u00e9.`, 1400);
    });

    appearanceGridEl.appendChild(card);
  }
}

function openAppearanceForTeamSlot(slotIndex) {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return;
  }
  const index = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  if (index < 0) {
    return;
  }
  const pokemonId = Number(state.saveData.team[index] || 0);
  if (pokemonId <= 0) {
    return;
  }
  openAppearanceForPokemon(pokemonId, { preferredSlotIndex: index });
}

function openAppearanceForBoxPokemon(pokemonId) {
  const entries = getCapturedEntityBoxesEntries();
  const entry = entries.find((item) => Number(item.id) === Number(pokemonId || 0)) || null;
  if (!entry) {
    return false;
  }
  return openAppearanceForPokemon(entry.id, { preferredSlotIndex: entry.inTeamIndex });
}

async function toggleAppearanceShinyMode() {
  if (!state.saveData) {
    return;
  }
  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const record = getPokemonEntityRecord(pokemonId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!record || !def) {
    return;
  }
  if (!isShinyAppearanceUnlockedForRecord(record, pokemonId)) {
    setTopMessage("Capture un shiny de la famille evolutive pour debloquer ce mode.", 1700);
    renderAppearanceModal();
    return;
  }
  const nextShinyMode = !Boolean(record.appearance_shiny_mode);
  const nextUltraShinyMode = nextShinyMode ? Boolean(record.appearance_ultra_shiny_mode) : false;
  const familySyncResult = applyAppearanceModesToEvolutionFamily(pokemonId, {
    shinyMode: nextShinyMode,
    ultraShinyMode: nextUltraShinyMode,
  });
  const syncedRecord = getPokemonEntityRecord(pokemonId) || record;
  const selectedVariant = getSelectedOwnedSpriteVariantForRecord(syncedRecord, def);
  await ensureVariantAppearanceAssetsLoaded(def, selectedVariant, {
    includeShiny: Boolean(syncedRecord.appearance_shiny_mode || syncedRecord.appearance_ultra_shiny_mode),
  });
  await preloadSelectedAppearanceAssetsForTeam();
  rebuildTeamAndSyncBattle();
  persistSaveData();
  if (state.ui.boxesOpen) {
    renderBoxesGrid();
  }
  renderAppearanceModal();
  render();
  setTopMessage(
    syncedRecord.appearance_shiny_mode
      ? `${def.nameFr}: mode shiny actif pour la famille (${familySyncResult.familySize} Pokemon).`
      : `${def.nameFr}: mode shiny desactive pour la famille (${familySyncResult.familySize} Pokemon).`,
    1400,
  );
}

async function toggleAppearanceUltraShinyMode() {
  if (!state.saveData) {
    return;
  }
  const pokemonId = Number(state.ui.appearancePokemonId || 0);
  const record = getPokemonEntityRecord(pokemonId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!record || !def) {
    return;
  }
  if (!isUltraShinyAppearanceUnlockedForRecord(record, pokemonId)) {
    setTopMessage("Capture un ultra shiny de la famille evolutive pour debloquer ce mode.", 1800);
    renderAppearanceModal();
    return;
  }

  const nextUltraMode = !Boolean(record.appearance_ultra_shiny_mode);
  const nextShinyMode = nextUltraMode ? true : Boolean(record.appearance_shiny_mode);
  const familySyncResult = applyAppearanceModesToEvolutionFamily(pokemonId, {
    shinyMode: nextShinyMode,
    ultraShinyMode: nextUltraMode,
  });
  const syncedRecord = getPokemonEntityRecord(pokemonId) || record;

  const selectedVariant = getSelectedOwnedSpriteVariantForRecord(syncedRecord, def);
  await ensureVariantAppearanceAssetsLoaded(def, selectedVariant, {
    includeShiny: Boolean(syncedRecord.appearance_shiny_mode || syncedRecord.appearance_ultra_shiny_mode),
  });
  await preloadSelectedAppearanceAssetsForTeam();
  rebuildTeamAndSyncBattle();
  persistSaveData();
  if (state.ui.boxesOpen) {
    renderBoxesGrid();
  }
  renderAppearanceModal();
  render();
  setTopMessage(
    syncedRecord.appearance_ultra_shiny_mode
      ? `${def.nameFr}: mode ultra shiny actif pour la famille (${familySyncResult.familySize} Pokemon).`
      : `${def.nameFr}: mode ultra shiny desactive pour la famille (${familySyncResult.familySize} Pokemon).`,
    1500,
  );
}

function handleCanvasPointerDown(event) {
  if (!isPrimaryCanvasPointerEvent(event)) {
    return;
  }
  const canvasOverlayHitbox = getCanvasRuntimeOverlayHitboxFromPointerEvent(event);
  if (canvasOverlayHitbox) {
    setHoveredCanvasOverlayActionId(canvasOverlayHitbox?.interactive === false ? "" : String(canvasOverlayHitbox?.id || ""));
    return;
  }
  if (isCanvasBattleInteractionBlocked()) {
    clearTeamDragState();
    return;
  }
  cancelTeamContextTouchHold();
  closeTeamContextMenu();
  closeBallCaptureMenu();
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const hoveredBallOverlay = findHoveredBallOverlayHitbox(worldX, worldY);
  if (hoveredBallOverlay) {
    return;
  }
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot || !hoveredTeamSlot.member) {
    clearTeamDragState();
    return;
  }
  if (
    beginTeamDragForSlot(hoveredTeamSlot.slotIndex, {
      clientX: event.clientX,
      clientY: event.clientY,
      worldX,
      worldY,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
    })
  ) {
    captureCanvasPointer(event.pointerId);
    setHoveredBallOverlayType("");
    setHoveredTeamSlotIndex(hoveredTeamSlot.slotIndex);
    hideHoverPopup();
    scheduleTeamContextTouchHold(hoveredTeamSlot.slotIndex, hoveredTeamSlot.member, event);
  }
}

function handleCanvasPointerMove(event) {
  const pointerType = getNormalizedPointerType(event.pointerType);
  if (state.ui.teamDragActive && !isEventFromActiveTeamDragPointer(event)) {
    return;
  }
  if (isCanvasBattleInteractionBlocked()) {
    if (state.ui.teamDragActive) {
      clearTeamDragState();
    }
    clearCanvasHoverState();
    return;
  }

  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const layout = state.layout || computeLayout();
  if (state.ui.teamDragActive) {
    if (pointerType === "touch" && event.cancelable) {
      event.preventDefault();
    }
    state.ui.teamDragCurrentWorldX = worldX;
    state.ui.teamDragCurrentWorldY = worldY;
    const dx = Number(event.clientX || 0) - Number(state.ui.teamDragStartClientX || 0);
    const dy = Number(event.clientY || 0) - Number(state.ui.teamDragStartClientY || 0);
    const distanceSquared = dx * dx + dy * dy;
    if (isTouchLikePointerType(pointerType)) {
      updateTeamContextTouchHoldFromMove(event, worldX, worldY, layout);
    }
    let activationDistancePx = getTeamDragActivationDistancePx(pointerType);
    const activeTouchHoldPointerId = toSafeInt(state.ui.teamContextTouchHoldPointerId, -1);
    if (isTouchLikePointerType(pointerType) && activeTouchHoldPointerId === toSafeInt(event?.pointerId, -1)) {
      activationDistancePx = Math.max(
        activationDistancePx,
        getTeamContextTouchHoldCancelDistancePx(pointerType),
      );
    }
    const activationDistanceSquared = activationDistancePx * activationDistancePx;
    if (!state.ui.teamDragMoved && distanceSquared >= activationDistanceSquared) {
      cancelTeamContextTouchHold(event.pointerId);
      if (!isTeamSlotSwapAllowed()) {
        setTopMessage(getTeamBoxesLockedMessage(), 2100);
        clearTeamDragState({ suppressClickMs: TEAM_DRAG_CLICK_SUPPRESS_MS });
        setHoveredTeamSlotIndex(-1);
        hideHoverPopup();
        return;
      }
      state.ui.teamDragMoved = true;
      closeTeamContextMenu();
      closeBallCaptureMenu();
      syncCanvasInteractionCursor();
    }

    if (state.ui.teamDragMoved) {
      const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout, { pointerType });
      const sourceSlotIndex = clamp(toSafeInt(state.ui.teamDragSourceSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
      const targetSlotIndex =
        hoveredTeamSlot && hoveredTeamSlot.slotIndex !== sourceSlotIndex
          ? hoveredTeamSlot.slotIndex
          : -1;
      state.ui.teamDragTargetSlotIndex = targetSlotIndex;
      setHoveredBallOverlayType("");
      setHoveredTeamSlotIndex(targetSlotIndex >= 0 ? targetSlotIndex : sourceSlotIndex);
      hideHoverPopup();
      render();
      return;
    }
  }

  if (pointerType !== "mouse") {
    setHoveredCanvasOverlayActionId("");
    setHoveredBallOverlayType("");
    setHoveredTeamSlotIndex(-1);
    hideHoverPopup();
    syncCanvasInteractionCursor();
    return;
  }

  if (state.ui.teamContextMenuOpen || state.ui.ballCaptureMenuOpen) {
    const canvasOverlayHitbox = syncCanvasRuntimeOverlayHoverFromPointerEvent(event);
    setHoveredTeamSlotIndex(-1);
    hideHoverPopup();
    if (canvasOverlayHitbox) {
      return;
    }
    syncCanvasInteractionCursor();
    return;
  }
  setHoveredCanvasOverlayActionId("");
  const hoveredBallOverlay = findHoveredBallOverlayHitbox(worldX, worldY);
  setHoveredBallOverlayType(hoveredBallOverlay?.ballType || "");
  if (hoveredBallOverlay) {
    setHoveredTeamSlotIndex(-1);
    hideHoverPopup();
    return;
  }
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  setHoveredTeamSlotIndex(hoveredTeamSlot?.slotIndex ?? -1);
  const hovered = findHoveredPokemon(worldX, worldY, layout);
  showHoverPopup(hovered, event.clientX, event.clientY);
}

function handleCanvasPointerUp(event) {
  cancelTeamContextTouchHold(event.pointerId);
  const pointerType = getNormalizedPointerType(event.pointerType);
  if (!state.ui.teamDragActive || !isEventFromActiveTeamDragPointer(event)) {
    return;
  }
  if (pointerType === "mouse" && Number(event.button) !== 0) {
    return;
  }
  const sourceSlotIndex = clamp(toSafeInt(state.ui.teamDragSourceSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
  const dragMoved = Boolean(state.ui.teamDragMoved);
  const layout = state.layout || computeLayout();
  let didSwap = false;
  if (dragMoved && sourceSlotIndex >= 0) {
    const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
    state.ui.teamDragCurrentWorldX = worldX;
    state.ui.teamDragCurrentWorldY = worldY;
    const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout, { pointerType });
    const targetSlotIndex = hoveredTeamSlot ? hoveredTeamSlot.slotIndex : -1;
    if (targetSlotIndex >= 0 && targetSlotIndex !== sourceSlotIndex) {
      didSwap = swapTeamSlotsFromUi(sourceSlotIndex, targetSlotIndex);
      if (didSwap) {
        setHoveredTeamSlotIndex(targetSlotIndex);
      }
    }
  }

  clearTeamDragState({
    suppressClickMs: dragMoved ? TEAM_DRAG_CLICK_SUPPRESS_MS : 0,
  });
  if (dragMoved && !didSwap) {
    render();
  }
}

function handleCanvasClick(event) {
  if (isTeamDragClickSuppressed() || state.ui.teamDragActive) {
    return;
  }
  if (typeof event.button === "number" && event.button !== 0) {
    return;
  }
  const canvasOverlayHitbox = getCanvasRuntimeOverlayHitboxFromPointerEvent(event);
  if (canvasOverlayHitbox) {
    handleCanvasRuntimeOverlayAction(canvasOverlayHitbox);
    return;
  }
  closeTeamContextMenu();
  if (isCanvasBattleInteractionBlocked()) {
    closeBallCaptureMenu();
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const hoveredBallOverlay = findHoveredBallOverlayHitbox(worldX, worldY);
  if (hoveredBallOverlay) {
    openBallCaptureMenu(hoveredBallOverlay.ballType, event.clientX, event.clientY);
    return;
  }
  closeBallCaptureMenu();
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot) {
    return;
  }
  if (isPhoneUiViewport()) {
    setHoveredTeamSlotIndex(hoveredTeamSlot.slotIndex);
    showHoverPopup(hoveredTeamSlot.member, event.clientX, event.clientY);
    return;
  }
  openBoxesForTeamSlot(hoveredTeamSlot.slotIndex);
}

function handleCanvasContextMenu(event) {
  cancelTeamContextTouchHold(event.pointerId);
  event.preventDefault();
  const canvasOverlayHitbox = getCanvasRuntimeOverlayHitboxFromPointerEvent(event);
  if (canvasOverlayHitbox) {
    setHoveredCanvasOverlayActionId(canvasOverlayHitbox?.interactive === false ? "" : String(canvasOverlayHitbox?.id || ""));
    return;
  }
  if (state.ui.teamDragActive) {
    clearTeamDragState({
      suppressClickMs: state.ui.teamDragMoved ? TEAM_DRAG_CLICK_SUPPRESS_MS : 0,
    });
    setHoveredTeamSlotIndex(-1);
    hideHoverPopup();
    render();
    return;
  }
  closeBallCaptureMenu();
  if (isCanvasBattleInteractionBlocked()) {
    closeTeamContextMenu();
    return;
  }
  const { worldX, worldY } = getWorldCoordinatesFromPointerEvent(event);
  const layout = state.layout || computeLayout();
  const hoveredTeamSlot = findHoveredTeamSlot(worldX, worldY, layout);
  if (!hoveredTeamSlot) {
    closeTeamContextMenu();
    return;
  }
  openTeamContextMenu(hoveredTeamSlot.slotIndex, hoveredTeamSlot.member, event.clientX, event.clientY);
}

function handleCanvasPointerCancel(event) {
  cancelTeamContextTouchHold(event.pointerId);
  if (!state.ui.teamDragActive || !isEventFromActiveTeamDragPointer(event)) {
    return;
  }
  const dragMoved = Boolean(state.ui.teamDragMoved);
  clearTeamDragState({
    suppressClickMs: dragMoved ? TEAM_DRAG_CLICK_SUPPRESS_MS : 0,
  });
  setHoveredTeamSlotIndex(-1);
  hideHoverPopup();
  if (dragMoved) {
    render();
  }
}

function handleWindowPointerUpOutsideCanvas(event) {
  cancelTeamContextTouchHold(event.pointerId);
  const pointerType = getNormalizedPointerType(event.pointerType);
  if (!state.ui.teamDragActive || !isEventFromActiveTeamDragPointer(event)) {
    return;
  }
  if (pointerType === "mouse" && Number(event.button) !== 0) {
    return;
  }
  if (event.target === canvas) {
    return;
  }
  const dragMoved = Boolean(state.ui.teamDragMoved);
  clearTeamDragState({
    suppressClickMs: dragMoved ? TEAM_DRAG_CLICK_SUPPRESS_MS : 0,
  });
  setHoveredTeamSlotIndex(-1);
  hideHoverPopup();
  if (dragMoved) {
    render();
  }
}

function isElementClassVisible(element) {
  if (!element?.classList) {
    return false;
  }
  return !element.classList.contains("hidden") && !element.classList.contains("is-hidden");
}

function getLoadingOverlayVisible() {
  if (!loadingScreenEl?.classList) {
    return false;
  }
  if (loadingScreenEl.classList.contains("is-hidden")) {
    return false;
  }
  return loadingScreenEl.classList.contains("is-visible") || loadingScreenEl.classList.contains("is-exiting");
}

function getBootPhaseState() {
  if (state.mode === "error") {
    return "failed";
  }
  if (state.mode === "ready") {
    return getLoadingOverlayVisible() ? "loading_runtime" : "ready";
  }
  if (state.mode === "loading") {
    return "loading_runtime";
  }
  return "booting";
}

function exportTextState() {
  const layout = state.layout || computeLayout();
  const battle = state.battle;
  const turnIndicator = battle ? battle.getTurnIndicator(layout) : null;
  const nextTurnPreview = battle ? battle.getNextTurnPreview() : null;
  const environmentSnapshot = getEnvironmentSnapshotForRender();
  const runtimeClientType = getRuntimeClientType();

  const enemy = state.enemy
    ? (() => {
        const enemyTalent = resolveTalentDefinition(state.enemy.talent, state.enemy.id);
        return {
          id: state.enemy.id,
          name_fr: state.enemy.nameFr,
          level: state.enemy.level,
          attack_mode: state.enemy.attackMode || "",
          sprite_scale: Math.round(getPokemonDataSpriteScale(state.enemy) * 1000) / 1000,
          hp_current: state.enemy.hpCurrent,
          hp_max: state.enemy.hpMax,
          is_shiny: Boolean(state.enemy.isShiny),
          is_ultra_shiny: Boolean(state.enemy.isUltraShiny),
          shiny_visual: Boolean(state.enemy.isShiny || state.enemy.isShinyVisual || shouldForceUltraShinyAllPokemon()),
          shiny_negative_fallback_visual: Boolean(state.enemy.isShinyNegativeFallbackVisual),
          ultra_shiny_visual: Boolean(
            state.enemy.isUltraShiny || state.enemy.isUltraShinyVisual || shouldForceUltraShinyAllPokemon(),
          ),
          sprite_variant_id: state.enemy.spriteVariantId || null,
          defensive_types: state.enemy.defensiveTypes,
          balance_team_size: Math.max(1, toSafeInt(state.enemy.balanceTeamSize, 1)),
          balance_hp_multiplier: Math.round(Math.max(0, Number(state.enemy.balanceHpMultiplier || 1)) * 1000) / 1000,
          balance_reward_multiplier:
            Math.round(Math.max(0, Number(state.enemy.balanceRewardMultiplier || 1)) * 1000) / 1000,
          talent_id: enemyTalent.id,
          talent_name_fr: enemyTalent.nameFr,
          talent_name_en: enemyTalent.nameEn,
          talent_description_fr: enemyTalent.descriptionFr,
          passive_behavior_id: getPassiveBehaviorIdForTalentId(enemyTalent.id),
          x: Math.round(layout.centerX),
          y: Math.round(layout.centerY),
        };
      })()
    : null;

  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeProgressState = getRouteUnlockProgressState(currentRouteId);
  const nextRouteId = routeProgressState.nextRouteId;
  const unlockMode = routeProgressState.unlockMode;
  const unlockTarget = routeProgressState.unlockTarget;
  const connectedRouteIds = Array.isArray(routeProgressState.connectedRouteIds) ? routeProgressState.connectedRouteIds : [];
  const blockedConnectedRoutes = Array.isArray(routeProgressState.blockedConnectedRoutes)
    ? routeProgressState.blockedConnectedRoutes
    : [];
  const routeDefeatTimer = battle ? battle.getEnemyTimerState() : null;
  const appearancePokemonId = Number(state.ui.appearancePokemonId || 0);
  const appearanceRecord = appearancePokemonId > 0 ? getPokemonEntityRecord(appearancePokemonId) : null;
  const teamAuraAttackBonusBySlot = getTeamAuraAttackBonusBySlot(state.team);
  const gachaCandidateCount = getGachaSkinCandidates().length;
  const legendaryFieldPresence = getLegendaryFieldPresence(state.team);
  const legendaryFieldAttackIntervalMultiplier = getLegendaryFieldAttackIntervalMultiplier(state.team);
  const townLayoutMode = isCurrentRouteCombatEnabled()
    ? null
    : (layout?.viewportProfile?.phone ? "mobile_right_column" : "desktop_bottom_row");
  const activeDialogueId = state.ui.dialogueOpen ? String(state.dialogue?.active?.dialogueId || "") : "";
  const loadingOverlayVisible = getLoadingOverlayVisible();
  const starterModalVisible = isElementClassVisible(starterModalEl);
  const bootPhase = getBootPhaseState();
  const routeNavInfoOpen = isElementClassVisible(routeNavInfoPanelEl);
  const mapRouteInfoOpen = isElementClassVisible(mapConnectionsInfoPanelEl);
  const unlockedRouteIds = state.saveData ? getOrderedUnlockedRouteIds() : [DEFAULT_ROUTE_ID];
  const lockedConnectedRouteIds = connectedRouteIds.filter((routeId) => !unlockedRouteIds.includes(routeId));
  const routeNavState = {
    hasDestinations: connectedRouteIds.length > 0,
    hasBlockedDestinations: lockedConnectedRouteIds.length > 0,
    hasInfoPanelTarget: lockedConnectedRouteIds.length > 0,
    drawerOpen: Boolean(state.ui.routeNavDrawerOpen),
    infoPanelOpen: routeNavInfoOpen || mapRouteInfoOpen,
    selectedInfoRouteId: String(state.ui.routeNavInfoRouteId || "").trim() || null,
  };
  const visualReady = bootPhase === "ready"
    && !loadingOverlayVisible
    && Boolean(captureRootEl)
    && (Boolean(routeNavPanelEl) || starterModalVisible);

  const team = state.team.map((member, index) => {
    const slot = layout.teamSlots[index];
    const offensiveType = normalizeType(member.offensiveType || member.defensiveTypes?.[0] || "normal");
    const enemyDefensiveTypes = Array.isArray(state.enemy?.defensiveTypes) ? state.enemy.defensiveTypes : [];
    const talent = resolveTalentDefinition(member?.talent, member?.id);
    const passiveBehaviorId = getPassiveBehaviorIdForTalentId(talent.id);
    const teleportBoostMultiplier = battle
      ? Math.max(1, Number(battle.getTeleportDamageBoostForSlot(index) || 1))
      : 1;
    const teleportBoostVisualIntensity = battle
      ? clamp(Number(battle.getTeleportBoostVisualIntensityForSlot(index) || 0), 0, 1)
      : 0;
    return {
      id: member.id,
      name_fr: member.nameFr,
      level: member.level,
      attack_mode: member.attackMode || "",
      sprite_scale: Math.round(getPokemonDataSpriteScale(member) * 1000) / 1000,
      xp: Math.max(0, toSafeInt(member.xp, 0)),
      xp_to_next: Math.max(0, toSafeInt(member.xpToNext, 0)),
      is_shiny: Boolean(member.isShiny),
      is_ultra_shiny: Boolean(member.isUltraShiny),
      shiny_visual: Boolean(member.isShiny || member.isShinyVisual || shouldForceUltraShinyAllPokemon()),
      shiny_negative_fallback_visual: Boolean(member.isShinyNegativeFallbackVisual),
      ultra_shiny_visual: Boolean(member.isUltraShiny || member.isUltraShinyVisual || shouldForceUltraShinyAllPokemon()),
      sprite_variant_id: member.spriteVariantId || null,
      slot_index: index,
      sprite_flip_x: shouldFlipTeamSprite(index),
      offensive_type: offensiveType,
      talent_id: talent.id,
      talent_name_fr: talent.nameFr,
      talent_name_en: talent.nameEn,
      talent_description_fr: talent.descriptionFr,
      passive_behavior_id: passiveBehaviorId,
      team_aura_attack_bonus_pct: Math.round(Math.max(0, Number(teamAuraAttackBonusBySlot[index] || 0)) * 10000) / 100,
      teleport_damage_boost_multiplier: Math.round(teleportBoostMultiplier * 1000) / 1000,
      teleport_damage_boost_active: teleportBoostMultiplier > 1.001,
      teleport_boost_visual_intensity: Math.round(teleportBoostVisualIntensity * 1000) / 1000,
      type_multiplier_vs_enemy:
        enemyDefensiveTypes.length > 0 ? Math.round(getTypeMultiplier(offensiveType, enemyDefensiveTypes) * 100) / 100 : null,
      x: slot ? Math.round(slot.x) : null,
      y: slot ? Math.round(slot.y) : null,
    };
  });

  const payload = {
    runtime_client: runtimeClientType,
    runtime_is_browser_pc: runtimeClientType === RUNTIME_CLIENT_BROWSER_PC,
    runtime_is_browser_smartphone: runtimeClientType === RUNTIME_CLIENT_BROWSER_SMARTPHONE,
    runtime_is_desktop_exe_pc: runtimeClientType === RUNTIME_CLIENT_DESKTOP_EXE_PC,
    app_version: DISPLAY_APP_VERSION,
    app_build_version: APP_VERSION,
    mode: state.mode,
    boot_phase: bootPhase,
    loading_overlay_visible: loadingOverlayVisible,
    visual_ready: visualReady,
    debug_force_ultra_shiny_all_pokemon: shouldForceUltraShinyAllPokemon(),
    coordinate_system: {
      origin: "top-left",
      x_axis: "right-positive",
      y_axis: "down-positive",
    },
    design_config_snapshot: GAME_DESIGN_SNAPSHOT || null,
    viewport: {
      width: Math.round(state.viewport.width),
      height: Math.round(state.viewport.height),
    },
    render_quality: String(state.performance?.quality || "medium"),
    render_scale: Math.round(clamp(Number(state.viewport?.renderScale) || 1, 0.1, 2) * 1000) / 1000,
    frame_ms_estimate: Math.round((Number(state.performance?.shortFrameMsEma) || TARGET_FRAME_MS) * 100) / 100,
    render_frame_ms_estimate: Math.round((Number(state.performance?.renderFrameMsEma) || TARGET_FRAME_MS) * 100) / 100,
    cpu_frame_ms_estimate: Math.round((Number(state.performance?.cpuFrameMsEma) || TARGET_FRAME_MS) * 100) / 100,
    fps_estimate:
      Math.round((1000 / Math.max(1, Number(state.performance?.shortFrameMsEma) || TARGET_FRAME_MS)) * 10) / 10,
    render_fps_estimate:
      Math.round((1000 / Math.max(1, Number(state.performance?.renderFrameMsEma) || TARGET_FRAME_MS)) * 10) / 10,
    background_runtime: {
      activity_state: String(state.backgroundRuntime?.activityState || "foreground_active"),
      pending_sim_ms: Math.max(0, Math.round(Number(state.pendingSimMs) || 0)),
      real_clock_last_ms: Math.max(0, toSafeInt(state.realClockLastMs, 0)),
      last_tick_epoch_ms: Math.max(0, toSafeInt(state.saveData?.last_tick_epoch_ms, 0)),
      last_background_reason: String(state.backgroundRuntime?.lastBackgroundReason || ""),
      last_persist_at_ms: Math.max(0, toSafeInt(state.backgroundRuntime?.lastPersistAtMs, 0)),
      last_resume_catchup_ms: Math.max(0, toSafeInt(state.backgroundRuntime?.lastResumeCatchupMs, 0)),
      desktop_window_state: state.desktopWindowState
        ? {
            minimized: Boolean(state.desktopWindowState.minimized),
            visible: Boolean(state.desktopWindowState.visible),
            focused: Boolean(state.desktopWindowState.focused),
            occluded: Boolean(state.desktopWindowState.occluded),
            backgrounded: Boolean(state.desktopWindowState.backgrounded),
            updated_at_ms: Math.max(0, toSafeInt(state.desktopWindowState.updatedAtMs, 0)),
          }
        : null,
      capacitor_app_active:
        typeof state.backgroundRuntime?.capacitorAppActive === "boolean"
          ? state.backgroundRuntime.capacitorAppActive
          : null,
    },
    attack_interval_ms: getCurrentAttackIntervalMs(),
    legendary_field_attack_interval_multiplier:
      Math.round(clamp(Number(legendaryFieldAttackIntervalMultiplier) || 1, 0.05, 20) * 1000) / 1000,
    legendary_fields_active: {
      electric: Boolean(legendaryFieldPresence.electric),
      ardent: Boolean(legendaryFieldPresence.ardent),
      arctic: Boolean(legendaryFieldPresence.arctic),
      trinity: Boolean(legendaryFieldPresence.trinityActive),
    },
    attack_timer_ms: battle ? Math.round(Math.max(0, Number(battle.attackTimerMs) || 0)) : null,
    attack_boost_remaining_ms: getAttackBoostRemainingMs(),
    attack_slots_total: MAX_TEAM_SIZE,
    next_attacker: nextTurnPreview?.attacker_name_fr ?? null,
    next_attacker_slot_index: turnIndicator?.slot_index ?? null,
    next_turn_action: nextTurnPreview?.action ?? null,
    next_turn_reason: nextTurnPreview?.reason ?? null,
    next_turn_passive_behavior_id: nextTurnPreview?.passive_behavior_id ?? null,
    turn_indicator_can_attack: turnIndicator ? Boolean(turnIndicator.can_attack) : null,
    last_turn_event: battle ? battle.getLastTurnEvent() : null,
    enemies_defeated: battle ? battle.enemiesDefeated : 0,
    route_id: currentRouteId || null,
    route_name_fr: state.routeData?.route_name_fr || getRouteDisplayName(currentRouteId),
    route_zone_type: getRouteZoneType(currentRouteId),
    route_combat_enabled: isCurrentRouteCombatEnabled(),
    route_encounters_source: String(state.routeData?.encounters_source || (state.zoneEncounterCsvLoaded ? "csv" : "json")),
    zone_csv_loaded: Boolean(state.zoneEncounterCsvLoaded),
    talents_csv_loaded: Boolean(state.pokemonTalentCsvLoaded),
    ball_csv_loaded: Boolean(state.ballConfigCsvLoaded),
    shop_items_csv_loaded: Boolean(state.shopItemConfigCsvLoaded),
    current_route_encounter_count: Array.isArray(state.routeData?.encounters) ? state.routeData.encounters.length : 0,
    current_route_encounter_preview: Array.isArray(state.routeData?.encounters)
      ? state.routeData.encounters.slice(0, 3).map((entry) => ({
          id: Number(entry?.id || 0),
          name_en: String(entry?.name_en || ""),
          spawn_weight: Math.max(1, toSafeInt(entry?.spawn_weight, 1)),
          min_level: Math.max(1, toSafeInt(entry?.min_level, 1)),
          max_level: Math.max(1, toSafeInt(entry?.max_level, 1)),
        }))
      : [],
    local_time: environmentSnapshot?.localTimeLabel || null,
    local_hour: Number.isFinite(Number(environmentSnapshot?.localHour)) ? Number(environmentSnapshot.localHour) : null,
    local_minute: Number.isFinite(Number(environmentSnapshot?.localMinute)) ? Number(environmentSnapshot.localMinute) : null,
    local_time_of_day: environmentSnapshot?.timeOfDayTag || "night",
    daylight_factor: Math.round(clamp(Number(environmentSnapshot?.dayLight) || 0, 0, 1) * 1000) / 1000,
    night_factor: Math.round(clamp(Number(environmentSnapshot?.night) || 0, 0, 1) * 1000) / 1000,
    unlocked_route_ids: unlockedRouteIds,
    route_unlock_mode: unlockMode,
    route_unlock_progress_current: routeProgressState.currentDefeats,
    route_unlock_target: unlockTarget,
    route_defeat_timer_active: Boolean(routeDefeatTimer?.enabled),
    route_defeat_timer_running: Boolean(routeDefeatTimer?.running),
    route_defeat_timer_duration_ms: routeDefeatTimer?.duration_ms ?? 0,
    route_defeat_timer_remaining_ms: routeDefeatTimer?.remaining_ms ?? 0,
    route_defeat_timer_ratio: routeDefeatTimer?.remaining_ratio ?? 0,
    connected_route_ids: connectedRouteIds,
    blocked_connected_routes: blockedConnectedRoutes.map((entry) => ({
      route_id: String(entry?.route_id || ""),
      route_name_fr: String(entry?.route_name_fr || ""),
      blocked_reason_fr: String(entry?.blocked_reason_fr || ""),
      requires_flags_all: Array.isArray(entry?.requires_flags_all) ? entry.requires_flags_all : [],
      requires_flags_any: Array.isArray(entry?.requires_flags_any) ? entry.requires_flags_any : [],
    })),
    route_nav_state: routeNavState,
    route_access_flags: normalizeFlagIdList(state.saveData?.zone_flags),
    town_layout_mode: townLayoutMode,
    next_route_id: nextRouteId,
    next_route_name_fr: nextRouteId ? getRouteDisplayName(nextRouteId) : null,
    active_dialogue_id: activeDialogueId || null,
    seen_dialogue_ids: normalizeFlagIdList(state.saveData?.seen_dialogue_ids),
    starter_modal_visible: starterModalVisible,
    hover_popup_visible: !hoverPopupEl.classList.contains("hidden"),
    hovered_team_slot_index: toSafeInt(state.ui.hoveredTeamSlotIndex, -1),
    team_drag_active: Boolean(state.ui.teamDragActive),
    team_drag_moved: Boolean(state.ui.teamDragMoved),
    team_drag_source_slot_index: toSafeInt(state.ui.teamDragSourceSlotIndex, -1),
    team_drag_target_slot_index: toSafeInt(state.ui.teamDragTargetSlotIndex, -1),
    save_team_size: state.saveData?.team?.length || 0,
    money: Math.max(0, toSafeInt(state.saveData?.money, 0)),
    coins: Math.max(0, toSafeInt(state.saveData?.coins, 0)),
    pokeballs: Math.max(0, toSafeInt(state.saveData?.pokeballs, 0)),
    ball_inventory: state.saveData
      ? {
          ...Object.fromEntries(BALL_TYPE_FALLBACK_ORDER.map((ballType) => [ballType, getBallInventoryCount(ballType)])),
          active_ball_type: getActiveBallType(),
        }
      : null,
    shop_items: state.saveData
      ? Object.fromEntries(
          Object.values(SHOP_ITEM_CONFIG_BY_ID)
            .filter((item) => item && item.itemType !== "ball" && item.stockTracked)
            .sort(compareShopItems)
            .map((item) => [item.id, getShopItemCount(item.id)]),
        )
      : null,
    ball_configs: getSortedBallConfigs().map((entry) => ({
      type: entry.type,
      name_fr: entry.nameFr,
      price: Math.max(0, toSafeInt(entry.price, 0)),
      capture_multiplier: Math.round(Number(entry.captureMultiplier || 1) * 1000) / 1000,
      coming_soon: Boolean(entry.comingSoon),
    })),
    shop_item_configs: Object.values(SHOP_ITEM_CONFIG_BY_ID)
      .filter((item) => item && item.itemType !== "ball")
      .sort(compareShopItems)
      .map((item) => ({
        id: item.id,
        name_fr: item.nameFr,
        item_type: item.itemType,
        category: item.category,
        price: Math.max(0, toSafeInt(item.price, 0)),
        effect_kind: item.effectKind || "",
        effect_value: item.effectValue ?? "",
        effect_duration_ms: Math.max(0, toSafeInt(item.effectDurationMs, 0)),
        stock_tracked: Boolean(item.stockTracked),
      })),
    save_backend: getSaveBackendTelemetryValue(),
    shop_open: Boolean(state.ui.shopOpen),
    map_open: Boolean(state.ui.mapOpen),
    gacha_open: Boolean(state.ui.gachaOpen),
    gacha_spinning: Boolean(state.gacha.spinning),
    gacha_pool_max_pokemon_id: getCurrentGachaMaxPokemonId(),
    gacha_remaining_candidates_current_pool: Math.max(0, toSafeInt(gachaCandidateCount, 0)),
    gacha_remaining_candidates_151: Math.max(0, toSafeInt(gachaCandidateCount, 0)),
    gacha_last_reward: state.gacha.lastReward
      ? {
          pokemon_id: Number(state.gacha.lastReward.pokemonId || 0),
          pokemon_name_fr: String(state.gacha.lastReward.pokemonNameFr || ""),
          variant_id: String(state.gacha.lastReward.variantId || ""),
          variant_label: String(state.gacha.lastReward.variantLabel || ""),
        }
      : null,
    gacha_last_rewards: Array.isArray(state.gacha.lastRewards)
      ? state.gacha.lastRewards.map((reward) => ({
          pokemon_id: Number(reward?.pokemonId || 0),
          pokemon_name_fr: String(reward?.pokemonNameFr || ""),
          variant_id: String(reward?.variantId || ""),
          variant_label: String(reward?.variantLabel || ""),
        }))
      : [],
    shop_tab: String(state.ui.shopTab || SHOP_TAB_POKEBALLS),
    shop_ball_purchase_mode: normalizeShopQuantityMode(state.ui.shopQuantityMode),
    shop_ball_purchase_qty:
      normalizeShopQuantityMode(state.ui.shopQuantityMode) === SHOP_QUANTITY_MODE_MAX
        ? null
        : getSelectedShopBallQuantity(),
    boxes_open: Boolean(state.ui.boxesOpen),
    boxes_target_slot_index: toSafeInt(state.ui.boxesTargetSlotIndex, -1),
    boxes_entity_count: state.saveData ? getCapturedEntityCount() : 0,
    boxes_shiny_capture_total: state.saveData ? getTotalShinyCapturesGlobal() : 0,
    pokedex_open: Boolean(state.ui.pokedexOpen),
    pokedex_hover_pokemon_id: Number(state.ui.pokedexHoverPokemonId || 0) || null,
    pokedex_max_pokemon_id: getCurrentPokedexMaxPokemonId(),
    pokedex_species_count: state.saveData ? getPokedexEntries().length : 0,
    appearance_editor_unlocked: isAppearanceEditorUnlocked(),
    appearance_open: Boolean(state.ui.appearanceOpen),
    appearance_target_slot_index: toSafeInt(state.ui.appearanceTargetSlotIndex, -1),
    appearance_pokemon_id: Number(state.ui.appearancePokemonId || 0) || null,
    team_context_menu_open: Boolean(state.ui.teamContextMenuOpen),
    team_context_menu_slot_index: toSafeInt(state.ui.teamContextMenuSlotIndex, -1),
    ball_capture_menu_open: Boolean(state.ui.ballCaptureMenuOpen),
    ball_capture_menu_ball_type: getBallCaptureMenuBallType() || null,
    ball_capture_rules: state.saveData
      ? Object.fromEntries(
          BALL_TYPE_FALLBACK_ORDER.map((ballType) => [ballType, getBallCaptureRulesForType(ballType)]),
        )
      : null,
    appearance_selected_variant_id: appearanceRecord?.appearance_selected_variant || null,
    appearance_shiny_mode: Boolean(appearanceRecord?.appearance_shiny_mode),
    appearance_ultra_shiny_mode: Boolean(appearanceRecord?.appearance_ultra_shiny_mode),
    appearance_shiny_unlocked_family: isShinyAppearanceUnlockedForRecord(appearanceRecord, appearancePokemonId),
    appearance_ultra_shiny_unlocked_family: isUltraShinyAppearanceUnlockedForRecord(appearanceRecord, appearancePokemonId),
    tutorial_open: Boolean(state.ui.tutorialOpen),
    tutorial_flow_id: state.ui.tutorialOpen ? String(state.tutorial.active?.flowId || "") : null,
    tutorial_page: state.ui.tutorialOpen ? Math.max(1, toSafeInt(state.tutorial.active?.pageIndex, 0) + 1) : 0,
    tutorial_page_count: state.ui.tutorialOpen
      ? Math.max(1, getTutorialFlowDefinition(state.tutorial.active?.flowId)?.pages?.length || 1)
      : 0,
    dialogue_open: Boolean(state.ui.dialogueOpen),
    top_message: null,
    notifications_active: Array.isArray(state.notifications.items) ? state.notifications.items.length : 0,
    notifications_temporary: Array.isArray(state.notifications.items)
      ? state.notifications.items.filter((item) => item?.type === "temporary").length
      : 0,
    notifications_evolution_ready: Array.isArray(state.notifications.items)
      ? state.notifications.items.filter((item) => item?.type === "evolution_ready").length
      : 0,
    money_display_value: Math.max(0, Math.round(Number(state.moneyHud.displayValue) || 0)),
    coins_display_value: Math.max(0, toSafeInt(state.saveData?.coins, 0)),
    team_level_up_effects_active: Array.isArray(state.teamLevelUpEffects) ? state.teamLevelUpEffects.length : 0,
    team_xp_gain_effects_active: Array.isArray(state.teamXpGainEffects) ? state.teamXpGainEffects.length : 0,
    active_projectiles: (battle ? battle.getProjectiles() : []).map((projectile) => ({
      attack_mode: projectile.attackMode || "projectile",
      type: projectile.attackType,
      x: Math.round(projectile.x),
      y: Math.round(projectile.y),
      attacker_name_fr: projectile.attackerNameFr,
    })),
    active_lasers: (battle ? battle.getLasers() : []).map((laser) => ({
      attack_mode: "laser",
      type: laser.attackType,
      source_x: Math.round(Number(laser.sourceX) || 0),
      source_y: Math.round(Number(laser.sourceY) || 0),
      target_x: Math.round(Number(laser.targetX) || 0),
      target_y: Math.round(Number(laser.targetY) || 0),
      attacker_name_fr: laser.attackerNameFr || "",
    })),
    vfx_render_debug: state.vfxRenderDebug
      ? {
          quality_tier: String(state.vfxRenderDebug.qualityTier || state.performance?.quality || "medium"),
          projectile: {
            active_count: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.activeCount, 0)),
            stamp_draw_count: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.stampDrawCount, 0)),
            trail_stamp_draw_count: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.trailStampDrawCount, 0)),
            sprite_cache_size: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.spriteCacheSize, 0)),
            sprite_cache_hits: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.spriteCacheHits, 0)),
            sprite_cache_misses: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.spriteCacheMisses, 0)),
            trail_cache_size: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.trailCacheSize, 0)),
            trail_cache_hits: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.trailCacheHits, 0)),
            trail_cache_misses: Math.max(0, toSafeInt(state.vfxRenderDebug.projectile?.trailCacheMisses, 0)),
          },
          laser: {
            active_count: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.activeCount, 0)),
            render_path_counts: {
              packed_simple: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.renderPathCounts?.packed_simple, 0)),
              pixel_curved: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.renderPathCounts?.pixel_curved, 0)),
              hero_curved: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.renderPathCounts?.hero_curved, 0)),
            },
            segment_count: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.segmentCount, 0)),
            particle_count: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.particleCount, 0)),
            texture_cache_size: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.textureCacheSize, 0)),
            texture_cache_hits: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.textureCacheHits, 0)),
            texture_cache_misses: Math.max(0, toSafeInt(state.vfxRenderDebug.laser?.textureCacheMisses, 0)),
          },
        }
      : null,
    floating_damage_texts: (battle ? battle.getFloatingTexts() : []).map((text) => ({
      damage: text.damage,
      missed: Boolean(text.isMiss),
      label: text.label || "",
      x: Math.round(text.x),
      y: Math.round(text.y),
      life_ms: Math.round(text.lifeMs),
    })),
    last_impact: battle ? battle.lastImpact : null,
    enemy_damage_flash_blend: battle ? Math.round(battle.getEnemyDamageFlashBlend() * 1000) / 1000 : 0,
    team_attack_flash_blends: battle
      ? Array.from({ length: MAX_TEAM_SIZE }, (_, index) => Math.round(battle.getSlotAttackFlashBlend(index) * 1000) / 1000)
      : [],
    ko_transition: battle ? battle.getKoTransition() : null,
    capture_sequence: battle ? battle.getCaptureSequence() : null,
    evolution_animation: state.evolutionAnimation.current
      ? {
          from_id: state.evolutionAnimation.current.fromId,
          to_id: state.evolutionAnimation.current.toId,
          from_name_fr: state.evolutionAnimation.current.fromNameFr,
          to_name_fr: state.evolutionAnimation.current.toNameFr,
          elapsed_ms: Math.round(state.evolutionAnimation.current.elapsedMs),
          total_ms: Math.round(state.evolutionAnimation.current.totalMs),
          queue_remaining: Math.max(0, state.evolutionAnimation.queue.length),
        }
      : null,
    background_drift: {
      x: Math.round((Number(state.backgroundDrift.currentX) || 0) * 100) / 100,
      y: Math.round((Number(state.backgroundDrift.currentY) || 0) * 100) / 100,
    },
    enemy,
    team,
  };

  return JSON.stringify(payload);
}

window.render_game_to_text = exportTextState;
window.get_runtime_client_type = () => getRuntimeClientType();
window.advanceTime = (ms) => {
  const totalMs = Number.isFinite(ms) ? Math.max(0, Number(ms)) : 0;
  const steps = Math.max(1, Math.round(totalMs / BASE_STEP_MS));
  const stepMs = steps > 0 ? totalMs / steps : BASE_STEP_MS;
  for (let i = 0; i < steps; i += 1) {
    update(stepMs || BASE_STEP_MS);
  }
  render();
};

window.__pokeidle_debug_getSpriteFrameIndex = (target = "enemy", slotIndex = 0) => {
  const which = String(target || "").toLowerCase().trim();
  const slot = clamp(toSafeInt(slotIndex, 0), 0, MAX_TEAM_SIZE - 1);
  const entity = which === "enemy" ? state.enemy : state.team[slot];
  if (!entity) {
    return null;
  }
  const resolved = resolveEntitySpriteDrawSource(entity);
  const base = entity.spriteImage || null;
  const spritePath = String(entity.spritePath || base?.currentSrc || base?.src || "");
  const cacheEntry = spritePath ? animatedSpriteFramesCache.get(spritePath) : null;
  return {
    id: Number(entity.id || 0),
    sprite_variant_id: entity.spriteVariantId || null,
    sprite_path: spritePath || null,
    sprite_animated: Boolean(entity.spriteAnimated),
    frame_index: toSafeInt(resolved.frameIndex, -1),
    opaque_min_x: toSafeInt(resolved.opaqueMinX, 0),
    opaque_min_y: toSafeInt(resolved.opaqueMinY, 0),
    opaque_width: toSafeInt(resolved.opaqueWidth, 0),
    opaque_height: toSafeInt(resolved.opaqueHeight, 0),
    max_opaque_width: toSafeInt(resolved.maxOpaqueWidth, toSafeInt(resolved.opaqueWidth, 0)),
    max_opaque_height: toSafeInt(resolved.maxOpaqueHeight, toSafeInt(resolved.opaqueHeight, 0)),
    cache_status: cacheEntry?.status || null,
    cache_frames: Array.isArray(cacheEntry?.frames) ? cacheEntry.frames.length : 0,
    cache_error: cacheEntry?.error || null,
  };
};

function getPokemonLoadTargets(routeDataInput) {
  const targetsById = new Map();
  for (const starter of STARTER_CHOICES) {
    targetsById.set(Number(starter.id), starter.nameEn);
  }

  if (state.saveData?.pokemon_entities && typeof state.saveData.pokemon_entities === "object") {
    for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
      const id = Number(record?.id || rawId || 0);
      const speciesNameEn = String(record?.species_name_en || record?.name_en || "").toLowerCase().trim();
      if (id > 0 && speciesNameEn) {
        targetsById.set(id, speciesNameEn);
      }
    }
  }

  const routeDataList = Array.isArray(routeDataInput)
    ? routeDataInput
    : routeDataInput
      ? [routeDataInput]
      : [];

  for (const routeData of routeDataList) {
    const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
    for (const encounter of encounters) {
      const id = Number(encounter?.id || 0);
      const nameEn = String(encounter?.name_en || "").toLowerCase();
      if (id > 0 && nameEn) {
        targetsById.set(id, nameEn);
      }
    }
  }

  return Array.from(targetsById.entries()).map(([id, nameEn]) => ({ id, nameEn }));
}

const {
  warnRuntimeDataValidation,
  normalizePokemonTalentFromCsvRow,
  loadPokemonTalentCsv,
  normalizeBallConfigFromCsvRow,
  loadBallConfigCsv,
  normalizeShopItemConfigFromCsvRow,
  loadShopItemConfigCsv,
  normalizeEncounterFromCsvRow,
  loadZoneEncounterCsv,
} = createRuntimeConfigLoaders({
  fetchFn: (...args) => fetch(...args),
  parseCsvObjects,
  parseCsvMethods,
  readCsvCell,
  readCsvNumberCell,
  readCsvBooleanCell,
  readCsvTypedValue,
  normalizeTalentDefinition,
  normalizeTalentId,
  normalizeUiDisplayText,
  assertValidBallConfig,
  assertValidShopItemConfig,
  assertValidEncounter,
  hasImplementedTalentEffect,
  toSafeInt,
  clamp,
  pokemonTalentsCsvPath: POKEMON_TALENTS_CSV_PATH,
  ballConfigCsvPath: BALL_CONFIG_CSV_PATH,
  shopItemsCsvPath: SHOP_ITEMS_CSV_PATH,
  routeEncountersCsvPath: ROUTE_ENCOUNTERS_CSV_PATH,
  defaultBallConfigByType: DEFAULT_BALL_CONFIG_BY_TYPE,
  defaultExtraShopItemsById: DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID,
  defaultWildLevelMin: DEFAULT_WILD_LEVEL_MIN,
  defaultWildLevelMax: DEFAULT_WILD_LEVEL_MAX,
  maxLevel: MAX_LEVEL,
  shopTabCombat: SHOP_TAB_COMBAT,
});

function setPokemonTalentCsvState(payload) {
  state.pokemonTalentCsvByPokemonId =
    payload?.talentsByPokemonId instanceof Map ? payload.talentsByPokemonId : new Map();
  state.pokedexSpeciesCsvByPokemonId =
    payload?.pokedexSpeciesByPokemonId instanceof Map ? payload.pokedexSpeciesByPokemonId : new Map();
  state.pokemonTalentCsvLoaded = state.pokemonTalentCsvByPokemonId.size > 0;
  invalidatePokedexEntriesCache({ resetSlice: true });
  if (state.ui.pokedexOpen) {
    queuePokedexGridRender();
  }
}

function getPokemonTalentCsvForPokemonId(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return null;
  }
  if (!state.pokemonTalentCsvByPokemonId.has(id)) {
    return null;
  }
  return normalizeTalentDefinition(state.pokemonTalentCsvByPokemonId.get(id));
}

function applyPokemonTalentCsvToDefinitions(defsById = state.pokemonDefsById) {
  if (!(defsById instanceof Map) || defsById.size <= 0) {
    return;
  }
  for (const [pokemonId, def] of defsById.entries()) {
    if (!def || typeof def !== "object") {
      continue;
    }
    const csvTalent = getPokemonTalentCsvForPokemonId(pokemonId);
    if (!csvTalent) {
      continue;
    }
    def.talent = normalizeTalentDefinition(csvTalent);
  }
}

function preloadConfiguredSpriteAssets(...collections) {
  const spritePaths = new Set();
  for (const collection of collections) {
    const entries = Array.isArray(collection) ? collection : [];
    for (const entry of entries) {
      const spritePath = String(entry?.spritePath || "").trim();
      if (spritePath) {
        spritePaths.add(spritePath);
      }
    }
  }
  if (spritePaths.size <= 0) {
    return;
  }
  void Promise.all(Array.from(spritePaths.values()).map((spritePath) => loadImage(spritePath))).catch(() => {});
}

function setBallConfigState(payload) {
  const nextConfigByType = cloneConfigMap(DEFAULT_BALL_CONFIG_BY_TYPE);
  const sourceEntries =
    payload?.configsByType && typeof payload.configsByType === "object" ? Object.entries(payload.configsByType) : [];
  for (const [type, config] of sourceEntries) {
    const normalizedType = String(type || "").toLowerCase().trim();
    if (!normalizedType || !config || typeof config !== "object") {
      continue;
    }
    nextConfigByType[normalizedType] = {
      ...(nextConfigByType[normalizedType] || {}),
      ...config,
      type: normalizedType,
    };
  }
  replaceConfigMap(BALL_CONFIG_BY_TYPE, nextConfigByType);
  refreshBallConfigDerivedState();
  rebuildShopItemConfigState();
  preloadConfiguredSpriteAssets(Object.values(BALL_CONFIG_BY_TYPE), Object.values(SHOP_ITEM_CONFIG_BY_ID));
  state.ballConfigCsvLoaded = sourceEntries.length > 0;
  state.configRevisions.ball += 1;
}

function setShopItemConfigState(payload) {
  const nextExtraShopItemsById = cloneConfigMap(DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID);
  const sourceEntries =
    payload?.configsById && typeof payload.configsById === "object" ? Object.entries(payload.configsById) : [];
  for (const [id, config] of sourceEntries) {
    const normalizedId = String(id || "").toLowerCase().trim();
    if (!normalizedId || !config || typeof config !== "object") {
      continue;
    }
    nextExtraShopItemsById[normalizedId] = {
      ...(nextExtraShopItemsById[normalizedId] || {}),
      ...config,
      id: normalizedId,
    };
  }
  replaceConfigMap(EXTRA_SHOP_ITEM_CONFIG_BY_ID, nextExtraShopItemsById);
  rebuildEvolutionStoneConfigState(EXTRA_SHOP_ITEM_CONFIG_BY_ID);
  rebuildShopItemConfigState();
  preloadConfiguredSpriteAssets(Object.values(BALL_CONFIG_BY_TYPE), Object.values(SHOP_ITEM_CONFIG_BY_ID));
  state.shopItemConfigCsvLoaded = sourceEntries.length > 0;
  state.configRevisions.shopItem += 1;
}

function setZoneEncounterCsvState(payload) {
  state.zoneEncounterCsvByRouteId = payload?.encountersByRouteId instanceof Map ? payload.encountersByRouteId : new Map();
  state.zoneEncounterCsvRouteIds = payload?.routeIds instanceof Set ? payload.routeIds : new Set();
  state.zoneEncounterCsvLoaded = state.zoneEncounterCsvRouteIds.size > 0;
}

function hasRouteUnlockedInSaveData(routeId, saveData = state.saveData) {
  const id = String(routeId || "");
  if (!id) {
    return false;
  }
  const unlocked = Array.isArray(saveData?.unlocked_route_ids) ? saveData.unlocked_route_ids : [];
  return unlocked.includes(id);
}

function hasUnknownCaveUnlockedInSave(saveData = state.saveData) {
  return hasRouteUnlockedInSaveData(UNKNOWN_CAVE_ROUTE_ID, saveData);
}

function isPostUnknownCaveContentUnlocked(saveData = state.saveData) {
  return hasUnknownCaveUnlockedInSave(saveData);
}

function getCurrentPokedexMaxPokemonId(saveData = state.saveData) {
  return isPostUnknownCaveContentUnlocked(saveData) ? POKEDEX_EXTENDED_MAX_POKEMON_ID : POKEDEX_BASE_MAX_POKEMON_ID;
}

function getCurrentGachaMaxPokemonId(saveData = state.saveData) {
  return isPostUnknownCaveContentUnlocked(saveData) ? GACHA_EXTENDED_MAX_POKEMON_ID : GACHA_BASE_MAX_POKEMON_ID;
}

function formatPokemonRangeLabel(maxPokemonId) {
  const maxId = clamp(toSafeInt(maxPokemonId, POKEDEX_BASE_MAX_POKEMON_ID), 1, POKEDEX_EXTENDED_MAX_POKEMON_ID);
  return `#001-${String(maxId).padStart(3, "0")}`;
}

function getCurrentGachaPokemonRangeLabel(saveData = state.saveData) {
  return formatPokemonRangeLabel(getCurrentGachaMaxPokemonId(saveData));
}

function getZoneEncounterCsvForRoute(routeId) {
  const id = String(routeId || "");
  if (!id) {
    return null;
  }
  if (!state.zoneEncounterCsvRouteIds.has(id)) {
    return null;
  }
  const list = state.zoneEncounterCsvByRouteId.get(id);
  return Array.isArray(list) ? list : [];
}

function mergeRouteEncountersFromCsv(routeData, csvEntries) {
  const sourceEntries = Array.isArray(csvEntries) ? csvEntries : [];
  const fallbackById = new Map();
  const fallbackEntries = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  for (const fallback of fallbackEntries) {
    const id = Number(fallback?.id || 0);
    if (id > 0 && !fallbackById.has(id)) {
      fallbackById.set(id, fallback);
    }
  }

  const merged = [];
  for (const entry of sourceEntries) {
    const id = Number(entry?.id || 0);
    if (id <= 0) {
      continue;
    }
    const fallback = fallbackById.get(id) || null;
    const nameEn = String(entry?.name_en || fallback?.name_en || "").toLowerCase().trim();
    if (!nameEn) {
      continue;
    }
    const minLevel = clamp(toSafeInt(entry?.min_level, fallback?.min_level ?? DEFAULT_WILD_LEVEL_MIN), 1, MAX_LEVEL);
    const maxLevel = clamp(
      toSafeInt(entry?.max_level, fallback?.max_level ?? Math.max(minLevel, DEFAULT_WILD_LEVEL_MAX)),
      minLevel,
      MAX_LEVEL,
    );
    merged.push({
      id,
      name_en: nameEn,
      name_fr: normalizeUiDisplayText(String(entry?.name_fr || fallback?.name_fr || nameEn).trim(), {
        frenchTypography: true,
      }),
      spawn_weight: Math.max(1, toSafeInt(entry?.spawn_weight, fallback?.spawn_weight ?? 1)),
      min_level: minLevel,
      max_level: maxLevel,
      methods:
        Array.isArray(entry?.methods) && entry.methods.length > 0
          ? entry.methods
          : Array.isArray(fallback?.methods)
            ? fallback.methods
            : [],
      catch_rate: fallback?.catch_rate,
    });
  }
  merged.sort((a, b) => b.spawn_weight - a.spawn_weight || a.id - b.id);
  return merged;
}

function cloneEncounterEntries(entries) {
  const sourceEntries = Array.isArray(entries) ? entries : [];
  return sourceEntries.map((entry) => ({
    ...entry,
    methods: Array.isArray(entry?.methods) ? entry.methods.slice() : [],
  }));
}

function getRouteBaseEncounterEntries(routeData) {
  if (!routeData || typeof routeData !== "object") {
    return [];
  }
  if (!Array.isArray(routeData.encounters_json_base)) {
    routeData.encounters_json_base = cloneEncounterEntries(routeData.encounters);
  }
  return routeData.encounters_json_base;
}

function applyEncounterMappingToRouteData(routeData) {
  if (!routeData || typeof routeData !== "object") {
    return routeData;
  }
  const baseEncounters = getRouteBaseEncounterEntries(routeData);
  const csvEncounters = getZoneEncounterCsvForRoute(routeData?.route_id || "");
  if (csvEncounters !== null) {
    routeData.encounters = mergeRouteEncountersFromCsv({ encounters: baseEncounters }, csvEncounters);
    routeData.encounters_source = "csv";
  } else {
    routeData.encounters = cloneEncounterEntries(baseEncounters);
    routeData.encounters_source = "json";
  }
  return routeData;
}

function refreshRouteCatalogEncounterMapping() {
  if (!(state.routeCatalog instanceof Map) || state.routeCatalog.size <= 0) {
    return;
  }
  for (const routeData of state.routeCatalog.values()) {
    applyEncounterMappingToRouteData(routeData);
  }
  const activeRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || "");
  if (!activeRouteId) {
    return;
  }
  const refreshedRoute = state.routeCatalog.get(activeRouteId) || null;
  if (!refreshedRoute) {
    return;
  }
  state.routeData = refreshedRoute;
  resetOnlyOneEncounterCycle(activeRouteId);
  ensureRouteDefinitionsLoaded(refreshedRoute);
}

function buildRouteDataPath(routeId) {
  return ROUTE_DATA_DIR + "/" + routeId + ".json";
}

async function loadRouteData(routeId = DEFAULT_ROUTE_ID) {
  const routePath = buildRouteDataPath(routeId);
  const response = await fetch(routePath);
  if (!response.ok) {
    throw new Error("Impossible de charger " + routePath);
  }
  const routeData = validateRouteDataPayload(await response.json(), `Route data ${routePath}`);
  if (!Array.isArray(routeData?.encounters)) {
    throw new Error("Aucune liste d'encounters configuree pour " + routeId);
  }
  routeData.encounters_json_base = cloneEncounterEntries(routeData.encounters);
  applyEncounterMappingToRouteData(routeData);
  const combatEnabled = routeData?.combat_enabled !== false;
  if (combatEnabled && routeData.encounters.length === 0) {
    throw new Error("Aucun Pokemon configure pour " + routeId);
  }
  return routeData;
}

async function loadRouteCatalog(routeIds = ROUTE_ID_ORDER) {
  const baseList = Array.isArray(routeIds) ? routeIds : [DEFAULT_ROUTE_ID];
  const uniqueRouteIds = Array.from(new Set(baseList.map((routeId) => String(routeId || ""))));
  if (!uniqueRouteIds.includes(DEFAULT_ROUTE_ID)) {
    uniqueRouteIds.unshift(DEFAULT_ROUTE_ID);
  }

  const catalog = new Map();
  for (const routeId of uniqueRouteIds) {
    try {
      const routeData = await loadRouteData(routeId);
      catalog.set(routeId, routeData);
    } catch (error) {
      if (routeId === DEFAULT_ROUTE_ID) {
        throw error;
      }
    }
  }

  if (!catalog.has(DEFAULT_ROUTE_ID)) {
    throw new Error("Route par defaut manquante: " + DEFAULT_ROUTE_ID);
  }

  return catalog;
}

function getRouteDataListFromInput(routeInput) {
  if (routeInput instanceof Map) {
    return Array.from(routeInput.values());
  }
  if (Array.isArray(routeInput)) {
    return routeInput.filter((routeData) => routeData && typeof routeData === "object");
  }
  return [];
}

function getRouteDataByIds(routeIds, routeCatalog = state.routeCatalog) {
  if (!(routeCatalog instanceof Map) || routeCatalog.size <= 0) {
    return [];
  }
  const sourceIds = Array.isArray(routeIds) ? routeIds : [routeIds];
  const uniqueIds = Array.from(new Set(sourceIds.map((routeId) => String(routeId || ""))));
  const routeDataList = [];
  for (const routeId of uniqueIds) {
    const routeData = routeCatalog.get(routeId) || null;
    if (routeData) {
      routeDataList.push(routeData);
    }
  }
  return routeDataList;
}

function getInitialAssetRouteIds() {
  const routeIds = new Set();
  const currentRouteId = String(state.saveData?.current_route_id || "");
  const preferredRouteId = currentRouteId && state.routeCatalog.has(currentRouteId) ? currentRouteId : DEFAULT_ROUTE_ID;
  routeIds.add(preferredRouteId);
  routeIds.add(DEFAULT_ROUTE_ID);
  if (!state.saveData?.starter_chosen) {
    routeIds.add(ROUTE_1_TUTORIAL_ID);
  }
  return Array.from(routeIds).filter((routeId) => state.routeCatalog.has(routeId));
}

async function preloadRouteBackgrounds(routeInput) {
  const routeDataList = getRouteDataListFromInput(routeInput);
  const entries = await Promise.all(
    routeDataList.map(async (routeData) => [routeData.route_id, await loadImage(routeData.background_image || null)]),
  );
  return new Map(entries);
}

function buildRouteDialogueDataPath(dialogueId) {
  const id = String(dialogueId || "").trim();
  return id ? `map_data/dialogues/${encodeURIComponent(id)}.json` : "";
}

function collectRouteDialogueIds(routeInput) {
  const routeDataList = getRouteDataListFromInput(routeInput);
  const dialogueIds = new Set();
  for (const routeData of routeDataList) {
    const arrivalDialogueIds = Array.isArray(routeData?.arrival_dialogue_ids_once) ? routeData.arrival_dialogue_ids_once : [];
    for (const dialogueId of arrivalDialogueIds) {
      const normalizedId = String(dialogueId || "").trim();
      if (normalizedId) {
        dialogueIds.add(normalizedId);
      }
    }
    const zoneActions = Array.isArray(routeData?.zone_actions) ? routeData.zone_actions : [];
    for (const action of zoneActions) {
      if (String(action?.kind || "dialogue").trim() !== "dialogue") {
        continue;
      }
      const dialogueId = String(action?.dialogue_id || "").trim();
      if (dialogueId) {
        dialogueIds.add(dialogueId);
      }
    }
  }
  return Array.from(dialogueIds.values());
}

function preloadDialogueAsset(dialogueId) {
  const id = String(dialogueId || "").trim();
  if (!id) {
    return Promise.resolve(null);
  }
  if (pendingDialogueWarmupLoads.has(id)) {
    return pendingDialogueWarmupLoads.get(id);
  }
  const task = fetch(buildRouteDialogueDataPath(id))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    })
    .catch((error) => {
      console.warn(
        `Impossible de precharger le dialogue ${id}:`,
        error instanceof Error ? error.message : String(error || ""),
      );
      return null;
    })
    .finally(() => {
      pendingDialogueWarmupLoads.delete(id);
    });
  pendingDialogueWarmupLoads.set(id, task);
  return task;
}

async function preloadRouteDialogues(routeInput) {
  const dialogueIds = collectRouteDialogueIds(routeInput);
  if (dialogueIds.length <= 0) {
    return [];
  }
  return Promise.all(dialogueIds.map((dialogueId) => preloadDialogueAsset(dialogueId)));
}

function queueDeferredRouteAssetWarmup(preloadedRouteIds = []) {
  if (!(state.routeCatalog instanceof Map) || state.routeCatalog.size <= 0) {
    return;
  }
  const alreadyLoaded = new Set(
    (Array.isArray(preloadedRouteIds) ? preloadedRouteIds : [preloadedRouteIds]).map((routeId) => String(routeId || "")),
  );
  const remainingRouteIds = getOrderedCatalogRouteIds().filter((routeId) => !alreadyLoaded.has(routeId));
  if (remainingRouteIds.length <= 0) {
    return;
  }

  const queue = remainingRouteIds.slice();

  const runNextChunk = () => {
    if (queue.length <= 0) {
      return;
    }
    const chunkRouteIds = queue.splice(0, DEFERRED_ROUTE_WARMUP_CHUNK_SIZE);
    const routeDataList = getRouteDataByIds(chunkRouteIds);
    if (routeDataList.length <= 0) {
      scheduleNextChunk();
      return;
    }
    Promise.all([
      loadPokemonDefinitions(routeDataList, { append: true }),
      preloadRouteBackgrounds(routeDataList),
      preloadRouteDialogues(routeDataList),
    ])
      .then(([, warmBackgrounds]) => {
        if (warmBackgrounds instanceof Map && warmBackgrounds.size > 0) {
          state.routeBackgroundsById = new Map([...state.routeBackgroundsById, ...warmBackgrounds]);
        }
      })
      .catch((error) => {
        console.warn(
          "Prechargement differe des assets de routes indisponible:",
          error instanceof Error ? error.message : String(error || ""),
        );
      })
      .finally(() => {
        scheduleNextChunk();
      });
  };

  const scheduleNextChunk = () => {
    if (queue.length <= 0) {
      return;
    }
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(
        () => {
          runNextChunk();
        },
        { timeout: 2500 },
      );
      return;
    }
    window.setTimeout(() => {
      runNextChunk();
    }, DEFERRED_ROUTE_WARMUP_DELAY_MS);
  };

  scheduleNextChunk();
}

function hasMissingRoutePokemonDefinitions(routeData) {
  const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  for (const encounter of encounters) {
    const id = Number(encounter?.id || 0);
    if (id > 0 && !state.pokemonDefsById.has(id)) {
      return true;
    }
  }
  return false;
}

function ensureRouteBackgroundLoaded(routeData) {
  const routeId = String(routeData?.route_id || "");
  if (!routeId) {
    return;
  }
  if (state.routeBackgroundsById.has(routeId) || pendingRouteBackgroundLoads.has(routeId)) {
    return;
  }
  const task = loadImage(routeData?.background_image || null)
    .then((image) => {
      state.routeBackgroundsById.set(routeId, image || null);
      if (state.routeData?.route_id === routeId) {
        state.backgroundImage = image || null;
        render();
      }
    })
    .finally(() => {
      pendingRouteBackgroundLoads.delete(routeId);
    });
  pendingRouteBackgroundLoads.set(routeId, task);
}

function ensureRouteDefinitionsLoaded(routeData) {
  const routeId = String(routeData?.route_id || "");
  if (!routeId || !hasMissingRoutePokemonDefinitions(routeData)) {
    return;
  }
  if (pendingRouteDefinitionLoads.has(routeId)) {
    return;
  }
  const task = loadPokemonDefinitions([routeData], { append: true })
    .then(() => {
      if (state.routeData?.route_id !== routeId) {
        return;
      }
      if (!state.battle || state.enemy || !isCurrentRouteCombatEnabled()) {
        return;
      }
      state.battle.spawnEnemy();
      state.enemy = state.battle.getEnemy();
      if (!state.simulationIdleMode) {
        updateHud();
      }
      render();
    })
    .catch((error) => {
      console.warn(
        `Impossible de precharger les definitions de ${routeId}:`,
        error instanceof Error ? error.message : String(error || ""),
      );
    })
    .finally(() => {
      pendingRouteDefinitionLoads.delete(routeId);
    });
  pendingRouteDefinitionLoads.set(routeId, task);
}

function ensureRouteDialoguesLoaded(routeData) {
  void preloadRouteDialogues([routeData]);
}

function ensureRouteAssetsLoaded(routeData) {
  if (!routeData || typeof routeData !== "object") {
    return;
  }
  ensureRouteBackgroundLoaded(routeData);
  ensureRouteDefinitionsLoaded(routeData);
  ensureRouteDialoguesLoaded(routeData);
}

function ensureUnlockedRoutesForCurrentCatalog() {
  if (!state.saveData) {
    return [DEFAULT_ROUTE_ID];
  }

  const availableRouteIds = getOrderedCatalogRouteIds();
  const normalizedUnlocked = normalizeUnlockedRouteIds(state.saveData.unlocked_route_ids, availableRouteIds);
  state.saveData.unlocked_route_ids = normalizedUnlocked;
  state.saveData.route_defeat_counts = normalizeRouteDefeatCounts(state.saveData.route_defeat_counts, availableRouteIds);
  return normalizedUnlocked;
}

function setActiveRoute(routeId, options = {}) {
  const announceUnlock = options?.announceUnlock === true;
  const desiredRouteId = String(routeId || DEFAULT_ROUTE_ID);
  const routeData = state.routeCatalog.get(desiredRouteId) || state.routeCatalog.get(DEFAULT_ROUTE_ID) || null;
  if (!routeData) {
    return false;
  }

  state.routeData = routeData;
  state.backgroundImage = state.routeBackgroundsById.get(routeData.route_id) || null;
  resetBackgroundDriftForRoute(routeData.route_id, { immediate: true });
  resetOnlyOneEncounterCycle(routeData.route_id);
  if (state.saveData) {
    state.saveData.current_route_id = routeData.route_id;
    ensureUnlockedRoutesForCurrentCatalog();
    if (getRouteUnlockMode(routeData.route_id) === "visit") {
      const unlockResult = tryUnlockNextRouteAfterDefeat(routeData.route_id);
      if (announceUnlock && unlockResult?.unlocked) {
        const unlockedNames = Array.isArray(unlockResult.route_names_fr) && unlockResult.route_names_fr.length > 0
          ? unlockResult.route_names_fr.join(", ")
          : unlockResult.route_name_fr;
        setTopMessage(`Zone debloquee: ${unlockedNames}`, 1700);
      }
    }
  }
  queueRoute1TutorialIfNeeded(routeData.route_id);
  refreshRouteUi();
  if (typeof refreshZoneActionButtons === "function") {
    refreshZoneActionButtons();
  }
  tryOpenPendingTutorialFlow();
  ensureRouteAssetsLoaded(routeData);
  return true;
}

function tryUnlockNextRouteAfterDefeat(routeId) {
  if (!state.saveData || !state.routeCatalog?.size) {
    return { unlocked: false, route_name_fr: null, route_names_fr: [] };
  }

  const currentRouteId = String(routeId || state.saveData.current_route_id || DEFAULT_ROUTE_ID);
  const unlockResult = tryUnlockConnectedRoutes({
    routeId: currentRouteId,
    routeCatalog: state.routeCatalog,
    unlockedRouteIds: ensureUnlockedRoutesForCurrentCatalog(),
    routeDefeatCounts: normalizeRouteDefeatCounts(
      state.saveData.route_defeat_counts,
      getOrderedCatalogRouteIds(),
      DEFAULT_ROUTE_ID,
      toSafeInt,
    ),
    zoneFlags: normalizeFlagIdList(state.saveData.zone_flags),
    availableRouteIds: getOrderedCatalogRouteIds(),
    defaultRouteId: DEFAULT_ROUTE_ID,
    fallbackUnlockTarget: getRouteUnlockDefeatTarget(currentRouteId),
    toSafeInt,
  });
  state.saveData.unlocked_route_ids = unlockResult.unlockedRouteIds;

  const unlockedRouteNames = Array.isArray(unlockResult.unlocked)
    ? unlockResult.unlocked.map((unlockedRouteId) => getRouteDisplayName(unlockedRouteId))
    : [];
  return {
    unlocked: unlockedRouteNames.length > 0,
    route_id: unlockResult.unlocked?.[0] || null,
    route_ids: Array.isArray(unlockResult.unlocked) ? unlockResult.unlocked : [],
    route_name_fr: unlockedRouteNames[0] || null,
    route_names_fr: unlockedRouteNames,
    unlock_mode: getRouteUnlockMode(currentRouteId),
    blocked: Array.isArray(unlockResult.blocked) ? unlockResult.blocked : [],
  };
}

  return {
    getWorldCoordinatesFromPointerEvent,
    isCanvasBattleInteractionBlocked,
    syncCanvasInteractionCursor,
    activateNextEvolutionAnimationIfNeeded,
    updateEvolutionAnimation,
    setHoveredBallOverlayType,
    setHoveredTeamSlotIndex,
    getNormalizedPointerType,
    isPrimaryCanvasPointerEvent,
    isEventFromActiveTeamDragPointer,
    captureCanvasPointer,
    releaseCanvasPointer,
    getTeamDragActivationDistancePx,
    getTeamContextTouchHoldCancelDistancePx,
    isTouchLikePointerType,
    resetTeamContextTouchHoldState,
    cancelTeamContextTouchHold,
    triggerTeamContextTouchHold,
    scheduleTeamContextTouchHold,
    updateTeamContextTouchHoldFromMove,
    isTeamSlotSwapAllowed,
    clearTeamDragState,
    beginTeamDragForSlot,
    isTeamDragClickSuppressed,
    swapTeamSlotsFromUi,
    getBallCaptureMenuBallType,
    closeBallCaptureMenu,
    closeTeamContextMenu,
    refreshRenameCharCount,
    closeRenameModal,
    openRenameModalForTeamSlot,
    applyRenameModal,
    clearCanvasHoverState,
    hideHoverPopup,
    findHoveredTeamSlot,
    findHoveredBallOverlayHitbox,
    findHoveredPokemon,
    showHoverPopup,
    positionFloatingMenuElement,
    setBallCaptureToggleButtonState,
    refreshBallCaptureMenu,
    setBallCaptureMenuBallType,
    openBallCaptureMenu,
    openTopbarBallCaptureMenu,
    toggleBallCaptureRule,
    refreshTeamContextMenu,
    openTeamContextMenu,
    getTeamSlotLabel,
    getPokemonDisplayNameById,
    levelUpAllOwnedPokemonFromDev,
    findTeamFamilyConflictSlotIndex,
    getCapturedEntityBoxesEntries,
    getCapturedEntityCount,
    getTotalShinyCapturesGlobal,
    sanitizeCollectionSearchQuery,
    normalizeCollectionSearchValue,
    getFilteredBoxesEntries,
    getFilteredPokedexEntries,
    cancelQueuedPokedexGridRender,
    cancelQueuedPokedexViewportRender,
    invalidatePokedexEntriesCache,
    queuePokedexGridRender,
    queuePokedexViewportRender,
    buildPokedexSpeciesHintMap,
    normalizePokedexSpeciesNameEn,
    getPokedexVariantPreferenceByPokemonId,
    buildPokedexSpeciesSpritePathForVariant,
    getPokedexPreferredOfflineVariantId,
    buildPokedexSpeciesSpritePath,
    getPokedexPreferredSpriteVariantFromDef,
    resolvePokedexSpeciesSpritePath,
    getPokedexSpeciesCatalogByPokemonId,
    refreshPokedexEntriesCacheIfNeeded,
    getPokedexEntries,
    getPokedexEntryByPokemonId,
    ensurePokedexEntryDefinitionLoaded,
    getPokedexSpeciesProgressCounters,
    formatPokedexSpeciesProgressPercent,
    formatPokedexCompletionPercentFromRatio,
    setPokedexHeaderProgressSummary,
    setPokedexInfoFromEntry,
    resetPokedexVirtualDomReferences,
    updatePokedexVirtualLayoutMetricsIfNeeded,
    getPokedexVirtualMetrics,
    resolvePokedexCardButtonFromEventTarget,
    handlePokedexCardInteractionEvent,
    bindPokedexVirtualEventsIfNeeded,
    ensurePokedexVirtualResizeObserver,
    ensurePokedexVirtualElements,
    prefetchPokedexSpritePath,
    prefetchPokedexSpritesAroundSlice,
    createPokedexLoadingIndicatorElement,
    attachPokedexSpriteLoadingLifecycle,
    createPokedexCardButton,
    renderPokedexViewportSlice,
    closePokedexModal,
    renderPokedexGrid,
    openPokedexModal,
    clearBoxesPendingSelection,
    confirmBoxesSelection,
    setBoxesInfoFromEntry,
    closeBoxesModal,
    renderBoxesGrid,
    openBoxesForTeamSlot,
    openBoxesForTrainerBattleSlot,
    renderTrainerBattleSetupModal,
    closeAppearanceModal,
    openAppearanceForPokemon,
    renderAppearanceModal,
    openAppearanceForTeamSlot,
    openAppearanceForBoxPokemon,
    toggleAppearanceShinyMode,
    toggleAppearanceUltraShinyMode,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasClick,
    handleCanvasContextMenu,
    handleCanvasPointerCancel,
    handleWindowPointerUpOutsideCanvas,
    exportTextState,
    getPokemonLoadTargets,
    setPokemonTalentCsvState,
    getPokemonTalentCsvForPokemonId,
    applyPokemonTalentCsvToDefinitions,
    setBallConfigState,
    setShopItemConfigState,
    setZoneEncounterCsvState,
    hasRouteUnlockedInSaveData,
    hasUnknownCaveUnlockedInSave,
    isPostUnknownCaveContentUnlocked,
    getCurrentPokedexMaxPokemonId,
    getCurrentGachaMaxPokemonId,
    formatPokemonRangeLabel,
    getCurrentGachaPokemonRangeLabel,
    getZoneEncounterCsvForRoute,
    mergeRouteEncountersFromCsv,
    cloneEncounterEntries,
    getRouteBaseEncounterEntries,
    applyEncounterMappingToRouteData,
    refreshRouteCatalogEncounterMapping,
    buildRouteDataPath,
    loadRouteData,
    loadRouteCatalog,
    getRouteDataListFromInput,
    getRouteDataByIds,
    getInitialAssetRouteIds,
    preloadRouteBackgrounds,
    queueDeferredRouteAssetWarmup,
    hasMissingRoutePokemonDefinitions,
    ensureRouteBackgroundLoaded,
    ensureRouteDefinitionsLoaded,
    ensureRouteAssetsLoaded,
    ensureUnlockedRoutesForCurrentCatalog,
    setActiveRoute,
    tryUnlockNextRouteAfterDefeat,
  };
}
