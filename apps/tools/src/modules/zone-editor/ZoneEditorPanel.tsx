import { useEffect, useMemo, useState } from "react";
import type { ContentRegistry } from "@pokeidle/content-data";
import type { ZoneDefinition } from "@pokeidle/contracts";

interface ZoneEditorPanelProps {
  registry: ContentRegistry;
}

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

export function ZoneEditorPanel({ registry }: ZoneEditorPanelProps) {
  const zoneIds = useMemo(() => Object.keys(registry.zonesById).sort(), [registry]);
  const initialZoneId = zoneIds[0]!;
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId);
  const selectedZone = registry.zonesById[selectedZoneId] ?? registry.zonesById[initialZoneId]!;
  const [draft, setDraft] = useState<ZoneDefinition>(() => structuredClone(selectedZone));

  useEffect(() => {
    setDraft(structuredClone(selectedZone));
  }, [selectedZone]);

  const mapLinks = useMemo(
    () =>
      registry.worldMap.links.filter(
        (link) => link.fromZoneId === selectedZone.id || link.toZoneId === selectedZone.id,
      ),
    [registry, selectedZone.id],
  );

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <strong>Zone Editor</strong>
        <span>{draft.id}</span>
      </div>
      <div className="studio-window__body">
        <label>
          <span>Zone File</span>
          <select
            value={selectedZoneId}
            onChange={(event) => {
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
