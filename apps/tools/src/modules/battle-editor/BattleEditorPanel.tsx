import { useEffect, useMemo, useState } from "react";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { BattleDefinition } from "@pokeidle/contracts";
import { saveStudioDocument } from "../../studio-save";

interface BattleEditorPanelProps {
  registry: ContentRegistry;
  onSavedBattle?: (battle: BattleDefinition) => void;
}

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; filePath: string }
  | { status: "error"; message: string };

export function BattleEditorPanel({ registry, onSavedBattle }: BattleEditorPanelProps) {
  const battleIds = useMemo(() => Object.keys(registry.battlesById).sort(), [registry]);
  const initialBattleId = battleIds[0] ?? "";
  const [selectedBattleId, setSelectedBattleId] = useState(initialBattleId);
  const selectedBattle =
    registry.battlesById[selectedBattleId] ?? registry.battlesById[initialBattleId] ?? null;
  const [draft, setDraft] = useState<BattleDefinition | null>(
    selectedBattle ? structuredClone(selectedBattle) : null,
  );
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const speciesList = useMemo(
    () => Object.values(registry.speciesById).sort((left, right) => left.dexNumber - right.dexNumber),
    [registry],
  );
  const speciesOptions = useMemo(() => speciesList.map((species) => species.id), [speciesList]);
  const gymOptions = useMemo(() => Object.values(registry.gymsById).sort((left, right) => left.id.localeCompare(right.id)), [registry]);

  useEffect(() => {
    setDraft(selectedBattle ? structuredClone(selectedBattle) : null);
    setSaveState({ status: "idle" });
  }, [selectedBattleId, selectedBattle]);

  const isDirty = useMemo(
    () => !!draft && !!selectedBattle && JSON.stringify(draft) !== JSON.stringify(selectedBattle),
    [draft, selectedBattle],
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
    if (!draft) {
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const result = await saveStudioDocument("battles", draft.id, draft);
      onSavedBattle?.(result.document);
      setSaveState({
        status: "saved",
        filePath: result.filePath,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to save battle document.",
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

  if (!draft || !selectedBattle) {
    return null;
  }

  const confirmDiscardDraft = () =>
    !isDirty || window.confirm("Discard unsaved battle changes?");

  const handleRevert = () => {
    setDraft(structuredClone(selectedBattle));
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

  const canonGym = draft.canonicalGymId ? registry.gymsById[draft.canonicalGymId] : undefined;

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <div className="studio-window__titlebar-copy">
          <strong>Battle Editor</strong>
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
            <strong>Battle save failed</strong>
            <p>{saveState.message}</p>
          </div>
        ) : null}
        {saveState.status === "saved" ? (
          <div className="studio-note studio-inline-feedback">
            Saved to <strong>{saveState.filePath}</strong>
          </div>
        ) : null}

        <label>
          <span>Battle File</span>
          <select
            value={selectedBattleId}
            onChange={(event) => {
              if (!confirmDiscardDraft()) {
                return;
              }

              setSelectedBattleId(event.target.value);
            }}
          >
            {battleIds.map((battleId) => (
              <option key={battleId} value={battleId}>
                {battleId}
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
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        name: { ...current.name, en: event.target.value },
                      }
                    : current,
                )
              }
            />
          </label>
          <label>
            <span>Name FR</span>
            <input
              value={draft.name.fr}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        name: { ...current.name, fr: event.target.value },
                      }
                    : current,
                )
              }
            />
          </label>
        </div>

        <div className="studio-grid">
          <label>
            <span>Battle Kind</span>
            <input readOnly value={draft.kind} />
          </label>
          <label>
            <span>Time Limit (s)</span>
            <input
              type="number"
              value={draft.timeLimitSeconds}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        timeLimitSeconds: Number(event.target.value),
                      }
                    : current,
                )
              }
            />
          </label>
          <label>
            <span>Team Size Limit</span>
            <input
              type="number"
              value={draft.teamSizeLimit ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        teamSizeLimit:
                          event.target.value.length > 0 ? Number(event.target.value) : undefined,
                      }
                    : current,
                )
              }
            />
          </label>
        </div>

        <div className="studio-grid">
          <label>
            <span>Unlock Flag On Win</span>
            <input
              value={draft.unlockFlagOnWin ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        unlockFlagOnWin: event.target.value.trim() || undefined,
                      }
                    : current,
                )
              }
            />
          </label>
          <label>
            <span>Canonical Gym</span>
            <select
              disabled={draft.kind !== "gym"}
              value={draft.canonicalGymId ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        canonicalGymId: event.target.value || undefined,
                      }
                    : current,
                )
              }
            >
              <option value="">Unlinked</option>
              {gymOptions.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="studio-stack">
          <span className="studio-stack__label">Enemy Team Override</span>
          <div className="studio-data-list">
            {(draft.enemyTeam ?? []).map((enemy, index) => (
              <div key={`${enemy.speciesId}-${index}`} className="studio-grid">
                <label>
                  <span>Species</span>
                  <select
                    value={enemy.speciesId}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              enemyTeam: (current.enemyTeam ?? []).map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, speciesId: event.target.value }
                                  : entry,
                              ),
                            }
                          : current,
                      )
                    }
                  >
                    {speciesOptions.map((speciesId) => (
                      <option key={speciesId} value={speciesId}>
                        {speciesId}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Level</span>
                  <input
                    type="number"
                    value={enemy.level}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              enemyTeam: (current.enemyTeam ?? []).map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, level: Number(event.target.value) }
                                  : entry,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </label>
                <button
                  className="studio-action-button is-secondary"
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            enemyTeam: (current.enemyTeam ?? []).filter(
                              (_, entryIndex) => entryIndex !== index,
                            ),
                          }
                        : current,
                    )
                  }
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="studio-action-button is-secondary"
            onClick={() =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      enemyTeam: [
                        ...(current.enemyTeam ?? []),
                        {
                          speciesId: speciesOptions[0] ?? "bulbasaur",
                          level: 1,
                        },
                      ],
                    }
                  : current,
              )
            }
            type="button"
          >
            Add Enemy
          </button>
        </div>

        {canonGym ? (
          <div className="studio-stack">
            <span className="studio-stack__label">Canonical Gym Reference</span>
            <div className="studio-data-list">
              <div className="studio-data-list__row">
                <span>Leader</span>
                <strong>
                  {canonGym.leaderName.en} | {canonGym.badgeName.en}
                </strong>
              </div>
              <div className="studio-data-list__row">
                <span>Type</span>
                <strong>{canonGym.specialtyTypeId}</strong>
              </div>
              {canonGym.teams.map((team) => (
                <div key={team.id} className="studio-data-list__row">
                  <span>{team.id}</span>
                  <strong>
                    {team.enemyTeam
                      .map((enemy) => `${registry.speciesById[enemy.speciesId]?.name.en ?? enemy.speciesId} Lv.${enemy.level}`)
                      .join(", ")}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
