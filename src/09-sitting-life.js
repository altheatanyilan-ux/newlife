/* ============================================================
   THE LIFE OF A SITTING — before, during, after

   Before.  A sitting begun from the screen brings up one card, about twenty
   seconds long, with the clock already running (it is a reminder, not a gate):
     · the minimum that would make it worth having sat down — filled in from
       where you left off, else the first open step, else the habit's minimum;
     · what has to be true in the room (a list that is yours, and remembers
       what you ticked);
     · what to clear first — the distraction cheat sheet, no longer a card of
       its own;
     · the week's stake, if the week has one (only ever shown to you).
   "Same as last time" is one tap. It can be skipped, and the skip is recorded.

   During.  A task with an estimate counts down, with a margin on top
   ("36m + 9m margin") — the margin is a quarter until it is learnt. When the
   time is up the clock does not stop: it carries on as overtime, still counted
   against the estimate. Open-ended work counts up, and can chime softly every
   half hour with a bowl and the offer of a short break.

   After.  A card asks for one line — where to pick up — which is the next
   sitting's minimum. Whether the minimum was met, and how the focus was out of
   five, are asked and optional. Every third sitting on the same skill or
   project, a reflection is offered: what happened, what it showed, the rule,
   the next experiment — and filed as a journal entry on that skill or project.
   ============================================================ */

/* ---------- what is kept ---------- */
function fzState(){
  const p = planState();
  const o = p.preflight = p.preflight && typeof p.preflight === 'object' ? p.preflight : {};
  o.env = Array.isArray(o.env) ? o.env : [];
  o.env.forEach(e => { e.id = e.id || uid(); e.label = e.label || ''; e.ticked = !!e.ticked; });
  o.ran = +o.ran || 0;
  return o;
}
const fzMarginPct = () => { const p = planState().prefs || {}; const v = +p.focusMargin; return isFinite(v) && p.focusMargin !== undefined && p.focusMargin !== '' ? Math.min(100, Math.max(0, v)) : 25; };
const focusChimeOn = () => !!(planState().prefs && planState().prefs.softChime);
function fzStake(){
  try { const w = weekPlan(weekStart(today())); return (w.stake || '').trim(); } catch(e){ return ''; }
}

/* ---------- arming: a sitting begun from the screen ---------- */
let _pfArmedAt = 0;
function fzArm(){ _pfArmedAt = Date.now(); }
const fzArmed = () => _pfArmedAt && Date.now() - _pfArmedAt < 4000;

/* ---------- during: overtime and the soft chime ---------- */
function focusOvertimeBegan(){
  if(typeof sound === 'function') sound('success');
  toast(esc('That is the time you gave it. It carries on as overtime, counted against the estimate.'), 9000,
    {label: 'finish', fn: () => { try { FocusTimer.stop(true); } catch(e){} }});
}
function focusSoftChime(k){
  try { if(typeof CeremonySound !== 'undefined' && CeremonySound.bowl) CeremonySound.bowl(); else sound('success'); } catch(e){}
  toast(esc(`${k * 30} minutes in. A short break?`), 12000, {label: 'take one', fn: () => { try { FocusTimer.pause(); } catch(e){} }});
}

/* ---------- before: the minimum, and the card ---------- */
function fzLastPickUp(taskId, meta){
  const recs = (planState().focusSessions || []).slice().reverse();
  for(const r of recs){
    if(!(r.closeout && r.closeout.pickUp)) continue;
    if(taskId ? r.taskId === taskId : (!r.taskId && r.meta && meta && r.meta.what && r.meta.what === meta.what)) return r.closeout.pickUp;
  }
  return '';
}
function fzGoalFor(s){
  const pu = fzLastPickUp(s.taskId, s.meta);
  if(pu) return {text: pu, from: 'where you left off'};
  let t = null; try { t = s.taskId && typeof taskById === 'function' ? taskById(s.taskId) : null; } catch(e){}
  if(t){
    const sub = (t.subtasks || []).find(x => !x.isCompleted && !x.done);
    if(sub) return {text: sub.title || sub.text || '', from: 'the first open step'};
  }
  const hid = s.meta && s.meta.habitId, h = hid ? byId(S.habits || [], hid) : null;
  if(h && h.min) return {text: h.min, from: 'the habit’s minimum'};
  if(s.meta && s.meta.goal) return {text: s.meta.goal, from: 'the minimum you named'};
  return {text: '', from: ''};
}
/* true if the card should come up for this change of state: a sitting begun
   from the screen, caught in its first seconds */
let _dxLastStart = null, _dxAway = null;
function dxShouldFlash(s){
  if(!s || s.idle || !s.running || s.phase !== 'focus' || !s.startedAt) return false;
  if(s.meta) return false;
  if(s.startedAt === _dxLastStart) return false;
  _dxLastStart = s.startedAt;
  const armed = fzArmed(); if(armed) _pfArmedAt = 0;      /* an arming is for one sitting */
  return s.elapsed <= 6 && dxFlashOn() && armed;
}
function dxFlash(){ return fzShow(); }
function fzShow(){
  document.getElementById('dxFlash')?.remove();
  const s = FocusTimer.state();
  if(s.idle) return null;
  const pf = fzState(), goal = fzGoalFor(s), list = dxRanked().slice(0, 7), stake = fzStake();
  const soft = typeof reduced === 'function' && reduced();
  const hold = 24000;
  const box = el(`<div class="dx-flashcard fz-card" id="dxFlash" role="dialog" aria-label="before this sitting">
    <div class="dx-fc-h"><span class="k mono">before this sitting</span><span class="serif dx-fc-t">What would make it worth it?</span></div>
    <label class="fz-f"><span class="k mono">the minimum${goal.from ? ` · ${esc(goal.from)}` : ''}</span>
      <input class="inp" data-fzgoal value="${esc(goal.text)}" placeholder="the least that would count" autocomplete="off"></label>
    ${pf.env.length || true ? `<div class="fz-f"><span class="k mono">in the room</span>
      <ul class="fz-env">${pf.env.map(e => `<li><label><input type="checkbox" data-fzenv="${esc(e.id)}"${e.ticked ? ' checked' : ''}> <span>${esc(e.label)}</span></label></li>`).join('')}</ul>
      <input class="inp sm" data-fzenvadd placeholder="${pf.env.length ? 'add something to the list' : 'what should be true before you start — phone away, water, door shut'}" autocomplete="off"></div>` : ''}
    ${list.length ? `<div class="fz-f"><span class="k mono">clear first</span><ul class="dx-fc-list">${list.map(x => `<li><label><input type="checkbox" data-dxclr="${esc(x.id)}">
      <span><b>${esc(x.text)}</b>${x.fix ? ` <span class="dx-fc-fix">→ ${esc(x.fix)}</span>` : ''}</span>
      <span class="mono faint">${dxTimes(x)}×</span></label></li>`).join('')}</ul></div>` : ''}
    ${stake ? `<div class="fz-f fz-stake"><span class="k mono">this week’s stake · only you see this</span><div>${esc(stake)}</div></div>` : ''}
    <div class="fz-ritual" data-fzritual hidden></div>
    <div class="row between dx-fc-foot"><span class="row" style="gap:10px"><button type="button" class="dp-lnk" data-fzskip>skip</button><button type="button" class="dp-lnk" data-dxfoff>stop showing this</button></span>
      <button type="button" class="btn sm primary" data-dxgo>${pf.ran ? 'Begin — same as last time' : 'Begin'}</button></div>
    <i class="dx-fc-bar" style="--hold:${hold}ms"></i></div>`);
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  let settled = false;
  const close = () => { clearTimeout(_dxAway); box.classList.remove('in'); box.classList.add('out'); setTimeout(() => box.remove(), soft ? 0 : 320); };
  const record = skipped => {
    if(settled) return; settled = true;
    const live = FocusTimer.state();
    if(live.idle || live.startedAt !== s.startedAt) return;       /* the sitting it was for is gone */
    const gv = (box.querySelector('[data-fzgoal]') || {}).value || '';
    const cleared = [...box.querySelectorAll('[data-dxclr]:checked')].map(c => c.dataset.dxclr);
    if(skipped === 'auto') FocusTimer.setPreflight({at: new Date().toISOString(), skipped: true, auto: true});
    else if(skipped) FocusTimer.setPreflight({at: new Date().toISOString(), skipped: true});
    else {
      FocusTimer.setPreflight({at: new Date().toISOString(), skipped: false, goal: gv.trim(), cleared,
        env: fzState().env.map(e => ({id: e.id, label: e.label, ticked: e.ticked})), stake: !!stake,
        sameAsLast: !!pf.ran && gv.trim() === (goal.text || '').trim()});
      pf.ran = (pf.ran || 0) + 1; saveNow();
    }
    if(!skipped && gv.trim()) FocusTimer.setGoal(gv.trim());
    if(typeof rerender === 'function' && typeof focusSectionRepaint === 'function') focusSectionRepaint();
  };
  /* it leaves on its own unless it is being used — and that is a skip, said so */
  const arm = (ms = hold) => { clearTimeout(_dxAway); _dxAway = setTimeout(() => {
    if(!box.matches(':hover') && !box.contains(document.activeElement)){ record('auto'); close(); } else arm(4000); }, ms); };
  box.addEventListener('pointerenter', () => box.classList.add('held'));
  box.addEventListener('pointerleave', () => { box.classList.remove('held'); box.classList.add('seen'); arm(6000); });
  box.querySelectorAll('[data-dxclr]').forEach(c => c.onchange = () => {
    const x = dxById(c.dataset.dxclr); if(!x) return;
    x.cleared = Math.max(0, (x.cleared || 0) + (c.checked ? 1 : -1)); saveNow();
    c.closest('li').classList.toggle('on', c.checked);
    if(typeof sound === 'function') sound('click');
  });
  box.querySelectorAll('[data-fzenv]').forEach(c => c.onchange = () => {
    const e = fzState().env.find(x => x.id === c.dataset.fzenv); if(e){ e.ticked = c.checked; saveNow(); } });
  const add = box.querySelector('[data-fzenvadd]');
  if(add) add.onkeydown = ev => { if(ev.key !== 'Enter') return; ev.preventDefault();
    const v = add.value.trim(); if(!v) return;
    fzState().env.push({id: uid(), label: v, ticked: false}); saveNow();
    const li = el(`<li><label><input type="checkbox" data-fzenv="x"> <span>${esc(v)}</span></label></li>`);
    const e = fzState().env[fzState().env.length - 1]; li.querySelector('input').dataset.fzenv = e.id;
    li.querySelector('input').onchange = ev2 => { e.ticked = ev2.target.checked; saveNow(); };
    box.querySelector('.fz-env').appendChild(li); add.value = ''; add.placeholder = 'add something to the list'; };
  box.querySelector('[data-dxgo]').onclick = () => { record(false); close(); };
  box.querySelector('[data-fzskip]').onclick = () => { record(true); close(); };
  box.querySelector('[data-dxfoff]').onclick = () => { planState().dxFlash = false; saveNow(); record(true); close();
    toast('It will not show before sittings. The box in the Focus section turns it back on.', 5000); if(typeof dxRepaint === 'function') dxRepaint(); };
  box.addEventListener('keydown', ev => { if(ev.key === 'Enter' && ev.target.matches('[data-fzgoal]')){ ev.preventDefault(); record(false); close(); } });
  arm();
  return box;
}

/* ---------- after: where to pick up ---------- */
function fzSaveCloseout(sessionId, data){
  const rec = (planState().focusSessions || []).find(r => r.id === sessionId);
  if(!rec) return null;
  rec.closeout = Object.assign({at: new Date().toISOString()}, data);
  saveNow();
  return rec;
}
function fzSubjectOf(info){
  const m = info && info.meta;
  if(m && (m.linkedType === 'skill' || m.linkedType === 'project') && m.linkedId)
    return {type: m.linkedType, id: m.linkedId};
  if(info && info.taskId){
    let t = null; try { t = taskById(info.taskId); } catch(e){}
    const L = t && t.links;
    if(L && L.skills && L.skills[0]) return {type: 'skill', id: L.skills[0]};
    if(L && L.projects && L.projects[0]) return {type: 'project', id: L.projects[0]};
    let ref = null; try { ref = typeof findTaskRef === 'function' ? findTaskRef(info.taskId) : null; } catch(e){}
    if(ref && ref.project) return {type: 'project', id: ref.project.id};
  }
  return null;
}
function fzSubjectName(sub){
  if(!sub) return '';
  const o = byId(sub.type === 'skill' ? (S.skills || []) : (S.projects || []), sub.id);
  return o ? (o.name || '') : '';
}
function fzSittingsOn(sub){
  return (planState().focusSessions || []).filter(r => r.type === 'focus' && r.endedAt && (r.duration || 0) >= 1).filter(r => {
    const x = fzSubjectOf({taskId: r.taskId, meta: r.meta});
    return x && x.type === sub.type && x.id === sub.id; }).length;
}
function fzCloseout(info){
  if(!info || info.meta || !info.sessionId) return;
  const rec = (planState().focusSessions || []).find(r => r.id === info.sessionId);
  if(!rec || rec.type !== 'focus') return;
  document.getElementById('fzClose')?.remove();
  let taskName = '', done = false;
  try { const ref = info.taskId && typeof findTaskRef === 'function' ? findTaskRef(info.taskId) : null; if(ref){ taskName = ref.text || ''; done = !!ref.done; } } catch(e){}
  const mins = Math.round(+rec.duration || 0);
  const box = el(`<div class="dx-flashcard fz-card fz-close" id="fzClose" role="dialog" aria-label="the end of the sitting">
    <div class="dx-fc-h"><span class="k mono">${esc(fmtHM ? fmtHM(mins) : mins + 'm')}${taskName ? ` · ${esc(taskName)}` : ''}</span><span class="serif dx-fc-t">Where do you pick up?</span></div>
    <label class="fz-f"><span class="k mono">pick up here${done ? ' · the task is done, so this can stay empty' : ''}</span>
      <input class="inp" data-pcup maxlength="200" placeholder="the very next thing, exactly" autocomplete="off"></label>
    ${rec.goal ? `<div class="fz-f"><span class="k mono">the minimum was “${esc(rec.goal)}” — met?</span>
      <span class="fz-yn"><button type="button" class="chip tf-chip" data-pcmet="yes">yes</button><button type="button" class="chip tf-chip" data-pcmet="no">no</button></span></div>` : ''}
    <div class="fz-f"><span class="k mono">how was the focus? (optional)</span>
      <span class="fz-yn">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="chip tf-chip" data-pcq="${n}">${n}</button>`).join('')}</span></div>
    ${typeof closeoutExtraHTML === 'function' ? closeoutExtraHTML(info) : ''}
    <div class="row between dx-fc-foot"><button type="button" class="dp-lnk" data-pcskip>skip</button>
      <button type="button" class="btn sm primary" data-pcdone${done ? '' : ' disabled'}>Done</button></div></div>`);
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  const st = {met: null, q: null, felt: null, challenge: null};
  if(typeof closeoutExtraBind === 'function') closeoutExtraBind(box, info, st);
  const inp = box.querySelector('[data-pcup]'), go = box.querySelector('[data-pcdone]');
  const close = () => { box.classList.remove('in'); box.classList.add('out'); setTimeout(() => box.remove(), 320); };
  inp.oninput = () => { go.disabled = !done && !inp.value.trim(); };
  box.querySelectorAll('[data-pcmet]').forEach(b => b.onclick = () => { st.met = b.dataset.pcmet === 'yes';
    box.querySelectorAll('[data-pcmet]').forEach(x => x.classList.toggle('on', x === b)); });
  box.querySelectorAll('[data-pcq]').forEach(b => b.onclick = () => { st.q = +b.dataset.pcq;
    box.querySelectorAll('[data-pcq]').forEach(x => x.classList.toggle('on', x === b)); });
  const finish = skipped => {
    fzSaveCloseout(info.sessionId, skipped ? {skipped: true} : {pickUp: inp.value.trim(), goalMet: st.met, quality: st.q});
    if(typeof closeoutExtraSave === 'function') closeoutExtraSave(info, st);
    close();
    if(!skipped && typeof sound === 'function') sound('success');
    setTimeout(() => fzKolbMaybe(info), 450);
  };
  go.onclick = () => { if(!go.disabled) finish(false); };
  box.querySelector('[data-pcskip]').onclick = () => finish(true);
  inp.addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); if(!go.disabled) finish(false); } });
  setTimeout(() => { try { inp.focus(); } catch(e){} }, 400);
  return box;
}

/* ---------- every third sitting on the same thing: the cycle ---------- */
function fzKolb(){ const p = planState(); return p.kolb = p.kolb && typeof p.kolb === 'object' ? p.kolb : {}; }
function fzKolbMaybe(info){
  const sub = fzSubjectOf(info); if(!sub) return null;
  const n = fzSittingsOn(sub), key = `${sub.type}:${sub.id}`, k = fzKolb();
  const was = k[key] ? +k[key].at || 0 : 0;
  if(n < 3 || n - was < 3) return null;
  k[key] = {at: n, offered: new Date().toISOString(), done: false}; saveNow();
  return fzKolbShow(sub, key, n);
}
function fzKolbShow(sub, key, n){
  document.getElementById('fzKolb')?.remove();
  const name = fzSubjectName(sub) || (sub.type === 'skill' ? 'this skill' : 'this project');
  const q = [['experience', 'What happened?', 'The last few sittings, plainly.'],
    ['reflection', 'What did it show?', 'What worked, what did not, and why you think so.'],
    ['rule', 'What is the rule?', 'Something you would do again, or stop doing, in general.'],
    ['experiment', 'What will you try next?', 'One change, small enough to test in the next sitting.']];
  const box = el(`<div class="dx-flashcard fz-card fz-kolb" id="fzKolb" role="dialog" aria-label="a reflection">
    <div class="dx-fc-h"><span class="k mono">${n} sittings on ${esc(name)}</span><span class="serif dx-fc-t">A moment to learn from them</span></div>
    ${q.map(([id, label, ph]) => `<label class="fz-f"><span class="k mono">${esc(label)}</span>
      <textarea class="ta" rows="2" data-kq="${id}" placeholder="${esc(ph)}"></textarea></label>`).join('')}
    <div class="row between dx-fc-foot"><button type="button" class="dp-lnk" data-kskip>not now</button>
      <button type="button" class="btn sm primary" data-kdone>Keep it</button></div></div>`);
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  const close = () => { box.classList.remove('in'); box.classList.add('out'); setTimeout(() => box.remove(), 320); };
  box.querySelector('[data-kskip]').onclick = () => { fzKolb()[key].skipped = true; saveNow(); close(); };
  box.querySelector('[data-kdone]').onclick = () => {
    const v = {}; q.forEach(([id]) => { v[id] = box.querySelector(`[data-kq="${id}"]`).value.trim(); });
    if(!Object.values(v).some(Boolean)){ fzKolb()[key].skipped = true; saveNow(); close(); return; }
    const body = q.map(([id, label]) => v[id] ? `${label}\n${v[id]}` : '').filter(Boolean).join('\n\n');
    const links = {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []};
    links[sub.type === 'skill' ? 'skills' : 'projects'] = [sub.id];
    const e = {id: uid(), type: 'reflection', title: `What ${n} sittings on ${name} showed`, body, occurredAt: today(), createdAt: new Date().toISOString(),
      media: [], links, people: [], places: [], emotions: [], tags: ['kolb', 'sittings'], confidence: '', extra: {kolb: v, sittings: n}};
    (S.entries = S.entries || []).push(e);
    fzKolb()[key].done = true; fzKolb()[key].entryId = e.id; saveNow();
    if(typeof sound === 'function') sound('success');
    toast(esc(`Kept, on ${name}.`), 4000);
    close();
  };
  return box;
}

/* ---------- who is listening ---------- */
let _pfWatching = false;
function fzWatch(){
  if(_pfWatching || typeof FocusTimer === 'undefined' || !FocusTimer.onEnd) return;
  _pfWatching = true;
  FocusTimer.onEnd(info => { try { setTimeout(() => fzCloseout(info), 900); } catch(e){ console.warn('the close-out did not open', e); } });
}

/* ---------- settings: the part of the clock card that is about sittings ---------- */
function fzSettingsHTML(){
  const p = planState(), pf = fzState(), prefs = p.prefs = p.prefs || {};
  let stake = ''; try { stake = weekPlan(weekStart(today())).stake || ''; } catch(e){}
  return `
      <div class="opt"><div><b>A card before each sitting</b><div class="d">When you start a sitting from the screen, one card asks for the least that would make it worth it (filled in from where you left off), what should be true in the room, and what to clear first. One tap if nothing changed. It can be skipped, and the skip is recorded.</div></div><label class="toggle ${dxFlashOn()?'on':''}" id="sPfOn"><span class="sw"></span></label></div>
      <div class="opt"><div><b>Margin on an estimate</b><div class="d">A task with an estimate counts down its estimate and a margin on top: “36m + 9m margin”. A quarter until your own sittings say otherwise. When the time is up the clock carries on as overtime.</div></div>
        <span class="row" style="gap:6px;align-items:center"><input class="inp" type="number" min="0" max="100" style="width:72px" id="sPfMargin" value="${fzMarginPct()}"><span class="mono faint">%</span></span></div>
      <div class="opt"><div><b>A soft chime every half hour</b><div class="d">For open-ended work that counts up: a bowl at thirty minutes, and the offer of a short break.</div></div><label class="toggle ${prefs.softChime?'on':''}" id="sPfChime"><span class="sw"></span></label></div>
      <div class="opt" style="display:block"><div><b>In the room</b><div class="d">What should be true before you start — phone away, water, door shut. The card remembers what you ticked.</div></div>
        <div id="sPfEnv">${pf.env.map(e => `<div class="row" style="gap:6px;margin-top:6px" data-fze="${esc(e.id)}"><input class="inp" style="flex:1" value="${esc(e.label)}" aria-label="item"><button class="pl-mini" data-fzedel="${esc(e.id)}" title="take it out">×</button></div>`).join('')}
          <button class="btn sm ghost" id="sPfEnvAdd" style="margin-top:8px">+ an item</button></div></div>
      <div class="opt" style="display:block"><div><b>This week’s stake</b><div class="d">If you have put something on the line this week, write it here. It shows on the card before a sitting, only to you, and nothing enforces it.</div></div>
        <textarea class="ta hb-grow" rows="1" id="sPfStake" placeholder="a donation, a favour owed, a thing given up until it is done">${esc(stake)}</textarea></div>`;
}
function fzSettingsBind(root){
  const q = s => (root || document).querySelector(s);
  const on = q('#sPfOn'); if(on) on.onclick = () => { planState().dxFlash = !dxFlashOn(); saveNow(); on.classList.toggle('on', dxFlashOn()); };
  const mg = q('#sPfMargin'); if(mg) mg.onchange = () => { const v = Math.min(100, Math.max(0, Math.round(+mg.value || 0)));
    (planState().prefs = planState().prefs || {}).focusMargin = v; mg.value = v; saveNow(); };
  const ch = q('#sPfChime'); if(ch) ch.onclick = () => { const pr = planState().prefs = planState().prefs || {}; pr.softChime = !pr.softChime; saveNow(); ch.classList.toggle('on', !!pr.softChime); };
  (root || document).querySelectorAll('#sPfEnv [data-fze]').forEach(row => {
    const e = fzState().env.find(x => x.id === row.dataset.fze); if(!e) return;
    row.querySelector('input').onchange = ev => { e.label = ev.target.value.trim() || e.label; saveNow(); };
    row.querySelector('[data-fzedel]').onclick = () => requestDelete({label: 'That item', skipConfirm: true,
      remove: () => spliceOut(fzState().env, x => x.id === e.id)});
  });
  const add = q('#sPfEnvAdd'); if(add) add.onclick = () => { fzState().env.push({id: uid(), label: 'something that should be true', ticked: false}); saveNow(); rerender(); };
  const sk = q('#sPfStake'); if(sk) sk.onchange = () => { try { weekPlan(weekStart(today())).stake = sk.value.trim(); saveNow(); } catch(e){} };
}
