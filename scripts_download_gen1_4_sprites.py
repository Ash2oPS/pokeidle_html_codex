import json
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


API_BASE = "https://pokeapi.co/api/v2"
MAX_POKEDEX_ID = 493
RETRY_ATTEMPTS = 5
REQUEST_TIMEOUT_SECONDS = 30
POKEMON_DATA_ROOT = Path("pokemon_data")

SPRITE_VARIANTS = [
    {
        "id": "firered_leafgreen",
        "generation_key": "generation-iii",
        "game_key": "firered-leafgreen",
        "label_fr": "Rouge Feu / Vert Feuille",
        "generation": 3,
    },
    {
        "id": "emerald",
        "generation_key": "generation-iii",
        "game_key": "emerald",
        "label_fr": "Emeraude",
        "generation": 3,
    },
    {
        "id": "ruby_sapphire",
        "generation_key": "generation-iii",
        "game_key": "ruby-sapphire",
        "label_fr": "Rubis / Saphir",
        "generation": 3,
    },
    {
        "id": "heartgold_soulsilver",
        "generation_key": "generation-iv",
        "game_key": "heartgold-soulsilver",
        "label_fr": "HeartGold / SoulSilver",
        "generation": 4,
    },
    {
        "id": "platinum",
        "generation_key": "generation-iv",
        "game_key": "platinum",
        "label_fr": "Platine",
        "generation": 4,
    },
    {
        "id": "diamond_pearl",
        "generation_key": "generation-iv",
        "game_key": "diamond-pearl",
        "label_fr": "Diamant / Perle",
        "generation": 4,
    },
    {
        "id": "crystal",
        "generation_key": "generation-ii",
        "game_key": "crystal",
        "label_fr": "Cristal",
        "generation": 2,
    },
    {
        "id": "gold_silver",
        "generation_key": "generation-ii",
        "game_key": "gold",
        "label_fr": "Or / Argent",
        "generation": 2,
    },
    {
        "id": "yellow",
        "generation_key": "generation-i",
        "game_key": "yellow",
        "label_fr": "Jaune",
        "generation": 1,
    },
    {
        "id": "red_blue",
        "generation_key": "generation-i",
        "game_key": "red-blue",
        "label_fr": "Rouge / Bleu",
        "generation": 1,
    },
]


def fetch_bytes(url: str) -> bytes:
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": "pokeidle-sprite-downloader/1.0 (+https://pokeapi.co)",
                    "Accept": "application/json,image/png,image/webp,*/*",
                },
            )
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            if attempt == RETRY_ATTEMPTS:
                raise RuntimeError(f"Failed to fetch URL after retries: {url}") from exc
            sleep_seconds = min(12, 2**attempt)
            print(f"[retry {attempt}/{RETRY_ATTEMPTS}] {url} -> {exc}. Sleeping {sleep_seconds}s...")
            time.sleep(sleep_seconds)
    raise RuntimeError(f"Failed to fetch URL: {url}")


def fetch_json(url: str) -> dict[str, Any]:
    return json.loads(fetch_bytes(url).decode("utf-8"))


def sanitize_filename_token(value: str) -> str:
    token = "".join(char if char.isalnum() else "_" for char in value.strip().lower())
    while "__" in token:
        token = token.replace("__", "_")
    return token.strip("_")


def find_pokemon_directory(pokedex_id: int) -> Path | None:
    matches = sorted(POKEMON_DATA_ROOT.glob(f"{pokedex_id}_*"))
    for match in matches:
        if match.is_dir():
            return match
    return None


def write_sprite_file(sprite_url: str | None, destination_without_ext: Path) -> str | None:
    if not sprite_url:
        return None
    parsed_ext = Path(urlparse(sprite_url).path).suffix.lower()
    ext = parsed_ext if parsed_ext in {".png", ".jpg", ".jpeg", ".webp"} else ".png"
    target_path = destination_without_ext.with_suffix(ext)
    if target_path.exists() and target_path.stat().st_size > 0:
        return target_path.name
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_bytes(fetch_bytes(sprite_url))
    return target_path.name


def get_variant_sprite_urls(pokemon_payload: dict[str, Any], variant: dict[str, Any]) -> tuple[str | None, str | None]:
    versions = pokemon_payload.get("sprites", {}).get("versions", {})
    generation_payload = versions.get(variant["generation_key"], {})
    game_payload = generation_payload.get(variant["game_key"], {})
    front_default = game_payload.get("front_default")
    front_shiny = game_payload.get("front_shiny")
    return front_default, front_shiny


def build_sprite_variants_for_pokemon(pokemon_payload: dict[str, Any], sprite_dir: Path, filename_prefix: str) -> list[dict[str, Any]]:
    variants_output: list[dict[str, Any]] = []
    for variant in SPRITE_VARIANTS:
        front_default_url, front_shiny_url = get_variant_sprite_urls(pokemon_payload, variant)
        if not front_default_url and not front_shiny_url:
            continue

        variant_token = sanitize_filename_token(variant["id"])
        front_filename = write_sprite_file(
            front_default_url,
            sprite_dir / f"{filename_prefix}_{variant_token}_front",
        )
        shiny_filename = write_sprite_file(
            front_shiny_url,
            sprite_dir / f"{filename_prefix}_{variant_token}_front_shiny",
        )

        if not front_filename and not shiny_filename:
            continue

        variants_output.append(
            {
                "id": variant["id"],
                "label_fr": variant["label_fr"],
                "generation": variant["generation"],
                "game_key": variant["game_key"],
                "front": f"sprites/{front_filename}" if front_filename else None,
                "front_shiny": f"sprites/{shiny_filename}" if shiny_filename else None,
            }
        )
    return variants_output


def get_default_variant_id(variants: list[dict[str, Any]]) -> str | None:
    if not variants:
        return None
    for variant in variants:
        if variant.get("id") == "firered_leafgreen":
            return "firered_leafgreen"
    return variants[0].get("id")


def get_variant_by_id(variants: list[dict[str, Any]], variant_id: str | None) -> dict[str, Any] | None:
    if not variant_id:
        return None
    for variant in variants:
        if variant.get("id") == variant_id:
            return variant
    return None


def main() -> None:
    if not POKEMON_DATA_ROOT.exists():
        raise RuntimeError(f"Missing pokemon_data directory: {POKEMON_DATA_ROOT.resolve()}")

    total_downloaded = 0
    total_updated_json = 0
    total_missing_dirs = 0
    total_with_frlg = 0

    print(f"Updating sprite variants for Pokemon 1..{MAX_POKEDEX_ID} (gen 1 to 4 versions)")
    for pokedex_id in range(1, MAX_POKEDEX_ID + 1):
        pokemon_dir = find_pokemon_directory(pokedex_id)
        if not pokemon_dir:
            total_missing_dirs += 1
            continue

        json_path = pokemon_dir / f"{pokemon_dir.name}_data.json"
        if not json_path.exists():
            print(f"[skip] missing json: {json_path}")
            continue

        try:
            pokemon_payload = fetch_json(f"{API_BASE}/pokemon/{pokedex_id}")
        except Exception as exc:
            print(f"[error] #{pokedex_id} fetch failed: {exc}")
            continue

        sprite_dir = pokemon_dir / "sprites"
        filename_prefix = pokemon_dir.name
        before_files = {path.name for path in sprite_dir.glob("*")} if sprite_dir.exists() else set()
        variants = build_sprite_variants_for_pokemon(pokemon_payload, sprite_dir, filename_prefix)
        after_files = {path.name for path in sprite_dir.glob("*")} if sprite_dir.exists() else set()
        total_downloaded += max(0, len(after_files - before_files))

        default_variant_id = get_default_variant_id(variants)
        if default_variant_id == "firered_leafgreen":
            total_with_frlg += 1
        default_variant = get_variant_by_id(variants, default_variant_id)

        data_payload = json.loads(json_path.read_text(encoding="utf-8"))
        if "sprites" not in data_payload or not isinstance(data_payload["sprites"], dict):
            data_payload["sprites"] = {}

        data_payload["sprite_variants"] = variants
        data_payload["default_sprite_variant_id"] = default_variant_id
        data_payload["sprites"]["front"] = (
            default_variant.get("front")
            if default_variant and default_variant.get("front")
            else data_payload["sprites"].get("front")
        )
        data_payload["sprites"]["front_shiny"] = (
            default_variant.get("front_shiny")
            if default_variant and default_variant.get("front_shiny")
            else data_payload["sprites"].get("front_shiny")
        )

        json_path.write_text(json.dumps(data_payload, ensure_ascii=False, indent=2), encoding="utf-8")
        total_updated_json += 1

        if pokedex_id % 25 == 0:
            print(
                f"  - processed {pokedex_id}/{MAX_POKEDEX_ID} | "
                f"json updated: {total_updated_json} | new files: {total_downloaded}"
            )

    print("Done.")
    print(f"Pokemon JSON updated: {total_updated_json}")
    print(f"New sprite files downloaded: {total_downloaded}")
    print(f"Species with FRLG variant available: {total_with_frlg}")
    print(f"Missing pokemon directories in local dataset: {total_missing_dirs}")


if __name__ == "__main__":
    main()
