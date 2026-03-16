import { createRouteEncounterCombatSystem } from "../systems/encounter/route-encounter-combat-system.js";
import { createBattleLifecycleSystem } from "../systems/combat/battle-lifecycle-system.js";
import { createRewardProgressionSystem } from "../systems/progression/reward-progression-system.js";
import { createRuntimeNotificationSystem } from "../systems/notifications/runtime-notification-system.js";
import { createRuntimeHudSystem } from "../systems/ui/runtime-hud-system.js";

export function createRuntimeCompositionRoot({
  rewardProgressionDeps,
  notificationDeps,
  routeEncounterCombatDeps,
  battleLifecycleDeps,
  runtimeHudDeps,
} = {}) {
  const rewardProgressionSystem = createRewardProgressionSystem(rewardProgressionDeps);
  const runtimeNotificationSystem = createRuntimeNotificationSystem(notificationDeps);
  const routeEncounterCombatSystem = createRouteEncounterCombatSystem(routeEncounterCombatDeps);
  const battleLifecycleSystem = createBattleLifecycleSystem(battleLifecycleDeps);
  const runtimeHudSystem = createRuntimeHudSystem(runtimeHudDeps);

  return {
    rewardProgressionSystem,
    runtimeNotificationSystem,
    routeEncounterCombatSystem,
    battleLifecycleSystem,
    runtimeHudSystem,
  };
}
