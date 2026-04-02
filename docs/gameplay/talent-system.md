<!-- doc-meta: {"status":"normative","scope":["talent-system","passive-effects"],"readFirst":["talent-work","combat-hooks"]} -->
# Talent System

- Each species has at most one fixed passive talent, and the player does not manually choose talents. [RULE:GAME-TALENT-001]
- Talents hook into explicit documented phases such as battle start, slot turn start, attack resolution, damage, enemy defeat or spawn, and stat or presentation derivation. [RULE:GAME-TALENT-002]
- Talent stacking, targeting, sequence effects, and priority must be deterministic and documented. [RULE:GAME-TALENT-003]
- Simple or common talents may be data-backed, but advanced behavior stays code-backed behind stable hooks instead of ad hoc exceptions. [RULE:GAME-TALENT-004]
- Adding or changing a talent requires docs, tests, and an explicit choice of data-backed, code-backed, or hybrid ownership. [RULE:GAME-TALENT-005]

## Current Examples

Helping Hand, Loser, Blaze, Morphing, God of Time, and Multi-Type remain representative examples of the expected hook and ownership model.