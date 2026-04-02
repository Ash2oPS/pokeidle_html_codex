import type { ActiveDialogueView } from "@pokeidle/game-core";
import { pickLocalizedText } from "@pokeidle/game-core";
import type { Locale } from "@pokeidle/contracts";

interface DialogueWindowProps {
  locale: Locale;
  activeDialogue: ActiveDialogueView;
  onClose: () => void;
  onNext: () => void;
}

const copy = {
  en: {
    next: "Next",
    close: "Close",
  },
  fr: {
    next: "Suite",
    close: "Fermer",
  },
} as const;

export function DialogueWindow({
  locale,
  activeDialogue,
  onClose,
  onNext,
}: DialogueWindowProps) {
  const text = copy[locale];
  const speaker = activeDialogue.dialogue.participants.find(
    (participant) => participant.id === activeDialogue.line.speakerId,
  );

  return (
    <section className="dialogue-window">
      <div className="dialogue-window__titlebar">
        <strong>{pickLocalizedText(activeDialogue.dialogue.title, locale)}</strong>
        <span>
          {activeDialogue.lineIndex + 1}/{activeDialogue.lineCount}
        </span>
      </div>
      <div className="dialogue-window__body">
        <div className="dialogue-window__speaker">
          {speaker ? pickLocalizedText(speaker.name, locale) : activeDialogue.line.speakerId}
        </div>
        <div className="dialogue-window__text">
          {pickLocalizedText(activeDialogue.line.text, locale)}
        </div>
        <div className="dialogue-window__actions">
          <button onClick={onClose} type="button">
            {text.close}
          </button>
          <button onClick={onNext} type="button">
            {activeDialogue.isLastLine ? text.close : text.next}
          </button>
        </div>
      </div>
    </section>
  );
}
