# Project Architecture

## Entrypoints
- `game.js`: web bootstrap entrypoint.
- `game-runtime.js`: runtime orchestrator (composition, bootstrap, lifecycle wiring, compatibility hooks).
- `index.html`, `styles.css`: host page and UI styling shell.

## Core
- `core/runtime-loop-kernel.js`: deterministic simulation queue/tick kernel (offline catch-up, idle mode, deferred save flush).
- `core/runtime-orchestrator.js`: page lifecycle orchestration (`visibilitychange`, persist lifecycle hooks).
- `core/runtime-composition-root.js`: composition root wiring systems and dependencies.
- `core/runtime-bootstrap-system.js`: runtime bootstrap scene lifecycle boundary (`initializeScene`, reset/startup flows).

## Systems
- `systems/save/`: save/load orchestration and multi-backend synchronization.
- `systems/combat/`: battle lifecycle and `PokemonBattleManager` runtime extraction.
- `systems/encounter/`: route encounter + combat-enemy creation orchestration.
- `systems/progression/`: economy/xp/reward progression orchestration.
- `systems/notifications/`: temporary notifications/top messages runtime.
- `systems/ui/`:
  - `runtime-hud-system.js`: HUD snapshots and animated counters.
  - `runtime-render-system.js`: render/layout pipeline boundary.
  - `runtime-input-system.js`: centralized listener binding with `init()` / `dispose()`.
  - `runtime-ui-interaction-system.js`: extracted UI interaction/modal/pokedex/route asset orchestration boundary.

## Domain (Pure Rules)
- `domain/combat/balance-rules.js`: pure scaling formulas for enemy HP/reward multipliers.
- `domain/progression/reward-rules.js`: pure reward/xp/money formulas and level-diff multipliers.
- `domain/encounter/shiny-rules.js`: pure shiny/ultra-shiny roll rules.
- `domain/routes/route-timer-rules.js`: pure route timer decision rules.

## Infra
- `infra/storage/`: browser storage, IndexedDB, desktop bridge adapters.

## Libraries (`lib/`)
- Runtime utility modules shared by systems: data parsing, passives, text normalization, save consistency, platform/environment helpers, render quality, animation helpers.

## Data & Assets
- `pokemon_data/`, `map_data/`, `item_data/`: gameplay datasets.
- `assets/`: sprites, maps, item icons, type icons, and other visuals.

## Testing
- Node: `npm run test:node`
- Vitest: `npm run test:vitest`
- Full: `npm test`
- Perf regression:
  - `npm run test:perf:web-game:regression`
  - `npm run test:perf:phase5:regression`

## Compatibility Guarantees
- Save format/schema/keys remain unchanged.
- Public runtime hooks remain stable (including `window.render_game_to_text` and `window.advanceTime`).
- Refactor strategy is incremental with reversible boundaries (façade-first extraction).
