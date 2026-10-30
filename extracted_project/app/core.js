/* ===== core: storage, ui helpers, router ===== */
(() => {
const $ = id => document.getElementById(id);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ymd = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today = () => ymd(new Date());
const dayDiff = (a,b) => Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function ago(ts){
  const s = (Date.now()-ts)/1000;
  if (s < 60) return '방금';
  if (s < 3600) return Math.floor(s/60)+'분 전';
  if (s < 86400) return Math.floor(s/3600)+'시간 전';
  if (s < 86400*7) return Math.floor(s/86400)+'일 전';
  const d = new Date(ts); return (d.getMonth()+1)+'.'+d.getDate();
}

/* ---- storage ---- */
const store = {
  get(k, d){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch(e){ return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); bus.emit('store:'+k, v); },
  del(k){ localStorage.removeItem(k); bus.emit('store:'+k, null); }
};
const bus = { m:{}, on(e,f){ (this.m[e]=this.m[e]||[]).push(f); }, emit(e,v){ (this.m[e]||[]).forEach(f=>f(v)); } };

/* ---- settings ---- */
const SKEY = 'hangul_app_settings';
const settings = Object.assign({ sound:true, haptic:true, oneADay:false }, store.get(SKEY, {}));
function setSetting(k, v){ settings[k] = v; store.set(SKEY, settings); }

/* ---- hash (password) ---- */
async function hash(str){
  const s = 'hangul.log.5::' + str;
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  } catch(e) {
    let x = 5381; for (const c of s) x = ((x<<5)+x+c.charCodeAt(0))|0; return 'f'+(x>>>0).toString(16);
  }
}

/* ---- sound (WebAudio synth, no files) ---- */
let ac;
function tone(freq, t0, dur, type='sine', vol=.18){
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime+t0);
  g.gain.setValueAtTime(0, ac.currentTime+t0);
  g.gain.linearRampToValueAtTime(vol, ac.currentTime+t0+.01);
  g.gain.exponentialRampToValueAtTime(.001, ac.currentTime+t0+dur);
  o.connect(g).connect(ac.destination); o.start(ac.currentTime+t0); o.stop(ac.currentTime+t0+dur+.05);
}
function sfx(name){
  if (!settings.sound) return;
  try {
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const S = {
      tap:   ()=>tone(660,0,.08,'triangle',.12),
      pop:   ()=>{ tone(520,0,.09,'sine'); tone(880,.05,.12,'sine'); },
      stick: ()=>{ tone(392,0,.1,'triangle'); tone(523,.07,.1,'triangle'); tone(784,.14,.22,'triangle'); },
      rare:  ()=>{ [784,988,1175,1568].forEach((f,i)=>tone(f,i*.07,.25,'sine',.14)); },
      fan:   ()=>{ [523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i*.11,.3,'triangle',.16)); },
      shake: ()=>tone(200,0,.12,'square',.06),
      no:    ()=>{ tone(330,0,.12,'sine'); tone(262,.1,.18,'sine'); },
      ok:    ()=>{ tone(660,0,.08); tone(990,.06,.14); }
    };
    (S[name]||S.tap)();
  } catch(e){}
}
const buzz = p => { if (settings.haptic && navigator.vibrate) navigator.vibrate(p); };

/* ---- toast ---- */
let tt;
function toast(html){ const t = $('toast'); t.innerHTML = html; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(()=>t.classList.remove('show'), 1900); }

/* ---- dialog (confirm / prompt) ---- */
function dialog({ title, text='', yes='확인', no='취소', danger=false, input=null }){
  return new Promise(res => {
    const box = $('dlg');
    $('dlgT').textContent = title; $('dlgP').textContent = text; $('dlgP').hidden = !text;
    const inp = $('dlgIn');
    if (input){ inp.hidden=false; inp.value=''; inp.type=input.type||'text'; inp.placeholder=input.placeholder||''; inp.maxLength=input.max||40; inp.inputMode=input.mode||''; }
    else inp.hidden = true;
    $('dlgYes').textContent = yes; $('dlgYes').classList.toggle('danger', danger);
    $('dlgNo').textContent = no; $('dlgNo').hidden = no === null;
    box.hidden = false;
    if (input) setTimeout(()=>inp.focus(), 80);
    const done = v => { box.hidden = true; $('dlgYes').onclick = $('dlgNo').onclick = inp.onkeydown = null; res(v); };
    $('dlgYes').onclick = () => done(input ? inp.value : true);
    $('dlgNo').onclick = () => done(input ? null : false);
    inp.onkeydown = e => { if (e.key === 'Enter') done(inp.value); };
  });
}
const confirmBox = (title, text, yes, danger) => dialog({ title, text, yes, danger });
const alertBox = (title, text) => dialog({ title, text, no:null });
const pwBox = (title, text) => dialog({ title, text: text||'글을 쓸 때 정한 비밀번호 4자리를 입력해 주세요.', yes:'확인', input:{ type:'password', placeholder:'비밀번호', max:12, mode:'numeric' } });

/* ---- bottom sheet ---- */
function openSheet(id){ $('scrim').hidden = false; $(id).classList.add('open'); }
function closeSheets(){ $('scrim').hidden = true; document.querySelectorAll('.sheet.open').forEach(s=>s.classList.remove('open')); }
function actionSheet(title, items){
  const s = $('actSheet');
  s.innerHTML = `<div class="grab"></div>${title?`<div class="sh-t" style="margin-bottom:6px">${esc(title)}</div>`:''}<div class="act-list"></div>`;
  const list = s.querySelector('.act-list');
  items.forEach(it => { const b = h('button', it.danger?'danger':'', `<span>${it.icon||''}</span>${esc(it.label)}`); b.onclick = () => { closeSheets(); setTimeout(it.run, 120); }; list.appendChild(b); });
  openSheet('actSheet');
}

/* ---- full-screen pages (push / pop) ---- */
const pages = [];
function pushPage({ title, right='', body, footer='', onBack, cls='' }){
  const p = h('div', 'page '+cls);
  p.innerHTML = `<div class="page-hd"><button class="back" aria-label="뒤로">‹</button><div class="page-t">${title}</div><div class="page-r">${right}</div></div>
    <div class="page-bd"></div>${footer?`<div class="page-ft">${footer}</div>`:''}`;
  const bd = p.querySelector('.page-bd');
  if (typeof body === 'string') bd.innerHTML = body; else if (body) bd.appendChild(body);
  $('app').appendChild(p);
  requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add('in')));
  p.querySelector('.back').onclick = () => { if (onBack && onBack() === false) return; popPage(); };
  pages.push(p);
  return p;
}
function popPage(){
  const p = pages.pop(); if (!p) return;
  p.classList.remove('in'); setTimeout(()=>p.remove(), 320);
}
function popAll(){ while (pages.length) popPage(); }

/* ---- confetti ---- */
function burst(x, y, n=16, cols){
  cols = cols || ['#c9502f','#f2c14e','#f0a88e','#1b1917','#f3c6b4'];
  const fx = $('fx');
  for (let k=0;k<n;k++){
    const c = h('i','conf'); c.style.background = cols[k%cols.length]; c.style.left = x+'px'; c.style.top = y+'px'; fx.appendChild(c);
    const a = Math.random()*Math.PI*2, d = 40+Math.random()*(n>24?170:80);
    c.animate([{transform:'translate(-50%,-50%) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+50}px) rotate(${Math.random()*720}deg)`,opacity:0}],
      {duration:800+Math.random()*600,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish = () => c.remove();
  }
}
function relRect(el){ const a = $('app').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x:r.left-a.left, y:r.top-a.top, w:r.width, h:r.height, cx:r.left-a.left+r.width/2, cy:r.top-a.top+r.height/2 }; }

/* ---- tabs ---- */
const TABS = {};
let curTab = null;
function registerTab(name, api){ TABS[name] = api; }
function go(name){
  if (curTab === name) { TABS[name]?.onReselect?.(); return; }
  popAll(); closeSheets();
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.dataset.view === name));
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  curTab = name; localStorage.setItem('hangul_app_tab', name);
  TABS[name]?.onShow?.();
}

window.HG = { $, h, esc, ymd, today, dayDiff, uid, ago, store, bus, settings, setSetting, hash, sfx, buzz, toast,
  dialog, confirmBox, alertBox, pwBox, openSheet, closeSheets, actionSheet, pushPage, popPage, popAll, burst, relRect,
  registerTab, go, get curTab(){ return curTab; } };

document.addEventListener('DOMContentLoaded', () => {
  $('scrim').onclick = closeSheets;
  document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => { HG.sfx('tap'); go(b.dataset.tab); });
});
})();
