import type { ContentRegistry } from "@pokeidle/content-data";
import type {
  DialogueDocument,
  DialogueLine,
  QuestDefinition,
  QuestProgressState,
  WorldMapLink,
  WorldMapNode,
  ZoneActivityDefinition,
  ZoneDefinition,
  ZoneProgressState,
} from "@pokeidle/contracts";

export type SliceAction =
  | {
      type: "travel_to_zone";
      zoneId: string;
    }
  | {
      type: "start_dialogue_activity";
      zoneId: string;
      activityId: string;
    }
  | {
      type: "advance_dialogue";
    }
  | {
      type: "close_dialogue";
    }
  | {
      type: "complete_zone_debug";
      zoneId: string;
    }
  | {
      type: "win_battle_debug";
      battleId: string;
    }
  | {
      type: "claim_quest_reward";
      questId: string;
    };

export interface SliceQuestObjectiveView {
  progress: number;
  completed: boolean;
  objective: QuestDefinition["objectives"][number];
}

export interface SliceQuestView {
  quest: QuestDefinition;
  progress: QuestProgressState;
  objectives: SliceQuestObjectiveView[];
  canClaim: boolean;
}

export interface SliceWorldMapNodeView {
  node: WorldMapNode;
  zone: ZoneDefinition;
  progress: ZoneProgressState;
  state: "active" | "completed" | "accessible" | "locked";
}

export interface SliceWorldMapLinkView {
  link: WorldMapLink;
  isOpen: boolean;
}

export interface ActiveDialogueView {
  dialogue: DialogueDocument;
  activity: Extract<ZoneActivityDefinition, { kind: "dialogue_npc" }>;
  line: DialogueLine;
  lineIndex: number;
  lineCount: number;
  isLastLine: boolean;
}

export interface ActiveZoneView {
  zone: ZoneDefinition;
  progress: ZoneProgressState;
  sceneKind: "town" | "combat" | "gym";
}

export interface SliceViewState {
  registry: ContentRegistry;
  activeZone: ActiveZoneView;
  accessibleZoneIds: string[];
  neighborZoneIds: string[];
  currentZoneActivities: ZoneActivityDefinition[];
  activeDialogue: ActiveDialogueView | null;
  mainQuests: SliceQuestView[];
  sideQuests: SliceQuestView[];
  worldMapNodes: SliceWorldMapNodeView[];
  worldMapLinks: SliceWorldMapLinkView[];
}
