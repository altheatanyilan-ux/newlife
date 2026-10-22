/* ============================================================
   THE GATE — the one thing, before the page

   A page to think on is a good place to hide. When something is due or
   overdue, the gate stands in front of the page and asks what this session
   must not replace. It is built for the way putting-off actually goes:

     pick      the thing (the most overdue is already chosen), or "nothing is waiting"
               — said twice, with the list read back
     shrink    the first move, small enough to be silly; a length (2 / 5 / 10 / 15 / 25
               minutes); and the excuses you expect, each with its answer ready
     sprint    5-4-3-2-1, then a clock; a thought that nags is parked, not followed;
               "stuck" is a short set of ways through, not a way out
     after     what happened is told plainly: did, more, or didn't start
     not now   allowed — but as a promise with a time, a cost, a pause before it is
               accepted, and a reminder that is made on the spot

   Then the page is yours, for a while: a time-box rings when it is over, a thin
   strip keeps the thing in view, and landing the page asks the same question again.
   Settings: off / firm / hard. "Hard" is the default.
   ============================================================ */
const RESCUE_GATE_MINS = [2, 5, 10, 15, 25];
const RESCUE_GATE_STARTERS = [
  'Open it and look at it for two minutes',
  'Write the ugliest first sentence',
  'List its three parts, in any order',
  'Open the files and set the desk for it',
  'Send the one message that unblocks it',
  'Put the first thing on the screen, untouched',
];
/* what the head says, and the answer to it */
const RESCUE_EXCUSES = [
  {id: 'calm',    say: 'I need to feel calmer first',         back: 'Calm is what moving gives you, not what lets you start. Two minutes, then see.'},
  {id: 'plan',    say: 'I just need to plan it a bit more',   back: 'This page is the planning. The plan is one move. Write it, then do it.'},
  {id: 'info',    say: 'I need more information first',       back: 'Name the one missing fact. Getting it is the first move; the rest can start without it.'},
  {id: 'perfect', say: 'It has to be done properly',          back: 'A bad first draft is the only road to a good one. Ugly is the whole assignment.'},
  {id: 'after',   say: 'I’ll do it right after this',         back: '“After” is where this has been living. Before the page, not after it.'},
  {id: 'tired',   say: 'I’m too tired',                       back: 'Tired is a reason to shrink the move, not to skip it. The lowest bar, for two minutes.'},
  {id: 'long',    say: 'It will take too long',               back: 'You owe the sprint, not the whole thing. Ten minutes of it may be all.'},
  {id: 'later',   say: 'I’ll have more time later',           back: 'Later turns up as this same day with less of you in it. Name the hour, or begin.'},
  {id: 'mood',    say: 'I’m not in the mood',                 back: 'The mood usually arrives after the hands move, not before them.'},
  {id: 'check',   say: 'Let me just check one thing first',   back: 'That one thing is the door. Park it on the page; check it after the sprint.'},
  {id: 'hide',    say: 'This rescue page is productive too',  back: 'It is, for the thinking. The thing still needs doing, and it has not moved.'},
  {id: 'deserve', say: 'I’m overwhelmed, I need a break',     back: 'True — and a sprint is the shortest way to be less overwhelmed: one thing leaves the list.'},
];
const RESCUE_STUCK = [
  {id: 'noidea', name: 'I don’t know where to start', ask: 'Write what you do know about it — three lines, any order, no good ones needed.', cta: 'The first line is the move', big: true},
  {id: 'big',    name: 'It’s too big',                ask: 'Halve it. What is half of that move — still too big? Halve it again.', cta: 'That is the move', big: false},
  {id: 'dread',  name: 'I’m dreading it',             ask: 'Name the dread in one line. It gets smaller written down.', cta: 'Two minutes anyway', big: false},
  {id: 'need',   name: 'I need something or someone first', ask: 'What exactly, from whom? That becomes a task now, and asking for it becomes the move.', cta: 'Make it the move', big: false},
  {id: 'tired',  name: 'I’m wiped',                    ask: '', cta: '', big: false},
];

const rescueGateMode = () => { const m = (S.settings || {}).rescueGate; return m === 'off' || m === 'firm' ? m : 'hard'; };
const rescueGateCapMins = () => { const c = (S.settings || {}).rescueGateCap; return c == null ? 25 : Math.max(0, +c || 0); };
const rescueGateOf = s => (s && s.gate && s.gate.pick) ? s.gate : null;
const rescueGateMMSS = sec => { sec = Math.max(0, Math.round(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
const rescueGateDayOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const rescueGateTimeOf = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const rescueGateWhen = (day, time) => Date.parse(`${day}T${time || '09:00'}:00`);
function rescueGateIn(hours){
  const d = new Date(Date.now() + hours * 3600000); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  if(d.getHours() >= 22 || d.getHours() < 6){ d.setDate(d.getDate() + (d.getHours() >= 22 ? 1 : 0)); d.setHours(9, 0, 0, 0); }
  return d;
}

/* ---------- what is owed ---------- */
function rescueGateCandidates(){
  const T = today();
  let refs = [];
  try { refs = allTaskRefs().filter(r => !r.done && r.text && !(r.kind === 'own' && taskIsAside(r.task))); } catch(e){}
  const tag = r => {
    if(r.day && r.day < T){ const n = Math.max(1, Math.round((Date.parse(T) - Date.parse(r.day)) / 864e5)); return n === 1 ? 'a day late' : n + ' days late'; }
    if(r.day === T) return 'due today';
    return 'on today';
  };
  const est = r => { try { return typeof pbdEstOf === 'function' ? pbdEstOf(r.task) : 0; } catch(e){ return 0; } };
  const late = refs.filter(r => r.day && r.day < T).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 4);
  const due = refs.filter(r => r.day === T);
  const doing = refs.filter(r => !(r.day && r.day <= T) && typeof taskDoCovers === 'function' && taskDoCovers(r.task, T));
  return late.concat(due, doing).slice(0, 7).map(r => ({id: r.id, text: r.text, tag: tag(r), est: est(r), late: !!(r.day && r.day < T)}));
}
/* how this week has gone, from the pages themselves */
function rescueGatePattern(cur){
  const from = addDays(today(), -7);
  const prev = rescueSheets().filter(x => x !== cur && x.day >= from);
  const named = prev.filter(x => rescueGateOf(x));
  const untouched = named.filter(x => !(x.gate.sprints || []).some(p => p.result === 'did') && x.gate.status !== 'finished');
  return {pages: prev.length, named: named.length, untouched: untouched.length};
}
function rescueGateSameThing(pick, cur){
  if(!pick) return {named: 0, deferred: 0};
  const same = rescueSheets().filter(x => x !== cur && rescueGateOf(x) && ((pick.refId && x.gate.pick.refId === pick.refId) || x.gate.pick.text.trim().toLowerCase() === pick.text.trim().toLowerCase()));
  return {named: same.length, deferred: same.reduce((n, x) => n + (x.gate.deferrals || []).length, 0)};
}
function rescueGateLines(cur, pick){
  const p = rescueGatePattern(cur), same = rescueGateSameThing(pick, cur), out = [];
  if(same.named) out.push(`“${pick.text}” has been named on ${same.named} earlier page${same.named === 1 ? '' : 's'}${same.deferred ? ` and put off ${same.deferred} time${same.deferred === 1 ? '' : 's'}` : ''}.`);
  if(p.pages >= 2) out.push(`This is page ${p.pages + 1} in a week.`);
  if(p.untouched >= 1) out.push(`${p.untouched} of the last ${p.named} page${p.named === 1 ? '' : 's'} that named a thing ended with it untouched.`);
  return out;
}
function rescueGateExcuseOrder(){
  const n = (S.settings || {}).rescueExcuseN || {};
  return RESCUE_EXCUSES.slice().sort((a, b) => (n[b.id] || 0) - (n[a.id] || 0));
}

/* ---------- the overlay ---------- */
function rescueGateEl(root){
  let el = root.querySelector('.rs-gate');
  if(!el){
    el = document.createElement('div'); el.className = 'rs-gate'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'before the page');
    root.querySelector('#rsStage').parentNode.appendChild(el);
    const pg = root.querySelector('[data-rs-page]'); if(pg) pg.classList.add('gated');
  }
  return el;
}
function rescueGateNew(){
  const s = _rs.sheetNow ? _rs.sheetNow() : _rs.sheet;
  if(!s.gate) s.gate = {status: 'open', openedAt: new Date().toISOString(), pick: null, step: '', sprints: [], deferrals: [], excuses: [], parked: [], stuck: [], ext: 0, capEndsAt: null};
  return s.gate;
}
function rescueGateInit(root){
  if(!_rs) return false;
  const s = _rs.sheet, mode = rescueGateMode();
  _rs.timers.push(setInterval(() => rescueGateTick(root), 1000));
  if(s.landing) return false;
  const g = s.gate;
  if(g){
    if(g.status === 'sprint' && g.sprint) { rescueGateScreen(root, Date.parse(g.sprint.endsAt) > Date.now() ? 'sprint' : 'timeup'); return true; }
    if(g.status === 'timeup'){ rescueGateScreen(root, 'timeup'); return true; }
    if(g.status === 'open'){ rescueGateScreen(root, g.pick ? 'shrink' : 'pick'); return true; }
    rescueGateTether(root); return false;
  }
  if(mode === 'off' || rescueLive(s).length) return false;
  if(!rescueGateCandidates().length) return false;
  rescueGateScreen(root, 'pick'); return true;
}
function rescueGateShut(root){
  const el = root.querySelector('.rs-gate'); if(el) el.remove();
  const pg = root.querySelector('[data-rs-page]'); if(pg) pg.classList.remove('gated');
}
/* the page is let in; what was parked while the clock ran is put on it */
function rescueGateClose(root){
  const s = _rs.sheet, g = s.gate;
  if(g){
    if((g.parked || []).length){
      g.parked.forEach((t, i) => rescueBoxNew(s, 40 + (i % 3) * 250, 50 + Math.floor(i / 3) * 96, t));
      g.parked = []; rescuePaintAll(root);
      toast('What you parked is on the page.', 3500);
    }
    if(g.pick && g.status !== 'finished' && !g.capEndsAt && rescueGateCapMins() > 0 && g.status !== 'clear') g.capEndsAt = new Date(Date.now() + rescueGateCapMins() * 60000).toISOString();
    save();
  }
  rescueGateShut(root); rescueGateTether(root);
  if(!_rs.gateReadyDone) rescueAfterGate(root);
  const c = root.querySelector('#rsCanvas'); if(c && !(g && g.status === 'sprint')) c.focus();
}

function rescueGateScreen(root, name, arg){
  const el = rescueGateEl(root);
  _rs.gateScreen = name;
  const fn = {pick: rgPick, shrink: rgShrink, count: rgCount, sprint: rgSprint, stuck: rgStuck, timeup: rgTimeup, nostart: rgNostart, after: rgAfter, defer: rgDefer, enough: rgEnough}[name];
  if(fn) fn(root, el, arg || {});
}
const rgIn = (cls, html) => `<div class="rs-gate-in ${cls || ''}">${html}</div>`;
const rgBtn = (id, txt, cls) => `<button class="${cls || 'btn'}" id="${id}">${txt}</button>`;

/* — pick — */
function rgPick(root, el){
  const s = _rs.sheet, g = s.gate, cands = rescueGateCandidates(), hard = rescueGateMode() === 'hard';
  let sel = g && g.pick && g.pick.refId ? g.pick.refId : (cands[0] ? cands[0].id : '');
  const lines = rescueGateLines(s, null);
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">before the page</p>
    <h2 class="serif">What must this page not replace?</h2>
    <p class="rg-sub">A page like this is a good place to think, and a very good place to hide. Name the thing that is waiting. It is chosen for you already — the oldest first.</p>
    ${lines.length ? `<div class="rg-pattern">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>` : ''}
    <div class="rg-cands" role="radiogroup">${cands.map(c => `<label class="rg-c${c.id === sel ? ' on' : ''}" data-c="${esc(c.id)}"><input type="radio" name="rgc" value="${esc(c.id)}" ${c.id === sel ? 'checked' : ''}><span>${esc(c.text)}</span><em class="${c.late ? 'late' : ''}">${esc(c.tag)}${c.est ? ' · ~' + (typeof pbdSay === 'function' ? pbdSay(c.est) : c.est + 'm') : ''}</em></label>`).join('')}</div>
    <input class="inp" id="rgOwn" placeholder="${cands.length ? 'or something else you are avoiding — write it' : 'what are you avoiding? write it'}" maxlength="140">
    <div class="rg-row">${rgBtn('rgGo', 'This is the one →', 'btn primary')}<span class="grow"></span>
      ${rgBtn('rgNot', 'not now…', 'tbtn')}${rgBtn('rgNone', 'nothing is waiting on me', 'tbtn')}</div>
    <div class="rg-row rg-low">${rgBtn('rgUnload', 'I can’t think straight — three minutes to unload first, then this', 'tbtn')}${hard ? '' : rgBtn('rgSkip', 'skip it this time', 'tbtn')}</div>`);
  const radios = () => [...el.querySelectorAll('input[name="rgc"]')];
  el.querySelectorAll('.rg-c').forEach(l => l.onclick = () => { sel = l.dataset.c; el.querySelector('#rgOwn').value = ''; el.querySelectorAll('.rg-c').forEach(x => x.classList.toggle('on', x === l)); radios().forEach(r => r.checked = r.value === sel); sound('click'); });
  el.querySelector('#rgOwn').oninput = e => { if(e.target.value.trim()){ sel = ''; el.querySelectorAll('.rg-c').forEach(x => x.classList.remove('on')); radios().forEach(r => r.checked = false); } };
  const take = () => {
    const own = el.querySelector('#rgOwn').value.trim();
    if(own) return {text: own, refId: '', est: 0};
    const c = cands.find(x => x.id === sel); return c ? {text: c.text, refId: c.id, est: c.est || 0} : null;
  };
  const commit = pick => { const gg = rescueGateNew(); gg.pick = pick; gg.status = 'open'; save(); return gg; };
  el.querySelector('#rgGo').onclick = () => { const pick = take(); if(!pick){ toast('Choose one, or write it.'); return; } commit(pick); sound('click'); rescueGateScreen(root, 'shrink'); };
  el.querySelector('#rgNot').onclick = () => { const pick = take(); if(!pick){ toast('Say which thing you are putting off.'); return; } commit(pick); rescueGateScreen(root, 'defer', {from: 'pick'}); };
  el.querySelector('#rgNone').onclick = () => {
    if(!cands.length){ const gg = rescueGateNew(); gg.status = 'clear'; save(); rescueGateClose(root); return; }
    el.innerHTML = rgIn('', `<h2 class="serif">Say it again, with the list in front of you.</h2>
      <p class="rg-sub">You are telling me nothing is waiting. This is what is in the record:</p>
      <ul class="rg-list">${cands.map(c => `<li>${esc(c.text)} <em class="${c.late ? 'late' : ''}">${esc(c.tag)}</em></li>`).join('')}</ul>
      <div class="rg-row">${rgBtn('rgBack', '‹ go back', 'btn primary')}<span class="grow"></span>${rgBtn('rgTruly', 'truly — none of it is for today', 'tbtn')}</div>`);
    el.querySelector('#rgBack').onclick = () => rescueGateScreen(root, 'pick');
    el.querySelector('#rgTruly').onclick = () => { const gg = rescueGateNew(); gg.status = 'clear'; gg.saidClear = cands.length; save(); rescueGateClose(root); };
  };
  el.querySelector('#rgUnload').onclick = () => { const gg = rescueGateNew(); gg.status = 'unload'; gg.capEndsAt = new Date(Date.now() + 3 * 60000).toISOString(); save(); toast('Three minutes. Get it all out — then the one thing.', 4500); rescueGateClose(root); };
  const sk = el.querySelector('#rgSkip'); if(sk) sk.onclick = () => { const gg = rescueGateNew(); gg.status = 'clear'; gg.skipped = true; save(); rescueGateClose(root); };
}

/* — shrink: the first move, the length, the excuses — */
function rgShrink(root, el, o){
  const s = _rs.sheet, g = s.gate, hard = rescueGateMode() === 'hard';
  let mins = g.lastMins || 10, picked = new Set(g.excuses || []);
  const last = (g.sprints || []).slice(-1)[0];
  const ex = rescueGateExcuseOrder();
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">${last && last.result === 'did' ? 'the next move' : 'the first move'}</p>
    <h2 class="serif">${esc(g.pick.text)}</h2>
    <p class="rg-sub">Not the whole thing. The smallest true first move — small enough to be a little silly.</p>
    <input class="inp" id="rgStep" value="${esc(o.keep ? (g.step || '') : '')}" placeholder="e.g. open the doc and type the title" maxlength="160">
    <div class="rg-chips">${RESCUE_GATE_STARTERS.map((t, i) => `<button class="chip sm" data-st="${i}">${esc(t)}</button>`).join('')}</div>
    <div class="rg-mins"><span class="mono faint">for</span>${RESCUE_GATE_MINS.map(m => `<button class="chip sm${m === mins ? ' on' : ''}" data-m="${m}">${m === 2 ? '2 min · just the deal' : m + ' min'}</button>`).join('')}</div>
    <p class="mono faint rg-k" style="margin-top:14px">what you expect to tell yourself</p>
    <div class="rg-chips">${ex.map(x => `<button class="chip sm${picked.has(x.id) ? ' on' : ''}" data-ex="${x.id}" title="${esc(x.back)}">${esc(x.say)}</button>`).join('')}</div>
    <p class="faint sm" id="rgExBack">${picked.size ? '' : 'Tick the ones that are likely. Each is answered in advance, when it comes.'}</p>
    <div class="rg-row">${rgBtn('rgBegin', 'Begin →', 'btn primary')}<span class="grow"></span>${rgBtn('rgDef', 'not now…', 'tbtn')}${rgBtn('rgBack', '‹ change the thing', 'tbtn')}</div>`);
  const step = el.querySelector('#rgStep'); step.focus();
  el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { step.value = RESCUE_GATE_STARTERS[+b.dataset.st]; step.focus(); });
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mins = +b.dataset.m; el.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); });
  const sayEx = () => { const box = el.querySelector('#rgExBack'); const ids = [...picked]; box.innerHTML = ids.map(id => { const x = RESCUE_EXCUSES.find(e => e.id === id); return x ? `<b>“${esc(x.say)}”</b> — ${esc(x.back)}` : ''; }).join('<br>') || 'Tick the ones that are likely. Each is answered in advance, when it comes.'; };
  el.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { const id = b.dataset.ex; if(picked.has(id)) picked.delete(id); else picked.add(id); b.classList.toggle('on', picked.has(id)); sayEx(); });
  sayEx();
  el.querySelector('#rgBack').onclick = () => rescueGateScreen(root, 'pick');
  el.querySelector('#rgDef').onclick = () => { g.step = step.value.trim(); g.excuses = [...picked]; save(); rescueGateScreen(root, 'defer', {from: 'shrink'}); };
  el.querySelector('#rgBegin').onclick = () => {
    const t = step.value.trim();
    if(t.length < 3){ toast('Say the first move, even roughly.'); step.focus(); return; }
    g.step = t; g.excuses = [...picked]; g.lastMins = mins;
    const n = (S.settings.rescueExcuseN = S.settings.rescueExcuseN || {}); picked.forEach(id => { n[id] = (n[id] || 0) + 1; });
    save(); rescueGateScreen(root, 'count', {mins});
  };
  step.onkeydown = e => { if(e.key === 'Enter') el.querySelector('#rgBegin').click(); };
}

/* — 5-4-3-2-1 — */
function rgCount(root, el, o){
  const g = _rs.sheet.gate; let n = 5;
  el.innerHTML = rgIn('count', `<p class="mono faint rg-k">${esc(g.pick.text)}</p><div class="rg-big serif" id="rgN">5</div><p class="rg-sub">${esc(g.step)}</p>`);
  const t = setInterval(() => {
    if(!el.isConnected || _rs.gateScreen !== 'count'){ clearInterval(t); return; }
    n--; if(n <= 0){ clearInterval(t); rescueGateBegin(root, o.mins || 10, g.step); return; }
    const b = el.querySelector('#rgN'); if(b){ b.textContent = n; b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat'); }
  }, 1000);
  _rs.timers.push(t);
}
function rescueGateBegin(root, mins, step){
  const g = _rs.sheet.gate, now = Date.now();
  g.step = step; g.sprints.push({at: new Date(now).toISOString(), mins, step, result: ''});
  g.sprint = {startedAt: new Date(now).toISOString(), endsAt: new Date(now + mins * 60000).toISOString(), mins, step, rang: false};
  g.status = 'sprint'; g.capEndsAt = null; save(); sound('click');
  rescueGateScreen(root, 'sprint');
}
const rescueGateRec = g => (g.sprints || [])[g.sprints.length - 1] || null;

/* — the sprint — */
function rgSprint(root, el){
  const g = _rs.sheet.gate, sp = g.sprint, left = (Date.parse(sp.endsAt) - Date.now()) / 1000;
  const ex = (g.excuses || []).map(id => RESCUE_EXCUSES.find(e => e.id === id)).filter(Boolean).slice(0, 2);
  el.innerHTML = rgIn('sprint', `<p class="mono faint rg-k">sprint · ${sp.mins} min</p>
    <div class="rg-clock mono" id="rgClock">${rescueGateMMSS(left)}</div>
    <h2 class="serif">${esc(g.pick.text)}</h2>
    <p class="rg-step">${esc(sp.step)}</p>
    ${ex.length ? `<div class="rg-ifs">${ex.map(x => `<p><b>If you hear</b> “${esc(x.say)}” — ${esc(x.back)}</p>`).join('')}</div>` : '<p class="faint sm">Ugly is fine. Only the next move counts.</p>'}
    <div class="rg-park"><input class="inp" id="rgPark" placeholder="a thought is nagging? park it here — it waits on the page" maxlength="200"><span class="mono faint" id="rgParkN">${(g.parked || []).length ? g.parked.length + ' parked' : ''}</span></div>
    <div class="rg-row">${rgBtn('rgDid', 'Done ✓', 'btn primary')}${rgBtn('rgStuck', 'I’m stuck', 'btn')}<span class="grow"></span>${rgBtn('rgStop', 'stop — not now', 'tbtn')}</div>`);
  const park = el.querySelector('#rgPark');
  park.onkeydown = e => { if(e.key !== 'Enter') return; const t = park.value.trim(); if(!t) return;
    g.parked.push(t); park.value = ''; save(); el.querySelector('#rgParkN').textContent = g.parked.length + ' parked'; sound('click'); toast('Noted. Later — not now.', 1600); };
  el.querySelector('#rgDid').onclick = () => rescueGateSprintEnd(root, 'did');
  el.querySelector('#rgStuck').onclick = () => rescueGateScreen(root, 'stuck');
  el.querySelector('#rgStop').onclick = () => rescueGateScreen(root, 'defer', {from: 'sprint'});
}
function rescueGateSprintEnd(root, result){
  const g = _rs.sheet.gate, rec = rescueGateRec(g), sp = g.sprint;
  if(rec){ rec.result = result; rec.endedAt = new Date().toISOString(); rec.elapsed = sp ? Math.min(sp.mins * 60, Math.round((Date.now() - Date.parse(sp.startedAt)) / 1000)) : 0; }
  g.sprint = null; g.status = result === 'did' ? 'started' : 'open'; save();
  if(result === 'did'){ sound('success'); rescueGateScreen(root, 'after'); }
}

/* — stuck: ways through — */
function rgStuck(root, el, o){
  const g = _rs.sheet.gate, sp = g.sprint;
  if(!o.kind){
    el.innerHTML = rgIn('', `<p class="mono faint rg-k">the clock is still running</p><h2 class="serif">Stuck is information. Which kind?</h2>
      <div class="rg-opts">${RESCUE_STUCK.map(k => `<button class="rs-m-row" data-k="${k.id}">${esc(k.name)}</button>`).join('')}</div>
      <div class="rg-row">${rgBtn('rgBack', '‹ back to the sprint', 'tbtn')}</div>`);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => rescueGateScreen(root, 'stuck', {kind: b.dataset.k}));
    el.querySelector('#rgBack').onclick = () => rescueGateScreen(root, 'sprint');
    return;
  }
  const k = RESCUE_STUCK.find(x => x.id === o.kind);
  const note = (kind, text) => { g.stuck = g.stuck || []; g.stuck.push({kind, at: new Date().toISOString(), note: text || ''}); };
  const resume = (step, restartMins) => {
    if(step) { g.step = step; sp.step = step; const r = rescueGateRec(g); if(r) r.step = step; }
    if(restartMins){ sp.mins = restartMins; sp.startedAt = new Date().toISOString(); sp.endsAt = new Date(Date.now() + restartMins * 60000).toISOString(); sp.rang = false; const r = rescueGateRec(g); if(r) r.mins = restartMins; }
    save(); rescueGateScreen(root, 'sprint');
  };
  if(o.kind === 'tired'){
    el.innerHTML = rgIn('', `<h2 class="serif">Then lower the bar — don’t leave.</h2>
      <p class="rg-sub">Tired is a reason to shrink the move, not to skip it. Two minutes on the smallest piece of it, and you may stop with a clear conscience. Or, if you are truly done in, promise it to a real hour.</p>
      <div class="rg-row">${rgBtn('rgTwo', 'Two minutes, lowest bar', 'btn primary')}<span class="grow"></span>${rgBtn('rgRest', 'rest, and promise an hour', 'tbtn')}${rgBtn('rgBack', '‹ back', 'tbtn')}</div>`);
    el.querySelector('#rgTwo').onclick = () => { note('tired'); resume('', 2); };
    el.querySelector('#rgRest').onclick = () => { note('tired', 'rest, then promise'); rescueGateScreen(root, 'defer', {from: 'sprint'}); };
    el.querySelector('#rgBack').onclick = () => rescueGateScreen(root, 'stuck');
    return;
  }
  const area = k.id === 'dread' || k.id === 'need' ? `<input class="inp" id="rgS" maxlength="160">` : `<textarea class="ta" id="rgS" style="min-height:${k.id === 'noidea' ? 92 : 56}px"></textarea>`;
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">${esc(k.name)}</p><h2 class="serif">${esc(k.ask)}</h2>${area}
    <div class="rg-row">${rgBtn('rgOk', esc(k.cta) + ' →', 'btn primary')}<span class="grow"></span>${rgBtn('rgBack', '‹ back', 'tbtn')}</div>`);
  const f = el.querySelector('#rgS'); f.focus();
  el.querySelector('#rgBack').onclick = () => rescueGateScreen(root, 'stuck');
  el.querySelector('#rgOk').onclick = () => {
    const v = f.value.trim(); if(!v){ toast('A few words, even rough.'); f.focus(); return; }
    note(k.id, v);
    if(k.id === 'noidea'){ const first = v.split('\n').map(x => x.trim()).filter(Boolean)[0]; resume('Start with: ' + first.slice(0, 120)); }
    else if(k.id === 'big') resume(v.slice(0, 140));
    else if(k.id === 'dread') resume('Two minutes on it, hands moving, before anything else', 2);
    else if(k.id === 'need'){ try { commitQuickTask('Get: ' + v, {listId: 'inbox'}); } catch(e){} toast('That is a task now.', 2600); resume('Ask for it: ' + v.slice(0, 120)); }
  };
}

/* — time — */
function rgTimeup(root, el){
  const g = _rs.sheet.gate;
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">${esc(g.pick.text)}</p><h2 class="serif">Time. What happened?</h2>
    <p class="rg-sub">${esc(g.step || '')}</p>
    <div class="rg-opts"><button class="rs-m-row" data-r="did">I did it — the move is done</button>
      <button class="rs-m-row" data-r="more">I’m in it — give me ten more minutes</button>
      <button class="rs-m-row" data-r="no">I didn’t really start</button></div>`);
  el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    const r = b.dataset.r;
    if(r === 'did') rescueGateSprintEnd(root, 'did');
    else if(r === 'more'){ const rec = rescueGateRec(g); if(rec){ rec.result = 'did'; rec.endedAt = new Date().toISOString(); rec.elapsed = (rec.mins || 0) * 60; } g.sprint = null; rescueGateBegin(root, 10, g.step); }
    else rescueGateScreen(root, 'nostart');
  });
}
function rgNostart(root, el){
  const g = _rs.sheet.gate, ex = rescueGateExcuseOrder();
  el.innerHTML = rgIn('', `<h2 class="serif">Fine. Which one was talking?</h2>
    <p class="rg-sub">No verdict — just naming it. It loses some of its grip when it has a name.</p>
    <div class="rg-chips">${ex.map(x => `<button class="chip sm" data-ex="${x.id}">${esc(x.say)}</button>`).join('')}</div>
    <p class="rg-back" id="rgBk"></p>
    <div class="rg-row">${rgBtn('rgDeal', 'The two-minute deal →', 'btn primary')}<span class="grow"></span>${rgBtn('rgDef', 'not now…', 'tbtn')}</div>`);
  el.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => {
    const x = RESCUE_EXCUSES.find(e => e.id === b.dataset.ex); if(!x) return;
    const n = (S.settings.rescueExcuseN = S.settings.rescueExcuseN || {}); n[x.id] = (n[x.id] || 0) + 1;
    if(!g.excuses.includes(x.id)) g.excuses.push(x.id); save();
    el.querySelectorAll('[data-ex]').forEach(c => c.classList.toggle('on', c === b));
    el.querySelector('#rgBk').innerHTML = `<b>“${esc(x.say)}”</b> — ${esc(x.back)}`;
  });
  el.querySelector('#rgDeal').onclick = () => { const rec = rescueGateRec(g); if(rec && !rec.result){ rec.result = 'none'; rec.endedAt = new Date().toISOString(); } g.sprint = null; rescueGateBegin(root, 2, 'Open it. Put your hands on it. Two minutes — then you may stop.'); };
  el.querySelector('#rgDef').onclick = () => { const rec = rescueGateRec(g); if(rec && !rec.result){ rec.result = 'none'; rec.endedAt = new Date().toISOString(); } g.sprint = null; g.status = 'open'; save(); rescueGateScreen(root, 'defer', {from: 'nostart'}); };
}
function rgAfter(root, el){
  const g = _rs.sheet.gate, mins = Math.round((g.sprints || []).reduce((n, p) => n + (p.result === 'did' ? (p.elapsed || 0) : 0), 0) / 60);
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">${mins ? mins + ' minute' + (mins === 1 ? '' : 's') + ' on it, today' : 'a start'}</p>
    <h2 class="serif">That counts. It has started.</h2>
    <p class="rg-sub">Is “${esc(g.pick.text)}” finished, or is there more?</p>
    <div class="rg-opts"><button class="rs-m-row" data-a="fin">It’s finished — tick it off</button>
      <button class="rs-m-row" data-a="more">There’s more — another sprint</button>
      <button class="rs-m-row" data-a="page">Enough for now — open the page</button></div>`);
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if(a === 'fin'){ if(g.pick.refId){ try { setTaskDone(g.pick.refId, true); } catch(e){} } g.status = 'finished'; g.capEndsAt = null; save(); sound('success'); toast('Off the list.', 3000); rescueGateClose(root); }
    else if(a === 'more') rescueGateScreen(root, 'shrink', {keep: false});
    else { g.status = 'started'; save(); rescueGateClose(root); }
  });
}

/* — not now: allowed, as a promise — */
function rgDefer(root, el, o){
  const s = _rs.sheet, g = s.gate, hard = rescueGateMode() === 'hard', T = new Date();
  const same = rescueGateSameThing(g.pick, s), prior = (g.deferrals || []).length + same.deferred;
  const soon = rescueGateIn(2), ex = (g.excuses || []).map(id => RESCUE_EXCUSES.find(e => e.id === id)).filter(Boolean);
  const eve = new Date(); eve.setHours(19, 0, 0, 0);
  const presets = [['in an hour', rescueGateIn(1)], ['in three hours', rescueGateIn(3)]].concat(eve > T ? [['this evening, 7', eve]] : []).concat([['tomorrow, 9', (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; })()]]);
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">${esc(g.pick.text)}</p>
    <h2 class="serif">“Not now” is allowed. “Someday” isn’t.</h2>
    <p class="rg-sub">${prior ? `You have put this off ${prior} time${prior === 1 ? '' : 's'} already, and each time it felt reasonable. ` : ''}Make it a promise: a real hour, a first move, and what it costs if it slips. A reminder is set for you now.</p>
    ${ex.length ? `<div class="rg-ifs">${ex.slice(0, 2).map(x => `<p><b>You expected</b> “${esc(x.say)}” — ${esc(x.back)}</p>`).join('')}</div>` : ''}
    <div class="rg-when"><div class="rg-chips">${presets.map((p, i) => `<button class="chip sm" data-p="${i}">${esc(p[0])}</button>`).join('')}</div>
      <div class="row" style="gap:8px"><input class="inp" type="date" id="rgDay" value="${rescueGateDayOf(soon)}"><input class="inp" type="time" id="rgTime" value="${rescueGateTimeOf(soon)}"></div></div>
    <label class="pd-q"><span class="k">At that hour I will</span><input class="inp" id="rgDo" value="${esc(g.step || '')}" placeholder="the first move, e.g. open the doc and type the title" maxlength="160"></label>
    <label class="pd-q"><span class="k">If this slips, it costs me</span><textarea class="ta" id="rgCost" style="min-height:50px" placeholder="be specific: who waits, what compounds, what I lose">${esc(g.cost || '')}</textarea></label>
    <div class="rg-row">${rgBtn('rgOk', hard ? 'Promise it' : 'Promise it', 'btn primary')}<span class="grow"></span>${rgBtn('rgBack', o.from === 'sprint' ? '‹ back to the sprint' : '‹ back', 'tbtn')}</div>`);
  const day = el.querySelector('#rgDay'), time = el.querySelector('#rgTime'), ok = el.querySelector('#rgOk');
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const d = presets[+b.dataset.p][1]; day.value = rescueGateDayOf(d); time.value = rescueGateTimeOf(d); });
  el.querySelector('#rgBack').onclick = () => rescueGateScreen(root, o.from === 'sprint' ? 'sprint' : (o.from === 'nostart' ? 'nostart' : (o.from === 'pick' ? 'pick' : 'shrink')));
  if(hard){
    let wait = 10; ok.disabled = true; ok.textContent = `a breath… ${wait}`;
    const t = setInterval(() => { if(!ok.isConnected){ clearInterval(t); return; } wait--; if(wait <= 0){ clearInterval(t); ok.disabled = false; ok.textContent = 'Promise it'; } else ok.textContent = `a breath… ${wait}`; }, 1000);
    _rs.timers.push(t);
  }
  ok.onclick = () => {
    const when = rescueGateWhen(day.value, time.value), doText = el.querySelector('#rgDo').value.trim(), cost = el.querySelector('#rgCost').value.trim();
    if(!day.value || !time.value || !(when > Date.now() - 60000)){ toast('Pick an hour that has not passed.'); return; }
    if(when - Date.now() > 3 * 864e5 && hard){ toast('Within three days — “someday” isn’t a time.'); return; }
    if(doText.length < 3){ toast('Say what you will do at that hour.'); return; }
    if(hard && cost.length < 6){ toast('Say what it costs if this slips.'); el.querySelector('#rgCost').focus(); return; }
    const n = prior + 1;
    let rem = null;
    try { rem = planAddReminder({text: `${n > 1 ? 'Promised again (' + n + ') — ' : 'Promised — '}${doText} · ${g.pick.text}`, day: day.value, time: time.value}); } catch(e){}
    const rec = rescueGateRec(g); if(rec && o.from === 'sprint' && !rec.result){ rec.result = 'stopped'; rec.endedAt = new Date().toISOString(); }
    g.sprint = null; g.step = doText; g.cost = cost;
    g.deferrals.push({at: new Date().toISOString(), day: day.value, time: time.value, doText, cost, remindId: rem ? rem.id : ''});
    g.status = 'deferred'; g.capEndsAt = null; save(); sound('success');
    toast(`Promised for ${time.value}${day.value === today() ? '' : ' · ' + fmtDate(day.value, 'short')}. The page is yours until then.`, 5200);
    rescueGateClose(root);
  };
}

/* — enough page — */
function rgEnough(root, el){
  const g = _rs.sheet.gate, mins = Math.max(1, Math.round((Date.now() - Date.parse(_rs.sheet.startedAt || _rs.sheet.createdAt)) / 60000));
  const left = g.ext < 2;
  el.innerHTML = rgIn('', `<p class="mono faint rg-k">the page has had its time</p><h2 class="serif">Enough page.</h2>
    <p class="rg-sub">${mins} minutes on the page. “${esc(g.pick.text)}” is ${g.status === 'deferred' ? 'promised for ' + esc(g.deferrals.slice(-1)[0].time) : g.status === 'started' ? 'started — and not finished' : 'still waiting'}.</p>
    <div class="rg-row">${rgBtn('rgGo', 'Sprint on it now →', 'btn primary')}${rgBtn('rgLand', 'Land the page', 'btn')}<span class="grow"></span>${left ? rgBtn('rgMore', 'ten more minutes' + (g.ext ? ' (needs a reason)' : ''), 'tbtn') : ''}</div>`);
  el.querySelector('#rgGo').onclick = () => { g.status = 'open'; rescueGateScreen(root, 'shrink', {keep: false}); };
  el.querySelector('#rgLand').onclick = () => { rescueGateShut(root); rescueLand(root); };
  const m = el.querySelector('#rgMore');
  if(m) m.onclick = () => {
    const grant = reason => { g.ext++; if(reason) (g.extReasons = g.extReasons || []).push(reason); g.capEndsAt = new Date(Date.now() + 10 * 60000).toISOString(); save(); rescueGateClose(root); toast('Ten minutes. Then the thing.', 3500); };
    if(!g.ext) return grant('');
    el.innerHTML = rgIn('', `<h2 class="serif">A reason, in your own words.</h2><p class="rg-sub">Why is more page the right use of ten minutes, over the thing?</p>
      <input class="inp" id="rgWhy" maxlength="160"><div class="rg-row">${rgBtn('rgY', 'Ten more minutes', 'btn')}<span class="grow"></span>${rgBtn('rgN', 'You’re right — sprint', 'btn primary')}</div>`);
    el.querySelector('#rgWhy').focus();
    el.querySelector('#rgY').onclick = () => { const v = el.querySelector('#rgWhy').value.trim(); if(v.length < 5){ toast('A real reason, a few words.'); return; } grant(v); };
    el.querySelector('#rgN').onclick = () => { g.status = 'open'; rescueGateScreen(root, 'shrink', {keep: false}); };
  };
}

/* ---------- the strip that keeps the thing in view ---------- */
function rescueGateTether(root){
  root = root || document;
  root.querySelectorAll('.rs-tether').forEach(n => n.remove());
  if(!_rs || !_rs.sheet) return;
  const s = _rs.sheet, g = rescueGateOf(s) || (s.gate && s.gate.status === 'unload' ? s.gate : null);
  if(!g || ['finished', 'clear', 'sprint'].includes(g.status)) return;
  const d = document.createElement('div'); d.className = 'rs-tether'; d.setAttribute('role', 'status');
  const top = root.querySelector('.rs-body'); if(!top) return;
  const prom = g.deferrals && g.deferrals.slice(-1)[0];
  let msg = '', act = '', late = false;
  if(g.status === 'unload'){ msg = `Unloading — <b class="mono" id="rtClock"></b> left, then the one thing.`; act = `<button class="btn sm primary" data-rt="gate">I’m ready now</button>`; }
  else if(g.status === 'deferred' && prom){
    const w = rescueGateWhen(prom.day, prom.time); late = w < Date.now();
    msg = `<b>${late ? 'The promised hour has passed' : 'Promised for ' + esc(prom.time) + (prom.day === today() ? '' : ' · ' + esc(fmtDate(prom.day, 'short')))}</b> — ${esc(g.pick.text)}`;
    act = `<button class="btn sm primary" data-rt="go">${late ? 'Start now' : 'Start early'}</button>`;
  } else if(g.status === 'started'){ msg = `Started — ${esc(g.pick.text)}`; act = `<button class="btn sm" data-rt="go">Another sprint</button><button class="tbtn" data-rt="fin">it’s finished</button>`; }
  else { msg = `<b>Still waiting:</b> ${esc(g.pick.text)}`; act = `<button class="btn sm primary" data-rt="two">Two minutes now</button><button class="tbtn" data-rt="go">Begin properly</button>`; }
  d.classList.toggle('late', late);
  d.innerHTML = `<span class="rt-m">${msg}</span><span class="grow"></span>${act}`;
  top.parentNode.insertBefore(d, top);
  d.onclick = ev => {
    const b = ev.target.closest('[data-rt]'); if(!b) return;
    if(b.dataset.rt === 'fin'){ if(g.pick.refId){ try { setTaskDone(g.pick.refId, true); } catch(e){} } g.status = 'finished'; g.capEndsAt = null; save(); sound('success'); rescueGateTether(root); return; }
    if(b.dataset.rt === 'gate'){ g.status = 'open'; g.capEndsAt = null; save(); rescueGateScreen(root, g.pick ? 'shrink' : 'pick'); return; }
    if(b.dataset.rt === 'two'){ g.capEndsAt = null; rescueGateBegin(root, 2, g.step || 'Open it. Put your hands on it. Two minutes — then you may stop.'); return; }
    g.status = 'open'; g.capEndsAt = null; save(); rescueGateScreen(root, 'shrink', {keep: !!g.step});
  };
}
/* the once-a-second watcher: the sprint clock, the time-box, the unload, a promise coming due */
function rescueGateTick(root){
  if(!_rs || !_rs.sheet) return;
  const s = _rs.sheet, g = s.gate; if(!g) return;
  const clock = root.querySelector('#rgClock');
  if(g.status === 'sprint' && g.sprint){
    const left = (Date.parse(g.sprint.endsAt) - Date.now()) / 1000;
    if(clock) clock.textContent = rescueGateMMSS(left);
    if(left <= 0 && !g.sprint.rang){ g.sprint.rang = true; g.status = 'timeup'; save(); sound('success'); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch(e){} rescueGateScreen(root, 'timeup'); }
    return;
  }
  const rt = root.querySelector('#rtClock'); if(rt && g.capEndsAt) rt.textContent = rescueGateMMSS((Date.parse(g.capEndsAt) - Date.now()) / 1000);
  if(g.capEndsAt && !root.querySelector('.rs-gate') && !document.hidden && Date.now() >= Date.parse(g.capEndsAt)){
    g.capEndsAt = null;
    if(g.status === 'unload'){ g.status = 'open'; save(); sound('success'); rescueGateScreen(root, g.pick ? 'shrink' : 'pick'); }
    else if(g.pick && !['finished', 'clear'].includes(g.status)){ save(); sound('success'); rescueGateScreen(root, 'enough'); }
    else save();
  }
  const prom = g.deferrals && g.deferrals.slice(-1)[0], tth = root.querySelector('.rs-tether');
  if(g.status === 'deferred' && prom && tth && !tth.classList.contains('late') && rescueGateWhen(prom.day, prom.time) < Date.now()) rescueGateTether(root);
}

/* ---------- landing asks again ---------- */
function rescueGateLandHTML(s){
  const g = rescueGateOf(s); if(!g || ['finished', 'clear'].includes(g.status)) return '';
  const did = (g.sprints || []).filter(p => p.result === 'did').length;
  if(did) return `<div class="rg-land ok"><b>✓ “${esc(g.pick.text)}”</b> — started. Good.</div>`;
  const prom = g.deferrals && g.deferrals.slice(-1)[0];
  if(prom && rescueGateWhen(prom.day, prom.time) > Date.now()) return `<div class="rg-land ok"><b>“${esc(g.pick.text)}”</b> — promised for ${esc(prom.time)}${prom.day === today() ? '' : ' · ' + esc(fmtDate(prom.day, 'short'))}.</div>`;
  const d = rescueGateIn(2);
  return `<div class="rg-land" id="rgLand"><b>The thing you named: “${esc(g.pick.text)}”</b> — not started. Before this page is put down, give it an hour:
    <div class="row" style="gap:8px;margin-top:6px"><input class="inp" type="date" id="rgLDay" value="${rescueGateDayOf(d)}"><input class="inp" type="time" id="rgLTime" value="${rescueGateTimeOf(d)}"><button type="button" class="tbtn" id="rgLNow">or sprint on it now</button></div></div>`;
}
/* false = stay: the landing is not complete until the thing has an hour or has begun */
function rescueGateLandCheck(m, s){
  const box = m.querySelector('#rgLand'); if(!box) return true;
  const g = s.gate, day = m.querySelector('#rgLDay').value, time = m.querySelector('#rgLTime').value;
  if(!day || !time || !(rescueGateWhen(day, time) > Date.now() - 60000)){ toast('Give the thing an hour that has not passed.'); return false; }
  let rem = null; try { rem = planAddReminder({text: `Promised — ${g.step || 'start'} · ${g.pick.text}`, day, time}); } catch(e){}
  g.deferrals.push({at: new Date().toISOString(), day, time, doText: g.step || '', cost: '', remindId: rem ? rem.id : '', atLanding: true}); g.status = 'deferred'; save();
  return true;
}
function rescueGateLandBind(m, s, root){
  const g = rescueGateOf(s); if(!g) return;
  const nx = m.querySelector('#rlNext'); if(nx && !nx.value && g.step) nx.value = g.step;
  const b = m.querySelector('#rgLNow'); if(b) b.onclick = () => { m.remove(); g.status = 'open'; g.capEndsAt = null; save(); rescueGateScreen(root, 'shrink', {keep: !!g.step}); };
}
function rescueGateReviewBit(s){
  const g = rescueGateOf(s); if(!g) return '';
  const did = (g.sprints || []).filter(p => p.result === 'did').length;
  const how = g.status === 'finished' ? 'finished' : did ? did + ' sprint' + (did === 1 ? '' : 's') : g.status === 'deferred' ? 'promised' : 'untouched';
  return ` · the thing: ${esc(g.pick.text.slice(0, 40))} (${how})`;
}

/* ---------- Settings ---------- */
function rescueGateSettingsHTML(){
  const m = rescueGateMode(), c = rescueGateCapMins();
  return `<div class="card rv" id="rescueGateCard"><h3>The gate — the one thing first</h3>
    <p class="muted" style="font-size:.85rem;margin:0 0 6px">A rescue page can quietly become the way a due thing gets put off. When something is due or late, the page opens on that first: choose it, shrink it, run a short sprint, and only then the page. “Not now” is allowed, but as a promise with an hour and a cost.</p>
    <div class="opt"><div><b>How firm</b><div class="d"><b>Hard</b>: the page waits behind the gate; putting it off needs an hour, a first move, a cost, and a breath. <b>Firm</b>: the same, lighter, and you can skip it. <b>Off</b>: no gate (the header’s <i>The one thing</i> button still works).</div></div>
      <select class="sel" style="width:auto" id="sGate">${[['hard', 'Hard'], ['firm', 'Firm'], ['off', 'Off']].map(([v, t]) => `<option value="${v}" ${m === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="opt"><div><b>Time-box on the page</b><div class="d">After the gate, the page rings when this long has passed with the thing still waiting — “enough page”. Ten more minutes once; a second time needs a reason.</div></div>
      <select class="sel" style="width:auto" id="sGateCap">${[[0, 'no limit'], [15, '15 min'], [25, '25 min'], [40, '40 min'], [60, '60 min']].map(([v, t]) => `<option value="${v}" ${c === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>`;
}
function bindRescueGateSettings(root){
  const r = root || document;
  const a = r.querySelector('#sGate'); if(a) a.onchange = () => { S.settings.rescueGate = a.value; saveNow(); };
  const b = r.querySelector('#sGateCap'); if(b) b.onchange = () => { S.settings.rescueGateCap = +b.value; saveNow(); };
}
