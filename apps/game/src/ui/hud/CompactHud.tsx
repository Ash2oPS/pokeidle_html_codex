import type { LayoutMode, Locale } from "@pokeidle/contracts";

export type WindowKey = "dex" | "team" | "quests" | "map" | "save";

interface CompactHudProps {
  locale: Locale;
  layoutMode: LayoutMode;
  activeWindow: WindowKey | null;
  zoneLabel: string;
  questLabel: string;
  enemyLabel: string;
  progressLabel: string;
  timerLabel: string;
  slotsLabel: string;
  reactionLabel: string | null;
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
    team: "Équipe",
    quests: "Quêtes",
    map: "Carte",
    save: "Sauv.",
  },
} as const;

export function CompactHud({
  locale,
  layoutMode,
  activeWindow,
  zoneLabel,
  questLabel,
  enemyLabel,
  progressLabel,
  timerLabel,
  slotsLabel,
  reactionLabel,
  sceneLabel,
  onToggleWindow,
}: CompactHudProps) {
  const copy = labels[locale];

  return (
    <>
      <header className={`hud-top hud-top--${layoutMode}`}>
        <div className="hud-chip hud-chip--zone">{zoneLabel}</div>
        <div className="hud-chip">{sceneLabel}</div>
        <div className="hud-chip">{enemyLabel}</div>
        <div className="hud-chip">{timerLabel}</div>
        <div className="hud-chip">{progressLabel}</div>
        <div className="hud-chip">{questLabel}</div>
        <div className="hud-chip">{slotsLabel}</div>
        {reactionLabel ? <div className="hud-chip hud-chip--reaction">{reactionLabel}</div> : null}
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
