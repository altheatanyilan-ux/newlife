/* ============================================================
   THE PLANNING BOARD, LIVE — the day as it happens

   Today shows the day's hours as a strip, with a line for now. When a block's
   time comes, the next step on Today is the block: "Start: [task] (45m)" —
   which opens a sitting, with its card. When it ends, one question: did this
   happen? — answered with the same three readings a stretch gets, or "it did
   not". A block that runs long offers to push the rest or drop one. A block
   that did not happen is not lost: the work goes back to the day's tray, and
   its do-date is exactly what it was.

   Plan against what happened is the same drawing in the Time view and in the
   evening: the day's blocks in outline, the tracked stretches filled in,
   shaded by how each was read.
   ============================================================ */

const pbdNowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
function pbdTrackedOn(ref, from, to, d){
  /* entries on the day that are about this reference and overlap the block's window */
  if(!ref) return [];
  const a = d + 'T00:00:00';
  return (S.timeEntries || []).filter(e => e.endTime || e.startTime).filter(e => {
    const lt = e.linkedType === 'task' && e.linkedId === ref.id;
    const hb = ref.type === 'habit' && (e.habitId === ref.id || (e.focusSit && (S.habits || []).some(h => h.id === ref.id && typeof habClockMatches === 'function' && habClockMatches(h, e))));
    if(!(lt || hb)) return false;
    const s = new Date(e.startTime), m = s.getHours() * 60 + s.getMinutes();
    return timeLivingDay(e.startTime) === d && m >= from - 30 && m <= to + 90;
  });
}
function pbdSittingOn(ref){
  const s = FocusTimer.state();
  if(s.idle || !ref) return false;
  if(ref.type === 'habit') return !!(s.meta && s.meta.habitId === ref.id);
  return s.taskId === ref.id;
}
function pbdLiveItems(d){
  const now = pbdNowMin(), out = {start: null, ask: null, long: null};
  const blocks = pbdBlocksOn(d).filter(b => b.ref && !PBD_KINDS_ANCHOR.includes(b.kind));
  blocks.forEach(b => {
    const a = pbdMin(b.start), z = a + b.durationMin;
    if(b.happened != null) return;
    const done = b.ref.type !== 'habit' && (() => { const r = findTaskRef(b.ref.id); return r && r.done; })();
    if(now >= a - 2 && now < z && !pbdSittingOn(b.ref) && !done && !out.start) out.start = b;
    else if(now >= z && now < z + 120 && !out.ask) out.ask = b;
    if(now >= z && pbdSittingOn(b.ref) && !out.long) out.long = b;
  });
  return out;
}
function pbdLiveAct(kind, id){
  const b = S.timeBlocks.find(x => x.id === id); if(!b) return;
  const d = b.date;
  if(kind === 'start'){
    if(b.ref.type === 'habit'){ const h = byId(S.habits || [], b.ref.id); if(h) habStartMinimum(h); }
    else { const t = pbdTask(b.ref.id); const est = t ? (pbdEstOf(t) || b.durationMin - (b.marginMin || 0)) : 0; focusOnTask(b.ref.id, est); }
    return;
  }
  if(kind === 'push'){
    const at = pbdMin(b.start) + b.durationMin;
    pbdBlocksOn(d).filter(x => x !== b && pbdMin(x.start) >= at - 1 && !PBD_KINDS_ANCHOR.includes(x.kind)).forEach(x => pbdSetBlockTimes(x, Math.min(1439 - x.durationMin, pbdMin(x.start) + 15)));
    saveNow(); toast(esc('The rest of the day is fifteen minutes later.'), 4000); return;
  }
  if(kind === 'drop'){
    const at = pbdMin(b.start) + b.durationMin;
    const nx = pbdBlocksOn(d).filter(x => x !== b && pbdMin(x.start) >= at - 1 && !PBD_KINDS_ANCHOR.includes(x.kind))[0];
    if(nx){ const back = spliceOut(S.timeBlocks, x => x.id === nx.id); saveNow();
      toast(esc(`${pbdBlockLabel(nx)} is off the day (its work stays on today).`), 7000, {label: 'undo', fn: () => { back(); saveNow(); pbdLiveRepaint(); }}); }
    return;
  }
  if(kind === 'extend'){ pbdSetBlockTimes(b, pbdMin(b.start), b.durationMin + 15); saveNow(); return; }
  /* the answer to "did this happen?" */
  if(kind === 'missed'){
    b.happened = false; b.askedAt = new Date().toISOString();
    const back = spliceOut(S.timeBlocks, x => x.id === id); saveNow();
    toast(esc(`${pbdBlockLabel(b)} is back in the day's tray.`), 7000, {label: 'undo', fn: () => { back(); b.happened = null; saveNow(); pbdLiveRepaint(); }});
    return;
  }
  if(TIME_VERDICTS.includes(kind)){
    b.happened = true; b.verdict = b.verdict || kind; b.verdictAt = b.verdictAt || new Date().toISOString();
    const rows = pbdTrackedOn(b.ref, pbdMin(b.start), pbdMin(b.start) + b.durationMin, d).filter(e => !e.verdict && e.endTime);
    if(rows.length) try { timeSetVerdict(rows[rows.length - 1].id, kind); } catch(e){}
    saveNow(); return;
  }
}
function pbdLiveRepaint(){ if(typeof pqRepaint === 'function') pqRepaint(); }

/* ---------- the strip on Today ---------- */
function pbdTodayStripBars(d){
  const bd = pbdBounds(d), nowMin = pbdNowMin();
  const items = [];
  pbdBlocksOn(d).forEach(b => items.push({from: pbdMin(b.start), to: pbdMin(b.start) + b.durationMin, kind: b.kind, label: pbdBlockLabel(b), start: b.start}));
  (S.habits || []).forEach(h => {
    if(h.archived || h.negative || h.at == null || h.at === '') return; let due = false; try { due = habDue(h, d); } catch(e){}
    if(!due) return;
    /* a habit with a time of day that is also a block is not drawn twice */
    if(pbdBlocksOn(d).some(b => b.ref && b.ref.type === 'habit' && b.ref.id === h.id)) return;
    const len = (typeof habThreshold === 'function' && habThreshold(h)) || +h.durationTarget || 15;
    items.push({from: Math.round(+h.at * 60), to: Math.round(+h.at * 60) + len, kind: 'habit', label: h.name, start: pbdHM(+h.at * 60)});
  });
  return {bd, bars: items.filter(x => x.to > bd.wake && x.from < bd.bed).sort((a, b) => a.from - b.from).map(x => {
    const left = Math.max(0, (x.from - bd.wake) / bd.awake * 100), width = Math.max(0.5, (Math.min(x.to, bd.bed) - Math.max(x.from, bd.wake)) / bd.awake * 100);
    const cls = {task: 'tb-bar-task', break: 'tb-bar-break', meal: 'tb-bar-meal', commute: 'tb-bar-commute', habit: 'tb-bar-habit', label: 'tb-bar-lbl', protect: 'tb-bar-lbl'}[x.kind] || 'tb-bar-lbl';
    const cur = x.from <= nowMin && x.to > nowMin;
    return `<div class="tb-bar ${cls}${cur ? ' tb-bar-now' : ''}" data-s="${x.from}" data-e="${x.to}" style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%" title="${esc(x.label)} ${esc(x.start)}–${esc(pbdHM(x.to))}"><span class="tb-bar-label">${esc(x.label)}</span></div>`;
  }).join(''), nowPct: Math.min(100, Math.max(0, (nowMin - bd.wake) / bd.awake * 100))};
}
function pbdTodayHTML(d){
  const {bd, bars, nowPct} = pbdTodayStripBars(d);
  const cap = pbdCapacity(d);
  const strip = bars ? `<div class="tb-strip-bar" style="position:relative" data-wake="${bd.wake}" data-total="${bd.awake}">${bars}<div class="tb-now-line" style="left:${nowPct.toFixed(1)}%"></div></div>` : '';
  return `<div class="today-blocks-strip">
    ${strip}
    <div class="pbd-entry"><span class="mono faint">${esc(cap.text)}</span>
      <button class="tbtn" data-pbopen="day" title="the day from waking to bed, with its work">plan the hours</button>
      <button class="tbtn" data-pbopen="week" title="seven days, with their load">the week</button></div></div>`;
}
function pbdTodayBind(root, d){
  (root || document).querySelectorAll('[data-pbopen]').forEach(b => b.onclick = () => pbdOpen(d, {mode: b.dataset.pbopen}));
  const iv = setInterval(() => { if(!document.getElementById('pq')){ if(!document.contains(root)) clearInterval(iv); return; } pbdLiveRepaint(); }, 30000);
}

/* ---------- plan against what happened ---------- */
function pbdPlanVsActualHTML(d){
  const bd = pbdBounds(d), W = 100;
  const blocks = pbdBlocksOn(d).filter(b => !PBD_KINDS_ANCHOR.includes(b.kind) && b.ref);
  const rows = (typeof timeOnDay === 'function' ? timeOnDay(d) : []).filter(e => e.endTime);
  if(!blocks.length && !rows.length) return '';
  const pct = m => Math.min(100, Math.max(0, (m - bd.wake) / bd.awake * 100));
  const plan = blocks.map(b => { const a = pbdMin(b.start); return `<div class="pvb-b plan" style="left:${pct(a).toFixed(1)}%;width:${Math.max(.8, pct(a + b.durationMin) - pct(a)).toFixed(1)}%" title="planned: ${esc(pbdBlockLabel(b))} ${esc(b.start)}, ${pbdSay(b.durationMin)}"><span>${esc(pbdBlockLabel(b))}</span></div>`; }).join('');
  const did = rows.map(e => { const s = new Date(e.startTime), a = s.getHours() * 60 + s.getMinutes(), z = a + timeMinutes(e);
    const c = timeCategory(e.categoryId);
    return `<div class="pvb-b did v-${esc(e.verdict || 'none')}${e.kind === 'break' ? ' brk' : ''}" style="left:${pct(a).toFixed(1)}%;width:${Math.max(.6, pct(z) - pct(a)).toFixed(1)}%;--c:${esc(c.color)}" title="${esc(e.what || c.name)} ${esc(timeClockOf(e.startTime))} · ${timeSaid ? timeSaid(timeMinutes(e)) : ''}${e.verdict ? ' · ' + esc(TIME_VERDICT_WORDS[e.verdict]) : ''}"></div>`; }).join('');
  const honoured = blocks.filter(b => { const a = pbdMin(b.start); return pbdTrackedOn(b.ref, a, a + b.durationMin, d).some(e => e.endTime); }).length;
  return `<div class="pvb" aria-label="the plan, and what happened">
    <div class="pvb-h"><span class="k mono">the plan, and what happened</span><span class="mono faint">${blocks.length ? `${honoured} of ${blocks.length} blocks had time on them` : 'nothing was blocked'}</span></div>
    <div class="pvb-row"><span class="mono faint">planned</span><div class="pvb-track">${plan}</div></div>
    <div class="pvb-row"><span class="mono faint">tracked</span><div class="pvb-track">${did}</div></div>
    <div class="pvb-key faint mono"><span><i class="v-meant"></i>meant it</span><span><i class="v-partly"></i>partly</span><span><i class="v-drifted"></i>drifted</span><span><i class="v-none"></i>not said</span></div></div>`;
}
