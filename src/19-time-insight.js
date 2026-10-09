/* ============================================================
   WHAT THE HOURS ADD UP TO — the numbers under the Time view.

   Everything here reads; nothing here writes except the process wins, which
   are appended to the wins store beside the milestone wins and never edited.
   It is split from the page so the same numbers can sit in the Review's focus
   statistics and in the weekly review's "where the hours went": one function
   per figure, one place that says how it is worked out.

   It is not a scoreboard. The untracked hours are drawn, not hidden; every
   figure is a reading (a share, a rate, an average) with the rule that made
   it; every delta is against the person's own recent periods, never against a
   norm; and a figure with too little behind it says so instead of showing a
   number.
   ============================================================ */

/* ---------- what a category is for ----------
   Four kinds — what the time was doing for the life it came out of — and an
   optional parent and an optional value. The shipped categories carry the
   app's guess; it is the first thing worth changing in Categories. A category
   with no kind is simply unsorted, and the figures say how much is. */
const TIME_CAT_KINDS = ['invest', 'maintain', 'restore', 'drift'];
const TIME_CAT_KIND_WORDS = {invest: 'investing', maintain: 'maintaining', restore: 'restoring', drift: 'drift'};
const TIME_CAT_KIND_HINT = {invest: 'builds something you would name as growth or craft', maintain: 'keeps the life running',
  restore: 'puts energy back', drift: 'time that went somewhere you did not choose'};
const TIME_KIND_DEFAULTS = {piano: 'invest', japanese: 'invest', writing: 'invest', reading: 'invest', study: 'invest', creative: 'invest', spiritual: 'invest',
  meditation: 'restore', exercise: 'restore', rest: 'restore', social: 'restore', work: 'maintain', errands: 'maintain', commute: 'maintain', meal: 'maintain'};

/* the categories get their three fields the first time they are read; a kind
   the person has cleared stays cleared (null, not undefined) */
function timeCatNormalize(c){
  if(c.kind === undefined) c.kind = TIME_KIND_DEFAULTS[c.id] || null;
  if(c.kind !== null && !TIME_CAT_KINDS.includes(c.kind)) c.kind = null;
  c.parentId = c.parentId && c.parentId !== c.id ? c.parentId : null;
  c.valueId = c.valueId || null;
  return c;
}
function timeCatRoot(id){
  let c = id ? timeAllCategories().find(x => x.id === id) : null, guard = 0;
  while(c && c.parentId && guard++ < 6){ const p = timeAllCategories().find(x => x.id === c.parentId); if(!p) break; c = p; }
  return c ? c.id : (id || null);
}
function timeCatKind(id){
  let c = id ? timeAllCategories().find(x => x.id === id) : null, guard = 0;
  while(c && !c.kind && c.parentId && guard++ < 6) c = timeAllCategories().find(x => x.id === c.parentId);
  return c && c.kind || null;
}
function timeCatParentOptions(id){
  /* a parent can be anything that is not itself or below itself */
  const below = new Set([id]); let grew = true;
  while(grew){ grew = false; timeAllCategories().forEach(c => { if(c.parentId && below.has(c.parentId) && !below.has(c.id)){ below.add(c.id); grew = true; } }); }
  return timeAllCategories().filter(c => !below.has(c.id));
}

/* ---------- periods ---------- */
const TIME_UNITS = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']];
const pad2 = n => String(n).padStart(2, '0');
function timeRange(unit, anchor){
  anchor = anchor || today();
  const y = +anchor.slice(0, 4), m = +anchor.slice(5, 7);
  const lastOf = (yy, mm) => `${yy}-${pad2(mm)}-${pad2(new Date(yy, mm, 0).getDate())}`;
  if(unit === 'week'){ const from = weekStart(anchor); return {unit, from, to: addDays(from, 6)}; }
  if(unit === 'month') return {unit, from: `${y}-${pad2(m)}-01`, to: lastOf(y, m)};
  if(unit === 'quarter'){ const q0 = Math.floor((m - 1) / 3) * 3 + 1; return {unit, from: `${y}-${pad2(q0)}-01`, to: lastOf(y, q0 + 2)}; }
  if(unit === 'year') return {unit, from: `${y}-01-01`, to: `${y}-12-31`};
  return {unit: 'day', from: anchor, to: anchor};
}
function timeRangeShift(r, n){
  const mid = r.from;
  if(r.unit === 'day') return timeRange('day', addDays(mid, n));
  if(r.unit === 'week') return timeRange('week', addDays(mid, 7 * n));
  const d = new Date(+mid.slice(0, 4), +mid.slice(5, 7) - 1 + n * (r.unit === 'month' ? 1 : r.unit === 'quarter' ? 3 : 12), 1);
  return timeRange(r.unit, `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`);
}
function timeRangeLabel(r){
  if(r.unit === 'day') return fmtDate(r.from, 'med');
  if(r.unit === 'week') return `${fmtDate(r.from, 'short')} – ${fmtDate(r.to, 'short')}`;
  if(r.unit === 'month'){ const d = parseDay(r.from); return d.toLocaleDateString(undefined, {month: 'long', year: 'numeric'}); }
  if(r.unit === 'quarter') return `Q${Math.floor((+r.from.slice(5, 7) - 1) / 3) + 1} ${r.from.slice(0, 4)}`;
  return r.from.slice(0, 4);
}
const timeRangeWord = r => ({day: 'this day', week: 'this week', month: 'this month', quarter: 'this quarter', year: 'this year'})[r.unit];
const timeRangeIsCurrent = r => r.from <= today() && r.to >= today();
const timeRangeFuture = r => r.from > today();
/* the part of a period that has happened — a partly lived week is read as far
   as it has gone, and compared with the same stretch of the periods before it,
   so "below your usual" is never just "it is only Tuesday" */
function timeRangeSoFar(r){ return r.to > today() ? {unit: r.unit, from: r.from, to: today(), partial: true} : Object.assign({partial: false}, r); }
function timeLikeRanges(r, k = 4){
  const out = [], so = timeRangeSoFar(r), elapsed = daysBetween(so.from, so.to);
  for(let i = 1; i <= k; i++){
    const p = timeRangeShift(r, -i);
    out.push(so.partial ? {unit: p.unit, from: p.from, to: addDays(p.from, Math.min(elapsed, daysBetween(p.from, p.to))), partial: true} : p);
  }
  return out;
}
const timeDaysIn = (from, to) => { const out = []; for(let d = from, i = 0; d <= to && i < 800; d = addDays(d, 1), i++) out.push(d); return out; };

/* ---------- the lenses ----------
   Each entry belongs, for each lens, to a key (or several, with the time split
   evenly between them — values work that way). An entry that belongs to
   nothing under the lens is counted under "not hung on …" so the bars always
   add up to what was tracked. */
const TIME_LENSES = [['category', 'Category'], ['list', 'List / project'], ['skill', 'Skill'], ['person', 'Person'], ['habit', 'Habit'], ['value', 'Value'], ['tag', 'Tag']];
const TIME_LENS_NONE = {category: 'Untagged', list: 'Not on a list', skill: 'No skill', person: 'No one', habit: 'No habit', value: 'No value', tag: 'No tag'};
const TIME_PALETTE = ['#6b7f8e', '#c47832', '#7f916a', '#a0727e', '#8a7560', '#c4484e', '#8060a0', '#b08968'];

function timeSkillValues(id){
  const out = new Set();
  (S.entries || []).forEach(e => { if((e.links && e.links.skills || []).includes(id)) (e.links.values || []).forEach(x => out.add(x.id || x)); });
  return [...out];
}
/* the values an entry's time serves: the habit's, the skill's, the project's or
   the list's, whichever it is hung on — and failing those, the category's */
function timeEntryValues(e){
  let ids = [];
  if(e.habitId){ const h = byId(S.habits || [], e.habitId); if(h) ids = (h.links && h.links.values || []).slice(); }
  if(!ids.length && e.linkedType === 'skill') ids = timeSkillValues(e.linkedId);
  if(!ids.length && e.linkedType === 'project'){ const p = byId(S.projects || [], e.linkedId); if(p) ids = (p.valueIds || (p.links && p.links.values || []).map(x => x.id || x) || []).slice(); }
  if(!ids.length && e.linkedType === 'task'){ const t = taskById(e.linkedId), l = t && typeof planList === 'function' ? planList(t.listId) : null; if(l) ids = (l.valueIds || []).slice(); }
  if(!ids.length){ const c = timeCategory(e.categoryId); if(c && c.valueId) ids = [c.valueId]; }
  return ids.filter(id => byId(S.values || [], id));
}
function timeEntryList(e){
  if(e.linkedType === 'task'){ const t = taskById(e.linkedId); if(t && typeof planList === 'function'){ const l = planList(t.listId); if(l) return {key: 'l:' + l.id, label: l.name, color: l.color}; } }
  if(e.linkedType === 'project'){ const p = byId(S.projects || [], e.linkedId); return {key: 'p:' + e.linkedId, label: (p && p.name) || e.linkedLabel || 'a project'}; }
  return null;
}
/* -> [{key, label, color?, share}] with the shares adding to 1 */
function timeLensKeys(e, lens){
  if(lens === 'category'){
    const root = timeCatRoot(e.categoryId), c = timeCategory(root);
    return [{key: 'c:' + (root || ''), label: `${c.emoji} ${c.name}`, color: c.color, share: 1}];
  }
  if(lens === 'list'){ const l = timeEntryList(e); return l ? [Object.assign({share: 1}, l)] : []; }
  if(lens === 'skill'){
    if(e.linkedType === 'skill'){ const s = byId(S.skills || [], e.linkedId); return [{key: 's:' + e.linkedId, label: (s && s.name) || e.linkedLabel || 'a skill', share: 1}]; }
    return [];
  }
  if(lens === 'person'){
    if(e.linkedType === 'person'){ const p = byId(S.people || [], e.linkedId); return [{key: 'pe:' + e.linkedId, label: (p && p.name) || e.linkedLabel || 'a person', share: 1}]; }
    return [];
  }
  if(lens === 'habit'){
    if(e.habitId){ const h = byId(S.habits || [], e.habitId); if(h) return [{key: 'h:' + h.id, label: h.name, share: 1}]; }
    return [];
  }
  if(lens === 'value'){
    const ids = timeEntryValues(e); if(!ids.length) return [];
    return ids.map(id => { const v = byId(S.values || [], id); return {key: 'v:' + id, label: v.name, color: v.color, share: 1 / ids.length, split: ids.length > 1}; });
  }
  if(lens === 'tag'){
    const tg = (e.tags || []); if(!tg.length) return [];
    return tg.map(t => ({key: 't:' + t, label: '#' + t, share: 1 / tg.length}));
  }
  return [];
}
function timeLensTotals(rows, lens, second){
  const map = new Map();
  rows.forEach(e => {
    const mins = timeMinutes(e); if(!mins) return;
    let ks = timeLensKeys(e, lens);
    if(!ks.length) ks = [{key: 'none', label: TIME_LENS_NONE[lens], none: true, share: 1}];
    const sec = second && second !== lens ? (timeLensKeys(e, second)[0] || {key: 'none', label: TIME_LENS_NONE[second], none: true}) : null;
    ks.forEach(k => {
      const m = mins * k.share;
      const o = map.get(k.key) || {key: k.key, label: k.label, color: k.color || null, none: !!k.none, minutes: 0, split: false, sub: new Map()};
      o.minutes += m; if(k.split) o.split = true;
      if(sec){ const s = o.sub.get(sec.key) || {key: sec.key, label: sec.label, none: !!sec.none, minutes: 0}; s.minutes += m; o.sub.set(sec.key, s); }
      map.set(k.key, o);
    });
  });
  const total = sum([...map.values()].map(o => o.minutes));
  return [...map.values()].map(o => Object.assign(o, {sub: [...o.sub.values()].sort((a, b) => b.minutes - a.minutes), share: total ? o.minutes / total : 0}))
    .sort((a, b) => (a.none - b.none) || (b.minutes - a.minutes));
}
/* does an entry fall inside the narrowing the person clicked? */
function timeNarrowMatch(e, n){
  if(!n) return true;
  return timeLensKeys(e, n.lens).some(k => k.key === n.key) || (n.key === 'none' && !timeLensKeys(e, n.lens).length);
}
function timeRowsIn(from, to, narrow){
  return timeBetween(from, to).filter(e => timeNarrowMatch(e, narrow));
}

/* ---------- the glance ---------- */
function timeAwakeOn(d){
  const slept = timeSleepKnown(d) ? timeSleepInDay(d) : 0;
  let awake;
  if(timeSleepKnown(d) && slept) awake = 1440 - slept;
  else { const a = hm2min(dayWakeOrSetting(d)), b = hm2min(dayBedOrSetting(d)); awake = a != null && b != null && b > a ? b - a : 16 * 60; }
  if(d === today()){
    const w = hm2min(dayWakeOrSetting(d)) || 0, n = new Date(), nowMin = n.getHours() * 60 + n.getMinutes();
    awake = Math.max(0, Math.min(awake, nowMin - w));
  }
  return awake;
}
function timeMetrics(from, to, narrow){
  const rows = timeRowsIn(from, to, narrow), days = timeDaysIn(from, to);
  const mins = e => timeMinutes(e);
  const tracked = sum(rows.map(mins));
  const focused = sum(rows.filter(e => e.focusSit && e.kind !== 'break').map(mins));
  const read = rows.filter(e => e.verdict && e.kind !== 'break');
  const readMin = sum(read.map(mins)), meantMin = sum(read.filter(e => e.verdict === 'meant').map(mins));
  const kindMin = {invest: 0, maintain: 0, restore: 0, drift: 0, none: 0};
  rows.forEach(e => { const k = timeCatKind(e.categoryId) || 'none'; kindMin[k] += mins(e); });
  /* a stretch the person read as drifted is drift whatever its category says */
  const driftRead = sum(rows.filter(e => e.verdict === 'drifted' && e.kind !== 'break').map(mins));
  let awake = 0, untracked = 0;
  if(!narrow) days.forEach(d => { const a = timeAwakeOn(d), t = sum(timeOnDay(d).map(mins)); awake += a; untracked += Math.max(0, a - t); });
  return {from, to, rows, days: days.length, tracked, focused, readMin, meantMin, meantShare: readMin >= 30 ? meantMin / readMin : null,
    kindMin, driftRead, investShare: tracked ? kindMin.invest / tracked : null, unsorted: kindMin.none,
    awake: narrow ? null : awake, untracked: narrow ? null : untracked};
}
/* the person's own recent periods, like for like; null with fewer than two to go on */
function timeUsual(r, narrow, pick){
  const vals = timeLikeRanges(r, 4).map(p => timeMetrics(p.from, p.to, narrow)).filter(m => m.tracked > 0).map(pick).filter(v => v != null && isFinite(v));
  return vals.length >= 2 ? {avg: sum(vals) / vals.length, n: vals.length} : null;
}
const TIME_GLANCE = [
  {id: 'tracked', label: 'tracked', pick: m => m.tracked, kind: 'min', hint: m => 'everything the clock and your hand wrote down, breaks included'},
  {id: 'untracked', label: 'untracked, awake', pick: m => m.untracked, kind: 'min', needsAll: true, hint: m => 'the waking hours nobody accounted for — drawn, not hidden. Waking hours are read from the wake and bed times on Today.'},
  {id: 'focused', label: 'focused', pick: m => m.focused, kind: 'min', hint: m => 'time inside focus sittings, breaks left out'},
  {id: 'meant', label: 'meant it', pick: m => m.meantShare, kind: 'pct', hint: m => m.meantShare == null ? 'too few stretches have been read yet (it takes half an hour of readings)' : `${timeSaid(m.meantMin)} of the ${timeSaid(m.readMin)} you read as meant, partly or drifted`},
  {id: 'invest', label: 'investing', pick: m => m.investShare, kind: 'pct', hint: m => `time in categories you marked as investing, of everything tracked${m.unsorted ? `; ${timeSaid(m.unsorted)} sits in categories with no kind` : ''}`}];
function timeGlance(r, narrow){
  const so = timeRangeSoFar(r), m = timeMetrics(so.from, so.to, narrow);
  return {range: r, so, m, tiles: TIME_GLANCE.map(t => {
    if(t.needsAll && narrow) return {id: t.id, label: t.label, value: null, text: '—', delta: null, hint: 'not worked out for a narrowed view — the waking hours belong to the whole day'};
    const v = t.pick(m), usual = timeUsual(r, narrow, t.pick);
    return {id: t.id, label: t.label, value: v, kind: t.kind, usual, hint: t.hint(m), delta: v != null && usual ? v - usual.avg : null};
  })};
}
function timeDeltaWords(t){
  if(t.delta == null) return '';
  const d = t.delta, up = d > 0;
  if(t.kind === 'pct'){ const pts = Math.round(Math.abs(d) * 100); return pts < 1 ? 'about your usual' : `${pts} point${pts === 1 ? '' : 's'} ${up ? 'above' : 'below'} your usual`; }
  if(Math.abs(d) < 5) return 'about your usual';
  return `${timeSaid(Math.abs(d))} ${up ? 'more' : 'less'} than your usual`;
}
const timeTileText = t => t.value == null ? '—' : t.kind === 'pct' ? Math.round(t.value * 100) + '%' : timeSaid(t.value);

/* ---------- one sentence ----------
   Extends timeTodaySay. Every clause is a rule with a threshold, and the
   numbers are in the sentence. */
function timeNarrative(r, narrow){
  const g = timeGlance(r, narrow), m = g.m, who = narrow ? ' there' : '';
  if(timeRangeFuture(r)) return 'That period has not begun.';
  if(!m.tracked) return `Nothing is tracked ${timeRangeWord(r)}${who}.`;
  const by = timeLensTotals(m.rows, 'category'), top = by[0];
  let s = `${top.label.replace(/^\S+\s/, '')} took ${timeSaid(top.minutes)} (${Math.round(top.share * 100)}%) of the ${timeSaid(m.tracked)} tracked`;
  const trk = g.tiles.find(t => t.id === 'tracked');
  if(trk.delta != null && Math.abs(trk.delta) >= 30 && trk.usual && Math.abs(trk.delta) >= 0.1 * trk.usual.avg) s += `, ${timeSaid(Math.abs(trk.delta))} ${trk.delta > 0 ? 'more' : 'less'} than your usual`;
  const un = g.tiles.find(t => t.id === 'untracked');
  if(m.awake && m.untracked / m.awake >= 0.25) s += `; about ${timeSaid(m.untracked)} of the waking hours (${Math.round(m.untracked / m.awake * 100)}%) are untracked`;
  else {
    const inv = g.tiles.find(t => t.id === 'invest');
    if(inv.delta != null && Math.abs(inv.delta) >= 0.05) s += `; investing is ${Math.round(inv.value * 100)}%, ${Math.round(Math.abs(inv.delta) * 100)} points ${inv.delta > 0 ? 'up on' : 'down on'} your usual`;
    else if(m.untracked != null && m.awake && un.value != null) s += `; ${Math.round(m.untracked / m.awake * 100)}% of the waking hours are untracked`;
  }
  return s + '.';
}

/* ---------- the trend: twelve periods, and a rolling average ---------- */
function timeTrend(r, narrow, count = 12){
  const pts = [];
  for(let i = count - 1; i >= 0; i--){
    const p = timeRangeShift(r, -i), so = timeRangeSoFar(p);
    pts.push({range: p, label: timeRangeLabel(p), minutes: timeRangeFuture(p) ? 0 : sum(timeRowsIn(so.from, so.to, narrow).map(timeMinutes)), partial: so.partial});
  }
  pts.forEach((p, i) => { const win = pts.slice(Math.max(0, i - 2), i + 1).filter(x => !x.partial || x === p); p.rolling = sum(win.map(x => x.minutes)) / win.length; });
  return pts;
}

/* ---------- the quality of the focus ---------- */
function timeSittingsIn(from, to, narrow){
  const recs = (planState().focusSessions || []).filter(s => (s.type === 'focus' || s.type === 'clock') && s.startedAt && s.endedAt && timeLivingDay(s.startedAt) >= from && timeLivingDay(s.startedAt) <= to);
  if(!narrow) return recs;
  return recs.filter(s => (S.timeEntries || []).some(e => e.focusSit === s.startedAt && timeNarrowMatch(e, narrow)));
}
function timeFocusQuality(from, to, narrow){
  const recs = timeSittingsIn(from, to, narrow), out = {from, to, sittings: recs.length};
  /* the start delay: a block's start to the sitting that began on it */
  const delays = [];
  (S.timeBlocks || []).filter(b => b.date >= from && b.date <= to && b.ref && !['break', 'meal', 'commute', 'protect', 'label'].includes(b.kind)).forEach(b => {
    const at = parseDay(b.date); const [h, mm] = String(b.start).split(':').map(Number); at.setHours(h, mm, 0, 0);
    const mine = recs.filter(s => (b.ref.type === 'habit' ? (s.meta && s.meta.habitId === b.ref.id) : s.taskId === b.ref.id) && Date.parse(s.startedAt) >= at.getTime() - 10 * 60000 && Date.parse(s.startedAt) <= at.getTime() + 180 * 60000)
      .sort((a, c) => a.startedAt < c.startedAt ? -1 : 1);
    if(mine[0]) delays.push(Math.max(0, (Date.parse(mine[0].startedAt) - at.getTime()) / 60000));
  });
  out.delay = delays.length ? {value: sum(delays) / delays.length, n: delays.length} : null;
  /* breaks */
  const brk = []; recs.forEach(s => (s.breaks || []).forEach(b => b.to && brk.push(b)));
  const planned = brk.filter(b => b.origin !== 'overrun-split' && (+b.plannedMin || 0) > 0), over = brk.filter(b => b.origin === 'overrun-split' || b.overrun);
  out.overrun = planned.length >= 3 ? {value: Math.min(1, over.length / planned.length), n: planned.length} : null;
  const verd = brk.filter(b => b.origin !== 'overrun-split' && b.verdict);
  out.restful = verd.length >= 3 ? {value: verd.filter(b => b.verdict === 'meant').length / verd.length, n: verd.length} : null;
  /* the distractions noted while sitting, per hour of sitting */
  const focusMin = sum(recs.filter(s => s.type === 'focus').map(s => +s.duration || 0));
  const hits = sum((planState().distractions || []).map(x => (x.hits || []).filter(h => timeLivingDay(h) >= from && timeLivingDay(h) <= to).length));
  out.distract = focusMin >= 120 ? {value: hits / (focusMin / 60), n: hits, hours: focusMin / 60} : null;
  /* the estimates that came true */
  const done = (S.tasks || []).filter(t => t.done && t.doneAt && String(t.doneAt).slice(0, 10) >= from && String(t.doneAt).slice(0, 10) <= to && pbdEstOf(t) > 0 && (+t.focusTime || 0) > 0);
  const ratios = done.map(t => t.focusTime / pbdEstOf(t)).sort((a, b) => a - b);
  out.estimate = ratios.length >= 3 ? {within: ratios.filter(x => x >= 0.75 && x <= 1.25).length / ratios.length, median: ratios[Math.floor(ratios.length / 2)], n: ratios.length} : null;
  return out;
}

/* ---------- the wins that are about how, not what ----------
   Written, add-only, next to the milestone wins — for the last completed week,
   once, with the rule that earned it. A win is a reading that was good, not a
   target that was hit; nothing is lost by not having one. */
function timeProcessWins(){
  S.wins = S.wins || [];
  const wk = timeRangeShift(timeRange('week'), -1), made = [];
  const have = k => S.wins.some(w => w.key === k);
  const put = (signal, title, rule, value, baseline) => {
    const key = `proc:${signal}:${wk.from}`; if(have(key)) return;
    const w = {id: uid(), date: wk.to, kind: 'process', signal, key, milestoneLabel: title, listId: null, earlyLate: null, hoursInvested: 0, reflection: '', rule,
      period: {unit: 'week', from: wk.from, to: wk.to}, value, baseline: baseline == null ? null : baseline, createdAt: new Date().toISOString()};
    S.wins.push(w); made.push(w);
  };
  const q = timeFocusQuality(wk.from, wk.to);
  if(q.delay && q.delay.n >= 4 && q.delay.value <= 5) put('start', 'Started when the block said', `${q.delay.n} blocks were begun, on average ${Math.round(q.delay.value)} minute${Math.round(q.delay.value) === 1 ? '' : 's'} after their time (the rule: at least four blocks, five minutes or under)`, q.delay.value);
  if(q.overrun && q.overrun.n >= 5 && q.overrun.value <= 0.1) put('overrun', 'Breaks stayed their length', `${q.overrun.n} planned breaks, ${Math.round(q.overrun.value * 100)}% ran over (the rule: at least five breaks, a tenth or fewer over)`, q.overrun.value);
  if(q.estimate && q.estimate.n >= 5 && q.estimate.within >= 0.7) put('estimates', 'Estimates held', `${Math.round(q.estimate.within * 100)}% of ${q.estimate.n} finished tasks took within a quarter of their estimate (the rule: at least five tasks, seven in ten)`, q.estimate.within);
  const usual = (() => { const v = timeLikeRanges(wk, 4).map(p => timeFocusQuality(p.from, p.to)).map(x => x.distract && x.distract.value).filter(v => v != null); return v.length >= 2 ? sum(v) / v.length : null; })();
  if(q.distract && usual != null && usual > 0 && q.distract.value <= usual * 0.75) put('distract', 'Fewer pulls away from the work', `${q.distract.value.toFixed(1)} distractions an hour, against ${usual.toFixed(1)} in your own previous weeks (the rule: a quarter fewer, over at least two hours of sitting)`, q.distract.value, usual);
  const inv = timeMetrics(wk.from, wk.to), invU = timeUsual(wk, null, m => m.investShare);
  if(inv.investShare != null && invU && inv.tracked >= 600 && inv.investShare - invU.avg >= 0.05) put('invest', 'More of the week went to what you build', `${Math.round(inv.investShare * 100)}% of the tracked time was investing, against ${Math.round(invU.avg * 100)}% in your previous weeks (the rule: five points up, over ten tracked hours)`, inv.investShare, invU.avg);
  /* restful breaks up three weeks running; and the most focused week there has been */
  const wks = [0, 1, 2, 3].map(i => timeRangeShift(wk, -i)).reverse(), rf = wks.map(w => timeFocusQuality(w.from, w.to).restful);
  if(rf.every(Boolean) && rf[0].value < rf[1].value && rf[1].value < rf[2].value && rf[2].value < rf[3].value)
    put('restful', 'Breaks that were restful, up three weeks running', `${rf.map(x => Math.round(x.value * 100) + '%').join(' \u2192 ')} of breaks answered \u201cmeant it\u201d (the rule: each of the last three weeks higher than the one before, with at least three breaks read in each)`, rf[3].value, rf[0].value);
  const fm = w => sum(timeMetrics(w.from, w.to).rows.filter(e => e.focusSit && e.kind !== 'break').map(timeMinutes)), cur = fm(wk);
  const earlier = [1, 2, 3, 4, 5, 6, 7, 8].map(i => fm(timeRangeShift(wk, -i))).filter(x => x > 0);
  if(cur >= 300 && earlier.length >= 4 && cur > Math.max(...earlier)) put('bestfocus', 'The most time in focus there has been in a week', `${timeSaid(cur)} inside focus sittings, more than any of your previous ${earlier.length} weeks with any (the highest was ${timeSaid(Math.max(...earlier))})`, cur, Math.max(...earlier));
  if(made.length) saveNow();
  return made;
}

/* ---------- what needs attention, from the queue's flags ---------- */
const TIME_FLAG_IDS = ['unlabelled', 'intent', 'commit', 'skill-idle', 'list-idle', 'drift', 'overruns', 'protect-used'];
function timeAttentionItems(){
  return typeof promptQueue === 'function' ? promptQueue(today()).filter(it => TIME_FLAG_IDS.some(k => it.id === k || it.id.startsWith(k + ':'))) : [];
}
