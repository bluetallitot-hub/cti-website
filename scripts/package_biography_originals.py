#!/usr/bin/env python3
"""Bundle all staged CTI biography originals into one downloadable ZIP in GitHub."""
import json, zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
records=json.loads((root/"content/leaders.json").read_text())["leaders"]
out=root/"assets/biographies/download/CTI-biography-originals.zip"
out.parent.mkdir(parents=True,exist_ok=True)
manifest=[]
with zipfile.ZipFile(out,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for person in records:
        for photo in person.get("photoOriginals",[]):
            src=root/photo["path"]
            if not src.is_file():
                raise FileNotFoundError(f"Missing original for {person['ctiId']}: {src}")
            z.write(src,arcname=f"{person['ctiId']}-{src.name}")
            manifest.append({"id":person["ctiId"],"name":person["name"],"file":f"{person['ctiId']}-{src.name}"})
    z.writestr("manifest.json",json.dumps(manifest,indent=2)+"\n")
print(f"Created {out.relative_to(root)} with {len(manifest)} original images")
