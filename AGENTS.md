# AGENTS.md

This repository is a bilingual Pokemon-inspired idle web game set in Sinnoh.
The project is AI-assisted and must stay strongly constrained by documentation, data contracts, and clean architecture.

## Read First

- Read [docs/product/preproduction-decisions.md](./docs/product/preproduction-decisions.md) before changing gameplay systems.
- Read [docs/architecture/runtime-architecture.md](./docs/architecture/runtime-architecture.md) before changing simulation, rendering, UI, or save code.
- Read [docs/ui/ui-principles.md](./docs/ui/ui-principles.md) before changing player-facing interfaces.

## Core Rules

- Keep simulation, rendering, UI, save, and content tooling separated.
- Do not create monolithic TypeScript files or mixed-responsibility modules.
- Treat the simulation as the source of truth.
- Keep gameplay logic out of React components and canvas rendering code.
- Keep rendering logic out of save and content modules.

## Data And Tooling Rules

- Important game-design values are edited through tools, not scattered through code.
- Keep authoring data, generated data, and runtime bundles as separate layers.
- Do not edit canonical imported Pokemon data by hand.
- Put project-specific balance and interpretation in explicit override files.

## UI Rules

- HUD interfaces must stay compact.
- Avoid filler text and redundant labels.
- Design desktop landscape and mobile portrait as separate deliberate layouts.
- Large focus interfaces should use the project PC-window visual language.

## Localization Rules

- All player-facing text must support English and French.
- English is the default fallback language.
- Do not hardcode single-language strings into gameplay content or UI flow.

## Documentation Rules

- Update documentation when architecture, content contracts, or workflow rules change.
- Keep guideline files in English only.
- If a temporary decision file exists, migrate it into permanent docs and remove the temporary file afterward.

