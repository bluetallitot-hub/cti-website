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
  // Podcast availability comes from the RSS-derived catalog, not a hardcoded page.
  try{
   const podcastUrl=await CTIPodcast.link(item);
   const p=document.createElement('p');
   if(podcastUrl&&/^https:\/\//.test(podcastUrl)){
    const a=document.createElement('a');a.className='btn';a.href=podcastUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Listen to podcast ↗';p.append(a);
   }else{
    const b=document.createElement('button');b.type='button';b.className='btn';b.disabled=true;b.setAttribute('aria-disabled','true');b.textContent='Podcast Coming Soon';b.style.opacity='.55';b.style.cursor='not-allowed';p.append(b);
   }
   $('podcast').append(p);
  }catch(e){console.warn('Podcast lookup unavailable',e)}
  $('text').innerHTML=CTITorahMarkdown.render(md);
 }catch(e){fail(e.message)}
})();