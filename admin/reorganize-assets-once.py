#!/usr/bin/env python3
"""One-time CTI asset migration. Run at repository root; preserves historical originals."""
from pathlib import Path
import re, subprocess, json
from urllib.parse import unquote, quote
root=Path('.')
assets=Path('assets')
moves={}
for f in sorted(assets.iterdir()):
    if not f.is_file() or f.name in ('site.js','styles.css'): continue
    n=f.name; s=n.lower()
    if f.suffix.lower()=='.pdf':
        if 'newsletter' in s: d='assets/resources/newsletters/2026'
        elif 'anniversary-program' in s or 'gibely-address' in s: d='assets/archive/originals'
        else: d='assets/resources/siddurim'
    elif f.suffix.lower()=='.zip': d='assets/archive/originals'
    elif f.suffix.lower() in ('.jpg','.jpeg','.png','.heic'):
        if re.search(r'-original|original-blue|original-page|i-581-|clipping|article|obituary|plaque-original|1992-origins|1992-in-search|program-timeline|1997-75th-anniversary-invitation|1972-salem-news',s): d='assets/archive/originals'
        elif 'founder' in s or 'charter' in s: d='assets/images/founders'
        elif 'president' in s: d='assets/images/presidents'
        elif re.search(r'profile|portrait|rabbi-blue|leadership|david-leon|joseph-havian|morris-gibely|ralph-bencangey|betty-polonsky|harvey-elefson|jerry-pressman|joanne-pressman',s): d='assets/images/leadership'
        elif 'logo' in s: d='assets/images/branding'
        elif re.search(r'anniversary|1972|1997|2012|2022|centennial',s): d='assets/images/anniversaries'
        else: d='assets/images/gallery'
    else: continue
    target=Path(d)/n
    if target.exists(): raise RuntimeError('Collision: '+str(target))
    target.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(['git','mv',str(f),str(target)],check=True)
    moves[str(f)]=str(target)
# Replace old paths in all tracked text files. Longest first to avoid prefix collisions.
text_ext={'.html','.css','.js','.json','.md','.yml','.yaml','.xml','.txt'}
for p in root.rglob('*'):
    if not p.is_file() or '.git' in p.parts or p.suffix.lower() not in text_ext: continue
    if p.parts[0] in ('backup-audit','.github'): continue # immutable audit and protected workflows
    try: old=p.read_text(encoding='utf-8')
    except UnicodeDecodeError: continue
    new=old
    for src,dst in sorted(moves.items(),key=lambda t:-len(t[0])):
        new=new.replace(src,dst).replace(src.replace(' ','%20'),dst.replace(' ','%20'))
    if new!=old: p.write_text(new,encoding='utf-8')
# Preserve root HTML URLs, root styles and JS, and original recovery branch.
for required in ('index.html','resources.html','assets/site.js','assets/styles.css'):
    assert Path(required).is_file(),required
# Validate that all local assets references in site pages/data resolve.
missing=[]
for p in list(root.glob('*.html'))+list(root.glob('content/*.json'))+list(root.glob('admin/*.html')):
    data=p.read_text(encoding='utf-8')
    for hit in re.findall(r'(?:\.\./)?assets/[A-Za-z0-9_ ./()%+-]+?\.(?:jpg|jpeg|png|heic|pdf|zip)',data,re.I):
        q=unquote(hit.removeprefix('../'))
        if not Path(q).is_file() and Path(q).name not in {'marvin-menovich-profile.png','wendy-tirck-profile.png','fran-arsenault-shaheen-profile.png'}: missing.append((str(p),hit))
if missing:
    print('Unresolved asset references:',json.dumps(missing[:60],indent=2))
    raise SystemExit(1)
print('Migrated',len(moves),'assets and validated references')
Path('backup-audit/2026-10-15-reorganization-map.json').write_text(json.dumps(moves,indent=2,ensure_ascii=False)+'\n')
