#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";

const HOST = process.env.CUSTOM_SKIN_TOOL_HOST || "127.0.0.1";
const PORT = Number(process.env.CUSTOM_SKIN_TOOL_PORT || 4876);
const ROOT_DIR = path.resolve(process.cwd());
const UI_INDEX_PATH = path.join(ROOT_DIR, "tools", "custom-skin-tool", "index.html");
const POKEMON_DATA_DIR = path.resolve(process.env.CUSTOM_SKIN_TOOL_DATA_DIR || path.join(ROOT_DIR, "pokemon_data"));
const MAX_BODY_BYTES = 1024 * 1024;
const SPRITE_EXTENSIONS = new Set([".png", ".gif", ".webp", ".jpg", ".jpeg"]);
const FUSIONDEX_CDN_HOST = "cdn.fusiondex.org";
const FUSIONDEX_SITE_HOSTS = new Set(["fusiondex.org", "www.fusiondex.org"]);
const fusionDexAuthorCache = new Map();
const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const BULBAGARDEN_REDIRECT_BASE = "https://archives.bulbagarden.net/wiki/Special:Redirect/file";
const OFFICIAL_VARIANT_DEFINITIONS = [
  {
    id: "firered_leafgreen",
    generation_key: "generation-iii",
    game_key: "firered-leafgreen",
    label_fr: "Rouge Feu / Vert Feuille",
    generation: 3,
  },
  {
    id: "ruby_sapphire",
    generation_key: "generation-iii",
    game_key: "ruby-sapphire",
    label_fr: "Rubis / Saphir",
    generation: 3,
  },
  {
    id: "heartgold_soulsilver",
    generation_key: "generation-iv",
    game_key: "heartgold-soulsilver",
    label_fr: "HeartGold / SoulSilver",
    generation: 4,
  },
  {
    id: "platinum",
    generation_key: "generation-iv",
    game_key: "platinum",
    label_fr: "Platine",
    generation: 4,
  },
  {
    id: "diamond_pearl",
    generation_key: "generation-iv",
    game_key: "diamond-pearl",
    label_fr: "Diamant / Perle",
    generation: 4,
  },
  {
    id: "gold_silver",
    source: "bulbagarden",
    bulbagarden_code: "2g",
    game_key: "gold",
    label_fr: "Or / Argent",
    generation: 2,
    max_pokedex_id: 251,
    supports_shiny: true,
  },
  {
    id: "yellow",
    source: "bulbagarden",
    bulbagarden_code: "1y",
    label_fr: "Jaune",
    generation: 1,
    max_pokedex_id: 151,
    supports_shiny: false,
  },
  {
    id: "green",
    source: "bulbagarden",
    bulbagarden_code: "1g",
    label_fr: "Vert",
    generation: 1,
    max_pokedex_id: 151,
    supports_shiny: false,
  },
  {
    id: "red_blue",
    source: "bulbagarden",
    bulbagarden_code: "1b",
    game_key: "red-blue",
    label_fr: "Rouge / Bleu",
    generation: 1,
    max_pokedex_id: 151,
    supports_shiny: false,
  },
  {
    id: "black_white",
    generation_key: "generation-v",
    game_key: "black-white",
    label_fr: "Noir / Blanc (anime)",
    generation: 5,
    animated: true,
  },
];
const TRANSPARENT_SPRITE_CANDIDATES = [
  {
    other_key: "home",
    game_key: "home",
    label_fr: "Home",
  },
  {
    other_key: "official-artwork",
    game_key: "official-artwork",
    label_fr: "Artwork officiel transparent",
  },
];
const DEFAULT_OFFICIAL_VARIANT_PREFERENCE = [
  "firered_leafgreen",
  "ruby_sapphire",
  "heartgold_soulsilver",
  "platinum",
  "diamond_pearl",
  "gold_silver",
  "yellow",
  "green",
  "red_blue",
  "transparent",
];
const BULK_CUSTOM_EXCLUDED_AUTHORS = new Set([
  "the ds-style 64x64",
  "the ds-style 64x64 pokémon sprite resource",
  "the ds-style 64x64 pokemon sprite resource",
  "game freak",
]);

function sendJson(response, statusCode, payload) {
  const serialized = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(serialized),
    "Cache-Control": "no-store",
  });
  response.end(serialized);
}

function sendText(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(String(payload || ""));
}

function toUrlPath(...segments) {
  const encoded = [];
  for (const rawSegment of segments) {
    const parts = String(rawSegment || "")
      .split("/")
      .filter(Boolean);
    for (const part of parts) {
      encoded.push(encodeURIComponent(part));
    }
  }
  return `/${encoded.join("/")}`;
}

function normalizeVariantId(rawValue) {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function normalizeAuthorLabel(rawValue) {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isCustomVariant(variant) {
  if (!variant || typeof variant !== "object") {
    return false;
  }
  const id = normalizeVariantId(variant.id);
  const gameKey = normalizeVariantId(variant.game_key);
  const front = String(variant.front || "");
  return id.startsWith("custom_") || gameKey.startsWith("custom_") || front.includes("_custom_");
}

function sanitizeToken(rawValue, fallback = "sprite") {
  const token = String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return token || fallback;
}

function inferExtensionFromContentType(contentType) {
  const normalized = String(contentType || "").toLowerCase().split(";")[0].trim();
  if (normalized === "image/png") {
    return ".png";
  }
  if (normalized === "image/gif") {
    return ".gif";
  }
  if (normalized === "image/webp") {
    return ".webp";
  }
  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return ".jpg";
  }
  return "";
}

function inferExtensionFromUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    const ext = path.extname(parsed.pathname || "").toLowerCase();
    return SPRITE_EXTENSIONS.has(ext) ? ext : "";
  } catch {
    return "";
  }
}

function toErrorReason(error) {
  return error instanceof Error ? error.message : "erreur_inconnue";
}

function formatBulbagardenSpriteFileName(code, pokedexId, shiny = false) {
  const suffix = shiny ? "_s" : "";
  return `Spr_${code}_${String(pokedexId).padStart(3, "0")}${suffix}.png`;
}

function buildBulbagardenSpriteUrl(code, pokedexId, shiny = false) {
  const fileName = formatBulbagardenSpriteFileName(code, pokedexId, shiny);
  return `${BULBAGARDEN_REDIRECT_BASE}/${encodeURIComponent(fileName)}`;
}

function getBulbagardenVariantSpriteUrls(pokedexId, variantDef) {
  const maxPokedexId = Number.parseInt(String(variantDef.max_pokedex_id || "0"), 10);
  if (Number.isFinite(maxPokedexId) && maxPokedexId > 0 && pokedexId > maxPokedexId) {
    return [null, null];
  }
  const code = String(variantDef.bulbagarden_code || "")
    .trim()
    .toLowerCase();
  if (!code) {
    return [null, null];
  }
  const frontDefault = buildBulbagardenSpriteUrl(code, pokedexId, false);
  const frontShiny = variantDef.supports_shiny ? buildBulbagardenSpriteUrl(code, pokedexId, true) : null;
  return [frontDefault, frontShiny];
}

function getVariantSpriteUrlsFromPokeApi(pokeApiPokemonPayload, variantDef, pokedexId) {
  if (variantDef.source === "bulbagarden") {
    return getBulbagardenVariantSpriteUrls(pokedexId, variantDef);
  }
  const versions = pokeApiPokemonPayload?.sprites?.versions;
  const generationPayload =
    versions && typeof versions === "object" ? versions[variantDef.generation_key] || {} : {};
  let gamePayload =
    generationPayload && typeof generationPayload === "object" ? generationPayload[variantDef.game_key] || {} : {};
  if (variantDef.animated && gamePayload && typeof gamePayload.animated === "object") {
    gamePayload = gamePayload.animated;
  }
  const frontDefault = gamePayload?.front_transparent || gamePayload?.front_default || null;
  const frontShiny = gamePayload?.front_shiny_transparent || gamePayload?.front_shiny || null;
  return [frontDefault, frontShiny];
}

function getTransparentVariantCandidateFromPokeApi(pokeApiPokemonPayload) {
  const otherPayload = pokeApiPokemonPayload?.sprites?.other;
  if (!otherPayload || typeof otherPayload !== "object") {
    return null;
  }
  for (const candidate of TRANSPARENT_SPRITE_CANDIDATES) {
    const sourcePayload = otherPayload[candidate.other_key];
    if (!sourcePayload || typeof sourcePayload !== "object") {
      continue;
    }
    const frontDefault = sourcePayload.front_default || null;
    const frontShiny = sourcePayload.front_shiny || null;
    if (frontDefault || frontShiny) {
      return {
        variantDef: {
          id: "transparent",
          label_fr: candidate.label_fr,
          generation: 0,
          game_key: candidate.game_key,
        },
        frontDefault,
        frontShiny,
      };
    }
  }
  return null;
}

async function fetchWithRetry(url, options = {}, maxAttempts = 3) {
  const attempts = Math.max(1, Number.parseInt(String(maxAttempts), 10) || 1);
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) {
        break;
      }
      const waitMs = Math.min(2000, 250 * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError || new Error("fetch_failed");
}

async function fetchPokeApiPokemonPayload(pokedexId) {
  const response = await fetchWithRetry(`${POKEAPI_BASE}/pokemon/${encodeURIComponent(String(pokedexId))}`, {
    headers: {
      "user-agent": "pokeidle-custom-skin-tool/1.0",
      accept: "application/json,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`pokeapi_http_${response.status}`);
  }
  return await response.json();
}

function cleanupRemovedSpriteFileCandidates(folderPath, refsBefore, refsAfter) {
  const toDelete = [];
  for (const relPath of refsBefore) {
    if (!relPath || /^https?:\/\//i.test(relPath) || refsAfter.has(relPath)) {
      continue;
    }
    const absPath = path.resolve(folderPath, relPath);
    if (!absPath.startsWith(path.resolve(folderPath))) {
      continue;
    }
    toDelete.push(absPath);
  }
  return toDelete;
}

function buildDefaultVariantId(variants, previousDefaultId = "") {
  for (const preferredId of DEFAULT_OFFICIAL_VARIANT_PREFERENCE) {
    const match = variants.find(
      (variant) => normalizeVariantId(variant?.id || variant?.game_key || "") === normalizeVariantId(preferredId)
    );
    if (match) {
      return String(match.id || match.game_key || "");
    }
  }
  const previousMatch = variants.find(
    (variant) =>
      normalizeVariantId(variant?.id || variant?.game_key || "") === normalizeVariantId(previousDefaultId || "")
  );
  if (previousMatch) {
    return String(previousMatch.id || previousMatch.game_key || "");
  }
  const first = variants.find((variant) => normalizeVariantId(variant?.id || variant?.game_key || ""));
  return first ? String(first.id || first.game_key || "") : "";
}

async function downloadSpriteFile(spriteUrl, destinationWithoutExt) {
  if (!spriteUrl) {
    return null;
  }
  const response = await fetchWithRetry(spriteUrl, {
    headers: {
      "user-agent": "pokeidle-custom-skin-tool/1.0",
      accept: "image/*,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }
  const contentType = String(response.headers.get("content-type") || "");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength <= 0) {
    throw new Error("fichier_vide");
  }
  const ext = inferExtensionFromContentType(contentType) || inferExtensionFromUrl(spriteUrl) || ".png";
  const targetPath = `${destinationWithoutExt}${ext}`;
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.writeFile(targetPath, buffer);
  return path.basename(targetPath);
}

async function buildOfficialVariantOutput(pokemon, variantDef, frontDefaultUrl, frontShinyUrl, resultTracker) {
  if (!frontDefaultUrl && !frontShinyUrl) {
    return null;
  }

  const variantToken = sanitizeToken(variantDef.id, "variant");
  let frontFileName = null;
  let shinyFileName = null;

  if (frontDefaultUrl) {
    try {
      frontFileName = await downloadSpriteFile(
        frontDefaultUrl,
        path.join(pokemon.spriteDir, `${pokemon.folderName}_${variantToken}_front`)
      );
      if (frontFileName) {
        resultTracker.downloaded_files.push(path.join("sprites", frontFileName).replaceAll("\\", "/"));
      }
    } catch (error) {
      resultTracker.errors.push({
        variant_id: String(variantDef.id || ""),
        field: "front",
        reason: toErrorReason(error),
      });
    }
  }

  if (frontShinyUrl) {
    try {
      shinyFileName = await downloadSpriteFile(
        frontShinyUrl,
        path.join(pokemon.spriteDir, `${pokemon.folderName}_${variantToken}_front_shiny`)
      );
      if (shinyFileName) {
        resultTracker.downloaded_files.push(path.join("sprites", shinyFileName).replaceAll("\\", "/"));
      }
    } catch (error) {
      resultTracker.errors.push({
        variant_id: String(variantDef.id || ""),
        field: "front_shiny",
        reason: toErrorReason(error),
      });
    }
  }

  if (!frontFileName && !shinyFileName) {
    return null;
  }

  const output = {
    id: String(variantDef.id || ""),
    label_fr: String(variantDef.label_fr || ""),
    generation: Number.parseInt(String(variantDef.generation || "0"), 10) || 0,
    game_key: String(variantDef.game_key || variantDef.id || ""),
    front: frontFileName ? path.join("sprites", frontFileName).replaceAll("\\", "/") : null,
    front_shiny: shinyFileName ? path.join("sprites", shinyFileName).replaceAll("\\", "/") : null,
  };
  if (variantDef.animated) {
    output.animated = true;
  }
  return output;
}

async function buildOfficialVariantsFromPokeApi(pokemon, pokeApiPokemonPayload, resultTracker) {
  const outputs = [];
  const transparentCandidate = getTransparentVariantCandidateFromPokeApi(pokeApiPokemonPayload);
  if (transparentCandidate) {
    const output = await buildOfficialVariantOutput(
      pokemon,
      transparentCandidate.variantDef,
      transparentCandidate.frontDefault,
      transparentCandidate.frontShiny,
      resultTracker
    );
    if (output) {
      outputs.push(output);
    }
  }

  for (const variantDef of OFFICIAL_VARIANT_DEFINITIONS) {
    const [frontDefaultUrl, frontShinyUrl] = getVariantSpriteUrlsFromPokeApi(
      pokeApiPokemonPayload,
      variantDef,
      pokemon.pokemonId
    );
    const output = await buildOfficialVariantOutput(
      pokemon,
      variantDef,
      frontDefaultUrl,
      frontShinyUrl,
      resultTracker
    );
    if (output) {
      outputs.push(output);
    }
  }

  return outputs;
}

async function reinstallOfficialSprites(pokemon) {
  await fsp.mkdir(pokemon.spriteDir, { recursive: true });

  const previousVariants = Array.isArray(pokemon.payload.sprite_variants) ? pokemon.payload.sprite_variants : [];
  const customVariants = previousVariants.filter((variant) => isCustomVariant(variant));
  const previousDefaultVariantId = String(pokemon.payload.default_sprite_variant_id || "");
  const refsBefore = getAllReferencedSpritePaths(pokemon.payload);
  const result = {
    downloaded_files: [],
    deleted_files: [],
    errors: [],
    official_variants: 0,
    custom_preserved: customVariants.length,
    default_variant_id: "",
  };

  const pokeApiPokemonPayload = await fetchPokeApiPokemonPayload(pokemon.pokemonId);
  const officialVariants = await buildOfficialVariantsFromPokeApi(pokemon, pokeApiPokemonPayload, result);
  if (officialVariants.length <= 0) {
    throw new Error("Aucun sprite officiel telecharge. Reinstallation annulee.");
  }

  pokemon.payload.sprite_variants = [...officialVariants, ...customVariants];
  if (!pokemon.payload.sprites || typeof pokemon.payload.sprites !== "object") {
    pokemon.payload.sprites = {};
  }

  const defaultVariantId = buildDefaultVariantId(pokemon.payload.sprite_variants, previousDefaultVariantId);
  result.default_variant_id = defaultVariantId;
  pokemon.payload.default_sprite_variant_id = defaultVariantId;
  const defaultVariant = pokemon.payload.sprite_variants.find(
    (variant) =>
      normalizeVariantId(variant?.id || variant?.game_key || "") === normalizeVariantId(defaultVariantId || "")
  );
  if (defaultVariant) {
    pokemon.payload.sprites.front = defaultVariant.front || pokemon.payload.sprites.front || "";
    pokemon.payload.sprites.front_shiny = defaultVariant.front_shiny || pokemon.payload.sprites.front_shiny || null;
  }

  const refsAfter = getAllReferencedSpritePaths(pokemon.payload);
  const deleteCandidates = cleanupRemovedSpriteFileCandidates(pokemon.folderPath, refsBefore, refsAfter);
  for (const absPath of deleteCandidates) {
    try {
      await fsp.unlink(absPath);
      result.deleted_files.push(absPath);
    } catch {
      // ignore missing files on cleanup
    }
  }

  await writeJsonFile(pokemon.jsonPath, pokemon.payload);
  result.official_variants = officialVariants.length;
  return result;
}

function sha256Hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function decodeHtmlEntities(input) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return String(input || "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _match;
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _match;
    }
    return named[entity] ?? _match;
  });
}

function stripHtmlTags(input) {
  return decodeHtmlEntities(String(input || "").replace(/<[^>]+>/g, " "));
}

function normalizeSourceUrl(rawValue) {
  try {
    const parsed = new URL(String(rawValue || ""));
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return String(rawValue || "").trim();
  }
}

function extractHttpUrls(rawValue) {
  const text = String(rawValue || "");
  const out = [];
  const regex = /https?:\/\/[^\s]*?(?=https?:\/\/|\s|$)/gi;
  for (const match of text.match(regex) || []) {
    const candidate = String(match || "")
      .trim()
      .replace(/[)\],;]+$/g, "");
    if (!candidate) {
      continue;
    }
    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        continue;
      }
      out.push(parsed.toString());
    } catch {
      // ignore invalid candidate
    }
  }
  return out;
}

function extractFusionDexCode(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const match = parsed.pathname.match(/\/dn\/pif\/([a-z0-9]+)\.(png|gif|webp|jpg|jpeg)$/i);
    if (!match) {
      return "";
    }
    return match[1].toLowerCase();
  } catch {
    return "";
  }
}

function extractFusionDexSpritePageCode(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!FUSIONDEX_SITE_HOSTS.has(parsed.hostname.toLowerCase())) {
      return "";
    }
    const match = parsed.pathname.match(/^\/sprite\/pif\/([a-z0-9]+)\/?$/i);
    if (!match) {
      return "";
    }
    return String(match[1] || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

function parseArtistsLabel(artistsHtml) {
  const plain = stripHtmlTags(artistsHtml).trim().replace(/\s+/g, " ");
  if (plain) {
    return plain;
  }
  const names = [];
  for (const anchorMatch of String(artistsHtml || "").matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) {
    const name = stripHtmlTags(anchorMatch[1]).trim();
    if (name) {
      names.push(name);
    }
  }
  if (names.length > 0) {
    return names.join(" and ");
  }
  const fallback = stripHtmlTags(artistsHtml).trim().replace(/\s+/g, " ");
  return fallback || "unknown";
}

function findFusionDexSpriteArticleByCode(pageHtml, spriteCode) {
  const target = String(spriteCode || "").trim().toLowerCase();
  if (!target) {
    return "";
  }
  const articleRegex = /<article class="sprite-preview[\s\S]*?<\/article>/gi;
  for (const article of pageHtml.match(articleRegex) || []) {
    const spriteIdMatch = article.match(/<span class=["']sprite-id["']>\s*#([^<]+)<\/span>/i);
    if (!spriteIdMatch) {
      continue;
    }
    const currentCode = String(spriteIdMatch[1] || "").trim().toLowerCase();
    if (currentCode === target) {
      return article;
    }
  }
  return "";
}

function parseFusionDexSpritePageDetails(pageHtml, pageUrl, spriteCode = "") {
  const articleForCode = findFusionDexSpriteArticleByCode(pageHtml, spriteCode);
  let imageUrl = "";
  if (articleForCode) {
    const imageMatch = articleForCode.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imageMatch) {
      imageUrl = String(imageMatch[1] || "").trim();
    }
  }
  const metaImageMatch = pageHtml.match(
    /<meta[^>]+(?:name|property)=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  if (!imageUrl && metaImageMatch) {
    imageUrl = String(metaImageMatch[1] || "").trim();
  }
  if (!imageUrl) {
    const articleImageMatch = pageHtml.match(
      /<article class="sprite-preview[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>/i
    );
    if (articleImageMatch) {
      imageUrl = String(articleImageMatch[1] || "").trim();
    }
  }
  if (!imageUrl) {
    const fallbackImageMatch = pageHtml.match(
      /https?:\/\/cdn\.fusiondex\.org\/[^"'\s]+\/dn\/pif\/[a-z0-9]+\.(?:png|gif|webp|jpg|jpeg)/i
    );
    if (fallbackImageMatch) {
      imageUrl = String(fallbackImageMatch[0] || "").trim();
    }
  }
  if (imageUrl) {
    try {
      imageUrl = new URL(imageUrl, pageUrl).toString();
    } catch {
      imageUrl = "";
    }
  }

  let author = "unknown";
  const artistsMatch = articleForCode
    ? articleForCode.match(/<span class=["']artists["']>([\s\S]*?)<\/span>/i)
    : pageHtml.match(/<span class=["']artists["']>([\s\S]*?)<\/span>/i);
  if (artistsMatch) {
    author = parseArtistsLabel(artistsMatch[1]);
  } else {
    const descMatch = pageHtml.match(
      /<meta[^>]+(?:name|property)=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
    );
    if (descMatch) {
      const plain = decodeHtmlEntities(String(descMatch[1] || ""));
      const byMatch = plain.match(/sprite by ([^.]+)\.?/i);
      if (byMatch) {
        author = String(byMatch[1] || "").trim() || "unknown";
      }
    }
  }

  return { imageUrl, author };
}

async function resolveSpriteInput(rawUrl) {
  const parsed = new URL(rawUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("protocole_non_supporte");
  }

  const spritePageCode = extractFusionDexSpritePageCode(rawUrl);
  if (spritePageCode) {
    const response = await fetch(parsed.toString(), {
      headers: {
        "user-agent": "pokeidle-custom-skin-tool/1.0",
        accept: "text/html,*/*",
      },
    });
    if (!response.ok) {
      throw new Error(`sprite_page_http_${response.status}`);
    }
    const html = await response.text();
    const details = parseFusionDexSpritePageDetails(html, parsed.toString(), spritePageCode);
    if (!details.imageUrl) {
      throw new Error("sprite_page_image_introuvable");
    }
    return {
      source_url: normalizeSourceUrl(rawUrl),
      download_url: normalizeSourceUrl(details.imageUrl),
      author_hint: details.author || "unknown",
      fusiondex_code: spritePageCode,
    };
  }

  return {
    source_url: normalizeSourceUrl(rawUrl),
    download_url: parsed.toString(),
    author_hint: "",
    fusiondex_code: extractFusionDexCode(rawUrl),
  };
}

function parseFusionDexAuthorMap(pageHtml, pageUrl = "") {
  const byUrl = new Map();
  const byCode = new Map();
  const entries = [];
  const articleRegex = /<article class="sprite-preview[\s\S]*?<\/article>/gi;
  for (const article of pageHtml.match(articleRegex) || []) {
    const imageMatch = article.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
    const artistsMatch = article.match(/<span class="artists">([\s\S]*?)<\/span>/i);
    const spriteIdMatch = article.match(/<span class="sprite-id">\s*#([^<]+)<\/span>/i);
    if (!imageMatch) {
      continue;
    }

    const rawImageUrl = String(imageMatch[1] || "").trim();
    if (!rawImageUrl) {
      continue;
    }

    let absoluteImageUrl = rawImageUrl;
    try {
      absoluteImageUrl = new URL(rawImageUrl, pageUrl || undefined).toString();
    } catch {
      absoluteImageUrl = rawImageUrl;
    }
    const normalizedUrl = normalizeSourceUrl(absoluteImageUrl);
    const authorLabel = artistsMatch ? parseArtistsLabel(artistsMatch[1]) : "unknown";
    if (authorLabel && authorLabel !== "unknown") {
      byUrl.set(normalizedUrl, authorLabel);
    }

    let spriteCode = "";
    if (spriteIdMatch) {
      spriteCode = String(spriteIdMatch[1] || "")
        .trim()
        .toLowerCase();
    }
    if (!spriteCode) {
      spriteCode = extractFusionDexCode(normalizedUrl);
    }
    if (spriteCode) {
      if (authorLabel && authorLabel !== "unknown") {
        byCode.set(spriteCode, authorLabel);
      }
      entries.push({
        code: spriteCode,
        author: authorLabel || "unknown",
        source_url: normalizeSourceUrl(`https://www.fusiondex.org/sprite/pif/${encodeURIComponent(spriteCode)}/`),
        download_url: normalizedUrl,
      });
    }
  }
  return { byUrl, byCode, entries };
}

async function resolveSpriteAuthor(rawUrl, pokemonNameEn) {
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return "unknown";
  }
  if (parsedUrl.hostname !== FUSIONDEX_CDN_HOST) {
    return "unknown";
  }
  const normalizedUrl = normalizeSourceUrl(rawUrl);
  const spriteCode = extractFusionDexCode(rawUrl);
  const authorMap = await ensureFusionDexAuthorMap(pokemonNameEn);
  if (authorMap?.byUrl.has(normalizedUrl)) {
    return authorMap.byUrl.get(normalizedUrl);
  }
  if (spriteCode && authorMap?.byCode.has(spriteCode)) {
    return authorMap.byCode.get(spriteCode);
  }
  return "unknown";
}

async function ensureFusionDexAuthorMap(pokemonNameEn) {
  const normalizedPokemonName = sanitizeToken(pokemonNameEn, "");
  if (!normalizedPokemonName) {
    return { byUrl: new Map(), byCode: new Map(), entries: [] };
  }

  if (!fusionDexAuthorCache.has(normalizedPokemonName)) {
    const pageUrl = `https://www.fusiondex.org/${encodeURIComponent(normalizedPokemonName)}/`;
    const response = await fetch(pageUrl, {
      headers: {
        "user-agent": "pokeidle-custom-skin-tool/1.0",
        accept: "text/html,*/*",
      },
    });
    if (!response.ok) {
      fusionDexAuthorCache.set(normalizedPokemonName, { byUrl: new Map(), byCode: new Map(), entries: [] });
    } else {
      const html = await response.text();
      fusionDexAuthorCache.set(normalizedPokemonName, parseFusionDexAuthorMap(html, pageUrl));
    }
  }
  return fusionDexAuthorCache.get(normalizedPokemonName) || { byUrl: new Map(), byCode: new Map(), entries: [] };
}

async function resolveFusionDexAuthorByCode(pokemonNameEn, spriteCode) {
  const normalizedCode = String(spriteCode || "").trim().toLowerCase();
  if (!normalizedCode) {
    return "unknown";
  }
  const authorMap = await ensureFusionDexAuthorMap(pokemonNameEn);
  return authorMap?.byCode.get(normalizedCode) || "unknown";
}

async function refreshStoredFusionDexAuthors(pokemon) {
  const variants = Array.isArray(pokemon?.payload?.sprite_variants) ? pokemon.payload.sprite_variants : [];
  if (variants.length <= 0) {
    return false;
  }

  let changed = false;
  const pokemonNameEn = String(pokemon?.payload?.name_en || "");
  for (const variant of variants) {
    if (!variant || typeof variant !== "object") {
      continue;
    }
    const sourceUrl = String(variant.source_url || "").trim();
    const spriteCode = extractFusionDexSpritePageCode(sourceUrl);
    if (!spriteCode) {
      continue;
    }
    try {
      const expectedAuthor = await resolveFusionDexAuthorByCode(pokemonNameEn, spriteCode);
      if (!expectedAuthor || expectedAuthor === "unknown") {
        continue;
      }
      const currentAuthor = String(variant.author || "").trim();
      if (currentAuthor !== expectedAuthor) {
        variant.author = expectedAuthor;
        changed = true;
      }
    } catch {
      // ignore remote resolution failures
    }
  }

  if (changed) {
    await writeJsonFile(pokemon.jsonPath, pokemon.payload);
  }
  return changed;
}

async function readJsonFile(jsonPath) {
  const raw = await fsp.readFile(jsonPath, "utf8");
  return JSON.parse(raw);
}

async function writeJsonFile(jsonPath, payload) {
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  await fsp.writeFile(jsonPath, serialized, "utf8");
}

async function resolvePokemonById(pokemonId) {
  const normalizedId = Number.parseInt(String(pokemonId || ""), 10);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("pokemon_id invalide");
  }

  const entries = await fsp.readdir(POKEMON_DATA_DIR, { withFileTypes: true });
  const prefix = `${normalizedId}_`;
  const matches = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix));
  if (matches.length <= 0) {
    throw new Error(`Aucun dossier trouvé pour le Pokémon #${normalizedId}`);
  }
  if (matches.length > 1) {
    throw new Error(`Plusieurs dossiers trouvés pour le Pokémon #${normalizedId}`);
  }

  const folderName = matches[0].name;
  const folderPath = path.join(POKEMON_DATA_DIR, folderName);
  const jsonPath = path.join(folderPath, `${folderName}_data.json`);
  const spriteDir = path.join(folderPath, "sprites");
  const payload = await readJsonFile(jsonPath);
  if (!Array.isArray(payload.sprite_variants)) {
    payload.sprite_variants = [];
  }

  return {
    pokemonId: normalizedId,
    folderName,
    folderPath,
    jsonPath,
    spriteDir,
    payload,
  };
}

async function collectSpriteHashes(spriteDir) {
  const hashes = new Map();
  try {
    const entries = await fsp.readdir(spriteDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!SPRITE_EXTENSIONS.has(ext)) {
        continue;
      }
      const filePath = path.join(spriteDir, entry.name);
      const content = await fsp.readFile(filePath);
      hashes.set(sha256Hex(content), filePath);
    }
  } catch {
    // no-op: missing sprite dir
  }
  return hashes;
}

function getAllReferencedSpritePaths(payload) {
  const refs = new Set();
  const pushIfString = (value) => {
    if (typeof value === "string" && value.trim()) {
      refs.add(value.trim());
    }
  };
  if (payload.sprites && typeof payload.sprites === "object") {
    pushIfString(payload.sprites.front);
    pushIfString(payload.sprites.front_shiny);
  }
  if (Array.isArray(payload.sprite_variants)) {
    for (const variant of payload.sprite_variants) {
      if (!variant || typeof variant !== "object") {
        continue;
      }
      pushIfString(variant.front);
      pushIfString(variant.front_shiny);
    }
  }
  return refs;
}

function buildUniqueVariantId(existingIds, baseId) {
  let candidate = baseId;
  let suffix = 2;
  while (existingIds.has(normalizeVariantId(candidate))) {
    candidate = `${baseId}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function toUiSpriteUrl(pokemon, spriteRef) {
  const raw = String(spriteRef || "").trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return toUrlPath("pokemon_data", pokemon.folderName, ...raw.split("/"));
}

function listSpriteVariantsForUi(pokemon) {
  const variants = Array.isArray(pokemon.payload.sprite_variants) ? pokemon.payload.sprite_variants : [];
  return variants
    .map((variant) => {
      const front = String(variant.front || "");
      const frontUrl = toUiSpriteUrl(pokemon, front);
      const frontShiny = String(variant.front_shiny || "");
      const frontShinyUrl = toUiSpriteUrl(pokemon, frontShiny);
      const custom = isCustomVariant(variant);
      const normalizedId = String(variant.id || variant.game_key || "").trim();
      return {
        id: normalizedId,
        delete_key: normalizedId,
        custom,
        kind: custom ? "custom" : "official",
        label_fr: String(variant.label_fr || ""),
        game_key: String(variant.game_key || ""),
        front,
        front_url: frontUrl,
        front_shiny: frontShiny,
        front_shiny_url: frontShinyUrl,
        author: String(variant.author || "unknown"),
        source_url: String(variant.source_url || ""),
        added_at: String(variant.added_at || ""),
      };
    });
}

function normalizeResolvedCustomSpriteInput(rawInput) {
  const sourceUrl = normalizeSourceUrl(rawInput?.source_url || rawInput?.download_url || "");
  const downloadUrl = normalizeSourceUrl(rawInput?.download_url || "");
  const authorHint = String(rawInput?.author_hint || "").trim();
  const fusionDexCode = String(
    rawInput?.fusiondex_code || extractFusionDexCode(downloadUrl) || extractFusionDexSpritePageCode(sourceUrl) || ""
  )
    .trim()
    .toLowerCase();
  return {
    source_url: sourceUrl || downloadUrl,
    download_url: downloadUrl,
    author_hint: authorHint,
    fusiondex_code: fusionDexCode,
  };
}

function dedupeResolvedCustomSpriteInputs(resolvedInputs) {
  const deduped = [];
  const seen = new Set();
  for (const rawInput of resolvedInputs || []) {
    const normalized = normalizeResolvedCustomSpriteInput(rawInput);
    const key = normalizeSourceUrl(normalized.source_url || normalized.download_url || "");
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(normalized);
  }
  return deduped;
}

async function addCustomSpritesFromResolvedInputs(pokemon, resolvedInputs) {
  await fsp.mkdir(pokemon.spriteDir, { recursive: true });

  const queue = dedupeResolvedCustomSpriteInputs(resolvedInputs);
  const existingHashes = await collectSpriteHashes(pokemon.spriteDir);
  const variants = Array.isArray(pokemon.payload.sprite_variants) ? pokemon.payload.sprite_variants : [];
  const existingIds = new Set(variants.map((variant) => normalizeVariantId(variant?.id || variant?.game_key || "")));
  const existingSourceUrls = new Set(
    variants.map((variant) => normalizeSourceUrl(variant?.source_url || "")).filter((value) => Boolean(value))
  );

  const added = [];
  const skipped = [];
  const errors = [];

  for (const resolvedInput of queue) {
    const sourceUrl = normalizeSourceUrl(resolvedInput.source_url || resolvedInput.download_url || "");
    const downloadUrl = normalizeSourceUrl(resolvedInput.download_url || "");
    const reportUrl = sourceUrl || downloadUrl || "";

    try {
      if (!downloadUrl) {
        errors.push({ url: reportUrl, reason: "download_url_invalide" });
        continue;
      }
      if (sourceUrl && existingSourceUrls.has(sourceUrl)) {
        skipped.push({
          url: sourceUrl,
          reason: "source_deja_presente",
        });
        continue;
      }

      const parsed = new URL(downloadUrl);

      const response = await fetch(parsed.toString(), {
        headers: {
          "user-agent": "pokeidle-custom-skin-tool/1.0",
          accept: "image/*,*/*",
        },
      });
      if (!response.ok) {
        errors.push({ url: rawUrl, reason: `http_${response.status}` });
        continue;
      }

      const contentType = String(response.headers.get("content-type") || "");
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength <= 0) {
        errors.push({ url: rawUrl, reason: "fichier_vide" });
        continue;
      }

      const hash = sha256Hex(buffer);
      if (existingHashes.has(hash)) {
        skipped.push({
          url: sourceUrl,
          reason: "doublon_hash",
          matched_file: path.basename(existingHashes.get(hash)),
        });
        continue;
      }

      const fusionDexCode =
        resolvedInput.fusiondex_code || extractFusionDexCode(downloadUrl) || extractFusionDexSpritePageCode(sourceUrl);
      const fileStemFromUrl = sanitizeToken(path.basename(parsed.pathname, path.extname(parsed.pathname)), "sprite");
      const token = sanitizeToken(fusionDexCode || fileStemFromUrl || hash.slice(0, 8), hash.slice(0, 8));
      const baseVariantId = `custom_${token}`;
      const variantId = buildUniqueVariantId(existingIds, baseVariantId);
      existingIds.add(normalizeVariantId(variantId));

      const ext = inferExtensionFromContentType(contentType) || inferExtensionFromUrl(downloadUrl) || ".png";
      const pokemonNameToken = sanitizeToken(pokemon.payload.name_en || pokemon.folderName, "pokemon");
      const customToken = sanitizeToken(variantId.replace(/^custom_/, ""), hash.slice(0, 8));
      const fileName = `${pokemon.pokemonId}_${pokemonNameToken}_custom_${customToken}${ext}`;
      const filePath = path.join(pokemon.spriteDir, fileName);
      await fsp.writeFile(filePath, buffer);
      existingHashes.set(hash, filePath);

      let author = String(resolvedInput.author_hint || "").trim();
      if (!author || author.toLowerCase() === "unknown") {
        author = await resolveSpriteAuthor(downloadUrl, pokemon.payload.name_en || pokemonNameToken);
      }
      const variant = {
        id: variantId,
        label_fr: `Custom (${customToken})`,
        generation: 0,
        game_key: variantId.replaceAll("_", "-"),
        front: `sprites/${fileName}`.replaceAll("\\", "/"),
        front_shiny: null,
        author,
        source_url: sourceUrl,
        source_image_url: downloadUrl,
        added_at: new Date().toISOString(),
      };
      variants.push(variant);
      if (sourceUrl) {
        existingSourceUrls.add(sourceUrl);
      }

      added.push({
        id: variant.id,
        front: variant.front,
        author: variant.author,
        source_url: variant.source_url,
      });
    } catch (error) {
      errors.push({ url: reportUrl, reason: toErrorReason(error) });
    }
  }

  pokemon.payload.sprite_variants = variants;
  if (added.length > 0) {
    await writeJsonFile(pokemon.jsonPath, pokemon.payload);
  }

  return { added, skipped, errors };
}

async function addCustomSprites(pokemon, urls) {
  const urlQueue = [];
  const seenUrls = new Set();
  for (const rawChunk of urls) {
    for (const extractedUrl of extractHttpUrls(rawChunk)) {
      const normalized = normalizeSourceUrl(extractedUrl);
      if (seenUrls.has(normalized)) {
        continue;
      }
      seenUrls.add(normalized);
      urlQueue.push(extractedUrl);
    }
  }

  const resolvedInputs = [];
  const resolutionErrors = [];
  for (const rawUrl of urlQueue) {
    try {
      resolvedInputs.push(await resolveSpriteInput(rawUrl));
    } catch (error) {
      resolutionErrors.push({ url: rawUrl, reason: toErrorReason(error) });
    }
  }

  const result = await addCustomSpritesFromResolvedInputs(pokemon, resolvedInputs);
  return {
    ...result,
    errors: [...resolutionErrors, ...result.errors],
  };
}

async function addAllFusionDexCustomSprites(pokemon, options = {}) {
  const pokemonNameEn = String(pokemon?.payload?.name_en || pokemon?.folderName || "");
  const authorMap = await ensureFusionDexAuthorMap(pokemonNameEn);
  const entries = Array.isArray(authorMap?.entries) ? authorMap.entries : [];

  const resolvedInputs = [];
  const excluded = [];
  const seenSources = new Set();
  for (const entry of entries) {
    const code = String(entry?.code || "")
      .trim()
      .toLowerCase();
    const sourceUrl = normalizeSourceUrl(
      entry?.source_url || (code ? `https://www.fusiondex.org/sprite/pif/${encodeURIComponent(code)}/` : "")
    );
    const downloadUrl = normalizeSourceUrl(entry?.download_url || "");
    if (!downloadUrl) {
      continue;
    }
    const uniqueKey = sourceUrl || downloadUrl;
    if (!uniqueKey || seenSources.has(uniqueKey)) {
      continue;
    }

    const authorLabel = String(entry?.author || "unknown");
    const normalizedAuthorLabel = normalizeAuthorLabel(authorLabel);
    if (BULK_CUSTOM_EXCLUDED_AUTHORS.has(normalizedAuthorLabel)) {
      excluded.push({
        code,
        author: authorLabel,
        source_url: sourceUrl || downloadUrl,
      });
      continue;
    }

    seenSources.add(uniqueKey);
    resolvedInputs.push({
      source_url: sourceUrl || downloadUrl,
      download_url: downloadUrl,
      author_hint: authorLabel,
      fusiondex_code: code || extractFusionDexCode(downloadUrl),
    });
  }

  const parsedLimit = Number.parseInt(String(options?.limit ?? ""), 10);
  const queue =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? resolvedInputs.slice(0, parsedLimit) : resolvedInputs;
  if (queue.length <= 0) {
    throw new Error("Aucun custom FusionDex trouve pour ce Pokemon.");
  }

  const result = await addCustomSpritesFromResolvedInputs(pokemon, queue);
  return {
    ...result,
    total_found: entries.length,
    total_available: resolvedInputs.length,
    attempted: queue.length,
    excluded_count: excluded.length,
    excluded,
  };
}

async function deleteCustomSprite(pokemon, rawVariantId) {
  const targetId = normalizeVariantId(rawVariantId);
  if (!targetId) {
    throw new Error("variant_id invalide");
  }

  const variants = Array.isArray(pokemon.payload.sprite_variants) ? pokemon.payload.sprite_variants : [];
  const index = variants.findIndex((variant) => {
    const byId = normalizeVariantId(variant?.id);
    const byGameKey = normalizeVariantId(variant?.game_key);
    return targetId === byId || targetId === byGameKey;
  });
  if (index < 0) {
    throw new Error("variant_introuvable");
  }

  const [removed] = variants.splice(index, 1);
  pokemon.payload.sprite_variants = variants;

  const normalizedDefault = normalizeVariantId(pokemon.payload.default_sprite_variant_id || "");
  if (normalizedDefault && normalizedDefault === targetId) {
    const fallback = variants.find((variant) => normalizeVariantId(variant?.id || variant?.game_key || ""));
    pokemon.payload.default_sprite_variant_id = fallback
      ? String(fallback.id || fallback.game_key || "")
      : "";
  }

  const refsAfterDelete = getAllReferencedSpritePaths(pokemon.payload);
  const deletedFiles = [];
  for (const fieldName of ["front", "front_shiny"]) {
    const relPath = String(removed?.[fieldName] || "").trim();
    if (!relPath || /^https?:\/\//i.test(relPath)) {
      continue;
    }
    if (refsAfterDelete.has(relPath)) {
      continue;
    }
    const absPath = path.resolve(pokemon.folderPath, relPath);
    if (!absPath.startsWith(path.resolve(pokemon.folderPath))) {
      continue;
    }
    try {
      await fsp.unlink(absPath);
      deletedFiles.push(absPath);
    } catch {
      // ignore filesystem errors on cleanup
    }
  }

  await writeJsonFile(pokemon.jsonPath, pokemon.payload);
  return { removed, deleted_files: deletedFiles };
}

async function parseJsonBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error("payload_too_large");
    }
    chunks.push(chunk);
  }
  if (chunks.length <= 0) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function resolveSafePath(rootDir, requestPathname) {
  const root = path.resolve(rootDir);
  const rel = decodeURIComponent(requestPathname).replace(/^\/+/, "");
  const abs = path.resolve(root, rel);
  if (abs === root || abs.startsWith(`${root}${path.sep}`)) {
    return abs;
  }
  return "";
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js" || ext === ".mjs") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function serveFile(response, filePath) {
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": guessContentType(filePath),
      "Content-Length": stat.size,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(response);
  } catch {
    sendText(response, 404, "Not found");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const parsedUrl = new URL(request.url || "/", `http://${request.headers.host || `${HOST}:${PORT}`}`);
    const { pathname } = parsedUrl;
    const method = request.method || "GET";

    if (method === "GET" && pathname === "/") {
      await serveFile(response, UI_INDEX_PATH);
      return;
    }

    const getPokemonMatch = pathname.match(/^\/api\/pokemon\/(\d+)$/);
    if (method === "GET" && getPokemonMatch) {
      const pokemon = await resolvePokemonById(getPokemonMatch[1]);
      await refreshStoredFusionDexAuthors(pokemon);
      const spriteVariants = listSpriteVariantsForUi(pokemon);
      sendJson(response, 200, {
        pokemon: {
          id: pokemon.pokemonId,
          name_fr: String(pokemon.payload.name_fr || ""),
          name_en: String(pokemon.payload.name_en || ""),
          folder: pokemon.folderName,
          json_path: path.relative(ROOT_DIR, pokemon.jsonPath).replaceAll("\\", "/"),
          sprite_variant_count: spriteVariants.length,
          custom_sprite_count: spriteVariants.filter((variant) => variant.custom).length,
        },
        sprite_variants: spriteVariants,
        custom_sprites: spriteVariants.filter((variant) => variant.custom),
      });
      return;
    }

    const addSpritesMatch = pathname.match(/^\/api\/pokemon\/(\d+)\/custom-sprites$/);
    if (method === "POST" && addSpritesMatch) {
      const body = await parseJsonBody(request);
      const urls = Array.isArray(body?.urls) ? body.urls : [];
      if (urls.length <= 0) {
        sendJson(response, 400, { error: "Aucune URL fournie" });
        return;
      }

      const pokemon = await resolvePokemonById(addSpritesMatch[1]);
      const result = await addCustomSprites(pokemon, urls);
      const spriteVariants = listSpriteVariantsForUi(pokemon);
      sendJson(response, 200, {
        pokemon: {
          id: pokemon.pokemonId,
          name_fr: String(pokemon.payload.name_fr || ""),
          name_en: String(pokemon.payload.name_en || ""),
          folder: pokemon.folderName,
        },
        result,
        sprite_variants: spriteVariants,
        custom_sprites: spriteVariants.filter((variant) => variant.custom),
      });
      return;
    }

    const addAllCustomMatch = pathname.match(/^\/api\/pokemon\/(\d+)\/custom-sprites\/all$/);
    if (method === "POST" && addAllCustomMatch) {
      const body = await parseJsonBody(request);
      const pokemon = await resolvePokemonById(addAllCustomMatch[1]);
      const result = await addAllFusionDexCustomSprites(pokemon, {
        limit: body?.limit,
      });
      const spriteVariants = listSpriteVariantsForUi(pokemon);
      sendJson(response, 200, {
        pokemon: {
          id: pokemon.pokemonId,
          name_fr: String(pokemon.payload.name_fr || ""),
          name_en: String(pokemon.payload.name_en || ""),
          folder: pokemon.folderName,
          sprite_variant_count: spriteVariants.length,
          custom_sprite_count: spriteVariants.filter((variant) => variant.custom).length,
        },
        result,
        sprite_variants: spriteVariants,
        custom_sprites: spriteVariants.filter((variant) => variant.custom),
      });
      return;
    }

    const reinstallOfficialMatch = pathname.match(/^\/api\/pokemon\/(\d+)\/reinstall-official-sprites$/);
    if (method === "POST" && reinstallOfficialMatch) {
      const pokemon = await resolvePokemonById(reinstallOfficialMatch[1]);
      const result = await reinstallOfficialSprites(pokemon);
      const spriteVariants = listSpriteVariantsForUi(pokemon);
      sendJson(response, 200, {
        pokemon: {
          id: pokemon.pokemonId,
          name_fr: String(pokemon.payload.name_fr || ""),
          name_en: String(pokemon.payload.name_en || ""),
          folder: pokemon.folderName,
          sprite_variant_count: spriteVariants.length,
          custom_sprite_count: spriteVariants.filter((variant) => variant.custom).length,
        },
        result,
        sprite_variants: spriteVariants,
        custom_sprites: spriteVariants.filter((variant) => variant.custom),
      });
      return;
    }

    const deleteMatch = pathname.match(/^\/api\/pokemon\/(\d+)\/(?:custom-sprites|sprite-variants)\/([^/]+)$/);
    if (method === "DELETE" && deleteMatch) {
      const pokemon = await resolvePokemonById(deleteMatch[1]);
      const variantId = decodeURIComponent(deleteMatch[2]);
      const result = await deleteCustomSprite(pokemon, variantId);
      const spriteVariants = listSpriteVariantsForUi(pokemon);
      sendJson(response, 200, {
        pokemon: {
          id: pokemon.pokemonId,
          name_fr: String(pokemon.payload.name_fr || ""),
          name_en: String(pokemon.payload.name_en || ""),
        },
        result,
        sprite_variants: spriteVariants,
        custom_sprites: spriteVariants.filter((variant) => variant.custom),
      });
      return;
    }

    if (method === "GET" && pathname.startsWith("/pokemon_data/")) {
      const safePath = resolveSafePath(ROOT_DIR, pathname);
      if (!safePath) {
        sendText(response, 403, "Forbidden");
        return;
      }
      await serveFile(response, safePath);
      return;
    }

    sendText(response, 404, "Not found");
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "unexpected_error",
    });
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`[custom-skin-tool] server started on ${url}`);
  console.log(`[custom-skin-tool] pokemon_data root: ${POKEMON_DATA_DIR}`);
});
