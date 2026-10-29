/* Unified CTI leaders database renderer; static HTML remains as a fallback. */
(async()=>{
 const grid=document.querySelector('[data-leaders-category]');if(!grid)return;
 const category=grid.dataset.leadersCategory;
 try{
  const response=await fetch('content/leaders.json',{cache:'no-store'});
  if(!response.ok)throw Error('Leaders database unavailable');
  const data=await response.json();
  if(!Array.isArray(data.leaders))throw Error('Invalid leaders database');
  const leaders=data.leaders.filter(p=>p.types?.includes(category)).sort((a,b)=>(a.order?.[category]??999)-(b.order?.[category]??999));
  if(!leaders.length)throw Error('No leaders found');
  const frag=document.createDocumentFragment();
  for(const person of leaders){
   const card=document.createElement('article');card.className='card leader-card heritage-person';
   const custom=typeof person.customPageLink==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.html(?:#[a-zA-Z0-9_-]+)?$/.test(person.customPageLink)&&!person.customPageLink.includes('..')?person.customPageLink:null;
   const profile=custom||'leader-profile.html?id='+encodeURIComponent(person.id);
   if(person.photo&&/^assets\/(images|archive)\/[a-zA-Z0-9_./% -]+(?:png|jpe?g|webp)(?:\?[^<>]*)?$/.test(person.photo)&&!person.photo.includes('..')){
    const link=document.createElement('a');link.href=profile;const img=document.createElement('img');img.className='leader-photo';img.src=person.photo;img.alt=person.name;img.loading='lazy';img.onerror=()=>{link.replaceWith(Object.assign(document.createElement('div'),{className:'leader-photo-placeholder',textContent:'Portrait unavailable'}))};link.append(img);card.append(link);
   }else{const placeholder=document.createElement('div');placeholder.className='leader-photo-placeholder';placeholder.textContent='Portrait unavailable';card.append(placeholder)}
   const copy=document.createElement('div');copy.className='heritage-person-copy';
   if(person.role&&category==='current_leadership'){const role=document.createElement('div');role.className='section-kicker';role.textContent=person.role;copy.append(role)}
   const title=document.createElement('h3');const a=document.createElement('a');a.href=profile;a.textContent=person.name;title.append(a);copy.append(title);
   if(person.serviceYears&&category==='past_president'){const p=document.createElement('p');p.textContent=person.serviceYears;copy.append(p)}
   if(person.introduction){const p=document.createElement('p');p.textContent=person.introduction;copy.append(p)}
   const more=document.createElement('a');more.className='textlink';more.href=profile;more.textContent='Biography →';copy.append(more);card.append(copy);frag.append(card);
  }
  grid.replaceChildren(frag);
 }catch(error){console.warn('Using existing leadership cards:',error)}
})();
