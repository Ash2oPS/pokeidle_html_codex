import gym001Json from "../../../content/authored/battles/gym-001.json";
import town1IntroJson from "../../../content/authored/dialogues/town-1-intro.json";
import town2GymIntroJson from "../../../content/authored/dialogues/town-2-gym-intro.json";
import combatProgressionJson from "../../../content/authored/progression/combat.v1.json";
import sinnohEncounterTablesJson from "../../../content/generated/sinnoh/encounters.v1.json";
import sinnohGymsJson from "../../../content/generated/sinnoh/gyms.v1.json";
import sinnohLocationsJson from "../../../content/generated/sinnoh/locations.v1.json";
import pokemonFormsJson from "../../../content/generated/pokemon/forms.v1.json";
import pokemonSpeciesJson from "../../../content/generated/pokemon/species.v1.json";
import main001Json from "../../../content/authored/quests/main-001.json";
import main002Json from "../../../content/authored/quests/main-002.json";
import side001Json from "../../../content/authored/quests/side-001.json";
import worldMapJson from "../../../content/authored/world-map/world-map.v1.json";
import route1Json from "../../../content/authored/zones/route-1.json";
import route2Json from "../../../content/authored/zones/route-2.json";
import town1Json from "../../../content/authored/zones/town-1.json";
import town2Json from "../../../content/authored/zones/town-2.json";

export const authoredContentDocuments = {
  worldMap: worldMapJson,
  zones: [town1Json, route1Json, route2Json, town2Json],
  dialogues: [town1IntroJson, town2GymIntroJson],
  quests: [main001Json, main002Json, side001Json],
  battles: [gym001Json],
  species: pokemonSpeciesJson,
  forms: pokemonFormsJson,
  canonLocations: sinnohLocationsJson,
  encounterTables: sinnohEncounterTablesJson,
  gyms: sinnohGymsJson,
  progression: combatProgressionJson,
} as const;
