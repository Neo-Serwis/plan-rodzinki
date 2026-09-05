/* =====================================================================
   📚 LEKCJE — plan lekcji dzieci (wspólne dzwonki szkoły), sprawdziany,
   kartkówki i „sprawy" (przynieść strój, wycieczka…), karta „co mają dziś" na Dziś,
   przypomnienie wieczorem dzień wcześniej, przepisanie końca lekcji do planu odbioru.
   ===================================================================== */
'use strict';

const LK_SUBJ=['Matematyka','J. polski','J. angielski','J. niemiecki','Przyroda','Biologia','Geografia','Historia','Fizyka','Chemia','Informatyka','Technika','Plastyka','Muzyka','WF','Religia','Etyka','Godz. wychowawcza','Edukacja wczesnoszkolna','Świetlica','Basen','WDŻ','Koło zainteresowań'];
const LK_ABBR={'matematyka':'Mat','j. polski':'Pol','j. angielski':'Ang','j. niemiecki':'Niem','przyroda':'Przyr','biologia':'Bio','geografia':'Geo','historia':'Hist','fizyka':'Fiz','chemia':'Chem','informatyka':'Inf','technika':'Tech','plastyka':'Plast','muzyka':'Muz','wf':'WF','religia':'Rel','etyka':'Et','godz. wychowawcza':'GW','edukacja wczesnoszkolna':'Eduk','świetlica':'Świet','basen':'Basen'};
const LK_TYPES={
  sprawdzian:{em:'📝',name:'Sprawdzian'},
  kartkowka:{em:'✏️',name:'Kartkówka'},
  zadanie:{em:'📚',name:'Praca domowa / projekt'},
  przyniesc:{em:'🎒',name:'Przynieść / zabrać'},
  wycieczka:{em:'🚌',name:'Wycieczka / wyjście'},
  inne:{em:'📌',name:'Inne'},
};
const LK_PAL=['#3b82f6','#ec4899','#10b981','#f59e0b','#8b5cf6','#14b8a6','#ef4444','#f97316','#06b6d4','#84cc16','#a855f7','#e11d48'];
let lkKid=null, lkEdit=false, lkShowBells=false, lkShowPast=false;

function lkData(){
  if(!data.school)data.school={};
  const S=data.school;
  if(!Array.isArray(S.bells)||!S.bells.length)S.bells=[['08:00','08:45'],['08:55','09:40'],['09:50','10:35'],['10:45','11:30'],['11:50','12:35'],['12:45','13:30'],['13:40','14:25'],['14:35','15:20']].map(b=>({start:b[0],end:b[1]}));
  S.tt=S.tt||{}; S.events=S.events||[];
  S.prefs=Object.assign({remind:true,remindTime:'19:00'},S.prefs||{});
  return S;
}
function lkKids(){ return data.people.filter(p=>p.role!=='opiekun'); }
function lkTT(pid){ const S=lkData(); S.tt[pid]=S.tt[pid]||{}; return S.tt[pid]; }
function lkLessons(pid,dow){
  const t=lkTT(pid)[dow]||[], S=lkData(), out=[];
  t.forEach((s,i)=>{ if(s&&String(s).trim()){ const b=S.bells[i]||{start:'',end:''}; out.push({n:i+1,subj:String(s).trim(),start:b.start,end:b.end}); } });
  return out;
}
function lkColor(subj){ let h=0; for(const c of subj.toLowerCase())h=(h*31+c.charCodeAt(0))>>>0; return LK_PAL[h%LK_PAL.length]; }
function lkShort(s){ const k=s.toLowerCase().trim(); return LK_ABBR[k]||(s.length>6?s.slice(0,5)+'.':s); }
function lkEv(){ return lkData().events; }
function lkEventsOn(ds){ return lkEv().filter(e=>e.date===ds).sort((a,b)=>(a.personId>b.personId?1:-1)); }
function lkUpcoming(days){ const t=todayStr(), end=addDays(t,days); return lkEv().filter(e=>e.date>=t&&e.date<=end).sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0)); }
function lkT(e){ return LK_TYPES[e.type]||LK_TYPES.inne; }

/* ---------- integracja z rdzeniem ---------- */
function lkReminders(ds){
  const S=lkData(); if(!S.prefs.remind)return [];
  const tomorrow=addDays(ds,1); const evs=lkEv().filter(e=>e.date===tomorrow&&!e.done); if(!evs.length)return [];
  const at=toMin(S.prefs.remindTime||'19:00');
  return evs.map(e=>{ const p=person(e.personId), T=lkT(e); return {at,key:'lk_'+e.id+'@'+at,title:T.em+' Jutro'+(p?' '+p.name:'')+': '+T.name.toLowerCase()+(e.subj?' — '+e.subj:''),body:e.title||e.note||'sprawdź, czy wszystko spakowane'}; });
}
function lkDaySummary(ds){ return lkEventsOn(ds).map(e=>{ const p=person(e.personId), T=lkT(e); return T.em+' '+(p?esc(p.name)+': ':'')+esc(T.name.toLowerCase())+(e.subj?' '+esc(e.subj):'')+(e.title?' — '+esc(e.title):''); }); }
function lkEvLine(e,withKid){
  const T=lkT(e), p=withKid?person(e.personId):null;
  return '<div class="lk-ev'+(e.done?' done':'')+'" onclick="event.stopPropagation();lkEvModal(\''+e.id+'\')">'+T.em+' '+(p?'<span class="dot" style="background:'+p.color+'"></span> <b>'+esc(p.name)+'</b>: ':'')+'<b>'+esc(T.name)+'</b>'+(e.subj?' — '+esc(e.subj):'')+(e.title?': '+esc(e.title):'')+'</div>';
}
function lkDzisCard(ds){
  const dow=isoDow(pdate(ds)); let rows='';
  for(const k of lkKids()){
    const L=lkLessons(k.id,dow), ev=lkEventsOn(ds).filter(e=>e.personId===k.id);
    if(!L.length&&!ev.length)continue;
    rows+='<div class="lk-row"><div class="lk-kid">'+chipS(k)+(L.length?' <span class="muted">'+L.length+' lekcji · do '+esc(L[L.length-1].end)+'</span>':'')+'</div>'+
      (L.length?'<div class="lk-chips">'+L.map(l=>'<span class="lk-chip" style="background:'+lkColor(l.subj)+'22;color:'+lkColor(l.subj)+'">'+l.n+'. '+esc(lkShort(l.subj))+'</span>').join('')+'</div>':'')+
      ev.map(e=>lkEvLine(e,false)).join('')+'</div>';
  }
  const evT=lkEventsOn(addDays(ds,1)).filter(e=>!e.done);
  if(evT.length)rows+='<div class="lk-tom">⏭ Jutro: '+evT.map(e=>{ const p=person(e.personId); return lkT(e).em+' '+(p?esc(p.name)+' — ':'')+esc(e.subj||e.title||lkT(e).name.toLowerCase()); }).join(' · ')+'</div>';
  if(!rows)return '';
  return '<div class="card lk-card" onclick="showView(\'lekcje\')"><h3>📚 Lekcje'+(ds===todayStr()?' dziś':'')+'<span class="r">otwórz ›</span></h3>'+rows+'</div>';
}

/* ---------- widok ---------- */
function renderLekcje(){ keepScroll('lekcje',_renderLekcje); }
function _renderLekcje(){
  const S=lkData(), kids=lkKids();
  if(!kids.some(k=>k.id===lkKid))lkKid=kids.length?kids[0].id:null;
  let h='<div class="sub-bar"><button class="iconbtn" onclick="showView(\'wiecej\')">←</button><span>📚 Lekcje dzieci</span><button class="iconbtn" title="dzwonki" onclick="lkShowBells=!lkShowBells;renderLekcje()">🔔</button></div>';
  if(!kids.length){ h+='<div class="card"><div class="empty"><div class="big">📚</div>Najpierw dodaj dzieci w Planie lekcji (Więcej → Plan).</div></div>'; $('#v-lekcje').innerHTML=h; return; }
  /* dzwonki */
  if(lkShowBells){
    h+='<div class="card"><h3>🔔 Dzwonki (wspólne dla szkoły)</h3>';
    S.bells.forEach((b,i)=>{ h+='<div class="frow"><label>'+(i+1)+'. lekcja</label><input type="time" value="'+esc(b.start)+'" onchange="lkBell('+i+',\'start\',this.value)"><span class="muted">–</span><input type="time" value="'+esc(b.end)+'" onchange="lkBell('+i+',\'end\',this.value)"></div>'; });
    h+='<div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="lkBellAdd()">＋ lekcja</button>'+(S.bells.length>1?'<button class="btn btn-ghost btn-sm" onclick="lkBellDel()">− ostatnia</button>':'')+'</div></div>';
  }
  /* wybór dziecka + tryb */
  h+='<div class="zk-lists">'+kids.map(k=>'<button class="zk-chip'+(k.id===lkKid?' on':'')+'" style="'+(k.id===lkKid?'border-color:'+k.color+';color:'+k.color:'')+'" onclick="lkKid=\''+k.id+'\';renderLekcje()">'+esc(k.emoji)+' '+esc(k.name)+'</button>').join('')+
     '<button class="zk-chip'+(lkEdit?' on':'')+'" onclick="lkEdit=!lkEdit;renderLekcje()">'+(lkEdit?'✔ Gotowe':'✏️ Edytuj')+'</button></div>';
  /* siatka tygodnia */
  const kid=person(lkKid); const tt=lkTT(lkKid); const rows=S.bells.length;
  h+='<div class="card lk-gridcard"><div class="lk-grid'+(lkEdit?' edit':'')+'"><div class="lk-h"></div>'+[1,2,3,4,5].map(d=>'<div class="lk-h">'+DAYS_S[d]+'</div>').join('');
  for(let i=0;i<rows;i++){
    const b=S.bells[i];
    h+='<div class="lk-n"><b>'+(i+1)+'</b><small>'+esc(b.start)+'</small></div>';
    for(let d=1;d<=5;d++){
      const v=(tt[d]||[])[i]||'';
      if(lkEdit)h+='<div class="lk-c"><input type="text" list="lk-subj" value="'+esc(v)+'" placeholder="–" onchange="lkSet(\''+lkKid+'\','+d+','+i+',this.value)"></div>';
      else h+='<div class="lk-c">'+(v?'<span class="lk-cell" style="background:'+lkColor(v)+'22;color:'+lkColor(v)+'" title="'+esc(v)+'">'+esc(lkShort(v))+'</span>':'<span class="lk-empty">·</span>')+'</div>';
    }
  }
  h+='</div>';
  if(lkEdit){
    h+='<datalist id="lk-subj">'+LK_SUBJ.map(s=>'<option value="'+esc(s)+'">').join('')+'</datalist>';
    h+='<div class="muted" style="font-size:.75rem;margin-top:8px">Wpisz przedmiot w kratkę (podpowiada nazwy). Puste = brak lekcji.</div>';
    h+='<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="lkSyncEnds(\''+lkKid+'\')">⏱ Przepisz końce lekcji '+esc(kid.name)+' do planu odbioru</button>';
  } else {
    const ends=[1,2,3,4,5].map(d=>{ const L=lkLessons(lkKid,d); return L.length?DAYS_S[d]+' do '+L[L.length-1].end:null; }).filter(Boolean);
    if(ends.length)h+='<div class="muted" style="font-size:.76rem;margin-top:8px">Koniec lekcji wg planu: '+ends.join(' · ')+'</div>';
    else h+='<div class="muted" style="font-size:.76rem;margin-top:8px">Plan '+esc(kid.name)+' jest pusty — kliknij „✏️ Edytuj" i wpisz przedmioty.</div>';
  }
  h+='</div>';
  /* sprawdziany i sprawy */
  const up=lkUpcoming(60);
  h+='<div class="sect-title">📝 Sprawdziany, kartkówki i sprawy</div>';
  h+='<button class="btn btn-acc" style="margin-bottom:10px" onclick="lkEvModal(null)">➕ Dodaj (sprawdzian, kartkówka, przynieść…)</button>';
  h+='<div class="card">';
  if(!up.length)h+='<div class="muted">Nic w najbliższych 60 dniach. Dodaj sprawdzian, a wieczorem dzień wcześniej apka przypomni.</div>';
  let lastDate=null;
  for(const e of up){
    if(e.date!==lastDate){ lastDate=e.date; const dd=dDiff(todayStr(),e.date); h+='<div class="lk-date">'+esc(fmtLong(e.date))+' <span class="muted">· '+(dd===0?'dziś':(dd===1?'jutro':'za '+dd+' dni'))+'</span></div>'; }
    h+=lkEvLine(e,true);
  }
  const past=lkEv().filter(e=>e.date<todayStr()).sort((a,b)=>a.date<b.date?1:-1);
  if(past.length){ h+='<div class="zk-cat zk-donehead" onclick="lkShowPast=!lkShowPast;renderLekcje()">wcześniejsze <span class="muted">'+past.length+'</span><span class="r">'+(lkShowPast?'ukryj':'pokaż')+'</span></div>'; if(lkShowPast)for(const e of past.slice(0,30))h+='<div class="muted" style="font-size:.78rem">'+esc(fmtShort(e.date))+' '+lkEvLine(e,true)+'</div>'; }
  h+='</div>';
  h+='<div class="card"><div class="frow"><label>🔔 Przypomnienie dzień wcześniej</label><label class="switch"><input type="checkbox" '+(S.prefs.remind?'checked':'')+' onchange="lkData().prefs.remind=this.checked;saveSoft()"><span class="sl"></span></label></div><div class="frow"><label>… o godzinie</label><input type="time" value="'+esc(S.prefs.remindTime)+'" onchange="lkData().prefs.remindTime=this.value||\'19:00\';saveSoft()"></div></div>';
  $('#v-lekcje').innerHTML=h;
}
function lkSet(pid,d,i,v){ const tt=lkTT(pid); tt[d]=tt[d]||[]; while(tt[d].length<=i)tt[d].push(''); tt[d][i]=v.trim(); while(tt[d].length&&!tt[d][tt[d].length-1])tt[d].pop(); saveSoft(); }
function lkBell(i,k,v){ const S=lkData(); if(v)S.bells[i][k]=v; saveSoft(); renderLekcje(); }
function lkBellAdd(){ const S=lkData(); const last=S.bells[S.bells.length-1]; const st=toMin(last.end)+10, en=st+45; S.bells.push({start:toHM(st),end:toHM(en)}); save(); renderLekcje(); }
function lkBellDel(){ const S=lkData(); if(S.bells.length>1)S.bells.pop(); save(); renderLekcje(); }
function lkSyncEnds(pid){
  const p=person(pid); let n=0; p.ends=p.ends||{};
  for(let d=1;d<=5;d++){ const L=lkLessons(pid,d); if(L.length&&L[L.length-1].end){ p.ends[d]=L[L.length-1].end; n++; } }
  save(); renderAll(); toast(n?'⏱ Przepisano '+n+' dni do planu odbioru '+p.name:'Plan lekcji jest pusty');
}
/* ---------- modal sprawy ---------- */
function lkEvModal(id){
  const kids=lkKids(); const e=id?lkEv().find(x=>x.id===id):{id:null,personId:lkKid||(kids[0]||{}).id,date:todayStr(),type:'sprawdzian',subj:'',title:'',note:'',done:false};
  if(!e)return;
  const subjs=[...new Set([...LK_SUBJ,...[1,2,3,4,5].flatMap(d=>lkLessons(e.personId,d).map(l=>l.subj))])];
  let h='<h2>'+(id?'✏️ Sprawa':'➕ Nowa sprawa')+'<button class="x" onclick="closeModal()">✕</button></h2>';
  h+='<div class="frow"><label>Kto</label><select id="le-kid">'+kids.map(k=>'<option value="'+k.id+'" '+(k.id===e.personId?'selected':'')+'>'+esc(k.emoji+' '+k.name)+'</option>').join('')+'</select></div>';
  h+='<div class="frow"><label>Kiedy</label><input type="date" id="le-date" value="'+esc(e.date)+'"></div>';
  h+='<div class="lk-types" id="le-type">'+Object.entries(LK_TYPES).map(([k,T])=>'<button class="'+(k===e.type?'on':'')+'" data-t="'+k+'" onclick="$$(\'#le-type button\').forEach(b=>b.classList.remove(\'on\'));this.classList.add(\'on\')">'+T.em+' '+esc(T.name)+'</button>').join('')+'</div>';
  h+='<input type="text" id="le-subj" list="le-subjlist" value="'+esc(e.subj||'')+'" placeholder="Przedmiot (np. Matematyka)" style="margin-bottom:8px"><datalist id="le-subjlist">'+subjs.map(s=>'<option value="'+esc(s)+'">').join('')+'</datalist>';
  h+='<input type="text" id="le-title" value="'+esc(e.title||'')+'" placeholder="Z czego / co (np. ułamki, dział 3, strój na WF)" style="margin-bottom:8px">';
  h+='<input type="text" id="le-note" value="'+esc(e.note||'')+'" placeholder="notatka" style="margin-bottom:8px">';
  if(id)h+='<div class="frow"><label>✔ Załatwione / zaliczone</label><label class="switch"><input type="checkbox" id="le-done" '+(e.done?'checked':'')+'><span class="sl"></span></label></div>';
  h+='<button class="btn btn-acc" style="margin-top:6px" onclick="lkEvSave('+(id?'\''+id+'\'':'null')+')">💾 Zapisz</button>';
  if(id)h+='<button class="btn btn-danger" style="margin-top:8px" onclick="lkEvDel(\''+id+'\')">🗑 Usuń</button>';
  openModal(h);
}
function lkEvSave(id){
  if(_modalClosing)return;
  const date=$('#le-date').value; if(!date){toast('Podaj datę');return;}
  const o={personId:$('#le-kid').value,date,type:($('#le-type .on')||{dataset:{t:'inne'}}).dataset.t,subj:$('#le-subj').value.trim(),title:$('#le-title').value.trim(),note:$('#le-note').value.trim(),done:id?$('#le-done').checked:false};
  if(!o.subj&&!o.title){toast('Wpisz przedmiot albo co to za sprawa');return;}
  if(id)Object.assign(lkEv().find(x=>x.id===id),o); else lkEv().push(Object.assign({id:uid('le')},o));
  save(); closeModal(); renderAll(); toast('✓ zapisano');
}
function lkEvDel(id){ if(_modalClosing)return; const S=lkData(); const e=S.events.find(x=>x.id===id); S.events=S.events.filter(x=>x.id!==id); save(); closeModal(); renderAll(); toastAction('🗑 Usunięto','Cofnij',()=>{ S.events.push(e); save(); renderAll(); }); }

document.head.insertAdjacentHTML('beforeend',`<style>
.lk-card{cursor:pointer}
.lk-row{padding:6px 0;border-bottom:1px dashed var(--line)}
.lk-row:last-of-type{border-bottom:none}
.lk-kid{font-size:.85rem;margin-bottom:4px}
.lk-chips{display:flex;flex-wrap:wrap;gap:4px}
.lk-chip{font-size:.72rem;font-weight:700;border-radius:7px;padding:2px 7px}
.lk-ev{font-size:.8rem;margin-top:4px;padding:5px 8px;background:var(--warn-bg);color:var(--warn);border-radius:8px;cursor:pointer;line-height:1.4}
.lk-ev.done{opacity:.5;text-decoration:line-through;background:var(--bg3);color:var(--tx2)}
.lk-tom{font-size:.78rem;color:var(--tx2);margin-top:8px;font-weight:600}
.lk-gridcard{padding:10px 8px 12px}
.lk-grid{display:grid;grid-template-columns:40px repeat(5,1fr);gap:3px}
.lk-h{text-align:center;font-size:.7rem;font-weight:700;color:var(--tx2);padding:2px 0}
.lk-n{text-align:center;font-size:.72rem;line-height:1.1;padding-top:4px}
.lk-n small{display:block;color:var(--tx2);font-size:.6rem}
.lk-c{min-height:34px;display:flex;align-items:center;justify-content:center}
.lk-cell{font-size:.7rem;font-weight:700;border-radius:8px;padding:6px 2px;width:100%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lk-empty{color:var(--line)}
.lk-grid.edit .lk-c input{width:100%;padding:6px 3px;font-size:.68rem;text-align:center;border-radius:8px}
.lk-date{font-weight:700;font-size:.85rem;margin:10px 0 2px}
.lk-date:first-child{margin-top:0}
.lk-types{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
.lk-types button{background:var(--bg3);border:2px solid transparent;border-radius:10px;padding:8px 6px;font-size:.78rem;font-weight:700;color:var(--tx2);text-align:left}
.lk-types button.on{border-color:var(--accent);color:var(--accent)}
</style>`);
