import { loadContentRegistry } from "@pokeidle/content-data";
import { describe, expect, it } from "vitest";
import { createDefaultGameSave } from "../src/save/default-save";
import { applySliceAction, deriveSliceView, syncSliceProgressionState } from "../src/slice/runtime";

function createReadySave() {
  const save = createDefaultGameSave("2026-04-02T00:00:00.000Z");
  const registry = loadContentRegistry();
  syncSliceProgressionState(save, registry);
  return { save, registry };
}

describe("slice progression shell", () => {
  it("bootstraps the initial save on town-1", () => {
    const { save } = createReadySave();

    expect(save.player.activeZoneId).toBe("town-1");
    expect(save.zones["town-1"]?.accessible).toBe(true);
    expect(save.zones["town-1"]?.visible).toBe(true);
  });

  it("propagates accessibility through open world-map links", () => {
    const { save, registry } = createReadySave();

    expect(save.zones["route-1"]?.accessible).toBe(true);
    expect(save.zones["route-2"]?.accessible).toBe(false);

    applySliceAction(save, registry, { type: "complete_zone_debug", zoneId: "route-1" });

    expect(save.zones["route-2"]?.accessible).toBe(true);
  });

  it("keeps a conditional town locked until both route completion and unlock flag are present", () => {
    const { save, registry } = createReadySave();

    applySliceAction(save, registry, { type: "complete_zone_debug", zoneId: "route-1" });
    expect(save.zones["town-2"]?.accessible).toBe(false);

    applySliceAction(save, registry, { type: "complete_zone_debug", zoneId: "route-2" });
    expect(save.zones["town-2"]?.accessible).toBe(false);

    save.flags["town-2-unlocked"] = true;
    syncSliceProgressionState(save, registry);

    expect(save.zones["town-2"]?.accessible).toBe(true);
  });

  it("dialogue grants flags, starts the main quest, and opens a stepper dialogue", () => {
    const { save, registry } = createReadySave();

    expect(save.quests["main-001"]?.state).toBe("available");

    applySliceAction(save, registry, {
      type: "start_dialogue_activity",
      zoneId: "town-1",
      activityId: "rowan-intro",
    });

    expect(save.flags["talked-to-rowan"]).toBe(true);
    expect(save.flags["npc:professor-rowan:talked"]).toBe(true);
    expect(save.quests["main-001"]?.state).toBe("completed");
    expect(save.slice.activeDialogue?.dialogueId).toBe("town-1-intro");

    applySliceAction(save, registry, { type: "advance_dialogue" });
    expect(save.slice.activeDialogue?.lineIndex).toBe(1);

    applySliceAction(save, registry, { type: "advance_dialogue" });
    expect(save.slice.activeDialogue).toBeNull();
  });

  it("winning the gym battle sets both the generic battle flag and the explicit unlock flag", () => {
    const { save, registry } = createReadySave();

    applySliceAction(save, registry, { type: "win_battle_debug", battleId: "gym-001" });

    expect(save.flags["battle:gym-001:won"]).toBe(true);
    expect(save.flags["oreburgh-gym-cleared"]).toBe(true);
  });

  it("claiming a completed quest grants rewards and marks it as reward-claimed", () => {
    const { save, registry } = createReadySave();

    applySliceAction(save, registry, {
      type: "start_dialogue_activity",
      zoneId: "town-1",
      activityId: "rowan-intro",
    });

    expect(save.quests["main-001"]?.state).toBe("completed");

    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-001" });

    expect(save.player.pokedollars).toBe(100);
    expect(save.flags["main-001-complete"]).toBe(true);
    expect(save.quests["main-001"]?.state).toBe("reward-claimed");
  });

  it("completing both combat zones then claiming main-002 unlocks town-2", () => {
    const { save, registry } = createReadySave();

    applySliceAction(save, registry, {
      type: "start_dialogue_activity",
      zoneId: "town-1",
      activityId: "rowan-intro",
    });
    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-001" });
    applySliceAction(save, registry, { type: "complete_zone_debug", zoneId: "route-1" });
    applySliceAction(save, registry, { type: "complete_zone_debug", zoneId: "route-2" });

    expect(save.quests["main-002"]?.state).toBe("completed");
    expect(save.zones["town-2"]?.accessible).toBe(false);

    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-002" });

    expect(save.flags["town-2-unlocked"]).toBe(true);
    expect(save.zones["town-2"]?.accessible).toBe(true);
  });

  it("deriveSliceView returns grouped quests and active zone context", () => {
    const { save, registry } = createReadySave();
    const view = deriveSliceView(save, registry);

    expect(view.activeZone.zone.id).toBe("town-1");
    expect(view.mainQuests).toHaveLength(2);
    expect(view.sideQuests).toHaveLength(1);
    expect(view.worldMapNodes).toHaveLength(4);
    expect(view.currentZoneActivities).toHaveLength(2);
  });
});
