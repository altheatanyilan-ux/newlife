/* ============================================================
   THE FOCUS GADGET

   The timer began in Planning, as somewhere you went. Going somewhere is the
   wrong shape for a timer: the whole point of it is that it runs while you
   are looking at the thing you are doing. So it moved onto Today, beside the
   list — and Today is still somewhere you go. The moment the work was in the
   Writing Studio or a project's page, the clock was on another screen again,
   and a clock you cannot see is a clock you forget to stop.

   So it is not on a page at all any more. It floats above every room, it
   follows you between them, and when it is in the way it folds down to a
   circle in the bottom-left corner that still says how long you have been at
   it. It lives outside #main, which is rebuilt on nearly every edit, so a
   redraw cannot take it away, cannot stop the clock, and cannot eat a
   half-typed note.

   What it holds is only what a sitting actually is:

     the clock          how long you have been at it
     the task           what the sitting is on
     what you are doing written while you are doing it
     what the break is  written while the break is happening

   Everything else the old panel carried — the mode chooser, the length
   presets, the estimate, the checkbox, the steps, the description, the record
   of past sittings and the log of today's — was reference material, and
   reference material belongs on a page, where there is room for it, not in a
   gadget that has to stay small enough to leave the work visible. None of it
   is lost: the sittings are still written down, and the task's own page still
   reads them back.
   ============================================================ */

/* It stands in the foot of the sidebar, which is empty, and takes its shape
   from it: the sidebar open, the clock is the clock; the sidebar narrowed to
   its icons, the clock is one more icon-sized thing — a circle that still says
   how many minutes you are in. That is one switch for both rather than two
   that can disagree, and it means the clock is never over the page's words.

   Where there is no sidebar at all — a phone, where it becomes a bar along the
   bottom — it is the circle, floating clear of that bar. */
function focusDockInSidebar(){ return innerWidth > 900; }
/* With nothing in it, it is a dial and nothing else, whatever the sidebar is
   doing. An open sidebar used to mean an open clock, so a panel with two idle
   buttons on it sat in the corner of every page all day saying "nothing
   parked" — which is a lot of furniture for a fact nobody asked for.

   It opens for a sitting, for a task parked on it, and for a press. A task
   parked is the clock in use even before the sitting starts: it is holding
   something you put there deliberately, and the name on it — which is the way
   back to the task — is most of what the panel is for. Finishing a sitting
   empties the clock of both, so it folds itself.

   A press is a peek: it lasts until you fold it away or until the sitting it
   was opened over ends, at which point it is a dial again by itself. */
function focusDockIdle(){
  if(typeof FocusTimer === 'undefined') return true;
  const s = FocusTimer.state();
  return s.idle && !s.taskId;
}
function focusDockShut(){
  if(!focusDockInSidebar()) return true;
  if(document.documentElement.classList.contains('sb-collapsed')) return true;
  return focusDockIdle() && !S._fdPeek;
}
/* A peek ends when the sitting it was opened over ends — and a sitting can end
   three ways: the button on the gadget, a countdown reaching zero, or the task
   being finished from its own page. So the peek is cleared where the state is
   read rather than in the one handler, which covered one of the three and left
   the panel standing open for the other two. */
let _dockWasBusy = false;
function focusDockPeekCheck(s){
  const busy = !s.idle;
  if(_dockWasBusy && !busy) S._fdPeek = false;
  _dockWasBusy = busy;
}
/* Opening the clock is opening the sidebar it lives in, and asking to see it
   even when there is nothing in it. */
function setFocusDockShut(shut){
  S._fdPeek = !shut;
  if(!focusDockInSidebar()){ paintFocusDock(true); return; }
  if(typeof setSidebarCollapsed === 'function') setSidebarCollapsed(!!shut);
  else document.documentElement.classList.toggle('sb-collapsed', !!shut);
  paintFocusDock(true);
}

/* ---------- what it says ---------- */

/* the circle: a ring that fills as the sitting goes on, the minutes in the
   middle, and nothing else. Idle it is a dial, so that it reads as a clock
   rather than as an unexplained dot. */
function focusDockBubbleHTML(s){
  const up = s.mode === 'stopwatch' && s.phase === 'focus';
  const secs = Math.max(0, (up ? s.elapsed : s.left) | 0);
  const R = 21, C = 2 * Math.PI * R;
  const c = planState().timer;
  const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  const frac = up ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);
  const col = s.phase === 'focus' ? 'var(--terra)' : 'var(--sage)';
  return `<button class="fd-bubble${s.running ? ' ticking' : ''}${s.onBreak ? ' resting' : ''}"
      id="fdOpen" data-focusdrop title="${s.idle ? 'the clock' : 'the sitting under way'}"
      aria-label="${s.idle ? 'Open the clock' : 'Open the sitting under way'}">
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="${R}" class="ft-track"/>
      ${s.idle ? '' : `<circle cx="24" cy="24" r="${R}" class="ft-arc"
        style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/>`}
    </svg>
    <span class="fd-bmark mono">${s.idle ? '◷' : fmtDockShort(secs)}</span>
  </button>`;
}
/* 48:12 does not fit in a circle and is not what you want from a glance
   anyway: minutes while there are fewer than a hundred of them, hours after. */
function fmtDockShort(secs){
  const m = Math.floor(secs / 60);
  return m < 100 ? String(m) : `${Math.floor(m / 60)}h`;
}

function focusDockHTML(){
  const s = FocusTimer.state();
  if(focusDockShut()) return focusDockBubbleHTML(s);

  const c = planState().timer;
  const stop = s.mode === 'stopwatch' && s.phase === 'focus';
  const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  const frac = stop ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);
  const face = stop ? s.elapsed : s.left;
  const col = s.phase === 'focus' ? 'var(--terra)' : 'var(--sage)';
  const ref = s.taskId && typeof findTaskRef === 'function' ? findTaskRef(s.taskId) : null;

  /* The dial, and the two buttons that start and end a sitting. Nothing else:
     what the sitting is on, what you are doing in it, what the break was for
     and what the day has already held are all words, and words want a column
     of a page rather than the width of a sidebar. They are on Today, in the
     Focus section, which is where you were reading them anyway.

     It is here whether or not anything is running. A clock that appears only
     once you have started is a clock you have to remember exists. */
  return `<div class="fd-card${s.running ? ' running' : ''}${s.onBreak ? ' onbreak' : ''}"
      data-focusdrop>
    ${focusClockHTML(face, frac, col, s, stop)}
    <div class="fd-go">
      <button class="btn sm primary" id="fpGo">${s.running ? '⏸ pause' : s.idle ? '▶ start' : '▶ resume'}</button>
      ${s.idle ? `<button class="btn sm ghost" id="fpFold" title="back to the dial">fold away</button>`
               : `<button class="btn sm ghost" id="fpStop">finish</button>`}
    </div>
    <!-- one line, because the dial alone cannot say what it is counting -->
    <!-- The name goes to the task, not to the top of Today: a page this long
         with no clue where the thing you are timing sits is a link that only
         half arrives. With nothing parked there is nowhere to go, so it is not
         a link at all. -->
    <a class="fd-on" href="#/today"${ref ? ` data-fdjump="${esc(ref.id)}"` : ''}
       title="${ref ? 'go to this task on Today' : 'the sitting, in words, on Today'}">${
      ref ? `<span class="fd-onname">${esc(ref.text)}</span>`
          : `<span class="fd-onname faint">${s.idle ? 'nothing parked' : 'no task'}</span>`}</a>
  </div>`;
}

/* ---------- what it does ---------- */

/* Redrawing the gadget while somebody is typing into it would take the caret
   away mid-word, so the fields are left alone and only what they cannot know
   about is repainted. */
function focusDockTyping(){
  const a = document.activeElement;
  return !!(a && a.closest && a.closest('#focusDock') && /INPUT|TEXTAREA/.test(a.tagName));
}

/* What the gadget is made of, as opposed to what it reads. The clock
   subscribes to the timer, and the timer says something every second — so
   rebuilding on every word from it meant the card was thrown away and made
   again sixty times a minute, replaying its entrance animation each time. It
   is rebuilt only when one of these changes; the rest of the time the hands
   move and nothing else is touched. */
function focusDockSig(s){
  return [focusDockShut() ? 'shut' : 'open', s.idle ? 'idle' : s.running ? 'run' : 'held',
    s.onBreak ? 'break' : '', s.phase, s.taskId || '', s.subId || ''].join('|');
}
/* The words about the sitting are on Today, and Today is a rendered page
   rather than a subscriber — so when the shape of the sitting changes while
   that page is open, it is redrawn with the clock. */
let _dockPageSig = null;
function focusSectionFollow(sig){
  if(sig === _dockPageSig) return;
  const first = _dockPageSig === null;
  _dockPageSig = sig;
  if(first) return;
  if(typeof parseHash === 'function' && parseHash().name === 'today'
    && document.getElementById('t-focus') && !focusSectionTyping()) rerender();
}
/* never over a half-written note */
function focusSectionTyping(){
  const a = document.activeElement;
  return !!(a && a.closest && a.closest('#t-focus') && /INPUT|TEXTAREA/.test(a.tagName));
}
let _dockSig = null;

function paintFocusDock(force){
  const dock = document.getElementById('focusDock'); if(!dock) return;
  /* An incidental repaint — the timer ticking over, a break opening — waits
     while somebody is mid-word. A deliberate one, folding it away or opening
     it, does not: they asked for it, and the caret going with it is the point.  */
  const s = FocusTimer.state();
  focusDockPeekCheck(s);
  if(!force && focusDockTyping()){ focusDockFace(); return; }
  const sig = focusDockSig(s);
  if(!force && sig === _dockSig && dock.firstChild){ focusDockFace(); return; }
  _dockSig = sig;
  focusSectionFollow(sig);
  dock.dataset.shut = focusDockShut() ? '1' : '';
  dock.dataset.running = s.running ? '1' : '';
  dock.innerHTML = focusDockHTML();
  bindFocusDock(dock);
  focusDockMeasure();
}
/* How much of the foot the clock is standing on, so that the sidebar's own
   links stop above it rather than sliding under it — and, on a phone where it
   floats instead, so the toasts step around it.

   Measured now rather than on the next frame. The gadget's own contents have
   just been written, so the box is already right, and waiting for a frame
   meant that anything which stops frames arriving (a page in the background, a
   clock under test) left everything else standing where it used to be. */
function focusDockMeasure(){
  const dock = document.getElementById('focusDock'); if(!dock) return;
  const r = dock.getBoundingClientRect();
  const root = document.documentElement.style;
  root.setProperty('--dock-h', (r.height ? Math.round(r.height) + 14 : 0) + 'px');
}

function bindFocusDock(dock){
  const open = dock.querySelector('#fdOpen');
  if(open) open.onclick = () => { setFocusDockShut(false); sound('click'); };
  const fold = dock.querySelector('#fpFold');
  if(fold) fold.onclick = () => { S._fdPeek = false; sound('click'); paintFocusDock(true); };

  const go = dock.querySelector('#fpGo');
  if(go) go.onclick = () => {
    const s = FocusTimer.state();
    /* pausing is a moment you want the figure at: it is usually why you paused */
    if(s.running){ FocusTimer.pause(); focusSaySpent('Paused'); }
    else {
      /* Starting it here is starting a stopwatch: the gadget has no length to
         set and asking one of it would be a second question at the moment you
         have just decided to begin. A sitting started from a task's estimate
         still counts that estimate down — the estimate is the length, and it
         was given before the work began, which is when a length can honestly
         be chosen. */
      if(s.idle && typeof FocusTimer.setMode === 'function') FocusTimer.setMode('stopwatch');
      FocusTimer.start(undefined, s.phase);
    }
    sound('click'); paintFocusDock();
  };
  const stop = dock.querySelector('#fpStop');
  if(stop) stop.onclick = () => {
    /* ask whose sitting this is before stopping it — stop() clears the task */
    const on = FocusTimer.state().taskId;
    FocusTimer.stop(); focusSaySpent('Finished', on); sound('click');
    /* the sitting is over, so the panel it was open for goes with it —
       focusDockPeekCheck does the folding, here and wherever else it ends */
    paintFocusDock(true);
  };

  /* the name goes to the row, wherever on Today it has ended up */
  const jump = dock.querySelector('[data-fdjump]');
  if(jump) jump.onclick = ev => {
    ev.preventDefault();
    S._todayJump = jump.dataset.fdjump;
    /* the tasks live on the execution half */
    if(typeof setTodayView === 'function') setTodayView('do');
    if(parseHash().name === 'today') rerender(); else navigate('#/today');
  };

  /* Open or folded, the clock takes a task by being dragged on: folding it
     away must not put the drop target out of reach, so the circle is one too,
     and a task dropped on the circle opens it. */
  const drop = dock.querySelector('[data-focusdrop]');
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
      focusTakeTask(id);
      if(focusDockShut()) setFocusDockShut(false); else paintFocusDock();
      /* the words about it live on Today, so redraw that too if it is open */
      if(typeof parseHash === 'function' && parseHash().name === 'today') rerender();
    });
  }
}

/* ---------- a task dropped on the clock ----------
   Dropping used to park the task and leave the dial exactly as it was, which
   for a task with no estimate meant a twenty-five minute countdown nobody had
   asked for — and a countdown is a claim about how long the thing takes.
   Where there is an estimate, sit down with what is left of it. Where there is
   none, the honest instrument is a stopwatch: it counts up and tells you
   afterwards how long the thing actually took, which is how you come to have
   an estimate next time. */
function focusTakeTask(id){
  const ref = typeof findTaskRef === 'function' ? findTaskRef(id) : null;
  const est = ref && typeof taskEstOf === 'function' ? taskEstOf(ref.task) : 0;
  const left = typeof focusLeftOn === 'function' ? focusLeftOn(id, est) : 0;
  if(FocusTimer.state().running) FocusTimer.stop();
  FocusTimer.reset();
  if(left >= 1){ FocusTimer.setMode('countdown'); FocusTimer.setLength(left); }
  else FocusTimer.setMode('stopwatch');
  FocusTimer.setTask(id);
  FocusTimer.start();
  sound('success');
  const name = ref ? ref.text : 'it';
  toast(left >= 1
    ? `${fmtEst(left)} left on ${name}.`
    : est ? `${fmtEst(est)} was the estimate and it is spent — this one counts up.`
          : `Counting up on ${name}. Pause or finish to see how long it took.`);
}
/* What to say when a sitting stops: how long this one was, and how long the
   task has had in total — the figure you came for when you pressed pause.
   The id is passed in because finishing empties the clock: stopping writes
   the minutes down and then forgets whose they were, so the caller has to
   have asked before it stopped. */
function focusSaySpent(verb, taskId){
  const id = taskId || FocusTimer.state().taskId; if(!id) return;
  const ref = typeof findTaskRef === 'function' ? findTaskRef(id) : null;
  const total = typeof taskSpentOn === 'function' ? taskSpentOn(id) : 0;
  const est = ref && typeof taskEstOf === 'function' ? taskEstOf(ref.task) : 0;
  if(total < 1) return;
  const name = ref ? ref.text : 'this';
  toast(`${verb} — ${fmtEst(total)} on ${name} so far${est ? `, of ${fmtEst(est)} estimated` : ''}.`);
}

/* The face moves every second; the rest of the gadget does not change every
   second, so only the face is touched. This is also what runs while somebody
   is typing a note, which is why it never writes to an input. */
function focusDockFace(){
  const dock = document.getElementById('focusDock'); if(!dock) return;
  const s = FocusTimer.state();
  const up = s.mode === 'stopwatch' && s.phase === 'focus';
  const secs = Math.max(0, (up ? s.elapsed : s.left) | 0);
  const c = planState().timer;
  const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  const frac = up ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);

  const mark = dock.querySelector('.fd-bmark');
  if(mark && !s.idle) mark.textContent = fmtDockShort(secs);
  const tEl = dock.querySelector('.fp-time');
  if(tEl) tEl.textContent = fmtClock(secs);
  dock.querySelectorAll('.ft-arc').forEach(arc => {
    const r = +arc.getAttribute('r') || FP_R, C = 2 * Math.PI * r;
    arc.style.strokeDashoffset = (C * (1 - frac)).toFixed(1);
  });
  const hh = dock.querySelector('.fc-hour'), mh = dock.querySelector('.fc-min'), sh = dock.querySelector('.fc-sec');
  if(hh) hh.style.transform = `rotate(${((secs % 43200) / 43200 * 360).toFixed(2)}deg)`;
  if(mh) mh.style.transform = `rotate(${((secs % 3600) / 3600 * 360).toFixed(2)}deg)`;
  if(sh) sh.style.transform = `rotate(${((secs % 60) * 6).toFixed(2)}deg)`;
  dock.querySelectorAll('.fp-ring, .fd-bubble').forEach(n => {
    n.classList.toggle('ticking', !!s.running);
    n.classList.toggle('resting', !!s.onBreak);
  });
}

/* Built once, at boot, and never again. Everything after that is a repaint of
   its inside, so the element the timer lives in outlives every navigation. */
function mountFocusDock(){
  if(document.getElementById('focusDock')) return;
  const dock = el('<div id="focusDock" class="fdock" aria-live="polite"></div>');
  document.body.appendChild(dock);
  paintFocusDock();
  /* the timer tells it when something has happened; the interval only moves
     the hands, which nothing else knows about */
  FocusTimer.subscribe(() => paintFocusDock());
  setInterval(focusDockFace, 1000);
  /* the sidebar is there above 900px and gone below it, and the clock is a
     different thing in each case */
  addEventListener('resize', debounce(() => paintFocusDock(true), 200));
}
