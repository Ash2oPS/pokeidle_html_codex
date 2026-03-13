import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHECKER_MODULE_URL = pathToFileURL(path.resolve("lib/github-update-checker.js")).href;

function createResponse({ ok = true, status = 200, text = "", json = {} } = {}) {
  return {
    ok,
    status,
    async text() {
      return text;
    },
    async json() {
      return json;
    },
  };
}

function createDocumentStub() {
  return {
    body: {
      classList: {
        add() {},
      },
      append() {},
    },
    activeElement: null,
    createElement() {
      return {
        id: "",
        className: "",
        setAttribute() {},
        classList: {
          add() {},
          remove() {},
          contains() {
            return false;
          },
        },
      };
    },
    getElementById() {
      return null;
    },
  };
}

function createWindowStub(url) {
  const location = new URL(url);
  return {
    location,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setInterval() {
      return 1;
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

async function importFreshCheckerModule() {
  return import(`${CHECKER_MODULE_URL}?t=${Date.now()}_${Math.random()}`);
}

async function withBrowserEnvironment(url, run) {
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    fetch: globalThis.fetch,
    Node: globalThis.Node,
  };

  globalThis.window = createWindowStub(url);
  globalThis.document = createDocumentStub();
  globalThis.fetch = undefined;
  globalThis.Node = class {};

  try {
    await run(globalThis.window);
  } finally {
    globalThis.window = previousGlobals.window;
    globalThis.document = previousGlobals.document;
    globalThis.fetch = previousGlobals.fetch;
    globalThis.Node = previousGlobals.Node;
  }
}

test("initializeGithubUpdateChecker uses 5-minute polling and checks deployed version first", async () => {
  await withBrowserEnvironment("https://ash2ops.github.io/pokeidle_html_codex/index.html", async (window) => {
    const fetchCalls = [];
    globalThis.fetch = async (urlLike) => {
      const url = String(urlLike || "");
      fetchCalls.push(url);
      if (url.includes("/pokeidle_html_codex/version.js")) {
        return createResponse({
          ok: true,
          status: 200,
          text: 'export const POKEIDLE_APP_VERSION = "0.1.12";',
        });
      }
      if (url.includes("/pokeidle_html_codex/package.json")) {
        return createResponse({ ok: false, status: 404, text: "" });
      }
      if (url.includes("api.github.com")) {
        throw new Error("GitHub API should not be called when deployed version.js is available.");
      }
      return createResponse({ ok: false, status: 404, text: "" });
    };

    let intervalMs = null;
    window.setInterval = (_callback, ms) => {
      intervalMs = ms;
      return 1;
    };

    const { initializeGithubUpdateChecker } = await importFreshCheckerModule();
    initializeGithubUpdateChecker({ currentVersion: "0.1.12" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(intervalMs, 5 * 60 * 1000);
    assert.ok(fetchCalls[0]?.startsWith("https://ash2ops.github.io/pokeidle_html_codex/version.js"));
    assert.equal(fetchCalls.some((entry) => entry.includes("api.github.com")), false);
  });
});

test("initializeGithubUpdateChecker falls back to GitHub API when deployed files are unavailable", async () => {
  await withBrowserEnvironment("https://ash2ops.github.io/pokeidle_html_codex/index.html", async (window) => {
    const fetchCalls = [];
    globalThis.fetch = async (urlLike) => {
      const url = String(urlLike || "");
      fetchCalls.push(url);

      if (url.includes("/pokeidle_html_codex/version.js")) {
        return createResponse({ ok: false, status: 404, text: "" });
      }
      if (url.includes("/pokeidle_html_codex/package.json")) {
        return createResponse({ ok: false, status: 404, text: "" });
      }
      if (url === "https://api.github.com/repos/ash2ops/pokeidle_html_codex") {
        return createResponse({
          ok: true,
          status: 200,
          json: { default_branch: "main" },
        });
      }
      if (url === "https://api.github.com/repos/ash2ops/pokeidle_html_codex/contents/version.js?ref=main") {
        return createResponse({
          ok: true,
          status: 200,
          json: {
            content: Buffer.from('export const POKEIDLE_APP_VERSION = "0.1.12";', "utf8").toString("base64"),
          },
        });
      }
      if (url === "https://api.github.com/repos/ash2ops/pokeidle_html_codex/contents/package.json?ref=main") {
        return createResponse({
          ok: true,
          status: 200,
          json: {
            content: Buffer.from('{"version":"0.1.12"}', "utf8").toString("base64"),
          },
        });
      }
      throw new Error(`Unexpected fetch URL during update check: ${url}`);
    };

    window.setInterval = () => 1;

    const { initializeGithubUpdateChecker } = await importFreshCheckerModule();
    initializeGithubUpdateChecker({ currentVersion: "0.1.12" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.ok(fetchCalls.some((entry) => entry.includes("/pokeidle_html_codex/version.js")));
    assert.ok(fetchCalls.some((entry) => entry.includes("/pokeidle_html_codex/package.json")));
    assert.ok(fetchCalls.includes("https://api.github.com/repos/ash2ops/pokeidle_html_codex"));
    assert.ok(
      fetchCalls.includes("https://api.github.com/repos/ash2ops/pokeidle_html_codex/contents/version.js?ref=main"),
    );
  });
});
