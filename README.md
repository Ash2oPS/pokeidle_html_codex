# pokeidle_html_codex

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
