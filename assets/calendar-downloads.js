/* CTI calendar downloads, generated from the displayed canonical records. */
(function(){
 const zone="America/New_York";
 const escape=s=>String(s||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
 const stamp=()=>new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 const start=(date,time)=>{const m=String(time||"").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if(!/^\d{4}-\d\d-\d\d$/.test(String(date||""))||!m)return null;
  const hour=Number(m[1])%12+(m[3].toUpperCase()==="PM"?12:0),minute=Number(m[2]||0);
  if(minute>59)return null;
  return date.replace(/-/g,"")+"T"+String(hour).padStart(2,"0")+String(minute).padStart(2,"0")+"00";
 };
 const uid=s=>String(s||"event").replace(/[^a-z0-9_-]/gi,"-").toLowerCase()+"@ctipeabody.org";
 const entry=(record,kind)=>{
  const begins=start(record.date,record.time);if(!begins)return null;
  const lines=["BEGIN:VEVENT","UID:"+uid(record.id||kind+"-"+record.date+"-"+record.description+"-"+record.title),"DTSTAMP:"+stamp(),"DTSTART;TZID="+zone+":"+begins,
   "SUMMARY:"+escape(record.title||(kind==="service"?"CTI — "+(record.description||"Shabbat Service"):"CTI Event"))];
  // An end time is only included when supplied; never invent a duration.
  if(record.endTime&&(!record.endDate||record.endDate===record.date)){
   const ends=start(record.date,record.endTime);if(ends&&ends>begins)lines.push("DTEND;TZID="+zone+":"+ends);
  }
  const location=record.location||"";
  if(location)lines.push("LOCATION:"+escape(/^(In person|Hybrid|In Person and on Zoom)$/i.test(location)?"Congregation Tifereth Israel, 8 Pierpont Street, Peabody, MA 01960":location));
  const detail=[record.description||"",kind==="service"?"Attendance: "+location:"",record.endDate&&record.endDate!==record.date?"Event continues through "+record.endDate+"; see event description for daily times.":""].filter(Boolean).join("\n");
  if(detail)lines.push("DESCRIPTION:"+escape(detail));
  return lines.concat("END:VEVENT").join("\r\n");
 };
 function download(records,filename,kind){
  const items=records.map(r=>entry(r,kind)).filter(Boolean);
  if(!items.length)throw Error("No events with confirmed dates and start times available.");
  const calendar=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Congregation Tifereth Israel//CTI Calendar//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:CTI "+(kind==="service"?"Services":"Events"),"X-WR-TIMEZONE:"+zone,...items,"END:VCALENDAR"].join("\r\n")+"\r\n";
  const blob=new Blob([calendar],{type:"text/calendar;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 window.CTICalendarDownloads={download};
})();
