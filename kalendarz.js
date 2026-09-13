/* =====================================================================
   📅 KALENDARZ — eksport przypomnień do kalendarza telefonu (.ics z alarmami).
   Kalendarz Google / iPhone dzwoni także przy zamkniętej apce — jedyna pewna droga
   bez własnego serwera. Plik powstaje lokalnie; nic nie wychodzi z telefonu.
   Czasy „pływające" (bez strefy) — kalendarz traktuje je jako lokalne.
   ===================================================================== */
'use strict';

const ICS_BD={1:'MO',2:'TU',3:'WE',4:'TH',5:'FR',6:'SA',7:'SU'};
function icsEsc(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n'); }
function icsDate(ds){ return ds.replace(/-/g,''); }
function icsDT(ds,min){ min=Math.max(0,Math.min(23*60+59,Math.round(min))); return icsDate(ds)+'T'+toHM(min).replace(':','')+'00'; }
function icsTrig(min){ min=Math.round(min); return (min<0?'-':'')+'PT'+Math.abs(min)+'M'; }
/* składanie linii do 75 oktetów (RFC 5545) — liczone w bajtach UTF-8, kontynuacja od spacji */
function icsFold(line){
  const enc=new TextEncoder(); let out='', cur='', bytes=0;
  for(const ch of line){ const b=enc.encode(ch).length; if(bytes+b>73){ out+=cur+'\r\n'; cur=' '+ch; bytes=1+b; } else { cur+=ch; bytes+=b; } }
  return out+cur;
}
function icsNextDow(dow){ let d=todayStr(); for(let i=0;i<7;i++){ if(isoDow(pdate(d))===dow)return d; d=addDays(d,1); } return d; }
function icsEvent(o,stamp){
  const L=['BEGIN:VEVENT','UID:'+o.uid,'DTSTAMP:'+stamp,'SUMMARY:'+icsEsc(o.summary)];
  if(o.allDay){ L.push('DTSTART;VALUE=DATE:'+icsDate(o.ds),'DTEND;VALUE=DATE:'+icsDate(addDays(o.ds,1))); }
  else { L.push('DTSTART:'+icsDT(o.ds,o.start),'DTEND:'+icsDT(o.ds,Math.max(o.end||0,o.start+5))); }
  if(o.rrule)L.push('RRULE:'+o.rrule);
  if(o.desc)L.push('DESCRIPTION:'+icsEsc(o.desc));
  if(o.loc)L.push('LOCATION:'+icsEsc(o.loc));
  for(const a of (o.alarms||[]))L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(o.summary),'TRIGGER:'+icsTrig(a),'END:VALARM');
  L.push('END:VEVENT');
  return L;
}
function buildICSEvents(opt){
  const P=data.prefs, ev=[], today=todayStr();
  if(opt.plan){
    for(let dow=1;dow<=7;dow++){
      const ds=icsNextDow(dow), c=calcDay(ds,true); // stały plan, bez nadpisań jednego dnia
      if(c.V&&c.own.length)c.V.trips.forEach((tr,i)=>ev.push({uid:'rodzinka-pickup-'+dow+'-'+i+'@plan-rodzinki',summary:'🚗 Odbiór: '+tr.kids.map(k=>k.p.name).join(', '),desc:(c.V.trips.length>1?(P.tripWord||'kurs')+' '+(i+1)+' — ':'')+'odbiór ze szkoły (Plan Rodzinki)',ds,start:tr.t,end:tr.t+15,rrule:'FREQ=WEEKLY;BYDAY='+ICS_BD[dow],alarms:(P.pickupRemind&&P.pickupLead>0)?[-P.pickupLead]:[0]}));
      for(const x of c.acts){
        const pr=person(x.a.personId); const lead=(x.a.remindMin==null||x.a.remindMin==='')?P.actLead:+x.a.remindMin;
        const alarms=[]; if(P.actRemind&&lead>0)alarms.push(-(lead+(x.dep!=null?P.travelMin:0)));
        ev.push({uid:'rodzinka-act-'+x.a.id+'@plan-rodzinki',summary:x.a.emoji+' '+x.a.name+(pr?' — '+pr.name:''),desc:(x.dep!=null?'wyjazd z domu ok. '+toHM(x.dep)+'\n':'')+(x.a.note||''),loc:x.a.place||'',ds,start:x.start,end:x.end,rrule:'FREQ=WEEKLY;BYDAY='+ICS_BD[dow],alarms});
      }
      if(P.morningRemind&&c.schoolRows.length){ const t=toMin(P.morningTime); if(t!=null)ev.push({uid:'rodzinka-morning-'+dow+'@plan-rodzinki',summary:'🎒 Szykujcie się do szkoły',desc:'wyjazd o '+P.schoolStart,ds,start:t,end:t+10,rrule:'FREQ=WEEKLY;BYDAY='+ICS_BD[dow],alarms:[0]}); }
    }
  }
  if(opt.custom)for(const r of data.customReminders){
    if(r.enabled===false)continue; const t=toMin(r.time); if(t==null)continue;
    const pr=r.personId?person(r.personId):null;
    const base={uid:'rodzinka-cust-'+r.id+'@plan-rodzinki',summary:'🔔 '+r.title+(pr?' — '+pr.name:''),desc:'Plan Rodzinki',start:t,end:t+15,alarms:[-(+r.lead||0)]};
    if(r.date){ if(r.date>=today)ev.push(Object.assign({ds:r.date},base)); }
    else if((r.dows||[]).length){ const dows=r.dows.slice().sort((a,b)=>a-b); const ds=dows.map(icsNextDow).sort()[0]; ev.push(Object.assign({ds,rrule:'FREQ=WEEKLY;BYDAY='+dows.map(d=>ICS_BD[d]).join(',')},base)); }
  }
  if(opt.lekcje&&typeof lkEv==='function'){
    const S=lkData(); const rt=toMin(S.prefs.remindTime||'19:00');
    for(const e of lkEv()){ if(e.done||e.date<today)continue; const p=person(e.personId); const T=LK_TYPES[e.type]||LK_TYPES.inne;
      ev.push({uid:'rodzinka-lk-'+e.id+'@plan-rodzinki',summary:T.em+' '+(p?p.name+': ':'')+T.name+(e.subj?' — '+e.subj:'')+(e.title?' ('+e.title+')':''),desc:e.note||'',ds:e.date,allDay:true,alarms:S.prefs.remind?[-(1440-rt)]:[]}); }
  }
  if(opt.uroda&&typeof urData==='function'){
    const B=urData(); const dbt=toMin(B.prefs.dayBeforeTime||'19:00');
    for(const it of B.items){ if(it.date<today)continue; const T=UR_TYPES[it.type]||UR_TYPES.inne; const lead=(it.remindMin==null||it.remindMin==='')?120:+it.remindMin; const t=toMin(it.time||''); const alarms=[];
      const base={uid:'rodzinka-ur-'+it.id+'@plan-rodzinki',summary:T.em+' '+(it.title||T.name),desc:it.note||'',loc:it.place||'',ds:it.date};
      if(t!=null){ if(lead>0)alarms.push(-lead); if(B.prefs.dayBefore&&it.dayBefore!==false)alarms.push(-((1440-dbt)+t)); ev.push(Object.assign(base,{start:t,end:t+60,alarms})); }
      else { if(B.prefs.dayBefore&&it.dayBefore!==false)alarms.push(-(1440-dbt)); ev.push(Object.assign(base,{allDay:true,alarms})); }
    }
  }
  if(opt.cykl&&typeof cyPredict==='function'&&cyVisible()){
    const pr=cyPredict(); if(pr){ const C=cyData().prefs; const rt=toMin(C.remindTime||'20:00');
      pr.preds.forEach((p,i)=>{ if(p.start<today)return; ev.push({uid:'rodzinka-cy-'+i+'@plan-rodzinki',summary:C.discreet?'🌸':'🌸 Okres (przewidywany)',desc:C.discreet?'':'przewidywany początek — Plan Rodzinki',ds:p.start,allDay:true,alarms:C.remindPeriod?[-(C.leadDays*1440)+rt]:[]}); }); }
  }
  return ev;
}
function buildICS(opt){
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Plan Rodzinki//PL','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Rodzinka','X-WR-TIMEZONE:Europe/Warsaw'];
  for(const o of buildICSEvents(opt))L.push(...icsEvent(o,stamp));
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n')+'\r\n';
}
function icsOpts(){ const g=id=>{ const e=document.getElementById(id); return !!(e&&e.checked); }; return {plan:g('ics-plan'),custom:g('ics-custom'),lekcje:g('ics-lekcje'),uroda:g('ics-uroda'),cykl:g('ics-cykl')}; }
function icsFile(){ const ics=buildICS(icsOpts()); const n=(ics.match(/BEGIN:VEVENT/g)||[]).length; if(!n){ toast('Nie ma czego wgrać — brak przypomnień w zaznaczonych zakresach'); return null; } return {blob:new Blob([ics],{type:'text/calendar;charset=utf-8'}),n,ics}; }
function exportICS(){
  const f=icsFile(); if(!f)return;
  const a=document.createElement('a'); a.href=URL.createObjectURL(f.blob); a.download='rodzinka.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),10000);
  toast('📅 Pobrano plik z '+f.n+' wpisami — otwórz go, żeby dodać do kalendarza');
}
async function shareICS(){
  const f=icsFile(); if(!f)return;
  const file=new File([f.blob],'rodzinka.ics',{type:'text/calendar'});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:'Rodzinka — przypomnienia'}); return; } }catch(e){ if(e&&e.name==='AbortError')return; }
  exportICS();
}
