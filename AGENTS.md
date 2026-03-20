# AI Guardrails

Ce repo est un vrai jeu web. Il ne doit pas etre traite comme une playable ad.

## Non-Negotiable

- Toute nouvelle valeur globale de game design doit naitre dans `game-design-config.js`.
- Le runtime ne doit jamais lire `game-design-config.js` directement, sauf dans `lib/game-design-config-runtime.js`.
- Les modules runtime consomment uniquement la version sanitisee exposee par `lib/game-design-config-runtime.js` ou des facades de compatibilite existantes.
- Toute copy UI user-facing doit etre UTF-8 propre ou encodee via escapes Unicode / entites HTML valides. Interdiction totale du mojibake: prefixes U+00C3 / U+00C2, replacement char U+FFFD, fragments CP1252 de guillemets/tirets, ou toute sequence visiblement casse.
- Toute copy UI FR doit passer par `normalizeUiDisplayText(..., { frenchTypography: true })` ou par la couche runtime de normalisation UI partagee.
- Toute copy UI FR hardcodee dans un template JS, une config UI, un `textContent`, un `innerHTML`, un `aria-label`, un `title`, un `placeholder` ou un `alt` doit etre correcte a la source. N'ecris pas volontairement une version ASCII cassee en comptant sur le normalizer.
- Toute modification UI doit etre validee avec screenshots sur les deux formats cibles:
  - desktop / PC
  - mobile portrait / telephone
- Toute modification UI doit preserver un style visuel coherent a l'echelle de tout le jeu. Interdiction de traiter chaque ecran, modal ou panneau comme un mini-projet graphique different.
- Il est interdit d'optimiser le rendu en baissant la resolution interne ou en ajoutant un render scale dynamique:
  - le rendu interne doit rester a l'echelle `x1`
  - pas de sous-rendu conditionnel selon device, FPS, qualite ou charge
  - les optimisations doivent passer par les budgets VFX, la cadence de rendu, la complexite des effets ou les simplifications de contenu, pas par une resolution floutee
- Pour toute nouvelle UI ou refonte UI, reutilise d'abord les patterns visuels deja presents:
  - palette
  - contrastes
  - typographies
  - rayons
  - bordures
  - ombres
  - densite d'espacement
  - formes de cartes, boutons, pills et modales
- Les VFX du jeu doivent garder une esthetique generale pixel-art-like:
  - pas du vrai pixel art strict
  - mais un rendu crunchy, lisible, a gros pixels propres
  - evite les VFX trop fins, trop lisses, trop flous ou trop "high-fidelity" qui cassent cette direction
- Quand un choix de rendu VFX existe, privilegie une execution compatible avec cette esthetique pixel:
  - formes lisibles
  - silhouettes franches
  - detail volontairement limite
  - rendu potentiellement moins fin si cela ameliore coherence visuelle et performances
- N'introduis une nouvelle variante visuelle que si elle sert une vraie hierarchie UX ou un besoin de gameplay clair. Ne cree jamais une nouvelle "direction artistique locale" par confort.
- Validation UI obligatoire:
  - lance `npm run test:visual:gallery:desktop`
  - lance `npm run test:visual:gallery:mobile`
  - ouvre et inspecte vraiment les screenshots generes
  - confirme que le rendu est lisible, non coupe, non chevauche, fonctionnel sur les deux formats, et visuellement coherent avec le reste du jeu
- Si la galerie visuelle ne couvre pas le flow UI touche, ajoute ou utilise un scenario visuel cible en plus. Ne te contente jamais de dire "les tests unitaires passent" pour une modif UI.
- Les donnees par route, item, Pokemon, talent ou encounter restent dans les CSV/JSON existants. Ne pas les aspirer dans `game-design-config.js`.
- Aucun nombre magique de tuning ne doit etre ajoute dans `game-runtime.js`, `systems/` ou `domain/`.
- `domain/` reste pur: pas de DOM, pas de `window`, pas d'acces save, pas d'effets de bord.
- `systems/` orchestrent les flux. Ils ne doivent pas redefinir une balance cachee.
- L'UI reste pilotee en JS:
  - structure DOM dans `systems/ui/runtime-ui-dom-factory.js`
  - interactions dans `systems/ui/runtime-ui-interaction-system.js`
  - rendu dans `systems/ui/runtime-render-system.js`
  - styles dans `styles.css`
- Il est interdit de reintroduire `game-settings.json`, `lib/game-settings-runtime.js` ou une logique store mobile.
- Le seul maintenance gate autorise est strictement celui du bootstrap web:
  - gate de boot uniquement
  - web de prod GitHub Pages uniquement
  - controle par `maintenance-config.js`
  - place avant le chargement des vendors et avant `game-runtime.js`
  - fail-open si la config est absente, invalide ou illisible
  - ne doit jamais bloquer localhost, `127.0.0.1` ou tout autre environnement dev / non-prod
- Le preview QA du mode maintenance est autorise uniquement hors prod via `?previewMaintenance=1`.
- Toute modification du bootstrap ou du mode maintenance doit etre validee par screenshots desktop et mobile portrait de l'ecran obtenu.
- Il est interdit de changer le schema de save, les cles de save, `window.render_game_to_text` ou `window.advanceTime` sans demande explicite.
- La fiabilite du background idle est critique:
  - le jeu ne doit jamais perdre de progression a cause d'un passage en arriere-plan
  - browser PC, browser smartphone, exe desktop et APK Android doivent tous retrouver une progression correcte au retour
- Interdiction de compter sur des timers caches pour la justesse sur mobile browser et APK Android.
- Le desktop peut simuler en live en background si la plateforme le permet, mais un catch-up de reprise reste obligatoire comme filet de securite.
- Le chemin de reprise apres background/suspend ne doit jamais repasser par le clamp foreground normal.
- Toute modification touchant:
  - game loop
  - timers
  - cadence d'attaque
  - progression idle
  - `last_tick_epoch_ms`
  - lifecycle page/app
  - bridge desktop/mobile/Capacitor
  doit obligatoirement valider la matrice background.

## Placement Rules

- `game-design-config.js`
  - Reglages globaux editables par design.
  - Valeurs stables, nommees, documentees.
- `lib/game-design-config-runtime.js`
  - Sanitize, clamp, derives, freeze, snapshot debug.
- `lib/runtime-version-config.js`
  - Contrats techniques de version/save.
  - Peut re-exporter des derives depuis la config design pour compatibilite.
- `lib/combat-balance-config.js`
  - Facade de compatibilite pour les constantes de combat/capture/gacha.
- `lib/gameplay-ui-config.js`
  - Facade de compatibilite pour progression, UI tuning et perf tuning.
- `lib/game-world-config.js`
  - Contenu de monde + petit sous-ensemble de tuning route/input, rien de plus.
- `item_data/`, `map_data/`, `pokemon_data/`
  - Sources de verite du contenu data-driven.

## Naming Rules

- Les cles designer-facing restent en anglais.
- La doc peut etre en francais, concise et actionnable.
- Toute cle doit montrer son unite dans le nom ou dans la doc:
  - `Ms`
  - `Odds`
  - `Multiplier`
  - `Ratio`
  - `Count`
  - `Level`
  - `Px`
- Interdits:
  - `speed`
  - `value`
  - `factor2`
  - tout nom flou sans unite ni contexte

## Required Workflow

Quand tu ajoutes ou deplaces une valeur de design:

1. Ajoute la cle dans `game-design-config.js`.
2. Ajoute sa sanitization dans `lib/game-design-config-runtime.js`.
3. Expose-la via la facade de compatibilite existante si le runtime l'utilise deja.
4. Ajoute ou adapte un test cible.
5. Si pertinent, expose-la dans `design_config_snapshot` de `render_game_to_text`.

## Refactor Policy

- Fais des changements chirurgicaux.
- Preserve les imports publics existants quand c'est possible.
- Ne refactor pas large "tant qu'on y est".
- Ne cree pas une seconde source de verite de tuning par confort.

## Done Checklist

- La nouvelle valeur est dans `game-design-config.js`.
- Elle est sanitisee, clamp et figee.
- Aucun import direct interdit de `game-design-config.js` n'a ete ajoute.
- Aucun nombre magique equivalent n'est reste planque ailleurs.
- Aucun texte UI nouveau n'introduit de mojibake ou de FR casse.
- Pour toute modif UI, les screenshots desktop et mobile portrait ont ete generes et relus.
- La modif UI reste alignée avec le langage visuel existant du jeu.
- Pour toute modif runtime/lifecycle/background, les preuves minimales existent:
  - tests unitaires touches
  - artefacts `render_game_to_text`
  - validation desktop web
  - validation mobile web portrait
  - validation Electron/desktop exe
  - note explicite de la duree de background testee
- `tests/ui-copy-encoding-guard.test.mjs` reste vert et les tests UI touches passent.
- Les tests passent.
