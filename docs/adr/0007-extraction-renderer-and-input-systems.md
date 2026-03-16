# ADR 0007: Extraction Of Runtime Renderer And Input Systems

## Contexte
- Le pipeline render/layout canvas et le wiring input/UI (`addEventListener`) étaient encore concentrés dans `game-runtime.js`.
- Ces zones représentaient une forte dette de couplage et un risque de fuite listeners.
- Objectif: extraire des frontières testables tout en gardant les hooks runtime et l'UX inchangés.

## Decision
- Introduire `systems/ui/runtime-render-system.js` pour encapsuler `computeLayout`, `refreshLayoutIfNeeded` et `render`.
- Introduire `systems/ui/runtime-input-system.js` avec API `init()`/`dispose()` et registre centralisé des listeners.
- Extraire le bloc UI interaction/modal/pokedex/asset route dans `systems/ui/runtime-ui-interaction-system.js` via façade non-break.

## Consequences
- `game-runtime.js` devient un orchestrateur plus mince: appels vers systèmes au lieu d'implémentations inline.
- Le nombre d'appels `addEventListener(` dans `game-runtime.js` chute fortement (92 -> 9).
- Le cycle de vie listeners est explicitement géré (`dispose` sur lifecycle persist), réduisant le risque de fuite.
- Les tests node + perf restent verts, donc pas de régression observée sur le comportement/perf.

## Rollback
- Suppression des imports systèmes UI + réintégration des fonctions/listeners inline dans `game-runtime.js`.
- Aucune migration save requise (schéma inchangé), rollback purement structurel.
