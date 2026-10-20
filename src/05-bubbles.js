/* ============================================================
   BUBBLE ENTRY — a form that does not look like one

   A form shows every question at once, in a rectangle, and asks for all of it.
   This takes any dialog that is a form and asks it one question at a time
   instead: a question arrives as a small cloud, you answer it, press Enter,
   and it drifts away as a bubble while the next one forms. Questions you
   skipped wait as faint outlines; touch one to go back to it. When there is
   nothing more to say ("that's enough" at any time, or the last question) the
   dialog's own Save button appears.

   Settings → Entering things chooses how (S.settings.bubbleMode):
     free    no dialog at all: clouds float over the page, the answered ones
             drift around the edges (the default)
     steps   the same one-at-a-time asking, inside the dialog
     plain   an ordinary form

   It changes nothing about the forms. It finds the questions the dialogs
   already have (.field, .pd-q) and stages the same elements — each is moved
   into the cloud while it is current and back where it came from when it is
   not — so every handler, id and save works as it did. A dialog it does not
   understand (a table, a canvas, a review flow, a text box outside any
   question, fewer than two questions, no Save button) is left alone. "plain
   form" on any dialog puts that one back.

   Under browser automation it stays out of the way (a test fills a form by
   reaching every field), unless window.__bbForce is set.
   ============================================================ */
const BB_UNIT = '.field, .pd-q';
const BB_MODES = [['free', 'Floating clouds', 'No dialog: each question forms as a cloud over the page, and the answered ones drift around the edges.'],
  ['steps', 'One at a time, in the dialog', 'The same asking, one question at a time, but inside the dialog’s rectangle.'],
  ['plain', 'Plain form', 'Every question at once, as an ordinary form.']];
function bbMode(){
  const s = (typeof S !== 'undefined' && S.settings) || {};
  if(s.bubbleMode === 'free' || s.bubbleMode === 'steps' || s.bubbleMode === 'plain') return s.bubbleMode;
  return s.bubbles === false ? 'plain' : 'free';
}
const bbEnabled = () => bbMode() !== 'plain' && (!navigator.webdriver || window.__bbForce);
const bbReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const bbLabelOf = u => { if(u.dataset.bblabel) return u.dataset.bblabel; const l = u.querySelector(':scope > label, :scope > .k, :scope > .lbl, label, .k'); return l ? l.textContent.replace(/\s+/g, ' ').trim() : ''; };
const bbCut = (t, n) => t.length > n ? t.slice(0, n - 1) + '…' : t;
function bbSummary(u){
  const parts = [];
  u.querySelectorAll('input, textarea, select').forEach(f => {
    if(f.type === 'hidden' || f.type === 'file' || f.type === 'range' || f.hidden) return;
    if(f.type === 'checkbox' || f.type === 'radio'){ if(f.checked){ const l = f.closest('label'); parts.push(l ? l.textContent.replace(/\s+/g, ' ').trim() : 'yes'); } return; }
    if(f.tagName === 'SELECT'){ const o = f.selectedOptions && f.selectedOptions[0]; if(o && o.value) parts.push(o.textContent.trim()); return; }
    if((f.value || '').trim()) parts.push(f.value.trim());
  });
  u.querySelectorAll('.chip.on, .chip.sel, .chip.active, .chip[aria-pressed="true"]').forEach(c => parts.push(c.textContent.replace(/\s+/g, ' ').trim()));
  return parts.join(', ');
}
/* the questions of a dialog, wherever they are being staged (the overlay holds both the dialog and the stage) */
function bbUnits(root, free){
  const skip = free ? '[hidden]' : '[hidden], details:not([open])';
  const all = [...root.querySelectorAll(BB_UNIT)].filter(u => !u.parentElement.closest(BB_UNIT) && !u.hidden && u.style.display !== 'none' && !u.closest(skip)
    && u.querySelector('input:not([type=hidden]), textarea, select, .chip, [contenteditable], .dropzone, .deps, .dp-field, .chip-row, .ladder'));
  /* what a dialog keeps folded away ("optional worksheet", "connect this entry") is asked last, after what matters */
  const folded = u => !!u.closest('details:not([open])');
  return all.filter(u => !folded(u)).concat(all.filter(folded));
}
/* A text box that sits outside any question (a title at the top of a form, usually) is made one: it is put in a
   wrapper that asks with its own placeholder. A few at most — more than that is not a form it understands. */
const BB_LOOSE = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]), textarea, select';
function bbWrapLoose(modal){
  const loose = [...modal.querySelectorAll(BB_LOOSE)].filter(f => !f.hidden && !f.closest(BB_UNIT) && !f.closest('[hidden], details, .bb-stage, .typerow'));
  if(loose.length > 3 || loose.some(f => f.tagName === 'SELECT')) return null;
  return loose.map(f => { const w = document.createElement('div'); w.className = 'field bb-auto';
    w.dataset.bblabel = f.getAttribute('aria-label') || (f.getAttribute('placeholder') || '').replace(/\s*\(optional\)\s*$/i, '') || f.title || 'and…';
    f.parentNode.insertBefore(w, f); w.appendChild(f); return w; });
}
function bbUnwrap(ws){ (ws || []).forEach(w => { if(!w.parentNode) return; while(w.firstChild) w.parentNode.insertBefore(w.firstChild, w); w.remove(); }); }
function bbQualifies(overlay, modal, free){
  if(!modal || modal.dataset.plain || modal.querySelector('table, canvas, #flowBody, .flow-body, [data-nobubbles]')) return null;
  const wrappers = bbWrapLoose(modal); if(!wrappers) return null;
  const out = bbQualifies2(overlay, modal, free); if(!out) bbUnwrap(wrappers); else out.wrappers = wrappers;
  return out;
}
function bbQualifies2(overlay, modal, free){
  const units = bbUnits(overlay, free); if(units.length < 2 || units.length > 24) return null;
  if(modal.querySelectorAll('textarea').length > 16) return null;
  const prim = [...modal.querySelectorAll('.btn.primary, button.primary')].filter(b => !b.closest(BB_UNIT) && !b.closest('.bb-stage'));
  if(!prim.length) return null;
  const parent = prim[0].parentElement;
  const actions = parent && parent !== modal && !parent.querySelector(BB_UNIT) ? parent : prim[0];
  return {units, actions};
}

/* around the edges, clear of the type row at the top and the cloud in the middle */
const BB_SPOTS = [[14, 31], [86, 29], [88, 52], [13, 58], [18, 84], [80, 86], [50, 93], [87, 76], [32, 88], [66, 92], [14, 44], [86, 41], [14, 72], [86, 66], [26, 27], [74, 25], [42, 27], [60, 27], [22, 94], [82, 93]];
function bbBuild(overlay){
  const modal = overlay.querySelector('.modal'); if(!modal || modal._bb) return;
  const free = bbMode() === 'free';
  const q = bbQualifies(overlay, modal, free); if(!q) return;
  const st = {units: q.units, actions: q.actions, wrappers: q.wrappers || [], i: 0, marks: new Map(), modal, overlay, free};
  modal._bb = st;
  const stage = document.createElement('div'); stage.className = 'bb-stage' + (free ? ' bb-stage-free' : ''); stage.setAttribute('aria-label', 'one question at a time');
  const head = free ? ((modal.querySelector('h2') || {}).textContent || '') : '';
  stage.innerHTML = `<span class="bb-puff p1" aria-hidden="true"></span><span class="bb-puff p2" aria-hidden="true"></span><span class="bb-puff p3" aria-hidden="true"></span>
    ${free ? `<button type="button" class="bb-x" data-bb="close" aria-label="close" title="close">×</button><p class="bb-cap serif">${esc(head)}</p><div class="bb-top"></div>` : ''}
    <div class="bb-sky" aria-label="answered and skipped"></div>
    <div class="bb-cloud" role="group"><div class="bb-slot"></div>
      <div class="bb-ctl"><button type="button" class="bb-round" data-bb="back" aria-label="back" title="back">‹</button><button type="button" class="bb-next" data-bb="next">next <i>↵</i></button><button type="button" class="bb-enough" data-bb="end" title="nothing more to say — go to the end">that’s enough</button></div></div>
    <div class="bb-end" hidden><p class="serif">All set.</p><p class="faint sm">Anything skipped is still there, as a faint bubble.</p><div class="bb-act"></div></div>
    <div class="bb-dots" aria-hidden="true"></div>
    <button type="button" class="bb-plain" data-bb="plain" title="show this as an ordinary form">plain form</button>`;
  st.stage = stage; st.sky = stage.querySelector('.bb-sky'); st.cloud = stage.querySelector('.bb-cloud'); st.slot = stage.querySelector('.bb-slot'); st.end = stage.querySelector('.bb-end'); st.dots = stage.querySelector('.bb-dots');
  const mark = el => { const m = document.createComment('bb'); el.parentNode.insertBefore(m, el); st.marks.set(el, m); };
  st.units.forEach(u => { mark(u); u.classList.add('bb-unit', 'bb-away'); });
  if(free){
    /* no dialog: the stage covers the page, and the dialog itself is put out of sight */
    const tr = modal.querySelector('.typerow'); if(tr && !tr.hidden){ mark(tr); stage.querySelector('.bb-top').appendChild(tr); st.typerow = tr; }
    mark(st.actions); stage.querySelector('.bb-act').appendChild(st.actions);
    overlay.appendChild(stage); overlay.classList.add('bb-free'); modal.classList.add('bb-on', 'bb-gone');
  } else {
    st.units[0].before(stage); modal.classList.add('bb-on');
    st.actions.classList.add('bb-hide');
  }

  const park = u => { const m = st.marks.get(u); if(m && m.parentNode) m.parentNode.insertBefore(u, m); u.classList.remove('bb-cur'); u.classList.add('bb-away'); };
  const skyChips = () => {
    st.sky.innerHTML = '';
    let n = 0;
    st.units.forEach((u, k) => { if(k === st.i) return; const sum = bbSummary(u), lab = bbLabelOf(u) || 'more';
      const c = document.createElement('button'); c.type = 'button'; c.className = 'bb-chip' + (sum ? '' : ' empty'); c.dataset.bbgo = k;
      c.style.setProperty('--d', (k * 0.05) + 's'); c.style.setProperty('--s', (0.92 + ((k * 37) % 17) / 100).toFixed(2)); c.style.setProperty('--b', (5.5 + (k * 13) % 5) + 's');
      if(free){ const sp = BB_SPOTS[n % BB_SPOTS.length]; c.style.setProperty('--x', sp[0] + '%'); c.style.top = sp[1] + '%'; n++; }
      c.textContent = sum ? `${bbCut(lab, 26)} · ${bbCut(sum, 30)}` : '＋ ' + bbCut(lab, 34);
      c.title = lab; st.sky.appendChild(c); });
    st.dots.innerHTML = st.units.map((u, k) => `<i class="${k === st.i ? 'on' : bbSummary(u) ? 'done' : ''}"></i>`).join('');
  };
  const go = n => {
    const cur = st.units[st.i]; if(cur && cur.classList.contains('bb-cur')) park(cur);
    st.i = Math.max(0, Math.min(st.units.length, n));
    const ended = st.i >= st.units.length;
    st.cloud.hidden = ended; st.end.hidden = !ended;
    if(ended){
      if(!free) st.actions.classList.remove('bb-hide');
      skyChips(); st.stage.classList.add('is-end');
      const pb = st.actions.matches('button') ? st.actions : st.actions.querySelector('.btn.primary, button.primary');
      if(pb) setTimeout(() => { try { pb.focus({preventScroll: true}); } catch(e){} }, 60);
      return;
    }
    st.stage.classList.remove('is-end'); if(!free) st.actions.classList.add('bb-hide');
    const u = st.units[st.i]; u.classList.remove('bb-away'); u.classList.add('bb-cur'); st.slot.appendChild(u);
    st.cloud.classList.remove('bb-in'); void st.cloud.offsetWidth; st.cloud.classList.add('bb-in');
    st.stage.querySelector('[data-bb="back"]').style.visibility = st.i ? 'visible' : 'hidden';
    st.stage.querySelector('[data-bb="next"]').firstChild.textContent = st.i === st.units.length - 1 ? 'done ' : 'next ';
    skyChips();
    /* a cloud below the fold of the dialog comes up into view */
    if(!free){ const r = st.cloud.getBoundingClientRect(); if(r.bottom > innerHeight - 24 || r.top < 60) setTimeout(() => { try { st.cloud.scrollIntoView({block: 'center', behavior: bbReduced() ? 'auto' : 'smooth'}); } catch(e){} }, 60); }
    const f = u.querySelector('input:not([type=hidden]):not([type=file]):not([type=checkbox]), textarea, select');
    if(f) setTimeout(() => { try { f.focus({preventScroll: true}); } catch(e){} }, 120);
  };
  st.go = go;
  stage.addEventListener('click', ev => {
    const b = ev.target.closest('[data-bb]'), c = ev.target.closest('[data-bbgo]');
    if(c){ sound('click'); go(+c.dataset.bbgo); return; }
    if(!b) return; const a = b.dataset.bb;
    if(a === 'next'){ sound('click'); go(st.i + 1); } else if(a === 'back'){ go(st.i - 1); } else if(a === 'end'){ go(st.units.length); }
    else if(a === 'plain') bbTeardown(modal, true);
    else if(a === 'close'){ const x = modal.querySelector('.close'); if(x) x.click(); else overlay.remove(); }
  });
  /* Enter answers a question and moves on; the form's own Enter-to-save is kept out of the way until the end */
  overlay.addEventListener('keydown', st.onKey = ev => {
    if(ev.key !== 'Enter' || ev.isComposing || !st.stage.isConnected) return;
    const t = ev.target; if(!t || !st.stage.contains(t) || st.stage.classList.contains('is-end')) return;
    if(t.closest('button, a, [data-bb]') && !t.matches('input, textarea, select')) return;
    if(t.tagName === 'TEXTAREA' && !(ev.metaKey || ev.ctrlKey)) return;
    if(t.tagName === 'SELECT') return;
    ev.preventDefault(); ev.stopImmediatePropagation(); sound('click'); go(st.i + 1);
  }, true);
  /* something focused a question that is away (a save that wants a missing field): bring it forward */
  overlay.addEventListener('focusin', st.onFocus = ev => { const u = ev.target.closest && ev.target.closest('.bb-away'); if(!u) return; const k = st.units.indexOf(u); if(k >= 0) go(k); });
  overlay.addEventListener('input', st.onInput = () => { st.cloud.classList.remove('bb-breath'); void st.cloud.offsetWidth; st.cloud.classList.add('bb-breath'); }, true);
  /* a Save that leaves the dialog open wants something: the empty bubbles pulse, so there is somewhere to look */
  st.actions.addEventListener('click', () => setTimeout(() => { if(!overlay.isConnected || !st.stage.isConnected) return;
    st.sky.querySelectorAll('.bb-chip.empty').forEach(c => { c.classList.remove('bb-nudge'); void c.offsetWidth; c.classList.add('bb-nudge'); }); }, 350));
  go(0);
  /* the dialog was drawn again under us (the type changed, a step moved on): build anew */
  st.mo = new MutationObserver(() => {
    if(!overlay.isConnected){ st.mo.disconnect(); return; }
    const now = bbUnits(overlay, free), same = now.length === st.units.length && now.every(u => st.units.includes(u));
    if(!same && !st.busy){ st.busy = true; bbTeardown(modal, false); setTimeout(() => { bbBuild(overlay); }, 30); }
  });
  st.mo.observe(overlay, {childList: true, subtree: true});
}
function bbTeardown(modal, plain){
  const st = modal && modal._bb; if(!st) return;
  try { st.mo.disconnect(); } catch(e){}
  const back = el => { const m = st.marks.get(el); if(m && m.parentNode){ m.parentNode.insertBefore(el, m); m.remove(); } };
  st.units.forEach(u => { back(u); u.classList.remove('bb-unit', 'bb-away', 'bb-cur'); });
  if(st.typerow) back(st.typerow);
  if(st.free) back(st.actions);
  bbUnwrap(st.wrappers);
  st.stage.remove(); st.actions.classList.remove('bb-hide');
  modal.classList.remove('bb-on', 'bb-gone'); st.overlay.classList.remove('bb-free');
  st.overlay.removeEventListener('keydown', st.onKey, true); st.overlay.removeEventListener('focusin', st.onFocus); st.overlay.removeEventListener('input', st.onInput, true);
  delete modal._bb; if(plain) modal.dataset.plain = '1';
}
/* every dialog that opens is looked at once, after whatever opened it has finished filling it in */
function bbWatchModals(){
  const host = document.getElementById('modals'); if(!host || host._bbWatch) return; host._bbWatch = true;
  new MutationObserver(muts => {
    if(!bbEnabled()) return;
    muts.forEach(m => m.addedNodes.forEach(n => { if(n.nodeType === 1 && n.classList.contains('overlay')) setTimeout(() => { if(n.isConnected && bbEnabled()) try { bbBuild(n); } catch(e){ console.warn('bubble entry', e); } }, 0); }));
  }).observe(host, {childList: true});
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bbWatchModals); else bbWatchModals();

/* ---------- Settings ---------- */
function bubblesSettingsHTML(){
  const mode = bbMode();
  return `<div class="card rv" id="bubblesCard"><h3>Entering things</h3>
    <p class="muted" style="font-size:.85rem;margin:0 0 8px">How a form is asked. “That’s enough” skips to Save at any point, and “plain form” on any dialog puts that one back to an ordinary form.</p>
    <div class="bb-modes" role="radiogroup">${BB_MODES.map(([id, name, d]) => `<button type="button" role="radio" aria-checked="${mode === id}" class="bb-mode${mode === id ? ' on' : ''}" data-bbmode="${id}"><b>${esc(name)}</b><span>${esc(d)}</span></button>`).join('')}</div></div>`;
}
function bindBubblesSettings(root){
  (root || document).querySelectorAll('[data-bbmode]').forEach(b => b.onclick = () => {
    S.settings.bubbleMode = b.dataset.bbmode; delete S.settings.bubbles; saveNow();
    (root || document).querySelectorAll('[data-bbmode]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
  });
}
