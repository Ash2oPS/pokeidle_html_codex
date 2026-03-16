# ADR 0003 - Combat and Encounter Lifecycle Boundaries

Date: 2026-03-16
Status: Accepted

## Context

`game-runtime.js` still contained route encounter generation and battle lifecycle orchestration
(`startBattle`, route-change combat sync, timer config, enemy spawn payload construction).
This made combat behavior hard to test in isolation and increased regression risk for incremental refactors.

## Decision

Introduce two non-breaking system boundaries while preserving runtime APIs:

- Add `systems/encounter/route-encounter-combat-system.js` for:
  - route enemy payload creation
  - only-one encounter detection
  - enemy timer config resolution
  - reward level normalization helper
- Add `systems/combat/battle-lifecycle-system.js` for:
  - team hydration + battle sync
  - battle manager boot
  - route-change battle lifecycle transitions
- Keep existing function names in `game-runtime.js` and delegate through wrappers.

## Consequences

- Positive:
  - Creates testable seams for combat and encounter behavior without save schema changes.
  - Keeps gameplay hooks and public runtime entry points stable.
  - Reduces risk for upcoming extraction of encounter/combat internals in later phases.
- Neutral:
  - Temporary indirection remains in `game-runtime.js` during migration.
- Negative:
  - `handleEnemyDefeated` and advanced combat rewards logic are still in the runtime monolith for now.

## Rollback

1. Remove `routeEncounterCombatSystem` and `battleLifecycleSystem` wiring in `game-runtime.js`.
2. Restore previous inline implementations for extracted wrappers.
3. Keep isolated tests to support a safer retry of the extraction.
