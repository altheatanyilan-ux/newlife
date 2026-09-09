/* ============================================================
   PLANNING — the three tools: a timer, the habits, the numbers.
   ============================================================ */

/* ---------- the focus timer ----------
   One timer for the whole session, held outside any render so navigating
   away does not stop it. The panel is a view of it, not the thing itself. */
const FocusTimer = (() => {
  let st = null;        // {phase:'focus'|'short'|'long', endsAt, remaining, running, taskId, round, startedAt}
  /* A task can be chosen before the timer is started — from a task's own panel,
     which is the usual way in. There is no session to hang it on yet, so it
     waits here until one begins. */
  let pendingTask = null;
  const listeners = new Set();
  const cfg = () => planState().timer;
  const notify = () => listeners.forEach(f => { try { f(state()); } catch(e){} });
  function state(){
    if(!st) return {running:false, phase:'focus', left:cfg().focusDuration * 60, round:1, taskId:pendingTask, idle:true};
    const left = st.running ? Math.max(0, Math.round((st.endsAt - Date.now()) / 1000)) : st.remaining;
    return {running:st.running, phase:st.phase, left, round:st.round, taskId:st.taskId, idle:false};
  }
  function phaseLen(phase){
    const c = cfg();
    return (phase === 'focus' ? c.focusDuration : phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  }
  function start(taskId, phase){
    const p = phase || (st ? st.phase : 'focus');
    const secs = st && st.phase === p && !st.running && st.remaining > 0 ? st.remaining : phaseLen(p);
    st = {phase:p, running:true, endsAt:Date.now() + secs * 1000, remaining:secs,
      taskId: taskId !== undefined ? taskId : (st ? st.taskId : pendingTask),
      round: st ? st.round : 1, startedAt: st?.startedAt || new Date().toISOString()};
    tick(); notify();
  }
  function pause(){ if(!st || !st.running) return; st.remaining = Math.max(0, Math.round((st.endsAt - Date.now()) / 1000));
    st.running = false; notify(); }
  function stop(logIt = true){
    if(st && logIt && st.phase === 'focus') logSession(false);
    st = null; pendingTask = null; notify();
  }
  function skip(){ if(!st) return; finish(true); }
  /* a finished focus interval is written down; a break is not worth recording */
  function logSession(completed){
    if(!st || st.phase !== 'focus') return;
    const spent = Math.max(0, phaseLen('focus') - (st.running ? Math.round((st.endsAt - Date.now()) / 1000) : st.remaining));
    const mins = Math.round(spent / 60);
    if(mins < 1) return;
    planState().focusSessions.push({id:uid(), taskId:st.taskId || null, startedAt:st.startedAt,
      endedAt:new Date().toISOString(), duration:mins, type:'focus', completed:!!completed});
    if(st.taskId){ const t = planTaskById(st.taskId); if(t){ t.focusTime = (t.focusTime || 0) + mins; t.updatedAt = new Date().toISOString(); } }
    saveNow();
  }
  function finish(skipped){
    const c = cfg(), was = st.phase, taskId = st.taskId, round = st.round;
    if(was === 'focus') logSession(!skipped);
    const nextRound = was === 'focus' ? round + 1 : round;
    const nextPhase = was === 'focus' ? (round % c.longBreakAfter === 0 ? 'long' : 'short') : 'focus';
    st = {phase:nextPhase, running:false, remaining:phaseLen(nextPhase), endsAt:0,
      taskId, round:nextRound, startedAt:new Date().toISOString()};
    if(!skipped) sound('success');
    const auto = nextPhase === 'focus' ? c.autoStartFocus : c.autoStartBreaks;
    if(auto) start(undefined, nextPhase); else notify();
    if(!skipped) toast(nextPhase === 'focus' ? 'Break over.' : `Interval done${taskId ? '' : ''} — take ${nextPhase === 'long' ? 'the long' : 'a short'} break.`, 6000);
  }
  let timer = null;
  function tick(){
    clearTimeout(timer);
    if(!st || !st.running) return;
    const left = Math.max(0, st.endsAt - Date.now());
    if(left <= 0){ finish(false); return; }
    notify();
    timer = setTimeout(tick, 1000);
  }
  return {start, pause, stop, skip, state, reset: () => { st = null; notify(); },
    setTask(id){ pendingTask = id; if(st) st.taskId = id; notify(); },
    subscribe(f){ listeners.add(f); return () => listeners.delete(f); }};
})();

function fmtClock(secs){ return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`; }

function openFocusTimer(taskId){
  if(taskId) FocusTimer.setTask(taskId);
  const p = openPanel(`<div class="ft" id="ftPanel"></div>`, 'plan-detail focus-panel');
  const draw = () => { const box = p.querySelector('#ftPanel'); if(!box || !p.isConnected){ off(); return; }
    box.innerHTML = focusTimerHTML(); bindFocusTimer(box); };
  const off = FocusTimer.subscribe(draw);
  draw();
  return p;
}
function focusTimerHTML(){
  const s = FocusTimer.state(), c = planState().timer;
  const total = (s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60;
  const frac = total ? 1 - s.left / total : 0;
  const R = 88, C = 2 * Math.PI * R;
  const t = s.taskId ? planTaskById(s.taskId) : null;
  const label = s.phase === 'focus' ? 'Focus' : s.phase === 'long' ? 'Long break' : 'Break';
  const col = s.phase === 'focus' ? 'var(--terra)' : 'var(--sage)';
  const {ambientKind, ambientEnabled} = SoundManager.state();
  return `<div class="ft-wrap">
    ${t ? `<div class="ft-task"><span class="k mono">on</span> <b>${esc(t.text)}</b>
      <button class="pl-mini" id="ftUnlink" title="unlink">×</button></div>` : '<div class="ft-task faint mono">no task linked — the time is logged all the same</div>'}
    <div class="ft-ring">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="${R}" class="ft-track"/>
        <circle cx="100" cy="100" r="${R}" class="ft-arc" style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/>
      </svg>
      <div class="ft-face"><div class="ft-time serif">${fmtClock(s.left)}</div>
        <div class="ft-phase">${label}</div>
        <div class="ft-round mono">interval ${s.round} · long break every ${c.longBreakAfter}</div></div>
    </div>
    <div class="ft-controls">
      <button class="btn primary" id="ftGo">${s.running ? '⏸ pause' : s.left < ((s.phase === 'focus' ? c.focusDuration : s.phase === 'long' ? c.longBreak : c.shortBreak) * 60) ? '▶ resume' : '▶ start'}</button>
      <button class="btn sm ghost" id="ftSkip">skip</button>
      <button class="btn sm ghost" id="ftStop">stop</button>
    </div>
    <details class="ft-set"><summary><span class="sc">Intervals</span></summary><div class="ft-grid">
      ${[['focusDuration','focus', 1, 120],['shortBreak','short break', 1, 30],
         ['longBreak','long break', 5, 60],['longBreakAfter','long break after', 2, 8]].map(([k, n, lo, hi]) =>
        `<label class="pd-q"><span class="k">${n}</span><input class="inp mono" type="number" min="${lo}" max="${hi}" data-ftset="${k}" value="${c[k]}"></label>`).join('')}
      <label class="toggle ${c.autoStartBreaks ? 'on' : ''}" data-fttog="autoStartBreaks"><span class="sw"></span><span>start breaks by themselves</span></label>
      <label class="toggle ${c.autoStartFocus ? 'on' : ''}" data-fttog="autoStartFocus"><span class="sw"></span><span>start the next focus by itself</span></label>
    </div></details>
    <div class="ft-sound"><div class="k mono">sound under it</div>
      <div class="ft-sounds">${AMBIENT_KINDS.filter(k => k.id !== 'off').map(k =>
        `<button class="pf-chip${ambientEnabled && ambientKind === k.id ? ' on' : ''}" data-ftamb="${k.id}" title="${esc(k.desc)}">${esc(k.name)}</button>`).join('')}
        <button class="pf-chip${ambientEnabled ? '' : ' on'}" data-ftamb="off">off</button></div>
      <div class="faint" style="font-size:.72rem;margin-top:6px">The same atmosphere the rest of the house uses — it keeps playing when you leave this page.</div></div>
    ${planFocusTodayHTML()}
  </div>`;
}
function planFocusTodayHTML(){
  const T = today();
  const mine = planState().focusSessions.filter(s => s.type === 'focus' && (s.startedAt || '').slice(0, 10) === T);
  const mins = sum(mine.map(s => s.duration));
  return `<div class="ft-today"><span class="mono">today</span>
    <b>${mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : 'nothing yet'}</b>
    <span class="mono faint">${mine.length} interval${mine.length === 1 ? '' : 's'}</span></div>`;
}
function bindFocusTimer(box){
  const c = planState().timer;
  box.querySelector('#ftGo').onclick = () => { const s = FocusTimer.state();
    s.running ? FocusTimer.pause() : FocusTimer.start(undefined, s.phase); sound('click'); };
  box.querySelector('#ftSkip').onclick = () => { FocusTimer.skip(); sound('nav'); };
  box.querySelector('#ftStop').onclick = () => { FocusTimer.stop(); sound('click'); rerenderPlanBody(); };
  box.querySelector('#ftUnlink')?.addEventListener('click', () => FocusTimer.setTask(null));
  box.querySelectorAll('[data-ftset]').forEach(i => i.onchange = () => {
    const k = i.dataset.ftset; c[k] = clamp(parseInt(i.value, 10) || c[k], +i.min, +i.max); saveNow(); FocusTimer.reset(); });
  box.querySelectorAll('[data-fttog]').forEach(b => b.onclick = () => {
    const k = b.dataset.fttog; c[k] = !c[k]; b.classList.toggle('on', c[k]); saveNow(); });
  box.querySelectorAll('[data-ftamb]').forEach(b => b.onclick = () => {
    SoundManager.setAmbientKind(b.dataset.ftamb);
    box.querySelectorAll('[data-ftamb]').forEach(x => x.classList.toggle('on', x === b)); });
}

/* ---------- habits ----------
   Read and written where they already live: S.habits and S.habitLog, the
   same two the rings on Today use. Ticking one here fills the ring there. */
function planHabitList(){ return (S.habits || []).filter(h => !h.archived && !h.negative)
  .sort((a, b) => (a.order || 0) - (b.order || 0)); }
function planHabitRate(h, days = 30){
  let due = 0, done = 0;
  lastDays(days).forEach(d => { if(habitDue(h, d)){ due++; if(habitDone(h, d)) done++; } });
  return due ? Math.round(done / due * 100) : null;
}
function planHabitsHTML(){
  const hs = planHabitList(), T = today();
  if(!hs.length) return `<div class="empty">No habits yet. They live on Today as rings; here they get their streaks and their history.</div>
    <div class="row" style="margin-top:12px"><button class="btn sm" id="phNew">＋ new habit</button></div>`;
  const week = Array.from({length:7}, (_, i) => addDays(planWeekStart(T), i));
  const dueToday = hs.filter(h => habitDue(h, T));
  const overall = (() => { let due = 0, done = 0;
    lastDays(30).forEach(d => hs.forEach(h => { if(habitDue(h, d)){ due++; if(habitDone(h, d)) done++; } }));
    return due ? Math.round(done / due * 100) : null; })();

  return `<div class="ph-wrap">
    <div class="ph-sec"><div class="row between"><span class="sc" style="margin:0">Today</span>
      <span class="mono faint">${dueToday.filter(h => habitDone(h, T)).length} of ${dueToday.length} kept</span></div>
      <div class="ph-cards">${dueToday.map(h => { const st = habitStreak(h); const open = S._phOpen === h.id;
        return `<div class="ph-card${habitDone(h, T) ? ' done' : ''}${open ? ' open' : ''}" style="--c:${esc(h.color || 'var(--sage)')}">
          <div class="ph-top">
            <button class="pt-box" data-phtick="${h.id}" role="checkbox" aria-checked="${!!habitDone(h, T)}"
              style="--pc:${esc(h.color || 'var(--sage)')}"><svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
            <span class="ph-face">${esc(h.icon || '◍')}</span>
            <button class="ph-name" data-phopen="${h.id}">${esc(h.name)}</button>
            <span class="ph-streak mono" title="current streak">${st.cur ? `▲ ${st.cur}` : '—'}</span></div>
          ${open ? planHabitDetailHTML(h) : ''}</div>`; }).join('')
        || '<div class="pk-empty">Nothing due today.</div>'}</div></div>

    <div class="ph-sec"><span class="sc">This week</span>
      <div class="ph-week"><div class="ph-wrow head"><span></span>
        ${week.map(d => `<span class="mono${d === T ? ' now' : ''}">${['M','T','W','T','F','S','S'][(parseDay(d).getDay() + 6) % 7]}</span>`).join('')}</div>
        ${hs.map(h => `<div class="ph-wrow"><span class="ph-wname">${esc(h.icon || '◍')} ${esc(h.name)}</span>
          ${week.map(d => { const due = habitDue(h, d), done = habitDone(h, d);
            return `<button class="ph-cell${done ? ' on' : ''}${due ? '' : ' off'}" data-phcell="${h.id}:${d}"
              style="--c:${esc(h.color || 'var(--sage)')}" title="${esc(fmtDate(d, 'med'))}${due ? '' : ' — not scheduled'}"></button>`; }).join('')}
        </div>`).join('')}</div></div>

    <div class="ph-sec"><div class="row between"><span class="sc" style="margin:0">Over thirty days</span>
      <span class="mono faint">${overall == null ? 'nothing scheduled' : overall + '% kept'}</span></div>
      <div class="ph-stats">${hs.map(h => { const r = planHabitRate(h), st = habitStreak(h);
        return `<div class="ph-stat"><span class="ph-sname">${esc(h.icon || '◍')} ${esc(h.name)}</span>
          <div class="bar" style="--c:${esc(h.color || 'var(--sage)')}"><i style="width:${r || 0}%"></i></div>
          <span class="mono">${r == null ? '—' : r + '%'}</span>
          <span class="mono faint" title="current / best streak">${st.cur} / ${st.best}</span></div>`; })
        .join('')}</div></div>

    <div class="ph-sec"><span class="sc">Ninety days</span>
      <div class="ph-heat">${planHabitHeatHTML(hs)}</div>
      <div class="ph-legend mono"><span>none</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>all of them</span></div></div>
    <div class="row" style="margin-top:14px"><button class="btn sm" id="phNew">＋ new habit</button></div>
  </div>`;
}
function planHabitDetailHTML(h){
  const r30 = planHabitRate(h), st = habitStreak(h);
  const total = lastDays(365).filter(d => habitDone(h, d)).length;
  return `<div class="ph-detail">
    <div class="ph-mini">${lastDays(30).map(d => { const due = habitDue(h, d), done = habitDone(h, d);
      return `<i class="${done ? 'on' : due ? '' : 'off'}" title="${esc(fmtDate(d, 'short'))}"></i>`; }).join('')}</div>
    <div class="ph-facts mono"><span>${r30 == null ? '—' : r30 + '% over 30 days'}</span>
      <span>best run ${st.best}</span><span>${total} in a year</span></div></div>`;
}
function planHabitHeatHTML(hs){
  const days = lastDays(91);
  return heatGrid(days, 13, d => {
    const due = hs.filter(h => habitDue(h, d)); if(!due.length) return '';
    const done = due.filter(h => habitDone(h, d)).length;
    const f = done / due.length;
    return f >= 1 ? 'l3' : f >= .6 ? 'l2' : f > 0 ? 'l1' : '';
  }, 'heat ph-heatgrid');
}
function bindPlanHabits(root){
  $$('[data-phtick]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const id = b.dataset.phtick, T = today();
    S.habitLog[T] = S.habitLog[T] || {};
    if(S.habitLog[T][id]) delete S.habitLog[T][id]; else S.habitLog[T][id] = {level:'full'};
    saveNow(); sound(S.habitLog[T][id] ? 'success' : 'click'); rerenderPlanBody(); });
  $$('[data-phcell]', root).forEach(b => b.onclick = () => {
    const [id, d] = b.dataset.phcell.split(':');
    S.habitLog[d] = S.habitLog[d] || {};
    if(S.habitLog[d][id]) delete S.habitLog[d][id]; else S.habitLog[d][id] = {level:'full'};
    saveNow(); sound('click'); rerenderPlanBody(); });
  $$('[data-phopen]', root).forEach(b => b.onclick = () => {
    S._phOpen = S._phOpen === b.dataset.phopen ? null : b.dataset.phopen; rerenderPlanBody(); });
  const nb = $('#phNew'); if(nb) nb.onclick = () => { if(typeof openHabitModal === 'function') openHabitModal(); };
}

/* ---------- statistics ---------- */
function planStatsHTML(){
  const T = today(), all = planOwnTasks(), p = planState();
  const doneOn = d => all.filter(t => t.done && t.doneAt === d).length;
  const week = lastDays(7), month = lastDays(30);
  const dToday = doneOn(T), dWeek = sum(week.map(doneOn)), dMonth = sum(month.map(doneOn));
  const overdue = all.filter(planIsLate);
  const dueLast30 = all.filter(t => t.day && t.day >= addDays(T, -30) && t.day <= T);
  const rate = dueLast30.length ? Math.round(dueLast30.filter(t => t.done).length / dueLast30.length * 100) : null;
  const ages = all.filter(t => t.done && t.doneAt && t.createdAt)
    .map(t => daysBetween(t.createdAt.slice(0, 10), t.doneAt)).filter(n => n >= 0);
  const avgAge = ages.length ? (sum(ages) / ages.length) : null;

  const sess = p.focusSessions.filter(s => s.type === 'focus');
  const fOn = d => sum(sess.filter(s => (s.startedAt || '').slice(0, 10) === d).map(s => s.duration));
  const fToday = fOn(T), fWeek = sum(week.map(fOn)), fMonth = sum(month.map(fOn));
  const best = month.map(d => ({d, m:fOn(d)})).sort((a, b) => b.m - a.m)[0];
  const byTask = {};
  sess.forEach(s => { if(!s.taskId) return; byTask[s.taskId] = (byTask[s.taskId] || 0) + s.duration; });
  const topTasks = Object.entries(byTask).map(([id, m]) => ({t:planTaskById(id), m}))
    .filter(x => x.t).sort((a, b) => b.m - a.m).slice(0, 5);

  const hrs = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  const score = planProductivityScore(T);
  const trend = lastDays(30).map(d => planProductivityScore(d));

  const byPrio = PLAN_PRIORITY.slice().reverse().map(x => ({n:x.name, c:x.color || 'var(--faint)',
    v:all.filter(t => !t.done && t.priority === x.n).length}));
  const byList = planLists().map(l => ({n:l.name, c:l.color, v:all.filter(t => !t.done && t.listId === l.id).length}))
    .filter(x => x.v).sort((a, b) => b.v - a.v);
  const byTag = p.tags.map(t => ({n:t.name, c:t.color, v:planTagCount(t.name)})).filter(x => x.v).sort((a, b) => b.v - a.v);
  const bars = rows => { const max = Math.max(1, ...rows.map(r => r.v));
    return `<div class="ps-bars">${rows.map(r => `<div class="ps-bar"><span>${esc(r.n)}</span>
      <div class="bar" style="--c:${r.c}"><i style="width:${Math.round(r.v / max * 100)}%"></i></div>
      <span class="mono">${r.v}</span></div>`).join('') || '<div class="pk-empty">Nothing to count yet.</div>'}</div>`; };

  return `<div class="ps">
    <div class="ps-row">
      <div class="ps-tile"><div class="k mono">finished today</div><div class="ps-n serif">${dToday}</div>
        ${sparkline(week.map(doneOn), {h:34, min:0, color:'var(--terra)'})}<div class="sub">${dWeek} this week · ${dMonth} this month</div></div>
      <div class="ps-tile"><div class="k mono">kept to the date</div><div class="ps-n serif">${rate == null ? '—' : rate + '%'}</div>
        <div class="sub">${dueLast30.length} tasks fell due in the last month${rate == null ? '' : `, ${dueLast30.filter(t => t.done).length} of them done`}</div></div>
      <div class="ps-tile"><div class="k mono">overdue now</div><div class="ps-n serif" style="${overdue.length ? 'color:var(--gold)' : ''}">${overdue.length}</div>
        <div class="sub">${overdue.length ? `oldest is ${daysSince(overdue.map(t => t.day).sort()[0])} days past` : 'nothing is late'}</div></div>
      <div class="ps-tile"><div class="k mono">from writing it to doing it</div>
        <div class="ps-n serif">${avgAge == null ? '—' : avgAge.toFixed(1)}<small>days</small></div>
        <div class="sub">across ${ages.length} finished task${ages.length === 1 ? '' : 's'}</div></div>
    </div>

    <div class="ps-row">
      <div class="ps-tile"><div class="k mono">focus today</div><div class="ps-n serif">${hrs(fToday)}</div>
        ${sparkline(week.map(fOn), {h:34, min:0, color:'var(--sage)'})}
        <div class="sub">${hrs(fWeek)} this week · ${hrs(fMonth)} this month · avg ${hrs(Math.round(fMonth / 30))} a day</div></div>
      <div class="ps-tile"><div class="k mono">intervals</div><div class="ps-n serif">${sess.filter(s => s.completed).length}</div>
        <div class="sub">${sess.length} started · ${best && best.m ? `best day ${fmtDate(best.d, 'med')}, ${hrs(best.m)}` : 'no best day yet'}</div></div>
      <div class="ps-tile ps-score"><div class="k mono">the day, scored</div>
        ${ringSVG(score / 100, {size:74, stroke:7, color:score >= 66 ? 'var(--sage)' : score >= 33 ? 'var(--gold)' : 'var(--terra)', label:String(score)})}
        ${sparkline(trend, {h:30, min:0, max:100, color:'var(--page-accent)'})}
        <div class="sub">what was finished, what was focused on, and what is late</div></div>
    </div>

    <div class="ps-sec"><span class="sc">Where the focus went</span>
      ${topTasks.length ? `<div class="ps-bars">${topTasks.map(x => { const max = topTasks[0].m;
        return `<div class="ps-bar"><span>${esc(x.t.text)}</span><div class="bar" style="--c:var(--sage)">
          <i style="width:${Math.round(x.m / max * 100)}%"></i></div><span class="mono">${hrs(x.m)}</span></div>`; }).join('')}</div>`
        : '<div class="pk-empty">No focus time has been logged against a task yet.</div>'}</div>

    <div class="ps-sec"><span class="sc">Ninety days of focus</span>
      ${heatGrid(lastDays(91), 13, d => { const m = fOn(d); return m >= 120 ? 'l3' : m >= 50 ? 'l2' : m > 0 ? 'l1' : ''; }, 'heat ph-heatgrid')}
    </div>

    <div class="ps-three">
      <div><span class="sc">By priority</span>${bars(byPrio)}</div>
      <div><span class="sc">By list</span>${bars(byList)}</div>
      <div><span class="sc">By tag</span>${bars(byTag)}</div>
    </div>
  </div>`;
}
/* One number for a day: what was finished against what was due, the focus
   time against an hour's target, a penalty for what is late, and the steps
   ticked off inside tasks. It is a rough instrument and says so. */
function planProductivityScore(day){
  const all = planOwnTasks();
  const due = all.filter(t => t.day === day);
  const done = due.filter(t => t.done).length;
  const doneShare = due.length ? done / due.length : (all.some(t => t.doneAt === day) ? 1 : 0);
  const mins = sum(planState().focusSessions.filter(s => s.type === 'focus' && (s.startedAt || '').slice(0, 10) === day)
    .map(s => s.duration));
  const focusShare = clamp(mins / 120, 0, 1);
  const late = all.filter(t => !t.done && t.day && t.day < day).length;
  const penalty = Math.min(.2, late * .04);
  const steps = all.filter(t => t.subtasks.length);
  const stepShare = steps.length
    ? sum(steps.map(t => t.subtasks.filter(s => s.isCompleted).length)) / sum(steps.map(t => t.subtasks.length)) : 0;
  return Math.round(clamp(doneShare * .4 + focusShare * .3 + stepShare * .1 + .2 - penalty, 0, 1) * 100);
}
