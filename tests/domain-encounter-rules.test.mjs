import test from "node:test";
import assert from "node:assert/strict";

import { rollShinyEncounterState } from "../domain/encounter/shiny-rules.js";

function createRandomSequence(values) {
  const queue = values.slice();
  return () => (queue.length > 0 ? queue.shift() : 0.99);
}

test("encounter shiny rules honor forceUltraShiny override", () => {
  const result = rollShinyEncounterState({
    randomFn: createRandomSequence([0.9, 0.9]),
    ultraShinyOdds: 4096,
    nonUltraShinyOddsNumerator: 1,
    nonUltraShinyOddsDenominator: 512,
    forceUltraShiny: true,
  });

  assert.equal(result.isUltraShiny, true);
  assert.equal(result.isShiny, true);
  assert.equal(result.ultraShinyVisual, true);
  assert.equal(result.shinyVisual, true);
});

test("encounter shiny rules resolve regular shiny when ultra roll fails", () => {
  const result = rollShinyEncounterState({
    randomFn: createRandomSequence([0.8, 0.05]),
    ultraShinyOdds: 10,
    nonUltraShinyOddsNumerator: 1,
    nonUltraShinyOddsDenominator: 4,
    forceUltraShiny: false,
  });

  assert.equal(result.isUltraShiny, false);
  assert.equal(result.isRegularShiny, true);
  assert.equal(result.isShiny, true);
  assert.equal(result.ultraShinyVisual, false);
  assert.equal(result.shinyVisual, true);
});

test("encounter shiny rules return non shiny when both rolls fail", () => {
  const result = rollShinyEncounterState({
    randomFn: createRandomSequence([0.8, 0.95]),
    ultraShinyOdds: 10,
    nonUltraShinyOddsNumerator: 1,
    nonUltraShinyOddsDenominator: 8,
  });

  assert.equal(result.isUltraShiny, false);
  assert.equal(result.isRegularShiny, false);
  assert.equal(result.isShiny, false);
  assert.equal(result.ultraShinyVisual, false);
  assert.equal(result.shinyVisual, false);
});
