import { useEffect, useMemo, useState } from "react";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { ZoneDefinition } from "@pokeidle/contracts";
import { saveStudioDocument } from "../../studio-save";

interface ZoneEditorPanelProps {
  registry: ContentRegistry;
  onSavedZone?: (zone: ZoneDefinition) => void;
}

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; filePath: string }
  | { status: "error"; message: string };

function formatLinkSummary(
  sourceZoneId: string,
  targetZoneId: string,
  requiresCompletion: boolean,
  unlockFlag?: string,
): string {
  const requirements = [
    requiresCompletion ? "requires completion" : "open",
    unlockFlag ? `flag=${unlockFlag}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `${sourceZoneId} -> ${targetZoneId} · ${requirements}`;
}

export function ZoneEditorPanel({ registry, onSavedZone }: ZoneEditorPanelProps) {
  const zoneIds = useMemo(() => Object.keys(registry.zonesById).sort(), [registry]);
  const initialZoneId = zoneIds[0]!;
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId);
  const selectedZone = registry.zonesById[selectedZoneId] ?? registry.zonesById[initialZoneId]!;
  const [draft, setDraft] = useState<ZoneDefinition>(() => structuredClone(selectedZone));
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    setDraft(structuredClone(selectedZone));
    setSaveState({ status: "idle" });
  }, [selectedZoneId]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(selectedZone),
    [draft, selectedZone],
  );

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const handleSave = async () => {
    setSaveState({ status: "saving" });

    try {
      const result = await saveStudioDocument("zones", draft.id, draft);
      onSavedZone?.(result.document);
      setSaveState({
        status: "saved",
        filePath: result.filePath,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to save zone document.",
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") {
        return;
      }

      if (!isDirty || saveState.status === "saving") {
        return;
      }

      event.preventDefault();
      void handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draft, isDirty, saveState.status]);

  const mapLinks = useMemo(
    () =>
      registry.worldMap.links.filter(
        (link) => link.fromZoneId === selectedZone.id || link.toZoneId === selectedZone.id,
      ),
    [registry, selectedZone.id],
  );

  const confirmDiscardDraft = () =>
    !isDirty || window.confirm("Discard unsaved zone changes?");

  const handleRevert = () => {
    setDraft(structuredClone(selectedZone));
    setSaveState({ status: "idle" });
  };

  const statusLabel =
    saveState.status === "saving"
      ? "Saving..."
      : saveState.status === "error"
        ? "Save failed"
        : isDirty
          ? "Unsaved changes"
          : saveState.status === "saved"
            ? "Saved"
            : "No local edits";

  const statusClassName =
    saveState.status === "error"
      ? "studio-status-chip is-error"
      : isDirty
        ? "studio-status-chip is-warning"
        : saveState.status === "saved"
          ? "studio-status-chip is-success"
          : "studio-status-chip";

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <div className="studio-window__titlebar-copy">
          <strong>Zone Editor</strong>
          <span>{draft.id}</span>
        </div>
        <div className="studio-window__actions">
          <span className={statusClassName}>{statusLabel}</span>
          <button
            className="studio-action-button is-secondary"
            disabled={!isDirty || saveState.status === "saving"}
            onClick={handleRevert}
            type="button"
          >
            Revert
          </button>
          <button
            className="studio-action-button"
            disabled={!isDirty || saveState.status === "saving"}
            onClick={() => {
              void handleSave();
            }}
            type="button"
          >
            {saveState.status === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="studio-window__body">
        {saveState.status === "error" ? (
          <div className="studio-error studio-inline-feedback">
            <strong>Zone save failed</strong>
            <p>{saveState.message}</p>
          </div>
        ) : null}
        {saveState.status === "saved" ? (
          <div className="studio-note studio-inline-feedback">
            Saved to <strong>{saveState.filePath}</strong>
          </div>
        ) : null}

        <label>
          <span>Zone File</span>
          <select
            value={selectedZoneId}
            onChange={(event) => {
              if (!confirmDiscardDraft()) {
                return;
              }

              setSelectedZoneId(event.target.value);
            }}
          >
            {zoneIds.map((zoneId) => (
              <option key={zoneId} value={zoneId}>
                {zoneId}
              </option>
            ))}
          </select>
        </label>

        <div className="studio-grid">
          <label>
            <span>Name EN</span>
            <input
              value={draft.name.en}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: { ...current.name, en: event.target.value },
                }))
              }
            />
          </label>
          <label>
            <span>Name FR</span>
            <input
              value={draft.name.fr}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: { ...current.name, fr: event.target.value },
                }))
              }
            />
          </label>
        </div>

        <div className="studio-data-list">
          <div className="studio-data-list__row">
            <span>Kind</span>
            <strong>{draft.kind}</strong>
          </div>
          <div className="studio-data-list__row">
            <span>World Map</span>
            <strong>{registry.worldMap.id}</strong>
          </div>
        </div>

        {draft.kind === "combat" ? (
          <>
            <div className="studio-grid">
              <label>
                <span>Timer</span>
                <input
                  type="number"
                  value={draft.battle.enemyTimerSeconds}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.kind !== "combat"
                        ? current
                        : {
                            ...current,
                            battle: {
                              ...current.battle,
                              enemyTimerSeconds: Number(event.target.value),
                            },
                          },
                    )
                  }
                />
              </label>
              <label>
                <span>Defeats</span>
                <input
                  type="number"
                  value={draft.battle.defeatsRequired}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.kind !== "combat"
                        ? current
                        : {
                            ...current,
                            battle: {
                              ...current.battle,
                              defeatsRequired: Number(event.target.value),
                            },
                          },
                    )
                  }
                />
              </label>
              <label>
                <span>Enemy Level</span>
                <input
                  type="number"
                  value={draft.battle.enemyLevel}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.kind !== "combat"
                        ? current
                        : {
                            ...current,
                            battle: {
                              ...current.battle,
                              enemyLevel: Number(event.target.value),
                            },
                          },
                    )
                  }
                />
              </label>
            </div>
            <label>
              <span>Enemy Pool</span>
              <textarea
                rows={4}
                value={draft.battle.enemyPoolIds.join(", ")}
                onChange={(event) =>
                  setDraft((current) =>
                    current.kind !== "combat"
                      ? current
                      : {
                          ...current,
                          battle: {
                            ...current.battle,
                            enemyPoolIds: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean),
                          },
                        },
                  )
                }
              />
            </label>
          </>
        ) : (
          <div className="studio-stack">
            <span className="studio-stack__label">Activities</span>
            <div className="studio-data-list">
              {draft.activities.map((activity) => (
                <div key={activity.id} className="studio-data-list__row">
                  <span>{activity.kind}</span>
                  <strong>{activity.label.en}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="studio-stack">
          <span className="studio-stack__label">Map Links</span>
          <div className="studio-data-list">
            {mapLinks.map((link) => (
              <div key={link.id} className="studio-data-list__row">
                <span>{link.id}</span>
                <strong>
                  {formatLinkSummary(
                    link.fromZoneId,
                    link.toZoneId,
                    link.requiresCompletion,
                    link.unlockFlag,
                  )}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
