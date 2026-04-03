import type { CombatResolvedAttackEvent } from "@pokeidle/contracts";
import { describe, expect, it } from "vitest";
import { buildBattleSceneLayout } from "./battle-scene-layout";
import {
  AnimationDirector,
  ATTACK_IMPACT_TIME_MS,
  getAttackAnimationBudget,
  sampleAttackAnimationFrame,
  type BattleAttackVisualEvent,
} from "./attack-animation";

function createEvent(
  overrides: Partial<BattleAttackVisualEvent> = {},
): BattleAttackVisualEvent {
  const baseEvent: CombatResolvedAttackEvent = {
    eventKey: "event-001",
    sessionKey: "wild:route-1:test",
    slotIndex: 0,
    attackerSpeciesId: "chimchar",
    enemySpeciesId: "starly",
    offensiveType: "fire",
    attackClass: "physical",
    damage: 12,
    didDefeatEnemy: false,
    reactionOutcome: "none",
    enemyHpBefore: 40,
    enemyHpAfter: 28,
    enemyMaxHp: 40,
  };

  return {
    ...baseEvent,
    attackerFrontSpriteUrl: "/attacker.png",
    attackerLabel: "Chimchar",
    enemyFrontSpriteUrl: "/enemy.png",
    enemyLabel: "Starly",
    ...overrides,
  };
}

describe("attack animation helpers", () => {
  it("keeps physical and special impact timing aligned at 180ms", () => {
    const desktopLayout = buildBattleSceneLayout("desktop-landscape", 1280, 720);
    const physicalEvent = createEvent({ attackClass: "physical" });
    const specialEvent = createEvent({
      attackClass: "special",
      offensiveType: "water",
      attackerSpeciesId: "piplup",
      eventKey: "event-002",
    });

    const physicalBefore = sampleAttackAnimationFrame(
      physicalEvent,
      "desktop-landscape",
      desktopLayout.slots[0]!,
      desktopLayout.enemy,
      ATTACK_IMPACT_TIME_MS - 1,
    );
    const physicalAfter = sampleAttackAnimationFrame(
      physicalEvent,
      "desktop-landscape",
      desktopLayout.slots[0]!,
      desktopLayout.enemy,
      ATTACK_IMPACT_TIME_MS + 1,
    );
    const specialBefore = sampleAttackAnimationFrame(
      specialEvent,
      "desktop-landscape",
      desktopLayout.slots[0]!,
      desktopLayout.enemy,
      ATTACK_IMPACT_TIME_MS - 1,
    );
    const specialAfter = sampleAttackAnimationFrame(
      specialEvent,
      "desktop-landscape",
      desktopLayout.slots[0]!,
      desktopLayout.enemy,
      ATTACK_IMPACT_TIME_MS + 1,
    );

    expect(physicalBefore.impactProgress).toBe(0);
    expect(physicalAfter.impactProgress).toBeGreaterThan(0);
    expect(specialBefore.impactProgress).toBe(0);
    expect(specialBefore.projectileVisible).toBe(true);
    expect(specialAfter.impactProgress).toBeGreaterThan(0);
    expect(specialAfter.projectileVisible).toBe(false);
  });

  it("reduces animation budgets on mobile portrait", () => {
    const desktopBudget = getAttackAnimationBudget("desktop-landscape");
    const mobileBudget = getAttackAnimationBudget("mobile-portrait");

    expect(mobileBudget.chargeDistance).toBeLessThan(desktopBudget.chargeDistance);
    expect(mobileBudget.projectileSize).toBeLessThan(desktopBudget.projectileSize);
    expect(mobileBudget.trailParticleCount).toBeLessThan(desktopBudget.trailParticleCount);
    expect(mobileBudget.impactParticleCount).toBeLessThan(desktopBudget.impactParticleCount);
    expect(mobileBudget.enemyPunchAmplitude).toBeLessThan(desktopBudget.enemyPunchAmplitude);
  });

  it("keeps physical charge movement short instead of reaching the enemy center", () => {
    const desktopLayout = buildBattleSceneLayout("desktop-landscape", 1280, 720);
    const physicalEvent = createEvent({ attackClass: "physical" });
    const frameAtImpact = sampleAttackAnimationFrame(
      physicalEvent,
      "desktop-landscape",
      desktopLayout.slots[0]!,
      desktopLayout.enemy,
      ATTACK_IMPACT_TIME_MS,
    );
    const travelDistance = Math.hypot(
      frameAtImpact.attackerCenterX - desktopLayout.slots[0]!.centerX,
      frameAtImpact.attackerCenterY - desktopLayout.slots[0]!.centerY,
    );
    const enemyDistance = Math.hypot(
      desktopLayout.enemy.centerX - desktopLayout.slots[0]!.centerX,
      desktopLayout.enemy.centerY - desktopLayout.slots[0]!.centerY,
    );

    expect(travelDistance).toBeLessThan(enemyDistance * 0.5);
    expect(travelDistance).toBeCloseTo(getAttackAnimationBudget("desktop-landscape").chargeDistance, 0);
  });

  it("bounds queued events and resets on session change", () => {
    const director = new AnimationDirector();
    const batch = [
      createEvent({ eventKey: "event-a" }),
      createEvent({ eventKey: "event-b" }),
      createEvent({ eventKey: "event-c" }),
      createEvent({ eventKey: "event-d" }),
    ];

    director.enqueue("wild:route-1:test", batch, 100);

    expect(director.peek(100)?.event.eventKey).toBe("event-a");
    expect(director.getQueuedCount()).toBe(2);

    director.enqueue("gym:gym-001:test", [createEvent({ eventKey: "event-z" })], 200);

    expect(director.peek(200)?.event.eventKey).toBe("event-z");
    expect(director.getQueuedCount()).toBe(0);
  });
});
