const CP1252_EXTENDED_CHAR_TO_BYTE = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const LIKELY_MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.|ï¿½)/;
const FRENCH_TYPO_REPLACEMENTS = Object.freeze([
  [/Teleport \+\+/g, "Téléport ++"],
  [/Teleport \+/g, "Téléport +"],
  [/Teleport\b/g, "Téléport"],
  [/Oeil\b/g, "Œil"],
  [/\bPokedex\b/g, "Pokédex"],
  [/\bPokemon\b/g, "Pokémon"],
  [/\bPokemons\b/g, "Pokémons"],
  [/\bequipe\b/g, "équipe"],
  [/\bEquipe\b/g, "Équipe"],
  [/\bApres\b/g, "Après"],
  [/\bapres\b/g, "après"],
  [/\bavoir attaque\b/g, "avoir attaqué"],
  [/\bechanger\b/g, "échanger"],
  [/\binstantanement\b/g, "instantanément"],
  [/\ballie echange\b/g, "allié échangé"],
  [/\ballie\b/g, "allié"],
  [/\baleatoire\b/g, "aléatoire"],
  [/\bjusqu'a\b/g, "jusqu'à"],
  [/\bdegats\b/g, "dégâts"],
  [/\bargent gagne\b/g, "argent gagné"],
  [/\bdégâts critique\b/g, "dégâts critiques"],
  [/\bevolue\b/g, "évolue"],
  [/\bEvolution\b/g, "Évolution"],
  [/\bevolution\b/g, "évolution"],
]);

function toNfc(text) {
  try {
    return String(text ?? "").normalize("NFC");
  } catch {
    return String(text ?? "");
  }
}

function countLikelyMojibake(text) {
  const matches = String(text || "").match(/(?:Ã.|Â.|â.|ï¿½)/g);
  return Array.isArray(matches) ? matches.length : 0;
}

function mapCharToCp1252Byte(char) {
  const codePoint = char.codePointAt(0);
  if (!Number.isFinite(codePoint)) {
    return null;
  }
  if (codePoint >= 0 && codePoint <= 0xff) {
    return codePoint;
  }
  return CP1252_EXTENDED_CHAR_TO_BYTE.get(codePoint) ?? null;
}

function decodeLikelyUtf8MojibakePass(input) {
  const chars = Array.from(String(input ?? ""));
  const bytes = new Uint8Array(chars.length);
  for (let index = 0; index < chars.length; index += 1) {
    const byte = mapCharToCp1252Byte(chars[index]);
    if (byte == null) {
      return input;
    }
    bytes[index] = byte;
  }

  let decoded = String(input ?? "");
  try {
    decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return input;
  }
  if (!decoded || decoded === input) {
    return input;
  }
  return countLikelyMojibake(decoded) <= countLikelyMojibake(input) ? decoded : input;
}

function decodeLikelyUtf8Mojibake(text) {
  let current = String(text ?? "");
  for (let pass = 0; pass < 3; pass += 1) {
    if (!LIKELY_MOJIBAKE_PATTERN.test(current)) {
      break;
    }
    const next = decodeLikelyUtf8MojibakePass(current);
    if (!next || next === current) {
      break;
    }
    current = next;
  }
  return current;
}

export function applyCommonFrenchTypography(text) {
  let output = String(text ?? "");
  for (const [pattern, replacement] of FRENCH_TYPO_REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

export function normalizeUiDisplayText(rawValue, options = {}) {
  const frenchTypography = Boolean(options.frenchTypography);
  let text = toNfc(rawValue);
  text = decodeLikelyUtf8Mojibake(text);
  text = toNfc(text);
  if (frenchTypography) {
    text = applyCommonFrenchTypography(text);
  }
  return text;
}
