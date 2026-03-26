import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeConfigLoaders } from "../lib/runtime-config-loaders.js";

function createFixture() {
  const fetchCalls = [];
  const loaders = createRuntimeConfigLoaders({
    fetchFn: async (...args) => {
      fetchCalls.push({
        url: args[0],
        init: args[1] ?? null,
      });
      return {
        ok: true,
        text: async () => "",
      };
    },
    parseCsvObjects: () => [],
    parseCsvMethods: () => [],
    readCsvCell: () => "",
    readCsvNumberCell: (_row, _key, fallback = 0) => fallback,
    readCsvBooleanCell: (_row, _key, fallback = false) => fallback,
    readCsvTypedValue: (_row, _key, fallback = "") => fallback,
    normalizeTalentDefinition: (value = {}) => ({
      id: String(value?.id || "none"),
      nameFr: String(value?.name_fr || value?.nameFr || ""),
      nameEn: String(value?.name_en || value?.nameEn || ""),
      descriptionFr: String(value?.description_fr || value?.descriptionFr || ""),
    }),
    normalizeTalentId: (value) => String(value || "none"),
    normalizeUiDisplayText: (value) => String(value || ""),
    assertValidBallConfig: (value) => value,
    assertValidShopItemConfig: (value) => value,
    assertValidEncounter: (value) => value,
    hasImplementedTalentEffect: () => true,
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
    },
    clamp: (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)),
    pokemonTalentsCsvPath: "pokemon_data/pokemon_talents.csv",
    ballConfigCsvPath: "item_data/ball_config.csv",
    shopItemsCsvPath: "item_data/shop_items.csv",
    routeEncountersCsvPath: "map_data/kanto_zone_encounters.csv",
    defaultBallConfigByType: {},
    defaultExtraShopItemsById: {},
    defaultWildLevelMin: 2,
    defaultWildLevelMax: 5,
    maxLevel: 100,
  });
  return {
    loaders,
    fetchCalls,
  };
}

test("runtime config loaders request static CSV files without time cache-busters", async () => {
  const { loaders, fetchCalls } = createFixture();

  await loaders.loadPokemonTalentCsv();
  await loaders.loadBallConfigCsv();
  await loaders.loadShopItemConfigCsv();
  await loaders.loadZoneEncounterCsv();

  assert.deepEqual(fetchCalls, [
    { url: "pokemon_data/pokemon_talents.csv", init: null },
    { url: "item_data/ball_config.csv", init: null },
    { url: "item_data/shop_items.csv", init: null },
    { url: "map_data/kanto_zone_encounters.csv", init: null },
  ]);
});
