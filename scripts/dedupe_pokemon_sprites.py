#!/usr/bin/env python3
"""Deduplicate Pokemon sprite files and in-game variant entries.

This script performs 3 operations:
1) Hashes every sprite file under pokemon_data/**/sprites and keeps one file per hash.
2) Rewrites sprite paths in every *_data.json to the canonical kept file path.
3) Removes duplicate sprite_variants per Pokemon when they resolve to the same visual pair.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

SPRITE_EXTENSIONS = {".png", ".gif", ".webp", ".jpg", ".jpeg"}
SPRITE_REFERENCE_FIELDS = ("front", "front_shiny")


def normalize_variant_id(raw_value: object) -> str:
    return str(raw_value or "").strip().lower().replace("-", "_").replace(" ", "_")


def is_sprite_file(path: Path) -> bool:
    if not path.is_file():
        return False
    if path.suffix.lower() not in SPRITE_EXTENSIONS:
        return False
    return "sprites" in path.parts


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def collect_sprite_files(root: Path) -> list[Path]:
    return sorted([path for path in root.rglob("*") if is_sprite_file(path)], key=lambda p: p.as_posix())


def build_duplicate_map(sprite_files: list[Path]) -> tuple[dict[Path, Path], list[list[Path]]]:
    files_by_hash: dict[str, list[Path]] = defaultdict(list)
    for path in sprite_files:
        files_by_hash[hash_file(path)].append(path)

    duplicate_to_canonical: dict[Path, Path] = {}
    duplicate_groups: list[list[Path]] = []
    for group in files_by_hash.values():
        if len(group) <= 1:
            continue
        ordered = sorted(group, key=lambda p: p.as_posix())
        canonical = ordered[0]
        duplicate_groups.append(ordered)
        for duplicate in ordered[1:]:
            duplicate_to_canonical[duplicate.resolve()] = canonical.resolve()
    duplicate_groups.sort(key=lambda group: (-len(group), group[0].as_posix()))
    return duplicate_to_canonical, duplicate_groups


def rewrite_path_reference(json_path: Path, raw_path: object, duplicate_to_canonical: dict[Path, Path]) -> object:
    if not isinstance(raw_path, str):
        return raw_path
    trimmed = raw_path.strip()
    if not trimmed:
        return raw_path

    resolved = (json_path.parent / trimmed).resolve()
    canonical = duplicate_to_canonical.get(resolved, resolved)
    if canonical == resolved:
        return raw_path

    relative = os.path.relpath(str(canonical), str(json_path.parent))
    return relative.replace("\\", "/")


def dedupe_variant_entries(payload: dict) -> tuple[bool, int]:
    raw_variants = payload.get("sprite_variants")
    if not isinstance(raw_variants, list):
        return False, 0

    changed = False
    removed_count = 0
    deduped_variants: list[dict] = []
    kept_by_visual_key: dict[tuple[str, str, bool], str] = {}
    seen_variant_ids: set[str] = set()
    remapped_variant_ids: dict[str, str] = {}

    for idx, raw_variant in enumerate(raw_variants):
        if not isinstance(raw_variant, dict):
            changed = True
            removed_count += 1
            continue

        variant_id = normalize_variant_id(raw_variant.get("id") or raw_variant.get("game_key") or f"variant_{idx + 1}")
        if variant_id and variant_id in seen_variant_ids:
            changed = True
            removed_count += 1
            continue

        front = str(raw_variant.get("front") or "").strip()
        front_shiny = str(raw_variant.get("front_shiny") or "").strip()
        animated = bool(raw_variant.get("animated"))
        visual_key = (front, front_shiny, animated)

        if visual_key in kept_by_visual_key:
            kept_id = kept_by_visual_key[visual_key]
            if variant_id and kept_id and variant_id != kept_id:
                remapped_variant_ids[variant_id] = kept_id
            changed = True
            removed_count += 1
            continue

        kept_by_visual_key[visual_key] = variant_id
        if variant_id:
            seen_variant_ids.add(variant_id)
        deduped_variants.append(raw_variant)

    if changed:
        payload["sprite_variants"] = deduped_variants

    default_variant_raw = payload.get("default_sprite_variant_id")
    default_variant_id = normalize_variant_id(default_variant_raw)
    kept_ids = {
        normalize_variant_id(entry.get("id") or entry.get("game_key") or "")
        for entry in deduped_variants
        if isinstance(entry, dict)
    }
    kept_ids.discard("")

    if default_variant_id in remapped_variant_ids:
        payload["default_sprite_variant_id"] = remapped_variant_ids[default_variant_id]
        changed = True
    elif default_variant_id and default_variant_id not in kept_ids:
        payload["default_sprite_variant_id"] = next(iter(kept_ids), "")
        changed = True
    elif not default_variant_id and kept_ids and payload.get("default_sprite_variant_id", ""):
        payload["default_sprite_variant_id"] = next(iter(kept_ids))
        changed = True

    return changed, removed_count


def rewrite_pokemon_json(
    json_path: Path,
    duplicate_to_canonical: dict[Path, Path],
) -> tuple[bool, int]:
    with json_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    changed = False

    sprites = payload.get("sprites")
    if isinstance(sprites, dict):
        for field in SPRITE_REFERENCE_FIELDS:
            before = sprites.get(field)
            after = rewrite_path_reference(json_path, before, duplicate_to_canonical)
            if after != before:
                sprites[field] = after
                changed = True

    variants = payload.get("sprite_variants")
    if isinstance(variants, list):
        for variant in variants:
            if not isinstance(variant, dict):
                continue
            for field in SPRITE_REFERENCE_FIELDS:
                before = variant.get(field)
                after = rewrite_path_reference(json_path, before, duplicate_to_canonical)
                if after != before:
                    variant[field] = after
                    changed = True

    variant_changed, removed_variant_count = dedupe_variant_entries(payload)
    changed = changed or variant_changed

    if changed:
        with json_path.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")

    return changed, removed_variant_count


def find_pokemon_json_files(root: Path) -> list[Path]:
    return sorted(root.glob("*/*_data.json"), key=lambda p: p.as_posix())


def remove_duplicate_files(duplicate_to_canonical: dict[Path, Path], dry_run: bool) -> int:
    removed = 0
    for duplicate_path in sorted(duplicate_to_canonical.keys(), key=lambda p: p.as_posix()):
        if not duplicate_path.exists():
            continue
        if dry_run:
            removed += 1
            continue
        duplicate_path.unlink()
        removed += 1
    return removed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deduplicate pokemon sprite files and variant entries.")
    parser.add_argument(
        "--root",
        default="pokemon_data",
        help="Path to pokemon_data directory (default: pokemon_data)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyze and report only, without writing files.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Invalid pokemon_data root: {root}")

    sprite_files = collect_sprite_files(root)
    duplicate_to_canonical, duplicate_groups = build_duplicate_map(sprite_files)
    duplicate_files_count = len(duplicate_to_canonical)

    json_files = find_pokemon_json_files(root)
    changed_json_count = 0
    removed_variant_total = 0

    for json_path in json_files:
        changed, removed_variants = rewrite_pokemon_json(
            json_path,
            duplicate_to_canonical,
        ) if not args.dry_run else rewrite_pokemon_json_preview(json_path, duplicate_to_canonical)
        if changed:
            changed_json_count += 1
        removed_variant_total += removed_variants

    removed_files_count = remove_duplicate_files(duplicate_to_canonical, dry_run=args.dry_run)

    print(f"pokemon_data_root={root.as_posix()}")
    print(f"sprite_files_total={len(sprite_files)}")
    print(f"duplicate_groups={len(duplicate_groups)}")
    print(f"duplicate_files_removed={removed_files_count}")
    print(f"pokemon_json_changed={changed_json_count}")
    print(f"sprite_variants_removed={removed_variant_total}")
    if args.dry_run:
        print("mode=dry-run")
    else:
        print("mode=apply")
    if duplicate_files_count <= 0 and removed_variant_total <= 0:
        print("status=no_changes_needed")
    return 0


def rewrite_pokemon_json_preview(json_path: Path, duplicate_to_canonical: dict[Path, Path]) -> tuple[bool, int]:
    """Dry-run helper mirroring rewrite_pokemon_json without writing files."""
    with json_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    changed = False

    sprites = payload.get("sprites")
    if isinstance(sprites, dict):
        for field in SPRITE_REFERENCE_FIELDS:
            before = sprites.get(field)
            after = rewrite_path_reference(json_path, before, duplicate_to_canonical)
            if after != before:
                sprites[field] = after
                changed = True

    variants = payload.get("sprite_variants")
    if isinstance(variants, list):
        for variant in variants:
            if not isinstance(variant, dict):
                continue
            for field in SPRITE_REFERENCE_FIELDS:
                before = variant.get(field)
                after = rewrite_path_reference(json_path, before, duplicate_to_canonical)
                if after != before:
                    variant[field] = after
                    changed = True

    variant_changed, removed_variant_count = dedupe_variant_entries(payload)
    changed = changed or variant_changed
    return changed, removed_variant_count


if __name__ == "__main__":
    raise SystemExit(main())
