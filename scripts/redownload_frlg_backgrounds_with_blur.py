#!/usr/bin/env python3
"""Redownload FR/LG area backgrounds and apply a subtle artistic blur.

This script resolves Bulbagarden file URLs via the MediaWiki API, downloads each
image, then saves a lightly blurred PNG to assets/backgrounds.
"""

from __future__ import annotations

import io
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, Iterable, List

from PIL import Image, ImageFilter


ROOT = pathlib.Path(__file__).resolve().parents[1]
BACKGROUND_DIR = ROOT / "assets" / "backgrounds"
API_BASE = "https://archives.bulbagarden.net/w/api.php"
USER_AGENT = "pokeidle-frlg-background-refresh/1.0"

# Subtle blur profile:
# - blur radius is intentionally low
# - blend keeps most original pixels to preserve readability
BLUR_RADIUS = 2.0
BLEND_ALPHA = 0.35


def build_background_jobs() -> List[Dict[str, str]]:
    jobs: List[Dict[str, str]] = []

    for route_number in range(1, 26):
        jobs.append(
            {
                "title": f"Kanto_Route_{route_number}_FRLG.png",
                "output": f"kanto_route_{route_number}_frlg.png",
            }
        )

    jobs.extend(
        [
            {"title": "Pallet_Town_FRLG.png", "output": "kanto_city_pallet_town_frlg.png"},
            {"title": "Viridian_City_FRLG.png", "output": "kanto_city_viridian_city_frlg.png"},
            {"title": "Pewter_City_FRLG.png", "output": "kanto_city_pewter_city_frlg.png"},
            {"title": "Cerulean_City_FRLG.png", "output": "kanto_city_cerulean_city_frlg.png"},
            {"title": "Vermilion_City_FRLG.png", "output": "kanto_city_vermilion_city_frlg.png"},
            {"title": "Lavender_Town_FRLG.png", "output": "kanto_city_lavender_town_frlg.png"},
            {"title": "Saffron_City_FRLG.png", "output": "kanto_city_saffron_city_frlg.png"},
            {"title": "Celadon_City_FRLG.png", "output": "kanto_city_celadon_city_frlg.png"},
            {"title": "Fuchsia_City_FRLG.png", "output": "kanto_city_fuchsia_city_frlg.png"},
            {"title": "Cinnabar_Island_FRLG.png", "output": "kanto_city_cinnabar_island_frlg.png"},
            {"title": "Indigo_Plateau_FRLG.png", "output": "kanto_city_indigo_plateau_frlg.png"},
            {"title": "Viridian_Forest_FRLG.png", "output": "kanto_dungeon_viridian_forest_frlg.png"},
            {"title": "Mt_Moon_1F_FRLG.png", "output": "kanto_dungeon_mt_moon_frlg.png"},
            {"title": "Kanto_Digletts_Cave_Map.png", "output": "kanto_dungeon_digletts_cave_frlg.png"},
            {"title": "Power_Plant_interior_FRLG.png", "output": "kanto_dungeon_power_plant_frlg.png"},
            {"title": "Rock_Tunnel_1F_FRLG.png", "output": "kanto_dungeon_rock_tunnel_frlg.png"},
            {"title": "Pok\u00e9mon_Tower_FRLG.png", "output": "kanto_dungeon_pokemon_tower_frlg.png"},
            {"title": "Safari_Zone_area_1_FRLG.png", "output": "kanto_dungeon_safari_zone_frlg.png"},
            {"title": "Seafoam_Islands_1F_FRLG.png", "output": "kanto_dungeon_seafoam_islands_frlg.png"},
            {"title": "Pok\u00e9mon_Mansion_FRLG.png", "output": "kanto_dungeon_pokemon_mansion_frlg.png"},
            {"title": "Victory_Road_1F_FRLG.png", "output": "kanto_dungeon_victory_road_frlg.png"},
            {"title": "Cerulean_Cave_1F_FRLG.png", "output": "kanto_dungeon_cerulean_cave_frlg.png"},
        ]
    )

    return jobs


def fetch_bytes(url: str, retries: int = 4) -> bytes:
    last_error: Exception | None = None
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001
            last_error = error
            time.sleep(0.3 * (attempt + 1))
    if last_error is None:
        raise RuntimeError(f"Unable to fetch URL: {url}")
    raise last_error


def resolve_bulbagarden_image_url(file_title: str) -> str:
    title = f"File:{file_title}"
    params = {
        "action": "query",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }
    api_url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    payload = json.loads(fetch_bytes(api_url).decode("utf-8"))
    pages = payload.get("query", {}).get("pages", {})
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if infos and infos[0].get("url"):
            return str(infos[0]["url"])
    raise RuntimeError(f"Bulbagarden file not found: {file_title}")


def apply_artistic_blur(raw_image: bytes, output_path: pathlib.Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(raw_image)) as source:
        if source.mode not in {"RGB", "RGBA"}:
            source = source.convert("RGBA")
        blurred = source.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
        final = Image.blend(source, blurred, BLEND_ALPHA)
        final.save(output_path, format="PNG", optimize=True)


def download_and_save(job: Dict[str, str]) -> None:
    file_title = job["title"]
    output_name = job["output"]
    output_path = BACKGROUND_DIR / output_name
    image_url = resolve_bulbagarden_image_url(file_title)
    raw = fetch_bytes(image_url)
    apply_artistic_blur(raw, output_path)
    print(f"[ok] {file_title} -> {output_name}")


def main() -> int:
    jobs = build_background_jobs()
    print(f"[info] Refreshing {len(jobs)} FR/LG background images")
    failures: List[str] = []

    for job in jobs:
        try:
            download_and_save(job)
        except Exception as error:  # noqa: BLE001
            message = f"{job['title']}: {error}"
            failures.append(message)
            print(f"[warn] {message}")

    if failures:
        print(f"[done] completed with {len(failures)} failure(s)")
        return 1
    print("[done] all backgrounds refreshed with blur")
    return 0


if __name__ == "__main__":
    sys.exit(main())
