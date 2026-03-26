function defaultNormalizeUiDisplayText(value) {
  return String(value || "");
}

export function createMapNavigationUi({
  documentRef = globalThis.document,
  normalizeUiDisplayText = defaultNormalizeUiDisplayText,
} = {}) {
  function renderMapModal({
    routeIds = [],
    currentRouteId = "",
    selectedInfoRouteId = "",
    shouldRenderRouteOnCurrentMap = () => true,
    getRouteMapMarker = () => null,
    getRouteZoneType = () => "route",
    buildRouteDisplayState = () => null,
    getConnectedRouteDisplayStates = () => [],
    createRouteNavigationEmptyState = () => null,
    buildRouteDestinationCard = () => null,
    renderRouteInfoPanelInto = () => {},
    handleMapMarkerClick = () => {},
    mapMarkersEl = null,
    mapConnectionsListEl = null,
    mapConnectionsInfoPanelEl = null,
    mapMarkerButtonsByRouteId,
  } = {}) {
    if (!mapMarkersEl) {
      return;
    }

    const renderedRouteIds = new Set();

    for (const routeId of routeIds) {
      if (!shouldRenderRouteOnCurrentMap(routeId)) {
        const staleButton = mapMarkerButtonsByRouteId.get(routeId);
        if (staleButton) {
          staleButton.remove();
          mapMarkerButtonsByRouteId.delete(routeId);
        }
        continue;
      }
      const marker = getRouteMapMarker(routeId);
      if (!marker) {
        const staleButton = mapMarkerButtonsByRouteId.get(routeId);
        if (staleButton) {
          staleButton.remove();
          mapMarkerButtonsByRouteId.delete(routeId);
        }
        continue;
      }
      renderedRouteIds.add(routeId);
      const zoneTypeKey = getRouteZoneType(routeId);
      const routeState = buildRouteDisplayState(routeId, { currentRouteId });
      if (!routeState) {
        const staleButton = mapMarkerButtonsByRouteId.get(routeId);
        if (staleButton) {
          staleButton.remove();
          mapMarkerButtonsByRouteId.delete(routeId);
        }
        continue;
      }
      const isUnlocked = routeState.unlocked;
      const isCurrent = routeId === currentRouteId;

      let button = mapMarkerButtonsByRouteId.get(routeId);
      if (!button) {
        button = documentRef.createElement("button");
        button.type = "button";
        button.className = "map-marker-btn";
        button.dataset.routeId = routeId;
        button.addEventListener("click", handleMapMarkerClick);
        mapMarkerButtonsByRouteId.set(routeId, button);
      }
      if (button.parentElement !== mapMarkersEl) {
        mapMarkersEl.appendChild(button);
      }
      button.classList.toggle("is-unlocked", isUnlocked);
      button.classList.toggle("is-current", isCurrent);
      button.classList.toggle("is-locked", !isUnlocked);
      button.classList.toggle("is-route", zoneTypeKey === "route");
      button.classList.toggle("is-town", zoneTypeKey === "town");
      button.classList.toggle("is-dungeon", zoneTypeKey === "dungeon");
      button.classList.toggle("is-info-selected", selectedInfoRouteId === routeId && !isUnlocked);
      button.dataset.routeType = zoneTypeKey;
      button.style.left = `${marker.x}%`;
      button.style.top = `${marker.y}%`;
      button.disabled = false;
      button.title = isUnlocked
        ? normalizeUiDisplayText(`${routeState.zoneTypeLabel}: ${routeState.routeNameFr}`, {
          frenchTypography: true,
        })
        : normalizeUiDisplayText(
          `${routeState.zoneTypeLabel}: ${routeState.routeNameFr} (${routeState.blockedReasonFr || "Verrouill\u00e9e"})`,
          { frenchTypography: true },
        );
      button.setAttribute("aria-label", button.title);
    }

    for (const [routeId, button] of mapMarkerButtonsByRouteId.entries()) {
      if (renderedRouteIds.has(routeId)) {
        continue;
      }
      button.remove();
      mapMarkerButtonsByRouteId.delete(routeId);
    }

    if (mapConnectionsListEl) {
      mapConnectionsListEl.replaceChildren();
      const connectionStates = getConnectedRouteDisplayStates(currentRouteId);
      if (connectionStates.length <= 0) {
        mapConnectionsListEl.appendChild(
          createRouteNavigationEmptyState("Aucune zone reli\u00e9e n'est configur\u00e9e pour cette zone."),
        );
      } else {
        for (const routeState of connectionStates) {
          mapConnectionsListEl.appendChild(buildRouteDestinationCard(routeState, {
            variant: "map-panel",
            selected: selectedInfoRouteId === routeState.routeId,
          }));
        }
      }
    }

    renderRouteInfoPanelInto(
      mapConnectionsInfoPanelEl,
      selectedInfoRouteId ? buildRouteDisplayState(selectedInfoRouteId, { currentRouteId }) : null,
    );
  }

  return Object.freeze({
    renderMapModal,
  });
}
