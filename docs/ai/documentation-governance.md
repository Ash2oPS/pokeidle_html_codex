<!-- doc-meta: {"status":"normative","scope":["documentation-governance","rule-registry"],"readFirst":["documentation-changes","new-guidance"]} -->
# Documentation Governance

- Documentation precedence is `AGENTS.md`, then active normative docs in `docs/ai/`, then active task-specific normative docs, then active reference docs, and finally archive docs. [RULE:AI-DOC-001]
- Every tracked guideline markdown file in the active documentation set must declare `doc-meta` status and scope. [RULE:AI-DOC-002]
- Every normative bullet in an active normative doc must carry exactly one inline rule marker using the `RULE:<ID>` convention rendered as `[RULE:...]`. [RULE:AI-DOC-003]
- Every active rule ID must appear exactly once in [rule-registry.json](./rule-registry.json) and must name a single canonical home. [RULE:AI-DOC-004]
- Adding, changing, relocating, or removing active rules requires same-change updates to the canonical doc and [rule-registry.json](./rule-registry.json); update [rule-coverage.md](./rule-coverage.md) only when its audit narrative, source coverage matrix, or canonical ownership notes become inaccurate. [RULE:AI-DOC-005]
- Temporary decision docs must be migrated into permanent canonical docs and then removed, archived, or converted into redirect stubs. [RULE:AI-DOC-006]
