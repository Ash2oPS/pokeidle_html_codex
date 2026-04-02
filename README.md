<!-- doc-meta: {"status":"reference","scope":["repository-readme","project-entry"],"readFirst":["repo-overview"]} -->
# pokeidle_html_codex

Pokemon-inspired idle web game set in Sinnoh.

## Stack

- Monorepo: `pnpm` workspace
- Game: Vite + React + custom canvas renderer
- Tools: Vite + React
- Shared packages: contracts, runtime helpers, content schemas, UI tokens
- Save: local-only IndexedDB in V1

## Workspace

- `apps/game`: player-facing game client
- `apps/tools`: internal content and design studio
- `packages/contracts`: shared domain contracts
- `packages/game-core`: runtime helpers and platform policies
- `packages/content-schema`: schema and validation layer
- `packages/ui-tokens`: shared visual tokens
- `content/`: authored, generated, and source data layers
- `docs/`: permanent project documentation

## Getting Started

Use `corepack` because `pnpm` may not be globally installed.

```powershell
corepack pnpm install
corepack pnpm dev
```

Useful commands:

- `corepack pnpm dev`: run game + tools
- `corepack pnpm dev:game`: run only the game
- `corepack pnpm dev:tools`: run only the tool studio
- `npm run check:docs`: run documentation structure and rule validation
- `corepack pnpm check`: run docs validation, workspace type checks, and tests
- `corepack pnpm build`: build every workspace package and app

## Documentation Entry

- [docs/ai/README.md](./docs/ai/README.md): canonical AI navigation and doc precedence
- [docs/README.md](./docs/README.md): full documentation index

## Key Documents

- [docs/product/product-pillars.md](./docs/product/product-pillars.md)
- [docs/architecture/runtime-architecture.md](./docs/architecture/runtime-architecture.md)
- [docs/architecture/dependency-and-ownership.md](./docs/architecture/dependency-and-ownership.md)
- [docs/architecture/save-system.md](./docs/architecture/save-system.md)
- [docs/architecture/content-pipeline.md](./docs/architecture/content-pipeline.md)
- [docs/gameplay/combat-overview.md](./docs/gameplay/combat-overview.md)
- [docs/gameplay/zone-and-battle-systems.md](./docs/gameplay/zone-and-battle-systems.md)
- [docs/gameplay/progression-systems.md](./docs/gameplay/progression-systems.md)
- [docs/gameplay/talent-system.md](./docs/gameplay/talent-system.md)
- [docs/tooling/editable-data-policy.md](./docs/tooling/editable-data-policy.md)
- [docs/testing/testing-strategy.md](./docs/testing/testing-strategy.md)
- [docs/ui/ui-principles.md](./docs/ui/ui-principles.md)
