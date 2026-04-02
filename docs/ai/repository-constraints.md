<!-- doc-meta: {"status":"normative","scope":["repository-constraints","architecture-boundaries"],"readFirst":["all-code-changes","new-feature-design"]} -->
# Repository Constraints

- Gameplay logic must not live in React components or canvas rendering code, and renderer or UI-only objects must never become gameplay or save state. [RULE:AI-CONSTRAINTS-001]
- Important design values must live in structured content and documented tool workflows instead of scattered runtime constants. [RULE:AI-CONSTRAINTS-002]
- Keep `content/source`, `content/generated`, `content/authored`, and runtime bundles as separate layers; source imports stay immutable, generated outputs change intentionally through regeneration or documented pipeline work, and authored data owns project-specific tuning. [RULE:AI-CONSTRAINTS-003]
- Keep the player game and internal studio as separate apps that share contracts, schemas, and helpers through packages instead of duplicating logic. [RULE:AI-CONSTRAINTS-004]
- Static-first hosting and local-only save assumptions remain active until an explicit backend or cloud-save architecture decision updates the canonical docs. [RULE:AI-CONSTRAINTS-005]
- Guideline files remain English-only, and archive docs remain historical context rather than active implementation guidance. [RULE:AI-CONSTRAINTS-006]