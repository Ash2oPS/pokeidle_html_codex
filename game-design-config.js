/**
 * Source unique des reglages globaux de game design.
 *
 * Regles:
 * - Ne mets ici que du tuning global.
 * - Garde le contenu par route / item / Pokemon dans les CSV/JSON existants.
 * - Chaque cle doit rester simple, stable et clairement nommee.
 *
 * Carte rapide:
 * - rarete: shiny / ultra shiny
 * - combat: cadence, degats, timings de combat, talents globaux
 * - capture: capture feel et multiplicateurs
 * - progression: XP, niveaux, scaling global
 * - economie: argent / coins
 * - routeUnlock: debloquage de routes et only-one
 * - gacha: couts, pool, timings
 * - ui: timings et interactions globales de surface
 * - metrics: cadence runtime, qualite de rendu, seuils perf
 */
export const GAME_DESIGN_CONFIG = {
  /** Rarete globale et feedback shiny. */
  rarity: {
    /** Chance de shiny normale: 1 / shinyOdds. */
    shinyOdds: 2048,
    /** Chance de ultra shiny: 1 / ultraShinyOdds. */
    ultraShinyOdds: 8192,
    /** Duree du cycle de teinte ultra shiny. */
    ultraShinyHueCycleMs: 7600,
    /** Frequence de scintillation ultra shiny. */
    ultraShinyScintillationPeriodMs: 1150,
    /** Duree du flash de scintillation ultra shiny. */
    ultraShinyScintillationFlashMs: 220,
    /** Debug uniquement: force tous les Pokemon en ultra shiny. */
    debugForceUltraShinyAllPokemon: false,
  },

  /** Combat principal, degats et talents globaux. */
  combat: {
    /** Pas de simulation de base. */
    baseStepMs: 1000 / 60,
    /** Niveau de depart de base quand il doit etre force en code. */
    starterLevel: 1,
    /** Intervalle d'attaque standard. */
    attackIntervalMs: 420,
    /** Chance de critique standard. */
    attackCritChance: 0.05,
    /** Chance de miss standard. */
    attackMissChance: 0.05,
    /** Multiplicateur de critique. */
    attackCritMultiplier: 1.5,
    /** Facteur global de degats. */
    damageScale: 2.2,
    /** Courbe de progression des degats par niveau. */
    damageLevelProgressionExponent: 0.62,
    /** Interpolation du compteur d'argent. */
    moneyCounterLerpMs: 180,
    /** Pulse du compteur d'argent. */
    moneyCounterPulseMs: 520,

    /** Boost X global. */
    boostX: {
      /** Duree du boost X. */
      durationMs: 2 * 60 * 1000,
      /** Multiplicateur applique a l'intervalle d'attaque. */
      attackIntervalMultiplier: 0.33,
    },

    /** Projectiles et traines. */
    projectile: {
      /** Vitesse de projectile. */
      speedPxPerSecond: 910,
      /** Duree mini de tween projectile. */
      tweenDurationMinMs: 80,
      /** Duree maxi de tween projectile. */
      tweenDurationMaxMs: 354,
      /** Arc de base du tween. */
      tweenArcBasePx: 8,
      /** Variance d'arc du tween. */
      tweenArcRandomPx: 14,
      /** Taille sprite projectile. */
      spritePx: 72,
      /** Duree de vie d'un point de trainee. */
      trailPointLifetimeMs: 170,
      /** Cap global de points de trainee. */
      trailMaxPoints: 10,
      /** Espacement cible des points de trainee. */
      trailPointBaseSpacingPx: 7.2,
      /** Espacement mini des points de trainee. */
      trailPointMinSpacingPx: 4.5,
      /** Espacement maxi des points de trainee. */
      trailPointMaxSpacingPx: 13.5,
      /** Profil visuel par defaut des projectiles. */
      visualProfile: {
        trailEnabled: true,
        trailMaxPoints: 4,
        trailStride: 2,
        trailGlow: false,
        streak: false,
        aura: false,
        auraScale: 0.66,
        spriteDetail: true,
      },
    },

    /** Cadence et decoupage des degats laser. */
    laser: {
      /** Multiplicateur de l'intervalle moyen de tick laser sur l'intervalle d'attaque global. */
      tickIntervalMultiplier: 1,
      /** Jitter applique autour de l'intervalle moyen de tick laser. */
      tickJitterMs: 100,
      /** Diviseur applique aux degats de reference a chaque tick laser. */
      damagePerTickDivisor: 6,
    },

    /** Rendu VFX projectile / laser crunchy sans reduction de render scale. */
    vfx: {
      /** Taille d'atlas de sprite projectile pre-rendu. */
      projectileAtlasSizePx: 36,
      /** Taille d'atlas d'un stamp de trainee projectile. */
      projectileTrailStampSizePx: 18,
      /** Nombre borne de variantes pre-rendues par projectile de type. */
      projectileVariantCount: 3,
      /** Alignement pixel pour les VFX. */
      pixelSnapStepPx: 2,
      /** Taille des textures beam pre-packees. */
      laserPackedTextureWidthPx: 128,
      laserPackedTextureHeightPx: 24,
      /** Buckets de distance pour les budgets laser. */
      laserDistanceNearPx: 110,
      laserDistanceMidPx: 240,
      laserDistanceFarPx: 420,
      /** Caps globaux par chemin de rendu laser. */
      laserPackedSimpleSegmentMaxCount: 1,
      laserPixelCurvedSegmentMaxCount: 6,
      laserHeroCurvedSegmentMaxCount: 10,
      laserPackedSimpleParticleMaxCount: 0,
      laserPixelCurvedParticleMaxCount: 2,
      laserHeroCurvedParticleMaxCount: 4,
      /** Intensites generales de rendu. */
      laserPackedSimpleWidthMultiplier: 1.08,
      laserPixelCurvedWidthMultiplier: 1.14,
      laserHeroCurvedWidthMultiplier: 1.2,
      laserGlowAlpha: 0.08,
      projectileGlowAlpha: 0.1,
    },

    /** Timings et ratios du ressenti combat. */
    timings: {
      koRespawnDelayMs: 110,
      koAnimationDurationMs: 110,
      enemyEnterAnimDurationMs: 140,
      enemyEnterAnimOffsetPx: 84,
      enemyEnterAnimRotationDeg: 8,
      enemyEnterAnimFadeRatio: 0.58,
      enemyEnterAnimRotateRatio: 0.4,
      attackFlashDurationMs: 150,
      attackFlashWhiteBlend: 0.4,
      skipTurnEffectDurationMinMs: 190,
      skipTurnEffectDurationMaxMs: 720,
      skipTurnEffectFadeRatio: 0.24,
      skipTurnEffectGrayscaleMax: 0.94,
      attackChargeMinWindowMs: 120,
      attackChargeWindowRatio: 0.42,
      teleportSwapScaleDurationMs: 130,
      enemyDamageFlashDurationMs: 150,
      enemyDamageFlashRedBlend: 0.4,
    },

    /** Textes flottants globaux. */
    floatingText: {
      lifetimeMs: 950,
      enterTweenMs: 120,
      exitTweenMs: 220,
    },

    /** Talents qui changent la balance globale. */
    talents: {
      legendaryFieldAttackBonus: 0.35,
      legendaryFieldAttackIntervalMultiplier: 0.8,
      critBonusChanceById: {
        VALIANT_EYE: 0.1,
      },
      moneyMultiplierById: {
        JACKPOT: 1.2,
        JACKPOT_PLUS: 1.4,
      },
      teleportSwapChanceById: {
        TELEPORT: 0.1,
        TELEPORT_PLUS: 0.2,
        TELEPORT_PLUS_PLUS: 0.3,
      },
      teleportPlusPlusDamageMultiplier: 1.5,
    },
  },

  /** Reglages de capture globaux. */
  capture: {
    throwMs: 360,
    shakeMs: 560,
    successBurstMs: 560,
    failBreakMs: 420,
    failReappearMs: 460,
    postMs: 230,
    critChance: 0.1,
    critMultiplier: 2,
    ballMultiplierNerf: 0.5,
  },

  /** Progression, niveaux, XP et scaling. */
  progression: {
    maxLevel: 100,
    defaultWildLevelMin: 2,
    defaultWildLevelMax: 6,
    captureXpBase: 10,
    captureXpLevelMult: 5,
    captureXpStatFactor: 0.024,
    koXpRatioOfCapture: 0.3,
    levelProgressionLinearPerStep: 0.055,
    levelProgressionCurveExponent: 1.52,
    levelProgressionCurvePerStep: 0.038,
    enemyHpTeamScaleMaxBonus: 1.8,
    enemyHpTeamScaleExponent: 1.12,
    enemyRewardScaleExponent: 0.45,
    enemyRewardScaleBlend: 0.7,
    appearanceUnlockLevel: 10,
    pokemonNicknameMaxLength: 14,
    happinessEvolutionBoxRequiredMs: 3 * 60 * 60 * 1000,
  },

  /** Economie globale. */
  economy: {
    enemyMoneyBase: 16,
    enemyMoneyLevelMult: 9,
    enemyMoneyStatFactor: 0.06,
    coinRewardPerCapture: 1,
    coinRewardFirstCaptureBonus: 5,
    coinRewardPerEvolution: 3,
    minLevelDiffMoneyMultiplier: 0.35,
  },

  /** Debloquage de routes et cadence des encounters speciaux. */
  routeUnlock: {
    routeUnlockDefeats: 20,
    routeDefeatTimerMs: 20000,
    onlyOneEncounterInterval: 50,
    onlyOneEncounterHpMultiplier: 3,
    onlyOneEncounterTimerMs: 150000,
    enemyTimerStyleRoute: "route",
    enemyTimerStyleOnlyOne: "only-one",
  },

  /** Gacha et skins. */
  gacha: {
    spinCostCoins: 10,
    batchSpinCount: 10,
    batchSpinCostCoins: 100,
    baseMaxPokemonId: 151,
    extendedMaxPokemonId: 493,
    reelTotalItems: 64,
    rewardIndex: 44,
    spinDurationMs: 2400,
    batchSpinDurationMs: 3200,
    spinFinalSnapDurationMs: 220,
    spinFinalSnapLeadPx: 24,
    batchSpotlightPopMs: 620,
    batchSpotlightTransferMs: 420,
    batchSpotlightStepGapMs: 110,
    batchSlotJuiceMs: 560,
  },

  /** Timings UI et interactions globales. */
  ui: {
    teamDragStartDistancePx: 12,
    teamDragClickSuppressMs: 220,
    teamContextTouchHoldDelayMs: 460,
    teamContextTouchHoldCancelDistancePx: 10,
    ballInventoryMaxPerType: 9999,
    shopQuantityPresetValues: ["1", "5", "10", "50", "100"],
    evolutionAnimTotalMs: 2480,
    evolutionAnimWhiteMs: 1120,
    evolutionAnimFlashMs: 280,
    evolutionAnimRevealMs: 820,
    evolutionAnimBackdropFadeMs: 320,
    evolutionAnimParticleCount: 14,
    backgroundDriftTravelMinMs: 9000,
    backgroundDriftTravelMaxMs: 21000,
    backgroundDriftHoldMinMs: 1200,
    backgroundDriftHoldMaxMs: 4200,
    teamLevelUpEffectDurationMs: 780,
    teamXpGainEffectDurationMs: 920,
    teamXpPulseDurationMs: 360,
    loadingScreenExitDurationMs: 820,
    actionDockFullscreenMenuTransitionMs: 340,
    hud: {
      desktopCurrentZoneMaxWidthPx: 560,
      desktopCurrentZoneHeightPx: 84,
      desktopProgressHeightPx: 28,
      mobileZoneHeaderHeightPx: 68,
      mobileResourceRowHeightPx: 52,
      mobileBallRailCellHeightPx: 36,
      mobileBallRailMaxWidthPx: 88,
      mobileTopStackMaxHeightPx: 164,
      minimumTouchTargetPx: 44,
      secondaryTextMinFontSizeDesktopPx: 11,
      secondaryTextMinFontSizeMobilePx: 12,
    },
    modal: {
      sizeSMaxWidthPx: 480,
      sizeMMaxWidthPx: 760,
      sizeLMaxWidthPx: 1240,
      mobileSideInsetPx: 12,
      mobileRadiusPx: 20,
      mobileMaxHeightVh: 88,
    },
    actionMenu: {
      desktopPanelMaxWidthPx: 720,
      desktopGridColumns: 4,
      mobileGridColumns: 2,
      onboardingPulseDurationMs: 2200,
      onboardingPulseRepeatDelayMs: 1800,
    },
    notification: {
      desktopMaxWidthPx: 420,
      desktopMaxVisibleCount: 3,
      mobileMaxVisibleCount: 2,
      mobileCardHeightPx: 72,
      mobileBottomOffsetPx: 12,
    },
    collectionLayout: {
      desktopGridRatioPercent: 72,
      desktopDetailRatioPercent: 28,
      mobileDetailSheetHeightVh: 48,
      mobileMapMinHeightVh: 42,
    },
    mobileSafeArea: {
      sideInsetPx: 12,
      quickCardHeightPx: 148,
    },
  },

  /** Cadence runtime, presets de rendu et seuils de perf. */
  metrics: {
    foregroundFrameStepMs: 40,
    hiddenSimBudgetMs: 180000,
    /** Limite CPU d'un tick background live avant yield. */
    backgroundPumpMaxWorkMs: 4,
    bulkIdleThresholdMs: 1200,
    maxOfflineCatchupMs: 1000 * 60 * 60 * 24 * 7,
    /** Catch-up maxi apres reprise same-session d'un background/suspend. */
    maxResumeCatchupMs: 1000 * 60 * 60 * 6,
    /** Limite CPU d'une tranche de catch-up foreground. */
    foregroundCatchupPumpMaxWorkMs: 6,
    /** Delai entre deux tranches de catch-up foreground. */
    foregroundCatchupPumpDelayMs: 16,
    backgroundTickIntervalMs: 1000,
    /** Anti-spam des persist pendant les transitions de lifecycle. */
    backgroundPersistDebounceMs: 250,
    /** Watchdog desktop pour continuer l'idle quand le renderer ne tick plus. */
    desktopBackgroundWatchdogIntervalMs: 50,
    /** Seuil de stall du renderer desktop avant prise en charge watchdog. */
    desktopBackgroundWatchdogStallMs: 125,
    targetFps: 60,
    maxForegroundPendingMs: 320,
    hudAutoRefreshIntervalMs: 200,
    layoutRecomputeIntervalMs: 220,
    deferredRouteWarmupChunkSize: 2,
    deferredRouteWarmupDelayMs: 180,
    localDayStartHour: 7,
    localNightStartHour: 19,
    environmentUpdateIntervalMs: 120,
    /** Plafond global de DPR. Le rendu interne reste toujours a l'echelle x1. */
    maxRenderDpr: 4,
    renderQualityOrder: ["very_low", "low", "medium", "high", "ultra"],
    renderQualityPresets: {
      ultra: {
        renderFrameIntervalMs: 17,
        foregroundSimBudgetMs: 72,
        environmentParticleScale: 0.45,
        environmentUpdateIntervalMult: 1.3,
        fogLayerCount: 1,
        ambientOverlayEnabled: true,
        celebrationParticles: true,
        enemyHitGlow: false,
        levelUpParticleStride: 2,
        lightningGlow: false,
        vignette: false,
      },
      high: {
        renderFrameIntervalMs: 17,
        foregroundSimBudgetMs: 64,
        environmentParticleScale: 0.22,
        environmentUpdateIntervalMult: 1.6,
        fogLayerCount: 1,
        ambientOverlayEnabled: true,
        celebrationParticles: true,
        enemyHitGlow: false,
        levelUpParticleStride: 3,
        lightningGlow: false,
        vignette: false,
      },
      medium: {
        renderFrameIntervalMs: 17,
        foregroundSimBudgetMs: 56,
        environmentParticleScale: 0.06,
        environmentUpdateIntervalMult: 2,
        fogLayerCount: 0,
        ambientOverlayEnabled: false,
        celebrationParticles: false,
        enemyHitGlow: false,
        levelUpParticleStride: 4,
        lightningGlow: false,
        vignette: false,
      },
      low: {
        renderFrameIntervalMs: 20,
        foregroundSimBudgetMs: 48,
        environmentParticleScale: 0,
        environmentUpdateIntervalMult: 2.4,
        fogLayerCount: 0,
        ambientOverlayEnabled: false,
        celebrationParticles: false,
        enemyHitGlow: false,
        levelUpParticleStride: 5,
        lightningGlow: false,
        vignette: false,
      },
      very_low: {
        renderFrameIntervalMs: 24,
        foregroundSimBudgetMs: 40,
        environmentParticleScale: 0,
        environmentUpdateIntervalMult: 2.8,
        fogLayerCount: 0,
        ambientOverlayEnabled: false,
        celebrationParticles: false,
        enemyHitGlow: false,
        levelUpParticleStride: 6,
        lightningGlow: false,
        vignette: false,
      },
    },
    perfShortEmaSmoothing: 0.18,
    perfLongEmaSmoothing: 0.045,
    perfCpuEmaSmoothing: 0.14,
    perfRenderEmaSmoothing: 0.2,
    perfSwitchCooldownMs: 900,
    perfDowngradeStreak: 9,
    perfUpgradeStreak: 170,
    perfSlowFrameMarginMs: 1.4,
    perfVerySlowFrameMarginMs: 4.6,
    perfUpgradeHeadroomMs: 2.6,
  },
};
