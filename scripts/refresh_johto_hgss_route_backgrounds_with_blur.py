#!/usr/bin/env python3
"""Refresh Johto HGSS route backgrounds with the same subtle blur as Kanto."""

from __future__ import annotations

import io
import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request
from typing import Dict, Iterable, List

from PIL import Image, ImageFilter


ROOT = pathlib.Path(__file__).resolve().parents[1]
BACKGROUND_DIR = ROOT / "assets" / "backgrounds"
API_BASE = "https://archives.bulbagarden.net/w/api.php"
USER_AGENT = "pokeidle-johto-background-refresh/1.0"

# Keep the same blur profile as the Kanto refresh script.
BLUR_RADIUS = 2.0
BLEND_ALPHA = 0.25


def build_background_jobs() -> List[Dict[str, object]]:
    jobs: List[Dict[str, object]] = []
    for route_number in range(29, 49):
        outputs = [f"johto_route_{route_number}_hgss.png"]
        if route_number == 40:
            outputs.append("johto_sea_route_40_hgss.png")
        if route_number == 41:
            outputs.append("johto_sea_route_41_hgss.png")
        jobs.append(
            {
                "title": f"Johto_Route_{route_number}_HGSS.png",
                "outputs": outputs,
            }
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


def apply_artistic_blur(raw_image: bytes, output_paths: Iterable[pathlib.Path]) -> None:
    output_paths = list(output_paths)
    if not output_paths:
        raise RuntimeError("No output paths provided.")

    for output_path in output_paths:
        output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(io.BytesIO(raw_image)) as source:
        if source.mode not in {"RGB", "RGBA"}:
            source = source.convert("RGBA")
        blurred = source.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
        final = Image.blend(source, blurred, BLEND_ALPHA)
        for output_path in output_paths:
            final.save(output_path, format="PNG", optimize=True)


def download_and_save(job: Dict[str, object]) -> None:
    file_title = str(job["title"])
    output_names = [str(value) for value in (job.get("outputs") or []) if str(value).strip()]
    if not output_names:
        raise RuntimeError(f"No outputs configured for {file_title}")

    image_url = resolve_bulbagarden_image_url(file_title)
    raw = fetch_bytes(image_url)
    output_paths = [BACKGROUND_DIR / output_name for output_name in output_names]
    apply_artistic_blur(raw, output_paths)
    print(f"[ok] {file_title} -> {', '.join(output_names)}")


def main() -> int:
    jobs = build_background_jobs()
    print(f"[info] Refreshing {len(jobs)} Johto HGSS route background images")
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

    print("[done] all Johto route backgrounds refreshed with blur")
    return 0


if __name__ == "__main__":
    sys.exit(main())
