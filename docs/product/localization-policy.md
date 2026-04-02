<!-- doc-meta: {"status":"normative","scope":["localization","player-facing-text"],"readFirst":["ui-changes","content-changes","dialogue-work"]} -->
# Localization Policy

- All player-facing text must support both English and French from the start. [RULE:LOC-001]
- English is the fallback locale, and French auto-selection may follow browser or device language detection in the runtime layer. [RULE:LOC-002]
- Single-language gameplay or UI text is forbidden in active player-facing flows; localized content belongs in localized data structures. [RULE:LOC-003]
- Text-bearing source files must stay UTF-8, preserve accents and special characters, and treat missing translations as validation debt with safe fallback to English. [RULE:LOC-004]