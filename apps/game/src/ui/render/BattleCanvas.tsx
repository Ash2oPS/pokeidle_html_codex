import { useEffect, useRef } from "react";
import type { LayoutMode } from "@pokeidle/contracts";
import { uiTokens } from "@pokeidle/ui-tokens";
import {
  AnimationDirector,
  type BattleAttackVisualEvent,
  getAttackAnimationBudget,
  getAttackAnimationSeed,
  sampleAttackAnimationFrame,
} from "./attack-animation";
import { buildBattleSceneLayout, findBattleSlotAtPoint } from "./battle-scene-layout";
import { readCachedSprite } from "./sprite-cache";
import { getTypeVfxProfile } from "./type-vfx";
import { getVfxSprite } from "./vfx-sprite-atlas";

export interface BattleSlotVisual {
  speciesId: string | null;
  label: string | null;
  levelLabel: string | null;
  frontSpriteUrl: string | null;
}

interface BattleEnemyVisual {
  speciesId: string;
  label: string;
  levelLabel: string;
  currentHp: number;
  maxHp: number;
  hpUnitLabel: string;
  frontSpriteUrl: string;
}

export interface BattleSlotPressPayload {
  slotIndex: number;
  anchorClientX: number;
  anchorClientY: number;
}

interface BattleCanvasProps {
  layoutMode: LayoutMode;
  sceneKind: "town" | "combat" | "gym";
  combatSessionKey: string | null;
  attackEvents: BattleAttackVisualEvent[];
  enemyVisual: BattleEnemyVisual | null;
  enemyHpPercent: number;
  activeSlotIndex: number | null;
  reactionLabel: string | null;
  teamSlotVisuals: BattleSlotVisual[];
  onSlotPress?: (payload: BattleSlotPressPayload) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getScenePalette(sceneKind: BattleCanvasProps["sceneKind"]) {
  if (sceneKind === "combat") {
    return {
      sky: "#d9efff",
      ground: "#bde2ff",
      center: uiTokens.colors.danger,
      accent: "#fff2f4",
      slotFill: uiTokens.colors.leaf,
      slotEmpty: "#e8eef8",
      slotStroke: "#1f4f87",
      activeStroke: "#ffd85c",
      enemyChip: "#ffffff",
      reactionFill: "#57b79d",
    };
  }

  if (sceneKind === "gym") {
    return {
      sky: "#efe7ff",
      ground: "#d3c0ff",
      center: "#7b5edc",
      accent: "#f2eeff",
      slotFill: "#7bd37b",
      slotEmpty: "#ece8ff",
      slotStroke: "#4e3b9c",
      activeStroke: "#ffd85c",
      enemyChip: "#ffffff",
      reactionFill: "#57b79d",
    };
  }

  return {
    sky: "#e8f7ff",
    ground: "#c7ecff",
    center: "#57b79d",
    accent: "#eafff8",
    slotFill: uiTokens.colors.leaf,
    slotEmpty: "#e8eef8",
    slotStroke: "#1f4f87",
    activeStroke: "#ffd85c",
    enemyChip: "#ffffff",
    reactionFill: "#57b79d",
  };
}

function drawRoundedFrame(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
  lineWidth: number,
  dashed = false,
) {
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = lineWidth;
  context.strokeStyle = stroke;

  if (dashed) {
    context.setLineDash([6, 4]);
  }

  context.stroke();
  context.restore();
}

function drawSpriteAtCenter(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  centerX: number,
  centerY: number,
  boxSize: number,
  scale = 1,
  alpha = 1,
) {
  const source = image as CanvasImageSource & {
    width?: number;
    height?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  };
  const width = source.naturalWidth ?? source.width ?? 1;
  const height = source.naturalHeight ?? source.height ?? 1;
  const fitScale = Math.min(boxSize / width, boxSize / height) * scale;
  const drawWidth = Math.max(1, Math.round(width * fitScale));
  const drawHeight = Math.max(1, Math.round(height * fitScale));
  const drawX = Math.round(centerX - drawWidth / 2);
  const drawY = Math.round(centerY - drawHeight / 2);

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function drawTownScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  layoutMode: LayoutMode,
) {
  const buildingWidth = layoutMode === "mobile-portrait" ? 84 : 120;
  const buildingHeight = layoutMode === "mobile-portrait" ? 110 : 140;

  [-1, 1].forEach((direction, index) => {
    const baseX = width / 2 + direction * (layoutMode === "mobile-portrait" ? 92 : 132);
    const baseY = height * 0.48;
    context.fillStyle = index === 0 ? "#f9f0b2" : "#ffd8a8";
    context.beginPath();
    context.roundRect(
      baseX - buildingWidth / 2,
      baseY - buildingHeight / 2,
      buildingWidth,
      buildingHeight,
      18,
    );
    context.fill();
  });
}

function drawSlotBadge(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  frameSize: number,
  badgeRadius: number,
  stroke: string,
  fill: string,
  slotNumber: number,
) {
  const badgeX = centerX + frameSize * 0.3;
  const badgeY = centerY - frameSize * 0.28;

  context.fillStyle = fill;
  context.beginPath();
  context.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = uiTokens.colors.ink;
  context.font = "700 11px 'Trebuchet MS', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(slotNumber), badgeX, badgeY);
}

function drawEnemyChipAndHp(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  info: {
    label: string;
    levelLabel: string | null;
    hpLabel: string;
  },
  hpPercent: number,
  layoutMode: LayoutMode,
  enemyLayout: ReturnType<typeof buildBattleSceneLayout>["enemy"],
  palette: ReturnType<typeof getScenePalette>,
) {
  const titleFont =
    layoutMode === "desktop-landscape"
      ? "700 12px 'Trebuchet MS', sans-serif"
      : "700 11px 'Trebuchet MS', sans-serif";
  const metaFont =
    layoutMode === "desktop-landscape"
      ? "600 10px 'Trebuchet MS', sans-serif"
      : "600 9px 'Trebuchet MS', sans-serif";
  const titleText = info.levelLabel ? `${info.label} ${info.levelLabel}` : info.label;

  context.save();
  context.font = titleFont;
  const titleWidth = context.measureText(titleText).width;
  context.font = metaFont;
  const hpTextWidth = context.measureText(info.hpLabel).width;
  context.restore();

  const chipWidth = clamp(
    Math.max(enemyLayout.hpWidth + 18, titleWidth + 18, hpTextWidth + 18),
    layoutMode === "desktop-landscape" ? 176 : 144,
    layoutMode === "desktop-landscape" ? 240 : 188,
  );
  const chipHeight = layoutMode === "desktop-landscape" ? 52 : 48;
  const chipX = clamp(enemyLayout.centerX - chipWidth / 2, 8, width - chipWidth - 8);
  const chipY = clamp(enemyLayout.labelY - 18, 8, height - chipHeight - 8);
  const barX = chipX + 8;
  const barY = chipY + chipHeight - 16;
  const barWidth = chipWidth - 16;

  drawRoundedFrame(
    context,
    chipX,
    chipY,
    chipWidth,
    chipHeight,
    999,
    palette.enemyChip,
    palette.slotStroke,
    2,
  );
  context.fillStyle = uiTokens.colors.ink;
  context.font = titleFont;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(titleText, chipX + chipWidth / 2, chipY + 14);
  context.font = metaFont;
  context.fillText(info.hpLabel, chipX + chipWidth / 2, chipY + 28);

  context.fillStyle = "#dfeafb";
  context.beginPath();
  context.roundRect(
    barX,
    barY,
    barWidth,
    10,
    999,
  );
  context.fill();

  context.fillStyle = "#ff8fa0";
  context.beginPath();
  context.roundRect(
    barX,
    barY,
    barWidth * Math.max(0, Math.min(1, hpPercent)),
    10,
    999,
  );
  context.fill();
}

function drawSlotInfoChip(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  layoutMode: LayoutMode,
  slot: ReturnType<typeof buildBattleSceneLayout>["slots"][number],
  visual: BattleSlotVisual,
  stroke: string,
) {
  if (!visual.label || !visual.levelLabel) {
    return;
  }

  const titleFont =
    layoutMode === "desktop-landscape"
      ? "700 11px 'Trebuchet MS', sans-serif"
      : "700 10px 'Trebuchet MS', sans-serif";
  const metaFont =
    layoutMode === "desktop-landscape"
      ? "600 10px 'Trebuchet MS', sans-serif"
      : "600 9px 'Trebuchet MS', sans-serif";

  context.save();
  context.font = titleFont;
  const titleWidth = context.measureText(visual.label).width;
  context.font = metaFont;
  const metaWidth = context.measureText(visual.levelLabel).width;
  context.restore();

  const chipWidth = clamp(
    Math.max(titleWidth + 16, metaWidth + 16),
    layoutMode === "desktop-landscape" ? 64 : 58,
    layoutMode === "desktop-landscape" ? 116 : 100,
  );
  const chipHeight = layoutMode === "desktop-landscape" ? 32 : 28;
  const chipX = clamp(slot.labelCenterX - chipWidth / 2, 8, width - chipWidth - 8);
  const chipY = clamp(slot.labelCenterY - chipHeight / 2, 8, height - chipHeight - 8);

  drawRoundedFrame(
    context,
    chipX,
    chipY,
    chipWidth,
    chipHeight,
    12,
    "rgba(255, 255, 255, 0.94)",
    stroke,
    2,
  );
  context.fillStyle = uiTokens.colors.ink;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = titleFont;
  context.fillText(visual.label, chipX + chipWidth / 2, chipY + 11);
  context.font = metaFont;
  context.fillText(visual.levelLabel, chipX + chipWidth / 2, chipY + chipHeight - 9);
}

function drawAttackTrail(
  context: CanvasRenderingContext2D,
  event: BattleAttackVisualEvent,
  frame: ReturnType<typeof sampleAttackAnimationFrame>,
  slot: ReturnType<typeof buildBattleSceneLayout>["slots"][number],
) {
  const profile = getTypeVfxProfile(event.offensiveType);
  const particleCount = frame.trailParticleCount;

  if (particleCount <= 0) {
    return;
  }

  const directionX = frame.attackerCenterX - slot.centerX;
  const directionY = frame.attackerCenterY - slot.centerY;

  context.save();
  context.fillStyle = profile.trailColor;
  context.strokeStyle = profile.trailColor;
  context.globalAlpha = 0.72;

  for (let index = 0; index < particleCount; index += 1) {
    const ratio = (index + 1) / (particleCount + 1);
    const sampleX = Math.round(frame.attackerCenterX - directionX * ratio);
    const sampleY = Math.round(frame.attackerCenterY - directionY * ratio);

    if (event.attackClass === "physical") {
      const streakWidth = profile.streakStyle === "gust" ? 10 : 8;
      const streakHeight = profile.streakStyle === "dust" ? 4 : 3;
      context.fillRect(sampleX - streakWidth / 2, sampleY - streakHeight / 2, streakWidth, streakHeight);
    } else {
      context.fillRect(sampleX - 2, sampleY - 2, 4, 4);
    }
  }

  context.restore();
}

function drawProjectile(
  context: CanvasRenderingContext2D,
  event: BattleAttackVisualEvent,
  frame: ReturnType<typeof sampleAttackAnimationFrame>,
) {
  if (!frame.projectileVisible || frame.projectileCenterX === null || frame.projectileCenterY === null) {
    return;
  }

  const profile = getTypeVfxProfile(event.offensiveType);
  const projectileSprite = getVfxSprite(
    profile.projectileSpriteId,
    profile.primaryColor,
    profile.secondaryColor,
  );

  if (projectileSprite) {
    drawSpriteAtCenter(
      context,
      projectileSprite,
      frame.projectileCenterX,
      frame.projectileCenterY,
      frame.projectileSize,
    );
    return;
  }

  context.save();
  context.fillStyle = profile.primaryColor;
  context.beginPath();
  context.arc(frame.projectileCenterX, frame.projectileCenterY, frame.projectileSize / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawImpact(
  context: CanvasRenderingContext2D,
  event: BattleAttackVisualEvent,
  frame: ReturnType<typeof sampleAttackAnimationFrame>,
  enemyLayout: ReturnType<typeof buildBattleSceneLayout>["enemy"],
) {
  if (frame.impactProgress <= 0) {
    return;
  }

  const profile = getTypeVfxProfile(event.offensiveType);
  const impactSprite = getVfxSprite(
    profile.impactSpriteId,
    profile.primaryColor,
    profile.secondaryColor,
  );
  const impactScale = 0.7 + frame.impactProgress * 0.75;
  const impactAlpha = 1 - frame.impactProgress;
  const impactCenterX = enemyLayout.centerX + frame.enemyOffsetX;
  const impactCenterY = enemyLayout.centerY + frame.enemyOffsetY;
  const particleSeed = getAttackAnimationSeed(event.eventKey);

  if (impactSprite) {
    drawSpriteAtCenter(
      context,
      impactSprite,
      impactCenterX,
      impactCenterY,
      enemyLayout.spriteSize * 0.42,
      impactScale,
      impactAlpha,
    );
  }

  context.save();
  context.globalAlpha = impactAlpha;
  context.fillStyle = profile.flashColor;
  context.beginPath();
  context.ellipse(
    impactCenterX,
    impactCenterY,
    enemyLayout.spriteSize * 0.18 * impactScale,
    enemyLayout.spriteSize * 0.12 * impactScale,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.restore();

  context.save();
  context.fillStyle = profile.trailColor;
  context.globalAlpha = 0.85 - frame.impactProgress * 0.65;

  for (let index = 0; index < frame.impactParticleCount; index += 1) {
    const angle = ((particleSeed + index * 47) % 360) * (Math.PI / 180);
    const radius = (enemyLayout.spriteSize * 0.12 + index * 3) * frame.impactProgress;
    const x = Math.round(impactCenterX + Math.cos(angle) * radius);
    const y = Math.round(impactCenterY + Math.sin(angle) * radius);
    context.fillRect(x - 2, y - 2, 4, 4);
  }

  context.restore();
}

function drawReactionChip(
  context: CanvasRenderingContext2D,
  reactionLabel: string,
  layout: ReturnType<typeof buildBattleSceneLayout>,
  palette: ReturnType<typeof getScenePalette>,
) {
  const chipWidth = Math.max(58, reactionLabel.length * 9 + 20);
  const chipHeight = 24;
  drawRoundedFrame(
    context,
    layout.reactionBadgeX - chipWidth / 2,
    layout.reactionBadgeY - chipHeight / 2,
    chipWidth,
    chipHeight,
    999,
    palette.reactionFill,
    palette.slotStroke,
    2,
  );
  context.fillStyle = "#ffffff";
  context.font = "700 12px 'Trebuchet MS', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(reactionLabel, layout.reactionBadgeX, layout.reactionBadgeY);
}

export function BattleCanvas({
  layoutMode,
  sceneKind,
  combatSessionKey,
  attackEvents,
  enemyVisual,
  enemyHpPercent,
  activeSlotIndex,
  reactionLabel,
  teamSlotVisuals,
  onSlotPress,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const directorRef = useRef(new AnimationDirector());
  const latestPropsRef = useRef<BattleCanvasProps>({
    layoutMode,
    sceneKind,
    combatSessionKey,
    attackEvents,
    enemyVisual,
    enemyHpPercent,
    activeSlotIndex,
    reactionLabel,
    teamSlotVisuals,
  });

  const drawFrameRef = useRef<(nowMs: number) => void>(() => undefined);

  const cancelPendingFrame = () => {
    if (rafIdRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  };

  const requestDraw = () => {
    if (rafIdRef.current !== null) {
      return;
    }

    rafIdRef.current = window.requestAnimationFrame((nowMs) => {
      rafIdRef.current = null;
      drawFrameRef.current(nowMs);
    });
  };

  useEffect(() => {
    latestPropsRef.current = {
      layoutMode,
      sceneKind,
      combatSessionKey,
      attackEvents,
      enemyVisual,
      enemyHpPercent,
      activeSlotIndex,
      reactionLabel,
      teamSlotVisuals,
    };
    requestDraw();
  }, [
    activeSlotIndex,
    enemyHpPercent,
    enemyVisual,
    layoutMode,
    reactionLabel,
    sceneKind,
    teamSlotVisuals,
  ]);

  useEffect(() => {
    directorRef.current.enqueue(combatSessionKey, attackEvents, performance.now());
    requestDraw();
  }, [attackEvents, combatSessionKey]);

  useEffect(() => {
    const handleResize = () => {
      requestDraw();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      cancelPendingFrame();
    };
  }, []);

  useEffect(() => {
    drawFrameRef.current = (nowMs: number) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const props = latestPropsRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const palette = getScenePalette(props.sceneKind);
      const layout = buildBattleSceneLayout(props.layoutMode, width, height);
      const playback = directorRef.current.peek(nowMs);
      const activeFrame =
        playback && layout.slots[playback.event.slotIndex]
          ? sampleAttackAnimationFrame(
              playback.event,
              props.layoutMode,
              layout.slots[playback.event.slotIndex]!,
              layout.enemy,
              playback.elapsedMs,
            )
          : null;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.fillStyle = palette.sky;
      context.fillRect(0, 0, width, height);

      context.fillStyle = palette.ground;
      context.beginPath();
      context.ellipse(
        layout.ground.centerX,
        layout.ground.centerY,
        layout.ground.radiusX,
        layout.ground.radiusY,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();

      if (props.sceneKind === "town" && !props.enemyVisual) {
        drawTownScene(context, width, height, props.layoutMode);
      }

      layout.slots.forEach((slot) => {
        const visual = props.teamSlotVisuals[slot.slotIndex] ?? {
          speciesId: null,
          label: null,
          levelLabel: null,
          frontSpriteUrl: null,
        };
        const frameX = slot.centerX - slot.frameSize / 2;
        const frameY = slot.centerY - slot.frameSize / 2;
        const isActive = props.activeSlotIndex === slot.slotIndex;
        const hideStaticSprite = playback?.event.slotIndex === slot.slotIndex;

        drawRoundedFrame(
          context,
          frameX,
          frameY,
          slot.frameSize,
          slot.frameSize,
          18,
          visual.speciesId ? palette.slotFill : palette.slotEmpty,
          isActive ? palette.activeStroke : palette.slotStroke,
          isActive ? 4 : 2,
          !visual.speciesId,
        );

        if (visual.frontSpriteUrl && !hideStaticSprite) {
          const spriteImage = readCachedSprite(visual.frontSpriteUrl, requestDraw);

          if (spriteImage) {
            drawSpriteAtCenter(context, spriteImage, slot.centerX, slot.centerY, slot.spriteSize);
          }
        }

        drawSlotBadge(
          context,
          slot.centerX,
          slot.centerY,
          slot.frameSize,
          slot.badgeRadius,
          palette.slotStroke,
          isActive ? palette.activeStroke : "#ffffff",
          slot.slotIndex + 1,
        );

        drawSlotInfoChip(
          context,
          width,
          height,
          props.layoutMode,
          slot,
          visual,
          isActive ? palette.activeStroke : palette.slotStroke,
        );
      });

      context.fillStyle = "rgba(20, 49, 79, 0.14)";
      context.beginPath();
      context.ellipse(
        layout.enemy.shadow.centerX,
        layout.enemy.shadow.centerY,
        layout.enemy.shadow.radiusX,
        layout.enemy.shadow.radiusY,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();

      const enemySpriteVisual =
        playback?.event.enemyFrontSpriteUrl || props.enemyVisual?.frontSpriteUrl || null;
      const enemyLabel =
        playback?.event.enemyLabel || props.enemyVisual?.label || null;
      const enemyLevelLabel =
        playback && props.enemyVisual && props.enemyVisual.speciesId !== playback.event.enemySpeciesId
          ? null
          : props.enemyVisual?.levelLabel ?? null;
      const enemyHp =
        activeFrame?.displayEnemyHpPercent ?? props.enemyHpPercent;
      const enemyHpValue =
        activeFrame?.displayEnemyHpValue ?? props.enemyVisual?.currentHp ?? 0;
      const enemyHpMaxValue =
        playback?.event.enemyMaxHp ?? props.enemyVisual?.maxHp ?? 0;
      const enemyHpLabel = `${Math.max(0, enemyHpValue)} / ${enemyHpMaxValue} ${
        props.enemyVisual?.hpUnitLabel ?? "HP"
      }`;
      const enemyCenterX = layout.enemy.centerX + (activeFrame?.enemyOffsetX ?? 0);
      const enemyCenterY = layout.enemy.centerY + (activeFrame?.enemyOffsetY ?? 0);
      const enemyScaleX = activeFrame?.enemyScaleX ?? 1;
      const enemyScaleY = activeFrame?.enemyScaleY ?? 1;

      if (enemySpriteVisual) {
        const enemyImage = readCachedSprite(enemySpriteVisual, requestDraw);

        if (enemyImage) {
          context.save();
          context.translate(Math.round(enemyCenterX), Math.round(enemyCenterY));
          context.scale(enemyScaleX, enemyScaleY);
          drawSpriteAtCenter(context, enemyImage, 0, 0, layout.enemy.spriteSize);
          context.restore();
        }
      } else if (props.enemyVisual) {
        context.fillStyle = palette.center;
        context.beginPath();
        context.arc(enemyCenterX, enemyCenterY, layout.enemy.spriteSize * 0.42, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = palette.accent;
        context.beginPath();
        context.arc(enemyCenterX, enemyCenterY - 6, layout.enemy.spriteSize * 0.18, 0, Math.PI * 2);
        context.fill();
      }

      if (activeFrame?.enemyFlashAlpha) {
        const profile = getTypeVfxProfile(playback?.event.offensiveType ?? "normal");
        context.save();
        context.globalAlpha = activeFrame.enemyFlashAlpha * 0.55;
        context.fillStyle = profile.flashColor;
        context.beginPath();
        context.ellipse(
          enemyCenterX,
          enemyCenterY,
          layout.enemy.spriteSize * 0.38,
          layout.enemy.spriteSize * 0.28,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.restore();
      }

      if (enemyLabel) {
        drawEnemyChipAndHp(
          context,
          width,
          height,
          {
            label: enemyLabel,
            levelLabel: enemyLevelLabel,
            hpLabel: enemyHpLabel,
          },
          enemyHp,
          props.layoutMode,
          layout.enemy,
          palette,
        );
      }

      if (playback && activeFrame) {
        const attackerVisual = props.teamSlotVisuals[playback.event.slotIndex] ?? null;
        const attackerImage =
          playback.event.attackerFrontSpriteUrl
            ? readCachedSprite(playback.event.attackerFrontSpriteUrl, requestDraw)
            : attackerVisual?.frontSpriteUrl
              ? readCachedSprite(attackerVisual.frontSpriteUrl, requestDraw)
              : null;

        drawAttackTrail(
          context,
          playback.event,
          activeFrame,
          layout.slots[playback.event.slotIndex]!,
        );

        if (attackerImage) {
          drawSpriteAtCenter(
            context,
            attackerImage,
            activeFrame.attackerCenterX,
            activeFrame.attackerCenterY,
            layout.slots[playback.event.slotIndex]!.spriteSize,
            activeFrame.attackerScale,
          );
        }

        drawProjectile(context, playback.event, activeFrame);
        drawImpact(context, playback.event, activeFrame, layout.enemy);
      }

      if (props.reactionLabel) {
        drawReactionChip(context, props.reactionLabel, layout, palette);
      }

      if (directorRef.current.isAnimating(nowMs)) {
        requestDraw();
      }
    };

    requestDraw();
  }, []);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSlotPress) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const layout = buildBattleSceneLayout(layoutMode, rect.width, rect.height);
    const hitSlot = findBattleSlotAtPoint(
      layout,
      localX,
      localY,
      layoutMode === "mobile-portrait" ? 10 : 6,
    );

    if (!hitSlot) {
      return;
    }

    onSlotPress({
      slotIndex: hitSlot.slotIndex,
      anchorClientX: rect.left + hitSlot.centerX,
      anchorClientY: rect.top + hitSlot.centerY,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="battle-canvas"
      aria-label="battle playfield"
      onClick={handleCanvasClick}
    />
  );
}
