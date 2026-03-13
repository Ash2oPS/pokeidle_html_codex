import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "output", "web-game-drag-swap-locked");
fs.mkdirSync(outputDir, { recursive: true });

const mimeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
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
  let target = safeResolvePath(req.url || "/");
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
  res.setHeader("Content-Type", mime);
  res.end(fs.readFileSync(target));
});
await new Promise((resolve) => server.listen(5337, "127.0.0.1", resolve));

const errors = [];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
  });
  page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));

  const url = "http://127.0.0.1:5337/index.html?dev_seed_save=tmp/dev_seed_drag_locked_save.json";
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    if (typeof window.render_game_to_text !== "function") return false;
    const s = JSON.parse(window.render_game_to_text());
    return s?.mode === "ready" && Array.isArray(s.team) && s.team.length >= 2 && s.route_id === "kanto_route_1";
  }, null, { timeout: 20000 });

  for (let i = 0; i < 4; i += 1) {
    const tutorialOpen = await page.evaluate(() => {
      const s = typeof window.render_game_to_text === "function" ? JSON.parse(window.render_game_to_text()) : null;
      return Boolean(s?.tutorial_open);
    });
    if (!tutorialOpen) {
      break;
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
  }

  const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const canvas = page.locator("#game-canvas");
  const bbox = await canvas.boundingBox();
  if (!bbox) throw new Error("Canvas introuvable");

  const from = before.team[0];
  const to = before.team[1];
  const fromX = bbox.x + (Number(from.x || 0) / Math.max(1, Number(before.viewport?.width || 1))) * bbox.width;
  const fromY = bbox.y + (Number(from.y || 0) / Math.max(1, Number(before.viewport?.height || 1))) * bbox.height;
  const toX = bbox.x + (Number(to.x || 0) / Math.max(1, Number(before.viewport?.width || 1))) * bbox.width;
  const toY = bbox.y + (Number(to.y || 0) / Math.max(1, Number(before.viewport?.height || 1))) * bbox.height;

  await page.mouse.move(fromX, fromY);
  await page.mouse.down({ button: "left" });
  await page.mouse.move(toX, toY, { steps: 14 });
  await page.mouse.up({ button: "left" });

  await page.waitForTimeout(500);
  const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  fs.writeFileSync(path.join(outputDir, "state-before.json"), JSON.stringify(before, null, 2));
  fs.writeFileSync(path.join(outputDir, "state-after.json"), JSON.stringify(after, null, 2));
  await page.screenshot({ path: path.join(outputDir, "shot-after.png"), fullPage: false });

  const beforeFirst = Number(before.team?.[0]?.id || 0);
  const beforeSecond = Number(before.team?.[1]?.id || 0);
  const afterFirst = Number(after.team?.[0]?.id || 0);
  const afterSecond = Number(after.team?.[1]?.id || 0);
  if (beforeFirst !== afterFirst || beforeSecond !== afterSecond) {
    throw new Error(`Le swap aurait du etre bloque mais l'ordre a change: ${beforeFirst},${beforeSecond} -> ${afterFirst},${afterSecond}`);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  fs.writeFileSync(path.join(outputDir, "errors.json"), JSON.stringify(errors, null, 2));
}
