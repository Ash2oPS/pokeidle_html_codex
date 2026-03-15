import { app, BrowserWindow, Notification, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REMOTE_URL = "https://ash2ops.github.io/pokeidle_html_codex/";
const DESKTOP_APP_ID = "com.ash2ops.pokeidle";
const SAVE_FILE_NAME = "pokeidle_save_v3.json";
const SAVE_DIR_NAME = "saves";
const WINDOW_BACKGROUND = "#0f1720";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ICON_PATH = path.join(__dirname, "..", "assets", "icons", "pokeball-dock.png");

function resolveRemoteUrl() {
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

function getSaveFilePath() {
  return path.join(app.getPath("userData"), SAVE_DIR_NAME, SAVE_FILE_NAME);
}

function toErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Erreur inconnue");
}

function isSaveObject(payload) {
  return Boolean(payload && typeof payload === "object" && !Array.isArray(payload));
}

async function readDesktopSave() {
  const filePath = getSaveFilePath();
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

async function writeDesktopSave(savePayload) {
  if (!isSaveObject(savePayload)) {
    return {
      ok: false,
      error: "Le payload de sauvegarde doit etre un objet JSON.",
    };
  }

  const filePath = getSaveFilePath();
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

async function deleteDesktopSave() {
  const filePath = getSaveFilePath();
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

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "PokeIdle",
    icon: DESKTOP_ICON_PATH,
    width: 1360,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: WINDOW_BACKGROUND,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  void mainWindow.loadURL(resolveRemoteUrl());
  return mainWindow;
}

function registerIpcHandlers() {
  ipcMain.handle("pokeidle:desktop-meta", () => ({
    ok: true,
    platform: process.platform,
    appVersion: app.getVersion(),
    remoteUrl: resolveRemoteUrl(),
    saveFilePath: getSaveFilePath(),
    notificationSupported: Notification.isSupported(),
  }));

  ipcMain.handle("pokeidle:save-read", async () => readDesktopSave());
  ipcMain.handle("pokeidle:save-write", async (_event, payload) => writeDesktopSave(payload?.save));
  ipcMain.handle("pokeidle:save-delete", async () => deleteDesktopSave());
  ipcMain.handle("pokeidle:notify", async (_event, payload) => sendDesktopNotification(payload));
}

if (process.platform === "win32") {
  app.setAppUserModelId(DESKTOP_APP_ID);
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length <= 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
