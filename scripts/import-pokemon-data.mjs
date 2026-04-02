import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const allowlist = [
  "turtwig", "grotle", "torterra",
  "chimchar", "monferno", "infernape",
  "piplup", "prinplup", "empoleon",
  "starly", "staravia", "staraptor",
  "bidoof", "bibarel",
  "shinx", "luxio", "luxray",
  "zubat", "golbat", "crobat",
  "geodude", "graveler", "golem",
  "machop", "machoke", "machamp",
  "onix", "steelix",
  "cranidos", "rampardos",
];

const speciesNameSet = new Set(allowlist);
const cacheRoot = path.join(repoRoot, "content", "source", "pokeapi-cache");
const generatedPath = path.join(repoRoot, "content", "generated", "pokemon", "species.v1.json");

function capitalizeWord(value) {
  return value
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function parseNameFromUrl(url) {
  return url.split("/").filter(Boolean).at(-1) ?? "";
}

async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function fetchJsonCached(endpointPath, cachePath) {
  try {
    return await readJson(cachePath);
  } catch {
    await ensureDir(path.dirname(cachePath));
  }

  const response = await fetch(`https://pokeapi.co/api/v2/${endpointPath}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpointPath}: ${response.status}`);
  }

  const payload = await response.json();
  await writeFile(cachePath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

async function loadSpeciesBundle(speciesId, evolutionChainCache) {
  const pokemonCachePath = path.join(cacheRoot, "pokemon", `${speciesId}.json`);
  const speciesCachePath = path.join(cacheRoot, "pokemon-species", `${speciesId}.json`);
  const pokemon = await fetchJsonCached(`pokemon/${speciesId}`, pokemonCachePath);
  const species = await fetchJsonCached(`pokemon-species/${speciesId}`, speciesCachePath);

  const evolutionChainId = parseNameFromUrl(species.evolution_chain.url);

  if (!evolutionChainCache.has(evolutionChainId)) {
    const evolutionCachePath = path.join(cacheRoot, "evolution-chain", `${evolutionChainId}.json`);
    const evolutionChain = await fetchJsonCached(
      `evolution-chain/${evolutionChainId}`,
      evolutionCachePath,
    );
    evolutionChainCache.set(evolutionChainId, evolutionChain);
  }

  return {
    pokemon,
    species,
    evolutionChain: evolutionChainCache.get(evolutionChainId),
  };
}

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

function getLocalizedName(speciesDocument, locale) {
  const localized = speciesDocument.names.find((entry) => entry.language.name === locale)?.name;
  return localized && localized.length > 0
    ? localized
    : locale === "fr"
      ? capitalizeWord(speciesDocument.name)
      : capitalizeWord(speciesDocument.name);
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

function normalizeSpeciesRecord(speciesId, bundle) {
  const statsByName = Object.fromEntries(
    bundle.pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat]),
  );
  const defensiveTypes = bundle.pokemon.types
    .slice()
    .sort((left, right) => left.slot - right.slot)
    .map((entry) => entry.type.name);
  const defaultOffensiveType =
    defensiveTypes[0] === "normal" && defensiveTypes[1]
      ? defensiveTypes[1]
      : defensiveTypes[0];
  const evolutionLinks = collectEvolutionLinks(bundle.evolutionChain.chain);
  const currentLinks = evolutionLinks.get(speciesId);
  const spriteUrl =
    bundle.pokemon.sprites.other?.["official-artwork"]?.front_default ??
    bundle.pokemon.sprites.front_default;

  if (!spriteUrl) {
    throw new Error(`Missing sprite for ${speciesId}`);
  }

  return {
    id: speciesId,
    dexNumber: bundle.species.id,
    familyId: buildFamilyId(evolutionLinks, speciesId),
    name: {
      en: getLocalizedName(bundle.species, "en"),
      fr: getLocalizedName(bundle.species, "fr"),
    },
    defensiveTypes,
    defaultOffensiveType,
    spriteUrl,
    baseStats: {
      hp: statsByName.hp ?? 1,
      attack: statsByName.attack ?? 1,
      defense: statsByName.defense ?? 1,
      specialAttack: statsByName["special-attack"] ?? 1,
      specialDefense: statsByName["special-defense"] ?? 1,
      speed: statsByName.speed ?? 1,
    },
    evolvesFromSpeciesId:
      currentLinks?.evolvesFromSpeciesId && speciesNameSet.has(currentLinks.evolvesFromSpeciesId)
        ? currentLinks.evolvesFromSpeciesId
        : undefined,
    evolvesToSpeciesIds:
      currentLinks?.evolvesToSpeciesIds.filter((entry) => speciesNameSet.has(entry)) ?? [],
    talentId: null,
  };
}

async function main() {
  const evolutionChainCache = new Map();
  const bundles = await Promise.all(
    allowlist.map(async (speciesId) => [speciesId, await loadSpeciesBundle(speciesId, evolutionChainCache)]),
  );

  const normalized = bundles
    .map(([speciesId, bundle]) => normalizeSpeciesRecord(speciesId, bundle))
    .sort((left, right) => left.dexNumber - right.dexNumber);

  await ensureDir(path.dirname(generatedPath));
  await writeFile(generatedPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  console.log(`Generated ${normalized.length} species -> ${generatedPath}`);
}

await main();
