import type { SliceViewState } from "@pokeidle/game-core";
import { pickLocalizedText } from "@pokeidle/game-core";
import type { Locale } from "@pokeidle/contracts";

interface CurrentZonePanelProps {
  locale: Locale;
  view: SliceViewState;
  onCompleteZone: (zoneId: string) => void;
  onOpenTeam: () => void;
  onStartDialogue: (zoneId: string, activityId: string) => void;
  onWinBattle: (battleId: string) => void;
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
    actions: "Activities",
    talk: "Talk",
    team: "Team",
    winGym: "Win Gym",
    completeZone: "Complete Zone",
  },
  fr: {
    title: "Zone active",
    combat: "Zone combat",
    pacifist: "Zone ville",
    completed: "Completee",
    active: "Active",
    timer: "Timer",
    defeats: "Victoires",
    pool: "Pool",
    actions: "Activites",
    talk: "Parler",
    team: "Equipe",
    winGym: "Gagner l'arene",
    completeZone: "Completer la zone",
  },
} as const;

export function CurrentZonePanel({
  locale,
  view,
  onCompleteZone,
  onOpenTeam,
  onStartDialogue,
  onWinBattle,
}: CurrentZonePanelProps) {
  const text = copy[locale];
  const { zone, progress } = view.activeZone;

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
                    {enemyId}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="zone-panel__action zone-panel__action--primary"
              onClick={() => onCompleteZone(zone.id)}
              type="button"
            >
              {text.completeZone}
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
                    <button
                      className="zone-panel__action zone-panel__action--primary"
                      onClick={() => onWinBattle(activity.battleId)}
                      type="button"
                    >
                      {text.winGym}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
