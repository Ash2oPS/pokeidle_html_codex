from __future__ import annotations

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
SIZE_REMAP_MIN = 10
SIZE_REMAP_MAX = 100
REPO_ROOT = Path(__file__).resolve().parents[3]
POKEMON_DATA_ROOT = REPO_ROOT / "pokemon_data"


def fetch_bytes(url: str, user_agent: str, accept: str = "application/json,*/*") -> bytes:
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": user_agent,
                    "Accept": accept,
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


def fetch_json(url: str, user_agent: str) -> dict[str, Any]:
    return json.loads(fetch_bytes(url, user_agent=user_agent).decode("utf-8"))


def find_pokemon_directory(pokedex_id: int, pokemon_data_root: Path = POKEMON_DATA_ROOT) -> Path | None:
    matches = sorted(pokemon_data_root.glob(f"{pokedex_id}_*"))
    for match in matches:
        if match.is_dir():
            return match
    return None


def compute_size_from_height(height_value: int | float | None) -> float:
    height = float(height_value or 0)
    remap_range = SIZE_REMAP_MAX - SIZE_REMAP_MIN
    if remap_range <= 0:
        return 0.0
    clamped_height = max(SIZE_REMAP_MIN, min(SIZE_REMAP_MAX, height))
    return round((clamped_height - SIZE_REMAP_MIN) / remap_range, 4)
