const { contextBridge, ipcRenderer } = require("electron");
const WINDOW_STATE_CHANNEL = "pokeidle:window-state";
const WINDOW_STATE_CHANGED_CHANNEL = "pokeidle:window-state-changed";

const windowStateListeners = new Set();
let currentWindowState = {
  minimized: false,
  visible: true,
  focused: true,
  occluded: false,
  backgrounded: false,
  updatedAtMs: 0,
};

function invoke(channel, payload = undefined) {
  return ipcRenderer.invoke(channel, payload);
}

function toWindowStateSnapshot(payload) {
  const minimized = Boolean(payload?.minimized);
  const visible = typeof payload?.visible === "boolean" ? payload.visible : true;
  const focused = typeof payload?.focused === "boolean" ? payload.focused : true;
  const occluded = Boolean(payload?.occluded);
  const updatedAtMs = Number(payload?.updatedAtMs);
  return {
    minimized,
    visible,
    focused,
    occluded,
    backgrounded: Boolean(payload?.backgrounded ?? (minimized || !visible || !focused || occluded)),
    updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : Date.now(),
  };
}

function updateWindowState(payload) {
  currentWindowState = toWindowStateSnapshot(payload);
  const snapshot = { ...currentWindowState };
  for (const listener of windowStateListeners) {
    try {
      listener(snapshot);
    } catch {
      // Ignore renderer callback failures and keep broadcasting state updates.
    }
  }
  return snapshot;
}

ipcRenderer.on(WINDOW_STATE_CHANGED_CHANNEL, (_event, payload) => {
  updateWindowState(payload);
});

void invoke(WINDOW_STATE_CHANNEL)
  .then((payload) => {
    updateWindowState(payload);
  })
  .catch(() => {});

const desktopApi = Object.freeze({
  isDesktop: true,
  getMeta: () => invoke("pokeidle:desktop-meta"),
  readSave: () => invoke("pokeidle:save-read"),
  writeSave: (save) => invoke("pokeidle:save-write", { save }),
  deleteSave: () => invoke("pokeidle:save-delete"),
  notify: (payload) => invoke("pokeidle:notify", payload),
  getWindowState: () => ({ ...currentWindowState }),
  onWindowStateChanged: (listener) => {
    if (typeof listener !== "function") {
      return () => {};
    }
    windowStateListeners.add(listener);
    try {
      listener({ ...currentWindowState });
    } catch {
      // Ignore listener bootstrap failures.
    }
    return () => {
      windowStateListeners.delete(listener);
    };
  },
});

contextBridge.exposeInMainWorld("pokeidleDesktop", desktopApi);
