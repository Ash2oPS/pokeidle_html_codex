import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const mapDataDir = path.join(rootDir, "map_data");
const pokemonDataDir = path.join(rootDir, "pokemon_data");

const ROUTE_START = 29;
const ROUTE_END = 48;
const SOURCE_INDEX_URL = "https://altissimo1.github.io/Main-Series/Johto-Locations/index.html";

function decodeHtmlEntities(input) {
  return String(input || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(input) {
  return decodeHtmlEntities(String(input || ""))
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePokemonNameKey(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[().]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/-/g, "")
    .replace(/\s/g, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseClassName(attributesRaw) {
  const classMatch = String(attributesRaw || "").match(/\bclass="([^"]*)"/i);
  return classMatch ? classMatch[1] : "";
}

function parsePercentValue(text) {
  const match = String(text || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function parseLevelRange(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized || /%/.test(normalized)) {
    return { minLevel: null, maxLevel: null };
  }
  if (!/\d/.test(normalized)) {
    return { minLevel: null, maxLevel: null };
  }
  const values = [...normalized.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (values.length === 0) {
    return { minLevel: null, maxLevel: null };
  }
  return {
    minLevel: Math.min(...values),
    maxLevel: Math.max(...values),
  };
}

function parseVersionRateAndLevels(cells, versionPrefix) {
  const versionCells = cells
    .filter((cell) => cell.className.includes(versionPrefix))
    .map((cell) => cell.text);

  let rate = null;
  let minLevel = null;
  let maxLevel = null;
  for (const text of versionCells) {
    if (rate == null) {
      rate = parsePercentValue(text);
    }
    const range = parseLevelRange(text);
    if (range.minLevel != null && range.maxLevel != null) {
      minLevel = minLevel == null ? range.minLevel : Math.min(minLevel, range.minLevel);
      maxLevel = maxLevel == null ? range.maxLevel : Math.max(maxLevel, range.maxLevel);
    }
  }

  return {
    rate,
    minLevel,
    maxLevel,
  };
}

function getVersionPresenceFromCells(cells, versionPrefix) {
  return cells.some((cell) => {
    if (!cell.className.includes(versionPrefix)) {
      return false;
    }
    const text = cell.text;
    return text.length > 0 && text !== "N/A";
  });
}

function classifyCondition(conditionText) {
  const text = String(conditionText || "");
  if (/Radio:\s*(Hoenn Sound|Sinnoh Sound)/i.test(text)) {
    return "radio_conditional";
  }
  if (/\bSwarm\b/i.test(text) && !/\bNo\s*swarm\b/i.test(text)) {
    return "other_conditional";
  }
  if (/(Pok[eé] Radar|Dual Slot|GBA)/i.test(text)) {
    return "other_conditional";
  }
  return "standard";
}

function blockMethodFromId(divId) {
  if (divId === "pokemon-hgss-all-combined-static-table") {
    return "static";
  }
  const methodMatch = String(divId).match(/combined-([a-z0-9-]+)-table/i);
  if (!methodMatch) {
    return null;
  }
  const sourceMethod = methodMatch[1].toLowerCase();
  const map = {
    walking: "walk",
    surfing: "surf",
    fishing: "fishing",
    "rock-smash": "rock_smash",
    "headbutt-a": "headbutt_group_a",
    "headbutt-b": "headbutt_group_b",
    "headbutt-c": "headbutt_group_c",
    "headbutt-d": "headbutt_group_d",
    "headbutt-special": "headbutt_special",
  };
  return map[sourceMethod] || sourceMethod;
}

function captureDivBlocks(htmlText) {
  const lines = String(htmlText || "").split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(
      /<div id="(pokemon-hgss-compressed-combined-[^"]+-table|pokemon-hgss-all-combined-static-table)"/i,
    );
    if (!match) {
      continue;
    }

    const divId = match[1];
    const method = blockMethodFromId(divId);
    if (!method) {
      continue;
    }

    let depth = 0;
    const buffer = [];
    for (let cursor = index; cursor < lines.length; cursor += 1) {
      const currentLine = lines[cursor];
      depth += (currentLine.match(/<div\b/gi) || []).length;
      buffer.push(currentLine);
      depth -= (currentLine.match(/<\/div>/gi) || []).length;
      if (depth === 0) {
        blocks.push({ divId, method, html: buffer.join("\n") });
        index = cursor;
        break;
      }
    }
  }

  return blocks;
}

function parseRowCells(rowHtml) {
  const cells = [];
  const tdRegex = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
  let tdMatch = tdRegex.exec(rowHtml);
  while (tdMatch) {
    const attributes = tdMatch[1] || "";
    const inner = tdMatch[2] || "";
    cells.push({
      attributes,
      className: parseClassName(attributes),
      text: stripTags(inner),
      raw: inner,
    });
    tdMatch = tdRegex.exec(rowHtml);
  }
  return cells;
}

function findConditionText(cells) {
  const keywordCell = cells.find((cell) =>
    /\b(Anytime|Morning|Day|Night|Radio|Swarm|No swarm|Requires)\b/i.test(cell.text),
  );
  if (keywordCell) {
    return keywordCell.text;
  }

  const lightCells = cells.filter((cell) => cell.className.includes("light-"));
  if (lightCells.length > 0) {
    return lightCells[lightCells.length - 1].text || "";
  }

  const fallback = cells.find((cell) =>
    /(Anytime|Morning|Day|Night|Radio|Swarm|Requires)/i.test(cell.text),
  );
  return fallback ? fallback.text : "";
}

function parseCombinedBlockRows(block) {
  const rows = block.html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const parsed = [];
  let currentSpeciesFromImage = "";
  let currentFishingMethod = "fishing";

  for (const rowHtml of rows) {
    if (!/<td/i.test(rowHtml)) {
      continue;
    }

    const imageAltMatch = rowHtml.match(/alt="([^"]+)"/i);
    if (imageAltMatch) {
      currentSpeciesFromImage = stripTags(imageAltMatch[1]);
    }
    if (!currentSpeciesFromImage) {
      continue;
    }

    const cells = parseRowCells(rowHtml);
    if (cells.length === 0) {
      continue;
    }

    if (block.method === "fishing") {
      const rodCell = cells.find((cell) => /^(Old|Good|Super)$/i.test(cell.text));
      if (rodCell) {
        const rodValue = rodCell.text.toLowerCase();
        if (rodValue === "old") {
          currentFishingMethod = "old-rod";
        } else if (rodValue === "good") {
          currentFishingMethod = "good-rod";
        } else if (rodValue === "super") {
          currentFishingMethod = "super-rod";
        }
      }
    }
    const runtimeMethod = block.method === "fishing" ? currentFishingMethod : block.method;

    const hgPresent = getVersionPresenceFromCells(cells, "heartgold-");
    const ssPresent = getVersionPresenceFromCells(cells, "soulsilver-");
    if (!hgPresent && !ssPresent) {
      continue;
    }
    const hgStats = parseVersionRateAndLevels(cells, "heartgold-");
    const ssStats = parseVersionRateAndLevels(cells, "soulsilver-");

    const conditionText = findConditionText(cells);
    const isStatic = block.method === "static";
    const category = isStatic ? "static" : classifyCondition(conditionText);

    parsed.push({
      speciesLabel: currentSpeciesFromImage,
      method: runtimeMethod,
      hgPresent,
      ssPresent,
      category,
      conditionText,
      hgRate: hgStats.rate,
      ssRate: ssStats.rate,
      hgMinLevel: hgStats.minLevel,
      hgMaxLevel: hgStats.maxLevel,
      ssMinLevel: ssStats.minLevel,
      ssMaxLevel: ssStats.maxLevel,
    });
  }

  return parsed;
}

function buildPokemonLocalizationMap() {
  const map = new Map();
  const aliases = new Map([
    ["farfetchd", "farfetchd"],
    ["farfetchd", "farfetch'd"],
    ["nidoranf", "nidoran-f"],
    ["nidoranm", "nidoran-m"],
    ["mrmime", "mr-mime"],
    ["mimejr", "mime-jr"],
  ]);

  const dirEntries = fs
    .readdirSync(pokemonDataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const entry of dirEntries) {
    const dataFilePath = path.join(pokemonDataDir, entry.name, `${entry.name}_data.json`);
    if (!fs.existsSync(dataFilePath)) {
      continue;
    }
    try {
      const payload = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
      const pokemonId = Number(payload?.pokedex_number || 0);
      const nameEn = String(payload?.name_en || "").trim();
      const nameFr = String(payload?.name_fr || "").trim();
      if (!nameEn) {
        continue;
      }
      const key = normalizePokemonNameKey(nameEn);
      map.set(key, {
        pokemon_id: pokemonId > 0 ? pokemonId : null,
        pokemon_name_en: nameEn.toLowerCase(),
        pokemon_name_fr: nameFr || nameEn,
      });
    } catch {
      // Ignore malformed files and keep loading others.
    }
  }

  for (const [aliasKey, targetName] of aliases.entries()) {
    const targetKey = normalizePokemonNameKey(targetName);
    if (map.has(targetKey)) {
      map.set(aliasKey, map.get(targetKey));
    }
  }

  return map;
}

function resolvePokemonIdentity(siteLabel, localizationMap) {
  const trimmed = String(siteLabel || "").trim();
  const noForm = trimmed.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const formLower = trimmed.toLowerCase();
  const keyCandidates = [
    normalizePokemonNameKey(trimmed),
    normalizePokemonNameKey(noForm),
  ];

  let localized = null;
  for (const key of keyCandidates) {
    if (localizationMap.has(key)) {
      localized = localizationMap.get(key);
      break;
    }
  }

  const pokemonNameEn = localized
    ? localized.pokemon_name_en
    : noForm
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/\s+/g, "-");
  const pokemonNameFr = localized ? localized.pokemon_name_fr : trimmed;

  return {
    pokemon_id: localized?.pokemon_id ?? null,
    pokemon_name_site: trimmed,
    pokemon_name_en: pokemonNameEn,
    pokemon_name_fr: pokemonNameFr,
    form_label: formLower.includes("(") ? trimmed.replace(noForm, "").trim() : null,
  };
}

function ensureRouteSpeciesState(routeSpeciesMap, pokemonIdentity) {
  const key = pokemonIdentity.pokemon_name_en;
  if (!routeSpeciesMap.has(key)) {
    routeSpeciesMap.set(key, {
      pokemon_id: pokemonIdentity.pokemon_id,
      pokemon_name_en: pokemonIdentity.pokemon_name_en,
      pokemon_name_fr: pokemonIdentity.pokemon_name_fr,
      pokemon_name_site: pokemonIdentity.pokemon_name_site,
      categories: {
        standard: { heartgold: false, soulsilver: false },
        radio_conditional: { heartgold: false, soulsilver: false },
        other_conditional: { heartgold: false, soulsilver: false },
        static: { heartgold: false, soulsilver: false },
      },
      methods: {},
    });
  }
  return routeSpeciesMap.get(key);
}

function ensureMethodEncounter(routeMethodMap, method, pokemonKey, pokemonIdentity) {
  if (!routeMethodMap.has(method)) {
    routeMethodMap.set(method, new Map());
  }
  const methodEntries = routeMethodMap.get(method);
  if (!methodEntries.has(pokemonKey)) {
    methodEntries.set(pokemonKey, {
      pokemon_id: pokemonIdentity.pokemon_id,
      pokemon_name_en: pokemonIdentity.pokemon_name_en,
      pokemon_name_fr: pokemonIdentity.pokemon_name_fr,
      pokemon_name_site: pokemonIdentity.pokemon_name_site,
      availability: { heartgold: false, soulsilver: false },
      categories_present: [],
      condition_texts: [],
    });
  }
  return methodEntries.get(pokemonKey);
}

function buildCategorySummary(speciesEntries, categoryKey) {
  const common = [];
  const heartgoldOnly = [];
  const soulsilverOnly = [];

  for (const species of speciesEntries) {
    const availability = species.categories[categoryKey];
    if (!availability) {
      continue;
    }
    const label = species.pokemon_name_fr;
    if (availability.heartgold && availability.soulsilver) {
      common.push(label);
    } else if (availability.heartgold) {
      heartgoldOnly.push(label);
    } else if (availability.soulsilver) {
      soulsilverOnly.push(label);
    }
  }

  const alphaSort = (left, right) => left.localeCompare(right, "fr");
  common.sort(alphaSort);
  heartgoldOnly.sort(alphaSort);
  soulsilverOnly.sort(alphaSort);

  return {
    common,
    heartgold_only: heartgoldOnly,
    soulsilver_only: soulsilverOnly,
  };
}

function toArrayOfMethodEntries(routeMethodMap) {
  const methodNames = [...routeMethodMap.keys()].sort();
  const methods = {};
  for (const methodName of methodNames) {
    const entries = [...routeMethodMap.get(methodName).values()]
      .sort((left, right) => left.pokemon_name_fr.localeCompare(right.pokemon_name_fr, "fr"))
      .map((entry) => ({
        pokemon_id: entry.pokemon_id,
        pokemon_name_en: entry.pokemon_name_en,
        pokemon_name_fr: entry.pokemon_name_fr,
        pokemon_name_site: entry.pokemon_name_site,
        availability:
          entry.availability.heartgold && entry.availability.soulsilver
            ? "both"
            : entry.availability.heartgold
              ? "heartgold"
              : "soulsilver",
        categories_present: entry.categories_present.slice().sort(),
        condition_texts: entry.condition_texts.slice().sort(),
      }));
    methods[methodName] = entries;
  }
  return methods;
}

function ensureRuntimeEncounter(routeRuntimeMap, encounterKey, identity, method) {
  if (!routeRuntimeMap.has(encounterKey)) {
    routeRuntimeMap.set(encounterKey, {
      pokemon_id: identity.pokemon_id ?? null,
      pokemon_name_en: identity.pokemon_name_en,
      pokemon_name_fr: identity.pokemon_name_fr,
      pokemon_name_site: identity.pokemon_name_site,
      method,
      heartgold_rate_sum: 0,
      soulsilver_rate_sum: 0,
      heartgold_present: false,
      soulsilver_present: false,
      min_level: null,
      max_level: null,
      condition_texts: new Set(),
    });
  }
  return routeRuntimeMap.get(encounterKey);
}

function toRuntimeAvailabilityLabel(entry) {
  if (entry.heartgold_present && entry.soulsilver_present) {
    return "both";
  }
  if (entry.heartgold_present) {
    return "heartgold";
  }
  return "soulsilver";
}

function toRuntimeEncounterArray(routeRuntimeMap) {
  const encounters = [...routeRuntimeMap.values()].map((entry) => {
    const rateCandidates = [];
    if (entry.heartgold_rate_sum > 0) {
      rateCandidates.push(entry.heartgold_rate_sum);
    }
    if (entry.soulsilver_rate_sum > 0) {
      rateCandidates.push(entry.soulsilver_rate_sum);
    }
    const averageRate =
      rateCandidates.length > 0
        ? rateCandidates.reduce((sum, value) => sum + value, 0) / rateCandidates.length
        : 1;

    return {
      pokemon_id: entry.pokemon_id,
      pokemon_name_en: entry.pokemon_name_en,
      pokemon_name_fr: entry.pokemon_name_fr,
      pokemon_name_site: entry.pokemon_name_site,
      method: entry.method,
      availability: toRuntimeAvailabilityLabel(entry),
      spawn_weight: Math.max(1, Math.round(averageRate)),
      min_level: entry.min_level == null ? 1 : entry.min_level,
      max_level: entry.max_level == null ? 1 : entry.max_level,
      condition_texts: [...entry.condition_texts].sort(),
    };
  });

  encounters.sort((left, right) => {
    const byName = left.pokemon_name_fr.localeCompare(right.pokemon_name_fr, "fr");
    if (byName !== 0) {
      return byName;
    }
    return left.method.localeCompare(right.method);
  });

  return encounters;
}

function buildRuntimeSubsetPayload(sourcePayload) {
  const routes = sourcePayload.routes.map((route) => ({
    route_number: route.route_number,
    route_key: route.route_key,
    route_name_en: route.route_name_en,
    source_url: route.source_url,
    runtime_methods_present: route.runtime_subset.runtime_methods_present,
    runtime_encounters: route.runtime_subset.runtime_encounters,
  }));

  return {
    schema_version: 1,
    generated_at_utc: sourcePayload.generated_at_utc,
    source_reference: "map_data/johto_hgss_source_of_truth.json",
    route_number_range: sourcePayload.route_number_range,
    games_union: "heartgold+soulsilver",
    exclusions: {
      category_excluded: ["radio_conditional", "other_conditional", "static"],
      include_only_standard_rows: true,
      include_only_representable_runtime_encounters: true,
    },
    routes,
  };
}

function renderRuntimeSubsetMarkdown(runtimePayload) {
  const lines = [];
  lines.push("# Johto HGSS Runtime Subset");
  lines.push("");
  lines.push(`Generated at (UTC): ${runtimePayload.generated_at_utc}`);
  lines.push(`Routes covered: ${runtimePayload.route_number_range.start}-${runtimePayload.route_number_range.end}`);
  lines.push("Rules: standard-only union HG+SS, excludes radio/special/static.");
  lines.push("");

  for (const route of runtimePayload.routes) {
    const species = new Set(route.runtime_encounters.map((entry) => entry.pokemon_name_fr));
    lines.push(`## ${route.route_name_en}`);
    lines.push(`- route_key: \`${route.route_key}\``);
    lines.push(`- methods_present: ${route.runtime_methods_present.join(", ") || "-"}`);
    lines.push(`- encounters: ${route.runtime_encounters.length}`);
    lines.push(`- species_count: ${species.size}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildRuntimeSubsetCsv(runtimePayload) {
  const header = [
    "route_id",
    "route_name_fr",
    "zone_type",
    "combat_enabled",
    "pokemon_id",
    "pokemon_name_en",
    "pokemon_name_fr",
    "spawn_weight",
    "min_level",
    "max_level",
    "methods",
  ];

  const rows = [header.join(",")];
  for (const route of runtimePayload.routes) {
    for (const encounter of route.runtime_encounters) {
      const values = [
        route.route_key,
        `${route.route_name_en} (Johto)`,
        "route",
        "true",
        encounter.pokemon_id == null ? "" : String(encounter.pokemon_id),
        encounter.pokemon_name_en,
        encounter.pokemon_name_fr,
        String(encounter.spawn_weight),
        String(encounter.min_level),
        String(encounter.max_level),
        encounter.method,
      ];
      const escaped = values.map((value) => {
        const str = String(value ?? "");
        if (/[",\n\r]/.test(str)) {
          return `"${str.replace(/"/g, "\"\"")}"`;
        }
        return str;
      });
      rows.push(escaped.join(","));
    }
  }

  return `${rows.join("\n")}\n`;
}

function renderMarkdownSummary(payload) {
  const lines = [];
  lines.push("# Johto HGSS Source of Truth");
  lines.push("");
  lines.push(`Generated at (UTC): ${payload.generated_at_utc}`);
  lines.push(`Routes covered: ${payload.route_number_range.start}-${payload.route_number_range.end}`);
  lines.push("");
  lines.push("Categories:");
  lines.push("- standard: no radio-only requirement");
  lines.push("- radio_conditional: requires Hoenn/Sinnoh Sound");
  lines.push("- static: fixed encounter");
  lines.push("- other_conditional: non-radio conditional rows (if any)");
  lines.push("");

  for (const route of payload.routes) {
    lines.push(`## ${route.route_name_en}`);
    lines.push("");
    lines.push(`- route_key: \`${route.route_key}\``);
    lines.push(`- source_url: ${route.source_url}`);
    lines.push(`- methods_present: ${route.methods_present.join(", ") || "-"}`);
    lines.push(`- standard common: ${route.species_summary.standard.common.join(", ") || "-"}`);
    lines.push(`- standard HG only: ${route.species_summary.standard.heartgold_only.join(", ") || "-"}`);
    lines.push(`- standard SS only: ${route.species_summary.standard.soulsilver_only.join(", ") || "-"}`);
    lines.push(
      `- radio conditional common: ${route.species_summary.radio_conditional.common.join(", ") || "-"}`,
    );
    lines.push(
      `- static common: ${route.species_summary.static.common.join(", ") || "-"}`,
    );
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function fetchRouteHtml(routeNumber) {
  const url = `https://altissimo1.github.io/Main-Series/Johto-Locations/route-${routeNumber}.html`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch route ${routeNumber}: HTTP ${response.status}`);
  }
  return {
    url,
    html: await response.text(),
  };
}

async function buildSourceOfTruth() {
  const localizationMap = buildPokemonLocalizationMap();
  const routes = [];

  for (let routeNumber = ROUTE_START; routeNumber <= ROUTE_END; routeNumber += 1) {
    const { url, html } = await fetchRouteHtml(routeNumber);
    const routeNameMatch = html.match(/<h2>([^<]+)<\/h2>/i);
    const routeName = stripTags(routeNameMatch ? routeNameMatch[1] : `Route ${routeNumber}`);

    const blocks = captureDivBlocks(html);
    const routeSpeciesMap = new Map();
    const routeMethodMap = new Map();
    const routeRuntimeMap = new Map();

    for (const block of blocks) {
      const rows = parseCombinedBlockRows(block);
      for (const row of rows) {
        const identity = resolvePokemonIdentity(row.speciesLabel, localizationMap);
        const speciesState = ensureRouteSpeciesState(routeSpeciesMap, identity);
        const categoryAvailability = speciesState.categories[row.category];
        if (row.hgPresent) {
          categoryAvailability.heartgold = true;
        }
        if (row.ssPresent) {
          categoryAvailability.soulsilver = true;
        }

        if (!Array.isArray(speciesState.methods[block.method])) {
          speciesState.methods[block.method] = [];
        }
        if (!speciesState.methods[block.method].includes(row.category)) {
          speciesState.methods[block.method].push(row.category);
        }

        const methodEntry = ensureMethodEncounter(
          routeMethodMap,
          block.method,
          identity.pokemon_name_en,
          identity,
        );
        if (row.hgPresent) {
          methodEntry.availability.heartgold = true;
        }
        if (row.ssPresent) {
          methodEntry.availability.soulsilver = true;
        }
        if (!methodEntry.categories_present.includes(row.category)) {
          methodEntry.categories_present.push(row.category);
        }
        if (row.conditionText && !methodEntry.condition_texts.includes(row.conditionText)) {
          methodEntry.condition_texts.push(row.conditionText);
        }

        if (row.category === "standard" && row.method !== "static") {
          const runtimeKey = `${identity.pokemon_name_en}__${row.method}`;
          const runtimeEntry = ensureRuntimeEncounter(
            routeRuntimeMap,
            runtimeKey,
            identity,
            row.method,
          );
          if (row.hgPresent) {
            runtimeEntry.heartgold_present = true;
            if (row.hgRate != null) {
              runtimeEntry.heartgold_rate_sum += row.hgRate;
            }
            if (row.hgMinLevel != null) {
              runtimeEntry.min_level =
                runtimeEntry.min_level == null
                  ? row.hgMinLevel
                  : Math.min(runtimeEntry.min_level, row.hgMinLevel);
            }
            if (row.hgMaxLevel != null) {
              runtimeEntry.max_level =
                runtimeEntry.max_level == null
                  ? row.hgMaxLevel
                  : Math.max(runtimeEntry.max_level, row.hgMaxLevel);
            }
          }
          if (row.ssPresent) {
            runtimeEntry.soulsilver_present = true;
            if (row.ssRate != null) {
              runtimeEntry.soulsilver_rate_sum += row.ssRate;
            }
            if (row.ssMinLevel != null) {
              runtimeEntry.min_level =
                runtimeEntry.min_level == null
                  ? row.ssMinLevel
                  : Math.min(runtimeEntry.min_level, row.ssMinLevel);
            }
            if (row.ssMaxLevel != null) {
              runtimeEntry.max_level =
                runtimeEntry.max_level == null
                  ? row.ssMaxLevel
                  : Math.max(runtimeEntry.max_level, row.ssMaxLevel);
            }
          }
          if (row.conditionText) {
            runtimeEntry.condition_texts.add(row.conditionText);
          }
        }
      }
    }

    const speciesEntries = [...routeSpeciesMap.values()].sort((left, right) =>
      left.pokemon_name_fr.localeCompare(right.pokemon_name_fr, "fr"),
    );
    const runtimeEncounters = toRuntimeEncounterArray(routeRuntimeMap);

    routes.push({
      route_number: routeNumber,
      route_key: `johto_route_${routeNumber}`,
      route_name_en: routeName,
      source_url: url,
      methods_present: [...routeMethodMap.keys()].sort(),
      species_summary: {
        standard: buildCategorySummary(speciesEntries, "standard"),
        radio_conditional: buildCategorySummary(speciesEntries, "radio_conditional"),
        other_conditional: buildCategorySummary(speciesEntries, "other_conditional"),
        static: buildCategorySummary(speciesEntries, "static"),
      },
      species_detailed: speciesEntries.map((entry) => ({
        pokemon_id: entry.pokemon_id,
        pokemon_name_en: entry.pokemon_name_en,
        pokemon_name_fr: entry.pokemon_name_fr,
        pokemon_name_site: entry.pokemon_name_site,
        categories: entry.categories,
        methods: entry.methods,
      })),
      methods: toArrayOfMethodEntries(routeMethodMap),
      runtime_subset: {
        runtime_methods_present: [...new Set(runtimeEncounters.map((entry) => entry.method))].sort(),
        runtime_encounters: runtimeEncounters,
      },
    });
  }

  return {
    schema_version: 1,
    generated_at_utc: new Date().toISOString(),
    source_index_url: SOURCE_INDEX_URL,
    route_number_range: {
      start: ROUTE_START,
      end: ROUTE_END,
    },
    games: ["heartgold", "soulsilver"],
    routes,
  };
}

async function main() {
  const sourceOfTruth = await buildSourceOfTruth();
  const runtimeSubset = buildRuntimeSubsetPayload(sourceOfTruth);
  const outputJsonPath = path.join(mapDataDir, "johto_hgss_source_of_truth.json");
  const outputMarkdownPath = path.join(mapDataDir, "johto_hgss_source_of_truth.md");
  const runtimeSubsetJsonPath = path.join(mapDataDir, "johto_hgss_runtime_subset.json");
  const runtimeSubsetMarkdownPath = path.join(mapDataDir, "johto_hgss_runtime_subset.md");
  const runtimeSubsetCsvPath = path.join(mapDataDir, "johto_hgss_runtime_subset.csv");

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(sourceOfTruth, null, 2)}\n`, "utf8");
  fs.writeFileSync(outputMarkdownPath, renderMarkdownSummary(sourceOfTruth), "utf8");
  fs.writeFileSync(runtimeSubsetJsonPath, `${JSON.stringify(runtimeSubset, null, 2)}\n`, "utf8");
  fs.writeFileSync(runtimeSubsetMarkdownPath, renderRuntimeSubsetMarkdown(runtimeSubset), "utf8");
  fs.writeFileSync(runtimeSubsetCsvPath, buildRuntimeSubsetCsv(runtimeSubset), "utf8");

  console.log(`Generated: ${path.relative(rootDir, outputJsonPath)}`);
  console.log(`Generated: ${path.relative(rootDir, outputMarkdownPath)}`);
  console.log(`Generated: ${path.relative(rootDir, runtimeSubsetJsonPath)}`);
  console.log(`Generated: ${path.relative(rootDir, runtimeSubsetMarkdownPath)}`);
  console.log(`Generated: ${path.relative(rootDir, runtimeSubsetCsvPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
