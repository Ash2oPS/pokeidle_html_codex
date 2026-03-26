import { app, BrowserWindow, Notification, ipcMain, shell, powerSaveBlocker, nativeImage } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { startStaticServer } from "./local-static-server.mjs";

const DEFAULT_REMOTE_URL = "https://ash2ops.github.io/pokeidle_html_codex/";
const DESKTOP_APP_ID = "com.ash2ops.pokeidle";
const SAVE_FILE_NAME = "pokeidle_save_v5z.json";
const LEGACY_SAVE_FILE_NAMES = ["pokeidle_save_v4c.json", "pokeidle_save_v3.json"];
const SAVE_DIR_NAME = "saves";
const WINDOW_BACKGROUND = "#0f1720";
const DESKTOP_ICON_FILE_NAME = process.platform === "win32" ? "pokeball-dock.ico" : "pokeball-dock.png";
const WINDOW_STATE_CHANNEL = "pokeidle:window-state";
const WINDOW_STATE_CHANGED_CHANNEL = "pokeidle:window-state-changed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ICON_PATH = path.join(__dirname, "..", "assets", "icons", DESKTOP_ICON_FILE_NAME);
const LOCAL_BUNDLE_DIR = path.join(__dirname, "..", "dist");
let runtimePowerSaveBlockerId = null;
let localBundleServer = null;
let rendererTarget = null;

// Keep Chromium from throttling the renderer when the game window is occluded,
// backgrounded, or minimized. The desktop build must keep simulating continuously.
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

function resolveRemoteUrlOverride() {
  const envOverride = String(process.env.POKEIDLE_REMOTE_URL || "").trim();
  if (envOverride) {
    return envOverride;
  }
  const cliArg = process.argv.find((arg) => String(arg || "").startsWith("--remote-url="));
  if (cliArg) {
    return String(cliArg).slice("--remote-url=".length).trim() || DEFAULT_REMOTE_URL;
  }
  return DEFAULT_REMOTE_URL;
}

async function ensureLocalBundleServer() {
  if (localBundleServer) {
    return localBundleServer;
  }
  await fs.access(path.join(LOCAL_BUNDLE_DIR, "index.html"));
  localBundleServer = await startStaticServer(LOCAL_BUNDLE_DIR);
  return localBundleServer;
}

async function stopLocalBundleServer() {
  if (!localBundleServer) {
    return;
  }
  const serverHandle = localBundleServer;
  localBundleServer = null;
  await serverHandle.close().catch(() => {});
}

async function resolveRendererTarget() {
  const remoteOverride = resolveRemoteUrlOverride();
  if (!app.isPackaged && remoteOverride) {
    return {
      mode: "remote",
      url: remoteOverride,
    };
  }
  const localServer = await ensureLocalBundleServer();
  return {
    mode: "local",
    url: localServer.url,
  };
}

function getSaveFilePath(fileName = SAVE_FILE_NAME) {
  return path.join(app.getPath("userData"), SAVE_DIR_NAME, String(fileName || SAVE_FILE_NAME));
}

function ensureDesktopRuntimePowerBlocker() {
  if (
    runtimePowerSaveBlockerId !== null
    && powerSaveBlocker.isStarted(runtimePowerSaveBlockerId)
  ) {
    return;
  }
  runtimePowerSaveBlockerId = powerSaveBlocker.start("prevent-app-suspension");
}

function releaseDesktopRuntimePowerBlocker() {
  if (
    runtimePowerSaveBlockerId === null
    || !powerSaveBlocker.isStarted(runtimePowerSaveBlockerId)
  ) {
    runtimePowerSaveBlockerId = null;
    return;
  }
  powerSaveBlocker.stop(runtimePowerSaveBlockerId);
  runtimePowerSaveBlockerId = null;
}

function toErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Erreur inconnue");
}

function createDesktopWindowIcon() {
  const iconImage = nativeImage.createFromPath(DESKTOP_ICON_PATH);
  if (!iconImage.isEmpty()) {
    return iconImage;
  }
  return DESKTOP_ICON_PATH;
}

function serializeDesktopWindowState(windowRef) {
  const minimized = Boolean(windowRef?.isMinimized?.());
  const visible = Boolean(windowRef?.isVisible?.());
  const focused = Boolean(windowRef?.isFocused?.());
  const occluded = typeof windowRef?.isOccluded === "function" ? Boolean(windowRef.isOccluded()) : false;
  return {
    minimized,
    visible,
    focused,
    occluded,
    backgrounded: minimized || !visible || !focused || occluded,
    updatedAtMs: Date.now(),
  };
}

function emitDesktopWindowState(windowRef) {
  if (!windowRef || windowRef.isDestroyed()) {
    return;
  }
  const webContents = windowRef.webContents;
  if (!webContents || webContents.isDestroyed()) {
    return;
  }
  webContents.send(WINDOW_STATE_CHANGED_CHANNEL, serializeDesktopWindowState(windowRef));
}

function bindDesktopWindowStateTracking(windowRef) {
  if (!windowRef || windowRef.isDestroyed()) {
    return;
  }
  const emitCurrentState = () => emitDesktopWindowState(windowRef);
  const windowStateEvents = [
    "ready-to-show",
    "show",
    "hide",
    "focus",
    "blur",
    "minimize",
    "restore",
  ];
  for (const eventName of windowStateEvents) {
    windowRef.on(eventName, emitCurrentState);
  }
  windowRef.webContents.on("did-finish-load", emitCurrentState);
}

function isSaveObject(payload) {
  return Boolean(payload && typeof payload === "object" && !Array.isArray(payload));
}

async function readDesktopSave(fileName = SAVE_FILE_NAME) {
  const filePath = getSaveFilePath(fileName);
  try {
    const rawContent = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(rawContent);
    if (!isSaveObject(parsed)) {
      return {
        ok: false,
        error: "Le fichier de sauvegarde ne contient pas un objet JSON valide.",
      };
    }
    const stats = await fs.stat(filePath);
    return {
      ok: true,
      save: parsed,
      updatedAtMs: Number(stats.mtimeMs || Date.now()),
      saveFilePath: filePath,
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        ok: true,
        save: null,
        updatedAtMs: 0,
        saveFilePath: filePath,
      };
    }
    return {
      ok: false,
      error: toErrorMessage(error),
      saveFilePath: filePath,
    };
  }
}

async function writeDesktopSave(savePayload, fileName = SAVE_FILE_NAME) {
  if (!isSaveObject(savePayload)) {
    return {
      ok: false,
      error: "Le payload de sauvegarde doit etre un objet JSON.",
    };
  }

  const filePath = getSaveFilePath(fileName);
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const serialized = `${JSON.stringify(savePayload)}\n`;
    await fs.writeFile(filePath, serialized, "utf8");
    return {
      ok: true,
      updatedAtMs: Date.now(),
      saveFilePath: filePath,
    };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error),
      saveFilePath: filePath,
    };
  }
}

async function readFirstDesktopSave(fileNames = []) {
  const candidates = Array.isArray(fileNames) ? fileNames : [fileNames];
  let emptyResult = null;
  for (const fileName of candidates) {
    const result = await readDesktopSave(fileName);
    if (!result?.ok) {
      continue;
    }
    if (result.save) {
      return result;
    }
    emptyResult = result;
  }
  return emptyResult || {
    ok: true,
    save: null,
    updatedAtMs: 0,
    saveFilePath: getSaveFilePath(candidates[0] || SAVE_FILE_NAME),
  };
}

async function deleteDesktopSaves(fileNames = []) {
  const candidates = Array.isArray(fileNames) ? fileNames : [fileNames];
  const results = await Promise.all(candidates.map((fileName) => deleteDesktopSave(fileName)));
  const failure = results.find((result) => !result?.ok);
  if (failure) {
    return failure;
  }
  return {
    ok: true,
    saveFilePath: getSaveFilePath(candidates[0] || SAVE_FILE_NAME),
  };
}

async function deleteDesktopSave(fileName = SAVE_FILE_NAME) {
  const filePath = getSaveFilePath(fileName);
  try {
    await fs.unlink(filePath);
    return {
      ok: true,
      saveFilePath: filePath,
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        ok: true,
        saveFilePath: filePath,
      };
    }
    return {
      ok: false,
      error: toErrorMessage(error),
      saveFilePath: filePath,
    };
  }
}

async function sendDesktopNotification(payload) {
  if (!Notification.isSupported()) {
    return {
      ok: false,
      error: "Notifications desktop non supportees sur cette machine.",
    };
  }

  const title = String(payload?.title || "").trim();
  if (!title) {
    return {
      ok: false,
      error: "Le titre de notification est requis.",
    };
  }

  try {
    const body = String(payload?.body || "").trim();
    const notification = new Notification({
      title,
      body,
      silent: Boolean(payload?.silent),
      urgency: "normal",
    });
    notification.show();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error),
    };
  }
}

async function createMainWindow() {
  rendererTarget = await resolveRendererTarget();
  const windowIcon = createDesktopWindowIcon();
  const mainWindow = new BrowserWindow({
    title: "PokeIdle",
    icon: windowIcon,
    width: 1360,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: WINDOW_BACKGROUND,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  if (typeof mainWindow.webContents.setBackgroundThrottling === "function") {
    mainWindow.webContents.setBackgroundThrottling(false);
  }
  bindDesktopWindowStateTracking(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  void mainWindow.loadURL(rendererTarget.url);
  return mainWindow;
}

function registerIpcHandlers() {
  ipcMain.handle("pokeidle:desktop-meta", () => ({
    ok: true,
    platform: process.platform,
    appVersion: app.getVersion(),
    appUrl: rendererTarget?.url || "",
    assetMode: rendererTarget?.mode || "unknown",
    remoteUrl: rendererTarget?.mode === "remote" ? rendererTarget.url : "",
    saveFilePath: getSaveFilePath(),
    notificationSupported: Notification.isSupported(),
  }));

  ipcMain.handle("pokeidle:save-read", async () => readDesktopSave(SAVE_FILE_NAME));
  ipcMain.handle("pokeidle:save-read-legacy", async () => readFirstDesktopSave(LEGACY_SAVE_FILE_NAMES));
  ipcMain.handle("pokeidle:save-write", async (_event, payload) => writeDesktopSave(payload?.save, SAVE_FILE_NAME));
  ipcMain.handle("pokeidle:save-delete", async () => deleteDesktopSave(SAVE_FILE_NAME));
  ipcMain.handle("pokeidle:save-delete-legacy", async () => deleteDesktopSaves(LEGACY_SAVE_FILE_NAMES));
  ipcMain.handle("pokeidle:notify", async (_event, payload) => sendDesktopNotification(payload));
  ipcMain.handle(WINDOW_STATE_CHANNEL, (event) => {
    const windowRef = BrowserWindow.fromWebContents(event.sender);
    return serializeDesktopWindowState(windowRef);
  });
}

if (process.platform === "win32") {
  app.setAppUserModelId(DESKTOP_APP_ID);
}

app.whenReady().then(async () => {
  ensureDesktopRuntimePowerBlocker();
  registerIpcHandlers();
  await createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length <= 0) {
      void createMainWindow();
    }
  });
}).catch((error) => {
  console.error("[desktop] Impossible de demarrer le bundle local.", error);
  app.quit();
});

app.on("before-quit", async () => {
  releaseDesktopRuntimePowerBlocker();
  await stopLocalBundleServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
