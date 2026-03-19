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
    croppable_png_files: int = 0
    croppable_gif_files: int = 0
    gif_runtime_tight_fit_files: int = 0


@dataclass
class FileReport:
    action: str
    externally_croppable: bool = False
    requires_runtime_tight_fit: bool = False


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


def bbox_is_full(bbox: tuple[int, int, int, int], width: int, height: int) -> bool:
    return bbox == (0, 0, width, height)


def rebase_bbox(
    bbox: Optional[tuple[int, int, int, int]],
    crop_bbox: tuple[int, int, int, int],
) -> Optional[tuple[int, int, int, int]]:
    if bbox is None:
        return None
    crop_left, crop_top, _crop_right, _crop_bottom = crop_bbox
    return (
        bbox[0] - crop_left,
        bbox[1] - crop_top,
        bbox[2] - crop_left,
        bbox[3] - crop_top,
    )


def process_png(path: Path, dry_run: bool) -> FileReport:
    with Image.open(path) as image:
        width, height = image.size
        bbox = alpha_bbox(image)
        if bbox is None:
            return FileReport(action="empty")
        if bbox_is_full(bbox, width, height):
            return FileReport(action="unchanged")

        if not dry_run:
            cropped = image.crop(bbox)
            cropped.save(path)
        return FileReport(action="changed", externally_croppable=True)


def process_gif(path: Path, dry_run: bool) -> FileReport:
    with Image.open(path) as image:
        width, height = image.size
        frame_count = getattr(image, "n_frames", 1)

        union_bbox: Optional[tuple[int, int, int, int]] = None
        frame_bboxes: list[Optional[tuple[int, int, int, int]]] = []
        for frame_index in range(frame_count):
            image.seek(frame_index)
            frame_bbox = alpha_bbox(image)
            frame_bboxes.append(frame_bbox)
            union_bbox = merge_bbox(union_bbox, frame_bbox)

        if union_bbox is None:
            return FileReport(action="empty")

        cropped_width = max(1, union_bbox[2] - union_bbox[0])
        cropped_height = max(1, union_bbox[3] - union_bbox[1])
        externally_croppable = not bbox_is_full(union_bbox, width, height)
        requires_runtime_tight_fit = any(
            rebased_bbox is not None and not bbox_is_full(rebased_bbox, cropped_width, cropped_height)
            for rebased_bbox in (rebase_bbox(frame_bbox, union_bbox) for frame_bbox in frame_bboxes)
        )
        if not externally_croppable and not requires_runtime_tight_fit:
            return FileReport(action="unchanged")

        if dry_run:
            return FileReport(
                action="changed" if externally_croppable else "unchanged",
                externally_croppable=externally_croppable,
                requires_runtime_tight_fit=requires_runtime_tight_fit,
            )

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

        if externally_croppable:
            frames[0].save(path, format="GIF", **save_kwargs)

        return FileReport(
            action="changed" if externally_croppable else "unchanged",
            externally_croppable=externally_croppable,
            requires_runtime_tight_fit=requires_runtime_tight_fit,
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Crop all Pokemon sprites in pokemon_data/*/sprites.")
    parser.add_argument("--root", type=Path, default=Path("pokemon_data"), help="Root directory containing pokemon folders.")
    parser.add_argument("--dry-run", action="store_true", help="Compute and report changes without writing files.")
    parser.add_argument("--verbose", action="store_true", help="Print each modified file path.")
    parser.add_argument(
        "--fail-on-croppable-png",
        action="store_true",
        help="Return a non-zero exit code when at least one PNG can still be cropped.",
    )
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
                report = process_png(path, args.dry_run)
            elif extension == ".gif":
                report = process_gif(path, args.dry_run)
            else:
                stats.unchanged_files += 1
                continue
        except Exception as exc:  # noqa: BLE001
            stats.failed_files += 1
            print(f"[error] {path}: {exc}")
            continue

        if report.action == "changed":
            stats.changed_files += 1
        elif report.action == "empty":
            stats.empty_files += 1
        else:
            stats.unchanged_files += 1

        if extension == ".png" and report.externally_croppable:
            stats.croppable_png_files += 1
        if extension == ".gif" and report.externally_croppable:
            stats.croppable_gif_files += 1
        if extension == ".gif" and report.requires_runtime_tight_fit:
            stats.gif_runtime_tight_fit_files += 1

        if args.verbose:
            labels: list[str] = [report.action]
            if report.externally_croppable:
                labels.append("crop")
            if report.requires_runtime_tight_fit:
                labels.append("runtime-tight-fit")
            print(f"[{'/'.join(labels)}] {path}")

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
    print(f"  croppable_png: {stats.croppable_png_files}")
    print(f"  croppable_gif: {stats.croppable_gif_files}")
    print(f"  gif_runtime_tight_fit: {stats.gif_runtime_tight_fit_files}")

    if stats.failed_files > 0:
        return 2
    if args.fail_on_croppable_png and stats.croppable_png_files > 0:
        print("[error] Croppable PNG sprites detected.")
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
