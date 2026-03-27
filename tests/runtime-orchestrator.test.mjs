import test from "node:test";
import assert from "node:assert/strict";

import { createRuntimeOrchestrator } from "../core/runtime-orchestrator.js";
import {
  RUNTIME_ACTIVITY_BACKGROUND_LIVE,
  RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
  RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
} from "../lib/runtime-platform-utils.js";

function createFixture(options = {}) {
  const state = {
    pendingSimMs: 0,
    backgroundRuntime: {
      activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
      lastBackgroundEnteredAtMs: 0,
      lastResumeAtMs: 0,
      lastResumeCatchupMs: 0,
      lastBackgroundReason: "",
      lastPersistAtMs: 0,
      lastLifecycleSource: "",
      suspendRequested: false,
      capacitorAppActive: null,
      capacitorAppSource: "",
      capacitorAppUpdatedAtMs: 0,
      debugOverlayEnabled: false,
    },
  };

  const calls = {
    ensureBackgroundTicker: 0,
    stopBackgroundTicker: 0,
    ensureForegroundCatchupPump: 0,
    stopForegroundCatchupPump: 0,
    tickSimulationFromRealtime: [],
    queueRealtimeElapsedMs: [],
    queueResumeCatchupFromRealtime: [],
    consumePendingSimulation: [],
    flushDeferredSaveIfNeeded: 0,
    persistSaveData: 0,
    render: 0,
    markSimulationPump: [],
  };

  let now = 1000;
  let consumePendingReturnMs = 180;
  let pendingAfterConsumeMs = 0;

  const orchestrator = createRuntimeOrchestrator({
    state,
    nowMs: () => now,
    toSafeInt(value, fallback = 0) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    ensureBackgroundTicker() {
      calls.ensureBackgroundTicker += 1;
    },
    stopBackgroundTicker() {
      calls.stopBackgroundTicker += 1;
    },
    ensureForegroundCatchupPump() {
      calls.ensureForegroundCatchupPump += 1;
    },
    stopForegroundCatchupPump() {
      calls.stopForegroundCatchupPump += 1;
    },
    tickSimulationFromRealtime(options = {}) {
      calls.tickSimulationFromRealtime.push(options);
      return 120;
    },
    queueRealtimeElapsedMs(inputNowMs, options = {}) {
      calls.queueRealtimeElapsedMs.push({ inputNowMs, options });
      return 80;
    },
    queueResumeCatchupFromRealtime(inputNowMs, options = {}) {
      calls.queueResumeCatchupFromRealtime.push({ inputNowMs, options });
      state.pendingSimMs = 640;
      return 640;
    },
    consumePendingSimulation(options = {}) {
      calls.consumePendingSimulation.push(options);
      state.pendingSimMs = pendingAfterConsumeMs;
      return consumePendingReturnMs;
    },
    flushDeferredSaveIfNeeded() {
      calls.flushDeferredSaveIfNeeded += 1;
    },
    persistSaveData() {
      calls.persistSaveData += 1;
      state.backgroundRuntime.lastPersistAtMs = now;
    },
    render() {
      calls.render += 1;
    },
    shouldFreezeBackgroundSimulation: () => options.freezeBackgroundSimulation === true,
    hiddenSimBudgetMs: 180,
    backgroundPumpMaxWorkMs: 4,
    foregroundCatchupPumpMaxWorkMs: 6,
    maxResumeCatchupMs: 120000,
    backgroundPersistDebounceMs: 250,
    markSimulationPump(nowMs) {
      calls.markSimulationPump.push(nowMs);
    },
  });

  return {
    state,
    calls,
    orchestrator,
    setNow(nextNow) {
      now = Number(nextNow);
    },
    setConsumePendingResult({ consumedMs = 180, remainingPendingMs = 0 } = {}) {
      consumePendingReturnMs = Number(consumedMs);
      pendingAfterConsumeMs = Number(remainingPendingMs);
    },
  };
}

test("background live transition starts background ticker, simulates idle, and persists once", () => {
  const fixture = createFixture();

  const result = fixture.orchestrator.handleRuntimeActivityChange({
    activityState: RUNTIME_ACTIVITY_BACKGROUND_LIVE,
    backgroundReason: "document_hidden",
    suspendRequested: false,
  }, {
    source: "document:visibilitychange",
  });

  assert.equal(result.activityState, RUNTIME_ACTIVITY_BACKGROUND_LIVE);
  assert.equal(fixture.calls.ensureBackgroundTicker, 1);
  assert.equal(fixture.calls.stopForegroundCatchupPump, 1);
  assert.equal(fixture.calls.tickSimulationFromRealtime.length, 1);
  assert.deepEqual(fixture.calls.tickSimulationFromRealtime[0], {
    activityState: RUNTIME_ACTIVITY_BACKGROUND_LIVE,
    forceIdleMode: true,
    budgetMs: 180,
    maxWorkMs: 4,
    skipForegroundClamp: true,
  });
  assert.equal(fixture.calls.persistSaveData, 1);
  assert.equal(fixture.state.backgroundRuntime.lastBackgroundReason, "document_hidden");
  assert.equal(fixture.state.backgroundRuntime.lastLifecycleSource, "document:visibilitychange");
  assert.equal(fixture.state.backgroundRuntime.lastBackgroundEnteredAtMs, 1000);
});

test("resume transition queues catchup, drains one bounded tranche, and schedules the foreground pump", () => {
  const fixture = createFixture();
  fixture.state.backgroundRuntime.activityState = RUNTIME_ACTIVITY_BACKGROUND_LIVE;
  fixture.state.backgroundRuntime.lastBackgroundEnteredAtMs = 1000;
  fixture.setConsumePendingResult({ consumedMs: 180, remainingPendingMs: 460 });
  fixture.setNow(5000);

  const result = fixture.orchestrator.handleRuntimeActivityChange({
    activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
    backgroundReason: "foreground_active",
    suspendRequested: false,
  }, {
    source: "window:focus",
  });

  assert.equal(result.activityState, RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);
  assert.equal(result.resumeCatchupMs, 640);
  assert.equal(fixture.calls.stopBackgroundTicker, 1);
  assert.equal(fixture.calls.stopForegroundCatchupPump, 1);
  assert.equal(fixture.calls.queueResumeCatchupFromRealtime.length, 1);
  assert.deepEqual(fixture.calls.queueResumeCatchupFromRealtime[0], {
    inputNowMs: 5000,
    options: {
      activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
      maxCatchupMs: 120000,
    },
  });
  assert.equal(fixture.calls.consumePendingSimulation.length, 1);
  assert.deepEqual(fixture.calls.consumePendingSimulation[0], {
    activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
    forceIdleMode: true,
    budgetMs: 180,
    maxWorkMs: 6,
  });
  assert.equal(fixture.calls.ensureForegroundCatchupPump, 1);
  assert.equal(fixture.calls.render, 1);
  assert.equal(fixture.state.backgroundRuntime.lastResumeAtMs, 5000);
  assert.equal(fixture.state.backgroundRuntime.lastResumeCatchupMs, 640);
});

test("resume transition does not schedule foreground pump once the first tranche clears the backlog", () => {
  const fixture = createFixture();
  fixture.state.backgroundRuntime.activityState = RUNTIME_ACTIVITY_BACKGROUND_LIVE;
  fixture.state.backgroundRuntime.lastBackgroundEnteredAtMs = 1000;
  fixture.setConsumePendingResult({ consumedMs: 180, remainingPendingMs: 0 });
  fixture.setNow(5000);

  const result = fixture.orchestrator.handleRuntimeActivityChange({
    activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
    backgroundReason: "foreground_active",
    suspendRequested: false,
  }, {
    source: "window:focus",
  });

  assert.equal(result.activityState, RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);
  assert.equal(result.resumeCatchupMs, 640);
  assert.equal(fixture.calls.ensureForegroundCatchupPump, 0);
});

test("page lifecycle persist flushes current realtime and forces persistence", () => {
  const fixture = createFixture();
  fixture.setNow(7000);

  const result = fixture.orchestrator.handlePageLifecyclePersist({
    activityState: RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
    backgroundReason: "page_lifecycle_persist",
    suspendRequested: true,
  }, {
    source: "window:pagehide",
  });

  assert.equal(result.activityState, RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED);
  assert.equal(fixture.calls.stopForegroundCatchupPump, 1);
  assert.equal(fixture.calls.queueRealtimeElapsedMs.length, 1);
  assert.deepEqual(fixture.calls.queueRealtimeElapsedMs[0], {
    inputNowMs: 7000,
    options: {
      activityState: RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
      skipForegroundClamp: true,
    },
  });
  assert.equal(fixture.calls.consumePendingSimulation.length, 1);
  assert.deepEqual(fixture.calls.consumePendingSimulation[0], {
    activityState: RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED,
    forceIdleMode: true,
    budgetMs: 180,
    maxWorkMs: 4,
  });
  assert.equal(fixture.calls.persistSaveData, 1);
  assert.equal(fixture.state.backgroundRuntime.activityState, RUNTIME_ACTIVITY_BACKGROUND_SUSPENDED);
  assert.equal(fixture.state.backgroundRuntime.lastBackgroundReason, "page_lifecycle_persist");
});

test("background transitions freeze trainer simulation without catchup when requested", () => {
  const fixture = createFixture({ freezeBackgroundSimulation: true });
  fixture.state.backgroundRuntime.activityState = RUNTIME_ACTIVITY_BACKGROUND_LIVE;
  fixture.setNow(8200);

  const resumed = fixture.orchestrator.handleRuntimeActivityChange({
    activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
    backgroundReason: "foreground_active",
    suspendRequested: false,
  }, {
    source: "window:focus",
  });

  assert.equal(resumed.activityState, RUNTIME_ACTIVITY_FOREGROUND_ACTIVE);
  assert.equal(resumed.resumeCatchupMs, 0);
  assert.equal(fixture.calls.queueResumeCatchupFromRealtime.length, 0);
  assert.equal(fixture.calls.consumePendingSimulation.length, 0);
  assert.deepEqual(fixture.calls.queueRealtimeElapsedMs[0], {
    inputNowMs: 8200,
    options: {
      activityState: RUNTIME_ACTIVITY_FOREGROUND_ACTIVE,
      maxElapsedMs: 0,
      skipForegroundClamp: true,
    },
  });
});
