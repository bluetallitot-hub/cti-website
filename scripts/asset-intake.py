#!/usr/bin/env python3
"""CTI media intake: validate staged files, detect duplicates, allocate permanent IDs.
Usage: python3 scripts/asset-intake.py --file intake/example.jpg --collection GAL --title "..." [--source "..."] [--apply]
Default is a non-destructive dry run. --apply moves the staged file into its collection and updates the registry.
"""
import argparse,hashlib,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
REG=ROOT/'content/asset-registry.json'
COLLECTIONS={'ARC':'assets/archive/intake','GAL':'assets/images/gallery','PRE':'assets/images/presidents','FND':'assets/images/founders','LDR':'assets/images/leadership','RES':'assets/resources/intake'}
ALLOWED={'.jpg','.jpeg','.png','.webp','.gif','.svg','.pdf','.mp3','.mp4'}
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def slug(s):
    return re.sub('-+','-',re.sub('[^a-z0-9]+','-',s.lower())).strip('-')[:75]
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--file',required=True)
    p.add_argument('--collection',required=True,choices=COLLECTIONS)
    p.add_argument('--title',required=True)
    p.add_argument('--source',default='')
    p.add_argument('--source-drive-id',default='')
    p.add_argument('--rights',default='')
    p.add_argument('--apply',action='store_true')
    args=p.parse_args()
    file=(ROOT/args.file).resolve()
    if not file.is_file() or not file.is_relative_to(ROOT/'intake'):
        p.error('File must exist inside the intake/ staging directory')
    if file.suffix.lower() not in ALLOWED:p.error('Unsupported file extension')
    if not slug(args.title):p.error('A descriptive title is required')
    db=json.loads(REG.read_text())
    digest=sha(file)
    dup=[{'id':a['id'],'path':a['path'],'status':a['status']} for a in db['assets'] if a.get('sha256')==digest]
    if dup:
        print(json.dumps({'result':'duplicate','sha256':digest,'matches':dup},indent=2))
        return 2
    used={a['id'] for a in db['assets']}
    seq=1
    while f'{args.collection}-{seq:04d}' in used:seq+=1
    id=f'{args.collection}-{seq:04d}'
    destination=Path(COLLECTIONS[args.collection])/(id+'-'+slug(args.title)+file.suffix.lower())
    if (ROOT/destination).exists():p.error('Destination already exists')
    entry={'id':id,'collection':args.collection,'title':args.title,'path':destination.as_posix(),'original_filename':file.name,'source_reference':args.source or None,'source_drive_id':args.source_drive_id or None,'rights':args.rights or None,'legacy_paths':[],'roles':[],'notes':'Intake registration; verify source provenance and original preservation before publication.','sha256':digest,'bytes':file.stat().st_size,'status':'pending-review'}
    print(json.dumps({'result':'ready','apply':args.apply,'asset':entry},indent=2))
    if not args.apply:return 0
    (ROOT/destination).parent.mkdir(parents=True,exist_ok=True)
    file.rename(ROOT/destination)
    db['assets'].append(entry)
    REG.write_text(json.dumps(db,indent=2,ensure_ascii=False)+'\n')
    print('Registered as pending-review; publication requires editorial approval.')
    return 0
if __name__=='__main__':sys.exit(main())
