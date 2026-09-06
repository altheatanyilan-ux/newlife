/* ============================================================
   CORE — utilities, state, persistence, editing, router
   ============================================================ */
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const sum = a => a.reduce((x,y)=>x+y,0);
const avg = a => a.length ? sum(a)/a.length : 0;
const byId = (arr,id) => (arr||[]).find(x => x.id === id);
const DAY = 86400000;
const pad = n => String(n).padStart(2,'0');
const isoDay = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = () => isoDay(new Date());
const parseDay = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => isoDay(new Date(parseDay(s).getTime() + n*DAY));
const daysBetween = (a,b) => Math.round((parseDay(b) - parseDay(a))/DAY);
const daysSince = s => s ? daysBetween(s.slice(0,10), today()) : Infinity;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function fmtDate(s, style='long'){
  if(!s) return '';
  if(!/^\d{4}-\d{2}-\d{2}/.test(s)) return s; // approximate text dates
  const d = parseDay(s.slice(0,10));
  if(style==='long') return `${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if(style==='med') return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  if(style==='short') return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`;
  return s;
}
function relDays(n){ if(n===Infinity) return 'never'; if(n===0) return 'today'; if(n===1) return 'yesterday'; if(n<30) return `${n} days ago`; if(n<365) return `${Math.round(n/30)} months ago`; return `${(n/365).toFixed(1)} years ago`; }
function debounce(fn, ms){ let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; }
function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function hexA(hex, a){ const n = parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function occurredSort(e){ if(e.occurredSort) return e.occurredSort; const s = e.occurredAt||''; if(/^\d{4}-\d{2}-\d{2}/.test(s)) return parseDay(s.slice(0,10)).getTime(); const y = (s.match(/\d{4}/)||[])[0]; if(y) return new Date(+y,5,1).getTime(); return new Date(e.createdAt||0).getTime(); }

/* ---------- markdown (small, safe) ---------- */
function md(src){
  if(!src) return '';
  let s = esc(src);
  s = s.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>');
  s = s.replace(/^&gt; ?(.*)$/gm,'<blockquote>$1</blockquote>').replace(/<\/blockquote>\n<blockquote>/g,'<br>');
  s = s.replace(/^[-*] (.*)$/gm,'<li>$1</li>').replace(/(<li>[\s\S]*?<\/li>)(?!\n<li>)/g,'<ul>$1</ul>').replace(/<\/li>\n<li>/g,'</li><li>');
  s = s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/_([^_\n]+)_/g,'<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.split(/\n{2,}/).map(p => /^<(h\d|ul|blockquote)/.test(p.trim()) ? p : `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  return s;
}

/* ---------- state ---------- */
const KEY = 'lifeinstrument.v1';
let S = null;
/* persistence lives in db.js (Dexie schema + load/save/backup) */
function migrate(){ if(S.settings && S.settings.home === 'map') S.settings.home = 'home'; if(typeof migrateEras === 'function') migrateEras(); const d = seed(); for(const k of Object.keys(d)) if(S[k]===undefined) S[k] = d[k]; if(typeof migrateLifeline === 'function') migrateLifeline(); if(typeof migrateSkillLevels === 'function') migrateSkillLevels(); if(typeof migrateProjects === 'function') migrateProjects(); }

/* path access: "stages.#id.narrative" or "theatre.script" */
function resolve(path){ const segs = path.split('.'); let o = S; for(let i=0;i<segs.length-1;i++){ o = step(o, segs[i]); if(o==null) return [null,null]; } return [o, segs[segs.length-1]]; }
function step(o, seg){ if(seg.startsWith('#')) return Array.isArray(o) ? o.find(x=>x.id===seg.slice(1)) : undefined; return o?.[seg]; }
function getPath(p){ const [o,k] = resolve(p); return o==null ? undefined : step(o,k); }
function setPath(p, v){ const [o,k] = resolve(p); if(o!=null){ o[k] = v; } }

/* ---------- inline editing ---------- */
const hooks = {};
function ed(path, opts={}){
  const val = getPath(path) ?? '';
  const {multi=false, cls='', ph='', mdr=false, tag, hook=''} = opts;
  const t = tag || (multi ? 'div' : 'span');
  const inner = String(val).trim() ? (mdr ? md(val) : esc(val)) : `<span class="ph">${esc(ph)}</span>`;
  return `<${t} class="ed ${multi?'ed-multi':''} ${cls}" data-path="${esc(path)}" data-multi="${multi?1:0}" data-md="${mdr?1:0}" data-ph="${esc(ph)}" data-hook="${esc(hook)}" tabindex="0">${inner}</${t}>`;
}
function beginEdit(node){
  if(node.classList.contains('editing')) return;
  const path = node.dataset.path, multi = node.dataset.multi==='1';
  const orig = getPath(path) ?? '';
  node.classList.add('editing');
  const inp = document.createElement(multi ? 'textarea' : 'input');
  inp.value = orig;
  node.innerHTML = ''; node.appendChild(inp);
  const autosize = () => { if(multi){ inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; } };
  autosize(); inp.focus();
  const commit = debounce(() => { setPath(path, inp.value); save(); }, 500);
  inp.addEventListener('input', () => { autosize(); commit(); });
  inp.addEventListener('keydown', e => { if(e.key==='Enter' && !multi){ e.preventDefault(); inp.blur(); } if(e.key==='Escape'){ inp.blur(); } e.stopPropagation(); });
  inp.addEventListener('blur', () => {
    const v = inp.value; setPath(path, v); saveNow();
    node.classList.remove('editing');
    node.innerHTML = v.trim() ? (node.dataset.md==='1' ? md(v) : esc(v)) : `<span class="ph">${esc(node.dataset.ph)}</span>`;
    if(v !== orig){ const p = el('<span class="saved-pulse">saved</span>'); node.appendChild(p); setTimeout(()=>p.remove(), 1200); sound('save'); const h = node.dataset.hook; if(h){ const [name, arg] = h.split(':'); hooks[name]?.(arg, orig, v, node); } }
  });
}
document.addEventListener('click', e => { const n = e.target.closest('.ed'); if(n && !e.target.closest('a')) beginEdit(n); });
document.addEventListener('keydown', e => { if(e.key==='Enter' && e.target.classList?.contains('ed')) { e.preventDefault(); beginEdit(e.target); } });

/* ---------- toast, ripple, tween ---------- */
function toast(msg, ms=3200, action=null){ const t = el(`<div class="toast">${msg}${action?` <button class="toast-act">${esc(action.label)}</button>`:''}</div>`); $('#toasts').appendChild(t); const kill = () => { t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(()=>t.remove(),400); }; if(action) t.querySelector('.toast-act').onclick = () => { action.fn(); kill(); }; setTimeout(kill, ms); return t; }

/* ---------- universal delete: confirm → animate out → 5 s undo buffer → commit ---------- */
const pendingDeletes = new Map();
function confirmDelete(label, onConfirm){
  const m = openModal(`<h2>Delete this entry?</h2><p class="muted">This cannot be undone.${label?`<br><span class="mono">${esc(label)}</span>`:''}</p><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-x="no">Cancel</button><button class="btn destructive" data-x="yes">Delete</button></div>`,'narrow');
  m.querySelector('[data-x=no]').onclick = () => m.remove(); m.querySelector('[data-x=yes]').onclick = () => { m.remove(); onConfirm(); };
}
function animateOut(node, done){
  if(!node || !node.isConnected || reduced()){ done(); return; }
  const h = node.offsetHeight; node.style.height = h+'px'; node.style.overflow = 'hidden'; node.style.boxSizing = 'border-box';
  node.style.transition = 'opacity .2s var(--ease), height .2s var(--ease), margin .2s var(--ease), padding .2s var(--ease)';
  void node.offsetHeight;   // commit the start state so the transition runs without waiting for a frame
  node.style.opacity = '0'; node.style.height = '0px'; node.style.marginTop = '0'; node.style.marginBottom = '0'; node.style.paddingTop = '0'; node.style.paddingBottom = '0';
  setTimeout(done, 210);
}
/* remove(): mutate S and return a restore() closure. The object stays in memory for 5 s; Undo restores it before the store commits. */
function requestDelete({label='Entry', node=null, remove, after=null, skipConfirm=false}){
  const run = () => animateOut(node, () => {
    const restore = remove(); const id = uid();
    const timer = setTimeout(() => { pendingDeletes.delete(id); saveNow(); }, 5000);
    pendingDeletes.set(id, {restore, timer});
    (after || rerender)();
    toast(`${esc(label)} deleted`, 5000, {label:'Undo', fn: () => { const p = pendingDeletes.get(id); if(!p) return; clearTimeout(p.timer); pendingDeletes.delete(id); p.restore(); saveNow(); rerender(); toast('Restored.'); }});
  });
  skipConfirm ? run() : confirmDelete(label, run);
}
function flushPendingDeletes(){ if(!pendingDeletes.size) return; pendingDeletes.forEach(p => clearTimeout(p.timer)); pendingDeletes.clear(); saveNow(); }
window.addEventListener('beforeunload', flushPendingDeletes);
/* A quiet, collapsed management section for persistent things (stages, visions, skills, projects, values). Delete lives here, not on hover. */
function moreSection(inner, label='More'){ return `<details class="more-section"><summary><span class="mono">${esc(label)}</span></summary><div class="body">${inner}</div></details>`; }
function spliceOut(arr, pred){ const i = arr.findIndex(pred); if(i < 0) return () => {}; const [item] = arr.splice(i, 1); return () => { arr.splice(Math.min(i, arr.length), 0, item); }; }
function snapshotLinks(list){ const saved = list.map(o => [o, JSON.stringify(o.links)]); return () => saved.forEach(([o, j]) => { o.links = JSON.parse(j); }); }
function ripple(x, y, color){ if(reduced()) return; const r = el(`<div class="ripple"></div>`); r.style.left = x+'px'; r.style.top = y+'px'; r.style.setProperty('--c', color||'var(--terra)'); document.body.appendChild(r); setTimeout(()=>r.remove(), 1000); }
function reduced(){ return matchMedia('(prefers-reduced-motion: reduce)').matches; }
function tween(node, to, {dur=700, dec=0, suffix=''}={}){
  const from = parseFloat(node.dataset.val ?? node.textContent) || 0; node.dataset.val = to;
  if(reduced()){ node.textContent = to.toFixed(dec)+suffix; return; }
  const t0 = performance.now();
  const tick = t => { const p = Math.min(1, (t-t0)/dur), e = 1-Math.pow(1-p,3); node.textContent = (from + (to-from)*e).toFixed(dec)+suffix; if(p<1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function tweenAll(root=document){ $$('[data-tween]', root).forEach(n => { tween(n, parseFloat(n.dataset.tween), {dec: +(n.dataset.dec||0), suffix: n.dataset.suffix||''}); }); }

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.05});
function reveal(root=document){ let i=0; const sp = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-motion-speed')) || 1; $$('.rv:not(.in)', root).forEach(n => { n.style.transitionDelay = `${Math.round((i++%12)*60*sp)}ms`; io.observe(n); }); }

/* ---------- theme ---------- */
function applyTheme(){ document.documentElement.dataset.theme = S.settings.theme; $('#btnTheme').textContent = S.settings.theme==='dark' ? '☾' : '☀'; applySeason(); if(typeof applyPageTheme === 'function') applyPageTheme(); }
function applySeason(){ const m = new Date().getMonth(); const hue = [200,200,120,110,100,60,40,35,30,25,20,210][m]; const b3=$('.blob.b3'); if(b3) b3.style.filter = `blur(120px) hue-rotate(${(hue-30)/6}deg)`; }

/* ---------- router ---------- */
const routes = {};
let currentRoute = null;
function navigate(hash){ location.hash = hash; }
function parseHash(){ const h = (location.hash||'').replace(/^#\/?/,''); const [name, ...rest] = h.split('/'); return {name: name || homeRoute(), params: rest.map(decodeURIComponent)}; }
function renderRoute(){
  const {name, params} = parseHash();
  markActiveNav(); applyPageTheme();
  const main = $('#main');
  const fn = routes[name] || routes.home;
  closePanel({keep:true});
  main.innerHTML = '';
  main.style.animation = 'none'; void main.offsetWidth; main.style.animation = '';
  currentRoute = name; PageEntryConfig.clear();
  try { fn(main, params); } catch(err){ console.error(err); main.innerHTML = `<div class="page narrow"><h1>Something went wrong</h1><p class="muted">${esc(err.message)}</p></div>`; }
  decoratePageHead(main); mountContextAdd(main); reveal(main); tweenAll(main); backupBanner(); updateBackButton();
  window.scrollTo({top:0, behavior:'instant'});
}
function rerender(){ const y = window.scrollY; const main = $('#main'); const {name, params} = parseHash(); main.innerHTML=''; PageEntryConfig.clear(); (routes[name]||routes.home)(main, params); decoratePageHead(main); mountContextAdd(main); $$('.rv', main).forEach(n=>n.classList.add('in')); tweenAll(main); window.scrollTo({top:y}); }
window.addEventListener('hashchange', () => { sound('page'); if(document.startViewTransition && !reduced() && document.visibilityState==='visible') document.startViewTransition(renderRoute); else renderRoute(); });

/* ---------- side panel ---------- */
function openPanel(html, cls=''){ closePanel({keep:true}); sound('open'); if(!history.state?.liPanel){ try { history.pushState({liPanel:true}, '', location.href); } catch(e){} } const ov = el(`<div class="panel-overlay" id="panelOv"></div>`); const p = el(`<div class="side-panel ${cls}" id="panel"><button class="close" title="close">×</button>${html}</div>`); document.body.appendChild(ov); document.body.appendChild(p); ov.onclick = closePanel; p.querySelector('.close').onclick = closePanel; tweenAll(p); return p; }
function closePanel({keep=false}={}){ const had = !!$('#panel'); $('#panelOv')?.remove(); $('#panel')?.remove(); if(had && !keep && history.state?.liPanel){ history.back(); } else updateBackButton(); }
window.addEventListener('popstate', e => { if($('#panel') && !e.state?.liPanel) closePanel({keep:true}); updateBackButton(); });
/* ---------- persistent Back button: history.back() only, never a link ---------- */
function homeRoute(){ const h = S?.settings?.home; return (h && h !== 'map' && routes[h]) ? h : 'home'; }
function updateBackButton(){
  const b = $('#backBtn'); if(!b) return;
  const {name} = parseHash();
  const show = history.length > 1 && (name !== homeRoute() || !!$('#panel'));
  if(show && b.hidden){ b.hidden = false; b.classList.remove('leaving'); b.classList.add('entering'); }
  else if(!show && !b.hidden){ if(reduced()){ b.hidden = true; return; } b.classList.add('leaving'); setTimeout(() => { if(b.classList.contains('leaving')){ b.hidden = true; b.classList.remove('leaving'); } }, 220); }
}
function goBack(){ if(history.length > 1) history.back(); else navigate('#/' + homeRoute()); }
document.addEventListener('click', e => { const b = e.target.closest('[data-back]'); if(b){ e.preventDefault(); goBack(); } });
function openModal(html, cls=''){ sound('open'); const ov = el(`<div class="overlay"><div class="modal ${cls}"><button class="close">×</button>${html}</div></div>`); ov.addEventListener('mousedown', e => { if(e.target===ov) ov.remove(); }); ov.querySelector('.close').onclick = () => ov.remove(); $('#modals').appendChild(ov); return ov; }
function closeModals(){ $$('#modals .overlay').forEach(o=>o.remove()); $('.lightbox')?.remove(); closePanel(); }
/* the Escape key closes a panel through history so the stack stays true */
function lightbox(src, cap=''){ const lb = el(`<div class="lightbox"><img src="${src}"><div class="cap">${esc(cap)}</div></div>`); lb.onclick = ()=>lb.remove(); document.body.appendChild(lb); }
function confirmDlg(msg, onYes){ const m = openModal(`<h2>Are you sure?</h2><p class="muted">${msg}</p><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-x="no">Cancel</button><button class="btn danger" data-x="yes">Yes, do it</button></div>`, 'narrow'); m.querySelector('[data-x=no]').onclick = ()=>m.remove(); m.querySelector('[data-x=yes]').onclick = ()=>{ sound('error'); m.remove(); onYes(); }; }
/* Photos are resized on the way in: long edge capped (default 1600px) and re-encoded as JPEG.
   A 4 MB phone photo becomes ~250 KB with no visible loss at site sizes. */
function readImages(files, cb){
  const max = S?.settings?.photoMax || 1600, quality = .85;
  Array.from(files).filter(f=>f.type.startsWith('image/')).forEach(f => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const keepOriginal = sc === 1 && f.size < 300000 && f.type !== 'image/heic';
        if(keepOriginal){ cb({id:uid(), src:r.result, caption:'', date:'', people:[]}); return; }
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width*sc)); c.height = Math.max(1, Math.round(img.height*sc));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb({id:uid(), src:c.toDataURL('image/jpeg', quality), caption:'', date:'', people:[]});
      };
      img.onerror = () => cb({id:uid(), src:r.result, caption:'', date:'', people:[]});
      img.src = r.result;
    };
    r.readAsDataURL(f);
  });
}

/* ---------- moon phase (calculated) ---------- */
function moonPhase(d=new Date()){
  const syn = 29.53058867; const ref = Date.UTC(2000,0,6,18,14); const days = (d - ref)/DAY; const age = ((days % syn)+syn)%syn; const p = age/syn;
  const names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  const idx = Math.round(p*8)%8; return {p, name:names[idx], age};
}
function moonSVG(p, size=22){
  // illuminated fraction drawn as a lit disc with a shadow ellipse
  const r = size/2, k = Math.cos(p*2*Math.PI); const waxing = p<.5;
  const light = 'var(--text)', dark = 'var(--surface-3)';
  const rx = Math.abs(k)*r;
  const half = waxing ? `M${r},0 A${r},${r} 0 0 1 ${r},${size}` : `M${r},0 A${r},${r} 0 0 0 ${r},${size}`;
  const bulge = (waxing ? k>0 : k>0) ? dark : light;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r-.5}" fill="${dark}" stroke="var(--line-2)"/><path d="${half} Z" fill="${light}"/><ellipse cx="${r}" cy="${r}" rx="${rx}" ry="${r-.5}" fill="${bulge}"/></svg>`;
}

/* ---------- Hicks emotional guidance scale ---------- */
const HICKS = ['Fear / Grief / Depression / Despair / Powerlessness','Insecurity / Guilt / Unworthiness','Jealousy','Hatred / Rage','Revenge','Anger','Discouragement','Blame','Worry','Doubt','Disappointment','Overwhelment','Frustration / Irritation / Impatience','Pessimism','Boredom','Contentment','Hopefulness','Optimism','Positive Expectation / Belief','Enthusiasm / Eagerness / Happiness','Passion','Joy / Appreciation / Empowerment / Freedom / Love'];
const hicksName = n => HICKS[clamp(Math.round(n),1,22)-1];
const DIMS = [{id:'physical',name:'Physical',c:'var(--phys)'},{id:'emotional',name:'Emotional',c:'var(--emo)'},{id:'mental',name:'Mental',c:'var(--ment)'},{id:'spiritual',name:'Spiritual',c:'var(--spir)'}];
const CONF = ['hunch','exploring','plan','committed','in motion','lived'];
const ENTRY_TYPES = [['uncategorized','Uncategorized','▫'],['lifeevent','Life event','◆'],['memory','Memory','◌'],['reflection','Reflection','✎'],['synchronicity','Synchronicity','∞'],['manifestation','Manifestation','✦'],['gratitude','Gratitude','♡'],['dream','Dream','☾'],['progress','Progress','↗'],['nod','Nod','·'],['artifact','Artifact','▣'],['letter','Letter','✉'],['quote','Quote','“'],['question','Question','?'],['visualization','Visualization','◉']];
const typeName = t => (ENTRY_TYPES.find(x=>x[0]===t)||[t,t])[1];
const typeIcon = t => (ENTRY_TYPES.find(x=>x[0]===t)||['','','·'])[2];
