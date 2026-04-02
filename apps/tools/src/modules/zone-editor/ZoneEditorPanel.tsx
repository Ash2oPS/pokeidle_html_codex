import { useState } from "react";
import type { ZoneDefinition } from "@pokeidle/contracts";

const initialZone: ZoneDefinition = {
  id: "route-201",
  kind: "combat",
  name: {
    en: "Route 201",
    fr: "Route 201"
  },
  neighbors: [
    { targetZoneId: "sandgem-town", requiresCompletion: false },
    { targetZoneId: "route-202", requiresCompletion: true }
  ],
  battle: {
    enemyPoolIds: ["starly", "bidoof", "shinx"],
    enemyTimerSeconds: 8,
    defeatsRequired: 20
  }
};

export function ZoneEditorPanel() {
  const [zone, setZone] = useState(initialZone);

  return (
    <section className="studio-window">
      <div className="studio-window__titlebar">
        <strong>Zone Editor</strong>
        <span>{zone.id}</span>
      </div>
      <div className="studio-window__body">
        <label>
          <span>Name EN</span>
          <input
            value={zone.name.en}
            onChange={(event) =>
              setZone((current) => ({
                ...current,
                name: { ...current.name, en: event.target.value }
              }))
            }
          />
        </label>
        <label>
          <span>Name FR</span>
          <input
            value={zone.name.fr}
            onChange={(event) =>
              setZone((current) => ({
                ...current,
                name: { ...current.name, fr: event.target.value }
              }))
            }
          />
        </label>
        <div className="studio-grid">
          <label>
            <span>Timer</span>
            <input
              type="number"
              value={zone.battle?.enemyTimerSeconds ?? 0}
              onChange={(event) =>
                setZone((current) => ({
                  ...current,
                  battle: {
                    ...current.battle!,
                    enemyTimerSeconds: Number(event.target.value)
                  }
                }))
              }
            />
          </label>
          <label>
            <span>Defeats</span>
            <input
              type="number"
              value={zone.battle?.defeatsRequired ?? 0}
              onChange={(event) =>
                setZone((current) => ({
                  ...current,
                  battle: {
                    ...current.battle!,
                    defeatsRequired: Number(event.target.value)
                  }
                }))
              }
            />
          </label>
        </div>
        <label>
          <span>Enemy Pool</span>
          <textarea
            rows={4}
            value={zone.battle?.enemyPoolIds.join(", ") ?? ""}
            onChange={(event) =>
              setZone((current) => ({
                ...current,
                battle: {
                  ...current.battle!,
                  enemyPoolIds: event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                }
              }))
            }
          />
        </label>
        <label>
          <span>Links</span>
          <textarea
            rows={4}
            value={zone.neighbors
              .map((neighbor) => `${neighbor.targetZoneId} | complete=${neighbor.requiresCompletion}`)
              .join("\n")}
            readOnly
          />
        </label>
      </div>
    </section>
  );
}
