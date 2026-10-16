#!/usr/bin/env python3
"""Phase 3: extract archival transcription and metadata without modifying originals."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,html
class Extract(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.parts=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ('script','style'):self.skip+=1
  if self.skip:return
  if t in ('p','h2','h3','li','blockquote'):self.parts.append('\n\n')
  if t=='br':self.parts.append('\n')
 def handle_endtag(self,t):
  if t in ('script','style'):self.skip=max(0,self.skip-1)
  if not self.skip and t in ('p','h2','h3','li','blockquote'):self.parts.append('\n\n')
 def handle_data(self,s):
  if not self.skip:self.parts.append(s)
def text(s):
 p=Extract();p.feed(s);return re.sub(r'\n{3,}','\n\n',''.join(p.parts)).strip()
def main():
 root=Path('content/archives');(root/'transcriptions').mkdir(parents=True,exist_ok=True)
 entries=[]
 for f in sorted(Path('archives').glob('archive-*.html')):
  source=f.read_text()
  h=re.search(r'<h1[^>]*>(.*?)</h1>',source,re.S|re.I)
  if not h:raise ValueError('Missing title: '+str(f))
  title=text(h.group(1))
  lead=re.search(r'<p class="lead">(.*?)</p>',source,re.S|re.I)
  transcript=re.search(r'<article\b[^>]*class="[^"]*archive-transcript[^"]*"[^>]*>(.*?)</article>',source,re.S|re.I)
  if not transcript:raise ValueError('Missing transcription: '+str(f))
  body=text(transcript.group(1))
  if len(body)<80:raise ValueError('Suspiciously short transcription: '+str(f))
  scans=list(dict.fromkeys(re.findall(r'(?:src|href)="(assets/archive/[^"]+\.(?:jpg|jpeg|png|webp|pdf))"',source,re.I)))
  citation=re.search(r'<p class="archive-source">(.*?)</p>',source,re.S|re.I)
  path=root/'transcriptions'/(f.stem+'.txt');path.write_text(body+'\n')
  entries.append({'id':f.stem,'title':title,'subtitle':text(lead.group(1)) if lead else '', 'citation':text(citation.group(1)) if citation else '', 'scans':scans,'transcription':path.as_posix(),'status':'published','legacy_page':f.as_posix(),'review':'extracted from published HTML; requires source-image comparison'})
 (root/'index.json').write_text(json.dumps({'version':1,'items':entries},ensure_ascii=False,indent=2)+'\n')
 print('Extracted',len(entries),'historical records; original HTML and scans untouched')
if __name__=='__main__':main()
