const DEFAULT_ROUTE_ID = "kanto_route_1";
const DEFAULT_TEAM_LEVEL = 20;
const APP_VERSION = "0.1.50";
const SPECIES_NAME_BY_ID = {
  100: "voltorb",
  101: "electrode",
  103: "exeggutor",
  104: "cubone",
  105: "marowak",
  106: "hitmonlee",
  107: "hitmonchan",
  108: "lickitung",
  109: "koffing",
  114: "tangela",
  116: "horsea",
  121: "starmie",
};

function normalizeTeamIds(teamIds) {
  const seen = new Set();
  const normalized = [];
  for (const rawId of Array.isArray(teamIds) ? teamIds : []) {
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    normalized.push(id);
    if (normalized.length >= 6) {
      break;
    }
  }
  return normalized;
}

export function buildCombatVfxSeedSave({
  teamIds = [],
  currentRouteId = DEFAULT_ROUTE_ID,
  lastTickEpochMs = Date.now(),
} = {}) {
  const normalizedTeamIds = normalizeTeamIds(teamIds);
  const pokemonEntities = {};

  for (const pokemonId of normalizedTeamIds) {
    const speciesNameEn = SPECIES_NAME_BY_ID[pokemonId] || "";
    pokemonEntities[String(pokemonId)] = {
      id: pokemonId,
      species_name_en: speciesNameEn,
      name_fr: speciesNameEn ? speciesNameEn : `Pokemon ${pokemonId}`,
      level: DEFAULT_TEAM_LEVEL,
      xp: 0,
      entity_unlocked: true,
      encountered_normal: 1,
      captured_normal: 1,
    };
  }

  return {
    version: 6,
    app_version: APP_VERSION,
    app_build_version: APP_VERSION,
    starter_chosen: true,
    current_route_id: String(currentRouteId || DEFAULT_ROUTE_ID),
    unlocked_route_ids: ["kanto_city_pallet_town", String(currentRouteId || DEFAULT_ROUTE_ID)],
    route_defeat_counts: {},
    last_tick_epoch_ms: Math.max(0, Math.floor(Number(lastTickEpochMs) || 0)),
    team: normalizedTeamIds,
    pokemon_entities: pokemonEntities,
    money: 0,
    pokeballs: 0,
    ball_inventory: {
      poke_ball: 0,
      super_ball: 0,
      hyper_ball: 0,
      active_ball_type: "poke_ball",
    },
    active_ball_type: "poke_ball",
    shop_items: {
      water_stone: 0,
      fire_stone: 0,
      leaf_stone: 0,
    },
    tutorials: {
      route1_intro_seen: true,
      evolution_intro_seen: false,
      appearance_intro_seen: true,
      appearance_editor_unlocked: true,
    },
  };
}

export function buildCombatVfxSeedJson(options = {}) {
  return `${JSON.stringify(buildCombatVfxSeedSave(options), null, 2)}\n`;
}
