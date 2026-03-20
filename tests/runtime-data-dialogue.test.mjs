import test from "node:test";
import assert from "node:assert/strict";

import { validateDialoguePayload, validateRouteDataPayload } from "../lib/runtime-data.js";

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
