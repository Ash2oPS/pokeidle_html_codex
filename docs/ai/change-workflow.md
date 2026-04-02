<!-- doc-meta: {"status":"normative","scope":["change-workflow","ai-process"],"readFirst":["all-changes"]} -->
# Change Workflow

- Start every change by reading [README.md](./README.md) plus the relevant normative domain docs before making design or implementation decisions. [RULE:AI-WORKFLOW-001]
- Choose the safest edit surface in this order: tool workflow or authored data, then schemas or overrides, then generators, and only then runtime code. [RULE:AI-WORKFLOW-002]
- When runtime contracts, save shapes, or content schemas change, update the affected docs, tests, and migrations in the same change set. [RULE:AI-WORKFLOW-003]
- When UI changes land, preserve the deliberate split between desktop landscape and mobile portrait layouts and keep localization intact. [RULE:AI-WORKFLOW-004]
- Run `node scripts/validate-docs.mjs` for documentation or rule changes, and run the relevant package checks for runtime, schema, content, or UI changes. [RULE:AI-WORKFLOW-005]
- Use browser or Playwright checks only when the UI change is complex, highly interactive, or visually risky; simple nonvisual edits do not require them. [RULE:AI-WORKFLOW-006]