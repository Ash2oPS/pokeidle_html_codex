# Runtime Performance Validation

This project includes a lightweight performance validator that reads Playwright smoke state snapshots and enforces guardrails on runtime frame metrics.

## Script

- `scripts/testing/perf/validate-runtime-performance.mjs`

## NPM helpers

- `npm run test:perf:phase5`
- `npm run test:perf:web-game`
- `npm run test:perf:phase5:regression`
- `npm run test:perf:web-game:regression`
- `npm run test:perf:baseline:phase5`
- `npm run test:perf:baseline:web-game`

Each command reads `state-*.json` payloads from the target output directory and checks:

- mean `cpu_frame_ms_estimate` <= configured threshold
- mean `frame_ms_estimate` <= configured threshold
- optional regression ratio against a stored baseline

## Optional baseline flow

Write a baseline:

```bash
node scripts/testing/perf/validate-runtime-performance.mjs \
  --state-dir output/phase5-ui-composition-smoke-route1 \
  --write-baseline output/perf-baselines/phase5-core-loop.json
```

Validate against a baseline:

```bash
node scripts/testing/perf/validate-runtime-performance.mjs \
  --state-dir output/phase5-ui-composition-smoke-route1 \
  --baseline-file output/perf-baselines/phase5-core-loop.json \
  --max-cpu-regression-ratio 1.05
```

Repository baseline files currently tracked:

- `tests/perf-baselines/phase5-core-loop.json`
- `tests/perf-baselines/web-game-poke.json`
