import { useRef } from "react";
import type { ChangeEvent } from "react";
import type { Locale, SpeciesProgressState } from "@pokeidle/contracts";
import type { SaveManagerState } from "@pokeidle/game-core";

interface SaveWindowProps {
  locale: Locale;
  saveState: SaveManagerState;
  onExport: () => void;
  onImport: (serializedSave: string) => Promise<void>;
  onReset: () => Promise<void>;
  onFlush: () => Promise<void>;
  onIncrementCounter: (field: "encountered" | "defeated" | "captured") => void;
}

const copy = {
  en: {
    title: "Save",
    status: "Status",
    savedAt: "Saved",
    species: "Chimchar",
    encountered: "Seen",
    defeated: "Defeats",
    captured: "Captures",
    flush: "Flush",
    export: "Export",
    import: "Import",
    reset: "Reset",
  },
  fr: {
    title: "Sauvegarde",
    status: "Etat",
    savedAt: "Sauvee",
    species: "Ouisticram",
    encountered: "Vus",
    defeated: "Vaincus",
    captured: "Captures",
    flush: "Flush",
    export: "Export",
    import: "Import",
    reset: "Reset",
  },
} as const;

const statusCopy = {
  en: {
    idle: "Idle",
    loading: "Loading",
    dirty: "Dirty",
    saving: "Saving",
    error: "Error",
  },
  fr: {
    idle: "Stable",
    loading: "Chargement",
    dirty: "Dirty",
    saving: "Sauvegarde",
    error: "Erreur",
  },
} as const;

function formatSavedAt(savedAt: string | null): string {
  return savedAt ? new Date(savedAt).toLocaleTimeString() : "--";
}

function readSpeciesProgress(state: SaveManagerState): SpeciesProgressState {
  return (
    state.snapshot.species.chimchar ?? {
      unlocked: false,
      level: 1,
      experience: 0,
      highestLevelReached: 1,
      counters: {
        encountered: 0,
        defeated: 0,
        captured: 0,
      },
    }
  );
}

export function SaveWindow({
  locale,
  saveState,
  onExport,
  onImport,
  onReset,
  onFlush,
  onIncrementCounter,
}: SaveWindowProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const text = copy[locale];
  const statusText = statusCopy[locale][saveState.status];
  const species = readSpeciesProgress(saveState);

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const serializedSave = await file.text();
    await onImport(serializedSave);
    event.target.value = "";
  };

  return (
    <>
      <div className="focus-window__titlebar">
        <strong>{text.title}</strong>
      </div>
      <div className="focus-window__body focus-window__body--save">
        <div className="focus-row focus-row--metric">
          <span>{text.status}</span>
          <strong>{statusText}</strong>
        </div>
        <div className="focus-row focus-row--metric">
          <span>{text.savedAt}</span>
          <strong>{formatSavedAt(saveState.snapshot.meta.lastSavedAt)}</strong>
        </div>
        <div className="focus-row focus-row--metric">
          <span>{text.species}</span>
          <strong>L{species.level}</strong>
        </div>
        <div className="save-counter-grid">
          <button className="save-counter" onClick={() => onIncrementCounter("encountered")} type="button">
            <span>{text.encountered}</span>
            <strong>{species.counters.encountered}</strong>
          </button>
          <button className="save-counter" onClick={() => onIncrementCounter("defeated")} type="button">
            <span>{text.defeated}</span>
            <strong>{species.counters.defeated}</strong>
          </button>
          <button className="save-counter" onClick={() => onIncrementCounter("captured")} type="button">
            <span>{text.captured}</span>
            <strong>{species.counters.captured}</strong>
          </button>
        </div>
        <div className="save-actions">
          <button className="save-action" onClick={() => void onFlush()} type="button">
            {text.flush}
          </button>
          <button className="save-action" onClick={onExport} type="button">
            {text.export}
          </button>
          <button
            className="save-action"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            type="button"
          >
            {text.import}
          </button>
          <button className="save-action save-action--danger" onClick={() => void onReset()} type="button">
            {text.reset}
          </button>
        </div>
        <input
          ref={fileInputRef}
          accept="application/json"
          hidden
          onChange={(event) => {
            void handleImportFile(event);
          }}
          type="file"
        />
      </div>
    </>
  );
}
