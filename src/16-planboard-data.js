/* ============================================================
   THE PLANNING BOARD — what it knows

   One planning object. A task has a day it is meant to be done (its do-date),
   and a block, if you have given it an hour. The do-date stays the day; the
   block holds the hour; a block never touches the due date. A task may have
   several blocks.

   How a task shows on the board is worked out, never stored:
     ink      the do-date, and a block with a time on it
     pencil   the do-date only: in that day's "to place" tray, counted in the load
              (a stretch of do-days is a band of pencil)
     window   a due date and no do-date: a band from today to the due date, and a
              ghost on the day the work would best go, with the reason
   Ghosts and pencil move when dates, estimates or load change.

   Every number a person might want to argue with is a setting: the margin on an
   estimate, the buffer after a block, the share of the free day that may be
   planned (75%), the reserve left unscheduled. Past the cap the board says so
   and shows the rule. It never refuses.
   ============================================================ */

const PBD_DEFAULTS = {bufferMin: 15, capPct: 75, reserveMin: 45, snap: 5};
const PBD_PICK = [15, 30, 45, 60, 90];                  /* the estimates offered to an unestimated task */
const PBD_LONG = 90;                                    /* beyond this, offer to split */
const PBD_KINDS_ANCHOR = ['meal', 'commute', 'break', 'label', 'protect', 'habit'];   /* habits are laid first, so a habit block is fixed ground for the work */
const PBD_HABIT_FROM = {morning: 0, afternoon: 12 * 60, evening: 18 * 60, anytime: 0};   /* the earliest a habit of that part of the day is laid */

function pbdPrefs(){
  const p = planState().prefs = planState().prefs || {};
  const b = p.board = p.board && typeof p.board === 'object' ? p.board : {};
  const num = (k, lo, hi) => { const v = +b[k]; b[k] = isFinite(v) && b[k] !== undefined && b[k] !== '' ? Math.min(hi, Math.max(lo, Math.round(v))) : PBD_DEFAULTS[k]; };
  num('bufferMin', 0, 120); num('capPct', 30, 100); num('reserveMin', 0, 240);
  return b;
}
const pbdMarginFrac = () => (typeof fzMarginPct === 'function' ? fzMarginPct() : 25) / 100;
const pbdRound = (m, to = 5) => Math.max(to, Math.round(m / to) * to);
const pbdMin = hm => { if(!hm) return null; const [h, m] = String(hm).split(':').map(Number); return isFinite(h) ? h * 60 + (m || 0) : null; };
const pbdHM = min => { const m = Math.max(0, Math.min(1439, Math.round(min))); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const pbdSay = m => { m = Math.round(m); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`; };

/* ---------- blocks ---------- */
function pbdMigrate(){
  if(!Array.isArray(S.timeBlocks)) S.timeBlocks = [];
  S.timeBlocks.forEach(b => {
    if(!b.ref) b.ref = b.taskId ? {type: 'task', id: b.taskId} : b.habitId ? {type: 'habit', id: b.habitId} : null;
    const a = pbdMin(b.start), z = pbdMin(b.end);
    if(!(+b.durationMin > 0)) b.durationMin = a != null && z != null && z > a ? z - a : 30;
    if(b.marginMin == null) b.marginMin = 0;
    if(b.bufferMin == null) b.bufferMin = 0;
    if(b.state !== 'ink' && b.state !== 'pencil') b.state = 'ink';
    if(!b.source) b.source = 'dragged';
  });
}
function pbdBlocksOn(d){
  pbdMigrate();
  return S.timeBlocks.filter(b => b.date === d && b.state !== 'pencil').sort((x, y) => (pbdMin(x.start) || 0) - (pbdMin(y.start) || 0));
}
function pbdBlocksFor(taskId){ pbdMigrate(); return S.timeBlocks.filter(b => b.ref && b.ref.type !== 'habit' && (b.ref.id === taskId || b.taskId === taskId)); }
function pbdSetBlockTimes(b, startMin, durationMin){
  b.start = pbdHM(startMin);
  b.durationMin = Math.max(5, Math.round(durationMin != null ? durationMin : b.durationMin));
  b.end = pbdHM(Math.min(1439, startMin + b.durationMin));
  return b;
}
function pbdAddBlock(d, fields){
  pbdMigrate();
  const f = Object.assign({}, fields);
  const b = {id: uid(), date: d, kind: 'task', taskId: null, habitId: null, label: '', catId: null, notes: '', ref: null,
    durationMin: 30, marginMin: 0, bufferMin: 0, state: 'ink', source: 'dragged', start: '09:00', end: '09:30'};
  Object.assign(b, f);
  if(b.ref && b.ref.type !== 'habit'){ b.taskId = b.ref.id; b.kind = 'task'; }
  if(b.ref && b.ref.type === 'habit'){ b.habitId = b.ref.id; b.kind = 'habit'; }
  pbdSetBlockTimes(b, pbdMin(b.start) || 540, b.durationMin);
  S.timeBlocks.push(b);
  return b;
}
/* the name a block shows */
function pbdBlockLabel(b){
  if(b.ref && b.ref.type === 'habit'){ const h = byId(S.habits || [], b.ref.id); return h ? h.name : (b.label || 'a habit'); }
  if(b.ref){ let t = null; try { t = taskById(b.ref.id); } catch(e){}
    if(t && b.ref.type === 'subtask'){ const sub = (t.subtasks || []).find(x => x.id === b.ref.sub); if(sub) return sub.title || sub.text || t.title || t.text; }
    if(t) return t.title || t.text || b.label || 'a task'; }
  return b.label || b.kind;
}

/* ---------- estimates, padded ---------- */
const pbdEstOf = t => { try { return Math.round(taskEstOf(t)) || 0; } catch(e){ return 0; } };
/* what a block for this estimate is: the estimate and a margin on it, then a buffer after */
function pbdPadded(est, task){
  /* a task whose list or category has ten sittings behind it uses what they say */
  const L = task && typeof learnedMargin === 'function' ? learnedMargin(task) : null;
  const m = Math.round(est * (L ? L.frac : pbdMarginFrac()));
  const dur = pbdRound(est + m);
  return {est, marginMin: dur - est, durationMin: dur, bufferMin: pbdPrefs().bufferMin, total: dur + pbdPrefs().bufferMin, learned: L};
}

/* ---------- the day's shape ---------- */
function pbdBounds(d){
  const wake = pbdMin(dayWakeOrSetting(d)) ?? 420, bed = pbdMin(dayBedOrSetting(d)) ?? 1380;
  return {wake, bed: bed > wake ? bed : 1380, awake: Math.max(60, (bed > wake ? bed : 1380) - wake)};
}
/* what is already fixed, drawn first and never moved by a drag or by auto-placement */
function pbdAnchors(d){
  const out = [], bd = pbdBounds(d);
  (S.habits || []).forEach(h => {
    if(h.archived || h.negative || h.at == null || h.at === '') return;
    let due = false; try { due = habDue(h, d); } catch(e){}
    if(!due) return;
    /* a timed habit that has also been given a block is drawn once, as the block */
    if(pbdBlocksOn(d).some(b => b.ref && b.ref.type === 'habit' && b.ref.id === h.id)) return;
    const len = habEstimateMin(h) || 15;
    out.push({id: 'h:' + h.id, from: Math.round(+h.at * 60), to: Math.round(+h.at * 60) + len, kind: 'habit', label: h.name, fixed: true});
  });
  pbdBlocksOn(d).forEach(b => {
    if(!PBD_KINDS_ANCHOR.includes(b.kind)) return;
    const a = pbdMin(b.start); if(a == null) return;
    out.push({id: b.id, from: a, to: a + b.durationMin, kind: b.kind, label: b.kind === 'habit' ? pbdBlockLabel(b) : (b.label || b.kind), block: b});
  });
  try { (S.tasks || []).forEach(t => { if(!t.done && t.day === d && t.dueTime){ const a = pbdMin(t.dueTime);
      if(a != null) out.push({id: 'c:' + t.id, from: a, to: a + Math.max(15, Math.min(60, pbdEstOf(t) || 30)), kind: 'clock', label: t.title || t.text, fixed: true}); } }); } catch(e){}
  return out.filter(a => a.to > bd.wake && a.from < bd.bed).sort((x, y) => x.from - y.from);
}
/* the minutes in the day that are spoken for by anchors, within waking hours, counted once */
function pbdAnchorMinutes(d){
  const bd = pbdBounds(d);
  const ivs = pbdAnchors(d).map(a => [Math.max(bd.wake, a.from), Math.min(bd.bed, a.to)]).filter(([a, z]) => z > a).sort((x, y) => x[0] - y[0]);
  let total = 0, end = -1;
  ivs.forEach(([a, z]) => { if(a >= end){ total += z - a; end = z; } else if(z > end){ total += z - end; end = z; } });
  return total;
}
/* The habits due that day with no hour of their own and no block yet: they are laid
   first, and their time is spoken for before any task is counted. A habit with a time is
   already an anchor; one that is done today needs no time; one you are breaking has none. */
function pbdHabitsToPlace(d, fromMin = 0){
  const blocks = pbdBlocksOn(d).filter(b => b.ref && b.ref.type === 'habit');
  return (S.habits || []).filter(h => {
    if(h.archived || h.negative || !(habEstimateMin(h) > 0)) return false;
    if(h.at != null && h.at !== '') return false;
    let due = false; try { due = habDue(h, d); } catch(e){}
    if(!due) return false;
    if(d === today()){ let done = false; try { done = !!habitDone(h, d); } catch(e){} if(done) return false; }
    return !blocks.some(b => b.ref.id === h.id && pbdMin(b.start) + b.durationMin > fromMin);
  });
}
const pbdHabitMinutes = d => pbdHabitsToPlace(d).reduce((n, h) => n + habEstimateMin(h), 0);
/* tasks the day holds that have no hour: pencil */
function pbdPencilOn(d, extraIds = []){
  const placed = new Set(pbdBlocksOn(d).filter(b => b.ref && b.ref.type !== 'habit').map(b => b.ref.id));
  let refs = []; try { refs = tasksForDay(d).filter(r => !r.done && !r.elsewhere); } catch(e){}
  const out = refs.filter(r => !placed.has(r.id)).map(r => r.task && Object.assign({}, r));
  (extraIds || []).forEach(id => { if(!placed.has(id) && !out.some(r => r.id === id)){ const r = findTaskRef(id); if(r && !r.done) out.push(r); } });
  return out.filter(Boolean);
}
/* How full the day is. The free day is the waking hours less the anchors less
   the reserve; the cap is a share of that. Planned is every ink block (its
   padded length) and every pencilled task (its padded length, buffer too). */
function pbdCapacity(d, extraIds = []){
  const bd = pbdBounds(d), pf = pbdPrefs();
  const anchors = pbdAnchorMinutes(d), habits = pbdHabitMinutes(d);
  const free = Math.max(30, bd.awake - anchors - habits - pf.reserveMin);
  let planned = 0, unestimated = 0;
  pbdBlocksOn(d).forEach(b => { if(b.ref && b.ref.type !== 'habit' && !PBD_KINDS_ANCHOR.includes(b.kind)) planned += b.durationMin + (b.bufferMin || 0); });
  pbdPencilOn(d, extraIds).forEach(r => { const e = pbdEstOf(r.task); if(e) planned += pbdPadded(e, r.task).total; else unestimated++; });
  const pct = Math.round(planned / free * 100);
  const over = pct > pf.capPct;
  const text = over ? `Planned ${pct}% — past the ${pf.capPct}% cap`
    : pct >= pf.capPct - 10 ? `Planned ${pct}% — nearly full` : planned ? `Planned ${pct}% — room to breathe` : 'Nothing planned yet';
  const rule = `${pbdSay(bd.awake)} awake, less ${pbdSay(anchors)} already spoken for${habits ? `, ${pbdSay(habits)} for the habits still to place (they come first)` : ''} and ${pbdSay(pf.reserveMin)} kept unscheduled, leaves ${pbdSay(free)}; the cap is ${pf.capPct}% of that (${pbdSay(free * pf.capPct / 100)}). Planned counts each task’s estimate with its margin, and a ${pf.bufferMin}m buffer after.`;
  return {awake: bd.awake, anchors, habits, free, planned, pct, over, capPct: pf.capPct, text, rule, unestimated, room: Math.max(0, free * pf.capPct / 100 - planned)};
}

/* ---------- placement: ink, pencil, window ---------- */
function pbdPlacement(t, id){
  const has = pbdBlocksFor(id || t.id);
  if(t.doDay){
    const onDay = has.filter(b => b.date === t.doDay || (t.doEnd && b.date >= t.doDay && b.date <= t.doEnd));
    return onDay.length ? {state: 'ink', blocks: onDay} : {state: 'pencil', from: t.doDay, to: t.doEnd || t.doDay};
  }
  if(t.day) return {state: 'window', from: today(), to: t.day};
  return {state: 'none'};
}
/* Where a task with a due date and no do-date would best go: the latest day
   that still fits its padded estimate, moved one day earlier as a margin, and
   moved off any day that is over capacity. The reason travels with it. */
function pbdGhost(t, id){
  if(!t || t.doDay || !t.day) return null;
  const est = pbdEstOf(t); const need = est ? pbdPadded(est, t).total : pbdPadded(30).total;
  const T = today(); if(t.day < T) return {day: T, reason: 'It is overdue, so today is the earliest it can go.', overdue: true};
  const days = []; for(let d = T; d <= t.day && days.length < 60; d = addDays(d, 1)) days.push(d);
  const fits = d => pbdCapacity(d).room >= need;
  let i = days.length - 1;
  while(i >= 0 && !fits(days[i])) i--;
  if(i < 0) return {day: days[days.length - 1], reason: `No day before ${fmtDate(t.day, 'short')} has ${pbdSay(need)} of room, so it sits on the last one — something there needs to give.`, full: true};
  const latest = days[i];
  let pick = latest, why = `${fmtDate(latest, 'short')} is the latest day with ${pbdSay(need)} of room`;
  if(latest === t.day && i > 0){
    /* the due day itself leaves no margin: one day earlier, if that day has the room */
    if(fits(days[i - 1])){ pick = days[i - 1]; why += `; one day earlier (${fmtDate(pick, 'short')}) leaves a margin before it is due`; }
    else why += `, but the day before is too full to move it there`;
  } else if(latest !== t.day){
    why += `, ${daysBetween(latest, t.day)} day${daysBetween(latest, t.day) === 1 ? '' : 's'} before it is due; later days are over their cap`;
  }
  return {day: pick, reason: why + '.', need};
}
/* "Fits Wed or Thu; Fri is nearly full" — the instant preview when a due date is set */
function pbdFitsText(t, due){
  if(!due) return '';
  const est = pbdEstOf(t); const need = est ? pbdPadded(est, t).total : pbdPadded(30).total;
  const T = today(); const days = []; for(let d = T; d <= due && days.length < 14; d = addDays(d, 1)) days.push(d);
  if(!days.length) return 'That date has passed.';
  const wd = d => DOW[parseDay(d).getDay()].slice(0, 3);
  const room = days.map(d => ({d, cap: pbdCapacity(d)}));
  const fit = room.filter(x => x.cap.room >= need).map(x => wd(x.d));
  const tight = room.filter(x => x.cap.room < need && x.cap.pct >= x.cap.capPct - 10 && x.cap.room > 0).map(x => wd(x.d));
  const full = room.filter(x => x.cap.over).map(x => wd(x.d));
  const bits = [];
  bits.push(fit.length ? `Fits ${fit.slice(-2).join(' or ')}` : 'No day in the way has room for it');
  if(tight.length) bits.push(`${tight.slice(-1)[0]} is nearly full`);
  else if(full.length) bits.push(`${full.slice(-1)[0]} is over its cap`);
  return bits.join('; ') + '.' + (est ? '' : ' (No estimate yet — 30m assumed.)');
}

/* ---------- the day as references: intentions that point ---------- */
function pbdIntentionRef(plan, i){
  const refs = Array.isArray(plan.intentionRefs) ? plan.intentionRefs : [];
  return refs[i] || null;
}
function pbdSetIntentionRef(plan, i, ref){
  plan.intentionRefs = Array.isArray(plan.intentionRefs) ? plan.intentionRefs : [null, null, null];
  while(plan.intentionRefs.length < 3) plan.intentionRefs.push(null);
  plan.intentionRefs[i] = ref && ref.id ? {type: ref.type, id: ref.id} : null;
}
function pbdIntentionDone(plan, i){
  const r = pbdIntentionRef(plan, i); if(!r) return null;
  if(r.type === 'task'){ const ref = findTaskRef(r.id); return ref ? !!ref.done : null; }
  if(r.type === 'goal'){
    for(const wk of Object.keys(S.weekPlans || {})){
      const o = ((S.weekPlans[wk] || {}).outcomes || []).find(x => x.id === r.id);
      if(o){ const pr = weekGoalProgress(o); return pr ? pr.done >= pr.total && pr.total > 0 : null; }
    }
  }
  return null;
}
/* two of the three are the top two; by default the first two */
function pbdTopTwo(plan){
  const t = Array.isArray(plan.topTwo) ? plan.topTwo.filter(i => i === 0 || i === 1 || i === 2) : [];
  return t.length === 2 ? t : [0, 1];
}
function pbdTopTwoTasks(plan){
  return pbdTopTwo(plan).map(i => pbdIntentionRef(plan, i)).filter(r => r && r.type === 'task').map(r => r.id);
}

/* the pickers beside each of the day's three: what it points at, and whether it is a top-two */
function pbdIntentionOptionsHTML(plan, i, d){
  const ref = pbdIntentionRef(plan, i), top = pbdTopTwo(plan).includes(i);
  let tasks = []; try { tasks = allTaskRefs().filter(r => !r.done && r.task && !taskIsAside(r.task)).sort((a, b) => (a.day || '9999').localeCompare(b.day || '9999')).slice(0, 80); } catch(e){}
  const goals = (() => { try { return weekGoalsNamed(weekPlan(weekStart(d))); } catch(e){ return []; } })();
  const cur = ref ? `${ref.type}:${ref.id}` : '';
  return `<select class="sel pbd-intref" data-intref="${i}" aria-label="what it points at" style="max-width:210px"><option value="">no link</option>
    ${goals.length ? `<optgroup label="a goal of the week">${goals.map(o => `<option value="goal:${esc(o.id)}"${cur === 'goal:' + o.id ? ' selected' : ''}>${esc(o.text)}</option>`).join('')}</optgroup>` : ''}
    <optgroup label="a task">${tasks.map(r => `<option value="task:${esc(r.id)}"${cur === 'task:' + r.id ? ' selected' : ''}>${esc(r.text)}</option>`).join('')}</optgroup></select>
    <button type="button" class="chip sm tf-chip${top ? ' on' : ''}" data-inttop="${i}" title="one of the day\u2019s top two">top two</button>`;
}
function pbdIntentionBind(m, plan){
  m.querySelectorAll('[data-intref]').forEach(s => s.onchange = () => {
    const i = +s.dataset.intref, [type, ...rest] = (s.value || '').split(':'), id = rest.join(':');
    pbdSetIntentionRef(plan, i, s.value ? {type, id} : null);
    const inp = m.querySelector(`[data-int="${i}"]`);
    if(s.value && inp && !inp.value.trim()){ inp.value = s.options[s.selectedIndex].textContent.trim(); plan.intentions[i] = inp.value; }
    saveNow();
  });
  m.querySelectorAll('[data-inttop]').forEach(b => b.onclick = () => {
    const i = +b.dataset.inttop; let t = pbdTopTwo(plan).slice();
    if(t.includes(i)) t = t.filter(x => x !== i); else { t.push(i); if(t.length > 2) t.shift(); }
    plan.topTwo = t;
    m.querySelectorAll('[data-inttop]').forEach(x => x.classList.toggle('on', t.includes(+x.dataset.inttop)));
    saveNow();
  });
}

/* the numbers a person may argue with: Settings → The clock */
function pbdSettingsHTML(){
  const b = pbdPrefs();
  return `<div class="opt" style="display:block"><div><b>The planning board</b><div class="d">A block is the estimate plus the margin set above, then a buffer after it. The day may be planned up to the cap, measured against the waking hours less what is already spoken for and the time kept unscheduled. Past it the board says so and shows the rule; it never stops you.</div></div>
    <div class="row" style="gap:16px;flex-wrap:wrap;margin-top:8px">
      <label class="row" style="gap:6px;align-items:center"><span class="mono faint">buffer after a block</span><input class="inp" type="number" id="sPbBuf" min="0" max="120" style="width:70px" value="${b.bufferMin}"><span class="mono faint">m</span></label>
      <label class="row" style="gap:6px;align-items:center"><span class="mono faint">cap</span><input class="inp" type="number" id="sPbCap" min="30" max="100" style="width:70px" value="${b.capPct}"><span class="mono faint">%</span></label>
      <label class="row" style="gap:6px;align-items:center"><span class="mono faint">kept unscheduled</span><input class="inp" type="number" id="sPbRes" min="0" max="240" style="width:70px" value="${b.reserveMin}"><span class="mono faint">m</span></label></div></div>`;
}
function pbdSettingsBind(root){
  const q = s => (root || document).querySelector(s), b = () => pbdPrefs();
  [['#sPbBuf', 'bufferMin'], ['#sPbCap', 'capPct'], ['#sPbRes', 'reserveMin']].forEach(([sel, k]) => { const n = q(sel);
    if(n) n.onchange = () => { b()[k] = +n.value; pbdPrefs(); n.value = b()[k]; saveNow(); }; });
}
