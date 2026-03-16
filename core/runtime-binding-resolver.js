const WINDOW_BOUND_FUNCTION_NAMES = new Set([
  "addEventListener",
  "alert",
  "cancelAnimationFrame",
  "cancelIdleCallback",
  "clearInterval",
  "clearTimeout",
  "confirm",
  "dispatchEvent",
  "fetch",
  "getComputedStyle",
  "matchMedia",
  "prompt",
  "queueMicrotask",
  "removeEventListener",
  "requestAnimationFrame",
  "requestIdleCallback",
  "setInterval",
  "setTimeout",
]);

function getWindowRef() {
  if (typeof window !== "undefined" && window) {
    return window;
  }
  if (typeof globalThis !== "undefined" && globalThis?.window) {
    return globalThis.window;
  }
  return null;
}

function bindWindowFunctionIfNeeded(name, value) {
  if (typeof value !== "function" || !WINDOW_BOUND_FUNCTION_NAMES.has(name)) {
    return value;
  }
  const windowRef = getWindowRef();
  if (!windowRef || windowRef[name] !== value) {
    return value;
  }
  try {
    return value.bind(windowRef);
  } catch {
    return value;
  }
}

export function createRuntimeBindingResolver(bindingGetters = {}) {
  const getters =
    bindingGetters && typeof bindingGetters === "object" ? bindingGetters : {};

  return function resolveRuntimeBinding(name) {
    if (typeof name !== "string" || name.length === 0) {
      return undefined;
    }
    const getter = getters[name];
    if (typeof getter !== "function") {
      return undefined;
    }
    try {
      return bindWindowFunctionIfNeeded(name, getter());
    } catch {
      return undefined;
    }
  };
}
