export type VfxSpriteId =
  | "bolt"
  | "ember"
  | "droplet"
  | "leaf"
  | "shard"
  | "bubble"
  | "wisp"
  | "ring"
  | "star"
  | "dust";

export type PhysicalStreakStyle =
  | "spark"
  | "slash"
  | "gust"
  | "dust"
  | "shadow";

export interface TypeVfxProfile {
  primaryColor: string;
  secondaryColor: string;
  trailColor: string;
  flashColor: string;
  projectileSpriteId: VfxSpriteId;
  impactSpriteId: VfxSpriteId;
  streakStyle: PhysicalStreakStyle;
}

export const typeVfxProfiles: Record<string, TypeVfxProfile> = {
  normal: {
    primaryColor: "#efe8d0",
    secondaryColor: "#fff8ea",
    trailColor: "#d7cfb8",
    flashColor: "#fff9e7",
    projectileSpriteId: "star",
    impactSpriteId: "star",
    streakStyle: "slash",
  },
  fire: {
    primaryColor: "#ff8d45",
    secondaryColor: "#ffd36a",
    trailColor: "#ffb14d",
    flashColor: "#fff3d5",
    projectileSpriteId: "ember",
    impactSpriteId: "ember",
    streakStyle: "spark",
  },
  water: {
    primaryColor: "#4ec4ff",
    secondaryColor: "#d6f7ff",
    trailColor: "#7adfff",
    flashColor: "#f2fdff",
    projectileSpriteId: "droplet",
    impactSpriteId: "droplet",
    streakStyle: "gust",
  },
  electric: {
    primaryColor: "#ffd94a",
    secondaryColor: "#fff8a8",
    trailColor: "#ffe56a",
    flashColor: "#fffbe0",
    projectileSpriteId: "bolt",
    impactSpriteId: "bolt",
    streakStyle: "spark",
  },
  grass: {
    primaryColor: "#6fc95d",
    secondaryColor: "#d6ff95",
    trailColor: "#8be173",
    flashColor: "#f3ffe8",
    projectileSpriteId: "leaf",
    impactSpriteId: "leaf",
    streakStyle: "gust",
  },
  ice: {
    primaryColor: "#9be6ff",
    secondaryColor: "#effcff",
    trailColor: "#b2efff",
    flashColor: "#f7fdff",
    projectileSpriteId: "shard",
    impactSpriteId: "shard",
    streakStyle: "slash",
  },
  fighting: {
    primaryColor: "#ef7f49",
    secondaryColor: "#ffd0ab",
    trailColor: "#ffa56a",
    flashColor: "#fff2ea",
    projectileSpriteId: "star",
    impactSpriteId: "star",
    streakStyle: "slash",
  },
  poison: {
    primaryColor: "#af5ff4",
    secondaryColor: "#e1bbff",
    trailColor: "#c481ff",
    flashColor: "#fbf0ff",
    projectileSpriteId: "bubble",
    impactSpriteId: "bubble",
    streakStyle: "shadow",
  },
  ground: {
    primaryColor: "#b78657",
    secondaryColor: "#f4d7a5",
    trailColor: "#cf9f66",
    flashColor: "#fff6eb",
    projectileSpriteId: "dust",
    impactSpriteId: "dust",
    streakStyle: "dust",
  },
  flying: {
    primaryColor: "#a2d6ff",
    secondaryColor: "#f6fbff",
    trailColor: "#c4e4ff",
    flashColor: "#ffffff",
    projectileSpriteId: "leaf",
    impactSpriteId: "ring",
    streakStyle: "gust",
  },
  psychic: {
    primaryColor: "#ff72d1",
    secondaryColor: "#ffd8ff",
    trailColor: "#ff9ce2",
    flashColor: "#fff0fb",
    projectileSpriteId: "ring",
    impactSpriteId: "ring",
    streakStyle: "shadow",
  },
  bug: {
    primaryColor: "#9fd84e",
    secondaryColor: "#efff99",
    trailColor: "#b7ec6a",
    flashColor: "#fbffe8",
    projectileSpriteId: "leaf",
    impactSpriteId: "leaf",
    streakStyle: "gust",
  },
  rock: {
    primaryColor: "#b39362",
    secondaryColor: "#f0ddae",
    trailColor: "#c0a376",
    flashColor: "#fff8ed",
    projectileSpriteId: "shard",
    impactSpriteId: "dust",
    streakStyle: "dust",
  },
  ghost: {
    primaryColor: "#8d7cff",
    secondaryColor: "#d7ccff",
    trailColor: "#a898ff",
    flashColor: "#f5f2ff",
    projectileSpriteId: "wisp",
    impactSpriteId: "wisp",
    streakStyle: "shadow",
  },
  dragon: {
    primaryColor: "#5f7fff",
    secondaryColor: "#bcc9ff",
    trailColor: "#8098ff",
    flashColor: "#f1f4ff",
    projectileSpriteId: "shard",
    impactSpriteId: "star",
    streakStyle: "slash",
  },
  dark: {
    primaryColor: "#53495f",
    secondaryColor: "#beb5cb",
    trailColor: "#776b87",
    flashColor: "#f1eef5",
    projectileSpriteId: "wisp",
    impactSpriteId: "star",
    streakStyle: "shadow",
  },
  steel: {
    primaryColor: "#b2c3d8",
    secondaryColor: "#f6fbff",
    trailColor: "#d3dfeb",
    flashColor: "#ffffff",
    projectileSpriteId: "shard",
    impactSpriteId: "shard",
    streakStyle: "slash",
  },
  fairy: {
    primaryColor: "#ff9dd8",
    secondaryColor: "#fff0fd",
    trailColor: "#ffc3ea",
    flashColor: "#fff8ff",
    projectileSpriteId: "star",
    impactSpriteId: "ring",
    streakStyle: "spark",
  },
};

const fallbackTypeVfxProfile: TypeVfxProfile = {
  primaryColor: "#efe8d0",
  secondaryColor: "#fff8ea",
  trailColor: "#d7cfb8",
  flashColor: "#fff9e7",
  projectileSpriteId: "star",
  impactSpriteId: "star",
  streakStyle: "slash",
};

export function getTypeVfxProfile(offensiveType: string): TypeVfxProfile {
  return typeVfxProfiles[offensiveType] ?? fallbackTypeVfxProfile;
}
