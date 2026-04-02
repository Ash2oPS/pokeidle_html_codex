import { useEffect, useRef } from "react";
import type { LayoutMode } from "@pokeidle/contracts";
import { uiTokens } from "@pokeidle/ui-tokens";

interface BattleCanvasProps {
  layoutMode: LayoutMode;
}

export function BattleCanvas({ layoutMode }: BattleCanvasProps) {
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

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#d9efff";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#bde2ff";
      context.beginPath();
      context.ellipse(width / 2, height * 0.78, width * 0.34, height * 0.13, 0, 0, Math.PI * 2);
      context.fill();

      const enemyRadius = layoutMode === "mobile-portrait" ? 46 : 64;
      context.fillStyle = uiTokens.colors.danger;
      context.beginPath();
      context.arc(width / 2, height * 0.42, enemyRadius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#fff2f4";
      context.beginPath();
      context.arc(width / 2, height * 0.4, enemyRadius * 0.42, 0, Math.PI * 2);
      context.fill();

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

        context.fillStyle = index < 3 ? uiTokens.colors.leaf : uiTokens.colors.panelStrong;
        context.beginPath();
        context.roundRect(x - 28, y - 22, 56, 44, 16);
        context.fill();

        context.fillStyle = uiTokens.colors.ink;
        context.font = "700 12px 'Trebuchet MS', sans-serif";
        context.textAlign = "center";
        context.fillText(String.fromCharCode(65 + index), x, y + 4);
      });
    };

    resizeAndDraw();
    window.addEventListener("resize", resizeAndDraw);

    return () => {
      window.removeEventListener("resize", resizeAndDraw);
    };
  }, [layoutMode]);

  return <canvas ref={canvasRef} className="battle-canvas" aria-label="battle playfield" />;
}
