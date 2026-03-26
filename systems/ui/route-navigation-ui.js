function defaultNormalizeUiDisplayText(value) {
  return String(value || "");
}

function normalizeComparableUiText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatPrimaryRouteHeaderLabel(routeName, regionLabel) {
  const safeRouteName = String(routeName || "").trim();
  const safeRegionLabel = String(regionLabel || "").trim();
  if (!safeRouteName) {
    return "";
  }
  if (!safeRegionLabel) {
    return safeRouteName;
  }
  const trailingRegionPattern = new RegExp(`\\s*\\(${escapeRegExp(safeRegionLabel)}\\)\\s*$`, "i");
  return safeRouteName.replace(trailingRegionPattern, "").trim() || safeRouteName;
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

  function buildRenderSignature(value) {
    return JSON.stringify(value ?? null);
  }

  function replaceChildrenIfSignatureChanged(containerEl, signature, buildChildren) {
    if (!containerEl) {
      return;
    }
    const nextSignature = String(signature || "");
    if (containerEl.dataset.routeRenderSignature === nextSignature) {
      return;
    }
    containerEl.dataset.routeRenderSignature = nextSignature;
    containerEl.replaceChildren();
    if (typeof buildChildren === "function") {
      buildChildren(containerEl);
    }
  }

  function appendRouteBackgroundPreview(containerEl, routeState, options = {}) {
    if (!containerEl) {
      return;
    }
    const previewEl = createElement("span");
    previewEl.className = "route-nav-zone-preview";
    const variant = String(options?.variant || "graph-node").trim();
    if (variant) {
      previewEl.classList.add(`is-${variant}`);
    }

    const backgroundImagePath = String(routeState?.backgroundImagePath || "").trim();
    if (!backgroundImagePath) {
      previewEl.classList.add("is-empty");
    } else {
      const imageEl = createElement("img");
      imageEl.className = "route-nav-zone-preview-image";
      imageEl.alt = "";
      imageEl.decoding = "async";
      imageEl.loading = "lazy";
      imageEl.src = backgroundImagePath;
      previewEl.appendChild(imageEl);
    }

    const overlayEl = createElement("span");
    overlayEl.className = "route-nav-zone-preview-overlay";
    previewEl.appendChild(overlayEl);
    containerEl.appendChild(previewEl);
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

    appendRouteBackgroundPreview(button, routeState, {
      variant: "destination-card",
    });

    const contentEl = createElement("span");
    contentEl.className = "route-nav-destination-content";

    const labelEl = createElement("span");
    labelEl.className = "route-nav-destination-label";
    labelEl.textContent = formatPrimaryRouteHeaderLabel(routeState?.routeNameFr || "", routeState?.regionLabel || "")
      || String(routeState?.routeNameFr || "");
    contentEl.appendChild(labelEl);
    button.appendChild(contentEl);

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
      ? normalizeUiDisplayText("Cette zone est ouverte.", { frenchTypography: true })
      : normalizeUiDisplayText(
        routeState?.blockedReasonFr
          || (
            routeState?.statusLabel === "\u00c0 atteindre"
              ? "Cette zone n'est pas encore atteignable depuis la zone active."
              : "Cette zone reste verrouill\u00e9e."
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
    if (!routeState || routeState.unlocked) {
      panelEl.dataset.routeRenderSignature = "";
      panelEl.replaceChildren();
      panelEl.classList.add("hidden");
      return;
    }
    replaceChildrenIfSignatureChanged(panelEl, buildRenderSignature(routeState), (targetEl) => {
      targetEl.appendChild(buildRouteAccessInfoPanel(routeState));
    });
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
      routeNavCurrentEl.textContent = formatPrimaryRouteHeaderLabel(
        currentZoneHeader?.routeNameFr || "",
        currentZoneHeader?.regionLabel || "",
      );
    }
    const modalCurrentValueEl = routeNavDrawerEl?.querySelector?.(".route-nav-modal-current-value") || null;
    if (modalCurrentValueEl) {
      modalCurrentValueEl.textContent = formatPrimaryRouteHeaderLabel(
        currentZoneHeader?.routeNameFr || "",
        currentZoneHeader?.regionLabel || "",
      );
    }
    const modalCurrentRegionEl = routeNavDrawerEl?.querySelector?.(".route-nav-modal-current-region") || null;
    if (modalCurrentRegionEl) {
      modalCurrentRegionEl.textContent = currentZoneHeader?.regionLabel || "";
    }
    if (routeNavBadgesEl) {
      const safeBadgeGroups = badgeGroups || [];
      routeNavBadgesEl.classList.toggle("hidden", safeBadgeGroups.length <= 0);
      replaceChildrenIfSignatureChanged(routeNavBadgesEl, buildRenderSignature(safeBadgeGroups), (targetEl) => {
        for (const group of safeBadgeGroups) {
          targetEl.appendChild(buildRouteCollectionBadgeChip(group));
        }
      });
    }
    if (routeNavProgressChipsEl) {
      const safeProgressChips = progressChips || [];
      replaceChildrenIfSignatureChanged(routeNavProgressChipsEl, buildRenderSignature(safeProgressChips), (targetEl) => {
        for (const chip of safeProgressChips) {
          targetEl.appendChild(buildRouteProgressChip(chip));
        }
      });
    }
    if (routeNavDestinationsEl) {
      const safeDestinationCards = destinationCards || [];
      const destinationsSignature = buildRenderSignature({
        hasCatalog,
        destinationCards: safeDestinationCards,
        selectedLockedDestinationId: selectedLockedDestinationId || null,
      });
      replaceChildrenIfSignatureChanged(routeNavDestinationsEl, destinationsSignature, (targetEl) => {
        if (!hasCatalog || safeDestinationCards.length <= 0) {
          targetEl.appendChild(createRouteNavigationEmptyState("Aucune zone reli\u00e9e n'est configur\u00e9e pour cette zone."));
          return;
        }
        for (const routeState of safeDestinationCards) {
          targetEl.appendChild(buildRouteDestinationCard(routeState, {
            variant: "desktop-inline",
            selected: selectedLockedDestinationId === routeState.routeId,
          }));
        }
      });
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
            ? `Afficher ${destinationCount} zone${destinationCount > 1 ? "s" : ""} reli\u00e9e${destinationCount > 1 ? "s" : ""}`
            : "Aucune zone reli\u00e9e",
          { frenchTypography: true },
        ),
      );
    }
    if (routeNavDrawerEl) {
      routeNavDrawerEl.classList.toggle("hidden", !navigationDrawerOpen);
      routeNavDrawerEl.classList.toggle("has-route-nav-info", Boolean(selectedLockedDestination));
    }
    if (routeNavDrawerListEl) {
      replaceChildrenIfSignatureChanged(routeNavDrawerListEl, buildRenderSignature({
        destinationCards: destinationCards || [],
        selectedLockedDestinationId: selectedLockedDestinationId || null,
      }), (targetEl) => {
        const safeDestinationCards = destinationCards || [];
        if (safeDestinationCards.length <= 0) {
          targetEl.appendChild(createRouteNavigationEmptyState("Aucune zone reli\u00e9e n'est configur\u00e9e pour cette zone."));
          return;
        }
        for (const routeState of safeDestinationCards) {
          targetEl.appendChild(buildRouteDestinationCard(routeState, {
            variant: "drawer-list",
            selected: selectedLockedDestinationId === routeState.routeId,
          }));
        }
      });
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
