/* ============================================================
   THE OVERWHELM RESCUE SPACE — the page

   #/rescue          the page in hand (or a fresh one)
   #/rescue/new      a fresh page
   #/rescue/<id>     an earlier page, to carry on or read

   A blank page. Click anywhere and a box appears; write; click somewhere else
   and write something unrelated. Enter makes the next box underneath, Tab the next
   beside it, Esc puts the pen down. Nothing asks what a thing is.

   Afterwards, select words (or press ⋯ on a box) and say what they are: a task,
   a thread, a journal entry, a decision, a person, a reminder, a parked thought,
   a line to keep — or let them go. A box that names something the site holds
   (a person, a list, a date, a task) shows a thread to it and one plain line on
   what the site knows.

   Nothing moves by itself. Nothing is scored.
   ============================================================ */

NAV_ICONS.rescue = '<svg viewBox="0 0 24 24"><path d="M4 18c3-1 4-4 8-4s5 3 8 4"/><circle cx="12" cy="8" r="3"/><path d="M12 2v1.5M5 5l1 1M19 5l-1 1"/></svg>';
NAV_PAGES.rescue = {label: 'Overwhelm rescue', short: 'Rescue', ico: NAV_ICONS.rescue, route: '#/rescue'};
if(NAV_DEFAULT.identity && !NAV_DEFAULT.identity.includes('rescue')) NAV_DEFAULT.identity.splice(Math.min(3, NAV_DEFAULT.identity.length), 0, 'rescue');

let _rs = null;     /* the page that is open: {sheet, visitAt, timers, ui} */

routes.rescue = function(root, params){
  let s = null;
  if(params[0] === 'new') s = rescueNewSheet();
  else if(params[0]) s = rescueSheetById(params[0]);
  if(!s) s = rescueCurrent(false) || null;
  const fresh = !s;
  if(fresh) s = {id: '', boxes: [], day: today(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), startedAt: new Date().toISOString(), landing: null, _virtual: true};
  rescueLeave();
  _rs = {sheet: s, visitAt: Date.now(), timers: [], ui: {bands: false, rail: !!(S.settings || {}).rescueRail, showGone: false, nudged: false, whispered: []}};
  root.innerHTML = rescuePageHTML(s);
  rescueBindPage(root);
  rescuePaintAll(root);
  if(!s._virtual && !s.landing) rescueStartClock(s);
  rescueTickClock(root);
  _rs.timers.push(setInterval(() => rescueTickClock(root), 20000));
  rescueWhisperLater(root, 40000);
  const gated = typeof rescueGateInit === 'function' && rescueGateInit(root);
  if(typeof rescueReadyShow === 'function'){ if(!gated) rescueAfterGate(root); rescueCareLater(root, (24 + Math.random() * 8) * 60000); }
  if(typeof rescueCarryBtn === 'function') rescueCarryBtn(root);
  const first = root.querySelector('.rs-hint'); if(first && !rescueLive(s).length) first.hidden = false;
  if(!rescueLive(s).length) { const c = root.querySelector('#rsCanvas'); if(c) c.focus(); }
};
function rescueLeave(){
  if(!_rs) return;
  _rs.timers.forEach(t => { if(t && t.off) t.off(); else clearInterval(t); }); _rs.timers = [];
  document.querySelectorAll('.rs-menu, .rs-whisper-live').forEach(n => n.remove());
  try { if(typeof timeAutoStop === 'function') timeAutoStop('rescue'); } catch(e){}
  _rs = null;
}
window.addEventListener('hashchange', () => { if(_rs && parseHash().name !== 'rescue') rescueLeave(); });

function rescueStartClock(s){
  try { if(typeof timeAutoStart === 'function') timeAutoStart({feature: 'rescue', what: 'overwhelm rescue', linkedType: 'rescue', linkedId: s.id, linkedLabel: 'a page to think'}); } catch(e){}
}

/* ---------- the page ---------- */
function rescuePageHTML(s){
  return `<div class="page rs-page" data-rs-page>
    <header class="rs-top">
      <input class="rs-title" id="rsTitle" value="${esc(s.title || '')}" placeholder="${esc(s._virtual ? 'a page to think' : rescueTitle(s))}" aria-label="the page's name" ${s._virtual ? 'disabled' : ''}>
      <span class="rs-clock mono faint" id="rsClock"></span>
      <span class="grow"></span>
      <button class="tbtn" data-rs="gate" title="name the one thing this page must not replace">The one thing</button>
      <button class="tbtn" data-rs="ready" title="small things the room can do for you before a hard hour">Ready the room</button>
      <button class="tbtn" data-rs="tonight" id="rsTonightBtn" hidden title="what the sleep and time records say about tonight, in plain words">Tonight, from my records</button>
      <button class="tbtn" data-rs="coach" title="a question to answer on the page">Ask me something</button>
      <button class="tbtn" data-rs="carry" hidden title="cards from earlier pages that were never settled — bring them here, let them go, or leave them">From earlier pages <b class="rs-badge"></b></button>
      <button class="tbtn" data-rs="gather" title="bring the cards that are left close together, so they can be seen at once">Gather</button>
      <button class="tbtn" data-rs="bands" title="lay the page out by how soon each thing matters">Horizons</button>
      <button class="tbtn" data-rs="rail" title="what is on my plate, to bring onto the page">On my plate</button>
      <button class="tbtn" data-rs="pages">Pages</button>
      <button class="tbtn" data-rs="new">New page</button>
      <button class="btn sm primary" data-rs="land" ${s._virtual ? 'disabled' : ''}>Land it</button>
    </header>
    <div class="rs-body">
      <div class="rs-stage" id="rsStage">
        <div class="rs-canvas" id="rsCanvas" tabindex="-1" aria-label="the page: click anywhere and write">
          <div class="rs-bands" id="rsBands" hidden>${RESCUE_HORIZONS.map(h => `<div class="rs-band" data-hz="${h.id}"><b>${esc(h.name)}</b><span>${esc(h.hint)}</span></div>`).join('')}</div>
          <svg class="rs-strings" id="rsStrings" aria-hidden="true"></svg>
          <div class="rs-hint" hidden><p class="serif">Click anywhere and write.</p><p class="faint">Don’t sort it. Keywords are enough. Afterwards, select what you want to do something with.</p></div>
        </div>
      </div>
      <aside class="rs-rail" id="rsRail" ${(S.settings || {}).rescueRail ? '' : 'hidden'} aria-label="what is on my plate" style="width:${Math.min(640, Math.max(200, +(S.settings || {}).rescueRailW || 300))}px"><span class="rs-rail-grip" title="drag to change the width \u00b7 double-click to reset" aria-hidden="true"></span><div class="rs-rail-in" id="rsRailIn"></div></aside>
    </div>
    <div class="rs-note" id="rsNote" hidden></div>
    <div class="rs-whisper" id="rsWhisper" aria-live="polite"></div>
  </div>`;
}
const rescueQ = (sel, root) => (root || document).querySelector(sel);

/* ---------- boxes ---------- */
function rescueBoxEl(b){
  const f = rescueFontOf(b.font);
  const d = document.createElement('div');
  d.className = 'rs-box' + (b.kind === 'question' ? ' q' : '') + (b.fate ? ' handled' : '') + (b.fate === 'letgo' ? ' gone' : '');
  d.dataset.rsb = b.id;
  d.style.left = b.x + 'px'; d.style.top = b.y + 'px';
  d.style.setProperty('--ink', b.ink || 'var(--text)');
  d.innerHTML = `<span class="rs-grip" title="drag" aria-hidden="true">⠓</span>
    ${b.kind === 'question' ? `<div class="rs-q"><span class="mono">a question for you</span><p>${esc((b.q && b.q.text) || '')}</p><div class="rs-qwhy faint"></div></div>` : ''}
    <textarea class="rs-ta" rows="1" spellcheck="false" placeholder="${b.kind === 'question' ? 'your answer…' : ''}" aria-label="${b.kind === 'question' ? 'your answer' : 'a thought'}"></textarea>
    <button class="rs-more" title="what to do with this (or select some words)" aria-label="what to do with this">⋯</button>
    <span class="rs-size" title="drag to resize · double-click to let it fit its words again" aria-hidden="true"></span>
    <div class="rs-hz"></div><div class="rs-marks"></div><div class="rs-refs"></div>
    ${b.kind === 'question' ? '<div class="rs-qacts"><button class="tbtn" data-rsq="another">another</button><button class="tbtn" data-rsq="deeper">go deeper</button><button class="tbtn" data-rsq="skip">not this one</button><button class="tbtn" data-rsq="remove" title="take this question box off the page">remove</button></div>' : ''}`;
  const ta = d.querySelector('.rs-ta');
  ta.value = b.text || '';
  ta.style.fontFamily = f.css; ta.style.fontSize = f.size + 'rem'; ta.style.fontStyle = f.style;
  return d;
}
/* the box is as wide as its longest line (within reason) and as tall as its words */
let _rsMeasure = null;
function rescueFit(ta){
  const el = ta.closest('.rs-box'), b = el && rescueBoxOf(el.dataset.rsb), q = el && el.classList.contains('q');
  /* a size you drew is kept; until then the box fits its words (as wide as its longest line, within reason) */
  if(b && b.w){
    el.style.width = b.w + 'px'; el.style.maxWidth = 'none'; ta.style.width = '100%';
    if(b.h){ ta.style.height = b.h + 'px'; ta.style.overflowY = 'auto'; } else { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; ta.style.overflowY = 'hidden'; }
    return;
  }
  if(el){ el.style.width = ''; el.style.maxWidth = ''; }
  if(!_rsMeasure){ _rsMeasure = document.createElement('div'); _rsMeasure.className = 'rs-measure'; document.body.appendChild(_rsMeasure); }
  const cs = getComputedStyle(ta), m = _rsMeasure;
  m.style.font = cs.font; m.style.fontStyle = cs.fontStyle; m.style.fontFamily = cs.fontFamily; m.style.fontSize = cs.fontSize;
  const lines = (ta.value || ta.placeholder || ' ').split('\n');
  let w = 0; lines.forEach(l => { m.textContent = l || ' '; w = Math.max(w, m.getBoundingClientRect().width); });
  ta.style.width = Math.min(440, Math.max(q ? 260 : 96, Math.ceil(w) + 26)) + 'px';
  if(b && b.h){ ta.style.height = b.h + 'px'; ta.style.overflowY = 'auto'; } else { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; ta.style.overflowY = 'hidden'; }
}
/* A mark says "→ a task" only while that task is still there. Each mark remembers what it made; one whose
   things have all been deleted goes, and a card that was handled only by it is a loose card again.
   Marks from before they remembered are checked against the words they were made from. */
function rescueIdAlive(id){
  try {
    if(typeof findTaskRef === 'function' && findTaskRef(id)) return true;
    if((S.entries || []).some(x => x.id === id) || (S.affirmations || []).some(x => x.id === id)) return true;
    return Object.values(S.weekPlans || {}).some(p => p && (p.threads || []).some(t => t.id === id));
  } catch(e){ return true; }
}
function rescueExitAlive(x){
  if(Array.isArray(x.ids) && x.ids.length) return x.ids.some(rescueIdAlive);
  if(!['task', 'goal', 'remind'].includes(x.kind)) return true;
  const first = String(x.snippet || '').split('\n')[0].trim().toLowerCase().slice(0, 10);
  if(first.length < 4) return true;
  try { return allTaskRefs().some(r => String(r.text || '').toLowerCase().includes(first)); } catch(e){ return true; }
}
function rescueExitsPrune(b){
  const was = (b.exits || []).length; if(!was) return false;
  b.exits = b.exits.filter(rescueExitAlive);
  if(b.exits.length === was) return false;
  if(!b.exits.length && b.fate && b.fate !== 'letgo') b.fate = '';
  save(); return true;
}
function rescueMarksHTML(b){
  rescueExitsPrune(b);
  return (b.exits || []).map(x => `<span class="rs-mark" title="${esc(x.snippet || '')}">→ ${esc(x.label)}</span>`).join('');
}
function rescueRefsPaint(el, b){
  const box = el.querySelector('.rs-refs'); if(!box) return;
  const refs = rescueMentions(b.text); b._refs = refs;
  box.innerHTML = refs.map((r, i) => { const k = rescueKnows(r);
    return `<button class="rs-ref ${esc(r.type)}" data-rsref="${i}" title="${esc(k ? k.line : r.type)}"><i>⌁</i> ${esc(r.label)}${k ? `<span> · ${esc(k.line)}</span>` : ''}</button>`; }).join('');
  if(b.kind === 'question' && b.q && b.q.exit && b.q.exit !== 'none' && (b.text || '').trim().length > 12 && !(b.exits || []).length){
    const x = RESCUE_EXITS.find(e => e.id === b.q.exit);
    if(x) box.insertAdjacentHTML('beforeend', `<button class="rs-qsug" data-rssug="${x.id}" title="${esc(x.hint)}">${x.glyph} send this to ${esc(x.name)}?</button>`);
  }
  /* a thought about something decided to be left alone, or about a thing that has its own time */
  if(!(b.exits || []).length && (b.text || '').trim().length > 6){
    if(refs.some(r => r.type === 'letgo')) box.insertAdjacentHTML('beforeend', `<button class="rs-qsug" data-rssug="letgo" title="you decided this was not yours to carry">· you decided to let this go — let it go?</button>`);
    const w = refs.find(r => r.type === 'want'), th = w && typeof wantsThing === 'function' ? wantsThing(w.id) : null, nx = th ? wantsSlotNext(th) : null;
    if(nx) box.insertAdjacentHTML('beforeend', `<button class="rs-qsug" data-rssug="slot:${esc(th.id)}" title="a reminder at its time — it waits there">⏰ save it for ${esc(th.name)}’s time (${esc(nx.label)})</button>`);
  }
  const hz = el.querySelector('.rs-hz'); const h = RESCUE_HORIZONS.find(x => x.id === b.horizon);
  if(hz) hz.textContent = h ? h.name : '';
  const mk = el.querySelector('.rs-marks'); if(mk) mk.innerHTML = rescueMarksHTML(b);
  el.classList.toggle('handled', !!b.fate); el.classList.toggle('gone', b.fate === 'letgo' && !(_rs && _rs.ui.showGone));
}
function rescuePaintAll(root){
  const s = _rs.sheet, canvas = rescueQ('#rsCanvas', root);
  canvas.querySelectorAll('.rs-box').forEach(n => n.remove());
  (s.boxes || []).forEach(b => { const el = rescueBoxEl(b); canvas.appendChild(el); });
  canvas.querySelectorAll('.rs-box').forEach(el => { const b = rescueBoxOf(el.dataset.rsb); if(!b) return; rescueFit(el.querySelector('.rs-ta')); rescueRefsPaint(el, b); });
  rescueSizeCanvas(root); rescueStrings(root); rescueRailPaint(root);
}
const rescueBoxOf = id => _rs ? (_rs.sheet.boxes || []).find(b => b.id === id) : null;
function rescueSizeCanvas(root){
  const c = rescueQ('#rsCanvas', root), st = rescueQ('#rsStage', root); if(!c || !st) return;
  let maxY = 0, maxX = 0;
  c.querySelectorAll('.rs-box').forEach(el => { maxY = Math.max(maxY, el.offsetTop + el.offsetHeight); maxX = Math.max(maxX, el.offsetLeft + el.offsetWidth); });
  c.style.minHeight = Math.max(st.clientHeight, maxY + 360) + 'px';
  /* With the horizons showing, the page is exactly as wide as the window: the columns are fractions of it, so a page that grew
     as a box was dragged right would widen every column with it and the last one could never be reached. */
  if(_rs && _rs.ui.bands){ c.style.minWidth = ''; c.style.width = (st.clientWidth - 2) + 'px'; }
  else { c.style.width = ''; c.style.minWidth = Math.max(st.clientWidth - 2, maxX + 120) + 'px'; }
}
/* Letting cards go leaves the rest scattered. This brings them close together, in the order they were
   read (top to bottom, left to right), starting where you are looking; with the horizons showing, each
   stays in its own column and the column is closed up. Nothing is lost: it can be undone. */
function rescueGather(root){
  if(!_rs) return;
  const canvas = rescueQ('#rsCanvas', root), stage = rescueQ('#rsStage', root); if(!canvas || !stage) return;
  const items = [...canvas.querySelectorAll('.rs-box:not(.gone)')].filter(el => el.offsetWidth).map(el => ({el, b: rescueBoxOf(el.dataset.rsb), w: el.offsetWidth, h: el.offsetHeight, x0: el.offsetLeft, y0: el.offsetTop})).filter(i => i.b);
  if(items.length < 2){ toast('Nothing to bring together yet.'); return; }
  const before = items.map(i => [i.b, i.b.x, i.b.y]), GAP = 14, PAD = 22;
  if(_rs.ui.bands){
    const bands = [...canvas.querySelectorAll('.rs-band')], cols = bands.map(() => 64);
    /* a card belongs to the horizon it was dropped on; one never placed there is read by its left edge */
    const colOf = i => { let k = i.b.horizon ? bands.findIndex(bd => bd.dataset.hz === i.b.horizon) : -1; if(k < 0){ const lx = i.x0 + 12; k = bands.findIndex(bd => lx >= bd.offsetLeft && lx < bd.offsetLeft + bd.offsetWidth); } return k < 0 ? Math.min(bands.length - 1, Math.max(0, Math.floor(i.x0 / (canvas.clientWidth / bands.length)))) : k; };
    items.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0).forEach(i => { const k = colOf(i); i.x = bands[k].offsetLeft + 10; i.y = cols[k]; cols[k] += i.h + GAP; });
  } else {
    const W = Math.max(360, stage.clientWidth - 24), left = stage.scrollLeft + PAD;
    let x = left, y = stage.scrollTop + PAD, rowH = 0;
    items.sort((a, b) => Math.round(a.y0 / 110) - Math.round(b.y0 / 110) || a.x0 - b.x0).forEach(i => {
      if(x > left && x - left + i.w > W - PAD * 2){ x = left; y += rowH + GAP; rowH = 0; }
      i.x = x; i.y = y; x += i.w + GAP; rowH = Math.max(rowH, i.h); });
  }
  canvas.classList.add('gathering');
  items.forEach(i => { i.b.x = Math.round(i.x); i.b.y = Math.round(i.y); i.el.style.left = i.b.x + 'px'; i.el.style.top = i.b.y + 'px'; });
  rescueTouch(_rs.sheet);
  const t0 = performance.now(), follow = () => { rescueStrings(root); if(performance.now() - t0 < 700 && canvas.isConnected) requestAnimationFrame(follow); else { canvas.classList.remove('gathering'); rescueSizeCanvas(root); rescueStrings(root); } };
  requestAnimationFrame(follow);
  stage.scrollTo({left: 0, top: Math.max(0, Math.min(...items.map(i => i.y)) - PAD), behavior: 'smooth'});
  sound('click');
  toast('Brought together.', 6000, {label: 'undo', fn: () => {
    canvas.classList.add('gathering');
    before.forEach(([b, x, y]) => { b.x = x; b.y = y; const el = canvas.querySelector('[data-rsb="' + b.id + '"]'); if(el){ el.style.left = x + 'px'; el.style.top = y + 'px'; } });
    rescueTouch(_rs.sheet); setTimeout(() => { canvas.classList.remove('gathering'); rescueSizeCanvas(root); rescueStrings(root); }, 650); }});
}
/* a thread between boxes that name the same thing the site holds */
function rescueStrings(root){
  const svg = rescueQ('#rsStrings', root), c = rescueQ('#rsCanvas', root); if(!svg || !c) return;
  const els = [...c.querySelectorAll('.rs-box:not(.gone)')], byRef = {};
  els.forEach(el => { const b = rescueBoxOf(el.dataset.rsb); if(!b) return;
    (b._refs || rescueMentions(b.text)).forEach(r => { (byRef[r.type + ':' + r.id] = byRef[r.type + ':' + r.id] || []).push(el); }); });
  const W = c.scrollWidth, H = c.scrollHeight; svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const ctr = el => [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2];
  let d = '';
  Object.values(byRef).forEach(list => { for(let i = 0; i < list.length - 1; i++){
    const [x1, y1] = ctr(list[i]), [x2, y2] = ctr(list[i + 1]), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(80, Math.abs(x2 - x1) * .25 + 24);
    d += `<path d="M${x1.toFixed(0)},${y1.toFixed(0)} Q${mx.toFixed(0)},${my.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)}" />`; } });
  svg.innerHTML = d;
}

/* ---------- the page's own behaviour ---------- */
function rescueBindPage(root){
  const canvas = rescueQ('#rsCanvas', root), stage = rescueQ('#rsStage', root);
  const sheetNow = () => {
    if(_rs.sheet._virtual){ const real = rescueNewSheet(); Object.assign(real, {boxes: _rs.sheet.boxes, ready: (_rs.readyLog || []).slice(), readyDismissed: !!_rs.sheet.readyDismissed}); _rs.sheet = real; history.replaceState(history.state, '', location.pathname + location.search + '#/rescue/' + real.id);
      root.querySelectorAll('#rsTitle, [data-rs="land"]').forEach(n => n.disabled = false); rescueStartClock(real); }
    return _rs.sheet; };
  const newBox = (x, y, text) => {
    const s = sheetNow(); const b = rescueBoxNew(s, x, y, text || ''); const el = rescueBoxEl(b);
    canvas.appendChild(el); const ta = el.querySelector('.rs-ta'); rescueFit(ta); ta.focus();
    if(root.querySelector('.rs-ready')){ root.querySelectorAll('.rs-ready').forEach(n => n.remove()); rescueReadyPill(root); }
    rescueQ('.rs-hint', root).hidden = true; rescueSizeCanvas(root); return {b, el, ta}; };
  _rs.newBox = newBox; _rs.sheetNow = sheetNow;

  /* click on bare paper: a box there */
  canvas.addEventListener('mousedown', ev => {
    if(ev.target !== canvas && !ev.target.classList.contains('rs-hint') && ev.target.tagName !== 'svg' && !ev.target.classList.contains('rs-bands') && !ev.target.classList.contains('rs-band') && !ev.target.closest('.rs-hint')) return;
    if(ev.button !== 0) return;
    const r = canvas.getBoundingClientRect();
    ev.preventDefault();
    /* an empty box left standing is taken away rather than collected */
    canvas.querySelectorAll('.rs-box .rs-ta').forEach(t => { if(!t.value.trim() && document.activeElement === t) t.blur(); });
    rescueCloseMenu();
    newBox(ev.clientX - r.left - 6, ev.clientY - r.top - 10);
  });
  /* typing */
  canvas.addEventListener('input', ev => {
    const ta = ev.target.closest('.rs-ta'); if(!ta) return;
    const el = ta.closest('.rs-box'), b = rescueBoxOf(el.dataset.rsb); if(!b) return;
    b.text = ta.value; rescueFit(ta); rescueTouch(_rs.sheet); rescueSizeCanvas(root);
    clearTimeout(el._rt); el._rt = setTimeout(() => { rescueRefsPaint(el, b); rescueStrings(root); rescueRailPaint(root); rescueTonightShow(root); }, 500);
  });
  canvas.addEventListener('keydown', ev => {
    const ta = ev.target.closest && ev.target.closest('.rs-ta'); if(!ta) return;
    const el = ta.closest('.rs-box'), b = rescueBoxOf(el.dataset.rsb); if(!b) return;
    if(ev.key === 'Escape'){ ta.blur(); rescueCloseMenu(); return; }
    if(ev.key === 'Enter' && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && b.kind !== 'question'){
      ev.preventDefault(); if(!ta.value.trim()) return;
      const n = newBox(el.offsetLeft, el.offsetTop + el.offsetHeight + 10); return; }
    if(ev.key === 'Tab' && !ev.shiftKey && b.kind !== 'question'){
      ev.preventDefault(); if(!ta.value.trim()) return;
      newBox(el.offsetLeft + el.offsetWidth + 26, el.offsetTop + 4); return; }
    if(ev.key === 'Backspace' && !ta.value && b.kind !== 'question'){
      ev.preventDefault(); const prev = rescuePrevBox(el); rescueRemoveBox(b, el);
      if(prev){ const pt = prev.querySelector('.rs-ta'); pt.focus(); pt.setSelectionRange(pt.value.length, pt.value.length); } return; }
    if((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter'){ ev.preventDefault(); rescueOpenMenu(b, el, ta); }
  });
  canvas.addEventListener('focusout', ev => {
    const ta = ev.target.closest && ev.target.closest('.rs-ta'); if(!ta) return;
    const el = ta.closest('.rs-box'), b = rescueBoxOf(el.dataset.rsb);
    setTimeout(() => { if(b && !ta.value.trim() && b.kind !== 'question' && document.activeElement !== ta && !(b.exits || []).length) rescueRemoveBox(b, el); }, 120);
  });
  /* selecting words offers what to do with them */
  const selected = ta => ta.selectionEnd > ta.selectionStart ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : '';
  canvas.addEventListener('mouseup', ev => {
    const ta = ev.target.closest && ev.target.closest('.rs-ta'); if(!ta) return;
    setTimeout(() => { const t = selected(ta).trim(); if(t.length >= 2){ const el = ta.closest('.rs-box'); rescueOpenMenu(rescueBoxOf(el.dataset.rsb), el, ta, t); } }, 0);
  });
  canvas.addEventListener('keyup', ev => {
    const ta = ev.target.closest && ev.target.closest('.rs-ta'); if(!ta || !ev.shiftKey) return;
    const t = selected(ta).trim(); if(t.length >= 2){ const el = ta.closest('.rs-box'); rescueOpenMenu(rescueBoxOf(el.dataset.rsb), el, ta, t); } });
  canvas.addEventListener('click', ev => {
    const more = ev.target.closest('.rs-more');
    if(more){ const el = more.closest('.rs-box'), ta = el.querySelector('.rs-ta'); rescueOpenMenu(rescueBoxOf(el.dataset.rsb), el, ta, selected(ta).trim() || ''); return; }
    const ref = ev.target.closest('[data-rsref]');
    if(ref){ const el = ref.closest('.rs-box'), b = rescueBoxOf(el.dataset.rsb), r = (b._refs || [])[+ref.dataset.rsref], k = r && rescueKnows(r); if(k && k.go) k.go(); return; }
    const sg = ev.target.closest('[data-rssug]');
    if(sg){ const el = sg.closest('.rs-box'), b = rescueBoxOf(el.dataset.rsb); rescueOpenMenu(b, el, el.querySelector('.rs-ta'), '', sg.dataset.rssug); return; }
    const q = ev.target.closest('[data-rsq]');
    if(q){ const el = q.closest('.rs-box'); rescueCoachAct(root, rescueBoxOf(el.dataset.rsb), q.dataset.rsq); }
  });
  /* dragging a box by its grip, or by the paper round its words */
  canvas.addEventListener('pointerdown', ev => {
    const grip = ev.target.closest('.rs-grip'), el = ev.target.closest('.rs-box'); if(!grip || !el || ev.button !== 0) return;
    const b = rescueBoxOf(el.dataset.rsb); if(!b) return;
    ev.preventDefault(); grip.setPointerCapture(ev.pointerId);
    const ox = ev.clientX - el.offsetLeft, oy = ev.clientY - el.offsetTop; el.classList.add('dragging');
    const mv = e => {
      /* with the horizons showing a box stays inside the page, so it can be dropped into the last column */
      const maxL = _rs.ui.bands ? Math.max(0, canvas.clientWidth - el.offsetWidth - 6) : Infinity;
      el.style.left = Math.min(maxL, Math.max(0, e.clientX - ox)) + 'px'; el.style.top = Math.max(0, e.clientY - oy) + 'px'; rescueStrings(root); };
    const up = e => { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      el.classList.remove('dragging'); b.x = el.offsetLeft; b.y = el.offsetTop;
      /* the column is the one the pointer was dropped in (a wide box lying across several columns belongs to where it was put down) */
      if(_rs.ui.bands){ const cr = canvas.getBoundingClientRect(), w = cr.width / RESCUE_HORIZONS.length, px = e && e.clientX != null ? e.clientX : cr.left + b.x + el.offsetWidth / 2;
        const i = Math.min(RESCUE_HORIZONS.length - 1, Math.max(0, Math.floor((px - cr.left) / w))); b.horizon = RESCUE_HORIZONS[i].id; rescueRefsPaint(el, b); }
      rescueTouch(_rs.sheet); rescueSizeCanvas(root); rescueStrings(root); };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
  /* resizing a box by its corner: its width and the height of its writing area, kept on the box */
  canvas.addEventListener('pointerdown', ev => {
    const h = ev.target.closest('.rs-size'), el = h && h.closest('.rs-box'); if(!h || ev.button !== 0) return;
    const b = rescueBoxOf(el.dataset.rsb), ta = el.querySelector('.rs-ta'); if(!b) return;
    ev.preventDefault(); ev.stopPropagation(); h.setPointerCapture(ev.pointerId); el.classList.add('resizing');
    const w0 = el.offsetWidth, h0 = ta.offsetHeight, x0 = ev.clientX, y0 = ev.clientY, minW = el.classList.contains('q') ? 220 : 110;
    const mv = e => { b.w = Math.max(minW, Math.round(w0 + e.clientX - x0)); b.h = Math.max(30, Math.round(h0 + e.clientY - y0)); rescueFit(ta); rescueStrings(root); };
    const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
      el.classList.remove('resizing'); rescueTouch(_rs.sheet); rescueSizeCanvas(root); rescueStrings(root); };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
  canvas.addEventListener('dblclick', ev => {
    const h = ev.target.closest('.rs-size'); if(!h) return; const el = h.closest('.rs-box'), b = rescueBoxOf(el.dataset.rsb); if(!b) return;
    delete b.w; delete b.h; const ta = el.querySelector('.rs-ta'); ta.style.height = ''; ta.style.width = ''; rescueFit(ta); rescueTouch(_rs.sheet); rescueSizeCanvas(root); rescueStrings(root); });
  /* the plate's width is yours: drag its left edge; double-click puts it back */
  const rail = rescueQ('#rsRail', root);
  if(rail){
    rail.addEventListener('pointerdown', ev => {
      const g = ev.target.closest('.rs-rail-grip'); if(!g || ev.button !== 0) return;
      ev.preventDefault(); g.setPointerCapture(ev.pointerId); rail.classList.add('resizing');
      const x0 = ev.clientX, w0 = rail.offsetWidth;
      const mv = e => { rail.style.width = Math.min(Math.max(200, innerWidth - 360), Math.max(200, Math.round(w0 - (e.clientX - x0)))) + 'px'; };
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
        rail.classList.remove('resizing'); S.settings.rescueRailW = rail.offsetWidth; save(); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });
    rail.addEventListener('dblclick', ev => { if(!ev.target.closest('.rs-rail-grip')) return; rail.style.width = '300px'; S.settings.rescueRailW = 300; save(); });
  }
  /* the header */
  const title = rescueQ('#rsTitle', root);
  title.onchange = () => { _rs.sheet.title = title.value.trim(); rescueTouch(_rs.sheet); };
  root.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => {
    const a = b.dataset.rs;
    if(a === 'new') navigate('#/rescue/new');
    else if(a === 'pages') rescuePagesDialog();
    else if(a === 'land') rescueLand(root);
    else if(a === 'bands'){ _rs.ui.bands = !_rs.ui.bands; rescueQ('#rsBands', root).hidden = !_rs.ui.bands; canvas.classList.toggle('bands', _rs.ui.bands); b.classList.toggle('on', _rs.ui.bands);
      rescueSizeCanvas(root);
      if(_rs.ui.bands){ /* boxes that sat beyond the edge are brought just inside it, so every one is in a column */
        canvas.querySelectorAll('.rs-box').forEach(el => { const bx = rescueBoxOf(el.dataset.rsb), maxL = Math.max(0, canvas.clientWidth - el.offsetWidth - 6); if(bx && el.offsetLeft > maxL){ el.style.left = maxL + 'px'; bx.x = maxL; } }); rescueTouch(_rs.sheet); }
      rescueStrings(root); }
    else if(a === 'rail'){ const r = rescueQ('#rsRail', root); r.hidden = !r.hidden; S.settings.rescueRail = !r.hidden; save(); b.classList.toggle('on', !r.hidden); if(!r.hidden) rescueRailPaint(root); }
    else if(a === 'gather') rescueGather(root);
    else if(a === 'carry') rescueCarryShow(root, true);
    else if(a === 'coach') rescueCoachOpen(root);
    else if(a === 'tonight') rescueTonightFrame(root);
    else if(a === 'ready') rescueReadyShow(root, true);
    else if(a === 'gate' && typeof rescueGateScreen === 'function'){ const g = _rs.sheet.gate; rescueGateScreen(root, g && g.pick ? 'shrink' : 'pick', {keep: !!(g && g.step)}); }
  });
  const railBtn = root.querySelector('[data-rs="rail"]'); if(railBtn && !rescueQ('#rsRail', root).hidden) railBtn.classList.add('on');
  document.addEventListener('mousedown', rescueOutside, true);
  _rs.timers.push({off: () => document.removeEventListener('mousedown', rescueOutside, true)});
}
function rescuePrevBox(el){ const all = [...el.parentNode.querySelectorAll('.rs-box:not(.gone)')], i = all.indexOf(el); return i > 0 ? all[i - 1] : null; }
function rescueRemoveBox(b, el){
  if(!b || (b.text || '').trim() || (b.exits || []).length) return;
  const s = _rs.sheet; const i = s.boxes.indexOf(b); if(i >= 0) s.boxes.splice(i, 1);
  el.remove(); rescueTouch(s);
  const root = document.querySelector('[data-rs-page]'); if(root){ rescueStrings(root); const h = rescueQ('.rs-hint', root); if(h && !rescueLive(s).length) h.hidden = false; }
}
function rescueClockSaid(){
  const m = Math.round((Date.now() - _rs.visitAt) / 60000);
  return m < 1 ? 'just begun' : m + ' min here';
}
function rescueTickClock(root){
  if(!_rs) return; const c = rescueQ('#rsClock', root); if(c) c.textContent = rescueClockSaid();
  rescueTonightShow(root);
  const m = (Date.now() - _rs.visitAt) / 60000;
  if(m >= 25 && !_rs.ui.nudged && !_rs.sheet.landing){ _rs.ui.nudged = true;
    const n = rescueQ('#rsNote', root); if(n){ n.hidden = false; n.innerHTML = `Been here a while. No rush — but a page can be <button class="tbtn" id="rsNoteLand">landed</button> without being finished. <button class="tbtn" id="rsNoteX" aria-label="dismiss">×</button>`;
      n.querySelector('#rsNoteLand').onclick = () => rescueLand(root); n.querySelector('#rsNoteX').onclick = () => { n.hidden = true; }; } }
}

/* ---------- the menu: what is this? ---------- */
function rescueCloseMenu(){ document.querySelectorAll('.rs-menu').forEach(n => n.remove()); }
function rescueOutside(ev){ if(!ev.target.closest('.rs-menu') && !ev.target.closest('.rs-more') && !ev.target.closest('.rs-ta')) rescueCloseMenu(); }
function rescueOpenMenu(b, el, ta, sel, startExit){
  if(!b) return;
  rescueCloseMenu();
  const whole = !sel, text = (sel || b.text || '').trim(); if(!text) { toast('Write something first.'); return; }
  const m = document.createElement('div'); m.className = 'rs-menu'; m.setAttribute('role', 'menu');
  document.body.appendChild(m);
  const ctx = {b, el, text, whole, close: rescueCloseMenu, m};
  const place = () => { const r = el.getBoundingClientRect(), h = m.offsetHeight || 300, w = m.offsetWidth || 320;
    let top = r.top - h - 8; if(top < 56) top = Math.min(innerHeight - h - 12, r.bottom + 8);
    m.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.left)) + 'px'; m.style.top = Math.max(56, top) + 'px'; };
  ctx.place = place; ctx.step = (html, bind) => { m.innerHTML = html; if(bind) bind(m); place(); };
  if(startExit) rescueExitStep(ctx, startExit); else rescueMenuTop(ctx);
  place(); return ctx;
}
function rescueMenuTop(ctx){
  const {text, whole} = ctx, b = ctx.b;
  ctx.step(`<div class="rs-m-h"><span class="mono faint">${whole ? 'this box' : 'these words'}</span><q>${esc(text.length > 70 ? text.slice(0, 68) + '…' : text)}</q></div>
    <div class="rs-m-grid">${RESCUE_EXITS.map(x => `<button class="rs-m-b" data-x="${x.id}" title="${esc(x.hint)}"><i>${x.glyph}</i><span>${esc(x.name)}</span></button>`).join('')}</div>
    <div class="rs-m-hz"><span class="mono faint">it matters</span>${RESCUE_HORIZONS.map(h => `<button class="chip sm${b.horizon === h.id ? ' on' : ''}" data-hz="${h.id}">${esc(h.name)}</button>`).join('')}</div>`, m => {
    m.querySelectorAll('[data-x]').forEach(x => x.onclick = () => rescueExitStep(ctx, x.dataset.x));
    m.querySelectorAll('[data-hz]').forEach(h => h.onclick = () => { b.horizon = b.horizon === h.dataset.hz ? '' : h.dataset.hz; rescueTouch(_rs.sheet); rescueRefsPaint(ctx.el, b); rescueCloseMenu(); });
  });
}
/* success: note it on the box, say where it went, offer the undo */
function rescueDone(ctx, kind, res, extraGo){
  if(!res){ toast('That did not make anything.'); return; }
  const b = ctx.b, rec = {kind, label: res.label, at: new Date().toISOString(), snippet: ctx.text.slice(0, 140), ids: (res.made || []).map(x => x && x.id).filter(Boolean)};
  b.exits = b.exits || []; b.exits.push(rec);
  const prevFate = b.fate; if(ctx.whole || kind === 'letgo') b.fate = kind;
  rescueTouch(_rs.sheet); rescueRefsPaint(ctx.el, b); rescueCloseMenu();
  const root = document.querySelector('[data-rs-page]'); if(root){ rescueRailPaint(root); rescueStrings(root); }
  const go = res.go || extraGo;
  toast(`${kind === 'letgo' ? 'Let go.' : 'Made ' + res.label + '.'}`, 7000, {label: 'undo', fn: () => {
    try { res.undo && res.undo(); } catch(e){}
    const i = b.exits.indexOf(rec); if(i >= 0) b.exits.splice(i, 1); b.fate = prevFate;
    rescueTouch(_rs.sheet); const el = document.querySelector(`[data-rsb="${b.id}"]`); if(el) rescueRefsPaint(el, b); }});
  void go;
}
function rescueExitStep(ctx, id){
  const {text} = ctx, back = '<button class="tbtn rs-m-back" data-back2>‹ back</button>';
  const bindBack = m => { const bk = m.querySelector('[data-back2]'); if(bk) bk.onclick = () => rescueMenuTop(ctx); };
  const head = t => `<div class="rs-m-h">${back}<span class="mono faint">${esc(t)}</span></div>`;
  if(id === 'letgo'){ rescueDone(ctx, 'letgo', {label: 'let go', undo: () => {}}); return; }
  if(id.startsWith('slot:')){
    const th = typeof wantsThing === 'function' ? wantsThing(id.slice(5)) : null, nx = th ? wantsSlotNext(th) : null;
    if(!nx){ toast('That thing has no time of its own set.'); return; }
    return rescueDone(ctx, 'remind', rescueMakeReminder(`${th.name}: ${rescueFirstLine(text)}`, nx.day, nx.time));
  }
  if(id === 'task') return rescueDone(ctx, 'task', rescueMakeTasks(text));
  if(id === 'question') return rescueDone(ctx, 'question', rescueMakeEntry(text, 'question'));
  if(id === 'proof') return rescueDone(ctx, 'proof', rescueMakeEntry(text, 'proof'));
  if(id === 'mindset') return rescueDone(ctx, 'mindset', rescueKeepLine(text));
  if(id === 'goal'){
    const wk = weekStart(today()), p = weekPlanSeen(wk), goals = typeof weekGoalsNamed === 'function' ? weekGoalsNamed(p) : [];
    ctx.step(`${head('under which goal?')}${goals.length ? goals.map((o, i) => `<button class="rs-m-row" data-g="${i}">${esc(o.text)}</button>`).join('') : '<p class="faint sm">No goals are written for this week. Plan the week first, then come back.</p><button class="btn sm" id="rsPlanWk">Plan the week</button>'}`, m => {
      bindBack(m);
      m.querySelectorAll('[data-g]').forEach(bn => bn.onclick = () => { const o = goals[+bn.dataset.g];
        const listId = (o.linkType === 'list' || o.linkType === 'project') && planList(o.linkId) ? o.linkId : 'inbox';
        const real = (S.weekPlans || {})[wk] ? (S.weekPlans[wk].outcomes || []).find(x => x.id === o.id) : o;
        rescueDone(ctx, 'goal', rescueMakeTasks(text, {listId, outcome: real})); });
      const pw = m.querySelector('#rsPlanWk'); if(pw) pw.onclick = () => { rescueCloseMenu(); openWeeklyPlan(today()); }; });
    return;
  }
  if(id === 'thread'){
    let kind = 'turn', which = 'this';
    const draw = () => { const wd = rescueWeekDays(which);
      ctx.step(`${head('a thread through the week')}
        <div class="rs-m-seg"><button class="chip sm${kind === 'turn' ? ' on' : ''}" data-k="turn">to contemplate</button><button class="chip sm${kind === 'do' ? ' on' : ''}" data-k="do">to do</button></div>
        <div class="rs-m-seg"><button class="chip sm${which === 'this' ? ' on' : ''}" data-w="this">this week</button><button class="chip sm${which === 'next' ? ' on' : ''}" data-w="next">next week</button></div>
        <div class="rs-m-days">${wd.days.map(d => `<label class="wp-dchip on"><input type="checkbox" value="${d}" checked>${esc(wpDayShort(d))}</label>`).join('')}</div>
        <button class="btn sm primary" id="rsMk">Make the thread</button>`, m => {
        bindBack(m);
        m.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { kind = x.dataset.k; draw(); });
        m.querySelectorAll('[data-w]').forEach(x => x.onclick = () => { which = x.dataset.w; draw(); });
        m.querySelectorAll('.wp-dchip input').forEach(c => c.onchange = () => c.parentNode.classList.toggle('on', c.checked));
        m.querySelector('#rsMk').onclick = () => { const days = [...m.querySelectorAll('.wp-dchip input:checked')].map(c => c.value); if(!days.length){ toast('Pick at least one day.'); return; }
          rescueDone(ctx, 'thread', rescueMakeThread(text, kind, days, wd.weekOf)); }; }); };
    draw(); return;
  }
  if(id === 'journal'){
    const types = ['reflection', 'memory', 'gratitude', 'dream', 'intuition', 'synchronicity', 'lifeevent'];
    ctx.step(`${head('which journal?')}<div class="rs-m-seg wrap">${types.map(t => `<button class="chip sm" data-t="${t}">${typeIcon(t)} ${esc(typeName(t))}</button>`).join('')}</div>
      <button class="tbtn" id="rsFull">Open the full form instead</button>`, m => {
      bindBack(m);
      m.querySelectorAll('[data-t]').forEach(x => x.onclick = () => rescueDone(ctx, 'journal', rescueMakeEntry(text, x.dataset.t)));
      m.querySelector('#rsFull').onclick = () => { rescueCloseMenu(); openEntryModal({type: 'reflection', title: rescueFirstLine(text), body: text}); }; });
    return;
  }
  if(id === 'decision'){ rescueCloseMenu(); const rec = {kind: 'decision', label: 'a decision form', at: new Date().toISOString(), snippet: text.slice(0, 140)};
    ctx.b.exits = ctx.b.exits || []; ctx.b.exits.push(rec); if(ctx.whole) ctx.b.fate = 'decision'; rescueTouch(_rs.sheet); rescueRefsPaint(ctx.el, ctx.b);
    openDecisionModal({title: rescueFirstLine(text), situation: text}); return; }
  if(id === 'person'){
    const hits = rescueMentions(text).filter(r => r.type === 'person').map(r => byId(S.people, r.id)).filter(Boolean);
    const rest = (S.people || []).filter(p => !hits.includes(p));
    const row = p => `<button class="rs-m-row" data-p="${p.id}">${esc(p.name)}</button>`;
    ctx.step(`${head('who is this about?')}${hits.length ? `<div class="faint sm">named here</div>${hits.map(row).join('')}` : ''}
      <input class="inp sm" id="rsPF" placeholder="find a name…"><div id="rsPL">${rest.slice(0, 8).map(row).join('')}</div>`, m => {
      bindBack(m);
      const pick = pid => { const p = byId(S.people, pid); if(!p) return;
        ctx.step(`${head(p.name)}<button class="rs-m-row" data-a="log">Log what happened</button><button class="rs-m-row" data-a="reach">Reach out — make a task</button><button class="rs-m-row" data-a="open">Open their page</button>`, mm => {
          bindBack(mm);
          mm.querySelector('[data-a="log"]').onclick = () => { rescueCloseMenu(); openInteractionModal(null, p.id); const d = document.querySelector('#inDesc'); if(d) d.value = text;
            const rec = {kind: 'person', label: 'a note on ' + (p.nickname || p.name.split(' ')[0]), at: new Date().toISOString(), snippet: text.slice(0, 140)}; ctx.b.exits = ctx.b.exits || []; ctx.b.exits.push(rec); if(ctx.whole) ctx.b.fate = 'person'; rescueTouch(_rs.sheet); rescueRefsPaint(ctx.el, ctx.b); };
          mm.querySelector('[data-a="reach"]').onclick = () => rescueDone(ctx, 'person', rescueMakeTasks(`Reach out to ${p.nickname || p.name.split(' ')[0]}: ${rescueFirstLine(text)}`));
          mm.querySelector('[data-a="open"]').onclick = () => { rescueCloseMenu(); navigate('#/people/' + p.id); }; }); };
      m.querySelectorAll('[data-p]').forEach(x => x.onclick = () => pick(x.dataset.p));
      const f = m.querySelector('#rsPF'), l = m.querySelector('#rsPL');
      f.oninput = () => { const q = f.value.toLowerCase(); l.innerHTML = (S.people || []).filter(p => (p.name + ' ' + (p.nickname || '')).toLowerCase().includes(q)).slice(0, 10).map(row).join('');
        l.querySelectorAll('[data-p]').forEach(x => x.onclick = () => pick(x.dataset.p)); ctx.place(); }; });
    return;
  }
  if(id === 'remind'){
    const T = today(), opts = [['tonight, 9pm', T, '21:00'], ['tomorrow morning', addDays(T, 1), '09:00'], ['tomorrow', addDays(T, 1), ''], ['in three days', addDays(T, 3), ''], ['next week', addDays(weekStart(T), 7), '']];
    ctx.step(`${head('remind me…')}${opts.map((o, i) => `<button class="rs-m-row" data-o="${i}">${esc(o[0])}</button>`).join('')}
      <div class="row" style="gap:6px;margin-top:6px"><input class="inp sm" type="date" id="rsRD" value="${addDays(T, 1)}"><input class="inp sm" type="time" id="rsRT"><button class="btn sm" id="rsRG">Set</button></div>`, m => {
      bindBack(m);
      m.querySelectorAll('[data-o]').forEach(x => x.onclick = () => { const o = opts[+x.dataset.o]; rescueDone(ctx, 'remind', rescueMakeReminder(text, o[1], o[2])); });
      m.querySelector('#rsRG').onclick = () => rescueDone(ctx, 'remind', rescueMakeReminder(text, m.querySelector('#rsRD').value || addDays(T, 1), m.querySelector('#rsRT').value)); });
    return;
  }
  if(id === 'park'){
    ctx.step(`${head('park it as…')}<div class="rs-m-seg wrap">${PARK_KINDS.map(k => `<button class="chip sm" data-k="${k.id}">${k.glyph} ${esc(k.name)}</button>`).join('')}</div>`, m => {
      bindBack(m); m.querySelectorAll('[data-k]').forEach(x => x.onclick = () => rescueDone(ctx, 'park', rescuePark(text, x.dataset.k))); });
    return;
  }
}

/* ---------- what is on my plate ---------- */
function rescueRailPaint(root){
  const rail = rescueQ('#rsRail', root || document); if(!rail || rail.hidden) return;
  const r = rail.querySelector('#rsRailIn') || rail;
  const p = rescuePlate(), cap = p.capacity;
  r.innerHTML = `<div class="rs-rail-h"><span class="sc" style="margin:0">On my plate</span><span class="faint sm">press one to bring it onto the page</span></div>
    ${cap ? `<div class="rs-cap${cap.over ? ' over' : ''}"><b class="mono">${cap.tasks}</b> thing${cap.tasks === 1 ? '' : 's'} on today · ${cap.mins ? (typeof pbdSay === 'function' ? pbdSay(cap.mins) : cap.mins + 'm') : 'no estimates'} of about ${cap.hrs}h${cap.over ? ' — more than the day holds' : ''}</div>` : ''}
    ${p.groups.map(g => `<div class="rs-rg"><span class="mono faint">${esc(g.name)}</span>${g.items.map(i => `<button class="rs-ri" data-ri="${esc(i.kind)}|${esc(i.id)}" title="${esc(i.label)}"><span>${esc(i.label)}</span><em>${esc(i.detail)}</em></button>`).join('')}</div>`).join('') || '<p class="faint sm">Nothing pressing is on the plate.</p>'}`;
  r.querySelectorAll('[data-ri]').forEach(b => b.onclick = () => {
    const [kind, ...rest] = b.dataset.ri.split('|'), id = rest.join('|');
    const it = p.groups.flatMap(g => g.items).find(i => i.kind === kind && i.id === id); if(!it || !_rs.newBox) return;
    const canvas = rescueQ('#rsCanvas', document), st = rescueQ('#rsStage', document);
    const n = _rs.newBox(st.scrollLeft + 40 + Math.random() * 120, st.scrollTop + 60 + Math.random() * (st.clientHeight - 200));
    n.ta.value = it.label; n.b.text = it.label; n.b.ref = {type: kind, id}; rescueFit(n.ta); rescueTouch(_rs.sheet); rescueRefsPaint(n.el, n.b); rescueStrings(document); n.ta.blur(); });
}

/* ---------- landing: three small things, and out ---------- */
function rescueLand(root){
  const s = _rs.sheet; if(s._virtual) return;
  const un = rescueUnhandled(s), tonight = (s.boxes || []).filter(b => b.horizon === 'tonight' && (b.text || '').trim());
  const sleep = (s.boxes || []).some(b => /\b(sleep|stay up|tired|late)\b/i.test(b.text || ''));
  const m = openModal(`<h2>Land it</h2>
    <p class="muted" style="font-size:.9rem">A page does not have to be finished to be put down. Three small things, and you are out.</p>
    ${typeof rescueGateLandHTML === 'function' ? rescueGateLandHTML(s) : ''}
    <div class="stack">
      <label class="pd-q"><span class="k">One thing decided for tonight</span>
        <textarea class="ta" id="rlDecide" style="min-height:56px" placeholder="e.g. sleep by 11:30; the abstract is the first thing tomorrow">${esc(s.landing && s.landing.decide || '')}</textarea></label>
      ${tonight.length ? `<div class="chip-row">${tonight.map(b => `<button type="button" class="chip sm" data-pickd="${b.id}">${esc(rescueFirstLine(b.text))}</button>`).join('')}</div>` : ''}
      <label class="pd-q"><span class="k">One next action (it becomes a task)</span>
        <input class="inp" id="rlNext" placeholder="e.g. write the first paragraph ~25m"></label>
      <label class="pd-q"><span class="k">Something I am putting down</span>
        <textarea class="ta" id="rlDown" style="min-height:48px" placeholder="what can wait, or was never mine">${esc(s.landing && s.landing.putDown || '')}</textarea></label>
      <label class="pd-q"><span class="k">How I feel now, in a word (optional)</span><input class="inp" id="rlFeel" style="max-width:14rem"></label>
      ${un.length ? `<p class="faint sm">${un.length} thing${un.length === 1 ? ' is' : 's are'} not sorted yet. They stay on the page, and the next page you open offers them to you again — to bring along, let go or leave.</p>` : ''}
      ${sleep ? `<p class="faint sm">Tonight’s question about sleeping is on this page — if it is still open, the first box above is a good place to settle it.</p>` : ''}
    </div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn ghost" id="rlNo">Not yet</button><button class="btn primary" id="rlGo">Land</button></div>`, 'narrow');
  m.querySelectorAll('[data-pickd]').forEach(b => b.onclick = () => { const x = rescueBoxOf(b.dataset.pickd); if(x) m.querySelector('#rlDecide').value = x.text; });
  m.querySelector('#rlNo').onclick = () => m.remove();
  if(typeof rescueGateLandBind === 'function') rescueGateLandBind(m, s, root);
  m.querySelector('#rlGo').onclick = () => {
    if(typeof rescueGateLandCheck === 'function' && !rescueGateLandCheck(m, s)) return;
    const nextText = m.querySelector('#rlNext').value.trim();
    const t = nextText ? commitQuickTask(nextText, {listId: 'inbox'}) : null;
    s.landing = {at: new Date().toISOString(), decide: m.querySelector('#rlDecide').value.trim(), next: nextText, nextTaskId: t ? t.id : null,
      putDown: m.querySelector('#rlDown').value.trim(), feel: m.querySelector('#rlFeel').value.trim()};
    s.endedAt = new Date().toISOString(); rescueTouch(s); saveNow();
    try { if(typeof timeAutoStop === 'function') timeAutoStop('rescue'); } catch(e){}
    m.remove(); sound('success');
    toast('Landed. The page is kept, and it is in the Review under today.', 6000);
    navigate('#/today');
  };
}

/* ---------- the pages, all of them ---------- */
function rescuePagesDialog(){
  const days = rescueByDay(), keys = Object.keys(days).sort().reverse();
  const row = s => `<div class="rs-pg" data-pg="${s.id}"><button class="rs-pg-o" data-open="${s.id}"><b>${esc(rescueTitle(s))}</b>
      <span class="mono faint">${esc(fmtDate(s.day, 'med'))} · ${rescueLive(s).length} thing${rescueLive(s).length === 1 ? '' : 's'} · ${rescueMinutes(s)} min${s.landing ? ' · landed' : ''}</span></button>
      <button class="tbtn danger" data-del="${s.id}" title="delete this page">×</button></div>`;
  const m = openModal(`<h2>Pages</h2><p class="muted sm">Every page is kept, by the day it was made.</p>
    <div class="rs-pgs">${keys.length ? keys.map(k => days[k].map(row).join('')).join('') : '<p class="faint">No pages yet.</p>'}</div>`, 'narrow');
  m.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { m.remove(); navigate('#/rescue/' + b.dataset.open); });
  m.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const s = rescueSheetById(b.dataset.del); if(!s) return;
    const undo = spliceOut(rescueSheets(), x => x.id === s.id); saveNow(); m.querySelector(`[data-pg="${s.id}"]`).remove();
    toast('Page deleted.', 8000, {label: 'undo', fn: () => { undo(); saveNow(); if(parseHash().name === 'rescue') rerender(); }});
    if(_rs && _rs.sheet.id === s.id) navigate('#/rescue/new'); });
}

/* ---------- the Review: every page, by the day it was made ---------- */
function rescueReviewHTML(){
  const days = rescueByDay(), keys = Object.keys(days).sort().reverse();
  if(!keys.length) return '';
  const n = rescueSheets().length;
  return `<section class="section rv rs-review"><div class="row between" style="align-items:baseline"><span class="sc" style="margin:0">Overwhelm rescue pages</span>
      <span class="mono faint">${n} page${n === 1 ? '' : 's'}, kept</span></div>
    <div class="rs-rv-list">${keys.slice(0, 40).map(k => days[k].map(s => `<button class="rs-rv-row" data-rsopen="${s.id}"><span class="mono">${esc(fmtDate(k, 'med'))}</span>
      <b>${esc(rescueTitle(s))}</b><span class="faint">${rescueLive(s).length} thing${rescueLive(s).length === 1 ? '' : 's'}${s.landing ? ' · landed' + (s.landing.decide ? ': ' + esc(s.landing.decide.slice(0, 60)) : '') : ''}${typeof rescueGateReviewBit === 'function' ? rescueGateReviewBit(s) : ''}</span></button>`).join('')).join('')}</div>
    ${keys.length > 40 ? '<p class="faint sm">Older pages are in Pages, inside the rescue space.</p>' : ''}</section>`;
}
function bindRescueReview(box){ box.querySelectorAll('[data-rsopen]').forEach(b => b.onclick = () => navigate('#/rescue/' + b.dataset.rsopen)); }

/* ---------- the morning after: what was left unsorted, offered once ---------- */
function pqRescue(T){
  const out = [];
  rescueSheets().filter(s => s.day < T && s.day >= addDays(T, -2) && !(s.seen || {}).morning).forEach(s => {
    const n = rescueUnhandled(s).length; if(!n) return;
    out.push(pqItem({id: 'rescue:' + s.id, source: 'new', category: 'nudge', rank: PQ_RANK.nudge + 8, period: 'day',
      msg: `${n} thing${n === 1 ? '' : 's'} from ${s.day === addDays(T, -1) ? 'last night’s' : fmtDate(s.day, 'short') + '’s'} page ${n === 1 ? 'is' : 'are'} still unsorted.`,
      rule: 'you wrote them on an overwhelm page and sent none of them anywhere',
      go: ['open the page', () => { s.seen = Object.assign({}, s.seen, {morning: true}); saveNow(); navigate('#/rescue/' + s.id); }]}));
  });
  return out;
}

/* ---------- a line that leans in, once in a while ---------- */
function rescueWhisperLater(root, ms){
  if(!_rs) return;
  _rs.timers.push(setTimeout(() => rescueWhisperShow(root), ms));
}
function rescueWhisperShow(root){
  if(!_rs || (S.settings || {}).rescueWhispers === false || document.hidden) { rescueWhisperLater(root, 120000); return; }
  const w = rescueWhisperFor(_rs.sheet, _rs.ui.whispered); if(!w){ return; }
  _rs.ui.whispered.push(w.t); if(_rs.ui.whispered.length > 10) _rs.ui.whispered.shift();
  const box = rescueQ('#rsWhisper', root); if(!box) return;
  box.innerHTML = `<span class="rs-w${w.own ? ' own' : ''}">${esc(w.t)}</span><button class="rs-wx" aria-label="not now" title="not now">×</button>`;
  box.classList.add('on'); const hide = () => { box.classList.remove('on'); };
  box.querySelector('.rs-wx').onclick = () => { hide(); };
  const t = setTimeout(hide, 14000); _rs.timers.push(t);
  rescueWhisperLater(root, 150000 + Math.random() * 90000);
}

/* Alt+R from anywhere (not while typing in a field): the door to the space */
document.addEventListener('keydown', ev => {
  if(!ev.altKey || ev.ctrlKey || ev.metaKey || ev.code !== 'KeyR') return;
  const t = ev.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(typeof S === 'undefined' || !S) return;
  ev.preventDefault(); navigate('#/rescue');
});

/* ---------- tonight: stay up, or sleep ----------
   Offered only when the page is about being tired or a promise to yourself (or it is
   late). It reads the sleep and time records back in plain words and puts the choices
   as things that can be made — never as a verdict. */
function rescueTonightShow(root){
  const btn = rescueQ('#rsTonightBtn', root); if(!btn || !_rs) return;
  const sc = rescueScenarios(_rs.sheet).map(x => x.id), late = new Date().getHours() >= 22 || new Date().getHours() < 4;
  btn.hidden = !(sc.includes('tired-sleep') || sc.includes('broken-promise') || (late && rescueLive(_rs.sheet).length > 1));
}
function rescueTonightFacts(f){
  const out = [], say = m => typeof pbdSay === 'function' ? pbdSay(m) : m + 'm';
  if(f.total >= 3) out.push(`Of the last ${f.total} nights with a log, ${f.late} ended after half past midnight.${f.bedGoal ? ` Your bedtime setting is ${esc(f.bedGoal)}.` : ''}`);
  else out.push('There are not enough nights logged yet to say much about your pattern.');
  if(f.afterLate && f.afterEarly){
    out.push(`On the days after the late nights you tracked about ${say(f.afterLate.tracked)} and finished ${f.afterLate.done} task${f.afterLate.done === 1 ? '' : 's'} a day, on ${f.afterLate.hours}h of sleep; after the earlier ones, about ${say(f.afterEarly.tracked)} and ${f.afterEarly.done}, on ${f.afterEarly.hours}h.`);
  } else if(f.total >= 3) out.push('Not enough late and early nights on both sides yet to compare the days that followed.');
  out.push(f.tomorrow.tasks ? `Tomorrow already has ${f.tomorrow.tasks} thing${f.tomorrow.tasks === 1 ? '' : 's'} planned.` : 'Nothing is planned yet for tomorrow.');
  return out;
}
function rescueTonightFrame(root){
  const s = _rs.sheet, f = rescueSleepFacts(), box = (s.boxes || []).find(b => /\b(stay up|sleep|tired|finish|tonight|however late)\b/i.test(b.text || '') && (b.text || '').trim());
  const thing = box ? rescueFirstLine(box.text) : '';
  document.querySelectorAll('.rs-frame').forEach(n => n.remove());
  const d = document.createElement('div'); d.className = 'rs-frame';
  d.innerHTML = `<button class="rs-frame-x" aria-label="close">\u00d7</button><h3>Tonight, from my records</h3>
    <p class="faint sm">No verdict here \u2014 only what the record says, then three ways to make a choice real.</p>
    <ul>${rescueTonightFacts(f).map(t => `<li>${t}</li>`).join('')}</ul>
    <label class="pd-q"><span class="k">the thing in question</span><input class="inp sm" id="rfThing" value="${esc(thing)}" placeholder="e.g. finish the application"></label>
    <div class="rs-frame-opts">
      <button class="rs-m-row" data-fo="sleep"><b>Sleep now</b><br><span class="faint sm">it becomes the first thing tomorrow, as a task</span></button>
      <button class="rs-m-row" data-fo="min"><b>Thirty minutes, then bed</b><br><span class="faint sm">a stop reminder is set, and the thing is a task for tomorrow too</span></button>
      <button class="rs-m-row" data-fo="promise"><b>Change the promise, out loud</b><br><span class="faint sm">written in the journal so it is a decision, not a lapse</span></button>
    </div>`;
  rescueQ('#rsStage', root).parentNode.appendChild(d);
  const say = () => d.querySelector('#rfThing').value.trim() || 'the thing from tonight';
  d.querySelector('.rs-frame-x').onclick = () => d.remove();
  d.querySelector('[data-fo="sleep"]').onclick = () => { const r = rescueMakeTasks(`${say()} tomorrow !high`); toast('Made it tomorrow\u2019s first move. Good night, when you are ready.', 7000, {label: 'undo', fn: () => r.undo()}); d.remove(); };
  d.querySelector('[data-fo="min"]').onclick = () => { const n = new Date(Date.now() + 30 * 60000), hm = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    const a = rescueMakeTasks(`${say()} tomorrow`), r = rescueMakeReminder('Stop. Save where you are. Bed.', today(), hm);
    toast(`Stop reminder set for ${hm}; the rest is waiting tomorrow.`, 7000, {label: 'undo', fn: () => { a.undo(); r && r.undo(); }}); d.remove(); };
  d.querySelector('[data-fo="promise"]').onclick = () => { d.remove(); openEntryModal({type: 'reflection', title: 'Changing a promise to myself', body: `I told myself I would: ${say()}\n\nWhat I am changing it to, and why:\n\n`}); };
  s.seen = Object.assign({}, s.seen, {tonight: true}); rescueTouch(s);
}
