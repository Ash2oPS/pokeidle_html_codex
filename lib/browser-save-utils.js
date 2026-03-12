export const SAVE_SOURCE_LOCAL_STORAGE = "local_storage";
export const SAVE_SOURCE_SESSION_STORAGE = "session_storage";
export const SAVE_SOURCE_INDEXED_DB = "indexed_db";

const SAVE_SOURCE_PRIORITY = Object.freeze({
  [SAVE_SOURCE_LOCAL_STORAGE]: 30,
  [SAVE_SOURCE_INDEXED_DB]: 20,
  [SAVE_SOURCE_SESSION_STORAGE]: 10,
});

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function getSaveTimestampMs(saveData) {
  return Math.max(0, toSafeInt(saveData?.last_tick_epoch_ms, 0));
}

export function pickPreferredSaveCandidate(candidates) {
  const source = Array.isArray(candidates) ? candidates : [];
  let bestCandidate = null;
  let bestTimestamp = -1;
  let bestPriority = -1;

  for (const candidate of source) {
    if (!candidate || !candidate.saveData || typeof candidate.saveData !== "object") {
      continue;
    }

    const timestamp = getSaveTimestampMs(candidate.saveData);
    const priority = SAVE_SOURCE_PRIORITY[String(candidate.source || "")] || 0;
    if (!bestCandidate || timestamp > bestTimestamp || (timestamp === bestTimestamp && priority > bestPriority)) {
      bestCandidate = candidate;
      bestTimestamp = timestamp;
      bestPriority = priority;
    }
  }

  return bestCandidate;
}
