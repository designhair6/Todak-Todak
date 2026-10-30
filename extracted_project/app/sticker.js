/* ===== sticker tab ===== */
(() => {
const { $, h, esc, today, dayDiff, store, settings, sfx, buzz, toast, confirmBox, openSheet, closeSheets, actionSheet, pushPage, popPage, burst, relRect } = HG;
const D = HG_DATA;
const KEY = 'hangul_app_sticker';
const DEF_MSG = '30일 동안 정말 멋졌어!';

let S = store.get(KEY, null);
if (!S) { // migrate from older standalone board
  const old = store.get('hangul_sticker_v1', null);
  if (old && old.name) S = { name:old.name, friend:'bear', theme:'home', wish:old.wish, msg:old.msg||DEF_MSG, stickers:[], stamped:false, doneDate:null, book:{} };
}
const save = () => store.set(KEY, S);
const theme = () => D.THEMES.find(t => t.id === S.theme) || D.THEMES[0];
const friend = () => D.FRIENDS.find(f => f.id === S.friend) || D.FRIENDS[0];
const josa = (n, a, b) => { const c = n.charCodeAt(n.length-1)-0xAC00; return (c>=0 && c%28) ? a : b; };
const call = n => n + josa(n, '아', '야');

/* ---------- sticker element ---------- */
function stk(s){
  const d = h('div', 'stk' + (s.rare ? ' shiny' : ''));
  d.style.setProperty('--r', (s.r||0)+'deg');
  d.innerHTML = `<span style="--bg:${s.bg||'#fde7dc'}">${s.e}</span>`;
  return d;
}

/* ---------- streak ---------- */
function streak(){
  const st = S.stickers; if (!st.length) return 0;
  if (dayDiff(st[st.length-1].d, today()) > 1) return 0;
  let n = 1;
  for (let k = st.length-1; k > 0; k--) { if (dayDiff(st[k-1].d, st[k].d) <= 1) n++; else break; }
  return n;
}
const doneToday = () => S.stickers.length && S.stickers[S.stickers.length-1].d === today();

/* =========================================================
   ONBOARDING (5 steps)
   ========================================================= */
let draft = null, step = 0;
const STEPS = 5;
function openSetup(edit){
  draft = edit && S ? JSON.parse(JSON.stringify(S)) : { name:'', friend:'bear', theme:'home', wish:'', msg:'' };
  step = 0; renderSetup(edit);
  $('stSetup').hidden = false;
}
function renderSetup(edit){
  const el = $('stSetup');
  const dots = Array.from({length:STEPS}, (_,i)=>`<i class="${i<=step?'on':''}"></i>`).join('');
  let body = '', ft = '', canNext = true;
  const fr = D.FRIENDS.find(f=>f.id===draft.friend) || D.FRIENDS[0];
  if (step === 0){
    body = `<div class="pill">아이랑 같이 해요</div>
      <h2 class="su-h" style="margin-top:14px">우리 아이<br><em>이름</em>을 알려주세요</h2>
      <p class="su-p">스티커판과 소원권에 이름이 들어가요</p>
      <input class="inp big-name" id="suName" maxlength="6" placeholder="예) 시아" value="${esc(draft.name)}" autocomplete="off">`;
    canNext = !!draft.name.trim();
  } else if (step === 1){
    body = `<h2 class="su-h">${esc(draft.name)}${josa(draft.name,'이','')}랑 같이 갈<br><em>친구</em>를 골라요</h2>
      <p class="su-p">친구가 매일 응원해 주고, 스티커 붙이면 같이 춤춰요</p>
      <div class="opt-grid" id="suFriends">${D.FRIENDS.map(f=>`<button class="opt ${f.id===draft.friend?'on':''}" data-id="${f.id}"><span class="e">${f.e}</span><b>${f.name}</b></button>`).join('')}</div>`;
  } else if (step === 2){
    body = `<h2 class="su-h">어떤 <em>세상</em>에서<br>모험할까요?</h2>
      <p class="su-p">테마마다 배경과 스티커가 달라져요</p>
      <div class="opt-grid" id="suThemes">${D.THEMES.map(t=>`<button class="opt theme ${t.id===draft.theme?'on':''}" data-id="${t.id}"><div class="sw" style="background:${t.bg}">${t.pack.slice(0,3).join('')}</div><b>${t.name}</b><small>${t.sub}</small></button>`).join('')}</div>`;
  } else if (step === 3){
    body = `<h2 class="su-h">30칸 다 채우면<br><em>엄마가 들어줄 소원</em></h2>
      <p class="su-p">${esc(draft.name)}${josa(draft.name,'이','')}가 직접 고르게 해주세요</p>
      <div class="chips" id="suWishes" style="margin-top:20px">${D.WISHES.map(w=>`<button class="chip ${w===draft.wish?'on':''}">${w}</button>`).join('')}</div>
      <div class="field" style="margin-top:14px"><input class="inp" id="suWish" maxlength="20" placeholder="직접 쓰기 (예: 알라딘 타기)" value="${D.WISHES.includes(draft.wish)?'':esc(draft.wish)}" autocomplete="off"></div>
      <div class="field" style="margin-top:18px"><span>엄마 한마디 <small>(소원권에 들어가요)</small></span><input class="inp" id="suMsg" maxlength="30" placeholder="${DEF_MSG}" value="${esc(draft.msg===DEF_MSG?'':draft.msg)}" autocomplete="off"></div>`;
    canNext = !!draft.wish.trim();
  } else {
    body = `<h2 class="su-h" style="text-align:center">손가락 약속!</h2>
      <p class="su-p" style="text-align:center">아이랑 엄마 손가락을 같이 대고<br>버튼을 꾹 누르고 있어요</p>
      <div class="promise"><div style="font-size:54px">${fr.e}</div>
        <div class="pm">${esc(draft.name)}${josa(draft.name,'이','')}가 30칸을 다 채우면</div>
        <div class="pw">${esc(draft.wish)}</div>
        <div class="pm">엄마가 꼭 들어줄게!</div></div>`;
    ft = `<button class="hold" id="suHold"><i></i><span>꾹 눌러서 약속하기</span></button>`;
  }
  if (!ft) ft = `<button class="btn-main" id="suNext" ${canNext?'':'disabled'}>${edit && step===3 ? '저장하고 끝내기' : '다음'}</button>`;
  el.innerHTML = `<div class="su-top"><button class="su-back" id="suBack">${step===0 ? (S?'×':'') : '‹'}</button><div class="su-dots">${dots}</div></div>
    <div class="su-body">${body}</div><div class="su-ft">${ft}</div>`;

  $('suBack').onclick = () => { if (step===0){ if (S) $('stSetup').hidden = true; } else { step--; renderSetup(edit); } };
  const nb = $('suNext');
  if (nb) nb.onclick = () => {
    sfx('tap');
    if (edit && step === 3){ commitDraft(); return; }
    step++; renderSetup(edit);
  };
  if (step === 0){ const i = $('suName'); i.oninput = () => { draft.name = i.value; nb.disabled = !i.value.trim(); }; setTimeout(()=>i.focus(),100); i.onkeydown = e => { if (e.key==='Enter' && !nb.disabled) nb.click(); }; }
  if (step === 1) $('suFriends').onclick = e => { const b = e.target.closest('.opt'); if (!b) return; draft.friend = b.dataset.id; sfx('pop'); renderSetup(edit); };
  if (step === 2) $('suThemes').onclick = e => { const b = e.target.closest('.opt'); if (!b) return; draft.theme = b.dataset.id; sfx('pop'); renderSetup(edit); };
  if (step === 3){
    $('suWishes').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; draft.wish = b.textContent; $('suWish').value=''; renderSetup(edit); };
    $('suWish').oninput = e => { draft.wish = e.target.value; document.querySelectorAll('#suWishes .chip').forEach(c=>c.classList.toggle('on', c.textContent===draft.wish)); nb.disabled = !draft.wish.trim(); };
    $('suMsg').oninput = e => { draft.msg = e.target.value; };
  }
  if (step === 4){
    const b = $('suHold'), bar = b.querySelector('i'); let t0 = 0, raf = 0;
    const tick = () => { const p = Math.min(1, (performance.now()-t0)/1200); bar.style.width = p*100+'%'; if (p >= 1){ stop(); buzz([30,40,60]); sfx('fan'); commitDraft(true); return; } raf = requestAnimationFrame(tick); };
    const start = e => { e.preventDefault(); t0 = performance.now(); buzz(15); raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); if (parseFloat(bar.style.width) < 100) bar.style.width = '0'; };
    b.addEventListener('pointerdown', start); b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
  }
}
function commitDraft(isNew){
  const wasNew = !S;
  draft.name = draft.name.trim(); draft.wish = draft.wish.trim(); draft.msg = (draft.msg||'').trim() || DEF_MSG;
  if (S) Object.assign(S, { name:draft.name, friend:draft.friend, theme:draft.theme, wish:draft.wish, msg:draft.msg });
  else S = { ...draft, stickers:[], stamped:false, doneDate:null, book:{}, started:today() };
  save(); $('stSetup').hidden = true; buildScene(); render(true);
  if (isNew || wasNew){ const r = relRect($('stScene')); burst(r.cx, r.cy, 40); say(`안녕 ${call(S.name)}! 나는 ${friend().name}! 오늘부터 같이 하자!`, 4200); fJump('dance'); }
  else toast('<b>저장!</b> 바꾼 내용이 적용됐어요');
}

/* =========================================================
   BOARD
   ========================================================= */
const order = []; for (let r=0;r<6;r++) for (let k=0;k<5;k++) order.push({ r, c: r%2===0 ? k : 4-k });

function buildScene(){
  const v = $('vSticker'); v.dataset.theme = S.theme;
  const sc = $('stScene'); sc.style.background = theme().bg;
  sc.querySelectorAll('.deco').forEach(e=>e.remove());
  const pos = [[6,4],[78,3],[44,1],[88,42],[2,52],[60,88]];
  theme().deco.forEach((e,i) => { const d = h('div','deco',e); d.style.left = pos[i][0]+'%'; d.style.top = pos[i][1]+'%'; d.style.fontSize = (i%2?22:28)+'px'; sc.insertBefore(d, sc.firstChild); });
  const g = $('stGrid'); g.innerHTML = '';
  order.forEach((p,i) => {
    const day = i+1, c = h('div', 'cell'+([7,14,21].includes(day)?' ms':'')+(day===30?' goal':''));
    c.style.gridRow = p.r+1; c.style.gridColumn = p.c+1; c.dataset.day = day;
    c.innerHTML = `<span class="num">${day===30?'🎁':day}</span>`;
    c.onclick = () => tapCell(day);
    g.appendChild(c);
  });
  $('stFriend').textContent = friend().e;
}
function drawPath(){
  const svg = $('stPath'), w = svg.parentElement.getBoundingClientRect(); if (!w.width) return;
  const pts = [...$('stGrid').children].sort((a,b)=>a.dataset.day-b.dataset.day).map(c => { const r = c.getBoundingClientRect(); return [r.left+r.width/2-w.left, r.top+r.height/2-w.top]; });
  const n = S ? S.stickers.length : 0;
  const P = a => a.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const base = S && S.theme==='space' ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.75)';
  svg.innerHTML = `<path d="${P(pts)}" fill="none" stroke="${base}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
    (n>1 ? `<path d="${P(pts.slice(0,n))}" fill="none" stroke="#f0a88e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 12"/>` : '');
}
function render(bump){
  if (!S) return;
  const n = S.stickers.length;
  $('stWho').innerHTML = `<span class="fr">${friend().e}</span>${esc(S.name)}의 스티커판`;
  const cb = $('stCnt'); cb.textContent = n; if (bump){ cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
  $('stBar').style.width = (n/30*100)+'%';
  const st = streak(); $('stStreak').innerHTML = `${st>=3?'🔥':'🌱'} ${st}일 연속`; $('stStreak').classList.toggle('hot', st>=3);
  [...$('stGrid').children].forEach(c => {
    const day = +c.dataset.day, s = S.stickers[day-1];
    c.classList.toggle('filled', !!s); c.classList.toggle('today', !s && day===n+1);
    const old = c.querySelector('.stk');
    if (s && !old) c.appendChild(stk(s));
    if (!s && old) old.remove();
  });
  const blocked = settings.oneADay && doneToday();
  if (n < 30){
    const m = D.MISSIONS[n];
    $('stMDay').textContent = blocked ? '오늘 완료' : `D+${n+1}`;
    $('stMTxt').textContent = blocked ? `내일은 ${m.t}` : `${m.t} · ${m.s}`;
    $('stMission').classList.toggle('done', !!blocked);
  } else { $('stMDay').textContent = '완주'; $('stMTxt').textContent = '30일 모두 해냈어요!'; $('stMission').classList.add('done'); }
  $('stGiftWish').textContent = S.wish;
  $('stGiftLock').textContent = n>=30 ? (S.stamped ? '소원 완료!' : '지금 열 수 있어요') : `${30-n}칸 남음`;
  $('stGift').classList.toggle('ready', n>=30);
  $('stGiftEdit').hidden = !!S.stamped;
  const btn = $('stBtn');
  if (n >= 30){ btn.textContent = S.stamped ? '소원권 다시 보기' : '🎁 소원 상자 열기'; btn.disabled = false; }
  else if (blocked){ btn.textContent = '내일 또 만나요 🌙'; btn.disabled = true; }
  else { btn.textContent = `D+${n+1} 스티커 뽑기`; btn.disabled = false; }
  $('stBookN').textContent = Object.keys(S.book||{}).length;
  requestAnimationFrame(drawPath);
}

/* ---------- friend ---------- */
let bt;
function say(txt, ms=2600){ const b = $('stBubble'); b.textContent = txt; b.classList.remove('hide'); clearTimeout(bt); bt = setTimeout(()=>b.classList.add('hide'), ms); }
function fJump(kind='jump'){ const f = $('stFriend'); f.classList.remove('jump','dance'); void f.offsetWidth; f.classList.add(kind); }
function greet(){
  if (!S) return;
  const n = S.stickers.length, nm = call(S.name), m = D.MISSIONS[Math.min(n,29)];
  let t;
  if (n >= 30) t = S.stamped ? `${nm}, 소원 이뤘지? 최고야!` : `${nm}! 선물 상자 열어보자!`;
  else if (doneToday()) t = `오늘도 해냈어! 내일 또 만나 ${S.name}!`;
  else if (n === 0) t = `${nm}, 첫 번째 스티커 붙이러 가자!`;
  else if (n === 29) t = `딱 한 칸 남았어! ${m.t}!`;
  else if (m.rest) t = `오늘은 쉬는 날! ${m.s} 하고 스티커 받자`;
  else t = [`${nm}, 오늘은 '${m.t}' 하는 날!`, `어제보다 한 칸 더! 할 수 있어 ${S.name}!`, `${30-n}칸만 더 가면 ${S.wish}!`][n%3];
  say(t, 3600);
}
const TAPLINES = ['간지러워~ 히히','같이 하니까 좋다!','스티커 모으자!','오늘 글자 뭐야?','나도 읽을래!','우와 벌써 이만큼!'];
function tapFriend(){ sfx('pop'); buzz(10); fJump(); say(TAPLINES[Math.floor(Math.random()*TAPLINES.length)]); }

function tapCell(day){
  const n = S.stickers.length, s = S.stickers[day-1];
  if (s){ sfx('pop'); const c = $('stGrid').querySelector(`.cell[data-day="${day}"] .stk`); c?.animate([{transform:`rotate(${s.r}deg) scale(1)`},{transform:`rotate(${s.r}deg) scale(1.25)`},{transform:`rotate(${s.r}deg) scale(1)`}],{duration:350}); say(`D+${day} ${D.MISSIONS[day-1].t} ${s.rare?'✨반짝 스티커!':'잘했어!'}`); return; }
  if (day === n+1) { openPick(); return; }
  sfx('shake'); say(day===30 ? `여기 오면 ${S.wish}!` : `여긴 D+${day}! ${day-n}칸 더 가야 해`);
}

/* =========================================================
   PICK (3 cards, flip one)
   ========================================================= */
let picking = false;
function openPick(){
  if (picking) return;
  const n = S.stickers.length;
  if (n >= 30){ openFinale(); return; }
  if (settings.oneADay && doneToday()){ sfx('no'); say('오늘 스티커는 받았어! 내일 또 만나'); return; }
  picking = true; sfx('tap');
  const pack = theme().pack, m = D.MISSIONS[n];
  const choices = [0,1,2].map(() => {
    const rare = Math.random() < 0.12;
    const e = rare ? D.RARE[Math.floor(Math.random()*D.RARE.length)] : pack[Math.floor(Math.random()*pack.length)];
    return { e, rare, bg: D.BG[Math.floor(Math.random()*D.BG.length)], r: Math.round(Math.random()*16-8) };
  });
  const p = h('div','pick');
  p.innerHTML = `<div class="pick-k">D+${n+1} 미션</div><div class="pick-t">${esc(m.t)}</div><div class="pick-s">${esc(m.s)} · 10분 같이 했나요?</div>
    <div class="cards">${choices.map((c,i)=>`<div class="card wobble" data-i="${i}" style="animation-delay:${i*.12}s"><div class="f">?</div><div class="b"></div></div>`).join('')}</div>
    <div class="pick-name">카드를 하나 골라봐!</div>
    <button class="btn-main" hidden>스티커판에 붙이기</button>
    <button class="pick-skip">아직 안 했어요</button>`;
  $('app').appendChild(p);
  p.querySelectorAll('.card').forEach((cd,i) => cd.querySelector('.b').appendChild(stk(choices[i])));
  let chosen = null;
  p.querySelector('.cards').onclick = e => {
    const cd = e.target.closest('.card'); if (!cd || chosen) return;
    chosen = choices[+cd.dataset.i];
    p.querySelectorAll('.card').forEach(x => { x.classList.remove('wobble'); if (x !== cd) x.classList.add('dim'); });
    cd.classList.add('flip'); buzz(25);
    setTimeout(() => {
      sfx(chosen.rare ? 'rare' : 'pop');
      const r = relRect(cd); burst(r.cx, r.cy, chosen.rare ? 34 : 12, chosen.rare ? ['#f2c14e','#fff4c2','#f0a88e'] : null);
      p.querySelector('.pick-name').innerHTML = chosen.rare ? `<em>✨ 반짝반짝 희귀 스티커!</em>` : `${chosen.e} 이거 붙이자!`;
      p.querySelector('.btn-main').hidden = false; p.querySelector('.pick-skip').hidden = true;
    }, 420);
  };
  p.querySelector('.btn-main').onclick = () => { const cd = p.querySelector('.card.flip .stk'); place(chosen, cd, p); };
  p.querySelector('.pick-skip').onclick = () => { p.remove(); picking = false; say('괜찮아! 하고 나서 다시 오자'); };
}
function place(s, srcEl, overlay){
  const n = S.stickers.length, day = n+1;
  const target = $('stGrid').querySelector(`.cell[data-day="${day}"]`);
  const mid = $('stMid'), mr = mid.getBoundingClientRect(), tr = target.getBoundingClientRect();
  if (tr.top < mr.top || tr.bottom > mr.bottom) mid.scrollTop += (tr.top+tr.height/2)-(mr.top+mr.height/2);
  const a = relRect(srcEl), b = relRect(target);
  const fly = stk(s); fly.style.cssText += `;position:absolute;left:0;top:0;width:${a.w}px;height:${a.h}px;--fs:36px;z-index:80`;
  $('fx').appendChild(fly);
  overlay.style.transition = 'opacity .25s'; overlay.style.opacity = 0; setTimeout(()=>overlay.remove(), 260);
  const sc = (b.w+12)/a.w, x1 = b.x-6, y1 = b.y-6;
  fly.animate([
    { transform:`translate(${a.x}px,${a.y}px) scale(1) rotate(${s.r}deg)` },
    { transform:`translate(${(a.x+x1)/2}px,${Math.min(a.y,y1)-90}px) scale(${(1+sc)/2*1.25}) rotate(${s.r+180}deg)`, offset:.55 },
    { transform:`translate(${x1}px,${y1}px) scale(${sc}) rotate(${s.r+360}deg)` }
  ], { duration:700, easing:'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => {
    fly.remove();
    S.stickers.push({ ...s, d: today() });
    S.book = S.book || {}; S.book[s.e] = (S.book[s.e]||0) + 1;
    if (S.stickers.length === 30) S.doneDate = today();
    save(); render(true); HG.bus.emit('sticker:changed');
    target.querySelector('.stk')?.classList.add('land');
    burst(b.cx, b.cy, day===30 ? 44 : 16);
    sfx(day===30 || [7,14,21].includes(day) ? 'fan' : 'stick'); buzz(30);
    fJump('dance');
    const MS = { 7:'1주 완주! 별 칸 도착 ⭐', 14:'벌써 반이나 왔어!', 21:'3주 성공! 9칸 남았어', 29:'딱 한 칸 남았어!!' };
    say(MS[day] || [`${call(S.name)}, 최고야!`, '짝짝짝! 해냈다!', `${S.wish}까지 ${30-day}칸!`, '오늘도 한 칸 전진!'][day%4], 3000);
    if (MS[day]) toast(`<b>D+${day}</b> ${MS[day]}`);
    picking = false;
    if (day === 30) setTimeout(openFinale, 1300);
  };
}

/* =========================================================
   STICKER BOOK
   ========================================================= */
function openBook(){
  sfx('tap');
  const got = S.book || {};
  const body = h('div');
  const total = D.THEMES.reduce((a,t)=>a+t.pack.length,0) + D.RARE.length;
  body.innerHTML = `<div class="book-hd"><div class="pill">모은 스티커 ${Object.keys(got).length} / ${total}</div>
    <p class="su-p">스티커를 뽑을 때마다 도감에 모여요. 테마를 바꾸면 새 스티커가 나와요!</p></div>`;
  const sec = (title, sub, list, rare) => {
    body.appendChild(h('div','book-pack',`${title} <small>${sub}</small>`));
    const g = h('div','book-grid');
    list.forEach(e => { const it = h('div','book-it'+(got[e]?'':' locked')); it.appendChild(stk({ e, rare, bg:'#fff4e8' })); it.appendChild(h('small','', got[e] ? `×${got[e]}` : '???')); g.appendChild(it); });
    body.appendChild(g);
  };
  sec('✨ 반짝 희귀', '뽑을 때 가끔 나와요', D.RARE, true);
  D.THEMES.forEach(t => sec(t.name, t.id===S.theme?'지금 테마':'', t.pack));
  pushPage({ title:'스티커 도감', body });
}

/* =========================================================
   MENU
   ========================================================= */
function openMenu(){
  actionSheet('엄마 메뉴', [
    { icon:'🎁', label:`소원 바꾸기 (${S.wish})`, run: openWish },
    { icon:'🎨', label:'친구 · 테마 · 이름 바꾸기', run: () => { openSetup(true); step = 0; renderSetup(true); } },
    { icon:'📖', label:'스티커 도감 보기', run: openBook },
    { icon:'↩️', label:'마지막 스티커 떼기', run: async () => {
        if (!S.stickers.length) return toast('뗄 스티커가 없어요');
        if (!await confirmBox('마지막 스티커를 뗄까요?', `D+${S.stickers.length} 스티커가 떨어져요.`, '떼기', true)) return;
        const s = S.stickers.pop(); if (S.book && S.book[s.e]) { S.book[s.e]--; if (!S.book[s.e]) delete S.book[s.e]; }
        S.doneDate = null; S.stamped = false; save(); render(true); HG.bus.emit('sticker:changed'); toast('스티커 한 장을 뗐어요'); } },
    { icon:'👀', label:'마지막 날 미리보기 (29칸 채우기)', run: async () => {
        if (S.stickers.length < 29 && !await confirmBox('마지막 날 미리보기', '빈칸을 29칸까지 임시 스티커로 채워요. 마지막 스티커 떼기로 되돌릴 수 있어요.', '채우기')) return;
        const pack = theme().pack;
        while (S.stickers.length < 29){ const d = new Date(); d.setDate(d.getDate()-(29-S.stickers.length)); S.stickers.push({ e: pack[S.stickers.length%pack.length], bg: D.BG[S.stickers.length%D.BG.length], r: Math.round(Math.random()*16-8), d: HG.ymd(d) }); }
        save(); render(true); HG.bus.emit('sticker:changed'); say('딱 한 칸 남았어!'); } },
    { icon:'🗑️', label:'처음부터 다시', danger:true, run: async () => {
        if (!await confirmBox('처음부터 다시 할까요?', '스티커, 이름, 소원이 모두 지워져요.', '모두 지우기', true)) return;
        store.del(KEY); S = null; HG.bus.emit('sticker:changed'); openSetup(false); } }
  ]);
}
function openWish(){
  const s = $('wishSheet');
  let pick = D.WISHES.includes(S.wish) ? S.wish : '';
  s.innerHTML = `<div class="grab"></div><div class="sh-t">소원 바꾸기</div><p class="sh-sub">아이랑 같이 골라요. 30칸을 채우면 이 소원권이 나와요.</p>
    <div class="chips" id="wsChips"></div>
    <div class="field" style="margin-top:12px"><input class="inp" id="wsWish" maxlength="20" placeholder="직접 쓰기 (예: 알라딘 타기)" value="${pick?'':esc(S.wish)}"></div>
    <div class="field" style="margin-top:12px"><span>엄마 한마디</span><input class="inp" id="wsMsg" maxlength="30" placeholder="${DEF_MSG}" value="${esc(S.msg===DEF_MSG?'':S.msg)}"></div>
    <button class="btn-main" id="wsSave" style="margin-top:16px">소원 저장하기</button>`;
  const chips = () => { $('wsChips').innerHTML = D.WISHES.map(w=>`<button class="chip ${w===pick?'on':''}">${w}</button>`).join(''); };
  chips();
  $('wsChips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; pick = b.textContent; $('wsWish').value=''; chips(); };
  $('wsWish').oninput = () => { if ($('wsWish').value.trim()){ pick=''; chips(); } };
  $('wsSave').onclick = () => {
    const w = $('wsWish').value.trim() || pick; if (!w) return toast('소원을 골라주세요');
    S.wish = w; S.msg = $('wsMsg').value.trim() || DEF_MSG; save(); closeSheets(); render();
    if (!$('stFinale').hidden) fillCoupon();
    toast('<b>소원 변경!</b> '+esc(w)); say(`우와! ${w}!`);
  };
  openSheet('wishSheet');
}

/* =========================================================
   FINALE
   ========================================================= */
let taps = 0;
function fillCoupon(){
  $('cpTo').textContent = `${S.name}에게`; $('cpWish').textContent = S.wish; $('cpMsg').textContent = S.msg;
  $('cpDate').textContent = (S.doneDate||today()).slice(5).replace('-','.');
  $('cpEdit').hidden = !!S.stamped;
}
function openFinale(){
  $('stFinale').hidden = false; taps = 0;
  $('finH').innerHTML = `${esc(call(S.name))},<br>정말 해냈어!`; $('finFr').textContent = friend().e;
  fillCoupon();
  if (S.stamped){ $('finStage').hidden = true; $('cpWrap').hidden = false; $('stamp').classList.add('on'); $('stampBtn').hidden = true; }
  else { $('finStage').hidden = false; $('cpWrap').hidden = true; $('stamp').classList.remove('on'); $('stampBtn').hidden = false; $('finTap').textContent = '상자를 3번 콕콕 눌러봐'; }
}

/* ---------- wiring ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('stFriend').onclick = tapFriend;
  $('stBtn').onclick = () => S.stickers.length >= 30 ? openFinale() : openPick();
  $('stMission').onclick = () => HG.go('check');
  $('stGift').onclick = e => {
    if (e.target.closest('#stGiftEdit')) return;
    if (S.stickers.length >= 30) return openFinale();
    sfx('shake'); $('stGiftBox').animate([{transform:'rotate(0)'},{transform:'rotate(-14deg)'},{transform:'rotate(12deg)'},{transform:'rotate(0)'}],{duration:420});
    say(`${30-S.stickers.length}칸 더 모으면 열 수 있어!`);
  };
  $('stGiftEdit').onclick = openWish;
  $('stMenu').onclick = openMenu;
  $('stBook').onclick = openBook;
  $('finBox').onclick = () => {
    taps++; const b = $('finBox');
    if (taps < 3){ b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); sfx('shake'); buzz(20); $('finTap').textContent = taps===1 ? '한 번 더!' : '마지막으로 콕!'; return; }
    b.classList.add('boom'); const r = relRect(b); burst(r.cx, r.cy, 80); sfx('fan'); buzz([30,40,60]);
    setTimeout(() => { $('finStage').hidden = true; $('cpWrap').hidden = false; b.classList.remove('boom','shake'); }, 450);
  };
  $('stampBtn').onclick = () => {
    S.stamped = true; save(); $('stamp').classList.add('on'); $('stampBtn').hidden = true; $('cpEdit').hidden = true;
    setTimeout(() => { const r = relRect($('stamp')); burst(r.cx, r.cy, 30); sfx('ok'); }, 260); buzz(60); render();
  };
  $('cpEdit').onclick = openWish;
  $('cpBack').onclick = () => { $('stFinale').hidden = true; render(); greet(); };
  $('cpAgain').onclick = async () => {
    if (!await confirmBox('새 30일을 시작할까요?', '스티커판은 비워지고 도감은 그대로 남아요. 새 소원을 정해요!', '새로 시작')) return;
    S.stickers = []; S.stamped = false; S.doneDate = null; S.wish = ''; save(); $('stFinale').hidden = true;
    openSetup(true); step = 3; renderSetup(true); HG.bus.emit('sticker:changed');
  };
  addEventListener('resize', () => { if (HG.curTab === 'sticker') drawPath(); });
  if (S){ buildScene(); render(); } else openSetup(false);
});

HG.registerTab('sticker', {
  onShow(){ if (S){ render(); setTimeout(greet, 350); } },
  onReselect(){ greet(); }
});
window.HG_STICKER = { get state(){ return S; }, open: () => { HG.go('sticker'); setTimeout(openPick, 300); }, streak: () => S ? streak() : 0 };
})();
