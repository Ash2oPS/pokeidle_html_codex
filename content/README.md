# Content Layout

- `source/`: raw imported source data such as cached PokeAPI payloads
- `generated/`: normalized generated data derived from source imports
- `authored/`: hand-authored game content and project overrides

The repository keeps source, generated, and authored content separate.
Production builds are expected to bundle runtime data into fewer output files.
