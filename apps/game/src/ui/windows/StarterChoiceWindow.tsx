import type { PokemonSpeciesDefinition, Locale } from "@pokeidle/contracts";
import { pickLocalizedText } from "@pokeidle/game-core";

interface StarterChoiceWindowProps {
  locale: Locale;
  starters: PokemonSpeciesDefinition[];
  onChoose: (speciesId: string) => void;
}

const copy = {
  en: {
    title: "Choose Starter",
    subtitle: "Pick one starter to unlock your first real team.",
    choose: "Choose",
  },
  fr: {
    title: "Choix du starter",
    subtitle: "Choisis un starter pour débloquer ta première vraie équipe.",
    choose: "Choisir",
  },
} as const;

export function StarterChoiceWindow({
  locale,
  starters,
  onChoose,
}: StarterChoiceWindowProps) {
  const text = copy[locale];

  return (
    <section className="starter-window">
      <div className="starter-window__titlebar">
        <strong>{text.title}</strong>
      </div>
      <div className="starter-window__body">
        <p className="starter-window__subtitle">{text.subtitle}</p>
        <div className="starter-window__grid">
          {starters.map((species) => (
            <article key={species.id} className="starter-card">
              <img alt={pickLocalizedText(species.name, locale)} src={species.spriteUrl} />
              <strong>{pickLocalizedText(species.name, locale)}</strong>
              <div className="focus-tag-list">
                {species.defensiveTypes.map((type) => (
                  <span key={type} className="focus-tag">
                    {type}
                  </span>
                ))}
              </div>
              <button
                className="focus-primary-button"
                onClick={() => onChoose(species.id)}
                type="button"
              >
                {text.choose}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
