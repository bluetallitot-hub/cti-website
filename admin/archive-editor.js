let data=null,prepared=null;
const $=id=>document.getElementById(id);
const fields=['id','title','subtitle','citation','scans','transcript','status'];
const download=(name,content,type)=>{const blob=new Blob([content],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
fetch('../content/archives/index.json').then(r=>{if(!r.ok)throw Error('Archive index unavailable');return r.json()}).then(d=>{
 data=d;for(const x of d.items){const o=document.createElement('option');o.value=x.id;o.textContent=x.title;$('record').append(o)}
 $('message').textContent=d.items.length+' archive records loaded.';
}).catch(e=>$('message').textContent=e.message);
$('record').onchange=async()=>{
 const x=data?.items.find(x=>x.id===$('record').value);
 for(const f of fields)$(f).value='';
 $('status').value='draft';
 if(!x)return;
 for(const f of ['id','title','subtitle','citation','status'])$(f).value=x[f]||'';
 $('scans').value=(x.scans||[]).join('\n');
 try{$('transcript').value=await fetch('../'+x.transcription).then(r=>{if(!r.ok)throw Error('Cannot load transcription');return r.text()})}catch(e){$('message').textContent=e.message}
};
$('save').onclick=()=>{
 if(!data){$('message').textContent='Wait for index to load';return}
 const id=$('id').value.trim(),title=$('title').value.trim(),citation=$('citation').value.trim(),body=$('transcript').value.trim(),status=$('status').value;
 if(!/^archive-[a-z0-9-]+$/.test(id)||!title||!body){$('message').textContent='Valid ID, title and transcription required';return}
 const original=data.items.find(x=>x.id===id);
 if(!original&&data.items.some(x=>x.title===title)){$('message').textContent='Title already exists; select its record to edit';return}
 const scans=$('scans').value.split('\n').map(x=>x.trim()).filter(Boolean);
 if(scans.some(x=>!/^assets\/archive\/[a-zA-Z0-9_./ -]+\.(jpg|jpeg|png|webp|pdf)$/i.test(x)||x.includes('..'))){$('message').textContent='Scan paths must be existing assets/archive files';return}
 if(status==='published'&&(!citation||!scans.length)){$('message').textContent='Published records require a source citation and original scan';return}
 const record={...(original||{}),id,title,subtitle:$('subtitle').value.trim(),citation,scans,transcription:'content/archives/transcriptions/'+id+'.txt',status,review:original?.review||'Awaiting source verification'};
 const items=data.items.filter(x=>x.id!==id);items.push(record);
 prepared={index:JSON.stringify({...data,items},null,2)+'\n',body:body+'\n',id};
 $('index').disabled=false;$('text').disabled=false;
 $('message').textContent='Files prepared. Download BOTH files, commit together, and verify the original scans and registry before publishing.';
};
$('index').onclick=()=>{if(prepared)download('index.json',prepared.index,'application/json')};
$('text').onclick=()=>{if(prepared)download(prepared.id+'.txt',prepared.body,'text/plain;charset=utf-8')};