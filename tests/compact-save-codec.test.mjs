import test from "node:test";
import assert from "node:assert/strict";

import {
  COMPACT_SAVE_BALL_ORDER,
  COMPACT_SAVE_FORMAT_ID,
  COMPACT_SAVE_ITEM_ORDER,
  decodeCompactSave,
  encodeCompactSave,
  extractLegacyAppearanceSpecies,
  isCompactSavePayload,
} from "../lib/compact-save-codec.js";

function createDefaultBallCaptureRules() {
  return {
    capture_all: true,
    capture_unowned: true,
    capture_owned: true,
    capture_shiny: true,
    capture_ultra_shiny: true,
  };
}

function createEmptySave() {
  const ballInventory = Object.fromEntries(COMPACT_SAVE_BALL_ORDER.map((ballType) => [ballType, 0]));
  const ballInventorySeen = Object.fromEntries(COMPACT_SAVE_BALL_ORDER.map((ballType) => [ballType, ballType === "poke_ball"]));
  const ballCaptureRules = Object.fromEntries(COMPACT_SAVE_BALL_ORDER.map((ballType) => [ballType, createDefaultBallCaptureRules()]));
  const shopItems = Object.fromEntries(COMPACT_SAVE_ITEM_ORDER.map((itemId) => [itemId, 0]));
  return {
    version: 7,
    app_build_version: "0.2.0",
    starter_chosen: false,
    current_route_id: "kanto_route_1",
    unlocked_route_ids: ["kanto_route_1"],
    route_defeat_counts: {
      kanto_route_1: 0,
      kanto_route_2: 0,
      kanto_route_3: 0,
    },
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 0,
    coins: 0,
    first_free_pokeball_claimed: false,
    first_free_pokeball_guaranteed_capture_pending: false,
    ball_inventory: ballInventory,
    ball_inventory_seen: ballInventorySeen,
    ball_capture_rules: ballCaptureRules,
    active_ball_type: "poke_ball",
    shop_items: shopItems,
    attack_boost_until_ms: 0,
    pokeballs: 0,
    tutorials: {
      route1_intro_seen: false,
      evolution_intro_seen: false,
      appearance_intro_seen: false,
      appearance_editor_unlocked: true,
    },
    legacy_shiny_family_root_ids: [],
    legacy_ultra_shiny_family_root_ids: [],
  };
}

function normalizePokemonEntityRecord(rawEntity, pokemonId) {
  return {
    id: Number(pokemonId),
    level: Math.max(1, Number(rawEntity?.level || 1)),
    xp: Math.max(0, Number(rawEntity?.xp || 0)),
    entity_unlocked: Boolean(rawEntity?.entity_unlocked),
    appearance_owned_variants: Array.isArray(rawEntity?.appearance_owned_variants)
      ? [...rawEntity.appearance_owned_variants]
      : [],
    appearance_selected_variant: String(rawEntity?.appearance_selected_variant || ""),
    appearance_shiny_mode: Boolean(rawEntity?.appearance_shiny_mode),
    appearance_ultra_shiny_mode: Boolean(rawEntity?.appearance_ultra_shiny_mode),
    evolution_item_ready_targets: Array.isArray(rawEntity?.evolution_item_ready_targets)
      ? [...rawEntity.evolution_item_ready_targets]
      : [],
    nickname: String(rawEntity?.nickname || ""),
    happiness_box_streak_ms: Math.max(0, Number(rawEntity?.happiness_box_streak_ms || 0)),
    species_name_en: "",
    talent: null,
    base_stats: {},
    stats: {},
    encountered_normal: Math.max(0, Number(rawEntity?.encountered_normal || 0)),
    encountered_shiny: Math.max(0, Number(rawEntity?.encountered_shiny || 0)),
    encountered_ultra_shiny: Math.max(0, Number(rawEntity?.encountered_ultra_shiny || 0)),
    defeated_normal: Math.max(0, Number(rawEntity?.defeated_normal || 0)),
    defeated_shiny: Math.max(0, Number(rawEntity?.defeated_shiny || 0)),
    defeated_ultra_shiny: Math.max(0, Number(rawEntity?.defeated_ultra_shiny || 0)),
    captured_normal: Math.max(0, Number(rawEntity?.captured_normal || 0)),
    captured_shiny: Math.max(0, Number(rawEntity?.captured_shiny || 0)),
    captured_ultra_shiny: Math.max(0, Number(rawEntity?.captured_ultra_shiny || 0)),
  };
}

function createCodecOptions() {
  return {
    formatId: COMPACT_SAVE_FORMAT_ID,
    saveVersion: 7,
    appVersion: "0.2.0",
    routeIdOrder: ["kanto_route_1", "kanto_route_2", "kanto_route_3"],
    defaultRouteId: "kanto_route_1",
    createEmptySave,
    normalizePokemonEntityRecord,
  };
}

test("compact codec round-trips an empty save snapshot", () => {
  const saveData = createEmptySave();

  const encoded = encodeCompactSave(saveData, createCodecOptions());
  const decoded = decodeCompactSave(encoded, createCodecOptions());

  assert.equal(encoded.f, COMPACT_SAVE_FORMAT_ID);
  assert.equal(encoded.v, 7);
  assert.equal(isCompactSavePayload(encoded, createCodecOptions()), true);
  assert.equal(decoded.current_route_id, "kanto_route_1");
  assert.deepEqual(decoded.team, []);
  assert.deepEqual(decoded.legacy_shiny_family_root_ids, []);
  assert.equal(decoded.pokeballs, 0);
});

test("compact codec round-trips a rich save and preserves sparse route encoding", () => {
  const saveData = createEmptySave();
  saveData.app_build_version = "0.2.9";
  saveData.last_tick_epoch_ms = 987654321;
  saveData.current_route_id = "kanto_route_2";
  saveData.unlocked_route_ids = ["kanto_route_1", "kanto_route_2", "kanto_route_3"];
  saveData.route_defeat_counts.kanto_route_2 = 18;
  saveData.team = [25];
  saveData.money = 1200;
  saveData.coins = 50;
  saveData.ball_inventory.poke_ball = 5;
  saveData.ball_inventory.hyper_ball = 1;
  saveData.ball_inventory_seen.hyper_ball = true;
  saveData.active_ball_type = "hyper_ball";
  saveData.shop_items.thunder_stone = 2;
  saveData.first_free_pokeball_claimed = true;
  saveData.attack_boost_until_ms = 9999;
  saveData.tutorials.route1_intro_seen = true;
  saveData.legacy_shiny_family_root_ids = [25];
  saveData.legacy_ultra_shiny_family_root_ids = [133];
  saveData.pokemon_entities["25"] = normalizePokemonEntityRecord({
    id: 25,
    level: 18,
    xp: 44,
    entity_unlocked: true,
    appearance_shiny_mode: true,
    appearance_owned_variants: ["black_white"],
    appearance_selected_variant: "black_white",
    nickname: "Pika",
    captured_normal: 1,
    captured_shiny: 1,
    encountered_normal: 4,
    defeated_normal: 3,
  }, 25);

  const encoded = encodeCompactSave(saveData, createCodecOptions());
  const decoded = decodeCompactSave(encoded, createCodecOptions());

  assert.deepEqual(encoded.r, [1, 2, [1, 18]]);
  assert.deepEqual(encoded.w, [1200, 50]);
  assert.deepEqual(encoded.tm, [25]);
  assert.deepEqual(encoded.ls, [25]);
  assert.deepEqual(encoded.lu, [133]);
  assert.equal(decoded.current_route_id, "kanto_route_2");
  assert.deepEqual(decoded.unlocked_route_ids, ["kanto_route_1", "kanto_route_2", "kanto_route_3"]);
  assert.equal(decoded.route_defeat_counts.kanto_route_2, 18);
  assert.equal(decoded.ball_inventory.hyper_ball, 1);
  assert.equal(decoded.active_ball_type, "hyper_ball");
  assert.equal(decoded.shop_items.thunder_stone, 2);
  assert.equal(decoded.pokemon_entities["25"].appearance_selected_variant, "black_white");
  assert.deepEqual(decoded.legacy_shiny_family_root_ids, [25]);
});

test("compact codec trims trailing pokemon tuple defaults", () => {
  const saveData = createEmptySave();
  saveData.pokemon_entities["25"] = normalizePokemonEntityRecord({
    id: 25,
    level: 12,
    xp: 0,
    entity_unlocked: true,
  }, 25);

  const encoded = encodeCompactSave(saveData, createCodecOptions());

  assert.deepEqual(encoded.p["25"], [12, 0, 1, [0, 0, 0, 0, 0, 0, 0, 0, 0]]);
});

test("compact codec rejects invalid compact payloads", () => {
  assert.throws(
    () => decodeCompactSave({ f: "bad", v: 7 }, createCodecOptions()),
    /invalide/i,
  );
});

test("extractLegacyAppearanceSpecies prefers pokemon_entities and falls back to species_stats", () => {
  const fromEntities = extractLegacyAppearanceSpecies({
    pokemon_entities: {
      25: { captured_shiny: 2, captured_ultra_shiny: 0 },
      133: { captured_shiny: 0, captured_ultra_shiny: 1 },
    },
  });
  const fromSpeciesStats = extractLegacyAppearanceSpecies({
    species_stats: {
      7: { captured_shiny: 1 },
      8: { captured_ultra_shiny: 1 },
    },
  });

  assert.deepEqual(fromEntities, {
    shinySpeciesIds: [25],
    ultraShinySpeciesIds: [133],
  });
  assert.deepEqual(fromSpeciesStats, {
    shinySpeciesIds: [7],
    ultraShinySpeciesIds: [8],
  });
});
