#!/usr/bin/env python3
"""Flat download ZIP: original photos and ready-named editable THM working copies."""
import io, json, zipfile
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
records = json.loads((root / "content/leaders.json").read_text())["leaders"]
out = root / "assets/biographies/download/CTI-biography-originals.zip"
out.parent.mkdir(parents=True, exist_ok=True)
manifest = []
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for person in records:
        number = int(person["ctiId"].split("-")[-1])
        if number > 28:
            continue
        originals = person.get("photoOriginals") or []
        if not originals:
            manifest.append({"id":person["ctiId"],"name":person["name"],"status":"no-original"})
            continue
        for idx, photo in enumerate(originals, start=1):
            src = root / photo["path"]
            if not src.is_file():
                raise FileNotFoundError(f"Missing original: {src}")
            orgname = f"CTI-BIO-ORG-{number}" + (f"-{idx}" if len(originals)>1 else "") + src.suffix.lower()
            z.write(src, arcname=orgname)
            if idx == len(originals):
                with Image.open(src) as im:
                    im = ImageOps.exif_transpose(im).convert("RGB")
                    buf = io.BytesIO()
                    im.save(buf, format="JPEG", quality=95)
                thmname = f"CTI-BIO-THM-{number}.jpg"
                z.writestr(thmname, buf.getvalue())
                manifest.append({"id":person["ctiId"],"name":person["name"],"original":orgname,"workingCopy":thmname,"status":"uncropped-working-copy"})
    z.writestr("manifest.json", json.dumps(manifest,indent=2)+"\n")
print(f"Created {out} with {sum('workingCopy' in x for x in manifest)} editable copies")
