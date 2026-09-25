/* ============================================================
   FOCUS MODE — any page, full screen, and nothing else on the glass.

   Score Practice has had this for a while: "read" takes the sidebar, the top
   bar, the clock and the buttons away and gives the whole screen to the score.
   Every page can do it now, from the ⛶ at the top or with Z. The page stays
   the page; what goes is everything that is not it — the way to the other
   rooms (the sidebar, or the bar along the bottom of a phone), the top bar,
   Back, the + button, the clock in the corner and the time tracker's pill.
   The browser's own edges go too, where it allows that.

   On Planning, and on the execution half of Today, focus mode is for doing
   the plan rather than looking at it, so what fills the screen is a desk
   instead of the page: the stopwatch, today's tasks, and the Focus section
   where what each sitting and each break went on is written down while it
   is happening. "the whole page" in the corner swaps back to the page itself,
   still full screen.

   Esc, or the corner, brings everything back. So does the browser leaving
   full screen on its own, so the house is never half in and half out.
   ============================================================ */

const pageFocusOn = () => document.documentElement.classList.contains('page-focus');

/* the rooms where focus mode means getting the plan done */
function focusDeskPossible(name){
  name = name || (typeof parseHash === 'function' ? parseHash().name : '');
  if(!routes[name]) name = 'today';
  if(name === 'planning') return true;
  return name === 'today' && (S.settings && S.settings.todayView) !== 'in';
}
function focusDeskOn(name){
  return pageFocusOn() && !S._pfWhole && focusDeskPossible(name);
}

function setPageFocus(on){
  on = !!on;
  if(on === pageFocusOn()) return;
  document.documentElement.classList.toggle('page-focus', on);
  S._pfWhole = false;
  if(typeof closeSpeedDial === 'function') closeSpeedDial();
  if(on){ pfWatch(true); pfFullscreen(true); }
  else { pfWatch(false); pfFullscreen(false); }
  rerender();
  paintPfExit();
  /* the clock goes onto the desk, or back into its corner */
  if(typeof paintFocusDock === 'function') paintFocusDock(true);
  sound('click');
}

/* ---------- the browser's full screen ---------- */
function pfFullscreen(on){
  const el = document.documentElement;
  try {
    if(on){
      if(document.fullscreenElement || document.webkitFullscreenElement) return true;
      const go = el.requestFullscreen || el.webkitRequestFullscreen;
      if(!go) return false;
      const p = go.call(el, {navigationUI: 'hide'});
      /* refused (a phone, a frame): the page is stripped all the same, and the
         browser's own edges are the only thing left showing */
      if(p && p.catch) p.catch(() => {});
      return true;
    }
    if(!document.fullscreenElement && !document.webkitFullscreenElement) return false;
    const out = document.exitFullscreen || document.webkitExitFullscreen;
    if(!out) return false;
    const q = out.call(document);
    if(q && q.catch) q.catch(() => {});
    return true;
  } catch(e){ return false; }
}
/* Esc in full screen belongs to the browser: it leaves full screen without
   telling the page. So the change is watched, and focus mode follows it out. */
let _pfFs = null, _pfWasFs = false;
function pfWatch(on){
  if(_pfFs){ removeEventListener('fullscreenchange', _pfFs);
    removeEventListener('webkitfullscreenchange', _pfFs); _pfFs = null; }
  _pfWasFs = false;
  if(!on) return;
  _pfFs = () => {
    if(document.fullscreenElement || document.webkitFullscreenElement){ _pfWasFs = true; return; }
    if(_pfWasFs && pageFocusOn()) setPageFocus(false);
  };
  addEventListener('fullscreenchange', _pfFs);
  addEventListener('webkitfullscreenchange', _pfFs);
}

/* ---------- the way out, in the corner ----------
   It says how to leave and then gets out of the way; moving to the top of the
   screen brings it back. On a touch screen there is no pointer to move, so it
   stays, faintly. */
let _pfAway = null;
function paintPfExit(){
  let bar = document.getElementById('pfExit');
  if(!pageFocusOn()){ if(bar) bar.remove(); clearTimeout(_pfAway); return; }
  if(!bar){
    bar = el('<div class="pf-exit" id="pfExit" role="toolbar" aria-label="focus mode"></div>');
    document.body.appendChild(bar);
    bar.addEventListener('mouseleave', pfWake);
    bar.addEventListener('focusin', pfWake);
  }
  const can = focusDeskPossible(), desk = focusDeskOn();
  bar.innerHTML = `${can ? `<button class="pf-b" id="pfSwap" title="${desk
      ? 'this page itself, still full screen' : 'just the stopwatch, today’s tasks and the notes'}">${
      desk ? '▤ the whole page' : '◷ just the work'}</button>` : ''}
    <button class="pf-b pf-out" id="pfOut" title="leave focus mode (Esc)">⛶ leave focus mode <kbd>Esc</kbd></button>`;
  bar.querySelector('#pfOut').onclick = () => setPageFocus(false);
  const sw = bar.querySelector('#pfSwap');
  if(sw) sw.onclick = () => {
    S._pfWhole = !S._pfWhole;
    rerender(); paintPfExit();
    if(typeof paintFocusDock === 'function') paintFocusDock(true);
    sound('click'); };
  pfWake();
}
function pfWake(){
  const bar = document.getElementById('pfExit'); if(!bar) return;
  bar.classList.remove('away');
  clearTimeout(_pfAway);
  _pfAway = setTimeout(() => {
    if(!bar.isConnected || bar.matches(':hover') || bar.contains(document.activeElement)) return;
    bar.classList.add('away');
  }, 2600);
}
document.addEventListener('pointermove', e => {
  if(e.clientY < 72 && pageFocusOn()) pfWake();
}, {passive: true});

/* ---------- the desk ----------
   Three things and nothing else: the clock, the day's list, and the words
   about the sitting. Each is the same thing it is everywhere else — the clock
   is the sidebar's clock, the list is Today's list, the section is Today's
   Focus section — so a task ticked, dragged or timed here is ticked, dragged
   or timed everywhere. */
function renderFocusDesk(root){
  const T = today();
  const rows = tasksForDay(T);
  root.innerHTML = `<div class="page pf-desk">
    <header class="pf-head">
      <span class="pf-date">${esc(fmtDate(T))}</span>
      <span class="mono faint">focus mode</span>
    </header>
    <div class="pf-grid">
      <aside class="pf-clockcol" aria-label="the stopwatch"><div id="pfClock" class="pf-clock"></div></aside>

      <section class="section pf-tasks" id="t-tasks" aria-label="today's tasks">
        <div class="pf-sh"><span class="sc" style="margin:0">Today's tasks</span>
          <span class="mono">${esc(dayTasksSaid(rows))}</span></div>
        <div class="card no-tilt" data-daydrop="${T}">
          ${dayListFilterHTML(rows)}
          ${dayTaskListHTML(rows, T) || (rows.length
            ? `<div class="empty">Nothing in that list today. <button class="tbtn" data-tlist="all">show all ${rows.length}</button></div>`
            : `<div class="empty">Nothing on today yet. Write one below, or pull one in.</div>`)}
          <div class="row" style="margin-top:10px;gap:8px">${quickTaskInput(T, 'pfQuick')}
            <button class="btn sm ghost" id="pullTask">pull in ↓</button></div>
        </div>
      </section>

      <div class="pf-focuscol">${focusSectionHTML()}</div>
    </div>
  </div>`;
  const redraw = () => rerender();
  bindTaskRows(root, redraw); bindDayDrop(root, redraw); bindQuickTask(root, redraw); bindDayListFilter(root, redraw);
  const pull = root.querySelector('#pullTask');
  if(pull) pull.onclick = () => openTaskPicker(T, rerender);
  bindFocusSection(root, redraw);
  if(typeof paintFocusDock === 'function') paintFocusDock(true);
}
