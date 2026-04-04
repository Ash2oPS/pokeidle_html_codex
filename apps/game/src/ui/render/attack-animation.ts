import type {
  CombatResolvedAttackEvent,
  LayoutMode,
} from "@pokeidle/contracts";
import type { BattleEnemyLayout, BattleSlotLayout } from "./battle-scene-layout";

export interface BattleAttackVisualEvent extends CombatResolvedAttackEvent {
  attackerFrontSpriteUrl: string | null;
  attackerLabel: string | null;
  enemyFrontSpriteUrl: string | null;
  enemyLabel: string | null;
}

export const ATTACK_ANIMATION_DURATION_MS = 360;
export const ATTACK_IMPACT_TIME_MS = 180;

const ATTACK_ANTICIPATION_END_MS = 60;
const ENEMY_FLASH_DURATION_MS = 60;

export interface AttackAnimationBudget {
  chargeDistance: number;
  projectileSize: number;
  trailParticleCount: number;
  impactParticleCount: number;
  enemyPunchAmplitude: number;
  enemyPunchDurationMs: number;
  enemyFlashDurationMs: number;
}

export interface ActiveAttackPlayback {
  event: BattleAttackVisualEvent;
  startedAtMs: number;
  elapsedMs: number;
}

export interface AttackAnimationFrame {
  attackerCenterX: number;
  attackerCenterY: number;
  attackerScale: number;
  projectileVisible: boolean;
  projectileCenterX: number | null;
  projectileCenterY: number | null;
  projectileSize: number;
  impactProgress: number;
  displayEnemyHpPercent: number;
  displayEnemyHpValue: number;
  enemyOffsetX: number;
  enemyOffsetY: number;
  enemyScaleX: number;
  enemyScaleY: number;
  enemyFlashAlpha: number;
  trailParticleCount: number;
  impactParticleCount: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function easeOutCubic(value: number): number {
  const clamped = clamp(value, 0, 1);
  return 1 - (1 - clamped) ** 3;
}

function easeInOutQuad(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped < 0.5 ? 2 * clamped * clamped : 1 - ((-2 * clamped + 2) ** 2) / 2;
}

function getNormalizedDirection(slot: BattleSlotLayout, enemy: BattleEnemyLayout) {
  const deltaX = enemy.centerX - slot.centerX;
  const deltaY = enemy.centerY - slot.centerY;
  const length = Math.hypot(deltaX, deltaY) || 1;

  return {
    x: deltaX / length,
    y: deltaY / length,
  };
}

function getContactPoint(slot: BattleSlotLayout, enemy: BattleEnemyLayout) {
  const direction = getNormalizedDirection(slot, enemy);
  return {
    x: enemy.centerX - direction.x * enemy.spriteSize * 0.18,
    y: enemy.centerY - direction.y * enemy.spriteSize * 0.18,
    direction,
  };
}

function getChargeTargetPoint(
  slot: BattleSlotLayout,
  enemy: BattleEnemyLayout,
  chargeDistance: number,
) {
  const direction = getNormalizedDirection(slot, enemy);

  return {
    x: slot.centerX + direction.x * chargeDistance,
    y: slot.centerY + direction.y * chargeDistance,
    direction,
  };
}

export function getAttackAnimationBudget(layoutMode: LayoutMode): AttackAnimationBudget {
  return layoutMode === "mobile-portrait"
    ? {
        chargeDistance: 18,
        projectileSize: 14,
        trailParticleCount: 2,
        impactParticleCount: 4,
        enemyPunchAmplitude: 5,
        enemyPunchDurationMs: 100,
        enemyFlashDurationMs: ENEMY_FLASH_DURATION_MS,
      }
    : {
        chargeDistance: 26,
        projectileSize: 18,
        trailParticleCount: 4,
        impactParticleCount: 6,
        enemyPunchAmplitude: 8,
        enemyPunchDurationMs: 100,
        enemyFlashDurationMs: ENEMY_FLASH_DURATION_MS,
      };
}

export function getAttackAnimationSeed(eventKey: string): number {
  let seed = 0;

  for (let index = 0; index < eventKey.length; index += 1) {
    seed = (seed * 33 + eventKey.charCodeAt(index)) >>> 0;
  }

  return seed || 1;
}

export function sampleAttackAnimationFrame(
  event: BattleAttackVisualEvent,
  layoutMode: LayoutMode,
  slot: BattleSlotLayout,
  enemy: BattleEnemyLayout,
  elapsedMs: number,
): AttackAnimationFrame {
  const clampedElapsed = clamp(elapsedMs, 0, ATTACK_ANIMATION_DURATION_MS);
  const budget = getAttackAnimationBudget(layoutMode);
  const { x: impactX, y: impactY, direction } = getContactPoint(slot, enemy);
  const { x: chargeTargetX, y: chargeTargetY } = getChargeTargetPoint(
    slot,
    enemy,
    budget.chargeDistance,
  );
  const originX = slot.centerX;
  const originY = slot.centerY;
  let attackerCenterX = originX;
  let attackerCenterY = originY;
  let attackerScale = 1;
  let projectileVisible = false;
  let projectileCenterX: number | null = null;
  let projectileCenterY: number | null = null;

  if (event.attackClass === "physical") {
    const anticipationDistance = Math.max(3, Math.round(budget.chargeDistance * 0.2));

    if (clampedElapsed <= ATTACK_ANTICIPATION_END_MS) {
      const anticipation = easeOutCubic(clampedElapsed / ATTACK_ANTICIPATION_END_MS);
      attackerCenterX = originX - direction.x * anticipationDistance * anticipation;
      attackerCenterY = originY - direction.y * anticipationDistance * anticipation;
      attackerScale = lerp(1, 1.06, anticipation);
    } else if (clampedElapsed <= ATTACK_IMPACT_TIME_MS) {
      const travel = easeInOutQuad(
        (clampedElapsed - ATTACK_ANTICIPATION_END_MS) /
          (ATTACK_IMPACT_TIME_MS - ATTACK_ANTICIPATION_END_MS),
      );
      attackerCenterX = lerp(originX, chargeTargetX, travel);
      attackerCenterY = lerp(originY, chargeTargetY, travel);
      attackerScale = lerp(1.06, 0.98, travel);
    } else {
      const settle = easeOutCubic(
        (clampedElapsed - ATTACK_IMPACT_TIME_MS) /
          (ATTACK_ANIMATION_DURATION_MS - ATTACK_IMPACT_TIME_MS),
      );
      attackerCenterX = lerp(chargeTargetX, originX, settle);
      attackerCenterY = lerp(chargeTargetY, originY, settle);
      attackerScale = lerp(0.98, 1, settle);
    }
  } else {
    const recoilDistance = layoutMode === "mobile-portrait" ? 5 : 8;

    if (clampedElapsed <= ATTACK_ANTICIPATION_END_MS) {
      const anticipation = easeOutCubic(clampedElapsed / ATTACK_ANTICIPATION_END_MS);
      attackerCenterX = originX - direction.x * recoilDistance * anticipation;
      attackerCenterY = originY - direction.y * recoilDistance * anticipation;
      attackerScale = lerp(1, 1.05, anticipation);
    } else if (clampedElapsed <= ATTACK_IMPACT_TIME_MS) {
      const settle = easeOutCubic(
        (clampedElapsed - ATTACK_ANTICIPATION_END_MS) /
          (ATTACK_IMPACT_TIME_MS - ATTACK_ANTICIPATION_END_MS),
      );
      attackerCenterX = lerp(originX - direction.x * recoilDistance, originX, settle);
      attackerCenterY = lerp(originY - direction.y * recoilDistance, originY, settle);
      attackerScale = lerp(1.05, 1, settle);
      projectileVisible = true;
      const projectileProgress = easeInOutQuad(
        (clampedElapsed - ATTACK_ANTICIPATION_END_MS) /
          (ATTACK_IMPACT_TIME_MS - ATTACK_ANTICIPATION_END_MS),
      );
      projectileCenterX = lerp(originX, impactX, projectileProgress);
      projectileCenterY = lerp(originY, impactY, projectileProgress);
    }
  }

  const postImpactMs = Math.max(0, clampedElapsed - ATTACK_IMPACT_TIME_MS);
  const punchProgress = clamp(postImpactMs / budget.enemyPunchDurationMs, 0, 1);
  const punchWave = Math.sin(punchProgress * Math.PI);
  const enemyOffsetX = direction.x * budget.enemyPunchAmplitude * punchWave;
  const enemyOffsetY = direction.y * budget.enemyPunchAmplitude * punchWave;
  const enemyScaleX = lerp(1.06, 1, punchProgress);
  const enemyScaleY = lerp(0.94, 1, punchProgress);
  const enemyFlashAlpha = 1 - clamp(postImpactMs / budget.enemyFlashDurationMs, 0, 1);
  const impactProgress = clamp(postImpactMs / 120, 0, 1);
  const hpProgress = clamp(postImpactMs / 100, 0, 1);
  const displayEnemyHpPercent =
    event.enemyMaxHp > 0
      ? lerp(event.enemyHpBefore / event.enemyMaxHp, event.enemyHpAfter / event.enemyMaxHp, hpProgress)
      : 0;
  const displayEnemyHpValue = Math.round(lerp(event.enemyHpBefore, event.enemyHpAfter, hpProgress));

  return {
    attackerCenterX,
    attackerCenterY,
    attackerScale,
    projectileVisible,
    projectileCenterX,
    projectileCenterY,
    projectileSize: budget.projectileSize,
    impactProgress,
    displayEnemyHpPercent,
    displayEnemyHpValue,
    enemyOffsetX,
    enemyOffsetY,
    enemyScaleX,
    enemyScaleY,
    enemyFlashAlpha,
    trailParticleCount: budget.trailParticleCount,
    impactParticleCount: budget.impactParticleCount,
  };
}

export class AnimationDirector {
  private sessionKey: string | null = null;
  private active: { event: BattleAttackVisualEvent; startedAtMs: number } | null = null;
  private queue: BattleAttackVisualEvent[] = [];

  reset(sessionKey: string | null = null): void {
    this.sessionKey = sessionKey;
    this.active = null;
    this.queue = [];
  }

  enqueue(
    sessionKey: string | null,
    events: BattleAttackVisualEvent[],
    nowMs: number,
  ): void {
    if (!sessionKey) {
      this.reset(null);
      return;
    }

    if (this.sessionKey !== sessionKey) {
      this.reset(sessionKey);
    }

    for (const event of events) {
      if (!this.active) {
        this.active = {
          event,
          startedAtMs: nowMs,
        };
        continue;
      }

      if (this.queue.length < 2) {
        this.queue.push(event);
      }
    }
  }

  peek(nowMs: number): ActiveAttackPlayback | null {
    this.advance(nowMs);

    if (!this.active) {
      return null;
    }

    return {
      event: this.active.event,
      startedAtMs: this.active.startedAtMs,
      elapsedMs: clamp(nowMs - this.active.startedAtMs, 0, ATTACK_ANIMATION_DURATION_MS),
    };
  }

  isAnimating(nowMs: number): boolean {
    return this.peek(nowMs) !== null;
  }

  getQueuedCount(): number {
    return this.queue.length;
  }

  private advance(nowMs: number): void {
    if (!this.active && this.queue.length > 0) {
      this.active = {
        event: this.queue.shift()!,
        startedAtMs: nowMs,
      };
    }

    while (
      this.active &&
      nowMs - this.active.startedAtMs >= ATTACK_ANIMATION_DURATION_MS
    ) {
      const overflowMs = nowMs - this.active.startedAtMs - ATTACK_ANIMATION_DURATION_MS;

      if (this.queue.length === 0) {
        this.active = null;
        return;
      }

      this.active = {
        event: this.queue.shift()!,
        startedAtMs: nowMs - overflowMs,
      };
    }
  }
}
