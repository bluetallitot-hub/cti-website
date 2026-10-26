#!/usr/bin/env python3
"""Regenerate shared 800x600 gallery/archive thumbnails from repository sources."""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageOps

ROOT=Path(__file__).resolve().parents[1]
db=ROOT/'content/collection-records.json'
data=json.loads(db.read_text())
changed=[]
for rec in data.get('items',[]):
    if rec.get('status')!='active' or rec.get('collection') not in ('gallery','archive'):
        continue
    dest=rec.get('thumbnailImage')
    src=rec.get('restoredImage') or rec.get('archiveImage') or rec.get('indexImage') or rec.get('originalImage')
    if not dest or not src:
        print('MISSING IMAGE REFERENCE', rec['id'])
        continue
    source=ROOT/src
    if not source.is_file():
        print('MISSING SOURCE',rec['id'],src)
        continue
    with Image.open(source) as raw:
        im=ImageOps.exif_transpose(raw).convert('RGB')
    # Trim near-white external scanner borders, without changing original source.
    probe=ImageChops.difference(im,Image.new('RGB',im.size,(255,255,255))).convert('L')
    bbox=probe.point(lambda v:255 if v>20 else 0).getbbox()
    if bbox: im=im.crop(bbox)
    # Preserve document content; do not silently crop newspaper articles or programs.
    # Photographs are fitted edge-to-edge, while documentary material is flagged
    # for a separate human-approved crop instead of discarding its text.
    if rec.get('collection') == 'archive' and not rec.get('restoredImage'):
        print('REVIEW DOCUMENT CROP', rec['id'], src)
        continue
    im=ImageOps.fit(im,(800,600),method=Image.Resampling.LANCZOS,centering=(.5,.5))
    output=ROOT/dest
    output.parent.mkdir(parents=True,exist_ok=True)
    im.save(output,format='PNG',optimize=True)
    rec['thumbnailStatus']='regenerated-800x600-review-source-content'
    rec['thumbnailSpecification']={'width':800,'height':600,'aspectRatio':'4:3','noAddedText':True,'background':'none','retouched':False}
    rec.setdefault('imageVersions',[])
    for version in rec['imageVersions']:
        if version.get('path')==dest:
            version.update({'derivedFrom':src,'method':'near-white-border-trim and 4:3 center crop; no text added'})
    changed.append(rec['id'])
db.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Regenerated',len(changed),'thumbnails:',', '.join(changed))
print('Review originals that contain printed text: automated cropping cannot identify all embedded captions.')
