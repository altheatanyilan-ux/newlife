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
  const tail = rec.cur || {};
  const work = ivs.map(([x, y]) => {
    const seg = segs.find(s => Date.parse(s.from) <= x && x < Date.parse(s.to));
    /* a stretch's own kind, category and reading; the part after the last
       mark is the stretch still under way, whose are kept on the record */
    const at = seg || tail;
    return {from: new Date(x).toISOString(), to: new Date(y).toISOString(),
      text: seg ? (seg.text || '') : (rec.note || '').trim(),
      taskId: seg && seg.taskId !== undefined ? seg.taskId : (rec.taskId || null),
      kind: at.kind || 'work', categoryId: at.categoryId || null, chipId: at.chipId || null, origin: at.origin || 'manual',
      verdict: at.verdict || null, verdictAt: at.verdictAt || null, stretchId: seg ? seg.id : null,
      open: x === open};
  });
  /* the breaks are stretches too: each its own part, with what it was, the
     category it was given and the reading on it */
  const brks = (rec.breaks || []).filter(b => b.to && Date.parse(b.to) > Date.parse(b.from)).map(b => ({
    from: new Date(Date.parse(b.from)).toISOString(), to: new Date(Date.parse(b.to)).toISOString(),
    text: b.note || '', taskId: null, kind: 'break', categoryId: b.categoryId || null, chipId: b.chipId || null,
    origin: b.origin || 'pause', verdict: b.verdict || null, verdictAt: b.verdictAt || null, stretchId: b.id || null,
    overrun: !!b.overrun, overrunReason: b.overrunReason || '', overrunState: b.overrunState || '', rest: b.rest || null, open: false}));
  return work.concat(brks).sort((p, q) => Date.parse(p.from) - Date.parse(q.from));
}

/* the task's name and the category its time belongs to, as the tracker files it */
function focusEntryFields(taskId, meta){
  /* a sitting that is not a task — the pill's clock, a room's — says in its own
     words what it was, and what category and link it carries */
  if(!taskId && meta){
    let cat = meta.categoryId || null;
    if(cat && !timeAllCategories().some(c => c.id === cat)) cat = timeSettings().defaultCategory || null;
    return {what: meta.what || '', categoryId: cat || timeSettings().defaultCategory || null,
      linkedType: meta.linkedType || null, linkedId: meta.linkedId || null, linkedLabel: meta.linkedLabel || '', habitId: meta.habitId || null};
  }
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
  if(!rec || !rec.startedAt || (rec.type && rec.type !== 'focus' && rec.type !== 'clock')) return;
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
    /* Your word wins: an entry you corrected is left as you left it. That
       includes the start of the clock still running, which you may have set
       back ("I actually began at ten") — it keeps the start you gave and
       takes its end from the part. */
    if(e && (e.edited || e.startTime !== e.focusFrom)){ if(!e.endTime) e.endTime = p.to; if(p.verdict && !e.verdict){ e.verdict = p.verdict; e.verdictAt = p.verdictAt || null; } kept.add(e.id); try { timeAfterSave(e); } catch(err){} return; }
    const meta = rec.meta || null;
    const brk = p.kind === 'break';
    const f = brk ? {what: '', categoryId: p.categoryId || 'rest', linkedType: null, linkedId: null, linkedLabel: ''} : focusEntryFields(p.taskId, meta);
    if(brk && !timeAllCategories().some(c => c.id === f.categoryId)) f.categoryId = timeSettings().defaultCategory || null;
    const chip = brk && p.chipId ? timeBreakChips().find(c => c.id === p.chipId) : null;
    const want = {startTime: p.from, endTime: p.to, source: meta ? (meta.source || 'timer') : 'auto', feature: meta ? (meta.feature || 'clock') : 'focus',
      focusSit: key, focusFrom: p.from,
      what: brk ? (p.text || (chip && chip.label) || 'a break') : (f.what || p.text || (meta ? '' : 'a sitting')),
      linkedType: f.linkedType, linkedId: f.linkedId, linkedLabel: f.linkedLabel, habitId: f.habitId || null,
      kind: p.kind || 'work', chipId: p.chipId || null, origin: p.origin || 'manual', stretchId: p.stretchId || null,
      overrun: !!p.overrun, overrunReason: p.overrunReason || ''};
    /* a reading, once said, is kept as said; the record is where it is said */
    if(p.verdict && !(e && e.verdict)){ want.verdict = p.verdict; want.verdictAt = p.verdictAt || null; }
    if(!e){ e = timeEntryDefaults(Object.assign({id: uid(), categoryId: f.categoryId, tags: meta && meta.tags ? meta.tags.slice() : []}, want)); S.timeEntries.push(e); }
    else { if(brk) want.categoryId = f.categoryId; Object.assign(e, want); }
    /* the stretch's words, as the entry's note — one, kept current (a break's
       words are its name already) */
    e.notes = (e.notes || []).filter(n => !n.stretch);
    if(p.text && !brk) e.notes.push({at: p.to, text: p.text, stretch: true});
    if(p.overrunReason) e.notes.push({at: p.to, text: p.overrunReason, stretch: true});
    if(p.overrunState && typeof habStateName === 'function') e.notes.push({at: p.to, text: `in a state of ${habStateName(p.overrunState)}`, stretch: true});
    kept.add(e.id);
    if(!brk) try { timeAfterSave(e); } catch(err){}
  });
  /* a finished entry for a part the record no longer has (a part that turned
     out shorter than half a minute, a mark taken back) goes — unless it is
     one you changed; the live clock is never touched here */
  const gone = mine.filter(e => e.endTime && !kept.has(e.id) && !e.edited);
  gone.forEach(e => { const i = S.timeEntries.indexOf(e); if(i >= 0) S.timeEntries.splice(i, 1); });
  gone.forEach(e => { try { habClockSettleFor(e); } catch(err){} });
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
  /* the live row is a mirror of a sitting's running part: it carries the
     sitting's key (`focusSit`). Any other running row is an older clock that
     no sitting stands behind, and is none of this function's business. */
  const ours = !!(run && run.focusSit);
  if(!on){
    /* the record closes the part when it is written; a live clock the record
       has not reached (a sitting under half a minute) is simply let go */
    if(ours){
      const rec = (planState().focusSessions || []).find(r => r.startedAt === run.focusSit);
      if(rec) timeSyncFocus(rec, {});
      if(timeRunning() === run){
        /* a clock whose start you set back is still a sitting, even when the
           sitting's own record never reached a minute */
        if(run.startTime !== run.focusFrom || run.edited){
          run.endTime = new Date().toISOString();
          if(timeMinutes(run) >= TIME_TOO_SHORT){ try { timeAfterSave(run); } catch(e){} saveNow(); }
          else { const i = S.timeEntries.indexOf(run); if(i >= 0) S.timeEntries.splice(i, 1); saveNow(); }
        } else { const i = S.timeEntries.indexOf(run); if(i >= 0) S.timeEntries.splice(i, 1); saveNow(); }
      }
    }
    if(typeof paintTimeDock === 'function') paintTimeDock();
    return;
  }
  /* already the right clock — after a reload, say */
  if(ours && run.focusSit === s.startedAt && run.focusFrom === part) return;
  if(run){
    if(ours){
      /* the part before this one: the record will close it; until then it
         ends where this one starts */
      run.endTime = part; try { timeAfterSave(run); } catch(e){}
    } else {
      const was = run.what || run.linkedLabel || 'the other clock';
      stopTimer();
      if(run.source === 'timer') toast(esc(`The clock on \u201c${was}\u201d was stopped \u2014 this sitting is counted from here.`), 5000);
    }
  }
  const meta = s.meta || null;
  const f = focusEntryFields(s.taskId, meta);
  timeOpenLiveRow({source: meta ? (meta.source || 'timer') : 'auto', feature: meta ? (meta.feature || 'clock') : 'focus',
    startTime: part, focusSit: s.startedAt, focusFrom: part, tags: meta && meta.tags ? meta.tags.slice() : [],
    what: f.what || (meta ? '' : 'a sitting'), categoryId: f.categoryId, linkedType: f.linkedType, linkedId: f.linkedId, linkedLabel: f.linkedLabel,
    habitId: f.habitId || null});
  if(typeof paintTimeDock === 'function') paintTimeDock();
}

/* On the way in: a focus clock left running by a page that went away, when
   the sitting it belonged to is not running now, is closed by its record —
   at the last moment the record knew about, not at now. */
function timeRepairFocus(){
  const run = timeRunning();
  if(!run || !run.focusSit) return;
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
  const recs = (planState().focusSessions || []).filter(r => r.type === 'focus' && timeLivingDay(r.startedAt) === day);
  const worked = recs.reduce((a, r) => a + focusRecordParts(r).filter(p => p.kind !== 'break').reduce((b, p) => b + (Date.parse(p.to) - Date.parse(p.from)) / 60000, 0), 0);
  const tracked = (S.timeEntries || []).filter(e => e.feature === 'focus' && e.focusSit && e.kind !== 'break' && timeLivingDay(e.startTime) === day)
    .reduce((a, e) => a + timeMinutes(e), 0);
  return {worked: Math.round(worked * 10) / 10, tracked: Math.round(tracked * 10) / 10};
}

/* A sitting that was left running and closed at six hours on the way in says
   so, on the last entry it wrote — the same words the older clock used. */
function timeNoteRunaway(key){
  const mine = (S.timeEntries || []).filter(e => e.focusSit === key && e.endTime)
    .sort((a, b) => Date.parse(a.endTime) - Date.parse(b.endTime));
  const last = mine[mine.length - 1]; if(!last) return null;
  last.notes = last.notes || [];
  last.notes.push({at: new Date().toISOString(), text: `Left running \u2014 closed at ${fmtHM(TIME_RUNAWAY)}. Correct it if that is wrong.`});
  saveNow();
  return last;
}

/* A reading on a stretch that is already over — from the day's list, after
   the sitting has ended. Said once and kept as said; it goes onto the entry
   and, when the entry is a part of a sitting, onto the record that made it,
   so the next time the record is read into the tracker it is still there. */
function timeSetVerdict(id, v){
  if(!TIME_VERDICTS.includes(v)) return false;
  const e = (S.timeEntries || []).find(x => x.id === id);
  if(!e || e.verdict) return false;
  e.verdict = v; e.verdictAt = new Date().toISOString();
  const rec = e.focusSit ? (planState().focusSessions || []).find(r => r.startedAt === e.focusSit) : null;
  if(rec){
    const own = (rec.segments || []).find(s => s.id === e.stretchId) || (rec.breaks || []).find(b => b.id === e.stretchId);
    const t = own || (e.kind !== 'break' && !e.stretchId ? rec.cur : null);
    if(t && !t.verdict){ t.verdict = v; t.verdictAt = e.verdictAt; }
  }
  saveNow();
  return true;
}
