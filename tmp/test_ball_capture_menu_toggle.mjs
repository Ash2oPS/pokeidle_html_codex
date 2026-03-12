import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2];
const outPath = process.argv[3];
if (!url || !outPath) {
  throw new Error("Usage: node test_ball_capture_menu_toggle.mjs <url> <outPath>");
}

const outDir = path.dirname(outPath);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chromium" }).catch(() => chromium.launch({ headless: true }));
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const readState = async () => page.evaluate(() => JSON.parse(window.render_game_to_text()));

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".starter-choice", { timeout: 15000 });
  await page.click(".starter-choice");
  await page.waitForFunction(() => {
    try {
      const state = JSON.parse(window.render_game_to_text());
      return state && state.mode === "ready" && !state.starter_modal_visible;
    } catch {
      return false;
    }
  }, { timeout: 20000 });

  const canvas = await page.$("canvas");
  if (!canvas) {
    throw new Error("Canvas introuvable");
  }
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Bounding box canvas indisponible");
  }

  let hit = null;
  for (let y = 20; y <= 220 && !hit; y += 6) {
    for (let x = 8; x <= 220 && !hit; x += 6) {
      await page.mouse.click(box.x + x, box.y + y);
      await page.waitForTimeout(25);
      const state = await readState();
      if (state.ball_capture_menu_open) {
        hit = { x, y, state };
      }
    }
  }

  if (!hit) {
    throw new Error("Impossible d'ouvrir le menu de capture via le compteur de ball");
  }

  const toggleAll = page.locator("#ball-capture-toggle-all");
  const toggleUnowned = page.locator("#ball-capture-toggle-unowned");
  const toggleShiny = page.locator("#ball-capture-toggle-shiny");
  const toggleUltra = page.locator("#ball-capture-toggle-ultra");

  const before = await readState();
  const beforeDisabled = {
    unowned: await toggleUnowned.isDisabled(),
    shiny: await toggleShiny.isDisabled(),
    ultra: await toggleUltra.isDisabled(),
  };

  await toggleAll.click();
  await page.waitForTimeout(50);
  const afterAllOff = await readState();
  const afterAllOffDisabled = {
    unowned: await toggleUnowned.isDisabled(),
    shiny: await toggleShiny.isDisabled(),
    ultra: await toggleUltra.isDisabled(),
  };

  await toggleShiny.click();
  await page.waitForTimeout(50);
  const afterShinyOff = await readState();

  await toggleAll.click();
  await page.waitForTimeout(50);
  const afterAllOn = await readState();
  const afterAllOnDisabled = {
    unowned: await toggleUnowned.isDisabled(),
    shiny: await toggleShiny.isDisabled(),
    ultra: await toggleUltra.isDisabled(),
  };

  await page.mouse.click(box.x + box.width - 14, box.y + box.height - 14);
  await page.waitForTimeout(50);
  const afterOutsideClick = await readState();

  const screenshotPath = path.join(outDir, "ball-capture-menu-toggle.png");
  await page.screenshot({ path: screenshotPath });

  const payload = {
    opened_at_canvas_point: hit,
    before_rules: before.ball_capture_rules?.poke_ball || null,
    before_disabled: beforeDisabled,
    after_all_off_rules: afterAllOff.ball_capture_rules?.poke_ball || null,
    after_all_off_disabled: afterAllOffDisabled,
    after_shiny_off_rules: afterShinyOff.ball_capture_rules?.poke_ball || null,
    after_all_on_rules: afterAllOn.ball_capture_rules?.poke_ball || null,
    after_all_on_disabled: afterAllOnDisabled,
    menu_open_after_outside_click: Boolean(afterOutsideClick.ball_capture_menu_open),
    screenshot: screenshotPath,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
} finally {
  await browser.close();
}
