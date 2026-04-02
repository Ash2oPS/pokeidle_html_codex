<!-- doc-meta: {"status":"normative","scope":["dependency-direction","module-ownership"],"readFirst":["new-systems","refactors"]} -->
# Dependency And Ownership

- `contracts` owns portable domain types, `content-schema` owns validation schemas, `content-data` owns typed registry and cross-reference validation, `game-core` owns simulation and save helpers, and apps own presentation and bootstrapping. [RULE:ARCH-OWNERSHIP-001]
- Dependency direction flows from apps into shared packages; gameplay packages must not import app-specific UI code. [RULE:ARCH-OWNERSHIP-002]
- New systems must declare their owning layer and allowed dependencies before implementation starts. [RULE:ARCH-OWNERSHIP-003]
- Shared schemas, helpers, and visual tokens belong in shared packages instead of being duplicated across apps. [RULE:ARCH-OWNERSHIP-004]
- Avoid monolithic or mixed-responsibility modules; keep files and modules intentionally scoped by domain. [RULE:ARCH-OWNERSHIP-005]