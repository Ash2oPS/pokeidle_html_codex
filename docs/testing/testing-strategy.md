<!-- doc-meta: {"status":"normative","scope":["testing-strategy","quality-policy"],"readFirst":["test-planning","runtime-changes","ui-changes"]} -->
# Testing Strategy

- Prioritize tests that protect docs and architecture contracts, content validation, save or migration safety, deterministic combat, progression, responsive layout, and localization fallback. [RULE:TEST-001]
- Elapsed-time reconstruction coverage must include hidden tabs, minimized windows, device sleep, and long offline gaps. [RULE:TEST-002]
- Content validation must catch invalid links, missing localized strings, and broken quest, battle, dialogue, or species references. [RULE:TEST-003]
- Browser or Playwright checks are required only for complex, interactive, or visually risky UI changes; simple nonvisual changes do not require them. [RULE:TEST-004]