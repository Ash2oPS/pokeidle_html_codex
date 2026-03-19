export const PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE = "desktopLandscape";
export const PRODUCT_LAYOUT_MODE_MOBILE_PORTRAIT = "mobilePortrait";

function toFiniteNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function resolveProductLayoutMode(viewportProfile = {}) {
  return viewportProfile?.phone || viewportProfile?.portrait
    ? PRODUCT_LAYOUT_MODE_MOBILE_PORTRAIT
    : PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE;
}

export function enrichViewportProfile(viewportProfile = {}) {
  const layoutMode = resolveProductLayoutMode(viewportProfile);
  return {
    ...viewportProfile,
    layoutMode,
    desktopLandscape: layoutMode === PRODUCT_LAYOUT_MODE_DESKTOP_LANDSCAPE,
    mobilePortrait: layoutMode === PRODUCT_LAYOUT_MODE_MOBILE_PORTRAIT,
  };
}

export function isPhoneLikeViewport(width = 0, height = 0, options = {}) {
  const safeWidth = Math.max(1, toFiniteNumber(width, 0));
  const safeHeight = Math.max(1, toFiniteNumber(height, 0));
  const minSide = Math.min(safeWidth, safeHeight);
  const maxSide = Math.max(safeWidth, safeHeight);
  const portrait = safeHeight > safeWidth * 1.05;
  const mobileSignal = Boolean(options?.mobileSignal);
  const tallPortraitPhoneViewport = portrait && safeWidth <= 840 && safeHeight >= safeWidth * 1.9;
  const mobileEmulationPhoneViewport =
    mobileSignal
    && portrait
    && minSide <= 900
    && maxSide <= 1800
    && maxSide >= minSide * 1.75;

  return (
    minSide <= 500
    || (portrait && safeWidth <= 620 && safeHeight <= 1180)
    || tallPortraitPhoneViewport
    || mobileEmulationPhoneViewport
  );
}

function normalizeSafeBounds(layout = {}) {
  const safeBounds = layout?.safeBounds || {};
  const left = Math.max(0, toFiniteNumber(safeBounds.left));
  const top = Math.max(0, toFiniteNumber(safeBounds.top));
  const width = Math.max(0, toFiniteNumber(safeBounds.width));
  const height = Math.max(0, toFiniteNumber(safeBounds.height));
  const right = Math.max(left, toFiniteNumber(safeBounds.right, left + width));
  const bottom = Math.max(top, toFiniteNumber(safeBounds.bottom, top + height));
  return {
    left,
    top,
    width: Math.max(width, right - left),
    height: Math.max(height, bottom - top),
    right,
    bottom,
  };
}

export function enrichRuntimeLayout(layout = {}, options = {}) {
  const viewportProfile = enrichViewportProfile(layout?.viewportProfile || {});
  const layoutMode = viewportProfile.layoutMode;
  const safeBounds = normalizeSafeBounds(layout);
  const viewportWidth = Math.max(
    safeBounds.right,
    toFiniteNumber(options?.viewport?.width),
    toFiniteNumber(layout?.viewportWidth),
  );
  const viewportHeight = Math.max(
    safeBounds.bottom,
    toFiniteNumber(options?.viewport?.height),
    toFiniteNumber(layout?.viewportHeight),
  );
  const safeAreas = {
    top: safeBounds.top,
    right: Math.max(0, viewportWidth - safeBounds.right),
    bottom: Math.max(0, viewportHeight - safeBounds.bottom),
    left: safeBounds.left,
  };
  const worldSafeRect = {
    left: safeBounds.left,
    top: safeBounds.top,
    right: safeBounds.right,
    bottom: safeBounds.bottom,
    width: safeBounds.width,
    height: safeBounds.height,
  };
  const regions = {
    world: worldSafeRect,
    topHud: {
      top: 0,
      left: 0,
      right: viewportWidth,
      bottom: safeBounds.top,
      width: viewportWidth,
      height: Math.max(0, safeBounds.top),
    },
    bottomHud: {
      top: safeBounds.bottom,
      left: 0,
      right: viewportWidth,
      bottom: viewportHeight,
      width: viewportWidth,
      height: Math.max(0, viewportHeight - safeBounds.bottom),
    },
  };
  const hudSlots = {
    top: "ui-topbar",
    bottom: "action-dock",
  };

  return {
    ...layout,
    layoutMode,
    density: layoutMode === PRODUCT_LAYOUT_MODE_MOBILE_PORTRAIT ? "compact" : "comfortable",
    modalBehavior: layoutMode === PRODUCT_LAYOUT_MODE_MOBILE_PORTRAIT ? "fullscreen-preferred" : "card-centered",
    viewportWidth,
    viewportHeight,
    viewportProfile,
    safeAreas,
    worldSafeRect,
    regions,
    hudSlots,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function projectWorldToStage({
  worldX = 0,
  worldY = 0,
  viewport = null,
  stageRect = null,
  worldSafeRect = null,
  preferredPlacement = "over",
} = {}) {
  const viewportWidth = Math.max(1, toFiniteNumber(viewport?.width, stageRect?.width || 1));
  const viewportHeight = Math.max(1, toFiniteNumber(viewport?.height, stageRect?.height || 1));
  const stageLeft = toFiniteNumber(stageRect?.left);
  const stageTop = toFiniteNumber(stageRect?.top);
  const stageWidth = Math.max(1, toFiniteNumber(stageRect?.width, viewportWidth));
  const stageHeight = Math.max(1, toFiniteNumber(stageRect?.height, viewportHeight));
  const rawStageX = (toFiniteNumber(worldX) / viewportWidth) * stageWidth;
  const rawStageY = (toFiniteNumber(worldY) / viewportHeight) * stageHeight;
  const visible =
    rawStageX >= 0
    && rawStageX <= stageWidth
    && rawStageY >= 0
    && rawStageY <= stageHeight;
  const clampRect = worldSafeRect && typeof worldSafeRect === "object"
    ? {
        left: clamp(toFiniteNumber(worldSafeRect.left), 0, stageWidth),
        top: clamp(toFiniteNumber(worldSafeRect.top), 0, stageHeight),
        right: clamp(toFiniteNumber(worldSafeRect.right, stageWidth), 0, stageWidth),
        bottom: clamp(toFiniteNumber(worldSafeRect.bottom, stageHeight), 0, stageHeight),
      }
    : {
        left: 0,
        top: 0,
        right: stageWidth,
        bottom: stageHeight,
      };
  const stageX = clamp(rawStageX, Math.min(clampRect.left, clampRect.right), Math.max(clampRect.left, clampRect.right));
  const stageY = clamp(rawStageY, Math.min(clampRect.top, clampRect.bottom), Math.max(clampRect.top, clampRect.bottom));

  return {
    worldX: toFiniteNumber(worldX),
    worldY: toFiniteNumber(worldY),
    rawStageX,
    rawStageY,
    stageX,
    stageY,
    clientX: stageLeft + stageX,
    clientY: stageTop + stageY,
    clamped: rawStageX !== stageX || rawStageY !== stageY,
    visible,
    preferredPlacement,
  };
}
