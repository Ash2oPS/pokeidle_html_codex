<!-- doc-meta: {"status":"normative","scope":["zone-systems","battle-structures"],"readFirst":["zone-work","trainer-work","gym-work"]} -->
# Zone And Battle Systems

- Zones are typed nodes in a world graph; combat and pacifist zones share a common framework but do not share identical behavior assumptions. [RULE:GAME-ZONE-001]
- Visibility, accessibility, completion, adjacency, conditional unlocks, and backtracking are data-driven progression state and must be saved. [RULE:GAME-ZONE-002]
- Pacifist zones support structured activities such as dialogue, team management, gym entry, NPC unlocks, and future services without combat assumptions. [RULE:GAME-ZONE-003]
- Zone events, bosses, trainer battles, and gym battles are first-class systems implemented through explicit data and runtime handlers rather than bespoke one-offs. [RULE:GAME-ZONE-004]
- Battle entry constraints, timers, maluses, unlock effects, and locked reasons must be validated before start and made legible in the UI or world map. [RULE:GAME-ZONE-005]