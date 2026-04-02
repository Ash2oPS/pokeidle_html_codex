<!-- doc-meta: {"status":"reference","scope":["rule-coverage","audit-history"],"readFirst":["documentation-audit"]} -->
# Rule Coverage Audit

This file records the five-pass consolidation that moved the repo from one large preproduction source into a canonical AI-first documentation system.

## Pass Record

### Pass 1

- Audited `AGENTS.md`, `README.md`, `.codex/environments/environment.toml`, and the active `docs/**/*.md` set.
- Identified the former preproduction file as the dominant source of unmapped rules and duplicated ownership.

### Pass 2

- Created the active `docs/ai/` surface.
- Split the former preproduction owner into active canonical docs plus [../product/preproduction-decisions-archive.md](../product/preproduction-decisions-archive.md).

### Pass 3

- Rewrote active normative docs to use explicit requirement wording and inline rule IDs.
- Added missing permanent owners for dependency direction, talent rules, zone and battle systems, editable data policy, product pillars, and localization.

### Pass 4

- Added [rule-registry.json](./rule-registry.json), `scripts/validate-docs.mjs`, the `check:docs` package script, and a Codex environment action for docs validation.
- Added validation for doc metadata, rule IDs, canonical homes, archive misuse, and active markdown links.

### Pass 5

- Re-audited the final active doc tree from the perspective of a new coding agent.
- Confirmed the read path `AGENTS.md -> docs/ai/README.md -> relevant normative domain docs`.

## Source Coverage Matrix

| Source | Canonical Owners |
| --- | --- |
| `AGENTS.md` | `AGENTS.md`, `docs/ai/README.md`, `docs/ai/repository-constraints.md`, `docs/ai/change-workflow.md` |
| `README.md` | `README.md`, `docs/README.md`, `docs/ai/README.md` |
| `.codex/environments/environment.toml` | `docs/ai/change-workflow.md`, `docs/ai/quality-gates.md`, `.codex/environments/environment.toml` |
| Former `docs/product/preproduction-decisions.md` | `docs/product/product-pillars.md`, `docs/product/localization-policy.md`, `docs/architecture/*.md`, `docs/gameplay/*.md`, `docs/tooling/editable-data-policy.md`, `docs/testing/testing-strategy.md`, `docs/ui/ui-principles.md`, archive copy |
| Existing architecture docs | Expanded in `docs/architecture/*.md` |
| Existing gameplay docs | Expanded in `docs/gameplay/*.md` |
| Existing tooling docs | Split between `docs/tooling/editable-data-policy.md` and `docs/tooling/content-studio-v1.md` |
| Existing testing and UI docs | Hardened in place |

## Resolved Duplicates And Conflicts

- Archive precedence conflict: the archive now preserves history, but active canon moved to `docs/ai/` and the domain docs.
- Tooling scope mismatch: `content-studio-v1.md` now documents the current in-memory editing foundation instead of implying a finished save flow.
- Runtime ownership overlap: layer boundaries, package ownership, and safe edit zones now live in separate canonical docs instead of the archive blob.

## Coverage Notes

- No source rule was intentionally deleted during consolidation.
- Historical wording remains in the archive even when multiple old bullets merged into one clearer active rule.
- Active normative guidance now lives only in the indexed canonical docs and the rule registry.