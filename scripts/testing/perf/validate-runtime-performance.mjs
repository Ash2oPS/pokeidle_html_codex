import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    stateDir: "output/phase5-ui-composition-smoke-route1",
    maxMeanCpuFrameMs: 16,
    maxMeanFrameMs: 40,
    maxCpuRegressionRatio: 1.05,
    baselineFile: "",
    writeBaseline: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextValue = argv[index + 1];
    if (token === "--state-dir" && nextValue) {
      args.stateDir = nextValue;
      index += 1;
    } else if (token === "--max-mean-cpu-frame-ms" && nextValue) {
      args.maxMeanCpuFrameMs = Number(nextValue);
      index += 1;
    } else if (token === "--max-mean-frame-ms" && nextValue) {
      args.maxMeanFrameMs = Number(nextValue);
      index += 1;
    } else if (token === "--max-cpu-regression-ratio" && nextValue) {
      args.maxCpuRegressionRatio = Number(nextValue);
      index += 1;
    } else if (token === "--baseline-file" && nextValue) {
      args.baselineFile = nextValue;
      index += 1;
    } else if (token === "--write-baseline" && nextValue) {
      args.writeBaseline = nextValue;
      index += 1;
    }
  }

  return args;
}

function readStateFiles(stateDir) {
  const absoluteDir = path.resolve(stateDir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const stateFiles = entries
    .filter((entry) => entry.isFile() && /^state-\d+\.json$/i.test(entry.name))
    .map((entry) => path.join(absoluteDir, entry.name))
    .sort((leftPath, rightPath) => {
      const leftName = path.basename(leftPath);
      const rightName = path.basename(rightPath);
      return leftName.localeCompare(rightName, "en", { numeric: true });
    });
  if (stateFiles.length === 0) {
    throw new Error(`No state-*.json files found in ${absoluteDir}`);
  }
  return stateFiles;
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function roundMetric(value, precision = 3) {
  const scale = Math.pow(10, precision);
  return Math.round(value * scale) / scale;
}

function computeMetrics(samples) {
  const cpuValues = [];
  const frameValues = [];
  const renderValues = [];
  const fpsValues = [];

  for (const sample of samples) {
    const cpu = safeNumber(sample.cpu_frame_ms_estimate);
    const frame = safeNumber(sample.frame_ms_estimate);
    const render = safeNumber(sample.render_frame_ms_estimate);
    const fps = safeNumber(sample.fps_estimate);
    if (cpu != null) {
      cpuValues.push(cpu);
    }
    if (frame != null) {
      frameValues.push(frame);
    }
    if (render != null) {
      renderValues.push(render);
    }
    if (fps != null) {
      fpsValues.push(fps);
    }
  }

  if (cpuValues.length === 0 || frameValues.length === 0) {
    throw new Error("Missing cpu/frame metrics in collected state payloads.");
  }

  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const min = (values) => values.reduce((currentMin, value) => Math.min(currentMin, value), values[0]);
  const max = (values) => values.reduce((currentMax, value) => Math.max(currentMax, value), values[0]);

  return {
    sampleCount: samples.length,
    meanCpuFrameMs: roundMetric(mean(cpuValues)),
    minCpuFrameMs: roundMetric(min(cpuValues)),
    maxCpuFrameMs: roundMetric(max(cpuValues)),
    meanFrameMs: roundMetric(mean(frameValues)),
    minFrameMs: roundMetric(min(frameValues)),
    maxFrameMs: roundMetric(max(frameValues)),
    meanRenderFrameMs: renderValues.length > 0 ? roundMetric(mean(renderValues)) : null,
    meanFps: fpsValues.length > 0 ? roundMetric(mean(fpsValues)) : null,
  };
}

function ensureParentDirectory(filePath) {
  const directory = path.dirname(path.resolve(filePath));
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function loadBaselineMetrics(filePath) {
  if (!filePath) {
    return null;
  }
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Baseline file does not exist: ${absolutePath}`);
  }
  const payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  return payload?.metrics || null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const stateFiles = readStateFiles(args.stateDir);
  const samples = stateFiles.map((filePath) => JSON.parse(fs.readFileSync(filePath, "utf8")));
  const metrics = computeMetrics(samples);

  const summary = {
    generated_at: new Date().toISOString(),
    state_dir: path.resolve(args.stateDir),
    state_files: stateFiles.map((filePath) => path.basename(filePath)),
    metrics,
  };

  const baselineMetrics = loadBaselineMetrics(args.baselineFile);
  if (baselineMetrics?.meanCpuFrameMs && baselineMetrics.meanCpuFrameMs > 0) {
    summary.baseline = baselineMetrics;
    summary.cpu_regression_ratio = roundMetric(metrics.meanCpuFrameMs / baselineMetrics.meanCpuFrameMs, 4);
  }

  if (metrics.meanCpuFrameMs > args.maxMeanCpuFrameMs) {
    throw new Error(
      `meanCpuFrameMs ${metrics.meanCpuFrameMs} exceeded max ${args.maxMeanCpuFrameMs} (stateDir=${summary.state_dir}).`,
    );
  }
  if (metrics.meanFrameMs > args.maxMeanFrameMs) {
    throw new Error(
      `meanFrameMs ${metrics.meanFrameMs} exceeded max ${args.maxMeanFrameMs} (stateDir=${summary.state_dir}).`,
    );
  }
  if (summary.cpu_regression_ratio != null && summary.cpu_regression_ratio > args.maxCpuRegressionRatio) {
    throw new Error(
      `cpu regression ratio ${summary.cpu_regression_ratio} exceeded max ${args.maxCpuRegressionRatio}.`,
    );
  }

  if (args.writeBaseline) {
    const baselinePath = path.resolve(args.writeBaseline);
    ensureParentDirectory(baselinePath);
    fs.writeFileSync(baselinePath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[perf-validation] ${message}\n`);
  process.exitCode = 1;
}
