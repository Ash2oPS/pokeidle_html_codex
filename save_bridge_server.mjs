import http from "node:http";
import { promises as fsp } from "node:fs";
import path from "node:path";
import os from "node:os";

const PORT = Number(process.env.POKEIDLE_SAVE_PORT || 38475);
const APPDATA_DIR = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const SAVE_DIR = path.join(APPDATA_DIR, "PokeIdle");
const SAVE_FILE_PATH = path.join(SAVE_DIR, "save_main.json");
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

async function readSaveFromDisk() {
  try {
    const raw = await fsp.readFile(SAVE_FILE_PATH, "utf8");
    if (!raw || !raw.trim()) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeSaveToDisk(savePayload) {
  await ensureSaveDir();
  const tempPath = SAVE_FILE_PATH + ".tmp";
  const serialized = JSON.stringify(savePayload, null, 2);
  await fsp.writeFile(tempPath, serialized, "utf8");
  await fsp.rename(tempPath, SAVE_FILE_PATH);
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
    sendJson(res, 200, {
      ok: true,
      save_path: SAVE_FILE_PATH,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/save") {
    try {
      const save = await readSaveFromDisk();
      sendJson(res, 200, {
        ok: true,
        save_path: SAVE_FILE_PATH,
        save,
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
      sendJson(res, 200, {
        ok: true,
        save_path: SAVE_FILE_PATH,
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
