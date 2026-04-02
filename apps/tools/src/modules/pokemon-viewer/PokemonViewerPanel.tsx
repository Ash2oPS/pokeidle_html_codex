import type { PokemonSpeciesSummary } from "@pokeidle/contracts";

const species: PokemonSpeciesSummary = {
  id: "chimchar",
  dexNumber: 390,
  familyId: "chimchar-family",
  name: {
    en: "Chimchar",
    fr: "Ouisticram"
  },
  primaryType: "fire",
  spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/390.png",
  baseStats: {
    hp: 44,
    attack: 58,
    defense: 44,
    specialAttack: 58,
    specialDefense: 44,
    speed: 61
  }
};

const levels = [1, 10, 25, 50];

function scaleStat(baseStat: number, level: number) {
  return Math.round(baseStat * (1 + level * 0.18));
}

export function PokemonViewerPanel() {
  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <strong>Pokemon Viewer</strong>
        <span>#{species.dexNumber}</span>
      </div>
      <div className="studio-window__body">
        <div className="pokemon-viewer__header">
          <img alt={species.name.en} src={species.spriteUrl} />
          <div>
            <h2>{species.name.en}</h2>
            <p>{species.name.fr}</p>
            <div className="pokemon-tags">
              <span>{species.primaryType}</span>
            </div>
          </div>
        </div>
        <div className="studio-data-list">
          {Object.entries(species.baseStats).map(([key, value]) => (
            <div key={key} className="studio-data-list__row">
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="studio-table">
          <div className="studio-table__head">
            <span>Level</span>
            <span>Atk</span>
            <span>SpA</span>
            <span>Speed</span>
          </div>
          {levels.map((level) => (
            <div key={level} className="studio-table__row">
              <span>{level}</span>
              <span>{scaleStat(species.baseStats.attack, level)}</span>
              <span>{scaleStat(species.baseStats.specialAttack, level)}</span>
              <span>{scaleStat(species.baseStats.speed, level)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
