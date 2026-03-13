import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/alakazam-metamorph-direct-swap-check");
fs.mkdirSync(outDir, { recursive: true });

const url = "http://127.0.0.1:5334/?dev_seed_save=tmp/pokeidle-test-appdata/PokeIdle/save_alakazam_metamorph_direct_swap_check.json";
const maxSteps = 9000;
const stepMs = 420;
const minDirectSwapChecks = 8;
const minNeighborSwapChecks = 4;

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
await page.waitForTimeout(250);
await page.evaluate(() => {
  const closeBtn = document.getElementById("tutorial-close-btn");
  if (closeBtn) closeBtn.click();
});
await page.waitForTimeout(120);

const checks = [];
const failures = [];
let directSwapChecks = 0;
let neighborSwapChecks = 0;
let copiedStateSeen = false;
let revertedStateSeen = false;
let previousEventFingerprint = "";

function isMetamorphSynced(check) {
  const mType = String(check.metamorph_member?.offensive_type || "");
  const sType = String(check.source_member?.offensive_type || "");
  const mSprite = String(check.metamorph_sprite?.sprite_path || "");
  const sSprite = String(check.source_sprite?.sprite_path || "");
  if (check.source_slot < 0) {
    return mType === "normal" && mSprite.includes("pokemon_data/132_ditto/");
  }
  return mType === sType && mSprite && mSprite === sSprite;
}

for (let step = 0; step < maxSteps; step += 1) {
  const frame = await page.evaluate((advanceMs) => {
    if (typeof window.advanceTime === "function") {
      window.advanceTime(advanceMs);
    }
    const txt = typeof window.render_game_to_text === "function" ? window.render_game_to_text() : "{}";
    const parsed = JSON.parse(txt);
    const team = Array.isArray(parsed.team) ? parsed.team : [];
    const metamorphIndex = team.findIndex((m) => Number(m?.id || 0) === 132);
    const sourceIndex = metamorphIndex > 0 ? metamorphIndex - 1 : -1;
    const metamorphSprite = metamorphIndex >= 0 && typeof window.__pokeidle_debug_getSpriteFrameIndex === "function"
      ? window.__pokeidle_debug_getSpriteFrameIndex("team", metamorphIndex)
      : null;
    const sourceSprite = sourceIndex >= 0 && typeof window.__pokeidle_debug_getSpriteFrameIndex === "function"
      ? window.__pokeidle_debug_getSpriteFrameIndex("team", sourceIndex)
      : null;
    return {
      state: parsed,
      team,
      metamorphIndex,
      sourceIndex,
      metamorphSprite,
      sourceSprite,
    };
  }, stepMs);

  const evt = frame.state?.last_turn_event || null;
  const fingerprint = evt ? JSON.stringify(evt) : "";
  if (!evt || fingerprint === previousEventFingerprint) {
    continue;
  }
  previousEventFingerprint = fingerprint;

  const isTargetEvent =
    evt.teleport_swap === true
    && !evt.teleport_swap_deferred_until_next_spawn
    && String(evt.talent_id || "") === "TELEPORT_PLUS_PLUS"
    && String(evt.attacker_name_fr || "") === "Alakazam";
  if (!isTargetEvent) {
    continue;
  }

  const from = Number(evt.teleport_swap_from_slot);
  const to = Number(evt.teleport_swap_to_slot);
  const mAfter = Number(frame.metamorphIndex);
  const mPre = mAfter === from ? to : mAfter === to ? from : mAfter;
  const mInSwap = from === mPre || to === mPre;
  if (!mInSwap) {
    continue;
  }

  directSwapChecks += 1;
  const sourcePre = mPre > 0 ? mPre - 1 : -1;
  const isNeighborSwap = sourcePre >= 0 && ((from === mPre && to === sourcePre) || (to === mPre && from === sourcePre));
  if (isNeighborSwap) {
    neighborSwapChecks += 1;
  }

  const check = {
    step,
    turn_event: evt,
    metamorph_pre: mPre,
    metamorph_after: mAfter,
    source_pre: sourcePre,
    source_slot: frame.sourceIndex,
    is_neighbor_swap: isNeighborSwap,
    metamorph_member: mAfter >= 0 ? frame.team[mAfter] : null,
    source_member: frame.sourceIndex >= 0 ? frame.team[frame.sourceIndex] : null,
    metamorph_sprite: frame.metamorphSprite,
    source_sprite: frame.sourceSprite,
    pass: true,
    reason: "",
  };

  if (!isMetamorphSynced(check)) {
    check.pass = false;
    check.reason = "metamorph_not_refreshed_after_direct_swap";
    failures.push(check);
    checks.push(check);
    await page.screenshot({ path: path.join(outDir, `failure-step-${step}.png`) });
    break;
  }

  if (check.source_slot < 0) {
    revertedStateSeen = true;
    if (!fs.existsSync(path.join(outDir, "reverted-slot0.png"))) {
      await page.screenshot({ path: path.join(outDir, "reverted-slot0.png") });
    }
  } else {
    copiedStateSeen = true;
    if (!fs.existsSync(path.join(outDir, "copied-slotgt0.png"))) {
      await page.screenshot({ path: path.join(outDir, "copied-slotgt0.png") });
    }
  }

  checks.push(check);

  if (directSwapChecks >= minDirectSwapChecks && neighborSwapChecks >= minNeighborSwapChecks && copiedStateSeen && revertedStateSeen) {
    break;
  }
}

await page.screenshot({ path: path.join(outDir, "final.png") });

const summary = {
  url,
  maxSteps,
  stepMs,
  directSwapChecks,
  neighborSwapChecks,
  copiedStateSeen,
  revertedStateSeen,
  failures: failures.length,
  allPassed:
    failures.length === 0
    && directSwapChecks >= minDirectSwapChecks
    && neighborSwapChecks >= minNeighborSwapChecks
    && copiedStateSeen
    && revertedStateSeen,
  errors,
};

fs.writeFileSync(path.join(outDir, "checks.json"), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();

if (!summary.allPassed) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(2);
}
console.log(JSON.stringify(summary, null, 2));
