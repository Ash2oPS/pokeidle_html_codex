import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const rootDir = process.cwd();
const port = 5327;
const outputDir = path.join(rootDir, "output", "web-game-drag-swap");
fs.mkdirSync(outputDir, { recursive: true });

const mimeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function safeResolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalized = path.normalize(decoded).replace(/^([\\/])+/, "");
  const absolute = path.join(rootDir, normalized || "index.html");
  if (!absolute.startsWith(rootDir)) {
    return null;
  }
  return absolute;
}

const server = http.createServer((req, res) => {
  const requestPath = req.url || "/";
  let target = safeResolvePath(requestPath);
  if (!target) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, "index.html");
  }
  if (!fs.existsSync(target)) {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  const ext = path.extname(target).toLowerCase();
  const mime = mimeByExt[ext] || "application/octet-stream";
  try {
    const data = fs.readFileSync(target);
    res.setHeader("Content-Type", mime);
    res.statusCode = 200;
    res.end(data);
  } catch (error) {
    res.statusCode = 500;
    res.end(String(error?.message || error));
  }
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const errors = [];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console.error", text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    errors.push({ type: "pageerror", text: String(err) });
  });

  const url = `http://127.0.0.1:${port}/index.html?dev_seed_save=tmp/dev_seed_drag_save.json`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForFunction(() => {
    if (typeof window.render_game_to_text !== "function") {
      return false;
    }
    const state = JSON.parse(window.render_game_to_text());
    return state?.mode === "ready" && Array.isArray(state.team) && state.team.length >= 2 && !state.starter_modal_visible;
  }, null, { timeout: 20000 });

  const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const canvas = page.locator("#game-canvas");
  const bbox = await canvas.boundingBox();
  if (!bbox) {
    throw new Error("Canvas introuvable");
  }

  const fromSlot = before.team[0];
  const toSlot = before.team[1];
  const fromX = bbox.x + (Number(fromSlot.x || 0) / Math.max(1, Number(before.viewport?.width || 1))) * bbox.width;
  const fromY = bbox.y + (Number(fromSlot.y || 0) / Math.max(1, Number(before.viewport?.height || 1))) * bbox.height;
  const toX = bbox.x + (Number(toSlot.x || 0) / Math.max(1, Number(before.viewport?.width || 1))) * bbox.width;
  const toY = bbox.y + (Number(toSlot.y || 0) / Math.max(1, Number(before.viewport?.height || 1))) * bbox.height;

  await page.mouse.move(fromX, fromY);
  await page.mouse.down({ button: "left" });
  await page.mouse.move(toX, toY, { steps: 14 });
  await page.mouse.up({ button: "left" });

  const firstId = Number(before.team[0]?.id || 0);
  const secondId = Number(before.team[1]?.id || 0);
  await page.waitForFunction(
    ({ firstId: expectedFirst, secondId: expectedSecond }) => {
      if (typeof window.render_game_to_text !== "function") {
        return false;
      }
      const state = JSON.parse(window.render_game_to_text());
      return Number(state?.team?.[0]?.id || 0) === expectedSecond && Number(state?.team?.[1]?.id || 0) === expectedFirst;
    },
    { firstId, secondId },
    { timeout: 8000 },
  );

  const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  fs.writeFileSync(path.join(outputDir, "state-before.json"), JSON.stringify(before, null, 2));
  fs.writeFileSync(path.join(outputDir, "state-after.json"), JSON.stringify(after, null, 2));
  await page.screenshot({ path: path.join(outputDir, "shot-after.png"), fullPage: false });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  fs.writeFileSync(path.join(outputDir, "errors.json"), JSON.stringify(errors, null, 2));
}
