import path from "node:path";
import {
  capitalizeWords,
  fetchJsonCached,
  getGenerationNumber,
  getLocalizedName,
  makeSourceMetadata,
  parseTrailingIdFromUrl,
  pokeapiCacheRoot,
  resolveDefaultOffensiveType,
  runWithConcurrency,
  sortTypesBySlot,
} from "./canon-shared.mjs";

const TARGET_MAX_DEX_NUMBER = 493;
const TARGET_GENERATION_NUMBER = 4;
const ignoredFormIds = new Set(["arceus-fairy", "arceus-unknown"]);

function collectEvolutionLinks(chainNode, evolvesFrom = null, links = new Map()) {
  const speciesId = chainNode.species.name;
  const evolvesToSpeciesIds = chainNode.evolves_to.map((entry) => entry.species.name);

  links.set(speciesId, {
    evolvesFromSpeciesId: evolvesFrom,
    evolvesToSpeciesIds,
  });

  chainNode.evolves_to.forEach((entry) => {
    collectEvolutionLinks(entry, speciesId, links);
  });

  return links;
}

function buildFamilyId(evolutionLinks, speciesId) {
  let cursor = speciesId;
  let previous = evolutionLinks.get(cursor)?.evolvesFromSpeciesId ?? null;

  while (previous) {
    cursor = previous;
    previous = evolutionLinks.get(cursor)?.evolvesFromSpeciesId ?? null;
  }

  return `${cursor}-family`;
}

function getPlatinumTypes(pokemonDocument) {
  const currentTypes = sortTypesBySlot(pokemonDocument.types);
  const matchingPastTypes = (pokemonDocument.past_types ?? [])
    .map((entry) => ({
      generationNumber: getGenerationNumber(entry.generation.name),
      types: sortTypesBySlot(entry.types),
    }))
    .filter((entry) => Number.isFinite(entry.generationNumber) && entry.generationNumber >= TARGET_GENERATION_NUMBER)
    .sort((left, right) => left.generationNumber - right.generationNumber);

  return matchingPastTypes[0]?.types ?? currentTypes;
}

function resolvePlatinumFrontSpriteUrl(pokemonDocument, fallbackSpriteUrl = null) {
  return (
    pokemonDocument?.sprites?.versions?.["generation-iv"]?.platinum?.front_default ??
    pokemonDocument?.sprites?.front_default ??
    fallbackSpriteUrl
  );
}

function getLocalizedSpeciesName(speciesDocument, locale) {
  const fallback = capitalizeWords(speciesDocument.name);
  return getLocalizedName(speciesDocument.names, locale, fallback);
}

function getFormDisplayName(formDocument, locale, speciesFallbackName) {
  const fallback = `${speciesFallbackName} ${capitalizeWords(formDocument.name)}`.trim();
  return getLocalizedName(formDocument.names, locale, fallback);
}

function getFormLabel(formDocument, locale, fullNameFallback) {
  return getLocalizedName(formDocument.form_names, locale, fullNameFallback);
}

function createBaseStatsRecord(pokemonDocument) {
  const statsByName = Object.fromEntries(
    pokemonDocument.stats.map((entry) => [entry.stat.name, entry.base_stat]),
  );

  return {
    hp: statsByName.hp ?? 1,
    attack: statsByName.attack ?? 1,
    defense: statsByName.defense ?? 1,
    specialAttack: statsByName["special-attack"] ?? 1,
    specialDefense: statsByName["special-defense"] ?? 1,
    speed: statsByName.speed ?? 1,
  };
}

async function fetchOptionalPokemonByName(pokemonId) {
  const cachePath = path.join(pokeapiCacheRoot, "pokemon", `${pokemonId}.json`);

  try {
    return await fetchJsonCached(`pokemon/${pokemonId}`, cachePath);
  } catch (error) {
    if (error instanceof Error && error.message.includes(": 404")) {
      return null;
    }

    throw error;
  }
}

async function loadSpeciesBundle(dexNumber, evolutionChainCache) {
  const speciesCachePath = path.join(pokeapiCacheRoot, "pokemon-species", `${dexNumber}.json`);
  const species = await fetchJsonCached(`pokemon-species/${dexNumber}`, speciesCachePath);
  const defaultPokemonReference = species.varieties.find((entry) => entry.is_default)?.pokemon;

  if (!defaultPokemonReference) {
    throw new Error(`Missing default Pokemon variety for species #${dexNumber}.`);
  }

  const pokemonName = defaultPokemonReference.name;
  const pokemonCachePath = path.join(pokeapiCacheRoot, "pokemon", `${pokemonName}.json`);
  const pokemon = await fetchJsonCached(`pokemon/${pokemonName}`, pokemonCachePath);
  const evolutionChainId = parseTrailingIdFromUrl(species.evolution_chain.url);

  if (!evolutionChainCache.has(evolutionChainId)) {
    const evolutionCachePath = path.join(
      pokeapiCacheRoot,
      "evolution-chain",
      `${evolutionChainId}.json`,
    );
    const evolutionChain = await fetchJsonCached(
      `evolution-chain/${evolutionChainId}`,
      evolutionCachePath,
    );
    evolutionChainCache.set(evolutionChainId, evolutionChain);
  }

  return {
    species,
    pokemon,
    evolutionChain: evolutionChainCache.get(evolutionChainId),
  };
}

function getFallbackTypesForForm(bundle, formId) {
  if (bundle.species.name === "arceus") {
    const typeId = formId.replace(/^arceus-/, "");
    return [typeId];
  }

  return getPlatinumTypes(bundle.pokemon);
}

async function normalizeFormRecord(bundle, formId) {
  const formCachePath = path.join(pokeapiCacheRoot, "pokemon-form", `${formId}.json`);
  const formDocument = await fetchJsonCached(`pokemon-form/${formId}`, formCachePath);

  if (formDocument.is_default || ignoredFormIds.has(formId)) {
    return null;
  }

  const formPokemon = await fetchOptionalPokemonByName(formId);
  const defensiveTypes = formPokemon ? getPlatinumTypes(formPokemon) : getFallbackTypesForForm(bundle, formId);
  const speciesNameEn = getLocalizedSpeciesName(bundle.species, "en");
  const speciesNameFr = getLocalizedSpeciesName(bundle.species, "fr");
  const nameEn = getFormDisplayName(formDocument, "en", speciesNameEn);
  const nameFr = getFormDisplayName(formDocument, "fr", speciesNameFr);
  const formNameEn = getFormLabel(formDocument, "en", nameEn);
  const formNameFr = getFormLabel(formDocument, "fr", nameFr);
  const frontSpriteUrl = resolvePlatinumFrontSpriteUrl(formPokemon, formDocument.sprites?.front_default ?? null);

  if (!frontSpriteUrl) {
    return null;
  }

  return {
    sortOrder: formDocument.order ?? Number.MAX_SAFE_INTEGER,
    record: {
      id: formId,
      speciesId: bundle.species.name,
      pokemonId: formDocument.pokemon.name,
      name: {
        en: nameEn,
        fr: nameFr,
      },
      formName: {
        en: formNameEn,
        fr: formNameFr,
      },
      isDefault: false,
      isBattleOnly: formDocument.is_battle_only,
      defensiveTypes,
      defaultOffensiveType: resolveDefaultOffensiveType(defensiveTypes),
      frontSpriteUrl,
      baseStats: createBaseStatsRecord(formPokemon ?? bundle.pokemon),
      source: makeSourceMetadata({
        source: "pokeapi",
        sourceVersion: "platinum",
        sourceId: `pokemon-form/${formId}`,
        sourceUrl: `https://pokeapi.co/api/v2/pokemon-form/${formId}/`,
      }),
    },
  };
}

export async function importPokemonCanonData() {
  const evolutionChainCache = new Map();
  const dexNumbers = Array.from({ length: TARGET_MAX_DEX_NUMBER }, (_value, index) => index + 1);
  const bundles = await runWithConcurrency(
    dexNumbers,
    async (dexNumber) => loadSpeciesBundle(dexNumber, evolutionChainCache),
    8,
  );
  const bundleBySpeciesId = new Map(bundles.map((bundle) => [bundle.species.name, bundle]));
  const speciesNameSet = new Set(bundleBySpeciesId.keys());

  const normalizedFormsWithOrder = (
    await runWithConcurrency(
      bundles.flatMap((bundle) => bundle.pokemon.forms.map((entry) => ({ bundle, formId: entry.name }))),
      async ({ bundle, formId }) => normalizeFormRecord(bundle, formId),
      6,
    )
  ).filter(Boolean);

  const formRecords = normalizedFormsWithOrder
    .sort(
      (left, right) =>
        bundleBySpeciesId.get(left.record.speciesId).species.id -
          bundleBySpeciesId.get(right.record.speciesId).species.id ||
        left.sortOrder - right.sortOrder ||
        left.record.id.localeCompare(right.record.id),
    )
    .map((entry) => entry.record);

  const formIdsBySpeciesId = formRecords.reduce((accumulator, formRecord) => {
    const currentFormIds = accumulator.get(formRecord.speciesId) ?? [];
    currentFormIds.push(formRecord.id);
    accumulator.set(formRecord.speciesId, currentFormIds);
    return accumulator;
  }, new Map());

  const speciesRecords = bundles
    .map((bundle) => {
      const evolutionLinks = collectEvolutionLinks(bundle.evolutionChain.chain);
      const currentLinks = evolutionLinks.get(bundle.species.name);
      const defensiveTypes = getPlatinumTypes(bundle.pokemon);
      const frontSpriteUrl = resolvePlatinumFrontSpriteUrl(bundle.pokemon);

      if (!frontSpriteUrl) {
        throw new Error(`Missing Platinum front sprite for species "${bundle.species.name}".`);
      }

      return {
        id: bundle.species.name,
        dexNumber: bundle.species.id,
        familyId: buildFamilyId(evolutionLinks, bundle.species.name),
        name: {
          en: getLocalizedSpeciesName(bundle.species, "en"),
          fr: getLocalizedSpeciesName(bundle.species, "fr"),
        },
        defensiveTypes,
        defaultOffensiveType: resolveDefaultOffensiveType(defensiveTypes),
        frontSpriteUrl,
        baseStats: createBaseStatsRecord(bundle.pokemon),
        evolvesFromSpeciesId:
          currentLinks?.evolvesFromSpeciesId && speciesNameSet.has(currentLinks.evolvesFromSpeciesId)
            ? currentLinks.evolvesFromSpeciesId
            : undefined,
        evolvesToSpeciesIds:
          currentLinks?.evolvesToSpeciesIds.filter((speciesId) => speciesNameSet.has(speciesId)) ?? [],
        captureRate: bundle.species.capture_rate,
        growthRate: bundle.species.growth_rate.name,
        eggGroups: bundle.species.egg_groups.map((entry) => entry.name),
        formIds: formIdsBySpeciesId.get(bundle.species.name) ?? [],
        talentId: null,
        source: makeSourceMetadata({
          source: "pokeapi",
          sourceVersion: "platinum",
          sourceId: `pokemon-species/${bundle.species.id}`,
          sourceUrl: `https://pokeapi.co/api/v2/pokemon-species/${bundle.species.id}/`,
        }),
      };
    })
    .sort((left, right) => left.dexNumber - right.dexNumber);

  return {
    species: speciesRecords,
    forms: formRecords,
  };
}
