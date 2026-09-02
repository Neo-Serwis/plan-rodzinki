/* =====================================================================
   📝 NOTATKI — do pierdół, ale ze smakiem: kolorowe karty, przypinanie,
   listy z checkboxami, szukajka, autosave, cofanie usunięcia, udostępnianie
   ===================================================================== */
'use strict';

const NT_COLORS=[
  {id:'none',  name:'Papier',   c:null},
  {id:'roz',   name:'Róż',      c:'#ec4899'},
  {id:'brzosk',name:'Brzoskwinia',c:'#f97316'},
  {id:'cytr',  name:'Cytryna',  c:'#eab308'},
  {id:'mieta', name:'Mięta',    c:'#10b981'},
  {id:'niebo', name:'Niebo',    c:'#0ea5e9'},
  {id:'lawen', name:'Lawenda',  c:'#8b5cf6'},
];
const NT_EMOJI=['📝','📌','💡','🛒','🎁','🎂','📞','🏠','💊','🧾','✈️','🍰','👗','📚','🎓','💰','🧹','🌿','❤️','⭐','🔧','🐾','🎵','🎮'];
let ntQuery='', ntCur=null, _ntSaveT=null;

function ntData(){ if(!Array.isArray(data.notes))data.notes=[]; return data.notes; }
function ntTint(id){ const c=NT_COLORS.find(x=>x.id===id); return c&&c.c?c.c:null; }
function ntStyle(n){ const c=ntTint(n.color); return c?'background:linear-gradient('+c+'22,'+c+'22),var(--bg2);border-color:'+c+'55':''; }
function ntPreview(n){
  if(n.type==='list'){ const its=(n.items||[]); const shown=its.slice(0,5).map(i=>'<div class="nt-li'+(i.done?' done':'')+'">'+(i.done?'☑':'☐')+' '+esc(i.t)+'</div>').join(''); return shown+(its.length>5?'<div class="muted" style="font-size:.72rem">+'+(its.length-5)+' więcej</div>':''); }
  const body=(n.body||'').trim(); if(!body)return '<span class="muted">(pusta)</span>';
  return '<div class="nt-body">'+esc(body.length>180?body.slice(0,180)+'…':body).replace(/\n/g,'<br>')+'</div>';
}
function ntFmt(ts){ const d=new Date(ts||Date.now()); return d.getDate()+'.'+String(d.getMonth()+1).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

/* ---------- render ---------- */
function renderNotatki(){ keepScroll('notatki',_renderNotatki); }
function _renderNotatki(){
  const N=ntData();
  let h='<div class="nt-top"><input type="text" id="nt-q" placeholder="🔍 szukaj w notatkach…" value="'+esc(ntQuery)+'" enterkeyhint="search" autocomplete="off"><button class="btn btn-acc nt-new" onclick="ntOpen(null)">＋ Nowa</button></div>';
  const q=ntQuery.toLowerCase().trim();
  const list=N.filter(n=>!q||(n.title||'').toLowerCase().includes(q)||(n.body||'').toLowerCase().includes(q)||(n.items||[]).some(i=>(i.t||'').toLowerCase().includes(q)))
    .sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.updated||0)-(a.updated||0));
  if(!N.length)h+='<div class="card"><div class="empty"><div class="big">📝</div>Tu wpadną pierdoły: pomysły na prezent, co powiedzieć na wywiadówce, numer do hydraulika…<br><span class="muted">Notatki mogą być tekstem albo listą z odhaczaniem.</span></div></div>';
  else if(!list.length)h+='<div class="card"><div class="empty"><div class="big">🔍</div>Nic nie pasuje do „'+esc(ntQuery)+'".</div></div>';
  else {
    h+='<div class="nt-grid">';
    for(const n of list){
      h+='<div class="nt-card" style="'+ntStyle(n)+'" onclick="ntOpen(\''+n.id+'\')">'+
         '<div class="nt-head"><span class="nt-em">'+esc(n.emoji||'📝')+'</span><span class="nt-title">'+esc(n.title||'Bez tytułu')+'</span>'+(n.pinned?'<span class="nt-pin">📌</span>':'')+'</div>'+
         ntPreview(n)+'<div class="nt-foot">'+ntFmt(n.updated)+'</div></div>';
    }
    h+='</div>';
  }
  $('#v-notatki').innerHTML=h;
  const qi=$('#nt-q'); if(qi){ qi.addEventListener('input',()=>{ ntQuery=qi.value; const pos=qi.selectionStart; renderNotatki(); const q2=$('#nt-q'); if(q2){ q2.focus(); try{q2.setSelectionRange(pos,pos);}catch(e){} } }); }
}

/* ---------- edytor (sheet) — autosave ---------- */
function ntOpen(id){
  const N=ntData();
  let n=id?N.find(x=>x.id===id):null;
  if(!n){ n={id:uid('n'),title:'',body:'',type:'text',items:[],color:'none',emoji:'📝',pinned:false,created:Date.now(),updated:Date.now(),_new:true}; N.push(n); }
  ntCur=n.id;
  let h='<h2><span id="nt-e-em" class="nt-em" style="cursor:pointer" onclick="ntEmojiPick()">'+esc(n.emoji||'📝')+'</span> <input type="text" id="nt-e-title" value="'+esc(n.title)+'" placeholder="Tytuł" style="flex:1;font-weight:700;font-size:1rem;background:transparent;border:none;border-bottom:1px solid var(--line);border-radius:0;padding:6px 2px"><button class="x" onclick="closeModal()">✕</button></h2>';
  h+='<div class="seg" style="margin-bottom:10px"><button class="'+(n.type==='text'?'on':'')+'" onclick="ntSetType(\'text\')">📄 Tekst</button><button class="'+(n.type==='list'?'on':'')+'" onclick="ntSetType(\'list\')">☑ Lista</button></div>';
  h+='<div id="nt-e-body">'+ntEditorBody(n)+'</div>';
  h+='<div class="nt-colors">'+NT_COLORS.map(c=>'<button title="'+c.name+'" class="'+(n.color===c.id?'on':'')+'" style="background:'+(c.c?c.c+'55':'var(--bg3)')+'" onclick="ntSetColor(\''+c.id+'\',this)"></button>').join('')+
     '<button class="nt-pinbtn'+(n.pinned?' on':'')+'" onclick="ntTogglePin(this)">📌</button></div>';
  h+='<div id="nt-emo-wrap" style="display:none"><div class="emo-grid">'+NT_EMOJI.map(e=>'<button onclick="ntSetEmoji(\''+e+'\')">'+e+'</button>').join('')+'</div></div>';
  h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost" onclick="ntShare()">📤 Wyślij</button><button class="btn btn-danger" onclick="ntDelete()">🗑 Usuń</button></div>';
  h+='<div class="muted" style="font-size:.72rem;text-align:center;margin-top:8px">zapisuje się samo</div>';
  openModal(h);
  ntBind();
  if(n._new){ delete n._new; setTimeout(()=>{ const t=$('#nt-e-title'); if(t)t.focus(); },120); }
}
function ntEditorBody(n){
  if(n.type==='list'){
    let h='<div class="nt-elist" id="nt-elist">';
    (n.items||[]).forEach((it,i)=>{ h+='<div class="nt-eli"><button class="zk-check'+(it.done?' on':'')+'" onclick="ntItemToggle('+i+')">'+(it.done?'✓':'')+'</button><input type="text" value="'+esc(it.t)+'" data-i="'+i+'" oninput="ntItemText('+i+',this.value)" enterkeyhint="next" class="nt-eli-in'+(it.done?' done':'')+'"><button class="iconbtn" onclick="ntItemDel('+i+')">✕</button></div>'; });
    h+='</div><div class="nt-eadd"><input type="text" id="nt-e-newitem" placeholder="＋ dodaj punkt i Enter" enterkeyhint="done"></div>';
    if((n.items||[]).some(i=>i.done))h+='<button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="ntClearDone()">🧹 usuń odhaczone</button>';
    return h;
  }
  return '<textarea id="nt-e-text" rows="9" placeholder="Pisz…" class="nt-ta">'+esc(n.body||'')+'</textarea>';
}
function ntBind(){
  const n=ntGet(); if(!n)return;
  const t=$('#nt-e-title'); if(t)t.oninput=()=>{ n.title=t.value; ntTouch(); };
  const ta=$('#nt-e-text'); if(ta)ta.oninput=()=>{ n.body=ta.value; ntTouch(); };
  const ni=$('#nt-e-newitem'); if(ni)ni.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); const v=ni.value.trim(); if(!v)return; n.items=n.items||[]; n.items.push({t:v,done:false}); ni.value=''; ntTouch(); ntRefreshBody(); setTimeout(()=>{ const x=$('#nt-e-newitem'); if(x)x.focus(); },30); } };
}
function ntGet(){ return ntData().find(x=>x.id===ntCur); }
function ntTouch(){ const n=ntGet(); if(!n)return; n.updated=Date.now(); clearTimeout(_ntSaveT); _ntSaveT=setTimeout(()=>{ save(); renderNotatki(); },400); }
function ntRefreshBody(){ const n=ntGet(); const b=$('#nt-e-body'); if(b){ b.innerHTML=ntEditorBody(n); ntBind(); } }
function ntSetType(t){ const n=ntGet(); if(!n||n.type===t)return; n.type=t;
  if(t==='list'&&!(n.items||[]).length&&(n.body||'').trim()){ n.items=n.body.split('\n').map(s=>s.replace(/^[\s\-•\*☐☑]+/,'').trim()).filter(Boolean).map(s=>({t:s,done:false})); }
  if(t==='text'&&!(n.body||'').trim()&&(n.items||[]).length){ n.body=n.items.map(i=>(i.done?'☑ ':'• ')+i.t).join('\n'); }
  ntTouch(); $$('#sheet .seg button').forEach((b,i)=>b.classList.toggle('on',(i===0)===(t==='text'))); ntRefreshBody(); }
function ntItemToggle(i){ const n=ntGet(); n.items[i].done=!n.items[i].done; ntTouch(); ntRefreshBody(); vibrate(6); }
function ntItemText(i,v){ const n=ntGet(); n.items[i].t=v; ntTouch(); }
function ntItemDel(i){ const n=ntGet(); n.items.splice(i,1); ntTouch(); ntRefreshBody(); }
function ntClearDone(){ const n=ntGet(); n.items=n.items.filter(i=>!i.done); ntTouch(); ntRefreshBody(); }
function ntSetColor(c,btn){ const n=ntGet(); n.color=c; ntTouch(); $$('#sheet .nt-colors button').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); }
function ntTogglePin(btn){ const n=ntGet(); n.pinned=!n.pinned; ntTouch(); btn.classList.toggle('on',n.pinned); }
function ntEmojiPick(){ const w=$('#nt-emo-wrap'); w.style.display=w.style.display==='none'?'':'none'; }
function ntSetEmoji(e){ const n=ntGet(); n.emoji=e; ntTouch(); $('#nt-e-em').textContent=e; $('#nt-emo-wrap').style.display='none'; }
function ntShare(){ const n=ntGet(); let t=(n.emoji||'')+' '+(n.title||'Notatka')+'\n'; t+=n.type==='list'?(n.items||[]).map(i=>(i.done?'☑ ':'☐ ')+i.t).join('\n'):(n.body||''); if(navigator.share)navigator.share({text:t}).catch(()=>{}); else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('📋 Skopiowano')); }
function ntDelete(){
  if(_modalClosing)return;
  const N=ntData(); const n=ntGet(); if(!n)return;
  const idx=N.indexOf(n); N.splice(idx,1); save(); closeModal(); renderNotatki();
  toastAction('🗑 Usunięto: '+(n.title||'notatkę'),'Cofnij',()=>{ N.splice(Math.min(idx,N.length),0,n); save(); renderNotatki(); });
}
/* pusta, nietknięta nowa notatka znika przy zamknięciu */
function ntOnModalClose(){ const N=ntData(); const n=ntGet(); if(n&&!(n.title||'').trim()&&!(n.body||'').trim()&&!(n.items||[]).length){ N.splice(N.indexOf(n),1); save(); renderNotatki(); } ntCur=null; }

document.head.insertAdjacentHTML('beforeend',`<style>
.nt-top{display:flex;gap:8px;margin-bottom:12px}
.nt-top input{flex:1;padding:11px 12px;font-size:.92rem}
.nt-new{width:auto;padding:10px 16px;flex-shrink:0}
.nt-grid{column-count:2;column-gap:10px}
@media (max-width:360px){.nt-grid{column-count:1}}
.nt-card{break-inside:avoid;background:var(--bg2);border:1.5px solid var(--line);border-radius:16px;padding:12px;margin-bottom:10px;box-shadow:var(--sh);cursor:pointer;transition:transform .12s}
.nt-card:active{transform:scale(.98)}
.nt-head{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.nt-em{font-size:1.15rem}
.nt-title{font-weight:700;font-size:.92rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nt-pin{font-size:.8rem}
.nt-body{font-size:.82rem;line-height:1.45;color:var(--tx);opacity:.9;word-break:break-word}
.nt-li{font-size:.82rem;line-height:1.5}
.nt-li.done{opacity:.5;text-decoration:line-through}
.nt-foot{font-size:.68rem;color:var(--tx2);margin-top:8px;font-weight:600}
.nt-ta{width:100%;background:var(--bg3);border:1px solid var(--line);color:var(--tx);border-radius:12px;padding:10px;font-size:.95rem;line-height:1.5;resize:vertical;min-height:140px}
.nt-colors{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}
.nt-colors button{width:30px;height:30px;border-radius:50%;border:3px solid transparent}
.nt-colors button.on{border-color:var(--tx)}
.nt-pinbtn{margin-left:auto;width:auto!important;border-radius:10px!important;padding:0 10px;background:var(--bg3)!important;opacity:.5}
.nt-pinbtn.on{opacity:1;border-color:var(--accent)!important}
.nt-elist{display:flex;flex-direction:column;gap:6px}
.nt-eli{display:flex;align-items:center;gap:8px}
.nt-eli .zk-check.on{background:var(--ok);border-color:var(--ok);color:#fff}
.nt-eli-in{flex:1;padding:8px 10px}
.nt-eli-in.done{text-decoration:line-through;opacity:.55}
.nt-eadd{margin-top:8px}
.nt-eadd input{width:100%}
</style>`);
