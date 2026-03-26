import test from "node:test";
import assert from "node:assert/strict";

import { createZoneDialogueRuntime } from "../lib/zone-dialogue-runtime.js";

function createFixture(options = {}) {
  const state = {
    routeData: {
      route_id: "kanto_city_pallet_town",
      zone_actions: [
        {
          action_id: "talk-guide",
          dialogue_id: "guide_intro",
          kind: "dialogue",
        },
      ],
    },
    saveData: {
      current_route_id: "kanto_city_pallet_town",
      starter_chosen: true,
      zone_flags: [],
      seen_dialogue_ids: [],
    },
    dialogue: {
      queue: [],
      active: null,
      definitionsById: new Map(),
    },
    ui: {
      dialogueOpen: false,
      mapOpen: false,
    },
    ...options.state,
  };

  const counters = {
    prepareDialogueUi: 0,
    showDialogueModal: 0,
    hideDialogueModal: 0,
    clearDialogueUi: 0,
    renderDialogueModal: 0,
    refreshRouteUi: 0,
    refreshZoneActionButtons: 0,
    renderMapModal: 0,
    updateHud: 0,
    persistSaveDataForSimulationEvent: 0,
    tryOpenPendingTutorialFlow: 0,
    topMessages: [],
    fetchCalls: [],
  };

  const definitionsById = {
    guide_intro: {
      title_fr: "Guide",
      start_node_id: "start",
      nodes: [
        {
          node_id: "start",
          speaker_fr: "Guide",
          text_fr: "Bienvenue.",
          effects_on_enter: [
            { kind: "set_flag_true", flag_id: "met-guide" },
          ],
          next_node_id: "",
        },
      ],
    },
    guide_choice: {
      title_fr: "Guide",
      start_node_id: "start",
      nodes: [
        {
          node_id: "start",
          speaker_fr: "Guide",
          text_fr: "Tu continues ?",
          choices: [
            {
              choice_id: "locked",
              label_fr: "Pas encore",
              requires_flags_all: ["missing-flag"],
              next_node_id: "end",
            },
            {
              choice_id: "open",
              label_fr: "On y va",
              next_node_id: "end",
              effects: [
                { kind: "set_flag_true", flag_id: "accepted-guide" },
              ],
            },
          ],
        },
        {
          node_id: "end",
          speaker_fr: "Guide",
          text_fr: "Parfait.",
          next_node_id: "",
        },
      ],
    },
    arrival_intro: {
      title_fr: "Arrivee",
      start_node_id: "start",
      nodes: [
        {
          node_id: "start",
          speaker_fr: "PNJ",
          text_fr: "Salut.",
          next_node_id: "",
        },
      ],
    },
    ...(options.definitionsById || {}),
  };

  const routeFlags = new Set(Array.isArray(state.saveData.zone_flags) ? state.saveData.zone_flags : []);
  const seenDialogueIds = new Set(Array.isArray(state.saveData.seen_dialogue_ids) ? state.saveData.seen_dialogue_ids : []);

  const runtime = createZoneDialogueRuntime({
    state,
    defaultRouteId: "kanto_city_pallet_town",
    dialogueDataDir: "map_data/dialogues",
    normalizeUiDisplayText: (value) => String(value || ""),
    normalizeFlagIdList: (list) => Array.from(new Set(Array.isArray(list) ? list.filter(Boolean).map(String) : [])),
    fetchFn: async (path) => {
      counters.fetchCalls.push(path);
      const match = String(path || "").match(/([^/]+)\.json$/);
      const id = match ? decodeURIComponent(match[1]) : "";
      return {
        ok: Boolean(definitionsById[id]),
        status: definitionsById[id] ? 200 : 404,
        json: async () => definitionsById[id],
      };
    },
    validateDialoguePayload: (payload) => payload,
    getRouteAccessFlags: () => Array.from(routeFlags),
    getRouteDataById: (routeId) => routeId === "kanto_city_pallet_town"
      ? { arrival_dialogue_ids_once: ["arrival_intro"] }
      : null,
    getRouteDisplayName: (routeId) => ({
      kanto_city_pallet_town: "Bourg Palette (Kanto)",
    })[routeId] || routeId,
    setRouteAccessFlag: (flagId, enabled) => {
      const normalizedFlagId = String(flagId || "").trim();
      if (!normalizedFlagId) {
        return false;
      }
      const hadFlag = routeFlags.has(normalizedFlagId);
      if (enabled) {
        routeFlags.add(normalizedFlagId);
      } else {
        routeFlags.delete(normalizedFlagId);
      }
      state.saveData.zone_flags = Array.from(routeFlags);
      return hadFlag !== routeFlags.has(normalizedFlagId);
    },
    tryUnlockNextRouteAfterDefeat: () => ({ route_names_fr: ["Route 1 (Kanto)"] }),
    refreshRouteUi: () => {
      counters.refreshRouteUi += 1;
    },
    refreshZoneActionButtons: () => {
      counters.refreshZoneActionButtons += 1;
    },
    renderMapModal: () => {
      counters.renderMapModal += 1;
    },
    updateHud: () => {
      counters.updateHud += 1;
    },
    persistSaveDataForSimulationEvent: () => {
      counters.persistSaveDataForSimulationEvent += 1;
    },
    setTopMessage: (message) => {
      counters.topMessages.push(String(message || ""));
    },
    hideHoverPopup: () => {},
    prepareDialogueUi: () => {
      counters.prepareDialogueUi += 1;
    },
    showDialogueModal: () => {
      counters.showDialogueModal += 1;
    },
    hideDialogueModal: () => {
      counters.hideDialogueModal += 1;
    },
    clearDialogueUi: () => {
      counters.clearDialogueUi += 1;
    },
    renderDialogueModal: () => {
      counters.renderDialogueModal += 1;
    },
    canOpenDialogueModalNow: () => options.canOpenDialogueModalNow ?? true,
    hasSeenDialogue: (dialogueId) => seenDialogueIds.has(String(dialogueId || "").trim()),
    markDialogueSeen: (dialogueId) => {
      const normalizedDialogueId = String(dialogueId || "").trim();
      if (!normalizedDialogueId || seenDialogueIds.has(normalizedDialogueId)) {
        return false;
      }
      seenDialogueIds.add(normalizedDialogueId);
      state.saveData.seen_dialogue_ids = Array.from(seenDialogueIds);
      return true;
    },
    tryOpenPendingTutorialFlow: () => {
      counters.tryOpenPendingTutorialFlow += 1;
    },
  });

  return {
    runtime,
    state,
    counters,
    routeFlags,
    seenDialogueIds,
  };
}

test("zone dialogue runtime opens a session and applies enter side effects", async () => {
  const { runtime, state, counters, routeFlags } = createFixture();

  const opened = await runtime.openDialogueSession("guide_intro");

  assert.equal(opened, true);
  assert.equal(state.ui.dialogueOpen, true);
  assert.equal(state.dialogue.active?.dialogueId, "guide_intro");
  assert.equal(routeFlags.has("met-guide"), true);
  assert.equal(counters.prepareDialogueUi, 1);
  assert.equal(counters.showDialogueModal, 1);
  assert.equal(counters.renderDialogueModal, 1);
  assert.equal(counters.refreshRouteUi, 1);
  assert.equal(counters.refreshZoneActionButtons, 2);
  assert.equal(counters.updateHud, 1);
  assert.equal(counters.persistSaveDataForSimulationEvent, 1);
});

test("zone dialogue runtime queues arrival dialogue when the modal cannot open yet", () => {
  const { runtime, state, counters } = createFixture({ canOpenDialogueModalNow: false });

  const queued = runtime.queueArrivalDialoguesForRoute("kanto_city_pallet_town");

  assert.equal(queued, true);
  assert.equal(state.dialogue.queue.length, 1);
  assert.deepEqual(state.dialogue.queue[0], {
    dialogueId: "arrival_intro",
    once: true,
    routeId: "kanto_city_pallet_town",
    source: "arrival_once",
    sourceActionId: "",
  });
  assert.equal(counters.showDialogueModal, 0);
});

test("zone dialogue runtime filters choices and closes once-dialogues cleanly", async () => {
  const { runtime, state, counters, routeFlags, seenDialogueIds } = createFixture();

  const opened = await runtime.openDialogueSession("guide_choice", { once: true });
  assert.equal(opened, true);

  const startNode = state.dialogue.active.definition.nodes[0];
  const availableChoices = runtime.getAvailableDialogueChoices(startNode);
  assert.equal(availableChoices.length, 1);
  assert.equal(availableChoices[0].choice_id, "open");

  const advanced = runtime.chooseActiveDialogueChoice("open");
  assert.equal(advanced, true);
  assert.equal(state.dialogue.active?.currentNodeId, "end");
  assert.equal(routeFlags.has("accepted-guide"), true);

  const finished = runtime.advanceActiveDialogue();
  assert.equal(finished, true);
  assert.equal(state.ui.dialogueOpen, false);
  assert.equal(state.dialogue.active, null);
  assert.equal(seenDialogueIds.has("guide_choice"), true);
  assert.equal(counters.hideDialogueModal, 1);
  assert.equal(counters.clearDialogueUi, 1);
  assert.equal(counters.persistSaveDataForSimulationEvent, 2);
  assert.equal(counters.tryOpenPendingTutorialFlow, 1);
});

test("zone dialogue runtime fetches static dialogue files without explicit no-store options", async () => {
  const { runtime, counters } = createFixture();

  const opened = await runtime.openDialogueSession("guide_intro");

  assert.equal(opened, true);
  assert.deepEqual(counters.fetchCalls, ["map_data/dialogues/guide_intro.json"]);
});
