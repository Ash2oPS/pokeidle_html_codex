import type { ContentRegistry } from "@pokeidle/content-data";
import type { GameSaveV1, SpeciesProgressState } from "@pokeidle/contracts";

export const STARTER_IDS = ["turtwig", "chimchar", "piplup"] as const;
export const STARTER_BUNDLE_SPECIES_IDS = ["starly", "bidoof", "shinx", "zubat", "geodude", "machop"] as const;
export const TEAM_MULTI_MEMBER_FAMILY_EXCEPTION_IDS = ["eevee-family"] as const;

function createDefaultSpeciesProgress(): SpeciesProgressState {
  return {
    unlocked: true,
    level: 1,
    experience: 0,
    highestLevelReached: 1,
    counters: {
      encountered: 0,
      defeated: 0,
      captured: 0,
    },
  };
}

export function ensureSpeciesProgress(save: GameSaveV1, speciesId: string): SpeciesProgressState {
  const current = save.species[speciesId] ?? createDefaultSpeciesProgress();
  current.unlocked = true;
  save.species[speciesId] = current;
  return current;
}

function canFamilyRepeatInTeam(familyId: string): boolean {
  return TEAM_MULTI_MEMBER_FAMILY_EXCEPTION_IDS.includes(
    familyId as (typeof TEAM_MULTI_MEMBER_FAMILY_EXCEPTION_IDS)[number],
  );
}

export function canAssignSpeciesToTeamSlot(
  save: GameSaveV1,
  registry: ContentRegistry,
  slotIndex: number,
  speciesId: string,
): boolean {
  if (slotIndex < 0 || slotIndex >= 6) {
    return false;
  }

  if (!save.player.unlockedSpeciesIds.includes(speciesId)) {
    return false;
  }

  const candidateSpecies = registry.speciesById[speciesId];

  if (!candidateSpecies) {
    return false;
  }

  for (let index = 0; index < 6; index += 1) {
    if (index === slotIndex) {
      continue;
    }

    const otherSpeciesId = save.player.teamSlots[index];

    if (!otherSpeciesId) {
      continue;
    }

    if (otherSpeciesId === speciesId) {
      return false;
    }

    const otherSpecies = registry.speciesById[otherSpeciesId];

    if (!otherSpecies) {
      continue;
    }

    if (
      otherSpecies.familyId === candidateSpecies.familyId &&
      !canFamilyRepeatInTeam(candidateSpecies.familyId)
    ) {
      return false;
    }
  }

  return true;
}

export function getAssignableSpeciesIdsForTeamSlot(
  save: GameSaveV1,
  registry: ContentRegistry,
  slotIndex: number,
): string[] {
  return save.player.unlockedSpeciesIds.filter((speciesId) =>
    canAssignSpeciesToTeamSlot(save, registry, slotIndex, speciesId),
  );
}

export function syncRosterState(save: GameSaveV1, registry: ContentRegistry): void {
  const validUnlocked = save.player.unlockedSpeciesIds.filter((speciesId) => registry.speciesById[speciesId]);
  const dedupedUnlocked = Array.from(new Set(validUnlocked));
  const seenTeamSpeciesIds = new Set<string>();
  const seenTeamFamilyIds = new Set<string>();

  dedupedUnlocked.forEach((speciesId) => {
    ensureSpeciesProgress(save, speciesId);
  });

  save.player.unlockedSpeciesIds = dedupedUnlocked;
  save.player.teamSlots = Array.from({ length: 6 }, (_, index) => {
    const slotValue = save.player.teamSlots[index];

    if (!slotValue || !registry.speciesById[slotValue] || !dedupedUnlocked.includes(slotValue)) {
      return null;
    }

    if (seenTeamSpeciesIds.has(slotValue)) {
      return null;
    }

    const species = registry.speciesById[slotValue]!;

    if (seenTeamFamilyIds.has(species.familyId) && !canFamilyRepeatInTeam(species.familyId)) {
      return null;
    }

    seenTeamSpeciesIds.add(slotValue);

    if (!canFamilyRepeatInTeam(species.familyId)) {
      seenTeamFamilyIds.add(species.familyId);
    }

    return slotValue;
  });

  Object.entries(save.species).forEach(([speciesId, progress]) => {
    progress.unlocked = dedupedUnlocked.includes(speciesId);
  });
}

export function unlockSpecies(save: GameSaveV1, registry: ContentRegistry, speciesId: string): void {
  if (!registry.speciesById[speciesId]) {
    return;
  }

  if (!save.player.unlockedSpeciesIds.includes(speciesId)) {
    save.player.unlockedSpeciesIds.push(speciesId);
  }

  ensureSpeciesProgress(save, speciesId);
}

export function chooseStarter(save: GameSaveV1, registry: ContentRegistry, starterId: string): void {
  if (!STARTER_IDS.includes(starterId as (typeof STARTER_IDS)[number])) {
    return;
  }

  save.player.starterChoice = starterId;
  unlockSpecies(save, registry, starterId);
  STARTER_BUNDLE_SPECIES_IDS.forEach((speciesId) => {
    unlockSpecies(save, registry, speciesId);
  });

  save.player.teamSlots = [starterId, "starly", "bidoof", null, null, null];
  syncRosterState(save, registry);
}

export function setTeamSlot(
  save: GameSaveV1,
  registry: ContentRegistry,
  slotIndex: number,
  speciesId: string | null,
): void {
  if (slotIndex < 0 || slotIndex >= 6) {
    return;
  }

  if (speciesId !== null && !save.player.unlockedSpeciesIds.includes(speciesId)) {
    return;
  }

  if (speciesId !== null && !registry.speciesById[speciesId]) {
    return;
  }

  if (speciesId !== null && !canAssignSpeciesToTeamSlot(save, registry, slotIndex, speciesId)) {
    return;
  }

  save.player.teamSlots[slotIndex] = speciesId;
  syncRosterState(save, registry);
}

export function countFilledTeamSlots(save: GameSaveV1): number {
  return save.player.teamSlots.filter((entry) => entry !== null).length;
}
