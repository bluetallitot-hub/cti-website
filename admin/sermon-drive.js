(()=>{'use strict';
const CLIENT='318496530412-15udto20n1paeofa39t87ee4dsj0qf3a.apps.googleusercontent.com';
const ROOT='1B3FsoS4ggX2ECbPgjZEgyu4Ws1Sl3CPH',PARASHA='1Wi2TdXf0v-psdEULePqceghjZG5Ns9uF',HOLIDAYS='1hszi9wqMFniPLiX3KOfjkrWDRgQvYK94';
const $=id=>document.getElementById(id);let token='',expiry=0,tokenClient=null,active=PARASHA,crumbs=[];
const status=s=>$('driveStatus').textContent=s;
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
function googleReady(){return !!(window.google&&google.accounts&&google.accounts.oauth2)}
function authorize(){if(!googleReady()){status('Google sign-in is still loading. Try again.');return}
if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CLIENT,scope:'https://www.googleapis.com/auth/drive.readonly',callback:r=>{if(r.error){status('Google authorization failed: '+r.error);return}token=r.access_token;expiry=Date.now()+((r.expires_in||3500)-60)*1000;openDefault()}});
tokenClient.requestAccessToken({prompt:token?'':'consent'})}
async function api(path){if(!token||Date.now()>expiry)throw Error('Connect Google Drive again to continue');const r=await fetch('https://www.googleapis.com/drive/v3/'+path,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Google Drive request failed ('+r.status+'). '+(r.status===403?'Check the Drive API and OAuth test-user settings.':''));return r}
async function children(id){let result=[],pageToken='';do{const q=encodeURIComponent("'"+id+"' in parents and trashed = false");const url='files?q='+q+'&fields='+encodeURIComponent('nextPageToken,files(id,name,mimeType,webViewLink,size)')+'&page_size=1000'+(pageToken?'&page_token='+encodeURIComponent(pageToken):'');const data=await(await api(url)).json();result.push(...(data.files||[]));pageToken=data.nextPageToken||''}while(pageToken);return result.sort((a,b)=>(a.mimeType==='application/vnd.google-apps.folder'?0:1)-(b.mimeType==='application/vnd.google-apps.folder'?0:1)||a.name.localeCompare(b.name))}
function render(files){const box=$('driveItems');box.replaceChildren();const term=$('driveSearch').value.trim().toLowerCase();let count=0;for(const f of files){if(!f.name.toLowerCase().includes(term))continue;count++;const folder=f.mimeType==='application/vnd.google-apps.folder';const button=document.createElement('button');button.type='button';button.textContent=(folder?'📁 ':'📄 ')+f.name;button.className='drive-item';button.onclick=()=>folder?browse(f.id,f.name):selectFile(f);box.append(button)}if(!count)box.textContent='No matching items in this folder.'}
let currentFiles=[];
async function browse(id,name,reset=false){status('Loading '+name+'…');try{const files=await children(id);active=id;if(reset)crumbs=[];crumbs.push({id,name});currentFiles=files;render(files);$('driveFolder').textContent=crumbs.map(c=>c.name).join(' / ');$('driveBack').disabled=crumbs.length<=1;status(files.length+' items. Select a sermon file to import the Reader and Email editions together.')}catch(e){status(e.message)}}
let importSequence=0;
function editionType(name){
 const n=norm(name);
 if(/(reader|website)/.test(n)&&/(md$|markdown|edition|approved|reader)/.test(n))return 'reader';
 if(/(fridayemail|emailedition|email)/.test(n)&&/(md$|markdown|edition|approved|ph ilpath|cti)/.test(n))return 'email';
 return null;
}
function editionRank(f){
 const n=norm(f.name);
 return (/(approved)/.test(n)?20:0)+(/\.md$/i.test(f.name)?12:0)+(f.mimeType==='text/markdown'?8:0)+(/markdownsource/.test(n)?5:0)+(/philpath/.test(n)?2:0);
}
async function readText(f){
 let response;
 if(f.mimeType==='application/vnd.google-apps.document')response=await api('files/'+encodeURIComponent(f.id)+'/export?mimeType=text%2Fplain');
 else if(/^(text\/|application\/octet-stream)/.test(f.mimeType)||/\.(md|txt)$/i.test(f.name))response=await api('files/'+encodeURIComponent(f.id)+'?alt=media');
 else throw Error('Unsupported file format: '+f.name);
 const content=await response.text();
 if(content.length>200000)throw Error('File too large: '+f.name);
 return content;
}
function bestEdition(files,type){
 return files.filter(f=>f.mimeType!=='application/vnd.google-apps.folder'&&editionType(f.name)===type).sort((a,b)=>editionRank(b)-editionRank(a))[0]||null;
}
function titleFromMarkdown(text){
 const heading=text.match(/^#\s+(.+)$/m);
 return heading?heading[1].replace(/[*_]/g,'').trim():'';
}
async function importEditions(files,chosen){
 const seq=++importSequence;
 const reader=bestEdition(files,'reader'),email=bestEdition(files,'email');
 const toLoad=[];
 if(reader)toLoad.push(['reader',reader]);
 if(email)toLoad.push(['email',email]);
 if(!toLoad.length&&chosen)toLoad.push(['reader',chosen]);
 if(!toLoad.length){status('No Reader or Email editions found in this folder.');return}
 status('Loading '+toLoad.map(([kind,f])=>kind+': '+f.name).join(' and ')+'…');
 try{
   const contents=await Promise.all(toLoad.map(async([kind,f])=>({kind,file:f,text:await readText(f)})));
   if(seq!==importSequence||active!==crumbs[crumbs.length-1]?.id)return;
   for(const x of contents){
     if(x.kind==='reader')$('sermon').value=x.text;
     else $('body').value=x.text;
   }
   const main=contents.find(x=>x.kind==='reader')||contents[0];
   const extracted=titleFromMarkdown(main.text);
   if(!$('record').value&&extracted)$('title').value=extracted;
   if($('title').value)$('subject').value='D’var Torah — '+$('title').value;
   const names=contents.map(x=>(x.kind==='reader'?'Reader':'Email')+' Edition').join(' and ');
   $('status').textContent='Imported '+names+' from Google Drive as editable copies. No draft saved or published; originals remain unchanged.';
   status('Imported '+names+'. Review the Website D’var Torah and Friday Email tabs.');
   document.querySelector('[data-pane="editor"]').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){status('Import failed: '+e.message)}
}
async function selectFile(f){
 if(f.mimeType!=='application/vnd.google-apps.document'&&!/^(text\/|application\/octet-stream)/.test(f.mimeType)&&!/\.(md|txt)$/i.test(f.name)){
   window.open(f.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(f.id)+'/view','_blank','noopener');
   return;
 }
 const reader=bestEdition(currentFiles,'reader'),email=bestEdition(currentFiles,'email');
 const paired=!!(reader||email);
 if(!confirm(paired?'Import the Reader and Email editions found in this folder as separate editable drafts? Original Drive files will not change.':'Import a copy of “'+f.name+'” into the Reader Edition draft?'))return;
 if(paired)await importEditions(currentFiles,f);
 else await importEditions([],f);
}
async function openDefault(){status('Finding this week’s parasha…');try{const folders=await children(PARASHA);const now=new Date(),saturday=new Date(now);saturday.setDate(now.getDate()+(6-now.getDay()+7)%7);const date=saturday.getFullYear()+'-'+String(saturday.getMonth()+1).padStart(2,'0')+'-'+String(saturday.getDate()).padStart(2,'0');const url='https://www.hebcal.com/hebcal?v=1&cfg=json&maj=off&min=off&mod=off&nx=off&s=on&start='+date+'&end='+date;const response=await fetch(url);if(!response.ok)throw Error('Parasha calendar unavailable');const data=await response.json();const reading=(data.items||[]).find(x=>x.category==='parashat');const names=(reading?.title||'').replace(/^Parashat\s+/i,'').split(/[-–]/).map(norm);const folder=folders.find(f=>names.some(n=>n&&norm(f.name.replace(/^\d+-\d+\s*/,''))===n));if(folder){await browse(folder.id,folder.name,true);return}await browse(PARASHA,'Parasha',true);status('No exact weekly folder match; showing all parasha folders.')}catch(e){await browse(PARASHA,'Parasha',true);status('Could not determine this week’s parasha automatically; choose a folder. '+e.message)}}
$('driveConnect').onclick=authorize;
$('driveBack').onclick=()=>{if(crumbs.length>1){crumbs.pop();const p=crumbs.pop();browse(p.id,p.name)}};
$('driveParasha').onclick=()=>browse(PARASHA,'Parasha',true);
$('driveHolidays').onclick=()=>browse(HOLIDAYS,'Holidays',true);
$('driveRoot').onclick=()=>browse(ROOT,'Sermons',true);
$('driveSearch').oninput=()=>render(currentFiles);
})();
