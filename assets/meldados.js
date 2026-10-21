/* CTI Meldados: eight date-range columns, six plaques each; only reviewed records are shown. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const months=['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Nisan','Iyar','Sivan','Tammuz','Av','Elul'];
const fmt=new Intl.DateTimeFormat('en-u-ca-hebrew',{month:'long',day:'numeric',year:'numeric'});
const normalize=m=>(m||'').replace(/^Adar(?: I| II)?$/,'Adar').replace(/Heshvan/,'Cheshvan').replace(/Tamuz/,'Tammuz').replace(/Tishri/,'Tishrei');
const parts=date=>{const p=fmt.formatToParts(date);return{month:normalize(p.find(x=>x.type==='month').value),day:Number(p.find(x=>x.type==='day').value),year:p.find(x=>x.type==='year').value}};
const txt=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n};
const approved=r=>r.reviewStatus==='approved'||r.reviewStatus==='published'||r.reviewStatus==='stub';
let records=[],selected=0,active=null,services=[];
function monthRecords(){return records.filter(r=>normalize(r.hebrewMonth)===months[selected]).sort((a,b)=>a.hebrewDay-b.hebrewDay||a.englishName.localeCompare(b.englishName))}
function meldadoWeekDates(){const now=new Date();const localNoon=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);const sunday=new Date(localNoon);sunday.setDate(sunday.getDate()-sunday.getDay());const dates=new Set();for(let i=0;i<7;i++){const date=new Date(sunday);date.setDate(sunday.getDate()+i);const h=parts(date);dates.add(h.month+':'+h.day)}return dates}

function upcomingAnniversary(r){
 const today=new Date();today.setHours(12,0,0,0);
 for(let offset=0;offset<420;offset++){
  const d=new Date(today);d.setDate(today.getDate()+offset);
  const h=parts(d);
  if(normalize(h.month)===normalize(r.hebrewMonth)&&h.day===Number(r.hebrewDay))return d;
 }
 return null;
}
const englishDate=d=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(d);
function observance(r){
 const anniversary=upcomingAnniversary(r);
 if(!anniversary)return null;
 const evening=new Date(anniversary);evening.setDate(evening.getDate()-1);
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const previous=services.filter(s=>s.date&&s.date<iso(anniversary)).sort((a,b)=>b.date.localeCompare(a.date))[0];
 return {anniversary,evening,service:previous||null};
}
function selectRecord(r){
 active=r.id;
 document.querySelectorAll('.plaque-slot button').forEach(b=>{const chosen=b.dataset.recordId===String(r.id);b.classList.toggle('is-selected',chosen);b.setAttribute('aria-pressed',String(chosen))});
 const area=$('memorial-detail');if(!area)return;area.hidden=false;area.replaceChildren();
 const heading=txt('h2','In Loving Memory'),layout=txt('div','', 'detail-layout');
 const top=txt('div','', 'detail-top-row'),brass=txt('div','', 'detail-plaque');
 brass.append(txt('strong',r.englishName));if(r.hebrewName&&r.hebrewName.trim())brass.append(txt('span',r.hebrewName,'plaque-hebrew-name'));if(r.dateOfBirth&&String(r.dateOfBirth).trim())brass.append(txt('small','Born: '+r.dateOfBirth,'plaque-birth-date'));brass.append(txt('small',r.hebrewDay+' '+r.hebrewMonth,'plaque-memorial-date'));top.append(brass);
 if(r.photo){const portrait=txt('div','', 'detail-portrait');const im=document.createElement('img');im.src=r.photo;im.alt='Portrait of '+r.englishName;portrait.append(im);top.append(portrait)}
 if(!r.photo){const portrait=txt('div','', 'detail-portrait detail-portrait-empty');portrait.append(txt('span','Photograph may be added'));top.append(portrait)}
 const bio=txt('div','', 'detail-biography');bio.append(txt('h3','Biography'));
 if(r.biographyTitle&&r.biographyTitle!==r.englishName)bio.append(txt('h4',r.biographyTitle));
 if(r.hebrewName)bio.append(txt('p',r.hebrewName));
 bio.append(txt('p','Hebrew memorial date: '+r.hebrewDay+' '+r.hebrewMonth));
 if(r.dateOfDeath)bio.append(txt('p','Date of death: '+r.dateOfDeath));
 if(r.rememberedBy)bio.append(txt('p','Remembered by: '+r.rememberedBy));
 bio.append(txt('p',r.biography||'Biography to be added after verification.'));
 const right=txt('div','', 'detail-service-box'),dates=observance(r);
 right.append(txt('h3','Upcoming Meldado'));
 if(dates){right.append(txt('p',englishDate(dates.anniversary),'observance-date'),txt('h4','Memorial Candle'),txt('p','Please light a memorial candle on the evening of '+englishDate(dates.evening)+'.'),txt('h4','Congregational Kaddish'));
 if(dates.service){const d=new Date(dates.service.date+'T12:00:00');right.append(txt('p','The congregation will remember your loved one and recite Kaddish at our scheduled service on '+englishDate(d)+'.'))}
 else right.append(txt('p','Please contact Congregation Tifereth Israel for information about the memorial Kaddish service.'))}
 else right.append(txt('p','Please contact the congregation for the upcoming memorial anniversary date.'));
 const edit=document.createElement('a');edit.href='admin/meldados-editor.html?id='+encodeURIComponent(r.id);edit.textContent='Update the Meldado';edit.className='memorial-update-button';edit.setAttribute('aria-label','Update information for '+r.englishName+' (subject to administrator approval)');right.append(edit);top.append(right);layout.append(top,bio);area.append(heading,layout);requestAnimationFrame(()=>{const goldLineTop=area.getBoundingClientRect().top+window.scrollY;window.scrollTo({top:Math.max(0,goldLineTop),behavior:'smooth'});});
}
function render(){const m=months[selected];$('month-label').textContent=m;history.replaceState(null,'','?month='+encodeURIComponent(m));const list=monthRecords();const grid=$('plaque-grid');grid.replaceChildren();const litDates=meldadoWeekDates();
const columns=Array.from({length:8},()=>[]);
// Evenly divide the sorted monthly memorials among eight columns.
// Each column has six plaques; dates shared across columns may overlap.
const visible=list.slice(0,48);
const base=Math.floor(visible.length/8),extra=visible.length%8;
let next=0;
for(let col=0;col<8;col++){
 const size=base+(col<extra?1:0);
 columns[col]=visible.slice(next,next+size);
 next+=size;
}
const labels=$('date-range-labels');
if(labels){labels.replaceChildren();for(let col=0;col<8;col++){
 const group=columns[col];
 const start=group.length?group[0].hebrewDay:null;
 const end=group.length?group[group.length-1].hebrewDay:null;
 labels.append(txt('span',start===null?'':start===end?String(start):start+'–'+end));
}}
for(let col=0;col<8;col++){for(let row=0;row<6;row++){const slot=txt('div','', 'plaque-slot');slot.style.gridColumn=String(col+1);slot.style.gridRow=String(row+1);const r=columns[col][row];if(r){if(litDates.has(normalize(r.hebrewMonth)+':'+r.hebrewDay)){slot.classList.add('memorial-lit');slot.title='Memorial lights illuminated this week'}const b=document.createElement('button');b.type='button';b.dataset.recordId=String(r.id);b.setAttribute('aria-pressed','false');b.append(txt('strong',r.englishName));b.title=r.englishName+' — '+r.hebrewDay+' '+m;b.onclick=()=>selectRecord(r);slot.append(b)}slot.append(txt('span','', 'memorial-bulb bulb-left'),txt('span','', 'memorial-bulb bulb-right'));grid.append(slot)}}
const overflow=list.slice(48);$('list-heading').textContent='Meldados for '+m;const ul=document.createElement('ul');for(const r of list){const li=document.createElement('li');const b=document.createElement('button');b.textContent=r.hebrewDay+' '+m+' — '+r.englishName;b.onclick=()=>selectRecord(r);li.append(b);ul.append(li)}$('month-list').replaceChildren(list.length?ul:txt('p','No approved memorial records have been entered for this month.'));if(overflow.length)$('month-list').append(txt('p','The board has 48 plaques; '+overflow.length+' additional memorial(s) remain accessible in the list above.','muted'));const today=parts(new Date());$('today-note').textContent='Today’s Hebrew date (without sunset adjustment): '+today.day+' '+today.month+' '+today.year;const todayRecords=records.filter(r=>normalize(r.hebrewMonth)===today.month&&r.hebrewDay===today.day);const tu=document.createElement('ul');for(const r of todayRecords){const li=document.createElement('li');const b=document.createElement('button');b.textContent=r.englishName;b.onclick=()=>{selected=months.indexOf(today.month);render();selectRecord(r)};li.append(b);tu.append(li)}$('today-list').replaceChildren(todayRecords.length?tu:txt('p','No memorials listed for today.'));$('memorial-detail').hidden=true;active=null}
function profile(){const params=new URLSearchParams(location.search),r=records.find(x=>x.id===params.get('id')),area=$('profile-content');if(!area)return;if(!r){area.replaceChildren(txt('p','No approved memorial record found.'));return}document.title=r.englishName+' — CTI Meldados';if(params.get('month'))$('back').href='meldados.html?month='+encodeURIComponent(params.get('month'));const brass=txt('div','', 'plaque enlarged');brass.append(txt('strong',r.englishName),txt('span',r.hebrewName||''),txt('small',r.hebrewDay+' '+r.hebrewMonth));const info=txt('section','');info.append(txt('h2',r.englishName),txt('p','Hebrew memorial date: '+r.hebrewDay+' '+r.hebrewMonth),txt('p','Date of death: '+(r.dateOfDeath||'Not provided')),txt('p',r.biography||''));if(r.photo){const im=document.createElement('img');im.src=r.photo;im.className='memorial-portrait';im.alt='Portrait of '+r.englishName;info.append(im)}area.replaceChildren(brass,info)}
Promise.all([fetch('content/meldados.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to load memorial records');return r.json()}),fetch('content/services.json',{cache:'no-store'}).then(r=>r.ok?r.json():{services:[]}).catch(()=>({services:[]}))]).then(([data,schedule])=>{services=CTIServiceCalendar.build(schedule,{from:(()=>{const d=new Date();d.setUTCDate(d.getUTCDate()-45);return d.toISOString().slice(0,10)})(),until:(()=>{const d=new Date();d.setUTCDate(d.getUTCDate()+430);return d.toISOString().slice(0,10)})()}).filter(s=>s.description==='Monthly Shabbat Service');records=(data.people||[]).filter(approved);if($('plaque-grid')){const query=new URLSearchParams(location.search).get('month');selected=Math.max(0,months.indexOf(query||parts(new Date()).month));$('previous').onclick=()=>{selected=(selected+11)%12;render()};$('next').onclick=()=>{selected=(selected+1)%12;render()};render()}else profile()}).catch(e=>{const n=$('month-list')||$('profile-content');if(n)n.textContent=e.message});
})();