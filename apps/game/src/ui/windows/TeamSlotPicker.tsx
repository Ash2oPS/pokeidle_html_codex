import type { LayoutMode, Locale, PokemonSpeciesDefinition, SpeciesProgressState } from "@pokeidle/contracts";
import { pickLocalizedText } from "@pokeidle/game-core";
import type { TeamSlotMenuAnchor } from "./TeamSlotContextMenu";

interface TeamSlotPickerProps {
  layoutMode: LayoutMode;
  locale: Locale;
  slotIndex: number;
  anchor: TeamSlotMenuAnchor;
  availableSpecies: PokemonSpeciesDefinition[];
  speciesProgressById: Record<string, SpeciesProgressState>;
  onChooseSpecies: (speciesId: string) => void;
  onClose: () => void;
}

const copy = {
  en: {
    title: "Choose Pokemon",
    close: "Close",
    level: "Lv",
    type: "Type",
  },
  fr: {
    title: "Choisir un Pokémon",
    close: "Fermer",
    level: "Niv",
    type: "Type",
  },
} as const;

function getDesktopSurfaceStyle(anchor: TeamSlotMenuAnchor) {
  const width = 316;
  const left = Math.min(Math.max(anchor.x + 18, 14), window.innerWidth - width - 14);
  const top = Math.min(Math.max(anchor.y - 40, 78), window.innerHeight - 460);

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

export function TeamSlotPicker({
  layoutMode,
  locale,
  slotIndex,
  anchor,
  availableSpecies,
  speciesProgressById,
  onChooseSpecies,
  onClose,
}: TeamSlotPickerProps) {
  const text = copy[locale];

  return (
    <div className="slot-overlay-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label={`${text.title} ${slotIndex + 1}`}
        className={`slot-surface ${
          layoutMode === "desktop-landscape" ? "slot-surface--desktop slot-surface--picker" : "slot-surface--mobile slot-surface--picker"
        }`}
        onClick={(event) => event.stopPropagation()}
        style={layoutMode === "desktop-landscape" ? getDesktopSurfaceStyle(anchor) : undefined}
      >
        <div className="slot-surface__titlebar">
          <strong>
            {text.title} {slotIndex + 1}
          </strong>
          <button type="button" onClick={onClose}>
            {text.close}
          </button>
        </div>
        <div className="slot-surface__body">
          <div className="slot-picker__list">
            {availableSpecies.map((species) => {
              const progress = speciesProgressById[species.id];

              return (
                <button
                  key={species.id}
                  className="slot-picker__option"
                  onClick={() => onChooseSpecies(species.id)}
                  type="button"
                >
                  <div className="species-sprite-frame species-sprite-frame--small">
                    <img alt={pickLocalizedText(species.name, locale)} src={species.frontSpriteUrl} />
                  </div>
                  <div className="slot-picker__option-info">
                    <strong>{pickLocalizedText(species.name, locale)}</strong>
                    <span>
                      {text.level} {progress?.level ?? 1}
                    </span>
                    <span>
                      {text.type} {species.defaultOffensiveType}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
