#!/usr/bin/env python3
"""Convert approved CTI sermon HTML into Markdown data and one shared renderer.
No legacy forwarding pages: the user explicitly approved removal.
"""
import json,re,html
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path('.')
class Convert(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.out=[];self.href=None;self.ignore=0
 def handle_starttag(self,t,a):
  d=dict(a)
  if t in ('script','style'):self.ignore+=1
  if self.ignore:return
  if t=='p':self.out.append('\n\n')
  if t=='blockquote':self.out.append('\n\n> ')
  if t in ('strong','b'):self.out.append('**')
  if t in ('em','i'):self.out.append('*')
  if t=='br':self.out.append('\n')
  if t=='a':self.href=d.get('href')
  if t in ('h2','h3'):self.out.append('\n\n'+'#'*(int(t[1]))+' ')
 def handle_endtag(self,t):
  if t in ('script','style'):self.ignore=max(0,self.ignore-1)
  if self.ignore:return
  if t in ('strong','b'):self.out.append('**')
  if t in ('em','i'):self.out.append('*')
  if t=='a':self.href=None
  if t in ('h2','h3','p','blockquote'):self.out.append('\n\n')
 def handle_data(self,d):
  if not self.ignore:self.out.append(d)
def attr(s,key):
 m=re.search(r'<(?:meta|[^>]+)\b[^>]*',s,re.I)
 return m
def main():
 files=sorted(Path('sermons').glob('dvar-torah-*.html'))+sorted(Path('sermons').glob('sermon-*.html'))
 entries=[]
 dest=Path('content/dvar-torah/2026');dest.mkdir(parents=True,exist_ok=True)
 for file in files:
  s=file.read_text()
  title=html.unescape(re.search(r'<h1[^>]*>(.*?)</h1>',s,re.S|re.I).group(1))
  eyebrow=re.search(r'<div class="eyebrow">(.*?)</div>',s,re.S)
  lead=re.search(r'<p class="lead">(.*?)</p>',s,re.S)
  match=re.search(r'<div class="wrap content sermon">(.*?)</div>\s*</section>',s,re.S)
  if not match:raise ValueError('No sermon body '+str(file))
  body=match.group(1)
  # Keep editorially meaningful podcast callouts in metadata; avoid converting site navigation to text.
  podcast=re.search(r'<aside\b.*?</aside>',body,re.S)
  podurl=re.search(r'href="(https://[^"]+)"',podcast.group(0)) if podcast else None
  body=re.sub(r'<aside\b.*?</aside>','',body,flags=re.S)
  body=re.sub(r'<p><a class="textlink".*?</p>','',body,flags=re.S)
  parser=Convert();parser.feed(body)
  markdown=''.join(parser.out).strip()
  markdown=re.sub(r'\n{3,}','\n\n',markdown)
  slug=file.stem
  destfile=dest/(slug+'.md')
  destfile.write_text(markdown+'\n')
  category='holiday' if slug.startswith('sermon-') else 'weekly'
  entries.append({'id':slug,'title':title,'eyebrow':html.unescape(eyebrow.group(1)) if eyebrow else '', 'byline':html.unescape(re.sub('<[^>]+>','',lead.group(1))) if lead else 'Rabbi Phillip Blue','category':category,'file':destfile.as_posix(),'podcast':podurl.group(1) if podurl else None})
 Path('content/dvar-torah/index.json').write_text(json.dumps({'version':1,'items':entries},indent=2,ensure_ascii=False)+'\n')
 # Replace legacy root and nested files entirely, per explicit instruction.
 for file in files:file.unlink()
 for file in Path('.').glob('dvar-torah-*.html'):file.unlink()
 for file in Path('.').glob('sermon-*.html'):file.unlink()
 # Update archive links to shared template.
 torah=Path('torah.html');s=torah.read_text()
 for e in entries:
  s=s.replace('href="'+e['id']+'.html"','href="dvar-torah.html?id='+e['id']+'"')
 torah.write_text(s)
 print('Converted',len(entries),'sermons; removed obsolete HTML pages')
if __name__=='__main__':main()
