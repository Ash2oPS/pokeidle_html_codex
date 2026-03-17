# Johto Visual Assets Strategy (Placeholder Pack)

This document describes the temporary Johto visual pack added for safe integration without runtime logic changes.

## Goals

- Avoid missing image paths when Johto zones are wired.
- Keep naming consistent with existing project conventions.
- Provide a clean replacement path for final art later.

## Added Assets

- `assets/backgrounds/johto_*_hgss.png`: generated placeholder backgrounds for:
  - Routes 29-48 (including both `johto_route_40/41` and `johto_sea_route_40/41` aliases).
  - Core Johto towns (`new_bark_town`, `cherrygrove_city`, `violet_city`, `azalea_town`, `goldenrod_city`, `ecruteak_city`, `olivine_city`, `cianwood_city`, `mahogany_town`, `blackthorn_city`).
  - Main Johto dungeon/special areas (`sprout_tower`, `ruins_of_alph`, `union_cave`, `slowpoke_well`, `ilex_forest`, `national_park`, `burned_tower`, `bell_tower`, `whirl_islands`, `mt_mortar`, `ice_path`, `dragons_den`, `dark_cave`, `tohjo_falls`).
- `assets/backgrounds/johto_placeholder_manifest.json`: list of generated placeholder files + metadata.
- `assets/backgrounds/johto_background_bindings_placeholder.csv`: direct `route_id -> background_image` mapping helper.
- `assets/maps/johto_map_placeholder.png`: temporary Johto world map placeholder image.
- `assets/maps/johto_map_markers_placeholder.json`: placeholder map marker coordinates for routes 29-48.

## Binding Convention

Use this naming pattern while integrating data files:

- `route_id`: `johto_route_29`
- `background_image`: `assets/backgrounds/johto_route_29_hgss.png`

For sea routes, either naming is supported by files present:

- `johto_route_40` -> `assets/backgrounds/johto_route_40_hgss.png`
- `johto_sea_route_40` -> `assets/backgrounds/johto_sea_route_40_hgss.png`

## Replacement Plan (Final Art)

1. Keep route IDs and filenames stable.
2. Replace each placeholder PNG in place with final artwork.
3. Keep dimensions flexible (renderer already handles varying background sizes in Kanto assets).
4. Remove/refresh this doc and manifest once full Johto art is delivered.

