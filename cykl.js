/* =====================================================================
   🌸 MÓJ CYKL — prywatny kalendarz cyklu: przewidywania z własnych wpisów,
   fazy z podpowiedziami, objawy/nastrój, przypomnienia (dyskretne), PIN, ukrywanie.
   Szacunki — nie porada medyczna ani antykoncepcja.
   ===================================================================== */
'use strict';

const CY_SYM=['ból brzucha','ból głowy','ból pleców','zmęczenie','wzdęcia','tkliwość piersi','trądzik','apetyt','bezsenność','nerwowość','płaczliwość','energia ⬆','libido ⬆','zawroty','mdłości'];
const CY_MOOD=['😊','😐','😢','😤','🥱','🤩','🤒','🥰'];
/* Podpowiedzi są zapisane tutaj, w kodzie (apka nie łączy się z internetem). Po kilka na fazę —
   wybór zależy od dnia cyklu, więc zmieniają się codziennie, ale przewidywalnie. */
const CY_PHASES={
  menstruacja:{name:'Menstruacja',em:'🩸',tips:[
    'Odpoczynek jest w cenie. Ciepła herbata, koc i mniej planów — świat poczeka 🫖',
    'Ciepło na brzuch, magnez i kakao potrafią zdziałać cuda. Dziś nie musisz być bohaterką 💗',
    'Zmęczenie jest fizjologiczne, nie z lenistwa. Jeśli możesz, idź spać godzinę wcześniej 😴',
    'Lekki spacer często pomaga na skurcze bardziej niż leżenie — ale to Ty wiesz najlepiej 🚶‍♀️',
    'Żelazo w diecie (szpinak, soczewica, wołowina) uzupełni to, co dziś ubywa 🥬']},
  folikularna:{name:'Faza folikularna',em:'🌱',tips:[
    'Energia rośnie z dnia na dzień — dobry moment na nowe rzeczy, sport i trudniejsze rozmowy 💪',
    'To Twoja „wiosna": jasna głowa, więcej pomysłów. Zapisz je w Notatkach, zanim uciekną 💡',
    'Skóra zwykle najładniejsza w cyklu — dobry czas na fryzjera czy sesję zdjęciową 📸',
    'Kondycja idzie w górę — jeśli zbierałaś się na trening, teraz pójdzie najłatwiej 🏃‍♀️',
    'Fajny moment na plany i decyzje — jesteś teraz najbardziej „na tak" ✨']},
  owulacja:{name:'Owulacja',em:'🌸',tips:[
    'Szczyt formy i nastroju. Jeśli planujecie (lub nie planujecie) dziecko — to te dni 💜',
    'Lekki ból po jednej stronie brzucha w te dni to często zwykłe „ping" owulacyjne — normalne 🌸',
    'Więcej pewności siebie, więcej uroku — wykorzystaj to na coś dla siebie 💃',
    'Możesz mieć lekko podwyższoną temperaturę i większy apetyt na bliskość — natura wie, co robi 🔥']},
  lutealna:{name:'Faza lutealna',em:'🌙',tips:[
    'Może dopaść Cię ochota na słodkie i mniej cierpliwości — to hormony, nie Ty. Bądź dla siebie łagodna 🍫',
    'Jeśli świat dziś irytuje bardziej niż zwykle, to progesteron, nie Ty. Odłóż trudne rozmowy na później 🧸',
    'Wzdęcia i „ciężkość" pod koniec fazy są typowe — mniej soli, więcej wody i ruchu 💧',
    'Sen bywa gorszy — wieczorem odłóż telefon wcześniej niż zwykle, ciało Ci podziękuje 🌙',
    'To dobry tydzień na porządki i domykanie spraw — mniej na rozpoczynanie nowych 📦',
    'Gorsze dni przed okresem mijają szybciej, gdy zaplanujesz na nie coś miłego dla siebie 🛁']},
};
function cyTip(phase,cycleDay){ const t=CY_PHASES[phase].tips; return t[Math.max(0,(cycleDay||1)-1)%t.length]; }
function cyPhrase(n){ return n===0?'Okres przewidywany dziś':(n===1?'Okres przewidywany jutro':'Okres za '+n+' dni'); }
let cyMonth=null, cyUnlocked=false, cyShowSettings=false;

function cyData(){
  if(!data.cycle)data.cycle={periods:[],days:{},prefs:{}};
  const C=data.cycle; C.periods=C.periods||[]; C.days=C.days||{};
  C.prefs=Object.assign({cycleLen:28,periodLen:5,remindPeriod:true,leadDays:2,remindTime:'20:00',remindOvu:false,discreet:true,pin:'',hidden:false},C.prefs||{});
  return C;
}
function cyVisible(){ return !cyData().prefs.hidden; }
function dDiff(a,b){ return Math.round((pdate(b)-pdate(a))/86400000); }

/* ---------- statystyki i przewidywania ---------- */
function cyStats(){
  const C=cyData(), P=C.prefs;
  const per=C.periods.slice().filter(p=>p.start).sort((a,b)=>a.start<b.start?-1:1);
  const lens=[]; for(let i=1;i<per.length;i++){ const d=dDiff(per[i-1].start,per[i].start); if(d>=15&&d<=60)lens.push(d); }
  const last6=lens.slice(-6);
  const avgCycle=last6.length?Math.round(last6.reduce((a,b)=>a+b,0)/last6.length):P.cycleLen;
  const plens=per.filter(p=>p.end).map(p=>dDiff(p.start,p.end)+1).filter(n=>n>=1&&n<=12).slice(-6);
  const avgPeriod=plens.length?Math.round(plens.reduce((a,b)=>a+b,0)/plens.length):P.periodLen;
  const reg=last6.length>=2?Math.max(...last6)-Math.min(...last6):null;
  return {per,lens,last6,avgCycle,avgPeriod,reg,last:per[per.length-1]||null};
}
function cyPredict(){
  const S=cyStats(); if(!S.last)return null;
  const today=todayStr();
  const lastStart=S.last.start;
  const nextStart=addDays(lastStart,S.avgCycle);
  const cycleDay=dDiff(lastStart,today)+1;
  const ovu=addDays(nextStart,-14);
  const openPeriod=!S.last.end&&cycleDay<=12;
  let phase;
  if(openPeriod||cycleDay<=S.avgPeriod)phase='menstruacja';
  else if(Math.abs(dDiff(ovu,today))<=1)phase='owulacja';
  else if(today<ovu)phase='folikularna';
  else phase='lutealna';
  const late=today>nextStart?dDiff(nextStart,today):0;
  const toNext=dDiff(today,nextStart);
  const preds=[]; for(let k=1;k<=3;k++){ const s=addDays(lastStart,k*S.avgCycle); preds.push({start:s,end:addDays(s,S.avgPeriod-1),ovu:addDays(s,-14),fertA:addDays(s,-19),fertB:addDays(s,-13)}); }
  const pms=toNext>=1&&toNext<=5;
  return {S,lastStart,nextStart,cycleDay,ovu,phase,late,toNext,preds,openPeriod,pms,fertA:addDays(ovu,-5),fertB:addDays(ovu,1)};
}
function cyDayInfo(ds){
  const C=cyData(); const info={period:false,pred:false,fertile:false,ovu:false,mark:false,open:false};
  for(const p of C.periods){ if(!p.start)continue; const end=p.end||addDays(p.start,Math.min(cyStats().avgPeriod,7)-1); if(ds>=p.start&&ds<=end){ info.period=true; if(!p.end)info.open=true; } }
  const d=C.days[ds]; if(d&&((d.sym&&d.sym.length)||d.mood||d.note||d.flow))info.mark=true;
  const P=cyPredict();
  if(P){ for(const pr of P.preds){ if(ds>=pr.start&&ds<=pr.end)info.pred=true; if(ds>=pr.fertA&&ds<=pr.fertB)info.fertile=true; if(ds===pr.ovu)info.ovu=true; }
    if(ds>=P.fertA&&ds<=P.fertB&&ds>=P.lastStart)info.fertile=true; if(ds===P.ovu)info.ovu=true; }
  return info;
}
function cyChipText(){
  const C=cyData(); if(C.prefs.hidden||C.prefs.pin)return null;
  const P=cyPredict(); if(!P)return '🌸 zaznacz pierwszy dzień okresu';
  if(P.late)return '🌸 okres spóźnia się '+P.late+' d.';
  if(P.phase==='menstruacja')return '🌸 dzień '+P.cycleDay+' · menstruacja';
  return '🌸 dzień '+P.cycleDay+' · okres za '+P.toNext+' d.';
}
/* przypomnienia do silnika głównego */
function cycleReminders(ds){
  const C=cyData(), P=C.prefs, out=[]; if(P.hidden)return out;
  const pr=cyPredict(); if(!pr)return out;
  const at=toMin(P.remindTime||'20:00');
  if(P.remindPeriod&&addDays(pr.nextStart,-(+P.leadDays||0))===ds&&pr.nextStart>=ds){
    out.push({at,key:'cy_period@'+pr.nextStart,title:P.discreet?'🌸 Przypomnienie':'🌸 '+cyPhrase(dDiff(ds,pr.nextStart)),body:P.discreet?'Zajrzyj do apki':'ok. '+fmtShort(pr.nextStart)+' — miej zapas w torebce'});
  }
  if(P.remindOvu&&pr.ovu===ds){ out.push({at:toMin('09:00'),key:'cy_ovu@'+ds,title:P.discreet?'🌸 Przypomnienie':'🌸 Dziś przewidywana owulacja',body:P.discreet?'Zajrzyj do apki':'szczyt płodności'}); }
  return out;
}
function durTxtDays(n){ return n===0?'dziś':(n===1?'1 dzień':n+' dni'); }

/* ---------- render ---------- */
function renderCykl(){ keepScroll('cykl',_renderCykl); }
function _renderCykl(){
  const C=cyData(), P=C.prefs;
  let h='<div class="sub-bar"><button class="iconbtn" onclick="showView(\'wiecej\')">←</button><span>🌸 Mój cykl</span><button class="iconbtn" onclick="cyShowSettings=!cyShowSettings;renderCykl()">⚙️</button></div>';
  if(P.pin&&!cyUnlocked){
    h+='<div class="card" style="text-align:center;padding:28px 16px"><div style="font-size:2.4rem">🔒</div><div style="font-weight:700;margin:8px 0 12px">Panel zabezpieczony PIN-em</div>'+
       '<input type="password" inputmode="numeric" maxlength="4" id="cy-pin" class="cy-pinin" placeholder="••••" autocomplete="off"><br><button class="btn btn-acc" style="width:auto;margin-top:12px;padding:10px 26px" onclick="cyUnlock()">Odblokuj</button></div>';
    $('#v-cykl').innerHTML=h;
    const pi=$('#cy-pin'); if(pi){ pi.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();e.stopPropagation();cyUnlock();} }); setTimeout(()=>pi.focus(),100); }
    return;
  }
  const pr=cyPredict(), today=todayStr();
  /* hero */
  h+='<div class="hero cy-hero">';
  if(!pr){
    h+='<div class="dname">Zacznijmy 🌸</div><div class="dsub" style="margin-top:4px">Zaznacz pierwszy dzień ostatniego okresu, a zacznę liczyć fazy i przewidywać kolejne.</div>'+
       '<button class="hero-today-btn" onclick="cyStartToday()">🩸 Okres zaczął się dziś</button><button class="hero-today-btn" style="background:rgba(255,255,255,.14)" onclick="cyOpenDay(\''+today+'\')">📅 Wybierz inny dzień w kalendarzu</button>';
  } else {
    const ph=CY_PHASES[pr.phase];
    h+='<div class="lbl" style="font-size:.75rem;font-weight:600;opacity:.9;text-transform:uppercase;letter-spacing:.4px">Dzień cyklu</div>'+
       '<div class="dname" style="font-size:2rem;line-height:1.1">'+pr.cycleDay+' <span style="font-size:1rem;opacity:.95">· '+ph.em+' '+ph.name+'</span></div>';
    if(pr.late)h+='<div class="cy-big">⏳ Okres spóźnia się '+pr.late+' '+(pr.late===1?'dzień':'dni')+'</div>';
    else if(pr.phase==='menstruacja')h+='<div class="cy-big">🩸 Trwa okres'+(pr.openPeriod?'':' (wg przewidywań)')+'</div>';
    else if(pr.toNext===0)h+='<div class="cy-big">🌸 Dziś przewidywany okres</div>';
    else if(pr.toNext===1)h+='<div class="cy-big">Okres przewidywany jutro <span style="opacity:.9;font-weight:600">· '+fmtShort(pr.nextStart)+'</span></div>';
    else h+='<div class="cy-big">Następny okres za '+pr.toNext+' dni <span style="opacity:.9;font-weight:600">· ok. '+fmtShort(pr.nextStart)+'</span></div>';
    h+='<div class="cy-sub">🌸 dni płodne ok. '+fmtShort(pr.fertA)+' – '+fmtShort(pr.fertB)+' · owulacja ok. '+fmtShort(pr.ovu)+(pr.pms?' · 🌙 PMS może się odzywać':'')+'</div>';
    h+='<div class="cy-tip">'+cyTip(pr.phase,pr.cycleDay)+'</div>';
    if(pr.openPeriod)h+='<button class="hero-today-btn" onclick="cyEndToday()">✅ Okres skończył się dziś</button>';
    else h+='<button class="hero-today-btn" onclick="cyStartToday()">🩸 Okres zaczął się dziś</button>';
  }
  h+='</div>';
  /* ustawienia */
  if(cyShowSettings)h+=cySettingsCard();
  /* kalendarz */
  if(!cyMonth)cyMonth=today.slice(0,7);
  h+=cyCalendar(cyMonth);
  h+='<div class="cy-legend"><span><i class="l-per"></i> okres</span><span><i class="l-pred"></i> przewidywany</span><span><i class="l-fert"></i> płodne</span><span>💜 owulacja</span><span><i class="l-mark"></i> wpis</span></div>';
  /* statystyki */
  const S=cyStats();
  h+='<div class="card"><h3>📊 Twoje cykle<span class="r">'+S.per.length+' zapisanych</span></h3>';
  if(S.per.length<2)h+='<div class="muted">Po dwóch zapisanych okresach policzę Twoją średnią długość cyklu. Na razie liczę wg ustawienia: '+S.avgCycle+' dni.</div>';
  else {
    h+='<div class="cy-stats"><div><b>'+S.avgCycle+'</b><span>śr. cykl (dni)</span></div><div><b>'+S.avgPeriod+'</b><span>śr. okres (dni)</span></div><div><b>'+(S.reg==null?'–':'±'+Math.ceil(S.reg/2))+'</b><span>'+(S.reg==null?'regularność':(S.reg<=3?'regularny 💚':(S.reg<=7?'dość regularny':'nieregularny')))+'</span></div></div>';
    const mx=Math.max(...S.last6,35);
    h+='<div class="cy-bars">'+S.last6.map(n=>'<div class="cy-bar" style="height:'+Math.round(n/mx*100)+'%"><span>'+n+'</span></div>').join('')+'</div><div class="muted" style="font-size:.72rem;text-align:center">długości ostatnich cykli</div>';
  }
  h+='</div>';
  h+='<div class="muted" style="font-size:.7rem;text-align:center;padding:0 10px 10px">Przewidywania liczone tylko z Twoich wpisów, lokalnie w telefonie. To orientacja — nie metoda antykoncepcji ani porada medyczna.</div>';
  $('#v-cykl').innerHTML=h;
}
function cyCalendar(ym){
  const [y,m]=ym.split('-').map(Number); const first=new Date(y,m-1,1); const days=new Date(y,m,0).getDate();
  const offset=(first.getDay()+6)%7; const today=todayStr();
  const NOM=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  let h='<div class="card cy-cal"><div class="cy-calnav"><button class="iconbtn" onclick="cyMonthShift(-1)">‹</button><b>'+NOM[m-1]+' '+y+'</b><button class="iconbtn" onclick="cyMonthShift(1)">›</button></div>';
  h+='<div class="cy-grid">'+['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d=>'<div class="cy-wd">'+d+'</div>').join('');
  for(let i=0;i<offset;i++)h+='<div></div>';
  for(let d=1;d<=days;d++){
    const ds=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'); const inf=cyDayInfo(ds);
    let cls='cy-d'; if(inf.period)cls+=' per'; else if(inf.pred)cls+=' pred'; if(inf.fertile&&!inf.period)cls+=' fert'; if(ds===today)cls+=' today';
    h+='<div class="'+cls+'" onclick="cyOpenDay(\''+ds+'\')"><span>'+d+'</span>'+(inf.ovu?'<i class="ov">💜</i>':'')+(inf.mark?'<i class="mk"></i>':'')+'</div>';
  }
  h+='</div></div>';
  return h;
}
function cyMonthShift(n){ const [y,m]=cyMonth.split('-').map(Number); const d=new Date(y,m-1+n,1); cyMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); renderCykl(); }
function cySettingsCard(){
  const P=cyData().prefs;
  let h='<div class="card"><h3>⚙️ Ustawienia cyklu</h3>';
  h+='<div class="frow"><label>Długość cyklu (gdy brak danych)</label><input type="number" min="15" max="60" value="'+P.cycleLen+'" onchange="cyPref(\'cycleLen\',Math.min(60,Math.max(15,+this.value||28)))"></div>';
  h+='<div class="frow"><label>Długość okresu (gdy brak danych)</label><input type="number" min="1" max="12" value="'+P.periodLen+'" onchange="cyPref(\'periodLen\',Math.min(12,Math.max(1,+this.value||5)))"></div>';
  h+='<div class="frow"><label>Przypomnij przed okresem</label><label class="switch"><input type="checkbox" '+(P.remindPeriod?'checked':'')+' onchange="cyPref(\'remindPeriod\',this.checked)"><span class="sl"></span></label></div>';
  h+='<div class="frow"><label>… ile dni wcześniej / o której</label><input type="number" min="0" max="7" value="'+P.leadDays+'" onchange="cyPref(\'leadDays\',Math.max(0,+this.value||0))"><input type="time" value="'+esc(P.remindTime)+'" onchange="cyPref(\'remindTime\',this.value||\'20:00\')"></div>';
  h+='<div class="frow"><label>Przypomnij o owulacji</label><label class="switch"><input type="checkbox" '+(P.remindOvu?'checked':'')+' onchange="cyPref(\'remindOvu\',this.checked)"><span class="sl"></span></label></div>';
  h+='<div class="frow"><label>Dyskretne powiadomienia (bez szczegółów)</label><label class="switch"><input type="checkbox" '+(P.discreet?'checked':'')+' onchange="cyPref(\'discreet\',this.checked)"><span class="sl"></span></label></div>';
  h+='<div class="frow"><label>PIN do panelu (4 cyfry)</label>'+(P.pin?'<button class="btn btn-ghost btn-sm" onclick="cySetPin(\'\')">🔓 usuń PIN</button>':'<input type="password" inputmode="numeric" maxlength="4" id="cy-newpin" placeholder="••••" style="width:80px;text-align:center"><button class="btn btn-ghost btn-sm" onclick="cySetPin($(\'#cy-newpin\').value)">🔒 ustaw</button>')+'</div>';
  h+='<div class="frow"><label>Ukryj panel cyklu (w Więcej znika kafelek)</label><label class="switch"><input type="checkbox" '+(P.hidden?'checked':'')+' onchange="cyHide(this.checked)"><span class="sl"></span></label></div>';
  h+='<div class="muted" style="font-size:.72rem">Ukryty panel włączysz z powrotem w Więcej → Dane. Kafelek na Dziś pokazuje dzień cyklu tylko, gdy nie ma PIN-u.</div></div>';
  return h;
}
function cyPref(k,v){ cyData().prefs[k]=v; saveSoft(); if(k==='cycleLen'||k==='periodLen')renderCykl(); }
function cySetPin(v){ v=(v||'').trim(); if(v&&!/^\d{4}$/.test(v)){toast('PIN to 4 cyfry');return;} cyData().prefs.pin=v; cyUnlocked=true; save(); renderCykl(); toast(v?'🔒 PIN ustawiony':'🔓 PIN usunięty'); }
function cyUnlock(){ const v=($('#cy-pin')||{value:''}).value; if(v===cyData().prefs.pin){ cyUnlocked=true; vibrate(10); renderCykl(); } else { toast('❌ Zły PIN'); vibrate([60,40,60]); const pi=$('#cy-pin'); if(pi){pi.value='';pi.focus();} } }
function cyHide(on){ cyData().prefs.hidden=on; save(); renderCykl(); renderWiecej(); renderDzis(); toast(on?'🙈 Panel ukryty':'🌸 Panel widoczny'); }
function cyLockOnHide(){ cyUnlocked=false; }

/* ---------- okresy ---------- */
function cyStartToday(){ cyStartAt(todayStr()); }
function cyStartAt(ds){
  const C=cyData(); if(C.periods.some(p=>p.start===ds)){toast('Ten dzień już jest początkiem okresu');return;}
  // zamknij otwarty poprzedni okres, jeśli wisi
  C.periods.forEach(p=>{ if(!p.end&&p.start<ds)p.end=addDays(p.start,Math.min(cyStats().avgPeriod,7)-1); });
  C.periods.push({id:uid('cy'),start:ds,end:null}); save(); renderCykl(); renderDzis(); vibrate(10); toast('🩸 Zapisano początek okresu');
}
function cyEndToday(){ cyEndAt(todayStr()); }
function cyEndAt(ds){
  const C=cyData(); const p=C.periods.filter(x=>x.start<=ds).sort((a,b)=>a.start<b.start?1:-1)[0];
  if(!p){toast('Najpierw zaznacz początek okresu');return;}
  p.end=ds; save(); renderCykl(); renderDzis(); toast('✅ Zapisano koniec okresu');
}
function cyDelPeriod(ds){ const C=cyData(); const before=C.periods.length; C.periods=C.periods.filter(p=>!(p.start<=ds&&(p.end||addDays(p.start,7))>=ds)); if(C.periods.length!==before){ save(); closeModal(); renderCykl(); renderDzis(); toast('Usunięto wpis okresu'); } }

/* ---------- modal dnia ---------- */
function cyOpenDay(ds){
  const C=cyData(); const d=C.days[ds]||{flow:0,sym:[],mood:'',note:''}; const inf=cyDayInfo(ds);
  let h='<h2>🌸 '+esc(fmtLong(ds))+'<button class="x" onclick="closeModal()">✕</button></h2>';
  if(inf.period)h+='<div class="badge b-warn" style="margin-bottom:10px">🩸 dzień okresu'+(inf.open?' (trwa)':'')+'</div>';
  else if(inf.pred)h+='<div class="badge b-line" style="margin-bottom:10px">przewidywany okres</div>';
  if(inf.ovu)h+='<div class="badge b-info" style="margin-bottom:10px">💜 przewidywana owulacja</div>';
  h+='<div class="sect-title" style="margin-top:4px">Krwawienie</div><div class="seg" id="cy-flow">'+['brak','lekkie','średnie','mocne'].map((l,i)=>'<button class="'+((d.flow||0)===i?'on':'')+'" onclick="cyDay(\''+ds+'\',\'flow\','+i+',this)">'+l+'</button>').join('')+'</div>';
  h+='<div class="sect-title">Samopoczucie</div><div class="cy-moods">'+CY_MOOD.map(m=>'<button class="'+(d.mood===m?'on':'')+'" onclick="cyDay(\''+ds+'\',\'mood\',\''+m+'\',this)">'+m+'</button>').join('')+'</div>';
  h+='<div class="sect-title">Objawy</div><div class="cy-syms">'+CY_SYM.map(s=>'<button class="'+((d.sym||[]).includes(s)?'on':'')+'" onclick="cySym(\''+ds+'\',\''+s+'\',this)">'+s+'</button>').join('')+'</div>';
  h+='<input type="text" value="'+esc(d.note||'')+'" placeholder="notatka…" style="margin-top:10px" onchange="cyDay(\''+ds+'\',\'note\',this.value)">';
  h+='<div class="sect-title">Okres</div><div style="display:flex;gap:8px;flex-wrap:wrap">';
  if(!inf.period)h+='<button class="btn btn-ghost btn-sm" onclick="cyStartAt(\''+ds+'\');closeModal()">🩸 Zaczął się tego dnia</button>';
  if(inf.period)h+='<button class="btn btn-ghost btn-sm" onclick="cyEndAt(\''+ds+'\');closeModal()">✅ Skończył się tego dnia</button><button class="btn btn-ghost btn-sm" onclick="cyDelPeriod(\''+ds+'\')">🗑 Usuń ten okres</button>';
  if(!inf.period&&ds<=todayStr())h+='<button class="btn btn-ghost btn-sm" onclick="cyEndAt(\''+ds+'\');closeModal()">Poprzedni okres skończył się tego dnia</button>';
  h+='</div><div class="muted" style="font-size:.72rem;margin-top:8px">zapisuje się samo</div>';
  openModal(h);
}
function cyDay(ds,k,v,btn){ const C=cyData(); C.days[ds]=C.days[ds]||{flow:0,sym:[],mood:'',note:''}; const d=C.days[ds];
  if(k==='mood'&&d.mood===v)v=''; d[k]=k==='note'?v.trim():v;
  if(btn){ const par=btn.parentElement; par.querySelectorAll('button').forEach(b=>b.classList.remove('on')); if(v!==''&&v!==0)btn.classList.add('on'); }
  // krwawienie dzień po końcu okresu = okres jeszcze trwa (przedłuż), bez zakładania nowego
  if(k==='flow'&&v>0&&!cyDayInfo(ds).period){ const prev=C.periods.filter(p=>p.start<=ds).sort((a,b)=>a.start<b.start?1:-1)[0]; if(prev&&prev.end&&dDiff(prev.end,ds)===1)prev.end=ds; }
  cyPruneDay(ds); saveSoft(); renderCykl(); renderDzis(); }
function cySym(ds,s,btn){ const C=cyData(); C.days[ds]=C.days[ds]||{flow:0,sym:[],mood:'',note:''}; const d=C.days[ds]; d.sym=d.sym||[]; const i=d.sym.indexOf(s); if(i>=0)d.sym.splice(i,1); else d.sym.push(s); btn.classList.toggle('on',i<0); cyPruneDay(ds); saveSoft(); renderCykl(); }
function cyPruneDay(ds){ const C=cyData(); const d=C.days[ds]; if(d&&!d.flow&&!(d.sym&&d.sym.length)&&!d.mood&&!d.note)delete C.days[ds]; }

document.head.insertAdjacentHTML('beforeend',`<style>
.sub-bar{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.05rem;margin:2px 0 12px}
.sub-bar span{flex:1}
.cy-hero .dname{font-size:1.25rem;font-weight:700}
.cy-hero .dsub{font-size:.85rem;opacity:.95}
.cy-big{font-size:1.15rem;font-weight:700;margin-top:10px;line-height:1.3}
.cy-sub{font-size:.8rem;opacity:.95;margin-top:6px;font-weight:600}
.cy-tip{background:rgba(255,255,255,.16);border-radius:12px;padding:9px 12px;font-size:.82rem;margin-top:10px;line-height:1.45}
.cy-hero .hero-today-btn{margin-top:10px}
.cy-pinin{font-size:1.6rem;letter-spacing:12px;text-align:center;width:150px;padding:8px}
.cy-cal{padding:10px 8px 12px}
.cy-calnav{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 4px}
.cy-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cy-wd{text-align:center;font-size:.68rem;font-weight:700;color:var(--tx2);padding:2px 0}
.cy-d{aspect-ratio:1;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;position:relative;cursor:pointer;background:var(--bg3)}
.cy-d.per{background:#e0457b;color:#fff}
.cy-d.pred{background:repeating-linear-gradient(45deg,#e0457b33 0 4px,transparent 4px 8px);border:1.5px dashed #e0457b88}
.cy-d.fert{background:#10b98133;border:1.5px solid #10b98166}
.cy-d.today{outline:2.5px solid var(--accent);outline-offset:-2px}
.cy-d .ov{position:absolute;top:-4px;right:-3px;font-size:11px;font-style:normal}
.cy-d .mk{position:absolute;bottom:4px;width:5px;height:5px;border-radius:50%;background:var(--accent)}
.cy-d.per .mk{background:#fff}
.cy-legend{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font-size:.7rem;color:var(--tx2);font-weight:600;margin:-4px 0 12px}
.cy-legend i{display:inline-block;width:12px;height:12px;border-radius:4px;vertical-align:-2px;margin-right:3px}
.cy-legend .l-per{background:#e0457b}.cy-legend .l-pred{border:1.5px dashed #e0457b}.cy-legend .l-fert{background:#10b98155}.cy-legend .l-mark{background:var(--accent);border-radius:50%;width:7px;height:7px}
.cy-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.cy-stats div{background:var(--bg3);border-radius:12px;padding:10px 6px;text-align:center}
.cy-stats b{display:block;font-size:1.3rem}
.cy-stats span{font-size:.7rem;color:var(--tx2);font-weight:600}
.cy-bars{display:flex;align-items:flex-end;gap:8px;height:70px;padding:0 10px;margin-bottom:4px}
.cy-bar{flex:1;background:linear-gradient(180deg,var(--accent),var(--accent2));border-radius:6px 6px 2px 2px;position:relative;min-height:6px}
.cy-bar span{position:absolute;top:-16px;left:0;right:0;text-align:center;font-size:.68rem;font-weight:700;color:var(--tx2)}
.cy-moods{display:flex;gap:6px;flex-wrap:wrap}
.cy-moods button{background:var(--bg3);border:2px solid transparent;border-radius:10px;font-size:1.3rem;padding:4px 8px}
.cy-moods button.on{border-color:var(--accent)}
.cy-syms{display:flex;gap:6px;flex-wrap:wrap}
.cy-syms button{background:var(--bg3);border:1.5px solid transparent;color:var(--tx2);border-radius:999px;padding:6px 11px;font-size:.78rem;font-weight:600}
.cy-syms button.on{border-color:var(--accent);color:var(--accent);background:var(--bg2)}
</style>`);
