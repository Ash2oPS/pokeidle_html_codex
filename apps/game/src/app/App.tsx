import { useEffect, useMemo, useState } from "react";
import type { LayoutMode, Locale } from "@pokeidle/contracts";
import { detectPreferredLocale, resolveLayoutMode } from "@pokeidle/game-core";
import { BattleCanvas } from "../game/render/BattleCanvas";
import { CompactHud } from "../game/hud/CompactHud";
import "./app.css";

type WindowKey = "dex" | "team" | "quests" | "map";

const focusContent = {
  en: {
    dex: {
      title: "Pokedex",
      rows: ["Sinnoh Dex", "Unlocked: 0013", "Seen: 0024", "Caught: 0007"]
    },
    team: {
      title: "Team",
      rows: ["Slot A  Lv12", "Slot B  Lv09", "Slot C  Lv07", "Slots D-F empty"]
    },
    quests: {
      title: "Quests",
      rows: ["Main 1  Reach Oreburgh", "Main 2  Clear Route", "Side 1  Talk to NPC"]
    },
    map: {
      title: "Map",
      rows: ["Town 1  Clear", "Route 1  Active", "Route 2  Locked", "Town 2  Gym"]
    }
  },
  fr: {
    dex: {
      title: "Pokédex",
      rows: ["Dex Sinnoh", "Débloqués : 0013", "Vus : 0024", "Capturés : 0007"]
    },
    team: {
      title: "Équipe",
      rows: ["Slot A  Nv12", "Slot B  Nv09", "Slot C  Nv07", "Slots D-F vides"]
    },
    quests: {
      title: "Quêtes",
      rows: ["Main 1  Atteindre Charbourg", "Main 2  Finir la route", "Side 1  Parler au PNJ"]
    },
    map: {
      title: "Carte",
      rows: ["Ville 1  Clear", "Route 1  Active", "Route 2  Locked", "Ville 2  Arène"]
    }
  }
} as const;

function readLocale(): Locale {
  return detectPreferredLocale(window.navigator.languages);
}

function readLayoutMode(): LayoutMode {
  return resolveLayoutMode({
    width: window.innerWidth,
    height: window.innerHeight,
    maxTouchPoints: navigator.maxTouchPoints
  });
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => readLocale());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => readLayoutMode());
  const [activeWindow, setActiveWindow] = useState<WindowKey | null>("dex");

  useEffect(() => {
    const handleResize = () => {
      setLayoutMode(readLayoutMode());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const content = useMemo(() => focusContent[locale], [locale]);

  return (
    <main className={`game-shell game-shell--${layoutMode}`}>
      <BattleCanvas layoutMode={layoutMode} />
      <CompactHud
        locale={locale}
        layoutMode={layoutMode}
        activeWindow={activeWindow}
        onToggleWindow={(window) => {
          setActiveWindow((current) => (current === window ? null : window));
        }}
      />

      <aside className={activeWindow ? "focus-window is-visible" : "focus-window"}>
        {activeWindow ? (
          <>
            <div className="focus-window__titlebar">
              <strong>{content[activeWindow].title}</strong>
              <div className="titlebar-actions">
                <button
                  onClick={() => setLocale((current) => (current === "en" ? "fr" : "en"))}
                  type="button"
                >
                  {locale.toUpperCase()}
                </button>
                <button onClick={() => setActiveWindow(null)} type="button">
                  ×
                </button>
              </div>
            </div>
            <div className="focus-window__body">
              {content[activeWindow].rows.map((row) => (
                <div key={row} className="focus-row">
                  {row}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </aside>
    </main>
  );
}
