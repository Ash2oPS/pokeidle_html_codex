# AI Implementation Guidelines

Ce document detaille les regles de `AGENTS.md`. Si une regle ici contredit `AGENTS.md`, `AGENTS.md` gagne.

## Goal

L'IA doit produire des changements fiables, incrementaux, et compatibles avec le jeu existant.

## Source Of Truth

### Designer-facing tuning

- Va dans `game-design-config.js`.
- Doit etre documente.
- Doit rester en plain data.
- Ne doit pas contenir de logique metier opaque.

### Runtime-safe tuning

- Va dans `lib/game-design-config-runtime.js`.
- Doit:
  - lire la config brute
  - normaliser les types
  - appliquer des bornes
  - calculer les derives
  - freezer le resultat

### Content data

- Reste dans:
  - `item_data/`
  - `map_data/`
  - `pokemon_data/`
- Exemples:
  - une nouvelle ball
  - une nouvelle route
  - une table de talents
  - des encounters

## Import Rules

- Autorise:
  - `lib/game-design-config-runtime.js` -> `game-design-config.js`
- Interdit:
  - `game-runtime.js` -> `game-design-config.js`
  - `systems/*` -> `game-design-config.js`
  - `domain/*` -> `game-design-config.js`
  - `tests/*` -> `game-design-config.js` sauf test explicite du runtime adapter

## Architectural Rules

### UI text and encoding

- Toute copy UI user-facing doit etre propre en UTF-8.
- Si tu ne peux pas garantir l'encodage du fichier, utilise des escapes Unicode (`\u00e9`) ou des entites HTML valides.
- Ne laisse jamais passer de mojibake dans le runtime:
  - prefixes U+00C3 / U+00C2
  - replacement char U+FFFD
  - fragments CP1252 de guillemets ou tirets
  - toute sequence visiblement casse
- Les templates HTML JS, labels, titres, placeholders, `aria-label`, `title` et `alt` doivent etre normalises.
- Les textes FR injectes dans l'UI doivent passer par `normalizeUiDisplayText(..., { frenchTypography: true })` ou par la couche de normalisation UI partagee du runtime.
- Quand tu ajoutes une nouvelle copy FR:
  - prefere la source correcte directement
  - garde la normalisation comme filet de securite
  - n'utilise pas la normalisation comme excuse pour laisser de la copy casse a la source
  - n'importe jamais de texte user-facing depuis un terminal ou un copier-coller douteux sans le reecrire proprement

### UI

- La structure DOM se gere en JS.
- Ne reintroduis pas de gros HTML statique pour des ecrans runtime.
- Garde la separation:
  - DOM factory
  - interaction system
  - render system
  - CSS
- Il est interdit d'optimiser le jeu en reduisant la resolution interne ou en ajoutant un render scale dynamique.
- Le rendu interne doit rester a l'echelle `x1` sur tous les formats.
- Interdit:
  - sous-rendre le canvas selon le device
  - baisser la resolution selon la charge ou le FPS
  - cacher une baisse de resolution dans des presets de qualite
- Pour les performances, prefere:
  - reduire le nombre de particules
  - simplifier les VFX
  - espacer certaines mises a jour visuelles
  - diminuer des budgets d'effets ou des details secondaires
- L'UI doit garder un style visuel coherent sur l'ensemble du jeu.
- Chaque nouvel ecran, modal, panneau, carte ou refonte doit sembler appartenir au meme produit que le reste du jeu.
- Avant d'inventer un nouveau style, reutilise d'abord les patterns existants:
  - palette et niveaux de contraste
  - typographies et echelles de taille
  - rayons, bordures et ombres
  - densite d'espacement
  - formes de boutons, pills, cartes, modales et panneaux d'info
  - principes d'etat visuel: hover, actif, selection, rarete, desactive
- Les VFX doivent suivre une direction generale pixel-art-like.
- Ce n'est pas une obligation de vrai pixel art strict, mais le rendu doit evoquer un style proche:
  - crunchy
  - gros pixels propres
  - formes franches
  - lecture immediate
- Evite pour les VFX:
  - les effets trop fins
  - les micro-details bruiteux
  - les blurs mous omnipresents
  - les particules trop petites ou trop "modern high-fidelity"
- Quand plusieurs niveaux de rendu sont possibles, tu peux volontairement choisir un rendu moins fin si cela:
  - renforce cette esthetique pixel-art-like
  - garde les VFX lisibles en mouvement
  - reduit le cout de rendu
  - reste coherent avec le reste du jeu
- N'introduis une nouvelle variante visuelle que si elle est justifiee par une hierarchie UX claire, un role gameplay distinct ou une demande explicite.
- Interdit:
  - donner a un ecran un look isole qui casse l'identite du jeu
  - multiplier les styles de boutons/cartes sans raison
  - changer police, rayon, ombre ou palette localement "parce que ca rend bien ici"
  - melanger des niveaux de densite tres differents entre panneaux voisins
- Toute modification UI doit etre validee sur les deux formats de reference:
  - desktop / PC
  - mobile portrait / telephone
- Validation obligatoire pour chaque changement UI:
  - lance `npm run test:visual:gallery:desktop`
  - lance `npm run test:visual:gallery:mobile`
  - ouvre et inspecte les screenshots generes dans `output/ui-state-gallery/desktop-landscape/` et `output/ui-state-gallery/mobile-portrait/`
  - verifie lisibilite, tailles de texte, overlap, clipping, safe areas, boutons atteignables, modales, et etats importants
  - compare aussi le rendu aux panneaux et ecrans voisins pour confirmer la coherence visuelle globale
- Si la galerie existante ne montre pas le flow touche:
  - lance aussi `npm run test:visual:desktop` et `npm run test:visual:mobile`
  - ou ajoute un scenario visuel adapte
  - puis ouvre les nouvelles captures et controle le resultat
- Une modif UI n'est pas consideree validee tant que les captures desktop et mobile portrait n'ont pas ete relues. Les tests unitaires seuls sont insuffisants pour cloturer une tache UI.

### Boot maintenance gate

- Le seul maintenance gate autorise dans ce repo est un gate de boot web prod-only.
- Il doit vivre avant tout chargement lourd:
  - avant les vendors
  - avant `game-runtime.js`
  - avant tout chargement data/audio/runtime
- Il doit etre controle uniquement par `maintenance-config.js`.
- Il doit s'appliquer uniquement au web de prod GitHub Pages.
- Si `maintenance-config.js` est active mais que l'environnement n'est pas la prod web:
  - le jeu doit continuer a booter normalement
  - aucun dev local / preview non-prod ne doit etre bloque
- Un preview QA local est autorise uniquement hors prod via `?previewMaintenance=1`.
- Si le gate s'active:
  - il ne doit charger ni vendors ni runtime
  - il doit afficher uniquement l'ecran de maintenance derive du loading screen
  - il doit utiliser le message custom si fourni, sinon `Le jeu est en maintenance. Merci de reessayer plus tard.`
- En cas d'erreur de chargement, d'import casse ou de config invalide, le comportement doit etre fail-open:
  - `console.warn`
  - boot normal
  - jamais de prod ou de dev briquee par accident
- Toute modif touchant le bootstrap ou le mode maintenance doit etre validee par screenshots:
  - desktop / PC
  - mobile portrait / telephone
- Interdit:
  - reintroduire un maintenance gate disperse dans `game-runtime.js` ou ailleurs
  - reintroduire `game-settings.json` pour ce besoin
  - reutiliser un checker d'update GitHub ou une logique store mobile pour faire office de maintenance

### Code hygiene and migrations

- N'ajoute une nouvelle abstraction, helper, facade, module ou fichier que si elle apporte au moins un gain clair:
  - reutilisation reelle
  - isolation technique propre
  - meilleure testabilite
  - baisse nette de complexite locale
- Interdit:
  - extraire "par principe"
  - creer une couche juste pour faire joli
  - multiplier les helpers mono-usage sans benefice concret
- Quand un flux, un ecran ou un systeme en remplace un autre, la meme tache doit nettoyer ce qui devient obsolete:
  - branches legacy
  - flags morts
  - selectors/styles orphelins
  - scripts obsoletes
  - tests de comportement retire
  - docs perimees
- N'entretiens pas deux chemins runtime/UI equivalentes en parallele sauf migration transitoire explicitement cadree.
- Si une migration transitoire est vraiment necessaire, elle doit avoir:
  - un point d'entree principal clair
  - une raison documentee
  - une condition de retrait claire
  - des tests qui couvrent la transition
- Hors exceptions explicitement documentees comme le fail-open du bootstrap maintenance, evite les fallbacks silencieux qui masquent:
  - import casse
  - config manquante
  - donnees invalides
  - branche non supportee
- Pour un vrai probleme structurel, prefere:
  - signaler clairement l'erreur
  - echouer bruyamment en dev
  - corriger la source du probleme
  plutot que d'empiler des rustines invisibles
- Tout nouvel `id`, `class`, `data-*`, selector CSS ou selector JS manipule par le runtime doit etre:
  - stable
  - unique
  - nomme de facon descriptive
  - couvert par un test DOM/interactions si le flow est important
- Toute nouvelle commande ajoutee dans `scripts/` doit etre:
  - reliee a `package.json`
  - ou documentee clairement si elle est volontairement manuelle
  - nommee selon son usage reel
  - supprimee si elle devient obsolete
- Tout nouveau flag debug, query param, toggle dev, export debug ou hook `window.*` doit etre:
  - documente
  - borne au dev/non-prod si possible
  - justifie par un vrai besoin
  - retire quand il ne sert plus
- Evite les `TODO` / `FIXME` vagues.
- Si un TODO est inevitable, il doit preciser:
  - le blocage concret
  - ce qui reste a faire
  - ce qui devra etre retire ou simplifie ensuite

### Domain

- `domain/` contient des regles pures.
- Les fonctions doivent preferer des parametres explicites a des imports globaux.
- Pas d'acces `window`, `document`, storage, audio, fetch, save state.

### Systems

- Les systems branchent les modules entre eux.
- Ils ne doivent pas cacher des constantes de balance dans leur corps.
- Ils peuvent recevoir une config sanitisee ou des facades stables.

### Save compatibility

- Toute evolution du save schema est hors scope par defaut.
- Si tu crois devoir toucher au save schema, stoppe et attends une demande explicite.

### Background runtime

- Le background idle est un invariant runtime critique.
- Le jeu ne doit jamais perdre de progression a cause d'un passage en arriere-plan, d'une perte de focus, d'une minimisation, d'un `pagehide`, d'un `freeze` ou d'un `pause/resume` mobile.
- Cibles obligatoires:
  - browser PC
  - browser smartphone
  - exe desktop / Electron
  - APK Android / Capacitor
- Interdit:
  - supposer que des timers caches restent fiables sur mobile browser ou APK Android
  - reparer le background en changeant le schema de save
  - faire repasser le chemin de reprise par le clamp foreground normal
- Autorise:
  - simulation live en background sur desktop si la plateforme le permet
  - catch-up exact au retour comme filet de securite obligatoire
  - persist immediate sur entree background/suspend
- Toute modif touchant la loop, les timers, la progression, `last_tick_epoch_ms`, le lifecycle page/app, le bridge Electron ou Capacitor, ou les budgets de simulation doit revalider la matrice background complete.

## Forbidden Changes

- Reintroduire `game-settings.json`
- Reintroduire `lib/game-settings-runtime.js`
- Reintroduire des redirects Play Store / App Store
- Introduire un maintenance gate runtime disperse ou qui bloque les environnements dev / non-prod
- Laisser du code mort, des selectors/styles orphelins ou des scripts inutiles apres une migration
- Ajouter un fallback silencieux pour cacher un probleme structurel non documente
- Laisser un script de debug/test orphelin sans point d'entree clair
- Ajouter des nombres magiques de tuning dans le runtime
- Aspirer des CSV/JSON de contenu dans le fichier global de design
- Changer des hooks publics runtime sans demande explicite
- Introduire un texte UI mojibake ou une string FR user-facing non normalisee

## Naming And Docs

- Les cles restent stables.
- Une cle = un effet comprehensible.
- La doc doit repondre a:
  - a quoi sert la valeur
  - quel est son impact
  - quelle unite elle utilise

## Required Tests

Chaque changement de config design doit couvrir au minimum:

1. Sanitization
2. Compatibilite facade
3. Regle metier ou integration touchee
4. Si de la copy UI est touchee, test anti-mojibake / normalisation sur le flux concerne
5. Si l'UI est touchee, validation screenshots desktop + mobile portrait avec relecture effective

Tests utiles:

- clamp / fallback invalides
- derives calcules
- `render_game_to_text` si la valeur doit etre visible en debug
- garde d'architecture sur les imports interdits
- `tests/ui-copy-encoding-guard.test.mjs` pour la copy UI runtime

## Practical Playbook

Quand tu veux exposer une valeur editable:

1. Identifie si c'est du tuning global ou du contenu data-driven.
2. Si c'est global, ajoute la cle dans `game-design-config.js`.
3. Ajoute la version sanitisee dans `lib/game-design-config-runtime.js`.
4. Branche la facade de compatibilite existante.
5. Supprime le nombre magique source.
6. Ajoute les tests.
7. Verifie que `npm test` reste vert.

Quand tu touches de la copy UI:

1. Corrige la source du texte.
2. Assure-toi que le flux passe par la normalisation UI partagee.
3. Garde `tests/ui-copy-encoding-guard.test.mjs` vert.
4. Ajoute un test si tu touches un template, un normalizer ou une couche d'injection UI.

Quand tu touches de l'UI au sens large:

1. Termine la modif.
2. Lance `npm run test:visual:gallery:desktop`.
3. Lance `npm run test:visual:gallery:mobile`.
4. Ouvre et relis les screenshots desktop et mobile portrait.
5. Verifie explicitement que le composant touche reste coherent avec les autres UI proches du jeu.
6. Si le flow touche n'apparait pas assez dans la galerie, execute un scenario visuel cible supplementaire.
7. Ne cloture pas la tache tant que les deux formats ne sont pas lisibles, fonctionnels, et visuellement coherents.

Quand tu touches au runtime/lifecycle/background:

1. Verifie que la progression reste monotone avant/apres background.
2. Verifie que le chemin de reprise utilise un catch-up dedie et pas le clamp foreground.
3. Lance les tests unitaires runtime touches.
4. Genere des artefacts `render_game_to_text` montrant `background_runtime`.
5. Valide le web desktop, le web mobile portrait et Electron avec screenshots apres reprise.
6. Si Android/Capacitor est touche, valide aussi l'APK avec un vrai `pause/resume`.
7. Note explicitement la duree de background testee dans ton compte-rendu.

Quand tu fais une migration ou un remplacement de flow:

1. Identifie le nouveau point d'entree principal.
2. Retire les branches legacy, selectors, styles, scripts et docs devenus inutiles.
3. Garde une compatibilite transitoire seulement si elle est vraiment necessaire.
4. Si tu gardes cette compatibilite, documente immediatement la condition de retrait.
5. Ajoute les tests qui prouvent le nouveau chemin principal.
6. Verifie qu'aucun fallback silencieux ne masque un vrai probleme.
7. Ne laisse pas de TODO vague a la fin de la tache.
