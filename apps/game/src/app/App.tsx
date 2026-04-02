import { useEffect, useMemo, useState } from "react";
import type { LayoutMode, Locale } from "@pokeidle/contracts";
import { detectPreferredLocale, resolveLayoutMode } from "@pokeidle/game-core";
import type { SaveManagerState } from "@pokeidle/game-core";
import { BattleCanvas } from "../game/render/BattleCanvas";
import { CompactHud, type WindowKey } from "../game/hud/CompactHud";
import { SaveWindow } from "../game/hud/SaveWindow";
import { gameSaveManager } from "./save-manager";
import "./app.css";

const focusContent = {
  en: {
    dex: {
      title: "Pokedex",
      rows: ["Sinnoh Dex", "Unlocked: 0013", "Seen: 0024", "Caught: 0007"],
    },
    team: {
      title: "Team",
      rows: ["Slot A  Lv12", "Slot B  Lv09", "Slot C  Lv07", "Slots D-F empty"],
    },
    quests: {
      title: "Quests",
      rows: ["Main 1  Reach Oreburgh", "Main 2  Clear Route", "Side 1  Talk to NPC"],
    },
    map: {
      title: "Map",
      rows: ["Town 1  Clear", "Route 1  Active", "Route 2  Locked", "Town 2  Gym"],
    },
  },
  fr: {
    dex: {
      title: "Pokédex",
      rows: ["Dex Sinnoh", "Débloqués : 0013", "Vus : 0024", "Capturés : 0007"],
    },
    team: {
      title: "Équipe",
      rows: ["Slot A  Nv12", "Slot B  Nv09", "Slot C  Nv07", "Slots D-F vides"],
    },
    quests: {
      title: "Quêtes",
      rows: ["Main 1  Atteindre Charbourg", "Main 2  Finir la route", "Side 1  Parler au PNJ"],
    },
    map: {
      title: "Carte",
      rows: ["Ville 1  Clear", "Route 1  Active", "Route 2  Locked", "Ville 2  Arène"],
    },
  },
} as const;

function readLocale(): Locale {
  return detectPreferredLocale(window.navigator.languages);
}

function readLayoutMode(): LayoutMode {
  return resolveLayoutMode({
    width: window.innerWidth,
    height: window.innerHeight,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

export function App() {
  const [deviceLocale] = useState<Locale>(() => readLocale());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => readLayoutMode());
  const [activeWindow, setActiveWindow] = useState<WindowKey | null>("dex");
  const [saveState, setSaveState] = useState<SaveManagerState>(() => gameSaveManager.getState());

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

  useEffect(() => {
    const unsubscribe = gameSaveManager.subscribe(setSaveState);
    const detachLifecycle = gameSaveManager.attachLifecycle();

    void gameSaveManager.load();

    return () => {
      unsubscribe();
      detachLifecycle();
    };
  }, []);

  const locale = saveState.snapshot.preferences.localeOverride ?? deviceLocale;
  const content = useMemo(() => focusContent[locale], [locale]);

  const handleExport = () => {
    const blob = new Blob([gameSaveManager.exportToString()], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pokeidle-save-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

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
          activeWindow === "save" ? (
            <SaveWindow
              locale={locale}
              saveState={saveState}
              onExport={handleExport}
              onFlush={() => gameSaveManager.flush()}
              onImport={(serializedSave) => gameSaveManager.importFromString(serializedSave)}
              onIncrementCounter={(field) => {
                gameSaveManager.incrementSpeciesCounters("chimchar", { [field]: 1 });
              }}
              onReset={async () => {
                const confirmed = window.confirm(
                  locale === "fr" ? "Reset la sauvegarde locale ?" : "Reset local save?",
                );

                if (!confirmed) {
                  return;
                }

                await gameSaveManager.reset();
              }}
            />
          ) : (
            <>
              <div className="focus-window__titlebar">
                <strong>{content[activeWindow].title}</strong>
                <div className="titlebar-actions">
                  <button
                    onClick={() =>
                      gameSaveManager.setLocaleOverride(locale === "en" ? "fr" : "en")
                    }
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
          )
        ) : null}
      </aside>
    </main>
  );
}
