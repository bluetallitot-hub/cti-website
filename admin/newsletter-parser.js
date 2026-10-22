// Layout-aware CTI newsletter extraction. All coordinates are PDF points.
export function parseCTINewsletter(pages,issueMonth){
 const result={events:[],meldados:[],birthdays:[],anniversaries:[],donations:[],candles:[],exceptions:[]};
 const year=Number(issueMonth.slice(0,4));
 const mon={'january':1,'february':2,'march':3,'april':4,'may':5,'june':6,'july':7,'august':8,'september':9,'october':10,'november':11,'december':12};
 const hebrew=new Set(['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Nisan','Iyar','Sivan','Tammuz','Av','Elul']);
 const iso=(m,d)=>year+'-'+String(mon[m.toLowerCase()]||0).padStart(2,'0')+'-'+String(d).padStart(2,'0');
 const lines=(page,x0,x1,y0=0,y1=10000)=>{const rows=[];for(const t of page.filter(t=>t.x>=x0&&t.x<x1&&t.y>=y0&&t.y<y1).sort((a,b)=>a.y-b.y||a.x-b.x)){let row=rows.find(r=>Math.abs(r.y-t.y)<3);if(!row){row={y:t.y,parts:[]};rows.push(row)}row.parts.push(t)}return rows.sort((a,b)=>a.y-b.y).map(r=>({y:r.y,text:r.parts.sort((a,b)=>a.x-b.x).map(x=>x.str).join(' ').replace(/\s+/g,' ').trim()}))};
 const addDate=(arr,m,day,name,source)=>{if(!mon[m.toLowerCase()]||day<1||day>31||!name)return;arr.push({name,month:m,day,date:iso(m,day),source})};
 for(let i=0;i<pages.length;i++){
  const page=pages[i],all=lines(page,0,1200),full=all.map(x=>x.text).join(' ');
  if(/YAHRZEIT\s*-\s*MELDATHOS/i.test(full)){
   // CTI memorial calendar is two side-by-side columns, each containing civil day,
   // memorial name, Hebrew day; the month changes partway down each column.
   for(const [x0,x1,initial] of [[0,190,'May'],[190,410,'June']]){
    let civil=initial,hebrew=initial==='May'?'Sivan':'Tammuz';
    for(const row of lines(page,x0,x1)){
     const label=row.text.match(/^(MAY|JUNE|JULY|AUGUST)\b/i);
     if(label&&row.text.length<18){civil=label[1][0]+label[1].slice(1).toLowerCase();continue}
     const m=row.text.match(/^(\d{1,2})\s+(.+?)\s+(\d{1,2})$/);
     if(!m)continue;
     const [,day,name,hd]=m;const hday=Number(hd);
     if(hday<1||hday>30||!mon[civil.toLowerCase()])continue;
     // The Hebrew month may cross a boundary; do not infer it from the civil date.
     result.meldados.push({name:name.trim(),day:hday,month:hebrew,civilDate:iso(civil,Number(day)),source:'Newsletter '+issueMonth,rememberedBy:''});
    }
   }
   // Birthday columns are to the right; anniversary lists start below them.
   for(const [x0,x1,m] of [[415,585,'May'],[585,790,'June']]){
    for(const row of lines(page,x0,x1,85,375)){const match=row.text.match(/^(\d{1,2})\s+(.{3,80})$/);if(match)addDate(result.birthdays,m,Number(match[1]),match[2].trim(),'Newsletter '+issueMonth)}
   }
   let anniversaryMonth='May';
   for(const row of lines(page,450,790,375)){
    if(/^May$/i.test(row.text)){anniversaryMonth='May';continue}
    if(/^June$/i.test(row.text)){anniversaryMonth='June';continue}
    const m=row.text.match(/^(\d{1,2})\s+((?:Mr\.|Dr\.)\s*&\s*Mrs\.\s+.+)$/i);
    if(m)addDate(result.anniversaries,anniversaryMonth,Number(m[1]),m[2],'Newsletter '+issueMonth);
   }
   // Service dates: read explicit Hebrew-month / civil-month pairs.
   for(const row of lines(page,0,420,0,120)){
    const re=/\b(Sivan|Tammuz|Av|Elul)\s*-\s*(May|June|July|August)\s+(\d{1,2})/gi;let m;
    while((m=re.exec(row.text)))result.events.push({date:iso(m[2],Number(m[3])),title:'Friday Evening Shabbat Service',time:'7:30 PM',location:'CTI synagogue',description:'Memorial reading for '+m[1],source:'Newsletter '+issueMonth});
   }
  }
  if(/Donated by/i.test(full)&&/In Memory Of/i.test(full)){
   const donors=lines(page,0,210,105,360),memorials=lines(page,210,410,105,360);
   for(const d of donors){const match=memorials.find(m=>Math.abs(m.y-d.y)<3);if(!match||!d.text||!match.text)continue;
    const m=match.text.match(/^(.+?)\s*-\s*(Father|Mother|Sister|Brother|Daughter|Son|Uncle|Aunt|Grandfather|Grandmother)\s*$/i);
    if(!m){result.exceptions.push('Unparsed memorial donation: '+d.text+' / '+match.text);continue}
    result.donations.push({name:m[1].trim(),rememberedBy:d.text,relationship:m[2],source:'Newsletter '+issueMonth});
   }
  }
  if(/CANDLE LIGHTING TIMES FOR SHABBAT/i.test(full)){
   for(const [x0,x1,m] of [[440,605,'May'],[605,790,'June']])for(const row of lines(page,x0,x1,500,600)){
    const match=row.text.match(/^(?:May|June)\s+(\d{1,2})\s+(\d{1,2}:\d{2})/i);
    if(match)result.candles.push({date:iso(m,Number(match[1])),time:match[2],source:'Newsletter '+issueMonth});
   }
  }
  // Narrative event: only explicit dated statements; review before import.
  for(const row of all){const m=row.text.match(/annual luncheon will be held on (August|July|June|May)\s+(\d{1,2})/i);if(m)result.events.push({date:iso(m[1],Number(m[2])),title:'Ladies Auxiliary annual luncheon',time:'',location:'',description:'Details to follow',source:'Newsletter '+issueMonth})}
 }
 // Donations are a source of remembered-by proposals, never memorial-date evidence.
 for(const d of result.donations){const matches=result.meldados.filter(p=>p.name.toLowerCase()===d.name.toLowerCase());if(matches.length===1)matches[0].rememberedBy=d.rememberedBy}
 return result;
}
