#!/usr/bin/env python3
"""Migrate existing CTI leader photos into stable CTI-BIO folders.
No source file is deleted. Only images already in the leadership database are imported.
Non-portrait and unverified portraits are staged but NOT published.
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parents[1]
db=json.loads((ROOT/"content/leaders.json").read_text())
report=[]
for person in db["leaders"]:
    path=(person.get("photo") or "").split("?")[0]
    if not path:
        report.append({"id":person["ctiId"],"name":person["name"],"status":"no-photo"})
        continue
    source=ROOT/path
    if not source.is_file() or source.suffix.lower() not in {".jpg",".jpeg",".png"}:
        report.append({"id":person["ctiId"],"name":person["name"],"status":"missing-or-unsupported","source":path})
        continue
    # Stage every original. A safe automated crop cannot be inferred from image dimensions alone.
    folder=ROOT/"assets/biographies"/person["ctiId"]
    if folder.exists() and list(folder.glob("org-*")):
        report.append({"id":person["ctiId"],"name":person["name"],"status":"already-staged"})
        continue
    subprocess.run([sys.executable,str(ROOT/"scripts/import_biography_photo.py"),"--id",person["ctiId"],"--source",path],check=True)
    with Image.open(source) as im:
        width,height=ImageOps.exif_transpose(im).size
    report.append({"id":person["ctiId"],"name":person["name"],"status":"original-staged-needs-crop-review","source":path,"width":width,"height":height})
out=ROOT/"assets/biographies/migration-report.json"
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({"staged":sum(x["status"]=="original-staged-needs-crop-review" for x in report),"unresolved":sum(x["status"]=="missing-or-unsupported" for x in report)},indent=2))
