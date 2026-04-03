import { loadContentRegistry } from "@pokeidle/content-data";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { GameSaveV1, PokemonSpeciesDefinition } from "@pokeidle/contracts";
import { describe, expect, it } from "vitest";
import {
  canAssignSpeciesToTeamSlot,
  getAssignableSpeciesIdsForTeamSlot,
  setTeamSlot,
  syncGameRuntimeState,
  unlockSpecies,
} from "../src";
import { createDefaultGameSave } from "../src/save/default-save";

function createReadySave(nowIso = "2026-04-02T10:00:00.000Z") {
  const registry = loadContentRegistry();
  const save = createDefaultGameSave(nowIso);
  syncGameRuntimeState(save, registry, nowIso);
  return { save, registry, nowIso };
}

function createSyntheticEeveeRegistry(baseRegistry: ContentRegistry): ContentRegistry {
  const registry = structuredClone(baseRegistry);
  const eeveeSpecies: PokemonSpeciesDefinition = {
    id: "eevee",
    dexNumber: 133,
    familyId: "eevee-family",
    name: { en: "Eevee", fr: "Evoli" },
    defensiveTypes: ["normal"],
    defaultOffensiveType: "normal",
    frontSpriteUrl: "https://example.com/eevee.png",
    baseStats: {
      hp: 55,
      attack: 55,
      defense: 50,
      specialAttack: 45,
      specialDefense: 65,
      speed: 55,
    },
    evolvesToSpeciesIds: ["vaporeon"],
    talentId: null,
  };
  const vaporeonSpecies: PokemonSpeciesDefinition = {
    id: "vaporeon",
    dexNumber: 134,
    familyId: "eevee-family",
    name: { en: "Vaporeon", fr: "Aquali" },
    defensiveTypes: ["water"],
    defaultOffensiveType: "water",
    frontSpriteUrl: "https://example.com/vaporeon.png",
    baseStats: {
      hp: 130,
      attack: 65,
      defense: 60,
      specialAttack: 110,
      specialDefense: 95,
      speed: 65,
    },
    evolvesFromSpeciesId: "eevee",
    evolvesToSpeciesIds: [],
    talentId: null,
  };

  registry.speciesById[eeveeSpecies.id] = eeveeSpecies;
  registry.speciesById[vaporeonSpecies.id] = vaporeonSpecies;

  return registry;
}

describe("roster runtime team composition", () => {
  it("rejects duplicate species in the team", () => {
    const { save, registry } = createReadySave();

    unlockSpecies(save, registry, "chimchar");
    save.player.teamSlots = ["chimchar", null, null, null, null, null];

    expect(canAssignSpeciesToTeamSlot(save, registry, 1, "chimchar")).toBe(false);

    setTeamSlot(save, registry, 1, "chimchar");

    expect(save.player.teamSlots).toEqual(["chimchar", null, null, null, null, null]);
  });

  it("rejects different species from the same evolution family", () => {
    const { save, registry } = createReadySave();

    unlockSpecies(save, registry, "chimchar");
    unlockSpecies(save, registry, "monferno");
    save.player.teamSlots = ["chimchar", null, null, null, null, null];

    expect(canAssignSpeciesToTeamSlot(save, registry, 1, "monferno")).toBe(false);
    expect(getAssignableSpeciesIdsForTeamSlot(save, registry, 1)).not.toContain("monferno");

    setTeamSlot(save, registry, 1, "monferno");

    expect(save.player.teamSlots).toEqual(["chimchar", null, null, null, null, null]);
  });

  it("allows multiple Eevee-family species while still rejecting duplicate species", () => {
    const { save, registry: baseRegistry } = createReadySave();
    const registry = createSyntheticEeveeRegistry(baseRegistry);

    unlockSpecies(save, registry, "eevee");
    unlockSpecies(save, registry, "vaporeon");
    save.player.teamSlots = ["eevee", null, null, null, null, null];

    expect(canAssignSpeciesToTeamSlot(save, registry, 1, "vaporeon")).toBe(true);
    expect(canAssignSpeciesToTeamSlot(save, registry, 1, "eevee")).toBe(false);

    setTeamSlot(save, registry, 1, "vaporeon");

    expect(save.player.teamSlots).toEqual(["eevee", "vaporeon", null, null, null, null]);
  });

  it("sanitizes later duplicate species and duplicate non-exempt families from saves", () => {
    const { save, registry } = createReadySave();

    unlockSpecies(save, registry, "chimchar");
    unlockSpecies(save, registry, "monferno");
    unlockSpecies(save, registry, "shinx");
    save.player.teamSlots = ["chimchar", "monferno", "shinx", "shinx", null, null];

    syncGameRuntimeState(save, registry);

    expect(save.player.teamSlots).toEqual(["chimchar", null, "shinx", null, null, null]);
  });
});
