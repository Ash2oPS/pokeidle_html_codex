# Content Pipeline

## Data Layers

- `content/source`: imported canonical source data such as PokeAPI payloads
- `content/generated`: normalized generated data derived from source imports
- `content/authored`: hand-authored game data and project overrides
- runtime build bundles: grouped artifacts shipped to the game

## Pokemon Data Policy

- canonical Pokemon data comes from scripts hitting PokeAPI
- imported canonical data is not edited by hand
- project-specific interpretation lives in override files

## Authoring Domains

- world map
- zones
- quests
- dialogues
- battles
- talents
- progression
- Pokemon gameplay overrides

## Content Registry

- authored JSON documents are loaded through a shared `content-data` package
- every authored domain is validated against shared Zod schemas before exposure to apps
- a typed registry is exposed to consumers instead of many ad hoc imports
- cross-document references fail fast with readable errors

## Cross-Document Validation

- every world-map node and link must point to an existing zone
- zone activities must reference existing dialogues, quests, and battles
- quest objectives must reference existing zones and battles
- dialogue lines must reference existing participants

## Runtime Packaging

- keep authoring files small and tooling-friendly
- bundle runtime data into fewer files for production
- treat authoring format and shipped format as separate concerns
