# Zone Studio

Le studio web `npm run tool:data-studio` expose maintenant deux outils:

- `Zone Studio` via `/route`
  - rencontres Kanto, Johto et Hoenn
  - navigation en graphe via `connected_route_ids`
  - locks via `access_rules`
  - dialogues obligatoires d'arrivee via `arrival_dialogue_ids_once`
  - interactions PNJ via `zone_actions` avec preview desktop/mobile
- `Dialogue Studio` via `/dialogues`
  - edition des dialogues a embranchements
  - conditions de flags
  - effets `set_flag_true` / `set_flag_false`
  - preview jouable
  - validation des references cassees et des dialogues references par des zones

Le workbook Excel ci-dessous reste dedie au CSV runtime de Kanto, que le jeu continue de lire via
`map_data/kanto_zone_encounters.csv`.

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

## UX incluse dans le workbook Excel

- `pokemon_id` -> noms FR/EN automatiques.
- Listes deroulantes:
  - `zone_type`
  - `combat_enabled`
  - `method_1`, `method_2`, `method_3`
- `methods` reconstruit automatiquement depuis `method_1..3` pour les lignes standards.
- Feuilles de reference cachees:
  - `PokemonRef` (id -> noms)
  - `Lists` (valeurs autorisees)
