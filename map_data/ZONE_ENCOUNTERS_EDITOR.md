# Zone Encounters Editor

Le jeu continue de lire `map_data/kanto_zone_encounters.csv`.

Pour une edition plus confortable (formules + listes deroulantes), utilise le workbook Excel:
`map_data/kanto_zone_encounters_editor.xlsx`.

## Commandes

1. Construire le workbook editeur depuis le CSV runtime actuel:

```bash
npm run zone:editor:build
```

2. Apres edition du workbook, re-exporter le CSV runtime:

```bash
npm run zone:editor:export
```

3. Optionnel: regenerer le CSV depuis les JSON de zones:

```bash
npm run zone:csv:export
```

## UX incluse dans le workbook

- `pokemon_id` -> noms FR/EN automatiques.
- Listes deroulantes:
  - `zone_type`
  - `combat_enabled`
  - `method_1`, `method_2`, `method_3`
- `methods` reconstruit automatiquement depuis `method_1..3` pour les lignes standards.
- Feuilles de reference cachees:
  - `PokemonRef` (id -> noms)
  - `Lists` (valeurs autorisees)
