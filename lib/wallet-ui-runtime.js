function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createWalletUiRuntime({
  formatCompactNumber,
  toSafeInt,
  clamp,
  randomRange,
  shouldRenderCelebrationParticles,
  shouldUseCanvasRuntimeShellLayout,
  state,
  moneyPillEl,
  moneyValueEl,
  coinsValueEl,
  moneyAnimLayerEl,
  topbarBallsPillEl,
  topbarBallPokeItemEl,
  topbarBallSuperItemEl,
  topbarBallHyperItemEl,
  topbarBallPokeCountEl,
  topbarBallSuperCountEl,
  topbarBallHyperCountEl,
  shopWalletMoneyValueEl,
  shopWalletPokeballsValueEl,
  shopWalletQtyValueEl,
  shopWalletQtyItemEl,
  shopTabPokeballs,
  getSelectedShopBallQuantitySummaryLabel,
  moneyCounterPulseMs,
  moneyCounterLerpMs,
} = {}) {
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const usesCanvasRuntimeShellLayout =
    typeof shouldUseCanvasRuntimeShellLayout === "function" ? shouldUseCanvasRuntimeShellLayout : () => false;

  function getMoneyAnimationLayer() {
    if (usesCanvasRuntimeShellLayout()) {
      return null;
    }
    if (moneyAnimLayerEl) {
      return moneyAnimLayerEl;
    }
    if (!moneyPillEl) {
      return null;
    }
    const existing = moneyPillEl.querySelector(".money-anim-layer");
    if (existing instanceof HTMLElement) {
      return existing;
    }
    const layer = document.createElement("span");
    layer.className = "money-anim-layer";
    layer.setAttribute("aria-hidden", "true");
    moneyPillEl.appendChild(layer);
    return layer;
  }

  function setMoneyCounterTextValue(value) {
    if (usesCanvasRuntimeShellLayout()) {
      return;
    }
    if (!moneyValueEl) {
      return;
    }
    const nextText = formatCompactNumber(Math.max(0, safeToInt(value, 0)), {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    });
    if (moneyValueEl.textContent !== nextText) {
      moneyValueEl.textContent = nextText;
    }
  }

  function setCoinsCounterTextValue(value) {
    if (usesCanvasRuntimeShellLayout()) {
      return;
    }
    if (!coinsValueEl) {
      return;
    }
    const nextText = formatCompactNumber(Math.max(0, safeToInt(value, 0)), {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    });
    if (coinsValueEl.textContent !== nextText) {
      coinsValueEl.textContent = nextText;
    }
  }

  function formatPokeDollarValue(value) {
    return Math.max(0, safeToInt(value, 0)).toLocaleString("fr-FR");
  }

  function refreshTopbarBallSummary(saveData = state.saveData) {
    if (usesCanvasRuntimeShellLayout()) {
      return;
    }
    const hasTopbarBallSummary = Boolean(
      topbarBallsPillEl
      || topbarBallPokeCountEl
      || topbarBallSuperCountEl
      || topbarBallHyperCountEl,
    );
    if (!hasTopbarBallSummary) {
      return;
    }

    const refsByType = [
      {
        type: "poke_ball",
        label: "Pok\u00e9 Ball",
        itemEl: topbarBallPokeItemEl,
        countEl: topbarBallPokeCountEl,
      },
      {
        type: "super_ball",
        label: "Super Ball",
        itemEl: topbarBallSuperItemEl,
        countEl: topbarBallSuperCountEl,
      },
      {
        type: "hyper_ball",
        label: "Hyper Ball",
        itemEl: topbarBallHyperItemEl,
        countEl: topbarBallHyperCountEl,
      },
    ];

    const activeBallType = String(saveData?.active_ball_type || "").toLowerCase().trim();
    const ariaChunks = [];
    for (const ref of refsByType) {
      const count = Math.max(0, safeToInt(saveData?.ball_inventory?.[ref.type], 0));
      if (ref.countEl) {
        ref.countEl.textContent = formatCompactNumber(count, {
          decimalsSmall: 2,
          decimalsMedium: 1,
          decimalsLarge: 0,
        });
      }
      if (ref.itemEl) {
        ref.itemEl.classList.toggle("is-active", activeBallType === ref.type);
      }
      ariaChunks.push(`${ref.label} ${count}`);
    }

    if (topbarBallsPillEl) {
      topbarBallsPillEl.setAttribute("aria-label", `R\u00e9glages de capture. ${ariaChunks.join(", ")}`);
    }
  }

  function refreshShopWalletPanel(activeTab = shopTabPokeballs) {
    const hasWalletUi = Boolean(
      topbarBallsPillEl
      || topbarBallPokeCountEl
      || topbarBallSuperCountEl
      || topbarBallHyperCountEl
      || shopWalletMoneyValueEl
      || shopWalletPokeballsValueEl
      || shopWalletQtyValueEl,
    );
    if (!hasWalletUi) {
      return;
    }
    const saveData = state.saveData;
    if (!saveData) {
      refreshTopbarBallSummary(null);
      if (shopWalletMoneyValueEl) {
        shopWalletMoneyValueEl.textContent = "0 Poke$";
      }
      if (shopWalletPokeballsValueEl) {
        shopWalletPokeballsValueEl.textContent = "0";
      }
      if (shopWalletQtyValueEl) {
        shopWalletQtyValueEl.textContent = "x1";
      }
      if (shopWalletQtyItemEl) {
        shopWalletQtyItemEl.classList.add("hidden");
      }
      return;
    }

    const money = Math.max(0, safeToInt(saveData.money, 0));
    const pokeballs = Math.max(0, safeToInt(saveData.pokeballs, 0));
    refreshTopbarBallSummary(saveData);
    if (shopWalletMoneyValueEl) {
      shopWalletMoneyValueEl.textContent = `${formatPokeDollarValue(money)} Poke$`;
    }
    if (shopWalletPokeballsValueEl) {
      shopWalletPokeballsValueEl.textContent = String(pokeballs);
    }
    if (shopWalletQtyValueEl) {
      shopWalletQtyValueEl.textContent = getSelectedShopBallQuantitySummaryLabel();
    }
    if (shopWalletQtyItemEl) {
      shopWalletQtyItemEl.classList.toggle("hidden", String(activeTab || "") !== shopTabPokeballs);
    }
  }

  function spawnMoneyGainFloater(amount) {
    const gain = Math.max(0, safeToInt(amount, 0));
    if (gain <= 0 || !shouldRenderCelebrationParticles() || usesCanvasRuntimeShellLayout()) {
      return;
    }
    const layer = getMoneyAnimationLayer();
    if (!layer) {
      return;
    }
    const floater = document.createElement("span");
    floater.className = "money-gain-floater";
    floater.textContent = "+" + formatCompactNumber(gain, {
      decimalsSmall: 2,
      decimalsMedium: 1,
      decimalsLarge: 0,
    });
    const jitter = randomRange(-14, 14);
    floater.style.setProperty("--money-float-x", `${Math.round(jitter)}px`);
    floater.addEventListener("animationend", () => {
      floater.remove();
    });
    layer.appendChild(floater);
  }

  function clearMoneyGainFloaters() {
    if (usesCanvasRuntimeShellLayout()) {
      return;
    }
    const layer = getMoneyAnimationLayer();
    if (!layer) {
      return;
    }
    layer.innerHTML = "";
  }

  function refreshMoneyCounterTransform() {
    if (usesCanvasRuntimeShellLayout()) {
      return;
    }
    if (!moneyValueEl) {
      return;
    }
    const pulseMs = Math.max(0, Number(state.moneyHud.pulseMs) || 0);
    if (pulseMs <= 0) {
      moneyValueEl.style.transform = "";
      moneyValueEl.style.filter = "";
      moneyValueEl.style.textShadow = "";
      return;
    }
    const ratio = safeClamp(pulseMs / moneyCounterPulseMs, 0, 1);
    const pulse = Math.sin((1 - ratio) * Math.PI);
    const scale = 1 + pulse * 0.18;
    moneyValueEl.style.transform = `scale(${scale.toFixed(3)})`;
  }

  function updateMoneyHudAnimation(deltaMs) {
    if (!state.saveData) {
      state.moneyHud.initialized = false;
      state.moneyHud.targetValue = 0;
      state.moneyHud.displayValue = 0;
      state.moneyHud.lastRawValue = 0;
      state.moneyHud.pulseMs = 0;
      setMoneyCounterTextValue(0);
      clearMoneyGainFloaters();
      refreshMoneyCounterTransform();
      return;
    }
    if (!moneyValueEl) {
      return;
    }

    const target = Math.max(0, safeToInt(state.moneyHud.targetValue, state.saveData.money));
    if (!state.moneyHud.initialized) {
      state.moneyHud.initialized = true;
      state.moneyHud.displayValue = target;
      state.moneyHud.lastRawValue = target;
      setMoneyCounterTextValue(target);
      refreshMoneyCounterTransform();
      return;
    }

    const current = Number(state.moneyHud.displayValue) || 0;
    const diff = target - current;
    if (Math.abs(diff) <= 0.5) {
      state.moneyHud.displayValue = target;
    } else {
      const smoothing = 1 - Math.exp(-Math.max(0.0001, Number(deltaMs) || 0) / moneyCounterLerpMs);
      state.moneyHud.displayValue = current + diff * smoothing;
    }

    setMoneyCounterTextValue(Math.round(state.moneyHud.displayValue));
    state.moneyHud.pulseMs = Math.max(0, state.moneyHud.pulseMs - Math.max(0, Number(deltaMs) || 0));
    refreshMoneyCounterTransform();
  }

  return {
    getMoneyAnimationLayer,
    setMoneyCounterTextValue,
    setCoinsCounterTextValue,
    formatPokeDollarValue,
    refreshTopbarBallSummary,
    refreshShopWalletPanel,
    spawnMoneyGainFloater,
    clearMoneyGainFloaters,
    refreshMoneyCounterTransform,
    updateMoneyHudAnimation,
  };
}
