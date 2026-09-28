/* ============================================================
   FOCUS SITTINGS, IN THE TIME TRACKER

   Every focus sitting is in the time tracker as sittings of its own, and the
   two say the same thing. The sitting's record (planState().focusSessions)
   is the one account: when it started, when it last ended, every pause, and
   every stretch marked in it. The tracker's entries for it are read off that
   record — one entry for each unbroken stretch of work: a pause ends one, a
   mark (Return, in the note on the sitting) ends one — and brought back into
   line every time the record is written, which is every minute the sitting
   runs, at every pause and mark, and when it ends. So the minutes in one
   place are the minutes in the other.

   While the sitting runs, the part under way is the tracker's live clock —
   the one on the pill — started at the moment that part began, and closed by
   the record when the part ends.

   A focus sitting is always counted: it is started by hand, so it is not one
   of the rooms that "walking into a room starts it" is about. Starting one
   while another clock runs stops that clock first — there is one clock, and
   it can only be on one thing.

   Your own word wins. An entry you correct in the tracker is left as you
   left it; one you delete is not put back. Nothing is written for a part
   shorter than half a minute: a pause and a resume a moment apart are not a
   sitting.

   Entries made this way carry `focusSit` (the sitting's start, which is the
   record's key) and `focusFrom` (where their part began). Older entries,
   made before this, have neither and are left alone.
   ============================================================ */

const FOCUS_PART_MIN = 30 * 1000;        /* ms: shorter than this is not a part */

/* The unbroken stretches of work in a record: its span, less its pauses, cut
   at every mark. Each carries the words and the task of the stretch it is
   in; a part after the last mark belongs to the record itself. */
function focusRecordParts(rec, openFrom){
  const a = Date.parse(rec && rec.startedAt), z = Date.parse(rec && (rec.endedAt || rec.startedAt));
  if(!(z > a)) return [];
  let ivs = [[a, z]];
  (rec.breaks || []).forEach(b => {
    const f = Date.parse(b.from), t = b.to ? Date.parse(b.to) : Infinity;
    if(!isFinite(f)) return;
    ivs = ivs.flatMap(([x, y]) => (t <= x || f >= y) ? [[x, y]]
      : [[x, Math.min(y, f)], [Math.max(x, t), y]].filter(([p, q]) => q > p));
  });
  const segs = rec.segments || [];
  const cuts = segs.map(s => Date.parse(s.to)).filter(isFinite).sort((m, n) => m - n);
  ivs = ivs.flatMap(([x, y]) => {
    const out = []; let p = x;
    cuts.filter(c => c > x && c < y).forEach(c => { out.push([p, c]); p = c; });
    out.push([p, y]);
    return out;
  });
  const open = openFrom ? Date.parse(openFrom) : NaN;
  return ivs.map(([x, y]) => {
    const seg = segs.find(s => Date.parse(s.from) <= x && x < Date.parse(s.to));
    return {from: new Date(x).toISOString(), to: new Date(y).toISOString(),
      text: seg ? (seg.text || '') : (rec.note || '').trim(),
      taskId: seg && seg.taskId !== undefined ? seg.taskId : (rec.taskId || null),
      open: x === open};
  });
}

/* the task's name and the category its time belongs to, as the tracker files it */
function focusEntryFields(taskId){
  const t = taskId && typeof taskById === 'function' ? taskById(taskId) : null;
  const name = t ? (t.title || t.text || '') : '';
  let cat = (t && t.timeCategory) || 'tasks';
  if(!timeAllCategories().some(c => c.id === cat)) cat = timeSettings().defaultCategory || null;
  return {what: name, categoryId: cat, linkedType: t ? 'task' : null, linkedId: t ? t.id : null, linkedLabel: name};
}

/* The tracker brought into line with one record. `openFrom` is where the part
   still running began, if the sitting is running: that part is the live
   clock's, and is left to it. */
function timeSyncFocus(rec, {openFrom = null} = {}){
  if(!rec || !rec.startedAt || (rec.type && rec.type !== 'focus')) return;
  timeState();
  const key = rec.startedAt;
  const parts = focusRecordParts(rec, openFrom)
    .filter(p => !p.open && Date.parse(p.to) - Date.parse(p.from) >= FOCUS_PART_MIN);
  const mine = S.timeEntries.filter(e => e.focusSit === key);
  const skip = new Set(planState().focusTimeSkip || []);
  const kept = new Set();
  parts.forEach(p => {
    if(skip.has(key + '|' + p.from)) return;
    let e = mine.find(x => x.focusFrom === p.from);
    if(e && e.edited){ kept.add(e.id); return; }
    const f = focusEntryFields(p.taskId);
    const want = {startTime: p.from, endTime: p.to, source: 'auto', feature: 'focus', focusSit: key, focusFrom: p.from,
      what: f.what || p.text || 'a sitting', linkedType: f.linkedType, linkedId: f.linkedId, linkedLabel: f.linkedLabel};
    if(!e){ e = timeEntryDefaults(Object.assign({id: uid(), categoryId: f.categoryId}, want)); S.timeEntries.push(e); }
    else Object.assign(e, want);
    /* the stretch's words, as the entry's note — one, kept current */
    e.notes = (e.notes || []).filter(n => !n.stretch);
    if(p.text) e.notes.push({at: p.to, text: p.text, stretch: true});
    kept.add(e.id);
    try { timeAfterSave(e); } catch(err){}
  });
  /* a finished entry for a part the record no longer has (a part that turned
     out shorter than half a minute, a mark taken back) goes — unless it is
     one you changed; the live clock is never touched here */
  mine.filter(e => e.endTime && !kept.has(e.id) && !e.edited)
    .forEach(e => { const i = S.timeEntries.indexOf(e); if(i >= 0) S.timeEntries.splice(i, 1); });
  saveNow();
  if(typeof paintTimeDock === 'function') paintTimeDock();
}

/* ---------- the live clock ----------
   Following the focus timer: while a sitting runs there is exactly one
   running entry, for the part under way, started when that part began. */
let _focusLiveSig = null;
function timeFollowFocus(){
  let s = null;
  try { s = FocusTimer.state(); } catch(e){ return; }
  const on = !!(s && s.running && s.phase === 'focus');
  const part = on ? FocusTimer.partStart() : null;
  const sig = on ? `${s.startedAt}|${s.taskId || ''}|${part}` : null;
  if(sig === _focusLiveSig) return;
  _focusLiveSig = sig;
  const run = timeRunning();
  const ours = run && run.feature === 'focus' && run.source === 'auto';
  if(!on){
    /* the record closes the part when it is written; a live clock the record
       has not reached (a sitting under half a minute) is simply let go */
    if(ours && run.focusSit){
      const rec = (planState().focusSessions || []).find(r => r.startedAt === run.focusSit);
      if(rec) timeSyncFocus(rec, {});
      if(timeRunning() === run){ const i = S.timeEntries.indexOf(run); if(i >= 0) S.timeEntries.splice(i, 1); saveNow(); }
    } else if(ours){ timeAutoStop('focus'); }
    if(typeof paintTimeDock === 'function') paintTimeDock();
    return;
  }
  /* already the right clock — after a reload, say */
  if(ours && run.focusSit === s.startedAt && run.focusFrom === part) return;
  if(run){
    if(ours && run.focusSit){
      /* the part before this one: the record will close it; until then it
         ends where this one starts */
      run.endTime = part; try { timeAfterSave(run); } catch(e){}
    } else {
      const was = run.what || run.linkedLabel || 'the other clock';
      stopTimer();
      if(run.source === 'timer') toast(esc(`The clock on “${was}” was stopped — this focus sitting is counted from here.`), 5000);
    }
  }
  const f = focusEntryFields(s.taskId);
  startTimer({source: 'auto', feature: 'focus', startTime: part, focusSit: s.startedAt, focusFrom: part,
    what: f.what || 'a sitting', categoryId: f.categoryId, linkedType: f.linkedType, linkedId: f.linkedId, linkedLabel: f.linkedLabel});
  if(typeof paintTimeDock === 'function') paintTimeDock();
}

/* On the way in: a focus clock left running by a page that went away, when
   the sitting it belonged to is not running now, is closed by its record —
   at the last moment the record knew about, not at now. */
function timeRepairFocus(){
  const run = timeRunning();
  if(!run || run.feature !== 'focus' || run.source !== 'auto') return;
  const s = FocusTimer.state();
  if(s.running && s.phase === 'focus' && run.focusSit === s.startedAt) return;
  const recs = planState().focusSessions || [];
  const rec = run.focusSit ? recs.find(r => r.startedAt === run.focusSit)
    : recs.filter(r => r.endedAt && r.endedAt >= run.startTime).sort((x, y) => (x.endedAt < y.endedAt ? 1 : -1))[0];
  if(rec && run.focusSit){ timeSyncFocus(rec, {}); }
  if(timeRunning() === run){
    /* no record reached it: it ends where its sitting was last written, or,
       with nothing to go on, where it began (and so is not a sitting) */
    const end = rec && rec.endedAt > run.startTime ? rec.endedAt : run.startTime;
    stopTimer(end);
  }
  if(typeof paintTimeDock === 'function') paintTimeDock();
}

/* How far the two accounts of a day agree: focus minutes on the record, and
   focus minutes in the tracker. Used by the tests, and cheap to ask. */
function focusTimeAgreement(day = today()){
  const recs = (planState().focusSessions || []).filter(r => r.type === 'focus' && (r.startedAt || '').slice(0, 10) === day);
  const worked = recs.reduce((a, r) => a + focusRecordParts(r).reduce((b, p) => b + (Date.parse(p.to) - Date.parse(p.from)) / 60000, 0), 0);
  const tracked = (S.timeEntries || []).filter(e => e.feature === 'focus' && e.focusSit && timeDayOf(e.startTime) === day)
    .reduce((a, e) => a + timeMinutes(e), 0);
  return {worked: Math.round(worked * 10) / 10, tracked: Math.round(tracked * 10) / 10};
}
