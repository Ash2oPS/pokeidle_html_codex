import { useEffect, useMemo, useState } from "react";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { DialogueDocument } from "@pokeidle/contracts";
import { saveStudioDocument } from "../../studio-save";

interface DialogueEditorPanelProps {
  registry: ContentRegistry;
  onSavedDialogue?: (dialogue: DialogueDocument) => void;
}

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; filePath: string }
  | { status: "error"; message: string };

export function DialogueEditorPanel({ registry, onSavedDialogue }: DialogueEditorPanelProps) {
  const dialogueIds = useMemo(() => Object.keys(registry.dialoguesById).sort(), [registry]);
  const initialDialogueId = dialogueIds[0]!;
  const [selectedDialogueId, setSelectedDialogueId] = useState(initialDialogueId);
  const selectedDialogue =
    registry.dialoguesById[selectedDialogueId] ?? registry.dialoguesById[initialDialogueId]!;
  const [draft, setDraft] = useState<DialogueDocument>(() => structuredClone(selectedDialogue));
  const [activeLineId, setActiveLineId] = useState(selectedDialogue.lines[0]?.id ?? "");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    const nextDraft = structuredClone(selectedDialogue);
    setDraft(nextDraft);
    setActiveLineId(nextDraft.lines[0]?.id ?? "");
    setSaveState({ status: "idle" });
  }, [selectedDialogueId]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(selectedDialogue),
    [draft, selectedDialogue],
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
      const result = await saveStudioDocument("dialogues", draft.id, draft);
      onSavedDialogue?.(result.document);
      setSaveState({
        status: "saved",
        filePath: result.filePath,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to save dialogue document.",
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

  const activeLine = draft.lines.find((line) => line.id === activeLineId) ?? draft.lines[0]!;
  const confirmDiscardDraft = () =>
    !isDirty || window.confirm("Discard unsaved dialogue changes?");

  const handleRevert = () => {
    const nextDraft = structuredClone(selectedDialogue);
    setDraft(nextDraft);
    setActiveLineId(nextDraft.lines[0]?.id ?? "");
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
          <strong>Dialogue Editor</strong>
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
            <strong>Dialogue save failed</strong>
            <p>{saveState.message}</p>
          </div>
        ) : null}
        {saveState.status === "saved" ? (
          <div className="studio-note studio-inline-feedback">
            Saved to <strong>{saveState.filePath}</strong>
          </div>
        ) : null}

        <label>
          <span>Dialogue File</span>
          <select
            value={selectedDialogueId}
            onChange={(event) => {
              if (!confirmDiscardDraft()) {
                return;
              }

              setSelectedDialogueId(event.target.value);
            }}
          >
            {dialogueIds.map((dialogueId) => (
              <option key={dialogueId} value={dialogueId}>
                {dialogueId}
              </option>
            ))}
          </select>
        </label>

        <div className="studio-grid">
          <label>
            <span>Title EN</span>
            <input
              value={draft.title.en}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: { ...current.title, en: event.target.value },
                }))
              }
            />
          </label>
          <label>
            <span>Title FR</span>
            <input
              value={draft.title.fr}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: { ...current.title, fr: event.target.value },
                }))
              }
            />
          </label>
        </div>

        <div className="studio-stack">
          <span className="studio-stack__label">Participants</span>
          <div className="studio-data-list">
            {draft.participants.map((participant) => (
              <div key={participant.id} className="studio-data-list__row">
                <span>{participant.id}</span>
                <strong>{participant.name.en}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="studio-stack">
          <span className="studio-stack__label">Lines</span>
          <div className="studio-data-list">
            {draft.lines.map((line) => (
              <button
                key={line.id}
                className={line.id === activeLine.id ? "studio-data-list__row is-active" : "studio-data-list__row"}
                onClick={() => setActiveLineId(line.id)}
                type="button"
              >
                <span>{line.speakerId}</span>
                <strong>{line.id}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="studio-grid">
          <label>
            <span>Line EN</span>
            <textarea
              rows={4}
              value={activeLine.text.en}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === activeLine.id
                      ? { ...line, text: { ...line.text, en: event.target.value } }
                      : line,
                  ),
                }))
              }
            />
          </label>
          <label>
            <span>Line FR</span>
            <textarea
              rows={4}
              value={activeLine.text.fr}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === activeLine.id
                      ? { ...line, text: { ...line.text, fr: event.target.value } }
                      : line,
                  ),
                }))
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}
