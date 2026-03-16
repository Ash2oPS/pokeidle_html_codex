# ADR 0008: Domain Introduction And Final Runtime Slimming

## Contexte
- Le projet avait déjà `core/`, `systems/`, `infra/`, mais pas de `domain/` explicite.
- Les règles pures (formules reward/xp/money, shiny rolls, timers route) restaient dispersées dans les systèmes.
- La cible finale demandait un amincissement fort de `game-runtime.js` sans casser save/gameplay/hooks.

## Decision
- Introduire `domain/` pour héberger les règles pures:
  - `domain/progression/reward-rules.js`
  - `domain/combat/balance-rules.js`
  - `domain/encounter/shiny-rules.js`
  - `domain/routes/route-timer-rules.js`
- Adapter `systems/progression` et `systems/encounter` pour consommer ces règles.
- Finaliser le slimming runtime avec extraction supplémentaire UI interaction tout en conservant les façades de compat.

## Consequences
- Séparation claire entre orchestration (systems) et règles métier pures (domain).
- `game-runtime.js` passe de la baseline `~21,025` lignes non vides à `9,943` lignes non vides.
- La cible principale `<=10,000` est atteinte sans régression tests/perf observée.
- Compat save confirmée: aucune clé/version/schema modifié.

## Rollback
- Les imports `domain/*` peuvent être repliés vers des fonctions locales dans les systèmes.
- Les extractions runtime peuvent être re-inline sans migration de données.
- Pas de rollback data nécessaire (format save inchangé).
