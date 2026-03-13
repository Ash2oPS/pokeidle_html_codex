import {
  compareSemver,
  getGithubRepositoryFromLocation,
  POKEIDLE_GITHUB_REPO_NAME,
  POKEIDLE_GITHUB_REPO_OWNER,
} from "../version.js";

const GITHUB_API_ROOT = "https://api.github.com/repos";
const UPDATE_CHECK_TIMEOUT_MS = 7000;
const UPDATE_RECHECK_INTERVAL_MS = 5 * 60 * 1000;
const UPDATE_MODAL_ID = "update-required-modal";
const UPDATE_MODAL_TITLE_ID = "update-required-title";
const UPDATE_MODAL_MESSAGE_ID = "update-required-message";
const UPDATE_MODAL_REFRESH_BUTTON_ID = "update-required-refresh-btn";
const UPDATE_MODAL_VERSION_ID = "update-required-version";
const UPDATE_VERSION_FILES = Object.freeze(["version.js", "package.json"]);
const BLOCKED_EVENT_TYPES = Object.freeze([
  "keydown",
  "keyup",
  "keypress",
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
  "dblclick",
  "contextmenu",
  "wheel",
  "touchstart",
  "touchmove",
  "touchend",
]);

let hasShownUpdateModal = false;
let interactionBlockerCleanup = null;

function buildRepoApiUrl(owner, repo, suffix = "") {
  const encodedOwner = encodeURIComponent(String(owner || "").trim());
  const encodedRepo = encodeURIComponent(String(repo || "").trim());
  if (!encodedOwner || !encodedRepo) {
    return "";
  }
  return `${GITHUB_API_ROOT}/${encodedOwner}/${encodedRepo}${suffix}`;
}

function buildGithubRepoConfig() {
  const inferred = getGithubRepositoryFromLocation(
    window.location,
    POKEIDLE_GITHUB_REPO_OWNER,
    POKEIDLE_GITHUB_REPO_NAME,
  );
  return {
    owner: String(inferred?.owner || POKEIDLE_GITHUB_REPO_OWNER).trim(),
    repo: String(inferred?.repo || POKEIDLE_GITHUB_REPO_NAME).trim(),
  };
}

async function fetchJsonWithTimeout(url, timeoutMs = UPDATE_CHECK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub request failed (${response.status})`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function decodeGithubBase64Content(contentBase64) {
  const raw = String(contentBase64 || "").replace(/\s+/g, "");
  if (!raw) {
    return "";
  }

  if (typeof atob !== "function") {
    return "";
  }

  try {
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

function extractVersionFromVersionJs(rawSource) {
  const source = String(rawSource || "");
  const match = source.match(/POKEIDLE_APP_VERSION\s*=\s*["']([^"']+)["']/);
  return match?.[1] ? String(match[1]).trim() : "";
}

function extractVersionFromPackageJson(rawSource) {
  try {
    const parsed = JSON.parse(String(rawSource || "{}"));
    return String(parsed?.version || "").trim();
  } catch {
    return "";
  }
}

function extractVersionFromSourceFile(path, rawSource) {
  if (path === "version.js") {
    return extractVersionFromVersionJs(rawSource);
  }
  if (path === "package.json") {
    return extractVersionFromPackageJson(rawSource);
  }
  return "";
}

function buildCurrentOriginVersionFileUrl(path) {
  if (!path) {
    return "";
  }
  try {
    const url = new URL(path, window.location.href);
    url.searchParams.set("_update_check", `${Date.now()}`);
    return url.toString();
  } catch {
    return "";
  }
}

async function fetchTextWithTimeout(url, timeoutMs = UPDATE_CHECK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Version source request failed (${response.status})`);
    }
    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchRemoteVersionFromFile({ owner, repo, branch, path }) {
  const apiBaseUrl = buildRepoApiUrl(owner, repo);
  if (!apiBaseUrl || !path) {
    return "";
  }
  const url = `${apiBaseUrl}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const payload = await fetchJsonWithTimeout(url);
  const rawSource = decodeGithubBase64Content(payload?.content);
  if (!rawSource) {
    return "";
  }
  if (path === "version.js") {
    return extractVersionFromVersionJs(rawSource);
  }
  if (path === "package.json") {
    return extractVersionFromPackageJson(rawSource);
  }
  return "";
}

async function fetchRemoteVersionFromCurrentOrigin() {
  for (const path of UPDATE_VERSION_FILES) {
    try {
      const versionFileUrl = buildCurrentOriginVersionFileUrl(path);
      if (!versionFileUrl) {
        continue;
      }
      const rawSource = await fetchTextWithTimeout(versionFileUrl);
      const version = extractVersionFromSourceFile(path, rawSource);
      if (version) {
        return version;
      }
    } catch {
      // Continue with next source file (fallback chain).
    }
  }
  return "";
}

function createUpdateModalDom() {
  const root = document.createElement("section");
  root.id = UPDATE_MODAL_ID;
  root.className = "update-required-modal hidden";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", UPDATE_MODAL_TITLE_ID);
  root.setAttribute("aria-describedby", UPDATE_MODAL_MESSAGE_ID);
  root.innerHTML = `
    <div class="update-required-card">
      <p class="update-required-eyebrow">Mise a jour disponible</p>
      <h2 id="${UPDATE_MODAL_TITLE_ID}" class="update-required-title">Nouvelle version detectee</h2>
      <p id="${UPDATE_MODAL_MESSAGE_ID}" class="update-required-message">
        Une version plus recente du jeu est disponible sur GitHub.
      </p>
      <p id="${UPDATE_MODAL_VERSION_ID}" class="update-required-version"></p>
      <button id="${UPDATE_MODAL_REFRESH_BUTTON_ID}" class="update-required-refresh-btn" type="button">
        Recharger la page (Ctrl + F5)
      </button>
    </div>
  `;
  document.body.append(root);
  return root;
}

function ensureUpdateModalDom() {
  const existing = document.getElementById(UPDATE_MODAL_ID);
  if (existing) {
    return existing;
  }
  return createUpdateModalDom();
}

function setUpdateModalVersionLabel(localVersion, remoteVersion) {
  const versionEl = document.getElementById(UPDATE_MODAL_VERSION_ID);
  if (!versionEl) {
    return;
  }
  versionEl.textContent = `Version actuelle: v${localVersion} -> version disponible: v${remoteVersion}`;
}

function forceHardRefresh(remoteVersion) {
  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.set("v", String(remoteVersion || "").trim() || `${Date.now()}`);
  targetUrl.searchParams.set("update", `${Date.now()}`);
  window.location.replace(targetUrl.toString());
  window.setTimeout(() => {
    window.location.reload();
  }, 120);
}

function installInteractionBlocker(modalRoot, refreshButtonEl) {
  if (interactionBlockerCleanup) {
    return;
  }

  const eventBlocker = (event) => {
    if (!modalRoot || modalRoot.classList.contains("hidden")) {
      return;
    }
    const targetNode = event.target instanceof Node ? event.target : null;
    const targetIsRefreshButton =
      Boolean(refreshButtonEl) &&
      targetNode &&
      (targetNode === refreshButtonEl ||
        (typeof refreshButtonEl.contains === "function" && refreshButtonEl.contains(targetNode)));
    if (targetIsRefreshButton) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
  };

  const focusTrap = () => {
    if (!modalRoot || modalRoot.classList.contains("hidden") || !refreshButtonEl) {
      return;
    }
    if (modalRoot.contains(document.activeElement)) {
      return;
    }
    refreshButtonEl.focus({ preventScroll: true });
  };

  for (const eventName of BLOCKED_EVENT_TYPES) {
    window.addEventListener(eventName, eventBlocker, { capture: true, passive: false });
  }
  window.addEventListener("focusin", focusTrap, true);

  interactionBlockerCleanup = () => {
    for (const eventName of BLOCKED_EVENT_TYPES) {
      window.removeEventListener(eventName, eventBlocker, true);
    }
    window.removeEventListener("focusin", focusTrap, true);
    interactionBlockerCleanup = null;
  };
}

function showUpdateRequiredModal(localVersion, remoteVersion) {
  const root = ensureUpdateModalDom();
  const refreshButtonEl = document.getElementById(UPDATE_MODAL_REFRESH_BUTTON_ID);
  if (!root || !refreshButtonEl) {
    return;
  }

  setUpdateModalVersionLabel(localVersion, remoteVersion);
  refreshButtonEl.onclick = () => forceHardRefresh(remoteVersion);
  root.classList.remove("hidden");
  document.body.classList.add("update-required-active");
  installInteractionBlocker(root, refreshButtonEl);
  refreshButtonEl.focus({ preventScroll: true });
}

async function fetchRemoteVersion(repoConfig) {
  const currentOriginVersion = await fetchRemoteVersionFromCurrentOrigin();
  if (currentOriginVersion) {
    return currentOriginVersion;
  }

  const repoApiUrl = buildRepoApiUrl(repoConfig.owner, repoConfig.repo);
  if (!repoApiUrl) {
    return "";
  }

  const metadata = await fetchJsonWithTimeout(repoApiUrl);
  const branch = String(metadata?.default_branch || "main").trim();
  for (const path of UPDATE_VERSION_FILES) {
    try {
      const version = await fetchRemoteVersionFromFile({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch,
        path,
      });
      if (version) {
        return version;
      }
    } catch {
      // Continue with next source file (fallback chain).
    }
  }
  return "";
}

async function checkForUpdate(localVersion) {
  const repoConfig = buildGithubRepoConfig();
  if (!repoConfig.owner || !repoConfig.repo) {
    return;
  }
  const remoteVersion = await fetchRemoteVersion(repoConfig);
  if (!remoteVersion) {
    return;
  }
  const comparison = compareSemver(localVersion, remoteVersion);
  if (comparison === null || comparison >= 0) {
    return;
  }
  hasShownUpdateModal = true;
  showUpdateRequiredModal(localVersion, remoteVersion);
}

export function initializeGithubUpdateChecker({ currentVersion, checkIntervalMs = UPDATE_RECHECK_INTERVAL_MS } = {}) {
  const localVersion = String(currentVersion || window.POKEIDLE_APP_VERSION || "").trim();
  if (!localVersion) {
    return;
  }

  void checkForUpdate(localVersion).catch(() => {});

  const intervalMs = Number.isFinite(Number(checkIntervalMs))
    ? Math.max(60_000, Math.round(Number(checkIntervalMs)))
    : UPDATE_RECHECK_INTERVAL_MS;
  window.setInterval(() => {
    if (hasShownUpdateModal) {
      return;
    }
    void checkForUpdate(localVersion).catch(() => {});
  }, intervalMs);
}
