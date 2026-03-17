#!/usr/bin/env python3
"""Refresh Hoenn Emerald zone backgrounds with the same subtle blur as Kanto/Johto."""

from __future__ import annotations

import io
import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request
from typing import Dict, Iterable, List, Optional

from PIL import Image, ImageFilter


ROOT = pathlib.Path(__file__).resolve().parents[1]
MAP_DATA_DIR = ROOT / "map_data"
BACKGROUND_DIR = ROOT / "assets" / "backgrounds"
MAP_DIR = ROOT / "assets" / "maps"
SOURCE_OF_TRUTH_PATH = MAP_DATA_DIR / "hoenn_emerald_source_of_truth.json"
API_BASE = "https://archives.bulbagarden.net/w/api.php"
USER_AGENT = "pokeidle-hoenn-background-refresh/1.0"
HOENN_MAP_URL = (
    "https://raw.githubusercontent.com/pret/pokeemerald/master/graphics/pokenav/region_map/map.png"
)
HOENN_MAP_OUTPUT = MAP_DIR / "hoenn_map_emerald.png"
HOENN_CATEGORY = "Category:Hoenn maps"

BLUR_RADIUS = 2.0
BLEND_ALPHA = 0.25


def fetch_bytes(url: str, retries: int = 4) -> bytes:
    last_error: Exception | None = None
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001
            last_error = error
            time.sleep(0.35 * (attempt + 1))
    if last_error is None:
        raise RuntimeError(f"Unable to fetch URL: {url}")
    raise last_error


def fetch_json(url: str) -> Dict[str, object]:
    return json.loads(fetch_bytes(url).decode("utf-8"))


def normalize_title_key(title: str) -> str:
    return " ".join(str(title or "").replace("_", " ").lower().split())


def load_source_of_truth() -> Dict[str, object]:
    return json.loads(SOURCE_OF_TRUTH_PATH.read_text(encoding="utf-8"))


def iter_hoenn_category_titles() -> Dict[str, str]:
    titles: Dict[str, str] = {}
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": HOENN_CATEGORY,
        "cmlimit": "max",
        "format": "json",
    }
    while True:
        api_url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
        payload = fetch_json(api_url)
        members = payload.get("query", {}).get("categorymembers", [])
        for member in members:
            title = str(member.get("title", "")).removeprefix("File:").strip()
            if title:
                titles[normalize_title_key(title)] = title
        cont = payload.get("continue")
        if not cont:
            break
        params.update(cont)
    return titles


def resolve_bulbagarden_image_url(file_title: str) -> str:
    params = {
        "action": "query",
        "titles": f"File:{file_title}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }
    api_url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    payload = fetch_json(api_url)
    pages = payload.get("query", {}).get("pages", {})
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if infos and infos[0].get("url"):
            return str(infos[0]["url"])
    raise RuntimeError(f"Bulbagarden file not found: {file_title}")


def resolve_candidate_title(candidates: Iterable[str], title_index: Dict[str, str]) -> Optional[str]:
    for candidate in candidates:
        normalized = normalize_title_key(candidate)
        if normalized in title_index:
            return title_index[normalized]
    return None


def apply_artistic_blur(raw_image: bytes, output_path: pathlib.Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(raw_image)) as source:
        if source.mode not in {"RGB", "RGBA"}:
            source = source.convert("RGBA")
        blurred = source.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
        final = Image.blend(source, blurred, BLEND_ALPHA)
        final.save(output_path, format="PNG", optimize=True)


def download_zone_backgrounds(source_of_truth: Dict[str, object]) -> List[str]:
    zones = source_of_truth.get("zones") or []
    title_index = iter_hoenn_category_titles()
    failures: List[str] = []

    for zone in zones:
        route_id = str(zone.get("route_id", "")).strip()
        output_rel = str(zone.get("background_image", "")).strip()
        candidates = [str(title).strip() for title in zone.get("background_title_candidates") or [] if str(title).strip()]
        if not route_id or not output_rel:
            failures.append(f"{route_id or '<empty>'}: missing route_id/background_image")
            continue
        resolved_title = resolve_candidate_title(candidates, title_index)
        if not resolved_title:
            failures.append(f"{route_id}: no Bulbagarden title matched candidates {candidates}")
            continue
        try:
            image_url = resolve_bulbagarden_image_url(resolved_title)
            raw = fetch_bytes(image_url)
            apply_artistic_blur(raw, ROOT / output_rel)
            print(f"[ok] {route_id} -> {resolved_title}")
        except Exception as error:  # noqa: BLE001
            failures.append(f"{route_id}: {error}")
            print(f"[warn] {route_id}: {error}")

    return failures


def download_region_map() -> None:
    raw = fetch_bytes(HOENN_MAP_URL)
    HOENN_MAP_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    HOENN_MAP_OUTPUT.write_bytes(raw)
    print(f"[ok] region map -> {HOENN_MAP_OUTPUT.relative_to(ROOT)}")


def main() -> int:
    if not SOURCE_OF_TRUTH_PATH.exists():
        print(f"[warn] missing {SOURCE_OF_TRUTH_PATH}")
        return 1

    source_of_truth = load_source_of_truth()
    download_region_map()
    failures = download_zone_backgrounds(source_of_truth)
    if failures:
        print(f"[done] completed with {len(failures)} failure(s)")
        return 1
    print("[done] all Hoenn Emerald zone backgrounds refreshed with blur")
    return 0


if __name__ == "__main__":
    sys.exit(main())
