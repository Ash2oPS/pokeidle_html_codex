import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { parseCsvMethods, parseCsvObjects, readCsvCell } from "../lib/runtime-data.js";

const ROOT_DIR = process.cwd();
const MAP_DIR = path.join(ROOT_DIR, "map_data");
const POKEMON_DIR = path.join(ROOT_DIR, "pokemon_data");
const SOURCE_CSV_PATH = path.join(MAP_DIR, "kanto_zone_encounters.csv");
const OUTPUT_XLSX_PATH = path.join(MAP_DIR, "kanto_zone_encounters_editor.xlsx");
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
const BASE_ZONE_TYPES = Object.freeze(["route", "city", "dungeon"]);
const BASE_COMBAT_FLAGS = Object.freeze(["true", "false"]);

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function loadEncounterRows() {
  const rawCsv = fs.readFileSync(SOURCE_CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  return parseCsvObjects(rawCsv, SOURCE_CSV_PATH);
}

function loadPokemonRefs() {
  const byId = new Map();
  const dirents = fs
    .readdirSync(POKEMON_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dirent of dirents) {
    const folder = dirent.name;
    const dataPath = path.join(POKEMON_DIR, folder, `${folder}_data.json`);
    if (!fs.existsSync(dataPath)) {
      continue;
    }
    try {
      const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      const id = toSafeInt(payload?.pokedex_number, 0);
      const nameEn = normalizeText(payload?.name_en).toLowerCase();
      const nameFr = normalizeText(payload?.name_fr || payload?.name_en);
      if (id > 0 && nameEn) {
        byId.set(id, {
          id,
          name_en: nameEn,
          name_fr: nameFr,
        });
      }
    } catch {
      // ignore malformed pokemon payloads
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

function collectMethodChoices(rows) {
  const seen = new Set(BASE_METHODS);
  const ordered = [...BASE_METHODS];
  for (const row of rows) {
    const methods = parseCsvMethods(readCsvCell(row, "methods"));
    for (const method of methods) {
      if (!seen.has(method)) {
        seen.add(method);
        ordered.push(method);
      }
    }
  }
  return ordered;
}

function setHeaderStyle(cell) {
  cell.font = { bold: true, color: { argb: "FF1F2937" } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
  };
}

function buildLookupFormula(rowIndex, targetColLetter, refLastRow) {
  return `IF($E${rowIndex}="","",IFERROR(INDEX(PokemonRef!$${targetColLetter}$2:$${targetColLetter}$${refLastRow},MATCH($E${rowIndex},PokemonRef!$A$2:$A$${refLastRow},0)),""))`;
}

function buildMethodsFormula(rowIndex) {
  return `IF($E${rowIndex}="","",TEXTJOIN("|",TRUE,K${rowIndex}:M${rowIndex}))`;
}

function main() {
  if (!fs.existsSync(SOURCE_CSV_PATH)) {
    throw new Error(`Fichier source introuvable: ${SOURCE_CSV_PATH}`);
  }
  const encounterRows = loadEncounterRows();
  const pokemonRefs = loadPokemonRefs();
  if (pokemonRefs.length === 0) {
    throw new Error(`Aucune reference Pokemon trouvee dans ${POKEMON_DIR}`);
  }
  const methodChoices = collectMethodChoices(encounterRows);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Codex";
  workbook.created = new Date();
  workbook.modified = new Date();

  const guideSheet = workbook.addWorksheet("Guide");
  guideSheet.columns = [{ width: 120 }];
  guideSheet.addRow(["Edition des rencontres"]);
  guideSheet.addRow([
    "Utilise la feuille Encounters. Saisis pokemon_id, poids, niveaux et method_1/2/3. Les noms et methods se remplissent automatiquement.",
  ]);
  guideSheet.addRow([
    "Ensuite exporte vers le CSV runtime avec: npm run zone:editor:export",
  ]);
  guideSheet.getCell("A1").font = { bold: true, size: 14 };
  guideSheet.getCell("A2").alignment = { wrapText: true };
  guideSheet.getCell("A3").alignment = { wrapText: true };

  const listSheet = workbook.addWorksheet("Lists");
  listSheet.columns = [{ width: 20 }, { width: 20 }, { width: 24 }];
  listSheet.getCell("A1").value = "zone_type";
  listSheet.getCell("B1").value = "combat_enabled";
  listSheet.getCell("C1").value = "encounter_method";
  for (let i = 0; i < BASE_ZONE_TYPES.length; i += 1) {
    listSheet.getCell(`A${i + 2}`).value = BASE_ZONE_TYPES[i];
  }
  for (let i = 0; i < BASE_COMBAT_FLAGS.length; i += 1) {
    listSheet.getCell(`B${i + 2}`).value = BASE_COMBAT_FLAGS[i];
  }
  for (let i = 0; i < methodChoices.length; i += 1) {
    listSheet.getCell(`C${i + 2}`).value = methodChoices[i];
  }
  listSheet.state = "veryHidden";

  const pokemonRefSheet = workbook.addWorksheet("PokemonRef");
  pokemonRefSheet.columns = [
    { header: "pokemon_id", key: "id", width: 14 },
    { header: "pokemon_name_en", key: "name_en", width: 22 },
    { header: "pokemon_name_fr", key: "name_fr", width: 22 },
  ];
  for (const key of ["A1", "B1", "C1"]) {
    setHeaderStyle(pokemonRefSheet.getCell(key));
  }
  for (const ref of pokemonRefs) {
    pokemonRefSheet.addRow(ref);
  }
  pokemonRefSheet.state = "veryHidden";

  const encounterSheet = workbook.addWorksheet("Encounters", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  encounterSheet.columns = [
    { header: "route_id", key: "route_id", width: 28 },
    { header: "route_name_fr", key: "route_name_fr", width: 28 },
    { header: "zone_type", key: "zone_type", width: 14 },
    { header: "combat_enabled", key: "combat_enabled", width: 14 },
    { header: "pokemon_id", key: "pokemon_id", width: 12 },
    { header: "pokemon_name_fr", key: "pokemon_name_fr", width: 20 },
    { header: "pokemon_name_en", key: "pokemon_name_en", width: 20 },
    { header: "spawn_weight", key: "spawn_weight", width: 12 },
    { header: "min_level", key: "min_level", width: 10 },
    { header: "max_level", key: "max_level", width: 10 },
    { header: "method_1", key: "method_1", width: 14 },
    { header: "method_2", key: "method_2", width: 14 },
    { header: "method_3", key: "method_3", width: 14 },
    { header: "methods", key: "methods", width: 22 },
    { header: "notes", key: "notes", width: 42 },
  ];
  for (let col = 1; col <= encounterSheet.columnCount; col += 1) {
    setHeaderStyle(encounterSheet.getRow(1).getCell(col));
  }

  const pokemonRefLastRow = Math.max(2, pokemonRefs.length + 1);
  for (const row of encounterRows) {
    const methods = parseCsvMethods(readCsvCell(row, "methods"));
    const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
    const inserted = encounterSheet.addRow({
      route_id: readCsvCell(row, "route_id"),
      route_name_fr: readCsvCell(row, "route_name_fr"),
      zone_type: readCsvCell(row, "zone_type") || "route",
      combat_enabled: readCsvCell(row, "combat_enabled") || "true",
      pokemon_id: pokemonId > 0 ? pokemonId : "",
      spawn_weight: pokemonId > 0 ? Math.max(1, toSafeInt(readCsvCell(row, "spawn_weight"), 1)) : "",
      min_level: pokemonId > 0 ? Math.max(1, toSafeInt(readCsvCell(row, "min_level"), 1)) : "",
      max_level: pokemonId > 0 ? Math.max(1, toSafeInt(readCsvCell(row, "max_level"), 1)) : "",
      method_1: methods[0] || "",
      method_2: methods[1] || "",
      method_3: methods[2] || "",
      methods: "",
      notes: "",
    });

    const rowIndex = inserted.number;
    if (pokemonId > 0) {
      inserted.getCell("F").value = { formula: buildLookupFormula(rowIndex, "C", pokemonRefLastRow) };
      inserted.getCell("G").value = { formula: buildLookupFormula(rowIndex, "B", pokemonRefLastRow) };
      if (methods.length > 3) {
        inserted.getCell("N").value = methods.join("|");
        inserted.getCell("O").value = `methods > 3 detectees, conservees telles quelles: ${methods.slice(3).join("|")}`;
      } else {
        inserted.getCell("N").value = { formula: buildMethodsFormula(rowIndex) };
      }
    }
  }

  encounterSheet.autoFilter = "A1:O1";
  encounterSheet.getColumn("F").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0FDF4" },
  };
  encounterSheet.getColumn("G").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0FDF4" },
  };
  encounterSheet.getColumn("N").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0FDF4" },
  };

  const listMethodLastRow = Math.max(2, methodChoices.length + 1);
  const validationLastRow = Math.max(encounterSheet.rowCount + 220, 620);
  for (let rowIndex = 2; rowIndex <= validationLastRow; rowIndex += 1) {
    encounterSheet.getCell(`C${rowIndex}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["=Lists!$A$2:$A$4"],
    };
    encounterSheet.getCell(`D${rowIndex}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["=Lists!$B$2:$B$3"],
    };
    for (const col of ["K", "L", "M"]) {
      encounterSheet.getCell(`${col}${rowIndex}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`=Lists!$C$2:$C$${listMethodLastRow}`],
      };
    }
  }

  encounterSheet.getColumn("E").numFmt = "0";
  encounterSheet.getColumn("H").numFmt = "0";
  encounterSheet.getColumn("I").numFmt = "0";
  encounterSheet.getColumn("J").numFmt = "0";

  fs.mkdirSync(path.dirname(OUTPUT_XLSX_PATH), { recursive: true });
  workbook.xlsx
    .writeFile(OUTPUT_XLSX_PATH)
    .then(() => {
      console.log(
        `[ok] Workbook genere: ${path.relative(ROOT_DIR, OUTPUT_XLSX_PATH)} (${Math.max(0, encounterRows.length)} lignes de rencontre)`,
      );
      console.log("[info] Export runtime CSV: npm run zone:editor:export");
    })
    .catch((error) => {
      console.error("[error] Generation workbook impossible:", error?.message || error);
      process.exitCode = 1;
    });
}

main();
