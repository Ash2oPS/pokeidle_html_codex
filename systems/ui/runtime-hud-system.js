function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

export function createRuntimeHudSystem({
  state,
  ensureMoneyAndItems,
  toSafeInt,
  setMoneyCounterTextValue,
  setCoinsCounterTextValue,
  refreshMoneyCounterTransform,
  refreshShopWalletPanel,
  updateSaveBackendIndicator,
  refreshRouteUi,
  renderGachaModal,
  renderDevLayoutPanel,
  spawnMoneyGainFloater,
  moneyCounterPulseMs,
  shopTabPokeballs,
  nowMs,
} = {}) {
  const ensureMoneyAndItemsFn = typeof ensureMoneyAndItems === "function" ? ensureMoneyAndItems : () => {};
  const toSafeIntFn = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;
  const setMoneyCounterTextValueFn =
    typeof setMoneyCounterTextValue === "function" ? setMoneyCounterTextValue : () => {};
  const setCoinsCounterTextValueFn =
    typeof setCoinsCounterTextValue === "function" ? setCoinsCounterTextValue : () => {};
  const refreshMoneyCounterTransformFn =
    typeof refreshMoneyCounterTransform === "function" ? refreshMoneyCounterTransform : () => {};
  const refreshShopWalletPanelFn =
    typeof refreshShopWalletPanel === "function" ? refreshShopWalletPanel : () => {};
  const updateSaveBackendIndicatorFn =
    typeof updateSaveBackendIndicator === "function" ? updateSaveBackendIndicator : () => {};
  const refreshRouteUiFn = typeof refreshRouteUi === "function" ? refreshRouteUi : () => {};
  const renderGachaModalFn = typeof renderGachaModal === "function" ? renderGachaModal : () => {};
  const renderDevLayoutPanelFn = typeof renderDevLayoutPanel === "function" ? renderDevLayoutPanel : () => {};
  const spawnMoneyGainFloaterFn = typeof spawnMoneyGainFloater === "function" ? spawnMoneyGainFloater : () => {};
  const moneyCounterPulseMsValue = Math.max(0, toSafeIntFn(moneyCounterPulseMs, 0));
  const shopTabPokeballsValue = String(shopTabPokeballs || "pokeballs");
  const nowMsFn = typeof nowMs === "function" ? nowMs : () => Date.now();

  function updateHud() {
    const currentNowMs = nowMsFn();
    if (!state.saveData) {
      state.moneyHud.initialized = false;
      state.moneyHud.targetValue = 0;
      state.moneyHud.displayValue = 0;
      state.moneyHud.lastRawValue = 0;
      state.moneyHud.pulseMs = 0;
      setMoneyCounterTextValueFn(0);
      setCoinsCounterTextValueFn(0);
      refreshMoneyCounterTransformFn();
      refreshShopWalletPanelFn(state.ui.shopTab || shopTabPokeballsValue);
      updateSaveBackendIndicatorFn();
      refreshRouteUiFn();
      renderGachaModalFn();
      renderDevLayoutPanelFn();
      state.lastHudAutoUpdateMs = currentNowMs;
      return;
    }

    ensureMoneyAndItemsFn();
    const rawMoney = Math.max(0, toSafeIntFn(state.saveData.money, 0));
    if (!state.moneyHud.initialized) {
      state.moneyHud.initialized = true;
      state.moneyHud.targetValue = rawMoney;
      state.moneyHud.displayValue = rawMoney;
      state.moneyHud.lastRawValue = rawMoney;
      setMoneyCounterTextValueFn(rawMoney);
      refreshMoneyCounterTransformFn();
    } else {
      const previousRaw = Math.max(0, toSafeIntFn(state.moneyHud.lastRawValue, rawMoney));
      state.moneyHud.targetValue = rawMoney;
      if (rawMoney > previousRaw) {
        spawnMoneyGainFloaterFn(rawMoney - previousRaw);
        state.moneyHud.pulseMs = moneyCounterPulseMsValue;
      }
      state.moneyHud.lastRawValue = rawMoney;
    }
    setCoinsCounterTextValueFn(Math.max(0, toSafeIntFn(state.saveData.coins, 0)));
    refreshShopWalletPanelFn(state.ui.shopTab || shopTabPokeballsValue);
    updateSaveBackendIndicatorFn();
    refreshRouteUiFn();
    renderGachaModalFn();
    renderDevLayoutPanelFn();
    state.lastHudAutoUpdateMs = currentNowMs;
  }

  return {
    updateHud,
  };
}
