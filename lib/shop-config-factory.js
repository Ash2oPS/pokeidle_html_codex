import { toSafeInt } from "./number-utils.js";
import {
  BOOST_X_DURATION_MS,
  SHOP_TAB_COMBAT,
  SHOP_TAB_EVOLUTIONS,
  SHOP_TAB_POKEBALLS,
} from "./gameplay-ui-config.js";

export function cloneConfigMap(source) {
  const clone = {};
  const entries = source && typeof source === "object" ? Object.entries(source) : [];
  for (const [key, value] of entries) {
    clone[key] = value && typeof value === "object" ? { ...value } : value;
  }
  return clone;
}

export function replaceConfigMap(target, nextSource) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  for (const [key, value] of Object.entries(nextSource || {})) {
    target[key] = value && typeof value === "object" ? { ...value } : value;
  }
}

export function replaceArrayContents(target, nextValues) {
  target.length = 0;
  const values = Array.isArray(nextValues) ? nextValues : [];
  for (const value of values) {
    target.push(value);
  }
}

export function createDefaultBallConfigByType() {
  return {
    poke_ball: {
      type: "poke_ball",
      nameFr: "PokeBall",
      price: 350,
      captureMultiplier: 1,
      description: "Balle standard pour capturer les Pokemon sauvages.",
      spritePath: "assets/items/poke_ball.png",
      comingSoon: false,
      sortOrder: 10,
    },
    super_ball: {
      type: "super_ball",
      nameFr: "SuperBall",
      price: 10000,
      captureMultiplier: 2,
      description: "x2 chances de capture par rapport a une PokeBall.",
      spritePath: "assets/items/super_ball.png",
      comingSoon: false,
      sortOrder: 20,
    },
    hyper_ball: {
      type: "hyper_ball",
      nameFr: "HyperBall",
      price: 150000,
      captureMultiplier: 4,
      description: "x2 chances de capture par rapport a une SuperBall.",
      spritePath: "assets/items/hyper_ball.png",
      comingSoon: false,
      sortOrder: 30,
    },
  };
}

export function createDefaultEvolutionStoneConfigByType() {
  return {
    water_stone: {
      type: "water_stone",
      nameFr: "Pierre Eau",
      price: 100000,
      spritePath: "assets/items/water_stone.png",
      methodItem: "water-stone",
    },
    fire_stone: {
      type: "fire_stone",
      nameFr: "Pierre Feu",
      price: 100000,
      spritePath: "assets/items/fire_stone.png",
      methodItem: "fire-stone",
    },
    leaf_stone: {
      type: "leaf_stone",
      nameFr: "Pierre Plante",
      price: 100000,
      spritePath: "assets/items/leaf_stone.png",
      methodItem: "leaf-stone",
    },
    galarica_wreath: {
      type: "galarica_wreath",
      nameFr: "Couronne Galanoa",
      price: 100000,
      spritePath: "assets/items/galarica_wreath.png",
      methodItem: "galarica-wreath",
    },
    ice_stone: {
      type: "ice_stone",
      nameFr: "Pierre Glace",
      price: 100000,
      spritePath: "assets/items/ice_stone.png",
      methodItem: "ice-stone",
    },
    moon_stone: {
      type: "moon_stone",
      nameFr: "Pierre Lune",
      price: 100000,
      spritePath: "assets/items/moon_stone.png",
      methodItem: "moon-stone",
    },
    sun_stone: {
      type: "sun_stone",
      nameFr: "Pierre Soleil",
      price: 100000,
      spritePath: "assets/items/sun_stone.png",
      methodItem: "sun-stone",
    },
    thunder_stone: {
      type: "thunder_stone",
      nameFr: "Pierre Foudre",
      price: 100000,
      spritePath: "assets/items/thunder_stone.png",
      methodItem: "thunder-stone",
    },
    cable_link: {
      type: "cable_link",
      nameFr: "Cable Link",
      price: 100000,
      spritePath: "assets/items/cable_link.png",
      methodItem: "cable-link",
    },
    metal_coat: {
      type: "metal_coat",
      nameFr: "Peau Metal",
      price: 100000,
      spritePath: "assets/items/metal_coat.png",
      methodItem: "metal-coat",
    },
  };
}

export function createDefaultExtraShopItemConfigById(stoneConfigByType = createDefaultEvolutionStoneConfigByType()) {
  return {
    x_boost: {
      id: "x_boost",
      category: SHOP_TAB_COMBAT,
      nameFr: "Boost X",
      description: "Multiplie l'intervalle d'attaque par 0.33 pendant 2 minutes.",
      price: 20000,
      spritePath: "assets/items/x_boost.png",
      itemType: "boost",
      effectKind: "attack_interval_multiplier",
      effectValue: 0.33,
      effectDurationMs: BOOST_X_DURATION_MS,
      stockTracked: false,
      sortOrder: 10,
    },
    water_stone: {
      id: "water_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.water_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.water_stone.price,
      spritePath: stoneConfigByType.water_stone.spritePath,
      itemType: "stone",
      stoneType: "water_stone",
      methodItem: stoneConfigByType.water_stone.methodItem,
      stockTracked: true,
      sortOrder: 10,
    },
    fire_stone: {
      id: "fire_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.fire_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.fire_stone.price,
      spritePath: stoneConfigByType.fire_stone.spritePath,
      itemType: "stone",
      stoneType: "fire_stone",
      methodItem: stoneConfigByType.fire_stone.methodItem,
      stockTracked: true,
      sortOrder: 20,
    },
    leaf_stone: {
      id: "leaf_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.leaf_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.leaf_stone.price,
      spritePath: stoneConfigByType.leaf_stone.spritePath,
      itemType: "stone",
      stoneType: "leaf_stone",
      methodItem: stoneConfigByType.leaf_stone.methodItem,
      stockTracked: true,
      sortOrder: 30,
    },
    galarica_wreath: {
      id: "galarica_wreath",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.galarica_wreath.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.galarica_wreath.price,
      spritePath: stoneConfigByType.galarica_wreath.spritePath,
      itemType: "stone",
      stoneType: "galarica_wreath",
      methodItem: stoneConfigByType.galarica_wreath.methodItem,
      stockTracked: true,
      sortOrder: 40,
    },
    ice_stone: {
      id: "ice_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.ice_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.ice_stone.price,
      spritePath: stoneConfigByType.ice_stone.spritePath,
      itemType: "stone",
      stoneType: "ice_stone",
      methodItem: stoneConfigByType.ice_stone.methodItem,
      stockTracked: true,
      sortOrder: 50,
    },
    moon_stone: {
      id: "moon_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.moon_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.moon_stone.price,
      spritePath: stoneConfigByType.moon_stone.spritePath,
      itemType: "stone",
      stoneType: "moon_stone",
      methodItem: stoneConfigByType.moon_stone.methodItem,
      stockTracked: true,
      sortOrder: 60,
    },
    sun_stone: {
      id: "sun_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.sun_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.sun_stone.price,
      spritePath: stoneConfigByType.sun_stone.spritePath,
      itemType: "stone",
      stoneType: "sun_stone",
      methodItem: stoneConfigByType.sun_stone.methodItem,
      stockTracked: true,
      sortOrder: 70,
    },
    thunder_stone: {
      id: "thunder_stone",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.thunder_stone.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.thunder_stone.price,
      spritePath: stoneConfigByType.thunder_stone.spritePath,
      itemType: "stone",
      stoneType: "thunder_stone",
      methodItem: stoneConfigByType.thunder_stone.methodItem,
      stockTracked: true,
      sortOrder: 80,
    },
    cable_link: {
      id: "cable_link",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.cable_link.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.cable_link.price,
      spritePath: stoneConfigByType.cable_link.spritePath,
      itemType: "stone",
      stoneType: "cable_link",
      methodItem: stoneConfigByType.cable_link.methodItem,
      stockTracked: true,
      sortOrder: 90,
    },
    metal_coat: {
      id: "metal_coat",
      category: SHOP_TAB_EVOLUTIONS,
      nameFr: stoneConfigByType.metal_coat.nameFr,
      description: "Remplit la condition d'evolution d'une espece compatible (sans evolution immediate).",
      price: stoneConfigByType.metal_coat.price,
      spritePath: stoneConfigByType.metal_coat.spritePath,
      itemType: "stone",
      stoneType: "metal_coat",
      methodItem: stoneConfigByType.metal_coat.methodItem,
      stockTracked: true,
      sortOrder: 100,
    },
  };
}

export function createShopItemConfigById(ballConfigByType = createDefaultBallConfigByType(), extraShopItemsById = {}) {
  const shopItems = {};
  for (const ballConfig of Object.values(ballConfigByType)) {
    if (!ballConfig?.type) {
      continue;
    }
    shopItems[ballConfig.type] = {
      id: ballConfig.type,
      category: SHOP_TAB_POKEBALLS,
      nameFr: ballConfig.nameFr,
      description: ballConfig.description,
      price: ballConfig.price,
      spritePath: ballConfig.spritePath,
      itemType: "ball",
      ballType: ballConfig.type,
      sortOrder: Math.max(0, toSafeInt(ballConfig.sortOrder, 0)),
    };
  }
  for (const [id, item] of Object.entries(extraShopItemsById || {})) {
    if (!id || !item || typeof item !== "object") {
      continue;
    }
    shopItems[id] = { ...item };
  }
  return shopItems;
}
