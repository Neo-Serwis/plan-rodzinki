/* =====================================================================
   🛒 ZAKUPY — lista zakupów, która sama układa się według sklepu
   (auto-kategorie z polskiego słownika + uczenie się z Twoich wpisów,
   podpowiedzi najczęściej kupowanych, wiele list, wklejanie listy, udostępnianie)
   Wymaga globali z index.html: data, save, saveSoft, esc, toast, openModal, closeModal,
   keepScroll, uid, $, $$, vibrate, _modalClosing
   ===================================================================== */
'use strict';

const ZK_CATS=[
  {id:'warzywa', name:'Warzywa i owoce', em:'🥦'},
  {id:'pieczywo', name:'Pieczywo', em:'🥖'},
  {id:'nabial', name:'Nabiał i jajka', em:'🧀'},
  {id:'mieso', name:'Mięso i ryby', em:'🍗'},
  {id:'spozywcze', name:'Spożywcze', em:'🍝'},
  {id:'slodycze', name:'Słodycze i przekąski', em:'🍫'},
  {id:'mrozonki', name:'Mrożonki', em:'🧊'},
  {id:'napoje', name:'Napoje', em:'🧃'},
  {id:'chemia', name:'Chemia i dom', em:'🧴'},
  {id:'apteka', name:'Apteka i dzieci', em:'💊'},
  {id:'zwierzeta', name:'Zwierzaki', em:'🐾'},
  {id:'inne', name:'Inne', em:'🛍️'},
];
const ZK_DICT={
  warzywa:['pomidor','ogór','ziemniak','cebul','czosn','marchew','papryk','sałat','kapust','brokuł','kalafior','banan','jabłk','grusz','cytryn','pomarań','mandaryn','winogron','truskaw','malin','borów','jagod','awokado','pietrusz','koper','szczypior','rzodkiew','cukini','bakłażan','szpinak','arbuz','melon','kiwi','ananas','śliwk','brzoskwin','nektaryn','morel','wiśni','czereśni','burak','seler','por ','pory','imbir','limonk','grejpfrut','mango','dyni','fasolka szparag','pieczark','grzyb','rukol','sałata','owoc','warzyw','ziół','bazyli','mięt'],
  pieczywo:['chleb','bułk','bagiet','tost','rogal','drożdżów','pita','ciabat','chałk','pączk','bułeczk','precel','wafle ryż','pieczyw'],
  nabial:['mleko','ser ','ser','jogurt','masło','śmietan','twar','kefir','maślank','jajk','jaja','serek','mozzarel','feta','parmezan','camembert','skyr','śmietank','margaryn','mleczk'],
  mieso:['kurczak','pierś','mielone','wołow','wieprzow','schab','kiełbas','szynk','boczek','parówk','łosoś','ryb','tuńczyk','indyk','karków','żeberk','wędlin','salami','kabanos','polędwic','udk','skrzydeł','mintaj','dorsz','śledz','krewet','pasztet'],
  spozywcze:['makaron','ryż','mąk','cukier','sól','kasz','płatki','owsian','olej','oliw','ocet','przypraw','pieprz','ketchup','majonez','musztard','konserw','fasol','groszek','kukurydz','sos','bulion','zup','herbat','kaw','kakao','miód','dżem','orzech','rodzynk','muesli','granol','tortill','pomidory w pusz','passat','koncentrat','pesto','soja','tofu','hummus','ciecierzyc','soczewic','proszek do pieczenia','drożdż','wanili','cynamon','curry','oregano','bułka tarta','budyń','kisiel','galaretk','sezam','słonecznik','pestki','chrzan','ogórki kisz','kiszon','oliwki','kapary','nutell','krem czekolad','masło orzech'],
  slodycze:['chips','ciast','czekolad','cukier','baton','wafel','gum','żelk','lizak','krakers','paluszk','popcorn','herbatnik','biszkopt','delicj','pierniki','ptasie','cukierk','landryn','draż','prażynk','precelk'],
  mrozonki:['mrożon','pizz','frytk','pierog','nugget','lod','szpinak mroż','ryba mroż','warzywa mroż'],
  napoje:['wod','sok','cola','napój','piwo','win','lemoniad','kompot','tonik','energetyk','syrop do wody','oranżad','herbata mroż','kawa mroż'],
  chemia:['papier toalet','ręcznik','płyn','proszek','kapsułk','mydł','szampon','pasta do zęb','szczotecz','worki','gąbk','foli','chusteczk','płatki kosmet','dezodor','żel pod','odświeżacz','wybielacz','domestos','ludwik','tabletki do zmyw','sól do zmyw','nabłyszcz','odkamien','płyn do płuk','zmywak','ścierk','rękawic','świec','zapałk','bateri','żarówk','papier do piecz','pergamin','odżywk','balsam','krem','maszynk','pianka','podpask','tampon','wkładk','patyczk','wata','lakier','zmywacz','pilnik','pieluch'],
  apteka:['witamin','syrop','plastr','apap','ibuprom','ibuprofen','maść','nurofen','paracetamol','rutinoscorbin','elektrolit','probiotyk','magnez','wapno','żelazo','tran','termometr','bandaż','gaza','krople','spray do nos','tabletki na gardł','witamina','kaszka','mleko modyfik','smoczek','pieluszk','chusteczki nawilż'],
  zwierzeta:['karm','żwirek','smakołyk','kość dla','przysmak dla psa','dla kota','dla psa'],
};
const ZK_UNITS=['szt','kg','g','l','ml','op','opak','paczk','but','puszk'];

function zkData(){
  if(!data.shopping)data.shopping={lists:[],activeId:null,learned:{}};
  const S=data.shopping;
  S.lists=S.lists||[]; S.learned=S.learned||{};
  if(!S.lists.length)S.lists.push({id:'zk_main',name:'Zakupy',emoji:'🛒',items:[]});
  if(!S.lists.some(l=>l.id===S.activeId))S.activeId=S.lists[0].id;
  return S;
}
function zkList(){ const S=zkData(); return S.lists.find(l=>l.id===S.activeId); }
function zkCatOf(name){
  const S=zkData(), n=name.toLowerCase().trim();
  const learned=S.learned[n]; if(learned&&learned.cat)return learned.cat;
  // dopasowanie po fragmencie — dłuższe słowa kluczowe mają pierwszeństwo
  let best=null,bestLen=0;
  for(const cat in ZK_DICT)for(const kw of ZK_DICT[cat]){
    if(n.includes(kw.trim())&&kw.trim().length>bestLen){best=cat;bestLen=kw.trim().length;}
  }
  return best||'inne';
}
/* „2 mleko", „mleko 2", „mleko x2", „1,5 kg ziemniaków", „jajka 10 szt" */
function zkParse(raw){
  let s=raw.trim().replace(/\s+/g,' '); let qty=1, unit='';
  // „2x jajka" / „jajka x2" / „jajka 2" / „1,5 kg ziemniaków" / „ser 200 g"
  const mx=s.match(/^(\d+(?:[.,]\d+)?)\s*[x×]\s*(.+)$/i)||s.match(/^(.+?)\s*[x×]\s*(\d+(?:[.,]\d+)?)$/i);
  if(mx){ const num=/^\d/.test(mx[1])?mx[1]:mx[2]; const rest=/^\d/.test(mx[1])?mx[2]:mx[1]; qty=parseFloat(num.replace(',','.'))||1; s=rest.trim(); }
  const re=/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|szt|op|opak|paczk\w*|but\w*|puszk\w*)?(?=\s|$)/i;
  const m=mx?null:s.match(re);
  if(m){ qty=parseFloat(m[1].replace(',','.'))||1; unit=(m[2]||'').toLowerCase(); s=(s.slice(0,m.index)+' '+s.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim(); }
  if(!s)s=raw.trim();
  s=s.charAt(0).toUpperCase()+s.slice(1);
  return {name:s,qty,unit};
}
function zkLearn(name,cat){
  const S=zkData(), n=name.toLowerCase().trim();
  const l=S.learned[n]||{count:0};
  l.count=(l.count||0)+1; l.last=Date.now(); l.display=name; if(cat)l.cat=cat;
  S.learned[n]=l;
}
function zkAdd(raw,fromSuggest){
  const p=zkParse(raw); if(!p.name)return;
  const L=zkList();
  const ex=L.items.find(i=>i.name.toLowerCase()===p.name.toLowerCase()&&!i.done);
  if(ex){ ex.qty=(ex.qty||1)+(fromSuggest?0:(p.qty>1?p.qty:1)); if(ex.qty===1&&!fromSuggest)ex.qty=2; toast('➕ '+esc(ex.name)+' — już jest, zwiększono ilość'); }
  else{
    const cat=zkCatOf(p.name);
    L.items.push({id:uid('zi'),name:p.name,qty:p.qty,unit:p.unit,cat,note:'',done:false,star:false,ts:Date.now()});
    zkLearn(p.name,cat);
  }
  save(); renderZakupy(); vibrate(8);
}
function zkToggle(id){ const it=zkList().items.find(i=>i.id===id); if(!it)return; it.done=!it.done; it.doneTs=it.done?Date.now():null; save(); renderZakupy(); vibrate(6); }
function zkClearDone(){
  const L=zkList(); const gone=L.items.filter(i=>i.done); if(!gone.length)return;
  L.items=L.items.filter(i=>!i.done); save(); renderZakupy();
  toastAction('🧹 Usunięto '+gone.length+' kupionych','Cofnij',()=>{ L.items.push(...gone); save(); renderZakupy(); });
}
function zkDelete(id){
  const L=zkList(); const it=L.items.find(i=>i.id===id); if(!it)return;
  L.items=L.items.filter(i=>i.id!==id); save(); closeModal(); renderZakupy();
  toastAction('🗑 Usunięto: '+it.name,'Cofnij',()=>{ L.items.push(it); save(); renderZakupy(); });
}
function zkSuggestions(){
  const S=zkData(), L=zkList(), on=new Set(L.items.map(i=>i.name.toLowerCase()));
  return Object.entries(S.learned).filter(([n,l])=>!on.has(n)&&l.count>=1)
    .sort((a,b)=>(b[1].count-a[1].count)||(b[1].last-a[1].last)).slice(0,10).map(([n,l])=>l.display||n);
}
function zkStars(){ const S=zkData(); const set=new Set(); S.lists.forEach(l=>l.items.forEach(i=>{if(i.star)set.add(i.name);})); return [...set]; }

/* ---------- render ---------- */
function renderZakupy(){ keepScroll('zakupy',_renderZakupy); }
function _renderZakupy(){
  const S=zkData(), L=zkList();
  const open=L.items.filter(i=>!i.done), done=L.items.filter(i=>i.done).sort((a,b)=>(b.doneTs||0)-(a.doneTs||0));
  let h='';
  // listy
  h+='<div class="zk-lists">'+S.lists.map(l=>'<button class="zk-chip'+(l.id===S.activeId?' on':'')+'" onclick="zkSwitch(\''+l.id+'\')">'+esc(l.emoji||'🛒')+' '+esc(l.name)+
     (l.items.filter(i=>!i.done).length?' <b>'+l.items.filter(i=>!i.done).length+'</b>':'')+'</button>').join('')+
     '<button class="zk-chip add" onclick="zkListModal(null)">＋</button></div>';
  // dodawanie
  h+='<div class="card zk-addcard"><div class="zk-addrow"><input type="text" id="zk-in" placeholder="np. mleko 2, chleb, 1,5 kg ziemniaków…" enterkeyhint="done" autocomplete="off">'+
     '<button class="btn btn-acc zk-addbtn" onclick="zkAddFromInput()">＋</button></div>';
  const sug=zkSuggestions();
  if(sug.length)h+='<div class="zk-sug">'+sug.map(s=>'<button onclick="zkAdd(\''+esc(s).replace(/'/g,'&#39;')+'\',true)">'+esc(s)+'</button>').join('')+'</div>';
  h+='</div>';
  // pozycje wg kategorii (kolejność jak w sklepie)
  if(!open.length&&!done.length){
    h+='<div class="card"><div class="empty"><div class="big">🛒</div>Lista pusta.<br><span class="muted">Wpisz coś wyżej — ułoży się samo według działów sklepu.</span></div></div>';
  } else {
    const groups=ZK_CATS.map(c=>({c,items:open.filter(i=>i.cat===c.id)})).filter(g=>g.items.length);
    // ręcznie ustawiona kategoria nieznana → do „Inne"
    const orphan=open.filter(i=>!ZK_CATS.some(c=>c.id===i.cat)); if(orphan.length)groups.push({c:ZK_CATS[ZK_CATS.length-1],items:orphan});
    h+='<div class="card zk-card">';
    h+='<div class="zk-head"><span>'+esc(L.emoji||'🛒')+' '+esc(L.name)+' <span class="muted">· '+open.length+(open.length===1?' rzecz':(open.length<5?' rzeczy':' rzeczy'))+'</span></span>'+
       '<span><button class="iconbtn" title="lista" onclick="zkListModal(\''+L.id+'\')">⋯</button></span></div>';
    for(const g of groups){
      h+='<div class="zk-cat">'+g.c.em+' '+esc(g.c.name)+' <span class="muted">'+g.items.length+'</span></div>';
      for(const it of g.items)h+=zkItemRow(it);
    }
    if(done.length){
      h+='<div class="zk-cat zk-donehead" onclick="zkToggleDoneView()">✅ W koszyku <span class="muted">'+done.length+'</span><span class="r">'+(S.showDone===false?'pokaż':'ukryj')+'</span></div>';
      if(S.showDone!==false){ for(const it of done)h+=zkItemRow(it); h+='<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="zkClearDone()">🧹 Wyczyść kupione</button>'; }
    }
    h+='</div>';
  }
  // akcje
  h+='<div class="zk-actions"><button class="btn btn-ghost" onclick="zkShare()">📤 Wyślij</button><button class="btn btn-ghost" onclick="zkPasteModal()">📋 Wklej listę</button>'+
     (zkStars().length?'<button class="btn btn-ghost" onclick="zkAddStars()">⭐ Stałe</button>':'')+'</div>';
  h+='<div class="muted" style="font-size:.72rem;text-align:center;margin:4px 0 10px">Tap w kółko = kupione · tap w nazwę = edycja (ilość, dział, notatka, ⭐ stałe)</div>';
  $('#v-zakupy').innerHTML=h;
  const inp=$('#zk-in'); if(inp)inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); zkAddFromInput(); } });
}
function zkItemRow(it){
  const q=(it.qty&&it.qty!==1)||it.unit?'<span class="zk-qty">'+(it.qty||1)+(it.unit?' '+esc(it.unit):'')+'</span>':'';
  return '<div class="zk-item'+(it.done?' done':'')+'"><button class="zk-check" onclick="zkToggle(\''+it.id+'\')">'+(it.done?'✓':'')+'</button>'+
    '<div class="zk-name" onclick="zkItemModal(\''+it.id+'\')">'+(it.star?'⭐ ':'')+esc(it.name)+q+(it.note?'<div class="zk-note">'+esc(it.note)+'</div>':'')+'</div></div>';
}
function zkAddFromInput(){ const inp=$('#zk-in'); const v=inp.value.trim(); if(!v)return; v.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).forEach(s=>zkAdd(s)); const i2=$('#zk-in'); if(i2){ i2.value=''; i2.focus(); } }
function zkSwitch(id){ zkData().activeId=id; save(); renderZakupy(); }
function zkToggleDoneView(){ const S=zkData(); S.showDone=S.showDone===false?true:false; save(); renderZakupy(); }
function zkAddStars(){ const L=zkList(); let n=0; for(const name of zkStars()){ if(!L.items.some(i=>i.name.toLowerCase()===name.toLowerCase()&&!i.done)){ L.items.push({id:uid('zi'),name,qty:1,unit:'',cat:zkCatOf(name),note:'',done:false,star:true,ts:Date.now()}); n++; } } save(); renderZakupy(); toast(n?'⭐ Dodano '+n+' stałych':'⭐ Wszystkie stałe już są na liście'); }
function zkShare(){
  const L=zkList(); const open=L.items.filter(i=>!i.done);
  let t='🛒 '+L.name+' ('+open.length+')\n';
  for(const c of ZK_CATS){ const its=open.filter(i=>i.cat===c.id); if(!its.length)continue; t+=c.em+' '+c.name+'\n'+its.map(i=>'  • '+i.name+((i.qty&&i.qty!==1)||i.unit?' — '+(i.qty||1)+(i.unit?' '+i.unit:''):'')+(i.note?' ('+i.note+')':'')).join('\n')+'\n'; }
  t+='— Plan Rodzinki';
  if(navigator.share)navigator.share({text:t}).catch(()=>{}); else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('📋 Lista skopiowana'));
}

/* ---------- modale ---------- */
function zkItemModal(id){
  const it=zkList().items.find(i=>i.id===id); if(!it)return;
  let h='<h2>✏️ '+esc(it.name)+'<button class="x" onclick="closeModal()">✕</button></h2>';
  h+='<input type="text" id="zi-name" value="'+esc(it.name)+'" style="margin-bottom:10px">';
  h+='<div class="frow"><label>Ilość</label><button class="iconbtn" onclick="zkQty(-1)">−</button><input type="number" id="zi-qty" min="0" step="any" value="'+(it.qty||1)+'" style="width:70px"><button class="iconbtn" onclick="zkQty(1)">＋</button>'+
     '<select id="zi-unit"><option value="">szt/–</option>'+ZK_UNITS.filter(u=>u!=='szt').map(u=>'<option value="'+u+'" '+(it.unit===u?'selected':'')+'>'+u+'</option>').join('')+'</select></div>';
  h+='<div class="frow"><label>Dział</label><select id="zi-cat">'+ZK_CATS.map(c=>'<option value="'+c.id+'" '+(c.id===it.cat?'selected':'')+'>'+c.em+' '+esc(c.name)+'</option>').join('')+'</select></div>';
  h+='<input type="text" id="zi-note" value="'+esc(it.note||'')+'" placeholder="notatka, np. bez laktozy / ta z zieloną etykietą" style="margin-bottom:10px">';
  h+='<div class="frow"><label>⭐ Stała pozycja (dodawana jednym tapem)</label><label class="switch"><input type="checkbox" id="zi-star" '+(it.star?'checked':'')+'><span class="sl"></span></label></div>';
  h+='<div class="frow"><label>Przenieś na listę</label><select id="zi-list">'+zkData().lists.map(l=>'<option value="'+l.id+'" '+(l.id===zkData().activeId?'selected':'')+'>'+esc(l.emoji||'🛒')+' '+esc(l.name)+'</option>').join('')+'</select></div>';
  h+='<button class="btn btn-acc" style="margin-top:8px" onclick="zkSaveItem(\''+id+'\')">💾 Zapisz</button>';
  h+='<button class="btn btn-danger" style="margin-top:8px" onclick="zkDelete(\''+id+'\')">🗑 Usuń</button>';
  openModal(h);
}
function zkQty(d){ const q=$('#zi-qty'); q.value=Math.max(0,(parseFloat(q.value)||0)+d); }
function zkSaveItem(id){
  if(_modalClosing)return;
  const S=zkData(), L=zkList(); const it=L.items.find(i=>i.id===id); if(!it)return;
  const name=$('#zi-name').value.trim(); if(!name){toast('Podaj nazwę');return;}
  it.name=name; it.qty=parseFloat($('#zi-qty').value)||1; it.unit=$('#zi-unit').value; it.cat=$('#zi-cat').value; it.note=$('#zi-note').value.trim(); it.star=$('#zi-star').checked;
  zkLearn(name,it.cat);
  const target=$('#zi-list').value;
  if(target!==L.id){ L.items=L.items.filter(i=>i.id!==id); S.lists.find(l=>l.id===target).items.push(it); }
  save(); closeModal(); renderZakupy(); toast('✓ zapisano');
}
function zkListModal(lid){
  const S=zkData(); const l=lid?S.lists.find(x=>x.id===lid):{name:'',emoji:'🛒'};
  let h='<h2>'+(lid?'⋯ Lista':'➕ Nowa lista')+'<button class="x" onclick="closeModal()">✕</button></h2>';
  h+='<input type="text" id="zl-name" value="'+esc(l.name)+'" placeholder="np. Biedronka, Apteka, Urodziny Oliwii" style="margin-bottom:10px">';
  h+='<div class="emo-grid" id="zl-emo">'+['🛒','🧺','🏪','🍎','💊','🎁','🎂','🧴','🐾','🏡','🎒','🎄','🛠️','🌿','🍕','🧁'].map(e=>'<button class="'+(e===l.emoji?'on':'')+'" onclick="$$(\'#zl-emo button\').forEach(b=>b.classList.remove(\'on\'));this.classList.add(\'on\')">'+e+'</button>').join('')+'</div>';
  h+='<button class="btn btn-acc" onclick="zkSaveList('+(lid?'\''+lid+'\'':'null')+')">💾 Zapisz</button>';
  if(lid&&S.lists.length>1)h+='<button class="btn btn-danger" style="margin-top:8px" onclick="zkDelList(\''+lid+'\')">🗑 Usuń listę</button>';
  openModal(h);
}
function zkSaveList(lid){
  if(_modalClosing)return;
  const S=zkData(); const name=$('#zl-name').value.trim(); if(!name){toast('Podaj nazwę');return;}
  const emoji=($('#zl-emo .on')||{textContent:'🛒'}).textContent;
  if(lid){ const l=S.lists.find(x=>x.id===lid); l.name=name; l.emoji=emoji; }
  else { const l={id:uid('zl'),name,emoji,items:[]}; S.lists.push(l); S.activeId=l.id; }
  save(); closeModal(); renderZakupy(); toast('✓ zapisano');
}
function zkDelList(lid){
  if(_modalClosing)return;
  const S=zkData(); const l=S.lists.find(x=>x.id===lid);
  if(!confirm('Usunąć listę „'+l.name+'" z '+l.items.length+' pozycjami?'))return;
  S.lists=S.lists.filter(x=>x.id!==lid); S.activeId=S.lists[0].id; save(); closeModal(); renderZakupy(); toast('Usunięto');
}
function zkPasteModal(){
  let h='<h2>📋 Wklej listę<button class="x" onclick="closeModal()">✕</button></h2>';
  h+='<div class="muted" style="margin-bottom:8px">Każda linia lub przecinek = osobna pozycja. Możesz wkleić SMS-a od kogoś albo przepisać kartkę.</div>';
  h+='<textarea id="zk-paste" rows="7" placeholder="mleko 2&#10;chleb&#10;jajka 10 szt&#10;papier toaletowy" style="width:100%;background:var(--bg3);border:1px solid var(--line);color:var(--tx);border-radius:10px;padding:10px;font-size:.9rem"></textarea>';
  h+='<button class="btn btn-acc" style="margin-top:10px" onclick="zkPasteAdd()">➕ Dodaj wszystko</button>';
  openModal(h);
}
function zkPasteAdd(){ if(_modalClosing)return; const v=$('#zk-paste').value; const parts=v.split(/[\n,;]+/).map(s=>s.replace(/^[\s•\-\*\d\.\)]+(?=\D)/,'').trim()).filter(Boolean); if(!parts.length){toast('Pusto');return;} parts.forEach(p=>zkAdd(p)); closeModal(); toast('➕ Dodano '+parts.length+' pozycji'); }

/* ---------- CSS modułu ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.zk-lists{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none}
.zk-lists::-webkit-scrollbar{display:none}
.zk-chip{flex-shrink:0;background:var(--bg2);border:1.5px solid var(--line);color:var(--tx2);border-radius:999px;padding:7px 13px;font-weight:700;font-size:.82rem;white-space:nowrap}
.zk-chip.on{border-color:var(--accent);color:var(--accent);background:var(--bg3)}
.zk-chip b{background:var(--accent);color:var(--accent-fg);border-radius:999px;padding:0 6px;font-size:.72rem;margin-left:2px}
.zk-chip.add{padding:7px 11px;font-size:1rem}
.zk-addcard{padding:10px}
.zk-addrow{display:flex;gap:8px}
.zk-addrow input{flex:1;font-size:.95rem;padding:11px 12px}
.zk-addbtn{width:48px;flex-shrink:0;padding:0;font-size:1.3rem;border-radius:12px}
.zk-sug{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.zk-sug button{background:var(--bg3);border:1px dashed var(--line);color:var(--tx2);border-radius:999px;padding:5px 11px;font-size:.78rem;font-weight:600}
.zk-card{padding:10px 12px 12px}
.zk-head{display:flex;align-items:center;justify-content:space-between;font-weight:700;margin-bottom:4px}
.zk-cat{font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--tx2);margin:12px 0 4px;display:flex;align-items:center;gap:6px}
.zk-cat .r{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:600}
.zk-donehead{cursor:pointer;border-top:1px dashed var(--line);padding-top:10px;margin-top:14px}
.zk-item{display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)}
.zk-item:last-child{border-bottom:none}
.zk-check{width:28px;height:28px;border-radius:50%;border:2px solid var(--accent);background:transparent;color:var(--accent-fg);font-weight:800;font-size:15px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s;margin-top:1px}
.zk-item.done .zk-check{background:var(--ok);border-color:var(--ok);color:#fff}
.zk-name{flex:1;font-weight:600;font-size:.95rem;cursor:pointer;line-height:1.35;padding-top:3px}
.zk-item.done .zk-name{text-decoration:line-through;opacity:.5}
.zk-qty{display:inline-block;background:var(--bg3);color:var(--tx2);border-radius:7px;padding:1px 7px;font-size:.74rem;font-weight:700;margin-left:6px;vertical-align:middle}
.zk-note{font-size:.76rem;color:var(--tx2);font-weight:500}
.zk-actions{display:flex;gap:8px;margin:2px 0 6px}
.zk-actions .btn{padding:10px 6px;font-size:.8rem}
</style>`);
