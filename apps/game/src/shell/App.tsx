import { useEffect, useMemo, useState } from "react";
import { loadContentRegistry } from "@pokeidle/content-data";
import type {
  CombatResolvedAttackEvent,
  LayoutMode,
  Locale,
} from "@pokeidle/contracts";
import {
  STARTER_IDS,
  applySliceAction,
  buildCombatSessionKey,
  canResumeBattle,
  canStartGymBattle,
  chooseStarter,
  countFilledTeamSlots,
  deriveCombatView,
  deriveSliceView,
  detectPreferredLocale,
  getAssignableSpeciesIdsForTeamSlot,
  hasCombatStepDue,
  pickLocalizedText,
  resolveLayoutMode,
  setTeamSlot,
  startGymBattle,
  startWildBattle,
  syncGameRuntimeState,
} from "@pokeidle/game-core";
import type { SaveManagerState, SliceAction } from "@pokeidle/game-core";
import { CompactHud, type WindowKey } from "../ui/hud/CompactHud";
import { CurrentZonePanel } from "../ui/hud/CurrentZonePanel";
import { SaveWindow } from "../ui/hud/SaveWindow";
import { BattleCanvas, type BattleSlotPressPayload } from "../ui/render/BattleCanvas";
import type { BattleAttackVisualEvent } from "../ui/render/attack-animation";
import { DialogueWindow } from "../ui/windows/DialogueWindow";
import { MapWindow } from "../ui/windows/MapWindow";
import { PlaceholderWindow } from "../ui/windows/PlaceholderWindow";
import { QuestsWindow } from "../ui/windows/QuestsWindow";
import { StarterChoiceWindow } from "../ui/windows/StarterChoiceWindow";
import { TeamSlotContextMenu } from "../ui/windows/TeamSlotContextMenu";
import { TeamSlotPicker } from "../ui/windows/TeamSlotPicker";
import { TeamWindow } from "../ui/windows/TeamWindow";
import { gameSaveManager } from "./save-manager";
import "./shell.css";

const uiCopy = {
  en: {
    dexTitle: "Pokedex",
    dexRows: ["Sinnoh species", "Capture layer later", "Full dex views later"],
    sceneTown: "Town",
    sceneCombat: "Combat",
    sceneGym: "Gym",
    noQuest: "No main quest",
    noEnemy: "No enemy",
    idleProgress: "--",
    slotsPrefix: "Slots",
    levelShort: "Lv.",
    hpShort: "HP",
    reactionWet: "wet",
    contentError: "Content registry failed to load.",
  },
  fr: {
    dexTitle: "Pokedex",
    dexRows: ["Espèces Sinnoh", "Capture plus tard", "Vue dex complète plus tard"],
    sceneTown: "Ville",
    sceneCombat: "Combat",
    sceneGym: "Arène",
    noQuest: "Pas de quête principale",
    noEnemy: "Aucun ennemi",
    idleProgress: "--",
    slotsPrefix: "Slots",
    levelShort: "Niv.",
    hpShort: "PV",
    reactionWet: "mouillé",
    contentError: "Le registre de contenu a échoué au chargement.",
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
  return questTitle ?? uiCopy[locale].noQuest;
}

function formatLevelLabel(levelPrefix: string, level: number): string {
  return `${levelPrefix} ${level}`;
}

interface TeamSlotOverlayState {
  slotIndex: number;
  anchorX: number;
  anchorY: number;
}

export function App() {
  const [deviceLocale] = useState<Locale>(() => readLocale());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => readLayoutMode());
  const [activeWindow, setActiveWindow] = useState<WindowKey | null>(null);
  const [saveState, setSaveState] = useState<SaveManagerState>(() => gameSaveManager.getState());
  const [selectedMapZoneId, setSelectedMapZoneId] = useState<string>("town-1");
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [liveAttackEvents, setLiveAttackEvents] = useState<CombatResolvedAttackEvent[]>([]);
  const [slotMenuState, setSlotMenuState] = useState<TeamSlotOverlayState | null>(null);
  const [slotPickerState, setSlotPickerState] = useState<TeamSlotOverlayState | null>(null);
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
        syncGameRuntimeState(draft, registry);
      }, { immediate: true });
    })();

    return () => {
      unsubscribe();
      detachLifecycle();
    };
  }, [registryState.registry]);

  useEffect(() => {
    const registry = registryState.registry;

    if (!registry || !saveState.snapshot.battle.activeSession) {
      return undefined;
    }

    let timeoutId: number | null = null;
    let cancelled = false;

    const scheduleNextTick = () => {
      if (cancelled) {
        return;
      }

      const session = gameSaveManager.getState().snapshot.battle.activeSession;

      if (!session) {
        return;
      }

      const remainingMs = Math.max(
        0,
        Date.parse(session.lastProcessedAt) + registry.progression.slotIntervalMs - Date.now(),
      );

      timeoutId = window.setTimeout(runTick, Math.min(100, remainingMs));
    };

    const runTick = () => {
      if (cancelled) {
        return;
      }

      const nowValue = Date.now();
      const nowIso = new Date(nowValue).toISOString();
      const snapshot = gameSaveManager.getState().snapshot;
      const session = snapshot.battle.activeSession;

      if (!session) {
        return;
      }

      const deltaMs = session
        ? Math.max(0, Date.parse(nowIso) - Date.parse(session.lastProcessedAt))
        : 0;
      const allowVisualEvents =
        document.visibilityState === "visible" &&
        deltaMs <= registry.progression.slotIntervalMs * 1.25;

      setNowMs(nowValue);

      if (hasCombatStepDue(snapshot, registry, nowIso)) {
        const visualEvents: CombatResolvedAttackEvent[] = [];
        gameSaveManager.update((draft) => {
          syncGameRuntimeState(
            draft,
            registry,
            nowIso,
            allowVisualEvents
              ? (event) => {
                  visualEvents.push(event);
                }
              : undefined,
          );
        });

        if (visualEvents.length > 0) {
          setLiveAttackEvents(visualEvents);
        }
      }

      scheduleNextTick();
    };

    scheduleNextTick();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [registryState.registry, saveState.snapshot.battle.activeSession]);

  const locale = saveState.snapshot.preferences.localeOverride ?? deviceLocale;
  const text = uiCopy[locale];
  const nowIso = useMemo(() => new Date(nowMs).toISOString(), [nowMs]);

  const sliceView = useMemo(() => {
    if (!registryState.registry) {
      return null;
    }

    return deriveSliceView(saveState.snapshot, registryState.registry);
  }, [registryState.registry, saveState.snapshot]);

  const combatView = useMemo(() => {
    if (!registryState.registry) {
      return null;
    }

    return deriveCombatView(saveState.snapshot, registryState.registry, nowIso);
  }, [nowIso, registryState.registry, saveState.snapshot]);

  const combatSessionKey = useMemo(
    () => (combatView?.session ? buildCombatSessionKey(combatView.session) : null),
    [combatView?.session],
  );

  useEffect(() => {
    setLiveAttackEvents([]);
  }, [combatSessionKey]);

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

  if (registryState.error || !sliceView || !combatView) {
    return (
      <main className="game-shell game-shell--error">
        <section className="game-error">
          <strong>{text.contentError}</strong>
          <p>{registryState.error}</p>
        </section>
      </main>
    );
  }

  const registry = registryState.registry!;
  const runSliceAction = (action: SliceAction) => {
    gameSaveManager.update((draft) => {
      applySliceAction(draft, registry, action);
      syncGameRuntimeState(draft, registry);
    }, { immediate: true });
  };

  const unlockedSpecies = saveState.snapshot.player.unlockedSpeciesIds
    .map((speciesId) => registry.speciesById[speciesId])
    .filter((species): species is NonNullable<typeof species> => Boolean(species))
    .sort((left, right) => left.dexNumber - right.dexNumber);
  const teamSlotVisuals = saveState.snapshot.player.teamSlots.map((speciesId) => {
    if (!speciesId) {
      return {
        speciesId: null,
        label: null,
        levelLabel: null,
        frontSpriteUrl: null,
      };
    }

    const species = registry.speciesById[speciesId] ?? null;
    const progress = saveState.snapshot.species[speciesId] ?? null;

    return {
      speciesId,
      label: species ? pickLocalizedText(species.name, locale) : speciesId,
      levelLabel: formatLevelLabel(text.levelShort, progress?.level ?? 1),
      frontSpriteUrl: species?.frontSpriteUrl ?? null,
    };
  });
  const assignableSpeciesIdsBySlot = saveState.snapshot.player.teamSlots.map((_, slotIndex) =>
    getAssignableSpeciesIdsForTeamSlot(saveState.snapshot, registry, slotIndex),
  );
  const pickerSpeciesBySlot = saveState.snapshot.player.teamSlots.map((speciesId, slotIndex) => {
    const assignableIds = new Set(assignableSpeciesIdsBySlot[slotIndex] ?? []);

    return unlockedSpecies.filter(
      (species) => assignableIds.has(species.id) && species.id !== speciesId,
    );
  });
  const starterSpecies = STARTER_IDS
    .map((speciesId) => registry.speciesById[speciesId])
    .filter((species): species is NonNullable<typeof species> => Boolean(species));
  const firstMainQuest =
    sliceView.mainQuests.find((entry) => entry.progress.state === "active") ??
    sliceView.mainQuests.find((entry) => entry.progress.state === "available") ??
    sliceView.mainQuests.find((entry) => entry.progress.state === "completed");
  const zoneLabel = pickLocalizedText(sliceView.activeZone.zone.name, locale);
  const questLabel = getQuestChipLabel(
    locale,
    firstMainQuest ? pickLocalizedText(firstMainQuest.quest.title, locale) : null,
  );
  const sceneKind =
    combatView.session?.kind === "gym"
      ? "gym"
      : combatView.session?.kind === "wild"
        ? "combat"
        : sliceView.activeZone.sceneKind;
  const sceneLabel =
    sceneKind === "combat"
      ? text.sceneCombat
      : sceneKind === "gym"
        ? text.sceneGym
        : text.sceneTown;
  const enemyLabel =
    combatView.enemySpecies ? pickLocalizedText(combatView.enemySpecies.name, locale) : text.noEnemy;
  const timerLabel =
    combatView.remainingTimerLabel ??
    (sliceView.activeZone.zone.kind === "combat"
      ? `${sliceView.activeZone.zone.battle.enemyTimerSeconds}s`
      : text.idleProgress);
  const progressLabel =
    combatView.defeatProgressLabel ??
    (sliceView.activeZone.zone.kind === "combat"
      ? `0/${sliceView.activeZone.zone.battle.defeatsRequired}`
      : text.idleProgress);
  const slotsLabel = `${text.slotsPrefix} ${countFilledTeamSlots(saveState.snapshot)}/6`;
  const reactionLabel =
    combatView.reactionLabel === "wet" ? text.reactionWet : combatView.reactionLabel;
  const showStarterChoice =
    saveState.snapshot.flags["talked-to-rowan"] === true &&
    !saveState.snapshot.player.starterChoice &&
    !sliceView.activeDialogue;

  const closeTeamSlotOverlays = () => {
    setSlotMenuState(null);
    setSlotPickerState(null);
  };

  useEffect(() => {
    if (!slotMenuState && !slotPickerState) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      closeTeamSlotOverlays();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [slotMenuState, slotPickerState]);

  useEffect(() => {
    if (!combatView.session || activeWindow || sliceView.activeDialogue || showStarterChoice) {
      closeTeamSlotOverlays();
    }
  }, [activeWindow, combatView.session, showStarterChoice, sliceView.activeDialogue]);

  const handleImport = async (serializedSave: string) => {
    await gameSaveManager.importFromString(serializedSave);
    gameSaveManager.update((draft) => {
      syncGameRuntimeState(draft, registry);
    }, { immediate: true });
  };

  const handleChooseStarter = (speciesId: string) => {
    gameSaveManager.update((draft) => {
      chooseStarter(draft, registry, speciesId);
      syncGameRuntimeState(draft, registry);
    }, { immediate: true });
  };

  const handleSetTeamSlot = (slotIndex: number, speciesId: string | null) => {
    gameSaveManager.update((draft) => {
      setTeamSlot(draft, registry, slotIndex, speciesId);
      syncGameRuntimeState(draft, registry);
    }, { immediate: true });
  };

  const handleSlotPress = ({ slotIndex, anchorClientX, anchorClientY }: BattleSlotPressPayload) => {
    if (!combatView.session || activeWindow || sliceView.activeDialogue || showStarterChoice) {
      return;
    }

    const matchesOpenSlot =
      slotPickerState?.slotIndex === slotIndex || slotMenuState?.slotIndex === slotIndex;

    if (matchesOpenSlot) {
      closeTeamSlotOverlays();
      return;
    }

    setSlotPickerState(null);
    setSlotMenuState({
      slotIndex,
      anchorX: anchorClientX,
      anchorY: anchorClientY,
    });
  };

  const handleStartWildBattle = (zoneId: string) => {
    gameSaveManager.update((draft) => {
      if (!canResumeBattle(draft, { kind: "wild", zoneId })) {
        startWildBattle(draft, registry, zoneId);
      }
      syncGameRuntimeState(draft, registry);
    }, { immediate: true });
  };

  const handleStartGymBattle = (zoneId: string, battleId: string) => {
    gameSaveManager.update((draft) => {
      if (!canResumeBattle(draft, { kind: "gym", battleId })) {
        startGymBattle(draft, registry, zoneId, battleId);
      }
      syncGameRuntimeState(draft, registry);
    }, { immediate: true });
  };

  const saveCounterSpeciesId =
    saveState.snapshot.player.starterChoice ??
    saveState.snapshot.player.unlockedSpeciesIds[0] ??
    "chimchar";
  const attackVisualEvents = useMemo<BattleAttackVisualEvent[]>(
    () =>
      liveAttackEvents
        .filter((event) => event.sessionKey === combatSessionKey)
        .map((event) => {
        const attackerSpecies = registry.speciesById[event.attackerSpeciesId] ?? null;
        const enemySpecies = registry.speciesById[event.enemySpeciesId] ?? null;

        return {
          ...event,
          attackerFrontSpriteUrl: attackerSpecies?.frontSpriteUrl ?? null,
          attackerLabel: attackerSpecies ? pickLocalizedText(attackerSpecies.name, locale) : event.attackerSpeciesId,
          enemyFrontSpriteUrl: enemySpecies?.frontSpriteUrl ?? null,
          enemyLabel: enemySpecies ? pickLocalizedText(enemySpecies.name, locale) : event.enemySpeciesId,
        };
        }),
    [combatSessionKey, liveAttackEvents, locale, registry.speciesById],
  );
  const activeSlotOverlay = slotPickerState ?? slotMenuState;
  const activeSlotVisual = activeSlotOverlay
    ? teamSlotVisuals[activeSlotOverlay.slotIndex] ?? null
    : null;

  return (
    <main className={`game-shell game-shell--${layoutMode}`}>
      <BattleCanvas
        activeSlotIndex={combatView.activeSlotIndex}
        attackEvents={attackVisualEvents}
        combatSessionKey={combatSessionKey}
        enemyHpPercent={combatView.enemyHpPercent}
        enemyVisual={
          combatView.enemySpecies && combatView.session
            ? {
                speciesId: combatView.enemySpecies.id,
                label: pickLocalizedText(combatView.enemySpecies.name, locale),
                levelLabel: formatLevelLabel(text.levelShort, combatView.session.enemy.level),
                currentHp: combatView.session.enemy.currentHp,
                maxHp: combatView.session.enemy.maxHp,
                hpUnitLabel: text.hpShort,
                frontSpriteUrl: combatView.enemySpecies.frontSpriteUrl,
              }
            : null
        }
        layoutMode={layoutMode}
        reactionLabel={reactionLabel}
        sceneKind={sceneKind}
        teamSlotVisuals={teamSlotVisuals}
        {...(combatView.session ? { onSlotPress: handleSlotPress } : {})}
      />

      <CompactHud
        activeWindow={activeWindow}
        enemyLabel={enemyLabel}
        layoutMode={layoutMode}
        locale={locale}
        onToggleWindow={(window) => {
          setActiveWindow((current) => (current === window ? null : window));
        }}
        progressLabel={progressLabel}
        questLabel={questLabel}
        reactionLabel={reactionLabel}
        sceneLabel={sceneLabel}
        slotsLabel={slotsLabel}
        timerLabel={timerLabel}
        zoneLabel={zoneLabel}
      />

      <CurrentZonePanel
        canResumeGymBattle={(battleId) => canResumeBattle(saveState.snapshot, { kind: "gym", battleId })}
        canResumeWildBattle={(zoneId) => canResumeBattle(saveState.snapshot, { kind: "wild", zoneId })}
        canStartGymBattle={(battleId) => {
          const battle = registry.battlesById[battleId];
          return battle ? canStartGymBattle(saveState.snapshot, battle) : false;
        }}
        combatView={combatView}
        layoutMode={layoutMode}
        locale={locale}
        onEnterWildBattle={handleStartWildBattle}
        onOpenTeam={() => setActiveWindow("team")}
        onStartDialogue={(zoneId, activityId) => {
          runSliceAction({ type: "start_dialogue_activity", zoneId, activityId });
        }}
        onStartGymBattle={handleStartGymBattle}
        view={sliceView}
      />

      {sliceView.activeDialogue ? (
        <DialogueWindow
          activeDialogue={sliceView.activeDialogue}
          locale={locale}
          onClose={() => runSliceAction({ type: "close_dialogue" })}
          onNext={() => runSliceAction({ type: "advance_dialogue" })}
        />
      ) : null}

      {showStarterChoice ? (
        <StarterChoiceWindow locale={locale} onChoose={handleChooseStarter} starters={starterSpecies} />
      ) : null}

      {slotMenuState ? (
        <TeamSlotContextMenu
          anchor={{ x: slotMenuState.anchorX, y: slotMenuState.anchorY }}
          canOpenPicker={(pickerSpeciesBySlot[slotMenuState.slotIndex] ?? []).length > 0}
          layoutMode={layoutMode}
          locale={locale}
          onClear={() => {
            handleSetTeamSlot(slotMenuState.slotIndex, null);
            closeTeamSlotOverlays();
          }}
          onClose={closeTeamSlotOverlays}
          onRequestChange={() => {
            setSlotPickerState(slotMenuState);
            setSlotMenuState(null);
          }}
          slotIndex={slotMenuState.slotIndex}
          slotLabel={activeSlotVisual?.label ?? null}
        />
      ) : null}

      {slotPickerState ? (
        <TeamSlotPicker
          anchor={{ x: slotPickerState.anchorX, y: slotPickerState.anchorY }}
          availableSpecies={pickerSpeciesBySlot[slotPickerState.slotIndex] ?? []}
          layoutMode={layoutMode}
          locale={locale}
          onChooseSpecies={(speciesId) => {
            handleSetTeamSlot(slotPickerState.slotIndex, speciesId);
            closeTeamSlotOverlays();
          }}
          onClose={closeTeamSlotOverlays}
          slotIndex={slotPickerState.slotIndex}
          speciesProgressById={saveState.snapshot.species}
        />
      ) : null}

      <aside className={activeWindow ? "focus-window is-visible" : "focus-window"}>
        {activeWindow === "save" ? (
          <SaveWindow
            locale={locale}
            onExport={handleExport}
            onFlush={() => gameSaveManager.flush()}
            onImport={handleImport}
            onIncrementCounter={(field) => {
              gameSaveManager.incrementSpeciesCounters(saveCounterSpeciesId, { [field]: 1 });
            }}
            onReset={async () => {
              const confirmed = window.confirm(
                locale === "fr" ? "Réinitialiser la sauvegarde locale ?" : "Reset local save?",
              );

              if (!confirmed) {
                return;
              }

              await gameSaveManager.reset();
              gameSaveManager.update((draft) => {
                syncGameRuntimeState(draft, registry);
              }, { immediate: true });
            }}
            saveState={saveState}
            speciesId={saveCounterSpeciesId}
            speciesLabel={
              registry.speciesById[saveCounterSpeciesId]
                ? pickLocalizedText(registry.speciesById[saveCounterSpeciesId].name, locale)
                : saveCounterSpeciesId
            }
          />
        ) : null}

        {activeWindow === "map" ? (
          <MapWindow
            locale={locale}
            selectedZoneId={selectedMapZoneId}
            view={sliceView}
            onSelectZone={setSelectedMapZoneId}
            onTravel={(zoneId) => {
              if (saveState.snapshot.battle.activeSession) {
                return;
              }
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

        {activeWindow === "dex" ? <PlaceholderWindow rows={text.dexRows} title={text.dexTitle} /> : null}

        {activeWindow === "team" ? (
          <TeamWindow
            assignableSpeciesIdsBySlot={assignableSpeciesIdsBySlot}
            locale={locale}
            onSetTeamSlot={handleSetTeamSlot}
            speciesProgressById={saveState.snapshot.species}
            teamSlots={saveState.snapshot.player.teamSlots}
            unlockedSpecies={unlockedSpecies}
          />
        ) : null}
      </aside>
    </main>
  );
}
