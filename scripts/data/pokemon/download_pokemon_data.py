import json
import time
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    from PIL import Image  # type: ignore

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


API_BASE = "https://pokeapi.co/api/v2"
MAX_POKEDEX_ID = 493
OUTPUT_ROOT = Path("pokemon_data")
ITEM_DATA_ROOT = Path("item_data")
RETRY_ATTEMPTS = 5
REQUEST_TIMEOUT_SECONDS = 30
SIZE_REMAP_MIN = 10
SIZE_REMAP_MAX = 100

TRANSPARENT_SPRITE_CANDIDATES = [
    "official-artwork",
]


def compute_size_from_height(height_value: int | float | None) -> float:
    height = float(height_value or 0)
    remap_range = SIZE_REMAP_MAX - SIZE_REMAP_MIN
    if remap_range <= 0:
        return 0.0
    clamped_height = max(SIZE_REMAP_MIN, min(SIZE_REMAP_MAX, height))
    return round((clamped_height - SIZE_REMAP_MIN) / remap_range, 4)


def fetch_bytes(url: str) -> bytes:
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": "pokeidle-data-downloader/1.0 (+https://pokeapi.co)",
                    "Accept": "application/json,image/webp,image/png,*/*",
                },
            )
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            if attempt == RETRY_ATTEMPTS:
                raise RuntimeError(f"Failed to fetch URL after retries: {url}") from exc
            sleep_seconds = min(10, 2**attempt)
            print(f"[retry {attempt}/{RETRY_ATTEMPTS}] {url} -> {exc}. Sleeping {sleep_seconds}s...")
            time.sleep(sleep_seconds)
    raise RuntimeError(f"Failed to fetch URL: {url}")


def fetch_json(url: str) -> dict[str, Any]:
    return json.loads(fetch_bytes(url).decode("utf-8"))


def extract_french_name(species_payload: dict[str, Any], english_name: str) -> str:
    for item in species_payload.get("names", []):
        if item.get("language", {}).get("name") == "fr":
            return item.get("name", english_name)
    return english_name


def extract_ordered_types(pokemon_payload: dict[str, Any]) -> list[str]:
    ordered = sorted(pokemon_payload.get("types", []), key=lambda t: t.get("slot", 999))
    return [t.get("type", {}).get("name", "") for t in ordered if t.get("type")]


def select_offensive_type(defensive_types: list[str]) -> str | None:
    if not defensive_types:
        return None
    if len(defensive_types) == 1:
        return defensive_types[0]
    if defensive_types[0] == "normal":
        return defensive_types[1]
    return defensive_types[0]


def extract_stats(pokemon_payload: dict[str, Any]) -> dict[str, int]:
    return {
        stat_entry.get("stat", {}).get("name", "unknown"): int(stat_entry.get("base_stat", 0))
        for stat_entry in pokemon_payload.get("stats", [])
    }


def get_preferred_front_sprite_urls(pokemon_payload: dict[str, Any]) -> tuple[str | None, str | None]:
    other_payload = pokemon_payload.get("sprites", {}).get("other", {})
    for candidate_key in TRANSPARENT_SPRITE_CANDIDATES:
        candidate_payload = other_payload.get(candidate_key, {})
        front_default = candidate_payload.get("front_default")
        front_shiny = candidate_payload.get("front_shiny")
        if front_default or front_shiny:
            return front_default, front_shiny
    sprites_payload = pokemon_payload.get("sprites", {})
    return sprites_payload.get("front_default"), sprites_payload.get("front_shiny")


def get_named_resource_name(resource: dict[str, Any] | None) -> str | None:
    if not isinstance(resource, dict):
        return None
    return resource.get("name")


def map_gender(gender_value: int | None) -> str | None:
    if gender_value == 1:
        return "female"
    if gender_value == 2:
        return "male"
    return None


def map_relative_physical_stats(value: int | None) -> str | None:
    if value == -1:
        return "attack_lt_defense"
    if value == 0:
        return "attack_eq_defense"
    if value == 1:
        return "attack_gt_defense"
    return None


def classify_evolution_type(trigger: str | None, detail: dict[str, Any]) -> str:
    if detail.get("item"):
        return "item"
    if trigger == "trade" or detail.get("trade_species"):
        return "trade"
    if detail.get("min_happiness") is not None:
        return "happiness"
    if detail.get("min_beauty") is not None:
        return "beauty"
    if detail.get("min_affection") is not None:
        return "affection"
    if trigger == "level-up":
        return "level-up"
    if trigger == "use-item":
        return "item"
    if trigger:
        return trigger
    return "other"


def compact_dict(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in payload.items()
        if value is not None and value != "" and value != [] and value != {} and value is not False
    }


def parse_evolution_detail(detail: dict[str, Any]) -> dict[str, Any]:
    trigger_name = get_named_resource_name(detail.get("trigger"))
    parsed_detail = {
        "evolution_type": classify_evolution_type(trigger_name, detail),
        "trigger": trigger_name,
        "min_level": detail.get("min_level"),
        "item": get_named_resource_name(detail.get("item")),
        "held_item": get_named_resource_name(detail.get("held_item")),
        "trade_species": get_named_resource_name(detail.get("trade_species")),
        "min_happiness": detail.get("min_happiness"),
        "min_beauty": detail.get("min_beauty"),
        "min_affection": detail.get("min_affection"),
        "time_of_day": detail.get("time_of_day"),
        "location": get_named_resource_name(detail.get("location")),
        "known_move": get_named_resource_name(detail.get("known_move")),
        "known_move_type": get_named_resource_name(detail.get("known_move_type")),
        "party_species": get_named_resource_name(detail.get("party_species")),
        "party_type": get_named_resource_name(detail.get("party_type")),
        "relative_physical_stats": map_relative_physical_stats(detail.get("relative_physical_stats")),
        "gender": map_gender(detail.get("gender")),
        "needs_overworld_rain": detail.get("needs_overworld_rain"),
        "turn_upside_down": detail.get("turn_upside_down"),
    }
    return compact_dict(parsed_detail)


def build_evolves_to_map(evolution_chain_payload: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    mapping: dict[str, list[dict[str, Any]]] = {}

    def walk(node: dict[str, Any]) -> None:
        species_name = node.get("species", {}).get("name")
        if not species_name:
            return
        children: list[dict[str, Any]] = []
        for child in node.get("evolves_to", []):
            child_name = child.get("species", {}).get("name")
            if not child_name:
                continue
            evolution_methods = [
                parse_evolution_detail(detail) for detail in child.get("evolution_details", [])
            ]
            children.append({"name_en": child_name, "evolution_methods": evolution_methods})
        mapping[species_name] = children
        for child in node.get("evolves_to", []):
            walk(child)

    walk(evolution_chain_payload.get("chain", {}))
    return mapping


def write_sprite(sprite_url: str | None, destination_base: Path) -> str | None:
    if not sprite_url:
        return None

    content = fetch_bytes(sprite_url)
    if PIL_AVAILABLE:
        target_path = destination_base.with_suffix(".webp")
        with Image.open(BytesIO(content)) as img:
            img.save(target_path, format="WEBP", quality=90)
    else:
        parsed_ext = Path(urlparse(sprite_url).path).suffix.lower()
        ext = parsed_ext if parsed_ext in {".png", ".jpg", ".jpeg", ".webp"} else ".png"
        target_path = destination_base.with_suffix(ext)
        target_path.write_bytes(content)

    return target_path.name


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    pokemon_records: list[dict[str, Any]] = []
    name_to_id: dict[str, int] = {}
    unique_chain_urls: set[str] = set()
    evolution_items: set[str] = set()

    print(f"Downloading Pokemon data for IDs 1..{MAX_POKEDEX_ID}")
    for poke_id in range(1, MAX_POKEDEX_ID + 1):
        pokemon_url = f"{API_BASE}/pokemon/{poke_id}"
        species_url = f"{API_BASE}/pokemon-species/{poke_id}"

        pokemon_payload = fetch_json(pokemon_url)
        species_payload = fetch_json(species_url)

        english_name = pokemon_payload.get("name", f"pokemon-{poke_id}")
        french_name = extract_french_name(species_payload, english_name)
        defensive_types = extract_ordered_types(pokemon_payload)
        offensive_type = select_offensive_type(defensive_types)
        stats = extract_stats(pokemon_payload)
        preferred_front_url, preferred_shiny_url = get_preferred_front_sprite_urls(pokemon_payload)
        evolution_chain_url = species_payload.get("evolution_chain", {}).get("url")
        evolves_from_name = None
        if species_payload.get("evolves_from_species"):
            evolves_from_name = species_payload["evolves_from_species"].get("name")

        if evolution_chain_url:
            unique_chain_urls.add(evolution_chain_url)

        name_to_id[english_name] = poke_id
        pokemon_records.append(
            {
                "id": poke_id,
                "name_en": english_name,
                "name_fr": french_name,
                "height": int(pokemon_payload.get("height", 0) or 0),
                "size": compute_size_from_height(pokemon_payload.get("height", 0)),
                "defensive_types": defensive_types,
                "offensive_type": offensive_type,
                "stats": stats,
                "evolves_from_name": evolves_from_name,
                "species_name": species_payload.get("name", english_name),
                "evolution_chain_url": evolution_chain_url,
                "front_default_url": preferred_front_url,
                "front_shiny_url": preferred_shiny_url,
            }
        )

        if poke_id % 25 == 0:
            print(f"  - fetched {poke_id}/{MAX_POKEDEX_ID}")

    print(f"Downloading unique evolution chains: {len(unique_chain_urls)}")
    evolves_to_by_name: dict[str, list[dict[str, Any]]] = {}
    for index, chain_url in enumerate(sorted(unique_chain_urls), start=1):
        chain_payload = fetch_json(chain_url)
        evolves_to_by_name.update(build_evolves_to_map(chain_payload))
        if index % 25 == 0:
            print(f"  - fetched chains {index}/{len(unique_chain_urls)}")

    print("Writing JSON files and sprites...")
    for index, record in enumerate(pokemon_records, start=1):
        poke_id = record["id"]
        name_en = record["name_en"]
        folder_name = f"{poke_id}_{name_en}"
        pokemon_dir = OUTPUT_ROOT / folder_name
        sprite_dir = pokemon_dir / "sprites"
        sprite_dir.mkdir(parents=True, exist_ok=True)

        sprite_base = sprite_dir / f"{poke_id}_{name_en}_sprite"
        shiny_base = sprite_dir / f"{poke_id}_{name_en}_sprite_shiny"

        sprite_file_name = write_sprite(record["front_default_url"], sprite_base)
        shiny_file_name = write_sprite(record["front_shiny_url"], shiny_base)

        evolves_from = None
        if record["evolves_from_name"]:
            prev_id = name_to_id.get(record["evolves_from_name"])
            if prev_id is not None:
                evolution_methods: list[dict[str, Any]] = []
                for child_entry in evolves_to_by_name.get(record["evolves_from_name"], []):
                    if child_entry.get("name_en") == record["species_name"]:
                        evolution_methods = child_entry.get("evolution_methods", [])
                        break
                evolves_from = {
                    "id": prev_id,
                    "name_en": record["evolves_from_name"],
                    "evolution_methods": evolution_methods,
                }

        evolves_to_entries = evolves_to_by_name.get(record["species_name"], [])
        evolves_to = []
        for child_entry in evolves_to_entries:
            next_name = child_entry.get("name_en")
            if not next_name:
                continue
            next_id = name_to_id.get(next_name)
            if next_id is not None:
                evolves_to.append(
                    {
                        "id": next_id,
                        "name_en": next_name,
                        "evolution_methods": child_entry.get("evolution_methods", []),
                    }
                )

        output_json = {
            "pokedex_number": poke_id,
            "name_fr": record["name_fr"],
            "name_en": name_en,
            "height": record["height"],
            "size": record["size"],
            "defensive_types": record["defensive_types"],
            "offensive_type": record["offensive_type"],
            "evolves_from": evolves_from,
            "evolves_to": evolves_to,
            "stats": record["stats"],
            "sprites": {
                "front": f"sprites/{sprite_file_name}" if sprite_file_name else None,
                "front_shiny": f"sprites/{shiny_file_name}" if shiny_file_name else None,
            },
        }

        json_path = pokemon_dir / f"{poke_id}_{name_en}_data.json"
        json_path.write_text(
            json.dumps(output_json, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        for evo_target in output_json.get("evolves_to", []):
            for method in evo_target.get("evolution_methods", []):
                if method.get("item"):
                    evolution_items.add(method["item"])
                if method.get("held_item"):
                    evolution_items.add(method["held_item"])
        if output_json.get("evolves_from"):
            for method in output_json["evolves_from"].get("evolution_methods", []):
                if method.get("item"):
                    evolution_items.add(method["item"])
                if method.get("held_item"):
                    evolution_items.add(method["held_item"])

        if index % 25 == 0:
            print(f"  - wrote {index}/{len(pokemon_records)}")

    ext_used = "webp" if PIL_AVAILABLE else "png/jpg based on source"
    ITEM_DATA_ROOT.mkdir(parents=True, exist_ok=True)
    evolution_items_json_path = ITEM_DATA_ROOT / "item_data.json"
    evolution_items_json_path.write_text(
        json.dumps(
            {
                "count": len(evolution_items),
                "items": sorted(evolution_items),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("Done.")
    print(f"Output root: {OUTPUT_ROOT.resolve()}")
    print(f"Sprite format: {ext_used}")
    print(f"Evolution items file: {evolution_items_json_path.resolve()}")


if __name__ == "__main__":
    main()
