<!-- doc-meta: {"status":"normative","scope":["runtime-architecture","simulation-boundaries"],"readFirst":["runtime-changes","combat-changes","save-changes"]} -->
# Runtime Architecture

- Simulation is the gameplay source of truth; render only draws, UI presents and dispatches intent, and platform owns lifecycle, layout, language, and persistence plumbing. [RULE:ARCH-RUNTIME-001]
- Important gameplay rules must not depend on active-tab cadence, render loops, or browser background timer behavior. [RULE:ARCH-RUNTIME-002]
- Combat stepping must remain deterministic from timestamps and saved session state. [RULE:ARCH-RUNTIME-003]
- Type logic, reaction resolution, stat derivation, progression state, and battle flow belong to `game-core` or equivalent runtime layers rather than React or canvas code. [RULE:ARCH-RUNTIME-004]
- Wild, boss, trainer, and gym flows remain explicit runtime paths instead of UI-only branches. [RULE:ARCH-RUNTIME-005]
- Combat animation and VFX cues are transient presentation events derived from resolved runtime attacks, are never persisted in save state, and must not replay offline catch-up as if it were live action. [RULE:ARCH-RUNTIME-006]

## Current Foundation

The current runtime foundation uses `packages/game-core` for slice progression, combat, roster helpers, save wiring, and Pokemon stat scaling helpers.
