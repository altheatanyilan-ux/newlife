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
  const frac = total ? 1 - s.left / total : 0;
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
      <!-- the drop target: a task becomes the subject by being dragged here -->
      <div class="fp-drop" data-focusdrop>
        ${name ? `<div class="fp-on">
            <span class="k mono">on</span>
            <b class="serif">${esc(name)}</b>
            <button class="pl-mini" id="fpClear" title="take it out of the timer">×</button>
          </div>
          ${rec ? `<div class="fp-rec mono">${fmtHM(rec.minutes)} over ${rec.sessions} sitting${rec.sessions === 1 ? '' : 's'}${rec.breaks ? ` · ${rec.breaks} break${rec.breaks === 1 ? '' : 's'}` : ''} · started ${clockOf(rec.startedAt)}</div>` : ''}`
        : `<div class="fp-empty">Drag a task here to time it — or start the clock without one.</div>`}
      </div>

      <div class="fp-body">
        <div class="fp-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="${R}" class="ft-track"/>
            <circle cx="60" cy="60" r="${R}" class="ft-arc" style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/>
          </svg>
          <div class="fp-face"><div class="fp-time serif">${fmtClock(s.left)}</div>
            <div class="fp-phase mono">${s.phase === 'focus' ? (s.onBreak ? 'on a break' : 'focus') : s.phase === 'long' ? 'long break' : 'break'}</div></div>
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
    const tEl = box.querySelector('.fp-time'); if(tEl) tEl.textContent = fmtClock(s.left);
    const c = planState().timer;
    const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
    const arc = box.querySelector('.ft-arc');
    if(arc && total){ const R = 52, C = 2 * Math.PI * R;
      arc.style.strokeDashoffset = (C * (s.left / total)).toFixed(1); }
  };
  const iv = setInterval(face, 1000);
  face();
}
