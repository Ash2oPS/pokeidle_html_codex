import path from "node:path";
import {
  bulbapediaSnapshotRoot,
  canonicalizeSinnohLocationName,
  fetchJsonCached,
  getLocalizedName,
  gymsSnapshotPath,
  mainLocationsSnapshotPath,
  makeSourceMetadata,
  parseTrailingIdFromUrl,
  pokeapiCacheRoot,
  readJson,
  runWithConcurrency,
  writeJson,
} from "./canon-shared.mjs";

const PLATINUM_VERSION_NAME = "platinum";
const leaderConfigs = [
  {
    pageName: "Roark",
    gymId: "oreburgh-gym",
    locationId: "oreburgh-city",
    leaderId: "roark",
    leaderName: { en: "Roark", fr: "Pierrick" },
    badgeName: { en: "Coal Badge", fr: "Badge Charbon" },
    specialtyTypeId: "rock",
  },
  {
    pageName: "Gardenia",
    gymId: "eterna-gym",
    locationId: "eterna-city",
    leaderId: "gardenia",
    leaderName: { en: "Gardenia", fr: "Flo" },
    badgeName: { en: "Forest Badge", fr: "Badge Forêt" },
    specialtyTypeId: "grass",
  },
  {
    pageName: "Fantina",
    gymId: "hearthome-gym",
    locationId: "hearthome-city",
    leaderId: "fantina",
    leaderName: { en: "Fantina", fr: "Kiméra" },
    badgeName: { en: "Relic Badge", fr: "Badge Relique" },
    specialtyTypeId: "ghost",
  },
  {
    pageName: "Maylene",
    gymId: "veilstone-gym",
    locationId: "veilstone-city",
    leaderId: "maylene",
    leaderName: { en: "Maylene", fr: "Mélina" },
    badgeName: { en: "Cobble Badge", fr: "Badge Pavé" },
    specialtyTypeId: "fighting",
  },
  {
    pageName: "Crasher_Wake",
    gymId: "pastoria-gym",
    locationId: "pastoria-city",
    leaderId: "crasher-wake",
    leaderName: { en: "Crasher Wake", fr: "Lovis" },
    badgeName: { en: "Fen Badge", fr: "Badge Marais" },
    specialtyTypeId: "water",
  },
  {
    pageName: "Byron",
    gymId: "canalave-gym",
    locationId: "canalave-city",
    leaderId: "byron",
    leaderName: { en: "Byron", fr: "Charles" },
    badgeName: { en: "Mine Badge", fr: "Badge Mine" },
    specialtyTypeId: "steel",
  },
  {
    pageName: "Candice",
    gymId: "snowpoint-gym",
    locationId: "snowpoint-city",
    leaderId: "candice",
    leaderName: { en: "Candice", fr: "Gladys" },
    badgeName: { en: "Icicle Badge", fr: "Badge Glaçon" },
    specialtyTypeId: "ice",
  },
  {
    pageName: "Volkner",
    gymId: "sunyshore-gym",
    locationId: "sunyshore-city",
    leaderId: "volkner",
    leaderName: { en: "Volkner", fr: "Tanguy" },
    badgeName: { en: "Beacon Badge", fr: "Badge Phare" },
    specialtyTypeId: "electric",
  },
];

const supportedConditionPrefixes = ["swarm-", "time-", "radar-", "slot2-", "radio-", "weekday-"];
const supportedConditionIds = new Set(["other-none", "story-progress-none"]);

function inferLocationKind(locationId, kindOverrides) {
  if (kindOverrides[locationId]) {
    return kindOverrides[locationId];
  }

  if (locationId.endsWith("-city")) {
    return "city";
  }

  if (locationId.endsWith("-town")) {
    return "town";
  }

  if (locationId.startsWith("route-")) {
    return "route";
  }

  if (locationId.includes("lake")) {
    return "lake";
  }

  return "location";
}

function normalizeLocationName(locationDocument, locale, fallback) {
  return getLocalizedName(locationDocument.names, locale, fallback);
}

function normalizeLocationAreaName(areaDocument, locale, fallback) {
  return getLocalizedName(areaDocument.names, locale, fallback);
}

function canonicalizeLocationAreaId(areaName) {
  return canonicalizeSinnohLocationName(areaName);
}

function isSupportedEncounterCondition(conditionId) {
  return supportedConditionIds.has(conditionId) || supportedConditionPrefixes.some((prefix) => conditionId.startsWith(prefix));
}

function extractPlatinumSlots(versionDetails) {
  return versionDetails.find((entry) => entry.version.name === PLATINUM_VERSION_NAME) ?? null;
}

function parseBulbapediaTeam(sectionText, speciesIdByDexNumber) {
  const partyBlockMatch = sectionText.match(/\{\{Party[\s\S]*?\{\{Party\/end\}\}/);
  if (!partyBlockMatch) {
    return [];
  }

  return [...partyBlockMatch[0].matchAll(/\|\s*ndex\s*=\s*(\d+)[\s\S]*?\|\s*level\s*=\s*(\d+)/g)].map(
    (match) => {
      const dexNumber = Number(match[1]);
      const speciesId = speciesIdByDexNumber.get(dexNumber);

      if (!speciesId) {
        throw new Error(`Unable to resolve Bulbapedia team entry for dex #${dexNumber}.`);
      }

      return {
        speciesId,
        level: Number(match[2]),
      };
    },
  );
}

function extractBulbapediaLeaderField(rawText, pattern, fieldName, pageName) {
  const match = rawText.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Failed to extract ${fieldName} from Bulbapedia page "${pageName}".`);
  }

  return match[1].trim();
}

async function fetchBulbapediaRawPage(pageName) {
  const url = `https://bulbapedia.bulbagarden.net/wiki/${pageName}?action=raw`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Codex/1.0 (+https://openai.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Bulbapedia page "${pageName}": ${response.status}`);
  }

  return response.text();
}

async function ensureGymsSnapshot(speciesIdByDexNumber) {
  try {
    const existingSnapshot = await readJson(gymsSnapshotPath);
    return existingSnapshot.gyms;
  } catch {
    // Fetch and snapshot below.
  }

  const fetchedGyms = await runWithConcurrency(
    leaderConfigs,
    async (leaderConfig) => {
      const rawText = await fetchBulbapediaRawPage(leaderConfig.pageName);
      const platinumSection = extractBulbapediaLeaderField(
        rawText,
        /====\{\{game\|Platinum\}\}====([\s\S]*?)(?=\n====[^=]|$)/,
        "Platinum section",
        leaderConfig.pageName,
      );
      const gymBattleSection = extractBulbapediaLeaderField(
        platinumSection,
        /=====Gym battle=====([\s\S]*?)(?=\n=====|$)/,
        "Platinum gym team",
        leaderConfig.pageName,
      );
      const rematchSection = extractBulbapediaLeaderField(
        platinumSection,
        /=====\[\[Rematch\]\]=====([\s\S]*?)(?=\n=====|$)/,
        "Platinum rematch team",
        leaderConfig.pageName,
      );

      return {
        id: leaderConfig.gymId,
        locationId: leaderConfig.locationId,
        leaderId: leaderConfig.leaderId,
        leaderName: leaderConfig.leaderName,
        badgeName: leaderConfig.badgeName,
        specialtyTypeId: leaderConfig.specialtyTypeId,
        sourcePageTitle: leaderConfig.pageName,
        teams: [
          {
            id: `${leaderConfig.gymId}-main`,
            label: {
              en: "Gym Battle",
              fr: "Combat d'arène",
            },
            availability: "main",
            battleKind: "gym",
            battleLocationId: leaderConfig.locationId,
            enemyTeam: parseBulbapediaTeam(gymBattleSection, speciesIdByDexNumber),
          },
          {
            id: `${leaderConfig.gymId}-rematch`,
            label: {
              en: "Battleground Rematch",
              fr: "Revanche au Café des Combats",
            },
            availability: "postgame",
            battleKind: "rematch",
            battleLocationId: "battleground",
            enemyTeam: parseBulbapediaTeam(rematchSection, speciesIdByDexNumber),
          },
        ],
      };
    },
    2,
  );

  const snapshotPayload = {
    source: {
      source: "bulbapedia-snapshot",
      sourceVersion: "platinum",
      sourceId: "sinnoh-gyms.v1",
      sourceUrl: "https://bulbapedia.bulbagarden.net/wiki/Category:Sinnoh_Gym_Leaders",
      reviewStatus: "imported",
    },
    gyms: fetchedGyms,
  };

  await writeJson(gymsSnapshotPath, snapshotPayload);
  return fetchedGyms;
}

export async function importSinnohCanonData({ species, forms }) {
  const locationSnapshot = await readJson(mainLocationsSnapshotPath);
  const includedLocationIds = new Set(locationSnapshot.includedLocationIds);
  const formsById = new Map(forms.map((form) => [form.id, form]));
  const speciesById = new Map(species.map((record) => [record.id, record]));
  const speciesIdByDexNumber = new Map(species.map((record) => [record.dexNumber, record.id]));

  const regionCachePath = path.join(pokeapiCacheRoot, "region", "4.json");
  const regionDocument = await fetchJsonCached("region/4", regionCachePath);
  const sinnohLocationReferences = regionDocument.locations
    .map((entry) => ({
      canonicalId: canonicalizeSinnohLocationName(entry.name),
      pokeApiName: entry.name,
      url: entry.url,
    }))
    .filter((entry) => includedLocationIds.has(entry.canonicalId));

  const locationBundles = await runWithConcurrency(
    sinnohLocationReferences,
    async (locationReference) => {
      const locationId = parseTrailingIdFromUrl(locationReference.url);
      const cachePath = path.join(pokeapiCacheRoot, "location", `${locationId}.json`);
      const locationDocument = await fetchJsonCached(`location/${locationId}`, cachePath);
      const areas = await runWithConcurrency(
        locationDocument.areas,
        async (areaReference) => {
          const areaId = parseTrailingIdFromUrl(areaReference.url);
          const areaCachePath = path.join(pokeapiCacheRoot, "location-area", `${areaId}.json`);
          const areaDocument = await fetchJsonCached(`location-area/${areaId}`, areaCachePath);
          return {
            reference: areaReference,
            document: areaDocument,
          };
        },
        6,
      );

      return {
        canonicalId: locationReference.canonicalId,
        pokeApiName: locationReference.pokeApiName,
        document: locationDocument,
        areas,
      };
    },
    6,
  );

  const canonLocations = locationBundles
    .map((bundle) => ({
      id: bundle.canonicalId,
      pokeApiLocationId: bundle.document.id,
      name: {
        en: normalizeLocationName(bundle.document, "en", bundle.canonicalId),
        fr: normalizeLocationName(bundle.document, "fr", bundle.canonicalId),
      },
      regionId: "sinnoh",
      kind: inferLocationKind(bundle.canonicalId, locationSnapshot.kindOverrides ?? {}),
      adjacentLocationIds: locationSnapshot.adjacency?.[bundle.canonicalId] ?? [],
      areas: bundle.areas.map((areaBundle) => ({
        id: canonicalizeLocationAreaId(areaBundle.document.name),
        pokeApiLocationAreaId: areaBundle.document.id,
        name: {
          en: normalizeLocationAreaName(areaBundle.document, "en", canonicalizeLocationAreaId(areaBundle.document.name)),
          fr: normalizeLocationAreaName(areaBundle.document, "fr", canonicalizeLocationAreaId(areaBundle.document.name)),
        },
      })),
      source: makeSourceMetadata({
        source: "pokeapi+bulbapedia-snapshot",
        sourceVersion: "platinum",
        sourceId: `location/${bundle.document.id}|sinnoh-main-locations.v1`,
        sourceUrl: bundle.document.region?.url
          ? `https://pokeapi.co/api/v2/location/${bundle.document.id}/`
          : undefined,
      }),
    }))
    .sort((left, right) => left.pokeApiLocationId - right.pokeApiLocationId);

  const encounterTables = locationBundles
    .flatMap((bundle) =>
      bundle.areas
        .map((areaBundle) => {
          const locationAreaId = canonicalizeLocationAreaId(areaBundle.document.name);
          const methodsById = new Map(
            areaBundle.document.encounter_method_rates.map((methodRate) => [
              methodRate.encounter_method.name,
              methodRate.version_details.find((entry) => entry.version.name === PLATINUM_VERSION_NAME)?.rate ?? 0,
            ]),
          );
          const slotsByMethodId = new Map();

          areaBundle.document.pokemon_encounters.forEach((pokemonEncounter) => {
            const platinumDetails = extractPlatinumSlots(pokemonEncounter.version_details);
            if (!platinumDetails) {
              return;
            }

            platinumDetails.encounter_details.forEach((encounterDetail) => {
              const conditionIds = encounterDetail.condition_values.map((value) => value.name);
              if (conditionIds.some((conditionId) => !isSupportedEncounterCondition(conditionId))) {
                return;
              }

              let slotReference;
              if (speciesById.has(pokemonEncounter.pokemon.name)) {
                slotReference = {
                  speciesId: pokemonEncounter.pokemon.name,
                };
              } else if (formsById.has(pokemonEncounter.pokemon.name)) {
                const formRecord = formsById.get(pokemonEncounter.pokemon.name);
                slotReference = {
                  speciesId: formRecord.speciesId,
                  formId: formRecord.id,
                };
              } else {
                return;
              }

              const methodId = encounterDetail.method.name;
              const currentSlots = slotsByMethodId.get(methodId) ?? [];
              currentSlots.push({
                ...slotReference,
                minLevel: encounterDetail.min_level,
                maxLevel: encounterDetail.max_level,
                chance: encounterDetail.chance,
                conditionIds,
              });
              slotsByMethodId.set(methodId, currentSlots);
            });
          });

          const methods = [...slotsByMethodId.entries()]
            .map(([methodId, slots]) => ({
              methodId,
              rate: methodsById.get(methodId) ?? 0,
              slots,
            }))
            .filter((method) => method.slots.length > 0)
            .sort((left, right) => left.methodId.localeCompare(right.methodId));

          if (methods.length === 0) {
            return null;
          }

          return {
            id: locationAreaId,
            locationId: bundle.canonicalId,
            locationAreaId,
            versionId: PLATINUM_VERSION_NAME,
            methods,
            source: makeSourceMetadata({
              source: "pokeapi",
              sourceVersion: "platinum",
              sourceId: `location-area/${areaBundle.document.id}`,
              sourceUrl: `https://pokeapi.co/api/v2/location-area/${areaBundle.document.id}/`,
            }),
          };
        })
        .filter(Boolean),
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  const gymsSnapshot = await ensureGymsSnapshot(speciesIdByDexNumber);
  const gyms = gymsSnapshot.map((gymRecord) => ({
    id: gymRecord.id,
    locationId: gymRecord.locationId,
    leaderId: gymRecord.leaderId,
    leaderName: gymRecord.leaderName,
    badgeName: gymRecord.badgeName,
    specialtyTypeId: gymRecord.specialtyTypeId,
    teams: gymRecord.teams,
    source: makeSourceMetadata({
      source: "bulbapedia-snapshot",
      sourceVersion: "platinum",
      sourceId: `${gymRecord.id}|sinnoh-gyms.v1`,
      sourceUrl: `https://bulbapedia.bulbagarden.net/wiki/${gymRecord.sourcePageTitle}`,
    }),
  }));

  return {
    canonLocations,
    encounterTables,
    gyms,
  };
}
