import test from "node:test";
import assert from "node:assert/strict";

import {
  validateDialoguePayload,
  validateRouteDataPayload,
  validateTrainerBattlePayload,
} from "../lib/runtime-data.js";

test("validateRouteDataPayload accepts the unified zone metadata fields", () => {
  const route = validateRouteDataPayload(
    {
      route_id: "kanto_city_viridian_city",
      route_name_fr: "Jadielle",
      zone_type: "town",
      combat_enabled: false,
      connected_route_ids: ["kanto_route_1", "kanto_route_2"],
      arrival_dialogue_ids_once: ["kanto_viridian_arrival_once"],
      zone_actions: [
        {
          action_id: "viridian_guide",
          label_fr: "Parler au guide",
          dialogue_id: "kanto_viridian_guide",
          desktop_anchor_pct: { x: 68, y: 70 },
          mobile_anchor_pct: { x: 64, y: 28 },
        },
      ],
      access_rules: {
        requires_flags_all: ["guide_spoken"],
        requires_flags_any: ["badge_kanto"],
        blocked_reason_fr: "Il faut d'abord aider le guide.",
      },
      encounters: [],
    },
    "route",
  );

  assert.deepEqual(route.connected_route_ids, ["kanto_route_1", "kanto_route_2"]);
  assert.deepEqual(route.arrival_dialogue_ids_once, ["kanto_viridian_arrival_once"]);
  assert.equal(route.zone_actions[0].kind, "dialogue");
  assert.equal(route.access_rules.requires_flags_all[0], "guide_spoken");
});

test("validateRouteDataPayload and validateTrainerBattlePayload accept trainer battle content", () => {
  const route = validateRouteDataPayload(
    {
      route_id: "kanto_city_pewter_city",
      route_name_fr: "Argenta",
      zone_type: "town",
      combat_enabled: false,
      zone_actions: [
        {
          action_id: "kanto_pewter_gym_brock",
          label_fr: "Defier Pierre",
          kind: "trainer_battle",
          trainer_battle_id: "kanto_pewter_gym_brock",
          desktop_anchor_pct: { x: 42, y: 14 },
          mobile_anchor_pct: { x: 42, y: 15 },
        },
      ],
      encounters: [],
    },
    "route",
  );
  const trainerBattle = validateTrainerBattlePayload(
    {
      trainer_battle_id: "kanto_pewter_gym_brock",
      trainer_name_fr: "Pierre",
      route_id: "kanto_city_pewter_city",
      victory_flag_id: "kanto_pewter_gym_brock_cleared",
      roster: [
        { pokemon_id: 74, level: 8 },
        { pokemon_id: 138, level: 9 },
        { pokemon_id: 95, level: 11 },
      ],
    },
    "trainer battle",
  );

  assert.equal(route.zone_actions[0].kind, "trainer_battle");
  assert.equal(route.zone_actions[0].trainer_battle_id, "kanto_pewter_gym_brock");
  assert.equal(trainerBattle.trainer_name_fr, "Pierre");
  assert.equal(trainerBattle.roster[2].pokemon_id, 95);
});

test("validateDialoguePayload normalizes branching dialogue payloads", () => {
  const dialogue = validateDialoguePayload(
    {
      dialogue_id: "kanto_viridian_guide",
      title_fr: "Guide de Jadielle",
      start_node_id: "intro",
      nodes: [
        {
          node_id: "intro",
          speaker_fr: "Guide",
          text_fr: "Tu veux un conseil ?",
          choices: [
            {
              choice_id: "yes",
              label_fr: "Oui",
              next_node_id: "hint",
              effects: [
                {
                  kind: "set_flag_true",
                  flag_id: "guide_spoken",
                },
              ],
            },
          ],
        },
        {
          node_id: "hint",
          speaker_fr: "Guide",
          text_fr: "Prends la route nord quand tu es pret.",
        },
      ],
    },
    "dialogue",
  );

  assert.equal(dialogue.nodes[0].choices[0].effects[0].kind, "set_flag_true");
  assert.equal(dialogue.nodes[1].next_node_id, "");
  assert.deepEqual(dialogue.nodes[1].choices, []);
});

test("validateDialoguePayload rejects unsupported side effects", () => {
  assert.throws(
    () =>
      validateDialoguePayload(
        {
          dialogue_id: "broken_dialogue",
          title_fr: "Dialogue casse",
          start_node_id: "intro",
          nodes: [
            {
              node_id: "intro",
              text_fr: "Impossible",
              effects_on_enter: [
                {
                  kind: "run_script",
                  flag_id: "bad",
                },
              ],
            },
          ],
        },
        "dialogue",
      ),
    /set_flag_true|set_flag_false/i,
  );
});
