export function createRuntimeConfigLoaders({
  fetchFn = (...args) => fetch(...args),
  parseCsvObjects,
  parseCsvMethods,
  readCsvCell,
  readCsvNumberCell,
  readCsvBooleanCell,
  readCsvTypedValue,
  normalizeTalentDefinition,
  normalizeTalentId,
  normalizeUiDisplayText,
  assertValidBallConfig,
  assertValidShopItemConfig,
  assertValidEncounter,
  hasImplementedTalentEffect,
  toSafeInt,
  clamp,
  pokemonTalentsCsvPath,
  ballConfigCsvPath,
  shopItemsCsvPath,
  routeEncountersCsvPath,
  defaultBallConfigByType,
  defaultExtraShopItemsById,
  defaultWildLevelMin,
  defaultWildLevelMax,
  maxLevel,
  shopTabCombat = "combat",
}) {
  function warnRuntimeDataValidation(message, error) {
    const detail = error instanceof Error ? error.message : String(error || "");
    console.warn(`[pokeidle:data] ${message}${detail ? `: ${detail}` : ""}`);
  }

  function normalizePokemonTalentFromCsvRow(row, fallbackTalent = null) {
    const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
    if (pokemonId <= 0) {
      return null;
    }

    const fallback = normalizeTalentDefinition(fallbackTalent);
    const talentId = normalizeTalentId(
      readCsvCell(row, "talent_id") ||
        readCsvCell(row, "talent_name_en") ||
        readCsvCell(row, "talent_name_fr") ||
        fallback.id,
    );
    const talent = normalizeTalentDefinition({
      id: talentId,
      name_fr: readCsvCell(row, "talent_name_fr") || fallback.nameFr,
      name_en: readCsvCell(row, "talent_name_en") || fallback.nameEn,
      description_fr: readCsvCell(row, "talent_description_fr") || fallback.descriptionFr,
    });
    return {
      pokemonId,
      talent,
    };
  }

  async function loadPokemonTalentCsv(csvPath = pokemonTalentsCsvPath) {
    const resolvedPath = String(csvPath || pokemonTalentsCsvPath || "");
    const response = await fetchFn(resolvedPath);
    if (!response.ok) {
      throw new Error("Impossible de charger " + resolvedPath);
    }
    const rawCsv = await response.text();
    const rows = parseCsvObjects(rawCsv, resolvedPath);
    const talentsByPokemonId = new Map();
    const pokedexSpeciesByPokemonId = new Map();
    const unresolvedTalentIds = new Set();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
      if (pokemonId <= 0) {
        continue;
      }
      const fallbackTalent = talentsByPokemonId.get(pokemonId) || null;
      const normalized = normalizePokemonTalentFromCsvRow(row, fallbackTalent);
      if (!normalized) {
        continue;
      }
      const pokemonNameEn = String(readCsvCell(row, "pokemon_name_en")).toLowerCase().trim();
      const pokemonNameFr = normalizeUiDisplayText(readCsvCell(row, "pokemon_name_fr"), { frenchTypography: true });
      const previousPokedexSpecies = pokedexSpeciesByPokemonId.get(pokemonId) || null;
      const resolvedNameEn = pokemonNameEn || String(previousPokedexSpecies?.nameEn || "").toLowerCase().trim();
      const resolvedNameFr = pokemonNameFr || String(previousPokedexSpecies?.nameFr || "").trim();
      pokedexSpeciesByPokemonId.set(pokemonId, {
        id: pokemonId,
        nameFr: resolvedNameFr || `Pokemon ${pokemonId}`,
        nameEn: resolvedNameEn,
      });
      talentsByPokemonId.set(normalized.pokemonId, normalized.talent);

      if (!hasImplementedTalentEffect(normalized.talent.id)) {
        unresolvedTalentIds.add(normalized.talent.id);
      }
    }

    return {
      path: resolvedPath,
      rowCount: rows.length,
      talentsByPokemonId,
      pokedexSpeciesByPokemonId,
      unresolvedTalentIds: Array.from(unresolvedTalentIds.values()),
    };
  }

  function normalizeBallConfigFromCsvRow(row, fallbackConfig = null) {
    const fallback = fallbackConfig && typeof fallbackConfig === "object" ? fallbackConfig : {};
    const type = String(readCsvCell(row, "ball_type") || readCsvCell(row, "type") || fallback.type || "")
      .toLowerCase()
      .trim();
    if (!type) {
      return null;
    }
    return {
      type,
      nameFr: readCsvCell(row, "name_fr") || fallback.nameFr || type,
      price: Math.max(0, toSafeInt(readCsvCell(row, "price"), fallback.price ?? 0)),
      captureMultiplier: Math.max(0.05, readCsvNumberCell(row, "capture_multiplier", Number(fallback.captureMultiplier || 1))),
      description: readCsvCell(row, "description") || fallback.description || "",
      spritePath: readCsvCell(row, "sprite_path") || fallback.spritePath || "",
      comingSoon: readCsvBooleanCell(row, "coming_soon", Boolean(fallback.comingSoon)),
      sortOrder: Math.max(0, toSafeInt(readCsvCell(row, "sort_order"), fallback.sortOrder ?? 0)),
    };
  }

  async function loadBallConfigCsv(csvPath = ballConfigCsvPath) {
    const resolvedPath = String(csvPath || ballConfigCsvPath || "");
    const response = await fetchFn(resolvedPath);
    if (!response.ok) {
      throw new Error("Impossible de charger " + resolvedPath);
    }
    const rawCsv = await response.text();
    const rows = parseCsvObjects(rawCsv, resolvedPath);
    const configsByType = {};
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const type = String(readCsvCell(row, "ball_type") || readCsvCell(row, "type") || "").toLowerCase().trim();
      if (!type) {
        continue;
      }
      const fallback = configsByType[type] || defaultBallConfigByType[type] || null;
      const config = normalizeBallConfigFromCsvRow(row, fallback);
      if (!config) {
        continue;
      }
      try {
        const validatedConfig = assertValidBallConfig(config, `${resolvedPath} ligne ${rowIndex + 2}`);
        configsByType[validatedConfig.type] = validatedConfig;
      } catch (error) {
        warnRuntimeDataValidation(`Ball config ignoree (${type})`, error);
      }
    }
    return {
      path: resolvedPath,
      configsByType,
    };
  }

  function normalizeShopItemConfigFromCsvRow(row, fallbackConfig = null) {
    const fallback = fallbackConfig && typeof fallbackConfig === "object" ? fallbackConfig : {};
    const id = String(readCsvCell(row, "item_id") || readCsvCell(row, "id") || fallback.id || "")
      .toLowerCase()
      .trim();
    if (!id) {
      return null;
    }
    const itemType = String(readCsvCell(row, "item_type") || fallback.itemType || "")
      .toLowerCase()
      .trim();
    if (!itemType || itemType === "ball") {
      return null;
    }
    const category = String(readCsvCell(row, "category") || fallback.category || shopTabCombat)
      .toLowerCase()
      .trim();
    const stockTrackedDefault = itemType === "stone";
    const stoneType = String(readCsvCell(row, "stone_type") || fallback.stoneType || id)
      .toLowerCase()
      .trim();
    return {
      id,
      category: category || shopTabCombat,
      nameFr: readCsvCell(row, "name_fr") || fallback.nameFr || id,
      description: readCsvCell(row, "description") || fallback.description || "",
      price: Math.max(0, toSafeInt(readCsvCell(row, "price"), fallback.price ?? 0)),
      spritePath: readCsvCell(row, "sprite_path") || fallback.spritePath || "",
      itemType,
      effectKind: String(readCsvCell(row, "effect_kind") || fallback.effectKind || "")
        .toLowerCase()
        .trim(),
      effectValue: readCsvTypedValue(row, "effect_value", fallback.effectValue ?? ""),
      effectDurationMs: Math.max(0, toSafeInt(readCsvCell(row, "effect_duration_ms"), fallback.effectDurationMs ?? 0)),
      stockTracked: readCsvBooleanCell(row, "stock_tracked", fallback.stockTracked ?? stockTrackedDefault),
      sortOrder: Math.max(0, toSafeInt(readCsvCell(row, "sort_order"), fallback.sortOrder ?? 0)),
      stoneType,
      methodItem: readCsvCell(row, "method_item") || fallback.methodItem || "",
    };
  }

  async function loadShopItemConfigCsv(csvPath = shopItemsCsvPath) {
    const resolvedPath = String(csvPath || shopItemsCsvPath || "");
    const response = await fetchFn(resolvedPath);
    if (!response.ok) {
      throw new Error("Impossible de charger " + resolvedPath);
    }
    const rawCsv = await response.text();
    const rows = parseCsvObjects(rawCsv, resolvedPath);
    const configsById = {};
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const id = String(readCsvCell(row, "item_id") || readCsvCell(row, "id") || "").toLowerCase().trim();
      if (!id) {
        continue;
      }
      const fallback = configsById[id] || defaultExtraShopItemsById[id] || null;
      const config = normalizeShopItemConfigFromCsvRow(row, fallback);
      if (!config) {
        continue;
      }
      try {
        const validatedConfig = assertValidShopItemConfig(config, `${resolvedPath} ligne ${rowIndex + 2}`);
        configsById[validatedConfig.id] = validatedConfig;
      } catch (error) {
        warnRuntimeDataValidation(`Shop item ignore (${id})`, error);
      }
    }
    return {
      path: resolvedPath,
      configsById,
    };
  }

  function normalizeEncounterFromCsvRow(row) {
    const pokemonId = Math.max(0, toSafeInt(readCsvCell(row, "pokemon_id"), 0));
    if (pokemonId <= 0) {
      return null;
    }
    const minLevel = clamp(toSafeInt(readCsvCell(row, "min_level"), defaultWildLevelMin), 1, maxLevel);
    const maxLevelResolved = clamp(
      toSafeInt(readCsvCell(row, "max_level"), Math.max(minLevel, defaultWildLevelMax)),
      minLevel,
      maxLevel,
    );
    return {
      id: pokemonId,
      name_en: readCsvCell(row, "pokemon_name_en").toLowerCase(),
      name_fr: readCsvCell(row, "pokemon_name_fr"),
      spawn_weight: Math.max(1, toSafeInt(readCsvCell(row, "spawn_weight"), 1)),
      min_level: minLevel,
      max_level: maxLevelResolved,
      methods: parseCsvMethods(readCsvCell(row, "methods")),
    };
  }

  async function loadZoneEncounterCsv(csvPath = routeEncountersCsvPath) {
    const resolvedPath = String(csvPath || routeEncountersCsvPath || "");
    const response = await fetchFn(resolvedPath);
    if (!response.ok) {
      throw new Error("Impossible de charger " + resolvedPath);
    }
    const rawCsv = await response.text();
    const rows = parseCsvObjects(rawCsv, resolvedPath);
    const routeIds = new Set();
    const encountersByRouteId = new Map();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const routeId = readCsvCell(row, "route_id");
      if (!routeId) {
        continue;
      }
      routeIds.add(routeId);
      if (!encountersByRouteId.has(routeId)) {
        encountersByRouteId.set(routeId, []);
      }
      const encounter = normalizeEncounterFromCsvRow(row);
      if (!encounter) {
        continue;
      }
      try {
        const validatedEncounter = assertValidEncounter(encounter, `${resolvedPath} ligne ${rowIndex + 2}`);
        encountersByRouteId.get(routeId).push(validatedEncounter);
      } catch (error) {
        warnRuntimeDataValidation(`Encounter ignore (${routeId})`, error);
      }
    }

    for (const list of encountersByRouteId.values()) {
      list.sort((a, b) => b.spawn_weight - a.spawn_weight || a.id - b.id);
    }

    return {
      path: resolvedPath,
      routeIds,
      encountersByRouteId,
    };
  }

  return {
    warnRuntimeDataValidation,
    normalizePokemonTalentFromCsvRow,
    loadPokemonTalentCsv,
    normalizeBallConfigFromCsvRow,
    loadBallConfigCsv,
    normalizeShopItemConfigFromCsvRow,
    loadShopItemConfigCsv,
    normalizeEncounterFromCsvRow,
    loadZoneEncounterCsv,
  };
}
