/* CTI Meldathos email reminders. Private recipients supplied only via Actions secrets. */
'use strict';
const fs=require('node:fs');
const https=require('node:https');
const path=require('node:path');
const people=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/meldados.json'),'utf8')).people;
const heb=new Intl.DateTimeFormat('en-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const eastern=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'});
const normalized=m=>String(m||'').toLowerCase().replace(/heshvan/g,'cheshvan').replace(/tamuz/g,'tammuz').replace(/adar (i|ii)$/,'adar').replace(/tishri/g,'tishrei');
const iso=d=>d.toISOString().slice(0,10);
const add=(d,n)=>new Date(d.getTime()+n*86400000);
const parts=d=>{const p=heb.formatToParts(d);return {day:Number(p.find(x=>x.type==='day').value),month:normalized(p.find(x=>x.type==='month').value)}};
const approved=p=>['approved','published'].includes(p.reviewStatus);
const fmt=d=>eastern.format(d);
const safe=s=>String(s||'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
const email=s=>typeof s==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
function secretJSON(name,fallback){try{return JSON.parse(process.env[name]||'')}catch{return fallback}}
const families=secretJSON('CTI_FAMILY_RECIPIENTS',{}); // {"memorial-id":["family@example.com"]}
const congregation=secretJSON('CTI_CONGREGATION_RECIPIENTS',[]); // ["member@example.com"]
const today=new Date();
const local=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(today);
const base=new Date(local+'T12:00:00Z');
const notices=[];
for(let i=0;i<15;i++){
 const date=add(base,i),h=parts(date);
 for(const p of people.filter(approved)){
  if(normalized(p.hebrewMonth)===h.month&&Number(p.hebrewDay)===h.day)notices.push({id:p.id,name:p.englishName,date:iso(date),days:i});
 }
}
const unique=arr=>[...new Set(arr.filter(email))];
const messages=[];
const seven=notices.filter(x=>x.days===7);
for(const n of seven){
 const to=unique(Array.isArray(families[n.id])?families[n.id]:[]);
 if(to.length)messages.push({to,subject:'CTI Meldatho reminder — '+n.name,html:'<p>This is a reminder that the Meldatho for <strong>'+safe(n.name)+'</strong> falls on '+safe(fmt(new Date(n.date+'T12:00:00Z')))+'.</p><p>The memorial candle is traditionally lit the preceding evening. Please check the <a href="https://bluetallitot-hub.github.io/cti-website/services.html">CTI service calendar</a> for the upcoming Kaddish service.</p><p>Congregation Tifereth Israel</p>'});
}
// Weekly Thursday digest of memorial anniversaries over the coming Friday–Thursday.
const weekday=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'America/New_York'}).format(today);
if(weekday==='Thursday'){
 const weekly=notices.filter(n=>n.days>=1&&n.days<=7);
 if(weekly.length&&Array.isArray(congregation)){
  const lines=weekly.map(n=>'<li>'+safe(n.name)+' — '+safe(fmt(new Date(n.date+'T12:00:00Z')))+'</li>').join('');
  // One recipient per message: no disclosure of private list addresses.
  for(const recipient of unique(congregation))messages.push({to:[recipient],subject:'CTI weekly Meldathos',html:'<p>We remember the following loved ones this coming week:</p><ul>'+lines+'</ul><p><a href="https://bluetallitot-hub.github.io/cti-website/services.html">View CTI service schedule</a></p><p>Congregation Tifereth Israel</p>'});
 }
}
const enabled=process.env.CTI_EMAIL_ENABLED==='true';
console.log(JSON.stringify({date:local,weekly:weekday==='Thursday',memorialsFound:notices.length,familyReminders:seven.length,preparedMessages:messages.length,sendingEnabled:enabled}));
if(!enabled){console.log('DRY RUN: no emails sent.');process.exit(0)}
const apiKey=process.env.RESEND_API_KEY,from='meldathos@ctipeabody.org';
if(!apiKey||!from||!email(from))throw Error('Email enabled but RESEND_API_KEY or CTI_EMAIL_FROM is missing');
function send(message){return new Promise((resolve,reject)=>{
 const body=JSON.stringify({from,to:message.to,subject:message.subject,html:message.html});
 const req=https.request('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},res=>{
 let out='';res.on('data',x=>out+=x);res.on('end',()=>res.statusCode>=200&&res.statusCode<300?resolve():reject(Error('Email provider returned '+res.statusCode+': '+out.slice(0,250))));
 });req.on('error',reject);req.end(body);
})}
(async()=>{for(const message of messages)await send(message);console.log('Emails sent:',messages.length)})().catch(e=>{console.error(e.message);process.exitCode=1});
