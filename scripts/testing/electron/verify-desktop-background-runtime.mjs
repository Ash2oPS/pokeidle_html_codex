import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
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
const minimizeDurationMs = 8000;
const unfocusDurationMs = 2500;
const saveFilePath = path.join(
  process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
  "pokeidle-html-codex",
  "saves",
  "pokeidle_save_v3.json",
);

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

async function ensureArtifactsDirectory() {
  await fs.rm(artifactDir, { recursive: true, force: true });
  await fs.mkdir(artifactDir, { recursive: true });
}

function computeDelta(before, after) {
  return {
    enemiesDefeated: toNumber(after?.enemiesDefeated) - toNumber(before?.enemiesDefeated),
    money: toNumber(after?.money) - toNumber(before?.money),
    team0Xp: toNumber(after?.team0?.xp) - toNumber(before?.team0?.xp),
    enemyHp: toNumber(after?.enemy?.hpCurrent) - toNumber(before?.enemy?.hpCurrent),
    enemyChanged: String(after?.enemy?.id || "") !== String(before?.enemy?.id || ""),
    attackTimerChanged: toNumber(after?.attackTimerMs) !== toNumber(before?.attackTimerMs),
  };
}

async function snapshotCombatState(page) {
  return page.evaluate(() => {
    const safeNumber = (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    };
    const state = JSON.parse(window.render_game_to_text());
    const enemy = state?.enemy || null;
    const team0 = Array.isArray(state?.team) && state.team.length > 0 ? state.team[0] : null;
    return {
      documentHidden: document.hidden,
      visibilityState: document.visibilityState,
      hasFocus: typeof document.hasFocus === "function" ? document.hasFocus() : null,
      routeCombatEnabled: Boolean(state?.route_combat_enabled),
      enemiesDefeated: safeNumber(state?.enemies_defeated),
      money: safeNumber(state?.money),
      attackTimerMs: safeNumber(state?.attack_timer_ms),
      backgroundRuntime: state?.background_runtime || null,
      desktopWindowState: state?.background_runtime?.desktop_window_state || state?.desktopWindowState || null,
      enemy: enemy ? {
        id: enemy.pokemon_id || enemy.id || null,
        name: enemy.name_fr || enemy.nameFr || enemy.name || null,
        hpCurrent: safeNumber(enemy.hp_current ?? enemy.hpCurrent),
        hpMax: safeNumber(enemy.hp_max ?? enemy.hpMax),
      } : null,
      team0: team0 ? {
        id: team0.pokemon_id || team0.id || null,
        xp: safeNumber(team0.xp),
      } : null,
    };
  });
}

async function backupSaveFile() {
  try {
    return await fs.readFile(saveFilePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function restoreSaveFile(backupBuffer) {
  if (backupBuffer) {
    await fs.mkdir(path.dirname(saveFilePath), { recursive: true });
    await fs.writeFile(saveFilePath, backupBuffer);
    return;
  }
  await fs.rm(saveFilePath, { force: true }).catch(() => {});
}

async function waitForCombat(page) {
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

async function main() {
  await fs.access(executablePath);
  await ensureArtifactsDirectory();

  const server = createStaticServer(repoRoot);
  const port = await listen(server);
  const remoteUrl = `http://${host}:${port}/`;
  const saveBackup = await backupSaveFile();
  let electronApp = null;

  try {
    await fs.rm(saveFilePath, { force: true });

    electronApp = await electron.launch({
      executablePath,
      args: [`--remote-url=${remoteUrl}`],
    });

    const page = await electronApp.firstWindow();
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

    const meta = await page.evaluate(async () => ({
      locationHref: window.location.href,
      desktopMeta: await window.pokeidleDesktop?.getMeta?.(),
      bridgeWindowState: window.pokeidleDesktop?.getWindowState?.() || null,
    }));

    const starterClick = await page.evaluate(() => {
      const button = document.querySelector(".starter-choice");
      if (!button) {
        return { clicked: false };
      }
      button.click();
      return {
        clicked: true,
        label: String(button.textContent || "").trim(),
      };
    });

    await waitForCombat(page);
    await page.waitForFunction(() => {
      try {
        const state = JSON.parse(window.render_game_to_text());
        const enemy = state?.enemy;
        const hpCurrent = Number(enemy?.hp_current ?? enemy?.hpCurrent ?? 0);
        const hpMax = Number(enemy?.hp_max ?? enemy?.hpMax ?? 0);
        return hpCurrent > 0 && hpCurrent === hpMax;
      } catch {
        return false;
      }
    }, null, { timeout: 120000 });

    await page.waitForTimeout(500);
    const beforeMinimize = await snapshotCombatState(page);

    const minimizedWindow = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.minimize();
      return {
        isMinimized: win.isMinimized(),
        isVisible: win.isVisible(),
        isFocused: win.isFocused(),
      };
    });

    await page.waitForTimeout(minimizeDurationMs);
    const duringMinimize = await snapshotCombatState(page);

    const restoredWindow = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
      return {
        isMinimized: win.isMinimized(),
        isVisible: win.isVisible(),
        isFocused: win.isFocused(),
      };
    });

    await page.waitForTimeout(800);
    await page.screenshot({ path: screenshotPath });
    const afterRestore = await snapshotCombatState(page);

    const unfocusedWindow = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.blur();
      return {
        isMinimized: win.isMinimized(),
        isVisible: win.isVisible(),
        isFocused: win.isFocused(),
      };
    });

    await page.waitForTimeout(unfocusDurationMs);
    const duringUnfocus = await snapshotCombatState(page);

    const refocusedWindow = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.focus();
      return {
        isMinimized: win.isMinimized(),
        isVisible: win.isVisible(),
        isFocused: win.isFocused(),
      };
    });

    await page.waitForTimeout(700);
    const afterRefocus = await snapshotCombatState(page);

    const deltaDuringMinimize = computeDelta(beforeMinimize, duringMinimize);
    const deltaAfterRestore = computeDelta(beforeMinimize, afterRestore);
    const deltaDuringUnfocus = computeDelta(afterRestore, duringUnfocus);
    const deltaAfterRefocus = computeDelta(afterRestore, afterRefocus);
    const combatProgressedWhileMinimized = Boolean(
      deltaDuringMinimize.enemiesDefeated > 0
      || deltaDuringMinimize.money > 0
      || deltaDuringMinimize.team0Xp > 0
      || deltaDuringMinimize.enemyChanged
      || deltaDuringMinimize.enemyHp < 0
    );
    const resumeCatchupAfterRestore = toNumber(afterRestore?.backgroundRuntime?.last_resume_catchup_ms);
    const minimizeHandled = Boolean(
      combatProgressedWhileMinimized
      || resumeCatchupAfterRestore > 0
      || deltaAfterRestore.enemiesDefeated > 0
      || deltaAfterRestore.money > 0
      || deltaAfterRestore.team0Xp > 0
      || deltaAfterRestore.enemyChanged
      || deltaAfterRestore.enemyHp < 0
    );
    const unfocusHandled = Boolean(
      deltaDuringUnfocus.enemiesDefeated > 0
      || deltaDuringUnfocus.money > 0
      || deltaDuringUnfocus.team0Xp > 0
      || deltaDuringUnfocus.enemyChanged
      || deltaDuringUnfocus.enemyHp < 0
      || toNumber(afterRefocus?.backgroundRuntime?.last_resume_catchup_ms) > 0
      || deltaAfterRefocus.enemiesDefeated > 0
      || deltaAfterRefocus.money > 0
      || deltaAfterRefocus.team0Xp > 0
      || deltaAfterRefocus.enemyChanged
      || deltaAfterRefocus.enemyHp < 0
    );
    const backgroundStateObserved = duringMinimize?.backgroundRuntime?.activity_state === "background_live";
    const unfocusStateObserved = duringUnfocus?.backgroundRuntime?.activity_state === "foreground_unfocused";
    const restoredStateValid = !["background_live", "background_suspended"].includes(
      String(afterRestore?.backgroundRuntime?.activity_state || ""),
    );

    const report = {
      remoteUrl,
      executablePath,
      minimizeDurationMs,
      unfocusDurationMs,
      meta,
      starterClick,
      beforeMinimize,
      minimizedWindow,
      duringMinimize,
      restoredWindow,
      afterRestore,
      unfocusedWindow,
      duringUnfocus,
      refocusedWindow,
      afterRefocus,
      deltaDuringMinimize,
      deltaAfterRestore,
      deltaDuringUnfocus,
      deltaAfterRefocus,
      combatProgressedWhileMinimized,
      resumeCatchupAfterRestore,
      minimizeHandled,
      unfocusHandled,
      backgroundStateObserved,
      unfocusStateObserved,
      restoredStateValid,
      pass: minimizeHandled && unfocusHandled && restoredStateValid,
      artifacts: {
        reportPath,
        screenshotPath,
      },
    };

    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (!(minimizeHandled && unfocusHandled && restoredStateValid)) {
      throw new Error(
        `Le runtime desktop ne gere pas correctement le background: ${JSON.stringify({
          deltaDuringMinimize,
          deltaAfterRestore,
          deltaDuringUnfocus,
          deltaAfterRefocus,
          resumeCatchupAfterRestore,
          backgroundStateObserved,
          restoredStateValid,
        })}`,
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
    await restoreSaveFile(saveBackup);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
