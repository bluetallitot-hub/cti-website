(async function(){
 const $=id=>document.getElementById(id);
 const id=new URLSearchParams(location.search).get('id');
 const fail=msg=>{$('title').textContent='D’var Torah unavailable';$('text').textContent=msg};
 if(!id||!/^[a-z0-9-]+$/.test(id)){fail('Please select a D’var Torah from the archive.');return}
 try{
  const index=await fetch('content/dvar-torah/index.json').then(r=>{if(!r.ok)throw Error('Index unavailable');return r.json()});
  const item=CTITorahFiles.find(index.items,id);
  if(!item||item.status==='unpublished'||!/^content\/dvar-torah\/[A-Za-z0-9/() .'-]+\.md$/.test(CTITorahFiles.path(item)))throw Error('D’var Torah not found');
  const md=await fetch(CTITorahFiles.path(item)).then(r=>{if(!r.ok)throw Error('Text unavailable');return r.text()});
  $('title').textContent=item.title;
  $('byline').textContent=item.byline||'Rabbi Phillip Blue';
  $('eyebrow').textContent=item.eyebrow||'D’var Torah';
  document.title=item.title+' | Congregation Tifereth Israel';
  if(item.podcast&&/^https:\/\//.test(item.podcast)){
   const a=document.createElement('a');a.className='btn';a.href=item.podcast;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Listen to podcast ↗';
   const p=document.createElement('p');p.append(a);$('podcast').append(p);
  }
  // Safe, intentionally limited Markdown: no raw HTML injection.
  function inline(s){
   const frag=document.createDocumentFragment();
   const parts=s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
   for(const part of parts){
    if(part.startsWith('**')&&part.endsWith('**')){const b=document.createElement('strong');b.textContent=part.slice(2,-2);frag.append(b)}
    else if(part.startsWith('*')&&part.endsWith('*')){const e=document.createElement('em');e.textContent=part.slice(1,-1);frag.append(e)}
    else frag.append(document.createTextNode(part));
   }
   return frag;
  }
  const blocks=md.replace(/\r\n/g,'\n').split(/\n\s*\n/);
  for(const block of blocks){
   if(!block.trim())continue;
   const h=block.match(/^(#{1,3})\s+([\s\S]*)$/);
   const q=block.startsWith('> ');
   const el=document.createElement(h?'h'+h[1].length:q?'blockquote':'p');
   const text=h?h[2]:q?block.replace(/^>\s?/gm,''):block;
   el.append(inline(text.replace(/\n/g,' ')));$('text').append(el);
  }
 }catch(e){fail(e.message)}
})();