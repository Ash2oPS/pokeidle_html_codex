import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { createWalletUiRuntime } from "../lib/wallet-ui-runtime.js";

function createFixture() {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <div id="money-pill"><span class="money-anim-layer"></span></div>
        <span id="money-value"></span>
        <span id="coins-value"></span>
        <button id="topbar-balls-pill" type="button"></button>
        <span id="topbar-ball-poke-item"></span>
        <span id="topbar-ball-super-item"></span>
        <span id="topbar-ball-hyper-item"></span>
        <span id="topbar-ball-poke-count"></span>
        <span id="topbar-ball-super-count"></span>
        <span id="topbar-ball-hyper-count"></span>
        <span id="shop-wallet-money-value"></span>
        <span id="shop-wallet-pokeballs-value"></span>
        <div id="shop-wallet-qty-item"></div>
        <span id="shop-wallet-qty-value"></span>
      </body>
    </html>
  `);
  const document = dom.window.document;
  const state = {
    saveData: null,
    moneyHud: {
      initialized: false,
      pulseMs: 0,
      targetValue: 0,
      displayValue: 0,
      lastRawValue: 0,
    },
  };

  const runtime = createWalletUiRuntime({
    formatCompactNumber: (value) => String(value),
    toSafeInt: (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
    },
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    randomRange: () => 0,
    shouldRenderCelebrationParticles: () => false,
    state,
    moneyPillEl: document.getElementById("money-pill"),
    moneyValueEl: document.getElementById("money-value"),
    coinsValueEl: document.getElementById("coins-value"),
    moneyAnimLayerEl: document.querySelector(".money-anim-layer"),
    topbarBallsPillEl: document.getElementById("topbar-balls-pill"),
    topbarBallPokeItemEl: document.getElementById("topbar-ball-poke-item"),
    topbarBallSuperItemEl: document.getElementById("topbar-ball-super-item"),
    topbarBallHyperItemEl: document.getElementById("topbar-ball-hyper-item"),
    topbarBallPokeCountEl: document.getElementById("topbar-ball-poke-count"),
    topbarBallSuperCountEl: document.getElementById("topbar-ball-super-count"),
    topbarBallHyperCountEl: document.getElementById("topbar-ball-hyper-count"),
    shopWalletMoneyValueEl: document.getElementById("shop-wallet-money-value"),
    shopWalletPokeballsValueEl: document.getElementById("shop-wallet-pokeballs-value"),
    shopWalletQtyValueEl: document.getElementById("shop-wallet-qty-value"),
    shopWalletQtyItemEl: document.getElementById("shop-wallet-qty-item"),
    shopTabPokeballs: "pokeballs",
    getSelectedShopBallQuantitySummaryLabel: () => "x10",
    moneyCounterPulseMs: 280,
    moneyCounterLerpMs: 120,
  });

  return {
    state,
    runtime,
    refs: {
      topbarBallsPillEl: document.getElementById("topbar-balls-pill"),
      topbarBallPokeItemEl: document.getElementById("topbar-ball-poke-item"),
      topbarBallSuperItemEl: document.getElementById("topbar-ball-super-item"),
      topbarBallHyperItemEl: document.getElementById("topbar-ball-hyper-item"),
      topbarBallPokeCountEl: document.getElementById("topbar-ball-poke-count"),
      topbarBallSuperCountEl: document.getElementById("topbar-ball-super-count"),
      topbarBallHyperCountEl: document.getElementById("topbar-ball-hyper-count"),
      shopWalletMoneyValueEl: document.getElementById("shop-wallet-money-value"),
      shopWalletPokeballsValueEl: document.getElementById("shop-wallet-pokeballs-value"),
      shopWalletQtyItemEl: document.getElementById("shop-wallet-qty-item"),
      shopWalletQtyValueEl: document.getElementById("shop-wallet-qty-value"),
    },
  };
}

test("refreshShopWalletPanel resets topbar ball summary when no save is loaded", () => {
  const fixture = createFixture();

  fixture.runtime.refreshShopWalletPanel();

  assert.equal(fixture.refs.topbarBallPokeCountEl?.textContent, "0");
  assert.equal(fixture.refs.topbarBallSuperCountEl?.textContent, "0");
  assert.equal(fixture.refs.topbarBallHyperCountEl?.textContent, "0");
  assert.equal(fixture.refs.topbarBallPokeItemEl?.classList.contains("is-active"), false);
  assert.equal(fixture.refs.topbarBallsPillEl?.getAttribute("aria-label"), "R\u00e9glages de capture. Pok\u00e9 Ball 0, Super Ball 0, Hyper Ball 0");
  assert.equal(fixture.refs.shopWalletMoneyValueEl?.textContent, "0 Poke$");
  assert.equal(fixture.refs.shopWalletPokeballsValueEl?.textContent, "0");
  assert.equal(fixture.refs.shopWalletQtyValueEl?.textContent, "x1");
  assert.equal(fixture.refs.shopWalletQtyItemEl?.classList.contains("hidden"), true);
});

test("refreshShopWalletPanel mirrors per-ball counts into the mobile topbar pill", () => {
  const fixture = createFixture();
  fixture.state.saveData = {
    money: 1234,
    pokeballs: 27,
    active_ball_type: "super_ball",
    ball_inventory: {
      poke_ball: 15,
      super_ball: 8,
      hyper_ball: 4,
    },
  };

  fixture.runtime.refreshShopWalletPanel("pokeballs");

  assert.equal(fixture.refs.topbarBallPokeCountEl?.textContent, "15");
  assert.equal(fixture.refs.topbarBallSuperCountEl?.textContent, "8");
  assert.equal(fixture.refs.topbarBallHyperCountEl?.textContent, "4");
  assert.equal(fixture.refs.topbarBallPokeItemEl?.classList.contains("is-active"), false);
  assert.equal(fixture.refs.topbarBallSuperItemEl?.classList.contains("is-active"), true);
  assert.equal(fixture.refs.topbarBallHyperItemEl?.classList.contains("is-active"), false);
  assert.equal(
    fixture.refs.shopWalletMoneyValueEl?.textContent,
    `${new Intl.NumberFormat("fr-FR").format(1234)} Poke$`,
  );
  assert.equal(fixture.refs.shopWalletPokeballsValueEl?.textContent, "27");
  assert.equal(fixture.refs.shopWalletQtyValueEl?.textContent, "x10");
  assert.equal(fixture.refs.shopWalletQtyItemEl?.classList.contains("hidden"), false);
});
