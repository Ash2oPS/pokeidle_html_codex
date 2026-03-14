# Project Architecture

## Runtime
- `index.html`, `styles.css`, `game.js`: web game runtime entrypoints.
- `lib/`: reusable runtime modules (audio, save consistency, parsing, passives, updates).
- `electron/`: desktop shell (`main.mjs`, `preload.mjs`).

## Data
- `pokemon_data/`, `map_data/`, `item_data/`: source datasets used by the game.
- `assets/`: sprites, maps, item icons, type icons, and visual resources.

## Scripts
- `scripts/map/`: map and zone generation/export tools.
- `scripts/data/pokemon/`: Pokemon data enrichment/downloading tools.
- `scripts/testing/playwright/`: Playwright scenario runners and shared invocation helper.
- `scripts/`: additional utility scripts (build vendors, workbook tools, custom skin tool server, etc.).

## Compatibility Layer
- Root-level legacy script names (`scripts_generate_*`, `scripts_download_*`, `run_playwright_*.ps1`, `download_pokemon_data.py`) are retained as wrappers.
- Existing workflows and local habits remain functional while implementation is now grouped by domain.

## Tests
- Node test suite: `npm run test:node`
- Vitest suite: `npm run test:vitest`
- Full suite: `npm test`
