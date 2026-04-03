import type { LayoutMode, Locale } from "@pokeidle/contracts";
import type { CombatViewState, SliceViewState } from "@pokeidle/game-core";
import { pickLocalizedText } from "@pokeidle/game-core";

interface CurrentZonePanelProps {
  layoutMode: LayoutMode;
  locale: Locale;
  view: SliceViewState;
  combatView: CombatViewState;
  canStartGymBattle: (battleId: string) => boolean;
  canResumeGymBattle: (battleId: string) => boolean;
  canResumeWildBattle: (zoneId: string) => boolean;
  onEnterWildBattle: (zoneId: string) => void;
  onOpenTeam: () => void;
  onStartDialogue: (zoneId: string, activityId: string) => void;
  onStartGymBattle: (zoneId: string, battleId: string) => void;
}

const copy = {
  en: {
    title: "Current Zone",
    combat: "Combat Zone",
    pacifist: "Town Zone",
    completed: "Completed",
    active: "Active",
    timer: "Timer",
    defeats: "Defeats",
    pool: "Pool",
    enemy: "Enemy",
    actions: "Activities",
    talk: "Talk",
    team: "Team",
    startGym: "Start Gym",
    resume: "Resume",
    enterZone: "Enter",
    teamLimit: "Team limit",
  },
  fr: {
    title: "Zone active",
    combat: "Zone combat",
    pacifist: "Zone ville",
    completed: "Terminée",
    active: "En cours",
    timer: "Timer",
    defeats: "Victoires",
    pool: "Groupe",
    enemy: "Ennemi",
    actions: "Activités",
    talk: "Parler",
    team: "Équipe",
    startGym: "Lancer l’arène",
    resume: "Reprendre",
    enterZone: "Entrer",
    teamLimit: "Limite équipe",
  },
} as const;

export function CurrentZonePanel({
  layoutMode,
  locale,
  view,
  combatView,
  canStartGymBattle,
  canResumeGymBattle,
  canResumeWildBattle,
  onEnterWildBattle,
  onOpenTeam,
  onStartDialogue,
  onStartGymBattle,
}: CurrentZonePanelProps) {
  const text = copy[locale];
  const { zone, progress } = view.activeZone;
  const compactBattlePanel = layoutMode === "mobile-portrait" && Boolean(combatView.session);
  const liveTimerLabel =
    combatView.remainingTimerLabel ??
    (zone.kind === "combat" ? `${zone.battle.enemyTimerSeconds}s` : "--");
  const liveProgressLabel =
    combatView.defeatProgressLabel ??
    (zone.kind === "combat" ? `0/${zone.battle.defeatsRequired}` : "--");
  const liveEnemyLabel = combatView.enemySpecies
    ? pickLocalizedText(combatView.enemySpecies.name, locale)
    : "--";

  if (compactBattlePanel) {
    return (
      <section className="zone-panel zone-panel--compact-mobile">
        <div className="zone-panel__titlebar">
          <strong>{text.title}</strong>
          <span>{progress.completed ? text.completed : text.active}</span>
        </div>
        <div className="zone-panel__body zone-panel__body--compact-mobile">
          <div className="zone-panel__header">
            <strong>{pickLocalizedText(zone.name, locale)}</strong>
            <span>{zone.kind === "combat" ? text.combat : text.pacifist}</span>
          </div>
          <div className="zone-panel__compact-grid">
            <div className="zone-panel__metric">
              <span>{text.timer}</span>
              <strong>{liveTimerLabel}</strong>
            </div>
            <div className="zone-panel__metric">
              <span>{text.defeats}</span>
              <strong>{liveProgressLabel}</strong>
            </div>
            <div className="zone-panel__metric">
              <span>{text.enemy}</span>
              <strong>{liveEnemyLabel}</strong>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="zone-panel">
      <div className="zone-panel__titlebar">
        <strong>{text.title}</strong>
        <span>{progress.completed ? text.completed : text.active}</span>
      </div>
      <div className="zone-panel__body">
        <div className="zone-panel__header">
          <strong>{pickLocalizedText(zone.name, locale)}</strong>
          <span>{zone.kind === "combat" ? text.combat : text.pacifist}</span>
        </div>

        {zone.kind === "combat" ? (
          <>
            <div className="zone-panel__metrics">
              <div className="zone-panel__metric">
                <span>{text.timer}</span>
                <strong>{zone.battle.enemyTimerSeconds}s</strong>
              </div>
              <div className="zone-panel__metric">
                <span>{text.defeats}</span>
                <strong>{zone.battle.defeatsRequired}</strong>
              </div>
            </div>
            <div className="zone-panel__stack">
              <span className="zone-panel__label">{text.pool}</span>
              <div className="zone-panel__chips">
                {zone.battle.enemyPoolIds.map((enemyId) => (
                  <span key={enemyId} className="zone-panel__chip">
                    {registrySpeciesLabel(view, enemyId, locale)}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="zone-panel__action zone-panel__action--primary"
              onClick={() => onEnterWildBattle(zone.id)}
              type="button"
            >
              {canResumeWildBattle(zone.id) ? text.resume : text.enterZone}
            </button>
          </>
        ) : (
          <div className="zone-panel__stack">
            <span className="zone-panel__label">{text.actions}</span>
            <div className="zone-panel__list">
              {view.currentZoneActivities.map((activity) => (
                <div key={activity.id} className="zone-panel__row">
                  <div>
                    <strong>{pickLocalizedText(activity.label, locale)}</strong>
                  </div>
                  {activity.kind === "dialogue_npc" ? (
                    <button
                      className="zone-panel__action"
                      onClick={() => onStartDialogue(zone.id, activity.id)}
                      type="button"
                    >
                      {text.talk}
                    </button>
                  ) : null}
                  {activity.kind === "team_management" ? (
                    <button className="zone-panel__action" onClick={onOpenTeam} type="button">
                      {text.team}
                    </button>
                  ) : null}
                  {activity.kind === "gym_battle" ? (
                    <div className="zone-panel__action-stack">
                      <button
                        className="zone-panel__action zone-panel__action--primary"
                        disabled={!canResumeGymBattle(activity.battleId) && !canStartGymBattle(activity.battleId)}
                        onClick={() => onStartGymBattle(zone.id, activity.battleId)}
                        type="button"
                      >
                        {canResumeGymBattle(activity.battleId) ? text.resume : text.startGym}
                      </button>
                      {!canResumeGymBattle(activity.battleId) && !canStartGymBattle(activity.battleId) ? (
                        <span>
                          {text.teamLimit} {view.registry.battlesById[activity.battleId]?.teamSizeLimit ?? 6}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {combatView.session ? (
          <div className="zone-panel__battle-status">
            <span>{combatView.enemySpecies ? pickLocalizedText(combatView.enemySpecies.name, locale) : "--"}</span>
            <strong>{combatView.remainingTimerLabel ?? "--"}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function registrySpeciesLabel(view: SliceViewState, speciesId: string, locale: Locale): string {
  const species = view.registry.speciesById[speciesId];
  return species ? pickLocalizedText(species.name, locale) : speciesId;
}
