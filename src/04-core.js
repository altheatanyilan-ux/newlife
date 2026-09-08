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
  s = s.replace(TAG_RE, (m, pre, t) => `${pre}<a class="tag" href="#/tag/${encodeURIComponent(t.toLowerCase())}">#${t}</a>`);
  s = s.split(/\n{2,}/).map(p => /^<(h\d|ul|blockquote)/.test(p.trim()) ? p : `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  return s;
}

/* ---------- hashtags: any substantive entry can carry them ---------- */
const TAG_RE = /(^|[\s(])#([\p{L}\p{N}][\p{L}\p{N}_-]{1,31})/gu;
const TAGGABLE = ['reflection','memory','lifeevent','media','writing','synchronicity','manifestation','gratitude','dream','question','quote','letter','artifact','progress'];
function parseTags(text){ const out = []; if(!text) return out; for(const m of String(text).matchAll(TAG_RE)) out.push(m[2].toLowerCase()); return out; }
function normTags(list){ return [...new Set((list||[]).map(t => String(t).replace(/^#/,'').trim().toLowerCase()).filter(Boolean))]; }
function entryTags(e){ return normTags([...(e.tags||[]), ...parseTags(e.title), ...parseTags(e.body)]); }
function allTags(){ const c = {}; S.entries.forEach(e => entryTags(e).forEach(t => c[t] = (c[t]||0)+1)); return Object.entries(c).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])); }
function entriesWithTag(t){ const k = String(t).toLowerCase(); return S.entries.filter(e => entryTags(e).includes(k)); }
function tagChips(e, {link=true}={}){ const t = entryTags(e); return t.length ? `<span class="tagrow">${t.map(x => link ? `<a class="tag" href="#/tag/${encodeURIComponent(x)}">#${x}</a>` : `<span class="tag">#${x}</span>`).join('')}</span>` : ''; }

/* ---------- state ---------- */
const KEY = 'lifeinstrument.v1';
let S = null;
/* persistence lives in db.js (Dexie schema + load/save/backup) */
function migrate(){ if(S.settings && (S.settings.home === 'map' || S.settings.home === 'home')) S.settings.home = 'compass'; wipeDemoData(); if(S.rehearsal && !S.rehearsal){ S.rehearsal = S.rehearsal; } delete S.rehearsal; if(typeof migrateEras === 'function') migrateEras(); const d = seed(); for(const k of Object.keys(d)) if(S[k]===undefined) S[k] = d[k]; if(typeof migrateLifeline === 'function') migrateLifeline(); if(typeof migrateSkillLevels === 'function') migrateSkillLevels(); if(typeof migrateProjects === 'function') migrateProjects(); if(typeof migrateStages === 'function') migrateStages(); if(typeof migrateTasks === 'function') migrateTasks(); if(typeof migrateIdeas === 'function') migrateIdeas(); if(typeof migrateMedia === 'function') migrateMedia(); if(typeof migrateSkillFocus === 'function') migrateSkillFocus(); if(typeof migratePeople === 'function') migratePeople(); if(typeof migrateValuePractices === 'function') migrateValuePractices(); if(typeof migrateFinance === 'function') migrateFinance(); if(typeof migrateRhythm === 'function') migrateRhythm(); S.boards = Array.isArray(S.boards) ? S.boards : []; if(typeof migrateBoards === 'function') migrateBoards(); }

/* One-time: the house used to open furnished with a demonstration life. If that
   demonstration is still here, clear it so the rooms start empty. */
function wipeDemoData(){
  if(S.settings?.demoWiped) return;
  const demo = (S.stages||[]).some(s => s.id === 's1') || (S.skills||[]).some(s => s.id === 'sk-jp-conv') || (S.projects||[]).some(p => p.id === 'p-bar');
  const keep = S.settings || {};
  const fresh = seed();
  for(const k of Object.keys(fresh)) if(demo || S[k] === undefined) S[k] = fresh[k];
  if(demo) S.settings = Object.assign(fresh.settings, {theme:keep.theme||'dark', sound:keep.sound, feltTime:keep.feltTime, home:keep.home||'compass', nav:keep.nav, projectView:keep.projectView, firstOpen:keep.firstOpen||today()});
  S.settings.demoWiped = true;
}

/* path access: "stages.#id.narrative" or "rehearsal.script" */
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
  if(multi && typeof attachDictation === 'function') attachDictation(inp, {compact:true});
  /* The mid-typing save is debounced, but it must not outlive the blur: if it
     lands afterwards it writes the raw string back over whatever the field's
     hook normalised (a number, a split tag list, a captured revision). */
  let commitT = null;
  const commit = () => { clearTimeout(commitT); commitT = setTimeout(() => { setPath(path, inp.value); save(); }, 500); };
  inp.addEventListener('input', () => { autosize(); commit(); });
  inp.addEventListener('keydown', e => { if(e.key==='Enter' && !multi){ e.preventDefault(); inp.blur(); } if(e.key==='Escape'){ inp.blur(); } e.stopPropagation(); });
  inp.addEventListener('blur', () => {
    clearTimeout(commitT);
    const v = inp.value; setPath(path, v); saveNow();
    node.classList.remove('editing');
    node.innerHTML = v.trim() ? (node.dataset.md==='1' ? md(v) : esc(v)) : `<span class="ph">${esc(node.dataset.ph)}</span>`;
    if(v !== orig){ const p = el('<span class="saved-pulse">saved</span>'); node.appendChild(p); setTimeout(()=>p.remove(), 1200); sound('save'); const h = node.dataset.hook; if(h){ const [name, arg] = h.split(':'); hooks[name]?.(arg, orig, v, node); } }
    /* a field emptied or filled changes what Living View should be showing */
    const lv = node.closest('.lv-mode'); if(lv) applyLivingView(lv);
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
const UNDO_MS = 8000;
function requestDelete({label='Entry', node=null, remove, after=null, skipConfirm=false}){
  const run = () => animateOut(node, () => {
    const restore = remove(); const id = uid();
    /* the buffer outlives the toast, so a click on the last visible frame of
       the toast can never land after the delete has already been committed */
    const timer = setTimeout(() => { pendingDeletes.delete(id); saveNow(); }, UNDO_MS + 1500);
    pendingDeletes.set(id, {restore, timer});
    (after || rerender)();
    toast(`${esc(label)} deleted`, UNDO_MS, {label:'Undo', fn: () => {
      const p = pendingDeletes.get(id);
      if(!p){ toast('That one has already been written away.'); return; }
      clearTimeout(p.timer); pendingDeletes.delete(id);
      p.restore(); saveNow(); rerender(); toast('Restored.'); }});
  });
  run(); // no confirmation step — the Undo in the toast is the safety net
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
/* the season is a data attribute; the ink layer reads it for how heavy the mist
   hangs, and paints the margin sprig to match */
function applySeason(){ if(typeof season === 'function') document.documentElement.dataset.season = season(); }

/* ---------- router ---------- */
const routes = {};
let currentRoute = null;
function navigate(hash){ location.hash = hash; }
/* A deep link is an instruction, not a place. Once a page has acted on the id
   in its address, the id has to leave the address — otherwise every re-render
   of that page acts on it again. replaceState does not fire hashchange, so the
   page is not re-entered; only the address is corrected. */
function consumeHashParam(bare){
  try { history.replaceState(history.state, '', location.pathname + location.search + bare); } catch(e){}
}
function parseHash(){ const h = (location.hash||'').replace(/^#\/?/,''); const [name, ...rest] = h.split('/'); return {name: name || homeRoute(), params: rest.map(decodeURIComponent)}; }
/* rooms that no longer exist, pointed at where their work went */
/* rooms that no longer exist, pointed at where their work went */
const ROUTE_ALIASES = {home:'compass', rhythm:'today', lifetape:'today', calendar:'today', plan:'today',
  rituals:'today', reviews:'today', board:'compass', vision:'compass', needs:'compass', spiral:'compass'};
function renderRoute(){
  /* page-scoped atmosphere flags do not survive a navigation */
  
  let {name, params} = parseHash();
  /* An alias points a retired address at a room that still exists. The id in
     the old address belonged to the retired room, so it is dropped rather than
     handed to a page that would not know what to do with it. */
  if(ROUTE_ALIASES[name] && !routes[name]){ navigate('#/' + ROUTE_ALIASES[name]); return; }
  markActiveNav(); applyPageTheme();
  const main = $('#main');
  const fn = routes[name] || routes.compass;
  closePanel({keep:true});
  /* a modal belongs to the page that opened it — carrying one across a
     navigation leaves it stranded on top of a page it knows nothing about */
  if(typeof closeModals === 'function') closeModals();
  if(typeof stopSway === 'function') stopSway();
  main.innerHTML = '';
  main.style.animation = 'none'; void main.offsetWidth; main.style.animation = '';
  currentRoute = name; PageEntryConfig.clear();
  try { fn(main, params); } catch(err){ console.error(err); main.innerHTML = `<div class="page narrow"><h1>Something went wrong</h1><p class="muted">${esc(err.message)}</p></div>`; }
  decoratePageHead(main); mountContextAdd(main); reveal(main); tweenAll(main); backupBanner(); updateBackButton();
  if(typeof attachDictationIn === 'function') attachDictationIn(main);
  restoreScroll(location.hash);
}
function rerender(){ const y = window.scrollY; const main = $('#main'); const {name, params} = parseHash(); main.innerHTML=''; PageEntryConfig.clear(); (routes[name]||routes.compass)(main, params); decoratePageHead(main); mountContextAdd(main); if(typeof attachDictationIn === 'function') attachDictationIn(main); $$('.rv', main).forEach(n=>n.classList.add('in')); tweenAll(main); window.scrollTo({top:y}); }
/* where you were on each page, so Back returns you to the spot and not the top */
try { history.scrollRestoration = 'manual'; } catch(e){}
const scrollMem = new Map(); let wentBack = false, navSeq = 0, navIdx = -1;
/* popstate is not a reliable "went back" signal for hash routes, so each history
   entry is stamped with an increasing index and the direction read from it. */
function markNavDirection(){
  const st = history.state || {};
  if(typeof st.liIdx === 'number'){ wentBack = st.liIdx < navIdx; navIdx = st.liIdx; }
  else { navIdx = ++navSeq; wentBack = false; try { history.replaceState({...st, liIdx:navIdx}, ''); } catch(e){} }
}
function restoreScroll(hash){
  const y = wentBack ? (scrollMem.get(hash) || 0) : 0; wentBack = false;
  const go = () => window.scrollTo({top:y, behavior:'instant'});
  go(); requestAnimationFrame(() => { go(); setTimeout(go, 60); setTimeout(go, 160); });   // let late layout settle
}
window.addEventListener('scroll', debounce(() => scrollMem.set(location.hash, window.scrollY || 0), 150), {passive:true});
/* The crossfade between pages is a nicety; arriving at the page you asked for
   is not. A view transition can fail to invoke its callback — repeated
   re-renders of a page seem to wedge it for one cycle — and the navigation is
   then silently swallowed. So: stop decorative animation loops first, skip any
   transition still in flight, and keep a timer that renders regardless if the
   callback has not fired. Navigation cannot be lost, only un-animated. */
let activeVT = null;
function navigateNow(){
  if(typeof stopSway === 'function') stopSway();
  if(!(document.startViewTransition && !reduced() && document.visibilityState === 'visible')){ renderRoute(); return; }
  if(activeVT){ try { activeVT.skipTransition(); } catch(e){} activeVT = null; }
  let ran = false;
  const run = () => { ran = true; renderRoute(); };
  let vt;
  try { vt = document.startViewTransition(run); } catch(e){ run(); return; }
  activeVT = vt;
  vt.finished?.catch(() => {}).finally?.(() => { if(activeVT === vt) activeVT = null; });
  setTimeout(() => { if(!ran){ try { vt.skipTransition(); } catch(e){} if(!ran) run(); } }, 260);
}
window.addEventListener('hashchange', () => { sound('page'); markNavDirection(); navigateNow(); });

/* ---------- side panel ---------- */
function openPanel(html, cls=''){ closePanel({keep:true}); sound('open'); if(!history.state?.liPanel){ try { history.pushState({liPanel:true, liIdx:navIdx}, '', location.href); } catch(e){} } const ov = el(`<div class="panel-overlay" id="panelOv"></div>`); const p = el(`<div class="side-panel ${cls}" id="panel"><div class="panel-grip" title="drag to resize · double-click to reset"></div><button class="panel-wide" title="widen / narrow (focus)">⤢</button><button class="close" title="close">×</button>${html}</div>`); document.body.appendChild(ov); document.body.appendChild(p); ov.onclick = closePanel; p.querySelector('.close').onclick = closePanel; bindPanelResize(p); tweenAll(p); if(typeof attachDictationIn === 'function') attachDictationIn(p); return p; }
/* panel width: drag the left edge, persisted; ⤢ toggles a wide "focus" width */
function panelWidthDefault(){ return 560; }
function applyPanelWidth(p){ const wide = lsGet('panelWide', false); const w = wide ? Math.min(1180, innerWidth*.94) : clamp(lsGet('panelWidth', panelWidthDefault()), 380, innerWidth*.94); p.style.setProperty('--panel-w', Math.round(w)+'px'); p.classList.toggle('wide', !!wide); }
function bindPanelResize(p){
  applyPanelWidth(p); const grip = p.querySelector('.panel-grip'); const wideBtn = p.querySelector('.panel-wide'); let drag = null;
  grip.addEventListener('pointerdown', e => { e.preventDefault(); drag = {x:e.clientX, w:p.getBoundingClientRect().width}; try { grip.setPointerCapture(e.pointerId); } catch(err){} document.body.classList.add('panel-resizing'); p.classList.add('resizing'); });
  grip.addEventListener('pointermove', e => { if(!drag) return; const w = clamp(drag.w + (drag.x - e.clientX), 380, innerWidth*.94); p.style.setProperty('--panel-w', Math.round(w)+'px'); });
  const end = () => { if(!drag) return; const w = Math.round(p.getBoundingClientRect().width); drag = null; document.body.classList.remove('panel-resizing'); p.classList.remove('resizing'); lsSet('panelWidth', w); lsSet('panelWide', false); p.classList.remove('wide'); };
  grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('dblclick', () => { lsSet('panelWidth', panelWidthDefault()); lsSet('panelWide', false); applyPanelWidth(p); });
  wideBtn.onclick = () => { lsSet('panelWide', !lsGet('panelWide', false)); applyPanelWidth(p); sound('click'); };
}
/* Many detail panels rebuild their whole innerHTML on every small edit (an added
   milestone, a ticked task) by closing and reopening themselves. That is simple
   and safe, but it also resets panel scroll to the top — so a click near the
   bottom of a long panel flings the user back up. This wraps that "reopen"
   pattern so the scroll position survives the rebuild. */
function reopenPanel(fn){ const p = $('#panel'); const y = p ? p.scrollTop : 0; fn(); const p2 = $('#panel'); if(p2) p2.scrollTop = y; }
/* Same idea for scrollable sub-panels on an ordinary page (not the side panel) —
   e.g. the Writing Studio's research drawer, which re-renders on every pin. */
function preserveScroll(selectors, fn){
  const before = selectors.map(sel => { const n = document.querySelector(sel); return [sel, n ? n.scrollTop : 0]; });
  fn();
  before.forEach(([sel,y]) => { const n = document.querySelector(sel); if(n) n.scrollTop = y; });
}
function closePanel({keep=false}={}){ const had = !!$('#panel'); $('#panelOv')?.remove(); $('#panel')?.remove(); if(had && !keep && history.state?.liPanel){ history.back(); } else updateBackButton(); }

/* ============================================================
   LIVING VIEW / WORKSHOP VIEW
   ============================================================ */
function vmGet(key){ return lsGet('vm:'+key, 'lv'); }
function vmSet(key, mode){ lsSet('vm:'+key, mode); }
function vmToggleHTML(key){
  const m = vmGet(key);
  return `<div class="vm-toggle-row"><button class="btn sm ghost vm-btn ${m==='lv'?'lv-active':''}" data-vmkey="${esc(key)}" title="${m==='lv'?'Workshop View: shows every field with prompts (E)':'Living View: shows only what you\'ve filled (E)'}">
    ${m==='lv'?'◉ living':'⚙ workshop'}</button></div>`;
}
/* Living View means an unanswered field is not there at all — not its value,
   not its placeholder, and not its label. A thing with no start date should
   show no trace of the words "start date". */
const LV_WRAPPERS = '.field, .q, .vp-sec, .next-action, .evidence-item, [data-lv]';
function applyLivingView(container){
  const isEmpty = e => !!e.querySelector(':scope > .ph');
  const live = [...container.querySelectorAll('.ed')].filter(e => !e.closest('.editing'));
  /* A wrapper may hold more than its ed()s — a select, a chip that is on, a
     bar. Those carry real state, so the label stays even when the text is
     blank. Controls belonging to an ed() being edited do not count. */
  const hasOtherContent = w => [...w.querySelectorAll('select, input, textarea, .chip.on, .bar, svg, img, .status-pill, .tagrow')].some(n => !n.closest('.ed'));

  /* the field itself, so a bare ed() with no wrapper hides its placeholder */
  live.forEach(e => e.classList.toggle('lv-empty', isEmpty(e)));

  /* the wrapper, so the label goes with it — innermost first, so that a
     section whose fields have all just been hidden is judged on the result */
  const wrappers = [...container.querySelectorAll(LV_WRAPPERS)].reverse();
  wrappers.forEach(w => {
    const inner = [...w.querySelectorAll('.ed')].filter(e => !e.closest('.editing'));
    w.classList.toggle('lv-empty', inner.length > 0 && inner.every(isEmpty) && !hasOtherContent(w));
  });

  // completion count for workshop header
  const filled = live.filter(e => !isEmpty(e)).length;
  const badge = container.querySelector('.wv-badge');
  if(badge) badge.textContent = `${filled} / ${live.length} fields`;
}
function bindVmToggle(container, key){
  const btn = container.querySelector('[data-vmkey]');
  if(!btn) return;
  const apply = mode => {
    container.classList.toggle('lv-mode', mode === 'lv');
    container.classList.toggle('wv-mode', mode === 'wv');
    btn.classList.toggle('lv-active', mode === 'lv');
    btn.textContent = mode === 'lv' ? '◉ living' : '⚙ workshop';
    btn.title = mode === 'lv' ? 'Workshop View: shows every field with prompts (E)' : 'Living View: shows only what you\'ve filled (E)';
    if(mode === 'lv') applyLivingView(container);
    else container.querySelectorAll('.lv-empty').forEach(n => n.classList.remove('lv-empty'));
  };
  btn.onclick = () => { const newMode = container.classList.contains('lv-mode') ? 'wv' : 'lv'; vmSet(key, newMode); apply(newMode); };
  container.addEventListener('keydown', e => {
    if((e.key==='e'||e.key==='E') && !['INPUT','TEXTAREA'].includes(e.target.tagName) && !e.target.isContentEditable) btn.click();
  });
  apply(vmGet(key));
}
window.addEventListener('popstate', e => { if($('#panel') && !e.state?.liPanel) closePanel({keep:true}); updateBackButton(); });
/* ---------- persistent Back button: history.back() only, never a link ---------- */
function homeRoute(){ const h = S?.settings?.home; return (h && h !== 'map' && routes[h]) ? h : 'compass'; }
function updateBackButton(){
  const b = $('#backBtn'); if(!b) return;
  const {name} = parseHash();
  const show = history.length > 1 && (name !== homeRoute() || !!$('#panel'));
  if(show && b.hidden){ b.hidden = false; b.classList.remove('leaving'); b.classList.add('entering'); }
  else if(!show && !b.hidden){ if(reduced()){ b.hidden = true; return; } b.classList.add('leaving'); setTimeout(() => { if(b.classList.contains('leaving')){ b.hidden = true; b.classList.remove('leaving'); } }, 220); }
}
function goBack(){ if(history.length > 1) history.back(); else navigate('#/' + homeRoute()); }
document.addEventListener('click', e => { const b = e.target.closest('[data-back]'); if(b){ e.preventDefault(); goBack(); } });
function openModal(html, cls=''){ sound('open'); const ov = el(`<div class="overlay"><div class="modal ${cls}"><button class="close">×</button>${html}</div></div>`); ov.addEventListener('mousedown', e => { if(e.target===ov) ov.remove(); }); ov.querySelector('.close').onclick = () => ov.remove(); $('#modals').appendChild(ov); if(typeof attachDictationIn === 'function') attachDictationIn(ov); return ov; }
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

/* ---------- shared cross-tagging editor: values (±) / threads / skills / projects ----------
   Any object with a `.links` shape like an entry's can use this — the same chip
   grammar as "Connect this entry" in the universal Add modal, factored out so
   other rooms (the Library, the Writing Studio) can offer the same mutual
   tagging without re-deriving it. */
/* 'visions' is deliberately absent: the room is gone, so nothing new can be
   tagged to one. normLinks only ever adds missing arrays, so a links object
   written before this still carries its visions list untouched. */
const LINK_KINDS = ['stages','substages','threads','values','skills','projects','people'];
function emptyLinks(){ const o = {}; LINK_KINDS.forEach(k => o[k] = []); return o; }
/* Makes any object safe for linksEditorHTML, whatever shape it arrived in. */
function normLinks(links){ const o = links && typeof links === 'object' ? links : {}; LINK_KINDS.forEach(k => { if(!Array.isArray(o[k])) o[k] = []; }); return o; }
/* The chips a linked object shows when it is not being edited — Living View
   reads these, so an object with nothing linked renders nothing at all. */
function linkedChipsHTML(links){
  const L = normLinks(links); const out = [];
  L.values.forEach(v => { const id = typeof v==='string'?v:v.id; const o = byId(S.values,id); if(o) out.push(`<span class="chip on" style="--c:${o.color}">${typeof v==='object'&&v.pol==='−'?'− ':''}${esc(o.name)}</span>`); });
  L.threads.forEach(id => { const o = byId(S.threads,id); if(o) out.push(`<span class="chip on" style="--c:${o.color}">${esc(o.name)}</span>`); });
  L.skills.forEach(id => { const o = byId(S.skills,id); if(o) out.push(`<span class="chip on" style="--c:var(--ment)">${esc(o.name)}</span>`); });
  L.projects.forEach(id => { const o = byId(S.projects,id); if(o) out.push(`<span class="chip on" style="--c:var(--terra)">🎨 ${esc(o.name)}</span>`); });
  L.people.forEach(id => { const o = byId(S.people,id); if(o) out.push(`<span class="chip on" style="--c:var(--rose)">${esc(o.name)}</span>`); });
  return out.join('');
}
function linksEditorHTML(links, {legend=true, stages=false}={}){
  links.threads = links.threads||[]; links.values = links.values||[]; links.visions = links.visions||[]; links.skills = links.skills||[]; links.projects = links.projects||[]; links.stages = links.stages||[];
  return `
    ${stages ? `<div class="field"><label>Life stage ${legend?'— which chapter of the Timeline was this consumed during?':''}</label><div class="deps">${S.stages.filter(s=>!s.notyet).map(s=>`<span class="chip click" style="--c:${s.hue}" data-lk="stages" data-id="${s.id}">${s.char} ${esc(s.name)}</span>`).join('') || '<span class="faint">no stages yet</span>'}</div></div>` : ''}
    <div class="field"><label>Values ${legend?'— click to link, click again to flip polarity, third click to unlink':''}</label><div class="deps">${S.valueOrder.map(id=>{ const v=byId(S.values,id); return `<span class="chip click" style="--c:${v.color}" data-lk="values" data-id="${v.id}"><span class="pol"></span>${esc(v.name)}</span>`; }).join('') || '<span class="faint">no values yet</span>'}</div></div>
    <div class="field"><label>Threads</label><div class="deps">${S.threads.map(t=>`<span class="chip click" style="--c:${t.color}" data-lk="threads" data-id="${t.id}">${esc(t.name)}</span>`).join('') || '<span class="faint">no threads yet</span>'}</div></div>
    <div class="field"><label>Skills</label><div class="deps">${S.skills.map(s=>`<span class="chip click" style="--c:var(--ment)" data-lk="skills" data-id="${s.id}">${esc(s.name)}</span>`).join('') || '<span class="faint">no skills yet</span>'}</div></div>
    <div class="field"><label>Projects</label><div class="deps">${S.projects.map(p=>`<span class="chip click" style="--c:var(--terra)" data-lk="projects" data-id="${p.id}">${esc(p.name)}</span>`).join('') || '<span class="faint">no projects yet</span>'}</div></div>`;
}
function bindLinksEditor(container, links, onChange){
  const sync = () => { container.querySelectorAll('[data-lk]').forEach(c => { const k = c.dataset.lk, id = c.dataset.id; const arr = links[k]||(links[k]=[]); const hit = arr.find(v => (typeof v==='string'?v:v.id)===id); c.classList.toggle('on', !!hit); if(k==='values') c.querySelector('.pol').textContent = hit ? hit.pol : ''; }); };
  container.querySelectorAll('[data-lk]').forEach(c => c.onclick = () => { const k = c.dataset.lk, id = c.dataset.id; const arr = links[k]||(links[k]=[]);
    if(k==='values'){ const i = arr.findIndex(v=>v.id===id); if(i<0) arr.push({id,pol:'+'}); else if(arr[i].pol==='+') arr[i].pol='−'; else arr.splice(i,1); }
    else { const i = arr.indexOf(id); if(i<0) arr.push(id); else arr.splice(i,1); }
    saveNow(); sync(); onChange && onChange();
  });
  sync();
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
const ENTRY_TYPES = [['uncategorized','Uncategorized','▫'],['decision','Decision','⚖'],['lifeevent','Life event','◆'],['memory','Memory','◌'],['reflection','Reflection','✎'],['synchronicity','Synchronicity','∞'],['manifestation','Manifestation','✦'],['gratitude','Gratitude','♡'],['dream','Dream','☾'],['progress','Progress','↗'],['nod','Nod','·'],['artifact','Artifact','▣'],['letter','Letter','✉'],['quote','Quote','“'],['question','Question','?'],['visualization','Visualization','◉']];
const typeName = t => (ENTRY_TYPES.find(x=>x[0]===t)||[t,t])[1];
const typeIcon = t => (ENTRY_TYPES.find(x=>x[0]===t)||['','','·'])[2];
