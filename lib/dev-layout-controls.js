function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createDevLayoutControls({
  clamp,
  devLayoutSettingsDefaults,
  devLayoutControlDefinitions,
  devLayoutStorageKey,
  state,
  getBattleViewportProfile,
  refreshLayoutIfNeeded,
  render,
  devLayoutPanelEl,
  devLayoutControlsEl,
  devLayoutControlInputByKey,
  devLayoutControlValueByKey,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const settingsDefaults = devLayoutSettingsDefaults && typeof devLayoutSettingsDefaults === "object"
    ? devLayoutSettingsDefaults
    : {};
  const controlDefinitions = Array.isArray(devLayoutControlDefinitions) ? devLayoutControlDefinitions : [];
  const storageKey = String(devLayoutStorageKey || "pokeidle_dev_layout_settings");

  function createDefaultDevLayoutSettings() {
    return { ...settingsDefaults };
  }

  function getDevLayoutControlDefinition(key) {
    return controlDefinitions.find((definition) => definition.key === String(key || "")) || null;
  }

  function normalizeDevLayoutSettingValue(key, rawValue) {
    const definition = getDevLayoutControlDefinition(key);
    const fallback = Number(settingsDefaults[key] || 0);
    if (!definition) {
      return fallback;
    }
    const numeric = Number(rawValue);
    const safeNumeric = Number.isFinite(numeric) ? numeric : fallback;
    return safeClamp(safeNumeric, Number(definition.min), Number(definition.max));
  }

  function normalizeDevLayoutSettings(rawSettings = null) {
    const nextSettings = createDefaultDevLayoutSettings();
    if (!rawSettings || typeof rawSettings !== "object") {
      return nextSettings;
    }
    for (const definition of controlDefinitions) {
      nextSettings[definition.key] = normalizeDevLayoutSettingValue(definition.key, rawSettings[definition.key]);
    }
    return nextSettings;
  }

  function shouldAllowDevLayoutOverflowPositions() {
    const profile = state.layout?.viewportProfile || (typeof getBattleViewportProfile === "function"
      ? getBattleViewportProfile(
        Math.max(260, Number(state.viewport?.width) || 0),
        Math.max(220, Number(state.viewport?.height) || 0),
      )
      : null);
    return !Boolean(profile?.phone);
  }

  function loadDevLayoutSettingsFromStorage() {
    if (typeof window === "undefined" || !window.localStorage) {
      return createDefaultDevLayoutSettings();
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return createDefaultDevLayoutSettings();
      }
      return normalizeDevLayoutSettings(JSON.parse(raw));
    } catch {
      return createDefaultDevLayoutSettings();
    }
  }

  function persistDevLayoutSettingsToStorage() {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state.devLayout.settings || {}));
    } catch {
      // Ignore storage failures for dev-only layout controls.
    }
  }

  function formatDevLayoutSettingValue(definition, value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }
    if (definition?.valueType === "px") {
      return `${Math.round(numeric)} px`;
    }
    if (definition?.valueType === "deg") {
      return `${Math.round(numeric * 10) / 10} deg`;
    }
    return `${Math.round(numeric * 100)}%`;
  }

  function syncDevLayoutControlsFromState() {
    const settings = state.devLayout?.settings || settingsDefaults;
    for (const definition of controlDefinitions) {
      const key = definition.key;
      const normalizedValue = normalizeDevLayoutSettingValue(key, settings[key]);
      const inputEl = devLayoutControlInputByKey.get(key);
      if (inputEl) {
        const nextValueString = String(normalizedValue);
        if (String(inputEl.value) !== nextValueString) {
          inputEl.value = nextValueString;
        }
      }
      const valueEl = devLayoutControlValueByKey.get(key);
      if (valueEl) {
        valueEl.textContent = formatDevLayoutSettingValue(definition, normalizedValue);
      }
    }
  }

  function renderDevLayoutPanel() {
    if (!(devLayoutPanelEl instanceof HTMLElement)) {
      return;
    }
    const isOpen = Boolean(state.ui?.devLayoutOpen);
    devLayoutPanelEl.classList.toggle("hidden", !isOpen);
    devLayoutPanelEl.setAttribute("aria-hidden", isOpen ? "false" : "true");
    if (isOpen) {
      syncDevLayoutControlsFromState();
    }
  }

  function setDevLayoutPanelOpen(open) {
    state.ui.devLayoutOpen = Boolean(open);
    renderDevLayoutPanel();
  }

  function toggleDevLayoutPanel() {
    setDevLayoutPanelOpen(!state.ui.devLayoutOpen);
  }

  function setDevLayoutSetting(key, rawValue, options = {}) {
    const normalizedKey = String(key || "");
    if (!Object.prototype.hasOwnProperty.call(settingsDefaults, normalizedKey)) {
      return false;
    }
    const nextValue = normalizeDevLayoutSettingValue(normalizedKey, rawValue);
    const currentValue = Number(state.devLayout?.settings?.[normalizedKey]);
    if (Number.isFinite(currentValue) && Math.abs(currentValue - nextValue) < 0.000001) {
      return false;
    }
    state.devLayout.settings[normalizedKey] = nextValue;
    if (options.persist !== false) {
      persistDevLayoutSettingsToStorage();
    }
    if (typeof refreshLayoutIfNeeded === "function") {
      refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
    }
    renderDevLayoutPanel();
    if (typeof render === "function") {
      render();
    }
    return true;
  }

  function resetDevLayoutSettings() {
    state.devLayout.settings = createDefaultDevLayoutSettings();
    persistDevLayoutSettingsToStorage();
    if (typeof refreshLayoutIfNeeded === "function") {
      refreshLayoutIfNeeded({ force: true, nowMs: state.timeMs });
    }
    renderDevLayoutPanel();
    if (typeof render === "function") {
      render();
    }
  }

  function initializeDevLayoutControls() {
    if (!(devLayoutControlsEl instanceof HTMLElement) || state.devLayout.controlsInitialized) {
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const definition of controlDefinitions) {
      const controlEl = document.createElement("label");
      controlEl.className = "dev-layout-control";
      controlEl.setAttribute("data-dev-layout-key", definition.key);

      const headerEl = document.createElement("span");
      headerEl.className = "dev-layout-control-header";

      const labelEl = document.createElement("span");
      labelEl.className = "dev-layout-control-label";
      labelEl.textContent = definition.label;

      const valueEl = document.createElement("span");
      valueEl.className = "dev-layout-control-value";
      valueEl.textContent = formatDevLayoutSettingValue(definition, state.devLayout.settings[definition.key]);
      devLayoutControlValueByKey.set(definition.key, valueEl);

      headerEl.append(labelEl, valueEl);

      const inputEl = document.createElement("input");
      inputEl.className = "dev-layout-slider";
      inputEl.type = "range";
      inputEl.min = String(definition.min);
      inputEl.max = String(definition.max);
      inputEl.step = String(definition.step);
      inputEl.value = String(normalizeDevLayoutSettingValue(definition.key, state.devLayout.settings[definition.key]));
      inputEl.addEventListener("input", () => {
        setDevLayoutSetting(definition.key, inputEl.value, { persist: true });
      });
      devLayoutControlInputByKey.set(definition.key, inputEl);

      controlEl.append(headerEl, inputEl);
      fragment.append(controlEl);
    }

    devLayoutControlsEl.replaceChildren(fragment);
    state.devLayout.controlsInitialized = true;
    syncDevLayoutControlsFromState();
  }

  return {
    createDefaultDevLayoutSettings,
    getDevLayoutControlDefinition,
    normalizeDevLayoutSettingValue,
    normalizeDevLayoutSettings,
    shouldAllowDevLayoutOverflowPositions,
    loadDevLayoutSettingsFromStorage,
    persistDevLayoutSettingsToStorage,
    formatDevLayoutSettingValue,
    syncDevLayoutControlsFromState,
    renderDevLayoutPanel,
    setDevLayoutPanelOpen,
    toggleDevLayoutPanel,
    setDevLayoutSetting,
    resetDevLayoutSettings,
    initializeDevLayoutControls,
  };
}
