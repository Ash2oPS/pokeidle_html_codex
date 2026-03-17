import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const executablePath = path.join(repoRoot, "output", "electron-dist", "win-unpacked", "PokeIdle.exe");
const artifactDir = path.join(repoRoot, "output", "playwright", "desktop-background-runtime");
const reportPath = path.join(artifactDir, "report.json");
const screenshotPath = path.join(artifactDir, "restored-window.png");
const host = "127.0.0.1";
const monitorTickMs = 50;
const minimizeDurationMs = 2500;
const minExpectedIntervalDelta = 10;

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

async function ensureArtifactsDirectory() {
  await fs.rm(artifactDir, { recursive: true, force: true });
  await fs.mkdir(artifactDir, { recursive: true });
}

async function installMonitor(page) {
  return page.evaluate(({ tickMs }) => {
    const existing = window.__codexBackgroundMonitor;
    if (existing?.intervalId) {
      window.clearInterval(existing.intervalId);
    }
    if (existing?.rafId) {
      window.cancelAnimationFrame(existing.rafId);
    }
    if (typeof existing?.visibilityHandler === "function") {
      document.removeEventListener("visibilitychange", existing.visibilityHandler);
    }

    const monitor = {
      intervalCount: 0,
      rafCount: 0,
      hiddenTransitions: 0,
      lastHidden: document.hidden,
      lastVisibilityState: document.visibilityState,
      lastIntervalAtMs: 0,
      lastRafAtMs: 0,
      startedAtMs: Date.now(),
      intervalId: 0,
      rafId: 0,
      visibilityHandler: null,
    };

    monitor.intervalId = window.setInterval(() => {
      monitor.intervalCount += 1;
      monitor.lastIntervalAtMs = performance.now();
    }, tickMs);

    const handleRaf = () => {
      monitor.rafCount += 1;
      monitor.lastRafAtMs = performance.now();
      monitor.rafId = window.requestAnimationFrame(handleRaf);
    };

    monitor.visibilityHandler = () => {
      monitor.hiddenTransitions += 1;
      monitor.lastHidden = document.hidden;
      monitor.lastVisibilityState = document.visibilityState;
    };

    document.addEventListener("visibilitychange", monitor.visibilityHandler);
    monitor.rafId = window.requestAnimationFrame(handleRaf);
    window.__codexBackgroundMonitor = monitor;

    return {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      renderStateAvailable: typeof window.render_game_to_text === "function",
    };
  }, { tickMs: monitorTickMs });
}

async function readMonitorState(page) {
  return page.evaluate(() => {
    const monitor = window.__codexBackgroundMonitor || {};
    let renderState = null;
    if (typeof window.render_game_to_text === "function") {
      try {
        renderState = window.render_game_to_text();
      } catch (error) {
        renderState = {
          error: String(error?.message || error || "render_game_to_text failed"),
        };
      }
    }
    return {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      intervalCount: Number(monitor.intervalCount || 0),
      rafCount: Number(monitor.rafCount || 0),
      hiddenTransitions: Number(monitor.hiddenTransitions || 0),
      lastHidden: Boolean(monitor.lastHidden),
      lastVisibilityState: String(monitor.lastVisibilityState || document.visibilityState || ""),
      lastIntervalAtMs: Number(monitor.lastIntervalAtMs || 0),
      lastRafAtMs: Number(monitor.lastRafAtMs || 0),
      renderState,
    };
  });
}

async function writeReport(report) {
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  await fs.access(executablePath);
  await ensureArtifactsDirectory();

  const server = createStaticServer(repoRoot);
  const port = await listen(server);
  const remoteUrl = `http://${host}:${port}/`;
  let electronApp = null;

  try {
    electronApp = await electron.launch({
      executablePath,
      args: [`--remote-url=${remoteUrl}`],
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForFunction(() => document.readyState === "complete");
    await page.waitForTimeout(1200);

    const monitorInstall = await installMonitor(page);
    await page.waitForTimeout(600);
    const beforeMinimize = await readMonitorState(page);

    const minimizedWindow = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.minimize();
      return {
        isMinimized: win.isMinimized(),
        isVisible: win.isVisible(),
      };
    });

    await page.waitForTimeout(minimizeDurationMs);
    const duringMinimize = await readMonitorState(page);

    const restoredWindow = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
      return {
        isMinimized: win.isMinimized(),
        isVisible: win.isVisible(),
      };
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath });
    const afterRestore = await readMonitorState(page);

    const minimizedIntervalDelta = duringMinimize.intervalCount - beforeMinimize.intervalCount;
    const minimizedRafDelta = duringMinimize.rafCount - beforeMinimize.rafCount;

    const report = {
      remoteUrl,
      executablePath,
      monitorInstall,
      minimizedWindow,
      restoredWindow,
      beforeMinimize,
      duringMinimize,
      afterRestore,
      minimizedIntervalDelta,
      minimizedRafDelta,
      pass: minimizedIntervalDelta >= minExpectedIntervalDelta,
      criteria: {
        minExpectedIntervalDelta,
        minimizeDurationMs,
        monitorTickMs,
      },
      artifacts: {
        reportPath,
        screenshotPath,
      },
    };

    await writeReport(report);

    if (minimizedIntervalDelta < minExpectedIntervalDelta) {
      throw new Error(
        `Le runtime desktop s'est fige en background: interval delta ${minimizedIntervalDelta} < ${minExpectedIntervalDelta}.`,
      );
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (electronApp) {
      await electronApp.close().catch(() => {});
    }
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
