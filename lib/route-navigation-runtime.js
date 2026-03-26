function defaultNormalizeUiDisplayText(value) {
  return String(value || "");
}

function defaultBuildRouteNameStatusGroups() {
  return [];
}

export function formatRouteRegionLabel(regionId, defaultRegionId = "kanto") {
  const normalizedRegionId = String(regionId || defaultRegionId).toLowerCase().trim();
  if (normalizedRegionId === "hoenn") {
    return "Hoenn";
  }
  if (normalizedRegionId === "johto") {
    return "Johto";
  }
  return "Kanto";
}

export function formatRouteAccessFlagLabel(flagId) {
  const normalizedFlagId = String(flagId || "").trim();
  if (!normalizedFlagId) {
    return "";
  }
  return normalizedFlagId
    .split("_")
    .filter(Boolean)
    .map((part, index) => {
      if (part.length <= 2) {
        return part.toUpperCase();
      }
      if (index === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      return part;
    })
    .join(" ");
}

export function buildRouteAccessRequirementsSummary(routeState) {
  const summaryParts = [];
  if (Array.isArray(routeState?.requiresFlagsAll) && routeState.requiresFlagsAll.length > 0) {
    summaryParts.push(`Toutes : ${routeState.requiresFlagsAll.map(formatRouteAccessFlagLabel).join(", ")}`);
  }
  if (Array.isArray(routeState?.requiresFlagsAny) && routeState.requiresFlagsAny.length > 0) {
    summaryParts.push(`Une parmi : ${routeState.requiresFlagsAny.map(formatRouteAccessFlagLabel).join(", ")}`);
  }
  return summaryParts.join(" \u2022 ");
}

export function createRouteNavigationRuntime({
  state,
  defaultRouteId = "",
  defaultRegionId = "kanto",
  normalizeUiDisplayText = defaultNormalizeUiDisplayText,
  getOrderedCatalogRouteIds,
  getRouteNavigationState,
  getRouteUnlockProgressState,
  getConnectedRouteIds,
  getRouteAccessStateForRoute,
  isRouteUnlocked,
  getRouteDisplayName,
  getRouteZoneTypeLabel,
  getRouteRegionId,
  getRouteCollectionBadgeState,
  getRouteBackgroundImagePath = (routeId) => String(state?.routeCatalog?.get(String(routeId || ""))?.background_image || ""),
  buildRouteNameStatusGroups = defaultBuildRouteNameStatusGroups,
} = {}) {
  function buildRouteDisplayState(routeId, options = {}) {
    const targetRouteId = String(routeId || "").trim();
    if (!targetRouteId) {
      return null;
    }
    const currentRouteId = String(
      options?.currentRouteId || state?.routeData?.route_id || state?.saveData?.current_route_id || defaultRouteId,
    );
    const progressState = options?.progressState || getRouteUnlockProgressState(currentRouteId);
    const connectedRouteIds = Array.isArray(options?.connectedRouteIds)
      ? options.connectedRouteIds
      : getConnectedRouteIds(currentRouteId);
    const accessState = options?.accessState || getRouteAccessStateForRoute(targetRouteId);
    const unlocked = options?.unlocked === true || isRouteUnlocked(targetRouteId);
    const currentRouteName = getRouteDisplayName(currentRouteId);
    const connectedFromCurrent = connectedRouteIds.includes(targetRouteId);
    const isAccessBlocked = Boolean(!accessState?.allowed);
    const requiresFlagsAll = Array.isArray(accessState?.requires_flags_all) ? accessState.requires_flags_all : [];
    const requiresFlagsAny = Array.isArray(accessState?.requires_flags_any) ? accessState.requires_flags_any : [];
    let statusLabel = normalizeUiDisplayText(unlocked ? "Ouverte" : "Verrouill\u00e9e", { frenchTypography: true });
    let blockedReasonFr = "";
    let lockDetailFr = "";
    let progressionRequirementFr = "";
    let connectionHintFr = "";

    if (!unlocked && isAccessBlocked) {
      const blockedReason = String(accessState?.blocked_reason_fr || "").trim();
      blockedReasonFr = normalizeUiDisplayText(blockedReason || "Conditions de zone non remplies.", {
        frenchTypography: true,
      });
      lockDetailFr = blockedReasonFr;
      statusLabel = normalizeUiDisplayText("Bloqu\u00e9e", { frenchTypography: true });
    } else if (!unlocked && connectedFromCurrent) {
      if (progressState.unlockMode === "visit") {
        blockedReasonFr = normalizeUiDisplayText("Visite requise.", { frenchTypography: true });
        progressionRequirementFr = normalizeUiDisplayText(
          `Valide la visite de ${currentRouteName} pour ouvrir cette zone reliée.`,
          { frenchTypography: true },
        );
      } else {
        blockedReasonFr = normalizeUiDisplayText(
          `${progressState.currentDefeats}/${progressState.unlockTarget} KO requis.`,
          { frenchTypography: true },
        );
        const timerSuffix = progressState.timerEnabled
          ? normalizeUiDisplayText(` Fen\u00eatre : ${Math.round(progressState.timerDurationMs / 1000)} s max par combat.`, {
            frenchTypography: true,
          })
          : "";
        progressionRequirementFr = normalizeUiDisplayText(
          `Compl\u00e8te ${progressState.currentDefeats}/${progressState.unlockTarget} KO d'affil\u00e9e dans ${currentRouteName} pour ouvrir cette zone reliée.${timerSuffix}`,
          { frenchTypography: true },
        );
      }
      lockDetailFr = progressionRequirementFr || blockedReasonFr;
      statusLabel = normalizeUiDisplayText("\u00c0 ouvrir", { frenchTypography: true });
    } else if (!unlocked) {
      blockedReasonFr = normalizeUiDisplayText("Pas de liaison directe.", { frenchTypography: true });
      connectionHintFr = normalizeUiDisplayText(
        `Cette zone n'est pas reli\u00e9e directement \u00e0 ${currentRouteName}. Progresse via les zones reliées pour l'atteindre.`,
        { frenchTypography: true },
      );
      lockDetailFr = connectionHintFr;
      statusLabel = normalizeUiDisplayText("\u00c0 atteindre", { frenchTypography: true });
    }

    const routeState = {
      routeId: targetRouteId,
      routeNameFr: getRouteDisplayName(targetRouteId),
      zoneTypeLabel: getRouteZoneTypeLabel(targetRouteId),
      regionId: getRouteRegionId(targetRouteId),
      regionLabel: formatRouteRegionLabel(getRouteRegionId(targetRouteId), defaultRegionId),
      backgroundImagePath: getRouteBackgroundImagePath(targetRouteId),
      unlocked,
      blocked: !unlocked,
      connectedFromCurrent,
      accessBlocked: isAccessBlocked,
      blockedReasonFr,
      lockDetailFr,
      progressionRequirementFr,
      connectionHintFr,
      statusLabel,
      requiresFlagsAll,
      requiresFlagsAny,
    };
    routeState.accessRequirementsSummary = buildRouteAccessRequirementsSummary(routeState);
    return routeState;
  }

  function getConnectedRouteDisplayStates(routeId = null) {
    const currentRouteId = String(routeId || state?.routeData?.route_id || state?.saveData?.current_route_id || defaultRouteId);
    const progressState = getRouteUnlockProgressState(currentRouteId);
    const connectedRouteIds = getConnectedRouteIds(currentRouteId);
    return connectedRouteIds
      .map((connectedRouteId) => buildRouteDisplayState(connectedRouteId, {
        currentRouteId,
        progressState,
        connectedRouteIds,
      }))
      .filter(Boolean);
  }

  function buildRouteNavigationViewModel(routeId = null) {
    const hasCatalog = state?.routeCatalog?.size > 0;
    const orderedRoutes = getOrderedCatalogRouteIds();
    const { unlockedRouteIds, currentRouteId } = getRouteNavigationState();
    const activeRouteId = String(routeId || currentRouteId || defaultRouteId);
    const progressState = getRouteUnlockProgressState(activeRouteId);
    const destinationCards = getConnectedRouteDisplayStates(activeRouteId);
    const unlockedCount = unlockedRouteIds.length;
    const totalCount = Math.max(1, orderedRoutes.length);
    const progressChips = [
      {
        label: normalizeUiDisplayText(`${unlockedCount}/${totalCount} zones d\u00e9bloqu\u00e9es`, {
          frenchTypography: true,
        }),
        accent: true,
        title: normalizeUiDisplayText("Progression globale des zones d\u00e9bloqu\u00e9es.", {
          frenchTypography: true,
        }),
      },
    ];
    if (destinationCards.length <= 0) {
      progressChips.push({
        label: normalizeUiDisplayText("Aucune zone reliée", { frenchTypography: true }),
        tone: "warning",
        title: normalizeUiDisplayText("Cette zone ne dispose d'aucune zone reliée configurée.", {
          frenchTypography: true,
        }),
      });
    }
    if (progressState.unlockMode === "visit" && progressState.unlockableConnectedRouteIds.length > 0) {
      progressChips.push({
        label: normalizeUiDisplayText(
          `${progressState.unlockableConnectedRouteIds.length} zone${progressState.unlockableConnectedRouteIds.length > 1 ? "s" : ""} \u00e0 ouvrir`,
          { frenchTypography: true },
        ),
        tone: "success",
        title: normalizeUiDisplayText(
          "Les zones reliées s'ouvriront à la validation de la visite.",
          { frenchTypography: true },
        ),
      });
    } else if (progressState.unlockMode === "defeats" && progressState.unlockableConnectedRouteIds.length > 0) {
      progressChips.push({
        label: normalizeUiDisplayText(`${progressState.currentDefeats}/${progressState.unlockTarget} KO`, {
          frenchTypography: true,
        }),
        accent: true,
        title: normalizeUiDisplayText(
          "Progression de la série de KO requise pour ouvrir les zones reliées.",
          { frenchTypography: true },
        ),
      });
      if (progressState.timerEnabled) {
        progressChips.push({
          label: normalizeUiDisplayText(`${Math.round(progressState.timerDurationMs / 1000)} s max`, {
            frenchTypography: true,
          }),
          tone: "warning",
          title: normalizeUiDisplayText("Temps maximum autoris\u00e9 par combat pour garder la s\u00e9rie.", {
            frenchTypography: true,
          }),
        });
      }
    }
    if (progressState.blockedConnectedRoutes.length > 0) {
      progressChips.push({
        label: normalizeUiDisplayText(
          `${progressState.blockedConnectedRoutes.length} zone${progressState.blockedConnectedRoutes.length > 1 ? "s" : ""} bloquée${progressState.blockedConnectedRoutes.length > 1 ? "s" : ""}`,
          { frenchTypography: true },
        ),
        tone: "warning",
        title: normalizeUiDisplayText("Certaines zones reliées demandent encore des flags ou une condition de zone.", {
          frenchTypography: true,
        }),
      });
    } else if (destinationCards.length > 0 && destinationCards.every((entry) => entry.unlocked)) {
      progressChips.push({
        label: normalizeUiDisplayText("Toutes ouvertes", { frenchTypography: true }),
        tone: "success",
        title: normalizeUiDisplayText("Toutes les zones reliées sont ouvertes.", {
          frenchTypography: true,
        }),
      });
    }
    const badgeGroups = buildRouteNameStatusGroups(getRouteCollectionBadgeState(activeRouteId));
    const selectedRouteId = String(state?.ui?.routeNavInfoRouteId || "").trim();
    const selectedLockedDestination = selectedRouteId
      ? (
        destinationCards.find((entry) => entry.routeId === selectedRouteId)
        || buildRouteDisplayState(selectedRouteId, { currentRouteId: activeRouteId })
      )
      : null;
    if (selectedLockedDestination?.unlocked) {
      state.ui.routeNavInfoRouteId = null;
    }
    if (destinationCards.length <= 0) {
      state.ui.routeNavDrawerOpen = false;
    }
    return {
      hasCatalog,
      currentZoneHeader: {
        routeId: activeRouteId,
        routeNameFr: getRouteDisplayName(activeRouteId),
        zoneTypeLabel: getRouteZoneTypeLabel(activeRouteId),
        regionId: getRouteRegionId(activeRouteId),
        regionLabel: formatRouteRegionLabel(getRouteRegionId(activeRouteId), defaultRegionId),
        backgroundImagePath: getRouteBackgroundImagePath(activeRouteId),
      },
      unlockSummary: progressChips[0]?.label || "",
      progressChips,
      destinationCards,
      badgeGroups,
      blockedCount: progressState.blockedConnectedRoutes.length,
      navigationDrawerOpen: Boolean(state?.ui?.routeNavDrawerOpen && destinationCards.length > 0),
      selectedLockedDestinationId: selectedLockedDestination?.unlocked ? null : selectedLockedDestination?.routeId || null,
      selectedLockedDestination: selectedLockedDestination?.unlocked ? null : selectedLockedDestination,
    };
  }

  return Object.freeze({
    buildRouteAccessRequirementsSummary,
    buildRouteDisplayState,
    buildRouteNavigationViewModel,
    formatRouteAccessFlagLabel,
    formatRouteRegionLabel: (regionId) => formatRouteRegionLabel(regionId, defaultRegionId),
    getConnectedRouteDisplayStates,
  });
}
