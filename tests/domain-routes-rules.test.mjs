import test from "node:test";
import assert from "node:assert/strict";

import { resolveEnemyTimerConfig } from "../domain/routes/route-timer-rules.js";

test("route timer rules disable timer outside combat routes", () => {
  const config = resolveEnemyTimerConfig({
    routeCombatEnabled: false,
    isOnlyOneEncounterEnemy: true,
    onlyOneEncounterTimerMs: 45000,
    enemyTimerStyleOnlyOne: "only_one",
    enemyTimerStyleRoute: "route",
    routeUnlockProgressState: {
      timerEnabled: true,
      timerDurationMs: 90000,
    },
  });

  assert.deepEqual(config, {
    enabled: false,
    durationMs: 0,
    style: "route",
  });
});

test("route timer rules prioritize only-one encounter timers", () => {
  const config = resolveEnemyTimerConfig({
    routeCombatEnabled: true,
    isOnlyOneEncounterEnemy: true,
    onlyOneEncounterTimerMs: 50000,
    enemyTimerStyleOnlyOne: "only_one",
    enemyTimerStyleRoute: "route",
    routeUnlockProgressState: {
      timerEnabled: true,
      timerDurationMs: 99999,
    },
  });

  assert.deepEqual(config, {
    enabled: true,
    durationMs: 50000,
    style: "only_one",
  });
});

test("route timer rules fallback to route unlock progress when needed", () => {
  const config = resolveEnemyTimerConfig({
    routeCombatEnabled: true,
    isOnlyOneEncounterEnemy: false,
    onlyOneEncounterTimerMs: 50000,
    enemyTimerStyleOnlyOne: "only_one",
    enemyTimerStyleRoute: "route",
    routeUnlockProgressState: {
      timerEnabled: true,
      timerDurationMs: 123000,
    },
  });

  assert.deepEqual(config, {
    enabled: true,
    durationMs: 123000,
    style: "route",
  });
});
