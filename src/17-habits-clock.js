/* ============================================================
   HABITS, COUNTED BY THE CLOCK

   A habit that is really an amount of time need not be ticked: it can say what
   it counts as — a time category, a list, a project, a skill or one task — and
   how many minutes make a day of it. The clock then answers it. This was a
   category and a number on the habit (timeCat, timeMins); it is a link now
   (countsAs, thresholdMin) and the old pair is kept in step for anything that
   still reads it.

   What the clock does with a habit
     · the ring shows how far along it is ("12 of 20 min"), live;
     · when a finished stretch takes the day over the number, the day is
       written down as kept, saying it was the clock, and which sitting did it;
     · edit or delete that sitting and the day is read again: below the number
       it goes back to partial, never to a miss — and to nothing at all if the
       clock has nothing left for it;
     · a day you cleared by hand is not written again; a day you ticked
       yourself is yours and is never touched.

   A link is a claim, so it is confirmed rather than assumed. The habits that
   used to be matched by their names (stillness, Japanese, ...) are offered as
   proposals, one by one; nothing is linked until you say so. The name-matching
   itself stays until you say it can go.
   ============================================================ */

const HAB_COUNT_TYPES = [['category', 'a time category'], ['list', 'a list'], ['project', 'a project'], ['skill', 'a skill'], ['task', 'one task']];
/* the states a limiting habit is set off by — and that a distraction or a
   break that ran over can be put down to */
const HAB_STATES = [['stress', 'stress'], ['tiredness', 'tiredness'], ['pressure', 'time pressure'], ['mood', 'bad mood'], ['discomfort', 'discomfort']];
const habStateName = id => (HAB_STATES.find(s => s[0] === id) || [, id])[1];
/* what the names used to be matched against: each guess is only ever a
   proposal, with the reason it was made */
const HAB_NAME_GUESS = [
  [/medit|still|breath|\bsit\b/i,           'category', 'meditation'],
  [/japanese|日本語|language/i,              'category', 'japanese'],
  [/piano|instrument|guitar|violin|practi[sc]e/i, 'category', 'piano'],
  [/\bread(ing)?\b|\bbooks?\b/i,            'category', 'reading'],
  [/\bwrit(e|ing)\b|journal/i,              'category', 'writing'],
  [/exercis|workout|\brun(ning)?\b|\bgym\b|\bwalk|yoga|swim/i, 'category', 'exercise'],
  [/\bstudy\b|revis|flashcard|\banki\b/i,   'category', 'study']];

/* ---------- the link ---------- */
function habCountsAs(h){
  if(h && h.countsAs && h.countsAs.type && h.countsAs.id) return h.countsAs;
  /* a habit not yet read through habDefaults still carries the older pair, which is a link already made */
  if(h && h.timeCat && +h.timeMins > 0) return {type: 'category', id: h.timeCat};
  return null;
}
const habThreshold = h => (h && +h.thresholdMin > 0) ? +h.thresholdMin : (h && h.timeCat && +h.timeMins > 0 ? +h.timeMins : 0);
/* How long a habit usually takes, where that means anything: the figure you gave it,
   else the minutes that count it by the clock, else its target each time. A habit you are
   breaking has none. The planning board reserves this time first, before any task. */
function habEstimateMin(h){
  if(!h || h.negative) return 0;
  return (+h.estimateMin > 0 ? Math.round(+h.estimateMin) : 0) || habThreshold(h) || (+h.durationTarget > 0 ? Math.round(+h.durationTarget) : 0) || 0;
}
/* what the last sittings of it say: the middle of up to eight, once there are three */
function habLearnedMin(h){
  if(!h) return null;
  const rows = (S.timeEntries || []).filter(e => e.habitId === h.id && e.endTime).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))).slice(-8)
    .map(e => timeMinutes(e)).filter(m => m >= 1).sort((a, b) => a - b);
  if(rows.length < 3) return null;
  return {n: rows.length, min: Math.round(rows[Math.floor(rows.length / 2)])};
}
function habCountsName(link){
  if(!link) return '';
  try {
    if(link.type === 'category') return timeCategory(link.id).name;
    if(link.type === 'list') return planListName(link.id) || 'a list';
    if(link.type === 'skill') return (byId(S.skills || [], link.id) || {}).name || 'a skill';
    if(link.type === 'project') return (byId(S.projects || [], link.id) || {}).name || 'a project';
    if(link.type === 'task'){ const t = typeof taskById === 'function' ? taskById(link.id) : null; return t ? (t.title || t.text || 'a task') : 'a task'; }
  } catch(e){}
  return '';
}
const habCountsLabel = link => link ? `${(HAB_COUNT_TYPES.find(t => t[0] === link.type) || [, link.type])[1]} “${habCountsName(link)}”` : '';
/* what a link can point to, for a picker */
function habCountsChoices(type){
  try {
    if(type === 'category') return timeCategories().map(c => [c.id, `${c.emoji} ${c.name}`]);
    if(type === 'list') return planLists().filter(l => !l.archived).map(l => [l.id, l.name]);
    if(type === 'skill') return (S.skills || []).map(s => [s.id, s.name]);
    if(type === 'project') return (S.projects || []).map(p => [p.id, p.name]);
    if(type === 'task') return (S.tasks || []).filter(t => !t.done && !t.isCompleted).slice(0, 200).map(t => [t.id, t.title || t.text || '(untitled)']);
  } catch(e){}
  return [];
}
/* Confirmed (or cleared) by the person: the link, the number, and the old
   pair kept in step so nothing that still reads them is left behind. */
function habSetCounts(h, link, mins){
  const was = habThreshold(h);
  h.countsAs = link && link.type && link.id ? {type: link.type, id: link.id} : null;
  h.thresholdMin = h.countsAs ? (Math.max(1, Math.round(+mins || was || +h.durationTarget || 20))) : null;
  h.countsState = h.countsAs ? 'confirmed' : (h.countsState === 'proposed' ? 'declined' : 'none');
  h.countsProposal = null;
  h.timeCat = h.countsAs && h.countsAs.type === 'category' ? h.countsAs.id : null;
  h.timeMins = h.timeCat ? h.thresholdMin : null;
  return h;
}

/* ---------- which entries a habit counts ---------- */
function habClockMatches(h, e){
  const l = habCountsAs(h);
  if(!l || !e) return false;
  if(l.type === 'category') return e.categoryId === l.id;
  if(e.linkedType === l.type && e.linkedId === l.id) return true;
  if(l.type === 'list' && e.linkedType === 'task' && e.linkedId){
    try { const t = taskById(e.linkedId); return !!t && t.listId === l.id; } catch(err){ return false; }
  }
  return false;
}
const habClockEntries = (h, day) => (habCountsAs(h) ? timeOnDay(day) : []).filter(e => habClockMatches(h, e));
const habClockMinutes = (h, day) => sum(habClockEntries(h, day).map(e => timeMinutes(e)));
/* the sitting whose minutes took the day over the line */
function habCrossedBy(rows, need){
  let run = 0;
  const ordered = rows.slice().sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  for(const e of ordered){ run += timeMinutes(e); if(run >= need) return e.focusSit || e.id; }
  return null;
}
/* How far along a clock-counted habit is on a day — live, running part and
   all. Null for a habit the clock does not count. */
function habClockProgress(h, day = today()){
  const l = habCountsAs(h), need = habThreshold(h);
  if(!l || !need || habIsBreaking(h)) return null;
  const rows = habClockEntries(h, day), mins = sum(rows.map(e => timeMinutes(e)));
  return {mins, need, met: mins >= need, by: mins >= need ? habCrossedBy(rows, need) : null,
    say: `${Math.floor(mins)} of ${need} min`};
}
/* The old name for the same answer: does the clock say this day is kept. */
const habClockMet = (h, day) => { const p = habClockProgress(h, day); return !!(p && p.met); };

/* ---------- writing the day down, and reading it again ---------- */
function habClockSettleDay(day){
  if(!day || !Array.isArray(S.habits)) return false;
  let changed = false;
  S.habits.forEach(h => {
    if(h.archived || habIsBreaking(h)) return;
    const need = habThreshold(h);
    if(!habCountsAs(h) || !need) return;
    S.habitLog = S.habitLog || {};
    const cur = S.habitLog[day] && S.habitLog[day][h.id];
    if(cur && !cur.fromClock) return;                   /* your own word wins */
    if((h.clockSkip || []).includes(day)) return;       /* cleared by hand: not written again */
    const rows = habClockEntries(h, day).filter(e => e.endTime);
    const mins = Math.floor(sum(rows.map(e => timeMinutes(e))));
    let next = null;
    if(mins >= need){
      next = {status: 'completed', level: 'full', fromClock: true, note: 'kept by the clock', minutes: mins, sitting: habCrossedBy(rows, need)};
    } else if(cur){
      next = mins > 0 ? {status: 'partial', level: 'min', fromClock: true, note: `the clock: ${mins} of ${need} min`, minutes: mins, sitting: null} : false;
    }
    if(next === null) return;
    S.habitLog[day] = S.habitLog[day] || {};
    if(next === false){ delete S.habitLog[day][h.id]; changed = true; return; }
    if(cur && cur.status === next.status && cur.minutes === next.minutes && cur.sitting === next.sitting) return;
    S.habitLog[day][h.id] = Object.assign({}, next, {at: (cur && cur.at) || new Date().toISOString()});
    try { habCheckMilestones(h); } catch(e){}
    changed = true;
  });
  if(changed) saveNow();
  return changed;
}
/* after an entry is saved, removed or corrected: the day it began in, and the
   day it ended in when those differ */
function habClockSettleFor(e){
  if(!e || !e.startTime) return;
  const a = timeLivingDay(e.startTime), b = e.endTime ? timeLivingDay(e.endTime) : a;
  habClockSettleDay(a); if(b !== a) habClockSettleDay(b);
}
/* on the way in: today and yesterday are read once, for whatever the clock
   did while the page was shut */
function habClockCatchUp(){
  try { const t = today(); habClockSettleDay(t); habClockSettleDay(addDays(t, -1)); } catch(e){}
}
/* clearing a day the clock had written is a decision, remembered */
function habClockNoteCleared(h, day){
  const was = S.habitLog && S.habitLog[day] && S.habitLog[day][h.id];
  if(!was || !was.fromClock) return;
  h.clockSkip = (h.clockSkip || []).filter(d => d !== day).concat(day).slice(-120);
}

/* ---------- proposing the links that were guessed from names ---------- */
function habProposeFor(h){
  if(!h || h.archived || habIsBreaking(h) || h.countsState) return false;
  if(habCountsAs(h)){ h.countsState = 'confirmed'; return false; }
  const name = h.name || '';
  for(const [re, type, id] of HAB_NAME_GUESS){
    const m = name.match(re);
    if(m && timeAllCategories().some(c => c.id === id)){
      h.countsState = 'proposed';
      h.countsProposal = {type, id, mins: +h.durationTarget || +h.timeMins || 20, why: `its name has “${m[0].trim()}” in it`};
      return true;
    }
  }
  h.countsState = 'none';
  return false;
}
function habProposeLinks(){
  let any = false;
  (S.habits || []).forEach(h => { if(!h.countsState) any = habProposeFor(h) || any; });
  return any;
}
const habProposals = () => (S.habits || []).filter(h => !h.archived && h.countsState === 'proposed' && h.countsProposal);
function habConfirmProposal(id, mins){
  const h = byId(S.habits, id); if(!h || !h.countsProposal) return null;
  habSetCounts(h, h.countsProposal, mins || h.countsProposal.mins);
  habClockSettleDay(today());
  saveNow();
  return h;
}
function habDeclineProposal(id){
  const h = byId(S.habits, id); if(!h) return null;
  h.countsState = 'declined'; h.countsProposal = null; saveNow();
  return h;
}
/* The proposals, on the dashboard, to be answered one by one. */
function habProposalsHTML(){
  const ps = habProposals();
  if(!ps.length) return '';
  return `<div class="hb-props card">
    <div class="sc">Let the clock count these?</div>
    <div class="faint" style="font-size:.78rem;margin:2px 0 8px">Each of these was guessed from its name. A link is only made when you say so; nothing else changes.</div>
    ${ps.map(h => `<div class="hb-prop" data-hbprop="${esc(h.id)}">
      <div class="hb-prop-t"><b>${esc(h.name)}</b> <span class="faint">→ ${esc(habCountsLabel(h.countsProposal))}</span>
        <div class="mono faint" style="font-size:.72rem">${esc(h.countsProposal.why)}</div></div>
      <label class="mono faint" style="font-size:.74rem">kept at <input class="inp" type="number" min="1" max="1440" style="width:64px" data-hbpropmin value="${+h.countsProposal.mins || 20}"> min</label>
      <button class="btn sm primary" data-hbpropyes>yes, link it</button>
      <button class="btn sm ghost" data-hbpropno title="leave it ticked by hand">not this</button>
    </div>`).join('')}
  </div>`;
}
function bindHabProposals(root, after){
  $$('[data-hbprop]', root).forEach(row => {
    const id = row.dataset.hbprop;
    row.querySelector('[data-hbpropyes]').onclick = () => {
      habConfirmProposal(id, +row.querySelector('[data-hbpropmin]').value || 20); sound('success'); (after || rerender)(); };
    row.querySelector('[data-hbpropno]').onclick = () => { habDeclineProposal(id); sound('click'); (after || rerender)(); };
  });
}

/* ---------- start the minimum ----------
   The worst-day version of a habit, started as a sitting with that version as
   its goal. If the habit is counted by the clock the sitting is filed where
   the habit counts it, so the minutes arrive on their own; if not, when it
   ends it asks whether the minimum was kept. */
function habStartMinimum(h){
  if(!h || habIsBreaking(h)) return null;
  const l = habCountsAs(h);
  const meta = {what: h.name, goal: h.min || '', habitId: h.id, source: 'timer', feature: 'habit'};
  if(l && l.type === 'category') meta.categoryId = l.id;
  else if(l && (l.type === 'skill' || l.type === 'project' || l.type === 'task')){
    meta.linkedType = l.type; meta.linkedId = l.id; meta.linkedLabel = habCountsName(l); }
  else if(l && l.type === 'list') meta.categoryId = 'tasks';
  const e = startTimer(meta);
  if(typeof paintTimeDock === 'function') paintTimeDock();
  return e;
}
/* when a sitting ends: the minimum asked about, and what comes next offered */
function habAfterSitting(info){
  if(!info) return;
  const meta = info.meta || null;
  const entries = (S.timeEntries || []).filter(e => e.focusSit === info.startedAt && e.endTime)
    .sort((a, b) => Date.parse(a.endTime) - Date.parse(b.endTime));
  const last = entries[entries.length - 1] || null;
  const T = today();
  let anchor = null;
  if(meta && meta.habitId) anchor = byId(S.habits || [], meta.habitId);
  if(anchor && !habKept(anchor, T) && !(habCountsAs(anchor) && habThreshold(anchor))){
    toast(esc(`Was the minimum of “${anchor.name}” kept?`), 10000, {label: 'yes, kept', fn: () => {
      habSetEntry(anchor, T, {status: 'partial', note: anchor.min ? `the minimum: ${anchor.min}` : 'the minimum, with a sitting'});
      sound('success'); if(typeof rerender === 'function') rerender(); }});
  }
  /* the chain: whichever habit this sitting was for, or was counted as, or
     the task it was on, is the anchor of whatever is stacked after it */
  const anchors = new Set();
  if(anchor) anchors.add(anchor.id);
  (S.habits || []).forEach(h => { if(!h.archived && last && habClockMatches(h, last)) anchors.add(h.id); });
  const next = (S.habits || []).find(x => !x.archived && !habIsBreaking(x) && habDue(x, T) && !habKept(x, T) && x.id !== (anchor && anchor.id)
    && ((x.stackAfter && anchors.has(x.stackAfter)) || (x.stackAfterTask && info.taskId && x.stackAfterTask === info.taskId)));
  if(next){
    setTimeout(() => toast(esc(`Next: ${next.name} — start?`), 12000, {label: 'start', fn: () => { habStartMinimum(next); sound('click'); }}), anchor ? 600 : 0);
  }
}
let _habWatching = false;
function habWatchSittings(){
  if(_habWatching || typeof FocusTimer === 'undefined' || !FocusTimer.onEnd) return;
  _habWatching = true;
  FocusTimer.onEnd(info => { try { habAfterSitting(info); } catch(e){ console.warn('the habits were not told a sitting ended', e); } });
  habClockCatchUp();
}

/* ---------- limiting habits: the register ----------
   Each row is a state that sets a limiting habit off, a description of how it
   shows, and what to do — written now, in the calm. The same states tag the
   trigger map of a habit you are breaking, and a distraction or a break that
   ran over can be put down to one, which brings the script up. */
function habLimiters(){
  const p = planState();
  if(!Array.isArray(p.limiters)) p.limiters = [];
  return p.limiters;
}
function habStateScripts(state){
  const out = [];
  habLimiters().filter(r => r.state === state && (r.action || '').trim()).forEach(r =>
    out.push({text: r.action.trim(), from: r.description ? r.description.trim() : 'the register'}));
  (S.habits || []).filter(h => !h.archived && habIsBreaking(h)).forEach(h => (h.triggers || []).forEach(t => {
    if((t.states || []).includes(state) && (t.strategy || '').trim()) out.push({text: t.strategy.trim(), from: h.name}); }));
  return out;
}
function habStatePickerHTML(attr = 'data-habstate', picked = ''){
  return `<span class="hb-states" role="group" aria-label="what state were you in">${HAB_STATES.map(([id, n]) =>
    `<button type="button" class="chip tf-chip${picked === id ? ' on' : ''}" ${attr}="${esc(id)}">${esc(n)}</button>`).join('')}</span>`;
}
function habStateScriptHTML(state){
  if(!state) return '';
  const ss = habStateScripts(state);
  return `<div class="hb-script"><span class="k mono">${esc(habStateName(state))}</span>${ss.length
    ? ss.map(s => `<div class="hb-script-l">${esc(s.text)} <span class="faint mono">— ${esc(s.from)}</span></div>`).join('')
    : `<div class="faint">Nothing scripted for ${esc(habStateName(state))} yet. <a href="#/today" data-habgo="limits">Write one in Habits → Limiting.</a></div>`}</div>`;
}
function habLimitsHTML(){
  const rows = habLimiters();
  return `<div class="hb-limits">
    <p class="th-quote">A limiting habit is one a state sets off — stress, tiredness, the clock running down, a bad mood, discomfort. Say what it looks like and what you will do, now, while it is calm. When a distraction or an overrun is put down to the state, this is what comes up.</p>
    ${rows.length ? `<div class="hb-lrows">${rows.map(r => `<div class="hb-lrow" data-hblim="${esc(r.id)}">
      <select class="sel" data-hblf="state" aria-label="the state">${HAB_STATES.map(([id, n]) => `<option value="${esc(id)}"${r.state === id ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <textarea class="ta hb-grow" rows="1" data-hblf="description" placeholder="how it shows: I open the phone without deciding to…">${esc(r.description || '')}</textarea>
      <textarea class="ta hb-grow" rows="1" data-hblf="action" placeholder="what I do: stand up, water, five breaths, then the next small thing">${esc(r.action || '')}</textarea>
      <button class="pl-mini" data-hblDel="${esc(r.id)}" title="take it out">×</button></div>`).join('')}</div>`
      : '<div class="empty">Nothing in the register yet.</div>'}
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px"><span class="mono faint">add one for</span>${HAB_STATES.map(([id, n]) =>
      `<button class="chip click" data-hblAdd="${esc(id)}">${esc(n)}</button>`).join('')}</div>
  </div>`;
}
function bindHabLimits(root){
  $$('[data-hblAdd]', root).forEach(b => b.onclick = () => {
    habLimiters().push({id: uid(), state: b.dataset.hbladd || b.getAttribute('data-hblAdd'), description: '', action: '', createdAt: new Date().toISOString()});
    saveNow(); rerenderPlanBody(); });
  $$('[data-hblim]', root).forEach(row => {
    const r = habLimiters().find(x => x.id === row.dataset.hblim); if(!r) return;
    row.querySelectorAll('[data-hblf]').forEach(f => f.onchange = f.oninput = debounce(() => { r[f.dataset.hblf] = f.value; saveNow(); }, 250));
    row.querySelector('[data-hblDel]').onclick = () => requestDelete({label: 'That row', skipConfirm: true,
      remove: () => spliceOut(habLimiters(), x => x.id === r.id), after: () => rerenderPlanBody()});
  });
}

/* ---------- misses, held up against the time ----------
   "Ran out of time" and "Too tired" are things the clock can speak to. This
   does not decide whether the reason was true; it sets what you said beside
   what was recorded that day, and says how it was worked out. */
function habDayUntracked(day){
  const w = hm2min(dayWakeOrSetting(day)), b = hm2min(dayBedOrSetting(day));
  if(w == null || b == null || b <= w) return null;
  const rows = timeOnDay(day).filter(e => e.endTime);
  const tracked = sum(rows.map(e => timeMinutes(e)));
  const drifted = sum(rows.filter(e => e.verdict === 'drifted').map(e => timeMinutes(e)));
  return {awake: b - w, tracked, untracked: Math.max(0, b - w - tracked), drifted};
}
function habMissInsight(h, days = 60){
  if(!h || habIsBreaking(h)) return null;
  const T = today(), byReason = {time: [], tired: []}, base = [];
  for(let i = 1; i <= days; i++){
    const d = addDays(T, -i), e = habEntry(h, d), u = habDayUntracked(d);
    if(!u || !u.tracked) continue;                   /* a day nothing was tracked says nothing */
    base.push(u);
    if(e && e.status === 'skipped' && byReason[e.reason]) byReason[e.reason].push(u);
  }
  const avg2 = (xs, k) => xs.length ? sum(xs.map(x => x[k])) / xs.length : 0;
  const say = m => timeSaid(Math.round(m));
  const lines = [];
  [['time', 'Ran out of time'], ['tired', 'Too tired']].forEach(([k, label]) => {
    const xs = byReason[k]; if(xs.length < 3 || base.length < 5) return;
    lines.push({reason: k, n: xs.length,
      text: `On the ${xs.length} days you put a miss down to “${label.toLowerCase()}”, ${say(avg2(xs, 'untracked'))} of the waking day was untracked and ${say(avg2(xs, 'drifted'))} was in stretches you read as drifted — against ${say(avg2(base, 'untracked'))} and ${say(avg2(base, 'drifted'))} on the days overall.`});
  });
  if(!lines.length) return null;
  return {lines, rule: 'Worked out as: the hours between the wake and bed times for the day (the defaults in Settings when none were written), less the time tracked; “drifted” is the time in stretches you marked drifted. Only days with something tracked, and only reasons given on at least three days. It sets what you said beside what was recorded; it does not say which is right.'};
}
function habMissInsightHTML(h){
  const r = habMissInsight(h);
  if(!r) return '';
  return `<div class="hb-insight">${r.lines.map(l => `<div>${esc(l.text)}</div>`).join('')}
    <details class="faint" style="font-size:.74rem;margin-top:4px"><summary>how this was worked out</summary>${esc(r.rule)}</details></div>`;
}
