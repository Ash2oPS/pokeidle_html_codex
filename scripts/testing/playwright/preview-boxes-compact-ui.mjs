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
import { ROUTE_ID_ORDER } from "../../../lib/game-world-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const outputRoot = path.join(repoRoot, "output", "boxes-compact-preview");
const seedRelativePath = "/output/boxes-compact-preview/boxes-compact-preview-v7.json";
const seedFilePath = path.join(outputRoot, "boxes-compact-preview-v7.json");
const serverHost = "127.0.0.1";
const serverPort = 5336;

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
    app_build_version: "0.1.61",
    starter_chosen: true,
    current_route_id: "kanto_city_viridian_city",
    unlocked_route_ids: [
      "kanto_city_pallet_town",
      "kanto_route_1",
      "kanto_city_viridian_city",
    ],
    route_defeat_counts: {
      kanto_city_pallet_town: 0,
      kanto_route_1: 3,
      kanto_city_viridian_city: 1,
    },
    last_tick_epoch_ms: 0,
    team: [],
    pokemon_entities: {},
    money: 258400,
    coins: 980,
    first_free_pokeball_claimed: true,
    first_free_pokeball_guaranteed_capture_pending: false,
    ball_inventory: ballInventory,
    ball_inventory_seen: ballInventorySeen,
    ball_capture_rules: ballCaptureRules,
    active_ball_type: "poke_ball",
    shop_items: shopItems,
    attack_boost_until_ms: 0,
    pokeballs: 24,
    tutorials: {
      route1_intro_seen: true,
      evolution_intro_seen: true,
      appearance_intro_seen: true,
      appearance_editor_unlocked: true,
    },
    legacy_shiny_family_root_ids: [25, 133],
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

function createPokemonRecord({
  pokemonId,
  level,
  xp = 0,
  nickname = "",
  capturedNormal = 1,
  capturedShiny = 0,
  encounteredNormal = capturedNormal + 2,
  encounteredShiny = capturedShiny,
  defeatedNormal = Math.max(0, capturedNormal - 1),
  defeatedShiny = capturedShiny,
}) {
  return normalizePokemonEntityRecord({
    level,
    xp,
    entity_unlocked: true,
    nickname,
    captured_normal: capturedNormal,
    captured_shiny: capturedShiny,
    encountered_normal: encounteredNormal,
    encountered_shiny: encounteredShiny,
    defeated_normal: defeatedNormal,
    defeated_shiny: defeatedShiny,
  }, pokemonId);
}

function buildSeedSave() {
  const seedSave = createEmptySeedSave();
  seedSave.team = [25, 4, 7];
  seedSave.pokemon_entities = {
    1: createPokemonRecord({ pokemonId: 1, level: 18, xp: 245, capturedNormal: 2, nickname: "Bulbi" }),
    4: createPokemonRecord({ pokemonId: 4, level: 21, xp: 410, capturedNormal: 2 }),
    7: createPokemonRecord({ pokemonId: 7, level: 19, xp: 310, capturedNormal: 2 }),
    16: createPokemonRecord({ pokemonId: 16, level: 14, xp: 120, capturedNormal: 5 }),
    25: createPokemonRecord({ pokemonId: 25, level: 24, xp: 960, capturedNormal: 3, capturedShiny: 1 }),
    39: createPokemonRecord({ pokemonId: 39, level: 13, xp: 84, capturedNormal: 2 }),
    43: createPokemonRecord({ pokemonId: 43, level: 17, xp: 214, capturedNormal: 2 }),
    52: createPokemonRecord({ pokemonId: 52, level: 16, xp: 160, capturedNormal: 4, nickname: "Miaouster" }),
    58: createPokemonRecord({ pokemonId: 58, level: 22, xp: 620, capturedNormal: 2 }),
    79: createPokemonRecord({ pokemonId: 79, level: 11, xp: 52, capturedNormal: 1 }),
    92: createPokemonRecord({ pokemonId: 92, level: 20, xp: 504, capturedNormal: 2 }),
    129: createPokemonRecord({ pokemonId: 129, level: 8, xp: 16, capturedNormal: 6 }),
    133: createPokemonRecord({ pokemonId: 133, level: 23, xp: 870, capturedNormal: 2, capturedShiny: 1 }),
  };
  return seedSave;
}

function writeSeedSave() {
  ensureDir(outputRoot);
  const seedSave = buildSeedSave();
  const encoded = encodeCompactSave(seedSave, {
    formatId: COMPACT_SAVE_FORMAT_ID,
    saveVersion: 7,
    appVersion: "0.1.61",
    routeIdOrder: ROUTE_ID_ORDER,
    defaultRouteId: "kanto_city_viridian_city",
    createEmptySave: createEmptySeedSave,
    normalizePokemonEntityRecord,
  });

  fs.writeFileSync(seedFilePath, JSON.stringify(encoded, null, 2));
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

async function waitForReady(page) {
  await page.waitForFunction(() => {
    if (typeof window.render_game_to_text !== "function") {
      return false;
    }
    try {
      const state = JSON.parse(window.render_game_to_text());
      return state?.mode === "ready" && state?.boot_phase === "ready" && state?.visual_ready === true;
    } catch {
      return false;
    }
  }, null, { timeout: 30_000 });
  await page.waitForTimeout(900);
}

async function invokeBinding(page, name, ...args) {
  return page.evaluate(async ({ nextName, nextArgs }) => {
    if (typeof window.__pokeidle_invoke_binding !== "function") {
      throw new Error("missing-binding-invoke");
    }
    const response = await window.__pokeidle_invoke_binding(nextName, ...nextArgs);
    if (!response?.ok) {
      throw new Error(response?.error || `binding-failed:${nextName}`);
    }
    return response.result;
  }, {
    nextName: name,
    nextArgs: args,
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

async function hideNoise(page) {
  await page.evaluate(() => {
    const notificationStack = document.getElementById("notification-stack");
    if (notificationStack instanceof HTMLElement) {
      notificationStack.style.display = "none";
    }
    const topMessage = document.getElementById("top-message");
    if (topMessage instanceof HTMLElement) {
      topMessage.classList.add("hidden");
    }
    return true;
  });
}

async function openBoxesModal(page) {
  await invokeBinding(page, "setActiveRoute", "kanto_city_viridian_city");
  await page.waitForFunction(() => {
    try {
      const state = JSON.parse(window.render_game_to_text());
      return state?.route_id === "kanto_city_viridian_city" && state?.visual_ready === true;
    } catch {
      return false;
    }
  }, null, { timeout: 10_000 });
  await page.waitForTimeout(250);
  await invokeBinding(page, "openBoxesForTeamSlot", 0);
  try {
    await page.waitForFunction(() => {
      try {
        return JSON.parse(window.render_game_to_text())?.boxes_open === true;
      } catch {
        return false;
      }
    }, null, { timeout: 6_000 });
  } catch (error) {
    const state = await readState(page);
    throw new Error(`boxes-open-timeout:${state.text || "{}"}`);
  }
  await page.waitForFunction(() => {
    try {
      return JSON.parse(window.render_game_to_text())?.boxes_entity_count > 0;
    } catch {
      return false;
    }
  }, null, { timeout: 6_000 });
  await page.waitForSelector("#boxes-modal:not(.hidden)", { timeout: 6_000 });
  await page.waitForSelector("#boxes-grid .boxes-mon-btn", { timeout: 6_000 });
  await hideNoise(page);
  await page.waitForTimeout(350);
}

async function selectDesktopEntry(page) {
  await page.evaluate(() => {
    const preferredButton = document.querySelector("#boxes-grid .boxes-mon-btn:not(.is-current):not(.is-disabled)");
    const fallbackButton = document.querySelector("#boxes-grid .boxes-mon-btn:not(.is-disabled)");
    const button = preferredButton || fallbackButton;
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("missing-boxes-entry");
    }
    button.focus();
    button.dispatchEvent(new MouseEvent("mouseenter", {
      bubbles: true,
      cancelable: true,
      composed: true,
    }));
    return true;
  });
  await page.waitForTimeout(300);
  await page.waitForFunction(() => {
    const panel = document.getElementById("boxes-info-panel");
    return Boolean(panel && panel.querySelector(".pokemon-info-card--boxes"));
  }, null, { timeout: 4_000 });
}

async function selectMobileEntry(page) {
  await page.evaluate(() => {
    const preferredButton = document.querySelector("#boxes-grid .boxes-mon-btn:not(.is-current):not(.is-disabled)");
    const fallbackButton = document.querySelector("#boxes-grid .boxes-mon-btn:not(.is-disabled)");
    const button = preferredButton || fallbackButton;
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("missing-mobile-boxes-entry");
    }
    button.click();
    return true;
  });
  await page.waitForSelector("#boxes-mobile-selection-actions:not(.hidden)", { timeout: 4_000 });
  await page.waitForFunction(() => {
    const summary = document.getElementById("boxes-mobile-selection-summary");
    return Boolean(summary && !summary.classList.contains("hidden") && summary.textContent.trim().length > 0);
  }, null, { timeout: 4_000 });
  await page.waitForTimeout(250);
}

async function injectCompactPreview(page, target) {
  const compactCss = `
    #boxes-modal.boxes-compact-preview {
      padding: clamp(10px, 2vw, 18px);
      background: linear-gradient(180deg, rgba(3, 10, 15, 0.48), rgba(3, 8, 12, 0.7));
      backdrop-filter: blur(12px) saturate(0.92);
    }

    #boxes-modal.boxes-compact-preview .boxes-card {
      position: relative;
      width: min(1160px, calc(100vw - 32px));
      max-height: calc(100svh - 24px);
      padding: 18px 18px 16px;
      gap: 10px;
      border-radius: 26px;
      border: 1px solid rgba(135, 216, 233, 0.2);
      background:
        linear-gradient(180deg, rgba(15, 38, 55, 0.96), rgba(6, 19, 29, 0.98)),
        radial-gradient(circle at 0% 0%, rgba(126, 200, 223, 0.1), transparent 40%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 26px 56px rgba(1, 7, 12, 0.38);
      overflow: hidden;
    }

    #boxes-modal.boxes-compact-preview .boxes-card::before {
      content: "";
      position: absolute;
      top: 10px;
      left: 18px;
      width: 86px;
      height: 5px;
      border-radius: 999px;
      background: rgba(145, 225, 239, 0.92);
      box-shadow:
        98px 0 0 rgba(145, 225, 239, 0.46),
        196px 0 0 rgba(145, 225, 239, 0.22);
      opacity: 0.9;
      pointer-events: none;
    }

    #boxes-modal.boxes-compact-preview .boxes-header {
      position: relative;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      gap: 10px;
      padding: 8px 0 0;
    }

    #boxes-modal.boxes-compact-preview .boxes-header-copy,
    #boxes-modal.boxes-compact-preview #boxes-header-default {
      gap: 4px;
    }

    #boxes-modal.boxes-compact-preview .boxes-title {
      font-size: clamp(20px, 2vw, 24px);
      line-height: 1;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    #boxes-modal.boxes-compact-preview .boxes-subtitle,
    #boxes-modal.boxes-compact-preview .boxes-shiny-counter {
      font-size: 11px;
      line-height: 1.2;
      opacity: 0.9;
    }

    #boxes-modal.boxes-compact-preview .boxes-close-btn {
      min-height: 40px;
      padding: 0 14px;
      border-radius: 14px;
    }

    #boxes-modal.boxes-compact-preview .collection-search-row {
      padding: 7px 9px;
      border-radius: 14px;
      gap: 8px;
      background:
        linear-gradient(180deg, rgba(11, 28, 40, 0.94), rgba(7, 19, 29, 0.97)),
        radial-gradient(circle at 100% 0%, rgba(126, 200, 223, 0.08), transparent 45%);
    }

    #boxes-modal.boxes-compact-preview .collection-search-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.82;
    }

    #boxes-modal.boxes-compact-preview .collection-search-input {
      min-height: 36px;
      padding-top: 6px;
      padding-bottom: 6px;
      font-size: 13px;
    }

    #boxes-modal.boxes-compact-preview .boxes-layout {
      gap: 10px;
    }

    #boxes-modal.boxes-compact-preview .boxes-grid {
      padding: 10px;
      gap: 8px;
      align-content: start;
      background:
        linear-gradient(180deg, rgba(8, 21, 31, 0.96), rgba(5, 14, 22, 0.98)),
        repeating-linear-gradient(
          90deg,
          rgba(145, 225, 239, 0.04) 0,
          rgba(145, 225, 239, 0.04) 1px,
          transparent 1px,
          transparent 32px
        );
      border: 1px solid rgba(145, 225, 239, 0.14);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.04),
        0 10px 22px rgba(1, 7, 12, 0.2);
    }

    #boxes-modal.boxes-compact-preview .boxes-mon-btn {
      min-height: 118px;
      padding: 9px 9px 8px;
      gap: 4px;
      border-radius: 16px;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.05),
        0 8px 16px rgba(1, 7, 12, 0.14);
    }

    #boxes-modal.boxes-compact-preview .boxes-mon-visual {
      width: 56px;
      height: 56px;
    }

    #boxes-modal.boxes-compact-preview .boxes-mon-btn img,
    #boxes-modal.boxes-compact-preview .boxes-mon-fallback {
      width: 56px;
      height: 56px;
      max-width: 56px;
      max-height: 56px;
    }

    #boxes-modal.boxes-compact-preview .boxes-mon-name {
      font-size: 13px;
      line-height: 1.08;
    }

    #boxes-modal.boxes-compact-preview .boxes-mon-line,
    #boxes-modal.boxes-compact-preview .boxes-mon-tag {
      font-size: 10px;
      line-height: 1.08;
    }

    #boxes-modal.boxes-compact-preview .boxes-info-panel {
      padding: 0;
      justify-content: flex-start;
      border-radius: 18px;
      border: 1px solid rgba(145, 225, 239, 0.14);
      background:
        linear-gradient(180deg, rgba(9, 24, 36, 0.96), rgba(5, 14, 22, 0.98)),
        radial-gradient(circle at 0% 0%, rgba(126, 200, 223, 0.08), transparent 40%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.04),
        0 10px 22px rgba(1, 7, 12, 0.16);
    }

    #boxes-modal.boxes-compact-preview .boxes-info-panel .pokemon-info-card {
      width: 100%;
      max-width: none;
      min-height: 100%;
      padding: 10px;
      gap: 8px;
      border-radius: 18px;
      box-shadow: none;
    }

    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-head,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-feature-grid,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-micro-grid--summary,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-micro-grid--stats,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-stat-grid {
      gap: 5px;
    }

    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-title {
      font-size: 17px;
      line-height: 1.02;
    }

    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-subtitle,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-block-title,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-zone-label,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-hint-label {
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-zone,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-hint,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-stat,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-micro {
      padding: 5px 6px;
      border-radius: 12px;
    }

    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-badge {
      padding: 2px 6px;
      font-size: 9px;
    }

    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-stat-value,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-micro-value,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-hint-value,
    #boxes-modal.boxes-compact-preview .pokemon-info-card--boxes .pokemon-info-hint-meta {
      font-size: 11px;
      line-height: 1.16;
    }

    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-card {
      padding: 8px 10px;
      gap: 10px;
      border-radius: 16px;
    }

    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-visual {
      width: 56px;
      height: 56px;
    }

    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-title {
      font-size: 15px;
    }

    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-meta,
    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-kicker,
    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-badge,
    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-status {
      font-size: 10px;
      line-height: 1.12;
    }

    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-actions:not(.hidden) {
      gap: 8px;
      padding-top: 2px;
    }

    #boxes-modal.boxes-compact-preview .boxes-mobile-selection-action-btn {
      min-height: 40px;
      border-radius: 14px;
    }

    @media (min-width: 961px) {
      #boxes-modal.boxes-compact-preview .boxes-card {
        width: min(1188px, calc(100vw - 36px));
      }

      #boxes-modal.boxes-compact-preview .boxes-layout {
        grid-template-columns: minmax(0, 1.82fr) minmax(248px, 284px);
      }

      #boxes-modal.boxes-compact-preview .boxes-grid {
        grid-template-columns: repeat(auto-fit, minmax(148px, 148px));
      }
    }

    @media (max-width: 960px) {
      #boxes-modal.boxes-compact-preview .boxes-card {
        width: min(100%, calc(100vw - 20px));
      }
    }

    @media (max-width: 760px) {
      #boxes-modal.boxes-compact-preview {
        padding: 8px;
      }

      #boxes-modal.boxes-compact-preview .boxes-card {
        width: calc(100vw - 16px);
        max-height: calc(100svh - 16px);
        padding: 16px 12px 12px;
        gap: 8px;
        border-radius: 22px;
      }

      #boxes-modal.boxes-compact-preview .boxes-card::before {
        left: 12px;
        width: 62px;
        height: 4px;
        box-shadow:
          72px 0 0 rgba(145, 225, 239, 0.42),
          144px 0 0 rgba(145, 225, 239, 0.18);
      }

      #boxes-modal.boxes-compact-preview .boxes-header {
        gap: 8px;
        padding-top: 6px;
      }

      #boxes-modal.boxes-compact-preview .boxes-title {
        font-size: 18px;
      }

      #boxes-modal.boxes-compact-preview .boxes-subtitle,
      #boxes-modal.boxes-compact-preview .boxes-shiny-counter {
        font-size: 10px;
      }

      #boxes-modal.boxes-compact-preview .collection-search-row {
        padding: 6px 8px;
      }

      #boxes-modal.boxes-compact-preview .collection-search-input {
        min-height: 34px;
        font-size: 12px;
      }

      #boxes-modal.boxes-compact-preview .boxes-grid {
        padding: 8px;
        gap: 7px;
      }

      #boxes-modal.boxes-compact-preview .boxes-mon-btn {
        min-height: 104px;
        padding: 8px 7px;
      }

      #boxes-modal.boxes-compact-preview .boxes-mon-visual,
      #boxes-modal.boxes-compact-preview .boxes-mon-btn img,
      #boxes-modal.boxes-compact-preview .boxes-mon-fallback {
        width: 48px;
        height: 48px;
        max-width: 48px;
        max-height: 48px;
      }

      #boxes-modal.boxes-compact-preview .boxes-mon-name {
        font-size: 12px;
      }

      #boxes-modal.boxes-compact-preview .boxes-mon-line,
      #boxes-modal.boxes-compact-preview .boxes-mon-tag {
        font-size: 9px;
      }

      #boxes-modal.boxes-compact-preview .boxes-mobile-selection-card {
        padding: 8px;
      }

      #boxes-modal.boxes-compact-preview .boxes-mobile-selection-visual {
        width: 52px;
        height: 52px;
      }
    }
  `;

  await page.evaluate(({ cssText, label }) => {
    let styleEl = document.getElementById("boxes-compact-preview-style");
    if (!(styleEl instanceof HTMLStyleElement)) {
      styleEl = document.createElement("style");
      styleEl.id = "boxes-compact-preview-style";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssText;

    const modal = document.getElementById("boxes-modal");
    if (!(modal instanceof HTMLElement)) {
      throw new Error("missing-boxes-modal");
    }
    modal.classList.add("boxes-compact-preview");
    modal.dataset.previewMode = label;
    return true;
  }, {
    cssText: compactCss,
    label: target.name,
  });
  await page.waitForTimeout(250);
}

async function captureElement(page, selector, filePath) {
  await page.locator(selector).first().screenshot({
    path: filePath,
    omitBackground: false,
  });
}

async function writeArtifacts(targetDir, currentStateText, compactStateText, errors) {
  fs.writeFileSync(path.join(targetDir, "current-state.json"), currentStateText || "{}");
  fs.writeFileSync(path.join(targetDir, "compact-state.json"), compactStateText || "{}");
  fs.writeFileSync(path.join(targetDir, "errors.json"), JSON.stringify(errors, null, 2));
}

async function captureTarget(browser, target) {
  const targetDir = path.join(outputRoot, target.name);
  ensureDir(targetDir);

  const context = await browser.newContext({
    viewport: target.viewport,
    hasTouch: target.hasTouch,
    isMobile: target.hasTouch,
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
    await waitForReady(page);
    await openBoxesModal(page);
    if (target.hasTouch) {
      await selectMobileEntry(page);
    } else {
      await selectDesktopEntry(page);
    }

    const currentState = await readState(page);
    await captureElement(page, "#boxes-modal", path.join(targetDir, "boxes-current.png"));
    await captureElement(page, "#game-capture-root", path.join(targetDir, "stage-current.png"));

    await injectCompactPreview(page, target);
    await page.waitForTimeout(250);

    const compactState = await readState(page);
    await captureElement(page, "#boxes-modal", path.join(targetDir, "boxes-compact.png"));
    await captureElement(page, "#game-capture-root", path.join(targetDir, "stage-compact.png"));

    await writeArtifacts(targetDir, currentState.text, compactState.text, errors);
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
      viewport: { width: 1366, height: 768 },
      hasTouch: false,
      deviceScaleFactor: 1,
    });
    await captureTarget(browser, {
      name: "mobile-portrait",
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    console.log(path.join(outputRoot, "desktop-landscape", "boxes-current.png"));
    console.log(path.join(outputRoot, "desktop-landscape", "boxes-compact.png"));
    console.log(path.join(outputRoot, "mobile-portrait", "boxes-current.png"));
    console.log(path.join(outputRoot, "mobile-portrait", "boxes-compact.png"));
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
