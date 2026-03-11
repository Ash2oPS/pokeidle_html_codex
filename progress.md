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
  - Starter modal appears with Bulbizarre / SalamÃ¨che / Carapuce, all level 5.
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

## Additional progress (semver alpha + UI badge)
- Added a dedicated `version.js` bootstrap with the current app version set to `0.1.0-alpha.0`.
- Added a discreet in-game version badge rendered directly inside the canvas at bottom-left.
- Exposed the current app version in `window.POKEIDLE_APP_VERSION` and `render_game_to_text`.
- Added `scripts/bump-version.mjs` to increment semver automatically:
  - increments prerelease counters when a prerelease exists (`alpha.0` -> `alpha.1`);
  - increments patch when the version is stable.
- Added `.github/workflows/bump-version-on-main.yml`:
  - triggers on every push to `main`;
  - bumps `version.js`;
  - commits the new version back with the GitHub Actions bot;
  - avoids infinite loops by skipping bot-triggered reruns.
- Validation:
  - `node --check game.js`: PASS.
  - `node --check scripts/bump-version.mjs`: PASS.
  - temp bump simulation on `version.js`: PASS (`0.1.0-alpha.0` -> `0.1.0-alpha.1`).
  - Playwright screenshot check: PASS for version visibility in `output/web-game-poke/shot-2.png`.
  - `render_game_to_text`: PASS (`app_version: "0.1.0-alpha.0"` present).
  - Confirmed starter pick -> combat starts on Route 1 species.
- Hover interaction run (`output/web-game-hover`): PASS.
  - `hover_popup_visible: true` observed in text state when mouse is over enemy.
- Long capture run (`output/web-game-longcapture`): PASS.
  - Confirmed enemy defeats, auto-captures, team growth, and attacker rotation with new members.

## Remaining TODO ideas
- Add explicit Pokeball projectile animation (current auto-catch is state/message-driven).
- Add a visible save-reset button for easier test/debug loops.

## Additional progress (team sprite flip + type badges)
- Added official Pokemon type icons from Bulbagarden Archives Scarlet/Violet set in `assets/type-icons/`.
  - Source manifest added in `assets/type-icons/SOURCES.md`.
- Updated battle rendering in `game.js`:
  - Team slots 3, 4, and 5 now flip sprites on the X axis (bottom + two left slots).
  - Added offensive type icon badges above each allied Pokemon.
  - Added matchup pill on the opposite top side showing the offensive multiplier and the enemy defensive type icons.
  - Exported debug text-state fields for slot index, sprite flip, and computed type multiplier vs enemy.
- Validation:
  - `node --check game.js`: PASS.
  - Develop-web-game client smoke run: `output/type-overlay-check` and `output/type-overlay-route1-check`.
  - Manual Playwright combat captures: `output/type-overlay-manual-clear/combat.png` and `output/type-overlay-fullteam/combat.png`.
  - Full-team validation confirmed icon placement and sprite flips on top/right/bottom/left slots.
  - No console/page errors in the targeted Playwright combat runs.

## Additional progress (hover reaction + contextual team menu)
- Detached allied Pokemon UI from sprite motion in `game.js`:
  - names, XP bars, offensive type icons, and matchup pills are now anchored to the static team slots;
  - sprite breath/recoil/hover animation only affects the sprite itself.
- Kept type symbols unflipped while leaving slots 3/4/5 sprite mirroring active.
- Removed enemy defensive type icons from allied matchup pills; allied Pokemon now show only the multiplier text plus their own offensive icon.
- Fixed immediate skin application in the appearance editor:
  - selected/purchased skin assets are now loaded into the sprite cache before the team refresh;
  - the active team member updates as soon as the skin is selected, without waiting for the modal to close.
- Added hover affordance for clickable team members:
  - brighter ring/glow under the hovered ally;
  - slight lift/scale on the sprite only;
  - canvas cursor now switches to pointer on hover.
- Added a right-click context menu:
  - new DOM node in `index.html` for the menu;
  - new styling in `styles.css`;
  - menu actions in `game.js`: `Echanger avec la boite` and `Changer l'apparence`;
  - left click still directly opens the boxes modal as before.
- Expanded `render_game_to_text` with:
  - `hovered_team_slot_index`
  - `team_context_menu_open`
  - `team_context_menu_slot_index`
- Validation:
  - `node --check game.js`: PASS.
  - Develop-web-game client smoke run: `output/type-hover-context-smoke`.
  - Manual Playwright hover/context verification: `output/type-hover-context-check/hover.png` and `output/type-hover-context-check/context.png`.
  - Manual Playwright appearance verification: `output/appearance-apply-immediate/after-select.state.json` and `output/appearance-apply-immediate/after-select.png`.
  - Confirmed `appearance_selected_variant_id: "emerald"` and `team[0].sprite_variant_id: "emerald"` while the appearance modal remained open.
  - Verified `hover_popup_visible: true` with `hovered_team_slot_index: 4`.
  - Verified `team_context_menu_open: true` with `team_context_menu_slot_index: 4`.
  - No console/page errors in the targeted hover/context runs.

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

## Additional progress (zones FRLG + carte Kanto cliquable + stabilitÃ© des marqueurs)
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
- Ajustement backdrop Pokemon: cercle blanc fixe avec alpha 0.5, sans pulse, sans follow du breath/recoil d'attaque. VÃ©rifiÃ© via run Playwright (output/web-game-static-circle-check, shots 1..5), aucun errors-*.json.
- Perf pass: ajoute qualite de rendu adaptative (high/medium/low) selon frame-time, cap DPR dynamique (max 1.35/1.2/1.0), allege les effets couteux (trail/aura projectiles, glow impacts, particules meteo/niveau), et reduit les allocations de trail projectile (compaction in-place). Verification: node --check OK, run Playwright dedie output/web-game-perf-opt OK sans errors-*.json.
- Shop fix: suppression du rerender continu du shop dans updateHud (le clic etait casse car le DOM de la modale etait reconstruit en boucle), refonte UI shop (cartes avec layout media/content/footer, boutons regroupes, wraps/ellipsis anti-overflow, grille plus large, responsive mobile). Validation auto: clic achat Pokeball => money -200 et stock +1 (script output/tmp_shop_verify.js), screenshots output/shop-ui-open.png + output/shop-ui-open-mobile.png.
- Shop interaction stability: suppression de la fermeture implicite via listener document global (la fermeture se fait uniquement via backdrop/fermer/ESC), ce qui evite la fermeture apres achat lorsque la carte est rerendue.
- Perf controller v2: ajout d'un systeme multi-profils (very_low..ultra) cible 60fps, adaptation basee sur EMA frame+CPU (downgrade rapide, upgrade lent), backlog foreground limite, budget simulation foreground dynamique selon qualite, update HUD auto-throttle, environnement throttle, resolution interne dynamique (renderScale) dans resizeCanvas. Ajout telemetrie perf dans render_game_to_text (render_quality/frame_ms/fps_estimate).

## Additional progress (Android sprite distortion fix)
- Fixed a Chrome Android visual distortion path for Pokemon sprites by tightening canvas/sprite rendering:
  - Prevented sub-1x canvas upscale in `resizeCanvas()` by clamping effective render DPR to at least `1` and using rounded internal dimensions.
  - Kept sprite pulse animation uniform (same `scaleX/scaleY`) to avoid aspect-ratio warping artifacts.
  - Added sprite pixel snapping helpers (`snapSpriteValue`, `snapSpriteDimension`) and applied them to sprite image draw coordinates/sizes.
  - Added `image-rendering: pixelated` fallback styling on `#game-canvas`.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS (no script failure).
  - Pixel 7 Playwright mobile capture before/after generated in `output/mobile-android-before.png` and `output/mobile-android-after.png`.
  - Post-fix metrics: `canvasInternal` == `canvasClient` (`398x564`), overflow `0`.

## Additional progress (tutorial popups + appearance unlock gate)
- Added the tutorial modal markup in `index.html` and responsive popup styling in `styles.css`.
- Wired tutorial modal controls in `game.js` (`Precedent`, `Suivant`, `Fermer`, backdrop close).
- Fresh save polish:
  - Route 1 tutorial now opens on the first visit to Route 1 after the starter is chosen.
  - `render_game_to_text` now exposes `tutorial_open`, tutorial flow/page info, and `appearance_editor_unlocked` for automation/debug.
- The existing level-10 appearance gate in `game.js` remains enforced before opening the skin editor via right click.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS (no `errors-*.json` in `output/web-game-poke`).
  - Custom Playwright validation: PASS for all three scenarios.
    - Route 1 first-visit tutorial + right-click blocked before level 10.
    - Level-10 appearance tutorial + right-click opens appearance editor after unlock.
    - First evolution tutorial after clicking `Evoluer`.
  - Screenshots written to `output/tutorial-validation/route1-tutorial.png`, `output/tutorial-validation/appearance-tutorial.png`, `output/tutorial-validation/appearance-modal-open.png`, and `output/tutorial-validation/evolution-tutorial.png`.

## Additional progress (combat timer / streak unlocks)
- Added a per-enemy route timer in `game.js` for defeat-based zone unlocks:
  - default duration `20s` via `ROUTE_DEFEAT_TIMER_MS`,
  - active only while the next zone is still locked,
  - stopped during KO/capture respawn windows,
  - reset on each new enemy spawn.
- Route unlock progress now behaves like a streak while the timer is active:
  - the route progress label shows `KO d'affilee`,
  - if the timer expires, the current route's defeat counter is reset to `0`,
  - once the next route is unlocked, the timer is disabled for subsequent enemies in that zone.
- Added a thin threatening timer bar at the top of the canvas and exported its state in `render_game_to_text`:
  - `route_defeat_timer_active`
  - `route_defeat_timer_running`
  - `route_defeat_timer_duration_ms`
  - `route_defeat_timer_remaining_ms`
  - `route_defeat_timer_ratio`
- Updated Route 1 tutorial copy so zone progression now mentions the `20 secondes max par combat` rule.

## Validation (combat timer turn)
- `node --check game.js`: PASS.
- `develop-web-game` client smoke: PASS for startup + starter choice (`output/web-game-timer-smoke`).
  - This run also confirmed the game stayed in Bourg Palette until explicit route navigation, so a targeted route probe was needed.
- Targeted Playwright route probe: partial PASS.
  - Confirmed Route 1 enters combat with `route_defeat_timer_active: true`, `route_defeat_timer_duration_ms: 20000`, and a live enemy (`output/playwright/timer-check/timer-start.json`).
  - Visually confirmed the new top timer bar is present in `output/playwright/timer-check/timer-start.png`.
- Additional timed probe confirmed the timer decreases over time and resets on enemy replacement in Route 1.
- Remaining gap:
  - I did not get a clean deterministic end-to-end artifact for the exact `timer reaches 0 -> streak reset -> next enemy spawns` branch because the automated save/reload setup for a forced timeout scenario was flaky during this turn. The branch is implemented in `PokemonBattleManager.expireEnemyFromTimer()` + `handleEnemyTimerExpired(...)`, but a future pass could still add a dedicated deterministic automation for that exact case.

## Additional progress (evolution tutorial timing + non-blocking evolution animation)
- Evolution tutorial timing:
  - moved the first `Tuto Evolution` trigger to the moment the first `evolution_ready` notification appears,
  - removed the old trigger that fired only after clicking `Evoluer`.
- Evolution flow:
  - evolution animations no longer pause combat simulation,
  - combat continues updating in the background while the evolution overlay is active.
- Evolution visuals:
  - increased evolution animation duration to `2480ms`,
  - extended the white/flash/reveal phases,
  - added lightweight orbiting particles around the evolution overlay,
  - slightly reduced overlay darkness so ongoing combat remains readable behind it.

## Validation (evolution flow turn)
- `node --check game.js`: PASS.
- Global smoke: `run_playwright_check.ps1` PASS after the evolution changes.
- Targeted pre-seeded Playwright probe: PASS (`output/evolution-flow-check`).
  - tutorial opens before evolution with `tutorial_flow_id: evolution_intro` while `notifications_evolution_ready: 1`,
  - clicking `Evoluer` starts an animation with `total_ms: 2480`,
  - combat keeps running during the animation:
    - probe snapshot `s0`: enemy `Rattata`, `attack_timer_ms: 241`, `evo_elapsed: 47`,
    - probe snapshot `s1`: enemy already changed to `Roucool`, `attack_timer_ms: 15`, `evo_elapsed: 690`,
    - probe snapshot `s2`: same fight progressed further (`enemy_hp` changed again), `evo_elapsed: 1317`.
  - artifacts:
    - `output/evolution-flow-check/result.json`
    - `output/evolution-flow-check/combat-during-evolution.json`
    - `output/evolution-flow-check/tutorial-before-evolve.png`
    - `output/evolution-flow-check/evolution-start.png`
    - `output/evolution-flow-check/evolution-mid.png`

## Additional progress (Pokeball consumption fix + shop gating)
- Fixed the infinite Pokeball reuse bug in `game.js`:
  - Root cause: `ensureMoneyAndItems()` was repeatedly re-importing the legacy `pokeballs` counter back into `ball_inventory` whenever the normalized inventory hit `0`.
  - Fix: legacy backfill now only happens for truly old/malformed saves that do not already have a structured `ball_inventory`.
  - Added `computeBallInventoryTotal(...)` and used it for direct counter sync after add/consume operations so the total no longer loops back through the legacy migration path.
- Temporarily locked advanced balls in the shop:
  - `SuperBall` and `HyperBall` now display `Bientot disponible`.
  - Their primary shop buttons are disabled.
  - The classic `PokeBall` stays purchasable as usual.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Real-flow Playwright validation: PASS.
    - Fresh game with SalamÃ¨che -> first visit Route 1 -> earn money naturally in combat.
    - Shop shows `SuperBall` / `HyperBall` as `Bientot disponible` and disabled.
    - Bought 1 classic `PokeBall`, then confirmed it was consumed down to `0` and stayed at `0`.
  - Artifacts written to:
    - `output/pokeball-fix-validation/real-flow-route1-start.json`
    - `output/pokeball-fix-validation/real-flow-money-ready.json`
    - `output/pokeball-fix-validation/real-flow-after-buy.json`
    - `output/pokeball-fix-validation/real-flow-after-consume.json`
    - `output/pokeball-fix-validation/real-flow-stable-zero.json`

## Additional progress (XP on KO kept + text-only XP feedback)
- Kept XP rewards on enemy KO without capture:
  - the KO branch in `handleEnemyDefeated(...)` still grants team XP via `awardCaptureXpToTeam(...)`,
  - this preserves progression even when no capture happens.
- Restored only the dynamic XP amount text in `game.js`:
  - floating `+XP` text is visible again on regular XP gains,
  - no sprite scale pulse on XP gain,
  - no XP particles,
  - level-up effects remain untouched.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Targeted Route 1 Playwright check: PASS (`output/xp-text-only-validation/after-first-xp-text.json`).
    - After the first KO, XP is still awarded and `team_xp_gain_effects_active` becomes positive from the restored floating text.

## Additional progress (CSV runtime for Pokeballs + shop items)
- Added two editable CSV sources:
  - `item_data/pokeballs.csv`
  - `item_data/shop_items.csv`
- Wired runtime loading with fallback-to-code defaults:
  - Pokeballs now load `price`, `capture_multiplier`, `coming_soon`, text/labels, sprite path, and order from CSV.
  - Shop items now load `price`, text/labels, sprite path, ordering, stock-tracking, and effect metadata from CSV.
- Connected CSV values to actual gameplay/shop logic:
  - capture multiplier uses CSV via `getBallCaptureMultiplier(...)`,
  - Pokeball shop cards/prices/coming-soon state use CSV-backed config,
  - `Boost X` duration and attack interval multiplier now use CSV-backed effect values,
  - evolution stone prices/names/method tokens now use CSV-backed config,
  - save inventory normalization now derives keys from loaded ball/item configs instead of hardcoded IDs.
- Added debug export fields in `render_game_to_text`:
  - `ball_csv_loaded`
  - `shop_items_csv_loaded`
  - `ball_configs`
  - `shop_item_configs`

## Validation (CSV shop turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual review:
  - reviewed `output/web-game-poke/shot-1.png` after the CSV runtime changes.
- Runtime proof with temporary CSV edits:
  - temporarily changed `super_ball` (`price=7777`, `capture_multiplier=3.5`) and `x_boost` (`price=54321`, `effect_value=0.5`, `effect_duration_ms=45000`),
  - reloaded the game and confirmed `render_game_to_text` reflected those values live,
  - proof artifact saved to `output/csv_shop_runtime_verify.json`,
  - CSV files were then restored to their original values.
- Restored-state verification:
  - `output/web-game-poke/state-1.json` shows the normal values again (`SuperBall=2500/2`, `Boost X=20000/0.33/120000`).
- Note:
  - one smoke run produced a transient `Failed to load resource: net::ERR_CONNECTION_REFUSED` artifact at shutdown in `output/web-game-poke/errors-1.json`; the page state/screenshots were otherwise correct, and the same behavior matches the helper script's server shutdown timing rather than a game runtime crash.

## Additional progress (long-session perf investigation + hot-loop cleanup)
- Investigated the reported â€œthe longer the game stays open, the more it lagsâ€ issue with targeted probes:
  - deterministic `advanceTime(...)` batches,
  - real-time long-open sampling,
  - Chromium CPU profile after warm-up.
- Main finding:
  - the worst hot-loop cost was not a classic memory leak but repeated UI/save housekeeping work in the foreground loop:
    - repeated `ensureMoneyAndItems()` normalization from hot getters,
    - repeated `normalizeBallInventory` / `normalizeShopItemsInventory`,
    - repeated device-capability checks (`matchMedia` etc.) for auto render-quality cap,
    - avoidable DOM text rewrites in HUD fields.
- Applied fixes in `game.js`:
  - added cached economy normalization keyed by current save ref + config revisions, so repeated `ensureMoneyAndItems()` calls fast-return when nothing changed,
  - cached ordered route ids instead of rebuilding them repeatedly from the catalog,
  - cached automatic render-quality cap and refreshed it on resize instead of recomputing capability/media-query checks in the frame loop,
  - reduced passive HUD refresh cadence from `120ms` to `200ms`,
  - skipped redundant DOM writes for money/save/pokeball HUD values when text/title is unchanged.

## Validation (perf hot-loop fix)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Warmed-up Chromium CPU profile before/after:
  - before: `ensureMoneyAndItems`, `normalizeBallInventory`, `normalizeShopItemsInventory`, `getMaxAutomaticRenderQualityRank`, `updateHud` were all visible in the hot path,
  - after: those save/config normalization costs dropped out of the top offenders; profile is now dominated by normal render work (`drawBackground`, sprite/UI draw calls).
  - artifacts:
    - before: `output/cpu-profile/summary.json`
    - after: `output/cpu-profile-after/summary.json`
- Targeted gameplay validation after fix:
  - fresh save -> starter pick -> Route 1 -> combat runs,
  - `enemies_defeated: 1`,
  - `fps_estimate: 60`,
  - no console/page errors.
  - artifacts:
    - `output/perf-fix-validation/result.json`
    - `output/perf-fix-validation/final.png`
- Real-time combat long-open probe after the fix:
  - fresh save -> starter -> Route 1 -> 60s sampled combat session,
  - `fps_estimate` stayed at `60` across all samples,
  - `cpu_frame_ms_estimate` stayed in a stable single-digit / low-teens range,
  - artifact: `output/perf-combat-realtime-after/probe.json`

## Follow-up note
- I did not prove a true ever-growing heap leak in the current code path; the strongest confirmed issue was repeated hot-loop housekeeping/DOM churn that makes long sessions more expensive than necessary. If users still report degradation after this fix, the next profiling pass should focus on render-path costs under richer saves/teams/effects on real mobile hardware.

## Additional progress (save architecture simplification + backups)
- Removed the browser-linked local JSON save flow from the UI and runtime:
  - dropped the `Lier save locale` button,
  - removed File System Access API + IndexedDB handle persistence code from `game.js`,
  - save backend is now intentionally simple: `AppData\\Roaming\\PokeIdle` bridge first, `localStorage` as browser fallback.
- Simplified save loading and persistence:
  - `loadSaveData()` now arbitrates only between bridge save and `localStorage`, still choosing the freshest payload via `last_tick_epoch_ms`,
  - startup no longer rewrites the bridge when the bridge copy is already the freshest save,
  - `persistSaveData()` still mirrors immediately to `localStorage`, but bridge writes are now coalesced so repeated save requests collapse to the latest payload instead of chaining a long backlog,
  - `render_game_to_text()` now reports only `appdata_roaming` or `local_storage`.
- Hardened `save_bridge_server.mjs`:
  - added `save_backup_1.json` .. `save_backup_3.json` rotation in `AppData\\Roaming\\PokeIdle`,
  - `GET /save` now falls back to the newest readable backup when `save_main.json` is missing or corrupted, and reports which file was used,
  - `DELETE /save` now clears both the main save and rotated backups.
- Validation:
  - `node --check game.js`: PASS.
  - `node --check save_bridge_server.mjs`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - visual review:
    - reviewed `output/web-game-poke/shot-2.png` after removing the browser-local save button.
    - reviewed `output/web-game-poke-bridge/shot-2.png` with the bridge enabled.
  - bridge backup smoke test on temporary `APPDATA`: PASS.
    - after corrupting `save_main.json`, `GET /save` restored from `save_backup_1.json`.
    - artifact: `output/save-bridge-smoke.json`.
  - browser + bridge integration smoke test on temporary `APPDATA`: PASS.
    - `render_game_to_text` reported `save_backend: "appdata_roaming"`.
    - artifact: `output/save-backend-with-bridge.json`.

## Additional progress (transparent sprite preference)
- Updated the sprite download pipeline to prefer a dedicated `transparent` variant before classic front sprites:
  - `scripts_download_gen1_4_sprites.py` now checks `sprites.other.home` first, then `sprites.other.official-artwork`.
  - When a transparent source exists, it downloads `*_transparent_front.png` / `*_transparent_front_shiny.png`, inserts a `transparent` entry in `sprite_variants`, and sets `default_sprite_variant_id` to `transparent`.
- Kept fallback behavior intact:
  - if no transparent source exists, classic version sprites remain available and the existing FRLG fallback still works.
- Updated runtime parsing in `game.js`:
  - sprite variants can now use `generation: 0` for non-generation-specific artwork,
  - default variant resolution now prefers `transparent` when present,
  - fallback-only variants no longer fake a generation label when they are generic/default assets.
- Updated `download_pokemon_data.py` for future full rebuilds so the base sprite download also prefers transparent artwork when available.
- Regenerated local Pokemon sprite metadata/assets:
  - `python scripts_download_gen1_4_sprites.py`: PASS.
  - 493 Pokemon JSON files updated.
  - 986 new transparent sprite files downloaded.
  - transparent variant available for all 493 local species in the current 1..493 dataset.

## Validation (transparent sprite turn)
- `python -m py_compile scripts_download_gen1_4_sprites.py download_pokemon_data.py`: PASS.
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS for startup/smoke.
  - One transient `output/web-game-poke/errors-2.json` contained `net::ERR_CONNECTION_REFUSED`; a targeted rerun below completed without errors, so this did not reproduce as a gameplay/runtime regression from the sprite change.
- Targeted Playwright route validation: PASS (`output/web-game-transparent-validate`).
  - Flow: starter selection -> Route 1 -> tutorial closed -> combat advanced.
  - `render_game_to_text` confirmed both Bulbizarre and Roucool were using `sprite_variant_id: "transparent"`.
  - Visual review of `output/web-game-transparent-validate/route1-battle.png` confirmed the new Pokemon renders do not show opaque white rectangular backgrounds.

## Additional progress (transparent-only sprite cleanup)
- Tightened `scripts_download_gen1_4_sprites.py` so it no longer keeps the old opaque variant files when a transparent source exists.
  - If `sprites.other.home` or `sprites.other.official-artwork` is available, only the `transparent` variant is kept in `sprite_variants`.
  - The sprite folder is now cleaned after each Pokemon update, removing any file not referenced by the retained variant(s).
- Regenerated the local sprite dataset with the cleanup rules:
  - `python scripts_download_gen1_4_sprites.py`: PASS.
  - `Obsolete sprite files removed: 7100`.
  - Dataset check confirms `remaining_non_transparent_sprite_files=0` under `pokemon_data/*/sprites`.
  - Example: `pokemon_data/1_bulbasaur/sprites` now contains only:
    - `1_bulbasaur_transparent_front.png`
    - `1_bulbasaur_transparent_front_shiny.png`

## Validation (transparent-only cleanup turn)
- `python -m py_compile scripts_download_gen1_4_sprites.py`: PASS.
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS after cleanup.
- Targeted Playwright route validation: PASS (`output/web-game-transparent-only-validate`).
  - Flow: starter selection -> Route 1 -> tutorial closed -> combat advanced.
  - `render_game_to_text` confirmed both team and enemy still use `sprite_variant_id: "transparent"`.
  - Visual review of `output/web-game-transparent-only-validate/route1-battle.png` confirmed combat renders correctly after deleting the old opaque sprite files.
- Note:
  - a recurring `console.error: Failed to load resource: net::ERR_CONNECTION_REFUSED` artifact still appears in some Playwright runs; this was already seen before and does not match a missing Pokemon sprite regression, since the game state and screenshots load correctly with the cleaned transparent-only asset set.

## Additional progress (restore all sprite variants on request)
- User clarified they want the full sprite collection back in each Pokemon folder, like before, not a transparent-only folder cleanup.
- Reverted the aggressive cleanup behavior in `scripts_download_gen1_4_sprites.py`:
  - transparent variants are still downloaded and kept first when available,
  - all historical variants (FRLG / Emerald / RS / HGSS / Platinum / etc.) are downloaded again alongside them,
  - no sprite file deletion is performed during refresh.
- Re-ran the full sprite refresh until the dataset was fully restored after the previous cleanup removed legacy variant files.

## Validation (restore all variants turn)
- `python -m py_compile scripts_download_gen1_4_sprites.py`: PASS.
- `node --check game.js`: PASS.
- Full sprite refresh rerun: PASS on second full pass after an initial timeout during restoration.
  - final run result:
    - `Pokemon JSON updated: 493`
    - `New sprite files downloaded: 1396`
    - `Species with transparent variant available: 493`
- Dataset checks after restoration:
  - `sprite_dir_count=493`
  - `incomplete_sprite_dirs=0`
  - `total_sprite_files=7100`
  - `non_transparent_sprite_files=6114`
- Example sanity check:
  - `pokemon_data/1_bulbasaur/sprites` again contains the historical sprite variants plus the transparent pair.
- `run_playwright_check.ps1`: PASS after restoring all variants.

## Additional progress (retro variants switched to transparent equivalents)
- User clarified the real issue was the retro variant files themselves:
  - `crystal`
  - `gold_silver`
  - `red_blue`
  - `yellow`
  - and missing `green`
- Updated `scripts_download_gen1_4_sprites.py` so those retro variants no longer use the opaque PokeAPI `front_default` files:
  - `crystal`, `gold_silver`, `red_blue`, and `yellow` now download transparent equivalents,
  - added a new `green` sprite variant for Gen 1,
  - retro variants are now sourced from Bulbagarden Archives redirect URLs (`Spr_1b_*`, `Spr_1g_*`, `Spr_1y_*`, `Spr_2c_*`, `Spr_2g_*`) because:
    - PokeAPI exposes transparent URLs for some retro variants but not all shiny/gen1 cases,
    - PokeAPI does not expose `green` at all in the Generation I sprite payload.
- Kept the rest of the sprite catalog intact:
  - modern/default `transparent` HOME variant remains the default sprite,
  - FRLG / Emerald / RS / HGSS / Platinum / DP variants are still preserved.
- Enabled overwrite for those retro target files so previously downloaded opaque PNGs are replaced in place by their transparent equivalents.

## Validation (retro transparent fix turn)
- `python -m py_compile scripts_download_gen1_4_sprites.py`: PASS.
- `node --check game.js`: PASS.
- Full sprite regeneration: PASS.
  - `Pokemon JSON updated: 493`
  - `New sprite files downloaded: 151`
- Spot checks on Bulbizarre confirm all targeted retro files now contain alpha:
  - `1_bulbasaur_crystal_front.png`
  - `1_bulbasaur_gold_silver_front.png`
  - `1_bulbasaur_gold_silver_front_shiny.png`
  - `1_bulbasaur_red_blue_front.png`
  - `1_bulbasaur_yellow_front.png`
  - `1_bulbasaur_green_front.png`
- Global transparency audit:
  - `retro_target_files=1457`
  - `retro_target_opaque_files=0`
- Variant coverage audit:
  - `json_with_green_variant=151`
  - `json_with_crystal_variant=251`
- `run_playwright_check.ps1`: PASS after the retro variant replacement.
- Note:
  - the recurring `console.error: Failed to load resource: net::ERR_CONNECTION_REFUSED` artifact still appears intermittently in Playwright smoke runs; it does not match a missing sprite regression, and the regenerated retro files load correctly on disk with non-zero transparency.

## Additional progress (enemy sprite mirrors team species appearance)
- Updated species appearance resolution so the selected sprite variant is shared by wild enemies of the same species.
- Added a dedicated enemy sync pass after team appearance changes:
  - the current enemy now refreshes immediately if its species matches a team species whose appearance was edited,
  - future encounters of that species reuse the selected variant too.
- Preserved shiny behavior requested by the user:
  - if the team appearance is set to shiny mode, normal wild enemies now use the matching non-shiny sprite for that variant,
  - shiny wild enemies still use the shiny equivalent when available.

## Validation (enemy sprite mirror turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright verification with seeded save + UI interaction: PASS.
  - Case 1: normal wild Roucool mirrored the selected `firered_leafgreen` variant immediately after changing the team member appearance in the UI.
  - Case 1: despite shiny mode being enabled on the team member, the normal wild Roucool stayed `shiny_visual: false`.
  - Case 2: shiny wild Roucool reused the same `firered_leafgreen` variant and stayed `shiny_visual: true`.
- Artifacts written to `output/verify-enemy-sprite-mirror/`:
  - `normal-after-ui-change.png`
  - `normal-after-ui-change.state.json`
  - `shiny-encounter.png`
  - `shiny-encounter.state.json`

## Additional progress (default sprite preference FRLG)
- Changed default Pokemon sprite selection to prefer `firered_leafgreen` first.
- Added an explicit fallback chain for species without FRLG assets:
  - `emerald`
  - `ruby_sapphire`
  - `heartgold_soulsilver`
  - `platinum`
  - `diamond_pearl`
  - `crystal`
  - `gold_silver`
  - `yellow`
  - `green`
  - `red_blue`
  - `transparent`
- Kept the generation script aligned with the runtime by updating `scripts_download_gen1_4_sprites.py` to use the same preference order for future sprite refreshes.
- Added a runtime safety net so a legacy `transparent` selection does not win over the new FRLG-first default when resolving an owned sprite for display.

## Validation (FRLG default turn)
- `node --check game.js`: PASS.
- Preference spot-check via JSON data: PASS.
  - `100_voltorb` resolves to `firered_leafgreen`.
  - `152_chikorita` resolves to `emerald`.
  - `387_turtwig` resolves to `heartgold_soulsilver`.
  - `transparent defaults after preference: 0`.
- `run_playwright_check.ps1`: PASS.
- Targeted starter Playwright run: PASS.
  - Artifact folder: `output/web-game-sprite-default/`
  - `state-2.json` reports Bulbizarre with `sprite_variant_id: "firered_leafgreen"`.

## TODO / Notes
- If we want to force-persist old local saves that still store `appearance_selected_variant: "transparent"`, add a dedicated one-shot migration/writeback path; the display preference is now FRLG-first, but the raw saved selection can still remain untouched in some seeded localStorage test setups.

## Additional progress (fullscreen gameplay + HUD refactor turn)
- Reworked the shell so the gameplay now fills the full viewport instead of sitting inside a centered framed panel.
- Moved the route header, resources, and action dock into a floating HUD overlay anchored directly on top of the game stage.
- Refreshed the HUD styling with darker translucent cards, stronger spacing, and clearer visual hierarchy for route info, currencies, and actions.
- Kept the existing interaction wiring intact by preserving the same control ids while changing placement and presentation.
- Updated the canvas resize path so the render surface uses the full available stage size.
- Updated the fullscreen toggle so `F` now requests fullscreen on the whole game stage, which keeps the HUD visible in fullscreen mode too.
- Tuned arena layout calculations with safe top/bottom/side bounds so the enemy ring has more breathing room under the floating HUD.

## Validation (fullscreen HUD turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
  - Canvas screenshots in `output/web-game-poke/` confirm the render surface now fills the resized stage.
- Full-page Playwright verification with starter modal: PASS.
  - Artifact: `output/full-ui-check.png`
- Full-page Playwright verification in Route 1 gameplay after starter selection and tutorial close: PASS.
  - Artifacts:
    - `output/full-ui-gameplay.png`
    - `output/full-ui-gameplay-clear.png`
- Visual check result:
  - gameplay covers the full page,
  - the top HUD and bottom dock stay readable as overlays,
  - fullscreen-ready layout keeps controls on-screen without reverting to the old boxed shell.

## Additional progress (fight progress bar visibility fix)
- Repositioned the route fight timer/progress bar so it uses the scene safe-top bound instead of the old fixed top-of-canvas offset.
- This keeps the bar visible below the floating top HUD in fullscreen gameplay layouts.

## Validation (fight progress bar visibility fix)
- `node --check game.js`: PASS.
- Vite + Playwright gameplay verification: PASS.
  - Artifact: `output/full-ui-gameplay-clear.png`
  - Result: the fight progress bar is visible again under the top HUD during Route 1 combat.

## Additional progress (tooling + data runtime hardening)
- Added a lightweight npm/Vite toolchain for the project root so browser-side dependencies can be imported cleanly in the current vanilla HTML/JS setup:
  - new files: `package.json`, `package-lock.json`, `vite.config.mjs`.
  - local run and Playwright helper scripts now start a Vite dev server instead of `python -m http.server`.
- Added dedicated runtime modules:
  - `lib/runtime-data.js` for CSV parsing with Papa Parse plus Zod validation of route JSON, Pokemon JSON, save bridge payloads, and normalized CSV-derived config objects.
  - `lib/audio-manager.js` for a centralized Howler-based audio layer (master/category volume, mute, register/play/stop/unload), ready for future music/SFX work.
- Integrated the new runtime helpers into `game.js`:
  - save bridge and localStorage loads now validate payload shape before normalizing.
  - route and Pokemon JSON loads now validate required runtime fields.
  - editable CSV loads (`pokeballs`, `shop_items`, `zone encounters`) now use Papa Parse and validate normalized rows before applying them.
- Migrated `version.js` to an ES module export so the app version now bundles correctly through Vite while still exposing `window.POKEIDLE_APP_VERSION`.
- Added focused Vitest coverage:
  - `tests/runtime-data.test.js`
  - `tests/audio-manager.test.js`

## Validation (tooling + runtime hardening)
- `npm run test:run`: PASS.
  - 8 tests passed (`runtime-data` + `audio-manager`).
- `npm run build`: PASS.
- `run_playwright_check.ps1`: PASS with Vite dev server.
  - New artifacts refreshed in `output/web-game-poke/`.
  - `state-0.json` / `state-2.json` confirm:
    - `app_version: "0.1.0-alpha.0"`
    - `zone_csv_loaded: true`
    - `ball_csv_loaded: true`
    - `shop_items_csv_loaded: true`
    - `starter_modal_visible: true`
- Visual note:
  - the develop-web-game client still captures the canvas-first view, so DOM overlays like the starter modal are primarily validated through text state rather than those particular screenshots.

## Additional progress (static server compatibility fix)
- Fixed a runtime regression when the game is served from a plain static server (`localhost:3000`) instead of Vite.
- Root cause:
  - `lib/audio-manager.js` and `lib/runtime-data.js` were importing bare npm specifiers (`howler`, `papaparse`, `zod`) directly in browser code.
  - This works through Vite, but crashes under a simple static server because the browser cannot resolve bare module specifiers by itself.
- Implemented local browser vendor bundles:
  - added `scripts/build-browser-vendors.mjs`
  - added wrapper entries in `vendor-src/`
  - generated committed browser-safe ESM bundles in `vendor/`
- Runtime modules now import only relative local paths:
  - `../vendor/howler.js`
  - `../vendor/papaparse.js`
  - `../vendor/zod.js`
- Result:
  - the game now starts correctly both with Vite and with a plain static server.

## Validation (static server compatibility fix)
- `npm run build:vendors`: PASS.
- `npm run test:run`: PASS.
- `npm run build`: PASS.
- Static server smoke on `http://127.0.0.1:3000`: PASS.
  - Playwright artifact folder: `output/web-game-static-3000/`
  - No fresh `errors-*.json` produced.
  - `state-1.json` confirms app reaches `mode: "ready"` and CSV/config data is loaded.

## Additional progress (HUD compact pass)
- Reduced the visual footprint of the top and bottom HUD overlays in `styles.css`:
  - smaller overlay padding/gaps,
  - slimmer route header block,
  - smaller resource pills,
  - more compact action dock buttons.
- Kept the same layout structure and ids so existing interactions remain unchanged.

## Validation (HUD compact pass)
- Static smoke on `http://127.0.0.1:3000`: PASS.
- Full-page UI screenshot captured:
  - `output/ui-hud-compact-fullpage.png`

## Additional progress (HUD compact pass v2)
- Reduced the top and bottom HUD further on desktop:
  - smaller top overlay padding and header buttons,
  - smaller resource pill heights and typography,
  - narrower and shorter action dock buttons.

## Validation (HUD compact pass v2)
- Updated full-page UI screenshot:
  - `output/ui-hud-compact-fullpage-v2.png`

## Additional progress (Pokemon-inspired HUD/style pass)
- Reworked the main HUD styling around the visual direction from the provided Pokemon UI reference:
  - much thinner top route header,
  - more compact resource cards,
  - slimmer bottom action dock,
  - darker matte teal/navy surfaces with subtle cyan border lines,
  - restrained gold accents instead of large bright chips.
- Applied the same visual language to shared UI surfaces/buttons so modals and notifications sit closer to the same style family.

## Validation (Pokemon-inspired HUD/style pass)
- Full-page reference check:
  - `output/ui-hud-pokemon-inspired-v1.png`
- `npm run build`: PASS.

## Additional progress (enemy defensive type HUD relocation)
- Moved enemy defensive type display off allied Pokemon and onto the enemy UI itself in `game.js`:
  - allied HUD keeps the offensive type badge,
  - allied matchup pill now shows only the multiplier label,
  - enemy defensive type icons are rendered in a dedicated pill attached to the enemy, below the HP bar.

## Validation (enemy defensive type HUD relocation)
- `node --check game.js`: PASS.
- Develop-web-game client run:
  - `output/type-overlay-enemy-hud/`
- Manual Playwright combat validation:
  - `output/type-overlay-enemy-hud-manual/combat.png`
  - `output/type-overlay-enemy-hud-manual/state.json`
  - `output/type-overlay-enemy-hud-manual/errors.json`
- Result:
  - enemy defensive types are now displayed on the enemy HUD,
  - no fresh console/page errors were captured in the combat validation run.

## Additional progress (background post-process cleanup)
- Lightened the stage background treatment to keep only environment-driven effects:
  - removed the decorative CSS stage vignette/glow layer over the game stage,
  - removed the canvas viewport vignette pass so only day/night + weather overlays remain active.
- Kept the existing environment stack intact:
  - time-of-day color grading,
  - weather color grading/particles/lightning.

## Validation (background post-process cleanup)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual spot-check:
  - `output/web-game-poke/shot-2.png`
  - Result: background reads noticeably cleaner, without the extra dark decorative vignette layer.

## Additional progress (combat layout + responsive HUD cleanup)
- Reworked combat positioning in `game.js` around real safe zones instead of fixed top/bottom percentages:
  - `computeLayout()` now accounts for actual overlay heights (`.ui-topbar`, `.action-dock`) and adapts for compact / phone viewports.
  - team sprites are slightly smaller and their info is pushed outward into compact cards rather than floating directly around the center fight.
  - enemy HUD was moved above the enemy sprite with a cleaner vertical stack:
    - defensive types,
    - HP bar,
    - name/level card.
- Reworked ally combat HUD rendering:
  - one compact type pill (offensive icon + multiplier),
  - one name/level card,
  - XP bar attached below the card.
- Updated mobile overlay CSS in `styles.css`:
  - resource strip stays on one compact row of 3 pills on phone,
  - action dock stays on one compact row of 3 buttons on phone,
  - fullscreen hint is hidden on narrow screens,
  - mobile notification stack is raised and compacted.
- Added compact notification-stack rendering on narrow/coarse devices:
  - mobile now collapses multiple evolution notifications into a reduced set instead of covering most of the battle view.

## Validation (combat layout + responsive HUD cleanup)
- `node --check game.js`: PASS.
- `npm run build`: PASS.
- Develop-web-game client smoke:
  - `run_playwright_check.ps1`: PASS.
- Desktop validation with injected 6-Pokemon save:
  - `output/layout-responsive-clean/desktop-clean.png`
- Mobile validation with injected 6-Pokemon save:
  - `output/layout-responsive-clean/mobile-clean.png`
  - `output/layout-responsive-clean/mobile-clean-v2.png`
- Additional full layout stress run (with higher-level team / notification pressure):
  - `output/layout-responsive-pass/desktop.png`
  - `output/layout-responsive-pass/mobile.png`
- Result:
  - desktop combat read is much cleaner,
  - mobile keeps top/bottom controls usable,
  - notification stack no longer consumes the full battle screen on phone.

## Additional progress (remove Vite tooling)
- Removed Vite tooling from the repo:
  - deleted `vite.config.mjs`,
  - removed Vite scripts/dependency from `package.json`,
  - Playwright helper scripts now use `python -m http.server` again.
- Note:
  - `vitest` was removed as well to fully eliminate the Vite dependency chain.

## Additional progress (box appearance editing + sprite sync)
- Extended the appearance editor flow so boxed Pokemon can also open it directly:
  - right click on a box Pokemon now opens the appearance modal for that specific Pokemon;
  - left click behavior in boxes remains unchanged.
- Refactored appearance opening around a shared helper so both team slots and box entries reuse the same modal setup path.
- Updated box entry rendering to use the selected appearance sprite path when available instead of always falling back to the default species sprite.
- Refreshed the boxes grid immediately after appearance changes and shiny toggles while the boxes modal is open, so the box sprite updates as soon as a new look is selected.

## Validation (box appearance editing + sprite sync)
- `node --check game.js`: PASS.
- Develop-web-game validation artifacts:
  - `output/boxes-appearance-rightclick/appearance-open.state.json`
  - `output/boxes-appearance-rightclick/boxes-after.state.json`
  - `output/boxes-appearance-rightclick/boxes-after.png`
  - `output/boxes-appearance-rightclick/box-sprite-src.txt`
  - `output/boxes-appearance-rightclick/console-errors.json`
- Result:
  - right click on a boxed Bulbizarre opened the appearance modal with `appearance_pokemon_id: 1`;
  - after selecting Emerald, the box sprite source switched to `pokemon_data/1_bulbasaur/sprites/1_bulbasaur_emerald_front.png`;
  - no fresh console/page errors were captured.

## Additional progress (full UI style pass inspired by Pokemon battle HUD)
- Refreshed `styles.css` with a coherent retro battle-HUD direction inspired by Pokemon GBA:
  - introduced a brighter parchment/steel palette with angular cut-corner panels;
  - replaced rounded glass/sci-fi cards with crisp framed plates for topbar, resources, action dock, modals, notifications, and context menu;
  - unified button treatments (Map, Shop, reset, tabs, quantity, modal actions) with the same retro geometry and contrast language;
  - tuned typography toward compact GBA-like readability using `Tahoma`/`Verdana`.
- Extended the visual update into canvas-drawn HUD in `game.js` (not only DOM CSS):
  - added retro helper shapes (`traceRetroHudPath`, `drawRetroHudPanel`) and reused them across HUD primitives;
  - rewired enemy name plate + HP bar to match battle-style framing (HP chip, neutral track, classic green/yellow/red fill logic);
  - updated ally name/level cards, XP bars, type badges, matchup pills, route timer bar, non-combat banner, and version badge to the same visual family.
- Preserved layout behavior and interaction contracts (modals, context menu, route nav, shop actions) while re-skinning.

## Validation (full UI style pass)
- `node --check game.js`: PASS.
- `npm run build`: PASS.
- `run_playwright_check.ps1`: PASS (after granting elevated run for Chromium launch in this environment).
- Visual artifacts:
  - `output/web-game-poke/shot-1.png` (updated non-combat panel rendering);
  - `output/dom-ui-check.png` (topbar/resource/dock + starter modal with new style);
  - `output/dom-battle-check.png` (in-game overlays in ready state with notifications/context).

## Additional progress (startup skin preload fix)
- Fixed startup appearance loading so the selected skin is available immediately on next game launch.
- Added `preloadSelectedAppearanceAssetsForTeam()` in `game.js`:
  - reads current team ids from save,
  - resolves each selected/owned variant,
  - preloads the required sprite image(s) (including shiny when shiny appearance mode is active).
- Wired this preload into `initializeScene()` before `rebuildTeamAndSyncBattle()` and before battle start.
- Result:
  - after restarting, team Pokemon use their saved selected skin right away,
  - no delayed fallback period where default skin stays visible waiting for late asset load.

## Validation (startup skin preload fix)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright restart scenario with instrumented canvas draw log: PASS.
  - Artifacts: `output/appearance-restart-preload/`.
  - Assertion summary (`assert.json`):
    - `previous_variant: "firered_leafgreen"`
    - `candidate_variant: "emerald"`
    - `immediate_variant: "emerald"`
    - `delayed_variant: "emerald"`
    - `immediate_draw_uses_candidate: true`
    - `delayed_draw_uses_candidate: true`

## Additional progress (dark theme pass)
- Switched the retro UI refresh from a light parchment look to a dark battle-HUD variant across both DOM and canvas layers.
- Updated `styles.css` dark override palette:
  - darkened global surfaces (topbar/resource/action dock/modals/notifications/context menu),
  - kept action colors readable (teal/blue/red/gold accents),
  - preserved cut-corner geometry while improving contrast for text and controls.
- Updated `game.js` canvas HUD palette:
  - darkened retro panels (`drawRetroHudPanel` defaults + callers),
  - darkened enemy name/HP HUD cards, ally name cards, type pills/badges, XP bars, route timer, non-combat banner, and version badge,
  - adjusted text + borders for readability on dark backgrounds.

## Validation (dark theme pass)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Note: `npm run build` is currently unavailable in this workspace because `package.json` only exposes `build:vendors`.
- Visual artifacts:
  - `output/dark-ui-check-start.png`
  - `output/dark-ui-check-battle.png`

## Additional progress (zone encounters editor UX)
- Added an Excel-friendly editing workflow for zone encounters while keeping runtime CSV compatibility.
- Installed `exceljs` (dev dependency) and added npm scripts:
  - `npm run zone:csv:export`
  - `npm run zone:editor:build`
  - `npm run zone:editor:export`
- Added `scripts/generate_zone_encounters_workbook.mjs`:
  - Generates `map_data/kanto_zone_encounters_editor.xlsx` from the runtime CSV.
  - Adds auto name lookup from `pokemon_id` (`pokemon_name_fr` and `pokemon_name_en`) via hidden `PokemonRef` sheet.
  - Adds dropdown validations for `zone_type`, `combat_enabled`, and `method_1..3`.
  - Rebuilds `methods` from method slots for standard rows.
- Added `scripts/export_zone_encounters_from_workbook.mjs`:
  - Exports workbook edits back to `map_data/kanto_zone_encounters.csv` (runtime format).
  - Resolves names from hidden Pokemon references by id to avoid stale manual names.
  - Normalizes methods and writes UTF-8 BOM for better Excel encoding behavior.
- Updated `scripts_export_zone_encounters_csv.mjs` to write UTF-8 BOM.
- Added user docs: `map_data/ZONE_ENCOUNTERS_EDITOR.md`.

## Validation runs (this turn)
- `node --check scripts/generate_zone_encounters_workbook.mjs`: PASS.
- `node --check scripts/export_zone_encounters_from_workbook.mjs`: PASS.
- `node --check scripts_export_zone_encounters_csv.mjs`: PASS.
- `npm run zone:editor:build`: PASS (`map_data/kanto_zone_encounters_editor.xlsx` generated).
- `npm run zone:editor:export`: PASS (`map_data/kanto_zone_encounters.csv` regenerated, 336 rows).
- `run_playwright_check.ps1`: PASS.
  - Screenshot reviewed (`output/web-game-poke/shot-2.png`) and state confirms `zone_csv_loaded: true`.

## Additional progress (full combat layout + compact HUD readability rework)
- Reworked `computeLayout` to enforce clearer slot geometry by viewport ratio:
  - phone/portrait compact: 2 groups of 3 (`top` + `bottom`) with a slight horizontal arc for each group;
  - desktop/landscape: 3 on left + 3 on right with a slight vertical arc on each side.
- Added stronger anti-overlap spacing rules in combat layout:
  - smaller enemy and ally footprints on compact screens,
  - explicit central safety gap around the enemy,
  - HUD cards pushed outward and clamped to safe bounds,
  - tighter type-chip sizing for ally matchup pills.
- Applied a final CSS readability pass at the end of `styles.css`:
  - compacted top and bottom bars significantly,
  - normalized to a single light retro style (readable ink on parchment-like surfaces),
  - reduced paddings/icon sizes/button heights to avoid crowded UI,
  - tightened responsive breakpoints so mobile remains usable and legible.

## Validation (this pass)
- `node --check game.js`: PASS.
- `run_playwright_long.ps1`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted 6-Pokemon full-page verification with injected save:
  - `output/layout-rework-verify/desktop.png`
  - `output/layout-rework-verify/mobile.png`
  - `output/layout-rework-verify/desktop.json`
  - `output/layout-rework-verify/mobile.json`
  - `output/layout-rework-verify/errors.json` => `[]` (no console/page errors)
- Result summary:
  - desktop now shows a clean left/right 3+3 arc layout with reduced HUD clutter,
  - mobile now shows a clear top/bottom 3+3 arc layout with usable top/bottom controls and no heavy overlap.

## Additional progress (talents passifs)
- Ajout d'un schema `talent` (passif) avec normalisation centralisee dans `game.js`.
  - Valeur par defaut partout: `NONE` / `NONE` / `Aucun effet passif pour le moment.`
- Intégration du talent dans les structures Pokemon:
  - Definitions chargees (`loadPokemonEntity`).
  - Records sauvegarde (`normalizePokemonEntityRecord`, `createPokemonEntityRecord`).
  - Membres d'equipe hydrates (`buildTeamMemberFromSaveEntry`).
- Support UI ajoute:
  - Hover popup: ligne `Talent: ...`.
  - Panneau details Boites: `Talent` + `Effet talent`.
- Export texte Playwright enrichi (`render_game_to_text`):
  - Enemy: `talent_id`, `talent_name_fr`, `talent_name_en`, `talent_description_fr`.
  - Team: memes champs talent sur chaque membre.
- Ajout d'un script de generation CSV: `scripts/generate_pokemon_talents_csv.mjs`.
- CSV genere: `pokemon_data/pokemon_talents.csv` avec 493 Pokemon.
  - Colonnes: `pokemon_id,pokemon_name_fr,pokemon_name_en,talent_name_fr,talent_name_en,talent_description_fr`.
  - Toutes les lignes sont initialisees a `NONE` + description FR par defaut.

## Validation (talents)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Artefacts verifies: `output/web-game-poke/state-2.json` + `output/web-game-poke/shot-2.png` (inspection visuelle effectuee).

## TODO / Next
- Brancher ensuite le moteur d'effets passifs (application runtime par talent) une fois les talents definis.
- Optionnel: afficher le talent directement sur les cartes canvas (pas seulement hover/boites) si on veut le rendre permanentement visible.
- Validation complementaire: run Playwright interactif (`output/web-game-talent-interact`) avec choix starter, puis verification de `state-2.json`.
  - Champs talent presents sur team (`talent_id/name_fr/name_en/description_fr`) et valeurs `NONE` appliquees.

## Additional progress (pokemon scale + turn indicator + attack timing)
- Updated combat sizing and spacing in `computeLayout`:
  - increased enemy and ally sprite size caps/scales on both split-row and side-column layouts,
  - brought ally groups slightly closer to center (phone top/bottom rows and desktop left/right columns) to keep combat focus tighter.
- Fixed turn indicator behavior for the current layout system:
  - removed legacy circular-orbit math,
  - indicator now anchors directly to the active slot from `teamSlots` (works with arc rows/columns),
  - moved indicator draw pass after sprites for clearer visibility.
- Hardened attack interval consistency:
  - added `setAttackInterval()` in `PokemonBattleManager` to keep timer ratio stable when interval changes (ex: boost start/end),
  - `update()` now syncs interval via this helper before combat ticks.

## Validation (this pass)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted combat Playwright run with starter pick + route switch:
  - `output/web-game-combat-check/shot-0.png`
  - `output/web-game-combat-check/shot-1.png`
  - `output/web-game-combat-check/shot-2.png`
  - `output/web-game-combat-check/state-0.json`
  - `output/web-game-combat-check/state-1.json`
  - `output/web-game-combat-check/state-2.json`
  - No `errors-*.json` emitted in this run.
- Mobile viewport verification (390x844):
  - `output/mobile-combat-check.png`
  - `output/mobile-combat-check.state.json`
  - Verified combat scene renders, top/bottom HUD still functional, and no runtime errors observed.
- Follow-up tweak: turn indicator now resolves to the next occupied slot (instead of empty slot turns), so it always highlights an actual attacking Pokemon while fixed tick spacing remains unchanged.
- Re-validated on mobile combat capture: `output/mobile-combat-check.png` + `output/mobile-combat-check.state.json` (`next_attacker: "Bulbizarre"`, `next_attacker_slot_index: 0`).
- Desktop viewport verification (1365x768): `output/desktop-combat-check.png` + `output/desktop-combat-check.state.json` (`next_attacker_slot_index: 0`, indicator anchored on active ally slot).
## Additional progress (enemy UI placement + impact recenter)
- Repositioned enemy UI stack below the enemy sprite in `computeLayout`:
  - enemy HP panel now anchors under the sprite,
  - enemy name/level card is placed below HP,
  - enemy defensive type pill is also kept in the below-enemy stack.
- Added a unified enemy impact anchor in layout (`enemyImpactX`, `enemyImpactY`).
- Rewired combat targeting to this anchor:
  - projectile spawn target,
  - projectile homing target update,
  - instant/idle hit target,
  - capture sequence Pokeball target.
- Removed previous vertical offset on Pokeball capture target so impact/capture anchor are identical.

## Validation (enemy UI + targeting)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Desktop combat screenshot/state:
  - `output/enemy-ui-fix-desktop.png`
  - `output/enemy-ui-fix-desktop.state.json`
- Mobile combat screenshot/state:
  - `output/enemy-ui-fix-mobile.png`
  - `output/enemy-ui-fix-mobile.state.json`
- Visual check confirms enemy UI is rendered under enemy on both viewports.
## Additional progress (FPS overlay)
- Added a discreet FPS counter overlay in `game.js`:
  - New `drawFpsOverlay()` renders a small semi-transparent pill in the top-right corner.
  - Uses existing performance EMA (`state.performance.shortFrameMsEma`) to display real-time FPS.
  - Hooked via `drawVersionOverlay()` so it appears in loading/error/ready screens.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Visual check on `output/web-game-poke/shot-2.png`: FPS label visible and unobtrusive in the top-right corner.

## Additional progress (pokemon size increase)
- Increased combat sprite scales in `computeLayout` for both enemy and team Pokemon.
- Updated size multipliers/clamps to render noticeably larger Pokemon on desktop and mobile while keeping current spacing logic.

## Validation (pokemon size increase)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual captures:
  - `output/pokemon-size-up-desktop.png`
  - `output/pokemon-size-up-desktop.state.json`
  - `output/pokemon-size-up-mobile.png`
  - `output/pokemon-size-up-mobile.state.json`- FPS overlay visibility fix:
  - Moved FPS badge from top-right (hidden by top UI strip) to bottom-right corner of the canvas.
  - Slightly increased contrast/text size while keeping compact look.
- Re-validated with Playwright (`run_playwright_check.ps1`) and screenshot shows FPS visible in bottom-right.

## Additional progress (team sprite-only size bump)
- Increased only allied team sprite rendering scale (without changing enemy size) using `TEAM_SPRITE_SCALE`.
- Kept layout and HUD geometry stable; only visual sprite/backdrop size for team members was enlarged.

## Validation (team sprite-only size bump)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual checks:
  - `output/team-pokemon-bigger-desktop.png`
  - `output/team-pokemon-bigger-mobile.png`
## Additional progress (evolution overlay darken + smoother transition)
- Updated `drawEvolutionAnimationOverlay` in `game.js` to make the evolution/fight separation darker and smoother:
  - added eased backdrop fade-in/fade-out (`EVOLUTION_ANIM_BACKDROP_FADE_MS`) instead of a fixed-opacity dark layer,
  - added a darker radial vignette around the evolving Pokemon to push the active fight background further back,
  - tuned focus glow intensity so the evolving sprite remains readable against the darker backdrop,
  - smoothed phase transitions (white -> flash -> reveal) with `easeInOutSine` and a short from->to crossfade during reveal.

## Validation (evolution overlay darken + smoother transition)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted seeded evolution probe: PASS (`output/evolution-overlay-darken-check`).
  - Captures generated: `before-evolve.png`, `evolution-start.png`, `evolution-mid.png`, `evolution-end.png`.
  - Text states generated: `state-start.json`, `state-mid.json`, `state-end.json`.
  - Mid animation state confirms evolution overlay active (`evolution_animation.elapsed_ms: 1969 / 2480`) while combat keeps running in background.

## Additional progress (evolution transition: shrinking Poke1 + white orb grow/shrink)
- Reworked `drawEvolutionAnimationOverlay` in `game.js` to match the requested evolution beat:
  - stage 1: Poke 1 now shrinks smoothly while a large white orb grows around it,
  - stage 2: after peak flash, the white orb shrinks to reveal Poke 2,
  - added an orb edge stroke so the shrinking circle remains visible,
  - kept eased timing (`easeInOutSine`) across all phases to reduce abrupt transitions.

## Validation (evolution grow/shrink orb transition)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted seeded evolution captures: PASS.
  - `output/evolution-orb-transition-check-2/phase-grow-start.png`
  - `output/evolution-orb-transition-check-2/phase-grow-large-orb.png`
  - `output/evolution-orb-transition-check-2/phase-shrink-orb-reveal.png`
  - `output/evolution-orb-transition-check-2/phase-shrink-near-end.png`

## Additional progress (evolution bonheur via temps en boite)
- Implémenté une progression dédiée pour les évolutions `minHappiness`:
  - nouveau champ persistant par espèce: `happiness_box_streak_ms` (normalisé + créé à 0 sur nouveaux records),
  - ajout d'une règle globale: condition bonheur validée à `3h` (`HAPPINESS_EVOLUTION_BOX_REQUIRED_MS`) passées en boîte,
  - mise à jour continue du streak pendant la simulation (`updateHappinessEvolutionBoxProgress(deltaMs)`) uniquement pour les espèces ayant au moins une évolution bonheur,
  - reset immédiat du streak si le Pokémon est présent dans la team,
  - intégration de la condition dans `isEvolutionMethodSatisfied` (suppression du blocage précédent qui rejetait `minHappiness`).

## Validation (evolution bonheur via temps en boite)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Test ciblé (boîte noire, save seedée Meowth hors team, streak à `3h - 10s`):
  - avant `advanceTime(10000)`: `notifications_evolution_ready = 0`,
  - après `advanceTime(10000)`: `notifications_evolution_ready = 1`.
  - artefacts: `output/happiness-evolution-threshold-test.json`, `output/happiness-evolution-threshold-test.png`.
- Test ciblé “dans la team” (Meowth en team, même streak seedé):
  - avant `advanceTime(10000)`: `notifications_evolution_ready = 0`,
  - après `advanceTime(10000)`: `notifications_evolution_ready = 0`.
- Artefact test team: `output/happiness-evolution-in-team-test.json`.

## Additional progress (enemy type HUD visibility fix)
- Fixed enemy defensive type badges being hidden behind the enemy name/level card in combat/exploration view.
- Root cause: `drawEnemyDefensiveTypeHud` was rendered before name/level, while `enemyTypeHudY` could overlap the name card area.
- Update in `game.js` (`drawBattleUiOverlay`):
  - render enemy HP and name first,
  - then render defensive type badges,
  - force badge Y to be at least `enemyNameCard.bottom + 14` so badges stay below the name card.

## Validation (enemy type HUD visibility fix)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Route 3 visual validation with seeded save:
  - `output/enemy-type-fix-check/canvas.png`
  - `output/enemy-type-fix-check/page.png`
  - `output/enemy-type-fix-check/state.json`
  - `output/enemy-type-fix-check/errors.json` (`[]`)
- Result:
  - enemy defensive type badges are now visible under the enemy name/level card (example: Rondoudou shows `normal` + `fairy`).

## Additional progress (orb size/opacity tuning per feedback)
- Adjusted the evolution white orb so it stays around Pokemon size (slightly larger) and fully opaque:
  - orb radius now scales from ~`0.52x spriteSize` to ~`0.64x spriteSize` at peak,
  - reveal phase shrinks orb down to ~`0.08x spriteSize`,
  - orb body is now a solid opaque white fill (with strong border), not a wide soft wash.

## Validation (orb size/opacity tuning)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted seeded evolution captures: `output/evolution-orb-transition-check-3/`.
  - `phase-900ms.png` (orb near Pokemon size, opaque)
  - `phase-1500ms.png` (orb still opaque before shrink completes)
  - `phase-2100ms.png` (orb shrunk small while Pokemon 2 is visible)

## Additional progress (mobile perf audit - Pixel 8 Chrome emulation)
- Ran targeted mobile perf probes with Playwright emulating Pixel 8 (`412x915`, `dpr=3`, coarse pointer):
  - `output/perf-mobile-pixel8/perf-report.json`
  - `output/perf-mobile-pixel8-combat-route/perf-report.json`
- Reproduced automatic quality tier transitions on mobile path:
  - starts at `very_low` (`render_scale: 0.58`), then may climb to `low`/`medium` depending on CPU headroom.
- Important perf finding in code path:
  - mobile coarse-pointer devices are capped by quality policy and frame interval presets (`very_low/low/medium`), which can effectively limit render cadence to ~24/29/45 FPS.
- Important diagnostics finding:
  - exported `fps_estimate` and FPS overlay are based on RAF delta, not actual render cadence (render can be throttled while estimate still shows ~60).
- Additional likely hotspot identified:
  - `computeLayout()` is executed from `update()` and performs per-tick DOM reads (`getComputedStyle` + `getBoundingClientRect`), which can add avoidable main-thread cost on mobile.
- No console/page errors observed in these targeted runs.

## Additional progress (attack miss chance 5%)
- Added a new combat constant in `game.js`: `ATTACK_MISS_CHANCE = 0.05`.
- Updated `PokemonBattleManager.applyHit`:
  - each attack now rolls a 5% miss chance before damage computation;
  - when missed, no HP is removed and no hit flash/effects are applied;
  - `lastImpact` now includes `missed: true|false`.
- Updated floating combat text behavior:
  - missed hits display `RATE` instead of damage;
  - exported text-state now includes `floating_damage_texts[].missed`.

## Validation (attack miss chance)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted develop-web-game Playwright run with starter + route switch + combat (`output/miss-check-combat`):
  - visual combat screenshot reviewed: `output/miss-check-combat/shot-0.png`.
  - text state confirms miss behavior:
    - `last_impact.damage: 0`
    - `last_impact.missed: true`
  - state artifact: `output/miss-check-combat/state-0.json`.
- Note: one existing non-blocking browser console error observed in the targeted run (`Failed to load resource: net::ERR_CONNECTION_REFUSED`), likely related to optional local save bridge connectivity.

## Additional progress (combat passive architecture refactor)
- Refactored combat turn decision flow to prepare passive abilities cleanly, without coupling passive rules to projectile/damage internals.
- Added a dedicated passive module: `lib/combat-passives.js`.
  - Introduces a behavior registry mapped from talent ids/aliases.
  - Current supported passive behavior:
    - `NONE` -> normal attack turn
    - `NO_ATTACK` -> skip attack turn (`passive_no_attack` reason)
- Integrated passive turn resolution in `PokemonBattleManager` (`game.js`):
  - new turn helpers: `consumeTurnSlot`, `resolveTurnDecisionForSlot`, `getNextTurnPreview`, `recordTurnEvent`, `getLastTurnEvent`;
  - both idle and projectile combat paths now resolve decision through the passive module before attacking;
  - turn indicator now carries `can_attack` and reason metadata.
- Added combat decision telemetry in `render_game_to_text`:
  - top-level: `next_turn_action`, `next_turn_reason`, `next_turn_passive_behavior_id`, `turn_indicator_can_attack`, `last_turn_event`;
  - enemy/team entries now include `passive_behavior_id`.
- Updated turn-indicator rendering to visually mark non-attacking turns with a dashed/softer style.

## Validation (combat passive architecture refactor)
- `node --check lib/combat-passives.js`: PASS.
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted develop-web-game run with starter selection (`output/passive-refactor-check`): PASS.
- Manual Playwright flow with starter + Route 1 + combat + tutorial close (`output/passive-refactor-manual-clear`): PASS.
  - `state.json` confirms new passive/turn fields are populated during combat:
    - `next_turn_action: "attack"`
    - `next_turn_reason: "attack_ready"`
    - `turn_indicator_can_attack: true`
    - `last_turn_event` populated (including skipped empty-slot turns)
    - team/enemy include `passive_behavior_id: "NONE"`.
- Console/page errors in the final manual run: `[]`.

## TODO / Next
- Add concrete passive talent ids in data (example `NO_ATTACK`) and assign them per species in `pokemon_talents.csv`.
- Add additional passive behaviors in `lib/combat-passives.js` (e.g. attack interval modifier, bonus crit chance) via the same registry contract.
- Add one deterministic regression scenario where an attacker with `NO_ATTACK` is in team and verify:
  - no projectile spawn for its turns,
  - turn event reason is `passive_no_attack`,
  - other team members keep attacking normally.

## Additional progress (Boites: compteur shiny global)
- Added a new global shiny capture counter in the Boxes modal header.
  - `index.html`: new line `#boxes-shiny-counter` under the existing boxes subtitle.
  - `styles.css`: dedicated style for `.boxes-shiny-counter` (gold accent, compact text).
- Wired runtime value in `game.js`:
  - new helper `getTotalShinyCapturesGlobal()` that sums `captured_shiny` across all unlocked Pokemon entities;
  - `renderBoxesGrid()` now updates `#boxes-shiny-counter` with live total;
  - `closeBoxesModal()` resets the counter text;
  - text-state export now includes `boxes_shiny_capture_total` for validation/debug.

## Validation (Boites shiny counter)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted develop-web-game run (starter -> Route 1 -> team click):
  - artifact: `output/boxes-shiny-counter-check/state-0.json`
  - confirms field present: `boxes_shiny_capture_total: 0`.
- Targeted UI verification with Playwright script:
  - screenshot: `output/boxes-shiny-counter-ui.png`
  - state dump: `output/boxes-shiny-counter-ui.json`
  - confirms `boxes_modal_open: true` and `shiny_counter_text: "Captures shiny (global): 0"`.
  - console errors file: `output/boxes-shiny-counter-ui-errors.json` (`[]`).

## Additional progress (talents CSV + passive behavior alignment)
- Added a shared talent module `lib/talents.js`:
  - Centralized talent ID normalization (`normalizeTalentId`) and talent object normalization (`normalizeTalentDefinition`).
  - Translated default FR talent label to `Aucun` while keeping stable ID `NONE`.
- Refactored combat passive mapping in `lib/combat-passives.js`:
  - Reused shared talent normalization to avoid ID drift between modules.
  - Added `LOSER` / `PERDANT` aliases to the `NO_ATTACK` passive behavior.
  - Verified decision flow: talent `LOSER` now returns action `skip` with `passiveBehaviorId: NO_ATTACK`.
- Integrated talent CSV loading in `game.js`:
  - Added `POKEMON_TALENTS_CSV_PATH` loader (`loadPokemonTalentCsv`) with normalization + unresolved-talent diagnostics.
  - Added state wiring (`pokemonTalentCsvByPokemonId`, `pokemonTalentCsvLoaded`) and text export flag `talents_csv_loaded`.
  - Applied CSV talents into Pokemon definitions (`applyPokemonTalentCsvToDefinitions`) and default talent resolution path.
- Updated talent data assets:
  - `pokemon_data/pokemon_talents.csv` now includes explicit `talent_id` column.
  - FR label `NONE` translated to `Aucun`.
  - Magicarpe talent normalized to `talent_id=LOSER`, `talent_name_fr=Perdant`.
  - Updated generator script `scripts/generate_pokemon_talents_csv.mjs` to emit new schema (`talent_id`) and FR translation defaults.

## Validation runs (talents work)
- `node --check game.js`: PASS.
- `node --check lib/combat-passives.js`: PASS.
- `node --check lib/talents.js`: PASS.
- `node --check scripts/generate_pokemon_talents_csv.mjs`: PASS.
- Scripted talent audit:
  - rows: 493
  - talents: `NONE:492`, `LOSER:1`
  - unresolved talent passives: none.
- `run_playwright_check.ps1`: PASS.
  - latest state confirms `talents_csv_loaded: true`.
  - screenshot visually OK (starter/town screen rendered as expected).

## Additional progress (Windows system notifications for shiny events)
- Added a Windows OS notification system (browser Notification API) dedicated to shiny events:
  - shiny encounter -> native Windows notification toast;
  - shiny capture success -> native Windows notification toast.
- Added a persistent user toggle for OS notifications:
  - new action button in the dock (`#windows-notification-btn`);
  - permission-aware states (unsupported / blocked / enabled / disabled);
  - preference persisted in localStorage via `pokeidle_windows_notifications_enabled_v1`.
- Integrated event hooks in battle flow:
  - on enemy spawn: emits OS notification for every shiny encounter;
  - on capture success: emits OS notification for every shiny captured.
- Guardrails:
  - no OS notification spam during simulation idle mode;
  - auto-closing encounter notifications and persistent capture notifications.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (no run-time script failure).
- `run_playwright_long.ps1`: PASS (no run-time script failure).
- Visual inspection of latest Playwright screenshots from:
  - `output/web-game-poke/shot-2.png`
  - `output/web-game-long/shot-0.png`
- Playwright click smoke (`output/windows-notif-btn-check`): PASS.
  - Confirmed no runtime crash when clicking `#windows-notification-btn`.

## Additional progress (skill creation for talent process)
- Created reusable Codex skill at `C:/Users/esibe/.codex/skills/pokemon-talents-maintainer`.
- Wrote focused workflow in SKILL.md for:
  - CSV talent audit
  - FR translation normalization
  - passive-behavior alignment
  - runtime wiring and gameplay validation
- Added reusable audit script:
  - `scripts/audit_talents_csv.mjs`
  - emits structured JSON: talent counts, non-default talents, unresolved passive mappings, translation candidates.
- Added reference checklist:
  - `references/checklist.md`.
- Generated and validated skill metadata:
  - `agents/openai.yaml` created.
  - `quick_validate.py` => `Skill is valid!`.
- Smoke-tested skill script on this repo:
  - rows: 493
  - talent IDs: `NONE`, `LOSER`
  - unresolved: none
  - translation candidates: none
- Note maintenance:
  - `scripts/generate_pokemon_talents_csv.mjs` genere une base uniforme (`NONE`/`Aucun`) et ne preserve pas les talents custom existants.
  - Apres regeneration, re-appliquer les exceptions talent (ex: Magicarpe `LOSER`) via un pass de post-traitement ou edition ciblee.

## Additional progress (ultra shiny tuning: outline + hue speed)
- Ultra shiny visual tuning in `game.js`:
  - reinforced white outline around ultra shiny sprites (double silhouette pass + soft halo) so the contour is clearly visible;
  - slowed the ultra shiny hue cycle significantly (`ULTRA_SHINY_HUE_CYCLE_MS`: `2400` -> `7600`) for a calmer shader animation;
  - increased outline base thickness (`ULTRA_SHINY_OUTLINE_PX`: `2.1` -> `3.4`).

## Validation (ultra shiny tuning)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.

## Additional progress (start crash fix)
- Crash root cause fixed in this turn (see git changes in lib/vendor/version/index).
- Missing folders restored from commit 3b2913b7: lib/*, vendor/*, assets/type-icons/*.
- Fixed version bootstrap mismatch: version.js now exports POKEIDLE_APP_VERSION and mirrors to window.
- Removed legacy non-module version.js script include from index.html; game.js now consumes version via ESM import only.
- Added icon link in index.html to reduce implicit favicon 404 noise in startup checks.
- Validation: node --check (version.js, game.js, lib modules) PASS; run_playwright_check.ps1 PASS (mode=ready); run_local_game_with_save.ps1 PASS.

## Additional progress (ultra shiny outline opacity fix)
- Updated ultra shiny sprite outline to render as a true white dilation ring at full opacity (alpha 1).
- Outline pass now renders before sprite draw, with stronger pixel offsets for higher visibility.
- Validation: node --check game.js PASS; Playwright route/combat capture PASS.
- Artifacts: output/ultra-outline-route1-visible.png, output/ultra-outline-route1-visible.state.json, output/ultra-outline-route1-visible.errors.json ([]).

## Additional progress (ultra outline min clamp fix)
- Removed forced minimum outline width in drawUltraShinyOutline (0 now disables outline).
- Switched to a thin 8-direction offset outline so small values remain visually small.
- Set default ULTRA_SHINY_OUTLINE_PX to 1.2.
- Mobile validation artifact: output/ultra-outline-mobile-thin.png.

## Additional progress (ultra shiny shader lightweight optimization)
- Reworked ultra shiny outline render path to use cached precomputed textures (one draw call per frame instead of multi-pass per-frame tint redraws).
- Added bounded cache: ultraShinyOutlineCache (max 220 entries, FIFO trim).
- Removed heavy per-frame outline composition loops from drawUltraShinyOutline.
- Kept outline width fully controllable (0 disables).
- Validation: node --check game.js PASS; run_playwright_check.ps1 PASS; mobile combat capture PASS (errors=[]).
## Additional progress (mobile lag vs displayed FPS)
- Identified mismatch: overlay FPS was tied to RAF cadence instead of actual render cadence, so mobile could feel laggy while showing high FPS.
- Added `renderFrameMsEma` tracking and switched FPS overlay to render-based value.
- Added telemetry in `render_game_to_text`: `render_frame_ms_estimate`, `render_fps_estimate`.
- Disabled global debug ultra shiny force by default (`DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON = false`) to avoid shader cost on every sprite.
- Reduced shiny sparkle cost on low quality profiles (fewer particles + no radial gradient on low tiers).
- Added high-end mobile detection so strong phones (e.g. Pixel-class) are not always clamped to low/very_low on startup.
- Validation: `node --check game.js` PASS; `run_playwright_check.ps1` PASS; `run_playwright_long.ps1` PASS.
## Additional progress (shiny/ultra family unlocks + box badges)
- Disabled temporary debug force for ultra shiny (`DEBUG_FORCE_ULTRA_SHINY_ALL_POKEMON=false`).
- Spawn rates updated:
  - shiny wild encounter: 1/1024;
  - ultra shiny wild encounter: 1/4096 (independent direct roll).
- Added ultra shiny capture counter to species data: `captured_ultra_shiny` (+ encountered/defeated ultra counters for consistency).
- Capture flow now increments ultra counters when applicable while keeping shiny counters for shiny+ultra totals.
- Appearance unlock logic now works on full evolution family:
  - shiny mode unlock if any family member has a shiny capture;
  - ultra shiny mode unlock if any family member has an ultra shiny capture.
- Added `appearance_ultra_shiny_mode` state and UI toggle in appearance modal.
  - Enabling ultra shiny forces shiny mode ON.
  - Disabling shiny mode forces ultra shiny OFF.
- Added tiny corner badges in boxes cards:
  - white sparkle when shiny mode is unlocked for that family;
  - rainbow sparkle when ultra shiny mode is unlocked for that family.
- Added debug payload fields for appearance family unlocks (`appearance_shiny_unlocked_family`, `appearance_ultra_shiny_unlocked_family`).
- Validation: `node --check game.js` PASS, `run_playwright_check.ps1` PASS.

## Additional progress (team swap lock + city team display + 60s timer)
- Updated route defeat timer default to 60 seconds (`ROUTE_DEFEAT_TIMER_MS = 60000`).
- Updated Route 1 tutorial copy:
  - team swap guidance now explains boxes are available in towns or after unlocking the next zone;
  - progression copy now states `1 minute max par combat`.
- Added team-swap access gate based on current route unlock state:
  - new helpers: `getTeamBoxesAccessState` and `getTeamBoxesLockedMessage`;
  - boxes are blocked whenever a timed KO streak is active (`timerEnabled === true`), i.e. during the active route unlock challenge;
  - boxes remain available in peaceful cities/towns and in combat zones whose next zone is already unlocked.
- Applied the gate in all relevant paths:
  - direct left-click team -> boxes;
  - team context menu boxes button (disabled + label update when locked).
- Updated render/input behavior for peaceful towns:
  - team is now rendered even when combat is disabled (no attacks/projectiles because no active battle);
  - team hover/click/context-menu interactions remain available in peaceful zones.

## Validation (team swap lock turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- City visual + state check (`output/web-game-city-team`):
  - screenshot confirms team visible in town;
  - state confirms `route_combat_enabled: false`, `enemy: null`, `attack_timer_ms: null`.
- City boxes check (`output/web-game-city-boxes`):
  - state confirms `boxes_open: true` after team click in town.
- Route 1 lock check (`output/route1-lock-check-summary2.json`, `output/route1-lock-check-fullpage2.png`):
  - state confirms `route_defeat_timer_active: true` and `route_defeat_timer_duration_ms: 60000`;
  - team click during timed streak does not open boxes (`boxes_open: false`);
  - notification stack shows: `Serie chrono active (0/20 KO). Debloque Jadielle (Kanto) pour echanger la team.`

## Additional progress (shop evolutions + cable link)
- Added new evolution shop items at 100000 Poke$ in `item_data/shop_items.csv`:
  - Couronne Galanoa (`galarica_wreath` / `galarica-wreath`)
  - Pierre Glace (`ice_stone` / `ice-stone`)
  - Pierre Lune (`moon_stone` / `moon-stone`)
  - Pierre Soleil (`sun_stone` / `sun-stone`)
  - Pierre Foudre (`thunder_stone` / `thunder-stone`)
  - Cable Link (`cable_link` / `cable-link`)
- Fixed requested species evolution rules:
  - Ramoloss -> Flagadoss: level 37 only (removed galarica-cuff item method).
  - Sabelette -> Sablaireau: level 22 only (removed ice-stone method).
  - Goupix -> Feunard: fire-stone only (removed ice-stone method).
- Extended evolution-item compatibility logic in `game.js`:
  - `trade` methods can now be unlocked via evolution shop items;
  - `Cable Link` unlocks pure trade evolutions (no held item), e.g. Spectrum -> Ectoplasma.
- Updated evolution shop subtitle from "Pierres d'evolution" to "Objets d'evolution".

## Validation (shop evolutions + cable link turn)
- `node --check game.js`: PASS.
- CSV parsing validation (`parseCsvObjects` on `item_data/shop_items.csv`): PASS (10 rows, 0 parse errors).
- `run_playwright_check.ps1`: PASS.
- `output/web-game-poke/state-2.json` confirms:
  - `shop_items_csv_loaded: true`;
  - new shop stock keys present (`galarica_wreath`, `ice_stone`, `moon_stone`, `sun_stone`, `thunder_stone`, `cable_link`);
  - new `shop_item_configs` entries loaded.
- Data spot-check script confirms:
  - `ice-stone` now maps to Ã‰voli -> Givrali only;
  - `thunder-stone` / `moon-stone` / `sun-stone` / `galarica-wreath` mappings present;
  - trade-without-item pairs detected for Cable Link candidates: Gravalanch, Kadabra, Machopeur, Spectrum lines.

## Additional progress (evolution capture unlock fix)
- Fixed evolution capture unlock rules in `game.js`:
  - Capturing an evolution species no longer unlocks that evolution entity, even on repeated captures.
  - Capturing an evolution species now only unlocks the root/base stage of that family if it is still locked.
  - Evolution-species captures still increment capture stats as before.
- Added ownership capture invariant helper:
  - New `ensureOwnedRecordHasAtLeastOneCapture(record)` enforces: if an entity is unlocked/owned, total captures must be >= 1.
  - Applied during `ensurePokemonEntityUnlocked(...)` so unlock paths (including evolution unlock) cannot leave owned species at 0 captures.
  - Applied in unlock-state reconciliation to repair legacy unlocked entities with invalid capture totals.
- Tightened legacy reconcile behavior:
  - `reconcileEntityUnlockStates()` no longer auto-unlocks evolution species from repeated captures.
  - It still auto-unlocks non-evolution species if they have capture data.

## Validation (post-fix)
- `node --check game.js`: PASS
- `./run_playwright_check.ps1`: PASS
- Reviewed latest screenshots:
  - `output/web-game-poke/shot-0.png`
  - `output/web-game-poke/shot-1.png`
  - `output/web-game-poke/shot-2.png`
- Reviewed latest text states:
  - `output/web-game-poke/state-0.json`
  - `output/web-game-poke/state-1.json`
  - `output/web-game-poke/state-2.json`
- No new Playwright console/page error files generated in this run.

## TODO / Suggestions
- Add an automated regression scenario (save fixture + scripted flow) that validates:
  1) capture of evolution species does not unlock that species,
  2) base/root species is unlocked if missing,
  3) unlocking by evolution guarantees capture total >= 1 for the unlocked target.

## Additional progress (true Kanto map integration in map menu)
- Integrated the user-provided reference map asset at `assets/maps/kanto_map_reference_user.png`.
- Updated map modal image source to use the new reference map.
- Added centralized `MAP_MARKER_OVERRIDES_BY_ROUTE_ID` in `game.js` so all route/city/dungeon markers align with the new map layout.
- Updated `getRouteMapMarker` to prioritize override coordinates, then fallback to JSON markers.
- Added robust marker collision resolution (`resolveMapMarkerLayout`) to keep overlapping zones individually clickable.
- Added per-zone marker typing in map render (`is-route`, `is-town`, `is-dungeon`) and improved marker accessibility labels.
- Forced map image consistency via `applyMapReferenceImage()` when opening/rendering the map modal.
- Refined map marker CSS at end-of-file to preserve center alignment on hover/focus and improve click target clarity.
- Updated metadata/source references:
  - `map_data/kanto_frlg_zones.json` now points to `assets/maps/kanto_map_reference_user.png`.
  - `scripts_generate_kanto_zones_frlg.mjs` now references the new map path and avoids downloading/replacing a manual map when no title is configured.

## Validation (map integration)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- `develop-web-game` client run with map open click: PASS (`map_open: true` in `output/map-modal-open/state-0.json`).
- Full-page Playwright functional validation:
  - map modal opens on `#map-btn` and renders the new reference map (`output/map-modal-functional/map-open-fullpage.png`),
  - clicking marker `kanto_route_1` closes modal and changes route.
  - result snapshot: `route_id: kanto_route_1`, `map_open: false` (`output/map-modal-functional/state-after-route-click.json`).

## TODO / Next
- Optional: tune a few dungeon marker offsets (Diglett/Cerulean Cave/Safari) if the user wants stricter icon-to-icon visual matching.

## Additional progress (map placement rework v2: POI alignment + marker size)
- Reworked map marker placement logic to align to actual displayed image bounds (not the full `.map-stage` container):
  - added `mapStageEl` reference,
  - added `syncMapMarkerLayerBounds()` to set marker layer left/top/width/height from `getBoundingClientRect()` deltas,
  - invoked this sync when opening/rendering map, on map image load, and on window/fullscreen resize.
- Removed global marker anti-overlap spreading that pushed many markers away from POIs.
- Kept explicit per-zone Kanto coordinates and render markers directly at those POI positions.
- Refined map marker visual size strategy for clarity:
  - large click hitbox (`18x18`) retained for usability,
  - tiny inner visual dot via `::before` per type (`route`, `town`, `dungeon`) to reduce clutter,
  - current/unlocked/locked styles preserved with lighter glow.
- Updated `.map-markers` base CSS to avoid `inset: 0` stretching conflict and allow JS-driven bounds.

## Validation (placement rework v2)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Full-page checks (desktop + mobile):
  - `output/map-placement-rework-v2/map-open-desktop.png`
  - `output/map-placement-rework-v2/map-open-mobile.png`
  - visual inspection: markers now sit on map POIs with much smaller footprint.
- Functional click checks (desktop + mobile):
  - `output/map-placement-rework-v2/state-after-click-desktop.json`: `route_id = kanto_route_1`, `map_open = false`.
  - `output/map-placement-rework-v2/state-after-click-mobile.json`: `route_id = kanto_route_1`, `map_open = false`.

## Additional progress (background simulation budget clamp to prevent pokeball over-consumption)
- Root cause identified: hidden/background realtime ticks could process more simulated time than real elapsed time when browser timer callbacks were throttled or bursty.
- Fix in `tickSimulationFromRealtime(...)`: for hidden/idle realtime ticks, simulation budget is now capped to elapsed wall-clock time (`min(configuredBudgetMs, elapsedMs)`), with a safe fallback of one background interval when elapsed is unavailable.
- Result: hidden/background progression no longer runs faster than realtime because of scheduling jitter, which prevents unexpected mass Pokeball drain.

## Validation (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual review of latest screenshot: `output/web-game-poke/shot-2.png`.

## Additional progress (level scaling overhaul + Route 1 rebalance + compact numbers)
- Reworked stat growth curve in `game.js` while preserving species base stats from data:
  - added `getLevelProgressionMultiplier(level)` with a much steeper progression,
  - rewrote `computeStatsAtLevel(...)` to scale all core stats aggressively by level.
- Reworked combat HP scaling:
  - updated `computeBattleHpMax(...)` to remove the old low cap behavior and follow the new growth,
  - calibrated so level ~40 can reach ~1M HP depending on species base HP (e.g. base HP 45 team-side ~1.01M).
- Reworked damage progression to match new HP values:
  - updated `computeDamage(...)` with a progression multiplier (`Math.pow(levelMultiplier, 0.8)`) so fights remain paced despite huge HP pools.
- Removed Route 1 x5 damage behavior:
  - removed Route 1 power multiplier path (`battlePowerMultiplier` flow).
- Added Route 1 forced level:
  - `pickEncounterLevel(...)` now returns level 1 when active route is `kanto_route_1`.
- Added dynamic compact number formatting (`K/M/B/T/Qa`):
  - new `formatCompactNumber(...)` helper,
  - used for enemy HP label, floating damage text, money HUD/floater, XP gain floaters, hover counters, and box info stats/counters.
  - fixed edge case so values around 1M display as `1M` instead of `1000K`.

## Validation (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (no new console/page error file generated).
- Targeted Playwright scenario (starter -> Route 1 -> combat) with skill client:
  - artifacts: `output/web-game-route1-scale/shot-0.png..shot-2.png` + `state-0.json..state-2.json`.
  - verified in text state: `route_id = kanto_route_1`, `enemy.level = 1`.
  - verified visual combat capture: Route 1 battle shows HP and floating damage rendering correctly (`output/web-game-route1-scale/shot-0.png`, `shot-2.png`).
- Quick formula sanity checks (scripted):
  - level 40 HP examples now in expected range (team-side):
    - base HP 45 -> ~1,011,278
    - base HP 60 -> ~1,347,654

## Additional progress (shop UX pass: wallet visibility + affordability feedback)
- Improved Shop modal structure in `index.html`:
  - Added a dedicated wallet strip in the shop modal header area with live values:
    - `Pokedollars` (`#shop-wallet-money-value`)
    - `Poke Balls` (`#shop-wallet-pokeballs-value`)
    - `Achat rapide` quantity (`#shop-wallet-qty-value`)
- Improved Shop runtime wiring in `game.js`:
  - Added new DOM bindings for the wallet strip fields.
  - Added `formatPokeDollarValue(...)` and `refreshShopWalletPanel(...)`.
  - Shop wallet now updates live from HUD updates and when rendering/changing shop tabs.
  - Quantity pill auto-hides outside `Poke Balls` tab.
- Improved per-item purchase UX in `game.js` (`createShopItemCard`):
  - Added item affordability state classes (`is-affordable`, `is-expensive`, `is-coming-soon`).
  - Added explicit missing-money feedback when purchase is not affordable ("Manque: ... Poke$").
- Improved Shop visual readability in `styles.css`:
  - Added new `shop-wallet-*` styles for the modal wallet strip.
  - Added card affordance visuals (affordable/expensive/coming-soon states).
  - Added stronger price chip styling for quicker price scanning.
  - Added responsive wallet layout behavior for mobile.

## Validation (shop UX pass)
- `node --check game.js`: PASS.
- develop-web-game Playwright client run with shop click:
  - command used with `--click-selector "#shop-btn"`
  - artifacts: `output/shop-ux-pass/shot-0.png`, `output/shop-ux-pass/shot-1.png`, `output/shop-ux-pass/state-0.json`, `output/shop-ux-pass/state-1.json`
  - state confirms `shop_open: true` in `state-1.json`.
- Additional full-page Playwright verification (manual script, same repo):
  - screenshot: `output/shop-ux-pass/shop-fullpage.png`
  - DOM state dump: `output/shop-ux-pass/shop-fullpage-state.json`
  - confirms:
    - `shopModalVisible: true`
    - `walletMoneyText: "0 Poke$"`
    - `walletPokeballsText: "0"`
    - `walletQtyText: "x1"`
    - `cardCount: 3`
- Regression smoke:
  - `./run_playwright_check.ps1`: PASS.

## Additional progress (mobile responsiveness overhaul for Shop)
- Reworked Shop mobile responsiveness with a dedicated final CSS override layer in `styles.css`.
- Main mobile UX changes:
  - modal now uses a stable full-height layout with explicit rows (`header`, `wallet`, `tabs`, `qty`, scrollable grid);
  - stronger touch targets for tabs, qty presets, and buy buttons;
  - improved typography scaling (`clamp`) for title/subtitle/prices/items;
  - card layout rebalanced for small screens (sprite + content + footer actions) with cleaner spacing;
  - quantity panel and custom input now scale correctly and stay usable on narrow widths;
  - safe-area bottom padding added in shop scroll zone for phone browser UI overlap.
- Layering/usability fix:
  - raised `.shop-modal` z-index to `120` so the shop is no longer obstructed by notification stack overlays on mobile.

## Validation (mobile responsiveness overhaul)
- develop-web-game client run (shop open flow):
  - artifacts: `output/shop-mobile-responsive/shot-0.png`, `shot-1.png`, `state-0.json`, `state-1.json`
  - confirms shop still opens and state export remains valid.
- Full-page mobile Playwright verification (412x915 viewport):
  - screenshots:
    - `output/shop-mobile-responsive/shop-mobile-fullpage-v2.png`
    - `output/shop-mobile-responsive/shop-mobile-scrolled-v2.png`
  - DOM state dump: `output/shop-mobile-responsive/shop-mobile-dom-state-v2.json`
  - confirms:
    - `shopOpen: true`
    - `walletMoneyText: "0 Poke$"`
    - `shopModalZIndex: 120` (above notification stack `96`).
- Regression smoke:
  - `run_playwright_check.ps1`: PASS.

## Additional progress (shop mobile compact scale pass)
- Applied a second mobile pass to reduce global Shop scale and free more vertical space for the Pokeball list/selection area.
- Updated mobile breakpoints in `styles.css` (`@media max-width: 900/760/430`) to compact:
  - modal paddings/gaps and header height,
  - subtitle/close button sizing,
  - wallet strip footprint,
  - tabs and quantity controls,
  - custom quantity row,
  - product cards, media blocks, stock text, and action buttons.
- Important UX tweak:
  - on mobile, wallet stays on a single row (3 columns) to avoid losing vertical space.
- Kept modal overlay priority fix:
  - `.shop-modal` remains above notifications (`z-index: 120`).

## Validation (compact scale pass)
- `run_playwright_check.ps1`: PASS.
- develop-web-game client run with shop click:
  - artifacts: `output/shop-mobile-responsive/state-1.json` (`shop_open: true`), no error file.
- Full-page mobile check (412x915):
  - screenshots:
    - `output/shop-mobile-responsive/shop-mobile-fullpage-v3.png`
    - `output/shop-mobile-responsive/shop-mobile-scrolled-v3.png`
  - layout state dump: `output/shop-mobile-responsive/shop-mobile-dom-state-v3.json`
  - key metrics:
    - `shop-grid` height: 431px
    - first item card height: 160px
  - confirms denser top controls and significantly larger visible selection/list area.

## Additional progress (team rename feature + mobile rename UI)
- Added a new `Renommer` action in the team context menu (`index.html`, `game.js`).
- Added a dedicated rename modal (`#rename-modal`) with mobile-friendly input UX:
  - cancel button, reset-to-original button, validate button,
  - character count (`0/24`) and hint text,
  - responsive layout/touch sizing for phone viewports.
- Implemented nickname persistence in save entities (`pokemon_entities`):
  - `normalizePokemonEntityRecord(...)` now reads/writes `nickname`,
  - `createPokemonEntityRecord(...)` initializes `nickname: ""`.
- Added nickname helpers in `game.js`:
  - `sanitizePokemonNickname(...)`, `getPokemonNicknameById(...)`, `getPokemonDisplayNameForOwnedEntity(...)`.
- Team display behavior:
  - ally team members now prefer nickname over species name,
  - enemies keep their species name (no nickname substitution on enemy side).
- Boxes display behavior:
  - box cards now show custom name as main line,
  - when custom name exists, original species name is shown in a smaller line below,
  - info panel header mirrors this (custom name + small original name).
- UI integration:
  - rename modal closes correctly with `Esc`, backdrop click, and modal transitions,
  - rename flow integrated with existing modal locking (`isCanvasBattleInteractionBlocked`).

## Validation (rename feature)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- develop-web-game client run with starter click:
  - artifacts: `output/rename-check/shot-0.png..shot-2.png`, `state-0.json..state-2.json`.
- Targeted Playwright validation (custom script, phone viewport):
  - rename modal open screenshot: `output/rename-check/rename-modal-open.png`
  - post-rename screenshot: `output/rename-check/rename-after-save.png`
  - reload persistence screenshot: `output/rename-check/rename-after-reload.png`
  - flow log confirms save+reload persistence (`team[0].name_fr = "Testchu"`): `output/rename-check/rename-debug.log`
- Targeted boxes rendering validation (custom script):
  - screenshot: `output/rename-check/rename-boxes.png`
  - log confirms box lines:
    - custom main name: `Testchu`
    - small original name: `Bulbizarre`
    - file: `output/rename-check/rename-boxes.log`

## Additional progress (combat team UI scale pass)
- Increased ally team HUD card scale in `computeLayout()` specifically for desktop/large viewports:
  - higher `teamHudScale` on non-phone profiles,
  - larger desktop clamp caps for `teamHudWidth`/`teamHudHeight`,
  - slightly taller team type chip lane.
- Increased ally card readability in `drawBattleUiOverlay()`:
  - desktop `nameFontSize` and `levelFontSize` increased,
  - desktop XP bar thickness increased.
- Kept phone sizing unchanged to avoid oversized mobile overlays.

## Validation (combat team UI scale pass)
- `node --check game.js`: PASS.
- develop-web-game client run (starter click path):
  - artifacts: `output/team-ui-scale-check-client/shot-0.png..shot-1.png`, `state-0.json..state-1.json`
  - no Playwright error file generated.
- Targeted Playwright flow (starter -> route next -> close tutorial -> fight) for desktop + mobile:
  - artifacts: `output/team-ui-scale-debug/desktop_03_after_wait_loop.png`, `mobile_03_after_wait_loop.png`
  - state confirms combat active with ally + enemy present on both profiles.
- Regression smoke:
  - `run_playwright_check.ps1`: PASS.

## Additional progress (low-level HP nerf tiers)
- Updated `computeBattleHpMax(...)` in `game.js` to apply low-level HP divisors:
  - level 1: HP / 5
  - level 2: HP / 4
  - level 3: HP / 2
  - level 4: HP / 1.5
  - level 5+: unchanged
- Applied after base HP max computation so the rest of the progression curve remains intact.

## Validation (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (no new console/page error files generated).
- Quick numeric sanity check script confirms effective ratios near requested targets (rounding-only drift):
  - lvl1 ~5x less, lvl2 4x less, lvl3 ~2x less, lvl4 1.5x less.

## Additional progress (capture chance + suspense)
- Added capture UI overlay during the capture animation that shows the base capture chance (percentage).
- Deferred capture rewards until the capture animation completes so the newly captured Pokemon only appears in the team after the suspense.
- Added hidden shiny capture bonus (not shown in the displayed %):
  - shiny: x1.5 effective catch chance
  - ultra shiny: x2 effective catch chance
- Extended the text-state snapshot with `capture_sequence.chance_display`.

## Validation (capture chance + suspense)
- `run_playwright_check.ps1`: PASS.
- Targeted capture run with save bridge: `run_playwright_capturechance.ps1`: PASS.
  - artifacts: `output/web-game-capturechance/shot-16.png`, `output/web-game-capturechance/shot-22.png`
  - state: `output/web-game-capturechance/state-16.json`, `output/web-game-capturechance/state-22.json`

## Additional progress (Gen 5 sprites + animated combat sprites)
- Extended `scripts_download_gen1_4_sprites.py` to add a Gen 5 sprite variant:
  - new variant id: `black_white` (PokeAPI `generation-v` / `black-white` / `animated`).
  - writes `.gif` files and records `animated: true` in `sprite_variants` for animated variants.
- Marked Gen 2 Crystal sprites as animated in data (`animated: true`) since Bulbagarden Crystal sprites are APNG.
- Renamed the transparent HOME variant label to `Home` (menu-facing).
- Updated `game.js` sprite variant parsing to carry the `animated` flag and:
  - keep animated sprite `Image` elements in a hidden DOM depot so their animations advance even when drawn on the canvas,
  - display `Home` for the HOME variant in the appearance menu (extra safeguard for older data).
- Starter flow tweak: choosing a starter now auto-switches to Route 1 when available (matches the UI message "Direction Route 1 !").
- Save bridge tweak: skip bridge write attempts when the bridge is offline to avoid noisy console errors during local runs/tests.

## Validation (Gen 5 sprites + animated combat sprites)
- `py -3 scripts_download_gen1_4_sprites.py`: PASS (dataset updated with Gen 5 sprites).
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright run (starter click + long wait) reaches Route 1 combat:
  - screenshot: `output/web-game-battle/shot-0.png`
  - state: `output/web-game-battle/state-0.json`

## Additional progress (Windows notif stock vide de Poke Balls)
- Extended the existing Windows notification system in `game.js` so it now covers:
  - shiny encounter/capture alerts
  - stock-empty alerts when total Poke Balls drops from `> 0` to `0`
- Added silent tracking of the loaded/reset ball total to avoid missing the alert on saves that start with only 1 Poke Ball.
- Hooked tracking into ball inventory updates:
  - buying/replenishing resets the tracked total
  - consuming the last ball sends a Windows notification with the current zone and last ball type used
- Updated the notification button tooltip/messages so the UI no longer says the feature is shiny-only.

## Validation (Windows notif stock vide)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright notification test with seeded save (`1` Poke Ball, Route 1, Notification API stubbed/granted): PASS.
  - result: emitted `Plus de Poke Balls`
  - body: `Ta derniere PokeBall vient d'etre utilisee. Zone: Route 1 (Kanto). Passe au Shop pour refaire le stock.`
  - screenshot: `output/web-game-pokeball-empty-notif.png`

## Additional progress (Windows notif seulement hors premier plan)
- Tightened `sendWindowsSystemNotification(...)` so Windows notifications are now suppressed while:
  - the game tab is visible
  - and the browser window still has focus on the game
- Result: shiny + stock-empty notifications only reach Windows when the game is no longer effectively in the foreground.
- Updated the notification button tooltip so it now explains the "hors premier plan" behavior.

## Validation (Windows notif focus/onglet)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright focus/visibility test with Notification API stubbed/granted: PASS.
  - scenario `focused_visible`: stock reached `0`, no Windows notification emitted
  - scenario `hidden_blurred`: stock reached `0`, emitted `Plus de Poke Balls`
  - screenshot checked: `output/web-game-notif-hidden.png`

## Additional progress (animated combat sprites fix)
- Corrected the earlier animated-sprite combat approach in `game.js`:
  - keeping animated images alive in the DOM was not enough once they were drawn to canvas;
  - replaced that attempt with explicit animated frame decoding + timeline playback for battle rendering.
- Added canvas-compatible animated sprite playback for the two animated families now present in data:
  - Gen 5 `black_white` GIF sprites
  - Gen 2 `crystal` APNG sprites
- Integrated lightweight decoder dependencies in `vendor/` and loaded them in `index.html`:
  - `vendor/omggif.js` for GIF decoding
  - `vendor/upng.js` + `vendor/pako.min.js` for APNG decoding
- Added animated frame caching, disposal handling, and per-entity frame resolution in `game.js` so combat sprites advance over time while still rendering inside the existing canvas pipeline.
- Added debug helper `window.__pokeidle_debug_getSpriteFrameIndex(...)` to validate that combat sprites really change frames in fight conditions.

## Validation (animated combat sprites fix)
- `run_playwright_check.ps1`: PASS.
- Targeted battle animation probe: PASS.
  - `black_white`: cache `ready`, `51` frames, observed frame change `3 -> 9`
  - `crystal`: cache `ready`, `14` frames, observed frame change `3 -> 5`
- Remaining note:
  - `output/web-game-poke/errors-0.json` still shows a generic browser `404` resource message without a resolved URL; animation playback itself is validated and working in battle.

## Additional progress (alpha.7 version sync)
- Bumped the app version to `0.1.0-alpha.7` across all version sources:
  - `version.js`
  - `package.json`
  - `package-lock.json`
- Fixed `scripts/bump-version.mjs` so future bumps keep the package metadata aligned with the in-game version instead of only editing `version.js`.
- Updated `.github/workflows/bump-version-on-main.yml` so the auto-bump commit now stages `package.json` and `package-lock.json` too.

## Validation (alpha.7 version sync)
- `node --check game.js`: PASS.
- `node --check scripts/bump-version.mjs`: PASS.
- `run_playwright_check.ps1`: PASS.

## Additional progress (shop Pokeball preset MAX)
- Added a new `MAX` Pokeball quantity preset in `index.html` + `game.js`.
- `MAX` is now computed per ball item price instead of behaving like a fake global quantity:
  - `PokeBall` with `950` Poke$ proposes `Acheter MAX (4)`
  - after the purchase, the same preset correctly falls back to disabled `Acheter MAX` when only `150` Poke$ remain
- Kept `Custom` intact and preserved the previous custom numeric value when switching to/from `MAX`.
- Updated the shop wallet summary so it shows `MAX` as the active quick-buy mode.
- Updated text-state export for automation/debug:
  - added `shop_ball_purchase_mode`
  - `shop_ball_purchase_qty` is now `null` when the selected mode is `MAX`, because the affordable quantity depends on the current ball card price

## Validation (shop Pokeball preset MAX)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright shop verification with seeded save: PASS.
  - before buy: `money=950`, wallet quick-buy label `MAX`, `PokeBall` button `Acheter MAX (4)`
  - after buy: `money=150`, `ball_inventory.poke_ball=4`, total `pokeballs=4`, `PokeBall` button disabled with `Acheter MAX`
  - screenshots checked: `output/shop-max-verify/shop-max-before-buy.png`, `output/shop-max-verify/shop-max-after-buy.png`
  - summary artifact: `output/shop-max-verify/shop-max-summary.json`
