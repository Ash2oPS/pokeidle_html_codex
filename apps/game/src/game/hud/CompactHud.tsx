import type { LayoutMode, Locale } from "@pokeidle/contracts";

type WindowKey = "dex" | "team" | "quests" | "map";

interface CompactHudProps {
  locale: Locale;
  layoutMode: LayoutMode;
  activeWindow: WindowKey | null;
  onToggleWindow: (window: WindowKey) => void;
}

const labels = {
  en: {
    zone: "Zone 02",
    quest: "Main 1/2",
    timer: "7.8s",
    slots: "3/6",
    dex: "Dex",
    team: "Team",
    quests: "Quests",
    map: "Map",
    enemy: "Enemy"
  },
  fr: {
    zone: "Zone 02",
    quest: "Main 1/2",
    timer: "7,8s",
    slots: "3/6",
    dex: "Dex",
    team: "Équipe",
    quests: "Quêtes",
    map: "Carte",
    enemy: "Cible"
  }
} as const;

export function CompactHud({
  locale,
  layoutMode,
  activeWindow,
  onToggleWindow
}: CompactHudProps) {
  const copy = labels[locale];

  return (
    <>
      <header className={`hud-top hud-top--${layoutMode}`}>
        <div className="hud-chip hud-chip--zone">{copy.zone}</div>
        <div className="hud-chip">{copy.enemy}</div>
        <div className="hud-chip">{copy.timer}</div>
        <div className="hud-chip">{copy.quest}</div>
        <div className="hud-chip">{copy.slots}</div>
      </header>

      <nav className={`hud-actions hud-actions--${layoutMode}`} aria-label="game menus">
        {(["dex", "team", "quests", "map"] as const).map((window) => (
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
