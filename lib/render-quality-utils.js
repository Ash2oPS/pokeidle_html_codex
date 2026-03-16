function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function createRenderQualityUtils({
  clamp,
  toSafeInt,
  state,
  renderQualityOrder,
  renderQualityPresets,
  projectileVisualProfile,
  projectileTrailMaxPoints,
  projectileTrailPointLifetimeMs,
  targetFrameMs,
  debugForceUltraShinyAllPokemon,
  perfShortEmaSmoothing,
  perfLongEmaSmoothing,
  perfCpuEmaSmoothing,
  perfRenderEmaSmoothing,
  perfSwitchCooldownMs,
  perfDowngradeStreak,
  perfUpgradeStreak,
  perfSlowFrameMarginMs,
  perfVerySlowFrameMarginMs,
  perfUpgradeHeadroomMs,
  resizeCanvas,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const qualityOrder = Array.isArray(renderQualityOrder) ? renderQualityOrder : [];
  const qualityPresets = renderQualityPresets && typeof renderQualityPresets === "object"
    ? renderQualityPresets
    : {};

  function shouldForceUltraShinyAllPokemon() {
    return debugForceUltraShinyAllPokemon;
  }

  function getRenderQualitySettings() {
    const key = String(state.performance?.quality || "low");
    return qualityPresets[key] || qualityPresets.low || {};
  }

  function getRenderQualityRank(qualityKey) {
    const key = String(qualityKey || "");
    const rank = qualityOrder.indexOf(key);
    if (rank >= 0) {
      return rank;
    }
    return qualityOrder.indexOf("medium");
  }

  function setRenderQualityByRank(rank) {
    const clampedRank = safeClamp(safeToInt(rank, getRenderQualityRank("medium")), 0, qualityOrder.length - 1);
    const nextQuality = qualityOrder[clampedRank] || "medium";
    const perf = state.performance;
    if (!perf || perf.quality === nextQuality) {
      return false;
    }
    perf.quality = nextQuality;
    if (typeof resizeCanvas === "function") {
      resizeCanvas();
    }
    return true;
  }

  function isLikelyHighEndMobileDevice(coreCount, memoryGb, minSide, dpr, coarsePointer) {
    if (!coarsePointer) {
      return false;
    }
    const strongCpu = coreCount >= 8;
    const enoughMemory = memoryGb === null || memoryGb >= 6;
    const largeEnoughViewport = minSide >= 380;
    const manageableDpr = dpr <= 3.2;
    return strongCpu && enoughMemory && largeEnoughViewport && manageableDpr;
  }

  function refreshAutomaticRenderQualityRankCache() {
    const perf = state.performance;
    const coreCount = Math.max(1, safeToInt(navigator?.hardwareConcurrency, 0));
    const memoryRaw = Number(navigator?.deviceMemory || 0);
    const memoryGb = Number.isFinite(memoryRaw) && memoryRaw > 0 ? memoryRaw : null;
    const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
    const coarsePointer =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const highEndMobile = isLikelyHighEndMobileDevice(coreCount, memoryGb, minSide, dpr, coarsePointer);

    const rank =
      (highEndMobile || (!coarsePointer && coreCount >= 8 && (memoryGb === null || memoryGb >= 8) && minSide >= 900 && dpr <= 1.5))
        ? getRenderQualityRank("high")
        : getRenderQualityRank("medium");

    if (perf) {
      perf.maxAutomaticQualityRank = rank;
    }
    return rank;
  }

  function getMaxAutomaticRenderQualityRank() {
    const cachedRank = Number(state.performance?.maxAutomaticQualityRank);
    if (Number.isFinite(cachedRank)) {
      return cachedRank;
    }
    return refreshAutomaticRenderQualityRankCache();
  }

  function getInitialRenderQualityForDevice() {
    const maxAutomaticRank = getMaxAutomaticRenderQualityRank();
    let rank = Math.min(maxAutomaticRank, getRenderQualityRank("medium"));
    const coreCount = Math.max(1, safeToInt(navigator?.hardwareConcurrency, 0));
    const memoryRaw = Number(navigator?.deviceMemory || 0);
    const memoryGb = Number.isFinite(memoryRaw) && memoryRaw > 0 ? memoryRaw : null;
    const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
    const coarsePointer =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const highEndMobile = isLikelyHighEndMobileDevice(coreCount, memoryGb, minSide, dpr, coarsePointer);

    if ((memoryGb !== null && memoryGb <= 4) || coreCount <= 6) {
      rank = Math.min(rank, getRenderQualityRank("low"));
    }
    if ((memoryGb !== null && memoryGb <= 2) || coreCount <= 4) {
      rank = Math.min(rank, getRenderQualityRank("low"));
    }
    if ((memoryGb !== null && memoryGb <= 1) || coreCount <= 2) {
      rank = Math.min(rank, getRenderQualityRank("very_low"));
    }
    if (highEndMobile) {
      rank = Math.min(maxAutomaticRank, getRenderQualityRank("high"));
    } else if (coarsePointer) {
      rank = Math.min(rank, getRenderQualityRank("low"));
    }
    if (!highEndMobile && coarsePointer && minSide > 0 && minSide <= 430) {
      rank = Math.min(rank, getRenderQualityRank("very_low"));
    }
    if (!highEndMobile && minSide > 0 && minSide <= 720) {
      rank = Math.min(rank, getRenderQualityRank("low"));
    }
    if (!highEndMobile && dpr >= 2.4) {
      rank = Math.min(rank, getRenderQualityRank("low"));
    }
    if (!highEndMobile && dpr >= 3) {
      rank = Math.min(rank, getRenderQualityRank("very_low"));
    }

    return qualityOrder[Math.min(rank, maxAutomaticRank)] || "low";
  }

  function applyInitialPerformanceProfile() {
    const perf = state.performance;
    if (!perf || perf.initialized) {
      return;
    }
    perf.initialized = true;
    refreshAutomaticRenderQualityRankCache();
    perf.quality = getInitialRenderQualityForDevice();
  }

  function getForegroundSimulationBudgetMs() {
    const quality = getRenderQualitySettings();
    const budget = Number(quality.foregroundSimBudgetMs);
    return safeClamp(Number.isFinite(budget) ? budget : 68, 24, 120);
  }

  function shouldRenderAmbientOverlays() {
    return Boolean(getRenderQualitySettings().ambientOverlayEnabled);
  }

  function shouldRenderCelebrationParticles() {
    return Boolean(getRenderQualitySettings().celebrationParticles);
  }

  function getProjectileTrailMaxPoints() {
    if (!projectileVisualProfile?.trailEnabled) {
      return 0;
    }
    return Math.max(0, safeToInt(projectileVisualProfile.trailMaxPoints, projectileTrailMaxPoints));
  }

  function createProjectileTrailPoint(x, y) {
    return {
      x: Number(x) || 0,
      y: Number(y) || 0,
      lifeMs: projectileTrailPointLifetimeMs,
      maxLifeMs: projectileTrailPointLifetimeMs,
      phase: Math.random() * Math.PI * 2,
      scale: 0.84 + Math.random() * 0.36,
    };
  }

  function getProjectileTypeVfxProfile(typeName) {
    const type = String(typeName || "").toLowerCase().trim();
    switch (type) {
      case "fire":
        return { motif: "flame", accent: [255, 217, 146] };
      case "water":
        return { motif: "droplet", accent: [205, 241, 255] };
      case "grass":
        return { motif: "leaf", accent: [232, 255, 196] };
      case "electric":
        return { motif: "bolt", accent: [255, 247, 166] };
      case "ice":
        return { motif: "crystal", accent: [236, 251, 255] };
      case "fighting":
        return { motif: "impact", accent: [255, 211, 189] };
      case "poison":
        return { motif: "bubble", accent: [234, 196, 255] };
      case "ground":
        return { motif: "dust", accent: [244, 214, 154] };
      case "flying":
        return { motif: "wind", accent: [235, 245, 255] };
      case "psychic":
        return { motif: "orbit", accent: [255, 224, 242] };
      case "bug":
        return { motif: "wing", accent: [233, 255, 186] };
      case "rock":
        return { motif: "shard", accent: [236, 214, 173] };
      case "ghost":
        return { motif: "wisp", accent: [222, 212, 255] };
      case "dragon":
        return { motif: "rune", accent: [212, 207, 255] };
      case "dark":
        return { motif: "shadow", accent: [189, 177, 166] };
      case "steel":
        return { motif: "gear", accent: [227, 240, 250] };
      case "fairy":
        return { motif: "sparkle", accent: [255, 226, 247] };
      case "normal":
        return { motif: "ring", accent: [244, 236, 220] };
      default:
        return { motif: "ring", accent: [232, 240, 255] };
    }
  }

  function getProjectileTrailTypeVfxProfile(typeName) {
    const typeProfile = getProjectileTypeVfxProfile(typeName);
    const accent = Array.isArray(typeProfile.accent) ? typeProfile.accent : [232, 240, 255];
    switch (typeProfile.motif) {
      case "flame":
        return {
          mode: "ember",
          accent,
          accentMix: 0.66,
          radiusMul: 0.92,
          stretch: 1.8,
          alphaBase: 0.14,
          alphaLife: 0.31,
          spacingPx: 6.1,
        };
      case "droplet":
      case "bubble":
        return {
          mode: "droplet",
          accent,
          accentMix: 0.54,
          radiusMul: 0.9,
          stretch: 1.4,
          alphaBase: 0.14,
          alphaLife: 0.28,
          spacingPx: 7.1,
        };
      case "leaf":
      case "wing":
        return {
          mode: "leaf",
          accent,
          accentMix: 0.62,
          radiusMul: 0.84,
          stretch: 1.45,
          alphaBase: 0.12,
          alphaLife: 0.29,
          spacingPx: 7.4,
        };
      case "bolt":
      case "impact":
      case "gear":
        return {
          mode: "spark",
          accent,
          accentMix: 0.67,
          radiusMul: 0.74,
          stretch: 1.75,
          alphaBase: 0.14,
          alphaLife: 0.33,
          spacingPx: 6.2,
        };
      case "crystal":
      case "shard":
      case "rune":
        return {
          mode: "shard",
          accent,
          accentMix: 0.59,
          radiusMul: 0.82,
          stretch: 1.42,
          alphaBase: 0.12,
          alphaLife: 0.29,
          spacingPx: 7.5,
        };
      case "dust":
        return {
          mode: "dust",
          accent,
          accentMix: 0.44,
          radiusMul: 0.96,
          stretch: 1.22,
          alphaBase: 0.12,
          alphaLife: 0.25,
          spacingPx: 8.4,
        };
      case "wisp":
      case "shadow":
        return {
          mode: "wisp",
          accent,
          accentMix: 0.5,
          radiusMul: 1.02,
          stretch: 1.25,
          alphaBase: 0.1,
          alphaLife: 0.24,
          spacingPx: 8.6,
        };
      case "sparkle":
        return {
          mode: "sparkle",
          accent,
          accentMix: 0.69,
          radiusMul: 0.78,
          stretch: 1.52,
          alphaBase: 0.12,
          alphaLife: 0.3,
          spacingPx: 7,
        };
      case "orbit":
      case "wind":
      case "ring":
      default:
        return {
          mode: "streak",
          accent,
          accentMix: 0.52,
          radiusMul: 0.86,
          stretch: 1.58,
          alphaBase: 0.12,
          alphaLife: 0.27,
          spacingPx: 7.8,
        };
    }
  }

  function getRenderFrameIntervalMs() {
    const value = Number(getRenderQualitySettings().renderFrameIntervalMs);
    return safeClamp(Number.isFinite(value) ? value : targetFrameMs, 16, 56);
  }

  function updateRenderQualityFromFrame(frameDeltaMs, cpuFrameMs = frameDeltaMs, renderDeltaMs = null) {
    const perf = state.performance;
    if (!perf) {
      return;
    }
    const frameDelta = safeClamp(Number(frameDeltaMs) || targetFrameMs, 1, 120);
    const cpuDelta = safeClamp(Number(cpuFrameMs) || frameDelta, 0.1, 120);
    const hasRenderSample = Number.isFinite(renderDeltaMs) && Number(renderDeltaMs) > 0;
    const renderDelta = hasRenderSample ? safeClamp(Number(renderDeltaMs), 1, 240) : frameDelta;
    const shortCurrent = Number.isFinite(perf.shortFrameMsEma) ? perf.shortFrameMsEma : frameDelta;
    const longCurrent = Number.isFinite(perf.longFrameMsEma) ? perf.longFrameMsEma : frameDelta;
    const cpuCurrent = Number.isFinite(perf.cpuFrameMsEma) ? perf.cpuFrameMsEma : cpuDelta;
    const renderCurrent = Number.isFinite(perf.renderFrameMsEma) ? perf.renderFrameMsEma : renderDelta;
    perf.shortFrameMsEma = shortCurrent + (frameDelta - shortCurrent) * perfShortEmaSmoothing;
    perf.longFrameMsEma = longCurrent + (frameDelta - longCurrent) * perfLongEmaSmoothing;
    perf.cpuFrameMsEma = cpuCurrent + (cpuDelta - cpuCurrent) * perfCpuEmaSmoothing;
    if (hasRenderSample) {
      perf.renderFrameMsEma = renderCurrent + (renderDelta - renderCurrent) * perfRenderEmaSmoothing;
    }
    perf.switchCooldownMs = Math.max(0, (Number(perf.switchCooldownMs) || 0) - frameDelta);

    const target = Math.max(8, Number(perf.targetFrameMs) || targetFrameMs);
    const cpuHealthThreshold = target * 0.62;
    const cpuHealthy = perf.cpuFrameMsEma <= cpuHealthThreshold;
    const frameComponent = cpuHealthy
      ? Math.min(perf.shortFrameMsEma, target + 0.8)
      : perf.shortFrameMsEma;
    const longComponent = cpuHealthy
      ? Math.min(perf.longFrameMsEma, target + 1.2)
      : perf.longFrameMsEma * 0.75;
    const backlogPressureMs = document.hidden
      ? 0
      : Math.max(0, (Math.max(0, Number(state.pendingSimMs) || 0) - target * 4) * 0.12);
    const stressFrameMs = Math.max(
      perf.cpuFrameMsEma * 1.12,
      frameComponent,
      longComponent,
    ) + backlogPressureMs;
    const overBudgetMs = stressFrameMs - target;
    const underBudgetMs = target - Math.max(perf.cpuFrameMsEma, perf.longFrameMsEma * 0.7);

    if (overBudgetMs > perfSlowFrameMarginMs) {
      perf.slowFrameStreak += overBudgetMs > perfVerySlowFrameMarginMs ? 2 : 1;
      perf.fastFrameStreak = 0;
    } else if (underBudgetMs > perfUpgradeHeadroomMs) {
      perf.fastFrameStreak += 1;
      perf.slowFrameStreak = Math.max(0, perf.slowFrameStreak - 1);
    } else {
      perf.slowFrameStreak = Math.max(0, perf.slowFrameStreak - 1);
      perf.fastFrameStreak = Math.max(0, perf.fastFrameStreak - 2);
    }

    if (perf.switchCooldownMs > 0) {
      return;
    }

    const currentRank = getRenderQualityRank(perf.quality);
    const maxAutomaticRank = getMaxAutomaticRenderQualityRank();
    if (perf.slowFrameStreak >= perfDowngradeStreak && currentRank > 0) {
      const downgradeStep = overBudgetMs > perfVerySlowFrameMarginMs ? 2 : 1;
      const nextRank = Math.max(0, currentRank - downgradeStep);
      if (setRenderQualityByRank(nextRank)) {
        perf.switchCooldownMs = perfSwitchCooldownMs;
        perf.slowFrameStreak = 0;
        perf.fastFrameStreak = 0;
      }
      return;
    }

    if (perf.fastFrameStreak >= perfUpgradeStreak && currentRank < maxAutomaticRank) {
      const nextRank = Math.min(maxAutomaticRank, currentRank + 1);
      if (setRenderQualityByRank(nextRank)) {
        perf.switchCooldownMs = perfSwitchCooldownMs * 1.35;
        perf.slowFrameStreak = 0;
        perf.fastFrameStreak = 0;
      }
    }
  }

  return {
    shouldForceUltraShinyAllPokemon,
    getRenderQualitySettings,
    getRenderQualityRank,
    setRenderQualityByRank,
    isLikelyHighEndMobileDevice,
    refreshAutomaticRenderQualityRankCache,
    getMaxAutomaticRenderQualityRank,
    getInitialRenderQualityForDevice,
    applyInitialPerformanceProfile,
    getForegroundSimulationBudgetMs,
    shouldRenderAmbientOverlays,
    shouldRenderCelebrationParticles,
    getProjectileTrailMaxPoints,
    createProjectileTrailPoint,
    getProjectileTrailTypeVfxProfile,
    getRenderFrameIntervalMs,
    updateRenderQualityFromFrame,
  };
}
