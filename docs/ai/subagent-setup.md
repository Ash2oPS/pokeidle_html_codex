# Project Subagent Setup

This repo uses a fixed subagent roster for focused delegation.

## Goal

The goal is simple:

- keep cross-cutting ownership with the lead agent
- delegate isolated work to a specialist
- always separate implementation from validation when the task is risky

## Roster

- `ui-runtime-agent`
  - Owns runtime UI, layout, rendering, HUD, interaction polish, responsive behavior, and user-facing UI copy.
- `gameplay-core-agent`
  - Owns combat, encounter, progression, timing behavior, and pure gameplay logic.
- `design-data-agent`
  - Owns design config, sanitization, config facades, data-driven content, and map/Pokemon/item generation scripts.
- `platform-save-agent`
  - Owns save, lifecycle, background catch-up, storage, maintenance bootstrap, Electron, and Android shell concerns.
- `qa-validation-agent`
  - Owns test execution, screenshot review, targeted visual scenarios, background matrix checks, and residual-risk reporting.

## Lead Ownership

The lead agent keeps:

- `game-runtime.js`
- cross-cutting work that spans multiple domains
- final routing between agents
- final validation decisions
- guardrail compliance
- dead-code cleanup after a replacement flow

## Routing Rules

- UI/HUD/layout/copy:
  - `ui-runtime-agent`
  - then `qa-validation-agent`
- Combat, encounter, progression:
  - `gameplay-core-agent`
  - add `design-data-agent` if a global tuning value changes
- New design key, retune, compatibility facade, or data pipeline:
  - `design-data-agent`
- Save, lifecycle, background, Electron, Android, maintenance bootstrap:
  - `platform-save-agent`
  - then `qa-validation-agent`

## Working Limits

- Use at most `2` subagents on one task, plus the lead.
- If the task touches `game-runtime.js` and more than one domain, keep implementation with the lead.
- Do not create micro-agents for single features such as shop, pokedex, or notifications.
- Do not split Electron and Android into separate fixed agents unless the repo structure changes materially.

## Practical Pattern

Use this pattern by default:

1. specialist agent implements the isolated part
2. `qa-validation-agent` validates the risky surfaces
3. lead integrates, arbitrates, and closes the task
