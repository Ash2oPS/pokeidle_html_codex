import test from "node:test";
import assert from "node:assert/strict";

import {
  compareSemver,
  getDisplayedAppVersion,
  isProductionGithubPagesLocation,
  isVersionAtLeast,
} from "../version.js";

test("isProductionGithubPagesLocation matches the real production GitHub Pages url", () => {
  assert.equal(
    isProductionGithubPagesLocation({
      protocol: "https:",
      hostname: "ash2ops.github.io",
      pathname: "/pokeidle_html_codex/",
    }),
    true,
  );
  assert.equal(
    isProductionGithubPagesLocation({
      protocol: "https:",
      hostname: "ash2ops.github.io",
      pathname: "/pokeidle_html_codex/index.html",
    }),
    true,
  );
});

test("isProductionGithubPagesLocation rejects local servers", () => {
  assert.equal(
    isProductionGithubPagesLocation({
      protocol: "http:",
      hostname: "127.0.0.1",
      pathname: "/",
    }),
    false,
  );
  assert.equal(
    isProductionGithubPagesLocation({
      protocol: "http:",
      hostname: "localhost",
      pathname: "/pokeidle_html_codex/",
    }),
    false,
  );
});

test("getDisplayedAppVersion appends dev-mode outside production GitHub Pages", () => {
  assert.equal(
    getDisplayedAppVersion(
      {
        protocol: "https:",
        hostname: "ash2ops.github.io",
        pathname: "/pokeidle_html_codex/",
      },
      "0.1.1",
    ),
    "0.1.1",
  );
  assert.equal(
    getDisplayedAppVersion(
      {
        protocol: "http:",
        hostname: "192.168.1.24",
        pathname: "/",
      },
      "0.1.1",
    ),
    "0.1.1 dev-mode",
  );
});

test("compareSemver respects prerelease precedence", () => {
  assert.equal(compareSemver("0.1.0-alpha.8", "0.1.0-alpha.9"), -1);
  assert.equal(compareSemver("0.1.1-alpha.1", "0.1.1"), -1);
  assert.equal(compareSemver("0.1.1", "0.1.1"), 0);
  assert.equal(compareSemver("0.1.2", "0.1.1"), 1);
});

test("isVersionAtLeast returns false on invalid semver", () => {
  assert.equal(isVersionAtLeast("dev-mode", "0.1.1"), false);
  assert.equal(isVersionAtLeast("0.1.0-alpha.8", "0.1.1"), false);
  assert.equal(isVersionAtLeast("0.1.1", "0.1.1"), true);
});
