# UI Pokemon Boxes Kit

Reusable CSS kit extracted from the test scene in `tmp/ui-compact-boxes-preview.html`.

## Files

- `index.css`: single entry point.
- `tokens.css`: palette, radii, shadows, and typography tokens.
- `shell.css`: full-screen shell, frame, sidebar/main layout, and responsive container behavior.
- `components.css`: info panel, tabs, search field, grid, slot cards, and mobile panel reshaping.

## Import

```html
<link rel="stylesheet" href="/styles/ui-pokemon-boxes-kit/index.css" />
```

## Expected structure

- `.preview-shell`
- `.preview-card--compact`
- `.device-topbar`
- `.device-body`
- `.device-sidebar`
- `.device-main`
- `.sidebar-screen`
- `.main-grid`
- `.main-slot`

## Reuse rules

- Keep the shell full viewport on desktop and phone.
- Keep component content centered inside interactive elements.
- Keep the Pokemon info panel secondary to the grid.
- On phone, keep the selected-Pokemon panel short and use a left/right split.
- If you need a new state, add it next to the existing `is-selected` and `is-disabled` patterns instead of inventing another visual language.
