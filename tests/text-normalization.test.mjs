import test from "node:test";
import assert from "node:assert/strict";

import { normalizeTalentDefinition } from "../lib/talents.js";
import { normalizeUiDisplayText } from "../lib/text-normalization.js";

test("normalizeUiDisplayText repare le mojibake UTF-8 courant", () => {
  assert.equal(normalizeUiDisplayText("SalamÃƒÂ¨che"), "Salamèche");
  assert.equal(normalizeUiDisplayText("MÃƒÂ©tamorph"), "Métamorph");
});

test("normalizeTalentDefinition normalise accents et typo FR des talents", () => {
  const talent = normalizeTalentDefinition({
    id: "TELEPORT_PLUS_PLUS",
    name_fr: "Teleport ++",
    description_fr:
      "Apres avoir attaque, a 30% de chances d'echanger instantanement sa place avec un allie aleatoire. L'allie echange obtient une aura psychique jusqu'a sa prochaine attaque, qui inflige x1.5 degats.",
  });

  assert.equal(talent.nameFr, "Téléport ++");
  assert.equal(
    talent.descriptionFr,
    "Après avoir attaqué, a 30% de chances d'échanger instantanément sa place avec un allié aléatoire. L'allié échangé obtient une aura psychique jusqu'à sa prochaine attaque, qui inflige x1.5 dégâts.",
  );
});

test("normalizeUiDisplayText peut appliquer la typo FR commune sur les libelles UI", () => {
  assert.equal(
    normalizeUiDisplayText("Surnom de famille retire (2 Pokemon).", { frenchTypography: true }),
    "Surnom de famille retire (2 Pokémon).",
  );
});
