(function(){
'use strict';
const monthNames='January February March April May June July August September October November December'.split(' ');
const monthIndex=name=>monthNames.findIndex(m=>m.toLowerCase()===String(name).toLowerCase())+1;
const key=(year,month,day)=>year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
function extract(pages,issue){
 const text=pages.join(' ').replace(/\s+/g,' ');
 const year=Number(issue.slice(0,4)),candleLighting={};
 const start=text.search(/CANDLE\s+LIGHTING\s+TIMES\s+FOR\s+SHABBAT/i);
 if(start>=0){
  const section=text.slice(start,start+1100);
  const re=/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(\d{1,2}):(\d{2})\b/gi;
  for(const match of section.matchAll(re)){
   const month=monthIndex(match[1]),day=Number(match[2]),hour=Number(match[3]),minute=Number(match[4]);
   const date=new Date(Date.UTC(year,month-1,day,12));
   if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||date.getUTCDay()!==5||hour<1||hour>12||minute>59)continue;
   const pm=hour===12?12:hour;
   candleLighting[key(year,month,day)]=hour+':'+String(minute).padStart(2,'0')+' PM';
  }
 }
 // Observances are evidence only. The canonical Meldathos database is never edited from newsletters.
 const meldathos=[];
 const seen=new Set();
 for(let i=0;i<pages.length;i++){
  const lines=pages[i].split(/(?=\b(?:NOVEMBER|DECEMBER|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER)\b)/);
  for(const line of lines){
   if(!/YAHRZEIT|MELDATHOS|MELDADOS/i.test(line))continue;
   const re=/\b(\d{1,2})\s+([A-Z][a-z]+(?:\s+\([^)]+\))?(?:\s+[A-Z][a-z.'-]+){1,4})\s+(\d{1,2})\b/g;
   for(const m of line.matchAll(re)){const name=m[2].trim();if(seen.has(name))continue;seen.add(name);meldathos.push({name,page:i+1})}
  }
 }
 // Birthdays and anniversaries are not returned to a public endpoint until a private store exists.
 return {candleLighting,meldathos};
}
window.CTINewsletterExtract={extract};
})();