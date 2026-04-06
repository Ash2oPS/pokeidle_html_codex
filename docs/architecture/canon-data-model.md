<!-- doc-meta: {"status":"normative","scope":["canon-data","canonical-imports"],"readFirst":["content-changes","generator-work","canon-review"]} -->
# Canon Data Model

- Canon Pokemon and Sinnoh data uses `Pokemon Platinum` as the only gameplay baseline for this phase, uses `PokeAPI` as the primary technical source for Pokemon data, uses structured `Bulbapedia` snapshots only as verification or complement for world, encounters, and gyms, and never injects external prose into runtime data. [RULE:ARCH-CANON-001]
- The canonical generated model is split into stable species records, linked form records, Sinnoh locations with nested location areas, exact encounter tables, and gym definitions so imports, validation, and runtime consumers can reason about each domain explicitly. [RULE:ARCH-CANON-002]
- Every canonical generated record must carry per-record provenance with source identity, source version, source record id, and review status; reviewed or disputed records additionally require reviewer metadata, and disputed records require an explicit note. [RULE:ARCH-CANON-003]
- Canonical generated encounters represent exact `Platinum` wild data for the main Sinnoh region in the primary pre-postgame state, while canonical gym data may also include rematch or postgame team variants as separate canonical teams. [RULE:ARCH-CANON-004]
- Gameplay adaptation never mutates canonical generated facts in place; project-specific pacing, simplification, balance, or team overrides live in authored records that reference canonical ids such as `canonicalLocationId` and `canonicalGymId`. [RULE:ARCH-CANON-005]
- Canon imports must come from immutable source payloads or structured source snapshots in `content/source`, and shared validation must reject broken UTF-8, mojibake, missing localized names, missing provenance, or broken cross-references before registry exposure. [RULE:ARCH-CANON-006]

## Current Phase

The current phase adds the canonical foundation and import pipeline without replacing the runtime world-map, zone, or battle systems yet.

Runtime-authored zones and battles bridge toward canon through `canonicalLocationId` and `canonicalGymId`.

The generated canonical domains currently live in `content/generated/pokemon/species.v1.json`, `content/generated/pokemon/forms.v1.json`, `content/generated/sinnoh/locations.v1.json`, `content/generated/sinnoh/encounters.v1.json`, and `content/generated/sinnoh/gyms.v1.json`.

Structured source complements that are not served to runtime live in `content/source`, including immutable PokeAPI cache payloads and Bulbapedia-derived snapshots.
