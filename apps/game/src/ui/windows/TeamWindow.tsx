import type { Locale, PokemonSpeciesDefinition, SpeciesProgressState } from "@pokeidle/contracts";
import { pickLocalizedText } from "@pokeidle/game-core";

interface TeamWindowProps {
  locale: Locale;
  teamSlots: Array<string | null>;
  unlockedSpecies: PokemonSpeciesDefinition[];
  assignableSpeciesIdsBySlot: string[][];
  speciesProgressById: Record<string, SpeciesProgressState>;
  onSetTeamSlot: (slotIndex: number, speciesId: string | null) => void;
}

const copy = {
  en: {
    title: "Team",
    unlocked: "Unlocked",
    slot: "Slot",
    empty: "Empty",
    type: "Type",
    level: "Lv",
  },
  fr: {
    title: "Équipe",
    unlocked: "Débloqués",
    slot: "Slot",
    empty: "Vide",
    type: "Type",
    level: "Niv",
  },
} as const;

export function TeamWindow({
  locale,
  teamSlots,
  unlockedSpecies,
  assignableSpeciesIdsBySlot,
  speciesProgressById,
  onSetTeamSlot,
}: TeamWindowProps) {
  const text = copy[locale];

  return (
    <>
      <div className="focus-window__titlebar">
        <strong>{text.title}</strong>
      </div>
      <div className="focus-window__body focus-window__body--team">
        <div className="team-window__slots">
          {teamSlots.map((speciesId, slotIndex) => {
            const species = speciesId ? unlockedSpecies.find((entry) => entry.id === speciesId) ?? null : null;
            const progress = speciesId ? speciesProgressById[speciesId] : undefined;
            const assignableSpeciesIds = new Set(assignableSpeciesIdsBySlot[slotIndex] ?? []);

            return (
              <article key={`slot-${slotIndex + 1}`} className="team-slot-card">
                <div className="team-slot-card__header">
                  <strong>
                    {text.slot} {slotIndex + 1}
                  </strong>
                  <select
                    onChange={(event) => onSetTeamSlot(slotIndex, event.target.value || null)}
                    value={speciesId ?? ""}
                  >
                    <option value="">{text.empty}</option>
                    {unlockedSpecies
                      .filter((entry) => assignableSpeciesIds.has(entry.id))
                      .map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {pickLocalizedText(entry.name, locale)}
                        </option>
                      ))}
                  </select>
                </div>
                {species ? (
                  <div className="team-slot-card__body">
                    <div className="species-sprite-frame">
                      <img alt={pickLocalizedText(species.name, locale)} src={species.frontSpriteUrl} />
                    </div>
                    <div className="team-slot-card__info">
                      <strong>{pickLocalizedText(species.name, locale)}</strong>
                      <span>
                        {text.level} {progress?.level ?? 1}
                      </span>
                      <span>
                        {text.type} {species.defaultOffensiveType}
                      </span>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <section className="team-window__roster">
          <div className="quest-window__section-title">{text.unlocked}</div>
          <div className="species-chip-grid">
            {unlockedSpecies.map((species) => (
              <div key={species.id} className="species-chip-card">
                <div className="species-sprite-frame species-sprite-frame--small">
                  <img alt={pickLocalizedText(species.name, locale)} src={species.frontSpriteUrl} />
                </div>
                <span>{pickLocalizedText(species.name, locale)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
