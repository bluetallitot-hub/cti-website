(async()=>{
 const el=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id');
 const fail=s=>{el('title').textContent='Record unavailable';el('transcript').textContent=s};
 if(!id||!/^[a-z0-9-]+$/.test(id))return fail('Select a record from the archive.');
 try{
  const data=await fetch('content/archives/index.json').then(r=>{if(!r.ok)throw Error('Archive index unavailable');return r.json()});
  const x=data.items.find(v=>v.id===id&&(v.status==='published'||(id==='archive-elliot-hershoff-obituary'&&v.status==='unlisted')));
  if(!x||!/^content\/archives\/transcriptions\/[a-z0-9-]+\.txt$/.test(x.transcription))throw Error('Record not found');
  const txt=await fetch(x.transcription).then(r=>{if(!r.ok)throw Error('Transcription unavailable');return r.text()});
  el('title').textContent=x.title;el('subtitle').textContent=x.subtitle||'';el('citation').textContent=x.citation||'Source citation pending review';
  if(x.id==='archive-elliot-hershoff-obituary'){const p=document.createElement('p');const a=document.createElement('a');a.href='https://jewishjournal.org/wp-content/uploads/2024/10/2024_10.17_JewishJournal.pdf#page=18';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Read the original Jewish Journal issue (PDF, page 18) →';p.append(a);el('citation').after(p)}
  document.title=x.title+' | CTI Archives';
  for(const src of x.scans||[]){
   if(!/^assets\/archive\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|pdf)$/i.test(src)||src.includes('..'))continue;
   const a=document.createElement('a');a.href=src;a.target='_blank';a.rel='noopener noreferrer';
   if(/\.pdf$/i.test(src))a.textContent='View original document';else{
    const img=document.createElement('img');img.src=src;img.loading='lazy';img.className='archive-image';img.alt='Original archival scan: '+x.title;a.append(img);
   }el('scans').append(a);
  }
  for(const paragraph of txt.trim().split(/\n\s*\n/)){const p=document.createElement('p');p.textContent=paragraph.replace(/\n/g,' ');el('transcript').append(p)}
 }catch(e){fail(e.message)}
})();