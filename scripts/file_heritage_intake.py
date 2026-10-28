#!/usr/bin/env python3
"""Safely file CTI-001..038 intake assets into per-record Heritage directories."""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEW = ROOT / "assets" / "new"
HERITAGE = ROOT / "assets" / "heritage"
DB = ROOT / "content" / "collection-records.json"
PATTERN = re.compile(r"^(CTI-(?:00[1-9]|0[1-2][0-9]|03[0-8]))-(ORG|ENH|THM|SEP|COL|DOC|IMG|THUMB)-([0-9]+)\.(jpg|jpeg|png|webp|gif|pdf|tif|tiff)$", re.I)


def replace_exact(obj, old, new):
    if isinstance(obj, dict):
        return {k: replace_exact(v, old, new) for k, v in obj.items()}
    if isinstance(obj, list):
        return [replace_exact(v, old, new) for v in obj]
    if isinstance(obj, str) and obj == old:
        return new
    return obj


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Perform changes (default: audit only)")
    args = parser.parse_args()
    files = sorted([p for p in NEW.rglob("*") if p.is_file() and p.name != ".gitkeep"] + [p for p in ROOT.iterdir() if p.is_file() and PATTERN.fullmatch(p.name)])
    planned, skipped, conflicts = [], [], []
    for src in files:
        match = PATTERN.fullmatch(src.name)
        if not match or src.parent not in (NEW, ROOT):
            skipped.append(src.relative_to(ROOT).as_posix())
            continue
        dest = HERITAGE / match.group(1).upper() / src.name
        if dest.exists():
            # Never overwrite, even if identical; leave for human review.
            conflicts.append((str(src.relative_to(ROOT)), str(dest.relative_to(ROOT))))
        else:
            planned.append((src, dest))
    report = {
        "mode": "apply" if args.apply else "dry-run",
        "moves": [{"from": str(s.relative_to(ROOT)), "to": str(d.relative_to(ROOT))} for s, d in planned],
        "conflicts": [{"from": s, "existing_destination": d} for s, d in conflicts],
        "left_in_new_for_review": skipped,
    }
    print(json.dumps(report, indent=2))
    if conflicts:
        raise SystemExit("Destination conflicts detected. No changes made; resolve duplicates first.")
    if not args.apply:
        return
    data = json.loads(DB.read_text(encoding="utf-8"))
    for src, dest in planned:
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "mv", "--", str(src.relative_to(ROOT)), str(dest.relative_to(ROOT))], cwd=ROOT, check=True)
        old = src.relative_to(ROOT).as_posix()
        new = dest.relative_to(ROOT).as_posix()
        data = replace_exact(data, old, new)
        # If a record references this basename through the old collections path,
        # update only that record's explicit website asset fields.
        record = next((r for r in data.get("items", []) if r.get("id") == dest.parent.name), None)
        if record:
            for field in ("thumbnailImage", "restoredImage", "originalImage", "indexImage", "archiveImage"):
                value = record.get(field)
                if isinstance(value, str) and value.split("/")[-1] == src.name and value.startswith("assets/"):
                    record[field] = new
            for v in record.get("imageVersions", []):
                if isinstance(v, dict) and isinstance(v.get("path"), str) and v["path"].split("/")[-1] == src.name and v["path"].startswith("assets/"):
                    v["path"] = new
    if planned:
        DB.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        subprocess.run(["git", "add", "--", str(DB.relative_to(ROOT))], cwd=ROOT, check=True)
    print(f"Moved {len(planned)} files. {len(skipped)} unmatched files remain untouched.")
    if skipped:
        print("REVIEW REQUIRED: unmatched intake files were preserved.")


if __name__ == "__main__":
    main()
