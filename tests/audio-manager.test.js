import { beforeEach, describe, expect, it, vi } from "vitest";

const { globalHowler, MockHowl } = vi.hoisted(() => {
  const hoistedHowler = {
    autoUnlock: false,
    volume: vi.fn(),
    mute: vi.fn(),
  };

  class HoistedMockHowl {
    constructor(options) {
      this.options = options;
      this.play = vi.fn(() => "playback-id");
      this.stop = vi.fn();
      this.unload = vi.fn();
      this.rate = vi.fn();
      this.seek = vi.fn();
      this._volume = options.volume ?? 1;
      this._muted = false;
      this.volume = vi.fn((value) => {
        if (typeof value !== "undefined") {
          this._volume = value;
        }
        return this._volume;
      });
      this.mute = vi.fn((value) => {
        if (typeof value !== "undefined") {
          this._muted = value;
        }
        return this._muted;
      });
    }
  }

  return {
    globalHowler: hoistedHowler,
    MockHowl: HoistedMockHowl,
  };
});

vi.mock("../vendor/howler.js", () => ({
  Howl: MockHowl,
  Howler: globalHowler,
}));

import { createAudioManager } from "../lib/audio-manager.js";

describe("audio-manager", () => {
  beforeEach(() => {
    globalHowler.autoUnlock = false;
    globalHowler.volume.mockClear();
    globalHowler.mute.mockClear();
  });

  it("initialise le master audio et synchronise les categories", () => {
    const manager = createAudioManager({ masterVolume: 0.8, muted: false });
    const entry = manager.registerSound("ui-click", {
      src: "assets/audio/ui-click.ogg",
      category: "sfx",
      volume: 0.5,
    });

    expect(globalHowler.autoUnlock).toBe(true);
    expect(globalHowler.volume).toHaveBeenLastCalledWith(0.8);
    expect(globalHowler.mute).toHaveBeenLastCalledWith(false);
    expect(entry.howl.volume).toHaveBeenLastCalledWith(0.5);

    manager.setCategoryVolume("sfx", 0.4);
    expect(entry.howl.volume).toHaveBeenLastCalledWith(0.2);
  });

  it("joue et configure un son en utilisant Howler", () => {
    const manager = createAudioManager();
    const entry = manager.registerSound("battle-hit", {
      src: ["assets/audio/battle-hit.ogg"],
      category: "sfx",
      volume: 0.6,
    });

    const playbackId = manager.play("battle-hit", { rate: 1.1, seek: 0.2 });

    expect(playbackId).toBe("playback-id");
    expect(entry.howl.play).toHaveBeenCalledTimes(1);
    expect(entry.howl.rate).toHaveBeenCalledWith(1.1, "playback-id");
    expect(entry.howl.seek).toHaveBeenCalledWith(0.2, "playback-id");
  });

  it("expose un snapshot de l'etat audio et gere le mute global", () => {
    const manager = createAudioManager();
    manager.registerSound("route-theme", {
      src: "assets/audio/route-theme.ogg",
      category: "music",
      loop: true,
    });

    manager.setMuted(true);

    expect(globalHowler.mute).toHaveBeenLastCalledWith(true);
    expect(manager.getSnapshot()).toEqual({
      masterMuted: true,
      masterVolume: 1,
      categories: {
        music: { volume: 1, muted: false },
        sfx: { volume: 1, muted: false },
      },
      registeredSoundIds: ["route-theme"],
    });
  });
});
