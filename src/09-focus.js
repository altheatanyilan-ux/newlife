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

/* ---------- the timer, reachable from any task ----------
   The focus timer used to be a place you went to, and then a panel on Today
   you dragged a task into. Both make starting work a small errand. A task
   anywhere in the house now carries its own timer button: press it and the
   sitting begins, on that task, wherever you happened to be looking.

   One button, one handler, drawn by three different row renderers (the Today
   row, the Planning row, the matrix card), so they cannot drift apart. */
function taskTimerBtnHTML(id, {sm = false} = {}){
  const on = FocusTimer.state().taskId === id && FocusTimer.state().running;
  return `<button class="task-timer${sm ? ' sm' : ''}${on ? ' on' : ''}" data-tfocus="${esc(id)}"
    title="${on ? 'this sitting is running' : 'start a focus session on this'}" aria-label="focus on this task">
    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="11" r="7" class="tt-ring"/>
      <path d="M10 7.4V11l2.4 1.6" class="tt-hands"/><path d="M7.6 2.8h4.8" class="tt-crown"/></svg></button>`;
}
function bindTaskTimers(root){
  $$('[data-tfocus]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    focusOnTask(b.dataset.tfocus);
  });
}
/* Pressing the timer does what dragging the task into the panel does, and
   nothing less. There used to be a second, smaller timer in a side panel for
   when you pressed this from somewhere other than Today — it could start and
   stop and that was all: no note of what you were actually doing, no note of
   what the break was for. Two timers of unequal worth is worse than one, so
   that panel is gone and this always lands you at the real one.

   Which means the gesture is three things, in order: put the task on today,
   because a task you are sitting down with now is today's whether or not it
   was this morning; hand it to the timer; and go to the page the timer lives
   on. */
function focusOnTask(id){
  const t = (typeof planTaskById === 'function' ? planTaskById(id) : null) ||
            (typeof findTaskRef === 'function' ? findTaskRef(id)?.task : null);
  const T = today();
  if(t && t.day !== T){ t.day = T; t.updatedAt = new Date().toISOString(); saveNow(); }
  FocusTimer.setTask(id);
  const st = FocusTimer.state();
  if(!st.running || st.taskId !== id) FocusTimer.start();
  sound('success');
  toast(`Focusing on ${t?.text || 'this'} — it is on today's list now.`);
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
        <div class="fp-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="${R}" class="ft-track"/>
            <circle cx="60" cy="60" r="${R}" class="ft-arc" style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/>
          </svg>
          <div class="fp-face"><div class="fp-time serif">${fmtClock(face)}</div>
            <div class="fp-phase mono">${s.phase === 'focus' ? (s.onBreak ? 'on a break' : (stop ? 'counting up' : 'focus')) : s.phase === 'long' ? 'long break' : 'break'}</div></div>
        </div>
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
    if(arc){ const R = 52, C = 2 * Math.PI * R;
      const frac = up ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);
      arc.style.strokeDashoffset = (C * (1 - frac)).toFixed(1); }
  };
  const iv = setInterval(face, 1000);
  face();
}
