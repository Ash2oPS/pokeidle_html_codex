import json
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_BASE = "https://pokeapi.co/api/v2"
MAX_POKEDEX_ID = 493
RETRY_ATTEMPTS = 5
REQUEST_TIMEOUT_SECONDS = 30
POKEMON_DATA_ROOT = Path("pokemon_data")
SIZE_REMAP_MIN = 10
SIZE_REMAP_MAX = 100


def fetch_bytes(url: str) -> bytes:
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": "pokeidle-height-downloader/1.0 (+https://pokeapi.co)",
                    "Accept": "application/json,*/*",
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


def compute_size_from_height(height_value: int | float | None) -> float:
    height = float(height_value or 0)
    remap_range = SIZE_REMAP_MAX - SIZE_REMAP_MIN
    if remap_range <= 0:
        return 0.0
    clamped_height = max(SIZE_REMAP_MIN, min(SIZE_REMAP_MAX, height))
    return round((clamped_height - SIZE_REMAP_MIN) / remap_range, 4)


def find_pokemon_directory(pokedex_id: int) -> Path | None:
    matches = sorted(POKEMON_DATA_ROOT.glob(f"{pokedex_id}_*"))
    for match in matches:
        if match.is_dir():
            return match
    return None


def main() -> None:
    if not POKEMON_DATA_ROOT.exists():
        raise RuntimeError(f"Missing pokemon_data directory: {POKEMON_DATA_ROOT.resolve()}")

    updated_count = 0
    missing_directory_count = 0
    fetch_error_count = 0
    height_fetch_count = 0

    print(f"Updating Pokemon heights and size values for IDs 1..{MAX_POKEDEX_ID}")
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
            data_payload = json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            print(f"[error] #{pokedex_id} invalid json payload: {json_path} -> {exc}")
            continue

        height_value = data_payload.get("height")
        if isinstance(height_value, bool) or not isinstance(height_value, (int, float)):
            try:
                pokemon_payload = fetch_json(f"{API_BASE}/pokemon/{pokedex_id}")
            except Exception as exc:
                fetch_error_count += 1
                print(f"[error] #{pokedex_id} fetch failed: {exc}")
                continue
            height_value = int(pokemon_payload.get("height", 0) or 0)
            height_fetch_count += 1
        else:
            height_value = int(height_value)

        data_payload["height"] = height_value
        data_payload["size"] = compute_size_from_height(height_value)
        json_path.write_text(json.dumps(data_payload, ensure_ascii=False, indent=2), encoding="utf-8")
        updated_count += 1

        if pokedex_id % 25 == 0:
            print(f"  - processed {pokedex_id}/{MAX_POKEDEX_ID} | json updated: {updated_count}")

    print("Done.")
    print(f"Pokemon JSON updated: {updated_count}")
    print(f"Missing pokemon directories: {missing_directory_count}")
    print(f"Fetch errors: {fetch_error_count}")
    print(f"Height fetches performed: {height_fetch_count}")


if __name__ == "__main__":
    main()
