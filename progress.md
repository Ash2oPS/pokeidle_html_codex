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
