import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeLoopKernel } from "../core/runtime-loop-kernel.js";
import {
  RUNTIME_ACTIVITY_BACKGROUND_LIVE,
  RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
  RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED,
} from "../lib/runtime-platform-utils.js";

function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function createFixture() {
  const state = {
    mode: "ready",
    battle: { id: "battle" },
    team: [{ id: 1 }],
    saveData: { last_tick_epoch_ms: 0 },
    deferredSaveDirty: false,
    pendingSimMs: 0,
    realClockLastMs: 0,
    lastHudAutoUpdateMs: 0,
  };

  const calls = {
    updates: [],
    updateHud: 0,
    persistSaveData: 0,
  };

  let hidden = false;
  let now = 0;
  let activityState = RUNTIME_ACTIVITY_FOREGROUND_ACTIVE;

  const kernel = createRuntimeLoopKernel({
    state,
    update(deltaMs, options = {}) {
      calls.updates.push({
        deltaMs: Number(deltaMs),
        idleMode: Boolean(options.idleMode),
      });
    },
    updateHud() {
      calls.updateHud += 1;
      state.lastHudAutoUpdateMs = now;
    },
    persistSaveData() {
      calls.persistSaveData += 1;
    },
    getCurrentAttackIntervalMs() {
      return 120;
    },
    getForegroundSimulationBudgetMs() {
      return 48;
    },
    getSaveTickEpochMs(savePayload) {
      return Math.max(0, toSafeInt(savePayload?.last_tick_epoch_ms, 0));
    },
    getActivityState() {
      return activityState;
    },
    toSafeInt,
    isHidden: () => hidden,
    nowMs: () => now,
    maxForegroundPendingMs: 500,
    maxOfflineCatchupMs: 900,
    maxResumeCatchupMs: 750,
    hiddenSimBudgetMs: 80,
    bulkIdleThresholdMs: 200,
    foregroundFrameStepMs: 16,
    backgroundTickIntervalMs: 250,
    hudAutoRefreshIntervalMs: 100,
  });

  return {
    state,
    calls,
    kernel,
    setHidden(nextHidden) {
      hidden = Boolean(nextHidden);
    },
    setNow(nextNow) {
      now = Number(nextNow);
    },
    setActivityState(nextActivityState) {
      activityState = String(nextActivityState || RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);
    },
  };
}

test("queueRealtimeElapsedMs caps pending simulation only in strict foreground", () => {
  const fixture = createFixture();
  fixture.state.realClockLastMs = 1000;
  fixture.state.pendingSimMs = 490;
  fixture.setNow(1100);
  fixture.setActivityState(RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);

  const elapsed = fixture.kernel.queueRealtimeElapsedMs();

  assert.equal(elapsed, 100);
  assert.equal(fixture.state.pendingSimMs, 500);
  assert.equal(fixture.state.realClockLastMs, 1100);
});

test("queueRealtimeElapsedMs keeps full pending simulation while backgrounded or unfocused", () => {
  const fixture = createFixture();
  fixture.state.realClockLastMs = 1000;
  fixture.state.pendingSimMs = 490;
  fixture.setNow(1100);
  fixture.setActivityState(RUNTIME_ACTIVITY_BACKGROUND_LIVE);

  const backgroundElapsed = fixture.kernel.queueRealtimeElapsedMs();

  assert.equal(backgroundElapsed, 100);
  assert.equal(fixture.state.pendingSimMs, 590);

  fixture.state.realClockLastMs = 2000;
  fixture.state.pendingSimMs = 490;
  fixture.setNow(2100);
  fixture.setActivityState(RUNTIME_ACTIVITY_FOREGROUND_UNFOCUSED);

  const unfocusedElapsed = fixture.kernel.queueRealtimeElapsedMs();

  assert.equal(unfocusedElapsed, 100);
  assert.equal(fixture.state.pendingSimMs, 590);
});

test("queueOfflineCatchupFromSave applies max catchup cap", () => {
  const fixture = createFixture();
  fixture.state.pendingSimMs = 10;
  fixture.state.saveData.last_tick_epoch_ms = 1000;
  fixture.setNow(2600);

  const catchupMs = fixture.kernel.queueOfflineCatchupFromSave();

  assert.equal(catchupMs, 900);
  assert.equal(fixture.state.pendingSimMs, 910);
  assert.equal(fixture.state.realClockLastMs, 2600);
});

test("queueResumeCatchupFromRealtime bypasses foreground clamp and honors its dedicated cap", () => {
  const fixture = createFixture();
  fixture.state.realClockLastMs = 1000;
  fixture.state.pendingSimMs = 490;
  fixture.setNow(2100);
  fixture.setActivityState(RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);

  const catchupMs = fixture.kernel.queueResumeCatchupFromRealtime();

  assert.equal(catchupMs, 750);
  assert.equal(fixture.state.pendingSimMs, 1240);
  assert.equal(fixture.state.realClockLastMs, 2100);
});

test("consumePendingSimulation flushes deferred save when combat is inactive", () => {
  const fixture = createFixture();
  fixture.state.battle = null;
  fixture.state.team = [];
  fixture.state.pendingSimMs = 200;
  fixture.state.deferredSaveDirty = true;

  const consumed = fixture.kernel.consumePendingSimulation();

  assert.equal(consumed, 0);
  assert.equal(fixture.state.pendingSimMs, 0);
  assert.equal(fixture.state.deferredSaveDirty, false);
  assert.equal(fixture.calls.persistSaveData, 1);
});

test("consumePendingSimulation switches to idle mode when pending queue is large", () => {
  const fixture = createFixture();
  fixture.state.pendingSimMs = 260;
  fixture.state.lastHudAutoUpdateMs = 0;
  fixture.setNow(1000);
  fixture.setActivityState(RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);

  const consumed = fixture.kernel.consumePendingSimulation();

  assert.equal(consumed, 48);
  assert.equal(fixture.calls.updates.length, 1);
  assert.equal(fixture.calls.updates[0].deltaMs, 48);
  assert.equal(fixture.calls.updates[0].idleMode, true);
  assert.equal(fixture.calls.updateHud, 1);
});

test("tickSimulationFromRealtime caps hidden budget to elapsed realtime", () => {
  const fixture = createFixture();
  fixture.state.realClockLastMs = 1000;
  fixture.state.pendingSimMs = 0;
  fixture.setNow(1120);
  fixture.setHidden(true);
  fixture.setActivityState(RUNTIME_ACTIVITY_BACKGROUND_LIVE);

  const consumed = fixture.kernel.tickSimulationFromRealtime({
    forceIdleMode: true,
    budgetMs: 999,
  });

  assert.equal(consumed, 120);
  assert.equal(fixture.calls.updates.length, 1);
  assert.equal(fixture.calls.updates[0].deltaMs, 120);
  assert.equal(fixture.calls.updates[0].idleMode, true);
  assert.equal(fixture.state.pendingSimMs, 0);
});
