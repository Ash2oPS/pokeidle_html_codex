import { describe, expect, it } from "vitest";
import { buildTeamSlotContextActions } from "./team-slot-context-menu.model";

describe("buildTeamSlotContextActions", () => {
  it("returns only add for empty slots", () => {
    expect(buildTeamSlotContextActions("en", false, true)).toEqual([
      {
        id: "add",
        label: "Add Pokemon",
        enabled: true,
        tone: "default",
      },
    ]);
  });

  it("returns change and clear for filled slots", () => {
    expect(buildTeamSlotContextActions("en", true, true)).toEqual([
      {
        id: "change",
        label: "Change Pokemon",
        enabled: true,
        tone: "default",
      },
      {
        id: "clear",
        label: "Clear Slot",
        enabled: true,
        tone: "danger",
      },
    ]);
  });
});
