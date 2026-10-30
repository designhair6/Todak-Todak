/* ===== 진도표 + 30일 체크리스트 ===== */
(() => {
const { $, h, esc, store, sfx, buzz, toast, confirmBox, pushPage, popPage, burst, relRect } = HG;
const D = HG_DATA;

/* ---------------------------------------------------------
   진도표
   --------------------------------------------------------- */
const PKEY = 'hangul_progress_v1';
const CHO = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const CHO_I = [0,2,3,5,6,7,9,11,12,14,15,16,17,18];
const JUNG = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ'];
const JUNG_I = [0,2,4,6,8,12,13,17,18,20];
const syl = (c,j) => String.fromCharCode(0xAC00 + (CHO_I[c]*21 + JUNG_I[j])*28);
const NAMES = ['기역','니은','디귿','리을','미음','비읍','시옷','이응','지읒','치읓','키읔','티읕','피읖','히읗'];
let P = store.get(PKEY, {});

function allKeys(){ const a = []; CHO.forEach((_,i)=>JUNG.forEach((_,j)=>a.push(`s${i}_${j}`))); return a; }
function tally(keys){ const v = keys.map(k=>P[k]||0); return { done:v.filter(x=>x===3).length, ing:v.filter(x=>x===1||x===2).length, s1:v.filter(x=>x===1).length, s2:v.filter(x=>x===2).length }; }
function setNum(el, html, v){ const p = el.dataset.v; el.innerHTML = html; el.dataset.v = v; if (p !== undefined && p != String(v)){ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } }

function buildProgress(){
  const v = $('vProg');
  v.innerHTML = `
    <div class="vh"><div><small>문제집 없이 체크해요</small><h2>우리 아이, <em>어디까지</em><br>뗐을까?</h2></div></div>
    <div class="score3">
      <div><small>ㄱ~ㅎ</small><b id="pg1">0</b><i id="pg1s">진행 중 0</i></div>
      <div><small>가~하</small><b id="pg2">0</b><i id="pg2s">진행 중 0</i></div>
      <div><small>전체 글자</small><b id="pg3">0</b><i id="pg3s">진행 중 0</i></div>
    </div>
    <div class="pbar"><i id="pgBar"></i></div>
    <div class="how3">
      <div><span class="legend-mini"><span class="lc s1">가</span></span><b>① 알아봄</b><small>"가 어딨어?" 하면 짚어요</small></div>
      <div><span class="legend-mini"><span class="lc s2">가</span></span><b>② 소리 냄</b><small>보여주면 먼저 읽어요</small></div>
      <div><span class="legend-mini"><span class="lc s3">가</span></span><b>③ 혼자 읽음</b><small>섞어도 바로 읽어요</small></div>
    </div>
    <p class="rule-note">칸을 누를 때마다 ①→②→③→빈칸. <mark>순서를 섞어도 이틀 연속 읽으면</mark> ③ 혼자 읽음으로 체크해요.</p>
    <div class="practice-card" id="pgPractice"><div class="pc-e">가</div><div><b>섞어서 읽기 연습</b><small>체크한 글자를 카드로 섞어 보여줘요</small></div><em>›</em></div>
    <div class="sec-t">① 자음 ㄱ~ㅎ <small>모양과 이름</small></div>
    <div class="cons-g" id="pgCons"></div>
    <div class="sec-t">② 가~하, 그다음 가갸표 <small>옆으로 밀어서 보기 →</small></div>
    <div class="syl-wrap"><div class="syl-g" id="pgSyl"></div></div>
    <div class="print-row"><button class="btn-sub" id="pgPrint">종이로 출력하기</button><button class="btn-sub" id="pgReset">진도 초기화</button></div>`;
  const mk = (id, label, extra='') => { const e = h('div','lc '+extra, label); e.dataset.id = id; paint(e); e.onclick = () => cycle(e); return e; };
  const cons = $('pgCons'); CHO.forEach((c,i) => cons.appendChild(mk('c'+i, c)));
  const g = $('pgSyl'); g.appendChild(h('div','hd'));
  JUNG.forEach((j,ji) => g.appendChild(h('div','hd'+(ji===0?' a':''), j)));
  CHO.forEach((c,ci) => { g.appendChild(h('div','hd',c)); JUNG.forEach((_,ji) => g.appendChild(mk(`s${ci}_${ji}`, syl(ci,ji), ji===0?'a':''))); });
  $('pgPractice').onclick = openPractice;
  $('pgPrint').onclick = () => window.open('../한글 진도표.html', '_blank');
  $('pgReset').onclick = async () => { if (!await confirmBox('진도를 초기화할까요?', '체크한 글자가 모두 빈칸이 돼요.', '초기화', true)) return; P = {}; store.set(PKEY, P); document.querySelectorAll('#vProg .lc[data-id]').forEach(paint); score(); };
  score();
}
function paint(e){ e.classList.remove('s1','s2','s3'); const v = P[e.dataset.id]||0; if (v) e.classList.add('s'+v); }
function cycle(e){
  const id = e.dataset.id; P[id] = ((P[id]||0)+1)%4; if (!P[id]) delete P[id];
  store.set(PKEY, P); paint(e); score();
  if (P[id] === 3){ sfx('pop'); buzz(20); const r = relRect(e); burst(r.cx, r.cy, 10); } else sfx('tap');
}
function score(){
  const a = tally(CHO.map((_,i)=>'c'+i)), b = tally(CHO.map((_,i)=>`s${i}_0`)), t = tally(allKeys());
  setNum($('pg1'), `${a.done}<span>/14</span>`, a.done); $('pg1s').textContent = `진행 중 ${a.ing}`;
  setNum($('pg2'), `${b.done}<span>/14</span>`, b.done); $('pg2s').textContent = `진행 중 ${b.ing}`;
  setNum($('pg3'), `${t.done}<span>/140</span>`, t.done); $('pg3s').textContent = `진행 중 ${t.ing}`;
  $('pgBar').style.width = ((a.done + t.done)/154*100)+'%';
  HG.bus.emit('progress:changed');
}

/* ---- flash practice ---- */
function openPractice(){
  const pool = [];
  CHO.forEach((c,i) => { if (P['c'+i]) pool.push({ id:'c'+i, ch:c, sub:NAMES[i] }); });
  CHO.forEach((_,ci) => JUNG.forEach((_,ji) => { if (P[`s${ci}_${ji}`]) pool.push({ id:`s${ci}_${ji}`, ch:syl(ci,ji), sub:'' }); }));
  let deck;
  if (pool.length < 4){
    deck = [...CHO.map((c,i)=>({id:'c'+i,ch:c,sub:NAMES[i]})).slice(0,5), ...[0,1,2,3,4].map(ci=>({id:`s${ci}_0`,ch:syl(ci,0),sub:''}))];
  } else deck = pool;
  deck = deck.sort(()=>Math.random()-.5).slice(0,10);
  let i = 0; const res = [];
  const body = h('div','flash');
  const show = () => {
    if (i >= deck.length) return finish();
    const c = deck[i];
    body.innerHTML = `<div class="fl-top"><span>${i+1} / ${deck.length}</span><span>${pool.length<4?'맛보기 카드':'체크한 글자에서 섞었어요'}</span></div>
      <div class="fl-card in">${c.sub?`<small>${c.sub}</small>`:''}${esc(c.ch)}</div>
      <p class="fl-hint">아이가 혼자 읽었나요?</p>
      <div class="fl-btns"><button class="no">아직</button><button class="btn-main">읽었어요!</button></div>`;
    body.querySelector('.no').onclick = () => { res.push({ ...c, ok:false }); sfx('tap'); i++; show(); };
    body.querySelector('.btn-main').onclick = () => { res.push({ ...c, ok:true }); sfx('pop'); buzz(15); i++; show(); };
  };
  const finish = () => {
    const ok = res.filter(r=>r.ok).length;
    body.innerHTML = `<div class="fl-done"><div style="font-size:60px">${ok>=deck.length*.8?'🏆':ok>=deck.length/2?'🌟':'🌱'}</div><b>${deck.length}개 중 ${ok}개!</b>
      <p>읽은 글자는 진도표에서 한 단계씩 올려둘까요?</p>
      <div class="fl-res">${res.map(r=>`<span class="${r.ok?'ok':''}">${esc(r.ch)}</span>`).join('')}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:26px">
        <button class="btn-main" id="flApply" ${ok?'':'disabled'}>읽은 글자 한 단계 올리기</button>
        <button class="btn-ghost" id="flAgain">한 번 더 하기</button></div></div>`;
    if (ok){ const r = relRect(body.querySelector('.fl-done div')); burst(r.cx, r.cy, 30); sfx('fan'); }
    $('flApply').onclick = () => {
      res.filter(r=>r.ok).forEach(r => { P[r.id] = Math.min(3, (P[r.id]||0)+1); });
      store.set(PKEY, P); document.querySelectorAll('#vProg .lc[data-id]').forEach(paint); score(); popPage(); toast(`<b>${ok}글자</b> 진도표에 반영했어요`);
    };
    $('flAgain').onclick = () => { popPage(); setTimeout(openPractice, 330); };
  };
  pushPage({ title:'섞어서 읽기 연습', body });
  show();
}

/* ---------------------------------------------------------
   30일 체크리스트
   --------------------------------------------------------- */
const CKEY = 'hangul30_done', MKEY = 'hangul30_memo';
let C = new Set(store.get(CKEY, []));

function buildCheck(){
  const v = $('vCheck');
  v.innerHTML = `
    <div class="vh"><div><small>하루 10분, 놀이처럼</small><h2>30일 뒤, <em>'엄마'</em>라고<br>읽어볼까요?</h2></div></div>
    <div class="score3">
      <div><small>완료한 날</small><b id="ck1">0</b></div>
      <div><small>최장 연속</small><b id="ck2">0</b></div>
      <div><small>남은 날</small><b id="ck3">30</b></div>
    </div>
    <div class="pbar"><i id="ckBar"></i></div>
    <div class="ck-rules"><div><b>1</b>하루 10분만</div><div><b>2</b>싫다면 멈추기</div><div><b>3</b>잘한 것만 기록</div></div>
    <div id="ckWeeks"></div>
    <div class="memo-box field"><span>30일 동안 제일 좋았던 순간</span><textarea class="inp" id="ckMemo" maxlength="300" placeholder="예) D+9에 '마'를 처음 읽고 '엄마 마!' 하며 웃었다">${esc(store.get(MKEY,''))}</textarea></div>
    <div class="print-row"><button class="btn-sub" id="ckPrint">종이로 출력하기</button><button class="btn-sub" id="ckReset">체크 초기화</button></div>`;
  const wrap = $('ckWeeks');
  D.WEEKS.forEach((w, wi) => {
    wrap.appendChild(h('div','wk-h',`<small>${w.n}</small><b>${w.t}</b><em data-wk="${wi}"></em>`));
    const list = h('div','days');
    for (let d = w.from; d <= w.to; d++){
      const m = D.MISSIONS[d-1];
      const b = h('button','dayc'+(m.rest?' rest':'')+(m.goal?' goal':''), `<span class="dn">D+${d}</span><span class="dt"><b>${esc(m.t)}</b><small>${esc(m.s)}</small></span><span class="bx"></span>`);
      b.dataset.day = d; b.dataset.wk = wi;
      b.onclick = () => toggleDay(d, b);
      list.appendChild(b);
    }
    wrap.appendChild(list);
  });
  let mt; $('ckMemo').oninput = e => { clearTimeout(mt); mt = setTimeout(()=>store.set(MKEY, e.target.value), 300); };
  $('ckPrint').onclick = () => window.open('../30일 체크리스트.html', '_blank');
  $('ckReset').onclick = async () => { if (!await confirmBox('체크를 초기화할까요?', '30일 체크가 모두 지워져요. 스티커판은 그대로예요.', '초기화', true)) return; C = new Set(); saveC(); paintCheck(); };
  paintCheck();
}
function saveC(){ store.set(CKEY, [...C].sort((a,b)=>a-b)); }
async function toggleDay(d, b){
  if (C.has(d)){ C.delete(d); sfx('tap'); }
  else {
    C.add(d); sfx('pop'); buzz(15);
    const bx = b.querySelector('.bx'); bx.classList.remove('pop'); void bx.offsetWidth; bx.classList.add('pop');
    const r = relRect(bx); burst(r.cx, r.cy, 10);
  }
  saveC(); paintCheck();
  // sticker link
  const st = window.HG_STICKER?.state;
  if (C.has(d) && st && st.stickers.length === d-1 && st.stickers.length < 30){
    if (await confirmBox(`D+${d} 완료!`, `${st.name}${'이'}랑 스티커 뽑으러 갈까요?`.replace(/(.)(이)랑/, (m,a)=>{ const c=a.charCodeAt(0)-0xAC00; return a+(c>=0&&c%28?'이':'')+'랑'; }), '스티커 뽑기')) window.HG_STICKER.open();
  }
}
function paintCheck(){
  const st = window.HG_STICKER?.state;
  const cur = st ? st.stickers.length+1 : 0;
  document.querySelectorAll('#vCheck .dayc').forEach(b => {
    const d = +b.dataset.day; b.classList.toggle('done', C.has(d)); b.classList.toggle('cur', d === cur && !C.has(d));
    b.querySelector('.tag')?.remove();
    if (d === cur && !C.has(d)) b.querySelector('.bx').insertAdjacentHTML('beforebegin','<span class="tag">오늘</span>');
  });
  let best = 0, run = 0; for (let d = 1; d <= 30; d++){ run = C.has(d) ? run+1 : 0; best = Math.max(best, run); }
  setNum($('ck1'), `${C.size}<span>/30</span>`, C.size);
  setNum($('ck2'), `${best}<span>일</span>`, best);
  setNum($('ck3'), `${30-C.size}<span>일</span>`, 30-C.size);
  $('ckBar').style.width = (C.size/30*100)+'%';
  document.querySelectorAll('#vCheck .wk-h em').forEach(em => {
    const w = D.WEEKS[+em.dataset.wk]; let n = 0; for (let d = w.from; d <= w.to; d++) if (C.has(d)) n++;
    const all = w.to-w.from+1; em.textContent = `${n} / ${all}${n===all?' 완료!':''}`; em.classList.toggle('full', n===all);
  });
}

document.addEventListener('DOMContentLoaded', () => { buildProgress(); buildCheck(); });
HG.bus.on('sticker:changed', () => { if ($('ck1')) paintCheck(); });
HG.registerTab('prog', { onShow(){ P = store.get(PKEY, {}); document.querySelectorAll('#vProg .lc[data-id]').forEach(paint); score(); } });
HG.registerTab('check', { onShow(){ C = new Set(store.get(CKEY, [])); paintCheck();
  const cur = document.querySelector('#vCheck .dayc.cur'); if (cur){ const v = $('vCheck'); v.scrollTop = Math.max(0, cur.offsetTop - v.clientHeight/2); } } });
window.HG_LEARN = { progress: () => ({ cons: tally(CHO.map((_,i)=>'c'+i)).done, ga: tally(CHO.map((_,i)=>`s${i}_0`)).done, all: tally(allKeys()).done }), checks: () => C.size };
})();
