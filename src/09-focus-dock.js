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
function focusDockShut(){
  return !focusDockInSidebar()
    || document.documentElement.classList.contains('sb-collapsed');
}
/* Opening the clock is opening the sidebar it lives in. */
function setFocusDockShut(shut){
  if(!focusDockInSidebar()){ paintFocusDock(true); return; }
  if(typeof setSidebarCollapsed === 'function') setSidebarCollapsed(!!shut);
  else { document.documentElement.classList.toggle('sb-collapsed', !!shut); paintFocusDock(true); }
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
  const ref = s.taskId && typeof findTaskRef === 'function' ? findTaskRef(s.taskId) : null;
  const name = ref ? ref.text : '';
  const t = ref ? ref.task : null;
  const sub = t && s.subId ? (Array.isArray(t.subtasks) ? t.subtasks : []).find(x => x.id === s.subId) : null;
  const stop = s.mode === 'stopwatch' && s.phase === 'focus';
  const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  const frac = stop ? (s.elapsed % 3600) / 3600 : (total ? 1 - s.left / total : 0);
  const face = stop ? s.elapsed : s.left;
  const col = s.phase === 'focus' ? 'var(--terra)' : 'var(--sage)';

  return `<div class="fd-card${s.running ? ' running' : ''}${s.onBreak ? ' onbreak' : ''}">
    <div class="fd-head">
      <span class="sc" style="margin:0">Focus</span>
    </div>

    <!-- the task: dragged in from any list, or cleared out again -->
    <div class="fd-drop" data-focusdrop>
      ${name ? `<div class="fd-on">
          <span class="k mono">on</span>
          <b class="serif">${esc(name)}</b>
          <button class="pl-mini" id="fdClear" title="take it out of the clock">×</button>
        </div>
        ${sub ? `<div class="fd-step mono">${esc(sub.title || '')}</div>` : ''}`
       : `<div class="fd-empty">Drag a task in, or just start the clock.</div>`}
    </div>

    ${focusClockHTML(face, frac, col, s, stop)}

    <div class="fd-go">
      <button class="btn sm primary" id="fpGo">${s.running ? '⏸ pause' : s.idle ? '▶ start' : '▶ resume'}</button>
      ${s.idle ? '' : `<button class="btn sm ghost" id="fpStop">finish</button>`}
    </div>

    <!-- Two notes, and they answer different questions. One is what the work
         actually was; the other is what the time that was not work went on.
         Both are written while they are happening, because neither is
         remembered accurately an hour later. -->
    ${s.idle ? '' : `<div class="fd-note">
      <label class="k mono" for="fpDid">what are you actually doing?</label>
      <input class="inp sm" id="fpDid" value="${esc(s.notes || '')}"
        placeholder="the second draft · the tricky bit of the proof" autocomplete="off">
    </div>`}
    ${s.onBreak ? `<div class="fd-note resting">
      <label class="k mono" for="fpBreakNote">what is this break for?</label>
      <input class="inp sm" id="fpBreakNote" value="${esc(s.breakNote || '')}"
        placeholder="tea · a walk · scrolling, honestly" autocomplete="off">
      <div class="faint" style="font-size:.7rem">Since ${clockOf(s.breakSince)}. Not counted as work.</div>
    </div>` : ''}
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
let _dockSig = null;

function paintFocusDock(force){
  const dock = document.getElementById('focusDock'); if(!dock) return;
  /* An incidental repaint — the timer ticking over, a break opening — waits
     while somebody is mid-word. A deliberate one, folding it away or opening
     it, does not: they asked for it, and the caret going with it is the point.  */
  if(!force && focusDockTyping()){ focusDockFace(); return; }
  const s = FocusTimer.state();
  const sig = focusDockSig(s);
  if(!force && sig === _dockSig && dock.firstChild){ focusDockFace(); return; }
  _dockSig = sig;
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

  const go = dock.querySelector('#fpGo');
  if(go) go.onclick = () => {
    const s = FocusTimer.state();
    if(s.running){ FocusTimer.pause(); }
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
  if(stop) stop.onclick = () => { FocusTimer.stop(); sound('click'); paintFocusDock(); };
  const clr = dock.querySelector('#fdClear');
  if(clr) clr.onclick = () => { FocusTimer.setTask(null); paintFocusDock(); };

  const did = dock.querySelector('#fpDid');
  if(did) did.oninput = debounce(function(){ FocusTimer.noteWork(this.value); }, 300);
  const note = dock.querySelector('#fpBreakNote');
  if(note) note.oninput = debounce(function(){ FocusTimer.noteBreak(this.value); }, 300);

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
      FocusTimer.setTask(id); sound('success');
      if(focusDockShut()) setFocusDockShut(false); else paintFocusDock();
    });
  }
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
