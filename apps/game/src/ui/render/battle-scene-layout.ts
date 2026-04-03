import type { LayoutMode } from "@pokeidle/contracts";

export interface BattleGroundLayout {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

export interface BattleEnemyLayout {
  centerX: number;
  centerY: number;
  spriteSize: number;
  hpWidth: number;
  hpY: number;
  labelY: number;
  shadow: BattleGroundLayout;
}

export interface BattleSlotLayout {
  slotIndex: number;
  angleDeg: number;
  centerX: number;
  centerY: number;
  frameSize: number;
  spriteSize: number;
  badgeRadius: number;
}

export interface BattleSceneLayout {
  enemy: BattleEnemyLayout;
  ground: BattleGroundLayout;
  slots: BattleSlotLayout[];
  reactionBadgeX: number;
  reactionBadgeY: number;
}

const DESKTOP_RING_ANGLES_DEG = [-180, -120, -60, 0, 60, 120] as const;
const MOBILE_ARC_ANGLES_DEG = [160, 132, 104, 76, 48, 20] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY + Math.sin(radians) * radius,
  };
}

export function buildBattleSceneLayout(
  layoutMode: LayoutMode,
  width: number,
  height: number,
): BattleSceneLayout {
  const safeTop = layoutMode === "desktop-landscape" ? 96 : 96;
  const safeBottom = layoutMode === "desktop-landscape" ? 136 : 248;
  const safeLeft = layoutMode === "desktop-landscape" ? 24 : 18;
  const safeRight = layoutMode === "desktop-landscape" ? 24 : 18;
  const sceneWidth = Math.max(0, width - safeLeft - safeRight);
  const sceneHeight = Math.max(0, height - safeTop - safeBottom);
  const enemyCenterX = safeLeft + sceneWidth / 2;
  const enemyCenterY =
    layoutMode === "desktop-landscape"
      ? safeTop + sceneHeight * 0.34
      : safeTop + sceneHeight * 0.32;
  const enemySpriteSize =
    layoutMode === "desktop-landscape"
      ? clamp(sceneHeight * 0.26, 88, 132)
      : clamp(sceneWidth * 0.3, 88, 116);
  const slotFrameSize = layoutMode === "desktop-landscape" ? 72 : 56;
  const slotSpriteSize = layoutMode === "desktop-landscape" ? 54 : 42;
  const slotRadius =
    layoutMode === "desktop-landscape"
      ? clamp(Math.min(sceneWidth * 0.18, sceneHeight * 0.28), 110, 152)
      : clamp(Math.min(sceneWidth * 0.4, sceneHeight * 0.3), 86, 138);
  const slotAngles =
    layoutMode === "desktop-landscape" ? DESKTOP_RING_ANGLES_DEG : MOBILE_ARC_ANGLES_DEG;

  return {
    enemy: {
      centerX: enemyCenterX,
      centerY: enemyCenterY,
      spriteSize: enemySpriteSize,
      hpWidth: layoutMode === "desktop-landscape" ? 170 : 132,
      hpY: enemyCenterY - enemySpriteSize * 0.52 - 16,
      labelY: enemyCenterY - enemySpriteSize * 0.52 - 32,
      shadow: {
        centerX: enemyCenterX,
        centerY: enemyCenterY + enemySpriteSize * 0.42,
        radiusX: enemySpriteSize * 0.52,
        radiusY: enemySpriteSize * 0.18,
      },
    },
    ground: {
      centerX: width / 2,
      centerY: height * 0.8,
      radiusX: width * 0.34,
      radiusY: height * 0.13,
    },
    slots: slotAngles.map((angleDeg, slotIndex) => {
      const point = polarToCartesian(enemyCenterX, enemyCenterY, slotRadius, angleDeg);

      return {
        slotIndex,
        angleDeg,
        centerX: point.x,
        centerY: point.y,
        frameSize: slotFrameSize,
        spriteSize: slotSpriteSize,
        badgeRadius: layoutMode === "desktop-landscape" ? 11 : 10,
      };
    }),
    reactionBadgeX: enemyCenterX + enemySpriteSize * 0.54,
    reactionBadgeY: enemyCenterY - enemySpriteSize * 0.44,
  };
}

export function findBattleSlotAtPoint(
  layout: BattleSceneLayout,
  pointX: number,
  pointY: number,
  hitPadding = 0,
): BattleSlotLayout | null {
  for (const slot of layout.slots) {
    const halfSize = slot.frameSize / 2 + hitPadding;
    const left = slot.centerX - halfSize;
    const right = slot.centerX + halfSize;
    const top = slot.centerY - halfSize;
    const bottom = slot.centerY + halfSize;

    if (pointX >= left && pointX <= right && pointY >= top && pointY <= bottom) {
      return slot;
    }
  }

  return null;
}
