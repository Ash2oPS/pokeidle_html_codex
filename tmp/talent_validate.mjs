import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

async function runScenario({ url, outDir, iterations = 120, stepMs = 420 }) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chromium" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console.error", text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    errors.push({ type: "pageerror", text: String(err) });
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(250);

  for (let i = 0; i < iterations; i += 1) {
    await page.evaluate((ms) => {
      if (typeof window.advanceTime === "function") {
        window.advanceTime(ms);
      }
    }, stepMs);
    await page.waitForTimeout(20);
    const txt = await page.evaluate(() => {
      if (typeof window.render_game_to_text === "function") {
        return window.render_game_to_text();
      }
      return "{}";
    });
    fs.writeFileSync(path.join(outDir, `state-${i}.json`), txt);
    if (i % 20 === 0 || i === iterations - 1) {
      await page.screenshot({ path: path.join(outDir, `shot-${i}.png`) });
    }
  }

  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
  await browser.close();
}

const scenario = JSON.parse(process.argv[2]);
runScenario(scenario).catch((err) => {
  console.error(err);
  process.exit(1);
});