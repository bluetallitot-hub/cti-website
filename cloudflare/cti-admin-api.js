// CTI administration API — Cloudflare Worker (module syntax).
// Secrets: ADMIN_PASSWORD, MELDADOS_PASSWORD, SESSION_SECRET, GITHUB_TOKEN.
// Passwords and GitHub token are NEVER exposed to the browser.
// Configure SITE_ORIGIN and GITHUB_REPOSITORY as Worker environment variables.
const enc=new TextEncoder();
const months=new Set(['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar I','Adar II','Nisan','Iyar','Sivan','Tammuz','Av','Elul']);
const communityFields=new Set(['hebrewName','dateOfBirth','dateOfDeath','hebrewDay','hebrewMonth','hebrewYearOfDeath','rememberedBy','biographyTitle','biography']);
const adminFiles=new Set(['content/services.json','content/meldados.json']);
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const githubBase64=bytes=>btoa(String.fromCharCode(...bytes));
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
if(url.pathname==='/github-check'&&request.method==='GET'){if(role!=='admin')return respond({error:'Administrator access required'},403);const f=await gh(env,'content/meldados.json');return respond({ok:true,repository:env.GITHUB_REPOSITORY,sha:f.sha,access:'read'});}
if(url.pathname==='/meldados/state'&&request.method==='GET'){const f=await gh(env,'content/meldados.json');return respond({sha:f.sha,people:JSON.parse(new TextDecoder().decode(un64(f.content.replace(/\s/g,'')))).people})}

if(url.pathname==='/meldados/update'&&request.method==='POST'){const b=await request.json();if(typeof b.recordId!=='string'||b.recordId.length>150||typeof b.expectedSha!=='string')return respond({error:'Invalid record'},400);checkChanges(b.changes);const file=await gh(env,'content/meldados.json');if(file.sha!==b.expectedSha)return respond({error:'Memorials changed since you loaded this page. Reload before saving.'},409);const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));const person=doc.people.find(p=>p.id===b.recordId);if(!person)return respond({error:'Memorial not found'},404);if(role==='meldados'&&!['approved','published','stub'].includes(person.reviewStatus))return respond({error:'Record is not editable'},403);Object.assign(person,b.changes);await save(env,'content/meldados.json',JSON.stringify(doc,null,2)+'\n',file.sha,'Update memorial information: '+person.id);return respond({ok:true,message:'Memorial changes published to GitHub'})}
if(url.pathname==='/meldados/portrait'&&request.method==='POST'){const b=await request.json();if(typeof b.recordId!=='string'||!b.recordId.match(/^[a-zA-Z0-9_-]{1,150}$/)||typeof b.image!=='string'||b.image.length>1400000||!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(b.image))return respond({error:'Invalid portrait'},400);const file=await gh(env,'content/meldados.json');const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\s/g,''))));const person=doc.people.find(p=>p.id===b.recordId);if(!person||role==='meldados'&&!['approved','published','stub'].includes(person.reviewStatus))return respond({error:'Memorial not editable'},403);const path='assets/images/meldados/portraits/'+b.recordId+'.webp';let sha;try{sha=(await gh(env,path)).sha}catch(e){if(e.status!==404)throw e}await gh(env,path,'PUT',{message:'Update memorial portrait: '+b.recordId,content:b.image.split(',')[1],sha,branch:'main'});const fresh=await gh(env,'content/meldados.json');const current=JSON.parse(new TextDecoder().decode(un64(fresh.content.replace(/\s/g,''))));const p=current.people.find(x=>x.id===b.recordId);p.photo=path;await save(env,'content/meldados.json',JSON.stringify(current,null,2)+'\n',fresh.sha,'Publish memorial portrait: '+b.recordId);return respond({ok:true})}
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
 const file=await gh(env,'content/events.json');const doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\\s/g,''))));let added=0;
 for(const e of b.events){if(typeof e.title!=='string'||e.title.length>160||!/^\\d{4}-\\d{2}-\\d{2}$/.test(e.date)||typeof e.source!=='string')continue;if(doc.events.some(x=>x.date===e.date&&x.title===e.title))continue;doc.events.push({date:e.date,title:e.title,time:'',location:'',description:'',source:e.source});added++}
 if(added)await save(env,'content/events.json',JSON.stringify(doc,null,2)+'\\n',file.sha,'Import newsletter events');return respond({ok:true,added});
}
if(url.pathname==='/newsletter/import-meldados'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();if(!Array.isArray(b.people)||b.people.length>150)return respond({error:'Invalid memorial entries'},400);
 const file=await gh(env,'content/meldados.json'),doc=JSON.parse(new TextDecoder().decode(un64(file.content.replace(/\\s/g,''))));let added=0,updated=0,exceptions=[];
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
 for(const p of b.people){if(typeof p.name!=='string'||p.name.length>120||!Number.isInteger(p.day)||p.day<1||p.day>30||!months.has(p.month)||typeof p.source!=='string'||p.source.length>150)continue;
 const sameName=doc.people.find(x=>norm(x.englishName)===norm(p.name));if(sameName){if(sameName.hebrewDay!==p.day||sameName.hebrewMonth!==p.month){exceptions.push(p.name+': memorial date differs');continue}if(p.rememberedBy&&typeof p.rememberedBy==='string'&&p.rememberedBy.length<=500){if(!sameName.rememberedBy){sameName.rememberedBy=p.rememberedBy;updated++}else if(sameName.rememberedBy.trim()!==p.rememberedBy.trim())exceptions.push(p.name+': Remembered By differs')}continue}
 const match=doc.people.some(x=>x.hebrewDay===p.day&&x.hebrewMonth===p.month&&(norm(x.englishName)===norm(p.name)));if(match)continue;
 doc.people.push({id:'newsletter-'+crypto.randomUUID(),englishName:p.name,hebrewName:'',hebrewDay:p.day,hebrewMonth:p.month,hebrewYearOfDeath:null,dateOfDeath:'',rememberedBy:typeof p.rememberedBy==='string'?p.rememberedBy.slice(0,500):'',biography:'',photo:'',source:p.source,reviewStatus:'approved',approved:true,notes:'Imported from newsletter; death year not supplied.'});added++}
 if(Array.isArray(b.rememberedByUpdates)&&b.rememberedByUpdates.length<=150)for(const proposal of b.rememberedByUpdates){if(typeof proposal.recordId!=='string'||typeof proposal.name!=='string'||typeof proposal.rememberedBy!=='string'||!proposal.rememberedBy.trim()||proposal.rememberedBy.length>500)continue;const record=doc.people.find(x=>x.id===proposal.recordId&&norm(x.englishName)===norm(proposal.name));if(!record){exceptions.push(proposal.name+': memorial identity not confirmed');continue}if(record.rememberedBy){if(record.rememberedBy.trim()!==proposal.rememberedBy.trim())exceptions.push(proposal.name+': Remembered By differs');continue}record.rememberedBy=proposal.rememberedBy.trim();updated++}
 if(added||updated)await save(env,'content/meldados.json',JSON.stringify(doc,null,2)+'\\n',file.sha,'Import newsletter memorial records');return respond({ok:true,added,updated,exceptions});
}
if(url.pathname==='/newsletter/upload'&&request.method==='POST'){
 if(role!=='admin')return respond({error:'Administrator access required'},403);
 const b=await request.json();
 if(typeof b.pdf!=='string'||b.pdf.length>10500000||!b.pdf.startsWith('JVBERi0'))return respond({error:'Select a PDF smaller than 7 MB'},400);
 if(!/^\\d{4}-(0[1-9]|1[0-2])$/.test(b.month||''))return respond({error:'Newsletter month not identified'},400);
 const date=b.month+'-01',title=new Date(date+'T12:00:00Z').toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})+' Newsletter';
 const path='assets/resources/newsletters/'+b.month.slice(0,4)+'/cti-newsletter-'+b.month+'.pdf';
 const index=await gh(env,'content/newsletters.json');
 const data=JSON.parse(new TextDecoder().decode(un64(index.content.replace(/\\s/g,''))));
 if(data.issues.some(x=>x.date===date))return respond({error:'This month already has a newsletter'},409);
 await gh(env,path,'PUT',{message:'Upload '+title,content:b.pdf,branch:'main'});
 data.issues.unshift({title,date,volume:String(b.volume||'').slice(0,80),description:'CTI congregational newsletter.',url:path});
 await save(env,'content/newsletters.json',JSON.stringify(data,null,2)+'\\n',index.sha,'Publish '+title);
 return respond({ok:true,title});
}
if(url.pathname==='/publish'&&request.method==='POST'){if(role!=='admin')return respond({error:'Administrator access required'},403);const b=await request.json();if(!adminFiles.has(b.path)||typeof b.content!=='string'||b.content.length>2000000||typeof b.expectedSha!=='string')return respond({error:'File or content not allowed'},400);JSON.parse(b.content);const file=await gh(env,b.path);if(file.sha!==b.expectedSha)return respond({error:'File changed since it was opened'},409);await save(env,b.path,b.content,file.sha,'CTI administration: update '+b.path);return respond({ok:true})}
return respond({error:'Not found'},404)
}catch(e){return respond({error:e.message||'Unexpected error'},e.status===409?409:e.status===404?404:400)}}};
