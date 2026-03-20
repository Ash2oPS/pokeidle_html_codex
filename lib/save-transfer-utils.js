function padTimestampPart(value) {
  const numeric = Math.max(0, Number(value) || 0);
  return String(Math.trunc(numeric)).padStart(2, "0");
}

export function buildSaveExportFilename(date = new Date()) {
  const year = Math.max(0, Number(date?.getFullYear?.() || 0));
  const month = padTimestampPart(Number(date?.getMonth?.() || 0) + 1);
  const day = padTimestampPart(date?.getDate?.());
  const hours = padTimestampPart(date?.getHours?.());
  const minutes = padTimestampPart(date?.getMinutes?.());
  const seconds = padTimestampPart(date?.getSeconds?.());
  return `pokeidle-save-v4c-${year}${month}${day}-${hours}${minutes}${seconds}.json`;
}

export function parseImportedCompactSave(serializedSave, dependencies = {}) {
  const parseSave = typeof dependencies.parseSerializedSave === "function"
    ? dependencies.parseSerializedSave
    : null;
  const isCompactPayload = typeof dependencies.isCompactSavePayload === "function"
    ? dependencies.isCompactSavePayload
    : typeof dependencies.isRawSaveSupported === "function"
      ? dependencies.isRawSaveSupported
      : null;
  const decodeCompactSave = typeof dependencies.decodeCompactSave === "function"
    ? dependencies.decodeCompactSave
    : null;
  const repairSaveSnapshot = typeof dependencies.repairNormalizedSaveSnapshot === "function"
    ? dependencies.repairNormalizedSaveSnapshot
    : null;

  if (!parseSave || !isCompactPayload || !decodeCompactSave || !repairSaveSnapshot) {
    throw new Error("Les dependances d'import de save sont incompletes.");
  }

  const rawSave = parseSave(serializedSave, "save importee");
  if (rawSave && typeof rawSave === "object" && !Array.isArray(rawSave) && !rawSave.f && rawSave.version != null) {
    throw new Error("Les anciennes sauvegardes exportees ne sont plus importables manuellement.");
  }
  if (!isCompactPayload(rawSave)) {
    throw new Error("Cette sauvegarde n'est pas compatible avec cette version du jeu.");
  }

  const normalizedSave = decodeCompactSave(rawSave);
  const repairResult = repairSaveSnapshot(normalizedSave);
  const repairedSave = repairResult?.saveData;
  if (!repairedSave || typeof repairedSave !== "object") {
    throw new Error("Impossible de normaliser la sauvegarde importee.");
  }

  return repairedSave;
}

export function parseImportedSaveText(serializedSave, dependencies = {}) {
  return parseImportedCompactSave(serializedSave, dependencies);
}
