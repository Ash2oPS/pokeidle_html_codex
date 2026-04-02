import type { ContentRegistry } from "@pokeidle/content-data";
import type {
  BattleDefinition,
  DialogueDocument,
  GameSaveV1,
  QuestDefinition,
  QuestProgressState,
  SliceActiveDialogueState,
  ZoneActivityDefinition,
  ZoneDefinition,
  ZoneProgressState,
} from "@pokeidle/contracts";
import { DEFAULT_ACTIVE_ZONE_ID } from "../save/default-save";
import type {
  ActiveDialogueView,
  ActiveZoneView,
  SliceAction,
  SliceQuestObjectiveView,
  SliceQuestView,
  SliceViewState,
  SliceWorldMapLinkView,
  SliceWorldMapNodeView,
} from "./types";

function createDefaultZoneProgressState(): ZoneProgressState {
  return {
    accessible: false,
    completed: false,
    visible: true,
    bestDefeatCount: 0,
  };
}

function createDefaultQuestProgressState(objectiveCount: number): QuestProgressState {
  return {
    state: "locked",
    objectiveProgress: Array.from({ length: objectiveCount }, () => 0),
  };
}

function isRewardableQuestState(state: QuestProgressState["state"]): boolean {
  return state === "completed";
}

function isSatisfiedQuestState(state: QuestProgressState["state"]): boolean {
  return state === "completed" || state === "reward-claimed";
}

function getNpcTalkFlag(npcId: string): string {
  return `npc:${npcId}:talked`;
}

function getBattleWinFlag(battleId: string): string {
  return `battle:${battleId}:won`;
}

function getStarterQuestIds(registry: ContentRegistry): Set<string> {
  const starterQuestIds = new Set<string>();

  Object.values(registry.zonesById).forEach((zone) => {
    if (zone.kind !== "pacifist") {
      return;
    }

    zone.activities.forEach((activity) => {
      if (activity.kind === "dialogue_npc" && activity.startsQuestId) {
        starterQuestIds.add(activity.startsQuestId);
      }
    });
  });

  return starterQuestIds;
}

function ensureZones(save: GameSaveV1, registry: ContentRegistry): void {
  Object.keys(registry.zonesById).forEach((zoneId) => {
    if (!save.zones[zoneId]) {
      save.zones[zoneId] = createDefaultZoneProgressState();
    }

    save.zones[zoneId].visible = true;
  });

  save.zones[DEFAULT_ACTIVE_ZONE_ID] = {
    ...createDefaultZoneProgressState(),
    ...save.zones[DEFAULT_ACTIVE_ZONE_ID],
    accessible: true,
    visible: true,
  };
}

function ensureQuests(save: GameSaveV1, registry: ContentRegistry): void {
  Object.values(registry.questsById).forEach((quest) => {
    if (!save.quests[quest.id]) {
      save.quests[quest.id] = createDefaultQuestProgressState(quest.objectives.length);
      return;
    }

    const current = save.quests[quest.id]!;
    const nextProgress = current.objectiveProgress.slice(0, quest.objectives.length);
    while (nextProgress.length < quest.objectives.length) {
      nextProgress.push(0);
    }
    current.objectiveProgress = nextProgress;
  });
}

function areQuestPrerequisitesMet(
  save: GameSaveV1,
  quest: QuestDefinition,
): boolean {
  return (
    quest.prerequisiteQuestIds.every((questId) => isSatisfiedQuestState(save.quests[questId]?.state ?? "locked")) &&
    quest.requiredFlags.every((flag) => save.flags[flag] === true)
  );
}

function computeObjectiveProgress(
  save: GameSaveV1,
  objective: QuestDefinition["objectives"][number],
): number {
  if (objective.kind === "talk_to_npc") {
    return save.flags[getNpcTalkFlag(objective.npcId)] ? 1 : 0;
  }

  if (objective.kind === "complete_zone") {
    return save.zones[objective.zoneId]?.completed ? 1 : 0;
  }

  return save.flags[getBattleWinFlag(objective.battleId)] ? 1 : 0;
}

function syncQuestStates(save: GameSaveV1, registry: ContentRegistry): void {
  const starterQuestIds = getStarterQuestIds(registry);

  Object.values(registry.questsById).forEach((quest) => {
    const progress = save.quests[quest.id] ?? createDefaultQuestProgressState(quest.objectives.length);
    progress.objectiveProgress = quest.objectives.map((objective) =>
      computeObjectiveProgress(save, objective),
    );

    if (progress.state === "reward-claimed") {
      save.quests[quest.id] = progress;
      return;
    }

    const prerequisitesMet = areQuestPrerequisitesMet(save, quest);
    const allObjectivesComplete = progress.objectiveProgress.every((value) => value > 0);

    if (allObjectivesComplete) {
      progress.state = "completed";
      save.quests[quest.id] = progress;
      return;
    }

    if (!prerequisitesMet) {
      progress.state = "locked";
      save.quests[quest.id] = progress;
      return;
    }

    if (starterQuestIds.has(quest.id)) {
      progress.state = progress.state === "active" ? "active" : "available";
      save.quests[quest.id] = progress;
      return;
    }

    progress.state = "active";
    save.quests[quest.id] = progress;
  });
}

function canTraverseLink(
  save: GameSaveV1,
  sourceZoneId: string,
  requiresCompletion: boolean,
  unlockFlag?: string,
): boolean {
  if (requiresCompletion && !save.zones[sourceZoneId]?.completed) {
    return false;
  }

  if (unlockFlag && !save.flags[unlockFlag]) {
    return false;
  }

  return true;
}

function syncZoneAccessibility(save: GameSaveV1, registry: ContentRegistry): void {
  const accessibleZoneIds = new Set<string>([
    DEFAULT_ACTIVE_ZONE_ID,
    ...Object.entries(save.zones)
      .filter(([, progress]) => progress.accessible)
      .map(([zoneId]) => zoneId),
  ]);

  let changed = true;

  while (changed) {
    changed = false;

    registry.worldMap.links.forEach((link) => {
      if (!accessibleZoneIds.has(link.fromZoneId)) {
        return;
      }

      if (!canTraverseLink(save, link.fromZoneId, link.requiresCompletion, link.unlockFlag)) {
        return;
      }

      if (!accessibleZoneIds.has(link.toZoneId)) {
        accessibleZoneIds.add(link.toZoneId);
        changed = true;
      }
    });
  }

  Object.keys(registry.zonesById).forEach((zoneId) => {
    const current = save.zones[zoneId] ?? createDefaultZoneProgressState();
    current.visible = true;
    current.accessible = current.accessible || accessibleZoneIds.has(zoneId);
    save.zones[zoneId] = current;
  });
}

function findDialogueActivity(
  zone: ZoneDefinition,
  activityId: string,
): Extract<ZoneActivityDefinition, { kind: "dialogue_npc" }> | null {
  if (zone.kind !== "pacifist") {
    return null;
  }

  const activity = zone.activities.find((entry) => entry.id === activityId);

  return activity?.kind === "dialogue_npc" ? activity : null;
}

function getDialogueByState(
  registry: ContentRegistry,
  state: SliceActiveDialogueState | null,
): DialogueDocument | null {
  if (!state) {
    return null;
  }

  return registry.dialoguesById[state.dialogueId] ?? null;
}

function getBattleById(registry: ContentRegistry, battleId: string): BattleDefinition | null {
  return registry.battlesById[battleId] ?? null;
}

export function syncSliceProgressionState(save: GameSaveV1, registry: ContentRegistry): void {
  ensureZones(save, registry);
  ensureQuests(save, registry);
  syncQuestStates(save, registry);
  syncZoneAccessibility(save, registry);

  if (!save.zones[save.player.activeZoneId]?.accessible) {
    save.player.activeZoneId = DEFAULT_ACTIVE_ZONE_ID;
  }

  const activeDialogue = save.slice.activeDialogue;
  const dialogue = getDialogueByState(registry, activeDialogue);

  if (!activeDialogue || !dialogue) {
    save.slice.activeDialogue = null;
    return;
  }

  const zone = registry.zonesById[activeDialogue.zoneId];
  const activity = zone ? findDialogueActivity(zone, activeDialogue.activityId) : null;

  if (!zone || !activity) {
    save.slice.activeDialogue = null;
    return;
  }

  if (activeDialogue.lineIndex >= dialogue.lines.length) {
    save.slice.activeDialogue = null;
  }
}

export function applySliceAction(
  save: GameSaveV1,
  registry: ContentRegistry,
  action: SliceAction,
): void {
  if (action.type === "travel_to_zone") {
    if (save.zones[action.zoneId]?.accessible) {
      save.player.activeZoneId = action.zoneId;
      save.slice.activeDialogue = null;
    }

    syncSliceProgressionState(save, registry);
    return;
  }

  if (action.type === "start_dialogue_activity") {
    const zone = registry.zonesById[action.zoneId];
    const activity = zone ? findDialogueActivity(zone, action.activityId) : null;

    if (!zone || !activity) {
      syncSliceProgressionState(save, registry);
      return;
    }

    save.flags[getNpcTalkFlag(activity.npcId)] = true;

    if (activity.grantsFlag) {
      save.flags[activity.grantsFlag] = true;
    }

    if (activity.startsQuestId) {
      const quest = registry.questsById[activity.startsQuestId];
      const progress = save.quests[activity.startsQuestId];

      if (quest && progress && !isSatisfiedQuestState(progress.state) && areQuestPrerequisitesMet(save, quest)) {
        progress.state = "active";
      }
    }

    save.slice.activeDialogue = {
      zoneId: zone.id,
      activityId: activity.id,
      dialogueId: activity.dialogueId,
      lineIndex: 0,
    };

    syncSliceProgressionState(save, registry);
    return;
  }

  if (action.type === "advance_dialogue") {
    if (save.slice.activeDialogue) {
      const dialogue = getDialogueByState(registry, save.slice.activeDialogue);

      if (!dialogue || save.slice.activeDialogue.lineIndex >= dialogue.lines.length - 1) {
        save.slice.activeDialogue = null;
      } else {
        save.slice.activeDialogue = {
          ...save.slice.activeDialogue,
          lineIndex: save.slice.activeDialogue.lineIndex + 1,
        };
      }
    }

    syncSliceProgressionState(save, registry);
    return;
  }

  if (action.type === "close_dialogue") {
    save.slice.activeDialogue = null;
    syncSliceProgressionState(save, registry);
    return;
  }

  if (action.type === "complete_zone_debug") {
    const zone = registry.zonesById[action.zoneId];

    if (zone?.kind === "combat") {
      const progress = save.zones[action.zoneId] ?? createDefaultZoneProgressState();
      progress.completed = true;
      progress.bestDefeatCount = Math.max(progress.bestDefeatCount, zone.battle.defeatsRequired);
      progress.accessible = true;
      save.zones[action.zoneId] = progress;
    }

    syncSliceProgressionState(save, registry);
    return;
  }

  if (action.type === "win_battle_debug") {
    const battle = getBattleById(registry, action.battleId);

    if (battle) {
      save.flags[getBattleWinFlag(battle.id)] = true;

      if (battle.unlockFlagOnWin) {
        save.flags[battle.unlockFlagOnWin] = true;
      }
    }

    syncSliceProgressionState(save, registry);
    return;
  }

  if (action.type === "claim_quest_reward") {
    const quest = registry.questsById[action.questId];
    const progress = save.quests[action.questId];

    if (!quest || !progress || !isRewardableQuestState(progress.state)) {
      syncSliceProgressionState(save, registry);
      return;
    }

    quest.rewards.forEach((reward) => {
      if (reward.kind === "pokedollars") {
        save.player.pokedollars += reward.amount;
        return;
      }

      save.flags[reward.flag] = true;
    });

    progress.state = "reward-claimed";
    syncSliceProgressionState(save, registry);
  }
}

function getActiveZoneView(
  save: GameSaveV1,
  registry: ContentRegistry,
): ActiveZoneView {
  const zone = (registry.zonesById[save.player.activeZoneId] ??
    registry.zonesById[DEFAULT_ACTIVE_ZONE_ID])!;
  const progress = save.zones[zone.id] ?? createDefaultZoneProgressState();

  return {
    zone,
    progress,
    sceneKind: zone.kind === "combat" ? "combat" : "town",
  };
}

function getActiveDialogueView(
  save: GameSaveV1,
  registry: ContentRegistry,
): ActiveDialogueView | null {
  const activeDialogue = save.slice.activeDialogue;
  const dialogue = getDialogueByState(registry, activeDialogue);

  if (!activeDialogue || !dialogue) {
    return null;
  }

  const zone = registry.zonesById[activeDialogue.zoneId];
  const activity = zone ? findDialogueActivity(zone, activeDialogue.activityId) : null;
  const line = dialogue.lines[activeDialogue.lineIndex];

  if (!zone || !activity || !line) {
    return null;
  }

  return {
    dialogue,
    activity,
    line,
    lineIndex: activeDialogue.lineIndex,
    lineCount: dialogue.lines.length,
    isLastLine: activeDialogue.lineIndex >= dialogue.lines.length - 1,
  };
}

function getQuestViews(
  save: GameSaveV1,
  registry: ContentRegistry,
  category: QuestDefinition["category"],
): SliceQuestView[] {
  return Object.values(registry.questsById)
    .filter((quest) => quest.category === category)
    .map((quest) => {
      const progress = save.quests[quest.id] ?? createDefaultQuestProgressState(quest.objectives.length);
      const objectives = quest.objectives.map<SliceQuestObjectiveView>((objective, index) => {
        const objectiveProgress = progress.objectiveProgress[index] ?? 0;

        return {
          progress: objectiveProgress,
          completed: objectiveProgress > 0,
          objective,
        };
      });

      return {
        quest,
        progress,
        objectives,
        canClaim: progress.state === "completed",
      };
    });
}

function getMapNodeState(
  zoneId: string,
  activeZoneId: string,
  progress: ZoneProgressState,
): SliceWorldMapNodeView["state"] {
  if (zoneId === activeZoneId) {
    return "active";
  }

  if (progress.completed) {
    return "completed";
  }

  if (progress.accessible) {
    return "accessible";
  }

  return "locked";
}

function getWorldMapViews(
  save: GameSaveV1,
  registry: ContentRegistry,
): {
  nodes: SliceWorldMapNodeView[];
  links: SliceWorldMapLinkView[];
} {
  return {
    nodes: registry.worldMap.nodes.map((node) => {
      const zone = registry.zonesById[node.zoneId]!;
      const progress = save.zones[node.zoneId] ?? createDefaultZoneProgressState();

      return {
        node,
        zone,
        progress,
        state: getMapNodeState(node.zoneId, save.player.activeZoneId, progress),
      };
    }),
    links: registry.worldMap.links.map((link) => ({
      link,
      isOpen:
        save.zones[link.fromZoneId]?.accessible === true &&
        canTraverseLink(save, link.fromZoneId, link.requiresCompletion, link.unlockFlag),
    })),
  };
}

export function deriveSliceView(
  save: GameSaveV1,
  registry: ContentRegistry,
): SliceViewState {
  const activeZone = getActiveZoneView(save, registry);
  const mapViews = getWorldMapViews(save, registry);
  const neighborZoneIds = Array.from(
    new Set(
      registry.worldMap.links.flatMap((link) => {
        if (link.fromZoneId === activeZone.zone.id) {
          return [link.toZoneId];
        }

        if (link.toZoneId === activeZone.zone.id) {
          return [link.fromZoneId];
        }

        return [];
      }),
    ),
  );

  return {
    registry,
    activeZone,
    accessibleZoneIds: Object.entries(save.zones)
      .filter(([, progress]) => progress.accessible)
      .map(([zoneId]) => zoneId),
    neighborZoneIds,
    currentZoneActivities: activeZone.zone.kind === "pacifist" ? activeZone.zone.activities : [],
    activeDialogue: getActiveDialogueView(save, registry),
    mainQuests: getQuestViews(save, registry, "main"),
    sideQuests: getQuestViews(save, registry, "side"),
    worldMapNodes: mapViews.nodes,
    worldMapLinks: mapViews.links,
  };
}
