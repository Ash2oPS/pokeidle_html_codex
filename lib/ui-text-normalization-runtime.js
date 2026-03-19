import { normalizeUiDisplayText } from "./text-normalization.js";

const TREE_WALKER_SHOW_ELEMENT = 0x1;
const TREE_WALKER_SHOW_TEXT = 0x4;
const OBSERVED_ATTRIBUTE_NAMES = Object.freeze(["aria-label", "placeholder", "title", "alt"]);
const SKIPPED_TAG_NAMES = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

function createNormalizeTextFn(normalizeText) {
  if (typeof normalizeText === "function") {
    return normalizeText;
  }
  return (value) => normalizeUiDisplayText(value, { frenchTypography: true });
}

function shouldSkipTextNode(node) {
  const parentTagName = String(node?.parentElement?.tagName || "").toUpperCase();
  return SKIPPED_TAG_NAMES.has(parentTagName);
}

function normalizeTextNode(textNode, normalizeText) {
  if (!textNode || shouldSkipTextNode(textNode)) {
    return;
  }
  const currentValue = String(textNode.nodeValue ?? "");
  if (!currentValue) {
    return;
  }
  const nextValue = normalizeText(currentValue);
  if (nextValue !== currentValue) {
    textNode.nodeValue = nextValue;
  }
}

function normalizeElementAttributes(element, normalizeText, attributeNames = OBSERVED_ATTRIBUTE_NAMES) {
  if (!element || typeof element.getAttribute !== "function") {
    return;
  }
  for (const attributeName of attributeNames) {
    if (!attributeName || !element.hasAttribute(attributeName)) {
      continue;
    }
    const currentValue = String(element.getAttribute(attributeName) ?? "");
    if (!currentValue) {
      continue;
    }
    const nextValue = normalizeText(currentValue);
    if (nextValue !== currentValue) {
      element.setAttribute(attributeName, nextValue);
    }
  }
}

function normalizeNodeAndChildren(node, normalizeText, attributeNames = OBSERVED_ATTRIBUTE_NAMES) {
  if (!node) {
    return;
  }
  const documentRef = node.ownerDocument || (node.nodeType === 9 ? node : null);
  if (node.nodeType === 3) {
    normalizeTextNode(node, normalizeText);
    return;
  }
  if (node.nodeType === 1) {
    normalizeElementAttributes(node, normalizeText, attributeNames);
  }
  if (!documentRef || typeof documentRef.createTreeWalker !== "function") {
    return;
  }

  const walker = documentRef.createTreeWalker(node, TREE_WALKER_SHOW_ELEMENT | TREE_WALKER_SHOW_TEXT);
  let currentNode = walker.currentNode;
  while (currentNode) {
    if (currentNode.nodeType === 1) {
      normalizeElementAttributes(currentNode, normalizeText, attributeNames);
    } else if (currentNode.nodeType === 3) {
      normalizeTextNode(currentNode, normalizeText);
    }
    currentNode = walker.nextNode();
  }
}

export function createUiTextNormalizationRuntime({
  rootEl,
  normalizeText,
  attributeNames = OBSERVED_ATTRIBUTE_NAMES,
  MutationObserverCtor,
} = {}) {
  const normalizeTextFn = createNormalizeTextFn(normalizeText);
  let observer = null;
  let applying = false;

  function withGuard(callback) {
    if (applying) {
      return;
    }
    applying = true;
    try {
      callback();
    } finally {
      applying = false;
    }
  }

  function normalizeNow() {
    if (!rootEl) {
      return;
    }
    withGuard(() => {
      normalizeNodeAndChildren(rootEl, normalizeTextFn, attributeNames);
    });
  }

  function resolveMutationObserverCtor() {
    if (typeof MutationObserverCtor === "function") {
      return MutationObserverCtor;
    }
    const windowRef = rootEl?.ownerDocument?.defaultView;
    return windowRef?.MutationObserver || globalThis.MutationObserver || null;
  }

  function start() {
    normalizeNow();
    if (!rootEl || observer) {
      return;
    }
    const SafeMutationObserver = resolveMutationObserverCtor();
    if (typeof SafeMutationObserver !== "function") {
      return;
    }
    observer = new SafeMutationObserver((mutations) => {
      withGuard(() => {
        for (const mutation of mutations || []) {
          if (mutation.type === "characterData") {
            normalizeTextNode(mutation.target, normalizeTextFn);
            continue;
          }
          if (mutation.type === "attributes") {
            normalizeElementAttributes(mutation.target, normalizeTextFn, attributeNames);
            continue;
          }
          if (mutation.type === "childList") {
            for (const node of mutation.addedNodes || []) {
              normalizeNodeAndChildren(node, normalizeTextFn, attributeNames);
            }
          }
        }
      });
    });
    observer.observe(rootEl, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: Array.from(attributeNames),
    });
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  return {
    normalizeNow,
    start,
    stop,
  };
}
