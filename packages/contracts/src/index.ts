export type Locale = "en" | "fr";

export interface LocalizedText {
  en: string;
  fr: string;
}

export type LayoutMode = "desktop-landscape" | "mobile-portrait";

export type ZoneKind = "combat" | "pacifist";

export interface ZoneLink {
  targetZoneId: string;
  requiresCompletion: boolean;
  unlockFlag?: string;
}

export interface ZoneBattleSettings {
  enemyPoolIds: string[];
  enemyTimerSeconds: number;
  defeatsRequired: number;
}

export interface ZoneDefinition {
  id: string;
  kind: ZoneKind;
  name: LocalizedText;
  neighbors: ZoneLink[];
  battle?: ZoneBattleSettings;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonSpeciesSummary {
  id: string;
  dexNumber: number;
  familyId: string;
  name: LocalizedText;
  primaryType: string;
  secondaryType?: string;
  spriteUrl: string;
  baseStats: BaseStats;
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  text: LocalizedText;
}

export interface DialogueDocument {
  id: string;
  title: LocalizedText;
  lines: DialogueLine[];
}
