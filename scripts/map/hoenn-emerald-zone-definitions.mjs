function toSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function routeSpec(routeNumber, options = {}) {
  const number = toSafeInt(routeNumber, 0);
  const displayName = `Route ${number}`;
  return {
    route_id: `hoenn_route_${number}`,
    route_name_fr: `${displayName} (Hoenn)`,
    zone_type: "route",
    source_maps: [`Route${number}`],
    representative_map_id: `Route${number}`,
    marker_section_id: `MAPSEC_ROUTE_${number}`,
    background_title_candidates: [
      `Hoenn Route ${number} E.png`,
      `Hoenn Route ${number} RSE.png`,
      `Hoenn Route ${number} RS.png`,
      ...(Array.isArray(options.background_title_candidates) ? options.background_title_candidates : []),
    ],
    ...options,
  };
}

function citySpec(idToken, displayName, mapId, options = {}) {
  return {
    route_id: `hoenn_city_${idToken}`,
    route_name_fr: `${displayName} (Hoenn)`,
    zone_type: "town",
    source_maps: [mapId],
    representative_map_id: mapId,
    background_title_candidates: [
      `${displayName} E.png`,
      `${displayName} RSE.png`,
      `${displayName} RS.png`,
      ...(Array.isArray(options.background_title_candidates) ? options.background_title_candidates : []),
    ],
    ...options,
  };
}

function dungeonSpec(idToken, displayName, sourceMaps, options = {}) {
  const representativeMapId = String(options.representative_map_id || sourceMaps?.[0] || "").trim();
  return {
    route_id: `hoenn_dungeon_${idToken}`,
    route_name_fr: `${displayName} (Hoenn)`,
    zone_type: "dungeon",
    source_maps: Array.isArray(sourceMaps) ? sourceMaps.slice() : [],
    representative_map_id: representativeMapId,
    background_title_candidates: Array.isArray(options.background_title_candidates)
      ? options.background_title_candidates.slice()
      : [],
    ...options,
  };
}

function underwaterSpec(routeNumber, options = {}) {
  const number = toSafeInt(routeNumber, 0);
  return dungeonSpec(`underwater_route_${number}`, `Underwater Route ${number}`, [`Underwater_Route${number}`], {
    marker_section_id: `MAPSEC_UNDERWATER_${number}`,
    marker_nudge_cells: { x: 0.35, y: 0.35 },
    background_title_candidates: [
      `Hoenn Route ${number} underwater E.png`,
      `Hoenn Route ${number} underwater RSE.png`,
      `Hoenn Route ${number} underwater RS.png`,
    ],
    ...options,
  });
}

export const HOENN_ZONE_SPECS = Object.freeze([
  routeSpec(101),
  citySpec("littleroot_town", "Littleroot Town", "LittlerootTown"),
  citySpec("oldale_town", "Oldale Town", "OldaleTown"),
  routeSpec(103),
  routeSpec(102),
  citySpec("petalburg_city", "Petalburg City", "PetalburgCity"),
  routeSpec(104),
  dungeonSpec("petalburg_woods", "Petalburg Woods", ["PetalburgWoods"], {
    background_title_candidates: ["Petalburg Woods E.png", "Petalburg Woods RS.png"],
  }),
  citySpec("rustboro_city", "Rustboro City", "RustboroCity"),
  routeSpec(116),
  dungeonSpec("rusturf_tunnel", "Rusturf Tunnel", ["RusturfTunnel"], {
    background_title_candidates: ["Rusturf Tunnel E.png", "Rusturf Tunnel RS.png"],
  }),
  routeSpec(106),
  citySpec("dewford_town", "Dewford Town", "DewfordTown"),
  dungeonSpec("granite_cave", "Granite Cave", [
    "GraniteCave_1F",
    "GraniteCave_B1F",
    "GraniteCave_B2F",
    "GraniteCave_StevensRoom",
  ], {
    marker_section_id: "MAPSEC_GRANITE_CAVE",
    background_title_candidates: [
      "Granite Cave 1F E.png",
      "Granite Cave E.png",
      "Granite Cave 1F RS.png",
      "Granite Cave RS.png",
    ],
  }),
  routeSpec(107),
  routeSpec(108),
  routeSpec(109),
  citySpec("slateport_city", "Slateport City", "SlateportCity"),
  routeSpec(110),
  citySpec("mauville_city", "Mauville City", "MauvilleCity"),
  routeSpec(117),
  citySpec("verdanturf_town", "Verdanturf Town", "VerdanturfTown"),
  routeSpec(111, {
    exclude_methods: ["walk"],
  }),
  routeSpec(112),
  dungeonSpec("fiery_path", "Fiery Path", ["FieryPath"], {
    background_title_candidates: ["Fiery Path RSE.png", "Fiery Path RS.png"],
  }),
  routeSpec(113),
  citySpec("fallarbor_town", "Fallarbor Town", "FallarborTown"),
  routeSpec(114),
  dungeonSpec("meteor_falls", "Meteor Falls", [
    "MeteorFalls_1F_1R",
    "MeteorFalls_1F_2R",
    "MeteorFalls_B1F_1R",
    "MeteorFalls_B1F_2R",
    "MeteorFalls_StevensCave",
  ], {
    marker_section_id: "MAPSEC_METEOR_FALLS",
    background_title_candidates: [
      "Meteor Falls 1F1R E.png",
      "Meteor Falls exterior E.png",
      "Meteor Falls 1F1R RS.png",
      "Meteor Falls exterior RS.png",
    ],
  }),
  dungeonSpec("mt_chimney", "Mt. Chimney", ["MtChimney"], {
    marker_section_id: "MAPSEC_MT_CHIMNEY",
    background_title_candidates: ["Mt Chimney E.png", "Mt Chimney RS.png"],
  }),
  dungeonSpec("jagged_pass", "Jagged Pass", ["JaggedPass"], {
    marker_section_id: "MAPSEC_JAGGED_PASS",
    background_title_candidates: ["Jagged Pass E.png", "Jagged Pass RS.png"],
  }),
  citySpec("lavaridge_town", "Lavaridge Town", "LavaridgeTown"),
  dungeonSpec("route_111_desert", "Route 111 Desert", ["Route111"], {
    marker_section_id: "MAPSEC_ROUTE_111",
    marker_nudge_cells: { x: 0.5, y: -0.4 },
    include_methods: ["walk"],
    background_title_candidates: [
      "Hoenn Route 111 Sealed E.png",
      "Hoenn Route 111 E.png",
      "Hoenn Route 111 RS sealed.png",
      "Hoenn Route 111 RS.png",
    ],
  }),
  dungeonSpec("new_mauville", "New Mauville", ["NewMauville_Entrance", "NewMauville_Inside"], {
    marker_section_id: "MAPSEC_NEW_MAUVILLE",
    background_title_candidates: [
      "New Mauville RSE.png",
      "New Mauville outside E.png",
      "New Mauville entrance E.png",
      "New Mauville entrance RS.png",
    ],
  }),
  routeSpec(115),
  routeSpec(105),
  dungeonSpec("abandoned_ship", "Abandoned Ship", [
    "AbandonedShip_Deck",
    "AbandonedShip_Corridors_1F",
    "AbandonedShip_Rooms_1F",
    "AbandonedShip_Corridors_B1F",
    "AbandonedShip_Rooms_B1F",
    "AbandonedShip_Rooms2_B1F",
    "AbandonedShip_Underwater1",
    "AbandonedShip_Room_B1F",
    "AbandonedShip_Rooms2_1F",
    "AbandonedShip_CaptainsOffice",
    "AbandonedShip_Underwater2",
    "AbandonedShip_HiddenFloorCorridors",
    "AbandonedShip_HiddenFloorRooms",
  ], {
    marker_section_id: "MAPSEC_ABANDONED_SHIP",
    background_title_candidates: [
      "Abandoned Ship RSE.png",
      "Abandoned Ship exterior RSE.png",
      "Abandoned Ship 1F and rooms RSE.png",
    ],
  }),
  routeSpec(118),
  routeSpec(119),
  dungeonSpec("weather_institute", "Weather Institute", ["Route119_WeatherInstitute_1F", "Route119_WeatherInstitute_2F"], {
    marker_section_id: "MAPSEC_ROUTE_119",
    marker_nudge_cells: { x: 0.45, y: -0.35 },
    background_title_candidates: [
      "Weather Institute E.png",
      "Weather Institute 1F RSE.png",
      "Weather Institute RS.png",
    ],
  }),
  citySpec("fortree_city", "Fortree City", "FortreeCity"),
  routeSpec(120),
  routeSpec(121),
  dungeonSpec("safari_zone", "Safari Zone", [
    "Route121_SafariZoneEntrance",
    "SafariZone_South",
    "SafariZone_Southwest",
    "SafariZone_North",
    "SafariZone_Northwest",
    "SafariZone_Southeast",
    "SafariZone_Northeast",
    "SafariZone_RestHouse",
  ], {
    marker_section_id: "MAPSEC_SAFARI_ZONE",
    background_title_candidates: [
      "Hoenn Safari Zone E.png",
      "Hoenn Safari Zone numbered E.png",
      "Hoenn Safari Zone RS.png",
      "Hoenn Safari Zone numbered RS.png",
    ],
  }),
  citySpec("lilycove_city", "Lilycove City", "LilycoveCity"),
  routeSpec(122),
  dungeonSpec("mt_pyre", "Mt. Pyre", [
    "MtPyre_1F",
    "MtPyre_2F",
    "MtPyre_3F",
    "MtPyre_4F",
    "MtPyre_5F",
    "MtPyre_6F",
    "MtPyre_Exterior",
    "MtPyre_Summit",
  ], {
    marker_section_id: "MAPSEC_MT_PYRE",
    background_title_candidates: [
      "Mt Pyre 1F RSE.png",
      "Mt Pyre exterior E.png",
      "Mt Pyre Summit E.png",
      "Mt Pyre exterior RS.png",
    ],
  }),
  routeSpec(123),
  dungeonSpec("magma_hideout", "Magma Hideout", [
    "MagmaHideout_1F",
    "MagmaHideout_2F_1R",
    "MagmaHideout_2F_2R",
    "MagmaHideout_3F_1R",
    "MagmaHideout_3F_2R",
    "MagmaHideout_4F",
    "MagmaHideout_3F_3R",
    "MagmaHideout_2F_3R",
  ], {
    marker_section_id: "MAPSEC_MAGMA_HIDEOUT",
    background_title_candidates: ["Magma Hideout 1F E.png"],
  }),
  dungeonSpec("aqua_hideout", "Aqua Hideout", ["AquaHideout_1F", "AquaHideout_B1F", "AquaHideout_B2F"], {
    marker_section_id: "MAPSEC_AQUA_HIDEOUT",
    background_title_candidates: ["Aqua Hideout 1F SE.png", "Aqua Hideout B1F SE.png"],
  }),
  routeSpec(124),
  citySpec("mossdeep_city", "Mossdeep City", "MossdeepCity"),
  routeSpec(125),
  dungeonSpec("shoal_cave", "Shoal Cave", [
    "ShoalCave_LowTideEntranceRoom",
    "ShoalCave_LowTideInnerRoom",
    "ShoalCave_LowTideStairsRoom",
    "ShoalCave_LowTideLowerRoom",
    "ShoalCave_HighTideEntranceRoom",
    "ShoalCave_HighTideInnerRoom",
    "ShoalCave_LowTideIceRoom",
  ], {
    marker_section_id: "MAPSEC_SHOAL_CAVE",
    background_title_candidates: [
      "Shoal Cave entrance low tide E.png",
      "Shoal Cave inner room low tide E.png",
      "Shoal Cave lower room E.png",
      "Shoal Cave entrance low tide RS.png",
    ],
  }),
  underwaterSpec(124),
  underwaterSpec(125),
  underwaterSpec(105),
  routeSpec(127),
  underwaterSpec(127),
  routeSpec(126),
  underwaterSpec(126, {
    background_title_candidates: ["Hoenn Route 126 underwater RSE.png"],
  }),
  citySpec("sootopolis_city", "Sootopolis City", "SootopolisCity", {
    source_maps: ["SootopolisCity", "Underwater_SootopolisCity"],
  }),
  routeSpec(128),
  underwaterSpec(128, {
    background_title_candidates: ["Hoenn Route 128 underwater RSE.png"],
  }),
  dungeonSpec("seafloor_cavern", "Seafloor Cavern", [
    "Underwater_SeafloorCavern",
    "SeafloorCavern_Entrance",
    "SeafloorCavern_Room1",
    "SeafloorCavern_Room2",
    "SeafloorCavern_Room3",
    "SeafloorCavern_Room4",
    "SeafloorCavern_Room5",
    "SeafloorCavern_Room6",
    "SeafloorCavern_Room7",
    "SeafloorCavern_Room8",
    "SeafloorCavern_Room9",
  ], {
    marker_section_id: "MAPSEC_SEAFLOOR_CAVERN",
    background_title_candidates: [
      "Seafloor Cavern entrance E.png",
      "Seafloor Cavern exterior RSE.png",
      "Seafloor Cavern R1 E.png",
    ],
  }),
  routeSpec(129),
  underwaterSpec(129),
  routeSpec(130),
  citySpec("pacifidlog_town", "Pacifidlog Town", "PacifidlogTown"),
  routeSpec(131),
  dungeonSpec("sky_pillar", "Sky Pillar", [
    "SkyPillar_Entrance",
    "SkyPillar_Outside",
    "SkyPillar_1F",
    "SkyPillar_2F",
    "SkyPillar_3F",
    "SkyPillar_4F",
    "SkyPillar_5F",
    "SkyPillar_Top",
  ], {
    marker_section_id: "MAPSEC_SKY_PILLAR",
    background_title_candidates: [
      "Sky Pillar 1F before E.png",
      "Sky Pillar 1F after E.png",
      "Sky Pillar 1F RS.png",
    ],
  }),
  dungeonSpec("cave_of_origin", "Cave of Origin", ["CaveOfOrigin_Entrance", "CaveOfOrigin_1F", "CaveOfOrigin_B1F"], {
    marker_section_id: "MAPSEC_CAVE_OF_ORIGIN",
    marker_nudge_cells: { x: 0.35, y: -0.3 },
    background_title_candidates: ["Cave of Origin Entrance E.png", "Cave of Origin 1F E.png", "Cave of Origin B1F E.png"],
  }),
  citySpec("ever_grande_city", "Ever Grande City", "EverGrandeCity"),
  dungeonSpec("victory_road", "Victory Road", ["VictoryRoad_1F", "VictoryRoad_B1F", "VictoryRoad_B2F"], {
    marker_section_id: "MAPSEC_VICTORY_ROAD",
    background_title_candidates: ["Victory Road 1F E.png", "Victory Road 1F RS.png"],
  }),
  routeSpec(132),
  routeSpec(133),
  routeSpec(134),
]);
