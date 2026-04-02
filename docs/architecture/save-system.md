# Save System

## V1 Strategy

- local-only save
- IndexedDB as the primary store
- versioned save format from the first implementation
- export and import support for manual backups
- explicit reset action
- keep a small rotating local backup history in addition to the primary save

## Write Policy

- keep the active state in memory
- mark the save dirty on important changes
- batch noisy updates
- flush immediately after critical progression events
- flush on visibility loss and page hide
- expose a manual flush action for debugging and validation during development

## Critical Save Domains

- unlocked species
- per-species progress
- per-family capture mastery
- zone progression
- quests and flags
- currency and rewards
- per-species encounter, defeat, and capture counters

## Migration Rule

- every save shape change must be accompanied by a migration path
- migrations must be deterministic and testable

## Current V1 Foundation

- primary save manager lives in the runtime layer
- imported JSON save files are migrated through the same pipeline as loaded saves
- export format is inline minified JSON
- per-species encounter, defeat, and capture counters are part of the saved state
