export function rollShinyEncounterState({
  randomFn = Math.random,
  ultraShinyOdds = 1,
  nonUltraShinyOddsNumerator = 0,
  nonUltraShinyOddsDenominator = 1,
  forceUltraShiny = false,
} = {}) {
  const rollRandom = typeof randomFn === "function" ? randomFn : Math.random;
  const safeUltraShinyOdds = Math.max(1, Math.floor(Number(ultraShinyOdds) || 1));
  const safeNumerator = Math.max(0, Math.floor(Number(nonUltraShinyOddsNumerator) || 0));
  const safeDenominator = Math.max(1, Math.floor(Number(nonUltraShinyOddsDenominator) || 1));

  const isUltraShiny = forceUltraShiny || Math.floor(rollRandom() * safeUltraShinyOdds) === 0;
  const isRegularShiny =
    !isUltraShiny && Math.floor(rollRandom() * safeDenominator) < safeNumerator;
  const isShiny = isUltraShiny || isRegularShiny;

  return {
    isUltraShiny,
    isRegularShiny,
    isShiny,
    ultraShinyVisual: isUltraShiny,
    shinyVisual: isShiny || isUltraShiny,
  };
}
