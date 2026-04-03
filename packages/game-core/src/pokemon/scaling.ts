import type {
  AttackClass,
  CombatTuningDefinition,
  PokemonSpeciesDefinition,
  SpeciesProgressState,
} from "@pokeidle/contracts";

export function scaleStat(baseStat: number, level: number, scalar: number): number {
  return Math.round(baseStat * (1 + level * scalar));
}

export function getSpeciesLevel(speciesProgress: SpeciesProgressState | undefined): number {
  return speciesProgress?.level ?? 1;
}

export function getSpeciesOffense(
  species: PokemonSpeciesDefinition,
  level: number,
  tuning: CombatTuningDefinition,
): number {
  return Math.max(
    scaleStat(species.baseStats.attack, level, tuning.levelStatScalar),
    scaleStat(species.baseStats.specialAttack, level, tuning.levelStatScalar),
  );
}

export function getSpeciesAttackClass(species: PokemonSpeciesDefinition): AttackClass {
  return species.baseStats.specialAttack > species.baseStats.attack ? "special" : "physical";
}

export function getSpeciesGuard(
  species: PokemonSpeciesDefinition,
  level: number,
  tuning: CombatTuningDefinition,
): number {
  return Math.max(
    scaleStat(species.baseStats.defense, level, tuning.levelStatScalar),
    scaleStat(species.baseStats.specialDefense, level, tuning.levelStatScalar),
  );
}

export function getSpeciesMaxHp(
  species: PokemonSpeciesDefinition,
  level: number,
  tuning: CombatTuningDefinition,
): number {
  return scaleStat(species.baseStats.hp, level, tuning.levelStatScalar) * tuning.enemyHpMultiplier;
}

export function getXpToNextLevel(
  level: number,
  tuning: CombatTuningDefinition,
): number {
  return tuning.xpBase + level * tuning.xpPerLevel;
}
