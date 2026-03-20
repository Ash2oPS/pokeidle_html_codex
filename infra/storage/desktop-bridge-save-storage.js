export function createDesktopBridgeSaveStorage({
  hasDesktopSaveBridge,
  getDesktopBridge,
  parseSerializedSave,
  isRawSaveSupported,
  normalizeSave,
  setDesktopBridgeAvailable,
  readSaveMethodName,
  writeSaveMethodName,
  deleteSaveMethodName,
} = {}) {
  const hasDesktopBridgeFn = typeof hasDesktopSaveBridge === "function" ? hasDesktopSaveBridge : () => false;
  const getDesktopBridgeFn = typeof getDesktopBridge === "function" ? getDesktopBridge : () => null;
  const setBridgeAvailable =
    typeof setDesktopBridgeAvailable === "function" ? setDesktopBridgeAvailable : () => {};
  const readMethodName = String(readSaveMethodName || "readSave");
  const writeMethodName = String(writeSaveMethodName || "writeSave");
  const deleteMethodName = String(deleteSaveMethodName || "deleteSave");

  async function deleteSaveDataFromDesktopBridge() {
    if (!hasDesktopBridgeFn()) {
      setBridgeAvailable(false);
      return true;
    }
    try {
      const bridge = getDesktopBridgeFn();
      const payload = await bridge?.[deleteMethodName]?.();
      const ok = Boolean(payload?.ok);
      setBridgeAvailable(true);
      return ok;
    } catch {
      setBridgeAvailable(false);
      return false;
    }
  }

  async function readRawSaveDataFromDesktopBridge() {
    if (!hasDesktopBridgeFn()) {
      setBridgeAvailable(false);
      return null;
    }
    try {
      const bridge = getDesktopBridgeFn();
      const payload = await bridge?.[readMethodName]?.();
      if (!payload?.ok) {
        setBridgeAvailable(true);
        return null;
      }
      const saveRaw = payload?.save;
      if (!saveRaw || typeof saveRaw !== "object") {
        setBridgeAvailable(true);
        return null;
      }
      setBridgeAvailable(true);
      return saveRaw;
    } catch {
      setBridgeAvailable(false);
      return null;
    }
  }

  async function readSaveDataFromDesktopBridge() {
    const saveRaw = await readRawSaveDataFromDesktopBridge();
    if (!saveRaw) {
      return null;
    }
    try {
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
      const payload = await bridge?.[writeMethodName]?.(parsedSave);
      const ok = Boolean(payload?.ok);
      setBridgeAvailable(true);
      return ok;
    } catch {
      setBridgeAvailable(false);
      return false;
    }
  }

  return {
    readRawSaveDataFromDesktopBridge,
    readSaveDataFromDesktopBridge,
    writeSerializedSaveToDesktopBridge,
    deleteSaveDataFromDesktopBridge,
  };
}
