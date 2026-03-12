function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function getEntityCapturedTotal(record) {
  return Math.max(0, toSafeInt(record?.captured_normal, 0)) + Math.max(0, toSafeInt(record?.captured_shiny, 0));
}

function getEntityEncounteredTotal(record) {
  return Math.max(0, toSafeInt(record?.encountered_normal, 0)) + Math.max(0, toSafeInt(record?.encountered_shiny, 0));
}

function isEntityOwned(record) {
  if (!record || typeof record !== "object") {
    return false;
  }
  if (Boolean(record.entity_unlocked)) {
    return true;
  }
  return getEntityCapturedTotal(record) > 0;
}

function buildTeamOrderMap(team) {
  const order = new Map();
  const source = Array.isArray(team) ? team : [];
  for (let index = 0; index < source.length; index += 1) {
    const id = Number(source[index]);
    if (id > 0 && !order.has(id)) {
      order.set(id, index);
    }
  }
  return order;
}

function areIdListsEqual(left, right) {
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    if (Number(a[index]) !== Number(b[index])) {
      return false;
    }
  }
  return true;
}

export function getOwnedEntityIdsFromSave(saveData, options = {}) {
  const maxTeamSize = Math.max(1, toSafeInt(options.maxTeamSize, 6));
  const teamOrder = buildTeamOrderMap(saveData?.team);
  const candidates = [];
  const rawEntities = saveData?.pokemon_entities && typeof saveData.pokemon_entities === "object"
    ? saveData.pokemon_entities
    : {};

  for (const [rawId, record] of Object.entries(rawEntities)) {
    const id = Number(record?.id || rawId || 0);
    if (id <= 0 || !isEntityOwned(record)) {
      continue;
    }
    candidates.push({
      id,
      level: Math.max(1, toSafeInt(record?.level, 1)),
      xp: Math.max(0, toSafeInt(record?.xp, 0)),
      capturedTotal: getEntityCapturedTotal(record),
      encounteredTotal: getEntityEncounteredTotal(record),
      teamOrder: teamOrder.has(id) ? teamOrder.get(id) : Number.POSITIVE_INFINITY,
    });
  }

  candidates.sort((left, right) => {
    if (left.teamOrder !== right.teamOrder) {
      return left.teamOrder - right.teamOrder;
    }
    if (left.level !== right.level) {
      return right.level - left.level;
    }
    if (left.capturedTotal !== right.capturedTotal) {
      return right.capturedTotal - left.capturedTotal;
    }
    if (left.encounteredTotal !== right.encounteredTotal) {
      return right.encounteredTotal - left.encounteredTotal;
    }
    if (left.xp !== right.xp) {
      return right.xp - left.xp;
    }
    return left.id - right.id;
  });

  return candidates.slice(0, maxTeamSize).map((candidate) => candidate.id);
}

export function hasMeaningfulSaveProgress(saveData, defaultRouteId = "") {
  const ownedIds = getOwnedEntityIdsFromSave(saveData, { maxTeamSize: 9999 });
  if (ownedIds.length > 0) {
    return true;
  }

  const team = Array.isArray(saveData?.team) ? saveData.team : [];
  if (team.some((entry) => Number(entry) > 0)) {
    return true;
  }

  const currentRouteId = String(saveData?.current_route_id || "");
  if (currentRouteId && defaultRouteId && currentRouteId !== defaultRouteId) {
    return true;
  }

  const unlockedRoutes = Array.isArray(saveData?.unlocked_route_ids) ? saveData.unlocked_route_ids : [];
  if (unlockedRoutes.some((routeId) => String(routeId || "") && String(routeId || "") !== String(defaultRouteId || ""))) {
    return true;
  }

  const routeDefeatCounts =
    saveData?.route_defeat_counts && typeof saveData.route_defeat_counts === "object"
      ? saveData.route_defeat_counts
      : {};
  if (Object.values(routeDefeatCounts).some((value) => Math.max(0, toSafeInt(value, 0)) > 0)) {
    return true;
  }

  if (Math.max(0, toSafeInt(saveData?.money, 0)) > 0) {
    return true;
  }
  if (Math.max(0, toSafeInt(saveData?.pokeballs, 0)) > 0) {
    return true;
  }
  if (Math.max(0, toSafeInt(saveData?.attack_boost_until_ms, 0)) > 0) {
    return true;
  }

  const ballInventory =
    saveData?.ball_inventory && typeof saveData.ball_inventory === "object" ? saveData.ball_inventory : {};
  if (Object.values(ballInventory).some((value) => Math.max(0, toSafeInt(value, 0)) > 0)) {
    return true;
  }

  const shopItems = saveData?.shop_items && typeof saveData.shop_items === "object" ? saveData.shop_items : {};
  if (Object.values(shopItems).some((value) => Math.max(0, toSafeInt(value, 0)) > 0)) {
    return true;
  }

  const tutorials = saveData?.tutorials && typeof saveData.tutorials === "object" ? saveData.tutorials : {};
  return Object.values(tutorials).some((value) => Boolean(value));
}

export function repairNormalizedSaveData(saveData, options = {}) {
  if (!saveData || typeof saveData !== "object") {
    return {
      changed: false,
      recoveredTeam: false,
      orphanedProgress: false,
      ownedEntityIds: [],
    };
  }

  const maxTeamSize = Math.max(1, toSafeInt(options.maxTeamSize, 6));
  const defaultRouteId = String(options.defaultRouteId || "");
  const ownedEntityIds = getOwnedEntityIdsFromSave(saveData, { maxTeamSize });
  const ownedIdSet = new Set(ownedEntityIds);
  const nextTeam = [];
  const rawTeam = Array.isArray(saveData.team) ? saveData.team : [];

  for (const rawId of rawTeam) {
    const id = Number(rawId);
    if (id <= 0 || nextTeam.includes(id) || !ownedIdSet.has(id)) {
      continue;
    }
    nextTeam.push(id);
    if (nextTeam.length >= maxTeamSize) {
      break;
    }
  }

  let changed = !areIdListsEqual(rawTeam, nextTeam);
  let recoveredTeam = false;
  if (nextTeam.length <= 0 && ownedEntityIds.length > 0) {
    nextTeam.push(...ownedEntityIds.slice(0, maxTeamSize));
    changed = true;
    recoveredTeam = true;
  }

  if (!areIdListsEqual(saveData.team, nextTeam)) {
    saveData.team = nextTeam;
  }

  const starterChosen = nextTeam.length > 0 || ownedEntityIds.length > 0;
  if (Boolean(saveData.starter_chosen) !== starterChosen) {
    saveData.starter_chosen = starterChosen;
    changed = true;
  }

  return {
    changed,
    recoveredTeam,
    orphanedProgress: !starterChosen && hasMeaningfulSaveProgress(saveData, defaultRouteId),
    ownedEntityIds,
  };
}
