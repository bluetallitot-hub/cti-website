// CTI administration API — Cloudflare Worker (module syntax).
// Secrets: ADMIN_PASSWORD, MELDADOS_PASSWORD, SESSION_SECRET, GITHUB_TOKEN.
// Passwords and GitHub token are NEVER exposed to the browser.
// Configure SITE_ORIGIN and GITHUB_REPOSITORY as Worker environment variables.
const enc=new TextEncoder();
const months=new Set(['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar I','Adar II','Nisan','Iyar','Sivan','Tammuz','Av','Elul']);
const communityFields=new Set(['englishName','hebrewName','dateOfBirth','dateOfDeath','hebrewDay','hebrewMonth','hebrewYearOfDeath','rememberedBy','biographyTitle','biography']);
const adminFiles=new Set(['content/services.json','content/meldados.json']);
const githubBase64=bytes=>{let binary='';const chunkSize=8192;for(let i=0;i<bytes.length;i+=chunkSize)binary+=String.fromCharCode(...bytes.subarray(i,i+chunkSize));return btoa(binary)};
const b64=bytes=>githubBase64(bytes).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
const eq=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const json=(obj,status=200,headers={})=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const hmac=async(secret,msg)=>{const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(msg)))};
async function passwordCheck(input,secret){if(!secret)return false;const digest=await hmac(secret,'CTI password check');const candidate=await hmac(input,'CTI password check');return eq(digest,candidate)}
async function issue(role,secret){const payload=b64(enc.encode(JSON.stringify({role,exp:Date.now()+8*3600e3,nonce:crypto.randomUUID()})));return payload+'.'+b64(await hmac(secret,payload))}
async function verify(req,env){const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');const [p,s]=token.split('.');if(!p||!s||!env.SESSION_SECRET)return null;try{if(!eq(un64(s),await hmac(env.SESSION_SECRET,p)))return null;const data=JSON.parse(new TextDecoder().decode(un64(p)));return data.exp>Date.now()&&['admin','meldados'].includes(data.role)?data.role:null}catch{return null}}
async function gh(env,path,method='GET',body){
const REPO=env.GITHUB_REPOSITORY;
if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(REPO||''))throw Error('GitHub repository is not configured');if(!env.GITHUB_TOKEN)throw Error('GitHub publishing credential is not configured');const res=await fetch('https://api.github.com/repos/'+REPO+'/contents/'+path,{method,headers:{authorization:'Bearer '+env.GITHUB_TOKEN,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'CTI-Admin-Worker','content-type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok){const error=new Error(res.status===409?'Content changed while editing. Reload and try again.':'GitHub error: '+(data.message||res.status));error.status=res.status;throw error}return data}
async function save(env,path,content,sha,message){return gh(env,path,'PUT',{message,content:githubBase64(enc.encode(content)),sha,branch:'main'})}
function checkChanges(changes){if(!changes||Array.isArray(changes)||typeof changes!=='object')throw Error('Invalid changes');const keys=Object.keys(changes);if(!keys.length||keys.some(k=>!communityFields.has(k)))throw Error('Unauthorized memorial field');for(const [k,v] of Object.entries(changes)){if(['hebrewDay','hebrewYearOfDeath'].includes(k)){if(v!==null&&(!Number.isInteger(v)||v<(k==='hebrewDay'?1:1)||v>(k==='hebrewDay'?30:9999)))throw Error('Invalid Hebrew date')}else if(typeof v!=='string'||v.length> (k==='biography'?12000:500))throw Error('Invalid field value');if(k==='hebrewMonth'&&!months.has(v))throw Error('Invalid Hebrew month');if(k==='englishName'&&!v.trim())throw Error('Name required');if(['dateOfBirth','dateOfDeath'].includes(k)&&v&&!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Date must be YYYY-MM-DD')}}
export default {async fetch(request,env){const ORIGIN=env.SITE_ORIGIN;if(!ORIGIN)return json({error:'Site origin is not configured'},503);const origin=request.headers.get('origin');const headers={'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Authorization, Content-Type','vary':'Origin'};if(request.method==='OPTIONS')return new Response(null,{status:204,headers});if(origin&&origin!==ORIGIN)return json({error:'Origin not allowed'},403,headers);const url=new URL(request.url);const respond=(o,s=200)=>json(o,s,headers);try{
if(url.pathname==='/health')return respond({ok:true,service:'CTI administration API'});
if(url.pathname==='/login'&&request.method==='POST'){const body=await request.json();if(typeof body.password!=='string'||body.password.length>256)return respond({error:'Invalid password'},400);let role=null;if(await passwordCheck(body.password,env.ADMIN_PASSWORD))role='admin';else if(await passwordCheck(body.password,env.MELDADOS_PASSWORD))role='meldados';if(!role)return respond({error:'Incorrect password'},401);if(!env.SESSION_SECRET)return respond({error:'Server session secret is not configured'},503);return respond({token:await issue(role,env.SESSION_SECRET),role,expiresIn:28800})}
const role=await verify(request,env);if(!role)return respond({error:'Please sign in'},401);
if(url.pathname==='/session')return respond({role});
if(url.pathname==='/file'&&request.method==='GET'){if(role!=='admin')return respond({error:'Administrator access required'},403);const path=url.searchParams.get('path');if(!adminFiles.has(path))return respond({error:'File not allowed'},400);const f=await gh(env,path);return respond({sha:f.sha,content:new TextDecoder().decode(un64(f.content.replace(/\s/g,'')))});}
if(url.pathname==='/torah/source'&&request.method==='GET'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const path=url.searchParams.get('path')||'';
  if(!/^content\/dvar-torah\/(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Holiday|Holidays|2026)\/[A-Za-z0-9 ()'._-]+\.md$/.test(path))return respond({error:'Invalid Torah Markdown path'},400);
 const file=await gh(env,path);
 return respond({path,sha:file.sha,content:new TextDecoder().decode(un64(file.content.replace(/\s/g,'')))});
}
if(url.pathname==='/torah/catalog'&&request.method==='GET'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const file=await gh(env,'content/dvar-torah/index.json');
 const data=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));
 return respond({sha:file.sha,items:data.items||[]});
}
if(url.pathname==='/torah/publication'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.recordId!=='string'||!/^[-a-z0-9]{3,100}$/.test(b.recordId)||typeof b.published!=='boolean'||typeof b.expectedSha!=='string'||! /^[a-f0-9]{40}$/.test(b.expectedSha))return respond({error:'Invalid publication request'},400);
 const file=await gh(env,'content/dvar-torah/index.json');
 if(file.sha!==b.expectedSha)return respond({error:'The Dvar Torah catalog changed. Reload before changing publication status.'},409);
 const catalog=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));
 const key=r=>r.holidayCode?'holiday-'+String(r.holidayCode).toLowerCase()+'-'+r.year+'-'+String(r.name).toLowerCase().replace(/[^a-z0-9]+/g,'-'):'torah-'+r.book+'-'+String(r.portion).padStart(2,'0')+'-'+r.year;
 const item=catalog.items.find(r=>key(r)===b.recordId);
 if(!item)return respond({error:'Dvar Torah not found'},404);
 if((item.status!=='unpublished'&&item.published!==false)===b.published)return respond({ok:true,sha:file.sha,unchanged:true,published:b.published});
 item.status=b.published?'published':'unpublished';delete item.published;
 const saved=await save(env,'content/dvar-torah/index.json',JSON.stringify(catalog,null,2)+'\\n',file.sha,(b.published?'Publish':'Unpublish')+' CTI Dvar Torah: '+b.recordId);
 return respond({ok:true,sha:saved.content.sha,commit:saved.commit.sha,published:b.published});
}
if(url.pathname==='/torah/commit'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.path!=='string'||!/^content\/dvar-torah\/(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Holiday|Holidays|2026)\/[A-Za-z0-9 ()'._-]+\.md$/.test(b.path)||typeof b.expectedSha!=='string'||! /^[a-f0-9]{40}$/.test(b.expectedSha)||typeof b.content!=='string'||!b.content.trim()||b.content.length>200000)return respond({error:'Invalid Markdown commit'},400);
 const file=await gh(env,b.path);
 if(file.sha!==b.expectedSha)return respond({error:'This Markdown file changed on GitHub after you loaded it. Reload before committing.'},409);
 const saved=await save(env,b.path,b.content,file.sha,'Update CTI Dvar Torah: '+b.path.split('/').pop());
 return respond({ok:true,sha:saved.content.sha,commit:saved.commit.sha,path:b.path});
}
if(url.pathname==='/github-check'&&request.method==='GET'){if(role!=='admin')return respond({error:'Administrator access required'},403);const f=await gh(env,'content/meldados.json');return respond({ok:true,repository:env.GITHUB_REPOSITORY,sha:f.sha,access:'read'});}
if(url.pathname==='/meldados/state'&&request.method==='GET'){const f=await gh(env,'content/meldados.json');return respond({sha:f.sha,people:JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,'')))).people})}

if(url.pathname==='/meldados/create'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 try{
 const b=await request.json(),name=String(b.englishName||'').trim().replace(/\\s+/g,' ');
 if(!name||name.length>200)return respond({error:'Enter a valid name'},400);
 let month=String(b.hebrewMonth||''),day=Number(b.hebrewDay),dateOfDeath='';
 if(b.mode==='english'){
   if(typeof b.dateOfDeath!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(b.dateOfDeath)||!['before','after'].includes(b.sunset))return respond({error:'Enter a valid English date and sunset selection'},400);
   const d=new Date(b.dateOfDeath+'T12:00:00Z');
   if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==b.dateOfDeath)return respond({error:'Invalid date'},400);
   dateOfDeath=b.dateOfDeath;
   if(b.sunset==='after')d.setUTCDate(d.getUTCDate()+1);
   const parts=new Intl.DateTimeFormat('en-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).formatToParts(d);
   const rawMonth=parts.find(x=>x.type==='month')?.value||'';
   const mapping={'Tishri':'Tishrei','Heshvan':'Cheshvan','Cheshvan':'Cheshvan','Tevet':'Tevet','Shvat':'Shevat','Shevat':'Shevat','Adar I':'Adar I','Adar II':'Adar II','Adar':'Adar','Nisan':'Nisan','Iyar':'Iyar','Sivan':'Sivan','Tamuz':'Tammuz','Tammuz':'Tammuz','Av':'Av','Elul':'Elul','Kislev':'Kislev'};
   month=mapping[rawMonth]||rawMonth;day=Number(parts.find(x=>x.type==='day')?.value);
 }else if(b.mode!=='hebrew')return respond({error:'Choose a date entry method'},400);
 if(!months.has(month)||!Number.isInteger(day)||day<1||day>30)return respond({error:'Invalid Hebrew memorial date'},400);
 const file=await gh(env,'content/meldados.json');
 if(file.truncated)return respond({error:'Memorial database too large to update safely'},500);
 const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\\s/g,''))));
 const normalized=x=>String(x||'').toLocaleLowerCase('en').replace(/[^a-z0-9]/g,'');
 const matches=doc.people.filter(p=>normalized(p.englishName)===normalized(name));
 if(matches.length)return respond({error:'A memorial with this name already exists. Review the existing record before creating another: '+matches.map(p=>p.englishName+' ('+p.id+')').join(', ')},409);
 const base=name.normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
 if(!base)return respond({error:'Name cannot be converted into a memorial ID'},400);
 const taken=new Set(doc.people.map(p=>p.id));
 let id=base,n=2;while(taken.has(id)){id=base+'-'+n++;if(n>9999)return respond({error:'Cannot assign a unique memorial ID'},409)}
 const person={id,englishName:name,hebrewName:'',hebrewDay:day,hebrewMonth:month,hebrewYearOfDeath:null,dateOfDeath,rememberedBy:'',biography:'',photo:'',source:'CTI administrator entry',reviewStatus:'approved',approved:true,notes:dateOfDeath?'Entered using English date of death ('+b.sunset+' sunset).':''};
 doc.people.push(person);
 await save(env,'content/meldados.json',JSON.stringify(doc,null,2)+'\\n',file.sha,'Add Meldatho: '+id);
 return respond({ok:true,id,englishName:name,hebrewDay:day,hebrewMonth:month});
 }catch(e){return respond({error:'Could not add Meldatho: '+(e?.message||'Unknown error')},500)}
}
if(url.pathname==='/meldados/update'&&request.method==='POST'){
let stage='parse request';
try{
const b=await request.json();
stage='validate changes';
if(typeof b.recordId!=='string'||b.recordId.length>150||typeof b.expectedSha!=='string')return respond({error:'Invalid record'},400);
checkChanges(b.changes);
stage='fetch memorial database';
const file=await gh(env,'content/meldados.json');
if(file.sha!==b.expectedSha)return respond({error:'Memorials changed since you loaded this page. Reload before saving.'},409);
stage='decode memorial database';
const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));
stage='apply memorial changes';
const person=doc.people.find(p=>p.id===b.recordId);
if(!person)return respond({error:'Memorial not found'},404);
if(role==='meldados'&&!['approved','published','stub'].includes(person.reviewStatus))return respond({error:'Record is not editable'},403);
Object.assign(person,b.changes);
stage='encode and publish memorial database';
await save(env,'content/meldados.json',JSON.stringify(doc,null,2)+'\n',file.sha,'Update memorial information: '+person.id);
return respond({ok:true,message:'Memorial changes published to GitHub'});
}catch(e){return respond({error:'Memorial update failed at '+stage+': '+(e?.message||'Unknown error')},500)}
}
if(url.pathname==='/meldados/portrait'&&request.method==='POST'){const b=await request.json();if(typeof b.recordId!=='string'||!b.recordId.match(/^[a-zA-Z0-9_-]{1,150}$/)||typeof b.image!=='string'||b.image.length>1400000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.image))return respond({error:'Invalid portrait'},400);const file=await gh(env,'content/meldados.json');const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));const person=doc.people.find(p=>p.id===b.recordId);if(!person||role==='meldados'&&!['approved','published','stub'].includes(person.reviewStatus))return respond({error:'Memorial not editable'},403);const path='assets/images/meldados/portraits/'+b.recordId+'.jpg';let sha;try{sha=(await gh(env,path)).sha}catch(e){if(e.status!==404)throw e}await gh(env,path,'PUT',{message:'Update memorial portrait: '+b.recordId,content:b.image.split(',')[1],sha,branch:'main'});const fresh=await gh(env,'content/meldados.json');const current=JSON.parse(new TextDecoder().decode(un64(fresh.content.replace(/\s/g,''))));const p=current.people.find(x=>x.id===b.recordId);p.photo=path;await save(env,'content/meldados.json',JSON.stringify(current,null,2)+'\n',fresh.sha,'Publish memorial portrait: '+b.recordId);return respond({ok:true})}
if(url.pathname==='/announcements/email'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const body=await request.json();
 if(typeof body.announcement!=='string'||!body.announcement.trim()||body.announcement.length>1000)return respond({error:'Enter an announcement before sending email'},400);
 if(!env.RESEND_API_KEY)return respond({error:'Email is not configured yet. The website announcement can still be published.'},503);
 if(!env.CTI_MAILING_LISTS)return respond({error:'Private mailing-list storage is not configured'},503);
 const recipients=JSON.parse(await env.CTI_MAILING_LISTS.get('congregation')||'[]').filter(s=>typeof s==='string').map(s=>s.trim()).filter(Boolean);
 if(!recipients.length)return respond({error:'Test recipient list is not configured'},503);
 if(recipients.some(s=>!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))))return respond({error:'Invalid recipient email configuration'},503);
 const sender=env.CTI_ANNOUNCE_EMAIL_FROM;
 if(!sender||!/^([^<>]*<)?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/.test(sender))return respond({error:'Sender address is not configured'},503);
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},body:JSON.stringify({from:sender,to:recipients,subject:'CTI Service Announcement',text:body.announcement.trim()+'\\n\\nCongregation Tifereth Israel\\nhttps://bluetallitot-hub.github.io/cti-website/services.html'})});
 const result=await response.json();
 if(!response.ok)return respond({error:'Email was not sent: '+(result.message||response.status)},502);
 return respond({ok:true,recipientCount:recipients.length});
}
if(url.pathname==='/newsletter/import-events'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();if(!Array.isArray(b.events)||b.events.length>100) return respond({error:'Invalid events'},400);
 const file=await gh(env,'content/events.json');const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));let added=0;
 for(const e of b.events){if(typeof e.title!=='string'||e.title.length>160||!/^\\d{4}-\\d{2}-\\d{2}$/.test(e.date)||typeof e.source!=='string')continue;if(doc.events.some(x=>x.date===e.date&&x.title===e.title))continue;doc.events.push({date:e.date,title:e.title,time:'',location:'',description:'',source:e.source});added++}
 if(added)await save(env,'content/events.json',JSON.stringify(doc,null,2)+'\\n',file.sha,'Import newsletter events');return respond({ok:true,added});
}
if(url.pathname==='/newsletter/import-meldados'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();if(!Array.isArray(b.people)||b.people.length>150)return respond({error:'Invalid memorial entries'},400);
 const file=await gh(env,'content/meldados.json'),doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));let added=0,updated=0,exceptions=[];
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
 for(const p of b.people){if(typeof p.name!=='string'||p.name.length>120||!Number.isInteger(p.day)||p.day<1||p.day>30||!months.has(p.month)||typeof p.source!=='string'||p.source.length>150)continue;
 const sameName=doc.people.find(x=>norm(x.englishName)===norm(p.name));if(sameName){if(sameName.hebrewDay!==p.day||sameName.hebrewMonth!==p.month){exceptions.push(p.name+': memorial date differs');continue}if(p.rememberedBy&&typeof p.rememberedBy==='string'&&p.rememberedBy.length<=500){if(!sameName.rememberedBy){sameName.rememberedBy=p.rememberedBy;updated++}else if(sameName.rememberedBy.trim()!==p.rememberedBy.trim())exceptions.push(p.name+': Remembered By differs')}continue}
 const match=doc.people.some(x=>x.hebrewDay===p.day&&x.hebrewMonth===p.month&&(norm(x.englishName)===norm(p.name)));if(match)continue;
 doc.people.push({id:'newsletter-'+crypto.randomUUID(),englishName:p.name,hebrewName:'',hebrewDay:p.day,hebrewMonth:p.month,hebrewYearOfDeath:null,dateOfDeath:'',rememberedBy:typeof p.rememberedBy==='string'?p.rememberedBy.slice(0,500):'',biography:'',photo:'',source:p.source,reviewStatus:'approved',approved:true,notes:'Imported from newsletter; death year not supplied.'});added++}
 if(Array.isArray(b.rememberedByUpdates)&&b.rememberedByUpdates.length<=150)for(const proposal of b.rememberedByUpdates){if(typeof proposal.recordId!=='string'||typeof proposal.name!=='string'||typeof proposal.rememberedBy!=='string'||!proposal.rememberedBy.trim()||proposal.rememberedBy.length>500)continue;const record=doc.people.find(x=>x.id===proposal.recordId&&norm(x.englishName)===norm(proposal.name));if(!record){exceptions.push(proposal.name+': memorial identity not confirmed');continue}if(record.rememberedBy){if(record.rememberedBy.trim()!==proposal.rememberedBy.trim())exceptions.push(proposal.name+': Remembered By differs');continue}record.rememberedBy=proposal.rememberedBy.trim();updated++}
 if(added||updated)await save(env,'content/meldados.json',JSON.stringify(doc,null,2)+'\\n',file.sha,'Import newsletter memorial records');return respond({ok:true,added,updated,exceptions});
}
const validEventDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number(d.slice(0,4))>=2000&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const validEventTime=t=>!t||/^(?:0?[1-9]|1[0-2])(?::[0-5]\d)?\s*(?:AM|PM)$/i.test(t);
if(url.pathname==='/leadership/list'&&request.method==='GET'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const [bios,directory]=await Promise.all([gh(env,'content/leadership-bios.json'),gh(env,'content/biography-directory.json')]);
 const data=JSON.parse(new TextDecoder().decode(un64(bios.content.replace(/\s/g,''))));
 const people=JSON.parse(new TextDecoder().decode(un64(directory.content.replace(/\s/g,'')))).people;
 return respond({leaders:data.leaders.map(x=>({...x,role:people.find(p=>p.name===x.name)?.role||'',photo:people.find(p=>p.name===x.name)?.photo||null}))});
}
if(url.pathname==='/leadership/update'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.name!=='string'||typeof b.bio!=='string'||typeof b.fullBio!=='string'||b.bio.length>180||b.fullBio.length>12000||!b.bio.trim()||!b.fullBio.trim())return respond({error:'Check biography text and length'},400);
 const file=await gh(env,'content/leadership-bios.json');
 const data=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));
 const leader=data.leaders.find(x=>x.name===b.name);
 if(!leader)return respond({error:'Leader not found'},404);
 leader.bio=b.bio.trim();leader.fullBio=b.fullBio.trim();
 await save(env,'content/leadership-bios.json',JSON.stringify(data,null,2)+'\n',file.sha,'Update leadership biography: '+b.name);
 return respond({ok:true});
}
if(url.pathname==='/leadership/photo'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.name!=='string'||typeof b.image!=='string'||b.image.length>5000000||!/^iVBORw0KGgo[A-Za-z0-9+/=]*$/.test(b.image))return respond({error:'Select a PNG photograph smaller than 3.5 MB'},400);
 const directoryFile=await gh(env,'content/biography-directory.json');
 const directory=JSON.parse(new TextDecoder().decode(un64(directoryFile.content.replace(/\s/g,''))));
 const person=directory.people.find(x=>x.name===b.name);
 if(!person||!/^[-a-z0-9]+$/.test(person.id))return respond({error:'Leader not found'},404);
 const path='assets/images/leadership/'+person.id+'-profile.png';
 let sha;
 try{sha=(await gh(env,path)).sha}catch(e){if(e.status!==404)throw e}
 await gh(env,path,'PUT',{message:'Update leadership photograph: '+b.name,content:b.image,...(sha?{sha}:{}),branch:'main'});
 const fresh=await gh(env,'content/biography-directory.json');
 const current=JSON.parse(new TextDecoder().decode(un64(fresh.content.replace(/\s/g,''))));
 const target=current.people.find(x=>x.name===b.name);
 if(!target)return respond({error:'Photograph saved, but profile refresh needs attention'},409);
 target.photo=path;
 await save(env,'content/biography-directory.json',JSON.stringify(current,null,2)+'\n',fresh.sha,'Refresh leadership photograph: '+b.name);
 return respond({ok:true});
}
if(url.pathname==='/events/list'&&request.method==='GET'){if(role!=='admin')return respond({error:'Administrator access required'},403);const f=await gh(env,'content/events.json');const d=JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,''))));return respond({events:d.events||[]})}
if(url.pathname==='/events/add'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>140||typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number(b.date.slice(0,4))<2000||Number.isNaN(Date.parse(b.date+'T12:00:00Z'))||new Date(b.date+'T12:00:00Z').toISOString().slice(0,10)!==b.date)return respond({error:'A valid event name and date are required'},400);
 for(const [k,max] of [['time',80],['endTime',80],['location',160],['description',1500]])if(typeof b[k]!=='string'||b[k].length>max)return respond({error:'Invalid '+k},400);
 if(!validEventDate(b.date)||!validEventDate(b.endDate||b.date)||(b.endDate&&b.endDate<b.date)||!validEventTime(b.time)||!validEventTime(b.endTime))return respond({error:'Check event dates and times'},400);const f=await gh(env,'content/events.json'),d=JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,''))));if(!Array.isArray(d.events))d.events=[];
 if(d.events.some(e=>e.date===b.date&&e.title.toLowerCase().trim()===b.title.toLowerCase().trim()))return respond({error:'An event with that title and date already exists'},409);
 d.events.push({id:'event-'+crypto.randomUUID(),title:b.title.trim(),date:b.date,time:b.time.trim(),endDate:b.endDate||'',endTime:b.endTime.trim(),location:b.location.trim(),description:b.description.trim()});
 await save(env,'content/events.json',JSON.stringify(d,null,2)+'\n',f.sha,'Add upcoming CTI event: '+b.title.trim());return respond({ok:true});
}
if(url.pathname==='/events/edit'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.id!=='string'||typeof b.originalDate!=='string'||typeof b.originalTitle!=='string'||typeof b.title!=='string'||!b.title.trim()||b.title.length>140||typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number(b.date.slice(0,4))<2000||!Number.isFinite(Date.parse(b.date+'T12:00:00Z'))||new Date(b.date+'T12:00:00Z').toISOString().slice(0,10)!==b.date)return respond({error:'Enter a valid event name and date'},400);
 for(const [k,max] of [['time',80],['endTime',80],['location',160],['description',1500]])if(typeof b[k]!=='string'||b[k].length>max)return respond({error:'Invalid '+k},400);
 if(!validEventDate(b.date)||!validEventDate(b.endDate||b.date)||(b.endDate&&b.endDate<b.date)||!validEventTime(b.time)||!validEventTime(b.endTime))return respond({error:'Check event dates and times'},400);const f=await gh(env,'content/events.json'),d=JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,''))));
 const e=d.events.find(x=>x.id===b.id&&x.date===b.originalDate&&x.title===b.originalTitle);
 if(!e)return respond({error:'Event changed since you opened it. Reload and try again.'},409);
 if(d.events.some(x=>x.id!==b.id&&x.date===b.date&&x.title.toLowerCase().trim()===b.title.toLowerCase().trim()))return respond({error:'An event with that name and date already exists'},409);
 Object.assign(e,{title:b.title.trim(),date:b.date,time:b.time.trim(),endDate:b.endDate||'',endTime:b.endTime.trim(),location:b.location.trim(),description:b.description.trim()});
 await save(env,'content/events.json',JSON.stringify(d,null,2)+'\n',f.sha,'Edit CTI event: '+e.title);
 return respond({ok:true});
}
if(url.pathname==='/events/delete'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);const b=await request.json();
 if(typeof b.id!=='string'||typeof b.date!=='string'||typeof b.title!=='string')return respond({error:'Invalid event'},400);
 if(!validEventDate(b.date)||!validEventDate(b.endDate||b.date)||(b.endDate&&b.endDate<b.date)||!validEventTime(b.time)||!validEventTime(b.endTime))return respond({error:'Check event dates and times'},400);const f=await gh(env,'content/events.json'),d=JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,''))));const i=d.events.findIndex(e=>e.id===b.id&&e.date===b.date&&e.title===b.title);
 if(i<0)return respond({error:'Event no longer exists. Reload the list.'},409);d.events.splice(i,1);
 await save(env,'content/events.json',JSON.stringify(d,null,2)+'\n',f.sha,'Remove CTI event: '+b.title);return respond({ok:true});
}
if(url.pathname==='/newsletter/upload'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.pdf!=='string'||b.pdf.length>10500000||!b.pdf.startsWith('JVBERi0'))return respond({error:'Select a PDF smaller than 7 MB'},400);
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month||''))return respond({error:'Newsletter month not identified'},400);
 const date=b.month+'-01',title=new Date(date+'T12:00:00Z').toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})+' Newsletter';
 const path='assets/resources/newsletters/'+b.month.slice(0,4)+'/cti-newsletter-'+b.month+'.pdf';
 const index=await gh(env,'content/newsletters.json');
 const data=JSON.parse(new TextDecoder().decode(un64(index.content.replace(/\s/g,''))));
 if(data.issues.some(x=>x.date===date))return respond({error:'This month already has a newsletter'},409);
 // An archived PDF may exist even when its index entry was removed.
 // Reuse only if the uploaded bytes match the existing Git blob exactly.
 let existing=null;
 try{existing=await gh(env,path)}catch(e){if(e.status!==404)throw e}
 let reusedExistingPdf=false;
 if(existing){
   const bytes=un64(b.pdf),prefix=enc.encode('blob '+bytes.length+'\0');
   const blob=new Uint8Array(prefix.length+bytes.length);
   blob.set(prefix);blob.set(bytes,prefix.length);
   const hash=new Uint8Array(await crypto.subtle.digest('SHA-1',blob));
   const sha=Array.from(hash,x=>x.toString(16).padStart(2,'0')).join('');
   if(sha!==existing.sha)return respond({error:'A different PDF is already stored for this issue month. The original was preserved. Contact the administrator to review the conflict.'},409);
   reusedExistingPdf=true;
 }else{
   await gh(env,path,'PUT',{message:'Upload '+title,content:b.pdf,branch:'main'});
 }
 data.issues.unshift({title,date,volume:String(b.volume||'').slice(0,80),description:'CTI congregational newsletter.',url:path});
 await save(env,'content/newsletters.json',JSON.stringify(data,null,2)+'\n',index.sha,'Publish '+title);
 return respond({ok:true,title,reusedExistingPdf});
}

const decodeCollection=f=>JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,''))));
const masterPath='content/collection-records.json';
const masterFields={collection:12,status:20,title:180,date:100,caption:1500,description:10000,source:500,citation:3000,attribution:500,transcript:150000,indexImage:500,archiveImage:500,restoredImage:500,thumbnailImage:500,pdf:500};
if(url.pathname==='/master/list'&&request.method==='GET'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const f=await gh(env,masterPath);return respond(decodeCollection(f));
}
if(url.pathname==='/master/save'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json(),f=await gh(env,masterPath),d=decodeCollection(f);
 const record=(d.items||[]).find(x=>x.id===b.id);
 if(!record)return respond({error:'Unknown record number'},404);
 if(typeof b.changes!=='object'||!b.changes)return respond({error:'Missing changes'},400);
 for(const [key,value] of Object.entries(b.changes)){
  if(!(key in masterFields)||typeof value!=='string'||value.length>masterFields[key])return respond({error:'Invalid '+key},400);
  if(key==='collection'&&!['gallery','archive'].includes(value))return respond({error:'Invalid collection'},400);
  if(key==='status'&&!['active','inactive','unapproved'].includes(value))return respond({error:'Invalid status'},400);
  if(['indexImage','archiveImage','restoredImage','thumbnailImage','pdf'].includes(key)&&value&&(!/^(assets\/|https:\/\/)/.test(value)||value.includes('..')))return respond({error:'Invalid file reference'},400);
  record[key]=value;
 }
 await save(env,masterPath,JSON.stringify(d,null,2)+'\n',f.sha,'Update CTI master record '+b.id);
 return respond({ok:true,id:b.id});
}
if(url.pathname==='/master/upload'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json(),f=await gh(env,masterPath),d=decodeCollection(f),record=(d.items||[]).find(x=>x.id===b.id);
 if(!record||!['originalImage','restoredImage','thumbnailImage','indexImage','archiveImage','pdf'].includes(b.slot))return respond({error:'Invalid record or file slot'},400);
 if(typeof b.name!=='string'||typeof b.data!=='string'||b.data.length>10000000)return respond({error:'File too large or invalid'},400);
 const ext=b.name.split('.').pop().toLowerCase();
 if(!['jpg','jpeg','png','webp','pdf'].includes(ext)||(b.slot==='pdf'&&ext!=='pdf')||(b.slot!=='pdf'&&ext==='pdf')||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.data))return respond({error:'Invalid file type'},400);
 const type=b.slot==='pdf'?'PDF':b.slot==='originalImage'?'ORG':b.slot==='thumbnailImage'||b.slot==='indexImage'?'THM':'IMG';
 record.files=record.files||[];
 const slotFiles=record.files.filter(x=>x.slot===b.slot);
 const next=slotFiles.length+1;
 if(b.slot==='originalImage'&&slotFiles.length)return respond({error:'Archival original is immutable; additional originals require a separate source accession'},409);
 if(b.slot==='originalImage'&&typeof b.originalCaption!=='string')return respond({error:'Original caption transcription required; use an empty string if none'},400);
 if(b.slot==='originalImage'&&b.originalCaption.length>5000)return respond({error:'Original caption too long'},400);
 const path='assets/collections/'+record.id+'-'+type+'-'+'1'+(next>1?'-v'+next:'')+'.'+ext;
 await gh(env,path,'PUT',{message:'Preserve CTI original '+record.id,content:b.data,branch:'main'});
 const previous=record.files.findLast(x=>x.slot===b.slot&&x.active);
 if(previous){previous.active=false;previous.superseded=true;}
 record.files.push({slot:b.slot,path,originalName:b.name,active:true,version:next});
 record[b.slot]=path;
 if(b.slot==='originalImage'){record.originalImageCaption=b.originalCaption;record.preservationStatus='original-preserved';}
 if(b.slot==='thumbnailImage')record.indexImage=path;
 if(b.slot==='restoredImage')record.archiveImage=path;
 await save(env,masterPath,JSON.stringify(d,null,2)+'\n',f.sha,'Attach CTI numbered asset '+record.id);
 return respond({ok:true,path,id:record.id});
}
if(url.pathname==='/master/create'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(!['gallery','archive'].includes(b.collection))return respond({error:'Invalid collection'},400);
 const f=await gh(env,masterPath),d=decodeCollection(f),number=d.nextRecordNumber||1;
 const id='CTI-'+String(number).padStart(3,'0');
 d.nextRecordNumber=number+1;d.items=d.items||[];
 d.items.push({id,collection:b.collection,status:'active',title:'New record',date:'',caption:'',description:'',source:'',citation:'',attribution:'',transcript:'',indexImage:'',archiveImage:'',originalImage:null,originalImageCaption:null,originalCaptionCorrections:[],restoredImage:null,thumbnailImage:null,preservationStatus:'awaiting-original-verification',imageVersions:[],thumbnailSpecification:{width:800,height:600,aspectRatio:'4:3',noAddedText:true,background:'appropriate neutral or complementary',retouched:true},pdf:null,sourcePage:null,originalFilenames:[],files:[]});
 await save(env,masterPath,JSON.stringify(d,null,2)+'\n',f.sha,'Create CTI master record '+id);
 return respond({ok:true,id});
}
const collectionPath='content/collection-submissions.json';

if(url.pathname==='/collections/list'&&request.method==='GET'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const [index,gallery,archives]=await Promise.all([gh(env,collectionPath),gh(env,'content/gallery.json'),gh(env,'content/archive-additions.json')]);
 const state=decodeCollection(index),g=decodeCollection(gallery),a=decodeCollection(archives);
 return respond({items:state.items||[],visibility:state.visibility||{},gallery:g.items||[],archives:a.items||[]});
}
if(url.pathname==='/collections/edit'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(!['gallery','archive'].includes(b.collection)||typeof b.id!=='string'||b.id.length>500)return respond({error:'Invalid record'},400);
 const fields={title:180,date:60,description:3000,caption:1500,attribution:500,source:400,citation:2000,transcript:100000};
 const updates={};
 for(const [key,value] of Object.entries(b.changes||{})){
  if(!(key in fields)||typeof value!=='string'||value.length>fields[key])return respond({error:'Invalid field: '+key},400);
  updates[key]=value;
 }
 if(!Object.keys(updates).length)return respond({error:'No changes'},400);
 const f=await gh(env,collectionPath),d=decodeCollection(f);
 const record=(d.items||[]).find(x=>x.id===b.id&&x.collection===b.collection);
 if(record)Object.assign(record,updates);
 else {
  const path=b.collection==='gallery'?'content/gallery.json':'content/archive-additions.json';
  const legacy=await gh(env,path),entries=decodeCollection(legacy);
  const item=(entries.items||[]).find(x=>(b.collection==='gallery'?x.image:x.id)===b.id);
  if(!item)return respond({error:'This special or static archive page cannot be edited here'},404);
  Object.assign(item,updates);
  await save(env,path,JSON.stringify(entries,null,2)+'\n',legacy.sha,'Update CTI collection record metadata');
  return respond({ok:true});
 }
 await save(env,collectionPath,JSON.stringify(d,null,2)+'\n',f.sha,'Update CTI collection record metadata');
 return respond({ok:true});
}
if(url.pathname==='/collections/status'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(!['gallery','archive'].includes(b.collection)||typeof b.id!=='string'||!['active','inactive'].includes(b.status))return respond({error:'Invalid status request'},400);
 const f=await gh(env,collectionPath),d=decodeCollection(f);d.visibility=d.visibility||{gallery:{},archive:{}};d.visibility.gallery=d.visibility.gallery||{};d.visibility.archive=d.visibility.archive||{};
 const record=(d.items||[]).find(x=>x.id===b.id&&x.collection===b.collection);
 let previous;
 if(record){previous=record.status||'unapproved';}
 else{
  const path=b.collection==='gallery'?'content/gallery.json':'content/archive-additions.json';
  const existing=decodeCollection(await gh(env,path));
  const legacyArchive=new Set(['press-1972-golden-anniversary.html','archives/archive-1976-sephardic-jews.html','archives/archive-1979-joseph-gibely-address.html','press-1981-still-growing.html','press-1992-origins.html','archives/archive-1995-ashkenazi-sephardic-traditions.html','archives/archive-1997-75th-anniversary.html','archives/archive-2001-constantinople-to-peabody.html','press-2012-milestones.html','archives/archive-2018-hershoff-letter.html','archives/archive-2019-sephardic-traditions.html','press/press-2022-centennial.html']);
  const found=(existing.items||[]).some(x=>(b.collection==='gallery'?x.image:x.id)===b.id)||(b.collection==='archive'&&legacyArchive.has(b.id));
  if(!found)return respond({error:'Item not found'},404);
  previous=d.visibility[b.collection][b.id]||'active';
 }
 if(!((previous==='unapproved'||previous==='inactive')&&b.status==='active'||previous==='active'&&b.status==='inactive'))return respond({error:'This status change is not allowed'},409);
 if(record)record.status=b.status;else d.visibility[b.collection][b.id]=b.status;
 await save(env,collectionPath,JSON.stringify(d,null,2)+'\n',f.sha,'Update CTI collection visibility');
 return respond({ok:true});
}
if(url.pathname==='/collections/submit'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(!['gallery','archive'].includes(b.collection))return respond({error:'Select Gallery or Archive'},400);
 for(const [key,max] of Object.entries({title:180,date:60,description:3000,source:400,citation:2000,attribution:500,caption:1500,transcript:100000}))
  if(typeof b[key]!=='string'||b[key].length>max)return respond({error:'Invalid '+key},400);
 if(!b.title.trim()||!b.caption.trim())return respond({error:'Title and caption are required'},400);
 if(!Array.isArray(b.files)||b.files.length<1||b.files.length>6)return respond({error:'Select one to six files'},400);
 if(b.collection==='archive'){
  if(!b.fileRoles||b.fileRoles.index!==0||b.fileRoles.original!==1||!Number.isInteger(b.fileRoles.index)||!Number.isInteger(b.fileRoles.original)||b.files.length<2||b.files.length>3||!(b.fileRoles.pdf===null||(b.fileRoles.pdf===2&&b.files.length===3)))return respond({error:'Archive requires index and original pictures, with optional PDF'},400);
  const image=/\\.(jpg|jpeg|png|webp)$/i;
  if(!image.test(b.files[0].name)||!image.test(b.files[1].name)||(b.files.length===3&&!/\\.pdf$/i.test(b.files[2].name)))return respond({error:'Choose two images and an optional PDF'},400);
 }

 let total=0;
 for(const file of b.files){
  if(typeof file.name!=='string'||typeof file.data!=='string'||!/^[-a-zA-Z0-9_. ]{1,120}\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name)||!(/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)))return respond({error:'Invalid file'},400);
  if(b.collection==='gallery'&&/\.pdf$/i.test(file.name))return respond({error:'Gallery accepts photographs only'},400);
  total+=file.data.length;
 }
 if(total>10000000)return respond({error:'Total file size exceeds approximately 7 MB'},400);
 const f=await gh(env,collectionPath),d=decodeCollection(f),id='cti-'+crypto.randomUUID(),paths=[];
 for(let i=0;i<b.files.length;i++){
  const ext=b.files[i].name.split('.').pop().toLowerCase(),path='assets/collections/'+id+'-'+(i+1)+'.'+ext;
  await gh(env,path,'PUT',{message:'Preserve CTI collection original '+id,content:b.files[i].data,branch:'main'});
  paths.push(path);
 }
 d.items=d.items||[];
 d.items.push({id,collection:b.collection,status:'active',title:b.title.trim(),date:b.date.trim(),description:b.description.trim(),source:b.source.trim(),citation:b.citation.trim(),attribution:b.attribution.trim(),caption:b.caption.trim(),transcript:b.transcript.trim(),image:b.collection==='archive'?paths[1]:paths[0],indexImage:b.collection==='archive'?paths[0]:null,archiveImage:b.collection==='archive'?paths[1]:null,pdf:b.collection==='archive'&&paths[2]?paths[2]:null,files:paths,submittedAt:new Date().toISOString()});
 await save(env,collectionPath,JSON.stringify(d,null,2)+'\n',f.sha,'Queue CTI collection submission '+id);
 return respond({ok:true,id,status:'active'});
}

if(url.pathname==='/publish'&&request.method==='POST'){if(role!=='admin')return respond({error:'Administrator access required'},403);const b=await request.json();if(!adminFiles.has(b.path)||typeof b.content!=='string'||b.content.length>2000000||typeof b.expectedSha!=='string')return respond({error:'File or content not allowed'},400);JSON.parse(b.content);const file=await gh(env,b.path);if(file.sha!==b.expectedSha)return respond({error:'File changed since it was opened'},409);await save(env,b.path,b.content,file.sha,'CTI administration: update '+b.path);return respond({ok:true})}
return respond({error:'Not found'},404)
}catch(e){return respond({error:e.message||'Unexpected error'},e.status===409?409:e.status===404?404:400)}}};
