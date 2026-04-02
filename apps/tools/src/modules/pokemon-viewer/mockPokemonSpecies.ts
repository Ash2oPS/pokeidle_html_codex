import type { PokemonSpeciesSummary } from "@pokeidle/contracts";

export const mockPokemonSpecies: PokemonSpeciesSummary = {
  id: "chimchar",
  dexNumber: 390,
  familyId: "chimchar-family",
  name: {
    en: "Chimchar",
    fr: "Ouisticram",
  },
  primaryType: "fire",
  spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/390.png",
  baseStats: {
    hp: 44,
    attack: 58,
    defense: 44,
    specialAttack: 58,
    specialDefense: 44,
    speed: 61,
  },
};
