import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { loadContentRegistry, type ContentRegistry } from "@pokeidle/content-data";
import type { BattleDefinition, DialogueDocument, ZoneDefinition } from "@pokeidle/contracts";
import { uiTokens } from "@pokeidle/ui-tokens";
import { BattleEditorPanel } from "../modules/battle-editor/BattleEditorPanel";
import { DialogueEditorPanel } from "../modules/dialogue-editor/DialogueEditorPanel";
import { PokemonViewerPanel } from "../modules/pokemon-viewer/PokemonViewerPanel";
import { ZoneEditorPanel } from "../modules/zone-editor/ZoneEditorPanel";
import "./shell.css";

type ModuleKey = "zones" | "battles" | "pokemon" | "dialogues";

const moduleLabels: Record<ModuleKey, string> = {
  zones: "zones",
  battles: "battles",
  pokemon: "pokemon",
  dialogues: "dialogues",
};

interface RegistryState {
  registry: ContentRegistry | null;
  error: string | null;
}

function readRegistryState(): RegistryState {
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
}

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("zones");
  const [registryState, setRegistryState] = useState<RegistryState>(() => readRegistryState());

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
  const authoredCounts = useMemo(
    () =>
      [
        `${Object.keys(registry.zonesById).length} zones`,
        `${Object.keys(registry.battlesById).length} battles`,
        `${Object.keys(registry.dialoguesById).length} dialogues`,
        `${Object.keys(registry.questsById).length} quests`,
        `${Object.keys(registry.gymsById).length} canon gyms`,
      ].join(" | "),
    [registry],
  );

  const handleZoneSaved = (zone: ZoneDefinition) => {
    setRegistryState((current) =>
      current.registry
        ? {
            error: null,
            registry: {
              ...current.registry,
              zonesById: {
                ...current.registry.zonesById,
                [zone.id]: zone,
              },
            },
          }
        : current,
    );
  };

  const handleDialogueSaved = (dialogue: DialogueDocument) => {
    setRegistryState((current) =>
      current.registry
        ? {
            error: null,
            registry: {
              ...current.registry,
              dialoguesById: {
                ...current.registry.dialoguesById,
                [dialogue.id]: dialogue,
              },
            },
          }
        : current,
    );
  };

  const handleBattleSaved = (battle: BattleDefinition) => {
    setRegistryState((current) =>
      current.registry
        ? {
            error: null,
            registry: {
              ...current.registry,
              battlesById: {
                ...current.registry.battlesById,
                [battle.id]: battle,
              },
            },
          }
        : current,
    );
  };

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
        {activeModule === "zones" ? (
          <ZoneEditorPanel onSavedZone={handleZoneSaved} registry={registry} />
        ) : null}
        {activeModule === "battles" ? (
          <BattleEditorPanel onSavedBattle={handleBattleSaved} registry={registry} />
        ) : null}
        {activeModule === "pokemon" ? <PokemonViewerPanel registry={registry} /> : null}
        {activeModule === "dialogues" ? (
          <DialogueEditorPanel onSavedDialogue={handleDialogueSaved} registry={registry} />
        ) : null}
      </section>
    </main>
  );
}
