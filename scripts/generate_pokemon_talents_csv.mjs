import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TALENT_ID = "NONE";
const TALENT_NAME_FR = "Aucun";
const TALENT_NAME_EN = "NONE";
const TALENT_DESCRIPTION_FR = "Aucun effet passif pour le moment.";
const TALENT_OVERRIDES_BY_POKEMON_ID = Object.freeze({
  129: Object.freeze({
    talent_id: "LOSER",
    talent_name_fr: "Perdant",
    talent_name_en: "Loser",
    talent_description_fr: "N'attaque jamais.",
  }),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const pokemonDataDir = path.join(projectRoot, "pokemon_data");
const outputPath = path.join(pokemonDataDir, "pokemon_talents.csv");

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function toCsvLine(cells) {
  return cells.map((cell) => escapeCsvCell(cell)).join(",");
}

async function resolvePokemonDataPath(folderPath, id, slug) {
  const expected = path.join(folderPath, `${id}_${slug}_data.json`);
  try {
    await fs.access(expected);
    return expected;
  } catch {
    const files = await fs.readdir(folderPath);
    return files
      .filter((name) => name.endsWith("_data.json"))
      .map((name) => path.join(folderPath, name))
      .sort()[0] || null;
  }
}

async function loadPokemonRows() {
  const dirents = await fs.readdir(pokemonDataDir, { withFileTypes: true });
  const rows = [];

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const match = /^(\d+)_([a-z0-9_-]+)$/i.exec(dirent.name);
    if (!match) {
      continue;
    }

    const id = Number(match[1]);
    const slug = String(match[2] || "").toLowerCase();
    const folderPath = path.join(pokemonDataDir, dirent.name);
    const jsonPath = await resolvePokemonDataPath(folderPath, id, slug);
    if (!jsonPath) {
      continue;
    }

    try {
      const payload = JSON.parse(await fs.readFile(jsonPath, "utf8"));
      const nameFr = String(payload?.name_fr || payload?.name_en || slug).trim();
      const nameEn = String(payload?.name_en || slug).trim().toLowerCase();
      const talentOverride = TALENT_OVERRIDES_BY_POKEMON_ID[id] || null;
      rows.push({
        pokemon_id: id,
        pokemon_name_fr: nameFr,
        pokemon_name_en: nameEn,
        talent_id: talentOverride?.talent_id || TALENT_ID,
        talent_name_fr: talentOverride?.talent_name_fr || TALENT_NAME_FR,
        talent_name_en: talentOverride?.talent_name_en || TALENT_NAME_EN,
        talent_description_fr: talentOverride?.talent_description_fr || TALENT_DESCRIPTION_FR,
      });
    } catch {
      // Skip malformed files and continue export.
    }
  }

  rows.sort((a, b) => a.pokemon_id - b.pokemon_id);
  return rows;
}

async function main() {
  const rows = await loadPokemonRows();
  const header = [
    "pokemon_id",
    "pokemon_name_fr",
    "pokemon_name_en",
    "talent_id",
    "talent_name_fr",
    "talent_name_en",
    "talent_description_fr",
  ];
  const lines = [toCsvLine(header)];
  for (const row of rows) {
    lines.push(
      toCsvLine([
        row.pokemon_id,
        row.pokemon_name_fr,
        row.pokemon_name_en,
        row.talent_id,
        row.talent_name_fr,
        row.talent_name_en,
        row.talent_description_fr,
      ]),
    );
  }
  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`CSV talents genere: ${outputPath} (${rows.length} Pokemon)`);
}

main().catch((error) => {
  console.error("Echec generation CSV talents:", error);
  process.exitCode = 1;
});
