import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve(process.argv[2] || "output/morphing-sprite-check");
const url = String(process.argv[3] || "").trim();
const iterations = Math.max(1, Number.parseInt(process.argv[4] || "90", 10) || 90);
const stepMs = Math.max(1, Number.parseInt(process.argv[5] || "420", 10) || 420);

if (!url) {
  console.error("Missing URL argument.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chromium" });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
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
await page.waitForTimeout(300);
await page.evaluate(() => {
  const closeBtn = document.getElementById("tutorial-close-btn");
  if (closeBtn && typeof closeBtn.click === "function") {
    closeBtn.click();
  }
});
await page.waitForTimeout(120);

const checks = [];
let mismatchCount = 0;
let missingMorphingCount = 0;

for (let i = 0; i < iterations; i += 1) {
  await page.evaluate((ms) => {
    if (typeof window.advanceTime === "function") {
      window.advanceTime(ms);
    }
  }, stepMs);

  const data = await page.evaluate(() => {
    const txt = typeof window.render_game_to_text === "function" ? window.render_game_to_text() : "{}";
    const parsed = JSON.parse(txt);
    const team = Array.isArray(parsed.team) ? parsed.team : [];
    const morphIndex = team.findIndex((m) => String(m?.talent_id || "") === "MORPHING" || Number(m?.id || 0) === 132);
    const sourceIndex = morphIndex > 0 ? morphIndex - 1 : -1;
    const morphDbg = morphIndex >= 0 && typeof window.__pokeidle_debug_getSpriteFrameIndex === "function"
      ? window.__pokeidle_debug_getSpriteFrameIndex("team", morphIndex)
      : null;
    const srcDbg = sourceIndex >= 0 && typeof window.__pokeidle_debug_getSpriteFrameIndex === "function"
      ? window.__pokeidle_debug_getSpriteFrameIndex("team", sourceIndex)
      : null;
    return {
      team,
      morphIndex,
      sourceIndex,
      morphDbg,
      srcDbg,
      nextAttacker: parsed.next_attacker,
      enemiesDefeated: parsed.enemies_defeated,
      attackIntervalMs: parsed.attack_interval_ms,
    };
  });

  let ok = null;
  let reason = "";
  if (data.morphIndex < 0 || data.sourceIndex < 0) {
    missingMorphingCount += 1;
    ok = false;
    reason = "morphing_member_missing_or_slot0";
  } else {
    const samePath = String(data.morphDbg?.sprite_path || "") === String(data.srcDbg?.sprite_path || "");
    ok = samePath;
    if (!ok) {
      mismatchCount += 1;
      reason = "sprite_path_mismatch";
    }
  }

  checks.push({
    step: i,
    ok,
    reason,
    morphIndex: data.morphIndex,
    sourceIndex: data.sourceIndex,
    morphMember: data.morphIndex >= 0 ? data.team[data.morphIndex] : null,
    sourceMember: data.sourceIndex >= 0 ? data.team[data.sourceIndex] : null,
    morphSprite: data.morphDbg,
    sourceSprite: data.srcDbg,
    nextAttacker: data.nextAttacker,
    enemiesDefeated: data.enemiesDefeated,
    attackIntervalMs: data.attackIntervalMs,
  });
}

await page.screenshot({ path: path.join(outDir, "final.png") });

const summary = {
  url,
  totalChecks: checks.length,
  mismatchCount,
  missingMorphingCount,
  allPassed: mismatchCount === 0 && missingMorphingCount === 0,
  errors,
  firstCheck: checks[0] || null,
  lastCheck: checks[checks.length - 1] || null,
};

fs.writeFileSync(path.join(outDir, "checks.json"), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();

if (!summary.allPassed) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(2);
}

console.log(JSON.stringify(summary, null, 2));
