<!-- doc-meta: {"status":"reference","scope":["content-studio","current-foundation"],"readFirst":["tooling-context"]} -->
# Content Studio V1

## Product Shape

- One internal web tool with multiple domain modules.
- Shared contracts, schemas, registry loading, and visual tokens with the game.

## Current Foundation

- Zone editor loads zone data and supports in-memory draft editing for names, timers, defeats, levels, and enemy pools.
- Pokemon viewer reads generated species data and previews derived runtime stats.
- Dialogue editor supports in-memory draft editing for bilingual dialogue content.
- A persistent save flow for studio-authored changes is not implemented yet, so canonical content edits still require reviewed file changes.

## Direction

Future studio work should add validated save flow, safer relationship editing, search, and preview support without bypassing shared schemas or content ownership rules.