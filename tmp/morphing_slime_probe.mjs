import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/morphing-slime-proof");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chromium" });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const url = "http://127.0.0.1:5332/?dev_seed_save=tmp/pokeidle-test-appdata/PokeIdle/save_morphing_sprite_check.json";

await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(250);
await page.evaluate(() => {
  const closeBtn = document.getElementById("tutorial-close-btn");
  if (closeBtn) closeBtn.click();
});
await page.waitForTimeout(100);

for (let i = 0; i < 40; i += 1) {
  await page.evaluate((ms) => {
    if (typeof window.advanceTime === "function") {
      window.advanceTime(ms);
    }
  }, 420);
}

await page.screenshot({ path: path.join(outDir, "frame-a.png") });

await page.evaluate((ms) => {
  if (typeof window.advanceTime === "function") {
    window.advanceTime(ms);
  }
}, 380);
await page.waitForTimeout(30);
await page.screenshot({ path: path.join(outDir, "frame-b.png") });

const state = await page.evaluate(() => {
  const txt = typeof window.render_game_to_text === "function" ? window.render_game_to_text() : "{}";
  return JSON.parse(txt);
});
fs.writeFileSync(path.join(outDir, "state.json"), JSON.stringify(state, null, 2));

await browser.close();
console.log("ok");
