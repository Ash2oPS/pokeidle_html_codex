<!-- doc-meta: {"status":"reference","scope":["ai-navigation","doc-precedence"],"readFirst":["all-changes"]} -->
# AI Documentation Hub

## Precedence

1. [../../AGENTS.md](../../AGENTS.md)
2. Active normative docs in `docs/ai/`
3. Active normative domain docs in `docs/architecture/`, `docs/gameplay/`, `docs/tooling/`, `docs/product/`, `docs/testing/`, and `docs/ui/`
4. Active reference docs
5. Archive docs

Archive docs never override active normative docs.

## Read Paths

- Any code or content change: [repository-constraints.md](./repository-constraints.md), [change-workflow.md](./change-workflow.md), [quality-gates.md](./quality-gates.md)
- Documentation work: [documentation-governance.md](./documentation-governance.md), [rule-coverage.md](./rule-coverage.md), [../README.md](../README.md)
- Project tracking or backlog work: [../product/todo-system.md](../product/todo-system.md), [../product/todo-backlog.md](../product/todo-backlog.md), [change-workflow.md](./change-workflow.md)
- Gameplay work: [../gameplay/combat-overview.md](../gameplay/combat-overview.md), [../gameplay/zone-and-battle-systems.md](../gameplay/zone-and-battle-systems.md), [../gameplay/progression-systems.md](../gameplay/progression-systems.md), [../gameplay/talent-system.md](../gameplay/talent-system.md)
- Architecture and save work: [../architecture/runtime-architecture.md](../architecture/runtime-architecture.md), [../architecture/dependency-and-ownership.md](../architecture/dependency-and-ownership.md), [../architecture/content-pipeline.md](../architecture/content-pipeline.md), [../architecture/save-system.md](../architecture/save-system.md)
- Tooling and content work: [../tooling/editable-data-policy.md](../tooling/editable-data-policy.md), [../tooling/content-studio-v1.md](../tooling/content-studio-v1.md), [../architecture/content-pipeline.md](../architecture/content-pipeline.md)
- UI and localization work: [../ui/ui-principles.md](../ui/ui-principles.md), [../product/localization-policy.md](../product/localization-policy.md)

## Validation Assets

- [rule-registry.json](./rule-registry.json): canonical rule registry and document inventory
- [rule-coverage.md](./rule-coverage.md): five-pass consolidation record and source coverage
- `node scripts/validate-docs.mjs`: documentation validator
