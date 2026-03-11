import {
  assertValidBallConfig,
  parseCsvObjects,
  parseCsvRows,
  parseSaveBridgePayload,
  parseSerializedSave,
  validatePokemonPayload,
  validateRouteDataPayload,
} from "../lib/runtime-data.js";

describe("runtime-data", () => {
  it("parse proprement les CSV avec guillemets, virgules et retours ligne", () => {
    const csv = 'Name,Description\n"Poke Ball","Ligne 1,\nLigne 2"\n';

    expect(parseCsvRows(csv, "test.csv")).toEqual([
      ["Name", "Description"],
      ["Poke Ball", "Ligne 1,\nLigne 2"],
    ]);
    expect(parseCsvObjects(csv, "test.csv")).toEqual([
      {
        name: "Poke Ball",
        description: "Ligne 1,\nLigne 2",
      },
    ]);
  });

  it("normalise et valide le payload du save bridge", () => {
    const payload = {
      ok: true,
      save: {
        version: 6,
        money: 120,
      },
    };

    expect(parseSaveBridgePayload(payload, "bridge")).toEqual({
      version: 6,
      money: 120,
    });
    expect(parseSerializedSave('{"version":6,"money":50}', "local")).toEqual({
      version: 6,
      money: 50,
    });
  });

  it("rejette les saves invalides", () => {
    expect(() => parseSaveBridgePayload({ save: ["bad"] }, "bridge")).toThrow();
    expect(() => parseSerializedSave('["bad"]', "local")).toThrow();
  });

  it("valide les routes et les donnees pokemon attendues par le jeu", () => {
    const route = validateRouteDataPayload(
      {
        route_id: "kanto_route_1",
        route_name_fr: "Route 1",
        combat_enabled: true,
        background_image: "assets/backgrounds/route.png",
        encounters: [
          {
            id: 16,
            name_en: "pidgey",
            name_fr: "Roucool",
            methods: ["walk"],
            spawn_weight: 50,
            min_level: 2,
            max_level: 5,
          },
        ],
      },
      "route",
    );
    const pokemon = validatePokemonPayload(
      {
        pokedex_number: 16,
        name_fr: "Roucool",
        name_en: "pidgey",
        defensive_types: ["normal", "flying"],
        offensive_type: "flying",
        stats: {
          hp: 40,
          attack: 45,
          defense: 40,
          "special-attack": 35,
          "special-defense": 35,
          speed: 56,
        },
        catch_rate: 255,
        sprites: {
          front: "sprites/pidgey_front.png",
          front_shiny: "sprites/pidgey_front_shiny.png",
        },
      },
      "pokemon",
    );

    expect(route.route_id).toBe("kanto_route_1");
    expect(route.encounters).toHaveLength(1);
    expect(pokemon.pokedex_number).toBe(16);
    expect(pokemon.name_en).toBe("pidgey");
  });

  it("valide la configuration normalisee des balls", () => {
    expect(
      assertValidBallConfig(
        {
          type: "poke_ball",
          nameFr: "Poke Ball",
          price: 200,
          captureMultiplier: 1,
          description: "La balle de base.",
          spritePath: "assets/items/poke_ball.png",
          comingSoon: false,
          sortOrder: 0,
        },
        "ball",
      ),
    ).toMatchObject({
      type: "poke_ball",
      price: 200,
    });
  });
});
