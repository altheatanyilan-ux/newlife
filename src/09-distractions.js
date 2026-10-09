/* ============================================================
   THE DISTRACTION CHEAT SHEET

   Parked thoughts come from inside. These come from the room: the phone that
   buzzed, the tab left open, the hunger at eleven, the neighbour's drill.
   Noting one does nothing for this sitting — it is already spent — but
   written down it becomes something you can take away before the next one.

   So it is a standing list, not a day's: each thing that pulled you away,
   and what you will do about it next time ("phone buzzing → in the other
   room"). Noting the same thing again counts it up rather than writing it
   twice, so the ones that keep winning rise to the top.

   And at the start of every sitting it flashes up — the list, most frequent
   first, each with a box to tick as you clear it — and then gets out of the
   way on its own. The clock is already running; this is thirty seconds of
   clearing the decks, not a gate. It can be turned off, and anything that
   has stopped happening can be taken off the sheet as handled (it is kept,
   with its count, in case it comes back).

   Kept in the planner's state (S.planning.distractions), a list added empty.
   ============================================================ */

function dxAll(){
  const p = planState();
  if(!Array.isArray(p.distractions)) p.distractions = [];
  return p.distractions;
}
const dxOn = () => dxAll().filter(x => !x.handled);
/* the ones that keep winning, first */
const dxRanked = () => dxOn().slice().sort((a, b) => (b.hits || []).length - (a.hits || []).length
  || (b.lastAt || '').localeCompare(a.lastAt || ''));
const dxFlashOn = () => planState().dxFlash !== false;
const dxById = id => dxAll().find(x => x.id === id) || null;

/* "phone buzzing → in the other room": what, and what next time */
function dxRead(raw){
  const t = String(raw || '').trim();
  const m = t.match(/^(.*?)\s*(?:→|->|=>|—>)\s*(.*)$/);
  return m ? {text: m[1].trim(), fix: m[2].trim()} : {text: t, fix: ''};
}
const dxKey = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function dxNote(raw){
  const {text, fix} = dxRead(raw);
  if(!text) return null;
  const now = new Date().toISOString();
  let x = dxAll().find(d => dxKey(d.text) === dxKey(text));
  if(x){
    x.hits = (x.hits || []).concat(now); x.lastAt = now;
    if(fix) x.fix = fix;
    /* it happened again, so it is not handled after all */
    if(x.handled){ x.handled = false; x.handledAt = null; }
  } else {
    x = {id: uid(), text, fix, hits: [now], lastAt: now, cleared: 0, handled: false, handledAt: null, addedAt: now, habitId: null};
    dxAll().push(x);
  }
  dxLogUrge(x, now);
  S._dxLast = x.id;
  saveNow();
  return x;
}
/* A distraction tagged to a breaking habit is an urge on that habit's record:
   when it was, which sitting it came in, and whether I was back within the
   break I had planned. Back in time, and the urge did not win. */
const dxBreakers = () => (S.habits || []).filter(h => !h.archived && typeof habIsBreaking === 'function' && habIsBreaking(h));
function dxLogUrge(x, at){
  if(!x || !x.habitId) return null;
  const h = (S.habits || []).find(v => v.id === x.habitId);
  if(!h || !Array.isArray(h.urgeLog)) return null;
  const f = typeof FocusTimer !== 'undefined' ? FocusTimer.state() : {idle: true};
  const standing = !f.idle && FocusTimer.breakStanding ? FocusTimer.breakStanding() : 'none';
  const returned = standing !== 'over';
  const u = {id: uid(), date: today(), at, intensity: 0, outcome: returned ? 'resisted' : 'slipped', strategy: x.fix || '', note: x.text,
    source: 'distraction', dxId: x.id, sitting: f.idle ? null : (f.startedAt || null), returned, standing};
  h.urgeLog.unshift(u);
  return u;
}
const dxTimes = x => (x.hits || []).length;
/* not seen for a fortnight after being on the sheet: probably dealt with */
const dxQuiet = x => x.lastAt && daysBetween(x.lastAt.slice(0, 10), today()) >= 14;

/* ---------- the box ---------- */
function dxItemHTML(x){
  const n = dxTimes(x);
  return `<li class="dx-it" data-dx="${esc(x.id)}">
    <span class="dx-g" aria-hidden="true">⚡</span>
    <span class="dx-body"><span class="dx-t">${esc(x.text)}</span>
      ${x.fix ? `<button type="button" class="dx-fix" data-dxact="fix" title="change what you will do about it">→ ${esc(x.fix)}</button>`
        : `<button type="button" class="dx-fix none" data-dxact="fix">→ what will you do about it next time?</button>`}</span>
    <span class="mono faint dx-n" title="${n} time${n === 1 ? '' : 's'}${x.cleared ? `, cleared before ${x.cleared} sitting${x.cleared === 1 ? '' : 's'}` : ''}">${n}×${dxQuiet(x) ? ' · quiet lately' : ''}</span>
    <span class="pk-acts">
      ${dxBreakers().length ? `<button type="button" data-dxact="tag" title="${x.habitId ? 'logged as an urge on that habit each time — press to change' : 'tag a habit you are breaking: each time is then an urge on its record'}">${x.habitId ? '↯ ' + esc((S.habits.find(h => h.id === x.habitId) || {}).name || 'habit') : '↯ tag'}</button>` : ''}
      <button type="button" data-dxact="again" title="it happened again">+1</button>
      <button type="button" data-dxact="handled" title="it has stopped happening — take it off the sheet">handled</button>
      <button type="button" data-dxact="drop" title="remove it altogether" aria-label="remove it">×</button></span>
  </li>`;
}
function distractionBlockHTML({where = 'focus'} = {}){
  const s = typeof FocusTimer !== 'undefined' ? FocusTimer.state() : {idle: true};
  const desk = typeof focusDeskOn === 'function' && focusDeskOn();
  const on = dxRanked();
  if(where === 'focus' && s.idle && !desk && !on.length && !S._dxOpen)
    return `<div class="dx dx-shut" data-dxwhere="focus"><button type="button" class="pl-mini" data-dxopen>⚡ distraction cheat sheet</button>
      <span class="faint">what pulls you away, and what to do about it before the next sitting</span></div>`;
  const handled = dxAll().filter(x => x.handled).length;
  return `<div class="dx" data-dxwhere="${esc(where)}">
    <div class="pk-h"><span class="k mono">distraction cheat sheet</span>
      <span class="mono faint">${on.length ? `${on.length} on it` : 'nothing on it yet'}${handled ? ` · ${handled} handled` : ''}</span></div>
    <input class="inp dx-inp" data-dxinp autocomplete="off" aria-label="note a distraction"
      placeholder="What pulled you away?  (phone buzzing → in the other room)">
    <div class="pk-hint mono faint">→ adds what you will do about it next time · the same thing again counts it up${where !== 'today' ? ' · D comes here' : ''}</div>
    ${(() => { const x = S._dxLast ? dxById(S._dxLast) : null;
      return x && typeof habStatePickerHTML === 'function' ? `<div class="dx-state"><span class="k mono">${esc(x.text)} \u2014 in what state? (optional)</span>
        ${habStatePickerHTML('data-dxstate', x.lastState || '')}${x.lastState ? habStateScriptHTML(x.lastState) : ''}</div>` : ''; })()}
    ${on.length ? `<ul class="dx-list">${on.map(dxItemHTML).join('')}</ul>` : ''}
    <label class="dx-flash"><input type="checkbox" data-dxflash${dxFlashOn() ? ' checked' : ''}>
      <span>show it at the start of every sitting, to clear them first</span></label>
  </div>`;
}
function bindDistractions(root){
  (root || document).querySelectorAll('.dx').forEach(box => {
    if(box._dxBound) return; box._dxBound = true;
    const openB = box.querySelector('[data-dxopen]');
    if(openB){ openB.onclick = () => { S._dxOpen = true; dxRepaint(); const i = document.querySelector('.dx [data-dxinp]'); if(i) i.focus(); }; return; }
    const inp = box.querySelector('[data-dxinp]');
    if(inp) inp.onkeydown = ev => {
      if(ev.key !== 'Enter') return;
      ev.preventDefault();
      const was = dxAll().length;
      const x = dxNote(inp.value); if(!x) return;
      if(typeof sound === 'function') sound('click');
      if(dxAll().length === was) toast(esc(`${x.text} — ${dxTimes(x)} times now.`), 3000);
      dxRepaint({keepFocus: true});
    };
    box.querySelectorAll('[data-dxstate]').forEach(b => b.onclick = () => {
      const x = S._dxLast ? dxById(S._dxLast) : null; if(!x) return;
      x.lastState = b.dataset.dxstate; x.states = x.states || {}; x.states[x.lastState] = (x.states[x.lastState] || 0) + 1;
      saveNow(); if(typeof sound === 'function') sound('click'); dxRepaint(); });
    const fl = box.querySelector('[data-dxflash]');
    if(fl) fl.onchange = () => { planState().dxFlash = fl.checked; saveNow(); };
    box.onclick = ev => {
      const b = ev.target.closest('[data-dxact]'); if(!b) return;
      const x = dxById(b.closest('[data-dx]')?.dataset.dx); if(!x) return;
      const act = b.dataset.dxact;
      if(act === 'fix'){ dxEditFix(x, b); return; }
      if(act === 'tag'){
        const sel = el(`<select class="sel" aria-label="the habit this is an urge on"><option value="">no habit</option>${dxBreakers().map(h =>
          `<option value="${esc(h.id)}"${x.habitId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('')}</select>`);
        b.replaceWith(sel); sel.focus();
        sel.onchange = () => { x.habitId = sel.value || null; saveNow(); dxRepaint(); };
        sel.onblur = () => dxRepaint();
        return;
      }
      if(act === 'again'){ dxNote(x.text); if(typeof sound === 'function') sound('click'); }
      else if(act === 'handled'){
        x.handled = true; x.handledAt = new Date().toISOString(); saveNow();
        toast(esc(`${x.text} — off the sheet. It comes back if you note it again.`), 5000,
          {label: 'undo', fn: () => { x.handled = false; x.handledAt = null; saveNow(); dxRepaint(); }});
      } else if(act === 'drop'){
        const all = dxAll(), i = all.indexOf(x); all.splice(i, 1); saveNow();
        toast('Removed.', 5000, {label: 'undo', fn: () => { dxAll().splice(i, 0, x); saveNow(); dxRepaint(); }});
      }
      dxRepaint();
    };
  });
}
/* what you will do about it, written in place */
function dxEditFix(x, btn){
  const input = el(`<input class="inp dx-fixinp" value="${esc(x.fix || '')}" placeholder="next time I will…" aria-label="what you will do about it next time">`);
  btn.replaceWith(input);
  input.focus();
  /* Enter, Escape or leaving the field: whichever comes first, once (the
     redraw itself takes the field away, which is a blur of its own) */
  let finished = false;
  const done = keep => { if(finished) return; finished = true; input.onblur = null;
    if(keep){ x.fix = input.value.trim(); saveNow(); } dxRepaint(); };
  input.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); done(true); } else if(ev.key === 'Escape'){ ev.stopPropagation(); done(false); } };
  input.onblur = () => done(true);
}
function dxRepaint({keepFocus = false} = {}){
  document.querySelectorAll('.dx').forEach(box => {
    const had = keepFocus && box.contains(document.activeElement);
    const fresh = el(distractionBlockHTML({where: box.dataset.dxwhere || 'focus'}));
    box.replaceWith(fresh);
    bindDistractions(fresh.parentNode || document);
    if(had){ const i = fresh.querySelector('[data-dxinp]'); if(i) i.focus(); }
  });
}
/* D: to the box, wherever it is */
function dxFocusInput(){
  if(document.getElementById('pkPocket') && typeof parkPocketOpen === 'function'){
    parkPocketOpen(true);
    const i = document.querySelector('#pkPanel [data-dxinp]'); if(i){ i.focus(); return true; }
  }
  const shut = document.querySelector('#main .dx-shut [data-dxopen]');
  if(shut){ shut.click(); return true; }
  const i = document.querySelector('#main .dx [data-dxinp]');
  if(!i) return false;
  i.scrollIntoView({block: 'center', behavior: typeof reduced === 'function' && reduced() ? 'auto' : 'smooth'});
  i.focus();
  return true;
}

/* ---------- the flash, at the start of a sitting ----------
   A new sitting is a focus phase with a start time not seen before, caught in
   its first seconds — so a paused sitting resumed, or a page reloaded in the
   middle of one, does not bring it back. */
let _dxLastStart = null, _dxAway = null;
function dxShouldFlash(s){
  if(!s || s.idle || !s.running || s.phase !== 'focus' || !s.startedAt) return false;
  /* a clock the pill or a room started is not a sitting of work to clear the decks for */
  if(s.meta) return false;
  if(s.startedAt === _dxLastStart) return false;
  _dxLastStart = s.startedAt;
  return s.elapsed <= 6 && dxFlashOn() && dxOn().length > 0;
}
function dxFlash(){
  document.getElementById('dxFlash')?.remove();
  const list = dxRanked().slice(0, 7);
  if(!list.length) return null;
  const soft = typeof reduced === 'function' && reduced();
  const hold = 18000;
  const box = el(`<div class="dx-flashcard" id="dxFlash" role="dialog" aria-label="before this sitting: clear these">
    <div class="dx-fc-h"><span class="k mono">before this sitting</span><span class="serif dx-fc-t">Clear the decks</span></div>
    <ul class="dx-fc-list">${list.map(x => `<li><label><input type="checkbox" data-dxclr="${esc(x.id)}">
      <span><b>${esc(x.text)}</b>${x.fix ? ` <span class="dx-fc-fix">→ ${esc(x.fix)}</span>` : ''}</span>
      <span class="mono faint">${dxTimes(x)}×</span></label></li>`).join('')}</ul>
    <div class="row between dx-fc-foot"><button type="button" class="dp-lnk" data-dxfoff>stop showing this</button>
      <button type="button" class="btn sm primary" data-dxgo>All clear — begin</button></div>
    <i class="dx-fc-bar" style="--hold:${hold}ms"></i></div>`);
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  const close = () => { clearTimeout(_dxAway); box.classList.remove('in'); box.classList.add('out');
    setTimeout(() => box.remove(), soft ? 0 : 320); };
  /* it leaves on its own unless it is being used */
  const arm = (ms = hold) => { clearTimeout(_dxAway); _dxAway = setTimeout(() => { if(!box.matches(':hover') && !box.contains(document.activeElement)) close(); else arm(4000); }, ms); };
  box.addEventListener('pointerenter', () => box.classList.add('held'));
  /* once it has been looked at, it goes a few seconds after the pointer leaves */
  box.addEventListener('pointerleave', () => { box.classList.remove('held'); box.classList.add('seen'); arm(5000); });
  box.querySelectorAll('[data-dxclr]').forEach(c => c.onchange = () => {
    const x = dxById(c.dataset.dxclr); if(!x) return;
    x.cleared = Math.max(0, (x.cleared || 0) + (c.checked ? 1 : -1)); saveNow();
    c.closest('li').classList.toggle('on', c.checked);
    if(typeof sound === 'function') sound('click');
    if([...box.querySelectorAll('[data-dxclr]')].every(k => k.checked)) setTimeout(close, 500);
  });
  box.querySelector('[data-dxgo]').onclick = close;
  box.querySelector('[data-dxfoff]').onclick = () => { planState().dxFlash = false; saveNow(); close();
    toast('It will not show before sittings. The box in the Focus section turns it back on.', 5000); dxRepaint(); };
  arm();
  return box;
}
function dxWatchTimer(){
  if(typeof FocusTimer === 'undefined' || dxWatchTimer.on) return;
  dxWatchTimer.on = true;
  /* A sitting already running when the house opens is well past its first
     seconds, so dxShouldFlash lets it be; nothing is read here, before the
     saved state has loaded. */
  FocusTimer.subscribe(s => { try { if(dxShouldFlash(s)) setTimeout(dxFlash, 250); } catch(e){} });
}
setTimeout(dxWatchTimer, 0);
