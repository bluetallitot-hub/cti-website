(()=>{'use strict';const $=id=>document.getElementById(id);const months=['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar I','Adar II','Nisan','Iyar','Sivan','Tammuz','Av','Elul'];for(const m of months){const o=document.createElement('option');o.value=m;o.textContent=m;$('month').append(o)}function mode(){const english=document.querySelector('input[name="mode"]:checked').value==='english';$('english').hidden=!english;$('hebrew').hidden=english;$('day').required=!english;$('date').required=english}document.querySelectorAll('input[name="mode"]').forEach(x=>x.addEventListener('change',mode));mode();CTIAuth.requireRole(true).then(()=>{$('content').hidden=false}).catch(()=>{});$('form').addEventListener('submit',async e=>{e.preventDefault();const name=$('name').value.trim();const entryMode=document.querySelector('input[name="mode"]:checked').value;const payload={englishName:name,mode:entryMode};if(entryMode==='hebrew'){payload.hebrewMonth=$('month').value;payload.hebrewDay=Number($('day').value)}else{payload.dateOfDeath=$('date').value;payload.sunset=document.querySelector('input[name="sunset"]:checked').value}if(!name)return;
try{
 const response=await fetch('../content/meldados.json',{cache:'no-store'});
 if(!response.ok)throw Error('Unable to load memorial database');
 const doc=await response.json();
 const surname=s=>String(s||'').trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g,'');
 const distance=(a,b)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length]};
 let checkMonth=payload.hebrewMonth,checkDay=payload.hebrewDay;
 if(entryMode==='english'){
  const d=new Date(payload.dateOfDeath+'T12:00:00Z');if(payload.sunset==='after')d.setUTCDate(d.getUTCDate()+1);
  const parts=new Intl.DateTimeFormat('en-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).formatToParts(d);
  checkMonth=parts.find(x=>x.type==='month')?.value;checkDay=Number(parts.find(x=>x.type==='day')?.value);
 }
 const monthKey=s=>String(s||'').toLowerCase().replace(/tishri/g,'tishrei').replace(/heshvan/g,'cheshvan').replace(/tamuz/g,'tammuz').replace(/shvat/g,'shevat');
 const incoming=surname(name);
 const matches=(doc.people||[]).map(p=>{
  const existing=surname(p.englishName);
  const similar=Boolean(incoming&&existing)&&1-distance(incoming,existing)/Math.max(incoming.length,existing.length)>=.9;
  const close=monthKey(p.hebrewMonth)===monthKey(checkMonth)&&Math.abs(Number(p.hebrewDay)-checkDay)<=3;
  return {p,similar,close};
 }).filter(x=>x.similar||x.close);
 if(matches.length){
  const details=matches.slice(0,12).map(x=>x.p.englishName+' — '+x.p.hebrewDay+' '+x.p.hebrewMonth+' ('+[x.similar?'similar surname':'',x.close?'nearby date':''].filter(Boolean).join(', ')+')').join('\\n');
  if(!confirm('Possible existing Meldatho records:\\n'+details+'\\n\\nPlease review carefully. Cancel to check existing records, or OK to continue creating a distinct person.'))return;
 }
}catch(err){$('status').textContent='Could not verify existing memorials. Please try again.';return}
const description=entryMode==='hebrew'?payload.hebrewDay+' '+payload.hebrewMonth:payload.dateOfDeath+' ('+payload.sunset+' sunset)';if(!confirm('Create Meldatho for '+name+' with memorial date '+description+'?'))return;$('submit').disabled=true;$('status').textContent='Creating memorial…';$('result').hidden=true;try{const result=await CTIAuth.api('/meldados/create',payload);$('status').textContent='Meldatho created: '+result.englishName+' — '+result.hebrewDay+' '+result.hebrewMonth+'.';const link=document.createElement('a');link.href='meldados-editor.html?id='+encodeURIComponent(result.id);link.textContent='Open this Meldatho in the editor';$('result').replaceChildren(link);$('result').hidden=false;$('form').reset();mode()}catch(err){$('status').textContent=err.message||'Could not create Meldatho'}finally{$('submit').disabled=false}})})();