function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function createRuntimeNotificationSystem({
  state,
  toSafeInt,
  normalizeUiDisplayText,
  nextNotificationId,
  renderNotificationStackUi,
} = {}) {
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const normalizeTextFn = typeof normalizeUiDisplayText === "function" ? normalizeUiDisplayText : (value) => String(value || "");
  const nextNotificationIdFn = typeof nextNotificationId === "function" ? nextNotificationId : () => 1;
  const renderNotificationStackUiFn = typeof renderNotificationStackUi === "function" ? renderNotificationStackUi : () => {};

  function pushTemporaryNotification(message, durationMs = 2600, options = {}) {
    const text = String(message || "").trim();
    if (!text) {
      return null;
    }
    if (state.simulationIdleMode) {
      return null;
    }

    const id = nextNotificationIdFn();
    const duration = Math.max(650, toSafeIntFn(durationMs, 2600));
    const pokemonId = Number(options.pokemonId || 0);
    const pokemonIsUltraShiny = Boolean(options.pokemonIsUltraShiny);
    const pokemonIsShiny = pokemonIsUltraShiny || Boolean(options.pokemonIsShiny);
    state.notifications.items.push({
      id,
      type: "temporary",
      tone: String(options.tone || "info"),
      title: options.title ? String(options.title) : "",
      message: text,
      pokemonId: pokemonId > 0 ? pokemonId : 0,
      pokemonIsShiny,
      pokemonIsUltraShiny,
      createdAt: state.timeMs,
      expiresAt: state.timeMs + duration,
    });
    state.notifications.dirty = true;
    renderNotificationStackUiFn();
    return id;
  }

  function setTopMessage(text, durationMs = 1200) {
    if (!text) {
      return null;
    }
    const normalized = normalizeTextFn(text, { frenchTypography: true }).trim();
    if (!normalized) {
      return null;
    }
    return pushTemporaryNotification(normalized, durationMs, { tone: "info" });
  }

  return {
    pushTemporaryNotification,
    setTopMessage,
  };
}
