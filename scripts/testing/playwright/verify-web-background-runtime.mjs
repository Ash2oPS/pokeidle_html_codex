import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { BACKGROUND_TICK_INTERVAL_MS } from "../../../lib/gameplay-ui-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const host = "127.0.0.1";
const RESTORE_RESPONSIVENESS_TIMEOUT_MS = 1500;
const DESKTOP_RESUME_CATCHUP_LIMIT_MS = 2 * BACKGROUND_TICK_INTERVAL_MS;

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

function parseArgs(argv) {
  const args = {
    mode: "desktop",
    backgroundMs: 8000,
    headless: true,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--mode" && next) {
      args.mode = String(next || "desktop").toLowerCase().trim();
      index += 1;
    } else if (arg === "--background-ms" && next) {
      args.backgroundMs = Math.max(1, Number(next) || 0);
      index += 1;
    } else if (arg === "--headless" && next) {
      args.headless = next !== "0" && next !== "false";
      index += 1;
    }
  }
  if (!["desktop", "mobile"].includes(args.mode)) {
    throw new Error(`Mode invalide: ${args.mode}`);
  }
  return args;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

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

function getOutputPaths(mode) {
  const variant = mode === "mobile" ? "mobile-portrait" : "desktop-landscape";
  const artifactDir = path.join(repoRoot, "output", "playwright", "web-background-runtime", variant);
  return {
    artifactDir,
    reportPath: path.join(artifactDir, "report.json"),
    screenshotPath: path.join(artifactDir, "restored.png"),
  };
}

async function ensureArtifactsDirectory(artifactDir) {
  await fs.rm(artifactDir, { recursive: true, force: true });
  await fs.mkdir(artifactDir, { recursive: true });
}

async function waitForRuntimeReady(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => typeof window.render_game_to_text === "function", null, { timeout: 120000 });
  await page.waitForFunction(() => {
    try {
      return JSON.parse(window.render_game_to_text())?.mode === "ready";
    } catch {
      return false;
    }
  }, null, { timeout: 120000 });
  await page.waitForFunction(() => document.querySelectorAll(".starter-choice").length > 0, null, {
    timeout: 120000,
  });
}

async function chooseStarterAndWaitForCombat(page) {
  await page.evaluate(() => {
    const button = document.querySelector(".starter-choice");
    if (button instanceof HTMLElement) {
      button.click();
    }
  });
  await page.waitForFunction(() => {
    try {
      const state = JSON.parse(window.render_game_to_text());
      return state
        && state.mode === "ready"
        && state.starter_modal_visible === false
        && state.route_combat_enabled === true
        && Array.isArray(state.team)
        && state.team.length > 0
        && state.enemy
        && Number(state.enemy.hp_current ?? state.enemy.hpCurrent ?? 0) > 0;
    } catch {
      return false;
    }
  }, null, { timeout: 120000 });
}

async function installSyntheticLifecycleShim(page) {
  await page.evaluate(() => {
    if (window.__pokeidleSyntheticLifecycleInstalled) {
      return;
    }
    const lifecycleState = {
      hidden: Boolean(document.hidden),
      focused: typeof document.hasFocus === "function" ? Boolean(document.hasFocus()) : true,
    };
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get() {
        return Boolean(lifecycleState.hidden);
      },
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get() {
        return lifecycleState.hidden ? "hidden" : "visible";
      },
    });
    document.hasFocus = () => Boolean(lifecycleState.focused);
    window.__pokeidleSetSyntheticLifecycle = (next = {}) => {
      if (Object.prototype.hasOwnProperty.call(next, "hidden")) {
        lifecycleState.hidden = Boolean(next.hidden);
      }
      if (Object.prototype.hasOwnProperty.call(next, "focused")) {
        lifecycleState.focused = Boolean(next.focused);
      }
    };
    window.__pokeidleDispatchSyntheticLifecycle = (kind, payload = {}) => {
      if (kind === "pagehide" || kind === "pageshow") {
        const event = typeof PageTransitionEvent === "function"
          ? new PageTransitionEvent(kind, { persisted: Boolean(payload.persisted) })
          : new Event(kind);
        if (!("persisted" in event)) {
          Object.defineProperty(event, "persisted", {
            configurable: true,
            value: Boolean(payload.persisted),
          });
        }
        window.dispatchEvent(event);
        return;
      }
      const target = kind === "visibilitychange" || kind === "freeze" || kind === "resume"
        ? document
        : window;
      target.dispatchEvent(new Event(kind));
    };
    window.__pokeidleSyntheticLifecycleInstalled = true;
  });
}

async function setSyntheticLifecycle(page, nextState = {}) {
  await page.evaluate((payload) => {
    window.__pokeidleSetSyntheticLifecycle?.(payload);
  }, nextState);
}

async function dispatchSyntheticLifecycle(page, kind, payload = {}) {
  await page.evaluate(({ nextKind, nextPayload }) => {
    window.__pokeidleDispatchSyntheticLifecycle?.(nextKind, nextPayload);
  }, {
    nextKind: kind,
    nextPayload: payload,
  });
}

async function snapshotRuntime(page) {
  return page.evaluate(() => {
    const state = JSON.parse(window.render_game_to_text());
    const team0 = Array.isArray(state?.team) && state.team.length > 0 ? state.team[0] : null;
    return {
      documentHidden: Boolean(document.hidden),
      visibilityState: document.visibilityState,
      hasFocus: typeof document.hasFocus === "function" ? Boolean(document.hasFocus()) : null,
      enemiesDefeated: Number(state?.enemies_defeated || 0),
      money: Number(state?.money || 0),
      attackTimerMs: Number(state?.attack_timer_ms || 0),
      team0: team0 ? {
        id: team0.id,
        xp: Number(team0.xp || 0),
      } : null,
      enemy: state?.enemy ? {
        id: state.enemy.id,
        hpCurrent: Number(state.enemy.hp_current ?? state.enemy.hpCurrent ?? 0),
        hpMax: Number(state.enemy.hp_max ?? state.enemy.hpMax ?? 0),
      } : null,
      backgroundRuntime: state?.background_runtime || null,
    };
  });
}

function computeDelta(before, after) {
  return {
    enemiesDefeated: toNumber(after?.enemiesDefeated) - toNumber(before?.enemiesDefeated),
    money: toNumber(after?.money) - toNumber(before?.money),
    team0Xp: toNumber(after?.team0?.xp) - toNumber(before?.team0?.xp),
    enemyHp: toNumber(after?.enemy?.hpCurrent) - toNumber(before?.enemy?.hpCurrent),
    enemyChanged: String(after?.enemy?.id || "") !== String(before?.enemy?.id || ""),
  };
}

function getActivityStateFromSnapshot(snapshot) {
  return String(snapshot?.backgroundRuntime?.activity_state || "");
}

function isForegroundActivityState(snapshot) {
  return getActivityStateFromSnapshot(snapshot) === "foreground_active";
}

async function waitForForegroundResponsive(page, timeoutMs = RESTORE_RESPONSIVENESS_TIMEOUT_MS) {
  await page.waitForFunction(() => {
    try {
      if (typeof window.render_game_to_text !== "function") {
        return false;
      }
      const state = JSON.parse(window.render_game_to_text());
      return String(state?.background_runtime?.activity_state || "") === "foreground_active";
    } catch {
      return false;
    }
  }, null, { timeout: timeoutMs });
}

async function main() {
  const args = parseArgs(process.argv);
  const output = getOutputPaths(args.mode);
  await ensureArtifactsDirectory(output.artifactDir);

  const server = createStaticServer(repoRoot);
  const port = await listen(server);
  const remoteUrl = `http://${host}:${port}/?debugBackgroundRuntime=1`;
  const browser = await chromium.launch({
    headless: args.headless,
  });

  const viewport = args.mode === "mobile"
    ? { width: 430, height: 932, isMobile: true, hasTouch: true }
    : { width: 1366, height: 768, isMobile: false, hasTouch: false };
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1,
  });

  try {
    const page = await context.newPage();
    await page.goto(remoteUrl, {
      waitUntil: "domcontentloaded",
    });
    await waitForRuntimeReady(page);
    await chooseStarterAndWaitForCombat(page);
    await installSyntheticLifecycleShim(page);
    await page.waitForTimeout(600);

    const beforeBackground = await snapshotRuntime(page);

    await setSyntheticLifecycle(page, {
      hidden: true,
      focused: false,
    });
    await dispatchSyntheticLifecycle(page, "visibilitychange");
    await dispatchSyntheticLifecycle(page, "blur");
    if (args.mode === "mobile") {
      await dispatchSyntheticLifecycle(page, "pagehide", { persisted: true });
      await dispatchSyntheticLifecycle(page, "freeze");
    }

    await page.waitForTimeout(args.backgroundMs);
    const duringBackground = await snapshotRuntime(page);

    if (args.mode === "mobile") {
      await dispatchSyntheticLifecycle(page, "resume");
      await dispatchSyntheticLifecycle(page, "pageshow", { persisted: true });
    }
    await setSyntheticLifecycle(page, {
      hidden: false,
      focused: true,
    });
    await dispatchSyntheticLifecycle(page, "visibilitychange");
    await dispatchSyntheticLifecycle(page, "focus");

    await waitForForegroundResponsive(page);
    const immediateAfterRestore = await snapshotRuntime(page);
    const immediateResumeCatchupMs = toNumber(immediateAfterRestore?.backgroundRuntime?.last_resume_catchup_ms);
    const immediateRestoredForeground = isForegroundActivityState(immediateAfterRestore);
    if (args.mode === "desktop" && immediateResumeCatchupMs > DESKTOP_RESUME_CATCHUP_LIMIT_MS) {
      throw new Error(
        `Desktop resume catch-up trop grand: ${JSON.stringify({
          immediateResumeCatchupMs,
          resumeCatchupLimitMs: DESKTOP_RESUME_CATCHUP_LIMIT_MS,
          backgroundMs: args.backgroundMs,
        })}`,
      );
    }

    await page.waitForTimeout(1200);
    await page.screenshot({
      path: output.screenshotPath,
      fullPage: true,
    });
    const afterRestore = await snapshotRuntime(page);

    const deltaDuringBackground = computeDelta(beforeBackground, duringBackground);
    const deltaAfterRestore = computeDelta(beforeBackground, afterRestore);
    const backgroundRuntime = afterRestore.backgroundRuntime || {};
    const restoredProgressed = Boolean(
      deltaAfterRestore.enemiesDefeated > 0
      || deltaAfterRestore.money > 0
      || deltaAfterRestore.team0Xp > 0
      || deltaAfterRestore.enemyHp < 0
      || deltaAfterRestore.enemyChanged
    );
    const resumeCatchupMs = toNumber(backgroundRuntime.last_resume_catchup_ms);
    const liveDuringBackground = getActivityStateFromSnapshot(duringBackground) === "background_live";
    const suspendedDuringBackground = getActivityStateFromSnapshot(duringBackground) === "background_suspended";
    const restoredForeground = isForegroundActivityState(afterRestore);
    const pass = args.mode === "desktop"
      ? Boolean(
        liveDuringBackground
        && immediateRestoredForeground
        && restoredForeground
        && (
          restoredProgressed
          || deltaDuringBackground.enemiesDefeated > 0
          || deltaDuringBackground.money > 0
          || deltaDuringBackground.team0Xp > 0
        )
        && resumeCatchupMs <= DESKTOP_RESUME_CATCHUP_LIMIT_MS
      )
      : Boolean(
        suspendedDuringBackground
        && immediateRestoredForeground
        && restoredForeground
        && restoredProgressed
        && (resumeCatchupMs > 0 || deltaAfterRestore.enemiesDefeated > 0 || deltaAfterRestore.money > 0),
      );

    const report = {
      mode: args.mode,
      backgroundMs: args.backgroundMs,
      remoteUrl,
      beforeBackground,
      duringBackground,
      afterRestore,
      deltaDuringBackground,
      deltaAfterRestore,
      liveDuringBackground,
      immediateAfterRestore,
      immediateRestoredForeground,
      immediateResumeCatchupMs,
      resumeCatchupLimitMs: args.mode === "desktop" ? DESKTOP_RESUME_CATCHUP_LIMIT_MS : null,
      pass,
      restoredForeground,
      suspendedDuringBackground,
      artifacts: {
        reportPath: output.reportPath,
        screenshotPath: output.screenshotPath,
      },
    };
    await fs.writeFile(output.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (!pass) {
      throw new Error(`Background web runtime invalide: ${JSON.stringify(report, null, 2)}`);
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
