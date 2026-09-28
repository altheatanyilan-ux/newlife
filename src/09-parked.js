/* ============================================================
   PARKED — for what comes up while you work

   Twenty minutes into a sitting the mind offers, helpfully, the email you
   forgot, the thing to look up, the idea for something else entirely, and a
   small worry about Thursday. Each one is a door out of the work. Written
   down, it stops circling: the point of writing it is so that you do not
   have to keep holding it.

   So there is a place to put it that costs one line and a return key, and
   then the work again. It sits inside the Focus section — on Today, and on
   the desk in focus mode — and, when focus mode is showing a page rather
   than the desk, in a pocket in the corner. P comes to it from anywhere in
   focus mode.

   Five kinds, because what surfaces is not all one thing, and what should be
   done with it afterwards depends on which it is:
     ☐ a to-do (the default)   — tick it, or make it a task
     ✎ a note         (- …)    — keep it in the journal
     ✦ an idea        (* …)    — keep it in the journal, marked as an idea
     ? something to look up (? …) — a task that starts "Look up:"
     ☁ a worry        (~ …)    — write it and let it go, or face it as a task
   The kind is a press on its mark, or the first character typed — the rule
   is the line under the box, nothing guesses.

   Nothing is sorted in the middle of the work. Afterwards — at a break, on
   leaving focus mode, or whenever — "sort them" goes through what is left:
   to the Inbox, to today, to tomorrow, into the journal (as an unfinished
   thought, so it waits at the foot of Today), let go, or left parked. Every
   move says where it went and can be undone. A parked thought remembers when
   and during what it came up, so each sitting in the day's log can say how
   many times the mind went elsewhere — not as a score, as a mirror.

   And, for the to-dos that are two-minute jobs: ten minutes on the clock to
   clear them, once the sitting is done.

   Kept in the planner's own state (S.planning.parked): a new list beside the
   others, added empty and never rewritten.
   ============================================================ */

const PARK_KINDS = [
  {id: 'todo',  glyph: '☐', name: 'to-do',    pre: ''},
  {id: 'note',  glyph: '✎', name: 'note',     pre: '-'},
  {id: 'idea',  glyph: '✦', name: 'idea',     pre: '*'},
  {id: 'ask',   glyph: '?', name: 'look up',  pre: '?'},
  {id: 'worry', glyph: '☁', name: 'worry',    pre: '~'},
];
const parkKind = id => PARK_KINDS.find(k => k.id === id) || PARK_KINDS[0];

function parkedAll(){
  const p = planState();
  if(!Array.isArray(p.parked)) p.parked = [];
  return p.parked;
}
/* still waiting to be dealt with */
const parkedOpen = () => parkedAll().filter(x => !x.fate);
/* what the list shows: everything waiting, and today's ticked to-dos (so a
   tick can be taken back) */
const parkedShown = () => parkedAll().filter(x => !x.fate || (x.fate === 'done' && x.day === today()));

/* the first character decides the kind, if it is one of the four marks */
function parkRead(raw, kind){
  let text = String(raw || '').trim(), k = kind || 'todo';
  const m = text.match(/^([-*?~])\s*([\s\S]*)$/);
  if(m && m[2].trim()){ k = PARK_KINDS.find(x => x.pre === m[1]).id; text = m[2].trim(); }
  const box = text.match(/^\[\s?\]\s*([\s\S]+)$/);
  if(box){ k = 'todo'; text = box[1].trim(); }
  return {kind: k, text};
}

function parkThought(raw, kind){
  const {kind: k, text} = parkRead(raw, kind);
  if(!text) return null;
  const s = typeof FocusTimer !== 'undefined' ? FocusTimer.state() : {idle: true};
  const ref = !s.idle && s.taskId && typeof findTaskRef === 'function' ? findTaskRef(s.taskId) : null;
  const x = {id: uid(), text, kind: k, at: new Date().toISOString(), day: today(),
    /* when, and in the middle of what — so a sitting can say how often it
       was interrupted, and a thought can be read back in its context */
    during: s.idle ? null : {taskId: s.taskId || null, what: ref ? ref.text : '',
      sitStart: s.phase === 'focus' ? (s.startedAt || null) : null, phase: s.phase, onBreak: !!s.onBreak},
    done: false, doneAt: null, fate: '', fatedAt: null, taskId: null, entryId: null};
  parkedAll().push(x);
  saveNow();
  return x;
}
const parkById = id => parkedAll().find(x => x.id === id) || null;
/* how many times the mind went elsewhere during one logged sitting */
function parkedDuring(session){
  if(!session || !session.startedAt) return 0;
  return parkedAll().filter(x => x.during && x.during.sitStart === session.startedAt).length;
}

/* ---------- where a parked thought can go ---------- */
function parkSettle(x, fate, extra = {}){
  Object.assign(x, {fate, fatedAt: new Date().toISOString()}, extra);
  saveNow();
}
function parkUnsettle(x){ Object.assign(x, {fate: '', fatedAt: null, taskId: null, entryId: null, done: false, doneAt: null}); saveNow(); }

function parkToTask(x, day = ''){
  const words = (x.kind === 'ask' && !/^look up/i.test(x.text) ? 'Look up: ' : '') + x.text;
  const t = typeof commitQuickTask === 'function' ? commitQuickTask(words, {day})
    : (() => { const n = newPlanTask(words, day, {listId: 'inbox'}); S.tasks.push(n); saveNow(); return n; })();
  if(!t) return null;
  parkSettle(x, 'task', {taskId: t.id});
  const where = t.day === today() ? 'today' : t.day === addDays(today(), 1) ? 'tomorrow'
    : t.day ? fmtDate(t.day, 'short') : 'the Inbox';
  return {said: `A task now, for ${where}.`, undo: () => {
    if(typeof spliceOut === 'function') spliceOut(S.tasks, n => n.id === t.id);
    else S.tasks = S.tasks.filter(n => n.id !== t.id);
    parkUnsettle(x); }};
}
function parkToJournal(x){
  const e = {id: uid(), type: 'reflection', title: '', body: x.text, occurredAt: x.day || today(),
    createdAt: new Date().toISOString(), media: [],
    links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []},
    people: [], places: [], emotions: [],
    tags: x.kind === 'idea' ? ['idea'] : x.kind === 'worry' ? ['worry'] : x.kind === 'ask' ? ['question'] : [],
    confidence: '',
    /* an unfinished thought, so it waits at the foot of Today until it is
       written out properly — which is what a parked note usually wants */
    extra: {unfinished: true, dumpedAt: new Date().toISOString(), parkedFrom: x.id}};
  S.entries.push(e);
  parkSettle(x, 'journal', {entryId: e.id});
  return {said: 'In the journal, with the unfinished thoughts at the foot of Today.', undo: () => {
    S.entries = S.entries.filter(n => n.id !== e.id); parkUnsettle(x); }};
}
function parkLetGo(x){
  parkSettle(x, 'released');
  return {said: x.kind === 'worry' ? 'Let go. It was written down; it does not need holding.' : 'Let go.',
    undo: () => parkUnsettle(x)};
}
function parkTick(x){
  const on = !x.done;
  x.done = on; x.doneAt = on ? new Date().toISOString() : null;
  x.fate = on ? 'done' : ''; x.fatedAt = on ? x.doneAt : null;
  saveNow();
}
function parkDrop(x){
  const all = parkedAll(), i = all.indexOf(x);
  if(i < 0) return null;
  all.splice(i, 1); saveNow();
  return {said: 'Thrown away.', undo: () => { parkedAll().splice(i, 0, x); saveNow(); }};
}
function parkAct(x, act, after){
  const r = act === 'task' ? parkToTask(x, '') : act === 'today' ? parkToTask(x, today())
    : act === 'tomorrow' ? parkToTask(x, addDays(today(), 1))
    : act === 'journal' ? parkToJournal(x) : act === 'letgo' ? parkLetGo(x)
    : act === 'drop' ? parkDrop(x) : null;
  if(act === 'tick'){ parkTick(x); if(typeof sound === 'function') sound(x.done ? 'success' : 'click'); }
  else if(r){
    if(typeof sound === 'function') sound('click');
    toast(esc(r.said), 5000, {label: 'undo', fn: () => { r.undo(); saveNow(); parkRepaint(); if(typeof after === 'function') after(); }});
  }
  parkRepaint();
  if(typeof after === 'function') after();
}

/* ---------- the block ---------- */
let _pkKind = 'todo';
function parkedItemHTML(x){
  const k = parkKind(x.kind);
  const clock = typeof clockOf === 'function' ? clockOf(x.at) : '';
  const acts = x.done ? '' : `<span class="pk-acts">
      <button type="button" data-pkact="task" title="make it a task, in the Inbox">→ task</button>
      ${x.kind !== 'todo' ? `<button type="button" data-pkact="journal" title="keep it in the journal, as an unfinished thought">→ journal</button>` : ''}
      ${x.kind === 'worry' ? `<button type="button" data-pkact="letgo" title="it is written down; let it go">let it go</button>` : ''}
      <button type="button" data-pkact="drop" title="throw it away" aria-label="throw it away">×</button></span>`;
  return `<li class="pk-it k-${k.id}${x.done ? ' done' : ''}" data-pk="${esc(x.id)}">
    ${k.id === 'todo'
      ? `<button type="button" class="task-check sm${x.done ? ' on' : ''}" data-pkact="tick" role="checkbox" aria-checked="${x.done}" title="${x.done ? 'not done after all' : 'done'}">${x.done ? '✓' : ''}</button>`
      : `<span class="pk-g" title="${esc(k.name)}" aria-label="${esc(k.name)}">${k.glyph}</span>`}
    <span class="pk-t">${esc(x.text)}</span>
    <span class="mono faint pk-at" title="${x.during && x.during.what ? esc('during ' + x.during.what) : ''}">${esc(clock)}</span>
    ${acts}</li>`;
}
function parkedBlockHTML({where = 'focus'} = {}){
  const s = typeof FocusTimer !== 'undefined' ? FocusTimer.state() : {idle: true};
  const desk = typeof focusDeskOn === 'function' && focusDeskOn();
  const shown = parkedShown(), open = parkedOpen();
  /* on Today with nothing running and nothing parked, it waits as one line */
  if(where === 'focus' && s.idle && !desk && !shown.length && !S._pkOpen)
    return `<div class="pk pk-shut" data-pkwhere="focus"><button type="button" class="pl-mini" data-pkopen>✎ park a thought</button>
      <span class="faint">somewhere to put what comes up while you work</span></div>`;
  const sit = !s.idle && s.phase === 'focus' && s.startedAt
    ? parkedAll().filter(x => x.during && x.during.sitStart === s.startedAt).length : 0;
  const todos = open.filter(x => x.kind === 'todo' || x.kind === 'ask').length;
  const inFocus = !s.idle && s.phase === 'focus' && (s.running || s.onBreak);
  return `<div class="pk" data-pkwhere="${esc(where)}">
    <div class="pk-h"><span class="k mono">parked, for after</span>
      <span class="mono faint pk-count">${open.length ? `${open.length} to sort` : shown.length ? 'all sorted' : 'nothing parked'}${sit ? ` · ${sit} this sitting` : ''}</span></div>
    <div class="pk-in">
      <span class="pk-kinds" role="radiogroup" aria-label="what kind of thing">${PARK_KINDS.map(k =>
        `<button type="button" role="radio" class="pk-kind${k.id === _pkKind ? ' on' : ''}" data-pkkind="${k.id}" aria-checked="${k.id === _pkKind}" title="${esc(k.name)}${k.pre ? ` — or start with ${k.pre}` : ''}">${k.glyph}</button>`).join('')}</span>
      <input class="inp pk-inp" data-pkinp autocomplete="off" aria-label="park a thought"
        placeholder="Something came up? Park it — Enter — back to work.">
    </div>
    <div class="pk-hint mono faint">- note · * idea · ? look up · ~ worry · or just type${where !== 'today' ? ' · P comes here' : ''}</div>
    ${shown.length ? `<ul class="pk-list">${shown.map(parkedItemHTML).join('')}</ul>` : ''}
    ${open.length || todos ? `<div class="pk-foot">
      ${open.length ? `<button type="button" class="pl-mini" data-pksort>sort them →</button>` : ''}
      ${todos && !inFocus ? `<button type="button" class="pl-mini" data-pksweep title="a ten-minute countdown for the small things">◷ ten minutes to clear the to-dos</button>` : ''}
    </div>` : ''}
  </div>`;
}
function bindParked(root){
  (root || document).querySelectorAll('.pk').forEach(pk => {
    if(pk._pkBound) return; pk._pkBound = true;
    const openB = pk.querySelector('[data-pkopen]');
    if(openB){ openB.onclick = () => { S._pkOpen = true; parkRepaint(); const i = document.querySelector('.pk [data-pkinp]'); if(i) i.focus(); }; return; }
    const inp = pk.querySelector('[data-pkinp]');
    const light = k => pk.querySelectorAll('[data-pkkind]').forEach(b => { const on = b.dataset.pkkind === k;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    pk.querySelectorAll('[data-pkkind]').forEach(b => b.onclick = () => { _pkKind = b.dataset.pkkind; light(_pkKind); if(inp) inp.focus(); });
    if(inp){
      /* the mark typed first is shown as the kind it will be, before Enter */
      inp.oninput = () => light(parkRead(inp.value, _pkKind).kind);
      inp.onkeydown = ev => {
        if(ev.key !== 'Enter' || ev.shiftKey) return;
        ev.preventDefault();
        const x = parkThought(inp.value, _pkKind);
        if(!x) return;
        _pkKind = 'todo';
        if(typeof sound === 'function') sound('click');
        parkRepaint({keepFocus: true, flash: x.id});
      };
    }
    pk.onclick = ev => {
      const b = ev.target.closest('[data-pkact]');
      if(b){ const x = parkById(b.closest('[data-pk]')?.dataset.pk); if(x) parkAct(x, b.dataset.pkact); return; }
      if(ev.target.closest('[data-pksort]')){ openParkedSort(); return; }
      if(ev.target.closest('[data-pksweep]')){ parkSweep(); return; }
    };
  });
}
/* Redraws every parked block in place — the page around it is left alone, so
   whatever else is being written keeps its caret, and so does this box. */
function parkRepaint({keepFocus = false, flash = null} = {}){
  document.querySelectorAll('.pk').forEach(pk => {
    const where = pk.dataset.pkwhere || 'focus';
    const had = keepFocus && pk.contains(document.activeElement);
    const box = el(parkedBlockHTML({where}));
    pk.replaceWith(box);
    bindParked(box.parentNode || document);
    if(had){ const i = box.querySelector('[data-pkinp]'); if(i) i.focus(); }
    if(flash){ const it = box.querySelector(`[data-pk="${flash}"]`); if(it){ it.classList.add('pk-new'); setTimeout(() => it.classList.remove('pk-new'), 1200); } }
  });
  paintParkPocketCount();
}

/* ---------- sorting them, afterwards ---------- */
function openParkedSort(){
  const m = openModal(`<div class="pks"><h2 class="serif">What was parked</h2>
    <p class="muted pks-lede">Each one: make it a task, keep it in the journal, tick it off, let it go — or leave it parked for another time.</p>
    <div class="pks-list" id="pksList"></div>
    <div class="row between pks-foot"><span id="pksSweep"></span><button class="btn primary" id="pksDone">Done</button></div></div>`, 'narrow');
  const draw = () => {
    const open = parkedOpen();
    const list = m.querySelector('#pksList');
    if(!open.length){
      list.innerHTML = `<div class="empty pks-empty">All sorted. Nothing is circling.</div>`;
      m.querySelector('#pksSweep').innerHTML = '';
      return;
    }
    list.innerHTML = open.map(x => {
      const k = parkKind(x.kind);
      const when = `${typeof clockOf === 'function' ? clockOf(x.at) : ''}${x.day !== today() ? ' · ' + fmtDate(x.day, 'short') : ''}${
        x.during && x.during.what ? ` · during “${esc(x.during.what)}”` : x.during && x.during.onBreak ? ' · on a break' : ''}`;
      return `<div class="pks-it k-${k.id}" data-pk="${esc(x.id)}">
        <div class="pks-top">
          <span class="pks-kinds" role="radiogroup" aria-label="what kind of thing">${PARK_KINDS.map(o =>
            `<button type="button" role="radio" class="pk-kind${o.id === k.id ? ' on' : ''}" data-pkskind="${o.id}" aria-checked="${o.id === k.id}" title="${esc(o.name)}">${o.glyph}</button>`).join('')}</span>
          <input class="inp pks-text" data-pkstext value="${esc(x.text)}" aria-label="what was parked">
        </div>
        <div class="mono faint pks-when">${when}</div>
        <div class="pks-acts">
          ${k.id === 'todo' || k.id === 'ask' ? `<button type="button" class="btn sm" data-pkact="tick">✓ done</button>` : ''}
          <button type="button" class="btn sm" data-pkact="task">→ Inbox</button>
          <button type="button" class="btn sm" data-pkact="today">→ today</button>
          <button type="button" class="btn sm" data-pkact="tomorrow">→ tomorrow</button>
          <button type="button" class="btn sm ghost" data-pkact="journal">→ journal</button>
          <button type="button" class="btn sm ghost" data-pkact="letgo">let it go</button>
          <button type="button" class="btn sm ghost" data-pkact="drop" aria-label="throw it away" title="throw it away">×</button>
        </div></div>`;
    }).join('');
    const todos = open.filter(x => x.kind === 'todo' || x.kind === 'ask').length;
    const s = FocusTimer.state(), inFocus = !s.idle && s.phase === 'focus' && (s.running || s.onBreak);
    m.querySelector('#pksSweep').innerHTML = todos && !inFocus
      ? `<button class="btn sm ghost" id="pksGo">◷ ten minutes for the ${todos} small one${todos === 1 ? '' : 's'}</button>` : '';
    const go = m.querySelector('#pksGo'); if(go) go.onclick = () => { m.remove(); parkSweep(); };
  };
  m.addEventListener('click', ev => {
    const kb = ev.target.closest('[data-pkskind]');
    if(kb){ const x = parkById(kb.closest('[data-pk]').dataset.pk); if(x){ x.kind = kb.dataset.pkskind; saveNow(); draw(); parkRepaint(); } return; }
    const b = ev.target.closest('[data-pkact]');
    if(b){ const x = parkById(b.closest('[data-pk]').dataset.pk); if(x) parkAct(x, b.dataset.pkact, draw); }
  });
  m.addEventListener('change', ev => {
    const t = ev.target.closest('[data-pkstext]'); if(!t) return;
    const x = parkById(t.closest('[data-pk]').dataset.pk);
    if(x && t.value.trim()){ x.text = t.value.trim(); saveNow(); parkRepaint(); }
  });
  m.querySelector('#pksDone').onclick = () => { m.remove(); if(!parkTypingHere()) rerender(); };
  draw();
  return m;
}
const parkTypingHere = () => { const a = document.activeElement; return !!(a && /INPUT|TEXTAREA/.test(a.tagName) && a.closest('#main')); };

/* ten minutes on the clock for the small things, once the sitting is done */
function parkSweep(){
  const s = FocusTimer.state();
  if(!s.idle && s.phase === 'focus' && (s.running || s.onBreak)){
    toast('A sitting is under way — finish it first, then ten minutes for these.', 4500); return; }
  const n = parkedOpen().filter(x => x.kind === 'todo' || x.kind === 'ask').length;
  if(s.running) FocusTimer.pause();
  FocusTimer.reset();
  FocusTimer.setMode('countdown'); FocusTimer.setLength(10); FocusTimer.setTask(null);
  FocusTimer.start();
  if(typeof FocusTimer.noteWork === 'function') FocusTimer.noteWork(`Clearing what was parked (${n})`);
  if(typeof sound === 'function') sound('success');
  toast('Ten minutes. Tick them off as they go; whatever is left can become a task.', 5000);
  rerender();
}

/* ---------- the pocket: focus mode on a page rather than the desk ---------- */
function paintParkPocket(){
  let pocket = document.getElementById('pkPocket');
  const want = typeof pageFocusOn === 'function' && pageFocusOn()
    && !(typeof focusDeskOn === 'function' && focusDeskOn()) && !document.querySelector('#main .pk');
  if(!want){ if(pocket) pocket.remove(); return; }
  if(!pocket){
    pocket = el(`<div class="pk-pocket" id="pkPocket">
      <button type="button" class="pk-tab" id="pkTab" aria-expanded="false" title="park a thought (P) · note a distraction (D)">✎ parked<span class="pk-n"></span> · ⚡</button>
      <div class="pk-panel" id="pkPanel" hidden></div></div>`);
    document.body.appendChild(pocket);
    pocket.querySelector('#pkTab').onclick = () => parkPocketOpen(pocket.querySelector('#pkPanel').hidden);
  }
  paintParkPocketCount();
}
function paintParkPocketCount(){
  const n = parkedOpen().length, tab = document.querySelector('#pkPocket .pk-n');
  if(tab) tab.textContent = n ? ` · ${n}` : '';
}
function parkPocketOpen(open = true){
  const pocket = document.getElementById('pkPocket'); if(!pocket) return false;
  const panel = pocket.querySelector('#pkPanel'), tab = pocket.querySelector('#pkTab');
  panel.hidden = !open; tab.setAttribute('aria-expanded', open); pocket.classList.toggle('open', open);
  if(open){
    /* the thoughts, and the distractions, the same two boxes as on the desk */
    panel.innerHTML = parkedBlockHTML({where: 'pocket'})
      + (typeof distractionBlockHTML === 'function' ? distractionBlockHTML({where: 'pocket'}) : '');
    bindParked(panel);
    if(typeof bindDistractions === 'function') bindDistractions(panel);
    const i = panel.querySelector('[data-pkinp]'); if(i) i.focus();
  }
  return true;
}
/* clicking back on the page puts the pocket away again */
document.addEventListener('pointerdown', ev => {
  const pk = document.getElementById('pkPocket');
  if(pk && pk.classList.contains('open') && !pk.contains(ev.target) && !(ev.target.closest && ev.target.closest('.toast, #modals, .dx-flashcard')))
    parkPocketOpen(false);
});
/* P: to the box, wherever it is */
function parkFocusInput(){
  if(document.getElementById('pkPocket')) return parkPocketOpen(true);
  const shut = document.querySelector('#main .pk-shut [data-pkopen]');
  if(shut){ shut.click(); return true; }
  const i = document.querySelector('#main .pk [data-pkinp]');
  if(!i) return false;
  i.scrollIntoView({block: 'center', behavior: typeof reduced === 'function' && reduced() ? 'auto' : 'smooth'});
  i.focus();
  return true;
}

/* ---------- afterwards ----------
   At a break, and on leaving focus mode, what was parked is mentioned once —
   with the way to sort it, and without insisting. */
let _pkRestKey = null;
function parkWatchTimer(){
  if(typeof FocusTimer === 'undefined' || parkWatchTimer.on) return;
  parkWatchTimer.on = true;
  FocusTimer.subscribe(s => {
    const rest = !s.idle && (s.phase !== 'focus' || s.onBreak);
    if(!rest){ _pkRestKey = null; return; }
    const key = `${s.startedAt}|${s.phase}|${s.breakSince || ''}`;
    if(key === _pkRestKey) return;
    _pkRestKey = key;
    const n = parkedOpen().length;
    if(n) setTimeout(() => toast(`A break. ${n} thing${n === 1 ? ' is' : 's are'} parked — now is a good time, or later.`, 7000,
      {label: 'sort them', fn: openParkedSort}), 400);
  });
}
function parkOnFocusMode(on){
  if(on){ S._pkSince = Date.now(); return; }
  const since = S._pkSince || 0; S._pkSince = null;
  const n = parkedOpen().filter(x => Date.parse(x.at) >= since).length;
  if(n) setTimeout(() => toast(`${n} thing${n === 1 ? ' was' : 's were'} parked while you were focused. They wait in the Focus section on Today.`, 7000,
    {label: 'sort them', fn: openParkedSort}), 500);
}
setTimeout(parkWatchTimer, 0);
