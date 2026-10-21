/* Shared CTI service calendar: published manual entries override generated monthly dates. */
(function(root){
 'use strict';
 const heb=new Intl.DateTimeFormat('en-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const east=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/New_York'});
 const day=86400000;
 const at=s=>new Date(s+'T12:00:00Z');
 const iso=d=>d.toISOString().slice(0,10);
 const plus=(d,n)=>new Date(d.getTime()+n*day);
 const today=()=>east.format(new Date());
 const hp=d=>{const p=heb.formatToParts(d);return {day:Number(p.find(x=>x.type==='day').value),month:p.find(x=>x.type==='month').value,year:p.find(x=>x.type==='year').value}};
 const monthId=h=>h.year+'-'+h.month;
 const monthlyId=h=>'monthly:'+monthId(h);
 const valid=s=>s&&/^\d{4}-\d{2}-\d{2}$/.test(s.date);
 function build(data,options={}){
  const source=(data&&data.services||[]).filter(valid);
  const overrides=(data&&data.overrides||[]).filter(x=>x&&x.id);
  const from=options.from||today();
  const until=options.until||iso(plus(at(from),370));
  const start=plus(at(from),-40),end=plus(at(until),35);
  const generated=[];
  const seen=new Set();
  for(let d=start;d<=end;d=plus(d,1)){
   const h=hp(d);
   if(h.day!==1||seen.has(monthId(h)))continue;
   seen.add(monthId(h));
   const saturday=plus(d,(6-d.getUTCDay()+7)%7);
   const friday=plus(saturday,-1);
   generated.push({id:monthlyId(h),date:iso(friday),time:'7:30 PM',location:['December','January','February'].includes(friday.toLocaleString('en-US',{month:'long',timeZone:'UTC'}))?'Zoom only':'In person',description:'Monthly Shabbat Service',generated:true});
   if(h.month==='Tishri'){
    const holiday=(n,id,description)=>generated.push({id:'holiday:'+h.year+':'+id,date:iso(plus(d,n)),time:'',location:'To be confirmed',description,generated:true});
    holiday(-1,'rh-eve','Rosh Hashanah — First Night (Evening)');
    holiday(0,'rh-day1','Rosh Hashanah — First Day (Morning)');
    holiday(1,'rh-day2','Rosh Hashanah — Second Day (Morning)');
    holiday(8,'yk-eve','Yom Kippur — Kol Nidre (Evening)');
    holiday(9,'yk-day','Yom Kippur — Morning');
   }
  }
  // Existing dated entries are retained. A published monthly entry replaces the
  // generated entry for its Hebrew month, even if moved to another date.
  const manualMonths=new Set();
  for(const s of source){
   if(s.description!=='Monthly Shabbat Service')continue;
   const h=hp(plus(at(s.date),1)); // Saturday following the service
   manualMonths.add(monthlyId(h));
  }
  const byId=new Map();
  for(const g of generated){
   if(manualMonths.has(g.id))continue;
   byId.set(g.id,g);
  }
  for(const s of source)byId.set(s.id||'manual:'+s.date+':'+s.description,s);
  for(const override of overrides){
   if(override.cancelled){byId.delete(override.id);continue;}
   const prior=byId.get(override.id);
   if(prior)byId.set(override.id,{...prior,...override,generated:false});
  }
  return [...byId.values()].filter(s=>s.date>=from&&s.date<=until).sort((a,b)=>a.date.localeCompare(b.date)||a.description.localeCompare(b.description));
 }
 root.CTIServiceCalendar={build,today,hebrewParts:hp};
})(window);
