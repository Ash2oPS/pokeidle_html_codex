# ADR 0005 - UI HUD System and Runtime Composition Root

Date: 2026-03-16
Status: Accepted

## Context

After phases 1-4, `game-runtime.js` still instantiated multiple systems inline
and kept HUD orchestration (`updateHud`) as runtime-local logic.
That limited readability and delayed the phase-5 objective of a thinner orchestrator entry.

## Decision

- Add `systems/ui/runtime-hud-system.js` and extract HUD orchestration:
  - money/coins HUD refresh
  - wallet panel refresh
  - save backend indicator refresh
  - route/gacha/dev panel refresh dispatch
- Add `core/runtime-composition-root.js` to centralize creation of extracted systems:
  - progression/economy
  - notifications
  - encounter combat
  - battle lifecycle
  - UI HUD
- Keep existing function names and call sites in `game-runtime.js`
  through delegation wrappers and composition-root destructuring.

## Consequences

- Positive:
  - `game-runtime.js` moves closer to orchestration-only responsibilities.
  - UI HUD behavior becomes unit-testable in isolation.
  - System wiring is explicit in one composition boundary.
- Neutral:
  - Runtime remains hybrid during migration with temporary wrappers.
- Negative:
  - Route/shop modal rendering remains in runtime and is not fully extracted yet.

## Rollback

1. Remove composition-root call and restore direct inline system instantiation.
2. Restore prior inline `updateHud` implementation in `game-runtime.js`.
3. Keep tests as regression guard for a safe retry.
