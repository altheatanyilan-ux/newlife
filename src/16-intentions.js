/* ============================================================
   WHAT YOU MEAN TO GIVE YOUR TIME, AND HOW YOU MEAN TO WORK

   Two small stores, both yours and neither scored.

   TIME INTENTIONS say how much of something you mean to give — at least this
   much, or at most that much, of a day or a week. Four at most can be on
   at once, because a fifth is a way of not choosing. They are drawn as rings
   on the Time view, and one that is slipping or running over is raised as a
   flag with its rule. Suggestions come from what you have already written
   down (a list's hours a week, a habit's minutes, a week's goals), each with
   its reason; nothing is added until you say so.

   PERFORMANCE GOALS are about how you work, never about hours: a goal for the
   year, up to three for thirty days and up to three for fourteen. Each is
   written the SMARTER way, carries a line about who you are becoming, and is
   read through signals — how long it takes to begin, how often attention is
   pulled away, whether breaks end when they were meant to, whether the day's
   top two get done, whether the habits kept by the clock are kept. A reading
   is "7m now, 12m when you began": the direction it is moving, in words.
   ============================================================ */

/* ---------- time intentions ---------- */
const TIME_INTENT_MAX = 4;
const TIME_INTENT_TYPES = [['category', 'a category'], ['list', 'a list or project'], ['skill', 'a skill'], ['person', 'a person'], ['habit', 'a habit'], ['value', 'a value'], ['tag', 'a tag']];
const timeIntentions = () => (S.timeIntentions = Array.isArray(S.timeIntentions) ? S.timeIntentions : []);
const timeIntentionsActive = () => timeIntentions().filter(i => i.active);
function timeIntentionNormalize(i){
  i.id = i.id || uid();
  i.targetType = TIME_INTENT_TYPES.some(x => x[0] === i.targetType) ? i.targetType : 'category';
  i.targetId = i.targetId || '';
  i.direction = i.direction === 'max' ? 'max' : 'min';
  i.amountMin = Math.max(5, Math.round(+i.amountMin || 60));
  i.period = i.period === 'day' ? 'day' : 'week';
  i.startDate = i.startDate || today();
  i.endDate = i.endDate || null;
  i.active = i.active !== false;
  i.label = i.label || '';
  return i;
}
/* the key an entry carries under the lens this intention is about */
function timeIntentionKey(i){
  const id = i.targetId;
  return {category: 'c:' + timeCatRoot(id), list: 'l:' + id, skill: 's:' + id, person: 'pe:' + id, habit: 'h:' + id, value: 'v:' + id, tag: 't:' + id}[i.targetType];
}
function timeIntentionName(i){
  const id = i.targetId;
  if(i.label) return i.label;
  if(i.targetType === 'category') return timeCategory(id).name;
  if(i.targetType === 'list'){ const l = typeof planList === 'function' ? planList(id) : null; return l ? l.name : 'a list'; }
  if(i.targetType === 'skill') return (byId(S.skills || [], id) || {name: 'a skill'}).name;
  if(i.targetType === 'person') return (byId(S.people || [], id) || {name: 'a person'}).name;
  if(i.targetType === 'habit') return (byId(S.habits || [], id) || {name: 'a habit'}).name;
  if(i.targetType === 'value') return (byId(S.values || [], id) || {name: 'a value'}).name;
  return '#' + id;
}
/* the period an intention is read over, at a given day */
function timeIntentionRange(i, at){
  at = at || today();
  const r = i.period === 'day' ? timeRange('day', at) : timeRange('week', at);
  return r;
}
function timeIntentionProgress(i, at){
  const r = timeIntentionRange(i, at), so = timeRangeSoFar(r), key = timeIntentionKey(i);
  let mins = 0;
  timeBetween(so.from, so.to).forEach(e => { timeLensKeys(e, i.targetType).forEach(k => { if(k.key === key) mins += timeMinutes(e) * k.share; }); });
  const frac = mins / i.amountMin;
  return {range: r, mins, frac, amount: i.amountMin, over: i.direction === 'max' && mins > i.amountMin, met: i.direction === 'min' && mins >= i.amountMin};
}
/* at risk, with its rule in words — null when it is all right */
function timeIntentionRisk(i, at){
  at = at || today();
  if(i.startDate > at || (i.endDate && i.endDate < at)) return null;
  const p = timeIntentionProgress(i, at), name = timeIntentionName(i), per = i.period === 'day' ? 'today' : 'this week';
  if(i.direction === 'max'){
    if(p.over) return {msg: `${name} is over its limit ${per}.`, rule: `you meant to give it at most ${timeSaid(i.amountMin)} and it has had ${timeSaid(p.mins)}`};
    if(p.frac >= 0.8) return {msg: `${name} is close to its limit ${per}.`, rule: `${timeSaid(p.mins)} of the ${timeSaid(i.amountMin)} you meant it to stay under (a limit is raised at four fifths)`};
    return null;
  }
  if(p.met) return null;
  if(i.period === 'day'){
    const n = new Date(); if(n.getHours() < 18) return null;
    if(p.frac >= 0.5) return null;
    return {msg: `${name} has had little time today.`, rule: `it is past 18:00 and it has had ${timeSaid(p.mins)} of the ${timeSaid(i.amountMin)} you meant to give it (raised under half)`};
  }
  const k = daysBetween(p.range.from, at) + 1;
  if(k < 3) return null;
  const need = i.amountMin * k / 7;
  if(p.mins >= need * 0.6) return null;
  return {msg: `${name} is behind this week.`, rule: `day ${k} of 7, it has had ${timeSaid(p.mins)} of the ${timeSaid(i.amountMin)} you meant to give it; an even pace would be ${timeSaid(need)} by now (raised under three fifths of that)`};
}
function timeIntentionFlags(T){
  return timeIntentionsActive().map(i => { const r = timeIntentionRisk(i, T); return r ? {id: 'intent:' + i.id, msg: r.msg, rule: r.rule, go: ['see it', () => navigate('#/time/goals')]} : null; }).filter(Boolean);
}
/* rings, for the glance */
function timeIntentionRingsHTML(r){
  const act = timeIntentionsActive(); if(!act.length) return '';
  const at = r.to > today() ? today() : r.to;
  return `<div class="tmv-rings" aria-label="time intentions">${act.map(i => {
    const p = timeIntentionProgress(i, at), f = Math.min(1, p.frac), R = 19, C = 2 * Math.PI * R;
    const bad = i.direction === 'max' ? p.frac >= 0.8 : false, col = bad ? 'var(--rose)' : p.met ? 'var(--sage)' : 'var(--terra)';
    return `<button class="tmv-ring" data-tmgoals title="${esc(`${timeIntentionName(i)}: ${timeSaid(p.mins)} of ${i.direction === 'max' ? 'at most' : 'at least'} ${timeSaid(i.amountMin)} a ${i.period}`)}">
      <svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="${R}" fill="none" stroke="var(--line)" stroke-width="5"/>
        <circle cx="24" cy="24" r="${R}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 24 24)"/></svg>
      <span class="tmv-ringn">${esc(timeIntentionName(i))}</span><span class="mono faint">${Math.round(p.frac * 100)}%</span></button>`; }).join('')}</div>`;
}
/* what could be suggested, each with the reason it is */
function timeIntentionSuggestions(){
  const have = timeIntentions().filter(i => i.active), out = [];
  const taken = (type, id) => have.some(i => i.targetType === type && i.targetId === id);
  (typeof planLists === 'function' ? planLists() : []).filter(l => l.targetHoursPerWeek && planListActive(l) && !l.archivedAt).forEach(l => {
    if(!taken('list', l.id)) out.push({targetType: 'list', targetId: l.id, direction: 'min', amountMin: Math.round(l.targetHoursPerWeek * 60), period: 'week', reason: `${l.name} says ${l.targetHoursPerWeek} hours a week`}); });
  (S.habits || []).filter(h => !h.archived && !habIsBreaking(h)).forEach(h => {
    const thr = typeof habThreshold === 'function' ? habThreshold(h) : 0, ca = typeof habCountsAs === 'function' ? habCountsAs(h) : null;
    if(!(thr > 0)) return;
    const type = ca && ca.type === 'category' ? 'category' : 'habit', id = ca && ca.type === 'category' ? ca.id : h.id;
    if(!taken(type, id)) out.push({targetType: type, targetId: id, direction: 'min', amountMin: thr, period: 'day', reason: `${h.name} counts at ${thr} minutes`}); });
  try { const wp = weekPlan(weekStart(today()));
    (wp.outcomes || []).forEach(o => { const ids = o.taskIds || []; if(!ids.length) return;
      const ts = ids.map(id => (findTaskRef(id) || {}).task).filter(t => t && !t.done);
      if(!ts.length) return; const lc = {}; ts.forEach(t => lc[t.listId] = (lc[t.listId] || 0) + 1);
      const lid = Object.keys(lc).sort((a, b) => lc[b] - lc[a])[0], est = sum(ts.map(t => pbdEstOf(t)));
      if(lid && lid !== 'inbox' && est > 0 && !taken('list', lid)) out.push({targetType: 'list', targetId: lid, direction: 'min', amountMin: est, period: 'week', reason: `this week’s goal “${(o.text || '').slice(0, 40)}” has ${timeSaid(est)} of estimates still open, mostly on this list`}); }); } catch(e){}
  const seen = new Set(); return out.filter(x => { const k = x.targetType + ':' + x.targetId + ':' + x.period; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}
function timeIntentionAdd(f){
  const i = timeIntentionNormalize(Object.assign({id: uid(), active: true, createdAt: new Date().toISOString()}, f));
  if(i.active && timeIntentionsActive().length >= TIME_INTENT_MAX) return null;
  timeIntentions().push(i); return i;
}
function timeIntentionTargetOptions(type){
  if(type === 'category') return timeCategories().map(c => [c.id, `${c.emoji} ${c.name}`]);
  if(type === 'list') return (typeof planLists === 'function' ? planLists() : []).filter(l => !l.archivedAt).map(l => [l.id, l.name]);
  if(type === 'skill') return (S.skills || []).filter(s => !s.archived).map(s => [s.id, s.name]);
  if(type === 'person') return (S.people || []).map(p => [p.id, p.name]);
  if(type === 'habit') return (S.habits || []).filter(h => !h.archived).map(h => [h.id, h.name]);
  if(type === 'value') return (S.values || []).map(v => [v.id, v.name]);
  return [...new Set((S.timeEntries || []).flatMap(e => e.tags || []))].sort().map(t => [t, '#' + t]);
}
function openTimeIntentionModal(id, seed){
  const cur = id ? timeIntentions().find(x => x.id === id) : null, f = Object.assign({targetType: 'category', targetId: '', direction: 'min', amountMin: 300, period: 'week', startDate: today(), endDate: ''}, seed || {}, cur || {});
  const m = openModal(`<h2>${cur ? 'A time intention' : 'A new time intention'}</h2>
    <p class="muted" style="font-size:.86rem">How much of something you mean to give your time — a floor or a ceiling, for a day or for a week. It is drawn as a ring on the Time view, and raised only when it is slipping or running over. Four at once at most.</p>
    <div class="stack"><div class="row" style="gap:8px;flex-wrap:wrap">
      <label class="pd-q"><span class="k">of</span><select class="sel" id="tiType">${TIME_INTENT_TYPES.map(([k, n]) => `<option value="${k}" ${f.targetType === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="pd-q" style="flex:1"><span class="k">which</span><select class="sel" id="tiTarget"></select></label></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
      <label class="pd-q"><span class="k">I mean to give it</span><select class="sel" id="tiDir"><option value="min" ${f.direction === 'min' ? 'selected' : ''}>at least</option><option value="max" ${f.direction === 'max' ? 'selected' : ''}>at most</option></select></label>
      <label class="pd-q"><span class="k">hours</span><input class="inp" id="tiHours" type="number" min="0.1" step="0.25" style="width:90px" value="${(f.amountMin / 60).toFixed(2).replace(/\.?0+$/, '')}"></label>
      <label class="pd-q"><span class="k">a</span><select class="sel" id="tiPer"><option value="day" ${f.period === 'day' ? 'selected' : ''}>day</option><option value="week" ${f.period === 'week' ? 'selected' : ''}>week</option></select></label></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><label class="pd-q"><span class="k">from</span><input class="inp" id="tiFrom" type="date" value="${esc(f.startDate)}"></label>
      <label class="pd-q"><span class="k">until (optional)</span><input class="inp" id="tiTo" type="date" value="${esc(f.endDate || '')}"></label></div>
    <div class="row between" style="margin-top:6px">${cur ? '<button class="btn sm ghost danger" id="tiDel">delete</button>' : '<span></span>'}<button class="btn primary" id="tiSave">${cur ? 'Save' : 'Add it'}</button></div></div>`, 'narrow');
  const fill = () => { const t = m.querySelector('#tiType').value, sel = m.querySelector('#tiTarget');
    sel.innerHTML = timeIntentionTargetOptions(t).map(([k, n]) => `<option value="${esc(k)}" ${k === f.targetId && t === f.targetType ? 'selected' : ''}>${esc(n)}</option>`).join('') || '<option value="">nothing of that kind yet</option>'; };
  fill(); m.querySelector('#tiType').onchange = fill;
  m.querySelector('#tiSave').onclick = () => {
    const v = {targetType: m.querySelector('#tiType').value, targetId: m.querySelector('#tiTarget').value, direction: m.querySelector('#tiDir').value,
      amountMin: Math.round((+m.querySelector('#tiHours').value || 0) * 60), period: m.querySelector('#tiPer').value, startDate: m.querySelector('#tiFrom').value || today(), endDate: m.querySelector('#tiTo').value || null};
    if(!v.targetId){ toast('Choose what it is about.'); return; }
    if(v.amountMin < 5){ toast('Give it an amount of time.'); return; }
    if(cur){ Object.assign(cur, v); timeIntentionNormalize(cur); }
    else if(!timeIntentionAdd(v)){ toast(`Four are on already. Pause one first — a fifth is a way of not choosing.`); return; }
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const del = m.querySelector('#tiDel');
  if(del) del.onclick = () => { m.remove(); const back = spliceOut(timeIntentions(), x => x.id === cur.id); saveNow(); rerender();
    toast(esc('That intention is gone.'), 5000, {label: 'undo', fn: () => { back(); saveNow(); rerender(); }}); };
}

/* ---------- performance goals ---------- */
const PERF_LEVELS = {year: {name: 'A goal for the next 6–12 months', max: 1, days: 270}, month: {name: 'For the next thirty days', max: 3, days: 30}, fortnight: {name: 'For the next fourteen days', max: 3, days: 14}};
const PERF_SIGNALS = [
  {id: 'delay', name: 'how long it takes to begin', better: 'lower', unit: 'm', hint: 'minutes from a block’s start to the sitting begun on it'},
  {id: 'distract', name: 'how often attention is pulled away', better: 'lower', unit: '/h', hint: 'distractions put on the sheet, per hour of sitting'},
  {id: 'overrun', name: 'breaks that end when they were meant to', better: 'lower', unit: '%', hint: 'the share of planned breaks that ran over'},
  {id: 'topTwo', name: 'the day’s top two getting done', better: 'higher', unit: '%', hint: 'the share of days whose top two were both finished that day'},
  {id: 'planFull', name: 'the day being planned', better: 'higher', unit: '%', hint: 'the share of days with all three intentions written'},
  {id: 'habitHit', name: 'timed habits being kept', better: 'higher', unit: '%', hint: 'the share of due days on which a habit counted by the clock was kept'}];
function perfSignal(id, from, to){
  if(id === 'delay' || id === 'distract' || id === 'overrun'){
    const q = timeFocusQuality(from, to), x = q[id];
    return x ? {value: x.value * (id === 'overrun' ? 100 : 1), n: x.n} : null;
  }
  const days = timeDaysIn(from, to < today() ? to : today()); if(days.length < 3) return null;
  if(id === 'planFull'){
    const have = days.filter(d => { const pl = (S.plans || {})[d]; return pl && (pl.intentions || []).filter(x => (x || '').trim()).length >= 3; }).length;
    return {value: 100 * have / days.length, n: days.length};
  }
  if(id === 'topTwo'){
    const ds = days.filter(d => { const pl = (S.plans || {})[d]; return pl && pbdTopTwoTasks(pl).length; });
    if(ds.length < 3) return null;
    const hit = ds.filter(d => pbdTopTwoTasks(S.plans[d]).every(tid => { const r = findTaskRef(tid); return r && r.task.done && String(r.task.doneAt || '').slice(0, 10) <= d; })).length;
    return {value: 100 * hit / ds.length, n: ds.length};
  }
  if(id === 'habitHit'){
    const hs = (S.habits || []).filter(h => !h.archived && !habIsBreaking(h) && typeof habThreshold === 'function' && habThreshold(h) > 0);
    let due = 0, kept = 0; hs.forEach(h => days.forEach(d => { if(habDue(h, d)){ due++; if(habKept(h, d)) kept++; } }));
    return due >= 3 ? {value: 100 * kept / due, n: due} : null;
  }
  return null;
}
const perfFmt = (sig, v) => v == null ? '—' : sig.unit === 'm' ? Math.round(v) + 'm' : sig.unit === '/h' ? v.toFixed(1) + ' an hour' : Math.round(v) + '%';
/* the reading: now, and when the goal began — direction in words, never hours */
function perfReading(g){
  const win = g.level === 'year' ? 28 : g.level === 'month' ? 21 : 14, T = today();
  return (g.signals || []).map(id => { const sig = PERF_SIGNALS.find(x => x.id === id); if(!sig) return null;
    /* since the goal began, if that is long enough to read; otherwise the last stretch */
    const nf = g.startDate > addDays(T, -(win - 1)) && daysBetween(g.startDate, T) >= 3 ? g.startDate : addDays(T, -(win - 1));
    const now = perfSignal(id, nf, T), before = perfSignal(id, addDays(g.startDate, -win), addDays(g.startDate, -1));
    const tgt = g.targets && g.targets[id] != null && g.targets[id] !== '' ? +g.targets[id] : null;
    let dir = '';
    if(now && before){ const d = now.value - before.value, small = Math.abs(d) < (sig.unit === 'm' ? 1 : sig.unit === '/h' ? 0.2 : 3);
      dir = small ? 'about the same' : ((d < 0) === (sig.better === 'lower') ? 'better' : 'worse'); }
    const within = tgt != null && now ? (sig.better === 'lower' ? now.value <= tgt : now.value >= tgt) : null;
    return {sig, now, before, dir, tgt, within}; }).filter(Boolean);
}
const perfGoals = () => (S.perfGoals = Array.isArray(S.perfGoals) ? S.perfGoals : []);
const perfActive = lvl => perfGoals().filter(g => g.status === 'active' && (!lvl || g.level === lvl));
function perfNormalize(g){
  g.id = g.id || uid(); g.level = PERF_LEVELS[g.level] ? g.level : 'month'; g.status = ['active', 'done', 'dropped'].includes(g.status) ? g.status : 'active';
  g.title = g.title || ''; g.persona = g.persona || '';
  ['specific', 'achievable', 'relevant', 'evaluate', 'readjust'].forEach(k => { g[k] = g[k] || ''; });
  g.signals = Array.isArray(g.signals) ? g.signals.filter(id => PERF_SIGNALS.some(s => s.id === id)) : [];
  g.targets = g.targets && typeof g.targets === 'object' ? g.targets : {};
  g.startDate = g.startDate || today(); g.endDate = g.endDate || addDays(g.startDate, PERF_LEVELS[g.level].days);
  g.parentId = g.parentId || null; g.letterId = g.letterId || null; g.notes = Array.isArray(g.notes) ? g.notes : [];
  return g;
}
function openPerfGoalModal(id, level){
  const cur = id ? perfGoals().find(g => g.id === id) : null;
  const g = cur || perfNormalize({level: level || 'month'});
  const parents = perfActive().filter(x => x.id !== g.id && (g.level === 'month' ? x.level === 'year' : g.level === 'fortnight' ? x.level === 'month' : false));
  const m = openModal(`<h2>${cur ? 'A performance goal' : esc(PERF_LEVELS[g.level].name)}</h2>
    <p class="muted" style="font-size:.86rem">About how you work, not how many hours. Its signals are read for you, in words, and nothing here is a target you can fail by sitting down.</p>
    <div class="stack">
      <div class="field"><label>The goal</label><input class="inp serif-lg" id="pgTitle" value="${esc(g.title)}" placeholder="Begin when the block says"></div>
      <div class="field"><label>Who I am becoming</label><input class="inp" id="pgPersona" value="${esc(g.persona)}" placeholder="I am someone who starts when it is time."><div class="faint" style="font-size:.74rem;margin-top:2px">One line, in the first person. The Morning Theatre offers it for the self-image script.</div></div>
      <div class="field"><label>Specific — what it looks like</label><textarea class="ta hb-grow" rows="2" id="pgS">${esc(g.specific)}</textarea></div>
      <div class="field"><label>Measurable — read through</label><div class="stack" style="gap:6px">${PERF_SIGNALS.map(s => `<div class="row" style="gap:8px;align-items:center"><label class="row" style="gap:6px;flex:1"><input type="checkbox" data-pgsig="${s.id}" ${g.signals.includes(s.id) ? 'checked' : ''}> <span>${esc(s.name)} <span class="faint mono" style="font-size:.72rem">${esc(s.hint)}</span></span></label>
        <input class="inp" style="width:84px" data-pgtgt="${s.id}" placeholder="aim" value="${g.targets[s.id] != null ? esc(g.targets[s.id]) : ''}" title="optional: ${s.better === 'lower' ? 'at or under' : 'at or over'} (${s.unit})"></div>`).join('')}</div></div>
      <div class="field"><label>Achievable — why it is within reach</label><textarea class="ta hb-grow" rows="1" id="pgA">${esc(g.achievable)}</textarea></div>
      <div class="field"><label>Relevant — what it serves</label><textarea class="ta hb-grow" rows="1" id="pgR">${esc(g.relevant)}</textarea></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><label class="pd-q"><span class="k">Time-bound: from</span><input class="inp" type="date" id="pgFrom" value="${esc(g.startDate)}"></label><label class="pd-q"><span class="k">until</span><input class="inp" type="date" id="pgTo" value="${esc(g.endDate)}"></label>
        ${parents.length ? `<label class="pd-q" style="flex:1"><span class="k">under</span><select class="sel" id="pgParent"><option value="">—</option>${parents.map(x => `<option value="${esc(x.id)}" ${g.parentId === x.id ? 'selected' : ''}>${esc(x.title || 'untitled')}</option>`).join('')}</select></label>` : ''}</div>
      <div class="field"><label>Evaluated — when and how I will look</label><textarea class="ta hb-grow" rows="1" id="pgE" placeholder="Every Sunday, in the weekly review">${esc(g.evaluate)}</textarea></div>
      <div class="field"><label>Readjusted — what I will change if the signals say it is not working</label><textarea class="ta hb-grow" rows="1" id="pgJ">${esc(g.readjust)}</textarea></div>
      <div class="row between">${cur ? '<span class="row" style="gap:6px"><button class="btn sm ghost" id="pgDone">done</button><button class="btn sm ghost" id="pgDrop">drop it</button><button class="btn sm ghost danger" id="pgDel">delete</button></span>' : '<span></span>'}<button class="btn primary" id="pgSave">${cur ? 'Save' : 'Add it'}</button></div></div>`, 'wide');
  const read = () => Object.assign(g, {title: m.querySelector('#pgTitle').value.trim(), persona: m.querySelector('#pgPersona').value.trim(), specific: m.querySelector('#pgS').value.trim(),
    achievable: m.querySelector('#pgA').value.trim(), relevant: m.querySelector('#pgR').value.trim(), evaluate: m.querySelector('#pgE').value.trim(), readjust: m.querySelector('#pgJ').value.trim(),
    startDate: m.querySelector('#pgFrom').value || today(), endDate: m.querySelector('#pgTo').value || addDays(today(), PERF_LEVELS[g.level].days),
    parentId: (m.querySelector('#pgParent') || {value: ''}).value || null,
    signals: [...m.querySelectorAll('[data-pgsig]:checked')].map(x => x.dataset.pgsig),
    targets: Object.fromEntries([...m.querySelectorAll('[data-pgtgt]')].filter(x => x.value.trim() !== '' && !isNaN(+x.value)).map(x => [x.dataset.pgtgt, +x.value]))});
  m.querySelector('#pgSave').onclick = () => {
    read(); if(!g.title){ toast('Give it a name.'); return; }
    if(!cur && perfActive(g.level).length >= PERF_LEVELS[g.level].max){ toast(`${PERF_LEVELS[g.level].max === 1 ? 'One' : 'Three'} at this level at most; finish or drop one first.`); return; }
    perfNormalize(g); if(!cur) perfGoals().push(g);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const st = (s) => { read(); g.status = s; if(s === 'done') celebrateSmall(g.title); saveNow(); m.remove(); rerender(); };
  const bd = m.querySelector('#pgDone'); if(bd) bd.onclick = () => st('done');
  const br = m.querySelector('#pgDrop'); if(br) br.onclick = () => st('dropped');
  const bx = m.querySelector('#pgDel'); if(bx) bx.onclick = () => { m.remove(); const back = spliceOut(perfGoals(), x => x.id === g.id); saveNow(); rerender();
    toast(esc('That goal is gone.'), 5000, {label: 'undo', fn: () => { back(); saveNow(); rerender(); }}); };
}
const celebrateSmall = t => { try { sound('success'); toast(esc(`“${t}” is done.`), 4000); } catch(e){} };

/* a commitment, sealed as a letter across time, opening on the goal's last day */
function openPerfCommitment(id){
  const g = perfGoals().find(x => x.id === id); if(!g) return;
  const m = openModal(`<h2>A commitment, sealed</h2>
    <p class="muted" style="font-size:.88rem">A letter to the person who will have lived these ${daysBetween(g.startDate, g.endDate)} days, opening on ${esc(fmtDate(g.endDate, 'med'))}. It is hidden until then.</p>
    <div class="stack"><textarea class="ta" id="pcBody" style="min-height:180px">I am committing to “${esc(g.title)}” until ${esc(fmtDate(g.endDate, 'med'))}.\n\n${g.persona ? g.persona + '\n\n' : ''}What I will do: \n\nWhat I will do when it is hard: ${esc(g.readjust)}\n\nWhat I am putting on the line, if anything: </textarea>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="pcSeal">Seal it</button></div></div>`, 'wide');
  m.querySelector('#pcSeal').onclick = () => {
    const body = m.querySelector('#pcBody').value.trim(); if(!body) return;
    const e = {id: uid(), type: 'letter', title: 'A commitment: ' + g.title, body, occurredAt: today(), createdAt: new Date().toISOString(), media: [],
      links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: [], confidence: '',
      extra: {sealedUntil: g.endDate, openedAt: '', reply: '', goalId: g.id}};
    S.entries.push(e); g.letterId = e.id; saveNow(); m.remove(); sound('success');
    toast(esc(`Sealed until ${fmtDate(g.endDate, 'med')}.`)); rerender();
  };
}

/* the persona lines, offered to the Morning Theatre; added only when pressed */
function perfPersonaOfferHTML(){
  const script = (S.rehearsal && S.rehearsal.script) || '';
  const offers = perfActive().filter(g => g.persona && !script.includes(g.persona));
  if(!offers.length) return '';
  return `<div class="th-offer faint" style="font-size:.8rem;margin-top:8px">From your goals: ${offers.map(g => `<button type="button" class="chip sm" data-persona-add="${esc(g.id)}" title="add this line to the script">+ ${esc(g.persona)}</button>`).join(' ')}</div>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-persona-add]'); if(!b) return;
  const g = perfGoals().find(x => x.id === b.dataset.personaAdd); if(!g) return;
  S.rehearsal.script = ((S.rehearsal.script || '').trim() + (S.rehearsal.script ? '\n' : '') + g.persona).trim(); saveNow(); sound('success'); rerender();
});

/* ---------- the page: intentions and goals ---------- */
function timeGoalsHTML(){
  const act = timeIntentionsActive(), paused = timeIntentions().filter(i => !i.active), sug = timeIntentionSuggestions();
  const iRow = i => { const p = timeIntentionProgress(i), risk = timeIntentionRisk(i);
    return `<div class="tmg-row${i.active ? '' : ' off'}"><span class="tmg-main"><b>${esc(timeIntentionName(i))}</b> <span class="faint">${i.direction === 'max' ? 'at most' : 'at least'} ${esc(timeSaid(i.amountMin))} a ${i.period}</span>
      <span class="mono faint tmg-sub">${i.active ? `${esc(timeSaid(p.mins))} so far ${i.period === 'day' ? 'today' : 'this week'} (${Math.round(p.frac * 100)}%)${risk ? ` · <span class="tmg-risk">${esc(risk.rule)}</span>` : ''}` : 'paused'}</span></span>
      <button class="tbtn" data-tmi-edit="${esc(i.id)}">edit</button><button class="tbtn" data-tmi-tog="${esc(i.id)}">${i.active ? 'pause' : 'resume'}</button></div>`; };
  const gCard = g => { const rd = perfReading(g), left = daysBetween(today(), g.endDate);
    return `<div class="tmg-goal"><div class="row between" style="align-items:baseline"><b class="serif">${esc(g.title)}</b><span class="mono faint">${left >= 0 ? `${left} day${left === 1 ? '' : 's'} left` : `ended ${-left} day${left === -1 ? '' : 's'} ago`}</span></div>
      ${g.persona ? `<div class="tmg-persona serif">“${esc(g.persona)}”</div>` : ''}
      ${rd.length ? `<div class="tmg-sigs">${rd.map(r => `<div class="tmg-sig"><span>${esc(r.sig.name)}</span><span class="mono">${esc(perfFmt(r.sig, r.now && r.now.value))}${r.before ? ` <span class="faint">(${esc(perfFmt(r.sig, r.before.value))} when you began)</span>` : ''}</span>
        <span class="mono tmg-dir ${esc(r.dir || 'none')}">${esc(r.dir || (r.now ? 'nothing to compare yet' : 'too little yet'))}${r.within === true ? ' · within your aim' : r.within === false ? ' · not at your aim yet' : ''}</span></div>`).join('')}</div>` : '<div class="faint" style="font-size:.8rem">No signals chosen. Edit it to pick what it is read through.</div>'}
      ${g.evaluate ? `<div class="faint" style="font-size:.78rem;margin-top:4px">looked at: ${esc(g.evaluate)}</div>` : ''}
      <div class="row" style="gap:6px;margin-top:8px"><button class="tbtn" data-pg-edit="${esc(g.id)}">edit</button>${g.level === 'month' ? (g.letterId ? '<span class="mono faint">✉ sealed</span>' : `<button class="tbtn" data-pg-seal="${esc(g.id)}">✉ seal a commitment</button>`) : ''}</div></div>`; };
  return `<div class="tmg">
    <section class="tmv-sec"><div class="row between" style="align-items:baseline"><span class="sc" style="margin:0">Time intentions</span><span class="mono faint">${act.length} of ${TIME_INTENT_MAX} on</span></div>
      <p class="faint" style="font-size:.82rem;margin:4px 0 8px">How much of something you mean to give your time: a floor or a ceiling, for a day or a week. Rings on the Overview; raised on Today only when one is slipping or over.</p>
      ${act.length ? act.map(iRow).join('') : '<div class="empty">None yet.</div>'}${paused.map(iRow).join('')}
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm primary" id="tmiNew" ${act.length >= TIME_INTENT_MAX ? 'disabled title="four are on"' : ''}>+ an intention</button></div>
      ${sug.length ? `<div class="tmg-sug"><span class="sc">Suggested, from what you have written</span>${sug.map((s, i) => `<div class="tmg-row"><span class="tmg-main"><b>${esc(timeIntentionName(s))}</b> <span class="faint">at least ${esc(timeSaid(s.amountMin))} a ${s.period}</span><span class="mono faint tmg-sub">because ${esc(s.reason)}</span></span><button class="tbtn" data-tmi-sug="${i}" ${act.length >= TIME_INTENT_MAX ? 'disabled' : ''}>take it</button></div>`).join('')}</div>` : ''}</section>
    <section class="tmv-sec"><span class="sc">Performance goals</span>
      <p class="faint" style="font-size:.82rem;margin:4px 0 8px">About how you work, never how many hours. Read through signals, in words.</p>
      ${['year', 'month', 'fortnight'].map(lvl => { const gs = perfActive(lvl); return `<div class="tmg-level"><div class="row between" style="align-items:baseline"><span class="mono faint">${esc(PERF_LEVELS[lvl].name)} · ${gs.length} of ${PERF_LEVELS[lvl].max}</span>
        <button class="tbtn" data-pg-new="${lvl}" ${gs.length >= PERF_LEVELS[lvl].max ? 'disabled' : ''}>+ add</button></div>${gs.map(gCard).join('') || '<div class="faint" style="font-size:.8rem;margin:4px 0 10px">None.</div>'}</div>`; }).join('')}
      ${perfGoals().filter(g => g.status !== 'active').length ? `<details class="tmg-past"><summary class="mono faint">finished or put down (${perfGoals().filter(g => g.status !== 'active').length})</summary>${perfGoals().filter(g => g.status !== 'active').map(g => `<div class="tmg-row"><span class="tmg-main"><b>${esc(g.title)}</b> <span class="faint">${esc(g.status)}</span></span><button class="tbtn" data-pg-edit="${esc(g.id)}">open</button></div>`).join('')}</details>` : ''}</section></div>`;
}
function bindTimeGoals(root){
  const q = s => root.querySelector(s);
  const n = q('#tmiNew'); if(n) n.onclick = () => openTimeIntentionModal(null);
  $$('[data-tmi-edit]', root).forEach(b => b.onclick = () => openTimeIntentionModal(b.dataset.tmiEdit));
  $$('[data-tmi-tog]', root).forEach(b => b.onclick = () => { const i = timeIntentions().find(x => x.id === b.dataset.tmiTog); if(!i) return;
    if(!i.active && timeIntentionsActive().length >= TIME_INTENT_MAX){ toast('Four are on already. Pause one first.'); return; }
    i.active = !i.active; saveNow(); rerender(); });
  $$('[data-tmi-sug]', root).forEach(b => b.onclick = () => { const s = timeIntentionSuggestions()[+b.dataset.tmiSug]; if(s) openTimeIntentionModal(null, s); });
  $$('[data-pg-new]', root).forEach(b => b.onclick = () => openPerfGoalModal(null, b.dataset.pgNew));
  $$('[data-pg-edit]', root).forEach(b => b.onclick = () => openPerfGoalModal(b.dataset.pgEdit));
  $$('[data-pg-seal]', root).forEach(b => b.onclick = () => openPerfCommitment(b.dataset.pgSeal));
}
