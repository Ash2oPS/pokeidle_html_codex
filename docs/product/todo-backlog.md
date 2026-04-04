<!-- doc-meta: {"status":"reference","scope":["project-tracking","todo-backlog"],"readFirst":["backlog-work","roadmap-updates"]} -->
# TODO Backlog

Open work lives here. Completed milestones belong in [../../progress.md](../../progress.md).

Last reviewed: 2026-04-04

## Short Term

- `gameplay / dex`: Replace the current Dex placeholder with a real Pokedex surface tied to unlocked species and progression.
- `gameplay / progression`: Implement capture-driven species unlock flow so progression no longer stops at the starter bundle.
- `gameplay / progression`: Implement evolution runtime with same-slot replacement and one-time evolution unlock behavior.
- `gameplay / trainer`: Add trainer-battle maluses beyond the current team-size limit and surface them clearly before battle start.
- `localization / ui`: Clean remaining player-facing UTF-8 or mojibake debt in touched UI copy and keep bilingual text validation-ready.

## Medium Term

- `combat / talents`: Ship the first real talent tranche on stable documented hooks with tests.
- `combat / typing`: Surface offensive typing defaults and any switching rules as explicit gameplay and UI behavior instead of deferred design debt.
- `ui / dex`: Expand the Dex beyond the first unlock view with fuller species, mastery, or capture-progress presentation.
- `tooling / studio`: Extend validated save coverage when future editable modules such as quests or battles are added to the studio.
- `tooling / ux`: Add safer relationship editing, search, and preview support across the studio modules.
- `ui / mobile`: Revisit the dense mobile combat HUD after the next progression surfaces land.

## Long Term

- `content / slice+`: Expand the playable content beyond the first two towns, two combat routes, and first gym after the slice stabilizes.
- `balance / progression`: Run broad balance and pacing passes once the core progression loop stops shifting.
- `zones / pacifist`: Add future non-combat services or NPC systems through the existing pacifist-zone framework.
- `platform / save`: Revisit any cloud-save or backend work only after an explicit architecture decision changes the current local-only baseline.

## Watchlist

- `debug / cleanup`: Audit and retire remaining debug-only slice actions and placeholder copy when equivalent real flows exist.
- `docs / tracking`: Keep this backlog as the open-work source of truth and keep [../../progress.md](../../progress.md) focused on completed work.
- `quality / localization`: Treat broken accents, missing translations, or other bilingual text regressions as recurring debt, not as harmless copy noise.

## Parking Lot

- `combat / presentation`: Consider miss, crit, hit-variant, and multi-target presentation work after the core progression and talent tranches are in place.
- `tooling / deployment`: Re-evaluate remote studio deployment only if the tool stops being local-only.
