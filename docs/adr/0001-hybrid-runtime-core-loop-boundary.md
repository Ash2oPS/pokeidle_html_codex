# ADR 0001 - Hybrid Runtime Core Loop Boundary

Date: 2026-03-16
Status: Accepted

## Context

`game-runtime.js` centralizes loop/tick orchestration, simulation stepping, and visibility lifecycle handling.
This makes the runtime hard to scale and raises regression risk for save and gameplay behavior.

## Decision

Introduce a non-breaking core boundary for the runtime loop:

- Add `core/runtime-loop-kernel.js` for:
  - `queueRealtimeElapsedMs`
  - `queueOfflineCatchupFromSave`
  - `consumePendingSimulation`
  - `tickSimulationFromRealtime`
- Add `core/runtime-orchestrator.js` for:
  - `handleVisibilityChange`
  - `handlePageLifecyclePersist`
- Keep `game-runtime.js` function names and call sites unchanged via delegation wrappers.

## Consequences

- Positive:
  - Creates a stable seam for phased extraction of `core/`, then `systems/`.
  - Preserves gameplay and save compatibility in phase 1.
  - Enables focused tests on loop logic without booting full runtime.
- Neutral:
  - Adds temporary indirection during migration.
- Negative:
  - Does not reduce all global state coupling yet; this remains for later phases.

## Rollback

If regressions appear, rollback is simple:

1. Restore the previous inline loop/orchestrator implementations in `game-runtime.js`.
2. Remove the new `core/` delegation imports.
3. Keep tests as a safety harness for future retry.
