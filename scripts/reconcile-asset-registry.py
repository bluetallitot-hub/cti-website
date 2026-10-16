#!/usr/bin/env python3
"""Reconcile asset metadata against files actually present; never move/delete media."""
import hashlib, json, re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
dbpath=root/"content/asset-registry.json"
db=json.loads(dbpath.read_text())
old=db["assets"]
manifest=json.loads((root/"assets/possible-duplicates/manifest.json").read_text())
moves={m.get("original_path"):m.get("restored_path") for m in manifest if m.get("restored_path")}
by_hash={}
for p in (root/"assets").rglob("*"):
    if p.is_file() and p.suffix.lower() in {".jpg",".jpeg",".png",".webp",".gif",".svg",".pdf",".mp3",".mp4",".webm"}:
        digest=hashlib.sha256(p.read_bytes()).hexdigest()
        by_hash.setdefault(digest,[]).append(p.relative_to(root).as_posix())
used=set()
entries=[]
max_id=0
for a in old:
    m=re.match(r"^[A-Z]+-(\d+)$",str(a.get("id","")))
    if m:max_id=max(max_id,int(m.group(1)))
    path=a.get("path")
    if not path:continue
    if not (root/path).is_file():
        candidate=moves.get(path)
        if candidate and (root/candidate).is_file():
            path=candidate
        else:
            matches=by_hash.get(a.get("sha256"),[])
            available=[v for v in matches if v not in used]
            if len(available)==1:path=available[0]
            else:continue
    if path in used:continue
    a["path"]=path
    data=(root/path).read_bytes()
    a["sha256"]=hashlib.sha256(data).hexdigest()
    a["bytes"]=len(data)
    if "possible-duplicates/" in path:a["status"]="quarantined"
    elif a.get("status")=="quarantined":a["status"]="preserved"
    used.add(path)
    entries.append(a)
for digest,paths in sorted(by_hash.items()):
    for path in paths:
        if path in used:continue
        max_id+=1
        entries.append({"id":f"AST-{max_id:04d}","collection":"AST","title":Path(path).stem.replace("-"," ").replace("_"," ").title(),"path":path,"original_filename":Path(path).name,"source_reference":None,"source_drive_id":None,"legacy_paths":[],"roles":[],"notes":"Discovered during Phase 3 registry reconciliation; provenance not independently reviewed.","sha256":digest,"bytes":(root/path).stat().st_size,"status":"quarantined" if "possible-duplicates/" in path else "preserved"})
        used.add(path)
db["assets"]=entries
dbpath.write_text(json.dumps(db,indent=2,ensure_ascii=False)+"\n")
print(f"Reconciled {len(old)} entries into {len(entries)}; media files untouched")
