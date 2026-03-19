import fs from "node:fs";
import path from "node:path";

import { buildCombatVfxSeedJson } from "./vfx-combat-gallery-helpers.mjs";

function parseArgs(argv) {
  const args = {
    outputFile: "",
    teamIds: [],
    currentRouteId: "kanto_route_1",
    lastTickEpochMs: Date.now(),
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === "--output-file" && next) {
      args.outputFile = next;
      index += 1;
    } else if (token === "--team-ids" && next) {
      args.teamIds = next
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
      index += 1;
    } else if (token === "--current-route-id" && next) {
      args.currentRouteId = next;
      index += 1;
    } else if (token === "--last-tick-epoch-ms" && next) {
      args.lastTickEpochMs = Number(next);
      index += 1;
    }
  }

  if (!args.outputFile) {
    throw new Error("--output-file is required");
  }
  if (args.teamIds.length === 0) {
    throw new Error("--team-ids is required");
  }

  return args;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

function main() {
  const args = parseArgs(process.argv);
  const payload = buildCombatVfxSeedJson({
    teamIds: args.teamIds,
    currentRouteId: args.currentRouteId,
    lastTickEpochMs: args.lastTickEpochMs,
  });
  ensureParentDir(args.outputFile);
  fs.writeFileSync(path.resolve(args.outputFile), payload, "utf8");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[vfx-combat-seed] ${message}\n`);
  process.exitCode = 1;
}

