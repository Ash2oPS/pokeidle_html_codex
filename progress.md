Original prompt: PLEASE IMPLEMENT THIS PLAN: Game Shell V1 branche sur le contenu reel

2026-04-02

- Implemented a slice progression runtime in `packages/game-core/src/slice` with pure functions:
  - `syncSliceProgressionState`
  - `applySliceAction`
  - `deriveSliceView`
- Save bootstrap now starts on `town-1` and persists temporary active dialogue state.
- Wired the game shell to live content from `@pokeidle/content-data` instead of local focus mocks.
- Added compact slice UI surfaces:
  - current zone panel
  - dialogue window
  - world map window
  - quests window
  - placeholder Dex and Team windows
- Added game-core tests for accessibility propagation, flag locks, dialogue-driven quest starts, gym unlocks, and manual quest reward claims.
- Verified:
  - `corepack pnpm check`
  - `corepack pnpm build`

Notes:

- Combat remains placeholder by design in this slice.
- Dex and Team remain placeholders by design in this slice.
- `.codex-artifacts/` contains local screenshots only and should stay uncommitted.

Suggested next step:

- Replace debug completion buttons with the first real combat runtime path for combat zones and gym battles.

2026-04-02

- Implemented the first real combat tranche:
  - generated 30-species Sinnoh dataset from PokeAPI
  - real wild battle runtime for `route-1` and `route-2`
  - real gym runtime for `gym-001`
  - starter choice flow after Rowan
  - persistent team slots and battle sessions in save
- Added generated data pipeline pieces:
  - `scripts/import-pokemon-data.mjs`
  - cached raw PokeAPI responses under `content/source/pokeapi-cache`
  - normalized runtime species file under `content/generated/pokemon/species.v1.json`
- Extended shared contracts and save model for:
  - generated species data
  - combat tuning data
  - starter choice
  - unlocked species ids
  - ordered 6-slot team
  - active wild/gym session snapshots
- Replaced debug combat actions in the game shell with:
  - starter choice modal
  - minimal team editor
  - real `Enter` / `Resume` wild battle flow
  - real `Start Gym` / `Resume Gym` flow
- Updated the tool Pokemon viewer to read generated species data and shared scaling rules.
- Added tests for:
  - generated species dataset integrity
  - starter and team persistence
  - deterministic background combat reconstruction
  - wild timeout and defeat flow
  - gym validation and victory flow
  - wet reaction modifiers
  - real-combat progression unlock path to `town-2`
- Verified:
  - `corepack pnpm check`
  - `corepack pnpm build`

Notes:

- Capture, evolution, talents, and offensive type switching are still intentionally deferred.
- Combat is real now, but trainer maluses beyond team-size limit are still out of scope.
- The next clean step is to replace remaining placeholders in the Dex and expand Pokemon progression beyond the starter bundle.
