#!/usr/bin/env python3
"""Localize the 2019 Jewish Journal welcome photograph; fail closed."""
from pathlib import Path
import json, urllib.request
from PIL import Image
from io import BytesIO

root=Path(__file__).resolve().parents[1]
url="https://images.openai.com/static-rsc-1/XxoSSTbFAB6YwXVdnJS3zWBcEzXrugtlNLZS7C6sr5FXPH_KdsVv-6LD-SUSnBqX2PMk1l3ph0C7BhdKxu07uYAFj-LvhOLhyFR-85NVViZdZ9yspgyj74j2-EBeMyNV"
target=root/"assets/images/archive/CTI-026-2019-jewish-journal-photo.png"
request=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 CTI archival preservation"})
with urllib.request.urlopen(request,timeout=30) as response:
    raw=response.read(20_000_000)
im=Image.open(BytesIO(raw))
im.verify()
im=Image.open(BytesIO(raw)).convert("RGB")
if min(im.size)<150:
    raise ValueError("Source image is unexpectedly small")
target.parent.mkdir(parents=True,exist_ok=True)
im.save(target,"PNG",optimize=True)
rel=target.relative_to(root).as_posix()
index=root/"index.html"
html=index.read_text()
if url not in html:
    raise ValueError("Expected homepage source URL not found")
index.write_text(html.replace(url,rel))
db=root/"content/collection-records.json"
data=json.loads(db.read_text())
record=next(x for x in data["items"] if x["id"]=="CTI-026")
record["indexImage"]=rel
record["archiveImage"]=rel
record["existingImageCandidate"]=rel
record["preservationStatus"]="local-copy-preserved-original-source-unverified"
db.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
print("Localized CTI-026 to",rel,"size",im.size)
