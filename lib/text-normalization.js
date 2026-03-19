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

const LIKELY_MOJIBAKE_PATTERN = /(?:\u00c3.|\u00c2.|\u00e2.|\ufffd)/;

const FRENCH_TYPO_REPLACEMENTS = Object.freeze([
  [/\bTeleport \+\+/g, "T\u00e9l\u00e9port ++"],
  [/\bTeleport \+/g, "T\u00e9l\u00e9port +"],
  [/\bTeleport\b/g, "T\u00e9l\u00e9port"],
  [/\bOeil\b/g, "\u0152il"],
  [/\bPokedex\b/g, "Pok\u00e9dex"],
  [/\bPokedollars\b/g, "Pok\u00e9dollars"],
  [/\bPokemon capture\b/g, "Pok\u00e9mon captur\u00e9"],
  [/\bPokemon\b/g, "Pok\u00e9mon"],
  [/\bPokemons\b/g, "Pok\u00e9mons"],
  [/\bEquipe\b/g, "\u00c9quipe"],
  [/\bequipe\b/g, "\u00e9quipe"],
  [/\bApres\b/g, "Apr\u00e8s"],
  [/\bapres\b/g, "apr\u00e8s"],
  [/\bEchanger\b/g, "\u00c9changer"],
  [/\bechanger\b/g, "\u00e9changer"],
  [/\bEchangee\b/g, "\u00c9chang\u00e9e"],
  [/\bechangee\b/g, "\u00e9chang\u00e9e"],
  [/\bEchangees\b/g, "\u00c9chang\u00e9es"],
  [/\bechangees\b/g, "\u00e9chang\u00e9es"],
  [/\bEchange\b/g, "\u00c9change"],
  [/\bechange\b/g, "\u00e9change"],
  [/\binstantanement\b/g, "instantan\u00e9ment"],
  [/\bAllie\b/g, "Alli\u00e9"],
  [/\ballie\b/g, "alli\u00e9"],
  [/\bAllies\b/g, "Alli\u00e9s"],
  [/\ballies\b/g, "alli\u00e9s"],
  [/\baleatoire\b/g, "al\u00e9atoire"],
  [/\bEtape\b/g, "\u00c9tape"],
  [/\betape\b/g, "\u00e9tape"],
  [/\bRegles\b/g, "R\u00e8gles"],
  [/\bregles\b/g, "r\u00e8gles"],
  [/\bEvolutions\b/g, "\u00c9volutions"],
  [/\bevolutions\b/g, "\u00e9volutions"],
  [/\bavoir attaque\b/g, "avoir attaqu\u00e9"],
  [/\bjusqu'a\b/g, "jusqu'\u00e0"],
  [/\bDegats\b/g, "D\u00e9g\u00e2ts"],
  [/\bdegats\b/g, "d\u00e9g\u00e2ts"],
  [/\bAchete\b/g, "Ach\u00e8te"],
  [/\bachete\b/g, "ach\u00e8te"],
  [/\bachetent\b/g, "ach\u00e8tent"],
  [/s'achetent\b/g, "s'ach\u00e8tent"],
  [/\bargent gagne\b/g, "argent gagn\u00e9"],
  [/\bEvolution\b/g, "\u00c9volution"],
  [/\bevolution\b/g, "\u00e9volution"],
  [/\bPrecedent\b/g, "Pr\u00e9c\u00e9dent"],
  [/\bprecedent\b/g, "pr\u00e9c\u00e9dent"],
  [/\bevolutive\b/g, "\u00e9volutive"],
  [/\bEvolue\b/g, "\u00c9volue"],
  [/\bevolue\b/g, "\u00e9volue"],
  [/\bReglages\b/g, "R\u00e9glages"],
  [/\bReglage\b/g, "R\u00e9glage"],
  [/\breglages\b/g, "r\u00e9glages"],
  [/\breglage\b/g, "r\u00e9glage"],
  [/\bDebloquee\b/g, "D\u00e9bloqu\u00e9e"],
  [/\bDebloquees\b/g, "D\u00e9bloqu\u00e9es"],
  [/\bDebloques\b/g, "D\u00e9bloqu\u00e9s"],
  [/\bDebloque\b/g, "D\u00e9bloqu\u00e9"],
  [/\bdebloquee\b/g, "d\u00e9bloqu\u00e9e"],
  [/\bdebloquees\b/g, "d\u00e9bloqu\u00e9es"],
  [/\bdebloques\b/g, "d\u00e9bloqu\u00e9s"],
  [/\bdebloque\b/g, "d\u00e9bloqu\u00e9"],
  [/\bPrecedente\b/g, "Pr\u00e9c\u00e9dente"],
  [/\bprecedente\b/g, "pr\u00e9c\u00e9dente"],
  [/\bBientot\b/g, "Bient\u00f4t"],
  [/\bbientot\b/g, "bient\u00f4t"],
  [/\bDes que\b/g, "D\u00e8s que"],
  [/\bdes que\b/g, "d\u00e8s que"],
  [/\bDes qu'/g, "D\u00e8s qu'"],
  [/\bdes qu'/g, "d\u00e8s qu'"],
  [/\bdebut\b/g, "d\u00e9but"],
  [/\bDebut\b/g, "D\u00e9but"],
  [/\bdebuter\b/g, "d\u00e9buter"],
  [/\bDebuter\b/g, "D\u00e9buter"],
  [/\bEcran\b/g, "\u00c9cran"],
  [/\becran\b/g, "\u00e9cran"],
  [/\bBoites\b/g, "Bo\u00eetes"],
  [/\bboites\b/g, "bo\u00eetes"],
  [/\bBoite\b/g, "Bo\u00eete"],
  [/\bboite\b/g, "bo\u00eete"],
  [/\bEspeces\b/g, "Esp\u00e8ces"],
  [/\bespeces\b/g, "esp\u00e8ces"],
  [/\bEspece\b/g, "Esp\u00e8ce"],
  [/\bespece\b/g, "esp\u00e8ce"],
  [/\bentites\b/g, "entit\u00e9s"],
  [/\bentite\b/g, "entit\u00e9"],
  [/\bcapturees\b/g, "captur\u00e9es"],
  [/\bcapturee\b/g, "captur\u00e9e"],
  [/\bComplete\b/g, "Compl\u00e8te"],
  [/\bcomplete\b/g, "compl\u00e8te"],
  [/\bdesactivees\b/g, "d\u00e9sactiv\u00e9es"],
  [/\bdesactivee\b/g, "d\u00e9sactiv\u00e9e"],
  [/\bdesactives\b/g, "d\u00e9sactiv\u00e9s"],
  [/\bdesactive\b/g, "d\u00e9sactiv\u00e9"],
  [/\bDesactivees\b/g, "D\u00e9sactiv\u00e9es"],
  [/\bDesactivee\b/g, "D\u00e9sactiv\u00e9e"],
  [/\bDesactives\b/g, "D\u00e9sactiv\u00e9s"],
  [/\bDesactive\b/g, "D\u00e9sactiv\u00e9"],
  [/\bmystere\b/g, "myst\u00e8re"],
  [/\bMystere\b/g, "Myst\u00e8re"],
  [/\brevelees\b/g, "r\u00e9v\u00e9l\u00e9es"],
  [/\brevelee\b/g, "r\u00e9v\u00e9l\u00e9e"],
  [/\brevele\b/g, "r\u00e9v\u00e9l\u00e9"],
  [/\bRevelees\b/g, "R\u00e9v\u00e9l\u00e9es"],
  [/\bRevelee\b/g, "R\u00e9v\u00e9l\u00e9e"],
  [/\bRevele\b/g, "R\u00e9v\u00e9l\u00e9"],
  [/\bpremiere\b/g, "premi\u00e8re"],
  [/\bPremiere\b/g, "Premi\u00e8re"],
  [/\bpret\b/g, "pr\u00eat"],
  [/\bPret\b/g, "Pr\u00eat"],
  [/\bprete\b/g, "pr\u00eate"],
  [/\bPrete\b/g, "Pr\u00eate"],
  [/\bdeja\b/g, "d\u00e9j\u00e0"],
  [/\bDeja\b/g, "D\u00e9j\u00e0"],
  [/\bDebloquer\b/g, "D\u00e9bloquer"],
  [/\bdebloquer\b/g, "d\u00e9bloquer"],
  [/\breussir\b/g, "r\u00e9ussir"],
  [/\bReussir\b/g, "R\u00e9ussir"],
  [/\bResultat\b/g, "R\u00e9sultat"],
  [/\bresultat\b/g, "r\u00e9sultat"],
  [/\bQuantite\b/g, "Quantit\u00e9"],
  [/\bquantite\b/g, "quantit\u00e9"],
  [/\bQuantit\u00e9 a acheter\b/g, "Quantit\u00e9 \u00e0 acheter"],
  [/\bquantit\u00e9 a acheter\b/g, "quantit\u00e9 \u00e0 acheter"],
  [/\bcaracteres\b/g, "caract\u00e8res"],
  [/\bCaracteres\b/g, "Caract\u00e8res"],
  [/\birreversible\b/g, "irr\u00e9versible"],
  [/\bIrreversible\b/g, "Irr\u00e9versible"],
  [/\breinitialiser\b/g, "r\u00e9initialiser"],
  [/\bReinitialiser\b/g, "R\u00e9initialiser"],
  [/\bchargees\b/g, "charg\u00e9es"],
  [/\bChargees\b/g, "Charg\u00e9es"],
  [/\bmeme\b/g, "m\u00eame"],
  [/\bMeme\b/g, "M\u00eame"],
  [/\bdetaillees\b/g, "d\u00e9taill\u00e9es"],
  [/\bDetaillees\b/g, "D\u00e9taill\u00e9es"],
  [/\bdetails\b/g, "d\u00e9tails"],
  [/\bDetails\b/g, "D\u00e9tails"],
  [/\baccelerer\b/g, "acc\u00e9l\u00e9rer"],
  [/\bAccelerer\b/g, "Acc\u00e9l\u00e9rer"],
  [/\bApparait\b/g, "Appara\u00eet"],
  [/\bapparait\b/g, "appara\u00eet"],
  [/\bd'affilee\b/g, "d'affil\u00e9e"],
  [/\bApplique a la\b/g, "Appliqu\u00e9 \u00e0 la"],
  [/\bapplique a la\b/g, "appliqu\u00e9 \u00e0 la"],
  [/\ba tenter\b/g, "\u00e0 tenter"],
  [/\ba la famille\b/g, "\u00e0 la famille"],
  [/\ba la fin\b/g, "\u00e0 la fin"],
  [/\ba toute l'equipe\b/g, "\u00e0 toute l'\u00e9quipe"],
  [/\bsert a acheter\b/g, "sert \u00e0 acheter"],
  [/\bmise a jour\b/g, "mise \u00e0 jour"],
  [/\bMise a jour\b/g, "Mise \u00e0 jour"],
  [/\bsupplementaire\b/g, "suppl\u00e9mentaire"],
  [/\bSupplementaire\b/g, "Suppl\u00e9mentaire"],
  [/\btermine\b/g, "termin\u00e9"],
  [/\bTermine\b/g, "Termin\u00e9"],
  [/\bVerrouille\b/g, "Verrouill\u00e9"],
  [/\bverrouille\b/g, "verrouill\u00e9"],
]);

function toNfc(text) {
  try {
    return String(text ?? "").normalize("NFC");
  } catch {
    return String(text ?? "");
  }
}

function countLikelyMojibake(text) {
  const matches = String(text || "").match(/(?:\u00c3.|\u00c2.|\u00e2.|\ufffd)/g);
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
