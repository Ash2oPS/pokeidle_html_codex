import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    file: "game-runtime.js",
    format: "json",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--file" && next) {
      args.file = next;
      i += 1;
      continue;
    }
    if (token === "--format" && next) {
      args.format = String(next || "json").toLowerCase();
      i += 1;
    }
  }

  return args;
}

function countApproxFunctions(source) {
  const functionDecl = (source.match(/\bfunction\s+[A-Za-z0-9_$]+\s*\(/g) || []).length;
  const classDecl = (source.match(/\bclass\s+[A-Za-z0-9_$]+\b/g) || []).length;
  return functionDecl + classDecl;
}

function countAddEventListeners(source) {
  return (source.match(/addEventListener\s*\(/g) || []).length;
}

function computeMetrics(targetPath) {
  const source = fs.readFileSync(targetPath, "utf8");
  const lines = source.split(/\r?\n/);
  const nonEmpty = lines.filter((line) => line.trim().length > 0);

  return {
    file: targetPath,
    total_lines: lines.length,
    non_empty_lines: nonEmpty.length,
    function_like_count: countApproxFunctions(source),
    add_event_listener_count: countAddEventListeners(source),
  };
}

function toMarkdownTable(metrics) {
  return [
    "| Indicator | Value |",
    "|---|---:|",
    `| file | \`${metrics.file}\` |`,
    `| total lines | ${metrics.total_lines} |`,
    `| non-empty lines | ${metrics.non_empty_lines} |`,
    `| function-like count (function+class) | ${metrics.function_like_count} |`,
    `| addEventListener count | ${metrics.add_event_listener_count} |`,
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const metrics = computeMetrics(filePath);
  if (args.format === "md" || args.format === "markdown") {
    process.stdout.write(`${toMarkdownTable(metrics)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[runtime-metrics] ${message}\n`);
  process.exitCode = 1;
}
