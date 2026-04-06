<!-- doc-meta: {"status":"normative","scope":["content-pipeline","data-ownership"],"readFirst":["content-changes","generator-work","tooling-work"]} -->
# Content Pipeline

- `content/source` stores raw imported payloads and immutable structured source snapshots, `content/generated` stores normalized canonical outputs, `content/authored` stores project-authored gameplay data and overrides, and runtime bundles store shipped production groupings. [RULE:ARCH-CONTENT-001]
- Canonical generated data follows the documented canon baseline, changes through regeneration or explicitly documented pipeline work, and keeps Pokemon visual fields on Platinum-facing sprite sources rather than official artwork. [RULE:ARCH-CONTENT-002]
- Generated canon and authored content must validate against shared schemas, provenance requirements, and cross-document references before exposure to apps. [RULE:ARCH-CONTENT-003]
- Consumers use the typed content registry instead of ad hoc direct JSON imports. [RULE:ARCH-CONTENT-004]
- New content domains require schema coverage, registry validation, docs, and explicit ownership declarations before they join the workflow. [RULE:ARCH-CONTENT-005]

## Canonical Baseline

See [canon-data-model.md](./canon-data-model.md) for the authoritative Pokemon and Sinnoh canon rules.

The current generated canonical domains are Pokemon species, Pokemon forms, Sinnoh locations and location areas, Sinnoh encounter tables, and Sinnoh gyms.

`content/source` currently includes both PokeAPI cache payloads and structured Bulbapedia-derived snapshots that exist only to support import and review.

## Current Authoring Domains

The runtime registry currently exposes world map, zones, dialogues, quests, battles, generated Pokemon canon data, generated Sinnoh canon data, and progression tuning.

Runtime-authored zones and battles bridge toward canon through `canonicalLocationId` and `canonicalGymId` while the current gameplay runtime still uses authored `world-map`, `zones`, and `battles` as the active play surface.
