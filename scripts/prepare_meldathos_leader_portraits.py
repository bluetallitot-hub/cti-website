#!/usr/bin/env python3
"""Create consistently cropped Meldathos portraits from approved leader/founder sources."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "content/meldados.json"
OUT = ROOT / "assets/images/meldados"
SIZE = (600, 600)  # Match square memorial-board and printable tribute photos
# Initial verified cross-links between leadership photos and memorial records.
IDS = {
    "newsletter-elliot-hershoff-tishrei",
    "newsletter-david-leon-tishrei",
    "newsletter-joseph-gibely-ii-cheshvan",
    "yahrzeit-josephhavian-shevat-2",
    "yahrzeit-morrisgibely-nissan-14",
}

def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    processed = set()
    seen = set()
    skipped = []
    for person in data["people"]:
        mid = person.get("id", "")
        if mid not in IDS:
            continue
        seen.add(mid)
        source_path = person.get("photo", "")
        if not source_path.startswith("assets/images/leadership/"):
            raise ValueError(f"{mid}: expected original leadership portrait, got {source_path!r}")
        source = ROOT / source_path
        if not source.is_file():
            skipped.append(f"{mid}: source missing: {source_path}")
            continue
        target = OUT / (mid + ".jpg")
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            # Crop to square aspect ratio, biased upward to keep the face in view.
            image = ImageOps.fit(image, SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.30))
            image.save(target, "JPEG", quality=92, optimize=True, subsampling=0)
        person["photo"] = target.relative_to(ROOT).as_posix()
        processed.add(mid)
        print(f"{person.get('englishName')}: {source_path} -> {person['photo']}")
    missing = IDS - seen
    if missing:
        raise ValueError(f"Missing memorial records: {sorted(missing)}")
    if skipped:
        print("Skipped missing source photographs (no record changed):")
        for item in skipped:
            print("  " + item)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
