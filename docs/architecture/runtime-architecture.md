# Runtime Architecture

## Layer Boundaries

- `simulation`: source of truth for combat, roster progression, quests, unlocks, and saveable state
- `render`: canvas-based world renderer only
- `ui`: React DOM interfaces, HUD, windows, map, dialogue, and menus
- `platform`: browser lifecycle, language detection, layout mode detection, persistence plumbing
- `content`: authored data, generated Pokemon data, schemas, and runtime bundles

## Hard Rules

- no gameplay logic in canvas rendering code
- no renderer objects inside save data
- no UI state as the source of truth for gameplay systems
- no important gameplay rule tied to active-tab frame cadence

## Game App Shape

- `shell`: bootstrapping, providers, save wiring, top-level shell
- `ui`: playfield, HUD, focus windows, renderer adapters
- `content`: runtime data loading and adaptation
- `platform`: lifecycle and environment hooks

## Tool App Shape

- one internal studio with multiple modules
- domain screens instead of separate standalone tools
- shared schemas, validators, and tokens with the game

## Shared Packages

- `contracts`: portable domain types and enums
- `game-core`: runtime helpers and platform policies
- `game-core`: hosts the temporary slice-progression shell for travel/dialogue/quest flow
- `game-core`: also hosts the first real combat runtime, roster helpers, and Pokemon stat scaling helpers
- `content-schema`: zod schemas and validation contracts
- `ui-tokens`: shared color, spacing, and typography tokens

## Runtime Modules

- `slice`: temporary progression shell for towns, travel, dialogue, and quest wiring
- `combat`: real battle session runtime for wild zones and gym battles
- `roster`: starter choice, unlocked species, and ordered team slot helpers
- `pokemon`: stat scaling helpers shared by combat and tooling

## Combat Runtime Rules

- real combat state lives in save data and survives reload/background time
- combat session stepping must stay deterministic from timestamps and saved session state
- empty slots consume time exactly like filled slots
- type effectiveness and reaction logic belong to `game-core`, never to React components
- gym rules and wild-zone rules are separate runtime paths, not UI-only branches

## Content Pipeline Shape

- canonical Pokemon data is imported from PokeAPI into a cached source layer
- normalized generated species data lives in `content/generated`
- authored progression tuning stays separate from generated species data
- runtime registry validation must resolve cross-references between authored zones/battles and generated species ids
