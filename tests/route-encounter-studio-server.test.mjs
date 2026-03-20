import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

const ROOT_DIR = process.cwd();
const MAP_DATA_DIR = path.join(ROOT_DIR, "map_data");
const SERVER_SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "game-data-studio-server.mjs");

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function createStudioFixture() {
  const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "pokeidle-route-studio-"));
  const tempMapDir = path.join(tempRoot, "map_data");
  const tempDialogueDir = path.join(tempMapDir, "dialogues");
  const tempBackupDir = path.join(tempRoot, "tool-backups");
  await fsp.mkdir(tempMapDir, { recursive: true });
  await fsp.mkdir(tempDialogueDir, { recursive: true });
  await fsp.mkdir(tempBackupDir, { recursive: true });

  const csvLines = [
    "route_id,route_name_fr,zone_type,combat_enabled,pokemon_id,pokemon_name_en,pokemon_name_fr,spawn_weight,min_level,max_level,methods",
    "kanto_route_1,Route 1 (Kanto),route,true,16,pidgey,Roucool,50,2,5,walk",
    "kanto_route_1,Route 1 (Kanto),route,true,19,rattata,Rattata,50,2,4,walk",
  ];
  await fsp.writeFile(path.join(tempMapDir, "kanto_zone_encounters.csv"), `${csvLines.join("\n")}\n`, "utf8");

  const defaultAccessRules = {
    requires_flags_all: [],
    requires_flags_any: [],
    blocked_reason_fr: "",
  };

  await fsp.writeFile(
    path.join(tempMapDir, "kanto_city_pallet_town.json"),
    `${JSON.stringify(
      {
        route_id: "kanto_city_pallet_town",
        route_name_fr: "Bourg Palette (Kanto)",
        zone_type: "town",
        combat_enabled: false,
        unlock_mode: "visit",
        unlock_defeats_required: 0,
        unlock_timer_ms: 20000,
        encounters: [],
        connected_route_ids: ["kanto_route_1"],
        arrival_dialogue_ids_once: ["kanto_test_arrival_once"],
        zone_actions: [],
        access_rules: defaultAccessRules,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "kanto_route_1.json"),
    `${JSON.stringify(
      {
        route_id: "kanto_route_1",
        route_name_fr: "Route 1 (Kanto)",
        zone_type: "route",
        combat_enabled: true,
        unlock_mode: "defeats",
        unlock_defeats_required: 20,
        unlock_timer_ms: 20000,
        encounters: [],
        connected_route_ids: ["kanto_city_pallet_town", "kanto_city_viridian_city"],
        arrival_dialogue_ids_once: [],
        zone_actions: [],
        access_rules: defaultAccessRules,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "kanto_city_viridian_city.json"),
    `${JSON.stringify(
      {
        route_id: "kanto_city_viridian_city",
        route_name_fr: "Jadielle (Kanto)",
        zone_type: "town",
        combat_enabled: false,
        unlock_mode: "visit",
        unlock_defeats_required: 0,
        unlock_timer_ms: 20000,
        encounters: [],
        connected_route_ids: ["kanto_route_1", "kanto_route_2"],
        arrival_dialogue_ids_once: [],
        zone_actions: [
          {
            action_id: "viridian_guide",
            label_fr: "Parler au guide",
            kind: "dialogue",
            dialogue_id: "kanto_test_optional",
            desktop_anchor_pct: { x: 68, y: 70 },
            mobile_anchor_pct: { x: 64, y: 28 },
          },
        ],
        access_rules: defaultAccessRules,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "johto_route_29.json"),
    `${JSON.stringify(
      {
        route_id: "johto_route_29",
        route_name_fr: "Route 29 (Johto)",
        zone_type: "route",
        combat_enabled: true,
        unlock_mode: "defeats",
        unlock_defeats_required: 20,
        unlock_timer_ms: 20000,
        encounters: [
          {
            id: 161,
            name_en: "sentret",
            name_fr: "Fouinette",
            methods: ["walk"],
            spawn_weight: 60,
            min_level: 2,
            max_level: 4,
          },
        ],
        connected_route_ids: ["johto_city_new_bark_town"],
        arrival_dialogue_ids_once: [],
        zone_actions: [],
        access_rules: defaultAccessRules,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "hoenn_route_101.json"),
    `${JSON.stringify(
      {
        route_id: "hoenn_route_101",
        route_name_fr: "Route 101 (Hoenn)",
        zone_type: "route",
        combat_enabled: true,
        unlock_mode: "defeats",
        unlock_defeats_required: 20,
        unlock_timer_ms: 20000,
        encounters: [
          {
            id: 261,
            name_en: "poochyena",
            name_fr: "Medhyena",
            methods: ["walk"],
            spawn_weight: 45,
            min_level: 2,
            max_level: 3,
          },
          {
            id: 265,
            name_en: "wurmple",
            name_fr: "Chenipotte",
            methods: ["walk"],
            spawn_weight: 45,
            min_level: 2,
            max_level: 3,
          },
        ],
        connected_route_ids: ["hoenn_city_littleroot_town"],
        arrival_dialogue_ids_once: [],
        zone_actions: [],
        access_rules: defaultAccessRules,
        source_url: "https://raw.githubusercontent.com/pret/pokeemerald/master/data/maps/Route101/map.json",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempDialogueDir, "kanto_test_arrival_once.json"),
    `${JSON.stringify(
      {
        dialogue_id: "kanto_test_arrival_once",
        title_fr: "Bienvenue a Bourg Palette",
        start_node_id: "oak_intro",
        nodes: [
          {
            node_id: "oak_intro",
            speaker_fr: "Prof. Chen",
            text_fr: "Bienvenue a Bourg Palette.",
            next_node_id: "",
            choices: [],
            effects_on_enter: [],
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempDialogueDir, "kanto_test_optional.json"),
    `${JSON.stringify(
      {
        dialogue_id: "kanto_test_optional",
        title_fr: "Guide de Jadielle",
        start_node_id: "greeting",
        nodes: [
          {
            node_id: "greeting",
            speaker_fr: "Guide",
            text_fr: "Tu veux un conseil ?",
            next_node_id: "",
            choices: [
              {
                choice_id: "yes",
                label_fr: "Oui",
                next_node_id: "hint",
                requires_flags_all: [],
                requires_flags_any: [],
                effects: [],
              },
            ],
            effects_on_enter: [],
          },
          {
            node_id: "hint",
            speaker_fr: "Guide",
            text_fr: "Parle a tout le monde avant de repartir.",
            next_node_id: "",
            choices: [],
            effects_on_enter: [
              {
                kind: "set_flag_true",
                flag_id: "viridian_guide_spoken",
              },
            ],
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "kanto_frlg_zones.json"),
    JSON.stringify(
      {
        zone_order: ["kanto_city_pallet_town", "kanto_route_1", "kanto_city_viridian_city"],
        zones: [
          {
            route_id: "kanto_city_pallet_town",
            route_name_fr: "Bourg Palette (Kanto)",
            zone_type: "town",
            combat_enabled: false,
            unlock_mode: "visit",
            unlock_defeats_required: 0,
          },
          {
            route_id: "kanto_route_1",
            route_name_fr: "Route 1 (Kanto)",
            zone_type: "route",
            combat_enabled: true,
            unlock_mode: "defeats",
            unlock_defeats_required: 20,
          },
          {
            route_id: "kanto_city_viridian_city",
            route_name_fr: "Jadielle (Kanto)",
            zone_type: "town",
            combat_enabled: false,
            unlock_mode: "visit",
            unlock_defeats_required: 0,
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "johto_hgss_zones.json"),
    JSON.stringify(
      {
        zone_order: ["johto_route_29"],
        zones: [
          {
            route_id: "johto_route_29",
            route_name_fr: "Route 29 (Johto)",
            zone_type: "route",
            combat_enabled: true,
            unlock_mode: "defeats",
            unlock_defeats_required: 20,
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  await fsp.writeFile(
    path.join(tempMapDir, "hoenn_emerald_zones.json"),
    JSON.stringify(
      {
        zone_order: ["hoenn_route_101"],
        zones: [
          {
            route_id: "hoenn_route_101",
            route_name_fr: "Route 101 (Hoenn)",
            zone_type: "route",
            combat_enabled: true,
            unlock_mode: "defeats",
            unlock_defeats_required: 20,
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    tempRoot,
    tempMapDir,
    tempDialogueDir,
    tempBackupDir,
  };
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Data studio server exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/route-encounters/meta`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the server becomes available.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Timed out while waiting for data studio server");
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return;
  }
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
}

test("route encounter studio serves Kanto CSV plus Johto and Hoenn JSON zones", async () => {
  const fixture = await createStudioFixture();
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [SERVER_SCRIPT_PATH], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      DATA_STUDIO_HOST: "127.0.0.1",
      DATA_STUDIO_PORT: String(port),
      DATA_STUDIO_MAP_DATA_DIR: fixture.tempMapDir,
      DATA_STUDIO_ROUTE_CSV: path.join(fixture.tempMapDir, "kanto_zone_encounters.csv"),
      DATA_STUDIO_BACKUP_DIR: fixture.tempBackupDir,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer(baseUrl, child);

    const metaResponse = await fetch(`${baseUrl}/api/route-encounters/meta`);
    assert.equal(metaResponse.status, 200);
    const metaPayload = await metaResponse.json();
    const routesById = new Map(metaPayload.routes.map((route) => [route.route_id, route]));

    assert.equal(routesById.get("kanto_route_1")?.storage_kind, "csv");
    assert.equal(routesById.get("johto_route_29")?.storage_kind, "json");
    assert.equal(routesById.get("hoenn_route_101")?.storage_kind, "json");
    assert.equal(routesById.get("johto_route_29")?.region_id, "johto");
    assert.equal(routesById.get("hoenn_route_101")?.region_id, "hoenn");
    assert.ok(Array.isArray(metaPayload.route_choices));
    assert.ok(Array.isArray(metaPayload.dialogue_choices));
    assert.ok(metaPayload.dialogue_choices.some((entry) => entry.dialogue_id === "kanto_test_optional"));
    assert.ok(metaPayload.flag_choices.includes("viridian_guide_spoken"));

    const palletResponse = await fetch(`${baseUrl}/api/route-encounters/kanto_city_pallet_town`);
    assert.equal(palletResponse.status, 200);
    const palletPayload = await palletResponse.json();
    assert.deepEqual(palletPayload.route.arrival_dialogue_ids_once, ["kanto_test_arrival_once"]);

    const johtoResponse = await fetch(`${baseUrl}/api/route-encounters/johto_route_29`);
    assert.equal(johtoResponse.status, 200);
    const johtoPayload = await johtoResponse.json();
    assert.ok(johtoPayload.encounters.length > 0);

    const saveResponse = await fetch(`${baseUrl}/api/route-encounters/hoenn_route_101`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route_name_fr: "Route 101 (Hoenn)",
        zone_type: "route",
        combat_enabled: true,
        unlock_defeats_required: 20,
        unlock_timer_ms: 20000,
        connected_route_ids: ["hoenn_city_littleroot_town", "hoenn_route_102"],
        arrival_dialogue_ids_once: ["kanto_test_arrival_once"],
        zone_actions: [
          {
            action_id: "hoenn_sign",
            label_fr: "Lire le panneau",
            kind: "dialogue",
            dialogue_id: "kanto_test_optional",
            desktop_anchor_pct: { x: 22, y: 61 },
            mobile_anchor_pct: { x: 73, y: 18 },
          },
        ],
        access_rules: {
          requires_flags_all: ["viridian_guide_spoken"],
          requires_flags_any: ["ticket_hoenn"],
          blocked_reason_fr: "Parle au guide avant de continuer.",
        },
        encounters: [
          {
            pokemon_id: 261,
            pokemon_name_en: "poochyena",
            pokemon_name_fr: "Medhyena",
            spawn_weight: 60,
            min_level: 3,
            max_level: 4,
            methods: ["walk"],
          },
          {
            pokemon_id: 265,
            pokemon_name_en: "wurmple",
            pokemon_name_fr: "Chenipotte",
            spawn_weight: 40,
            min_level: 2,
            max_level: 4,
            methods: ["walk"],
          },
        ],
      }),
    });
    assert.equal(saveResponse.status, 200);

    const updatedHoennJson = JSON.parse(
      await fsp.readFile(path.join(fixture.tempMapDir, "hoenn_route_101.json"), "utf8"),
    );
    assert.equal(updatedHoennJson.encounters.length, 2);
    assert.equal(updatedHoennJson.encounters[0].id, 261);
    assert.equal(updatedHoennJson.encounters[0].spawn_weight, 60);
    assert.equal(updatedHoennJson.encounters[0].min_level, 3);
    assert.equal(updatedHoennJson.source_url.includes("pokeemerald"), true);
    assert.deepEqual(updatedHoennJson.connected_route_ids, ["hoenn_city_littleroot_town", "hoenn_route_102"]);
    assert.deepEqual(updatedHoennJson.arrival_dialogue_ids_once, ["kanto_test_arrival_once"]);
    assert.equal(updatedHoennJson.zone_actions[0].dialogue_id, "kanto_test_optional");
    assert.equal(updatedHoennJson.access_rules.requires_flags_all[0], "viridian_guide_spoken");

    const backupFiles = await fsp.readdir(fixture.tempBackupDir);
    assert.ok(
      backupFiles.some((fileName) => fileName.startsWith("hoenn_route_101.json.")),
      "Expected a JSON backup for the Hoenn route",
    );
  } finally {
    await stopServer(child);
    await fsp.rm(fixture.tempRoot, { recursive: true, force: true });
  }
});

test("dialogue studio exposes CRUD endpoints with route reference validation", async () => {
  const fixture = await createStudioFixture();
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [SERVER_SCRIPT_PATH], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      DATA_STUDIO_HOST: "127.0.0.1",
      DATA_STUDIO_PORT: String(port),
      DATA_STUDIO_MAP_DATA_DIR: fixture.tempMapDir,
      DATA_STUDIO_ROUTE_CSV: path.join(fixture.tempMapDir, "kanto_zone_encounters.csv"),
      DATA_STUDIO_BACKUP_DIR: fixture.tempBackupDir,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer(baseUrl, child);

    const metaResponse = await fetch(`${baseUrl}/api/dialogues/meta`);
    assert.equal(metaResponse.status, 200);
    const metaPayload = await metaResponse.json();
    assert.ok(metaPayload.dialogues.some((entry) => entry.dialogue_id === "kanto_test_optional"));
    assert.ok(metaPayload.route_choices.some((entry) => entry.route_id === "kanto_city_viridian_city"));
    assert.ok(metaPayload.flag_choices.includes("viridian_guide_spoken"));

    const getResponse = await fetch(`${baseUrl}/api/dialogues/kanto_test_optional`);
    assert.equal(getResponse.status, 200);
    const getPayload = await getResponse.json();
    assert.equal(getPayload.validation.ok, true);
    assert.ok(getPayload.route_refs.some((entry) => entry.route_id === "kanto_city_viridian_city"));

    const saveResponse = await fetch(`${baseUrl}/api/dialogues/kanto_test_optional`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title_fr: "Guide de Jadielle mis a jour",
        start_node_id: "greeting",
        nodes: [
          {
            node_id: "greeting",
            speaker_fr: "Guide",
            text_fr: "Tu veux un nouveau conseil ?",
            next_node_id: "",
            choices: [
              {
                choice_id: "yes",
                label_fr: "Oui",
                next_node_id: "hint",
                requires_flags_all: [],
                requires_flags_any: [],
                effects: [],
              },
            ],
            effects_on_enter: [],
          },
          {
            node_id: "hint",
            speaker_fr: "Guide",
            text_fr: "Le chemin s'ouvre si tu ecoutes bien.",
            next_node_id: "",
            choices: [],
            effects_on_enter: [
              {
                kind: "set_flag_true",
                flag_id: "viridian_guide_spoken",
              },
              {
                kind: "set_flag_true",
                flag_id: "secret_path_open",
              },
            ],
          },
        ],
      }),
    });
    assert.equal(saveResponse.status, 200);

    const updatedDialogue = JSON.parse(
      await fsp.readFile(path.join(fixture.tempDialogueDir, "kanto_test_optional.json"), "utf8"),
    );
    assert.equal(updatedDialogue.title_fr, "Guide de Jadielle mis a jour");
    assert.equal(updatedDialogue.nodes[1].effects_on_enter[1].flag_id, "secret_path_open");

    const duplicateResponse = await fetch(`${baseUrl}/api/dialogues/kanto_test_optional/duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_dialogue_id: "kanto_test_optional_copy",
      }),
    });
    assert.equal(duplicateResponse.status, 200);
    assert.ok(fs.existsSync(path.join(fixture.tempDialogueDir, "kanto_test_optional_copy.json")));

    const protectedDeleteResponse = await fetch(`${baseUrl}/api/dialogues/kanto_test_optional`, {
      method: "DELETE",
    });
    assert.equal(protectedDeleteResponse.status, 500);
    const protectedDeletePayload = await protectedDeleteResponse.json();
    assert.match(protectedDeletePayload.error, /encore reference/i);

    const deleteCopyResponse = await fetch(`${baseUrl}/api/dialogues/kanto_test_optional_copy`, {
      method: "DELETE",
    });
    assert.equal(deleteCopyResponse.status, 200);
    assert.equal(fs.existsSync(path.join(fixture.tempDialogueDir, "kanto_test_optional_copy.json")), false);

    const backupFiles = await fsp.readdir(fixture.tempBackupDir);
    assert.ok(
      backupFiles.some((fileName) => fileName.startsWith("kanto_test_optional.json.")),
      "Expected a JSON backup for the updated dialogue",
    );
    assert.ok(
      backupFiles.some((fileName) => fileName.startsWith("kanto_test_optional_copy.json.")),
      "Expected a JSON backup for the deleted duplicated dialogue",
    );
  } finally {
    await stopServer(child);
    await fsp.rm(fixture.tempRoot, { recursive: true, force: true });
  }
});
