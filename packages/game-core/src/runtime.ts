import type { ContentRegistry } from "@pokeidle/content-data";
import type { GameSaveV1 } from "@pokeidle/contracts";
import { syncCombatState } from "./combat/runtime";
import { syncRosterState } from "./roster/runtime";
import { syncSliceProgressionState } from "./slice/runtime";

export function syncGameRuntimeState(
  save: GameSaveV1,
  registry: ContentRegistry,
  nowIso = new Date().toISOString(),
): void {
  syncRosterState(save, registry);
  syncCombatState(save, registry, nowIso);
  syncSliceProgressionState(save, registry);
}
