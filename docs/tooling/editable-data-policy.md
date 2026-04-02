<!-- doc-meta: {"status":"normative","scope":["editable-data","tooling-policy"],"readFirst":["tooling-work","content-work","balance-work"]} -->
# Editable Data Policy

- Important design values belong in structured editable data and dedicated tools rather than scattered engine constants. [RULE:TOOL-DATA-001]
- Safe manual edit surfaces are authored data and documented override files; source imports are immutable and generated outputs are regenerated artifacts unless the change explicitly targets the generator pipeline. [RULE:TOOL-DATA-002]
- Editable data must stay human-readable, shallow, validated, and documented when fields control balance or visuals. [RULE:TOOL-DATA-003]
- Tool-first editing is the default for normal content and tuning changes; direct file edits are acceptable only when tool coverage is missing or implementation work is required. [RULE:TOOL-DATA-004]
- New editable domains must define schema coverage, validation, defaults or reset strategy, docs, and ownership before they join the workflow. [RULE:TOOL-DATA-005]