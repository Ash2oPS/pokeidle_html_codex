# Save System

## V1 Strategy

- local-only save
- IndexedDB as the primary store
- versioned save format from the first implementation
- export and import support for manual backups
- explicit reset action

## Write Policy

- keep the active state in memory
- mark the save dirty on important changes
- batch noisy updates
- flush immediately after critical progression events
- flush on visibility loss and page hide

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

