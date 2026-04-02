import { useEffect, useMemo, useState } from "react";
import { loadContentRegistry } from "@pokeidle/content-data";
import type { LayoutMode, Locale } from "@pokeidle/contracts";
import {
  applySliceAction,
  deriveSliceView,
  detectPreferredLocale,
  pickLocalizedText,
  resolveLayoutMode,
  syncSliceProgressionState,
} from "@pokeidle/game-core";
import type { SaveManagerState, SliceAction } from "@pokeidle/game-core";
import { SaveWindow } from "../game/hud/SaveWindow";
import { CompactHud, type WindowKey } from "../game/hud/CompactHud";
import { CurrentZonePanel } from "../game/hud/CurrentZonePanel";
import { BattleCanvas } from "../game/render/BattleCanvas";
import { DialogueWindow } from "../game/windows/DialogueWindow";
import { MapWindow } from "../game/windows/MapWindow";
import { PlaceholderWindow } from "../game/windows/PlaceholderWindow";
import { QuestsWindow } from "../game/windows/QuestsWindow";
import { gameSaveManager } from "./save-manager";
import "./app.css";

const placeholderCopy = {
  en: {
    dexTitle: "Pokedex",
    dexRows: ["Sinnoh slice data", "Species pipeline later", "Tracking stays local"],
    teamTitle: "Team",
    teamRows: ["Team management is not wired yet", "Current slice validates towns", "Combat runtime comes next"],
    sceneTown: "Town",
    sceneCombat: "Combat",
    sceneGym: "Gym",
    noQuest: "No main quest",
    slots: "Slots 3/6",
    contentError: "Content registry failed to load.",
  },
  fr: {
    dexTitle: "Pokedex",
    dexRows: ["Donnees slice Sinnoh", "Pipeline especes plus tard", "Suivi sauvegarde en local"],
    teamTitle: "Equipe",
    teamRows: ["Gestion d'equipe pas encore branchee", "La slice valide villes et progression", "Le runtime combat arrive ensuite"],
    sceneTown: "Ville",
    sceneCombat: "Combat",
    sceneGym: "Arene",
    noQuest: "Pas de quete main",
    slots: "Slots 3/6",
    contentError: "Le registre de contenu a echoue au chargement.",
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

function getQuestChipLabel(locale: Locale, questTitle: string | null): string {
  return questTitle ?? placeholderCopy[locale].noQuest;
}

export function App() {
  const [deviceLocale] = useState<Locale>(() => readLocale());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => readLayoutMode());
  const [activeWindow, setActiveWindow] = useState<WindowKey | null>(null);
  const [saveState, setSaveState] = useState<SaveManagerState>(() => gameSaveManager.getState());
  const [selectedMapZoneId, setSelectedMapZoneId] = useState<string>("town-1");
  const registryState = useMemo(() => {
    try {
      return {
        registry: loadContentRegistry(),
        error: null,
      };
    } catch (error) {
      return {
        registry: null,
        error: error instanceof Error ? error.message : "Content registry failed to load.",
      };
    }
  }, []);

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
    const registry = registryState.registry;

    if (!registry) {
      return undefined;
    }

    const unsubscribe = gameSaveManager.subscribe(setSaveState);
    const detachLifecycle = gameSaveManager.attachLifecycle();

    void (async () => {
      await gameSaveManager.load();
      gameSaveManager.update((draft) => {
        syncSliceProgressionState(draft, registry);
      }, { immediate: true });
    })();

    return () => {
      unsubscribe();
      detachLifecycle();
    };
  }, [registryState.registry]);

  const locale = saveState.snapshot.preferences.localeOverride ?? deviceLocale;
  const text = placeholderCopy[locale];

  const sliceView = useMemo(() => {
    if (!registryState.registry) {
      return null;
    }

    return deriveSliceView(saveState.snapshot, registryState.registry);
  }, [registryState.registry, saveState.snapshot]);

  useEffect(() => {
    if (sliceView) {
      setSelectedMapZoneId(sliceView.activeZone.zone.id);
    }
  }, [sliceView?.activeZone.zone.id]);

  const handleExport = () => {
    const blob = new Blob([gameSaveManager.exportToString()], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pokeidle-save-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const runSliceAction = (action: SliceAction) => {
    const registry = registryState.registry;

    if (!registry) {
      return;
    }

    gameSaveManager.update((draft) => {
      applySliceAction(draft, registry, action);
    }, { immediate: true });
  };

  if (registryState.error || !sliceView) {
    return (
      <main className="game-shell game-shell--error">
        <section className="game-error">
          <strong>{text.contentError}</strong>
          <p>{registryState.error}</p>
        </section>
      </main>
    );
  }

  const firstMainQuest =
    sliceView.mainQuests.find((entry) => entry.progress.state === "active") ??
    sliceView.mainQuests.find((entry) => entry.progress.state === "available") ??
    sliceView.mainQuests.find((entry) => entry.progress.state === "completed");
  const zoneLabel = pickLocalizedText(sliceView.activeZone.zone.name, locale);
  const questLabel = getQuestChipLabel(
    locale,
    firstMainQuest ? pickLocalizedText(firstMainQuest.quest.title, locale) : null,
  );
  const timerLabel =
    sliceView.activeZone.zone.kind === "combat"
      ? `${sliceView.activeZone.zone.battle.enemyTimerSeconds}s`
      : "--";
  const sceneLabel =
    sliceView.activeZone.sceneKind === "combat"
      ? text.sceneCombat
      : sliceView.activeZone.sceneKind === "gym"
        ? text.sceneGym
        : text.sceneTown;

  return (
    <main className={`game-shell game-shell--${layoutMode}`}>
      <BattleCanvas
        layoutMode={layoutMode}
        sceneKind={sliceView.activeZone.sceneKind}
        zoneLabel={zoneLabel}
      />
      <CompactHud
        locale={locale}
        layoutMode={layoutMode}
        activeWindow={activeWindow}
        zoneLabel={zoneLabel}
        questLabel={questLabel}
        timerLabel={timerLabel}
        slotsLabel={text.slots}
        sceneLabel={sceneLabel}
        onToggleWindow={(window) => {
          setActiveWindow((current) => (current === window ? null : window));
        }}
      />

      <CurrentZonePanel
        locale={locale}
        view={sliceView}
        onCompleteZone={(zoneId) => {
          runSliceAction({ type: "complete_zone_debug", zoneId });
        }}
        onOpenTeam={() => setActiveWindow("team")}
        onStartDialogue={(zoneId, activityId) => {
          runSliceAction({ type: "start_dialogue_activity", zoneId, activityId });
        }}
        onWinBattle={(battleId) => {
          runSliceAction({ type: "win_battle_debug", battleId });
        }}
      />

      {sliceView.activeDialogue ? (
        <DialogueWindow
          activeDialogue={sliceView.activeDialogue}
          locale={locale}
          onClose={() => runSliceAction({ type: "close_dialogue" })}
          onNext={() => runSliceAction({ type: "advance_dialogue" })}
        />
      ) : null}

      <aside className={activeWindow ? "focus-window is-visible" : "focus-window"}>
        {activeWindow === "save" ? (
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
              if (registryState.registry) {
                gameSaveManager.update((draft) => {
                  syncSliceProgressionState(draft, registryState.registry!);
                }, { immediate: true });
              }
            }}
          />
        ) : null}

        {activeWindow === "map" ? (
          <MapWindow
            locale={locale}
            selectedZoneId={selectedMapZoneId}
            view={sliceView}
            onSelectZone={setSelectedMapZoneId}
            onTravel={(zoneId) => {
              runSliceAction({ type: "travel_to_zone", zoneId });
              setActiveWindow(null);
            }}
          />
        ) : null}

        {activeWindow === "quests" ? (
          <QuestsWindow
            locale={locale}
            mainQuests={sliceView.mainQuests}
            onClaim={(questId) => runSliceAction({ type: "claim_quest_reward", questId })}
            sideQuests={sliceView.sideQuests}
          />
        ) : null}

        {activeWindow === "dex" ? (
          <PlaceholderWindow rows={text.dexRows} title={text.dexTitle} />
        ) : null}

        {activeWindow === "team" ? (
          <PlaceholderWindow rows={text.teamRows} title={text.teamTitle} />
        ) : null}
      </aside>
    </main>
  );
}
