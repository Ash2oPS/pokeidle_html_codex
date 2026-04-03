import type { LayoutMode, Locale } from "@pokeidle/contracts";
import { buildTeamSlotContextActions } from "./team-slot-context-menu.model";

export interface TeamSlotMenuAnchor {
  x: number;
  y: number;
}

interface TeamSlotContextMenuProps {
  layoutMode: LayoutMode;
  locale: Locale;
  slotIndex: number;
  slotLabel: string | null;
  anchor: TeamSlotMenuAnchor;
  canOpenPicker: boolean;
  onClose: () => void;
  onRequestChange: () => void;
  onClear: () => void;
}

const copy = {
  en: {
    slot: "Slot",
    empty: "Empty",
    close: "Close",
  },
  fr: {
    slot: "Slot",
    empty: "Vide",
    close: "Fermer",
  },
} as const;

function getDesktopSurfaceStyle(anchor: TeamSlotMenuAnchor) {
  const width = 236;
  const left = Math.min(Math.max(anchor.x + 18, 14), window.innerWidth - width - 14);
  const top = Math.min(Math.max(anchor.y - 40, 78), window.innerHeight - 220);

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

export function TeamSlotContextMenu({
  layoutMode,
  locale,
  slotIndex,
  slotLabel,
  anchor,
  canOpenPicker,
  onClose,
  onRequestChange,
  onClear,
}: TeamSlotContextMenuProps) {
  const text = copy[locale];
  const actions = buildTeamSlotContextActions(locale, Boolean(slotLabel), canOpenPicker);

  return (
    <div className="slot-overlay-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label={`${text.slot} ${slotIndex + 1}`}
        className={`slot-surface ${
          layoutMode === "desktop-landscape" ? "slot-surface--desktop" : "slot-surface--mobile"
        }`}
        onClick={(event) => event.stopPropagation()}
        style={layoutMode === "desktop-landscape" ? getDesktopSurfaceStyle(anchor) : undefined}
      >
        <div className="slot-surface__titlebar">
          <strong>
            {text.slot} {slotIndex + 1}
          </strong>
          <button type="button" onClick={onClose}>
            {text.close}
          </button>
        </div>
        <div className="slot-surface__body">
          <div className="slot-surface__meta">{slotLabel ?? text.empty}</div>
          <div className="slot-surface__actions">
            {actions.map((action) => (
              <button
                key={action.id}
                className={`slot-surface__action ${
                  action.tone === "danger" ? "slot-surface__action--danger" : ""
                }`}
                disabled={!action.enabled}
                onClick={() => {
                  if (!action.enabled) {
                    return;
                  }

                  if (action.id === "clear") {
                    onClear();
                    return;
                  }

                  onRequestChange();
                }}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
