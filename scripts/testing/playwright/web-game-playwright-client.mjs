import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const BUTTON_NAME_TO_KEY = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  enter: "Enter",
  space: "Space",
  a: "KeyA",
  b: "KeyB",
};

export function parseArgs(argv) {
  const args = {
    url: null,
    iterations: 1,
    pauseMs: 500,
    headless: true,
    screenshotDir: "output/web-game",
    actionsFile: null,
    actionsJson: null,
    click: null,
    viewportWidth: 1366,
    viewportHeight: 768,
    touch: false,
    deviceScaleFactor: 1,
    fullPage: true,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--url" && next) {
      args.url = next;
      i += 1;
    } else if (arg === "--iterations" && next) {
      args.iterations = Number(next) || 0;
      i += 1;
    } else if (arg === "--pause-ms" && next) {
      args.pauseMs = Number(next) || 0;
      i += 1;
    } else if (arg === "--screenshot-dir" && next) {
      args.screenshotDir = next;
      i += 1;
    } else if (arg === "--actions-file" && next) {
      args.actionsFile = next;
      i += 1;
    } else if (arg === "--actions-json" && next) {
      args.actionsJson = next;
      i += 1;
    } else if (arg === "--headless" && next) {
      args.headless = next !== "0" && next !== "false";
      i += 1;
    } else if (arg === "--click" && next) {
      const parts = next.split(",").map((value) => parseFloat(value.trim()));
      if (parts.length === 2 && parts.every((value) => Number.isFinite(value))) {
        args.click = { x: parts[0], y: parts[1] };
      }
      i += 1;
    } else if (arg === "--viewport-width" && next) {
      args.viewportWidth = Number(next) || args.viewportWidth;
      i += 1;
    } else if (arg === "--viewport-height" && next) {
      args.viewportHeight = Number(next) || args.viewportHeight;
      i += 1;
    } else if (arg === "--touch" && next) {
      args.touch = next === "1" || next === "true";
      i += 1;
    } else if (arg === "--device-scale-factor" && next) {
      args.deviceScaleFactor = Number(next) || args.deviceScaleFactor;
      i += 1;
    } else if (arg === "--full-page" && next) {
      args.fullPage = next !== "0" && next !== "false";
      i += 1;
    }
  }

  if (!args.url) {
    throw new Error("--url is required");
  }
  if (!Number.isFinite(args.iterations) || args.iterations < 1) {
    throw new Error("--iterations must be a positive integer");
  }
  if (!Number.isFinite(args.pauseMs) || args.pauseMs < 0) {
    throw new Error("--pause-ms must be a non-negative integer");
  }
  if (!args.actionsFile && !args.actionsJson && !args.click) {
    throw new Error("--actions-file, --actions-json or --click is required");
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function loadStepsFromSource(source) {
  if (!source) {
    return null;
  }
  const parsed = JSON.parse(source);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.steps)) {
    return parsed.steps;
  }
  return null;
}

export function sanitizeCaptureName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeVirtualTimeShim() {
  return `(() => {
    const pending = new Set();
    const origSetTimeout = window.setTimeout.bind(window);
    const origSetInterval = window.setInterval.bind(window);
    const origRequestAnimationFrame = window.requestAnimationFrame.bind(window);

    window.__vt_pending = pending;

    window.setTimeout = (fn, t, ...rest) => {
      const task = {};
      pending.add(task);
      return origSetTimeout(() => {
        pending.delete(task);
        fn(...rest);
      }, t);
    };

    window.setInterval = (fn, t, ...rest) => {
      const task = {};
      pending.add(task);
      return origSetInterval(() => {
        pending.delete(task);
        fn(...rest);
      }, t);
    };

    window.requestAnimationFrame = (fn) => {
      const task = {};
      pending.add(task);
      return origRequestAnimationFrame((ts) => {
        pending.delete(task);
        fn(ts);
      });
    };

    window.advanceTime = (ms) => {
      return new Promise((resolve) => {
        const start = performance.now();
        function step(now) {
          if (now - start >= ms) return resolve();
          origRequestAnimationFrame(step);
        }
        origRequestAnimationFrame(step);
      });
    };
  })();`;
}

async function getCanvasHandle(page) {
  const handle = await page.evaluateHandle(() => {
    let best = null;
    let bestArea = 0;
    for (const canvas of document.querySelectorAll("canvas")) {
      const width = canvas.width || canvas.clientWidth || 0;
      const height = canvas.height || canvas.clientHeight || 0;
      const area = width * height;
      if (area > bestArea) {
        bestArea = area;
        best = canvas;
      }
    }
    return best;
  });
  return handle.asElement?.() ?? null;
}

async function doSteps(page, canvas, steps) {
  for (const step of steps) {
    const buttons = new Set(step.buttons || []);
    const bbox = canvas ? await canvas.boundingBox() : null;

    for (const button of buttons) {
      if (button === "left_mouse_button" || button === "right_mouse_button") {
        if (!bbox) {
          continue;
        }
        const x = Number.isFinite(step.mouse_x) ? step.mouse_x : bbox.width / 2;
        const y = Number.isFinite(step.mouse_y) ? step.mouse_y : bbox.height / 2;
        await page.mouse.move(bbox.x + x, bbox.y + y);
        await page.mouse.down({ button: button === "left_mouse_button" ? "left" : "right" });
      } else if (BUTTON_NAME_TO_KEY[button]) {
        await page.keyboard.down(BUTTON_NAME_TO_KEY[button]);
      }
    }

    const frames = Math.max(1, Number(step.frames) || 1);
    for (let i = 0; i < frames; i += 1) {
      await page.evaluate(() => {
        if (typeof window.advanceTime === "function") {
          return window.advanceTime(1000 / 60);
        }
        return Promise.resolve();
      });
    }

    for (const button of buttons) {
      if (button === "left_mouse_button" || button === "right_mouse_button") {
        await page.mouse.up({ button: button === "left_mouse_button" ? "left" : "right" });
      } else if (BUTTON_NAME_TO_KEY[button]) {
        await page.keyboard.up(BUTTON_NAME_TO_KEY[button]);
      }
    }
  }
}

async function clickSelector(page, selector, options = {}) {
  const locator = page.locator(selector).first();
  await locator.waitFor({
    state: options.waitState || "attached",
    timeout: options.timeout || 10_000,
  });
  try {
    await locator.click({ force: options.force !== false });
    return true;
  } catch {
    const clicked = await page.evaluate((query) => {
      const element = document.querySelector(query);
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      element.click();
      return true;
    }, selector);
    if (!clicked) {
      throw new Error(`Unable to click selector: ${selector}`);
    }
    return true;
  }
}

async function clickSelectorIfVisible(page, selector, options = {}) {
  const locator = page.locator(selector).first();
  if ((await locator.count()) <= 0) {
    return false;
  }
  try {
    if (!(await locator.isVisible())) {
      return false;
    }
  } catch {
    return false;
  }
  try {
    await locator.click({ force: options.force !== false });
  } catch {
    await page.evaluate((query) => {
      const element = document.querySelector(query);
      if (element instanceof HTMLElement) {
        element.click();
      }
    }, selector);
  }
  return true;
}

async function waitForStepSelector(page, selector, options = {}) {
  const locator = page.locator(selector).first();
  await locator.waitFor({
    state: options.state || "visible",
    timeout: options.timeout || 10_000,
  });
}

class ConsoleErrorTracker {
  constructor() {
    this.seen = new Set();
    this.errors = [];
  }

  ingest(error) {
    const key = JSON.stringify(error);
    if (this.seen.has(key)) {
      return;
    }
    this.seen.add(key);
    this.errors.push(error);
  }

  drain() {
    const nextErrors = [...this.errors];
    this.errors = [];
    return nextErrors;
  }
}

async function writeStateSnapshot(page, dir, index) {
  const stateText = await page.evaluate(() => {
    if (typeof window.render_game_to_text === "function") {
      return window.render_game_to_text();
    }
    return null;
  });
  const snapshotText = stateText || JSON.stringify({ renderStateAvailable: false }, null, 2);
  fs.writeFileSync(path.join(dir, `state-${index}.json`), snapshotText);
  if (index === 0) {
    fs.writeFileSync(path.join(dir, "state.json"), snapshotText);
  }
}

async function writeNamedStateSnapshot(page, dir, name) {
  const stateText = await page.evaluate(() => {
    if (typeof window.render_game_to_text === "function") {
      return window.render_game_to_text();
    }
    return null;
  });
  const snapshotText = stateText || JSON.stringify({ renderStateAvailable: false }, null, 2);
  fs.writeFileSync(path.join(dir, `${name}.json`), snapshotText);
}

async function captureStageShot(page, dir, index) {
  const stagePath = path.join(dir, `stage-${index}.png`);
  const stageLocator = page.locator("#game-capture-root");
  if ((await stageLocator.count()) > 0) {
    await stageLocator.first().screenshot({
      path: stagePath,
      omitBackground: false,
    });
    if (index === 0) {
      fs.copyFileSync(stagePath, path.join(dir, "stage.png"));
    }
    return stagePath;
  }
  await page.screenshot({ path: stagePath, omitBackground: false });
  if (index === 0) {
    fs.copyFileSync(stagePath, path.join(dir, "stage.png"));
  }
  return stagePath;
}

async function captureFullPageShot(page, dir, index, fullPage) {
  const shotPath = path.join(dir, `fullpage-${index}.png`);
  await page.screenshot({
    path: shotPath,
    fullPage,
    omitBackground: false,
  });
  if (index === 0) {
    fs.copyFileSync(shotPath, path.join(dir, "fullpage.png"));
  }
  return shotPath;
}

async function captureNamedStageShot(page, dir, name) {
  const shotPath = path.join(dir, `${name}.png`);
  const stageLocator = page.locator("#game-capture-root");
  if ((await stageLocator.count()) > 0) {
    await stageLocator.first().screenshot({
      path: shotPath,
      omitBackground: false,
    });
    return shotPath;
  }
  await page.screenshot({ path: shotPath, omitBackground: false });
  return shotPath;
}

async function captureNamedFullPageShot(page, dir, name, fullPage) {
  const shotPath = path.join(dir, `${name}-fullpage.png`);
  await page.screenshot({
    path: shotPath,
    fullPage,
    omitBackground: false,
  });
  return shotPath;
}

async function setSelectorScrollTop(page, selector, top, options = {}) {
  const locator = page.locator(selector).first();
  await locator.waitFor({
    state: options.waitState || "attached",
    timeout: options.timeout || 10_000,
  });
  await page.evaluate(({ query, nextTop }) => {
    const element = document.querySelector(query);
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    element.scrollTop = Number(nextTop) || 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
    return true;
  }, {
    query: selector,
    nextTop: top,
  });
}

async function executeDirectiveStep(page, canvas, step, options = {}) {
  if (step.waitForSelector) {
    await waitForStepSelector(page, step.waitForSelector, {
      state: step.waitForState,
      timeout: step.waitTimeout,
    });
  }

  if (step.clickSelector) {
    await clickSelector(page, step.clickSelector, {
      force: step.force,
      timeout: step.clickTimeout,
      waitState: step.clickWaitState,
    });
  }

  if (step.clickSelectorIfVisible) {
    await clickSelectorIfVisible(page, step.clickSelectorIfVisible, {
      force: step.force,
    });
  }

  if (step.setScrollTop && step.setScrollTop.selector) {
    await setSelectorScrollTop(
      page,
      step.setScrollTop.selector,
      step.setScrollTop.top,
      {
        timeout: step.setScrollTop.timeout,
        waitState: step.setScrollTop.waitState,
      },
    );
  }

  if (step.buttons || Number.isFinite(step.frames)) {
    await doSteps(page, canvas, [step]);
  }

  if (Number.isFinite(step.waitMs) && step.waitMs > 0) {
    await page.waitForTimeout(step.waitMs);
  }

  const captureName = sanitizeCaptureName(step.captureName);
  if (captureName) {
    await captureNamedStageShot(page, options.screenshotDir, captureName);
    if (step.captureState !== false) {
      await writeNamedStateSnapshot(page, options.screenshotDir, captureName);
    }
    if (step.captureFullPage === true) {
      await captureNamedFullPageShot(page, options.screenshotDir, captureName, options.fullPage);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  ensureDir(args.screenshotDir);

  let steps = null;
  if (args.actionsFile) {
    steps = loadStepsFromSource(fs.readFileSync(args.actionsFile, "utf8"));
  } else if (args.actionsJson) {
    steps = loadStepsFromSource(args.actionsJson);
  } else if (args.click) {
    steps = [{
      buttons: ["left_mouse_button"],
      frames: 2,
      mouse_x: args.click.x,
      mouse_y: args.click.y,
    }];
  }
  if (!steps) {
    throw new Error("Actions could not be resolved from the provided source.");
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: args.headless });
    const context = await browser.newContext({
      viewport: {
        width: Math.max(320, args.viewportWidth),
        height: Math.max(320, args.viewportHeight),
      },
      hasTouch: args.touch,
      isMobile: args.touch,
      deviceScaleFactor: Math.max(1, args.deviceScaleFactor),
    });
    const page = await context.newPage();
    const consoleTracker = new ConsoleErrorTracker();

    await page.addInitScript({ content: makeVirtualTimeShim() });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleTracker.ingest({ type: "console.error", text: message.text() });
      }
    });
    page.on("pageerror", (error) => {
      consoleTracker.ingest({ type: "pageerror", text: String(error) });
    });

    await page.goto(args.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.locator("#game-capture-root").first().waitFor({ state: "attached", timeout: 5000 }).catch(() => {});

    let canvas = await getCanvasHandle(page);
    for (let i = 0; i < args.iterations; i += 1) {
      if (!canvas) {
        canvas = await getCanvasHandle(page);
      }
      for (const step of steps) {
        await executeDirectiveStep(page, canvas, step, {
          screenshotDir: args.screenshotDir,
          fullPage: args.fullPage,
        });
      }
      await page.waitForTimeout(args.pauseMs);
      await captureStageShot(page, args.screenshotDir, i);
      await captureFullPageShot(page, args.screenshotDir, i, args.fullPage);
      await writeStateSnapshot(page, args.screenshotDir, i);

      const errors = consoleTracker.drain();
      fs.writeFileSync(
        path.join(args.screenshotDir, `errors-${i}.json`),
        JSON.stringify(errors, null, 2),
      );
      if (i === 0) {
        fs.writeFileSync(
          path.join(args.screenshotDir, "errors.json"),
          JSON.stringify(errors, null, 2),
        );
      }
      if (errors.length > 0) {
        break;
      }
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
