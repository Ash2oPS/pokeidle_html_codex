import {
  battleDefinitionSchema,
  dialogueDocumentSchema,
  questDefinitionSchema,
  worldMapDefinitionSchema,
  zoneDefinitionSchema,
} from "@pokeidle/content-schema";
import { describe, expect, it } from "vitest";
import { createContentRegistry } from "../src/registry";

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
        name: {
          en: "Town 1",
          fr: "Ville 1",
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
        ],
      },
      {
        id: "route-1",
        kind: "combat",
        name: {
          en: "Route 1",
          fr: "Route 1",
        },
        battle: {
          enemyPoolIds: ["starly"],
          enemyTimerSeconds: 8,
          defeatsRequired: 10,
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
        name: {
          en: "Gym",
          fr: "Arene",
        },
        timeLimitSeconds: 60,
      },
    ],
  };
}

describe("content schemas", () => {
  it("accepts a valid world map document", () => {
    const raw = createValidRawContent();
    expect(worldMapDefinitionSchema.safeParse(raw.worldMap).success).toBe(true);
  });

  it("rejects an invalid zone document", () => {
    const raw = createValidRawContent();
    const invalidZone = {
      ...raw.zones[1],
      battle: undefined,
    };

    expect(zoneDefinitionSchema.safeParse(invalidZone).success).toBe(false);
  });

  it("rejects an invalid dialogue document", () => {
    const raw = createValidRawContent();
    const invalidDialogue = {
      ...raw.dialogues[0],
      participants: [],
    };

    expect(dialogueDocumentSchema.safeParse(invalidDialogue).success).toBe(false);
  });

  it("rejects an invalid quest document", () => {
    const raw = createValidRawContent();
    const invalidQuest = {
      ...raw.quests[0],
      objectives: [
        {
          kind: "invalid_kind",
          id: "oops",
          description: {
            en: "Nope",
            fr: "Non",
          },
        },
      ],
    };

    expect(questDefinitionSchema.safeParse(invalidQuest).success).toBe(false);
  });

  it("rejects an invalid battle document", () => {
    const raw = createValidRawContent();
    const invalidBattle = {
      ...raw.battles[0],
      timeLimitSeconds: 0,
    };

    expect(battleDefinitionSchema.safeParse(invalidBattle).success).toBe(false);
  });
});

describe("content registry cross validation", () => {
  it("rejects a world-map node pointing to a missing zone", () => {
    const raw = createValidRawContent();
    raw.worldMap.nodes[1].zoneId = "missing-zone";

    expect(() => createContentRegistry(raw)).toThrow(/world-map/i);
  });

  it("rejects a broken dialogue reference", () => {
    const raw = createValidRawContent();
    raw.zones[0].activities[0].dialogueId = "missing-dialogue";

    expect(() => createContentRegistry(raw)).toThrow(/dialogueId "missing-dialogue"/);
  });

  it("rejects a broken battle reference", () => {
    const raw = createValidRawContent();
    raw.quests[0].objectives[2].battleId = "missing-battle";

    expect(() => createContentRegistry(raw)).toThrow(/battleId "missing-battle"/);
  });

  it("rejects a broken quest reference from a zone activity", () => {
    const raw = createValidRawContent();
    raw.zones[0].activities[0].startsQuestId = "missing-quest";

    expect(() => createContentRegistry(raw)).toThrow(/startsQuestId "missing-quest"/);
  });
});
