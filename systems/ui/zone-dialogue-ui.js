function defaultNormalizeUiDisplayText(value) {
  return String(value || "");
}

function defaultClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createZoneDialogueUi({
  documentRef = globalThis.document,
  HTMLElementRef = globalThis.HTMLElement,
  normalizeUiDisplayText = defaultNormalizeUiDisplayText,
  clamp = defaultClamp,
  getRouteDisplayName = (routeId) => String(routeId || ""),
} = {}) {
  function refreshZoneActionButtons({
    worldUiLayerEl,
    zoneActionButtonsById,
    routeActions = [],
    shouldShowActions = false,
    isPhoneViewport = false,
  } = {}) {
    if (!(worldUiLayerEl instanceof HTMLElementRef)) {
      return;
    }
    const activeActionIds = new Set();
    const visibleActions = shouldShowActions ? routeActions : [];

    for (const action of visibleActions) {
      const actionId = String(action.action_id || "").trim();
      if (!actionId) {
        continue;
      }
      activeActionIds.add(actionId);
      let button = zoneActionButtonsById.get(actionId);
      if (!button) {
        button = documentRef.createElement("button");
        button.type = "button";
        button.className = "zone-action-btn";
        button.dataset.zoneActionId = actionId;
        zoneActionButtonsById.set(actionId, button);
      }
      if (button.parentElement !== worldUiLayerEl) {
        worldUiLayerEl.appendChild(button);
      }
      const anchor = isPhoneViewport ? action.mobile_anchor_pct : action.desktop_anchor_pct;
      const leftPct = clamp(Number(anchor?.x || 50), 3, 97);
      const topPct = clamp(Number(anchor?.y || 50), 4, 96);
      const label = normalizeUiDisplayText(action.label_fr || action.dialogue_id || actionId, {
        frenchTypography: true,
      });
      button.textContent = label;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.style.left = `${leftPct}%`;
      button.style.top = `${topPct}%`;
      button.style.transform = "translate(-50%, -50%)";
      button.hidden = false;
      button.disabled = false;
    }

    for (const [actionId, button] of zoneActionButtonsById.entries()) {
      if (activeActionIds.has(actionId)) {
        continue;
      }
      button.remove();
      zoneActionButtonsById.delete(actionId);
    }
  }

  function clearDialogueUi({ dialogueChoiceListEl, dialogueTextEl } = {}) {
    if (dialogueChoiceListEl) {
      dialogueChoiceListEl.replaceChildren();
    }
    if (dialogueTextEl) {
      dialogueTextEl.textContent = "";
    }
  }

  function renderDialogueModal({
    dialogueModalEl,
    dialogueTitleEl,
    dialogueSpeakerEl,
    dialogueTextEl,
    dialogueChoiceListEl,
    dialogueProgressEl,
    dialogueNextButtonEl,
    dialogueCloseButtonEl,
    active,
    node,
    availableChoices = [],
  } = {}) {
    if (!dialogueModalEl || !active || !node) {
      return;
    }
    const definition = active.definition;
    const nodeCount = Math.max(1, Array.isArray(definition?.nodes) ? definition.nodes.length : 1);
    const visitedCount = Math.max(1, Array.isArray(active.visitedNodeIds) ? active.visitedNodeIds.length : 1);
    const title = normalizeUiDisplayText(
      definition?.title_fr || getRouteDisplayName(active.routeId) || "Dialogue",
      { frenchTypography: true },
    );
    const speaker = normalizeUiDisplayText(node.speaker_fr || "", { frenchTypography: true });
    const text = normalizeUiDisplayText(node.text_fr || "", { frenchTypography: true });

    if (dialogueTitleEl) {
      dialogueTitleEl.textContent = title;
    }
    if (dialogueSpeakerEl) {
      dialogueSpeakerEl.textContent = speaker;
      dialogueSpeakerEl.classList.toggle("hidden", !speaker);
    }
    if (dialogueTextEl) {
      dialogueTextEl.textContent = text;
    }
    if (dialogueProgressEl) {
      dialogueProgressEl.textContent = normalizeUiDisplayText(`\u00c9tape ${visitedCount}/${nodeCount}`, {
        frenchTypography: true,
      });
    }
    if (dialogueChoiceListEl) {
      dialogueChoiceListEl.replaceChildren();
      if (availableChoices.length > 0) {
        for (const choice of availableChoices) {
          const button = documentRef.createElement("button");
          button.type = "button";
          button.className = "dialogue-choice-btn";
          button.dataset.dialogueChoiceId = String(choice.choice_id || "");
          button.textContent = normalizeUiDisplayText(choice.label_fr || choice.choice_id || "", {
            frenchTypography: true,
          });
          dialogueChoiceListEl.appendChild(button);
        }
      } else if (Array.isArray(node.choices) && node.choices.length > 0) {
        const emptyEl = documentRef.createElement("div");
        emptyEl.className = "dialogue-choice-empty";
        emptyEl.textContent = normalizeUiDisplayText("Aucune r\u00e9ponse disponible pour l'instant.", {
          frenchTypography: true,
        });
        dialogueChoiceListEl.appendChild(emptyEl);
      }
    }
    if (dialogueNextButtonEl) {
      const hasBranchChoices = Array.isArray(node.choices) && node.choices.length > 0;
      dialogueNextButtonEl.hidden = hasBranchChoices;
      dialogueNextButtonEl.disabled = hasBranchChoices;
      dialogueNextButtonEl.textContent = node.next_node_id ? "Suivant" : "Terminer";
    }
    if (dialogueCloseButtonEl) {
      dialogueCloseButtonEl.hidden = Boolean(active.once);
      dialogueCloseButtonEl.disabled = Boolean(active.once);
    }
  }

  return Object.freeze({
    clearDialogueUi,
    refreshZoneActionButtons,
    renderDialogueModal,
  });
}
