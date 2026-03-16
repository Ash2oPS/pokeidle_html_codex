# ADR 0006: Extraction Of PokemonBattleManager

## Contexte
- `game-runtime.js` contenait un bloc combat OO massif (classe `PokemonBattleManager`) mélangé avec l'orchestration globale.
- Le composant combat a un cycle de vie interne complexe (timers, projectiles, transitions KO/capture, feedback visuel) et reste un bon candidat OO.
- Objectif: réduire le couplage du monolithe sans changer gameplay ni API consommée par le runtime/battle lifecycle.

## Decision
- Extraire `PokemonBattleManager` dans `systems/combat/pokemon-battle-manager.js`.
- Conserver l'API publique existante via façade non-break dans `game-runtime.js` (constructeur + méthodes attendues inchangées).
- Injecter les dépendances runtime au lieu de créer de nouveaux accès globaux concurrents.

## Consequences
- Le runtime garde la compatibilité comportementale tout en réduisant la taille/couplage du monolithe.
- Les tests combat existants continuent de couvrir le comportement attendu côté système.
- Le composant OO combat devient isolé et plus facile à faire évoluer en phase ultérieure.

## Rollback
- Revenir à l'implémentation inline est possible en réintégrant la classe et en supprimant l'import/module extrait.
- Aucun changement de schéma de sauvegarde n'étant introduit, rollback sans migration de données.
