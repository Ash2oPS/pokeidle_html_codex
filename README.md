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
- `corepack pnpm check`: run workspace type checks
- `corepack pnpm build`: build every workspace package and app

## Key Documents

- [docs/product/preproduction-decisions.md](./docs/product/preproduction-decisions.md)
- [docs/product/vertical-slice-v1.md](./docs/product/vertical-slice-v1.md)
- [docs/architecture/runtime-architecture.md](./docs/architecture/runtime-architecture.md)
- [docs/architecture/save-system.md](./docs/architecture/save-system.md)
- [docs/architecture/content-pipeline.md](./docs/architecture/content-pipeline.md)
- [docs/ui/ui-principles.md](./docs/ui/ui-principles.md)
- [docs/tooling/content-studio-v1.md](./docs/tooling/content-studio-v1.md)

