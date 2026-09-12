/* ============================================================
   THE WRITING CLOCK — how long an entry actually took

   Writing an entry is not an instant. It begins when the form opens and
   ends when it is saved, and in between a person walks away, answers the
   door, comes back an hour later and finishes the sentence. The interesting
   number is the time actually spent, not the wall-clock span, so this
   counts only while the writing is really happening and stops the moment
   it is not.

   What stops the clock:
     · the tab going to the background, or the window losing focus
     · the modal being scrolled away from and nothing touched for a while
   What restarts it: any keystroke, click or scroll inside the form.

   The idle cut is deliberately generous. Thinking with your hands off the
   keyboard is writing; making tea is not. Two minutes is long enough to
   stare out of a window and short enough that lunch does not count.
   ============================================================ */
const WRITE_IDLE_MS = 120000;

function startWritingClock(scope){
  const st = {
    startedAt: new Date().toISOString(),
    on: today(),
    ms: 0,            /* accumulated, breaks excluded */
    since: Date.now(),/* when the current stretch began, null while paused */
    stopped: false
  };
  const pause = () => { if(st.stopped || st.since == null) return;
    st.ms += Date.now() - st.since; st.since = null; };
  const resume = () => { if(st.stopped || st.since != null) return; st.since = Date.now(); };
  /* the idle timer is reset by anything that looks like writing */
  let idle = null;
  const poke = () => { resume(); clearTimeout(idle); idle = setTimeout(pause, WRITE_IDLE_MS); };
  const onVis = () => document.hidden ? pause() : poke();

  ['keydown','pointerdown','input','scroll'].forEach(ev =>
    scope.addEventListener(ev, poke, {capture:true, passive:true}));
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('blur', pause);
  window.addEventListener('focus', poke);
  poke();

  st.elapsedMs = () => st.ms + (st.since == null ? 0 : Date.now() - st.since);
  st.stop = () => {
    if(st.stopped) return st;
    pause(); st.stopped = true; clearTimeout(idle);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('blur', pause);
    window.removeEventListener('focus', poke);
    ['keydown','pointerdown','input','scroll'].forEach(ev =>
      scope.removeEventListener(ev, poke, {capture:true}));
    return st;
  };
  return st;
}

/* Sessions are kept per day rather than as one running total, because an
   entry written last week and edited today spent time on two different days
   and the day that asks "how long did I write today" wants only its own. */
function recordWritingSession(e, st){
  if(!st) return;
  st.stop();
  const secs = Math.round(st.elapsedMs() / 1000);
  if(secs < 1) return;
  e.extra = e.extra || {};
  const w = e.extra.writing = e.extra.writing || {startedAt: st.startedAt, sessions: []};
  w.startedAt = w.startedAt || st.startedAt;
  w.sessions = Array.isArray(w.sessions) ? w.sessions : [];
  const same = w.sessions.find(s => s.on === st.on);
  if(same) same.seconds += secs; else w.sessions.push({on: st.on, seconds: secs});
}

/* every second spent writing on one day, across however many entries */
function writingSecondsOn(day = today()){
  return (S.entries || []).reduce((n, e) => n +
    ((e.extra?.writing?.sessions || []).find(s => s.on === day)?.seconds || 0), 0);
}
function writingEntriesOn(day = today()){
  return (S.entries || []).filter(e =>
    (e.extra?.writing?.sessions || []).some(s => s.on === day && s.seconds > 0));
}
/* "1h 12m", "12m", "40s" — never "0h 0m 40s" */
function fmtWriting(secs){
  if(!secs) return '';
  const h = Math.floor(secs / 3600), m = Math.round(secs % 3600 / 60);
  if(h && m) return `${h}h ${m}m`;
  if(h) return `${h}h`;
  if(m) return `${m}m`;
  return `${secs}s`;
}
