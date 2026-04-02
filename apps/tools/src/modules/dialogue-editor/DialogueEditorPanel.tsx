import { useEffect, useMemo, useState } from "react";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { DialogueDocument } from "@pokeidle/contracts";

interface DialogueEditorPanelProps {
  registry: ContentRegistry;
}

export function DialogueEditorPanel({ registry }: DialogueEditorPanelProps) {
  const dialogueIds = useMemo(() => Object.keys(registry.dialoguesById).sort(), [registry]);
  const initialDialogueId = dialogueIds[0]!;
  const [selectedDialogueId, setSelectedDialogueId] = useState(initialDialogueId);
  const selectedDialogue =
    registry.dialoguesById[selectedDialogueId] ?? registry.dialoguesById[initialDialogueId]!;
  const [draft, setDraft] = useState<DialogueDocument>(() => structuredClone(selectedDialogue));
  const [activeLineId, setActiveLineId] = useState(selectedDialogue.lines[0]?.id ?? "");

  useEffect(() => {
    const nextDraft = structuredClone(selectedDialogue);
    setDraft(nextDraft);
    setActiveLineId(nextDraft.lines[0]?.id ?? "");
  }, [selectedDialogue]);

  const activeLine = draft.lines.find((line) => line.id === activeLineId) ?? draft.lines[0]!;

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <strong>Dialogue Editor</strong>
        <span>{draft.id}</span>
      </div>
      <div className="studio-window__body">
        <label>
          <span>Dialogue File</span>
          <select
            value={selectedDialogueId}
            onChange={(event) => {
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
