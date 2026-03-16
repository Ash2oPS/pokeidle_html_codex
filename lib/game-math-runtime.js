function fallbackClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function trimCompactNumberFraction(text) {
  return String(text || "").replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
}

export function createGameMathUtils({
  clamp,
  toSafeInt,
  compactNumberSuffixes = [],
} = {}) {
  const safeClamp = typeof clamp === "function" ? clamp : fallbackClamp;
  const safeToInt = typeof toSafeInt === "function" ? toSafeInt : fallbackToSafeInt;

  function calcLevel(stats, bonus = 0) {
    const hp = Number(stats?.hp || 0);
    const attack = Number(stats?.attack || 0);
    const defense = Number(stats?.defense || 0);
    const speed = Number(stats?.speed || 0);
    const specialAttack = Number(stats?.["special-attack"] || 0);
    const specialDefense = Number(stats?.["special-defense"] || 0);
    const sum = hp + attack + defense + speed + specialAttack + specialDefense;
    return safeClamp(Math.round(sum / 12) + bonus, 1, 100);
  }

  function randomInt(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  function randomRange(min, max) {
    const low = Number(min);
    const high = Number(max);
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      return 0;
    }
    if (high <= low) {
      return low;
    }
    return low + Math.random() * (high - low);
  }

  function easeInOutSine(value) {
    const t = safeClamp(Number(value) || 0, 0, 1);
    return -(Math.cos(Math.PI * t) - 1) * 0.5;
  }

  function lerpNumber(a, b, t) {
    const start = Number(a) || 0;
    const end = Number(b) || 0;
    const ratio = safeClamp(Number(t) || 0, 0, 1);
    return start + (end - start) * ratio;
  }

  function pseudoRandomUnit(seed) {
    const value = Math.sin((Number(seed) || 0) * 12.9898 + 78.233) * 43758.5453123;
    return value - Math.floor(value);
  }

  function hashStringToUnit(text) {
    const source = String(text || "");
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967296;
  }

  function padTwoDigits(value) {
    return String(Math.max(0, safeToInt(value, 0))).padStart(2, "0");
  }

  function formatCompactNumber(value, options = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "0";
    }
    const absolute = Math.abs(numeric);
    const sign = numeric < 0 ? "-" : "";
    if (absolute < 1000) {
      return sign + String(Math.round(absolute));
    }

    const decimalsSmall = Math.max(0, safeToInt(options.decimalsSmall, 2));
    const decimalsMedium = Math.max(0, safeToInt(options.decimalsMedium, 1));
    const decimalsLarge = Math.max(0, safeToInt(options.decimalsLarge, 0));
    for (let i = 0; i < compactNumberSuffixes.length; i += 1) {
      const step = compactNumberSuffixes[i];
      if (absolute < step.value) {
        continue;
      }
      const scaled = absolute / step.value;
      const decimals = scaled >= 100 ? decimalsLarge : scaled >= 10 ? decimalsMedium : decimalsSmall;
      const rounded = Number(scaled.toFixed(decimals));
      if (rounded >= 1000 && i > 0) {
        const largerStep = compactNumberSuffixes[i - 1];
        const largerScaled = absolute / largerStep.value;
        const largerDecimals = largerScaled >= 100 ? decimalsLarge : largerScaled >= 10 ? decimalsMedium : decimalsSmall;
        const largerText = trimCompactNumberFraction(largerScaled.toFixed(largerDecimals));
        return `${sign}${largerText}${largerStep.suffix}`;
      }
      const numberText = trimCompactNumberFraction(scaled.toFixed(decimals));
      return `${sign}${numberText}${step.suffix}`;
    }

    return sign + String(Math.round(absolute));
  }

  return {
    calcLevel,
    randomInt,
    randomRange,
    easeInOutSine,
    lerpNumber,
    pseudoRandomUnit,
    hashStringToUnit,
    padTwoDigits,
    formatCompactNumber,
  };
}
