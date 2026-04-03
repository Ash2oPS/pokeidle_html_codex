<!-- doc-meta: {"status":"normative","scope":["change-workflow","ai-process"],"readFirst":["all-changes"]} -->
# Change Workflow

- Start every change by reading [README.md](./README.md) plus the relevant normative domain docs before making design or implementation decisions. [RULE:AI-WORKFLOW-001]
- Choose the safest edit surface in this order: tool workflow or authored data, then schemas or overrides, then generators, and only then runtime code. [RULE:AI-WORKFLOW-002]
- When runtime contracts, save shapes, or content schemas change, update the affected docs, tests, and migrations in the same change set. [RULE:AI-WORKFLOW-003]
- When UI changes land, preserve the deliberate split between desktop landscape and mobile portrait layouts and keep localization intact. [RULE:AI-WORKFLOW-004]
- Run `node scripts/validate-docs.mjs` for documentation or rule changes, and run the matching package checks from the matrix below for runtime, schema, content, tooling, or UI changes. [RULE:AI-WORKFLOW-005]
- Use browser or Playwright checks only when the UI change is complex, highly interactive, or visually risky; simple nonvisual edits do not require them. [RULE:AI-WORKFLOW-006]
- Treat ambiguity as a hard blocker for code, project, and documentation work when it affects the real goal, touched scope, expected result, change aggressiveness, or leaves multiple materially different valid interpretations; stop before additional writes when that ambiguity appears. [RULE:AI-WORKFLOW-007]
- When ambiguity blocks execution, ask one short clarification using this exact format on separate lines: `BLOCKER`, `Question: <one short, simple question>`, `Options:`, `- <option 1>`, `- <option 2>`, optional third option only if needed, `Recommended: <clear recommendation>`, `Impact: <short explanation of the consequences of each direction>`. [RULE:AI-WORKFLOW-008]
- Use the blocker format only for genuinely blocking project ambiguity; do not use it for trivial non-project requests or when one execution direction is already clear from the active docs and user context. [RULE:AI-WORKFLOW-009]

## Check Matrix

| Changed area | Minimum commands |
| --- | --- |
| Docs or rule files only | `node scripts/validate-docs.mjs` |
| `apps/game` UI or runtime wiring | `corepack pnpm --filter @pokeidle/game typecheck`<br>`corepack pnpm --filter @pokeidle/game build` |
| `apps/tools` studio UI or workflows | `corepack pnpm --filter @pokeidle/tools typecheck`<br>`corepack pnpm --filter @pokeidle/tools build` |
| `packages/game-core` simulation, combat, save, or progression logic | `corepack pnpm --filter @pokeidle/game-core typecheck`<br>`corepack pnpm --filter @pokeidle/game-core test` |
| `packages/content-data` authored data exposure or validation logic | `corepack pnpm --filter @pokeidle/content-data typecheck`<br>`corepack pnpm --filter @pokeidle/content-data test` |
| `packages/content-schema` schema changes | `corepack pnpm --filter @pokeidle/content-schema typecheck` |
| `packages/contracts` shared contract changes | `corepack pnpm --filter @pokeidle/contracts typecheck` |
| `packages/ui-tokens` shared UI token changes | `corepack pnpm --filter @pokeidle/ui-tokens typecheck` |
| Multi-package or uncertain blast radius | `corepack pnpm check` |

If one change touches multiple areas, run the union of their commands. When the blast radius is unclear, default to `corepack pnpm check`.
