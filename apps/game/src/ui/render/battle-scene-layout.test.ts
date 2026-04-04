import { describe, expect, it } from "vitest";
import { buildBattleSceneLayout, findBattleSlotAtPoint } from "./battle-scene-layout";

function radiusFromEnemy(layout: ReturnType<typeof buildBattleSceneLayout>, slotIndex: number) {
  const slot = layout.slots[slotIndex]!;
  return Math.hypot(slot.centerX - layout.enemy.centerX, slot.centerY - layout.enemy.centerY);
}

describe("buildBattleSceneLayout", () => {
  it("keeps desktop slots on an equal-radius ring with 60-degree spacing", () => {
    const layout = buildBattleSceneLayout("desktop-landscape", 1280, 720);
    const radii = layout.slots.map((_, index) => radiusFromEnemy(layout, index));

    radii.forEach((radius) => {
      expect(radius).toBeCloseTo(radii[0]!, 6);
    });

    const angleSteps = layout.slots.map((slot, index, slots) => {
      const next = slots[(index + 1) % slots.length]!;
      return (next.angleDeg - slot.angleDeg + 360) % 360;
    });

    expect(angleSteps).toEqual([60, 60, 60, 60, 60, 60]);
  });

  it("keeps mobile slots on the lower arc and within the canvas bounds", () => {
    const layout = buildBattleSceneLayout("mobile-portrait", 390, 844);

    layout.slots.forEach((slot) => {
      expect(slot.centerY).toBeGreaterThan(layout.enemy.centerY);
      expect(slot.centerX - slot.frameSize / 2).toBeGreaterThanOrEqual(0);
      expect(slot.centerX + slot.frameSize / 2).toBeLessThanOrEqual(390);
      expect(slot.centerY + slot.frameSize / 2).toBeLessThanOrEqual(844);
    });
  });

  it("detects clicks on occupied or empty slot frames and ignores clicks outside", () => {
    const desktopLayout = buildBattleSceneLayout("desktop-landscape", 1280, 720);
    const mobileLayout = buildBattleSceneLayout("mobile-portrait", 390, 844);

    expect(
      findBattleSlotAtPoint(
        desktopLayout,
        desktopLayout.slots[0]!.centerX,
        desktopLayout.slots[0]!.centerY,
        6,
      )?.slotIndex,
    ).toBe(0);
    expect(
      findBattleSlotAtPoint(
        mobileLayout,
        mobileLayout.slots[5]!.centerX,
        mobileLayout.slots[5]!.centerY,
        10,
      )?.slotIndex,
    ).toBe(5);
    expect(findBattleSlotAtPoint(desktopLayout, 20, 20, 6)).toBeNull();
  });

  it("keeps slot info anchors outside the combat ring", () => {
    const layout = buildBattleSceneLayout("desktop-landscape", 1280, 720);

    layout.slots.forEach((slot, slotIndex) => {
      const slotRadius = radiusFromEnemy(layout, slotIndex);
      const labelRadius = Math.hypot(
        slot.labelCenterX - layout.enemy.centerX,
        slot.labelCenterY - layout.enemy.centerY,
      );

      expect(labelRadius).toBeGreaterThan(slotRadius);
    });
  });
});
