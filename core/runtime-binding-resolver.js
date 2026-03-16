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
      return getter();
    } catch {
      return undefined;
    }
  };
}
