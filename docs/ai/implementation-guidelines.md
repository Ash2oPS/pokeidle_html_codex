# AI Implementation Guidelines

Ce document detaille l'application pratique de `AGENTS.md`.

Si une regle ici contredit `AGENTS.md`, `AGENTS.md` gagne.

## Goal

L'IA doit produire des changements fiables, incrementaux, et compatibles avec le jeu existant.

## Decision Map

### Quand utiliser quel emplacement

- Reglage global editable par design:
  - `game-design-config.js`
  - puis `lib/game-design-config-runtime.js`
- Constante runtime exposee pour compatibilite:
  - facade existante dans `lib/`
- Contenu data-driven:
  - `item_data/`
  - `map_data/`
  - `pokemon_data/`
- UI runtime:
  - DOM dans `systems/ui/runtime-ui-dom-factory.js`
  - interactions dans `systems/ui/runtime-ui-interaction-system.js`
  - rendu dans `systems/ui/runtime-render-system.js`
  - styles dans `styles.css`
- Maintenance mode:
  - bootstrap web + `maintenance-config.js`
  - schedule hebdo et timezone definies dans `maintenance-config.js`
  - chaque creneau peut definir un message override optionnel

### Quand s'arreter et reconsiderer

- Si tu veux lire `game-design-config.js` depuis `game-runtime.js`, `systems/` ou `domain/`.
- Si tu veux mettre du contenu CSV/JSON dans une config globale.
- Si tu penses qu'une UI peut etre validee sans screenshots desktop et mobile portrait.
- Si tu veux regler une perf en baissant la resolution interne.
- Si tu crois devoir toucher au schema de save sans demande explicite.

## Playbooks

### Ajouter ou deplacer une valeur de design

1. Mets la cle dans `game-design-config.js`.
2. Sanitise, clamp et freeze dans `lib/game-design-config-runtime.js`.
3. Rebranche la facade existante si le runtime la consomme deja.
4. Retire le nombre magique remplace.
5. Ajoute les tests cibles:
   - sanitization
   - derives
   - facade / integration touchee
6. Si utile, expose la valeur dans `design_config_snapshot`.
7. Verifie que `npm test` reste vert.

### Toucher de la copy UI

1. Corrige le texte a la source.
2. Verifie que le flux passe par `normalizeUiDisplayText(..., { frenchTypography: true })` ou la couche partagee equivalente.
3. Garde `tests/ui-copy-encoding-guard.test.mjs` vert.
4. Ajoute un test si tu touches:
   - un template
   - le normalizer
   - une couche d'injection UI
5. N'importe jamais un texte user-facing douteux sans le reecrire proprement.

### Toucher a l'UI

1. Termine la modif.
2. Lance `npm run test:visual:gallery:desktop`.
3. Lance `npm run test:visual:gallery:mobile`.
4. Ouvre et relis vraiment les screenshots.
5. Verifie:
   - lisibilite
   - overlap / clipping
   - safe areas
   - etats importants
   - coherence visuelle avec les panneaux voisins
6. Si la galerie ne couvre pas le flow:
   - utilise un scenario visuel cible supplementaire
7. Ne cloture pas la tache tant que desktop et mobile portrait ne sont pas relus.

### Toucher au runtime, lifecycle ou background

1. Verifie que la progression reste monotone avant/apres background.
2. Verifie que le chemin de reprise utilise un catch-up dedie et pas le clamp foreground.
3. Lance les tests runtime touches.
4. Genere des artefacts `render_game_to_text` si la zone le justifie.
5. Valide:
   - web desktop
   - web mobile portrait
   - Electron
6. Si Android/Capacitor est touche, valide aussi un vrai `pause/resume`.
7. Note explicitement la duree de background testee dans le compte-rendu.

### Toucher au maintenance gate

1. Reste dans le bootstrap web.
2. Controle uniquement via `maintenance-config.js`.
3. Garde le comportement prod-only GitHub Pages.
4. Garde le preview QA uniquement via `?previewMaintenance=1` hors prod.
5. Preserve le fail-open en cas de config absente, invalide ou illisible.
6. Si une schedule est ajoutee, garde une timezone explicite et des tests sur dans/hors creneau.
7. Relis les captures desktop et mobile portrait de l'ecran obtenu.

### Faire une migration ou remplacer un flow

1. Identifie le nouveau point d'entree principal.
2. Retire les branches legacy, selectors, styles, scripts, tests et docs devenus inutiles.
3. Garde une compatibilite transitoire seulement si elle est necessaire.
4. Si tu la gardes:
   - documente la raison
   - documente la condition de retrait
   - couvre la transition par des tests
5. Ne masque pas un vrai probleme avec un fallback silencieux.

### Push sur main

1. Termine les commits locaux prevus.
2. Juste avant le push final sur `main`, verifie si `origin/main` a avance.
3. Si un nouveau commit est apparu, y compris le bump automatique de version cree par GitHub, pull `main`.
4. Ne pousse sur `main` qu'apres avoir reintegre cet etat distant a jour.

## Validation Matrix

### Config design

- Tests requis:
  - sanitization / clamps
  - derives
  - facade ou integration touchee
- Verification utile:
  - `design_config_snapshot` si pertinent

### UI copy

- Tests requis:
  - `tests/ui-copy-encoding-guard.test.mjs`
  - tests cibles du flux touche si besoin
- Verification requise:
  - relecture de la source et du rendu

### UI layout / visuals

- Tests requis:
  - `npm run test:visual:gallery:desktop`
  - `npm run test:visual:gallery:mobile`
- Verification requise:
  - relecture effective des captures desktop et mobile portrait

### Runtime / background / lifecycle

- Tests requis:
  - tests unitaires runtime touches
- Verification requise:
  - preuves `render_game_to_text` quand utile
  - validation desktop web
  - validation mobile web portrait
  - validation Electron
  - validation Android si touche

## Forbidden Shortcuts

- Cacher une regression visuelle derriere un test unitaire vert.
- Corriger une perf en baissant la resolution interne.
- Ajouter une abstraction par principe.
- Laisser une migration avec deux chemins actifs sans sortie documentee.
- Laisser du code mort ou des scripts orphelins apres remplacement.
- Introduire du mojibake en comptant sur un nettoyage plus tard.

## Documentation Hygiene

- `AGENTS.md` contient les regles et la checklist.
- Ce guide explique comment les appliquer.
- `docs/history/progress.md` garde l'historique, y compris des choix ou chemins parfois depasses.
- Si tu modifies les docs IA:
  - garde les doublons au minimum
  - garde les pointeurs de compatibilite utiles
  - mets a jour `docs/ai/README.md` si la structure change
