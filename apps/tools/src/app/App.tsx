import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { dialogueDocumentSchema, pokemonSpeciesSummarySchema, zoneDefinitionSchema } from "@pokeidle/content-schema";
import { uiTokens } from "@pokeidle/ui-tokens";
import { ZoneEditorPanel } from "../modules/zone-editor/ZoneEditorPanel";
import { PokemonViewerPanel } from "../modules/pokemon-viewer/PokemonViewerPanel";
import { DialogueEditorPanel } from "../modules/dialogue-editor/DialogueEditorPanel";
import "./app.css";

type ModuleKey = "zones" | "pokemon" | "dialogues";

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("zones");

  const schemaCount = useMemo(
    () => [zoneDefinitionSchema, pokemonSpeciesSummarySchema, dialogueDocumentSchema].length,
    []
  );

  return (
    <main
      className="studio-shell"
      style={
        {
          "--studio-accent": uiTokens.colors.navy
        } as CSSProperties
      }
    >
      <aside className="studio-sidebar">
        <div className="studio-brand">
          <strong>Pokeidle Studio</strong>
          <span>{schemaCount} core schemas</span>
        </div>
        <nav className="studio-nav">
          {(["zones", "pokemon", "dialogues"] as const).map((module) => (
            <button
              key={module}
              className={module === activeModule ? "studio-nav__button is-active" : "studio-nav__button"}
              onClick={() => setActiveModule(module)}
              type="button"
            >
              {module}
            </button>
          ))}
        </nav>
      </aside>

      <section className="studio-main">
        {activeModule === "zones" ? <ZoneEditorPanel /> : null}
        {activeModule === "pokemon" ? <PokemonViewerPanel /> : null}
        {activeModule === "dialogues" ? <DialogueEditorPanel /> : null}
      </section>
    </main>
  );
}
