export const POKEIDLE_APP_VERSION = "0.1.18";
export const POKEIDLE_PRODUCTION_HOSTNAME = "ash2ops.github.io";
export const POKEIDLE_PRODUCTION_PATH_PREFIX = "/pokeidle_html_codex";
export const POKEIDLE_GITHUB_REPO_OWNER = "ash2ops";
export const POKEIDLE_GITHUB_REPO_NAME = "pokeidle_html_codex";
const SEMVER_PATTERN =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function normalizePathname(pathname) {
  const raw = String(pathname || "/").trim();
  if (!raw || raw === "/") {
    return "/";
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function isProductionGithubPagesLocation(locationLike) {
  const protocol = String(locationLike?.protocol || "").trim().toLowerCase();
  const hostname = String(locationLike?.hostname || "").trim().toLowerCase();
  const pathname = normalizePathname(locationLike?.pathname || "/");
  const productionPath = normalizePathname(POKEIDLE_PRODUCTION_PATH_PREFIX);

  if (protocol !== "https:" && protocol !== "http:") {
    return false;
  }
  if (hostname !== POKEIDLE_PRODUCTION_HOSTNAME) {
    return false;
  }
  return pathname === productionPath || pathname.startsWith(`${productionPath}/`);
}

export function getGithubRepositoryFromLocation(
  locationLike,
  fallbackOwner = POKEIDLE_GITHUB_REPO_OWNER,
  fallbackRepo = POKEIDLE_GITHUB_REPO_NAME,
) {
  const hostname = String(locationLike?.hostname || "").trim().toLowerCase();
  const pathname = normalizePathname(locationLike?.pathname || "/");
  const isGithubPagesHost = hostname.endsWith(".github.io");
  const inferredOwner = isGithubPagesHost ? hostname.split(".")[0] : "";
  const inferredRepo = isGithubPagesHost ? pathname.split("/").filter(Boolean)[0] || "" : "";
  return {
    owner: inferredOwner || String(fallbackOwner || "").trim(),
    repo: inferredRepo || String(fallbackRepo || "").trim(),
  };
}

export function getDisplayedAppVersion(locationLike, baseVersion = POKEIDLE_APP_VERSION) {
  return isProductionGithubPagesLocation(locationLike)
    ? String(baseVersion || "")
    : `${String(baseVersion || "")} dev-mode`;
}

function parseSemverIdentifier(rawIdentifier) {
  if (/^\d+$/.test(rawIdentifier)) {
    return {
      type: "numeric",
      value: Number(rawIdentifier),
    };
  }
  return {
    type: "string",
    value: String(rawIdentifier || ""),
  };
}

function compareSemverIdentifier(leftRaw, rightRaw) {
  const left = parseSemverIdentifier(leftRaw);
  const right = parseSemverIdentifier(rightRaw);
  if (left.type === "numeric" && right.type === "numeric") {
    return left.value - right.value;
  }
  if (left.type === "numeric" && right.type === "string") {
    return -1;
  }
  if (left.type === "string" && right.type === "numeric") {
    return 1;
  }
  if (left.value === right.value) {
    return 0;
  }
  return left.value < right.value ? -1 : 1;
}

export function parseSemver(versionLike) {
  const raw = String(versionLike || "").trim();
  const match = SEMVER_PATTERN.exec(raw);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : [],
    build: match[5] ? match[5].split(".") : [],
  };
}

export function compareSemver(leftVersionLike, rightVersionLike) {
  const left = parseSemver(leftVersionLike);
  const right = parseSemver(rightVersionLike);
  if (!left || !right) {
    return null;
  }

  if (left.major !== right.major) {
    return left.major < right.major ? -1 : 1;
  }
  if (left.minor !== right.minor) {
    return left.minor < right.minor ? -1 : 1;
  }
  if (left.patch !== right.patch) {
    return left.patch < right.patch ? -1 : 1;
  }

  const leftHasPrerelease = left.prerelease.length > 0;
  const rightHasPrerelease = right.prerelease.length > 0;
  if (!leftHasPrerelease && !rightHasPrerelease) {
    return 0;
  }
  if (!leftHasPrerelease) {
    return 1;
  }
  if (!rightHasPrerelease) {
    return -1;
  }

  const maxIdentifiers = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < maxIdentifiers; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];
    if (leftIdentifier === undefined) {
      return -1;
    }
    if (rightIdentifier === undefined) {
      return 1;
    }
    const identifierComparison = compareSemverIdentifier(leftIdentifier, rightIdentifier);
    if (identifierComparison !== 0) {
      return identifierComparison < 0 ? -1 : 1;
    }
  }
  return 0;
}

export function isVersionAtLeast(versionLike, minVersionLike) {
  const comparison = compareSemver(versionLike, minVersionLike);
  if (comparison === null) {
    return false;
  }
  return comparison >= 0;
}

if (typeof window !== "undefined") {
  window.POKEIDLE_APP_VERSION = POKEIDLE_APP_VERSION;
  window.POKEIDLE_DISPLAY_VERSION = getDisplayedAppVersion(window.location);
}
