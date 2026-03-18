import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRuntimeUiInteractionSystem } from "../systems/ui/runtime-ui-interaction-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeUiInteractionSystemPath = path.resolve(
  __dirname,
  "../systems/ui/runtime-ui-interaction-system.js",
);

function createClassList(hidden = false) {
  return {
    add() {},
    remove() {},
    contains(className) {
      return className === "hidden" ? hidden : false;
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
    ballCaptureMenuEl: { classList: createClassList(true) },
    ballCaptureMenuTitleEl: { textContent: "" },
    boxesGridEl: { innerHTML: "" },
    boxesInfoPanelEl: { innerHTML: "" },
    boxesModalEl: { classList: createClassList(true) },
    boxesShinyCounterEl: { textContent: "" },
    boxesSubtitleEl: { textContent: "" },
    canvas: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: state.viewport.width, height: state.viewport.height }),
      style: {},
    },
    clamp: (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)),
    cloneConfigMap: (value) => value,
    closeEvolutionItemChoiceModal: () => {},
    closeGachaModal: () => {},
    compareShopItems: () => 0,
    computeLayout: () => layout,
    computeStatsAtLevel: () => ({}),
    createRuntimeConfigLoaders: () => ({}),
    document: {
      createElement: () => ({
        appendChild() {},
        classList: createClassList(false),
        style: {},
        dataset: {},
        setAttribute() {},
        addEventListener() {},
        removeEventListener() {},
        focus() {},
        select() {},
        innerHTML: "",
        textContent: "",
      }),
      createDocumentFragment: () => ({ appendChild() {} }),
    },
    ensureVariantAppearanceAssetsLoaded: async () => {},
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
    hoverPopupEl: { classList: createClassList(true), innerHTML: "" },
    isAppearanceEditorUnlocked: () => false,
    isCurrentRouteCombatEnabled: () => true,
    isEntityUnlocked: () => false,
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
    pokedexGridEl: { innerHTML: "" },
    pokedexInfoPanelEl: { innerHTML: "" },
    pokedexModalEl: { classList: createClassList(true) },
    pokedexRenderRafHandle: 0,
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
    setBallCaptureRulesForType: () => {},
    setMapOpen: () => {},
    setShopOpen: () => {},
    setTopMessage: () => {},
    shouldFlipTeamSprite: () => false,
    shouldForceUltraShinyAllPokemon: () => false,
    showModalWithTween: () => {},
    showPopupWithTween: () => {},
    showTooltipWithTween: () => {},
    starterModalEl: { classList: createClassList(true) },
    state,
    teamContextMenuAppearanceButtonEl: { disabled: false },
    teamContextMenuBoxesButtonEl: { disabled: false },
    teamContextMenuEl: { classList: createClassList(true) },
    teamContextMenuRenameButtonEl: { disabled: false },
    teamContextMenuTitleEl: { textContent: "" },
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    tryOpenPendingTutorialFlow: () => {},
    update: () => {},
    updateEvolutionAnimation: () => {},
    updateHud: () => {},
    validateRouteDataPayload: (value) => value,
    window: windowObject,
    ...overrides.bindings,
  };

  const system = createRuntimeUiInteractionSystem({ bindings });
  return { bindings, system, state, window: windowObject };
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
      type: "electric",
      source_x: 128,
      source_y: 65,
      target_x: 513,
      target_y: 256,
      attacker_name_fr: "Pikachu",
    },
  ]);
});

test("runtime ui interaction system materializes the module without chunk injection", () => {
  const source = fs.readFileSync(runtimeUiInteractionSystemPath, "utf8");

  assert.match(source, /export const RUNTIME_UI_INTERACTION_BINDING_KEYS/);
  assert.match(source, /function exportTextState\(/);
  assert.match(source, /active_lasers: \(battle \? battle\.getLasers\(\) : \[\]\)\.map/);
  assert.doesNotMatch(source, /new Function/);
  assert.doesNotMatch(source, /with \(scope\)/);
  assert.doesNotMatch(source, /RUNTIME_UI_INTERACTION_CHUNK/);
  assert.doesNotMatch(source, /injectRuntimeUiLaserTextState/);
});

test("runtime ui interaction system falls back to browser globals for builtins omitted from bindings", () => {
  const { system, window } = createUiInteractionSystem();

  assert.equal(window.render_game_to_text, system.exportTextState);

  const payload = JSON.parse(window.render_game_to_text());

  assert.equal(payload.mode, "ready");
  assert.equal(payload.render_quality, "medium");
});
