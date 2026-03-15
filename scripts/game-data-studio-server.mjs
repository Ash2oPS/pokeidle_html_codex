#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { parseCsvMethods, parseCsvObjects, readCsvCell } from "../lib/runtime-data.js";

const HOST = process.env.DATA_STUDIO_HOST || "127.0.0.1";
const PORT = Number(process.env.DATA_STUDIO_PORT || 4877);
const ROOT_DIR = path.resolve(process.cwd());
const ROUTE_UI_INDEX_PATH = path.join(ROOT_DIR, "tools", "route-encounter-studio", "index.html");
const TALENT_UI_INDEX_PATH = path.join(ROOT_DIR, "tools", "talents-studio", "index.html");
const MAP_DATA_DIR = path.join(ROOT_DIR, "map_data");
const ROUTE_CSV_PATH = path.resolve(
  process.env.DATA_STUDIO_ROUTE_CSV || path.join(ROOT_DIR, "map_data", "kanto_zone_encounters.csv"),
);
const TALENTS_CSV_PATH = path.resolve(
  process.env.DATA_STUDIO_TALENTS_CSV || path.join(ROOT_DIR, "pokemon_data", "pokemon_talents.csv"),
);
const POKEMON_DATA_DIR = path.join(ROOT_DIR, "pokemon_data");
const BACKUP_DIR = path.join(ROOT_DIR, "output", "tool-backups");
const MAX_BODY_BYTES = 2 * 1024 * 1024;
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
  return Math.max(1, toSafeInt(valueRaw, fallback));
}

function normalizeUnlockTimerMs(valueRaw, fallback = DEFAULT_UNLOCK_TIMER_MS) {
  return Math.max(1000, toSafeInt(valueRaw, fallback));
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
  return {
    route_id: sanitizeText(routeId, sanitizeText(base.route_id)),
    route_name_fr: sanitizeText(routeJson?.route_name_fr, sanitizeText(base.route_name_fr, sanitizeText(routeId))),
    zone_type: normalizeZoneType(routeJson?.zone_type, normalizeZoneType(base.zone_type, "route")),
    combat_enabled: combatEnabled,
    unlock_mode: normalizeUnlockMode(routeJson?.unlock_mode || base.unlock_mode, combatEnabled),
    unlock_defeats_required: normalizeUnlockDefeatsRequired(
      routeJson?.unlock_defeats_required,
      normalizeUnlockDefeatsRequired(base.unlock_defeats_required, DEFAULT_UNLOCK_DEFEATS_REQUIRED),
    ),
    unlock_timer_ms: normalizeUnlockTimerMs(
      routeJson?.unlock_timer_ms,
      normalizeUnlockTimerMs(base.unlock_timer_ms, DEFAULT_UNLOCK_TIMER_MS),
    ),
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
  const nextJson = {
    ...previous,
    route_id: id,
    route_name_fr: sanitizeText(payload?.route_name_fr, sanitizeText(previous?.route_name_fr, id)),
    zone_type: normalizeZoneType(payload?.zone_type, normalizeZoneType(previous?.zone_type, "route")),
    combat_enabled: combatEnabled,
    unlock_mode: nextUnlockMode,
    unlock_defeats_required: normalizeUnlockDefeatsRequired(
      payload?.unlock_defeats_required,
      previous?.unlock_defeats_required,
    ),
    unlock_timer_ms: normalizeUnlockTimerMs(payload?.unlock_timer_ms, previous?.unlock_timer_ms),
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
        unlock_defeats_required: DEFAULT_UNLOCK_DEFEATS_REQUIRED,
        unlock_timer_ms: DEFAULT_UNLOCK_TIMER_MS,
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
  const unlockDefeatsRequired = normalizeUnlockDefeatsRequired(
    payload?.unlock_defeats_required,
    existingMeta.unlock_defeats_required,
  );
  const unlockTimerMs = normalizeUnlockTimerMs(payload?.unlock_timer_ms, existingMeta.unlock_timer_ms);
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
  return loadRouteCsvModel();
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
        pokemon_name_en: row.pokemon_name_en,
        pokemon_name_fr: row.pokemon_name_fr,
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
      const model = await loadRouteCsvModel();
      sendJson(response, 200, {
        routes: buildRouteMetaList(model),
        method_choices: model.methodChoices,
      });
      return;
    }

    const routeMatch = pathname.match(/^\/api\/route-encounters\/([^/]+)$/);
    if (routeMatch && method === "GET") {
      const routeId = decodeURIComponent(routeMatch[1] || "");
      const model = await loadRouteCsvModel();
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
      const updatedModel = await writeRouteCsv(routeId, payload, refs.byId);
      sendJson(response, 200, {
        ok: true,
        route: getRoutePayload(updatedModel, routeId, refs.byId),
        routes: buildRouteMetaList(updatedModel),
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
