(async()=>{
 const $=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id');
 const fail=m=>{$('name').textContent='Biography unavailable';$('bio').textContent=m};
 if(!id||!/^[a-z0-9-]+$/.test(id))return fail('Select a person from the Leadership Team pages.');
 try{
  const response=await fetch('content/leaders.json',{cache:'no-store'});
  if(!response.ok)throw Error('Leaders database unavailable');
  const data=await response.json(),person=data.leaders?.find(p=>p.id===id);
  if(!person)throw Error('This person has no database record.');
  if(person.meldathoId&&/^[a-z0-9-]+$/.test(person.meldathoId)){
   location.replace('meldado-person.html?id='+encodeURIComponent(person.meldathoId));return;
  }
  $('name').textContent=person.name;$('role').textContent=person.role||person.types?.map(t=>({'founder':'Founder','past_president':'Past President','current_leadership':'Current Leadership','historical_associate':'Historical Figure','past_rabbi':'Past Rabbi'})[t]||t).join(' · ')||'Leadership';
  document.title=person.name+' | CTI Leadership';
  if(person.introduction){const intro=document.createElement('p');intro.className='lead';intro.textContent=person.introduction;$('bio').append(intro)}
  const validPhoto=path=>typeof path==='string'&&/^assets\\/biographies\\/CTI-BIO-\\d+\\/CTI-BIO-\\d+-(?:THM|ORG-\\d+)\\.(?:png|jpe?g|webp)$/i.test(path)&&!path.includes('..');
  const originals=(person.photoOriginals||[]).filter(x=>Number.isInteger(x.number)&&validPhoto(x.path)).sort((a,b)=>a.number-b.number);
  const pictures=originals.length?originals.map(x=>x.path):validPhoto(person.photo)?[person.photo]:[];
  if(pictures.length){
   let index=0;
   const image=document.createElement('img');image.alt=person.name;image.loading='lazy';image.style.cssText='width:100%;border-radius:12px';
   if(pictures.length>1){
    const controls=document.createElement('div');controls.style.cssText='display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px';
    const previous=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
    previous.type=next.type='button';previous.textContent='←';next.textContent='→';
    previous.setAttribute('aria-label','Previous photograph');next.setAttribute('aria-label','Next photograph');
    for(const button of [previous,next])button.style.cssText='padding:6px 14px;cursor:pointer;border:1px solid #b8b8b8;border-radius:6px;background:transparent;font-size:20px';
    const show=()=>{image.src=pictures[index];count.textContent=(index+1)+' / '+pictures.length};
    previous.onclick=()=>{index=(index+pictures.length-1)%pictures.length;show()};
    next.onclick=()=>{index=(index+1)%pictures.length;show()};
    controls.append(previous,count,next);$('portrait').append(controls);show();
   }else image.src=pictures[0];
   $('portrait').append(image);
  }
  if(person.serviceYears){const p=document.createElement('p');p.textContent='Years of service: '+person.serviceYears;$('bio').append(p)}
  const biography=person.biography||(!person.introduction&&'Additional biographical information has not yet been documented.')||'';
  for(const paragraph of biography.split(/\n\s*\n/).filter(Boolean)){const p=document.createElement('p');p.textContent=paragraph;$('bio').append(p)}
  if(person.meldathoId&&/^[a-z0-9-]+$/.test(person.meldathoId)){const p=document.createElement('p'),a=document.createElement('a');a.href='meldado-person.html?id='+encodeURIComponent(person.meldathoId);a.className='textlink';a.textContent='View Meldatho →';p.append(a);$('bio').append(p)}
  const related=[...new Set(Object.values(person.links||{}).filter(url=>typeof url==='string'&&/^(historical-record|rabbi-bio)\.html(?:\?|$)/.test(url)))];
  for(const url of related){const p=document.createElement('p'),a=document.createElement('a');a.href=url;a.className='textlink';a.textContent=url.startsWith('meldado-person')?'View memorial record →':url.startsWith('rabbi-bio')?'More about Rabbi Blue →':'View historical record →';p.append(a);$('bio').append(p)}

 }catch(e){fail(e.message)}
})();
