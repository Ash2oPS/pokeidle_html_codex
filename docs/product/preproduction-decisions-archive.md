<!-- doc-meta: {"status":"archive","scope":["historical-preproduction"],"readFirst":[]} -->
# Preproduction Decisions

This file consolidates the decisions made during preproduction.
It is a permanent source of truth for early project setup and system boundaries.

## Project Scope

- The project is a web game.
- The game genre is idle.
- The full project is intended to be built with AI assistance.
- The project must include strong documentation and rules from day one so future AI work stays constrained and consistent.
- The game concept is a Pokemon-inspired fan idle game.

## Core Game Fantasy Agreed So Far

- The player builds a team of up to six Pokemon-like units.
- A single enemy stands at the center of the battle scene.
- The player's team surrounds the enemy.
- The battle loop is built around repeated automatic attacks over time.
- Team composition and attack sequencing are core strategic levers.

## Pokemon Acquisition And Unlock Rules

- Capturing a Pokemon does not grant an owned individual unit instance in the traditional RPG sense.
- Capturing a Pokemon unlocks its species for team use.
- When a species is unlocked, it becomes available for team composition.
- Newly unlocked species always become available at level 1.

## Evolution Line Unlock Rules

- If the player captures an evolved Pokemon, the unlock granted is the stage-1 species of that evolution line.
- Example:
  - Capturing Alakazam unlocks Abra at level 1.
- Evolution unlocks work forward across the line:
  - when a Pokemon evolves, the evolved species becomes unlocked as a new usable species
  - that newly unlocked species starts at level 1

## Evolution Progression Direction

- Evolution acts partly like a reset or prestige layer for the unit line.
- A player can reinvest into the evolved species starting again from level 1.
- This reset is compensated by stronger long-term potential through:
  - better base stats
  - stronger species ranking or stat bonuses
  - often more interesting talent design after evolution

## Capture Reward Rules

- Capturing a Pokemon grants more experience to the current team than merely defeating that Pokemon.
- Captures are therefore a meaningful reward event beyond normal battle resolution.

## Capture Mastery Direction

- Repeated captures of the same species family should unlock family-based bonuses.
- Capture progression should consider at least the family or evolution-line grouping, not only one exact species form in isolation.
- Milestone thresholds can unlock permanent bonuses shared across the family.

## Capture Mastery Example Agreed So Far

- If the Pidgey family is captured 100 times total, Pidgey, Pidgeotto, and Pidgeot gain a 5% stat boost.
- If the same family is captured 1000 times total, they gain a 10% stat boost.
- If the same family is captured 10000 times total, they gain a 20% stat boost.

## Capture And Progression Architecture Implications

- The game must distinguish clearly between:
  - species unlock state
  - current level progression per unlocked species
  - evolution unlock state
  - family capture totals
  - permanent family mastery bonuses
- Capture events must integrate with:
  - experience rewards
  - species unlocks
  - family progression milestones
  - quest and progression hooks where relevant
- The data model must support evolution-line relationships as a first-class concept.

## Combat Loop Direction

- Combat is slot-based.
- The player has up to six team slots.
- Each slot acts in sequence.
- The sequence progresses slot A, then slot B, then slot C, and so on until the last slot, then loops back.
- At a fixed time interval, the next slot in sequence resolves its action window.
- If the slot contains a unit, that unit performs its attack.
- If the slot is empty, the action window still consumes time and no attack happens.
- Empty slots are therefore a real efficiency loss and part of the gameplay logic.

## Slot System Rules

- Slots are not only storage positions; they directly affect combat timing.
- Team ordering matters because attack order matters.
- Empty slots must still advance the sequence timer.
- The combat system must make slot waste visible and understandable to the player.
- Future balance and content systems should be designed with slot order as a meaningful axis.

## Typing Importance

- Unit typing is an important combat dimension.
- Damage dealt to the enemy must account for attack type interactions.
- Type relationships must be a first-class system, not a cosmetic tag.
- The combat system must support varying damage outcomes based on type logic.

## Synergy And Reaction System Direction

- The game should include attack synergies across consecutive slot actions.
- Previous attacks can apply temporary elemental states or tags to the enemy.
- A later attack can consume or react to those states.
- Reactions may increase or decrease damage depending on the combination.

## Example Reaction Rules Agreed So Far

- A water-type attack can apply a "wet" state to the enemy.
- If the next relevant attack is electric-type while the enemy is wet, that attack deals increased damage.
- If the next relevant attack is fire-type while the enemy is wet, that attack deals reduced damage.
- Reaction outcomes should depend on the sequence of attacks, not only on isolated unit stats.

## Gameplay Implications From Current Design

- Team order matters.
- Slot occupancy matters.
- Type composition matters.
- Reaction planning matters.
- Damage output is not only a function of raw stats, but also of sequence planning.

## Combat System Architecture Implications

- The simulation must track attack order explicitly.
- The simulation must track transient enemy states needed for reactions.
- Reaction resolution must be deterministic.
- The combat system should support a data-driven definition of types, modifiers, enemy states, and reactions.
- The UI should make attack order, empty-slot time loss, and reaction outcomes legible.

## Passive Talent System Requirement

- Each unit can have a talent.
- Talents are passive effects.
- Talents must be treated as first-class combat systems, not as ad hoc exceptions.
- The architecture must support talents that modify damage, targeting, attack participation, team auras, slot sequencing consequences, enemy generation flow, visual presentation, and unit identity.

## Talent System Examples Agreed So Far

- Helping Hand:
  - This unit deals 30% less damage.
  - The next unit in sequence deals 20% more damage.
  - The following unit after that deals 10% more damage.
- Loser:
  - This unit never attacks.
- Blaze:
  - This unit increases the fire-type attack damage of other team members by 10%.
  - Multiple instances stack if several units with Blaze are present on the field.
- Morphing:
  - This unit copies the appearance and stats of the previous unit.
- God of Time:
  - After defeating an enemy, the same enemy appears again.
  - The same enemy should therefore be fought twice in a row.
- Multi-Type:
  - This talent changes the enemy type.

## Talent Architecture Implications

- Talents cannot be implemented as one-off hardcoded if-statements scattered across combat code.
- The combat engine must support an extensible passive effect framework.
- Passive effects must hook into explicit simulation phases.
- Multiple passive effects must compose deterministically.
- Talent resolution order must be documented and stable.
- Talents may affect:
  - the acting unit
  - future slots in sequence
  - other team members
  - enemy state and enemy metadata
  - battle flow after victory
  - appearance and stat derivation

## Required Combat Hooks For Talents

- Team setup or battle start
- Slot turn start
- Before attack resolution
- Damage calculation
- After attack resolution
- Enemy defeat
- Enemy spawn or respawn
- Stat derivation and runtime identity resolution
- Rendering or presentation derivation where needed for appearance-copy effects

## Talent Categories To Support

- Self modifiers
- Ally aura modifiers
- Sequence-based support effects
- Attack suppression effects
- Copy or transform effects
- Enemy mutation effects
- Battle flow control effects

## Determinism Rules For Talents

- Talent effects must be deterministic and testable.
- If multiple talents affect the same calculation, stacking and priority rules must be explicit.
- Sequence-targeted effects must define exactly which later slots or attacks they modify.
- Effects that alter enemy generation or repetition must be handled in simulation state, not as UI tricks.
- Copy effects must define which properties are copied and when the copy snapshot is taken.

## Data-Driven Talent Direction

- Talents should be data-driven where possible in their configuration and metadata.
- The runtime should still own the execution primitives for complex behavior.
- The system should support a hybrid model:
  - shared generic passive behaviors expressed by structured data
  - explicit code handlers for advanced talents that cannot be described cleanly in pure data
- The architecture must not force every advanced talent into a brittle data-only format.

## Documentation Implications For Talents

- Permanent docs must define combat phases and available passive hooks.
- Permanent docs must define stacking, priority, and targeting rules for talents.
- Permanent docs must define what is safe to express as data versus what requires runtime code support.
- Permanent docs must define how to add new talents without breaking determinism.

## Zone Progression Requirement

- Game progression is organized through zones.
- Zones are a primary structure for progression, unlock flow, and content gating.
- The player advances by completing zones and unlocking adjacent or conditionally gated ones.

## Zone Completion Rules Agreed So Far

- A zone contains multiple enemy encounters or enemy defeats to achieve.
- A zone is marked as completed when the player defeats the required number of Pokemon in that zone.
- Zone completion also requires respecting a per-enemy timer condition.
- The completion rule is not only "defeat enough enemies" but "defeat enough enemies without exceeding the allowed timer per enemy."

## Zone Accessibility Rules

- When a zone is completed, neighboring zones can become accessible.
- Previously accessible or previously completed zones remain accessible.
- Progression is not strictly linear with forced loss of access to earlier zones.
- The player can go back to previous zones even if the current forward zone is not yet completed.

## Conditional Unlock Rules

- Some zones should require more than adjacency.
- Some zones become available only if:
  - the previous required zone is completed
  - an additional unlock condition in the game has been satisfied
- Unlock conditions are therefore a distinct system from simple adjacency progression.

## Zone System Architecture Implications

- The progression system must distinguish clearly between:
  - zone existence
  - zone visibility
  - zone accessibility
  - zone completion
  - zone-specific unlock requirements
- Completion state and unlock state must be persisted in save data.
- Zone graph relationships should be data-driven.
- Unlock conditions should be data-driven where possible.
- The system must support both simple adjacency unlocks and compound unlock rules.

## Zone Data Requirements

- Each zone should define:
  - its identity
  - its neighbors or graph links
  - its completion condition
  - its enemy or encounter pool
  - its timer rules
  - its unlock conditions if any
- The data model must support zones that are:
  - always available after adjacency unlock
  - conditionally available after extra requirements
  - still revisit-able after later progression

## Zone UX Requirements

- The player must understand:
  - which zone is current
  - which zones are accessible now
  - which zones are completed
  - which zones are locked
  - why a locked zone is still locked
- Conditional locks should expose readable unlock reasons in the UI.
- Returning to earlier zones must be simple and obvious.

## Zone Design Implications

- The game should support both broad map progression and gated branches.
- Optional or special zones can be introduced naturally through conditional unlocks.
- The progression system must allow backtracking without breaking the main flow.
- Zone design should remain compatible with a data-driven content pipeline.

## Zone Type Requirement

- Most zones are combat zones built around the idle battle loop.
- Some zones are pacifist zones.
- Pacifist zones are often towns or similar safe places.
- Pacifist zones can contain NPC interaction and other non-combat activities.

## Zone Type Rules

- Zone behavior must depend on zone type.
- Combat zones and pacifist zones must share a common zone framework while supporting different gameplay modules.
- A zone must not be assumed to always contain combat.
- The progression system must support both combat-driven completion and non-combat unlock interactions.

## Pacifist Zone Requirements

- Pacifist zones can include NPC dialogue and interaction.
- Pacifist zones may contain unlock triggers, progression flags, shop-like interactions, or future social/service features.
- Pacifist zones should support scripted interactions without being treated as combat maps.
- The architecture must allow a zone to exist without enemy encounter flow.

## Zone Architecture Implications

- The zone system must support typed zones, at minimum:
  - combat
  - pacifist
- Shared zone data should cover identity, graph links, unlock logic, and presentation metadata.
- Zone-type-specific modules should define:
  - combat rules and encounter configuration for combat zones
  - NPCs, dialogue, interactions, and services for pacifist zones
- Completion logic must be flexible enough to support different success criteria depending on zone type.

## NPC And Interaction Implications

- NPC interactions should be treated as structured gameplay content, not as hardcoded one-off scenes.
- Dialogue, interaction choices, rewards, and unlock flags should be compatible with the data-driven content pipeline.
- Pacifist zones may be responsible for unlocking other zones or systems through interaction outcomes.

## UX Implications For Zone Types

- The UI must make it obvious whether a zone is combat-focused or pacifist.
- The player should understand what can be done in a pacifist zone before entering or while viewing it.
- If a pacifist zone contains important unlocks, the player should receive clear feedback after interacting with the relevant NPC or feature.

## Quest System Requirement

- The game must include a quest system.
- Quests are an important progression and reward structure.
- The system must support at least main quests and side quests.

## Quest Categories Agreed So Far

- Main quests:
  - Main quests drive story progression.
  - Main quests can be required for forward progression in the game.
- Side quests:
  - Side quests are optional.
  - Side quests primarily provide rewards.

## Quest Architecture Implications

- The quest system must be a first-class gameplay system, not only UI tracking text.
- Quest progress must integrate with:
  - zones
  - NPC interactions
  - combat outcomes
  - unlock flags
  - rewards
- Quest state must be saved persistently.

## Quest State Requirements

- The system must track quest availability.
- The system must track quest acceptance or activation state where relevant.
- The system must track quest progress.
- The system must track quest completion state.
- The system must track claimed or granted rewards where needed.

## Quest Data-Driven Direction

- Quest definitions should be data-driven.
- Quest structure should support:
  - identity
  - category
  - prerequisites
  - objectives
  - rewards
  - dialogue or presentation metadata where needed
- Quest prerequisites and completion conditions should integrate with the game's flag and progression systems.

## Quest Objective Requirements

- Quest objectives must be flexible enough to support:
  - defeating enemies
  - completing zones
  - speaking to NPCs
  - triggering specific unlock conditions
  - future non-combat progression tasks
- Main and side quests should use the same core framework, with different content and progression importance.

## Quest UX Requirements

- The player must clearly understand:
  - which quests are main quests
  - which quests are side quests
  - current objectives
  - completion status
  - received or pending rewards
- Main quest presentation should clearly signal story progression importance.
- Side quest presentation should clearly signal optional reward-driven content.

## Progression Implications For Quests

- Main quests may be used as part of progression gating.
- Side quests should enrich progression and rewards without blocking the main path by default.
- The architecture must support quests as unlock conditions for zones, NPC states, and systems.

## Zone Event Requirement

- Some zones must support unique or semi-unique events.
- These events can alter normal zone behavior.
- Event-heavy zones are an expected part of the content design.

## Zone Event Examples Agreed So Far

- A specific zone can use a custom enemy spawn pattern instead of the default flow.
- A specific zone can contain a boss encounter.
- A zone event can override the standard progression or pacing rules of that zone.

## Zone Event Architecture Implications

- The zone system must support per-zone event logic without forcing all zones into bespoke hardcoded implementations.
- Standard zone behavior and event-driven overrides must coexist cleanly.
- Zone events should be attachable to zones as explicit content definitions.
- Event logic should be able to influence:
  - enemy spawn behavior
  - encounter sequencing
  - boss presence
  - timing rules
  - rewards
  - unlock flags
  - quest progression

## Zone Event Design Direction

- Common event patterns should be represented in data where possible.
- Advanced or unique event behavior may require explicit runtime handlers.
- The system should support a hybrid model:
  - generic event templates or configuration for common cases
  - code-backed event handlers for unique special cases
- Zone events must not degrade the overall architecture into uncontrolled one-off scripts.

## Boss Support Requirement

- The combat and zone systems must support boss encounters as a first-class concept.
- Boss encounters may require custom spawn rules, custom presentation, custom rewards, or special progression behavior.
- Boss support should not be bolted on as a late exception.

## Event UX Requirements

- The player should be able to recognize when a zone contains a special event or boss condition.
- Event-specific behavior should be communicated clearly enough to avoid confusion.
- Unique event outcomes such as new unlocks or quest updates should provide visible feedback.

## Trainer Battle Requirement

- The game must support trainer battles.
- Trainer battles are distinct from standard wild or normal zone combat flow.
- Trainer battles can be important progression gates and unlock triggers.

## Trainer Battle Rules Agreed So Far

- Trainer battles are timed battles.
- Trainer battles can impose entry constraints on the player's team.
- Trainer battles can impose combat modifiers or maluses during the fight.
- Trainer battles may be used to unlock zones or trigger other progression outcomes.

## Example Trainer Battle Constraints Agreed So Far

- The player may be required to use only a limited number of Pokemon in the team.
- Enemy actions can temporarily prevent one of the player's Pokemon from attacking.
- Enemy actions can slow the interval between the player's attacks.

## Trainer Battle Architecture Implications

- Trainer battles must be treated as a first-class combat mode.
- The combat system must support battle-level rulesets and modifiers.
- The battle system must support temporary debuffs applied to the player's side.
- Team validation must support pre-battle participation constraints.
- Trainer battle outcomes must integrate with progression, zone unlocks, quests, and flags.

## Required Support For Trainer Battles

- Battle-specific timer rules
- Entry requirements and roster validation
- Enemy-side disruptive effects
- Temporary attack lock effects on player units
- Temporary speed or interval modification effects
- Battle-specific reward and unlock handling
- Clear failure and success conditions

## Combat Framework Implications From Trainer Battles

- The combat engine must not assume only one passive enemy target with no agency.
- The system must support enemy-originated effects that alter the player's combat rhythm.
- Combat rules should be configurable per battle instance.
- The engine should support multiple battle archetypes without duplicating the entire combat framework.

## Data-Driven Direction For Trainer Battles

- Trainer battle definitions should be data-driven where possible.
- A trainer battle should be able to define:
  - identity
  - participating enemy team or trainer profile
  - timer rules
  - entry constraints
  - special modifiers
  - rewards
  - unlock outcomes
- Advanced trainer-specific mechanics may still require explicit runtime handlers.

## UX Requirements For Trainer Battles

- The player must understand the battle constraints before starting.
- The player must understand the active maluses during the fight.
- The player must understand the timer pressure and failure condition.
- Unlocks or progression triggered by trainer battle victory should be visible and explicit.

## Gym Battle Requirement

- Some trainer battles are gym battles.
- Gym battles can be located in pacifist zones such as towns.
- Gym battles should be treated as an important progression format.

## Gym Battle Implications

- A pacifist zone may contain access points to combat sub-content such as a gym.
- Zone type and available activities must therefore remain separate concepts.
- Towns and other pacifist zones can host trainer battle entry points without becoming normal combat zones themselves.
- Gym battles may act as major progression gates, unlock triggers, or milestone encounters.

## Gym Battle Progression Rules

- Gym battles are required for story progression.
- Initial gym battles are unique progression encounters.
- After completing them for progression purposes, gym battles can later be replayed in much higher-level versions.
- High-level rematch gym battles are optional and reward-focused.

## Architecture Implications For Gym Battles

- The zone and location systems must support embedded activities inside pacifist zones.
- The game must support entering a battle flow from a non-combat location context.
- Progression, quest, and unlock systems must be able to reference gym battle outcomes.
- Gym battles should reuse the trainer battle framework rather than creating a separate incompatible combat system.

## Fidelity Direction

- The project should remain very close to Pokemon source material in overall feel.
- The game takes place in Sinnoh.
- The project can take liberties with story structure and progression structure.
- Canon base stats should be sourced externally and used as the reference basis.
- The game is allowed to reinterpret how those stats are mapped into idle gameplay formulas.
- Runtime stat values should scale very heavily across long-term progression.
- The project should stay recognizably close to the original material while adapting its systems to idle progression needs.

## Core Runtime Constraints

- The game must feel real-time even when the browser tab is inactive, the browser window is minimized, or the device is locked.
- The implementation must not rely on background timers continuing to run continuously.
- The correct model is timestamp-based progression reconstruction.
- The game simulation must resume from real elapsed time when the app becomes active again.
- The game must work on desktop and smartphone.
- Smartphone support is a first-class requirement, not a later adaptation.
- Portrait mode on smartphone is mandatory.

## Time Model Decision

- Real gameplay progression must be based on absolute timestamps and elapsed real time.
- The game must not depend on a continuously running loop while hidden or minimized.
- The game must save state plus timing data needed to reconstruct progression after inactivity.
- The simulation must be able to apply long elapsed durations safely and deterministically.
- The simulation must never depend on rendering frequency or frame rate.

## Reliability Position

- Timestamp-based progression is the correct foundation for an idle web game.
- This model is reliable for player experience.
- This model is not a guarantee of continuous hidden execution.
- This model alone is not anti-cheat protection.
- If anti-cheat or authoritative multi-device sync becomes important, a backend time authority will be required.

## Simulation Architecture Rules

- Simulation and rendering must be strictly separated.
- Simulation must be the source of truth.
- Rendering and UI must only present simulation state.
- Save data must contain only serializable gameplay state, not renderer objects.
- Important gameplay logic must never be driven by `requestAnimationFrame`, FPS, or visual update cadence.
- Systems that can be solved analytically from elapsed time should use direct formulas instead of step-by-step replay.
- Systems that require stepping must use controlled coarse simulation steps, not frame-by-frame replay for long offline durations.
- Large elapsed durations must be explicitly handled and tested.
- Offline progression may be capped or otherwise constrained if required by game balance.

## Save System Rules

- Save data must be versioned from the start.
- Save data must include timestamps required for progression reconstruction.
- Save frequency must be high enough to make resume behavior robust.
- Resume after inactivity must be treated as a core feature, not an edge case.
- The save format must be designed for migrations.

## Platform Behavior Rules

- The game must remain playable and coherent across:
  - active desktop tab
  - inactive desktop tab
  - minimized desktop window
  - smartphone foreground
  - smartphone app/browser background return
  - device sleep or lock followed by resume
- The architecture must assume browser throttling and suspension will happen.

## UI Architecture Decision

- UI will use HTML and CSS as the default surface.
- The project should prefer a DOM-first UI for HUD, menus, settings, text, buttons, and responsive layout.
- The gameplay world and game visuals may use a dedicated 2D render surface if needed.
- World-anchored UI is allowed and expected.

## World UI Decision

- World UI should not default to being drawn inside the gameplay render layer.
- The preferred approach is a hybrid model:
  - gameplay world rendered separately
  - HTML overlay rendered above it
  - world-related UI positioned from gameplay coordinates projected into screen coordinates
- Each world UI element should be positioned from a world-to-screen mapping owned by the renderer or camera system.
- This keeps responsive layout, text clarity, accessibility, and mobile adaptation easier than canvas-only UI.
- If a specific feature later requires very high counts of moving labels or markers, that feature can be evaluated for canvas rendering separately.
- The default assumption remains DOM overlay for world-linked UI unless performance proves otherwise.

## Responsive UI Rules

- The UI must adapt to all screen resolutions used by desktop and smartphones.
- The UI must adapt to portrait smartphone layouts.
- The UI must adapt to different aspect ratios, not only viewport width.
- Layout behavior must account for orientation, safe areas, and dense versus wide screens.
- The same gameplay information must stay readable and accessible on both desktop and mobile.
- Responsive behavior must be an explicit architecture concern from the beginning.

## Platform Layout Mode Requirement

- The game must distinguish between desktop-style landscape usage and smartphone-style portrait usage.
- This distinction must be treated as an application layout and interaction mode, not as a naive user-agent guess.
- The runtime should determine the active mode from reliable signals such as viewport size, aspect ratio, orientation, and input capabilities.
- The game must react correctly when the active mode changes during runtime.

## Platform Layout Mode Rules

- Do not rely primarily on user-agent sniffing for layout decisions.
- Prefer explicit runtime classification of the current presentation mode.
- Desktop landscape mode and smartphone portrait mode must be first-class supported states.
- Layout mode changes must update UI composition, interaction affordances, and sizing rules.
- The game should be able to re-evaluate mode on resize, orientation change, and relevant platform changes.
- Edge cases such as tablets, foldables, resized desktop windows, and touch-enabled laptops must be handled by mode rules rather than simplistic device labels.

## Technical Direction Agreed So Far

- Use a headless simulation core in TypeScript.
- Keep simulation independent from the chosen rendering layer.
- Keep UI independent from simulation internals and driven by derived state.
- Use timestamp-based progression reconstruction as a non-negotiable rule.
- Use DOM-based UI as the default strategy.
- Use a hybrid approach for world-linked UI.

## Codebase Architecture Decision

- The project must not contain a giant TypeScript file that runs the whole game.
- The codebase must be modular, layered, and scalable from the start.
- Architecture must favor small focused modules over large mixed-responsibility files.
- The bootstrap layer must stay thin.
- Gameplay rules, rendering, UI, persistence, and content loading must live in separate areas.
- Each gameplay domain should have its own module boundary.
- Modules must expose clear public interfaces and avoid hidden coupling.
- Dependency direction must stay controlled and explicit.
- Shared utilities must stay minimal and generic.
- New features must be addable without rewriting the existing architecture.

## Suggested Layer Boundaries

- App shell and bootstrap
- Simulation core
- Gameplay feature modules
- Save and persistence layer
- Content and tuning data layer
- Rendering layer
- UI layer
- Platform and browser integration layer
- Shared contracts and utilities

## Module Rules

- Simulation modules must not import UI code.
- Simulation modules must not import renderer code.
- UI components must consume derived state, not own gameplay truth.
- Renderer code must not become the owner of game rules.
- Persistence code must serialize simulation state only.
- Content definitions must be loaded through explicit adapters and validators.
- Cross-module communication must use explicit contracts, not random direct access.
- Each domain module should stay understandable in isolation.

## Scalability Rules

- The architecture must support adding many gameplay systems without turning into a dependency mess.
- Feature modules should be composable and testable independently.
- The project must support progressive growth in:
  - content volume
  - system count
  - UI complexity
  - balancing complexity
  - save migrations
- Rules for ownership and dependency direction must be documented early so future AI-generated code does not erode architecture quality.

## Editable Game Design Decision

- Game design values must not be hardcoded throughout the TypeScript codebase.
- Core balance data must be editable without web-specific expertise.
- The project must separate runtime code from editable design data.
- The editable data format must be simple, explicit, and stable over time.
- The user must be able to change values safely without needing to understand internal engine code.
- Important game design values must be edited through dedicated tools as the normal workflow.

## Editable Data Strategy

- Use external data files for tunable game design values.
- Keep editable data designer-friendly and human-readable.
- Prefer stable domain-based files over one giant settings blob.
- Values such as metrics, progression numbers, economy values, unlock thresholds, pacing values, colors, UI sizing tokens, and other tuning constants should live in editable data files.
- Runtime code must load those files through adapters, defaults, and sanitizers.
- Invalid data must fall back safely instead of breaking the game.
- Editable data must be documented so the meaning of each field is obvious.
- Tooling must be the intended editing surface for important design values.

## Editable Data Shape Rules

- Keep nesting shallow unless grouping is genuinely useful.
- Prefer explicit field names over compact but unclear schemas.
- Separate domains clearly, for example:
  - gameplay
  - economy
  - progression
  - combat
  - visuals
  - ui
  - audio
- Keep a mirrored default section or equivalent reset strategy from the beginning.
- Add tooltip or field-description metadata so editable values remain understandable.
- Support schema validation and sanitization at load time.
- Avoid exposing internal runtime-only structures directly to editable files.

## Ownership Model for Manual Tuning

- AI should build and maintain the code architecture.
- Balance and presentation tuning by the user must happen primarily through dedicated tools.
- The user should be able to tweak core values without touching gameplay engine internals.
- The user should be able to tweak visual tokens such as colors and selected UI constants without hunting through component code.
- The project should favor a data-driven workflow wherever manual iteration is likely.

## Documentation Needed For Editable Data

- A permanent document must explain where editable values live.
- A permanent document must explain which files are safe for manual tuning.
- A permanent document must explain which values are runtime-owned and should not be hand-edited casually.
- Field-level meaning should be documented for important balancing and visual settings.

## Content Tooling Requirement

- The project must eventually include dedicated tools for editing and adding game content efficiently.
- These tools must be designed for good UX, not as raw internal debug panels only.
- The tools must help the user create and modify content without needing to manually navigate low-level code structures.
- Content tooling must be planned from the beginning so runtime data formats stay compatible with future editors.

## Content Tooling Strategy

- Runtime content data and editor-facing content data should share stable schemas and validation rules.
- The content tools should edit structured data, not handwritten TypeScript.
- The tooling should be able to cover both:
  - tool-first editing for normal changes
  - richer editor UX for larger content operations
- Editor tools should be local-first and integrated into the project workflow.
- The safest long-term direction is a dedicated internal content editor backed by the same schemas, validators, and adapters as the game runtime.

## Content Tooling UX Principles

- The user must be able to add content without understanding code internals.
- Forms should use explicit labels, help text, defaults, and validation feedback.
- Relationships between content entries must be visible and easy to edit.
- The editor should prevent invalid references and obviously broken values.
- Preview and simulation support should exist wherever useful.
- Bulk editing support should exist for repetitive balancing work.
- Import and export flows should stay simple and reversible.
- The tool must feel faster and safer than raw file editing for design work.

## Recommended Content Tool Capabilities

- Content list and search
- Create, duplicate, archive, and delete content entries
- Structured forms with validation
- Field descriptions and tooltips
- Reference pickers for linked content
- Live preview where relevant
- Safe defaults for new entries
- Bulk edit operations
- Change diff visibility before save
- Schema version awareness
- Dedicated balance views for metrics and progression values
- Visual token editing for colors and selected UI constants
- Simulation or projection views for economy and pacing changes

## Recommended Technical Direction For Content Tools

- Start with editable structured data files as the source of truth.
- Add validators and sanitizers before building editor UX.
- Later build an internal web-based content editor that reads and writes those same files.
- Keep the editor and runtime aligned through shared schemas and domain adapters.
- For critical game design values, the editor should be the intended editing path.
- Direct file editing may still exist as an implementation detail, but it should not be the normal balancing workflow.

## Tooling Product Shape Decision

- The project should not rely on many disconnected standalone tools as the main workflow.
- The recommended direction is one internal editing studio with multiple specialized modules inside it.
- The user experience should feel like one coherent product, not a pile of unrelated utilities.
- Shared concerns such as navigation, validation, diff review, save flow, preview, and search should be centralized.
- Specialized editing surfaces should still exist for different domains, but inside the same tool ecosystem.

## Recommended Tooling Structure

- One main internal web tool for content and design operations
- Multiple domain screens or modules inside that tool, for example:
  - balance
  - progression
  - content definitions
  - rewards
  - visual tokens
  - live preview
- Optional supporting CLI utilities for imports, exports, validation, migration, and batch processing

## Tooling UX Rule

- The normal workflow should be one main entry point.
- Domain-specific complexity should be handled by dedicated screens inside the tool, not by forcing the user to switch between many separate apps.
- Separate standalone tools should be created only when the workflow is truly different enough to justify the split.

## Local Development Workflow Decision

- Local development must make it easy to run the game and the internal tool independently or together.
- The recommended developer experience is one monorepo with shared packages and two main apps:
  - the game
  - the internal tool studio
- Both apps should be launchable with simple root-level commands.
- The normal workflow should not require manual multi-step startup rituals.

## Recommended Local Run Strategy

- Use one workspace-based repository.
- Expose root commands for:
  - running only the game
  - running only the tool
  - running both at once
- Prefer one modern local web dev server per app with fast reload.
- Shared packages should rebuild or reload automatically during development.
- The tool and the game should be able to run side by side during iteration.

## Recommended Developer Entry Points

- One root command for full local development
- One command for game-only work
- One command for tool-only work
- One command for validation checks

## Local UX Goals

- Starting local development should be fast and obvious.
- The user should not need to remember complex commands.
- The workflow should support quick iteration between gameplay changes and tool changes.
- The local setup should support using the tool while observing the game behavior at the same time.
- Human developer UX must be treated as a real product concern from the start.

## Hosting Strategy Direction

- The initial production hosting target should support free static deployment.
- The recommended first hosting path is a static hosting platform suitable for a client-side web game.
- The hosting choice must be compatible with a game that ships significant static data and assets.
- The initial hosting choice must not assume a paid backend.

## Hosting Recommendation

- Prefer a static-first hosting platform for the initial version of the game.
- GitHub Pages is acceptable for a small prototype or simple public demo.
- Cloudflare Pages is the recommended primary candidate for the real project if the game remains static-first with local save data.
- If the project later needs cloud saves, authoritative time, or anti-cheat-sensitive backend features, the architecture should be able to evolve toward additional backend services without rewriting the whole deployment model.

## Tool Hosting Direction

- The internal tool should be treated separately from the public game deployment.
- The normal early workflow should keep the tool local during development.
- The public game can be deployed independently from the internal tool.
- If the tool is later deployed remotely, it should be a separate app deployment with its own access strategy.

## Version Control Decision

- GitHub should be the primary version control platform for the project.
- Hosting choice should remain decoupled from version control choice.
- Using GitHub for source control does not require using GitHub Pages for production hosting.
- The deployment flow should be compatible with GitHub-based collaboration and version history.

## Deployment Packaging Rule

- The project may contain many small source content files in the repository.
- The deployed game should not necessarily ship those source files one by one.
- The build pipeline should be allowed to transform source content into fewer production bundles or grouped data artifacts.
- Authoring format and shipped format should be treated as separate concerns.
- This is important for deployment limits, runtime request efficiency, and repository hygiene.

## Small File Strategy

- Source content may remain split into many domain-friendly files for authoring and tooling.
- Production output should favor reduced file counts and predictable loading.
- Avoid shipping thousands of tiny runtime requests when the same content can be grouped safely.
- Hosting constraints must be evaluated against the built output, not only against the source tree.

## Save And Hosting Separation Rule

- Hosting choice and save architecture must be treated as separate concerns.
- A static host is compatible with local save systems.
- A static host alone does not provide authoritative server-side save functionality.
- If save data becomes cloud-backed later, that should be introduced as a separate backend concern rather than being confused with static frontend hosting.

## Codex Local Environment Requirement

- The project setup must include workspace-local Codex environment actions.
- The environment file should expose the main developer workflows as clear action buttons.
- These actions must be short, readable, and aligned with the real local entry points of the repository.
- The setup should avoid long fragile commands when a wrapper script would make the UX clearer.

## Expected Codex Actions

- Run game development server
- Run tool development server
- Run both game and tool together
- Run validation checks
- Optionally run build and preview flows later if they become relevant

## Human Developer Experience Direction

- The user should be able to launch the most common workflows from obvious project actions instead of remembering shell commands.
- Content iteration must be easy for a human developer who is not primarily a web specialist.
- The project should optimize for fast access to:
  - game preview
  - tool studio
  - validation checks
  - content editing workflows

## Ultra Data-Driven Direction

- The project should be strongly data-driven by design.
- Adding content and changing balance should be easy and should not require touching core engine code in normal cases.
- Runtime systems should consume structured content definitions rather than hardcoded per-feature values.
- The architecture should make content growth cheap and safe.
- For important design values, tool-based editing should be the default operational workflow.

## What Should Be Data-Driven

- Economy values
- Progression tables
- Unlock requirements
- Rewards
- Enemy or unit definitions
- Item definitions
- Skill or ability definitions where applicable
- Encounter and drop configuration where applicable
- UI visual tokens
- Color tokens
- Text content and localization-ready strings
- Tutorial and onboarding content where applicable
- Feature tuning constants that are likely to change during iteration

## What Should Stay Code-Driven

- Core simulation engine behavior
- Time reconstruction logic
- Save and migration mechanics
- Rendering internals
- Platform integration
- Validation and sanitization logic
- Shared systems that define how content is interpreted

## Data-Driven Guardrail

- The project should be highly data-driven, but it must not become a fragile custom scripting language too early.
- Data should describe content, tuning, composition, and configuration.
- Code should own execution primitives, system rules, and safety guarantees.
- If behavior becomes too dynamic to express cleanly in structured data, it should remain in code behind explicit hooks.

## Consolidated Gameplay Answers From Design Discussion

- The primary way to obtain player units is capture.
- Some player units can also be obtained through rewards or purchases.
- When an enemy is defeated, the next enemy appears immediately.
- Each combat zone has its own enemy pool.
- Zone enemy pools must be editable in the internal tool.
- Defeating enemies grants experience to the player's units.
- Unit experience can lead to level-up progression.
- Defeating enemies can trigger capture attempts.
- Defeating each enemy grants money (Pokedollars).
- Capture outcomes are important and require additional design specification later.

## Consolidated Zone Timer And Failure Rules

- In normal combat zones, the timer is shared across the whole zone for standard enemies.
- Boss fights can use different timer values from the standard zone timer.
- If the player exceeds the timer on a normal zone enemy:
  - the zone defeat counter resets
  - the enemy flees
- If the player exceeds the timer in a trainer battle:
  - the battle is lost

## Consolidated Attack And Type Rules

- Each player unit has exactly one automatic attack.
- That attack uses the unit's offensive type.
- Player units still keep one or two defensive types as species traits.
- Enemy units use their true defensive typing.
- A player unit has one offensive type at a time.
- By default, the offensive type is the first defensive type of the species.
- If a species has two defensive types and the first is Normal, the default offensive type becomes the second defensive type.
- If a species has two defensive types, the offensive type can be switched between those two defensive types.
- Some talents may allow exceptions to the normal offensive type rule.

## Consolidated Stat Direction

- Enemy combat-relevant stats currently identified:
  - HP
  - Defense
  - Special Defense
- Player attacking-unit combat-relevant stats currently identified:
  - Attack
  - Special Attack
- The current design direction is asymmetrical:
  - player team focuses on offensive stats
  - enemies focus on durability stats

## Consolidated Talent Ownership Rules

- Talents are fixed at species level.
- The player does not choose a talent.
- A unit can have at most one talent.

## Consolidated City And Progression Direction

- Early town functionality should include:
  - NPC dialogue
  - gyms
  - quests
  - team management
- Main quests focus primarily on game progression such as story and zones.
- Main quests can also unlock items, systems, or other important content.

## Consolidated Cosmetic And Species Rank Direction

- The game should include shiny variants with a target rarity of 1 in 4096.
- The game should include ultra shiny variants with a target rarity of 1 in 8192.
- The game should include cosmetic skins obtainable via gacha.
- Shiny, ultra shiny, and skins are cosmetic only.
- Species can also have balance ranks.
- Species rank affects stats.
- Example direction:
  - Charizard can be rank B
  - rank B gives +40% to all stats

## Consolidated Navigation And Save Direction

- The game should provide a simple always-available interface for navigating among neighboring zones.
- The game should also provide a map menu that allows travel to any unlocked zone.
- Version 1 save strategy is local-only.

## Confirmed Early Vertical Slice Direction

- A valid first vertical slice can be roughly:
  - 1 combat zone
  - 1 town
  - 1 main quest
  - 1 gym battle
  - around 10 Pokemon species
  - around 5 talents

## Documentation Strategy Agreed So Far

- The project will contain many Markdown documents to constrain future AI work.
- Documentation must be present at the start of the project, not added later.
- Permanent docs should be created during project setup based on this temporary file.
- This temporary file must then be removed.

## Expected Permanent Documentation Areas

- Product pillars
- Simulation architecture
- Save system and migration rules
- Responsive UI rules
- AI coding rules and repository constraints
- Testing rules for time progression and resume behavior
- Data and content schema rules

## Vertical Slice V1 Agreed So Far

- The first playable vertical slice should include:
  - 2 combat zones
  - 2 towns
  - progression order of:
    - town 1
    - combat zone 1
    - combat zone 2
    - town 2
  - town 2 contains a gym battle
  - 2 main quests in sequence
  - 1 side quest
- Pokemon included in zones will be managed through the internal tool.
- By default, Pokemon do not all need talents in V1.
- Talents will be introduced progressively rather than requiring broad full coverage immediately.

## Tool V1 Scope Agreed So Far

- Tool V1 should include:
  - zone editor
  - Pokemon viewer
  - dialogue editor

## Zone Editor Requirements For Tool V1

- The zone editor must support:
  - linking zones together
  - editing zone settings
  - selecting which Pokemon can appear in the zone
  - configuring enemy timer values
  - configuring how many Pokemon must be defeated for completion

## Pokemon Viewer Requirements For Tool V1

- The Pokemon viewer must support:
  - reading Pokemon data
  - viewing sprites
  - viewing base stats
  - simulating derived runtime stats by level

## Dialogue Editor Requirements For Tool V1

- Tool V1 must support editing dialogue content.
- Dialogue editing is required early because towns, NPCs, and quest progression already exist in the first vertical slice.

## Save Strategy Agreed So Far

- Save data is local-only in V1.
- Cloud save is out of scope for V1.

## Save Strategy Recommendation

- IndexedDB should be the primary save storage for V1.
- Save data should be versioned from the first implementation.
- The project should support migration logic from the first save version onward.
- The project should include manual save export and import support, even in local-only mode.
- The project should include a clear reset save action.
- Save files used for export should be human-inspectable JSON where possible.
- Save writes should not happen blindly on every tiny state mutation.
- The runtime should use a dirty-state or queued-save strategy.
- Critical progression events should trigger immediate save scheduling.
- High-frequency stat changes should be batched or debounced into grouped save writes.
- Visibility loss, page hide, and other exit-risk moments should trigger an immediate flush attempt.
- Frequent backup of important progress is required, but write policy should remain efficient and robust.

## World Map UX Direction

- The world map should use a light stylized map presentation.
- The world map does not need to be a heavy simulation surface.
- The map should communicate progression, adjacency, accessibility, and important locations clearly.

## Pokemon Data Source Direction

- Pokemon species data should be sourced through scripts using PokeAPI requests.
- Canon Pokemon data acquisition should be separated from game-specific interpretation and balancing.
- The pipeline should distinguish between:
  - imported canonical source data
  - generated normalized internal data
  - project-specific gameplay overrides

## Localization Requirement

- All game text must exist in both English and French.
- English is the default language.
- If the device language is French, the game should switch to French automatically.
- The project must support localization from the start rather than treating it as a late UI concern.

## Localization Rules

- User-facing text must not be hardcoded in one language only.
- The runtime must detect preferred language on startup.
- French should be selected automatically when the device or browser language resolves to French.
- English remains the fallback language.
- The player should be able to switch language manually later if needed, even if automatic detection exists.

## Localization Architecture Implications

- Dialogue, quests, UI labels, zone names, talent names, and other player-facing content must be localization-ready.
- Content and tooling schemas must support localized text fields.
- The tool should eventually support editing both English and French text variants.
- Missing translations should fall back safely to English.

## Game UI Direction

- The game UI must be compact.
- The UI must be colorful, simple, and efficient.
- The visual direction should feel flat and strongly Pokemon-inspired.
- The UI must avoid unnecessary text.
- Every visible label must justify the space it consumes.
- Information density should be high without becoming cluttered.

## Game UI Layout Rules

- The game should use simple HUD surfaces for always-visible gameplay information.
- Larger focus interfaces should exist for deep interactions such as the Pokedex.
- Focus interfaces should reuse the same visual language while feeling like deliberate full windows.
- A desktop-oriented focus interface can imitate a PC window style where appropriate.
- The UI system must support both compact HUD views and richer focus views without visual inconsistency.
- Large complete-menu interfaces should explicitly emulate PC window aesthetics.
- This PC-window-inspired look should apply to major focus interfaces such as the Pokedex and similar full-detail views.

## Game UI Responsiveness Rules

- The interface must be meticulously adapted to desktop landscape layout.
- A dedicated alternative layout must exist for smartphone portrait mode.
- The UI must remain fully responsive and polished across both modes.
- Responsive behavior must preserve compactness and scanning speed.
- UI composition should not simply shrink desktop panels on mobile; it should reorganize intentionally.

## Game UI Content Rules

- Avoid filler copy and redundant explanations in interface chrome.
- Prefer icons, visual grouping, hierarchy, and state cues before extra text.
- Short labels are preferred over verbose labels.
- Repeated data should not be restated in multiple places.
- Text-heavy explanations should live in focus views or optional detail layers, not in core HUD space.

## Game UI Style Rules

- Use a restrained flat style rather than noisy decorative effects.
- Prefer clean shapes, strong spacing discipline, and readable color coding.
- Avoid bloated panels, excessive borders, and wasted padding.
- Use color intentionally for category, urgency, and feedback rather than pure decoration.
- The UI should feel game-like and Pokemon-adjacent without becoming visually childish or overloaded.

## UX Implications For Tooling And Game UI

- The internal tool should eventually help manage visual tokens and interface text efficiently.
- Compact UI requires strong consistency in spacing, typography, iconography, and naming.
- The permanent docs should include explicit UI density rules and text economy rules so future AI-generated interfaces do not bloat.

## Recommended Content Data Structure

- Content authoring data should be split by domain.
- Recommended domains include:
  - zones
  - quests
  - dialogues
  - talents
  - progression
  - visual tokens
  - battle rules
- Pokemon canonical data should not be manually duplicated by hand across many files if it can be imported and normalized.
- Project-specific Pokemon gameplay data should be layered on top of imported canonical data through explicit override files.

## Recommended Data Pipeline

- Use source files that are convenient for tooling and authoring.
- Use scripts to import and normalize canonical Pokemon data from PokeAPI.
- Store normalized generated data separately from hand-authored project overrides.
- Build output should bundle production data into fewer runtime artifacts.
- Source format and shipped runtime format should remain separate concerns.

## Critical Testing Priorities

- Resume after short inactivity
- Resume after long inactivity
- Resume after tab backgrounding
- Resume after window minimization
- Resume after mobile device lock and return
- Large elapsed time reconstruction
- Save migration safety
- Responsive UI behavior across desktop and smartphone portrait layouts

## Explicit Non-Negotiables

- No important gameplay rule may depend on active-tab rendering cadence.
- No important gameplay rule may depend on browser timers continuing to run in the background.
- Simulation, rendering, and UI must stay separated.
- Mobile portrait support is mandatory.
- Responsive behavior is mandatory.
- Documentation for AI constraints is mandatory from the start.
