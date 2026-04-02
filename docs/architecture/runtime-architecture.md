# Runtime Architecture

## Layer Boundaries

- `simulation`: source of truth for combat, progression, quests, unlocks, and saveable state
- `render`: canvas-based world renderer only
- `ui`: React DOM interfaces, HUD, windows, map, dialogue, and menus
- `platform`: browser lifecycle, language detection, layout mode detection, persistence plumbing
- `content`: authored data, generated data, schemas, and runtime bundles

## Hard Rules

- no gameplay logic in canvas rendering code
- no renderer objects inside save data
- no UI state as the source of truth for gameplay systems
- no important gameplay rule tied to active-tab frame cadence

## Game App Shape

- `app`: bootstrapping, providers, top-level shell
- `game`: playfield, HUD, focus windows, renderer adapters
- `content`: runtime data loading and adaptation
- `platform`: lifecycle and environment hooks

## Tool App Shape

- one internal studio with multiple modules
- domain screens instead of separate standalone tools
- shared schemas, validators, and tokens with the game

## Shared Packages

- `contracts`: portable domain types and enums
- `game-core`: runtime helpers and platform policies
- `game-core`: also hosts the temporary slice-progression shell used before the full combat runtime exists
- `content-schema`: zod schemas and validation contracts
- `ui-tokens`: shared color, spacing, and typography tokens
