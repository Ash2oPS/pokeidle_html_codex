import type { SliceQuestView } from "@pokeidle/game-core";
import { pickLocalizedText } from "@pokeidle/game-core";
import type { Locale } from "@pokeidle/contracts";

interface QuestsWindowProps {
  locale: Locale;
  mainQuests: SliceQuestView[];
  sideQuests: SliceQuestView[];
  onClaim: (questId: string) => void;
}

const copy = {
  en: {
    title: "Quests",
    main: "Main",
    side: "Side",
    claim: "Claim",
    locked: "Locked",
    available: "Available",
    active: "Active",
    completed: "Completed",
    rewardClaimed: "Reward Claimed",
  },
  fr: {
    title: "Quetes",
    main: "Main",
    side: "Secondaires",
    claim: "Recuperer",
    locked: "Bloquee",
    available: "Disponible",
    active: "Active",
    completed: "Completee",
    rewardClaimed: "Recompense prise",
  },
} as const;

function getStateLabel(locale: Locale, state: SliceQuestView["progress"]["state"]) {
  const text = copy[locale];

  if (state === "available") {
    return text.available;
  }

  if (state === "active") {
    return text.active;
  }

  if (state === "completed") {
    return text.completed;
  }

  if (state === "reward-claimed") {
    return text.rewardClaimed;
  }

  return text.locked;
}

function QuestSection({
  locale,
  quests,
  title,
  onClaim,
}: {
  locale: Locale;
  quests: SliceQuestView[];
  title: string;
  onClaim: (questId: string) => void;
}) {
  return (
    <div className="quest-window__section">
      <div className="quest-window__section-title">{title}</div>
      <div className="quest-window__list">
        {quests.map((entry) => (
          <article key={entry.quest.id} className="quest-window__card">
            <div className="quest-window__card-header">
              <strong>{pickLocalizedText(entry.quest.title, locale)}</strong>
              <span>{getStateLabel(locale, entry.progress.state)}</span>
            </div>
            <p className="quest-window__summary">{pickLocalizedText(entry.quest.summary, locale)}</p>
            <div className="quest-window__objectives">
              {entry.objectives.map((objectiveEntry) => (
                <div key={objectiveEntry.objective.id} className="quest-window__objective">
                  <span>{pickLocalizedText(objectiveEntry.objective.description, locale)}</span>
                  <strong>{objectiveEntry.completed ? "1/1" : "0/1"}</strong>
                </div>
              ))}
            </div>
            {entry.canClaim ? (
              <button
                className="focus-primary-button"
                onClick={() => onClaim(entry.quest.id)}
                type="button"
              >
                {copy[locale].claim}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function QuestsWindow({
  locale,
  mainQuests,
  sideQuests,
  onClaim,
}: QuestsWindowProps) {
  const text = copy[locale];

  return (
    <>
      <div className="focus-window__titlebar">
        <strong>{text.title}</strong>
      </div>
      <div className="focus-window__body focus-window__body--quests">
        <QuestSection locale={locale} onClaim={onClaim} quests={mainQuests} title={text.main} />
        <QuestSection locale={locale} onClaim={onClaim} quests={sideQuests} title={text.side} />
      </div>
    </>
  );
}
