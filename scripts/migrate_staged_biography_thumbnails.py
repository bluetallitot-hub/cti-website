from pathlib import Path
import json
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
db = root / "content/leaders.json"
data = json.loads(db.read_text())
leaders = {int(x["ctiId"][-3:]): x for x in data["leaders"] if x.get("ctiId")}
results = []
for src in sorted((root / "assets/new").glob("*")):
    m = re.fullmatch(r"(?:CTI-BIO-)?THM-(\d{1,3})|CTI-BIO-(\d{1,3})-THM", src.stem, re.I)
    if not m or src.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
        continue
    number = int(m.group(1) or m.group(2))
    if number not in leaders:
        continue
    with Image.open(src) as im:
        if im.size != (600, 800):
            print("Skipping unexpected dimensions:", src.name, im.size)
            continue
        dest = root / f"assets/biographies/CTI-BIO-{number:03d}/CTI-BIO-{number:03d}-THM.jpg"
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.convert("RGB").save(dest, "JPEG", quality=92)
    leaders[number]["photo"] = dest.relative_to(root).as_posix()
    leaders[number]["thumbnailStatus"] = "published"
    results.append([src.name, leaders[number]["photo"]])
for number, leader in leaders.items():
    for item in leader.get("photoOriginals", []):
        old = root / item["path"]
        if not old.exists():
            continue
        new = old.with_name(f"CTI-BIO-{number:03d}-ORG-{item['number']}{old.suffix}")
        if old != new and not new.exists():
            old.rename(new)
            item["path"] = new.relative_to(root).as_posix()
            if leader.get("originalPhoto") == old.relative_to(root).as_posix():
                leader["originalPhoto"] = item["path"]
db.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
(root / "assets/biographies/thumbnail-migration-report.json").write_text(json.dumps(results, indent=2))
print("Migrated", len(results), "thumbnails")
