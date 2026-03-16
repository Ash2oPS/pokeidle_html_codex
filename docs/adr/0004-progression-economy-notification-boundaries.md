# ADR 0004 - Progression, Economy and Notification Boundaries

Date: 2026-03-16
Status: Accepted

## Context

`game-runtime.js` still carried reward formulas, XP distribution, economy mutations,
and temporary notification orchestration in a single monolith.
That coupling made combat reward behavior and UI notifications harder to test in isolation.

## Decision

Introduce phase-4 non-breaking boundaries:

- Add `systems/progression/reward-progression-system.js` for:
  - economy mutations (`add/spend` money and coins)
  - balance multipliers and reward scaling helpers
  - XP reward formulas and team XP distribution
  - evolution-ready enqueue side effects during progression
- Add `systems/notifications/runtime-notification-system.js` for:
  - temporary notification creation
  - top-message normalization + push flow
- Keep existing function names in `game-runtime.js` and delegate through wrappers.

## Consequences

- Positive:
  - Reward/progression behavior is now directly unit-testable without booting full runtime.
  - Temporary notification behavior has a dedicated seam for further UI extraction.
  - Save format and runtime hooks remain unchanged.
- Neutral:
  - Runtime wrappers remain while migration continues.
- Negative:
  - Full notification rendering/animation stack is still coupled to runtime DOM code for now.

## Rollback

1. Remove `rewardProgressionSystem` and `runtimeNotificationSystem` wiring from `game-runtime.js`.
2. Restore previous inline implementations for delegated functions.
3. Keep added tests as regression harness for a safer retry.
