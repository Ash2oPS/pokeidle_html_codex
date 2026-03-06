Original prompt: creons un jeu web en utilisant la data qu'on a dans le projet. Creons un fan game pokemon idle. voici comment il se presente : on a un ennemi au centre de l'ecran et nous avons notre team de 6 pokemon max qui encerclent l'ennemi. L'ennemi est le seul ennemi a avoir une barre de vie. sinon tous les poke ont leur nom (fr pour l'instant) et leur lvl d'affiche. Pour l'instant fais ca.

## Progress log
- Created a minimal web game scaffold with `index.html`, `styles.css`, and `game.js`.
- Implemented a single-canvas arena layout:
  - One enemy centered on screen.
  - Team members (max 6) arranged in a ring around the enemy.
  - Enemy is the only entity with a visible HP bar.
- Wired local project data loading from existing Pokemon JSON files in `pokemon_data`.
- Displayed FR names (`name_fr`) and generated levels for enemy + team.
- Added compatibility hooks:
  - `window.render_game_to_text`
  - `window.advanceTime(ms)`
- Added fullscreen toggle on `f`.
- Verified with the `develop-web-game` Playwright client:
  - Screenshots generated in `output/web-game-poke/shot-0.png..shot-2.png`.
  - Text states generated in `output/web-game-poke/state-0.json..state-2.json`.
  - No console/page errors generated.
- Fixed a layout issue found during screenshot review:
  - Moved enemy HP bar upward to avoid overlap with the top team slot.
- Added a battle system class `PokemonBattleManager` in `game.js`:
  - Turn-based idle attacks every 0.8s.
  - Fixed attacker order loop: Bulbizarre -> Salameche -> Carapuce -> Pikachu -> Rondoudou -> Miaouss -> repeat.
  - Typed projectile spawning from each attacker position toward the enemy.
  - Damage formula using attacker/defender stats, STAB, and type effectiveness multipliers.
  - Automatic enemy replacement when current enemy HP reaches 0.
- Expanded battle text-state output (`render_game_to_text`) with:
  - `next_attacker`
  - `active_projectiles`
  - `last_impact`
  - `enemies_defeated`
- Verified battle behavior with Playwright runs:
  - Short run confirmed attack rotation and projectile activity (`output/web-game-poke`, `output/web-game-projectile`).
  - Long run confirmed enemy KO replacement (`enemies_defeated: 2`) and type-effectiveness impact (example multiplier 0.5 against Leviator).
  - No console/page errors reported in run outputs.
- Added both requested combat polish features:
  - Floating damage numbers on impact (with resistance/super/immune tags when relevant).
  - KO visual transition (flash/ring), plus delayed enemy respawn timer before replacement.
- Validated KO transition behavior with iterative Playwright run (`output/web-game-ko`):
  - Captured KO freeze state with `ko_transition.active: true` and `enemy.hp_current: 0`.
  - Captured post-delay respawn with next enemy loaded and combat resumed.
  - No console/page errors reported.

## TODO / Next
- Validate a dedicated mobile viewport pass (small width) and tune text spacing if needed.
- Add configurable team/enemy selection in a future iteration (instead of fixed starter set).
- Add crit-specific floating text style and optional screen-shake toggle.

## Additional progress (starter/save/Route 1 update)
- Migrated game bootstrap to Route 1 flow with persistent save state (`pokeidle_save_v3`):
  - Load route config from `map_data/kanto_route_1.json`.
  - Load and draw route background image from route data with `imageSmoothingEnabled = false`.
  - Build Pokemon definitions from starter set + route encounters.
- Added no-save onboarding:
  - If no valid save/team exists, game starts with zero team members.
  - Starter modal appears with Bulbizarre / Salamèche / Carapuce, all level 5.
  - Choosing one starter captures it and initializes team with only that Pokemon.
- Refactored `PokemonBattleManager`:
  - Removed fixed enemy roster.
  - New enemy spawn uses Route 1 weighted encounters.
  - Added spawn/defeat callbacks to update save stats and persistence.
  - Kept 0.8s turn-based projectile attacks and KO -> delayed respawn loop.
- Added shiny system:
  - Enemy shiny chance set to 1/4096 (`SHINY_ODDS = 4096`).
  - Encounter/defeat/capture stats tracked by normal/shiny split.
- Added catch flow on KO:
  - Automatic Pokeball resolution with chance based on species catch rate.
  - Captured Pokemon can join team (max 6, no duplicate same species+shiny flag).
  - Save is persisted on enemy spawn and capture flow updates.
- Added hover stats popup:
  - On hover enemy/team, popup shows rencontres / battus / captures with normal+shiny detail.
- UI updates requested:
  - Enemy HP bar reduced and placed just above enemy name/level block.
  - Removed bottom-left battle info panel from render path.
  - Added top transient message for key events (starter, spawn, capture outcome).

## Validation runs (develop-web-game skill loop)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (starter modal visible in text state; no console/page error).
- Playwright run with starter click (`output/web-game-starter`): PASS.
  - Confirmed starter pick -> combat starts on Route 1 species.
- Hover interaction run (`output/web-game-hover`): PASS.
  - `hover_popup_visible: true` observed in text state when mouse is over enemy.
- Long capture run (`output/web-game-longcapture`): PASS.
  - Confirmed enemy defeats, auto-captures, team growth, and attacker rotation with new members.

## Remaining TODO ideas
- Add explicit Pokeball projectile animation (current auto-catch is state/message-driven).
- Add a visible save-reset button for easier test/debug loops.

## Additional progress (reset + slot timing + capture animation)
- Added a top-right save reset button in UI:
  - `index.html`: `#reset-save-btn`.
  - `styles.css`: `.reset-save-btn` styling.
  - `game.js`: click handler with confirmation + localStorage wipe + full scene reinit.
- Enforced fixed 6-slot battle rotation timing, even when team has fewer Pokemon:
  - Layout now always computes `teamSlots` for all 6 ring positions.
  - Turn index cycles over 6 slots (`MAX_TEAM_SIZE`) regardless of current team size.
  - Empty slots consume attack interval ticks but do not spawn projectiles.
  - Visual empty slot markers are drawn for unoccupied ring positions.
- Added full capture attempt animation flow:
  - Pokeball throw and shake sequence on enemy KO.
  - Success path: positive burst particles + ring/glow finish before next spawn.
  - Failure path: ball break particles + enemy reappearance/fade before next spawn.
  - Capture sequence state exposed in `render_game_to_text` as `capture_sequence`.
- Updated save/capture callback contract:
  - `handleEnemyDefeated` now returns `{ captured: boolean }` to drive animation branch.
  - Existing stat persistence (encounter/defeat/capture normal/shiny) remains active.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- Playwright (`output/web-game-slots`):
  - Confirmed one-Pokemon team respects 6-slot timing (attack cadence slower, empty turns present).
- Playwright (`output/web-game-captureanim-long`):
  - Confirmed `capture_sequence` phases for success and failure (`throw`, `shake`, `success`, `break`, `reappear`, `post`).
  - Confirmed failed capture message + ball break + enemy reappear visual.
  - Confirmed successful capture particles/ring visual and post-capture team growth.

## Additional progress (render order + FRLG assets/data)
- Adjusted Pokemon ground shadows upward so they sit closer to sprite feet.
- Reordered render layering so gameplay UI labels/bars (names, levels, HP) are drawn after scene entities/effects.
- Replaced Route 1 background with FRLG map art:
  - Downloaded `assets/backgrounds/kanto_route_1_frlg.png` from Bulbagarden Archives.
- Rebuilt encounter route data for FRLG using PokeAPI location-area + version filters (`firered`, `leafgreen`):
  - Added `map_data/kanto_frlg_routes.json` with per-route/per-area species mapping.
  - Regenerated `map_data/kanto_route_1.json` from FRLG route mapping:
    - Route 1 now only includes `pidgey` and `rattata` (walk encounters).
    - Background path now points to FRLG Route 1 image.

## Validation runs (latest)
- `run_playwright_check.ps1`: PASS (starter modal flow + new FRLG Route 1 background visible).
- Playwright (`output/web-game-ui-order`): PASS (UI labels and HP bars visually in front of scene elements).
- Playwright (`output/web-game-captureanim-long`): PASS (success/failure capture phases still valid after render-order changes).

## Additional progress (turn indicator + recoil + projectile accel)
- Added visual attack-turn indicator:
  - White low-opacity circular marker that rotates slot-to-slot with the turn order.
  - Drawn behind Pokemon sprites; empty-slot states are still indicated with a lighter dashed style.
  - Exposed current slot in text state as `next_attacker_slot_index`.
- Added attack recoil animation for team Pokemon:
  - On attack, the attacker receives a short backward recoil offset (away from center), then settles.
  - Applied at sprite render time so the movement is visible and tied to attack timing.
- Upgraded projectile motion from linear to variable acceleration:
  - Projectile speed now follows a non-linear acceleration curve over distance progress.
  - Added slight pulse variation over lifetime for stronger impact feeling.
  - Kept hit reliability via progress/lifetime cutoffs.
- Refined draw order for UI clarity:
  - Added dedicated UI overlay pass so HP bars + names/levels are rendered after scene/effects/sprites.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- Playwright (`output/web-game-turn-indicator`): PASS.
  - Verified rotating indicator movement and slot progression including empty slots.
- Playwright (`output/web-game-indicator-multi`): PASS.
  - Verified indicator transition with multi-Pokemon team and recoil visibility on attacker.

## Additional progress (pokemon entities + progression + economy)
- Refactored save/game progression to a species-entity model (`version: 4` in save payload):
  - Added `pokemon_entities` keyed by species id, storing:
    - `level`, `xp`, computed `stats` per level
    - `encountered_normal/shiny`, `defeated_normal/shiny`, `captured_normal/shiny`
  - Added migration path from legacy `species_stats` + old `team` shape.
- Team rules updated to entity semantics:
  - Team now stores unique species ids only (no duplicates).
  - First successful capture of a species unlocks it.
  - Newly unlocked species starts level 1.
  - If team has room (<6), unlocked species is auto-added.
- Starter/auto-grant behavior aligned:
  - Starter still starts level 5.
  - Auto-granted species now enforce at least 1 encounter and 1 capture on obtain.
- Added XP progression system:
  - Capture grants XP to all current team members.
  - XP thresholds use a species-scaled curve based on base stat total.
  - Level up recalculates stats with per-level scaling from species base stats.
- Added economy + shop:
  - Save now tracks `money` and `pokeballs`.
  - Player starts at 0 money / 0 pokeballs.
  - Defeating wild Pokemon grants money (reward scales by enemy level + species stats).
  - Added top-right HUD for money/pokeballs.
  - Added Shop panel (top-right) with Pokeball purchase buttons (`x1`, `x5`) and persistence.
- Capture flow updated with pokeball inventory:
  - Auto throw only happens if `pokeballs > 0`.
  - Each throw consumes one Pokeball.
  - If no Pokeball, no capture throw animation is triggered (KO respawn path only).
- Route wild level accuracy update:
  - `map_data/kanto_route_1.json` now includes FRLG-derived level data:
    - Roucool: weighted levels 2/3/4/5 (10/35/4/1)
    - Rattata: weighted levels 2/3/4 (10/35/5)
  - Enemy spawn now uses encounter-level weights from route data when provided.
- Text-state export enhanced with economy/UI fields:
  - `money`, `pokeballs`, `shop_open`.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (multiple reruns, no runtime crash).
- Custom long combat run with starter select (`output/web-game-entity`): PASS.
  - Confirmed defeats increment money (`money > 0`) while `pokeballs = 0`.
  - Confirmed no capture sequence when no Pokeballs (`capture_sequence: null`).
  - Confirmed wild levels in Route 1 are within FRLG route data range.
- Shop open interaction run (`output/web-game-shop`): PASS.
  - Confirmed `shop_open: true` in state after clicking Shop.

## Notes / follow-up
- Playwright client captures canvas-first screenshots, so top-right DOM HUD/shop visuals are validated primarily via text-state (`money`, `pokeballs`, `shop_open`).
- Future improvement: add a deterministic Playwright action script that clicks Shop buy buttons and verifies Pokeball decrement on subsequent capture throws in one end-to-end scenario.

## Quick tweak (attack cadence + starter level)
- Reduced idle attack interval from `800ms` to `500ms` (`ATTACK_INTERVAL_MS = 500`).
- Starter level is now `1` everywhere:
  - Starter choice cards display `Niv. 1`.
  - Starter acquisition initializes entity at level 1.
  - Starter modal subtitle now says niveau 1.

## Validation (quick)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Exported text state confirms `attack_interval_ms: 500`.

## Additional tweak (indicator linear + equal distance + projectile speed)
- Turn indicator movement updated to be continuous and linear over the full 6-slot attack cycle:
  - Removed step-based/eased indicator jumps.
  - Indicator now follows a circular path at constant angular speed.
  - Timing is synchronized with attack cadence so it passes under a slot exactly at that slot's attack tick.
- Team formation spacing normalized:
  - Replaced elliptical ring with circular ring (`teamRadius`) so every slot is at equal distance from enemy center.
- Projectile speed behavior updated:
  - Increased projectile base speed (`520 px/s`).
  - Removed per-projectile speed variance/random pulse so all projectiles travel at the same speed profile regardless of attacker.

## Validation (quick)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Starter+combat long run (`output/web-game-indicator-linear`): PASS (no runtime errors, combat still active).

## Additional progress (local file save/load backend)
- Reworked save/load flow to support local file read/write on PC via File System Access API.
- Added local file handle persistence through IndexedDB:
  - DB: `pokeidle_save_file_db`
  - Store/key: `save_handles` / `main_handle`
- Save loading priority is now:
  1. Linked local save file (if available/readable)
  2. Fallback localStorage (`pokeidle_save_v3`) for compatibility
- Save writes now:
  - Always mirror to localStorage
  - Queue async writes to linked local file handle when configured
- Added UI controls/status for save backend:
  - New button: `Lier save locale`
  - New HUD pill: `Save: fichier local|localStorage`
- Added export text-state field: `save_backend` (`local_file` or `local_storage`).
- `initializeScene` now awaits async `loadSaveData()`.

## Validation (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- State output confirms new backend field: `save_backend: "local_storage"` when no file linked.

## Notes
- In browser security model, opening/creating a local save file requires explicit user action; this is now provided by the `Lier save locale` button.

## Additional progress (idle simulation in background/inactive tab)
- Added real-time simulation queue with wall-clock catch-up:
  - New runtime fields: `realClockLastMs`, `pendingSimMs`.
  - Main loop now consumes elapsed real time instead of relying on foreground-only RAF delta.
- Added offline progression support from save timestamp:
  - Save schema already had `last_tick_epoch_ms`; now scene init queues elapsed time since last tick and simulates it in idle mode.
  - Added cap `MAX_OFFLINE_CATCHUP_MS` to avoid unbounded catch-up stalls.
- Added background/inactive tab processing:
  - `visibilitychange` hook starts/stops a background ticker (`setInterval`) when tab is hidden/visible.
  - Hidden ticks run idle-mode simulation budget even when RAF is throttled.
  - On return to visible tab, queued simulation is drained and rendered immediately.
- Added lifecycle persistence hooks:
  - `pagehide` + `beforeunload` now force a final idle simulation drain + save timestamp write.
- Added deferred save writes during bulk idle simulation:
  - Spawn/defeat callbacks now defer save writes while in idle-step mode and flush once after batch processing.
  - Keeps required save behavior while avoiding excessive write storms during catch-up.
- Improved save source arbitration:
  - When both local file + localStorage exist, loader now selects the freshest payload by `last_tick_epoch_ms` (prevents stale file rollback).

## Validation (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (no runtime/page errors).
- `run_playwright_long.ps1`: PASS (no runtime/page errors).
- Custom starter+long simulation run (`output/web-game-background-check`): PASS.
  - State confirms autonomous progression over time (`enemies_defeated: 3`, `money: 125`) with no console error file generated.
