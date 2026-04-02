import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { loadContentRegistry } from "@pokeidle/content-data";
import { uiTokens } from "@pokeidle/ui-tokens";
import { DialogueEditorPanel } from "../modules/dialogue-editor/DialogueEditorPanel";
import { PokemonViewerPanel } from "../modules/pokemon-viewer/PokemonViewerPanel";
import { ZoneEditorPanel } from "../modules/zone-editor/ZoneEditorPanel";
import "./shell.css";

type ModuleKey = "zones" | "pokemon" | "dialogues";

const moduleLabels: Record<ModuleKey, string> = {
  zones: "zones",
  pokemon: "pokemon",
  dialogues: "dialogues",
};

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("zones");
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

  if (registryState.error || !registryState.registry) {
    return (
      <main className="studio-shell studio-shell--error">
        <section className="studio-error">
          <strong>Content load failed</strong>
          <p>{registryState.error}</p>
        </section>
      </main>
    );
  }

  const { registry } = registryState;
  const authoredCounts = [
    `${Object.keys(registry.zonesById).length} zones`,
    `${Object.keys(registry.dialoguesById).length} dialogues`,
    `${Object.keys(registry.questsById).length} quests`,
    `${Object.keys(registry.battlesById).length} battles`,
  ].join(" · ");

  return (
    <main
      className="studio-shell"
      style={
        {
          "--studio-accent": uiTokens.colors.navy,
        } as CSSProperties
      }
    >
      <aside className="studio-sidebar">
        <div className="studio-brand">
          <strong>Pokeidle Studio</strong>
          <span>{authoredCounts}</span>
        </div>
        <nav className="studio-nav">
          {(Object.keys(moduleLabels) as ModuleKey[]).map((module) => (
            <button
              key={module}
              className={module === activeModule ? "studio-nav__button is-active" : "studio-nav__button"}
              onClick={() => setActiveModule(module)}
              type="button"
            >
              {moduleLabels[module]}
            </button>
          ))}
        </nav>
      </aside>

      <section className="studio-main">
        {activeModule === "zones" ? <ZoneEditorPanel registry={registry} /> : null}
        {activeModule === "pokemon" ? <PokemonViewerPanel registry={registry} /> : null}
        {activeModule === "dialogues" ? <DialogueEditorPanel registry={registry} /> : null}
      </section>
    </main>
  );
}
