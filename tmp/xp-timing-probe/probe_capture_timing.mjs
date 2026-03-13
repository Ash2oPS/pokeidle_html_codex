import { chromium } from "playwright";
import fs from "node:fs";

const testUrl = process.env.TEST_URL;
const resultPath = process.env.RESULT_PATH;
if (!testUrl || !resultPath) {
  throw new Error("Missing TEST_URL or RESULT_PATH");
}

const browser = await chromium.launch({ headless: true, channel: "chromium" });
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") {
    consoleErrors.push(msg.text());
  }
});
await page.goto(testUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.evaluate(() => window.dispatchEvent(new Event("resize")));

const summary = {
  states_scanned: 0,
  capture_states: 0,
  capture_states_success: 0,
  capture_states_fail: 0,
  capture_states_with_xp_fx: 0,
  phases_seen: [],
  enemies_defeated_max: 0,
  sample: [],
  console_error_count: 0,
};
const phaseSet = new Set();

for (let i = 0; i < 340; i += 1) {
  await page.evaluate(async () => {
    for (let step = 0; step < 12; step += 1) {
      if (typeof window.advanceTime === "function") {
        await window.advanceTime(1000 / 60);
      }
    }
  });
  await page.waitForTimeout(70);

  const text = await page.evaluate(() => {
    if (typeof window.render_game_to_text === "function") {
      return window.render_game_to_text();
    }
    return null;
  });
  if (!text) {
    continue;
  }

  let state = null;
  try {
    state = JSON.parse(text);
  } catch {
    continue;
  }

  summary.states_scanned += 1;
  summary.enemies_defeated_max = Math.max(summary.enemies_defeated_max, Number(state.enemies_defeated || 0));

  const capture = state.capture_sequence;
  const xpFx = Number(state.team_xp_gain_effects_active || 0);
  if (capture) {
    summary.capture_states += 1;
    const captured = Boolean(capture.captured);
    if (captured) {
      summary.capture_states_success += 1;
    } else {
      summary.capture_states_fail += 1;
    }
    if (xpFx > 0) {
      summary.capture_states_with_xp_fx += 1;
    }
    const phase = String(capture.phase || "");
    if (phase) {
      phaseSet.add(phase);
    }
    if (summary.sample.length < 24) {
      summary.sample.push({
        step: i,
        phase,
        captured,
        xp_fx: xpFx,
        elapsed_ms: Number(capture.elapsed_ms || 0),
        total_ms: Number(capture.total_ms || 0),
      });
    }
  }
}

summary.phases_seen = Array.from(phaseSet);
summary.console_error_count = consoleErrors.length;
summary.console_errors_sample = consoleErrors.slice(0, 5);

fs.writeFileSync(resultPath, JSON.stringify(summary, null, 2));
await browser.close();
console.log(JSON.stringify(summary));