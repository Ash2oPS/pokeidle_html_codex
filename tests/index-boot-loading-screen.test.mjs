import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const INDEX_HTML_PATH = resolve(process.cwd(), "index.html");

function readIndexDom() {
  const html = readFileSync(INDEX_HTML_PATH, "utf8");
  return new JSDOM(html).window.document;
}

test("index.html pre-renders the boot loading screen inside the runtime root", () => {
  const document = readIndexDom();
  const runtimeRoot = document.getElementById("runtime-ui-root");

  assert.ok(runtimeRoot);

  const loadingScreen = runtimeRoot.querySelector("#loading-screen.loading-screen.is-visible");
  assert.ok(loadingScreen);
  assert.equal(loadingScreen.getAttribute("aria-label"), "Chargement");
  assert.ok(loadingScreen.querySelector(".loading-screen-core"));
  assert.ok(loadingScreen.querySelector(".loading-pokeball"));
  assert.match(
    loadingScreen.querySelector("#loading-screen-text")?.textContent ?? "",
    /enti\u00e8rement g\u00e9n\u00e9r\u00e9 par IA/i,
  );
});

test("index.html boot loading screen includes critical inline styles for the first paint", () => {
  const html = readFileSync(INDEX_HTML_PATH, "utf8");

  assert.match(html, /#runtime-ui-root > \.loading-screen\.is-visible/);
  assert.match(html, /position:\s*fixed/);
  assert.match(html, /background:\s*#000/);
  assert.match(html, /loading-pokeball-spin/);
});
