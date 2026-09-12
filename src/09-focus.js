/* ============================================================
   THE FOCUS PANEL — where the day's work actually gets done.

   The timer already existed, in Planning, as somewhere you went.
   Going somewhere is the wrong shape for a timer: the whole point
   is that it runs while you are looking at the thing you are doing.
   So it sits on Today, next to the list, and a task becomes the
   session's subject by being dragged into it.

   What is recorded, and why:

   - Time worked, per task, as sessions with a real start and end.
     Not "about two hours" reconstructed at night — the clock times
     the work was actually happening.
   - Breaks. A pause is a break, and a break is the part of a day
     that looks like working and is not. Each one takes a note of
     what it was actually for, written while it is happening.
   - When a task is finished, the record of how: first sitting,
     last sitting, time worked, how many breaks. Derived from the
     sessions rather than stored twice, so it cannot disagree with
     them.

   That measured time is what the Compass now draws. Wasted time is
   no longer tracked anywhere — a number nobody enjoys entering, and
   which was being guessed. What is worth knowing is how much of a
   day was made use of, and that can be measured instead of guessed.
   ============================================================ */

/* ---------- how long it will take, and starting that long ----------
   The button on a task row used to be a bare timer icon: press it and a
   sitting began, of whatever length the timer happened to be set to. But the
   useful thing to see on a row is not that a timer exists — it is how long
   you think the thing will take. So the row carries the estimate, and the
   estimate is the button: press it and the countdown starts at exactly that
   length.

   A task broken into steps takes its total from the steps. Estimating the
   whole and estimating the parts are two different acts and the parts are
   the honest one, so when there are parts they are the answer and the
   task's own figure steps aside — the same rule an income stream made of
   parts already follows. */
function taskEstOf(t){
  if(!t) return 0;
  const subs = Array.isArray(t.subtasks) ? t.subtasks : [];
  const fromSubs = subs.reduce((n, s) => n + (+s.minutes || 0), 0);
  return fromSubs || +t.duration || 0;
}
const taskHasSubEst = t => (Array.isArray(t?.subtasks) ? t.subtasks : []).some(s => +s.minutes > 0);
/* "25m", "1h", "1h 30m" — never "0h 25m" */
function fmtEst(m){
  m = Math.round(+m || 0); if(!m) return '';
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
}
/* The number starts the sitting and a small pencil beside it changes the
   length — the same division the task row already uses, where the name opens
   the task and a pencil renames it. Without the pencil a length once set
   could never be changed: every press went to the timer.

   A task whose steps carry the lengths has nothing of its own to edit, so it
   shows no pencil — the pencils are on the steps, where the figures are. */
function taskEstHTML(id, t, {sm = false} = {}){
  const mins = taskEstOf(t);
  const on = FocusTimer.state().taskId === id && FocusTimer.state().running;
  const rolled = taskHasSubEst(t);
  return `<span class="est-wrap${sm ? ' sm' : ''}">
    <button class="task-est${sm ? ' sm' : ''}${on ? ' on' : ''}${mins ? '' : ' none'}"
      data-test="${esc(id)}" data-estmin="${mins}"
      title="${mins ? `${fmtEst(mins)}${rolled ? ', added up from the steps' : ''} — press to sit down with it for that long` : 'how long will it take?'}">
      ${mins ? esc(fmtEst(mins)) : '<span class="te-set">＋ est</span>'}</button>
    ${mins && !rolled ? `<button class="est-pen" data-testedit="${esc(id)}" title="change the length" aria-label="change the length">✎</button>` : ''}
  </span>`;
}
function bindTaskTimers(root){
  $$('[data-test]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const id = b.dataset.test, mins = +b.dataset.estmin || 0;
    if(!mins) return askTaskEstimate(id);
    focusOnTask(id, mins);
  });
  $$('[data-testedit]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation(); askTaskEstimate(b.dataset.testedit); });
  $$('[data-subestedit]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation(); const [rid, sid] = b.dataset.subestedit.split('|'); askSubEstimate(rid, sid); });
  $$('[data-subest]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const [rid, sid] = b.dataset.subest.split('|');
    const r = findTaskRef(rid) || (typeof planTaskById === 'function' ? {task: planTaskById(rid), id: rid} : null);
    const s = (r?.task?.subtasks || []).find(x => x.id === sid); if(!s) return;
    if(!+s.minutes) return askSubEstimate(rid, sid);
    focusOnTask(rid, +s.minutes, s.title);
  });
}
/* Asked with the chooser the rest of the planner uses. The presets run from
   five minutes to a whole working day, and anything not on the list can be
   typed: "90", "1h30", "2h", "45m" all mean what they look like. A fixed set
   of nine was too few — most things do not take exactly twenty-five minutes. */
const EST_CHOICES = [5, 10, 15, 20, 25, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360, 480];
/* "1h30" → 90, "2h" → 120, "45m" → 45, "1.5h" → 90, "90" → 90 */
function parseEst(txt){
  const t = String(txt || '').trim().toLowerCase();
  if(!t) return 0;
  const hm = t.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?\s*(\d+)?\s*m?(?:ins?|inutes?)?$/);
  if(hm) return Math.round(+hm[1] * 60 + (+hm[2] || 0));
  const m = t.match(/^(\d+(?:\.\d+)?)\s*m?(?:ins?|inutes?)?$/);
  if(m) return Math.round(+m[1]);
  return 0;
}
function estChoices(){ return [...EST_CHOICES.map(n => [String(n), fmtEst(n)]), ['0', 'no estimate']]; }
function askTaskEstimate(id){
  const t = (typeof planTaskById === 'function' ? planTaskById(id) : null) || findTaskRef(id)?.task;
  if(!t) return;
  planChoose('How long will it take?', estChoices(),
    v => { t.duration = /^\d+$/.test(v) ? +v : parseEst(v);
      t.updatedAt = new Date().toISOString(); saveNow(); sound('click'); rerender(); },
    'or type one — 90, 1h30, 2h');
}
function askSubEstimate(rid, sid){
  const r = findTaskRef(rid) || (typeof planTaskById === 'function' ? {task: planTaskById(rid)} : null);
  const s = (r?.task?.subtasks || []).find(x => x.id === sid); if(!s) return;
  planChoose('How long will this step take?', estChoices(),
    v => { s.minutes = /^\d+$/.test(v) ? +v : parseEst(v); saveNow(); sound('click'); rerender(); },
    'or type one — 90, 1h30, 2h');
}

/* Pressing an estimate does what dragging the task into the panel does, and
   nothing less. There used to be a second, smaller timer in a side panel for
   when you pressed this from somewhere other than Today — it could start and
   stop and that was all: no note of what you were actually doing, no note of
   what the break was for. Two timers of unequal worth is worse than one, so
   that panel is gone and this always lands you at the real one.

   Three things, in order: put the task on today, because a task you are
   sitting down with now is today's whether or not it was this morning; set
   the countdown to the length you estimated and hand it the task; and go to
   the page the timer lives on. */
function focusOnTask(id, minutes = 0, what = ''){
  const t = (typeof planTaskById === 'function' ? planTaskById(id) : null) ||
            (typeof findTaskRef === 'function' ? findTaskRef(id)?.task : null);
  const T = today();
  if(t && t.day !== T){ t.day = T; t.updatedAt = new Date().toISOString(); saveNow(); }
  /* a length can only be set while nothing is running, so a sitting already
     under way is stopped first — pressing an estimate is an unambiguous
     request to sit down with that thing for that long */
  if(minutes){
    if(FocusTimer.state().running) FocusTimer.stop();
    FocusTimer.reset();
    FocusTimer.setMode('countdown');
    FocusTimer.setLength(minutes);
  }
  FocusTimer.setTask(id);
  const st = FocusTimer.state();
  if(!st.running || st.taskId !== id) FocusTimer.start();
  if(what && typeof FocusTimer.noteWork === 'function') FocusTimer.noteWork(what);
  sound('success');
  toast(`${minutes ? fmtEst(minutes) + ' on ' : 'Focusing on '}${what || t?.text || 'this'} — it is on today's list now.`);
  if(parseHash().name === 'today') rerender();
  else navigate('#/today');
}

/* Any task with a logged sitting is in progress, whoever asks. */
function taskIsInProgress(id){ return !id ? false : focusSessionsFor(id).length > 0; }
function taskFocusMinutes(id){ return sum(focusSessionsFor(id).map(s => +s.duration || 0)); }

/* ---------- reading the record ---------- */
function focusSessions(){ return (planState().focusSessions || []).filter(s => s.type === 'focus'); }
function focusSessionsOn(day){ return focusSessions().filter(s => (s.startedAt || '').slice(0, 10) === day); }
function focusMinutesOn(day){ return sum(focusSessionsOn(day).map(s => +s.duration || 0)); }
function focusSessionsFor(taskId){
  return focusSessions().filter(s => s.taskId === taskId)
    .sort((a, b) => (a.startedAt || '') < (b.startedAt || '') ? -1 : 1);
}
/* The process, read off the sessions rather than kept beside them. */
function taskWorkRecord(taskId){
  const ss = focusSessionsFor(taskId);
  if(!ss.length) return null;
  const breaks = ss.reduce((n, s) => n + (s.breaks || []).length, 0);
  return {
    startedAt: ss[0].startedAt,
    finishedAt: ss[ss.length - 1].endedAt,
    minutes: sum(ss.map(s => +s.duration || 0)),
    sessions: ss.length,
    breaks,
    breakNotes: ss.flatMap(s => (s.breaks || []).filter(b => b.note).map(b => b.note)),
  };
}
const fmtHM = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim() : `${m}m`;
const clockOf = iso => { if(!iso) return '—'; const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- the face ----------
   A ring that empties is a progress bar bent into a circle: it says how much
   is left as a proportion and nothing about time. A clock says it as time,
   which is the thing being measured, and a hand that sweeps is the plainest
   signal in the world that something is running.

   So: a dial with sixty marks, a minute hand and a second hand, both moving.
   Counting down, the hands read the time remaining — the minute hand falls
   back towards twelve as the sitting ends. Counting up, they read the time
   spent. The thin arc stays, behind the hands, because for a countdown the
   proportion is worth seeing too. */
const FP_R = 52;
function focusClockHTML(face, frac, col, s, stop){
  const C = 2 * Math.PI * FP_R;
  const secs = Math.max(0, face | 0);
  const secDeg = (secs % 60) * 6;
  /* one sweep of the minute hand is an hour, so a 25-minute sitting uses less
     than half the dial and a 90-minute one goes round once and a half; the
     hour hand takes twelve hours to come round, as on any clock, and is what
     tells a two-hour sitting from a fourteen-minute one at a glance */
  const minDeg = (secs % 3600) / 3600 * 360;
  const hourDeg = (secs % 43200) / 43200 * 360;
  const marks = Array.from({length: 60}, (_, i) => {
    const major = i % 5 === 0;
    const a = i * 6 * Math.PI / 180, r1 = major ? 40 : 44, r2 = 46.5;
    return `<line class="fc-mark${major ? ' major' : ''}"
      x1="${(60 + Math.sin(a) * r1).toFixed(2)}" y1="${(60 - Math.cos(a) * r1).toFixed(2)}"
      x2="${(60 + Math.sin(a) * r2).toFixed(2)}" y2="${(60 - Math.cos(a) * r2).toFixed(2)}"/>`;
  }).join('');
  const phase = s.phase === 'focus' ? (s.onBreak ? 'on a break' : (stop ? 'counting up' : 'focus'))
    : s.phase === 'long' ? 'long break' : 'break';
  return `<div class="fp-ring${s.running ? ' ticking' : ''}${s.onBreak ? ' resting' : ''}">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${FP_R}" class="ft-track"/>
      <circle cx="60" cy="60" r="${FP_R}" class="ft-arc"
        style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/>
      <g class="fc-marks">${marks}</g>
      <g class="fc-hand fc-hour" style="transform:rotate(${hourDeg.toFixed(2)}deg)">
        <line x1="60" y1="62" x2="60" y2="38"/></g>
      <g class="fc-hand fc-min" style="transform:rotate(${minDeg.toFixed(2)}deg)">
        <line x1="60" y1="60" x2="60" y2="27"/></g>
      <g class="fc-hand fc-sec" style="transform:rotate(${secDeg.toFixed(2)}deg)">
        <line x1="60" y1="66" x2="60" y2="20"/></g>
      <circle cx="60" cy="60" r="3.2" class="fc-pin" style="fill:${col}"/>
    </svg>
    <div class="fp-face"><div class="fp-time mono">${fmtClock(face)}</div>
      <div class="fp-phase mono">${phase}</div></div>
  </div>`;
}

/* ---------- the panel ---------- */
function focusPanelHTML(){
  const s = FocusTimer.state(), c = planState().timer;
  const t = s.taskId ? (typeof planTaskById === 'function' ? planTaskById(s.taskId) : null)
                     : null;
  const ref = s.taskId && !t && typeof findTaskRef === 'function' ? findTaskRef(s.taskId) : null;
  const name = t ? t.text : ref ? ref.text : '';
  const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  /* A countdown's ring empties towards an end. A stopwatch has no end, so its
     ring fills once round every hour — a shape that says "time is passing"
     without pretending to a finish line. */
  const stop = s.mode === 'stopwatch' && s.phase === 'focus';
  const frac = stop ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);
  const face = stop ? s.elapsed : s.left;
  const R = 52, C = 2 * Math.PI * R;
  const col = s.phase === 'focus' ? 'var(--terra)' : 'var(--sage)';
  const rec = s.taskId ? taskWorkRecord(s.taskId) : null;
  const todayMins = focusMinutesOn(today());

  return `<section class="section rv focus-block" id="t-focus">
    <div class="row between" style="gap:10px;flex-wrap:wrap">
      <span class="sc" style="margin:0">Focus</span>
      <span class="mono faint">${todayMins ? `${fmtHM(todayMins)} worked today` : 'nothing timed yet today'}</span>
    </div>
    <div class="card fp-card${s.running ? ' running' : ''}${s.onBreak ? ' onbreak' : ''}">
      <!-- How the sitting is counted is chosen before it starts, because the two
           are different questions: can I hold this for twenty-five minutes, or
           how long did that actually take. It is fixed once the clock runs. -->
      <div class="fp-setup">
      <div class="fp-mode${s.idle ? '' : ' locked'}">
        ${[['countdown', 'Countdown', 'to a length you set'], ['stopwatch', 'Stopwatch', 'counts up, no end']]
          .map(([k, n, why]) => `<button class="fp-modebtn${s.mode === k ? ' on' : ''}" data-fpmode="${k}"
            ${s.idle ? '' : 'disabled'} title="${s.idle ? esc(why) : 'the clock is already running'}">
            <span class="fp-mname">${n}</span><span class="fp-mwhy">${esc(why)}</span></button>`).join('')}
      </div>
      ${s.mode === 'countdown' ? `<div class="fp-len${s.idle ? '' : ' locked'}">
        <span class="k mono">how long</span>
        ${[15, 25, 45, 60, 90].map(n => `<button class="fp-lenbtn${c.focusDuration === n ? ' on' : ''}"
          data-fplen="${n}" ${s.idle ? '' : 'disabled'}>${n}m</button>`).join('')}
        <input class="inp mono fp-lenn" id="fpLen" type="number" min="1" max="240"
          value="${c.focusDuration}" ${s.idle ? '' : 'disabled'} aria-label="minutes">
      </div>` : ''}
      </div>

      <!-- the drop target: a task becomes the subject by being dragged here -->
      <div class="fp-drop" data-focusdrop>
        ${name ? `<div class="fp-on">
            <span class="k mono">on</span>
            ${t ? subCaretHTML(t.id, t, 'task-caret fp-caret') : ''}
            <b class="serif">${esc(name)}</b>
            <button class="pl-mini" id="fpClear" title="take it out of the timer">×</button>
          </div>
          ${rec ? `<div class="fp-rec mono">${fmtHM(rec.minutes)} over ${rec.sessions} sitting${rec.sessions === 1 ? '' : 's'}${rec.breaks ? ` · ${rec.breaks} break${rec.breaks === 1 ? '' : 's'}` : ''} · started ${clockOf(rec.startedAt)}</div>` : ''}
          <!-- The steps and the links are the reason the task was parked here:
               they are what you are about to work from. Hiding them behind the
               task's own page meant leaving the timer to read them. -->
          ${t && subsOpen(t.id, t) ? subBlockHTML(t.id, t) : ''}
          ${t && t.desc ? `<div class="fp-desc">${esc(t.desc)}</div>` : ''}`
        : `<div class="fp-empty">Drag a task here to time it — or start the clock without one.</div>`}
      </div>

      <div class="fp-body">
        ${focusClockHTML(face, frac, col, s, stop)}
        <div class="fp-side">
          <div class="row" style="gap:8px;flex-wrap:wrap">
            <button class="btn sm primary" id="fpGo">${s.running ? '⏸ pause' : s.idle ? '▶ start' : '▶ resume'}</button>
            ${s.idle ? '' : `<button class="btn sm ghost" id="fpStop">finish the sitting</button>`}
          </div>
          ${s.onBreak ? `<div class="fp-break">
            <label class="k mono" for="fpBreakNote">what is this break for?</label>
            <input class="inp sm" id="fpBreakNote" value="${esc(s.breakNote || '')}"
              placeholder="tea · a walk · scrolling, honestly" autocomplete="off">
            <div class="faint" style="font-size:.7rem">Since ${clockOf(s.breakSince)}. It is not counted as work.</div>
          </div>` : `<div class="faint" style="font-size:.76rem">${s.running
            ? 'Pausing starts a break, and asks what it is for.'
            : 'Only time the clock is running counts as worked.'}</div>`}
          <!-- A break has always been asked what it was for. A sitting of work
               was not, which left the record saying how long but never what. -->
          ${s.idle ? '' : `<div class="fp-did">
            <label class="k mono" for="fpDid">what are you actually doing?</label>
            <input class="inp sm" id="fpDid" value="${esc(s.notes || '')}"
              placeholder="the second draft · the tricky bit of the proof" autocomplete="off">
            <div class="faint" style="font-size:.7rem">Kept with the sitting when it is finished.</div>
          </div>`}
        </div>
      </div>
    </div>
  </section>`;
}

function bindFocusPanel(root, redraw){
  const go = redraw || rerender;
  const box = root.querySelector('#t-focus');
  if(!box) return;

  const gob = box.querySelector('#fpGo');
  if(gob) gob.onclick = () => { const s = FocusTimer.state();
    s.running ? FocusTimer.pause() : FocusTimer.start(undefined, s.phase); sound('click'); go(); };
  const stop = box.querySelector('#fpStop');
  if(stop) stop.onclick = () => { FocusTimer.stop(); sound('click'); go(); };
  const clr = box.querySelector('#fpClear');
  if(clr) clr.onclick = () => { FocusTimer.setTask(null); go(); };

  /* the note is written while the break is happening, so it saves as it is
     typed rather than needing to be confirmed before the break ends */
  const note = box.querySelector('#fpBreakNote');
  if(note) note.oninput = debounce(function(){ FocusTimer.noteBreak(this.value); }, 300);
  const did = box.querySelector('#fpDid');
  if(did) did.oninput = debounce(function(){ FocusTimer.noteWork(this.value); }, 300);

  /* the mode and the length are settable only while the clock is idle, which
     the timer enforces as well as the disabled attribute */
  box.querySelectorAll('[data-fpmode]').forEach(bt => bt.onclick = () => {
    if(FocusTimer.setMode(bt.dataset.fpmode)){ sound('click'); go(); } });
  box.querySelectorAll('[data-fplen]').forEach(bt => bt.onclick = () => {
    if(FocusTimer.setLength(+bt.dataset.fplen)){ sound('click'); go(); } });
  const len = box.querySelector('#fpLen');
  if(len) len.onchange = () => { if(FocusTimer.setLength(len.value)) go(); };

  /* the steps of the task being worked on are live here, not a picture of it */
  if(typeof bindSubtasks === 'function') bindSubtasks(box, go);

  const drop = box.querySelector('[data-focusdrop]');
  if(drop){
    drop.addEventListener('dragover', ev => {
      if(!window._taskDrag) return;
      ev.preventDefault(); ev.stopPropagation(); drop.classList.add('over');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', ev => {
      const id = window._taskDrag || ev.dataTransfer.getData('text/plain');
      drop.classList.remove('over');
      if(!id) return;
      ev.preventDefault(); ev.stopPropagation();
      FocusTimer.setTask(id);
      sound('success');
      go();
    });
  }
}

/* Keep the ring moving while the page is open, without redrawing the whole of
   Today every second: only the two numbers change. */
function liveFocusFace(root){
  const off = FocusTimer.subscribe(() => {});
  const face = () => {
    const box = root.querySelector('#t-focus'); if(!box || !box.isConnected){ clearInterval(iv); off(); return; }
    const s = FocusTimer.state();
    /* a stopwatch counts up and has no `left` to show: reading that field
       regardless is how the face sat at 00:00 while the clock was running */
    const up = s.mode === 'stopwatch' && s.phase === 'focus';
    const tEl = box.querySelector('.fp-time'); if(tEl) tEl.textContent = fmtClock(up ? s.elapsed : s.left);
    const c = planState().timer;
    const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
    const arc = box.querySelector('.ft-arc');
    if(arc){ const C = 2 * Math.PI * FP_R;
      const frac = up ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);
      arc.style.strokeDashoffset = (C * (1 - frac)).toFixed(1); }
    /* the hands are the point of the face, so they move every second rather
       than only when the panel happens to be redrawn */
    const secs = Math.max(0, (up ? s.elapsed : s.left) | 0);
    const mh = box.querySelector('.fc-min'), sh = box.querySelector('.fc-sec'), hh = box.querySelector('.fc-hour');
    if(hh) hh.style.transform = `rotate(${((secs % 43200) / 43200 * 360).toFixed(2)}deg)`;
    if(mh) mh.style.transform = `rotate(${((secs % 3600) / 3600 * 360).toFixed(2)}deg)`;
    if(sh) sh.style.transform = `rotate(${((secs % 60) * 6).toFixed(2)}deg)`;
    const ring = box.querySelector('.fp-ring');
    if(ring){ ring.classList.toggle('ticking', !!s.running); ring.classList.toggle('resting', !!s.onBreak); }
  };
  const iv = setInterval(face, 1000);
  face();
}
