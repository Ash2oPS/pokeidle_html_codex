import {
  POKEIDLE_APP_VERSION,
  getDisplayedAppVersion,
  isProductionGithubPagesLocation,
  isVersionAtLeast,
} from "./version.js";
import { Easing, Group, Tween } from "./vendor/tween.js";
import { createAudioManager } from "./lib/audio-manager.js";
import {
  assertValidBallConfig,
  assertValidEncounter,
  assertValidShopItemConfig,
  parseCsvMethods,
  parseCsvObjects,
  parseSerializedSave,
  readCsvBooleanCell,
  readCsvCell,
  readCsvNumberCell,
  readCsvTypedValue,
  validateDialoguePayload,
  validatePokemonPayload,
  validateRouteDataPayload,
  validateTrainerBattlePayload,
} from "./lib/runtime-data.js";
import {
  repairNormalizedSaveData,
  hasMeaningfulSaveProgress,
  getOwnedEntityIdsFromSave,
} from "./lib/save-consistency.js";
import { normalizeUiDisplayText } from "./lib/text-normalization.js";
import {
  pickPreferredSaveCandidate,
  SAVE_SOURCE_DESKTOP,
  SAVE_SOURCE_INDEXED_DB,
  SAVE_SOURCE_LOCAL_STORAGE,
  SAVE_SOURCE_SESSION_STORAGE,
} from "./lib/browser-save-utils.js";
import {
  getPassiveBehaviorIdForTalentId,
  resolveCombatTurnDecision,
  TURN_ACTION_ATTACK,
  TURN_ACTION_SKIP,
} from "./lib/combat-passives.js";
import {
  TALENT_NONE_DESCRIPTION_FR,
  TALENT_NONE_ID,
  TALENT_NONE_NAME_FR,
  normalizeTalentDefinition,
  normalizeTalentId,
} from "./lib/talents.js";
import { createInitialGameState } from "./lib/game-runtime-state.js";
import { createDevLayoutControls } from "./lib/dev-layout-controls.js";
import {
  createRuntimePlatformUtils,
  DEFAULT_DESKTOP_WINDOW_STATE,
  RUNTIME_ACTIVITY_BACKGROUND_LIVE,
  RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
  RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
  RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED,
  shouldForceLifecyclePersistAfterTransition,
} from "./lib/runtime-platform-utils.js";
import { createUiTextNormalizationRuntime } from "./lib/ui-text-normalization-runtime.js";
import { createUiAnimationRuntime } from "./lib/ui-animation-runtime.js";
import { createRenderQualityUtils } from "./lib/render-quality-utils.js";
import { createGameMathUtils } from "./lib/game-math-runtime.js";
import { createWalletUiRuntime } from "./lib/wallet-ui-runtime.js";
import { createEnvironmentRuntime } from "./lib/environment-runtime.js";
import { getGameDesignConfigSnapshot } from "./lib/game-design-config-runtime.js";
import { createPokemonCoreUtils } from "./lib/pokemon-core-utils.js";
import { createRuntimeConfigLoaders } from "./lib/runtime-config-loaders.js";
import { createRouteNavigationRuntime } from "./lib/route-navigation-runtime.js";
import { createZoneDialogueRuntime } from "./lib/zone-dialogue-runtime.js";
import { createRuntimeLoopKernel } from "./core/runtime-loop-kernel.js";
import { createRuntimeOrchestrator } from "./core/runtime-orchestrator.js";
import { createRuntimeCompositionRoot } from "./core/runtime-composition-root.js";
import { createRuntimeBootstrapSystem } from "./core/runtime-bootstrap-system.js";
import { createBrowserSaveStorage } from "./infra/storage/browser-save-storage.js";
import { createDesktopBridgeSaveStorage } from "./infra/storage/desktop-bridge-save-storage.js";
import { createIndexedDbSaveStorage } from "./infra/storage/indexeddb-save-storage.js";
import { createRuntimeSaveSystem } from "./systems/save/runtime-save-system.js";
import {
  COMPACT_SAVE_FORMAT_ID,
  COMPACT_SAVE_BALL_ORDER,
  COMPACT_SAVE_ITEM_ORDER,
  decodeCompactSave as decodeCompactSavePayload,
  encodeCompactSave as encodeCompactSavePayload,
  extractLegacyAppearanceSpecies as extractLegacyAppearanceSpeciesFromPayload,
  isCompactSavePayload,
  sanitizePositiveIntArray,
} from "./lib/compact-save-codec.js";
import {
  createRuntimeRenderSystem,
  RUNTIME_RENDER_BINDING_KEYS,
} from "./systems/ui/runtime-render-system.js";
import {
  createRuntimeUiInteractionSystem,
  RUNTIME_UI_INTERACTION_BINDING_KEYS,
} from "./systems/ui/runtime-ui-interaction-system.js";
import { createRuntimeInputSystem } from "./systems/ui/runtime-input-system.js";
import { mountRuntimeUi, assertRuntimeUiDomInvariants } from "./systems/ui/runtime-ui-dom-factory.js";
import { createMapNavigationUi } from "./systems/ui/map-navigation-ui.js";
import { createRouteNavigationUi } from "./systems/ui/route-navigation-ui.js";
import { createZoneDialogueUi } from "./systems/ui/zone-dialogue-ui.js";
import { createPokemonBattleRuntime } from "./systems/combat/pokemon-battle-manager.js";
import {
  STARTER_CHOICES,
  DEFAULT_ROUTE_ID,
  UNKNOWN_CAVE_ROUTE_ID,
  ROUTE_DATA_DIR,
  TRAINER_BATTLE_DATA_DIR,
  ROUTE_ENCOUNTERS_CSV_PATH,
  BALL_CONFIG_CSV_PATH,
  SHOP_ITEMS_CSV_PATH,
  POKEMON_TALENTS_CSV_PATH,
  ROUTE_ID_ORDER,
  INSERTED_ROUTE_UNLOCK_BACKFILL,
  ENCOUNTER_METHOD_UNLOCK_ROUTE_BY_ID,
  ENCOUNTER_METHOD_ALWAYS_UNLOCKED,
  ENCOUNTER_METHOD_ONLY_ONE,
  ENCOUNTER_METHOD_DISABLED,
  ENCOUNTER_METHOD_ONLY_ONE_ALLOW_SET,
  MAP_REGION_DEFAULT_ID,
  MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID,
  MAP_REGION_COPY_BY_REGION_ID,
  MAP_REFERENCE_IMAGE_PATH,
  MAP_MARKER_OVERRIDES_BY_ROUTE_ID,
  ROUTE_UNLOCK_DEFEATS,
  ROUTE_DEFEAT_TIMER_MS,
  TEAM_DRAG_START_DISTANCE_PX,
  TEAM_DRAG_CLICK_SUPPRESS_MS,
  TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS,
  TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX,
  ONLY_ONE_ENCOUNTER_INTERVAL,
  ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN,
  ONLY_ONE_ENCOUNTER_HP_MULTIPLIER,
  ONLY_ONE_ENCOUNTER_TIMER_MS,
  ENEMY_TIMER_STYLE_ROUTE,
  ENEMY_TIMER_STYLE_ONLY_ONE,
  TRAINER_BATTLE_TEAM_SIZE_COUNT,
  TRAINER_BATTLE_ENEMY_HP_MULTIPLIER,
  TRAINER_BATTLE_ENEMY_TIMER_MS,
  ROUTE_1_TUTORIAL_ID,
} from "./lib/game-world-config.js";
import {
  SAVE_KEY,
  SAVE_INDEXED_DB_NAME,
  SAVE_INDEXED_DB_STORE_NAME,
  SAVE_INDEXED_DB_RECORD_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_SAVE_SESSION_KEY,
  LEGACY_SAVE_INDEXED_DB_NAME,
  ANCIENT_LEGACY_SAVE_KEY,
  ANCIENT_LEGACY_SAVE_SESSION_KEY,
  ANCIENT_LEGACY_SAVE_INDEXED_DB_NAME,
  DEV_SEED_SAVE_QUERY_PARAM,
  WINDOWS_NOTIFICATION_PREF_KEY,
  SAVE_BACKEND_LABEL_BROWSER,
  SAVE_BACKEND_LABEL_DESKTOP,
  SAVE_BACKEND_LABEL_UNAVAILABLE,
  RUNTIME_CLIENT_BROWSER_PC,
  RUNTIME_CLIENT_BROWSER_SMARTPHONE,
  RUNTIME_CLIENT_DESKTOP_EXE_PC,
} from "./lib/save-runtime-config.js";
import {
  SHINY_ODDS,
  ULTRA_SHINY_ODDS,
  NON_ULTRA_SHINY_ODDS_NUMERATOR,
  NON_ULTRA_SHINY_ODDS_DENOMINATOR,
  SAVE_VERSION,
  MIN_SUPPORTED_SAVE_VERSION,
  MIN_SUPPORTED_SAVE_APP_VERSION,
} from "./lib/runtime-version-config.js";
import {
  buildRouteUnlockProgressState,
  createRouteDefeatCounts as createRouteDefeatCountsFromGraph,
  getBlockedConnectedRouteStates as getBlockedConnectedRouteStatesFromGraph,
  getConnectedRouteIds as getConnectedRouteIdsFromGraph,
  getRouteAccessState as getRouteAccessStateFromGraph,
  getUnlockableConnectedRouteIds as getUnlockableConnectedRouteIdsFromGraph,
  normalizeFlagIdList,
  normalizeRouteDefeatCounts as normalizeRouteDefeatCountsFromGraph,
  normalizeUnlockedRouteIds as normalizeUnlockedRouteIdsFromGraph,
  tryUnlockConnectedRoutes as tryUnlockConnectedRoutesFromGraph,
} from "./lib/zone-graph-runtime.js";
import {
  SPRITE_VARIANT_BASE_PRICE,
  SPRITE_VARIANT_GEN_PRICE_STEP,
  SPRITE_VARIANT_INDEX_PRICE_STEP,
  DEPRECATED_POKEMON_SPRITE_VARIANT_IDS,
  DEFAULT_POKEMON_SPRITE_VARIANT_PREFERENCE,
  POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3,
  POKEDEX_VARIANT_PREFERENCE_GEN_4,
  POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS,
  POKEDEX_BASE_MAX_POKEMON_ID,
  POKEDEX_EXTENDED_MAX_POKEMON_ID,
  POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX,
  POKEDEX_VIRTUAL_CARD_HEIGHT_PX,
  POKEDEX_VIRTUAL_GAP_PX,
  POKEDEX_VIRTUAL_OVERSCAN_ROWS,
  POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS,
  TYPE_ICON_ASSET_DIR,
  TYPE_ICON_TYPES,
  TYPE_LABELS_FR,
} from "./lib/pokedex-display-config.js";
import {
  TEAM_LEFT_SIDE_SLOT_INDEXES,
  MAX_TEAM_SIZE,
  TALENT_KEEN_EYE_ID,
  TALENT_VALIANT_EYE_ID,
  TALENT_MORPHING_ID,
  TALENT_MIND_CONTROL_ID,
  TALENT_ORIGIN_MIMICRY_ID,
  TALENT_OVERGROW_ID,
  TALENT_OVERGROW_PLUS_ID,
  TALENT_OVERGROW_PLUS_PLUS_ID,
  TALENT_BLAZE_ID,
  TALENT_BLAZE_PLUS_ID,
  TALENT_BLAZE_PLUS_PLUS_ID,
  TALENT_TORRENT_ID,
  TALENT_TORRENT_PLUS_ID,
  TALENT_TORRENT_PLUS_PLUS_ID,
  TALENT_ELECTRIC_FIELD_ID,
  TALENT_ARDENT_FIELD_ID,
  TALENT_ARCTIC_FIELD_ID,
  TALENT_JACKPOT_ID,
  TALENT_JACKPOT_PLUS_ID,
  TALENT_TELEPORT_ID,
  TALENT_TELEPORT_PLUS_ID,
  TALENT_TELEPORT_PLUS_PLUS_ID,
  TALENT_LEGENDARY_FIELD_ATTACK_BONUS,
  TALENT_LEGENDARY_FIELD_ATTACK_INTERVAL_MULTIPLIER,
  TALENT_AURA_PROVIDER_BY_ID,
  TALENT_LEGENDARY_FIELD_IDS,
  LEGENDARY_FIELD_VFX_THEME_BY_KEY,
  TALENT_ALWAYS_HIT_IDS,
  TALENT_CRIT_BONUS_CHANCE_BY_ID,
  TALENT_MONEY_MULTIPLIER_BY_ID,
  TALENT_TELEPORT_SWAP_CHANCE_BY_ID,
  TALENT_TELEPORT_PLUS_PLUS_DAMAGE_MULTIPLIER,
  MORPHING_REFERENCE_POKEMON_ID,
  MORPHING_COLORIZE_FALLBACK_RGB,
  MORPHING_DITTO_PALETTE_STOPS,
  MORPHING_SHADER_CONFIG,
  SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG,
  BASE_STEP_MS,
  ATTACK_INTERVAL_MS,
  ATTACK_CRIT_CHANCE,
  ATTACK_MISS_CHANCE,
  ATTACK_CRIT_MULTIPLIER,
  STARTER_LEVEL,
  PROJECTILE_SPEED_PX_PER_SECOND,
  PROJECTILE_TWEEN_DURATION_MIN_MS,
  PROJECTILE_TWEEN_DURATION_MAX_MS,
  PROJECTILE_TWEEN_ARC_BASE_PX,
  PROJECTILE_TWEEN_ARC_RANDOM_PX,
  LASER_TICK_INTERVAL_MULTIPLIER,
  LASER_TICK_JITTER_MS,
  LASER_DAMAGE_PER_TICK_DIVISOR,
  DAMAGE_SCALE,
  DAMAGE_LEVEL_PROGRESSION_EXPONENT,
  KO_RESPAWN_DELAY_MS,
  KO_ANIMATION_DURATION_MS,
  ENEMY_ENTER_ANIM_DURATION_MS,
  ENEMY_ENTER_ANIM_OFFSET_PX,
  ENEMY_ENTER_ANIM_ROTATION_DEG,
  ENEMY_ENTER_ANIM_FADE_RATIO,
  ENEMY_ENTER_ANIM_ROTATE_RATIO,
  ATTACK_FLASH_DURATION_MS,
  ATTACK_FLASH_WHITE_BLEND,
  SKIP_TURN_EFFECT_DURATION_MIN_MS,
  SKIP_TURN_EFFECT_DURATION_MAX_MS,
  SKIP_TURN_EFFECT_FADE_RATIO,
  SKIP_TURN_EFFECT_GRAYSCALE_MAX,
  ATTACK_CHARGE_MIN_WINDOW_MS,
  ATTACK_CHARGE_WINDOW_RATIO,
  TELEPORT_SWAP_SCALE_DURATION_MS,
  ENEMY_DAMAGE_FLASH_DURATION_MS,
  ENEMY_DAMAGE_FLASH_RED_BLEND,
  FLOATING_TEXT_LIFETIME_MS,
  FLOATING_TEXT_ENTER_TWEEN_MS,
  FLOATING_TEXT_EXIT_TWEEN_MS,
  FLOATING_TEXT_TONE_MISS,
  FLOATING_TEXT_TONE_RESIST,
  FLOATING_TEXT_TONE_NORMAL,
  FLOATING_TEXT_TONE_SUPER,
  FLOATING_TEXT_TONE_CRITICAL,
  FLOATING_TEXT_TONE_PALETTES,
  FLOATING_TEXT_TONE_VISUAL_STYLES,
  MONEY_COUNTER_LERP_MS,
  MONEY_COUNTER_PULSE_MS,
  PROJECTILE_SPRITE_PX,
  PROJECTILE_TRAIL_POINT_LIFETIME_MS,
  PROJECTILE_TRAIL_MAX_POINTS,
  PROJECTILE_TRAIL_POINT_BASE_SPACING_PX,
  PROJECTILE_TRAIL_POINT_MIN_SPACING_PX,
  PROJECTILE_TRAIL_POINT_MAX_SPACING_PX,
  PROJECTILE_VISUAL_PROFILE,
  CAPTURE_THROW_MS,
  CAPTURE_SHAKE_MS,
  CAPTURE_SUCCESS_BURST_MS,
  CAPTURE_FAIL_BREAK_MS,
  CAPTURE_FAIL_REAPPEAR_MS,
  CAPTURE_POST_MS,
  CAPTURE_CRIT_CHANCE,
  CAPTURE_CRIT_MULTIPLIER,
  CAPTURE_BALL_MULTIPLIER_NERF,
  COIN_REWARD_PER_CAPTURE,
  COIN_REWARD_FIRST_CAPTURE_BONUS,
  COIN_REWARD_PER_EVOLUTION,
  MIN_LEVEL_DIFF_MONEY_MULTIPLIER,
  GACHA_SPIN_COST_COINS,
  GACHA_BATCH_SPIN_COUNT,
  GACHA_BATCH_SPIN_COST_COINS,
  GACHA_BASE_MAX_POKEMON_ID,
  GACHA_EXTENDED_MAX_POKEMON_ID,
  GACHA_REEL_TOTAL_ITEMS,
  GACHA_REEL_REWARD_INDEX,
  GACHA_SPIN_DURATION_MS,
  GACHA_BATCH_SPIN_DURATION_MS,
  GACHA_SPIN_FINAL_SNAP_DURATION_MS,
  GACHA_SPIN_MAIN_SCROLL_DURATION_MS,
  GACHA_BATCH_SPIN_MAIN_SCROLL_DURATION_MS,
  GACHA_SPIN_FINAL_SNAP_LEAD_PX,
  GACHA_BATCH_SPOTLIGHT_POP_MS,
  GACHA_BATCH_SPOTLIGHT_TRANSFER_MS,
  GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS,
  GACHA_BATCH_SLOT_JUICE_MS,
} from "./lib/combat-balance-config.js";
import {
  TEAM_SPRITE_SCALE,
  TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER,
  ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER,
  ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER,
  DEV_LAYOUT_STORAGE_KEY,
  DEV_LAYOUT_SETTINGS_DEFAULTS,
  DEV_LAYOUT_CONTROL_DEFINITIONS,
  POKEMON_SPRITE_COMMON_PPU,
  POKEMON_SPRITE_USE_SOURCE_PPU_ADAPTATION,
  MAX_LEVEL,
  SHOP_TAB_POKEBALLS,
  SHOP_TAB_COMBAT,
  SHOP_TAB_EVOLUTIONS,
  SHOP_QUANTITY_MODE_CUSTOM,
  SHOP_QUANTITY_MODE_MAX,
  SHOP_QUANTITY_PRESET_VALUES,
  SHOP_QUANTITY_PRESET_SET,
  BOOST_X_DURATION_MS,
  BOOST_X_ATTACK_INTERVAL_MULTIPLIER,
  DEFAULT_WILD_LEVEL_MIN,
  DEFAULT_WILD_LEVEL_MAX,
  ENEMY_MONEY_BASE,
  ENEMY_MONEY_LEVEL_MULT,
  ENEMY_MONEY_STAT_FACTOR,
  CAPTURE_XP_BASE,
  CAPTURE_XP_LEVEL_MULT,
  CAPTURE_XP_STAT_FACTOR,
  KO_XP_RATIO_OF_CAPTURE,
  LEVEL_PROGRESSION_LINEAR_PER_STEP,
  LEVEL_PROGRESSION_CURVE_EXPONENT,
  LEVEL_PROGRESSION_CURVE_PER_STEP,
  ENEMY_HP_TEAM_SCALE_MAX_BONUS,
  ENEMY_HP_TEAM_SCALE_EXPONENT,
  ENEMY_REWARD_SCALE_EXPONENT,
  ENEMY_REWARD_SCALE_BLEND,
  APPEARANCE_UNLOCK_LEVEL,
  POKEMON_NICKNAME_MAX_LENGTH,
  FOREGROUND_FRAME_STEP_MS,
  HIDDEN_SIM_BUDGET_MS,
  BACKGROUND_PUMP_MAX_WORK_MS,
  BULK_IDLE_THRESHOLD_MS,
  MAX_OFFLINE_CATCHUP_MS,
  MAX_RESUME_CATCHUP_MS,
  FOREGROUND_CATCHUP_PUMP_MAX_WORK_MS,
  FOREGROUND_CATCHUP_PUMP_DELAY_MS,
  BACKGROUND_TICK_INTERVAL_MS,
  BACKGROUND_PERSIST_DEBOUNCE_MS,
  EVOLUTION_ANIM_TOTAL_MS,
  EVOLUTION_ANIM_WHITE_MS,
  EVOLUTION_ANIM_FLASH_MS,
  EVOLUTION_ANIM_REVEAL_MS,
  EVOLUTION_ANIM_BACKDROP_FADE_MS,
  EVOLUTION_ANIM_PARTICLE_COUNT,
  HAPPINESS_EVOLUTION_BOX_REQUIRED_MS,
  CABLE_LINK_METHOD_ITEM,
  BACKGROUND_DRIFT_TRAVEL_MIN_MS,
  BACKGROUND_DRIFT_TRAVEL_MAX_MS,
  BACKGROUND_DRIFT_HOLD_MIN_MS,
  BACKGROUND_DRIFT_HOLD_MAX_MS,
  TEAM_LEVEL_UP_EFFECT_DURATION_MS,
  TEAM_XP_GAIN_EFFECT_DURATION_MS,
  TEAM_XP_PULSE_DURATION_MS,
  TUTORIAL_FLOW_ROUTE_1,
  TUTORIAL_FLOW_EVOLUTION,
  TUTORIAL_FLOW_APPEARANCE,
  TUTORIAL_FLOW_DEFINITIONS,
  POKEMON_BACKDROP_ALPHA,
  POKEMON_BACKDROP_RADIUS_RATIO,
  POKEMON_SHADOW_ALPHA,
  ULTRA_SHINY_HUE_CYCLE_MS,
  ULTRA_SHINY_SCINTILLATION_PERIOD_MS,
  ULTRA_SHINY_SCINTILLATION_FLASH_MS,
  ULTRA_SHINY_OUTLINE_PX,
  MORPHING_OUTLINE_PX,
  MORPHING_OUTLINE_RGB,
  MORPHING_OUTLINE_ALPHA,
  MORPHING_SLIME_BASE_RGB,
  MORPHING_SLIME_HIGHLIGHT_RGB,
  MORPHING_SLIME_ALPHA,
  MORPHING_MOTION_INTENSITY,
  MORPHING_WOBBLE_SCALE_AMPLITUDE,
  MORPHING_WOBBLE_VERTICAL_COMPENSATION,
  MORPHING_WOBBLE_ROTATION_DEG,
  MORPHING_WOBBLE_SHEAR,
  MORPHING_WOBBLE_OFFSET_RATIO,
  DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON,
  BREATH_MIN_PERIOD_MS,
  BREATH_MAX_PERIOD_MS,
  BREATH_BASE_AMPLITUDE,
  BREATH_AMPLITUDE_VARIATION,
  BREATH_SECONDARY_WEIGHT,
  BREATH_SIDE_COMPENSATION,
  BREATH_OFFSET_RATIO,
  MAX_RENDER_DPR,
  TARGET_FPS,
  TARGET_FRAME_MS,
  TARGET_RENDER_INTERVAL_MS,
  MAX_FOREGROUND_PENDING_MS,
  HUD_AUTO_REFRESH_INTERVAL_MS,
  DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS,
  DESKTOP_BACKGROUND_WATCHDOG_STALL_MS,
  LAYOUT_RECOMPUTE_INTERVAL_MS,
  DEFERRED_ROUTE_WARMUP_CHUNK_SIZE,
  DEFERRED_ROUTE_WARMUP_DELAY_MS,
  LOADING_SCREEN_EXIT_DURATION_MS,
  LOADING_SCREEN_DEFAULT_TEXT,
  LOCAL_DAY_START_HOUR,
  LOCAL_NIGHT_START_HOUR,
  ENVIRONMENT_UPDATE_INTERVAL_MS,
  RENDER_QUALITY_ORDER,
  RENDER_QUALITY_PRESETS,
  PERF_SHORT_EMA_SMOOTHING,
  PERF_LONG_EMA_SMOOTHING,
  PERF_CPU_EMA_SMOOTHING,
  PERF_RENDER_EMA_SMOOTHING,
  PERF_SWITCH_COOLDOWN_MS,
  PERF_DOWNGRADE_STREAK,
  PERF_UPGRADE_STREAK,
  PERF_SLOW_FRAME_MARGIN_MS,
  PERF_VERY_SLOW_FRAME_MARGIN_MS,
  PERF_UPGRADE_HEADROOM_MS,
  BALL_TYPE_ORDER,
  BALL_TYPE_FALLBACK_ORDER,
  BALL_INVENTORY_MAX_PER_TYPE,
  BALL_CAPTURE_RULE_CAPTURE_ALL,
  BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
  BALL_CAPTURE_RULE_CAPTURE_OWNED,
  BALL_CAPTURE_RULE_CAPTURE_SHINY,
  BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
  BALL_OVERLAY_UI_STYLE_BY_TYPE,
  BALL_OVERLAY_UI_STYLE_DEFAULT,
  ZONE_UI_CANVAS_THEME,
  SPRITE_OPAQUE_BOUNDS_CACHE_MAX_ENTRIES,
  MORPHING_COLOR_SAMPLE_CACHE_MAX_ENTRIES,
  MORPHING_PALETTE_TEXTURE_CACHE_MAX_ENTRIES,
  ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES,
  COMPACT_NUMBER_SUFFIXES,
  ANIMATED_SPRITE_CACHE_MAX_ENTRIES,
  ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS,
  HUD_UI_TOKENS,
  MODAL_UI_TOKENS,
  ACTION_MENU_UI_TOKENS,
  NOTIFICATION_UI_TOKENS,
  COLLECTION_LAYOUT_UI_TOKENS,
  MOBILE_SAFE_AREA_UI_TOKENS,
} from "./lib/gameplay-ui-config.js";
import {
  SPECIAL_ATTACK_TYPES,
  TYPE_EFFECTIVENESS,
  TYPE_COLORS,
} from "./lib/type-combat-data.js";
import {
  UI_TWEEN_MODAL_OPEN,
  UI_TWEEN_MODAL_CLOSE,
  UI_TWEEN_POPUP_OPEN,
  UI_TWEEN_POPUP_CLOSE,
} from "./lib/ui-tween-config.js";
import {
  STAT_KEYS,
  STAT_LABELS_FR,
} from "./lib/stats-config.js";
import { createBallCaptureToggleDefinitions } from "./lib/ball-capture-menu-config.js";
import {
  cloneConfigMap,
  createDefaultBallConfigByType,
  createDefaultEvolutionStoneConfigByType,
  createDefaultExtraShopItemConfigById,
  createShopItemConfigById,
  replaceConfigMap,
} from "./lib/shop-config-factory.js";
import {
  getDefaultActiveBallTypeRuntime,
  getLegacyBallBackfillTypeRuntime,
  getSortedBallConfigsRuntime,
  rebuildEvolutionStoneConfigStateRuntime,
  rebuildShopItemConfigStateRuntime,
  refreshBallConfigDerivedStateRuntime,
} from "./lib/shop-config-runtime.js";
import {
  PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE,
  projectWorldToStage,
} from "./lib/runtime-stage-layout.js";

const APP_VERSION = POKEIDLE_APP_VERSION;
const DISPLAY_APP_VERSION = getDisplayedAppVersion(window.location, APP_VERSION);
const IS_DEV_RUNTIME = !isProductionGithubPagesLocation(window.location);

const DEFAULT_BALL_CONFIG_BY_TYPE = createDefaultBallConfigByType();
const DEFAULT_EVOLUTION_STONE_CONFIG_BY_TYPE = createDefaultEvolutionStoneConfigByType();
const DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID =
  createDefaultExtraShopItemConfigById(DEFAULT_EVOLUTION_STONE_CONFIG_BY_TYPE);

const BALL_CONFIG_BY_TYPE = cloneConfigMap(DEFAULT_BALL_CONFIG_BY_TYPE);
const EVOLUTION_STONE_CONFIG_BY_TYPE = cloneConfigMap(DEFAULT_EVOLUTION_STONE_CONFIG_BY_TYPE);
const EXTRA_SHOP_ITEM_CONFIG_BY_ID = cloneConfigMap(DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID);
const SHOP_ITEM_CONFIG_BY_ID = createShopItemConfigById(BALL_CONFIG_BY_TYPE, EXTRA_SHOP_ITEM_CONFIG_BY_ID);
const COMING_SOON_BALL_TYPES = new Set();

function getSortedBallConfigs() {
  return getSortedBallConfigsRuntime(BALL_CONFIG_BY_TYPE);
}

function getDefaultActiveBallType() {
  return getDefaultActiveBallTypeRuntime(BALL_CONFIG_BY_TYPE);
}

function getLegacyBallBackfillType() {
  return getLegacyBallBackfillTypeRuntime(BALL_CONFIG_BY_TYPE);
}

function refreshBallConfigDerivedState() {
  refreshBallConfigDerivedStateRuntime({
    ballConfigByType: BALL_CONFIG_BY_TYPE,
    ballTypeOrder: BALL_TYPE_ORDER,
    ballTypeFallbackOrder: BALL_TYPE_FALLBACK_ORDER,
    comingSoonBallTypes: COMING_SOON_BALL_TYPES,
  });
}

function rebuildEvolutionStoneConfigState(extraShopItemsById = EXTRA_SHOP_ITEM_CONFIG_BY_ID) {
  rebuildEvolutionStoneConfigStateRuntime({
    extraShopItemsById,
    evolutionStoneConfigByType: EVOLUTION_STONE_CONFIG_BY_TYPE,
  });
}

function rebuildShopItemConfigState() {
  rebuildShopItemConfigStateRuntime({
    shopItemConfigById: SHOP_ITEM_CONFIG_BY_ID,
    ballConfigByType: BALL_CONFIG_BY_TYPE,
    extraShopItemsById: EXTRA_SHOP_ITEM_CONFIG_BY_ID,
  });
}

const runtimeUiDom = mountRuntimeUi(document);
assertRuntimeUiDomInvariants(runtimeUiDom);
const uiTextNormalizationRuntime = createUiTextNormalizationRuntime({
  rootEl: runtimeUiDom.captureRootEl,
});
uiTextNormalizationRuntime.start();

const {
  canvas,
  captureRootEl,
  gameStageEl,
  worldUiLayerEl,
  gameOverlayEl,
  loadingScreenEl,
  loadingScreenTextEl,
  uiTopbarEl,
  actionDockEl,
  actionDockPokeballToggleButtonEl,
  actionDockPokeballVisualEl,
  actionDockFullscreenMenuEl,
  actionDockFullscreenGridEl,
  starterModalEl,
  starterChoicesEl,
  hoverPopupEl,
  teamContextMenuEl,
  teamContextMenuTitleEl,
  teamContextMenuRenameButtonEl,
  teamContextMenuBoxesButtonEl,
  teamContextMenuAppearanceButtonEl,
  ballCaptureMenuEl,
  ballCaptureMenuTitleEl,
  ballCaptureToggleAllButtonEl,
  ballCaptureToggleUnownedButtonEl,
  ballCaptureToggleOwnedButtonEl,
  ballCaptureToggleShinyButtonEl,
  ballCaptureToggleUltraButtonEl,
  renameModalEl,
  renameTitleEl,
  renameSubtitleEl,
  renameFormEl,
  renameInputEl,
  renameCharCountEl,
  renameCloseButtonEl,
  renameResetButtonEl,
  exportSaveButtonEl,
  importSaveButtonEl,
  resetSaveButtonEl,
  mapButtonEl,
  pokedexButtonEl,
  mapModalEl,
  mapCloseButtonEl,
  mapStageEl,
  mapImageEl,
  mapMarkersEl,
  mapModalTitleEl,
  mapModalSubtitleEl,
  mapConnectionsListEl,
  mapConnectionsInfoPanelEl,
  shopButtonEl,
  gachaButtonEl,
  windowsNotificationButtonEl,
  windowsNotificationButtonLabelEl,
  shopModalEl,
  shopModalSubtitleEl,
  shopGridEl,
  shopPokeballQtyPanelEl,
  shopCustomQtyInputEl,
  shopTabPokeballsButtonEl,
  shopTabCombatButtonEl,
  shopTabEvolutionsButtonEl,
  shopWalletMoneyValueEl,
  shopWalletPokeballsValueEl,
  shopWalletQtyItemEl,
  shopWalletQtyValueEl,
  shopTabButtonEls,
  shopQtyPresetButtonEls,
  closeShopButtonEl,
  gachaModalEl,
  gachaCardEl,
  gachaCloseButtonEl,
  gachaSubtitleEl,
  gachaWalletCoinsEl,
  gachaWalletCostEl,
  gachaWalletRemainingEl,
  gachaMachineEl,
  gachaReelWindowEl,
  gachaReelTrackEl,
  gachaBatchRevealEl,
  gachaBatchSpotlightEl,
  gachaStatusEl,
  gachaResultEl,
  gachaResultKickerEl,
  gachaResultNameEl,
  gachaResultSkinEl,
  gachaResultPreviewEl,
  gachaResultListEl,
  gachaSpinButtonEl,
  gachaSpin10ButtonEl,
  evolutionItemModalEl,
  evolutionItemTitleEl,
  evolutionItemSubtitleEl,
  evolutionItemListEl,
  evolutionItemCloseButtonEl,
  moneyPillEl,
  moneyValueEl,
  moneyAnimLayerEl,
  coinsValueEl,
  saveBackendValueEl,
  routeNavPanelEl,
  routeNavZoneTypeEl,
  routeNavRegionEl,
  routeNavCurrentEl,
  routeNavBadgesEl,
  routeNavProgressChipsEl,
  routeNavDestinationsEl,
  routeNavDrawerToggleButtonEl,
  routeNavDrawerToggleCountEl,
  routeNavDrawerEl,
  routeNavDrawerCloseButtonEl,
  routeNavDrawerListEl,
  routeNavInfoPanelEl,
  boxesModalEl,
  boxesGridEl,
  boxesInfoPanelEl,
  boxesCloseButtonEl,
  boxesSearchInputEl,
  boxesSubtitleEl,
  boxesShinyCounterEl,
  pokedexModalEl,
  pokedexGridEl,
  pokedexInfoPanelEl,
  pokedexCloseButtonEl,
  pokedexSearchInputEl,
  pokedexSubtitleEl,
  pokedexGlobalCompletionEl,
  pokedexEncounteredStatEl,
  pokedexCapturedStatEl,
  pokedexShinyStatEl,
  pokedexUltraShinyStatEl,
  appearanceModalEl,
  appearanceTitleEl,
  appearanceSubtitleEl,
  appearanceCloseButtonEl,
  appearanceShinyToggleButtonEl,
  appearanceUltraShinyToggleButtonEl,
  appearanceShinyStatusEl,
  appearanceGridEl,
  notificationStackEl,
  devLevelAllButtonEl,
  backgroundRuntimeDebugOverlayEl,
  tutorialModalEl,
  tutorialTitleEl,
  tutorialPageTitleEl,
  tutorialBodyEl,
  tutorialProgressEl,
  tutorialPrevButtonEl,
  tutorialNextButtonEl,
  tutorialCloseButtonEl,
  dialogueModalEl,
  dialogueTitleEl,
  dialogueSpeakerEl,
  dialogueTextEl,
  dialogueChoiceListEl,
  dialogueProgressEl,
  dialogueNextButtonEl,
  dialogueCloseButtonEl,
  trainerBattleSetupModalEl,
  trainerBattleSetupTitleEl,
  trainerBattleSetupSubtitleEl,
  trainerBattleSetupRosterEl,
  trainerBattleSetupRulesEl,
  trainerBattleSetupSlotsEl,
  trainerBattleSetupStatusEl,
  trainerBattleSetupCloseButtonEl,
  trainerBattleSetupCancelButtonEl,
  trainerBattleSetupConfirmButtonEl,
  devLayoutPanelEl,
  devLayoutControlsEl,
  devLayoutCloseButtonEl,
  devLayoutResetButtonEl,
} = runtimeUiDom;

function setUiDesignCssVariable(target, name, value, unit = "px") {
  if (!target?.style?.setProperty) {
    return;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return;
  }
  target.style.setProperty(name, `${numeric}${unit}`);
}

function applyRuntimeUiDesignTokens(rootTargets = []) {
  const uniqueTargets = [...new Set(rootTargets.filter((target) => target?.style?.setProperty))];
  if (uniqueTargets.length <= 0) {
    return;
  }

  for (const target of uniqueTargets) {
    setUiDesignCssVariable(target, "--ui-hud-desktop-current-zone-max-width-px", HUD_UI_TOKENS.desktopCurrentZoneMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-hud-desktop-current-zone-height-px", HUD_UI_TOKENS.desktopCurrentZoneHeightPx);
    setUiDesignCssVariable(target, "--ui-hud-desktop-progress-height-px", HUD_UI_TOKENS.desktopProgressHeightPx);
    setUiDesignCssVariable(target, "--ui-hud-mobile-zone-header-height-px", HUD_UI_TOKENS.mobileZoneHeaderHeightPx);
    setUiDesignCssVariable(target, "--ui-hud-mobile-resource-row-height-px", HUD_UI_TOKENS.mobileResourceRowHeightPx);
    setUiDesignCssVariable(target, "--ui-hud-mobile-ball-rail-cell-height-px", HUD_UI_TOKENS.mobileBallRailCellHeightPx);
    setUiDesignCssVariable(target, "--ui-hud-mobile-ball-rail-max-width-px", HUD_UI_TOKENS.mobileBallRailMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-hud-mobile-top-stack-max-height-px", HUD_UI_TOKENS.mobileTopStackMaxHeightPx);
    setUiDesignCssVariable(target, "--ui-touch-target-min-px", HUD_UI_TOKENS.minimumTouchTargetPx);
    setUiDesignCssVariable(target, "--ui-secondary-text-min-font-size-desktop-px", HUD_UI_TOKENS.secondaryTextMinFontSizeDesktopPx);
    setUiDesignCssVariable(target, "--ui-secondary-text-min-font-size-mobile-px", HUD_UI_TOKENS.secondaryTextMinFontSizeMobilePx);
    setUiDesignCssVariable(target, "--ui-modal-size-s-max-width-px", MODAL_UI_TOKENS.sizeSMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-modal-size-m-max-width-px", MODAL_UI_TOKENS.sizeMMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-modal-size-l-max-width-px", MODAL_UI_TOKENS.sizeLMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-modal-mobile-side-inset-px", MODAL_UI_TOKENS.mobileSideInsetPx);
    setUiDesignCssVariable(target, "--ui-modal-mobile-radius-px", MODAL_UI_TOKENS.mobileRadiusPx);
    setUiDesignCssVariable(target, "--ui-modal-mobile-max-height-vh", MODAL_UI_TOKENS.mobileMaxHeightVh, "svh");
    setUiDesignCssVariable(target, "--ui-action-menu-desktop-max-width-px", ACTION_MENU_UI_TOKENS.desktopPanelMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-action-menu-desktop-grid-columns", ACTION_MENU_UI_TOKENS.desktopGridColumns, "");
    setUiDesignCssVariable(target, "--ui-action-menu-mobile-grid-columns", ACTION_MENU_UI_TOKENS.mobileGridColumns, "");
    setUiDesignCssVariable(target, "--ui-action-menu-pulse-duration-ms", ACTION_MENU_UI_TOKENS.onboardingPulseDurationMs, "ms");
    setUiDesignCssVariable(target, "--ui-action-menu-pulse-repeat-delay-ms", ACTION_MENU_UI_TOKENS.onboardingPulseRepeatDelayMs, "ms");
    setUiDesignCssVariable(target, "--ui-notification-desktop-max-width-px", NOTIFICATION_UI_TOKENS.desktopMaxWidthPx);
    setUiDesignCssVariable(target, "--ui-notification-mobile-card-height-px", NOTIFICATION_UI_TOKENS.mobileCardHeightPx);
    setUiDesignCssVariable(target, "--ui-notification-mobile-bottom-offset-px", NOTIFICATION_UI_TOKENS.mobileBottomOffsetPx);
    setUiDesignCssVariable(target, "--ui-collection-desktop-grid-ratio-pct", COLLECTION_LAYOUT_UI_TOKENS.desktopGridRatioPercent, "%");
    setUiDesignCssVariable(target, "--ui-collection-desktop-detail-ratio-pct", COLLECTION_LAYOUT_UI_TOKENS.desktopDetailRatioPercent, "%");
    setUiDesignCssVariable(target, "--ui-collection-mobile-detail-sheet-height-vh", COLLECTION_LAYOUT_UI_TOKENS.mobileDetailSheetHeightVh, "svh");
    setUiDesignCssVariable(target, "--ui-collection-mobile-map-min-height-vh", COLLECTION_LAYOUT_UI_TOKENS.mobileMapMinHeightVh, "svh");
    setUiDesignCssVariable(target, "--ui-mobile-side-inset-px", MOBILE_SAFE_AREA_UI_TOKENS.sideInsetPx);
    setUiDesignCssVariable(target, "--ui-mobile-bottom-offset-px", NOTIFICATION_UI_TOKENS.mobileBottomOffsetPx);
    setUiDesignCssVariable(target, "--ui-mobile-quick-card-height-px", MOBILE_SAFE_AREA_UI_TOKENS.quickCardHeightPx);
  }
}

applyRuntimeUiDesignTokens([document.documentElement, captureRootEl]);

if (!canvas || typeof canvas.getContext !== "function") {
  throw new Error("Runtime UI mount failed: #game-canvas is missing or invalid.");
}

if (captureRootEl) {
  captureRootEl.dataset.devLevelAllVisible = IS_DEV_RUNTIME ? "true" : "false";
}
if (devLevelAllButtonEl) {
  devLevelAllButtonEl.classList.toggle("hidden", !IS_DEV_RUNTIME);
  devLevelAllButtonEl.setAttribute("aria-hidden", IS_DEV_RUNTIME ? "false" : "true");
}

const ctx =
  canvas.getContext("2d", { alpha: false, desynchronized: true }) ||
  canvas.getContext("2d");
const spriteTintBufferCanvas = document.createElement("canvas");
const spriteTintBufferCtx = spriteTintBufferCanvas.getContext("2d");
const spriteOpaqueBoundsCanvas = document.createElement("canvas");
const spriteOpaqueBoundsCtx =
  spriteOpaqueBoundsCanvas.getContext("2d", { willReadFrequently: true }) ||
  spriteOpaqueBoundsCanvas.getContext("2d");
const spriteColorSampleCanvas = document.createElement("canvas");
const spriteColorSampleCtx =
  spriteColorSampleCanvas.getContext("2d", { willReadFrequently: true }) ||
  spriteColorSampleCanvas.getContext("2d");
const spriteOutlineTintBufferCanvas = document.createElement("canvas");
const spriteOutlineTintBufferCtx = spriteOutlineTintBufferCanvas.getContext("2d");
const BALL_CAPTURE_TOGGLE_DEFINITIONS = createBallCaptureToggleDefinitions({
  allButtonEl: ballCaptureToggleAllButtonEl,
  unownedButtonEl: ballCaptureToggleUnownedButtonEl,
  ownedButtonEl: ballCaptureToggleOwnedButtonEl,
  shinyButtonEl: ballCaptureToggleShinyButtonEl,
  ultraButtonEl: ballCaptureToggleUltraButtonEl,
});
const devLayoutControlInputByKey = new Map();
const devLayoutControlValueByKey = new Map();
const tweenGroup = new Group();
const uiAnimationStateByElement = new WeakMap();
const notificationCardById = new Map();
const notificationCardExitingIds = new Set();
const androidNotificationIdByTag = new Map();
let nextAndroidNotificationId = 10000;
const pokemonSpriteImageCache = new Map();
const spriteOpaqueBoundsCache = new Map();
const morphingColorSampleCache = new Map();
const morphingPaletteTextureCache = new Map();
const pendingRouteDefinitionLoads = new Map();
const pendingRouteBackgroundLoads = new Map();
let pendingExtendedPokedexAndGachaWarmup = null;
let pokedexRenderRafHandle = 0;
let pokedexViewportRenderRafHandle = 0;
let pokedexEntriesCacheDirty = true;
let pokedexEntriesCacheSaveDataRef = null;
let pokedexEntriesCacheSpeciesRef = null;
let pokedexEntriesCachePokemonDefsCount = -1;
let pokedexEntriesCacheList = [];
let pokedexEntriesCacheById = new Map();
let pokedexEntriesCacheEncounteredSpeciesCount = 0;
let pokedexEntriesCacheCapturedSpeciesCount = 0;
let pokedexEntriesCacheShinySpeciesCount = 0;
let pokedexEntriesCacheUltraShinySpeciesCount = 0;
let pokedexVirtualContentEl = null;
let pokedexVirtualTopSpacerEl = null;
let pokedexVirtualBottomSpacerEl = null;
let pokedexVirtualLastSliceKey = "";
let pokedexVirtualLastStartIndex = 0;
let pokedexVirtualLastEndIndex = 0;
let pokedexVirtualEventsBound = false;
let pokedexVirtualResizeObserver = null;
let pokedexVirtualLayoutCacheKey = "";
let pokedexVirtualPaddingLeftPx = 10;
let pokedexVirtualPaddingRightPx = 10;
let pokedexVirtualPaddingTopPx = 10;
let pokedexVirtualPaddingBottomPx = 10;
let pokedexVirtualColumnGapPx = POKEDEX_VIRTUAL_GAP_PX;
let pokedexVirtualRowGapPx = POKEDEX_VIRTUAL_GAP_PX;
const pokedexSpritePrefetchStateByPath = new Map();
const ultraShinyOutlineCache = new Map();
const mapMarkerButtonsByRouteId = new Map();
const zoneActionButtonsById = new Map();
let evolutionItemChoiceResolver = null;
let evolutionItemChoiceStoneType = "";
let evolutionItemChoiceCandidates = [];
let loadingScreenHideTimerId = 0;
const DIALOGUE_DATA_DIR = "map_data/dialogues";
const TRAINER_BATTLE_SOURCE_ROUTE_WILD = "route_wild";
const TRAINER_BATTLE_SOURCE_TRAINER = "trainer_battle";
const pendingTrainerBattleDefinitionLoads = new Map();

window.POKEIDLE_APP_VERSION = APP_VERSION;
window.POKEIDLE_DISPLAY_VERSION = DISPLAY_APP_VERSION;
let audioManager = null;
const ENEMY_CRY_AUDIO_ID = "enemy-cry";
let registeredEnemyCryPath = "";

function ensureAudioManager() {
  if (!audioManager) {
    audioManager = createAudioManager();
  }
  return audioManager;
}

function resolveEnemyCryPath(enemy) {
  const enemyCryPath = String(enemy?.cryPath || "").trim();
  if (enemyCryPath) {
    return enemyCryPath;
  }
  const pokemonId = Number(enemy?.id || 0);
  const def = pokemonId > 0 ? state.pokemonDefsById.get(pokemonId) : null;
  return String(def?.cryPath || "").trim();
}

function playEnemyCry(enemy, options = {}) {
  if (state.simulationIdleMode) {
    return false;
  }
  const cryPath = resolveEnemyCryPath(enemy);
  if (!cryPath) {
    return false;
  }
  const manager = audioManager || (options.allowCreate === true ? ensureAudioManager() : null);
  if (!manager) {
    return false;
  }

  try {
    if (registeredEnemyCryPath !== cryPath) {
      manager.registerSound(ENEMY_CRY_AUDIO_ID, {
        src: [cryPath],
        category: "sfx",
      });
      registeredEnemyCryPath = cryPath;
    } else {
      manager.stop(ENEMY_CRY_AUDIO_ID);
    }
    manager.play(ENEMY_CRY_AUDIO_ID);
    return true;
  } catch (error) {
    console.warn("Enemy cry playback failed", {
      enemyId: Number(enemy?.id || 0),
      cryPath,
      error: error?.message || error,
    });
    return false;
  }
}

function initializeAudioManagerAfterGesture() {
  ensureAudioManager();
  window.removeEventListener("pointerdown", initializeAudioManagerAfterGesture, true);
  window.removeEventListener("keydown", initializeAudioManagerAfterGesture, true);
  playEnemyCry(state.enemy);
}

window.POKEIDLE_AUDIO = new Proxy(
  {},
  {
    get(_target, prop) {
      const manager = ensureAudioManager();
      const value = manager[prop];
      return typeof value === "function" ? value.bind(manager) : value;
    },
    has(_target, prop) {
      return prop in ensureAudioManager();
    },
    ownKeys() {
      return Reflect.ownKeys(ensureAudioManager());
    },
    getOwnPropertyDescriptor(_target, prop) {
      const manager = ensureAudioManager();
      const descriptor = Object.getOwnPropertyDescriptor(manager, prop);
      if (!descriptor) {
        return undefined;
      }
      return { ...descriptor, configurable: true };
    },
  },
);

window.addEventListener("pointerdown", initializeAudioManagerAfterGesture, { capture: true, passive: true });
window.addEventListener("keydown", initializeAudioManagerAfterGesture, { capture: true });

const state = createInitialGameState({
  routeIdOrder: ROUTE_ID_ORDER,
  targetFrameMs: TARGET_FRAME_MS,
  devLayoutSettingsDefaults: DEV_LAYOUT_SETTINGS_DEFAULTS,
  defaultShopTab: SHOP_TAB_POKEBALLS,
});
state.backgroundRuntime.debugOverlayEnabled = String(
  new URLSearchParams(window.location.search).get("debugBackgroundRuntime") || "",
).trim() === "1";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const {
  createDefaultDevLayoutSettings,
  getDevLayoutControlDefinition,
  normalizeDevLayoutSettingValue,
  normalizeDevLayoutSettings,
  shouldAllowDevLayoutOverflowPositions,
  loadDevLayoutSettingsFromStorage,
  persistDevLayoutSettingsToStorage,
  formatDevLayoutSettingValue,
  syncDevLayoutControlsFromState,
  renderDevLayoutPanel,
  setDevLayoutPanelOpen,
  toggleDevLayoutPanel,
  setDevLayoutSetting,
  resetDevLayoutSettings,
  initializeDevLayoutControls,
} = createDevLayoutControls({
  clamp,
  devLayoutSettingsDefaults: DEV_LAYOUT_SETTINGS_DEFAULTS,
  devLayoutControlDefinitions: DEV_LAYOUT_CONTROL_DEFINITIONS,
  devLayoutStorageKey: DEV_LAYOUT_STORAGE_KEY,
  state,
  getBattleViewportProfile,
  refreshLayoutIfNeeded,
  render,
  devLayoutPanelEl,
  devLayoutControlsEl,
  devLayoutControlInputByKey,
  devLayoutControlValueByKey,
});

const {
  isTypingTarget,
  getDesktopBridge,
  hasDesktopSaveBridge,
  hasDesktopNotificationBridge,
  getDesktopWindowState,
  normalizeDesktopWindowState,
  isDesktopWindowStateBackgrounded,
  isDesktopRuntime,
  getCapacitorBridge,
  getCapacitorAppPlugin,
  subscribeCapacitorAppState,
  isCapacitorAndroidRuntime,
  getAndroidNotificationPlugin,
  hasAndroidNotificationBridge,
  getNotificationPlatformLabel,
  isLikelySmartphoneBrowser,
  getRuntimeClientType,
  getRuntimeActivitySnapshot,
} = createRuntimePlatformUtils({
  toSafeInt,
  runtimeClientDesktopExePc: RUNTIME_CLIENT_DESKTOP_EXE_PC,
  runtimeClientBrowserSmartphone: RUNTIME_CLIENT_BROWSER_SMARTPHONE,
  runtimeClientBrowserPc: RUNTIME_CLIENT_BROWSER_PC,
});

const {
  getUiAnimationState,
  stopUiElementTweens,
  composeUiTransform,
  applyUiTweenStyles,
  clearUiTweenStyles,
  clearLoadingScreenHideTimer,
  setLoadingScreenMessage,
  showLoadingScreen,
  hideLoadingScreen,
  parseUiTweenTransformValue,
  parseUiTweenFilterBlurValue,
  getCurrentUiTweenValues,
  animateUiElement,
  resolveModalPanelElement,
  showModalWithTween,
  hideModalWithTween,
  showPopupWithTween,
  hidePopupWithTween,
  showTooltipWithTween,
  createFloatingTextVisualTween,
  stopFloatingTextVisualTween,
  stopProjectileTravelTween,
  stopTweenIfRunning,
  createProjectileTravelTween,
} = createUiAnimationRuntime({
  clamp,
  state,
  tweenGroup,
  tweenCtor: Tween,
  easing: Easing,
  loadingScreenEl,
  loadingScreenTextEl,
  loadingScreenDefaultText: LOADING_SCREEN_DEFAULT_TEXT,
  loadingScreenExitDurationMs: LOADING_SCREEN_EXIT_DURATION_MS,
  uiTweenModalOpen: UI_TWEEN_MODAL_OPEN,
  uiTweenModalClose: UI_TWEEN_MODAL_CLOSE,
  uiTweenPopupOpen: UI_TWEEN_POPUP_OPEN,
  uiTweenPopupClose: UI_TWEEN_POPUP_CLOSE,
  floatingTextLifetimeMs: FLOATING_TEXT_LIFETIME_MS,
  floatingTextEnterTweenMs: FLOATING_TEXT_ENTER_TWEEN_MS,
  floatingTextExitTweenMs: FLOATING_TEXT_EXIT_TWEEN_MS,
  floatingTextToneNormal: FLOATING_TEXT_TONE_NORMAL,
  projectileTweenDurationMinMs: PROJECTILE_TWEEN_DURATION_MIN_MS,
  projectileTweenDurationMaxMs: PROJECTILE_TWEEN_DURATION_MAX_MS,
  getFloatingTextToneVisualStyle,
});

const {
  shouldForceUltraShinyAllPokemon,
  getRenderQualitySettings,
  getRenderQualityRank,
  setRenderQualityByRank,
  isLikelyHighEndMobileDevice,
  refreshAutomaticRenderQualityRankCache,
  getMaxAutomaticRenderQualityRank,
  getInitialRenderQualityForDevice,
  applyInitialPerformanceProfile,
  getForegroundSimulationBudgetMs,
  shouldRenderAmbientOverlays,
  shouldRenderCelebrationParticles,
  getProjectileTrailMaxPoints,
  createProjectileTrailPoint,
  getProjectileTrailTypeVfxProfile,
  getRenderFrameIntervalMs,
  updateRenderQualityFromFrame,
} = createRenderQualityUtils({
  clamp,
  toSafeInt,
  isHidden: () => {
    if (typeof document === "undefined") {
      return false;
    }
    const userAgent = String(window?.navigator?.userAgent || "").toLowerCase();
    const isDesktopClient = Boolean(window?.pokeidleDesktop?.isDesktop) || userAgent.includes("electron/");
    return !isDesktopClient && Boolean(document.hidden);
  },
  state,
  renderQualityOrder: RENDER_QUALITY_ORDER,
  renderQualityPresets: RENDER_QUALITY_PRESETS,
  projectileVisualProfile: PROJECTILE_VISUAL_PROFILE,
  projectileTrailMaxPoints: PROJECTILE_TRAIL_MAX_POINTS,
  projectileTrailPointLifetimeMs: PROJECTILE_TRAIL_POINT_LIFETIME_MS,
  targetFrameMs: TARGET_FRAME_MS,
  debugForceUltraShinyAllPokemon: DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON,
  perfShortEmaSmoothing: PERF_SHORT_EMA_SMOOTHING,
  perfLongEmaSmoothing: PERF_LONG_EMA_SMOOTHING,
  perfCpuEmaSmoothing: PERF_CPU_EMA_SMOOTHING,
  perfRenderEmaSmoothing: PERF_RENDER_EMA_SMOOTHING,
  perfSwitchCooldownMs: PERF_SWITCH_COOLDOWN_MS,
  perfDowngradeStreak: PERF_DOWNGRADE_STREAK,
  perfUpgradeStreak: PERF_UPGRADE_STREAK,
  perfSlowFrameMarginMs: PERF_SLOW_FRAME_MARGIN_MS,
  perfVerySlowFrameMarginMs: PERF_VERY_SLOW_FRAME_MARGIN_MS,
  perfUpgradeHeadroomMs: PERF_UPGRADE_HEADROOM_MS,
  resizeCanvas,
});

const {
  calcLevel,
  randomInt,
  randomRange,
  easeInOutSine,
  lerpNumber,
  pseudoRandomUnit,
  hashStringToUnit,
  padTwoDigits,
  formatCompactNumber,
} = createGameMathUtils({
  clamp,
  toSafeInt,
  compactNumberSuffixes: COMPACT_NUMBER_SUFFIXES,
});

const {
  getMoneyAnimationLayer,
  setMoneyCounterTextValue,
  setCoinsCounterTextValue,
  formatPokeDollarValue,
  refreshShopWalletPanel,
  spawnMoneyGainFloater,
  clearMoneyGainFloaters,
  refreshMoneyCounterTransform,
  updateMoneyHudAnimation,
} = createWalletUiRuntime({
  formatCompactNumber,
  toSafeInt,
  clamp,
  randomRange,
  shouldRenderCelebrationParticles,
  state,
  moneyPillEl,
  moneyValueEl,
  coinsValueEl,
  moneyAnimLayerEl,
  shopWalletMoneyValueEl,
  shopWalletPokeballsValueEl,
  shopWalletQtyValueEl,
  shopWalletQtyItemEl,
  shopTabPokeballs: SHOP_TAB_POKEBALLS,
  getSelectedShopBallQuantitySummaryLabel,
  moneyCounterPulseMs: MONEY_COUNTER_PULSE_MS,
  moneyCounterLerpMs: MONEY_COUNTER_LERP_MS,
});

function supportsWindowsSystemNotifications() {
  if (hasDesktopNotificationBridge()) {
    return true;
  }
  if (hasAndroidNotificationBridge()) {
    return true;
  }
  return typeof window !== "undefined" && typeof Notification !== "undefined";
}

function normalizeNotificationPermission(permissionRaw) {
  const permission = String(permissionRaw || "default").toLowerCase().trim();
  if (permission === "prompt" || permission === "prompt-with-rationale") {
    return "default";
  }
  if (permission === "unsupported") {
    return "unsupported";
  }
  if (permission === "granted" || permission === "denied" || permission === "default") {
    return permission;
  }
  return "default";
}

async function getAndroidNotificationPermission() {
  const plugin = getAndroidNotificationPlugin();
  if (!plugin) {
    return "unsupported";
  }
  try {
    const status = await plugin.checkPermissions();
    return normalizeNotificationPermission(status?.display);
  } catch {
    return "default";
  }
}

function getCurrentNotificationPermission() {
  if (!supportsWindowsSystemNotifications()) {
    return "unsupported";
  }
  if (hasDesktopNotificationBridge()) {
    return "granted";
  }
  if (hasAndroidNotificationBridge()) {
    return normalizeNotificationPermission(state.windowsNotifications?.permission || "default");
  }
  return normalizeNotificationPermission(Notification.permission);
}

function readWindowsNotificationPreference() {
  try {
    const raw = localStorage.getItem(WINDOWS_NOTIFICATION_PREF_KEY);
    if (raw === "1") {
      return true;
    }
    if (raw === "0") {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}

function writeWindowsNotificationPreference(enabled) {
  try {
    localStorage.setItem(WINDOWS_NOTIFICATION_PREF_KEY, enabled ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}

function refreshWindowsNotificationButtonUi() {
  if (!windowsNotificationButtonEl) {
    return;
  }
  const supported = Boolean(state.windowsNotifications?.supported);
  const permission = String(state.windowsNotifications?.permission || "default");
  const enabled = Boolean(state.windowsNotifications?.enabled);

  const viaDesktop = hasDesktopNotificationBridge();
  const viaAndroid = hasAndroidNotificationBridge();
  const platformLabel = viaDesktop ? "Desktop" : viaAndroid ? "Android" : "Windows";
  let label = viaDesktop ? "Notifs Desktop" : viaAndroid ? "Notifs Android" : "Notifs Windows";
  let title = viaDesktop
    ? "Notifications desktop actives pour les shiny, le stock vide et les evolutions pretes quand le jeu n'est plus au premier plan."
    : viaAndroid
      ? "Notifs systeme Android pour les shiny, le stock vide et les evolutions pretes quand le jeu n'est plus au premier plan."
      : "Notifs systeme Windows pour les shiny, le stock vide et les evolutions pretes quand le jeu n'est plus au premier plan.";
  if (!supported) {
    label = "Notifs non supportees";
    title = viaDesktop
      ? "Le bridge desktop ne supporte pas les notifications."
      : viaAndroid
        ? "Le bridge Capacitor LocalNotifications est indisponible."
        : "Ce navigateur ne supporte pas l'API Notification.";
  } else if (permission === "denied") {
    label = "Notifs bloquees";
    title = viaDesktop
      ? "Les notifications desktop sont bloquees."
      : viaAndroid
        ? "Autorise les notifications Android pour cette application."
        : "Autorise les notifications dans les reglages du navigateur.";
  } else if (enabled) {
    label = `Notifs ${platformLabel} ON`;
    title = viaDesktop
      ? "Notifications desktop actives pour les shiny, le stock vide et les evolutions pretes quand le jeu n'est plus au premier plan."
      : viaAndroid
        ? "Notifications Android actives pour les shiny, le stock vide et les evolutions pretes quand le jeu n'est plus au premier plan."
        : "Notifications systeme actives pour les shiny, le stock vide et les evolutions pretes quand le jeu n'est plus au premier plan.";
  } else {
    label = "Activer notifs";
    title = viaDesktop
      ? "Clique pour activer les notifications desktop de shiny, stock vide et evolution hors premier plan."
      : viaAndroid
        ? "Clique pour activer les notifications Android de shiny, stock vide et evolution hors premier plan."
        : "Clique pour activer les notifications systeme de shiny, stock vide et evolution hors premier plan.";
  }

  windowsNotificationButtonEl.setAttribute("aria-pressed", enabled ? "true" : "false");
  windowsNotificationButtonEl.title = title;
  if (windowsNotificationButtonLabelEl) {
    windowsNotificationButtonLabelEl.textContent = label;
  }
}

function syncWindowsNotificationStateFromEnvironment() {
  const supported = supportsWindowsSystemNotifications();
  const permission = supported ? getCurrentNotificationPermission() : "unsupported";
  const storedPreference = supported ? readWindowsNotificationPreference() : null;

  state.windowsNotifications.supported = supported;
  state.windowsNotifications.permission = permission;
  if (!supported || permission !== "granted") {
    state.windowsNotifications.enabled = false;
  } else {
    state.windowsNotifications.enabled = storedPreference == null ? true : Boolean(storedPreference);
  }

  refreshWindowsNotificationButtonUi();
}

async function syncWindowsNotificationStateFromEnvironmentAsync() {
  if (hasAndroidNotificationBridge()) {
    const permission = await getAndroidNotificationPermission();
    const storedPreference = readWindowsNotificationPreference();
    state.windowsNotifications.supported = true;
    state.windowsNotifications.permission = permission;
    if (permission !== "granted") {
      state.windowsNotifications.enabled = false;
    } else {
      state.windowsNotifications.enabled = storedPreference == null ? true : Boolean(storedPreference);
    }
    refreshWindowsNotificationButtonUi();
    return;
  }
  syncWindowsNotificationStateFromEnvironment();
}

async function initializeWindowsNotificationSystem() {
  await syncWindowsNotificationStateFromEnvironmentAsync();
}

async function requestWindowsNotificationPermission() {
  if (!supportsWindowsSystemNotifications()) {
    return "unsupported";
  }
  if (hasDesktopNotificationBridge()) {
    return "granted";
  }
  if (hasAndroidNotificationBridge()) {
    const plugin = getAndroidNotificationPlugin();
    if (!plugin) {
      return "unsupported";
    }
    try {
      const current = normalizeNotificationPermission((await plugin.checkPermissions())?.display);
      if (current !== "default") {
        return current;
      }
      const requested = await plugin.requestPermissions();
      return normalizeNotificationPermission(requested?.display);
    } catch {
      return getCurrentNotificationPermission();
    }
  }
  const permissionBefore = getCurrentNotificationPermission();
  if (permissionBefore !== "default") {
    return permissionBefore;
  }
  try {
    const requested = await Notification.requestPermission();
    return normalizeNotificationPermission(requested);
  } catch {
    return getCurrentNotificationPermission();
  }
}

function disableWindowsNotificationSystem() {
  state.windowsNotifications.enabled = false;
  writeWindowsNotificationPreference(false);
  refreshWindowsNotificationButtonUi();
}

async function enableWindowsNotificationSystem() {
  if (!supportsWindowsSystemNotifications()) {
    await syncWindowsNotificationStateFromEnvironmentAsync();
    return { enabled: false, permission: "unsupported" };
  }
  if (hasAndroidNotificationBridge()) {
    await syncWindowsNotificationStateFromEnvironmentAsync();
  }
  let permission = getCurrentNotificationPermission();
  if (permission === "default") {
    permission = await requestWindowsNotificationPermission();
  }

  state.windowsNotifications.supported = true;
  state.windowsNotifications.permission = permission;
  if (permission === "granted") {
    state.windowsNotifications.enabled = true;
    writeWindowsNotificationPreference(true);
  } else {
    state.windowsNotifications.enabled = false;
  }
  refreshWindowsNotificationButtonUi();
  return { enabled: state.windowsNotifications.enabled, permission };
}

async function toggleWindowsNotificationSystemFromButton() {
  await syncWindowsNotificationStateFromEnvironmentAsync();
  const platformLabel = getNotificationPlatformLabel();
  if (!state.windowsNotifications.supported) {
    setTopMessage(`Notifications ${platformLabel} indisponibles sur cette plateforme.`, 2200);
    return;
  }
  if (state.windowsNotifications.enabled) {
    disableWindowsNotificationSystem();
    setTopMessage(`Notifications ${platformLabel} desactivees.`, 1700);
    return;
  }

  const result = await enableWindowsNotificationSystem();
  if (result.enabled) {
    setTopMessage(`Notifications ${platformLabel} activees.`, 1800);
    return;
  }
  if (result.permission === "denied") {
    if (platformLabel === "Android") {
      setTopMessage("Notifications bloquees. Autorise-les dans les reglages Android.", 2800);
    } else {
      setTopMessage("Notifications bloquees. Autorise-les dans le navigateur.", 2600);
    }
    return;
  }
  setTopMessage("Permission de notification non accordee.", 1800);
}

function allocateAndroidNotificationId(tagRaw = "") {
  const tag = String(tagRaw || "").trim();
  if (tag) {
    const existing = androidNotificationIdByTag.get(tag);
    if (Number.isInteger(existing) && existing > 0) {
      return existing;
    }
  }
  const id = nextAndroidNotificationId;
  nextAndroidNotificationId = nextAndroidNotificationId >= 2147483000 ? 10000 : nextAndroidNotificationId + 1;
  if (tag) {
    androidNotificationIdByTag.set(tag, id);
  }
  return id;
}

function sendWindowsSystemNotification(title, body, options = {}) {
  if (!supportsWindowsSystemNotifications()) {
    return false;
  }
  const currentPermission = getCurrentNotificationPermission();
  if (currentPermission !== state.windowsNotifications.permission && !hasAndroidNotificationBridge()) {
    syncWindowsNotificationStateFromEnvironment();
  }
  if (!state.windowsNotifications.enabled || state.windowsNotifications.permission !== "granted") {
    return false;
  }
  if (isGamePageVisibleAndFocused()) {
    return false;
  }
  const safeTitle = normalizeUiDisplayText(title || "", { frenchTypography: true }).trim();
  if (!safeTitle) {
    return false;
  }
  const safeBody = normalizeUiDisplayText(body || "", { frenchTypography: true }).trim();
  const autoCloseMs = Math.max(0, toSafeInt(options.autoCloseMs, 9000));
  if (hasDesktopNotificationBridge()) {
    const bridge = getDesktopBridge();
    try {
      void bridge.notify({
        title: safeTitle,
        body: safeBody,
        silent: Boolean(options.silent),
        tag: options.tag ? String(options.tag) : undefined,
      });
      return true;
    } catch {
      return false;
    }
  }
  if (hasAndroidNotificationBridge()) {
    const plugin = getAndroidNotificationPlugin();
    if (!plugin) {
      return false;
    }
    const tag = options.tag ? String(options.tag) : "";
    const notificationId = allocateAndroidNotificationId(tag);
    try {
      void plugin.schedule({
        notifications: [
          {
            id: notificationId,
            title: safeTitle,
            body: safeBody,
            schedule: {
              at: new Date(Date.now() + 80),
            },
            extra: tag ? { tag } : undefined,
          },
        ],
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
  try {
    const notification = new Notification(safeTitle, {
      body: safeBody,
      tag: options.tag ? String(options.tag) : undefined,
      renotify: Boolean(options.renotify),
      requireInteraction: Boolean(options.requireInteraction),
    });
    if (autoCloseMs > 0) {
      window.setTimeout(() => {
        try {
          notification.close();
        } catch {}
      }, autoCloseMs);
    }
    return true;
  } catch {
    return false;
  }
}
function isGamePageVisibleAndFocused() {
  if (typeof document === "undefined") {
    return false;
  }
  const visibilityStateRaw = typeof document.visibilityState === "string" ? document.visibilityState : "";
  const visibilityState = visibilityStateRaw.toLowerCase().trim();
  const isVisible = visibilityState ? visibilityState === "visible" : !document.hidden;
  const hasWindowFocus = typeof document.hasFocus === "function" ? Boolean(document.hasFocus()) : true;
  return isVisible && hasWindowFocus;
}

function syncWindowsPokeballInventoryTracking(total, options = {}) {
  const nextTotal = Math.max(0, toSafeInt(total, 0));
  const previousRaw = state.windowsNotifications?.lastKnownPokeballTotal;
  const previousTotal = previousRaw == null ? null : Math.max(0, toSafeInt(previousRaw, 0));
  state.windowsNotifications.lastKnownPokeballTotal = nextTotal;
  if (options.silent || previousTotal == null) {
    return;
  }
  if (previousTotal > 0 && nextTotal <= 0) {
    notifyWindowsOutOfPokeballs(options);
  }
}

function notifyWindowsOutOfPokeballs(options = {}) {
  if (state.simulationIdleMode) {
    return;
  }
  const routeId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = getRouteDisplayName(routeId);
  const lastBallLabel = options.ballType ? getBallTypeLabel(options.ballType) : "Poke Ball";
  const bodyParts = [`Ta dernière ${lastBallLabel} vient d'être utilisée.`];
  if (routeName) {
    bodyParts.push(`Zone: ${routeName}.`);
  }
  bodyParts.push("Passe au Shop pour refaire le stock.");
  sendWindowsSystemNotification("Plus de Poke Balls", bodyParts.join(" "), {
    tag: "pokeballs-empty",
    renotify: true,
    requireInteraction: true,
    autoCloseMs: 0,
  });
}

function notifyWindowsShinyEncounter(enemy) {
  if (!enemy || !enemy.isShiny || state.simulationIdleMode) {
    return;
  }
  const routeId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = getRouteDisplayName(routeId);
  const level = Math.max(1, toSafeInt(enemy.level, 1));
  const enemyName = enemy.nameFr || getPokemonDisplayNameById(enemy.id);
  sendWindowsSystemNotification("Rencontre shiny", `${enemyName} shiny sauvage aperçu (${routeName}, niv ${level}).`, {
    tag: `shiny-encounter-${enemy.id}-${Date.now()}`,
    autoCloseMs: 12000,
  });
}

function notifyWindowsShinyCapture(enemy, options = {}) {
  if (!enemy || !enemy.isShiny || state.simulationIdleMode) {
    return;
  }
  const enemyName = enemy.nameFr || getPokemonDisplayNameById(enemy.id);
  const criticalSuffix = options.isCritical ? " (capture critique)" : "";
  sendWindowsSystemNotification("Shiny capturé", `${enemyName} shiny capturé${criticalSuffix} !`, {
    tag: `shiny-capture-${enemy.id}-${Date.now()}`,
    requireInteraction: true,
    autoCloseMs: 0,
  });
}

function isEvolutionReadySystemNotificationEnabled() {
  return true;
}

function notifyWindowsEvolutionReady(candidate = {}) {
  if (state.simulationIdleMode || !isEvolutionReadySystemNotificationEnabled()) {
    return false;
  }
  const fromId = Number(candidate.fromId || 0);
  const toId = Number(candidate.toId || 0);
  if (fromId <= 0 || toId <= 0) {
    return false;
  }
  const fromName = candidate.fromNameFr || getPokemonDisplayNameById(fromId);
  const toName = candidate.toNameFr || getPokemonDisplayNameById(toId);
  const body = `${fromName} peut evoluer en ${toName}. Rouvre le jeu pour lancer l'evolution.`;
  return sendWindowsSystemNotification("Evolution prete", body, {
    tag: `evolution-ready-${fromId}-${toId}`,
    renotify: true,
    requireInteraction: true,
    autoCloseMs: 0,
  });
}

function resetNotificationSystem() {
  state.notifications.items = [];
  state.notifications.nextId = 1;
  state.notifications.dirty = true;
  state.notifications.nextEvolutionScanMs = state.timeMs + 500;
  for (const card of notificationCardById.values()) {
    stopUiElementTweens(card);
    card.remove();
  }
  notificationCardById.clear();
  notificationCardExitingIds.clear();
  if (notificationStackEl) {
    notificationStackEl.innerHTML = "";
  }
  renderNotificationStackUi();
}

function nextNotificationId() {
  const nextId = Math.max(1, toSafeInt(state.notifications.nextId, 1));
  state.notifications.nextId = nextId + 1;
  return nextId;
}

function shouldUseCompactNotificationStack() {
  const viewportWidth = Math.max(0, Number(window.innerWidth || state.viewport?.width || 0));
  return isCoarsePointerDevice() || viewportWidth <= 760;
}

function getVisibleNotificationItems(items) {
  const sorted = Array.isArray(items)
    ? items.slice().sort((a, b) => {
      const aTime = Number(a?.createdAt || 0);
      const bTime = Number(b?.createdAt || 0);
      return aTime - bTime;
    })
    : [];
  if (!shouldUseCompactNotificationStack()) {
    return sorted;
  }

  const temporaryItems = sorted.filter((item) => item?.type === "temporary");
  const evolutionItems = sorted.filter((item) => item?.type === "evolution_ready");
  const visible = [];

  if (temporaryItems.length > 0) {
    visible.push(temporaryItems[temporaryItems.length - 1]);
  }
  if (evolutionItems.length > 0) {
    visible.push(evolutionItems[evolutionItems.length - 1]);
  }
  if (evolutionItems.length > 1) {
    const extraCount = evolutionItems.length - 1;
    visible.push({
      id: "evolution-summary",
      type: "evolution_summary",
      tone: "evolution",
      title: "Autres evolutions",
      message: `${extraCount} autre${extraCount > 1 ? "s" : ""} evolution${extraCount > 1 ? "s" : ""} disponible${extraCount > 1 ? "s" : ""}.`,
      createdAt: Number(evolutionItems[evolutionItems.length - 1]?.createdAt || 0) + 0.01,
    });
  }

  return visible.sort((a, b) => {
    const aTime = Number(a?.createdAt || 0);
    const bTime = Number(b?.createdAt || 0);
    return aTime - bTime;
  });
}

function getNotificationPokemonId(item) {
  const directId = Number(item?.pokemonId || 0);
  if (directId > 0) {
    return directId;
  }
  const fallbackId = Number(item?.fromId || 0);
  return fallbackId > 0 ? fallbackId : 0;
}

function getNotificationPokemonSpritePath(item) {
  const pokemonId = getNotificationPokemonId(item);
  if (pokemonId <= 0) {
    return "";
  }
  const forceUltraShiny = Boolean(item?.pokemonIsUltraShiny);
  const forceShiny = forceUltraShiny || Boolean(item?.pokemonIsShiny);
  const appearance = resolveSpriteAppearanceForEntity(pokemonId, {
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
    forceShiny,
    forceUltraShiny,
    shinyVisual: forceShiny,
    ultraShinyVisual: forceUltraShiny,
  });
  const def = state.pokemonDefsById.get(pokemonId);
  const fallbackShinyPath = forceShiny ? getVariantShinySpritePath(def, appearance?.variant) : "";
  const fallbackNormalPath = appearance?.variant?.frontPath || def?.spritePath || "";
  return String(appearance?.spritePath || fallbackShinyPath || fallbackNormalPath || "").trim();
}

function animateNotificationCardEnter(card) {
  if (!card) {
    return;
  }
  stopUiElementTweens(card);
  card.style.pointerEvents = "auto";
  animateUiElement(
    card,
    { opacity: 0, y: 18, scale: 0.94, blur: 2.2 },
    { opacity: 1, y: 0, scale: 1, blur: 0 },
    260,
    Easing.Back.Out,
    () => {
      clearUiTweenStyles(card);
    },
  );
}

function animateNotificationCardExit(card, notificationKey) {
  if (!card) {
    return;
  }
  stopUiElementTweens(card);
  card.style.pointerEvents = "none";
  animateUiElement(
    card,
    { opacity: 1, y: 0, scale: 1, blur: 0 },
    { opacity: 0, y: 14, scale: 0.965, blur: 1.3 },
    180,
    Easing.Quadratic.Out,
    () => {
      clearUiTweenStyles(card);
      card.remove();
      notificationCardById.delete(notificationKey);
      notificationCardExitingIds.delete(notificationKey);
    },
  );
}

function renderNotificationCard(card, item) {
  card.className = "game-notif";
  if (item.tone === "first") {
    card.classList.add("notif-first");
  } else if (item.tone === "shiny") {
    card.classList.add("notif-shiny");
  } else if (item.type === "evolution_ready" || item.type === "evolution_summary") {
    card.classList.add("notif-evolution");
  }

  card.innerHTML = "";
  const bodyEl = document.createElement("div");
  bodyEl.className = "game-notif-body";
  const pokemonId = getNotificationPokemonId(item);
  const spritePath = getNotificationPokemonSpritePath(item);
  if (spritePath) {
    const spriteWrapEl = document.createElement("div");
    spriteWrapEl.className = "game-notif-sprite-wrap";
    const spriteImgEl = document.createElement("img");
    spriteImgEl.className = "game-notif-sprite";
    spriteImgEl.src = spritePath;
    spriteImgEl.alt = pokemonId > 0 ? getPokemonDisplayNameById(pokemonId) : "Pokemon";
    spriteWrapEl.appendChild(spriteImgEl);
    bodyEl.appendChild(spriteWrapEl);
  }

  const contentEl = document.createElement("div");
  contentEl.className = "game-notif-content";
  if (item.title) {
    const titleEl = document.createElement("div");
    titleEl.className = "game-notif-title";
    titleEl.textContent = item.title;
    contentEl.appendChild(titleEl);
  }

  const textEl = document.createElement("div");
  textEl.className = "game-notif-text";
  textEl.textContent = item.message || "";
  contentEl.appendChild(textEl);
  bodyEl.appendChild(contentEl);
  card.appendChild(bodyEl);

  if (item.type === "evolution_ready") {
    const actions = document.createElement("div");
    actions.className = "game-notif-actions";

    const evolveButton = document.createElement("button");
    evolveButton.type = "button";
    evolveButton.className = "game-notif-btn";
    evolveButton.textContent = "Evoluer";
    evolveButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      triggerEvolutionFromNotification(item.id);
    });
    actions.appendChild(evolveButton);
    card.appendChild(actions);
  }
}

function renderNotificationStackUi() {
  if (!notificationStackEl) {
    return;
  }
  const items = Array.isArray(state.notifications.items) ? state.notifications.items : [];
  const sorted = getVisibleNotificationItems(items);
  const visibleKeys = new Set();
  for (const item of sorted) {
    const key = String(item?.id ?? "");
    if (!key) {
      continue;
    }
    visibleKeys.add(key);
    notificationCardExitingIds.delete(key);
    let card = notificationCardById.get(key);
    const isNewCard = !card;
    if (!card) {
      card = document.createElement("article");
      notificationCardById.set(key, card);
    }
    renderNotificationCard(card, item);
    notificationStackEl.appendChild(card);
    if (isNewCard) {
      animateNotificationCardEnter(card);
    } else {
      card.style.pointerEvents = "auto";
    }
  }

  for (const [key, card] of notificationCardById.entries()) {
    if (visibleKeys.has(key) || notificationCardExitingIds.has(key)) {
      continue;
    }
    notificationCardExitingIds.add(key);
    animateNotificationCardExit(card, key);
  }
}

function pushTemporaryNotification(message, durationMs = 2600, options = {}) {
  return runtimeNotificationSystem.pushTemporaryNotification(message, durationMs, options);
}

function buildEvolutionNotificationKey(fromId, toId) {
  return `evo:${Number(fromId || 0)}->${Number(toId || 0)}`;
}

function hasEvolutionNotification(fromId, toId) {
  const key = buildEvolutionNotificationKey(fromId, toId);
  return state.notifications.items.some((item) => item?.type === "evolution_ready" && item.key === key);
}

function enqueueEvolutionReadyNotification(candidate) {
  const fromId = Number(candidate?.fromId || 0);
  const toId = Number(candidate?.toId || 0);
  if (fromId <= 0 || toId <= 0) {
    return null;
  }
  if (isPokemonEntityUnlockedById(toId)) {
    return null;
  }
  if (hasEvolutionNotification(fromId, toId)) {
    return null;
  }

  const fromName = candidate?.fromNameFr || getPokemonDisplayNameById(fromId);
  const toName = candidate?.toNameFr || getPokemonDisplayNameById(toId);
  const id = nextNotificationId();
  state.notifications.items.push({
    id,
    type: "evolution_ready",
    tone: "evolution",
    key: buildEvolutionNotificationKey(fromId, toId),
    title: "Evolution prete",
    message: `${fromName} peut evoluer en ${toName}.`,
    fromId,
    toId,
    pokemonId: fromId,
    createdAt: state.timeMs,
  });
  queueEvolutionTutorialIfNeeded();
  state.notifications.dirty = true;
  renderNotificationStackUi();
  notifyWindowsEvolutionReady({
    fromId,
    toId,
    fromNameFr: fromName,
    toNameFr: toName,
  });
  return id;
}

function removeNotificationById(notificationId) {
  const id = toSafeInt(notificationId, 0);
  if (id <= 0) {
    return false;
  }
  const before = state.notifications.items.length;
  state.notifications.items = state.notifications.items.filter((item) => toSafeInt(item?.id, 0) !== id);
  if (state.notifications.items.length === before) {
    return false;
  }
  state.notifications.dirty = true;
  renderNotificationStackUi();
  return true;
}

function isEvolutionNotificationStillValid(item) {
  if (item?.type !== "evolution_ready") {
    return true;
  }
  const fromId = Number(item.fromId || 0);
  const toId = Number(item.toId || 0);
  if (fromId <= 0 || toId <= 0) {
    return false;
  }
  if (isPokemonEntityUnlockedById(toId)) {
    return false;
  }
  const record = getPokemonEntityRecord(fromId);
  if (!record || !isEntityUnlocked(record)) {
    return false;
  }
  const candidate = findNextEligibleEvolution(record);
  return Boolean(candidate && Number(candidate.toId) === toId);
}

function scanForEvolutionReadyNotifications() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return;
  }
  for (const [rawId, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    const candidate = findNextEligibleEvolution(record);
    if (!candidate) {
      continue;
    }
    enqueueEvolutionReadyNotification({
      fromId: candidate.fromId,
      toId: candidate.toId,
      fromNameFr: candidate.fromDef?.nameFr || getPokemonDisplayNameById(candidate.fromId),
      toNameFr: candidate.toDef?.nameFr || getPokemonDisplayNameById(candidate.toId),
    });
  }
}

function triggerEvolutionFromNotification(notificationId) {
  const id = toSafeInt(notificationId, 0);
  if (id <= 0) {
    return false;
  }
  const item = state.notifications.items.find((entry) => toSafeInt(entry?.id, 0) === id);
  if (!item || item.type !== "evolution_ready") {
    return false;
  }

  const fromId = Number(item.fromId || 0);
  const toId = Number(item.toId || 0);
  const fromRecord = getPokemonEntityRecord(fromId);
  if (!fromRecord || !isEntityUnlocked(fromRecord) || isPokemonEntityUnlockedById(toId)) {
    removeNotificationById(id);
    return false;
  }
  const candidate = findNextEligibleEvolution(fromRecord);
  if (!candidate || Number(candidate.toId) !== toId) {
    removeNotificationById(id);
    return false;
  }

  const preferredSlotIndex = Array.isArray(state.saveData?.team)
    ? state.saveData.team.findIndex((entryId) => Number(entryId) === fromId)
    : -1;
  const evolutionResult = applyEvolutionUnlockAndTeamPlacement(fromId, toId, preferredSlotIndex);
  if (!evolutionResult) {
    removeNotificationById(id);
    pushTemporaryNotification("Évolution impossible pour ce Pokémon.", 1800, {
      tone: "info",
      title: "Evolution",
      pokemonId: fromId,
    });
    return false;
  }

  queueEvolutionAnimationForResult(evolutionResult);
  addCoins(COIN_REWARD_PER_EVOLUTION);
  removeNotificationById(id);
  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();
  render();
  pushTemporaryNotification(`${evolutionResult.fromNameFr} évolue en ${evolutionResult.toNameFr} !`, 2200, {
    tone: "first",
    title: "Evolution",
    pokemonId: Number(evolutionResult.toId || toId || 0),
  });
  return true;
}

function updateNotificationSystem() {
  const beforeCount = state.notifications.items.length;
  const now = state.timeMs;
  state.notifications.items = state.notifications.items.filter((item) => {
    if (!item) {
      return false;
    }
    if (item.type === "temporary") {
      return Number(item.expiresAt || 0) > now;
    }
    return isEvolutionNotificationStillValid(item);
  });

  if (state.notifications.items.length !== beforeCount) {
    state.notifications.dirty = true;
  }

  if (state.mode === "ready" && now >= Math.max(0, Number(state.notifications.nextEvolutionScanMs) || 0)) {
    state.notifications.nextEvolutionScanMs = now + 1200;
    scanForEvolutionReadyNotifications();
  }

  if (state.notifications.dirty) {
    state.notifications.dirty = false;
    renderNotificationStackUi();
  }
}

function notifyFirstTimeSpeciesProgress(pokemonId, kind, isShiny, previousValue, nextValue) {
  if (state.mode !== "ready" || state.simulationIdleMode) {
    return;
  }
  if (nextValue <= 0 || previousValue > 0) {
    return;
  }
  const category = String(kind || "").toLowerCase();
  if (category !== "encountered" && category !== "captured") {
    return;
  }

  const pokemonName = getPokemonDisplayNameById(pokemonId);
  if (category === "encountered") {
    if (isShiny) {
      return;
    }
    pushTemporaryNotification(`${pokemonName} apparaît pour la première fois.`, 3000, {
      title: "Apparition",
      tone: "first",
      pokemonId,
    });
    return;
  }

  if (isShiny) {
    pushTemporaryNotification(`${pokemonName} capturé pour la première fois en shiny.`, 4400, {
      title: "Premiere capture shiny",
      tone: "shiny",
      pokemonId,
      pokemonIsShiny: true,
    });
    return;
  }

  pushTemporaryNotification(`${pokemonName} capturé pour la première fois.`, 3200, {
    title: "Premiere capture",
    tone: "first",
    pokemonId,
  });
}

function notifyShinyEncounterUntilCaptured(enemy, speciesRecord = null) {
  if (!enemy || !enemy.isShiny || state.mode !== "ready" || state.simulationIdleMode) {
    return;
  }
  const record = speciesRecord || ensureSpeciesStats(enemy.id);
  const shinyCaptures = Math.max(0, toSafeInt(record?.captured_shiny, 0));
  if (shinyCaptures > 0) {
    return;
  }
  pushTemporaryNotification(`Un ${enemy.nameFr} shiny sauvage apparaît !`, 4200, {
    title: "Shiny sauvage",
    tone: "shiny",
    pokemonId: Number(enemy.id || 0),
    pokemonIsShiny: true,
    pokemonIsUltraShiny: Boolean(enemy.isUltraShiny),
  });
}

const {
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
} = createEnvironmentRuntime({
  clamp,
  toSafeInt,
  state,
  defaultRouteId: DEFAULT_ROUTE_ID,
  backgroundDriftTravelMinMs: BACKGROUND_DRIFT_TRAVEL_MIN_MS,
  backgroundDriftTravelMaxMs: BACKGROUND_DRIFT_TRAVEL_MAX_MS,
  backgroundDriftHoldMinMs: BACKGROUND_DRIFT_HOLD_MIN_MS,
  backgroundDriftHoldMaxMs: BACKGROUND_DRIFT_HOLD_MAX_MS,
  localDayStartHour: LOCAL_DAY_START_HOUR,
  localNightStartHour: LOCAL_NIGHT_START_HOUR,
  environmentUpdateIntervalMs: ENVIRONMENT_UPDATE_INTERVAL_MS,
  randomRange,
  easeInOutSine,
  padTwoDigits,
  getRenderQualitySettings,
});

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

const {
  weightedPick,
  normalizeStatsPayload,
  getBaseStatTotal,
  getLevelProgressionMultiplier,
  computeStatsAtLevel,
  computeBattleHpMax,
  getPokemonBaseStats,
  getSpeciesGrowthFactor,
  getXpToNextLevelForSpecies,
  createEmptySpeciesStats,
  normalizeSpeciesCounters,
} = createPokemonCoreUtils({
  clamp,
  toSafeInt,
  state,
  statKeys: STAT_KEYS,
  maxLevel: MAX_LEVEL,
  levelProgressionLinearPerStep: LEVEL_PROGRESSION_LINEAR_PER_STEP,
  levelProgressionCurveExponent: LEVEL_PROGRESSION_CURVE_EXPONENT,
  levelProgressionCurvePerStep: LEVEL_PROGRESSION_CURVE_PER_STEP,
});

function normalizeSpriteVariantId(rawValue, fallbackValue = "") {
  const value = String(rawValue || fallbackValue || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return value || String(fallbackValue || "").trim().toLowerCase() || "";
}

function isDeprecatedSpriteVariantId(rawVariantId) {
  const variantId = normalizeSpriteVariantId(rawVariantId);
  return Boolean(variantId && DEPRECATED_POKEMON_SPRITE_VARIANT_IDS.has(variantId));
}

function normalizeSpriteVariantIdList(rawList) {
  const output = [];
  const list = Array.isArray(rawList) ? rawList : [];
  for (const entry of list) {
    const id = normalizeSpriteVariantId(entry);
    if (!id || output.includes(id)) {
      continue;
    }
    output.push(id);
  }
  return output;
}

function registerSpriteImageInCache(imagePath, image) {
  if (!imagePath || !image) {
    return;
  }
  pokemonSpriteImageCache.set(imagePath, image);
}

function getCachedSpriteImage(imagePath) {
  if (!imagePath) {
    return null;
  }
  if (pokemonSpriteImageCache.has(imagePath)) {
    return pokemonSpriteImageCache.get(imagePath);
  }
  const image = new Image();
  image.src = imagePath;
  pokemonSpriteImageCache.set(imagePath, image);
  return image;
}

const spriteSourceStableIdOverrides = typeof WeakMap === "function" ? new WeakMap() : null;

function getImageCacheStableId(image) {
  if (!image || typeof image !== "object") {
    return "";
  }
  const overrideId = spriteSourceStableIdOverrides?.get?.(image);
  if (overrideId) {
    return overrideId;
  }
  const src = String(image.currentSrc || image.src || "");
  if (src) {
    return src;
  }
  const dims = getDrawableImageDimensions(image);
  return `img:${String(dims.width || 0)}x${String(dims.height || 0)}`;
}

const animatedSpriteFramesCache = new Map();

function destroyAnimatedSpriteFramesCacheEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return;
  }
  const frames = Array.isArray(entry.frames) ? entry.frames : [];
  for (const frame of frames) {
    const source = frame?.source;
    if (source && typeof source.close === "function") {
      try {
        source.close();
      } catch {
        // ignore
      }
    }
  }
  entry.frames = [];
  entry.frameStartsMs = [];
  entry.totalDurationMs = 0;
  entry.width = 0;
  entry.height = 0;
  entry.opaqueMinX = 0;
  entry.opaqueMinY = 0;
  entry.opaqueWidth = 0;
  entry.opaqueHeight = 0;
}

function trimAnimatedSpriteFramesCacheIfNeeded() {
  const extraCount = animatedSpriteFramesCache.size - ANIMATED_SPRITE_CACHE_MAX_ENTRIES;
  if (extraCount <= 0) {
    return;
  }
  const entries = Array.from(animatedSpriteFramesCache.values());
  entries.sort((a, b) => (Number(a?.lastAccessMs) || 0) - (Number(b?.lastAccessMs) || 0));
  for (let i = 0; i < extraCount; i += 1) {
    const entry = entries[i];
    const key = String(entry?.key || "");
    if (!key || !animatedSpriteFramesCache.has(key)) {
      continue;
    }
    animatedSpriteFramesCache.delete(key);
    destroyAnimatedSpriteFramesCacheEntry(entry);
  }
}

function buildAnimatedSpriteTimeline(frames) {
  const starts = [];
  let total = 0;
  const list = Array.isArray(frames) ? frames : [];
  for (const frame of list) {
    starts.push(total);
    total += Math.max(20, toSafeInt(frame?.durationMs, 100));
  }
  if (total <= 0 && list.length > 0) {
    total = Math.max(20, toSafeInt(list[0]?.durationMs, 100));
  }
  return { starts, totalDurationMs: total };
}

function resolveAnimatedSpriteFrame(entry, timeMs) {
  if (!entry || entry.status !== "ready") {
    return null;
  }
  const frames = Array.isArray(entry.frames) ? entry.frames : [];
  if (frames.length <= 0) {
    return null;
  }
  const total = Math.max(0, Number(entry.totalDurationMs) || 0);
  if (frames.length === 1 || total <= 0.1) {
    return { frame: frames[0] || null, frameIndex: 0 };
  }
  const t = Math.max(0, Number(timeMs) || 0);
  const targetMs = t % total;
  const starts = Array.isArray(entry.frameStartsMs) ? entry.frameStartsMs : [];
  for (let i = 0; i < frames.length; i += 1) {
    const start = Number(starts[i]) || 0;
    const duration = Math.max(20, toSafeInt(frames[i]?.durationMs, 100));
    if (targetMs < start + duration) {
      return { frame: frames[i] || null, frameIndex: i };
    }
  }
  const lastIndex = Math.max(0, frames.length - 1);
  return { frame: frames[lastIndex] || null, frameIndex: lastIndex };
}

async function createAnimatedFrameSourceFromRgba(rgba, width, height) {
  const w = Math.max(1, toSafeInt(width, 1));
  const h = Math.max(1, toSafeInt(height, 1));
  const data = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba);
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(new ImageData(data, w, h));
      return bitmap;
    }
  } catch {
    // ignore
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const frameCtx = canvas.getContext("2d");
  if (!frameCtx) {
    return null;
  }
  frameCtx.putImageData(new ImageData(data, w, h), 0, 0);
  return canvas;
}

function clearRgbaRect(buffer, canvasWidth, canvasHeight, rect) {
  if (!buffer || !Number.isFinite(canvasWidth) || !Number.isFinite(canvasHeight) || !rect) {
    return;
  }
  const x = clamp(toSafeInt(rect.x, 0), 0, Math.max(0, canvasWidth - 1));
  const y = clamp(toSafeInt(rect.y, 0), 0, Math.max(0, canvasHeight - 1));
  const w = clamp(toSafeInt(rect.width, 0), 0, Math.max(0, canvasWidth - x));
  const h = clamp(toSafeInt(rect.height, 0), 0, Math.max(0, canvasHeight - y));
  if (w <= 0 || h <= 0) {
    return;
  }
  for (let row = 0; row < h; row += 1) {
    const start = ((y + row) * canvasWidth + x) * 4;
    buffer.fill(0, start, start + w * 4);
  }
}

function normalizeGifFrameDelayMs(delayHundredths) {
  const raw = Math.max(0, toSafeInt(delayHundredths, 0));
  const ms = raw > 0 ? raw * 10 : 100;
  return clamp(Math.round(ms), 20, 2000);
}

async function decodeGifToAnimatedFrames(arrayBuffer, stableKey) {
  const GifReader = globalThis.GifReader;
  if (typeof GifReader !== "function") {
    throw new Error("GifReader indisponible (vendor/omggif.js).");
  }
  const reader = new GifReader(new Uint8Array(arrayBuffer));
  const width = Math.max(1, toSafeInt(reader.width, 1));
  const height = Math.max(1, toSafeInt(reader.height, 1));
  const frameCount = Math.max(1, toSafeInt(reader.numFrames(), 1));

  const working = new Uint8ClampedArray(width * height * 4);
  const frames = [];
  let maxOpaqueWidth = 0;
  let maxOpaqueHeight = 0;
  let previousFrameInfo = null;
  let previousRestore = null;

  for (let i = 0; i < frameCount; i += 1) {
    if (previousFrameInfo) {
      const previousDisposal = toSafeInt(previousFrameInfo.disposal, 0);
      if (previousDisposal === 2) {
        clearRgbaRect(working, width, height, previousFrameInfo);
      } else if (previousDisposal === 3 && previousRestore) {
        working.set(previousRestore);
      }
    }

    const frameInfo = reader.frameInfo(i);
    const restore = toSafeInt(frameInfo?.disposal, 0) === 3 ? working.slice() : null;
    reader.decodeAndBlitFrameRGBA(i, working);

    const delayMs = normalizeGifFrameDelayMs(frameInfo?.delay);
    const rgbaCopy = working.slice();
    const opaqueBounds = computeOpaqueBoundsFromRgba(rgbaCopy, width, height);
    maxOpaqueWidth = Math.max(maxOpaqueWidth, toSafeInt(opaqueBounds.opaqueWidth, width));
    maxOpaqueHeight = Math.max(maxOpaqueHeight, toSafeInt(opaqueBounds.opaqueHeight, height));
    const source = await createAnimatedFrameSourceFromRgba(rgbaCopy, width, height);
    if (!source) {
      previousFrameInfo = frameInfo;
      previousRestore = restore;
      continue;
    }
    spriteSourceStableIdOverrides?.set?.(source, `${stableKey}#frame${i}`);
    frames.push({
      source,
      durationMs: delayMs,
      opaqueMinX: Math.max(0, toSafeInt(opaqueBounds.opaqueMinX, 0)),
      opaqueMinY: Math.max(0, toSafeInt(opaqueBounds.opaqueMinY, 0)),
      opaqueWidth: Math.max(1, toSafeInt(opaqueBounds.opaqueWidth, width)),
      opaqueHeight: Math.max(1, toSafeInt(opaqueBounds.opaqueHeight, height)),
    });

    previousFrameInfo = frameInfo;
    previousRestore = restore;
  }

  return {
    width,
    height,
    frames,
    opaqueWidth: Math.max(1, maxOpaqueWidth || width),
    opaqueHeight: Math.max(1, maxOpaqueHeight || height),
  };
}

async function decodeApngToAnimatedFrames(arrayBuffer, stableKey) {
  const UPNG = globalThis.UPNG;
  if (!UPNG || typeof UPNG.decode !== "function" || typeof UPNG.toRGBA8 !== "function") {
    throw new Error("UPNG indisponible (vendor/upng.js).");
  }
  const decoded = UPNG.decode(new Uint8Array(arrayBuffer));
  const width = Math.max(1, toSafeInt(decoded?.width, 1));
  const height = Math.max(1, toSafeInt(decoded?.height, 1));
  const rgbaBuffers = Array.isArray(UPNG.toRGBA8(decoded)) ? UPNG.toRGBA8(decoded) : [];

  const frames = [];
  let maxOpaqueWidth = 0;
  let maxOpaqueHeight = 0;
  for (let i = 0; i < rgbaBuffers.length; i += 1) {
    const rgba = new Uint8ClampedArray(rgbaBuffers[i]);
    const delayMs = clamp(toSafeInt(decoded?.frames?.[i]?.delay, 100), 20, 2000);
    const opaqueBounds = computeOpaqueBoundsFromRgba(rgba, width, height);
    maxOpaqueWidth = Math.max(maxOpaqueWidth, toSafeInt(opaqueBounds.opaqueWidth, width));
    maxOpaqueHeight = Math.max(maxOpaqueHeight, toSafeInt(opaqueBounds.opaqueHeight, height));
    const source = await createAnimatedFrameSourceFromRgba(rgba, width, height);
    if (!source) {
      continue;
    }
    spriteSourceStableIdOverrides?.set?.(source, `${stableKey}#frame${i}`);
    frames.push({
      source,
      durationMs: delayMs,
      opaqueMinX: Math.max(0, toSafeInt(opaqueBounds.opaqueMinX, 0)),
      opaqueMinY: Math.max(0, toSafeInt(opaqueBounds.opaqueMinY, 0)),
      opaqueWidth: Math.max(1, toSafeInt(opaqueBounds.opaqueWidth, width)),
      opaqueHeight: Math.max(1, toSafeInt(opaqueBounds.opaqueHeight, height)),
    });
  }

  if (frames.length <= 0) {
    const single = rgbaBuffers.length > 0 ? new Uint8ClampedArray(rgbaBuffers[0]) : new Uint8ClampedArray(width * height * 4);
    const opaqueBounds = computeOpaqueBoundsFromRgba(single, width, height);
    const source = await createAnimatedFrameSourceFromRgba(single, width, height);
    if (source) {
      spriteSourceStableIdOverrides?.set?.(source, `${stableKey}#frame0`);
      frames.push({
        source,
        durationMs: 100,
        opaqueMinX: Math.max(0, toSafeInt(opaqueBounds.opaqueMinX, 0)),
        opaqueMinY: Math.max(0, toSafeInt(opaqueBounds.opaqueMinY, 0)),
        opaqueWidth: Math.max(1, toSafeInt(opaqueBounds.opaqueWidth, width)),
        opaqueHeight: Math.max(1, toSafeInt(opaqueBounds.opaqueHeight, height)),
      });
    }
  }

  return {
    width,
    height,
    frames,
    opaqueWidth: Math.max(1, maxOpaqueWidth || width),
    opaqueHeight: Math.max(1, maxOpaqueHeight || height),
  };
}

async function loadAnimatedSpriteFrames(spritePath) {
  const response = await fetch(spritePath);
  if (!response.ok) {
    throw new Error(`Impossible de telecharger ${spritePath} (${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const cleanPath = String(spritePath).split("#")[0].split("?")[0].toLowerCase();
  if (cleanPath.endsWith(".gif")) {
    return decodeGifToAnimatedFrames(arrayBuffer, spritePath);
  }
  if (cleanPath.endsWith(".png")) {
    return decodeApngToAnimatedFrames(arrayBuffer, spritePath);
  }
  throw new Error(`Format de sprite anime non supporte: ${spritePath}`);
}

function ensureAnimatedSpriteFramesEntry(spritePath) {
  const key = String(spritePath || "");
  if (!key) {
    return null;
  }
  if (animatedSpriteFramesCache.has(key)) {
    const entry = animatedSpriteFramesCache.get(key);
    if (entry) {
      entry.lastAccessMs = performance.now();
    }
    return entry || null;
  }
  const entry = {
    key,
    status: "loading",
    frames: [],
    frameStartsMs: [],
    totalDurationMs: 0,
    width: 0,
    height: 0,
    opaqueMinX: 0,
    opaqueMinY: 0,
    opaqueWidth: 0,
    opaqueHeight: 0,
    lastAccessMs: performance.now(),
    error: "",
    loadPromise: null,
  };
  entry.loadPromise = loadAnimatedSpriteFrames(key)
    .then((result) => {
      entry.width = Math.max(1, toSafeInt(result?.width, 1));
      entry.height = Math.max(1, toSafeInt(result?.height, 1));
      entry.opaqueMinX = Math.max(0, toSafeInt(result?.opaqueMinX, 0));
      entry.opaqueMinY = Math.max(0, toSafeInt(result?.opaqueMinY, 0));
      entry.opaqueWidth = Math.max(1, toSafeInt(result?.opaqueWidth, entry.width));
      entry.opaqueHeight = Math.max(1, toSafeInt(result?.opaqueHeight, entry.height));
      entry.frames = Array.isArray(result?.frames) ? result.frames : [];
      const timeline = buildAnimatedSpriteTimeline(entry.frames);
      entry.frameStartsMs = timeline.starts;
      entry.totalDurationMs = timeline.totalDurationMs;
      entry.status = entry.frames.length > 0 ? "ready" : "error";
      if (entry.status !== "ready") {
        entry.error = "Aucune frame decodee";
      }
    })
    .catch((error) => {
      entry.status = "error";
      entry.error = error instanceof Error ? error.message : String(error || "");
    });
  animatedSpriteFramesCache.set(key, entry);
  trimAnimatedSpriteFramesCacheIfNeeded();
  return entry;
}

function resolveAnimatedSpriteFrameSource(spritePath, timeMs) {
  const entry = ensureAnimatedSpriteFramesEntry(spritePath);
  if (!entry) {
    return null;
  }
  if (entry.status !== "ready") {
    return null;
  }
  entry.lastAccessMs = performance.now();
  const resolved = resolveAnimatedSpriteFrame(entry, timeMs);
  const frame = resolved?.frame;
  if (!frame?.source) {
    return null;
  }
  return {
    source: frame.source,
    frameIndex: toSafeInt(resolved.frameIndex, -1),
    width: Math.max(1, toSafeInt(entry.width, 1)),
    height: Math.max(1, toSafeInt(entry.height, 1)),
    opaqueMinX: Math.max(0, toSafeInt(frame.opaqueMinX, 0)),
    opaqueMinY: Math.max(0, toSafeInt(frame.opaqueMinY, 0)),
    opaqueWidth: Math.max(1, toSafeInt(frame.opaqueWidth, entry.width || 1)),
    opaqueHeight: Math.max(1, toSafeInt(frame.opaqueHeight, entry.height || 1)),
    maxOpaqueWidth: Math.max(1, toSafeInt(entry.opaqueWidth, entry.width || 1)),
    maxOpaqueHeight: Math.max(1, toSafeInt(entry.opaqueHeight, entry.height || 1)),
  };
}

function resolveEntitySpriteDrawSource(entity, timeMs = state.timeMs) {
  const base = entity?.spriteImage || null;
  const baseDims = getDrawableImageDimensions(base);
  const baseOpaqueBounds = isDrawableImage(base)
    ? getOpaqueBoundsForDrawableImage(base)
    : { opaqueMinX: 0, opaqueMinY: 0, opaqueWidth: 0, opaqueHeight: 0 };
  const fallback = {
    source: base,
    frameIndex: -1,
    width: Math.max(0, toSafeInt(baseDims.width, 0)),
    height: Math.max(0, toSafeInt(baseDims.height, 0)),
    opaqueMinX: Math.max(0, toSafeInt(baseOpaqueBounds.opaqueMinX, 0)),
    opaqueMinY: Math.max(0, toSafeInt(baseOpaqueBounds.opaqueMinY, 0)),
    opaqueWidth: Math.max(0, toSafeInt(baseOpaqueBounds.opaqueWidth, baseDims.width)),
    opaqueHeight: Math.max(0, toSafeInt(baseOpaqueBounds.opaqueHeight, baseDims.height)),
    maxOpaqueWidth: Math.max(0, toSafeInt(baseOpaqueBounds.opaqueWidth, baseDims.width)),
    maxOpaqueHeight: Math.max(0, toSafeInt(baseOpaqueBounds.opaqueHeight, baseDims.height)),
  };
  if (!entity?.spriteAnimated) {
    return fallback;
  }
  const spritePath = String(entity?.spritePath || base?.currentSrc || base?.src || "");
  if (!spritePath) {
    return fallback;
  }
  const resolved = resolveAnimatedSpriteFrameSource(spritePath, timeMs);
  if (resolved?.source) {
    return resolved;
  }
  return fallback;
}

function getPokemonDataSpriteScale(entity) {
  void entity;
  return 1;
}

function getSpriteSourceMaxPixelDimension(source) {
  const maxOpaqueWidth = Math.max(0, toSafeInt(source?.maxOpaqueWidth, 0));
  const maxOpaqueHeight = Math.max(0, toSafeInt(source?.maxOpaqueHeight, 0));
  if (maxOpaqueWidth > 0 || maxOpaqueHeight > 0) {
    return Math.max(maxOpaqueWidth, maxOpaqueHeight);
  }
  const opaqueWidth = Math.max(0, toSafeInt(source?.opaqueWidth, 0));
  const opaqueHeight = Math.max(0, toSafeInt(source?.opaqueHeight, 0));
  if (opaqueWidth > 0 || opaqueHeight > 0) {
    return Math.max(opaqueWidth, opaqueHeight);
  }
  const width = Math.max(0, toSafeInt(source?.width, 0));
  const height = Math.max(0, toSafeInt(source?.height, 0));
  if (width > 0 || height > 0) {
    return Math.max(width, height);
  }
  return Math.max(1, toSafeInt(POKEMON_SPRITE_COMMON_PPU, 64));
}

function getPokemonSpriteCommonPpuMultiplier(source) {
  if (!POKEMON_SPRITE_USE_SOURCE_PPU_ADAPTATION) {
    return 1;
  }
  const sourcePixels = Math.max(1, getSpriteSourceMaxPixelDimension(source));
  const commonPpu = Math.max(1, toSafeInt(POKEMON_SPRITE_COMMON_PPU, 64));
  return sourcePixels / commonPpu;
}

function getPokemonSpriteRenderSize(entity, size, source = null) {
  const baseSize = Math.max(0, Number(size) || 0);
  if (baseSize <= 0) {
    return 0;
  }
  return baseSize * getPokemonSpriteCommonPpuMultiplier(source);
}

function trimUltraShinyOutlineCacheIfNeeded() {
  if (ultraShinyOutlineCache.size <= ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES) {
    return;
  }
  const toDeleteCount = ultraShinyOutlineCache.size - ULTRA_SHINY_OUTLINE_CACHE_MAX_ENTRIES;
  const keys = ultraShinyOutlineCache.keys();
  for (let i = 0; i < toDeleteCount; i += 1) {
    const key = keys.next().value;
    if (typeof key === "undefined") {
      break;
    }
    ultraShinyOutlineCache.delete(key);
  }
}

function getUltraShinyOutlineTexture(image, drawWidth, drawHeight, outlinePx) {
  if (!isDrawableImage(image)) {
    return null;
  }

  const sourceWidth = Math.max(1, Math.round(Number(drawWidth) || 0));
  const sourceHeight = Math.max(1, Math.round(Number(drawHeight) || 0));
  const outline = Math.max(0, Number(outlinePx) || 0);
  if (outline <= 0.001) {
    return null;
  }

  const outlineKey = Math.round(outline * 100) / 100;
  const imageKey = getImageCacheStableId(image);
  const cacheKey = `${imageKey}|${sourceWidth}x${sourceHeight}|${outlineKey}`;
  if (ultraShinyOutlineCache.has(cacheKey)) {
    return ultraShinyOutlineCache.get(cacheKey);
  }

  const whiteSpriteCanvas = document.createElement("canvas");
  whiteSpriteCanvas.width = sourceWidth;
  whiteSpriteCanvas.height = sourceHeight;
  const whiteSpriteCtx = whiteSpriteCanvas.getContext("2d");
  if (!whiteSpriteCtx) {
    return null;
  }
  whiteSpriteCtx.imageSmoothingEnabled = false;
  whiteSpriteCtx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  whiteSpriteCtx.globalCompositeOperation = "source-in";
  whiteSpriteCtx.fillStyle = "rgba(255, 255, 255, 1)";
  whiteSpriteCtx.fillRect(0, 0, sourceWidth, sourceHeight);
  whiteSpriteCtx.globalCompositeOperation = "source-over";

  const pad = Math.max(1, Math.ceil(outline) + 1);
  const textureWidth = sourceWidth + pad * 2;
  const textureHeight = sourceHeight + pad * 2;
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = textureWidth;
  outlineCanvas.height = textureHeight;
  const outlineCtx = outlineCanvas.getContext("2d");
  if (!outlineCtx) {
    return null;
  }
  outlineCtx.imageSmoothingEnabled = false;
  const unitOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-0.707, -0.707],
    [-0.707, 0.707],
    [0.707, -0.707],
    [0.707, 0.707],
  ];
  for (const [dx, dy] of unitOffsets) {
    outlineCtx.drawImage(
      whiteSpriteCanvas,
      Math.round(pad + dx * outline),
      Math.round(pad + dy * outline),
      sourceWidth,
      sourceHeight,
    );
  }

  const texture = {
    canvas: outlineCanvas,
    pad,
  };
  ultraShinyOutlineCache.set(cacheKey, texture);
  trimUltraShinyOutlineCacheIfNeeded();
  return texture;
}

async function ensureSpriteImageLoaded(imagePath) {
  if (!imagePath) {
    return null;
  }
  const cachedImage = pokemonSpriteImageCache.get(imagePath);
  if (isDrawableImage(cachedImage)) {
    return cachedImage;
  }
  const loadedImage = await loadImage(imagePath);
  if (loadedImage) {
    registerSpriteImageInCache(imagePath, loadedImage);
  }
  return loadedImage;
}

function canFallbackToDefaultShinyForVariant(def, variant) {
  if (!def) {
    return false;
  }
  if (!variant) {
    return true;
  }
  const variantId = String(variant.id || "").trim();
  if (!variantId) {
    return true;
  }
  const defaultVariantId = String(getDefaultSpriteVariantId(def) || "").trim();
  if (!defaultVariantId) {
    return true;
  }
  return variantId === defaultVariantId;
}

function getVariantShinySpritePath(def, variant) {
  const variantShinyPath = String(variant?.frontShinyPath || "").trim();
  if (variantShinyPath) {
    return variantShinyPath;
  }
  if (!canFallbackToDefaultShinyForVariant(def, variant)) {
    return "";
  }
  return String(def?.shinySpritePath || "").trim();
}

async function ensureVariantAppearanceAssetsLoaded(def, variant, options = {}) {
  const includeShiny = options.includeShiny === true;
  const paths = [variant?.frontPath || def?.spritePath || ""];
  if (includeShiny) {
    paths.push(getVariantShinySpritePath(def, variant));
  }
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  await Promise.all(uniquePaths.map((imagePath) => ensureSpriteImageLoaded(imagePath)));
}

function isDrawableImage(image) {
  const dims = getDrawableImageDimensions(image);
  return dims.width > 0 && dims.height > 0;
}

function getDrawableImageDimensions(image) {
  if (!image || typeof image !== "object") {
    return { width: 0, height: 0 };
  }
  const naturalWidth = Number(image.naturalWidth);
  const naturalHeight = Number(image.naturalHeight);
  if (
    Number.isFinite(naturalWidth) &&
    naturalWidth > 0 &&
    Number.isFinite(naturalHeight) &&
    naturalHeight > 0
  ) {
    return { width: naturalWidth, height: naturalHeight };
  }
  const width = Number(image.width);
  const height = Number(image.height);
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width, height };
  }
  return { width: 0, height: 0 };
}

function trimSpriteOpaqueBoundsCacheIfNeeded() {
  if (spriteOpaqueBoundsCache.size <= SPRITE_OPAQUE_BOUNDS_CACHE_MAX_ENTRIES) {
    return;
  }
  const extraCount = spriteOpaqueBoundsCache.size - SPRITE_OPAQUE_BOUNDS_CACHE_MAX_ENTRIES;
  const keys = spriteOpaqueBoundsCache.keys();
  for (let i = 0; i < extraCount; i += 1) {
    const key = keys.next().value;
    if (typeof key === "undefined") {
      break;
    }
    spriteOpaqueBoundsCache.delete(key);
  }
}

function computeOpaqueBoundsFromRgba(rgba, width, height) {
  const w = Math.max(1, toSafeInt(width, 1));
  const h = Math.max(1, toSafeInt(height, 1));
  if (!rgba || typeof rgba.length !== "number" || rgba.length < w * h * 4) {
    return { opaqueMinX: 0, opaqueMinY: 0, opaqueWidth: w, opaqueHeight: h };
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  const pixelCount = w * h;
  for (let index = 0; index < pixelCount; index += 1) {
    const alpha = Number(rgba[index * 4 + 3] || 0);
    if (alpha <= 0) {
      continue;
    }
    const x = index % w;
    const y = Math.floor(index / w);
    if (x < minX) {
      minX = x;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y < minY) {
      minY = y;
    }
    if (y > maxY) {
      maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return { opaqueMinX: 0, opaqueMinY: 0, opaqueWidth: w, opaqueHeight: h };
  }
  return {
    opaqueMinX: Math.max(0, minX),
    opaqueMinY: Math.max(0, minY),
    opaqueWidth: Math.max(1, maxX - minX + 1),
    opaqueHeight: Math.max(1, maxY - minY + 1),
  };
}

function getOpaqueBoundsForDrawableImage(image) {
  if (!isDrawableImage(image)) {
    return { opaqueMinX: 0, opaqueMinY: 0, opaqueWidth: 1, opaqueHeight: 1 };
  }
  const cacheKey = getImageCacheStableId(image);
  if (cacheKey && spriteOpaqueBoundsCache.has(cacheKey)) {
    return spriteOpaqueBoundsCache.get(cacheKey);
  }

  const dims = getDrawableImageDimensions(image);
  const width = Math.max(1, toSafeInt(dims.width, 1));
  const height = Math.max(1, toSafeInt(dims.height, 1));
  let bounds = { opaqueMinX: 0, opaqueMinY: 0, opaqueWidth: width, opaqueHeight: height };

  if (spriteOpaqueBoundsCtx) {
    try {
      if (spriteOpaqueBoundsCanvas.width !== width || spriteOpaqueBoundsCanvas.height !== height) {
        spriteOpaqueBoundsCanvas.width = width;
        spriteOpaqueBoundsCanvas.height = height;
      }
      spriteOpaqueBoundsCtx.setTransform(1, 0, 0, 1, 0, 0);
      spriteOpaqueBoundsCtx.globalAlpha = 1;
      spriteOpaqueBoundsCtx.globalCompositeOperation = "copy";
      spriteOpaqueBoundsCtx.clearRect(0, 0, width, height);
      spriteOpaqueBoundsCtx.drawImage(image, 0, 0, width, height);
      const rgba = spriteOpaqueBoundsCtx.getImageData(0, 0, width, height).data;
      bounds = computeOpaqueBoundsFromRgba(rgba, width, height);
    } catch (error) {
      bounds = { opaqueMinX: 0, opaqueMinY: 0, opaqueWidth: width, opaqueHeight: height };
    }
  }

  if (cacheKey) {
    spriteOpaqueBoundsCache.set(cacheKey, bounds);
    trimSpriteOpaqueBoundsCacheIfNeeded();
  }
  return bounds;
}

function normalizeRgbColor(color, fallback = MORPHING_COLORIZE_FALLBACK_RGB) {
  const safeFallback = Array.isArray(fallback) && fallback.length >= 3 ? fallback : [255, 255, 255];
  const source = Array.isArray(color) && color.length >= 3 ? color : safeFallback;
  return [
    clamp(Math.round(Number(source[0]) || 0), 0, 255),
    clamp(Math.round(Number(source[1]) || 0), 0, 255),
    clamp(Math.round(Number(source[2]) || 0), 0, 255),
  ];
}

function trimMorphingColorSampleCacheIfNeeded() {
  if (morphingColorSampleCache.size <= MORPHING_COLOR_SAMPLE_CACHE_MAX_ENTRIES) {
    return;
  }
  const extraCount = morphingColorSampleCache.size - MORPHING_COLOR_SAMPLE_CACHE_MAX_ENTRIES;
  const keys = morphingColorSampleCache.keys();
  for (let i = 0; i < extraCount; i += 1) {
    const key = keys.next().value;
    if (typeof key === "undefined") {
      break;
    }
    morphingColorSampleCache.delete(key);
  }
}

function computeDominantOpaqueColorForDrawableImage(image) {
  if (!isDrawableImage(image) || !spriteColorSampleCtx) {
    return null;
  }
  const cacheKey = getImageCacheStableId(image);
  if (cacheKey && morphingColorSampleCache.has(cacheKey)) {
    return morphingColorSampleCache.get(cacheKey);
  }

  const dims = getDrawableImageDimensions(image);
  const width = Math.max(1, toSafeInt(dims.width, 1));
  const height = Math.max(1, toSafeInt(dims.height, 1));
  let sampledColor = null;
  try {
    if (spriteColorSampleCanvas.width !== width || spriteColorSampleCanvas.height !== height) {
      spriteColorSampleCanvas.width = width;
      spriteColorSampleCanvas.height = height;
    }
    spriteColorSampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    spriteColorSampleCtx.globalAlpha = 1;
    spriteColorSampleCtx.globalCompositeOperation = "copy";
    spriteColorSampleCtx.clearRect(0, 0, width, height);
    spriteColorSampleCtx.drawImage(image, 0, 0, width, height);
    const rgba = spriteColorSampleCtx.getImageData(0, 0, width, height).data;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumWeight = 0;
    const pixelCount = width * height;
    for (let i = 0; i < pixelCount; i += 1) {
      const offset = i * 4;
      const alpha = Number(rgba[offset + 3] || 0) / 255;
      if (alpha <= 0.08) {
        continue;
      }
      const r = Number(rgba[offset] || 0);
      const g = Number(rgba[offset + 1] || 0);
      const b = Number(rgba[offset + 2] || 0);
      const maxChannel = Math.max(r, g, b);
      const minChannel = Math.min(r, g, b);
      const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
      const value = maxChannel / 255;
      const saturationWeight = 0.35 + saturation * 0.9;
      const valueWeight = 0.4 + value * 0.6;
      const weight = alpha * saturationWeight * valueWeight;
      sumR += r * weight;
      sumG += g * weight;
      sumB += b * weight;
      sumWeight += weight;
    }
    if (sumWeight > 0.0001) {
      sampledColor = normalizeRgbColor([
        Math.round(sumR / sumWeight),
        Math.round(sumG / sumWeight),
        Math.round(sumB / sumWeight),
      ]);
    }
  } catch {
    sampledColor = null;
  }

  if (!sampledColor) {
    return null;
  }
  if (cacheKey) {
    morphingColorSampleCache.set(cacheKey, sampledColor);
    trimMorphingColorSampleCacheIfNeeded();
  }
  return sampledColor;
}

function getMorphingReferenceSpriteImage() {
  const def = state.pokemonDefsById.get(MORPHING_REFERENCE_POKEMON_ID);
  if (!def) {
    return null;
  }
  const defaultVariant = getPreferredDefaultSpriteVariant(def);
  const defaultPath = String(defaultVariant?.frontPath || def.spritePath || "").trim();
  const cachedImage = defaultPath ? getCachedSpriteImage(defaultPath) : null;
  if (isDrawableImage(cachedImage)) {
    return cachedImage;
  }
  if (isDrawableImage(def.spriteImage)) {
    return def.spriteImage;
  }
  return cachedImage || def.spriteImage || null;
}

function resolveMorphingColorizeRgb() {
  const referenceImage = getMorphingReferenceSpriteImage();
  const sampledColor = computeDominantOpaqueColorForDrawableImage(referenceImage);
  return normalizeRgbColor(sampledColor || MORPHING_COLORIZE_FALLBACK_RGB);
}

function trimMorphingPaletteTextureCacheIfNeeded() {
  if (morphingPaletteTextureCache.size <= MORPHING_PALETTE_TEXTURE_CACHE_MAX_ENTRIES) {
    return;
  }
  const extraCount = morphingPaletteTextureCache.size - MORPHING_PALETTE_TEXTURE_CACHE_MAX_ENTRIES;
  const keys = morphingPaletteTextureCache.keys();
  for (let i = 0; i < extraCount; i += 1) {
    const key = keys.next().value;
    if (typeof key === "undefined") {
      break;
    }
    morphingPaletteTextureCache.delete(key);
  }
}

function resolveMorphingPaletteColorAt(ratio) {
  const t = clamp(Number(ratio) || 0, 0, 1);
  const stops = MORPHING_DITTO_PALETTE_STOPS;
  if (!Array.isArray(stops) || stops.length <= 0) {
    return MORPHING_COLORIZE_FALLBACK_RGB;
  }
  if (t <= stops[0].stop) {
    return normalizeRgbColor(stops[0].rgb, MORPHING_COLORIZE_FALLBACK_RGB);
  }
  for (let i = 0; i < stops.length - 1; i += 1) {
    const from = stops[i];
    const to = stops[i + 1];
    if (t > to.stop) {
      continue;
    }
    const span = Math.max(0.0001, Number(to.stop) - Number(from.stop));
    const localT = clamp((t - Number(from.stop)) / span, 0, 1);
    return [
      Math.round(lerpNumber(Number(from.rgb?.[0] || 0), Number(to.rgb?.[0] || 0), localT)),
      Math.round(lerpNumber(Number(from.rgb?.[1] || 0), Number(to.rgb?.[1] || 0), localT)),
      Math.round(lerpNumber(Number(from.rgb?.[2] || 0), Number(to.rgb?.[2] || 0), localT)),
    ];
  }
  return normalizeRgbColor(stops[stops.length - 1].rgb, MORPHING_COLORIZE_FALLBACK_RGB);
}

function getMorphingPaletteMappedTexture(image, width, height, strength = 1) {
  if (!isDrawableImage(image)) {
    return image;
  }
  const safeWidth = Math.max(1, toSafeInt(width, 1));
  const safeHeight = Math.max(1, toSafeInt(height, 1));
  const safeStrength = clamp(Number(strength) || 0, 0, 1);
  if (safeStrength <= 0.001) {
    return image;
  }
  const imageStableId = getImageCacheStableId(image);
  const strengthKey = Math.round(safeStrength * 1000);
  const cacheKey = `${imageStableId}|${safeWidth}x${safeHeight}|morph_palette_v2|${strengthKey}`;
  if (cacheKey && morphingPaletteTextureCache.has(cacheKey)) {
    return morphingPaletteTextureCache.get(cacheKey) || image;
  }

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = safeWidth;
  textureCanvas.height = safeHeight;
  const textureCtx = textureCanvas.getContext("2d", { willReadFrequently: true }) || textureCanvas.getContext("2d");
  if (!textureCtx) {
    return image;
  }

  try {
    textureCtx.imageSmoothingEnabled = false;
    textureCtx.setTransform(1, 0, 0, 1, 0, 0);
    textureCtx.globalCompositeOperation = "source-over";
    textureCtx.globalAlpha = 1;
    textureCtx.clearRect(0, 0, safeWidth, safeHeight);
    textureCtx.drawImage(image, 0, 0, safeWidth, safeHeight);

    const imageData = textureCtx.getImageData(0, 0, safeWidth, safeHeight);
    const data = imageData.data;
    const pixelCount = safeWidth * safeHeight;
    for (let i = 0; i < pixelCount; i += 1) {
      const offset = i * 4;
      const alpha = Number(data[offset + 3] || 0);
      if (alpha <= 0) {
        continue;
      }
      const r = Number(data[offset] || 0);
      const g = Number(data[offset + 1] || 0);
      const b = Number(data[offset + 2] || 0);
      const maxChannel = Math.max(r, g, b);
      const minChannel = Math.min(r, g, b);
      const luminance = clamp((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0, 1);
      const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
      const value = maxChannel / 255;
      const remappedTone = clamp(0.08 + luminance * 0.86 + (1 - saturation) * 0.04 + value * 0.02, 0, 1);
      const paletteColor = resolveMorphingPaletteColorAt(remappedTone);
      const outR = Math.round(lerpNumber(r, paletteColor[0], safeStrength));
      const outG = Math.round(lerpNumber(g, paletteColor[1], safeStrength));
      const outB = Math.round(lerpNumber(b, paletteColor[2], safeStrength));
      data[offset] = clamp(outR, 0, 255);
      data[offset + 1] = clamp(outG, 0, 255);
      data[offset + 2] = clamp(outB, 0, 255);
    }
    textureCtx.putImageData(imageData, 0, 0);
  } catch {
    return image;
  }

  if (cacheKey) {
    morphingPaletteTextureCache.set(cacheKey, textureCanvas);
    trimMorphingPaletteTextureCacheIfNeeded();
  }
  return textureCanvas;
}

function buildMorphingShaderConfig() {
  return {
    ...MORPHING_SHADER_CONFIG,
    colorizeRgb: resolveMorphingColorizeRgb(),
  };
}

function normalizeSpriteVariantEntry(rawVariant, jsonPath, fallbackIndex = 0) {
  if (!rawVariant || typeof rawVariant !== "object") {
    return null;
  }

  const id = normalizeSpriteVariantId(rawVariant.id || rawVariant.game_key || `variant_${fallbackIndex + 1}`);
  if (!id || isDeprecatedSpriteVariantId(id)) {
    return null;
  }
  const frontPath = resolveSpritePath(jsonPath, rawVariant.front);
  if (!frontPath) {
    return null;
  }

  return {
    id,
    labelFr: String(rawVariant.label_fr || rawVariant.label || id),
    generation: clamp(toSafeInt(rawVariant.generation, 0), 0, 9),
    gameKey: String(rawVariant.game_key || "").toLowerCase(),
    frontPath,
    frontShinyPath: resolveSpritePath(jsonPath, rawVariant.front_shiny),
    animated: Boolean(rawVariant.animated),
  };
}

function getSpriteVariantsForDef(def) {
  return Array.isArray(def?.spriteVariants)
    ? def.spriteVariants.filter((entry) => entry?.frontPath && !isDeprecatedSpriteVariantId(entry.id))
    : [];
}

function getSpriteVariantById(def, variantId) {
  const targetId = normalizeSpriteVariantId(variantId);
  if (!targetId) {
    return null;
  }
  return getSpriteVariantsForDef(def).find((entry) => entry.id === targetId) || null;
}

function getPreferredDefaultSpriteVariant(def) {
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return null;
  }
  const variantsById = new Map(variants.map((entry) => [entry.id, entry]));
  for (const preferredId of DEFAULT_POKEMON_SPRITE_VARIANT_PREFERENCE) {
    if (variantsById.has(preferredId)) {
      return variantsById.get(preferredId) || null;
    }
  }
  const explicit = normalizeSpriteVariantId(def?.defaultSpriteVariantId);
  if (explicit && variantsById.has(explicit)) {
    return variantsById.get(explicit) || null;
  }
  return variants[0];
}

function getDefaultSpriteVariantId(def) {
  return getPreferredDefaultSpriteVariant(def)?.id || "";
}

function shouldPromoteLegacyTransparentSelection(selectedVariantId, ownedVariantIds, defaultVariantId) {
  const preferredId = normalizeSpriteVariantId(defaultVariantId);
  if (!preferredId || preferredId === "transparent") {
    return false;
  }
  const selectedId = normalizeSpriteVariantId(selectedVariantId);
  if (selectedId !== "transparent") {
    return false;
  }
  const ownedIds = normalizeSpriteVariantIdList(ownedVariantIds);
  return ownedIds.length > 0 && ownedIds.every((variantId) => variantId === "transparent");
}

function getSpriteVariantOrderIndex(def, variantId) {
  const targetId = normalizeSpriteVariantId(variantId);
  if (!targetId) {
    return Number.MAX_SAFE_INTEGER;
  }
  const index = getSpriteVariantsForDef(def).findIndex((entry) => entry.id === targetId);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function getSpriteVariantDisplayLabel(variant) {
  if (!variant) {
    return "Sprite";
  }
  let label = variant.labelFr;
  if (variant.id === "transparent" && variant.gameKey === "home") {
    label = "Home";
  }
  const generationLabel = Number(variant.generation) > 0 ? "Gen " + String(variant.generation) : "";
  return generationLabel ? `${label} (${generationLabel})` : label;
}

function normalizeEvolutionItemReadyTargets(rawTargets) {
  if (!Array.isArray(rawTargets)) {
    return [];
  }
  const seen = new Set();
  const normalized = [];
  for (const rawTarget of rawTargets) {
    const targetId = Number(rawTarget);
    if (!Number.isFinite(targetId) || targetId <= 0 || seen.has(targetId)) {
      continue;
    }
    seen.add(targetId);
    normalized.push(targetId);
  }
  return normalized;
}

function getTalentDefinitionForPokemonId(pokemonId) {
  const csvTalent = getPokemonTalentCsvForPokemonId(pokemonId);
  if (csvTalent) {
    return normalizeTalentDefinition(csvTalent);
  }
  const def = state.pokemonDefsById.get(Number(pokemonId || 0));
  return normalizeTalentDefinition(def?.talent);
}

function resolveTalentDefinition(rawTalent, pokemonId = 0) {
  const normalized = normalizeTalentDefinition(rawTalent);
  if (normalized.id !== TALENT_NONE_ID) {
    return normalized;
  }
  return getTalentDefinitionForPokemonId(pokemonId);
}

function formatTalentLabelFr(rawTalent, pokemonId = 0) {
  return resolveTalentDefinition(rawTalent, pokemonId).nameFr || TALENT_NONE_NAME_FR;
}

function getEntityTalentId(entity, fallbackPokemonId = 0) {
  return normalizeTalentId(resolveTalentDefinition(entity?.talent, fallbackPokemonId || entity?.id).id);
}

function getTalentCritBonusChance(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return Math.max(0, Number(TALENT_CRIT_BONUS_CHANCE_BY_ID[talentId] || 0));
}

function hasAlwaysHitTalent(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return TALENT_ALWAYS_HIT_IDS.has(talentId);
}

function getTalentMoneyMultiplier(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return Math.max(1, Number(TALENT_MONEY_MULTIPLIER_BY_ID[talentId] || 1));
}

function hasImplementedTalentEffect(talentIdRaw) {
  const talentId = normalizeTalentId(talentIdRaw);
  if (talentId === TALENT_NONE_ID) {
    return true;
  }
  if (getPassiveBehaviorIdForTalentId(talentId) !== TALENT_NONE_ID) {
    return true;
  }
  return Number(TALENT_MONEY_MULTIPLIER_BY_ID[talentId] || 1) > 1;
}

const {
  warnRuntimeDataValidation,
  loadPokemonTalentCsv,
  loadBallConfigCsv,
  loadShopItemConfigCsv,
  loadZoneEncounterCsv,
} = createRuntimeConfigLoaders({
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

function getTalentTeleportSwapChance(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  const baseChance = clamp(Number(TALENT_TELEPORT_SWAP_CHANCE_BY_ID[talentId] || 0), 0, 1);
  return baseChance;
}


function isTeleportPlusPlusTalent(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return talentId === TALENT_TELEPORT_PLUS_PLUS_ID;
}

function shouldApplyMorphingTalent(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return talentId === TALENT_MORPHING_ID;
}

function getEntityOffensiveType(entity, fallbackType = "normal") {
  return normalizeType(entity?.offensiveType || entity?.defensiveTypes?.[0] || fallbackType);
}

function getTeamAuraProviderConfig(rawTalent, pokemonId = 0) {
  const talentId = normalizeTalentId(resolveTalentDefinition(rawTalent, pokemonId).id);
  return TALENT_AURA_PROVIDER_BY_ID[talentId] || null;
}

function getLegendaryFieldPresence(teamMembers) {
  const stateByField = {
    electric: false,
    ardent: false,
    arctic: false,
  };
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return {
      ...stateByField,
      trinityActive: false,
    };
  }
  for (let i = 0; i < teamMembers.length; i += 1) {
    const teammate = teamMembers[i];
    if (!teammate) {
      continue;
    }
    const talentId = getEntityTalentId(teammate, teammate?.id);
    if (!TALENT_LEGENDARY_FIELD_IDS.has(talentId)) {
      continue;
    }
    if (talentId === TALENT_ELECTRIC_FIELD_ID) {
      stateByField.electric = true;
    } else if (talentId === TALENT_ARDENT_FIELD_ID) {
      stateByField.ardent = true;
    } else if (talentId === TALENT_ARCTIC_FIELD_ID) {
      stateByField.arctic = true;
    }
  }
  return {
    ...stateByField,
    trinityActive: stateByField.electric && stateByField.ardent && stateByField.arctic,
  };
}

function getLegendaryFieldAttackIntervalMultiplier(teamMembers) {
  const fields = getLegendaryFieldPresence(teamMembers);
  if (!fields.trinityActive) {
    return 1;
  }
  return TALENT_LEGENDARY_FIELD_ATTACK_INTERVAL_MULTIPLIER;
}

function getStackedTeamAuraAttackBonus(teamMembers, targetSlotIndex, targetOffensiveType) {
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return 0;
  }

  const targetType = normalizeType(targetOffensiveType || "normal");
  let totalBonus = 0;
  for (let i = 0; i < teamMembers.length; i += 1) {
    const teammate = teamMembers[i];
    if (!teammate) {
      continue;
    }
    const aura = getTeamAuraProviderConfig(teammate?.talent, teammate?.id);
    if (!aura) {
      continue;
    }
    if (i === targetSlotIndex && !Boolean(aura.includeSelf)) {
      continue;
    }
    if (normalizeType(aura.offensiveType) !== targetType) {
      continue;
    }
    totalBonus += Math.max(0, Number(aura.attackBonus || 0));
  }
  return Math.max(0, totalBonus);
}

function getTeamAuraAttackBonusBySlot(teamMembers) {
  const bonuses = Array.from({ length: MAX_TEAM_SIZE }, () => 0);
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return bonuses;
  }
  for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
    const member = teamMembers[i];
    if (!member) {
      continue;
    }
    bonuses[i] = getStackedTeamAuraAttackBonus(teamMembers, i, getEntityOffensiveType(member));
  }
  return bonuses;
}

function sanitizePokemonNickname(rawValue, options = {}) {
  const trimEdges = options.trimEdges !== false;
  const normalized = normalizeUiDisplayText(rawValue)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]+/g, " ");
  const candidate = trimEdges ? normalized.trim() : normalized;
  if (!candidate.trim()) {
    return "";
  }
  return Array.from(candidate).slice(0, POKEMON_NICKNAME_MAX_LENGTH).join("");
}

function getPokemonNicknameLength(rawValue, options = {}) {
  return Array.from(sanitizePokemonNickname(rawValue, options)).length;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPokemonNicknameById(pokemonId) {
  const record = getPokemonEntityRecord(pokemonId);
  return sanitizePokemonNickname(record?.nickname);
}

function getPokemonDisplayNameForOwnedEntity(pokemonId, fallbackName = "") {
  const nickname = getPokemonNicknameById(pokemonId);
  if (nickname) {
    return nickname;
  }
  return String(fallbackName || getPokemonDisplayNameById(pokemonId));
}

function normalizePokemonEntityRecord(rawEntity, pokemonId) {
  const id = Number(pokemonId);
  const counters = normalizeSpeciesCounters(rawEntity);
  const level = clamp(toSafeInt(rawEntity?.level, 1), 1, MAX_LEVEL);
  const xp = Math.max(0, toSafeInt(rawEntity?.xp, 0));
  const baseStats = getPokemonBaseStats(id, rawEntity?.base_stats || rawEntity?.stats);
  const stats = computeStatsAtLevel(baseStats, level);
  const capturedTotal = Math.max(0, toSafeInt(counters.captured_normal, 0)) + Math.max(0, toSafeInt(counters.captured_shiny, 0));
  const hasEntityUnlockedField =
    rawEntity && typeof rawEntity === "object" && Object.prototype.hasOwnProperty.call(rawEntity, "entity_unlocked");
  const entityUnlocked = hasEntityUnlockedField ? Boolean(rawEntity.entity_unlocked) : capturedTotal > 0;
  const appearanceOwnedVariants = normalizeSpriteVariantIdList(rawEntity?.appearance_owned_variants);
  const appearanceSelectedVariant = normalizeSpriteVariantId(rawEntity?.appearance_selected_variant);
  const appearanceShinyMode = Boolean(rawEntity?.appearance_shiny_mode);
  const appearanceUltraShinyMode = Boolean(rawEntity?.appearance_ultra_shiny_mode);
  const evolutionItemReadyTargets = normalizeEvolutionItemReadyTargets(rawEntity?.evolution_item_ready_targets);
  const nickname = sanitizePokemonNickname(rawEntity?.nickname ?? rawEntity?.custom_name ?? rawEntity?.customName ?? "");
  const happinessBoxStreakMs = Math.max(
    0,
    toSafeInt(rawEntity?.happiness_box_streak_ms ?? rawEntity?.happinessBoxStreakMs, 0),
  );
  const speciesNameEn = String(rawEntity?.species_name_en ?? rawEntity?.name_en ?? "").toLowerCase().trim();
  const talent = resolveTalentDefinition(
    rawEntity?.talent ?? {
      id: rawEntity?.talent_id ?? rawEntity?.talentId,
      name_fr: rawEntity?.talent_name_fr,
      name_en: rawEntity?.talent_name_en,
      description_fr: rawEntity?.talent_description_fr,
    },
    id,
  );

  return {
    id,
    level,
    xp,
    entity_unlocked: entityUnlocked,
    base_stats: baseStats,
    stats,
    appearance_owned_variants: appearanceOwnedVariants,
    appearance_selected_variant: appearanceSelectedVariant,
    appearance_shiny_mode: appearanceShinyMode,
    appearance_ultra_shiny_mode: appearanceUltraShinyMode,
    evolution_item_ready_targets: evolutionItemReadyTargets,
    nickname,
    happiness_box_streak_ms: happinessBoxStreakMs,
    species_name_en: speciesNameEn,
    talent,
    ...counters,
  };
}

function createPokemonEntityRecord(pokemonId, initialLevel = 1) {
  const level = clamp(toSafeInt(initialLevel, 1), 1, MAX_LEVEL);
  const def = state.pokemonDefsById.get(Number(pokemonId));
  const baseStats = getPokemonBaseStats(pokemonId);
  const stats = computeStatsAtLevel(baseStats, level);
  return {
    id: Number(pokemonId),
    level,
    xp: 0,
    entity_unlocked: false,
    base_stats: baseStats,
    stats,
    appearance_owned_variants: [],
    appearance_selected_variant: "",
    appearance_shiny_mode: false,
    appearance_ultra_shiny_mode: false,
    evolution_item_ready_targets: [],
    nickname: "",
    happiness_box_streak_ms: 0,
    species_name_en: String(def?.nameEn || "").toLowerCase().trim(),
    talent: getTalentDefinitionForPokemonId(pokemonId),
    ...createEmptySpeciesStats(),
  };
}

function createDefaultBallInventory() {
  const inventory = {};
  for (const ballType of Object.keys(BALL_CONFIG_BY_TYPE)) {
    inventory[ballType] = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(inventory, "poke_ball")) {
    inventory.poke_ball = 0;
  }
  return inventory;
}

function clampBallInventoryCount(value) {
  return clamp(toSafeInt(value, 0), 0, BALL_INVENTORY_MAX_PER_TYPE);
}

function normalizeBallInventory(rawInventory) {
  const normalized = createDefaultBallInventory();
  const source = rawInventory && typeof rawInventory === "object" ? rawInventory : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = clampBallInventoryCount(source[key]);
  }
  return normalized;
}

function createDefaultBallInventorySeen() {
  const seen = {};
  for (const ballType of Object.keys(BALL_CONFIG_BY_TYPE)) {
    seen[ballType] = ballType === "poke_ball";
  }
  if (!Object.prototype.hasOwnProperty.call(seen, "poke_ball")) {
    seen.poke_ball = true;
  }
  return seen;
}

function normalizeBallInventorySeen(rawSeen, ballInventory = null) {
  const normalized = createDefaultBallInventorySeen();
  const source = rawSeen && typeof rawSeen === "object" ? rawSeen : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = Boolean(source[key]);
  }
  const inventory = ballInventory && typeof ballInventory === "object" ? ballInventory : {};
  for (const key of Object.keys(normalized)) {
    if (Math.max(0, toSafeInt(inventory[key], 0)) > 0) {
      normalized[key] = true;
    }
  }
  normalized.poke_ball = true;
  return normalized;
}

function createDefaultSingleBallCaptureRules() {
  return {
    [BALL_CAPTURE_RULE_CAPTURE_ALL]: true,
    [BALL_CAPTURE_RULE_CAPTURE_UNOWNED]: true,
    [BALL_CAPTURE_RULE_CAPTURE_OWNED]: true,
    [BALL_CAPTURE_RULE_CAPTURE_SHINY]: true,
    [BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]: true,
  };
}

function normalizeSingleBallCaptureRules(rawRules) {
  const source = rawRules && typeof rawRules === "object" ? rawRules : {};
  const normalized = {
    [BALL_CAPTURE_RULE_CAPTURE_ALL]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_ALL]),
    [BALL_CAPTURE_RULE_CAPTURE_UNOWNED]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_UNOWNED]),
    [BALL_CAPTURE_RULE_CAPTURE_OWNED]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_OWNED]),
    [BALL_CAPTURE_RULE_CAPTURE_SHINY]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_SHINY]),
    [BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]: Boolean(source[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]),
  };
  if (!Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_ALL)) {
    normalized[BALL_CAPTURE_RULE_CAPTURE_ALL] = true;
  }
  if (
    !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_UNOWNED)
    && !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_OWNED)
    && !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_SHINY)
    && !Object.prototype.hasOwnProperty.call(source, BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY)
  ) {
    normalized[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_OWNED] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_SHINY] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY] = true;
  }
  if (normalized[BALL_CAPTURE_RULE_CAPTURE_ALL]) {
    normalized[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_OWNED] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_SHINY] = true;
    normalized[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY] = true;
  }
  return normalized;
}

function createDefaultBallCaptureRulesByType() {
  const rulesByType = {};
  for (const ballType of Object.keys(BALL_CONFIG_BY_TYPE)) {
    rulesByType[ballType] = createDefaultSingleBallCaptureRules();
  }
  if (!Object.prototype.hasOwnProperty.call(rulesByType, "poke_ball")) {
    rulesByType.poke_ball = createDefaultSingleBallCaptureRules();
  }
  return rulesByType;
}

function normalizeBallCaptureRulesByType(rawRulesByType) {
  const normalized = createDefaultBallCaptureRulesByType();
  const source = rawRulesByType && typeof rawRulesByType === "object" ? rawRulesByType : {};
  for (const ballType of Object.keys(normalized)) {
    normalized[ballType] = normalizeSingleBallCaptureRules(source[ballType]);
  }
  return normalized;
}

function computeBallInventoryTotal(ballInventory) {
  if (!ballInventory || typeof ballInventory !== "object") {
    return 0;
  }
  return Object.values(ballInventory).reduce((sum, count) => sum + clampBallInventoryCount(count), 0);
}

function hasStructuredBallInventory(rawInventory) {
  if (!rawInventory || typeof rawInventory !== "object") {
    return false;
  }
  const defaultInventory = createDefaultBallInventory();
  return Object.keys(defaultInventory).some((key) => Object.prototype.hasOwnProperty.call(rawInventory, key));
}

function isBallTypeComingSoon(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  return COMING_SOON_BALL_TYPES.has(type);
}

function createDefaultShopItemsInventory() {
  const inventory = {};
  for (const item of Object.values(SHOP_ITEM_CONFIG_BY_ID)) {
    if (!item || item.itemType === "ball" || !item.stockTracked) {
      continue;
    }
    inventory[item.id] = 0;
  }
  return inventory;
}

function normalizeShopItemsInventory(rawInventory) {
  const normalized = createDefaultShopItemsInventory();
  const source = rawInventory && typeof rawInventory === "object" ? rawInventory : {};
  for (const key of Object.keys(normalized)) {
    normalized[key] = Math.max(0, toSafeInt(source[key], 0));
  }
  return normalized;
}

function createDefaultTutorialProgress() {
  return {
    route1_intro_seen: false,
    evolution_intro_seen: false,
    appearance_intro_seen: false,
    appearance_editor_unlocked: true,
  };
}

function normalizeLegacyAppearanceFamilyRootIds(rawValue) {
  return sanitizePositiveIntArray(rawValue, {
    toSafeInt,
  });
}

function canonicalizeLegacyAppearanceFamilyRootIds(rawValue, defsById = state.pokemonDefsById) {
  const normalizedIds = normalizeLegacyAppearanceFamilyRootIds(rawValue);
  const rootIds = normalizedIds.map((pokemonId) => getEvolutionFamilyRootIdFromDefs(pokemonId, defsById));
  return normalizeLegacyAppearanceFamilyRootIds(rootIds);
}

function getCompactSaveCodecOptions() {
  return {
    formatId: COMPACT_SAVE_FORMAT_ID,
    saveVersion: SAVE_VERSION,
    appVersion: APP_VERSION,
    routeIdOrder: ROUTE_ID_ORDER,
    defaultRouteId: DEFAULT_ROUTE_ID,
    ballOrder: COMPACT_SAVE_BALL_ORDER,
    itemOrder: COMPACT_SAVE_ITEM_ORDER,
    ballCaptureRuleKeys: {
      all: BALL_CAPTURE_RULE_CAPTURE_ALL,
      unowned: BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
      owned: BALL_CAPTURE_RULE_CAPTURE_OWNED,
      shiny: BALL_CAPTURE_RULE_CAPTURE_SHINY,
      ultraShiny: BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
    },
    createEmptySave,
    normalizePokemonEntityRecord,
    toSafeInt,
  };
}

function encodeCompactSave(saveData) {
  return encodeCompactSavePayload(saveData, getCompactSaveCodecOptions());
}

function decodeCompactSave(rawSave) {
  return decodeCompactSavePayload(rawSave, getCompactSaveCodecOptions());
}

function serializeSaveData(saveData) {
  return JSON.stringify(encodeCompactSave(saveData));
}

function extractLegacyAppearanceSpecies(rawLegacySave) {
  return extractLegacyAppearanceSpeciesFromPayload(rawLegacySave, {
    toSafeInt,
  });
}

function hasUnlockedEntityAtLeastLevelFromRecords(rawEntities, minLevel = APPEARANCE_UNLOCK_LEVEL) {
  if (!rawEntities || typeof rawEntities !== "object") {
    return false;
  }
  const targetLevel = clamp(toSafeInt(minLevel, APPEARANCE_UNLOCK_LEVEL), 1, MAX_LEVEL);
  for (const [rawId, rawRecord] of Object.entries(rawEntities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }
    const level = clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL);
    if (level >= targetLevel) {
      return true;
    }
  }
  return false;
}

function normalizeTutorialProgress(rawTutorials, rawEntities = null) {
  const source = rawTutorials && typeof rawTutorials === "object" ? rawTutorials : {};
  const normalized = createDefaultTutorialProgress();
  normalized.route1_intro_seen = Boolean(source.route1_intro_seen);
  normalized.evolution_intro_seen = Boolean(source.evolution_intro_seen);
  normalized.appearance_intro_seen = Boolean(source.appearance_intro_seen);
  normalized.appearance_editor_unlocked = true;

  if (hasUnlockedEntityAtLeastLevelFromRecords(rawEntities, APPEARANCE_UNLOCK_LEVEL)) {
    normalized.appearance_editor_unlocked = true;
  }
  return normalized;
}

function getLegacyPokeballCount(rawSave) {
  return Math.max(0, toSafeInt(rawSave?.pokeballs, 0));
}

function markEconomyNormalizationDirty() {
  state.economyNormalization.saveDataRef = null;
}

function createEmptySave() {
  return {
    version: SAVE_VERSION,
    app_build_version: APP_VERSION,
    starter_chosen: false,
    current_route_id: DEFAULT_ROUTE_ID,
    unlocked_route_ids: [DEFAULT_ROUTE_ID],
    route_defeat_counts: createRouteDefeatCountsFromGraph(ROUTE_ID_ORDER, DEFAULT_ROUTE_ID),
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 0,
    coins: 0,
    first_free_pokeball_claimed: false,
    first_free_pokeball_guaranteed_capture_pending: false,
    ball_inventory: createDefaultBallInventory(),
    ball_inventory_seen: createDefaultBallInventorySeen(),
    ball_capture_rules: createDefaultBallCaptureRulesByType(),
    active_ball_type: getDefaultActiveBallType(),
    shop_items: createDefaultShopItemsInventory(),
    attack_boost_until_ms: 0,
    pokeballs: 0,
    tutorials: createDefaultTutorialProgress(),
    legacy_shiny_family_root_ids: [],
    legacy_ultra_shiny_family_root_ids: [],
    zone_flags: [],
    seen_dialogue_ids: [],
  };
}

function getRawSaveVersion(rawSave) {
  return Math.max(0, toSafeInt(rawSave?.version, 0));
}

function getRawSaveAppVersion(rawSave) {
  if (!rawSave || typeof rawSave !== "object") {
    return "";
  }
  const buildVersion = String(rawSave.app_build_version || "").trim();
  if (buildVersion) {
    return buildVersion;
  }
  return String(rawSave.app_version || "").trim();
}

function isRawSaveVersionSupported(rawSave) {
  return getRawSaveVersion(rawSave) >= MIN_SUPPORTED_SAVE_VERSION;
}

function isRawSaveAppVersionSupported(rawSave) {
  return isVersionAtLeast(getRawSaveAppVersion(rawSave), MIN_SUPPORTED_SAVE_APP_VERSION);
}

function isRawSaveSupported(rawSave) {
  return isCompactSavePayload(rawSave, getCompactSaveCodecOptions());
}

function repairNormalizedSaveSnapshot(saveData) {
  const repairResult = repairNormalizedSaveData(saveData, {
    maxTeamSize: MAX_TEAM_SIZE,
    defaultRouteId: DEFAULT_ROUTE_ID,
  });

  if (!repairResult.orphanedProgress) {
    return {
      saveData,
      changed: repairResult.changed,
      recoveredTeam: repairResult.recoveredTeam,
      hardResetApplied: false,
    };
  }

  return {
    saveData: createEmptySave(),
    changed: true,
    recoveredTeam: false,
    hardResetApplied: true,
  };
}

function getRecoverableOwnedEntityIdsForRuntime() {
  if (!state.saveData) {
    return [];
  }
  return getOwnedEntityIdsFromSave(state.saveData, {
    maxTeamSize: MAX_TEAM_SIZE,
  }).filter((pokemonId) => state.pokemonDefsById.has(Number(pokemonId)));
}

function syncSpeciesIdentityForRecord(record, pokemonId) {
  if (!record) {
    return false;
  }
  const def = state.pokemonDefsById.get(Number(pokemonId));
  const speciesNameEn = String(def?.nameEn || "").toLowerCase().trim();
  if (!speciesNameEn || record.species_name_en === speciesNameEn) {
    return false;
  }
  record.species_name_en = speciesNameEn;
  return true;
}

function backfillSaveSpeciesIdentity() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return false;
  }

  let changed = false;
  for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(record?.id || rawId || 0);
    if (pokemonId <= 0 || !record) {
      continue;
    }
    if (syncSpeciesIdentityForRecord(record, pokemonId)) {
      changed = true;
    }
  }
  return changed;
}

function repairRuntimeSaveAfterDefinitionsLoaded() {
  if (!state.saveData) {
    return {
      changed: false,
      recoveredTeam: false,
      hardResetApplied: false,
    };
  }

  let changed = backfillSaveSpeciesIdentity();
  const normalizedLegacyShinyRoots = canonicalizeLegacyAppearanceFamilyRootIds(
    state.saveData.legacy_shiny_family_root_ids,
    state.pokemonDefsById,
  );
  if (JSON.stringify(normalizedLegacyShinyRoots) !== JSON.stringify(state.saveData.legacy_shiny_family_root_ids || [])) {
    state.saveData.legacy_shiny_family_root_ids = normalizedLegacyShinyRoots;
    changed = true;
  }
  const normalizedLegacyUltraRoots = canonicalizeLegacyAppearanceFamilyRootIds(
    state.saveData.legacy_ultra_shiny_family_root_ids,
    state.pokemonDefsById,
  );
  if (JSON.stringify(normalizedLegacyUltraRoots) !== JSON.stringify(state.saveData.legacy_ultra_shiny_family_root_ids || [])) {
    state.saveData.legacy_ultra_shiny_family_root_ids = normalizedLegacyUltraRoots;
    changed = true;
  }
  const ownedEntityIds = getOwnedEntityIdsFromSave(state.saveData, {
    maxTeamSize: MAX_TEAM_SIZE,
  });
  const recoverableOwnedIds = getRecoverableOwnedEntityIdsForRuntime();
  const recoverableOwnedSet = new Set(recoverableOwnedIds);
  const nextTeam = [];
  const currentTeam = Array.isArray(state.saveData.team) ? state.saveData.team : [];

  for (const rawId of currentTeam) {
    const id = Number(rawId);
    if (id <= 0 || nextTeam.includes(id) || !recoverableOwnedSet.has(id)) {
      continue;
    }
    nextTeam.push(id);
    if (nextTeam.length >= MAX_TEAM_SIZE) {
      break;
    }
  }

  let recoveredTeam = false;
  if (nextTeam.length <= 0 && recoverableOwnedIds.length > 0) {
    nextTeam.push(...recoverableOwnedIds.slice(0, MAX_TEAM_SIZE));
    recoveredTeam = true;
  }

  if (JSON.stringify(currentTeam) !== JSON.stringify(nextTeam)) {
    state.saveData.team = nextTeam;
    changed = true;
  }

  const shouldHaveStarter = nextTeam.length > 0 || ownedEntityIds.length > 0;
  if (Boolean(state.saveData.starter_chosen) !== shouldHaveStarter) {
    state.saveData.starter_chosen = shouldHaveStarter;
    changed = true;
  }

  if (!shouldHaveStarter && ownedEntityIds.length <= 0 && hasMeaningfulSaveProgress(state.saveData, DEFAULT_ROUTE_ID)) {
    state.saveData = createEmptySave();
    return {
      changed: true,
      recoveredTeam: false,
      hardResetApplied: true,
    };
  }

  return {
    changed,
    recoveredTeam,
    hardResetApplied: false,
  };
}

function normalizeUnlockedRouteIds(rawIds, availableRouteIds = ROUTE_ID_ORDER) {
  return normalizeUnlockedRouteIdsFromGraph(rawIds, availableRouteIds, DEFAULT_ROUTE_ID);
}

function backfillInsertedUnlockedRouteIds(
  unlockedRouteIds,
  currentRouteId,
  availableRouteIds = ROUTE_ID_ORDER,
) {
  const ordered =
    Array.isArray(availableRouteIds) && availableRouteIds.length > 0
      ? availableRouteIds.map((routeId) => String(routeId || ""))
      : [DEFAULT_ROUTE_ID];
  return normalizeUnlockedRouteIdsFromGraph(
    [...(Array.isArray(unlockedRouteIds) ? unlockedRouteIds : []), String(currentRouteId || "")],
    ordered,
    DEFAULT_ROUTE_ID,
  );
}

function createRouteDefeatCounts(availableRouteIds = ROUTE_ID_ORDER) {
  return createRouteDefeatCountsFromGraph(availableRouteIds, DEFAULT_ROUTE_ID);
}

function normalizeRouteDefeatCounts(rawCounts, availableRouteIds = ROUTE_ID_ORDER) {
  return normalizeRouteDefeatCountsFromGraph(rawCounts, availableRouteIds, DEFAULT_ROUTE_ID, toSafeInt);
}

function normalizeSave(rawSave) {
  const base = createEmptySave();
  if (!rawSave || typeof rawSave !== "object") {
    return base;
  }
  if (isCompactSavePayload(rawSave, getCompactSaveCodecOptions())) {
    return decodeCompactSave(rawSave);
  }

  const normalizedTeam = [];
  const rawTeamEntries = Array.isArray(rawSave.team) ? rawSave.team : [];
  for (const teamEntry of rawTeamEntries) {
    const id =
      typeof teamEntry === "number" ? Number(teamEntry) : Number(teamEntry?.id || teamEntry?.pokemon_id || 0);
    if (id <= 0 || normalizedTeam.includes(id)) {
      continue;
    }
    normalizedTeam.push(id);
    if (normalizedTeam.length >= MAX_TEAM_SIZE) {
      break;
    }
  }

  const entities = {};
  const rawEntities = rawSave.pokemon_entities;
  if (rawEntities && typeof rawEntities === "object") {
    for (const [key, rawEntity] of Object.entries(rawEntities)) {
      const id = Number(rawEntity?.id || key);
      if (id <= 0) {
        continue;
      }
      entities[String(id)] = normalizePokemonEntityRecord(rawEntity, id);
    }
  } else {
    const legacySpeciesStats = rawSave.species_stats && typeof rawSave.species_stats === "object" ? rawSave.species_stats : {};
    const legacyTeamEntries = Array.isArray(rawSave.team) ? rawSave.team : [];
    const allIds = new Set();
    for (const key of Object.keys(legacySpeciesStats)) {
      const id = Number(key);
      if (id > 0) {
        allIds.add(id);
      }
    }
    for (const teamEntry of legacyTeamEntries) {
      const id = Number(teamEntry?.id || teamEntry);
      if (id > 0) {
        allIds.add(id);
      }
    }

    for (const id of allIds) {
      const legacyStats = legacySpeciesStats[String(id)] || {};
      let level = 1;
      for (const teamEntry of legacyTeamEntries) {
        if (Number(teamEntry?.id || teamEntry) === id) {
          level = Math.max(level, clamp(toSafeInt(teamEntry?.level, 1), 1, MAX_LEVEL));
        }
      }

      const normalizedLegacy = normalizePokemonEntityRecord(
        {
          ...legacyStats,
          level,
          xp: 0,
        },
        id,
      );

      if (normalizedTeam.includes(id)) {
        normalizedLegacy.captured_normal = Math.max(1, normalizedLegacy.captured_normal);
        normalizedLegacy.encountered_normal = Math.max(
          normalizedLegacy.encountered_normal,
          normalizedLegacy.captured_normal,
        );
        normalizedLegacy.entity_unlocked = true;
      }

      entities[String(id)] = normalizedLegacy;
    }
  }

  for (const teamId of normalizedTeam) {
    const key = String(teamId);
    if (!entities[key]) {
      entities[key] = createPokemonEntityRecord(teamId, 1);
      entities[key].captured_normal = 1;
      entities[key].encountered_normal = 1;
    }
    markEntityUnlocked(entities[key], true);
  }

  const currentRouteCandidate = typeof rawSave.current_route_id === "string" ? rawSave.current_route_id : base.current_route_id;
  const unlockedRouteIds = backfillInsertedUnlockedRouteIds(
    normalizeUnlockedRouteIds(rawSave.unlocked_route_ids, ROUTE_ID_ORDER),
    currentRouteCandidate,
    ROUTE_ID_ORDER,
  );
  const currentRouteId = unlockedRouteIds.includes(currentRouteCandidate) ? currentRouteCandidate : unlockedRouteIds[0];
  const routeDefeatCounts = normalizeRouteDefeatCounts(rawSave.route_defeat_counts, ROUTE_ID_ORDER);

  if (!rawSave.route_defeat_counts || typeof rawSave.route_defeat_counts !== "object") {
    let legacyTotalDefeats = 0;
    for (const record of Object.values(entities)) {
      legacyTotalDefeats += Math.max(0, toSafeInt(record?.defeated_normal, 0));
      legacyTotalDefeats += Math.max(0, toSafeInt(record?.defeated_shiny, 0));
    }
    routeDefeatCounts[currentRouteId] = Math.max(routeDefeatCounts[currentRouteId] || 0, legacyTotalDefeats);
  }

  const ballInventory = normalizeBallInventory(rawSave.ball_inventory);
  const legacyPokeballs = getLegacyPokeballCount(rawSave);
  const currentInventoryTotal = computeBallInventoryTotal(ballInventory);
  if (currentInventoryTotal <= 0 && legacyPokeballs > 0) {
    ballInventory[getLegacyBallBackfillType()] = legacyPokeballs;
  }
  const ballInventorySeen = normalizeBallInventorySeen(rawSave.ball_inventory_seen, ballInventory);
  const ballCaptureRules = normalizeBallCaptureRulesByType(rawSave.ball_capture_rules);

  const activeBallTypeRaw = String(rawSave.active_ball_type || "").toLowerCase().trim();
  const activeBallType = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeBallTypeRaw)
    ? activeBallTypeRaw
    : getDefaultActiveBallType();
  const shopItems = normalizeShopItemsInventory(rawSave.shop_items);
  const attackBoostUntilMs = Math.max(0, toSafeInt(rawSave.attack_boost_until_ms, 0));
  const totalPokeballs = computeBallInventoryTotal(ballInventory);
  const tutorials = normalizeTutorialProgress(rawSave.tutorials, entities);
  const hasFirstFreePokeballClaimedField = Object.prototype.hasOwnProperty.call(rawSave, "first_free_pokeball_claimed");
  const firstFreePokeballClaimed = hasFirstFreePokeballClaimedField
    ? Boolean(rawSave.first_free_pokeball_claimed)
    : totalPokeballs > 0;
  const firstFreePokeballGuaranteedCapturePending =
    firstFreePokeballClaimed && Boolean(rawSave.first_free_pokeball_guaranteed_capture_pending);

  return {
    version: SAVE_VERSION,
    app_build_version: APP_VERSION,
    starter_chosen:
      Boolean(rawSave.starter_chosen) || normalizedTeam.length > 0 || Object.values(entities).some((record) => isEntityUnlocked(record)),
    current_route_id: currentRouteId,
    unlocked_route_ids: unlockedRouteIds,
    route_defeat_counts: routeDefeatCounts,
    last_tick_epoch_ms: Math.max(0, toSafeInt(rawSave.last_tick_epoch_ms, 0)),
    team: normalizedTeam,
    pokemon_entities: entities,
    money: Math.max(0, toSafeInt(rawSave.money, 0)),
    coins: Math.max(0, toSafeInt(rawSave.coins, 0)),
    first_free_pokeball_claimed: firstFreePokeballClaimed,
    first_free_pokeball_guaranteed_capture_pending: firstFreePokeballGuaranteedCapturePending,
    ball_inventory: ballInventory,
    ball_inventory_seen: ballInventorySeen,
    ball_capture_rules: ballCaptureRules,
    active_ball_type: activeBallType,
    shop_items: shopItems,
    attack_boost_until_ms: attackBoostUntilMs,
    pokeballs: Math.max(0, totalPokeballs),
    tutorials,
    legacy_shiny_family_root_ids: normalizeLegacyAppearanceFamilyRootIds(rawSave.legacy_shiny_family_root_ids),
    legacy_ultra_shiny_family_root_ids: normalizeLegacyAppearanceFamilyRootIds(rawSave.legacy_ultra_shiny_family_root_ids),
    zone_flags: normalizeFlagIdList(rawSave.zone_flags),
    seen_dialogue_ids: normalizeFlagIdList(rawSave.seen_dialogue_ids),
  };
}

function getTutorialFlowDefinition(flowId) {
  return TUTORIAL_FLOW_DEFINITIONS[String(flowId || "")] || null;
}

function getTutorialProgress() {
  if (!state.saveData) {
    return createDefaultTutorialProgress();
  }
  state.saveData.tutorials = normalizeTutorialProgress(state.saveData.tutorials, state.saveData.pokemon_entities);
  return state.saveData.tutorials;
}

function isTutorialFlowSeen(flowId) {
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow) {
    return true;
  }
  const tutorials = getTutorialProgress();
  return Boolean(tutorials[flow.saveFlag]);
}

function markTutorialFlowSeen(flowId) {
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow || !state.saveData) {
    return false;
  }
  const tutorials = getTutorialProgress();
  if (tutorials[flow.saveFlag]) {
    return false;
  }
  tutorials[flow.saveFlag] = true;
  return true;
}

function hasUnlockedEntityAtLeastLevel(minLevel = APPEARANCE_UNLOCK_LEVEL) {
  return hasUnlockedEntityAtLeastLevelFromRecords(state.saveData?.pokemon_entities, minLevel);
}

function isAppearanceEditorUnlocked() {
  const tutorials = getTutorialProgress();
  return Boolean(tutorials.appearance_editor_unlocked);
}

function isTutorialFlowQueuedOrActive(flowId) {
  const id = String(flowId || "");
  if (!id) {
    return false;
  }
  if (String(state.tutorial.active?.flowId || "") === id) {
    return true;
  }
  return Array.isArray(state.tutorial.queue)
    && state.tutorial.queue.some((entry) => String(entry?.flowId || "") === id);
}

function enqueueTutorialFlow(flowId) {
  if (!state.saveData) {
    return false;
  }
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow) {
    return false;
  }
  if (isTutorialFlowSeen(flowId) || isTutorialFlowQueuedOrActive(flowId)) {
    return false;
  }
  state.tutorial.queue.push({
    flowId: String(flowId),
    pageIndex: 0,
  });
  return true;
}

function isStarterModalVisible() {
  return Boolean(starterModalEl && !starterModalEl.classList.contains("hidden"));
}

function canOpenTutorialModalNow() {
  if (!tutorialModalEl || !state.saveData || state.mode !== "ready") {
    return false;
  }
  if (!state.saveData.starter_chosen || isStarterModalVisible()) {
    return false;
  }
  if (state.ui.tutorialOpen) {
    return false;
  }
  if (state.ui.dialogueOpen) {
    return false;
  }
  if (state.ui.trainerBattleSetupOpen || isTrainerBattleActive()) {
    return false;
  }
  if (state.evolutionAnimation.current) {
    return false;
  }
  if (
    state.ui.mapOpen
    || state.ui.shopOpen
    || state.ui.gachaOpen
    || state.ui.boxesOpen
    || state.ui.pokedexOpen
    || state.ui.appearanceOpen
  ) {
    return false;
  }
  return true;
}

function refreshZoneActionButtons() {
  const layout = state.layout || refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  const isPhoneViewport = Boolean(layout?.viewportProfile?.phone);
  const shouldShowActions = !state.ui.dialogueOpen
    && !state.ui.tutorialOpen
    && !state.ui.trainerBattleSetupOpen
    && !state.ui.mapOpen
    && !state.ui.shopOpen
    && !state.ui.gachaOpen
    && !state.ui.boxesOpen
    && !state.ui.pokedexOpen
    && !state.ui.appearanceOpen
    && !isTrainerBattleActive();
  zoneDialogueUi.refreshZoneActionButtons({
    worldUiLayerEl,
    zoneActionButtonsById,
    routeActions: zoneDialogueRuntime.getCurrentRouteZoneActions(),
    shouldShowActions,
    isPhoneViewport,
  });
}

function canOpenDialogueModalNow() {
  if (!dialogueModalEl || !state.saveData || state.mode !== "ready") {
    return false;
  }
  if (!state.saveData.starter_chosen || isStarterModalVisible()) {
    return false;
  }
  if (
    state.ui.dialogueOpen
    || state.ui.tutorialOpen
    || state.ui.trainerBattleSetupOpen
    || isTrainerBattleActive()
    || state.evolutionAnimation.current
  ) {
    return false;
  }
  if (
    state.ui.mapOpen
    || state.ui.shopOpen
    || state.ui.gachaOpen
    || state.ui.boxesOpen
    || state.ui.pokedexOpen
    || state.ui.appearanceOpen
  ) {
    return false;
  }
  return true;
}

function renderDialogueModal() {
  if (!dialogueModalEl || !state.ui.dialogueOpen) {
    return;
  }
  const active = state.dialogue.active;
  const node = zoneDialogueRuntime.getDialogueNodeById(active?.definition, active?.currentNodeId);
  if (!active || !node) {
    closeDialogueModal({ force: true });
    return;
  }
  zoneDialogueUi.renderDialogueModal({
    dialogueModalEl,
    dialogueTitleEl,
    dialogueSpeakerEl,
    dialogueTextEl,
    dialogueChoiceListEl,
    dialogueProgressEl,
    dialogueNextButtonEl,
    dialogueCloseButtonEl,
    active,
    node,
    availableChoices: zoneDialogueRuntime.getAvailableDialogueChoices(node),
  });
}

function closeDialogueModal(options = {}) {
  return zoneDialogueRuntime.closeDialogueModal(options);
}

async function openDialogueSession(dialogueId, options = {}) {
  return zoneDialogueRuntime.openDialogueSession(dialogueId, options);
}

function tryOpenPendingDialogue() {
  return zoneDialogueRuntime.tryOpenPendingDialogue();
}

function queueArrivalDialoguesForRoute(routeId) {
  return zoneDialogueRuntime.queueArrivalDialoguesForRoute(routeId);
}

function triggerZoneAction(actionId) {
  return zoneDialogueRuntime.triggerZoneAction(actionId);
}

function advanceActiveDialogue() {
  return zoneDialogueRuntime.advanceActiveDialogue();
}

function chooseActiveDialogueChoice(choiceId) {
  return zoneDialogueRuntime.chooseActiveDialogueChoice(choiceId);
}

function canOpenTrainerBattleSetupNow() {
  if (!trainerBattleSetupModalEl || !state.saveData || state.mode !== "ready") {
    return false;
  }
  if (!state.saveData.starter_chosen || isStarterModalVisible()) {
    return false;
  }
  if (
    state.ui.dialogueOpen
    || state.ui.tutorialOpen
    || state.ui.trainerBattleSetupOpen
    || state.ui.mapOpen
    || state.ui.shopOpen
    || state.ui.gachaOpen
    || state.ui.boxesOpen
    || state.ui.pokedexOpen
    || state.ui.appearanceOpen
    || state.ui.renameOpen
    || state.evolutionAnimation.current
    || isTrainerBattleActive()
  ) {
    return false;
  }
  return true;
}

function renderTrainerBattleSetupModal() {
  if (!trainerBattleSetupModalEl) {
    return;
  }
  runtimeUiInteractionFacade.renderTrainerBattleSetupModal();
}

function clearTrainerBattleSetupState() {
  const trainerBattleState = getTrainerBattleState();
  trainerBattleState.selectedTeamIds = [];
  trainerBattleState.setupTrainerBattleId = "";
  trainerBattleState.setupSourceActionId = "";
  trainerBattleState.setupTargetSlotIndex = -1;
}

function openTrainerBattleSetupModal() {
  if (!trainerBattleSetupModalEl) {
    return false;
  }
  state.ui.trainerBattleSetupOpen = true;
  renderTrainerBattleSetupModal();
  showModalWithTween(trainerBattleSetupModalEl);
  refreshZoneActionButtons();
  return true;
}

function closeTrainerBattleSetupModal(options = {}) {
  const preserveState = options?.preserveState === true;
  state.ui.trainerBattleSetupOpen = false;
  if (!preserveState) {
    clearTrainerBattleSetupState();
  }
  if (trainerBattleSetupModalEl) {
    hideModalWithTween(trainerBattleSetupModalEl);
  }
  refreshZoneActionButtons();
  return true;
}

function confirmTrainerBattleSetup() {
  const trainerBattleState = getTrainerBattleState();
  const definition = getTrainerBattleSetupDefinition();
  const selectedTeamIds = normalizeTrainerBattleSelectedTeamIds(trainerBattleState.selectedTeamIds);
  if (!definition || !isTrainerBattleSelectionReady(selectedTeamIds)) {
    setTopMessage("Il faut 3 Pokemon valides, sans doublon de famille.", 1800);
    renderTrainerBattleSetupModal();
    return false;
  }

  trainerBattleState.active = {
    trainerBattleId: String(definition.trainer_battle_id || ""),
    definition,
    routeId: String(definition.route_id || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID),
    sourceActionId: String(trainerBattleState.setupSourceActionId || ""),
    enemyIndex: 0,
    selectedTeamIds: selectedTeamIds.slice(),
    restoreTeamIds: Array.isArray(state.saveData?.team) ? state.saveData.team.slice() : [],
    restoreRouteId: String(state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID),
  };

  closeTrainerBattleSetupModal({ preserveState: true });
  clearTrainerBattleSetupState();
  state.team = hydrateTeamFromSave();
  startBattle();
  refreshRouteUi();
  refreshZoneActionButtons();
  updateHud();
  refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  render();
  setTopMessage(`Le combat contre ${definition.trainer_name_fr || "le champion"} commence.`, 1800);
  return true;
}

function finishTrainerBattle({ victory = false, enemy = null, reason = "" } = {}) {
  const session = getActiveTrainerBattleSession();
  if (!session) {
    return false;
  }

  const definition = session.definition || null;
  const trainerNameFr = String(definition?.trainer_name_fr || "Pierre");
  let unlockedResult = { unlocked: false, route_names_fr: [] };
  let flagChanged = false;
  let saveRestored = false;

  if (victory && String(definition?.victory_flag_id || "").trim()) {
    flagChanged = setRouteAccessFlag(String(definition.victory_flag_id || "").trim(), true);
    unlockedResult = tryUnlockNextRouteAfterDefeat(session.routeId || definition.route_id);
  }

  const restoreTeamIds = Array.isArray(session.restoreTeamIds) ? session.restoreTeamIds.slice() : [];
  const restoreRouteId = String(
    session.restoreRouteId || session.routeId || definition?.route_id || state.routeData?.route_id || DEFAULT_ROUTE_ID,
  ).trim();
  if (state.saveData) {
    const previousTeamIds = Array.isArray(state.saveData.team) ? state.saveData.team.slice() : [];
    const teamChanged =
      previousTeamIds.length !== restoreTeamIds.length
      || previousTeamIds.some((pokemonId, index) => Number(pokemonId || 0) !== Number(restoreTeamIds[index] || 0));
    if (teamChanged) {
      state.saveData.team = restoreTeamIds.slice();
      saveRestored = true;
    }
    if (restoreRouteId && String(state.saveData.current_route_id || "") !== restoreRouteId) {
      state.saveData.current_route_id = restoreRouteId;
      saveRestored = true;
    }
  }
  if (restoreRouteId) {
    const restoreRouteData = getRouteDataById(restoreRouteId);
    if (restoreRouteData) {
      state.routeData = restoreRouteData;
    }
  }

  getTrainerBattleState().active = null;
  state.ui.trainerBattleSetupOpen = false;
  clearTrainerBattleSetupState();
  if (state.ui.boxesOpen) {
    closeBoxesModal();
  }
  if (trainerBattleSetupModalEl) {
    hideModalWithTween(trainerBattleSetupModalEl);
  }

  state.team = hydrateTeamFromSave();
  battleLifecycleSystem.syncBattleForRouteChange();
  refreshRouteUi();
  refreshZoneActionButtons();
  updateHud();
  refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  render();

  if (flagChanged || unlockedResult?.unlocked || saveRestored) {
    persistSaveData();
  }

  if (!state.simulationIdleMode) {
    if (victory) {
      const unlockedNames = Array.isArray(unlockedResult?.route_names_fr) && unlockedResult.route_names_fr.length > 0
        ? unlockedResult.route_names_fr.join(", ")
        : "";
      const unlockSuffix = unlockedNames ? ` Sortie debloquee: ${unlockedNames}.` : "";
      setTopMessage(`${trainerNameFr} est battu.${unlockSuffix}`, 2300);
    } else if (String(reason || "").trim() === "timeout") {
      setTopMessage(
        `Temps ecoule contre ${enemy?.nameFr || "le Pokemon de Pierre"}. Retour a Argenta.`,
        2300,
      );
    } else {
      setTopMessage(`Combat contre ${trainerNameFr} termine.`, 1700);
    }
  }
  return true;
}

function triggerTrainerBattleAction(trainerBattleId, options = {}) {
  const id = String(trainerBattleId || "").trim();
  if (!id || !canOpenTrainerBattleSetupNow()) {
    return false;
  }
  const routeId = String(options?.routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const sourceActionId = String(options?.sourceActionId || "").trim();

  void (async () => {
    try {
      const definition = await loadTrainerBattleDefinition(id);
      if (!definition) {
        throw new Error(`trainer-battle-not-found:${id}`);
      }
      if (String(definition.route_id || "").trim() !== routeId) {
        throw new Error(`trainer-battle-route-mismatch:${id}`);
      }
      const currentRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
      if (!canOpenTrainerBattleSetupNow() || currentRouteId !== routeId) {
        return;
      }

      closeTeamContextMenu();
      closeBallCaptureMenu();
      clearCanvasHoverState();
      closeRenameModal();
      closePokedexModal();
      closeAppearanceModal();
      closeEvolutionItemChoiceModal(null);
      closeGachaModal({ force: true });
      setMapOpen(false);
      setShopOpen(false);

      const trainerBattleState = getTrainerBattleState();
      trainerBattleState.setupTrainerBattleId = id;
      trainerBattleState.setupSourceActionId = sourceActionId;
      trainerBattleState.setupTargetSlotIndex = -1;
      trainerBattleState.selectedTeamIds = buildInitialTrainerBattleSelectedTeamIds();
      openTrainerBattleSetupModal();
    } catch (error) {
      console.warn(
        `Impossible d'ouvrir le combat de dresseur ${id}:`,
        error instanceof Error ? error.message : String(error || ""),
      );
      setTopMessage("Impossible de preparer le combat contre Pierre.", 2200);
    }
  })();

  return true;
}

function renderTutorialModal() {
  if (!tutorialModalEl || !state.ui.tutorialOpen) {
    return;
  }
  const active = state.tutorial.active;
  const flow = getTutorialFlowDefinition(active?.flowId);
  if (!active || !flow) {
    return;
  }
  const pages = Array.isArray(flow.pages) ? flow.pages : [];
  const pageCount = Math.max(1, pages.length);
  const pageIndex = clamp(toSafeInt(active.pageIndex, 0), 0, pageCount - 1);
  state.tutorial.active.pageIndex = pageIndex;
  const page = pages[pageIndex] || pages[0] || { title: "Tuto", lines: [] };

  if (tutorialTitleEl) {
    tutorialTitleEl.textContent = flow.title || "Tuto";
  }
  if (tutorialPageTitleEl) {
    tutorialPageTitleEl.textContent = page.title || "";
  }
  if (tutorialProgressEl) {
    tutorialProgressEl.textContent = `Étape ${pageIndex + 1}/${pageCount}`;
  }
  if (tutorialBodyEl) {
    tutorialBodyEl.innerHTML = "";
    const lines = Array.isArray(page.lines) ? page.lines : [];
    if (lines.length <= 0) {
      const fallback = document.createElement("p");
      fallback.textContent = "Aucune information supplementaire.";
      tutorialBodyEl.appendChild(fallback);
    } else {
      const list = document.createElement("ul");
      list.className = "tutorial-list";
      for (const line of lines) {
        const item = document.createElement("li");
        item.textContent = String(line || "");
        list.appendChild(item);
      }
      tutorialBodyEl.appendChild(list);
    }
  }
  if (tutorialPrevButtonEl) {
    tutorialPrevButtonEl.disabled = pageIndex <= 0;
  }
  if (tutorialNextButtonEl) {
    tutorialNextButtonEl.textContent = pageIndex >= pageCount - 1 ? "Terminer" : "Suivant";
  }
}

function closeTutorialModal() {
  state.ui.tutorialOpen = false;
  state.tutorial.active = null;
  if (tutorialModalEl) {
    hideModalWithTween(tutorialModalEl);
  }
  if (tutorialBodyEl) {
    tutorialBodyEl.innerHTML = "";
  }
  tryOpenPendingDialogue();
  tryOpenPendingTutorialFlow();
  refreshZoneActionButtons();
}

function openTutorialFlow(flowId, initialPage = 0) {
  const flow = getTutorialFlowDefinition(flowId);
  if (!flow || !canOpenTutorialModalNow()) {
    return false;
  }
  if (isTutorialFlowSeen(flowId)) {
    return false;
  }
  markTutorialFlowSeen(flowId);
  hideHoverPopup();
  setMapOpen(false);
  setShopOpen(false);
  closeGachaModal({ force: true });
  closeBoxesModal();
  closePokedexModal();
  closeAppearanceModal();
  state.tutorial.active = {
    flowId: String(flowId),
    pageIndex: clamp(toSafeInt(initialPage, 0), 0, Math.max(0, (flow.pages?.length || 1) - 1)),
  };
  state.ui.tutorialOpen = true;
  showModalWithTween(tutorialModalEl);
  renderTutorialModal();
  persistSaveDataForSimulationEvent();
  return true;
}

function tryOpenPendingTutorialFlow() {
  if (!canOpenTutorialModalNow()) {
    return false;
  }
  while (Array.isArray(state.tutorial.queue) && state.tutorial.queue.length > 0) {
    const next = state.tutorial.queue.shift();
    const flowId = String(next?.flowId || "");
    if (!flowId || isTutorialFlowSeen(flowId)) {
      continue;
    }
    return openTutorialFlow(flowId, toSafeInt(next?.pageIndex, 0));
  }
  return false;
}

function queueRoute1TutorialIfNeeded(routeId = state.routeData?.route_id) {
  if (!state.saveData || String(routeId || "") !== ROUTE_1_TUTORIAL_ID) {
    return false;
  }
  const queued = enqueueTutorialFlow(TUTORIAL_FLOW_ROUTE_1);
  if (queued) {
    tryOpenPendingTutorialFlow();
  }
  return queued;
}

function queueEvolutionTutorialIfNeeded() {
  if (!state.saveData) {
    return false;
  }
  const queued = enqueueTutorialFlow(TUTORIAL_FLOW_EVOLUTION);
  if (queued) {
    tryOpenPendingTutorialFlow();
  }
  return queued;
}

function queueAppearanceTutorialIfNeeded() {
  if (!state.saveData || !hasUnlockedEntityAtLeastLevel(APPEARANCE_UNLOCK_LEVEL)) {
    return false;
  }
  const queued = enqueueTutorialFlow(TUTORIAL_FLOW_APPEARANCE);
  if (queued) {
    tryOpenPendingTutorialFlow();
  }
  return queued;
}

function ensureAppearanceEditorUnlockedFromProgress() {
  if (!state.saveData) {
    return false;
  }
  const tutorials = getTutorialProgress();
  if (tutorials.appearance_editor_unlocked) {
    queueAppearanceTutorialIfNeeded();
    return false;
  }
  if (!hasUnlockedEntityAtLeastLevel(APPEARANCE_UNLOCK_LEVEL)) {
    return false;
  }
  tutorials.appearance_editor_unlocked = true;
  queueAppearanceTutorialIfNeeded();
  return true;
}

const browserSaveStorage = createBrowserSaveStorage({
  getWindowObject: () => window,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
});

function getBrowserStorageArea(areaName) {
  return browserSaveStorage.getBrowserStorageArea(areaName);
}

function readRawSaveDataFromStorageKey(areaName, key, contextLabel) {
  return browserSaveStorage.readRawSaveDataFromStorageKey(areaName, key, contextLabel);
}

function readSaveDataFromStorageKey(areaName, key, contextLabel) {
  return browserSaveStorage.readSaveDataFromStorageKey(areaName, key, contextLabel);
}

function writeSerializedSaveToStorageKey(areaName, key, serializedSave) {
  return browserSaveStorage.writeSerializedSaveToStorageKey(areaName, key, serializedSave);
}

function removeSaveDataFromStorageKey(areaName, key) {
  return browserSaveStorage.removeSaveDataFromStorageKey(areaName, key);
}

function readFirstRawSaveDataFromStorageKeys(areaName, keyEntries = []) {
  for (const entry of Array.isArray(keyEntries) ? keyEntries : []) {
    const key = String(entry?.key || "").trim();
    if (!key) {
      continue;
    }
    const payload = readRawSaveDataFromStorageKey(
      areaName,
      key,
      String(entry?.label || `${areaName} save`),
    );
    if (payload) {
      return payload;
    }
  }
  return null;
}

function readSaveDataFromLocalStorage() {
  return readSaveDataFromStorageKey("localStorage", SAVE_KEY, "localStorage save");
}

function readRawLegacySaveDataFromLocalStorage() {
  return readFirstRawSaveDataFromStorageKeys("localStorage", [
    { key: LEGACY_SAVE_KEY, label: "legacy localStorage save" },
    { key: ANCIENT_LEGACY_SAVE_KEY, label: "ancient legacy localStorage save" },
  ]);
}

function readRawLegacySaveDataFromSessionStorage() {
  return readFirstRawSaveDataFromStorageKeys("sessionStorage", [
    { key: LEGACY_SAVE_SESSION_KEY, label: "legacy sessionStorage save" },
    { key: ANCIENT_LEGACY_SAVE_SESSION_KEY, label: "ancient legacy sessionStorage save" },
  ]);
}

function removeLegacySaveDataFromLocalStorage() {
  let removed = false;
  for (const key of [LEGACY_SAVE_KEY, ANCIENT_LEGACY_SAVE_KEY]) {
    if (!String(key || "").trim()) {
      continue;
    }
    removed = removeSaveDataFromStorageKey("localStorage", key) || removed;
  }
  return removed;
}

function removeLegacySaveDataFromSessionStorage() {
  let removed = false;
  for (const key of [LEGACY_SAVE_SESSION_KEY, ANCIENT_LEGACY_SAVE_SESSION_KEY]) {
    if (!String(key || "").trim()) {
      continue;
    }
    removed = removeSaveDataFromStorageKey("sessionStorage", key) || removed;
  }
  return removed;
}

async function readSaveDataFromDesktopBridge() {
  return desktopBridgeSaveStorage.readSaveDataFromDesktopBridge();
}

async function writeSerializedSaveToDesktopBridge(serializedSave) {
  return desktopBridgeSaveStorage.writeSerializedSaveToDesktopBridge(serializedSave);
}

async function deleteSaveDataFromDesktopBridge() {
  return desktopBridgeSaveStorage.deleteSaveDataFromDesktopBridge();
}

function getLegacySpeciesLoadTargetById(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0 || !(state.pokedexSpeciesCsvByPokemonId instanceof Map)) {
    return null;
  }
  const rawSpecies = state.pokedexSpeciesCsvByPokemonId.get(id);
  const nameEn = String(rawSpecies?.nameEn || rawSpecies?.name_en || "").toLowerCase().trim();
  if (!nameEn) {
    return null;
  }
  return {
    id,
    nameEn,
  };
}

async function ensurePokemonDefinitionsLoadedForSpeciesIds(speciesIds) {
  const defsById = state.pokemonDefsById instanceof Map ? new Map(state.pokemonDefsById) : new Map();
  const queue = [];
  const queuedIds = new Set();

  const enqueue = (pokemonId, nameEn = "") => {
    const id = Number(pokemonId || 0);
    const normalizedNameEn = String(nameEn || "").toLowerCase().trim();
    if (id <= 0 || !normalizedNameEn || defsById.has(id) || queuedIds.has(id)) {
      return;
    }
    queuedIds.add(id);
    queue.push({
      id,
      nameEn: normalizedNameEn,
    });
  };

  for (const rawPokemonId of Array.isArray(speciesIds) ? speciesIds : []) {
    const target = getLegacySpeciesLoadTargetById(rawPokemonId);
    if (target) {
      enqueue(target.id, target.nameEn);
    }
  }

  while (queue.length > 0) {
    const batch = queue.splice(0, Math.min(18, queue.length));
    const loadedBatch = await Promise.all(batch.map(async (entry) => {
      try {
        return await loadPokemonEntity(buildPokemonJsonPath(entry.id, entry.nameEn));
      } catch {
        return null;
      }
    }));

    for (const def of loadedBatch) {
      if (!def || defsById.has(def.id)) {
        continue;
      }
      defsById.set(def.id, def);
      if (def.evolvesFrom?.id > 0 && def.evolvesFrom.nameEn) {
        enqueue(def.evolvesFrom.id, def.evolvesFrom.nameEn);
      }
      for (const target of Array.isArray(def.evolvesTo) ? def.evolvesTo : []) {
        if (target?.id > 0 && target.nameEn) {
          enqueue(target.id, target.nameEn);
        }
      }
    }
  }

  applyPokemonTalentCsvToDefinitions(defsById);
  state.pokemonDefsById = defsById;
}

async function createSaveFromLegacyRawSave(rawLegacySave) {
  const nextSave = createEmptySave();
  const legacyAppearance = extractLegacyAppearanceSpecies(rawLegacySave);
  const legacySpeciesIds = Array.from(new Set([
    ...legacyAppearance.shinySpeciesIds,
    ...legacyAppearance.ultraShinySpeciesIds,
  ]));

  if (legacySpeciesIds.length > 0) {
    await ensurePokemonDefinitionsLoadedForSpeciesIds(legacySpeciesIds);
  }

  nextSave.legacy_shiny_family_root_ids = canonicalizeLegacyAppearanceFamilyRootIds(
    legacyAppearance.shinySpeciesIds,
    state.pokemonDefsById,
  );
  nextSave.legacy_ultra_shiny_family_root_ids = canonicalizeLegacyAppearanceFamilyRootIds(
    legacyAppearance.ultraShinySpeciesIds,
    state.pokemonDefsById,
  );
  return nextSave;
}

function getDevSeedSaveUrl() {
  if (isProductionGithubPagesLocation(window.location)) {
    return "";
  }

  try {
    const currentUrl = new URL(window.location.href);
    const rawValue = currentUrl.searchParams.get(DEV_SEED_SAVE_QUERY_PARAM);
    if (!rawValue) {
      return "";
    }
    const resolved = new URL(rawValue, currentUrl.href);
    return resolved.origin === currentUrl.origin ? resolved.toString() : "";
  } catch {
    return "";
  }
}

async function readSeededDevSaveData() {
  const seedUrl = getDevSeedSaveUrl();
  if (!seedUrl) {
    return null;
  }

  try {
    const response = await fetch(seedUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const saveRaw = parseSerializedSave(await response.text(), "dev seeded save");
    if (!isRawSaveSupported(saveRaw)) {
      return null;
    }
    return normalizeSave(saveRaw);
  } catch (error) {
    console.warn("Dev seed save ignoree:", error?.message || error);
    return null;
  }
}

const desktopBridgeSaveStorage = createDesktopBridgeSaveStorage({
  hasDesktopSaveBridge,
  getDesktopBridge,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
  setDesktopBridgeAvailable: (available) => {
    state.saveBackend.desktopBridgeAvailable = available;
  },
});

const legacyDesktopBridgeSaveStorage = createDesktopBridgeSaveStorage({
  hasDesktopSaveBridge,
  getDesktopBridge,
  parseSerializedSave,
  isRawSaveSupported: () => true,
  normalizeSave: (saveData) => saveData,
  readSaveMethodName: "readLegacySave",
  deleteSaveMethodName: "deleteLegacySave",
});

const indexedDbSaveStorage = createIndexedDbSaveStorage({
  getWindowObject: () => window,
  indexedDbName: SAVE_INDEXED_DB_NAME,
  indexedDbStoreName: SAVE_INDEXED_DB_STORE_NAME,
  indexedDbRecordKey: SAVE_INDEXED_DB_RECORD_KEY,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
  setIndexedDbAvailable: (available) => {
    state.saveBackend.indexedDbAvailable = available;
  },
  nowMs: () => Date.now(),
});

const legacyIndexedDbSaveStorage = createIndexedDbSaveStorage({
  getWindowObject: () => window,
  indexedDbName: LEGACY_SAVE_INDEXED_DB_NAME,
  indexedDbStoreName: SAVE_INDEXED_DB_STORE_NAME,
  indexedDbRecordKey: SAVE_INDEXED_DB_RECORD_KEY,
  parseSerializedSave,
  isRawSaveSupported: () => true,
  normalizeSave: (saveData) => saveData,
  nowMs: () => Date.now(),
});

const ancientLegacyIndexedDbSaveStorage = createIndexedDbSaveStorage({
  getWindowObject: () => window,
  indexedDbName: ANCIENT_LEGACY_SAVE_INDEXED_DB_NAME,
  indexedDbStoreName: SAVE_INDEXED_DB_STORE_NAME,
  indexedDbRecordKey: SAVE_INDEXED_DB_RECORD_KEY,
  parseSerializedSave,
  isRawSaveSupported: () => true,
  normalizeSave: (saveData) => saveData,
  nowMs: () => Date.now(),
});

function hasIndexedDbSaveSupport() {
  return indexedDbSaveStorage.hasIndexedDbSaveSupport();
}

async function openSaveIndexedDb() {
  return indexedDbSaveStorage.openSaveIndexedDb();
}

async function readSaveDataFromIndexedDb() {
  return indexedDbSaveStorage.readSaveDataFromIndexedDb();
}

async function readRawLegacySaveDataFromDesktopBridge() {
  return legacyDesktopBridgeSaveStorage.readRawSaveDataFromDesktopBridge();
}

async function deleteLegacySaveDataFromDesktopBridge() {
  return legacyDesktopBridgeSaveStorage.deleteSaveDataFromDesktopBridge();
}

async function readRawLegacySaveDataFromIndexedDb() {
  return (
    await legacyIndexedDbSaveStorage.readRawSaveDataFromIndexedDb("legacy indexedDB save")
    || await ancientLegacyIndexedDbSaveStorage.readRawSaveDataFromIndexedDb("ancient legacy indexedDB save")
  );
}

async function writeSerializedSaveToIndexedDb(serializedSave) {
  return indexedDbSaveStorage.writeSerializedSaveToIndexedDb(serializedSave);
}

async function deleteSaveDataFromIndexedDb() {
  return indexedDbSaveStorage.deleteSaveDataFromIndexedDb();
}

async function deleteLegacySaveDataFromIndexedDb() {
  const results = await Promise.allSettled([
    legacyIndexedDbSaveStorage.deleteSaveDataFromIndexedDb(),
    ancientLegacyIndexedDbSaveStorage.deleteSaveDataFromIndexedDb(),
  ]);
  return results.some((result) => result.status === "fulfilled" && result.value);
}

const runtimeSaveSystem = createRuntimeSaveSystem({
  state,
  hasIndexedDbSaveSupport,
  hasDesktopSaveBridge,
  serializeSaveData,
  readSaveDataFromDesktopBridge,
  readSaveDataFromLocalStorage,
  readSaveDataFromIndexedDb,
  readRawLegacySaveDataFromDesktopBridge,
  readRawLegacySaveDataFromLocalStorage,
  readRawLegacySaveDataFromSessionStorage,
  readRawLegacySaveDataFromIndexedDb,
  writeSerializedSaveToIndexedDb,
  writeSerializedSaveToDesktopBridge,
  writeSerializedSaveToStorageKey,
  removeLegacySaveDataFromLocalStorage,
  removeLegacySaveDataFromSessionStorage,
  deleteLegacySaveDataFromIndexedDb,
  deleteLegacySaveDataFromDesktopBridge,
  pickPreferredSaveCandidate,
  createEmptySave,
  createSaveFromLegacyRawSave,
  repairNormalizedSaveSnapshot,
  readSeededDevSaveData,
  saveVersion: SAVE_VERSION,
  appVersion: APP_VERSION,
  saveKey: SAVE_KEY,
  saveSourceDesktop: SAVE_SOURCE_DESKTOP,
  saveSourceLocalStorage: SAVE_SOURCE_LOCAL_STORAGE,
  saveSourceSessionStorage: SAVE_SOURCE_SESSION_STORAGE,
  saveSourceIndexedDb: SAVE_SOURCE_INDEXED_DB,
  saveBackendLabelBrowser: SAVE_BACKEND_LABEL_BROWSER,
  saveBackendLabelDesktop: SAVE_BACKEND_LABEL_DESKTOP,
  saveBackendLabelUnavailable: SAVE_BACKEND_LABEL_UNAVAILABLE,
  saveBackendValueEl,
  setTimeoutFn: window.setTimeout.bind(window),
  clearTimeoutFn: window.clearTimeout.bind(window),
  toSafeInt,
  nowMs: () => Date.now(),
});

function clearBrowserSaveRetry() {
  runtimeSaveSystem.clearBrowserSaveRetry();
}

function clearDesktopSaveRetry() {
  runtimeSaveSystem.clearDesktopSaveRetry();
}

function refreshSaveBackendStatus() {
  runtimeSaveSystem.refreshSaveBackendStatus();
}

function queueBrowserSaveWrite(serializedSave) {
  runtimeSaveSystem.queueBrowserSaveWrite(serializedSave);
}

function queueDesktopSaveWrite(serializedSave) {
  runtimeSaveSystem.queueDesktopSaveWrite(serializedSave);
}

function syncSerializedSaveToBrowserStorage(serializedSave) {
  return runtimeSaveSystem.syncSerializedSaveToBrowserStorage(serializedSave);
}

function updateSaveBackendIndicator() {
  runtimeSaveSystem.updateSaveBackendIndicator();
}

function getSaveBackendTelemetryValue() {
  return runtimeSaveSystem.getSaveBackendTelemetryValue();
}

function getSaveTickEpochMs(savePayload) {
  return runtimeSaveSystem.getSaveTickEpochMs(savePayload);
}

async function loadSaveData() {
  return runtimeSaveSystem.loadSaveData();
}

function persistSaveData(_options = {}) {
  runtimeSaveSystem.persistSaveData();
  state.backgroundRuntime.lastPersistAtMs = Date.now();
  syncBackgroundRuntimeDebugOverlay();
}

function persistSaveDataForSimulationEvent() {
  if (state.simulationIdleMode) {
    state.deferredSaveDirty = true;
    return;
  }
  persistSaveData();
}

function flushDeferredSaveIfNeeded() {
  if (!state.deferredSaveDirty) {
    return;
  }
  state.deferredSaveDirty = false;
  persistSaveData();
}

let desktopRuntimeWatchdogHandle = null;
let desktopWindowStateBridgeUnsubscribe = null;
let capacitorAppStateBridgeUnsubscribe = null;

function isDocumentHidden() {
  return typeof document !== "undefined" && Boolean(document.hidden);
}

function isRuntimeBackgroundActivity(activityState = state.backgroundRuntime.activityState) {
  return activityState === RUNTIME_ACTIVITY_BACKGROUND_LIVE || activityState === RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED;
}

function getCurrentRuntimeActivityState() {
  return String(state.backgroundRuntime?.activityState || RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);
}

function syncDesktopWindowState(windowState = null) {
  const nextWindowState = normalizeDesktopWindowState(
    windowState || state.desktopWindowState || DEFAULT_DESKTOP_WINDOW_STATE,
  );
  state.desktopWindowState = nextWindowState;
  return nextWindowState;
}

function readDesktopWindowState() {
  if (!isDesktopRuntime()) {
    return syncDesktopWindowState(DEFAULT_DESKTOP_WINDOW_STATE);
  }
  const bridgeWindowState = getDesktopWindowState();
  if (bridgeWindowState && typeof bridgeWindowState === "object") {
    return syncDesktopWindowState(bridgeWindowState);
  }
  return syncDesktopWindowState(state.desktopWindowState || DEFAULT_DESKTOP_WINDOW_STATE);
}

function isDesktopWindowBackgrounded() {
  if (!isDesktopRuntime()) {
    return false;
  }
  const windowState = readDesktopWindowState();
  return Boolean(isDesktopWindowStateBackgrounded(windowState) || isDocumentHidden());
}

function updateCapacitorAppActiveState(isActive, source = "") {
  if (typeof isActive !== "boolean") {
    return;
  }
  state.backgroundRuntime.capacitorAppActive = isActive;
  state.backgroundRuntime.capacitorAppSource = String(source || "");
  state.backgroundRuntime.capacitorAppUpdatedAtMs = Date.now();
}

function setBackgroundSuspendRequested(nextValue, source = "") {
  state.backgroundRuntime.suspendRequested = Boolean(nextValue);
  if (source) {
    state.backgroundRuntime.lastLifecycleSource = String(source);
  }
}

function readRuntimeActivitySnapshot(overrides = {}) {
  return getRuntimeActivitySnapshot({
    documentRef: document,
    desktopWindowState: overrides.desktopWindowState
      || (isDesktopRuntime() ? readDesktopWindowState() : state.desktopWindowState || DEFAULT_DESKTOP_WINDOW_STATE),
    capacitorAppState: {
      isActive: typeof overrides.capacitorAppActive === "boolean"
        ? overrides.capacitorAppActive
        : state.backgroundRuntime.capacitorAppActive,
    },
    suspendRequested: typeof overrides.suspendRequested === "boolean"
      ? overrides.suspendRequested
      : state.backgroundRuntime.suspendRequested,
  });
}

function shouldTreatRuntimeAsHidden() {
  return isRuntimeBackgroundActivity(getCurrentRuntimeActivityState());
}

function shouldRunBackgroundTicker() {
  return !isDesktopRuntime() && getCurrentRuntimeActivityState() === RUNTIME_ACTIVITY_BACKGROUND_LIVE;
}

function markSimulationPump(nowMs = Date.now()) {
  state.lastSimulationPumpAtMs = Math.max(0, toSafeInt(nowMs, Date.now()));
  syncBackgroundRuntimeDebugOverlay();
}

const runtimeLoopKernel = createRuntimeLoopKernel({
  state,
  update,
  updateHud,
  persistSaveData,
  getCurrentAttackIntervalMs,
  getForegroundSimulationBudgetMs,
  getSaveTickEpochMs,
  toSafeInt,
  isHidden: shouldTreatRuntimeAsHidden,
  getActivityState: getCurrentRuntimeActivityState,
  nowMs: () => Date.now(),
  workNowMs: () => (typeof performance?.now === "function" ? performance.now() : Date.now()),
  maxForegroundPendingMs: MAX_FOREGROUND_PENDING_MS,
  maxOfflineCatchupMs: MAX_OFFLINE_CATCHUP_MS,
  maxResumeCatchupMs: MAX_RESUME_CATCHUP_MS,
  hiddenSimBudgetMs: HIDDEN_SIM_BUDGET_MS,
  bulkIdleThresholdMs: BULK_IDLE_THRESHOLD_MS,
  foregroundFrameStepMs: FOREGROUND_FRAME_STEP_MS,
  backgroundTickIntervalMs: BACKGROUND_TICK_INTERVAL_MS,
  hudAutoRefreshIntervalMs: HUD_AUTO_REFRESH_INTERVAL_MS,
});

function queueRealtimeElapsedMs(nowMs = Date.now(), options = {}) {
  return runtimeLoopKernel.queueRealtimeElapsedMs(nowMs, {
    activityState: options.activityState || getCurrentRuntimeActivityState(),
    ...options,
  });
}

function queueOfflineCatchupFromSave(nowMs = Date.now()) {
  return runtimeLoopKernel.queueOfflineCatchupFromSave(nowMs);
}

function queueResumeCatchupFromRealtime(nowMs = Date.now(), options = {}) {
  return runtimeLoopKernel.queueResumeCatchupFromRealtime(nowMs, {
    activityState: options.activityState || getCurrentRuntimeActivityState(),
    ...options,
  });
}

function consumePendingSimulation(options = {}) {
  const consumedMs = runtimeLoopKernel.consumePendingSimulation({
    activityState: options.activityState || getCurrentRuntimeActivityState(),
    ...options,
  });
  if (Math.max(0, Number(state.pendingSimMs) || 0) <= 0.5) {
    stopForegroundCatchupPump();
  }
  syncBackgroundRuntimeDebugOverlay();
  return consumedMs;
}

function tickSimulationFromRealtime(options = {}) {
  const consumedMs = runtimeLoopKernel.tickSimulationFromRealtime({
    activityState: options.activityState || getCurrentRuntimeActivityState(),
    ...options,
  });
  if (Math.max(0, Number(state.pendingSimMs) || 0) <= 0.5) {
    stopForegroundCatchupPump();
  }
  syncBackgroundRuntimeDebugOverlay();
  return consumedMs;
}

function ensureBackgroundTicker() {
  if (state.backgroundTickHandle || !shouldRunBackgroundTicker()) {
    return;
  }
  state.backgroundTickHandle = window.setInterval(() => {
    if (getCurrentRuntimeActivityState() !== RUNTIME_ACTIVITY_BACKGROUND_LIVE) {
      return;
    }
    const now = Date.now();
    tickSimulationFromRealtime({
      forceIdleMode: true,
      budgetMs: HIDDEN_SIM_BUDGET_MS,
      maxWorkMs: BACKGROUND_PUMP_MAX_WORK_MS,
      activityState: RUNTIME_ACTIVITY_BACKGROUND_LIVE,
    });
    markSimulationPump(now);
  }, BACKGROUND_TICK_INTERVAL_MS);
  syncBackgroundRuntimeDebugOverlay();
}

function stopBackgroundTicker() {
  if (!state.backgroundTickHandle) {
    return;
  }
  window.clearInterval(state.backgroundTickHandle);
  state.backgroundTickHandle = null;
  syncBackgroundRuntimeDebugOverlay();
}

function shouldRunForegroundCatchupPump(activityState = getCurrentRuntimeActivityState()) {
  if (state.mode !== "ready") {
    return false;
  }
  if (Math.max(0, Number(state.pendingSimMs) || 0) <= 0.5) {
    return false;
  }
  return (
    activityState !== RUNTIME_ACTIVITY_BACKGROUND_LIVE
    && activityState !== RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED
  );
}

function stopForegroundCatchupPump() {
  if (!state.foregroundCatchupPumpHandle) {
    return;
  }
  window.clearTimeout(state.foregroundCatchupPumpHandle);
  state.foregroundCatchupPumpHandle = null;
  syncBackgroundRuntimeDebugOverlay();
}

function ensureForegroundCatchupPump(delayMs = FOREGROUND_CATCHUP_PUMP_DELAY_MS) {
  if (state.foregroundCatchupPumpHandle) {
    return;
  }
  const activityState = getCurrentRuntimeActivityState();
  if (!shouldRunForegroundCatchupPump(activityState)) {
    stopForegroundCatchupPump();
    return;
  }

  const normalizedDelayMs = Math.max(0, toSafeInt(delayMs, FOREGROUND_CATCHUP_PUMP_DELAY_MS));
  state.foregroundCatchupPumpHandle = window.setTimeout(() => {
    state.foregroundCatchupPumpHandle = null;
    const pumpActivityState = getCurrentRuntimeActivityState();
    if (!shouldRunForegroundCatchupPump(pumpActivityState)) {
      syncBackgroundRuntimeDebugOverlay();
      return;
    }

    const now = Date.now();
    const consumedMs = consumePendingSimulation({
      activityState: pumpActivityState,
      forceIdleMode: true,
      budgetMs: HIDDEN_SIM_BUDGET_MS,
      maxWorkMs: FOREGROUND_CATCHUP_PUMP_MAX_WORK_MS,
    });
    if (consumedMs > 0) {
      markSimulationPump(now);
    }
    render();

    if (shouldRunForegroundCatchupPump(pumpActivityState)) {
      ensureForegroundCatchupPump(FOREGROUND_CATCHUP_PUMP_DELAY_MS);
    } else {
      syncBackgroundRuntimeDebugOverlay();
    }
  }, normalizedDelayMs);
  syncBackgroundRuntimeDebugOverlay();
}

function ensureDesktopRuntimeWatchdog() {
  if (!isDesktopRuntime() || desktopRuntimeWatchdogHandle) {
    return;
  }
  desktopRuntimeWatchdogHandle = window.setInterval(() => {
    if (!isDesktopRuntime()) {
      return;
    }
    if (getCurrentRuntimeActivityState() !== RUNTIME_ACTIVITY_BACKGROUND_LIVE) {
      return;
    }
    const now = Date.now();
    const lastPumpAtMs = Math.max(0, toSafeInt(state.lastSimulationPumpAtMs, 0));
    if (lastPumpAtMs > 0 && now - lastPumpAtMs < DESKTOP_BACKGROUND_WATCHDOG_STALL_MS) {
      return;
    }
    const elapsedSinceLastPumpMs = lastPumpAtMs > 0
      ? now - lastPumpAtMs
      : DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS;
    const budgetMs = Math.max(DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS, elapsedSinceLastPumpMs);
    tickSimulationFromRealtime({
      budgetMs,
      forceIdleMode: true,
      maxWorkMs: BACKGROUND_PUMP_MAX_WORK_MS,
      activityState: RUNTIME_ACTIVITY_BACKGROUND_LIVE,
    });
    markSimulationPump(now);
  }, DESKTOP_BACKGROUND_WATCHDOG_INTERVAL_MS);
}

const runtimeOrchestrator = createRuntimeOrchestrator({
  state,
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
  shouldFreezeBackgroundSimulation: () => isTrainerBattleActive(),
  hiddenSimBudgetMs: HIDDEN_SIM_BUDGET_MS,
  backgroundPumpMaxWorkMs: BACKGROUND_PUMP_MAX_WORK_MS,
  foregroundCatchupPumpMaxWorkMs: FOREGROUND_CATCHUP_PUMP_MAX_WORK_MS,
  maxResumeCatchupMs: MAX_RESUME_CATCHUP_MS,
  backgroundPersistDebounceMs: BACKGROUND_PERSIST_DEBOUNCE_MS,
  markSimulationPump,
  nowMs: () => Date.now(),
  toSafeInt,
});

function syncBackgroundRuntimeDebugOverlay() {
  if (!backgroundRuntimeDebugOverlayEl) {
    return;
  }
  if (!state.backgroundRuntime.debugOverlayEnabled) {
    backgroundRuntimeDebugOverlayEl.classList.add("hidden");
    backgroundRuntimeDebugOverlayEl.setAttribute("aria-hidden", "true");
    return;
  }
  const snapshot = readRuntimeActivitySnapshot();
  const lines = [
    `activity=${snapshot.activityState}`,
    `pending=${Math.round(Math.max(0, Number(state.pendingSimMs) || 0))}ms`,
    `resume=${Math.round(Math.max(0, Number(state.backgroundRuntime.lastResumeCatchupMs) || 0))}ms`,
    `catchup=${state.foregroundCatchupPumpHandle ? "scheduled" : "idle"}`,
    `bg=${Math.max(0, toSafeInt(state.backgroundRuntime.lastBackgroundEnteredAtMs, 0))}`,
    `persist=${Math.max(0, toSafeInt(state.backgroundRuntime.lastPersistAtMs, 0))}`,
    `reason=${snapshot.backgroundReason || state.backgroundRuntime.lastBackgroundReason || "-"}`,
    `desktop=${state.desktopWindowState?.backgrounded ? "backgrounded" : "foreground"}`,
    `capacitor=${typeof state.backgroundRuntime.capacitorAppActive === "boolean" ? state.backgroundRuntime.capacitorAppActive : "unknown"}`,
  ];
  backgroundRuntimeDebugOverlayEl.textContent = lines.join("\n");
  backgroundRuntimeDebugOverlayEl.classList.remove("hidden");
  backgroundRuntimeDebugOverlayEl.setAttribute("aria-hidden", "false");
}

function applyRuntimeActivityTransition(source, overrides = {}) {
  const result = runtimeOrchestrator.handleRuntimeActivityChange(readRuntimeActivitySnapshot(overrides), {
    source,
  });
  syncBackgroundRuntimeDebugOverlay();
  return result;
}

function handleVisibilityChange() {
  return applyRuntimeActivityTransition("visibilitychange");
}

function handleRuntimeLifecycleSignal({ source = "window", kind = "", event = null, isActive = null } = {}) {
  const normalizedSource = String(source || "window");
  const normalizedKind = String(kind || "").trim();
  const lifecycleSource = normalizedKind ? `${normalizedSource}:${normalizedKind}` : normalizedSource;

  if (normalizedSource === "capacitor") {
    updateCapacitorAppActiveState(typeof isActive === "boolean" ? isActive : null, lifecycleSource);
    if (normalizedKind === "pause") {
      setBackgroundSuspendRequested(true, lifecycleSource);
    } else if (normalizedKind === "resume") {
      setBackgroundSuspendRequested(false, lifecycleSource);
    } else if (normalizedKind === "appStateChange" && typeof isActive === "boolean") {
      setBackgroundSuspendRequested(!isActive, lifecycleSource);
    }
  } else if (normalizedKind === "freeze") {
    setBackgroundSuspendRequested(true, lifecycleSource);
  } else if (
    normalizedKind === "resume"
    || normalizedKind === "pageshow"
    || normalizedKind === "focus"
    || (normalizedKind === "visibilitychange" && !isDocumentHidden())
  ) {
    setBackgroundSuspendRequested(false, lifecycleSource);
  } else if (normalizedKind === "pagehide" && event?.persisted === true) {
    setBackgroundSuspendRequested(true, lifecycleSource);
  }

  const result = applyRuntimeActivityTransition(lifecycleSource);
  if (shouldForceLifecyclePersistAfterTransition({
    source: normalizedSource,
    kind: normalizedKind,
    activityState: result?.activityState,
  })) {
    handlePageLifecyclePersist(lifecycleSource);
  }
  return result;
}

function handleDesktopWindowStateChange(nextWindowState = null) {
  const windowState = syncDesktopWindowState(nextWindowState);
  return applyRuntimeActivityTransition("desktop_window_state", {
    desktopWindowState: windowState,
  });
}

function initializeDesktopWindowStateBridge() {
  if (!isDesktopRuntime()) {
    syncDesktopWindowState(DEFAULT_DESKTOP_WINDOW_STATE);
    return;
  }
  syncDesktopWindowState(readDesktopWindowState());
  if (typeof desktopWindowStateBridgeUnsubscribe === "function") {
    desktopWindowStateBridgeUnsubscribe();
    desktopWindowStateBridgeUnsubscribe = null;
  }
  const bridge = getDesktopBridge();
  if (!bridge || typeof bridge.onWindowStateChanged !== "function") {
    return;
  }
  const unsubscribe = bridge.onWindowStateChanged((windowState) => {
    handleDesktopWindowStateChange(windowState);
  });
  if (typeof unsubscribe === "function") {
    desktopWindowStateBridgeUnsubscribe = unsubscribe;
  }
}

function initializeCapacitorLifecycleBridge() {
  if (typeof capacitorAppStateBridgeUnsubscribe === "function") {
    capacitorAppStateBridgeUnsubscribe();
    capacitorAppStateBridgeUnsubscribe = null;
  }
  if (!isCapacitorAndroidRuntime() || !getCapacitorAppPlugin()) {
    return;
  }
  state.backgroundRuntime.capacitorAppActive = true;
  state.backgroundRuntime.capacitorAppSource = "bootstrap";
  state.backgroundRuntime.capacitorAppUpdatedAtMs = Date.now();
  capacitorAppStateBridgeUnsubscribe = subscribeCapacitorAppState((payload) => {
    handleRuntimeLifecycleSignal({
      source: "capacitor",
      kind: payload?.source || "appStateChange",
      event: payload?.event || null,
      isActive: payload?.isActive,
    });
  });
}

function handlePageLifecyclePersist(source = "pagehide") {
  setBackgroundSuspendRequested(true, source);
  runtimeOrchestrator.handlePageLifecyclePersist(readRuntimeActivitySnapshot(), {
    source,
  });
  syncBackgroundRuntimeDebugOverlay();
}

const {
  rewardProgressionSystem,
  runtimeNotificationSystem,
  routeEncounterCombatSystem,
  battleLifecycleSystem,
  runtimeHudSystem,
} = createRuntimeCompositionRoot({
  rewardProgressionDeps: {
    state,
    ensureMoneyAndItems,
    toSafeInt,
    clamp,
    maxTeamSize: MAX_TEAM_SIZE,
    enemyHpTeamScaleExponent: ENEMY_HP_TEAM_SCALE_EXPONENT,
    enemyHpTeamScaleMaxBonus: ENEMY_HP_TEAM_SCALE_MAX_BONUS,
    enemyRewardScaleExponent: ENEMY_REWARD_SCALE_EXPONENT,
    enemyRewardScaleBlend: ENEMY_REWARD_SCALE_BLEND,
    captureXpBase: CAPTURE_XP_BASE,
    captureXpLevelMult: CAPTURE_XP_LEVEL_MULT,
    captureXpStatFactor: CAPTURE_XP_STAT_FACTOR,
    enemyMoneyBase: ENEMY_MONEY_BASE,
    enemyMoneyLevelMult: ENEMY_MONEY_LEVEL_MULT,
    enemyMoneyStatFactor: ENEMY_MONEY_STAT_FACTOR,
    maxLevel: MAX_LEVEL,
    appearanceUnlockLevel: APPEARANCE_UNLOCK_LEVEL,
    getPokemonEntityRecord,
    getTalentMoneyMultiplier,
    getBaseStatTotal,
    getXpToNextLevelForSpecies,
    setEntityLevel,
    ensureSpeciesStats,
    findNextEligibleEvolution,
    enqueueEvolutionReadyNotification,
    getPokemonDisplayNameById: (pokemonId) => runtimeUiInteractionFacade.getPokemonDisplayNameById(pokemonId),
    ensureAppearanceEditorUnlockedFromProgress,
  },
  notificationDeps: {
    state,
    toSafeInt,
    normalizeUiDisplayText,
    nextNotificationId,
    renderNotificationStackUi,
  },
  routeEncounterCombatDeps: {
    state,
    isCurrentRouteCombatEnabled,
    pickEncounterForCurrentRoute,
    encounterHasMethod,
    getEncounterMethods,
    pickEncounterLevel,
    computeStatsAtLevel,
    computeBattleHpMax,
    getActiveTeamSizeForBalance,
    getEnemyHpTeamScaleMultiplier,
    getEnemyRewardScaleMultiplier,
    resolveSpriteAppearanceForEntity,
    getSpriteVariantById,
    getDefaultSpriteVariantId,
    getCachedSpriteImage,
    isDrawableImage,
    normalizeStatsPayload,
    shouldForceUltraShinyAllPokemon,
    getRouteUnlockProgressState,
    toSafeInt,
    defaultRouteId: DEFAULT_ROUTE_ID,
    onlyOneEncounterHpMultiplier: ONLY_ONE_ENCOUNTER_HP_MULTIPLIER,
    onlyOneEncounterTimerMs: ONLY_ONE_ENCOUNTER_TIMER_MS,
    onlyOneEncounterMethodId: ENCOUNTER_METHOD_ONLY_ONE,
    enemyTimerStyleOnlyOne: ENEMY_TIMER_STYLE_ONLY_ONE,
    enemyTimerStyleRoute: ENEMY_TIMER_STYLE_ROUTE,
    ultraShinyOdds: ULTRA_SHINY_ODDS,
    nonUltraShinyOddsNumerator: NON_ULTRA_SHINY_ODDS_NUMERATOR,
    nonUltraShinyOddsDenominator: NON_ULTRA_SHINY_ODDS_DENOMINATOR,
  },
  battleLifecycleDeps: {
    state,
    hydrateTeamFromSave,
    syncActiveEnemyAppearance,
    refreshLayoutIfNeeded,
    createBattleManager: (options) => new PokemonBattleManager(options),
    getCurrentAttackIntervalMs,
    getBattleSourceKind: getCurrentBattleSourceKind,
    canStartBattleForSource,
    canTeamAttackForBattleSource,
    createEnemyInstanceForSource,
    createRouteEnemyInstance,
    handleEnemySpawn,
    handleEnemyDefeated,
    getEnemyTimerConfigForBattle,
    handleEnemyTimerExpired,
    isCurrentRouteCombatEnabled,
    hideHoverPopup: () => runtimeUiInteractionFacade.hideHoverPopup(),
  },
  runtimeHudDeps: {
    state,
    ensureMoneyAndItems,
    toSafeInt,
    setMoneyCounterTextValue,
    setCoinsCounterTextValue,
    refreshMoneyCounterTransform,
    refreshShopWalletPanel,
    updateSaveBackendIndicator,
    refreshRouteUi,
    renderGachaModal,
    renderDevLayoutPanel,
    spawnMoneyGainFloater,
    moneyCounterPulseMs: MONEY_COUNTER_PULSE_MS,
    shopTabPokeballs: SHOP_TAB_POKEBALLS,
    nowMs: () => Date.now(),
  },
});

function ensureSpeciesStats(pokemonId) {
  if (!state.saveData) {
    return createPokemonEntityRecord(pokemonId, 1);
  }
  const key = String(pokemonId);
  if (!state.saveData.pokemon_entities[key]) {
    state.saveData.pokemon_entities[key] = createPokemonEntityRecord(pokemonId, 1);
  }
  syncSpeciesIdentityForRecord(state.saveData.pokemon_entities[key], pokemonId);
  return state.saveData.pokemon_entities[key];
}

function incrementSpeciesStat(pokemonId, kind, isShiny, amount = 1, options = {}) {
  const record = ensureSpeciesStats(pokemonId);
  const suffix = isShiny ? "shiny" : "normal";
  const field = `${kind}_${suffix}`;
  const previousValue = toSafeInt(record[field], 0);
  const delta = Number(amount) || 0;
  const nextValue = Math.max(0, previousValue + delta);
  record[field] = nextValue;
  const isUltraShiny = Boolean(options?.isUltraShiny);
  if (isUltraShiny) {
    const ultraField = `${kind}_ultra_shiny`;
    const ultraPrevious = toSafeInt(record[ultraField], 0);
    record[ultraField] = Math.max(0, ultraPrevious + delta);
  }
  if (delta > 0) {
    notifyFirstTimeSpeciesProgress(pokemonId, kind, isShiny, previousValue, nextValue);
  }
  invalidatePokedexEntriesCache();
  if (state.ui.pokedexOpen) {
    queuePokedexGridRender();
  }
  refreshRouteUi();
}
function buildOrderedCatalogRouteIds(routeCatalog = state.routeCatalog) {
  const availableRouteIds = routeCatalog?.size > 0 ? Array.from(routeCatalog.keys()) : ROUTE_ID_ORDER;
  const ordered = ROUTE_ID_ORDER.filter((routeId) => availableRouteIds.includes(routeId));
  for (const routeId of availableRouteIds) {
    if (!ordered.includes(routeId)) {
      ordered.push(routeId);
    }
  }
  if (!ordered.includes(DEFAULT_ROUTE_ID)) {
    ordered.unshift(DEFAULT_ROUTE_ID);
  }
  return ordered;
}

function refreshOrderedCatalogRouteIds() {
  state.routeCatalogOrderedIds = buildOrderedCatalogRouteIds(state.routeCatalog);
  return state.routeCatalogOrderedIds;
}

function getOrderedCatalogRouteIds() {
  if (Array.isArray(state.routeCatalogOrderedIds) && state.routeCatalogOrderedIds.length > 0) {
    return state.routeCatalogOrderedIds;
  }
  return refreshOrderedCatalogRouteIds();
}

function ensureRouteDefeatCountsForCurrentCatalog() {
  const availableRouteIds = getOrderedCatalogRouteIds();
  if (!state.saveData) {
    return createRouteDefeatCounts(availableRouteIds);
  }

  const normalized = normalizeRouteDefeatCounts(state.saveData.route_defeat_counts, availableRouteIds);
  state.saveData.route_defeat_counts = normalized;
  return normalized;
}

function getRouteDefeatCount(routeId) {
  const counts = ensureRouteDefeatCountsForCurrentCatalog();
  const id = String(routeId || DEFAULT_ROUTE_ID);
  return Math.max(0, toSafeInt(counts[id], 0));
}

function incrementRouteDefeatCount(routeId, amount = 1) {
  if (!state.saveData) {
    return 0;
  }
  const counts = ensureRouteDefeatCountsForCurrentCatalog();
  const id = String(routeId || DEFAULT_ROUTE_ID);
  const delta = Math.max(0, toSafeInt(amount, 0));
  counts[id] = Math.max(0, toSafeInt(counts[id], 0)) + delta;
  state.saveData.route_defeat_counts = counts;
  return counts[id];
}

function setRouteDefeatCount(routeId, value = 0) {
  if (!state.saveData) {
    return 0;
  }
  const counts = ensureRouteDefeatCountsForCurrentCatalog();
  const id = String(routeId || DEFAULT_ROUTE_ID);
  counts[id] = Math.max(0, toSafeInt(value, 0));
  state.saveData.route_defeat_counts = counts;
  return counts[id];
}

function getRouteOrderIndex(routeId) {
  const id = String(routeId || DEFAULT_ROUTE_ID);
  return getOrderedCatalogRouteIds().indexOf(id);
}

function getOrderedUnlockedRouteIds() {
  if (!state.saveData) {
    return [DEFAULT_ROUTE_ID];
  }
  const ordered = getOrderedCatalogRouteIds();
  const unlocked = ensureUnlockedRoutesForCurrentCatalog();
  return ordered.filter((routeId) => unlocked.includes(routeId));
}

function getRouteDataById(routeId) {
  const id = String(routeId || "");
  return state.routeCatalog.get(id) || null;
}

function getRouteAccessFlags() {
  if (!state.saveData) {
    return [];
  }
  const normalized = normalizeFlagIdList(state.saveData.zone_flags);
  state.saveData.zone_flags = normalized;
  return normalized;
}

function hasRouteAccessFlag(flagId) {
  const id = String(flagId || "").trim();
  return id ? getRouteAccessFlags().includes(id) : false;
}

function setRouteAccessFlag(flagId, enabled = true) {
  if (!state.saveData) {
    return false;
  }
  const id = String(flagId || "").trim();
  if (!id) {
    return false;
  }
  const nextFlags = getRouteAccessFlags().slice();
  const currentIndex = nextFlags.indexOf(id);
  if (enabled) {
    if (currentIndex >= 0) {
      return false;
    }
    nextFlags.push(id);
  } else if (currentIndex < 0) {
    return false;
  } else {
    nextFlags.splice(currentIndex, 1);
  }
  state.saveData.zone_flags = normalizeFlagIdList(nextFlags);
  return true;
}

function getSeenDialogueIds() {
  if (!state.saveData) {
    return [];
  }
  const normalized = normalizeFlagIdList(state.saveData.seen_dialogue_ids);
  state.saveData.seen_dialogue_ids = normalized;
  return normalized;
}

function hasSeenDialogue(dialogueId) {
  const id = String(dialogueId || "").trim();
  return id ? getSeenDialogueIds().includes(id) : false;
}

function markDialogueSeen(dialogueId) {
  if (!state.saveData) {
    return false;
  }
  const id = String(dialogueId || "").trim();
  if (!id || hasSeenDialogue(id)) {
    return false;
  }
  state.saveData.seen_dialogue_ids = normalizeFlagIdList([
    ...getSeenDialogueIds(),
    id,
  ]);
  return true;
}

function getConnectedRouteIds(routeId) {
  return getConnectedRouteIdsFromGraph(
    routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID,
    state.routeCatalog,
  );
}

function getUnlockableConnectedRouteIds(routeId) {
  return getUnlockableConnectedRouteIdsFromGraph({
    routeId: routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID,
    routeCatalog: state.routeCatalog,
    unlockedRouteIds: state.saveData?.unlocked_route_ids,
    zoneFlags: getRouteAccessFlags(),
  });
}

function getBlockedConnectedRouteStates(routeId) {
  return getBlockedConnectedRouteStatesFromGraph({
    routeId: routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID,
    routeCatalog: state.routeCatalog,
    unlockedRouteIds: state.saveData?.unlocked_route_ids,
    zoneFlags: getRouteAccessFlags(),
  }).filter((entry) => entry.blocked);
}

function getRouteAccessStateForRoute(routeId) {
  return getRouteAccessStateFromGraph(getRouteDataById(routeId), getRouteAccessFlags());
}

function getRouteZoneType(routeId) {
  const routeData = getRouteDataById(routeId) || (state.routeData && state.routeData.route_id === routeId ? state.routeData : null);
  const zoneType = String(routeData?.zone_type || "route").toLowerCase().trim();
  if (zoneType === "town" || zoneType === "city") {
    return "town";
  }
  if (zoneType === "dungeon" || zoneType === "cave" || zoneType === "forest") {
    return "dungeon";
  }
  return "route";
}

function getRouteZoneTypeLabel(routeId) {
  const zoneType = getRouteZoneType(routeId);
  if (zoneType === "town") {
    return "Ville";
  }
  if (zoneType === "dungeon") {
    return "Donjon";
  }
  return "Route";
}

function getTrainerBattleState() {
  if (!state.trainerBattle || typeof state.trainerBattle !== "object") {
    state.trainerBattle = {
      active: null,
      selectedTeamIds: [],
      setupTrainerBattleId: "",
      setupSourceActionId: "",
      setupTargetSlotIndex: -1,
      definitionsById: new Map(),
    };
  }
  if (!(state.trainerBattle.definitionsById instanceof Map)) {
    state.trainerBattle.definitionsById = new Map();
  }
  if (!Array.isArray(state.trainerBattle.selectedTeamIds)) {
    state.trainerBattle.selectedTeamIds = [];
  }
  return state.trainerBattle;
}

function getTrainerBattleDefinitionsById() {
  return getTrainerBattleState().definitionsById;
}

function buildTrainerBattleDataPath(trainerBattleId) {
  const id = String(trainerBattleId || "").trim();
  return id ? `${TRAINER_BATTLE_DATA_DIR}/${encodeURIComponent(id)}.json` : "";
}

async function loadTrainerBattleDefinition(trainerBattleId) {
  const id = String(trainerBattleId || "").trim();
  if (!id) {
    return null;
  }
  const definitionsById = getTrainerBattleDefinitionsById();
  if (definitionsById.has(id)) {
    return definitionsById.get(id);
  }
  if (pendingTrainerBattleDefinitionLoads.has(id)) {
    return pendingTrainerBattleDefinitionLoads.get(id);
  }
  const task = fetch(buildTrainerBattleDataPath(id))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((payload) => validateTrainerBattlePayload(payload, `Trainer battle ${id}`))
    .then(async (payload) => {
      const rosterSpeciesIds = Array.isArray(payload?.roster)
        ? payload.roster.map((entry) => Number(entry?.pokemon_id || 0)).filter((pokemonId) => pokemonId > 0)
        : [];
      if (rosterSpeciesIds.length > 0) {
        await ensurePokemonDefinitionsLoadedForSpeciesIds(rosterSpeciesIds);
      }
      definitionsById.set(id, payload);
      return payload;
    })
    .finally(() => {
      pendingTrainerBattleDefinitionLoads.delete(id);
    });
  pendingTrainerBattleDefinitionLoads.set(id, task);
  return task;
}

function getActiveTrainerBattleSession() {
  const session = getTrainerBattleState().active;
  return session && typeof session === "object" ? session : null;
}

function isTrainerBattleActive() {
  return Boolean(getActiveTrainerBattleSession());
}

function getCurrentBattleSourceKind() {
  return isTrainerBattleActive() ? TRAINER_BATTLE_SOURCE_TRAINER : TRAINER_BATTLE_SOURCE_ROUTE_WILD;
}

function getTrainerBattleTeamSizeCount() {
  return Math.max(1, toSafeInt(TRAINER_BATTLE_TEAM_SIZE_COUNT, 3));
}

function normalizeTrainerBattleSelectedTeamIds(teamIds = []) {
  const teamSize = getTrainerBattleTeamSizeCount();
  return Array.from({ length: teamSize }, (_, index) => {
    const pokemonId = Number(Array.isArray(teamIds) ? teamIds[index] || 0 : 0);
    return pokemonId > 0 ? pokemonId : 0;
  });
}

function findTrainerBattleFamilyConflictSlotIndex(teamIds, candidatePokemonId, ignoredSlotIndex = -1) {
  const candidateId = Number(candidatePokemonId || 0);
  if (candidateId <= 0 || !Array.isArray(teamIds)) {
    return -1;
  }
  const ignoredIndex = toSafeInt(ignoredSlotIndex, -1);
  const familyIds = getEvolutionFamilySpeciesIds(candidateId);
  const familyIdSet = new Set(
    (familyIds.length > 0 ? familyIds : [candidateId])
      .map((pokemonId) => Number(pokemonId || 0))
      .filter((pokemonId) => pokemonId > 0),
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

function isTrainerBattleSelectionPokemonUsable(pokemonId) {
  const id = Number(pokemonId || 0);
  return id > 0 && Boolean(state.pokemonDefsById.get(id)) && isPokemonEntityUnlockedById(id);
}

function buildInitialTrainerBattleSelectedTeamIds() {
  const sourceTeamIds = Array.isArray(state.saveData?.team) ? state.saveData.team : [];
  const teamSize = getTrainerBattleTeamSizeCount();
  const selectedTeamIds = [];
  for (const rawId of sourceTeamIds) {
    const pokemonId = Number(rawId || 0);
    if (!isTrainerBattleSelectionPokemonUsable(pokemonId)) {
      continue;
    }
    if (findTrainerBattleFamilyConflictSlotIndex(selectedTeamIds, pokemonId) >= 0) {
      continue;
    }
    if (selectedTeamIds.includes(pokemonId)) {
      continue;
    }
    selectedTeamIds.push(pokemonId);
    if (selectedTeamIds.length >= teamSize) {
      break;
    }
  }
  return normalizeTrainerBattleSelectedTeamIds(selectedTeamIds);
}

function isTrainerBattleSelectionReady(teamIds = getTrainerBattleState().selectedTeamIds) {
  const normalizedTeamIds = normalizeTrainerBattleSelectedTeamIds(teamIds);
  if (normalizedTeamIds.some((pokemonId) => !isTrainerBattleSelectionPokemonUsable(pokemonId))) {
    return false;
  }
  for (let index = 0; index < normalizedTeamIds.length; index += 1) {
    if (findTrainerBattleFamilyConflictSlotIndex(normalizedTeamIds, normalizedTeamIds[index], index) >= 0) {
      return false;
    }
  }
  return true;
}

function getTrainerBattleSetupDefinition() {
  const trainerBattleId = String(getTrainerBattleState().setupTrainerBattleId || "").trim();
  if (!trainerBattleId) {
    return null;
  }
  return getTrainerBattleDefinitionsById().get(trainerBattleId) || null;
}

function isRouteCombatEnabled(routeInput = null) {
  const routeData =
    routeInput && typeof routeInput === "object"
      ? routeInput
      : getRouteDataById(routeInput || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID) ||
        state.routeData;
  if (!routeData) {
    return false;
  }
  return routeData.combat_enabled !== false;
}

function isCurrentRouteCombatEnabled() {
  if (isTrainerBattleActive()) {
    return true;
  }
  return isRouteCombatEnabled(state.routeData);
}

function canStartBattleForSource(sourceKind = getCurrentBattleSourceKind()) {
  return String(sourceKind || "").trim() === TRAINER_BATTLE_SOURCE_TRAINER
    ? isTrainerBattleActive()
    : isRouteCombatEnabled(state.routeData);
}

function canTeamAttackForBattleSource(sourceKind = getCurrentBattleSourceKind()) {
  return canStartBattleForSource(sourceKind);
}

function getRouteUnlockMode(routeId) {
  const routeData = getRouteDataById(routeId) || state.routeData;
  const mode = String(routeData?.unlock_mode || (routeData?.combat_enabled === false ? "visit" : "defeats"))
    .toLowerCase()
    .trim();
  return mode === "visit" ? "visit" : "defeats";
}

function getRouteUnlockDefeatTarget(routeId) {
  const routeData = getRouteDataById(routeId) || state.routeData;
  return Math.max(1, toSafeInt(routeData?.unlock_defeats_required, ROUTE_UNLOCK_DEFEATS));
}

function getRouteUnlockProgressState(routeId) {
  const currentRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const progressState = buildRouteUnlockProgressState({
    routeId: currentRouteId,
    routeCatalog: state.routeCatalog,
    unlockedRouteIds: state.saveData?.unlocked_route_ids,
    routeDefeatCounts: state.saveData?.route_defeat_counts,
    zoneFlags: getRouteAccessFlags(),
    availableRouteIds: getOrderedCatalogRouteIds(),
    defaultRouteId: DEFAULT_ROUTE_ID,
    fallbackUnlockTarget: ROUTE_UNLOCK_DEFEATS,
    fallbackTimerMs: ROUTE_DEFEAT_TIMER_MS,
    toSafeInt,
  });
  return {
    ...progressState,
    nextUnlocked: Boolean(progressState.nextRouteId && isRouteUnlocked(progressState.nextRouteId)),
  };
}

function getTeamBoxesAccessState(routeId = null) {
  const activeRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const progressState = getRouteUnlockProgressState(activeRouteId);
  return {
    routeId: activeRouteId,
    progressState,
    allowed: !progressState.timerEnabled,
  };
}

function getTeamBoxesLockedMessage(routeId = null) {
  const accessState = getTeamBoxesAccessState(routeId);
  if (accessState.allowed) {
    return "";
  }
  const { progressState } = accessState;
  const nextRouteNames = Array.isArray(progressState.nextRouteIds) && progressState.nextRouteIds.length > 0
    ? progressState.nextRouteIds.map((nextRouteId) => getRouteDisplayName(nextRouteId)).join(", ")
    : "la prochaine sortie";
  return `Serie chrono active (${progressState.currentDefeats}/${progressState.unlockTarget} KO). Debloque ${nextRouteNames} pour echanger la team.`;
}

function getRouteRegionId(routeId) {
  const id = String(routeId || "").toLowerCase().trim();
  if (id.startsWith("hoenn_")) {
    return "hoenn";
  }
  if (id.startsWith("johto_")) {
    return "johto";
  }
  if (id.startsWith("kanto_")) {
    return "kanto";
  }
  return MAP_REGION_DEFAULT_ID;
}

function getActiveMapRegionId() {
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  return getRouteRegionId(activeRouteId);
}

function getMapRegionConfig(regionId = getActiveMapRegionId()) {
  const normalizedRegionId = String(regionId || MAP_REGION_DEFAULT_ID).toLowerCase().trim();
  const imagePath =
    MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID[normalizedRegionId]
    || MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID[MAP_REGION_DEFAULT_ID]
    || MAP_REFERENCE_IMAGE_PATH;
  const copy =
    MAP_REGION_COPY_BY_REGION_ID[normalizedRegionId]
    || MAP_REGION_COPY_BY_REGION_ID[MAP_REGION_DEFAULT_ID]
    || null;
  return {
    regionId: normalizedRegionId || MAP_REGION_DEFAULT_ID,
    imagePath,
    title: copy?.title || "Carte",
    subtitle: copy?.subtitle || "Clique une zone débloquée pour t’y rendre.",
    dialogLabel: copy?.dialogLabel || copy?.title || "Carte",
    imageAlt: copy?.imageAlt || copy?.title || "Carte",
  };
}

function getRouteMapMarkerOverride(routeId) {
  const id = String(routeId || "").trim();
  if (!id) {
    return null;
  }
  const marker = MAP_MARKER_OVERRIDES_BY_ROUTE_ID[id];
  if (!marker) {
    return null;
  }
  const x = Number(marker?.x);
  const y = Number(marker?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
}

function getRouteMapMarker(routeId) {
  const markerOverride = getRouteMapMarkerOverride(routeId);
  if (markerOverride) {
    return markerOverride;
  }
  const routeData = getRouteDataById(routeId) || state.routeData;
  const marker = routeData?.map_marker;
  const x = Number(marker?.x ?? marker?.left_pct ?? marker?.left ?? NaN);
  const y = Number(marker?.y ?? marker?.top_pct ?? marker?.top ?? NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
}

function applyMapReferenceImage() {
  if (!mapImageEl) {
    return;
  }
  const mapRegion = getMapRegionConfig();
  const currentSrc = String(mapImageEl.getAttribute("src") || "");
  if (currentSrc !== mapRegion.imagePath) {
    mapImageEl.setAttribute("src", mapRegion.imagePath);
  }
  if (mapModalTitleEl) {
    mapModalTitleEl.textContent = mapRegion.title;
  }
  if (mapModalSubtitleEl) {
    mapModalSubtitleEl.textContent = mapRegion.subtitle;
  }
  if (mapModalEl) {
    mapModalEl.setAttribute("aria-label", mapRegion.dialogLabel);
  }
  mapImageEl.setAttribute("alt", mapRegion.imageAlt);
}

function shouldRenderRouteOnCurrentMap(routeId) {
  return getRouteRegionId(routeId) === getActiveMapRegionId();
}

function syncMapMarkerLayerBounds() {
  if (!mapMarkersEl || !mapImageEl || !mapStageEl) {
    return;
  }
  const stageRect = mapStageEl.getBoundingClientRect();
  const imageRect = mapImageEl.getBoundingClientRect();
  if (stageRect.width <= 0 || stageRect.height <= 0 || imageRect.width <= 0 || imageRect.height <= 0) {
    mapMarkersEl.style.left = "0px";
    mapMarkersEl.style.top = "0px";
    mapMarkersEl.style.width = "100%";
    mapMarkersEl.style.height = "100%";
    return;
  }
  const left = clamp(imageRect.left - stageRect.left, 0, stageRect.width);
  const top = clamp(imageRect.top - stageRect.top, 0, stageRect.height);
  mapMarkersEl.style.left = `${left}px`;
  mapMarkersEl.style.top = `${top}px`;
  mapMarkersEl.style.width = `${Math.max(1, imageRect.width)}px`;
  mapMarkersEl.style.height = `${Math.max(1, imageRect.height)}px`;
}

function getSpeciesStatsSummary(pokemonId) {
  const record = ensureSpeciesStats(pokemonId);
  const encounteredNormal = Math.max(0, toSafeInt(record.encountered_normal, 0));
  const encounteredShiny = Math.max(0, toSafeInt(record.encountered_shiny, 0));
  const encounteredUltraShiny = Math.max(0, toSafeInt(record.encountered_ultra_shiny, 0));
  const defeatedNormal = Math.max(0, toSafeInt(record.defeated_normal, 0));
  const defeatedShiny = Math.max(0, toSafeInt(record.defeated_shiny, 0));
  const defeatedUltraShiny = Math.max(0, toSafeInt(record.defeated_ultra_shiny, 0));
  const capturedNormal = Math.max(0, toSafeInt(record.captured_normal, 0));
  const capturedShiny = Math.max(0, toSafeInt(record.captured_shiny, 0));
  const capturedUltraShiny = Math.max(0, toSafeInt(record.captured_ultra_shiny, 0));
  return {
    level: clamp(toSafeInt(record.level, 1), 1, MAX_LEVEL),
    stats: normalizeStatsPayload(record.stats),
    talent: resolveTalentDefinition(record?.talent, pokemonId),
    entity_unlocked: isEntityUnlocked(record),
    encountered_normal: encounteredNormal,
    encountered_shiny: encounteredShiny,
    encountered_ultra_shiny: encounteredUltraShiny,
    defeated_normal: defeatedNormal,
    defeated_shiny: defeatedShiny,
    defeated_ultra_shiny: defeatedUltraShiny,
    captured_normal: capturedNormal,
    captured_shiny: capturedShiny,
    captured_ultra_shiny: capturedUltraShiny,
    encountered_total: encounteredNormal + encounteredShiny,
    defeated_total: defeatedNormal + defeatedShiny,
    captured_total: capturedNormal + capturedShiny,
  };
}

function getPokemonEntityRecord(pokemonId) {
  if (!state.saveData?.pokemon_entities) {
    return null;
  }
  return state.saveData.pokemon_entities[String(pokemonId)] || null;
}

function getCapturedTotal(record) {
  if (!record) {
    return 0;
  }
  return Math.max(0, toSafeInt(record.captured_normal, 0)) + Math.max(0, toSafeInt(record.captured_shiny, 0));
}

function ensureOwnedRecordHasAtLeastOneCapture(record) {
  if (!record || !isEntityUnlocked(record) || getCapturedTotal(record) > 0) {
    return false;
  }
  const nextCapturedNormal = Math.max(1, toSafeInt(record.captured_normal, 0));
  const nextEncounteredNormal = Math.max(toSafeInt(record.encountered_normal, 0), nextCapturedNormal);
  let changed = false;
  if (nextCapturedNormal !== toSafeInt(record.captured_normal, 0)) {
    record.captured_normal = nextCapturedNormal;
    changed = true;
  }
  if (nextEncounteredNormal !== toSafeInt(record.encountered_normal, 0)) {
    record.encountered_normal = nextEncounteredNormal;
    changed = true;
  }
  return changed;
}

function getEvolutionRootSpeciesIdFromDefs(pokemonId, defsById = state.pokemonDefsById) {
  const sourceDefs = defsById instanceof Map ? defsById : new Map();
  let currentId = Number(pokemonId || 0);
  if (currentId <= 0) {
    return 0;
  }
  const visited = new Set();
  while (currentId > 0 && !visited.has(currentId)) {
    visited.add(currentId);
    const def = sourceDefs.get(currentId);
    const fromId = Number(def?.evolvesFrom?.id || 0);
    if (fromId <= 0) {
      return currentId;
    }
    currentId = fromId;
  }
  return Number(pokemonId || 0);
}

function getEvolutionFamilySpeciesIdsFromDefs(pokemonId, defsById = state.pokemonDefsById) {
  const sourceDefs = defsById instanceof Map ? defsById : new Map();
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return [];
  }
  const rootId = getEvolutionRootSpeciesIdFromDefs(id, sourceDefs);
  if (rootId <= 0 || sourceDefs.size <= 0) {
    return [id];
  }
  const familyIds = [];
  for (const [speciesId] of sourceDefs.entries()) {
    if (getEvolutionRootSpeciesIdFromDefs(speciesId, sourceDefs) === rootId) {
      familyIds.push(Number(speciesId));
    }
  }
  if (!familyIds.includes(id)) {
    familyIds.push(id);
  }
  familyIds.sort((a, b) => a - b);
  return familyIds;
}

function getEvolutionFamilyRootIdFromDefs(pokemonId, defsById = state.pokemonDefsById) {
  const familyIds = getEvolutionFamilySpeciesIdsFromDefs(pokemonId, defsById);
  if (familyIds.length <= 0) {
    return Number(pokemonId || 0);
  }
  return Math.min(...familyIds);
}

function getEvolutionFamilySpeciesIds(pokemonId) {
  return getEvolutionFamilySpeciesIdsFromDefs(pokemonId, state.pokemonDefsById);
}

function applyNicknameToEvolutionFamily(pokemonId, nickname) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return { changed: false, familySize: 0 };
  }
  const nextNickname = sanitizePokemonNickname(nickname);
  const familyIds = getEvolutionFamilySpeciesIds(id);
  const targetIds = Array.from(new Set((familyIds.length > 0 ? familyIds : [id]).map((entry) => Number(entry || 0))))
    .filter((entry) => entry > 0);
  let changed = false;

  for (const familyId of targetIds) {
    const record = ensureSpeciesStats(familyId);
    const previousNickname = sanitizePokemonNickname(record?.nickname);
    if (previousNickname === nextNickname) {
      continue;
    }
    record.nickname = nextNickname;
    changed = true;
  }

  return {
    changed,
    familySize: targetIds.length,
  };
}

function applyAppearanceModesToEvolutionFamily(pokemonId, options = {}) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return { changed: false, familySize: 0 };
  }
  const hasShinyMode = Object.prototype.hasOwnProperty.call(options, "shinyMode");
  const hasUltraShinyMode = Object.prototype.hasOwnProperty.call(options, "ultraShinyMode");
  const familyIds = getEvolutionFamilySpeciesIds(id);
  const targetIds = Array.from(new Set((familyIds.length > 0 ? familyIds : [id]).map((entry) => Number(entry || 0))))
    .filter((entry) => entry > 0);
  const requestedShinyMode = hasShinyMode ? Boolean(options.shinyMode) : null;
  const requestedUltraShinyMode = hasUltraShinyMode ? Boolean(options.ultraShinyMode) : null;
  let changed = false;

  for (const familyId of targetIds) {
    const record = ensureSpeciesStats(familyId);
    let recordChanged = false;

    if (requestedShinyMode != null && Boolean(record.appearance_shiny_mode) !== requestedShinyMode) {
      record.appearance_shiny_mode = requestedShinyMode;
      recordChanged = true;
    }
    if (requestedUltraShinyMode != null && Boolean(record.appearance_ultra_shiny_mode) !== requestedUltraShinyMode) {
      record.appearance_ultra_shiny_mode = requestedUltraShinyMode;
      recordChanged = true;
    }

    if (reconcileAppearanceForEntityRecord(record, familyId)) {
      recordChanged = true;
    }
    if (recordChanged) {
      changed = true;
    }
  }

  return {
    changed,
    familySize: targetIds.length,
  };
}

function getFamilyCounterTotal(pokemonId, counterField) {
  const field = String(counterField || "").trim();
  if (!field) {
    return 0;
  }
  const familyIds = getEvolutionFamilySpeciesIds(pokemonId);
  if (familyIds.length <= 0) {
    return Math.max(0, toSafeInt(getPokemonEntityRecord(pokemonId)?.[field], 0));
  }
  let total = 0;
  for (const familyId of familyIds) {
    const record = getPokemonEntityRecord(familyId);
    total += Math.max(0, toSafeInt(record?.[field], 0));
  }
  return total;
}

function isEntityUnlocked(record) {
  if (!record) {
    return false;
  }
  if (typeof record === "object" && Object.prototype.hasOwnProperty.call(record, "entity_unlocked")) {
    return Boolean(record.entity_unlocked);
  }
  return getCapturedTotal(record) > 0;
}

function isPokemonEntityUnlockedById(pokemonId) {
  return isEntityUnlocked(getPokemonEntityRecord(pokemonId));
}

function isEvolutionFamilyOwned(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const familyIds = getEvolutionFamilySpeciesIds(id);
  if (familyIds.length <= 0) {
    return isPokemonEntityUnlockedById(id);
  }
  return familyIds.some((familyId) => isPokemonEntityUnlockedById(familyId));
}

function markEntityUnlocked(record, unlocked = true) {
  if (!record) {
    return;
  }
  record.entity_unlocked = Boolean(unlocked);
}

function getFamilyShinyCaptureCount(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return 0;
  }
  return getFamilyCounterTotal(id, "captured_shiny");
}

function getFamilyUltraShinyCaptureCount(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return 0;
  }
  return getFamilyCounterTotal(id, "captured_ultra_shiny");
}

function hasLegacyAppearanceUnlockForFamily(pokemonId, appearanceMode = "shiny") {
  const id = Number(pokemonId || 0);
  if (id <= 0 || !state.saveData) {
    return false;
  }
  const rootId = getEvolutionFamilyRootIdFromDefs(id, state.pokemonDefsById);
  const rawList = appearanceMode === "ultra"
    ? state.saveData.legacy_ultra_shiny_family_root_ids
    : state.saveData.legacy_shiny_family_root_ids;
  const normalizedList = normalizeLegacyAppearanceFamilyRootIds(rawList);
  return normalizedList.includes(rootId);
}

function getAppearanceUnlockState(pokemonId) {
  const id = Number(pokemonId || 0);
  const familyShinyCaptures = id > 0 ? getFamilyShinyCaptureCount(id) : 0;
  const familyUltraShinyCaptures = id > 0 ? getFamilyUltraShinyCaptureCount(id) : 0;
  const familyOwned = id > 0 ? isEvolutionFamilyOwned(id) : false;
  const shinyCurrentSave = familyShinyCaptures > 0;
  const ultraCurrentSave = familyUltraShinyCaptures > 0;
  const shinyLegacy = familyOwned && hasLegacyAppearanceUnlockForFamily(id, "shiny");
  const ultraLegacy = familyOwned && hasLegacyAppearanceUnlockForFamily(id, "ultra");
  return {
    shinyUnlocked: shinyCurrentSave || shinyLegacy,
    ultraUnlocked: ultraCurrentSave || ultraLegacy,
    shinySource: shinyCurrentSave ? "current_save" : shinyLegacy ? "legacy" : "none",
    ultraSource: ultraCurrentSave ? "current_save" : ultraLegacy ? "legacy" : "none",
    familyShinyCaptures,
    familyUltraShinyCaptures,
  };
}

function isShinyAppearanceUnlockedForRecord(record, pokemonId = 0) {
  const id = Number(pokemonId || record?.id || 0);
  if (id > 0) {
    return getAppearanceUnlockState(id).shinyUnlocked;
  }
  if (!record) {
    return false;
  }
  return Math.max(0, toSafeInt(record.captured_shiny, 0)) > 0;
}

function isUltraShinyAppearanceUnlockedForRecord(record, pokemonId = 0) {
  const id = Number(pokemonId || record?.id || 0);
  if (id > 0) {
    return getAppearanceUnlockState(id).ultraUnlocked;
  }
  if (!record) {
    return false;
  }
  return Math.max(0, toSafeInt(record.captured_ultra_shiny, 0)) > 0;
}

function normalizeEntityAppearanceConfig(record) {
  if (!record || typeof record !== "object") {
    return false;
  }
  let changed = false;

  const normalizedOwned = normalizeSpriteVariantIdList(record.appearance_owned_variants);
  if (
    !Array.isArray(record.appearance_owned_variants) ||
    normalizedOwned.length !== record.appearance_owned_variants.length ||
    normalizedOwned.some((id, idx) => id !== record.appearance_owned_variants[idx])
  ) {
    record.appearance_owned_variants = normalizedOwned;
    changed = true;
  }

  const normalizedSelected = normalizeSpriteVariantId(record.appearance_selected_variant);
  if (normalizedSelected !== String(record.appearance_selected_variant || "")) {
    record.appearance_selected_variant = normalizedSelected;
    changed = true;
  }

  const beforeShinyMode = record.appearance_shiny_mode;
  const shinyMode = Boolean(beforeShinyMode);
  if (beforeShinyMode !== shinyMode) {
    record.appearance_shiny_mode = shinyMode;
    changed = true;
  }

  const beforeUltraShinyMode = record.appearance_ultra_shiny_mode;
  const ultraShinyMode = Boolean(beforeUltraShinyMode);
  if (beforeUltraShinyMode !== ultraShinyMode) {
    record.appearance_ultra_shiny_mode = ultraShinyMode;
    changed = true;
  }

  return changed;
}

function reconcileAppearanceForEntityRecord(record, pokemonId) {
  if (!record) {
    return false;
  }
  let changed = normalizeEntityAppearanceConfig(record);
  const def = state.pokemonDefsById.get(Number(pokemonId || record.id || 0));
  if (!def) {
    return changed;
  }

  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    if (record.appearance_owned_variants?.length) {
      record.appearance_owned_variants = [];
      changed = true;
    }
    if (record.appearance_selected_variant) {
      record.appearance_selected_variant = "";
      changed = true;
    }
    if (record.appearance_shiny_mode) {
      record.appearance_shiny_mode = false;
      changed = true;
    }
    if (record.appearance_ultra_shiny_mode) {
      record.appearance_ultra_shiny_mode = false;
      changed = true;
    }
    return changed;
  }

  const validIds = new Set(variants.map((entry) => entry.id));
  const defaultVariantId = getDefaultSpriteVariantId(def);
  const normalizedOwned = normalizeSpriteVariantIdList(record.appearance_owned_variants).filter((variantId) =>
    validIds.has(variantId),
  );
  const ownedSet = new Set(normalizedOwned);
  const selectedIdBeforeMigration = normalizeSpriteVariantId(record.appearance_selected_variant);
  const shouldPromoteLegacyTransparent = shouldPromoteLegacyTransparentSelection(
    selectedIdBeforeMigration,
    normalizedOwned,
    defaultVariantId,
  );
  if (defaultVariantId) {
    ownedSet.add(defaultVariantId);
  }

  const orderedOwned = variants.map((entry) => entry.id).filter((variantId) => ownedSet.has(variantId));
  if (
    orderedOwned.length !== (record.appearance_owned_variants?.length || 0) ||
    orderedOwned.some((id, idx) => id !== record.appearance_owned_variants[idx])
  ) {
    record.appearance_owned_variants = orderedOwned;
    changed = true;
  }

  let selectedId = selectedIdBeforeMigration;
  if (shouldPromoteLegacyTransparent) {
    selectedId = defaultVariantId;
  }
  if (!selectedId || !ownedSet.has(selectedId)) {
    selectedId = orderedOwned[0] || defaultVariantId || variants[0].id;
  }
  if (selectedId !== record.appearance_selected_variant) {
    record.appearance_selected_variant = selectedId;
    changed = true;
  }

  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
  const ultraUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);

  if (record.appearance_shiny_mode && !shinyUnlocked) {
    record.appearance_shiny_mode = false;
    changed = true;
  }
  if (record.appearance_ultra_shiny_mode && !ultraUnlocked) {
    record.appearance_ultra_shiny_mode = false;
    changed = true;
  }
  if (record.appearance_ultra_shiny_mode && !record.appearance_shiny_mode) {
    record.appearance_shiny_mode = true;
    changed = true;
  }

  return changed;
}

function reconcileEntityAppearanceStates() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return false;
  }
  let changed = false;
  for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(record?.id || rawId || 0);
    if (pokemonId <= 0 || !record) {
      continue;
    }
    if (reconcileAppearanceForEntityRecord(record, pokemonId)) {
      changed = true;
    }
  }
  return changed;
}

function isSpriteVariantOwned(record, variantId) {
  if (!record) {
    return false;
  }
  const target = normalizeSpriteVariantId(variantId);
  if (!target) {
    return false;
  }
  const owned = normalizeSpriteVariantIdList(record.appearance_owned_variants);
  return owned.includes(target);
}

function getOwnedSpriteVariantsForRecord(record, def) {
  if (!record || !def) {
    return [];
  }
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return [];
  }
  const ownedIds = new Set(normalizeSpriteVariantIdList(record.appearance_owned_variants));
  return variants.filter((variant) => ownedIds.has(variant.id));
}

function getSelectedOwnedSpriteVariantForRecord(record, def) {
  const variants = getSpriteVariantsForDef(def);
  if (variants.length <= 0) {
    return null;
  }
  const owned = getOwnedSpriteVariantsForRecord(record, def);
  const selectedId = normalizeSpriteVariantId(record?.appearance_selected_variant);
  const defaultVariantId = getDefaultSpriteVariantId(def);
  if (shouldPromoteLegacyTransparentSelection(selectedId, record?.appearance_owned_variants, defaultVariantId)) {
    return getSpriteVariantById(def, defaultVariantId) || owned[0] || variants[0] || null;
  }
  if (selectedId) {
    const selectedVariant = owned.find((variant) => variant.id === selectedId);
    if (selectedVariant) {
      return selectedVariant;
    }
  }
  return owned[0] || getSpriteVariantById(def, defaultVariantId) || variants[0] || null;
}

function resolveSpriteAppearanceForEntity(pokemonId, options = {}) {
  const id = Number(pokemonId || 0);
  const def = state.pokemonDefsById.get(id);
  if (!def) {
    return {
      variant: null,
      spritePath: "",
      spriteImage: null,
      animated: false,
      shinyVisual: false,
      shinyNegativeFallbackVisual: false,
      shinyUnlocked: false,
      ultraShinyVisual: false,
      ultraShinyUnlocked: false,
      shinyModeRequested: false,
      ultraShinyModeRequested: false,
    };
  }

  const record = getPokemonEntityRecord(id);
  if (record) {
    reconcileAppearanceForEntityRecord(record, id);
  }
  const variant = getSelectedOwnedSpriteVariantForRecord(record, def);
  const normalPath = variant?.frontPath || def.spritePath || "";
  const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, id);
  const ultraShinyUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, id);
  const respectAppearanceShinyMode = options.respectAppearanceShinyMode !== false;
  const respectAppearanceUltraShinyMode = options.respectAppearanceUltraShinyMode !== false;
  const forceUltraShiny = Boolean(options.forceUltraShiny || shouldForceUltraShinyAllPokemon());
  const hasExplicitShinyVisual = Object.prototype.hasOwnProperty.call(options, "shinyVisual");
  const hasExplicitUltraShinyVisual = Object.prototype.hasOwnProperty.call(options, "ultraShinyVisual");
  const forcedShinyVisual = forceUltraShiny || Boolean(options.forceShiny);
  const explicitShinyVisual = hasExplicitShinyVisual ? Boolean(options.shinyVisual) : false;
  const explicitUltraShinyVisual = hasExplicitUltraShinyVisual ? Boolean(options.ultraShinyVisual) : false;
  const ultraShinyModeRequested = hasExplicitUltraShinyVisual
    ? Boolean(explicitUltraShinyVisual || forceUltraShiny)
    : Boolean(forceUltraShiny || (respectAppearanceUltraShinyMode && record?.appearance_ultra_shiny_mode && ultraShinyUnlocked));
  const shinyModeRequested = hasExplicitShinyVisual
    ? Boolean(explicitShinyVisual || forcedShinyVisual || ultraShinyModeRequested)
    : Boolean(
        forcedShinyVisual
        || ultraShinyModeRequested
        || (respectAppearanceShinyMode && record?.appearance_shiny_mode && shinyUnlocked),
      );
  const ultraShinyVisual = Boolean(ultraShinyModeRequested);
  const shinyPath = getVariantShinySpritePath(def, variant);
  const canRenderShiny = shinyModeRequested && Boolean(shinyPath);
  const shinyNegativeFallbackVisual = Boolean(shinyModeRequested && !ultraShinyVisual && !canRenderShiny);
  const resolvedPath = canRenderShiny ? shinyPath : normalPath;

  const normalCachedImage = normalPath ? getCachedSpriteImage(normalPath) : null;
  const fallbackImage = canRenderShiny
    ? def.spriteShinyImage || normalCachedImage || def.spriteImage
    : normalCachedImage || def.spriteImage;
  const cachedImage = resolvedPath ? getCachedSpriteImage(resolvedPath) : null;
  const resolvedImage = isDrawableImage(cachedImage) ? cachedImage : fallbackImage;

  return {
    variant,
    spritePath: resolvedPath || normalPath || def.spritePath || "",
    spriteImage: resolvedImage || null,
    animated: Boolean(variant?.animated),
    shinyVisual: Boolean(canRenderShiny || ultraShinyVisual || shinyNegativeFallbackVisual),
    shinyNegativeFallbackVisual,
    shinyUnlocked,
    ultraShinyVisual,
    ultraShinyUnlocked,
    shinyModeRequested,
    ultraShinyModeRequested,
  };
}

async function preloadSelectedAppearanceAssetsForTeam() {
  if (!state.saveData || !Array.isArray(state.saveData.team) || state.saveData.team.length <= 0) {
    return;
  }

  const uniqueTeamIds = [];
  for (const rawId of state.saveData.team) {
    const pokemonId = Number(rawId || 0);
    if (pokemonId <= 0 || uniqueTeamIds.includes(pokemonId)) {
      continue;
    }
    uniqueTeamIds.push(pokemonId);
    if (uniqueTeamIds.length >= MAX_TEAM_SIZE) {
      break;
    }
  }

  if (uniqueTeamIds.length <= 0) {
    return;
  }

  const preloadTasks = [];
  for (const pokemonId of uniqueTeamIds) {
    const def = state.pokemonDefsById.get(pokemonId);
    if (!def) {
      continue;
    }
    const record = getPokemonEntityRecord(pokemonId);
    if (record) {
      reconcileAppearanceForEntityRecord(record, pokemonId);
    }
    const selectedVariant = getSelectedOwnedSpriteVariantForRecord(record, def);
    const shinyUnlocked = isShinyAppearanceUnlockedForRecord(record, pokemonId);
    const ultraUnlocked = isUltraShinyAppearanceUnlockedForRecord(record, pokemonId);
    const includeShiny = Boolean(
      shouldForceUltraShinyAllPokemon()
      || (record?.appearance_shiny_mode && shinyUnlocked)
      || (record?.appearance_ultra_shiny_mode && ultraUnlocked),
    );
    preloadTasks.push(
      ensureVariantAppearanceAssetsLoaded(def, selectedVariant, {
        includeShiny,
      }),
    );
  }

  if (preloadTasks.length <= 0) {
    return;
  }
  await Promise.all(preloadTasks);
}

function syncActiveEnemyAppearance() {
  const enemy = state.battle?.getEnemy?.();
  if (!enemy) {
    if (state.battle) {
      state.enemy = null;
    }
    return;
  }

  const def = state.pokemonDefsById.get(Number(enemy.id || 0));
  const ultraShinyVisual = Boolean(enemy.isUltraShiny || enemy.isUltraShinyVisual || shouldForceUltraShinyAllPokemon());
  const shinyVisual = Boolean(enemy.isShiny || ultraShinyVisual);
  const appearance = resolveSpriteAppearanceForEntity(enemy.id, {
    shinyVisual,
    ultraShinyVisual,
    forceUltraShiny: ultraShinyVisual,
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
  });
  const fallbackShinyPath = shinyVisual ? getVariantShinySpritePath(def, appearance?.variant) : "";
  const fallbackPath = fallbackShinyPath || def?.spritePath || "";
  const fallbackImage =
    fallbackShinyPath && shinyVisual
      ? def?.spriteShinyImage || def?.spriteImage || null
      : def?.spriteImage || null;

  enemy.spritePath = appearance.spritePath || fallbackPath || enemy.spritePath || "";
  enemy.spriteImage = appearance.spriteImage || fallbackImage || enemy.spriteImage || null;
  enemy.spriteVariantId = appearance.variant?.id || getDefaultSpriteVariantId(def) || enemy.spriteVariantId || null;
  enemy.spriteAnimated = Boolean(appearance.animated);
  enemy.isShinyVisual = Boolean(shinyVisual || appearance.shinyVisual || appearance.ultraShinyVisual);
  enemy.isUltraShinyVisual = Boolean(ultraShinyVisual || appearance.ultraShinyVisual);
  enemy.isShinyNegativeFallbackVisual = Boolean(
    appearance.shinyNegativeFallbackVisual && !enemy.isUltraShinyVisual,
  );
  state.enemy = enemy;
}

function getSpriteVariantPurchasePrice(def, variantId) {
  const variant = getSpriteVariantById(def, variantId);
  if (!variant) {
    return 0;
  }
  const defaultId = getDefaultSpriteVariantId(def);
  if (variant.id === defaultId) {
    return 0;
  }
  const orderIndex = getSpriteVariantOrderIndex(def, variant.id);
  const generationDelta = Math.max(0, toSafeInt(variant.generation, 1) - 1);
  const computed =
    SPRITE_VARIANT_BASE_PRICE + generationDelta * SPRITE_VARIANT_GEN_PRICE_STEP + orderIndex * SPRITE_VARIANT_INDEX_PRICE_STEP;
  return Math.max(200, Math.round(computed));
}

function setEntityLevel(record, level) {
  if (!record) {
    return;
  }
  const normalizedLevel = clamp(toSafeInt(level, 1), 1, MAX_LEVEL);
  const baseStats = getPokemonBaseStats(record.id, record.base_stats || record.stats);
  record.level = normalizedLevel;
  record.base_stats = baseStats;
  record.stats = computeStatsAtLevel(baseStats, normalizedLevel);
  if (record.level >= MAX_LEVEL) {
    record.xp = 0;
  } else {
    record.xp = Math.max(0, toSafeInt(record.xp, 0));
  }
}

function ensureMoneyAndItems() {
  if (!state.saveData) {
    markEconomyNormalizationDirty();
    return;
  }
  const normalizationState = state.economyNormalization;
  const ballRevision = Math.max(0, toSafeInt(state.configRevisions?.ball, 0));
  const shopItemRevision = Math.max(0, toSafeInt(state.configRevisions?.shopItem, 0));
  if (
    normalizationState.saveDataRef === state.saveData
    && normalizationState.ballRevision === ballRevision
    && normalizationState.shopItemRevision === shopItemRevision
  ) {
    return;
  }
  state.saveData.money = Math.max(0, toSafeInt(state.saveData.money, 0));
  state.saveData.coins = Math.max(0, toSafeInt(state.saveData.coins, 0));
  const rawBallInventory = state.saveData.ball_inventory;
  const normalizedBallInventory = normalizeBallInventory(rawBallInventory);
  const legacyBalls = Math.max(0, toSafeInt(state.saveData.pokeballs, 0));
  const normalizedInventoryTotal = computeBallInventoryTotal(normalizedBallInventory);
  if (!hasStructuredBallInventory(rawBallInventory) && normalizedInventoryTotal <= 0 && legacyBalls > 0) {
    const fallbackBallType = getLegacyBallBackfillType();
    normalizedBallInventory[fallbackBallType] =
      clampBallInventoryCount(Math.max(0, toSafeInt(normalizedBallInventory[fallbackBallType], 0)) + legacyBalls);
  }
  state.saveData.ball_inventory = normalizedBallInventory;
  state.saveData.ball_inventory_seen = normalizeBallInventorySeen(
    state.saveData.ball_inventory_seen,
    normalizedBallInventory,
  );
  state.saveData.ball_capture_rules = normalizeBallCaptureRulesByType(state.saveData.ball_capture_rules);
  state.saveData.shop_items = normalizeShopItemsInventory(state.saveData.shop_items);
  state.saveData.attack_boost_until_ms = Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0));
  const activeBallType = String(state.saveData.active_ball_type || "").toLowerCase().trim();
  state.saveData.active_ball_type = Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, activeBallType)
    ? activeBallType
    : getDefaultActiveBallType();
  state.saveData.first_free_pokeball_claimed = Boolean(state.saveData.first_free_pokeball_claimed);
  state.saveData.first_free_pokeball_guaranteed_capture_pending =
    state.saveData.first_free_pokeball_claimed
    && Boolean(state.saveData.first_free_pokeball_guaranteed_capture_pending);
  state.saveData.pokeballs = computeBallInventoryTotal(normalizedBallInventory);
  normalizationState.saveDataRef = state.saveData;
  normalizationState.ballRevision = ballRevision;
  normalizationState.shopItemRevision = shopItemRevision;
}

function getBallInventoryCount(ballType) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return 0;
  }
  return clampBallInventoryCount(state.saveData.ball_inventory?.[type]);
}

function getBallInventoryRemainingCapacity(ballType) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return 0;
  }
  const currentCount = clampBallInventoryCount(state.saveData.ball_inventory?.[type]);
  return Math.max(0, BALL_INVENTORY_MAX_PER_TYPE - currentCount);
}

function getBallInventoryTotalCount() {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  return computeBallInventoryTotal(state.saveData.ball_inventory);
}

function hasBallInventoryBeenSeen(ballType) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  return Boolean(state.saveData.ball_inventory_seen?.[type]);
}

function markBallInventorySeen(ballType) {
  if (!state.saveData) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  if (!state.saveData.ball_inventory_seen || typeof state.saveData.ball_inventory_seen !== "object") {
    state.saveData.ball_inventory_seen = createDefaultBallInventorySeen();
  }
  state.saveData.ball_inventory_seen[type] = true;
  state.saveData.ball_inventory_seen.poke_ball = true;
}

function getBallCaptureRulesForType(ballType) {
  if (!state.saveData) {
    return createDefaultSingleBallCaptureRules();
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return createDefaultSingleBallCaptureRules();
  }
  return normalizeSingleBallCaptureRules(state.saveData.ball_capture_rules?.[type]);
}

function setBallCaptureRulesForType(ballType, nextRules) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  const previous = normalizeSingleBallCaptureRules(state.saveData.ball_capture_rules?.[type]);
  const normalizedNext = normalizeSingleBallCaptureRules(nextRules);
  if (JSON.stringify(previous) === JSON.stringify(normalizedNext)) {
    return false;
  }
  state.saveData.ball_capture_rules[type] = normalizedNext;
  return true;
}

function shouldCaptureEnemyWithBallType(ballType, enemy) {
  if (!enemy) {
    return false;
  }
  const rules = getBallCaptureRulesForType(ballType);
  if (rules[BALL_CAPTURE_RULE_CAPTURE_ALL]) {
    return true;
  }

  const enemyId = Number(enemy.id || 0);
  const familyOwned = enemyId > 0 ? isEvolutionFamilyOwned(enemyId) : false;
  if (rules[BALL_CAPTURE_RULE_CAPTURE_UNOWNED] && !familyOwned) {
    return true;
  }
  if (rules[BALL_CAPTURE_RULE_CAPTURE_OWNED] && familyOwned) {
    return true;
  }
  if (Boolean(enemy.isUltraShiny)) {
    return Boolean(rules[BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY]);
  }
  if (Boolean(enemy.isShiny)) {
    return Boolean(rules[BALL_CAPTURE_RULE_CAPTURE_SHINY]);
  }
  return false;
}

function setActiveBallType(ballType) {
  if (!state.saveData) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  ensureMoneyAndItems();
  state.saveData.active_ball_type = type;
}

function getActiveBallType() {
  if (!state.saveData) {
    return getDefaultActiveBallType();
  }
  ensureMoneyAndItems();
  return String(state.saveData.active_ball_type || getDefaultActiveBallType());
}

function addBallItems(ballType, amount) {
  if (!state.saveData) {
    return;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return;
  }
  ensureMoneyAndItems();
  const delta = Math.max(0, toSafeInt(amount, 0));
  if (delta <= 0) {
    return;
  }
  const currentCount = clampBallInventoryCount(state.saveData.ball_inventory[type]);
  const capacityLeft = Math.max(0, BALL_INVENTORY_MAX_PER_TYPE - currentCount);
  if (capacityLeft <= 0) {
    return;
  }
  const appliedDelta = Math.min(delta, capacityLeft);
  state.saveData.ball_inventory[type] = currentCount + appliedDelta;
  markBallInventorySeen(type);
  state.saveData.pokeballs = computeBallInventoryTotal(state.saveData.ball_inventory);
  syncWindowsPokeballInventoryTracking(state.saveData.pokeballs);
}

function consumeBallItem(ballType, amount = 1) {
  if (!state.saveData) {
    return false;
  }
  const type = String(ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return false;
  }
  ensureMoneyAndItems();
  const qty = Math.max(1, toSafeInt(amount, 1));
  const current = Math.max(0, toSafeInt(state.saveData.ball_inventory[type], 0));
  if (current < qty) {
    return false;
  }
  state.saveData.ball_inventory[type] = current - qty;
  state.saveData.pokeballs = computeBallInventoryTotal(state.saveData.ball_inventory);
  syncWindowsPokeballInventoryTracking(state.saveData.pokeballs, { ballType: type });
  return true;
}

function getBallTypeForCapture(enemy = null) {
  if (!state.saveData) {
    return null;
  }
  ensureMoneyAndItems();
  const targetEnemy = enemy || state.enemy;
  for (const type of BALL_TYPE_ORDER) {
    if (getBallInventoryCount(type) > 0 && shouldCaptureEnemyWithBallType(type, targetEnemy)) {
      state.saveData.active_ball_type = type;
      return type;
    }
  }
  const activeType = getActiveBallType();
  if (getBallInventoryCount(activeType) > 0 && shouldCaptureEnemyWithBallType(activeType, targetEnemy)) {
    return activeType;
  }
  return null;
}

function consumeBallForCapture(enemy = null) {
  const ballType = getBallTypeForCapture(enemy);
  if (!ballType) {
    return { consumed: false, ballType: null };
  }
  const consumed = consumeBallItem(ballType, 1);
  return {
    consumed,
    ballType: consumed ? ballType : null,
  };
}

function getBallTypeLabel(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    return BALL_CONFIG_BY_TYPE[type].nameFr;
  }
  return "PokeBall";
}

function getBallCaptureMultiplier(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
    const configuredMultiplier = Math.max(0.05, Number(BALL_CONFIG_BY_TYPE[type].captureMultiplier || 1));
    return Math.max(0.05, configuredMultiplier * CAPTURE_BALL_MULTIPLIER_NERF);
  }
  return CAPTURE_BALL_MULTIPLIER_NERF;
}

function normalizeBallTypeForVisual(ballType) {
  const type = String(ballType || "").toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type) ? type : "poke_ball";
}

function getBallRenderTheme(ballType) {
  const type = normalizeBallTypeForVisual(ballType);
  if (type === "super_ball") {
    return {
      type,
      shell: [245, 248, 255],
      seam: [15, 20, 34],
      topA: [56, 148, 255],
      topB: [18, 73, 182],
      topHighlight: [190, 225, 255],
      glowCore: [102, 189, 255],
      glowOuter: [56, 112, 255],
      buttonOuter: [31, 48, 81],
      buttonCenter: [213, 233, 255],
      breakColors: [
        [56, 148, 255],
        [228, 68, 88],
        [248, 250, 255],
      ],
      successColors: [
        [103, 188, 255],
        [255, 116, 136],
        [241, 248, 255],
      ],
      criticalSuccessColors: [
        [255, 229, 138],
        [160, 220, 255],
        [223, 191, 255],
      ],
    };
  }
  if (type === "hyper_ball") {
    return {
      type,
      shell: [244, 247, 252],
      seam: [12, 16, 25],
      topA: [63, 69, 83],
      topB: [23, 27, 38],
      topHighlight: [152, 161, 183],
      glowCore: [255, 229, 122],
      glowOuter: [88, 98, 146],
      buttonOuter: [32, 38, 58],
      buttonCenter: [250, 220, 112],
      breakColors: [
        [248, 216, 86],
        [63, 69, 83],
        [243, 247, 252],
      ],
      successColors: [
        [255, 220, 122],
        [171, 183, 255],
        [244, 249, 255],
      ],
      criticalSuccessColors: [
        [255, 234, 150],
        [245, 202, 120],
        [203, 177, 255],
      ],
    };
  }
  return {
    type: "poke_ball",
    shell: [248, 248, 248],
    seam: [14, 17, 23],
    topA: [232, 68, 82],
    topB: [188, 39, 53],
    topHighlight: [255, 168, 174],
    glowCore: [176, 255, 202],
    glowOuter: [96, 208, 148],
    buttonOuter: [34, 41, 55],
    buttonCenter: [250, 250, 250],
    breakColors: [
      [225, 48, 60],
      [250, 250, 250],
    ],
    successColors: [
      [115, 240, 160],
      [255, 255, 195],
    ],
    criticalSuccessColors: [
      [255, 236, 130],
      [214, 174, 255],
      [184, 231, 255],
    ],
  };
}

function getBallInventoryOverlayRows() {
  if (!state.saveData) {
    return [];
  }
  ensureMoneyAndItems();
  const rows = [];
  for (const ballType of BALL_TYPE_FALLBACK_ORDER) {
    const type = String(ballType || "").toLowerCase().trim();
    if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, type)) {
      continue;
    }
    if (isBallTypeComingSoon(type)) {
      continue;
    }
    const count = Math.max(0, toSafeInt(state.saveData.ball_inventory?.[type], 0));
    rows.push({
      type,
      count,
      spritePath: String(BALL_CONFIG_BY_TYPE[type]?.spritePath || ""),
    });
  }
  return rows;
}

function addShopItemCount(itemType, amount = 1) {
  if (!state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  const type = String(itemType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(state.saveData.shop_items, type)) {
    return;
  }
  const delta = Math.max(0, toSafeInt(amount, 0));
  state.saveData.shop_items[type] = Math.max(0, toSafeInt(state.saveData.shop_items[type], 0)) + delta;
}

function consumeShopItemCount(itemType, amount = 1) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  const type = String(itemType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(state.saveData.shop_items, type)) {
    return false;
  }
  const qty = Math.max(1, toSafeInt(amount, 1));
  const current = Math.max(0, toSafeInt(state.saveData.shop_items[type], 0));
  if (current < qty) {
    return false;
  }
  state.saveData.shop_items[type] = current - qty;
  return true;
}

function getShopItemCount(itemType) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const type = String(itemType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(state.saveData.shop_items, type)) {
    return 0;
  }
  return Math.max(0, toSafeInt(state.saveData.shop_items[type], 0));
}

function isAttackBoostActive(nowMs = Date.now()) {
  if (!state.saveData) {
    return false;
  }
  ensureMoneyAndItems();
  return Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0)) > Math.max(0, toSafeInt(nowMs, Date.now()));
}

function getAttackBoostConfig() {
  const config = SHOP_ITEM_CONFIG_BY_ID.x_boost;
  if (config && config.itemType === "boost") {
    return config;
  }
  return DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID.x_boost;
}

function getAttackBoostIntervalMultiplier() {
  const config = getAttackBoostConfig();
  const rawMultiplier = Number(config?.effectValue ?? BOOST_X_ATTACK_INTERVAL_MULTIPLIER);
  if (!Number.isFinite(rawMultiplier)) {
    return BOOST_X_ATTACK_INTERVAL_MULTIPLIER;
  }
  return clamp(rawMultiplier, 0.05, 20);
}

function getAttackBoostDurationMsFromConfig() {
  const config = getAttackBoostConfig();
  return Math.max(1000, toSafeInt(config?.effectDurationMs, BOOST_X_DURATION_MS));
}

function getAttackBoostRemainingMs(nowMs = Date.now()) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const untilMs = Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0));
  return Math.max(0, untilMs - Math.max(0, toSafeInt(nowMs, Date.now())));
}

function getCurrentAttackIntervalMs(nowMs = Date.now()) {
  const baseInterval = ATTACK_INTERVAL_MS;
  let multiplier = 1;
  if (isAttackBoostActive(nowMs)) {
    multiplier *= getAttackBoostIntervalMultiplier();
  }
  multiplier *= getLegendaryFieldAttackIntervalMultiplier(state.team);
  return Math.max(65, Math.round(baseInterval * multiplier));
}

function activateAttackBoost(durationMs = getAttackBoostDurationMsFromConfig()) {
  if (!state.saveData) {
    return 0;
  }
  ensureMoneyAndItems();
  const now = Date.now();
  const baseStart = Math.max(now, Math.max(0, toSafeInt(state.saveData.attack_boost_until_ms, 0)));
  const duration = Math.max(1000, toSafeInt(durationMs, BOOST_X_DURATION_MS));
  state.saveData.attack_boost_until_ms = baseStart + duration;
  return getAttackBoostRemainingMs(now);
}

function addMoney(amount) {
  rewardProgressionSystem.addMoney(amount);
}

function addCoins(amount) {
  rewardProgressionSystem.addCoins(amount);
}

function spendMoney(amount) {
  return rewardProgressionSystem.spendMoney(amount);
}

function spendCoins(amount) {
  return rewardProgressionSystem.spendCoins(amount);
}

function addPokeballs(amount) {
  addBallItems("poke_ball", amount);
}

function consumePokeball() {
  return consumeBallForCapture().consumed;
}

function ensurePokemonEntityUnlocked(pokemonId, initialLevel = 1) {
  const record = ensureSpeciesStats(pokemonId);
  reconcileAppearanceForEntityRecord(record, pokemonId);
  const wasUnlocked = isEntityUnlocked(record);
  let captureBackfilled = false;
  if (!wasUnlocked) {
    setEntityLevel(record, initialLevel);
    record.xp = 0;
    markEntityUnlocked(record, true);
    reconcileAppearanceForEntityRecord(record, pokemonId);
    captureBackfilled = ensureOwnedRecordHasAtLeastOneCapture(record);
  } else {
    captureBackfilled = ensureOwnedRecordHasAtLeastOneCapture(record);
  }
  return { record, wasUnlocked, captureBackfilled };
}

function addSpeciesToTeamIfPossible(pokemonId) {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return false;
  }
  const id = Number(pokemonId);
  if (id <= 0) {
    return false;
  }
  if (state.saveData.team.includes(id)) {
    return false;
  }
  if (state.saveData.team.length >= MAX_TEAM_SIZE) {
    return false;
  }
  state.saveData.team.push(id);
  return true;
}

function normalizeComparisonToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCurrentTimeOfDayTag(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 18 || hour < 5) {
    return "night";
  }
  if (hour >= 16) {
    return "dusk";
  }
  return "day";
}

function isEvolutionTimeOfDaySatisfied(requiredTimeOfDay) {
  const required = String(requiredTimeOfDay || "").toLowerCase().trim();
  if (!required) {
    return true;
  }
  const currentTag = getCurrentTimeOfDayTag();
  if (required === "day" || required === "morning" || required === "afternoon") {
    return currentTag === "day";
  }
  if (required === "dusk" || required === "evening") {
    return currentTag === "dusk" || currentTag === "night";
  }
  if (required === "night") {
    return currentTag === "night";
  }
  return false;
}

function doesCurrentRouteMatchEvolutionLocation(locationToken) {
  const token = normalizeComparisonToken(locationToken);
  if (!token) {
    return true;
  }

  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const routeName = state.routeData?.route_name_fr || getRouteDisplayName(activeRouteId);
  const routeIdToken = normalizeComparisonToken(activeRouteId);
  const routeNameToken = normalizeComparisonToken(routeName);
  return routeIdToken.includes(token) || routeNameToken.includes(token);
}

function hasEvolutionItemConditionReady(record, targetPokemonId) {
  const targetId = Number(targetPokemonId || 0);
  if (!record || targetId <= 0) {
    return false;
  }
  const readyTargets = normalizeEvolutionItemReadyTargets(record.evolution_item_ready_targets);
  return readyTargets.includes(targetId);
}

function setEvolutionItemConditionReady(fromPokemonId, toPokemonId) {
  const fromId = Number(fromPokemonId || 0);
  const toId = Number(toPokemonId || 0);
  if (fromId <= 0 || toId <= 0 || fromId === toId) {
    return false;
  }
  const record = getPokemonEntityRecord(fromId);
  if (!record || !isEntityUnlocked(record) || isPokemonEntityUnlockedById(toId)) {
    return false;
  }
  const readyTargets = normalizeEvolutionItemReadyTargets(record.evolution_item_ready_targets);
  if (!readyTargets.includes(toId)) {
    readyTargets.push(toId);
  }
  record.evolution_item_ready_targets = readyTargets;
  return true;
}

function consumeEvolutionItemConditionReady(record, targetPokemonId) {
  if (!record) {
    return;
  }
  const targetId = Number(targetPokemonId || 0);
  if (targetId <= 0) {
    return;
  }
  const readyTargets = normalizeEvolutionItemReadyTargets(record.evolution_item_ready_targets);
  record.evolution_item_ready_targets = readyTargets.filter((entry) => Number(entry) !== targetId);
}

function getHappinessEvolutionBoxStreakMs(record) {
  return Math.max(0, toSafeInt(record?.happiness_box_streak_ms, 0));
}

function hasHappinessEvolutionMethodForPokemon(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const def = state.pokemonDefsById.get(id);
  if (!def || !Array.isArray(def.evolvesTo) || def.evolvesTo.length <= 0) {
    return false;
  }
  return def.evolvesTo.some((target) => {
    const methods = Array.isArray(target?.evolutionMethods) ? target.evolutionMethods : [];
    return methods.some((method) => method?.minHappiness != null);
  });
}

function isHappinessEvolutionConditionSatisfied(record) {
  return getHappinessEvolutionBoxStreakMs(record) >= HAPPINESS_EVOLUTION_BOX_REQUIRED_MS;
}

function updateHappinessEvolutionBoxProgress(deltaMs) {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return;
  }
  const stepMs = Math.max(0, Number(deltaMs) || 0);
  const teamIds = new Set(
    Array.isArray(state.saveData.team)
      ? state.saveData.team
          .map((id) => Number(id))
          .filter((id) => id > 0)
      : [],
  );

  for (const [rawKey, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawKey || 0);
    if (pokemonId <= 0 || !rawRecord || typeof rawRecord !== "object" || !isEntityUnlocked(rawRecord)) {
      continue;
    }
    if (!hasHappinessEvolutionMethodForPokemon(pokemonId)) {
      continue;
    }
    if (teamIds.has(pokemonId)) {
      if (getHappinessEvolutionBoxStreakMs(rawRecord) > 0) {
        rawRecord.happiness_box_streak_ms = 0;
      }
      continue;
    }
    if (stepMs <= 0) {
      continue;
    }
    const nextValue = Math.min(
      HAPPINESS_EVOLUTION_BOX_REQUIRED_MS,
      getHappinessEvolutionBoxStreakMs(rawRecord) + stepMs,
    );
    rawRecord.happiness_box_streak_ms = Math.round(nextValue);
  }
}

function isEvolutionMethodSatisfied(record, method, targetPokemonId = 0) {
  if (!record || !method) {
    return false;
  }

  const trigger = String(method.trigger || method.evolutionType || "").toLowerCase();
  if (trigger === "use-item" || trigger === "item" || trigger === "trade") {
    return hasEvolutionItemConditionReady(record, targetPokemonId);
  }
  if (trigger !== "level-up") {
    return false;
  }

  if (method.minLevel != null && record.level < method.minLevel) {
    return false;
  }

  if (method.minHappiness != null && !isHappinessEvolutionConditionSatisfied(record)) {
    return false;
  }

  if (method.timeOfDay && !isEvolutionTimeOfDaySatisfied(method.timeOfDay)) {
    return false;
  }

  if (method.relativePhysicalStats != null) {
    const attack = Math.max(0, toSafeInt(record.stats?.attack, 0));
    const defense = Math.max(0, toSafeInt(record.stats?.defense, 0));
    if (method.relativePhysicalStats > 0 && attack <= defense) {
      return false;
    }
    if (method.relativePhysicalStats < 0 && attack >= defense) {
      return false;
    }
    if (method.relativePhysicalStats === 0 && attack !== defense) {
      return false;
    }
  }

  if (method.partySpecies != null) {
    const requiredPartySpecies = Number(method.partySpecies);
    if (
      requiredPartySpecies <= 0 ||
      !Array.isArray(state.saveData?.team) ||
      !state.saveData.team.some((id) => Number(id) === requiredPartySpecies)
    ) {
      return false;
    }
  }

  if (method.location && !doesCurrentRouteMatchEvolutionLocation(method.location)) {
    return false;
  }

  if (
    method.minBeauty != null ||
    method.gender ||
    method.item ||
    method.heldItem ||
    method.knownMove
  ) {
    return false;
  }

  return true;
}

function findNextEligibleEvolution(record) {
  const pokemonId = Number(record?.id || 0);
  if (pokemonId <= 0) {
    return null;
  }
  const fromDef = state.pokemonDefsById.get(pokemonId);
  if (!fromDef || !Array.isArray(fromDef.evolvesTo) || fromDef.evolvesTo.length === 0) {
    return null;
  }

  for (const target of fromDef.evolvesTo) {
    const toId = Number(target?.id || 0);
    if (toId <= 0 || toId === pokemonId) {
      continue;
    }
    if (isPokemonEntityUnlockedById(toId)) {
      continue;
    }
    const methods = Array.isArray(target.evolutionMethods) ? target.evolutionMethods : [];
    if (methods.length === 0) {
      continue;
    }
    if (!methods.some((method) => isEvolutionMethodSatisfied(record, method, toId))) {
      continue;
    }
    const toDef = state.pokemonDefsById.get(toId);
    if (!toDef) {
      continue;
    }
    return {
      fromId: pokemonId,
      toId,
      fromDef,
      toDef,
    };
  }

  return null;
}

function applyEvolutionUnlockAndTeamPlacement(fromPokemonId, toPokemonId, preferredSlotIndex = -1) {
  if (!state.saveData || !Array.isArray(state.saveData.team)) {
    return null;
  }

  const fromId = Number(fromPokemonId || 0);
  const toId = Number(toPokemonId || 0);
  if (fromId <= 0 || toId <= 0 || fromId === toId) {
    return null;
  }
  const fromRecord = getPokemonEntityRecord(fromId);
  if (!fromRecord || !isEntityUnlocked(fromRecord)) {
    return null;
  }

  const unlockResult = ensurePokemonEntityUnlocked(toId, 1);
  if (unlockResult.wasUnlocked) {
    return null;
  }
  consumeEvolutionItemConditionReady(fromRecord, toId);

  const team = state.saveData.team;
  let teamAction = "none";
  let slotIndex = -1;
  let replaceIndex = -1;

  if (preferredSlotIndex >= 0 && preferredSlotIndex < team.length && Number(team[preferredSlotIndex]) === fromId) {
    replaceIndex = preferredSlotIndex;
  } else {
    replaceIndex = team.findIndex((id) => Number(id) === fromId);
  }

  if (replaceIndex >= 0) {
    team[replaceIndex] = toId;
    teamAction = "replaced";
    slotIndex = replaceIndex;
  } else if (!team.some((id) => Number(id) === toId) && team.length < MAX_TEAM_SIZE) {
    team.push(toId);
    teamAction = "added";
    slotIndex = team.length - 1;
  }

  const fromDef = state.pokemonDefsById.get(fromId);
  const toDef = state.pokemonDefsById.get(toId);
  return {
    fromId,
    toId,
    fromDef: fromDef || null,
    toDef: toDef || null,
    fromNameFr: fromDef?.nameFr || "Pokemon " + String(fromId),
    toNameFr: toDef?.nameFr || "Pokemon " + String(toId),
    teamAction,
    teamSlotIndex: slotIndex,
  };
}

function getEvolutionStoneMethodItem(stoneType) {
  const key = String(stoneType || "").toLowerCase().trim();
  return EVOLUTION_STONE_CONFIG_BY_TYPE[key]?.methodItem || "";
}

function isEvolutionMethodCompatibleWithShopItem(method, methodItem) {
  if (!method) {
    return false;
  }
  const expectedMethodItem = String(methodItem || "").toLowerCase().trim();
  if (!expectedMethodItem) {
    return false;
  }

  const trigger = String(method.trigger || method.evolutionType || "").toLowerCase().trim();
  const itemToken = String(method.item || "").toLowerCase().trim();
  const heldItemToken = String(method.heldItem || "").toLowerCase().trim();
  if (trigger === "use-item" || trigger === "item") {
    return itemToken === expectedMethodItem;
  }
  if (trigger !== "trade") {
    return false;
  }
  if (itemToken) {
    return itemToken === expectedMethodItem;
  }
  if (heldItemToken) {
    return heldItemToken === expectedMethodItem;
  }
  return expectedMethodItem === CABLE_LINK_METHOD_ITEM;
}

function findEvolutionStoneCandidates(stoneType) {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return [];
  }
  const methodItem = getEvolutionStoneMethodItem(stoneType);
  if (!methodItem) {
    return [];
  }

  const team = Array.isArray(state.saveData.team) ? state.saveData.team.map((id) => Number(id)) : [];
  const candidates = [];

  for (const [rawId, rawRecord] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(rawRecord?.id || rawId || 0);
    if (pokemonId <= 0) {
      continue;
    }
    const record = normalizePokemonEntityRecord(rawRecord, pokemonId);
    if (!isEntityUnlocked(record)) {
      continue;
    }

    const fromDef = state.pokemonDefsById.get(pokemonId);
    if (!fromDef || !Array.isArray(fromDef.evolvesTo) || fromDef.evolvesTo.length <= 0) {
      continue;
    }

    for (const target of fromDef.evolvesTo) {
      const toId = Number(target?.id || 0);
      if (toId <= 0 || isPokemonEntityUnlockedById(toId)) {
        continue;
      }
      if (hasEvolutionItemConditionReady(record, toId)) {
        continue;
      }
      const methods = Array.isArray(target.evolutionMethods) ? target.evolutionMethods : [];
      const hasItemMethod = methods.some((method) => isEvolutionMethodCompatibleWithShopItem(method, methodItem));
      if (!hasItemMethod) {
        continue;
      }
      const toDef = state.pokemonDefsById.get(toId);
      if (!toDef) {
        continue;
      }
      candidates.push({
        fromId: pokemonId,
        toId,
        fromDef,
        toDef,
        fromNameFr: fromDef.nameFr,
        toNameFr: toDef.nameFr,
        teamSlotIndex: team.findIndex((id) => id === pokemonId),
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.fromId !== b.fromId) {
      return a.fromId - b.fromId;
    }
    return a.toId - b.toId;
  });
  return candidates;
}

function getEvolutionItemChoiceStoneName(stoneType) {
  return EVOLUTION_STONE_CONFIG_BY_TYPE[String(stoneType || "").toLowerCase().trim()]?.nameFr || "Objet d'evolution";
}

function getEvolutionItemChoiceSpritePath(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return "";
  }
  const appearance = resolveSpriteAppearanceForEntity(id, {
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
    forceShiny: false,
    forceUltraShiny: false,
  });
  const def = state.pokemonDefsById.get(id);
  return String(appearance?.variant?.frontPath || def?.spritePath || appearance?.spritePath || "").trim();
}

function createEvolutionItemChoiceMonElement(pokemonId, nameFr, { silhouette = false } = {}) {
  const card = document.createElement("div");
  card.className = "evolution-item-choice-mon";

  const spriteWrap = document.createElement("div");
  spriteWrap.className = "evolution-item-choice-sprite-wrap";
  const spritePath = getEvolutionItemChoiceSpritePath(pokemonId);
  if (spritePath) {
    const spriteImg = document.createElement("img");
    spriteImg.className = `evolution-item-choice-sprite${silhouette ? " is-silhouette" : ""}`;
    spriteImg.src = spritePath;
    spriteImg.alt = nameFr || `Pokemon ${String(pokemonId || "")}`;
    spriteWrap.appendChild(spriteImg);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "evolution-item-choice-fallback";
    fallback.textContent = "???";
    spriteWrap.appendChild(fallback);
  }
  if (silhouette) {
    const question = document.createElement("span");
    question.className = "evolution-item-choice-question";
    question.textContent = "?";
    spriteWrap.appendChild(question);
  }
  card.appendChild(spriteWrap);

  const nameEl = document.createElement("div");
  nameEl.className = "evolution-item-choice-mon-name";
  nameEl.textContent = String(nameFr || "").trim() || `Pokemon ${String(pokemonId || "")}`;
  card.appendChild(nameEl);
  return card;
}

function renderEvolutionItemChoiceModal() {
  if (!evolutionItemTitleEl || !evolutionItemSubtitleEl || !evolutionItemListEl) {
    return;
  }
  const stoneName = getEvolutionItemChoiceStoneName(evolutionItemChoiceStoneType);
  const candidates = Array.isArray(evolutionItemChoiceCandidates) ? evolutionItemChoiceCandidates : [];
  evolutionItemTitleEl.textContent = stoneName;
  evolutionItemSubtitleEl.textContent = "Choisis un Pokemon compatible avec cet objet.";
  evolutionItemListEl.innerHTML = "";

  if (candidates.length <= 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "evolution-item-empty";
    emptyEl.textContent = "Aucun Pokemon compatible pour le moment.";
    evolutionItemListEl.appendChild(emptyEl);
    return;
  }

  for (const entry of candidates) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "evolution-item-choice-btn";

    const meta = document.createElement("div");
    meta.className = "evolution-item-choice-meta";
    const nameEl = document.createElement("div");
    nameEl.className = "evolution-item-choice-name";
    nameEl.textContent = `${entry.fromNameFr} -> ${entry.toNameFr}`;
    meta.appendChild(nameEl);
    if (entry.teamSlotIndex >= 0) {
      const teamEl = document.createElement("div");
      teamEl.className = "evolution-item-choice-team";
      teamEl.textContent = `Equipe #${entry.teamSlotIndex + 1}`;
      meta.appendChild(teamEl);
    }
    button.appendChild(meta);

    const row = document.createElement("div");
    row.className = "evolution-item-choice-row";
    row.appendChild(createEvolutionItemChoiceMonElement(entry.fromId, entry.fromNameFr, { silhouette: false }));
    const arrow = document.createElement("div");
    arrow.className = "evolution-item-choice-arrow";
    arrow.textContent = "\u2192";
    row.appendChild(arrow);
    row.appendChild(createEvolutionItemChoiceMonElement(entry.toId, entry.toNameFr, { silhouette: true }));
    button.appendChild(row);

    button.addEventListener("click", () => {
      closeEvolutionItemChoiceModal(entry);
    });
    evolutionItemListEl.appendChild(button);
  }
}

function closeEvolutionItemChoiceModal(selectedCandidate = null) {
  const resolver = evolutionItemChoiceResolver;
  evolutionItemChoiceResolver = null;
  evolutionItemChoiceStoneType = "";
  evolutionItemChoiceCandidates = [];
  state.ui.evolutionItemChoiceOpen = false;
  state.ui.evolutionItemChoiceStoneType = "";
  if (evolutionItemModalEl) {
    hideModalWithTween(evolutionItemModalEl);
  }
  if (typeof resolver === "function") {
    resolver(selectedCandidate);
  }
}

function promptEvolutionStoneChoice(stoneType, candidates) {
  if (!Array.isArray(candidates) || candidates.length <= 0) {
    return Promise.resolve(null);
  }
  const key = String(stoneType || "").toLowerCase().trim();
  if (!evolutionItemModalEl || !evolutionItemTitleEl || !evolutionItemSubtitleEl || !evolutionItemListEl) {
    return Promise.resolve(candidates[0] || null);
  }

  if (typeof evolutionItemChoiceResolver === "function") {
    evolutionItemChoiceResolver(null);
  }
  evolutionItemChoiceStoneType = key;
  evolutionItemChoiceCandidates = candidates.slice();
  state.ui.evolutionItemChoiceOpen = true;
  state.ui.evolutionItemChoiceStoneType = key;
  renderEvolutionItemChoiceModal();
  showModalWithTween(evolutionItemModalEl);
  return new Promise((resolve) => {
    evolutionItemChoiceResolver = resolve;
  });
}

function queueEvolutionAnimationForResult(evolutionResult) {
  if (!evolutionResult || !evolutionResult.fromDef || !evolutionResult.toDef) {
    return;
  }
  const particles = [];
  const particleCount = shouldRenderCelebrationParticles()
    ? EVOLUTION_ANIM_PARTICLE_COUNT
    : Math.max(8, Math.round(EVOLUTION_ANIM_PARTICLE_COUNT * 0.65));
  const particleColors = [
    [145, 212, 255],
    [255, 243, 172],
    [214, 185, 255],
  ];
  for (let i = 0; i < particleCount; i += 1) {
    particles.push({
      startMs: randomRange(0, EVOLUTION_ANIM_TOTAL_MS * 0.68),
      durationMs: randomRange(760, 1320),
      baseAngle: randomRange(0, Math.PI * 2),
      spinTurns: randomRange(0.45, 1.15) * (Math.random() < 0.5 ? -1 : 1),
      radiusStart: randomRange(0.16, 0.34),
      radiusGrow: randomRange(0.12, 0.26),
      lift: randomRange(0.1, 0.24),
      heightOffset: randomRange(-0.12, 0.18),
      size: randomRange(1.5, 3.2),
      color: particleColors[i % particleColors.length],
    });
  }
  state.evolutionAnimation.queue.push({
    fromId: evolutionResult.fromId,
    toId: evolutionResult.toId,
    fromDef: evolutionResult.fromDef,
    toDef: evolutionResult.toDef,
    fromNameFr: evolutionResult.fromNameFr,
    toNameFr: evolutionResult.toNameFr,
    elapsedMs: 0,
    totalMs: EVOLUTION_ANIM_TOTAL_MS,
    particles,
  });
  activateNextEvolutionAnimationIfNeeded();
}

function activateNextEvolutionAnimationIfNeeded() {
  if (state.evolutionAnimation.current) {
    return false;
  }
  const queue = Array.isArray(state.evolutionAnimation.queue) ? state.evolutionAnimation.queue : [];
  while (queue.length > 0) {
    const candidate = queue.shift();
    if (!candidate || !candidate.fromDef || !candidate.toDef) {
      continue;
    }
    state.evolutionAnimation.current = {
      ...candidate,
      elapsedMs: 0,
      totalMs: Math.max(
        EVOLUTION_ANIM_TOTAL_MS,
        EVOLUTION_ANIM_WHITE_MS + EVOLUTION_ANIM_FLASH_MS + EVOLUTION_ANIM_REVEAL_MS,
      ),
    };
    if (typeof syncCanvasInteractionCursor === "function") {
      syncCanvasInteractionCursor();
    }
    return true;
  }
  return false;
}

function updateEvolutionAnimation(deltaMs) {
  activateNextEvolutionAnimationIfNeeded();
  const current = state.evolutionAnimation.current;
  if (!current) {
    return false;
  }
  current.elapsedMs = Math.max(0, Number(current.elapsedMs || 0) + Math.max(0, Number(deltaMs) || 0));
  const totalMs = Math.max(1, Number(current.totalMs || EVOLUTION_ANIM_TOTAL_MS));
  if (current.elapsedMs < totalMs) {
    return true;
  }
  state.evolutionAnimation.current = null;
  activateNextEvolutionAnimationIfNeeded();
  if (typeof syncCanvasInteractionCursor === "function") {
    syncCanvasInteractionCursor();
  }
  return true;
}

function drawEvolutionSpriteFrame(definition, centerX, centerY, size, options = {}) {
  if (!definition || size <= 0) {
    return;
  }
  const alpha = clamp(Number(options.alpha ?? 1), 0, 1);
  if (alpha <= 0.001) {
    return;
  }
  const scale = Math.max(0.08, Number(options.scale ?? 1));
  const tintBlend = clamp(Number(options.tintBlend || 0), 0, 1);
  const tintColor = Array.isArray(options.tintColor) ? options.tintColor : [255, 255, 255];
  drawPokemonSprite(
    {
      ...definition,
      spriteVariantId: getDefaultSpriteVariantId(definition),
    },
    centerX,
    centerY,
    size,
    {
      alpha,
      scaleX: scale,
      scaleY: scale,
      shadowProfile: "enemy",
      shadowAlpha: 0.56,
      tintBlend,
      tintColor,
      shinyVisual: false,
      ultraShinyVisual: false,
    },
  );
}

function drawEvolutionAnimationParticles(layout, animation, options = {}) {
  const particles = Array.isArray(animation?.particles) ? animation.particles : [];
  const progressAlpha = clamp(Number(options.alpha ?? 1), 0, 1);
  if (particles.length <= 0 || progressAlpha <= 0.001) {
    return;
  }
  const spriteSize = Math.max(
    48,
    getEnemySpriteRenderSize(layout, Number(layout?.enemySize || 0) || 160) * 0.92,
  );
  const centerX = Number(options.centerX ?? layout?.centerX ?? state.viewport.width * 0.5);
  const centerY = Number(options.centerY ?? layout?.centerY ?? state.viewport.height * 0.5);
  const elapsedMs = Math.max(0, Number(animation?.elapsedMs || 0));

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const particle of particles) {
    const startMs = Math.max(0, Number(particle?.startMs || 0));
    const durationMs = Math.max(1, Number(particle?.durationMs || 0));
    const ageMs = elapsedMs - startMs;
    if (ageMs < 0 || ageMs > durationMs) {
      continue;
    }
    const ratio = clamp(ageMs / durationMs, 0, 1);
    const angle = Number(particle?.baseAngle || 0) + ratio * Math.PI * 2 * Number(particle?.spinTurns || 0);
    const radius = spriteSize * (Number(particle?.radiusStart || 0.2) + Number(particle?.radiusGrow || 0.18) * ratio);
    const lift = spriteSize * Number(particle?.lift || 0.14) * ratio;
    const heightOffset = spriteSize * Number(particle?.heightOffset || 0);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius * 0.54 - lift - heightOffset;
    const size = Math.max(1.4, Number(particle?.size || 2));
    const color = Array.isArray(particle?.color) ? particle.color : [255, 255, 255];
    const alpha = Math.sin(ratio * Math.PI) * progressAlpha * 0.9;
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha.toFixed(3)})`;
    ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(alpha * 0.85).toFixed(3)})`;
    ctx.shadowBlur = 10 + size * 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEvolutionAnimationOverlay(layout = state.layout) {
  const animation = state.evolutionAnimation.current;
  if (!animation || !layout) {
    return;
  }

  const elapsedMs = Math.max(0, Number(animation.elapsedMs || 0));
  const totalMs = Math.max(1, Number(animation.totalMs || EVOLUTION_ANIM_TOTAL_MS));
  const whiteEnd = Math.min(totalMs, Math.max(1, EVOLUTION_ANIM_WHITE_MS));
  const flashEnd = Math.min(totalMs, whiteEnd + Math.max(1, EVOLUTION_ANIM_FLASH_MS));
  const revealEnd = Math.min(totalMs, flashEnd + Math.max(1, EVOLUTION_ANIM_REVEAL_MS));
  const revealRatio = clamp((elapsedMs - whiteEnd) / Math.max(1, revealEnd - whiteEnd), 0, 1);
  const flashRatio = clamp((elapsedMs - whiteEnd) / Math.max(1, flashEnd - whiteEnd), 0, 1);
  const flashPulse = flashRatio > 0 && flashRatio < 1 ? Math.sin(flashRatio * Math.PI) : 0;
  const whiteRatio = elapsedMs < whiteEnd ? 1 - clamp(elapsedMs / whiteEnd, 0, 1) * 0.12 : 0;
  const backdropFadeInRatio = clamp(
    elapsedMs / Math.max(1, Math.min(EVOLUTION_ANIM_BACKDROP_FADE_MS, totalMs * 0.28)),
    0,
    1,
  );
  const backdropFadeOutRatio = clamp(
    (totalMs - elapsedMs) / Math.max(1, Math.min(EVOLUTION_ANIM_BACKDROP_FADE_MS, totalMs * 0.32)),
    0,
    1,
  );
  const backdropPresence = Math.min(backdropFadeInRatio, backdropFadeOutRatio);
  const overlayAlpha = clamp(0.82 * backdropPresence + flashPulse * 0.12, 0, 0.92);
  const spriteSize = Math.max(
    72,
    getEnemySpriteRenderSize(layout, Number(layout?.enemySize || 0) || 180) * 1.06,
  );
  const centerX = Number(layout.centerX || state.viewport.width * 0.5);
  const centerY = Number(layout.centerY || state.viewport.height * 0.5) - spriteSize * 0.04;
  const fromAlpha = clamp((1 - revealRatio) * (1 - flashPulse * 0.45), 0, 1);
  const toAlpha = clamp(revealRatio + flashPulse * 0.12, 0, 1);
  const fromScale = 1 + flashPulse * 0.08 - revealRatio * 0.08;
  const toScale = 0.88 + revealRatio * 0.18 + flashPulse * 0.06;

  ctx.save();
  ctx.fillStyle = `rgba(7, 14, 28, ${overlayAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  const haloGradient = ctx.createRadialGradient(centerX, centerY, spriteSize * 0.12, centerX, centerY, spriteSize * 1.36);
  haloGradient.addColorStop(0, `rgba(255, 255, 255, ${(0.22 + flashPulse * 0.2).toFixed(3)})`);
  haloGradient.addColorStop(0.32, `rgba(190, 224, 255, ${(0.18 + backdropPresence * 0.18).toFixed(3)})`);
  haloGradient.addColorStop(0.7, `rgba(102, 152, 255, ${(0.09 + flashPulse * 0.12).toFixed(3)})`);
  haloGradient.addColorStop(1, "rgba(12, 20, 34, 0)");
  ctx.fillStyle = haloGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, spriteSize * 1.36, 0, Math.PI * 2);
  ctx.fill();

  drawEvolutionAnimationParticles(layout, animation, {
    centerX,
    centerY,
    alpha: Math.max(backdropPresence, revealRatio),
  });

  drawEvolutionSpriteFrame(animation.fromDef, centerX, centerY, spriteSize, {
    alpha: fromAlpha,
    scale: fromScale,
    tintBlend: flashPulse * 0.42 + whiteRatio * 0.2,
    tintColor: [255, 255, 255],
  });
  drawEvolutionSpriteFrame(animation.toDef, centerX, centerY, spriteSize, {
    alpha: toAlpha,
    scale: toScale,
    tintBlend: flashPulse * 0.4 + revealRatio * 0.12,
    tintColor: [255, 255, 255],
  });

  const whiteOverlayAlpha = clamp(whiteRatio * 0.72 + flashPulse * 0.44, 0, 0.92);
  if (whiteOverlayAlpha > 0.001) {
    ctx.fillStyle = `rgba(255, 255, 255, ${whiteOverlayAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(8, 15, 28, 0.9)";
  ctx.lineWidth = 6;
  ctx.fillStyle = "rgba(244, 250, 255, 0.98)";
  ctx.font = `800 ${Math.max(18, Math.round(spriteSize * 0.14))}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const titleY = Math.max(48, centerY - spriteSize * 0.92);
  ctx.strokeText("Evolution", centerX, titleY);
  ctx.fillText("Evolution", centerX, titleY);
  ctx.font = `700 ${Math.max(14, Math.round(spriteSize * 0.09))}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  const subtitle = `${animation.fromNameFr || animation.fromDef?.nameFr || "Pokemon"} -> ${animation.toNameFr || animation.toDef?.nameFr || "Pokemon"}`;
  ctx.strokeText(subtitle, centerX, titleY + Math.max(22, spriteSize * 0.18));
  ctx.fillText(subtitle, centerX, titleY + Math.max(22, spriteSize * 0.18));
  ctx.restore();
}

function getEvolutionRootSpeciesId(pokemonId) {
  return getEvolutionRootSpeciesIdFromDefs(pokemonId, state.pokemonDefsById);
}

function resolveCaptureEntityUnlock(capturedPokemonId) {
  const pokemonId = Number(capturedPokemonId || 0);
  if (pokemonId <= 0) {
    return {
      grantedEntityId: null,
      addedToTeam: false,
      suppressedEvolvedEntityUnlock: false,
    };
  }

  const capturedDef = state.pokemonDefsById.get(pokemonId);
  const evolvesFromId = Number(capturedDef?.evolvesFrom?.id || 0);
  const isEvolutionSpecies = evolvesFromId > 0;

  if (isEvolutionSpecies) {
    const baseSpeciesId = getEvolutionRootSpeciesId(pokemonId);
    if (baseSpeciesId > 0 && baseSpeciesId !== pokemonId && !isPokemonEntityUnlockedById(baseSpeciesId)) {
      const baseUnlockResult = ensurePokemonEntityUnlocked(baseSpeciesId, 1);
      let addedToTeam = false;
      if (!baseUnlockResult.wasUnlocked) {
        addedToTeam = addSpeciesToTeamIfPossible(baseSpeciesId);
      }
      return {
        grantedEntityId: baseUnlockResult.wasUnlocked ? null : baseSpeciesId,
        addedToTeam,
        suppressedEvolvedEntityUnlock: true,
      };
    }
    return {
      grantedEntityId: null,
      addedToTeam: false,
      suppressedEvolvedEntityUnlock: true,
    };
  }

  const unlockResult = ensurePokemonEntityUnlocked(pokemonId, 1);
  let addedToTeam = false;
  if (!unlockResult.wasUnlocked) {
    addedToTeam = addSpeciesToTeamIfPossible(pokemonId);
  }
  return {
    grantedEntityId: unlockResult.wasUnlocked ? null : pokemonId,
    addedToTeam,
    suppressedEvolvedEntityUnlock: false,
  };
}

function reconcileEntityUnlockStates() {
  if (!state.saveData?.pokemon_entities || typeof state.saveData.pokemon_entities !== "object") {
    return false;
  }
  let changed = false;
  for (const [rawId, record] of Object.entries(state.saveData.pokemon_entities)) {
    const pokemonId = Number(record?.id || rawId || 0);
    if (pokemonId <= 0 || !record) {
      continue;
    }
    if (isEntityUnlocked(record)) {
      if (ensureOwnedRecordHasAtLeastOneCapture(record)) {
        changed = true;
      }
      continue;
    }
    const capturedTotal = getCapturedTotal(record);
    if (capturedTotal <= 0) {
      continue;
    }
    const def = state.pokemonDefsById.get(pokemonId);
    if (!def) {
      continue;
    }
    const isEvolutionSpecies = Number(def.evolvesFrom?.id || 0) > 0;
    if (!isEvolutionSpecies) {
      markEntityUnlocked(record, true);
      ensureOwnedRecordHasAtLeastOneCapture(record);
      changed = true;
    }
  }
  return changed;
}

function rebuildTeamAndSyncBattle() {
  battleLifecycleSystem.rebuildTeamAndSyncBattle();
}

function queueTeamLevelUpEffects(levelUps) {
  if (!Array.isArray(levelUps) || levelUps.length <= 0) {
    return;
  }
  const layout = state.layout || computeLayout();
  const slots = Array.isArray(layout?.teamSlots) ? layout.teamSlots : [];
  const celebrationParticles = shouldRenderCelebrationParticles();

  for (const entry of levelUps) {
    const slotIndex = toSafeInt(entry?.slotIndex, -1);
    if (slotIndex < 0 || slotIndex >= slots.length) {
      continue;
    }
    const slot = slots[slotIndex];
    if (!slot) {
      continue;
    }
    const centerX = slot.x;
    const centerY = slot.y - slot.size * 0.04;
    const particles = [];
    const particleCount = celebrationParticles ? 12 : 0;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = randomRange(-Math.PI * 0.92, -Math.PI * 0.08);
      const speed = randomRange(36, 128);
      const lifeMs = randomRange(280, TEAM_LEVEL_UP_EFFECT_DURATION_MS);
      particles.push({
        x: centerX + randomRange(-6, 6),
        y: centerY + randomRange(-4, 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomRange(8, 24),
        size: randomRange(1.6, 3.6),
        lifeMs,
        maxLifeMs: lifeMs,
      });
    }

    state.teamLevelUpEffects.push({
      x: centerX,
      y: centerY,
      lifeMs: TEAM_LEVEL_UP_EFFECT_DURATION_MS,
      maxLifeMs: TEAM_LEVEL_UP_EFFECT_DURATION_MS,
      ringRadius: slot.size * 0.14,
      ringGrow: slot.size * 0.62,
      particles,
    });
  }
}

function queueTeamXpGainEffects(xpGains, options = {}) {
  if (!Array.isArray(xpGains) || xpGains.length <= 0) {
    return;
  }
  const layout = state.layout || computeLayout();
  const slots = Array.isArray(layout?.teamSlots) ? layout.teamSlots : [];
  const tone = String(options.tone || "defeat");

  for (const gain of xpGains) {
    const slotIndex = toSafeInt(gain?.slotIndex, -1);
    if (slotIndex < 0 || slotIndex >= slots.length) {
      continue;
    }
    const slot = slots[slotIndex];
    if (!slot) {
      continue;
    }
    const amount = Math.max(0, toSafeInt(gain?.amount, 0));
    if (amount <= 0) {
      continue;
    }
    const gainedLevels = Math.max(0, toSafeInt(gain?.gainedLevels, 0));
    const amountLabel = formatCompactNumber(amount, {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    });
    const text = gainedLevels > 0 ? `+${amountLabel} XP | Niv +${gainedLevels}` : `+${amountLabel} XP`;
    state.teamXpGainEffects.push({
      x: slot.x,
      y: slot.y - slot.size * 0.24,
      baseY: slot.y - slot.size * 0.24,
      text,
      tone,
      lifeMs: TEAM_XP_GAIN_EFFECT_DURATION_MS,
      maxLifeMs: TEAM_XP_GAIN_EFFECT_DURATION_MS,
      floatY: randomRange(-34, -50),
      particles: [],
    });
  }
}

function updateTeamLevelUpEffects(deltaMs) {
  if (!Array.isArray(state.teamLevelUpEffects) || state.teamLevelUpEffects.length <= 0) {
    return;
  }
  const dt = Math.max(0, Number(deltaMs) || 0) / 1000;
  const survivors = [];

  for (const effect of state.teamLevelUpEffects) {
    effect.lifeMs -= deltaMs;
    if (effect.lifeMs <= 0) {
      continue;
    }
    effect.ringRadius += effect.ringGrow * dt;
    const nextParticles = [];
    for (const particle of effect.particles || []) {
      particle.lifeMs -= deltaMs;
      if (particle.lifeMs <= 0) {
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 120 * dt;
      particle.vx *= clamp(1 - 1.8 * dt, 0.35, 1);
      nextParticles.push(particle);
    }
    effect.particles = nextParticles;
    survivors.push(effect);
  }

  state.teamLevelUpEffects = survivors;
}

function updateTeamXpGainEffects(deltaMs) {
  if (!Array.isArray(state.teamXpGainEffects) || state.teamXpGainEffects.length <= 0) {
    return;
  }
  const survivors = [];
  for (const effect of state.teamXpGainEffects) {
    effect.lifeMs -= deltaMs;
    if (effect.lifeMs <= 0) {
      continue;
    }
    const lifeRatio = clamp(effect.lifeMs / Math.max(1, effect.maxLifeMs), 0, 1);
    effect.y = effect.baseY + (1 - lifeRatio) * effect.floatY;
    survivors.push(effect);
  }
  state.teamXpGainEffects = survivors;
}

function getActiveTeamSizeForBalance() {
  return rewardProgressionSystem.getActiveTeamSizeForBalance();
}

function getEnemyHpTeamScaleMultiplier(teamSize = getActiveTeamSizeForBalance()) {
  return rewardProgressionSystem.getEnemyHpTeamScaleMultiplier(teamSize);
}

function getEnemyRewardScaleMultiplier(teamHpScaleMultiplier = 1, isOnlyOneEncounter = false) {
  return rewardProgressionSystem.getEnemyRewardScaleMultiplier(teamHpScaleMultiplier, isOnlyOneEncounter);
}

function getRewardMultipliersFromLevelDiff(levelDiff) {
  return rewardProgressionSystem.getRewardMultipliersFromLevelDiff(levelDiff);
}

function getXpMultiplierFromLevelDiff(levelDiff) {
  return rewardProgressionSystem.getXpMultiplierFromLevelDiff(levelDiff);
}

function scaleRewardByMultiplier(baseReward, multiplier, minimumIfPositive = 0) {
  return rewardProgressionSystem.scaleRewardByMultiplier(baseReward, multiplier, minimumIfPositive);
}

function getHighestTeamLevelForRewardScaling() {
  return rewardProgressionSystem.getHighestTeamLevelForRewardScaling();
}

function getTeamMoneyTalentMultiplier(teamMembers = state.team) {
  return rewardProgressionSystem.getTeamMoneyTalentMultiplier(teamMembers);
}

function computeCaptureXpReward(enemy) {
  return rewardProgressionSystem.computeCaptureXpReward(enemy);
}

function computeDefeatMoneyReward(enemy) {
  return rewardProgressionSystem.computeDefeatMoneyReward(enemy);
}

function applyExperienceToEntity(record, amount) {
  return rewardProgressionSystem.applyExperienceToEntity(record, amount);
}

function awardCaptureXpToTeam(enemy, options = {}) {
  return rewardProgressionSystem.awardCaptureXpToTeam(enemy, options);
}

function computeCatchChance(catchRate, ballMultiplier = 1) {
  const normalizedRate = clamp(Number(catchRate || 45), 1, 255) / 255;
  const baseChance = clamp(0.07 + normalizedRate * 0.75, 0.06, 0.94);
  const multiplier = Math.max(0.05, Number(ballMultiplier || 1));
  return clamp(baseChance * multiplier, 0.06, 0.99);
}

function buildPokemonJsonPath(pokemonId, nameEn) {
  return `pokemon_data/${pokemonId}_${nameEn}/${pokemonId}_${nameEn}_data.json`;
}

function resolveSpritePath(jsonPath, spriteRelativePath) {
  if (!spriteRelativePath) {
    return null;
  }
  const slashIndex = jsonPath.lastIndexOf("/");
  const folderPath = slashIndex >= 0 ? jsonPath.slice(0, slashIndex) : ".";
  return `${folderPath}/${spriteRelativePath}`;
}

function loadImage(imagePath) {
  if (!imagePath) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = imagePath;
  });
}

function buildTypeIconAssetPath(typeName) {
  return `${TYPE_ICON_ASSET_DIR}/${normalizeType(typeName)}.png`;
}

async function preloadTypeIcons() {
  const entries = await Promise.all(
    TYPE_ICON_TYPES.map(async (typeName) => [typeName, await loadImage(buildTypeIconAssetPath(typeName))]),
  );
  return new Map(entries);
}

function getDefensiveTypes(payload) {
  if (!Array.isArray(payload?.defensive_types) || payload.defensive_types.length === 0) {
    return ["normal"];
  }
  return payload.defensive_types.map((typeName) => String(typeName || "normal").toLowerCase());
}

function normalizeEvolutionMethod(rawMethod) {
  if (!rawMethod || typeof rawMethod !== "object") {
    return null;
  }

  const minLevelValue = Number(rawMethod.min_level ?? rawMethod.minLevel);
  const minHappinessValue = Number(rawMethod.min_happiness ?? rawMethod.minHappiness);
  const minBeautyValue = Number(rawMethod.min_beauty ?? rawMethod.minBeauty);
  const relativePhysicalStatsValue = Number(rawMethod.relative_physical_stats ?? rawMethod.relativePhysicalStats);
  const partySpeciesValue = Number(rawMethod.party_species ?? rawMethod.partySpecies);
  const genderValue = rawMethod.gender;
  const timeOfDayValue = rawMethod.time_of_day ?? rawMethod.timeOfDay;
  const itemValue = rawMethod.item;
  const heldItemValue = rawMethod.held_item ?? rawMethod.heldItem;
  const knownMoveValue = rawMethod.known_move ?? rawMethod.knownMove;
  const locationValue = rawMethod.location;

  return {
    evolutionType: String(rawMethod.evolution_type ?? rawMethod.evolutionType ?? rawMethod.trigger ?? "")
      .toLowerCase()
      .trim(),
    trigger: String(rawMethod.trigger ?? rawMethod.evolution_type ?? rawMethod.evolutionType ?? "")
      .toLowerCase()
      .trim(),
    minLevel: Number.isFinite(minLevelValue) ? clamp(Math.round(minLevelValue), 1, MAX_LEVEL) : null,
    minHappiness: Number.isFinite(minHappinessValue) ? Math.max(0, Math.round(minHappinessValue)) : null,
    minBeauty: Number.isFinite(minBeautyValue) ? Math.max(0, Math.round(minBeautyValue)) : null,
    relativePhysicalStats: Number.isFinite(relativePhysicalStatsValue)
      ? clamp(Math.round(relativePhysicalStatsValue), -1, 1)
      : null,
    partySpecies: Number.isFinite(partySpeciesValue) && partySpeciesValue > 0 ? Math.round(partySpeciesValue) : null,
    gender: genderValue == null ? null : String(genderValue).toLowerCase().trim(),
    timeOfDay: timeOfDayValue == null ? null : String(timeOfDayValue).toLowerCase().trim(),
    item: itemValue == null ? null : String(itemValue).toLowerCase().trim(),
    heldItem: heldItemValue == null ? null : String(heldItemValue).toLowerCase().trim(),
    knownMove: knownMoveValue == null ? null : String(knownMoveValue).toLowerCase().trim(),
    location: locationValue == null ? null : String(locationValue).toLowerCase().trim(),
  };
}

function normalizeEvolutionLink(rawLink) {
  if (!rawLink || typeof rawLink !== "object") {
    return null;
  }
  const id = Number(rawLink.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const methods = Array.isArray(rawLink.evolution_methods)
    ? rawLink.evolution_methods.map((method) => normalizeEvolutionMethod(method)).filter(Boolean)
    : [];
  return {
    id,
    nameEn: String(rawLink.name_en || "").toLowerCase().trim(),
    evolutionMethods: methods,
  };
}

function getTypeMultiplier(attackType, defenderTypes) {
  let multiplier = 1;
  const attackTable = TYPE_EFFECTIVENESS[String(attackType || "normal").toLowerCase()] || {};
  for (const defenderTypeRaw of defenderTypes || []) {
    const defenderType = String(defenderTypeRaw || "normal").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(attackTable, defenderType)) {
      multiplier *= attackTable[defenderType];
    }
  }
  return multiplier;
}

function getAttackStat(attacker, attackType) {
  const attackTypeNorm = String(attackType || "normal").toLowerCase();
  if (SPECIAL_ATTACK_TYPES.has(attackTypeNorm)) {
    return Math.max(1, Number(attacker?.stats?.["special-attack"] || attacker?.stats?.attack || 1));
  }
  return Math.max(1, Number(attacker?.stats?.attack || attacker?.stats?.["special-attack"] || 1));
}

function getDefenseStat(defender, attackType) {
  const attackTypeNorm = String(attackType || "normal").toLowerCase();
  if (SPECIAL_ATTACK_TYPES.has(attackTypeNorm)) {
    return Math.max(1, Number(defender?.stats?.["special-defense"] || defender?.stats?.defense || 1));
  }
  return Math.max(1, Number(defender?.stats?.defense || defender?.stats?.["special-defense"] || 1));
}

function computeDamage(attacker, defender, attackType, typeMultiplier, options = {}) {
  if (typeMultiplier <= 0) {
    return {
      damage: 0,
      isCritical: false,
      criticalMultiplier: 1,
    };
  }

  const level = Math.max(1, Number(attacker?.level || 1));
  const attackStat = getAttackStat(attacker, attackType);
  const defenseStat = getDefenseStat(defender, attackType);
  const progressionBoost = Math.pow(getLevelProgressionMultiplier(level), DAMAGE_LEVEL_PROGRESSION_EXPONENT);
  const levelFactor = (2 * level) / 5 + 2;
  const basePower = 70;
  const baseDamage = ((levelFactor * basePower * (attackStat / defenseStat)) / 50) + 2;

  const attackerTypes = Array.isArray(attacker?.defensiveTypes) ? attacker.defensiveTypes : [];
  const normalizedType = String(attackType || "normal").toLowerCase();
  const stab = attackerTypes.includes(normalizedType) || attacker?.offensiveType === normalizedType ? 1.25 : 1;
  const critChanceBonus = Math.max(0, Number(options?.critChanceBonus || 0));
  const critChance = clamp(ATTACK_CRIT_CHANCE + critChanceBonus, 0, 1);
  const forceCritical = Boolean(options?.forceCritical);
  const isCritical = forceCritical || Math.random() < critChance;
  const crit = isCritical ? ATTACK_CRIT_MULTIPLIER : 1;
  const damageMultiplier = Math.max(0, Number(options?.damageMultiplier ?? 1));
  const variance = 0.9 + Math.random() * 0.2;
  const total = baseDamage * stab * typeMultiplier * crit * variance * DAMAGE_SCALE * progressionBoost * damageMultiplier;

  return {
    damage: Math.max(1, Math.round(total)),
    isCritical,
    criticalMultiplier: crit,
  };
}

function rgba(rgb, alpha) {
  const color = Array.isArray(rgb) ? rgb : [220, 236, 255];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function blendRgb(baseColor, accentColor, blendRatio = 0.5) {
  const base = Array.isArray(baseColor) ? baseColor : [220, 236, 255];
  const accent = Array.isArray(accentColor) ? accentColor : base;
  const t = clamp(Number(blendRatio) || 0, 0, 1);
  return [
    Math.round(base[0] + (accent[0] - base[0]) * t),
    Math.round(base[1] + (accent[1] - base[1]) * t),
    Math.round(base[2] + (accent[2] - base[2]) * t),
  ];
}

function getTypeColor(typeName) {
  return TYPE_COLORS[String(typeName || "normal").toLowerCase()] || [220, 236, 255];
}

function getFloatingTextTonePalette(tone) {
  return FLOATING_TEXT_TONE_PALETTES[String(tone || FLOATING_TEXT_TONE_NORMAL)] || FLOATING_TEXT_TONE_PALETTES[FLOATING_TEXT_TONE_NORMAL];
}

function getFloatingTextToneVisualStyle(tone) {
  return FLOATING_TEXT_TONE_VISUAL_STYLES[String(tone || FLOATING_TEXT_TONE_NORMAL)]
    || FLOATING_TEXT_TONE_VISUAL_STYLES[FLOATING_TEXT_TONE_NORMAL];
}

function resolveFloatingDamageEffectLabel({ isMiss = false, typeMultiplier = 1 } = {}) {
  if (isMiss) {
    return "RATE";
  }
  const multiplier = Number(typeMultiplier);
  if (!Number.isFinite(multiplier) || multiplier <= 0.001) {
    return "N'AFFECTE PAS";
  }
  if (multiplier >= 1.999) {
    return "SUPER EFFICACE";
  }
  if (multiplier < 0.999) {
    return "PAS TRES EFFICACE";
  }
  return "";
}

function resolveFloatingDamageTone({ isMiss = false, typeMultiplier = 1, isCritical = false } = {}) {
  const multiplier = Number(typeMultiplier);
  if (isMiss || !Number.isFinite(multiplier) || multiplier <= 0.001) {
    return FLOATING_TEXT_TONE_MISS;
  }
  if (isCritical) {
    return FLOATING_TEXT_TONE_CRITICAL;
  }
  if (multiplier >= 1.999) {
    return FLOATING_TEXT_TONE_SUPER;
  }
  if (multiplier < 0.999) {
    return FLOATING_TEXT_TONE_RESIST;
  }
  return FLOATING_TEXT_TONE_NORMAL;
}

function buildFloatingDamageLabels({ isMiss = false, typeMultiplier = 1, isCritical = false } = {}) {
  return {
    primary: "",
    secondary: "",
    summary: "",
    hasEffectivenessLabel: false,
    hasCriticalLabel: false,
  };
}

function normalizeType(typeName) {
  return String(typeName || "normal").toLowerCase();
}

function formatTypeLabelFr(typeName) {
  const normalized = normalizeType(typeName);
  if (Object.prototype.hasOwnProperty.call(TYPE_LABELS_FR, normalized)) {
    return TYPE_LABELS_FR[normalized];
  }
  if (!normalized) {
    return TYPE_LABELS_FR.normal;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatTypeListFr(types) {
  if (!Array.isArray(types) || types.length <= 0) {
    return TYPE_LABELS_FR.normal;
  }
  return types.map((typeName) => formatTypeLabelFr(typeName)).join(" / ");
}

function isTeamLeftSideSlot(slotIndex, layout = state.layout) {
  const safeIndex = clamp(toSafeInt(slotIndex, 0), 0, MAX_TEAM_SIZE - 1);
  const slot = layout?.teamSlots?.[safeIndex];
  if (slot && Number.isFinite(slot.x) && Number.isFinite(layout?.centerX)) {
    return slot.x < layout.centerX;
  }
  return TEAM_LEFT_SIDE_SLOT_INDEXES.has(safeIndex);
}

function shouldFlipTeamSprite(slotIndex, layout = state.layout) {
  return isTeamLeftSideSlot(slotIndex, layout);
}

function getTypeIconImage(typeName) {
  return state.typeIconImages.get(normalizeType(typeName)) || null;
}

function formatTypeMultiplierLabel(multiplier) {
  const numericMultiplier = Number(multiplier);
  if (!Number.isFinite(numericMultiplier)) {
    return "x1";
  }
  const rounded = Math.round(numericMultiplier * 100) / 100;
  if (Math.abs(rounded) <= 0.001) {
    return "x0";
  }
  return `x${String(rounded).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}`;
}

function getTypeMatchupPalette(multiplier) {
  if (multiplier <= 0.001) {
    return ZONE_UI_CANVAS_THEME.typeMatchup.immune;
  }
  if (multiplier > 1.001) {
    return ZONE_UI_CANVAS_THEME.typeMatchup.advantage;
  }
  if (multiplier < 0.999) {
    return ZONE_UI_CANVAS_THEME.typeMatchup.disadvantage;
  }
  return ZONE_UI_CANVAS_THEME.typeMatchup.neutral;
}

function traceRetroHudPath(x, y, width, height, cut = 10, radiusOverride = null) {
  const safeWidth = Math.max(12, Number(width) || 0);
  const safeHeight = Math.max(12, Number(height) || 0);
  const defaultRadius = Math.max(6, Number(cut) || Math.min(12, safeHeight * 0.58));
  const safeRadius = clamp(
    Number.isFinite(radiusOverride) ? Number(radiusOverride) : defaultRadius,
    4,
    Math.min(safeWidth, safeHeight) * 0.5,
  );

  ctx.beginPath();
  ctx.roundRect(x, y, safeWidth, safeHeight, safeRadius);
}

function drawRetroHudPanel(x, y, width, height, options = {}) {
  const safeWidth = Math.max(12, Number(width) || 0);
  const safeHeight = Math.max(12, Number(height) || 0);
  const cut = clamp(Number(options.cut) || Math.min(12, safeHeight * 0.58), 4, Math.min(safeWidth, safeHeight) * 0.46);
  const themeChrome = ZONE_UI_CANVAS_THEME.chrome || {};
  const isPill = options.pill === true;
  const shadowOffsetY = Number.isFinite(options.shadowOffsetY)
    ? options.shadowOffsetY
    : Number(themeChrome.shadowOffsetY) || 3;
  const shadowOffsetX = Number.isFinite(options.shadowOffsetX) ? options.shadowOffsetX : 0;
  const fillTop = options.fillTop || ZONE_UI_CANVAS_THEME.panel.fillTop;
  const fillMid = options.fillMid || fillTop;
  const fillBottom = options.fillBottom || ZONE_UI_CANVAS_THEME.panel.fillBottom;
  const border = options.border || ZONE_UI_CANVAS_THEME.panel.border;
  const highlight = options.highlight || ZONE_UI_CANVAS_THEME.panel.highlight;
  const shadow = options.shadow || ZONE_UI_CANVAS_THEME.panel.shadow;
  const borderWidth = Math.max(0.75, Number(options.borderWidth) || 2);
  const autoRadius = isPill
    ? safeHeight * 0.5
    : safeHeight <= 24
      ? safeHeight * 0.5
      : Math.max(Number(themeChrome.radiusCard) || 12, cut * 0.92);
  const radius = clamp(
    Number(options.radius) || autoRadius,
    4,
    Math.min(safeWidth, safeHeight) * 0.5,
  );
  const inset = Math.min(radius - 1, Math.max(0.9, borderWidth * 0.72));

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (shadowOffsetX !== 0 || shadowOffsetY !== 0) {
    ctx.fillStyle = shadow;
    traceRetroHudPath(x + shadowOffsetX, y + shadowOffsetY, safeWidth, safeHeight, cut, radius);
    ctx.fill();
  }

  const fill = ctx.createLinearGradient(x, y, x, y + safeHeight);
  fill.addColorStop(0, fillTop);
  fill.addColorStop(0.58, fillMid);
  fill.addColorStop(1, fillBottom);
  ctx.fillStyle = fill;
  traceRetroHudPath(x, y, safeWidth, safeHeight, cut, radius);
  ctx.fill();

  ctx.save();
  traceRetroHudPath(x, y, safeWidth, safeHeight, cut, radius);
  ctx.clip();

  const gloss = ctx.createLinearGradient(x, y, x, y + safeHeight * 0.64);
  gloss.addColorStop(0, highlight || "rgba(255, 255, 255, 0.12)");
  gloss.addColorStop(0.52, "rgba(255, 255, 255, 0.03)");
  gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(x, y, safeWidth, safeHeight * 0.64);

  const diagonalSheen = ctx.createLinearGradient(x, y, x + safeWidth * 0.82, y + safeHeight * 0.98);
  diagonalSheen.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  diagonalSheen.addColorStop(0.34, "rgba(255, 255, 255, 0.04)");
  diagonalSheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = diagonalSheen;
  ctx.fillRect(x, y, safeWidth, safeHeight);

  const floorShade = ctx.createLinearGradient(x, y + safeHeight * 0.4, x, y + safeHeight);
  floorShade.addColorStop(0, "rgba(0, 0, 0, 0)");
  floorShade.addColorStop(1, "rgba(0, 0, 0, 0.18)");
  ctx.fillStyle = floorShade;
  ctx.fillRect(x, y + safeHeight * 0.4, safeWidth, safeHeight * 0.6);
  ctx.restore();

  ctx.strokeStyle = border;
  ctx.lineWidth = borderWidth;
  traceRetroHudPath(x, y, safeWidth, safeHeight, cut, radius);
  ctx.stroke();

  if (highlight) {
    ctx.strokeStyle = highlight;
    ctx.lineWidth = Math.max(0.6, borderWidth * 0.5);
    traceRetroHudPath(
      x + inset,
      y + inset,
      Math.max(8, safeWidth - inset * 2),
      Math.max(8, safeHeight - inset * 2),
      Math.max(3, cut - inset * 1.2),
      Math.max(3, radius - inset),
    );
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
  ctx.lineWidth = Math.max(0.5, borderWidth * 0.4);
  traceRetroHudPath(
    x + inset * 0.75,
    y + safeHeight * 0.48,
    Math.max(8, safeWidth - inset * 1.5),
    Math.max(6, safeHeight * 0.48 - inset * 0.75),
    Math.max(3, cut - inset),
    Math.max(3, radius - inset * 0.75),
  );
  ctx.stroke();
  ctx.restore();
}

function getSpriteSnapFactor() {
  const dpr = Number(state.viewport?.dpr || 1);
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

function snapSpriteValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  const snapFactor = getSpriteSnapFactor();
  return Math.round(numericValue * snapFactor) / snapFactor;
}

function snapSpriteDimension(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1;
  }
  const snapFactor = getSpriteSnapFactor();
  const snapped = Math.round(numericValue * snapFactor) / snapFactor;
  return Math.max(1 / snapFactor, snapped);
}

function drawTypeIconGraphic(typeName, centerX, centerY, size, options = {}) {
  const safeSize = clamp(Number(size) || 0, 8, 56);
  const image = getTypeIconImage(typeName);
  const drawAlpha = clamp(Number(options.alpha ?? 1), 0, 1);

  ctx.save();
  ctx.globalAlpha = drawAlpha;

  if (isDrawableImage(image)) {
    const drawX = snapSpriteValue(centerX - safeSize * 0.5);
    const drawY = snapSpriteValue(centerY - safeSize * 0.5);
    const drawSize = snapSpriteDimension(safeSize);
    const wasSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, drawX, drawY, drawSize, drawSize);
    ctx.imageSmoothingEnabled = wasSmoothing;
  } else {
    const fallbackType = normalizeType(typeName);
    const fallbackColor = getTypeColor(fallbackType);
    const radius = Math.max(3, safeSize * 0.34);
    const lineWidth = Math.max(1.1, safeSize * 0.08);
    ctx.fillStyle = rgba(fallbackColor, 0.94);
    ctx.strokeStyle = "rgba(6, 11, 22, 0.64)";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(snapSpriteValue(centerX), snapSpriteValue(centerY), radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawTypeIconBadge(typeName, centerX, centerY, size, options = {}) {
  const safeSize = clamp(Number(size) || 0, 14, 34);
  const outlineColor = Array.isArray(options.outlineColor) ? options.outlineColor : getTypeColor(typeName);
  const x = centerX - safeSize * 0.5;
  const y = centerY - safeSize * 0.5;
  drawRetroHudPanel(x, y, safeSize, safeSize, {
    cut: Math.max(4, safeSize * 0.28),
    fillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.subpanel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    border: rgba(outlineColor, 0.78),
    highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.subpanel.shadow,
    borderWidth: Math.max(1, safeSize * 0.07),
  });

  drawTypeIconGraphic(typeName, centerX, centerY, safeSize * 0.76);
}

function drawTypeMatchupPill(anchorX, centerY, multiplier, defenderTypes, options = {}) {
  const safeDefenderTypes = Array.isArray(defenderTypes)
    ? defenderTypes.map((typeName) => normalizeType(typeName)).filter(Boolean).slice(0, 2)
    : [];
  const allowOverflow = options.allowOverflow === true;
  const leadingType = normalizeType(options.typeIcon || "");
  const fontSize = clamp(Number(options.fontSize) || 0, 9, 14);
  const iconSize = clamp(Number(options.iconSize) || 0, 10, 16);
  const textPaddingX = clamp(Number(options.paddingX) || iconSize * 0.48, 4, 8);
  const textPaddingY = clamp(Number(options.paddingY) || fontSize * 0.42, 3, 7);
  const iconGap = clamp(iconSize * 0.2, 3, 5);
  const leadingGap = leadingType ? clamp(iconSize * 0.28, 3, 5) : 0;
  const contentGap = safeDefenderTypes.length > 0 ? clamp(iconSize * 0.38, 4, 8) : 0;
  const multiplierLabel = formatTypeMultiplierLabel(multiplier);
  const palette = getTypeMatchupPalette(multiplier);

  ctx.save();
  ctx.font = `700 ${fontSize}px ${ZONE_UI_CANVAS_THEME.fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const textWidth = Math.ceil(ctx.measureText(multiplierLabel).width);
  const leadingWidth = leadingType ? iconSize + leadingGap : 0;
  const iconsWidth = safeDefenderTypes.length > 0
    ? safeDefenderTypes.length * iconSize + Math.max(0, safeDefenderTypes.length - 1) * iconGap
    : 0;
  const width = textPaddingX * 2 + leadingWidth + textWidth + contentGap + iconsWidth;
  const height = Math.max(fontSize + textPaddingY * 2, iconSize + 6);
  let x =
    options.align === "center"
      ? anchorX - width * 0.5
      : options.align === "right"
        ? anchorX - width
        : anchorX;
  if (!allowOverflow) {
    x = clamp(x, 8, state.viewport.width - width - 8);
  }
  const yRaw = centerY - height * 0.5;
  const y = allowOverflow ? yRaw : clamp(yRaw, 8, state.viewport.height - height - 8);

  drawRetroHudPanel(x, y, width, height, {
    cut: Math.max(6, height * 0.35),
    pill: true,
    radius: height * 0.5,
    fillTop: palette.surfaceTop,
    fillMid: palette.surfaceTop,
    fillBottom: palette.surfaceBottom,
    border: palette.border,
    highlight: palette.glow,
    shadow: "rgba(78, 85, 100, 0.18)",
    borderWidth: 1.5,
  });

  ctx.shadowBlur = 0;
  ctx.fillStyle = palette.text;
  ctx.strokeStyle = "rgba(5, 10, 18, 0.72)";
  ctx.lineWidth = 2;
  let textX = x + textPaddingX;
  if (leadingType) {
    drawTypeIconBadge(leadingType, x + textPaddingX + iconSize * 0.5, y + height * 0.5, iconSize, {
      outlineColor: getTypeColor(leadingType),
    });
    textX += leadingWidth;
  }
  const textY = y + height * 0.53;
  ctx.strokeText(multiplierLabel, textX, textY);
  ctx.fillText(multiplierLabel, textX, textY);

  let iconX = textX + textWidth + contentGap;
  for (const defenderType of safeDefenderTypes) {
    drawTypeIconGraphic(defenderType, iconX + iconSize * 0.5, y + height * 0.5, iconSize);
    iconX += iconSize + iconGap;
  }
  ctx.restore();
}

function drawTeamTypeHud(member, slotIndex, slotAnchor, enemy, options = {}) {
  if (!member || !slotAnchor || !enemy) {
    return;
  }
  const allowOverflow = options.allowOverflow === true;
  const offensiveType = normalizeType(member.offensiveType || member.defensiveTypes?.[0] || "normal");
  const defenderTypes = Array.isArray(enemy.defensiveTypes) ? enemy.defensiveTypes : [];
  const multiplier = getTypeMultiplier(offensiveType, defenderTypes);
  const chipCenterX = Number(slotAnchor.hudCenterX || slotAnchor.x);
  const chipHeight = clamp(Number(slotAnchor.hudTypeChipHeight) || slotAnchor.size * 0.17, 11, 16);
  const chipCenterYRaw = Number(slotAnchor.hudTopY || slotAnchor.y) - chipHeight * 0.74;
  const chipCenterY = allowOverflow
    ? chipCenterYRaw
    : clamp(chipCenterYRaw, chipHeight * 0.5 + 6, state.viewport.height - chipHeight * 0.5 - 6);
  drawTypeMatchupPill(chipCenterX, chipCenterY, multiplier, [], {
    align: "center",
    typeIcon: offensiveType,
    fontSize: clamp(slotAnchor.size * 0.09, 8, 10),
    iconSize: clamp(chipHeight * 0.84, 10, 14),
    paddingX: clamp(slotAnchor.size * 0.064, 3, 5),
    paddingY: clamp(slotAnchor.size * 0.035, 2, 4),
    allowOverflow,
  });
}

function drawEnemyDefensiveTypeHud(enemy, layout, options = {}) {
  if (!enemy || !layout) {
    return;
  }
  const allowOverflow = options.allowOverflow === true;

  const defensiveTypes = Array.isArray(enemy.defensiveTypes)
    ? enemy.defensiveTypes.map((typeName) => normalizeType(typeName)).filter(Boolean).slice(0, 2)
    : [];
  if (defensiveTypes.length <= 0) {
    return;
  }

  const iconSize = clamp(layout.enemySize * 0.12, 14, 20);
  const gap = clamp(iconSize * 0.25, 4, 6);
  const pillPaddingX = clamp(iconSize * 0.38, 5, 8);
  const pillPaddingY = clamp(iconSize * 0.18, 3, 5);
  const contentWidth = defensiveTypes.length * iconSize + Math.max(0, defensiveTypes.length - 1) * gap;
  const pillWidth = contentWidth + pillPaddingX * 2;
  const pillHeight = iconSize + pillPaddingY * 2;
  const centerYRaw = Number(layout.enemyTypeHudY) || layout.hpBarY - pillHeight;
  const centerY = allowOverflow
    ? centerYRaw
    : clamp(centerYRaw, pillHeight * 0.5 + 8, state.viewport.height - pillHeight * 0.5 - 8);
  const xRaw = layout.centerX - pillWidth * 0.5;
  const x = allowOverflow ? xRaw : clamp(xRaw, 8, state.viewport.width - pillWidth - 8);
  const y = centerY - pillHeight * 0.5;
  drawRetroHudPanel(x, y, pillWidth, pillHeight, {
    cut: Math.max(6, pillHeight * 0.32),
    pill: true,
    radius: pillHeight * 0.5,
    fillTop: ZONE_UI_CANVAS_THEME.subpanel.fillTop,
    fillMid: ZONE_UI_CANVAS_THEME.subpanel.fillMid,
    fillBottom: ZONE_UI_CANVAS_THEME.subpanel.fillBottom,
    border: ZONE_UI_CANVAS_THEME.subpanel.border,
    highlight: ZONE_UI_CANVAS_THEME.subpanel.highlight,
    shadow: ZONE_UI_CANVAS_THEME.subpanel.shadow,
    borderWidth: 1.5,
  });

  let iconCenterX = x + pillPaddingX + iconSize * 0.5;
  for (const defensiveType of defensiveTypes) {
    drawTypeIconBadge(defensiveType, iconCenterX, centerY, iconSize);
    iconCenterX += iconSize + gap;
  }
}

let pokemonBattleRuntime = null;

function getPokemonBattleRuntime() {
  if (!pokemonBattleRuntime) {
    pokemonBattleRuntime = createPokemonBattleRuntime({
      state,
      clamp,
      toSafeInt,
      Tween,
      Easing,
      tweenGroup,
      normalizeType,
      getTypeColor,
      rgba,
      normalizeTalentId,
      getPassiveBehaviorIdForTalentId,
      resolveCombatTurnDecision,
      applyTeamTalentOverrides,
      getEntityOffensiveType,
      getEntityTalentId,
      getTypeMultiplier,
      getTalentCritBonusChance,
      getTalentTeleportSwapChance,
      isTeleportPlusPlusTalent,
      getStackedTeamAuraAttackBonus,
      hasAlwaysHitTalent,
      computeDamage,
      randomInt,
      randomRange,
      easeInOutSine,
      stopTweenIfRunning,
      createFloatingTextVisualTween,
      stopFloatingTextVisualTween,
      createProjectileTravelTween,
      stopProjectileTravelTween,
      blendRgb,
      getFloatingTextTonePalette,
      getFloatingTextToneVisualStyle,
      resolveFloatingDamageTone,
      buildFloatingDamageLabels,
      shouldRenderCelebrationParticles,
      normalizeBallTypeForVisual,
      getBallRenderTheme,
      createProjectileTrailPoint,
      getProjectileTrailMaxPoints,
      getProjectileTrailTypeVfxProfile,
      computeLayout,
      ATTACK_INTERVAL_MS,
      ATTACK_MISS_CHANCE,
      TURN_ACTION_ATTACK,
      TURN_ACTION_SKIP,
      TALENT_NONE_ID,
      TALENT_MIND_CONTROL_ID,
      TALENT_ORIGIN_MIMICRY_ID,
      TALENT_TELEPORT_PLUS_PLUS_DAMAGE_MULTIPLIER,
      MAX_TEAM_SIZE,
      KO_RESPAWN_DELAY_MS,
      KO_ANIMATION_DURATION_MS,
      ENEMY_ENTER_ANIM_DURATION_MS,
      ENEMY_ENTER_ANIM_OFFSET_PX,
      ENEMY_ENTER_ANIM_ROTATION_DEG,
      ENEMY_ENTER_ANIM_FADE_RATIO,
      ENEMY_ENTER_ANIM_ROTATE_RATIO,
      ATTACK_FLASH_DURATION_MS,
      ATTACK_FLASH_WHITE_BLEND,
      SKIP_TURN_EFFECT_DURATION_MIN_MS,
      SKIP_TURN_EFFECT_DURATION_MAX_MS,
      SKIP_TURN_EFFECT_FADE_RATIO,
      SKIP_TURN_EFFECT_GRAYSCALE_MAX,
      ATTACK_CHARGE_MIN_WINDOW_MS,
      ATTACK_CHARGE_WINDOW_RATIO,
      TELEPORT_SWAP_SCALE_DURATION_MS,
      ENEMY_DAMAGE_FLASH_DURATION_MS,
      ENEMY_DAMAGE_FLASH_RED_BLEND,
      FLOATING_TEXT_LIFETIME_MS,
      PROJECTILE_SPEED_PX_PER_SECOND,
      PROJECTILE_TWEEN_DURATION_MIN_MS,
      PROJECTILE_TWEEN_DURATION_MAX_MS,
      PROJECTILE_TWEEN_ARC_BASE_PX,
      PROJECTILE_TWEEN_ARC_RANDOM_PX,
      LASER_TICK_INTERVAL_MULTIPLIER,
      LASER_TICK_JITTER_MS,
      LASER_DAMAGE_PER_TICK_DIVISOR,
      PROJECTILE_TRAIL_POINT_MIN_SPACING_PX,
      PROJECTILE_TRAIL_POINT_BASE_SPACING_PX,
      PROJECTILE_TRAIL_POINT_MAX_SPACING_PX,
      PROJECTILE_SPRITE_PX,
      CAPTURE_THROW_MS,
      CAPTURE_SHAKE_MS,
      CAPTURE_POST_MS,
      CAPTURE_SUCCESS_BURST_MS,
      CAPTURE_FAIL_BREAK_MS,
      CAPTURE_FAIL_REAPPEAR_MS,
      ENEMY_TIMER_STYLE_ROUTE,
      ENEMY_TIMER_STYLE_ONLY_ONE,
      ROUTE_DEFEAT_TIMER_MS,
    });
  }
  return pokemonBattleRuntime;
}

const PokemonBattleManager = class PokemonBattleManagerFacade {
  constructor(options = {}) {
    const runtime = getPokemonBattleRuntime();
    const InstanceCtor = runtime.PokemonBattleManager;
    const instance = new InstanceCtor(options);
    return instance;
  }
};

async function loadPokemonEntity(jsonPath) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${jsonPath}`);
  }

  const payload = validatePokemonPayload(await response.json(), `Pokemon data ${jsonPath}`);
  const variants = [];
  const rawVariants = Array.isArray(payload?.sprite_variants) ? payload.sprite_variants : [];
  for (let i = 0; i < rawVariants.length; i += 1) {
    const normalized = normalizeSpriteVariantEntry(rawVariants[i], jsonPath, i);
    if (!normalized || variants.some((entry) => entry.id === normalized.id)) {
      continue;
    }
    variants.push(normalized);
  }

  if (variants.length <= 0) {
    const fallbackFront = resolveSpritePath(jsonPath, payload?.sprites?.front);
    if (fallbackFront) {
      variants.push({
        id: "default",
        labelFr: "Sprite par defaut",
        generation: 0,
        gameKey: "default",
        frontPath: fallbackFront,
        frontShinyPath: resolveSpritePath(jsonPath, payload?.sprites?.front_shiny),
      });
    }
  }

  const defaultSpriteVariantId = getDefaultSpriteVariantId({
    spriteVariants: variants,
    defaultSpriteVariantId: normalizeSpriteVariantId(payload?.default_sprite_variant_id),
  });
  const defaultVariant = getPreferredDefaultSpriteVariant({
    spriteVariants: variants,
    defaultSpriteVariantId: normalizeSpriteVariantId(payload?.default_sprite_variant_id),
  });
  const spritePath = defaultVariant?.frontPath || resolveSpritePath(jsonPath, payload?.sprites?.front);
  const shinySpritePath = defaultVariant?.frontShinyPath || resolveSpritePath(jsonPath, payload?.sprites?.front_shiny);
  const cryPath = resolveSpritePath(jsonPath, payload?.cry?.path);
  const [spriteImage, spriteShinyImage] = await Promise.all([loadImage(spritePath), loadImage(shinySpritePath)]);
  registerSpriteImageInCache(spritePath, spriteImage);
  registerSpriteImageInCache(shinySpritePath, spriteShinyImage);

  const defensiveTypes = getDefensiveTypes(payload);
  const offensiveType = String(payload?.offensive_type || defensiveTypes[0] || "normal").toLowerCase();
  const attackMode = String(payload?.attack_mode || payload?.attackMode || "").toLowerCase().trim();
  const evolvesFrom = normalizeEvolutionLink(payload?.evolves_from);
  const evolvesTo = Array.isArray(payload?.evolves_to)
    ? payload.evolves_to.map((entry) => normalizeEvolutionLink(entry)).filter(Boolean)
    : [];
  const talent = normalizeTalentDefinition(
    payload?.talent ?? {
      id: payload?.talent_id ?? payload?.talent_name_en ?? payload?.talent_name_fr,
      name_fr: payload?.talent_name_fr,
      name_en: payload?.talent_name_en,
      description_fr: payload?.talent_description_fr,
    },
  );

  return {
    jsonPath,
    id: Number(payload.pokedex_number || 0),
    nameFr: normalizeUiDisplayText(payload.name_fr || payload.name_en || "Pokemon", { frenchTypography: true }),
    nameEn: payload.name_en || "pokemon",
    level: calcLevel(payload.stats, 0),
    hpMax: 0,
    hpCurrent: 0,
    stats: payload.stats || {},
    defensiveTypes,
    offensiveType,
    attackMode,
    catchRate: Number(payload?.catch_rate || 45),
    cryPath,
    crySource: String(payload?.cry?.source || ""),
    spritePath,
    shinySpritePath,
    spriteImage,
    spriteShinyImage,
    spriteVariants: variants,
    defaultSpriteVariantId: defaultVariant?.id || "",
    evolvesFrom,
    evolvesTo,
    talent,
  };
}

function hideStarterModal() {
  if (!starterModalEl) {
    return;
  }
  stopUiElementTweens(starterModalEl);
  const panelEl = resolveModalPanelElement(starterModalEl);
  if (panelEl) {
    stopUiElementTweens(panelEl);
  }
  starterModalEl.classList.add("hidden");
  clearUiTweenStyles(starterModalEl);
  if (panelEl) {
    clearUiTweenStyles(panelEl);
  }
}

function showStarterModal() {
  if (!starterModalEl) {
    return;
  }
  stopUiElementTweens(starterModalEl);
  const panelEl = resolveModalPanelElement(starterModalEl);
  if (panelEl) {
    stopUiElementTweens(panelEl);
  }
  starterModalEl.classList.remove("hidden");
  clearUiTweenStyles(starterModalEl);
  if (panelEl) {
    clearUiTweenStyles(panelEl);
  }
}

function renderStarterChoices() {
  starterChoicesEl.innerHTML = "";
  for (const choice of STARTER_CHOICES) {
    const def = state.pokemonDefsById.get(choice.id);
    if (!def) {
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "starter-choice";
    button.dataset.starterId = String(choice.id);

    const image = document.createElement("img");
    image.alt = def.nameFr;
    image.src = def.spritePath;

    const name = document.createElement("span");
    name.className = "starter-choice-name";
    name.textContent = def.nameFr;

    const level = document.createElement("span");
    level.className = "starter-choice-level";
    level.textContent = `Niv. ${STARTER_LEVEL}`;

    button.appendChild(image);
    button.appendChild(name);
    button.appendChild(level);
    button.addEventListener("click", () => {
      chooseStarter(choice.id);
    });

    starterChoicesEl.appendChild(button);
  }
}

function buildTeamMemberFromSaveEntry(entry) {
  const pokemonId = Number(entry);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!def) {
    return null;
  }
  const record = getPokemonEntityRecord(pokemonId);
  reconcileAppearanceForEntityRecord(record, pokemonId);
  const forceUltraShiny = shouldForceUltraShinyAllPokemon();
  const appearance = resolveSpriteAppearanceForEntity(pokemonId, {
    forceUltraShiny,
  });
  const ultraShinyVisual = Boolean(forceUltraShiny || appearance.ultraShinyVisual);
  const level = clamp(toSafeInt(record?.level, 1), 1, MAX_LEVEL);
  const stats = computeStatsAtLevel(record?.base_stats || def.stats, level);
  const xp = Math.max(0, toSafeInt(record?.xp, 0));
  const xpToNext = getXpToNextLevelForSpecies(pokemonId, level, record?.base_stats || def.stats);
  const hpMax = computeBattleHpMax(stats, level, false);
  const talent = resolveTalentDefinition(record?.talent, pokemonId);
  const baseNameFr = String(def.nameFr || `Pokemon ${pokemonId}`);
  const nickname = sanitizePokemonNickname(record?.nickname);
  const displayNameFr = nickname || baseNameFr;
  return {
    ...def,
    nameFr: displayNameFr,
    baseNameFr,
    nickname,
    level,
    xp,
    xpToNext,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    talent,
    isShiny: false,
    isUltraShiny: false,
    isShinyVisual: Boolean(appearance.shinyVisual || ultraShinyVisual),
    isUltraShinyVisual: ultraShinyVisual,
    isShinyNegativeFallbackVisual: Boolean(appearance.shinyNegativeFallbackVisual && !ultraShinyVisual),
    spritePath: appearance.spritePath || def.spritePath,
    spriteImage: appearance.spriteImage || def.spriteImage,
    spriteVariantId: appearance.variant?.id || getDefaultSpriteVariantId(def),
    spriteAnimated: Boolean(appearance.animated),
  };
}

function resolveMorphingBaseProfile(member) {
  const pokemonId = Number(member?.id || 0);
  const def = state.pokemonDefsById.get(pokemonId) || null;
  const record = getPokemonEntityRecord(pokemonId);
  const forceUltraShiny = shouldForceUltraShinyAllPokemon();
  const appearance = pokemonId > 0
    ? resolveSpriteAppearanceForEntity(pokemonId, { forceUltraShiny })
    : null;
  const resolvedBaseStats = normalizeStatsPayload(record?.base_stats || def?.stats || member?.baseStats || member?.stats || {});
  const defaultDefensiveTypes = Array.isArray(def?.defensiveTypes) && def.defensiveTypes.length > 0
    ? def.defensiveTypes.slice(0, 2)
    : Array.isArray(member?.defensiveTypes)
      ? member.defensiveTypes.slice(0, 2)
      : ["normal"];
  return {
    pokemonId,
    baseStats: resolvedBaseStats,
    defensiveTypes: defaultDefensiveTypes,
    offensiveType: normalizeType(def?.offensiveType || member?.offensiveType || "normal"),
    attackMode: String(def?.attackMode || member?.attackMode || "").toLowerCase().trim(),
    spritePath: appearance?.spritePath || def?.spritePath || member?.spritePath || "",
    spriteImage: appearance?.spriteImage || def?.spriteImage || member?.spriteImage || null,
    spriteVariantId: appearance?.variant?.id || member?.spriteVariantId || (def ? getDefaultSpriteVariantId(def) : null),
    spriteAnimated: Boolean(appearance?.animated),
    isShinyNegativeFallbackVisual: Boolean(appearance?.shinyNegativeFallbackVisual),
  };
}

function restoreMorphingMemberBaseState(member) {
  if (!member) {
    return;
  }
  const baseProfile = resolveMorphingBaseProfile(member);
  const level = clamp(toSafeInt(member.level, 1), 1, MAX_LEVEL);
  const hpRatio = member.hpMax > 0 ? clamp(member.hpCurrent / member.hpMax, 0, 1) : 1;
  const restoredStats = computeStatsAtLevel(baseProfile.baseStats, level);
  const restoredHpMax = computeBattleHpMax(restoredStats, level, false);
  member.baseStats = normalizeStatsPayload(baseProfile.baseStats);
  member.stats = restoredStats;
  member.hpMax = restoredHpMax;
  member.hpCurrent = Math.max(1, Math.round(restoredHpMax * hpRatio));
  member.defensiveTypes = Array.isArray(baseProfile.defensiveTypes) ? baseProfile.defensiveTypes.slice(0, 2) : ["normal"];
  member.offensiveType = normalizeType(baseProfile.offensiveType || "normal");
  member.attackMode = baseProfile.attackMode || member.attackMode || "";
  member.spritePath = baseProfile.spritePath || member.spritePath;
  member.spriteImage = baseProfile.spriteImage || member.spriteImage;
  member.spriteVariantId = baseProfile.spriteVariantId || member.spriteVariantId;
  member.spriteAnimated = Boolean(baseProfile.spriteAnimated);
  member.isShinyNegativeFallbackVisual = Boolean(
    baseProfile.isShinyNegativeFallbackVisual && !member.isUltraShinyVisual,
  );
}

function getWrappedTeamIndex(index, teamMembers) {
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return -1;
  }
  const length = teamMembers.length;
  const safeIndex = toSafeInt(index, 0);
  return ((safeIndex % length) + length) % length;
}

function getTeamAdjacentMember(teamMembers, index, direction = 1) {
  if (!Array.isArray(teamMembers) || teamMembers.length <= 1) {
    return null;
  }
  const currentIndex = getWrappedTeamIndex(index, teamMembers);
  if (currentIndex < 0) {
    return null;
  }
  const offset = Number(direction) < 0 ? -1 : 1;
  const targetIndex = getWrappedTeamIndex(currentIndex + offset, teamMembers);
  if (targetIndex < 0 || targetIndex === currentIndex) {
    return null;
  }
  return teamMembers[targetIndex] || null;
}

function applyTeamTalentOverrides(teamMembers) {
  if (!Array.isArray(teamMembers) || teamMembers.length <= 0) {
    return teamMembers;
  }

  for (let index = 0; index < teamMembers.length; index += 1) {
    const member = teamMembers[index];
    if (!member || !shouldApplyMorphingTalent(member?.talent, member?.id)) {
      continue;
    }

    restoreMorphingMemberBaseState(member);
    const source = getTeamAdjacentMember(teamMembers, index, -1);
    member.morphingSourceId = Number(source?.id || 0) > 0 ? Number(source.id) : null;
    member.spriteShader = source ? buildMorphingShaderConfig() : null;
    if (!source) {
      continue;
    }

    const level = clamp(toSafeInt(member.level, 1), 1, MAX_LEVEL);
    const sourceBaseStats = normalizeStatsPayload(source.baseStats || source.stats || {});
    const nextStats = computeStatsAtLevel(sourceBaseStats, level);
    const hpRatio = member.hpMax > 0 ? clamp(member.hpCurrent / member.hpMax, 0, 1) : 1;
    const hpMax = computeBattleHpMax(nextStats, level, false);

    member.baseStats = sourceBaseStats;
    member.stats = nextStats;
    member.hpMax = hpMax;
    member.hpCurrent = Math.max(1, Math.round(hpMax * hpRatio));
    member.defensiveTypes =
      Array.isArray(source.defensiveTypes) && source.defensiveTypes.length > 0
        ? source.defensiveTypes.slice(0, 2)
        : member.defensiveTypes;
    member.offensiveType = source.offensiveType || member.offensiveType;
    member.attackMode = source.attackMode || member.attackMode || "";
    member.spritePath = source.spritePath || member.spritePath;
    member.spriteImage = source.spriteImage || member.spriteImage;
    member.spriteVariantId = source.spriteVariantId || member.spriteVariantId;
    member.spriteAnimated = Boolean(source.spriteAnimated);
    member.isShinyNegativeFallbackVisual = Boolean(
      source.isShinyNegativeFallbackVisual && !member.isUltraShinyVisual,
    );
  }

  return teamMembers;
}

function hydrateTeamFromSave() {
  const trainerSession = getActiveTrainerBattleSession();
  const sourceTeamIds =
    trainerSession && Array.isArray(trainerSession.selectedTeamIds)
      ? trainerSession.selectedTeamIds
      : state.saveData?.team;
  if (!Array.isArray(sourceTeamIds)) {
    return [];
  }
  const uniqueIds = [];
  for (const rawId of sourceTeamIds) {
    const id = Number(rawId);
    if (id > 0 && !uniqueIds.includes(id) && isPokemonEntityUnlockedById(id)) {
      uniqueIds.push(id);
    }
    if (uniqueIds.length >= MAX_TEAM_SIZE) {
      break;
    }
  }
  if (!trainerSession && state.saveData) {
    state.saveData.team = uniqueIds;
  }
  const team = uniqueIds.map(buildTeamMemberFromSaveEntry).filter(Boolean);
  return applyTeamTalentOverrides(team);
}

function applyAutoGrantedProgress(pokemonId, level = 1) {
  if (!state.saveData) {
    return { addedToTeam: false };
  }

  const { record, wasUnlocked } = ensurePokemonEntityUnlocked(pokemonId, level);
  const capturedBefore = getCapturedTotal(record);
  incrementSpeciesStat(pokemonId, "encountered", false, 1);
  incrementSpeciesStat(pokemonId, "captured", false, 1);
  const baseCaptureCoinReward = COIN_REWARD_PER_CAPTURE;
  const firstCaptureBonus = capturedBefore <= 0 ? COIN_REWARD_FIRST_CAPTURE_BONUS : 0;
  addCoins(baseCaptureCoinReward + firstCaptureBonus);
  record.encountered_normal = Math.max(1, record.encountered_normal);
  record.captured_normal = Math.max(1, record.captured_normal);

  let addedToTeam = false;
  if (!wasUnlocked) {
    addedToTeam = addSpeciesToTeamIfPossible(pokemonId);
  } else if (state.saveData.team.length < MAX_TEAM_SIZE && !state.saveData.team.includes(Number(pokemonId))) {
    addedToTeam = addSpeciesToTeamIfPossible(pokemonId);
  }
  rebuildTeamAndSyncBattle();
  return { addedToTeam };
}

function pickEncounterLevel(encounter) {
  const activeRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  if (activeRouteId === ROUTE_1_TUTORIAL_ID) {
    return 1;
  }

  const levelWeights = Array.isArray(encounter?.level_weights)
    ? encounter.level_weights
        .map((entry) => ({
          level: clamp(toSafeInt(entry?.level, 1), 1, MAX_LEVEL),
          spawn_weight: Math.max(1, toSafeInt(entry?.weight, 1)),
        }))
        .filter((entry) => entry.level > 0)
    : [];
  if (levelWeights.length > 0) {
    const picked = weightedPick(levelWeights);
    if (picked?.level) {
      return picked.level;
    }
  }

  const minLevel = clamp(toSafeInt(encounter?.min_level, DEFAULT_WILD_LEVEL_MIN), 1, MAX_LEVEL);
  const maxLevel = clamp(
    toSafeInt(encounter?.max_level, Math.max(minLevel, DEFAULT_WILD_LEVEL_MAX)),
    minLevel,
    MAX_LEVEL,
  );
  return randomInt(minLevel, maxLevel);
}

function isEncounterMethodUnlocked(methodId) {
  const id = String(methodId || "").toLowerCase().trim();
  if (!id) {
    return true;
  }
  if (ENCOUNTER_METHOD_DISABLED[id]) {
    return false;
  }
  if (ENCOUNTER_METHOD_ALWAYS_UNLOCKED[id]) {
    return true;
  }
  const requiredRouteId = ENCOUNTER_METHOD_UNLOCK_ROUTE_BY_ID[id];
  if (!requiredRouteId) {
    return true;
  }
  return isRouteUnlocked(requiredRouteId);
}

function getEncounterMethods(encounter) {
  if (!Array.isArray(encounter?.methods)) {
    return [];
  }
  return encounter.methods
    .map((method) => String(method || "").toLowerCase().trim())
    .filter(Boolean);
}

function encounterHasMethod(encounter, methodId) {
  const id = String(methodId || "").toLowerCase().trim();
  if (!id) {
    return false;
  }
  const methods = getEncounterMethods(encounter);
  return methods.includes(id);
}

function isEncounterMethodUnlockedForSelection(methodId, options = {}) {
  const id = String(methodId || "").toLowerCase().trim();
  if (!id) {
    return true;
  }
  const allowDisabledMethods = options?.allowDisabledMethods instanceof Set ? options.allowDisabledMethods : null;
  if (allowDisabledMethods?.has(id)) {
    return true;
  }
  return isEncounterMethodUnlocked(id);
}

function isEncounterEntryUnlocked(encounter, options = {}) {
  const methods = getEncounterMethods(encounter);
  if (methods.length === 0) {
    return true;
  }
  for (const method of methods) {
    if (isEncounterMethodUnlockedForSelection(method, options)) {
      return true;
    }
  }
  return false;
}

function getUnlockedEncountersForRoute(routeData, options = {}) {
  const encounters = Array.isArray(routeData?.encounters) ? routeData.encounters : [];
  if (encounters.length === 0) {
    return [];
  }
  const requireMethod = String(options?.requireMethod || "").toLowerCase().trim();
  const excludeMethod = String(options?.excludeMethod || "").toLowerCase().trim();
  const allowDisabledMethods = options?.allowDisabledMethods instanceof Set ? options.allowDisabledMethods : null;
  return encounters.filter((encounter) => {
    if (requireMethod && !encounterHasMethod(encounter, requireMethod)) {
      return false;
    }
    if (excludeMethod && encounterHasMethod(encounter, excludeMethod)) {
      return false;
    }
    return isEncounterEntryUnlocked(encounter, { allowDisabledMethods });
  });
}

function ensureOnlyOneEncounterCycleRoute(routeId = null) {
  const activeRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  if (!state.onlyOneEncounterCycle || state.onlyOneEncounterCycle.routeId !== activeRouteId) {
    state.onlyOneEncounterCycle = {
      routeId: activeRouteId,
      normalCount: 0,
    };
  }
  return state.onlyOneEncounterCycle;
}

function resetOnlyOneEncounterCycle(routeId = null) {
  const cycle = ensureOnlyOneEncounterCycleRoute(routeId);
  cycle.normalCount = 0;
  return cycle;
}

function incrementOnlyOneEncounterCycle(routeId = null) {
  const cycle = ensureOnlyOneEncounterCycleRoute(routeId);
  if (!isOnlyOneEncounterCycleArmed(routeId)) {
    cycle.normalCount = 0;
    return cycle;
  }
  cycle.normalCount = clamp(toSafeInt(cycle.normalCount, 0) + 1, 0, ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN);
  return cycle;
}

function shouldSpawnOnlyOneEncounter(routeId = null) {
  const cycle = ensureOnlyOneEncounterCycleRoute(routeId);
  if (!isOnlyOneEncounterCycleArmed(routeId)) {
    cycle.normalCount = 0;
    return false;
  }
  return cycle.normalCount >= ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN;
}

function isOnlyOneEncounterCycleArmed(routeId = null) {
  const activeRouteId = String(routeId || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const progressState = getRouteUnlockProgressState(activeRouteId);
  if (!progressState.nextRouteId) {
    return true;
  }
  if (progressState.unlockMode !== "defeats" || progressState.unlockTarget <= 0) {
    return true;
  }
  return progressState.nextUnlocked || progressState.currentDefeats >= progressState.unlockTarget;
}

function pickEncounterForCurrentRoute(routeData) {
  const activeRouteId = String(routeData?.route_id || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  const normalEncounters = getUnlockedEncountersForRoute(routeData, {
    excludeMethod: ENCOUNTER_METHOD_ONLY_ONE,
  });
  const onlyOneEncounters = getUnlockedEncountersForRoute(routeData, {
    requireMethod: ENCOUNTER_METHOD_ONLY_ONE,
    allowDisabledMethods: ENCOUNTER_METHOD_ONLY_ONE_ALLOW_SET,
  });
  const hasOnlyOneEncounters = onlyOneEncounters.length > 0;
  const onlyOneCycleArmed = isOnlyOneEncounterCycleArmed(activeRouteId);
  if (hasOnlyOneEncounters && onlyOneCycleArmed && shouldSpawnOnlyOneEncounter(activeRouteId)) {
    const pickedOnlyOne = weightedPick(onlyOneEncounters);
    if (pickedOnlyOne) {
      resetOnlyOneEncounterCycle(activeRouteId);
      return {
        encounter: pickedOnlyOne,
        isOnlyOneEncounter: true,
      };
    }
  }

  const pickedNormal = weightedPick(normalEncounters);
  if (pickedNormal) {
    if (hasOnlyOneEncounters) {
      incrementOnlyOneEncounterCycle(activeRouteId);
    }
    return {
      encounter: pickedNormal,
      isOnlyOneEncounter: false,
    };
  }

  const fallbackOnlyOne = weightedPick(onlyOneEncounters);
  const allowOnlyOneFallback = onlyOneCycleArmed || normalEncounters.length <= 0;
  if (fallbackOnlyOne && allowOnlyOneFallback) {
    resetOnlyOneEncounterCycle(activeRouteId);
    return {
      encounter: fallbackOnlyOne,
      isOnlyOneEncounter: true,
    };
  }

  return {
    encounter: null,
    isOnlyOneEncounter: false,
  };
}

function isOnlyOneEncounterEnemy(enemy) {
  return routeEncounterCombatSystem.isOnlyOneEncounterEnemy(enemy);
}

function createTrainerBattleEnemyInstance() {
  const session = getActiveTrainerBattleSession();
  const definition = session?.definition || null;
  const roster = Array.isArray(definition?.roster) ? definition.roster : [];
  const enemyIndex = Math.max(0, toSafeInt(session?.enemyIndex, 0));
  const rosterEntry = roster[enemyIndex] || null;
  const pokemonId = Number(rosterEntry?.pokemon_id || 0);
  const def = state.pokemonDefsById.get(pokemonId) || null;
  if (!session || !definition || !rosterEntry || !def) {
    return null;
  }

  const level = clamp(toSafeInt(rosterEntry?.level, 1), 1, MAX_LEVEL);
  const stats = computeStatsAtLevel(def.stats, level);
  const baseHpMax = computeBattleHpMax(stats, level, true);
  const hpMax = Math.max(1, Math.round(baseHpMax * TRAINER_BATTLE_ENEMY_HP_MULTIPLIER));
  const appearance = resolveSpriteAppearanceForEntity(def.id, {
    shinyVisual: false,
    ultraShinyVisual: false,
    forceUltraShiny: false,
    respectAppearanceShinyMode: false,
    respectAppearanceUltraShinyMode: false,
  });

  return {
    ...def,
    nameFr: String(def.nameFr || def.nameEn || `Pokemon ${def.id}`),
    nameEn: String(def.nameEn || def.nameFr || `pokemon_${def.id}`),
    level,
    stats,
    baseStats: normalizeStatsPayload(def.stats),
    hpMax,
    hpCurrent: hpMax,
    catchRate: Number(def.catchRate || 45),
    isShiny: false,
    isUltraShiny: false,
    isTrainerBattle: true,
    trainerBattleId: String(definition.trainer_battle_id || ""),
    trainerBattleEnemyIndex: enemyIndex,
    trainerNameFr: String(definition.trainer_name_fr || ""),
    encounterMethods: [],
    balanceTeamSize: Math.max(1, getActiveTeamSizeForBalance()),
    balanceHpMultiplier: TRAINER_BATTLE_ENEMY_HP_MULTIPLIER,
    balanceRewardMultiplier: 1,
    isShinyVisual: false,
    isUltraShinyVisual: false,
    isShinyNegativeFallbackVisual: false,
    spritePath: appearance.spritePath || def.spritePath,
    spriteImage: appearance.spriteImage || def.spriteImage,
    spriteVariantId: appearance.variant?.id || getDefaultSpriteVariantId(def),
    spriteAnimated: Boolean(appearance.animated),
  };
}

function createEnemyInstanceForSource(sourceKind = getCurrentBattleSourceKind()) {
  return String(sourceKind || "").trim() === TRAINER_BATTLE_SOURCE_TRAINER
    ? createTrainerBattleEnemyInstance()
    : createRouteEnemyInstance();
}

function createRouteEnemyInstance() {
  return routeEncounterCombatSystem.createRouteEnemyInstance();
}

function handleEnemySpawn(enemy, sourceKind = getCurrentBattleSourceKind()) {
  if (!enemy) {
    return;
  }
  state.enemy = enemy;
  playEnemyCry(enemy);
  if (String(sourceKind || "").trim() === TRAINER_BATTLE_SOURCE_TRAINER) {
    if (!state.simulationIdleMode) {
      updateHud();
    }
    return;
  }
  if (enemy.isShiny) {
    notifyWindowsShinyEncounter(enemy);
  }
  const speciesRecord = ensureSpeciesStats(enemy.id);
  incrementSpeciesStat(enemy.id, "encountered", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
  notifyShinyEncounterUntilCaptured(enemy, speciesRecord);
  persistSaveDataForSimulationEvent();
  if (!state.simulationIdleMode) {
    updateHud();
  }
}

function getEnemyTimerConfigForBattle(enemy = null, sourceKind = getCurrentBattleSourceKind()) {
  if (String(sourceKind || "").trim() === TRAINER_BATTLE_SOURCE_TRAINER) {
    return {
      enabled: true,
      durationMs: TRAINER_BATTLE_ENEMY_TIMER_MS,
      style: ENEMY_TIMER_STYLE_ROUTE,
    };
  }
  return routeEncounterCombatSystem.getEnemyTimerConfigForBattle(enemy);
}

function handleEnemyTimerExpired(enemy, sourceKind = getCurrentBattleSourceKind()) {
  if (String(sourceKind || "").trim() === TRAINER_BATTLE_SOURCE_TRAINER) {
    finishTrainerBattle({
      victory: false,
      enemy,
      reason: "timeout",
    });
    return { battle_finished: true };
  }
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  if (isOnlyOneEncounterEnemy(enemy)) {
    resetOnlyOneEncounterCycle(activeRouteId);
  }
  const progressState = getRouteUnlockProgressState(activeRouteId);
  if (!progressState.timerEnabled) {
    return;
  }
  const previousStreak = Math.max(0, toSafeInt(progressState.rawDefeats, 0));
  if (previousStreak > 0) {
    setRouteDefeatCount(activeRouteId, 0);
    if (!state.simulationIdleMode) {
      setTopMessage(`Temps ecoule contre ${enemy?.nameFr || "le Pokemon"}. Serie de KO remise a zero.`, 1800);
    }
  }
}

function handleEnemyDefeated(enemy, sourceKind = getCurrentBattleSourceKind()) {
  if (String(sourceKind || "").trim() === TRAINER_BATTLE_SOURCE_TRAINER) {
    const session = getActiveTrainerBattleSession();
    const definition = session?.definition || null;
    const roster = Array.isArray(definition?.roster) ? definition.roster : [];
    const defeatedIndex = Math.max(0, toSafeInt(enemy?.trainerBattleEnemyIndex, session?.enemyIndex || 0));
    if (session && defeatedIndex < roster.length - 1) {
      session.enemyIndex = defeatedIndex + 1;
      return {
        captured: false,
        capture_attempted: false,
      };
    }
    finishTrainerBattle({
      victory: true,
      enemy,
      reason: "victory",
    });
    return {
      captured: false,
      capture_attempted: false,
      battle_finished: true,
    };
  }
  if (!enemy) {
    return { captured: false, capture_attempted: false };
  }

  incrementSpeciesStat(enemy.id, "defeated", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
  const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  incrementRouteDefeatCount(activeRouteId, 1);
  tryUnlockNextRouteAfterDefeat(activeRouteId);
  const enemyLevel = routeEncounterCombatSystem.getEnemyLevelForRewards(enemy);
  const highestTeamLevel = getHighestTeamLevelForRewardScaling();
  const teamLevelDiff = enemyLevel - highestTeamLevel;
  const teamDiffMultipliers = getRewardMultipliersFromLevelDiff(teamLevelDiff);
  const moneyMultiplier = Math.max(
    MIN_LEVEL_DIFF_MONEY_MULTIPLIER,
    clamp(Number(teamDiffMultipliers.money || 1), 0, 1),
  );
  const moneyTalentMultiplier = getTeamMoneyTalentMultiplier(state.battle?.team || state.team);
  const moneyReward = scaleRewardByMultiplier(
    computeDefeatMoneyReward(enemy),
    moneyMultiplier * moneyTalentMultiplier,
    1,
  );
  addMoney(moneyReward);
  const captureEquivalentXpReward = computeCaptureXpReward(enemy);
  const koXpReward = Math.max(1, Math.floor(captureEquivalentXpReward * KO_XP_RATIO_OF_CAPTURE));
  const captureBonusXpReward = Math.max(0, captureEquivalentXpReward - koXpReward);
  const resolveXpMultiplier = ({ teamLevel }) => {
    const level = Math.max(1, toSafeInt(teamLevel, 1));
    const levelDiff = enemyLevel - level;
    return clamp(Number(getXpMultiplierFromLevelDiff(levelDiff) || 1), 0, 1);
  };
  const applyXpSummaryEffects = (summary, tone) => {
    if (state.simulationIdleMode || !summary) {
      return;
    }
    if (Array.isArray(summary.levelUps) && summary.levelUps.length > 0) {
      queueTeamLevelUpEffects(summary.levelUps);
    }
    if (Array.isArray(summary.xpGains) && summary.xpGains.length > 0) {
      queueTeamXpGainEffects(summary.xpGains, { tone });
    }
  };
  let xpRewardGranted = false;
  const awardKoXpReward = () => {
    if (xpRewardGranted) {
      return null;
    }
    xpRewardGranted = true;
    const summary = awardCaptureXpToTeam(enemy, {
      reward: koXpReward,
      rewardMultiplierResolver: resolveXpMultiplier,
    });
    applyXpSummaryEffects(summary, "defeat");
    return summary;
  };
  const awardCaptureBonusXpReward = () => {
    if (xpRewardGranted) {
      return null;
    }
    xpRewardGranted = true;
    const summary = awardCaptureXpToTeam(enemy, {
      reward: captureBonusXpReward,
      rewardMultiplierResolver: resolveXpMultiplier,
    });
    applyXpSummaryEffects(summary, "capture");
    return summary;
  };
  let captureAttempted = false;
  let captured = false;
  let captureCritical = false;
  let captureChanceDisplay = null;
  let captureOnComplete = null;
  let deferKoXpRewardToCaptureEnd = false;
  let addedToTeam = false;
  let captureXpSummary = null;
  let usedBallType = null;
  const awardCaptureCoinReward = () => {
    const speciesRecord = ensureSpeciesStats(enemy.id);
    const isFirstCapture = getCapturedTotal(speciesRecord) <= 0;
    const baseCaptureCoinReward = COIN_REWARD_PER_CAPTURE;
    addCoins(baseCaptureCoinReward + (isFirstCapture ? COIN_REWARD_FIRST_CAPTURE_BONUS : 0));
  };

  if (getBallInventoryTotalCount() > 0) {
    const captureConsume = consumeBallForCapture(enemy);
    captureAttempted = Boolean(captureConsume.consumed);
    usedBallType = captureConsume.ballType;
    if (captureAttempted && usedBallType) {
      const guaranteedCapture = consumePendingGuaranteedCaptureBonus();
      if (guaranteedCapture) {
        captureChanceDisplay = 1;
        captured = true;
      } else {
        const ballMultiplier = getBallCaptureMultiplier(usedBallType);
        captureCritical = Math.random() < CAPTURE_CRIT_CHANCE;
        const criticalMultiplier = captureCritical ? CAPTURE_CRIT_MULTIPLIER : 1;
        captureChanceDisplay = computeCatchChance(enemy.catchRate, ballMultiplier * criticalMultiplier);
        const shinyCaptureMultiplier = enemy.isUltraShiny ? 2 : enemy.isShiny ? 1.5 : 1;
        const catchChance = computeCatchChance(
          enemy.catchRate,
          ballMultiplier * criticalMultiplier * shinyCaptureMultiplier,
        );
        captured = Math.random() < catchChance;
      }
      if (captured) {
        if (state.simulationIdleMode) {
          awardCaptureCoinReward();
          incrementSpeciesStat(enemy.id, "captured", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
          if (enemy.isShiny) {
            notifyWindowsShinyCapture(enemy, { isCritical: captureCritical });
          }
          const captureUnlockSummary = resolveCaptureEntityUnlock(enemy.id);
          addedToTeam = Boolean(captureUnlockSummary?.addedToTeam);
          captureXpSummary = awardCaptureBonusXpReward();
        } else {
          captureOnComplete = () => {
            awardCaptureCoinReward();
            incrementSpeciesStat(enemy.id, "captured", enemy.isShiny, 1, { isUltraShiny: enemy.isUltraShiny });
            if (enemy.isShiny) {
              notifyWindowsShinyCapture(enemy, { isCritical: captureCritical });
            }
            const captureUnlockSummary = resolveCaptureEntityUnlock(enemy.id);
            const captureAddedToTeam = Boolean(captureUnlockSummary?.addedToTeam);
            awardCaptureBonusXpReward();

            rebuildTeamAndSyncBattle();
            persistSaveDataForSimulationEvent();
            if (!state.simulationIdleMode) {
              updateHud();
            }
            return captureAddedToTeam;
          };
        }
      } else {
        if (state.simulationIdleMode) {
          awardKoXpReward();
        } else {
          deferKoXpRewardToCaptureEnd = true;
          captureOnComplete = () => {
            awardKoXpReward();

            rebuildTeamAndSyncBattle();
            persistSaveDataForSimulationEvent();
            if (!state.simulationIdleMode) {
              updateHud();
            }
            return false;
          };
        }
      }
    }
  }
  if (!captureAttempted || (!captured && !xpRewardGranted && !deferKoXpRewardToCaptureEnd)) {
    awardKoXpReward();
  }

  rebuildTeamAndSyncBattle();
  persistSaveDataForSimulationEvent();
  if (!state.simulationIdleMode) {
    updateHud();
  }
  return {
    captured,
    capture_attempted: captureAttempted,
    capture_critical: captureCritical,
    capture_ball_type: usedBallType,
    added_to_team: addedToTeam,
    capture_chance_display: captureChanceDisplay,
    capture_on_complete: captureOnComplete,
  };
}

function chooseStarter(starterId) {
  if (!state.saveData) {
    return;
  }
  const def = state.pokemonDefsById.get(Number(starterId));
  if (!def) {
    return;
  }

  state.saveData.starter_chosen = true;
  applyAutoGrantedProgress(def.id, STARTER_LEVEL);
  if (!state.saveData.team.includes(def.id)) {
    state.saveData.team = [def.id, ...state.saveData.team].slice(0, MAX_TEAM_SIZE);
  }
  rebuildTeamAndSyncBattle();
  persistSaveData();
  updateHud();

  hideStarterModal();
  const movedToRoute1 = applyRouteChange(ROUTE_1_TUTORIAL_ID, { announce: false });
  if (!movedToRoute1) {
    startBattle();
  }
  state.mode = "ready";
  setTopMessage(`${def.nameFr} rejoint ton equipe. Direction Route 1 !`, 1700);
  tryOpenPendingTutorialFlow();
}

function startBattle() {
  battleLifecycleSystem.startBattle();
}

function setTopMessage(text, durationMs = 1200) {
  const safeText = normalizeUiDisplayText(text || "", { frenchTypography: true });
  return runtimeNotificationSystem.setTopMessage(safeText, durationMs);
}

function getRouteDisplayName(routeId) {
  const id = String(routeId || DEFAULT_ROUTE_ID);
  return normalizeUiDisplayText(state.routeCatalog.get(id)?.route_name_fr || id, { frenchTypography: true });
}

function getRouteNavigationState() {
  const unlockedRouteIds = getOrderedUnlockedRouteIds();
  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  return {
    unlockedRouteIds,
    currentRouteId,
  };
}

function isRouteUnlocked(routeId) {
  const id = String(routeId || "");
  if (!id) {
    return false;
  }
  return getOrderedUnlockedRouteIds().includes(id);
}

function getRouteEncounterSpeciesIds(routeInput = null) {
  const routeData =
    routeInput && typeof routeInput === "object"
      ? routeInput
      : getRouteDataById(routeInput || state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID) ||
        state.routeData;
  const unlockedEncounters = getUnlockedEncountersForRoute(routeData);
  const ids = [];
  for (const encounter of unlockedEncounters) {
    const id = Number(encounter?.id || 0);
    if (id > 0 && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

function hasExactShinyCaptureForSpecies(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const record = getPokemonEntityRecord(id);
  return Math.max(0, toSafeInt(record?.captured_shiny, 0)) > 0;
}

function hasExactUltraShinyCaptureForSpecies(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0) {
    return false;
  }
  const record = getPokemonEntityRecord(id);
  return Math.max(0, toSafeInt(record?.captured_ultra_shiny, 0)) > 0;
}

function getRouteCollectionBadgeState(routeInput = null) {
  const speciesIds = getRouteEncounterSpeciesIds(routeInput);
  if (speciesIds.length <= 0) {
    return {
      hasEncounterSpecies: false,
      familyOwnedAll: false,
      ownedAll: false,
      familyShinyAll: false,
      familyUltraAll: false,
      ownedShinyAll: false,
      ownedUltraAll: false,
    };
  }

  let familyOwnedAll = true;
  let ownedAll = true;
  let familyShinyAll = true;
  let familyUltraAll = true;
  let ownedShinyAll = true;
  let ownedUltraAll = true;

  for (const pokemonId of speciesIds) {
    if (!isEvolutionFamilyOwned(pokemonId)) {
      familyOwnedAll = false;
    }
    if (!isPokemonEntityUnlockedById(pokemonId)) {
      ownedAll = false;
    }
    if (getFamilyShinyCaptureCount(pokemonId) <= 0) {
      familyShinyAll = false;
    }
    if (getFamilyUltraShinyCaptureCount(pokemonId) <= 0) {
      familyUltraAll = false;
    }
    if (!hasExactShinyCaptureForSpecies(pokemonId)) {
      ownedShinyAll = false;
    }
    if (!hasExactUltraShinyCaptureForSpecies(pokemonId)) {
      ownedUltraAll = false;
    }
  }

  return {
    hasEncounterSpecies: true,
    familyOwnedAll,
    ownedAll,
    familyShinyAll,
    familyUltraAll,
    ownedShinyAll,
    ownedUltraAll,
  };
}

function buildRouteNameStatusGroups(stateByRoute = null) {
  const badgeState = stateByRoute || getRouteCollectionBadgeState();
  const groups = [];
  if (!badgeState.hasEncounterSpecies) {
    return groups;
  }
  if (badgeState.familyOwnedAll) {
    groups.push({
      kind: "family",
      ballTitle: "Familles de la zone: au moins une capture possedee pour chaque famille evolutive.",
      shiny: badgeState.familyShinyAll,
      ultra: badgeState.familyUltraAll,
    });
  }
  if (badgeState.ownedAll) {
    groups.push({
      kind: "owned",
      ballTitle: "Zone complete: toutes les especes de la zone sont possedees.",
      shiny: badgeState.ownedShinyAll,
      ultra: badgeState.ownedUltraAll,
    });
  }
  return groups;
}

const routeNavigationRuntime = createRouteNavigationRuntime({
  state,
  defaultRouteId: DEFAULT_ROUTE_ID,
  defaultRegionId: MAP_REGION_DEFAULT_ID,
  normalizeUiDisplayText,
  getOrderedCatalogRouteIds,
  getRouteNavigationState,
  getRouteUnlockProgressState,
  getConnectedRouteIds,
  getRouteAccessStateForRoute,
  isRouteUnlocked,
  getRouteDisplayName,
  getRouteZoneTypeLabel,
  getRouteRegionId,
  getRouteCollectionBadgeState,
  buildRouteNameStatusGroups,
});

const routeNavigationUi = createRouteNavigationUi({
  documentRef: document,
  normalizeUiDisplayText,
  formatRouteAccessFlagLabel: routeNavigationRuntime.formatRouteAccessFlagLabel,
});

const zoneDialogueUi = createZoneDialogueUi({
  documentRef: document,
  HTMLElementRef: HTMLElement,
  normalizeUiDisplayText,
  clamp,
  getRouteDisplayName,
});

const mapNavigationUi = createMapNavigationUi({
  documentRef: document,
  normalizeUiDisplayText,
});

const zoneDialogueRuntime = createZoneDialogueRuntime({
  state,
  defaultRouteId: DEFAULT_ROUTE_ID,
  dialogueDataDir: DIALOGUE_DATA_DIR,
  normalizeUiDisplayText,
  normalizeFlagIdList,
  fetchFn: (...args) => fetch(...args),
  validateDialoguePayload,
  getRouteAccessFlags,
  getRouteDataById,
  getRouteDisplayName,
  setRouteAccessFlag,
  tryUnlockNextRouteAfterDefeat: (...args) => tryUnlockNextRouteAfterDefeat(...args),
  triggerTrainerBattleAction,
  refreshRouteUi,
  refreshZoneActionButtons,
  renderMapModal,
  updateHud,
  persistSaveDataForSimulationEvent,
  setTopMessage,
  hideHoverPopup: (...args) => hideHoverPopup(...args),
  prepareDialogueUi: () => {
    closeTeamContextMenu();
    closeBallCaptureMenu();
    closeRenameModal();
    closeTrainerBattleSetupModal();
    closeBoxesModal();
    closePokedexModal();
    closeAppearanceModal();
    closeEvolutionItemChoiceModal(null);
    closeGachaModal({ force: true });
    setMapOpen(false);
    setShopOpen(false);
  },
  showDialogueModal: () => {
    if (dialogueModalEl) {
      showModalWithTween(dialogueModalEl);
    }
  },
  hideDialogueModal: () => {
    if (dialogueModalEl) {
      hideModalWithTween(dialogueModalEl);
    }
  },
  clearDialogueUi: () => {
    zoneDialogueUi.clearDialogueUi({
      dialogueChoiceListEl,
      dialogueTextEl,
    });
  },
  renderDialogueModal,
  canOpenDialogueModalNow,
  hasSeenDialogue,
  markDialogueSeen,
  tryOpenPendingTutorialFlow,
});

function getConnectedRouteDisplayStates(routeId = null) {
  return routeNavigationRuntime.getConnectedRouteDisplayStates(routeId);
}

function buildRouteDisplayState(routeId, options = {}) {
  return routeNavigationRuntime.buildRouteDisplayState(routeId, options);
}

function buildRouteNavigationViewModel(routeId = null) {
  return routeNavigationRuntime.buildRouteNavigationViewModel(routeId);
}

function createRouteNavigationEmptyState(text) {
  return routeNavigationUi.createRouteNavigationEmptyState(text);
}

function buildRouteDestinationCard(routeState, options = {}) {
  return routeNavigationUi.buildRouteDestinationCard(routeState, options);
}

function renderRouteInfoPanelInto(panelEl, routeState) {
  routeNavigationUi.renderRouteInfoPanelInto(panelEl, routeState);
}

function setRouteNavDrawerOpen(open) {
  const nextOpen = Boolean(open);
  if (state.ui.routeNavDrawerOpen === nextOpen) {
    refreshRouteUi();
    return;
  }
  state.ui.routeNavDrawerOpen = nextOpen;
  if (!nextOpen) {
    state.ui.routeNavInfoRouteId = null;
  }
  refreshRouteUi();
}

function toggleRouteNavDrawer() {
  setRouteNavDrawerOpen(!state.ui.routeNavDrawerOpen);
}

function openRouteNavigationInfo(routeId) {
  const targetRouteId = String(routeId || "").trim();
  if (!targetRouteId) {
    return;
  }
  const routeState = buildRouteDisplayState(targetRouteId);
  if (!routeState || routeState.unlocked) {
    closeRouteNavigationInfo();
    return;
  }
  state.ui.routeNavDrawerOpen = true;
  state.ui.routeNavInfoRouteId = targetRouteId;
  refreshRouteUi();
}

function closeRouteNavigationInfo() {
  if (!state.ui.routeNavInfoRouteId) {
    refreshRouteUi();
    return;
  }
  state.ui.routeNavInfoRouteId = null;
  refreshRouteUi();
}

function refreshRouteUi() {
  const routeViewModel = buildRouteNavigationViewModel();
  routeNavigationUi.renderPrimaryNavigation({
    viewModel: routeViewModel,
    refs: {
      routeNavPanelEl,
      routeNavZoneTypeEl,
      routeNavRegionEl,
      routeNavCurrentEl,
      routeNavBadgesEl,
      routeNavProgressChipsEl,
      routeNavDestinationsEl,
      routeNavDrawerToggleCountEl,
      routeNavDrawerToggleButtonEl,
      routeNavDrawerEl,
      routeNavDrawerListEl,
      routeNavInfoPanelEl,
      mapConnectionsInfoPanelEl,
    },
  });

  if (state.ui.mapOpen) {
    renderMapModal();
  }
}

function applyRouteChange(routeId, options = {}) {
  const announce = options?.announce !== false;
  if (!state.saveData) {
    return false;
  }
  if (isTrainerBattleActive()) {
    if (announce && !state.simulationIdleMode) {
      setTopMessage("Quitte d'abord le combat contre Pierre.", 1800);
    }
    return false;
  }
  if (state.ui.trainerBattleSetupOpen) {
    if (announce && !state.simulationIdleMode) {
      setTopMessage("Ferme d'abord la preparation du combat.", 1700);
    }
    return false;
  }

  const desiredRouteId = String(routeId || "");
  const unlockedRouteIds = getOrderedUnlockedRouteIds();
  if (!unlockedRouteIds.includes(desiredRouteId)) {
    if (announce) {
      setTopMessage("Zone non débloquée.", 1400);
    }
    refreshRouteUi();
    return false;
  }

  const changed = setActiveRoute(desiredRouteId, { announceUnlock: announce });
  if (!changed) {
    if (announce) {
      setTopMessage("Impossible de changer de zone.", 1600);
    }
    return false;
  }

  battleLifecycleSystem.syncBattleForRouteChange();
  state.ui.routeNavDrawerOpen = false;
  state.ui.routeNavInfoRouteId = null;
  closeTeamContextMenu();
  clearCanvasHoverState();
  refreshZoneActionButtons();
  queueArrivalDialoguesForRoute(desiredRouteId);

  persistSaveData();
  updateHud();
  refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  render();

  if (announce) {
    const zoneType = getRouteZoneTypeLabel(desiredRouteId);
    setTopMessage(`${zoneType} active : ${getRouteDisplayName(desiredRouteId)}`, 1500);
  }
  return true;
}

function updateHud() {
  runtimeHudSystem.updateHud();
}

function compareShopItems(a, b) {
  return (
    Math.max(0, toSafeInt(a?.sortOrder, 0)) - Math.max(0, toSafeInt(b?.sortOrder, 0))
    || String(a?.nameFr || a?.id || "").localeCompare(String(b?.nameFr || b?.id || ""))
  );
}

function getShopItemsByTab(tabId) {
  const tab = String(tabId || SHOP_TAB_POKEBALLS);
  const items = Object.values(SHOP_ITEM_CONFIG_BY_ID).filter((entry) => entry.category === tab);
  if (tab === SHOP_TAB_POKEBALLS) {
    return BALL_TYPE_FALLBACK_ORDER.map((ballType) => items.find((item) => item.ballType === ballType)).filter(Boolean);
  }
  return items.slice().sort(compareShopItems);
}

function normalizeShopQuantityMode(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (raw === SHOP_QUANTITY_MODE_CUSTOM) {
    return SHOP_QUANTITY_MODE_CUSTOM;
  }
  if (raw === SHOP_QUANTITY_MODE_MAX) {
    return SHOP_QUANTITY_MODE_MAX;
  }
  const numeric = Math.max(1, toSafeInt(raw, 1));
  return SHOP_QUANTITY_PRESET_SET.has(String(numeric)) ? String(numeric) : "1";
}

function getShopBallUnitPrice(itemOrPrice) {
  if (itemOrPrice && typeof itemOrPrice === "object") {
    return Math.max(0, toSafeInt(itemOrPrice.price, 0));
  }
  return Math.max(0, toSafeInt(itemOrPrice, 0));
}

function getShopBallRemainingCapacity(itemOrPrice) {
  if (!itemOrPrice || typeof itemOrPrice !== "object") {
    return BALL_INVENTORY_MAX_PER_TYPE;
  }
  const ballType = String(itemOrPrice.ballType || "").toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(BALL_CONFIG_BY_TYPE, ballType)) {
    return BALL_INVENTORY_MAX_PER_TYPE;
  }
  return getBallInventoryRemainingCapacity(ballType);
}

function hasPendingFirstFreePokeballPurchase() {
  return Boolean(state.saveData && !state.saveData.first_free_pokeball_claimed);
}

function isFirstFreePokeballPurchaseEligible(itemOrPrice) {
  if (!hasPendingFirstFreePokeballPurchase() || !itemOrPrice || typeof itemOrPrice !== "object") {
    return false;
  }
  const ballType = String(itemOrPrice.ballType || itemOrPrice.type || "").toLowerCase().trim();
  return ballType === "poke_ball";
}

function getShopBallPurchasePricing(itemOrPrice, quantity) {
  const unitPrice = getShopBallUnitPrice(itemOrPrice);
  const remainingCapacity = getShopBallRemainingCapacity(itemOrPrice);
  const requestedQuantity = Math.min(Math.max(0, toSafeInt(quantity, 0)), remainingCapacity);
  const freeQuantity = isFirstFreePokeballPurchaseEligible(itemOrPrice) ? Math.min(1, requestedQuantity) : 0;
  const paidQuantity = Math.max(0, requestedQuantity - freeQuantity);
  const totalCost = Math.max(0, unitPrice * paidQuantity);
  return {
    unitPrice,
    requestedQuantity,
    freeQuantity,
    paidQuantity,
    totalCost,
  };
}

function consumeFirstFreePokeballPurchaseBonus() {
  if (!state.saveData || !hasPendingFirstFreePokeballPurchase()) {
    return false;
  }
  state.saveData.first_free_pokeball_claimed = true;
  state.saveData.first_free_pokeball_guaranteed_capture_pending = true;
  return true;
}

function consumePendingGuaranteedCaptureBonus() {
  if (!state.saveData || !state.saveData.first_free_pokeball_guaranteed_capture_pending) {
    return false;
  }
  state.saveData.first_free_pokeball_guaranteed_capture_pending = false;
  return true;
}

function getMaxAffordableShopBallQuantity(itemOrPrice) {
  const unitPrice = getShopBallUnitPrice(itemOrPrice);
  const remainingCapacity = getShopBallRemainingCapacity(itemOrPrice);
  if (remainingCapacity <= 0) {
    return 0;
  }
  const currentMoney = Math.max(0, toSafeInt(state.saveData?.money, 0));
  if (unitPrice <= 0) {
    const bonusQuantity = isFirstFreePokeballPurchaseEligible(itemOrPrice) ? 1 : 0;
    return Math.max(0, Math.min(remainingCapacity, bonusQuantity));
  }
  const paidQuantity = currentMoney < unitPrice ? 0 : Math.max(0, Math.floor(currentMoney / unitPrice));
  const bonusQuantity = isFirstFreePokeballPurchaseEligible(itemOrPrice) ? 1 : 0;
  return Math.max(0, Math.min(remainingCapacity, paidQuantity + bonusQuantity));
}

function getSelectedShopBallQuantity(options = {}) {
  const mode = normalizeShopQuantityMode(options.mode ?? state.ui.shopQuantityMode);
  const itemOrPrice = options.item ?? options.unitPrice ?? options.price ?? null;
  let quantity = 0;
  if (mode === SHOP_QUANTITY_MODE_CUSTOM) {
    quantity = Math.max(1, toSafeInt(state.ui.shopCustomQuantity, 1));
  } else if (mode === SHOP_QUANTITY_MODE_MAX) {
    quantity = getMaxAffordableShopBallQuantity(itemOrPrice);
  } else {
    quantity = Math.max(1, toSafeInt(mode, 1));
  }
  const remainingCapacity = getShopBallRemainingCapacity(itemOrPrice);
  return Math.max(0, Math.min(quantity, remainingCapacity));
}

function getSelectedShopBallQuantitySummaryLabel() {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  if (mode === SHOP_QUANTITY_MODE_MAX) {
    return "MAX";
  }
  return `x${getSelectedShopBallQuantity({ mode })}`;
}

function getShopBuyQuantityButtonLabel(item) {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  const remainingCapacity = getShopBallRemainingCapacity(item);
  if (remainingCapacity <= 0) {
    return "Stock max atteint";
  }
  const quantity = getSelectedShopBallQuantity({ item, mode });
  if (mode === SHOP_QUANTITY_MODE_MAX) {
    return quantity > 0 ? `Acheter MAX (${quantity})` : "Acheter MAX";
  }
  return quantity > 0 ? `Acheter x${quantity}` : "Acheter";
}

function setShopQuantityMode(mode) {
  state.ui.shopQuantityMode = normalizeShopQuantityMode(mode);
  if (state.ui.shopQuantityMode === SHOP_QUANTITY_MODE_CUSTOM) {
    state.ui.shopCustomQuantity = clamp(toSafeInt(state.ui.shopCustomQuantity, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
  } else if (state.ui.shopQuantityMode !== SHOP_QUANTITY_MODE_MAX) {
    state.ui.shopCustomQuantity = clamp(toSafeInt(state.ui.shopQuantityMode, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
  }
  syncShopQuantityControls();
  renderShopModal();
}

function syncShopQuantityControls() {
  const mode = normalizeShopQuantityMode(state.ui.shopQuantityMode);
  for (const button of shopQtyPresetButtonEls) {
    const buttonMode = normalizeShopQuantityMode(button.dataset.shopQty || "1");
    button.classList.toggle("is-active", buttonMode === mode);
  }
  if (shopCustomQtyInputEl) {
    shopCustomQtyInputEl.disabled = mode !== SHOP_QUANTITY_MODE_CUSTOM;
    const value = clamp(toSafeInt(state.ui.shopCustomQuantity, 1), 1, BALL_INVENTORY_MAX_PER_TYPE);
    if (toSafeInt(shopCustomQtyInputEl.value, value) !== value) {
      shopCustomQtyInputEl.value = String(value);
    }
  }
}

function setShopTab(tabId) {
  const requested = String(tabId || SHOP_TAB_POKEBALLS).toLowerCase();
  const valid = [SHOP_TAB_POKEBALLS, SHOP_TAB_COMBAT, SHOP_TAB_EVOLUTIONS].includes(requested)
    ? requested
    : SHOP_TAB_POKEBALLS;
  state.ui.shopTab = valid;
  for (const button of shopTabButtonEls) {
    const buttonTab = String(button.dataset.shopTab || "");
    button.classList.toggle("is-active", buttonTab === valid);
  }
  if (shopPokeballQtyPanelEl) {
    shopPokeballQtyPanelEl.classList.toggle("hidden", valid !== SHOP_TAB_POKEBALLS);
  }
  renderShopModal();
}

function formatDurationToClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Math.max(0, Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function useEvolutionStoneFromShop(stoneType) {
  if (!state.saveData) {
    return false;
  }
  const key = String(stoneType || "").toLowerCase().trim();
  const stoneConfig = EVOLUTION_STONE_CONFIG_BY_TYPE[key];
  if (!stoneConfig) {
    return false;
  }

  const candidates = findEvolutionStoneCandidates(key);
  if (candidates.length <= 0) {
    setTopMessage(`${stoneConfig.nameFr}: aucune evolution eligibile pour l'instant.`, 1700);
    return false;
  }

  const chosen = await promptEvolutionStoneChoice(key, candidates);
  if (!chosen) {
    return false;
  }

  if (!consumeShopItemCount(key, 1)) {
    setTopMessage(`Aucune ${stoneConfig.nameFr} en stock.`, 1500);
    updateHud();
    return false;
  }

  const conditionMarked = setEvolutionItemConditionReady(chosen.fromId, chosen.toId);
  if (!conditionMarked) {
    addShopItemCount(key, 1);
    setTopMessage(`${stoneConfig.nameFr}: impossible de l'utiliser sur ce Pokemon.`, 1600);
    updateHud();
    renderShopModal();
    return false;
  }

  enqueueEvolutionReadyNotification({
    fromId: chosen.fromId,
    toId: chosen.toId,
    fromNameFr: chosen.fromNameFr,
    toNameFr: chosen.toNameFr,
  });
  persistSaveData();
  updateHud();
  render();
  setTopMessage(`${stoneConfig.nameFr} utilisee: ${chosen.fromNameFr} est maintenant pret a evoluer.`, 1800);
  return true;
}

function buyShopItem(itemId) {
  if (!state.saveData) {
    return false;
  }
  const item = SHOP_ITEM_CONFIG_BY_ID[String(itemId || "")];
  if (!item) {
    return false;
  }

  if (item.itemType === "ball") {
    if (isBallTypeComingSoon(item.ballType)) {
      setTopMessage(`${item.nameFr}: bientot disponible.`, 1400);
      return false;
    }
    const remainingCapacity = getBallInventoryRemainingCapacity(item.ballType);
    if (remainingCapacity <= 0) {
      setTopMessage(`Stock max atteint pour ${item.nameFr} (${BALL_INVENTORY_MAX_PER_TYPE}).`, 1600);
      updateHud();
      renderShopModal();
      return false;
    }
    const quantity = getSelectedShopBallQuantity({ item });
    const pricing = getShopBallPurchasePricing(item, quantity);
    if (pricing.requestedQuantity <= 0) {
      setTopMessage(`Pas assez d'argent pour acheter ${item.nameFr}.`, 1500);
      updateHud();
      renderShopModal();
      return false;
    }
    if (!spendMoney(pricing.totalCost)) {
      setTopMessage(
        `Pas assez d'argent pour ${pricing.requestedQuantity} ${item.nameFr} (${pricing.totalCost} Poke$).`,
        1500,
      );
      updateHud();
      return false;
    }
    addBallItems(item.ballType, pricing.requestedQuantity);
    const firstPurchaseBonusApplied = pricing.freeQuantity > 0 && consumeFirstFreePokeballPurchaseBonus();
    if (getBallInventoryCount(getActiveBallType()) <= 0) {
      setActiveBallType(item.ballType);
    }
    persistSaveData();
    updateHud();
    renderShopModal();
    if (firstPurchaseBonusApplied) {
      setTopMessage(
        `Achat: ${pricing.requestedQuantity} ${item.nameFr} pour ${pricing.totalCost} Poke$. 1ere PokeBall offerte, prochaine capture garantie.`,
        2200,
      );
    } else {
      setTopMessage(`Achat: ${pricing.requestedQuantity} ${item.nameFr} pour ${pricing.totalCost} Poke$.`, 1500);
    }
    return true;
  }

  if (item.itemType === "boost") {
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    if (!spendMoney(totalCost)) {
      setTopMessage(`Pas assez d'argent pour ${item.nameFr}.`, 1500);
      updateHud();
      return false;
    }
    const remainingMs = activateAttackBoost(getAttackBoostDurationMsFromConfig());
    persistSaveData();
    updateHud();
    renderShopModal();
    setTopMessage(`${item.nameFr} active (${formatDurationToClock(remainingMs)}).`, 1700);
    return true;
  }

  if (item.itemType === "stone") {
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    if (!spendMoney(totalCost)) {
      setTopMessage(`Pas assez d'argent pour ${item.nameFr}.`, 1500);
      updateHud();
      return false;
    }
    addShopItemCount(item.stoneType, 1);
    persistSaveData();
    updateHud();
    renderShopModal();
    setTopMessage(`Achat: ${item.nameFr} ajoutee au stock.`, 1500);
    return true;
  }

  return false;
}

function createShopItemCard(item) {
  const card = document.createElement("article");
  card.className = "shop-item-card";
  card.dataset.shopItemType = String(item.itemType || "generic");

  const media = document.createElement("div");
  media.className = "shop-item-media";
  if (item.spritePath) {
    const image = document.createElement("img");
    image.alt = item.nameFr;
    image.src = item.spritePath;
    media.appendChild(image);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "shop-item-fallback";
    fallback.textContent = item.nameFr.slice(0, 1).toUpperCase();
    media.appendChild(fallback);
  }
  card.appendChild(media);

  const content = document.createElement("div");
  content.className = "shop-item-content";

  const kickerEl = document.createElement("div");
  kickerEl.className = "shop-item-kicker";
  if (item.itemType === "ball") {
    kickerEl.textContent = "Capture";
  } else if (item.itemType === "boost") {
    kickerEl.textContent = "Boost combat";
  } else if (item.itemType === "stone") {
    kickerEl.textContent = "\u00c9volution";
  } else {
    kickerEl.textContent = "Objet";
  }
  content.appendChild(kickerEl);

  const nameEl = document.createElement("div");
  nameEl.className = "shop-item-name";
  nameEl.textContent = item.nameFr;
  content.appendChild(nameEl);

  const priceEl = document.createElement("div");
  priceEl.className = "shop-item-price";
  priceEl.textContent = `${item.price} Poke$`;
  content.appendChild(priceEl);

  const descEl = document.createElement("div");
  descEl.className = "shop-item-desc";
  descEl.textContent = item.description;
  content.appendChild(descEl);
  card.appendChild(content);

  const footer = document.createElement("div");
  footer.className = "shop-item-footer";

  const stockEl = document.createElement("div");
  stockEl.className = "shop-item-stock";

  const actionRow = document.createElement("div");
  actionRow.className = "shop-item-actions";
  const currentMoney = Math.max(0, toSafeInt(state.saveData?.money, 0));
  let canAffordItem = true;
  let isComingSoonItem = false;

  const primaryButton = document.createElement("button");
  primaryButton.type = "button";
  primaryButton.className = "shop-item-buy-btn is-primary";
  primaryButton.textContent = "Acheter";
  primaryButton.addEventListener("click", () => {
    buyShopItem(item.id);
  });
  actionRow.appendChild(primaryButton);

  if (item.itemType === "ball") {
    const stockCount = getBallInventoryCount(item.ballType);
    const isComingSoon = isBallTypeComingSoon(item.ballType);
    const remainingCapacity = getBallInventoryRemainingCapacity(item.ballType);
    const stockMaxReached = remainingCapacity <= 0;
    const quantity = getSelectedShopBallQuantity({ item });
    const pricing = getShopBallPurchasePricing(item, quantity);
    const canAfford = !stockMaxReached && pricing.requestedQuantity > 0 && currentMoney >= pricing.totalCost;
    canAffordItem = canAfford;
    if (isComingSoon) {
      stockEl.textContent = "Bientot disponible";
      primaryButton.textContent = "Bientot disponible";
      primaryButton.disabled = true;
      primaryButton.title = "Cette ball sera ajoutee plus tard.";
      canAffordItem = false;
      isComingSoonItem = true;
    } else {
      stockEl.textContent = `Stock: ${stockCount}/${BALL_INVENTORY_MAX_PER_TYPE}`;
      primaryButton.textContent = getShopBuyQuantityButtonLabel(item);
      if (pricing.freeQuantity > 0) {
        stockEl.textContent += " | 1ere ball offerte";
      }
      if (stockMaxReached) {
        primaryButton.textContent = "Stock max atteint";
        primaryButton.disabled = true;
        primaryButton.title = `Limite atteinte (${BALL_INVENTORY_MAX_PER_TYPE}).`;
        stockEl.textContent += " | Stock max atteint";
      } else {
        primaryButton.disabled = !canAfford;
        if (!canAfford) {
          primaryButton.title = "Pas assez d'argent.";
          const missingMoney = pricing.requestedQuantity > 0
            ? Math.max(0, pricing.totalCost - currentMoney)
            : Math.max(0, toSafeInt(item.price, 0) - currentMoney);
          stockEl.textContent += ` | Manque: ${formatPokeDollarValue(missingMoney)} Poke$`;
        }
      }
    }
  } else if (item.itemType === "boost") {
    const remainingMs = getAttackBoostRemainingMs();
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    const canAfford = currentMoney >= totalCost;
    canAffordItem = canAfford;
    primaryButton.disabled = !canAfford;
    if (!canAfford) {
      primaryButton.title = "Pas assez d'argent.";
    }
    if (remainingMs > 0) {
      stockEl.textContent = `Actif: ${formatDurationToClock(remainingMs)} restantes`;
      primaryButton.textContent = "Prolonger";
    } else {
      stockEl.textContent = "Inactif";
      primaryButton.textContent = "Activer";
    }
    if (!canAfford) {
      const missingMoney = Math.max(0, totalCost - currentMoney);
      stockEl.textContent += ` | Manque: ${formatPokeDollarValue(missingMoney)} Poke$`;
    }
  } else if (item.itemType === "stone") {
    card.classList.add("has-secondary-action");
    const stoneStock = getShopItemCount(item.stoneType);
    const totalCost = Math.max(0, toSafeInt(item.price, 0));
    const canAfford = currentMoney >= totalCost;
    canAffordItem = canAfford;
    stockEl.textContent = `Stock: ${stoneStock}`;
    primaryButton.textContent = "Acheter";
    primaryButton.disabled = !canAfford;
    if (!canAfford) {
      primaryButton.title = "Pas assez d'argent.";
      const missingMoney = Math.max(0, totalCost - currentMoney);
      stockEl.textContent += ` | Manque: ${formatPokeDollarValue(missingMoney)} Poke$`;
    }

    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "shop-item-buy-btn is-secondary";
    useButton.textContent = "Utiliser";
    useButton.disabled = stoneStock <= 0;
    useButton.addEventListener("click", () => {
      void useEvolutionStoneFromShop(item.stoneType);
    });
    actionRow.appendChild(useButton);
  } else {
    stockEl.textContent = "";
  }

  card.classList.toggle("is-coming-soon", isComingSoonItem);
  card.classList.toggle("is-expensive", !isComingSoonItem && !canAffordItem);
  card.classList.toggle("is-affordable", !isComingSoonItem && canAffordItem);
  footer.appendChild(stockEl);
  footer.appendChild(actionRow);
  card.appendChild(footer);
  return card;
}

function renderShopModal() {
  if (!shopGridEl || !state.saveData) {
    return;
  }
  ensureMoneyAndItems();
  const activeTab = String(state.ui.shopTab || SHOP_TAB_POKEBALLS);
  const items = getShopItemsByTab(activeTab);
  refreshShopWalletPanel(activeTab);

  if (shopModalSubtitleEl) {
    if (activeTab === SHOP_TAB_POKEBALLS) {
      shopModalSubtitleEl.textContent = "Achete des balls et configure les regles de capture depuis les compteurs en combat.";
    } else if (activeTab === SHOP_TAB_COMBAT) {
      shopModalSubtitleEl.textContent = "Objets de combat temporaires pour accelerer les attaques.";
    } else {
      shopModalSubtitleEl.textContent =
        "Objets d'evolution: leur usage remplit la condition puis ajoute une notif permanente 'Evoluer'.";
    }
  }

  syncShopQuantityControls();
  for (const button of shopTabButtonEls) {
    const buttonTab = String(button.dataset.shopTab || "");
    button.classList.toggle("is-active", buttonTab === activeTab);
  }
  if (shopPokeballQtyPanelEl) {
    shopPokeballQtyPanelEl.classList.toggle("hidden", activeTab !== SHOP_TAB_POKEBALLS);
  }

  shopGridEl.innerHTML = "";
  if (items.length <= 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "shop-empty";
    emptyEl.textContent = "Aucun objet dans cet onglet.";
    shopGridEl.appendChild(emptyEl);
    return;
  }

  for (const item of items) {
    shopGridEl.appendChild(createShopItemCard(item));
  }
}

function setShopOpen(open) {
  if (open && isTrainerBattleActive()) {
    return;
  }
  if (open && state.ui.dialogueOpen) {
    return;
  }
  if (open && state.ui.tutorialOpen) {
    return;
  }
  state.ui.shopOpen = Boolean(open);
  if (!shopModalEl) {
    return;
  }
  if (state.ui.shopOpen) {
    setMapOpen(false);
    closeGachaModal({ force: true });
    closeTeamContextMenu();
    clearCanvasHoverState();
    closeRenameModal();
    closeTrainerBattleSetupModal();
    closeBoxesModal();
    closePokedexModal();
    closeAppearanceModal();
    closeEvolutionItemChoiceModal(null);
    showModalWithTween(shopModalEl);
    if (!state.ui.shopTab) {
      state.ui.shopTab = SHOP_TAB_POKEBALLS;
    }
    setShopTab(state.ui.shopTab);
  } else {
    closeEvolutionItemChoiceModal(null);
    hideModalWithTween(shopModalEl);
  }
}

function toggleShopPanel() {
  setShopOpen(!state.ui.shopOpen);
}

function handleMapMarkerClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const routeId = String(event?.currentTarget?.dataset?.routeId || "");
  if (!routeId) {
    return;
  }
  const routeState = buildRouteDisplayState(routeId);
  if (!routeState) {
    return;
  }
  if (!routeState.unlocked) {
    openRouteNavigationInfo(routeId);
    return;
  }
  applyRouteChange(routeId, { announce: true });
  setMapOpen(false);
}

function renderMapModal() {
  if (!mapMarkersEl || !state.routeCatalog?.size || !state.saveData) {
    return;
  }
  applyMapReferenceImage();
  syncMapMarkerLayerBounds();
  const currentRouteId = state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID;
  const selectedInfoRouteId = String(state.ui.routeNavInfoRouteId || "").trim();
  mapNavigationUi.renderMapModal({
    routeIds: getOrderedCatalogRouteIds(),
    currentRouteId,
    selectedInfoRouteId,
    shouldRenderRouteOnCurrentMap,
    getRouteMapMarker,
    getRouteZoneType,
    buildRouteDisplayState,
    getConnectedRouteDisplayStates,
    createRouteNavigationEmptyState,
    buildRouteDestinationCard,
    renderRouteInfoPanelInto,
    handleMapMarkerClick,
    mapMarkersEl,
    mapConnectionsListEl,
    mapConnectionsInfoPanelEl,
    mapMarkerButtonsByRouteId,
  });
  window.requestAnimationFrame(() => {
    if (!state.ui.mapOpen) {
      return;
    }
    syncMapMarkerLayerBounds();
  });
}

function setMapOpen(open) {
  if (open && isTrainerBattleActive()) {
    return;
  }
  if (open && state.ui.dialogueOpen) {
    return;
  }
  if (open && state.ui.tutorialOpen) {
    return;
  }
  state.ui.mapOpen = Boolean(open);
  if (state.ui.mapOpen) {
    state.ui.routeNavDrawerOpen = false;
  }
  if (!state.ui.mapOpen) {
    state.ui.routeNavInfoRouteId = null;
  }
  if (!mapModalEl) {
    return;
  }
  if (state.ui.mapOpen) {
    closeTeamContextMenu();
    closeGachaModal({ force: true });
    clearCanvasHoverState();
    closeRenameModal();
    closeTrainerBattleSetupModal();
    closeBoxesModal();
    closePokedexModal();
    closeAppearanceModal();
    closeEvolutionItemChoiceModal(null);
    setShopOpen(false);
    applyMapReferenceImage();
    showModalWithTween(mapModalEl);
    syncMapMarkerLayerBounds();
    renderMapModal();
    window.requestAnimationFrame(() => {
      if (!state.ui.mapOpen) {
        return;
      }
      syncMapMarkerLayerBounds();
      renderMapModal();
    });
  } else {
    hideModalWithTween(mapModalEl);
    refreshRouteUi();
  }
}

function clearGachaSuspenseTimers() {
  if (!Array.isArray(state.gacha?.suspenseTimerIds) || state.gacha.suspenseTimerIds.length <= 0) {
    state.gacha.suspenseTimerIds = [];
    return;
  }
  for (const timerId of state.gacha.suspenseTimerIds) {
    window.clearTimeout(timerId);
  }
  state.gacha.suspenseTimerIds = [];
}

function setGachaStatusText(text) {
  if (!gachaStatusEl) {
    return;
  }
  gachaStatusEl.textContent = normalizeUiDisplayText(text || "", { frenchTypography: true });
}

function waitForGachaDelay(durationMs) {
  const safeDurationMs = Math.max(0, Math.round(Number(durationMs) || 0));
  return new Promise((resolve) => window.setTimeout(resolve, safeDurationMs));
}

function setGachaResultFocusActive(active) {
  if (!gachaCardEl) {
    return;
  }
  gachaCardEl.classList.toggle("show-result-focus", active === true);
}

function clearGachaBatchRevealPanel() {
  if (!gachaBatchRevealEl) {
    return;
  }
  gachaBatchRevealEl.classList.remove("is-sequence-active");
  gachaBatchRevealEl.classList.add("hidden");
  gachaBatchRevealEl.innerHTML = "";
}

function clearGachaBatchSpotlightPanel() {
  if (!gachaBatchSpotlightEl) {
    return;
  }
  gachaBatchSpotlightEl.classList.add("hidden");
  gachaBatchSpotlightEl.classList.remove("is-active");
  gachaBatchSpotlightEl.innerHTML = "";
}

function applyGachaSpriteTightFit(imageEl, options = {}) {
  if (!(imageEl instanceof HTMLImageElement)) {
    return;
  }
  const maxBoost = Math.max(1, Number(options?.maxBoost) || 3.4);
  const minBoost = Math.max(1, Number(options?.minBoost) || 1);
  const applyScale = () => {
    if (!isDrawableImage(imageEl)) {
      imageEl.style.removeProperty("--gacha-tight-fit-scale");
      return;
    }
    const dims = getDrawableImageDimensions(imageEl);
    const bounds = getOpaqueBoundsForDrawableImage(imageEl);
    const fullWidth = Math.max(1, Number(dims.width) || 1);
    const fullHeight = Math.max(1, Number(dims.height) || 1);
    const opaqueWidth = Math.max(1, Number(bounds?.opaqueWidth) || fullWidth);
    const opaqueHeight = Math.max(1, Number(bounds?.opaqueHeight) || fullHeight);
    const widthBoost = fullWidth / opaqueWidth;
    const heightBoost = fullHeight / opaqueHeight;
    const rawBoost = Math.min(widthBoost, heightBoost);
    const boost = clamp(rawBoost, minBoost, maxBoost);
    imageEl.style.setProperty("--gacha-tight-fit-scale", boost.toFixed(3));
  };

  imageEl.addEventListener("load", applyScale, { once: true });
  if (imageEl.complete) {
    applyScale();
  }
}

function buildGachaRewardCardElement(reward, options = {}) {
  const card = document.createElement("div");
  card.className = options?.cardClassName || "gacha-result-reward-card";
  if (options?.pending) {
    card.classList.add("is-pending");
  }
  const index = Math.max(0, toSafeInt(options?.index, 0));

  const media = document.createElement("div");
  media.className = "gacha-result-reward-media";
  if (reward?.spritePath) {
    const image = document.createElement("img");
    image.src = reward.spritePath;
    image.alt = `${reward?.pokemonNameFr || "Skin"} ${reward?.variantLabel || ""}`.trim();
    applyGachaSpriteTightFit(image, { maxBoost: 3.25 });
    if (options?.pending) {
      image.classList.add("is-silhouette");
    }
    media.appendChild(image);
  } else {
    const fallback = document.createElement("span");
    fallback.textContent = "?";
    media.appendChild(fallback);
  }
  card.appendChild(media);

  const text = document.createElement("div");
  text.className = "gacha-result-reward-text";

  const rank = document.createElement("div");
  rank.className = "gacha-result-reward-rank";
  rank.textContent = `#${index + 1}`;
  text.appendChild(rank);

  const name = document.createElement("div");
  name.className = "gacha-result-reward-name";
  name.textContent = options?.pending ? "???" : String(reward?.pokemonNameFr || "Inconnu");
  text.appendChild(name);

  const skin = document.createElement("div");
  skin.className = "gacha-result-reward-skin";
  skin.textContent = options?.pending ? "Skin mystere" : String(reward?.variantLabel || "Skin");
  text.appendChild(skin);

  card.appendChild(text);
  return card;
}

function renderGachaBatchRevealSlots(totalCount) {
  if (!gachaBatchRevealEl) {
    return;
  }
  gachaBatchRevealEl.innerHTML = "";
  gachaBatchRevealEl.classList.add("is-sequence-active");
  const safeCount = Math.max(0, toSafeInt(totalCount, 0));
  if (safeCount <= 0) {
    gachaBatchRevealEl.classList.remove("is-sequence-active");
    gachaBatchRevealEl.classList.add("hidden");
    return;
  }
  gachaBatchRevealEl.classList.remove("hidden");
  for (let index = 0; index < safeCount; index += 1) {
    const slot = buildGachaRewardCardElement(null, {
      index,
      pending: true,
      cardClassName: "gacha-batch-reveal-card",
    });
    slot.dataset.slotIndex = String(index);
    gachaBatchRevealEl.appendChild(slot);
  }
}

function revealGachaBatchSlot(index, reward) {
  if (!gachaBatchRevealEl) {
    return null;
  }
  const slot = gachaBatchRevealEl.querySelector(`[data-slot-index="${index}"]`);
  if (!(slot instanceof HTMLElement)) {
    return null;
  }
  const revealedCard = buildGachaRewardCardElement(reward, {
    index,
    pending: false,
    cardClassName: "gacha-batch-reveal-card is-revealed",
  });
  revealedCard.dataset.slotIndex = String(index);
  slot.replaceWith(revealedCard);
  return revealedCard;
}

function triggerGachaBatchSlotRevealJuice(slot) {
  if (!(slot instanceof HTMLElement)) {
    return;
  }
  slot.classList.remove("is-juicy-reveal");
  void slot.offsetWidth;
  slot.classList.add("is-juicy-reveal");

  for (const existing of Array.from(slot.querySelectorAll(".gacha-slot-spark-layer"))) {
    existing.remove();
  }
  const sparkLayer = document.createElement("div");
  sparkLayer.className = "gacha-slot-spark-layer";
  const impactWave = document.createElement("span");
  impactWave.className = "gacha-slot-impact-wave";
  sparkLayer.appendChild(impactWave);
  const sparkCount = 7;
  for (let i = 0; i < sparkCount; i += 1) {
    const spark = document.createElement("span");
    spark.className = "gacha-slot-spark";
    spark.style.setProperty("--spark-angle", `${(360 / sparkCount) * i + randomRange(-11, 11)}deg`);
    spark.style.setProperty("--spark-distance", `${randomRange(17, 30)}px`);
    spark.style.setProperty("--spark-delay", `${randomRange(0, 90)}ms`);
    sparkLayer.appendChild(spark);
  }
  slot.appendChild(sparkLayer);

  window.setTimeout(() => {
    slot.classList.remove("is-juicy-reveal");
    sparkLayer.remove();
  }, GACHA_BATCH_SLOT_JUICE_MS);
}

function createGachaBatchTransferOrb(reward) {
  const orb = document.createElement("div");
  orb.className = "gacha-batch-transfer-orb";
  if (reward?.spritePath) {
    const image = document.createElement("img");
    image.src = reward.spritePath;
    image.alt = `${reward?.pokemonNameFr || "Skin"} ${reward?.variantLabel || ""}`.trim();
    applyGachaSpriteTightFit(image, { maxBoost: 2.8 });
    orb.appendChild(image);
  } else {
    const fallback = document.createElement("span");
    fallback.textContent = "?";
    orb.appendChild(fallback);
  }
  return orb;
}

function createGachaBatchSpotlightCard(reward, index, totalCount) {
  const card = document.createElement("div");
  card.className = "gacha-batch-spotlight-card";
  card.innerHTML = "";

  const rank = document.createElement("div");
  rank.className = "gacha-batch-spotlight-rank";
  rank.textContent = `${index + 1}/${Math.max(1, totalCount)}`;
  card.appendChild(rank);

  const media = document.createElement("div");
  media.className = "gacha-batch-spotlight-media";
  if (reward?.spritePath) {
    const image = document.createElement("img");
    image.src = reward.spritePath;
    image.alt = `${reward?.pokemonNameFr || "Skin"} ${reward?.variantLabel || ""}`.trim();
    applyGachaSpriteTightFit(image, { maxBoost: 3.8 });
    media.appendChild(image);
  } else {
    const fallback = document.createElement("span");
    fallback.textContent = "?";
    media.appendChild(fallback);
  }
  card.appendChild(media);

  const name = document.createElement("div");
  name.className = "gacha-batch-spotlight-name";
  name.textContent = String(reward?.pokemonNameFr || "Inconnu");
  card.appendChild(name);

  const skin = document.createElement("div");
  skin.className = "gacha-batch-spotlight-skin";
  skin.textContent = String(reward?.variantLabel || "Skin");
  card.appendChild(skin);

  return card;
}

async function animateGachaBatchSpotlightIntoSlot(index, reward, totalCount) {
  if (!gachaBatchRevealEl || !gachaBatchSpotlightEl) {
    const revealed = revealGachaBatchSlot(index, reward);
    triggerGachaBatchSlotRevealJuice(revealed);
    await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS);
    return;
  }

  const slot = gachaBatchRevealEl.querySelector(`[data-slot-index="${index}"]`);
  if (!(slot instanceof HTMLElement)) {
    const revealed = revealGachaBatchSlot(index, reward);
    triggerGachaBatchSlotRevealJuice(revealed);
    await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS);
    return;
  }
  const slotMedia = slot.querySelector(".gacha-result-reward-media");
  const slotTarget = slotMedia instanceof HTMLElement ? slotMedia : slot;

  gachaBatchSpotlightEl.classList.remove("hidden");
  gachaBatchSpotlightEl.classList.add("is-active");
  gachaBatchSpotlightEl.innerHTML = "";

  const spotlightCard = createGachaBatchSpotlightCard(reward, index, totalCount);
  gachaBatchSpotlightEl.appendChild(spotlightCard);

  await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  spotlightCard.classList.add("is-entered");
  await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_POP_MS);

  const spotlightMedia = spotlightCard.querySelector(".gacha-batch-spotlight-media");
  const sourceRect = spotlightMedia instanceof HTMLElement
    ? spotlightMedia.getBoundingClientRect()
    : spotlightCard.getBoundingClientRect();
  const targetRect = slotTarget.getBoundingClientRect();
  const canTransfer =
    Number.isFinite(sourceRect?.width)
    && Number.isFinite(sourceRect?.height)
    && sourceRect.width > 0
    && sourceRect.height > 0
    && Number.isFinite(targetRect?.width)
    && Number.isFinite(targetRect?.height)
    && targetRect.width > 0
    && targetRect.height > 0;

  if (!canTransfer) {
    clearGachaBatchSpotlightPanel();
    const revealed = revealGachaBatchSlot(index, reward);
    triggerGachaBatchSlotRevealJuice(revealed);
    await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS);
    return;
  }

  const orb = createGachaBatchTransferOrb(reward);
  if (!(orb instanceof HTMLElement)) {
    clearGachaBatchSpotlightPanel();
    const revealed = revealGachaBatchSlot(index, reward);
    triggerGachaBatchSlotRevealJuice(revealed);
    await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS);
    return;
  }
  const sourceCenterX = sourceRect.left + sourceRect.width * 0.5;
  const sourceCenterY = sourceRect.top + sourceRect.height * 0.5;
  const targetCenterX = targetRect.left + targetRect.width * 0.5;
  const targetCenterY = targetRect.top + targetRect.height * 0.5;
  orb.style.left = `${sourceCenterX}px`;
  orb.style.top = `${sourceCenterY}px`;
  orb.style.setProperty("--tx", `${targetCenterX - sourceCenterX}px`);
  orb.style.setProperty("--ty", `${targetCenterY - sourceCenterY}px`);
  document.body.appendChild(orb);

  slot.classList.add("is-incoming");
  spotlightCard.classList.remove("is-entered");
  spotlightCard.classList.add("is-exiting");
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  orb.classList.add("is-flying");

  await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_TRANSFER_MS);
  slot.classList.remove("is-incoming");
  clearGachaBatchSpotlightPanel();
  orb.remove();

  const revealed = revealGachaBatchSlot(index, reward);
  triggerGachaBatchSlotRevealJuice(revealed);
  await waitForGachaDelay(GACHA_BATCH_SPOTLIGHT_STEP_GAP_MS);
}

async function runGachaBatchRevealAnimation(rewards) {
  const safeRewards = normalizeGachaRewardList(rewards);
  clearGachaBatchSpotlightPanel();
  renderGachaBatchRevealSlots(safeRewards.length);
  if (safeRewards.length <= 0) {
    return [];
  }

  const unlockedRewards = [];
  for (let index = 0; index < safeRewards.length; index += 1) {
    setGachaStatusText(`Ouverture capsule ${index + 1}/${safeRewards.length}...`);
    const unlockedReward = await unlockGachaRewardSkin(safeRewards[index]);
    const rewardToDisplay = unlockedReward || safeRewards[index];
    if (unlockedReward) {
      unlockedRewards.push(unlockedReward);
    }
    await animateGachaBatchSpotlightIntoSlot(index, rewardToDisplay, safeRewards.length);
  }
  clearGachaBatchSpotlightPanel();
  return unlockedRewards;
}

function clearGachaResultPanel() {
  state.gacha.lastReward = null;
  state.gacha.lastRewards = [];
  state.gacha.lastSpinCount = 0;
  setGachaResultFocusActive(false);
  clearGachaBatchRevealPanel();
  clearGachaBatchSpotlightPanel();
  if (gachaResultEl) {
    gachaResultEl.classList.add("hidden");
  }
  if (gachaResultKickerEl) {
    gachaResultKickerEl.textContent = "Nouveau skin debloque";
  }
  if (gachaResultNameEl) {
    gachaResultNameEl.textContent = "-";
  }
  if (gachaResultSkinEl) {
    gachaResultSkinEl.textContent = "-";
  }
  if (gachaResultPreviewEl) {
    gachaResultPreviewEl.classList.remove("hidden");
    gachaResultPreviewEl.innerHTML = "";
  }
  if (gachaResultListEl) {
    gachaResultListEl.classList.add("hidden");
    gachaResultListEl.innerHTML = "";
  }
}

function normalizeGachaRewardList(rewardOrRewards) {
  if (Array.isArray(rewardOrRewards)) {
    return rewardOrRewards.filter(Boolean);
  }
  return rewardOrRewards ? [rewardOrRewards] : [];
}

function renderGachaResultPanel(rewardOrRewards, options = {}) {
  if (!gachaResultEl || !gachaResultNameEl || !gachaResultSkinEl || !gachaResultPreviewEl) {
    return;
  }
  const rewards = normalizeGachaRewardList(rewardOrRewards);
  if (rewards.length <= 0) {
    return;
  }
  const requestedSpinCount = Math.max(1, toSafeInt(options?.spinCount, rewards.length));
  const isBatch = requestedSpinCount > 1 || rewards.length > 1;
  const highlightReward = rewards[rewards.length - 1] || rewards[0];
  if (!highlightReward) {
    return;
  }

  setGachaResultFocusActive(true);
  gachaResultEl.classList.remove("hidden");
  if (gachaResultKickerEl) {
    gachaResultKickerEl.textContent = isBatch ? `${rewards.length} skins debloques` : "Nouveau skin debloque";
  }
  if (isBatch) {
    gachaResultNameEl.textContent = `Resultat x${requestedSpinCount}`;
    gachaResultSkinEl.textContent = `Dernier skin: ${highlightReward.pokemonNameFr} | ${highlightReward.variantLabel}`;
  } else {
    gachaResultNameEl.textContent = highlightReward.pokemonNameFr;
    gachaResultSkinEl.textContent = `Skin: ${highlightReward.variantLabel}`;
  }
  gachaResultPreviewEl.innerHTML = "";
  gachaResultPreviewEl.classList.toggle("hidden", isBatch);
  if (!isBatch && highlightReward.spritePath) {
    const image = document.createElement("img");
    image.src = highlightReward.spritePath;
    image.alt = `${highlightReward.pokemonNameFr} ${highlightReward.variantLabel}`;
    applyGachaSpriteTightFit(image, { maxBoost: 3.1 });
    gachaResultPreviewEl.appendChild(image);
  }
  if (gachaResultListEl) {
    gachaResultListEl.innerHTML = "";
    if (isBatch) {
      for (let index = 0; index < rewards.length; index += 1) {
        const entry = rewards[index];
        const card = buildGachaRewardCardElement(entry, {
          index,
          pending: false,
        });
        gachaResultListEl.appendChild(card);
      }
      gachaResultListEl.classList.remove("hidden");
    } else {
      gachaResultListEl.classList.add("hidden");
    }
  }
}

function getUnlockedVariantIdSetForGacha(def, record) {
  const variants = getSpriteVariantsForDef(def);
  const validIds = new Set(variants.map((variant) => variant.id));
  const unlockedIds = new Set();
  const defaultVariantId = getDefaultSpriteVariantId(def);
  if (defaultVariantId && validIds.has(defaultVariantId)) {
    unlockedIds.add(defaultVariantId);
  }
  if (!record) {
    return unlockedIds;
  }
  for (const variantId of normalizeSpriteVariantIdList(record.appearance_owned_variants)) {
    if (validIds.has(variantId)) {
      unlockedIds.add(variantId);
    }
  }
  return unlockedIds;
}

function getExtendedSpeciesLoadTargetsForRange(maxPokemonId = POKEDEX_BASE_MAX_POKEMON_ID) {
  const targets = [];
  const maxId = clamp(toSafeInt(maxPokemonId, POKEDEX_BASE_MAX_POKEMON_ID), 1, POKEDEX_EXTENDED_MAX_POKEMON_ID);
  if (!(state.pokedexSpeciesCsvByPokemonId instanceof Map) || state.pokedexSpeciesCsvByPokemonId.size <= 0) {
    return targets;
  }
  for (const [rawPokemonId, rawSpecies] of state.pokedexSpeciesCsvByPokemonId.entries()) {
    const pokemonId = Number(rawPokemonId || rawSpecies?.id || 0);
    if (pokemonId <= 0 || pokemonId > maxId || state.pokemonDefsById.has(pokemonId)) {
      continue;
    }
    const nameEn = normalizePokedexSpeciesNameEn(rawSpecies?.nameEn || "");
    if (!nameEn) {
      continue;
    }
    targets.push({
      id: pokemonId,
      nameEn,
    });
  }
  targets.sort((a, b) => a.id - b.id);
  return targets;
}

async function warmupDefinitionsForCurrentExtendedRange() {
  const maxPokemonId = getCurrentPokedexMaxPokemonId();
  if (maxPokemonId <= POKEDEX_BASE_MAX_POKEMON_ID) {
    return;
  }
  if (pendingExtendedPokedexAndGachaWarmup) {
    return pendingExtendedPokedexAndGachaWarmup;
  }

  const task = (async () => {
    const pendingTargets = getExtendedSpeciesLoadTargetsForRange(maxPokemonId);
    if (pendingTargets.length <= 0) {
      return;
    }
    const defsById = new Map(state.pokemonDefsById);
    const BATCH_SIZE = 20;
    for (let offset = 0; offset < pendingTargets.length; offset += BATCH_SIZE) {
      const batch = pendingTargets.slice(offset, offset + BATCH_SIZE);
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
      }
    }
    applyPokemonTalentCsvToDefinitions(defsById);
    state.pokemonDefsById = defsById;
    invalidatePokedexEntriesCache({ resetSlice: true });
    if (state.ui.pokedexOpen) {
      queuePokedexGridRender();
    }
    if (state.ui.gachaOpen) {
      renderGachaModal();
    }
  })()
    .catch((error) => {
      console.warn(
        "Impossible de précharger les définitions Pokédex/Gacha étendu:",
        error instanceof Error ? error.message : String(error || ""),
      );
    })
    .finally(() => {
      pendingExtendedPokedexAndGachaWarmup = null;
    });

  pendingExtendedPokedexAndGachaWarmup = task;
  return task;
}

function getGachaSkinCandidates() {
  const candidates = [];
  if (!state.pokemonDefsById?.size) {
    return candidates;
  }
  const maxPokemonId = getCurrentGachaMaxPokemonId();
  const speciesEntries = Array.from(state.pokemonDefsById.entries())
    .map(([id, def]) => ({ id: Number(id || 0), def }))
    .filter((entry) => entry.id > 0 && entry.id <= maxPokemonId)
    .sort((a, b) => a.id - b.id);

  for (const { id, def } of speciesEntries) {
    const variants = getSpriteVariantsForDef(def);
    if (variants.length <= 0) {
      continue;
    }
    const record = getPokemonEntityRecord(id);
    const unlockedIds = getUnlockedVariantIdSetForGacha(def, record);
    for (const variant of variants) {
      if (unlockedIds.has(variant.id)) {
        continue;
      }
      candidates.push({
        pokemonId: id,
        pokemonNameFr: String(def?.nameFr || def?.nameEn || `Pokemon #${id}`),
        variantId: variant.id,
        variantLabel: getSpriteVariantDisplayLabel(variant),
        spritePath: String(variant.frontPath || def?.spritePath || ""),
      });
    }
  }
  return candidates;
}

function pickRandomGachaSkinCandidate(candidates) {
  if (!Array.isArray(candidates) || candidates.length <= 0) {
    return null;
  }
  const index = randomInt(0, candidates.length - 1);
  return candidates[index] || null;
}

function renderGachaReelItems(items, rewardIndex = -1) {
  if (!gachaReelTrackEl) {
    return;
  }
  gachaReelTrackEl.innerHTML = "";
  const safeItems = Array.isArray(items) ? items : [];
  for (let i = 0; i < safeItems.length; i += 1) {
    const entry = safeItems[i];
    const item = document.createElement("div");
    item.className = "gacha-reel-item";
    if (i === rewardIndex) {
      item.classList.add("is-reward");
    }

    const media = document.createElement("div");
    media.className = "gacha-reel-item-media";
    if (entry?.spritePath) {
      const image = document.createElement("img");
      image.src = entry.spritePath;
      image.alt = "Silhouette mystere";
      image.classList.add("is-silhouette");
      media.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = "?";
      media.appendChild(fallback);
    }
    item.appendChild(media);

    const name = document.createElement("div");
    name.className = "gacha-reel-item-name";
    name.textContent = "???";
    item.appendChild(name);

    const skin = document.createElement("div");
    skin.className = "gacha-reel-item-skin";
    skin.textContent = "Skin mystere";
    item.appendChild(skin);

    gachaReelTrackEl.appendChild(item);
  }
}

function getGachaRewardTargetOffsetPx(rewardIndex) {
  if (!gachaReelTrackEl || !gachaReelWindowEl || rewardIndex < 0) {
    return 0;
  }
  const rewardElement = gachaReelTrackEl.children[rewardIndex];
  if (!(rewardElement instanceof HTMLElement)) {
    return 0;
  }
  let contentWidth = gachaReelWindowEl.clientWidth;
  if (typeof window.getComputedStyle === "function") {
    const reelWindowStyles = window.getComputedStyle(gachaReelWindowEl);
    const paddingLeft = Math.max(0, parseFloat(reelWindowStyles.paddingLeft || "0") || 0);
    const paddingRight = Math.max(0, parseFloat(reelWindowStyles.paddingRight || "0") || 0);
    contentWidth = Math.max(0, gachaReelWindowEl.clientWidth - paddingLeft - paddingRight);
  }
  const rewardCenter = rewardElement.offsetLeft + rewardElement.offsetWidth * 0.5;
  const windowCenter = contentWidth * 0.5;
  return Math.max(0, rewardCenter - windowCenter);
}

function populateGachaPreviewReel(candidates, options = {}) {
  if (!gachaReelTrackEl || state.gacha.spinning || (Array.isArray(state.gacha.lastRewards) && state.gacha.lastRewards.length > 0)) {
    return;
  }
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const previewCount = Math.min(10, Math.max(0, safeCandidates.length));
  const forceRefresh = options?.forceRefresh === true;
  const shouldPopulatePreview = previewCount > 0
    && (
      forceRefresh
      || state.gacha.reelItems.length !== previewCount
      || state.gacha.reelRewardIndex >= 0
      || gachaReelTrackEl.childElementCount <= 0
    );
  if (shouldPopulatePreview) {
    const previewItems = [];
    for (let i = 0; i < previewCount; i += 1) {
      previewItems.push(safeCandidates[randomInt(0, safeCandidates.length - 1)]);
    }
    state.gacha.reelItems = previewItems.slice();
    state.gacha.reelRewardIndex = -1;
    state.gacha.reelOffsetPx = 0;
    renderGachaReelItems(previewItems, -1);
  } else if (previewCount <= 0 && (state.gacha.reelItems.length > 0 || gachaReelTrackEl.childElementCount > 0)) {
    state.gacha.reelItems = [];
    state.gacha.reelRewardIndex = -1;
    state.gacha.reelOffsetPx = 0;
    gachaReelTrackEl.innerHTML = "";
  }
  gachaReelTrackEl.style.transition = "none";
  gachaReelTrackEl.style.transform = "translate3d(0px, 0px, 0px)";
}

function resetGachaUiState() {
  clearGachaSuspenseTimers();
  clearGachaBatchRevealPanel();
  clearGachaBatchSpotlightPanel();
  state.gacha.spinning = false;
  state.gacha.reelItems = [];
  state.gacha.reelRewardIndex = -1;
  state.gacha.reelOffsetPx = 0;
  if (gachaMachineEl) {
    gachaMachineEl.classList.remove("is-spinning");
    gachaMachineEl.classList.remove("is-spinning-10");
  }
  if (gachaSpinButtonEl) {
    gachaSpinButtonEl.disabled = false;
  }
  if (gachaSpin10ButtonEl) {
    gachaSpin10ButtonEl.disabled = false;
  }
  if (gachaReelTrackEl) {
    gachaReelTrackEl.style.transition = "none";
    gachaReelTrackEl.style.transform = "translate3d(0px, 0px, 0px)";
    gachaReelTrackEl.innerHTML = "";
  }
}

function closeGachaModal(options = {}) {
  const force = options?.force === true;
  if (state.gacha.spinning && !force) {
    setTopMessage("Tirage en cours. Attends la fin du reel.", 1300);
    return false;
  }
  state.ui.gachaOpen = false;
  if (gachaModalEl) {
    hideModalWithTween(gachaModalEl);
  }
  resetGachaUiState();
  clearGachaResultPanel();
  setGachaStatusText("Pret a tenter ta chance.");
  return true;
}

function renderGachaModal() {
  if (!state.ui.gachaOpen || !gachaModalEl) {
    return;
  }
  const candidates = getGachaSkinCandidates();
  const candidateCount = candidates.length;
  const gachaRangeLabel = getCurrentGachaPokemonRangeLabel();
  const coins = Math.max(0, toSafeInt(state.saveData?.coins, 0));
  const canPaySingle = coins >= GACHA_SPIN_COST_COINS;
  const canPayBatch = coins >= GACHA_BATCH_SPIN_COST_COINS;
  const canSpinSingle = candidateCount > 0 && canPaySingle && !state.gacha.spinning;
  const canSpinBatch = candidateCount >= GACHA_BATCH_SPIN_COUNT && canPayBatch && !state.gacha.spinning;

  if (gachaWalletCoinsEl) {
    gachaWalletCoinsEl.textContent = formatPokeDollarValue(coins);
  }
  if (gachaWalletCostEl) {
    gachaWalletCostEl.textContent = `x1: ${GACHA_SPIN_COST_COINS} | x${GACHA_BATCH_SPIN_COUNT}: ${GACHA_BATCH_SPIN_COST_COINS}`;
  }
  if (gachaWalletRemainingEl) {
    gachaWalletRemainingEl.textContent = formatPokeDollarValue(candidateCount);
  }
  if (gachaSubtitleEl) {
    gachaSubtitleEl.textContent = "Capsules en silhouettes noires. Le skin obtenu est revele uniquement a la fin du tirage.";
  }
  populateGachaPreviewReel(candidates);
  if (gachaSpinButtonEl) {
    gachaSpinButtonEl.disabled = !canSpinSingle;
    if (state.gacha.spinning) {
      gachaSpinButtonEl.textContent = "Tirage en cours...";
    } else if (!canPaySingle) {
      gachaSpinButtonEl.textContent = `${GACHA_SPIN_COST_COINS} Coins requis`;
    } else if (candidateCount <= 0) {
      gachaSpinButtonEl.textContent = `Tous les skins Kanto ${gachaRangeLabel} sont debloques`;
    } else {
      gachaSpinButtonEl.textContent = `Obtenir 1 skin aleatoire (${GACHA_SPIN_COST_COINS} Coins)`;
    }
  }
  if (gachaSpin10ButtonEl) {
    gachaSpin10ButtonEl.disabled = !canSpinBatch;
    if (state.gacha.spinning) {
      gachaSpin10ButtonEl.textContent = `Tirage x${GACHA_BATCH_SPIN_COUNT} en cours...`;
    } else if (candidateCount < GACHA_BATCH_SPIN_COUNT) {
      gachaSpin10ButtonEl.textContent = `${GACHA_BATCH_SPIN_COUNT} skins restants requis`;
    } else if (!canPayBatch) {
      gachaSpin10ButtonEl.textContent = `${GACHA_BATCH_SPIN_COST_COINS} Coins requis`;
    } else {
      gachaSpin10ButtonEl.textContent = `Obtenir ${GACHA_BATCH_SPIN_COUNT} skins (${GACHA_BATCH_SPIN_COST_COINS} Coins)`;
    }
  }
  if (!state.gacha.spinning && (!Array.isArray(state.gacha.lastRewards) || state.gacha.lastRewards.length <= 0)) {
    setGachaStatusText(candidateCount > 0 ? "Pret a tenter ta chance." : `Aucun skin restant sur Kanto ${gachaRangeLabel}.`);
  }
  const hasResultRewards = Array.isArray(state.gacha.lastRewards) && state.gacha.lastRewards.length > 0;
  setGachaResultFocusActive(hasResultRewards && !state.gacha.spinning);
  if (Array.isArray(state.gacha.lastRewards) && state.gacha.lastRewards.length > 0) {
    renderGachaResultPanel(state.gacha.lastRewards, {
      spinCount: Math.max(1, toSafeInt(state.gacha.lastSpinCount, state.gacha.lastRewards.length)),
    });
  } else if (!state.gacha.spinning && gachaResultEl) {
    gachaResultEl.classList.add("hidden");
  }
}

function setGachaOpen(open) {
  if (open && isTrainerBattleActive()) {
    return;
  }
  if (open && state.ui.dialogueOpen) {
    return;
  }
  if (open && state.ui.tutorialOpen) {
    return;
  }
  if (!gachaModalEl) {
    state.ui.gachaOpen = false;
    return;
  }
  if (open) {
    closeTeamContextMenu();
    closeBallCaptureMenu();
    clearCanvasHoverState();
    closeRenameModal();
    closeTrainerBattleSetupModal();
    closeBoxesModal();
    closePokedexModal();
    closeAppearanceModal();
    closeEvolutionItemChoiceModal(null);
    setMapOpen(false);
    setShopOpen(false);
    state.ui.gachaOpen = true;
    showModalWithTween(gachaModalEl);
    void warmupDefinitionsForCurrentExtendedRange();
    populateGachaPreviewReel(getGachaSkinCandidates(), { forceRefresh: true });
    renderGachaModal();
    return;
  }
  closeGachaModal({ force: true });
}

function getOrCreatePokemonEntityRecordForGacha(pokemonId) {
  const id = Number(pokemonId || 0);
  if (id <= 0 || !state.saveData?.pokemon_entities) {
    return null;
  }
  const key = String(id);
  let record = state.saveData.pokemon_entities[key] || null;
  if (!record) {
    record = createPokemonEntityRecord(id, 1);
    state.saveData.pokemon_entities[key] = record;
  }
  reconcileAppearanceForEntityRecord(record, id);
  return record;
}

async function unlockGachaRewardSkin(reward) {
  const pokemonId = Number(reward?.pokemonId || 0);
  const variantId = normalizeSpriteVariantId(reward?.variantId);
  const def = state.pokemonDefsById.get(pokemonId);
  if (!def || !variantId) {
    return null;
  }
  const variant = getSpriteVariantById(def, variantId);
  if (!variant) {
    return null;
  }
  const record = getOrCreatePokemonEntityRecordForGacha(pokemonId);
  if (!record) {
    return null;
  }

  const variants = getSpriteVariantsForDef(def);
  const validIds = new Set(variants.map((entry) => entry.id));
  const defaultVariantId = getDefaultSpriteVariantId(def);
  const ownedIds = new Set(normalizeSpriteVariantIdList(record.appearance_owned_variants).filter((id) => validIds.has(id)));
  if (defaultVariantId && validIds.has(defaultVariantId)) {
    ownedIds.add(defaultVariantId);
  }
  ownedIds.add(variant.id);

  record.appearance_owned_variants = variants.map((entry) => entry.id).filter((id) => ownedIds.has(id));
  if (!record.appearance_selected_variant) {
    record.appearance_selected_variant = defaultVariantId || variant.id;
  }
  reconcileAppearanceForEntityRecord(record, pokemonId);
  void ensureVariantAppearanceAssetsLoaded(def, variant, {
    includeShiny: false,
  }).catch((error) => {
    console.warn("Gacha asset preload failed", error);
  });
  return {
    pokemonId,
    pokemonNameFr: String(def.nameFr || def.nameEn || `Pokemon #${pokemonId}`),
    variantId: variant.id,
    variantLabel: getSpriteVariantDisplayLabel(variant),
    spritePath: String(variant.frontPath || def.spritePath || ""),
  };
}

function pickGachaSkinCandidatesForSpin(candidates, count) {
  const safePool = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  const requestedCount = Math.max(1, toSafeInt(count, 1));
  if (safePool.length <= 0 || requestedCount <= 0) {
    return [];
  }
  const pool = safePool.slice();
  const rewards = [];
  const maxCount = Math.min(requestedCount, pool.length);
  for (let index = 0; index < maxCount; index += 1) {
    const pickIndex = randomInt(0, pool.length - 1);
    const picked = pool.splice(pickIndex, 1)[0];
    if (picked) {
      rewards.push(picked);
    }
  }
  return rewards;
}

async function startGachaSpin(options = {}) {
  if (!state.saveData || !state.ui.gachaOpen || state.gacha.spinning) {
    return;
  }

  const requestedSpinCount = Math.max(1, toSafeInt(options?.spinCount, 1));
  const spinCost = Math.max(0, toSafeInt(options?.cost, GACHA_SPIN_COST_COINS));
  const isBatchSpin = requestedSpinCount > 1;
  const spinMainScrollDurationMs = isBatchSpin
    ? GACHA_BATCH_SPIN_MAIN_SCROLL_DURATION_MS
    : GACHA_SPIN_MAIN_SCROLL_DURATION_MS;

  const candidates = getGachaSkinCandidates();
  if (candidates.length <= 0) {
    setTopMessage(`Tous les skins Kanto ${getCurrentGachaPokemonRangeLabel()} sont deja debloques.`, 1700);
    renderGachaModal();
    return;
  }
  if (candidates.length < requestedSpinCount) {
    setTopMessage(
      `Pas assez de skins restants (${candidates.length}/${requestedSpinCount}).`,
      1700,
    );
    renderGachaModal();
    return;
  }
  if (!spendCoins(spinCost)) {
    setTopMessage(`Pas assez de Coins (cout: ${spinCost}).`, 1500);
    renderGachaModal();
    return;
  }

  const rewards = pickGachaSkinCandidatesForSpin(candidates, requestedSpinCount);
  const reward = rewards[rewards.length - 1] || rewards[0] || null;
  if (!reward || rewards.length <= 0) {
    renderGachaModal();
    return;
  }

  state.gacha.spinning = true;
  clearGachaSuspenseTimers();
  clearGachaResultPanel();
  setGachaStatusText(isBatchSpin ? `Mode rafale x${requestedSpinCount}: lancement...` : "La machine se lance...");
  if (gachaMachineEl) {
    gachaMachineEl.classList.add("is-spinning");
    gachaMachineEl.classList.toggle("is-spinning-10", isBatchSpin);
  }
  if (gachaSpinButtonEl) {
    gachaSpinButtonEl.disabled = true;
    gachaSpinButtonEl.textContent = isBatchSpin ? `Tirage x${requestedSpinCount} en cours...` : "Tirage en cours...";
  }
  if (gachaSpin10ButtonEl) {
    gachaSpin10ButtonEl.disabled = true;
    gachaSpin10ButtonEl.textContent = `Tirage x${requestedSpinCount} en cours...`;
  }

  const reelItems = [];
  for (let i = 0; i < GACHA_REEL_TOTAL_ITEMS; i += 1) {
    if (i === GACHA_REEL_REWARD_INDEX) {
      reelItems.push(reward);
      continue;
    }
    reelItems.push(candidates[randomInt(0, candidates.length - 1)] || reward);
  }
  state.gacha.reelItems = reelItems.slice();
  state.gacha.reelRewardIndex = GACHA_REEL_REWARD_INDEX;
  const setUnlockedRewardsResult = (unlockedRewards) => {
    const safeUnlockedRewards = normalizeGachaRewardList(unlockedRewards);
    if (safeUnlockedRewards.length <= 0) {
      setGachaStatusText("Le tirage est termine.");
      return false;
    }
    state.gacha.lastRewards = safeUnlockedRewards.slice();
    state.gacha.lastReward = safeUnlockedRewards[safeUnlockedRewards.length - 1] || safeUnlockedRewards[0];
    state.gacha.lastSpinCount = requestedSpinCount;
    renderGachaResultPanel(state.gacha.lastRewards, { spinCount: requestedSpinCount });
    if (isBatchSpin) {
      if (gachaBatchRevealEl) {
        gachaBatchRevealEl.classList.add("hidden");
      }
      setGachaStatusText(`Mode rafale termine. ${safeUnlockedRewards.length} skins debloques.`);
      setTopMessage(
        `Gacha x${requestedSpinCount}: ${safeUnlockedRewards.length} skins debloques.`,
        2300,
      );
    } else {
      const unlockedReward = safeUnlockedRewards[0];
      setGachaStatusText("Incroyable tirage. Nouveau skin debloque.");
      setTopMessage(
        `Gacha: ${unlockedReward.pokemonNameFr} | skin ${unlockedReward.variantLabel} debloque.`,
        2300,
      );
    }
    return true;
  };

  try {
    renderGachaReelItems(reelItems, GACHA_REEL_REWARD_INDEX);
    if (gachaReelTrackEl) {
      gachaReelTrackEl.style.transition = "none";
      gachaReelTrackEl.style.transform = "translate3d(0px, 0px, 0px)";
      gachaReelTrackEl.style.setProperty("--gacha-spin-ms", `${spinMainScrollDurationMs}ms`);
    }

    updateHud();
    persistSaveData();

    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const targetOffsetPx = getGachaRewardTargetOffsetPx(GACHA_REEL_REWARD_INDEX);
    const finalSnapLeadPx = Math.min(
      GACHA_SPIN_FINAL_SNAP_LEAD_PX,
      Math.max(0, Math.round(targetOffsetPx)),
    );
    const preSnapOffsetPx = Math.max(0, targetOffsetPx - finalSnapLeadPx);
    state.gacha.reelOffsetPx = targetOffsetPx;
    if (gachaReelTrackEl) {
      void gachaReelTrackEl.offsetWidth;
      gachaReelTrackEl.style.transition = `transform ${spinMainScrollDurationMs}ms cubic-bezier(0.08, 0.7, 0.14, 1)`;
      gachaReelTrackEl.style.transform = `translate3d(${-preSnapOffsetPx}px, 0px, 0px)`;
    }

    const suspenseAccelerationDelayMs = Math.round(spinMainScrollDurationMs * 0.18);
    const suspenseSlowdownDelayMs = Math.round(spinMainScrollDurationMs * 0.56);
    const suspenseFinalDelayMs = Math.round(spinMainScrollDurationMs * 0.82);
    state.gacha.suspenseTimerIds.push(
      window.setTimeout(
        () => setGachaStatusText(isBatchSpin ? `Mode x${requestedSpinCount}: le reel accelere...` : "Le reel accelere..."),
        suspenseAccelerationDelayMs,
      ),
      window.setTimeout(
        () => setGachaStatusText(isBatchSpin ? `Mode x${requestedSpinCount}: ralentissement...` : "Ca ralentit... suspense..."),
        suspenseSlowdownDelayMs,
      ),
      window.setTimeout(
        () => setGachaStatusText(isBatchSpin ? `Mode x${requestedSpinCount}: revelation imminente...` : "Encore un instant..."),
        suspenseFinalDelayMs,
      ),
    );

    await waitForGachaDelay(spinMainScrollDurationMs);
    clearGachaSuspenseTimers();
    setGachaStatusText(isBatchSpin ? `Revelation des ${requestedSpinCount} skins...` : "Revelation...");
    if (gachaReelTrackEl) {
      void gachaReelTrackEl.offsetWidth;
      gachaReelTrackEl.style.transition = `transform ${GACHA_SPIN_FINAL_SNAP_DURATION_MS}ms cubic-bezier(0.2, 0.88, 0.2, 1)`;
      gachaReelTrackEl.style.transform = `translate3d(${-targetOffsetPx}px, 0px, 0px)`;
    }
    await waitForGachaDelay(GACHA_SPIN_FINAL_SNAP_DURATION_MS);

    const unlockedRewards = isBatchSpin
      ? await runGachaBatchRevealAnimation(rewards)
      : normalizeGachaRewardList(await unlockGachaRewardSkin(reward));
    setUnlockedRewardsResult(unlockedRewards);
  } catch (error) {
    console.error("Gacha spin failed", error);
    const recoveredRewards = [];
    for (const candidateReward of rewards) {
      const recoveredReward = await unlockGachaRewardSkin(candidateReward).catch((recoveryError) => {
        console.error("Gacha recovery unlock failed", recoveryError);
        return null;
      });
      if (recoveredReward) {
        recoveredRewards.push(recoveredReward);
      }
    }
    setUnlockedRewardsResult(recoveredRewards);
  } finally {
    clearGachaSuspenseTimers();
    clearGachaBatchSpotlightPanel();
    state.gacha.spinning = false;
    if (gachaMachineEl) {
      gachaMachineEl.classList.remove("is-spinning");
      gachaMachineEl.classList.remove("is-spinning-10");
    }

    try {
      rebuildTeamAndSyncBattle();
    } catch (error) {
      console.error("Failed to rebuild team after gacha spin", error);
    }
    persistSaveData();
    updateHud();
    if (state.ui.appearanceOpen) {
      renderAppearanceModal();
    }
    renderGachaModal();
    render();
  }
}

function isCoarsePointerDevice() {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

const RUNTIME_BINDING_GETTERS = { "_": () => _, "__pokeidle_debug_getSpriteFrameIndex": () => __pokeidle_debug_getSpriteFrameIndex, "_$": () => _$, "_front": () => _front, "$": () => $, "a": () => a, "a6dff": () => a6dff, "a8cd": () => a8cd, "abs": () => abs, "accent": () => accent, "accentMix": () => accentMix, "actif": () => actif, "action": () => action, "ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS": () => ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS, "actionDockEl": () => actionDockEl, "actionDockFullscreenMenuEl": () => actionDockFullscreenMenuEl, "actionDockFullscreenMenuOpenTimeoutId": () => actionDockFullscreenMenuOpenTimeoutId, "actionDockPokeballToggleButtonEl": () => actionDockPokeballToggleButtonEl, "actionDockPokeballVisualEl": () => actionDockPokeballVisualEl, "activateNextEvolutionAnimationIfNeeded": () => activateNextEvolutionAnimationIfNeeded, "activationDistancePx": () => activationDistancePx, "activationDistanceSquared": () => activationDistanceSquared, "active": () => active, "Active": () => Active, "active_ball_type": () => active_ball_type, "active_projectiles": () => active_projectiles, "activeDragPointerId": () => activeDragPointerId, "activePointerId": () => activePointerId, "activeRouteId": () => activeRouteId, "activeThemes": () => activeThemes, "actuel": () => actuel, "add": () => add, "addColorStop": () => addColorStop, "addEventListener": () => addEventListener, "advanceTime": () => advanceTime, "aec2d9": () => aec2d9, "Afficher": () => Afficher, "ageMs": () => ageMs, "alert": () => alert, "all": () => all, "allowed": () => allowed, "allowOverflow": () => allowOverflow, "allowOverflowPositions": () => allowOverflowPositions, "allSettled": () => allSettled, "allSubRulesEnabled": () => allSubRulesEnabled, "allyRingYOffset": () => allyRingYOffset, "allySpriteScale": () => allySpriteScale, "alpha": () => alpha, "alphaBase": () => alphaBase, "alphabetic": () => alphabetic, "alphaFactor": () => alphaFactor, "alphaLife": () => alphaLife, "already": () => already, "alreadyLoaded": () => alreadyLoaded, "alt": () => alt, "amplitude": () => amplitude, "angle": () => angle, "animate": () => animate, "animatedSpriteFramesCache": () => animatedSpriteFramesCache, "animation": () => animation, "announce": () => announce, "announceUnlock": () => announceUnlock, "app_build_version": () => app_build_version, "app_version": () => app_version, "APP_VERSION": () => APP_VERSION, "apparence": () => apparence, "Apparence": () => Apparence, "apparences": () => apparences, "appearance": () => appearance, "appearance_editor_unlocked": () => appearance_editor_unlocked, "appearance_open": () => appearance_open, "appearance_pokemon_id": () => appearance_pokemon_id, "appearance_selected_variant": () => appearance_selected_variant, "appearance_selected_variant_id": () => appearance_selected_variant_id, "appearance_shiny_mode": () => appearance_shiny_mode, "appearance_shiny_unlocked_family": () => appearance_shiny_unlocked_family, "appearance_target_slot_index": () => appearance_target_slot_index, "appearance_ultra_shiny_mode": () => appearance_ultra_shiny_mode, "appearance_ultra_shiny_unlocked_family": () => appearance_ultra_shiny_unlocked_family, "APPEARANCE_UNLOCK_LEVEL": () => APPEARANCE_UNLOCK_LEVEL, "appearanceChanged": () => appearanceChanged, "appearanceGridEl": () => appearanceGridEl, "appearanceModalEl": () => appearanceModalEl, "appearanceOpen": () => appearanceOpen, "appearancePokemonId": () => appearancePokemonId, "appearanceRecord": () => appearanceRecord, "appearanceResult": () => appearanceResult, "appearanceShinyStatusEl": () => appearanceShinyStatusEl, "appearanceShinyToggleButtonEl": () => appearanceShinyToggleButtonEl, "appearanceStateReconciled": () => appearanceStateReconciled, "appearanceSubtitleEl": () => appearanceSubtitleEl, "appearanceTargetSlotIndex": () => appearanceTargetSlotIndex, "appearanceTitleEl": () => appearanceTitleEl, "appearanceUltraShinyToggleButtonEl": () => appearanceUltraShinyToggleButtonEl, "appearanceUnlocked": () => appearanceUnlocked, "appearanceUnlockedFromProgress": () => appearanceUnlockedFromProgress, "append": () => append, "appendChild": () => appendChild, "applique": () => applique, "applyAppearanceModesToEvolutionFamily": () => applyAppearanceModesToEvolutionFamily, "applyEncounterMappingToRouteData": () => applyEncounterMappingToRouteData, "applyNicknameToEvolutionFamily": () => applyNicknameToEvolutionFamily, "applyPokemonTalentCsvToDefinitions": () => applyPokemonTalentCsvToDefinitions, "applyRenameModal": () => applyRenameModal, "applyTeamTalentOverrides": () => applyTeamTalentOverrides, "arc": () => arc, "arcCenterDeg": () => arcCenterDeg, "arcDepth": () => arcDepth, "arcEdgeSinAbs": () => arcEdgeSinAbs, "arcEnd": () => arcEnd, "arcEndCosAbs": () => arcEndCosAbs, "arcEndDeg": () => arcEndDeg, "arcRadiusScale": () => arcRadiusScale, "arcRotationDeg": () => arcRotationDeg, "arcSpan": () => arcSpan, "arcSpreadDeg": () => arcSpreadDeg, "arcSpreadDegRaw": () => arcSpreadDegRaw, "arcSpreadScale": () => arcSpreadScale, "arcStart": () => arcStart, "arcStartCosAbs": () => arcStartCosAbs, "arcStartDeg": () => arcStartDeg, "arctic": () => arctic, "ardent": () => ardent, "args": () => args, "aria": () => aria, "Array": () => Array, "as": () => as, "aspect": () => aspect, "assertValidBallConfig": () => assertValidBallConfig, "assertValidEncounter": () => assertValidEncounter, "assertValidShopItemConfig": () => assertValidShopItemConfig, "assets": () => assets, "asymmetric": () => asymmetric, "async": () => async, "atan2": () => atan2, "atop": () => atop, "attachPokedexSpriteLoadingLifecycle": () => attachPokedexSpriteLoadingLifecycle, "attack_boost_remaining_ms": () => attack_boost_remaining_ms, "attack_interval_ms": () => attack_interval_ms, "attack_slots_total": () => attack_slots_total, "attack_timer_ms": () => attack_timer_ms, "attacker_name_fr": () => attacker_name_fr, "attackerNameFr": () => attackerNameFr, "attackTimerMs": () => attackTimerMs, "attackType": () => attackType, "Atteins": () => Atteins, "Aucun": () => Aucun, "Aucune": () => Aucune, "aura": () => aura, "auraBonus": () => auraBonus, "auraRadius": () => auraRadius, "auraScale": () => auraScale, "automatiquement": () => automatiquement, "availableRouteIds": () => availableRouteIds, "avec": () => avec, "avoid": () => avoid, "axis": () => axis, "b": () => b, "b2cae3": () => b2cae3, "b8cee5": () => b8cee5, "backdropFadeMs": () => backdropFadeMs, "backdropPresence": () => backdropPresence, "background_drift": () => background_drift, "background_image": () => background_image, "backgroundDrift": () => backgroundDrift, "backgroundImage": () => backgroundImage, "badge": () => badge, "Badge": () => Badge, "badgeCenterX": () => badgeCenterX, "badgeGap": () => badgeGap, "badgeGradient": () => badgeGradient, "badgeNameGap": () => badgeNameGap, "badgeRadius": () => badgeRadius, "badgeRow": () => badgeRow, "badges": () => badges, "badgeSize": () => badgeSize, "balance_hp_multiplier": () => balance_hp_multiplier, "balance_reward_multiplier": () => balance_reward_multiplier, "balance_team_size": () => balance_team_size, "balanceHpMultiplier": () => balanceHpMultiplier, "balanceRewardMultiplier": () => balanceRewardMultiplier, "balanceTeamSize": () => balanceTeamSize, "ball": () => ball, "Ball": () => Ball, "ball_capture_menu_ball_type": () => ball_capture_menu_ball_type, "ball_capture_menu_open": () => ball_capture_menu_open, "BALL_CAPTURE_RULE_CAPTURE_ALL": () => BALL_CAPTURE_RULE_CAPTURE_ALL, "BALL_CAPTURE_RULE_CAPTURE_OWNED": () => BALL_CAPTURE_RULE_CAPTURE_OWNED, "BALL_CAPTURE_RULE_CAPTURE_SHINY": () => BALL_CAPTURE_RULE_CAPTURE_SHINY, "BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY": () => BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY, "BALL_CAPTURE_RULE_CAPTURE_UNOWNED": () => BALL_CAPTURE_RULE_CAPTURE_UNOWNED, "ball_capture_rules": () => ball_capture_rules, "BALL_CAPTURE_TOGGLE_DEFINITIONS": () => BALL_CAPTURE_TOGGLE_DEFINITIONS, "BALL_CONFIG_BY_TYPE": () => BALL_CONFIG_BY_TYPE, "BALL_CONFIG_CSV_PATH": () => BALL_CONFIG_CSV_PATH, "ball_configs": () => ball_configs, "ball_csv_loaded": () => ball_csv_loaded, "ball_inventory": () => ball_inventory, "BALL_INVENTORY_MAX_PER_TYPE": () => BALL_INVENTORY_MAX_PER_TYPE, "BALL_OVERLAY_UI_STYLE_BY_TYPE": () => BALL_OVERLAY_UI_STYLE_BY_TYPE, "BALL_OVERLAY_UI_STYLE_DEFAULT": () => BALL_OVERLAY_UI_STYLE_DEFAULT, "ball_type": () => ball_type, "BALL_TYPE_FALLBACK_ORDER": () => BALL_TYPE_FALLBACK_ORDER, "ballCaptureMenuBallType": () => ballCaptureMenuBallType, "ballCaptureMenuEl": () => ballCaptureMenuEl, "ballCaptureMenuOpen": () => ballCaptureMenuOpen, "ballCaptureMenuTitleEl": () => ballCaptureMenuTitleEl, "ballConfigCsvLoaded": () => ballConfigCsvLoaded, "ballConfigCsvPath": () => ballConfigCsvPath, "ballCsvResult": () => ballCsvResult, "ballOverlayHitboxes": () => ballOverlayHitboxes, "ballRadius": () => ballRadius, "ballRotation": () => ballRotation, "ballTheme": () => ballTheme, "ballType": () => ballType, "ballX": () => ballX, "ballY": () => ballY, "bandStep": () => bandStep, "base": () => base, "base_stats": () => base_stats, "BASE_STEP_MS": () => BASE_STEP_MS, "baseAlpha": () => baseAlpha, "baseAngle": () => baseAngle, "baseArcCenterDeg": () => baseArcCenterDeg, "baseArcEndDeg": () => baseArcEndDeg, "baseArcSpreadDeg": () => baseArcSpreadDeg, "baseArcStartDeg": () => baseArcStartDeg, "baseBackdropAlpha": () => baseBackdropAlpha, "baseColor": () => baseColor, "baseEncounters": () => baseEncounters, "baseList": () => baseList, "baseName": () => baseName, "baseNameFr": () => baseNameFr, "baseOrbRadius": () => baseOrbRadius, "baseRowHeight": () => baseRowHeight, "baseRowWidth": () => baseRowWidth, "baseRowX": () => baseRowX, "baseRowY": () => baseRowY, "baseScale": () => baseScale, "baseSize": () => baseSize, "baseStats": () => baseStats, "baseTotal": () => baseTotal, "baseX": () => baseX, "baseY": () => baseY, "batch": () => batch, "battle": () => battle, "battus": () => battus, "Battus": () => Battus, "beam": () => beam, "beginPath": () => beginPath, "beginTeamDragForSlot": () => beginTeamDragForSlot, "bindPokedexVirtualEventsIfNeeded": () => bindPokedexVirtualEventsIfNeeded, "blend": () => blend, "blendRgb": () => blendRgb, "bloqu": () => bloqu, "bodyAlpha": () => bodyAlpha, "boite": () => boite, "Boite": () => Boite, "boites": () => boites, "bold": () => bold, "bolt": () => bolt, "bonus": () => bonus, "boolean": () => boolean, "Boolean": () => Boolean, "boost": () => boost, "boostMultiplier": () => boostMultiplier, "boostPower": () => boostPower, "border": () => border, "borderAlpha": () => borderAlpha, "borderWidth": () => borderWidth, "bottom": () => bottom, "bottomGradient": () => bottomGradient, "bottomHudHeight": () => bottomHudHeight, "bottomLimit": () => bottomLimit, "bottomRowY": () => bottomRowY, "bottomSpacer": () => bottomSpacer, "bottomSpacerHeight": () => bottomSpacerHeight, "boxes": () => boxes, "boxes_entity_count": () => boxes_entity_count, "boxes_open": () => boxes_open, "boxes_shiny_capture_total": () => boxes_shiny_capture_total, "boxes_target_slot_index": () => boxes_target_slot_index, "boxesAccess": () => boxesAccess, "boxesGridEl": () => boxesGridEl, "boxesHoverEntityId": () => boxesHoverEntityId, "boxesInfoPanelEl": () => boxesInfoPanelEl, "boxesModalEl": () => boxesModalEl, "boxesOpen": () => boxesOpen, "boxesShinyCounterEl": () => boxesShinyCounterEl, "boxesSubtitleEl": () => boxesSubtitleEl, "boxesTargetSlotIndex": () => boxesTargetSlotIndex, "br": () => br, "breakColors": () => breakColors, "breath": () => breath, "BREATH_AMPLITUDE_VARIATION": () => BREATH_AMPLITUDE_VARIATION, "BREATH_BASE_AMPLITUDE": () => BREATH_BASE_AMPLITUDE, "BREATH_MAX_PERIOD_MS": () => BREATH_MAX_PERIOD_MS, "BREATH_MIN_PERIOD_MS": () => BREATH_MIN_PERIOD_MS, "BREATH_OFFSET_RATIO": () => BREATH_OFFSET_RATIO, "BREATH_SECONDARY_WEIGHT": () => BREATH_SECONDARY_WEIGHT, "BREATH_SIDE_COMPENSATION": () => BREATH_SIDE_COMPENSATION, "breathingAmount": () => breathingAmount, "brightness": () => brightness, "broken": () => broken, "browser": () => browser, "BST": () => BST, "btn": () => btn, "bubble": () => bubble, "budgetMs": () => budgetMs, "bufferCtx": () => bufferCtx, "bug": () => bug, "buildArcSlotPositions": () => buildArcSlotPositions, "buildEnemyOwnershipBadgeList": () => buildEnemyOwnershipBadgeList, "buildPokedexSpeciesHintMap": () => buildPokedexSpeciesHintMap, "buildPokedexSpeciesSpritePath": () => buildPokedexSpeciesSpritePath, "buildPokedexSpeciesSpritePathForVariant": () => buildPokedexSpeciesSpritePathForVariant, "buildPokemonJsonPath": () => buildPokemonJsonPath, "buildRouteDataPath": () => buildRouteDataPath, "buildSpriteShaderFilter": () => buildSpriteShaderFilter, "burst": () => burst, "button": () => button, "buttonCenter": () => buttonCenter, "buttonEl": () => buttonEl, "buttonOuter": () => buttonOuter, "bx": () => bx, "by": () => by, "bySlot": () => bySlot, "cache": () => cache, "cache_error": () => cache_error, "cache_frames": () => cache_frames, "cache_status": () => cache_status, "cacheEntry": () => cacheEntry, "call": () => call, "can": () => can, "can_attack": () => can_attack, "canAttack": () => canAttack, "cancelable": () => cancelable, "cancelAnimationFrame": () => cancelAnimationFrame, "cancelDistance": () => cancelDistance, "cancelQueuedPokedexGridRender": () => cancelQueuedPokedexGridRender, "cancelQueuedPokedexViewportRender": () => cancelQueuedPokedexViewportRender, "cancelTeamContextTouchHold": () => cancelTeamContextTouchHold, "candidate": () => candidate, "candidateId": () => candidateId, "candidatePath": () => candidatePath, "candidatePokemonId": () => candidatePokemonId, "canvas": () => canvas, "captur": () => captur, "capture": () => capture, "Capture": () => Capture, "CAPTURE_FAIL_BREAK_MS": () => CAPTURE_FAIL_BREAK_MS, "CAPTURE_FAIL_REAPPEAR_MS": () => CAPTURE_FAIL_REAPPEAR_MS, "capture_multiplier": () => capture_multiplier, "capture_sequence": () => capture_sequence, "CAPTURE_SHAKE_MS": () => CAPTURE_SHAKE_MS, "CAPTURE_SUCCESS_BURST_MS": () => CAPTURE_SUCCESS_BURST_MS, "CAPTURE_THROW_MS": () => CAPTURE_THROW_MS, "capture$": () => capture$, "captureCanvasPointer": () => captureCanvasPointer, "captured": () => captured, "captured_normal": () => captured_normal, "captured_shiny": () => captured_shiny, "captured_total": () => captured_total, "captured_ultra_shiny": () => captured_ultra_shiny, "capturedNormal": () => capturedNormal, "capturedRecord": () => capturedRecord, "capturedShiny": () => capturedShiny, "capturedShinyNonUltra": () => capturedShinyNonUltra, "capturedSpeciesCount": () => capturedSpeciesCount, "capturedTotal": () => capturedTotal, "capturedUltraShiny": () => capturedUltraShiny, "captureEl": () => captureEl, "captureEnemyVisual": () => captureEnemyVisual, "capturees": () => capturees, "captureMultiplier": () => captureMultiplier, "capturePhase": () => capturePhase, "Captures": () => Captures, "captureSequence": () => captureSequence, "captureSnapshot": () => captureSnapshot, "card": () => card, "cardCenterX": () => cardCenterX, "cardHeight": () => cardHeight, "cardMargin": () => cardMargin, "cardTopY": () => cardTopY, "cardWidth": () => cardWidth, "catalog": () => catalog, "catch_rate": () => catch_rate, "category": () => category, "ccw": () => ccw, "ce": () => ce, "Ce": () => Ce, "ce$": () => ce$, "cedef8": () => cedef8, "ceil": () => ceil, "celebrationParticles": () => celebrationParticles, "center": () => center, "centerProximity": () => centerProximity, "centerX": () => centerX, "centerY": () => centerY, "centerYBaseRatio": () => centerYBaseRatio, "centerYRatio": () => centerYRatio, "centerYRaw": () => centerYRaw, "ces": () => ces, "cette": () => cette, "Chance": () => Chance, "chanceDisplay": () => chanceDisplay, "changed": () => changed, "Changer": () => Changer, "charAt": () => charAt, "charge": () => charge, "chargees": () => chargees, "chargeGlow": () => chargeGlow, "chargement": () => chargement, "charger": () => charger, "chargeScale": () => chargeScale, "check": () => check, "checked": () => checked, "checkEl": () => checkEl, "chipHeight": () => chipHeight, "chipWidth": () => chipWidth, "chipX": () => chipX, "chipY": () => chipY, "Choisir": () => Choisir, "Choisis": () => Choisis, "chunkRouteIds": () => chunkRouteIds, "clamp": () => clamp, "classList": () => classList, "className": () => className, "clearBrowserSaveRetry": () => clearBrowserSaveRetry, "clearCanvasHoverState": () => clearCanvasHoverState, "clearDesktopSaveRetry": () => clearDesktopSaveRetry, "clearMoneyGainFloaters": () => clearMoneyGainFloaters, "clearRect": () => clearRect, "clearTeamDragState": () => clearTeamDragState, "clearTimeout": () => clearTimeout, "Clic": () => Clic, "click": () => click, "clientHeight": () => clientHeight, "clientWidth": () => clientWidth, "clientX": () => clientX, "clientY": () => clientY, "clip": () => clip, "cloneConfigMap": () => cloneConfigMap, "cloneEncounterEntries": () => cloneEncounterEntries, "closeAppearanceModal": () => closeAppearanceModal, "closeBallCaptureMenu": () => closeBallCaptureMenu, "closeBoxesModal": () => closeBoxesModal, "closeEvolutionItemChoiceModal": () => closeEvolutionItemChoiceModal, "closeGachaModal": () => closeGachaModal, "closePath": () => closePath, "closePokedexModal": () => closePokedexModal, "closeRenameModal": () => closeRenameModal, "closest": () => closest, "closeTeamContextMenu": () => closeTeamContextMenu, "closing": () => closing, "coarsePointer": () => coarsePointer, "code": () => code, "coins": () => coins, "Coins": () => Coins, "coins_display_value": () => coins_display_value, "col": () => col, "color": () => color, "colorizeBlend": () => colorizeBlend, "colorizeBlendPrimary": () => colorizeBlendPrimary, "colorizeBlendSecondary": () => colorizeBlendSecondary, "colorizePrimary": () => colorizePrimary, "colorizeRgb": () => colorizeRgb, "colorizeSecondary": () => colorizeSecondary, "colorSecondary": () => colorSecondary, "colorText": () => colorText, "columnCount": () => columnCount, "columnGap": () => columnGap, "combat": () => combat, "combat_enabled": () => combat_enabled, "combatEnabled": () => combatEnabled, "coming_soon": () => coming_soon, "comingSoon": () => comingSoon, "compact": () => compact, "compactHud": () => compactHud, "compactScale": () => compactScale, "compareShopItems": () => compareShopItems, "Compl": () => Compl, "complet": () => complet, "complete": () => complete, "completionRatio": () => completionRatio, "comportement": () => comportement, "computeLayout": () => computeLayout, "computeStatsAtLevel": () => computeStatsAtLevel, "config": () => config, "configRevisions": () => configRevisions, "configsById": () => configsById, "configsByType": () => configsByType, "configure": () => configure, "configuree": () => configuree, "confirm": () => confirm, "console": () => console, "consumePendingSimulation": () => consumePendingSimulation, "contains": () => contains, "content": () => content, "contentStartX": () => contentStartX, "contentWidth": () => contentWidth, "contextmenu": () => contextmenu, "contrast": () => contrast, "controllable": () => controllable, "coordinate_system": () => coordinate_system, "coreRadius": () => coreRadius, "cos": () => cos, "count": () => count, "counters": () => counters, "counterTextSize": () => counterTextSize, "counterY": () => counterY, "coverPadX": () => coverPadX, "coverPadY": () => coverPadY, "cpu_frame_ms_estimate": () => cpu_frame_ms_estimate, "cpuFrameMsEma": () => cpuFrameMsEma, "crack_ratio": () => crack_ratio, "crackRatio": () => crackRatio, "createConicGradient": () => createConicGradient, "createDocumentFragment": () => createDocumentFragment, "createElement": () => createElement, "createEmptySave": () => createEmptySave, "createLinearGradient": () => createLinearGradient, "createPokedexCardButton": () => createPokedexCardButton, "createPokedexLoadingIndicatorElement": () => createPokedexLoadingIndicatorElement, "createRadialGradient": () => createRadialGradient, "createRuntimeConfigLoaders": () => createRuntimeConfigLoaders, "critical": () => critical, "criticalCapture": () => criticalCapture, "criticalSuccessColors": () => criticalSuccessColors, "crystal": () => crystal, "csv": () => csv, "CSV": () => CSV, "csvEncounters": () => csvEncounters, "csvEntries": () => csvEntries, "csvTalent": () => csvTalent, "ctrlX": () => ctrlX, "ctrlY": () => ctrlY, "ctx": () => ctx, "current": () => current, "current_route_encounter_count": () => current_route_encounter_count, "current_route_encounter_preview": () => current_route_encounter_preview, "current_route_id": () => current_route_id, "currentDefeats": () => currentDefeats, "currentId": () => currentId, "currentIndex": () => currentIndex, "currentLength": () => currentLength, "currentlyOpen": () => currentlyOpen, "currentRouteId": () => currentRouteId, "currentRules": () => currentRules, "currentSrc": () => currentSrc, "currentTargetId": () => currentTargetId, "currentTargetName": () => currentTargetName, "currentX": () => currentX, "currentXp": () => currentXp, "currentY": () => currentY, "cursor": () => cursor, "customShaderConfig": () => customShaderConfig, "cut": () => cut, "cw": () => cw, "cx": () => cx, "cy": () => cy, "cycleMs": () => cycleMs, "d": () => d, "d8ff": () => d8ff, "damage": () => damage, "danger": () => danger, "dans": () => dans, "dark": () => dark, "data": () => data, "dataset": () => dataset, "Date": () => Date, "dayLight": () => dayLight, "daylight_factor": () => daylight_factor, "de": () => de, "debloque": () => debloque, "debloquee": () => debloquee, "debloquer": () => debloquer, "debloques": () => debloques, "debug_force_ultra_shiny_all_pokemon": () => debug_force_ultra_shiny_all_pokemon, "debuter": () => debuter, "decimalsLarge": () => decimalsLarge, "decimalsMedium": () => decimalsMedium, "decimalsSmall": () => decimalsSmall, "decoding": () => decoding, "def": () => def, "DEFAULT_BALL_CONFIG_BY_TYPE": () => DEFAULT_BALL_CONFIG_BY_TYPE, "DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID": () => DEFAULT_EXTRA_SHOP_ITEM_CONFIG_BY_ID, "DEFAULT_ROUTE_ID": () => DEFAULT_ROUTE_ID, "DEFAULT_WILD_LEVEL_MAX": () => DEFAULT_WILD_LEVEL_MAX, "DEFAULT_WILD_LEVEL_MIN": () => DEFAULT_WILD_LEVEL_MIN, "defaultBallConfigByType": () => defaultBallConfigByType, "defaultEnemyAlpha": () => defaultEnemyAlpha, "defaultEnemyScale": () => defaultEnemyScale, "defaultExtraShopItemsById": () => defaultExtraShopItemsById, "defaultWildLevelMax": () => defaultWildLevelMax, "defaultWildLevelMin": () => defaultWildLevelMin, "defaut": () => defaut, "defeat": () => defeat, "defeatCounterText": () => defeatCounterText, "defeated_normal": () => defeated_normal, "defeated_shiny": () => defeated_shiny, "defeated_total": () => defeated_total, "defeatedNormal": () => defeatedNormal, "defeatedShiny": () => defeatedShiny, "defeatedTotal": () => defeatedTotal, "defeats": () => defeats, "defeatTarget": () => defeatTarget, "defensive_types": () => defensive_types, "defensiveTypes": () => defensiveTypes, "DEFERRED_ROUTE_WARMUP_CHUNK_SIZE": () => DEFERRED_ROUTE_WARMUP_CHUNK_SIZE, "DEFERRED_ROUTE_WARMUP_DELAY_MS": () => DEFERRED_ROUTE_WARMUP_DELAY_MS, "deferredSaveDirty": () => deferredSaveDirty, "definition": () => definition, "definitions": () => definitions, "defsById": () => defsById, "deg": () => deg, "deja": () => deja, "Deja": () => Deja, "deleteSaveDataFromDesktopBridge": () => deleteSaveDataFromDesktopBridge, "deleteSaveDataFromIndexedDb": () => deleteSaveDataFromIndexedDb, "deltaMs": () => deltaMs, "density": () => density, "Derniere": () => Derniere, "des": () => des, "desactive": () => desactive, "descriptionFr": () => descriptionFr, "desiredRouteId": () => desiredRouteId, "detaillees": () => detaillees, "DEV_LAYOUT_SETTINGS_DEFAULTS": () => DEV_LAYOUT_SETTINGS_DEFAULTS, "devices": () => devices, "devLayout": () => devLayout, "devLayoutSettings": () => devLayoutSettings, "devScale": () => devScale, "dex": () => dex, "diamond_pearl": () => diamond_pearl, "didSwap": () => didSwap, "differe": () => differe, "dims": () => dims, "direction": () => direction, "dirX": () => dirX, "dirY": () => dirY, "disabled": () => disabled, "disables": () => disables, "disconnect": () => disconnect, "discoveryState": () => discoveryState, "display": () => display, "DISPLAY_APP_VERSION": () => DISPLAY_APP_VERSION, "displayName": () => displayName, "displayNameFr": () => displayNameFr, "displayValue": () => displayValue, "disponible": () => disponible, "distance": () => distance, "distanceSquared": () => distanceSquared, "distortion": () => distortion, "div": () => div, "document": () => document, "down": () => down, "dpr": () => dpr, "drag": () => drag, "draggable": () => draggable, "dragMoved": () => dragMoved, "dragon": () => dragon, "drawAlpha": () => drawAlpha, "drawBackground": () => drawBackground, "drawBallInventoryOverlay": () => drawBallInventoryOverlay, "drawBattleUiOverlay": () => drawBattleUiOverlay, "drawCaptureSequence": () => drawCaptureSequence, "drawEmptyTeamSlot": () => drawEmptyTeamSlot, "drawEnemyDefensiveTypeHud": () => drawEnemyDefensiveTypeHud, "drawEnemyHitEffects": () => drawEnemyHitEffects, "drawEnemyHpBar": () => drawEnemyHpBar, "drawEnemyKoEffect": () => drawEnemyKoEffect, "drawEnemyOwnershipBadge": () => drawEnemyOwnershipBadge, "drawEnvironmentBackgroundLayer": () => drawEnvironmentBackgroundLayer, "drawEnvironmentForegroundLayer": () => drawEnvironmentForegroundLayer, "drawEvolutionAnimationOverlay": () => drawEvolutionAnimationOverlay, "drawEvolutionAnimationParticles": () => drawEvolutionAnimationParticles, "drawEvolutionSpriteFrame": () => drawEvolutionSpriteFrame, "drawFloatingDamageTexts": () => drawFloatingDamageTexts, "drawFpsOverlay": () => drawFpsOverlay, "drawHeight": () => drawHeight, "drawHpText": () => drawHpText, "drawImage": () => drawImage, "drawLegendaryFieldEdgeAura": () => drawLegendaryFieldEdgeAura, "drawLegendaryFieldPerimeterParticles": () => drawLegendaryFieldPerimeterParticles, "drawLegendaryFieldScreenVfx": () => drawLegendaryFieldScreenVfx, "drawLegendaryFieldTrinityPulse": () => drawLegendaryFieldTrinityPulse, "drawLoadingOrError": () => drawLoadingOrError, "drawMorphingOutline": () => drawMorphingOutline, "drawMorphingSlimeEffect": () => drawMorphingSlimeEffect, "drawNameAndLevel": () => drawNameAndLevel, "drawNonCombatZoneOverlay": () => drawNonCombatZoneOverlay, "drawPokeball": () => drawPokeball, "drawPokemonBackdropCircle": () => drawPokemonBackdropCircle, "drawPokemonSprite": () => drawPokemonSprite, "drawPokemonTerrainShadow": () => drawPokemonTerrainShadow, "drawPosition": () => drawPosition, "drawProjectiles": () => drawProjectiles, "drawProjectileTypeMotif": () => drawProjectileTypeMotif, "drawRetroHudPanel": () => drawRetroHudPanel, "drawRouteDefeatTimerBar": () => drawRouteDefeatTimerBar, "drawShinySparkles": () => drawShinySparkles, "drawSize": () => drawSize, "drawSpriteImageWithTint": () => drawSpriteImageWithTint, "drawTeamAttackChargeGlow": () => drawTeamAttackChargeGlow, "drawTeamAuraIndicator": () => drawTeamAuraIndicator, "drawTeamDragSwapOverlay": () => drawTeamDragSwapOverlay, "drawTeamHoverIndicator": () => drawTeamHoverIndicator, "drawTeamLevelUpEffects": () => drawTeamLevelUpEffects, "drawTeamTeleportBoostIndicator": () => drawTeamTeleportBoostIndicator, "drawTeamTypeHud": () => drawTeamTypeHud, "drawTeamXpBar": () => drawTeamXpBar, "drawTeamXpGainEffects": () => drawTeamXpGainEffects, "drawTimeOfDayColorGrade": () => drawTimeOfDayColorGrade, "drawTurnIndicator": () => drawTurnIndicator, "drawUltraShinyOutline": () => drawUltraShinyOutline, "drawUltraShinyScintillation": () => drawUltraShinyScintillation, "drawVersionOverlay": () => drawVersionOverlay, "drawWidth": () => drawWidth, "drawX": () => drawX, "drawY": () => drawY, "drift": () => drift, "driftRange": () => driftRange, "driftX": () => driftX, "driftY": () => driftY, "drip": () => drip, "dripAmplitude": () => dripAmplitude, "dripNoise": () => dripNoise, "dripShape": () => dripShape, "droit": () => droit, "dropAlpha": () => dropAlpha, "droplet": () => droplet, "dropletCount": () => dropletCount, "dropped": () => dropped, "du": () => du, "dueAt": () => dueAt, "duplicateFamilyIndex": () => duplicateFamilyIndex, "duplicateIndex": () => duplicateIndex, "duration_ms": () => duration_ms, "durationMs": () => durationMs, "dust": () => dust, "dx": () => dx, "dy": () => dy, "dynamicFontBoost": () => dynamicFontBoost, "dynamicPanelWidth": () => dynamicPanelWidth, "e6b55d": () => e6b55d, "e6f0fe": () => e6f0fe, "e8f2ff": () => e8f2ff, "eager": () => eager, "easedThrow": () => easedThrow, "easedTrail": () => easedTrail, "easeInOutSine": () => easeInOutSine, "easeOutCubic": () => easeOutCubic, "Echanger": () => Echanger, "edgeAlpha": () => edgeAlpha, "edgeBias": () => edgeBias, "edgeColor": () => edgeColor, "edgePoint": () => edgePoint, "edgeThickness": () => edgeThickness, "eef6ff": () => eef6ff, "effect": () => effect, "effect_duration_ms": () => effect_duration_ms, "effect_kind": () => effect_kind, "effect_value": () => effect_value, "effectDurationMs": () => effectDurationMs, "effectKind": () => effectKind, "effectRatio": () => effectRatio, "effectValue": () => effectValue, "Effet": () => Effet, "elapsed": () => elapsed, "elapsed_ms": () => elapsed_ms, "elapsedMs": () => elapsedMs, "electric": () => electric, "element": () => element, "Element": () => Element, "ellipse": () => ellipse, "ember": () => ember, "emerald": () => emerald, "empty": () => empty, "emptyEl": () => emptyEl, "emptyTextStyle": () => emptyTextStyle, "en": () => en, "En": () => En, "enabled": () => enabled, "encounter": () => encounter, "encountered": () => encountered, "encountered_normal": () => encountered_normal, "encountered_shiny": () => encountered_shiny, "encountered_total": () => encountered_total, "encountered_ultra_shiny": () => encountered_ultra_shiny, "encounteredNormal": () => encounteredNormal, "encounteredShiny": () => encounteredShiny, "encounteredSpeciesCount": () => encounteredSpeciesCount, "encounteredTotal": () => encounteredTotal, "encounteredUltraShiny": () => encounteredUltraShiny, "encounters": () => encounters, "encounters_json_base": () => encounters_json_base, "encounters_source": () => encounters_source, "encountersByRouteId": () => encountersByRouteId, "end": () => end, "endIndex": () => endIndex, "endRowExclusive": () => endRowExclusive, "enemies_defeated": () => enemies_defeated, "enemiesDefeated": () => enemiesDefeated, "enemy": () => enemy, "enemy_damage_flash_blend": () => enemy_damage_flash_blend, "ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER": () => ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER, "ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER": () => ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER, "ENEMY_TIMER_STYLE_ONLY_ONE": () => ENEMY_TIMER_STYLE_ONLY_ONE, "enemyAlpha": () => enemyAlpha, "enemyBreath": () => enemyBreath, "enemyCenterYOffset": () => enemyCenterYOffset, "enemyDamageTintBlend": () => enemyDamageTintBlend, "enemyDefensiveTypes": () => enemyDefensiveTypes, "enemyHitGlow": () => enemyHitGlow, "enemyHitPulse": () => enemyHitPulse, "enemyHpFrontRatio": () => enemyHpFrontRatio, "enemyHpKey": () => enemyHpKey, "enemyHpLagRatio": () => enemyHpLagRatio, "enemyImpactX": () => enemyImpactX, "enemyImpactY": () => enemyImpactY, "enemyImpactYRaw": () => enemyImpactYRaw, "enemyNameCard": () => enemyNameCard, "enemyNameMaxY": () => enemyNameMaxY, "enemyNameMinY": () => enemyNameMinY, "enemyNamePlateWidth": () => enemyNamePlateWidth, "enemyNameTopY": () => enemyNameTopY, "enemyNameTopYRaw": () => enemyNameTopYRaw, "enemyRadius": () => enemyRadius, "enemyRenderState": () => enemyRenderState, "enemyScale": () => enemyScale, "enemySize": () => enemySize, "enemySpriteScale": () => enemySpriteScale, "enemySpriteSize": () => enemySpriteSize, "enemyTalent": () => enemyTalent, "enemyTypeHudY": () => enemyTypeHudY, "enemyTypeHudYRaw": () => enemyTypeHudYRaw, "enemyTypeMaxY": () => enemyTypeMaxY, "enemyTypeMinY": () => enemyTypeMinY, "enemyUiTop": () => enemyUiTop, "enemyUiYOffset": () => enemyUiYOffset, "enemyVisible": () => enemyVisible, "enqueueTarget": () => enqueueTarget, "ensureAppearanceEditorUnlockedFromProgress": () => ensureAppearanceEditorUnlockedFromProgress, "ensureBackgroundTicker": () => ensureBackgroundTicker, "ensureMoneyAndItems": () => ensureMoneyAndItems, "ensurePokedexVirtualElements": () => ensurePokedexVirtualElements, "ensurePokedexVirtualResizeObserver": () => ensurePokedexVirtualResizeObserver, "ensureRouteAssetsLoaded": () => ensureRouteAssetsLoaded, "ensureRouteBackgroundLoaded": () => ensureRouteBackgroundLoaded, "ensureRouteDefinitionsLoaded": () => ensureRouteDefinitionsLoaded, "ensureUnlockedRoutesForCurrentCatalog": () => ensureUnlockedRoutesForCurrentCatalog, "ensureVariantAppearanceAssetsLoaded": () => ensureVariantAppearanceAssetsLoaded, "entites": () => entites, "entity": () => entity, "entries": () => entries, "entriesById": () => entriesById, "entry": () => entry, "environment": () => environment, "environmentParticleScale": () => environmentParticleScale, "environmentSnapshot": () => environmentSnapshot, "equipe": () => equipe, "Equipe": () => Equipe, "Erreur": () => Erreur, "error": () => error, "Error": () => Error, "errors": () => errors, "escapeHtml": () => escapeHtml, "esp": () => esp, "espece": () => espece, "est": () => est, "et": () => et, "event": () => event, "evolue": () => evolue, "EVOLUTION_ANIM_BACKDROP_FADE_MS": () => EVOLUTION_ANIM_BACKDROP_FADE_MS, "EVOLUTION_ANIM_FLASH_MS": () => EVOLUTION_ANIM_FLASH_MS, "EVOLUTION_ANIM_REVEAL_MS": () => EVOLUTION_ANIM_REVEAL_MS, "EVOLUTION_ANIM_TOTAL_MS": () => EVOLUTION_ANIM_TOTAL_MS, "EVOLUTION_ANIM_WHITE_MS": () => EVOLUTION_ANIM_WHITE_MS, "evolution_animation": () => evolution_animation, "evolution_ready": () => evolution_ready, "evolutionAnimation": () => evolutionAnimation, "evolutive": () => evolutive, "evolvesFrom": () => evolvesFrom, "evolvesTo": () => evolvesTo, "exact": () => exact, "exactOwned": () => exactOwned, "exactShiny": () => exactShiny, "exactUltraShiny": () => exactUltraShiny, "exhale": () => exhale, "exitFullscreen": () => exitFullscreen, "exp": () => exp, "expanded": () => expanded, "exportTextState": () => exportTextState, "EXTRA_SHOP_ITEM_CONFIG_BY_ID": () => EXTRA_SHOP_ITEM_CONFIG_BY_ID, "extraIntensity": () => extraIntensity, "f7fbff": () => f7fbff, "f8fbff": () => f8fbff, "fadeIn": () => fadeIn, "fadeOut": () => fadeOut, "fadeOutStart": () => fadeOutStart, "fail": () => fail, "failed": () => failed, "fairy": () => fairy, "fallback": () => fallback, "Fallback": () => Fallback, "fallbackById": () => fallbackById, "fallbackEntries": () => fallbackEntries, "fallbackName": () => fallbackName, "fallbackNameEn": () => fallbackNameEn, "fallbackVariantOrder": () => fallbackVariantOrder, "famille": () => famille, "Famille": () => Famille, "familyConflictSlotIndex": () => familyConflictSlotIndex, "familyIds": () => familyIds, "familyIdSet": () => familyIdSet, "familyOwned": () => familyOwned, "familyShiny": () => familyShiny, "familySize": () => familySize, "familySyncResult": () => familySyncResult, "familyUltraShiny": () => familyUltraShiny, "feels": () => feels, "fetch": () => ((...args) => globalThis.fetch(...args)), "fetchFn": () => fetchFn, "ff4f9b": () => ff4f9b, "ff9f3f": () => ff9f3f, "ffe24e": () => ffe24e, "fff9ef": () => fff9ef, "ffffff": () => ffffff, "fieldIntensity": () => fieldIntensity, "fields": () => fields, "fighting": () => fighting, "fill": () => fill, "fillBottom": () => fillBottom, "filledWidth": () => filledWidth, "fillEnd": () => fillEnd, "fillGradient": () => fillGradient, "fillRect": () => fillRect, "fillStart": () => fillStart, "fillStyle": () => fillStyle, "fillText": () => fillText, "fillTextStyle": () => fillTextStyle, "fillTop": () => fillTop, "filter": () => filter, "finalAlpha": () => finalAlpha, "find": () => find, "findHoveredBallOverlayHitbox": () => findHoveredBallOverlayHitbox, "findHoveredPokemon": () => findHoveredPokemon, "findHoveredTeamSlot": () => findHoveredTeamSlot, "findIndex": () => findIndex, "findTeamFamilyConflictSlotIndex": () => findTeamFamilyConflictSlotIndex, "fire": () => fire, "firered_leafgreen": () => firered_leafgreen, "first": () => first, "firstSlotIndex": () => firstSlotIndex, "firstVisibleRow": () => firstVisibleRow, "fitTextToWidthWithEllipsis": () => fitTextToWidthWithEllipsis, "flame": () => flame, "flashAlpha": () => flashAlpha, "flashEase": () => flashEase, "flashEnd": () => flashEnd, "flashRatio": () => flashRatio, "flashWindowMs": () => flashWindowMs, "flipX": () => flipX, "floating_damage_texts": () => floating_damage_texts, "FLOATING_TEXT_TONE_CRITICAL": () => FLOATING_TEXT_TONE_CRITICAL, "FLOATING_TEXT_TONE_MISS": () => FLOATING_TEXT_TONE_MISS, "FLOATING_TEXT_TONE_NORMAL": () => FLOATING_TEXT_TONE_NORMAL, "floatingTexts": () => floatingTexts, "floor": () => floor, "flowId": () => flowId, "flying": () => flying, "focus": () => focus, "focusin": () => focusin, "focusRadius": () => focusRadius, "font": () => font, "fontSize": () => fontSize, "force": () => force, "Force": () => Force, "forceIdleMode": () => forceIdleMode, "forceUltraShinyAll": () => forceUltraShinyAll, "forEach": () => forEach, "formatCompactNumber": () => formatCompactNumber, "formatPokedexCompletionPercentFromRatio": () => formatPokedexCompletionPercentFromRatio, "formatPokedexSpeciesProgressPercent": () => formatPokedexSpeciesProgressPercent, "formatPokemonRangeLabel": () => formatPokemonRangeLabel, "formatTalentLabelFr": () => formatTalentLabelFr, "formatTypeLabelFr": () => formatTypeLabelFr, "formatTypeListFr": () => formatTypeListFr, "fps": () => fps, "FPS": () => FPS, "fps_estimate": () => fps_estimate, "fr": () => fr, "FR": () => FR, "fractionDigits": () => fractionDigits, "fragment": () => fragment, "frame_index": () => frame_index, "frame_ms_estimate": () => frame_ms_estimate, "frameIndex": () => frameIndex, "frameMs": () => frameMs, "frames": () => frames, "frenchTypography": () => frenchTypography, "from": () => from, "from_id": () => from_id, "from_name_fr": () => from_name_fr, "fromDef": () => fromDef, "fromEntries": () => fromEntries, "fromId": () => fromId, "fromNameFr": () => fromNameFr, "fromX": () => fromX, "fromY": () => fromY, "front": () => front, "frontPath": () => frontPath, "frontRatio": () => frontRatio, "fulfilled": () => fulfilled, "fullscreenElement": () => fullscreenElement, "fullscreenTarget": () => fullscreenTarget, "fullText": () => fullText, "fully": () => fully, "fx": () => fx, "fy": () => fy, "g": () => g, "gacha": () => gacha, "Gacha": () => Gacha, "GACHA_BASE_MAX_POKEMON_ID": () => GACHA_BASE_MAX_POKEMON_ID, "GACHA_EXTENDED_MAX_POKEMON_ID": () => GACHA_EXTENDED_MAX_POKEMON_ID, "gacha_last_reward": () => gacha_last_reward, "gacha_last_rewards": () => gacha_last_rewards, "gacha_open": () => gacha_open, "gacha_pool_max_pokemon_id": () => gacha_pool_max_pokemon_id, "gacha_remaining_candidates_151": () => gacha_remaining_candidates_151, "gacha_remaining_candidates_current_pool": () => gacha_remaining_candidates_current_pool, "GACHA_SPIN_COST_COINS": () => GACHA_SPIN_COST_COINS, "gacha_spinning": () => gacha_spinning, "gachaCandidateCount": () => gachaCandidateCount, "gachaOpen": () => gachaOpen, "gameOverlayEl": () => gameOverlayEl, "gameStageEl": () => gameStageEl, "gap": () => gap, "gauche": () => gauche, "gear": () => gear, "get": () => get, "get_runtime_client_type": () => get_runtime_client_type, "getActiveBallType": () => getActiveBallType, "getAttackBoostRemainingMs": () => getAttackBoostRemainingMs, "getBackgroundDriftOffset": () => getBackgroundDriftOffset, "getBackgroundDriftRangePx": () => getBackgroundDriftRangePx, "getBallCaptureMenuBallType": () => getBallCaptureMenuBallType, "getBallCaptureRulesForType": () => getBallCaptureRulesForType, "getBallInventoryCount": () => getBallInventoryCount, "getBallInventoryOverlayRows": () => getBallInventoryOverlayRows, "getBallRenderTheme": () => getBallRenderTheme, "getBaseStatTotal": () => getBaseStatTotal, "getBattleViewportProfile": () => getBattleViewportProfile, "getBottomHudSafeEdge": () => getBottomHudSafeEdge, "getBoundingClientRect": () => getBoundingClientRect, "getCachedSpriteImage": () => getCachedSpriteImage, "getCapturedEntityBoxesEntries": () => getCapturedEntityBoxesEntries, "getCapturedEntityCount": () => getCapturedEntityCount, "getCapturedTotal": () => getCapturedTotal, "getCaptureEnemyVisual": () => getCaptureEnemyVisual, "getCaptureSequence": () => getCaptureSequence, "getCaptureSequenceState": () => getCaptureSequenceState, "getColorLuminance": () => getColorLuminance, "getComputedStyle": () => getComputedStyle, "getCurrentAttackIntervalMs": () => getCurrentAttackIntervalMs, "getCurrentGachaMaxPokemonId": () => getCurrentGachaMaxPokemonId, "getCurrentGachaPokemonRangeLabel": () => getCurrentGachaPokemonRangeLabel, "getCurrentPokedexMaxPokemonId": () => getCurrentPokedexMaxPokemonId, "getDrawableImageDimensions": () => getDrawableImageDimensions, "getElementClientHeight": () => getElementClientHeight, "getEnemy": () => getEnemy, "getEnemyDamageFlashBlend": () => getEnemyDamageFlashBlend, "getEnemyHitPulseRatio": () => getEnemyHitPulseRatio, "getEnemyHpDisplayRatios": () => getEnemyHpDisplayRatios, "getEnemyHpPalette": () => getEnemyHpPalette, "getEnemyOwnershipBadgeState": () => getEnemyOwnershipBadgeState, "getEnemySpriteRenderSize": () => getEnemySpriteRenderSize, "getEnemyTimerState": () => getEnemyTimerState, "getEntityOffensiveType": () => getEntityOffensiveType, "getEnvironmentSnapshotForRender": () => getEnvironmentSnapshotForRender, "getEvolutionFamilySpeciesIds": () => getEvolutionFamilySpeciesIds, "getFamilyShinyCaptureCount": () => getFamilyShinyCaptureCount, "getFamilyUltraShinyCaptureCount": () => getFamilyUltraShinyCaptureCount, "getFittedFontMetrics": () => getFittedFontMetrics, "getFloatingTexts": () => getFloatingTexts, "getFloatingTextTonePalette": () => getFloatingTextTonePalette, "getGachaSkinCandidates": () => getGachaSkinCandidates, "getHitEffects": () => getHitEffects, "getHoveredTeamSlotPulse": () => getHoveredTeamSlotPulse, "getInitialAssetRouteIds": () => getInitialAssetRouteIds, "getKoTransition": () => getKoTransition, "getLastTurnEvent": () => getLastTurnEvent, "getLegendaryFieldAttackIntervalMultiplier": () => getLegendaryFieldAttackIntervalMultiplier, "getLegendaryFieldPresence": () => getLegendaryFieldPresence, "getMorphingPaletteMappedTexture": () => getMorphingPaletteMappedTexture, "getMorphingWobbleTransform": () => getMorphingWobbleTransform, "getNextRouteId": () => getNextRouteId, "getNextTurnPreview": () => getNextTurnPreview, "getNormalizedPointerType": () => getNormalizedPointerType, "getOrderedCatalogRouteIds": () => getOrderedCatalogRouteIds, "getOrderedUnlockedRouteIds": () => getOrderedUnlockedRouteIds, "getOverlayPaddingSnapshot": () => getOverlayPaddingSnapshot, "getOwnedSpriteVariantsForRecord": () => getOwnedSpriteVariantsForRecord, "getPassiveBehaviorIdForTalentId": () => getPassiveBehaviorIdForTalentId, "getPokedexEntries": () => getPokedexEntries, "getPokedexEntryByPokemonId": () => getPokedexEntryByPokemonId, "getPokedexPreferredOfflineVariantId": () => getPokedexPreferredOfflineVariantId, "getPokedexPreferredSpriteVariantFromDef": () => getPokedexPreferredSpriteVariantFromDef, "getPokedexSpeciesCatalogByPokemonId": () => getPokedexSpeciesCatalogByPokemonId, "getPokedexSpeciesProgressCounters": () => getPokedexSpeciesProgressCounters, "getPokedexVariantPreferenceByPokemonId": () => getPokedexVariantPreferenceByPokemonId, "getPokedexVirtualMetrics": () => getPokedexVirtualMetrics, "getPokemonBreathTransform": () => getPokemonBreathTransform, "getPokemonDataSpriteScale": () => getPokemonDataSpriteScale, "getPokemonDisplayNameById": () => getPokemonDisplayNameById, "getPokemonDisplayNameForOwnedEntity": () => getPokemonDisplayNameForOwnedEntity, "getPokemonEntityRecord": () => getPokemonEntityRecord, "getPokemonLoadTargets": () => getPokemonLoadTargets, "getPokemonNicknameById": () => getPokemonNicknameById, "getPokemonNicknameLength": () => getPokemonNicknameLength, "getPokemonSpriteRenderSize": () => getPokemonSpriteRenderSize, "getPokemonTalentCsvForPokemonId": () => getPokemonTalentCsvForPokemonId, "getPreferredDefaultSpriteVariant": () => getPreferredDefaultSpriteVariant, "getProjectiles": () => getProjectiles, "getProjectileSprite": () => getProjectileSprite, "getProjectileTrailTypeVfxProfile": () => getProjectileTrailTypeVfxProfile, "getProjectileTypeVfxProfile": () => getProjectileTypeVfxProfile, "getRenderQualitySettings": () => getRenderQualitySettings, "getRouteBaseEncounterEntries": () => getRouteBaseEncounterEntries, "getRouteDataByIds": () => getRouteDataByIds, "getRouteDataListFromInput": () => getRouteDataListFromInput, "getRouteDefeatCount": () => getRouteDefeatCount, "getRouteDisplayName": () => getRouteDisplayName, "getRouteFallbackPalette": () => getRouteFallbackPalette, "getRouteUnlockDefeatTarget": () => getRouteUnlockDefeatTarget, "getRouteUnlockMode": () => getRouteUnlockMode, "getRouteUnlockProgressState": () => getRouteUnlockProgressState, "getRouteZoneType": () => getRouteZoneType, "getRuntimeClientType": () => getRuntimeClientType, "getSaveBackendTelemetryValue": () => getSaveBackendTelemetryValue, "getScreenPerimeterPoint": () => getScreenPerimeterPoint, "getSelectedOwnedSpriteVariantForRecord": () => getSelectedOwnedSpriteVariantForRecord, "getSelectedShopBallQuantity": () => getSelectedShopBallQuantity, "getShinySparkleCountForQuality": () => getShinySparkleCountForQuality, "getShopItemCount": () => getShopItemCount, "getSlotAttackFlashBlend": () => getSlotAttackFlashBlend, "getSlotChargeGlow": () => getSlotChargeGlow, "getSlotRecoilOffset": () => getSlotRecoilOffset, "getSlotSkipTurnVisual": () => getSlotSkipTurnVisual, "getSlotTeleportScale": () => getSlotTeleportScale, "getSortedBallConfigs": () => getSortedBallConfigs, "getSpeciesStatsSummary": () => getSpeciesStatsSummary, "getSpriteSnapFactor": () => getSpriteSnapFactor, "getSpriteVariantDisplayLabel": () => getSpriteVariantDisplayLabel, "getSpriteVariantsForDef": () => getSpriteVariantsForDef, "getTeamAuraAttackBonusBySlot": () => getTeamAuraAttackBonusBySlot, "getTeamBoxesAccessState": () => getTeamBoxesAccessState, "getTeamBoxesLockedMessage": () => getTeamBoxesLockedMessage, "getTeamDragActivationDistancePx": () => getTeamDragActivationDistancePx, "getTeamSlotLabel": () => getTeamSlotLabel, "getTeamSpriteScale": () => getTeamSpriteScale, "getTeamXpDisplayRatios": () => getTeamXpDisplayRatios, "getTeamXpPulseScale": () => getTeamXpPulseScale, "getTeleportBoostVisualIntensityForSlot": () => getTeleportBoostVisualIntensityForSlot, "getTeleportDamageBoostForSlot": () => getTeleportDamageBoostForSlot, "getTotalShinyCapturesGlobal": () => getTotalShinyCapturesGlobal, "getTurnIndicator": () => getTurnIndicator, "getTutorialFlowDefinition": () => getTutorialFlowDefinition, "getTutorialProgress": () => getTutorialProgress, "getTypeColor": () => getTypeColor, "getTypeMultiplier": () => getTypeMultiplier, "getUiAnimationState": () => getUiAnimationState, "getUltraShinyOutlineTexture": () => getUltraShinyOutlineTexture, "getUltraShinyShaderConfig": () => getUltraShinyShaderConfig, "getVariantShinySpritePath": () => getVariantShinySpritePath, "getWorldCoordinatesFromPointerEvent": () => getWorldCoordinatesFromPointerEvent, "getXpToNextLevelForSpecies": () => getXpToNextLevelForSpecies, "getZoneEncounterCsvForRoute": () => getZoneEncounterCsvForRoute, "ghost": () => ghost, "ghostSize": () => ghostSize, "global": () => global, "globalAlpha": () => globalAlpha, "globalCompositeOperation": () => globalCompositeOperation, "glow": () => glow, "glow_ratio": () => glow_ratio, "glowCore": () => glowCore, "glowOuter": () => glowOuter, "glowRadius": () => glowRadius, "glowRatio": () => glowRatio, "GPUs": () => GPUs, "grab": () => grab, "grabbing": () => grabbing, "gradient": () => gradient, "grass": () => grass, "grayscaleBlend": () => grayscaleBlend, "gridTemplateColumns": () => gridTemplateColumns, "grotte": () => grotte, "ground": () => ground, "groundOffsetY": () => groundOffsetY, "growthEase": () => growthEase, "growthRatio": () => growthRatio, "halfSpread": () => halfSpread, "handleCanvasClick": () => handleCanvasClick, "handleCanvasContextMenu": () => handleCanvasContextMenu, "handleCanvasPointerCancel": () => handleCanvasPointerCancel, "handleCanvasPointerDown": () => handleCanvasPointerDown, "handleCanvasPointerMove": () => handleCanvasPointerMove, "handleCanvasPointerUp": () => handleCanvasPointerUp, "handlePokedexCardInteractionEvent": () => handlePokedexCardInteractionEvent, "handleWindowPointerUpOutsideCanvas": () => handleWindowPointerUpOutsideCanvas, "hardResetApplied": () => hardResetApplied, "has": () => has, "has_pokemon": () => has_pokemon, "hasAnyTintPass": () => hasAnyTintPass, "hasCriticalLabel": () => hasCriticalLabel, "hasCustomName": () => hasCustomName, "hasEffectivenessLabel": () => hasEffectivenessLabel, "hasFamilyConflict": () => hasFamilyConflict, "hashStringToUnit": () => hashStringToUnit, "hasImplementedTalentEffect": () => hasImplementedTalentEffect, "hasMissingRoutePokemonDefinitions": () => hasMissingRoutePokemonDefinitions, "hasNickname": () => hasNickname, "hasOverlayHover": () => hasOverlayHover, "hasOwnProperty": () => hasOwnProperty, "hasPointerCapture": () => hasPointerCapture, "hasRouteUnlockedInSaveData": () => hasRouteUnlockedInSaveData, "hasRuntimeSlots": () => hasRuntimeSlots, "hasSaveSlots": () => hasSaveSlots, "hasShaderColorize": () => hasShaderColorize, "hasTeamMembers": () => hasTeamMembers, "hasUnknownCaveUnlockedInSave": () => hasUnknownCaveUnlockedInSave, "headerLine": () => headerLine, "height": () => height, "heightOffset": () => heightOffset, "hidden": () => hidden, "HIDDEN_SIM_BUDGET_MS": () => HIDDEN_SIM_BUDGET_MS, "hideHoverPopup": () => hideHoverPopup, "hideLoadingScreen": () => hideLoadingScreen, "hideModalWithTween": () => hideModalWithTween, "hidePopupWithTween": () => hidePopupWithTween, "hideStarterModal": () => hideStarterModal, "hiding": () => hiding, "high": () => high, "highlight": () => highlight, "hint": () => hint, "hintsById": () => hintsById, "hitbox": () => hitbox, "hitboxes": () => hitboxes, "hitEffects": () => hitEffects, "hitRadiusScale": () => hitRadiusScale, "horizontalPadding": () => horizontalPadding, "hors": () => hors, "hover": () => hover, "hover_popup_visible": () => hover_popup_visible, "hovered": () => hovered, "hovered_team_slot_index": () => hovered_team_slot_index, "hoveredBallOverlay": () => hoveredBallOverlay, "hoveredBallOverlayType": () => hoveredBallOverlayType, "hoveredSlot": () => hoveredSlot, "hoveredTeamSlot": () => hoveredTeamSlot, "hoveredTeamSlotIndex": () => hoveredTeamSlotIndex, "hoveredType": () => hoveredType, "hoverEntry": () => hoverEntry, "hoverLift": () => hoverLift, "hoverPopupEl": () => hoverPopupEl, "hoverPulse": () => hoverPulse, "hoverScale": () => hoverScale, "HP": () => HP, "hp_current": () => hp_current, "hp_max": () => hp_max, "hpBarHeight": () => hpBarHeight, "hpBarMaxY": () => hpBarMaxY, "hpBarMinY": () => hpBarMinY, "hpBarWidth": () => hpBarWidth, "hpBarY": () => hpBarY, "hpCurrent": () => hpCurrent, "hpLabel": () => hpLabel, "hpMax": () => hpMax, "hpTextMinSize": () => hpTextMinSize, "hpTextSize": () => hpTextSize, "hsl": () => hsl, "hsla": () => hsla, "HTMLButtonElement": () => HTMLButtonElement, "HTMLElement": () => HTMLElement, "HTMLImageElement": () => HTMLImageElement, "hud": () => hud, "hudAnchorY": () => hudAnchorY, "hudCenterX": () => hudCenterX, "hudCenterY": () => hudCenterY, "hudDepthScale": () => hudDepthScale, "hudDirectionX": () => hudDirectionX, "hudDirectionY": () => hudDirectionY, "hudHeight": () => hudHeight, "hudTopY": () => hudTopY, "hudTypeChipHeight": () => hudTypeChipHeight, "hudWidth": () => hudWidth, "hudXOffset": () => hudXOffset, "hudYOffset": () => hudYOffset, "hue": () => hue, "huePrimary": () => huePrimary, "hueRotateDeg": () => hueRotateDeg, "hueSecondary": () => hueSecondary, "hyper_ball": () => hyper_ball, "hypot": () => hypot, "i": () => i, "ice": () => ice, "ici": () => ici, "iconBottom": () => iconBottom, "iconCenterX": () => iconCenterX, "iconDrawSize": () => iconDrawSize, "icones": () => icones, "iconScale": () => iconScale, "iconSize": () => iconSize, "iconTextGap": () => iconTextGap, "iconTop": () => iconTop, "id": () => id, "idRaw": () => idRaw, "idx": () => idx, "Ignore": () => Ignore, "ignoredIndex": () => ignoredIndex, "ignoredSlotIndex": () => ignoredSlotIndex, "image": () => image, "Image": () => Image, "imageSmoothingEnabled": () => imageSmoothingEnabled, "img": () => img, "immediate": () => immediate, "impact": () => impact, "impossible": () => impossible, "Impossible": () => Impossible, "inAnotherSlot": () => inAnotherSlot, "includes": () => includes, "includeShiny": () => includeShiny, "incoherente": () => incoherente, "inconnu": () => inconnu, "inconnue": () => inconnue, "index": () => index, "indexOf": () => indexOf, "indicator": () => indicator, "Indispo": () => Indispo, "indisponible": () => indisponible, "infos": () => infos, "inhale": () => inhale, "initialAssetRouteData": () => initialAssetRouteData, "initialAssetRouteIds": () => initialAssetRouteIds, "initialized": () => initialized, "initializeScene": () => initializeScene, "initializeWindowsNotificationSystem": () => initializeWindowsNotificationSystem, "initialRouteId": () => initialRouteId, "innerHeight": () => innerHeight, "innerHTML": () => innerHTML, "innerWidth": () => innerWidth, "inTeamIndex": () => inTeamIndex, "intensity": () => intensity, "interne": () => interne, "invalidatePokedexEntriesCache": () => invalidatePokedexEntriesCache, "invert": () => invert, "invertPrimary": () => invertPrimary, "invertSecondary": () => invertSecondary, "inward": () => inward, "is": () => is, "is_shiny": () => is_shiny, "is_ultra_shiny": () => is_ultra_shiny, "isActionDockFullscreenMenuOpen": () => isActionDockFullscreenMenuOpen, "isAppearanceEditorUnlocked": () => isAppearanceEditorUnlocked, "isArray": () => isArray, "isCanvasBattleInteractionBlocked": () => isCanvasBattleInteractionBlocked, "isClosing": () => isClosing, "isCoarsePointerDevice": () => isCoarsePointerDevice, "isCompactViewport": () => isCompactViewport, "isCritical": () => isCritical, "isCurrent": () => isCurrent, "isCurrentRouteCombatEnabled": () => isCurrentRouteCombatEnabled, "isDrawableImage": () => isDrawableImage, "isEffectivenessLine": () => isEffectivenessLine, "isEnabled": () => isEnabled, "isEnemyRespawning": () => isEnemyRespawning, "isEntityUnlocked": () => isEntityUnlocked, "isEventFromActiveTeamDragPointer": () => isEventFromActiveTeamDragPointer, "isEvolutionFamilyOwned": () => isEvolutionFamilyOwned, "isFinite": () => isFinite, "isHovered": () => isHovered, "isInteger": () => isInteger, "isKo": () => isKo, "isMiss": () => isMiss, "isOnlyOneTimer": () => isOnlyOneTimer, "isPhone": () => isPhone, "isPhoneViewport": () => isPhoneViewport, "isPostUnknownCaveContentUnlocked": () => isPostUnknownCaveContentUnlocked, "isPrimary": () => isPrimary, "isPrimaryCanvasPointerEvent": () => isPrimaryCanvasPointerEvent, "isPrimaryCriticalLine": () => isPrimaryCriticalLine, "isShiny": () => isShiny, "isShinyAppearanceUnlockedForRecord": () => isShinyAppearanceUnlockedForRecord, "isShinyNegativeFallbackVisual": () => isShinyNegativeFallbackVisual, "isShinyVisual": () => isShinyVisual, "isTeamDragClickSuppressed": () => isTeamDragClickSuppressed, "isTeamSlotSwapAllowed": () => isTeamSlotSwapAllowed, "isTouchLikePointerType": () => isTouchLikePointerType, "isUltraShiny": () => isUltraShiny, "isUltraShinyAppearanceUnlockedForRecord": () => isUltraShinyAppearanceUnlockedForRecord, "isUltraShinyVisual": () => isUltraShinyVisual, "it": () => it, "item": () => item, "Item": () => Item, "item_type": () => item_type, "items": () => items, "itemType": () => itemType, "jeu": () => jeu, "jitterX": () => jitterX, "jitterY": () => jitterY, "join": () => join, "jouable": () => jouable, "jour": () => jour, "json": () => json, "JSON": () => JSON, "Keep": () => Keep, "key": () => key, "keys": () => keys, "kind": () => kind, "ko_transition": () => ko_transition, "koTransition": () => koTransition, "l": () => l, "la": () => la, "La": () => La, "label": () => label, "labelEl": () => labelEl, "labelFr": () => labelFr, "labelPrimary": () => labelPrimary, "labels": () => labels, "labelSecondary": () => labelSecondary, "labelX": () => labelX, "labelY": () => labelY, "lag": () => lag, "lagRatio": () => lagRatio, "last_impact": () => last_impact, "last_turn_event": () => last_turn_event, "lastImpact": () => lastImpact, "lastRawValue": () => lastRawValue, "lastReward": () => lastReward, "lastRewards": () => lastRewards, "layout": () => layout, "LAYOUT_RECOMPUTE_INTERVAL_MS": () => LAYOUT_RECOMPUTE_INTERVAL_MS, "layoutCacheKey": () => layoutCacheKey, "layoutRefresh": () => layoutRefresh, "le": () => le, "leaf": () => leaf, "leafAngle": () => leafAngle, "left": () => left, "leftBadgeWidth": () => leftBadgeWidth, "leftGradient": () => leftGradient, "leftInset": () => leftInset, "legendary_field_attack_interval_multiplier": () => legendary_field_attack_interval_multiplier, "LEGENDARY_FIELD_VFX_THEME_BY_KEY": () => LEGENDARY_FIELD_VFX_THEME_BY_KEY, "legendary_fields_active": () => legendary_fields_active, "legendaryFieldAttackIntervalMultiplier": () => legendaryFieldAttackIntervalMultiplier, "legendaryFieldPresence": () => legendaryFieldPresence, "length": () => length, "lerpColorChannel": () => lerpColorChannel, "lerpNumber": () => lerpNumber, "les": () => les, "level": () => level, "levelBaseline": () => levelBaseline, "levelBaseSize": () => levelBaseSize, "levelEl": () => levelEl, "levelFontSize": () => levelFontSize, "levelGap": () => levelGap, "levelMetrics": () => levelMetrics, "levelText": () => levelText, "levelUpParticleStride": () => levelUpParticleStride, "life_ms": () => life_ms, "lifeMs": () => lifeMs, "lifeRatio": () => lifeRatio, "lifetimeMs": () => lifetimeMs, "lift": () => lift, "liftPx": () => liftPx, "liftRatio": () => liftRatio, "lighter": () => lighter, "line": () => line, "lineCap": () => lineCap, "lineGap": () => lineGap, "lineJoin": () => lineJoin, "lineLength": () => lineLength, "lineTargetX": () => lineTargetX, "lineTargetY": () => lineTargetY, "lineTo": () => lineTo, "lineWidth": () => lineWidth, "list": () => list, "liste": () => liste, "load": () => load, "loadBallConfigCsv": () => loadBallConfigCsv, "loaded": () => loaded, "loadedBatch": () => loadedBatch, "loadImage": () => loadImage, "loading": () => loading, "LOADING_SCREEN_DEFAULT_TEXT": () => LOADING_SCREEN_DEFAULT_TEXT, "loadingIndicator": () => loadingIndicator, "loadPokemonDefinitions": () => loadPokemonDefinitions, "loadPokemonEntity": () => loadPokemonEntity, "loadPokemonTalentCsv": () => loadPokemonTalentCsv, "loadRouteCatalog": () => loadRouteCatalog, "loadRouteData": () => loadRouteData, "loadSaveData": () => loadSaveData, "loadShopItemConfigCsv": () => loadShopItemConfigCsv, "loadZoneEncounterCsv": () => loadZoneEncounterCsv, "local_hour": () => local_hour, "local_minute": () => local_minute, "local_time": () => local_time, "local_time_of_day": () => local_time_of_day, "locale": () => locale, "localHour": () => localHour, "localMinute": () => localMinute, "localMs": () => localMs, "localStorage": () => localStorage, "localTimeLabel": () => localTimeLabel, "lock": () => lock, "locked": () => locked, "lockMark": () => lockMark, "log10": () => log10, "loopRatio": () => loopRatio, "low": () => low, "luminance": () => luminance, "Lv$": () => Lv$, "Machine": () => Machine, "main": () => main, "mainFontSize": () => mainFontSize, "mainText": () => mainText, "manquante": () => manquante, "map": () => map, "Map": () => Map, "map_open": () => map_open, "mapOpen": () => mapOpen, "mapping": () => mapping, "margin": () => margin, "mark": () => mark, "Masquer": () => Masquer, "match": () => match, "matchesActiveDragPointer": () => matchesActiveDragPointer, "Math": () => Math, "max": () => max, "max_level": () => max_level, "MAX_LEVEL": () => MAX_LEVEL, "MAX_TEAM_SIZE": () => MAX_TEAM_SIZE, "maxBottom": () => maxBottom, "maxHpLabelWidth": () => maxHpLabelWidth, "maxId": () => maxId, "maximumFractionDigits": () => maximumFractionDigits, "maxLeft": () => maxLeft, "maxLevel": () => maxLevel, "maxLifeMs": () => maxLifeMs, "maxOrbRadius": () => maxOrbRadius, "maxPokemonId": () => maxPokemonId, "maxReservedVertical": () => maxReservedVertical, "maxTop": () => maxTop, "maxValueWidth": () => maxValueWidth, "maxWidth": () => maxWidth, "measuredWidth": () => measuredWidth, "measureText": () => measureText, "medium": () => medium, "member": () => member, "memberId": () => memberId, "memberLevel": () => memberLevel, "memberShader": () => memberShader, "meme": () => meme, "menu": () => menu, "menuEl": () => menuEl, "menuRect": () => menuRect, "merged": () => merged, "mergedColorize": () => mergedColorize, "mergeRouteEncountersFromCsv": () => mergeRouteEncountersFromCsv, "mergeSpriteShaderConfig": () => mergeSpriteShaderConfig, "message": () => message, "metamorph": () => metamorph, "methods": () => methods, "metrics": () => metrics, "mid": () => mid, "middle": () => middle, "midY": () => midY, "min": () => min, "min_level": () => min_level, "minCardWidth": () => minCardWidth, "minimumFractionDigits": () => minimumFractionDigits, "minLevel": () => minLevel, "minmax": () => minmax, "minOrbRadius": () => minOrbRadius, "minRenderSizePx": () => minRenderSizePx, "minSize": () => minSize, "mise": () => mise, "missed": () => missed, "missing": () => missing, "mobile": () => mobile, "mode": () => mode, "Mode": () => Mode, "moment": () => moment, "mon": () => mon, "money": () => money, "money_display_value": () => money_display_value, "moneyHud": () => moneyHud, "MORPHING_COLORIZE_FALLBACK_RGB": () => MORPHING_COLORIZE_FALLBACK_RGB, "MORPHING_MOTION_INTENSITY": () => MORPHING_MOTION_INTENSITY, "MORPHING_OUTLINE_ALPHA": () => MORPHING_OUTLINE_ALPHA, "MORPHING_OUTLINE_PX": () => MORPHING_OUTLINE_PX, "MORPHING_OUTLINE_RGB": () => MORPHING_OUTLINE_RGB, "MORPHING_SLIME_ALPHA": () => MORPHING_SLIME_ALPHA, "MORPHING_SLIME_BASE_RGB": () => MORPHING_SLIME_BASE_RGB, "MORPHING_SLIME_HIGHLIGHT_RGB": () => MORPHING_SLIME_HIGHLIGHT_RGB, "MORPHING_WOBBLE_OFFSET_RATIO": () => MORPHING_WOBBLE_OFFSET_RATIO, "MORPHING_WOBBLE_ROTATION_DEG": () => MORPHING_WOBBLE_ROTATION_DEG, "MORPHING_WOBBLE_SCALE_AMPLITUDE": () => MORPHING_WOBBLE_SCALE_AMPLITUDE, "MORPHING_WOBBLE_SHEAR": () => MORPHING_WOBBLE_SHEAR, "MORPHING_WOBBLE_VERTICAL_COMPENSATION": () => MORPHING_WOBBLE_VERTICAL_COMPENSATION, "morphingSeed": () => morphingSeed, "morphingShaderForTransform": () => morphingShaderForTransform, "morphingSourceId": () => morphingSourceId, "morphingVisualActive": () => morphingVisualActive, "morphingWobble": () => morphingWobble, "motif": () => motif, "motionScale": () => motionScale, "mouse": () => mouse, "mouseenter": () => mouseenter, "mouseover": () => mouseover, "movementDistance": () => movementDistance, "movementX": () => movementX, "movementY": () => movementY, "moveTo": () => moveTo, "ms": () => ms, "MS": () => MS, "multiplier": () => multiplier, "multiply": () => multiply, "multiplyOrDefault": () => multiplyOrDefault, "mystere": () => mystere, "n": () => n, "N": () => N, "name": () => name, "name_en": () => name_en, "name_fr": () => name_fr, "nameBaseline": () => nameBaseline, "nameBaseSize": () => nameBaseSize, "nameCard": () => nameCard, "nameEl": () => nameEl, "nameEn": () => nameEn, "nameEnRaw": () => nameEnRaw, "nameFontSize": () => nameFontSize, "nameFr": () => nameFr, "nameMetrics": () => nameMetrics, "nameText": () => nameText, "nameTextMaxWidth": () => nameTextMaxWidth, "nameX": () => nameX, "naturalWidth": () => naturalWidth, "navigator": () => navigator, "nettoyee": () => nettoyee, "next": () => next, "next_attacker": () => next_attacker, "next_attacker_slot_index": () => next_attacker_slot_index, "next_route_id": () => next_route_id, "next_route_name_fr": () => next_route_name_fr, "next_turn_action": () => next_turn_action, "next_turn_passive_behavior_id": () => next_turn_passive_behavior_id, "next_turn_reason": () => next_turn_reason, "nextCaptureAll": () => nextCaptureAll, "nextConfigByType": () => nextConfigByType, "nextDisplayName": () => nextDisplayName, "nextExtraShopItemsById": () => nextExtraShopItemsById, "nextIndex": () => nextIndex, "nextLabel": () => nextLabel, "nextNickname": () => nextNickname, "nextOpen": () => nextOpen, "nextRecomputeAtMs": () => nextRecomputeAtMs, "nextRouteId": () => nextRouteId, "nextRules": () => nextRules, "nextShinyMode": () => nextShinyMode, "nextTurnPreview": () => nextTurnPreview, "nextType": () => nextType, "nextUltraMode": () => nextUltraMode, "nextUltraShinyMode": () => nextUltraShinyMode, "nextUnlocked": () => nextUnlocked, "nextUpdateAtMs": () => nextUpdateAtMs, "nickname": () => nickname, "night": () => night, "night_factor": () => night_factor, "nightGradient": () => nightGradient, "niv": () => niv, "Niv": () => Niv, "niveau": () => niveau, "Niveau": () => Niveau, "no": () => no, "non": () => non, "none": () => none, "normal": () => normal, "normalizeBallConfigFromCsvRow": () => normalizeBallConfigFromCsvRow, "normalizeBallTypeForVisual": () => normalizeBallTypeForVisual, "normalizedId": () => normalizedId, "normalizedNameEn": () => normalizedNameEn, "normalizedPointerType": () => normalizedPointerType, "normalizedType": () => normalizedType, "normalizedUnlocked": () => normalizedUnlocked, "normalizedVariantId": () => normalizedVariantId, "normalizeEncounterFromCsvRow": () => normalizeEncounterFromCsvRow, "normalizePokedexSpeciesNameEn": () => normalizePokedexSpeciesNameEn, "normalizePokemonEntityRecord": () => normalizePokemonEntityRecord, "normalizePokemonTalentFromCsvRow": () => normalizePokemonTalentFromCsvRow, "normalizeRgbColor": () => normalizeRgbColor, "normalizeRouteDefeatCounts": () => normalizeRouteDefeatCounts, "normalizeShopItemConfigFromCsvRow": () => normalizeShopItemConfigFromCsvRow, "normalizeShopQuantityMode": () => normalizeShopQuantityMode, "normalizeSpriteVariantId": () => normalizeSpriteVariantId, "normalizeStatsPayload": () => normalizeStatsPayload, "normalizeTalentDefinition": () => normalizeTalentDefinition, "normalizeTalentId": () => normalizeTalentId, "normalizeType": () => normalizeType, "normalizeUiDisplayText": () => normalizeUiDisplayText, "normalizeUnlockedRouteIds": () => normalizeUnlockedRouteIds, "notifications": () => notifications, "notifications_active": () => notifications_active, "notifications_evolution_ready": () => notifications_evolution_ready, "notifications_temporary": () => notifications_temporary, "Nouveaux": () => Nouveaux, "nouvelle": () => nouvelle, "now": () => now, "nowMs": () => nowMs, "nowMsRaw": () => nowMsRaw, "number": () => number, "Number": () => Number, "numberEl": () => numberEl, "numeric": () => numeric, "numericA": () => numericA, "numericB": () => numericB, "numericDamage": () => numericDamage, "numericValue": () => numericValue, "nx": () => nx, "ny": () => ny, "object": () => object, "Object": () => Object, "observe": () => observe, "of": () => of, "OFF": () => OFF, "offensif": () => offensif, "offensive_type": () => offensive_type, "offensiveType": () => offensiveType, "offlineCatchupMs": () => offlineCatchupMs, "offlinePreferredPath": () => offlinePreferredPath, "offset": () => offset, "offsetWidth": () => offsetWidth, "offsetX": () => offsetX, "offsetY": () => offsetY, "ok": () => ok, "oldName": () => oldName, "on": () => on, "ON": () => ON, "once": () => once, "open": () => open, "openAppearanceForBoxPokemon": () => openAppearanceForBoxPokemon, "openAppearanceForPokemon": () => openAppearanceForPokemon, "openAppearanceForTeamSlot": () => openAppearanceForTeamSlot, "openBallCaptureMenu": () => openBallCaptureMenu, "openBoxesForTeamSlot": () => openBoxesForTeamSlot, "openPokedexModal": () => openPokedexModal, "openRenameModalForTeamSlot": () => openRenameModalForTeamSlot, "openTeamContextMenu": () => openTeamContextMenu, "options": () => options, "orbAlpha": () => orbAlpha, "orbit": () => orbit, "orbitRadius": () => orbitRadius, "orbitX": () => orbitX, "orbitY": () => orbitY, "orbRadius": () => orbRadius, "orderedRouteIds": () => orderedRouteIds, "organic": () => organic, "origin": () => origin, "original": () => original, "originalNameEl": () => originalNameEl, "oui": () => oui, "outline": () => outline, "outlinePx": () => outlinePx, "outlineRgb": () => outlineRgb, "over": () => over, "overlayPadding": () => overlayPadding, "overlayPaddingTop": () => overlayPaddingTop, "owned": () => owned, "ownedSet": () => ownedSet, "ownedVariants": () => ownedVariants, "ownershipBadges": () => ownershipBadges, "ox": () => ox, "oy": () => oy, "pad": () => pad, "paddingBottom": () => paddingBottom, "paddingLeft": () => paddingLeft, "paddingRight": () => paddingRight, "paddingTop": () => paddingTop, "paddingX": () => paddingX, "paddingY": () => paddingY, "padStart": () => padStart, "pageIndex": () => pageIndex, "pages": () => pages, "paisible": () => paisible, "palette": () => palette, "paletteKind": () => paletteKind, "paletteStrength": () => paletteStrength, "paletteStrengthPrimary": () => paletteStrengthPrimary, "paletteStrengthSecondary": () => paletteStrengthSecondary, "panelHeight": () => panelHeight, "panelPaddingX": () => panelPaddingX, "panelPaddingY": () => panelPaddingY, "panelTop": () => panelTop, "panelTopDefault": () => panelTopDefault, "panelTopDesktopAligned": () => panelTopDesktopAligned, "panelWidth": () => panelWidth, "panelX": () => panelX, "panelXRaw": () => panelXRaw, "panelY": () => panelY, "panelYRaw": () => panelYRaw, "par": () => par, "parseCsvMethods": () => parseCsvMethods, "parseCsvObjects": () => parseCsvObjects, "parseFloat": () => parseFloat, "parseRgbaColor": () => parseRgbaColor, "particle": () => particle, "particleColor": () => particleColor, "particleCount": () => particleCount, "particleIndex": () => particleIndex, "particles": () => particles, "particleScale": () => particleScale, "particleStride": () => particleStride, "partie": () => partie, "parts": () => parts, "pas": () => pas, "Passe": () => Passe, "passif": () => passif, "passive": () => passive, "passive_behavior_id": () => passive_behavior_id, "passiveBehaviorId": () => passiveBehaviorId, "path": () => path, "payload": () => payload, "pen": () => pen, "pending": () => pending, "pendingDesktopSerializedSave": () => pendingDesktopSerializedSave, "pendingRouteBackgroundLoads": () => pendingRouteBackgroundLoads, "pendingRouteDefinitionLoads": () => pendingRouteDefinitionLoads, "pendingSerializedSave": () => pendingSerializedSave, "pendingSimMs": () => pendingSimMs, "percent": () => percent, "performance": () => performance, "perimeter": () => perimeter, "period": () => period, "periodMs": () => periodMs, "persistSaveData": () => persistSaveData, "phase": () => phase, "phase_primary": () => phase_primary, "phase_secondary": () => phase_secondary, "phaseMs": () => phaseMs, "phaseOffset": () => phaseOffset, "phone": () => phone, "phoneLike": () => phoneLike, "PI": () => PI, "pickContrastingHudTextColor": () => pickContrastingHudTextColor, "pillHeight": () => pillHeight, "pillWidth": () => pillWidth, "playBottom": () => playBottom, "playHeight": () => playHeight, "playLeft": () => playLeft, "playRight": () => playRight, "playTop": () => playTop, "playWidth": () => playWidth, "png": () => png, "point": () => point, "pointer": () => pointer, "Pointer": () => Pointer, "pointerId": () => pointerId, "pointerPosition": () => pointerPosition, "pointerType": () => pointerType, "pointerX": () => pointerX, "pointerXRaw": () => pointerXRaw, "pointerY": () => pointerY, "pointerYRaw": () => pointerYRaw, "pointGlow": () => pointGlow, "pointIndex": () => pointIndex, "pointPhase": () => pointPhase, "pointRadius": () => pointRadius, "pointScale": () => pointScale, "pointSize": () => pointSize, "poison": () => poison, "Pok": () => Pok, "poke_ball": () => poke_ball, "pokeball": () => pokeball, "pokeballs": () => pokeballs, "pokedex": () => pokedex, "POKEDEX_BASE_MAX_POKEMON_ID": () => POKEDEX_BASE_MAX_POKEMON_ID, "POKEDEX_EXTENDED_MAX_POKEMON_ID": () => POKEDEX_EXTENDED_MAX_POKEMON_ID, "POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS": () => POKEDEX_FRLG_AVAILABLE_POST_KANTO_IDS, "pokedex_hover_pokemon_id": () => pokedex_hover_pokemon_id, "pokedex_max_pokemon_id": () => pokedex_max_pokemon_id, "pokedex_open": () => pokedex_open, "pokedex_species_count": () => pokedex_species_count, "POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS": () => POKEDEX_SPRITE_PREFETCH_EXTRA_ROWS, "POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3": () => POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3, "POKEDEX_VARIANT_PREFERENCE_GEN_4": () => POKEDEX_VARIANT_PREFERENCE_GEN_4, "POKEDEX_VIRTUAL_CARD_HEIGHT_PX": () => POKEDEX_VIRTUAL_CARD_HEIGHT_PX, "POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX": () => POKEDEX_VIRTUAL_CARD_MIN_WIDTH_PX, "POKEDEX_VIRTUAL_GAP_PX": () => POKEDEX_VIRTUAL_GAP_PX, "POKEDEX_VIRTUAL_OVERSCAN_ROWS": () => POKEDEX_VIRTUAL_OVERSCAN_ROWS, "pokedexCapturedStatEl": () => pokedexCapturedStatEl, "pokedexEncounteredStatEl": () => pokedexEncounteredStatEl, "pokedexEntriesCacheById": () => pokedexEntriesCacheById, "pokedexEntriesCacheCapturedSpeciesCount": () => pokedexEntriesCacheCapturedSpeciesCount, "pokedexEntriesCacheDirty": () => pokedexEntriesCacheDirty, "pokedexEntriesCacheEncounteredSpeciesCount": () => pokedexEntriesCacheEncounteredSpeciesCount, "pokedexEntriesCacheList": () => pokedexEntriesCacheList, "pokedexEntriesCachePokemonDefsCount": () => pokedexEntriesCachePokemonDefsCount, "pokedexEntriesCacheSaveDataRef": () => pokedexEntriesCacheSaveDataRef, "pokedexEntriesCacheShinySpeciesCount": () => pokedexEntriesCacheShinySpeciesCount, "pokedexEntriesCacheSpeciesRef": () => pokedexEntriesCacheSpeciesRef, "pokedexEntriesCacheUltraShinySpeciesCount": () => pokedexEntriesCacheUltraShinySpeciesCount, "pokedexGlobalCompletionEl": () => pokedexGlobalCompletionEl, "pokedexGridEl": () => pokedexGridEl, "pokedexHoverPokemonId": () => pokedexHoverPokemonId, "pokedexId": () => pokedexId, "pokedexInfoPanelEl": () => pokedexInfoPanelEl, "pokedexModalEl": () => pokedexModalEl, "pokedexOpen": () => pokedexOpen, "pokedexRenderRafHandle": () => pokedexRenderRafHandle, "pokedexShinyStatEl": () => pokedexShinyStatEl, "pokedexSpeciesByPokemonId": () => pokedexSpeciesByPokemonId, "pokedexSpeciesCsvByPokemonId": () => pokedexSpeciesCsvByPokemonId, "pokedexSpritePrefetchStateByPath": () => pokedexSpritePrefetchStateByPath, "pokedexSubtitleEl": () => pokedexSubtitleEl, "pokedexUltraShinyStatEl": () => pokedexUltraShinyStatEl, "pokedexViewportRenderRafHandle": () => pokedexViewportRenderRafHandle, "pokedexVirtualBottomSpacerEl": () => pokedexVirtualBottomSpacerEl, "pokedexVirtualColumnGapPx": () => pokedexVirtualColumnGapPx, "pokedexVirtualContentEl": () => pokedexVirtualContentEl, "pokedexVirtualEventsBound": () => pokedexVirtualEventsBound, "pokedexVirtualLastEndIndex": () => pokedexVirtualLastEndIndex, "pokedexVirtualLastSliceKey": () => pokedexVirtualLastSliceKey, "pokedexVirtualLastStartIndex": () => pokedexVirtualLastStartIndex, "pokedexVirtualLayoutCacheKey": () => pokedexVirtualLayoutCacheKey, "pokedexVirtualPaddingBottomPx": () => pokedexVirtualPaddingBottomPx, "pokedexVirtualPaddingLeftPx": () => pokedexVirtualPaddingLeftPx, "pokedexVirtualPaddingRightPx": () => pokedexVirtualPaddingRightPx, "pokedexVirtualPaddingTopPx": () => pokedexVirtualPaddingTopPx, "pokedexVirtualResizeObserver": () => pokedexVirtualResizeObserver, "pokedexVirtualRowGapPx": () => pokedexVirtualRowGapPx, "pokedexVirtualTopSpacerEl": () => pokedexVirtualTopSpacerEl, "Pokemon": () => Pokemon, "POKEMON_BACKDROP_ALPHA": () => POKEMON_BACKDROP_ALPHA, "POKEMON_BACKDROP_RADIUS_RATIO": () => POKEMON_BACKDROP_RADIUS_RATIO, "pokemon_data": () => pokemon_data, "pokemon_entities": () => pokemon_entities, "pokemon_id": () => pokemon_id, "pokemon_name_fr": () => pokemon_name_fr, "POKEMON_NICKNAME_MAX_LENGTH": () => POKEMON_NICKNAME_MAX_LENGTH, "POKEMON_SHADOW_ALPHA": () => POKEMON_SHADOW_ALPHA, "POKEMON_TALENTS_CSV_PATH": () => POKEMON_TALENTS_CSV_PATH, "pokemonDefsById": () => pokemonDefsById, "pokemonDefsCount": () => pokemonDefsCount, "pokemonId": () => pokemonId, "pokemonNameFr": () => pokemonNameFr, "pokemonTalentCsvByPokemonId": () => pokemonTalentCsvByPokemonId, "pokemonTalentCsvLoaded": () => pokemonTalentCsvLoaded, "pokemonTalentsCsvPath": () => pokemonTalentsCsvPath, "popupState": () => popupState, "popupX": () => popupX, "popupY": () => popupY, "portrait": () => portrait, "positionFloatingMenuElement": () => positionFloatingMenuElement, "positions": () => positions, "positive": () => positive, "post": () => post, "postList": () => postList, "pour": () => pour, "pow": () => pow, "power": () => power, "Prechargement": () => Prechargement, "precharger": () => precharger, "preferredId": () => preferredId, "preferredRadius": () => preferredRadius, "preferredRouteId": () => preferredRouteId, "preferredSlotIndex": () => preferredSlotIndex, "preferredVariant": () => preferredVariant, "preferredY": () => preferredY, "prefetchEnd": () => prefetchEnd, "prefetchPokedexSpritePath": () => prefetchPokedexSpritePath, "prefetchPokedexSpritesAroundSlice": () => prefetchPokedexSpritesAroundSlice, "prefetchStart": () => prefetchStart, "preloadedRouteIds": () => preloadedRouteIds, "preloadRadius": () => preloadRadius, "preloadRouteBackgrounds": () => preloadRouteBackgrounds, "preloadSelectedAppearanceAssetsForTeam": () => preloadSelectedAppearanceAssetsForTeam, "preloadTypeIcons": () => preloadTypeIcons, "preparedImage": () => preparedImage, "prete": () => prete, "preventDefault": () => preventDefault, "preview": () => preview, "previous": () => previous, "previousDisplayName": () => previousDisplayName, "previousFilter": () => previousFilter, "previousSmoothing": () => previousSmoothing, "previousTintSmoothing": () => previousTintSmoothing, "prevX": () => prevX, "prevY": () => prevY, "price": () => price, "primary": () => primary, "primaryPhase": () => primaryPhase, "primaryShader": () => primaryShader, "principal": () => principal, "profile": () => profile, "profileAlpha": () => profileAlpha, "progress": () => progress, "projectile": () => projectile, "PROJECTILE_VISUAL_PROFILE": () => PROJECTILE_VISUAL_PROFILE, "projectileAura": () => projectileAura, "projectiles": () => projectiles, "projectileStreak": () => projectileStreak, "Promise": () => Promise, "proprement": () => proprement, "prototype": () => prototype, "pseudoRandomUnit": () => pseudoRandomUnit, "psychic": () => psychic, "pulse": () => pulse, "pulseColor": () => pulseColor, "pulseMs": () => pulseMs, "pulseScale": () => pulseScale, "pulseStrength": () => pulseStrength, "push": () => push, "pushTemporaryNotification": () => pushTemporaryNotification, "px": () => px, "py": () => py, "quadraticCurveTo": () => quadraticCurveTo, "quality": () => quality, "qualityParticleScale": () => qualityParticleScale, "queue": () => queue, "queue_remaining": () => queue_remaining, "queueAppearanceTutorialIfNeeded": () => queueAppearanceTutorialIfNeeded, "queueDeferredRouteAssetWarmup": () => queueDeferredRouteAssetWarmup, "queuedIds": () => queuedIds, "queueOfflineCatchupFromSave": () => queueOfflineCatchupFromSave, "queuePokedexGridRender": () => queuePokedexGridRender, "queuePokedexViewportRender": () => queuePokedexViewportRender, "queueRoute1TutorialIfNeeded": () => queueRoute1TutorialIfNeeded, "r": () => r, "R": () => R, "radialDepthOffset": () => radialDepthOffset, "radius": () => radius, "radiusCap": () => radiusCap, "radiusFloor": () => radiusFloor, "radiusGrow": () => radiusGrow, "radiusMaxByLeft": () => radiusMaxByLeft, "radiusMaxByRight": () => radiusMaxByRight, "radiusMaxByTop": () => radiusMaxByTop, "radiusMinByEnemyClearance": () => radiusMinByEnemyClearance, "radiusMul": () => radiusMul, "radiusMultiplier": () => radiusMultiplier, "radiusStart": () => radiusStart, "radiusX": () => radiusX, "radiusXRatio": () => radiusXRatio, "radiusY": () => radiusY, "radiusYRatio": () => radiusYRatio, "rale": () => rale, "RATE": () => RATE, "ratio": () => ratio, "rawId": () => rawId, "rawKey": () => rawKey, "rawOutline": () => rawOutline, "rawPokemonId": () => rawPokemonId, "rawRatio": () => rawRatio, "rawRecord": () => rawRecord, "rawSpecies": () => rawSpecies, "readCsvBooleanCell": () => readCsvBooleanCell, "readCsvCell": () => readCsvCell, "readCsvNumberCell": () => readCsvNumberCell, "readCsvTypedValue": () => readCsvTypedValue, "readNumber": () => readNumber, "ready": () => ready, "realClockLastMs": () => realClockLastMs, "reappear": () => reappear, "reason": () => reason, "rebuildEvolutionStoneConfigState": () => rebuildEvolutionStoneConfigState, "rebuildShopItemConfigState": () => rebuildShopItemConfigState, "rebuildTeamAndSyncBattle": () => rebuildTeamAndSyncBattle, "recoilOffset": () => recoilOffset, "recommencer": () => recommencer, "reconcileAppearanceForEntityRecord": () => reconcileAppearanceForEntityRecord, "reconcileEntityAppearanceStates": () => reconcileEntityAppearanceStates, "reconcileEntityUnlockStates": () => reconcileEntityUnlockStates, "reconstruire": () => reconstruire, "record": () => record, "recordId": () => recordId, "recoveredTeam": () => recoveredTeam, "rect": () => rect, "reflow": () => reflow, "refresh": () => refresh, "refreshBallCaptureMenu": () => refreshBallCaptureMenu, "refreshBallConfigDerivedState": () => refreshBallConfigDerivedState, "refreshedRoute": () => refreshedRoute, "refreshLayoutIfNeeded": () => refreshLayoutIfNeeded, "refreshOrderedCatalogRouteIds": () => refreshOrderedCatalogRouteIds, "refreshPokedexEntriesCacheIfNeeded": () => refreshPokedexEntriesCacheIfNeeded, "refreshRenameCharCount": () => refreshRenameCharCount, "refreshRouteCatalogEncounterMapping": () => refreshRouteCatalogEncounterMapping, "refreshRouteUi": () => refreshRouteUi, "refreshTeamContextMenu": () => refreshTeamContextMenu, "rejected": () => rejected, "release": () => release, "releaseCanvasPointer": () => releaseCanvasPointer, "releasePointerCapture": () => releasePointerCapture, "reliably": () => reliably, "remaining_ms": () => remaining_ms, "remaining_ratio": () => remaining_ratio, "remainingDisplaySeconds": () => remainingDisplaySeconds, "remainingMs": () => remainingMs, "remainingRouteIds": () => remainingRouteIds, "remainingSeconds": () => remainingSeconds, "remove": () => remove, "removedDesktopSave": () => removedDesktopSave, "removedIndexedDb": () => removedIndexedDb, "removedLocalStorage": () => removedLocalStorage, "removedSessionStorage": () => removedSessionStorage, "removeSaveDataFromStorageKey": () => removeSaveDataFromStorageKey, "Remplacement": () => Remplacement, "remplacer": () => remplacer, "renameCharCountEl": () => renameCharCountEl, "renameInputEl": () => renameInputEl, "renameModalEl": () => renameModalEl, "renameOpen": () => renameOpen, "renamePokemonId": () => renamePokemonId, "renameResult": () => renameResult, "renameSlotIndex": () => renameSlotIndex, "renameSubtitleEl": () => renameSubtitleEl, "renameTitleEl": () => renameTitleEl, "rencontr": () => rencontr, "Rencontres": () => Rencontres, "render": () => render, "render_fps_estimate": () => render_fps_estimate, "render_frame_ms_estimate": () => render_frame_ms_estimate, "render_game_to_text": () => render_game_to_text, "render_quality": () => render_quality, "render_scale": () => render_scale, "renderAppearanceModal": () => renderAppearanceModal, "renderBoxesGrid": () => renderBoxesGrid, "renderFrameMsEma": () => renderFrameMsEma, "renderGachaModal": () => renderGachaModal, "renderPokedexGrid": () => renderPokedexGrid, "renderPokedexViewportSlice": () => renderPokedexViewportSlice, "renderScale": () => renderScale, "renderSize": () => renderSize, "renderStarterChoices": () => renderStarterChoices, "Renommer": () => Renommer, "repairRuntimeSaveAfterDefinitionsLoaded": () => repairRuntimeSaveAfterDefinitionsLoaded, "reparee": () => reparee, "repartir": () => repartir, "repeat": () => repeat, "repeated": () => repeated, "replace": () => replace, "replaceChildren": () => replaceChildren, "replaceConfigMap": () => replaceConfigMap, "replay": () => replay, "requestAnimationFrame": () => requestAnimationFrame, "requestFullscreen": () => requestFullscreen, "requestIdleCallback": () => requestIdleCallback, "requiredXp": () => requiredXp, "reservedRightWidth": () => reservedRightWidth, "reservedVertical": () => reservedVertical, "resetBackgroundDriftForRoute": () => resetBackgroundDriftForRoute, "resetNotificationSystem": () => resetNotificationSystem, "resetOnlyOneEncounterCycle": () => resetOnlyOneEncounterCycle, "resetPokedexVirtualDomReferences": () => resetPokedexVirtualDomReferences, "resetSaveAndRestart": () => resetSaveAndRestart, "resetSlice": () => resetSlice, "resetTeamContextTouchHoldState": () => resetTeamContextTouchHoldState, "ResizeObserver": () => ResizeObserver, "resolved": () => resolved, "resolvedSpriteSource": () => resolvedSpriteSource, "resolveEntitySpriteDrawSource": () => resolveEntitySpriteDrawSource, "resolvePokedexCardButtonFromEventTarget": () => resolvePokedexCardButtonFromEventTarget, "resolvePokedexSpeciesSpritePath": () => resolvePokedexSpeciesSpritePath, "resolveSpriteAppearanceForEntity": () => resolveSpriteAppearanceForEntity, "resolveTalentDefinition": () => resolveTalentDefinition, "response": () => response, "restauree": () => restauree, "restore": () => restore, "retire": () => retire, "revealEase": () => revealEase, "revealEnd": () => revealEnd, "revealRatio": () => revealRatio, "reward": () => reward, "rgb": () => rgb, "rgba": () => rgba, "rgbSecondary": () => rgbSecondary, "right": () => right, "rightGradient": () => rightGradient, "rightInset": () => rightInset, "ring": () => ring, "ringAlpha": () => ringAlpha, "ringRadius": () => ringRadius, "ringRadiusX": () => ringRadiusX, "ringRadiusY": () => ringRadiusY, "rock": () => rock, "rotate": () => rotate, "rotation": () => rotation, "rotationRad": () => rotationRad, "round": () => round, "roundRect": () => roundRect, "Route": () => Route, "ROUTE_1_TUTORIAL_ID": () => ROUTE_1_TUTORIAL_ID, "route_combat_enabled": () => route_combat_enabled, "ROUTE_DATA_DIR": () => ROUTE_DATA_DIR, "route_defeat_counts": () => route_defeat_counts, "route_defeat_timer_active": () => route_defeat_timer_active, "route_defeat_timer_duration_ms": () => route_defeat_timer_duration_ms, "route_defeat_timer_ratio": () => route_defeat_timer_ratio, "route_defeat_timer_remaining_ms": () => route_defeat_timer_remaining_ms, "route_defeat_timer_running": () => route_defeat_timer_running, "ROUTE_ENCOUNTERS_CSV_PATH": () => ROUTE_ENCOUNTERS_CSV_PATH, "route_encounters_source": () => route_encounters_source, "route_id": () => route_id, "ROUTE_ID_ORDER": () => ROUTE_ID_ORDER, "route_name_fr": () => route_name_fr, "route_unlock_mode": () => route_unlock_mode, "route_unlock_progress_current": () => route_unlock_progress_current, "route_unlock_target": () => route_unlock_target, "route_zone_type": () => route_zone_type, "routeBackgroundsById": () => routeBackgroundsById, "routeCatalog": () => routeCatalog, "routeCombatEnabled": () => routeCombatEnabled, "routeData": () => routeData, "routeDataInput": () => routeDataInput, "routeDataList": () => routeDataList, "routeDefeatTimer": () => routeDefeatTimer, "routeEncountersCsvPath": () => routeEncountersCsvPath, "routeId": () => routeId, "routeIds": () => routeIds, "routeInput": () => routeInput, "routeName": () => routeName, "routeNumber": () => routeNumber, "routePath": () => routePath, "routeProgressState": () => routeProgressState, "routes": () => routes, "row": () => row, "rowBorder": () => rowBorder, "rowBottom": () => rowBottom, "rowCount": () => rowCount, "rowFillBottom": () => rowFillBottom, "rowFillTop": () => rowFillTop, "rowGap": () => rowGap, "rowHeight": () => rowHeight, "rows": () => rows, "rowScale": () => rowScale, "rowStride": () => rowStride, "rowTop": () => rowTop, "rowVisualHeight": () => rowVisualHeight, "rowWidth": () => rowWidth, "rowX": () => rowX, "rowY": () => rowY, "ruleKey": () => ruleKey, "rules": () => rules, "rune": () => rune, "runNextChunk": () => runNextChunk, "running": () => running, "runtime_client": () => runtime_client, "RUNTIME_CLIENT_BROWSER_PC": () => RUNTIME_CLIENT_BROWSER_PC, "RUNTIME_CLIENT_BROWSER_SMARTPHONE": () => RUNTIME_CLIENT_BROWSER_SMARTPHONE, "RUNTIME_CLIENT_DESKTOP_EXE_PC": () => RUNTIME_CLIENT_DESKTOP_EXE_PC, "runtime_is_browser_pc": () => runtime_is_browser_pc, "runtime_is_browser_smartphone": () => runtime_is_browser_smartphone, "runtime_is_desktop_exe_pc": () => runtime_is_desktop_exe_pc, "runtimeClientType": () => runtimeClientType, "runtimeSaveRepair": () => runtimeSaveRepair, "runtimeTemp": () => runtimeTemp, "s": () => s, "S": () => S, "safeAlpha": () => safeAlpha, "safeBaseSize": () => safeBaseSize, "safeBottom": () => safeBottom, "safeBounds": () => safeBounds, "safeCount": () => safeCount, "safeDisplayName": () => safeDisplayName, "safeHeight": () => safeHeight, "safeMargin": () => safeMargin, "safeMaxWidth": () => safeMaxWidth, "safeOutline": () => safeOutline, "safePointerId": () => safePointerId, "safeRatio": () => safeRatio, "safeSize": () => safeSize, "safeSlotIndex": () => safeSlotIndex, "safeSlotSize": () => safeSlotSize, "safeSuffix": () => safeSuffix, "safeText": () => safeText, "safeTop": () => safeTop, "safeTotal": () => safeTotal, "safeWidth": () => safeWidth, "same": () => same, "sampledFillColor": () => sampledFillColor, "sanitizePokemonNickname": () => sanitizePokemonNickname, "sans": () => sans, "saturate": () => saturate, "sauvage": () => sauvage, "sauvegarde": () => sauvegarde, "Sauvegarde": () => Sauvegarde, "save": () => save, "save_backend": () => save_backend, "SAVE_KEY": () => SAVE_KEY, "SAVE_SESSION_KEY": () => SAVE_SESSION_KEY, "save_team_size": () => save_team_size, "saveBackend": () => saveBackend, "saveData": () => saveData, "saveDataRef": () => saveDataRef, "saveTemp": () => saveTemp, "scale": () => scale, "scaleFactor": () => scaleFactor, "scaleX": () => scaleX, "scaleY": () => scaleY, "scheduleNextChunk": () => scheduleNextChunk, "scheduleTeamContextTouchHold": () => scheduleTeamContextTouchHold, "screen": () => screen, "scroll": () => scroll, "scrollTop": () => scrollTop, "seam": () => seam, "second": () => second, "secondary": () => secondary, "secondaryPhase": () => secondaryPhase, "secondaryShader": () => secondaryShader, "secondSlotIndex": () => secondSlotIndex, "seed": () => seed, "seededOffsetMs": () => seededOffsetMs, "seedKey": () => seedKey, "segmentCount": () => segmentCount, "select": () => select, "selected": () => selected, "selectedHasShiny": () => selectedHasShiny, "selectedVariant": () => selectedVariant, "sequence": () => sequence, "serif": () => serif, "ses": () => ses, "sessionStorage": () => sessionStorage, "set": () => set, "Set": () => Set, "setActionDockFullscreenMenuOpen": () => setActionDockFullscreenMenuOpen, "setActiveRoute": () => setActiveRoute, "setAttribute": () => setAttribute, "setBallCaptureRulesForType": () => setBallCaptureRulesForType, "setBallCaptureToggleButtonState": () => setBallCaptureToggleButtonState, "setBallConfigState": () => setBallConfigState, "setBoxesInfoFromEntry": () => setBoxesInfoFromEntry, "setHint": () => setHint, "setHoveredBallOverlayType": () => setHoveredBallOverlayType, "setHoveredTeamSlotIndex": () => setHoveredTeamSlotIndex, "setLineDash": () => setLineDash, "setMapOpen": () => setMapOpen, "setPointerCapture": () => setPointerCapture, "setPokedexHeaderProgressSummary": () => setPokedexHeaderProgressSummary, "setPokedexInfoFromEntry": () => setPokedexInfoFromEntry, "setPokemonTalentCsvState": () => setPokemonTalentCsvState, "setShopItemConfigState": () => setShopItemConfigState, "setShopOpen": () => setShopOpen, "setTimeout": () => setTimeout, "settings": () => settings, "settled": () => settled, "settleLoadingState": () => settleLoadingState, "setTopMessage": () => setTopMessage, "setTransform": () => setTransform, "setZoneEncounterCsvState": () => setZoneEncounterCsvState, "shader": () => shader, "shaderColorizeBlend": () => shaderColorizeBlend, "shaderColorizeRgb": () => shaderColorizeRgb, "shaderConfig": () => shaderConfig, "shaderFilter": () => shaderFilter, "shaderPaletteKind": () => shaderPaletteKind, "shaderPaletteStrength": () => shaderPaletteStrength, "shaderWithUltra": () => shaderWithUltra, "shadow": () => shadow, "shadowAlpha": () => shadowAlpha, "shadowBlur": () => shadowBlur, "shadowColor": () => shadowColor, "shadowGroundOffsetY": () => shadowGroundOffsetY, "shadowLiftPx": () => shadowLiftPx, "shadowOffsetY": () => shadowOffsetY, "shadowProfile": () => shadowProfile, "shadowScale": () => shadowScale, "shake": () => shake, "shakeAmp": () => shakeAmp, "shakeAmpBase": () => shakeAmpBase, "shakeRatio": () => shakeRatio, "shakeWave": () => shakeWave, "shape": () => shape, "shard": () => shard, "shearX": () => shearX, "sheen": () => sheen, "shell": () => shell, "shift": () => shift, "shiny": () => shiny, "Shiny": () => Shiny, "SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG": () => SHINY_NEGATIVE_FALLBACK_SHADER_CONFIG, "shiny_negative_fallback_visual": () => shiny_negative_fallback_visual, "shiny_visual": () => shiny_visual, "shinyBadge": () => shinyBadge, "shinyBadgeLabel": () => shinyBadgeLabel, "shinyCapturesFamily": () => shinyCapturesFamily, "shinyCapturesTotal": () => shinyCapturesTotal, "shinyMode": () => shinyMode, "shinyModeActive": () => shinyModeActive, "shinyModeUnlocked": () => shinyModeUnlocked, "shinyNegativeFallbackVisual": () => shinyNegativeFallbackVisual, "shinyNegativeShaderConfig": () => shinyNegativeShaderConfig, "shinySpeciesCount": () => shinySpeciesCount, "shinyTag": () => shinyTag, "shinyUnlocked": () => shinyUnlocked, "shinyVisual": () => shinyVisual, "shop_ball_purchase_mode": () => shop_ball_purchase_mode, "shop_ball_purchase_qty": () => shop_ball_purchase_qty, "SHOP_ITEM_CONFIG_BY_ID": () => SHOP_ITEM_CONFIG_BY_ID, "shop_item_configs": () => shop_item_configs, "shop_items": () => shop_items, "shop_items_csv_loaded": () => shop_items_csv_loaded, "SHOP_ITEMS_CSV_PATH": () => SHOP_ITEMS_CSV_PATH, "shop_open": () => shop_open, "SHOP_QUANTITY_MODE_MAX": () => SHOP_QUANTITY_MODE_MAX, "shop_tab": () => shop_tab, "SHOP_TAB_COMBAT": () => SHOP_TAB_COMBAT, "SHOP_TAB_EVOLUTIONS": () => SHOP_TAB_EVOLUTIONS, "SHOP_TAB_POKEBALLS": () => SHOP_TAB_POKEBALLS, "shopCustomQuantity": () => shopCustomQuantity, "shopItem": () => shopItem, "shopItemConfigCsvLoaded": () => shopItemConfigCsvLoaded, "shopItemCsvResult": () => shopItemCsvResult, "shopItemsCsvPath": () => shopItemsCsvPath, "shopOpen": () => shopOpen, "shopQuantityMode": () => shopQuantityMode, "shopTab": () => shopTab, "shopTabCombat": () => shopTabCombat, "shortestSide": () => shortestSide, "shortFrameMsEma": () => shortFrameMsEma, "shouldAllowDevLayoutOverflowPositions": () => shouldAllowDevLayoutOverflowPositions, "shouldAnimate": () => shouldAnimate, "shouldAnnounce": () => shouldAnnounce, "shouldBeActive": () => shouldBeActive, "shouldFlipTeamSprite": () => shouldFlipTeamSprite, "shouldForceUltraShinyAllPokemon": () => shouldForceUltraShinyAllPokemon, "shouldLoadShinyAppearance": () => shouldLoadShinyAppearance, "shouldOpen": () => shouldOpen, "shouldRenderAmbientOverlays": () => shouldRenderAmbientOverlays, "shouldRenderCelebrationParticles": () => shouldRenderCelebrationParticles, "shouldReset": () => shouldReset, "showDefeatCounter": () => showDefeatCounter, "showEnemyUi": () => showEnemyUi, "showHoverPopup": () => showHoverPopup, "showLoadingScreen": () => showLoadingScreen, "showModalWithTween": () => showModalWithTween, "showPopupWithTween": () => showPopupWithTween, "showStarterModal": () => showStarterModal, "showTooltipWithTween": () => showTooltipWithTween, "shrink_active": () => shrink_active, "shrink_progress": () => shrink_progress, "shrinkActive": () => shrinkActive, "shrinkProgress": () => shrinkProgress, "si": () => si, "side": () => side, "sideInset": () => sideInset, "sign": () => sign, "silent": () => silent, "silhouette": () => silhouette, "Silhouette": () => Silhouette, "silhouetteImage": () => silhouetteImage, "simulationIdleMode": () => simulationIdleMode, "sin": () => sin, "size": () => size, "Skin": () => Skin, "skipGrayscaleBlend": () => skipGrayscaleBlend, "skipScaleX": () => skipScaleX, "skipScaleY": () => skipScaleY, "skipShader": () => skipShader, "skipTurnVisual": () => skipTurnVisual, "slice": () => slice, "sliceKey": () => sliceKey, "Slightly": () => Slightly, "slimeGradient": () => slimeGradient, "slot": () => slot, "Slot": () => Slot, "slot_index": () => slot_index, "slotBoundsBottom": () => slotBoundsBottom, "slotBoundsLeft": () => slotBoundsLeft, "slotBoundsRight": () => slotBoundsRight, "slotBoundsTop": () => slotBoundsTop, "slotIndex": () => slotIndex, "slotKey": () => slotKey, "slotRadius": () => slotRadius, "slotSize": () => slotSize, "small": () => small, "snapFactor": () => snapFactor, "snapped": () => snapped, "snappedDrawHeight": () => snappedDrawHeight, "snappedDrawWidth": () => snappedDrawWidth, "snappedDrawX": () => snappedDrawX, "snappedDrawY": () => snappedDrawY, "snapSpriteDimension": () => snapSpriteDimension, "snapSpriteValue": () => snapSpriteValue, "so": () => so, "some": () => some, "sort": () => sort, "sortedIds": () => sortedIds, "source": () => source, "sourceEntries": () => sourceEntries, "sourceHeight": () => sourceHeight, "sourceIds": () => sourceIds, "sourceMember": () => sourceMember, "sourceSlot": () => sourceSlot, "sourceSlotIndex": () => sourceSlotIndex, "sourceWidth": () => sourceWidth, "spacer": () => spacer, "spacingPx": () => spacingPx, "span": () => span, "spark": () => spark, "sparkCount": () => sparkCount, "sparkGlow": () => sparkGlow, "sparkle": () => sparkle, "sparkleCount": () => sparkleCount, "sparkRadius": () => sparkRadius, "spawn_weight": () => spawn_weight, "spawnEnemy": () => spawnEnemy, "species": () => species, "species_name_en": () => species_name_en, "speciesById": () => speciesById, "speciesNameEn": () => speciesNameEn, "speciesRef": () => speciesRef, "speed": () => speed, "spin": () => spin, "spinA": () => spinA, "spinB": () => spinB, "spinClass": () => spinClass, "spinning": () => spinning, "spinPhase": () => spinPhase, "spinTurns": () => spinTurns, "splice": () => splice, "spreadMain": () => spreadMain, "sprite": () => sprite, "sprite_animated": () => sprite_animated, "sprite_flip_x": () => sprite_flip_x, "sprite_path": () => sprite_path, "sprite_scale": () => sprite_scale, "sprite_variant_id": () => sprite_variant_id, "spriteAlpha": () => spriteAlpha, "spriteAnimated": () => spriteAnimated, "spriteDetail": () => spriteDetail, "spriteDrawHeight": () => spriteDrawHeight, "spriteDrawWidth": () => spriteDrawWidth, "spriteDrawX": () => spriteDrawX, "spriteDrawY": () => spriteDrawY, "spriteImage": () => spriteImage, "spriteOutlineTintBufferCanvas": () => spriteOutlineTintBufferCanvas, "spriteOutlineTintBufferCtx": () => spriteOutlineTintBufferCtx, "spritePath": () => spritePath, "sprites": () => sprites, "spriteShader": () => spriteShader, "spriteSize": () => spriteSize, "spriteTintBufferCanvas": () => spriteTintBufferCanvas, "spriteTintBufferCtx": () => spriteTintBufferCtx, "spriteUsedImage": () => spriteUsedImage, "spriteVariantId": () => spriteVariantId, "sqrt": () => sqrt, "squashWave": () => squashWave, "src": () => src, "stackedBonus": () => stackedBonus, "start": () => start, "startBattle": () => startBattle, "starter": () => starter, "STARTER_CHOICES": () => STARTER_CHOICES, "starter_chosen": () => starter_chosen, "starter_modal_visible": () => starter_modal_visible, "starterModalEl": () => starterModalEl, "startIndex": () => startIndex, "startMs": () => startMs, "startRow": () => startRow, "startX": () => startX, "startY": () => startY, "STAT_KEYS": () => STAT_KEYS, "STAT_LABELS_FR": () => STAT_LABELS_FR, "state": () => state, "statKey": () => statKey, "statLine": () => statLine, "stats": () => stats, "Stats": () => Stats, "status": () => status, "stay": () => stay, "steel": () => steel, "stepMs": () => stepMs, "steps": () => steps, "still": () => still, "stillMounted": () => stillMounted, "stock_tracked": () => stock_tracked, "stockTracked": () => stockTracked, "stopBackgroundTicker": () => stopBackgroundTicker, "stopPropagation": () => stopPropagation, "store": () => store, "streak": () => streak, "stretch": () => stretch, "string": () => string, "String": () => String, "stringify": () => stringify, "stroke": () => stroke, "strokeRect": () => strokeRect, "strokeStyle": () => strokeStyle, "strokeText": () => strokeText, "strong": () => strong, "style": () => style, "styles": () => styles, "subtitle": () => subtitle, "success": () => success, "successColors": () => successColors, "successPrimary": () => successPrimary, "successSecondary": () => successSecondary, "suffix": () => suffix, "suivante": () => suivante, "Suivante": () => Suivante, "sunGlow": () => sunGlow, "sunX": () => sunX, "sunY": () => sunY, "super_ball": () => super_ball, "suppressClickMs": () => suppressClickMs, "supprimer": () => supprimer, "Supprimer": () => Supprimer, "sur": () => sur, "surnom": () => surnom, "Surnom": () => Surnom, "Survole": () => Survole, "swapped": () => swapped, "swapTeamSlots": () => swapTeamSlots, "swapTeamSlotsFromUi": () => swapTeamSlotsFromUi, "syncCanvasInteractionCursor": () => syncCanvasInteractionCursor, "syncedRecord": () => syncedRecord, "syncWindowsPokeballInventoryTracking": () => syncWindowsPokeballInventoryTracking, "t": () => t, "tag": () => tag, "tagEl": () => tagEl, "Tahoma": () => Tahoma, "talent": () => talent, "Talent": () => Talent, "talent_description_fr": () => talent_description_fr, "talent_id": () => talent_id, "talent_name_en": () => talent_name_en, "talent_name_fr": () => talent_name_fr, "TALENT_NONE_DESCRIPTION_FR": () => TALENT_NONE_DESCRIPTION_FR, "talentCsvResult": () => talentCsvResult, "Talents": () => Talents, "talents_csv_loaded": () => talents_csv_loaded, "talentsByPokemonId": () => talentsByPokemonId, "target": () => target, "TARGET_FRAME_MS": () => TARGET_FRAME_MS, "targetCompactRowWidth": () => targetCompactRowWidth, "targetDesktopRowWidth": () => targetDesktopRowWidth, "targetIndex": () => targetIndex, "targetRatio": () => targetRatio, "targetsById": () => targetsById, "targetSlot": () => targetSlot, "targetSlotIndex": () => targetSlotIndex, "targetValue": () => targetValue, "targetX": () => targetX, "targetY": () => targetY, "task": () => task, "team": () => team, "team_attack_flash_blends": () => team_attack_flash_blends, "team_aura_attack_bonus_pct": () => team_aura_attack_bonus_pct, "team_context_menu_open": () => team_context_menu_open, "team_context_menu_slot_index": () => team_context_menu_slot_index, "TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX": () => TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX, "TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS": () => TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS, "team_drag_active": () => team_drag_active, "TEAM_DRAG_CLICK_SUPPRESS_MS": () => TEAM_DRAG_CLICK_SUPPRESS_MS, "team_drag_moved": () => team_drag_moved, "team_drag_source_slot_index": () => team_drag_source_slot_index, "TEAM_DRAG_START_DISTANCE_PX": () => TEAM_DRAG_START_DISTANCE_PX, "team_drag_target_slot_index": () => team_drag_target_slot_index, "team_level_up_effects_active": () => team_level_up_effects_active, "TEAM_SPRITE_SCALE": () => TEAM_SPRITE_SCALE, "TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER": () => TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER, "team_xp_gain_effects_active": () => team_xp_gain_effects_active, "teamAuraAttackBonusBySlot": () => teamAuraAttackBonusBySlot, "teamBreath": () => teamBreath, "teamContextMenuAppearanceButtonEl": () => teamContextMenuAppearanceButtonEl, "teamContextMenuBoxesButtonEl": () => teamContextMenuBoxesButtonEl, "teamContextMenuEl": () => teamContextMenuEl, "teamContextMenuOpen": () => teamContextMenuOpen, "teamContextMenuPokemonId": () => teamContextMenuPokemonId, "teamContextMenuRenameButtonEl": () => teamContextMenuRenameButtonEl, "teamContextMenuSlotIndex": () => teamContextMenuSlotIndex, "teamContextMenuTitleEl": () => teamContextMenuTitleEl, "teamContextTouchHoldClientX": () => teamContextTouchHoldClientX, "teamContextTouchHoldClientY": () => teamContextTouchHoldClientY, "teamContextTouchHoldPointerId": () => teamContextTouchHoldPointerId, "teamContextTouchHoldSlotIndex": () => teamContextTouchHoldSlotIndex, "teamContextTouchHoldStartClientX": () => teamContextTouchHoldStartClientX, "teamContextTouchHoldStartClientY": () => teamContextTouchHoldStartClientY, "teamContextTouchHoldTimerId": () => teamContextTouchHoldTimerId, "teamDragActive": () => teamDragActive, "teamDragCurrentWorldX": () => teamDragCurrentWorldX, "teamDragCurrentWorldY": () => teamDragCurrentWorldY, "teamDragMoved": () => teamDragMoved, "teamDragPointerId": () => teamDragPointerId, "teamDragPointerType": () => teamDragPointerType, "teamDragSourceSlotIndex": () => teamDragSourceSlotIndex, "teamDragStartClientX": () => teamDragStartClientX, "teamDragStartClientY": () => teamDragStartClientY, "teamDragSuppressClickUntilMs": () => teamDragSuppressClickUntilMs, "teamDragTargetSlotIndex": () => teamDragTargetSlotIndex, "teamDrawPositions": () => teamDrawPositions, "teamHudBaseHeight": () => teamHudBaseHeight, "teamHudBaseWidth": () => teamHudBaseWidth, "teamHudHeight": () => teamHudHeight, "teamHudScale": () => teamHudScale, "teamHudWidth": () => teamHudWidth, "teamIds": () => teamIds, "teamLevelUpEffects": () => teamLevelUpEffects, "teamMembers": () => teamMembers, "teamMinRenderSize": () => teamMinRenderSize, "teamPokemonId": () => teamPokemonId, "teamSize": () => teamSize, "teamSlots": () => teamSlots, "teamSpriteScale": () => teamSpriteScale, "teamTypeChipHeight": () => teamTypeChipHeight, "teamXpBySlot": () => teamXpBySlot, "teamXpGainEffects": () => teamXpGainEffects, "teamXpPulseMsBySlot": () => teamXpPulseMsBySlot, "teleport_boost_visual_intensity": () => teleport_boost_visual_intensity, "teleport_damage_boost_active": () => teleport_damage_boost_active, "teleport_damage_boost_multiplier": () => teleport_damage_boost_multiplier, "teleport_flash": () => teleport_flash, "teleport_trail": () => teleport_trail, "teleportBoostMultiplier": () => teleportBoostMultiplier, "teleportBoostVisualIntensity": () => teleportBoostVisualIntensity, "teleportScale": () => teleportScale, "temporary": () => temporary, "tertiary": () => tertiary, "text": () => text, "textAlign": () => textAlign, "textAlpha": () => textAlpha, "textBaseline": () => textBaseline, "textColor": () => textColor, "textContent": () => textContent, "texture": () => texture, "textureCanvas": () => textureCanvas, "textureHeight": () => textureHeight, "textureWidth": () => textureWidth, "textWidth": () => textWidth, "textX": () => textX, "the": () => the, "theme": () => theme, "then": () => then, "throwRatio": () => throwRatio, "time": () => time, "timeInPhase": () => timeInPhase, "timeMs": () => timeMs, "timeOfDayTag": () => timeOfDayTag, "timeout": () => timeout, "timeRatio": () => timeRatio, "timerId": () => timerId, "timerState": () => timerState, "timerText": () => timerText, "timerTextSize": () => timerTextSize, "timeSeconds": () => timeSeconds, "tintBlend": () => tintBlend, "tintColor": () => tintColor, "tintCtx": () => tintCtx, "tinting": () => tinting, "tiny": () => tiny, "tion": () => tion, "title": () => title, "to": () => to, "to_id": () => to_id, "to_name_fr": () => to_name_fr, "toDef": () => toDef, "toFixed": () => toFixed, "toggle": () => toggle, "toggleActionDockFullscreenMenu": () => toggleActionDockFullscreenMenu, "toggleAppearanceShinyMode": () => toggleAppearanceShinyMode, "toggleAppearanceUltraShinyMode": () => toggleAppearanceUltraShinyMode, "toggleBallCaptureRule": () => toggleBallCaptureRule, "toggleFullscreen": () => toggleFullscreen, "toId": () => toId, "toLocaleString": () => toLocaleString, "toLowerCase": () => toLowerCase, "ton": () => ton, "toNameFr": () => toNameFr, "tone": () => tone, "tonePalette": () => tonePalette, "top": () => top, "top_message": () => top_message, "topA": () => topA, "topB": () => topB, "topGradient": () => topGradient, "topHighlight": () => topHighlight, "topHudGap": () => topHudGap, "topHudHeight": () => topHudHeight, "topRowY": () => topRowY, "topSpacer": () => topSpacer, "topSpacerHeight": () => topSpacerHeight, "topY": () => topY, "toSafeInt": () => toSafeInt, "total": () => total, "total_ms": () => total_ms, "totalEntriesCount": () => totalEntriesCount, "totalMs": () => totalMs, "totalRows": () => totalRows, "totalSpecies": () => totalSpecies, "touch": () => touch, "toUpperCase": () => toUpperCase, "toute": () => toute, "Toutes": () => Toutes, "town": () => town, "toX": () => toX, "toY": () => toY, "trackBaseColor": () => trackBaseColor, "trackGradient": () => trackGradient, "trackRadius": () => trackRadius, "trackWidth": () => trackWidth, "trackX": () => trackX, "trackY": () => trackY, "trail": () => trail, "trailAccent": () => trailAccent, "trailAlpha": () => trailAlpha, "trailAngle": () => trailAngle, "trailColor": () => trailColor, "trailDirX": () => trailDirX, "trailDirY": () => trailDirY, "trailEnabled": () => trailEnabled, "trailGlow": () => trailGlow, "trailGradient": () => trailGradient, "trailPerpX": () => trailPerpX, "trailPerpY": () => trailPerpY, "trailPoints": () => trailPoints, "trailProfile": () => trailProfile, "trailStride": () => trailStride, "trailT": () => trailT, "trailX": () => trailX, "trailY": () => trailY, "transform": () => transform, "translate": () => translate, "transparent": () => transparent, "travelAngle": () => travelAngle, "Trebuchet": () => Trebuchet, "triggerActionDockPokeballSpin": () => triggerActionDockPokeballSpin, "triggerTeamContextTouchHold": () => triggerTeamContextTouchHold, "trim": () => trim, "trimEdges": () => trimEdges, "trinity": () => trinity, "trinityActive": () => trinityActive, "tryOpenPendingTutorialFlow": () => tryOpenPendingTutorialFlow, "tryUnlockNextRouteAfterDefeat": () => tryUnlockNextRouteAfterDefeat, "tu": () => tu, "Tu": () => Tu, "turn_indicator_can_attack": () => turn_indicator_can_attack, "turnIndicator": () => turnIndicator, "tutorial": () => tutorial, "tutorial_flow_id": () => tutorial_flow_id, "tutorial_open": () => tutorial_open, "tutorial_page": () => tutorial_page, "tutorial_page_count": () => tutorial_page_count, "tutorialModalEl": () => tutorialModalEl, "tutorialOpen": () => tutorialOpen, "tutorialProgressAfter": () => tutorialProgressAfter, "tutorialProgressBefore": () => tutorialProgressBefore, "tutorialProgressChanged": () => tutorialProgressChanged, "tutorials": () => tutorials, "tweenAlpha": () => tweenAlpha, "tweenPulse": () => tweenPulse, "tweenVisual": () => tweenVisual, "twinkle": () => twinkle, "type": () => type, "Type": () => Type, "type_multiplier_vs_enemy": () => type_multiplier_vs_enemy, "typeIconImages": () => typeIconImages, "typeIconResult": () => typeIconResult, "typeName": () => typeName, "typeProfile": () => typeProfile, "Types": () => Types, "typesLabel": () => typesLabel, "U": () => U, "u00e9glages": () => u00e9glages, "u2713": () => u2713, "u2726": () => u2726, "ui": () => ui, "uiTopbarEl": () => uiTopbarEl, "ultra": () => ultra, "Ultra": () => Ultra, "ultra_shiny": () => ultra_shiny, "ULTRA_SHINY_HUE_CYCLE_MS": () => ULTRA_SHINY_HUE_CYCLE_MS, "ULTRA_SHINY_OUTLINE_PX": () => ULTRA_SHINY_OUTLINE_PX, "ULTRA_SHINY_SCINTILLATION_FLASH_MS": () => ULTRA_SHINY_SCINTILLATION_FLASH_MS, "ULTRA_SHINY_SCINTILLATION_PERIOD_MS": () => ULTRA_SHINY_SCINTILLATION_PERIOD_MS, "ultra_shiny_visual": () => ultra_shiny_visual, "ultraBadge": () => ultraBadge, "ultraBadgeLabel": () => ultraBadgeLabel, "ultraSeed": () => ultraSeed, "ultraShaderConfig": () => ultraShaderConfig, "ultraShinyCapturesFamily": () => ultraShinyCapturesFamily, "ultraShinyMode": () => ultraShinyMode, "ultraShinyModeActive": () => ultraShinyModeActive, "ultraShinyModeUnlocked": () => ultraShinyModeUnlocked, "ultraShinySpeciesCount": () => ultraShinySpeciesCount, "ultraShinyUnlocked": () => ultraShinyUnlocked, "ultraShinyVisual": () => ultraShinyVisual, "ultraTag": () => ultraTag, "un": () => un, "unavailable": () => unavailable, "undefined": () => undefined, "une": () => une, "Une": () => Une, "unhover": () => unhover, "uniform": () => uniform, "uniformScale": () => uniformScale, "uniqueIds": () => uniqueIds, "uniqueRouteIds": () => uniqueRouteIds, "unknown": () => unknown, "UNKNOWN_CAVE_ROUTE_ID": () => UNKNOWN_CAVE_ROUTE_ID, "unlock_mode": () => unlock_mode, "unlocked": () => unlocked, "unlocked_route_ids": () => unlocked_route_ids, "unlockedRouteIds": () => unlockedRouteIds, "unlockMode": () => unlockMode, "unlockProgressState": () => unlockProgressState, "unlockResult": () => unlockResult, "unlockStateReconciled": () => unlockStateReconciled, "unlockTarget": () => unlockTarget, "unresolvedTalentIds": () => unresolvedTalentIds, "unshift": () => unshift, "unsupported": () => unsupported, "update": () => update, "updateEnvironment": () => updateEnvironment, "updateEvolutionAnimation": () => updateEvolutionAnimation, "updateHud": () => updateHud, "updatePokedexVirtualLayoutMetricsIfNeeded": () => updatePokedexVirtualLayoutMetricsIfNeeded, "updateSaveBackendIndicator": () => updateSaveBackendIndicator, "updateTeamContextTouchHoldFromMove": () => updateTeamContextTouchHoldFromMove, "usableInTeam": () => usableInTeam, "useGlow": () => useGlow, "usePhoneRowsLayout": () => usePhoneRowsLayout, "useSimpleSparkles": () => useSimpleSparkles, "useSplitRows": () => useSplitRows, "Utilise": () => Utilise, "Utiliser": () => Utiliser, "v$": () => v$, "validateRouteDataPayload": () => validateRouteDataPayload, "value": () => value, "valueA": () => valueA, "valueB": () => valueB, "valueFontSize": () => valueFontSize, "values": () => values, "valueText": () => valueText, "valueY": () => valueY, "variant": () => variant, "variant_id": () => variant_id, "variant_label": () => variant_label, "variantId": () => variantId, "variantLabel": () => variantLabel, "variants": () => variants, "variantsById": () => variantsById, "Verdana": () => Verdana, "verrouille": () => verrouille, "Verrouille": () => Verrouille, "vers": () => vers, "version": () => version, "verticalOffset": () => verticalOffset, "verticalPadding": () => verticalPadding, "very_low": () => very_low, "vibrate": () => vibrate, "viewport": () => viewport, "viewportChanged": () => viewportChanged, "viewportHeight": () => viewportHeight, "viewportPadding": () => viewportPadding, "viewportProfile": () => viewportProfile, "viewportWidth": () => viewportWidth, "vignette": () => vignette, "vignetteAlpha": () => vignetteAlpha, "vignetteRadius": () => vignetteRadius, "Ville": () => Ville, "virtual": () => virtual, "visible": () => visible, "visibleRows": () => visibleRows, "visit": () => visit, "visual": () => visual, "visualIntensity": () => visualIntensity, "visualTween": () => visualTween, "visualWrap": () => visualWrap, "voir": () => voir, "voulu": () => voulu, "warmBackgrounds": () => warmBackgrounds, "warmupDefinitionsForCurrentExtendedRange": () => warmupDefinitionsForCurrentExtendedRange, "warn": () => warn, "warnRuntimeDataValidation": () => warnRuntimeDataValidation, "was": () => was, "wasBufferSmoothing": () => wasBufferSmoothing, "wasSmoothing": () => wasSmoothing, "water": () => water, "wave": () => wave, "when": () => when, "which": () => which, "whiteEnd": () => whiteEnd, "whiteRatio": () => whiteRatio, "width": () => width, "wind": () => wind, "window": () => window, "wing": () => wing, "wisp": () => wisp, "without": () => without, "wobbleAngle": () => wobbleAngle, "wobbleOffsetX": () => wobbleOffsetX, "wobbleOffsetY": () => wobbleOffsetY, "wobbleRotation": () => wobbleRotation, "wobbleScaleX": () => wobbleScaleX, "wobbleScaleY": () => wobbleScaleY, "wobbleShearX": () => wobbleShearX, "works": () => works, "worldX": () => worldX, "worldY": () => worldY, "x": () => x, "x_axis": () => x_axis, "x$": () => x$, "xp": () => xp, "XP": () => XP, "xp_to_next": () => xp_to_next, "xpHud": () => xpHud, "xpLabel": () => xpLabel, "xpToNext": () => xpToNext, "xRaw": () => xRaw, "y": () => y, "y_axis": () => y_axis, "yFromSafeBounds": () => yFromSafeBounds, "yRaw": () => yRaw, "zone": () => zone, "Zone": () => Zone, "zone_csv_loaded": () => zone_csv_loaded, "zoneCsvResult": () => zoneCsvResult, "zoneEncounterCsvByRouteId": () => zoneEncounterCsvByRouteId, "zoneEncounterCsvLoaded": () => zoneEncounterCsvLoaded, "zoneEncounterCsvRouteIds": () => zoneEncounterCsvRouteIds, "zoneId": () => zoneId, "zoneType": () => zoneType };
function buildRuntimeBindingSnapshot(bindingKeys = [], baseBindings = null) {
  const snapshot = baseBindings && typeof baseBindings === "object"
    ? { ...baseBindings }
    : {};

  for (const key of Array.isArray(bindingKeys) ? bindingKeys : []) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      continue;
    }
    const getter = RUNTIME_BINDING_GETTERS[key];
    if (typeof getter !== "function") {
      continue;
    }
    try {
      const value = getter();
      if (value !== undefined) {
        snapshot[key] = value;
      }
    } catch {
      // Ignore unavailable bindings and preserve the runtime fallback behavior.
    }
  }

  return snapshot;
}

function buildSerializableRuntimeBindingSnapshot(bindingKeys = []) {
  const snapshot = buildRuntimeBindingSnapshot(bindingKeys);
  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === "function") {
      delete snapshot[key];
    }
  }
  return snapshot;
}

if (IS_DEV_RUNTIME) {
  // Dev/test-only bridge used by the Playwright galleries to open runtime UI states deterministically.
  window.__pokeidle_get_binding_snapshot = (bindingKeys = []) => {
    return buildSerializableRuntimeBindingSnapshot(bindingKeys);
  };
  window.__pokeidle_invoke_binding = async (bindingKey, ...args) => {
    const key = String(bindingKey || "").trim();
    if (!key) {
      return { ok: false, error: "missing-binding-key" };
    }
    const getter = RUNTIME_BINDING_GETTERS[key];
    if (typeof getter !== "function") {
      return { ok: false, error: `unknown-binding:${key}` };
    }
    try {
      const value = getter();
      if (typeof value === "function") {
        const result = await value(...args);
        return { ok: true, result: result ?? null };
      }
      return { ok: true, result: value ?? null };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

let runtimeRenderSystem = null;

function getRuntimeRenderSystem() {
  if (!runtimeRenderSystem) {
    runtimeRenderSystem = createRuntimeRenderSystem({
      bindings: buildRuntimeBindingSnapshot(RUNTIME_RENDER_BINDING_KEYS),
    });
  }
  return runtimeRenderSystem;
}

function getBattleViewportProfile(width, height) {
  return getRuntimeRenderSystem().getBattleViewportProfile(width, height);
}

function getTeamSpriteScale(layout = state.layout) {
  return getRuntimeRenderSystem().getTeamSpriteScale(layout);
}

function getEnemySpriteRenderSize(layout = state.layout, baseSize = 0) {
  return getRuntimeRenderSystem().getEnemySpriteRenderSize(layout, baseSize);
}

function computeLayout() {
  const nextLayout = getRuntimeRenderSystem().computeLayout();
  state.layoutMode = nextLayout?.layoutMode || PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE;
  syncCaptureRootLayoutMode(nextLayout);
  return nextLayout;
}

function refreshLayoutIfNeeded(options = {}) {
  const nextLayout = getRuntimeRenderSystem().refreshLayoutIfNeeded(options);
  state.layoutMode = nextLayout?.layoutMode || PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE;
  syncCaptureRootLayoutMode(nextLayout);
  return nextLayout;
}

function render() {
  syncBackgroundRuntimeDebugOverlay();
  return getRuntimeRenderSystem().render();
}

function getStageProjectionRect() {
  const stageRect = gameStageEl?.getBoundingClientRect();
  return {
    left: Math.max(0, Number(stageRect?.left) || 0),
    top: Math.max(0, Number(stageRect?.top) || 0),
    width: Math.max(1, Number(stageRect?.width) || Number(state.viewport?.width) || 1),
    height: Math.max(1, Number(stageRect?.height) || Number(state.viewport?.height) || 1),
  };
}

function syncCaptureRootLayoutMode(layout = state.layout) {
  if (!captureRootEl) {
    return;
  }
  const layoutMode = String(layout?.layoutMode || state.layoutMode || PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE);
  captureRootEl.dataset.layoutMode = layoutMode;
}

function projectWorldToRuntimeStage(worldX, worldY, options = {}) {
  const layout = options?.layout || state.layout || refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  return projectWorldToStage({
    worldX,
    worldY,
    viewport: state.viewport,
    stageRect: getStageProjectionRect(),
    worldSafeRect: options?.worldSafeRect || layout?.worldSafeRect,
    preferredPlacement: options?.preferredPlacement,
  });
}

function extractClientPointFromArgs(args = []) {
  const numericArgs = Array.isArray(args)
    ? args.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value))
    : [];
  const count = numericArgs.length;
  if (count < 2) {
    return { clientX: 0, clientY: 0 };
  }
  return {
    clientX: numericArgs[count - 2],
    clientY: numericArgs[count - 1],
  };
}

function positionWorldUiElementInStage(element, clientX, clientY, options = {}) {
  if (!(element instanceof HTMLElement) || !(worldUiLayerEl instanceof HTMLElement)) {
    return null;
  }
  const layout = state.layout || refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  const layoutMode = layout?.layoutMode || PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE;
  const stageRect = getStageProjectionRect();
  const rawLocalX = Number(clientX || 0) - stageRect.left;
  const rawLocalY = Number(clientY || 0) - stageRect.top;
  const rect = element.getBoundingClientRect();
  const elementWidth = Math.max(0, Number(rect?.width) || Number(element.offsetWidth) || 0);
  const elementHeight = Math.max(0, Number(rect?.height) || Number(element.offsetHeight) || 0);
  const worldSafeRect = layout?.worldSafeRect || {
    left: 0,
    top: 0,
    right: stageRect.width,
    bottom: stageRect.height,
  };
  const margin = layoutMode === "mobilePortrait" ? 12 : 8;
  const anchorX = rawLocalX + Number(options.offsetX || 0);
  const anchorY = rawLocalY + Number(options.offsetY || 0);
  const minLeft = Math.max(0, Number(worldSafeRect.left || 0) + margin);
  const maxLeft = Math.max(minLeft, Number(worldSafeRect.right || stageRect.width) - elementWidth - margin);
  const minTop = Math.max(0, Number(worldSafeRect.top || 0) + margin);
  const maxTop = Math.max(minTop, Number(worldSafeRect.bottom || stageRect.height) - elementHeight - margin);
  const left = clamp(anchorX, minLeft, maxLeft);
  const top = clamp(anchorY, minTop, maxTop);
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  return { left, top };
}

function decorateRuntimeUiInteractionSystem(system) {
  if (!system || system.__stageWorldUiDecorated) {
    return system;
  }

  const getNormalizedPointerTypeSafe = (pointerType) =>
    typeof system.getNormalizedPointerType === "function"
      ? system.getNormalizedPointerType(pointerType)
      : String(pointerType || "").toLowerCase().trim();
  const isTouchLikePointerTypeSafe = (pointerType) => {
    const normalizedPointerType = getNormalizedPointerTypeSafe(pointerType);
    if (typeof system.isTouchLikePointerType === "function") {
      return system.isTouchLikePointerType(normalizedPointerType);
    }
    return normalizedPointerType === "touch" || normalizedPointerType === "pen";
  };
  const getTeamContextTouchHoldCancelDistancePx = (pointerType) => {
    const activationDistancePx =
      typeof system.getTeamDragActivationDistancePx === "function"
        ? Number(system.getTeamDragActivationDistancePx(pointerType))
        : TEAM_DRAG_START_DISTANCE_PX;
    const safeActivationDistancePx = Number.isFinite(activationDistancePx)
      ? activationDistancePx
      : TEAM_DRAG_START_DISTANCE_PX;
    return Math.max(TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX, safeActivationDistancePx);
  };
  const originalShowHoverPopup =
    typeof system.showHoverPopup === "function" ? system.showHoverPopup.bind(system) : null;
  const originalOpenTeamContextMenu =
    typeof system.openTeamContextMenu === "function" ? system.openTeamContextMenu.bind(system) : null;
  const originalOpenBallCaptureMenu =
    typeof system.openBallCaptureMenu === "function" ? system.openBallCaptureMenu.bind(system) : null;
  const originalHandleCanvasPointerDown =
    typeof system.handleCanvasPointerDown === "function" ? system.handleCanvasPointerDown.bind(system) : null;

  system.positionFloatingMenuElement = (element, clientX, clientY, options = {}) =>
    positionWorldUiElementInStage(element, clientX, clientY, options);

  if (originalShowHoverPopup) {
    system.showHoverPopup = (...args) => {
      const result = originalShowHoverPopup(...args);
      const { clientX, clientY } = extractClientPointFromArgs(args);
      const layoutMode = state.layout?.layoutMode || state.layoutMode || PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE;
      positionWorldUiElementInStage(hoverPopupEl, clientX, clientY, {
        offsetX: layoutMode === "mobilePortrait" ? -18 : 12,
        offsetY: layoutMode === "mobilePortrait" ? -52 : -24,
      });
      return result;
    };
  }

  if (originalOpenTeamContextMenu) {
    system.openTeamContextMenu = (...args) => {
      const result = originalOpenTeamContextMenu(...args);
      const { clientX, clientY } = extractClientPointFromArgs(args);
      positionWorldUiElementInStage(teamContextMenuEl, clientX, clientY, {
        offsetX: -16,
        offsetY: 12,
      });
      return result;
    };
  }

  if (originalOpenBallCaptureMenu) {
    system.openBallCaptureMenu = (...args) => {
      const result = originalOpenBallCaptureMenu(...args);
      const { clientX, clientY } = extractClientPointFromArgs(args);
      positionWorldUiElementInStage(ballCaptureMenuEl, clientX, clientY, {
        offsetX: -20,
        offsetY: 12,
      });
      return result;
    };
  }

  if (originalHandleCanvasPointerDown) {
    system.handleCanvasPointerDown = (event) => {
      const pointerType = getNormalizedPointerTypeSafe(event?.pointerType);
      if (isTouchLikePointerTypeSafe(pointerType) && event?.cancelable) {
        event.preventDefault();
      }
      return originalHandleCanvasPointerDown(event);
    };
  }

  if (typeof system.handleCanvasPointerMove === "function") {
    system.handleCanvasPointerMove = (event) => {
      const pointerType = getNormalizedPointerTypeSafe(event?.pointerType);
      const isTouchLikePointer = isTouchLikePointerTypeSafe(pointerType);
      if (state.ui.teamDragActive && !system.isEventFromActiveTeamDragPointer(event)) {
        return;
      }
      if (system.isCanvasBattleInteractionBlocked()) {
        if (state.ui.teamDragActive) {
          system.clearTeamDragState();
        }
        system.clearCanvasHoverState();
        return;
      }

      const { worldX, worldY } = system.getWorldCoordinatesFromPointerEvent(event);
      const layout = state.layout || computeLayout();
      if (state.ui.teamDragActive) {
        if (isTouchLikePointer && event?.cancelable) {
          event.preventDefault();
        }
        state.ui.teamDragCurrentWorldX = worldX;
        state.ui.teamDragCurrentWorldY = worldY;
        const dx = Number(event?.clientX || 0) - Number(state.ui.teamDragStartClientX || 0);
        const dy = Number(event?.clientY || 0) - Number(state.ui.teamDragStartClientY || 0);
        const distanceSquared = dx * dx + dy * dy;
        if (isTouchLikePointer) {
          const pointerId = toSafeInt(event?.pointerId, -1);
          if (pointerId >= 0 && toSafeInt(state.ui.teamContextTouchHoldPointerId, -1) === pointerId) {
            state.ui.teamContextTouchHoldClientX = Number(
              event?.clientX || state.ui.teamContextTouchHoldClientX || 0,
            );
            state.ui.teamContextTouchHoldClientY = Number(
              event?.clientY || state.ui.teamContextTouchHoldClientY || 0,
            );
            const holdDx =
              state.ui.teamContextTouchHoldClientX
              - Number(state.ui.teamContextTouchHoldStartClientX || 0);
            const holdDy =
              state.ui.teamContextTouchHoldClientY
              - Number(state.ui.teamContextTouchHoldStartClientY || 0);
            const holdDistanceSquared = holdDx * holdDx + holdDy * holdDy;
            const cancelDistancePx = getTeamContextTouchHoldCancelDistancePx(pointerType);
            if (holdDistanceSquared >= cancelDistancePx * cancelDistancePx) {
              system.cancelTeamContextTouchHold(pointerId);
            } else {
              const slotIndex = clamp(
                toSafeInt(state.ui.teamContextTouchHoldSlotIndex, -1),
                -1,
                MAX_TEAM_SIZE - 1,
              );
              const hoveredSlot = system.findHoveredTeamSlot(worldX, worldY, layout, {
                pointerType: event?.pointerType,
              });
              if (!hoveredSlot || hoveredSlot.slotIndex !== slotIndex) {
                system.cancelTeamContextTouchHold(pointerId);
              }
            }
          }
        }
        const activationDistancePx = system.getTeamDragActivationDistancePx(pointerType);
        const activationDistanceSquared = activationDistancePx * activationDistancePx;
        if (!state.ui.teamDragMoved && distanceSquared >= activationDistanceSquared) {
          system.cancelTeamContextTouchHold(event?.pointerId);
          if (!system.isTeamSlotSwapAllowed()) {
            setTopMessage(getTeamBoxesLockedMessage(), 2100);
            system.clearTeamDragState({ suppressClickMs: TEAM_DRAG_CLICK_SUPPRESS_MS });
            system.setHoveredTeamSlotIndex(-1);
            system.hideHoverPopup();
            return;
          }
          state.ui.teamDragMoved = true;
          system.closeTeamContextMenu();
          system.closeBallCaptureMenu();
          system.syncCanvasInteractionCursor();
        }

        if (state.ui.teamDragMoved) {
          const hoveredTeamSlot = system.findHoveredTeamSlot(worldX, worldY, layout, { pointerType });
          const sourceSlotIndex = clamp(
            toSafeInt(state.ui.teamDragSourceSlotIndex, -1),
            -1,
            MAX_TEAM_SIZE - 1,
          );
          const targetSlotIndex =
            hoveredTeamSlot && hoveredTeamSlot.slotIndex !== sourceSlotIndex
              ? hoveredTeamSlot.slotIndex
              : -1;
          state.ui.teamDragTargetSlotIndex = targetSlotIndex;
          system.setHoveredBallOverlayType("");
          system.setHoveredTeamSlotIndex(targetSlotIndex >= 0 ? targetSlotIndex : sourceSlotIndex);
          system.hideHoverPopup();
          render();
          return;
        }
      }

      if (pointerType !== "mouse") {
        system.setHoveredBallOverlayType("");
        system.setHoveredTeamSlotIndex(-1);
        system.hideHoverPopup();
        system.syncCanvasInteractionCursor();
        return;
      }

      if (state.ui.teamContextMenuOpen || state.ui.ballCaptureMenuOpen) {
        system.setHoveredTeamSlotIndex(-1);
        system.hideHoverPopup();
        system.syncCanvasInteractionCursor();
        return;
      }
      const hoveredBallOverlay = system.findHoveredBallOverlayHitbox(worldX, worldY);
      system.setHoveredBallOverlayType(hoveredBallOverlay?.ballType || "");
      if (hoveredBallOverlay) {
        system.setHoveredTeamSlotIndex(-1);
        system.hideHoverPopup();
        return;
      }
      const hoveredTeamSlot = system.findHoveredTeamSlot(worldX, worldY, layout);
      system.setHoveredTeamSlotIndex(hoveredTeamSlot?.slotIndex ?? -1);
      const hovered = system.findHoveredPokemon(worldX, worldY, layout);
      system.showHoverPopup(hovered, event?.clientX, event?.clientY);
    };
  }

  system.projectWorldToStage = (worldX, worldY, options = {}) =>
    projectWorldToRuntimeStage(worldX, worldY, options);
  system.__stageWorldUiDecorated = true;
  return system;
}

function update(deltaMs, options = {}) {
  const idleMode = Boolean(options.idleMode);
  state.timeMs += deltaMs;
  tweenGroup.update(state.timeMs);
  updateEnvironment();
  updateHappinessEvolutionBoxProgress(deltaMs);
  updateNotificationSystem();
  tryOpenPendingDialogue();
  tryOpenPendingTutorialFlow();
  updateBackgroundDrift(deltaMs);
  updateMoneyHudAnimation(deltaMs);
  updateTeamLevelUpEffects(deltaMs);
  updateTeamXpGainEffects(deltaMs);
  if (state.ui.gachaOpen) {
    renderGachaModal();
  }
  const layout = idleMode
    ? (state.layout || refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs }))
    : refreshLayoutIfNeeded({ nowMs: state.timeMs });
  const runtimeUiInteraction = getRuntimeUiInteractionSystem();
  if (runtimeUiInteraction && typeof runtimeUiInteraction.updateEvolutionAnimation === "function") {
    runtimeUiInteraction.updateEvolutionAnimation(deltaMs);
  }

  state.simulationIdleMode = idleMode;
  try {
    if (state.battle) {
      state.battle.update(deltaMs, layout, { idleMode });
      state.enemy = state.battle.getEnemy();
    }
  } finally {
    state.simulationIdleMode = false;
  }
}

function gameLoop(timestamp) {
  const now = Number.isFinite(Number(timestamp)) ? Number(timestamp) : 0;
  if (shouldTreatRuntimeAsHidden()) {
    state.lastFrameTimestamp = 0;
    state.lastRenderTimestamp = 0;
    window.requestAnimationFrame(gameLoop);
    return;
  }
  const frameDeltaMs = state.lastFrameTimestamp > 0
    ? clamp(now - state.lastFrameTimestamp, 1, 120)
    : BASE_STEP_MS;
  state.lastFrameTimestamp = now;
  tickSimulationFromRealtime();
  markSimulationPump();
  let frameCpuMs = TARGET_FRAME_MS;
  let renderDeltaMs = null;
  const renderIntervalMs = getRenderFrameIntervalMs();
  if (state.lastRenderTimestamp <= 0 || now - state.lastRenderTimestamp >= renderIntervalMs - 0.5) {
    const previousRenderTimestamp = state.lastRenderTimestamp;
    const frameStart = performance.now();
    render();
    frameCpuMs = Math.max(0, performance.now() - frameStart);
    renderDeltaMs = previousRenderTimestamp > 0 ? clamp(now - previousRenderTimestamp, 1, 240) : frameDeltaMs;
    state.lastRenderTimestamp = now;
  }
  updateRenderQualityFromFrame(frameDeltaMs, frameCpuMs, renderDeltaMs);
  window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  refreshAutomaticRenderQualityRankCache();
  const stageRect = gameStageEl?.getBoundingClientRect();
  const width = Math.max(260, Math.floor(stageRect?.width || window.innerWidth || 0));
  const height = Math.max(220, Math.floor(stageRect?.height || window.innerHeight || 0));
  const deviceDpr = clamp(Math.max(1, window.devicePixelRatio || 1), 1, MAX_RENDER_DPR);
  const renderScale = 1;
  const targetDpr = deviceDpr;
  const nextCanvasWidth = Math.max(1, Math.round(width * targetDpr));
  const effectiveDpr = nextCanvasWidth / Math.max(1, width);
  const nextCanvasHeight = Math.max(1, Math.round(height * effectiveDpr));

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (canvas.width !== nextCanvasWidth) {
    canvas.width = nextCanvasWidth;
  }
  if (canvas.height !== nextCanvasHeight) {
    canvas.height = nextCanvasHeight;
  }
  ctx.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);

  state.viewport = {
    width,
    height,
    dpr: effectiveDpr,
    deviceDpr,
    renderScale,
    baseRenderScale: renderScale,
    laserCrowdRenderScalePenalty: 0,
  };
  refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
  refreshZoneActionButtons();
  render();
}

let runtimeUiInteractionSystem = null;

function getRuntimeUiInteractionSystem() {
  if (!runtimeUiInteractionSystem) {
    runtimeUiInteractionSystem = decorateRuntimeUiInteractionSystem(createRuntimeUiInteractionSystem({
      bindings: buildRuntimeBindingSnapshot(RUNTIME_UI_INTERACTION_BINDING_KEYS, {
        captureRootEl,
        loadingScreenEl,
        routeNavPanelEl,
        routeNavInfoPanelEl,
        mapConnectionsInfoPanelEl,
        GAME_DESIGN_SNAPSHOT: getGameDesignConfigSnapshot(),
        TRAINER_BATTLE_TEAM_SIZE_COUNT,
        TRAINER_BATTLE_ENEMY_HP_MULTIPLIER,
        TRAINER_BATTLE_ENEMY_TIMER_MS,
        worldUiLayerEl,
        boxesSearchInputEl,
        pokedexSearchInputEl,
        trainerBattleSetupModalEl,
        trainerBattleSetupTitleEl,
        trainerBattleSetupSubtitleEl,
        trainerBattleSetupRosterEl,
        trainerBattleSetupRulesEl,
        trainerBattleSetupSlotsEl,
        trainerBattleSetupStatusEl,
        trainerBattleSetupCloseButtonEl,
        trainerBattleSetupCancelButtonEl,
        trainerBattleSetupConfirmButtonEl,
        projectWorldToRuntimeStage,
        getAppearanceUnlockState,
        ensureAppearanceEditorUnlockedFromProgress,
        enqueueEvolutionReadyNotification,
        findNextEligibleEvolution,
        getTrainerBattleSetupDefinition,
        isTrainerBattleActive,
        queueTeamLevelUpEffects,
        rebuildTeamAndSyncBattle,
        refreshZoneActionButtons,
        persistSaveData,
        setEntityLevel,
      }),
    }));
  }
  return runtimeUiInteractionSystem;
}

const runtimeUiInteractionFacade = new Proxy({}, {
  get(_target, methodName) {
    return (...args) => getRuntimeUiInteractionSystem()[methodName](...args);
  },
});

const { getWorldCoordinatesFromPointerEvent, isCanvasBattleInteractionBlocked, syncCanvasInteractionCursor, setHoveredBallOverlayType, setHoveredTeamSlotIndex, getNormalizedPointerType, isPrimaryCanvasPointerEvent, isEventFromActiveTeamDragPointer, captureCanvasPointer, releaseCanvasPointer, getTeamDragActivationDistancePx, isTouchLikePointerType, resetTeamContextTouchHoldState, cancelTeamContextTouchHold, triggerTeamContextTouchHold, scheduleTeamContextTouchHold, updateTeamContextTouchHoldFromMove, isTeamSlotSwapAllowed, clearTeamDragState, beginTeamDragForSlot, isTeamDragClickSuppressed, swapTeamSlotsFromUi, getBallCaptureMenuBallType, closeBallCaptureMenu, closeTeamContextMenu, refreshRenameCharCount, closeRenameModal, openRenameModalForTeamSlot, applyRenameModal, clearCanvasHoverState, hideHoverPopup, findHoveredTeamSlot, findHoveredBallOverlayHitbox, findHoveredPokemon, showHoverPopup, positionFloatingMenuElement, setBallCaptureToggleButtonState, refreshBallCaptureMenu, openBallCaptureMenu, toggleBallCaptureRule, refreshTeamContextMenu, openTeamContextMenu, getTeamSlotLabel, getPokemonDisplayNameById, levelUpAllOwnedPokemonFromDev, findTeamFamilyConflictSlotIndex, getCapturedEntityBoxesEntries, getCapturedEntityCount, getTotalShinyCapturesGlobal, cancelQueuedPokedexGridRender, cancelQueuedPokedexViewportRender, invalidatePokedexEntriesCache, queuePokedexGridRender, queuePokedexViewportRender, buildPokedexSpeciesHintMap, normalizePokedexSpeciesNameEn, getPokedexVariantPreferenceByPokemonId, buildPokedexSpeciesSpritePathForVariant, getPokedexPreferredOfflineVariantId, buildPokedexSpeciesSpritePath, getPokedexPreferredSpriteVariantFromDef, resolvePokedexSpeciesSpritePath, getPokedexSpeciesCatalogByPokemonId, refreshPokedexEntriesCacheIfNeeded, getPokedexEntries, getPokedexEntryByPokemonId, getPokedexSpeciesProgressCounters, formatPokedexSpeciesProgressPercent, formatPokedexCompletionPercentFromRatio, setPokedexHeaderProgressSummary, setPokedexInfoFromEntry, resetPokedexVirtualDomReferences, updatePokedexVirtualLayoutMetricsIfNeeded, getPokedexVirtualMetrics, resolvePokedexCardButtonFromEventTarget, handlePokedexCardInteractionEvent, bindPokedexVirtualEventsIfNeeded, ensurePokedexVirtualResizeObserver, ensurePokedexVirtualElements, prefetchPokedexSpritePath, prefetchPokedexSpritesAroundSlice, createPokedexLoadingIndicatorElement, attachPokedexSpriteLoadingLifecycle, createPokedexCardButton, renderPokedexViewportSlice, closePokedexModal, renderPokedexGrid, openPokedexModal, setBoxesInfoFromEntry, closeBoxesModal, renderBoxesGrid, openBoxesForTeamSlot, openBoxesForTrainerBattleSlot, closeAppearanceModal, openAppearanceForPokemon, renderAppearanceModal, openAppearanceForTeamSlot, openAppearanceForBoxPokemon, toggleAppearanceShinyMode, toggleAppearanceUltraShinyMode, handleCanvasPointerDown, handleCanvasPointerMove, handleCanvasPointerUp, handleCanvasClick, handleCanvasContextMenu, handleCanvasPointerCancel, handleWindowPointerUpOutsideCanvas, exportTextState, getPokemonLoadTargets, setPokemonTalentCsvState, getPokemonTalentCsvForPokemonId, applyPokemonTalentCsvToDefinitions, setBallConfigState, setShopItemConfigState, setZoneEncounterCsvState, hasRouteUnlockedInSaveData, hasUnknownCaveUnlockedInSave, isPostUnknownCaveContentUnlocked, getCurrentPokedexMaxPokemonId, getCurrentGachaMaxPokemonId, formatPokemonRangeLabel, getCurrentGachaPokemonRangeLabel, getZoneEncounterCsvForRoute, mergeRouteEncountersFromCsv, cloneEncounterEntries, getRouteBaseEncounterEntries, applyEncounterMappingToRouteData, refreshRouteCatalogEncounterMapping, buildRouteDataPath, loadRouteData, loadRouteCatalog, getRouteDataListFromInput, getRouteDataByIds, getInitialAssetRouteIds, preloadRouteBackgrounds, queueDeferredRouteAssetWarmup, hasMissingRoutePokemonDefinitions, ensureRouteBackgroundLoaded, ensureRouteDefinitionsLoaded, ensureRouteAssetsLoaded, ensureUnlockedRoutesForCurrentCatalog, setActiveRoute, tryUnlockNextRouteAfterDefeat } = runtimeUiInteractionFacade;
const runtimeBootstrapSystem = createRuntimeBootstrapSystem({
  document,
  window,
  state,
  getPokemonLoadTargets,
  loadPokemonEntity,
  buildPokemonJsonPath,
  applyPokemonTalentCsvToDefinitions,
  showLoadingScreen,
  hideLoadingScreen,
  render,
  updateEnvironment,
  initializeWindowsNotificationSystem,
  resetNotificationSystem,
  normalizeShopQuantityMode,
  clamp,
  toSafeInt,
  clearMoneyGainFloaters,
  setBallConfigState,
  setShopItemConfigState,
  setZoneEncounterCsvState,
  setPokemonTalentCsvState,
  stopBackgroundTicker,
  stopForegroundCatchupPump,
  clearTeamDragState,
  closeTeamContextMenu,
  clearCanvasHoverState,
  closeRenameModal,
  closeBoxesModal,
  closePokedexModal,
  closeAppearanceModal,
  closeGachaModal,
  setMapOpen,
  setShopOpen,
  loadBallConfigCsv,
  BALL_CONFIG_CSV_PATH,
  loadShopItemConfigCsv,
  SHOP_ITEMS_CSV_PATH,
  loadZoneEncounterCsv,
  ROUTE_ENCOUNTERS_CSV_PATH,
  loadPokemonTalentCsv,
  POKEMON_TALENTS_CSV_PATH,
  loadSaveData,
  loadRouteCatalog,
  ROUTE_ID_ORDER,
  refreshOrderedCatalogRouteIds,
  ensureUnlockedRoutesForCurrentCatalog,
  DEFAULT_ROUTE_ID,
  getInitialAssetRouteIds,
  getRouteDataByIds,
  reconcileEntityUnlockStates,
  reconcileEntityAppearanceStates,
  repairRuntimeSaveAfterDefinitionsLoaded,
  getTutorialProgress,
  ensureAppearanceEditorUnlockedFromProgress,
  preloadRouteBackgrounds,
  preloadTypeIcons,
  preloadSelectedAppearanceAssetsForTeam,
  setActiveRoute,
  ensureMoneyAndItems,
  syncWindowsPokeballInventoryTracking,
  rebuildTeamAndSyncBattle,
  persistSaveData,
  queueOfflineCatchupFromSave,
  renderStarterChoices,
  updateHud,
  showStarterModal,
  setTopMessage,
  hideStarterModal,
  startBattle,
  queueDeferredRouteAssetWarmup,
  queueAppearanceTutorialIfNeeded,
  tryOpenPendingTutorialFlow,
  consumePendingSimulation,
  HIDDEN_SIM_BUDGET_MS,
  refreshLayoutIfNeeded,
  ensureBackgroundTicker,
  clearBrowserSaveRetry,
  clearDesktopSaveRetry,
  removeSaveDataFromStorageKey,
  removeLegacySaveDataFromLocalStorage,
  removeLegacySaveDataFromSessionStorage,
  SAVE_KEY,
  deleteSaveDataFromIndexedDb,
  deleteSaveDataFromDesktopBridge,
  deleteLegacySaveDataFromIndexedDb,
  deleteLegacySaveDataFromDesktopBridge,
  updateSaveBackendIndicator,
  createEmptySave,
  serializeSaveData,
  isCompactSavePayload: (payload) => isCompactSavePayload(payload, getCompactSaveCodecOptions()),
  decodeCompactSave,
  repairNormalizedSaveSnapshot,
  gameStageEl,
  canvas,
  tutorialModalEl,
  actionDockFullscreenMenuEl,
  actionDockPokeballToggleButtonEl,
  actionDockPokeballVisualEl,
  LOADING_SCREEN_DEFAULT_TEXT,
  SHOP_TAB_POKEBALLS,
  SHOP_TAB_COMBAT,
  SHOP_TAB_EVOLUTIONS,
  BALL_INVENTORY_MAX_PER_TYPE,
  ACTION_DOCK_FULLSCREEN_MENU_TRANSITION_MS,
});

const {
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
} = runtimeBootstrapSystem;


const runtimeInputSystem = createRuntimeInputSystem({
  documentRef: document,
  windowRef: window,
  canvas,
  state,
  constants: {
    TEAM_DRAG_CLICK_SUPPRESS_MS,
    MAX_TEAM_SIZE,
    BALL_CAPTURE_RULE_CAPTURE_ALL,
    BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
    BALL_CAPTURE_RULE_CAPTURE_OWNED,
    BALL_CAPTURE_RULE_CAPTURE_SHINY,
    BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
    GACHA_SPIN_COST_COINS,
    GACHA_BATCH_SPIN_COUNT,
    GACHA_BATCH_SPIN_COST_COINS,
    SHOP_TAB_POKEBALLS,
    SHOP_TAB_COMBAT,
    SHOP_TAB_EVOLUTIONS,
    SHOP_QUANTITY_MODE_CUSTOM,
    BALL_INVENTORY_MAX_PER_TYPE,
  },
  elements: {
    teamContextMenuEl,
    teamContextMenuRenameButtonEl,
    teamContextMenuBoxesButtonEl,
    teamContextMenuAppearanceButtonEl,
    ballCaptureMenuEl,
    ballCaptureToggleAllButtonEl,
    ballCaptureToggleUnownedButtonEl,
    ballCaptureToggleOwnedButtonEl,
    ballCaptureToggleShinyButtonEl,
    ballCaptureToggleUltraButtonEl,
    exportSaveButtonEl,
    importSaveButtonEl,
    resetSaveButtonEl,
    mapButtonEl,
    pokedexButtonEl,
    shopButtonEl,
    gachaButtonEl,
    windowsNotificationButtonEl,
    actionDockPokeballToggleButtonEl,
    actionDockPokeballVisualEl,
    actionDockFullscreenMenuEl,
    actionDockFullscreenGridEl,
    hoverPopupEl,
    routeNavPanelEl,
    routeNavDrawerToggleButtonEl,
    routeNavDrawerEl,
    routeNavDrawerCloseButtonEl,
    routeNavDrawerListEl,
    routeNavInfoPanelEl,
    routeNavDestinationsEl,
    closeShopButtonEl,
    gachaCloseButtonEl,
    gachaSpinButtonEl,
    gachaSpin10ButtonEl,
    evolutionItemCloseButtonEl,
    mapCloseButtonEl,
    mapImageEl,
    mapConnectionsListEl,
    mapConnectionsInfoPanelEl,
    shopTabPokeballsButtonEl,
    shopTabCombatButtonEl,
    shopTabEvolutionsButtonEl,
    shopQtyPresetButtonEls,
    shopCustomQtyInputEl,
    renameCloseButtonEl,
    renameResetButtonEl,
    renameInputEl,
    renameFormEl,
    boxesCloseButtonEl,
    boxesInfoPanelEl,
    pokedexCloseButtonEl,
    pokedexInfoPanelEl,
    appearanceCloseButtonEl,
    appearanceShinyToggleButtonEl,
    appearanceUltraShinyToggleButtonEl,
    devLevelAllButtonEl,
    tutorialPrevButtonEl,
    tutorialNextButtonEl,
    tutorialCloseButtonEl,
    boxesModalEl,
    pokedexModalEl,
    appearanceModalEl,
    renameModalEl,
    tutorialModalEl,
    shopModalEl,
    gachaModalEl,
    evolutionItemModalEl,
    mapModalEl,
    dialogueModalEl,
    dialogueChoiceListEl,
    dialogueNextButtonEl,
    dialogueCloseButtonEl,
    trainerBattleSetupModalEl,
    trainerBattleSetupSlotsEl,
    trainerBattleSetupCloseButtonEl,
    trainerBattleSetupCancelButtonEl,
    trainerBattleSetupConfirmButtonEl,
    worldUiLayerEl,
  },
  actions: {
    clearTeamDragState,
    clearCanvasHoverState,
    render,
    isActionDockFullscreenMenuOpen,
    setActionDockFullscreenMenuOpen,
    closeEvolutionItemChoiceModal,
    closeRenameModal,
    closeBallCaptureMenu,
    closeTeamContextMenu,
    closeTutorialModal,
    setMapOpen,
    setShopOpen,
    closeGachaModal,
    closeAppearanceModal,
    closePokedexModal,
    closeBoxesModal,
    closeTrainerBattleSetupModal,
    toggleFullscreen,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasPointerCancel,
    handleCanvasClick,
    handleCanvasContextMenu,
    getNormalizedPointerType,
    handleWindowPointerUpOutsideCanvas,
    cancelTeamContextTouchHold,
    openRenameModalForTeamSlot,
    openBoxesForTeamSlot,
    openBoxesForTrainerBattleSlot,
    openAppearanceForTeamSlot,
    confirmTrainerBattleSetup,
    toggleBallCaptureRule,
    exportSaveToFile,
    importSaveFromFile,
    resetSaveAndRestart,
    toggleShopPanel,
    setGachaOpen,
    toggleWindowsNotificationSystemFromButton,
    toggleActionDockFullscreenMenu,
    applyRouteChange,
    toggleRouteNavDrawer,
    setRouteNavDrawerOpen,
    openRouteNavigationInfo,
    closeRouteNavigationInfo,
    startGachaSpin,
    setShopTab,
    setShopQuantityMode,
    renderShopModal,
    refreshRenameCharCount,
    sanitizePokemonNickname,
    applyRenameModal,
    toggleAppearanceShinyMode,
    toggleAppearanceUltraShinyMode,
    levelUpAllOwnedPokemonFromDev,
    setBoxesInfoFromEntry,
    setPokedexInfoFromEntry,
    getTutorialFlowDefinition,
    renderTutorialModal,
    syncMapMarkerLayerBounds,
    renderMapModal,
    closeDialogueModal,
    advanceActiveDialogue,
    chooseActiveDialogueChoice,
    triggerZoneAction,
    openPokedexModal,
    resizeCanvas,
    handleVisibilityChange,
    handlePageLifecyclePersist,
    handleRuntimeLifecycleSignal,
  },
});
runtimeInputSystem.init();
initializeDesktopWindowStateBridge();
initializeCapacitorLifecycleBridge();
state.devLayout.settings = createDefaultDevLayoutSettings();

applyInitialPerformanceProfile();
resizeCanvas();
state.realClockLastMs = Date.now();
state.lastSimulationPumpAtMs = state.realClockLastMs;
applyRuntimeActivityTransition("bootstrap");
syncBackgroundRuntimeDebugOverlay();

function bootstrapRuntimeStartup() {
  initializeScene();
  refreshZoneActionButtons();
  queueArrivalDialoguesForRoute(state.routeData?.route_id || state.saveData?.current_route_id || DEFAULT_ROUTE_ID);
  ensureDesktopRuntimeWatchdog();
  if (shouldRunBackgroundTicker()) {
    ensureBackgroundTicker();
  }
  window.requestAnimationFrame(gameLoop);
}

bootstrapRuntimeStartup();
