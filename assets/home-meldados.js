(()=>{'use strict';
const alias={Tishri:'Tishrei',Heshvan:'Cheshvan',Tamuz:'Tammuz',Nissan:'Nisan'};
const normalize=s=>alias[s]||s;
const hebrew=new Intl.DateTimeFormat('en-u-ca-hebrew',{timeZone:'America/New_York',month:'long',day:'numeric',year:'numeric'});
const localParts=date=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
const radians=Math.PI/180;
function sunsetUTC(y,m,d){
 const start=Date.UTC(y,m-1,d),day=Math.floor((start-Date.UTC(y,0,1))/86400000)+1;
 const longitude=-70.928,latitude=42.527,zenith=90.833;
 const t=day+(18-longitude/15)/24,M=(.9856*t)-3.289;
 const L=((M+1.916*Math.sin(M*radians)+.020*Math.sin(2*M*radians)+282.634)%360+360)%360;
 const RA=((Math.atan(.91764*Math.tan(L*radians))/radians)%360+360)%360;
 const rightAscension=(RA+Math.floor(L/90)*90-Math.floor(RA/90)*90)/15;
 const sinDec=.39782*Math.sin(L*radians),cosDec=Math.cos(Math.asin(sinDec));
 const cosH=(Math.cos(zenith*radians)-sinDec*Math.sin(latitude*radians))/(cosDec*Math.cos(latitude*radians));
 if(cosH>1||cosH< -1)return null;
 const H=Math.acos(cosH)/radians/15;
 const T=H+rightAscension-.06571*t-6.622;
 const UT=T-longitude/15;
 return start+UT*3600000;
}
function currentMonth(){
 const now=new Date(),p=localParts(now),sunset=sunsetUTC(p.year,p.month,p.day);
 const effective=sunset!==null&&now.getTime()>=sunset?new Date(now.getTime()+86400000):now;
 return normalize(hebrew.formatToParts(effective).find(x=>x.type==='month').value);
}
const list=document.getElementById('home-memorial-list'),heading=document.getElementById('home-memorial-month');if(!list)return;
let people=[],lastMonth='';
function render(){
 const month=currentMonth();if(month===lastMonth)return;lastMonth=month;
 heading.textContent=month+' Meldados';
 const matching=people.filter(p=>normalize(p.hebrewMonth)===month&&['approved','published','stub'].includes(p.reviewStatus)&&p.approved!==false).sort((a,b)=>Number(a.hebrewDay)-Number(b.hebrewDay)||String(a.englishName).localeCompare(String(b.englishName)));
 list.replaceChildren();
 if(!matching.length){const msg=document.createElement('p');msg.className='home-memorial-message';msg.textContent='No memorials listed for this month.';list.append(msg);return}
 for(const p of matching){const plaque=document.createElement('div');plaque.className='home-memorial-plaque';const name=document.createElement('span'),date=document.createElement('small');name.textContent=p.englishName;date.textContent=p.hebrewDay+' '+month;plaque.append(name,date);list.append(plaque)}
}
fetch('content/meldados.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to load memorial records');return r.json()}).then(data=>{people=data.people||[];render();setInterval(render,60000)}).catch(()=>{list.textContent='Memorials are temporarily unavailable.'});
})();