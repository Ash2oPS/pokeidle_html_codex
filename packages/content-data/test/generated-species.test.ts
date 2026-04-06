import { describe, expect, it } from "vitest";
import { loadContentRegistry } from "../src";

describe("generated canon datasets", () => {
  it("ships the full 001-493 generated species set plus linked forms", () => {
    const registry = loadContentRegistry();
    const species = Object.values(registry.speciesById);
    const forms = Object.values(registry.formsById);

    expect(species).toHaveLength(493);
    expect(forms).toHaveLength(49);

    species.forEach((entry) => {
      expect(entry.name.en.length).toBeGreaterThan(0);
      expect(entry.name.fr.length).toBeGreaterThan(0);
      expect(entry.frontSpriteUrl).toContain("generation-iv/platinum");
      expect(entry.captureRate).toBeGreaterThanOrEqual(0);
      expect(entry.growthRate.length).toBeGreaterThan(0);
      expect(entry.eggGroups.length).toBeGreaterThan(0);
      expect(entry.source.reviewStatus).toBe("imported");
      entry.formIds.forEach((formId) => {
        expect(registry.formsById[formId]?.speciesId).toBe(entry.id);
      });
    });

    forms.forEach((form) => {
      expect(form.frontSpriteUrl.length).toBeGreaterThan(0);
      expect(form.frontSpriteUrl).not.toContain("official-artwork");
      expect(registry.speciesById[form.speciesId]).toBeDefined();
      expect(form.source.reviewStatus).toBe("imported");
    });
  });

  it("ships coherent Sinnoh canonical locations, encounters, and gyms", () => {
    const registry = loadContentRegistry();
    const locations = Object.values(registry.canonLocationsById);
    const encounters = Object.values(registry.encounterTablesById);
    const gyms = Object.values(registry.gymsById);

    expect(locations).toHaveLength(65);
    expect(encounters).toHaveLength(122);
    expect(gyms).toHaveLength(8);

    locations.forEach((location) => {
      expect(location.name.en.length).toBeGreaterThan(0);
      expect(location.name.fr.length).toBeGreaterThan(0);
      expect(location.regionId).toBe("sinnoh");
      location.adjacentLocationIds.forEach((adjacentId) => {
        expect(registry.canonLocationsById[adjacentId]).toBeDefined();
      });
      location.areas.forEach((area) => {
        expect(area.name.en.length).toBeGreaterThan(0);
        expect(area.name.fr.length).toBeGreaterThan(0);
      });
    });

    encounters.forEach((encounterTable) => {
      expect(encounterTable.versionId).toBe("platinum");
      expect(registry.canonLocationsById[encounterTable.locationId]).toBeDefined();
      encounterTable.methods.forEach((method) => {
        expect(method.rate).toBeGreaterThanOrEqual(0);
        method.slots.forEach((slot) => {
          expect(registry.speciesById[slot.speciesId]).toBeDefined();
          if (slot.formId) {
            expect(registry.formsById[slot.formId]).toBeDefined();
          }
        });
      });
    });

    gyms.forEach((gym) => {
      expect(registry.canonLocationsById[gym.locationId]).toBeDefined();
      expect(gym.leaderName.en.length).toBeGreaterThan(0);
      expect(gym.badgeName.fr.length).toBeGreaterThan(0);
      gym.teams.forEach((team) => {
        expect(registry.canonLocationsById[team.battleLocationId]).toBeDefined();
        team.enemyTeam.forEach((enemy) => {
          expect(registry.speciesById[enemy.speciesId]).toBeDefined();
          if (enemy.formId) {
            expect(registry.formsById[enemy.formId]).toBeDefined();
          }
        });
      });
    });
  });
});
