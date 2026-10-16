#!/usr/bin/env python3
"""Check CTI asset registry consistency, published references and quarantine protection."""
import json,hashlib,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
db=json.loads((root/'content/asset-registry.json').read_text())
assets=db['assets']
issues=[]
ids=set();paths=set();hashes={}
for a in assets:
    ident=a.get('id');path=a.get('path')
    if ident in ids:issues.append('duplicate ID '+str(ident))
    ids.add(ident)
    if path in paths:issues.append('duplicate path '+str(path))
    paths.add(path)
    if not path or not (root/path).is_file():
        issues.append('missing registered file '+str(path));continue
    if a.get('status')=='quarantined' and '/possible-duplicates/' not in path:
        issues.append('quarantined file outside quarantine '+path)
    actual=hashlib.sha256((root/path).read_bytes()).hexdigest()
    if actual!=a.get('sha256'):issues.append('hash mismatch '+path)
    hashes.setdefault(actual,[]).append(ident)
for digest,matches in hashes.items():
    if len(matches)>1:issues.append('identical file under multiple IDs '+', '.join(matches))
manifest=root/'assets/possible-duplicates/manifest.json'
if manifest.exists():
    for m in json.loads(manifest.read_text()):
        p=m.get('restored_path') or m['quarantine_path']
        if p not in paths and (root/p).is_file():issues.append('unregistered quarantined/restored file '+p)
report={'assets':len(assets),'quarantined':sum(a.get('status')=='quarantined' for a in assets),'issues':issues}
(root/'backup-audit/asset-registry-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
sys.exit(bool(issues))
