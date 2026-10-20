/* CTI Meldados: eight date-range columns, six plaques each; only reviewed records are shown. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const months=['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Nisan','Iyar','Sivan','Tammuz','Av','Elul'];
const fmt=new Intl.DateTimeFormat('en-u-ca-hebrew',{month:'long',day:'numeric',year:'numeric'});
const normalize=m=>(m||'').replace(/^Adar(?: I| II)?$/,'Adar').replace(/Heshvan/,'Cheshvan').replace(/Tamuz/,'Tammuz');
const parts=date=>{const p=fmt.formatToParts(date);return{month:normalize(p.find(x=>x.type==='month').value),day:Number(p.find(x=>x.type==='day').value),year:p.find(x=>x.type==='year').value}};
const txt=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n};
const approved=r=>r.reviewStatus==='approved'||r.reviewStatus==='published'||r.reviewStatus==='stub';
let records=[],selected=0,active=null;
function monthRecords(){return records.filter(r=>normalize(r.hebrewMonth)===months[selected]).sort((a,b)=>a.hebrewDay-b.hebrewDay||a.englishName.localeCompare(b.englishName))}
function meldadoWeekDates(){const now=new Date();const localNoon=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);const sunday=new Date(localNoon);sunday.setDate(sunday.getDate()-sunday.getDay());const dates=new Set();for(let i=0;i<7;i++){const date=new Date(sunday);date.setDate(sunday.getDate()+i);const h=parts(date);dates.add(h.month+':'+h.day)}return dates}

function selectRecord(r){active=r.id;const area=$('memorial-detail');if(!area)return;area.hidden=false;area.replaceChildren();const heading=txt('h2','In Loving Memory');const layout=txt('div','', 'detail-layout');
const plaqueWrap=txt('div','', 'detail-tile');const brass=txt('div','', 'detail-plaque');brass.append(txt('strong',r.englishName));if(r.hebrewName)brass.append(txt('span',r.hebrewName));brass.append(txt('small',r.hebrewDay+' '+r.hebrewMonth));plaqueWrap.append(brass);
const portrait=txt('div','', 'detail-tile detail-portrait');if(r.photo){const im=document.createElement('img');im.src=r.photo;im.alt='Portrait of '+r.englishName;portrait.append(im)}else portrait.append(txt('p','Personal photograph may be added here.','muted'));
const bio=txt('div','', 'detail-biography');bio.append(txt('h3',r.biographyTitle||r.englishName));if(r.hebrewName)bio.append(txt('p',r.hebrewName));bio.append(txt('p','Hebrew memorial date: '+r.hebrewDay+' '+r.hebrewMonth));if(r.dateOfDeath)bio.append(txt('p','Date of death: '+r.dateOfDeath));if(r.rememberedBy)bio.append(txt('p','Remembered by: '+r.rememberedBy));bio.append(txt('p',r.biography||'Biography to be added after verification.'));layout.append(plaqueWrap,portrait,bio);area.append(heading,layout);area.scrollIntoView({behavior:'smooth',block:'start'})}
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
for(let col=0;col<8;col++){for(let row=0;row<6;row++){const slot=txt('div','', 'plaque-slot');slot.style.gridColumn=String(col+1);slot.style.gridRow=String(row+1);const r=columns[col][row];if(r){if(litDates.has(normalize(r.hebrewMonth)+':'+r.hebrewDay)){slot.classList.add('memorial-lit');slot.title='Memorial lights illuminated this week'}const b=document.createElement('button');b.type='button';b.append(txt('strong',r.englishName));b.title=r.englishName+' — '+r.hebrewDay+' '+m;b.onclick=()=>selectRecord(r);slot.append(b)}grid.append(slot)}}
const overflow=list.slice(48);$('list-heading').textContent='Meldados for '+m;const ul=document.createElement('ul');for(const r of list){const li=document.createElement('li');const b=document.createElement('button');b.textContent=r.hebrewDay+' '+m+' — '+r.englishName;b.onclick=()=>selectRecord(r);li.append(b);ul.append(li)}$('month-list').replaceChildren(list.length?ul:txt('p','No approved memorial records have been entered for this month.'));if(overflow.length)$('month-list').append(txt('p','The board has 48 plaques; '+overflow.length+' additional memorial(s) remain accessible in the list above.','muted'));const today=parts(new Date());$('today-note').textContent='Today’s Hebrew date (without sunset adjustment): '+today.day+' '+today.month+' '+today.year;const todayRecords=records.filter(r=>normalize(r.hebrewMonth)===today.month&&r.hebrewDay===today.day);const tu=document.createElement('ul');for(const r of todayRecords){const li=document.createElement('li');const b=document.createElement('button');b.textContent=r.englishName;b.onclick=()=>{selected=months.indexOf(today.month);render();selectRecord(r)};li.append(b);tu.append(li)}$('today-list').replaceChildren(todayRecords.length?tu:txt('p','No memorials listed for today.'));$('memorial-detail').hidden=true;active=null}
function profile(){const params=new URLSearchParams(location.search),r=records.find(x=>x.id===params.get('id')),area=$('profile-content');if(!area)return;if(!r){area.replaceChildren(txt('p','No approved memorial record found.'));return}document.title=r.englishName+' — CTI Meldados';if(params.get('month'))$('back').href='meldados.html?month='+encodeURIComponent(params.get('month'));const brass=txt('div','', 'plaque enlarged');brass.append(txt('strong',r.englishName),txt('span',r.hebrewName||''),txt('small',r.hebrewDay+' '+r.hebrewMonth));const info=txt('section','');info.append(txt('h2',r.englishName),txt('p','Hebrew memorial date: '+r.hebrewDay+' '+r.hebrewMonth),txt('p','Date of death: '+(r.dateOfDeath||'Not provided')),txt('p',r.biography||''));if(r.photo){const im=document.createElement('img');im.src=r.photo;im.className='memorial-portrait';im.alt='Portrait of '+r.englishName;info.append(im)}area.replaceChildren(brass,info)}
fetch('content/meldados.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to load memorial records');return r.json()}).then(data=>{records=(data.people||[]).filter(approved);if($('plaque-grid')){const query=new URLSearchParams(location.search).get('month');selected=Math.max(0,months.indexOf(query||parts(new Date()).month));$('previous').onclick=()=>{selected=(selected+11)%12;render()};$('next').onclick=()=>{selected=(selected+1)%12;render()};render()}else profile()}).catch(e=>{const n=$('month-list')||$('profile-content');if(n)n.textContent=e.message});
})();