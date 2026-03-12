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


def fetch_bytes(url: str) -> bytes:
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": "pokeidle-catch-rate-downloader/1.0 (+https://pokeapi.co)",
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
    unchanged_count = 0
    missing_directory_count = 0
    fetch_error_count = 0

    print(f"Updating Pokemon catch rates for IDs 1..{MAX_POKEDEX_ID}")
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

        try:
            species_payload = fetch_json(f"{API_BASE}/pokemon-species/{pokedex_id}")
        except Exception as exc:
            fetch_error_count += 1
            print(f"[error] #{pokedex_id} fetch failed: {exc}")
            continue

        catch_rate = int(species_payload.get("capture_rate", 45) or 45)
        previous = data_payload.get("catch_rate")
        data_payload["catch_rate"] = catch_rate

        if previous != catch_rate:
            json_path.write_text(json.dumps(data_payload, ensure_ascii=False, indent=2), encoding="utf-8")
            updated_count += 1
        else:
            unchanged_count += 1

        if pokedex_id % 25 == 0:
            print(
                f"  - processed {pokedex_id}/{MAX_POKEDEX_ID} "
                f"| updated: {updated_count} | unchanged: {unchanged_count}"
            )

    print("Done.")
    print(f"Pokemon JSON updated: {updated_count}")
    print(f"Pokemon JSON unchanged: {unchanged_count}")
    print(f"Missing pokemon directories: {missing_directory_count}")
    print(f"Fetch errors: {fetch_error_count}")


if __name__ == "__main__":
    main()
