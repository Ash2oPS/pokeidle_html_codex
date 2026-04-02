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

- zones
- quests
- dialogues
- talents
- progression
- Pokemon gameplay overrides

## Runtime Packaging

- keep authoring files small and tooling-friendly
- bundle runtime data into fewer files for production
- treat authoring format and shipped format as separate concerns

