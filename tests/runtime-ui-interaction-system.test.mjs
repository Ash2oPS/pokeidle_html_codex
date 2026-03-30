import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

import { createRuntimeUiInteractionSystem } from "../systems/ui/runtime-ui-interaction-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeUiInteractionSystemPath = path.resolve(
  __dirname,
  "../systems/ui/runtime-ui-interaction-system.js",
);

function createClassList(hidden = false) {
  const classes = new Set(hidden ? ["hidden"] : []);
  return {
    add(...tokens) {
      for (const token of tokens) {
        classes.add(token);
      }
    },
    remove(...tokens) {
      for (const token of tokens) {
        classes.delete(token);
      }
    },
    toggle(token, force = undefined) {
      if (force === true) {
        classes.add(token);
        return true;
      }
      if (force === false) {
        classes.delete(token);
        return false;
      }
      if (classes.has(token)) {
        classes.delete(token);
        return false;
      }
      classes.add(token);
      return true;
    },
    contains(className) {
      return classes.has(className);
    },
  };
}

function createTestElement(tagName = "div") {
  const listeners = new Map();
  const classes = new Set();
  const styleValues = new Map();
  const element = {
    tagName: String(tagName || "div").toUpperCase(),
    children: [],
    style: {
      setProperty(name, value) {
        styleValues.set(String(name), String(value));
      },
      removeProperty(name) {
        styleValues.delete(String(name));
      },
      getPropertyValue(name) {
        return styleValues.get(String(name)) || "";
      },
    },
    dataset: {},
    textContent: "",
    className: "",
    disabled: false,
    value: "",
    type: "",
    src: "",
    alt: "",
    scrollTop: 0,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    replaceChildren(...children) {
      this.children = [...children];
      return children[children.length - 1];
    },
    remove() {
      this.removed = true;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    async trigger(type, event = {}) {
      const handler = listeners.get(type);
      if (!handler) {
        return undefined;
      }
      return handler({
        preventDefault() {},
        stopPropagation() {},
        currentTarget: this,
        target: this,
        ...event,
      });
    },
    focus() {},
    select() {},
    setAttribute(name, value) {
      this[name] = value;
    },
    classList: {
      add(...tokens) {
        for (const token of tokens) {
          classes.add(token);
        }
      },
      remove(...tokens) {
        for (const token of tokens) {
          classes.delete(token);
        }
      },
      contains(token) {
        return classes.has(token);
      },
      toggle(token, force = undefined) {
        if (force === true) {
          classes.add(token);
          return true;
        }
        if (force === false) {
          classes.delete(token);
          return false;
        }
        if (classes.has(token)) {
          classes.delete(token);
          return false;
        }
        classes.add(token);
        return true;
      },
    },
  };
  let innerHtml = "";
  Object.defineProperty(element, "innerHTML", {
    get() {
      return innerHtml;
    },
    set(value) {
      innerHtml = String(value || "");
      if (innerHtml === "") {
        element.children = [];
      }
    },
  });
  return element;
}

function createHiddenTestElement(tagName = "div") {
  const element = createTestElement(tagName);
  element.classList.add("hidden");
  return element;
}

function createTestDocument() {
  return {
    createElement(tagName) {
      return createTestElement(tagName);
    },
    createDocumentFragment() {
      return createTestElement("fragment");
    },
  };
}

function createBattleStub(overrides = {}) {
  return {
    attackTimerMs: 0,
    enemiesDefeated: 0,
    lastImpact: null,
    getTurnIndicator: () => null,
    getNextTurnPreview: () => null,
    getEnemyTimerState: () => null,
    getLastTurnEvent: () => null,
    getProjectiles: () => [],
    getLasers: () => [],
    getFloatingTexts: () => [],
    getEnemyDamageFlashBlend: () => 0,
    getSlotAttackFlashBlend: () => 0,
    getKoTransition: () => null,
    getCaptureSequence: () => null,
    getTeleportDamageBoostForSlot: () => 1,
    getTeleportBoostVisualIntensityForSlot: () => 0,
    ...overrides,
  };
}

function createUiInteractionSystem(overrides = {}) {
  const windowObject = overrides.window ?? {};
  const state = overrides.state ?? {
    mode: "ready",
    viewport: {
      width: 1280,
      height: 720,
      renderScale: 1,
    },
    performance: {
      quality: "medium",
      shortFrameMsEma: 16.67,
      renderFrameMsEma: 16.67,
      cpuFrameMsEma: 4.72,
    },
    battle: createBattleStub(overrides.battle),
    enemy: null,
    team: [],
    routeData: null,
    routeCatalog: new Map(),
    routeBackgroundsById: new Map(),
    saveData: null,
    ui: {
      hoveredTeamSlotIndex: -1,
      teamDragActive: false,
      teamDragMoved: false,
      teamDragSourceSlotIndex: -1,
      teamDragTargetSlotIndex: -1,
      shopOpen: false,
      mapOpen: false,
      gachaOpen: false,
      boxesOpen: false,
      boxesMode: "team",
      boxesTargetSlotIndex: -1,
      boxesHoverEntityId: null,
      boxesSearchQuery: "",
      pokedexOpen: false,
      pokedexHoverPokemonId: 0,
      pokedexSearchQuery: "",
      appearanceOpen: false,
      appearanceTargetSlotIndex: -1,
      appearancePokemonId: 0,
      teamContextMenuOpen: false,
      teamContextMenuSlotIndex: -1,
      ballCaptureMenuOpen: false,
      ballCaptureMenuBallType: "",
      tutorialOpen: false,
      trainerBattleSetupOpen: false,
    },
    trainerBattle: {
      active: null,
      selectedTeamIds: [],
      setupTrainerBattleId: "",
      setupSourceActionId: "",
      setupTargetSlotIndex: -1,
      definitionsById: new Map(),
    },
    gacha: {
      spinning: false,
      lastReward: null,
      lastRewards: [],
    },
    notifications: {
      items: [],
    },
    moneyHud: {
      displayValue: 0,
    },
    teamLevelUpEffects: [],
    teamXpGainEffects: [],
    backgroundDrift: {
      currentX: 0,
      currentY: 0,
    },
    tutorial: {
      active: null,
    },
    evolutionAnimation: {
      current: null,
      queue: [],
    },
    pokemonDefsById: new Map(),
    pokedexSpeciesCsvByPokemonId: new Map(),
  };
  const layout = overrides.layout ?? {
    centerX: 640,
    centerY: 360,
    teamSlots: [],
  };
  state.layout = layout;

  const bindings = {
    APP_VERSION: "0.1.47",
    APPEARANCE_UNLOCK_LEVEL: 25,
    Array,
    BALL_CAPTURE_RULE_CAPTURE_ALL: "all",
    BALL_CAPTURE_RULE_CAPTURE_OWNED: "owned",
    BALL_CAPTURE_RULE_CAPTURE_SHINY: "shiny",
    BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY: "ultra_shiny",
    BALL_CAPTURE_RULE_CAPTURE_UNOWNED: "unowned",
    BALL_CAPTURE_TOGGLE_DEFINITIONS: [],
    BALL_CONFIG_BY_TYPE: {},
    BALL_CONFIG_CSV_PATH: "ball-config.csv",
    BALL_TYPE_FALLBACK_ORDER: ["poke_ball"],
    BASE_STEP_MS: 1000 / 60,
    Boolean,
    DEFAULT_BALL_CONFIG_BY_TYPE: {},
    DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID: {},
    DEFAULT_ROUTE_ID: "kanto_route_1",
    DEFAULT_WILD_LEVEL_MAX: 5,
    DEFAULT_WILD_LEVEL_MIN: 2,
    DEFERRED_ROUTE_WARMUP_CHUNK_SIZE: 2,
    DEFERRED_ROUTE_WARMUP_DELAY_MS: 50,
    DISPLAY_APP_VERSION: "0.1.47",
    Date,
    Element: globalThis.Element,
    Error,
    EXTRA_SHOP_ITEM_CONFIG_BY_ID: {},
    GACHA_BASE_MAX_POKEMON_ID: 151,
    GACHA_EXTENDED_MAX_POKEMON_ID: 386,
    GACHA_SPIN_COST_COINS: 100,
    HTMLButtonElement: globalThis.HTMLButtonElement,
    HTMLElement: globalThis.HTMLElement,
    HTMLImageElement: globalThis.HTMLImageElement,
    Image: globalThis.Image,
    JSON,
    MAX_LEVEL: 100,
    MAX_TEAM_SIZE: 6,
    Map,
    Object,
    POKEDEX_BASE_MAX_POKEMON_ID: 151,
    POKEDEX_EXTENDED_MAX_POKEMON_ID: 386,
    POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS: new Set(),
    POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS: 2,
    POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3: ["firered_leafgreen", "ruby_sapphire"],
    POKEDEX_VARIANT_PREFERENCE_GEN_4: ["diamond_pearl"],
    POKEDEX_VIRTUAL_CARD_HEIGHT_PX: 100,
    POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX: 200,
    POKEDEX_VIRTUAL_GAP_PX: 12,
    POKEDEX_VIRTUAL_OVERSCAN_ROWS: 2,
    POKEMON_NICKNAME_MAX_LENGTH: 20,
    POKEMON_TALENTS_CSV_PATH: "pokemon-talents.csv",
    Promise,
    ROUTE_1_TUTORIAL_ID: "kanto_route_1_tutorial",
    ROUTE_DATA_DIR: "map_data",
    ROUTE_ENCOUNTERS_CSV_PATH: "route-encounters.csv",
    RUNTIME_CLIENT_BROWSER_PC: "browser_pc",
    RUNTIME_CLIENT_BROWSER_SMARTPHONE: "browser_smartphone",
    RUNTIME_CLIENT_DESKTOP_EXE_PC: "desktop_exe_pc",
    ResizeObserver: globalThis.ResizeObserver,
    SHOP_ITEMS_CSV_PATH: "shop-items.csv",
    SHOP_ITEM_CONFIG_BY_ID: {},
    SHOP_QUANTITY_MODE_MAX: "max",
    SHOP_TAB_COMBAT: "combat",
    SHOP_TAB_POKEBALLS: "pokeballs",
    STARTER_CHOICES: [],
    STAT_KEYS: [],
    STAT_LABELS_FR: {},
    Set,
    String,
    TALENT_NONE_DESCRIPTION_FR: "Aucun talent",
    TARGET_FRAME_MS: 16.67,
    TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX: 16,
    TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS: 450,
    TEAM_DRAG_CLICK_SUPPRESS_MS: 200,
    TEAM_DRAG_START_DISTANCE_PX: 8,
    TEAM_SPRITE_SCALE: 1,
    TRAINER_BATTLE_TEAM_SIZE_COUNT: 3,
    TRAINER_BATTLE_ENEMY_HP_MULTIPLIER: 5,
    TRAINER_BATTLE_ENEMY_TIMER_MS: 60000,
    TYPE_ICON_ASSET_DIR: "assets/type-icons",
    UNKNOWN_CAVE_ROUTE_ID: "unknown_cave",
    animatedSpriteFramesCache: new Map(),
    appearanceGridEl: { innerHTML: "" },
    appearanceModalEl: { classList: createClassList(true) },
    appearanceShinyStatusEl: { textContent: "" },
    appearanceShinyToggleButtonEl: { disabled: false, textContent: "" },
    appearanceSubtitleEl: { textContent: "" },
    appearanceTitleEl: { textContent: "" },
    appearanceUltraShinyToggleButtonEl: { disabled: false, textContent: "" },
    applyAppearanceModesToEvolutionFamily: () => ({ changed: false }),
    applyNicknameToEvolutionFamily: () => ({ changed: false, familySize: 0 }),
    applyTeamTalentOverrides: () => {},
    activateNextEvolutionAnimationIfNeeded: () => false,
    assertValidBallConfig: (value) => value,
    assertValidEncounter: (value) => value,
    assertValidShopItemConfig: (value) => value,
    ballCaptureMenuEl: createHiddenTestElement("div"),
    ballCaptureMenuTitleEl: { textContent: "" },
    ballCaptureMenuSummaryEl: { textContent: "" },
    ballCaptureMenuCloseButtonEl: createTestElement("button"),
    ballCaptureMenuTabsEl: createTestElement("div"),
    ballCaptureTabPokeButtonEl: createTestElement("button"),
    ballCaptureTabSuperButtonEl: createTestElement("button"),
    ballCaptureTabHyperButtonEl: createTestElement("button"),
    boxesGridEl: createTestElement("div"),
    boxesHeaderCopyEl: createTestElement("div"),
    boxesHeaderDefaultEl: createTestElement("div"),
    boxesInfoPanelEl: createTestElement("aside"),
    boxesMobileSelectionActionsEl: createTestElement("div"),
    boxesMobileSelectionCancelButtonEl: createTestElement("button"),
    boxesMobileSelectionConfirmButtonEl: createTestElement("button"),
    boxesMobileSelectionSummaryEl: createTestElement("div"),
    boxesSearchInputEl: createTestElement("input"),
    boxesModalEl: { classList: createClassList(true) },
    boxesShinyCounterEl: { textContent: "" },
    boxesSubtitleEl: { textContent: "" },
    canvas: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: state.viewport.width, height: state.viewport.height }),
      style: {},
    },
    captureRootEl: createTestElement("div"),
    clamp: (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)),
    cloneConfigMap: (value) => value,
    closeEvolutionItemChoiceModal: () => {},
    closeGachaModal: () => {},
    compareShopItems: () => 0,
    computeLayout: () => layout,
    computeStatsAtLevel: () => ({}),
    createRuntimeConfigLoaders: () => ({}),
    document: {
      createElement: (tagName) => createTestElement(tagName),
      createDocumentFragment: () => ({ appendChild() {} }),
    },
    ensureAppearanceEditorUnlockedFromProgress: () => false,
    ensureVariantAppearanceAssetsLoaded: async () => {},
    enqueueEvolutionReadyNotification: () => null,
    escapeHtml: (value) => String(value || ""),
    fetch: async () => ({ ok: true, json: async () => ({ encounters: [] }) }),
    formatCompactNumber: (value) => String(value ?? 0),
    formatTalentLabelFr: (talent) => talent?.nameFr || "Aucun",
    formatTypeLabelFr: (typeName) => String(typeName || ""),
    formatTypeListFr: (types) => (Array.isArray(types) ? types.join(", ") : ""),
    getActiveBallType: () => "poke_ball",
    getAttackBoostRemainingMs: () => 0,
    getBallCaptureRulesForType: () => [],
    getBallInventoryCount: () => 0,
    getBaseStatTotal: () => 0,
    getCapturedTotal: () => 0,
    getCurrentAttackIntervalMs: () => 800,
    getCurrentGachaMaxPokemonId: () => 151,
    getCurrentPokedexMaxPokemonId: () => 151,
    getEnemySpriteRenderSize: () => 96,
    getEnvironmentSnapshotForRender: () => ({
      localTimeLabel: "12:00",
      localHour: 12,
      localMinute: 0,
      timeOfDayTag: "day",
      dayLight: 1,
      night: 0,
    }),
    getEvolutionFamilySpeciesIds: () => [],
    getFamilyShinyCaptureCount: () => 0,
    getFamilyUltraShinyCaptureCount: () => 0,
    getGachaSkinCandidates: () => [],
    findNextEligibleEvolution: () => null,
    getLegendaryFieldAttackIntervalMultiplier: () => 1,
    getLegendaryFieldPresence: () => ({
      electric: false,
      ardent: false,
      arctic: false,
      trinityActive: false,
    }),
    getOrderedCatalogRouteIds: () => ["kanto_route_1"],
    getOrderedUnlockedRouteIds: () => ["kanto_route_1"],
    getOwnedSpriteVariantsForRecord: () => [],
    getPassiveBehaviorIdForTalentId: () => "",
    getPokemonDataSpriteScale: () => 1,
    getPokemonDisplayNameForOwnedEntity: () => "",
    getPokemonEntityRecord: () => null,
    getPokemonNicknameById: () => "",
    getPokemonNicknameLength: (value) => String(value || "").length,
    getPreferredDefaultSpriteVariant: () => null,
    getRouteDefeatCount: () => 0,
    getRouteDisplayName: () => "Route 1",
    getRouteUnlockDefeatTarget: () => 1,
    getRouteUnlockMode: () => "visit",
    getRouteUnlockProgressState: () => ({
      nextRouteId: null,
      unlockMode: "visit",
      unlockTarget: 1,
      currentDefeats: 0,
    }),
    getRouteZoneType: () => "route",
    getRuntimeClientType: () => "browser_pc",
    getSaveBackendTelemetryValue: () => "browser_local_storage",
    getSelectedOwnedSpriteVariantForRecord: () => null,
    getSelectedShopBallQuantity: () => 1,
    getShopItemCount: () => 0,
    getSortedBallConfigs: () => [],
    getSpeciesStatsSummary: () => ({
      encountered_total: 0,
      encountered_normal: 0,
      encountered_shiny: 0,
      captured_total: 0,
      captured_normal: 0,
      captured_shiny: 0,
    }),
    getSpriteVariantDisplayLabel: (variant) => variant?.labelFr || "",
    getSpriteVariantsForDef: () => [],
    getTeamAuraAttackBonusBySlot: () => Array.from({ length: 6 }, () => 0),
    getTeamBoxesAccessState: () => ({ allowed: true }),
    getTeamBoxesLockedMessage: () => "locked",
    getTeamSpriteScale: () => 1,
    getTutorialFlowDefinition: () => ({ pages: [{}] }),
    getTypeMultiplier: () => 1,
    getUiAnimationState: () => null,
    getVariantShinySpritePath: () => "",
    getXpToNextLevelForSpecies: () => 0,
    hasImplementedTalentEffect: () => false,
    hideModalWithTween: () => {},
    hidePopupWithTween: () => {},
    hoverPopupEl: createHiddenTestElement("div"),
    loadingScreenEl: createTestElement("div"),
    isAppearanceEditorUnlocked: () => false,
    isCurrentRouteCombatEnabled: () => true,
    isEntityUnlocked: () => false,
    isTrainerBattleActive: () => false,
    isShinyAppearanceUnlockedForRecord: () => false,
    isUltraShinyAppearanceUnlockedForRecord: () => false,
    loadImage: async () => null,
    loadPokemonDefinitions: async () => {},
    navigator: {},
    normalizePokemonEntityRecord: (value) => value,
    normalizeRouteDefeatCounts: (value) => value,
    normalizeShopQuantityMode: (value) => value || "1",
    normalizeSpriteVariantId: (value) => String(value || "").trim().toLowerCase(),
    normalizeStatsPayload: (value) => value,
    normalizeTalentDefinition: (value) => value,
    normalizeTalentId: (value) => String(value || ""),
    normalizeType: (value) => String(value || "").toLowerCase(),
    normalizeUiDisplayText: (value) => String(value || ""),
    normalizeUnlockedRouteIds: (value) => value || [],
    parseCsvMethods: () => [],
    parseCsvObjects: () => [],
    pendingRouteBackgroundLoads: new Map(),
    pendingRouteDefinitionLoads: new Map(),
    persistSaveData: () => {},
    pokedexCapturedStatEl: { textContent: "" },
    pokedexEncounteredStatEl: { textContent: "" },
    pokedexEntriesCacheById: new Map(),
    pokedexEntriesCacheCapturedSpeciesCount: 0,
    pokedexEntriesCacheDirty: true,
    pokedexEntriesCacheEncounteredSpeciesCount: 0,
    pokedexEntriesCacheList: [],
    pokedexEntriesCachePokemonDefsCount: 0,
    pokedexEntriesCacheSaveDataRef: null,
    pokedexEntriesCacheShinySpeciesCount: 0,
    pokedexEntriesCacheSpeciesRef: null,
    pokedexEntriesCacheUltraShinySpeciesCount: 0,
    pokedexGlobalCompletionEl: { textContent: "" },
    pokedexGridEl: createTestElement("div"),
    pokedexInfoPanelEl: createTestElement("aside"),
    pokedexModalEl: { classList: createClassList(true) },
    pokedexRenderRafHandle: 0,
    pokedexSearchInputEl: createTestElement("input"),
    pokedexShinyStatEl: { textContent: "" },
    pokedexSpritePrefetchStateByPath: new Map(),
    pokedexSubtitleEl: { textContent: "" },
    pokedexUltraShinyStatEl: { textContent: "" },
    pokedexViewportRenderRafHandle: 0,
    pokedexVirtualBottomSpacerEl: { style: {} },
    pokedexVirtualColumnGapPx: 12,
    pokedexVirtualContentEl: { innerHTML: "", style: {} },
    pokedexVirtualEventsBound: false,
    pokedexVirtualLastEndIndex: -1,
    pokedexVirtualLastSliceKey: "",
    pokedexVirtualLastStartIndex: -1,
    pokedexVirtualLayoutCacheKey: "",
    pokedexVirtualPaddingBottomPx: 0,
    pokedexVirtualPaddingLeftPx: 0,
    pokedexVirtualPaddingRightPx: 0,
    pokedexVirtualPaddingTopPx: 0,
    pokedexVirtualResizeObserver: null,
    pokedexVirtualRowGapPx: 12,
    pokedexVirtualTopSpacerEl: { style: {} },
    preloadSelectedAppearanceAssetsForTeam: async () => {},
    queueTeamLevelUpEffects: () => {},
    queueRoute1TutorialIfNeeded: () => {},
    readCsvBooleanCell: () => false,
    readCsvCell: () => "",
    readCsvNumberCell: () => 0,
    readCsvTypedValue: () => 0,
    rebuildEvolutionStoneConfigState: () => {},
    rebuildShopItemConfigState: () => {},
    rebuildTeamAndSyncBattle: () => {},
    reconcileAppearanceForEntityRecord: () => false,
    refreshBallConfigDerivedState: () => {},
    refreshRouteUi: () => {},
    renameCharCountEl: { textContent: "" },
    renameInputEl: { value: "", focus() {}, select() {} },
    renameModalEl: { classList: createClassList(true) },
    renameSubtitleEl: { textContent: "" },
    renameTitleEl: { textContent: "" },
    render: () => {},
    replaceConfigMap: (value) => value,
    resetBackgroundDriftForRoute: () => {},
    resetOnlyOneEncounterCycle: () => {},
    resolveEntitySpriteDrawSource: () => ({ frontPath: "" }),
    resolveSpriteAppearanceForEntity: () => ({}),
    resolveTalentDefinition: (talentId = "") => ({
      id: String(talentId || ""),
      nameFr: "Aucun",
      nameEn: "None",
      descriptionFr: "Aucun talent",
    }),
    sanitizePokemonNickname: (value) => String(value || "").trim(),
    setEntityLevel: (record, level) => {
      if (!record) {
        return;
      }
      record.level = level;
      if (record.level >= 100) {
        record.xp = 0;
      }
    },
    setBallCaptureRulesForType: () => {},
    setMapOpen: () => {},
    setShopOpen: () => {},
    setTopMessage: () => {},
    shouldFlipTeamSprite: () => false,
    shouldForceUltraShinyAllPokemon: () => false,
    showModalWithTween: () => {},
    showPopupWithTween: () => {},
    showTooltipWithTween: () => {},
    toggleActionDockFullscreenMenu: () => {},
    toggleRouteNavDrawer: () => {},
    triggerZoneAction: () => {},
    mapConnectionsInfoPanelEl: { classList: createClassList(true), replaceChildren() {} },
    routeNavInfoPanelEl: { classList: createClassList(true), replaceChildren() {} },
    routeNavPanelEl: createTestElement("div"),
    starterModalEl: { classList: createClassList(true) },
    state,
    teamContextMenuAppearanceButtonEl: { disabled: false },
    teamContextMenuBoxesButtonEl: { disabled: false },
    teamContextMenuEl: createHiddenTestElement("div"),
    teamContextMenuRenameButtonEl: { disabled: false },
    teamContextMenuTitleEl: { textContent: "" },
    trainerBattleSetupCancelButtonEl: createTestElement("button"),
    trainerBattleSetupCloseButtonEl: createTestElement("button"),
    trainerBattleSetupConfirmButtonEl: createTestElement("button"),
    trainerBattleSetupModalEl: { classList: createClassList(true) },
    trainerBattleSetupRosterEl: createTestElement("div"),
    trainerBattleSetupRulesEl: createTestElement("div"),
    trainerBattleSetupSlotsEl: createTestElement("div"),
    trainerBattleSetupStatusEl: { textContent: "", classList: createClassList(false) },
    trainerBattleSetupSubtitleEl: { textContent: "" },
    trainerBattleSetupTitleEl: { textContent: "" },
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    getTrainerBattleSetupDefinition: () => null,
    tryOpenPendingTutorialFlow: () => {},
    update: () => {},
    updateEvolutionAnimation: () => {},
    updateHud: () => {},
    validateRouteDataPayload: (value) => value,
    window: windowObject,
    ...overrides.bindings,
  };
  if (typeof bindings.getAppearanceUnlockState !== "function") {
    bindings.getAppearanceUnlockState = (pokemonId) => {
      const record = typeof bindings.getPokemonEntityRecord === "function"
        ? bindings.getPokemonEntityRecord(pokemonId)
        : null;
      const shinyUnlocked = Boolean(bindings.isShinyAppearanceUnlockedForRecord?.(record, pokemonId));
      const ultraUnlocked = Boolean(bindings.isUltraShinyAppearanceUnlockedForRecord?.(record, pokemonId));
      return {
        shinyUnlocked,
        ultraUnlocked,
        shinySource: shinyUnlocked ? "current_save" : "none",
        ultraSource: ultraUnlocked ? "current_save" : "none",
        familyShinyCaptures: shinyUnlocked ? 1 : 0,
        familyUltraShinyCaptures: ultraUnlocked ? 1 : 0,
      };
    };
  }

  const system = createRuntimeUiInteractionSystem({ bindings });
  return { bindings, system, state, window: windowObject };
}

function findDescendantByClassName(element, className) {
  if (!element || !Array.isArray(element.children)) {
    return null;
  }
  for (const child of element.children) {
    const childClasses = String(child.className || "").split(/\s+/).filter(Boolean);
    if (childClasses.includes(className)) {
      return child;
    }
    const nestedMatch = findDescendantByClassName(child, className);
    if (nestedMatch) {
      return nestedMatch;
    }
  }
  return null;
}

function findChildByDatasetValue(element, key, value) {
  if (!element || !Array.isArray(element.children)) {
    return null;
  }
  return element.children.find((child) => String(child?.dataset?.[key] || "") === String(value)) || null;
}

test("runtime ui interaction system exposes evolution animation helpers without dynamic factories", () => {
  const { system, window } = createUiInteractionSystem();

  assert.equal(typeof system.activateNextEvolutionAnimationIfNeeded, "function");
  assert.equal(typeof system.updateEvolutionAnimation, "function");
  assert.equal(window.render_game_to_text, system.exportTextState);
  assert.equal(typeof window.advanceTime, "function");
});

test("runtime ui interaction system prefers ruby_sapphire for offline Hoenn species sprites", () => {
  const { system } = createUiInteractionSystem();

  assert.equal(system.getPokedexPreferredOfflineVariantId(25), "firered_leafgreen");
  assert.equal(system.getPokedexPreferredOfflineVariantId(252), "ruby_sapphire");
});

test("runtime ui interaction system exports active laser debug state", () => {
  const lasers = [
    {
      attackType: "electric",
      sourceX: 128.2,
      sourceY: 64.9,
      targetX: 512.6,
      targetY: 256.4,
      attackerNameFr: "Pikachu",
    },
  ];
  const { system } = createUiInteractionSystem({
    battle: createBattleStub({
      getLasers: () => lasers,
    }),
  });

  const payload = JSON.parse(system.exportTextState());

  assert.deepEqual(payload.active_lasers, [
    {
      attack_mode: "laser",
      type: "electric",
      source_x: 128,
      source_y: 65,
      target_x: 513,
      target_y: 256,
      attacker_name_fr: "Pikachu",
    },
  ]);
});

test("runtime ui interaction system exports vfx render debug telemetry additively", () => {
  const { system } = createUiInteractionSystem({
    state: {
      mode: "ready",
      viewport: {
        width: 1280,
        height: 720,
        renderScale: 1,
      },
      performance: {
        quality: "high",
        shortFrameMsEma: 16.67,
        renderFrameMsEma: 16.67,
        cpuFrameMsEma: 4.72,
      },
      battle: createBattleStub(),
      enemy: null,
      team: [],
      routeData: null,
      routeCatalog: new Map(),
      routeBackgroundsById: new Map(),
      saveData: null,
      ui: {
        hoveredTeamSlotIndex: -1,
        teamDragActive: false,
        teamDragMoved: false,
        teamDragSourceSlotIndex: -1,
        teamDragTargetSlotIndex: -1,
        shopOpen: false,
        mapOpen: false,
        gachaOpen: false,
        boxesOpen: false,
        boxesTargetSlotIndex: -1,
        pokedexOpen: false,
        pokedexHoverPokemonId: 0,
        appearanceOpen: false,
        appearanceTargetSlotIndex: -1,
        appearancePokemonId: 0,
        teamContextMenuOpen: false,
        teamContextMenuSlotIndex: -1,
        ballCaptureMenuOpen: false,
        ballCaptureMenuBallType: "",
        tutorialOpen: false,
      },
      gacha: {
        spinning: false,
        lastReward: null,
        lastRewards: [],
      },
      notifications: {
        items: [],
      },
      moneyHud: {
        displayValue: 0,
      },
      teamLevelUpEffects: [],
      teamXpGainEffects: [],
      backgroundDrift: {
        currentX: 0,
        currentY: 0,
      },
      tutorial: {
        active: null,
      },
      evolutionAnimation: {
        current: null,
        queue: [],
      },
      vfxRenderDebug: {
        qualityTier: "hero_curved",
        projectile: {
          activeCount: 2,
          stampDrawCount: 4,
          trailStampDrawCount: 7,
          spriteCacheSize: 3,
          spriteCacheHits: 11,
          spriteCacheMisses: 2,
          trailCacheSize: 2,
          trailCacheHits: 9,
          trailCacheMisses: 1,
        },
        laser: {
          activeCount: 1,
          renderPathCounts: {
            packed_simple: 0,
            pixel_curved: 0,
            hero_curved: 1,
          },
          segmentCount: 9,
          particleCount: 5,
          textureCacheSize: 4,
          textureCacheHits: 12,
          textureCacheMisses: 1,
        },
      },
      pokemonDefsById: new Map(),
      pokedexSpeciesCsvByPokemonId: new Map(),
    },
  });

  const payload = JSON.parse(system.exportTextState());

  assert.deepEqual(payload.vfx_render_debug, {
    quality_tier: "hero_curved",
    projectile: {
      active_count: 2,
      stamp_draw_count: 4,
      trail_stamp_draw_count: 7,
      sprite_cache_size: 3,
      sprite_cache_hits: 11,
      sprite_cache_misses: 2,
      trail_cache_size: 2,
      trail_cache_hits: 9,
      trail_cache_misses: 1,
    },
    laser: {
      active_count: 1,
      render_path_counts: {
        packed_simple: 0,
        pixel_curved: 0,
        hero_curved: 1,
      },
      segment_count: 9,
      particle_count: 5,
      texture_cache_size: 4,
      texture_cache_hits: 12,
      texture_cache_misses: 1,
    },
  });
});

test("runtime ui interaction system materializes the module without chunk injection", () => {
  const source = fs.readFileSync(runtimeUiInteractionSystemPath, "utf8");

  assert.match(source, /export const RUNTIME_UI_INTERACTION_BINDING_KEYS/);
  assert.match(source, /function exportTextState\(/);
  assert.match(source, /active_lasers: \(battle \? battle\.getLasers\(\) : \[\]\)\.map/);
  assert.match(source, /vfx_render_debug:/);
  assert.doesNotMatch(source, /new Function/);
  assert.doesNotMatch(source, /with \(scope\)/);
  assert.doesNotMatch(source, /RUNTIME_UI_INTERACTION_CHUNK/);
  assert.doesNotMatch(source, /injectRuntimeUiLaserTextState/);
});

test("runtime ui interaction system exports attack modes for team members and live attacks", () => {
  const { system } = createUiInteractionSystem({
    state: {
      mode: "ready",
      viewport: {
        width: 1280,
        height: 720,
        renderScale: 1,
      },
      performance: {
        quality: "medium",
        shortFrameMsEma: 16.67,
        renderFrameMsEma: 16.67,
        cpuFrameMsEma: 4.72,
      },
      battle: createBattleStub({
        getProjectiles: () => [
          {
            attackMode: "projectile",
            attackType: "fire",
            x: 210.2,
            y: 118.9,
            attackerNameFr: "Salameche",
          },
        ],
      }),
      enemy: {
        id: 25,
        nameFr: "Pikachu",
        level: 12,
        attackMode: "laser",
        hpCurrent: 30,
        hpMax: 30,
        defensiveTypes: ["electric"],
      },
      team: [
        {
          id: 4,
          nameFr: "Salameche",
          level: 8,
          attackMode: "projectiles",
          offensiveType: "fire",
          defensiveTypes: ["fire"],
          xp: 0,
          xpToNext: 100,
        },
      ],
      routeData: null,
      routeCatalog: new Map(),
      routeBackgroundsById: new Map(),
      saveData: null,
      ui: {
        hoveredTeamSlotIndex: -1,
        teamDragActive: false,
        teamDragMoved: false,
        teamDragSourceSlotIndex: -1,
        teamDragTargetSlotIndex: -1,
        shopOpen: false,
        mapOpen: false,
        gachaOpen: false,
        boxesOpen: false,
        boxesTargetSlotIndex: -1,
        pokedexOpen: false,
        pokedexHoverPokemonId: 0,
        appearanceOpen: false,
        appearanceTargetSlotIndex: -1,
        appearancePokemonId: 0,
        teamContextMenuOpen: false,
        teamContextMenuSlotIndex: -1,
        ballCaptureMenuOpen: false,
        ballCaptureMenuBallType: "",
        tutorialOpen: false,
      },
      gacha: {
        spinning: false,
        lastReward: null,
        lastRewards: [],
      },
      notifications: {
        items: [],
      },
      moneyHud: {
        displayValue: 0,
      },
      teamLevelUpEffects: [],
      teamXpGainEffects: [],
      backgroundDrift: {
        currentX: 0,
        currentY: 0,
      },
      tutorial: {
        active: null,
      },
      evolutionAnimation: {
        current: null,
        queue: [],
      },
      pokemonDefsById: new Map(),
      pokedexSpeciesCsvByPokemonId: new Map(),
    },
    layout: {
      centerX: 640,
      centerY: 360,
      teamSlots: [{ x: 320, y: 420 }],
    },
  });

  const payload = JSON.parse(system.exportTextState());

  assert.equal(payload.enemy.attack_mode, "laser");
  assert.equal(payload.team[0].attack_mode, "projectiles");
  assert.deepEqual(payload.active_projectiles, [
    {
      attack_mode: "projectile",
      type: "fire",
      x: 210,
      y: 119,
      attacker_name_fr: "Salameche",
    },
  ]);
});

test("runtime ui interaction system falls back to browser globals for builtins omitted from bindings", () => {
  const { system, window } = createUiInteractionSystem();

  assert.equal(window.render_game_to_text, system.exportTextState);

  const payload = JSON.parse(window.render_game_to_text());

  assert.equal(payload.mode, "ready");
  assert.equal(payload.render_quality, "medium");
  assert.equal(payload.render_scale, 1);
});

test("runtime ui interaction system exports visual capture readiness and route nav state", () => {
  const visibleElement = createTestElement("div");
  const hiddenElement = createTestElement("div");
  hiddenElement.classList.add("hidden");

  const { system, state } = createUiInteractionSystem({
    bindings: {
      captureRootEl: visibleElement,
      loadingScreenEl: hiddenElement,
      routeNavPanelEl: visibleElement,
      routeNavInfoPanelEl: visibleElement,
      mapConnectionsInfoPanelEl: hiddenElement,
      starterModalEl: hiddenElement,
      getOrderedUnlockedRouteIds: () => ["kanto_route_1"],
      getRouteUnlockProgressState: () => ({
        nextRouteId: "kanto_city_viridian_city",
        unlockMode: "defeats",
        unlockTarget: 20,
        currentDefeats: 3,
      }),
      getRouteDisplayName: (routeId) => routeId,
    },
  });
  state.mode = "ready";
  state.saveData = {
    current_route_id: "kanto_route_1",
    unlocked_route_ids: ["kanto_route_1"],
    route_defeat_counts: { kanto_route_1: 3 },
    team: [1],
  };
  state.ui.routeNavDrawerOpen = true;
  state.ui.routeNavInfoRouteId = "kanto_city_viridian_city";

  const payload = JSON.parse(system.exportTextState());

  assert.equal(payload.boot_phase, "ready");
  assert.equal(payload.loading_overlay_visible, false);
  assert.equal(payload.visual_ready, true);
  assert.deepEqual(payload.route_nav_state, {
    hasDestinations: false,
    hasBlockedDestinations: false,
    hasInfoPanelTarget: false,
    drawerOpen: true,
    infoPanelOpen: true,
    selectedInfoRouteId: "kanto_city_viridian_city",
  });
});

test("runtime ui interaction system exports the injected design config snapshot", () => {
  const { system } = createUiInteractionSystem({
    bindings: {
      GAME_DESIGN_SNAPSHOT: {
        rarity: {
          shinyOdds: 777,
        },
      },
    },
  });

  const payload = JSON.parse(system.exportTextState());

  assert.deepEqual(payload.design_config_snapshot, {
    rarity: {
      shinyOdds: 777,
    },
  });
});

test("runtime ui interaction system normalizes collection search queries and filters box entries", () => {
  const { system, state } = createUiInteractionSystem();

  assert.equal(system.sanitizeCollectionSearchQuery("  Mimi   025  "), "Mimi 025");
  assert.equal(system.normalizeCollectionSearchValue("Pok\u00e9mon de For\u00eat"), "pokemon de foret");

  const entries = [
    { id: 25, nameFr: "Pikachu", baseNameFr: "Pikachu", nickname: "Mimi" },
    { id: 4, nameFr: "Salameche", baseNameFr: "Salameche", nickname: "" },
  ];

  state.ui.boxesSearchQuery = "mimi";
  assert.deepEqual(system.getFilteredBoxesEntries(entries).map((entry) => entry.id), [25]);

  state.ui.boxesSearchQuery = "004";
  assert.deepEqual(system.getFilteredBoxesEntries(entries).map((entry) => entry.id), [4]);
});

test("runtime ui interaction system filters pokedex entries by name, number and encounter zone", () => {
  const { system, state } = createUiInteractionSystem();
  const entries = [
    {
      id: 25,
      nameFr: "Pikachu",
      nameEn: "Pikachu",
      encounterZoneLabels: ["For\u00eat de Jade"],
    },
    {
      id: 7,
      nameFr: "Carapuce",
      nameEn: "Squirtle",
      encounterZoneLabels: ["Route 25"],
    },
  ];

  state.ui.pokedexSearchQuery = "jade";
  assert.deepEqual(system.getFilteredPokedexEntries(entries).map((entry) => entry.id), [25]);

  state.ui.pokedexSearchQuery = "squirtle";
  assert.deepEqual(system.getFilteredPokedexEntries(entries).map((entry) => entry.id), [7]);

  state.ui.pokedexSearchQuery = "025";
  assert.deepEqual(system.getFilteredPokedexEntries(entries).map((entry) => entry.id), [25]);
});

test("runtime ui interaction system decorates pokedex cards with attack mode badges", () => {
  const { system } = createUiInteractionSystem({
    bindings: {
      document: createTestDocument(),
    },
  });

  const button = system.createPokedexCardButton({
    id: 35,
    nameFr: "Melofee",
    discoveryState: "captured",
    attackMode: "laser",
    shinyModeUnlocked: true,
    ultraShinyModeUnlocked: false,
  });

  const badgeRow = findDescendantByClassName(button, "boxes-mode-badges");
  const attackBadge = findDescendantByClassName(button, "boxes-mode-badge-attack");

  assert.ok(badgeRow);
  assert.ok(attackBadge);
  assert.equal(attackBadge.dataset.attackMode, "laser");
  assert.match(attackBadge.className, /boxes-mode-badge-attack-laser/);
  assert.match(attackBadge.title, /Laser/);
});

test("runtime ui interaction system decorates box cards with attack mode badges", () => {
  const { bindings, state, system } = createUiInteractionSystem({
    bindings: {
      document: createTestDocument(),
      isEntityUnlocked: () => true,
      getCapturedTotal: () => 9,
      getXpToNextLevelForSpecies: () => 100,
      computeStatsAtLevel: () => ({}),
      resolveSpriteAppearanceForEntity: () => ({
        spritePath: "pokemon_data/25.png",
        variant: null,
        shinyVisual: false,
        shinyNegativeFallbackVisual: false,
        ultraShinyVisual: false,
      }),
      isShinyAppearanceUnlockedForRecord: () => false,
      isUltraShinyAppearanceUnlockedForRecord: () => true,
    },
  });
  state.saveData = {
    pokemon_entities: {
      25: {
        id: 25,
        level: 18,
        captured_normal: 9,
        attack_mode: "projectiles",
      },
    },
    team: [0, 0, 0, 0, 0, 0],
  };
  state.pokemonDefsById.set(25, {
    id: 25,
    nameFr: "Pikachu",
    spritePath: "pokemon_data/25.png",
    attackMode: "projectiles",
  });
  state.ui.boxesTargetSlotIndex = 0;

  system.renderBoxesGrid();

  const button = bindings.boxesGridEl.children[0];
  const badgeRow = findDescendantByClassName(button, "boxes-mode-badges");
  const attackBadge = findDescendantByClassName(button, "boxes-mode-badge-attack");
  const ultraBadge = findDescendantByClassName(button, "boxes-mode-badge-ultra");

  assert.ok(button);
  assert.ok(badgeRow);
  assert.ok(attackBadge);
  assert.ok(ultraBadge);
  assert.equal(attackBadge.dataset.attackMode, "projectile");
  assert.match(attackBadge.className, /boxes-mode-badge-attack-projectile/);
  assert.match(attackBadge.title, /Projectiles/);
});

test("runtime ui interaction system renders a compact enemy hover tooltip and clamps it inside the viewport", () => {
  const hoverPopupEl = createTestElement("div");
  hoverPopupEl.classList.add("hidden");
  hoverPopupEl.getBoundingClientRect = () => ({
    width: 320,
    height: 260,
    left: 0,
    top: 0,
    right: 320,
    bottom: 260,
  });

  let tooltipShowCount = 0;
  const { system } = createUiInteractionSystem({
    window: {
      innerWidth: 300,
      innerHeight: 220,
    },
    bindings: {
      hoverPopupEl,
      getSpeciesStatsSummary: () => ({
        encountered_total: 18,
        encountered_normal: 16,
        encountered_shiny: 2,
        encountered_ultra_shiny: 1,
        defeated_total: 7,
        defeated_normal: 6,
        defeated_shiny: 1,
        defeated_ultra_shiny: 0,
        captured_total: 4,
        captured_normal: 3,
        captured_shiny: 1,
        captured_ultra_shiny: 1,
      }),
      resolveTalentDefinition: () => ({
        id: "OVERGROW",
        nameFr: "Engrais",
        nameEn: "Overgrow",
        descriptionFr: "Booste les attaques plante quand les PV baissent.",
      }),
      showTooltipWithTween: (element) => {
        tooltipShowCount += 1;
        element.classList.remove("hidden");
      },
    },
  });

  system.showHoverPopup({
    id: 1,
    nameFr: "Bulbizarre",
    level: 12,
    attackMode: "laser",
    hpCurrent: 19,
    hpMax: 30,
    defensiveTypes: ["grass", "poison"],
    balanceTeamSize: 2,
    balanceHpMultiplier: 1.5,
    balanceRewardMultiplier: 1.25,
    isShiny: true,
    talent: "OVERGROW",
  }, 290, 210);

  assert.equal(tooltipShowCount, 1);
  assert.match(hoverPopupEl.innerHTML, /pokemon-info-card--tooltip/);
  assert.match(hoverPopupEl.innerHTML, /pokemon-info-hint-label">Talent</);
  assert.match(hoverPopupEl.innerHTML, /pokemon-info-zone-label">Types</);
  assert.match(hoverPopupEl.innerHTML, /hover-popup-progress-stat-label">Vu</);
  assert.match(hoverPopupEl.innerHTML, /hover-popup-progress-stat-label">Capt\.</);
  assert.match(hoverPopupEl.innerHTML, /Groupe/);
  assert.match(hoverPopupEl.innerHTML, /PV bonus/);
  assert.match(hoverPopupEl.innerHTML, /Butin/);
  assert.match(hoverPopupEl.innerHTML, /Adversaire/);
  assert.match(hoverPopupEl.innerHTML, /Shiny/);
  assert.equal(hoverPopupEl.style.left, "8px");
  assert.equal(hoverPopupEl.style.top, "8px");
});

test("runtime ui interaction system keeps floating hover popups inside runtime shell bounds", () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='hover-popup'></div></body></html>", {
    pretendToBeVisual: true,
  });
  const hoverPopupEl = dom.window.document.getElementById("hover-popup");
  hoverPopupEl.classList.add("hidden");
  hoverPopupEl.getBoundingClientRect = () => ({
    width: 180,
    height: 140,
    left: 0,
    top: 0,
    right: 180,
    bottom: 140,
  });
  dom.window.document.documentElement.style.setProperty("--ui-runtime-topbar-height-px", "64px");
  dom.window.document.documentElement.style.setProperty("--ui-runtime-dock-height-px", "56px");
  Object.defineProperty(dom.window, "innerWidth", {
    configurable: true,
    value: 400,
  });
  Object.defineProperty(dom.window, "innerHeight", {
    configurable: true,
    value: 520,
  });

  const { system } = createUiInteractionSystem({
    window: dom.window,
    bindings: {
      document: dom.window.document,
      hoverPopupEl,
      getSpeciesStatsSummary: () => ({
        encountered_total: 4,
        encountered_normal: 4,
        encountered_shiny: 0,
        encountered_ultra_shiny: 0,
        defeated_total: 1,
        defeated_normal: 1,
        defeated_shiny: 0,
        defeated_ultra_shiny: 0,
        captured_total: 0,
        captured_normal: 0,
        captured_shiny: 0,
        captured_ultra_shiny: 0,
      }),
      resolveTalentDefinition: () => ({
        id: "OVERGROW",
        nameFr: "Engrais",
        nameEn: "Overgrow",
        descriptionFr: "Booste les attaques plante quand les PV baissent.",
      }),
      showTooltipWithTween: (element) => {
        element.classList.remove("hidden");
      },
    },
  });

  system.showHoverPopup({
    id: 1,
    nameFr: "Bulbizarre",
    level: 12,
    attackMode: "laser",
    hpCurrent: 19,
    hpMax: 30,
    defensiveTypes: ["grass", "poison"],
    balanceTeamSize: 2,
    balanceHpMultiplier: 1.5,
    balanceRewardMultiplier: 1.25,
    talent: "OVERGROW",
  }, 18, 18);

  assert.equal(hoverPopupEl.style.left, "30px");
  assert.equal(hoverPopupEl.style.top, "72px");

  system.showHoverPopup({
    id: 1,
    nameFr: "Bulbizarre",
    level: 12,
    attackMode: "laser",
    hpCurrent: 19,
    hpMax: 30,
    defensiveTypes: ["grass", "poison"],
    balanceTeamSize: 2,
    balanceHpMultiplier: 1.5,
    balanceRewardMultiplier: 1.25,
    talent: "OVERGROW",
  }, 392, 508);

  assert.equal(hoverPopupEl.style.left, "200px");
  assert.equal(hoverPopupEl.style.top, "316px");
});

test("runtime ui interaction system dispatches canvas shell overlay actions", () => {
  let popupShowCount = 0;
  let popupHideCount = 0;
  let toggleRouteNavDrawerCallCount = 0;
  let toggleActionDockFullscreenMenuCallCount = 0;
  const triggeredZoneActionIds = [];
  let renderCallCount = 0;
  const shellHitboxes = [
    {
      id: "runtime-shell-topbar-balls",
      x: 10,
      y: 10,
      width: 80,
      height: 40,
      interactive: true,
      actionType: "topbar-ball-menu",
    },
    {
      id: "runtime-shell-route-nav-toggle",
      x: 100,
      y: 10,
      width: 110,
      height: 44,
      interactive: true,
      actionType: "route-nav-drawer-toggle",
    },
    {
      id: "runtime-shell-action-dock-toggle",
      x: 220,
      y: 10,
      width: 120,
      height: 44,
      interactive: true,
      actionType: "action-dock-menu-toggle",
    },
    {
      id: "runtime-zone-action-camp",
      x: 350,
      y: 10,
      width: 140,
      height: 40,
      interactive: true,
      actionType: "zone-action",
      actionId: "camp",
    },
  ];

  const { system, state } = createUiInteractionSystem({
    bindings: {
      BALL_CONFIG_BY_TYPE: {
        poke_ball: { type: "poke_ball", icon: "P" },
      },
      getBallCaptureRulesForType: () => ({}),
      showPopupWithTween: () => {
        popupShowCount += 1;
      },
      hidePopupWithTween: () => {
        popupHideCount += 1;
      },
      toggleRouteNavDrawer: () => {
        toggleRouteNavDrawerCallCount += 1;
      },
      toggleActionDockFullscreenMenu: () => {
        toggleActionDockFullscreenMenuCallCount += 1;
      },
      triggerZoneAction: (actionId) => {
        triggeredZoneActionIds.push(String(actionId || ""));
      },
      render: () => {
        renderCallCount += 1;
      },
    },
  });

  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 40, clientY: 30 });
  assert.equal(state.ui.ballCaptureMenuOpen, true);

  state.ui.ballCaptureMenuOpen = true;
  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 40, clientY: 30 });
  assert.equal(state.ui.ballCaptureMenuOpen, false);

  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 130, clientY: 28 });
  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 250, clientY: 28 });
  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 380, clientY: 28 });

  assert.equal(popupShowCount, 1);
  assert.equal(popupHideCount, 2);
  assert.equal(toggleRouteNavDrawerCallCount, 1);
  assert.equal(toggleActionDockFullscreenMenuCallCount, 1);
  assert.deepEqual(triggeredZoneActionIds, ["camp"]);
  assert.equal(renderCallCount, 2);
});

test("runtime ui interaction system dispatches canvas shell overlay actions on mobile canvas-first shells", () => {
  let toggleRouteNavDrawerCallCount = 0;
  let toggleActionDockFullscreenMenuCallCount = 0;
  let topbarToggleCallCount = 0;
  const triggeredZoneActionIds = [];
  const shellHitboxes = [
    {
      id: "runtime-shell-topbar-balls",
      x: 10,
      y: 10,
      width: 80,
      height: 40,
      interactive: true,
      actionType: "topbar-ball-menu",
    },
    {
      id: "runtime-shell-route-nav-toggle",
      x: 100,
      y: 10,
      width: 110,
      height: 44,
      interactive: true,
      actionType: "route-nav-drawer-toggle",
    },
    {
      id: "runtime-shell-action-dock-toggle",
      x: 220,
      y: 10,
      width: 120,
      height: 44,
      interactive: true,
      actionType: "action-dock-menu-toggle",
    },
    {
      id: "runtime-zone-action-camp",
      x: 350,
      y: 10,
      width: 140,
      height: 40,
      interactive: true,
      actionType: "zone-action",
      actionId: "camp",
    },
  ];

  const { system, state } = createUiInteractionSystem({
    layout: {
      centerX: 196,
      centerY: 392,
      teamSlots: [],
      layoutMode: "mobilePortrait",
      viewportProfile: {
        phone: true,
      },
    },
    bindings: {
      BALL_CONFIG_BY_TYPE: {
        poke_ball: { type: "poke_ball", icon: "P" },
      },
      getBallCaptureRulesForType: () => ({}),
      showPopupWithTween: () => {
        topbarToggleCallCount += 1;
      },
      toggleRouteNavDrawer: () => {
        toggleRouteNavDrawerCallCount += 1;
      },
      toggleActionDockFullscreenMenu: () => {
        toggleActionDockFullscreenMenuCallCount += 1;
      },
      triggerZoneAction: (actionId) => {
        triggeredZoneActionIds.push(String(actionId || ""));
      },
      render: () => {},
    },
  });

  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 40, clientY: 30 });
  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 130, clientY: 28 });
  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 250, clientY: 28 });
  state.ui.canvasOverlayActionHitboxes = shellHitboxes.map((hitbox) => ({ ...hitbox }));
  system.handleCanvasClick({ button: 0, clientX: 380, clientY: 28 });

  assert.equal(state.ui.ballCaptureMenuOpen, true);
  assert.equal(topbarToggleCallCount, 1);
  assert.equal(toggleRouteNavDrawerCallCount, 1);
  assert.equal(toggleActionDockFullscreenMenuCallCount, 1);
  assert.deepEqual(triggeredZoneActionIds, ["camp"]);
});

test("runtime ui interaction system renders live team hover tooltip combat metrics", () => {
  const hoverPopupEl = createTestElement("div");
  hoverPopupEl.getBoundingClientRect = () => ({
    width: 220,
    height: 180,
    left: 0,
    top: 0,
    right: 220,
    bottom: 180,
  });

  const member = {
    id: 4,
    nameFr: "Salameche",
    level: 14,
    attackMode: "projectiles",
    offensiveType: "fire",
    defensiveTypes: ["fire"],
    hpCurrent: 34,
    hpMax: 48,
    xp: 44,
    xpToNext: 100,
    talent: "BLAZE",
  };

  const { system } = createUiInteractionSystem({
    state: {
      mode: "ready",
      viewport: {
        width: 1280,
        height: 720,
        renderScale: 1,
      },
      performance: {
        quality: "medium",
        shortFrameMsEma: 16.67,
        renderFrameMsEma: 16.67,
        cpuFrameMsEma: 4.72,
      },
      battle: createBattleStub({
        getTeleportDamageBoostForSlot: () => 1.6,
      }),
      enemy: {
        id: 7,
        nameFr: "Carapuce",
        defensiveTypes: ["water"],
      },
      team: [member],
      routeData: null,
      routeCatalog: new Map(),
      routeBackgroundsById: new Map(),
      saveData: null,
      ui: {
        hoveredTeamSlotIndex: -1,
        teamDragActive: false,
        teamDragMoved: false,
        teamDragSourceSlotIndex: -1,
        teamDragTargetSlotIndex: -1,
        shopOpen: false,
        mapOpen: false,
        gachaOpen: false,
        boxesOpen: false,
        boxesTargetSlotIndex: -1,
        boxesSearchQuery: "",
        pokedexOpen: false,
        pokedexHoverPokemonId: 0,
        pokedexSearchQuery: "",
        appearanceOpen: false,
        appearanceTargetSlotIndex: -1,
        appearancePokemonId: 0,
        teamContextMenuOpen: false,
        teamContextMenuSlotIndex: -1,
        ballCaptureMenuOpen: false,
        ballCaptureMenuBallType: "",
        tutorialOpen: false,
      },
      gacha: {
        spinning: false,
        lastReward: null,
        lastRewards: [],
      },
      notifications: {
        items: [],
      },
      moneyHud: {
        displayValue: 0,
      },
      teamLevelUpEffects: [],
      teamXpGainEffects: [],
      backgroundDrift: {
        currentX: 0,
        currentY: 0,
      },
      tutorial: {
        active: null,
      },
      evolutionAnimation: {
        current: null,
        queue: [],
      },
      pokemonDefsById: new Map(),
      pokedexSpeciesCsvByPokemonId: new Map(),
    },
    bindings: {
      hoverPopupEl,
      getSpeciesStatsSummary: () => ({
        encountered_total: 12,
        encountered_normal: 12,
        encountered_shiny: 0,
        encountered_ultra_shiny: 0,
        defeated_total: 4,
        defeated_normal: 4,
        defeated_shiny: 0,
        defeated_ultra_shiny: 0,
        captured_total: 1,
        captured_normal: 1,
        captured_shiny: 0,
        captured_ultra_shiny: 0,
      }),
      getTeamAuraAttackBonusBySlot: () => [0.18],
      getTypeMultiplier: () => 2,
      resolveTalentDefinition: () => ({
        id: "BLAZE",
        nameFr: "Brasier",
        nameEn: "Blaze",
        descriptionFr: "Renforce l'équipe feu.",
      }),
      showTooltipWithTween() {},
    },
  });

  system.showHoverPopup(member, 120, 90);

  assert.match(hoverPopupEl.innerHTML, /Slot 1/);
  assert.match(hoverPopupEl.innerHTML, /Matchup/);
  assert.match(hoverPopupEl.innerHTML, /x2/);
  assert.match(hoverPopupEl.innerHTML, /Aura/);
  assert.match(hoverPopupEl.innerHTML, /\+18%/);
  assert.match(hoverPopupEl.innerHTML, /T[ée]l[ée]port/);
  assert.match(hoverPopupEl.innerHTML, /XP/);
  assert.match(hoverPopupEl.innerHTML, /pokemon-info-zone-label">Types</);
});

test("runtime ui interaction system promotes desktop hover and menus to canvas-owned overlay models", () => {
  const member = {
    id: 25,
    nameFr: "Pikachu",
    level: 18,
    hpCurrent: 35,
    hpMax: 52,
    xp: 42,
    xpToNext: 100,
    attackMode: "projectiles",
    offensiveType: "electric",
    defensiveTypes: ["electric"],
    talent: "STATIC",
  };
  const { bindings, state, system } = createUiInteractionSystem({
    state: {
      mode: "ready",
      viewport: { width: 1280, height: 720, renderScale: 1 },
      performance: { quality: "medium", shortFrameMsEma: 16.67, renderFrameMsEma: 16.67, cpuFrameMsEma: 4.72 },
      battle: createBattleStub(),
      enemy: null,
      team: [member],
      routeData: null,
      routeCatalog: new Map(),
      routeBackgroundsById: new Map(),
      saveData: { team: [25], ball_capture_rules: {} },
      ui: {
        hoveredTeamSlotIndex: -1,
        teamDragActive: false,
        teamDragMoved: false,
        teamDragSourceSlotIndex: -1,
        teamDragTargetSlotIndex: -1,
        shopOpen: false,
        mapOpen: false,
        gachaOpen: false,
        boxesOpen: false,
        boxesTargetSlotIndex: -1,
        boxesSearchQuery: "",
        pokedexOpen: false,
        pokedexHoverPokemonId: 0,
        pokedexSearchQuery: "",
        appearanceOpen: false,
        appearanceTargetSlotIndex: -1,
        appearancePokemonId: 0,
        teamContextMenuOpen: false,
        teamContextMenuSlotIndex: -1,
        ballCaptureMenuOpen: false,
        ballCaptureMenuBallType: "",
        tutorialOpen: false,
      },
      gacha: { spinning: false, lastReward: null, lastRewards: [] },
      notifications: { items: [] },
      moneyHud: { displayValue: 0 },
      teamLevelUpEffects: [],
      teamXpGainEffects: [],
      backgroundDrift: { currentX: 0, currentY: 0 },
      tutorial: { active: null },
      evolutionAnimation: { current: null, queue: [] },
      pokemonDefsById: new Map([[25, member]]),
      pokedexSpeciesCsvByPokemonId: new Map(),
    },
    bindings: {
      BALL_CONFIG_BY_TYPE: {
        poke_ball: { nameFr: "Poké Ball", spritePath: "poke.png" },
        super_ball: { nameFr: "Super Ball", spritePath: "super.png" },
        hyper_ball: { nameFr: "Hyper Ball", spritePath: "hyper.png" },
      },
      BALL_TYPE_FALLBACK_ORDER: ["poke_ball", "super_ball", "hyper_ball"],
      BALL_CAPTURE_TOGGLE_DEFINITIONS: [
        { key: "all", label: "Tout", description: "Capture tout", buttonEl: createTestElement("button") },
        { key: "unowned", label: "Nouveau", description: "Capture les nouveaux", buttonEl: createTestElement("button") },
      ],
      getSpeciesStatsSummary: () => ({
        encountered_total: 12,
        encountered_normal: 12,
        encountered_shiny: 0,
        encountered_ultra_shiny: 0,
        defeated_total: 4,
        defeated_normal: 4,
        defeated_shiny: 0,
        defeated_ultra_shiny: 0,
        captured_total: 1,
        captured_normal: 1,
        captured_shiny: 0,
        captured_ultra_shiny: 0,
      }),
      getBallInventoryCount: (ballType) => {
        switch (ballType) {
          case "poke_ball":
            return 12;
          case "super_ball":
            return 5;
          case "hyper_ball":
            return 2;
          default:
            return 0;
        }
      },
      getBallCaptureRulesForType: () => ({
        all: true,
        unowned: true,
      }),
      teamContextMenuRenameButtonEl: createTestElement("button"),
      teamContextMenuBoxesButtonEl: createTestElement("button"),
      teamContextMenuAppearanceButtonEl: createTestElement("button"),
      getTeamBoxesAccessState: () => ({ allowed: true }),
      isAppearanceEditorUnlocked: () => true,
      resolveTalentDefinition: () => ({
        id: "STATIC",
        nameFr: "Statik",
        nameEn: "Static",
        descriptionFr: "Peut paralyser au contact.",
      }),
      showPopupWithTween: (element) => element.classList.remove("hidden"),
      showTooltipWithTween: (element) => element.classList.remove("hidden"),
    },
  });

  system.showHoverPopup(member, 120, 90);
  assert.equal(state.ui.canvasHoverPopupModel?.title, "Pikachu");
  assert.match(state.ui.canvasHoverPopupModel?.typeSummaryText || "", /Déf\./);

  system.openTeamContextMenu(0, member, 120, 90);
  assert.equal(state.ui.canvasTeamContextMenuModel?.buttons?.length, 3);
  assert.equal(state.ui.canvasHoverPopupModel, null);

  system.openBallCaptureMenu("poke_ball", 120, 90);
  assert.equal(state.ui.canvasBallCaptureMenuModel?.tabs?.length, 3);
  assert.equal(state.ui.canvasTeamContextMenuModel, null);
});

test("runtime ui interaction system renders the mobile team hover as a quick bottom sheet", () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='hover-popup'></div></body></html>", {
    pretendToBeVisual: true,
  });
  const hoverPopupEl = dom.window.document.getElementById("hover-popup");
  hoverPopupEl.classList.add("hidden");
  hoverPopupEl.getBoundingClientRect = () => ({
    width: 320,
    height: 180,
    left: 0,
    top: 0,
    right: 320,
    bottom: 180,
  });

  const member = {
    id: 25,
    nameFr: "Pikachu",
    level: 18,
    hpCurrent: 35,
    hpMax: 52,
    xp: 42,
    xpToNext: 100,
    attackMode: "projectiles",
    offensiveType: "electric",
    defensiveTypes: ["electric"],
    talent: "STATIC",
  };

  const { state, system } = createUiInteractionSystem({
    window: dom.window,
    layout: {
      centerX: 640,
      centerY: 360,
      teamSlots: [],
      viewportProfile: { phone: true },
    },
    bindings: {
      document: dom.window.document,
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      HTMLButtonElement: dom.window.HTMLButtonElement,
      HTMLImageElement: dom.window.HTMLImageElement,
      hoverPopupEl,
      getSpeciesStatsSummary: () => ({
        encountered_total: 12,
        encountered_normal: 12,
        encountered_shiny: 0,
        encountered_ultra_shiny: 0,
        defeated_total: 8,
        defeated_normal: 8,
        defeated_shiny: 0,
        defeated_ultra_shiny: 0,
        captured_total: 2,
        captured_normal: 2,
        captured_shiny: 0,
        captured_ultra_shiny: 0,
      }),
      resolveTalentDefinition: () => ({
        id: "STATIC",
        nameFr: "Statik",
        nameEn: "Static",
        descriptionFr: "Peut paralyser au contact.",
      }),
      showTooltipWithTween: (element) => {
        element.classList.remove("hidden");
      },
    },
  });
  state.layout.viewportProfile = { phone: true };
  state.team = [member];

  system.showHoverPopup(member, 120, 90);

  assert.match(hoverPopupEl.innerHTML, /pokemon-info-card--quick/);
  assert.match(hoverPopupEl.innerHTML, /hover-popup-micro-grid--quick/);
  assert.equal(hoverPopupEl.classList.contains("is-mobile-bottom-sheet"), true);
  assert.equal(hoverPopupEl.style.getPropertyValue("--context-sheet-max-width"), "360px");
  assert.equal(hoverPopupEl.style.left, "50%");
  dom.window.close();
});

test("runtime ui interaction system keeps mobile bottom-sheet offsets to dock protrusion only", () => {
  const dom = new JSDOM(
    "<!doctype html><html><body><button id='action-dock-pokeball-toggle'></button><div id='team-context-menu'></div></body></html>",
    { pretendToBeVisual: true },
  );
  Object.defineProperty(dom.window, "innerWidth", { value: 390, configurable: true });
  Object.defineProperty(dom.window, "innerHeight", { value: 844, configurable: true });
  dom.window.document.documentElement.style.setProperty("--ui-mobile-bottom-offset-px", "12px");
  dom.window.document.documentElement.style.setProperty("--ui-runtime-dock-height-px", "92px");

  const dockToggleEl = dom.window.document.getElementById("action-dock-pokeball-toggle");
  dockToggleEl.getBoundingClientRect = () => ({
    width: 92,
    height: 92,
    left: 0,
    top: 710,
    right: 92,
    bottom: 802,
  });

  const teamContextMenuEl = dom.window.document.getElementById("team-context-menu");
  teamContextMenuEl.classList.add("hidden");

  const { state, system } = createUiInteractionSystem({
    window: dom.window,
    layout: {
      centerX: 195,
      centerY: 422,
      teamSlots: [],
      viewportProfile: { phone: true },
    },
    bindings: {
      document: dom.window.document,
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      HTMLButtonElement: dom.window.HTMLButtonElement,
      HTMLImageElement: dom.window.HTMLImageElement,
      teamContextMenuEl,
      teamContextMenuTitleEl: dom.window.document.createElement("div"),
      teamContextMenuRenameButtonEl: dom.window.document.createElement("button"),
      teamContextMenuBoxesButtonEl: dom.window.document.createElement("button"),
      teamContextMenuAppearanceButtonEl: dom.window.document.createElement("button"),
      showPopupWithTween: (element) => {
        element.classList.remove("hidden");
      },
    },
  });

  state.layout.viewportProfile = { phone: true };
  state.team = [{ id: 1, nameFr: "Bulbizarre", level: 5 }];

  system.openTeamContextMenu(0, state.team[0], 120, 90);

  assert.equal(teamContextMenuEl.classList.contains("is-mobile-bottom-sheet"), true);
  assert.equal(teamContextMenuEl.style.getPropertyValue("--context-sheet-bottom-offset-px"), "54px");
  dom.window.close();
});

test("runtime ui interaction system requires explicit mobile confirmation in boxes", async () => {
  const { bindings, state, system } = createUiInteractionSystem({
    bindings: {
      getBaseStatTotal: () => 273,
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[pokemonId] || null,
      isEntityUnlocked: () => true,
      setTopMessage: () => {},
    },
  });

  state.layout.viewportProfile = { phone: true };
  state.saveData = {
    team: [25, 0, 0, 0, 0, 0],
    pokemon_entities: {
      25: { id: 25, captured_normal: 1 },
      32: { id: 32, level: 1, captured_normal: 1, encountered_normal: 3, defeated_normal: 3 },
    },
  };
  state.pokemonDefsById.set(25, {
    id: 25,
    nameFr: "Pikachu",
    spritePath: "pokemon_data/25.png",
    attackMode: "projectiles",
    offensiveType: "electric",
    defensiveTypes: ["electric"],
  });
  state.pokemonDefsById.set(32, {
    id: 32,
    nameFr: "Nidoran",
    spritePath: "pokemon_data/32.png",
    attackMode: "projectiles",
    offensiveType: "poison",
    defensiveTypes: ["poison"],
  });
  state.ui.boxesTargetSlotIndex = 0;
  state.ui.boxesHoverEntityId = null;

  system.renderBoxesGrid();

  assert.equal(bindings.boxesInfoPanelEl.classList.contains("is-sheet-open"), false);
  assert.equal(state.saveData.team[0], 25);
  assert.equal(bindings.boxesMobileSelectionSummaryEl.classList.contains("hidden"), true);

  await bindings.boxesGridEl.children[1].trigger("click");

  assert.equal(state.saveData.team[0], 25);
  assert.equal(state.ui.boxesHoverEntityId, 32);
  assert.equal(bindings.boxesInfoPanelEl.classList.contains("is-sheet-open"), false);
  assert.equal(bindings.boxesHeaderDefaultEl.classList.contains("hidden"), true);
  assert.equal(bindings.boxesMobileSelectionSummaryEl.classList.contains("hidden"), false);
  assert.match(bindings.boxesMobileSelectionSummaryEl.innerHTML, /Nidoran/);
  assert.equal(bindings.boxesMobileSelectionConfirmButtonEl.disabled, false);

  system.confirmBoxesSelection();

  assert.equal(state.saveData.team[0], 32);
  assert.equal(state.ui.boxesOpen, false);
});

test("runtime ui interaction system cancels the pending mobile boxes selection", async () => {
  const { bindings, state, system } = createUiInteractionSystem({
    bindings: {
      getBaseStatTotal: () => 273,
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[pokemonId] || null,
      isEntityUnlocked: () => true,
    },
  });

  state.layout.viewportProfile = { phone: true };
  state.saveData = {
    team: [25, 0, 0, 0, 0, 0],
    pokemon_entities: {
      25: { id: 25, captured_normal: 1 },
      32: { id: 32, level: 1, captured_normal: 1 },
    },
  };
  for (const [id, nameFr, type] of [[25, "Pikachu", "electric"], [32, "Nidoran", "poison"]]) {
    state.pokemonDefsById.set(id, {
      id,
      nameFr,
      spritePath: `pokemon_data/${id}.png`,
      attackMode: "projectiles",
      offensiveType: type,
      defensiveTypes: [type],
    });
  }
  state.ui.boxesOpen = true;
  state.ui.boxesTargetSlotIndex = 0;

  system.renderBoxesGrid();
  await bindings.boxesGridEl.children[1].trigger("click");

  assert.equal(state.ui.boxesHoverEntityId, 32);

  system.clearBoxesPendingSelection({ rerender: true });

  assert.equal(state.ui.boxesHoverEntityId, null);
  assert.equal(bindings.boxesHeaderDefaultEl.classList.contains("hidden"), false);
  assert.equal(bindings.boxesMobileSelectionSummaryEl.classList.contains("hidden"), true);
});

test("runtime ui interaction system keeps trainer battle box selection temporary", async () => {
  const { bindings, state, system } = createUiInteractionSystem({
    bindings: {
      document: createTestDocument(),
      getBaseStatTotal: () => 273,
      getCapturedTotal: () => 1,
      getXpToNextLevelForSpecies: () => 100,
      computeStatsAtLevel: () => ({}),
      resolveSpriteAppearanceForEntity: (pokemonId) => ({
        spritePath: `pokemon_data/${pokemonId}.png`,
        variant: null,
        shinyVisual: false,
        shinyNegativeFallbackVisual: false,
        ultraShinyVisual: false,
      }),
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[String(pokemonId)] || null,
      isEntityUnlocked: (record) => Boolean(record?.entity_unlocked),
      showModalWithTween: () => {},
      hideModalWithTween: () => {},
      showPopupWithTween: () => {},
      setTopMessage: () => {},
    },
  });

  state.saveData = {
    team: [25, 4, 7, 0, 0, 0],
    pokemon_entities: {
      4: { id: 4, level: 12, entity_unlocked: true, captured_normal: 1 },
      7: { id: 7, level: 12, entity_unlocked: true, captured_normal: 1 },
      25: { id: 25, level: 18, entity_unlocked: true, captured_normal: 1 },
      32: { id: 32, level: 10, entity_unlocked: true, captured_normal: 1 },
    },
  };
  for (const [id, nameFr] of [[4, "Salameche"], [7, "Carapuce"], [25, "Pikachu"], [32, "Nidoran"]]) {
    state.pokemonDefsById.set(id, {
      id,
      nameFr,
      spritePath: `pokemon_data/${id}.png`,
      attackMode: "projectiles",
      offensiveType: "normal",
      defensiveTypes: ["normal"],
    });
  }
  state.ui.boxesOpen = true;
  state.ui.boxesMode = "trainer_battle";
  state.ui.boxesTargetSlotIndex = 0;
  state.ui.trainerBattleSetupOpen = true;
  state.trainerBattle.selectedTeamIds = [25, 4, 7];

  system.renderBoxesGrid();

  const nidoranButton = findChildByDatasetValue(bindings.boxesGridEl, "boxEntityId", 32);
  assert.ok(nidoranButton);

  await nidoranButton.trigger("click");

  assert.deepEqual(state.saveData.team, [25, 4, 7, 0, 0, 0]);
  assert.deepEqual(state.trainerBattle.selectedTeamIds, [32, 4, 7]);
  assert.equal(state.ui.boxesOpen, false);
  assert.equal(state.ui.trainerBattleSetupOpen, true);
});

test("runtime ui interaction system keeps trainer battle mobile confirmation temporary", async () => {
  const { bindings, state, system } = createUiInteractionSystem({
    bindings: {
      document: createTestDocument(),
      getBaseStatTotal: () => 273,
      getCapturedTotal: () => 1,
      getXpToNextLevelForSpecies: () => 100,
      computeStatsAtLevel: () => ({}),
      resolveSpriteAppearanceForEntity: (pokemonId) => ({
        spritePath: `pokemon_data/${pokemonId}.png`,
        variant: null,
        shinyVisual: false,
        shinyNegativeFallbackVisual: false,
        ultraShinyVisual: false,
      }),
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[String(pokemonId)] || null,
      isEntityUnlocked: (record) => Boolean(record?.entity_unlocked),
      showModalWithTween: () => {},
      hideModalWithTween: () => {},
      showPopupWithTween: () => {},
      setTopMessage: () => {},
    },
  });

  state.layout.viewportProfile = { phone: true };
  state.saveData = {
    team: [25, 4, 7, 0, 0, 0],
    pokemon_entities: {
      4: { id: 4, level: 12, entity_unlocked: true, captured_normal: 1 },
      7: { id: 7, level: 12, entity_unlocked: true, captured_normal: 1 },
      25: { id: 25, level: 18, entity_unlocked: true, captured_normal: 1 },
      32: { id: 32, level: 10, entity_unlocked: true, captured_normal: 1 },
    },
  };
  for (const [id, nameFr] of [[4, "Salameche"], [7, "Carapuce"], [25, "Pikachu"], [32, "Nidoran"]]) {
    state.pokemonDefsById.set(id, {
      id,
      nameFr,
      spritePath: `pokemon_data/${id}.png`,
      attackMode: "projectiles",
      offensiveType: "normal",
      defensiveTypes: ["normal"],
    });
  }
  state.ui.boxesOpen = true;
  state.ui.boxesMode = "trainer_battle";
  state.ui.boxesTargetSlotIndex = 0;
  state.ui.trainerBattleSetupOpen = true;
  state.trainerBattle.selectedTeamIds = [25, 4, 7];

  system.renderBoxesGrid();

  const nidoranButton = findChildByDatasetValue(bindings.boxesGridEl, "boxEntityId", 32);
  assert.ok(nidoranButton);

  await nidoranButton.trigger("click");

  assert.deepEqual(state.saveData.team, [25, 4, 7, 0, 0, 0]);
  assert.deepEqual(state.trainerBattle.selectedTeamIds, [25, 4, 7]);
  assert.equal(bindings.boxesMobileSelectionSummaryEl.classList.contains("hidden"), false);

  system.confirmBoxesSelection();

  assert.deepEqual(state.saveData.team, [25, 4, 7, 0, 0, 0]);
  assert.deepEqual(state.trainerBattle.selectedTeamIds, [32, 4, 7]);
  assert.equal(state.ui.boxesOpen, false);
  assert.equal(state.ui.trainerBattleSetupOpen, true);
});

test("runtime ui interaction system disables trainer battle confirm until the temporary team is valid", () => {
  const { bindings, state, system } = createUiInteractionSystem({
    bindings: {
      document: createTestDocument(),
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[String(pokemonId)] || null,
      isEntityUnlocked: (record) => Boolean(record?.entity_unlocked),
      getEvolutionFamilySpeciesIds: (pokemonId) => {
        if (pokemonId === 1 || pokemonId === 2) {
          return [1, 2, 3];
        }
        return [pokemonId];
      },
      getTrainerBattleSetupDefinition: () => ({
        trainer_battle_id: "kanto_pewter_gym_brock",
        trainer_name_fr: "Pierre",
        roster: [
          { pokemon_id: 74, level: 8 },
          { pokemon_id: 138, level: 9 },
          { pokemon_id: 95, level: 11 },
        ],
      }),
    },
  });

  state.saveData = {
    team: [1, 2, 7, 0, 0, 0],
    pokemon_entities: {
      1: { id: 1, level: 10, entity_unlocked: true },
      2: { id: 2, level: 11, entity_unlocked: true },
      4: { id: 4, level: 9, entity_unlocked: true },
      7: { id: 7, level: 8, entity_unlocked: true },
    },
  };
  for (const [id, nameFr] of [[1, "Bulbizarre"], [2, "Herbizarre"], [4, "Salameche"], [7, "Carapuce"], [74, "Racaillou"], [95, "Onix"], [138, "Amonita"]]) {
    state.pokemonDefsById.set(id, {
      id,
      nameFr,
      spritePath: `pokemon_data/${id}.png`,
      attackMode: "projectiles",
      offensiveType: "normal",
      defensiveTypes: ["normal"],
    });
  }
  state.trainerBattle.selectedTeamIds = [1, 2, 7];

  system.renderTrainerBattleSetupModal();

  assert.equal(bindings.trainerBattleSetupConfirmButtonEl.disabled, true);
  assert.match(bindings.trainerBattleSetupStatusEl.textContent, /Conflit de famille/);
  assert.match(bindings.trainerBattleSetupTitleEl.textContent, /Combat contre Pierre/);

  state.trainerBattle.selectedTeamIds = [1, 4, 7];
  system.renderTrainerBattleSetupModal();

  assert.equal(bindings.trainerBattleSetupConfirmButtonEl.disabled, false);
  assert.match(bindings.trainerBattleSetupStatusEl.textContent, /Equipe prete|Équipe prête/);
  assert.equal(bindings.trainerBattleSetupSlotsEl.children.length, 3);
});

test("runtime ui interaction system blocks collection and team editors during active trainer battles", () => {
  const topMessages = [];
  const { state, system } = createUiInteractionSystem({
    bindings: {
      isTrainerBattleActive: () => true,
      isAppearanceEditorUnlocked: () => true,
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[String(pokemonId)] || null,
      isEntityUnlocked: (record) => Boolean(record?.entity_unlocked),
      setTopMessage: (message) => {
        topMessages.push(String(message || ""));
      },
    },
  });

  state.saveData = {
    team: [25, 4, 7, 0, 0, 0],
    pokemon_entities: {
      25: { id: 25, level: 18, entity_unlocked: true },
    },
  };
  state.pokemonDefsById.set(25, {
    id: 25,
    nameFr: "Pikachu",
    spritePath: "pokemon_data/25.png",
    attackMode: "projectiles",
    offensiveType: "electric",
    defensiveTypes: ["electric"],
  });

  system.openPokedexModal();
  system.openBoxesForTeamSlot(0);
  const appearanceOpened = system.openAppearanceForPokemon(25);

  assert.equal(system.isCanvasBattleInteractionBlocked(), true);
  assert.equal(state.ui.pokedexOpen, false);
  assert.equal(state.ui.boxesOpen, false);
  assert.equal(state.ui.appearanceOpen, false);
  assert.equal(appearanceOpened, false);
  assert.equal(topMessages.length, 3);
  assert.match(topMessages[0], /combat de dresseur/);
});

test("runtime ui interaction system centers the ball capture menu and updates icon tabs", () => {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='team-menu' class='hidden'></div><div id='ball-menu' class='hidden'></div><button id='ball-tab-poke'></button><button id='ball-tab-super'></button><button id='ball-tab-hyper'></button></body></html>",
    { pretendToBeVisual: true },
  );
  const documentRef = dom.window.document;
  const teamContextMenuEl = documentRef.getElementById("team-menu");
  const ballCaptureMenuEl = documentRef.getElementById("ball-menu");
  const ballCaptureTabPokeButtonEl = documentRef.getElementById("ball-tab-poke");
  const ballCaptureTabSuperButtonEl = documentRef.getElementById("ball-tab-super");
  const ballCaptureTabHyperButtonEl = documentRef.getElementById("ball-tab-hyper");

  const { state, system } = createUiInteractionSystem({
    window: dom.window,
    bindings: {
      document: documentRef,
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      HTMLButtonElement: dom.window.HTMLButtonElement,
      HTMLImageElement: dom.window.HTMLImageElement,
      teamContextMenuEl,
      teamContextMenuTitleEl: documentRef.createElement("div"),
      teamContextMenuRenameButtonEl: documentRef.createElement("button"),
      teamContextMenuBoxesButtonEl: documentRef.createElement("button"),
      teamContextMenuAppearanceButtonEl: documentRef.createElement("button"),
      ballCaptureMenuEl,
      ballCaptureMenuTitleEl: documentRef.createElement("div"),
      ballCaptureMenuSummaryEl: documentRef.createElement("p"),
      ballCaptureMenuCloseButtonEl: documentRef.createElement("button"),
      ballCaptureMenuTabsEl: documentRef.createElement("div"),
      ballCaptureTabPokeButtonEl,
      ballCaptureTabSuperButtonEl,
      ballCaptureTabHyperButtonEl,
      ballCaptureToggleAllButtonEl: documentRef.createElement("button"),
      ballCaptureToggleUnownedButtonEl: documentRef.createElement("button"),
      ballCaptureToggleOwnedButtonEl: documentRef.createElement("button"),
      ballCaptureToggleShinyButtonEl: documentRef.createElement("button"),
      ballCaptureToggleUltraButtonEl: documentRef.createElement("button"),
      BALL_CONFIG_BY_TYPE: {
        poke_ball: {
          nameFr: "Pokeball",
          spritePath: "assets/items/poke_ball.png",
        },
        super_ball: {
          nameFr: "Super Ball",
          spritePath: "assets/items/super_ball.png",
        },
        hyper_ball: {
          nameFr: "Hyper Ball",
          spritePath: "assets/items/hyper_ball.png",
        },
      },
      BALL_TYPE_FALLBACK_ORDER: ["poke_ball", "super_ball", "hyper_ball"],
      getBallCaptureRulesForType: () => ({
        all: true,
        unowned: true,
        owned: true,
        shiny: true,
        ultra_shiny: true,
      }),
      getBallInventoryCount: (type) => {
        switch (type) {
          case "poke_ball":
            return 12;
          case "super_ball":
            return 5;
          case "hyper_ball":
            return 2;
          default:
            return 0;
        }
      },
      getActiveBallType: () => "super_ball",
      isAppearanceEditorUnlocked: () => true,
      getTeamBoxesAccessState: () => ({ allowed: true }),
      showPopupWithTween: (element) => {
        element.classList.remove("hidden");
      },
    },
  });

  state.layout.viewportProfile = { phone: true };
  state.team = [{ id: 25, nameFr: "Pikachu" }];
  state.saveData = { team: [25] };

  system.openTeamContextMenu(0, state.team[0], 120, 80);
  assert.equal(state.ui.teamContextMenuOpen, true);

  system.openBallCaptureMenu("poke_ball", 120, 80);
  assert.equal(ballCaptureMenuEl.classList.contains("is-centered-modal"), true);
  assert.equal(ballCaptureMenuEl.style.left, "50%");
  assert.equal(ballCaptureMenuEl.style.top, "50%");
  assert.equal(state.ui.ballCaptureMenuBallType, "poke_ball");
  assert.equal(ballCaptureTabPokeButtonEl.getAttribute("aria-selected"), "true");
  assert.equal(ballCaptureTabSuperButtonEl.getAttribute("aria-selected"), "false");

  system.setBallCaptureMenuBallType("super_ball");
  assert.equal(state.ui.ballCaptureMenuBallType, "super_ball");
  assert.equal(ballCaptureTabPokeButtonEl.getAttribute("aria-selected"), "false");
  assert.equal(ballCaptureTabSuperButtonEl.getAttribute("aria-selected"), "true");
  assert.match(ballCaptureTabSuperButtonEl.textContent, /5/);

  dom.window.close();
});

test("runtime ui interaction system renders compact boxes info cards", () => {
  const { system, bindings } = createUiInteractionSystem({
    bindings: {
      STAT_KEYS: ["hp", "attack", "speed"],
      STAT_LABELS_FR: {
        hp: "PV",
        attack: "ATT",
        speed: "VIT",
      },
      getBaseStatTotal: () => 273,
      resolveTalentDefinition: () => ({
        id: "NONE",
        nameFr: "Aucun",
        nameEn: "None",
        descriptionFr: "Aucun effet passif pour le moment.",
      }),
    },
  });

  system.setBoxesInfoFromEntry(null);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /Infos Pokemon/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /boite/);

  system.setBoxesInfoFromEntry({
    id: 32,
    nameFr: "Nidoran♂",
    baseNameFr: "Nidoran♂",
    hasCustomName: false,
    level: 1,
    xp: 0,
    xpToNext: 112,
    defensiveTypes: ["Poison"],
    offensiveType: "Poison",
    attackMode: "projectiles",
    talent: { id: "NONE" },
    baseStats: {
      hp: 56,
      attack: 66,
      speed: 55,
    },
    stats: {
      hp: 56,
      attack: 66,
      speed: 55,
    },
    encounteredTotal: 3,
    encounteredNormal: 3,
    encounteredShiny: 0,
    defeatedTotal: 3,
    defeatedNormal: 3,
    defeatedShiny: 0,
    capturedTotal: 1,
    capturedNormal: 1,
    capturedShiny: 0,
    capturedUltraShiny: 0,
  });

  assert.match(bindings.boxesInfoPanelEl.innerHTML, /pokemon-info-feature-grid/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /pokemon-info-micro-grid pokemon-info-micro-grid--summary/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /pokemon-info-micro-grid pokemon-info-micro-grid--stats/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /pokemon-info-type-chip/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /assets\/type-icons\/poison\.png/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /Attaque/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /Projectiles/);
  assert.match(bindings.boxesInfoPanelEl.innerHTML, /Aucun effet passif pour le moment\./);
});

test("runtime ui interaction system renders accented pokemon type chips with icons", () => {
  const { system, bindings } = createUiInteractionSystem({
    bindings: {
      STAT_KEYS: [],
      STAT_LABELS_FR: {},
      getBaseStatTotal: () => 212,
      formatTypeLabelFr: (typeName) => {
        switch (String(typeName || "").toLowerCase()) {
          case "fairy":
            return "F\u00e9e";
          case "poison":
            return "Poison";
          default:
            return String(typeName || "");
        }
      },
      resolveTalentDefinition: () => ({
        id: "NONE",
        nameFr: "Aucun",
        nameEn: "None",
        descriptionFr: "Aucun effet passif pour le moment.",
      }),
    },
  });

  system.setPokedexInfoFromEntry({
    id: 35,
    nameFr: "M\u00e9lof\u00e9e",
    discoveryState: "captured",
    offensiveType: "fairy",
    defensiveTypes: ["fairy"],
    attackMode: "laser",
    encounteredTotal: 4,
    encounteredNormal: 4,
    encounteredShiny: 0,
    encounteredUltraShiny: 0,
    capturedTotal: 2,
    capturedNormal: 2,
    capturedShiny: 0,
    capturedUltraShiny: 0,
    shinyModeUnlocked: true,
    ultraShinyModeUnlocked: false,
    encounterZoneLabels: ["Mont S\u00e9l\u00e9nite"],
  });

  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /pokemon-info-hero-visual/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /pokemon-info-hero-types/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /assets\/type-icons\/fairy\.png/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /F\u00e9e/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /Attaque/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /Laser/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /Mont S\u00e9l\u00e9nite/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /pokemon-info-breakdown-grid/);
});

test("runtime ui interaction system reloads missing pokedex definitions to restore accented type chips", async () => {
  let receivedLoadArgs = null;
  const { system, bindings, state } = createUiInteractionSystem({
    bindings: {
      formatTypeLabelFr: (typeName) => {
        switch (String(typeName || "").toLowerCase()) {
          case "fairy":
            return "F\u00e9e";
          default:
            return String(typeName || "");
        }
      },
      loadPokemonDefinitions: async (routeDataInput, runtimeOptions = {}) => {
        receivedLoadArgs = {
          routeDataInput,
          runtimeOptions,
        };
        state.pokemonDefsById.set(35, {
          id: 35,
          nameFr: "M\u00e9lof\u00e9e",
          nameEn: "clefairy",
          defensiveTypes: ["fairy"],
          offensiveType: "fairy",
          attackMode: "laser",
          spritePath: "pokemon_data/35_clefairy/sprites/35_clefairy_firered_leafgreen_front.png",
        });
      },
    },
  });

  state.saveData = {
    pokemon_entities: {
      35: {
        id: 35,
        species_name_en: "clefairy",
        name_fr: "M\u00e9lof\u00e9e",
        encountered_normal: 2,
        encountered_shiny: 0,
        encountered_ultra_shiny: 0,
        captured_normal: 1,
        captured_shiny: 0,
        captured_ultra_shiny: 0,
      },
    },
  };
  state.ui.pokedexOpen = true;
  state.ui.pokedexHoverPokemonId = 35;
  state.pokedexSpeciesCsvByPokemonId.set(35, {
    id: 35,
    nameFr: "M\u00e9lof\u00e9e",
    nameEn: "clefairy",
  });

  const initialEntry = system.getPokedexEntryByPokemonId(35);
  assert.deepEqual(initialEntry.defensiveTypes, ["normal"]);
  assert.equal(initialEntry.offensiveType, "normal");
  assert.equal(initialEntry.attackMode, "");

  system.setPokedexInfoFromEntry(initialEntry);
  await system.ensurePokedexEntryDefinitionLoaded(initialEntry);

  assert.equal(receivedLoadArgs?.runtimeOptions?.append, true);
  assert.equal(receivedLoadArgs?.routeDataInput?.[0]?.encounters?.[0]?.id, 35);
  assert.equal(receivedLoadArgs?.routeDataInput?.[0]?.encounters?.[0]?.name_en, "clefairy");

  const refreshedEntry = system.getPokedexEntryByPokemonId(35);
  assert.deepEqual(refreshedEntry.defensiveTypes, ["fairy"]);
  assert.equal(refreshedEntry.offensiveType, "fairy");
  assert.equal(refreshedEntry.attackMode, "laser");
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /assets\/type-icons\/fairy\.png/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /F\u00e9e/);
  assert.match(bindings.pokedexInfoPanelEl.innerHTML, /Laser/);
});

test("runtime ui interaction system exposes current opaque bounds in sprite debug output", () => {
  const windowObject = {};
  const { state } = createUiInteractionSystem({
    window: windowObject,
    bindings: {
      resolveEntitySpriteDrawSource: () => ({
        source: { path: "bw.gif#frame0" },
        frameIndex: 3,
        opaqueMinX: 7,
        opaqueMinY: 5,
        opaqueWidth: 31,
        opaqueHeight: 29,
        maxOpaqueWidth: 40,
        maxOpaqueHeight: 36,
      }),
    },
  });
  state.team = [
    {
      id: 100,
      spriteImage: { src: "bw.gif" },
      spritePath: "bw.gif",
      spriteAnimated: true,
      spriteVariantId: "black_white",
    },
  ];

  const payload = windowObject.__pokeidle_debug_getSpriteFrameIndex("team", 0);

  assert.deepEqual(
    {
      frame_index: payload.frame_index,
      opaque_min_x: payload.opaque_min_x,
      opaque_min_y: payload.opaque_min_y,
      opaque_width: payload.opaque_width,
      opaque_height: payload.opaque_height,
      max_opaque_width: payload.max_opaque_width,
      max_opaque_height: payload.max_opaque_height,
    },
    {
      frame_index: 3,
      opaque_min_x: 7,
      opaque_min_y: 5,
      opaque_width: 31,
      opaque_height: 29,
      max_opaque_width: 40,
      max_opaque_height: 36,
    },
  );
});

test("runtime ui interaction system waits for the selected skin assets before rebuild and render", async () => {
  const appearanceGridEl = createTestElement("div");
  const callOrder = [];
  const variants = [
    { id: "firered_leafgreen", labelFr: "Rouge Feu", frontPath: "rf.png" },
    { id: "black_white", labelFr: "Noir Blanc", frontPath: "bw.gif" },
  ];
  const record = {
    appearance_selected_variant: "firered_leafgreen",
    appearance_shiny_mode: false,
    appearance_ultra_shiny_mode: false,
  };
  let loadedVariantId = "firered_leafgreen";
  const { system, state } = createUiInteractionSystem({
    bindings: {
      appearanceGridEl,
      document: createTestDocument(),
      getPokemonEntityRecord: () => record,
      getSpriteVariantsForDef: () => variants,
      getOwnedSpriteVariantsForRecord: () => variants,
      getSelectedOwnedSpriteVariantForRecord: () =>
        variants.find((variant) => variant.id === record.appearance_selected_variant) || null,
      getSpriteVariantDisplayLabel: (variant) => variant?.labelFr || "",
      ensureVariantAppearanceAssetsLoaded: async (_def, variant) => {
        loadedVariantId = variant.id;
        callOrder.push(`load:${variant.id}`);
      },
      rebuildTeamAndSyncBattle: () => {
        callOrder.push(`rebuild:${loadedVariantId}`);
      },
      persistSaveData: () => {
        callOrder.push(`persist:${loadedVariantId}`);
      },
      render: () => {
        callOrder.push(`render:${loadedVariantId}`);
      },
      setTopMessage: () => {
        callOrder.push(`message:${loadedVariantId}`);
      },
    },
  });

  state.saveData = { team: [25] };
  state.ui.appearancePokemonId = 25;
  state.pokemonDefsById.set(25, {
    id: 25,
    nameFr: "Pikachu",
    spritePath: "rf.png",
  });

  system.renderAppearanceModal();

  assert.equal(appearanceGridEl.children.length, 2);

  await appearanceGridEl.children[1].trigger("click");

  assert.equal(record.appearance_selected_variant, "black_white");
  assert.deepEqual(callOrder, [
    "load:black_white",
    "rebuild:black_white",
    "persist:black_white",
    "render:black_white",
    "message:black_white",
  ]);
});

test("runtime ui interaction system shows inherited shiny messaging in the appearance modal", () => {
  const variants = [
    { id: "firered_leafgreen", labelFr: "Rouge Feu", frontPath: "rf.png" },
  ];
  const record = {
    appearance_selected_variant: "firered_leafgreen",
    appearance_shiny_mode: false,
    appearance_ultra_shiny_mode: false,
  };
  const { bindings, system, state } = createUiInteractionSystem({
    bindings: {
      document: createTestDocument(),
      appearanceGridEl: createTestElement("div"),
      getPokemonEntityRecord: () => record,
      getSpriteVariantsForDef: () => variants,
      getOwnedSpriteVariantsForRecord: () => variants,
      getSelectedOwnedSpriteVariantForRecord: () => variants[0],
      getSpriteVariantDisplayLabel: (variant) => variant?.labelFr || "",
      getAppearanceUnlockState: () => ({
        shinyUnlocked: true,
        ultraUnlocked: false,
        shinySource: "legacy",
        ultraSource: "none",
        familyShinyCaptures: 0,
        familyUltraShinyCaptures: 0,
      }),
    },
  });

  state.saveData = { team: [25] };
  state.ui.appearancePokemonId = 25;
  state.pokemonDefsById.set(25, {
    id: 25,
    nameFr: "Pikachu",
    spritePath: "pokemon_data/25.png",
  });

  system.renderAppearanceModal();

  assert.match(bindings.appearanceShinyStatusEl.textContent, /ancienne sauvegarde/i);
  assert.equal(bindings.appearanceShinyToggleButtonEl.disabled, false);
});

test("runtime ui interaction system levels up all owned pokemon from the dev button", () => {
  const queuedLevelUps = [];
  const queuedEvolutions = [];
  const topMessages = [];
  let rebuildCalls = 0;
  let persistCalls = 0;
  let updateHudCalls = 0;
  let renderCalls = 0;
  let appearanceUnlockCalls = 0;

  const state = {
    mode: "ready",
    viewport: {
      width: 1280,
      height: 720,
      renderScale: 1,
    },
    performance: {
      quality: "medium",
      shortFrameMsEma: 16.67,
      renderFrameMsEma: 16.67,
      cpuFrameMsEma: 4.72,
    },
    battle: createBattleStub(),
    enemy: null,
    team: [],
    routeData: null,
    routeCatalog: new Map(),
    routeBackgroundsById: new Map(),
    saveData: {
      team: [1, 2],
      pokemon_entities: {
        1: { id: 1, level: 12, xp: 17, entity_unlocked: true },
        2: { id: 2, level: 99, xp: 9, entity_unlocked: true },
        3: { id: 3, level: 6, xp: 2, entity_unlocked: false },
      },
    },
    ui: {
      hoveredTeamSlotIndex: -1,
      teamDragActive: false,
      teamDragMoved: false,
      teamDragSourceSlotIndex: -1,
      teamDragTargetSlotIndex: -1,
      shopOpen: false,
      mapOpen: false,
      gachaOpen: false,
      boxesOpen: false,
      boxesTargetSlotIndex: -1,
      boxesSearchQuery: "",
      pokedexOpen: false,
      pokedexHoverPokemonId: 0,
      pokedexSearchQuery: "",
      appearanceOpen: false,
      appearanceTargetSlotIndex: -1,
      appearancePokemonId: 0,
      teamContextMenuOpen: false,
      teamContextMenuSlotIndex: -1,
      ballCaptureMenuOpen: false,
      ballCaptureMenuBallType: "",
      tutorialOpen: false,
    },
    gacha: {
      spinning: false,
      lastReward: null,
      lastRewards: [],
    },
    notifications: {
      items: [],
    },
    moneyHud: {
      displayValue: 0,
    },
    teamLevelUpEffects: [],
    teamXpGainEffects: [],
    backgroundDrift: {
      currentX: 0,
      currentY: 0,
    },
    tutorial: {
      active: null,
    },
    evolutionAnimation: {
      current: null,
      queue: [],
    },
    pokemonDefsById: new Map([
      [1, { id: 1, nameFr: "Bulbizarre" }],
      [2, { id: 2, nameFr: "Herbizarre" }],
      [3, { id: 3, nameFr: "Florizarre" }],
    ]),
    pokedexSpeciesCsvByPokemonId: new Map(),
  };

  const { system } = createUiInteractionSystem({
    state,
    bindings: {
      APPEARANCE_UNLOCK_LEVEL: 13,
      getPokemonEntityRecord: (pokemonId) => state.saveData?.pokemon_entities?.[String(pokemonId)] || null,
      isEntityUnlocked: (record) => Boolean(record?.entity_unlocked),
      getPokemonDisplayNameById: (pokemonId) => {
        switch (Number(pokemonId || 0)) {
          case 1:
            return "Bulbizarre";
          case 2:
            return "Herbizarre";
          default:
            return `Pokemon ${pokemonId}`;
        }
      },
      queueTeamLevelUpEffects: (entries) => {
        queuedLevelUps.push(...entries);
      },
      setEntityLevel: (record, level) => {
        record.level = level;
        if (level >= 100) {
          record.xp = 0;
        }
      },
      findNextEligibleEvolution: (record) => {
        if (record?.id === 1 && record.level >= 13) {
          return {
            fromId: 1,
            toId: 2,
            fromDef: { nameFr: "Bulbizarre" },
            toDef: { nameFr: "Herbizarre" },
          };
        }
        return null;
      },
      enqueueEvolutionReadyNotification: (payload) => {
        queuedEvolutions.push(payload);
        return "notif-1";
      },
      ensureAppearanceEditorUnlockedFromProgress: () => {
        appearanceUnlockCalls += 1;
        return true;
      },
      rebuildTeamAndSyncBattle: () => {
        rebuildCalls += 1;
      },
      persistSaveData: () => {
        persistCalls += 1;
      },
      updateHud: () => {
        updateHudCalls += 1;
      },
      render: () => {
        renderCalls += 1;
      },
      setTopMessage: (message) => {
        topMessages.push(message);
      },
    },
  });

  const result = system.levelUpAllOwnedPokemonFromDev();

  assert.deepEqual(result.teamLevelUps.map((entry) => entry.slotIndex), [0, 1]);
  assert.equal(result.leveledCount, 2);
  assert.equal(result.queuedEvolutionCount, 1);
  assert.equal(state.saveData.pokemon_entities["1"].level, 13);
  assert.equal(state.saveData.pokemon_entities["1"].xp, 17);
  assert.equal(state.saveData.pokemon_entities["2"].level, 100);
  assert.equal(state.saveData.pokemon_entities["2"].xp, 0);
  assert.equal(state.saveData.pokemon_entities["3"].level, 6);
  assert.equal(queuedLevelUps.length, 2);
  assert.equal(queuedEvolutions.length, 1);
  assert.equal(appearanceUnlockCalls, 1);
  assert.equal(rebuildCalls, 1);
  assert.equal(persistCalls, 1);
  assert.equal(updateHudCalls, 1);
  assert.equal(renderCalls, 1);
  assert.match(topMessages.at(-1), /\+1 niveau pour 2 Pokemon/);
});

test("runtime ui interaction system preserves touch hold context menu through a small drift on mobile", async () => {
  const windowObject = {
    setTimeout,
    clearTimeout,
  };
  const teamContextMenuEl = Object.assign(createTestElement("div"), {
    getBoundingClientRect() {
      return { width: 140, height: 80 };
    },
  });
  const { system, state } = createUiInteractionSystem({
    window: windowObject,
    state: {
      mode: "ready",
      viewport: {
        width: 390,
        height: 664,
        renderScale: 1,
      },
      performance: {
        quality: "medium",
        shortFrameMsEma: 16.67,
        renderFrameMsEma: 16.67,
        cpuFrameMsEma: 4.72,
      },
      battle: createBattleStub(),
      enemy: {
        id: 16,
        nameFr: "Roucool",
        defensiveTypes: ["normal", "flying"],
      },
      team: [
        {
          id: 1,
          nameFr: "Bulbizarre",
        },
      ],
      routeData: { route_id: "kanto_route_1", combat_enabled: true },
      routeCatalog: new Map(),
      routeBackgroundsById: new Map(),
      saveData: null,
      ui: {
        hoveredTeamSlotIndex: -1,
        hoveredBallOverlayType: "",
        teamDragActive: false,
        teamDragMoved: false,
        teamDragSourceSlotIndex: -1,
        teamDragTargetSlotIndex: -1,
        teamDragStartClientX: 0,
        teamDragStartClientY: 0,
        teamDragCurrentWorldX: 0,
        teamDragCurrentWorldY: 0,
        teamDragPointerId: -1,
        teamDragPointerType: "",
        teamDragSuppressClickUntilMs: 0,
        teamContextMenuOpen: false,
        teamContextMenuSlotIndex: -1,
        teamContextMenuPokemonId: 0,
        teamContextTouchHoldPointerId: -1,
        teamContextTouchHoldSlotIndex: -1,
        teamContextTouchHoldClientX: 0,
        teamContextTouchHoldClientY: 0,
        teamContextTouchHoldStartClientX: 0,
        teamContextTouchHoldStartClientY: 0,
        teamContextTouchHoldTimerId: 0,
        ballCaptureMenuOpen: false,
        ballCaptureMenuBallType: "",
        shopOpen: false,
        mapOpen: false,
        gachaOpen: false,
        boxesOpen: false,
        boxesTargetSlotIndex: -1,
        boxesSearchQuery: "",
        pokedexOpen: false,
        pokedexHoverPokemonId: 0,
        pokedexSearchQuery: "",
        appearanceOpen: false,
        appearanceTargetSlotIndex: -1,
        appearancePokemonId: 0,
        tutorialOpen: false,
      },
      gacha: {
        spinning: false,
        lastReward: null,
        lastRewards: [],
      },
      notifications: {
        items: [],
      },
      moneyHud: {
        displayValue: 0,
      },
      teamLevelUpEffects: [],
      teamXpGainEffects: [],
      backgroundDrift: {
        currentX: 0,
        currentY: 0,
      },
      tutorial: {
        active: null,
      },
      evolutionAnimation: {
        current: null,
        queue: [],
      },
      pokemonDefsById: new Map(),
      pokedexSpeciesCsvByPokemonId: new Map(),
    },
    layout: {
      centerX: 195,
      centerY: 332,
      teamSlots: [
        {
          x: 71,
          y: 226,
          size: 64,
        },
      ],
    },
    bindings: {
      getRuntimeClientType: () => "browser_smartphone",
      getTeamSpriteScale: () => 1,
      teamContextMenuEl,
      teamContextMenuTitleEl: createTestElement("div"),
      teamContextMenuRenameButtonEl: createTestElement("button"),
      teamContextMenuBoxesButtonEl: createTestElement("button"),
      teamContextMenuAppearanceButtonEl: createTestElement("button"),
      navigator: {
        vibrate() {},
      },
      render: () => {},
      showPopupWithTween: () => {},
    },
  });

  const dragStarted = system.beginTeamDragForSlot(0, {
    clientX: 71,
    clientY: 226,
    worldX: 71,
    worldY: 226,
    pointerId: 1,
    pointerType: "touch",
  });

  assert.equal(dragStarted, true);
  assert.equal(state.ui.teamDragActive, true);

  system.scheduleTeamContextTouchHold(0, state.team[0], {
    pointerId: 1,
    pointerType: "touch",
    clientX: 71,
    clientY: 226,
  });

  assert.equal(state.ui.teamContextTouchHoldPointerId, 1);

  system.handleCanvasPointerMove({
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: 83,
    clientY: 226,
    cancelable: true,
    preventDefault() {},
    stopPropagation() {},
  });

  assert.equal(state.ui.teamContextTouchHoldPointerId, 1);
  assert.equal(state.ui.teamDragMoved, false);

  await new Promise((resolve) => setTimeout(resolve, 520));

  assert.equal(state.ui.teamContextMenuOpen, true);
  assert.equal(state.ui.teamDragActive, false);
  assert.equal(state.ui.teamDragMoved, false);
  assert.equal(state.ui.teamContextMenuSlotIndex, 0);
});
