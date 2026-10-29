(async()=>{
 const $=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id');
 const fail=m=>{$('name').textContent='Biography unavailable';$('bio').textContent=m};
 if(!id||!/^[a-z0-9-]+$/.test(id))return fail('Select a person from the Leadership Team pages.');
 try{
  const response=await fetch('content/leaders.json',{cache:'no-store'});
  if(!response.ok)throw Error('Leaders database unavailable');
  const data=await response.json(),person=data.leaders?.find(p=>p.id===id);
  if(!person)throw Error('This person has no database record.');
  $('name').textContent=person.name;$('role').textContent=person.role||person.types?.map(t=>({'founder':'Founder','past_president':'Past President','current_leadership':'Current Leadership','historical_associate':'Historical Figure'})[t]||t).join(' · ')||'Leadership';
  document.title=person.name+' | CTI Leadership';
  if(person.photo&&/^assets\/(images|archive)\/[a-zA-Z0-9_./% -]+(?:png|jpe?g|webp)(?:\?[^<>]*)?$/.test(person.photo)&&!person.photo.includes('..')){
   const img=document.createElement('img');img.src=person.photo;img.alt=person.name;img.loading='lazy';img.style.cssText='width:100%;border-radius:12px';$('portrait').append(img);
  }
  if(person.serviceYears){const p=document.createElement('p');p.textContent='Years of service: '+person.serviceYears;$('bio').append(p)}
  const biography=person.biography||person.introduction||'Additional biographical information has not yet been documented.';
  for(const paragraph of biography.split(/\n\s*\n/)){const p=document.createElement('p');p.textContent=paragraph;$('bio').append(p)}
  const related=[...new Set(Object.values(person.links||{}).filter(url=>typeof url==='string'&&/^(meldado-person|historical-record|rabbi-bio)\\.html(?:\\?|$)/.test(url)))];
  for(const url of related){const p=document.createElement('p'),a=document.createElement('a');a.href=url;a.className='textlink';a.textContent=url.startsWith('meldado-person')?'View memorial record →':url.startsWith('rabbi-bio')?'More about Rabbi Blue →':'View historical record →';p.append(a);$('bio').append(p)}

 }catch(e){fail(e.message)}
})();
