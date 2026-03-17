# Johto Visual Assets Status

This document describes the current Johto visual asset state used by the runtime.

## Current State

- `assets/backgrounds/johto_*_hgss.png` now use real HeartGold/SoulSilver map images downloaded from Bulbagarden Archives.
- The Johto backgrounds keep the same baked blur profile as the Kanto refresh pipeline.
- Routes 29-48, Johto cities, and Johto dungeons all resolve to Johto-specific background assets.

## Runtime Binding Files

- `assets/backgrounds/johto_background_bindings_placeholder.csv`: direct `route_id -> background_image` mapping helper used by the generator.
- `assets/backgrounds/johto_placeholder_manifest.json`: compatibility manifest now documenting that zone backgrounds are no longer placeholders.
- `assets/maps/johto_map_markers_placeholder.json`: current marker helper used by the zone generator.

## Remaining Temporary Piece

- `assets/maps/johto_map_placeholder.png` is still a temporary Johto region map image.

## Naming Convention

Zone backgrounds keep stable filenames so data JSON can be regenerated safely in place:

- `route_id`: `johto_route_29`
- `background_image`: `assets/backgrounds/johto_route_29_hgss.png`
- `route_id`: `johto_city_new_bark_town`
- `background_image`: `assets/backgrounds/johto_city_new_bark_town_hgss.png`
- `route_id`: `johto_dungeon_union_cave`
- `background_image`: `assets/backgrounds/johto_dungeon_union_cave_hgss.png`

Sea route aliases remain supported:

- `johto_route_40` -> `assets/backgrounds/johto_route_40_hgss.png`
- `johto_sea_route_40` -> `assets/backgrounds/johto_sea_route_40_hgss.png`
- `johto_route_41` -> `assets/backgrounds/johto_route_41_hgss.png`
- `johto_sea_route_41` -> `assets/backgrounds/johto_sea_route_41_hgss.png`
