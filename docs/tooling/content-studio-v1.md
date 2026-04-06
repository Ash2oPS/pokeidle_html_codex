<!-- doc-meta: {"status":"reference","scope":["content-studio","current-foundation"],"readFirst":["tooling-context"]} -->
# Content Studio V1

## Product Shape

- One internal web tool with multiple domain modules.
- Shared contracts, schemas, registry loading, and visual tokens with the game.

## Current Foundation

- Zone editor loads zone data and supports validated save for names, canonical location bridges, timers, defeats, levels, and enemy pools back to `content/authored/zones/*.json`.
- Battle editor loads authored battle overrides and supports validated save for bilingual names, time limits, team size limits, unlock flags, canonical gym bridges, and enemy teams back to `content/authored/battles/*.json`.
- Pokemon viewer reads generated species and form data, previews derived runtime stats, and exposes read-only provenance, review status, and linked form metadata.
- Dialogue editor supports validated save for bilingual dialogue titles and lines back to `content/authored/dialogues/*.json`.

## Direction

Future studio work should add safer relationship editing, search, preview support, and save coverage for future editable domains such as quests or canonical review workflows without bypassing shared schemas or content ownership rules.
