import { describe, expect, it } from "vitest";
import { loadContentRegistry } from "../src";

const EXPECTED_SPECIES_IDS = [
  "turtwig",
  "grotle",
  "torterra",
  "chimchar",
  "monferno",
  "infernape",
  "piplup",
  "prinplup",
  "empoleon",
  "starly",
  "staravia",
  "staraptor",
  "bidoof",
  "bibarel",
  "shinx",
  "luxio",
  "luxray",
  "zubat",
  "golbat",
  "crobat",
  "geodude",
  "graveler",
  "golem",
  "machop",
  "machoke",
  "machamp",
  "onix",
  "steelix",
  "cranidos",
  "rampardos",
] as const;

describe("generated pokemon dataset", () => {
  it("contains the exact 30-species allowlist", () => {
    const registry = loadContentRegistry();
    const loadedSpeciesIds = Object.keys(registry.speciesById).sort();

    expect(loadedSpeciesIds).toHaveLength(30);
    expect(loadedSpeciesIds).toEqual([...EXPECTED_SPECIES_IDS].sort());
  });

  it("ships localized English and French names for every species", () => {
    const registry = loadContentRegistry();

    Object.values(registry.speciesById).forEach((species) => {
      expect(species.name.en.length).toBeGreaterThan(0);
      expect(species.name.fr.length).toBeGreaterThan(0);
      expect(species.frontSpriteUrl).toContain("generation-iv/platinum");
      expect(species.frontSpriteUrl).not.toContain("official-artwork");
    });
  });

  it("requires a Platinum front sprite for every generated species", () => {
    const registry = loadContentRegistry();

    Object.values(registry.speciesById).forEach((species) => {
      expect(species.frontSpriteUrl.length).toBeGreaterThan(0);
    });
  });

  it("keeps evolution links inside the generated allowlist", () => {
    const registry = loadContentRegistry();
    const speciesIds = new Set(Object.keys(registry.speciesById));

    Object.values(registry.speciesById).forEach((species) => {
      if (species.evolvesFromSpeciesId) {
        expect(speciesIds.has(species.evolvesFromSpeciesId)).toBe(true);
      }

      species.evolvesToSpeciesIds.forEach((evolutionId) => {
        expect(speciesIds.has(evolutionId)).toBe(true);
      });
    });
  });
});
