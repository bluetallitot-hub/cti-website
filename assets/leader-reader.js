(async()=>{
 const $=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id');
 const fail=m=>{$('name').textContent='Biography unavailable';$('bio').textContent=m};
 if(!id||!/^[a-z0-9-]+$/.test(id))return fail('Select a member of the leadership team.');
 try{
  const [dir,data]=await Promise.all([
   fetch('content/biography-directory.json').then(r=>{if(!r.ok)throw Error('Directory unavailable');return r.json()}),
   fetch('content/leadership-bios.json').then(r=>{if(!r.ok)throw Error('Biographies unavailable');return r.json()})
  ]);
  const x=dir.people.find(p=>(p.id||p.url.split('/').pop().replace(/\.html$/,''))===id);
  if(!x||x.name==='Rabbi Phillip Blue')throw Error('Lay biography not found');
  const b=data.leaders.find(p=>p.name===x.name);
  if(!b)throw Error('Biography text unavailable');
  $('name').textContent=x.name;$('role').textContent=x.role||'Board Member';
  document.title=x.name+' | CTI Leadership';
  if(x.photo&&/^assets\/images\/leadership\/[^/]+$/i.test(x.photo)&&!x.photo.includes('..')){
   const img=document.createElement('img');img.src=x.photo+'?v='+encodeURIComponent(b.photoVersion||'1');img.alt=x.name;img.loading='lazy';img.style.cssText='width:100%;border-radius:12px';$('portrait').append(img)
  }
  for(const paragraph of (b.fullBio||b.bio||'').split(/\n\s*\n/)){
   const p=document.createElement('p');p.textContent=paragraph;$('bio').append(p)
  }
 }catch(e){fail(e.message)}
})();