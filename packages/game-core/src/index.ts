import type { LayoutMode, Locale, LocalizedText } from "@pokeidle/contracts";

export interface LayoutModeInput {
  width: number;
  height: number;
  maxTouchPoints?: number;
}

export function detectPreferredLocale(languages: readonly string[]): Locale {
  return languages.some((language) => language.toLowerCase().startsWith("fr"))
    ? "fr"
    : "en";
}

export function resolveLayoutMode({
  width,
  height,
  maxTouchPoints = 0,
}: LayoutModeInput): LayoutMode {
  const portrait = height >= width;
  const compactWidth = Math.min(width, height) <= 900;
  const touchFirst = maxTouchPoints > 0;

  if (portrait && (compactWidth || touchFirst)) {
    return "mobile-portrait";
  }

  return "desktop-landscape";
}

export function pickLocalizedText(text: LocalizedText, locale: Locale): string {
  return locale === "fr" ? text.fr || text.en : text.en || text.fr;
}

export * from "./save";
export * from "./runtime";
export * from "./combat/runtime";
export * from "./roster/runtime";
export * from "./slice";
export * from "./pokemon/scaling";
