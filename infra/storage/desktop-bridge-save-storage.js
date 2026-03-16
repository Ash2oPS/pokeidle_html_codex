export function createDesktopBridgeSaveStorage({
  hasDesktopSaveBridge,
  getDesktopBridge,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
  setDesktopBridgeAvailable,
} = {}) {
  const hasDesktopBridgeFn = typeof hasDesktopSaveBridge === "function" ? hasDesktopSaveBridge : () => false;
  const getDesktopBridgeFn = typeof getDesktopBridge === "function" ? getDesktopBridge : () => null;
  const setBridgeAvailable =
    typeof setDesktopBridgeAvailable === "function" ? setDesktopBridgeAvailable : () => {};

  async function deleteSaveDataFromDesktopBridge() {
    if (!hasDesktopBridgeFn()) {
      setBridgeAvailable(false);
      return true;
    }
    try {
      const bridge = getDesktopBridgeFn();
      const payload = await bridge.deleteSave();
      const ok = Boolean(payload?.ok);
      setBridgeAvailable(true);
      return ok;
    } catch {
      setBridgeAvailable(false);
      return false;
    }
  }

  async function readSaveDataFromDesktopBridge() {
    if (!hasDesktopBridgeFn()) {
      setBridgeAvailable(false);
      return null;
    }
    try {
      const bridge = getDesktopBridgeFn();
      const payload = await bridge.readSave();
      if (!payload?.ok) {
        setBridgeAvailable(true);
        return null;
      }
      const saveRaw = payload?.save;
      if (!saveRaw || typeof saveRaw !== "object") {
        setBridgeAvailable(true);
        return null;
      }
      if (!isRawSaveSupported(saveRaw)) {
        await deleteSaveDataFromDesktopBridge();
        return null;
      }
      setBridgeAvailable(true);
      return normalizeSave(saveRaw);
    } catch {
      setBridgeAvailable(false);
      return null;
    }
  }

  async function writeSerializedSaveToDesktopBridge(serializedSave) {
    if (!hasDesktopBridgeFn()) {
      setBridgeAvailable(false);
      return false;
    }
    try {
      const bridge = getDesktopBridgeFn();
      const parsedSave = parseSerializedSave(serializedSave, "desktop save");
      const payload = await bridge.writeSave(parsedSave);
      const ok = Boolean(payload?.ok);
      setBridgeAvailable(true);
      return ok;
    } catch {
      setBridgeAvailable(false);
      return false;
    }
  }

  return {
    readSaveDataFromDesktopBridge,
    writeSerializedSaveToDesktopBridge,
    deleteSaveDataFromDesktopBridge,
  };
}
