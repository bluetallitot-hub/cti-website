#!/usr/bin/env python3
"""CTI controlled page migration, content inventory, and validation."""
import json, re, html, hashlib
from pathlib import Path
from urllib.parse import urlsplit, unquote
from html.parser import HTMLParser

ROOT=Path('.')
GROUPS={
 'archives': ['archive-','album-anniversary-'],
 'press': ['press-'],
 'sermons': ['dvar-torah-','sermon-'],
 'resources': ['melodies-']
}
EXCLUDE={'archive-founders.html','archive-presidents.html','archive-record.html'}
def page_group(name):
    if name in EXCLUDE:return None
    for folder,prefixes in GROUPS.items():
        if any(name.startswith(p) for p in prefixes):return folder
    return None
def migrate():
    moved=[]
    for file in sorted(ROOT.glob('*.html')):
        folder=page_group(file.name)
        if not folder:continue
        target=Path(folder)/file.name
        target.parent.mkdir(exist_ok=True)
        if target.exists():continue
        original=file.read_text()
        # Keep root-relative navigation functional from nested location.
        # A base element resolves relative URLs against the original root URL.
        if re.search(r'<head\b[^>]*>',original,re.I):
            updated=re.sub(r'(<head\b[^>]*>)',r'\1<base href="../">',original,count=1,flags=re.I)
        else:
            raise ValueError('Missing head in '+str(file))
        target.write_text(updated)
        label=html.escape(file.stem.replace('-',' ').title())
        file.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url='+target.as_posix()+'"><link rel="canonical" href="'+target.as_posix()+'"><title>'+label+' | CTI</title></head><body><main><p>This page has moved to <a href="'+target.as_posix()+'">'+label+'</a>.</p></main></body></html>\n')
        moved.append({'legacy':file.as_posix(),'canonical':target.as_posix(),'sha256_original':hashlib.sha256(original.encode()).hexdigest()})
    path=Path('content/page-migration-map.json')
    old=json.loads(path.read_text()) if path.exists() else {'version':1,'pages':[]}
    seen={x['legacy']:x for x in old['pages']}
    for x in moved:seen[x['legacy']]=x
    path.write_text(json.dumps({'version':1,'pages':list(seen.values())},indent=2)+'\n')
    print('Migrated',len(moved),'pages')

class Links(HTMLParser):
    def __init__(self):
        super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        for attr in ('src','href','poster'):
            if attr in d:self.refs.append((tag,attr,d[attr]))
def audit():
    files=list(ROOT.rglob('*.html'))
    missing=[]
    for p in files:
        if any(x in p.parts for x in ('.git','node_modules')):continue
        parser=Links();parser.feed(p.read_text(errors='replace'))
        base=p.parent
        # All migrated pages explicitly declare the root base.
        if '<base href="../">' in p.read_text(errors='replace'):base=ROOT
        for tag,attr,ref in parser.refs:
            if not ref or ref.startswith(('#','//','mailto:','tel:','data:','javascript:')):continue
            u=urlsplit(ref)
            if u.scheme or not u.path:continue
            if u.path.startswith('/'):continue # host-relative URLs need deployment-aware resolution
            local=(base/unquote(u.path))
            if not local.exists():
                missing.append({'page':p.as_posix(),'attribute':attr,'reference':ref})
    report={'checked_html_pages':len(files),'missing_relative_references':missing}
    Path('backup-audit').mkdir(exist_ok=True)
    Path('backup-audit/site-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Checked',len(files),'HTML pages;',len(missing),'unresolved relative references')
    for x in missing[:20]:print('  ',x)
    return len(missing)
if __name__=='__main__':
    import sys
    if '--migrate' in sys.argv:migrate()
    issues=audit()
    if '--strict' in sys.argv and issues:sys.exit(1)
