export const STARTER_CHOICES = [
  { id: 1, nameEn: "bulbasaur" },
  { id: 4, nameEn: "charmander" },
  { id: 7, nameEn: "squirtle" },
];

export const DEFAULT_ROUTE_ID = "kanto_city_pallet_town";
export const UNKNOWN_CAVE_ROUTE_ID = "kanto_dungeon_cerulean_cave";
export const ROUTE_DATA_DIR = "map_data";
export const ROUTE_ENCOUNTERS_CSV_PATH = "map_data/kanto_zone_encounters.csv";
export const BALL_CONFIG_CSV_PATH = "item_data/pokeballs.csv";
export const SHOP_ITEMS_CSV_PATH = "item_data/shop_items.csv";
export const POKEMON_TALENTS_CSV_PATH = "pokemon_data/pokemon_talents.csv";
export const ROUTE_ID_ORDER = [
  "kanto_city_pallet_town",
  "kanto_route_1",
  "kanto_city_viridian_city",
  "kanto_route_2",
  "kanto_dungeon_viridian_forest",
  "kanto_city_pewter_city",
  "kanto_route_3",
  "kanto_dungeon_mt_moon",
  "kanto_route_4",
  "kanto_city_cerulean_city",
  "kanto_route_24",
  "kanto_route_25",
  "kanto_route_5",
  "kanto_route_6",
  "kanto_city_vermilion_city",
  "kanto_route_11",
  "kanto_dungeon_digletts_cave",
  "kanto_route_9",
  "kanto_route_10",
  "kanto_dungeon_power_plant",
  "kanto_dungeon_rock_tunnel",
  "kanto_city_lavender_town",
  "kanto_dungeon_pokemon_tower",
  "kanto_route_8",
  "kanto_city_saffron_city",
  "kanto_route_7",
  "kanto_city_celadon_city",
  "kanto_route_16",
  "kanto_route_17",
  "kanto_route_18",
  "kanto_city_fuchsia_city",
  "kanto_dungeon_safari_zone",
  "kanto_route_15",
  "kanto_route_14",
  "kanto_route_13",
  "kanto_route_12",
  "kanto_route_19",
  "kanto_route_20",
  "kanto_dungeon_seafoam_islands",
  "kanto_city_cinnabar_island",
  "kanto_dungeon_pokemon_mansion",
  "kanto_route_21",
  "kanto_route_22",
  "kanto_route_23",
  "kanto_dungeon_victory_road",
  "kanto_city_indigo_plateau",
  "kanto_dungeon_cerulean_cave",
  "johto_route_29",
  "johto_city_new_bark_town",
  "johto_city_cherrygrove_city",
  "johto_route_30",
  "johto_route_31",
  "johto_city_violet_city",
  "johto_dungeon_sprout_tower",
  "johto_dungeon_ruins_of_alph",
  "johto_route_32",
  "johto_dungeon_union_cave",
  "johto_route_33",
  "johto_city_azalea_town",
  "johto_dungeon_slowpoke_well",
  "johto_dungeon_ilex_forest",
  "johto_route_34",
  "johto_city_goldenrod_city",
  "johto_dungeon_national_park",
  "johto_route_35",
  "johto_route_36",
  "johto_route_37",
  "johto_city_ecruteak_city",
  "johto_dungeon_burned_tower",
  "johto_dungeon_bell_tower",
  "johto_route_38",
  "johto_route_39",
  "johto_city_olivine_city",
  "johto_dungeon_johto_lighthouse",
  "johto_route_40",
  "johto_route_41",
  "johto_dungeon_whirl_islands",
  "johto_city_cianwood_city",
  "johto_route_42",
  "johto_dungeon_mt_mortar",
  "johto_route_43",
  "johto_dungeon_lake_of_rage",
  "johto_city_mahogany_town",
  "johto_dungeon_team_rocket_hq",
  "johto_route_44",
  "johto_dungeon_ice_path",
  "johto_city_blackthorn_city",
  "johto_dungeon_dragons_den",
  "johto_route_45",
  "johto_route_46",
  "johto_dungeon_dark_cave",
  "johto_dungeon_tohjo_falls",
  "johto_route_47",
  "johto_dungeon_cliff_cave",
  "johto_route_48",
  "johto_dungeon_johto_safari_zone",
];
export const INSERTED_ROUTE_UNLOCK_BACKFILL = Object.freeze({
  kanto_dungeon_pokemon_mansion: Object.freeze([
    "kanto_route_21",
    "kanto_route_22",
    "kanto_route_23",
    "kanto_dungeon_victory_road",
    "kanto_city_indigo_plateau",
    "kanto_dungeon_cerulean_cave",
  ]),
});
export const ENCOUNTER_METHOD_UNLOCK_ROUTE_BY_ID = Object.freeze({
  "rock-smash": "kanto_dungeon_mt_moon",
  surf: "kanto_route_19",
  "old-rod": "kanto_city_lavender_town",
  "good-rod": "kanto_route_19",
  "super-rod": "kanto_route_19",
  pokeflute: "kanto_city_celadon_city",
});
export const ENCOUNTER_METHOD_ALWAYS_UNLOCKED = Object.freeze({
  walk: true,
  gift: true,
});
export const ENCOUNTER_METHOD_ONLY_ONE = "only-one";
export const ENCOUNTER_METHOD_DISABLED = Object.freeze({
  [ENCOUNTER_METHOD_ONLY_ONE]: true,
});
export const ENCOUNTER_METHOD_ONLY_ONE_ALLOW_SET = new Set([ENCOUNTER_METHOD_ONLY_ONE]);
export const MAP_REGION_DEFAULT_ID = "kanto";
export const MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID = Object.freeze({
  [MAP_REGION_DEFAULT_ID]: "assets/maps/kanto_map_reference_user.png",
  johto: "assets/maps/johto_map_placeholder.png",
});
export const MAP_REGION_COPY_BY_REGION_ID = Object.freeze({
  [MAP_REGION_DEFAULT_ID]: Object.freeze({
    title: "Carte de Kanto",
    subtitle: "Clique une zone debloquee pour t'y rendre.",
    dialogLabel: "Carte de Kanto",
    imageAlt: "Carte de Kanto",
  }),
  johto: Object.freeze({
    title: "Carte de Johto",
    subtitle: "Clique une zone debloquee pour t'y rendre.",
    dialogLabel: "Carte de Johto",
    imageAlt: "Carte de Johto",
  }),
});
export const MAP_REFERENCE_IMAGE_PATH = MAP_REFERENCE_IMAGE_PATH_BY_REGION_ID[MAP_REGION_DEFAULT_ID];
export const MAP_MARKER_OVERRIDES_BY_ROUTE_ID = Object.freeze({
  kanto_route_1: Object.freeze({ x: 24.561, y: 55.11 }),
  kanto_route_2: Object.freeze({ x: 24.561, y: 37.914 }),
  kanto_route_3: Object.freeze({ x: 36.914, y: 20.373 }),
  kanto_route_4: Object.freeze({ x: 55.176, y: 16.851 }),
  kanto_route_5: Object.freeze({ x: 65.234, y: 27.693 }),
  kanto_route_6: Object.freeze({ x: 65.234, y: 41.644 }),
  kanto_route_7: Object.freeze({ x: 59.717, y: 35.152 }),
  kanto_route_8: Object.freeze({ x: 77.783, y: 35.083 }),
  kanto_route_9: Object.freeze({ x: 76.172, y: 17.818 }),
  kanto_route_10: Object.freeze({ x: 87.451, y: 28.108 }),
  kanto_route_11: Object.freeze({ x: 77.686, y: 55.318 }),
  kanto_route_12: Object.freeze({ x: 87.5, y: 46.961 }),
  kanto_route_13: Object.freeze({ x: 78.369, y: 71.616 }),
  kanto_route_14: Object.freeze({ x: 57.031, y: 76.243 }),
  kanto_route_15: Object.freeze({ x: 47.803, y: 80.18 }),
  kanto_route_16: Object.freeze({ x: 44.385, y: 31.077 }),
  kanto_route_17: Object.freeze({ x: 36.084, y: 50.345 }),
  kanto_route_18: Object.freeze({ x: 43.555, y: 80.663 }),
  kanto_route_19: Object.freeze({ x: 50.195, y: 84.945 }),
  kanto_route_20: Object.freeze({ x: 60.547, y: 95.856 }),
  kanto_route_21: Object.freeze({ x: 22.461, y: 82.044 }),
  kanto_route_22: Object.freeze({ x: 18.994, y: 46.892 }),
  kanto_route_23: Object.freeze({ x: 11.963, y: 37.845 }),
  kanto_route_24: Object.freeze({ x: 65.186, y: 10.635 }),
  kanto_route_25: Object.freeze({ x: 71.045, y: 5.939 }),
  kanto_city_pallet_town: Object.freeze({ x: 24.561, y: 64.779 }),
  kanto_city_viridian_city: Object.freeze({ x: 24.561, y: 46.754 }),
  kanto_city_pewter_city: Object.freeze({ x: 24.561, y: 20.649 }),
  kanto_city_cerulean_city: Object.freeze({ x: 65.186, y: 16.713 }),
  kanto_city_vermilion_city: Object.freeze({ x: 65.186, y: 55.11 }),
  kanto_city_lavender_town: Object.freeze({ x: 87.451, y: 35.221 }),
  kanto_city_saffron_city: Object.freeze({ x: 65.186, y: 35.014 }),
  kanto_city_celadon_city: Object.freeze({ x: 48.193, y: 31.146 }),
  kanto_city_fuchsia_city: Object.freeze({ x: 50.195, y: 80.456 }),
  kanto_city_cinnabar_island: Object.freeze({ x: 22.656, y: 94.682 }),
  kanto_city_indigo_plateau: Object.freeze({ x: 12.012, y: 16.298 }),
  kanto_dungeon_viridian_forest: Object.freeze({ x: 24.072, y: 30.525 }),
  kanto_dungeon_mt_moon: Object.freeze({ x: 46.387, y: 17.127 }),
  kanto_dungeon_digletts_cave: Object.freeze({ x: 23.047, y: 32.32 }),
  kanto_dungeon_power_plant: Object.freeze({ x: 82.422, y: 5.87 }),
  kanto_dungeon_rock_tunnel: Object.freeze({ x: 87.451, y: 17.887 }),
  kanto_dungeon_pokemon_tower: Object.freeze({ x: 91.992, y: 33.494 }),
  kanto_dungeon_safari_zone: Object.freeze({ x: 52.148, y: 66.022 }),
  kanto_dungeon_seafoam_islands: Object.freeze({ x: 39.062, y: 95.994 }),
  kanto_dungeon_pokemon_mansion: Object.freeze({ x: 24.609, y: 91.367 }),
  kanto_dungeon_victory_road: Object.freeze({ x: 12.012, y: 21.547 }),
  kanto_dungeon_cerulean_cave: Object.freeze({ x: 61.914, y: 29.834 }),
});
export const ROUTE_UNLOCK_DEFEATS = 20;
export const ROUTE_DEFEAT_TIMER_MS = 20000;
export const TEAM_DRAG_START_DISTANCE_PX = 12;
export const TEAM_DRAG_CLICK_SUPPRESS_MS = 220;
export const TEAM_CONTEXT_TOUCH_HOLD_DELAY_MS = 460;
export const TEAM_CONTEXT_TOUCH_HOLD_CANCEL_DISTANCE_PX = 10;
export const ONLY_ONE_ENCOUNTER_INTERVAL = 50;
export const ONLY_ONE_ENCOUNTER_NORMALS_BEFORE_SPAWN = ONLY_ONE_ENCOUNTER_INTERVAL - 1;
export const ONLY_ONE_ENCOUNTER_HP_MULTIPLIER = 3;
export const ONLY_ONE_ENCOUNTER_TIMER_MS = 150000;
export const ENEMY_TIMER_STYLE_ROUTE = "route";
export const ENEMY_TIMER_STYLE_ONLY_ONE = "only-one";
export const ROUTE_1_TUTORIAL_ID = "kanto_route_1";
