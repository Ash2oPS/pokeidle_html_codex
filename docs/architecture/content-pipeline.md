<!-- doc-meta: {"status":"normative","scope":["content-pipeline","data-ownership"],"readFirst":["content-changes","generator-work","tooling-work"]} -->
# Content Pipeline

- `content/source` stores raw imported source payloads, `content/generated` stores normalized generated outputs, `content/authored` stores project-authored gameplay data, and runtime bundles store shipped production groupings. [RULE:ARCH-CONTENT-001]
- Canonical imported source data is never hand-edited; generated data changes through regeneration or explicitly documented pipeline work, and authored data owns project-specific tuning and references. [RULE:ARCH-CONTENT-002]
- Authored content must validate against shared schemas and cross-document references before exposure to apps. [RULE:ARCH-CONTENT-003]
- Consumers use the typed content registry instead of ad hoc direct JSON imports. [RULE:ARCH-CONTENT-004]
- New content domains require schema coverage, registry validation, docs, and ownership declarations before they join the workflow. [RULE:ARCH-CONTENT-005]

## Current Authoring Domains

The current registry covers world map, zones, dialogues, quests, battles, generated species data, and progression tuning.