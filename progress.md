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

## Additional progress (full FRLG Kanto routes + top route nav)
- Reworked route data generation script (scripts_generate_kanto_routes_frlg.mjs):
  - Fixed Pokemon id parsing from PokeAPI encounter URLs.
  - Filtered encounters to keep only real FireRed/LeafGreen version details.
  - Kept level-weight distributions and encounter methods per species.
  - Generated all FRLG Kanto routes used in FRLG progression: Route 1..25.
  - Downloaded/updated FRLG route background images (assets/backgrounds/kanto_route_<n>_frlg.png) for 1..25.
- Replaced route UI panel with a top viewport route navigation bar:
  - Left/right arrow buttons to move across unlocked routes only.
  - Center label with current route and global route position.
  - Progress line showing unlock status toward next route.
- Implemented per-route unlock progression rule:
  - Save now stores route_defeat_counts by route id.
  - Defeats increment only for the currently active route.
  - Next route unlocks at 20 defeats on the current route.
  - Route 1 remains at 0.2 power multiplier (5x weaker than other routes at equal level).
- Kept route background selection bound to active route file data.

## Validation runs (this turn)
- node --check game.js: PASS.
- node --check scripts_generate_kanto_routes_frlg.mjs: PASS.
- Generator run (node scripts_generate_kanto_routes_frlg.mjs): PASS (25 routes generated, FRLG encounters populated).
- Playwright skill client run (output/web-game-routes): PASS after installing Playwright runtime/browser.
- Extra end-to-end route unlock/navigation validation (output/web-game-routes-validate): PASS.
  - Confirmed unlock after route-local progression reaches 20/20 on Route 1.
  - Confirmed kanto_route_2 gets added to unlocked_route_ids.
  - Confirmed right-arrow navigation switches active route to Route 2.

## TODO / notes
- Optional tuning: split encounter weighting by encounter method if future gameplay should only use specific methods (walk/surf/fishing) instead of merged route pools.

## Additional progress (origin-independent saves in AppData\Roaming\PokeIdle)
- Added a local save bridge server (`save_bridge_server.mjs`):
  - Storage target is now `%APPDATA%\PokeIdle\save_main.json` (fallback to `~/AppData/Roaming/PokeIdle` if needed).
  - Added endpoints: `GET /health`, `GET /save`, `POST /save`, `DELETE /save`.
  - Added atomic disk writes (`.tmp` + rename).
  - Added permissive CORS headers so any local game origin/port can access the same save.
- Integrated bridge backend in `game.js` save flow:
  - Loader now reads bridge + local file handle + localStorage, picks freshest by `last_tick_epoch_ms`.
  - Persister writes to localStorage mirror + bridge (and file handle when linked).
  - Save backend indicator now shows `AppData\Roaming\PokeIdle` when bridge is reachable.
  - Text-state export now exposes `save_backend: "appdata_roaming"` when bridge is active.
- Added launcher `run_local_game_with_save.ps1`:
  - Starts save bridge + web server together.
  - Waits for `GET /health` before launching the game server.
- Validation:
  - `node --check game.js`: PASS.
  - `node --check save_bridge_server.mjs`: PASS.
  - Playwright skill run with bridge active (`output/web-game-save-bridge`): PASS, `save_backend` reports `appdata_roaming`.

## Additional progress (menu Boites + remplacement de team)
- Added a new `Boites` modal UI:
  - Full-screen overlay with:
    - header + close button
    - large scrollable grid of captured entity species (one card per Pokemon id/entity)
    - right-side info panel with detailed hovered entity data
  - Cards show sprite/name/level/capture count and availability tag.
- Added replacement workflow from team slot click:
  - Clicking a Pokemon on canvas now opens `Boites` for that specific team slot.
  - Selecting a card replaces only that target slot in `saveData.team`.
  - Team sync + persistence + HUD/render refresh are triggered immediately.
- Enforced duplicate prevention in team replacement:
  - Any species already present in another team slot is disabled in `Boites`.
  - Click handler still double-checks and blocks duplicates defensively.
- Added hover/info behavior for box cards:
  - Mouse hover/focus on card updates side panel with:
    - level, xp, defensive/offensive types
    - computed stats line + BST
    - encounter/defeat/capture counters normal/shiny
- Added modal controls:
  - close button
  - click on dark overlay to close
  - `Escape` key to close
  - canvas hover popup is suppressed while `Boites` is open
- Added text-state outputs for automation/debug:
  - `boxes_open`
  - `boxes_target_slot_index`
  - `boxes_entity_count`

## Validation runs (Boites turn)
- `node --check game.js`: PASS.
- Playwright skill client run (`output/web-game-boxes-final`): PASS.
  - States confirm `boxes_open: true` and populated `boxes_entity_count`.
  - No `errors-*.json` generated.
- Full-page visual screenshots captured and reviewed:
  - `output/boxes_full_current.png` confirms modal layout, grid, disabled duplicate cards, and info panel rendering.

## Additional progress (global UI redesign + full responsive viewport)
- Reworked page layout architecture to keep all controls fully inside the viewport:
  - New shell structure in `index.html`: `ui-topbar` + `app-shell` + `action-dock`.
  - Route navigation, resources, and action buttons are now embedded in-frame (no drifting fixed corner stacks).
  - Canvas is wrapped in `#game-stage` and now scales from available shell space.
- Updated `resizeCanvas()` to use `#game-stage` dimensions instead of `window.innerWidth/innerHeight`:
  - Better deterministic fit in desktop + mobile orientations.
  - Preserves rendering quality and internal coordinate mapping.
- Complete style system refresh in `styles.css` with a cohesive Pokemon-inspired direction:
  - Green/teal/gold palette, panel framing, stronger HUD hierarchy, icon chips/buttons.
  - Improved spacing and visual rhythm across route nav, resources, canvas frame, and action dock.
  - Shop and box modals restyled to match the same art direction.
- Mobile-first responsiveness improvements:
  - Topbar and resource pills compress cleanly.
  - Action dock remains touch-friendly with larger tap targets.
  - Shop panel remains fully visible and usable on phone.
  - Boxes modal remains usable/readable on narrow screens.

## Validation runs (UI redesign turn)
- `node --check game.js`: PASS.
- Playwright skill run (`output/web-game-ui-refresh`): PASS, no `errors-*.json`.
- Manual full-page visual validation (desktop + mobile):
  - `output/ui_desktop_main.png`
  - `output/ui_desktop_shop.png`
  - `output/ui_desktop_boxes.png`
  - `output/ui_mobile_main_v2.png`
  - `output/ui_mobile_shop_v2.png`
  - `output/ui_mobile_boxes_v2.png`
- Mobile text-state confirms larger playable canvas region after layout compression:
  - `output/ui_mobile_state_v2.json` reports `viewport.height: 442` (previously smaller in prior layout).

## Additional progress (save UX clarity for Firefox vs AppData bridge)
- Confirmed AppData bridge persistence is working when bridge server runs:
  - During local run, `%APPDATA%\\PokeIdle\\save_main.json` `LastWriteTime` changed after gameplay simulation.
- Clarified save backend indicator when bridge is not reachable:
  - now shows `localStorage (bridge off)` instead of ambiguous `localStorage`.
- Improved `Lier save locale` behavior for unsupported browsers (e.g., Firefox):
  - button is now disabled when File System Access API is unavailable.
  - tooltip and label now explain feature unavailability and that AppData bridge is the main save path.
  - unsupported click message now explicitly says Firefox does not support this specific feature.
- Added bridge-off guidance message on scene init (when gameplay started and bridge unavailable):
  - informs user to run `run_local_game_with_save.ps1` to persist into `AppData\\Roaming\\PokeIdle`.

## Additional progress (auto-evolution + evolution-capture entity rules)
- Implemented full evolution metadata parsing from Pokemon JSON:
  - `loadPokemonEntity` now carries `evolvesFrom` / `evolvesTo` with normalized method payloads.
- Implemented automatic evolution checks after team XP gains:
  - Evaluates level-up evolution methods (with supported constraints: min level, time-of-day, route/location token, party species, attack/defense relation).
  - Unsupported triggers/requirements (trade, items, happiness, known move, held item, etc.) are intentionally ignored for now.
- Evolution entity behavior implemented as requested:
  - On evolution, evolved species entity is unlocked at level 1.
  - Previous species entity is kept.
  - Team handling:
    - if team has room, evolved species is added;
    - else evolved species replaces the evolving species slot.
  - Team duplicate protection remains enforced.
- Added focused evolution overlay animation:
  - Foreground scene focus, white transformation phase, flash, reveal of evolved form.
  - Battle updates pause while evolution animation is active.
  - Added `evolution_animation` payload to `render_game_to_text` for validation.
- Implemented requested capture rule for first-time captures of evolved species:
  - First capture of an evolved species does **not** unlock that evolved entity.
  - If base/root species entity is not owned yet, base/root entity is granted instead.
- Adjusted entity ownership model to support "captured but not entity-owned":
  - `isEntityUnlocked` now respects explicit `entity_unlocked` when present.
  - Legacy fallback to captured count is kept only when field is absent.
- Added save compatibility reconciliation pass after defs load:
  - Fixes old records where base species were captured but left `entity_unlocked: false` from prior logic.
  - Keeps intentional first-evolved-capture suppression for single-capture evolved species.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- Playwright skill client run (`output/web-game-evolution-pass2`): PASS, no `errors-*.json`.
- Targeted forced save run (`output/web-game-evolution-forced2`): PASS.
  - Verified team includes both base + evolution simultaneously after evolution unlock in non-full team (`Bulbizarre` + `Herbizarre`).
  - Verified evolved entity appears in team at level progression while base entity remains present.
- Final regression pass (`output/web-game-evolution-finalcheck`): PASS, no runtime console/page errors.
- Visual review:
  - `output/web-game-evolution-finalcheck/shot-5.png`
  - `output/web-game-evolution-forced2/shot-0.png`

## Additional progress (subtle random background drift)
- Added route-aware background drift system:
  - slow, subtle random target offsets on X/Y
  - smooth ease-in-out interpolation between targets
  - short random hold between moves for natural back-and-forth feel
- Drift resets on route change so each route starts centered before moving.
- Background render now uses safe extra cover scaling to prevent visible edges while panning.
- Added `background_drift` (`x`, `y`) to `render_game_to_text` for deterministic validation.

## Validation runs (background drift turn)
- `node --check game.js`: PASS.
- Playwright capture set: `output/web-game-bg-drift`.
  - No `errors-*.json` generated.
  - State confirms drift offsets move over time (example: `background_drift: { x: 2.18, y: -4.52 }` in later frame).
- Visual spot-check screenshots:
  - `output/web-game-bg-drift/shot-1.png`
  - `output/web-game-bg-drift/shot-4.png`

## Additional progress (sprite variants 1-493 + appearance shop + shiny visuals)
- Added full sprite-variant metadata consumption in runtime:
  - `loadPokemonEntity` now parses `sprite_variants` + `default_sprite_variant_id`.
  - Default in-game sprite for each species now follows the variant default (FRLG where available).
- Save schema bumped to `version: 5` with per-entity appearance config:
  - `appearance_owned_variants`
  - `appearance_selected_variant`
  - `appearance_shiny_mode`
- Added reconciliation/migration logic so old saves auto-receive valid appearance defaults.
- Implemented right-click appearance context menu on team Pokemon:
  - Left click on team still opens Boites.
  - Right click opens new Appearance modal for that slot species.
- Implemented appearance shop in modal:
  - Non-shiny variant cards only.
  - Owned variants are selectable.
  - Locked variants are darkened with `?` and purchasable.
  - Purchase spends Poke$, unlocks variant, and equips it.
- Implemented shiny appearance unlock rule:
  - Shiny mode toggle is disabled until species has at least one shiny capture.
  - Once unlocked, owned variants can be displayed in shiny mode when a shiny sprite exists.
- Added shiny visual particles around shiny renders (enemy + team shiny appearance mode).
- Updated shiny encounter odds to `1/1024`.
- Added new debug/text-state fields:
  - `appearance_open`
  - `appearance_target_slot_index`
  - `appearance_pokemon_id`
  - `appearance_selected_variant_id`
  - `appearance_shiny_mode`
  - per-entity `sprite_variant_id` + `shiny_visual` in `enemy`/`team`.
- Added/updated appearance modal styles in `styles.css` with responsive layout.

## Validation runs (appearance/sprite turn)
- `node --check game.js`: PASS.
- Playwright skill client (canvas loop) readiness regression:
  - `output/web-game-probe-ready-afterfix`: PASS (`mode: ready`, no `errors-*.json`).
- Playwright skill client right-click open:
  - `output/web-game-appearance-open-afterfix/state-1.json`: `appearance_open: true`, target slot + pokemon id populated.
- Full-page Playwright visual checks:
  - `output/appearance_fullpage.png`: appearance modal opens on right click.
  - `output/appearance_purchase_fullpage.png`: locked variant purchase + equip state visible.
- Full-page Playwright state assertions:
  - Right-click opening check: `before_mode: ready`, `after_appearance_open: true`.
  - Purchase check: selected variant changed `firered_leafgreen -> emerald`, money decreased.
  - Reload persistence check: selected variant remains `emerald` after page reload on same origin.

## Additional progress (Shop modal overhaul + tabs + item sprites)
- Replaced the old compact Shop popover with a centered modal window (`#shop-modal`) and tabbed categories:
  - `Poke Balls`
  - `Combats`
  - `Evolutions`
- Implemented tab-specific item grid rendering in `game.js`.
- Added Pokeball-family quantity purchases:
  - presets `x1`, `x5`, `x10`, `x50`, `x100`
  - `Custom` numeric amount input
- Added/updated ball economy and capture behavior:
  - PokeBall: 200, capture x1
  - SuperBall: 2500, capture x2 vs PokeBall
  - HyperBall: 15000, capture x2 vs SuperBall (x4 vs PokeBall)
  - Active capture ball can be equipped per ball type in shop.
- Added Combat item:
  - Boost X: 20000, attack interval multiplier 0.33 for 2 minutes.
- Added Evolution items:
  - Pierre Eau / Pierre Feu / Pierre Plante: 100000 each.
  - Can be bought then consumed from shop; usage only allowed when at least one compatible species can evolve and target evo entity is not already unlocked.
- Downloaded and wired item sprites under `assets/items/`:
  - `poke_ball.png`, `super_ball.png`, `hyper_ball.png`, `x_boost.png`, `water_stone.png`, `fire_stone.png`, `leaf_stone.png`.
- Added responsive modal styling in `styles.css` for tabs, quantity controls, and item cards.

## Validation runs (Shop turn)
- `node --check game.js`: PASS.
- Skill loop Playwright client run:
  - output dir: `output/web-game-shop-modal-2`
  - no `errors-*.json` generated.
  - state confirms `shop_open: true`, tab state export, and no runtime errors.
- Full-page UI validation via Playwright screenshots:
  - `output/shop-ui-verify/shop_pokeballs.png`
  - `output/shop-ui-verify/shop_combat.png`
  - `output/shop-ui-verify/shop_evolutions.png`
- Purchase behavior checks:
  - Pokeball x10 buy: money decreased by 2000 and `ball_inventory.poke_ball` increased by 10.
  - Custom quantity x7 buy: money decreased by 1400 and total pokeballs increased by 7.
  - Boost X activation: money decreased by 20000, `attack_interval_ms` switched from 500 to 165, boost timer active.

## Additional progress (juicy combat VFX + KO timer freeze)
- Added new combat feedback visuals and animation polish in `game.js`:
  - Slight viewport vignette overlay (`drawViewportVignette`) for more scene depth.
  - Projectile visuals upgraded with:
    - motion streaks,
    - glow trail particles,
    - pulse sizing,
    - stronger launch feel.
  - Attack launch particles added at attacker position (`addAttackLaunchEffects`) to improve impact/juice.
- Added requested sprite flash behavior:
  - Team attacker flash: color lerp toward white (blend up to `0.4`) for `0.15s` after attack.
  - Enemy hit flash: color lerp toward red (blend up to `0.4`) for `0.15s` when taking damage.
  - Implemented via `drawPokemonSprite` tint overlay + battle timers (`slotAttackFlash`, `enemyDamageFlashMs`).
- Improved attack simulation timing behavior on KO/respawn:
  - Attack interval progression is now fully paused while enemy is KO/capture/respawning.
  - `attackTimerMs` remains frozen until next enemy spawn.
- Added debug text-state fields for deterministic validation:
  - `attack_timer_ms`
  - `enemy_damage_flash_blend`
  - `team_attack_flash_blends`

## Validation runs (juicy/VFX turn)
- `node --check game.js`: PASS.
- Develop-web-game Playwright loop:
  - output dir: `output/web-game-juicy`
  - no `errors-*.json` generated.
- Targeted Playwright checks (forced frame stepping):
  - output dir: `output/web-game-juicy-targeted`
  - Captured flash visuals:
    - `team_attack_flash.png` with `team_attack_flash_blends[0] = 0.4`
    - `enemy_damage_flash.png` with `enemy_damage_flash_blend = 0.4`
  - KO freeze verification:
    - `ko_samples.json` confirms `attack_timer_ms` remains constant while `ko_transition.active = true` and `remaining_ms` decreases.
    - Example samples: pending `420 -> 359 -> 301 -> 237` while `attack_timer_ms` stayed `124`.

## Additional progress (money HUD juice + team XP bars + level-up particles)
- Added animated money gain feedback at HUD counter:
  - money gains now spawn a floating `+XXX` fade-up label near the money pill.
  - money counter now animates smoothly toward target value (juicy interpolation) instead of snapping.
  - added pulse/glow transform on positive money gain for stronger feedback.
- Added thin team XP bars under each team Pokemon sprite in battle:
  - blue progress bar showing current XP vs XP required to next level.
  - hidden automatically at level cap.
- Added level-up blue VFX:
  - ring burst + blue particles around the Pokemon slot that leveled up.
  - effects are queued from real level-up events (`awardCaptureXpToTeam`) and animated in scene update/render loops.
- Extended text-state for validation/debug:
  - `money_display_value`
  - `team_level_up_effects_active`
  - team entries now include `xp` and `xp_to_next`.

## Validation runs (money/xp turn)
- `node --check game.js`: PASS.
- Develop-web-game Playwright loop:
  - `output/web-game-money-xp`: PASS, no `errors-*.json`.
  - `output/web-game-money-xp-final2`: PASS, no `errors-*.json`.
- Targeted full-page validation:
  - `output/web-game-money-xp-targeted/money_gain_floater.png` confirms visible `+XXX` near money counter.
  - `output/web-game-money-xp-targeted/levelup_fx.png` confirms blue level-up VFX.
  - `summary.json` confirms both detections:
    - `gotMoneyFloater: true`
    - `gotLevelFx: true`.

## Additional progress (notification stack + manual evolutions)
- Replaced top-of-viewport transient message flow with bottom-right stacked notifications:
  - `setTopMessage(...)` now routes to temporary stack notifications.
  - Removed top-canvas banner render path entirely (`drawTopMessage` no longer used).
  - Notification lifecycle now updates every frame via `updateNotificationSystem()`.
  - Notification system reset is now called at scene initialization (`initializeScene`).
- Connected first-time species progress notifications:
  - `incrementSpeciesStat(...)` now tracks previous->next values and triggers first-time notifications when counters cross `0 -> >0` for supported categories (`encountered`, `captured`), including shiny variants.
- Evolution behavior changed to manual trigger via permanent notifications:
  - Capture XP no longer auto-evolves team members.
  - `awardCaptureXpToTeam(...)` now enqueues permanent `evolution_ready` notifications when a member meets evolution conditions.
  - Existing `Evoluer` action on permanent notification remains the trigger path for evolution animation + unlock/team placement.
- Updated text-state export fields:
  - `top_message` is always `null`.
  - Added `notifications_active`, `notifications_temporary`, `notifications_evolution_ready`.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- Playwright (`output/web-game-notif-check`): PASS.
  - No runtime crash during automated loop.
  - `top_message: null` confirmed in exported state.
  - Notification counters present and updating (`notifications_*`).

## Follow-up TODO (manual gameplay check)
- Verify in a live long session that when a Pokemon reaches evolution conditions:
  - a permanent bottom-right notification appears,
  - clicking `Evoluer` plays the evolution animation,
  - notification disappears,
  - no automatic evolution occurs before user click.

## Additional progress (zones FRLG + carte Kanto cliquable + stabilité des marqueurs)
- Added full Kanto story-zone flow beyond routes:
  - integrated towns (`zone_type: town`, `combat_enabled: false`) and dungeons/caves/forest/safari/mansion/tower (`zone_type: dungeon`) into main progression order.
  - progression now starts at `kanto_city_pallet_town` and follows a 47-zone FR/LG order in `ROUTE_ID_ORDER`.
- Added map UI and travel:
  - top-level `Map` action button in footer.
  - `#map-modal` overlay with Kanto map image and clickable zone markers.
  - unlocked markers are travelable, locked markers disabled.
- Added non-combat city behavior:
  - city zones do not spawn combat.
  - scene hides battle actors (team/enemy/projectiles) and shows a peaceful overlay.
  - entering a city auto-unlocks the next zone (`unlock_mode: visit`) so player can pass directly to next route/dungeon/city.
- Added FRLG zone data generation pipeline:
  - `scripts_generate_kanto_zones_frlg.mjs` now generates per-zone JSON with:
    - background image path
    - FR/LG encounter mapping from PokeAPI location/areas
    - unlock mode/target
    - map marker coordinates
  - generated catalog: `map_data/kanto_frlg_zones.json`.
  - generated per-zone data files under `map_data/kanto_city_*.json`, `map_data/kanto_dungeon_*.json`, `map_data/kanto_route_*.json`.
  - downloaded Kanto map asset and zone backgrounds from Bulbagarden.
- Fixed map marker click instability:
  - replaced marker `innerHTML` full rebuild with persistent marker button cache (`mapMarkerButtonsByRouteId`) updated in place.
  - prevents race/detach issues when HUD/route UI refreshes while map is open.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- develop-web-game client run (post-fix): PASS.
  - output: `output/web-game-zones-map-postfix`.
  - screenshots/state captured, no runtime crash.
- targeted map interaction smoke (custom Playwright script with local static server): PASS.
  - output: `output/zone_map_smoke`.
  - confirmed:
    - map opens (`map_open: true` during interaction),
    - unlocked marker click closes modal,
    - route changes correctly,
    - no console/page errors in summary.

## Remaining TODO ideas
- Optional: extend progression list with additional FRLG "pseudo-dungeon" interior checkpoints (e.g. Rocket Hideout/Silph Co/Sea Cottage) as non-combat narrative zones if desired.
- Optional: map marker labels/legend toggle for mobile readability when many zones are unlocked.

## Additional progress (meteo dynamique + cycle jour/nuit en heure locale)
- Added a deterministic environment system in `game.js` driven by real local device time (`Date.now()` + local `Date`):
  - Weather roll every 30 minutes with requested distribution:
    - `neutral` 40%
    - `sunny` 20%
    - `rainy` 20%
    - `foggy` 10%
    - `storm` 10%
  - Real local clock integration (`HH:MM`) for day/night simulation.
- Implemented smooth transitions and coherent blending:
  - Weather transition blend over 90s at each 30-minute slot boundary (`weather_from -> weather_to`).
  - Continuous day/night curve (no hard jumps) with twilight handling.
  - Combined blending of weather + time to keep visuals coherent for all pairs.
- Added ambiance rendering passes:
  - Background pass: time color grade (night/twilight/day), weather color grading, sunny dust, back fog.
  - Foreground pass: rain streak layers (rain/storm), front fog, deterministic lightning flashes (storm).
  - Vignette now adapts intensity based on night + storm weight.
- Added debug/state export fields (`render_game_to_text`):
  - `local_time`, `local_hour`, `local_minute`
  - `daylight_factor`, `night_factor`
  - `weather_current`, `weather_from`, `weather_to`
  - `weather_transition_blend`, `weather_weights`, `weather_lightning_intensity`

## Validation runs (weather/time turn)
- `node --check game.js`: PASS.
- develop-web-game Playwright client run:
  - output: `output/web-game-weather-time`
  - confirmed environment fields populated and no runtime crash.
- targeted combo visual validation (forced local times in browser for coverage):
  - output: `output/weather_combo_check`
  - validated screenshots + state for:
    - sunny day
    - rainy day
    - foggy night
    - storm night
    - neutral dawn
  - `summary.json` confirms expected weather/time states and `consoleErrors: []`.

## Additional progress (zones via CSV editable)
- Added a CSV-driven encounter data source for all zones:
  - new file path used at runtime: `map_data/kanto_zone_encounters.csv`.
  - loader fetches CSV with `cache: no-store` and cache-busting query param, so manual edits are picked up on page refresh.
- Implemented CSV parser + runtime merge in `game.js`:
  - parses rows into per-zone encounter lists.
  - if a zone exists in CSV, encounters for that zone are overridden by CSV (source of truth).
  - JSON zone files are still used for non-encounter metadata (background, unlock mode, map marker, combat flag, etc.).
  - fallback to JSON encounters only when a zone has no CSV entry.
- Added generation script for full-zone CSV export:
  - `scripts_export_zone_encounters_csv.mjs`
  - exports all zones (routes/cities/dungeons) to `map_data/kanto_zone_encounters.csv`.
  - includes requested data columns: Pokemon, spawn frequency (`spawn_weight`), level range (`min_level`, `max_level`).
  - non-combat zones are still represented with empty encounter columns so all zones are present.
- Added debug text-state fields to confirm runtime source:
  - `route_encounters_source` (`csv` or `json`)
  - `zone_csv_loaded`
  - `current_route_encounter_count`
  - `current_route_encounter_preview` (top entries with weight and level range)

## Validation runs (CSV turn)
- `node --check game.js`: PASS.
- `node --check scripts_export_zone_encounters_csv.mjs`: PASS.
- CSV generation run:
  - `node scripts_export_zone_encounters_csv.mjs`
  - generated `map_data/kanto_zone_encounters.csv` (336 data rows).
- develop-web-game Playwright run:
  - output: `output/web-game-zone-csv`
  - state confirms `route_encounters_source: "csv"` and preview values loaded from CSV.
- End-to-end editable CSV proof:
  - temporarily patched Route 1 Pidgey row in CSV (`spawn_weight=777`, `min=max=9`), loaded game, navigated to Route 1.
  - state confirmed override active from CSV (`has_pidgey_override: true`).
  - CSV restored afterward.
  - proof artifact: `output/csv_runtime_verify.json`.

## Additional progress (blocage menu clic droit navigateur)
- Added a global page-level context menu blocker in `game.js`:
  - `document.addEventListener("contextmenu", ..., { capture: true })` with `preventDefault()`.
- Result:
  - browser/Windows right-click menu no longer opens on this page,
  - custom in-game right-click handlers (e.g. Pokemon appearance on canvas) stay active.

## Validation
- `node --check game.js`: PASS.

## Additional progress (repo hygiene + portable validation scripts)
- Added a root `.gitignore` tuned for this project:
  - ignores OS/editor junk, logs, local env files, `node_modules`, and generated run/test artifact folders (`output`, `playwright-report`, `test-results`).
  - keeps game source/data/assets tracked (no gameplay data paths ignored).
- Fixed broken hardcoded machine paths in Playwright helper scripts:
  - `run_playwright_check.ps1`
  - `run_playwright_long.ps1`
  - `run_playwright_projectile.ps1`
  - `run_playwright_ko.ps1`
- Scripts are now portable:
  - use `$PSScriptRoot` as working directory,
  - resolve skill client/actions from `$CODEX_HOME` (fallback `~/.codex`),
  - include explicit missing-file guards.

## Validation runs (this turn)
- Syntax checks:
  - `node --check game.js`: PASS.
  - `node --check save_bridge_server.mjs`: PASS.
  - `node --check scripts_generate_kanto_routes_frlg.mjs`: PASS.
  - `node --check scripts_generate_kanto_zones_frlg.mjs`: PASS.
  - `node --check scripts_export_zone_encounters_csv.mjs`: PASS.
- Playwright runs via skill client:
  - smoke scenarios: `output/web-game-smoke*` (shop/map/route interactions covered), no new `errors-*.json`.
- Full-page UI verification (not canvas-only):
  - screenshots: `output/fullpage_verify/home.png`, `shop.png`, `map.png`, `route-next.png`.
  - summary: `output/fullpage_verify/summary.json` with `errors: []`.
- Portable script verification:
  - `./run_playwright_check.ps1`: PASS.
  - `./run_playwright_long.ps1`: PASS.
  - `./run_playwright_projectile.ps1`: PASS.
  - `./run_playwright_ko.ps1`: PASS (one transient legacy `errors-4.json` entry observed in old output folder, not reproduced in dedicated network-error probe).
- Dedicated network/console probe:
  - `output/ko_error_probe.json` => no console errors, no HTTP>=400 responses.

## Save backend spot-check
- Confirmed AppData save file exists and updates at:
  - `%APPDATA%\PokeIdle\save_main.json`
- Last write timestamp observed updated during test run.

## Additional progress (breathing pulse animation for field Pokemon)
- Added a new breathing animation layer for all on-field Pokemon (enemy + allies):
  - subtle looping pulse with deterministic per-Pokemon variation (phase/period/amplitude) so units do not breathe in sync,
  - realistic asymmetric inhale/exhale curve,
  - gentle vertical lift on inhale,
  - width/height compensation to keep sprite mass believable.
- Integrated breathing with existing animation stack:
  - enemy breathing auto-disabled during KO shrink and capture sequences,
  - ally breathing composes with recoil/attack flash without breaking timing,
  - added `scaleX/scaleY/offsetY` support to `drawPokemonSprite` for layered motion.

## Validation runs (breathing turn)
- `node --check game.js`: PASS.
- Playwright visual run: `output/web-game-breathing`.
  - reviewed `shot-1.png`, `shot-3.png`, `shot-5.png`.
  - no `errors-*.json` generated in this run.

## Additional progress (slight background blur)
- Added a subtle global blur for route background images in canvas render path.
- Implemented as a dedicated constant (`BACKGROUND_BLUR_PX = 1.2`) and applied only when drawing `state.backgroundImage`, so Pokemon/UI/effects remain crisp.
- Blur composes with existing background drift and weather layers.

## Validation (background blur turn)
- `node --check game.js`: PASS.
- Playwright visual pass: `output/web-game-bg-blur`.
  - Reviewed `shot-2.png` to confirm soft background while sprites/UI stay sharp.
  - No `errors-*.json` generated for this run.

## Additional progress (artistic background blur + Pokemon backplates + darker shadows)
- Upgraded background blur to a more artistic multi-pass treatment for route images:
  - primary blur+saturation pass,
  - soft bloom screen pass,
  - subtle radial veil for depth.
- Added white low-opacity full circles behind every on-field Pokemon (enemy + allies):
  - rendered early in combat render order so they stay behind projectiles/sprites/UI/effects.
  - slight pulse variation to blend with scene motion.
- Increased Pokemon ground shadow opacity for stronger readability/anchoring.

## Validation (this turn)
- `node --check game.js`: PASS.
- Playwright visual run: `output/web-game-art-bg-circles`.
  - reviewed `shot-1.png` and `shot-3.png`.
  - no `errors-*.json` generated.

## Additional progress (notif filtering + evolution flow strict via permanent notif)
- Reworked temporary notification policy to match requested gameplay scope:
  - removed generic per-spawn non-shiny notifications,
  - removed defeat-result notifications from KO resolution,
  - kept first-time normal encounter notifications,
  - kept first-time normal capture notifications,
  - kept first-time shiny capture notifications,
  - added shiny spawn notification on every shiny appearance until that species has been captured in shiny at least once.
- Evolution flow is now strictly manual via permanent `evolution_ready` notification + `Evoluer` button for all evolution sources:
  - added per-entity persisted item-condition state (`evolution_item_ready_targets`),
  - stone usage now marks condition ready and enqueues permanent evolution notification,
  - stone usage no longer triggers immediate evolution unlock/animation,
  - evolution application still occurs only in `triggerEvolutionFromNotification(...)`.
- Updated evolution-stone shop wording to reflect condition-ready behavior (no immediate evolution).

## Validation runs (this turn)
- `node --check game.js`: PASS.
- Playwright smoke run: `output/web-game-notif-evo-rules` (no `errors-*.json`).
- Targeted notification policy probe: `output/notif_defeat_policy_check.json`.
  - `enemies_defeated` increased during sample window,
  - temporary notifications stayed at 0 in that run,
  - no console/page errors.
- Targeted stone-flow probe: `output/evolution_stone_manual_flow_check.json`.
  - no runtime errors,
  - no automatic evolution animation observed in sampled interaction (`evolution_animation: null`).

## Additional progress (tint render bug fix: no more colored squares)
- Fixed sprite color-tint rendering so white/red/evolution tint affects only sprite pixels.
- Root cause: tinting was applied with `source-atop` directly on the main canvas, which could color full rectangular areas where scene alpha already existed.
- Implemented isolated tint pass using an offscreen sprite buffer:
  - draw sprite into buffer,
  - apply tint with `source-atop` inside buffer,
  - draw tinted buffer back to main canvas.
- Applied this path to both:
  - `drawPokemonSprite` (attack white flash / damage red flash / other sprite tints),
  - `drawEvolutionSpriteFrame` (white evolution phase).
- Fallback (no sprite image) tinting now uses shape-local tint instead of rectangular fill.

## Validation (tint fix turn)
- `node --check game.js`: PASS.
- Targeted Playwright probe: `output/tint_fix_verify`.
  - summary: `attackBlendSeen: 0.379`, `damageBlendSeen: 0.283`.
  - screenshots captured for both moments.
  - no console/page errors.

## Additional progress (performance fix: removed expensive artistic background blur)
- Removed the full-frame artistic blur/bloom background passes that were causing heavy runtime cost.
- Restored fast background rendering path for route images:
  - single image draw with pixel-art smoothing settings,
  - no `ctx.filter` blur pass,
  - no extra bloom/veil compositing.
- Removed now-unused artistic blur constants.

## Validation (perf hotfix turn)
- `node --check game.js`: PASS.
- Playwright sanity run: `output/web-game-no-art-blur`.
  - no `errors-*.json` generated.
  - visual render normal and stable (`shot-2.png`).
- Ajustement backdrop Pokemon: cercle blanc fixe avec alpha 0.5, sans pulse, sans follow du breath/recoil d'attaque. Vérifié via run Playwright (output/web-game-static-circle-check, shots 1..5), aucun errors-*.json.
- Perf pass: ajoute qualite de rendu adaptative (high/medium/low) selon frame-time, cap DPR dynamique (max 1.35/1.2/1.0), allege les effets couteux (trail/aura projectiles, glow impacts, particules meteo/niveau), et reduit les allocations de trail projectile (compaction in-place). Verification: node --check OK, run Playwright dedie output/web-game-perf-opt OK sans errors-*.json.
- Shop fix: suppression du rerender continu du shop dans updateHud (le clic etait casse car le DOM de la modale etait reconstruit en boucle), refonte UI shop (cartes avec layout media/content/footer, boutons regroupes, wraps/ellipsis anti-overflow, grille plus large, responsive mobile). Validation auto: clic achat Pokeball => money -200 et stock +1 (script output/tmp_shop_verify.js), screenshots output/shop-ui-open.png + output/shop-ui-open-mobile.png.
- Shop interaction stability: suppression de la fermeture implicite via listener document global (la fermeture se fait uniquement via backdrop/fermer/ESC), ce qui evite la fermeture apres achat lorsque la carte est rerendue.
- Perf controller v2: ajout d'un systeme multi-profils (very_low..ultra) cible 60fps, adaptation basee sur EMA frame+CPU (downgrade rapide, upgrade lent), backlog foreground limite, budget simulation foreground dynamique selon qualite, update HUD auto-throttle, environnement throttle, resolution interne dynamique (renderScale) dans resizeCanvas. Ajout telemetrie perf dans render_game_to_text (render_quality/frame_ms/fps_estimate).
