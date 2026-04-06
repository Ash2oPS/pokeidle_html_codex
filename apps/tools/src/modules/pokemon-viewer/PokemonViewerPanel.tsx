import { useMemo, useState } from "react";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { PokemonFormDefinition } from "@pokeidle/contracts";
import { scaleStat } from "@pokeidle/game-core";

interface PokemonViewerPanelProps {
  registry: ContentRegistry;
}

const levels = [1, 10, 25, 50];

export function PokemonViewerPanel({ registry }: PokemonViewerPanelProps) {
  const speciesList = useMemo(
    () => Object.values(registry.speciesById).sort((left, right) => left.dexNumber - right.dexNumber),
    [registry],
  );
  const [activeSpeciesId, setActiveSpeciesId] = useState<string>(speciesList[0]?.id ?? "");
  const species = speciesList.find((entry) => entry.id === activeSpeciesId) ?? speciesList[0];
  const relatedForms = useMemo(
    () =>
      species?.formIds
        .map((formId) => registry.formsById[formId])
        .filter((form): form is PokemonFormDefinition => Boolean(form)) ?? [],
    [registry, species],
  );

  if (!species) {
    return null;
  }

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <strong>Pokemon Viewer</strong>
        <span>
          {speciesList.length} species | {Object.keys(registry.formsById).length} forms
        </span>
      </div>
      <div className="studio-window__body">
        <label className="studio-field">
          <span>Species</span>
          <select value={species.id} onChange={(event) => setActiveSpeciesId(event.target.value)}>
            {speciesList.map((entry) => (
              <option key={entry.id} value={entry.id}>
                #{entry.dexNumber} {entry.name.en}
              </option>
            ))}
          </select>
        </label>
        <div className="pokemon-viewer__header">
          <img alt={species.name.en} src={species.frontSpriteUrl} />
          <div>
            <h2>{species.name.en}</h2>
            <p>{species.name.fr}</p>
            <div className="pokemon-tags">
              {species.defensiveTypes.map((type) => (
                <span key={type}>{type}</span>
              ))}
              <span>off:{species.defaultOffensiveType}</span>
            </div>
          </div>
        </div>
        <div className="studio-data-list">
          <div className="studio-data-list__row">
            <span>Capture Rate</span>
            <strong>{species.captureRate}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>Growth Rate</span>
            <strong>{species.growthRate}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>Egg Groups</span>
            <strong>{species.eggGroups.join(", ") || "none"}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>Review Status</span>
            <strong>{species.source.reviewStatus}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>Source</span>
            <strong>{species.source.source}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>Source Id</span>
            <strong>{species.source.sourceId}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>Forms</span>
            <strong>{species.formIds.length}</strong>
          </div>
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
              <span>{scaleStat(species.baseStats.attack, level, registry.progression.levelStatScalar)}</span>
              <span>{scaleStat(species.baseStats.specialAttack, level, registry.progression.levelStatScalar)}</span>
              <span>{scaleStat(species.baseStats.speed, level, registry.progression.levelStatScalar)}</span>
            </div>
          ))}
        </div>
        <div className="studio-stack">
          <span className="studio-stack__label">Linked Forms</span>
          <div className="studio-data-list">
            {relatedForms.length > 0 ? (
              relatedForms.map((form) => (
                <div key={form.id} className="studio-data-list__row">
                  <span>{form.id}</span>
                  <strong>
                    {form.formName.en} | {form.defensiveTypes.join("/")}
                  </strong>
                </div>
              ))
            ) : (
              <div className="studio-data-list__row">
                <span>forms</span>
                <strong>none</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
