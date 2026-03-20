export function createBrowserSaveStorage({
  getWindowObject,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
} = {}) {
  const readWindow =
    typeof getWindowObject === "function"
      ? getWindowObject
      : () => (typeof window !== "undefined" ? window : null);

  function getBrowserStorageArea(areaName) {
    try {
      const win = readWindow();
      return win?.[areaName] || null;
    } catch {
      return null;
    }
  }

  function readRawSaveDataFromStorageKey(areaName, key, contextLabel) {
    const storageArea = getBrowserStorageArea(areaName);
    if (!storageArea || typeof storageArea.getItem !== "function") {
      return null;
    }
    try {
      const raw = storageArea.getItem(key);
      if (!raw) {
        return null;
      }
      return parseSerializedSave(raw, contextLabel);
    } catch {
      return null;
    }
  }

  function readSaveDataFromStorageKey(areaName, key, contextLabel) {
    const saveRaw = readRawSaveDataFromStorageKey(areaName, key, contextLabel);
    if (!saveRaw) {
      return null;
    }
    if (!isRawSaveSupported(saveRaw)) {
      removeSaveDataFromStorageKey(areaName, key);
      return null;
    }
    return normalizeSave(saveRaw);
  }

  function writeSerializedSaveToStorageKey(areaName, key, serializedSave) {
    const storageArea = getBrowserStorageArea(areaName);
    if (!storageArea || typeof storageArea.setItem !== "function") {
      return false;
    }
    try {
      storageArea.setItem(key, serializedSave);
      return true;
    } catch {
      return false;
    }
  }

  function removeSaveDataFromStorageKey(areaName, key) {
    const storageArea = getBrowserStorageArea(areaName);
    if (!storageArea || typeof storageArea.removeItem !== "function") {
      return false;
    }
    try {
      storageArea.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  return {
    getBrowserStorageArea,
    readRawSaveDataFromStorageKey,
    readSaveDataFromStorageKey,
    writeSerializedSaveToStorageKey,
    removeSaveDataFromStorageKey,
  };
}
