# pokeidle_html_codex

## Telechargement rapide (Windows)

Installer Electron versionne directement dans le depot public:  
**[Telecharger l'installer Windows (.exe)](https://github.com/Ash2oPS/pokeidle_html_codex/raw/main/downloads/PokeIdle-Windows-Installer.exe)**

Fallback repo: **[ouvrir le dossier downloads](https://github.com/Ash2oPS/pokeidle_html_codex/tree/main/downloads)**

## Telechargement rapide (Android)

APK Android versionne directement dans le depot public:  
**[Telecharger l'APK Android (.apk)](https://github.com/Ash2oPS/pokeidle_html_codex/raw/main/downloads/PokeIdle-Android.apk)**

Fallback repo: **[ouvrir le dossier downloads](https://github.com/Ash2oPS/pokeidle_html_codex/tree/main/downloads)**

Les deux binaires ci-dessus sont pousses comme fichiers normaux du depot public, sans passer par
GitHub Releases. Le manifeste courant est disponible dans
[`downloads/manifest.json`](https://github.com/Ash2oPS/pokeidle_html_codex/blob/main/downloads/manifest.json).

## Desktop (Electron)

Le projet inclut maintenant une app Electron qui embarque un bundle web local (`dist/`) servi
par un mini serveur HTTP loopback interne, avec:
- sauvegarde JSON locale (dans `%APPDATA%/PokeIdle/saves/pokeidle_save_v3.json`)
- notifications desktop Windows via bridge natif
- fallback automatique sur les saves navigateur si besoin
- aucun chargement gameplay/data depuis GitHub Pages en build packagé

### Lancer en desktop

```bash
npm run desktop:start
```

Le script regenere d'abord le bundle local via `npm run web:build`.

### Override distant en dev uniquement (optionnel)

Par defaut: `https://ash2ops.github.io/pokeidle_html_codex/`

Tu peux override:

```bash
$env:POKEIDLE_REMOTE_URL="https://ash2ops.github.io/pokeidle_html_codex/"; npm run desktop:start
```

ou:

```bash
npm run desktop:start -- --remote-url=https://ash2ops.github.io/pokeidle_html_codex/
```

Cet override n'est pris en compte qu'en run dev non packagé. Le build packagé charge toujours le bundle local.

### Build `.exe` Windows

```bash
npm run desktop:build
```

Sortie: `output/electron-dist/`

Pour copier l'installateur dans le dossier public versionne:

```bash
npm run downloads:publish
```

## Build web local

Le bundle web local est regenere par:

```bash
npm run web:build
```

Effets:
- recree `dist/`
- copie les fichiers runtime web necessaires
- regenere `service-worker.js` et `offline-shell-manifest.json`
- alimente Electron et Capacitor avec le meme bundle local

## Mobile Android (Capacitor, bundle local)

L'APK Android embarque maintenant le bundle `dist/` synchronise dans `android/app/src/main/assets/public`:
- plus de chargement live depuis GitHub Pages
- le cache HTTP WebView statique est purge automatiquement au changement de version native
- la sauvegarde joueur reste conservee
- un hotfix web n'arrive plus dans l'APK sans republier un nouveau binaire

Prerequis build Android:
- Java 21 (recommande pour Capacitor Android 8)
- Android Studio + SDK Android

### Synchroniser le projet Android

```bash
npm run mobile:sync
```

Le script regenere d'abord `dist/`, puis pousse le bundle local dans le projet Android.

### Ouvrir dans Android Studio

```bash
npm run mobile:open:android
```

### Builder un APK debug

```bash
npm run mobile:apk:debug
```

Sortie attendue:
- `android/app/build/outputs/apk/debug/app-debug.apk`

Pour copier l'APK dans le dossier public versionne:

```bash
npm run downloads:publish
```

Pour regenerer les deux binaires publics d'un coup:

```bash
npm run downloads:refresh
```

## Tests

```bash
npm test
```

Suites disponibles:
- `npm run test:node` pour les tests Node (`node:test`).
- `npm run test:vitest` pour les tests unitaires Vitest.

## Documentation

- Guardrails IA: `AGENTS.md`
- Carte des docs IA: `docs/ai/README.md`
- Guide IA detaille: `docs/ai/implementation-guidelines.md`
- Archive de progression: `docs/history/progress.md`

## Architecture scripts

Les scripts sont maintenant organises par domaine:
- `scripts/map/`
- `scripts/data/pokemon/`
- `scripts/testing/playwright/`

Les anciens scripts racine sont conserves comme wrappers de compatibilite.

## Tools no-code

Lancement direct:

```bash
npm run tool:data-studio
```

Puis ouvre:
- `http://127.0.0.1:4877/route` pour `Route Encounter Studio`
- `http://127.0.0.1:4877/talents` pour `Talents Studio`

Lanceurs Windows (ports separes):
- `launch_route_encounter_tool.bat` -> `http://127.0.0.1:4877/route`
- `launch_talents_tool.bat` -> `http://127.0.0.1:4878/talents`
