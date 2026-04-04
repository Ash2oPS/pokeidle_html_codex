<!-- doc-meta: {"status":"reference","scope":["documentation-index"],"readFirst":["docs-navigation"]} -->
# Documentation Index

## Status Model

- `normative`: active rules that constrain implementation and must stay in sync with the rule registry.
- `reference`: active supporting docs, indexes, current-state notes, and scoped summaries.
- `archive`: historical context only; never the active source of truth.

## Start Here

1. [../AGENTS.md](../AGENTS.md)
2. [ai/README.md](./ai/README.md)
3. The relevant normative domain docs for the change

## Task-Based Reading Paths

- Any repo change: [ai/README.md](./ai/README.md), [ai/repository-constraints.md](./ai/repository-constraints.md), [ai/change-workflow.md](./ai/change-workflow.md)
- Architecture or save work: [architecture/runtime-architecture.md](./architecture/runtime-architecture.md), [architecture/dependency-and-ownership.md](./architecture/dependency-and-ownership.md), [architecture/save-system.md](./architecture/save-system.md), [testing/testing-strategy.md](./testing/testing-strategy.md)
- Content, progression, or tooling work: [architecture/content-pipeline.md](./architecture/content-pipeline.md), [tooling/editable-data-policy.md](./tooling/editable-data-policy.md), [gameplay/progression-systems.md](./gameplay/progression-systems.md), [tooling/content-studio-v1.md](./tooling/content-studio-v1.md)
- Combat or battle-flow work: [gameplay/combat-overview.md](./gameplay/combat-overview.md), [gameplay/talent-system.md](./gameplay/talent-system.md), [gameplay/zone-and-battle-systems.md](./gameplay/zone-and-battle-systems.md), [testing/testing-strategy.md](./testing/testing-strategy.md)
- UI or localization work: [ui/ui-principles.md](./ui/ui-principles.md), [product/localization-policy.md](./product/localization-policy.md), [ai/quality-gates.md](./ai/quality-gates.md)
- Documentation work: [ai/documentation-governance.md](./ai/documentation-governance.md), [ai/rule-coverage.md](./ai/rule-coverage.md), [ai/quality-gates.md](./ai/quality-gates.md)
- Project tracking or backlog work: [product/todo-system.md](./product/todo-system.md), [product/todo-backlog.md](./product/todo-backlog.md), [ai/change-workflow.md](./ai/change-workflow.md)

## Canonical Documents

| Path | Status | Purpose |
| --- | --- | --- |
| [ai/README.md](./ai/README.md) | reference | AI onboarding, doc precedence, reading routes |
| [ai/repository-constraints.md](./ai/repository-constraints.md) | normative | repo-wide implementation boundaries |
| [ai/change-workflow.md](./ai/change-workflow.md) | normative | required change workflow for AI work |
| [ai/documentation-governance.md](./ai/documentation-governance.md) | normative | rule IDs, precedence, archive policy |
| [ai/quality-gates.md](./ai/quality-gates.md) | normative | validation and review gates |
| [architecture/runtime-architecture.md](./architecture/runtime-architecture.md) | normative | runtime ownership and simulation rules |
| [architecture/dependency-and-ownership.md](./architecture/dependency-and-ownership.md) | normative | package ownership and dependency direction |
| [architecture/content-pipeline.md](./architecture/content-pipeline.md) | normative | source/generated/authored boundaries |
| [architecture/save-system.md](./architecture/save-system.md) | normative | save persistence and migration rules |
| [gameplay/combat-overview.md](./gameplay/combat-overview.md) | normative | combat loop and combat dimensions |
| [gameplay/talent-system.md](./gameplay/talent-system.md) | normative | passive talent model and hooks |
| [gameplay/zone-and-battle-systems.md](./gameplay/zone-and-battle-systems.md) | normative | zone graph, events, trainer and gym rules |
| [gameplay/progression-systems.md](./gameplay/progression-systems.md) | normative | captures, evolution, quests, mastery |
| [tooling/editable-data-policy.md](./tooling/editable-data-policy.md) | normative | safe edit surfaces and tool-first policy |
| [product/localization-policy.md](./product/localization-policy.md) | normative | bilingual content rules |
| [testing/testing-strategy.md](./testing/testing-strategy.md) | normative | required testing priorities |
| [ui/ui-principles.md](./ui/ui-principles.md) | normative | player-facing UI rules |

## Supporting Reference Docs

- [product/product-pillars.md](./product/product-pillars.md)
- [product/todo-system.md](./product/todo-system.md)
- [product/todo-backlog.md](./product/todo-backlog.md)
- [product/vertical-slice-v1.md](./product/vertical-slice-v1.md)
- [tooling/content-studio-v1.md](./tooling/content-studio-v1.md)
- [ai/rule-coverage.md](./ai/rule-coverage.md)

## Archive

- [product/preproduction-decisions-archive.md](./product/preproduction-decisions-archive.md) keeps the original large preproduction source for historical reasoning only.
- [product/preproduction-decisions.md](./product/preproduction-decisions.md) is now a redirect stub and must not be treated as the canonical owner of active rules.
