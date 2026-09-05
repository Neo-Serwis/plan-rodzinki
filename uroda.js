/* =====================================================================
   💅 URODA — paznokcie, fryzjer, kosmetyczka, brwi… wizyty z odliczaniem,
   historia, podpowiedź „pora umówić" (na podstawie Twojego rytmu), przypomnienia.
   ===================================================================== */
'use strict';

const UR_TYPES={
  paznokcie:{em:'💅',name:'Paznokcie',every:21},
  fryzjer:{em:'💇‍♀️',name:'Fryzjer',every:42},
  kosmetyczka:{em:'🧖‍♀️',name:'Kosmetyczka',every:30},
  brwi:{em:'👁️',name:'Brwi / rzęsy',every:21},
  masaz:{em:'💆‍♀️',name:'Masaż',every:30},
  depilacja:{em:'✨',name:'Depilacja',every:28},
  lekarz:{em:'🩺',name:'Lekarz / dentysta',every:0},
  inne:{em:'🌷',name:'Inne',every:0},
};
let urShowHist=false, urShowEvery=false;

function urData(){ if(!data.beauty)data.beauty={}; const B=data.beauty; B.items=B.items||[]; B.every=B.every||{}; B.prefs=Object.assign({dayBefore:true,dayBeforeTime:'19:00'},B.prefs||{}); return B; }
function urT(it){ return UR_TYPES[it.type]||UR_TYPES.inne; }
function urTitle(it){ return it.title||urT(it).name; }
function urSort(a,b){ return (a.date+(a.time||''))<(b.date+(b.time||''))?-1:1; }
function urOn(ds){ return urData().items.filter(i=>i.date===ds).sort(urSort); }
function urUpcoming(){ const t=todayStr(); return urData().items.filter(i=>i.date>=t).sort(urSort); }
function urPast(){ const t=todayStr(); return urData().items.filter(i=>i.date<t).sort((a,b)=>-urSort(a,b)); }
function urEvery(type){ const B=urData(); const v=B.every[type]; return (v==null||v==='')?(UR_TYPES[type]||{}).every||0:+v; }
function urLast(type){ return urPast().find(i=>i.type===type)||null; }
function urSuggest(){
  const out=[], t=todayStr(), up=urUpcoming();
  for(const type in UR_TYPES){ const every=urEvery(type); if(!every)continue; const last=urLast(type); if(!last)continue; if(up.some(i=>i.type===type))continue;
    const days=dDiff(last.date,t); if(days>=every-3)out.push({type,days,every,last}); }
  return out;
}
function urCountdown(it){ const d=dDiff(todayStr(),it.date); return d===0?'dziś':(d===1?'jutro':'za '+d+' dni'); }

/* ---------- integracja z rdzeniem ---------- */
function urTimelineItems(ds){ return urOn(ds).map(it=>({t:toMin(it.time||'12:00'),ico:urT(it).em,hot:true,title:esc(urTitle(it)),sub:[it.place?'📍 '+esc(it.place):'',it.note?esc(it.note):''].filter(Boolean).join(' · ')})); }
function urEvents(ds){ return urOn(ds).map(it=>({t:toMin(it.time||'12:00'),big:urT(it).em+' '+urTitle(it),sub:it.place||''})); }
function urDaySummary(ds){ return urOn(ds).map(it=>urT(it).em+' <b>'+esc(it.time||'')+'</b> '+esc(urTitle(it))+(it.place?' · '+esc(it.place):'')); }
function urReminders(ds){
  const B=urData(), out=[];
  for(const it of urOn(ds)){ const t=toMin(it.time||'12:00'); const lead=(it.remindMin==null||it.remindMin==='')?120:+it.remindMin; if(lead>0)out.push({at:t-lead,key:'ur_'+it.id+'@'+t,title:urT(it).em+' '+urTitle(it)+' o '+(it.time||'')+' — za '+durTxt(lead),body:it.place||''}); }
  if(B.prefs.dayBefore){ for(const it of urOn(addDays(ds,1))){ if(it.dayBefore===false)continue; out.push({at:toMin(B.prefs.dayBeforeTime||'19:00'),key:'ur_'+it.id+'@tom',title:urT(it).em+' Jutro: '+urTitle(it)+(it.time?' o '+it.time:''),body:it.place||''}); } }
  return out;
}

/* ---------- widok ---------- */
function renderUroda(){ keepScroll('uroda',_renderUroda); }
function _renderUroda(){
  const B=urData(), up=urUpcoming(), past=urPast(), sug=urSuggest();
  let h='<div class="sub-bar"><button class="iconbtn" onclick="showView(\'wiecej\')">←</button><span>💅 Uroda i wizyty</span><button class="iconbtn" title="co ile dni" onclick="urShowEvery=!urShowEvery;renderUroda()">⚙️</button></div>';
  if(sug.length){
    h+='<div class="card ur-sug"><h3>💡 Pora umówić?</h3>'+sug.map(s=>'<div class="ur-sugrow"><span>'+UR_TYPES[s.type].em+' <b>'+esc(UR_TYPES[s.type].name)+'</b> — ostatnio '+s.days+' dni temu (zwykle co '+s.every+')</span><button class="btn btn-ghost btn-sm" onclick="urModal(null,\''+s.type+'\')">＋ umów</button></div>').join('')+'</div>';
  }
  if(urShowEvery){
    h+='<div class="card"><h3>⚙️ Co ile dni zwykle (do podpowiedzi)</h3>'+Object.entries(UR_TYPES).map(([k,T])=>'<div class="frow"><label>'+T.em+' '+esc(T.name)+'</label><input type="number" min="0" max="365" value="'+urEvery(k)+'" placeholder="0" onchange="urData().every[\''+k+'\']=Math.max(0,+this.value||0);saveSoft();renderUroda()"></div>').join('')+
       '<div class="muted" style="font-size:.72rem">0 = bez podpowiedzi. Podpowiedź pojawia się 3 dni przed „terminem", jeśli nic nie jest umówione.</div>'+
       '<div class="frow" style="margin-top:8px"><label>🔔 Przypomnienie dzień wcześniej</label><label class="switch"><input type="checkbox" '+(B.prefs.dayBefore?'checked':'')+' onchange="urData().prefs.dayBefore=this.checked;saveSoft()"><span class="sl"></span></label></div><div class="frow"><label>… o godzinie</label><input type="time" value="'+esc(B.prefs.dayBeforeTime)+'" onchange="urData().prefs.dayBeforeTime=this.value||\'19:00\';saveSoft()"></div></div>';
  }
  h+='<button class="btn btn-acc" style="margin-bottom:10px" onclick="urModal(null,null)">➕ Umów wizytę</button>';
  h+='<div class="card"><h3>📅 Najbliższe<span class="r">'+up.length+'</span></h3>';
  if(!up.length)h+='<div class="muted">Nic umówionego. Dodaj paznokcie, fryzjera, kosmetyczkę… — apka przypomni i policzy, kiedy znów pora.</div>';
  for(const it of up){ h+='<div class="li" onclick="urModal(\''+it.id+'\')" style="cursor:pointer"><div class="li-em" style="background:var(--bg3)">'+urT(it).em+'</div><div class="li-tx"><div class="li-t">'+esc(urTitle(it))+' <span class="badge b-info">'+urCountdown(it)+'</span></div><div class="li-s">'+esc(fmtLong(it.date))+(it.time?' · '+esc(it.time):'')+(it.place?' · '+esc(it.place):'')+'</div></div><span class="muted">›</span></div>'; }
  h+='</div>';
  /* rytm */
  const rhythm=Object.keys(UR_TYPES).map(k=>({k,last:urLast(k)})).filter(x=>x.last);
  if(rhythm.length){ h+='<div class="card"><h3>🗓️ Twój rytm</h3>'+rhythm.map(x=>{ const d=dDiff(x.last.date,todayStr()); const ev=urEvery(x.k); return '<div class="ur-rh"><span>'+UR_TYPES[x.k].em+' '+esc(UR_TYPES[x.k].name)+'</span><span class="muted">ostatnio '+esc(fmtShort(x.last.date))+' · '+d+' dni temu'+(ev?' · zwykle co '+ev:'')+'</span></div>'; }).join('')+'</div>'; }
  if(past.length){ h+='<div class="card"><div class="zk-cat zk-donehead" style="margin-top:0;border-top:none;padding-top:0" onclick="urShowHist=!urShowHist;renderUroda()">📖 Historia <span class="muted">'+past.length+'</span><span class="r">'+(urShowHist?'ukryj':'pokaż')+'</span></div>'; if(urShowHist)for(const it of past.slice(0,40))h+='<div class="li" onclick="urModal(\''+it.id+'\')" style="cursor:pointer;padding:7px 0"><div class="li-tx"><div class="li-t" style="font-size:.85rem">'+urT(it).em+' '+esc(urTitle(it))+'</div><div class="li-s">'+esc(fmtShort(it.date))+(it.place?' · '+esc(it.place):'')+(it.note?' · '+esc(it.note):'')+'</div></div></div>'; h+='</div>'; }
  $('#v-uroda').innerHTML=h;
}
function urModal(id,type){
  const it=id?urData().items.find(x=>x.id===id):{id:null,type:type||'paznokcie',title:'',date:todayStr(),time:'',place:'',note:'',remindMin:120,dayBefore:true};
  if(!it)return;
  const lastSame=urLast(it.type);
  let h='<h2>'+(id?'✏️ Wizyta':'➕ Umów wizytę')+'<button class="x" onclick="closeModal()">✕</button></h2>';
  h+='<div class="lk-types" id="ur-type">'+Object.entries(UR_TYPES).map(([k,T])=>'<button class="'+(k===it.type?'on':'')+'" data-t="'+k+'" onclick="$$(\'#ur-type button\').forEach(b=>b.classList.remove(\'on\'));this.classList.add(\'on\')">'+T.em+' '+esc(T.name)+'</button>').join('')+'</div>';
  h+='<input type="text" id="ur-title" value="'+esc(it.title||'')+'" placeholder="Nazwa (opcjonalnie, np. hybryda u Kasi)" style="margin-bottom:8px">';
  h+='<div class="frow"><label>Kiedy</label><input type="date" id="ur-date" value="'+esc(it.date)+'"><input type="time" id="ur-time" value="'+esc(it.time||'')+'"></div>';
  const places=[...new Set(urData().items.map(i=>i.place).filter(Boolean))];
  h+='<input type="text" id="ur-place" list="ur-places" value="'+esc(it.place||(!id&&lastSame?lastSame.place||'':''))+'" placeholder="Gdzie (salon, adres)" style="margin-bottom:8px"><datalist id="ur-places">'+places.map(p=>'<option value="'+esc(p)+'">').join('')+'</datalist>';
  h+='<input type="text" id="ur-note" value="'+esc(it.note||'')+'" placeholder="notatka (kolor, cena, co zabrać…)" style="margin-bottom:8px">';
  h+='<div class="frow"><label>Przypomnij (min przed; 0 = nie)</label><input type="number" id="ur-rem" min="0" max="1440" value="'+(it.remindMin==null?120:it.remindMin)+'"></div>';
  h+='<div class="frow"><label>Przypomnij też dzień wcześniej</label><label class="switch"><input type="checkbox" id="ur-db" '+(it.dayBefore!==false?'checked':'')+'><span class="sl"></span></label></div>';
  h+='<button class="btn btn-acc" style="margin-top:6px" onclick="urSave('+(id?'\''+id+'\'':'null')+')">💾 Zapisz</button>';
  if(id)h+='<button class="btn btn-danger" style="margin-top:8px" onclick="urDel(\''+id+'\')">🗑 Usuń</button>';
  openModal(h);
}
function urSave(id){
  if(_modalClosing)return;
  const date=$('#ur-date').value; if(!date){toast('Podaj datę');return;}
  const o={type:($('#ur-type .on')||{dataset:{t:'inne'}}).dataset.t,title:$('#ur-title').value.trim(),date,time:$('#ur-time').value,place:$('#ur-place').value.trim(),note:$('#ur-note').value.trim(),remindMin:Math.max(0,+$('#ur-rem').value||0),dayBefore:$('#ur-db').checked};
  const B=urData();
  if(id)Object.assign(B.items.find(x=>x.id===id),o); else B.items.push(Object.assign({id:uid('ur')},o));
  save(); closeModal(); renderAll(); toast('✓ zapisano');
}
function urDel(id){ if(_modalClosing)return; const B=urData(); const it=B.items.find(x=>x.id===id); B.items=B.items.filter(x=>x.id!==id); save(); closeModal(); renderAll(); toastAction('🗑 Usunięto','Cofnij',()=>{ B.items.push(it); save(); renderAll(); }); }

document.head.insertAdjacentHTML('beforeend',`<style>
.ur-sug{border-color:var(--accent)}
.ur-sugrow{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.84rem;padding:6px 0}
.ur-rh{display:flex;justify-content:space-between;gap:8px;font-size:.82rem;padding:5px 0;border-bottom:1px dashed var(--line);flex-wrap:wrap}
.ur-rh:last-child{border-bottom:none}
.ur-rh .muted{font-size:.74rem}
</style>`);
