import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";
import { DESKTOP_BACKGROUND_WATCHDOG_STALL_MS } from "../../../lib/gameplay-ui-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const executablePath = path.join(repoRoot, "output", "electron-dist", "win-unpacked", "PokeIdle.exe");
const artifactDir = path.join(repoRoot, "output", "playwright", "desktop-background-runtime");
const reportPath = path.join(artifactDir, "report.json");
const screenshotPath = path.join(artifactDir, "restored-window.png");
const minimizeDurationMs = 8000;
const unfocusDurationMs = 2500;
const RESTORE_RESPONSIVENESS_TIMEOUT_MS = 1500;
const ELECTRON_RESUME_CATCHUP_LIMIT_MS = 2 * DESKTOP_BACKGROUND_WATCHDOG_STALL_MS;
const saveFilePath = path.join(
  process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
  "pokeidle-html-codex",
  "saves",
  "pokeidle_save_v4c.json",
);

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
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

function getActivityStateFromSnapshot(snapshot) {
  return String(snapshot?.backgroundRuntime?.activity_state || "");
}

function isForegroundActivityState(snapshot) {
  return getActivityStateFromSnapshot(snapshot) === "foreground_active";
}

async function waitForForegroundResponsive(page, timeoutMs = RESTORE_RESPONSIVENESS_TIMEOUT_MS) {
  await page.waitForFunction(() => {
    try {
      return typeof window.render_game_to_text === "function"
        && typeof document.visibilityState === "string"
        && typeof document.hasFocus === "function";
    } catch {
      return false;
    }
  }, null, { timeout: timeoutMs });
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

  const saveBackup = await backupSaveFile();
  let electronApp = null;

  try {
    await fs.rm(saveFilePath, { force: true });

    electronApp = await electron.launch({
      executablePath,
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
    const resourceEntries = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => String(entry?.name || "")),
    );
    const githubPagesRequests = resourceEntries.filter((entry) => entry.includes("ash2ops.github.io/pokeidle_html_codex"));

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

    await waitForForegroundResponsive(page);
    const immediateAfterRestore = await snapshotCombatState(page);
    const immediateResumeCatchupAfterRestore = toNumber(
      immediateAfterRestore?.backgroundRuntime?.last_resume_catchup_ms,
    );
    const immediateRestoredForeground = isForegroundActivityState(immediateAfterRestore);
    if (immediateResumeCatchupAfterRestore > ELECTRON_RESUME_CATCHUP_LIMIT_MS) {
      throw new Error(
        `Electron resume catch-up trop grand apres restore: ${JSON.stringify({
          immediateResumeCatchupAfterRestore,
          resumeCatchupLimitMs: ELECTRON_RESUME_CATCHUP_LIMIT_MS,
          minimizeDurationMs,
        })}`,
      );
    }

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

    await waitForForegroundResponsive(page);
    const immediateAfterRefocus = await snapshotCombatState(page);
    const immediateResumeCatchupAfterRefocus = toNumber(
      immediateAfterRefocus?.backgroundRuntime?.last_resume_catchup_ms,
    );
    const immediateRefocusForeground = isForegroundActivityState(immediateAfterRefocus);
    if (immediateResumeCatchupAfterRefocus > ELECTRON_RESUME_CATCHUP_LIMIT_MS) {
      throw new Error(
        `Electron resume catch-up trop grand apres refocus: ${JSON.stringify({
          immediateResumeCatchupAfterRefocus,
          resumeCatchupLimitMs: ELECTRON_RESUME_CATCHUP_LIMIT_MS,
          unfocusDurationMs,
        })}`,
      );
    }

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
    const resumeCatchupAfterRestore = toNumber(immediateAfterRestore?.backgroundRuntime?.last_resume_catchup_ms);
    const resumeCatchupAfterRefocus = toNumber(immediateAfterRefocus?.backgroundRuntime?.last_resume_catchup_ms);
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
      || resumeCatchupAfterRefocus > 0
      || deltaAfterRefocus.enemiesDefeated > 0
      || deltaAfterRefocus.money > 0
      || deltaAfterRefocus.team0Xp > 0
      || deltaAfterRefocus.enemyChanged
      || deltaAfterRefocus.enemyHp < 0
    );
    const backgroundStateObserved = getActivityStateFromSnapshot(duringMinimize) === "background_live";
    const unfocusStateObserved = getActivityStateFromSnapshot(duringUnfocus) === "foreground_unfocused";
    const restoredStateValid = isForegroundActivityState(afterRestore);
    const refocusStateValid = isForegroundActivityState(afterRefocus);

    const report = {
      executablePath,
      minimizeDurationMs,
      unfocusDurationMs,
      meta,
      githubPagesRequests,
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
      resumeCatchupAfterRefocus,
      immediateAfterRestore,
      immediateAfterRefocus,
      immediateRestoredForeground,
      immediateRefocusForeground,
      minimizeHandled,
      unfocusHandled,
      backgroundStateObserved,
      unfocusStateObserved,
      restoredStateValid,
      refocusStateValid,
      pass: minimizeHandled
        && unfocusHandled
        && restoredStateValid
        && refocusStateValid
        && githubPagesRequests.length === 0
        && meta.desktopMeta?.assetMode === "local",
      artifacts: {
        reportPath,
        screenshotPath,
      },
    };

    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (!(minimizeHandled && unfocusHandled && restoredStateValid && refocusStateValid)) {
      throw new Error(
        `Le runtime desktop ne gere pas correctement le background: ${JSON.stringify({
          deltaDuringMinimize,
          deltaAfterRestore,
          deltaDuringUnfocus,
          deltaAfterRefocus,
          resumeCatchupAfterRestore,
          resumeCatchupAfterRefocus,
          backgroundStateObserved,
          restoredStateValid,
          refocusStateValid,
          immediateRestoredForeground,
          immediateRefocusForeground,
        })}`,
      );
    }
    if (githubPagesRequests.length > 0 || meta.desktopMeta?.assetMode !== "local") {
      throw new Error(
        `Le build desktop n'utilise pas exclusivement le bundle local: ${JSON.stringify({
          assetMode: meta.desktopMeta?.assetMode || null,
          locationHref: meta.locationHref,
          githubPagesRequests,
        })}`,
      );
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (electronApp) {
      await electronApp.close().catch(() => {});
    }
    await restoreSaveFile(saveBackup);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
