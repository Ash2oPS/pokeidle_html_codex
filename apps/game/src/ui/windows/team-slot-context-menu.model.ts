import type { Locale } from "@pokeidle/contracts";

export interface TeamSlotContextActionDescriptor {
  id: "add" | "change" | "clear";
  label: string;
  enabled: boolean;
  tone: "default" | "danger";
}

const copy = {
  en: {
    add: "Add Pokemon",
    change: "Change Pokemon",
    clear: "Clear Slot",
  },
  fr: {
    add: "Ajouter un Pokémon",
    change: "Changer le Pokémon",
    clear: "Vider le slot",
  },
} as const;

export function buildTeamSlotContextActions(
  locale: Locale,
  hasPokemon: boolean,
  canOpenPicker: boolean,
): TeamSlotContextActionDescriptor[] {
  const text = copy[locale];

  if (!hasPokemon) {
    return [
      {
        id: "add",
        label: text.add,
        enabled: canOpenPicker,
        tone: "default",
      },
    ];
  }

  return [
    {
      id: "change",
      label: text.change,
      enabled: canOpenPicker,
      tone: "default",
    },
    {
      id: "clear",
      label: text.clear,
      enabled: true,
      tone: "danger",
    },
  ];
}
