import test from "node:test";
import assert from "node:assert/strict";

import { hasMeaningfulSaveProgress, repairNormalizedSaveData } from "../lib/save-consistency.js";

test("repairNormalizedSaveData rebuilds a missing team from owned entities", () => {
  const save = {
    starter_chosen: false,
    team: [],
    current_route_id: "kanto_route_3",
    unlocked_route_ids: ["kanto_city_pallet_town", "kanto_route_1", "kanto_city_viridian_city", "kanto_route_2"],
    pokemon_entities: {
      4: {
        id: 4,
        level: 17,
        xp: 120,
        entity_unlocked: true,
        captured_normal: 1,
        captured_shiny: 0,
      },
      16: {
        id: 16,
        level: 5,
        xp: 40,
        entity_unlocked: true,
        captured_normal: 1,
        captured_shiny: 0,
      },
    },
  };

  const result = repairNormalizedSaveData(save, {
    maxTeamSize: 6,
    defaultRouteId: "kanto_city_pallet_town",
  });

  assert.equal(result.recoveredTeam, true);
  assert.equal(result.orphanedProgress, false);
  assert.equal(save.starter_chosen, true);
  assert.deepEqual(save.team, [4, 16]);
});

test("repairNormalizedSaveData flags orphaned progress without owned pokemon", () => {
  const save = {
    starter_chosen: false,
    team: [],
    current_route_id: "kanto_route_8",
    unlocked_route_ids: ["kanto_city_pallet_town", "kanto_route_1", "kanto_city_viridian_city"],
    money: 1200,
    route_defeat_counts: {
      kanto_city_pallet_town: 0,
      kanto_route_1: 25,
    },
    pokemon_entities: {},
  };

  const result = repairNormalizedSaveData(save, {
    maxTeamSize: 6,
    defaultRouteId: "kanto_city_pallet_town",
  });

  assert.equal(result.recoveredTeam, false);
  assert.equal(result.orphanedProgress, true);
  assert.equal(hasMeaningfulSaveProgress(save, "kanto_city_pallet_town"), true);
});
