function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createUiAnimationRuntime({
  clamp,
  state,
  tweenGroup,
  tweenCtor,
  easing,
  loadingScreenEl,
  loadingScreenTextEl,
  loadingScreenDefaultText,
  loadingScreenExitDurationMs,
  uiTweenModalOpen,
  uiTweenModalClose,
  uiTweenPopupOpen,
  uiTweenPopupClose,
  floatingTextLifetimeMs,
  floatingTextEnterTweenMs,
  floatingTextExitTweenMs,
  floatingTextToneNormal,
  projectileTweenDurationMinMs,
  projectileTweenDurationMaxMs,
  getFloatingTextToneVisualStyle,
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const TweenCtor = typeof tweenCtor === "function" ? tweenCtor : null;
  const Easing = easing || {};
  const uiAnimationStateByElement = new WeakMap();
  let loadingScreenHideTimerId = 0;

  function getUiAnimationState(element) {
    if (!element) {
      return null;
    }
    let stateEntry = uiAnimationStateByElement.get(element);
    if (!stateEntry) {
      stateEntry = {
        token: 0,
        tweens: [],
        phase: element.classList.contains("hidden") ? "hidden" : "visible",
      };
      uiAnimationStateByElement.set(element, stateEntry);
    }
    return stateEntry;
  }

  function stopUiElementTweens(element) {
    const stateEntry = getUiAnimationState(element);
    if (!stateEntry) {
      return 0;
    }
    for (const tween of stateEntry.tweens) {
      tween.stop();
    }
    stateEntry.tweens = [];
    stateEntry.token += 1;
    return stateEntry.token;
  }

  function composeUiTransform(values) {
    const x = Number(values?.x || 0);
    const y = Number(values?.y || 0);
    const scale = Number(values?.scale ?? 1);
    const transforms = [];
    if (Math.abs(x) > 0.001 || Math.abs(y) > 0.001) {
      transforms.push(`translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`);
    }
    if (Math.abs(scale - 1) > 0.0005) {
      transforms.push(`scale(${scale.toFixed(4)})`);
    }
    return transforms.join(" ");
  }

  function applyUiTweenStyles(element, values) {
    if (!element) {
      return;
    }
    const opacity = safeClamp(Number(values?.opacity ?? 1), 0, 1);
    element.style.opacity = String(opacity);
    const transform = composeUiTransform(values);
    element.style.transform = transform;
    const blur = Math.max(0, Number(values?.blur || 0));
    element.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "";
  }

  function clearUiTweenStyles(element) {
    if (!element) {
      return;
    }
    element.style.opacity = "";
    element.style.transform = "";
    element.style.filter = "";
    element.style.pointerEvents = "";
  }

  function clearLoadingScreenHideTimer() {
    if (loadingScreenHideTimerId) {
      window.clearTimeout(loadingScreenHideTimerId);
      loadingScreenHideTimerId = 0;
    }
  }

  function setLoadingScreenMessage(message = loadingScreenDefaultText) {
    if (!loadingScreenTextEl) {
      return;
    }
    const normalized = String(message || "").trim() || loadingScreenDefaultText;
    loadingScreenTextEl.textContent = normalized;
  }

  function showLoadingScreen(message = loadingScreenDefaultText) {
    if (!loadingScreenEl) {
      return;
    }
    clearLoadingScreenHideTimer();
    setLoadingScreenMessage(message);
    loadingScreenEl.classList.remove("is-hidden", "is-exiting");
    loadingScreenEl.classList.add("is-visible");
  }

  function hideLoadingScreen(options = {}) {
    if (!loadingScreenEl) {
      return;
    }
    const immediate = options?.immediate === true;
    clearLoadingScreenHideTimer();
    if (immediate) {
      loadingScreenEl.classList.remove("is-visible", "is-exiting");
      loadingScreenEl.classList.add("is-hidden");
      return;
    }
    if (loadingScreenEl.classList.contains("is-hidden") || loadingScreenEl.classList.contains("is-exiting")) {
      return;
    }
    loadingScreenEl.classList.remove("is-visible");
    loadingScreenEl.classList.add("is-exiting");
    loadingScreenHideTimerId = window.setTimeout(() => {
      loadingScreenHideTimerId = 0;
      loadingScreenEl.classList.remove("is-exiting");
      loadingScreenEl.classList.add("is-hidden");
    }, loadingScreenExitDurationMs);
  }

  function parseUiTweenTransformValue(transformText) {
    const source = String(transformText || "");
    const translateMatch = source.match(/translate3d\(\s*[-\d.]+px,\s*([-\d.]+)px,\s*0\s*\)/i);
    const scaleMatch = source.match(/scale\(\s*([-\d.]+)\s*\)/i);
    return {
      y: translateMatch ? Number.parseFloat(translateMatch[1]) || 0 : 0,
      scale: scaleMatch ? Number.parseFloat(scaleMatch[1]) || 1 : 1,
    };
  }

  function parseUiTweenFilterBlurValue(filterText) {
    const source = String(filterText || "");
    const blurMatch = source.match(/blur\(\s*([-\d.]+)px\s*\)/i);
    return blurMatch ? Math.max(0, Number.parseFloat(blurMatch[1]) || 0) : 0;
  }

  function getCurrentUiTweenValues(element, fallback = {}) {
    const transformData = parseUiTweenTransformValue(element?.style?.transform || "");
    const opacityRaw = Number.parseFloat(String(element?.style?.opacity ?? ""));
    return {
      opacity: Number.isFinite(opacityRaw) ? safeClamp(opacityRaw, 0, 1) : Number(fallback?.opacity ?? 1),
      x: Number(fallback?.x || 0),
      y: Number.isFinite(transformData.y) ? transformData.y : Number(fallback?.y || 0),
      scale: Number.isFinite(transformData.scale) ? transformData.scale : Number(fallback?.scale ?? 1),
      blur: parseUiTweenFilterBlurValue(element?.style?.filter || ""),
    };
  }

  function animateUiElement(element, fromValues, toValues, durationMs, easingFn, onComplete) {
    if (!element || !TweenCtor) {
      return;
    }
    const stateEntry = getUiAnimationState(element);
    if (!stateEntry) {
      return;
    }
    const animationToken = stateEntry.token;
    const from = {
      opacity: Number(fromValues?.opacity ?? 1),
      x: Number(fromValues?.x || 0),
      y: Number(fromValues?.y || 0),
      scale: Number(fromValues?.scale ?? 1),
      blur: Number(fromValues?.blur || 0),
    };
    const to = {
      opacity: Number(toValues?.opacity ?? from.opacity),
      x: Number(toValues?.x ?? from.x),
      y: Number(toValues?.y ?? from.y),
      scale: Number(toValues?.scale ?? from.scale),
      blur: Number(toValues?.blur ?? from.blur),
    };
    applyUiTweenStyles(element, from);
    const tween = new TweenCtor(from, tweenGroup)
      .to(to, Math.max(1, Math.round(Number(durationMs) || 1)))
      .easing(easingFn || Easing.Cubic.Out)
      .onUpdate((values) => {
        applyUiTweenStyles(element, values);
      })
      .onComplete(() => {
        if (!stateEntry || stateEntry.token !== animationToken) {
          return;
        }
        if (typeof onComplete === "function") {
          onComplete();
        }
      })
      .start(state.timeMs);
    stateEntry.tweens.push(tween);
  }

  function resolveModalPanelElement(modalEl) {
    if (!modalEl) {
      return null;
    }
    return modalEl.firstElementChild instanceof HTMLElement ? modalEl.firstElementChild : null;
  }

  function showModalWithTween(modalEl) {
    if (!modalEl) {
      return;
    }
    stopUiElementTweens(modalEl);
    const panelEl = resolveModalPanelElement(modalEl);
    if (panelEl) {
      stopUiElementTweens(panelEl);
    }

    modalEl.classList.remove("hidden");
    modalEl.style.pointerEvents = "";
    animateUiElement(
      modalEl,
      { opacity: 0 },
      { opacity: 1 },
      uiTweenModalOpen.overlayDurationMs,
      Easing.Cubic.Out,
      () => {
        clearUiTweenStyles(modalEl);
      },
    );

    if (panelEl) {
      panelEl.style.pointerEvents = "";
      animateUiElement(
        panelEl,
        {
          opacity: 0,
          y: uiTweenModalOpen.panelOffsetY,
          scale: uiTweenModalOpen.panelStartScale,
          blur: uiTweenModalOpen.panelStartBlur,
        },
        { opacity: 1, y: 0, scale: 1, blur: 0 },
        uiTweenModalOpen.panelDurationMs,
        Easing.Back.Out,
        () => {
          clearUiTweenStyles(panelEl);
        },
      );
    }
  }

  function hideModalWithTween(modalEl) {
    if (!modalEl || modalEl.classList.contains("hidden")) {
      return;
    }
    stopUiElementTweens(modalEl);
    const panelEl = resolveModalPanelElement(modalEl);
    if (panelEl) {
      stopUiElementTweens(panelEl);
    }
    const modalState = getUiAnimationState(modalEl);
    const modalToken = modalState ? modalState.token : 0;
    modalEl.style.pointerEvents = "none";
    if (panelEl) {
      panelEl.style.pointerEvents = "none";
    }

    animateUiElement(
      modalEl,
      { opacity: 1 },
      { opacity: 0 },
      uiTweenModalClose.overlayDurationMs,
      Easing.Quadratic.Out,
      () => {
        modalEl.classList.add("hidden");
        clearUiTweenStyles(modalEl);
      },
    );

    if (panelEl) {
      animateUiElement(
        panelEl,
        { opacity: 1, y: 0, scale: 1, blur: 0 },
        {
          opacity: 0,
          y: uiTweenModalClose.panelOffsetY,
          scale: uiTweenModalClose.panelEndScale,
          blur: uiTweenModalClose.panelEndBlur,
        },
        uiTweenModalClose.panelDurationMs,
        Easing.Quadratic.Out,
        () => {
          clearUiTweenStyles(panelEl);
        },
      );

      window.setTimeout(() => {
        const latestState = getUiAnimationState(modalEl);
        if (!latestState || latestState.token !== modalToken) {
          return;
        }
        modalEl.classList.add("hidden");
        clearUiTweenStyles(modalEl);
        if (panelEl) {
          clearUiTweenStyles(panelEl);
        }
      }, uiTweenModalClose.panelDurationMs + 40);
    }
  }

  function showPopupWithTween(element) {
    if (!element) {
      return;
    }
    const stateEntry = getUiAnimationState(element);
    const isHidden = element.classList.contains("hidden");
    if (stateEntry && !isHidden && stateEntry.phase !== "hiding") {
      stateEntry.phase = "visible";
      clearUiTweenStyles(element);
      return;
    }
    stopUiElementTweens(element);
    if (stateEntry) {
      stateEntry.phase = "showing";
    }
    element.classList.remove("hidden");
    element.style.pointerEvents = "";
    const fromValues = getCurrentUiTweenValues(element, {
      opacity: 0,
      y: uiTweenPopupOpen.offsetY,
      scale: uiTweenPopupOpen.startScale,
    });
    animateUiElement(
      element,
      {
        opacity: isHidden ? 0 : fromValues.opacity,
        y: isHidden ? uiTweenPopupOpen.offsetY : fromValues.y,
        scale: isHidden ? uiTweenPopupOpen.startScale : fromValues.scale,
        blur: isHidden ? uiTweenPopupOpen.startBlur : fromValues.blur,
      },
      { opacity: 1, y: 0, scale: 1, blur: 0 },
      uiTweenPopupOpen.durationMs,
      Easing.Cubic.Out,
      () => {
        const latestState = getUiAnimationState(element);
        if (latestState) {
          latestState.phase = "visible";
        }
        clearUiTweenStyles(element);
      },
    );
  }

  function hidePopupWithTween(element) {
    if (!element) {
      return;
    }
    const stateEntry = getUiAnimationState(element);
    if (element.classList.contains("hidden")) {
      if (stateEntry) {
        stateEntry.phase = "hidden";
      }
      return;
    }
    if (stateEntry && stateEntry.phase === "hiding") {
      return;
    }
    stopUiElementTweens(element);
    if (stateEntry) {
      stateEntry.phase = "hiding";
    }
    const elementState = getUiAnimationState(element);
    const elementToken = elementState ? elementState.token : 0;
    element.style.pointerEvents = "none";
    const fromValues = getCurrentUiTweenValues(element, {
      opacity: 1,
      y: 0,
      scale: 1,
    });
    animateUiElement(
      element,
      { opacity: fromValues.opacity, y: fromValues.y, scale: fromValues.scale, blur: fromValues.blur },
      {
        opacity: 0,
        y: uiTweenPopupClose.offsetY,
        scale: uiTweenPopupClose.endScale,
        blur: uiTweenPopupClose.endBlur,
      },
      uiTweenPopupClose.durationMs,
      Easing.Quadratic.Out,
      () => {
        const latestState = getUiAnimationState(element);
        if (latestState) {
          latestState.phase = "hidden";
        }
        element.classList.add("hidden");
        clearUiTweenStyles(element);
      },
    );

    window.setTimeout(() => {
      const latestState = getUiAnimationState(element);
      if (!latestState || latestState.token !== elementToken) {
        return;
      }
      latestState.phase = "hidden";
      element.classList.add("hidden");
      clearUiTweenStyles(element);
    }, uiTweenPopupClose.durationMs + 32);
  }

  function showTooltipWithTween(element) {
    if (!element) {
      return;
    }
    const stateEntry = getUiAnimationState(element);
    const isHidden = element.classList.contains("hidden");
    const isHiding = stateEntry?.phase === "hiding";
    if (!isHidden && !isHiding) {
      if (stateEntry) {
        stateEntry.phase = "visible";
      }
      clearUiTweenStyles(element);
      return;
    }
    showPopupWithTween(element);
  }

  function createFloatingTextVisualTween(maxLifeMs = floatingTextLifetimeMs, options = {}) {
    const safeLifetimeMs = Math.max(140, Number(maxLifeMs) || floatingTextLifetimeMs);
    const tone = String(options.tone || floatingTextToneNormal);
    const style = getFloatingTextToneVisualStyle(tone);
    const scaleBoost = safeClamp(Number(options.scaleBoost) || 0, 0, 0.68);
    const intensityBoost = safeClamp(Number(options.intensityBoost) || 0, 0, 0.8);
    const enterDurationMs = safeClamp(
      Math.round((Number(style.enterDurationMs) || floatingTextEnterTweenMs) * (1 - scaleBoost * 0.18)),
      70,
      300,
    );
    const settleDurationMs = safeClamp(
      Math.round((Number(style.settleDurationMs) || 140) * (1 - intensityBoost * 0.12)),
      90,
      320,
    );
    const baseExitDurationMs = safeClamp(
      Math.round((Number(style.exitDurationMs) || floatingTextExitTweenMs) * (1 + intensityBoost * 0.12)),
      140,
      420,
    );
    const fadeOutDurationMs = Math.min(
      baseExitDurationMs,
      Math.max(120, Math.round(safeLifetimeMs * (Number(style.exitLifeRatio) || 0.45))),
    );
    const fadeOutDelayMs = Math.max(0, safeLifetimeMs - fadeOutDurationMs);
    const startScale = Math.max(0.56, Number(style.startScale) + scaleBoost * 0.12);
    const peakScale = Math.max(startScale + 0.04, Number(style.peakScale) + scaleBoost * 0.34 + intensityBoost * 0.08);
    const settleScale = Math.max(0.74, Number(style.settleScale) + scaleBoost * 0.2 + intensityBoost * 0.04);
    const exitScale = Math.max(0.68, Number(style.exitScale) + scaleBoost * 0.11);
    const visual = { alpha: 0, scale: startScale, pulse: 0 };
    const tweenIn = new TweenCtor(visual, tweenGroup)
      .to({ alpha: 1, scale: peakScale, pulse: 1 }, enterDurationMs)
      .easing(style.enterEasing || Easing.Back.Out)
      .start(state.timeMs);
    const tweenSettle = new TweenCtor(visual, tweenGroup)
      .to({ scale: settleScale, pulse: 0.2 }, settleDurationMs)
      .delay(Math.max(0, enterDurationMs - 12))
      .easing(style.settleEasing || Easing.Cubic.Out)
      .start(state.timeMs);
    const tweenOut = new TweenCtor(visual, tweenGroup)
      .to({ alpha: 0, scale: exitScale, pulse: 0 }, fadeOutDurationMs)
      .delay(fadeOutDelayMs)
      .easing(style.exitEasing || Easing.Quadratic.In)
      .start(state.timeMs);
    return { visual, tweenIn, tweenSettle, tweenOut };
  }

  function stopFloatingTextVisualTween(text) {
    if (!text || !text.visualTween) {
      return;
    }
    text.visualTween.tweenIn?.stop();
    text.visualTween.tweenSettle?.stop();
    text.visualTween.tweenOut?.stop();
  }

  function stopProjectileTravelTween(projectile) {
    if (!projectile) {
      return;
    }
    if (projectile.travelTween && typeof projectile.travelTween.stop === "function") {
      projectile.travelTween.stop();
    }
    projectile.travelTween = null;
    projectile.travelTweenState = null;
    projectile.travelTweenCompleted = false;
  }

  function stopTweenIfRunning(tween) {
    if (tween && typeof tween.stop === "function") {
      tween.stop();
    }
  }

  function createProjectileTravelTween(projectile, durationMs) {
    if (!projectile || !TweenCtor) {
      return null;
    }
    const safeDurationMs = safeClamp(
      Math.round(Number(durationMs) || projectileTweenDurationMinMs),
      projectileTweenDurationMinMs,
      projectileTweenDurationMaxMs,
    );
    const tweenState = { progress: 0 };
    projectile.travelTweenState = tweenState;
    projectile.travelTweenCompleted = false;
    const tween = new TweenCtor(tweenState, tweenGroup)
      .to({ progress: 1 }, safeDurationMs)
      .easing(Easing.Cubic.In)
      .onComplete(() => {
        if (projectile.travelTweenState === tweenState) {
          projectile.travelTweenCompleted = true;
        }
      })
      .start(state.timeMs);
    projectile.travelTween = tween;
    return tween;
  }

  return {
    getUiAnimationState,
    stopUiElementTweens,
    composeUiTransform,
    applyUiTweenStyles,
    clearUiTweenStyles,
    clearLoadingScreenHideTimer,
    setLoadingScreenMessage,
    showLoadingScreen,
    hideLoadingScreen,
    parseUiTweenTransformValue,
    parseUiTweenFilterBlurValue,
    getCurrentUiTweenValues,
    animateUiElement,
    resolveModalPanelElement,
    showModalWithTween,
    hideModalWithTween,
    showPopupWithTween,
    hidePopupWithTween,
    showTooltipWithTween,
    createFloatingTextVisualTween,
    stopFloatingTextVisualTween,
    stopProjectileTravelTween,
    stopTweenIfRunning,
    createProjectileTravelTween,
  };
}
