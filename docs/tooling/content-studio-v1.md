<!-- doc-meta: {"status":"reference","scope":["content-studio","current-foundation"],"readFirst":["tooling-context"]} -->
# Content Studio V1

## Product Shape

- One internal web tool with multiple domain modules.
- Shared contracts, schemas, registry loading, and visual tokens with the game.

## Current Foundation

- Zone editor loads zone data and supports validated save for names, timers, defeats, levels, and enemy pools back to `content/authored/zones/*.json`.
- Pokemon viewer reads generated species data and previews derived runtime stats.
- Dialogue editor supports validated save for bilingual dialogue titles and lines back to `content/authored/dialogues/*.json`.

## Direction

Future studio work should add safer relationship editing, search, preview support, and save coverage for future editable domains without bypassing shared schemas or content ownership rules.
