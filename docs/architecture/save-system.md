<!-- doc-meta: {"status":"normative","scope":["save-system","persistence"],"readFirst":["save-changes","migration-work","runtime-state-work"]} -->
# Save System

- V1 save is local-first with IndexedDB primary storage, manual export or import, reset support, and rotating local backups. [RULE:ARCH-SAVE-001]
- Keep active state in memory, batch noisy writes, and flush on critical progression events plus page-hide or visibility-risk moments. [RULE:ARCH-SAVE-002]
- Save data persists progression-critical domains including species or team state, quests, zones, flags, dialogue state, combat sessions, counters, and currency. [RULE:ARCH-SAVE-003]
- Every save shape change ships with deterministic migration logic and targeted tests. [RULE:ARCH-SAVE-004]
- Save data never stores renderer objects or UI-only state, and battle snapshots must keep the data required for deterministic reconstruction. [RULE:ARCH-SAVE-005]