import { Howl, Howler } from "../vendor/howler.js";
import { clamp } from "./number-utils.js";

function normalizeSoundSources(src) {
  if (Array.isArray(src)) {
    return src.map((entry) => String(entry || "")).filter(Boolean);
  }
  if (typeof src === "string" && src.trim()) {
    return [src];
  }
  return [];
}

function createCategoryState(volume = 1, muted = false) {
  return {
    volume: clamp(Number(volume || 1), 0, 1),
    muted: Boolean(muted),
  };
}

export function createAudioManager(options = {}) {
  const soundsById = new Map();
  const categories = new Map([
    ["music", createCategoryState()],
    ["sfx", createCategoryState()],
  ]);

  let masterVolume = clamp(Number(options.masterVolume || 1), 0, 1);
  let masterMuted = Boolean(options.muted);

  Howler.autoUnlock = true;
  Howler.volume(masterVolume);
  Howler.mute(masterMuted);

  function ensureCategory(name) {
    const categoryName = String(name || "sfx").trim().toLowerCase() || "sfx";
    if (!categories.has(categoryName)) {
      categories.set(categoryName, createCategoryState());
    }
    return categoryName;
  }

  function syncEntry(entry) {
    if (!entry) {
      return;
    }
    const category = categories.get(entry.category) || createCategoryState();
    entry.howl.volume(clamp(entry.baseVolume * category.volume, 0, 1));
    entry.howl.mute(Boolean(category.muted));
  }

  function registerSound(id, config = {}) {
    const soundId = String(id || "").trim();
    if (!soundId) {
      throw new Error("Audio id obligatoire");
    }

    const src = normalizeSoundSources(config.src);
    if (src.length <= 0) {
      throw new Error(`Aucune source audio pour "${soundId}"`);
    }

    const existing = soundsById.get(soundId);
    if (existing) {
      existing.howl.unload();
      soundsById.delete(soundId);
    }

    const category = ensureCategory(config.category);
    const baseVolume = clamp(Number(config.volume ?? 1), 0, 1);
    const howl = new Howl({
      src,
      html5: Boolean(config.html5),
      loop: Boolean(config.loop),
      preload: config.preload !== false,
      volume: baseVolume,
    });
    const entry = {
      id: soundId,
      howl,
      src,
      category,
      baseVolume,
      loop: Boolean(config.loop),
    };
    soundsById.set(soundId, entry);
    syncEntry(entry);
    return entry;
  }

  function play(id, overrides = {}) {
    const soundId = String(id || "").trim();
    const entry = soundsById.get(soundId);
    if (!entry) {
      return null;
    }

    const playbackId = entry.howl.play();
    if (Number.isFinite(Number(overrides.rate))) {
      entry.howl.rate(Number(overrides.rate), playbackId);
    }
    if (Number.isFinite(Number(overrides.seek))) {
      entry.howl.seek(Number(overrides.seek), playbackId);
    }
    return playbackId;
  }

  function stop(id) {
    const entry = soundsById.get(String(id || "").trim());
    if (!entry) {
      return false;
    }
    entry.howl.stop();
    return true;
  }

  function stopAll() {
    for (const entry of soundsById.values()) {
      entry.howl.stop();
    }
  }

  function unload(id) {
    const soundId = String(id || "").trim();
    const entry = soundsById.get(soundId);
    if (!entry) {
      return false;
    }
    entry.howl.unload();
    soundsById.delete(soundId);
    return true;
  }

  function unloadAll() {
    for (const entry of soundsById.values()) {
      entry.howl.unload();
    }
    soundsById.clear();
  }

  function setMasterVolume(nextVolume) {
    masterVolume = clamp(Number(nextVolume || 0), 0, 1);
    Howler.volume(masterVolume);
    return masterVolume;
  }

  function setMuted(nextMuted) {
    masterMuted = Boolean(nextMuted);
    Howler.mute(masterMuted);
    return masterMuted;
  }

  function setCategoryVolume(name, nextVolume) {
    const categoryName = ensureCategory(name);
    const state = categories.get(categoryName) || createCategoryState();
    state.volume = clamp(Number(nextVolume || 0), 0, 1);
    categories.set(categoryName, state);
    for (const entry of soundsById.values()) {
      if (entry.category === categoryName) {
        syncEntry(entry);
      }
    }
    return state.volume;
  }

  function setCategoryMuted(name, nextMuted) {
    const categoryName = ensureCategory(name);
    const state = categories.get(categoryName) || createCategoryState();
    state.muted = Boolean(nextMuted);
    categories.set(categoryName, state);
    for (const entry of soundsById.values()) {
      if (entry.category === categoryName) {
        syncEntry(entry);
      }
    }
    return state.muted;
  }

  function getSnapshot() {
    return {
      masterMuted,
      masterVolume,
      categories: Object.fromEntries(categories.entries()),
      registeredSoundIds: Array.from(soundsById.keys()),
    };
  }

  return {
    registerSound,
    play,
    stop,
    stopAll,
    unload,
    unloadAll,
    setMasterVolume,
    setMuted,
    setCategoryVolume,
    setCategoryMuted,
    getSnapshot,
  };
}
