<!-- doc-meta: {"status":"normative","scope":["editable-data","tooling-policy"],"readFirst":["tooling-work","content-work","balance-work"]} -->
# Editable Data Policy

- Important design values belong in structured editable data and dedicated tools rather than scattered engine constants. [RULE:TOOL-DATA-001]
- Safe manual edit surfaces are authored data and documented override files; source imports are immutable and generated canonical data is regenerated output unless the change explicitly targets the import or validation pipeline. [RULE:TOOL-DATA-002]
- Editable data must stay human-readable, shallow, validated, and documented when fields control balance, visuals, or canonical traceability. [RULE:TOOL-DATA-003]
- Tool-first editing is the default for normal content and tuning changes; direct file edits are acceptable only when tool coverage is missing or implementation work is required. [RULE:TOOL-DATA-004]
- New editable domains must define schema coverage, validation, defaults or reset strategy, docs, ownership, and whether they edit authored overrides or canonical review state before they join the workflow. [RULE:TOOL-DATA-005]

## Current Editable Surfaces

Current editable surfaces are `content/authored/zones/*.json`, `content/authored/dialogues/*.json`, and `content/authored/battles/*.json`.

Canonical generated records are intentionally read-only in this phase. Changes to canonical facts happen through source snapshots, generator code, shared schemas, and review metadata rather than through studio save surfaces.
