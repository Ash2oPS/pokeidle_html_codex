import { toSafeInt } from "./number-utils.js";
import {
  createShopItemConfigById,
  replaceArrayContents,
  replaceConfigMap,
} from "./shop-config-factory.js";

export function getSortedBallConfigsRuntime(ballConfigByType) {
  return Object.values(ballConfigByType || {})
    .filter((entry) => entry && typeof entry === "object" && entry.type)
    .sort(
      (a, b) =>
        Math.max(0, toSafeInt(a?.sortOrder, 0)) - Math.max(0, toSafeInt(b?.sortOrder, 0))
        || String(a?.nameFr || a?.type || "").localeCompare(String(b?.nameFr || b?.type || "")),
    );
}

export function getDefaultActiveBallTypeRuntime(ballConfigByType) {
  if (Object.prototype.hasOwnProperty.call(ballConfigByType || {}, "poke_ball")) {
    return "poke_ball";
  }
  const ordered = getSortedBallConfigsRuntime(ballConfigByType);
  if (ordered.length > 0) {
    return String(ordered[0].type || "poke_ball");
  }
  return "poke_ball";
}

export function getLegacyBallBackfillTypeRuntime(ballConfigByType) {
  return getDefaultActiveBallTypeRuntime(ballConfigByType);
}

export function refreshBallConfigDerivedStateRuntime({
  ballConfigByType,
  ballTypeOrder,
  ballTypeFallbackOrder,
  comingSoonBallTypes,
}) {
  const sortedBallConfigs = getSortedBallConfigsRuntime(ballConfigByType);
  const uiOrder = sortedBallConfigs.map((entry) => entry.type).filter(Boolean);
  replaceArrayContents(ballTypeFallbackOrder, uiOrder);
  replaceArrayContents(
    ballTypeOrder,
    sortedBallConfigs
      .slice()
      .sort(
        (a, b) =>
          Math.max(0, Number(b?.captureMultiplier || 0)) - Math.max(0, Number(a?.captureMultiplier || 0))
          || Math.max(0, toSafeInt(a?.sortOrder, 0)) - Math.max(0, toSafeInt(b?.sortOrder, 0)),
      )
      .map((entry) => entry.type)
      .filter(Boolean),
  );
  comingSoonBallTypes.clear();
  for (const entry of sortedBallConfigs) {
    if (entry.comingSoon) {
      comingSoonBallTypes.add(entry.type);
    }
  }
}

export function rebuildEvolutionStoneConfigStateRuntime({
  extraShopItemsById,
  evolutionStoneConfigByType,
}) {
  const nextStoneConfigByType = {};
  for (const item of Object.values(extraShopItemsById || {})) {
    if (!item || item.itemType !== "stone") {
      continue;
    }
    const stoneType = String(item.stoneType || item.id || "").toLowerCase().trim();
    if (!stoneType) {
      continue;
    }
    nextStoneConfigByType[stoneType] = {
      type: stoneType,
      nameFr: item.nameFr,
      price: Math.max(0, toSafeInt(item.price, 0)),
      spritePath: String(item.spritePath || ""),
      methodItem: String(item.methodItem || ""),
    };
  }
  replaceConfigMap(evolutionStoneConfigByType, nextStoneConfigByType);
}

export function rebuildShopItemConfigStateRuntime({
  shopItemConfigById,
  ballConfigByType,
  extraShopItemsById,
}) {
  replaceConfigMap(shopItemConfigById, createShopItemConfigById(ballConfigByType, extraShopItemsById));
}
