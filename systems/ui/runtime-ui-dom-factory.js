const RUNTIME_UI_MOUNT_ROOT_ID = "runtime-ui-root";

export const RUNTIME_UI_TEMPLATE_HTML = String.raw`<div id="game-capture-root" class="game-capture-root" data-layout-mode="desktopLandscape">
    <div class="app-root">
      <main class="app-shell">
        <div id="game-stage" class="game-stage">
          <canvas id="game-canvas" aria-label="Zone de jeu Pok&eacute;mon idle"></canvas>
          <section id="loading-screen" class="loading-screen is-visible" aria-live="polite" aria-label="Chargement">
            <div class="loading-screen-core">
              <div class="loading-pokeball" aria-hidden="true"></div>
              <p id="loading-screen-text" class="loading-screen-text">
                Le code de ce jeu a &eacute;t&eacute; enti&egrave;rement g&eacute;n&eacute;r&eacute; par IA.
              </p>
            </div>
            <div class="loading-screen-flash" aria-hidden="true"></div>
          </section>
          <div id="world-ui-layer" class="world-ui-layer" aria-live="polite">
            <div id="hover-popup" class="hover-popup hidden" aria-live="polite"></div>
            <div id="team-context-menu" class="team-context-menu hidden" role="menu" aria-label="Actions du Pok&eacute;mon">
              <div id="team-context-menu-title" class="team-context-menu-title">Pok&eacute;mon</div>
              <button id="team-context-menu-rename" class="team-context-menu-btn" type="button" role="menuitem">
                Renommer
              </button>
              <button id="team-context-menu-boxes" class="team-context-menu-btn" type="button" role="menuitem">
                &Eacute;changer avec la bo&icirc;te
              </button>
              <button id="team-context-menu-appearance" class="team-context-menu-btn" type="button" role="menuitem">
                Changer l'apparence
              </button>
            </div>
            <div id="ball-capture-menu" class="team-context-menu ball-capture-menu hidden" role="menu" aria-label="R&eacute;glages de capture par ball">
              <div id="ball-capture-menu-title" class="team-context-menu-title">R&eacute;glages capture</div>
              <button
                id="ball-capture-toggle-all"
                class="team-context-menu-btn ball-capture-menu-btn"
                type="button"
                role="menuitemcheckbox"
                aria-checked="true"
              ></button>
              <button
                id="ball-capture-toggle-unowned"
                class="team-context-menu-btn ball-capture-menu-btn"
                type="button"
                role="menuitemcheckbox"
                aria-checked="true"
              ></button>
              <button
                id="ball-capture-toggle-owned"
                class="team-context-menu-btn ball-capture-menu-btn"
                type="button"
                role="menuitemcheckbox"
                aria-checked="true"
              ></button>
              <button
                id="ball-capture-toggle-shiny"
                class="team-context-menu-btn ball-capture-menu-btn"
                type="button"
                role="menuitemcheckbox"
                aria-checked="true"
              ></button>
              <button
                id="ball-capture-toggle-ultra"
                class="team-context-menu-btn ball-capture-menu-btn"
                type="button"
                role="menuitemcheckbox"
                aria-checked="true"
              ></button>
            </div>
          </div>
          <div class="game-overlay">
            <header class="ui-topbar">
              <div class="route-nav-wrap">
                <section class="route-nav" aria-label="Navigation des zones">
                  <button id="route-prev-btn" class="route-nav-btn" type="button" aria-label="Route pr&eacute;c&eacute;dente">
                    <span class="btn-icon" aria-hidden="true">&#8592;</span>
                  </button>
                  <div class="route-nav-center">
                    <div class="route-nav-meta">
                      <span class="route-nav-kicker">Exploration active</span>
                      <span class="route-nav-hint">F plein &eacute;cran</span>
                    </div>
                    <div id="route-nav-current" class="route-nav-current">Route 1 (Kanto)</div>
                    <div id="route-nav-progress" class="route-nav-progress">1/47 zones d&eacute;bloqu&eacute;es</div>
                  </div>
                  <button id="route-next-btn" class="route-nav-btn" type="button" aria-label="Route suivante">
                    <span class="btn-icon" aria-hidden="true">&#8594;</span>
                  </button>
                </section>
              </div>

              <aside class="resource-strip currency-stack">
                <div id="money-pill" class="resource-pill money-pill currency-pill">
                  <span class="currency-pill-icon" aria-hidden="true">₽</span>
                  <span class="currency-pill-content">
                    <span id="money-value" class="currency-pill-value">0</span>
                    <span class="currency-pill-caption">Pok&eacute;dollars</span>
                  </span>
                  <span id="money-anim-layer" class="money-anim-layer" aria-hidden="true"></span>
                </div>
                <div id="coins-pill" class="resource-pill currency-pill coins-pill">
                  <span class="currency-pill-icon" aria-hidden="true">C</span>
                  <span class="currency-pill-content">
                    <span id="coins-value" class="currency-pill-value">0</span>
                    <span class="currency-pill-caption">Coins</span>
                  </span>
                </div>
                <div id="save-pill" class="resource-pill currency-pill save-pill hidden">
                  <span class="currency-pill-icon" aria-hidden="true">S</span>
                  <span class="currency-pill-content">
                    <span id="save-backend-value" class="currency-pill-value">Sauvegarde navigateur</span>
                    <span class="currency-pill-caption">Sauvegarde</span>
                  </span>
                </div>
              </aside>
            </header>

            <footer class="action-dock is-temporary-disabled" aria-label="Menu principal temporairement d&eacute;sactiv&eacute;">
              <button id="map-btn" class="map-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">M</span>
                <span class="btn-label">Map</span>
              </button>
              <button id="pokedex-btn" class="pokedex-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">D</span>
                <span class="btn-label">Pokédex</span>
              </button>
              <button id="shop-btn" class="shop-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">B</span>
                <span class="btn-label">Shop</span>
              </button>
              <button id="gacha-btn" class="gacha-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">G</span>
                <span class="btn-label">Machine Gacha</span>
              </button>
              <button id="windows-notification-btn" class="shop-btn action-btn" type="button" aria-live="polite">
                <span class="btn-icon" aria-hidden="true">N</span>
                <span id="windows-notification-btn-label" class="btn-label">Notifs Windows</span>
              </button>
              <button id="export-save-btn" class="shop-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">J</span>
                <span class="btn-label">Exporter JSON</span>
              </button>
              <button id="import-save-btn" class="map-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">I</span>
                <span class="btn-label">Importer JSON</span>
              </button>
              <button id="reset-save-btn" class="reset-save-btn action-btn" type="button">
                <span class="btn-icon" aria-hidden="true">X</span>
                <span class="btn-label">Supprimer la save</span>
              </button>
              <div class="action-dock-pokeball-replacement">
                <button
                  id="action-dock-pokeball-toggle"
                  class="action-dock-pokeball-toggle"
                  type="button"
                  aria-label="Afficher le menu principal"
                  aria-controls="action-dock-fullscreen-menu"
                  aria-expanded="false"
                >
                  <span class="loading-pokeball action-dock-loading-pokeball" aria-hidden="true"></span>
                </button>
              </div>
            </footer>

            <section id="action-dock-fullscreen-menu" class="action-dock-fullscreen-menu hidden" aria-label="Menu principal plein &eacute;cran">
              <div class="action-dock-fullscreen-shell">
                <div id="action-dock-fullscreen-grid" class="action-dock-fullscreen-grid" role="menu" aria-label="Actions du menu">
                  <button class="action-dock-fullscreen-btn" type="button" data-action-kind="map" data-action-target="map-btn" role="menuitem">
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M5.5 7.5L10 5l4 2.5L18.5 5v11.5L14 19l-4-2.5L5.5 19z" fill="currentColor" fill-opacity="0.2"></path>
                        <path d="M10 5v11.5M14 7.5V19M5.5 7.5L10 5l4 2.5L18.5 5v11.5L14 19l-4-2.5L5.5 19z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Carte</span>
                      <span class="action-dock-fullscreen-sub">Zones et routes</span>
                    </span>
                  </button>
                  <button
                    class="action-dock-fullscreen-btn"
                    type="button"
                    data-action-kind="pokedex"
                    data-action-target="pokedex-btn"
                    role="menuitem"
                  >
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 0-3 3z" fill="currentColor" fill-opacity="0.2"></path>
                        <path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 0-3 3M6 4v19M9.5 9h5M9.5 12h5M9.5 15h3.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Pok&eacute;dex</span>
                      <span class="action-dock-fullscreen-sub">Fiches Pok&eacute;mon</span>
                    </span>
                  </button>
                  <button class="action-dock-fullscreen-btn" type="button" data-action-kind="shop" data-action-target="shop-btn" role="menuitem">
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M6 10h12l-1 10H7z" fill="currentColor" fill-opacity="0.2"></path>
                        <path d="M8.5 10V8.3A3.5 3.5 0 0 1 12 4.8a3.5 3.5 0 0 1 3.5 3.5V10M6 10h12l-1 10H7z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Boutique</span>
                      <span class="action-dock-fullscreen-sub">Objets et bonus</span>
                    </span>
                  </button>
                  <button class="action-dock-fullscreen-btn" type="button" data-action-kind="skins" data-action-target="gacha-btn" role="menuitem">
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <rect x="5.2" y="4.5" width="13.6" height="15" rx="3" fill="currentColor" fill-opacity="0.2"></rect>
                        <path d="M8 8.5h8M8 11.5h8M9.2 15.5h5.6M5.2 7.5h13.6M5.2 4.5h13.6v15H5.2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                        <circle cx="16.9" cy="16.9" r="1.6" fill="currentColor"></circle>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Machine &agrave; skins</span>
                      <span class="action-dock-fullscreen-sub">R&eacute;compenses visuelles</span>
                    </span>
                  </button>
                  <button
                    class="action-dock-fullscreen-btn"
                    type="button"
                    data-action-kind="notifications"
                    data-action-target="windows-notification-btn"
                    role="menuitem"
                  >
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M8 9a4 4 0 1 1 8 0v4.3l1.6 2.2H6.4L8 13.3z" fill="currentColor" fill-opacity="0.2"></path>
                        <path d="M8 9a4 4 0 1 1 8 0v4.3l1.6 2.2H6.4L8 13.3zM10.2 18.2a1.8 1.8 0 0 0 3.6 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Notifications</span>
                      <span class="action-dock-fullscreen-sub">Alertes Windows</span>
                    </span>
                  </button>
                  <button
                    class="action-dock-fullscreen-btn"
                    type="button"
                    data-action-kind="save-export"
                    data-action-target="export-save-btn"
                    role="menuitem"
                  >
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M12 5v9m0 0 3.2-3.2M12 14l-3.2-3.2M6 16.3V18h12v-1.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Exporter la save</span>
                      <span class="action-dock-fullscreen-sub">T&eacute;l&eacute;charger le JSON</span>
                    </span>
                  </button>
                  <button
                    class="action-dock-fullscreen-btn"
                    type="button"
                    data-action-kind="save-import"
                    data-action-target="import-save-btn"
                    role="menuitem"
                  >
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M12 19V10m0 0 3.2 3.2M12 10l-3.2 3.2M6 7.7V6h12v1.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">Importer une save</span>
                      <span class="action-dock-fullscreen-sub">Charger un fichier JSON</span>
                    </span>
                  </button>
                  <button
                    class="action-dock-fullscreen-btn is-danger"
                    type="button"
                    data-action-kind="danger"
                    data-action-target="reset-save-btn"
                    role="menuitem"
                  >
                    <span class="action-dock-fullscreen-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="action-dock-fullscreen-icon-svg">
                        <path d="M8 8h8l-.8 10.2H8.8z" fill="currentColor" fill-opacity="0.2"></path>
                        <path d="M9 8V6.7A1.7 1.7 0 0 1 10.7 5h2.6A1.7 1.7 0 0 1 15 6.7V8M6.8 8h10.4M8 8h8l-.8 10.2H8.8zM10.4 11.2v4.2M13.6 11.2v4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="action-dock-fullscreen-texts">
                      <span class="action-dock-fullscreen-label">R&eacute;initialiser la save</span>
                      <span class="action-dock-fullscreen-sub">Action irr&eacute;versible</span>
                    </span>
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>

    <section id="map-modal" class="map-modal hidden" role="dialog" aria-modal="true" aria-label="Carte">
      <div class="map-modal-card">
        <div class="map-modal-header">
          <div>
            <h2 id="map-modal-title" class="map-modal-title">Carte</h2>
            <p class="map-modal-subtitle">Clique une zone d&eacute;bloqu&eacute;e pour t'y rendre.</p>
          </div>
          <button id="map-close-btn" class="map-close-btn" type="button">Fermer</button>
        </div>
        <div class="map-stage">
          <img
            id="map-image"
            class="map-image"
            src="assets/maps/kanto_map_reference_user.png"
            alt="Carte"
            draggable="false"
          />
          <div id="map-markers" class="map-markers"></div>
        </div>
      </div>
    </section>

    <section id="shop-modal" class="shop-modal hidden" role="dialog" aria-modal="true" aria-label="Shop">
      <div class="shop-modal-card">
        <div class="shop-modal-header">
          <div>
            <h2 class="shop-modal-title">Shop</h2>
            <p id="shop-modal-subtitle" class="shop-modal-subtitle">Ach&egrave;te des objets utiles pour progresser.</p>
          </div>
          <button id="close-shop-btn" class="shop-close-btn" type="button">Fermer</button>
        </div>

        <div id="shop-wallet-panel" class="shop-wallet-panel" aria-live="polite">
          <div class="shop-wallet-item">
            <span class="shop-wallet-label">Pok&eacute;dollars</span>
            <span id="shop-wallet-money-value" class="shop-wallet-value">0 Poke$</span>
          </div>
          <div class="shop-wallet-item">
            <span class="shop-wallet-label">Poke Balls</span>
            <span id="shop-wallet-pokeballs-value" class="shop-wallet-value">0</span>
          </div>
          <div id="shop-wallet-qty-item" class="shop-wallet-item">
            <span class="shop-wallet-label">Achat rapide</span>
            <span id="shop-wallet-qty-value" class="shop-wallet-value">x1</span>
          </div>
        </div>

        <div class="shop-tabs" role="tablist" aria-label="Onglets du shop">
          <button id="shop-tab-pokeballs" class="shop-tab-btn is-active" type="button" data-shop-tab="pokeballs">
            Poke Balls
          </button>
          <button id="shop-tab-combat" class="shop-tab-btn" type="button" data-shop-tab="combat">
            Combats
          </button>
          <button id="shop-tab-evolutions" class="shop-tab-btn" type="button" data-shop-tab="evolutions">
            &Eacute;volutions
          </button>
        </div>

        <div id="shop-pokeball-qty-panel" class="shop-qty-panel">
          <div class="shop-qty-label">Quantit&eacute; &agrave; acheter</div>
          <div class="shop-qty-presets">
            <button class="shop-qty-btn is-active" type="button" data-shop-qty="1">x1</button>
            <button class="shop-qty-btn" type="button" data-shop-qty="5">x5</button>
            <button class="shop-qty-btn" type="button" data-shop-qty="10">x10</button>
            <button class="shop-qty-btn" type="button" data-shop-qty="50">x50</button>
            <button class="shop-qty-btn" type="button" data-shop-qty="100">x100</button>
            <button class="shop-qty-btn" type="button" data-shop-qty="max">MAX</button>
            <button class="shop-qty-btn" type="button" data-shop-qty="custom">Custom</button>
          </div>
          <label class="shop-custom-qty-wrap" for="shop-custom-qty-input">
            Valeur custom
            <input id="shop-custom-qty-input" class="shop-custom-qty-input" type="number" min="1" max="9999" step="1" value="1" />
          </label>
        </div>

        <div id="shop-grid" class="shop-grid"></div>
      </div>
    </section>

    <section id="gacha-modal" class="gacha-modal hidden" role="dialog" aria-modal="true" aria-label="Machine Gacha">
      <div id="gacha-card" class="gacha-card">
        <div class="gacha-header">
          <div>
            <h2 class="gacha-title">Machine Gacha Skins</h2>
            <p id="gacha-subtitle" class="gacha-subtitle">Capsules en silhouettes noires. Le skin obtenu est r&eacute;v&eacute;l&eacute; uniquement &agrave; la fin du tirage.</p>
          </div>
          <button id="gacha-close-btn" class="gacha-close-btn" type="button">Fermer</button>
        </div>

        <div id="gacha-wallet" class="gacha-wallet" aria-live="polite">
          <div class="gacha-wallet-item">
            <span class="gacha-wallet-label">Coins</span>
            <span id="gacha-wallet-coins" class="gacha-wallet-value">0</span>
          </div>
          <div class="gacha-wallet-item">
            <span class="gacha-wallet-label">Prix</span>
            <span id="gacha-wallet-cost" class="gacha-wallet-value">10 Coins</span>
          </div>
          <div class="gacha-wallet-item">
            <span class="gacha-wallet-label">Skins restants (Kanto #001-151)</span>
            <span id="gacha-wallet-remaining" class="gacha-wallet-value">0</span>
          </div>
        </div>

        <div id="gacha-machine" class="gacha-machine">
          <div class="gacha-lights" aria-hidden="true"></div>
          <div id="gacha-reel-window" class="gacha-reel-window">
            <div id="gacha-reel-track" class="gacha-reel-track"></div>
            <div class="gacha-reel-pointer" aria-hidden="true"></div>
          </div>
          <div id="gacha-batch-reveal" class="gacha-batch-reveal hidden" aria-live="polite"></div>
        </div>
        <div id="gacha-batch-spotlight" class="gacha-batch-spotlight hidden" aria-hidden="true"></div>
        <p id="gacha-status" class="gacha-status" aria-live="polite"></p>

        <div id="gacha-result" class="gacha-result hidden">
          <div id="gacha-result-kicker" class="gacha-result-kicker">Nouveau skin d&eacute;bloqu&eacute;</div>
          <div id="gacha-result-name" class="gacha-result-name">-</div>
          <div id="gacha-result-skin" class="gacha-result-skin">-</div>
          <div id="gacha-result-preview" class="gacha-result-preview"></div>
          <div id="gacha-result-list" class="gacha-result-list hidden"></div>
        </div>

        <div class="gacha-spin-buttons">
          <button id="gacha-spin-btn" class="gacha-spin-btn" type="button">Obtenir 1 skin al&eacute;atoire (10 Coins)</button>
          <button id="gacha-spin-10-btn" class="gacha-spin-btn gacha-spin-btn-batch" type="button">Obtenir 10 skins (100 Coins)</button>
        </div>
      </div>
    </section>

    <section
      id="evolution-item-modal"
      class="evolution-item-modal hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Choix de l'&eacute;volution"
    >
      <div class="evolution-item-card">
        <div class="evolution-item-header">
          <div>
            <h2 id="evolution-item-title" class="evolution-item-title">Objet d'&eacute;volution</h2>
            <p id="evolution-item-subtitle" class="evolution-item-subtitle">
              Choisis un Pok&eacute;mon compatible.
            </p>
          </div>
          <button id="evolution-item-close-btn" class="evolution-item-close-btn" type="button">Annuler</button>
        </div>
        <div id="evolution-item-list" class="evolution-item-list"></div>
      </div>
    </section>

    <section id="boxes-modal" class="boxes-modal hidden" role="dialog" aria-modal="true" aria-label="Bo&icirc;tes Pok&eacute;mon">
      <div class="boxes-card">
        <div class="boxes-header">
          <div>
            <h2 class="boxes-title">Bo&icirc;tes</h2>
            <p id="boxes-subtitle" class="boxes-subtitle">Choisis un Pok&eacute;mon pour remplacer ton slot d'&eacute;quipe.</p>
            <p id="boxes-shiny-counter" class="boxes-shiny-counter">Captures shiny (global): 0</p>
          </div>
          <button id="boxes-close-btn" class="boxes-close-btn" type="button">Fermer</button>
        </div>
        <div class="collection-search-row">
          <label class="collection-search-label" for="boxes-search-input">Recherche</label>
          <input
            id="boxes-search-input"
            class="collection-search-input"
            type="search"
            inputmode="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Nom, surnom ou n&deg; Pok&eacute;dex"
            aria-label="Rechercher dans les bo&icirc;tes"
          />
        </div>
        <div class="boxes-layout">
          <div id="boxes-grid" class="boxes-grid"></div>
          <aside id="boxes-info-panel" class="boxes-info-panel">
            Survole un Pok&eacute;mon de la bo&icirc;te pour voir ses infos d&eacute;taill&eacute;es.
          </aside>
        </div>
      </div>
    </section>

    <section id="pokedex-modal" class="boxes-modal hidden" role="dialog" aria-modal="true" aria-label="Pokédex">
      <div class="boxes-card pokedex-card">
        <div class="boxes-header">
          <div class="pokedex-header-copy">
            <h2 class="boxes-title">Pokédex</h2>
            <p id="pokedex-subtitle" class="boxes-subtitle">Toutes les espèces du jeu.</p>
            <div id="pokedex-counter" class="pokedex-header-stats" aria-live="polite">
              <p id="pokedex-global-completion" class="pokedex-global-completion">
                Complétion générale du Pokédex: 0%.
              </p>
              <p id="pokedex-stat-encountered" class="pokedex-header-stat">
                Espèces rencontrées: 0 sur 0 (0%).
              </p>
              <p id="pokedex-stat-captured" class="pokedex-header-stat">
                Espèces capturées: 0 sur 0 (0%).
              </p>
              <p id="pokedex-stat-shiny" class="pokedex-header-stat">
                Espèces capturées en shiny (hors ultra): 0 sur 0 (0%).
              </p>
              <p id="pokedex-stat-ultra" class="pokedex-header-stat">
                Espèces capturées en ultra shiny: 0 sur 0 (0%).
              </p>
            </div>
          </div>
          <button id="pokedex-close-btn" class="boxes-close-btn" type="button">Fermer</button>
        </div>
        <div class="collection-search-row">
          <label class="collection-search-label" for="pokedex-search-input">Recherche</label>
          <input
            id="pokedex-search-input"
            class="collection-search-input"
            type="search"
            inputmode="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Nom ou n&deg; Pok&eacute;dex"
            aria-label="Rechercher dans le Pok&eacute;dex"
          />
        </div>
        <div class="boxes-layout">
          <div id="pokedex-grid" class="boxes-grid pokedex-grid"></div>
          <aside id="pokedex-info-panel" class="boxes-info-panel">
            Survole un Pokémon du Pokédex pour voir ses infos.
          </aside>
        </div>
      </div>
    </section>

    <section
      id="appearance-modal"
      class="appearance-modal hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Apparence du Pok&eacute;mon"
    >
      <div class="appearance-card">
        <div class="appearance-header">
          <div>
            <h2 id="appearance-title" class="appearance-title">Apparence</h2>
            <p id="appearance-subtitle" class="appearance-subtitle">Choisis un sprite pour ce Pok&eacute;mon.</p>
          </div>
          <button id="appearance-close-btn" class="appearance-close-btn" type="button">Fermer</button>
        </div>
        <div class="appearance-controls">
          <div class="appearance-toggle-group">
            <button id="appearance-shiny-toggle-btn" class="appearance-shiny-toggle-btn" type="button">
              Mode shiny: OFF
            </button>
            <button
              id="appearance-ultra-shiny-toggle-btn"
              class="appearance-shiny-toggle-btn appearance-ultra-shiny-toggle-btn"
              type="button"
            >
              Mode ultra shiny: OFF
            </button>
          </div>
          <span id="appearance-shiny-status" class="appearance-shiny-status">
            Capture un shiny de la famille &eacute;volutive pour d&eacute;bloquer ce mode.
          </span>
        </div>
        <div id="appearance-grid" class="appearance-grid"></div>
      </div>
    </section>

    <section
      id="tutorial-modal"
      class="tutorial-modal hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-page-title"
    >
      <div class="tutorial-card">
        <div class="tutorial-header">
          <div>
            <div id="tutorial-progress" class="tutorial-progress">Etape 1/1</div>
            <h2 id="tutorial-title" class="tutorial-title">Tutoriel</h2>
            <p id="tutorial-page-title" class="tutorial-page-title">Bienvenue</p>
          </div>
          <button id="tutorial-close-btn" class="tutorial-close-btn" type="button">Fermer</button>
        </div>
        <div id="tutorial-body" class="tutorial-body"></div>
        <div class="tutorial-actions">
          <button id="tutorial-prev-btn" class="tutorial-nav-btn tutorial-prev-btn" type="button">
            Precedent
          </button>
          <button id="tutorial-next-btn" class="tutorial-nav-btn tutorial-next-btn" type="button">
            Suivant
          </button>
        </div>
      </div>
    </section>

    <div id="starter-modal" class="starter-modal hidden" role="dialog" aria-modal="true">
      <div class="starter-modal-card">
        <h1 class="starter-title">Choisis ton starter</h1>
        <p class="starter-subtitle">
          Tu commences sans &eacute;quipe. Prends un Pok&eacute;mon niveau 1 pour d&eacute;buter Route 1.
        </p>
        <div id="starter-choices" class="starter-choices"></div>
      </div>
    </div>
    <section
      id="rename-modal"
      class="rename-modal hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-title"
      aria-describedby="rename-subtitle"
    >
      <div class="rename-card">
        <div class="rename-header">
          <div>
            <h2 id="rename-title" class="rename-title">Renommer</h2>
            <p id="rename-subtitle" class="rename-subtitle">Choisis un surnom pour ton Pok&eacute;mon.</p>
          </div>
          <button id="rename-close-btn" class="rename-close-btn" type="button">Annuler</button>
        </div>
        <form id="rename-form" class="rename-form">
          <label for="rename-input" class="rename-label">Surnom</label>
          <input
            id="rename-input"
            class="rename-input"
            type="text"
            inputmode="text"
            autocomplete="off"
            maxlength="14"
            placeholder="Nom du Pok&eacute;mon"
          />
          <div class="rename-meta">
            <span id="rename-char-count" class="rename-char-count">0/14</span>
            <span class="rename-hint">14 caract&egrave;res max. Vide = nom d'origine pour la famille.</span>
          </div>
          <div class="rename-actions">
            <button id="rename-reset-btn" class="rename-action-btn is-secondary" type="button">
              Nom d'origine
            </button>
            <button id="rename-save-btn" class="rename-action-btn" type="submit">Valider</button>
          </div>
        </form>
      </div>
    </section>
    <aside id="notification-stack" class="notification-stack" aria-live="polite" aria-label="Notifications du jeu"></aside>
    <aside
      id="background-runtime-debug-overlay"
      class="background-runtime-debug-overlay hidden"
      aria-live="polite"
      aria-hidden="true"
      aria-label="Background runtime debug"
    ></aside>
    </div>
    </div>
    <section id="dev-layout-panel" class="dev-layout-panel hidden" aria-hidden="true" aria-label="Dev layout panel">
      <div class="dev-layout-panel-shell">
        <div class="dev-layout-panel-header">
          <strong>Dev Layout</strong>
          <div class="dev-layout-panel-actions">
            <button id="dev-layout-reset-btn" type="button">Reset</button>
            <button id="dev-layout-close-btn" type="button">Fermer</button>
          </div>
        </div>
        <div id="dev-layout-controls" class="dev-layout-controls"></div>
      </div>
    </section>`;

export const RUNTIME_UI_ID_BY_KEY = Object.freeze({
  canvas: "game-canvas",
  captureRootEl: "game-capture-root",
  gameStageEl: "game-stage",
  worldUiLayerEl: "world-ui-layer",
  loadingScreenEl: "loading-screen",
  loadingScreenTextEl: "loading-screen-text",
  actionDockPokeballToggleButtonEl: "action-dock-pokeball-toggle",
  actionDockFullscreenMenuEl: "action-dock-fullscreen-menu",
  actionDockFullscreenGridEl: "action-dock-fullscreen-grid",
  starterModalEl: "starter-modal",
  starterChoicesEl: "starter-choices",
  hoverPopupEl: "hover-popup",
  teamContextMenuEl: "team-context-menu",
  teamContextMenuTitleEl: "team-context-menu-title",
  teamContextMenuRenameButtonEl: "team-context-menu-rename",
  teamContextMenuBoxesButtonEl: "team-context-menu-boxes",
  teamContextMenuAppearanceButtonEl: "team-context-menu-appearance",
  ballCaptureMenuEl: "ball-capture-menu",
  ballCaptureMenuTitleEl: "ball-capture-menu-title",
  ballCaptureToggleAllButtonEl: "ball-capture-toggle-all",
  ballCaptureToggleUnownedButtonEl: "ball-capture-toggle-unowned",
  ballCaptureToggleOwnedButtonEl: "ball-capture-toggle-owned",
  ballCaptureToggleShinyButtonEl: "ball-capture-toggle-shiny",
  ballCaptureToggleUltraButtonEl: "ball-capture-toggle-ultra",
  renameModalEl: "rename-modal",
  renameTitleEl: "rename-title",
  renameSubtitleEl: "rename-subtitle",
  renameFormEl: "rename-form",
  renameInputEl: "rename-input",
  renameCharCountEl: "rename-char-count",
  renameCloseButtonEl: "rename-close-btn",
  renameResetButtonEl: "rename-reset-btn",
  exportSaveButtonEl: "export-save-btn",
  importSaveButtonEl: "import-save-btn",
  resetSaveButtonEl: "reset-save-btn",
  mapButtonEl: "map-btn",
  pokedexButtonEl: "pokedex-btn",
  mapModalEl: "map-modal",
  mapCloseButtonEl: "map-close-btn",
  mapImageEl: "map-image",
  mapMarkersEl: "map-markers",
  mapModalTitleEl: "map-modal-title",
  shopButtonEl: "shop-btn",
  gachaButtonEl: "gacha-btn",
  windowsNotificationButtonEl: "windows-notification-btn",
  windowsNotificationButtonLabelEl: "windows-notification-btn-label",
  shopModalEl: "shop-modal",
  shopModalSubtitleEl: "shop-modal-subtitle",
  shopGridEl: "shop-grid",
  shopPokeballQtyPanelEl: "shop-pokeball-qty-panel",
  shopCustomQtyInputEl: "shop-custom-qty-input",
  shopTabPokeballsButtonEl: "shop-tab-pokeballs",
  shopTabCombatButtonEl: "shop-tab-combat",
  shopTabEvolutionsButtonEl: "shop-tab-evolutions",
  shopWalletMoneyValueEl: "shop-wallet-money-value",
  shopWalletPokeballsValueEl: "shop-wallet-pokeballs-value",
  shopWalletQtyItemEl: "shop-wallet-qty-item",
  shopWalletQtyValueEl: "shop-wallet-qty-value",
  closeShopButtonEl: "close-shop-btn",
  gachaModalEl: "gacha-modal",
  gachaCardEl: "gacha-card",
  gachaCloseButtonEl: "gacha-close-btn",
  gachaSubtitleEl: "gacha-subtitle",
  gachaWalletCoinsEl: "gacha-wallet-coins",
  gachaWalletCostEl: "gacha-wallet-cost",
  gachaWalletRemainingEl: "gacha-wallet-remaining",
  gachaMachineEl: "gacha-machine",
  gachaReelWindowEl: "gacha-reel-window",
  gachaReelTrackEl: "gacha-reel-track",
  gachaBatchRevealEl: "gacha-batch-reveal",
  gachaBatchSpotlightEl: "gacha-batch-spotlight",
  gachaStatusEl: "gacha-status",
  gachaResultEl: "gacha-result",
  gachaResultKickerEl: "gacha-result-kicker",
  gachaResultNameEl: "gacha-result-name",
  gachaResultSkinEl: "gacha-result-skin",
  gachaResultPreviewEl: "gacha-result-preview",
  gachaResultListEl: "gacha-result-list",
  gachaSpinButtonEl: "gacha-spin-btn",
  gachaSpin10ButtonEl: "gacha-spin-10-btn",
  evolutionItemModalEl: "evolution-item-modal",
  evolutionItemTitleEl: "evolution-item-title",
  evolutionItemSubtitleEl: "evolution-item-subtitle",
  evolutionItemListEl: "evolution-item-list",
  evolutionItemCloseButtonEl: "evolution-item-close-btn",
  moneyPillEl: "money-pill",
  moneyValueEl: "money-value",
  moneyAnimLayerEl: "money-anim-layer",
  coinsValueEl: "coins-value",
  saveBackendValueEl: "save-backend-value",
  routeNavCurrentEl: "route-nav-current",
  routeNavProgressEl: "route-nav-progress",
  routePrevButtonEl: "route-prev-btn",
  routeNextButtonEl: "route-next-btn",
  boxesModalEl: "boxes-modal",
  boxesGridEl: "boxes-grid",
  boxesInfoPanelEl: "boxes-info-panel",
  boxesCloseButtonEl: "boxes-close-btn",
  boxesSearchInputEl: "boxes-search-input",
  boxesSubtitleEl: "boxes-subtitle",
  boxesShinyCounterEl: "boxes-shiny-counter",
  pokedexModalEl: "pokedex-modal",
  pokedexGridEl: "pokedex-grid",
  pokedexInfoPanelEl: "pokedex-info-panel",
  pokedexCloseButtonEl: "pokedex-close-btn",
  pokedexSearchInputEl: "pokedex-search-input",
  pokedexSubtitleEl: "pokedex-subtitle",
  pokedexGlobalCompletionEl: "pokedex-global-completion",
  pokedexEncounteredStatEl: "pokedex-stat-encountered",
  pokedexCapturedStatEl: "pokedex-stat-captured",
  pokedexShinyStatEl: "pokedex-stat-shiny",
  pokedexUltraShinyStatEl: "pokedex-stat-ultra",
  appearanceModalEl: "appearance-modal",
  appearanceTitleEl: "appearance-title",
  appearanceSubtitleEl: "appearance-subtitle",
  appearanceCloseButtonEl: "appearance-close-btn",
  appearanceShinyToggleButtonEl: "appearance-shiny-toggle-btn",
  appearanceUltraShinyToggleButtonEl: "appearance-ultra-shiny-toggle-btn",
  appearanceShinyStatusEl: "appearance-shiny-status",
  appearanceGridEl: "appearance-grid",
  notificationStackEl: "notification-stack",
  backgroundRuntimeDebugOverlayEl: "background-runtime-debug-overlay",
  tutorialModalEl: "tutorial-modal",
  tutorialTitleEl: "tutorial-title",
  tutorialPageTitleEl: "tutorial-page-title",
  tutorialBodyEl: "tutorial-body",
  tutorialProgressEl: "tutorial-progress",
  tutorialPrevButtonEl: "tutorial-prev-btn",
  tutorialNextButtonEl: "tutorial-next-btn",
  tutorialCloseButtonEl: "tutorial-close-btn",
  devLayoutPanelEl: "dev-layout-panel",
  devLayoutControlsEl: "dev-layout-controls",
  devLayoutCloseButtonEl: "dev-layout-close-btn",
  devLayoutResetButtonEl: "dev-layout-reset-btn",
});

export const RUNTIME_UI_ID_LIST = Object.freeze([
  "game-canvas",
  "game-capture-root",
  "game-stage",
  "world-ui-layer",
  "loading-screen",
  "loading-screen-text",
  "action-dock-pokeball-toggle",
  "action-dock-fullscreen-menu",
  "action-dock-fullscreen-grid",
  "starter-modal",
  "starter-choices",
  "hover-popup",
  "team-context-menu",
  "team-context-menu-title",
  "team-context-menu-rename",
  "team-context-menu-boxes",
  "team-context-menu-appearance",
  "ball-capture-menu",
  "ball-capture-menu-title",
  "ball-capture-toggle-all",
  "ball-capture-toggle-unowned",
  "ball-capture-toggle-owned",
  "ball-capture-toggle-shiny",
  "ball-capture-toggle-ultra",
  "rename-modal",
  "rename-title",
  "rename-subtitle",
  "rename-form",
  "rename-input",
  "rename-char-count",
  "rename-close-btn",
  "rename-reset-btn",
  "export-save-btn",
  "import-save-btn",
  "reset-save-btn",
  "map-btn",
  "pokedex-btn",
  "map-modal",
  "map-close-btn",
  "map-image",
  "map-markers",
  "map-modal-title",
  "shop-btn",
  "gacha-btn",
  "windows-notification-btn",
  "windows-notification-btn-label",
  "shop-modal",
  "shop-modal-subtitle",
  "shop-grid",
  "shop-pokeball-qty-panel",
  "shop-custom-qty-input",
  "shop-tab-pokeballs",
  "shop-tab-combat",
  "shop-tab-evolutions",
  "shop-wallet-money-value",
  "shop-wallet-pokeballs-value",
  "shop-wallet-qty-item",
  "shop-wallet-qty-value",
  "close-shop-btn",
  "gacha-modal",
  "gacha-card",
  "gacha-close-btn",
  "gacha-subtitle",
  "gacha-wallet-coins",
  "gacha-wallet-cost",
  "gacha-wallet-remaining",
  "gacha-machine",
  "gacha-reel-window",
  "gacha-reel-track",
  "gacha-batch-reveal",
  "gacha-batch-spotlight",
  "gacha-status",
  "gacha-result",
  "gacha-result-kicker",
  "gacha-result-name",
  "gacha-result-skin",
  "gacha-result-preview",
  "gacha-result-list",
  "gacha-spin-btn",
  "gacha-spin-10-btn",
  "evolution-item-modal",
  "evolution-item-title",
  "evolution-item-subtitle",
  "evolution-item-list",
  "evolution-item-close-btn",
  "money-pill",
  "money-value",
  "money-anim-layer",
  "coins-value",
  "save-backend-value",
  "route-nav-current",
  "route-nav-progress",
  "route-prev-btn",
  "route-next-btn",
  "boxes-modal",
  "boxes-grid",
  "boxes-info-panel",
  "boxes-close-btn",
  "boxes-search-input",
  "boxes-subtitle",
  "boxes-shiny-counter",
  "pokedex-modal",
  "pokedex-grid",
  "pokedex-info-panel",
  "pokedex-close-btn",
  "pokedex-search-input",
  "pokedex-subtitle",
  "pokedex-global-completion",
  "pokedex-stat-encountered",
  "pokedex-stat-captured",
  "pokedex-stat-shiny",
  "pokedex-stat-ultra",
  "appearance-modal",
  "appearance-title",
  "appearance-subtitle",
  "appearance-close-btn",
  "appearance-shiny-toggle-btn",
  "appearance-ultra-shiny-toggle-btn",
  "appearance-shiny-status",
  "appearance-grid",
  "notification-stack",
  "background-runtime-debug-overlay",
  "tutorial-modal",
  "tutorial-title",
  "tutorial-page-title",
  "tutorial-body",
  "tutorial-progress",
  "tutorial-prev-btn",
  "tutorial-next-btn",
  "tutorial-close-btn",
  "dev-layout-panel",
  "dev-layout-controls",
  "dev-layout-close-btn",
  "dev-layout-reset-btn",
]);

export const RUNTIME_UI_CRITICAL_REF_KEYS = Object.freeze([
  "canvas",
  "captureRootEl",
  "gameStageEl",
  "worldUiLayerEl",
  "gameOverlayEl",
  "loadingScreenEl",
  "loadingScreenTextEl",
  "uiTopbarEl",
  "actionDockEl",
  "actionDockPokeballToggleButtonEl",
  "actionDockFullscreenMenuEl",
  "starterModalEl",
  "mapModalEl",
  "shopModalEl",
  "gachaModalEl",
  "boxesModalEl",
  "pokedexModalEl",
  "appearanceModalEl",
  "tutorialModalEl",
  "renameModalEl",
  "notificationStackEl",
  "backgroundRuntimeDebugOverlayEl",
]);

function isElementLike(value) {
  return Boolean(value && typeof value === "object" && value.nodeType === 1);
}

function ensureMountRoot(documentRef, mountRootId = RUNTIME_UI_MOUNT_ROOT_ID) {
  let mountRoot = documentRef.getElementById(mountRootId);
  if (isElementLike(mountRoot)) {
    return mountRoot;
  }
  mountRoot = documentRef.createElement("div");
  mountRoot.id = mountRootId;
  documentRef.body.appendChild(mountRoot);
  return mountRoot;
}

function buildElementsById(documentRef) {
  const elementsById = Object.create(null);
  for (const id of RUNTIME_UI_ID_LIST) {
    elementsById[id] = documentRef.getElementById(id);
  }
  return elementsById;
}

export function resolveRuntimeUiDomRefs(documentRef = typeof document !== "undefined" ? document : null) {
  if (!documentRef || typeof documentRef.getElementById !== "function") {
    throw new Error("resolveRuntimeUiDomRefs requires a valid document reference.");
  }

  const refs = {
    elementsById: buildElementsById(documentRef),
    gameOverlayEl: documentRef.querySelector(".game-overlay"),
    uiTopbarEl: documentRef.querySelector(".ui-topbar"),
    actionDockEl: documentRef.querySelector(".action-dock"),
    mapStageEl: documentRef.querySelector(".map-stage"),
    mapModalSubtitleEl: null,
    actionDockPokeballVisualEl: null,
    shopTabButtonEls: Array.from(documentRef.querySelectorAll("[data-shop-tab]")),
    shopQtyPresetButtonEls: Array.from(documentRef.querySelectorAll("[data-shop-qty]")),
  };

  for (const [key, id] of Object.entries(RUNTIME_UI_ID_BY_KEY)) {
    refs[key] = refs.elementsById[id] || null;
  }

  refs.mapModalSubtitleEl = isElementLike(refs.mapModalEl)
    ? refs.mapModalEl.querySelector(".map-modal-subtitle")
    : null;
  refs.actionDockPokeballVisualEl = isElementLike(refs.actionDockPokeballToggleButtonEl)
    ? refs.actionDockPokeballToggleButtonEl.querySelector(".action-dock-loading-pokeball")
    : null;

  return refs;
}

export function getMissingRuntimeUiRefKeys(uiDom = null, requiredKeys = RUNTIME_UI_CRITICAL_REF_KEYS) {
  const missing = [];
  const keys = Array.isArray(requiredKeys) ? requiredKeys : [];
  for (const key of keys) {
    if (!uiDom || uiDom[key] == null) {
      missing.push(String(key));
    }
  }
  return missing;
}

export function assertRuntimeUiDomInvariants(uiDom = null, requiredKeys = RUNTIME_UI_CRITICAL_REF_KEYS) {
  const missing = getMissingRuntimeUiRefKeys(uiDom, requiredKeys);
  if (missing.length > 0) {
    throw new Error(
      "Runtime UI mount invariant failed. Missing required refs: " + missing.join(", "),
    );
  }
  return uiDom;
}

export function mountRuntimeUi(documentRef = typeof document !== "undefined" ? document : null, options = {}) {
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new Error("mountRuntimeUi requires a valid document reference.");
  }

  const mountRoot = ensureMountRoot(documentRef, options.mountRootId || RUNTIME_UI_MOUNT_ROOT_ID);
  mountRoot.innerHTML = RUNTIME_UI_TEMPLATE_HTML;
  const uiDom = resolveRuntimeUiDomRefs(documentRef);

  if (options.assertInvariants !== false) {
    assertRuntimeUiDomInvariants(uiDom, options.requiredKeys);
  }

  return uiDom;
}
