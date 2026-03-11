import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { parseCsvMethods } from "../lib/runtime-data.js";

const ROOT_DIR = process.cwd();
const MAP_DIR = path.join(ROOT_DIR, "map_data");
const INPUT_XLSX_PATH = path.join(MAP_DIR, "kanto_zone_encounters_editor.xlsx");
const OUTPUT_CSV_PATH = path.join(MAP_DIR, "kanto_zone_encounters.csv");
const UTF8_BOM = "\uFEFF";

const OUTPUT_HEADERS = Object.freeze([
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

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function csvEscape(value) {
  const raw = String(value ?? "");
  if (raw.includes("\"") || raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
}

function normalizeCellValue(value) {
  if (value === null || typeof value === "undefined") {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "formula")) {
      if (typeof value.result !== "undefined" && value.result !== null) {
        return normalizeCellValue(value.result);
      }
      return "";
    }
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => String(part?.text ?? "")).join("").trim();
    }
    if (typeof value.text === "string") {
      return value.text.trim();
    }
    if (typeof value.result !== "undefined" && value.result !== null) {
      return normalizeCellValue(value.result);
    }
    if (typeof value.hyperlink === "string") {
      return String(value.hyperlink || "").trim();
    }
  }
  return "";
}

function parseBooleanCell(valueRaw, fallback = "true") {
  const value = String(valueRaw || "").toLowerCase().trim();
  if (!value) {
    return fallback;
  }
  if (["0", "false", "no", "n", "non", "off"].includes(value)) {
    return "false";
  }
  return "true";
}

function parseMethodsFromSheetRow(row) {
  const directRaw = normalizeCellValue(row.getCell(14).value);
  let methods = parseCsvMethods(directRaw);
  if (methods.length === 0) {
    const merged = [11, 12, 13]
      .map((cellIndex) => normalizeCellValue(row.getCell(cellIndex).value).toLowerCase())
      .filter(Boolean);
    methods = parseCsvMethods(merged.join("|"));
  }
  const deduped = [];
  const seen = new Set();
  for (const method of methods) {
    if (method === "[object object]") {
      continue;
    }
    if (!seen.has(method)) {
      seen.add(method);
      deduped.push(method);
    }
  }
  return deduped.join("|");
}

function readPokemonRefSheet(refSheet) {
  const refs = new Map();
  if (!refSheet) {
    return refs;
  }
  for (let rowIndex = 2; rowIndex <= refSheet.rowCount; rowIndex += 1) {
    const row = refSheet.getRow(rowIndex);
    const id = Math.max(0, toSafeInt(normalizeCellValue(row.getCell(1).value), 0));
    if (id <= 0) {
      continue;
    }
    const nameEn = normalizeCellValue(row.getCell(2).value).toLowerCase();
    const nameFr = normalizeCellValue(row.getCell(3).value);
    if (!nameEn) {
      continue;
    }
    refs.set(id, { name_en: nameEn, name_fr: nameFr || nameEn });
  }
  return refs;
}

async function main() {
  if (!fs.existsSync(INPUT_XLSX_PATH)) {
    throw new Error(`Workbook introuvable: ${INPUT_XLSX_PATH}`);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(INPUT_XLSX_PATH);

  const encounterSheet = workbook.getWorksheet("Encounters");
  if (!encounterSheet) {
    throw new Error("Feuille Encounters introuvable dans le workbook");
  }
  const pokemonRefs = readPokemonRefSheet(workbook.getWorksheet("PokemonRef"));

  const lines = [OUTPUT_HEADERS.join(",")];
  let droppedRows = 0;
  let writtenRows = 0;

  for (let rowIndex = 2; rowIndex <= encounterSheet.rowCount; rowIndex += 1) {
    const row = encounterSheet.getRow(rowIndex);
    const routeId = normalizeCellValue(row.getCell(1).value);
    if (!routeId) {
      continue;
    }
    const routeNameFr = normalizeCellValue(row.getCell(2).value);
    const zoneType = normalizeCellValue(row.getCell(3).value).toLowerCase() || "route";
    const combatEnabled = parseBooleanCell(normalizeCellValue(row.getCell(4).value), "true");
    const pokemonId = Math.max(0, toSafeInt(normalizeCellValue(row.getCell(5).value), 0));

    if (pokemonId <= 0) {
      lines.push(
        [
          routeId,
          routeNameFr,
          zoneType,
          combatEnabled,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]
          .map(csvEscape)
          .join(","),
      );
      writtenRows += 1;
      continue;
    }

    const ref = pokemonRefs.get(pokemonId) || null;
    const rawNameEn = normalizeCellValue(row.getCell(7).value).toLowerCase();
    const rawNameFr = normalizeCellValue(row.getCell(6).value);
    const pokemonNameEn = String(ref?.name_en || rawNameEn || "").toLowerCase().trim();
    const pokemonNameFr = String(ref?.name_fr || rawNameFr || pokemonNameEn).trim();
    if (!pokemonNameEn) {
      droppedRows += 1;
      continue;
    }

    const spawnWeight = Math.max(1, toSafeInt(normalizeCellValue(row.getCell(8).value), 1));
    const minLevel = Math.max(1, toSafeInt(normalizeCellValue(row.getCell(9).value), 1));
    const maxLevel = Math.max(minLevel, toSafeInt(normalizeCellValue(row.getCell(10).value), minLevel));
    const methods = parseMethodsFromSheetRow(row);

    lines.push(
      [
        routeId,
        routeNameFr,
        zoneType,
        combatEnabled,
        pokemonId,
        pokemonNameEn,
        pokemonNameFr,
        spawnWeight,
        minLevel,
        maxLevel,
        methods,
      ]
        .map(csvEscape)
        .join(","),
    );
    writtenRows += 1;
  }

  fs.writeFileSync(OUTPUT_CSV_PATH, `${UTF8_BOM}${lines.join("\n")}\n`, "utf8");

  console.log(`[ok] CSV runtime exporte: ${path.relative(ROOT_DIR, OUTPUT_CSV_PATH)} (${writtenRows} lignes)`);
  if (droppedRows > 0) {
    console.log(`[warn] ${droppedRows} ligne(s) ignoree(s): pokemon_id sans nom anglais resolvable`);
  }
}

main().catch((error) => {
  console.error("[error] Export workbook -> CSV impossible:", error?.message || error);
  process.exitCode = 1;
});
