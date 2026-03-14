# pokeidle_html_codex

## Telechargement rapide (Windows)

Installer Electron (dernier build publie):  
**[Telecharger l'installer (.exe)](https://github.com/Ash2oPS/pokeidle_html_codex/releases/latest)**

Dans la page de release, ouvre **Assets** puis telecharge le fichier `PokeIdle-Setup-<version>.exe`.

## Telechargement rapide (Android)

APK Android (dernier build publie):  
**[Telecharger l'APK (.apk)](https://github.com/Ash2oPS/pokeidle_html_codex/releases/latest)**

Dans la page de release, ouvre **Assets** puis telecharge le fichier `.apk` publie.

## Desktop (Electron)

Le projet inclut maintenant une app Electron qui charge la version GitHub Pages du jeu, avec:
- sauvegarde JSON locale (dans `%APPDATA%/PokeIdle/saves/pokeidle_save_v3.json`)
- notifications desktop Windows via bridge natif
- fallback automatique sur les saves navigateur si besoin

### Lancer en desktop

```bash
npm run desktop:start
```

### Changer l'URL distante (optionnel)

Par defaut: `https://ash2ops.github.io/pokeidle_html_codex/`

Tu peux override:

```bash
$env:POKEIDLE_REMOTE_URL="https://ash2ops.github.io/pokeidle_html_codex/"; npm run desktop:start
```

ou:

```bash
npm run desktop:start -- --remote-url=https://ash2ops.github.io/pokeidle_html_codex/
```

### Build `.exe` Windows

```bash
npm run desktop:build
```

Sortie: `output/electron-dist/`

## Mobile Android (Capacitor, mode server.url)

L'APK Android charge directement la version live GitHub Pages:
- URL distante: `https://ash2ops.github.io/pokeidle_html_codex/`
- pas besoin de republier l'APK pour les updates web (HTML/CSS/JS)
- republish APK uniquement pour les changements natifs Android (permissions, plugins, icone, etc.)

Prerequis build Android:
- Java 21 (recommande pour Capacitor Android 8)
- Android Studio + SDK Android

### Synchroniser le projet Android

```bash
npm run mobile:sync
```

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

## Tests

```bash
npm test
```

Suites disponibles:
- `npm run test:node` pour les tests Node (`node:test`).
- `npm run test:vitest` pour les tests unitaires Vitest.

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

Lanceurs Windows:
- `launch_route_encounter_tool.bat`
- `launch_talents_tool.bat`
