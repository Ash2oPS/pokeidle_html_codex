import type { LayoutMode, Locale } from "@pokeidle/contracts";

export type WindowKey = "dex" | "team" | "quests" | "map" | "save";

interface CompactHudProps {
  locale: Locale;
  layoutMode: LayoutMode;
  activeWindow: WindowKey | null;
  zoneLabel: string;
  questLabel: string;
  timerLabel: string;
  slotsLabel: string;
  sceneLabel: string;
  onToggleWindow: (window: WindowKey) => void;
}

const labels = {
  en: {
    dex: "Dex",
    team: "Team",
    quests: "Quests",
    map: "Map",
    save: "Save",
  },
  fr: {
    dex: "Dex",
    team: "Equipe",
    quests: "Quetes",
    map: "Carte",
    save: "Save",
  },
} as const;

export function CompactHud({
  locale,
  layoutMode,
  activeWindow,
  zoneLabel,
  questLabel,
  timerLabel,
  slotsLabel,
  sceneLabel,
  onToggleWindow,
}: CompactHudProps) {
  const copy = labels[locale];

  return (
    <>
      <header className={`hud-top hud-top--${layoutMode}`}>
        <div className="hud-chip hud-chip--zone">{zoneLabel}</div>
        <div className="hud-chip">{sceneLabel}</div>
        <div className="hud-chip">{timerLabel}</div>
        <div className="hud-chip">{questLabel}</div>
        <div className="hud-chip">{slotsLabel}</div>
      </header>

      <nav className={`hud-actions hud-actions--${layoutMode}`} aria-label="game menus">
        {(["dex", "team", "quests", "map", "save"] as const).map((window) => (
          <button
            key={window}
            className={window === activeWindow ? "hud-action is-active" : "hud-action"}
            onClick={() => onToggleWindow(window)}
            type="button"
          >
            {copy[window]}
          </button>
        ))}
      </nav>
    </>
  );
}
