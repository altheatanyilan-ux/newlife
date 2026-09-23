/* ============================================================
   THE PRACTICE ROOM — today's plan, the session, and where you are.

   Three views that are really one: what to do now, what you are doing, and
   what it adds up to. They are separate pages rather than sections of the
   roadmap because the roadmap is a map and this is an instruction, and a
   page that is both is a page you scroll past.
   ============================================================ */

/* ---------- the stage header ---------- */
function jazzStageHeadHTML(stage){
  const p = jazzPaceOf(stage.id);
  const r = jazzStageRecord(stage.id);
  const got = jazzStageGot(stage);
  const streak = jazzStreak();
  const mastered = JAZZ_KEY_NAMES.filter(k => stage.subs.some(id => jazzRecord(id).keys[k]));
  if(r.status !== 'active' && r.status !== 'completed'){
    return `<div class="jz-head">
      <div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
        <b class="serif">${esc(stage.name)}</b>
        <span class="mono faint">${esc(jazzPlanTemplate(stage.id)
          ? `${jazzPlanTemplate(stage.id).hours} hours · ${jazzPlanTemplate(stage.id).days} days at the standard pace`
          : '')}</span>
      </div>
      <p class="jz-headwhy">Starting a stage sets a benchmark and gives you a plan for the day.
        Nothing is locked either way — it is a line to measure against, not a gate.</p>
      <div class="jz-pacepick">${JAZZ_PACE_IDS.map(id => { const q = jazzPace(id);
        const t = jazzPlanTemplate(stage.id) || {hours: 30, days: 14};
        return `<button class="jz-pace" data-jzstart="${esc(stage.id)}" data-jzpace="${id}">
          <b>${esc(q.name)}</b>
          <span class="mono">${jazzPaceMinutes(id, stage.id)} min a day · about ${
            Math.round(t.days * q.stretch)} days</span>
          <span class="d">${esc(q.who)}</span></button>`; }).join('')}</div>
    </div>`;
  }
  const done = r.status === 'completed';
  return `<div class="jz-head${done ? ' done' : ''}" data-jzpace="${esc(p.status)}">
    <div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
      <b class="serif">${esc(stage.name)}</b>
      <span class="mono jz-headtag">${done ? '✓ finished' : `day ${p.day} of ${p.targetDays}`}</span>
    </div>
    <div class="jz-headline mono">${p.hours} of ${p.targetHours} hours
      · the line today is ${p.expected}</div>
    <div class="jz-sbar"><i style="width:${p.pct}%"></i></div>
    <p class="jz-pacesaid">${esc(jazzPaceSaid(stage.id))}</p>
    <div class="jz-headstats mono">
      <span>\u{1f525} ${streak.now} day streak</span>
      <span>\u{1f3af} ${mastered.length}/12 keys</span>
      <span>${jazzStageSessions(stage.id).length} session${jazzStageSessions(stage.id).length === 1 ? '' : 's'}</span>
      <span>${got.done}/${got.of} marked off</span>
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
      ${done ? `<button class="btn sm ghost" data-jzreopen="${esc(stage.id)}">Open it again</button>`
        : `<button class="btn sm primary" id="jzPlanGo">\u{1f4cb} Today’s plan</button>
           <button class="btn sm ghost" id="jzProgGo">\u{1f4ca} Where I am</button>`}
    </div>
  </div>`;
}

/* ---------- today's plan ---------- */
function jazzPlanHTML(){
  const stage = jazzActiveStage();
  if(!stage) return '<div class="empty">There is no stage to plan for yet.</div>';
  const open = jazzSessionOpen();
  const plan = jazzTodaysPlan(stage.id);
  const started = jazzStageStatus(stage.id) === 'active';
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Today’s practice</h1>
      <button class="btn sm ghost" id="jzPback">← the roadmap</button></div>
    ${jazzTipOfDayHTML()}
    ${jazzStageHeadHTML(stage)}
    ${typeof jazzCurrentUnitSummaryHTML === 'function' ? jazzCurrentUnitSummaryHTML() : ''}
    ${!started ? '' : !plan ? '<div class="empty">This stage has no plan template yet.</div>' : `
    <div class="jz-plan">
      <div class="row between" style="align-items:baseline">
        <span class="sc">Meeting the benchmark</span>
        <span class="mono faint">about ${plan.totalMinutes} min · set ${esc(plan.set)}</span>
      </div>
      <!-- how long you have today. The short budgets rotate through the four
           parts rather than shrinking all of them into uselessness. -->
      <div class="jz-budget">
        <span class="sc">Time today</span>
        <div class="jz-budget-picks">${JAZZ_BUDGETS.map(b =>
          `<button class="jz-budget-pick${b.id === plan.budget ? ' on' : ''}"
            data-jzbudget="${esc(b.id)}">${b.minutes >= 180 ? '3 hr +'
              : b.minutes >= 120 ? '2 hr' : b.minutes >= 60 ? '1 hr' : '30 min'}</button>`).join('')}</div>
        <p class="jz-budget-note">${esc(plan.budgetName)} — ${esc(plan.budgetNote)}${
          plan.dropped.length ? ` Today skips ${esc(plan.dropped.join(', '))}.` : ''}</p>
      </div>
      ${plan.focus ? `<div class="jz-focus">
        <span class="sc">Focus, from your last self-analysis</span>
        <p class="serif">${esc(plan.focus)}</p>
        <p class="mono faint">you wrote this after recording ${esc(plan.analysisTune || 'a take')}</p>
      </div>` : ''}
      ${plan.required.map((b, i) => jazzPlanBlockHTML(b, i)).join('')}
      ${(plan.material || []).length ? `<div class="jz-matdue">
        <span class="sc">From this stage’s unit assignments</span>
        <p class="mono faint">least practised first — the rest of the stage is on the roadmap</p>
        ${plan.material.map(m => `<a class="jz-matdue-row" href="#/jazz/${esc(m.id)}">
          <span class="jz-matdue-name">${esc(m.name)}</span>
          <span class="mono jz-matdue-meta">${m.keys ? `${m.keys}/12 keys` : 'not started'}${
            m.last == null ? '' : ` · ${esc(relDays(m.last))}`}</span></a>`).join('')}
      </div>` : ''}
      ${plan.track ? jazzListenBlockHTML(plan) : ''}
      ${plan.bonus.length ? `<div class="sc" style="margin-top:16px">Exceeding it</div>
        ${plan.bonus.map((b, i) => `<div class="jz-block bonus">
          <div class="jz-bhead"><span class="jz-bi">⭐</span>
            <b>${esc(b.name)}</b><span class="mono jz-bmin">${b.minutes} min</span></div>
          <p class="jz-bwhat">${esc(b.description)}</p>
          <p class="jz-bwhy mono">${esc(b.why)}</p></div>`).join('')}` : ''}
      <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap">
        ${open ? `<button class="btn primary" id="jzSessOpen">⏱ The session is running — open it</button>`
          : `<button class="btn primary" id="jzSessStart">▶ Start the session</button>`}
        <button class="btn sm ghost" id="jzProgGo">\u{1f4ca} Where I am</button>
      </div>
    </div>`}`;
}
function jazzPlanBlockHTML(b, i){
  return `<div class="jz-block">
    <div class="jz-bhead"><span class="jz-bi">${jazzPartIcon(b.category)}</span>
      <b>${esc(b.name)}</b><span class="mono jz-bmin">${b.minutes} min</span></div>
    <p class="jz-bwhat">${esc(b.description)}</p>
    ${b.keys.length ? `<p class="jz-bkeys mono">keys today · ${
      b.keys.map(k => esc(jazzPretty(k))).join('  ')}</p>` : ''}
    ${b.exercises.length ? `<p class="jz-bex mono">${b.exercises.map(id => {
      const ex = jazzExercise(id);
      return `<a href="#/jazz/${esc(id)}">${esc(id)} ${esc(ex ? ex.name : '')}</a>`; }).join(' · ')}
      <em>${esc(b.why)}</em></p>` : ''}
    <button class="tbtn jz-tick" data-jzdo="${i}">+ did this</button>
  </div>`;
}
function jazzListenBlockHTML(plan){
  const t = plan.track;
  const done = plan.plays >= plan.target;
  return `<div class="jz-block listen${done ? ' done' : ''}">
    <div class="jz-bhead"><span class="jz-bi">\u{1f3a7}</span>
      <b>${esc(t.artist)} — ${esc(t.track)}</b>
      <span class="mono jz-bmin">${plan.plays}/${plan.target}</span></div>
    <p class="jz-bwhat">${esc(t.listenFor || '')}</p>
    <div class="jz-lbar"><i style="width:${Math.min(100, Math.round(plan.plays / plan.target * 100))}%"></i></div>
    <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
      <button class="tbtn" data-jzlisten="1">+ listened once</button>
      ${plan.plays ? '<button class="tbtn" data-jzlisten="-1">− undo</button>' : ''}
      ${done ? '<span class="mono jz-fixed">✓ twenty, as the book asks</span>' : ''}
    </div>
  </div>`;
}

/* ---------- the session as it happens ---------- */
function jazzSessionHTML(){
  const s = jazzSessionOpen();
  if(!s) return '<div class="empty">No session is running.</div>';
  const stage = jazzStage(s.stageId) || jazzActiveStage();
  const plan = stage ? jazzTodaysPlan(stage.id) : null;
  const ticked = sum(s.activities.map(a => +a.minutes || 0));
  const done = {};
  s.activities.forEach(a => { done[a.name] = true; });
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">The session</h1>
      <span class="mono" id="jzSessClock">${esc(jazzSessionClock(s))}</span></div>
    <p class="page-blurb">Tick things off as you do them. What you tick becomes a sitting on
      the exercise as well, so the two records never disagree.</p>
    <div class="jz-sess">
      ${(plan ? plan.required : []).map((b, i) => `<div class="jz-srow${done[b.name] ? ' on' : ''}">
        <span class="jz-bi">${jazzPartIcon(b.category)}</span>
        <span class="jz-sname">${esc(b.name)}${b.keys.length
          ? `<em class="mono">${b.keys.map(k => esc(jazzPretty(k))).join(' ')}</em>` : ''}</span>
        <span class="mono faint">${b.minutes}m</span>
        <button class="tbtn" data-jzdo="${i}">${done[b.name] ? 'again' : 'did it'}</button>
      </div>`).join('')}
      <div class="row" style="gap:8px;margin-top:10px">
        <button class="tbtn" id="jzAddOther">+ something else</button>
      </div>
      ${s.activities.length ? `<div class="sc" style="margin-top:16px">So far</div>
        ${s.activities.map(a => `<div class="jz-sdone">
          <span class="jz-bi">${jazzPartIcon(a.category)}</span>
          <span class="jz-sname">${esc(a.name)}${a.keys.length
            ? `<em class="mono">${a.keys.map(k => esc(jazzPretty(k))).join(' ')}</em>` : ''}</span>
          <span class="mono">${a.minutes}m</span>
          <span class="mono faint">${esc((JAZZ_QUALITY.find(q => q[0] === a.rating) || [])[1] || '')}</span>
          <button class="tbtn danger" data-jzundo="${esc(a.id)}">×</button>
          ${a.note ? `<p class="jz-lognote">${esc(a.note)}</p>` : ''}
        </div>`).join('')}
        <div class="jz-count mono">${ticked} minutes ticked off</div>` : ''}
      <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="btn primary" id="jzSessEnd">⏹ End the session</button>
        <button class="btn sm ghost" id="jzSessBack">back to the plan</button>
        <span class="grow"></span>
        <button class="btn sm ghost danger" id="jzSessDrop">throw it away</button>
      </div>
    </div>`;
}
function jazzSessionClock(s){
  const secs = Math.max(0, Math.floor((Date.now() - Date.parse(s.start)) / 1000));
  const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, x = secs % 60;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
}

/* ---------- where I am ---------- */
function jazzProgressHTML(){
  const ladder = jazzStages();
  const active = ladder.filter(s => jazzStageStatus(s.id) === 'active');
  const done = ladder.filter(s => jazzStageStatus(s.id) === 'completed');
  const streak = jazzStreak();
  const weeks = jazzWeeklyHours(6);
  const most = Math.max(1, ...weeks.map(w => w.hours));
  const allMins = sum(ladder.map(s => jazzStageMinutes(s.id)));
  const sessions = jazzSessions();
  const avg = sessions.length ? Math.round(sum(sessions.map(x => +x.minutes || 0)) / sessions.length) : 0;
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Where I am</h1>
      <button class="btn sm ghost" id="jzPback">← the roadmap</button></div>
    ${active.map(s => jazzStageHeadHTML(s)).join('')}
    ${active.length ? `<div class="jz-ready">
      <div class="sc">Ready to move on?</div>
      ${(() => { const r = jazzReadiness(active[0].id);
        return `${r.rows.map(row => `<div class="jz-rrow${row.ok ? ' on' : ''}">
          <span>${row.ok ? '☑' : '☐'}</span><span>${esc(row.said)}</span></div>`).join('')}
        <p class="jz-rsaid">${r.met} of ${r.of} met. These are suggestions — the button below
          works whatever they say.</p>
        <button class="btn sm primary" data-jzfinish="${esc(active[0].id)}">Finish this stage</button>`; })()}
    </div>` : ''}
    <div class="jz-stats mono">
      <span><b>${Math.round(allMins / 6) / 10}</b> hours in this room</span>
      <span><b>${streak.now}</b> day streak, best ${streak.best}</span>
      <span><b>${sessions.length}</b> sessions, ${avg} min on average</span>
    </div>
    <div class="sc" style="margin-top:18px">The last six weeks</div>
    <div class="jz-weeks">${weeks.map(w => `<div class="jz-week">
      <span class="mono jz-wk">${esc(fmtDate(w.from, 'short'))}</span>
      <span class="jz-wbar"><i style="width:${Math.round(w.hours / most * 100)}%"></i></span>
      <span class="mono jz-wh">${w.hours}h${w.now ? ' · so far' : ''}</span></div>`).join('')}</div>
    ${done.length ? `<div class="sc" style="margin-top:18px">Finished</div>
      ${done.map(s => { const r = jazzStageRecord(s.id);
        const days = r.startDate && r.completedDate ? daysBetweenDays(r.startDate, r.completedDate) + 1 : null;
        return `<div class="jz-donerow"><span>✓ ${esc(s.name)}</span>
          <span class="mono faint">${days ? days + ' days · ' : ''}${
            Math.round(jazzStageMinutes(s.id) / 6) / 10} hours</span></div>`; }).join('')}` : ''}
    <div class="sc" style="margin-top:18px">Sessions</div>
    ${sessions.length ? sessions.slice(0, 12).map(s => `<div class="jz-hsess">
      <div class="row between"><span class="sc">${esc(fmtDate(s.day, 'med'))}</span>
        <span class="mono">${s.minutes} min${s.paceStatus ? ' · ' + esc(s.paceStatus.replace('_', ' ')) : ''}</span></div>
      ${s.activities.map(a => `<div class="jz-log"><span>${jazzPartIcon(a.category)} ${esc(a.name)}</span>
        <span class="mono faint">${a.minutes}m${a.keys.length ? ' · ' + a.keys.map(jazzPretty).join(' ') : ''}</span></div>`).join('')}
      ${s.notes ? `<p class="jz-lognote">${esc(s.notes)}</p>` : ''}
    </div>`).join('') : '<div class="empty">No sessions logged yet.</div>'}
    <div class="row" style="margin-top:16px"><button class="btn sm ghost" id="jzExport">⬇ Export the log</button></div>`;
}

/* ---------- the doors between them ---------- */
let _jzSessTick = null;
function bindJazzPlan(root){
  const ui = jazzUi();
  bindJazzTips(root);
  $$('[data-jzbudget]', root).forEach(b => b.onclick = () => {
    jazzSetSessionBudget(b.dataset.jzbudget); sound('click'); rerender(); });
  const back = root.querySelector('#jzPback');
  if(back) back.onclick = () => navigate('#/jazz');
  const prog = root.querySelector('#jzProgGo');
  if(prog) prog.onclick = () => navigate('#/jazz/progress');
  const goPlan = root.querySelector('#jzPlanGo');
  if(goPlan) goPlan.onclick = () => navigate('#/jazz/plan');

  $$('[data-jzstart]', root).forEach(b => b.onclick = () => {
    jazzStartStage(b.dataset.jzstart, b.dataset.jzpace);
    sound('success');
    toast(`Started. ${jazzPaceMinutes(b.dataset.jzpace, b.dataset.jzstart)} minutes a day is the line.`, 5000);
    rerender();
  });
  $$('[data-jzreopen]', root).forEach(b => b.onclick = () => {
    jazzReopenStage(b.dataset.jzreopen); sound('click'); rerender(); });
  $$('[data-jzfinish]', root).forEach(b => b.onclick = () => {
    const r = jazzReadiness(b.dataset.jzfinish);
    jazzCompleteStage(b.dataset.jzfinish);
    sound('success');
    toast(r.met === r.of ? 'Finished, and every criterion met.'
      : `Finished. ${r.met} of ${r.of} criteria were met — which is your call to make.`, 6000);
    rerender();
  });
  $$('[data-jzlisten]', root).forEach(b => b.onclick = () => {
    const stage = jazzActiveStage();
    const track = stage && jazzTodaysTrack(stage);
    if(!track) return;
    const n = +b.dataset.jzlisten > 0 ? jazzMarkListened(track) : jazzUnmarkListened(track);
    sound(+b.dataset.jzlisten > 0 ? 'success' : 'click');
    if(n === JAZZ_LISTEN_TARGET) toast('Twenty. That is the one instruction in the book nobody counts.', 6000);
    rerender();
  });

  /* ticking a block off, from the plan or from inside a session */
  $$('[data-jzdo]', root).forEach(b => b.onclick = () => {
    const stage = jazzActiveStage();
    const plan = stage && jazzTodaysPlan(stage.id);
    const block = plan && plan.required[+b.dataset.jzdo];
    if(!block) return;
    if(!jazzSessionOpen()) jazzStartSession(stage.id);
    openJazzActivity(block);
  });
  $$('[data-jzundo]', root).forEach(b => b.onclick = () => {
    jazzSessionDrop(b.dataset.jzundo); sound('click'); rerender(); });

  const start = root.querySelector('#jzSessStart');
  if(start) start.onclick = () => {
    jazzStartSession(jazzActiveStage().id); sound('success'); navigate('#/jazz/session'); };
  const open = root.querySelector('#jzSessOpen');
  if(open) open.onclick = () => navigate('#/jazz/session');

  const ex = root.querySelector('#jzExport');
  if(ex) ex.onclick = () => {
    const blob = new Blob([jazzExportLog()], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `jazz-practice-log-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    sound('success'); toast('Saved.');
  };
}
function bindJazzSession(root){
  bindJazzPlan(root);
  const back = root.querySelector('#jzSessBack');
  if(back) back.onclick = () => navigate('#/jazz/plan');
  const other = root.querySelector('#jzAddOther');
  if(other) other.onclick = () => openJazzActivity(null);
  const end = root.querySelector('#jzSessEnd');
  if(end) end.onclick = () => openJazzSessionEnd();
  const drop = root.querySelector('#jzSessDrop');
  if(drop) drop.onclick = () => {
    if(!confirm('Throw this session away without writing it down?')) return;
    jazzAbandonSession(); sound('click'); navigate('#/jazz/plan');
  };
  /* the clock, ticking on its own rather than on a redraw */
  if(_jzSessTick) clearInterval(_jzSessTick);
  _jzSessTick = setInterval(() => {
    const s = jazzSessionOpen();
    const face = document.getElementById('jzSessClock');
    if(!s || !face){ clearInterval(_jzSessTick); _jzSessTick = null; return; }
    face.textContent = jazzSessionClock(s);
  }, 1000);
}

/* ---------- ticking one thing off ---------- */
function openJazzActivity(block){
  const stage = jazzActiveStage();
  const b = block || {category:'rote', name:'', description:'', minutes: 15, keys: [], exercises: []};
  const ids = (stage && stage.subs) || [];
  const m = openModal(`<h2>${b.name ? esc(b.name) : 'Something else'}</h2>
    ${b.description ? `<p class="faint" style="font-size:.85rem">${esc(b.description)}</p>` : ''}
    ${b.name ? '' : `<label class="pd-q"><span class="k">what</span>
      <input class="inp" id="jaName" autofocus placeholder="scales, or a tune, or whatever it was"></label>`}
    <div class="row" style="gap:10px;margin-top:10px">
      <label class="pd-q" style="flex:1"><span class="k">minutes</span>
        <input class="inp mono" type="number" min="0" max="600" id="jaMins" value="${b.minutes || 15}"></label>
      <label class="pd-q" style="flex:1"><span class="k">how it went</span>
        <select class="sel" id="jaQ">${JAZZ_QUALITY.map(q =>
          `<option value="${q[0]}" ${q[0] === 'improving' ? 'selected' : ''}>${q[1]}</option>`).join('')}</select></label>
    </div>
    ${b.name ? '' : `<label class="pd-q" style="margin-top:10px"><span class="k">which part</span>
      <select class="sel" id="jaCat">${JAZZ_PARTS.map(pt =>
        `<option value="${pt[0]}">${pt[2]} ${pt[1]}</option>`).join('')}</select></label>`}
    <div class="pd-q" style="margin-top:10px"><span class="k">keys worked</span>
      <div class="jz-keypick" id="jaKeys">${JAZZ_KEY_NAMES.map(k =>
        `<button class="jz-k${(b.keys || []).includes(k) ? ' on' : ''}" data-jak="${esc(k)}">${esc(jazzPretty(k))}</button>`).join('')}</div></div>
    ${ids.length ? `<label class="pd-q" style="margin-top:10px"><span class="k">against which exercise</span>
      <select class="sel" id="jaEx"><option value="">— none in particular —</option>${ids.map(id => {
        const x = jazzExercise(id);
        return `<option value="${esc(id)}" ${(b.exercises || [])[0] === id ? 'selected' : ''}>${
          esc(id)} ${esc(x ? x.name : '')}</option>`; }).join('')}</select></label>` : ''}
    <label class="pd-q" style="margin-top:10px"><span class="k">a note</span>
      <input class="inp" id="jaNote" placeholder="D flat still shaky, A flat surprisingly good"></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="jaSave">Tick it off</button></div>`, 'narrow');
  const picked = new Set(b.keys || []);
  m.querySelectorAll('[data-jak]').forEach(btn => btn.onclick = ev => {
    ev.preventDefault();
    const k = btn.dataset.jak;
    picked.has(k) ? picked.delete(k) : picked.add(k);
    btn.classList.toggle('on', picked.has(k));
  });
  m.querySelector('#jaSave').onclick = () => {
    const nameEl = m.querySelector('#jaName'), catEl = m.querySelector('#jaCat');
    const exEl = m.querySelector('#jaEx');
    jazzSessionAdd({category: b.name ? b.category : (catEl ? catEl.value : 'rote'),
      name: b.name || (nameEl && nameEl.value.trim()) || 'something',
      minutes: +m.querySelector('#jaMins').value || 0,
      keys: [...picked], rating: m.querySelector('#jaQ').value,
      exerciseId: exEl && exEl.value ? exEl.value : ((b.exercises || [])[0] || null),
      note: m.querySelector('#jaNote').value.trim()});
    m.remove(); sound('success');
    if(!location.hash.startsWith('#/jazz/session')) navigate('#/jazz/session');
    else rerender();
  };
  return m;
}
function openJazzSessionEnd(){
  const s = jazzSessionOpen();
  if(!s) return null;
  const ticked = sum(s.activities.map(a => +a.minutes || 0));
  const clocked = Math.max(0, Math.round((Date.now() - Date.parse(s.start)) / 60000));
  const m = openModal(`<h2>End the session</h2>
    <p class="faint" style="font-size:.85rem">You ticked off ${ticked} minutes and the clock has run
      for ${clocked}. Whichever is truer.</p>
    <label class="pd-q"><span class="k">minutes</span>
      <input class="inp mono" type="number" min="0" max="900" id="jeMins" value="${ticked || clocked}"></label>
    <div class="pd-q" style="margin-top:10px"><span class="k">how did it feel</span>
      <div class="row" style="gap:6px;flex-wrap:wrap">${
        [['frustrated','\u{1f625} frustrated'], ['okay','\u{1f610} okay'],
         ['good','\u{1f642} good'], ['great','\u{1f60a} great']].map(([v, l]) =>
        `<button class="btn sm ghost" data-jef="${v}">${l}</button>`).join('')}</div></div>
    <label class="pd-q" style="margin-top:10px"><span class="k">anything worth remembering</span>
      <textarea class="inp" rows="3" id="jeNote" placeholder="The join between G flat and E is the thing to work on tomorrow."></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="jeSave">Write it down</button></div>`, 'narrow');
  let feeling = null;
  m.querySelectorAll('[data-jef]').forEach(b => b.onclick = ev => {
    ev.preventDefault();
    feeling = b.dataset.jef;
    m.querySelectorAll('[data-jef]').forEach(x => x.classList.toggle('primary', x === b));
    m.querySelectorAll('[data-jef]').forEach(x => x.classList.toggle('ghost', x !== b));
  });
  m.querySelector('#jeSave').onclick = () => {
    const out = jazzFinishSession({minutes: +m.querySelector('#jeMins').value || 0,
      feeling, notes: m.querySelector('#jeNote').value});
    m.remove(); sound('success');
    const p = jazzPaceOf(out.stageId);
    toast(`${out.minutes} minutes written down. ${jazzPaceSaid(out.stageId)}`, 7000);
    navigate('#/jazz/progress');
  };
  return m;
}
