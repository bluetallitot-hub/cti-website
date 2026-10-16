#!/usr/bin/env python3
"""Phase 3: connect archival listings, lay biographies and source-backed editors.
Preserve historical originals, old URLs and rabbi-specific pages.
"""
import json,re
from pathlib import Path
from html import escape
root=Path('.')
archives=json.loads(Path('content/archives/index.json').read_text())['items']
directory=json.loads(Path('content/biography-directory.json').read_text())['people']
bios={x['name']:x for x in json.loads(Path('content/leadership-bios.json').read_text())['leaders']}
# Historical listings: change only links to migrated historical records.
for page in [Path('press.html'),Path('history.html')]:
 if not page.exists():continue
 s=page.read_text()
 for a in archives:
  old=a['id']+'.html';new='historical-record.html?id='+a['id']
  s=s.replace('href="'+old+'"','href="'+new+'"')
 page.write_text(s)
# Lay biographies: canonical reader, old URLs remain available.
p=Path('leadership.html');s=p.read_text()
for i,x in enumerate(directory):
 slug=Path(x['url']).stem
 x['id']=slug
 x['display_order']=i+1
 if x['name'] not in bios:raise ValueError('Biography missing: '+x['name'])
 s=s.replace('href="'+x['url']+'"','href="leader-profile.html?id='+slug+'"')
p.write_text(s)
Path('content/biography-directory.json').write_text(json.dumps({'version':2,'people':directory},indent=2,ensure_ascii=False)+'\n')
# Verify public links and original files
for x in archives:
 assert Path(x['transcription']).is_file()
 assert Path(x['legacy_page']).is_file()
 for scan in x['scans']:assert Path(scan).is_file(),scan
for x in directory:
 assert Path(x['url']).is_file()
 assert x['name']!='Rabbi Phillip Blue'
assert Path('rabbi-bio.html').is_file()
print('Updated archive links for',len(archives),'records and leadership links for',len(directory),'lay people; old pages preserved.')
