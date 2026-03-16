import test from "node:test";
import assert from "node:assert/strict";

import { createRouteEncounterCombatSystem } from "../systems/encounter/route-encounter-combat-system.js";

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function readEncounterMethods(encounter) {
  if (Array.isArray(encounter?.methods)) {
    return encounter.methods.map((method) => String(method));
  }
  if (Array.isArray(encounter?.encounterMethods)) {
    return encounter.encounterMethods.map((method) => String(method));
  }
  return String(encounter?.methods || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function createFixture(options = {}) {
  const routeId = "kanto_route_1";
  const encounter = options.encounter || { id: 25, catch_rate: 90, methods: ["walk"] };
  const pokemonDef = {
    id: 25,
    nameFr: "Pikachu",
    stats: { hp: 35, attack: 55 },
    spritePath: "pikachu-front.png",
    shinySpritePath: "pikachu-front-shiny.png",
    spriteImage: { name: "normal-sprite" },
    spriteShinyImage: { name: "shiny-sprite" },
    catchRate: 190,
  };

  const state = {
    routeData: {
      route_id: routeId,
      encounters: [encounter],
    },
    saveData: {
      current_route_id: routeId,
    },
    pokemonDefsById: new Map([[25, pokemonDef]]),
  };

  const calls = {
    rewardScale: [],
    progressRouteIds: [],
  };

  let randomQueue = Array.isArray(options.randomQueue) ? options.randomQueue.slice() : [0.99, 0.99];
  let routeCombatEnabled = options.routeCombatEnabled == null ? true : Boolean(options.routeCombatEnabled);

  const system = createRouteEncounterCombatSystem({
    state,
    isCurrentRouteCombatEnabled: () => routeCombatEnabled,
    pickEncounterForCurrentRoute: () =>
      options.pickResult || {
        encounter,
        isOnlyOneEncounter: false,
      },
    encounterHasMethod: (candidate, methodId) => readEncounterMethods(candidate).includes(String(methodId)),
    getEncounterMethods: (candidate) => readEncounterMethods(candidate),
    pickEncounterLevel: () => 12,
    computeStatsAtLevel: (stats, level) => ({
      ...stats,
      level,
    }),
    computeBattleHpMax: () => 100,
    getActiveTeamSizeForBalance: () => 3,
    getEnemyHpTeamScaleMultiplier: () => 1.25,
    getEnemyRewardScaleMultiplier: (teamHpScaleMultiplier, isOnlyOne) => {
      calls.rewardScale.push({ teamHpScaleMultiplier, isOnlyOne });
      return isOnlyOne ? 4 : 1.25;
    },
    resolveSpriteAppearanceForEntity: () => ({
      spritePath: "",
      spriteImage: null,
      variant: { id: "variant-default" },
      animated: false,
      shinyVisual: false,
      ultraShinyVisual: false,
      shinyNegativeFallbackVisual: false,
    }),
    getSpriteVariantById: () => ({
      id: "variant-default",
      frontPath: "variant-default-front.png",
      frontShinyPath: "variant-default-front-shiny.png",
    }),
    getDefaultSpriteVariantId: () => "variant-default",
    getCachedSpriteImage: (path) => ({ drawable: true, path }),
    isDrawableImage: (image) => Boolean(image?.drawable),
    normalizeStatsPayload: (stats) => ({
      ...stats,
      normalized: true,
    }),
    shouldForceUltraShinyAllPokemon: () => false,
    getRouteUnlockProgressState: (activeRouteId) => {
      calls.progressRouteIds.push(String(activeRouteId));
      return {
        timerEnabled: true,
        timerDurationMs: 4567,
      };
    },
    toSafeInt,
    defaultRouteId: routeId,
    onlyOneEncounterHpMultiplier: 3,
    onlyOneEncounterTimerMs: 9000,
    onlyOneEncounterMethodId: "only_one",
    enemyTimerStyleOnlyOne: "only_one",
    enemyTimerStyleRoute: "route",
    ultraShinyOdds: 16,
    nonUltraShinyOddsNumerator: 1,
    nonUltraShinyOddsDenominator: 10,
    randomFn: () => (randomQueue.length > 0 ? randomQueue.shift() : 0.99),
  });

  return {
    state,
    calls,
    system,
    setRouteCombatEnabled(nextEnabled) {
      routeCombatEnabled = Boolean(nextEnabled);
    },
  };
}

test("createRouteEnemyInstance returns null when route combat is disabled", () => {
  const fixture = createFixture({
    routeCombatEnabled: false,
  });

  const enemy = fixture.system.createRouteEnemyInstance();

  assert.equal(enemy, null);
});

test("createRouteEnemyInstance builds a normal route enemy with balance metadata", () => {
  const fixture = createFixture();

  const enemy = fixture.system.createRouteEnemyInstance();

  assert.equal(enemy.id, 25);
  assert.equal(enemy.level, 12);
  assert.equal(enemy.hpMax, 125);
  assert.equal(enemy.balanceHpMultiplier, 1.25);
  assert.equal(enemy.balanceRewardMultiplier, 1.25);
  assert.equal(enemy.enemyTimerStyle, "route");
  assert.equal(enemy.isOnlyOneEncounter, false);
  assert.equal(enemy.isShiny, false);
  assert.equal(enemy.isUltraShiny, false);
  assert.deepEqual(enemy.encounterMethods, ["walk"]);
  assert.equal(enemy.spritePath, "variant-default-front.png");
  assert.equal(enemy.spriteImage.path, "variant-default-front.png");
  assert.deepEqual(fixture.calls.rewardScale[0], {
    teamHpScaleMultiplier: 1.25,
    isOnlyOne: false,
  });
});

test("createRouteEnemyInstance applies only-one multipliers and ultra shiny roll", () => {
  const fixture = createFixture({
    encounter: { id: 25, catch_rate: 45, methods: ["only_one"] },
    pickResult: {
      encounter: { id: 25, catch_rate: 45, methods: ["only_one"] },
      isOnlyOneEncounter: true,
    },
    randomQueue: [0, 0.99],
  });

  const enemy = fixture.system.createRouteEnemyInstance();

  assert.equal(enemy.isOnlyOneEncounter, true);
  assert.equal(enemy.enemyTimerStyle, "only_one");
  assert.equal(enemy.hpMax, 375);
  assert.equal(enemy.balanceRewardMultiplier, 4);
  assert.equal(enemy.isUltraShiny, true);
  assert.equal(enemy.isShiny, true);
  assert.equal(enemy.isShinyVisual, true);
  assert.equal(enemy.isUltraShinyVisual, true);
  assert.equal(enemy.spritePath, "variant-default-front-shiny.png");
  assert.equal(enemy.spriteImage.path, "variant-default-front-shiny.png");
  assert.deepEqual(fixture.calls.rewardScale[0], {
    teamHpScaleMultiplier: 1.25,
    isOnlyOne: true,
  });
});

test("getEnemyTimerConfigForBattle returns only-one timer for only-one enemy", () => {
  const fixture = createFixture();

  const timerConfig = fixture.system.getEnemyTimerConfigForBattle({
    encounterMethods: ["only_one"],
  });

  assert.deepEqual(timerConfig, {
    enabled: true,
    durationMs: 9000,
    style: "only_one",
  });
});

test("getEnemyTimerConfigForBattle returns route progression timer otherwise", () => {
  const fixture = createFixture();

  const timerConfig = fixture.system.getEnemyTimerConfigForBattle({
    encounterMethods: ["walk"],
  });

  assert.deepEqual(timerConfig, {
    enabled: true,
    durationMs: 4567,
    style: "route",
  });
  assert.deepEqual(fixture.calls.progressRouteIds, ["kanto_route_1"]);
});

test("getEnemyLevelForRewards clamps invalid or non-positive values", () => {
  const fixture = createFixture();

  assert.equal(fixture.system.getEnemyLevelForRewards({ level: 0 }), 1);
  assert.equal(fixture.system.getEnemyLevelForRewards({ level: "9.8" }), 9);
  assert.equal(fixture.system.getEnemyLevelForRewards(null), 1);
});
