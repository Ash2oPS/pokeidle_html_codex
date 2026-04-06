import type {
  BattleDefinition,
  CanonEncounterTableDefinition,
  CanonGymDefinition,
  CanonLocationDefinition,
  CombatTuningDefinition,
  DialogueDocument,
  PokemonFormDefinition,
  PokemonSpeciesDefinition,
  QuestDefinition,
  WorldMapDefinition,
  ZoneActivityDefinition,
  ZoneDefinition,
} from "@pokeidle/contracts";
import {
  battleDefinitionSchema,
  canonEncounterTableDefinitionSchema,
  canonGymDefinitionSchema,
  canonLocationDefinitionSchema,
  combatTuningDefinitionSchema,
  dialogueDocumentSchema,
  pokemonFormDefinitionSchema,
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
  forms: readonly unknown[];
  canonLocations: readonly unknown[];
  encounterTables: readonly unknown[];
  gyms: readonly unknown[];
  progression: unknown;
}

export interface ContentRegistry {
  worldMap: WorldMapDefinition;
  zonesById: Record<string, ZoneDefinition>;
  dialoguesById: Record<string, DialogueDocument>;
  questsById: Record<string, QuestDefinition>;
  battlesById: Record<string, BattleDefinition>;
  speciesById: Record<string, PokemonSpeciesDefinition>;
  formsById: Record<string, PokemonFormDefinition>;
  canonLocationsById: Record<string, CanonLocationDefinition>;
  encounterTablesById: Record<string, CanonEncounterTableDefinition>;
  gymsById: Record<string, CanonGymDefinition>;
  progression: CombatTuningDefinition;
}

interface CanonLocationAreaReference {
  id: string;
  locationId: string;
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
  const issuePath = issue?.path.length ? issue.path.join(".") : "(root)";
  const issueMessage = issue?.message ?? "Invalid content document.";

  throw new ContentRegistryError(
    `Invalid ${domain} document "${documentLabel}" at ${issuePath}: ${issueMessage}`,
  );
}

function createDocumentMap<T extends { id: string }>(
  domain: string,
  documents: T[],
): Record<string, T> {
  return documents.reduce<Record<string, T>>((accumulator, document) => {
    if (accumulator[document.id]) {
      throw new ContentRegistryError(
        `Duplicate ${domain} id "${document.id}" found in loaded content.`,
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

function createCanonLocationAreaMap(
  canonLocationsById: Record<string, CanonLocationDefinition>,
): Record<string, CanonLocationAreaReference> {
  return Object.values(canonLocationsById).reduce<Record<string, CanonLocationAreaReference>>(
    (accumulator, location) => {
      location.areas.forEach((area) => {
        if (accumulator[area.id]) {
          throw new ContentRegistryError(
            `Duplicate canon location area id "${area.id}" found in canonical locations.`,
          );
        }

        accumulator[area.id] = {
          id: area.id,
          locationId: location.id,
        };
      });

      return accumulator;
    },
    {},
  );
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

function validateZoneCanonicalReferences(
  zonesById: Record<string, ZoneDefinition>,
  canonLocationsById: Record<string, CanonLocationDefinition>,
): void {
  Object.values(zonesById).forEach((zone) => {
    if (!zone.canonicalLocationId) {
      return;
    }

    assertReference(
      canonLocationsById[zone.canonicalLocationId],
      "zone",
      zone.id,
      "canonicalLocationId",
      zone.canonicalLocationId,
    );
  });
}

function validateSpeciesReferences(
  zonesById: Record<string, ZoneDefinition>,
  battlesById: Record<string, BattleDefinition>,
  speciesById: Record<string, PokemonSpeciesDefinition>,
  formsById: Record<string, PokemonFormDefinition>,
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
      assertReference(
        speciesById[enemy.speciesId],
        "battle",
        battle.id,
        "enemyTeam.speciesId",
        enemy.speciesId,
      );
    });
  });

  Object.values(speciesById).forEach((species) => {
    if (!species.defensiveTypes.includes(species.defaultOffensiveType)) {
      throw new ContentRegistryError(
        `Invalid species "${species.id}": defaultOffensiveType "${species.defaultOffensiveType}" must be present in defensiveTypes.`,
      );
    }

    if (species.evolvesFromSpeciesId) {
      assertReference(
        speciesById[species.evolvesFromSpeciesId],
        "species",
        species.id,
        "evolvesFromSpeciesId",
        species.evolvesFromSpeciesId,
      );
    }

    species.evolvesToSpeciesIds.forEach((speciesId) => {
      assertReference(speciesById[speciesId], "species", species.id, "evolvesToSpeciesIds", speciesId);
    });

    species.formIds.forEach((formId) => {
      const form = formsById[formId];
      assertReference(form, "species", species.id, "formIds", formId);

      if (form && form.speciesId !== species.id) {
        throw new ContentRegistryError(
          `Invalid species "${species.id}": formIds "${formId}" belongs to species "${form.speciesId}".`,
        );
      }
    });
  });

  Object.values(formsById).forEach((form) => {
    if (form.isDefault) {
      throw new ContentRegistryError(
        `Invalid form "${form.id}": canonical form records must represent non-default forms only.`,
      );
    }

    if (!form.defensiveTypes.includes(form.defaultOffensiveType)) {
      throw new ContentRegistryError(
        `Invalid form "${form.id}": defaultOffensiveType "${form.defaultOffensiveType}" must be present in defensiveTypes.`,
      );
    }

    assertReference(speciesById[form.speciesId], "form", form.id, "speciesId", form.speciesId);
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
    assertReference(
      zonesById[link.fromZoneId],
      "world-map",
      worldMap.id,
      "fromZoneId",
      link.fromZoneId,
    );
    assertReference(
      zonesById[link.toZoneId],
      "world-map",
      worldMap.id,
      "toZoneId",
      link.toZoneId,
    );
  });
}

function validateCanonLocationReferences(
  canonLocationsById: Record<string, CanonLocationDefinition>,
): void {
  Object.values(canonLocationsById).forEach((location) => {
    location.adjacentLocationIds.forEach((adjacentLocationId) => {
      assertReference(
        canonLocationsById[adjacentLocationId],
        "canon-location",
        location.id,
        "adjacentLocationIds",
        adjacentLocationId,
      );
    });
  });
}

function validateEncounterReferences(
  encounterTablesById: Record<string, CanonEncounterTableDefinition>,
  canonLocationsById: Record<string, CanonLocationDefinition>,
  canonLocationAreasById: Record<string, CanonLocationAreaReference>,
  speciesById: Record<string, PokemonSpeciesDefinition>,
  formsById: Record<string, PokemonFormDefinition>,
): void {
  Object.values(encounterTablesById).forEach((encounterTable) => {
    assertReference(
      canonLocationsById[encounterTable.locationId],
      "encounter-table",
      encounterTable.id,
      "locationId",
      encounterTable.locationId,
    );

    const locationArea = canonLocationAreasById[encounterTable.locationAreaId];
    assertReference(
      locationArea,
      "encounter-table",
      encounterTable.id,
      "locationAreaId",
      encounterTable.locationAreaId,
    );

    if (locationArea && locationArea.locationId !== encounterTable.locationId) {
      throw new ContentRegistryError(
        `Invalid encounter-table "${encounterTable.id}": locationAreaId "${encounterTable.locationAreaId}" belongs to "${locationArea.locationId}", not "${encounterTable.locationId}".`,
      );
    }

    encounterTable.methods.forEach((method) => {
      method.slots.forEach((slot) => {
        assertReference(
          speciesById[slot.speciesId],
          "encounter-table",
          encounterTable.id,
          "slots.speciesId",
          slot.speciesId,
        );

        if (slot.formId) {
          const form = formsById[slot.formId];
          assertReference(form, "encounter-table", encounterTable.id, "slots.formId", slot.formId);

          if (form && form.speciesId !== slot.speciesId) {
            throw new ContentRegistryError(
              `Invalid encounter-table "${encounterTable.id}": formId "${slot.formId}" belongs to "${form.speciesId}", not "${slot.speciesId}".`,
            );
          }
        }
      });
    });
  });
}

function validateGymReferences(
  gymsById: Record<string, CanonGymDefinition>,
  canonLocationsById: Record<string, CanonLocationDefinition>,
  speciesById: Record<string, PokemonSpeciesDefinition>,
  formsById: Record<string, PokemonFormDefinition>,
): void {
  Object.values(gymsById).forEach((gym) => {
    assertReference(canonLocationsById[gym.locationId], "gym", gym.id, "locationId", gym.locationId);

    gym.teams.forEach((team) => {
      assertReference(
        canonLocationsById[team.battleLocationId],
        "gym",
        gym.id,
        "team.battleLocationId",
        team.battleLocationId,
      );

      team.enemyTeam.forEach((enemy) => {
        assertReference(
          speciesById[enemy.speciesId],
          "gym",
          gym.id,
          "enemyTeam.speciesId",
          enemy.speciesId,
        );

        if (enemy.formId) {
          const form = formsById[enemy.formId];
          assertReference(form, "gym", gym.id, "enemyTeam.formId", enemy.formId);

          if (form && form.speciesId !== enemy.speciesId) {
            throw new ContentRegistryError(
              `Invalid gym "${gym.id}": formId "${enemy.formId}" belongs to "${form.speciesId}", not "${enemy.speciesId}".`,
            );
          }
        }
      });
    });
  });
}

function validateBattleCanonicalReferences(
  battlesById: Record<string, BattleDefinition>,
  gymsById: Record<string, CanonGymDefinition>,
): void {
  Object.values(battlesById).forEach((battle) => {
    if (!battle.canonicalGymId) {
      return;
    }

    if (battle.kind !== "gym") {
      throw new ContentRegistryError(
        `Invalid battle "${battle.id}": canonicalGymId is only allowed on gym battles.`,
      );
    }

    assertReference(
      gymsById[battle.canonicalGymId],
      "battle",
      battle.id,
      "canonicalGymId",
      battle.canonicalGymId,
    );
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
  const forms = rawContent.forms.map((formRecord, index) =>
    parseDocument("form", `forms[${index}]`, pokemonFormDefinitionSchema, formRecord),
  );
  const canonLocations = rawContent.canonLocations.map((locationRecord, index) =>
    parseDocument(
      "canon-location",
      `canonLocations[${index}]`,
      canonLocationDefinitionSchema,
      locationRecord,
    ),
  );
  const encounterTables = rawContent.encounterTables.map((encounterRecord, index) =>
    parseDocument(
      "encounter-table",
      `encounterTables[${index}]`,
      canonEncounterTableDefinitionSchema,
      encounterRecord,
    ),
  );
  const gyms = rawContent.gyms.map((gymRecord, index) =>
    parseDocument("gym", `gyms[${index}]`, canonGymDefinitionSchema, gymRecord),
  );
  const progression = parseDocument(
    "progression",
    "progression",
    combatTuningDefinitionSchema,
    rawContent.progression,
  );

  const registry: ContentRegistry = {
    worldMap,
    zonesById: createDocumentMap("zone", zones),
    dialoguesById: createDocumentMap("dialogue", dialogues),
    questsById: createDocumentMap("quest", quests),
    battlesById: createDocumentMap("battle", battles),
    speciesById: createDocumentMap("species", species),
    formsById: createDocumentMap("form", forms),
    canonLocationsById: createDocumentMap("canon-location", canonLocations),
    encounterTablesById: createDocumentMap("encounter-table", encounterTables),
    gymsById: createDocumentMap("gym", gyms),
    progression,
  };

  const canonLocationAreasById = createCanonLocationAreaMap(registry.canonLocationsById);

  validateWorldMapReferences(registry.worldMap, registry.zonesById);
  validateDialogueReferences(registry.dialoguesById);
  validateZoneActivityReferences(
    registry.zonesById,
    registry.dialoguesById,
    registry.questsById,
    registry.battlesById,
  );
  validateZoneCanonicalReferences(registry.zonesById, registry.canonLocationsById);
  validateQuestReferences(registry.questsById, registry.zonesById, registry.battlesById);
  validateSpeciesReferences(
    registry.zonesById,
    registry.battlesById,
    registry.speciesById,
    registry.formsById,
  );
  validateCanonLocationReferences(registry.canonLocationsById);
  validateEncounterReferences(
    registry.encounterTablesById,
    registry.canonLocationsById,
    canonLocationAreasById,
    registry.speciesById,
    registry.formsById,
  );
  validateGymReferences(
    registry.gymsById,
    registry.canonLocationsById,
    registry.speciesById,
    registry.formsById,
  );
  validateBattleCanonicalReferences(registry.battlesById, registry.gymsById);

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
