export function createRouteEncounterCombatSystem({
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
  defaultRouteId,
  onlyOneEncounterHpMultiplier,
  onlyOneEncounterTimerMs,
  onlyOneEncounterMethodId,
  enemyTimerStyleOnlyOne,
  enemyTimerStyleRoute,
  ultraShinyOdds,
  nonUltraShinyOddsNumerator,
  nonUltraShinyOddsDenominator,
  randomFn,
} = {}) {
  const isRouteCombatEnabledFn = typeof isCurrentRouteCombatEnabled === "function" ? isCurrentRouteCombatEnabled : () => false;
  const pickEncounterForRouteFn =
    typeof pickEncounterForCurrentRoute === "function" ? pickEncounterForCurrentRoute : () => ({ encounter: null });
  const encounterHasMethodFn = typeof encounterHasMethod === "function" ? encounterHasMethod : () => false;
  const getEncounterMethodsFn = typeof getEncounterMethods === "function" ? getEncounterMethods : () => [];
  const pickEncounterLevelFn = typeof pickEncounterLevel === "function" ? pickEncounterLevel : () => 1;
  const computeStatsAtLevelFn = typeof computeStatsAtLevel === "function" ? computeStatsAtLevel : () => ({ hp: 1 });
  const computeBattleHpMaxFn = typeof computeBattleHpMax === "function" ? computeBattleHpMax : () => 1;
  const getTeamSizeForBalanceFn = typeof getActiveTeamSizeForBalance === "function" ? getActiveTeamSizeForBalance : () => 1;
  const getEnemyHpScaleMultiplierFn =
    typeof getEnemyHpTeamScaleMultiplier === "function" ? getEnemyHpTeamScaleMultiplier : () => 1;
  const getEnemyRewardScaleMultiplierFn =
    typeof getEnemyRewardScaleMultiplier === "function" ? getEnemyRewardScaleMultiplier : () => 1;
  const resolveAppearanceFn =
    typeof resolveSpriteAppearanceForEntity === "function" ? resolveSpriteAppearanceForEntity : () => ({});
  const getSpriteVariantByIdFn = typeof getSpriteVariantById === "function" ? getSpriteVariantById : () => null;
  const getDefaultSpriteVariantIdFn =
    typeof getDefaultSpriteVariantId === "function" ? getDefaultSpriteVariantId : () => "";
  const getCachedSpriteImageFn = typeof getCachedSpriteImage === "function" ? getCachedSpriteImage : () => null;
  const isDrawableImageFn = typeof isDrawableImage === "function" ? isDrawableImage : () => false;
  const normalizeStatsPayloadFn = typeof normalizeStatsPayload === "function" ? normalizeStatsPayload : (stats) => stats || {};
  const shouldForceUltraShinyAllPokemonFn =
    typeof shouldForceUltraShinyAllPokemon === "function" ? shouldForceUltraShinyAllPokemon : () => false;
  const getRouteUnlockProgressStateFn =
    typeof getRouteUnlockProgressState === "function"
      ? getRouteUnlockProgressState
      : () => ({ timerEnabled: false, timerDurationMs: 0 });
  const toSafeIntFn =
    typeof toSafeInt === "function"
      ? toSafeInt
      : (value, fallback = 0) => {
          const numeric = Number(value);
          return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
        };
  const rollRandom = typeof randomFn === "function" ? randomFn : Math.random;

  function isOnlyOneEncounterEnemy(enemy) {
    if (!enemy || typeof enemy !== "object") {
      return false;
    }
    if (enemy.isOnlyOneEncounter === true) {
      return true;
    }
    return encounterHasMethodFn({ methods: enemy.encounterMethods }, onlyOneEncounterMethodId);
  }

  function createRouteEnemyInstance() {
    if (!state.routeData || !isRouteCombatEnabledFn() || !Array.isArray(state.routeData.encounters)) {
      return null;
    }
    const pickResult = pickEncounterForRouteFn(state.routeData);
    const picked = pickResult?.encounter || null;
    if (!picked) {
      return null;
    }
    const def = state.pokemonDefsById.get(Number(picked.id));
    if (!def) {
      return null;
    }

    const isUltraShiny = Math.floor(rollRandom() * ultraShinyOdds) === 0;
    const isRegularShiny =
      !isUltraShiny && Math.floor(rollRandom() * nonUltraShinyOddsDenominator) < nonUltraShinyOddsNumerator;
    const isShiny = isUltraShiny || isRegularShiny;
    const forceUltraShiny = shouldForceUltraShinyAllPokemonFn();
    const ultraShinyVisual = Boolean(isUltraShiny || forceUltraShiny);
    const shinyVisual = Boolean(isShiny || ultraShinyVisual);
    const isOnlyOneEncounter = Boolean(pickResult?.isOnlyOneEncounter && encounterHasMethodFn(picked, onlyOneEncounterMethodId));
    const level = pickEncounterLevelFn(picked);
    const stats = computeStatsAtLevelFn(def.stats, level);
    const baseHpMax = computeBattleHpMaxFn(stats, level, true);
    const teamSizeForBalance = getTeamSizeForBalanceFn();
    const teamHpScaleMultiplier = getEnemyHpScaleMultiplierFn(teamSizeForBalance);
    const encounterHpMultiplier = isOnlyOneEncounter ? onlyOneEncounterHpMultiplier : 1;
    const hpBalanceMultiplier = teamHpScaleMultiplier * encounterHpMultiplier;
    const hpMax = Math.max(1, Math.round(baseHpMax * hpBalanceMultiplier));
    const rewardScaleMultiplier = getEnemyRewardScaleMultiplierFn(teamHpScaleMultiplier, isOnlyOneEncounter);
    const appearance = resolveAppearanceFn(def.id, {
      shinyVisual,
      ultraShinyVisual,
      forceUltraShiny: ultraShinyVisual,
      respectAppearanceShinyMode: false,
      respectAppearanceUltraShinyMode: false,
    });
    const defaultVariant = getSpriteVariantByIdFn(def, getDefaultSpriteVariantIdFn(def));
    const defaultNormalPath = defaultVariant?.frontPath || def.spritePath || "";
    const defaultShinyPath = defaultVariant?.frontShinyPath || def.shinySpritePath || defaultNormalPath;
    const spritePath = appearance.spritePath || (shinyVisual ? defaultShinyPath : defaultNormalPath);
    const cachedSpriteImage = spritePath ? getCachedSpriteImageFn(spritePath) : null;
    const spriteImage = isDrawableImageFn(cachedSpriteImage)
      ? cachedSpriteImage
      : appearance.spriteImage || (shinyVisual ? def.spriteShinyImage || def.spriteImage : def.spriteImage);

    return {
      ...def,
      level,
      stats,
      baseStats: normalizeStatsPayloadFn(def.stats),
      hpMax,
      hpCurrent: hpMax,
      catchRate: Number(def.catchRate || picked.catch_rate || 45),
      isShiny,
      isUltraShiny,
      isOnlyOneEncounter,
      enemyTimerStyle: isOnlyOneEncounter ? enemyTimerStyleOnlyOne : enemyTimerStyleRoute,
      encounterMethods: getEncounterMethodsFn(picked),
      balanceTeamSize: teamSizeForBalance,
      balanceHpMultiplier: hpBalanceMultiplier,
      balanceRewardMultiplier: rewardScaleMultiplier,
      isShinyVisual: Boolean(shinyVisual || appearance.shinyVisual || appearance.ultraShinyVisual),
      isUltraShinyVisual: Boolean(ultraShinyVisual || appearance.ultraShinyVisual),
      isShinyNegativeFallbackVisual: Boolean(
        appearance.shinyNegativeFallbackVisual && !(ultraShinyVisual || appearance.ultraShinyVisual),
      ),
      spritePath,
      spriteImage: spriteImage || def.spriteImage,
      spriteVariantId: appearance.variant?.id || defaultVariant?.id || getDefaultSpriteVariantIdFn(def),
      spriteAnimated: Boolean(appearance.animated),
    };
  }

  function getEnemyTimerConfigForBattle(enemy = null) {
    if (!isRouteCombatEnabledFn()) {
      return {
        enabled: false,
        durationMs: 0,
        style: enemyTimerStyleRoute,
      };
    }
    if (isOnlyOneEncounterEnemy(enemy)) {
      return {
        enabled: true,
        durationMs: onlyOneEncounterTimerMs,
        style: enemyTimerStyleOnlyOne,
      };
    }
    const activeRouteId = state.routeData?.route_id || state.saveData?.current_route_id || defaultRouteId;
    const progressState = getRouteUnlockProgressStateFn(activeRouteId);
    return {
      enabled: progressState.timerEnabled,
      durationMs: progressState.timerDurationMs,
      style: enemyTimerStyleRoute,
    };
  }

  function getEnemyLevelForRewards(enemy) {
    return Math.max(1, toSafeIntFn(enemy?.level, 1));
  }

  return {
    isOnlyOneEncounterEnemy,
    createRouteEnemyInstance,
    getEnemyTimerConfigForBattle,
    getEnemyLevelForRewards,
  };
}
