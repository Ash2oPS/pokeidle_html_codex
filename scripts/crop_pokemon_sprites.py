#!/usr/bin/env python3
"""
Crop all Pokemon sprites to their visible pixels.

- Static sprites (`.png`): crop to the minimal bounding box of alpha > 0.
- Animated sprites (`.gif`): compute one union bounding box across all frames,
  then crop every frame with that same box.
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from PIL import Image


SUPPORTED_EXTENSIONS = {".png", ".gif"}
SPRITE_DIR_NAME = "sprites"


@dataclass
class CropStats:
    total_files: int = 0
    changed_files: int = 0
    unchanged_files: int = 0
    empty_files: int = 0
    failed_files: int = 0
    png_files: int = 0
    gif_files: int = 0


def iter_sprite_files(root: Path) -> Iterable[Path]:
    for dirpath, _dirnames, filenames in os.walk(root):
        if os.path.basename(dirpath).lower() != SPRITE_DIR_NAME:
            continue
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.suffix.lower() in SUPPORTED_EXTENSIONS:
                yield path


def merge_bbox(a: Optional[tuple[int, int, int, int]], b: Optional[tuple[int, int, int, int]]) -> Optional[tuple[int, int, int, int]]:
    if a is None:
        return b
    if b is None:
        return a
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def alpha_bbox(image: Image.Image) -> Optional[tuple[int, int, int, int]]:
    rgba = image.convert("RGBA")
    return rgba.getchannel("A").getbbox()


def process_png(path: Path, dry_run: bool) -> str:
    with Image.open(path) as image:
        width, height = image.size
        bbox = alpha_bbox(image)
        if bbox is None:
            return "empty"
        if bbox == (0, 0, width, height):
            return "unchanged"

        if not dry_run:
            cropped = image.crop(bbox)
            cropped.save(path)
        return "changed"


def process_gif(path: Path, dry_run: bool) -> str:
    with Image.open(path) as image:
        width, height = image.size
        frame_count = getattr(image, "n_frames", 1)

        union_bbox: Optional[tuple[int, int, int, int]] = None
        for frame_index in range(frame_count):
            image.seek(frame_index)
            frame_bbox = alpha_bbox(image)
            union_bbox = merge_bbox(union_bbox, frame_bbox)

        if union_bbox is None:
            return "empty"
        if union_bbox == (0, 0, width, height):
            return "unchanged"

        if dry_run:
            return "changed"

        loop = image.info.get("loop", 0)
        background = image.info.get("background")

        frames: list[Image.Image] = []
        durations: list[int] = []
        disposals: list[int] = []
        has_full_disposal_data = True

        for frame_index in range(frame_count):
            image.seek(frame_index)
            frame = image.convert("RGBA").crop(union_bbox)
            frames.append(frame)
            durations.append(int(image.info.get("duration", 100)))

            disposal = getattr(image, "disposal_method", None)
            if disposal is None:
                has_full_disposal_data = False
            else:
                disposals.append(int(disposal))

        if not frames:
            return "empty"

        save_kwargs = {
            "save_all": True,
            "append_images": frames[1:],
            "duration": durations,
            "loop": int(loop),
        }
        if background is not None:
            save_kwargs["background"] = int(background)
        if has_full_disposal_data and len(disposals) == len(frames):
            save_kwargs["disposal"] = disposals

        frames[0].save(path, format="GIF", **save_kwargs)
        return "changed"


def main() -> int:
    parser = argparse.ArgumentParser(description="Crop all Pokemon sprites in pokemon_data/*/sprites.")
    parser.add_argument("--root", type=Path, default=Path("pokemon_data"), help="Root directory containing pokemon folders.")
    parser.add_argument("--dry-run", action="store_true", help="Compute and report changes without writing files.")
    parser.add_argument("--verbose", action="store_true", help="Print each modified file path.")
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.exists():
        print(f"[error] Root path not found: {root}")
        return 1

    files = sorted(iter_sprite_files(root))
    stats = CropStats(total_files=len(files))
    print(f"[info] Found {stats.total_files} sprite files under {root}")

    for index, path in enumerate(files, start=1):
        extension = path.suffix.lower()
        if extension == ".png":
            stats.png_files += 1
        elif extension == ".gif":
            stats.gif_files += 1

        try:
            if extension == ".png":
                result = process_png(path, args.dry_run)
            elif extension == ".gif":
                result = process_gif(path, args.dry_run)
            else:
                stats.unchanged_files += 1
                continue
        except Exception as exc:  # noqa: BLE001
            stats.failed_files += 1
            print(f"[error] {path}: {exc}")
            continue

        if result == "changed":
            stats.changed_files += 1
            if args.verbose:
                print(f"[changed] {path}")
        elif result == "empty":
            stats.empty_files += 1
            if args.verbose:
                print(f"[empty] {path}")
        else:
            stats.unchanged_files += 1

        if index % 500 == 0 or index == stats.total_files:
            print(f"[progress] {index}/{stats.total_files}")

    mode = "dry-run" if args.dry_run else "write"
    print("[summary]")
    print(f"  mode: {mode}")
    print(f"  total: {stats.total_files}")
    print(f"  png: {stats.png_files}")
    print(f"  gif: {stats.gif_files}")
    print(f"  changed: {stats.changed_files}")
    print(f"  unchanged: {stats.unchanged_files}")
    print(f"  empty: {stats.empty_files}")
    print(f"  failed: {stats.failed_files}")

    return 0 if stats.failed_files == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
