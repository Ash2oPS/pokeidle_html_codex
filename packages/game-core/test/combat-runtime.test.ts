import { loadContentRegistry } from "@pokeidle/content-data";
import type { BattleEnemyState, GameSaveV1 } from "@pokeidle/contracts";
import { describe, expect, it } from "vitest";
import {
  applySliceAction,
  canStartGymBattle,
  chooseStarter,
  ensureSpeciesProgress,
  getSpeciesGuard,
  getSpeciesMaxHp,
  getSpeciesOffense,
  setTeamSlot,
  startGymBattle,
  startWildBattle,
  syncCombatState,
  syncGameRuntimeState,
  unlockSpecies,
} from "../src";
import { getTypeMultiplier } from "../src/combat/type-chart";
import { createDefaultGameSave } from "../src/save/default-save";

function createReadySave(nowIso = "2026-04-02T10:00:00.000Z") {
  const registry = loadContentRegistry();
  const save = createDefaultGameSave(nowIso);
  syncGameRuntimeState(save, registry, nowIso);
  return { save, registry, nowIso };
}

function createStarterSave(
  starterId: "turtwig" | "chimchar" | "piplup" = "piplup",
  nowIso = "2026-04-02T10:00:00.000Z",
) {
  const { save, registry } = createReadySave(nowIso);
  chooseStarter(save, registry, starterId);
  syncGameRuntimeState(save, registry, nowIso);
  return { save, registry, nowIso };
}

function setSpeciesLevel(save: GameSaveV1, speciesId: string, level: number) {
  const progress = ensureSpeciesProgress(save, speciesId);
  progress.level = level;
  progress.experience = 0;
  progress.highestLevelReached = Math.max(progress.highestLevelReached, level);
}

function createEnemyState(
  save: GameSaveV1,
  speciesId: string,
  level: number,
) {
  const registry = loadContentRegistry();
  const species = registry.speciesById[speciesId]!;
  const maxHp = getSpeciesMaxHp(species, level, registry.progression);

  save.battle.activeSession = {
    kind: "wild",
    zoneId: "route-1",
    startedAt: "2026-04-02T10:00:00.000Z",
    lastProcessedAt: "2026-04-02T10:00:00.000Z",
    currentSlotIndex: 0,
    elapsedMs: 0,
    defeatsThisRun: 0,
    rngState: 12345,
    enemy: {
      speciesId,
      level,
      currentHp: maxHp,
      maxHp,
      defensiveTypes: [...species.defensiveTypes],
      reactionState: null,
    },
  };
}

describe("combat foundation runtime", () => {
  it("starter choice populates starter state, unlocks the bundle, and seeds the initial team", () => {
    const { save, registry } = createReadySave();

    chooseStarter(save, registry, "chimchar");
    syncGameRuntimeState(save, registry);

    expect(save.player.starterChoice).toBe("chimchar");
    expect(save.player.unlockedSpeciesIds).toEqual(
      expect.arrayContaining([
        "chimchar",
        "starly",
        "bidoof",
        "shinx",
        "zubat",
        "geodude",
        "machop",
      ]),
    );
    expect(save.player.teamSlots).toEqual(["chimchar", "starly", "bidoof", null, null, null]);
    expect(save.species["chimchar"]?.unlocked).toBe(true);
  });

  it("team slot edits preserve slot order and empty slots", () => {
    const { save, registry } = createStarterSave();

    setTeamSlot(save, registry, 1, "zubat");
    setTeamSlot(save, registry, 2, null);
    syncGameRuntimeState(save, registry);

    expect(save.player.teamSlots).toEqual(["piplup", "zubat", null, null, null, null]);
  });

  it("background reconstruction advances combat deterministically", () => {
    const { save, registry, nowIso } = createStarterSave();
    const steppedSave = structuredClone(save);
    const bulkSave = structuredClone(save);

    startWildBattle(steppedSave, registry, "route-1", nowIso);
    startWildBattle(bulkSave, registry, "route-1", nowIso);

    syncCombatState(steppedSave, registry, "2026-04-02T10:00:01.000Z");
    syncCombatState(steppedSave, registry, "2026-04-02T10:00:02.000Z");
    syncCombatState(steppedSave, registry, "2026-04-02T10:00:03.000Z");

    syncCombatState(bulkSave, registry, "2026-04-02T10:00:03.000Z");

    expect(bulkSave.battle.activeSession).toEqual(steppedSave.battle.activeSession);
    expect(bulkSave.player.pokedollars).toBe(steppedSave.player.pokedollars);
    expect(bulkSave.species).toEqual(steppedSave.species);
  });

  it("empty slots consume time and do not attack", () => {
    const { save, registry, nowIso } = createStarterSave();

    save.player.teamSlots = [null, null, null, null, null, null];
    startWildBattle(save, registry, "route-1", nowIso);
    const session = save.battle.activeSession;

    expect(session?.kind).toBe("wild");
    const initialHp = session?.enemy.currentHp ?? 0;

    syncCombatState(save, registry, "2026-04-02T10:00:01.000Z");

    expect(save.battle.activeSession?.currentSlotIndex).toBe(1);
    expect(save.battle.activeSession?.elapsedMs).toBe(1000);
    expect(save.battle.activeSession?.enemy.currentHp).toBe(initialHp);
  });

  it("wild battles increment defeat count, grant money, and respawn the next enemy", () => {
    const { save, registry, nowIso } = createStarterSave();

    ["piplup", "starly", "bidoof"].forEach((speciesId) => {
      setSpeciesLevel(save, speciesId, 40);
    });

    startWildBattle(save, registry, "route-1", nowIso);
    const firstEnemy = save.battle.activeSession?.enemy.speciesId;

    syncCombatState(save, registry, "2026-04-02T10:00:06.000Z");

    expect(save.battle.activeSession?.kind).toBe("wild");
    expect(save.battle.activeSession?.defeatsThisRun).toBeGreaterThan(0);
    expect(save.player.pokedollars).toBeGreaterThanOrEqual(registry.progression.wildPokedollars);
    expect(save.battle.activeSession?.enemy.currentHp).toBe(save.battle.activeSession?.enemy.maxHp);
    expect(firstEnemy).not.toBeUndefined();
  });

  it("wild battle timeout resets the current defeat streak", () => {
    const { save, registry, nowIso } = createStarterSave();

    save.player.teamSlots = [null, null, null, null, null, null];
    startWildBattle(save, registry, "route-1", nowIso);

    if (save.battle.activeSession?.kind !== "wild") {
      throw new Error("Expected a wild battle session.");
    }

    save.battle.activeSession.defeatsThisRun = 3;
    const firstEnemy = save.battle.activeSession.enemy.speciesId;

    syncCombatState(save, registry, "2026-04-02T10:00:09.000Z");

    expect(save.battle.activeSession?.kind).toBe("wild");
    expect(save.battle.activeSession?.defeatsThisRun).toBe(0);
    expect(save.battle.activeSession?.elapsedMs).toBe(0);
    expect(save.battle.activeSession?.enemy.currentHp).toBe(save.battle.activeSession?.enemy.maxHp);
    expect(save.battle.activeSession?.enemy.speciesId).toBeDefined();
    expect(firstEnemy).toBeDefined();
  });

  it("gym entry is blocked when the team exceeds the battle size limit", () => {
    const { save, registry, nowIso } = createStarterSave();
    const battle = registry.battlesById["gym-001"]!;

    setTeamSlot(save, registry, 3, "shinx");

    expect(canStartGymBattle(save, battle)).toBe(false);
    expect(startGymBattle(save, registry, "town-2", "gym-001", nowIso)).toBe(false);
    expect(save.battle.activeSession).toBeNull();
  });

  it("gym victory sets the battle and unlock flags and clears the active session", () => {
    const { save, registry, nowIso } = createStarterSave();

    setSpeciesLevel(save, "piplup", 300);
    save.player.teamSlots = ["piplup", "piplup", "piplup", null, null, null];

    expect(startGymBattle(save, registry, "town-2", "gym-001", nowIso)).toBe(true);

    syncCombatState(save, registry, "2026-04-02T10:01:00.000Z");
    syncGameRuntimeState(save, registry, "2026-04-02T10:01:00.000Z");

    expect(save.battle.activeSession).toBeNull();
    expect(save.flags["battle:gym-001:won"]).toBe(true);
    expect(save.flags["oreburgh-gym-cleared"]).toBe(true);
    expect(save.player.pokedollars).toBeGreaterThanOrEqual(registry.progression.gymClearPokedollars);
  });

  it("gym timeout loses and clears the session without setting victory flags", () => {
    const { save, registry, nowIso } = createStarterSave();

    save.player.teamSlots = [null, null, null, null, null, null];
    expect(startGymBattle(save, registry, "town-2", "gym-001", nowIso)).toBe(true);

    syncCombatState(save, registry, "2026-04-02T10:01:31.000Z");

    expect(save.battle.activeSession).toBeNull();
    expect(save.flags["battle:gym-001:won"]).toBeUndefined();
    expect(save.flags["oreburgh-gym-cleared"]).toBeUndefined();
  });

  it("applies the wet then electric reaction multiplier exactly", () => {
    const { save, registry } = createStarterSave();

    setSpeciesLevel(save, "piplup", 10);
    setSpeciesLevel(save, "shinx", 10);
    save.player.teamSlots = ["piplup", "shinx", null, null, null, null];
    createEnemyState(save, "starly", 2);

    syncCombatState(save, registry, "2026-04-02T10:00:01.000Z");
    const afterWater = save.battle.activeSession?.enemy.currentHp ?? 0;

    syncCombatState(save, registry, "2026-04-02T10:00:02.000Z");

    const enemyAfterElectric = save.battle.activeSession?.enemy as BattleEnemyState;
    const shinx = registry.speciesById["shinx"]!;
    const starly = registry.speciesById["starly"]!;
    const expectedDamage = Math.max(
      1,
      Math.round(
        (getSpeciesOffense(shinx, 10, registry.progression) /
          Math.max(1, getSpeciesGuard(starly, 2, registry.progression))) *
          registry.progression.damageConstant *
          getTypeMultiplier("electric", starly.defensiveTypes) *
          1.5,
      ),
    );

    expect(afterWater - enemyAfterElectric.currentHp).toBe(expectedDamage);
    expect(enemyAfterElectric.reactionState).toBeNull();
  });

  it("applies the wet then fire reaction multiplier exactly", () => {
    const { save, registry } = createStarterSave();

    unlockSpecies(save, registry, "chimchar");
    setSpeciesLevel(save, "piplup", 10);
    setSpeciesLevel(save, "chimchar", 10);
    save.player.teamSlots = ["piplup", "chimchar", null, null, null, null];
    createEnemyState(save, "starly", 2);

    syncCombatState(save, registry, "2026-04-02T10:00:01.000Z");
    const afterWater = save.battle.activeSession?.enemy.currentHp ?? 0;

    syncCombatState(save, registry, "2026-04-02T10:00:02.000Z");

    const enemyAfterFire = save.battle.activeSession?.enemy as BattleEnemyState;
    const chimchar = registry.speciesById["chimchar"]!;
    const starly = registry.speciesById["starly"]!;
    const expectedDamage = Math.max(
      1,
      Math.round(
        (getSpeciesOffense(chimchar, 10, registry.progression) /
          Math.max(1, getSpeciesGuard(starly, 2, registry.progression))) *
          registry.progression.damageConstant *
          getTypeMultiplier("fire", starly.defensiveTypes) *
          0.5,
      ),
    );

    expect(afterWater - enemyAfterFire.currentHp).toBe(expectedDamage);
    expect(enemyAfterFire.reactionState).toBeNull();
  });

  it("applies canonical type multipliers for mono and dual typings", () => {
    expect(getTypeMultiplier("electric", ["water"])).toBe(2);
    expect(getTypeMultiplier("electric", ["water", "flying"])).toBe(4);
    expect(getTypeMultiplier("normal", ["ghost"])).toBe(0);
  });

  it("real combat completion still unlocks town-2 through the existing progression chain", () => {
    const { save, registry, nowIso } = createStarterSave();

    setSpeciesLevel(save, "piplup", 300);
    save.player.teamSlots = ["piplup", "piplup", "piplup", null, null, null];

    applySliceAction(save, registry, {
      type: "start_dialogue_activity",
      zoneId: "town-1",
      activityId: "rowan-intro",
    });
    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-001" });

    startWildBattle(save, registry, "route-1", nowIso);
    syncGameRuntimeState(save, registry, "2026-04-02T10:00:40.000Z");

    startWildBattle(save, registry, "route-2", "2026-04-02T10:00:40.000Z");
    syncGameRuntimeState(save, registry, "2026-04-02T10:01:40.000Z");

    expect(save.zones["route-1"]?.completed).toBe(true);
    expect(save.zones["route-2"]?.completed).toBe(true);
    expect(save.quests["main-002"]?.state).toBe("completed");

    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-002" });

    expect(save.flags["town-2-unlocked"]).toBe(true);
    expect(save.zones["town-2"]?.accessible).toBe(true);
  });

  it("winning the real gym battle completes the side quest after talking to the gym guide", () => {
    const { save, registry, nowIso } = createStarterSave();

    setSpeciesLevel(save, "piplup", 300);
    save.player.teamSlots = ["piplup", "piplup", "piplup", null, null, null];

    applySliceAction(save, registry, {
      type: "start_dialogue_activity",
      zoneId: "town-1",
      activityId: "rowan-intro",
    });
    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-001" });

    startWildBattle(save, registry, "route-1", nowIso);
    syncGameRuntimeState(save, registry, "2026-04-02T10:00:40.000Z");
    startWildBattle(save, registry, "route-2", "2026-04-02T10:00:40.000Z");
    syncGameRuntimeState(save, registry, "2026-04-02T10:01:40.000Z");
    applySliceAction(save, registry, { type: "claim_quest_reward", questId: "main-002" });

    applySliceAction(save, registry, {
      type: "start_dialogue_activity",
      zoneId: "town-2",
      activityId: "gym-guide-intro",
    });

    expect(save.quests["side-001"]?.state).toBe("active");

    expect(startGymBattle(save, registry, "town-2", "gym-001", "2026-04-02T10:01:40.000Z")).toBe(true);
    syncGameRuntimeState(save, registry, "2026-04-02T10:02:40.000Z");

    expect(save.flags["battle:gym-001:won"]).toBe(true);
    expect(save.quests["side-001"]?.state).toBe("completed");
  });
});
