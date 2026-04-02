import { useEffect, useRef } from "react";
import type { LayoutMode } from "@pokeidle/contracts";
import { uiTokens } from "@pokeidle/ui-tokens";

interface BattleCanvasProps {
  layoutMode: LayoutMode;
  sceneKind: "town" | "combat" | "gym";
  zoneLabel: string;
  enemyLabel: string | null;
  enemyHpPercent: number;
  activeSlotIndex: number | null;
  progressLabel: string | null;
  timerLabel: string | null;
  reactionLabel: string | null;
  teamSlots: Array<string | null>;
}

function getScenePalette(sceneKind: BattleCanvasProps["sceneKind"]) {
  if (sceneKind === "combat") {
    return {
      sky: "#d9efff",
      ground: "#bde2ff",
      center: uiTokens.colors.danger,
      accent: "#fff2f4",
      banner: "#ffd85c",
    };
  }

  if (sceneKind === "gym") {
    return {
      sky: "#efe7ff",
      ground: "#d3c0ff",
      center: "#7b5edc",
      accent: "#f2eeff",
      banner: "#ffd85c",
    };
  }

  return {
    sky: "#e8f7ff",
    ground: "#c7ecff",
    center: "#57b79d",
    accent: "#eafff8",
    banner: "#7bd37b",
  };
}

export function BattleCanvas({
  layoutMode,
  sceneKind,
  zoneLabel,
  enemyLabel,
  enemyHpPercent,
  activeSlotIndex,
  progressLabel,
  timerLabel,
  reactionLabel,
  teamSlots,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const resizeAndDraw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const palette = getScenePalette(sceneKind);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      context.clearRect(0, 0, width, height);
      context.fillStyle = palette.sky;
      context.fillRect(0, 0, width, height);

      context.fillStyle = palette.ground;
      context.beginPath();
      context.ellipse(width / 2, height * 0.78, width * 0.34, height * 0.13, 0, 0, Math.PI * 2);
      context.fill();

      if (sceneKind === "town" && !enemyLabel) {
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
      } else {
        const enemyRadius = layoutMode === "mobile-portrait" ? 46 : 64;
        context.fillStyle = palette.center;
        context.beginPath();
        context.arc(width / 2, height * 0.42, enemyRadius, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = palette.accent;
        context.beginPath();
        context.arc(width / 2, height * 0.4, enemyRadius * 0.42, 0, Math.PI * 2);
        context.fill();
      }

      const slotAngles =
        layoutMode === "mobile-portrait"
          ? [-155, -120, -82, -35, 10, 48]
          : [-165, -132, -95, -40, 5, 42];
      const slotDistance = layoutMode === "mobile-portrait" ? 148 : 198;
      const centerX = width / 2;
      const centerY = height * 0.55;

      slotAngles.forEach((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const x = centerX + Math.cos(radians) * slotDistance;
        const y = centerY + Math.sin(radians) * slotDistance * 0.7;
        const filled = teamSlots[index] !== null;
        const active = activeSlotIndex === index;

        context.fillStyle = filled ? uiTokens.colors.leaf : uiTokens.colors.panelStrong;
        context.beginPath();
        context.roundRect(x - 28, y - 22, 56, 44, 16);
        context.fill();

        context.lineWidth = active ? 4 : 2;
        context.strokeStyle = active ? "#ffd85c" : "#1f4f87";
        context.stroke();

        context.fillStyle = uiTokens.colors.ink;
        context.font = "700 12px 'Trebuchet MS', sans-serif";
        context.textAlign = "center";
        context.fillText(String(index + 1), x, y + 4);
      });

      context.fillStyle = palette.banner;
      context.beginPath();
      context.roundRect(width / 2 - 110, 24, 220, 38, 16);
      context.fill();
      context.fillStyle = uiTokens.colors.ink;
      context.font = "700 15px 'Trebuchet MS', sans-serif";
      context.textAlign = "center";
      context.fillText(zoneLabel, width / 2, 48);

      if (enemyLabel) {
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.roundRect(width / 2 - 120, 76, 240, 52, 18);
        context.fill();
        context.strokeStyle = "#1f4f87";
        context.lineWidth = 2;
        context.stroke();

        context.fillStyle = uiTokens.colors.ink;
        context.font = "700 14px 'Trebuchet MS', sans-serif";
        context.fillText(enemyLabel, width / 2, 97);

        context.fillStyle = "#dfeafb";
        context.beginPath();
        context.roundRect(width / 2 - 92, 106, 184, 10, 999);
        context.fill();

        context.fillStyle = "#ff8fa0";
        context.beginPath();
        context.roundRect(width / 2 - 92, 106, 184 * Math.max(0, Math.min(1, enemyHpPercent)), 10, 999);
        context.fill();
      }

      if (progressLabel || timerLabel || reactionLabel) {
        const cardX = width - 176;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.roundRect(cardX, 84, 150, 74, 18);
        context.fill();
        context.strokeStyle = "#1f4f87";
        context.lineWidth = 2;
        context.stroke();

        context.fillStyle = uiTokens.colors.ink;
        context.font = "700 12px 'Trebuchet MS', sans-serif";
        context.textAlign = "left";
        if (timerLabel) {
          context.fillText(timerLabel, cardX + 14, 108);
        }
        if (progressLabel) {
          context.fillText(progressLabel, cardX + 14, 128);
        }
        if (reactionLabel) {
          context.fillStyle = "#57b79d";
          context.fillText(reactionLabel, cardX + 14, 148);
        }
      }
    };

    resizeAndDraw();
    window.addEventListener("resize", resizeAndDraw);

    return () => {
      window.removeEventListener("resize", resizeAndDraw);
    };
  }, [
    activeSlotIndex,
    enemyHpPercent,
    enemyLabel,
    layoutMode,
    progressLabel,
    reactionLabel,
    sceneKind,
    teamSlots,
    timerLabel,
    zoneLabel,
  ]);

  return <canvas ref={canvasRef} className="battle-canvas" aria-label="battle playfield" />;
}
