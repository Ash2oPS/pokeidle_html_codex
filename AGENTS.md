# AI Guardrails

Ce repo est un vrai jeu web. Il ne doit pas etre traite comme une playable ad.

## Authority

- `AGENTS.md` est la source de verite des guardrails IA du repo.
- Docs de support:
  - `docs/ai/README.md`
  - `docs/ai/ui-style-guidelines.md`
  - `docs/ai/implementation-guidelines.md`
- Si une doc de support contredit ce fichier, `AGENTS.md` gagne.

## Non-Negotiable

- Toute nouvelle valeur globale de game design doit naitre dans `game-design-config.js`.
- Le runtime ne doit jamais lire `game-design-config.js` directement, sauf dans `lib/game-design-config-runtime.js`.
- Les modules runtime consomment uniquement la version sanitisee exposee par `lib/game-design-config-runtime.js` ou des facades de compatibilite existantes.
- Les donnees de contenu par route, item, Pokemon, talent ou encounter restent dans les CSV/JSON existants. Ne pas les aspirer dans `game-design-config.js`.
- Aucun nombre magique de tuning ne doit etre ajoute dans `game-runtime.js`, `systems/` ou `domain/`.
- `domain/` reste pur: pas de DOM, pas de `window`, pas d'acces save, pas d'effets de bord.
- `systems/` orchestrent les flux. Ils ne doivent pas redefinir une balance cachee.
- Etat actuel de l'UI runtime:
  - structure DOM dans `systems/ui/runtime-ui-dom-factory.js`
  - interactions dans `systems/ui/runtime-ui-interaction-system.js`
  - rendu dans `systems/ui/runtime-render-system.js`
  - styles dans `styles.css`
- Direction cible:
  - toute UI runtime de gameplay doit tendre vers un rendu JS canvas-first
  - ne pas introduire de nouvelle UI runtime majeure en DOM/CSS sans raison technique explicite documentee dans la tache
  - toute migration DOM -> canvas doit preserver la parite fonctionnelle complete de l'ecran ou du flow migre
  - ne jamais pretendre qu'une UI est deja migree si ce n'est pas le cas
- Les exceptions non-gameplay peuvent rester en DOM tant qu'elles ne sont pas migrees explicitement:
  - bootstrap
  - maintenance gate
  - overlays purement techniques ou dev
- Il est interdit de reintroduire `game-settings.json`, `lib/game-settings-runtime.js` ou une logique store mobile.
- Il est interdit de changer le schema de save, les cles de save, `window.render_game_to_text` ou `window.advanceTime` sans demande explicite.

## UI, Copy, And Visual Coherence

- Toute copy UI user-facing doit etre UTF-8 propre ou encodee via escapes Unicode / entites HTML valides.
- Interdiction totale du mojibake:
  - prefixes U+00C3 / U+00C2
  - replacement char U+FFFD
  - fragments CP1252 de guillemets ou tirets
  - toute sequence visiblement casse
- Toute copy UI FR doit passer par `normalizeUiDisplayText(..., { frenchTypography: true })` ou par la couche runtime de normalisation UI partagee.
- Toute copy UI FR hardcodee dans un template JS, une config UI, un `textContent`, un `innerHTML`, un `aria-label`, un `title`, un `placeholder` ou un `alt` doit etre correcte a la source. Ne compte jamais sur le normalizer pour corriger une source volontairement cassee.
- Toute modification UI doit preserver un style visuel coherent a l'echelle de tout le jeu. Interdiction de traiter chaque ecran, modal ou panneau comme un mini-projet graphique different.
- Le detail operationnel du style UI attendu est documente dans `docs/ai/ui-style-guidelines.md`.
- Toute UI doit rester lisible, non coupee, non chevauchee et fonctionnelle sur desktop et mobile portrait.
- Aucun element non lie ne doit se superposer a un autre ni sembler groupe avec lui par erreur visuelle.
- Les elements lies doivent etre plus proches entre eux que des elements non lies.
- Aucun element important ne doit dependre d'une hauteur fixe si son contenu peut varier.
- Toute zone principale doit absorber des variations raisonnables de contenu sans casser la structure.
- Prefere `grid`, `flex`, `minmax()` et `clamp()` avec des tokens coherents aux placements rigides ou tailles magiques.
- Evite les largeurs et hauteurs hardcodees sauf besoin explicite de gameplay, de sprite ou de contrainte technique documentee.
- Toute UI plein ecran doit vraiment occuper le viewport utile. Sur mobile, tiens compte des safe areas et du viewport dynamique.
- La version mobile ne doit jamais etre une simple version desktop ecrasee.
- Quand l'espace manque, restructure d'abord le layout avant de miniaturiser aveuglement le contenu.
- Les composants interactifs doivent garder un contenu proprement centre, une zone cliquable fiable et des etats lisibles.
- Supprime les textes, badges, aides et compteurs qui n'aident pas l'action ou la comprehension immediates.
- Pour toute nouvelle UI ou refonte UI, reutilise d'abord les patterns visuels deja presents:
  - palette
  - contrastes
  - typographies
  - rayons
  - bordures
  - ombres
  - densite d'espacement
  - formes de cartes, boutons, pills et modales
- N'introduis une nouvelle variante visuelle que si elle sert une vraie hierarchie UX ou un besoin de gameplay clair. Ne cree jamais une nouvelle direction artistique locale par confort.

## UI Runtime Robustness

- Toute UI runtime majeure creee ou refondue doit resister aux variations raisonnables de contenu:
  - texte court
  - texte long
  - compteurs qui changent
  - etats actifs/inactifs
- Toute taille ou densite pilotee a la fois par JS et CSS doit avoir une source de verite claire ou rester explicitement synchronisee.
- Si une liste ou une grille est virtualisee, la densite reelle doit etre validee avec les constantes JS de virtualisation et pas seulement avec le CSS.
- Toute UI canvas doit gerer proprement:
  - device pixel ratio
  - mapping de coordonnees
  - hitboxes
  - safe areas
  - lisibilite du texte
- Toute migration DOM -> canvas doit conserver les informations utiles, les etats et les interactions de l'UI remplacee avant d'ajouter des raffinements visuels.

## Rendering And VFX

- Il est interdit d'optimiser le rendu en baissant la resolution interne ou en ajoutant un render scale dynamique.
- Le rendu interne doit rester a l'echelle `x1`.
- Interdit:
  - sous-rendu conditionnel selon device, FPS, qualite ou charge
  - baisse de resolution cachee dans un preset de qualite
  - flou structurel en guise d'optimisation
- Les optimisations doivent passer par les budgets VFX, la cadence de rendu, la complexite des effets ou les simplifications de contenu.
- Les VFX du jeu doivent garder une esthetique generale pixel-art-like:
  - pas du vrai pixel art strict
  - rendu crunchy, lisible, a gros pixels propres
  - eviter les VFX trop fins, trop lisses, trop flous ou trop high-fidelity
- Quand un choix de rendu VFX existe, privilegie une execution compatible avec cette esthetique:
  - formes lisibles
  - silhouettes franches
  - detail volontairement limite
  - rendu potentiellement moins fin si cela ameliore coherence visuelle et performances

## Validation Rules

- Toute modification UI doit etre validee avec screenshots sur les deux formats cibles:
  - desktop / PC
  - mobile portrait / telephone
- Validation UI obligatoire:
  - lance `npm run test:visual:gallery:desktop`
  - lance `npm run test:visual:gallery:mobile`
  - ouvre et inspecte vraiment les screenshots generes
  - confirme que le rendu est lisible, non coupe, non chevauche, fonctionnel sur les deux formats, et visuellement coherent avec le reste du jeu
- Si la galerie visuelle ne couvre pas le flow touche, ajoute ou utilise un scenario visuel cible en plus.
- Les tests unitaires seuls sont insuffisants pour cloturer une modif UI.
- Toute modification du bootstrap ou du mode maintenance doit etre validee par screenshots desktop et mobile portrait de l'ecran obtenu.
- Toute modification touchant:
  - game loop
  - timers
  - cadence d'attaque
  - progression idle
  - `last_tick_epoch_ms`
  - lifecycle page/app
  - bridge desktop/mobile/Capacitor
  doit obligatoirement valider la matrice background.

## Runtime And Platform Safety

- Le seul maintenance gate autorise est strictement celui du bootstrap web:
  - gate de boot uniquement
  - web de prod GitHub Pages uniquement
  - controle par `maintenance-config.js`
  - place avant le chargement des vendors et avant `game-runtime.js`
  - fail-open si la config est absente, invalide ou illisible
  - ne doit jamais bloquer localhost, `127.0.0.1` ou tout autre environnement dev / non-prod
- Le preview QA du mode maintenance est autorise uniquement hors prod via `?previewMaintenance=1`.
- La fiabilite du background idle est critique:
  - le jeu ne doit jamais perdre de progression a cause d'un passage en arriere-plan
  - browser PC, browser smartphone, exe desktop et APK Android doivent tous retrouver une progression correcte au retour
- Interdiction de compter sur des timers caches pour la justesse sur mobile browser et APK Android.
- Le desktop peut simuler en live en background si la plateforme le permet, mais un catch-up de reprise reste obligatoire comme filet de securite.
- Le chemin de reprise apres background/suspend ne doit jamais repasser par le clamp foreground normal.

## Code Hygiene

- Toute nouvelle abstraction, helper, module ou fichier doit avoir une raison concrete:
  - reutilisation reelle
  - isolation technique nette
  - testabilite clairement meilleure
  - pas de couche au cas ou
- Quand un flow, un systeme ou un ecran remplace un ancien, supprime dans la meme tache le code mort associe:
  - branches legacy
  - flags devenus inutiles
  - styles/selectors orphelins
  - scripts et tests obsoletes
  - docs perimees
- Interdiction de maintenir deux chemins runtime/UI equivalentes en parallele sans migration explicite:
  - point d'entree unique clairement assume
  - raison transitoire documentee
  - condition de retrait claire
- Hors exceptions explicitement documentees comme le fail-open du bootstrap maintenance, n'ajoute pas de fallback silencieux qui masque:
  - une erreur structurelle
  - des donnees invalides
  - un import casse
  - une config manquante
- Tout nouvel `id`, `class`, `data-*`, selector CSS ou selector JS pilote par le runtime doit etre:
  - stable
  - unique
  - teste si le flow est critique
- Toute nouvelle commande de test, debug, capture ou migration ajoutee dans `scripts/` doit etre:
  - branchee dans `package.json`
  - ou documentee explicitement au bon endroit
  - jamais laissee orpheline
- Tout nouveau flag debug, query param, toggle dev ou hook `window.*` doit etre:
  - documente
  - borne au dev / non-prod si possible
  - retire quand il ne sert plus
- N'ajoute pas de `TODO` / `FIXME` vague.
- Si un TODO est vraiment indispensable, il doit nommer le blocage concret et ce qu'il faudra retirer ou terminer ensuite.

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

## Git Workflow

- Chaque push sur `main` declenche un push automatique GitHub qui bump la version du jeu.
- Si l'utilisateur demande un push sur `main`, verifie toujours juste avant le push final si `origin/main` a bouge entre-temps.
- Si un bump automatique ou tout autre commit distant est apparu, pull `main` avant de push.
- Ne considere jamais qu'un `main` local prepare plus tot est encore a jour au moment du push final.

## Documentation Maintenance

- Si tu modifies un guardrail repo-wide, mets a jour `AGENTS.md` d'abord.
- Si le detail operationnel change aussi, mets a jour `docs/ai/implementation-guidelines.md` dans la meme tache.
- Garde `docs/ai/README.md` synchronise avec la structure reelle des docs IA.

## Refactor Policy

- Fais des changements chirurgicaux.
- Preserve les imports publics existants quand c'est possible.
- Ne refactor pas large tant qu'on y est.
- Ne cree pas une seconde source de verite de tuning par confort.
- Si tu introduis une compatibilite transitoire, documente immediatement sa sortie et evite qu'elle devienne permanente par oubli.

## Done Checklist

- La nouvelle valeur est dans `game-design-config.js`.
- Elle est sanitisee, clamp et figee.
- Aucun import direct interdit de `game-design-config.js` n'a ete ajoute.
- Aucun nombre magique equivalent n'est reste planque ailleurs.
- Aucun texte UI nouveau n'introduit de mojibake ou de FR casse.
- Toute UI majeure respecte la direction canvas-first ou documente explicitement pourquoi elle reste temporairement en DOM/CSS.
- Aucun code mort, style orphelin, selector obsolete ou script inutile n'a ete laisse apres le changement.
- Aucun nouveau fallback silencieux ou double chemin inutile n'a ete introduit.
- Toute nouvelle commande `scripts/` est soit branchee dans `package.json`, soit documentee explicitement.
- Tout nouveau flag debug/query param/hook runtime a une portee claire et une raison d'exister.
- Pour toute modif UI, les screenshots desktop et mobile portrait ont ete generes et relus.
- Pour toute modif UI, aucun overlap non voulu, aucun texte coupe et aucune cassure responsive n'ont ete laisses.
- Pour toute modif UI, les composants interactifs restent centres, lisibles et cliquables sur desktop comme sur mobile.
- Si la densite ou le layout depend de constantes JS ou de virtualisation, elles ont ete revues avec le CSS correspondant.
- La modif UI reste alignee avec le langage visuel existant du jeu.
- Pour toute modif runtime/lifecycle/background, les preuves minimales existent:
  - tests unitaires touches
  - artefacts `render_game_to_text`
  - validation desktop web
  - validation mobile web portrait
  - validation Electron/desktop exe
  - note explicite de la duree de background testee
- `tests/ui-copy-encoding-guard.test.mjs` reste vert et les tests UI touches passent.
- Les tests passent.
