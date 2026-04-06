import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "../..");
export const contentRoot = path.join(repoRoot, "content");
export const sourceRoot = path.join(contentRoot, "source");
export const generatedRoot = path.join(contentRoot, "generated");
export const pokeapiCacheRoot = path.join(sourceRoot, "pokeapi-cache");
export const bulbapediaSnapshotRoot = path.join(sourceRoot, "bulbapedia-snapshots");

export const generatedSpeciesPath = path.join(generatedRoot, "pokemon", "species.v1.json");
export const generatedFormsPath = path.join(generatedRoot, "pokemon", "forms.v1.json");
export const generatedCanonLocationsPath = path.join(generatedRoot, "sinnoh", "locations.v1.json");
export const generatedEncounterTablesPath = path.join(generatedRoot, "sinnoh", "encounters.v1.json");
export const generatedGymsPath = path.join(generatedRoot, "sinnoh", "gyms.v1.json");

export const mainLocationsSnapshotPath = path.join(
  bulbapediaSnapshotRoot,
  "sinnoh-main-locations.v1.json",
);
export const gymsSnapshotPath = path.join(bulbapediaSnapshotRoot, "sinnoh-gyms.v1.json");

const generationNumberByName = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9,
};

export async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

export async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function parseTrailingIdFromUrl(url) {
  return url.split("/").filter(Boolean).at(-1) ?? "";
}

export function capitalizeWords(value) {
  return value
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function getLocalizedName(entries, locale, fallback) {
  const localized = entries?.find((entry) => entry.language?.name === locale)?.name;
  return localized && localized.length > 0 ? localized : fallback;
}

export function sortTypesBySlot(types) {
  return types
    .slice()
    .sort((left, right) => left.slot - right.slot)
    .map((entry) => entry.type.name);
}

export function getGenerationNumber(name) {
  return generationNumberByName[name] ?? Number.NaN;
}

export function resolveDefaultOffensiveType(defensiveTypes) {
  return defensiveTypes[0] === "normal" && defensiveTypes[1] ? defensiveTypes[1] : defensiveTypes[0];
}

export function canonicalizeSinnohLocationName(name) {
  return name
    .replace(/^sinnoh-sea-route-/, "route-")
    .replace(/^sinnoh-route-/, "route-")
    .replace(/^sinnoh-/, "");
}

export function makeSourceMetadata({
  source,
  sourceVersion,
  sourceId,
  sourceUrl,
  reviewStatus = "imported",
  reviewedBy,
  reviewedAt,
  notes,
}) {
  const metadata = {
    source,
    sourceVersion,
    sourceId,
    reviewStatus,
  };

  if (sourceUrl) {
    metadata.sourceUrl = sourceUrl;
  }

  if (reviewedBy) {
    metadata.reviewedBy = reviewedBy;
  }

  if (reviewedAt) {
    metadata.reviewedAt = reviewedAt;
  }

  if (notes) {
    metadata.notes = notes;
  }

  return metadata;
}

export async function fetchJsonCached(endpointPath, cachePath) {
  try {
    return await readJson(cachePath);
  } catch {
    await ensureDir(path.dirname(cachePath));
  }

  const response = await fetch(`https://pokeapi.co/api/v2/${endpointPath}`, {
    headers: {
      "User-Agent": "Codex/1.0 (+https://openai.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpointPath}: ${response.status}`);
  }

  const payload = await response.json();
  await writeFile(cachePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export async function runWithConcurrency(inputs, worker, concurrency = 8) {
  const results = new Array(inputs.length);
  let cursor = 0;

  async function runWorker() {
    while (cursor < inputs.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(inputs[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, () => runWorker()));
  return results;
}
