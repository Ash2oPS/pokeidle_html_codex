import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readGameRuntimeSource() {
  return readFileSync(new URL("../game-runtime.js", import.meta.url), "utf8");
}

function loadApplyEvolutionUnlockAndTeamPlacement(overrides = {}) {
  const source = readGameRuntimeSource();
  const functionStart = source.indexOf(
    "function applyEvolutionUnlockAndTeamPlacement(fromPokemonId, toPokemonId, preferredSlotIndex = -1) {",
  );
  const functionEnd = source.indexOf("\nfunction getEvolutionStoneMethodItem(stoneType) {", functionStart);

  assert.ok(functionStart >= 0);
  assert.ok(functionEnd > functionStart);

  const functionBody = source.slice(functionStart, functionEnd);
  const state = {
    saveData: {
      team: [],
    },
    pokemonDefsById: new Map([
      [25, { id: 25, nameFr: "Pikachu" }],
      [26, { id: 26, nameFr: "Raichu" }],
      [133, { id: 133, nameFr: "Evoli" }],
      [134, { id: 134, nameFr: "Aquali" }],
    ]),
    ...overrides.state,
  };

  const records = new Map(
    Object.entries(overrides.records || {
      25: { id: 25, entity_unlocked: true },
      133: { id: 133, entity_unlocked: true },
    }).map(([key, value]) => [Number(key), value]),
  );

  const createFunction = new Function(
    "state",
    "MAX_TEAM_SIZE",
    "getPokemonEntityRecord",
    "isEntityUnlocked",
    "ensurePokemonEntityUnlocked",
    "consumeEvolutionItemConditionReady",
    `${functionBody}\nreturn applyEvolutionUnlockAndTeamPlacement;`,
  );

  const applyEvolutionUnlockAndTeamPlacement = createFunction(
    state,
    overrides.maxTeamSize ?? 6,
    (pokemonId) => records.get(Number(pokemonId)) || null,
    (record) => Boolean(record?.entity_unlocked),
    overrides.ensurePokemonEntityUnlocked || (() => ({ wasUnlocked: false })),
    overrides.consumeEvolutionItemConditionReady || (() => {}),
  );

  return {
    applyEvolutionUnlockAndTeamPlacement,
    state,
  };
}

test("team evolution replaces the source slot even when the team is not full", () => {
  const { applyEvolutionUnlockAndTeamPlacement, state } = loadApplyEvolutionUnlockAndTeamPlacement({
    state: {
      saveData: {
        team: [25, 134],
      },
    },
  });

  const result = applyEvolutionUnlockAndTeamPlacement(25, 26, 0);

  assert.deepEqual(state.saveData.team, [26, 134]);
  assert.equal(result?.teamAction, "replaced");
  assert.equal(result?.teamSlotIndex, 0);
});

test("team evolution replaces the source slot even when sparse empty slots are present", () => {
  const { applyEvolutionUnlockAndTeamPlacement, state } = loadApplyEvolutionUnlockAndTeamPlacement({
    state: {
      saveData: {
        team: [25, 0, 134],
      },
    },
  });

  const result = applyEvolutionUnlockAndTeamPlacement(25, 26, 0);

  assert.deepEqual(state.saveData.team, [26, 0, 134]);
  assert.equal(result?.teamAction, "replaced");
  assert.equal(result?.teamSlotIndex, 0);
});
