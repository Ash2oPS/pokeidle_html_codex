import argparse
import json
from typing import Any

from common import API_BASE, MAX_POKEDEX_ID, POKEMON_DATA_ROOT, fetch_bytes, fetch_json, find_pokemon_directory


def get_named_resource_name(resource: Any) -> str | None:
    if not isinstance(resource, dict):
        return None
    value = resource.get("name")
    return str(value) if isinstance(value, str) and value else None


USER_AGENT = "pokeidle-data-enricher/1.0 (+https://pokeapi.co)"
CRY_ACCEPT = "audio/ogg,*/*"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--only-cries",
        action="store_true",
        help="Download latest cries only and update the local cry field without touching other enrichment fields.",
    )
    return parser.parse_args()


def select_latest_cry_url(pokemon_payload: dict[str, Any]) -> tuple[str | None, str | None]:
    cries_payload = pokemon_payload.get("cries")
    if not isinstance(cries_payload, dict):
        return None, None

    latest_url = cries_payload.get("latest")
    if isinstance(latest_url, str) and latest_url:
        return latest_url, "latest"

    return None, None


def cleanup_local_cry_assets(cry_dir: Any, keep_filename: str | None = None) -> bool:
    if not cry_dir.exists():
        return False

    removed_any = False
    for asset_path in cry_dir.glob("*.ogg"):
        if keep_filename and asset_path.name == keep_filename:
            continue
        asset_path.unlink()
        removed_any = True

    if not any(cry_dir.iterdir()):
        cry_dir.rmdir()
        removed_any = True

    return removed_any


def sync_local_cry_asset(
    pokedex_id: int,
    pokemon_dir: Any,
    local_payload: dict[str, Any],
    pokemon_payload: dict[str, Any],
) -> tuple[dict[str, Any] | None, bool]:
    cry_dir = pokemon_dir / "cries"
    cry_url, cry_source = select_latest_cry_url(pokemon_payload)
    if not cry_url or not cry_source:
        cleaned = cleanup_local_cry_assets(cry_dir)
        removed_payload = "cry" in local_payload
        return None, cleaned or removed_payload

    name_en = str(local_payload.get("name_en") or pokemon_payload.get("name") or "").strip()
    if not name_en:
        cleaned = cleanup_local_cry_assets(cry_dir)
        removed_payload = "cry" in local_payload
        return None, cleaned or removed_payload

    cry_dir.mkdir(parents=True, exist_ok=True)

    cry_filename = f"{pokedex_id}_{name_en}_cry.ogg"
    cry_path = cry_dir / cry_filename
    cleanup_local_cry_assets(cry_dir, keep_filename=cry_filename)
    cry_payload = {
        "path": f"cries/{cry_filename}",
        "source": cry_source,
    }
    should_download = local_payload.get("cry") != cry_payload or not cry_path.exists()
    if should_download:
        cry_path.write_bytes(fetch_bytes(cry_url, user_agent=USER_AGENT, accept=CRY_ACCEPT))

    return cry_payload, should_download


def extract_abilities(pokemon_payload: dict[str, Any]) -> list[dict[str, Any]]:
    abilities: list[dict[str, Any]] = []
    raw_abilities = pokemon_payload.get("abilities")
    if not isinstance(raw_abilities, list):
        return abilities
    for entry in sorted(raw_abilities, key=lambda item: int(item.get("slot", 999) or 999)):
        ability_name = get_named_resource_name(entry.get("ability"))
        if not ability_name:
            continue
        abilities.append(
            {
                "name_en": ability_name,
                "is_hidden": bool(entry.get("is_hidden")),
                "slot": int(entry.get("slot", 0) or 0),
            }
        )
    return abilities


def extract_ev_yield(pokemon_payload: dict[str, Any]) -> dict[str, int]:
    output: dict[str, int] = {}
    stats = pokemon_payload.get("stats")
    if not isinstance(stats, list):
        return output
    for entry in stats:
        stat_name = get_named_resource_name(entry.get("stat"))
        effort = int(entry.get("effort", 0) or 0)
        if not stat_name or effort <= 0:
            continue
        output[stat_name] = effort
    return output


def extract_held_items(pokemon_payload: dict[str, Any]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    raw_held_items = pokemon_payload.get("held_items")
    if not isinstance(raw_held_items, list):
        return output
    for held in raw_held_items:
        item_name = get_named_resource_name(held.get("item"))
        if not item_name:
            continue
        details = held.get("version_details")
        rarity = None
        if isinstance(details, list) and details:
            rarity = int(details[0].get("rarity", 0) or 0)
        item_payload: dict[str, Any] = {"name_en": item_name}
        if rarity is not None:
            item_payload["rarity"] = rarity
        output.append(item_payload)
    return output


def extract_egg_groups(species_payload: dict[str, Any]) -> list[str]:
    egg_groups: list[str] = []
    raw_groups = species_payload.get("egg_groups")
    if not isinstance(raw_groups, list):
        return egg_groups
    for group in raw_groups:
        group_name = get_named_resource_name(group)
        if group_name:
            egg_groups.append(group_name)
    return egg_groups


def build_missing_fields_map(
    pokemon_payload: dict[str, Any],
    species_payload: dict[str, Any],
) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    fields["base_experience"] = int(pokemon_payload.get("base_experience", 0) or 0)
    fields["weight"] = int(pokemon_payload.get("weight", 0) or 0)
    fields["abilities"] = extract_abilities(pokemon_payload)
    fields["ev_yield"] = extract_ev_yield(pokemon_payload)
    fields["held_items"] = extract_held_items(pokemon_payload)
    fields["base_happiness"] = int(species_payload.get("base_happiness", 0) or 0)
    fields["growth_rate"] = get_named_resource_name(species_payload.get("growth_rate"))
    fields["hatch_counter"] = int(species_payload.get("hatch_counter", 0) or 0)
    fields["generation"] = get_named_resource_name(species_payload.get("generation"))
    fields["egg_groups"] = extract_egg_groups(species_payload)
    fields["gender_rate"] = int(species_payload.get("gender_rate", -1) or -1)
    fields["is_baby"] = bool(species_payload.get("is_baby"))
    fields["is_legendary"] = bool(species_payload.get("is_legendary"))
    fields["is_mythical"] = bool(species_payload.get("is_mythical"))
    fields["has_gender_differences"] = bool(species_payload.get("has_gender_differences"))
    fields["forms_switchable"] = bool(species_payload.get("forms_switchable"))
    fields["color"] = get_named_resource_name(species_payload.get("color"))
    fields["shape"] = get_named_resource_name(species_payload.get("shape"))
    fields["habitat"] = get_named_resource_name(species_payload.get("habitat"))
    return fields


def main() -> None:
    args = parse_args()
    if not POKEMON_DATA_ROOT.exists():
        raise RuntimeError(f"Missing pokemon_data directory: {POKEMON_DATA_ROOT.resolve()}")

    processed_count = 0
    updated_count = 0
    unchanged_count = 0
    missing_directory_count = 0
    fetch_error_count = 0
    cry_asset_updated_count = 0
    field_insert_counter: dict[str, int] = {}

    mode_label = "cry-only" if args.only_cries else "non-destructive"
    print(f"Enriching missing Pokemon data for IDs 1..{MAX_POKEDEX_ID} ({mode_label})")
    for pokedex_id in range(1, MAX_POKEDEX_ID + 1):
        pokemon_dir = find_pokemon_directory(pokedex_id)
        if not pokemon_dir:
            missing_directory_count += 1
            continue

        json_path = pokemon_dir / f"{pokemon_dir.name}_data.json"
        if not json_path.exists():
            print(f"[skip] missing json: {json_path}")
            continue

        try:
            local_payload = json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            print(f"[error] #{pokedex_id} invalid json payload: {json_path} -> {exc}")
            continue

        try:
            pokemon_payload = fetch_json(f"{API_BASE}/pokemon/{pokedex_id}", user_agent=USER_AGENT)
            species_payload = (
                None
                if args.only_cries
                else fetch_json(f"{API_BASE}/pokemon-species/{pokedex_id}", user_agent=USER_AGENT)
            )
        except Exception as exc:
            fetch_error_count += 1
            print(f"[error] #{pokedex_id} fetch failed: {exc}")
            continue

        inserted_fields: list[str] = []
        if species_payload is not None:
            missing_fields = build_missing_fields_map(pokemon_payload, species_payload)
            for field_name, field_value in missing_fields.items():
                if field_name in local_payload:
                    continue
                local_payload[field_name] = field_value
                inserted_fields.append(field_name)
                field_insert_counter[field_name] = field_insert_counter.get(field_name, 0) + 1

        try:
            cry_payload, cry_asset_updated = sync_local_cry_asset(
                pokedex_id,
                pokemon_dir,
                local_payload,
                pokemon_payload,
            )
        except Exception as exc:
            fetch_error_count += 1
            print(f"[error] #{pokedex_id} cry sync failed: {exc}")
            continue

        if cry_payload is None:
            if "cry" in local_payload:
                del local_payload["cry"]
                inserted_fields.append("cry")
                field_insert_counter["cry"] = field_insert_counter.get("cry", 0) + 1
        elif local_payload.get("cry") != cry_payload:
            local_payload["cry"] = cry_payload
            inserted_fields.append("cry")
            field_insert_counter["cry"] = field_insert_counter.get("cry", 0) + 1

        if cry_asset_updated:
            cry_asset_updated_count += 1

        if inserted_fields:
            json_path.write_text(json.dumps(local_payload, ensure_ascii=False, indent=2), encoding="utf-8")
            updated_count += 1
        else:
            unchanged_count += 1

        processed_count += 1
        if pokedex_id % 25 == 0:
            print(
                f"  - processed {pokedex_id}/{MAX_POKEDEX_ID} "
                f"| updated: {updated_count} | unchanged: {unchanged_count}"
            )

    print("Done.")
    print(f"Pokemon JSON processed: {processed_count}")
    print(f"Pokemon JSON updated: {updated_count}")
    print(f"Pokemon JSON unchanged: {unchanged_count}")
    print(f"Missing pokemon directories: {missing_directory_count}")
    print(f"Fetch errors: {fetch_error_count}")
    print(f"Cry assets written: {cry_asset_updated_count}")
    if field_insert_counter:
        print("Inserted fields summary:")
        for field_name in sorted(field_insert_counter.keys()):
            print(f"  - {field_name}: {field_insert_counter[field_name]}")


if __name__ == "__main__":
    main()
