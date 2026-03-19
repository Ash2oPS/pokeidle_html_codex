import test from "node:test";
import assert from "node:assert/strict";

import { normalizeTalentDefinition } from "../lib/talents.js";
import { normalizeUiDisplayText } from "../lib/text-normalization.js";

test("normalizeUiDisplayText repare le mojibake UTF-8 courant", () => {
  assert.equal(normalizeUiDisplayText("Salam\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a8che"), "Salam\u00e8che");
  assert.equal(normalizeUiDisplayText("M\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a9tamorph"), "M\u00e9tamorph");
  assert.equal(normalizeUiDisplayText("\u00e2\u201a\u00bd"), "\u20bd");
});

test("normalizeTalentDefinition normalise accents et typo FR des talents", () => {
  const talent = normalizeTalentDefinition({
    id: "TELEPORT_PLUS_PLUS",
    name_fr: "Teleport ++",
    description_fr:
      "Apres avoir attaque, a 30% de chances d'echanger instantanement sa place avec un allie aleatoire. L'allie echange obtient une aura psychique jusqu'a sa prochaine attaque, qui inflige x1.5 degats.",
  });

  assert.equal(talent.nameFr, "T\u00e9l\u00e9port ++");
  assert.equal(
    talent.descriptionFr,
    "Apr\u00e8s avoir attaqu\u00e9, a 30% de chances d'\u00e9changer instantan\u00e9ment sa place avec un alli\u00e9 al\u00e9atoire. L'alli\u00e9 \u00e9change obtient une aura psychique jusqu'\u00e0 sa prochaine attaque, qui inflige x1.5 d\u00e9g\u00e2ts.",
  );
});

test("normalizeUiDisplayText peut appliquer la typo FR commune sur les libelles UI", () => {
  assert.equal(
    normalizeUiDisplayText("Surnom de famille retire (2 Pokemon).", { frenchTypography: true }),
    "Surnom de famille retire (2 Pok\u00e9mon).",
  );
  assert.equal(
    normalizeUiDisplayText("Route precedente | 1/47 zones debloquees", { frenchTypography: true }),
    "Route pr\u00e9c\u00e9dente | 1/47 zones d\u00e9bloqu\u00e9es",
  );
  assert.equal(
    normalizeUiDisplayText("Boites Pokemon | Reglages de l'evolution en plein ecran", { frenchTypography: true }),
    "Bo\u00eetes Pok\u00e9mon | R\u00e9glages de l'\u00e9volution en plein \u00e9cran",
  );
  assert.equal(
    normalizeUiDisplayText("Taille allies | Etape 1/4 | Autres evolutions", { frenchTypography: true }),
    "Taille alli\u00e9s | \u00c9tape 1/4 | Autres \u00e9volutions",
  );
  assert.equal(
    normalizeUiDisplayText(
      "Achete des balls pour accelerer l'evolution. Resultat bientot revele a la fin.",
      { frenchTypography: true },
    ),
    "Ach\u00e8te des balls pour acc\u00e9l\u00e9rer l'\u00e9volution. R\u00e9sultat bient\u00f4t r\u00e9v\u00e9l\u00e9 \u00e0 la fin.",
  );
  assert.equal(
    normalizeUiDisplayText(
      "Quantite a acheter | infos detaillees | Reinitialiser | routes chargees | meme famille | mise a jour",
      { frenchTypography: true },
    ),
    "Quantit\u00e9 \u00e0 acheter | infos d\u00e9taill\u00e9es | R\u00e9initialiser | routes charg\u00e9es | m\u00eame famille | mise \u00e0 jour",
  );
  assert.equal(
    normalizeUiDisplayText("Pret a tenter ta chance. Mode rafale termine.", { frenchTypography: true }),
    "Pr\u00eat \u00e0 tenter ta chance. Mode rafale termin\u00e9.",
  );
});
