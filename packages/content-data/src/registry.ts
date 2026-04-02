import type {
  BattleDefinition,
  CombatTuningDefinition,
  DialogueDocument,
  PokemonSpeciesDefinition,
  QuestDefinition,
  WorldMapDefinition,
  ZoneActivityDefinition,
  ZoneDefinition,
} from "@pokeidle/contracts";
import {
  battleDefinitionSchema,
  combatTuningDefinitionSchema,
  dialogueDocumentSchema,
  pokemonSpeciesDefinitionSchema,
  questDefinitionSchema,
  worldMapDefinitionSchema,
  zoneDefinitionSchema,
} from "@pokeidle/content-schema";
import type { z } from "zod";
import { authoredContentDocuments } from "./authored";

export interface RawContentRegistryInput {
  worldMap: unknown;
  zones: readonly unknown[];
  dialogues: readonly unknown[];
  quests: readonly unknown[];
  battles: readonly unknown[];
  species: readonly unknown[];
  progression: unknown;
}

export interface ContentRegistry {
  worldMap: WorldMapDefinition;
  zonesById: Record<string, ZoneDefinition>;
  dialoguesById: Record<string, DialogueDocument>;
  questsById: Record<string, QuestDefinition>;
  battlesById: Record<string, BattleDefinition>;
  speciesById: Record<string, PokemonSpeciesDefinition>;
  progression: CombatTuningDefinition;
}

export class ContentRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentRegistryError";
  }
}

function parseDocument<T>(
  domain: string,
  documentLabel: string,
  schema: z.ZodType<T>,
  value: unknown,
): T {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];
  const path = issue?.path.length ? issue.path.join(".") : "(root)";
  const message = issue?.message ?? "Invalid content document.";

  throw new ContentRegistryError(
    `Invalid ${domain} document "${documentLabel}" at ${path}: ${message}`,
  );
}

function createDocumentMap<T extends { id: string }>(
  domain: string,
  documents: T[],
): Record<string, T> {
  return documents.reduce<Record<string, T>>((accumulator, document) => {
    if (accumulator[document.id]) {
      throw new ContentRegistryError(
        `Duplicate ${domain} id "${document.id}" found in authored content.`,
      );
    }

    accumulator[document.id] = document;
    return accumulator;
  }, {});
}

function assertReference(
  condition: unknown,
  domain: string,
  documentId: string,
  field: string,
  value: string,
): void {
  if (!condition) {
    throw new ContentRegistryError(
      `Invalid content reference in ${domain} "${documentId}": ${field} "${value}" does not exist.`,
    );
  }
}

function validateDialogueReferences(dialoguesById: Record<string, DialogueDocument>): void {
  Object.values(dialoguesById).forEach((dialogue) => {
    const participantsById = createDocumentMap(
      `dialogue participant list for ${dialogue.id}`,
      dialogue.participants,
    );

    dialogue.lines.forEach((line) => {
      assertReference(
        participantsById[line.speakerId],
        "dialogue",
        dialogue.id,
        "speakerId",
        line.speakerId,
      );
    });
  });
}

function validateZoneActivityReferences(
  zonesById: Record<string, ZoneDefinition>,
  dialoguesById: Record<string, DialogueDocument>,
  questsById: Record<string, QuestDefinition>,
  battlesById: Record<string, BattleDefinition>,
): void {
  Object.values(zonesById).forEach((zone) => {
    if (zone.kind !== "pacifist") {
      return;
    }

    zone.activities.forEach((activity: ZoneActivityDefinition) => {
      if (activity.kind === "dialogue_npc") {
        assertReference(
          dialoguesById[activity.dialogueId],
          "zone",
          zone.id,
          "dialogueId",
          activity.dialogueId,
        );

        if (activity.startsQuestId) {
          assertReference(
            questsById[activity.startsQuestId],
            "zone",
            zone.id,
            "startsQuestId",
            activity.startsQuestId,
          );
        }
      }

      if (activity.kind === "gym_battle") {
        const battle = battlesById[activity.battleId];
        if (!battle) {
          throw new ContentRegistryError(
            `Invalid content reference in zone "${zone.id}": battleId "${activity.battleId}" does not exist.`,
          );
        }

        if (battle.kind !== "gym") {
          throw new ContentRegistryError(
            `Invalid content reference in zone "${zone.id}": battleId "${activity.battleId}" must point to a gym battle.`,
          );
        }
      }
    });
  });
}

function validateSpeciesReferences(
  zonesById: Record<string, ZoneDefinition>,
  battlesById: Record<string, BattleDefinition>,
  speciesById: Record<string, PokemonSpeciesDefinition>,
): void {
  Object.values(zonesById).forEach((zone) => {
    if (zone.kind !== "combat") {
      return;
    }

    zone.battle.enemyPoolIds.forEach((speciesId) => {
      assertReference(speciesById[speciesId], "zone", zone.id, "enemyPoolIds", speciesId);
    });
  });

  Object.values(battlesById).forEach((battle) => {
    battle.enemyTeam?.forEach((enemy) => {
      assertReference(speciesById[enemy.speciesId], "battle", battle.id, "enemyTeam.speciesId", enemy.speciesId);
    });
  });

  Object.values(speciesById).forEach((species) => {
    if (species.defensiveTypes.length === 0) {
      throw new ContentRegistryError(
        `Invalid species "${species.id}": defensiveTypes must contain at least one type.`,
      );
    }

    if (!species.defensiveTypes.includes(species.defaultOffensiveType)) {
      throw new ContentRegistryError(
        `Invalid species "${species.id}": defaultOffensiveType "${species.defaultOffensiveType}" must be present in defensiveTypes.`,
      );
    }

    if (species.evolvesFromSpeciesId) {
      assertReference(speciesById[species.evolvesFromSpeciesId], "species", species.id, "evolvesFromSpeciesId", species.evolvesFromSpeciesId);
    }

    species.evolvesToSpeciesIds.forEach((speciesId) => {
      assertReference(speciesById[speciesId], "species", species.id, "evolvesToSpeciesIds", speciesId);
    });
  });
}

function validateQuestReferences(
  questsById: Record<string, QuestDefinition>,
  zonesById: Record<string, ZoneDefinition>,
  battlesById: Record<string, BattleDefinition>,
): void {
  Object.values(questsById).forEach((quest) => {
    quest.prerequisiteQuestIds.forEach((questId) => {
      assertReference(questsById[questId], "quest", quest.id, "prerequisiteQuestIds", questId);
    });

    quest.objectives.forEach((objective) => {
      if (objective.kind === "complete_zone") {
        assertReference(zonesById[objective.zoneId], "quest", quest.id, "zoneId", objective.zoneId);
      }

      if (objective.kind === "win_battle") {
        assertReference(
          battlesById[objective.battleId],
          "quest",
          quest.id,
          "battleId",
          objective.battleId,
        );
      }
    });
  });
}

function validateWorldMapReferences(
  worldMap: WorldMapDefinition,
  zonesById: Record<string, ZoneDefinition>,
): void {
  const nodeZoneIds = new Set<string>();

  worldMap.nodes.forEach((node) => {
    assertReference(zonesById[node.zoneId], "world-map", worldMap.id, "zoneId", node.zoneId);

    if (nodeZoneIds.has(node.zoneId)) {
      throw new ContentRegistryError(
        `Duplicate world-map node for zone "${node.zoneId}" found in "${worldMap.id}".`,
      );
    }

    nodeZoneIds.add(node.zoneId);
  });

  Object.keys(zonesById).forEach((zoneId) => {
    assertReference(nodeZoneIds.has(zoneId), "world-map", worldMap.id, "node.zoneId", zoneId);
  });

  worldMap.links.forEach((link) => {
    assertReference(zonesById[link.fromZoneId], "world-map", worldMap.id, "fromZoneId", link.fromZoneId);
    assertReference(zonesById[link.toZoneId], "world-map", worldMap.id, "toZoneId", link.toZoneId);
  });
}

export function createContentRegistry(rawContent: RawContentRegistryInput): ContentRegistry {
  const worldMap = parseDocument("world-map", "world-map", worldMapDefinitionSchema, rawContent.worldMap);
  const zones = rawContent.zones.map((zone, index) =>
    parseDocument("zone", `zones[${index}]`, zoneDefinitionSchema, zone),
  );
  const dialogues = rawContent.dialogues.map((dialogue, index) =>
    parseDocument("dialogue", `dialogues[${index}]`, dialogueDocumentSchema, dialogue),
  );
  const quests = rawContent.quests.map((quest, index) =>
    parseDocument("quest", `quests[${index}]`, questDefinitionSchema, quest),
  );
  const battles = rawContent.battles.map((battle, index) =>
    parseDocument("battle", `battles[${index}]`, battleDefinitionSchema, battle),
  );
  const species = rawContent.species.map((speciesRecord, index) =>
    parseDocument("species", `species[${index}]`, pokemonSpeciesDefinitionSchema, speciesRecord),
  );
  const progression = parseDocument("progression", "progression", combatTuningDefinitionSchema, rawContent.progression);

  const registry: ContentRegistry = {
    worldMap,
    zonesById: createDocumentMap("zone", zones),
    dialoguesById: createDocumentMap("dialogue", dialogues),
    questsById: createDocumentMap("quest", quests),
    battlesById: createDocumentMap("battle", battles),
    speciesById: createDocumentMap("species", species),
    progression,
  };

  validateWorldMapReferences(registry.worldMap, registry.zonesById);
  validateDialogueReferences(registry.dialoguesById);
  validateZoneActivityReferences(
    registry.zonesById,
    registry.dialoguesById,
    registry.questsById,
    registry.battlesById,
  );
  validateQuestReferences(registry.questsById, registry.zonesById, registry.battlesById);
  validateSpeciesReferences(registry.zonesById, registry.battlesById, registry.speciesById);

  return registry;
}

let cachedRegistry: ContentRegistry | null = null;

export function loadContentRegistry(): ContentRegistry {
  if (!cachedRegistry) {
    cachedRegistry = createContentRegistry(authoredContentDocuments);
  }

  return cachedRegistry;
}

export const contentRegistry = new Proxy({} as ContentRegistry, {
  get(_target, property) {
    return Reflect.get(loadContentRegistry() as object, property);
  },
  getOwnPropertyDescriptor(_target, property) {
    const registry = loadContentRegistry() as unknown as Record<PropertyKey, unknown>;
    return {
      configurable: true,
      enumerable: true,
      value: registry[property],
      writable: false,
    };
  },
  ownKeys() {
    return Reflect.ownKeys(loadContentRegistry() as object);
  },
});
