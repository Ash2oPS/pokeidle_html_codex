import { useState } from "react";
import type { DialogueDocument } from "@pokeidle/contracts";

const initialDialogue: DialogueDocument = {
  id: "sandgem-lab-intro",
  title: {
    en: "Town Intro",
    fr: "Intro Ville"
  },
  lines: [
    {
      id: "line-1",
      speakerId: "professor-rowan",
      text: {
        en: "Sinnoh moves fast. Train the right slots.",
        fr: "Sinnoh avance vite. Place les bons slots."
      }
    },
    {
      id: "line-2",
      speakerId: "assistant",
      text: {
        en: "Your next route unlocks after the quest.",
        fr: "La prochaine route se débloque après la quête."
      }
    }
  ]
};

export function DialogueEditorPanel() {
  const [dialogue, setDialogue] = useState(initialDialogue);
  const activeLine = dialogue.lines[0];

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <strong>Dialogue Editor</strong>
        <span>{dialogue.id}</span>
      </div>
      <div className="studio-window__body">
        <label>
          <span>Title EN</span>
          <input
            value={dialogue.title.en}
            onChange={(event) =>
              setDialogue((current) => ({
                ...current,
                title: { ...current.title, en: event.target.value }
              }))
            }
          />
        </label>
        <label>
          <span>Title FR</span>
          <input
            value={dialogue.title.fr}
            onChange={(event) =>
              setDialogue((current) => ({
                ...current,
                title: { ...current.title, fr: event.target.value }
              }))
            }
          />
        </label>
        <div className="studio-data-list">
          {dialogue.lines.map((line) => (
            <div key={line.id} className="studio-data-list__row">
              <span>{line.speakerId}</span>
              <strong>{line.id}</strong>
            </div>
          ))}
        </div>
        <label>
          <span>Line EN</span>
          <textarea
            rows={4}
            value={activeLine?.text.en ?? ""}
            onChange={(event) =>
              setDialogue((current) => ({
                ...current,
                lines: current.lines.map((line, index) =>
                  index === 0
                    ? {
                        ...line,
                        text: { ...line.text, en: event.target.value }
                      }
                    : line
                )
              }))
            }
          />
        </label>
        <label>
          <span>Line FR</span>
          <textarea
            rows={4}
            value={activeLine?.text.fr ?? ""}
            onChange={(event) =>
              setDialogue((current) => ({
                ...current,
                lines: current.lines.map((line, index) =>
                  index === 0
                    ? {
                        ...line,
                        text: { ...line.text, fr: event.target.value }
                      }
                    : line
                )
              }))
            }
          />
        </label>
      </div>
    </section>
  );
}
