import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/alakazam-morphing-teleport-refresh-check");
fs.mkdirSync(outDir, { recursive: true });

const url = "http://127.0.0.1:5333/?dev_seed_save=tmp/pokeidle-test-appdata/PokeIdle/save_alakazam_morphing_teleport_check.json";
const maxSteps = 5200;
const stepMs = 420;
const minImmediateTeleportChecks = 14;

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
  if (closeBtn && typeof closeBtn.click === "function") {
    closeBtn.click();
  }
});
await page.waitForTimeout(120);

const checks = [];
const failures = [];
let previousTurnEventFingerprint = "";
let alakazamTeleportEvents = 0;
let immediateTeleportChecks = 0;
let deferredTeleportEvents = 0;

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

  const evt = frame?.state?.last_turn_event || null;
  const evtFingerprint = evt ? JSON.stringify(evt) : "";
  if (!evt || evtFingerprint === previousTurnEventFingerprint) {
    continue;
  }
  previousTurnEventFingerprint = evtFingerprint;

  const isAlakazamTeleport =
    evt.teleport_swap === true
    && String(evt.talent_id || "") === "TELEPORT_PLUS_PLUS"
    && String(evt.attacker_name_fr || "") === "Alakazam";
  if (!isAlakazamTeleport) {
    continue;
  }

  alakazamTeleportEvents += 1;
  const isDeferred = Boolean(evt.teleport_swap_deferred_until_next_spawn);
  if (isDeferred) {
    deferredTeleportEvents += 1;
  }

  const check = {
    step,
    turn_event: evt,
    deferred: isDeferred,
    metamorph_slot: frame.metamorphIndex,
    source_slot: frame.sourceIndex,
    metamorph_member: frame.metamorphIndex >= 0 ? frame.team[frame.metamorphIndex] : null,
    source_member: frame.sourceIndex >= 0 ? frame.team[frame.sourceIndex] : null,
    metamorph_sprite: frame.metamorphSprite,
    source_sprite: frame.sourceSprite,
    pass: true,
    reason: "",
  };

  if (!isDeferred) {
    immediateTeleportChecks += 1;
    const metamorphMember = check.metamorph_member;
    const sourceMember = check.source_member;
    const metamorphType = String(metamorphMember?.offensive_type || "");
    const sourceType = String(sourceMember?.offensive_type || "");
    const metamorphSpritePath = String(check.metamorph_sprite?.sprite_path || "");
    const sourceSpritePath = String(check.source_sprite?.sprite_path || "");

    if (frame.metamorphIndex < 0) {
      check.pass = false;
      check.reason = "metamorph_missing_after_teleport";
    } else if (frame.sourceIndex < 0) {
      const revertedToDitto = metamorphType === "normal" && metamorphSpritePath.includes("pokemon_data/132_ditto/");
      if (!revertedToDitto) {
        check.pass = false;
        check.reason = "metamorph_slot0_not_reverted_to_own_profile";
      }
    } else {
      const typeSynced = metamorphType === sourceType;
      const spriteSynced = metamorphSpritePath && sourceSpritePath && metamorphSpritePath === sourceSpritePath;
      if (!typeSynced || !spriteSynced) {
        check.pass = false;
        check.reason = !typeSynced && !spriteSynced
          ? "type_and_sprite_not_refreshed"
          : !typeSynced
            ? "type_not_refreshed"
            : "sprite_not_refreshed";
      }
    }
  }

  checks.push(check);
  if (!check.pass) {
    failures.push(check);
    await page.screenshot({ path: path.join(outDir, `failure-step-${step}.png`) });
    break;
  }

  if (immediateTeleportChecks >= minImmediateTeleportChecks) {
    break;
  }
}

await page.screenshot({ path: path.join(outDir, "final.png") });

const summary = {
  url,
  maxSteps,
  stepMs,
  minImmediateTeleportChecks,
  alakazamTeleportEvents,
  immediateTeleportChecks,
  deferredTeleportEvents,
  checksCount: checks.length,
  failureCount: failures.length,
  allPassed: failures.length === 0 && immediateTeleportChecks >= minImmediateTeleportChecks,
  errors,
};

fs.writeFileSync(path.join(outDir, "checks.json"), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(outDir, "failures.json"), JSON.stringify(failures, null, 2));
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();

if (!summary.allPassed) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(2);
}

console.log(JSON.stringify(summary, null, 2));
