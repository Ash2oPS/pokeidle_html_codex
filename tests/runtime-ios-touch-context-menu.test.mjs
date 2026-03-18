import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { devices, webkit } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const artifactDir = path.join(repoRoot, "output", "playwright", "runtime-ios-touch-context-menu");
const screenshotPath = path.join(artifactDir, "small-drift-context-menu.png");

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".webp", "image/webp"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".txt", "text/plain; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
]);

function getContentType(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
}

async function resolveStaticFile(rootDir, urlPath) {
  const normalizedPath = urlPath === "/" ? "/index.html" : urlPath;
  const decodedPath = decodeURIComponent(normalizedPath);
  const resolvedPath = path.resolve(rootDir, `.${decodedPath}`);
  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }
  try {
    const stats = await fs.stat(resolvedPath);
    if (stats.isDirectory()) {
      const indexPath = path.join(resolvedPath, "index.html");
      await fs.access(indexPath);
      return indexPath;
    }
    return resolvedPath;
  } catch {
    return null;
  }
}

function createStaticServer(rootDir) {
  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${host}`);
      const filePath = await resolveStaticFile(rootDir, requestUrl.pathname);
      if (!filePath) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      const body = await fs.readFile(filePath);
      response.writeHead(200, {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "no-store",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(String(error?.message || error || "Server error"));
    }
  });
}

async function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Impossible de recuperer le port du serveur local."));
        return;
      }
      resolve(address.port);
    });
  });
}

async function readTextState(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}

async function dispatchTouchPointer(page, type, { clientX, clientY }, buttons) {
  await page.evaluate(({ eventType, x, y, activeButtons }) => {
    const canvas = document.getElementById("game-canvas");
    if (!canvas) {
      throw new Error("Canvas de jeu introuvable.");
    }
    const event = new PointerEvent(eventType, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      buttons: activeButtons,
      width: 24,
      height: 24,
      pressure: activeButtons > 0 ? 0.5 : 0,
    });
    canvas.dispatchEvent(event);
  }, {
    eventType: type,
    x: clientX,
    y: clientY,
    activeButtons: buttons,
  });
}

test(
  "ios webkit garde le long press du menu contextuel avec une petite derive du doigt",
  { timeout: 120000 },
  async () => {
    let browser;
    let context;
    let page;
    let server;

    await fs.rm(artifactDir, { recursive: true, force: true });
    await fs.mkdir(artifactDir, { recursive: true });

    try {
      server = createStaticServer(repoRoot);
      const port = await listen(server);
      browser = await webkit.launch({ headless: true });
      context = await browser.newContext({
        ...devices["iPhone 13"],
      });
      page = await context.newPage();

      await page.goto(`http://${host}:${port}/`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await page.waitForSelector("#starter-modal:not(.hidden) .starter-choice", { timeout: 120000 });
      await page.locator("#starter-modal:not(.hidden) .starter-choice").first().click();
      await page.waitForSelector("#tutorial-close-btn", { state: "visible", timeout: 120000 });
      await page.click("#tutorial-close-btn");
      await page.waitForFunction(() => {
        if (typeof window.render_game_to_text !== "function") {
          return false;
        }
        const state = JSON.parse(window.render_game_to_text());
        return (
          state?.mode === "ready"
          && !state?.tutorial_open
          && Array.isArray(state?.team)
          && state.team[0]
          && Number(state?.viewport?.width || 0) > 0
          && Number(state?.viewport?.height || 0) > 0
        );
      }, null, { timeout: 120000 });

      const startPoint = await page.evaluate(() => {
        const state = JSON.parse(window.render_game_to_text());
        const member = Array.isArray(state.team) ? state.team[0] : null;
        const canvas = document.getElementById("game-canvas");
        if (!member || !canvas) {
          return null;
        }
        const rect = canvas.getBoundingClientRect();
        const viewportWidth = Math.max(1, Number(state?.viewport?.width || 0));
        const viewportHeight = Math.max(1, Number(state?.viewport?.height || 0));
        return {
          clientX: rect.left + (Number(member.x || 0) / viewportWidth) * rect.width,
          clientY: rect.top + (Number(member.y || 0) / viewportHeight) * rect.height,
        };
      });

      assert.ok(startPoint, "Le premier Pokemon d'equipe doit avoir un point de depart exploitable.");
      assert.ok(Number.isFinite(startPoint.clientX), "clientX de depart invalide.");
      assert.ok(Number.isFinite(startPoint.clientY), "clientY de depart invalide.");

      await dispatchTouchPointer(page, "pointerdown", startPoint, 1);
      await page.waitForTimeout(120);
      await dispatchTouchPointer(page, "pointermove", {
        clientX: startPoint.clientX + 12,
        clientY: startPoint.clientY,
      }, 1);
      await page.waitForTimeout(520);

      const textState = await readTextState(page);
      assert.equal(
        textState.team_context_menu_open,
        true,
        "Le menu contextuel devrait s'ouvrir apres un long press avec une derive de 12px sur iOS.",
      );
      assert.equal(textState.team_drag_active, false);
      assert.equal(textState.team_drag_moved, false);

      await page.screenshot({ path: screenshotPath });
      await dispatchTouchPointer(page, "pointerup", {
        clientX: startPoint.clientX + 12,
        clientY: startPoint.clientY,
      }, 0);
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server) {
        await new Promise((resolve) => server.close(() => resolve()));
      }
    }
  },
);
