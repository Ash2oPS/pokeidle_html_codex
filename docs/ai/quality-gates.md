<!-- doc-meta: {"status":"normative","scope":["quality-gates","validation"],"readFirst":["all-changes","release-checks"]} -->
# Quality Gates

- Documentation changes do not pass review until `node scripts/validate-docs.mjs` succeeds. [RULE:AI-QUALITY-001]
- Save-model or runtime-state changes require deterministic tests for reconstruction, migrations, and affected progression behavior. [RULE:AI-QUALITY-002]
- Content or schema changes require schema validation plus cross-reference validation for authored data and registry exposure. [RULE:AI-QUALITY-003]
- UI changes require responsive and localization review, and browser or Playwright coverage only when the change is visually or interaction-wise risky. [RULE:AI-QUALITY-004]
- Broken active links, missing rule IDs, orphan normative docs, or active rules that exist only in archive placement are hard validation failures. [RULE:AI-QUALITY-005]