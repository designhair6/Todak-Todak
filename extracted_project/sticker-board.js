(() => {
const KEY = 'hangul_sticker_v1';
const MISSIONS = [
  "'ㄱ' 카드 보여주기","'ㄴ' 찾기 놀이","이름 첫 글자 따라 쓰기","ㄷ ㅁ 몸으로 만들기","ㅇ 동그라미 찾기 산책","자음 카드 짝 맞추기","쉬는 날 · 그림책 한 권",
  "'ㅏ' 소리 내기","ㅁ+ㅏ = 마","가 나 다 카드 짚기","ㅗ ㅜ 방향 놀이","고 노 도 블록 쌓기","소리 빙고","쉬는 날 · 간판 글자 찾기",
  "'ㅣ'와 '이'","'나무' 읽기","'우유' 이름표 붙이기","아기 · 기차 짝 맞추기","모자 · 바다 그림 그리기","글자 보물찾기","쉬는 날 · 단어 다시 보기",
  "ㅁ 받침 맛보기","'엄' 소리 내기","곰 · 밤 단어 모으기","ㅇ 받침 강 · 공 · 방","내 이름 읽기","가족 이름표 붙이기","쉬는 날 · 간판 읽기 산책",
  "좋아하는 카드 5장 고르기","'엄마' 읽기!"
];
const WISHES = ["놀이공원 가기","원하는 장난감","하루 종일 엄마랑 놀기","치킨 파티","키즈카페","늦게 자기 하루"];
const STICKERS = [
  ['⭐','#fff1c7'],['🐻','#f6e3d2'],['🍓','#fde0dc'],['🚂','#dfe9f6'],
  ['🌈','#efe6fb'],['🐰','#fbe7ee'],['🦖','#e2f2dc'],['🍦','#fff0e3'],
  ['🚀','#e3eaf7'],['🌻','#fff4cc'],['🐳','#dcefF7'],['👑','#fff1c7']
];
const MS = {7:'1주 완주! 스티커 7개',14:'반이나 왔어! 14개',21:'3주 성공! 이제 9칸',29:'딱 한 칸 남았어!'};

const $ = id => document.getElementById(id);
let S = load();

function load(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || null }catch(e){ return null }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(S)) }
const ymd = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today = () => ymd(new Date());
const dayDiff = (a,b) => Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const josa = n => { const c=n.charCodeAt(n.length-1)-0xAC00; return (c>=0&&c%28) ? '아' : '야' };

/* ---------------- setup ---------------- */
let pickedWish = '';
function renderChips(){
  $('wishChips').innerHTML = '';
  WISHES.forEach(w=>{
    const b=document.createElement('button');b.className='chip'+(w===pickedWish?' on':'');b.textContent=w;
    b.onclick=()=>{pickedWish=w;$('inWish').value='';renderChips();validate()};
    $('wishChips').appendChild(b);
  });
}
function validate(){
  const w = $('inWish').value.trim() || pickedWish;
  $('startBtn').disabled = !($('inName').value.trim() && w);
}
$('inName').oninput = validate;
$('inWish').oninput = ()=>{ if($('inWish').value.trim()){pickedWish='';renderChips()} validate() };
$('startBtn').onclick = ()=>{
  const name=$('inName').value.trim(), wish=$('inWish').value.trim()||pickedWish, msg=$('inMsg').value.trim()||'30일 동안 정말 멋졌어!';
  if(S && S.stickers){ Object.assign(S,{name,wish,msg}) }
  else S = {name,wish,msg,stickers:[],oneADay:false,stamped:false,doneDate:null};
  save(); showBoard();
};
function showSetup(edit){
  $('setup').hidden=false;$('board').hidden=true;$('finale').hidden=true;
  if(edit&&S){ $('inName').value=S.name; $('inMsg').value=S.msg===('30일 동안 정말 멋졌어!')?'':S.msg;
    if(WISHES.includes(S.wish)){pickedWish=S.wish;$('inWish').value=''} else {pickedWish='';$('inWish').value=S.wish}
    $('startBtn').textContent='저장하기' }
  else $('startBtn').textContent='약속하고 시작하기';
  renderChips();validate();
}

/* ---------------- board ---------------- */
const order = []; // snake path: index -> {r,c}
for(let r=0;r<6;r++) for(let k=0;k<5;k++){ const c = r%2===0 ? k : 4-k; order.push({r,c}) }

function stickerEl(s){
  const d=document.createElement('div');d.className='stk';d.style.setProperty('--r',(s.r||0)+'deg');
  const [e,bg]=STICKERS[s.i]||STICKERS[0];
  d.innerHTML=`<span style="--bg:${bg}">${e}</span>`;return d;
}
function buildGrid(){
  const g=$('grid');g.innerHTML='';
  order.forEach((p,i)=>{
    const day=i+1;
    const c=document.createElement('div');
    c.className='cell'+([7,14,21].includes(day)?' ms':'')+(day===30?' goal':'');
    c.style.gridRow=p.r+1;c.style.gridColumn=p.c+1;c.dataset.day=day;
    c.innerHTML=`<span class="num">${day===30?'🎁':day}</span>`;
    g.appendChild(c);
  });
}
function drawPath(){
  const svg=$('pathLine'), wrap=svg.parentElement.getBoundingClientRect();
  const pts=[...$('grid').children].sort((a,b)=>a.dataset.day-b.dataset.day).map(c=>{
    const r=c.getBoundingClientRect();return [r.left+r.width/2-wrap.left, r.top+r.height/2-wrap.top]});
  const n=S?S.stickers.length:0;
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const dDone=pts.slice(0,Math.max(1,n)).map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  svg.innerHTML=`<path d="${d}" fill="none" stroke="#e4dccf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`+
    (n>1?`<path d="${dDone}" fill="none" stroke="#f0a88e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`:'');
}
// 연속 = 끊기지 않고 이어 붙인 스티커 수 (하루 이상 건너뛰면 0부터)
function streak(){
  const st=S.stickers; if(!st.length) return 0;
  if(dayDiff(st[st.length-1].d,today())>1) return 0;
  let n=1;
  for(let k=st.length-1;k>0;k--){ if(dayDiff(st[k-1].d,st[k].d)<=1) n++; else break }
  return n;
}
function render(bump){
  const n=S.stickers.length;
  $('whoTxt').textContent=`${S.name}의 스티커 보드`;
  const cb=$('cnt');cb.textContent=n;if(bump){cb.classList.remove('bump');void cb.offsetWidth;cb.classList.add('bump')}
  $('barFill').style.width=(n/30*100)+'%';
  const st=streak();$('streakTxt').textContent=`${st}일 연속`;$('streak').classList.toggle('hot',st>=3);
  [...$('grid').children].forEach(c=>{
    const day=+c.dataset.day, s=S.stickers[day-1];
    c.classList.toggle('filled',!!s);c.classList.toggle('today',!s&&day===n+1);
    const old=c.querySelector('.stk');
    if(s&&!old) c.appendChild(stickerEl(s));
    if(!s&&old) old.remove();
  });
  const doneToday = S.oneADay && S.stickers.length && S.stickers[n-1].d===today();
  if(n<30){
    $('mDay').textContent=doneToday?'오늘 완료':`D+${n+1}`;
    $('mTxt').textContent=doneToday?`내일은 '${MISSIONS[n]}'`:MISSIONS[n];
    $('mission').classList.toggle('done',!!doneToday);
  } else { $('mDay').textContent='완주'; $('mTxt').textContent='30일 모두 해냈어요!'; $('mission').classList.add('done') }
  $('giftWish').textContent=S.wish;
  $('giftLock').textContent = n>=30 ? (S.stamped?'소원 완료!':'지금 열 수 있어요') : `${30-n}칸 남음`;
  $('setWishNow').textContent='지금 소원: '+S.wish; $('setNameNow').textContent='지금 이름: '+S.name;
  $('giftEdit').hidden=!!S.stamped;
  $('giftCard').classList.toggle('ready',n>=30);
  const btn=$('stickBtn');
  if(n>=30){btn.textContent=S.stamped?'소원권 다시 보기':'🎁 소원 상자 열기';btn.disabled=false}
  else if(doneToday){btn.textContent='내일 또 만나요';btn.disabled=true}
  else {btn.textContent=`D+${n+1} 스티커 붙이기`;btn.disabled=false}
  $('oneADay').checked=!!S.oneADay;
  requestAnimationFrame(drawPath);
}
function showBoard(){
  $('setup').hidden=true;$('finale').hidden=true;$('board').hidden=false;
  if(!$('grid').children.length) buildGrid();
  render();
}

/* ---------------- sticker sheet ---------------- */
function openSheet(id){ $('scrim').hidden=false; $(id).classList.add('open'); $(id).setAttribute('aria-hidden','false') }
function closeSheets(){ $('scrim').hidden=true; document.querySelectorAll('.sheet.open').forEach(s=>{s.classList.remove('open');s.setAttribute('aria-hidden','true')}) }
$('scrim').onclick=closeSheets;

function openTray(){
  const n=S.stickers.length;
  $('sqDay').textContent=`D+${n+1} 미션`;$('sqTxt').textContent=MISSIONS[n];
  const t=$('tray');t.innerHTML='';
  // shuffle 8 of 12
  const pool=[...STICKERS.keys()].sort(()=>Math.random()-.5).slice(0,8);
  pool.forEach(i=>{
    const r=Math.round(Math.random()*16-8);
    const el=stickerEl({i,r});el.setAttribute('role','button');
    el.onclick=()=>place(i,r,el);
    t.appendChild(el);
  });
  openSheet('sheet');
}
let busy=false;
function place(i,r,srcEl){
  if(busy) return; busy=true;
  const n=S.stickers.length, day=n+1;
  const target=$('grid').querySelector(`.cell[data-day="${day}"]`);
  const mid=$('mid'), mr=mid.getBoundingClientRect(), tr=target.getBoundingClientRect();
  if(tr.top<mr.top||tr.bottom>mr.bottom) mid.scrollTop += (tr.top+tr.height/2)-(mr.top+mr.height/2);
  const app=$('app').getBoundingClientRect();
  const a=srcEl.getBoundingClientRect(), b=target.getBoundingClientRect();
  const fly=stickerEl({i,r});fly.classList.add('flyer');
  const size=a.width;fly.style.width=fly.style.height=size+'px';fly.style.setProperty('--fs','34px');
  $('fx').appendChild(fly);
  srcEl.classList.add('gone');
  const x0=a.left-app.left,y0=a.top-app.top;
  const tw=b.width+12, x1=b.left-app.left-6,y1=b.top-app.top-6;
  const sc=tw/size;
  closeSheets();
  const anim=fly.animate([
    {transform:`translate(${x0}px,${y0}px) scale(1) rotate(${r}deg)`},
    {transform:`translate(${(x0+x1)/2}px,${Math.min(y0,y1)-80}px) scale(${(1+sc)/2*1.2}) rotate(${r+180}deg)`,offset:.55},
    {transform:`translate(${x1}px,${y1}px) scale(${sc}) rotate(${r+360}deg)`}
  ],{duration:650,easing:'cubic-bezier(.3,.7,.4,1)'});
  anim.onfinish=()=>{
    fly.remove();
    S.stickers.push({i,r,d:today()});
    if(S.stickers.length===30) S.doneDate=today();
    save();render(true);
    const stk=target.querySelector('.stk');if(stk) stk.classList.add('land');
    burst(b.left-app.left+b.width/2,b.top-app.top+b.height/2,day===30?40:14);
    if(navigator.vibrate) navigator.vibrate(30);
    if(MS[day]) toast(`<b>D+${day}</b> ${MS[day]}`); else toast(cheer());
    busy=false;
    if(day===30) setTimeout(openFinale,1100);
  };
}
const CHEERS=['오늘도 해냈다!','최고야!','짝짝짝, 멋져!','한 칸 더 가까워졌어','엄마랑 같이 해서 좋아'];
const cheer=()=>`<b>${S.stickers.length}/30</b> ${CHEERS[Math.floor(Math.random()*CHEERS.length)]}`;

function ask(t,p,yes){ return new Promise(res=>{ $('dlgT').textContent=t;$('dlgP').textContent=p||'';$('dlgYes').textContent=yes||'확인';$('dlg').hidden=false;
  const done=v=>{$('dlg').hidden=true;$('dlgYes').onclick=$('dlgNo').onclick=null;res(v)};
  $('dlgYes').onclick=()=>done(true);$('dlgNo').onclick=()=>done(false); }) }
let tt;
function toast(html){ const t=$('toast');t.innerHTML=html;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1800) }

function burst(x,y,n){
  const cols=['#c9502f','#f2c14e','#f0a88e','#1b1917','#f3c6b4'];
  for(let k=0;k<n;k++){
    const c=document.createElement('i');c.className='conf';c.style.background=cols[k%cols.length];
    c.style.left=x+'px';c.style.top=y+'px';$('fx').appendChild(c);
    const ang=Math.random()*Math.PI*2, dist=40+Math.random()*(n>20?160:70);
    c.animate([{transform:'translate(-50%,-50%) rotate(0)',opacity:1},
      {transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist+40}px) rotate(${Math.random()*720}deg)`,opacity:0}],
      {duration:800+Math.random()*500,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>c.remove();
  }
}

$('stickBtn').onclick=()=>{ S.stickers.length>=30 ? openFinale() : openTray() };
$('giftCard').onclick=()=>{
  if(S.stickers.length>=30) openFinale();
  else { $('giftBox').animate([{transform:'rotate(0)'},{transform:'rotate(-12deg)'},{transform:'rotate(10deg)'},{transform:'rotate(0)'}],{duration:400}); toast(`<b>${30-S.stickers.length}칸</b> 더 모으면 열 수 있어!`) }
};

/* ---------------- settings ---------------- */
$('gearBtn').onclick=()=>openSheet('settings');
$('undoBtn').onclick=async()=>{ if(!S.stickers.length){closeSheets();return toast('뗄 스티커가 없어요')} closeSheets(); if(!await ask('마지막 스티커를 뗄까요?',`D+${S.stickers.length} 스티커가 떨어져요.`,'떼기')) return; S.stickers.pop(); S.doneDate=null; S.stamped=false; save(); closeSheets(); render(true); toast('스티커 한 장을 뗐어요') };
$('oneADay').onchange=e=>{ S.oneADay=e.target.checked; save(); render() };
$('editBtn').onclick=()=>{ closeSheets(); showSetup(true) };
let wsPick='';
function renderWs(){ const box=$('wsChips');box.innerHTML='';
  WISHES.forEach(w=>{const b=document.createElement('button');b.className='chip'+(w===wsPick?' on':'');b.textContent=w;
    b.onclick=()=>{wsPick=w;$('wsWish').value='';renderWs()};box.appendChild(b)}) }
function openWish(){
  closeSheets();
  if(WISHES.includes(S.wish)){wsPick=S.wish;$('wsWish').value=''} else {wsPick='';$('wsWish').value=S.wish}
  $('wsMsg').value = S.msg==='30일 동안 정말 멋졌어!' ? '' : S.msg;
  renderWs(); setTimeout(()=>openSheet('wishSheet'),60);
}
$('wsWish').oninput=()=>{ if($('wsWish').value.trim()){wsPick='';renderWs()} };
$('wsSave').onclick=()=>{
  const w=$('wsWish').value.trim()||wsPick; if(!w) return toast('소원을 골라주세요');
  S.wish=w; S.msg=$('wsMsg').value.trim()||'30일 동안 정말 멋졌어!'; save(); closeSheets(); render();
  if(!$('finale').hidden) openFinale();
  toast('<b>소원 변경!</b> '+w);
};
$('wishBtn').onclick=openWish;
$('giftEdit').onclick=e=>{ e.stopPropagation(); openWish() };
$('cpEditBtn').onclick=openWish;
$('previewBtn').onclick=async()=>{ closeSheets(); if(S.stickers.length<29 && !await ask('마지막 날 미리보기','빈칸을 29칸까지 임시 스티커로 채워요. 엄마 메뉴 > 마지막 스티커 떼기로 되돌릴 수 있어요.','채우기')) return;
  while(S.stickers.length<29){ const d=new Date();d.setDate(d.getDate()-(29-S.stickers.length));
    S.stickers.push({i:Math.floor(Math.random()*STICKERS.length),r:Math.round(Math.random()*16-8),d:ymd(d)}) }
  save(); closeSheets(); render(true); toast('<b>29/30</b> 마지막 한 칸을 붙여보세요');
};
$('resetBtn').onclick=async()=>{ closeSheets(); if(!await ask('처음부터 다시 할까요?','스티커, 이름, 소원이 모두 지워져요.','모두 지우기')) return; localStorage.removeItem(KEY); S=null; closeSheets(); $('grid').innerHTML=''; $('inName').value='';$('inWish').value='';$('inMsg').value='';pickedWish=''; showSetup(false) };

/* ---------------- finale ---------------- */
function openFinale(fresh){
  if($('finale').hidden || fresh===true) $('finale').dataset.fresh='1';
  $('finale').hidden=false;
  $('finH').innerHTML=`${S.name}${josa(S.name)},<br>정말 해냈어!`;
  $('cpTo').textContent=`${S.name}에게`;$('cpWish').textContent=S.wish;$('cpMsg').textContent=S.msg;
  $('cpDate').textContent=(S.doneDate||today()).slice(5).replace('-','.');
  $('cpEditBtn').hidden=!!S.stamped;
  if(S.stamped){ $('finStage').hidden=true;$('couponWrap').hidden=false;$('stamp').classList.add('on');$('stampBtn').hidden=true }
  else if(!$('couponWrap').hidden && !$('finale').dataset.fresh){ /* keep coupon open (after wish edit) */ }
  else { $('finStage').hidden=false;$('couponWrap').hidden=true;$('stamp').classList.remove('on');$('stampBtn').hidden=false;taps=0 }
  delete $('finale').dataset.fresh;
}
let taps=0;
$('finBox').onclick=()=>{
  taps++;
  const b=$('finBox');
  if(taps<3){ b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake'); $('finBox').nextElementSibling.textContent=taps===1?'한 번 더!':'마지막으로 콕!'; if(navigator.vibrate)navigator.vibrate(20); return }
  b.classList.add('boom');
  const r=b.getBoundingClientRect(),app=$('app').getBoundingClientRect();
  burst(r.left-app.left+r.width/2,r.top-app.top+r.height/2,70);
  if(navigator.vibrate)navigator.vibrate([30,40,60]);
  setTimeout(()=>{ $('finStage').hidden=true;$('couponWrap').hidden=false;b.classList.remove('boom','shake');$('finBox').nextElementSibling.textContent='상자를 눌러서 열어봐' },450);
};
$('stampBtn').onclick=()=>{
  S.stamped=true;save();
  $('stamp').classList.add('on');$('stampBtn').hidden=true;$('cpEditBtn').hidden=true;
  const r=$('stamp').getBoundingClientRect(),app=$('app').getBoundingClientRect();
  setTimeout(()=>burst(r.left-app.left+r.width/2,r.top-app.top+r.height/2,30),250);
  if(navigator.vibrate)navigator.vibrate(60);
};
$('backBtn').onclick=()=>{ $('finale').hidden=true; render() };
$('againBtn').onclick=async()=>{ if(!await ask('새 30일을 시작할까요?','지금 스티커판은 비워지고, 새 소원을 정할 수 있어요.','새로 시작')) return;
  S.stickers=[];S.stamped=false;S.doneDate=null;save();$('finale').hidden=true;showSetup(true) };

addEventListener('resize',()=>{ if(!$('board').hidden) drawPath() });

/* ---------------- boot ---------------- */
if(S && S.name) showBoard(); else showSetup(false);
})();
