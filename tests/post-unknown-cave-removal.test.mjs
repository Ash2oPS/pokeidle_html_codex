import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();

function readProjectFile(...segments) {
  return fs.readFileSync(path.join(ROOT_DIR, ...segments), "utf8");
}

test("post unknown cave encounter remap artifacts are removed from the runtime", () => {
  const sources = [
    readProjectFile("lib", "game-world-config.js"),
    readProjectFile("lib", "game-runtime-state.js"),
    readProjectFile("core", "runtime-bootstrap-system.js"),
    readProjectFile("systems", "ui", "runtime-ui-interaction-system.js"),
    readProjectFile("game-runtime.js"),
  ].join("\n");

  const forbiddenTerms = [
    "ROUTE_ENCOUNTERS_POST_UNKNOWN_CAVE_CSV_PATH",
    "POST_UNKNOWN_CAVE_MAPPING_POPUP_MESSAGE",
    "postUnknownCave",
    "post_unknown_cave_mapping_notice_seen",
    "csv_post_unknown_cave",
    "setPostUnknownCaveEncounterCsvState",
    "shouldUsePostUnknownCaveEncounterMapping",
    "getRouteEncounterSourceLabel",
    "showPostUnknownCaveMappingPopup",
    "syncPostUnknownCaveMappingState",
    "maybeActivatePostUnknownCaveMapping",
  ];

  for (const term of forbiddenTerms) {
    assert.equal(
      sources.includes(term),
      false,
      `Unexpected post-Unknown-Cave remap reference still present: ${term}`,
    );
  }
});

test("post unknown cave remap data pipeline files are gone", () => {
  const removedPaths = [
    path.join(ROOT_DIR, "map_data", "kanto_zone_encounters_post_unknown_cave.csv"),
    path.join(ROOT_DIR, "scripts", "map", "generate-post-unknown-cave-encounters.mjs"),
    path.join(ROOT_DIR, "tests", "post-unknown-cave-encounters.test.mjs"),
  ];

  for (const filePath of removedPaths) {
    assert.equal(fs.existsSync(filePath), false, `Obsolete file should be removed: ${filePath}`);
  }
});
