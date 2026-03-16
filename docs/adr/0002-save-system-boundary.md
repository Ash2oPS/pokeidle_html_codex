# ADR 0002 - Save System Boundary with Infra Adapters

Date: 2026-03-16
Status: Accepted

## Context

Save orchestration (candidate selection, persist stamps, retries, backend indicator) lived in `game-runtime.js`
with direct coupling to browser storage and runtime flags.

## Decision

Introduce a dedicated save system boundary:

- Add `systems/save/runtime-save-system.js` for:
  - load/persist orchestration
  - browser/desktop write queue control
  - retry timers and backend health labels
- Add `infra/storage/browser-save-storage.js` as browser storage adapter.
- Keep runtime API names in `game-runtime.js` through wrappers for backward compatibility.

## Consequences

- Positive:
  - Save behavior becomes testable in isolation.
  - Runtime file sheds critical orchestration logic.
  - Future phase can swap infra backends with reduced risk.
- Neutral:
  - Temporary wrappers remain in `game-runtime.js` during migration.
- Negative:
  - IndexedDB/desktop bridge low-level internals are still in runtime for now.

## Rollback

1. Remove `runtimeSaveSystem` wiring from `game-runtime.js`.
2. Restore previous inline save orchestration functions.
3. Keep adapter/system tests for future extraction retries.
