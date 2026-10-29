#!/usr/bin/env python3
"""CTI biography image importer. Requires Pillow. Originals remain unmodified."""
import argparse, io, json, re
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "content/leaders.json"
ASSETS = ROOT / "assets/biographies"
SIZE = (600, 800)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--id", required=True, help="CTI-BIO-###")
    p.add_argument("--source", required=True, help="Existing image path relative to repository root")
    p.add_argument("--crop", default=None, help="Optional normalized x,y,w,h crop rectangle (0..1)")
    p.add_argument("--activate", action="store_true", help="Make imported original the active thumbnail")
    args = p.parse_args()
    if not re.fullmatch(r"CTI-BIO-\d{3,}", args.id):
        p.error("Invalid biography ID")
    data = json.loads(DB.read_text())
    matches = [x for x in data["leaders"] if x.get("ctiId") == args.id]
    if len(matches) != 1:
        p.error("Biography ID not found or ambiguous")
    person = matches[0]
    source = (ROOT / args.source).resolve()
    if not source.is_relative_to(ROOT) or not source.is_file() or source.is_symlink():
        p.error("Source must be an existing repository image")
    if source.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        p.error("Only JPEG and PNG originals supported")
    dest = ASSETS / args.id
    dest.mkdir(parents=True, exist_ok=True)
    existing = [int(m.group(1)) for f in dest.iterdir() if (m := re.fullmatch(r"org-(\d+)\.(?:jpg|jpeg|png)", f.name, re.I))]
    number = max(existing, default=0) + 1
    org = dest / f"org-{number}{source.suffix.lower()}"
    org.write_bytes(source.read_bytes())
    with Image.open(org) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
    w, h = image.size
    if args.crop:
        try:
            x, y, cw, ch = map(float, args.crop.split(","))
        except ValueError:
            p.error("Crop must be x,y,w,h normalized fractions")
        if not (0 <= x < 1 and 0 <= y < 1 and 0 < cw <= 1 and 0 < ch <= 1 and x+cw <= 1 and y+ch <= 1):
            p.error("Invalid crop rectangle")
        left, top, right, bottom = round(x*w), round(y*h), round((x+cw)*w), round((y+ch)*h)
    else:
        # Center crop is a *draft*, not reliable face detection.
        aspect = SIZE[0] / SIZE[1]
        if w/h > aspect:
            cw = round(h*aspect); left = (w-cw)//2; right = left+cw; top = 0; bottom = h
        else:
            ch = round(w/aspect); top = (h-ch)//2; bottom = top+ch; left = 0; right = w
    crop = image.crop((left, top, right, bottom))
    if args.activate:
        crop.resize(SIZE, Image.Resampling.LANCZOS).save(dest / "THM.jpg", quality=92, subsampling=0)
    original_path = org.relative_to(ROOT).as_posix()
    photos = person.setdefault("photoOriginals", [])
    photos.append({"number": number, "path": original_path})
    if args.activate:
        person["activeOriginal"] = number
        person["photo"] = (dest / "THM.jpg").relative_to(ROOT).as_posix()
        person["thumbnailSpecification"] = {"width": 600, "height": 800, "format": "jpeg", "crop": [left, top, right, bottom], "source": original_path}
    DB.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Imported {original_path}; active={args.activate}; crop={left},{top},{right},{bottom}")

if __name__ == "__main__":
    main()
