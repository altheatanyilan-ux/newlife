/* ============================================================
   FROM EARLIER PAGES — what was never settled comes with you

   A card that was never sent anywhere or let go is still a thing on your mind,
   and a new page used to start blank, so it had to be found on the old page or
   typed in again. Now a new page opens with a short review of every card from
   earlier pages that is still open — grouped by page, newest first — and for
   each one a choice: bring it here, let it go, or leave it where it is. One
   press applies them all. Brought cards keep their words, their face and the
   horizon they were on, are laid out tidily below whatever is already on the
   page, and are marked on the old page as carried (so they are not offered
   twice). "From earlier pages" in the header opens it whenever you like, and
   it can be undone.

   A card is open when it has words and has not been sent anywhere
   (a task, a thread, a person…), let go, or carried.
   ============================================================ */
const rescueOpenCards = s => (s.boxes || []).filter(b => (b.text || '').trim() && !b.fate && !(b.exits || []).length);
function rescueCarryPool(){
  const cur = _rs && _rs.sheet, from = addDays(today(), -60);
  return rescueSheets().filter(s => s !== cur && s.id !== (cur && cur.id) && (s.day || '') >= from).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map(s => ({s, cards: rescueOpenCards(s)})).filter(g => g.cards.length);
}
const rescueCarryCount = () => rescueCarryPool().reduce((n, g) => n + g.cards.length, 0);
function rescueCarryBtn(root){
  const b = root.querySelector('[data-rs="carry"]'); if(!b) return;
  const n = rescueCarryCount(); b.hidden = !n; const c = b.querySelector('.rs-badge'); if(c) c.textContent = n;
}
/* what happens once the gate (if any) is through: the earlier cards are reviewed, then the room is readied */
function rescueAfterGate(root){
  if(!_rs) return; rescueCarryBtn(root);
  const s = _rs.sheet;
  if((S.settings || {}).rescueCarry !== false && !s.landing && !rescueLive(s).length && !s.carrySeen && rescueCarryCount()){ rescueCarryShow(root, false); return; }
  if(typeof rescueReadyShow === 'function'){ _rs.gateReadyDone = true; rescueReadyShow(root); }
}
function rescueCarryShow(root, force){
  if(!_rs) return;
  root.querySelectorAll('.rs-carry').forEach(n => n.remove());
  const pool = rescueCarryPool(); if(!pool.length){ if(force) toast('Nothing is left open on the earlier pages.'); return; }
  root.querySelectorAll('.rs-ready').forEach(n => n.remove());
  const act = {}; pool.forEach(g => g.cards.forEach(b => { act[g.s.id + '|' + b.id] = 'bring'; }));
  const total = Object.keys(act).length, d = document.createElement('div'); d.className = 'rs-carry'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'from earlier pages');
  const when = s => s.day === today() ? 'earlier today' : s.day === addDays(today(), -1) ? 'yesterday' : fmtDate(s.day, 'short');
  d.innerHTML = `<div class="rs-carry-h"><span class="serif">From earlier pages</span><span class="mono faint" id="rcN"></span><button class="rs-ready-x" data-rc="later" aria-label="not now" title="not now">×</button></div>
    <p class="faint sm" style="margin:0 0 6px">${total} card${total === 1 ? '' : 's'} that never went anywhere. Say what each should do; nothing moves until you press the button.</p>
    <div class="rs-carry-set"><span class="mono faint">all</span><button class="chip sm" data-rcall="bring">bring here</button><button class="chip sm" data-rcall="letgo">let go</button><button class="chip sm" data-rcall="leave">leave</button></div>
    <div class="rs-carry-scroll">${pool.map(g => `<div class="rs-carry-g"><div class="rs-carry-gh"><b>${esc(when(g.s))}</b><span class="faint"> · ${esc(rescueTitle(g.s))}${g.s.landing ? ' · landed' : ''}</span><button class="tbtn" data-rcopen="${esc(g.s.id)}">open that page</button></div>
      ${g.cards.map(b => `<div class="rs-carry-r" data-rcid="${esc(g.s.id + '|' + b.id)}"><span class="rs-carry-t">${b.kind === 'question' && b.q ? `<i class="faint">${esc((b.q.text || '').slice(0, 60))}</i> ` : ''}${esc(b.text.trim().replace(/\s+/g, ' ').slice(0, 220))}</span>
        <span class="rs-carry-seg"><button class="on" data-rcact="bring">bring</button><button data-rcact="letgo">let go</button><button data-rcact="leave">leave</button></span></div>`).join('')}</div>`).join('')}</div>
    <div class="rs-carry-f"><button class="btn sm primary" data-rc="apply" id="rcGo"></button><span class="grow"></span><button class="tbtn" data-rc="later">not now</button></div>`;
  root.querySelector('#rsStage').parentNode.appendChild(d);
  const count = () => { const v = Object.values(act), b = v.filter(x => x === 'bring').length, l = v.filter(x => x === 'letgo').length;
    d.querySelector('#rcN').textContent = `${b} to bring · ${l} to let go · ${v.length - b - l} left`;
    const go = d.querySelector('#rcGo'); go.textContent = b || l ? `Apply${b ? ' — bring ' + b + ' here' : ''}${l ? (b ? ', ' : ' — ') + 'let ' + l + ' go' : ''}` : 'Leave them all'; };
  const paint = () => d.querySelectorAll('.rs-carry-r').forEach(r => r.querySelectorAll('[data-rcact]').forEach(b => b.classList.toggle('on', b.dataset.rcact === act[r.dataset.rcid])));
  d.addEventListener('click', ev => {
    const a = ev.target.closest('[data-rcact]'), all = ev.target.closest('[data-rcall]'), r = ev.target.closest('[data-rc]'), op = ev.target.closest('[data-rcopen]');
    if(a){ const row = a.closest('.rs-carry-r'); act[row.dataset.rcid] = a.dataset.rcact; paint(); count(); return; }
    if(all){ Object.keys(act).forEach(k => { act[k] = all.dataset.rcall; }); paint(); count(); return; }
    if(op){ navigate('#/rescue/' + op.dataset.rcopen); return; }
    if(!r) return;
    if(r.dataset.rc === 'later'){ _rs.sheet.carrySeen = true; d.remove(); if(typeof rescueReadyShow === 'function'){ _rs.gateReadyDone = true; rescueReadyShow(root); } return; }
    if(r.dataset.rc === 'apply'){ rescueCarryApply(root, pool, act); d.remove(); }
  });
  count();
}
/* the choices, made: one undo for the lot */
function rescueCarryApply(root, pool, act){
  const s = _rs.sheetNow ? _rs.sheetNow() : _rs.sheet, undo = [], made = [], now = new Date().toISOString();
  let nb = 0, nl = 0;
  pool.forEach(g => g.cards.forEach(old => {
    const a = act[g.s.id + '|' + old.id]; if(a === 'bring'){
      const b = rescueBoxNew(s, 40, 40, old.text); ['font', 'ink', 'horizon', 'kind', 'q', 'w', 'h'].forEach(k => { if(old[k] !== undefined) b[k] = JSON.parse(JSON.stringify(old[k])); });
      b.refs = (old.refs || []).slice(); b.from = {sheet: g.s.id, box: old.id, at: now}; made.push(b);
      const was = {fate: old.fate, exits: (old.exits || []).slice()}; const rec = {kind: 'carried', label: 'carried to a newer page', at: now, snippet: (old.text || '').slice(0, 140)};
      old.fate = 'carried'; old.exits = (old.exits || []).concat(rec); old.carriedTo = s.id; g.s.updatedAt = now; undo.push(() => { old.fate = was.fate; old.exits = was.exits; delete old.carriedTo; }); nb++;
    } else if(a === 'letgo'){
      const was = {fate: old.fate, exits: (old.exits || []).slice()}; old.fate = 'letgo'; old.exits = (old.exits || []).concat({kind: 'letgo', label: 'let go', at: now, snippet: (old.text || '').slice(0, 140)}); g.s.updatedAt = now;
      undo.push(() => { old.fate = was.fate; old.exits = was.exits; }); nl++;
    }
  }));
  s.carrySeen = true; rescueTouch(s); saveNow();
  rescuePaintAll(root);
  if(made.length){ rescueCarryPlace(root, made); }
  rescueCarryBtn(root);
  if(made.length || nl) toast(`${nb ? 'Brought ' + nb + ' here' : ''}${nb && nl ? ', ' : ''}${nl ? 'let ' + nl + ' go' : ''}.`, 8000, {label: 'undo', fn: () => {
    undo.forEach(f => f()); made.forEach(b => { const i = s.boxes.indexOf(b); if(i >= 0) s.boxes.splice(i, 1); }); rescueTouch(s); saveNow(); rescuePaintAll(root); rescueSizeCanvas(root); rescueCarryBtn(root); }});
  else if(typeof rescueReadyShow === 'function'){ _rs.gateReadyDone = true; rescueReadyShow(root); }
}
/* brought cards are laid out in tidy rows below whatever is already there (each in its column with the horizons showing) */
function rescueCarryPlace(root, made){
  const canvas = rescueQ('#rsCanvas', root), stage = rescueQ('#rsStage', root); if(!canvas || !stage) return;
  const ids = new Set(made.map(b => b.id)), all = [...canvas.querySelectorAll('.rs-box:not(.gone)')];
  if(_rs.ui.bands){ rescueGather(root); return; }
  const fresh = all.filter(el => ids.has(el.dataset.rsb)), old = all.filter(el => !ids.has(el.dataset.rsb));
  const GAP = 14, PAD = 22, W = Math.max(360, stage.clientWidth - 24);
  let y = old.length ? Math.max(...old.map(el => el.offsetTop + el.offsetHeight)) + 36 : PAD, x = PAD, rowH = 0;
  fresh.forEach(el => { const w = el.offsetWidth, h = el.offsetHeight;
    if(x > PAD && x + w > W - PAD){ x = PAD; y += rowH + GAP; rowH = 0; }
    const b = rescueBoxOf(el.dataset.rsb); if(b){ b.x = Math.round(x); b.y = Math.round(y); } el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
    x += w + GAP; rowH = Math.max(rowH, h); });
  rescueTouch(_rs.sheet); rescueSizeCanvas(root); rescueStrings(root);
  stage.scrollTo({top: Math.max(0, y - 80), behavior: 'smooth'});
}
