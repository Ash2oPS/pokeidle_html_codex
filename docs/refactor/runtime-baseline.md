# Runtime Slim Baseline (2026-03-16)

This file captures the baseline measured before the final runtime slimming pass.

## Runtime metrics

| Indicator | Value |
|---|---:|
| `game-runtime.js` total lines | 22668 |
| `game-runtime.js` non-empty lines | 21025 |
| function-like count (`function` + `class`) | 749 |
| `addEventListener(` count | 92 |

## Key anchors

| Indicator | Value |
|---|---|
| `PokemonBattleManager` block | lines 7715-9971 |
| `computeLayout()` start | line 12992 |
| `render()` start | line 17726 |
| final listeners block | lines 22160-22666 |

## Validation baseline

| Command | Result |
|---|---|
| `npm test` | PASS |
| `npm run test:perf:web-game:regression` | PASS |
| `npm run test:perf:phase5:regression` | PASS |

## Reproduce

```bash
git status --short
node scripts/testing/metrics/runtime-file-metrics.mjs --file game-runtime.js
npm test
npm run test:perf:web-game:regression
npm run test:perf:phase5:regression
```
