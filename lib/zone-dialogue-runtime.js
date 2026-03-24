function defaultNormalizeUiDisplayText(value) {
  return String(value || "");
}

function defaultNormalizeFlagIdList(list) {
  return Array.isArray(list) ? list : [];
}

export function createZoneDialogueRuntime({
  state,
  defaultRouteId = "",
  dialogueDataDir = "map_data/dialogues",
  normalizeUiDisplayText = defaultNormalizeUiDisplayText,
  normalizeFlagIdList = defaultNormalizeFlagIdList,
  fetchFn = (...args) => fetch(...args),
  validateDialoguePayload = (payload) => payload,
  getRouteAccessFlags = () => [],
  getRouteDataById = () => null,
  getRouteDisplayName = (routeId) => String(routeId || ""),
  setRouteAccessFlag = () => false,
  tryUnlockNextRouteAfterDefeat = () => ({ route_names_fr: [] }),
  refreshRouteUi = () => {},
  refreshZoneActionButtons = () => {},
  renderMapModal = () => {},
  updateHud = () => {},
  persistSaveDataForSimulationEvent = () => {},
  setTopMessage = () => {},
  hideHoverPopup = () => {},
  prepareDialogueUi = () => {},
  showDialogueModal = () => {},
  hideDialogueModal = () => {},
  clearDialogueUi = () => {},
  renderDialogueModal = () => {},
  canOpenDialogueModalNow = () => false,
  hasSeenDialogue = () => false,
  markDialogueSeen = () => false,
  tryOpenPendingTutorialFlow = () => {},
} = {}) {
  const pendingDialogueDefinitionLoads = new Map();

  function buildDialogueDataPath(dialogueId) {
    const id = String(dialogueId || "").trim();
    return id ? `${dialogueDataDir}/${encodeURIComponent(id)}.json` : "";
  }

  function getCurrentRouteZoneActions() {
    const actions = Array.isArray(state.routeData?.zone_actions) ? state.routeData.zone_actions : [];
    return actions.filter((action) =>
      action
      && String(action.action_id || "").trim()
      && String(action.dialogue_id || "").trim()
      && String(action.kind || "dialogue").trim() === "dialogue");
  }

  function getDialogueNodeById(definition, nodeId) {
    if (!definition || !Array.isArray(definition.nodes)) {
      return null;
    }
    const id = String(nodeId || "").trim();
    return definition.nodes.find((node) => String(node?.node_id || "").trim() === id) || null;
  }

  function areDialogueFlagRequirementsMet(requiresAll = [], requiresAny = []) {
    const flags = new Set(getRouteAccessFlags());
    const requiredAll = normalizeFlagIdList(requiresAll);
    const requiredAny = normalizeFlagIdList(requiresAny);
    if (requiredAll.some((flagId) => !flags.has(flagId))) {
      return false;
    }
    if (requiredAny.length > 0 && !requiredAny.some((flagId) => flags.has(flagId))) {
      return false;
    }
    return true;
  }

  function getAvailableDialogueChoices(node) {
    const choices = Array.isArray(node?.choices) ? node.choices : [];
    return choices.filter((choice) =>
      areDialogueFlagRequirementsMet(choice.requires_flags_all, choice.requires_flags_any));
  }

  function isDialogueQueuedOrActive(dialogueId) {
    const id = String(dialogueId || "").trim();
    if (!id) {
      return false;
    }
    if (String(state.dialogue?.active?.dialogueId || "").trim() === id) {
      return true;
    }
    return Array.isArray(state.dialogue?.queue)
      && state.dialogue.queue.some((entry) => String(entry?.dialogueId || "").trim() === id);
  }

  function enqueueDialogueRequest(request, options = {}) {
    if (!state.saveData) {
      return false;
    }
    const dialogueId = String(request?.dialogueId || request?.dialogue_id || "").trim();
    if (!dialogueId) {
      return false;
    }
    const once = request?.once === true;
    if (once && hasSeenDialogue(dialogueId)) {
      return false;
    }
    if (isDialogueQueuedOrActive(dialogueId)) {
      return false;
    }
    const entry = {
      dialogueId,
      once,
      routeId: String(request?.routeId || state.routeData?.route_id || state.saveData?.current_route_id || defaultRouteId),
      source: String(request?.source || "manual"),
      sourceActionId: String(request?.sourceActionId || ""),
    };
    if (options.front === true) {
      state.dialogue.queue.unshift(entry);
    } else {
      state.dialogue.queue.push(entry);
    }
    return true;
  }

  async function loadDialogueDefinition(dialogueId) {
    const id = String(dialogueId || "").trim();
    if (!id) {
      return null;
    }
    if (state.dialogue.definitionsById.has(id)) {
      return state.dialogue.definitionsById.get(id);
    }
    if (pendingDialogueDefinitionLoads.has(id)) {
      return pendingDialogueDefinitionLoads.get(id);
    }
    const task = fetchFn(buildDialogueDataPath(id), { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => validateDialoguePayload(payload, `Dialogue ${id}`))
      .then((payload) => {
        state.dialogue.definitionsById.set(id, payload);
        return payload;
      })
      .finally(() => {
        pendingDialogueDefinitionLoads.delete(id);
      });
    pendingDialogueDefinitionLoads.set(id, task);
    return task;
  }

  function commitDialogueSideEffects(effects = []) {
    let changed = false;
    for (const effect of Array.isArray(effects) ? effects : []) {
      const kind = String(effect?.kind || "").trim();
      const flagId = String(effect?.flag_id || "").trim();
      if (!flagId) {
        continue;
      }
      if (kind === "set_flag_true") {
        changed = setRouteAccessFlag(flagId, true) || changed;
      } else if (kind === "set_flag_false") {
        changed = setRouteAccessFlag(flagId, false) || changed;
      }
    }
    if (!changed) {
      return { changed: false, unlockedRouteNames: [] };
    }
    const unlockResult = tryUnlockNextRouteAfterDefeat(
      state.routeData?.route_id || state.saveData?.current_route_id || defaultRouteId,
    );
    refreshRouteUi();
    refreshZoneActionButtons();
    if (state.ui.mapOpen) {
      renderMapModal();
    }
    updateHud();
    persistSaveDataForSimulationEvent();
    const unlockedRouteNames = Array.isArray(unlockResult?.route_names_fr) ? unlockResult.route_names_fr : [];
    if (unlockedRouteNames.length > 0) {
      setTopMessage(
        normalizeUiDisplayText(`Nouvelle sortie d\u00e9bloqu\u00e9e : ${unlockedRouteNames.join(", ")}`, {
          frenchTypography: true,
        }),
        2000,
      );
    }
    return {
      changed: true,
      unlockedRouteNames,
    };
  }

  function enterDialogueNode(nodeId) {
    const active = state.dialogue.active;
    const definition = active?.definition;
    const node = getDialogueNodeById(definition, nodeId);
    if (!active || !definition || !node) {
      closeDialogueModal({ force: true });
      return false;
    }
    active.currentNodeId = String(node.node_id || "");
    active.visitedNodeIds = Array.isArray(active.visitedNodeIds) ? active.visitedNodeIds : [];
    active.visitedNodeIds.push(active.currentNodeId);
    commitDialogueSideEffects(node.effects_on_enter);
    renderDialogueModal();
    return true;
  }

  function closeDialogueModal(options = {}) {
    const force = options?.force === true;
    const active = state.dialogue.active;
    if (!force && active?.once) {
      setTopMessage("Ce dialogue est obligatoire.", 1400);
      return false;
    }
    state.ui.dialogueOpen = false;
    state.dialogue.active = null;
    hideDialogueModal();
    clearDialogueUi();
    refreshZoneActionButtons();
    return true;
  }

  function finishActiveDialogue() {
    const active = state.dialogue.active;
    if (!active) {
      return closeDialogueModal({ force: true });
    }
    let changed = false;
    if (active.once) {
      changed = markDialogueSeen(active.dialogueId) || changed;
    }
    const closed = closeDialogueModal({ force: true });
    if (changed) {
      persistSaveDataForSimulationEvent();
    }
    tryOpenPendingDialogue();
    tryOpenPendingTutorialFlow();
    return closed;
  }

  async function openDialogueSession(dialogueId, options = {}) {
    const id = String(dialogueId || "").trim();
    if (!id || !state.saveData) {
      return false;
    }
    const routeId = String(options?.routeId || state.routeData?.route_id || state.saveData.current_route_id || defaultRouteId);
    if (routeId && routeId !== String(state.routeData?.route_id || state.saveData.current_route_id || defaultRouteId)) {
      return false;
    }
    let definition = null;
    try {
      definition = await loadDialogueDefinition(id);
    } catch (error) {
      console.warn(
        `Impossible de charger le dialogue ${id}:`,
        error instanceof Error ? error.message : String(error || ""),
      );
      setTopMessage("Dialogue introuvable ou invalide.", 1700);
      return false;
    }
    if (!definition) {
      return false;
    }
    if (!canOpenDialogueModalNow()) {
      enqueueDialogueRequest({
        dialogueId: id,
        once: options?.once === true,
        routeId,
        source: options?.source,
        sourceActionId: options?.sourceActionId,
      }, { front: options?.source === "arrival_once" });
      return false;
    }

    hideHoverPopup();
    prepareDialogueUi();

    state.dialogue.active = {
      dialogueId: id,
      definition,
      routeId,
      once: options?.once === true,
      source: String(options?.source || "manual"),
      sourceActionId: String(options?.sourceActionId || ""),
      currentNodeId: String(definition.start_node_id || ""),
      visitedNodeIds: [],
    };
    state.ui.dialogueOpen = true;
    showDialogueModal();
    refreshZoneActionButtons();
    return enterDialogueNode(definition.start_node_id);
  }

  function tryOpenPendingDialogue() {
    if (!canOpenDialogueModalNow()) {
      return false;
    }
    while (Array.isArray(state.dialogue.queue) && state.dialogue.queue.length > 0) {
      const next = state.dialogue.queue.shift();
      const nextRouteId = String(next?.routeId || "");
      const currentRouteId = String(state.routeData?.route_id || state.saveData?.current_route_id || defaultRouteId);
      if (nextRouteId && nextRouteId !== currentRouteId) {
        continue;
      }
      void openDialogueSession(next.dialogueId, next);
      return true;
    }
    return false;
  }

  function queueArrivalDialoguesForRoute(routeId) {
    const routeData = getRouteDataById(routeId);
    const dialogueIds = Array.isArray(routeData?.arrival_dialogue_ids_once) ? routeData.arrival_dialogue_ids_once : [];
    let queued = false;
    for (const dialogueId of dialogueIds) {
      const id = String(dialogueId || "").trim();
      if (!id || hasSeenDialogue(id)) {
        continue;
      }
      queued = enqueueDialogueRequest({
        dialogueId: id,
        once: true,
        routeId,
        source: "arrival_once",
      }, { front: true }) || queued;
    }
    if (queued) {
      tryOpenPendingDialogue();
    }
    return queued;
  }

  function triggerZoneAction(actionId) {
    const id = String(actionId || "").trim();
    if (!id) {
      return false;
    }
    const routeId = String(state.routeData?.route_id || state.saveData?.current_route_id || defaultRouteId);
    const zoneAction = getCurrentRouteZoneActions().find((action) => String(action.action_id || "").trim() === id);
    if (!zoneAction) {
      return false;
    }
    const request = {
      dialogueId: String(zoneAction.dialogue_id || "").trim(),
      once: false,
      routeId,
      source: "zone_action",
      sourceActionId: id,
    };
    if (!request.dialogueId) {
      return false;
    }
    if (canOpenDialogueModalNow()) {
      void openDialogueSession(request.dialogueId, request);
      return true;
    }
    return enqueueDialogueRequest(request);
  }

  function advanceActiveDialogue() {
    const active = state.dialogue.active;
    const node = getDialogueNodeById(active?.definition, active?.currentNodeId);
    if (!active || !node) {
      return false;
    }
    if (getAvailableDialogueChoices(node).length > 0) {
      setTopMessage("Choisis une r\u00e9ponse.", 1200);
      return false;
    }
    const nextNodeId = String(node.next_node_id || "").trim();
    if (!nextNodeId) {
      return finishActiveDialogue();
    }
    return enterDialogueNode(nextNodeId);
  }

  function chooseActiveDialogueChoice(choiceId) {
    const active = state.dialogue.active;
    const node = getDialogueNodeById(active?.definition, active?.currentNodeId);
    if (!active || !node) {
      return false;
    }
    const choice = getAvailableDialogueChoices(node)
      .find((entry) => String(entry.choice_id || "").trim() === String(choiceId || "").trim());
    if (!choice) {
      return false;
    }
    commitDialogueSideEffects(choice.effects);
    return enterDialogueNode(choice.next_node_id);
  }

  return Object.freeze({
    advanceActiveDialogue,
    areDialogueFlagRequirementsMet,
    buildDialogueDataPath,
    chooseActiveDialogueChoice,
    closeDialogueModal,
    enqueueDialogueRequest,
    finishActiveDialogue,
    getAvailableDialogueChoices,
    getCurrentRouteZoneActions,
    getDialogueNodeById,
    isDialogueQueuedOrActive,
    loadDialogueDefinition,
    openDialogueSession,
    queueArrivalDialoguesForRoute,
    triggerZoneAction,
    tryOpenPendingDialogue,
  });
}
