export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}
