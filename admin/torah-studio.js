(()=>{'use strict';const $=id=>document.getElementById(id),base='https://bluetallitot-hub.github.io/cti-website/';let records=[],catalog={version:1,items:[]},catalogSha=null;const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const slug=s=>String(s||'draft').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');function state(){return Object.fromEntries(['date','parasha','title','category','website','podcast','podcastNotes','subject','opening','body','closing','signature','summary','sermon'].map(k=>[k,$(k).value.trim()]))}function render(){const x=state(),p=$('preview');p.replaceChildren();const h=document.createElement('h2');h.textContent=x.title||'D’var Torah';p.append(h);for(const t of [x.opening,x.body,x.closing,x.signature])if(t){const el=document.createElement('p');el.textContent=t;p.append(el)}for(const [name,url] of [['Read the D’var Torah',x.website],['Listen to the podcast',x.podcast]])if(/^https:\/\//i.test(url)){const el=document.createElement('p'),a=document.createElement('a');a.href=url;a.textContent=name;el.append(a);p.append(el)}}function emailText(){const x=state();return [x.opening,x.body,x.website?'Read the D’var Torah: '+x.website:'',x.podcast?'Listen to the podcast: '+x.podcast:'',x.closing,x.signature].filter(Boolean).join('\n\n')}function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}function fill(r){$('title').value=r.title||'';$('category').value=r.category||'weekly';$('parasha').value=(r.byline||'').split(' · ')[0];$('podcast').value=r.podcast||'';$('website').value=base+'dvar-torah.html?id='+encodeURIComponent(CTITorahFiles.key(r));$('subject').value='D’var Torah — '+(r.title||'');$('body').value='';$('date').value='';$('podcastNotes').value='';$('status').textContent='Loaded '+CTITorahFiles.key(r)+'. Paste the approved CTI email text; the source sermon is not modified.';render();drawList();updatePublicationUI()}$('record').onchange=()=>{const r=records.find(x=>CTITorahFiles.key(x)===$('record').value);if(r)fill(r);else{++sourceLoadSequence;loadedSource=null;$('title').value='';$('podcast').value='';$('website').value='';$('sermon').value='';$('body').value='';$('status').textContent='New draft';render();updatePublicationUI()}};$('title').oninput=()=>{if(!$('record').value)$('subject').value='D’var Torah — '+$('title').value;render()};for(const k of ['opening','body','closing','signature','website','podcast'])$(k).addEventListener('input',render);$('previewBtn').onclick=render;$('copyEmail').onclick=async()=>{try{await navigator.clipboard.writeText('Subject: '+$('subject').value+'\n\n'+emailText());$('status').textContent='Email copied.'}catch(e){$('status').textContent='Copy unavailable; use Download email HTML.'}};$('downloadEmail').onclick=()=>{const x=state(),paragraphs=[x.opening,x.body,x.closing,x.signature].filter(Boolean).map(t=>'<p style="white-space:pre-wrap">'+escape(t)+'</p>').join('');const links=[['Read the D’var Torah',x.website],['Listen to the podcast',x.podcast]].filter(([_,u])=>/^https:\/\//i.test(u)).map(([t,u])=>'<p><a href="'+escape(u)+'">'+t+'</a></p>').join('');download(slug(x.date+'-'+x.title)+'-friday-email.html','<!doctype html><html><head><meta charset="utf-8"><title>'+escape(x.subject)+'</title></head><body style="font:16px/1.65 Georgia,serif;max-width:650px;margin:30px auto;padding:20px"><h2>'+escape(x.title)+'</h2>'+paragraphs+links+'</body></html>','text/html')};$('downloadDraft').onclick=()=>download(slug($('title').value)+'-editorial.json',JSON.stringify({schemaVersion:1,recordId:$('record').value||null,...state()},null,2)+'\n','application/json');CTIAuth.requireRole(false).then(async()=>{$('main').hidden=false;try{const response=await fetch('../content/dvar-torah/index.json',{cache:'no-store'});if(!response.ok)throw Error('Cannot load Torah index');const d=await response.json();records=d.items||[];catalog=d;for(const r of records){const o=document.createElement('option');o.value=CTITorahFiles.key(r);o.textContent=r.title+' — '+CTITorahFiles.key(r);$('record').append(o)}$('status').textContent=records.length+' existing D’var Torah records available.';render();drawList();updatePublicationUI();loadPublicationAccess()}catch(e){$('status').textContent=e.message}}).catch(()=>{})
function showTab(name){for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===name));for(const p of document.querySelectorAll('[data-pane]'))p.hidden=p.dataset.pane!==name}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>showTab(b.dataset.tab);
function drawList(){const target=$('recordList');target.replaceChildren();const term=$('search').value.trim().toLowerCase();const filtered=records.filter(r=>[CTITorahFiles.key(r),r.title,r.byline].join(' ').toLowerCase().includes(term));$('recordCount').textContent=filtered.length+' of '+records.length+' records';for(const r of filtered){const b=document.createElement('button');b.type='button';b.textContent=(r.status==='unpublished'||r.published===false?'[Unpublished] ':'[Published] ')+r.title+' — '+(r.byline||CTITorahFiles.key(r));b.className=$('record').value===CTITorahFiles.key(r)?'active':'';b.onclick=()=>{$('record').value=CTITorahFiles.key(r);fill(r);drawList();updatePublicationUI();showTab('editor')};target.append(b)}}
$('search').oninput=drawList;
$('newRecord').onclick=()=>{++sourceLoadSequence;loadedSource=null;$('record').value='';for(const id of ['date','parasha','title','website','podcast','podcastNotes','subject','body','summary','sermon'])$(id).value='';$('category').value='weekly';$('status').textContent='New draft. No record created on the public website.';render();drawList();updatePublicationUI();showTab('editor')};
let sourceLoadSequence=0,loadedSource=null;
async function loadSourceMarkdown(r){
  const sequence=++sourceLoadSequence;
  const sourcePath=CTITorahFiles.path(r);
  $('sermon').value='';loadedSource=null;
  $('body').value='';
  $('status').textContent='Loading website Markdown from '+sourcePath+'…';
  try{
    let markdown,sha=null;
    try{
      const source=await CTIAuth.api('/torah/source?path='+encodeURIComponent(sourcePath));
      markdown=source.content;sha=source.sha;
    }catch(apiError){
      const response=await fetch('../'+sourcePath,{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      markdown=await response.text();
    }
    if(sequence!==sourceLoadSequence)return;
    $('sermon').value=markdown;
    loadedSource={path:sourcePath,sha,original:markdown};
    renderReaderPreview();
    try {
      const emailPath=CTITorahFiles.path(r,'Email');
      const response=await fetch('../'+emailPath,{cache:'no-store'});
      if(response.ok&&sequence===sourceLoadSequence){$('body').value=await response.text();render()}
    }catch(e){console.warn('Email Edition unavailable',e)}
    $('status').textContent='Loaded Reader Edition from '+sourcePath+'. Edit and save a separate draft; publishing requires explicit approval.';
  }catch(error){
    if(sequence!==sourceLoadSequence)return;
    $('status').textContent='Could not load '+sourcePath+' ('+error.message+'). The editor is blank; no source file was changed.';
  }
}
const originalFill=fill;fill=function(r){originalFill(r);$('summary').value=r.description||'';loadSourceMarkdown(r);};
$('commitTorah').onclick=async()=>{
  $('status').textContent='Direct publication is disabled until an approval workflow is implemented.';
  return;
  const button=$('commitTorah'),record=records.find(r=>CTITorahFiles.key(r)===$('record').value);
  if(!record||!loadedSource||loadedSource.path!==CTITorahFiles.path(record)){$('status').textContent='Select an existing D’var Torah and wait for its Markdown to load.';return}
  const content=$('sermon').value;
  if(!content.trim()){$('status').textContent='Cannot commit empty Markdown.';return}
  if(content===loadedSource.original){$('status').textContent='No Markdown changes to commit.';return}
  if(!loadedSource.sha){$('status').textContent='GitHub commit is not available until the updated CTI admin API is deployed. Save a draft or download Markdown instead.';return}
  if(!confirm('Commit changes to '+loadedSource.path+' on GitHub main? This will publish the revised D’var Torah.'))return;
  button.disabled=true;$('status').textContent='Committing Markdown to GitHub…';
  try{const result=await CTIAuth.api('/torah/commit',{path:loadedSource.path,expectedSha:loadedSource.sha,content});
    loadedSource={...loadedSource,sha:result.sha,original:content};
    $('status').textContent='Committed successfully to GitHub: '+result.commit+'. The public site will update after deployment.';
  }catch(e){$('status').textContent='Commit failed: '+e.message+'. Your edits remain in the editor.'}
  finally{button.disabled=false}
};
function renderReaderPreview(){
 const el=$('readerPreview');if(!el)return;el.replaceChildren();
 const markdown=$('sermon').value.replace(/\r\n/g,'\n');
 for(const block of markdown.split(/\n\s*\n/)){
  if(!block.trim())continue;
  const h=block.match(/^(#{1,3})\s+([\s\S]*)$/);
  const isQuote=block.startsWith('> ');
  const node=document.createElement(h?'h'+h[1].length:isQuote?'blockquote':'p');
  const content=(h?h[2]:isQuote?block.replace(/^>\s?/gm,''):block).replace(/\n/g,' ');
  const pieces=content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  for(const piece of pieces){if(piece.startsWith('**')&&piece.endsWith('**')){const bold=document.createElement('strong');bold.textContent=piece.slice(2,-2);node.append(bold)}else if(piece.startsWith('*')&&piece.endsWith('*')){const italic=document.createElement('em');italic.textContent=piece.slice(1,-1);node.append(italic)}else node.append(document.createTextNode(piece))}
  el.append(node);
 }
}
$('sermon').addEventListener('input',renderReaderPreview);
function updatePublicationUI(){
 const r=records.find(x=>CTITorahFiles.key(x)===$('record').value);
 const button=$('togglePublish'),label=$('publicationState');
 if(!r){button.disabled=true;button.textContent='Publish / Unpublish';label.textContent='Select an existing D’var Torah.';return}
 const published=r.status!=='unpublished'&&r.published!==false;
 button.textContent=published?'Unpublish':'Publish';
 button.disabled=!catalogSha;
 label.textContent='Status: '+(published?'Published':'Unpublished')+(catalogSha?'':' · Publishing requires the updated admin API');
}
async function loadPublicationAccess(){
 try{const response=await CTIAuth.api('/torah/catalog');catalogSha=response.sha;if(Array.isArray(response.items)){records=response.items;catalog.items=records}drawList()}catch(e){catalogSha=null}updatePublicationUI();
}
$('togglePublish').onclick=async()=>{
 const record=records.find(x=>CTITorahFiles.key(x)===$('record').value);
 if(!record||!catalogSha)return;
 const published=record.status!=='unpublished'&&record.published!==false;
 const next=!published;
 if(!confirm((next?'Publish':'Unpublish')+' “'+record.title+'”? '+(next?'It will appear publicly.':'It will be hidden from the public library.')))return;
 const button=$('togglePublish');button.disabled=true;
 try{const result=await CTIAuth.api('/torah/publication',{recordId:CTITorahFiles.key(record),published:next,expectedSha:catalogSha});
 catalogSha=result.sha;record.status=next?'published':'unpublished';record.published=next;
 $('status').textContent=record.title+' is now '+record.status+'.';drawList();
 }catch(e){$('status').textContent='Publication change failed: '+e.message}
 updatePublicationUI();
};
$('exportEmailMarkdown').onclick=()=>{const x=state();if(!x.title||!x.body){$('status').textContent='Enter a title and Email Edition text first.';return}const r=records.find(r=>CTITorahFiles.key(r)===$('record').value);download(r?CTITorahFiles.path(r,'Email').split('/').pop():slug(x.title)+'-Email.md',x.body+'\n','text/markdown')};
$('saveSession').onclick=()=>{sessionStorage.setItem('ctiTorahWorkingDraft',JSON.stringify({recordId:$('record').value,...state()}));$('status').textContent='Working draft saved in this browser tab. Export a JSON backup for long-term storage.'};
function applyDraft(d){++sourceLoadSequence;loadedSource=null;for(const id of ['date','parasha','title','category','website','podcast','podcastNotes','subject','opening','body','closing','signature','summary','sermon'])if(typeof d[id]==='string')$(id).value=d[id];$('record').value=records.some(r=>CTITorahFiles.key(r)===d.recordId)?d.recordId:'';render();renderReaderPreview();drawList()}
$('loadSession').onclick=()=>{try{const d=JSON.parse(sessionStorage.getItem('ctiTorahWorkingDraft')||'null');if(!d)throw Error('No saved draft in this browser tab');applyDraft(d);$('status').textContent='Working draft restored.'}catch(e){$('status').textContent=e.message}};
$('importDraftButton').onclick=()=>$('importDraft').click();
$('importDraft').onchange=async()=>{try{const f=$('importDraft').files[0];if(!f)return;if(f.size>1048576)throw Error('Draft is too large');const d=JSON.parse(await f.text());if(!d||d.schemaVersion!==1)throw Error('Not a compatible editorial draft');applyDraft(d);$('status').textContent='Draft imported for review. Nothing published.'}catch(e){$('status').textContent=e.message}};
$('exportWebsite').onclick=()=>{const x=state();if(!x.title||!x.sermon){$('status').textContent='Enter a title and website D’var Torah text first.';return}download((records.find(r=>CTITorahFiles.key(r)===$('record').value)?CTITorahFiles.path(records.find(r=>CTITorahFiles.key(r)===$('record').value),'Reader').split('/').pop():slug(x.date+'-'+x.title)+'.md'),x.sermon+'\n','text/markdown')};
$('exportIndex').onclick=()=>{const x=state(),id=$('record').value||'dvar-torah-'+(x.date||'undated')+'-'+slug(x.title);if(!x.title||!x.date){$('status').textContent='Title and publication date are required for index export.';return}if(x.podcast&&!/^https:\/\//.test(x.podcast)){ $('status').textContent='Podcast URL must use HTTPS.';return}const item={id,title:x.title,eyebrow:(x.category==='holiday'?'Holiday Sermon':'D’var Torah')+' · '+x.date,byline:(x.parasha?x.parasha+' · ':'')+'Rabbi Phillip Blue',category:x.category,file:(()=>{const r=records.find(r=>CTITorahFiles.key(r)===id);return r?CTITorahFiles.path(r):null})(),podcast:x.podcast||null};const next=JSON.parse(JSON.stringify(catalog));const i=next.items.findIndex(r=>CTITorahFiles.key(r)===id);if(i>=0)next.items[i]={...next.items[i],title:item.title,eyebrow:item.eyebrow,byline:item.byline,category:item.category,podcast:item.podcast};else { $('status').textContent='New records require book/portion or holiday metadata before export. Nothing published.';return };download('dvar-torah-index-proposed.json',JSON.stringify(next,null,2)+'\n','application/json');$('status').textContent='Proposed index exported. Upload the Markdown file at the listed path before committing the index. No changes published.'};
})();