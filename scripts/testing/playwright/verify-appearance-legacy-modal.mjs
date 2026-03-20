import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import {
  COMPACT_SAVE_BALL_ORDER,
  COMPACT_SAVE_FORMAT_ID,
  COMPACT_SAVE_ITEM_ORDER,
  encodeCompactSave,
} from "../../../lib/compact-save-codec.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const outputRoot = path.join(repoRoot, "output", "appearance-legacy-modal");
const seedRelativePath = "/output/appearance-legacy-modal/appearance-legacy-v7.json";
const seedFilePath = path.join(outputRoot, "appearance-legacy-v7.json");
const serverHost = "127.0.0.1";
const serverPort = 5334;

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createDefaultBallCaptureRules() {
  return {
    capture_all: true,
    capture_unowned: true,
    capture_owned: true,
    capture_shiny: true,
    capture_ultra_shiny: true,
  };
}

function createEmptySeedSave() {
  const ballInventory = Object.fromEntries(COMPACT_SAVE_BALL_ORDER.map((ballType) => [ballType, 0]));
  const ballInventorySeen = Object.fromEntries(
    COMPACT_SAVE_BALL_ORDER.map((ballType) => [ballType, ballType === "poke_ball"]),
  );
  const ballCaptureRules = Object.fromEntries(
    COMPACT_SAVE_BALL_ORDER.map((ballType) => [ballType, createDefaultBallCaptureRules()]),
  );
  const shopItems = Object.fromEntries(COMPACT_SAVE_ITEM_ORDER.map((itemId) => [itemId, 0]));
  return {
    version: 7,
    app_build_version: "0.1.52",
    starter_chosen: false,
    current_route_id: "kanto_route_1",
    unlocked_route_ids: ["kanto_city_pallet_town", "kanto_route_1"],
    route_defeat_counts: {
      kanto_city_pallet_town: 0,
      kanto_route_1: 1,
    },
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 1234,
    coins: 12,
    first_free_pokeball_claimed: true,
    first_free_pokeball_guaranteed_capture_pending: false,
    ball_inventory: ballInventory,
    ball_inventory_seen: ballInventorySeen,
    ball_capture_rules: ballCaptureRules,
    active_ball_type: "poke_ball",
    shop_items: shopItems,
    attack_boost_until_ms: 0,
    pokeballs: 0,
    tutorials: {
      route1_intro_seen: true,
      evolution_intro_seen: false,
      appearance_intro_seen: true,
      appearance_editor_unlocked: true,
    },
    legacy_shiny_family_root_ids: [],
    legacy_ultra_shiny_family_root_ids: [],
  };
}

function normalizePokemonEntityRecord(rawEntity, pokemonId) {
  return {
    id: Number(pokemonId),
    level: Math.max(1, Number(rawEntity?.level || 1)),
    xp: Math.max(0, Number(rawEntity?.xp || 0)),
    entity_unlocked: Boolean(rawEntity?.entity_unlocked),
    appearance_owned_variants: Array.isArray(rawEntity?.appearance_owned_variants)
      ? [...rawEntity.appearance_owned_variants]
      : [],
    appearance_selected_variant: String(rawEntity?.appearance_selected_variant || ""),
    appearance_shiny_mode: Boolean(rawEntity?.appearance_shiny_mode),
    appearance_ultra_shiny_mode: Boolean(rawEntity?.appearance_ultra_shiny_mode),
    evolution_item_ready_targets: Array.isArray(rawEntity?.evolution_item_ready_targets)
      ? [...rawEntity.evolution_item_ready_targets]
      : [],
    nickname: String(rawEntity?.nickname || ""),
    happiness_box_streak_ms: Math.max(0, Number(rawEntity?.happiness_box_streak_ms || 0)),
    species_name_en: "",
    talent: null,
    base_stats: {},
    stats: {},
    encountered_normal: Math.max(0, Number(rawEntity?.encountered_normal || 0)),
    encountered_shiny: Math.max(0, Number(rawEntity?.encountered_shiny || 0)),
    encountered_ultra_shiny: Math.max(0, Number(rawEntity?.encountered_ultra_shiny || 0)),
    defeated_normal: Math.max(0, Number(rawEntity?.defeated_normal || 0)),
    defeated_shiny: Math.max(0, Number(rawEntity?.defeated_shiny || 0)),
    defeated_ultra_shiny: Math.max(0, Number(rawEntity?.defeated_ultra_shiny || 0)),
    captured_normal: Math.max(0, Number(rawEntity?.captured_normal || 0)),
    captured_shiny: Math.max(0, Number(rawEntity?.captured_shiny || 0)),
    captured_ultra_shiny: Math.max(0, Number(rawEntity?.captured_ultra_shiny || 0)),
  };
}

function writeSeedSave() {
  ensureDir(outputRoot);
  const seedSave = createEmptySeedSave();
  seedSave.starter_chosen = true;
  seedSave.team = [1];
  seedSave.legacy_shiny_family_root_ids = [1];
  seedSave.pokemon_entities["1"] = normalizePokemonEntityRecord({
    id: 1,
    level: 12,
    xp: 50,
    entity_unlocked: true,
    captured_normal: 1,
    encountered_normal: 3,
    defeated_normal: 2,
  }, 1);

  const encoded = encodeCompactSave(seedSave, {
    formatId: COMPACT_SAVE_FORMAT_ID,
    saveVersion: 7,
    appVersion: "0.1.52",
    routeIdOrder: ["kanto_city_pallet_town", "kanto_route_1"],
    defaultRouteId: "kanto_route_1",
    createEmptySave: createEmptySeedSave,
    normalizePokemonEntityRecord,
  });

  fs.writeFileSync(seedFilePath, JSON.stringify(encoded));
}

function createStaticServer(rootDir) {
  return createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${serverHost}:${serverPort}`);
    let requestPath = decodeURIComponent(requestUrl.pathname || "/");
    if (requestPath === "/") {
      requestPath = "/index.html";
    }
    const resolvedPath = path.resolve(rootDir, `.${requestPath}`);
    if (!resolvedPath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": getMimeType(resolvedPath) });
    fs.createReadStream(resolvedPath).pipe(response);
  });
}

async function readState(page) {
  const stateText = await page.evaluate(() => {
    if (typeof window.render_game_to_text !== "function") {
      return "";
    }
    return window.render_game_to_text();
  });
  return {
    text: stateText,
    json: stateText ? JSON.parse(stateText) : null,
  };
}

async function openAppearanceModal(page, target) {
  const snapshot = await readState(page);
  const state = snapshot.json;
  if (!state || !Array.isArray(state.team) || state.team.length <= 0) {
    throw new Error(`Equipe introuvable pour ${target.name}.`);
  }

  const stageBox = await page.locator("#game-capture-root").first().boundingBox();
  if (!stageBox) {
    throw new Error(`Zone de capture introuvable pour ${target.name}.`);
  }

  const teamMember = state.team[0];
  const clickX = stageBox.x + Number(teamMember.x || 0);
  const clickY = stageBox.y + Number(teamMember.y || 0);

  await page.mouse.click(clickX, clickY, { button: "right" });
  try {
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).team_context_menu_open === true, null, {
      timeout: 1500,
    });
  } catch {
    if (!target.hasTouch) {
      throw new Error(`Menu contextuel introuvable sur ${target.name}.`);
    }

    await page.evaluate(({ clientX, clientY }) => {
      const targetEl = document.querySelector("canvas") || document.querySelector("#game-capture-root") || document.body;
      const down = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        pointerId: 11,
        pointerType: "touch",
        isPrimary: true,
        buttons: 1,
      });
      targetEl.dispatchEvent(down);
    }, { clientX: clickX, clientY: clickY });

    await page.waitForTimeout(720);

    await page.evaluate(({ clientX, clientY }) => {
      const targetEl = document.querySelector("canvas") || document.querySelector("#game-capture-root") || document.body;
      const up = new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        pointerId: 11,
        pointerType: "touch",
        isPrimary: true,
        buttons: 0,
      });
      targetEl.dispatchEvent(up);
    }, { clientX: clickX, clientY: clickY });

    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).team_context_menu_open === true, null, {
      timeout: 3000,
    });
  }

  const openMeta = await page.evaluate(() => {
    const button = document.querySelector("#team-context-menu-appearance");
    const meta = {
      hasDirectOpen: typeof window.openAppearanceForTeamSlot === "function",
      buttonDisabled: Boolean(button?.disabled),
      buttonText: String(button?.textContent || ""),
    };
    if (typeof window.openAppearanceForTeamSlot === "function") {
      window.openAppearanceForTeamSlot(0);
      return meta;
    }
    if (button instanceof HTMLElement) {
      button.click();
    }
    return meta;
  });
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).appearance_open === true, null, {
    timeout: 5000,
  }).catch(async () => {
    const stateAfterClick = await readState(page);
    throw new Error(
      `Impossible d'ouvrir le modal d'apparence (${target.name}) | ${JSON.stringify({
        ...openMeta,
        appearanceOpen: stateAfterClick.json?.appearance_open,
        teamContextMenuOpen: stateAfterClick.json?.team_context_menu_open,
      })}`,
    );
  });
  await page.waitForSelector("#appearance-modal:not(.hidden)", { timeout: 5000 });
  await page.waitForTimeout(350);
}

async function captureTarget(browser, target) {
  ensureDir(target.dir);
  const context = await browser.newContext({
    viewport: target.viewport,
    hasTouch: target.hasTouch,
    isMobile: target.isMobile,
    deviceScaleFactor: target.deviceScaleFactor,
  });
  const page = await context.newPage();
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push({ type: "console.error", text: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    errors.push({ type: "pageerror", text: String(error) });
  });

  try {
    const url = `http://${serverHost}:${serverPort}/?dev_seed_save=${encodeURIComponent(seedRelativePath)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      if (typeof window.render_game_to_text !== "function") {
        return false;
      }
      try {
        return JSON.parse(window.render_game_to_text()).mode === "ready";
      } catch {
        return false;
      }
    }, null, { timeout: 30000 });
    await page.waitForTimeout(1200);

    await openAppearanceModal(page, target);

    const stateAfter = await readState(page);
    fs.writeFileSync(path.join(target.dir, "state.json"), stateAfter.text || "{}");
    fs.writeFileSync(path.join(target.dir, "errors.json"), JSON.stringify(errors, null, 2));
    await page.locator("#game-capture-root").first().screenshot({
      path: path.join(target.dir, "stage.png"),
      omitBackground: false,
    });
    await page.locator("#appearance-modal").first().screenshot({
      path: path.join(target.dir, "modal.png"),
      omitBackground: false,
    });
  } finally {
    await context.close();
  }
}

async function main() {
  writeSeedSave();

  const server = createStaticServer(repoRoot);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(serverPort, serverHost, resolve);
  });

  const browser = await chromium.launch({ headless: true });
  try {
    await captureTarget(browser, {
      name: "desktop-landscape",
      dir: path.join(outputRoot, "desktop-landscape"),
      viewport: { width: 1366, height: 768 },
      hasTouch: false,
      isMobile: false,
      deviceScaleFactor: 1,
    });
    await captureTarget(browser, {
      name: "mobile-portrait",
      dir: path.join(outputRoot, "mobile-portrait"),
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    });
    console.log(path.join(outputRoot, "desktop-landscape", "stage.png"));
    console.log(path.join(outputRoot, "mobile-portrait", "stage.png"));
  } finally {
    await browser.close();
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
