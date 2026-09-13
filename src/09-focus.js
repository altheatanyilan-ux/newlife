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
/* How long was actually spent on it. The timer's own accounting already
   leaves out the pauses and the breaks — a countdown's remaining freezes
   while paused and a stopwatch accumulates only while running — so this is
   simply the sum of the sittings.

   A step's sittings belong to the task as well as to the step, which is why
   the task's figure counts them all and the step's counts only its own. */
function taskSpentOn(id){
  if(!id || typeof focusSessions !== 'function') return 0;
  return sum(focusSessions().filter(s => s.taskId === id).map(s => +s.duration || 0));
}
function subSpentOn(taskId, subId){
  if(!taskId || !subId || typeof focusSessions !== 'function') return 0;
  return sum(focusSessions().filter(s => s.taskId === taskId && s.subId === subId).map(s => +s.duration || 0));
}
/* What is left of the estimate, which is what a second sitting should be.
   Pressing "25m" on a task you have already given fifteen minutes to used to
   start another twenty-five — so the countdown and the estimate stopped
   meaning the same thing the moment you came back to something. An estimate
   is of the whole job, not of each visit to it, so a later sitting counts
   down what is still owed.

   A step's sittings are measured against the step's own figure; the task's
   against the task's. Once the estimate is spent there is nothing left to
   count down, and the sitting counts up instead rather than inventing time
   that was never estimated. */
function focusLeftOn(id, minutes, subId){
  if(!(+minutes > 0)) return 0;
  const done = subId ? subSpentOn(id, subId) : taskSpentOn(id);
  return Math.max(0, Math.round(+minutes - done));
}
/* "13m of 15m" while there is an estimate to measure against, "13m" when
   there is not, and nothing at all under a minute — a sitting shorter than
   that is not worth the ink and is not recorded in the first place. */
function fmtSpent(spent, est){
  if(!(spent >= 1)) return '';
  return est ? `${fmtEst(spent)} of ${fmtEst(est)}` : fmtEst(spent);
}
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
  const spent = taskSpentOn(id);
  const left = focusLeftOn(id, mins);
  const over = mins && spent > mins;
  const label = spent >= 1
    ? `<span class="te-spent">${esc(fmtEst(spent))}</span>${mins ? `<span class="te-of">of</span>${esc(fmtEst(mins))}` : ''}`
    : mins ? esc(fmtEst(mins)) : '<span class="te-set">＋ est</span>';
  return `<span class="est-wrap${sm ? ' sm' : ''}">
    <button class="task-est${sm ? ' sm' : ''}${on ? ' on' : ''}${mins ? '' : ' none'}${spent >= 1 ? ' spent' : ''}${over ? ' over' : ''}"
      data-test="${esc(id)}" data-estmin="${mins}"
      title="${spent >= 1
        ? `${fmtEst(spent)} sat with so far${mins ? `, of ${fmtEst(mins)} estimated` : ''} — press to sit down with ${
            !mins ? 'it again' : left >= 1 ? `the ${fmtEst(left)} left` : 'it again; the estimate is spent, so it counts up'}`
        : mins ? `${fmtEst(mins)}${rolled ? ', added up from the steps' : ''} — press to sit down with it for that long`
        : 'how long will it take?'}">
      ${label}</button>
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
    focusOnTask(rid, +s.minutes, s.title, sid);
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
function focusOnTask(id, minutes = 0, what = '', subId = null){
  const t = (typeof planTaskById === 'function' ? planTaskById(id) : null) ||
            (typeof findTaskRef === 'function' ? findTaskRef(id)?.task : null);
  const T = today();
  if(t && t.day !== T){ t.day = T; t.updatedAt = new Date().toISOString(); saveNow(); }
  /* a length can only be set while nothing is running, so a sitting already
     under way is stopped first — pressing an estimate is an unambiguous
     request to sit down with that thing for that long */
  const left = focusLeftOn(id, minutes, subId);
  if(minutes){
    if(FocusTimer.state().running) FocusTimer.stop();
    FocusTimer.reset();
    /* the estimate is of the job, so a sitting that follows earlier ones
       counts down what is still owed rather than the whole figure again */
    if(left >= 1){ FocusTimer.setMode('countdown'); FocusTimer.setLength(left); }
    else FocusTimer.setMode('stopwatch');
  }
  FocusTimer.setTask(id, subId || null);
  const st = FocusTimer.state();
  if(!st.running || st.taskId !== id || st.subId !== (subId || null)) FocusTimer.start();
  if(what && typeof FocusTimer.noteWork === 'function') FocusTimer.noteWork(what);
  sound('success');
  const thing = what || t?.text || 'this';
  toast(!minutes ? `Focusing on ${thing} — it is on today's list now.`
    : left >= 1
      ? `${fmtEst(left)}${left < minutes ? ` left of ${fmtEst(minutes)}` : ''} on ${thing} — it is on today's list now.`
      : `${fmtEst(minutes)} was the estimate and it is spent — this sitting counts up. ${thing} is on today's list now.`);
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
  /* One lookup, not two. planTaskById only knows the standalone tasks, so a
     task living inside a project reached the timer as a bare name with no
     steps, no estimate and nothing to tick. findTaskRef knows both kinds. */
  const ref = s.taskId && typeof findTaskRef === 'function' ? findTaskRef(s.taskId) : null;
  const t = ref ? ref.task : null;
  const name = ref ? ref.text : '';
  /* A sitting can be on one step rather than the whole task, and until now the
     panel said only the task's name — so you could not tell which. */
  const sub = t && s.subId ? (Array.isArray(t.subtasks) ? t.subtasks : []).find(x => x.id === s.subId) : null;
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
            <!-- Finishing the work happens at the clock, so the tick belongs at
                 the clock. Without it you had to leave the timer, scroll down
                 to the list and find the row to say you were done — which is
                 why the sitting so rarely got closed by the task it was for. -->
            <button class="task-check fp-check${ref.done ? ' on' : ''}" data-fpdone="${esc(ref.id)}"
              role="checkbox" aria-checked="${!!ref.done}"
              title="${ref.done ? 'not done after all' : 'done — this ends the sitting'}">${ref.done ? '✓' : ''}</button>
            <span class="k mono">on</span>
            ${subCaretHTML(ref.id, t, 'task-caret fp-caret')}
            <b class="serif${ref.done ? ' struck' : ''}">${esc(name)}</b>
            ${taskEstHTML(ref.id, t, {sm:true})}
            <button class="pl-mini" id="fpClear" title="take it out of the timer">×</button>
          </div>
          ${sub ? `<div class="fp-step">
            <button class="task-check sm fp-check${sub.isCompleted ? ' on' : ''}"
              data-fpsubdone="${esc(ref.id)}|${esc(sub.id)}" role="checkbox"
              aria-checked="${!!sub.isCompleted}"
              title="${sub.isCompleted ? 'not done after all' : 'done — this ends the sitting'}">${sub.isCompleted ? '✓' : ''}</button>
            <span class="k mono">this step</span>
            <span class="fp-stepname${sub.isCompleted ? ' struck' : ''}">${esc(sub.title || '')}</span>
            ${subSpentOn(ref.id, sub.id) >= 1 || +sub.minutes ? `<span class="mono faint">${
              esc(fmtSpent(subSpentOn(ref.id, sub.id), +sub.minutes || 0) || fmtEst(sub.minutes))}</span>` : ''}
          </div>` : ''}
          ${rec ? `<div class="fp-rec mono">${fmtHM(rec.minutes)} over ${rec.sessions} sitting${rec.sessions === 1 ? '' : 's'}${rec.breaks ? ` · ${rec.breaks} break${rec.breaks === 1 ? '' : 's'}` : ''} · started ${clockOf(rec.startedAt)}</div>` : ''}
          <!-- The steps and the links are the reason the task was parked here:
               they are what you are about to work from. Hiding them behind the
               task's own page meant leaving the timer to read them. -->
          ${subsOpen(ref.id, t) ? subBlockHTML(ref.id, t) : ''}
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
      ${typeof focusLogHTML === 'function' ? focusLogHTML() : ''}
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
  /* Crossing it off here is the same act as crossing it off in the list: the
     shared setter runs, so the sitting ends and the cheer goes up. The cheer
     makes its own noise, so we stay quiet when it fired. */
  const fpd = box.querySelector('[data-fpdone]');
  if(fpd) fpd.onclick = () => {
    const id = fpd.dataset.fpdone;
    const r = typeof findTaskRef === 'function' ? findTaskRef(id) : null; if(!r) return;
    const was = r.done;
    setTaskDone(id, !was);
    if(was || !taskWasTimed(id)) sound(was ? 'click' : 'success');
    go(); };
  const fps = box.querySelector('[data-fpsubdone]');
  if(fps) fps.onclick = () => {
    const [rid, sid] = fps.dataset.fpsubdone.split('|');
    const sb = typeof findSub === 'function' ? findSub(rid, sid) : null; if(!sb) return;
    const was = sb.isCompleted;
    const cheered = setSubDone(rid, sid, !was);
    if(!cheered) sound(was ? 'click' : 'success');
    go(); };
  if(typeof bindTaskTimers === 'function') bindTaskTimers(box);

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

/* ============================================================
   FINISHING THE THING YOU WERE SITTING WITH
   ------------------------------------------------------------
   Ticking off the task the clock is running on is the end of the sitting, and
   the app should not need telling. The session is written down with the time
   actually worked, the clock is emptied and ready for the next thing to be
   dragged in, and — because finishing something you sat down to finish is the
   whole point of the apparatus — the screen says so.
   ============================================================ */
const FINISH_LINES = [
  'Done. That is one thing that will not be on tomorrow’s list.',
  'Finished. The clock is yours again.',
  'That is it closed. Nothing owed on it.',
  'Sat down, did it, got up. That is the whole method.',
  'Off the list. The day is measurably shorter.',
  'One less thing between you and the evening.',
  'Complete. Give it a moment before the next one.',
  'That was the hard part. It is behind you.',
  'Struck out. The page is cleaner than it was.',
  'You started it and you finished it, which is rarer than it sounds.',
  'Done — and the time it took is written down, which is how you get better at guessing.',
  'That is the thing you were avoiding. It is over now.',
  'Closed. Stand up, look out of a window.',
  'Finished, and the record says how long it really took.',
];
/* A burst of colour from the middle of the timer, or from the middle of the
   screen if the timer is not on it. Not a long animation — a second and a
   half, and gone. */
function fireworks(x, y){
  if(reduced()) return;
  const cols = ['#d4a44c', '#b4462f', '#7f916a', '#8f7bb0', '#4b7d9c', '#e8c7a0'];
  const c = el('<div class="fw-burst" aria-hidden="true"></div>');
  for(let s = 0; s < 3; s++){
    const cx = x + (s ? (Math.random() - .5) * 220 : 0), cy = y + (s ? (Math.random() - .5) * 120 : 0);
    for(let i = 0; i < 22; i++){
      const a = (i / 22) * Math.PI * 2 + Math.random() * .3, d = 60 + Math.random() * 130;
      c.insertAdjacentHTML('beforeend', `<i style="left:${cx.toFixed(0)}px;top:${cy.toFixed(0)}px;
        --dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;
        animation-delay:${(s * .18 + Math.random() * .12).toFixed(2)}s;
        background:${cols[(i + s) % cols.length]}"></i>`);
    }
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 2200);
}
function celebrateFinish(minutes){
  const line = FINISH_LINES[Math.floor(Math.random() * FINISH_LINES.length)];
  const face = document.querySelector('#t-focus .fp-ring') || document.querySelector('.fp-ring');
  const r = face ? face.getBoundingClientRect() : null;
  fireworks(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top + r.height / 2 : innerHeight / 3);
  const note = el(`<div class="fw-note" role="status">
    <b>${esc(line)}</b>${minutes >= 1 ? `<span class="mono">${esc(fmtEst(minutes))} on it</span>` : ''}</div>`);
  document.body.appendChild(note);
  setTimeout(() => { note.classList.add('go'); }, 2400);
  setTimeout(() => note.remove(), 3000);
  sound('success');
}
/* Called wherever a task is crossed off, from Today and from Planning alike.
   Returns whether it was the one being timed, so the caller can skip its own
   click sound rather than playing two at once. */
function taskCrossedOff(id, done){
  if(!done || !id || typeof FocusTimer === 'undefined') return false;
  const st = FocusTimer.state();
  if(st.idle || st.taskId !== id) return false;
  return endSittingWithACheer();
}
/* A step is a thing you sit down with in its own right, so finishing the step
   you are timing ends the sitting exactly as finishing the whole task does.
   Ticking some *other* step of the same task does not: you are still working. */
function subCrossedOff(taskId, subId, done){
  if(!done || !taskId || !subId || typeof FocusTimer === 'undefined') return false;
  const st = FocusTimer.state();
  if(st.idle || st.taskId !== taskId || st.subId !== subId) return false;
  return endSittingWithACheer();
}
/* The click handler needs to know whether the cheer already made a sound, but
   by the time it asks, the clock has been stopped — so it is asked before. */
let lastCheerAt = 0;
function taskWasTimed(){ return Date.now() - lastCheerAt < 500; }
function endSittingWithACheer(){
  lastCheerAt = Date.now();
  const minutes = Math.round((FocusTimer.state().elapsed || 0) / 60);
  FocusTimer.stop();          /* writes the sitting down, with the time worked */
  FocusTimer.setTask(null);   /* and leaves the clock empty for the next thing */
  celebrateFinish(minutes);
  return true;
}

/* ============================================================
   THE RECORD OF A SITTING
   ------------------------------------------------------------
   Two things are typed while a sitting is happening: what you are actually
   doing, and — every time you pause — what the break is for. Both were being
   written down and neither was ever shown back, which made them notes into a
   drawer. They are the interesting part of the record: how long is only
   half the question, and the other half is what the hour went on.
   ============================================================ */
const breakMinutes = br => { if(!br?.from || !br?.to) return 0;
  return Math.max(0, Math.round((new Date(br.to) - new Date(br.from)) / 60000)); };
const sessionBreakMinutes = s => sum((s.breaks || []).map(breakMinutes));
function focusLogOn(day){
  return (typeof focusSessions === 'function' ? focusSessions() : [])
    .filter(s => (s.startedAt || '').slice(0, 10) === day)
    .sort((a, b) => (a.startedAt || '').localeCompare(b.startedAt || ''));
}
/* every sitting there has ever been, newest first — the whole ledger */
function focusLogAll(){
  return (typeof focusSessions === 'function' ? focusSessions() : [])
    .slice().sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
}
const _lgClock = iso => { if(!iso) return ''; const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')}${ap}`; };
/* One sitting, with what it was for, what was done in it, and every break in
   it with the reason given at the time. */
function focusSessionHTML(s, {withDate = false} = {}){
  const t = s.taskId && typeof findTaskRef === 'function' ? findTaskRef(s.taskId) : null;
  const sub = s.subId && t?.task?.subtasks ? t.task.subtasks.find(x => x.id === s.subId) : null;
  const brs = (s.breaks || []).filter(b => b.to);
  const bm = sessionBreakMinutes(s);
  const name = sub ? sub.title : (t?.task?.text || t?.text || '');
  return `<div class="fl-row">
    <div class="fl-head">
      <span class="mono fl-when">${withDate ? esc(fmtDate((s.startedAt || '').slice(0, 10), 'short')) + ' · ' : ''}${esc(_lgClock(s.startedAt))}</span>
      <span class="mono fl-len">${esc(fmtEst(+s.duration || 0))}</span>
      ${s.mode === 'stopwatch' ? '<span class="mono faint">counted up</span>' : ''}
      ${s.completed === false ? '<span class="mono faint">ended early</span>' : ''}
      ${bm ? `<span class="mono fl-br">${brs.length} break${brs.length === 1 ? '' : 's'} · ${esc(fmtEst(bm))}</span>` : ''}
    </div>
    ${name ? `<div class="fl-task">${esc(name)}${sub ? ' <span class="mono faint">a step of ' + esc(t.task.text || '') + '</span>' : ''}</div>` : ''}
    ${s.note ? `<div class="fl-did">${esc(s.note)}</div>`
      : `<div class="fl-did none">nothing written down about this one</div>`}
    ${brs.length ? `<ul class="fl-breaks">${brs.map(br =>
      `<li><span class="mono">${esc(_lgClock(br.from))} · ${esc(fmtEst(breakMinutes(br)))}</span>
        <span>${br.note ? esc(br.note) : '<em class="faint">no reason given</em>'}</span></li>`).join('')}</ul>` : ''}
  </div>`;
}
/* the day's ledger, as it appears at the foot of the focus panel */
function focusLogHTML(day){
  const list = focusLogOn(day || today());
  if(!list.length) return '';
  const worked = sum(list.map(s => +s.duration || 0));
  const broke = sum(list.map(sessionBreakMinutes));
  const noted = list.filter(s => s.note).length;
  return `<details class="fl-wrap"${list.length <= 2 ? ' open' : ''}>
    <summary><span class="mono">what the sittings went on</span>
      <span class="mono faint">${list.length} sitting${list.length === 1 ? '' : 's'} · ${esc(fmtEst(worked))} worked${
        broke ? ` · ${esc(fmtEst(broke))} in breaks` : ''}${
        noted < list.length ? ` · ${list.length - noted} unwritten` : ''}</span></summary>
    <div class="fl-list">${list.map(s => focusSessionHTML(s)).join('')}</div>
  </details>`;
}
