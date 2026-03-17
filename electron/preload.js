const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload = undefined) {
  return ipcRenderer.invoke(channel, payload);
}

const desktopApi = Object.freeze({
  isDesktop: true,
  getMeta: () => invoke("pokeidle:desktop-meta"),
  readSave: () => invoke("pokeidle:save-read"),
  writeSave: (save) => invoke("pokeidle:save-write", { save }),
  deleteSave: () => invoke("pokeidle:save-delete"),
  notify: (payload) => invoke("pokeidle:notify", payload),
});

contextBridge.exposeInMainWorld("pokeidleDesktop", desktopApi);
