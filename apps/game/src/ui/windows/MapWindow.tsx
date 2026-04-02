import type { SliceViewState } from "@pokeidle/game-core";
import { pickLocalizedText } from "@pokeidle/game-core";
import type { Locale } from "@pokeidle/contracts";

interface MapWindowProps {
  locale: Locale;
  selectedZoneId: string;
  view: SliceViewState;
  onSelectZone: (zoneId: string) => void;
  onTravel: (zoneId: string) => void;
}

const copy = {
  en: {
    title: "Map",
    travel: "Travel",
    active: "Active",
    accessible: "Accessible",
    locked: "Locked",
    completed: "Completed",
    details: "Details",
    neighbors: "Neighbors",
    town: "Town",
    combat: "Combat",
    timer: "Timer",
    defeats: "Defeats",
  },
  fr: {
    title: "Carte",
    travel: "Voyager",
    active: "Active",
    accessible: "Accessible",
    locked: "Bloquee",
    completed: "Completee",
    details: "Details",
    neighbors: "Voisins",
    town: "Ville",
    combat: "Combat",
    timer: "Timer",
    defeats: "Victoires",
  },
} as const;

function getNodeStatusLabel(locale: Locale, state: SliceViewState["worldMapNodes"][number]["state"]) {
  const text = copy[locale];

  if (state === "active") {
    return text.active;
  }

  if (state === "completed") {
    return text.completed;
  }

  if (state === "accessible") {
    return text.accessible;
  }

  return text.locked;
}

function getZoneKindLabel(locale: Locale, zoneKind: "combat" | "pacifist") {
  return zoneKind === "combat" ? copy[locale].combat : copy[locale].town;
}

export function MapWindow({
  locale,
  selectedZoneId,
  view,
  onSelectZone,
  onTravel,
}: MapWindowProps) {
  const text = copy[locale];
  const fallbackNode = view.worldMapNodes[0]!;
  const selectedNode =
    view.worldMapNodes.find((node) => node.zone.id === selectedZoneId) ??
    view.worldMapNodes.find((node) => node.zone.id === view.activeZone.zone.id) ??
    fallbackNode;
  const selectedZone = selectedNode.zone;
  const selectedProgress = selectedNode.progress;
  const connectedLinks = view.worldMapLinks.filter(
    (entry) =>
      entry.link.fromZoneId === selectedZone.id || entry.link.toZoneId === selectedZone.id,
  );

  return (
    <>
      <div className="focus-window__titlebar">
        <strong>{text.title}</strong>
      </div>
      <div className="focus-window__body focus-window__body--map">
        <div className="map-window__board">
          <svg className="map-window__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {view.worldMapLinks.map((entry) => {
              const fromNode = view.worldMapNodes.find((node) => node.zone.id === entry.link.fromZoneId);
              const toNode = view.worldMapNodes.find((node) => node.zone.id === entry.link.toZoneId);

              if (!fromNode || !toNode) {
                return null;
              }

              return (
                <line
                  key={entry.link.id}
                  className={entry.isOpen ? "map-window__line is-open" : "map-window__line"}
                  x1={fromNode.node.position.x}
                  x2={toNode.node.position.x}
                  y1={fromNode.node.position.y}
                  y2={toNode.node.position.y}
                />
              );
            })}
          </svg>

          {view.worldMapNodes.map((entry) => (
            <button
              key={entry.node.id}
              className={`map-window__node map-window__node--${entry.state}`}
              onClick={() => onSelectZone(entry.zone.id)}
              style={{
                left: `${entry.node.position.x}%`,
                top: `${entry.node.position.y}%`,
              }}
              type="button"
            >
              <strong>{pickLocalizedText(entry.zone.name, locale)}</strong>
              <span>{getNodeStatusLabel(locale, entry.state)}</span>
            </button>
          ))}
        </div>

        <div className="map-window__detail">
          <div className="focus-row focus-row--metric">
            <span>{text.details}</span>
            <strong>{pickLocalizedText(selectedZone.name, locale)}</strong>
          </div>
          <div className="focus-row focus-row--metric">
            <span>{getZoneKindLabel(locale, selectedZone.kind)}</span>
            <strong>{getNodeStatusLabel(locale, selectedNode.state)}</strong>
          </div>
          <div className="focus-row">
            <strong>{text.neighbors}</strong>
            <div className="focus-tag-list">
              {connectedLinks.length > 0
                ? connectedLinks.map((entry) => {
                    const otherZoneId =
                      entry.link.fromZoneId === selectedZone.id
                        ? entry.link.toZoneId
                        : entry.link.fromZoneId;
                    const otherZone = view.registry.zonesById[otherZoneId];

                    if (!otherZone) {
                      return null;
                    }

                    return (
                      <span key={entry.link.id} className="focus-tag">
                        {pickLocalizedText(otherZone.name, locale)}
                      </span>
                    );
                  })
                : null}
            </div>
          </div>
          {selectedZone.kind === "combat" ? (
            <>
              <div className="focus-row focus-row--metric">
                <span>{text.timer}</span>
                <strong>{selectedZone.battle.enemyTimerSeconds}s</strong>
              </div>
              <div className="focus-row focus-row--metric">
                <span>{text.defeats}</span>
                <strong>{selectedZone.battle.defeatsRequired}</strong>
              </div>
            </>
          ) : null}
          <button
            className="focus-primary-button"
            disabled={!selectedProgress.accessible || selectedZone.id === view.activeZone.zone.id}
            onClick={() => onTravel(selectedZone.id)}
            type="button"
          >
            {text.travel}
          </button>
        </div>
      </div>
    </>
  );
}
