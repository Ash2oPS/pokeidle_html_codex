#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { parseCsvMethods, parseCsvObjects, readCsvCell, validateDialoguePayload } from "../lib/runtime-data.js";

const HOST = process.env.DATA_STUDIO_HOST || "127.0.0.1";
const PORT = Number(process.env.DATA_STUDIO_PORT || 4877);
const ROOT_DIR = path.resolve(process.cwd());
const ROUTE_UI_INDEX_PATH = path.join(ROOT_DIR, "tools", "route-encounter-studio", "index.html");
const DIALOGUE_UI_INDEX_PATH = path.join(ROOT_DIR, "tools", "dialogue-studio", "index.html");
const TALENT_UI_INDEX_PATH = path.join(ROOT_DIR, "tools", "talents-studio", "index.html");
const MAP_DATA_DIR = path.resolve(process.env.DATA_STUDIO_MAP_DATA_DIR || path.join(ROOT_DIR, "map_data"));
const DIALOGUE_DATA_DIR = path.join(MAP_DATA_DIR, "dialogues");
const ROUTE_CSV_PATH = path.resolve(
  process.env.DATA_STUDIO_ROUTE_CSV || path.join(ROOT_DIR, "map_data", "kanto_zone_encounters.csv"),
);
const TALENTS_CSV_PATH = path.resolve(
  process.env.DATA_STUDIO_TALENTS_CSV || path.join(ROOT_DIR, "pokemon_data", "pokemon_talents.csv"),
);
const POKEMON_DATA_DIR = path.join(ROOT_DIR, "pokemon_data");
const BACKUP_DIR = path.resolve(process.env.DATA_STUDIO_BACKUP_DIR || path.join(ROOT_DIR, "output", "tool-backups"));
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const REGION_ORDER = Object.freeze(["kanto", "johto", "hoenn", "other"]);
const REGION_LABEL_BY_ID = Object.freeze({
  kanto: "Kanto",
  johto: "Johto",
  hoenn: "Hoenn",
  other: "Autre",
});
const ROUTE_HEADERS = Object.freeze([
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
]);
const TALENT_HEADERS = Object.freeze([
  "pokemon_id",
  "pokemon_name_fr",
  "pokemon_name_en",
  "talent_id",
  "talent_name_fr",
  "talent_name_en",
  "talent_description_fr",
  "commentaire",
]);
const BASE_METHODS = Object.freeze([
  "walk",
  "surf",
  "old-rod",
  "good-rod",
  "super-rod",
  "gift",
  "only-one",
  "pokeflute",
  "rock-smash",
]);
const ZONE_TYPES = new Set(["route", "town", "city", "dungeon", "cave", "forest"]);
const UTF8_BOM = "\uFEFF";
const DEFAULT_UNLOCK_DEFEATS_REQUIRED = 20;
const DEFAULT_UNLOCK_TIMER_MS = 20000;
const DEFAULT_ACCESS_RULES = Object.freeze({
  requires_flags_all: [],
  requires_flags_any: [],
  blocked_reason_fr: "",
});
const STATIC_MIME_BY_EXT = Object.freeze({
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
});

function sendJson(response, statusCode, payload) {
  const serialized = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(serialized),
    "Cache-Control": "no-store",
  });
  response.end(serialized);
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(String(html || ""));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(String(text || ""));
}

async function sendFile(response, filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  const mimeType = STATIC_MIME_BY_EXT[ext] || "application/octet-stream";
  const content = await fsp.readFile(filePath);
  response.writeHead(200, {
    "Content-Type": mimeType,
    "Content-Length": content.length,
    "Cache-Control": "no-store",
  });
  response.end(content);
}

function sanitizeText(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function sanitizeStringList(valueRaw) {
  const source = Array.isArray(valueRaw)
    ? valueRaw
    : typeof valueRaw === "string"
      ? valueRaw.split(/[\n,;]+/g)
      : [];
  const seen = new Set();
  const values = [];
  for (const entry of source) {
    const normalized = sanitizeText(entry);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    values.push(normalized);
  }
  return values;
}

function clampPercent(valueRaw, fallback = 50) {
  const numeric = Number(valueRaw);
  if (!Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, Number(fallback) || 50));
  }
  return Math.max(0, Math.min(100, Math.round(numeric * 100) / 100));
}

function normalizeAccessRulesPayload(valueRaw, fallback = DEFAULT_ACCESS_RULES) {
  const base = valueRaw && typeof valueRaw === "object" ? valueRaw : {};
  const previous = fallback && typeof fallback === "object" ? fallback : DEFAULT_ACCESS_RULES;
  return {
    requires_flags_all: sanitizeStringList(base.requires_flags_all ?? previous.requires_flags_all),
    requires_flags_any: sanitizeStringList(base.requires_flags_any ?? previous.requires_flags_any),
    blocked_reason_fr: sanitizeText(base.blocked_reason_fr, sanitizeText(previous.blocked_reason_fr)),
  };
}

function normalizeZoneActionPayload(valueRaw, fallback = null, options = {}) {
  const base = valueRaw && typeof valueRaw === "object" ? valueRaw : {};
  const previous = fallback && typeof fallback === "object" ? fallback : {};
  const strict = options.strict === true;
  const actionId = sanitizeText(base.action_id, sanitizeText(previous.action_id));
  const requestedKind = sanitizeText(base.kind, sanitizeText(previous.kind, "dialogue")).toLowerCase();
  const kind = requestedKind === "trainer_battle" ? "trainer_battle" : "dialogue";
  const dialogueId = sanitizeText(base.dialogue_id, sanitizeText(previous.dialogue_id));
  const trainerBattleId = sanitizeText(base.trainer_battle_id, sanitizeText(previous.trainer_battle_id));
  const targetId = kind === "trainer_battle" ? trainerBattleId : dialogueId;
  if (!actionId || !targetId) {
    if (strict) {
      throw new Error("Chaque action de zone doit avoir un action_id et sa cible (dialogue_id ou trainer_battle_id).");
    }
    return null;
  }
  return {
    action_id: actionId,
    label_fr: sanitizeText(base.label_fr, sanitizeText(previous.label_fr, targetId)),
    kind,
    dialogue_id: kind === "dialogue" ? dialogueId : "",
    trainer_battle_id: kind === "trainer_battle" ? trainerBattleId : "",
    desktop_anchor_pct: {
      x: clampPercent(base?.desktop_anchor_pct?.x, previous?.desktop_anchor_pct?.x ?? 50),
      y: clampPercent(base?.desktop_anchor_pct?.y, previous?.desktop_anchor_pct?.y ?? 50),
    },
    mobile_anchor_pct: {
      x: clampPercent(base?.mobile_anchor_pct?.x, previous?.mobile_anchor_pct?.x ?? 50),
      y: clampPercent(base?.mobile_anchor_pct?.y, previous?.mobile_anchor_pct?.y ?? 50),
    },
  };
}

function normalizeZoneActionList(valueRaw, fallback = [], options = {}) {
  const source = Array.isArray(valueRaw) ? valueRaw : Array.isArray(fallback) ? fallback : [];
  const previousById = new Map(
    (Array.isArray(fallback) ? fallback : [])
      .map((entry) => [sanitizeText(entry?.action_id), entry])
      .filter(([actionId]) => actionId),
  );
  const seen = new Set();
  const actions = [];
  for (const entry of source) {
    const actionId = sanitizeText(entry?.action_id);
    const normalized = normalizeZoneActionPayload(entry, previousById.get(actionId) || null, options);
    if (!normalized || seen.has(normalized.action_id)) {
      continue;
    }
    seen.add(normalized.action_id);
    actions.push(normalized);
  }
  return actions;
}

function sanitizeSpriteToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function toUrlPath(...segments) {
  const encodedParts = [];
  for (const rawSegment of segments) {
    const split = String(rawSegment || "")
      .split("/")
      .map((part) => String(part || "").trim())
      .filter(Boolean);
    for (const part of split) {
      encodedParts.push(encodeURIComponent(part));
    }
  }
  return `/${encodedParts.join("/")}`;
}

function buildFallbackSpriteUrl(pokemonId, nameEn, folder = "") {
  const id = Math.max(0, toSafeInt(pokemonId, 0));
  const normalizedName = sanitizeSpriteToken(nameEn);
  if (id <= 0 || !normalizedName) {
    return "";
  }
  const normalizedFolder = sanitizeText(folder) || `${id}_${normalizedName}`;
  return toUrlPath(
    "pokemon_data",
    normalizedFolder,
    "sprites",
    `${id}_${normalizedName}_firered_leafgreen_front.png`,
  );
}

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function parseBooleanValue(value, fallback = true) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return Boolean(fallback);
  }
  if (["1", "true", "yes", "y", "oui", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "non", "off"].includes(normalized)) {
    return false;
  }
  return Boolean(fallback);
}

function normalizeZoneType(value, fallback = "route") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (!ZONE_TYPES.has(normalized)) {
    return fallback;
  }
  if (normalized === "city") {
    return "town";
  }
  return normalized;
}

function normalizeUnlockMode(valueRaw, combatEnabled = true) {
  const normalized = String(valueRaw || "")
    .trim()
    .toLowerCase();
  if (normalized === "visit") {
    return "visit";
  }
  if (normalized === "defeats") {
    return "defeats";
  }
  return combatEnabled ? "defeats" : "visit";
}

function normalizeUnlockDefeatsRequired(valueRaw, fallback = DEFAULT_UNLOCK_DEFEATS_REQUIRED) {
  return Math.max(0, toSafeInt(valueRaw, fallback));
}

function normalizeUnlockTimerMs(valueRaw, fallback = DEFAULT_UNLOCK_TIMER_MS) {
  return Math.max(1000, toSafeInt(valueRaw, fallback));
}

function inferRegionId(routeId) {
  const id = sanitizeText(routeId).toLowerCase();
  if (id.startsWith("kanto_")) {
    return "kanto";
  }
  if (id.startsWith("johto_")) {
    return "johto";
  }
  if (id.startsWith("hoenn_")) {
    return "hoenn";
  }
  return "other";
}

function getRegionLabel(routeId) {
  return REGION_LABEL_BY_ID[inferRegionId(routeId)] || REGION_LABEL_BY_ID.other;
}

function buildStorageMeta(routeId, storageKind = "json") {
  const normalizedKind = storageKind === "csv" ? "csv" : "json";
  const regionId = inferRegionId(routeId);
  return {
    region_id: regionId,
    region_label: REGION_LABEL_BY_ID[regionId] || REGION_LABEL_BY_ID.other,
    storage_kind: normalizedKind,
    storage_label: normalizedKind === "csv" ? "CSV runtime" : "JSON de zone",
  };
}

function buildRouteAdditionalMeta(payload = {}, fallback = {}, routeId = "", options = {}) {
  return {
    connected_route_ids: sanitizeStringList(payload.connected_route_ids ?? fallback.connected_route_ids)
      .filter((candidateId) => candidateId !== routeId),
    arrival_dialogue_ids_once: sanitizeStringList(
      payload.arrival_dialogue_ids_once ?? fallback.arrival_dialogue_ids_once,
    ),
    zone_actions: normalizeZoneActionList(
      payload.zone_actions ?? fallback.zone_actions,
      fallback.zone_actions,
      options,
    ),
    access_rules: normalizeAccessRulesPayload(payload.access_rules, fallback.access_rules),
  };
}

function normalizeEncounterRowFromRouteJson(routeId, encounter) {
  const pokemonId = Math.max(0, toSafeInt(encounter?.id, 0));
  if (pokemonId <= 0) {
    return null;
  }
  const minLevel = Math.max(1, toSafeInt(encounter?.min_level, 1));
  const maxLevel = Math.max(minLevel, toSafeInt(encounter?.max_level, minLevel));
  return {
    route_id: sanitizeText(routeId),
    route_name_fr: "",
    zone_type: "route",
    combat_enabled: true,
    pokemon_id: pokemonId,
    pokemon_name_en: sanitizeText(encounter?.name_en).toLowerCase(),
    pokemon_name_fr: sanitizeText(encounter?.name_fr),
    spawn_weight: Math.max(1, toSafeInt(encounter?.spawn_weight, 1)),
    min_level: minLevel,
    max_level: maxLevel,
    methods: normalizeMethods(encounter?.methods),
  };
}

function buildRouteEncounterRowsFromJson(routeId, routeJson) {
  const encounters = Array.isArray(routeJson?.encounters) ? routeJson.encounters : [];
  return encounters
    .map((encounter) => normalizeEncounterRowFromRouteJson(routeId, encounter))
    .filter(Boolean)
    .map((row) => ({
      ...row,
      route_name_fr: sanitizeText(routeJson?.route_name_fr, row.route_id),
      zone_type: normalizeZoneType(routeJson?.zone_type, "route"),
      combat_enabled: routeJson?.combat_enabled !== false,
    }));
}

function normalizeUnlockDefeatsForMode(valueRaw, fallback, combatEnabled = true, unlockMode = "defeats") {
  const allowZero = !combatEnabled || unlockMode === "visit";
  const minValue = allowZero ? 0 : 1;
  const defaultFallback = allowZero ? 0 : DEFAULT_UNLOCK_DEFEATS_REQUIRED;
  const rawFallback = sanitizeText(fallback);
  const normalizedFallback = rawFallback
    ? Math.max(minValue, toSafeInt(rawFallback, defaultFallback))
    : defaultFallback;
  const rawValue = sanitizeText(valueRaw);
  if (!rawValue) {
    return normalizedFallback;
  }
  return Math.max(minValue, toSafeInt(rawValue, normalizedFallback));
}

function normalizeMethods(valueRaw) {
  const methods = Array.isArray(valueRaw)
    ? valueRaw
    : parseCsvMethods(String(valueRaw || "").replaceAll(",", "|").replaceAll(";", "|"));
  const seen = new Set();
  const deduped = [];
  for (const method of methods) {
    const normalized = String(method || "").toLowerCase().trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(normalized);
  }
  return deduped;
}

function csvEscape(value) {
  const raw = String(value ?? "");
  if (raw.includes('"') || raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

function stringifyCsvLine(values) {
  return values.map((value) => csvEscape(value)).join(",");
}

function getRouteJsonPath(routeId) {
  const id = sanitizeText(routeId);
  return path.join(MAP_DATA_DIR, `${id}.json`);
}

async function readBodyJson(request) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error("Corps de requete trop volumineux");
    }
    chunks.push(chunk);
  }
  if (chunks.length <= 0) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("JSON invalide");
  }
}

async function ensureBackup(filePath) {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `${path.basename(filePath)}.${timestamp}.bak`);
  await fsp.copyFile(filePath, backupPath);
  return backupPath;
}

async function readRouteJson(routeId) {
  const routePath = getRouteJsonPath(routeId);
  if (!fs.existsSync(routePath)) {
    return null;
  }
  try {
    const raw = await fsp.readFile(routePath, "utf8");
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function buildRouteMetaFromJson(routeId, routeJson, fallbackMeta = null) {
  const base = fallbackMeta && typeof fallbackMeta === "object" ? fallbackMeta : {};
  const combatEnabled = routeJson?.combat_enabled !== false;
  const unlockMode = normalizeUnlockMode(routeJson?.unlock_mode || base.unlock_mode, combatEnabled);
  const additionalMeta = buildRouteAdditionalMeta(routeJson, base, sanitizeText(routeId));
  return {
    route_id: sanitizeText(routeId, sanitizeText(base.route_id)),
    route_name_fr: sanitizeText(routeJson?.route_name_fr, sanitizeText(base.route_name_fr, sanitizeText(routeId))),
    zone_type: normalizeZoneType(routeJson?.zone_type, normalizeZoneType(base.zone_type, "route")),
    combat_enabled: combatEnabled,
    unlock_mode: unlockMode,
    unlock_defeats_required: normalizeUnlockDefeatsForMode(
      routeJson?.unlock_defeats_required,
      base.unlock_defeats_required,
      combatEnabled,
      unlockMode,
    ),
    unlock_timer_ms: normalizeUnlockTimerMs(
      routeJson?.unlock_timer_ms,
      normalizeUnlockTimerMs(base.unlock_timer_ms, DEFAULT_UNLOCK_TIMER_MS),
    ),
    ...additionalMeta,
    ...buildStorageMeta(routeId, base.storage_kind || "json"),
  };
}

async function writeRouteJsonMeta(routeId, payload = {}) {
  const id = sanitizeText(routeId);
  if (!id) {
    return null;
  }
  const routePath = getRouteJsonPath(id);
  const previous = (await readRouteJson(id)) || {};
  const combatEnabled = parseBooleanValue(payload?.combat_enabled, previous?.combat_enabled !== false);
  const nextUnlockMode = normalizeUnlockMode(payload?.unlock_mode || previous?.unlock_mode, combatEnabled);
  const additionalMeta = buildRouteAdditionalMeta(payload, previous, id, { strict: true });
  const nextJson = {
    ...previous,
    route_id: id,
    route_name_fr: sanitizeText(payload?.route_name_fr, sanitizeText(previous?.route_name_fr, id)),
    zone_type: normalizeZoneType(payload?.zone_type, normalizeZoneType(previous?.zone_type, "route")),
    combat_enabled: combatEnabled,
    unlock_mode: nextUnlockMode,
    unlock_defeats_required: normalizeUnlockDefeatsForMode(
      payload?.unlock_defeats_required,
      previous?.unlock_defeats_required,
      combatEnabled,
      nextUnlockMode,
    ),
    unlock_timer_ms: normalizeUnlockTimerMs(payload?.unlock_timer_ms, previous?.unlock_timer_ms),
    ...additionalMeta,
  };
  await fsp.mkdir(path.dirname(routePath), { recursive: true });
  if (fs.existsSync(routePath)) {
    await ensureBackup(routePath);
  }
  await fsp.writeFile(routePath, `${JSON.stringify(nextJson, null, 2)}\n`, "utf8");
  return nextJson;
}

function normalizeRouteCsvRow(row) {
  const routeId = sanitizeText(readCsvCell(row, "route_id"));
  if (!routeId) {
    return null;
  }
  const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
  const base = {
    route_id: routeId,
    route_name_fr: sanitizeText(readCsvCell(row, "route_name_fr"), routeId),
    zone_type: normalizeZoneType(readCsvCell(row, "zone_type"), "route"),
    combat_enabled: parseBooleanValue(readCsvCell(row, "combat_enabled"), true),
    pokemon_id: pokemonId,
    pokemon_name_en: "",
    pokemon_name_fr: "",
    spawn_weight: 0,
    min_level: 0,
    max_level: 0,
    methods: [],
  };
  if (pokemonId <= 0) {
    return base;
  }
  const minLevel = Math.max(1, toSafeInt(readCsvCell(row, "min_level"), 1));
  const maxLevel = Math.max(minLevel, toSafeInt(readCsvCell(row, "max_level"), minLevel));
  return {
    ...base,
    pokemon_name_en: sanitizeText(readCsvCell(row, "pokemon_name_en")).toLowerCase(),
    pokemon_name_fr: sanitizeText(readCsvCell(row, "pokemon_name_fr")),
    spawn_weight: Math.max(1, toSafeInt(readCsvCell(row, "spawn_weight"), 1)),
    min_level: minLevel,
    max_level: maxLevel,
    methods: normalizeMethods(readCsvCell(row, "methods")),
  };
}

async function loadPokemonReferences() {
  const refs = [];
  const byId = new Map();
  const dirEntries = await fsp.readdir(POKEMON_DATA_DIR, { withFileTypes: true });
  for (const entry of dirEntries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const folder = entry.name;
    const payloadPath = path.join(POKEMON_DATA_DIR, folder, `${folder}_data.json`);
    if (!fs.existsSync(payloadPath)) {
      continue;
    }
    try {
      const payload = JSON.parse(await fsp.readFile(payloadPath, "utf8"));
      const id = Math.max(0, toSafeInt(payload?.pokedex_number, 0));
      const nameEn = sanitizeText(payload?.name_en).toLowerCase();
      const nameFr = sanitizeText(payload?.name_fr || payload?.name_en);
      if (id <= 0 || !nameEn) {
        continue;
      }
      const frontSprite = sanitizeText(payload?.sprites?.front);
      const shinyFrontSprite = sanitizeText(payload?.sprites?.front_shiny);
      const spriteDefaultUrl = frontSprite
        ? toUrlPath("pokemon_data", folder, frontSprite)
        : buildFallbackSpriteUrl(id, nameEn, folder);
      const spriteShinyUrl = shinyFrontSprite ? toUrlPath("pokemon_data", folder, shinyFrontSprite) : "";
      const ref = {
        id,
        folder,
        name_en: nameEn,
        name_fr: nameFr || nameEn,
        sprite_default_url: spriteDefaultUrl,
        sprite_shiny_url: spriteShinyUrl,
      };
      byId.set(id, ref);
      refs.push(ref);
    } catch {
      // Ignore malformed file.
    }
  }
  refs.sort((a, b) => a.id - b.id);
  return {
    list: refs,
    byId,
  };
}

async function loadRouteCsvModel() {
  const rawCsv = (await fsp.readFile(ROUTE_CSV_PATH, "utf8")).replace(/^\uFEFF/, "");
  const rows = parseCsvObjects(rawCsv, ROUTE_CSV_PATH);
  const routeOrder = [];
  const routeRowsById = new Map();
  const routeMetaById = new Map();
  const methodSet = new Set(BASE_METHODS);

  for (const rawRow of rows) {
    const row = normalizeRouteCsvRow(rawRow);
    if (!row) {
      continue;
    }
    if (!routeRowsById.has(row.route_id)) {
      routeRowsById.set(row.route_id, []);
      routeOrder.push(row.route_id);
      routeMetaById.set(row.route_id, {
        route_id: row.route_id,
        route_name_fr: row.route_name_fr || row.route_id,
        zone_type: row.zone_type,
        combat_enabled: row.combat_enabled,
        unlock_mode: row.combat_enabled ? "defeats" : "visit",
        unlock_defeats_required: row.combat_enabled ? DEFAULT_UNLOCK_DEFEATS_REQUIRED : 0,
        unlock_timer_ms: DEFAULT_UNLOCK_TIMER_MS,
        ...buildStorageMeta(row.route_id, "csv"),
      });
    }
    routeRowsById.get(row.route_id).push(row);
    if (Array.isArray(row.methods)) {
      for (const method of row.methods) {
        methodSet.add(method);
      }
    }
  }

  for (const routeId of routeOrder) {
    const existingMeta = routeMetaById.get(routeId) || {
      route_id: routeId,
      route_name_fr: routeId,
      zone_type: "route",
      combat_enabled: true,
      unlock_mode: "defeats",
      unlock_defeats_required: DEFAULT_UNLOCK_DEFEATS_REQUIRED,
      unlock_timer_ms: DEFAULT_UNLOCK_TIMER_MS,
    };
    const routeJson = await readRouteJson(routeId);
    const mergedMeta = buildRouteMetaFromJson(routeId, routeJson, existingMeta);
    routeMetaById.set(routeId, mergedMeta);
  }

  return {
    routeOrder,
    routeRowsById,
    routeMetaById,
    methodChoices: Array.from(methodSet.values()),
  };
}

async function loadRouteCatalogModel() {
  const routeOrder = [];
  const routeMetaById = new Map();
  const routeJsonById = new Map();
  const zoneCatalogEntries = (await fsp.readdir(MAP_DATA_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith("_zones.json"))
    .map((entry) => entry.name)
    .sort((left, right) => {
      const leftPriority = REGION_ORDER.indexOf(inferRegionId(left));
      const rightPriority = REGION_ORDER.indexOf(inferRegionId(right));
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.localeCompare(right);
    });

  for (const catalogName of zoneCatalogEntries) {
    const catalogPath = path.join(MAP_DATA_DIR, catalogName);
    let catalog = null;
    try {
      catalog = JSON.parse(await fsp.readFile(catalogPath, "utf8"));
    } catch {
      continue;
    }
    const zoneEntries = new Map();
    const zones = Array.isArray(catalog?.zones) ? catalog.zones : [];
    for (const zone of zones) {
      const routeId = sanitizeText(zone?.route_id);
      if (routeId) {
        zoneEntries.set(routeId, zone);
      }
    }
    const orderedRouteIds = Array.isArray(catalog?.zone_order)
      ? catalog.zone_order.map((routeId) => sanitizeText(routeId)).filter(Boolean)
      : [];

    for (const routeId of orderedRouteIds) {
      if (!routeMetaById.has(routeId)) {
        routeOrder.push(routeId);
      }
      const zoneEntry = zoneEntries.get(routeId) || { route_id: routeId };
      const routeJson = await readRouteJson(routeId);
      routeJsonById.set(routeId, routeJson);
      routeMetaById.set(
        routeId,
        buildRouteMetaFromJson(routeId, routeJson, {
          ...zoneEntry,
          ...buildStorageMeta(routeId, "json"),
        }),
      );
    }
  }

  return {
    routeOrder,
    routeMetaById,
    routeJsonById,
  };
}

async function loadRouteStudioModel() {
  const [csvModel, catalogModel] = await Promise.all([loadRouteCsvModel(), loadRouteCatalogModel()]);
  const routeOrder = [];
  const routeRowsById = new Map();
  const routeMetaById = new Map();
  const methodSet = new Set([...BASE_METHODS, ...(csvModel.methodChoices || [])]);
  const seenRouteIds = new Set();

  const registerRoute = (routeId, rows, meta) => {
    const id = sanitizeText(routeId);
    if (!id) {
      return;
    }
    if (!seenRouteIds.has(id)) {
      seenRouteIds.add(id);
      routeOrder.push(id);
    }
    const normalizedRows = Array.isArray(rows) ? rows : [];
    routeRowsById.set(id, normalizedRows);
    routeMetaById.set(id, meta);
    for (const row of normalizedRows) {
      const methods = Array.isArray(row?.methods) ? row.methods : normalizeMethods(row?.methods);
      for (const method of methods) {
        methodSet.add(method);
      }
    }
  };

  for (const routeId of catalogModel.routeOrder) {
    const csvRows = csvModel.routeRowsById.get(routeId);
    const routeJson = catalogModel.routeJsonById.get(routeId) ?? (await readRouteJson(routeId));
    const storageKind = Array.isArray(csvRows) ? "csv" : "json";
    const rows = Array.isArray(csvRows) ? csvRows : buildRouteEncounterRowsFromJson(routeId, routeJson);
    const baseMeta = Array.isArray(csvRows)
      ? csvModel.routeMetaById.get(routeId) || catalogModel.routeMetaById.get(routeId)
      : catalogModel.routeMetaById.get(routeId);
    const mergedMeta = buildRouteMetaFromJson(routeId, routeJson, {
      ...(baseMeta || {}),
      ...buildStorageMeta(routeId, storageKind),
    });
    registerRoute(routeId, rows, mergedMeta);
  }

  for (const routeId of csvModel.routeOrder) {
    if (seenRouteIds.has(routeId)) {
      continue;
    }
    const routeJson = await readRouteJson(routeId);
    const meta = buildRouteMetaFromJson(routeId, routeJson, {
      ...(csvModel.routeMetaById.get(routeId) || {}),
      ...buildStorageMeta(routeId, "csv"),
    });
    registerRoute(routeId, csvModel.routeRowsById.get(routeId) || [], meta);
  }

  return {
    routeOrder,
    routeRowsById,
    routeMetaById,
    methodChoices: Array.from(methodSet.values()),
  };
}

function buildRouteMetaList(model) {
  return model.routeOrder.map((routeId) => {
    const rows = model.routeRowsById.get(routeId) || [];
    const meta = model.routeMetaById.get(routeId) || {
      route_id: routeId,
      route_name_fr: routeId,
      zone_type: "route",
      combat_enabled: true,
    };
    const encounterRows = rows.filter((row) => row.pokemon_id > 0);
    const totalWeight = encounterRows.reduce((sum, row) => sum + Math.max(0, toSafeInt(row.spawn_weight, 0)), 0);
    return {
      ...meta,
      encounter_count: encounterRows.length,
      total_weight: totalWeight,
    };
  });
}

function buildRouteChoiceList(model) {
  return buildRouteMetaList(model).map((route) => ({
    route_id: sanitizeText(route.route_id),
    route_name_fr: sanitizeText(route.route_name_fr, sanitizeText(route.route_id)),
    region_id: sanitizeText(route.region_id, inferRegionId(route.route_id)),
    region_label: sanitizeText(route.region_label, getRegionLabel(route.route_id)),
    storage_kind: sanitizeText(route.storage_kind, "json"),
    zone_type: sanitizeText(route.zone_type, "route"),
    combat_enabled: route.combat_enabled !== false,
  }));
}

function buildDialogueChoiceList(dialogueModel) {
  const meta = Array.isArray(dialogueModel?.meta) ? dialogueModel.meta : [];
  return meta.map((entry) => ({
    dialogue_id: sanitizeText(entry?.dialogue_id),
    title_fr: sanitizeText(entry?.title_fr, sanitizeText(entry?.dialogue_id)),
    node_count: Math.max(0, toSafeInt(entry?.node_count, 0)),
    route_ref_count: Array.isArray(entry?.route_refs) ? entry.route_refs.length : 0,
    validation_ok: entry?.validation?.ok !== false,
  }));
}

function serializeRouteRows(rows) {
  const lines = [stringifyCsvLine(ROUTE_HEADERS)];
  for (const row of rows) {
    const pokemonId = Math.max(0, toSafeInt(row.pokemon_id, 0));
    if (pokemonId <= 0) {
      lines.push(
        stringifyCsvLine([
          row.route_id,
          row.route_name_fr,
          row.zone_type,
          row.combat_enabled ? "true" : "false",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      );
      continue;
    }
    lines.push(
      stringifyCsvLine([
        row.route_id,
        row.route_name_fr,
        row.zone_type,
        row.combat_enabled ? "true" : "false",
        pokemonId,
        row.pokemon_name_en,
        row.pokemon_name_fr,
        Math.max(1, toSafeInt(row.spawn_weight, 1)),
        Math.max(1, toSafeInt(row.min_level, 1)),
        Math.max(1, toSafeInt(row.max_level, Math.max(1, toSafeInt(row.min_level, 1)))),
        normalizeMethods(row.methods).join("|"),
      ]),
    );
  }
  return `${UTF8_BOM}${lines.join("\n")}\n`;
}

function buildRouteRowsForWrite(existingModel, routeId, payload, pokemonRefsById) {
  const id = sanitizeText(routeId);
  if (!id) {
    throw new Error("route_id manquant");
  }
  const existingMeta = existingModel.routeMetaById.get(id) || {
    route_id: id,
    route_name_fr: id,
    zone_type: "route",
    combat_enabled: true,
    unlock_mode: "defeats",
    unlock_defeats_required: DEFAULT_UNLOCK_DEFEATS_REQUIRED,
    unlock_timer_ms: DEFAULT_UNLOCK_TIMER_MS,
  };
  const routeNameFr = sanitizeText(payload?.route_name_fr, existingMeta.route_name_fr || id);
  const zoneType = normalizeZoneType(payload?.zone_type, existingMeta.zone_type || "route");
  const combatEnabled = parseBooleanValue(payload?.combat_enabled, existingMeta.combat_enabled !== false);
  const unlockMode = normalizeUnlockMode(payload?.unlock_mode || existingMeta.unlock_mode, combatEnabled);
  const unlockDefeatsRequired = normalizeUnlockDefeatsForMode(
    payload?.unlock_defeats_required,
    existingMeta.unlock_defeats_required,
    combatEnabled,
    unlockMode,
  );
  const unlockTimerMs = normalizeUnlockTimerMs(payload?.unlock_timer_ms, existingMeta.unlock_timer_ms);
  const additionalMeta = buildRouteAdditionalMeta(payload, existingMeta, id, { strict: true });
  const rawEncounters = Array.isArray(payload?.encounters) ? payload.encounters : [];
  const encounters = [];
  for (let index = 0; index < rawEncounters.length; index += 1) {
    const raw = rawEncounters[index];
    const pokemonId = Math.max(0, toSafeInt(raw?.pokemon_id, 0));
    if (pokemonId <= 0) {
      continue;
    }
    const pokemonRef = pokemonRefsById.get(pokemonId) || null;
    const rawNameEn = sanitizeText(raw?.pokemon_name_en).toLowerCase();
    const rawNameFr = sanitizeText(raw?.pokemon_name_fr);
    const resolvedNameEn = sanitizeText(rawNameEn || pokemonRef?.name_en);
    const resolvedNameFr = sanitizeText(rawNameFr || pokemonRef?.name_fr || resolvedNameEn);
    if (!resolvedNameEn) {
      throw new Error(`Ligne ${index + 1}: nom anglais introuvable pour #${pokemonId}`);
    }
    const minLevel = Math.max(1, toSafeInt(raw?.min_level, 1));
    const maxLevel = Math.max(minLevel, toSafeInt(raw?.max_level, minLevel));
    const methods = normalizeMethods(raw?.methods);
    encounters.push({
      route_id: id,
      route_name_fr: routeNameFr,
      zone_type: zoneType,
      combat_enabled: combatEnabled,
      pokemon_id: pokemonId,
      pokemon_name_en: resolvedNameEn,
      pokemon_name_fr: resolvedNameFr,
      spawn_weight: Math.max(1, toSafeInt(raw?.spawn_weight, 1)),
      min_level: minLevel,
      max_level: maxLevel,
      methods,
    });
  }

  const routeMeta = {
    route_id: id,
    route_name_fr: routeNameFr,
    zone_type: zoneType,
    combat_enabled: combatEnabled,
    unlock_mode: unlockMode,
    unlock_defeats_required: unlockDefeatsRequired,
    unlock_timer_ms: unlockTimerMs,
    ...additionalMeta,
    ...buildStorageMeta(id, existingMeta.storage_kind || "csv"),
  };

  if (encounters.length <= 0) {
    return {
      routeMeta,
      rows: [
      {
        route_id: id,
        route_name_fr: routeNameFr,
        zone_type: zoneType,
        combat_enabled: combatEnabled,
        pokemon_id: 0,
        pokemon_name_en: "",
        pokemon_name_fr: "",
        spawn_weight: 0,
        min_level: 0,
        max_level: 0,
        methods: [],
      },
      ],
    };
  }
  return {
    routeMeta,
    rows: encounters,
  };
}

async function writeRouteCsv(routeId, payload, pokemonRefsById) {
  const model = await loadRouteCsvModel();
  const targetRouteId = sanitizeText(routeId);
  const writePayload = buildRouteRowsForWrite(model, targetRouteId, payload, pokemonRefsById);
  const newRowsForTarget = Array.isArray(writePayload?.rows) ? writePayload.rows : [];
  const routeMeta = writePayload?.routeMeta || null;
  const outputRows = [];
  const routeOrder = model.routeOrder.includes(targetRouteId) ? model.routeOrder.slice() : [...model.routeOrder, targetRouteId];
  for (const currentRouteId of routeOrder) {
    if (currentRouteId === targetRouteId) {
      outputRows.push(...newRowsForTarget);
      continue;
    }
    const existingRows = model.routeRowsById.get(currentRouteId) || [];
    outputRows.push(...existingRows);
  }
  await ensureBackup(ROUTE_CSV_PATH);
  const nextCsv = serializeRouteRows(outputRows);
  await fsp.writeFile(ROUTE_CSV_PATH, nextCsv, "utf8");
  if (routeMeta) {
    await writeRouteJsonMeta(targetRouteId, routeMeta);
  }
  return loadRouteStudioModel();
}

function buildRouteJsonPayloadForWrite(existingJson, routeMeta, payload, pokemonRefsById) {
  const previous = existingJson && typeof existingJson === "object" ? existingJson : {};
  const combatEnabled = parseBooleanValue(payload?.combat_enabled, routeMeta?.combat_enabled !== false);
  const unlockMode = normalizeUnlockMode(payload?.unlock_mode || routeMeta?.unlock_mode || previous?.unlock_mode, combatEnabled);
  const additionalMeta = buildRouteAdditionalMeta(
    payload,
    routeMeta || previous,
    sanitizeText(routeMeta?.route_id || previous?.route_id),
    { strict: true },
  );
  const nextRouteMeta = {
    route_id: sanitizeText(routeMeta?.route_id || previous?.route_id),
    route_name_fr: sanitizeText(payload?.route_name_fr, sanitizeText(routeMeta?.route_name_fr, sanitizeText(previous?.route_name_fr))),
    zone_type: normalizeZoneType(payload?.zone_type, normalizeZoneType(routeMeta?.zone_type || previous?.zone_type, "route")),
    combat_enabled: combatEnabled,
    unlock_mode: unlockMode,
    unlock_defeats_required: normalizeUnlockDefeatsForMode(
      payload?.unlock_defeats_required,
      routeMeta?.unlock_defeats_required ?? previous?.unlock_defeats_required,
      combatEnabled,
      unlockMode,
    ),
    unlock_timer_ms: normalizeUnlockTimerMs(
      payload?.unlock_timer_ms,
      routeMeta?.unlock_timer_ms ?? previous?.unlock_timer_ms ?? DEFAULT_UNLOCK_TIMER_MS,
    ),
    ...additionalMeta,
  };

  const rawEncounters = Array.isArray(payload?.encounters) ? payload.encounters : [];
  const encounters = [];
  for (let index = 0; index < rawEncounters.length; index += 1) {
    const raw = rawEncounters[index];
    const pokemonId = Math.max(0, toSafeInt(raw?.pokemon_id, 0));
    if (pokemonId <= 0) {
      continue;
    }
    const pokemonRef = pokemonRefsById.get(pokemonId) || null;
    const resolvedNameEn = sanitizeText(raw?.pokemon_name_en, sanitizeText(pokemonRef?.name_en)).toLowerCase();
    const resolvedNameFr = sanitizeText(raw?.pokemon_name_fr, sanitizeText(pokemonRef?.name_fr, resolvedNameEn));
    if (!resolvedNameEn) {
      throw new Error(`Ligne ${index + 1}: nom anglais introuvable pour #${pokemonId}`);
    }
    const minLevel = Math.max(1, toSafeInt(raw?.min_level, 1));
    const maxLevel = Math.max(minLevel, toSafeInt(raw?.max_level, minLevel));
    encounters.push({
      id: pokemonId,
      name_en: resolvedNameEn,
      name_fr: resolvedNameFr,
      methods: normalizeMethods(raw?.methods),
      spawn_weight: Math.max(1, toSafeInt(raw?.spawn_weight, 1)),
      min_level: minLevel,
      max_level: maxLevel,
    });
  }

  return {
    ...previous,
    ...nextRouteMeta,
    encounters,
  };
}

async function writeRouteJsonData(routeId, payload, pokemonRefsById) {
  const id = sanitizeText(routeId);
  if (!id) {
    throw new Error("route_id manquant");
  }
  const existingJson = await readRouteJson(id);
  if (!existingJson) {
    throw new Error(`Route introuvable: ${id}`);
  }
  const existingMeta = buildRouteMetaFromJson(id, existingJson, {
    route_id: id,
    ...buildStorageMeta(id, "json"),
  });
  const nextJson = buildRouteJsonPayloadForWrite(existingJson, existingMeta, payload, pokemonRefsById);
  const routePath = getRouteJsonPath(id);
  await ensureBackup(routePath);
  await fsp.writeFile(routePath, `${JSON.stringify(nextJson, null, 2)}\n`, "utf8");
  return loadRouteStudioModel();
}

function normalizeTalentRow(row) {
  const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
  if (pokemonId <= 0) {
    return null;
  }
  const pokemonNameEn = sanitizeText(readCsvCell(row, "pokemon_name_en")).toLowerCase();
  const pokemonNameFr = sanitizeText(readCsvCell(row, "pokemon_name_fr"), pokemonNameEn || `Pokemon ${pokemonId}`);
  const talentId = sanitizeText(readCsvCell(row, "talent_id"), "NONE").toUpperCase();
  return {
    pokemon_id: pokemonId,
    pokemon_name_fr: pokemonNameFr,
    pokemon_name_en: pokemonNameEn,
    talent_id: talentId || "NONE",
    talent_name_fr: sanitizeText(readCsvCell(row, "talent_name_fr"), talentId || "NONE"),
    talent_name_en: sanitizeText(readCsvCell(row, "talent_name_en"), talentId || "NONE"),
    talent_description_fr: sanitizeText(readCsvCell(row, "talent_description_fr")),
    commentaire: sanitizeText(readCsvCell(row, "commentaire")),
  };
}

async function loadTalentsCsvModel() {
  const rawCsv = (await fsp.readFile(TALENTS_CSV_PATH, "utf8")).replace(/^\uFEFF/, "");
  const rows = parseCsvObjects(rawCsv, TALENTS_CSV_PATH);
  const byPokemonId = new Map();
  const order = [];
  for (const rawRow of rows) {
    const row = normalizeTalentRow(rawRow);
    if (!row) {
      continue;
    }
    if (!byPokemonId.has(row.pokemon_id)) {
      order.push(row.pokemon_id);
    }
    byPokemonId.set(row.pokemon_id, row);
  }
  return {
    order,
    byPokemonId,
  };
}

function serializeTalentRows(rows) {
  const lines = [stringifyCsvLine(TALENT_HEADERS)];
  for (const row of rows) {
    lines.push(
      stringifyCsvLine([
        Math.max(1, toSafeInt(row.pokemon_id, 0)),
        sanitizeText(row.pokemon_name_fr),
        sanitizeText(row.pokemon_name_en).toLowerCase(),
        sanitizeText(row.talent_id, "NONE").toUpperCase(),
        sanitizeText(row.talent_name_fr),
        sanitizeText(row.talent_name_en),
        sanitizeText(row.talent_description_fr),
        sanitizeText(row.commentaire),
      ]),
    );
  }
  return `${UTF8_BOM}${lines.join("\n")}\n`;
}

function buildTalentRowForWrite(pokemonId, payload, pokemonRefsById, existingRow = null) {
  const id = Math.max(1, toSafeInt(pokemonId, 0));
  if (id <= 0) {
    throw new Error("pokemon_id invalide");
  }
  const ref = pokemonRefsById.get(id) || null;
  const nameEn = sanitizeText(payload?.pokemon_name_en || existingRow?.pokemon_name_en || ref?.name_en).toLowerCase();
  const nameFr = sanitizeText(payload?.pokemon_name_fr || existingRow?.pokemon_name_fr || ref?.name_fr || nameEn);
  if (!nameEn) {
    throw new Error(`Pokemon #${id} introuvable`);
  }
  const talentId = sanitizeText(payload?.talent_id || existingRow?.talent_id || "NONE").toUpperCase();
  return {
    pokemon_id: id,
    pokemon_name_fr: nameFr || nameEn,
    pokemon_name_en: nameEn,
    talent_id: talentId || "NONE",
    talent_name_fr: sanitizeText(payload?.talent_name_fr || existingRow?.talent_name_fr || talentId || "NONE"),
    talent_name_en: sanitizeText(payload?.talent_name_en || existingRow?.talent_name_en || talentId || "NONE"),
    talent_description_fr: sanitizeText(payload?.talent_description_fr || existingRow?.talent_description_fr),
    commentaire: sanitizeText(payload?.commentaire || existingRow?.commentaire),
  };
}

async function writeTalentRow(pokemonId, payload, pokemonRefsById) {
  const model = await loadTalentsCsvModel();
  const id = Math.max(1, toSafeInt(pokemonId, 0));
  const previous = model.byPokemonId.get(id) || null;
  const nextRow = buildTalentRowForWrite(id, payload, pokemonRefsById, previous);
  model.byPokemonId.set(id, nextRow);
  if (!model.order.includes(id)) {
    model.order.push(id);
  }
  model.order.sort((a, b) => a - b);
  const rows = model.order.map((currentId) => model.byPokemonId.get(currentId)).filter(Boolean);
  await ensureBackup(TALENTS_CSV_PATH);
  const nextCsv = serializeTalentRows(rows);
  await fsp.writeFile(TALENTS_CSV_PATH, nextCsv, "utf8");
  return loadTalentsCsvModel();
}

function getRoutePayload(model, routeId, pokemonRefsById = new Map()) {
  const id = sanitizeText(routeId);
  const rows = model.routeRowsById.get(id) || [];
  const meta = model.routeMetaById.get(id) || {
    route_id: id,
    route_name_fr: id,
    zone_type: "route",
    combat_enabled: true,
    ...buildStorageMeta(id, "json"),
  };
  const encounters = rows
    .filter((row) => row.pokemon_id > 0)
    .map((row) => {
      const ref = pokemonRefsById.get(Number(row.pokemon_id || 0)) || null;
      const spriteDefaultUrl =
        sanitizeText(ref?.sprite_default_url) ||
        buildFallbackSpriteUrl(row.pokemon_id, row.pokemon_name_en, sanitizeText(ref?.folder));
      return {
        pokemon_id: row.pokemon_id,
        pokemon_name_en: sanitizeText(ref?.name_en, row.pokemon_name_en),
        pokemon_name_fr: sanitizeText(ref?.name_fr, row.pokemon_name_fr),
        sprite_default_url: spriteDefaultUrl,
        spawn_weight: row.spawn_weight,
        min_level: row.min_level,
        max_level: row.max_level,
        methods: row.methods,
      };
    });
  const totalWeight = encounters.reduce((sum, entry) => sum + Math.max(0, toSafeInt(entry.spawn_weight, 0)), 0);
  return {
    route: meta,
    encounters,
    total_weight: totalWeight,
  };
}

function sanitizeDataFileId(value, label = "identifiant") {
  const id = sanitizeText(value);
  if (!id || /[\\/]/.test(id)) {
    throw new Error(`${label} invalide`);
  }
  return id;
}

function getDialogueJsonPath(dialogueId) {
  const id = sanitizeDataFileId(dialogueId, "dialogue_id");
  return path.join(DIALOGUE_DATA_DIR, `${id}.json`);
}

async function listDialogueIds() {
  if (!fs.existsSync(DIALOGUE_DATA_DIR)) {
    return [];
  }
  const entries = await fsp.readdir(DIALOGUE_DATA_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/i, ""))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeDialogueEffectList(valueRaw) {
  const source = Array.isArray(valueRaw) ? valueRaw : [];
  return source
    .map((effect) => ({
      kind: sanitizeText(effect?.kind),
      flag_id: sanitizeText(effect?.flag_id),
    }))
    .filter((effect) => effect.kind && effect.flag_id);
}

function normalizeDialogueChoiceList(valueRaw) {
  const source = Array.isArray(valueRaw) ? valueRaw : [];
  return source
    .map((choice) => ({
      choice_id: sanitizeText(choice?.choice_id),
      label_fr: sanitizeText(choice?.label_fr),
      next_node_id: sanitizeText(choice?.next_node_id),
      requires_flags_all: sanitizeStringList(choice?.requires_flags_all),
      requires_flags_any: sanitizeStringList(choice?.requires_flags_any),
      effects: normalizeDialogueEffectList(choice?.effects),
    }))
    .filter((choice) => choice.choice_id && choice.label_fr && choice.next_node_id);
}

function normalizeDialoguePayloadForWrite(dialogueId, payload = {}) {
  const id = sanitizeDataFileId(dialogueId, "dialogue_id");
  return validateDialoguePayload(
    {
      dialogue_id: id,
      title_fr: sanitizeText(payload?.title_fr),
      start_node_id: sanitizeText(payload?.start_node_id),
      nodes: (Array.isArray(payload?.nodes) ? payload.nodes : [])
        .map((node) => ({
          node_id: sanitizeText(node?.node_id),
          speaker_fr: sanitizeText(node?.speaker_fr),
          text_fr: sanitizeText(node?.text_fr),
          next_node_id: sanitizeText(node?.next_node_id),
          choices: normalizeDialogueChoiceList(node?.choices),
          effects_on_enter: normalizeDialogueEffectList(node?.effects_on_enter),
        }))
        .filter((node) => node.node_id && node.text_fr),
    },
    `Dialogue ${id}`,
  );
}

async function readDialoguePayload(dialogueId) {
  const filePath = getDialogueJsonPath(dialogueId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dialogue introuvable: ${dialogueId}`);
  }
  const raw = await fsp.readFile(filePath, "utf8");
  const payload = validateDialoguePayload(JSON.parse(raw), `Dialogue ${dialogueId}`);
  if (payload.dialogue_id !== sanitizeDataFileId(dialogueId, "dialogue_id")) {
    throw new Error(`Le fichier ${dialogueId}.json ne correspond pas a son dialogue_id.`);
  }
  return payload;
}

async function readDialoguePayloadSafe(dialogueId) {
  try {
    return {
      dialogue: await readDialoguePayload(dialogueId),
      error: "",
    };
  } catch (error) {
    return {
      dialogue: null,
      error: error instanceof Error ? error.message : String(error || "Erreur inconnue"),
    };
  }
}

function collectDialogueRouteRefs(routeModel, dialogueId) {
  const id = sanitizeText(dialogueId);
  if (!routeModel?.routeOrder?.length || !id) {
    return [];
  }
  const refs = [];
  for (const routeId of routeModel.routeOrder) {
    const routeMeta = routeModel.routeMetaById.get(routeId) || null;
    if (!routeMeta) {
      continue;
    }
    if (Array.isArray(routeMeta.arrival_dialogue_ids_once) && routeMeta.arrival_dialogue_ids_once.includes(id)) {
      refs.push({
        route_id: routeId,
        route_name_fr: sanitizeText(routeMeta.route_name_fr, routeId),
        source: "arrival_once",
        action_id: "",
      });
    }
    const zoneActions = Array.isArray(routeMeta.zone_actions) ? routeMeta.zone_actions : [];
    for (const action of zoneActions) {
      if (sanitizeText(action?.dialogue_id) !== id) {
        continue;
      }
      refs.push({
        route_id: routeId,
        route_name_fr: sanitizeText(routeMeta.route_name_fr, routeId),
        source: "zone_action",
        action_id: sanitizeText(action?.action_id),
      });
    }
  }
  return refs;
}

function buildDialogueValidation(dialogue, routeRefs = []) {
  const errors = [];
  const warnings = [];
  const nodes = Array.isArray(dialogue?.nodes) ? dialogue.nodes : [];
  const nodeMap = new Map();
  for (const node of nodes) {
    const nodeId = sanitizeText(node?.node_id);
    if (!nodeId) {
      continue;
    }
    if (nodeMap.has(nodeId)) {
      errors.push(`Node duplique: ${nodeId}`);
      continue;
    }
    nodeMap.set(nodeId, node);
  }

  const startNodeId = sanitizeText(dialogue?.start_node_id);
  if (!startNodeId || !nodeMap.has(startNodeId)) {
    errors.push(`start_node_id introuvable: ${startNodeId || "(vide)"}`);
  }

  const reachable = new Set();
  const stack = startNodeId && nodeMap.has(startNodeId) ? [startNodeId] : [];
  while (stack.length > 0) {
    const currentNodeId = stack.pop();
    if (!currentNodeId || reachable.has(currentNodeId)) {
      continue;
    }
    reachable.add(currentNodeId);
    const node = nodeMap.get(currentNodeId);
    const nextNodeId = sanitizeText(node?.next_node_id);
    if (nextNodeId) {
      stack.push(nextNodeId);
    }
    const choices = Array.isArray(node?.choices) ? node.choices : [];
    for (const choice of choices) {
      const choiceNextNodeId = sanitizeText(choice?.next_node_id);
      if (choiceNextNodeId) {
        stack.push(choiceNextNodeId);
      }
    }
  }

  const brokenLinks = [];
  const brokenChoices = [];
  const flagIds = new Set();
  let terminalNodeCount = 0;

  for (const node of nodes) {
    const nodeId = sanitizeText(node?.node_id);
    for (const effect of normalizeDialogueEffectList(node?.effects_on_enter)) {
      flagIds.add(effect.flag_id);
    }
    const nextNodeId = sanitizeText(node?.next_node_id);
    const choices = Array.isArray(node?.choices) ? node.choices : [];
    if (nextNodeId && !nodeMap.has(nextNodeId)) {
      brokenLinks.push({ from: nodeId, to: nextNodeId });
    }
    if (!nextNodeId && choices.length <= 0) {
      terminalNodeCount += 1;
    }
    for (const choice of choices) {
      const choiceId = sanitizeText(choice?.choice_id);
      const choiceNextNodeId = sanitizeText(choice?.next_node_id);
      if (choiceNextNodeId && !nodeMap.has(choiceNextNodeId)) {
        brokenChoices.push({ from: nodeId, choice_id: choiceId, to: choiceNextNodeId });
      }
      for (const flagId of sanitizeStringList(choice?.requires_flags_all)) {
        flagIds.add(flagId);
      }
      for (const flagId of sanitizeStringList(choice?.requires_flags_any)) {
        flagIds.add(flagId);
      }
      for (const effect of normalizeDialogueEffectList(choice?.effects)) {
        flagIds.add(effect.flag_id);
      }
    }
  }

  if (terminalNodeCount <= 0) {
    warnings.push("Aucun noeud terminal detecte.");
  }

  const orphanNodeIds = nodes
    .map((node) => sanitizeText(node?.node_id))
    .filter((nodeId) => nodeId && !reachable.has(nodeId));
  if (orphanNodeIds.length > 0) {
    warnings.push(`${orphanNodeIds.length} noeud(x) orphelin(s).`);
  }
  if (brokenLinks.length > 0) {
    errors.push(`${brokenLinks.length} lien(s) next_node_id casse(s).`);
  }
  if (brokenChoices.length > 0) {
    errors.push(`${brokenChoices.length} choix avec next_node_id casse(s).`);
  }

  return {
    ok: errors.length <= 0,
    errors,
    warnings,
    node_count: nodes.length,
    terminal_node_count: terminalNodeCount,
    orphan_node_ids: orphanNodeIds,
    broken_next_links: brokenLinks,
    broken_choice_links: brokenChoices,
    route_refs: routeRefs,
    flag_ids: Array.from(flagIds.values()).sort((left, right) => left.localeCompare(right)),
  };
}

function collectRouteFlagIds(routeModel) {
  const flags = new Set();
  if (!routeModel?.routeOrder?.length) {
    return [];
  }
  for (const routeId of routeModel.routeOrder) {
    const routeMeta = routeModel.routeMetaById.get(routeId) || null;
    if (!routeMeta) {
      continue;
    }
    for (const flagId of sanitizeStringList(routeMeta?.access_rules?.requires_flags_all)) {
      flags.add(flagId);
    }
    for (const flagId of sanitizeStringList(routeMeta?.access_rules?.requires_flags_any)) {
      flags.add(flagId);
    }
  }
  return Array.from(flags.values()).sort((left, right) => left.localeCompare(right));
}

async function loadDialogueStudioModel(routeModelInput = null) {
  const routeModel = routeModelInput || await loadRouteStudioModel();
  const dialogueIds = await listDialogueIds();
  const dialoguesById = new Map();
  const meta = [];
  const flagIds = new Set(collectRouteFlagIds(routeModel));

  for (const dialogueId of dialogueIds) {
    const safePayload = await readDialoguePayloadSafe(dialogueId);
    const routeRefs = collectDialogueRouteRefs(routeModel, dialogueId);
    if (!safePayload.dialogue) {
      meta.push({
        dialogue_id: dialogueId,
        title_fr: dialogueId,
        node_count: 0,
        route_refs: routeRefs,
        validation: {
          ok: false,
          errors: [safePayload.error],
          warnings: [],
          node_count: 0,
          terminal_node_count: 0,
          orphan_node_ids: [],
          broken_next_links: [],
          broken_choice_links: [],
          route_refs: routeRefs,
          flag_ids: [],
        },
      });
      continue;
    }
    dialoguesById.set(dialogueId, safePayload.dialogue);
    const validation = buildDialogueValidation(safePayload.dialogue, routeRefs);
    for (const flagId of validation.flag_ids) {
      flagIds.add(flagId);
    }
    meta.push({
      dialogue_id: dialogueId,
      title_fr: sanitizeText(safePayload.dialogue.title_fr, dialogueId),
      node_count: validation.node_count,
      route_refs: routeRefs,
      validation,
    });
  }

  return {
    routeModel,
    dialogueIds,
    dialoguesById,
    meta,
    flag_suggestions: Array.from(flagIds.values()).sort((left, right) => left.localeCompare(right)),
  };
}

async function writeDialogueData(dialogueId, payload) {
  const id = sanitizeDataFileId(dialogueId, "dialogue_id");
  const nextDialogue = normalizeDialoguePayloadForWrite(id, payload);
  const dialoguePath = getDialogueJsonPath(id);
  await fsp.mkdir(path.dirname(dialoguePath), { recursive: true });
  if (fs.existsSync(dialoguePath)) {
    await ensureBackup(dialoguePath);
  }
  await fsp.writeFile(dialoguePath, `${JSON.stringify(nextDialogue, null, 2)}\n`, "utf8");
  return nextDialogue;
}

async function duplicateDialogueData(sourceDialogueId, targetDialogueIdRaw = "") {
  const sourceDialogue = await readDialoguePayload(sourceDialogueId);
  const sourceId = sanitizeDataFileId(sourceDialogueId, "dialogue source");
  const targetDialogueId = sanitizeDataFileId(
    targetDialogueIdRaw || `${sourceId}_copy`,
    "dialogue cible",
  );
  const targetPath = getDialogueJsonPath(targetDialogueId);
  if (fs.existsSync(targetPath)) {
    throw new Error(`Le dialogue ${targetDialogueId} existe deja.`);
  }
  const duplicatedDialogue = {
    ...sourceDialogue,
    dialogue_id: targetDialogueId,
    title_fr: sanitizeText(sourceDialogue.title_fr, sourceId)
      ? `${sanitizeText(sourceDialogue.title_fr, sourceId)} (copie)`
      : `${targetDialogueId} (copie)`,
  };
  await writeDialogueData(targetDialogueId, duplicatedDialogue);
  return duplicatedDialogue;
}

async function deleteDialogueData(dialogueId, options = {}) {
  const id = sanitizeDataFileId(dialogueId, "dialogue_id");
  const routeModel = await loadRouteStudioModel();
  const routeRefs = collectDialogueRouteRefs(routeModel, id);
  if (routeRefs.length > 0 && options.force !== true) {
    throw new Error(`Le dialogue ${id} est encore reference par ${routeRefs.length} zone(s).`);
  }
  const dialoguePath = getDialogueJsonPath(id);
  if (!fs.existsSync(dialoguePath)) {
    throw new Error(`Dialogue introuvable: ${id}`);
  }
  await ensureBackup(dialoguePath);
  await fsp.unlink(dialoguePath);
  return {
    dialogue_id: id,
    route_refs: routeRefs,
  };
}

function getTalentPayload(model, pokemonId) {
  const id = Math.max(1, toSafeInt(pokemonId, 0));
  return model.byPokemonId.get(id) || null;
}

async function serveUi(response, filePath) {
  const html = await fsp.readFile(filePath, "utf8");
  sendHtml(response, 200, html);
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${HOST}:${PORT}`);
    const pathname = requestUrl.pathname;
    const method = String(request.method || "GET").toUpperCase();

    if (method === "GET" && pathname === "/") {
      const html = `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PokeIdle Data Studio</title>
    <style>
      body { font-family: "Trebuchet MS", "Segoe UI", sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(160deg, #fff7e1, #e9f5ec); color: #16202a; }
      .card { width: min(720px, 94%); background: #fff; border: 1px solid #d8e1e8; border-radius: 14px; box-shadow: 0 10px 28px rgba(24,32,40,.12); padding: 18px; }
      h1 { margin-top: 0; }
      .links { display: grid; gap: 10px; margin-top: 14px; }
      a { display: block; text-decoration: none; border: 1px solid #c7d3de; border-radius: 10px; padding: 12px; background: #f8fcff; color: #18406b; font-weight: 700; }
      a:hover { background: #edf6ff; border-color: #9cb8d1; }
      p { margin: 6px 0; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>PokeIdle Data Studio</h1>
      <p>Choisis ton outil d'edition no-code.</p>
      <div class="links">
        <a href="/route">Route Encounter Studio</a>
        <a href="/dialogues">Dialogue Studio</a>
        <a href="/talents">Talents Studio</a>
      </div>
    </main>
  </body>
</html>
      `;
      sendHtml(response, 200, html);
      return;
    }

    if (method === "GET" && pathname === "/route") {
      await serveUi(response, ROUTE_UI_INDEX_PATH);
      return;
    }
    if (method === "GET" && (pathname === "/dialogues" || pathname === "/dialogue")) {
      await serveUi(response, DIALOGUE_UI_INDEX_PATH);
      return;
    }
    if (method === "GET" && pathname === "/talents") {
      await serveUi(response, TALENT_UI_INDEX_PATH);
      return;
    }

    if (method === "GET" && pathname === "/api/pokemon-ref") {
      const refs = await loadPokemonReferences();
      sendJson(response, 200, { pokemon: refs.list });
      return;
    }

    if (method === "GET" && pathname.startsWith("/pokemon_data/")) {
      const resolvedPath = path.resolve(ROOT_DIR, `.${pathname}`);
      const pokemonDataRoot = path.resolve(POKEMON_DATA_DIR);
      if (!resolvedPath.startsWith(`${pokemonDataRoot}${path.sep}`)) {
        sendJson(response, 403, { error: "Chemin non autorise" });
        return;
      }
      if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
        sendJson(response, 404, { error: "Fichier introuvable" });
        return;
      }
      await sendFile(response, resolvedPath);
      return;
    }

    if (method === "GET" && pathname === "/api/route-encounters/meta") {
      const model = await loadRouteStudioModel();
      const dialogueModel = await loadDialogueStudioModel(model);
      sendJson(response, 200, {
        routes: buildRouteMetaList(model),
        method_choices: model.methodChoices,
        route_choices: buildRouteChoiceList(model),
        dialogue_choices: buildDialogueChoiceList(dialogueModel),
        flag_choices: dialogueModel.flag_suggestions,
      });
      return;
    }

    const routeMatch = pathname.match(/^\/api\/route-encounters\/([^/]+)$/);
    if (routeMatch && method === "GET") {
      const routeId = decodeURIComponent(routeMatch[1] || "");
      const model = await loadRouteStudioModel();
      const refs = await loadPokemonReferences();
      if (!model.routeRowsById.has(routeId)) {
        sendJson(response, 404, { error: `Route introuvable: ${routeId}` });
        return;
      }
      sendJson(response, 200, getRoutePayload(model, routeId, refs.byId));
      return;
    }
    if (routeMatch && method === "PUT") {
      const routeId = decodeURIComponent(routeMatch[1] || "");
      const payload = await readBodyJson(request);
      const refs = await loadPokemonReferences();
      const currentModel = await loadRouteStudioModel();
      const routeMeta = currentModel.routeMetaById.get(routeId);
      if (!routeMeta) {
        sendJson(response, 404, { error: `Route introuvable: ${routeId}` });
        return;
      }
      const updatedModel =
        routeMeta.storage_kind === "csv"
          ? await writeRouteCsv(routeId, payload, refs.byId)
          : await writeRouteJsonData(routeId, payload, refs.byId);
      sendJson(response, 200, {
        ok: true,
        route: getRoutePayload(updatedModel, routeId, refs.byId),
        routes: buildRouteMetaList(updatedModel),
      });
      return;
    }

    if (method === "GET" && pathname === "/api/dialogues/meta") {
      const routeModel = await loadRouteStudioModel();
      const dialogueModel = await loadDialogueStudioModel(routeModel);
      sendJson(response, 200, {
        dialogues: dialogueModel.meta,
        dialogue_choices: buildDialogueChoiceList(dialogueModel),
        route_choices: buildRouteChoiceList(routeModel),
        flag_choices: dialogueModel.flag_suggestions,
      });
      return;
    }

    const dialogueMatch = pathname.match(/^\/api\/dialogues\/([^/]+)$/);
    const duplicateDialogueMatch = pathname.match(/^\/api\/dialogues\/([^/]+)\/duplicate$/);

    if (duplicateDialogueMatch && method === "POST") {
      const sourceDialogueId = decodeURIComponent(duplicateDialogueMatch[1] || "");
      const payload = await readBodyJson(request);
      const duplicatedDialogue = await duplicateDialogueData(
        sourceDialogueId,
        sanitizeText(payload?.target_dialogue_id || payload?.dialogue_id),
      );
      const routeModel = await loadRouteStudioModel();
      const dialogueModel = await loadDialogueStudioModel(routeModel);
      const routeRefs = collectDialogueRouteRefs(routeModel, duplicatedDialogue.dialogue_id);
      sendJson(response, 200, {
        ok: true,
        dialogue: duplicatedDialogue,
        validation: buildDialogueValidation(duplicatedDialogue, routeRefs),
        dialogues: dialogueModel.meta,
      });
      return;
    }

    if (dialogueMatch && method === "GET") {
      const dialogueId = decodeURIComponent(dialogueMatch[1] || "");
      const routeModel = await loadRouteStudioModel();
      const dialogueModel = await loadDialogueStudioModel(routeModel);
      const dialogue = await readDialoguePayload(dialogueId);
      const routeRefs = collectDialogueRouteRefs(routeModel, dialogueId);
      const validation = buildDialogueValidation(dialogue, routeRefs);
      const flagChoices = Array.from(
        new Set([...(dialogueModel.flag_suggestions || []), ...(validation.flag_ids || [])]),
      ).sort((left, right) => left.localeCompare(right));
      sendJson(response, 200, {
        dialogue,
        validation,
        route_refs: routeRefs,
        route_choices: buildRouteChoiceList(routeModel),
        flag_choices: flagChoices,
      });
      return;
    }

    if (dialogueMatch && method === "PUT") {
      const dialogueId = decodeURIComponent(dialogueMatch[1] || "");
      const payload = await readBodyJson(request);
      const dialogue = await writeDialogueData(dialogueId, payload);
      const routeModel = await loadRouteStudioModel();
      const dialogueModel = await loadDialogueStudioModel(routeModel);
      const routeRefs = collectDialogueRouteRefs(routeModel, dialogueId);
      const validation = buildDialogueValidation(dialogue, routeRefs);
      sendJson(response, 200, {
        ok: true,
        dialogue,
        validation,
        dialogues: dialogueModel.meta,
        flag_choices: dialogueModel.flag_suggestions,
      });
      return;
    }

    if (dialogueMatch && method === "DELETE") {
      const dialogueId = decodeURIComponent(dialogueMatch[1] || "");
      const forceDelete =
        requestUrl.searchParams.get("force") === "1" || requestUrl.searchParams.get("force") === "true";
      const result = await deleteDialogueData(dialogueId, { force: forceDelete });
      const routeModel = await loadRouteStudioModel();
      const dialogueModel = await loadDialogueStudioModel(routeModel);
      sendJson(response, 200, {
        ok: true,
        deleted: result,
        dialogues: dialogueModel.meta,
      });
      return;
    }

    if (method === "GET" && pathname === "/api/talents/meta") {
      const model = await loadTalentsCsvModel();
      const rows = model.order.map((pokemonId) => model.byPokemonId.get(pokemonId)).filter(Boolean);
      const noneCount = rows.filter((row) => String(row?.talent_id || "").toUpperCase() === "NONE").length;
      sendJson(response, 200, {
        count: rows.length,
        none_count: noneCount,
      });
      return;
    }

    if (method === "GET" && pathname === "/api/talents") {
      const model = await loadTalentsCsvModel();
      const rows = model.order.map((pokemonId) => model.byPokemonId.get(pokemonId)).filter(Boolean);
      sendJson(response, 200, { rows });
      return;
    }

    const talentMatch = pathname.match(/^\/api\/talents\/(\d+)$/);
    if (talentMatch && method === "GET") {
      const pokemonId = Number(talentMatch[1] || "0");
      const model = await loadTalentsCsvModel();
      const row = getTalentPayload(model, pokemonId);
      if (!row) {
        sendJson(response, 404, { error: `Pokemon #${pokemonId} introuvable dans le CSV talents` });
        return;
      }
      sendJson(response, 200, { row });
      return;
    }
    if (talentMatch && method === "PUT") {
      const pokemonId = Number(talentMatch[1] || "0");
      const payload = await readBodyJson(request);
      const refs = await loadPokemonReferences();
      const nextModel = await writeTalentRow(pokemonId, payload, refs.byId);
      const row = getTalentPayload(nextModel, pokemonId);
      sendJson(response, 200, { ok: true, row });
      return;
    }

    sendText(response, 404, "Not found");
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error || "Erreur interne"),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[data-studio] http://${HOST}:${PORT}`);
  console.log(`[data-studio] route csv: ${path.relative(ROOT_DIR, ROUTE_CSV_PATH)}`);
  console.log(`[data-studio] talents csv: ${path.relative(ROOT_DIR, TALENTS_CSV_PATH)}`);
});
