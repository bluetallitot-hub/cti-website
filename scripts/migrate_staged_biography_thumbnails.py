from pathlib import Path
import json
import re
import hashlib
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
db = root / "content/leaders.json"
data = json.loads(db.read_text(encoding="utf-8"))
leaders = {int(x["ctiId"][-3:]): x for x in data["leaders"] if x.get("ctiId")}
stage = root / "assets/new"
results = {"staged": [], "migrated": [], "unmatched": [], "errors": [], "originals": []}
if not stage.is_dir():
    raise SystemExit("assets/new directory is missing")
for src in sorted(stage.rglob("*")):
    if not src.is_file():
        continue
    results["staged"].append(src.relative_to(root).as_posix())
    if src.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
        continue
    name = src.stem
    patterns = [
        r"CTI[-_ ]?BIO[-_ ]?THM[-_ ]?0*(\d{1,3})",
        r"CTI[-_ ]?BIO[-_ ]?0*(\d{1,3})[-_ ]?THM",
        r"THM[-_ ]?0*(\d{1,3})",
        r"0*(\d{1,3})[-_ ]?THM",
    ]
    number = None
    for pattern in patterns:
        match = re.fullmatch(pattern, name, re.I)
        if match:
            number = int(match.group(1))
            break
    if number not in leaders:
        results["unmatched"].append(src.relative_to(root).as_posix())
        continue
    dest = root / f"assets/biographies/CTI-BIO-{number:03d}/CTI-BIO-{number:03d}-THM.jpg"
    try:
        with Image.open(src) as im:
            original = root / f"assets/biographies/CTI-BIO-{number:03d}/CTI-BIO-{number:03d}-ORG-1{src.suffix.lower()}"
            if "ORG" in src.stem.upper() and original.exists() and hashlib.sha256(src.read_bytes()).digest() == hashlib.sha256(original.read_bytes()).digest():
                results["unmatched"].append(f"{src.name}: identical to archived original, not a cropped thumbnail")
                continue
            im = ImageOps.exif_transpose(im)
            if im.width * 4 != im.height * 3:
                results["errors"].append(f"{src.name}: aspect ratio {im.width}x{im.height} is not 3:4; not published")
                continue
            im = im.convert("RGB").resize((600, 800), Image.Resampling.LANCZOS)
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest, "JPEG", quality=93, optimize=True)
        leaders[number]["photo"] = dest.relative_to(root).as_posix()
        leaders[number]["thumbnailStatus"] = "published"
        results["migrated"].append({"source": src.relative_to(root).as_posix(), "destination": leaders[number]["photo"]})
    except Exception as exc:
        results["errors"].append(f"{src.name}: {exc}")
for number, leader in leaders.items():
    for original in leader.get("photoOriginals", []):
        old = root / original["path"]
        if not old.exists():
            results["errors"].append(f"Missing original: {original['path']}")
            continue
        new = old.with_name(f"CTI-BIO-{number:03d}-ORG-{original['number']}{old.suffix.lower()}")
        if old != new:
            if new.exists():
                results["errors"].append(f"Original destination exists: {new}")
                continue
            old.rename(new)
            original["path"] = new.relative_to(root).as_posix()
            if leader.get("originalPhoto") == old.relative_to(root).as_posix():
                leader["originalPhoto"] = original["path"]
        results["originals"].append(original["path"])
data["updated"] = "2026-10-29"
db.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
report = root / "assets/biographies/thumbnail-migration-report.json"
report.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: len(v) for k, v in results.items()}, indent=2))
print("Staged filenames:", results["staged"])
print("Unmatched:", results["unmatched"])
print("Errors:", results["errors"])
