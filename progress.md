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

2026-04-03

- Replaced Pokemon visual sourcing with Platinum front sprites only:
  - generated species contract field is now `frontSpriteUrl`
  - import script now extracts `generation-iv/platinum/front_default`
  - generated dataset no longer ships `official-artwork`
- Reworked the battle canvas scene:
  - desktop uses a strict equal-radius 6-slot ring
  - mobile uses a lower symmetric arc for readability
  - team slots and enemy now render actual Pokemon sprites
  - canvas now keeps the playfield only; zone/progress/timer remain in HUD DOM
- Added a pure scene layout helper plus app-level tests for desktop ring spacing and mobile bounds.
- Updated all existing Pokemon-facing surfaces to the same sprite source:
  - starter choice
  - team window
  - tool Pokemon viewer
- Cleaned a new batch of broken French strings while touching the related UI files.

Notes:

- `.codex-artifacts/` should still stay uncommitted.
- If sprite readability is still too weak on mobile after visual review, the next tweak point is the mobile arc radius and enemy Y offset, not the gameplay slot order.

2026-04-03

- Tightened the mobile combat shell after visual review:
  - active combat now collapses the current-zone panel into a compact summary on mobile
  - the playfield remains visible while keeping timer/progress/enemy info on screen
- Re-ran validation and screenshot capture after the shell adjustment.

Notes:

- Desktop ring composition reads cleanly with Platinum sprites in occupied slots and ghost frames for empty slots.
- Mobile now keeps the adapted lower arc readable, although the top HUD remains dense by design.

2026-04-03

- Locked combat animation direction for the next tranche:
  - cover all offensive types from the start
  - use a hybrid VFX pipeline: pixel-sprite key effects plus lightweight procedural particles/trails
  - target a nervous but still relatively discreet visual tone
  - enemy damage feedback uses hit punch plus flash
- Deferred for a later tranche and should stay out of V1 implementation:
- miss feedback
- crit feedback
- variant hit reactions
- expanded per-hit outcome styling

2026-04-03

- Implemented typed combat attack presentation V1:
  - runtime now emits transient resolved-attack visual events for live visible combat only
  - attack class is derived from canonical base stats (`atk >= spAtk` => physical)
  - canvas now runs a local animation director with bounded queue and reset on session changes
  - physical attacks charge into contact, special attacks fire projectiles, both hit at 180 ms inside a 360 ms timeline
  - enemy damage feedback now uses punch plus flash
  - all offensive types now map to local VFX profiles with a hybrid sprite-plus-procedural pipeline
- Added renderer and runtime tests for:
  - aligned hit timing
  - mobile budget reduction
  - bounded animation queue and session reset
  - live visual event emission and reaction outcomes

Notes:

- Miss, crit, hit variants, and multi-target visual branches remain intentionally deferred.
- No animation backlog should appear after hidden-tab or offline catch-up syncs.

2026-04-03

- Fixed a dev-only combat canvas regression on `localhost:5173`:
  - React Strict Mode cleanup could cancel a pending `requestAnimationFrame` without clearing the stored RAF id
  - the battle canvas then believed a frame was still pending forever and never redrew again
  - the fix now clears the RAF ref during cleanup so live dev redraws resume correctly

2026-04-03

- Fixed two combat presentation issues after live feedback:
  - attack animation events were being re-enqueued on unrelated HUD/session updates, which caused repeated attack loops
  - physical charge movement now uses a short capped travel distance instead of lunging almost to the enemy sprite

2026-04-03

- Added combat slot context actions in the playfield:
  - clicking or tapping an allied slot now opens a contextual team menu
  - desktop uses an anchored popover and mobile uses a compact bottom sheet
  - V1 actions are `Add Pokemon`, `Change Pokemon`, and `Clear Slot`
  - selecting `Add` or `Change` opens a compact species picker without using the full Team window
- Added pure slot hit testing in the render layout helper and UI-model tests for the contextual action set

2026-04-03

- Locked stricter team composition rules in runtime and docs:
  - duplicate species are now forbidden in the team
  - duplicate evolution-family members are forbidden except for the Eevee family
  - roster sync now sanitizes invalid legacy team states by clearing later conflicting slots
  - evolution runtime is still pending, but the canonical doc now states that successful evolution must replace the source species in the same slot and cannot unlock an already owned evolution species
