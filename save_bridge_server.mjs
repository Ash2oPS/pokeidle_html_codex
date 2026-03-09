import http from "node:http";
import { promises as fsp } from "node:fs";
import path from "node:path";
import os from "node:os";

const PORT = Number(process.env.POKEIDLE_SAVE_PORT || 38475);
const APPDATA_DIR = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const SAVE_DIR = path.join(APPDATA_DIR, "PokeIdle");
const SAVE_FILE_PATH = path.join(SAVE_DIR, "save_main.json");
const SAVE_BACKUP_PATHS = Array.from({ length: 3 }, (_, index) =>
  path.join(SAVE_DIR, "save_backup_" + String(index + 1) + ".json"),
);
const MAX_BODY_BYTES = 2 * 1024 * 1024;

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function ensureSaveDir() {
  await fsp.mkdir(SAVE_DIR, { recursive: true });
}

async function readJsonObjectFile(filePath) {
  const raw = await fsp.readFile(filePath, "utf8");
  if (!raw || !raw.trim()) {
    return null;
  }
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : null;
}

async function readSaveFromDisk() {
  let lastError = null;
  for (const candidatePath of [SAVE_FILE_PATH, ...SAVE_BACKUP_PATHS]) {
    try {
      const save = await readJsonObjectFile(candidatePath);
      if (save) {
        return {
          save,
          sourcePath: candidatePath,
          restoredFromBackup: candidatePath !== SAVE_FILE_PATH,
        };
      }
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    save: null,
    sourcePath: null,
    restoredFromBackup: false,
  };
}

async function rotateSaveBackups() {
  for (let index = SAVE_BACKUP_PATHS.length - 1; index >= 0; index -= 1) {
    const sourcePath = index === 0 ? SAVE_FILE_PATH : SAVE_BACKUP_PATHS[index - 1];
    const destinationPath = SAVE_BACKUP_PATHS[index];
    try {
      await fsp.copyFile(sourcePath, destinationPath);
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }
}

async function getExistingBackupPaths() {
  const existingPaths = [];
  for (const backupPath of SAVE_BACKUP_PATHS) {
    try {
      await fsp.access(backupPath);
      existingPaths.push(backupPath);
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }
  return existingPaths;
}

async function writeSaveToDisk(savePayload) {
  await ensureSaveDir();
  const tempPath = SAVE_FILE_PATH + ".tmp";
  const serialized = JSON.stringify(savePayload, null, 2);
  await rotateSaveBackups();
  try {
    await fsp.writeFile(tempPath, serialized, "utf8");
    await fsp.rename(tempPath, SAVE_FILE_PATH);
  } finally {
    await fsp.rm(tempPath, { force: true }).catch(() => {});
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", "http://127.0.0.1:" + String(PORT));

  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    const backupPaths = await getExistingBackupPaths();
    sendJson(res, 200, {
      ok: true,
      save_path: SAVE_FILE_PATH,
      backup_paths: backupPaths,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/save") {
    try {
      const saveState = await readSaveFromDisk();
      sendJson(res, 200, {
        ok: true,
        save_path: SAVE_FILE_PATH,
        backup_paths: SAVE_BACKUP_PATHS,
        source_path: saveState.sourcePath,
        restored_from_backup: saveState.restoredFromBackup,
        save: saveState.save,
      });
      return;
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: "read_failed",
        message: String(error?.message || error),
      });
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/save") {
    try {
      const body = await readRequestBody(req);
      const parsed = body ? JSON.parse(body) : null;
      const savePayload =
        parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "save")
          ? parsed.save
          : parsed;

      if (!savePayload || typeof savePayload !== "object") {
        sendJson(res, 400, {
          ok: false,
          error: "invalid_payload",
        });
        return;
      }

      await writeSaveToDisk(savePayload);
      sendJson(res, 200, {
        ok: true,
        save_path: SAVE_FILE_PATH,
        backup_paths: SAVE_BACKUP_PATHS,
      });
      return;
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: "write_failed",
        message: String(error?.message || error),
      });
      return;
    }
  }

  if (req.method === "DELETE" && url.pathname === "/save") {
    try {
      await fsp.rm(SAVE_FILE_PATH, { force: true });
      await Promise.all(SAVE_BACKUP_PATHS.map((backupPath) => fsp.rm(backupPath, { force: true })));
      sendJson(res, 200, {
        ok: true,
        save_path: SAVE_FILE_PATH,
        backup_paths: SAVE_BACKUP_PATHS,
      });
      return;
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: "delete_failed",
        message: String(error?.message || error),
      });
      return;
    }
  }

  sendJson(res, 404, {
    ok: false,
    error: "not_found",
  });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendJson(res, 500, {
      ok: false,
      error: "unexpected_error",
      message: String(error?.message || error),
    });
  });
});

server.listen(PORT, "127.0.0.1", async () => {
  await ensureSaveDir();
  console.log("[pokeidle-save-bridge] listening on http://127.0.0.1:" + String(PORT));
  console.log("[pokeidle-save-bridge] save file: " + SAVE_FILE_PATH);
});
