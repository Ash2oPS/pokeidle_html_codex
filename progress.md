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
  - Starter modal appears with Bulbizarre / SalamÃƒÂ¨che / Carapuce, all level 5.
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

## Additional progress (save hardening + anti-hybrid fix)
- Refactored save backend policy so local play and public play are now intentionally separated:
  - local contexts (`localhost`, `127.0.0.1`, private IPv4, `file:`) now use the disk bridge as the single source of truth;
  - non-local/public contexts keep using browser `localStorage`;
  - local gameplay no longer arbitrates between bridge and per-origin `localStorage`, which removes the old mixed-backend behavior.
- Added shared save-origin policy helpers in `lib/save-origin-policy.js` and reused them in both the browser and `save_bridge_server.mjs`.
- Hardened the save bridge:
  - cross-OS save directory resolution (`APPDATA` / macOS Application Support / XDG data dir);
  - CORS now only allows local origins instead of `*`;
  - restoring from a readable backup now repairs `save_main.json` immediately.
- Added save consistency helpers in `lib/save-consistency.js` to repair impossible states before runtime:
  - missing team + owned Pokemon now reconstructs a valid team automatically;
  - orphaned progress without any owned/team Pokemon is treated as an incoherent save and reset to a clean new-game snapshot instead of producing a hybrid state.
- Removed the old "semi-reset" path in `initializeScene()`:
  - the game no longer persists a fake new game when runtime team hydration comes back empty;
  - if a save still cannot reconstruct any playable team after repair, the game now fails loudly instead of silently corrupting the save further.
- Added species identity persistence (`species_name_en`) on Pokemon entity records so locally saved owned species can be reloaded more reliably across sessions.
- Local save resets are now full resets:
  - browser local key is cleared when local disk save is authoritative;
  - `DELETE /save` is called for local bridge mode so both the main save and backups are wiped before recreating a fresh save.
- Bridge writes now retry instead of dropping the pending disk save as soon as one POST fails.
- Added a best-effort `sendBeacon` flush for page lifecycle persistence in bridge mode.

## Save validation
- `node --check game.js`: PASS.
- `node --check save_bridge_server.mjs`: PASS.
- `npm run test:save`: PASS.
  - covers origin policy, anti-hybrid consistency repair, backup restore + main-file repair, and bridge origin filtering.
- Develop-web-game Playwright validation with a seeded hybrid save (`tmp/save-integration-validation/PokeIdle/save_main.json`): PASS.
  - Launch context: local server + bridge mode.
  - Artifact: `output/save-recovery-validation/shot-0.png`.
  - Artifact: `output/save-recovery-validation/state-0.json`.
  - Verified result:
    - no starter modal (`starter_modal_visible: false`);
    - recovered team size is `2`;
    - old nickname preserved (`Briquet`, level 17);
    - route/progression remains on `kanto_route_8`;
    - backend reports `bridge_file`;
    - repaired disk save now has `starter_chosen: true` and `team: [4,16]`.
- Added `run_local_game_with_save.bat` as a Windows double-click / cmd wrapper around `run_local_game_with_save.ps1` using `powershell.exe -ExecutionPolicy Bypass`.
- Updated `run_local_game_with_save.ps1` so it now opens `http://127.0.0.1:<port>` automatically in the default browser once the save bridge and local web server are ready.
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

## Additional progress (zones FRLG + carte Kanto cliquable + stabilitÃƒÂ© des marqueurs)
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
- Ajustement backdrop Pokemon: cercle blanc fixe avec alpha 0.5, sans pulse, sans follow du breath/recoil d'attaque. VÃƒÂ©rifiÃƒÂ© via run Playwright (output/web-game-static-circle-check, shots 1..5), aucun errors-*.json.
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
    - Fresh game with SalamÃƒÂ¨che -> first visit Route 1 -> earn money naturally in combat.
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
- Investigated the reported Ã¢â‚¬Å“the longer the game stays open, the more it lagsÃ¢â‚¬Â issue with targeted probes:
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
- IntÃ©gration du talent dans les structures Pokemon:
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
- ImplÃ©mentÃ© une progression dÃ©diÃ©e pour les Ã©volutions `minHappiness`:
  - nouveau champ persistant par espÃ¨ce: `happiness_box_streak_ms` (normalisÃ© + crÃ©Ã© Ã  0 sur nouveaux records),
  - ajout d'une rÃ¨gle globale: condition bonheur validÃ©e Ã  `3h` (`HAPPINESS_EVOLUTION_BOX_REQUIRED_MS`) passÃ©es en boÃ®te,
  - mise Ã  jour continue du streak pendant la simulation (`updateHappinessEvolutionBoxProgress(deltaMs)`) uniquement pour les espÃ¨ces ayant au moins une Ã©volution bonheur,
  - reset immÃ©diat du streak si le PokÃ©mon est prÃ©sent dans la team,
  - intÃ©gration de la condition dans `isEvolutionMethodSatisfied` (suppression du blocage prÃ©cÃ©dent qui rejetait `minHappiness`).

## Validation (evolution bonheur via temps en boite)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Test ciblÃ© (boÃ®te noire, save seedÃ©e Meowth hors team, streak Ã  `3h - 10s`):
  - avant `advanceTime(10000)`: `notifications_evolution_ready = 0`,
  - aprÃ¨s `advanceTime(10000)`: `notifications_evolution_ready = 1`.
  - artefacts: `output/happiness-evolution-threshold-test.json`, `output/happiness-evolution-threshold-test.png`.
- Test ciblÃ© â€œdans la teamâ€ (Meowth en team, mÃªme streak seedÃ©):
  - avant `advanceTime(10000)`: `notifications_evolution_ready = 0`,
  - aprÃ¨s `advanceTime(10000)`: `notifications_evolution_ready = 0`.
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
  - `ice-stone` now maps to Ãƒâ€°voli -> Givrali only;
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

## Additional progress (Pokemon heights data)
- Added `height` to `download_pokemon_data.py` so future full dataset rebuilds keep the field in each Pokemon JSON.
- Added `scripts_download_pokemon_heights.py` to backfill the current `pokemon_data/*/*_data.json` files without re-running the full sprite download pipeline.

## Validation (Pokemon heights data)
- `py -3 -m py_compile download_pokemon_data.py scripts_download_pokemon_heights.py`: PASS.
- `py -3 scripts_download_pokemon_heights.py`: PASS.
  - `Pokemon JSON updated: 493`
  - `Missing pokemon directories: 0`
  - `Fetch errors: 0`
- Dataset verification: PASS.
  - `json_count=493`
  - `missing_or_invalid_height=0`
  - sample heights checked:
    - `100_voltorb -> 5`
    - `236_tyrogue -> 7`
    - `9_blastoise -> 16`
- `run_playwright_check.ps1`: PASS.
  - fresh smoke-test artifacts regenerated in `output/web-game-poke/` (`state-0..2.json`, `shot-0..2.png`)
  - no new Playwright failure introduced by the data update

## Additional progress (Pokemon size remap data)
- Added a derived `size` field to Pokemon JSON data.
- `size` is computed from `height` with a clamped remap on `[10, 100]`:
  - `10 -> 0`
  - `100 -> 1`
  - below `10` stays `0`
  - above `100` stays `1`
- Updated both the base generator and the local backfill script so future rebuilds and current dataset stay aligned.

## Validation (Pokemon size remap data)
- `py -3 -m py_compile download_pokemon_data.py scripts_download_pokemon_heights.py`: PASS.
- `py -3 scripts_download_pokemon_heights.py`: PASS.
  - `Pokemon JSON updated: 493`
  - `Missing pokemon directories: 0`
  - `Fetch errors: 0`
  - `Height fetches performed: 0`
- Dataset verification: PASS.
  - `json_count=493`
  - `invalid_size_count=0`
  - sample remap checks:
    - `1_bulbasaur: height=7 -> size=0.0`
    - `9_blastoise: height=16 -> size=0.0667`
    - `321_wailord: height=145 -> size=1.0`
- `run_playwright_check.ps1`: PASS.

## Additional progress (sprite scale driven by Pokemon data size)
- Wired the new Pokemon data `size` field into battle sprite rendering in `game.js`.
- The sprite visual scale now remaps `size` from `0..1` to a render multiplier of `0.8..1.2`.
- Scope kept intentionally narrow:
  - affects the Pokemon sprite render itself on canvas,
  - affects evolution sprite frames too for consistency,
  - does **not** resize HUD/UI elements such as HP bars, cards, labels, or slot layout.
- Added `sprite_scale` to `render_game_to_text` for enemy/team debug validation.

## Validation (sprite scale driven by Pokemon data size)
- `node --check game.js`: PASS.
- `run_playwright_capturechance.ps1`: PASS.
  - combat state confirms runtime sprite scale is exported:
    - `output/web-game-capturechance/state-20.json` shows `enemy.sprite_scale=0.8`
    - `output/web-game-capturechance/state-20.json` shows `team[0].sprite_scale=0.8`
  - no `errors-0.json` generated for this run.
- `run_playwright_check.ps1`: PASS.
- Data cross-check for bounds:
  - `pokemon_data/4_charmander/4_charmander_data.json` has `size=0.0` -> runtime scale target `0.8`
  - `pokemon_data/321_wailord/321_wailord_data.json` has `size=1.0` -> runtime scale target `1.2`

## Additional progress (talents CSV + gameplay talents)
- Updated `pokemon_data/pokemon_talents.csv` for talent rollout:
  - Replaced `[A traduire]` values with EN labels (`Keen Eye`, `Valiant Eye`, `Mind Control`, `Origin Mimicry`).
  - Assigned concrete talent IDs for active talents: `KEEN_EYE`, `VALIANT_EYE`, `MORPHING`, `MIND_CONTROL`, `ORIGIN_MIMICRY`.
- Added passive behavior mapping in `lib/combat-passives.js` for non-`NONE` attack talents:
  - `ACCURATE_ATTACK`, `VALIANT_ATTACK`, `MORPHING`, `MIND_CONTROL`, `ORIGIN_MIMICRY`.
  - Kept `LOSER` on `NO_ATTACK`.
- Implemented missing talent effects in `game.js`:
  - `KEEN_EYE`: cannot miss.
  - `VALIANT_EYE`: cannot miss + additional critical chance.
  - `MIND_CONTROL`: triggers an extra same-turn hit from a random ally that can attack.
  - `ORIGIN_MIMICRY`: attack type is copied from a random ally offensive type.
  - `MORPHING`: Ditto copies previous teammate base stats/sprite/offensive+defensive typing at Ditto level, with a purple/pink shader tint.
- UI update:
  - Added talent effect line to hover popup (`Effet talent: ...`) in addition to existing boxes panel display.
  - CSV comments are not surfaced in UI.
- Validation:
  - `node --check game.js` PASS.
  - `node --check lib/combat-passives.js` PASS.
  - Playwright capture run with save bridge + local server (`output/web-game-talents`) PASS.
  - State snapshot confirms `Roucool` uses `talent_id: KEEN_EYE` and `passive_behavior_id: ACCURATE_ATTACK`.

## Additional progress (capture XP flow without double reward)
- Updated `handleEnemyDefeated` in `game.js` so XP is granted exactly once per enemy defeat:
  - If no Pokeball is thrown: grant KO XP (`koXpReward`) as before.
  - If a Pokeball is thrown and capture succeeds: do **not** grant KO XP; grant only capture bonus XP (`captureBonusXpReward`) when capture reward is applied.
  - If a Pokeball is thrown and capture fails: grant KO XP (same reward as no Pokeball case).
- Added reward-guard logic (`xpRewardGranted`) to prevent any double XP grant in mixed paths.
- Refactored XP effect dispatch (level-up + floating XP text) through a shared helper to keep UI behavior consistent between KO and capture rewards.

## Validation (capture XP flow without double reward)
- `node --check game.js`: PASS.
- `run_playwright_capturechance.ps1`: PASS.
- Deterministic Playwright validation (isolated `browser_local_storage` mode on `127.0.0.1.nip.io` + forced RNG):
  - Scenario `no_ball`: `xpDelta=7`, `defeatedDelta=1`.
  - Scenario `capture_success`: `xpDelta=28`, `defeatedDelta=1`, `pokeballs 1 -> 0`.
  - Scenario `capture_fail`: `xpDelta=7`, `defeatedDelta=1`, `pokeballs 1 -> 0`.
  - Confirms no double XP on successful capture, and KO-equivalent XP on failed capture.

## Additional progress (ultra shiny odds update)
- Updated `ULTRA_SHINY_ODDS` in `game.js` from `4096` to `8192` so ultra shiny wild appearance rate is now 1/8192.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS (script exits 0; latest captures generated in `output/web-game-poke/`).

## Additional progress (bridge removal + browser save hardening)
- Removed the local disk save bridge system from the active codebase:
  - deleted `save_bridge_server.mjs`, `run_local_game_with_save.ps1`, and `run_local_game_with_save.bat`;
  - removed bridge-specific runtime logic and package script references.
- Browser save backend is now the only persistence path:
  - synchronous write-through to `localStorage`;
  - same-session mirror to `sessionStorage`;
  - async persistent mirror to IndexedDB with retry.
- Save loading now reconciles browser storage candidates by freshest `last_tick_epoch_ms`, then normalizes and rewrites the chosen payload across browser backends.
- Added production-vs-dev version detection:
  - GitHub Pages prod (`https://ash2ops.github.io/pokeidle_html_codex/`) keeps the plain version label;
  - every non-prod context (local server, file URL, other hosts) appends `dev-mode`.
- Added a dev-only `?dev_seed_save=...` bootstrap hook for local Playwright/debug flows without reintroducing a save bridge.
- Added tests for browser save candidate selection and GitHub Pages prod detection / `dev-mode` labeling.

## Additional progress (starter aura talents Overgrow/Blaze/Torrent)
- Added new starter-family talents in `pokemon_data/pokemon_talents.csv` with FR/EN naming and requested effects:
  - Overgrow tiers: `OVERGROW`, `OVERGROW_PLUS`, `OVERGROW_PLUS_PLUS` (Engrais / Engrais+ / Engrais++)
  - Blaze tiers: `BLAZE`, `BLAZE_PLUS`, `BLAZE_PLUS_PLUS` (Brasier / Brasier+ / Brasier++)
  - Torrent tiers: `TORRENT`, `TORRENT_PLUS`, `TORRENT_PLUS_PLUS` (Torrent / Torrent+ / Torrent++)
  - Applied to requested species across Gen 1/2/3/4 starter lines.
- Added passive behavior mapping aliases in `lib/combat-passives.js` so new talent IDs are recognized at runtime (`TEAM_AURA_ATTACK` behavior family).
- Implemented stacked team aura gameplay effect in `game.js`:
  - Each aura talent grants attack bonus to *other* team members with matching offensive type.
  - Bonuses stack cumulatively when multiple aura providers are present.
  - Applied as damage multiplier during hit resolution (`damageMultiplier: 1 + stackedBonus`).
- Added small visual feedback when aura bonus is active:
  - Type-colored pulsing ring/glow on team slots receiving a bonus (`drawTeamAuraIndicator`).
- Exposed aura bonus in exported text state for debugging:
  - `team_aura_attack_bonus_pct` per team member.
- Validation:
  - `node --check game.js` PASS.
  - `node --check lib/combat-passives.js` PASS.
  - Talent/passive mapping sanity check: no unresolved non-`NONE` talent IDs.
- Note:
  - Could not run end-to-end browser validation with save bridge in this turn because `save_bridge_server.mjs` is currently missing from workspace.

## Additional progress (first purchased Pokeball free + guaranteed capture)
- Added persistent save flags in `game.js`:
  - `first_free_pokeball_claimed`
  - `first_free_pokeball_guaranteed_capture_pending`
- Save lifecycle updates:
  - `createEmptySave()` now initializes both flags to `false`.
  - `normalizeSave(...)` now normalizes both flags and keeps backward compatibility for older saves.
  - `ensureMoneyAndItems()` now enforces boolean normalization for both fields during runtime economy normalization.
- Shop purchase logic updates:
  - Added first-purchase pricing helpers (`hasPendingFirstFreePokeballPurchase`, `getShopBallPurchasePricing`, `consumeFirstFreePokeballPurchaseBonus`).
  - The very first Pokeball purchase now discounts exactly one ball (free), including when money is `0`.
  - `MAX` quantity mode now includes this one-time free unit in affordability computation.
  - Shop card affordability/stock text now reflects the first free ball state (`1ere ball offerte`).
- Capture logic updates:
  - Added `consumePendingGuaranteedCaptureBonus()`.
  - `handleEnemyDefeated(...)` now consumes the pending first-free bonus on the next capture attempt and forces success (`captured = true`, `capture_chance_display = 1`).

## Validation (first free Pokeball + guaranteed capture)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Playwright e2e flow with seeded save (`money=0`, `pokeballs=0`, first-free flags disabled): PASS.
  - Before buy: `money=0`, `pokeballs=0`.
  - After first Pokeball buy: `money=0`, `pokeballs=1`.
  - First capture sequence phases observed: `throw -> shake -> success -> post` (no `break`).
  - Capture snapshot: `captured=true`, `chance_display=1`.
  - After capture: `pokeballs=0`.
  - Artifacts:
    - `output/first-free-ball-flow.json`
    - `output/first-free-ball-flow.png`

## Additional progress (UI stock balls in gameplay top-left)
- Removed the global topbar Pokeballs pill from `index.html` so stock is no longer shown in the upper panel.
- Added a new in-canvas overlay in `game.js` (`drawBallInventoryOverlay`) anchored at the top-left of the gameplay safe bounds.
- Overlay rows now render as requested:
  - always show `PokeBall` symbol + owned count,
  - show `SuperBall` and `HyperBall` only after they have been acquired at least once.
- Added persistent history tracking for this behavior via save field `ball_inventory_seen`:
  - initialized in empty saves,
  - normalized on load/migration,
  - auto-backfilled from current inventory counts,
  - updated on ball purchases (`addBallItems`) so visibility remains even when stock returns to 0.
- Removed old topbar Pokeballs HUD update logic from `updateHud()`.

## Validation (ball inventory overlay)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (script execution/exports OK).
- Targeted gameplay Playwright run with starter auto-click (`.starter-choice`): PASS.
  - artifacts: `output/web-game-ui-pokeballs/shot-0.png`, `output/web-game-ui-pokeballs/shot-1.png`
  - gameplay state confirmed (`starter_modal_visible=false`, `save_team_size=1`).
  - visual check confirms top-left gameplay overlay shows Pokeball icon + count and no topbar Pokeballs pill.
- Extra seeded validation for visibility memory (`ball_inventory_seen`) with all stocks at 0:
  - seed file: `output/seed_balls_seen.json`
  - artifact: `output/web-game-ui-pokeballs-seen/shot-0.png`
  - confirmed overlay shows 3 rows (Poke/Super/Hyper) at top-left even with `super_ball=0` and `hyper_ball=0`.

## Additional progress (arena startup load optimization)
- Optimized boot-time route asset loading in `game.js` to reduce initial page-to-arena latency:
  - Added route-scoped preload helpers (`getInitialAssetRouteIds`, `getRouteDataByIds`, `getRouteDataListFromInput`).
  - `initializeScene()` now preloads Pokemon definitions + route backgrounds only for initial critical routes (default route, Route 1 tutorial route, current route, and already unlocked routes), instead of preloading full catalog assets up front.
  - Added deferred idle warmup (`queueDeferredRouteAssetWarmup`) to load remaining route assets after the game is already interactive.
  - Updated `loadPokemonDefinitions(...)` with append mode so deferred warmup can progressively merge additional species definitions without resetting already loaded data.
- Expected impact:
  - Faster first interactive render and faster transition to playable arena state on page load.
  - Full route asset completeness is preserved via background warmup.

## Validation (arena startup load optimization)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
  - Fresh artifacts regenerated in `output/web-game-poke/` (`shot-0..2.png`, `state-0..2.json`).
  - Visual inspection: startup scene/starter flow still renders correctly.
- Note: existing generic browser `404` console resource error is still present in `output/web-game-poke/errors-0.json` (pre-existing, unchanged by this optimization).

## Additional progress (route on-demand fallback after deferred warmup)
- Added safety fallback loaders to avoid empty route states if deferred warmup is not finished yet:
  - new pending maps: `pendingRouteDefinitionLoads`, `pendingRouteBackgroundLoads`.
  - new route asset guards: `hasMissingRoutePokemonDefinitions`, `ensureRouteBackgroundLoaded`, `ensureRouteDefinitionsLoaded`, `ensureRouteAssetsLoaded`.
  - `setActiveRoute(...)` now triggers `ensureRouteAssetsLoaded(routeData)` so missing route assets are fetched on demand.
  - When route definitions finish loading and active battle had no enemy yet, enemy spawn is retried automatically (`state.battle.spawnEnemy()`), then HUD/render refresh.
- Result:
  - Keeps fast startup optimization while preventing combat dead-ends on routes that were not yet fully warmed.

## Validation (route on-demand fallback)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
  - Fresh artifacts regenerated in `output/web-game-poke/` (`shot-0..2.png`, `state-0..2.json`).
  - Visual inspection: startup/starter scene remains correct.
- Existing note unchanged: generic `404` resource console error still appears in `output/web-game-poke/errors-0.json`.
- Extra combat verification run after optimization: `run_playwright_capturechance.ps1`: PASS.
  - Seeded Route 1 save still enters active combat with enemy present (`output/web-game-capturechance/state-0.json`: `route_id="kanto_route_1"`, `enemy.id=19`, `mode="ready"`).
  - Late-run screenshot visually inspected: `output/web-game-capturechance/shot-89.png` (combat ongoing, no empty-arena regression).
  - `output/web-game-capturechance/errors-0.json`: no errors file generated.
- Added `only-one` encounter cycle logic in `game.js`:
  - Tracks per-zone cycle internally (hidden from UI).
  - On zone entry, cycle resets.
  - Spawns `only-one` encounters every 50th encounter (49 normal, then 1 `only-one`), then repeats.
- Added `only-one` combat modifiers:
  - `only-one` enemies now spawn with 10x `hpMax`.
  - `only-one` enemies now use a dedicated 120s timer.
- Added timer style propagation through `PokemonBattleManager` and rendering:
  - Timer state now includes a style key.
  - `only-one` timer renders with a purple bar.
- Playwright validation (develop-web-game skill):
  - Run 1: `output/web-game-onlyone-cycle`
    - Confirmed first special spawn at `defeats=49` (`state-339`, enemy 101 Electrode, `route_defeat_timer_duration_ms=120000`).
    - Confirmed repetition at `defeats=99` (`state-675`, same special timer and boosted HP).
    - Visual check: `shot-339.png` shows the purple timer bar.
  - Run 2 (timeout case): `output/web-game-onlyone-timeout`
    - Confirmed timer countdown on special until near zero (`state-383`, remaining ~758ms).
    - Confirmed timeout transition to next normal enemy (`state-384`) with timer off and no extra defeat granted (still `defeats=49` at transition).
    - Visual check: `shot-383.png` (purple timer visible) and `shot-384.png` (timer gone, normal encounter).
- Console/runtime notes:
  - No game console errors observed during these runs.
  - Node emitted a non-blocking module-type warning for the shared skill script path.

## Additional progress (ball capture menu + capture rule behavior)
- Implemented interactive ball-capture rules menu opened by clicking the in-game top-left ball inventory row.
- Added complete menu logic in `game.js`:
  - open/close/refresh for `#ball-capture-menu`;
  - per-ball-type rule editing (`capture_all`, `capture_unowned`, `capture_shiny`, `capture_ultra_shiny`);
  - lock behavior: when `capture_all=true`, the 3 selective toggles are forced to true and disabled.
- Wired canvas interactions:
  - hover detection on ball overlay hitboxes for pointer affordance;
  - left-click on overlay rows opens menu for that specific ball type;
  - outside-click and `Escape` now close the ball-capture menu;
  - team context menu and ball-capture menu now close each other to avoid overlap.
- Added export debug fields in `render_game_to_text`:
  - `ball_capture_menu_open`
  - `ball_capture_menu_ball_type`
  - `ball_capture_rules`
- Confirmed capture usage honors rules at runtime:
  - with all poke-ball capture rules set to false, defeats continue but pokeballs are not consumed;
  - when `capture_all` is re-enabled, defeats consume pokeballs again.

## Validation (ball capture menu + rules)
- `node --check game.js`: PASS.
- develop-web-game client smoke run: PASS.
  - Artifacts: `output/ball-capture-menu-smoke/` and `output/ball-capture-menu-open/`.
- Targeted Playwright toggle/locking validation: PASS.
  - Artifact: `output/ball-capture-menu-toggle/summary.json`.
  - Verified lock semantics and menu close on outside click.
- Targeted Playwright gameplay behavior validation: PASS.
  - Seed: `output/seed_capture_rule_behavior.json`.
  - Artifact: `output/ball-capture-rule-behavior/summary.json`.
  - Verified:
    - rules all false -> defeats increase while pokeballs stay unchanged;
    - `capture_all=true` -> defeats increase and pokeballs decrease.

## Additional progress (combat/economy rebalance focused on 6v1 scaling)
- Rebalanced core combat pacing constants in `game.js` to improve readability and progression feel:
  - `ATTACK_INTERVAL_MS`: `500 -> 420` (snappier baseline combat loop)
  - `DAMAGE_SCALE`: `1.7 -> 2.2`
  - damage level boost exponent now configurable via `DAMAGE_LEVEL_PROGRESSION_EXPONENT = 0.62`
- Reworked level/stat growth to remove runaway inflation while keeping power gain:
  - new `getLevelProgressionMultiplier(...)` model using linear + curved growth constants
  - adjusted `computeStatsAtLevel(...)` coefficients (HP/Atk/Def/SpA/SpD/Speed)
  - adjusted `computeBattleHpMax(...)` ratios/dividers for lower frustration at low team sizes
- Rebalanced progression/economy rewards:
  - `CAPTURE_XP_*`, `ENEMY_MONEY_*` raised and smoothed
  - `KO_XP_RATIO_OF_CAPTURE`: `0.2 -> 0.45` (KO progression less punishing when capture fails)
  - `getXpToNextLevelForSpecies(...)` curve softened (`5.2*l^2 + 18*l` -> `3.6*l^2 + 12*l`)
- Added explicit 6v1 balance layer (critical request):
  - `getActiveTeamSizeForBalance()`
  - `getEnemyHpTeamScaleMultiplier(...)`
  - `getEnemyRewardScaleMultiplier(...)`
  - wild enemy HP now scales with active team size (up to 6), and rewards scale accordingly
  - exported debug fields in `render_game_to_text`:
    - `enemy.balance_team_size`
    - `enemy.balance_hp_multiplier`
    - `enemy.balance_reward_multiplier`
- Rebalanced `only-one` spike encounters to avoid hard frustration walls:
  - `ONLY_ONE_ENCOUNTER_HP_MULTIPLIER`: `10 -> 3`
  - `ONLY_ONE_ENCOUNTER_TIMER_MS`: `120000 -> 150000`

## Validation (this turn)
- `node --check game.js`: PASS.
- `npm run test:save`: PASS.
- `run_playwright_check.ps1`: PASS.
  - starter flow still renders properly (`output/web-game-poke`).
- `run_playwright_capturechance.ps1`: PASS.
  - no console/page errors file generated.
  - runtime state confirms dynamic scaling fields:
    - early solo: `balance_hp_multiplier=1`, `balance_reward_multiplier=1`
    - after team growth: `balance_hp_multiplier=1.297/1.645`, rewards scaled accordingly.
- Extra targeted full-team balancing run (seeded): PASS.
  - artifacts: `output/web-game-fullteam-balance/`
  - observed `balance_hp_multiplier ~ 2.402` and `balance_reward_multiplier ~ 1.338` with multi-member team.
  - no console/page errors.
- Visual review done on latest gameplay captures:
  - `output/web-game-capturechance/shot-89.png`
  - `output/web-game-fullteam-balance/shot-20.png`

## Remaining TODO ideas
- Add a small in-game tuning panel (dev-only) exposing HP/reward scaling constants to iterate faster without code edits.
- Add route-tier contribution to scaling (optional) if late-game still feels too flat/too fast after player feedback.

## Additional progress (capture animation polish + ball-type colors)
- Improved capture animation feel in `game.js`:
  - smoother throw arc with luminous trail,
  - stronger shake readability with damped oscillation,
  - dynamic ball shadow/lift perception,
  - richer success pulse and ring feedback,
  - more expressive fail/break transitions.
- Ball visuals are now type-aware during capture animation:
  - `poke_ball` keeps classic red/white styling,
  - `super_ball` now renders with blue shell + red side marks,
  - `hyper_ball` now renders with dark shell + yellow stripe accents.
- Critical captures no longer override ball identity with a full rainbow top; ball type colors stay readable while critical glow remains present.
- Capture particles are now palette-driven by the launched ball type (success + break colors).
- Capture pipeline now forwards the launched ball type from gameplay logic to battle animation:
  - `handleEnemyDefeated(...)` returns `capture_ball_type`,
  - battle capture sequence stores `ballType`,
  - `getCaptureSequence()` exports `ball_type` for debug/test.

## Validation (capture animation + ball-type colors)
- `node --check game.js`: PASS.
- develop-web-game smoke run (`run_playwright_check.ps1`): PASS.
- Targeted Playwright color validation with seeded saves:
  - artifacts: `output/capture-ball-colors/summary.json`
  - screenshots:
    - `output/capture-ball-colors/poke_ball-throw.png`
    - `output/capture-ball-colors/super_ball-throw.png`
    - `output/capture-ball-colors/hyper_ball-throw.png`
  - verified `capture_sequence.ball_type` matches launched type in each scenario.

## Additional progress (attaque charge glow + ordre horaire + VFX projectiles)
- Combat readability update in `game.js`:
  - Removed the visual turn circle from gameplay render path (`drawTurnIndicator(...)` is no longer called).
  - Added a pre-attack charge glow (`getSlotChargeGlow`) so the upcoming attacker emits a short, pulsing aura just before firing.
  - Added a dedicated team charge effect renderer (`drawTeamAttackChargeGlow`) and integrated it into team rendering (backdrop boost + slight charge scale).
- Turn order/orientation consistency:
  - Kept slot turn logic deterministic (`0..MAX_TEAM_SIZE-1`) and remapped `computeLayout()` slot placement so slot progression follows a clockwise path.
  - Portrait mapping now follows top-left -> top-center -> top-right -> bottom-right -> bottom-center -> bottom-left.
  - Landscape mapping now follows left-top -> right-top -> right-mid -> right-bottom -> left-bottom -> left-mid.
  - This keeps the same directional turn flow when rotating between landscape and portrait.
- Projectile VFX polish by type:
  - Added per-type VFX profiles (`getProjectileTypeVfxProfile`) and type-specific motifs (`drawProjectileTypeMotif`) used during projectile render.
  - Added distinct visual signatures for all Pokemon types (fire/water/grass/electric/ice/fighting/poison/ground/flying/psychic/bug/rock/ghost/dragon/dark/steel/fairy/normal).

## Validation (attack visuals + order)
- `node --check game.js`: PASS.
- Skill Playwright run (seeded combat): `run_playwright_capturechance.ps1` PASS.
  - Artifacts refreshed in `output/web-game-capturechance/`.
  - No `errors-0.json` generated.
- Additional orientation consistency validation (Playwright custom viewport checks):
  - Artifacts: `output/orientation-order-check.json`, `output/orientation-landscape.png`, `output/orientation-portrait.png`, `output/orientation-landscape-projectile.png`, `output/orientation-portrait-projectile.png`.
  - `next_attacker_sequence` remained consistent and clockwise across both orientations in the captured runs.
- Additional projectile-visibility validation without capture phase:
  - Artifacts: `output/web-game-vfx-test/`.
  - Observed projectile samples for multiple types (`fire`, `normal`) and no Playwright error file generated.

## TODO / Next
- Optional: run one more targeted VFX showcase seed with a 6-member team covering more attack types in a single run (e.g. electric/water/psychic/rock) to visually review additional motifs in screenshots.

## Additional progress (notification sprites in in-game stack)
- Added Pokemon sprite support inside in-game notification cards (`game.js`):
  - New helpers `getNotificationPokemonId` and `getNotificationPokemonSpritePath`.
  - Notification renderer now builds a media row (`game-notif-body`) with optional sprite + text block.
- Extended notification payloads with Pokemon context:
  - `pushTemporaryNotification` now accepts and stores `pokemonId`, `pokemonIsShiny`, `pokemonIsUltraShiny`.
  - Evolution-ready notifications now carry `pokemonId` (source species).
  - First encounter/capture/shiny encounter/evolution success-fail notification calls now pass the related Pokemon id.
- Added styles in `styles.css` for sprite layout in notifications:
  - `.game-notif-body`, `.game-notif-content`, `.game-notif-sprite-wrap`, `.game-notif-sprite`.

## Validation runs (notification sprite update)
- `node --check game.js`: PASS.
- Develop-web-game client run (fresh origin via dedicated port):
  - `output/web-game-notif-sprite` and `output/web-game-notif-sprite-starter`: PASS (no console/page errors).
- Extra Playwright DOM verification (full-page capture from skill environment):
  - Result: `notifCount: 3`, `spriteCount: 1`.
  - Captured file: `output/web-game-notif-sprite-dom/fullpage-notif-check.png`.

## TODO / Next suggestions
- Add sprite support to grouped evolution summary cards if we ever want to show one representative species there.
- Consider adding optional sprite to generic `setTopMessage` calls when contextual Pokemon data is available.

## Additional progress (2026-03-12 shiny odds update)
- Updated shiny encounter odds in `game.js`: `SHINY_ODDS` changed from `1024` to `2048` (target rate: 1/2048).
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS (no Playwright console/page errors; latest screenshot reviewed: `output/web-game-poke/shot-2.png`).

## Additional progress (0.1.1 stable + legacy save reset)
- Bumped app version to stable `0.1.1` (removed prerelease alpha marker):
  - Updated `version.js` version constant.
  - Updated `package.json` / `package-lock.json` version metadata.
- Added semver helpers in `version.js` (`parseSemver`, `compareSemver`, `isVersionAtLeast`) for deterministic app-version compatibility checks.
- Enforced save compatibility gate in `game.js`:
  - Added `MIN_SUPPORTED_SAVE_APP_VERSION = "0.1.1"`.
  - Saves now include `app_build_version` in newly created/normalized/persisted payloads.
  - Any save older than `0.1.1` is considered unsupported and is discarded at boot.
  - Unsupported storage entries are actively removed from local/session storage; IndexedDB stale entries are deleted.
- Fixed an obvious runtime regression found during validation:
  - `item_data/pokeballs.csv` had mixed line endings causing PapaParse `TooManyFields` and fallback config usage.
  - Normalized CSV lines, restoring successful ball CSV loading (`ball_csv_loaded: true`).

## Validation (this pass)
- `node --check version.js`: PASS
- `node --check game.js`: PASS
- `npm run test:save`: PASS (10/10)
- Develop-web-game Playwright client smoke:
  - Starter click flow run (`output/web-game-011-smoke`): PASS
  - No `errors-*.json` produced.
  - `render_game_to_text` confirms:
    - `app_build_version: "0.1.1"`
    - `app_version: "0.1.1 dev-mode"`
    - battle loop active after starter selection.
- Legacy save compatibility run (`output/web-game-legacy-seed-check`): PASS
  - Seeded pre-0.1.1 save is rejected at startup.
  - Game starts in fresh state (starter modal visible, empty team), then persists 0.1.1 save data.

## Additional progress (2026-03-12 XP progression slowdown for farming)
- Rebalanced XP progression in `game.js` to make leveling meaningfully slower and more farm-oriented:
  - `CAPTURE_XP_BASE`: `20 -> 10`
  - `CAPTURE_XP_LEVEL_MULT`: `10 -> 5`
  - `CAPTURE_XP_STAT_FACTOR`: `0.055 -> 0.024`
  - `KO_XP_RATIO_OF_CAPTURE`: `0.45 -> 0.3`
- Increased XP required per level in `getXpToNextLevelForSpecies(...)`:
  - requirement formula changed from `(36 + level^2 * 3.6 + level * 12) * growth`
  - to `(58 + level^2 * 5.8 + level * 18) * growth`
  - minimum requirement changed from `36` to `58`.

## Validation (XP slowdown pass)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (no Playwright failure).
- Targeted seeded combat run with valid `0.1.1` save (`output/web-game-xp-balance-check`): PASS.
  - Confirmed combat state on Route 1 with active enemy.
  - Confirmed significantly higher XP requirements in text state:
    - level 20 member `xp_to_next: 3927` (previous balancing baseline was around `2461`)
    - level 1 member `xp_to_next: 109` (previous balancing baseline was around `68`)
  - Visual screenshot reviewed: `output/web-game-xp-balance-check/shot-11.png`.

## Additional progress (2026-03-12, super/hyper balls purchasable)
- Updated `createDefaultBallConfigByType()` in `game.js`:
  - `super_ball.comingSoon` set from `true` to `false`.
  - `hyper_ball.comingSoon` set from `true` to `false`.
- Updated `item_data/pokeballs.csv`:
  - `super_ball` row `coming_soon` set from `true` to `false`.
  - `hyper_ball` row `coming_soon` set from `true` to `false`.
- Verification:
  - Ran `./run_playwright_check.ps1` (skill client). Output state confirms:
    - `ball_configs.super_ball.coming_soon = false`
    - `ball_configs.hyper_ball.coming_soon = false`
  - Ran a seeded Playwright check with `shop_open = true` and high money (`output/web-game-shop-buyable/state-0.json`), confirming both ball configs remain non-coming-soon in runtime state.
  - Ran `npm run test:save`: 10/10 tests passed.

## Additional progress (2026-03-12, uncapped render loop to 60 FPS)
- Goal: remove render-side FPS cap (~40-45 observed) and target 60 FPS display cadence across all quality levels.
- Changes in `game.js`:
  - Added `TARGET_RENDER_INTERVAL_MS = Math.round(TARGET_FRAME_MS)`.
  - Updated `RENDER_QUALITY_PRESETS` so `renderFrameIntervalMs` is `TARGET_RENDER_INTERVAL_MS` for all presets (`ultra`, `high`, `medium`, `low`, `very_low`).
  - Kept quality adaptation on render scale/effects only, without throttling render cadence per quality.
- Verification:
  - Ran `./run_playwright_check.ps1`.
  - Runtime state (`output/web-game-poke/state-2.json`) now reports:
    - `render_frame_ms_estimate: 16.69`
    - `render_fps_estimate: 59.9`
    - `render_quality: low` (proves 60 FPS cadence is no longer tied to high quality preset only).
  - Visual screenshot check: `output/web-game-poke/shot-2.png` shows in-game overlay at `60 FPS`.
  - Ran `npm run test:save`: 10/10 tests passed.

## Additional progress (2026-03-12, full Pokemon sprite tight-crop batch)
- Added `scripts/crop_pokemon_sprites.py` to crop all Pokemon sprites in `pokemon_data/*/sprites`:
  - Static `.png`: crop to the exact alpha-visible bounding box (`alpha > 0`).
  - Animated `.gif`: compute a single union bounding box across all frames, then crop every frame with that same box.
- Batch execution results:
  - Dry-run: `total=8237`, `png=7251`, `gif=986`, `changed=7119`, `unchanged=1118`, `failed=0`.
  - Write pass: `total=8237`, `changed=7119`, `failed=0`.
  - Post-check dry-run: `changed=0` (idempotent after write).
- Tightness verification:
  - Full re-scan script confirms `files=8237`, `not_tight=0`, `fail=0` (no remaining transparent margin that can be cropped).
- Smoke validation after asset rewrite:
  - Ran `run_playwright_check.ps1`, `run_playwright_projectile.ps1`, `run_playwright_long.ps1`: PASS (no Playwright failure exit).
  - Reviewed latest screenshots (`output/web-game-poke/shot-2.png`, `output/web-game-projectile/shot-0.png`, `output/web-game-long/shot-0.png`) to confirm game still renders correctly.

## Additional progress (2026-03-12, Coins currency + top-right currency UI)
- Added a new persistent currency `coins` in save data:
  - `createEmptySave()` now initializes `coins: 0`.
  - Save normalization now reads legacy saves with `coins` fallback to `0`.
  - `ensureMoneyAndItems()` now clamps `coins` to a non-negative integer.
- Added coin gain rules in gameplay logic:
  - Successful capture: `+1 coin`.
  - First-ever capture of that species: additional `+5 coins`.
  - Evolution trigger from notification: `+3 coins`.
- Wired coin economy in combat/capture flow:
  - Added `addCoins(amount)` helper.
  - Capture rewards are applied both in idle and delayed capture completion paths.
  - Starter auto-grant capture path also awards capture coins consistently.
- HUD/UI updates:
  - Removed the save-backend type display from top-right UI (save type interface no longer shown).
  - Replaced the Pokédollars block with a compact counter style using symbol `?`.
  - Added a `Coins` counter directly below Pokédollars in the same top-right stack.
  - Added dedicated CSS overrides for the new currency stack and compact pill visuals.
- Debug state output (`render_game_to_text`) now includes:
  - `coins`
  - `coins_display_value`

## Validation (Coins/UI pass)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (no script failure).
- Visual note: the standard test screenshots in this project are canvas-focused and do not reliably capture DOM HUD overlays; logic/state checks were validated through code paths and debug output fields.
- Post-change regression check: `npm run test:save` PASS (10/10).

## Additional progress (2026-03-12, capture_unowned by evolution family)
- Updated Pokeball targeting logic for `capture_unowned`:
  - Added `isEvolutionFamilyOwned(pokemonId)` helper in `game.js`.
  - `shouldCaptureEnemyWithBallType` now checks ownership at evolution-family level instead of only same-species ownership.
- Intended behavior now matches example:
  - If Aspicot is already owned and enemy is Coconfort, `capture_unowned` alone will not throw/capture.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Reviewed latest screenshot artifact: `output/web-game-poke/shot-2.png` (render remains stable).

## Additional progress (2026-03-12, mobile HUD shrink for currency + timer)
- Mobile HUD compacting pass applied:
  - Reduced top-right currency stack dimensions on small/coarse-pointer devices (money + coins pills, icon and text sizes).
  - Added tighter overrides for very small screens (<= 520px).
- Route defeat timer compact mode:
  - Added compact sizing branch in `drawRouteDefeatTimerBar` for coarse-pointer/small viewport.
  - Reduced timer bar width/height, panel padding, timer text size, and counter text size/offset.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.

## Additional progress (2026-03-13, GitHub update checker + blocking popup)
- Added a new client-side update checker module: lib/github-update-checker.js.
  - Sends GitHub API requests to detect the latest version from repo default branch.
  - Reads version.js first, falls back to package.json when needed.
  - Compares local POKEIDLE_APP_VERSION against remote semver.
  - Runs once on startup, then every 5 minutes.
- Added repo inference support in version.js.
- Integrated checker into bootstrap (game.js) via initializeGithubUpdateChecker({ currentVersion: APP_VERSION }).
- Added a full-screen blocking update popup style in styles.css.
- Interaction lock behavior when popup is visible:
  - Non-closable modal.
  - Blocks keyboard/mouse/touch interactions with the game.
  - Refresh button performs forced reload with cache-busting query params.

## Additional progress (sprite stretch fix: notifications + boites)
- Fixed sprite ratio handling in UI cards to prevent stretched Pokemon visuals:
  - Updated `.game-notif-sprite` to `width/height: auto`, `max-width/max-height: 100%`, `object-fit: contain`, centered with `object-position`, and `display: block`.
  - Updated `.boxes-mon-btn img` with the same ratio-safe rules.
  - Updated the mobile override for boxes sprites from fixed `56x56` to `max-width/max-height: 56px` to preserve intrinsic ratio.
- Validation:
  - `run_playwright_check.ps1`: PASS (screenshots/states produced, no new errors file generated).
  - Seeded Playwright run with deterministic interaction to open boxes: PASS (`boxes_open: true` reached in probe runs such as `output/boxes-probe-open_x540_y360/state-0.json`).
  - Confirmed no console/page error files in the new targeted runs.
- Notes:
  - Seeded saves now require `app_build_version` (>= `0.1.3`) to be accepted by dev seed loading.
## Additional progress (level-diff anti-farm rewards)
- Implemented hidden anti-farm reward scaling based on level difference (`enemy level - team level`) in `game.js`.
- XP scaling now applies per team member (not global):
  - `>= 0`: x1.00
  - `-1..-5`: x0.75
  - `-6..-15`: x0.40
  - `-16..-30`: x0.15
  - `<= -31`: x0.05
- Money scaling now uses the highest team level as reference and enforces a minimum multiplier floor of `x0.35`.
- Coin reward chance on capture now scales with the same level-diff profile and enforces a minimum final chance floor of `10%`.
- No UI surfaced for this mechanic (no new HUD text or visual indicator).

## TODO / Next (after level-diff anti-farm)
- Validate with Playwright seeded combat runs and inspect reward pace over multiple captures.
- Optional: expose debug-only telemetry in `render_game_to_text` behind a dev flag if balancing iterations become frequent.
## Validation log (level-diff anti-farm)
- `node --check game.js`: PASS.
- `npm run test:save`: PASS (10/10).
- `run_playwright_check.ps1`: PASS (no regressions observed on startup flow).
- `run_playwright_capturechance.ps1`: script runs, but seeded save payload is currently rejected by runtime save compatibility checks (missing `app_build_version`), so this run did not cover combat behavior.
- Added targeted seeded Playwright combat checks (custom run, 120 iterations each) with valid save payloads:
  - High-level team seed (`Salameche lv50` on Route 1): `money=120`, `enemies_defeated=8`, `money/KO=15`, `xp team slot0=8`.
  - Low-level team seed (`Salameche lv1` on Route 1): `money=262`, `enemies_defeated=6`, `money/KO=43.67`, `xp team slot0=69`.
  - Result confirms strong reward nerf when overleveled, while gameplay flow remains stable.
- Visual inspection done on latest captures:
  - `output/web-game-leveldiff-high/shot-119.png`
  - `output/web-game-leveldiff-low/shot-119.png`

## Additional progress (2026-03-13, Jackpot + Teleport talents)
- Added new talent support in `game.js`:
  - `JACKPOT` (x1.2 money), `JACKPOT_PLUS` (x1.4 money).
  - `TELEPORT` (10%), `TELEPORT_PLUS` (20%), `TELEPORT_PLUS_PLUS` (30%) post-attack swap chance.
  - `TELEPORT_PLUS_PLUS` now grants x1.5 damage to the swapped ally's next attack (consumed on use).
- Integrated reward modifier logic:
  - Defeat money now includes active-team talent money multiplier (`getTeamMoneyTalentMultiplier`).
  - Talent effects are runtime-only from active battle team (no UI exposure added).
- Added teleport swap battle flow:
  - Slot swap utility in `PokemonBattleManager`.
  - Swap VFX (`teleport_trail`, rings/sparks), plus quick scale-down/up teleport animation.
  - Alakazam boost aura rendering on boosted ally until its next attack is consumed.
  - Turn-event telemetry now includes `teleport_swap`, source/target slots, boosted slot, and consumed boost percent.
- Added passive behavior aliases in `lib/combat-passives.js`:
  - `JACKPOT` / `JACKPOT_PLUS` recognized as normal attack behavior.
  - Teleport talents mapped to `TELEPORT_SWAP` behavior id for debug/combat decision consistency.
- Updated `pokemon_data/pokemon_talents.csv` entries:
  - #52 Meowth -> `JACKPOT`
  - #53 Persian -> `JACKPOT_PLUS`
  - #63 Abra -> `TELEPORT`
  - #64 Kadabra -> `TELEPORT_PLUS`
  - #65 Alakazam -> `TELEPORT_PLUS_PLUS`
- Fixed blocking CSV runtime issue:
  - `pokemon_talents.csv` had mixed LF/CRLF after edits, causing PapaParse quote errors and `talents_csv_loaded=false`.
  - Normalized file newlines to consistent CRLF; talent CSV now parses correctly in runtime (`talents_csv_loaded=true`).

## Validation log (Jackpot + Teleport)
- `node --check game.js`: PASS.
- `npm run test:save`: PASS (10/10).
- `./run_playwright_check.ps1`: PASS (no new console/page errors).
- Targeted talent runs:
  - `./tmp/run_talent_validation.ps1`:
    - `output/web-game-jackpot-validate`
    - `output/web-game-control-validate`
    - `output/web-game-teleport-validate`
    - all ran full iterations, no `errors-*.json`.
  - Jackpot no-capture compare (`./tmp/run_jackpot_compare.ps1`):
    - `output/web-game-jackpot-nocap-validate`: Meowth only, `talents_csv_loaded=true`, money/KO delta `151.667`.
    - `output/web-game-control-nocap-validate`: Rattata only, `talents_csv_loaded=true`, money/KO delta `123.667`.
    - observed ratio is consistent with Jackpot money uplift.
  - Teleport tier scenarios (`./tmp/run_teleport_tiers_validation.ps1`):
    - Abra/Kadabra/Alakazam seeded on Route 24 with no captures.
    - Teleport swap events confirmed for teleport talents; no boost events observed outside Alakazam scenarios.
  - Alakazam boost consumption confirmed in `output/web-game-teleport-validate`:
    - event with `teleport_damage_boost_pct: 50` observed after prior teleport swap.

## Additional progress (2026-03-13, XP display timing at end of capture animation)
- Fixed capture reward timing in `handleEnemyDefeated(...)` (`game.js`):
  - Failed capture path now defers KO XP reward to `capture_on_complete` (end of capture animation), matching the successful capture path behavior.
  - Added `deferKoXpRewardToCaptureEnd` guard to prevent immediate fallback XP grant when a failed capture has a deferred completion callback.
- Added render safety to avoid XP reveal during active capture animation:
  - `drawTeamXpGainEffects()` and `drawTeamLevelUpEffects()` are now skipped while `captureSequence` is active.
  - This prevents lingering XP/level-up VFX from appearing during throw/shake/reappear phases and leaking capture outcome cues.

## Validation (XP capture timing pass)
- `node --check game.js`: PASS.
- `npm run test:save`: PASS (10/10).
- `run_playwright_capturechance.ps1`: PASS (client run completed; existing warning about skill package module type).
- Targeted Playwright probe with valid seeded save (`output/xp_timing_probe_result.json`):
  - Captured both outcomes and phases (`throw/shake/success/break/reappear/post`) over many defeats.
  - XP reward application is now deferred to capture completion callback for failed captures (same end timing model as successful captures).
  - Note: runtime `team_xp_gain_effects_active` can remain >0 in some capture states due lingering counters from previous rewards, but XP/level-up VFX are now gated from rendering during active `captureSequence`.

## Additional progress (family shiny/ultra sync)
- Updated appearance mode toggles in `game.js` so shiny and ultra shiny now sync across the full evolution family of the selected Pokemon.
  - Added `applyAppearanceModesToEvolutionFamily(pokemonId, { shinyMode, ultraShinyMode })`.
  - `toggleAppearanceShinyMode()` now applies the same shiny state to every family member and disables ultra shiny for the whole family when shiny is turned off.
  - `toggleAppearanceUltraShinyMode()` now applies the same ultra shiny state to every family member and keeps shiny enabled when ultra shiny is enabled.
  - Added a team-wide appearance asset preload after mode toggles to avoid stale sprite caches on family members already in team.
- Updated top messages to explicitly mention family-wide mode sync.

## Validation runs (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS (artifacts refreshed in `output/web-game-poke/`).
- Note: Playwright smoke reported a browser `console.error` 403 resource load in `output/web-game-poke/errors-0.json`.

## Additional progress (2026-03-13, team swap family lock)
- Updated team box swap rules in `game.js` to block placing a Pokemon if another team slot (except the slot being replaced) already contains a member of the same evolution family.
- Added `findTeamFamilyConflictSlotIndex(candidatePokemonId, ignoredSlotIndex)` to centralize family conflict detection against current team slots.
- In `renderBoxesGrid()`:
  - Candidate buttons are now disabled when family conflict exists.
  - Tag now shows `Famille deja en slot X` for blocked family conflicts.
  - Click guard now blocks family duplicates with top message: `Impossible: un Pokemon de la meme famille est deja dans l'equipe.`
  - Kept direct swap exception: replacing a slot member with another member of the same family is allowed because the target slot is ignored during conflict check.

## Validation (team swap family lock)
- `npm run test:save`: PASS (10/10).
- `web_game_playwright_client.js` run with local server and actions payload: generated `output/web-game-family/shot-0.png`, `state-0.json`, `errors-0.json`.
- Screenshot and text state reviewed.
- Note: run still reports existing browser `console.error` 403 resource load (`output/web-game-family/errors-0.json`); feature change does not touch resource loading paths.
- `run_playwright_check.ps1`: PASS (artifacts refreshed in `output/web-game-poke/`; same existing 403 resource console error observed in `errors-0.json`).

## Additional progress (boxes mobile compact pass)
- Reworked the `Boites` modal mobile behavior to preserve visible grid space on phone screens.
- Added a dedicated responsive pass for boxes with breakpoint-specific sizing at `900px`, `760px`, and `430px`.
- Forced the lower info section into a bounded row (`clamp(...)`) so it no longer expands with long stat text.
- Tuned mobile spacing and typography for header, cards, and info panel to keep entries readable without wasting vertical space.

## Validation runs (boxes mobile compact pass)
- `run_playwright_check.ps1`: PASS (game still boots and baseline screenshots/state generate).
- Manual mobile UI capture with Playwright environment: `output/ui_mobile_boxes_after.png`.
  - Confirmed: boxes grid now keeps most of the height on phone.
  - Confirmed: bottom info panel remains scrollable/readable and does not eat the whole modal.

## Additional progress (2026-03-13, mobile team context menu fit + nickname spaces)
- Fixed mobile/context menu overflow behavior:
  - Updated `positionFloatingMenuElement(...)` in `game.js` to handle oversized floating menus safely.
  - Added viewport-safe clamping with explicit fallback anchors when menu dimensions exceed available width/height.
- Improved context menu CSS responsiveness in `styles.css`:
  - `team-context-menu` now has responsive width constraints, viewport max-height, and internal scrolling.
  - Added mobile/coarse-pointer compact sizing (reduced padding/font/button heights).
  - Enabled button text wrapping to avoid oversized multiline overflow.
- Fixed nickname input sanitization so spaces are usable on mobile:
  - `sanitizePokemonNickname(...)` now supports `{ trimEdges: false }` for live typing (prevents trailing-space deletion while entering multi-word names).
  - Kept final save behavior trimmed (default sanitize path still trims edges when applying rename).
  - Added normalization of non-breaking and unicode spaces to regular spaces.
  - Rename character counter now measures the live input variant (`trimEdges: false`).

## Validation (mobile context + rename spaces)
- `node --check game.js`: PASS.
- Standard skill smoke run: `./run_playwright_check.ps1`: PASS (same pre-existing `console.error` 403 resource warning in `output/web-game-poke/errors-0.json`).
- Targeted mobile viewport Playwright validation (390x844, seeded team save): PASS.
  - Script: temporary Playwright probe (removed after run).
  - Artifact: `output/mobile-context-rename-fix/result.json`.
  - Screenshots:
    - `output/mobile-context-rename-fix/menu-open-mobile.png`
    - `output/mobile-context-rename-fix/after-rename-mobile.png`
  - Confirmed:
    - Team context menu opens and stays fully inside viewport (`withinViewport: true`).
    - Typing keeps trailing space during entry (`afterSpace: "Pika "`).
    - Final submitted nickname with space persists and renders (`"Pika chu"`).

## Additional progress (projectile trails type + perf)
- Added optimized projectile-trail sampling in `PokemonBattleManager.updateProjectiles`:
  - Trail points are now spawned by traveled distance (pixel spacing) instead of every frame.
  - Added per-projectile `trailStepDistance` and `trailCarryDistance` to reduce churn while keeping visual continuity.
  - Trail point payload now includes tiny cached variance (`phase`, `scale`) for richer visuals at minimal runtime cost.
- Added type-driven trail VFX profiles (`getProjectileTrailTypeVfxProfile`) reusing projectile type motifs/accent colors.
- Updated trail rendering (`drawProjectiles`) with lightweight, type-dependent trail stamps:
  - ember / droplet / leaf / spark / shard / dust / wisp / sparkle / streak
  - all styles remain quality-aware and use existing quality toggles.
- Added helper utilities:
  - `createProjectileTrailPoint(x, y)`
  - `blendRgb(baseColor, accentColor, blendRatio)`

## Validation runs (projectile trail update)
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (10/10).
- `run_playwright_projectile.ps1`: PASS launch; generated artifacts under `output/web-game-projectile`.
- Focused Playwright run with starter+route click script (`output/web-game-projectile-trails`):
  - combat state reached (`route_id: kanto_route_1`, `route_combat_enabled: true`, attacks/impacts active).
  - screenshot reviewed.
- Note: intermittent `update-required-modal` can block automated starter clicks on some runs (GitHub version check timing).

## Additional progress (2026-03-13, terrain sprite common PPU harmonization)
- Implemented a shared sprite pixels-per-unit sizing pass for battlefield Pokemon rendering (enemy + team), while keeping per-Pokemon size multiplier (`spriteScaleValue`) applied afterward.
- Added a common PPU baseline (`POKEMON_SPRITE_COMMON_PPU`) and final render size helper so every terrain sprite now follows:
  - common PPU normalization from source pixel dimensions
  - then Pokemon-specific size multiplier
- Added opaque-bounds analysis and caching for sprite sources:
  - static image sources now compute/use cached opaque bounds
  - animated sources now compute max opaque bounds across decoded GIF/APNG frames
- Animated sprite pipeline updated so decoded frame entries carry `opaqueWidth/opaqueHeight`, and draw-source resolution returns these metrics to the renderer.
- `drawPokemonSprite(...)` now uses the new shared PPU render-size helper.
- `drawEvolutionSpriteFrame(...)` updated to reuse the same render-size logic and animated frame source resolution (consistency with terrain sprite sizing).

## Validation runs (common PPU sizing)
- `node --check game.js`: PASS.
- `web_game_playwright_client.js` run with no-input actions (`tmp/noop_actions.json`): PASS.
  - Artifacts: `output/web-game-ppu-check/shot-0.png`, `state-0.json`.
- Seeded combat run (Route 1 + team) with shared PPU sizing: PASS.
  - Artifacts: `output/web-game-ppu-check/shot-0.png..shot-2.png`, `state-0.json..state-2.json`.
  - Confirmed combat state in text output (`route_id: kanto_route_1`, `route_combat_enabled: true`, enemy/team present).
- Seeded animated-variant run (`black_white`) to validate animated sprite sizing path: PASS.
  - Artifacts: `output/web-game-ppu-check-animated/shot-0.png..shot-2.png`, `state-0.json..state-2.json`.
  - Confirmed selected animated variant in text output (`team[0].sprite_variant_id: "black_white"`).
## Additional progress (enemy HP bar width stability)
- Fixed enemy HP HUD layout in `game.js` (`drawEnemyHpBar`): the numeric value area now has a fixed reserved width.
- The HP track width no longer depends on `measureText(hpLabel)`, preventing visual bar-size jumps when label length changes (example: `9.69K/33.8K` -> `9K/33.8K`).
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS (no blocking runtime failure).
  - Custom starter->Route1 run (`output/hpbar-fix-check/shot-0.png`) reviewed visually: enemy HP HUD renders correctly with fixed track region.
- Note: Playwright console reported an existing `403` resource error during custom run (`errors-0.json`).

## Additional progress (2026-03-13, redo Peau Metal shop item after discard)
- Re-added `metal_coat` entry in `item_data/shop_items.csv` with:
  - `name_fr`: `Peau Metal`
  - `item_type`: `stone`
  - `price`: `100000`
  - `sprite_path`: `assets/items/metal_coat.png`
  - `method_item`: `metal-coat`
  - `sort_order`: `100`
- Re-added `assets/items/metal_coat.png` sprite.
- Re-added fallback config in `game.js`:
  - `createDefaultEvolutionStoneConfigByType()` includes `metal_coat`.
  - `createDefaultExtraShopItemConfigById(...)` includes `metal_coat` in evolutions.
- Validation:
  - `node --check game.js`: PASS.
  - Runtime state (`output/metal-coat-redo/state-1.json`) includes `shop_items.metal_coat` and `shop_item_configs` entry for `metal_coat`.
  - Data check confirms Onix and Scyther evolve with `trigger=trade` and `held_item=metal-coat`.

## Additional progress (2026-03-13, reapply update system after discard)
- Reapplied the local/dev guard in game bootstrap:
  - update checker now runs only when isProductionGithubPagesLocation(window.location) is true.
- Hardened GitHub version source fallback in lib/github-update-checker.js:
  - if remote version.js request fails, checker now continues to package.json fallback.
- Validation results:
  - node --check game.js: PASS
  - node --check lib/github-update-checker.js: PASS
  - npm run test:save: PASS
  - run_playwright_check.ps1: PASS
  - Local server check: modal not shown, UI not locked.
  - Production simulation check: modal shown, UI locked, outside interactions blocked, fallback chain confirmed.
## Additional progress (2026-03-13, fallback evolution items parity)
- Extended fallback evolution shop config in `game.js` so it matches CSV-level evolution items even when `shop_items.csv` fails to load.
- Added fallback entries for:
  - `galarica_wreath`, `ice_stone`, `moon_stone`, `sun_stone`, `thunder_stone`, `cable_link`
  - (existing fallback already had `water_stone`, `fire_stone`, `leaf_stone`, `metal_coat`)
- Validation:
  - `node --check game.js`: PASS.
  - Runtime fallback probe (`output/evo-fallback-full/state-1.json`) confirms all evolution shop items are present while `shop_items_csv_loaded: false`.

## Additional progress (2026-03-13, gacha redo after discard + button wording clarity)
- Revalidated and finalized the full Gacha skin unlock flow after discard/pull-main sync:
  - skin purchases removed from appearance UI (locked skins now show `Verrouille (Gacha)` only).
  - locked skin previews are rendered as black silhouettes (`.is-silhouette`) until unlock/reveal.
  - Gacha remains coin-based (`10 Coins`) and unlocks one random locked skin from Pokemon ids `1..151` only.
- Clarified user-facing wording in UI:
  - action dock button label updated to `Machine Gacha`.
  - spin CTA updated to `Obtenir 1 skin aleatoire (10 Coins)`.
  - locked appearance hint now says `Utilise Machine Gacha (10 Coins)`.
  - subtitle wording corrected to `Le skin obtenu est revele uniquement a la fin du tirage`.

## Validation (gacha redo + UI wording)
- `node --check game.js`: PASS.
- `./run_playwright_check.ps1`: PASS.
- Targeted seeded Gacha E2E run (`tmp/pw_gacha_e2e_validate.cjs`): PASS.
  - Artifacts: `output/web-game-gacha-e2e/before-spin.png`, `after-spin.png`, `state-summary.json`.
  - Assertions confirmed:
    - coins decreased exactly by 10 (`66 -> 56`)
    - remaining Kanto candidates decreased by 1 (`1512 -> 1511`)
    - reward present and persisted in save (`reward_owned_in_save: true`)
    - spin ends cleanly (`gacha_spinning: false`) and modal stays open.
- Visual checks:
  - before-spin screenshot: reel entries are black silhouettes with mystery labels.
  - after-spin screenshot: final reward panel reveals the obtained skin with full sprite preview.

## Additional progress (2026-03-13, full redo validation: Teleport swap + Legendary Fields)
- Re-validated after discard/pull-main sync that requested systems are present in runtime code:
  - Abra family teleport real slot swap (`swapTeamSlots`) now swaps runtime team + mirrored `state.team` + persisted `state.saveData.team`.
  - Legendary field talents are active in runtime:
    - `ELECTRIC_FIELD` (Électhor), `ARDENT_FIELD` (Sulfura), `ARCTIC_FIELD` (Artikodin)
    - team aura bonus +35% for matching offensive type including the caster (`includeSelf: true`)
    - trio synergy applies team attack interval multiplier `0.8` (non-stackable)
    - screen-edge type VFX + trinity pulse are rendered in combat.
  - `lib/combat-passives.js` aliases include the 3 field talents (EN/FR variants).
  - `pokemon_data/pokemon_talents.csv` entries 144/145/146 point to field talents with updated FR/EN labels/descriptions.

### Validation runs
- Syntax:
  - `node --check game.js`: PASS
  - `node --check lib/combat-passives.js`: PASS
- Talent CSV audit:
  - `node C:/Users/esibe/.codex/skills/pokemon-talents-maintainer/scripts/audit_talents_csv.mjs --repo D:/Projects/web/pokeidle_html_codex`: PASS
  - confirmed IDs present: `ELECTRIC_FIELD`, `ARDENT_FIELD`, `ARCTIC_FIELD`
- Smoke:
  - `./run_playwright_check.ps1`: PASS (no fresh error file in latest run)

### Targeted behavior proofs
- Teleport swap scenarios (seeded):
  - Abra scenario: swap events observed and verified as real slot exchanges (`realSwap = 4 / 4`).
  - Alakazam scenario: swap events observed and verified as real slot exchanges (`realSwap = 6 / 6`).
  - Kadabra deep validation (2400 deterministic steps):
    - `kadabraAttackCount = 536`
    - `swapCount = 21`
    - first swap observed at step 330 (`from 0 -> to 2`).
- Alakazam boost secondary effect deep validation (2400 deterministic steps):
  - `swapCount = 34`
  - `boostConsumedCount = 2`
  - boosted non-Alakazam ally hits observed with `teleport_damage_boost_pct = 50`.
- Legendary trio field validation (Électhor + Sulfura + Artikodin seed):
  - `legendary_fields_active = { electric: true, ardent: true, arctic: true, trinity: true }` across run
  - `legendary_field_attack_interval_multiplier = 0.8`
  - `attack_interval_ms = 336` (base 420 * 0.8)
  - turn events include `team_aura_attack_bonus_pct = 35` for matching attackers.
  - visual capture checked: `output/web-game-legendary-trio-visual/shot-0.png` (combat visible with screen-edge field glow).

### Notes
- Some temporary validation helpers were used in `tmp/` for deterministic long-run checks.

## Additional progress (2026-03-13, gacha speed-up + anti-stretch sprites)
- Gacha reel speed substantially increased:
  - `GACHA_REEL_TOTAL_ITEMS`: `64`
  - `GACHA_REEL_REWARD_INDEX`: `44` (target reveal appears after ~44 mystery skins pass)
  - `GACHA_SPIN_DURATION_MS`: `2400` (down from 5200ms)
- Suspense status timings are now computed from spin duration ratio (no hardcoded long delays), keeping text pacing coherent when spin speed changes.
- Anti-stretch pass for sprite thumbnails/previews (including animated assets):
  - `.appearance-preview img`: switched to `width/height: auto`, `max-width/max-height`, `object-fit: contain`.
  - `.gacha-reel-item-media img`: same ratio-safe rules.
  - `.gacha-result-preview img`: same ratio-safe rules.
  - Mobile overrides now use `max-width/max-height` (no forced fixed width/height for those images).

## Validation (gacha speed-up + anti-stretch)
- `node --check game.js`: PASS.
- Seeded Gacha E2E: PASS (`tmp/pw_gacha_e2e_validate.cjs`).
  - Coins: `66 -> 56`.
  - Remaining candidates: `1512 -> 1511`.
  - Reward persisted in save: `reward_owned_in_save: true`.
- Measured spin elapsed (seeded probe): `~2614ms` end-to-end until `gacha_spinning=false` + reward revealed.
- Visual checks on latest `output/web-game-gacha-e2e/before-spin.png` and `after-spin.png`: silhouettes + reveal flow intact, no visible stretch in reel/result previews.

## Additional progress (2026-03-13, dev debug unlock Alakazam)
- Added a dev-only debug unlock flow for Alakazam (id 65):
  - auto-loads Alakazam definition in non-production runtime if missing;
  - auto-unlocks Alakazam at level 30 in dev mode during scene init.
- Production guard:
  - only active when `isProductionGithubPagesLocation(window.location)` is false.
- Persistence:
  - unlock changes are persisted through the existing save write path.
- UX:
  - shows top message once when the dev unlock is newly applied.

### Validation
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Runtime text-state check (`output/web-game-poke/state-0.json`):
  - `app_version` includes `dev-mode`
  - `save_team_size = 1`
  - team contains Alakazam (`id: 65`, `talent_id: TELEPORT_PLUS_PLUS`).

## Additional progress (2026-03-13, gacha reopen reset)
- Updated Gacha close behavior so the modal always resets visual state when closing (not only on `force` close).
  - On close: reel state reset, last reward cleared, status text reset.
  - Result: reopening Gacha starts from clean pre-spin UI without showing previous unlock panel.

## Validation (gacha reopen reset)
- `node --check game.js`: PASS.
- Targeted Playwright scenario (spin -> close -> reopen): PASS.
  - `resultVisible: false`
  - `resultName: "-"`
  - `resultSkin: "-"`
  - `statusText: "Pret a tenter ta chance."`
  - `gachaLastRewardInTextState: null`
  - artifact folder: `output/web-game-gacha-reopen-reset/`

## Additional progress (2026-03-13, randomize mystery reel on every open)
- Added `populateGachaPreviewReel(candidates, { forceRefresh })` to centralize mystery-reel preview generation.
- `setGachaOpen(true)` now explicitly calls preview generation with `forceRefresh: true`.
  - This guarantees a new randomized set of mystery skins every time the Gacha modal is opened.
- `renderGachaModal()` now reuses the same helper for normal preview sync.

## Validation (randomize on open)
- `node --check game.js`: PASS.
- Targeted Playwright test (open -> close -> open and compare 10 displayed mystery sprites): PASS.
  - first_count: 10, second_count: 10
  - same_slots: 0 / 10
  - changed: true
  - artifacts: `output/web-game-gacha-randomize-open/compare.json`, `after-second-open.png`

## Additional progress (CSV mixed line endings + AudioContext warning cleanup)
- Investigated console warnings shown in browser devtools:
  - `item_data/pokeballs.csv` and `item_data/shop_items.csv` were present on disk (not missing).
  - Reproduced PapaParse failures locally with exact errors:
    - `Too many fields: expected 8 fields but parsed 15` (pokeballs)
    - `Too many fields: expected 13 fields but parsed 25` (shop items)
  - Root cause: mixed line endings inside CSV files (`CRLF` + `LF`) while PapaParse auto-detected `\r\n`, causing some rows to be merged.
- Hardened CSV parsing in `lib/runtime-data.js`:
  - Added `normalizeCsvInput(rawCsv)` to normalize all line endings to `\n` before parsing.
  - Applied normalization to both `parseCsvRows` and `parseCsvObjects`.
- Reduced autoplay policy warning noise (`AudioContext`) in `game.js`:
  - Replaced eager audio manager construction at boot with lazy initialization.
  - Audio manager now initializes on first user gesture (`pointerdown` / `keydown`) and is still exposed via `window.POKEIDLE_AUDIO` through a proxy.

## Validation runs (this turn)
- `node --check lib/runtime-data.js`: PASS.
- `node --check game.js`: PASS.
- Runtime CSV parse probe using `parseCsvObjects`:
  - `item_data/pokeballs.csv`: PASS (3 rows, 0 parse errors).
  - `item_data/shop_items.csv`: PASS (11 rows, 0 parse errors).
- `run_playwright_check.ps1`: PASS.
  - Fresh `output/web-game-poke/state-0.json` shows:
    - `ball_csv_loaded: true`
    - `shop_items_csv_loaded: true`
    - `zone_csv_loaded: true`
    - `talents_csv_loaded: true`
- Extra Playwright console capture on page load: PASS.
  - No CSV warnings.
  - No `AudioContext` warning.

## Validation complémentaire (2026-03-13, TP famille Abra + KO->spawn)
- Vérification data talents dans `pokemon_data/pokemon_talents.csv`:
  - Abra (63): `TELEPORT`
  - Kadabra (64): `TELEPORT_PLUS`
  - Alakazam (65): `TELEPORT_PLUS_PLUS`
- Vérification logique runtime `game.js`:
  - même pipeline de swap pour les 3 talents (`buildTeleportSwapPlan` -> `applyTeleportSwapPlan`), seules les chances/effets secondaires diffèrent.
  - cas KO: le swap est bien différé (`teleport_swap_deferred_until_next_spawn`) puis appliqué dans `spawnEnemy()` via `applyPendingTeleportSwapAfterRespawn(...)`.
- Validation exécution:
  - `node --check game.js`: PASS.
  - `tmp/teleport_deferred_spawn_check.cjs`: PASS (`verifiedAppliedOnSpawn: true`, swap appliqué au respawn).
  - `run_playwright_check.ps1`: PASS.
- Note: le script `tmp/run_teleport_tiers_validation.ps1` dépend d'un client absent (`~/.codex/skills/develop-web-game/scripts/talent_validate.mjs`) dans cet environnement.

## Additional progress (2026-03-13, teleport VFX always + Alakazam buff contract)
- Reworked teleport swap VFX reliability in `game.js`:
  - Added fallback layout resolution for teleport effects (`resolveTeleportEffectLayout`) so swap VFX still render even if caller layout is missing/stale.
  - Expanded swap visuals (`addTeleportSwapEffects`) with:
    - dual-direction psychic trails,
    - stronger rings,
    - mid-wave pulse,
    - `teleport_flash` burst at both swap slots,
    - extra boosted-slot burst when Alakazam buff applies.
- Improved long-lived Alakazam boost visuals on the teleported ally:
  - Added per-slot `teleportBoostVisualBySlot` state.
  - Added `updateTeleportBoostVisuals(...)` + getter `getTeleportBoostVisualIntensityForSlot(...)`.
  - Boost visual is set to full intensity on apply, persists while boost multiplier is active, and fades after consumption.
  - `drawTeamTeleportBoostIndicator(...)` now renders richer psychic VFX (stronger glow, beam, rotating rings, extra orbit sparks).
- Hardened projectile hit ownership to avoid slot-mismatch side effects:
  - Projectiles now store `attackerSnapshot` + `turnDecision` at launch.
  - `applyHit(...)` now uses snapshot decision/identity first, preventing slot swaps during projectile travel from attributing hit events/teleport logic to the wrong Pokemon.
- Added text-state debug fields per team member for deterministic validation:
  - `teleport_damage_boost_multiplier`
  - `teleport_damage_boost_active`
  - `teleport_boost_visual_intensity`

### Validation
- `node --check game.js`: PASS.
- `tmp/teleport_deferred_spawn_check.cjs`: PASS (`verifiedAppliedOnSpawn: true`).
- `tmp/teleport_boost_contract_check.cjs`: PASS (boost active on teleported ally, consumed on ally hit, cleared right after).
- `tmp/alakazam_boost_validate.cjs`: PASS aggregate behavior (`boostConsumedCount` fully on non-Alakazam attackers in latest run).
- `run_playwright_check.ps1`: PASS.
- Visual capture (tutorial hidden in script) reviewed:
  - `output/teleport-vfx-check/swap.png`
  - `output/teleport-vfx-check/boost-active.png`
  - `output/teleport-vfx-check/info.json` confirms boosted ally has `teleport_damage_boost_multiplier: 1.5` and `teleport_boost_visual_intensity: 1`.

## Additional progress (2026-03-13, teleport buff persistence across enemy KO)
- Fixed teleport boost persistence in `PokemonBattleManager.syncTeam(...)`:
  - Previous behavior reset `teleportDamageBoostBySlot` to `1` on every team resync.
  - New behavior preserves teleport boost (and boost visual intensity) across resync by remapping from previous team to new team by `pokemon.id`.
  - Result: a buffed swapped ally no longer loses its teleport buff when current enemy is defeated and battle state rebuilds.

### Validation
- Syntax:
  - `node --check game.js`: PASS.
- Targeted persistence scan (`tmp/teleport_boost_defeat_persistence_scan.cjs`): PASS.
  - Found real case where enemy defeat happened while Roucool had teleport buff x1.5.
  - Buff remained x1.5 after defeat (`prevDefeats: 2 -> currDefeats: 3`) and attacker was another Pokemon (Rattata).
- Targeted consumption contract (`tmp/teleport_boost_contract_check.cjs`): PASS.
  - Buff consumed only when buff holder attacks; boost then clears.
- Smoke:
  - `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.

## Additional progress (2026-03-13, rollback dev-only teleport/alakazam debug)
- Restored Teleport++ to non-dev behavior:
  - Removed dev override that forced teleport swap chance to 100%.
  - `getTalentTeleportSwapChance(...)` now returns CSV/runtime base values only (Alakazam remains 30%).
- Removed dev-only forced Alakazam debug unlock flow:
  - Removed constants and helper functions that loaded/unlocked Alakazam automatically in dev mode.
  - Removed scene-init calls and related top-message branch (`devDebugUnlockApplied`).
- Removed dev teleport debug notification calls tied to swap events.

### Validation
- `node --check game.js`: PASS.
- `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.
- Code search confirms no remaining references to removed debug hooks (`DEV_DEBUG_FORCE_TELEPORT_SWAP_CHANCE`, forced Alakazam unlock helpers/calls).

## Additional progress (2026-03-13, teleport + placement-dependent talents / Morphing)
- Fixed placement-dependent talent refresh after slot changes caused by teleport:
  - Added `PokemonBattleManager.refreshPlacementDependentTalentOverrides()`.
  - Called after `swapTeamSlots(...)` and after `syncTeam(...)`.
- Hardened Morphing recalculation for Metamorph:
  - Added `resolveMorphingBaseProfile(member)` and `restoreMorphingMemberBaseState(member)`.
  - `applyTeamTalentOverrides(...)` now restores Metamorph to its own base profile first, then re-applies morph from current previous slot.
  - Prevents stale morph state when Metamorph moves (or loses source in slot 0).

### Validation
- `node --check game.js`: PASS.
- Targeted teleport+morphing runtime test (`tmp/teleport_morphing_alignment_check.cjs`): PASS.
  - Observed 3 teleport swaps and 2 source changes for Metamorph.
  - At every step checked: `metamorph.offensive_type === previous_slot.offensive_type` (or `normal` when Metamorph is slot 0).
- `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.

## Additional progress (2026-03-13, release validation pass)
- Release-oriented validation executed on current working tree:
  - Syntax checks: `game.js`, `lib/combat-passives.js`, `lib/github-update-checker.js`, `lib/runtime-data.js`.
  - Unit tests: `npm run test:save` (10/10 PASS).
  - Playwright smoke: `run_playwright_check.ps1` PASS.
  - Playwright long run: `run_playwright_long.ps1` PASS.
- Critical talent behavior checks PASS:
  - teleport deferred swap on KO->spawn (`tmp/teleport_deferred_spawn_check.cjs`)
  - Alakazam boost apply/consume contract (`tmp/teleport_boost_contract_check.cjs`)
  - boost persistence across enemy defeat (`tmp/teleport_boost_defeat_persistence_scan.cjs`)
  - teleport + Metamorph placement adaptation (`tmp/teleport_morphing_alignment_check.cjs`)
  - aggregate Alakazam boost observations (`tmp/alakazam_boost_validate.cjs`)
  - lethal-hit teleport flag coverage (`tmp/teleport_kill_check.cjs`)
  - legendary field trio + 0.8 attack interval (`tmp/legendary_fields_quick_check.cjs`)
- Asset risk sanity check PASS:
  - scanned all `pokemon_data/*_data.json` for referenced local sprite paths under `pokemon_data/...` and found no missing files.

## Additional progress (2026-03-13, gacha UI mobile compaction/readability pass)
- Reworked gacha modal responsive styles in `styles.css` for phone-first readability and compactness:
  - Reduced modal/card paddings and radii on <=760px, with top alignment and bounded card height (`calc(100dvh - 12px)`).
  - Tightened header spacing and mobile typography; adjusted close button dimensions.
  - Reworked wallet layout to dense grid cards on mobile (instead of a tall single-column stack), with smaller labels/values and per-field scaling.
  - Reduced machine/reel visual density (lights height, reel paddings, card size, sprite box size, labels) to keep key info above the fold.
  - Reduced status/result card footprint and tightened result preview sizing.
  - Made spin CTA full-width and sticky at the card bottom on mobile for better accessibility while scrolling.
  - Added <=430px refinements (2-column wallet with remaining-skins row spanning full width, smaller reel/media sizing).

### Validation
- Skill loop smoke:
  - `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS (no blocking errors).
- Mobile screenshot capture (Playwright, viewport 390x844):
  - Output: `output/gacha-mobile-after.png`.
  - Visual check: modal now fits in one viewport with denser readable sections and reduced vertical bloat.
- Follow-up tweak: reduced mobile gacha title scale (`<=760px` and `<=430px`) and top-header alignment for better information density.
- Re-captured mobile screenshot after tweak: `output/gacha-mobile-after.png`.

## Additional progress (2026-03-13, shiny/ultra odds hard set)
- Updated shiny odds logic in `game.js`:
  - `ULTRA_SHINY_ODDS` changed from `8192` to `8196`.
  - Kept total shiny spawn chance exactly at `1/2048` (ultra included) by using a dedicated non-ultra shiny roll when the ultra roll fails.
- Validation:
  - `node --check game.js`: PASS.
  - `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.
## Additional progress (2026-03-13, update checker robustness for delayed popup)
- Hardened `lib/github-update-checker.js` to reduce missed update popups in production:
  - The checker now tries to read the deployed version from current GitHub Pages origin first (`version.js`, then `package.json`) with cache-busting query param and `cache: no-store`.
  - GitHub API polling remains as fallback when same-origin files are unavailable.
  - Poll interval remains unchanged at 5 minutes (`5 * 60 * 1000`).
- Added automated tests in `tests/github-update-checker.test.mjs`:
  - verifies default polling interval is 5 minutes;
  - verifies same-origin version source is preferred before GitHub API;
  - verifies fallback to GitHub API still works when deployed files are unavailable.

## Validation (update checker robustness)
- `node --check lib/github-update-checker.js`: PASS.
- `node --test tests/github-update-checker.test.mjs`: PASS (2/2).
- `npm run -s test:save`: PASS (12/12).
- Gacha mobile cleanup: removed subtitle (`#gacha-subtitle`) and reel status text block (`#gacha-status`) from modal markup as requested to reduce visual noise.
- Verification screenshot: `output/gacha-mobile-no-useless-text.png`.

## Validation complÃ©mentaire (2026-03-13, check ciblÃ© Morphing Metamorph sprite)
- Objectif: vÃ©rifier que Metamorph (talent `MORPHING`) copie bien le sprite du PokÃ©mon qu'il imite (slot prÃ©cÃ©dent) et que le build reste stable.
- PrÃ©paration test:
  - Ajout d'un save seed dÃ©diÃ© `tmp/pokeidle-test-appdata/PokeIdle/save_morphing_sprite_check.json` avec team `[25, 132, 16]` (Pikachu, Metamorph, Roucool).
  - Ajout d'un script de validation runtime `tmp/morphing_sprite_validate.mjs`.
- Validation ciblÃ©e (Playwright):
  - ExÃ©cution sur 90 checks (`stepMs=420`) via `window.render_game_to_text` + `window.__pokeidle_debug_getSpriteFrameIndex`.
  - RÃ©sultat: `mismatchCount: 0`, `missingMorphingCount: 0`, `allPassed: true`.
  - Preuve clÃ©: Metamorph (`id:132`) et source (`id:25`) exposent le mÃªme `sprite_path` Ã  chaque check:
    - `pokemon_data/25_pikachu/sprites/25_pikachu_firered_leafgreen_front.png`
  - Artefacts:
    - `output/morphing-sprite-check/summary.json`
    - `output/morphing-sprite-check/checks.json`
    - `output/morphing-sprite-check/final.png`
- VÃ©rif globale de stabilitÃ©:
  - `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS
  - `powershell -ExecutionPolicy Bypass -File .\run_playwright_long.ps1`: PASS
  - `node --check game.js`: PASS
  - `npm run -s test:save`: PASS (12/12)
- Conclusion: le morphing de Metamorph copie correctement le sprite du PokÃ©mon imitÃ©, et aucun souci global dÃ©tectÃ© sur les passes de validation exÃ©cutÃ©es.

## Additional progress (2026-03-13, Morphing shader recolor to Metamorph palette)
- Reworked Morphing shader pipeline in `game.js` so copied sprites now keep the target silhouette/details while adopting Metamorph's own pink/lilac palette.
- Added dynamic palette sampling from Metamorph default sprite (`id: 132`):
  - introduced color sampling canvas/context and cache (`morphingColorSampleCache`),
  - compute alpha-weighted dominant color from opaque pixels,
  - fallback color used if sampling is temporarily unavailable.
- Extended sprite shader capabilities:
  - `mergeSpriteShaderConfig(...)` now supports merging `colorizeRgb` + `colorizeBlend` in addition to hue/saturation/brightness/contrast.
  - `drawSpriteImageWithTint(...)` now applies an extra shader colorize pass (`source-atop`) even when base tint is 0.
- Morphing talent application now uses runtime shader build:
  - `member.spriteShader = source ? buildMorphingShaderConfig() : null;`

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- Targeted morphing runtime validation (`tmp/morphing_sprite_validate.mjs` with seeded Metamorph save): PASS.
  - `totalChecks: 90`
  - `mismatchCount: 0`
  - `missingMorphingCount: 0`
  - `allPassed: true`
  - visual artifact: `output/morphing-sprite-check/final.png` (Metamorph shows copied form with pink/lilac Metamorph coloration).
- Smoke validation: `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.

## Additional progress (2026-03-13, Morphing shader hard recolor to Ditto pink-violet)
- Reworked Morphing visual from simple tinting to a true palette remap:
  - added fixed Ditto gradient palette stops (pink/violet) and `paletteKind: "metamorph"` shader mode.
  - new `getMorphingPaletteMappedTexture(...)` remaps copied sprite pixels by luminance to Ditto palette while preserving shading/details and alpha.
  - added cache for mapped textures (`morphingPaletteTextureCache`) to avoid expensive per-frame recomputation.
- Shader merge pipeline now supports palette fields (`paletteKind`, `paletteStrength`) in addition to existing color filters.
- `drawSpriteImageWithTint(...)` now applies the mapped texture source before normal tint/filter passes.

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- Targeted Morphing validation (`tmp/morphing_sprite_validate.mjs`): PASS.
  - sprite copy still correct (`mismatchCount: 0`, `missingMorphingCount: 0`, `allPassed: true`).
- Smoke run: `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.
- Visual check: `output/morphing-sprite-check/final.png` now shows copied form in strong Ditto-like pink-violet tones.

## Additional progress (2026-03-13, Morphing dark-violet outline)
- Added a dedicated Morphing outline inspired by Ultra Shiny outline pipeline:
  - reuses `getUltraShinyOutlineTexture(...)` silhouette generation,
  - recolors that silhouette in dark violet via offscreen tint buffer,
  - draws it before sprite render so contour is visible around the copied form.
- New Morphing outline tuning constants:
  - `MORPHING_OUTLINE_PX = 1.9`
  - `MORPHING_OUTLINE_RGB = [93, 49, 133]`
  - `MORPHING_OUTLINE_ALPHA = 0.95`
- Outline is applied only when Morphing is active (`morphingSourceId > 0` + metamorph palette shader).

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- Targeted Morphing validation (`tmp/morphing_sprite_validate.mjs`): PASS (`allPassed: true`, 90 checks).
- Smoke validation: `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.
- Visual artifact: `output/morphing-sprite-check/final.png` now shows clear dark-violet contour around Morphing Metamorph sprite.

## Additional progress (2026-03-13, Morphing opacity reduction + slime drip effect)
- Adjusted Morphing purple opacity/intensity to reveal more of copied sprite details:
  - `MORPHING_SHADER_CONFIG.paletteStrength`: `0.76`
  - `MORPHING_SHADER_CONFIG.colorizeBlend`: `0.10`
  - `MORPHING_OUTLINE_ALPHA`: `0.85`
- Added animated slime/dripping effect for active Morphing state:
  - new `drawMorphingSlimeEffect(size, seed, alpha)` renders a semi-transparent gelatin layer with animated drips and droplets.
  - effect is triggered only when Morphing is active (same gating as Morphing outline/palette shader).

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- Targeted Morphing validation (`tmp/morphing_sprite_validate.mjs`): PASS (`allPassed: true`, 90 checks).
- Smoke validation: `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.
- Visual artifact: `output/morphing-sprite-check/final.png` shows softer purple recolor and visible slime-like dripping treatment.

## Additional progress (2026-03-13, accentuated Morphing wobble)
- Strongly increased Morphing visibility with animated wobble deformation:
  - added `getMorphingWobbleTransform(entity, size)`.
  - applies animated squash/stretch, shear, micro-rotation, and positional drift while Morphing is active.
- Increased slime effect readability:
  - `MORPHING_SLIME_ALPHA` raised to `0.56`.
  - drip amplitude increased (`0.165 * size`).
  - added second front-pass slime overlay after sprite draw for clearer gelatin impression.
- Existing dark-violet outline and Ditto palette remap remain active.

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- Morphing targeted validation: PASS (`tmp/morphing_sprite_validate.mjs`, 90 checks, all passed).
- Morphing motion proof capture:
  - `output/morphing-slime-proof/frame-a.png`
  - `output/morphing-slime-proof/frame-b.png`
- Smoke validation: `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.

## Validation complÃ©mentaire (2026-03-13, Alakazam teleport -> Morphing refresh)
- Demande testÃ©e: ajouter Alakazam dans la team et vÃ©rifier qu'aprÃ¨s chaque tÃ©lÃ©port d'Alakazam, MÃ©tamorph refresh correctement sa copie si nÃ©cessaire.
- Setup:
  - Save seed dÃ©diÃ©: `tmp/pokeidle-test-appdata/PokeIdle/save_alakazam_morphing_teleport_check.json`.
  - Team seed: `[16, 65, 132, 25, 19, 43]` (inclut Alakazam + MÃ©tamorph).
  - Script de validation: `tmp/alakazam_morphing_teleport_refresh_check.mjs`.
- VÃ©rification effectuÃ©e Ã  chaque event `last_turn_event.teleport_swap=true` dÃ©clenchÃ© par Alakazam (`talent_id: TELEPORT_PLUS_PLUS`):
  - cas swap immÃ©diat: contrÃ´le de synchro MÃ©tamorph vs slot prÃ©cÃ©dent:
    - `metamorph.offensive_type === source.offensive_type`
    - `metamorph.sprite_path === source.sprite_path` (via `window.__pokeidle_debug_getSpriteFrameIndex`).
  - cas diffÃ©rÃ© (KO -> respawn): comptabilisÃ© sÃ©parÃ©ment.
- RÃ©sultat:
  - `alakazamTeleportEvents: 45`
  - `immediateTeleportChecks: 14`
  - `deferredTeleportEvents: 31`
  - `failureCount: 0`
  - `allPassed: true`
- Artifacts:
  - `output/alakazam-morphing-teleport-refresh-check/summary.json`
  - `output/alakazam-morphing-teleport-refresh-check/checks.json`
  - `output/alakazam-morphing-teleport-refresh-check/final.png`
- Sanity:
  - `powershell -ExecutionPolicy Bypass -File .\run_playwright_check.ps1`: PASS.

## Additional progress (2026-03-13, Manoir Pokemon tuning + retro-save unlock backfill)
- Rebalanced `kanto_dungeon_pokemon_mansion` encounters to remove FR/LG split and keep both poison lines equally available:
  - `Tadmorv` and `Smogo` both set to weight `20`.
  - Added `Evoli` (`id:133`) at exactly `1%` spawn chance (weight `1` over total `100`).
  - Updated both data sources used by runtime loading:
    - `map_data/kanto_dungeon_pokemon_mansion.json`
    - `map_data/kanto_zone_encounters.csv`
- Added save compatibility backfill in `game.js` for inserted routes:
  - New `backfillInsertedUnlockedRouteIds(...)` path ensures saves that already progressed past inserted checkpoints still get those checkpoints unlocked.
  - Specifically includes `kanto_dungeon_pokemon_mansion` backfill when later Kanto routes are already unlocked.
  - Also backfills up to `current_route_id` when needed to stabilize older/partial saves.

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- Playwright smoke (`run_playwright_check.ps1`): PASS.
- Seeded compatibility run with `?dev_seed_save=tmp/dev_seed_mansion_backfill.json`:
  - route loads on `Manoir Pokemon (Kanto)`.
  - `current_route_encounter_count`: `10`.
  - `unlocked_route_ids` includes `kanto_dungeon_pokemon_mansion` even though seed `unlocked_route_ids` intentionally omitted it.
  - visual artifact: `output/mansion-backfill-check/shot-4.png`.

## Validation complÃ©mentaire (2026-03-13, cas demandÃ©s Alakazam<->MÃ©tamorph)
- Objectif explicite:
  - vÃ©rifier le refresh Morphing quand Alakazam swap directement avec MÃ©tamorph,
  - vÃ©rifier le refresh quand MÃ©tamorph swap avec son voisin source (slot prÃ©cÃ©dent Ã  copier).
- Setup ciblÃ©:
  - save seed 2-slot forcÃ© (`[Alakazam, MÃ©tamorph]`): `tmp/pokeidle-test-appdata/PokeIdle/save_alakazam_metamorph_direct_swap_check.json`.
  - script de test: `tmp/alakazam_metamorph_direct_swap_check.mjs`.
- RÃ©sultat:
  - `directSwapChecks: 25` (Alakazam swap direct impliquant MÃ©tamorph)
  - `neighborSwapChecks: 4` (MÃ©tamorph swap avec son voisin source)
  - `copiedStateSeen: true` (MÃ©tamorph recopie bien aprÃ¨s swap)
  - `revertedStateSeen: true` (MÃ©tamorph repasse bien en profil Ditto quand il tombe en slot 0)
  - `failures: 0`
  - `allPassed: true`
- Artifacts:
  - `output/alakazam-metamorph-direct-swap-check/summary.json`
  - `output/alakazam-metamorph-direct-swap-check/checks.json`
  - `output/alakazam-metamorph-direct-swap-check/copied-slotgt0.png`
  - `output/alakazam-metamorph-direct-swap-check/reverted-slot0.png`
- Smoke global aprÃ¨s test: `run_playwright_check.ps1`: PASS.

## Additional progress (team drag & drop swap)
- Added drag-and-drop team slot swapping on the battlefield canvas for left-click drag gestures:
  - `mousedown` on a team member starts a drag candidate.
  - Movement beyond a threshold activates drag mode.
  - `mouseup` over another occupied slot swaps both Pokemon.
- Reused existing team-edit gate (`getTeamBoxesAccessState`) so swap is allowed only when team editing is allowed (town/city, or combat route with next zone unlocked).
- Added robust interaction guards:
  - Prevent accidental box-open click right after a drag release.
  - Cancel drag safely on `Escape`, window blur, or mouseup outside canvas.
  - Keep right-click context menu behavior intact when not dragging.
- Added visual drag feedback:
  - Source/target slot highlight while dragging.
  - Dashed trajectory line and dragged sprite ghost preview.
  - Cursor changes to `grab`/`grabbing` during drag lifecycle.
- Extended `render_game_to_text` with drag state fields:
  - `team_drag_active`, `team_drag_moved`, `team_drag_source_slot_index`, `team_drag_target_slot_index`.

## Validation runs (team drag feature)
- `node --check game.js`: PASS.
- `npm run test:save`: PASS (12/12).
- `run_playwright_check.ps1`: PASS (no console/page errors).
- Custom Playwright swap scenario with dev-seeded town save (`tmp/test_team_drag_swap.mjs`): PASS.
  - Team order changed from `[1,4]` to `[4,1]`.
  - Artifacts: `output/web-game-drag-swap/state-before.json`, `output/web-game-drag-swap/state-after.json`, `output/web-game-drag-swap/shot-after.png`, `output/web-game-drag-swap/errors.json`.
- Custom Playwright locked-route scenario with dev-seeded Route 1 save (`tmp/test_team_drag_swap_locked.mjs`): PASS.
  - Team order remained unchanged while chrono lock is active.
  - Artifacts: `output/web-game-drag-swap-locked/state-before.json`, `output/web-game-drag-swap-locked/state-after.json`, `output/web-game-drag-swap-locked/shot-after.png`, `output/web-game-drag-swap-locked/errors.json`.

## Additional progress (mobile version visibility)
- Fixed mobile visibility for canvas overlays (drawVersionOverlay + drawFpsOverlay) in game.js:
  - Added getBottomHudSafeEdge() to keep overlays above the bottom action dock.
  - Reused layout safe bounds + live dock rect fallback so labels stay readable even in compact phone view.
  - Slightly increased phone overlay text size/contrast for better legibility.
- Validation:
  - node --check game.js: PASS.
  - run_playwright_check.ps1: PASS (no console/page errors).
  - Dedicated mobile viewport capture (iPhone 13 emulation): output/mobile-version-gameplay-clear.png confirms version label remains visible above dock.

## Additional progress (tween polish UI/combat)
- Integrated tween library for runtime UI animation orchestration:
  - Added dependency `@tweenjs/tween.js`.
  - Added browser vendor module `vendor/tween.js` and vendor entry `vendor-src/tween.entry.js`.
  - Updated `scripts/build-browser-vendors.mjs` to include a `tween` bundle entry.
- Implemented shared tween helpers in `game.js`:
  - `showModalWithTween` / `hideModalWithTween` for window/modal enter/exit.
  - `showPopupWithTween` / `hidePopupWithTween` + `showTooltipWithTween` for tooltip/popup enter/exit.
  - Unified tween group update in main update loop (`tweenGroup.update(state.timeMs)`).
- Applied modal/window tweens to major UI flows:
  - Starter modal, tutorial modal, map modal, shop modal, gacha modal, evolution item choice modal.
  - Rename modal, boxes modal, appearance modal.
- Applied tooltip/popup tweens:
  - Hover tooltip (`hover-popup`) now tweened on show/hide.
  - Team context menu and ball capture menu now tweened on show/hide.
- Reworked notification stack rendering for tweened lifecycle:
  - Replaced full `innerHTML` reset with keyed card reconciliation.
  - Added tweened notification card enter and exit animations.
  - Preserved evolution action button behavior (`Evoluer`).
- Added tweened dynamic combat text feel:
  - Floating damage texts now have tweened alpha/scale entrance and exit overlays.
  - Added cleanup of floating-text tweens on lifecycle resets/removals.
- CSS adjustments:
  - Removed old CSS-only notification keyframe enter animation.
  - Added `will-change` hints for modal/popup/notif animated elements.

## Validation runs (after tween integration)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1` (develop-web-game client): PASS (new screenshots/state emitted in `output/web-game-poke`; no new console/page errors emitted).
- Manual Playwright interaction capture pass (targeted UI states):
  - Captures in `output/tween-manual/` for: after-start, shop-open/close, map-open/close, combat-wait, hover-center, and notif-focused frame.
  - No runtime console/page errors captured (`output/tween-manual/errors.json` not generated).
- `npm run test:save`: PASS (12/12 tests).

## TODO / Next
- Add a deterministic automated Playwright actions payload that explicitly opens/closes each modal through pointer events (not evaluate-click) to lock in tween regressions.
- Optionally extend tween coverage to gacha result panel and any remaining transient panels for full UI consistency.
- Fix tooltip hover disappearance stability:
  - Added popup animation phase tracking (`visible/showing/hiding/hidden`) in UI tween state.
  - Prevented repeated hide restarts while already hiding (main source of jitter/flicker on mouseout loops).
  - Allowed tooltip show to correctly recover from an in-progress hide tween.
  - Switched popup hide/show to start from current inline tween values instead of hard reset values (prevents visual snaps).
- Revalidated syntax and Playwright skill check after tooltip fix:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.

## Additional progress (UI alignment + mobile pass)
- Implemented requested top HUD adjustments:
  - Added a new top-bar `Pokeballs` counter pill in `index.html` (`#pokeballs-pill`) with the same visual format as `Pokedollars`.
  - Wired live `Pokeballs` value updates in `game.js` via `setPokeballsCounterTextValue` (including zero-state handling).
  - Kept `Coins` in the same pill system and unified top counter heights/spacing.
- Updated layout behavior in `styles.css` to match requested composition:
  - Route bar with arrows remains centered horizontally.
  - Resource counters are aligned in one row on desktop (top-right), with consistent sizing.
  - Mobile breakpoints stack route + counters cleanly so everything remains visible and readable.
- Timer placement adjusted upward in `drawRouteDefeatTimerBar`:
  - Timer now anchors closer to the top HUD (using topbar client height + overlay padding), resulting in a visibly higher position.
- Reduced duplicate Pokeball HUD clutter:
  - Canvas ball overlay is now hidden when only the default single Pokeball row exists; multi-ball overlay remains available when relevant.

## Validation runs (UI pass)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Real page screenshot validation with Playwright (desktop + mobile):
  - `output/ui-pass/desktop-ui-clean.png`
  - `output/ui-pass/mobile-ui-clean.png`
  - Also retained tutorial-on captures:
    - `output/ui-pass/desktop-ui.png`
    - `output/ui-pass/mobile-ui.png`
## Additional progress (2026-03-13, accents/special chars Windows notifs)
- Updated Windows notification UX strings in `game.js` to proper French accents and special characters (e.g. "dÃ©sactivÃ©es", "systÃ¨me", "aperÃ§u", "capturÃ©", "Ã‰volution", "PokÃ©mon").
- Added `normalizeUiDisplayText(...)` and applied it to Notification title/body emission to keep Unicode text normalized (`NFC`) before browser/OS notification rendering.
- Applied the same text normalization path to nickname sanitization so composed accents are preserved consistently in user-facing labels.

### Validation
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (12/12).
- `run_playwright_check.ps1`: PASS.
- Visual capture: `output/web-game-poke/shot-2.png`.

## Additional progress (UI correction pass per montage)
- Reworked top HUD to match montage intent:
  - Route display bar is centered horizontally relative to viewport (independent of right currency block).
  - Right currency block now shows only `Pokedollars` + `Coins` stacked vertically with same card format.
  - Removed the extra top-right Pokeballs pill introduced in previous pass.
- Restored Pokeball HUD behavior on the left side of battle area:
  - Re-enabled left-side ball overlay even when only Pokeball is present.
- Kept timer in raised position while preserving centered route header alignment.
- Verified with fresh screenshots:
  - `output/ui-pass/desktop-ui-clean-v2.png`
  - `output/ui-pass/mobile-ui-clean-v2.png`

- Rebalanced classic (already-owned family) capture coin chance tiers to 80% / 60% / 50% / 40% based on level diff in getFamilyOwnedCaptureCoinChanceFromLevelDiff (used in battle capture reward flow).
- Kept non-classic capture coin scaling path intact (still uses level-diff coin multiplier + minimum clamp).
- Ran ./run_playwright_check.ps1 after the change; run completed successfully and latest screenshot/state were generated in output/web-game-poke (shot-2.png, state-2.json).
- Projectile movement upgraded to tween-based travel (not only UI tweens):
  - Added per-projectile travel tween state (`travelTweenState.progress`) driven by global tween group timeline.
  - Replaced frame-distance movement with tweened progress interpolation.
  - Added slight arced trajectory profile (perpendicular sinus offset) for more lively travel feel.
  - Preserved hit resolution, trail generation, turn logic, and precomputed damage behavior.
  - Added cleanup helpers to stop projectile tweens safely when projectiles are cleared on respawn/idle/timer transitions.
- Validation after projectile tween change:
  - `node --check game.js`: PASS.
  - `run_playwright_projectile.ps1`: PASS.
  - Manual capture with active projectile detected in text state (`output/tween-manual/state-16-projectile-tween.json` includes `active_projectiles`).
  - `run_playwright_check.ps1`: PASS.
  - `npm run test:save`: PASS (12/12).
## Additional progress (2026-03-13, fix global affichage accents/caracteres speciaux)
- Added shared text normalization module: `lib/text-normalization.js`.
  - NFC Unicode normalization for UI strings.
  - Mojibake repair path for common UTF-8<->CP1252 decoding issues (e.g. `SalamÃƒÂ¨che` -> `SalamÃ¨che`).
  - Optional French typography pass for common in-game labels (`Pokemon` -> `PokÃ©mon`, `Oeil` -> `Å’il`, `Teleport` -> `TÃ©lÃ©port`, etc.).
- Wired normalization into talents pipeline (`lib/talents.js`):
  - `nameFr` and `descriptionFr` now pass through shared normalization + FR typography.
  - Covers CSV talents and also talents restored from existing saves.
- Wired normalization into key UI display paths in `game.js`:
  - `setTopMessage(...)` now normalizes displayed text.
  - Windows system notifications title/body now normalize with FR typography.
  - Route display names and CSV route encounter `name_fr` now normalize before display.
  - Pokemon display name load path now normalizes FR text.
- Added regression tests: `tests/text-normalization.test.mjs`.

### Validation
- `node --check lib/text-normalization.js`: PASS.
- `node --check lib/talents.js`: PASS.
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (15/15).
- Visual Alakazam tooltip capture with accented talent text:
  - `output/alakazam-talent-tooltip/alakazam-tooltip.png`
  - `output/alakazam-talent-tooltip/tooltip.txt`

## Additional progress (2026-03-13, ball capture toggles + strongest-ball priority + ball HUD polish)
- Added a new per-ball capture toggle for owned species:
  - `Capturer les Pokemon deja possedes` (`capture_owned`) in the ball capture popup.
  - Wired in `index.html` and `game.js` (definitions, listeners, menu refresh).
- Extended capture rules model for backward-compatible save normalization:
  - `createDefaultSingleBallCaptureRules` now includes `capture_owned`.
  - `normalizeSingleBallCaptureRules` now supports `capture_owned` and keeps legacy saves coherent.
  - `capture_all` now synchronizes `capture_unowned`, `capture_owned`, `capture_shiny`, and `capture_ultra_shiny`.
- Updated capture decision logic:
  - `shouldCaptureEnemyWithBallType` now explicitly supports owned-family captures.
- Implemented requested priority behavior when multiple ball types match the same toggle(s):
  - `getBallTypeForCapture` now checks `BALL_TYPE_ORDER` first (strongest capture multiplier first), then falls back to active type only if needed.
  - Result: HyperBall > SuperBall > PokeBall on overlapping rules (e.g. ultra shiny enabled on all three).
- Shop cleanup for balls:
  - Removed useless `Equiper/Actif` secondary button from ball cards.
  - Removed `Actif: Oui/Non` stock text.
  - Updated pokeball-tab subtitle to explain capture-rule configuration from in-combat counters.
- Ball counters UI polish in combat overlay:
  - Distinct per-ball row visual styles (PokeBall/SuperBall/HyperBall colors).
  - Added independent hover animation per row (lift, icon pulse, glow).
  - Labels now display explicit ball name + count (`PokeBall x...`, `SuperBall x...`, `HyperBall x...`).

### Validation
- `node --check game.js`: PASS.
- `powershell -ExecutionPolicy Bypass -File .\\run_playwright_check.ps1`: PASS.
- Targeted visual capture pass for ball HUD + toggle menu:
  - `output/ball-ui-pass/01-overlay-base.png`
  - `output/ball-ui-pass/02-hover-pokeball.png`
  - `output/ball-ui-pass/03-hover-superball.png`
  - `output/ball-ui-pass/04-hover-hyperball.png`
  - `output/ball-ui-pass/05-capture-menu.png` (shows new `Capturer les Pokemon deja possedes` toggle)

## Additional progress (Pokeball counters UI parity)
- Reworked left Pokeball overlay UI to align visually with top-right money counters:
  - Dark blue HUD card style per ball type (same visual family as Pokedollars/Coins cards).
  - Value-first display + uppercase caption (ball type label).
  - Added per-row gauge bar for quick stock reading.
  - Kept per-row click hitboxes active (still opens capture rules menu).
- Updated ball overlay style config constants for consistent card palette and per-type gauge accents.
- Updated ball row visibility logic:
  - All non-coming-soon ball types are now shown in overlay even at `0` so different counters are always visible.

## Validation runs (Pokeball counters parity)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual checks:
  - `output/web-game-poke/shot-2.png` (new row style visible).
  - `output/ui-pass/desktop-ball-overlay-click.png` (click opens capture menu from row).
  - `output/ui-pass/mobile-ball-overlay-v1.png` (mobile readability/layout).

## Additional progress (2026-03-13, gacha anti-blockage + snap final smooth)
- Hardened Gacha spin completion flow in `game.js` to guarantee UI unlock even if an error occurs mid-sequence:
  - wrapped the spin sequence in `try/catch/finally` so `state.gacha.spinning` always returns to `false`;
  - centralised reward reveal assignment in a helper to avoid inconsistent end states;
  - added a recovery attempt in `catch` to still unlock the chosen reward skin when possible.
- Removed reward reveal dependency on asset preload latency:
  - `unlockGachaRewardSkin` now starts sprite preload in background (`void ...catch`) instead of awaiting it,
  - this prevents end-of-reel stalls waiting on image decode/load before unlock is applied.
- Added deterministic two-phase reel stop for a consistent-duration ending with a smooth snap:
  - new constants: `GACHA_SPIN_FINAL_SNAP_DURATION_MS`, `GACHA_SPIN_MAIN_SCROLL_DURATION_MS`, `GACHA_SPIN_FINAL_SNAP_LEAD_PX`;
  - main scroll ends slightly before the reward, then a short eased snap lands exactly on reward center;
  - total spin timing remains fixed per run (`main + snap`).

## Validation (gacha anti-blockage + smooth snap)
- `node --check game.js`: PASS.
- Skill loop check (`run_playwright_check.ps1`): PASS.
- Seeded Gacha E2E (`tmp/pw_gacha_e2e_validate.cjs`): PASS.
  - assertions all true: coins -10, candidates -1, reward present, reward owned in save, `gacha_spinning=false`, modal still open.
  - screenshots updated: `output/web-game-gacha-e2e/before-spin.png`, `output/web-game-gacha-e2e/after-spin.png`.
- Multi-spin duration probe (3 consecutive seeded spins): stable timings around ~2.51s end-to-end (`2522ms`, `2508ms`, `2512ms`).

## Additional progress (2026-03-13, Pokedex modal + discovery states)
- Added a new bottom action button `Pokedex` in `index.html` (`#pokedex-btn`).
- Added a dedicated Pokedex modal (`#pokedex-modal`) with:
  - species grid (`#pokedex-grid`),
  - summary counters (`#pokedex-counter`),
  - detail panel (`#pokedex-info-panel`).
- Implemented Pokedex runtime logic in `game.js`:
  - new UI state: `pokedexOpen`, `pokedexHoverPokemonId`;
  - modal lifecycle: `openPokedexModal()`, `closePokedexModal()`, `renderPokedexGrid()`;
  - species source = full game catalog hints (route encounters + starters + save entities + loaded defs), sorted by id;
  - warmup loading for missing definitions via `warmupPokedexDefinitions()` so the full species set can be displayed.
- Added requested visual states for each species card:
  - never encountered/captured: black silhouette (`brightness(0) saturate(0)`),
  - encountered but not captured: sprite alpha `0.35`,
  - captured: sprite alpha `1`.
- Reused the same shiny / ultra-shiny symbols and badge classes as boxes (`boxes-mode-badge-*`, `?`) for Pokedex entries.
- Integrated modal coordination/UX:
  - Escape closes Pokedex;
  - click outside closes Pokedex;
  - opening map/shop/gacha/tutorial/reset/init now closes Pokedex;
  - canvas interactions are blocked while Pokedex is open;
  - `render_game_to_text` now exposes `pokedex_open`, `pokedex_hover_pokemon_id`, `pokedex_species_count`.

## Validation (this turn)
- `node --check game.js`: PASS.
- `npm run -s test:save`: PASS (15/15).
- Develop-web-game Playwright client smoke (new output dir):
  - `output/web-game-poke-pokedex-pass/shot-0.png..shot-2.png`
  - `output/web-game-poke-pokedex-pass/state-0.json..state-2.json`
- Targeted Playwright visual validation of Pokedex modal:
  - Screenshot: `output/pokedex-modal-check/pokedex-open.png`
  - Summary: `output/pokedex-modal-check/summary.json`
  - Verified values:
    - `pokedex_open: true`
    - `encountered_opacity: "0.35"`
    - `captured_opacity: "1"`
    - `unknown_filter: "brightness(0) saturate(0)"`

## Additional progress (desktop counters vertical alignment)
- Aligned left Pokeball counters to the same top Y-level as the right money counters in desktop mode.
- Implementation detail: adjusted `drawBallInventoryOverlay` panel Y anchoring to use overlay top padding on non-compact viewports.
- Kept compact/mobile behavior unchanged to avoid crowding.
- Visual validation: `output/ui-pass/desktop-counters-same-height-v1.png`.
- Pokedex text polish (2026-03-13):
  - removed status labels on Pokedex cards (no more "Capture" / "Rencontre" / "Jamais rencontre" under each card),
  - never-encountered species now display name `???` on cards,
  - never-encountered species also display `???` in the Pokedex info panel header.
- Validation:
  - `node --check game.js`: PASS.
  - Playwright smoke pass: `output/web-game-poke-pokedex-text-pass/`.

## Additional progress (Pokeball cards size parity + label removal)
- Increased Pokeball overlay row cards in desktop mode to match money card footprint (height/visual weight equivalent).
- Removed ball type text labels from Pokeball counters (`POKEBALL`, `SUPERBALL`, `HYPERBALL`).
- Kept numeric value + gauge + click behavior per row.
- Validation screenshot: `output/ui-pass/desktop-ball-size-equivalent-v2.png`.

## Additional progress (2026-03-13, gacha pointer exact center alignment)
- Fixed final Gacha centering offset between reel pointer and reward card center:
  - root cause was center math using `gachaReelWindowEl.clientWidth / 2` while reel items are laid out in the window content box (excluding horizontal padding), introducing an 8px bias.
  - updated `getGachaRewardTargetOffsetPx` to compute center from the reel window content width (`clientWidth - paddingLeft - paddingRight`).
- Result: final snap now lands on exact horizontal center under the pointer.

## Validation (pointer exact center)
- Numeric alignment probe after spin: `deltaPx = 0` (reward center - pointer center).
- Visual capture: `output/web-game-gacha-e2e/after-spin-alignment-check.png`.
- Skill Playwright loop (`run_playwright_check.ps1`): PASS.

## Additional progress (2026-03-13, Pokedex 493 complet + perf window)
- Pokedex species source switched to talent CSV catalog (`state.pokedexSpeciesCsvByPokemonId`) so the modal now uses the full 493-species roster.
- `loadPokemonTalentCsv` now records a Pokédex species entry for each valid `pokemon_id` row (even when one localized field is missing), preserving full catalog coverage.
- Reworked Pokedex rendering trigger flow in `game.js`:
  - removed full-grid rerender calls from `updateHud()` (was running repeatedly and causing lag),
  - added `queuePokedexGridRender()` + `cancelQueuedPokedexGridRender()` with `requestAnimationFrame` throttling,
  - hooked rerender queue on meaningful data changes only (CSV load update / species stat increments / modal open).
- Removed obsolete Pokedex warmup path that loaded all route definitions (`warmupPokedexDefinitions`) and replaced sprite fallback with deterministic CSV path resolution:
  - `pokemon_data/<id>_<name_en>/sprites/<id>_<name_en>_transparent_front.png`.
- Optimized grid rendering pass:
  - build cards in a `DocumentFragment` then `replaceChildren(...)`,
  - enable image `loading="lazy"` and `decoding="async"` for reduced open-time pressure.
- Added lightweight CSS rendering optimizations for the Pokédex grid/cards:
  - `align-content: start` on `.pokedex-grid`,
  - `contain: content`, `content-visibility: auto`, `contain-intrinsic-size` on `.pokedex-mon-btn`.

### Validation (Pokedex 493 + perf pass)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- `render_game_to_text` artifacts now report `pokedex_species_count: 493` in:
  - `output/web-game-poke/state-0.json`
  - `output/web-game-poke/state-1.json`
  - `output/web-game-poke/state-2.json`
- Targeted visual capture with Pokédex modal open:
  - `output/web-game-poke/pokedex-493.png`
  - `output/web-game-poke/pokedex-493-meta.json` (`{"pokedexCount":493,"subtitle":"Pokedex complet | 493 especes"}`).

- Added a dedicated skip-turn visual effect for team slots when a Pokemon does not attack on its turn (`TURN_ACTION_SKIP` with attacker present):
  - New per-slot FX state in `PokemonBattleManager`: `slotSkipTurnFx`.
  - New methods: `triggerSlotSkipTurnEffect`, `updateSlotSkipTurnEffects`, `getSlotSkipTurnVisual`.
  - Effect includes eased fade in/out, tremor offsets, slight squash/stretch, and grayscale blend.
- Hooked effect triggering in both combat loops:
  - `spawnNextProjectile(...)` (normal mode).
  - `simulateAttackTickInstant(...)` (idle simulation).
- Hooked effect rendering in team sprite draw path:
  - Applies jitter offsets and scale from skip FX.
  - Applies grayscale shader (saturation/brightness/contrast) merged with existing sprite shader so morphing/other shaders remain compatible.
- Validation:
  - `node --check game.js` passed.
  - `npm run test:save` passed (15/15).
  - Playwright skill run with starter click + combat wait produced artifacts: `output/skip-turn-smoke/`.
  - Targeted Magicarpe (`LOSER`) verification run confirmed passive skip event and visual frames:
    - State confirmation (`last_turn_reason: passive_no_attack`) in `output/skip-turn-verify/state-during.json`.
    - Visual sequence in `output/skip-turn-verify/shot-before.png`, `shot-during.png`, `shot-after.png` (gray+tremble during skip, color restored after).
- Note:
  - Temporary verification scripts and seeded save were created under `output/` (`tmp_skip_turn_verify.mjs`, `tmp_inspect_save_load.mjs`, `skip_turn_save_valid.json`) to force deterministic passive-no-attack coverage.

## 2026-03-13 - Once encounter gating + timer text cleanup
- Changed `only-one` encounter cycle behavior in `game.js` so the 1/50 counter is armed only after the route unlock defeat target is reached (e.g. 20/20 for next zone).
- While unlock target is not reached, the `only-one` cycle is forced to `0` and cannot increment/spawn.
- Kept fallback safety for routes that would otherwise have no normal encounters.
- Updated timer HUD rendering so `only-one` timers never show the route defeat counter text (`X / Y Pokemon battus`).

Validation:
- `node --check game.js`: PASS
- `npm run test:save`: PASS (15/15)
- `run_playwright_check.ps1`: PASS
- `run_playwright_long.ps1`: PASS
- `run_playwright_projectile.ps1`: PASS
- `run_playwright_capturechance.ps1`: timed out in this environment, but generated screenshots/states before timeout in `output/web-game-capturechance/`.

## Additional progress (2026-03-13, Pokedex sprite defaults par generation)
- Updated Pokedex sprite selection to use generation-aware default variant priority (Pokedex-only, no global team/combat sprite behavior changes):
  - Dex #1-#386: prefer `firered_leafgreen`, fallback `emerald`, then `ruby_sapphire`.
  - Dex #387-#493: prefer `diamond_pearl`, fallback `heartgold_soulsilver`, then `platinum`.
- Added dedicated Pokedex variant constants and resolver helpers in `game.js`:
  - `POKEDEX_VARIANT_PREFERENCE_GEN_1_TO_3`
  - `POKEDEX_VARIANT_PREFERENCE_GEN_4`
  - `resolvePokedexSpeciesSpritePath(...)`
- For species not preloaded in `state.pokemonDefsById`, Pokedex now uses deterministic offline-safe fallback paths so cards still render fast while respecting requested defaults.
- Kept existing silhouette/alpha/??? rules untouched.

### Validation (sprite defaults)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted browser extraction from open Pokedex:
  - `output/web-game-poke/pokedex-default-variants-meta.json`
  - sample `src` results:
    - `#025` -> `..._firered_leafgreen_front.png`
    - `#152` -> `..._emerald_front.png` (fallback when FRLG is unavailable in assets)
    - `#216` -> `..._firered_leafgreen_front.png`
    - `#386` -> `..._firered_leafgreen_front.png`
    - `#387` -> `..._diamond_pearl_front.png`
    - `#493` -> `..._diamond_pearl_front.png`
- Visual artifact:
  - `output/web-game-poke/pokedex-default-variants.png`

## 2026-03-13 - Team drag & drop mobile tactile UX
- Reworked team drag/drop input handling on canvas from mouse-only listeners to pointer events (`pointerdown/move/up/cancel`) so touch + mouse are both supported in one flow.
- Added active pointer tracking for team drag (`teamDragPointerId`, `teamDragPointerType`) to avoid multi-touch conflicts and ignore unrelated pointers.
- Added pointer capture/release during drag for stable touch interactions even if the finger leaves the canvas bounds mid-gesture.
- Added touch-specific drag activation tuning (`getTeamDragActivationDistancePx`) to reduce accidental drags on tap.
- Expanded slot hit radius for touch drag targeting (`findHoveredTeamSlot(..., { pointerType: "touch" })`) to make mobile drops easier and more reliable.
- Kept desktop behavior intact: hover popups/cursor only react to mouse pointer moves, while touch avoids noisy hover states.
- Updated canvas CSS to `touch-action: none` to prevent gesture interference during drag.

Validation:
- `node --check game.js`: PASS
- `run_playwright_check.ps1`: PASS
- Mobile touch drag functional verification (Playwright mobile context with seeded save):
  - Team order before: `[1,4,7]`
  - Team order after touch drag swap: `[4,1,7]`
  - Artifact screenshot: `output/mobile-team-drag-swap.png`
  - Artifact state log: `output/mobile-team-drag-state.json`

## Additional progress (Pokeball counters hover polish)
- Removed bounce-style hover movement on Pokeball counters.
- Replaced with pure hover enlargement (scale-in-place) for cleaner interaction.
- Removed yellow active outline from Pokeball counters (kept consistent blue border styling).
- Removed right-side arrow glyph from Pokeball counter rows.
- Validation screenshots:
  - `output/ui-pass/desktop-ball-hover-clean-v3.png`
  - `output/ui-pass/desktop-ball-hovered-v3.png`

## Additional progress (2026-03-13, Pokedex ultra-optimisation window/data/sprites)
- Implemented Pokedex rendering virtualization to drastically reduce DOM work:
  - only visible cards (+ small overscan) are mounted while scrolling,
  - top/bottom spacers preserve full scroll height,
  - viewport slices are rendered through `requestAnimationFrame`.
- Added Pokedex cache lifecycle to reduce repeated heavy computations:
  - species entries cached by id/list,
  - encountered/captured species counters cached,
  - cache invalidation wired on species progression and talent CSV updates.
- Removed per-card listener overhead for Pokedex cards:
  - switched to event delegation (`mouseover`, `focusin`, `click`) on the grid container.
- Added adaptive virtual layout metrics:
  - live measurement of grid paddings/gaps across responsive breakpoints,
  - dynamic column count and row slicing.
- Added sprite loading optimizations:
  - prefetch around the visible slice (`Image()` prewarm) to smooth scroll,
  - visible-slice-only image mounting (instead of all 493 at once),
  - decorative sprite `alt` removed (button keeps `aria-label`) to avoid fallback text paint noise.
- Added dedicated Pokedex virtual CSS layer:
  - `.pokedex-virtual-content` + spacer blocks,
  - fixed card height for stable row math and reduced reflow cost,
  - preserved all existing discovery visuals (`unknown` silhouette / alpha encountered / alpha captured).

### Validation (ultra-optimisation)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted Pokedex performance probe with modal open + bottom scroll:
  - `output/web-game-poke/pokedex-optimized-metrics.json`
  - measured:
    - total species in dex: `493`
    - rendered cards at top: `77` (instead of 493)
    - rendered cards near bottom: `52` (instead of 493)
- Visual artifact:
  - `output/web-game-poke/pokedex-optimized-window.png`

## Additional progress (enemy HP bar full width + centered value)
- Updated enemy HP HUD rendering in `game.js` (`drawEnemyHpBar`):
  - Removed the reserved right-side numeric zone so the HP track now uses the full available width of the HP panel (after the `HP` chip).
  - Moved HP value text (`current/max`) inside the HP track.
  - Centered HP value text horizontally in the track with adaptive font shrink and in-track clipping for readability/stability.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Targeted Playwright visual capture with starter/route automation: `output/hpbar-layout-check/combat-hpbar-clean.png`.
  - State confirms combat scene active during capture: `output/hpbar-layout-check/state-clean.json` (`route_combat_enabled: true`, enemy present).

## Additional progress (enemy HP text contrast adaptive)
- Improved enemy HP text readability in `drawEnemyHpBar` (`game.js`) so the value stays legible regardless of bar color/fill state:
  - Added adaptive contrast selection from sampled fill/track luminance.
  - Split text rendering into two clipped passes (filled segment vs empty segment), each with its own contrasting fill + outline.
  - Kept in-bar centered placement and width-adaptive font sizing.
- Added small color utilities used by the HUD renderer:
  - `parseRgbaColor`, `lerpColorChannel`, `getColorLuminance`, `pickContrastingHudTextColor`.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.

## Additional progress (2026-03-13, Pokedex sprite loading animation)
- Added a per-card loading animation in Pokedex while sprite images are loading:
  - each visible card sprite now gets a lightweight 3-dot animated indicator during fetch/decode,
  - indicator auto-removes on `img load`,
  - if sprite loading fails, card falls back to `?` visual and exits loading state cleanly.
- Implemented image loading lifecycle helpers in `game.js`:
  - `createPokedexLoadingIndicatorElement()`
  - `attachPokedexSpriteLoadingLifecycle(...)`
- Updated card creation path so visible virtualized cards use the new lifecycle (`createPokedexCardButton`).
- Added CSS animation styles in `styles.css`:
  - `.pokedex-loading-indicator`
  - `.pokedex-loading-dot`
  - `@keyframes pokedex-loading-bounce`
  - pending-image opacity control with `.boxes-mon-visual.is-loading .pokedex-mon-sprite.is-pending`.

### Validation (loading animation)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted throttled DOM probe confirms loading nodes are present during Pokedex sprite fetch:
  - `output/web-game-poke/pokedex-loading-animation-dom-probe.json`
  - observed sample: `loadingWrappers: 62`, `loadingDots: 186`.

## Additional progress (2026-03-13, mobile phone UI overhaul compact + overlap fixes)
- Reworked phone HUD density and spacing in `styles.css` (new final mobile override block at file end):
  - top HUD compacted (route bar + resource pills reduced height/padding/font sizes),
  - action dock tightened while keeping 6 buttons visible,
  - route progress text hidden on phone to reclaim vertical space,
  - notification stack moved above bottom dock (`bottom` safe offset raised) to prevent masking `Map`/`Pokedex` row.
- Fixed route defeat timer vertical anchoring in `game.js` (`drawRouteDefeatTimerBar`):
  - changed Y anchor logic to stay *below* top HUD instead of clamping toward overlap-prone top values.
- Compacted left ball inventory overlay in `game.js` (`drawBallInventoryOverlay`) for phone profiles:
  - reduced icon size, row height, paddings, row gaps, and compact target width.

### Validation
- `node --check game.js`: PASS.
- `powershell -ExecutionPolicy Bypass -File .\\run_playwright_check.ps1`: PASS.
- Dedicated phone viewport iterative validation loop (`tmp/mobile_ui_validation.mjs`): PASS with no console/page errors.
- Updated visual artifacts:
  - `output/mobile-ui-loop/00-town-current.png` (clean town HUD + full dock visible)
  - `output/mobile-ui-loop/01-home.png` (route gameplay with compact HUD and visible dock first row)
  - `output/mobile-ui-loop/report.json` (geometry + interaction diagnostics)

### Notes / next
- Playwright mobile `page.click` remains flaky on some fixed overlay elements in this app context; touch/DOM dispatch checks were used for resilience.
- If needed later: build a deterministic touch-only mobile E2E script that advances tutorial states and validates each modal open/close path in isolation.
- Added isolated touch-modal validation run on phone viewport (new artifact `output/mobile-ui-loop/modal-touch-check.json`):
  - `Map`, `Pokedex`, `Shop`, `Gacha` all open + close successfully (`opened=true`, `closed=true` per modal).

## Additional progress (2026-03-13, perf boot + FPS optimization pass)
- Optimized frame-time stability by removing per-frame layout recomputation pressure:
  - Added throttled layout refresh helper `refreshLayoutIfNeeded(...)` in `game.js`.
  - New cadence constant: `LAYOUT_RECOMPUTE_INTERVAL_MS = 220`.
  - Render/update now reuse cached layout; forced recompute only on key transitions (resize/route switch/start battle/init).
  - Idle simulation path avoids unnecessary layout churn when possible.
- Optimized arena boot asset strategy:
  - `getInitialAssetRouteIds()` now loads only the strict initial route set (current/default + Route 1 tutorial only when needed), instead of all unlocked routes.
  - `initializeScene()` now preloads only the initial route background before entering ready state.
  - Type icons + team appearance assets are now deferred with `Promise.allSettled(...)` and applied asynchronously after boot.
- Reduced background warmup spikes (post-boot stutter reduction):
  - `queueDeferredRouteAssetWarmup(...)` now warms routes in chunks (`DEFERRED_ROUTE_WARMUP_CHUNK_SIZE = 2`) scheduled via idle callback/timeout loop.

### Validation (perf pass)
- `node --check game.js`: PASS.
- `npm run test:save`: PASS (15/15).
- `powershell -ExecutionPolicy Bypass -File .\\run_playwright_check.ps1`: PASS (no new console/page error produced in this run).
- Extended Playwright run produced ready-state screenshots on latest pass (`output/web-game-ko/shot-15.png`, `state-15.json` mode `ready`).

### Notes
- A transient regression (`ReferenceError: idleMode is not defined`) was introduced during refactor and fixed in the same pass; subsequent runs no longer generate a new corresponding error artifact.

## Additional progress (2026-03-13, audit backgrounds FRLG zones + blur)
- Audited all 47 Kanto FRLG zones (`map_data/kanto_frlg_zones.json`) for `route_id -> background_image` consistency.
- Fixed wrong dungeon background sources in generators/scripts:
  - Diglett's Cave: `Diglett_Cave_FRLG.png` (was `Kanto_Digletts_Cave_Map.png`).
  - Pokemon Tower: `Pokémon_Tower_1F_FRLG.png` (was `Pokémon_Tower_FRLG.png`).
  - Pokemon Mansion: `Pokémon_Mansion_1F_FRLG.png` (was `Pokémon_Mansion_FRLG.png`).
- Refreshed all FRLG backgrounds with the blur pipeline (`scripts/redownload_frlg_backgrounds_with_blur.py`).
- Updated zone naming alignment for Rock Tunnel:
  - `route_name_fr`: `Tunnel Roche (Kanto)` in catalog, zone JSON, and CSV rows.
- Validation:
  - Automated audit script: 47 zones checked, 0 missing/mismatched backgrounds.
  - Visual checks: Diglett/Tower/Mansion backgrounds now use proper FRLG area layouts.
  - Playwright smoke run: `run_playwright_check.ps1` completed, screenshots refreshed in `output/web-game-poke`.
  - Generated full visual audit sheet: `output/background-audit/kanto_backgrounds_audit_sheet.png`.

## Additional progress (2026-03-13, loading screen UX overhaul)
- Replaced the old canvas loading text with a dedicated full-screen loading overlay:
  - black background,
  - animated rotating Pokeball,
  - centered white message: "Le code de ce jeu a ete entierement genere par IA." (displayed with proper accents in UI).
- Added a stylized transition from loading to gameplay:
  - loading core scales/fades with blur,
  - radial flash pulse,
  - overlay fades out smoothly before gameplay remains visible.
- Wired lifecycle in `game.js`:
  - `showLoadingScreen(...)` at `initializeScene()` start,
  - `hideLoadingScreen()` on `state.mode = "ready"`,
  - immediate hide on error fallback.
- Kept a black fallback render while mode is `loading` so no old loading text appears on canvas.

### Validation
- `node --check game.js`: PASS.
- `powershell -ExecutionPolicy Bypass -File .\\run_playwright_check.ps1`: PASS.
- `npm run test:save`: PASS (15/15).
- Dedicated full-page visual capture script for loading flow:
  - `output/loading-screen-check/01-loading-visible.png`
  - `output/loading-screen-check/02-loading-transition.png`
  - `output/loading-screen-check/03-game-visible.png`
- Pokedex header progress summary refined and validated:
  - Added 4 natural-language progress lines (rencontres, captures, shiny hors ultra, ultra shiny) with count/total and percent.
  - Added dedicated responsive card layout for these stats in the Pokedex header.
  - Verified runtime values against 493 species denominator and shiny-non-ultra split logic.
  - Validation: `node --check game.js` PASS, `run_playwright_check.ps1` PASS.
  - Added visual artifact: `output/pokedex-header-stats.png` (+ extracted lines JSON) showing the new header in-game.
- Increased enemy HP numeric value text size in `drawEnemyHpBar`:
  - base size now uses `panelHeight * 0.5` (was `* 0.38`),
  - minimum shrink floor now `9px` (was `7px`).
- Validation: `node --check game.js` PASS, `run_playwright_check.ps1` PASS.
- Pokedex header: added a primary global completion KPI (prominent line) that aggregates all 4 tracked species metrics.
  - Formula: average of encountered%, captured%, shiny(excluding ultra)% and ultra shiny%.
  - Implemented in `setPokedexHeaderProgressSummary` with dedicated formatter.
  - Added UI element + styles for emphasized display.
  - Validation: `node --check game.js` PASS, `run_playwright_check.ps1` PASS.
  - Visual check artifact: `output/pokedex-header-global-completion.png`.

## Additional progress (floating damage text tween + palette rework)
- Reworked floating enemy damage texts in `game.js` to use impact-tone driven visuals instead of attacker type colors.
  - Added tone categories: `miss`, `resist`, `normal`, `super`, `critical`.
  - Added new fixed palette mapping requested by user:
    - miss/immune -> semi-transparent gray
    - not very effective -> dull violet/blue
    - normal -> yellow/orange
    - super effective -> dynamic orange/red
    - critical -> very dynamic red
- Added per-tone tween presets (enter/settle/exit durations, easing curves, pulse strength, spawn jitter, rise/drift speed).
- Added dynamic scaling based on damage magnitude + context (super/critical boosts), and per-tone alpha/pulse behavior.
- Replaced shorthand labels with explicit FR labels used by the player-facing feedback:
  - `RATE`, `N'AFFECTE PAS`, `PAS TRES EFFICACE`, `EFFICACITE NORMALE`, `COUP CRITIQUE`.
- Updated enemy hit FX tinting to follow the same tone logic (not attacker type driven).

## Validation (manual + scripted)
- `node --check game.js`: PASS.
- Develop-web-game client smoke run: `output/web-game-poke` (no execution error).
- Manual Playwright scenario (starter -> Route 1 -> close tutorial -> combat polling) captured multiple states:
  - Normal effectiveness label: `output/manual-damagefx-hit-clear-canvas.png`, `output/manual-damagefx-hit-clear-state.json`.
  - Critical/resist combination: `output/manual-damagefx-crit-canvas.png`, `output/manual-damagefx-crit-state.json`.
  - Miss (`RATE`) case: `output/manual-damagefx-miss-canvas.png`, `output/manual-damagefx-miss-state.json`.
  - Post-patch regression check snapshot: `output/manual-damagefx-postpatch-canvas.png`, `output/manual-damagefx-postpatch-state.json`.
- Label sweep artifact confirms live labels seen during combat:
  - `output/manual-damagefx-labels.json` includes `EFFICACITE NORMALE`, `PAS TRES EFFICACE`, `COUP CRITIQUE PAS TRES EFFICACE`.
- Pokédex UX pass (accents + scroll + loader):
  - Added explicit UTF-8 accented labels in Pokédex header/info texts.
  - Hardened UI text normalization (`lib/text-normalization.js`) to decode mojibake in multiple passes and fixed FR typography replacements.
  - Updated normalization tests to assert proper accented outputs.
  - Added non-passive `wheel` handling on Pokédex grid to make trackpad momentum scroll directly controllable/stoppable.
  - Replaced Pokédex card loading dots with a rotating Pokéball loader.
  - Validation:
    - `node --check game.js` PASS
    - `node --check lib/text-normalization.js` PASS
    - `node --test tests/text-normalization.test.mjs` PASS
    - `run_playwright_check.ps1` PASS
  - Visual artifacts:
    - `output/pokedex-interface-accents.png`
    - `output/pokedex-loader-pokeball.png`
    - scroll/loader runtime metrics in `output/pokedex-accent-scroll-loader.json` and `output/pokedex-loader-ball-count.json`.

## Additional progress (damage text sizing + discreet labels + horizontal sway)
- Updated floating damage text behavior in `game.js` per user request:
  - hidden normal-effectiveness label (`EFFICACITE NORMALE` no longer shown),
  - reduced global floating text size/scale,
  - reduced effectiveness label size and opacity to make it more discreet,
  - added clear left/right sway (oscillating horizontal jump) during text lifetime.
- Kept miss/immune/super/crit categories and color mapping intact.

## Validation
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Manual combat captures:
  - normal hit with empty label: `output/manual-damagefx-user2-normal-canvas.png`, `output/manual-damagefx-user2-normal-state.json`.
  - not-very-effective hit with smaller/discreet label: `output/manual-damagefx-user2-resist-canvas.png`, `output/manual-damagefx-user2-resist-state.json`.
  - summary artifact confirming normal label hidden: `output/manual-damagefx-user2-summary.json`.

## Additional progress (floating damage text viewport compaction)
- Added viewport-aware compaction in `drawFloatingDamageTexts` so dynamic damage text scales down significantly on phone-sized screens and remains reasonably small on all formats.
- Kept previous behavior: normal effectiveness label hidden, effectiveness labels discreet.
- Tuned stroke widths and sway amplitude to match the compacted size profile.

## Validation
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Mobile viewport (390x844) combat captures:
  - no normal-effectiveness label + compact number: `output/manual-damagefx-mobile-canvas.png`, `output/manual-damagefx-mobile-state.json`.
  - not-very-effective case in mobile viewport: `output/manual-damagefx-mobile-resist-canvas.png`, `output/manual-damagefx-mobile-resist-state.json`.

## Additional progress (Electron desktop shell + local JSON save bridge)
- Added Electron desktop runtime:
  - `electron/main.mjs` with secure BrowserWindow wrapper for GitHub Pages URL.
  - `electron/preload.mjs` exposing a restricted `window.pokeidleDesktop` bridge (`readSave`, `writeSave`, `deleteSave`, `notify`, `getMeta`).
- Added desktop save source priority in `lib/browser-save-utils.js` and test coverage in `tests/browser-save-utils.test.mjs`.
- Extended `game.js` save backend:
  - desktop save read candidate included at load time,
  - async queued desktop write pipeline + retries,
  - desktop+browser fallback status indicator (`Sauvegarde locale (Desktop)` / browser / unavailable),
  - desktop delete integrated into reset flow.
- Extended notification flow in `game.js` to use desktop bridge notifications when available.
- Updated project config:
  - `package.json` scripts: `desktop:start`, `desktop:build`,
  - electron-builder config for Windows NSIS output in `output/electron-dist`,
  - disabled auto code-sign discovery in build script to avoid local privilege blockers.
- Updated `README.md` with desktop launch, URL override, and `.exe` build instructions.

## Validation
- `npm run test:save`: PASS.
- `node --check electron/main.mjs`: PASS.
- `node --check electron/preload.mjs`: PASS.
- `node --check game.js`: PASS.
- `npm run desktop:build`: PASS.
  - generated installer: `output/electron-dist/PokeIdle-Setup-0.1.14.exe`.
- Desktop runtime screenshot:
  - `output/electron-dist/desktop-screenshot-pokeidle.png`.

## Additional progress (2026-03-14, fix starter modal invisible after reset/new game)
- Fixed starter modal visibility regression in `game.js`:
  - Replaced starter modal show/hide tween calls with immediate open/close behavior (`showStarterModal` / `hideStarterModal`).
  - Added explicit tween stop + inline style cleanup for starter modal and panel (`opacity/transform/filter/pointer-events`) before toggling `hidden`.
- Root cause found during repro:
  - When team is empty (`!state.team.length`), simulation updates are skipped, so UI tweens do not advance.
  - Starter modal entered `showModalWithTween` at opacity 0 and stayed visually invisible despite `starter_modal_visible: true`.

### Validation (this turn)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted reset/new-game repro:
  - `output/reset-repro-afterfix-check.json` confirms after reset: `starter_modal_visible: true`.
  - DOM style probe confirms visible modal values after reset: modal/panel computed opacity = `1`.
- Visual artifact (starter modal visible):
  - `output/starter-modal-dom-afterfix.png`.

## Additional progress (appearance unlock default + level 10 tutorial trigger)
- Updated appearance access behavior so the appearance editor is unlocked by default for all saves:
  - `createDefaultTutorialProgress().appearance_editor_unlocked` now defaults to `true`.
  - `normalizeTutorialProgress()` now forces `appearance_editor_unlocked` to `true` to migrate older saves.
- Kept the appearance tutorial trigger tied to progression instead of lock state:
  - `queueAppearanceTutorialIfNeeded()` now requires at least one unlocked Pokemon at level >= 10.
  - This prevents tutorial popup at startup when no Pokemon has reached level 10 yet.
  - Tutorial still queues once a Pokemon reaches (or already exceeds) level 10 and was not seen before.
- Updated the appearance tutorial text to match new behavior:
  - Appearance is available from start.
  - Tutorial appears first time a team Pokemon reaches level 10.

## Validation runs
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- `output/web-game-poke/state-2.json` confirms `appearance_editor_unlocked: true` on fresh start.
- Screenshot reviewed: `output/web-game-poke/shot-2.png` (starter scene renders correctly, no modal regression).
- Additional Playwright seeded-save validation: PASS.
  - Forced a save snapshot with one team Pokemon level 10 and `appearance_intro_seen=false`.
  - Confirmed runtime state opened tutorial flow: `tutorial_open=true`, `tutorial_flow_id="appearance_intro"`.
  - Screenshot reviewed: `output/web-game-poke/appearance-level10-tutorial.png`.

## Additional progress (architecture + toolchain cleanup, 2026-03-14)
- Reorganized maintenance scripts by domain while keeping root compatibility wrappers:
  - Added `scripts/map/` and moved:
    - `scripts_generate_kanto_routes_frlg.mjs` -> `scripts/map/generate-kanto-routes-frlg.mjs`
    - `scripts_generate_kanto_zones_frlg.mjs` -> `scripts/map/generate-kanto-zones-frlg.mjs`
    - `scripts_export_zone_encounters_csv.mjs` -> `scripts/map/export-zone-encounters-csv.mjs`
  - Added `scripts/data/pokemon/` and moved:
    - `download_pokemon_data.py`
    - `scripts_download_gen1_4_sprites.py`
    - `scripts_download_pokemon_catch_rates.py`
    - `scripts_download_pokemon_heights.py`
    - `scripts_enrich_pokemon_data_missing.py`
  - Added `scripts/testing/playwright/` and moved Playwright scenario scripts.
- Added root wrappers (same old filenames/entrypoints) to preserve existing workflows and manual commands.
- Introduced a shared Playwright scenario runner:
  - `scripts/testing/playwright/invoke-web-game-playwright.ps1`
  - Refactored scenario scripts (`check`, `long`, `ko`, `projectile`, `capturechance`) to reuse it.
- Added a shared Python helper module for Pokemon data tooling:
  - `scripts/data/pokemon/common.py`
  - Refactored catch-rate/height/enrichment scripts to remove duplicated networking/retry/path logic.
- Added shared JS numeric utilities:
  - `lib/number-utils.js` with `clamp` + `toSafeInt`.
  - Reused in `lib/audio-manager.js`, `lib/browser-save-utils.js`, and `lib/save-consistency.js`.
- Fixed runtime parsing API gap:
  - Added `parseSaveBridgePayload` export in `lib/runtime-data.js`.
- Improved test architecture:
  - Added `vitest` dev dependency.
  - Added `vitest.config.mjs` to isolate Vitest suite to `tests/**/*.test.js` and enable globals.
  - Updated npm scripts:
    - `test`, `test:node`, `test:vitest` (+ kept `test:save` alias).
- Added new unit tests:
  - `tests/number-utils.test.mjs`.
- Improved repository hygiene:
  - Updated `.gitignore` (tool caches and runtime artifacts).
  - Added architecture doc: `docs/ARCHITECTURE.md`.
  - Updated README with test commands and new script architecture.

### Validation runs
- `node --check` on moved/root JS script entrypoints: PASS.
- `py -3 -m py_compile` on moved/root Python script entrypoints and shared module: PASS.
- `npm run test:node`: PASS (19 tests).
- `npm run test:vitest`: PASS (8 tests).
- `npm test`: PASS.
- `run_playwright_check.ps1`: PASS.
- `run_playwright_projectile.ps1`: PASS.

### TODO / Next
- Optionally add dedicated CI workflow to run `npm test` on push/PR.
- Consider incrementally extracting subsystems from `game.js` monolith into modular runtime files.

## Additional progress (post-unknown-cave encounters refresh)
- Added a new generated encounters dataset: `map_data/kanto_zone_encounters_post_unknown_cave.csv`.
  - 47 zones covered, balanced per zone (9 to 18 species each).
  - 644 encounter rows total.
  - 458 unique species from #001-493 (all non-legendary/non-mythical Gen 1-4 species).
  - All 12 Gen 1-4 starters included with `spawn_weight = 1` (rare).
  - No `only-one` entries in this post-unlock mapping.
- Added generation script: `scripts/map/generate-post-unknown-cave-encounters.mjs`.
  - Builds a coherent biome-based mapping by route/dungeon/town tags.
  - Applies rarity scaling via stats/stage/catch-rate.
  - Enforces exclusions for legendary + mythical IDs.
  - Validates coverage + constraints before writing CSV.
- Wired runtime activation in `game.js`:
  - New post-unlock CSV path constant.
  - Loads both base and post-unknown-cave CSVs at startup.
  - Switches encounter source automatically when `kanto_dungeon_cerulean_cave` is unlocked.
  - Refreshes catalog encounter tables live when mapping activates.
- Added one-shot popup announcement when the new mapping activates:
  - Message exactly as requested.
  - Persisted flag in save: `post_unknown_cave_mapping_notice_seen`.
  - Works for old saves already beyond Unknown Cave (popup shown once on load).
- Save model updates:
  - `createEmptySave()` and `normalizeSave()` now include `post_unknown_cave_mapping_notice_seen`.
- Added regression test: `tests/post-unknown-cave-encounters.test.mjs`.
  - Verifies no legendary/mythical IDs in post mapping.
  - Verifies starters remain at weight 1.
  - Verifies full 458-species coverage and balanced route counts.
- Validation performed:
  - `node --check game.js` passed.
  - `npm test -- --runInBand` passed.
  - Playwright smoke run via `run_playwright_check.ps1` passed; fresh screenshots generated in `output/web-game-poke/`.

## TODO / Next suggestions
- Add a small dev/debug command to force-enable post-unknown-cave mapping for QA without full progression.
- Consider a second balancing pass from real capture telemetry (too many/too few seen species per zone over time).
- If needed, expose a CSV diff report (base vs post-unknown-cave) for easier balancing reviews.
## Additional progress (gacha x10)
- Added a batch gacha purchase flow: `x10` skins for `100 Coins`, while keeping the original single-spin option (`10 Coins`).
- Added a dedicated gacha batch animation variant:
  - Longer reel main-scroll duration for batch spins.
  - Distinct machine visual state (`is-spinning-10`) and mode-specific status text updates.
- Extended gacha result UI to support multi-reward output:
  - New result list container showing all won skins in order.
  - Result header now switches between single reward and `Resultat x10` presentation.
  - Preview keeps a highlighted reward sprite (last unlocked in the batch).
- Extended runtime gacha state:
  - `state.gacha.lastRewards` and `state.gacha.lastSpinCount` added.
  - `render_game_to_text` now exposes `gacha_last_rewards` for automation/assertions.
- Added a second button in gacha modal: `Obtenir 10 skins (100 Coins)`.

## Validation runs (gacha x10)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Custom Playwright pass with seeded save (`tmp/dev_seed_gacha10.json`) to validate gacha x10 end-to-end:
  - Triggered `#gacha-btn` then `#gacha-spin-10-btn`.
  - Waited for `gacha_spinning = false` and `gacha_last_rewards.length >= 10`.
  - Artifacts:
    - `output/web-game-gacha10/shot-gacha10.png`
    - `output/web-game-gacha10/state-gacha10.json`
  - Observed result: 10 rewards listed in UI, coins decremented by 100, no console/page errors captured.

## TODO / suggestions
- Consider adding an explicit summary line `X nouveaux skins sur 10` if duplicate-protection behavior is changed later.
- If desired, add an optional "ouvrir 10 fois" accelerated reel mode with reduced card count for faster UX on mobile.

## Additional progress (2026-03-14, compteur Pokeballs en valeur reelle)
- Updated `game.js` in `drawBallInventoryOverlay()` to display raw integer counts for Pokeball rows instead of compact notation (`K/M/B`).
  - Replaced `formatCompactNumber(...)` with `String(Math.max(0, toSafeInt(row.count, 0)))` for:
    - width measurement pass
    - rendered value text
- Result: examples like `9K` now render as `9000` in the left Pokeball counters overlay.

## Validation (compteur Pokeballs valeur reelle)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted seeded Playwright run with `pokeballs=9000`: PASS.
  - state confirms `pokeballs: 9000` and `ball_inventory.poke_ball: 9000`.
  - screenshot confirms overlay displays `9000` (not `9K`):
    - `output/web-game-pokeball-9000-v4/shot-0.png`

## Additional progress (suppression systeme meteo -> cycle jour/nuit local)
- Supprime tout le systeme meteo dans `game.js`:
  - retrait des constantes de slots/transitions meteo;
  - retrait des tables/types/profils meteo;
  - retrait des fonctions de blend meteo/orage et des effets pluie, brouillard, eclairs, soleil.
- Le snapshot environnement est maintenant strictement base sur l'heure locale du device:
  - `07:00` a `18:59` => `day` (`dayLight = 1`, `night = 0`)
  - `19:00` a `06:59` => `night` (`dayLight = 0`, `night = 1`)
- Ajout de `LOCAL_DAY_START_HOUR = 7` et `LOCAL_NIGHT_START_HOUR = 19`.
- Ajout du champ debug `local_time_of_day` dans `render_game_to_text`.
- Suppression des champs debug meteo (`weather_current`, `weather_from`, `weather_to`, `weather_transition_blend`, `weather_weights`, `weather_lightning_intensity`).
- Le grading jour/nuit continue de s'afficher meme en qualite de rendu basse.

## Validation (suppression meteo)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Verification text state: `output/web-game-poke/state-2.json`
  - `local_hour: 20`, `local_time_of_day: "night"`, `daylight_factor: 0`, `night_factor: 1`.
- Verification visuelle: `output/web-game-poke/shot-2.png` (teinte nuit visible, plus aucun effet meteo).

## TODO / Next (meteo)
- Optionnel: exposer les heures 7/19 via un mini panneau debug pour ajustement live si besoin.
## Additional progress (gacha x10 animation visibility pass)
- Updated batch gacha flow so the x10 spin now includes a visible in-animation reveal stage:
  - Added `#gacha-batch-reveal` panel in the gacha machine.
  - During x10 spin, 10 slots are shown and revealed one by one as skins are unlocked.
- Updated result section rendering to explicitly show the 10 obtained skins as reward cards (sprite + name + variant), not only text lines.
- Adjusted gacha CSS for compact multi-card layouts so 10 rewards fit in the result area on desktop and remain readable on mobile.

## Validation (animation + result visibility)
- `node --check game.js`: PASS.
- Timeline probe confirmed x10 animation reveal panel lifecycle:
  - `gacha_spinning=true` while `gacha-batch-reveal` becomes visible with 10 child cards.
  - End state switches to `gacha_spinning=false` with `gacha_last_rewards=10`.
- Final visual artifact:
  - `output/web-game-gacha10/shot-gacha10.png`
  - Shows result section containing the 10 obtained skins.
## Additional progress (result focus layout)
- Added `show-result-focus` layout mode on gacha card when rewards are available.
- In result focus mode, the top gacha UI (wallet + machine/reel section) is hidden and replaced by a large result panel.
- Scaled up reward cards significantly (sprite + labels) for clearer visibility.
- Kept spin action buttons accessible below the enlarged result block.

## Validation (result focus)
- `node --check game.js`: PASS.
- Playwright gacha x10 capture confirms:
  - top section replaced by result block,
  - 10 rewards shown in large cards,
  - `gacha_last_rewards.length = 10`.
- Artifact: `output/web-game-gacha10/shot-gacha10.png`

## Additional progress (temporary bottom dock replacement)
- Temporarily disabled the bottom `action-dock` menu visually by adding `is-temporary-disabled` on the footer in `index.html` while keeping existing buttons in DOM for JS bindings.
- Added a dock replacement container that reuses the loading-screen Pokeball style (`loading-pokeball`) and placed it bottom-center in the dock.
- Added CSS override block in `styles.css` so `.action-dock.is-temporary-disabled` hides action buttons and displays a centered Pokeball with adapted size for the dock.
- Validation:
  - `run_playwright_check.ps1`: PASS (no error output).
  - Additional Playwright capture produced:
    - `output/web-game-poke/shot-actiondock-full.png`
    - `output/web-game-poke/shot-actiondock-only.png`
- Removed gameplay frame/liseret by disabling .game-stage box-shadow and hiding .game-stage::after in final CSS overrides.
- Ran Playwright check (un_playwright_check.ps1); latest screenshot output/web-game-poke/shot-2.png confirms the outer gameplay frame is gone.

## Additional progress (pokeball toggle -> fullscreen action grid)
- Implemented a fullscreen action menu opened from the temporary bottom Pokeball:
  - New clickable Pokeball toggle: `#action-dock-pokeball-toggle`.
  - New fullscreen overlay menu: `#action-dock-fullscreen-menu`.
  - Responsive action grid: `#action-dock-fullscreen-grid` with 6 actions (Map, Pokedex, Shop, Gacha, Notifs Windows, Reset save).
- Behavior:
  - First click on Pokeball opens fullscreen menu.
  - Re-click on Pokeball in menu closes it.
  - `Esc` closes the fullscreen menu.
  - Clicking an action card relays to the original hidden button (`data-action-target`) and closes the menu.
- CSS:
  - Added full-screen blurred overlay skin and responsive grid layout (`auto-fit` desktop, 2 columns mobile).
  - Preserved old button logic by keeping original buttons in DOM and hidden in temporary dock mode.

## Validation (pokeball fullscreen menu)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Dedicated Playwright captures:
  - Closed state: `output/web-game-poke/shot-pokeball-menu-closed.png`
  - Open fullscreen menu: `output/web-game-poke/shot-pokeball-menu-open.png`
  - Grid crop: `output/web-game-poke/shot-pokeball-menu-grid.png`
  - Re-closed state after second Pokeball click: `output/web-game-poke/shot-pokeball-menu-reclosed.png`

## Additional progress (damage text horizontal motion removed)
- Updated `game.js` floating damage text behavior to remove left-right motion:
  - set floating damage `vx` to `0` at spawn,
  - removed sinusoidal `swayX` offset in `drawFloatingDamageTexts`,
  - kept vertical rise/fade/scale behavior unchanged.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - `run_playwright_projectile.ps1`: PASS.
  - Custom develop-web-game Playwright sequence with starter auto-click:
    - artifacts: `output/web-game-damage-no-sway-seq/shot-16.png` and `output/web-game-damage-no-sway-seq/shot-17.png`.
    - text-state check confirms no horizontal drift on same floating text across frames (constant `x`, decreasing `y`):
      - `state-16 -> state-17 -> state-18`: `x = 648` while `y` rises `345 -> 306 -> 273`.

## Additional progress (2026-03-14, mobile pokemon sprite upscale)
- Fixed phone-size sprite readability in `game.js` by introducing viewport-aware sprite multipliers:
  - Team sprites now use `TEAM_SPRITE_SCALE_PHONE_MULTIPLIER` / `TEAM_SPRITE_SCALE_COMPACT_MULTIPLIER` via `getTeamSpriteScale(layout)`.
  - Enemy sprite render size now uses `ENEMY_SPRITE_SIZE_PHONE_MULTIPLIER` / `ENEMY_SPRITE_SIZE_COMPACT_MULTIPLIER` via `getEnemySpriteRenderSize(layout, baseSize)`.
- Applied the new scale logic to all relevant render paths:
  - team in-battle draw,
  - drag/swap ghost sprite,
  - enemy draw + enemy backdrop circle.
- Synced interaction hitboxes with larger visuals:
  - team hover hit radius now scales with rendered sprite scale,
  - enemy hover radius now uses rendered enemy sprite size.

### Validation (mobile sprite upscale)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Mobile viewport capture (390x844) with starter auto-select and tutorial close: PASS.
  - Screenshot: `output/mobile-sprite-fix-390x844-battle-clear.png`
  - State: `output/mobile-sprite-fix-390x844-battle-clear.state.json`
  - Meta: `output/mobile-sprite-fix-390x844-battle-clear.meta.json` (`chosen: true`).

### TODO / Next
- If needed, fine-tune phone multipliers separately for very short landscape screens (<420px height).
- Optionally add a small QA script under `scripts/testing/playwright/` for repeatable mobile viewport regressions.
## Additional progress (batch spotlight reveal sequence)
- Reworked x10 discovery animation to highlight each reward one-by-one:
  - Added `#gacha-batch-spotlight` overlay layer.
  - Each unlocked skin now appears centered in a large spotlight card (scale-in emphasis).
  - After highlight, the card animates toward its corresponding slot in the reveal grid.
  - Sequence repeats for all rewards before final result panel.
- Added cleanup hooks for spotlight layer on reset/close/error paths.
- Tuned reveal pacing to keep each reward visible longer before flying to the grid.

## Validation (spotlight sequence)
- `node --check game.js`: PASS.
- Playwright capture confirms spotlight step and final result:
  - Spotlight frame: `output/web-game-gacha10/shot-gacha10-animation.png`
  - Final result frame: `output/web-game-gacha10/shot-gacha10.png`
  - State check: `gacha_spinning=false`, `gacha_last_rewards.length=10`.

## Additional progress (pokeball polish + menu transition)
- Updated bottom Pokeball style to match requested shape:
  - Center button is now pure white and smaller.
  - Pokeball size increased and moved slightly higher above the bottom edge.
  - Halo kept.
- Added hover motion behavior on the bottom Pokeball:
  - Mouse enter: 360deg clockwise spin + existing scale lift.
  - Mouse leave: 360deg counter-clockwise spin.
  - Animation always resets to base rotation (0deg) after each spin.
- Fullscreen menu transition improved:
  - Smooth fade/translate/blur entrance and exit.
  - Staggered card reveal animation for menu buttons.
- Removed Pokeball from inside fullscreen menu.
  - Only the bottom Pokeball remains visible.
  - Bottom Pokeball is rendered above the fullscreen menu and remains clickable to toggle close/open.

## Validation (pokeball polish)
- `node --check game.js`: PASS.
- Playwright visual check:
  - `output/web-game-poke/shot-pokeball-menu-open-styled.png`
  - `output/web-game-poke/shot-pokeball-menu-open-styled-closeup.png`
  - `output/web-game-poke/shot-pokeball-menu-grid-styled.png`
  - Runtime probe: `visiblePokeballs=1` when fullscreen menu is open.
- Hover behavior probe:
  - After enter+leave sequence, Pokeball classes reset and computed transform returns to `none` (base rotation 0).

## Additional progress (2026-03-14, projectile visual cap unification)
- Unified projectile rendering to a single fixed profile, independent from global render quality tiers.
- Added `PROJECTILE_VISUAL_PROFILE` in `game.js` and wired projectile draw/update logic to this fixed profile.
- Chosen balanced profile for visuals/perf:
  - trail enabled, `trailMaxPoints: 4`, `trailStride: 2`
  - sprite detail enabled
  - glow/aura/streak disabled to keep GPU cost reasonable.
- Kept the global quality system for non-projectile effects; projectile visuals no longer degrade by quality tier.
- Validation:
  - `run_playwright_projectile.ps1`: PASS
  - `run_playwright_check.ps1`: PASS
  - No `errors-*.json` emitted in those runs.

## Additional progress (fullscreen menu button redesign)
- Redesigned fullscreen action-menu buttons with real inline SVG icons (map, pokedex, shop, skins machine, notifications, reset).
- Updated labels/microcopy for clarity:
  - `Map` -> `Carte`
  - `Shop` -> `Boutique`
  - `Machine Gacha` -> `Machine a Skins`
  - `Notifs Windows` -> `Notifications`
  - `Supprimer la save` -> `Reinitialiser la save`
- Added secondary subtitles on each card for clearer intent.
- Enhanced visual style:
  - per-action accent colors,
  - richer gradients and glow,
  - polished hover/focus states,
  - responsive alignment with icon + text stack.

## Validation (button redesign)
- Visual captures:
  - `output/web-game-poke/shot-menu-buttons-redesign-open.png`
  - `output/web-game-poke/shot-menu-buttons-redesign-grid.png`
- Syntax check:
  - `node --check game.js`: PASS.

## Additional progress (2026-03-14, Bulbizarre too small on phone follow-up)
- Added a mobile-focused minimum render floor for allied sprites in `game.js` to prevent very small source sprites (like Bulbizarre FRLG) from becoming hard to see.
- New constants:
  - `TEAM_SPRITE_MIN_RENDER_RATIO_PHONE = 0.96`
  - `TEAM_SPRITE_MIN_RENDER_RATIO_COMPACT = 0.9`
- Added helper `getTeamSpriteMinRenderSize(layout, slotSize)`.
- `drawPokemonSprite(...)` now supports `minRenderSizePx` and clamps final `renderSize` accordingly.
- Applied min render floor to:
  - team sprite draw path in battle,
  - drag/swap ghost sprite draw path.

### Validation (Bulbizarre visibility)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Mobile viewport capture after starter selection (390x844):
  - `output/mobile-sprite-fix-390x844-battle-clear-v3.png`
  - `output/mobile-sprite-fix-390x844-battle-clear-v3.state.json`
- Visual check: Bulbizarre is now significantly larger and readable on phone.
- Follow-up cleanup (projectile preset lock):
  - Removed remaining projectile visual keys from `RENDER_QUALITY_PRESETS` to avoid any perf-tier-based projectile selection confusion.
  - Renamed helper `getProjectileTrailMaxPointsForQuality` -> `getProjectileTrailMaxPoints`.
  - `run_playwright_check.ps1`: PASS.

## Additional progress (version + FPS bottom anchors)
- Updated canvas HUD anchoring so version and FPS are now strictly pinned to viewport bottom corners:
  - version: bottom-left (`drawVersionOverlay`),
  - FPS: bottom-right (`drawFpsOverlay`).
- Removed dock/safe-bound based vertical offset from `getBottomHudSafeEdge()` for these indicators to ensure true bottom anchoring.
- Fine-tuned corner margins for desktop/mobile.

## Validation (version/FPS anchors)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Visual capture: `output/web-game-poke/shot-version-fps-anchored.png`.

## Additional progress (2026-03-14, enemy sprite +15%)
- Increased enemy render size globally by +15% in `game.js`.
- Added constant: `ENEMY_SPRITE_RENDER_SIZE_GLOBAL_MULTIPLIER = 1.15`.
- Applied in `getEnemySpriteRenderSize(...)` so all enemy draw paths and enemy hover hit radius stay consistent.

### Validation (enemy +15%)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Mobile viewport capture (390x844):
  - `output/mobile-enemy-size-plus15-390x844.png`
  - `output/mobile-enemy-size-plus15-390x844.state.json`
- Visual check: enemy is noticeably larger on screen.

## Additional progress (pokeball size/height + hover clipping fix)
- Increased bottom Pokeball size again and raised its vertical position.
- Adjusted temporary dock height/padding to give extra headroom for hover transforms.
- Fixed hover clipping by enabling visible overflow around the Pokeball button/wrapper and preserving transformed bounds.
- Kept hover animation behavior intact.

## Validation (size + clipping)
- Visual hover captures:
  - `output/web-game-poke/shot-pokeball-bigger-higher-hover.png`
  - `output/web-game-poke/shot-pokeball-bigger-higher-hover-closeup.png`
- `run_playwright_check.ps1`: PASS.

## Additional progress (touch-friendly pokeball animation behavior)
- Removed Pokeball rotation triggers from hover in JS.
- Moved Pokeball rotation to menu toggle actions only:
  - opening menu => clockwise spin,
  - closing menu => counter-clockwise spin.
- Improved input behavior for phone/touch:
  - added `touch-action: manipulation` on Pokeball toggle,
  - restricted hover lift effect to fine-pointer hover devices,
  - added `:active` press feedback for tap interactions.
- Added a guard in `setActionDockFullscreenMenuOpen(...)` to avoid replaying animations on no-op state changes.
- Added optional `{ animate: false }` call path for internal/reset close operations.

## Validation (touch + animation trigger)
- Probe results:
  - `spinOnHover=false`
  - `spinOnOpen=true`
  - `spinOnClose=true`
  - `mobileMenuOpen=true`
  - `mobileMenuClosed=true`
- Mobile visual capture:
  - `output/web-game-poke/shot-pokeball-mobile-menu-open.png`
- Standard check:
  - `run_playwright_check.ps1`: PASS.
## Additional progress (2026-03-14, mobile long-press context menu fix)
- Fixed the Pokemon team context menu interaction on phone by adding an explicit touch long-press flow in `game.js`.
- Added touch hold constants:
  - `TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS = 460`
  - `TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX = 10`
- Added dedicated UI state fields for touch-hold tracking (timer, pointer id, slot, start/current client coordinates).
- Implemented helper workflow:
  - schedule long-press on touch `pointerdown` over a team slot,
  - cancel on movement drift / slot change / pointer end / cancel / blur,
  - trigger context menu open on hold timeout with optional vibration feedback (`navigator.vibrate(12)`),
  - suppress subsequent tap/click to avoid accidental `Boites` opening after hold.
- Integrated cancellation guards into drag lifecycle so touch drag/swap remains stable and does not race with long-press.

### Validation (mobile long-press)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Targeted mobile touch scenario (390x844, touch pointer emulation): PASS.
  - Artifact screenshot: `output/mobile-longpress-check/mobile-longpress-context-menu.png`
  - Artifact state: `output/mobile-longpress-check/mobile-longpress-state.json`
  - Observed: `team_context_menu_open = true` during hold and still `true` after pointer up (no unwanted fallback click).

## Additional progress (damage text spawn moved above target)
- Updated floating damage text spawn in `game.js` so numbers appear above the target instead of on top of the sprite.
- Implementation:
  - Added `targetVisualSize` in `addFloatingDamageText(...)`.
  - Added `extraSpawnLiftY = max(24, targetVisualSize * 0.52)`.
  - Spawn position now uses `y = targetY - toneStyle.spawnLiftY - extraSpawnLiftY`.
  - Call sites now pass enemy visual size from layout (`enemySize`) for both hit and miss damage texts.
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Combat-targeted custom Playwright run is currently blocked by an unrelated pre-existing runtime error in this branch (`drawPokemonTerrainShadow is not defined`) when entering battle render path.

## Additional progress (2026-03-14, refonte ombres team + enemy)
- Reworked Pokemon ground shadows in `game.js` for cleaner battlefield rendering.
- Added new helper: `drawPokemonTerrainShadow(renderSize, options)` with:
  - multi-layer shadow (ambient + core + contact),
  - profile support (`team`, `enemy`, `drag`),
  - lift-aware squash/fade,
  - ground anchoring support (`groundOffsetY`) so breathing/lift does not make shadows float unnaturally.
- Updated `drawPokemonSprite(...)`:
  - replaced old single ellipse shadow with the new helper,
  - added shadow options passthrough (`shadowProfile`, `shadowAlpha`, `shadowGroundOffsetY`, `shadowLiftPx`).
- Applied to team first, then enemy:
  - team sprites now use `shadowProfile: "team"`,
  - enemy sprite now uses `shadowProfile: "enemy"`,
  - drag ghost uses `shadowProfile: "drag"` with lighter alpha and slight lift.

### Validation (shadows)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- `run_playwright_projectile.ps1`: PASS.
- Dedicated develop-web-game canvas capture with starter auto-click:
  - screenshot: `output/web-game-shadow-check/shot-0.png`
  - text state: `output/web-game-shadow-check/state-0.json`
- Visual confirmation: team and enemy both show improved, cleaner ground shadows.

## Additional progress (Pokemon combat animation tween migration)
- Audited Pokemon-related animation paths in `game.js`:
  - Kept continuous procedural animations as-is (breathing/hover/ambient sin waves) because they are perpetual signals, not finite transitions.
  - Migrated finite combat transitions from manual elapsed timers to `Tween.js`-driven states.
- Tween migration implemented inside `PokemonBattleManager`:
  - Enemy hit pulse now tween-driven (`triggerEnemyHitPulse`) instead of manual `enemyHitPulseMs` decrements.
  - Enemy damage flash now tween-driven (`triggerEnemyDamageFlash`) instead of manual `enemyDamageFlashMs` decrements.
  - Slot recoil now tween-driven progress state (`triggerSlotRecoil`) with same visual curve formula.
  - Slot attack flash now tween-driven blend decay (`triggerSlotAttackFlash`).
  - Skip-turn tremor effect now tween-driven progress (`triggerSlotSkipTurnEffect`) with same envelope/jitter equations.
  - Teleport swap scale squash now tween-driven progress (`triggerSlotTeleportScale`) with same down/up shape.
- Added cleanup helpers to avoid stale visual tweens on transitions (`resetCombatVisualTweens`, slot-level stop methods).
- Validation:
  - `node --check game.js`: PASS.
  - `run_playwright_check.ps1`: PASS.
  - Custom Playwright battle pass with starter click + Route 1 switch + combat wait: PASS.
    - Artifacts: `output/web-game-tween-audit/shot-0.png`, `output/web-game-tween-audit/state-0.json`.
    - Observed: active Route 1 combat, damage events rendered, no generated Playwright error log.
- Note:
  - Long KO script wrappers exceeded local command timeout in this session; a shorter custom combat validation was used to verify tween migration behavior.

## Additional progress (2026-03-14, gacha x10 reveal polish + fullscreen spotlight)
- Fixed a runtime regression in `game.js` by restoring `drawPokemonTerrainShadow(...)`.
  - This removes `ReferenceError: drawPokemonTerrainShadow is not defined` during renders.
- Refined batch gacha reveal sequence for smoother skin-to-grid flow:
  - spotlight card now exits with a dedicated fade/scale transition (`is-exiting`) while transfer continues;
  - transfer no longer hard-cuts the spotlight before movement starts.
- Increased reveal emphasis and juice:
  - fullscreen spotlight layer for each unlocked skin;
  - larger spotlight card typography + media;
  - sprite pop-in animation on spotlight entry;
  - stronger transfer orb treatment;
  - slot impact wave + spark burst when each skin lands in its grid slot.
- Kept result focus behavior: the top machine section remains replaced by the enlarged `Resultat x10` panel showing all 10 skins.

## Validation (gacha x10 reveal polish)
- `node --check game.js`: PASS.
- Custom Playwright run (seeded save) with forced x10 flow: PASS.
  - `output/web-game-gacha10/shot-gacha10-animation.png` (fullscreen spotlight reveal frame)
  - `output/web-game-gacha10/shot-gacha10.png` (final enlarged x10 result)
  - `output/web-game-gacha10/state-gacha10.json` confirms:
    - `gacha_spinning = false`
    - `gacha_last_rewards.length = 10`
  - `output/web-game-gacha10/errors-gacha10.json`: not generated (no captured page/console errors).

## Additional progress (2026-03-14, fixed sprite PPU consistency after mass crop)
- Addressed sprite size inconsistency introduced by mass sprite cropping:
  - Added `POKEMON_SPRITE_USE_SOURCE_PPU_ADAPTATION = false` in `game.js`.
  - Locked sprite render sizing to a fixed PPU multiplier (`1`) by bypassing source-dimension-based adaptation in `getPokemonSpriteCommonPpuMultiplier(...)`.
- Result:
  - Sprite on-screen sizing is now stable and coherent regardless of source image dimensions/padding changes from crop operations.

## Validation (sprite PPU consistency)
- `node --check game.js`: PASS.
- Playwright check pass (`scripts/testing/playwright/check.ps1`): PASS.
- Combat-state Playwright run with starter + route flow: PASS.
  - Artifacts:
    - `output/web-game-sprite-ppu/shot-0.png`
    - `output/web-game-sprite-ppu/state-0.json`
  - No `errors.json` generated (no captured page/console errors).

## Additional progress (2026-03-14, gacha skin reception sprite fill without stretch)
- Improved skin reception UI sprite sizing so visuals occupy maximum space without distortion.
- Added auto tight-fit logic in `game.js` for gacha image elements:
  - New helper: `applyGachaSpriteTightFit(imageEl, options)`.
  - Computes opaque sprite bounds and applies a capped uniform scale (`--gacha-tight-fit-scale`) so transparent padding no longer wastes card space.
  - Wired for:
    - spotlight card media (`createGachaBatchSpotlightCard`)
    - transfer orb (`createGachaBatchTransferOrb`)
    - reveal/result cards (`buildGachaRewardCardElement`)
    - single-result preview (`renderGachaResultPanel`)
- Updated gacha CSS to preserve aspect ratio while filling containers:
  - switched gacha reception image blocks to `width: 100%`, `height: 100%`, `object-fit: contain`
  - added `transform: scale(var(--gacha-tight-fit-scale, 1))`
  - ensured clipping containers use `overflow: hidden`
  - updated spotlight pop keyframes to multiply by tight-fit scale (no stretch, animation kept)
  - aligned responsive overrides with the same fill strategy.

## Validation (gacha reception sprite fill)
- `node --check game.js`: PASS.
- Re-ran seeded gacha x10 capture flow (`tmp/run_gacha10_playwright.ps1`): PASS.
  - Artifacts:
    - `output/web-game-gacha10/shot-gacha10-animation.png`
    - `output/web-game-gacha10/shot-gacha10.png`
    - `output/web-game-gacha10/state-gacha10.json`
  - `errors-gacha10.json`: not generated (no captured page/console errors).

## Additional progress (2026-03-15, first free ball scope)
- Restricted the first free purchase bonus to `poke_ball` only in `game.js`.
  - Added `isFirstFreePokeballPurchaseEligible(itemOrPrice)` and scoped eligibility to `ballType === "poke_ball"`.
  - Updated `getShopBallPurchasePricing(...)` so `freeQuantity` applies only when the selected item is `poke_ball`.
  - Updated `getMaxAffordableShopBallQuantity(...)` so bonus quantity only affects `poke_ball`.
- Expected behavior now:
  - First `PokeBall` purchase can be free (as before).
  - `SuperBall` and `HyperBall` never get the first-free discount.

## Validation (first free ball scope)
- `node --check game.js`: PASS.

- 2026-03-15: Ajustement layout combat demandé utilisateur: ennemi abaissé et team placée en arc unique au-dessus (slots 0->5 conservés dans l'ordre). Validation visuelle via Playwright seedé (team 6) : output/web-game-layout-team6/shot-0.png, état: output/web-game-layout-team6/state-0.json (enemy.y=375, team.x croissant par slot 0..5).
- Fixed Pokédex scroll behavior regression in `game.js` by removing the custom `wheel` interception and restoring native browser scrolling on `#pokedex-grid`.
- Validation:
  - Browser interaction check (Playwright, Chromium) confirms `#pokedex-grid.scrollTop` moves correctly down/up and clamps at boundaries.
  - Screenshot captured: `output/pokedex-scroll-check/pokedex-scroll-after-fix.png`.
  - Node tests pass (`npm run test:node`, 20/20).
- Note: browser check surfaced an existing console error unrelated to this fix: `TURN_ACTION_SKIP is not defined`.

## Additional progress (enemy ownership icons in enemy UI)
- Added ownership/status badges on enemy name card in `drawNameAndLevel` (`game.js`):
  - Pokeball icon:
    - colored + opaque when the exact species is owned.
    - grayed + semi-transparent when only an evolution-family member is owned.
  - Shiny icon (✦): shown when exact species or family has shiny capture(s), with exact vs family visual intensity.
  - Ultra shiny icon (✶): shown when exact species or family has ultra shiny capture(s), with exact vs family visual intensity.
- Implemented helper functions:
  - `getEnemyOwnershipBadgeState(pokemonId)`
  - `buildEnemyOwnershipBadgeList(pokemonId)`
  - `drawEnemyOwnershipBadge(centerX, centerY, size, badge)`
- Adjusted enemy name-card layout to reserve space for badges while keeping name/level fitting.

## Validation runs (enemy ownership icon change)
- `node --check game.js`: PASS.
- `run_playwright_check.ps1`: PASS.
- Seeded combat Playwright run for visual verification: `output/web-game-enemy-ownership/`.
  - Confirmed enemy cards render new badges in combat screenshots (`shot-0.png`, `shot-2.png`).
- During seeded run, found runtime crash from existing combat path (`TURN_ACTION_SKIP is not defined`) in this branch state.
  - Added a defensive fallback in `resolveTurnDecisionForSlot` (`safeSkipAction`) to keep combat test flow stable.

- 2026-03-15: Ajustement demandé: team à équidistance de l'ennemi. computeLayout utilise désormais un arc radial centré sur l'ennemi (angles + rayon constant) pour les slots. Validation seedée team 6: output/web-game-layout-team6-full/state-0.json (distances quasi identiques après arrondi JSON).

## 2026-03-15 - Capacitor Android notifications
- Installed @capacitor/local-notifications and synced Android native project.
- Extended notification pipeline in game.js to support Android Capacitor LocalNotifications while keeping Desktop/Electron behavior.
- Windows notification toggle now handles Android permission flow and sends equivalent local notifications for shiny encounter/capture and empty pokeball stock alerts.
- Verified 
pm run mobile:apk:debug succeeds with the plugin integrated.

## Additional progress (ultra shiny fallback on skins without shiny alt)
- Added variant-aware shiny path resolution helpers in `game.js`:
  - `canFallbackToDefaultShinyForVariant(def, variant)`
  - `getVariantShinySpritePath(def, variant)`
- Updated appearance resolution so a non-default skin without shiny alternative no longer falls back to the species default shiny sprite.
  - In ultra shiny mode, the selected non-shiny skin now remains visible while ultra shiny shader effects still apply.
- Reused the same helper in:
  - appearance asset preload (`ensureVariantAppearanceAssetsLoaded`),
  - notification sprite path fallback,
  - enemy appearance fallback sync,
  - appearance modal status (`selectedHasShiny`) so messaging reflects the selected skin capabilities.
- Validation:
  - `node --check game.js`: PASS.

## Correction encodage UI (2026-03-15)
- Correction des chaînes mojibake restantes dans `game.js` (ex: `PokÃƒÂ©mon`, `capturÃƒÂ©`, `Ã¢â€ â€™`, `Ã¢Å“Â¦`) vers des caractères UTF-8 corrects.
- Zones corrigées: popup nouveaux Pokémon, notifications shiny/capture/évolution, libellés Pokédex (titre/sous-titre/stats/état vide), badges shiny/ultra shiny, message de préchargement.
- Vérification effectuée:
  - `rg -n '(Ã|Â|â€|ï¿½)' game.js` -> aucune occurrence restante.
  - `node --check game.js` -> syntaxe valide.
- Playwright non exécuté: changements purement textuels et localisés, sans modification de logique/UI structurelle complexe.

- 2026-03-15: Rework layout lisibilite PC+mobile testee manuellement. Arc radial conserve (equi-distance), ennemi -25% garde. Ajustements: angles/rayon de l'arc, offset HUD radial, cartes equipe plus compactes sur telephone (largeur/hauteur + fonts). Captures de validation: output/web-game-layout-pc-long/shot-0.png et output/web-game-layout-mobile/shot-0.png.
