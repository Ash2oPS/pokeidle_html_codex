function defaultNormalizeUiDisplayText(value) {
  return String(value || "");
}

function normalizeComparableUiText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function createRouteNavigationUi({
  documentRef = globalThis.document,
  normalizeUiDisplayText = defaultNormalizeUiDisplayText,
  formatRouteAccessFlagLabel = (value) => String(value || ""),
} = {}) {
  function createElement(tagName) {
    return documentRef.createElement(tagName);
  }

  function hasDistinctUiCopy(candidate, ...others) {
    const normalizedCandidate = normalizeComparableUiText(candidate);
    if (!normalizedCandidate) {
      return false;
    }
    return !others.some((entry) => normalizeComparableUiText(entry) === normalizedCandidate);
  }

  function buildRouteCollectionBadgeChip(group) {
    const chipEl = createElement("span");
    chipEl.className = "route-nav-badge-chip";

    const labelEl = createElement("span");
    labelEl.className = "route-nav-badge-chip-label";
    labelEl.textContent = group?.kind === "family" ? "Familles" : "Zone";
    chipEl.appendChild(labelEl);

    const statusesEl = createElement("span");
    statusesEl.className = "route-nav-current-statuses";

    const groupEl = createElement("span");
    groupEl.className = "route-nav-status-group";

    const ballEl = createElement("span");
    ballEl.className = "route-nav-status-ball";
    ballEl.title = String(group?.ballTitle || "Progression de collection");
    groupEl.appendChild(ballEl);

    if (group?.shiny) {
      const shinyEl = createElement("span");
      shinyEl.className = "boxes-mode-badge boxes-mode-badge-shiny route-nav-status-badge";
      shinyEl.textContent = "\u2726";
      shinyEl.title = group?.kind === "family"
        ? "Shiny famille complet sur la zone."
        : "Shiny complet sur toutes les esp\u00e8ces de la zone.";
      groupEl.appendChild(shinyEl);
    }
    if (group?.ultra) {
      const ultraEl = createElement("span");
      ultraEl.className = "boxes-mode-badge boxes-mode-badge-ultra route-nav-status-badge";
      ultraEl.textContent = "\u2726";
      ultraEl.title = group?.kind === "family"
        ? "Ultra shiny famille complet sur la zone."
        : "Ultra shiny complet sur toutes les esp\u00e8ces de la zone.";
      groupEl.appendChild(ultraEl);
    }

    statusesEl.appendChild(groupEl);
    chipEl.appendChild(statusesEl);
    return chipEl;
  }

  function buildRouteProgressChip(chip) {
    const chipEl = createElement("span");
    chipEl.className = "route-nav-progress-chip";
    chipEl.classList.toggle("is-accent", Boolean(chip?.accent));
    chipEl.classList.toggle("is-warning", chip?.tone === "warning");
    chipEl.classList.toggle("is-success", chip?.tone === "success");
    chipEl.classList.toggle("is-neutral", !chip?.tone);
    chipEl.textContent = String(chip?.label || "");
    if (chip?.title) {
      chipEl.title = String(chip.title);
    }
    return chipEl;
  }

  function createRouteNavigationEmptyState(text) {
    const emptyEl = createElement("span");
    emptyEl.className = "route-nav-empty-state";
    emptyEl.textContent = normalizeUiDisplayText(text || "", { frenchTypography: true });
    return emptyEl;
  }

  function buildRouteDestinationCard(routeState, options = {}) {
    const variant = String(options?.variant || "desktop-inline").toLowerCase().trim();
    const button = createElement("button");
    button.type = "button";
    button.className = "route-nav-destination-card";
    button.classList.add(`is-${variant}`);
    button.classList.toggle("is-locked", !routeState?.unlocked);
    button.classList.toggle("is-selected", Boolean(options?.selected));
    button.dataset.routeId = String(routeState?.routeId || "");
    button.dataset.routeAction = routeState?.unlocked ? "travel" : "info";

    const topLineEl = createElement("span");
    topLineEl.className = "route-nav-destination-topline";

    const metaEl = createElement("span");
    metaEl.className = "route-nav-destination-meta";
    metaEl.textContent = normalizeUiDisplayText(
      `${routeState?.zoneTypeLabel || "Zone"} \u2022 ${routeState?.regionLabel || ""}`,
      { frenchTypography: true },
    );
    topLineEl.appendChild(metaEl);

    const statusEl = createElement("span");
    statusEl.className = "route-nav-destination-status";
    statusEl.classList.toggle("is-locked", !routeState?.unlocked);
    statusEl.textContent = normalizeUiDisplayText(
      routeState?.statusLabel || (routeState?.unlocked ? "Ouverte" : "Verrouill\u00e9e"),
      { frenchTypography: true },
    );
    topLineEl.appendChild(statusEl);
    button.appendChild(topLineEl);

    const labelEl = createElement("span");
    labelEl.className = "route-nav-destination-label";
    labelEl.textContent = String(routeState?.routeNameFr || "");
    button.appendChild(labelEl);

    if (!routeState?.unlocked && routeState?.blockedReasonFr) {
      const reasonEl = createElement("span");
      reasonEl.className = "route-nav-destination-reason";
      reasonEl.textContent = routeState.blockedReasonFr;
      button.appendChild(reasonEl);
    }

    const requirementsSummary = String(routeState?.accessRequirementsSummary || "");
    button.title = routeState?.unlocked
      ? normalizeUiDisplayText(`${routeState?.zoneTypeLabel}: ${routeState?.routeNameFr}`, {
        frenchTypography: true,
      })
      : normalizeUiDisplayText(
        `${routeState?.zoneTypeLabel}: ${routeState?.routeNameFr} (${routeState?.blockedReasonFr || "Verrouill\u00e9e"})${requirementsSummary ? ` \u2022 ${requirementsSummary}` : ""}`,
        { frenchTypography: true },
      );
    return button;
  }

  function buildRouteAccessInfoPanel(routeState) {
    const wrapperEl = createElement("div");
    wrapperEl.className = "route-nav-info-card";

    const headerEl = createElement("div");
    headerEl.className = "route-nav-info-header";

    const titleWrapEl = createElement("div");
    titleWrapEl.className = "route-nav-info-title-wrap";

    const titleEl = createElement("div");
    titleEl.className = "route-nav-info-title";
    titleEl.textContent = routeState?.routeNameFr || "Zone";
    titleWrapEl.appendChild(titleEl);

    const subtitleEl = createElement("div");
    subtitleEl.className = "route-nav-info-subtitle";
    subtitleEl.textContent = normalizeUiDisplayText(
      `${routeState?.zoneTypeLabel || "Zone"} \u2022 ${routeState?.regionLabel || ""}`,
      { frenchTypography: true },
    );
    titleWrapEl.appendChild(subtitleEl);
    headerEl.appendChild(titleWrapEl);

    const closeButtonEl = createElement("button");
    closeButtonEl.type = "button";
    closeButtonEl.className = "route-nav-info-close";
    closeButtonEl.dataset.routeInfoClose = "true";
    closeButtonEl.setAttribute("aria-label", normalizeUiDisplayText("Fermer les d\u00e9tails de verrouillage", {
      frenchTypography: true,
    }));
    closeButtonEl.textContent = "Fermer";
    headerEl.appendChild(closeButtonEl);
    wrapperEl.appendChild(headerEl);

    const statusEl = createElement("div");
    statusEl.className = "route-nav-info-status";
    statusEl.classList.toggle("is-locked", !routeState?.unlocked);
    const statusText = routeState?.unlocked
      ? normalizeUiDisplayText("Cette sortie est ouverte.", { frenchTypography: true })
      : normalizeUiDisplayText(
        routeState?.blockedReasonFr
          || (
            routeState?.statusLabel === "\u00c0 atteindre"
              ? "Cette zone n'est pas encore atteignable depuis la zone active."
              : "Cette sortie reste verrouill\u00e9e."
          ),
        { frenchTypography: true },
      );
    statusEl.textContent = statusText;
    wrapperEl.appendChild(statusEl);

    if (hasDistinctUiCopy(routeState?.lockDetailFr, statusText, routeState?.progressionRequirementFr, routeState?.connectionHintFr)) {
      const reasonEl = createElement("div");
      reasonEl.className = "route-nav-info-reason";
      reasonEl.textContent = routeState.lockDetailFr;
      wrapperEl.appendChild(reasonEl);
    }

    if (hasDistinctUiCopy(routeState?.progressionRequirementFr, statusText)) {
      const sectionEl = createElement("div");
      sectionEl.className = "route-nav-info-section";
      const labelEl = createElement("div");
      labelEl.className = "route-nav-info-section-label";
      labelEl.textContent = normalizeUiDisplayText("Objectif actuel", { frenchTypography: true });
      sectionEl.appendChild(labelEl);
      const contentEl = createElement("div");
      contentEl.className = "route-nav-info-section-copy";
      contentEl.textContent = routeState.progressionRequirementFr;
      sectionEl.appendChild(contentEl);
      wrapperEl.appendChild(sectionEl);
    }

    if (hasDistinctUiCopy(routeState?.connectionHintFr, statusText, routeState?.progressionRequirementFr)) {
      const sectionEl = createElement("div");
      sectionEl.className = "route-nav-info-section";
      const labelEl = createElement("div");
      labelEl.className = "route-nav-info-section-label";
      labelEl.textContent = normalizeUiDisplayText("Chemin", { frenchTypography: true });
      sectionEl.appendChild(labelEl);
      const contentEl = createElement("div");
      contentEl.className = "route-nav-info-section-copy";
      contentEl.textContent = routeState.connectionHintFr;
      sectionEl.appendChild(contentEl);
      wrapperEl.appendChild(sectionEl);
    }

    if (Array.isArray(routeState?.requiresFlagsAll) && routeState.requiresFlagsAll.length > 0) {
      const sectionEl = createElement("div");
      sectionEl.className = "route-nav-info-section";
      const labelEl = createElement("div");
      labelEl.className = "route-nav-info-section-label";
      labelEl.textContent = "Toutes les conditions";
      sectionEl.appendChild(labelEl);
      const listEl = createElement("div");
      listEl.className = "route-nav-info-flag-list";
      for (const flagId of routeState.requiresFlagsAll) {
        const pillEl = createElement("span");
        pillEl.className = "route-nav-info-flag-pill";
        pillEl.textContent = formatRouteAccessFlagLabel(flagId);
        listEl.appendChild(pillEl);
      }
      sectionEl.appendChild(listEl);
      wrapperEl.appendChild(sectionEl);
    }

    if (Array.isArray(routeState?.requiresFlagsAny) && routeState.requiresFlagsAny.length > 0) {
      const sectionEl = createElement("div");
      sectionEl.className = "route-nav-info-section";
      const labelEl = createElement("div");
      labelEl.className = "route-nav-info-section-label";
      labelEl.textContent = "Une condition parmi";
      sectionEl.appendChild(labelEl);
      const listEl = createElement("div");
      listEl.className = "route-nav-info-flag-list";
      for (const flagId of routeState.requiresFlagsAny) {
        const pillEl = createElement("span");
        pillEl.className = "route-nav-info-flag-pill";
        pillEl.textContent = formatRouteAccessFlagLabel(flagId);
        listEl.appendChild(pillEl);
      }
      sectionEl.appendChild(listEl);
      wrapperEl.appendChild(sectionEl);
    }

    return wrapperEl;
  }

  function renderRouteInfoPanelInto(panelEl, routeState) {
    if (!panelEl) {
      return;
    }
    panelEl.replaceChildren();
    if (!routeState || routeState.unlocked) {
      panelEl.classList.add("hidden");
      return;
    }
    panelEl.appendChild(buildRouteAccessInfoPanel(routeState));
    panelEl.classList.remove("hidden");
  }

  function renderPrimaryNavigation({ viewModel, refs } = {}) {
    const {
      routeNavPanelEl,
      routeNavZoneTypeEl,
      routeNavRegionEl,
      routeNavCurrentEl,
      routeNavBadgesEl,
      routeNavProgressChipsEl,
      routeNavDestinationsEl,
      routeNavDrawerToggleCountEl,
      routeNavDrawerToggleButtonEl,
      routeNavDrawerEl,
      routeNavDrawerListEl,
      routeNavInfoPanelEl,
      mapConnectionsInfoPanelEl,
    } = refs || {};
    const {
      hasCatalog,
      currentZoneHeader,
      badgeGroups,
      progressChips,
      destinationCards,
      selectedLockedDestination,
      selectedLockedDestinationId,
      navigationDrawerOpen,
    } = viewModel || {};

    if (routeNavPanelEl) {
      routeNavPanelEl.classList.toggle("is-empty", !hasCatalog);
      routeNavPanelEl.classList.toggle("has-route-nav-info", Boolean(selectedLockedDestination));
    }
    if (routeNavZoneTypeEl) {
      routeNavZoneTypeEl.textContent = currentZoneHeader?.zoneTypeLabel || "";
    }
    if (routeNavRegionEl) {
      routeNavRegionEl.textContent = currentZoneHeader?.regionLabel || "";
    }
    if (routeNavCurrentEl) {
      routeNavCurrentEl.textContent = currentZoneHeader?.routeNameFr || "";
    }
    if (routeNavBadgesEl) {
      routeNavBadgesEl.replaceChildren();
      routeNavBadgesEl.classList.toggle("hidden", (badgeGroups || []).length <= 0);
      for (const group of badgeGroups || []) {
        routeNavBadgesEl.appendChild(buildRouteCollectionBadgeChip(group));
      }
    }
    if (routeNavProgressChipsEl) {
      routeNavProgressChipsEl.replaceChildren();
      for (const chip of progressChips || []) {
        routeNavProgressChipsEl.appendChild(buildRouteProgressChip(chip));
      }
    }
    if (routeNavDestinationsEl) {
      routeNavDestinationsEl.replaceChildren();
      if (!hasCatalog || (destinationCards || []).length <= 0) {
        routeNavDestinationsEl.appendChild(createRouteNavigationEmptyState("Aucune sortie configur\u00e9e pour cette zone."));
      } else {
        for (const routeState of destinationCards) {
          routeNavDestinationsEl.appendChild(buildRouteDestinationCard(routeState, {
            variant: "desktop-inline",
            selected: selectedLockedDestinationId === routeState.routeId,
          }));
        }
      }
    }
    if (routeNavDrawerToggleCountEl) {
      routeNavDrawerToggleCountEl.textContent = String((destinationCards || []).length);
    }
    if (routeNavDrawerToggleButtonEl) {
      const destinationCount = (destinationCards || []).length;
      routeNavDrawerToggleButtonEl.disabled = destinationCount <= 0;
      routeNavDrawerToggleButtonEl.setAttribute("aria-expanded", navigationDrawerOpen ? "true" : "false");
      routeNavDrawerToggleButtonEl.setAttribute(
        "aria-label",
        normalizeUiDisplayText(
          destinationCount > 0
            ? `Afficher ${destinationCount} sortie${destinationCount > 1 ? "s" : ""} connect\u00e9e${destinationCount > 1 ? "s" : ""}`
            : "Aucune sortie connect\u00e9e",
          { frenchTypography: true },
        ),
      );
    }
    if (routeNavDrawerEl) {
      routeNavDrawerEl.classList.toggle("hidden", !navigationDrawerOpen);
    }
    if (routeNavDrawerListEl) {
      routeNavDrawerListEl.replaceChildren();
      if ((destinationCards || []).length <= 0) {
        routeNavDrawerListEl.appendChild(createRouteNavigationEmptyState("Aucune sortie configur\u00e9e pour cette zone."));
      } else {
        for (const routeState of destinationCards) {
          routeNavDrawerListEl.appendChild(buildRouteDestinationCard(routeState, {
            variant: "mobile-drawer",
            selected: selectedLockedDestinationId === routeState.routeId,
          }));
        }
      }
    }
    renderRouteInfoPanelInto(routeNavInfoPanelEl, selectedLockedDestination || null);
    renderRouteInfoPanelInto(mapConnectionsInfoPanelEl, selectedLockedDestination || null);
  }

  return Object.freeze({
    buildRouteCollectionBadgeChip,
    buildRouteDestinationCard,
    buildRouteProgressChip,
    createRouteNavigationEmptyState,
    renderPrimaryNavigation,
    renderRouteInfoPanelInto,
  });
}
