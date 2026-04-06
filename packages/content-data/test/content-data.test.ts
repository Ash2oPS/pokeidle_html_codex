import {
  battleDefinitionSchema,
  canonEncounterTableDefinitionSchema,
  canonGymDefinitionSchema,
  canonLocationDefinitionSchema,
  combatTuningDefinitionSchema,
  dialogueDocumentSchema,
  localizedTextSchema,
  pokemonFormDefinitionSchema,
  pokemonSpeciesDefinitionSchema,
  questDefinitionSchema,
  worldMapDefinitionSchema,
  zoneDefinitionSchema,
} from "@pokeidle/content-schema";
import type { CanonicalSourceMetadata } from "@pokeidle/contracts";
import { describe, expect, it } from "vitest";
import { createContentRegistry } from "../src/registry";

function createImportedSource(sourceId: string): CanonicalSourceMetadata {
  return {
    source: "test-fixture",
    sourceVersion: "v1",
    sourceId,
    reviewStatus: "imported",
  };
}

function createValidRawContent() {
  return {
    worldMap: {
      id: "world-map",
      name: {
        en: "World Map",
        fr: "Carte du monde",
      },
      nodes: [
        {
          id: "node-town",
          zoneId: "town-1",
          position: { x: 0, y: 0 },
        },
        {
          id: "node-route",
          zoneId: "route-1",
          position: { x: 10, y: 0 },
        },
      ],
      links: [
        {
          id: "town-route",
          fromZoneId: "town-1",
          toZoneId: "route-1",
          requiresCompletion: false,
        },
      ],
    },
    zones: [
      {
        id: "town-1",
        kind: "pacifist",
        canonicalLocationId: "sandgem-town",
        name: {
          en: "Sandgem Town",
          fr: "Bonaugure",
        },
        activities: [
          {
            kind: "dialogue_npc",
            id: "talk-guide",
            npcId: "guide",
            label: {
              en: "Guide",
              fr: "Guide",
            },
            dialogueId: "dialogue-1",
            startsQuestId: "quest-1",
          },
          {
            kind: "gym_battle",
            id: "battle-roark",
            label: {
              en: "Battle Roark",
              fr: "Combattre Pierrick",
            },
            battleId: "battle-1",
          },
        ],
      },
      {
        id: "route-1",
        kind: "combat",
        canonicalLocationId: "route-201",
        name: {
          en: "Route 201",
          fr: "Route 201",
        },
        battle: {
          enemyPoolIds: ["starly"],
          enemyTimerSeconds: 8,
          defeatsRequired: 10,
          enemyLevel: 2,
        },
      },
    ],
    dialogues: [
      {
        id: "dialogue-1",
        title: {
          en: "Hello",
          fr: "Bonjour",
        },
        participants: [
          {
            id: "guide",
            name: {
              en: "Guide",
              fr: "Guide",
            },
          },
        ],
        lines: [
          {
            id: "line-1",
            speakerId: "guide",
            text: {
              en: "Go east.",
              fr: "Va a l'est.",
            },
          },
        ],
      },
    ],
    quests: [
      {
        id: "quest-1",
        category: "main",
        title: {
          en: "Open Route",
          fr: "Ouvrir la route",
        },
        summary: {
          en: "Talk, then clear the route.",
          fr: "Parle, puis nettoie la route.",
        },
        prerequisiteQuestIds: [],
        requiredFlags: [],
        objectives: [
          {
            kind: "talk_to_npc",
            id: "talk-guide",
            description: {
              en: "Talk to the guide.",
              fr: "Parler au guide.",
            },
            npcId: "guide",
          },
          {
            kind: "complete_zone",
            id: "clear-route",
            description: {
              en: "Complete the route.",
              fr: "Completer la route.",
            },
            zoneId: "route-1",
          },
          {
            kind: "win_battle",
            id: "win-gym",
            description: {
              en: "Win the gym.",
              fr: "Gagner l'arene.",
            },
            battleId: "battle-1",
          },
        ],
        rewards: [
          {
            kind: "pokedollars",
            amount: 100,
          },
          {
            kind: "set_flag",
            flag: "quest-1-complete",
          },
        ],
      },
    ],
    battles: [
      {
        id: "battle-1",
        kind: "gym",
        canonicalGymId: "oreburgh-gym",
        name: {
          en: "Oreburgh Gym",
          fr: "Arene de Charbourg",
        },
        timeLimitSeconds: 60,
        teamSizeLimit: 3,
        enemyTeam: [
          {
            speciesId: "starly",
            level: 8,
          },
        ],
      },
    ],
    species: [
      {
        id: "starly",
        dexNumber: 396,
        familyId: "starly-family",
        name: {
          en: "Starly",
          fr: "Etourmi",
        },
        defensiveTypes: ["normal", "flying"],
        defaultOffensiveType: "flying",
        frontSpriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/396.png",
        baseStats: {
          hp: 40,
          attack: 55,
          defense: 30,
          specialAttack: 30,
          specialDefense: 30,
          speed: 60,
        },
        evolvesToSpeciesIds: [],
        captureRate: 255,
        growthRate: "medium-slow",
        eggGroups: ["flying"],
        formIds: [],
        talentId: null,
        source: createImportedSource("species:starly"),
      },
      {
        id: "shellos",
        dexNumber: 422,
        familyId: "shellos-family",
        name: {
          en: "Shellos",
          fr: "Sancoki",
        },
        defensiveTypes: ["water"],
        defaultOffensiveType: "water",
        frontSpriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/422.png",
        baseStats: {
          hp: 76,
          attack: 48,
          defense: 48,
          specialAttack: 57,
          specialDefense: 62,
          speed: 34,
        },
        evolvesToSpeciesIds: ["gastrodon"],
        captureRate: 190,
        growthRate: "medium-fast",
        eggGroups: ["water1", "amorphous"],
        formIds: ["shellos-east-sea"],
        talentId: null,
        source: createImportedSource("species:shellos"),
      },
      {
        id: "gastrodon",
        dexNumber: 423,
        familyId: "shellos-family",
        name: {
          en: "Gastrodon",
          fr: "Tritosor",
        },
        defensiveTypes: ["water", "ground"],
        defaultOffensiveType: "water",
        frontSpriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/423.png",
        baseStats: {
          hp: 111,
          attack: 83,
          defense: 68,
          specialAttack: 92,
          specialDefense: 82,
          speed: 39,
        },
        evolvesFromSpeciesId: "shellos",
        evolvesToSpeciesIds: [],
        captureRate: 75,
        growthRate: "medium-fast",
        eggGroups: ["water1", "amorphous"],
        formIds: [],
        talentId: null,
        source: createImportedSource("species:gastrodon"),
      },
    ],
    forms: [
      {
        id: "shellos-east-sea",
        speciesId: "shellos",
        pokemonId: "shellos-east",
        name: {
          en: "Shellos",
          fr: "Sancoki",
        },
        formName: {
          en: "East Sea",
          fr: "Mer Orient",
        },
        isDefault: false,
        isBattleOnly: false,
        defensiveTypes: ["water"],
        defaultOffensiveType: "water",
        frontSpriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/422-east.png",
        baseStats: {
          hp: 76,
          attack: 48,
          defense: 48,
          specialAttack: 57,
          specialDefense: 62,
          speed: 34,
        },
        source: createImportedSource("form:shellos-east-sea"),
      },
    ],
    canonLocations: [
      {
        id: "sandgem-town",
        pokeApiLocationId: 1,
        name: {
          en: "Sandgem Town",
          fr: "Bonaugure",
        },
        regionId: "sinnoh",
        kind: "town",
        adjacentLocationIds: ["route-201"],
        areas: [
          {
            id: "sandgem-town-center",
            pokeApiLocationAreaId: 1001,
            name: {
              en: "Sandgem Town",
              fr: "Bonaugure",
            },
          },
        ],
        source: createImportedSource("location:sandgem-town"),
      },
      {
        id: "route-201",
        pokeApiLocationId: 2,
        name: {
          en: "Route 201",
          fr: "Route 201",
        },
        regionId: "sinnoh",
        kind: "route",
        adjacentLocationIds: ["sandgem-town", "oreburgh-city"],
        areas: [
          {
            id: "route-201-land",
            pokeApiLocationAreaId: 2001,
            name: {
              en: "Route 201 Land",
              fr: "Route 201 Sol",
            },
          },
        ],
        source: createImportedSource("location:route-201"),
      },
      {
        id: "oreburgh-city",
        pokeApiLocationId: 3,
        name: {
          en: "Oreburgh City",
          fr: "Charbourg",
        },
        regionId: "sinnoh",
        kind: "city",
        adjacentLocationIds: ["route-201"],
        areas: [
          {
            id: "oreburgh-city-center",
            pokeApiLocationAreaId: 3001,
            name: {
              en: "Oreburgh City",
              fr: "Charbourg",
            },
          },
        ],
        source: createImportedSource("location:oreburgh-city"),
      },
    ],
    encounterTables: [
      {
        id: "route-201-land-platinum",
        locationId: "route-201",
        locationAreaId: "route-201-land",
        versionId: "platinum",
        methods: [
          {
            methodId: "walk",
            rate: 100,
            slots: [
              {
                speciesId: "starly",
                minLevel: 2,
                maxLevel: 4,
                chance: 60,
                conditionIds: [],
              },
              {
                speciesId: "shellos",
                formId: "shellos-east-sea",
                minLevel: 3,
                maxLevel: 4,
                chance: 40,
                conditionIds: ["time-day"],
              },
            ],
          },
        ],
        source: createImportedSource("encounter:route-201-land"),
      },
    ],
    gyms: [
      {
        id: "oreburgh-gym",
        locationId: "oreburgh-city",
        leaderId: "roark",
        leaderName: {
          en: "Roark",
          fr: "Pierrick",
        },
        badgeName: {
          en: "Coal Badge",
          fr: "Badge Charbon",
        },
        specialtyTypeId: "rock",
        teams: [
          {
            id: "oreburgh-gym-main",
            label: {
              en: "Gym Battle",
              fr: "Combat d'arene",
            },
            availability: "main",
            battleKind: "gym",
            battleLocationId: "oreburgh-city",
            enemyTeam: [
              {
                speciesId: "starly",
                level: 12,
              },
            ],
          },
        ],
        source: createImportedSource("gym:oreburgh-gym"),
      },
    ],
    progression: {
      id: "combat-v1",
      slotIntervalMs: 800,
      levelStatScalar: 0.18,
      enemyHpMultiplier: 6,
      damageConstant: 12,
      wildActingXp: 10,
      wildBenchXp: 4,
      wildPokedollars: 8,
      gymActingXp: 18,
      gymBenchXp: 8,
      gymClearPokedollars: 120,
      xpBase: 20,
      xpPerLevel: 10,
    },
  };
}

describe("content schemas", () => {
  it("accepts valid canonical and authored documents", () => {
    const raw = createValidRawContent();

    expect(worldMapDefinitionSchema.safeParse(raw.worldMap).success).toBe(true);
    expect(zoneDefinitionSchema.safeParse(raw.zones[0]).success).toBe(true);
    expect(dialogueDocumentSchema.safeParse(raw.dialogues[0]).success).toBe(true);
    expect(questDefinitionSchema.safeParse(raw.quests[0]).success).toBe(true);
    expect(battleDefinitionSchema.safeParse(raw.battles[0]).success).toBe(true);
    expect(pokemonSpeciesDefinitionSchema.safeParse(raw.species[0]).success).toBe(true);
    expect(pokemonFormDefinitionSchema.safeParse(raw.forms[0]).success).toBe(true);
    expect(canonLocationDefinitionSchema.safeParse(raw.canonLocations[0]).success).toBe(true);
    expect(canonEncounterTableDefinitionSchema.safeParse(raw.encounterTables[0]).success).toBe(true);
    expect(canonGymDefinitionSchema.safeParse(raw.gyms[0]).success).toBe(true);
    expect(combatTuningDefinitionSchema.safeParse(raw.progression).success).toBe(true);
  });

  it("rejects likely mojibake in localized strings", () => {
    expect(
      localizedTextSchema.safeParse({
        en: "Hello",
        fr: "ArÃ¨ne",
      }).success,
    ).toBe(false);
  });
});

describe("content registry cross validation", () => {
  it("accepts a valid canonical registry payload", () => {
    const raw = createValidRawContent();
    expect(() => createContentRegistry(raw)).not.toThrow();
  });

  it("rejects a zone linked to a missing canonical location", () => {
    const raw = createValidRawContent();
    raw.zones[0].canonicalLocationId = "missing-location";

    expect(() => createContentRegistry(raw)).toThrow(/canonicalLocationId "missing-location"/);
  });

  it("rejects a battle linked to a missing canonical gym", () => {
    const raw = createValidRawContent();
    raw.battles[0].canonicalGymId = "missing-gym";

    expect(() => createContentRegistry(raw)).toThrow(/canonicalGymId "missing-gym"/);
  });

  it("rejects an encounter slot linked to a missing form", () => {
    const raw = createValidRawContent();
    raw.encounterTables[0].methods[0].slots[1].formId = "missing-form";

    expect(() => createContentRegistry(raw)).toThrow(/formId "missing-form"/);
  });
});
