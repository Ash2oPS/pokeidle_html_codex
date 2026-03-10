import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const MAP_DIR = path.join(ROOT_DIR, "map_data");
const CATALOG_PATH = path.join(MAP_DIR, "kanto_frlg_zones.json");
const OUTPUT_PATH = path.join(MAP_DIR, "kanto_zone_encounters.csv");
const UTF8_BOM = "\uFEFF";

function csvEscape(value) {
  const raw = String(value ?? "");
  if (raw.includes("\"") || raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
}

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function getZoneOrder() {
  if (fs.existsSync(CATALOG_PATH)) {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    if (Array.isArray(catalog?.zone_order) && catalog.zone_order.length > 0) {
      return catalog.zone_order.map((id) => String(id || "")).filter(Boolean);
    }
  }

  const files = fs
    .readdirSync(MAP_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^kanto_(route|city|dungeon)_.*\.json$/i.test(entry.name))
    .map((entry) => entry.name.replace(/\.json$/i, ""))
    .sort((a, b) => a.localeCompare(b));
  return files;
}

function readZoneJson(zoneId) {
  const filePath = path.join(MAP_DIR, `${zoneId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function buildCsvRows() {
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
  const lines = [header.map(csvEscape).join(",")];

  const zoneOrder = getZoneOrder();
  for (const zoneId of zoneOrder) {
    const zone = readZoneJson(zoneId);
    if (!zone || !zone.route_id) {
      continue;
    }
    const base = {
      route_id: String(zone.route_id || zoneId),
      route_name_fr: String(zone.route_name_fr || zoneId),
      zone_type: String(zone.zone_type || "route"),
      combat_enabled: zone.combat_enabled === false ? "false" : "true",
    };
    const encounters = Array.isArray(zone.encounters)
      ? zone.encounters.slice().sort((a, b) => toSafeInt(b?.spawn_weight, 1) - toSafeInt(a?.spawn_weight, 1) || toSafeInt(a?.id, 0) - toSafeInt(b?.id, 0))
      : [];

    if (encounters.length <= 0) {
      const emptyRow = [
        base.route_id,
        base.route_name_fr,
        base.zone_type,
        base.combat_enabled,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      lines.push(emptyRow.map(csvEscape).join(","));
      continue;
    }

    for (const encounter of encounters) {
      const methods = Array.isArray(encounter?.methods)
        ? encounter.methods.map((method) => String(method || "").toLowerCase().trim()).filter(Boolean)
        : [];
      const row = [
        base.route_id,
        base.route_name_fr,
        base.zone_type,
        base.combat_enabled,
        toSafeInt(encounter?.id, 0) || "",
        String(encounter?.name_en || "").toLowerCase().trim(),
        String(encounter?.name_fr || "").trim(),
        Math.max(1, toSafeInt(encounter?.spawn_weight, 1)),
        Math.max(1, toSafeInt(encounter?.min_level, 1)),
        Math.max(1, toSafeInt(encounter?.max_level, Math.max(1, toSafeInt(encounter?.min_level, 1)))),
        methods.join("|"),
      ];
      lines.push(row.map(csvEscape).join(","));
    }
  }

  return lines;
}

function main() {
  const lines = buildCsvRows();
  fs.writeFileSync(OUTPUT_PATH, `${UTF8_BOM}${lines.join("\n")}\n`, "utf8");
  console.log(`[ok] CSV exporte: ${path.relative(ROOT_DIR, OUTPUT_PATH)} (${Math.max(0, lines.length - 1)} lignes de data)`);
}

main();
