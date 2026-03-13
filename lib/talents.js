import { normalizeUiDisplayText } from "./text-normalization.js";

export const TALENT_NONE_ID = "NONE";
export const TALENT_NONE_NAME_FR = "Aucun";
export const TALENT_NONE_NAME_EN = "None";
export const TALENT_NONE_DESCRIPTION_FR = "Aucun effet passif pour le moment.";

function normalizeTalentAliasKey(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) {
    return TALENT_NONE_ID;
  }
  const normalized = raw.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized || TALENT_NONE_ID;
}

function formatTalentIdLabel(talentId) {
  const id = normalizeTalentAliasKey(talentId);
  if (id === TALENT_NONE_ID) {
    return TALENT_NONE_NAME_FR;
  }
  return id
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeNoneLabelFr(label) {
  const value = normalizeUiDisplayText(label, { frenchTypography: true }).trim();
  if (!value) {
    return TALENT_NONE_NAME_FR;
  }
  const lowered = value.toLowerCase();
  if (lowered === "none" || lowered === "aucun") {
    return TALENT_NONE_NAME_FR;
  }
  return value;
}

function normalizeNoneLabelEn(label) {
  const value = normalizeUiDisplayText(label).trim();
  if (!value) {
    return TALENT_NONE_NAME_EN;
  }
  const lowered = value.toLowerCase();
  if (lowered === "none" || lowered === "aucun") {
    return TALENT_NONE_NAME_EN;
  }
  return value;
}

export function normalizeTalentId(rawTalentId) {
  return normalizeTalentAliasKey(rawTalentId);
}

export function createDefaultTalentDefinition() {
  return {
    id: TALENT_NONE_ID,
    nameFr: TALENT_NONE_NAME_FR,
    nameEn: TALENT_NONE_NAME_EN,
    descriptionFr: TALENT_NONE_DESCRIPTION_FR,
  };
}

export function normalizeTalentDefinition(rawTalent) {
  const fallback = createDefaultTalentDefinition();
  if (rawTalent == null) {
    return fallback;
  }

  const source =
    typeof rawTalent === "string"
      ? { id: rawTalent }
      : typeof rawTalent === "object"
        ? rawTalent
        : {};

  const id = normalizeTalentId(source.id ?? source.talent_id ?? source.talentId);
  const defaultName = formatTalentIdLabel(id);
  const defaultDescription = id === TALENT_NONE_ID ? TALENT_NONE_DESCRIPTION_FR : "";
  const nameFr = normalizeUiDisplayText(
    source.nameFr ?? source.name_fr ?? source.talent_name_fr ?? source.talentNameFr ?? defaultName,
    { frenchTypography: true },
  ).trim();
  const nameEn = normalizeUiDisplayText(
    source.nameEn ?? source.name_en ?? source.talent_name_en ?? source.talentNameEn ?? defaultName,
  ).trim();
  const descriptionFr = normalizeUiDisplayText(
    source.descriptionFr ??
      source.description_fr ??
      source.talent_description_fr ??
      source.talentDescriptionFr ??
      defaultDescription,
    { frenchTypography: true },
  ).trim();

  return {
    id,
    nameFr: id === TALENT_NONE_ID ? normalizeNoneLabelFr(nameFr) : nameFr || defaultName,
    nameEn: id === TALENT_NONE_ID ? normalizeNoneLabelEn(nameEn) : nameEn || defaultName,
    descriptionFr: descriptionFr || defaultDescription,
  };
}
