<!-- doc-meta: {"status":"normative","scope":["all-changes","ai-entrypoint"],"readFirst":["all-changes"]} -->
# AGENTS.md

This repository is a bilingual Pokemon-inspired idle web game set in Sinnoh.
Active normative docs are the source of truth for AI work. Archive docs are historical context only.

## Read First

- Read [docs/ai/README.md](./docs/ai/README.md) before any repo change. [RULE:AI-ENTRY-001]
- Read the relevant normative domain docs before changing gameplay, UI, save, content, tooling, or documentation. [RULE:AI-ENTRY-002]
- Do not use archive docs as the canonical source of truth; use them only to recover historical rationale. [RULE:AI-ENTRY-003]

## Repo Non-Negotiables

- Keep simulation, rendering, UI, platform, save, and content responsibilities separated; simulation remains the gameplay source of truth. [RULE:AI-ENTRY-004]
- Keep player-facing text bilingual, store text-bearing source files in UTF-8, preserve accents and special characters, and update the affected canonical docs plus rule tracking when active guidance changes. [RULE:AI-ENTRY-005]
