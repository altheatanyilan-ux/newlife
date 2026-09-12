/* ============================================================
   1. TODAY — the entryway (lean ritual space, ≤640px column)
   ============================================================ */
function checkin(day=today()){ if(!S.checkins[day]) S.checkins[day] = {mood:0, sentence:'', energy:{}, setpoint:0, intention:''}; return S.checkins[day]; }
function rememberFold(id, open){ if(!id) return; S.settings.todayOpen = S.settings.todayOpen || {}; S.settings.todayOpen[id] = !!open; saveNow(); }
/* one small dialog for the two ends of the day */
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
/* An empty <input type="time"> opens its picker at midnight, which is never
   the answer and is a long way from it — you are always logging a time near
   now. So the field starts at now when nothing has been set, and the nudge
   is a few minutes rather than a scroll through the small hours. Nothing is
   recorded until Set: the seeded value is only where the picker begins. */
function askClock(title, value, onSet){
  const m = openModal(`<h2>${esc(title)}</h2>
    <input class="inp mono serif-lg" type="time" id="clkV" value="${esc(value || nowHM())}" autofocus>
    <div class="row" style="justify-content:space-between;margin-top:16px">
      <button class="btn sm ghost" id="clkNow">now</button>
      <button class="btn primary" id="clkOk">Set</button></div>`, 'narrow');
  const go = () => { const v = m.querySelector('#clkV').value; if(!/^\d{2}:\d{2}$/.test(v)) { m.remove(); return; } m.remove(); onSet(v); sound('click'); };
  m.querySelector('#clkOk').onclick = go;
  m.querySelector('#clkNow').onclick = () => { m.querySelector('#clkV').value = nowHM(); go(); };
  m.querySelector('#clkV').onkeydown = e => { if(e.key === 'Enter') go(); };
}
routes.today = function(root){
  const T = today(); const c = checkin(T); const moon = moonPhase();
  const yesterday = addDays(T, -1); const cyest = S.checkins?.[yesterday];
  const cycleDay = S.rehearsal.cycleStart ? daysBetween(S.rehearsal.cycleStart, T) : 0;
  const rows = tasksForDay(T); const carried = allTaskRefs().filter(r => r.day && !r.done && r.day < T);
  const doneN = rows.filter(r=>r.done).length;
  const ready = lettersOpeningNow();
  const due = decisionsDue();
  const milestones = milestonesDueSoon(30);

  /* opening the page is the wake signal; the daily rhythm owns the time now */
  if(!c.wakeAt){ c.wakeAt = new Date().toISOString(); saveNow(); }
  { const r = rhythmDay(T); if(!r.wakeTime){ r.wakeTime = isoToHM(c.wakeAt); rhythmCompute(r); saveNow(); } }

  const _ft = iso => { if(!iso) return ''; const d = new Date(iso); let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + String(m).padStart(2,'0') + ap; };
  const _dur = (a, b) => { if(!a||!b) return ''; const mins = Math.round((new Date(b) - new Date(a)) / 60000); if(mins < 1) return '<1m'; if(mins < 60) return mins + 'm'; return Math.floor(mins/60) + 'h ' + (mins%60) + 'm'; };

  /* The three morning steps are no longer a separate checklist: each one is a
     tick in the header of the section it belongs to, and its timestamp is
     printed on that same line. A step is where the step happens. */
  const flowSteps = [
    {key:'checkinAt', label:'Check-in',        sec:'t-checkin'},
    {key:'theatreAt', label:'Morning Theatre', sec:'t-theatre'},
    {key:'tasksAt',   label:'Tasks reviewed',  sec:'t-tasks'},
  ];
  const flowTick = key => {
    const at = c[key];
    return `<label class="hd-tick ${at ? 'on' : ''}" title="${at ? 'done ' + _ft(at) : 'mark this done'}">
      <input type="checkbox" class="mf-check" data-mfkey="${key}" ${at ? 'checked' : ''}>
      <span class="hd-tick-box" aria-hidden="true"></span>
      <span class="hd-tick-t mono">${at ? _ft(at) + (c.wakeAt ? ` <span class="faint">+${_dur(c.wakeAt, at)}</span>` : '') : ''}</span>
    </label>`;
  };
  /* every section folds; what is open is remembered per section, not per day */
  const fold = (id, def = true) => { const m = S.settings.todayOpen = S.settings.todayOpen || {};
    return (m[id] === undefined ? def : m[id]) ? ' open' : ''; };

  /* A day is planned the night before. Today shows what was decided then;
     the planning itself happens at the foot of the page, for tomorrow. */
  const tomorrow = addDays(T, 1);
  const planT = typeof dayPlan === 'function' ? dayPlan(T) : {intentions:[], planned:false};
  const planTom = typeof dayPlan === 'function' ? dayPlan(tomorrow) : {intentions:[], planned:false};
  const three = (planT.intentions || []).filter(Boolean);
  const threeTom = (planTom.intentions || []).filter(Boolean);
  const isSunday = parseDay(T).getDay() === 0;
  const evening = new Date().getHours() >= 17;
  const allFlowDone = flowSteps.every(s => c[s.key]);
  const lastFlowTime = flowSteps.map(s => c[s.key]).filter(Boolean).pop();
  const totalDur = allFlowDone && c.wakeAt ? _dur(c.wakeAt, lastFlowTime) : '';

  registerPageEntry({pageName:'Today', addLabel:'New note', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'▫', label:'Task for today', desc:'Something to finish before the day closes.', run:()=>openTaskPicker(T, rerender)},
    {icon:'✎', label:'Note', desc:'One honest line, kept as a reflection.', run:()=>EntryActions.quickNote()},
    {icon:'⋯', label:'Unfinished thought', desc:'No time to write it properly. It waits at the bottom of Today.', run:()=>openMemoryDump()},
    {icon:'◎', label:'Intention', desc:'The one thing to give attention to today.', run:()=>EntryActions.dailyIntention()}]});

  const MOODS = [
    {v:'open',    icon:'◯', label:'Open'},
    {v:'tender',  icon:'◌', label:'Tender'},
    {v:'charged', icon:'◉', label:'Charged'},
    {v:'settled', icon:'●', label:'Settled'},
    {v:'flat',    icon:'—', label:'Flat'},
  ];

  const seasonName = (()=>{ if(typeof season === 'function'){ const s = season(parseDay(T)); return {winter:'Winter',spring:'Spring',summer:'Summer',autumn:'Autumn'}[s]||''; } return ''; })();

  /* the page is long by design — everything a day needs is on it — so it
     carries its own index. Sections that are not on the page today (a letter
     due, a review closing tonight) drop out of the index with them. */
  const jumps = [
    ['t-letters', 'letters',  ready.length > 0],
    ['t-plan',    'plan',     true],
    ['t-tasks',   'tasks',    true],
    ['t-checkin', 'check-in', true],
    ['t-theatre', 'theatre',  true],
    ['t-habits',  'habits',   true],
    ['t-tonight', 'tonight',  true],
    /* The bottom of a long page cannot catch an eye on its own. The count
       rides up here so an unfinished thought is visible from the top, which
       is the whole reason the section exists. */
    ['t-unfinished', `unfinished ${unfinishedEntries().length}`, unfinishedEntries().length > 0],
  ].filter(x => x[2]);

  root.innerHTML = `<div class="page narrow today-page">

    <!-- header -->
    <header class="rv today-head">
      <div class="row between" style="align-items:flex-start;gap:12px">
        <div>
          <div class="today-date">${fmtDate(T)}</div>
          ${seasonName?`<div class="mono faint" style="font-size:.72rem;margin-top:2px">${seasonName} · day ${Math.round(moon.age)} of the lunar cycle</div>`:''}
        </div>
        <div class="moon row" style="gap:6px;align-items:center">${moonSVG(moon.p)} <span class="mono faint">${moon.name}</span></div>
      </div>
      ${cyest?.intention ? `<div class="mono faint" style="margin-top:8px;font-size:.78rem">Yesterday you set out to: <em>${esc(cyest.intention)}</em></div>` : ''}
      <p class="day-edge waking">I woke up at <button class="day-edge-t" id="wokeAt">${c.wakeAt ? esc(_ft(c.wakeAt)) : '—'}</button></p>
    </header>

    <nav class="today-jump rv" aria-label="jump to a section">
      ${jumps.map(([id, label]) => `<button data-jump="${id}">${esc(label)}</button>`).join('')}
    </nav>

    <!-- the day's shape now lives on the Compass, across a whole week; here
         the two ends of the day are simply stated, at the two ends of the page -->
    <!-- sealed letters (prominent) -->
    ${ready.length ? `<details class="section rv ready-letters t-sec" id="t-letters"${fold('t-letters')}>
      <summary><span class="sc">A letter from you has come due</span><span class="mono">${ready.length}</span></summary><div class="body">
      ${ready.map(e=>`<div class="card ready-letter" style="margin-top:8px"><div class="row between"><span><b class="serif">${esc(e.title||'To myself')}</b><div class="mono faint">${daysBetween((e.createdAt||'').slice(0,10), T)} days ago</div></span><button class="btn sm primary" data-lopen="${e.id}">Open it</button></div></div>`).join('')}
    </div></details>` : ''}

    <!-- the plan, made last night -->
    <details class="section rv today-plan t-sec" id="t-plan"${fold('t-plan')}>
      <summary><span class="sc" style="margin:0">Today's plan</span>
        <span class="mono faint">${planT.planned ? 'set last night' : 'not planned in advance'}</span></summary>
      <div class="body">
      ${planT.why ? `<p class="plan-why">${esc(planT.why)}</p>` : ''}
      ${three.length ? `<ol class="today-three">${three.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`
        : `<div class="empty" style="margin-top:8px">Nothing was named for today. Plan tomorrow at the foot of this page — a day decided the night before starts already moving.</div>`}
      ${planT.firstMove ? `<p class="plan-line"><span class="mono">first move</span> ${esc(planT.firstMove)}</p>` : ''}
      ${planT.risk ? `<p class="plan-line risk"><span class="mono">in the way</span> ${esc(planT.risk)}</p>` : ''}
      </div></details>

    <!-- today's tasks (up front) -->
    <details class="section rv t-sec" id="t-tasks"${fold('t-tasks')}>
      <summary><span class="sc" style="margin:0">Today's tasks</span><span class="mono">${rows.length?`${doneN} of ${rows.length} done`:'nothing parked yet'}</span>${flowTick('tasksAt')}</summary>
      <div class="body">
      <div class="card" data-daydrop="${T}" style="margin-top:10px">
        ${dayListFilterHTML(rows)}
        <div class="stack" style="gap:2px">${(() => { const shown = filterRowsByList(rows);
          return shown.map(r=>taskRowHTML(r)).join('') || (rows.length
            ? `<div class="empty">Nothing in that list today. <button class="tbtn" data-tlist="all">show all ${rows.length}</button></div>`
            : `<div class="empty">Park work here from a project, or write one below.</div>`); })()}</div>
        <div class="row" style="margin-top:10px;gap:8px">${quickTaskInput(T)}<button class="btn sm ghost" id="pullTask">pull in ↓</button><a class="btn sm ghost" href="#/planning/today">all of it →</a></div>
        ${carried.length?`<div class="row" style="margin-top:10px"><span class="mono" style="color:#d08080">${carried.length} carried over from earlier days</span><button class="btn sm ghost" id="carryAll">bring to today</button></div>`:''}
      </div></div></details>

    <!-- daily check-in (intention + mood + energy + setpoint) -->
    <details class="section rv today-checkin t-sec" id="t-checkin"${fold('t-checkin', !c.intention || (!c.setpoint && !c.mood))}>
      <summary><span class="sc">Daily check-in</span><span class="mono">${c.intention ? esc(c.intention.slice(0,40)) : 'not yet set'}</span>${flowTick('checkinAt')}</summary>
      <div class="body stack" style="gap:20px">
        <div class="field"><label>Today's intention ${planT.planned && c.intention ? '<span class="mono faint" style="text-transform:none;letter-spacing:0">· set last night</span>' : ''}</label>
          ${ed('checkins.' + T + '.intention', {ph:'One thing to give attention to today.', cls:'serif-lg'})}</div>
        <div class="field"><label>Mood right now</label>
          <div class="mood-shapes row" style="gap:10px;flex-wrap:wrap">
            ${MOODS.map(m=>`<button class="mood-btn ${c.mood===m.v?'on':''}" data-mood="${m.v}" style="flex-direction:column;gap:3px"><span class="mood-icon">${m.icon}</span><span class="mono" style="font-size:.65rem">${m.label}</span></button>`).join('')}
          </div>
        </div>
        <div class="field"><label>In one sentence, how is today going?</label>
          ${ed('checkins.' + T + '.sentence', {ph:'One honest sentence.', cls:'serif-lg'})}</div>
        <div class="field"><label>Energy — four dimensions</label>
          <div class="energy-row">${DIMS.map(d=>`<div class="energy-dim" style="--c:${d.c}"><div class="lbl"><span>${d.name}</span><span class="mono">${c.energy?.[d.id]||'–'}/5</span></div><div class="dots">${[1,2,3,4,5].map(n=>`<i class="${(c.energy?.[d.id]||0)>=n?'on':''}" data-dim="${d.id}" data-n="${n}"></i>`).join('')}</div></div>`).join('')}</div></div>
        <div class="field setpoint"><label>Emotional set-point (Hicks' guidance scale)</label>
          <input type="range" class="slider" min="1" max="22" value="${c.setpoint||14}" id="setpoint" style="--c:var(--rose)">
          <div class="lbls"><span>1 · Fear / Despair</span><span>11 · Disappointment</span><span>22 · Joy / Freedom / Love</span></div>
          <div class="cur"><span id="spName">${c.setpoint?hicksName(c.setpoint):'<span class="faint">place yourself on the scale</span>'}</span><span class="mono" id="spNum">${c.setpoint||''}</span></div>
        </div>
      </div>
    </details>

    <!-- morning rehearsal (Maltz) -->
    <details class="section rv rehearsal-wrap t-sec" id="t-theatre"${fold('t-theatre', !rehearsalDoneToday())} style="margin-top:8px">
      <summary><span class="sc">Morning Theatre</span><span class="mono">${rehearsalDoneToday()?'practised today':'30 minutes · Maltz'}</span>${flowTick('theatreAt')}</summary>
      <div class="body rehearsal stack" style="gap:24px">
        <blockquote class="rehearsal-epigraph">Close your eyes for thirty minutes. See yourself on a mental screen — sights, sounds, smells. See yourself acting, feeling and being as you want to be. The nervous system cannot tell a real experience from one vividly imagined.<cite>Maxwell Maltz</cite></blockquote>
        <div class="field"><label>Self-image script</label>${ed('rehearsal.script',{multi:true,mdr:true,cls:'prose serif-lg',ph:'First person, present tense. Who you are becoming — vivid, sensory, felt as already real.'})}</div>
        <div class="field"><label>The winning feeling</label><div class="faint" style="font-size:.8rem;margin-bottom:4px">Recall a moment when you felt self-confident and successful. Capture that feeling, then weld it to your vision of the future.</div>${ed('rehearsal.winning',{multi:true,cls:'prose',ph:'Where were you? What did your body do?'})}</div>
        <div class="field"><label>Definite chief aim</label><div class="faint" style="font-size:.8rem;margin-bottom:4px">The exact thing desired, what you will give in return, the date, the plan. Read aloud morning and night, with feeling.</div>${ed('rehearsal.aim',{multi:true,cls:'prose serif-lg',ph:'By [date] I will have [exactly this]. In return I will give [this].'})}</div>
        <div class="field"><label>21-day tracker <span class="mono" style="text-transform:none;letter-spacing:0">· day ${clamp(cycleDay+1,1,21)} of 21 · ${S.rehearsal.days.filter(d=>d>=S.rehearsal.cycleStart).length} practised</span></label>
          <div class="tracker">${Array.from({length:21},(_,i)=>{ const d = addDays(S.rehearsal.cycleStart||T, i); return `<i class="${S.rehearsal.days.includes(d)?'done':''} ${d===T?'today':''}" data-td="${d}" title="${fmtDate(d,'med')}"></i>`; }).join('')}</div>
          <div class="row" style="margin-top:12px"><button class="btn sm ${rehearsalDoneToday()?'':'primary'}" id="markTheatre">${rehearsalDoneToday()?'✓ Practised today':'Mark today\'s practice'}</button><button class="btn sm ghost" id="newCycle">Begin a new 21-day cycle</button></div>
        </div>
      </div>
    </details>

    <!-- the habit checklist: the whole of habit-keeping now lives here -->
    <details class="section rv t-sec" style="margin-top:8px" id="t-habits"${fold('t-habits')}>
      <summary><span class="sc" style="margin:0">Today's habits</span>
        <span class="mono faint">${(() => { const due = S.habits.filter(h => !h.archived && !h.negative && habitDue(h, T)); const dn = due.filter(h => habitDone(h, T)).length; return due.length ? `${dn} of ${due.length} kept` : 'nothing due'; })()}</span></summary>
      <div class="body">
      <div id="todayRings" style="margin-top:10px"></div>
      <div class="row" style="gap:6px;margin-top:12px;flex-wrap:wrap">
        <button class="btn sm primary" id="todayAddHabit">＋ add habit</button>
        ${S.habits.some(h => h.archived) ? '<button class="btn sm ghost" id="todayArchHabit">archived</button>' : ''}
        <button class="btn sm ghost" id="todayHabitGrid">the whole grid →</button>
      </div>
    </div></details>


    ${due.length ? `<section class="section rv"><div class="card"><div class="row between"><span class="sc" style="margin:0">Decisions ready to grade</span><a class="mono" href="#/journals/decision">all →</a></div>${due.map(e=>`<div class="row between" style="margin-top:8px"><span><b class="serif">${esc(e.title)}</b><div class="mono">${fmtDate((e.createdAt||'').slice(0,10),'med')}</div></span><button class="btn sm" data-dopen="${e.id}">Look back</button></div>`).join('')}</div></section>` : ''}
    ${milestones.length ? `<section class="section rv"><span class="sc">Skill milestones within 30 days</span><div class="card" style="border-left:3px solid var(--ment)">${milestones.map(({skill,m,days})=>`<a href="#/skills/${skill.id}" class="row between" style="text-decoration:none;color:inherit;padding:8px 0;border-top:1px dashed var(--line);gap:12px"><span><b class="serif">${esc(skill.name)}</b> <span class="muted">→ ${esc(skillLevelLabel(skill,m.levelTarget))}</span></span><span class="status-pill ${days<0?'due':'ahead'}">${days<0?'⚠ ' + (-days) + 'd overdue':days===0?'today':'in ' + days + 'd'}</span></a>`).join('')}</div></section>` : ''}


    <!-- the ledger reads the whole instrument, so it belongs to the Compass;
         the gentle prompt and the quick-add row are gone by request -->

    <!-- before you sleep: the day after this one gets decided here -->
    <details class="section rv tomorrow-block t-sec ${evening ? 'is-evening' : ''}" id="t-tonight"${fold('t-tonight')}>
      <summary>
        <span class="sc" style="margin:0">Before you sleep</span>
        <span class="mono faint">${esc(fmtDate(tomorrow, 'med'))}</span>
      </summary>
      <div class="body"><div class="card" style="margin-top:10px">
        <p class="muted" style="font-size:.86rem;margin:0 0 10px">A day decided the night before starts already moving. Name tomorrow's three now, while today is still fresh enough to judge it.</p>
        ${planTom.why ? `<p class="plan-why">${esc(planTom.why)}</p>` : ''}
        ${threeTom.length ? `<ol class="today-three" style="margin-bottom:10px">${threeTom.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
        ${planTom.firstMove ? `<p class="plan-line"><span class="mono">first move</span> ${esc(planTom.firstMove)}</p>` : ''}
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn sm ${threeTom.length ? 'ghost' : 'primary'}" id="planTomorrow">${threeTom.length ? '↻ Replan tomorrow' : '◑ Plan tomorrow'}</button>
          ${isSunday ? `<button class="btn sm ${evening ? 'primary' : 'ghost'}" id="planNextWeek">🗓 Plan next week</button>` : ''}
          <button class="btn sm ghost" id="eveningReview">☾ Evening review</button>
          ${typeof reviewChipsHTML === 'function' ? reviewChipsHTML(T) : ''}
        </div>
      </div></div>
    </details>

    <!-- last on the page by request: the half-written things, which stay
         here until they are called finished. Nothing expires them. -->
    ${unfinishedSectionHTML()}

    <p class="day-edge sleeping">I went to sleep at <button class="day-edge-t" id="sleptAt">${(() => { const r = rhythmDay(T); return r.sleepTime ? esc(r.sleepTime) : '—'; })()}</button></p>

  </div>`;

  /* the index */
  /* The index is sticky, so scrolling a section to the top of the window puts
     it underneath the index. Scroll to the section's own top minus the height
     of the bar that would otherwise be standing on it. */
  root.querySelectorAll('[data-jump]').forEach(b => b.onclick = () => {
    const t = root.querySelector('#' + b.dataset.jump); if(!t) return;
    if(t.tagName === 'DETAILS' && !t.open){ t.open = true; rememberFold(t.id, true); }
    const bar = root.querySelector('.today-jump');
    const pad = (bar ? bar.getBoundingClientRect().height : 0) + 14;
    const y = t.getBoundingClientRect().top + window.scrollY - pad;
    window.scrollTo({top: Math.max(0, y), behavior: reduced() ? 'auto' : 'smooth'});
    t.classList.add('jump-lit'); setTimeout(() => t.classList.remove('jump-lit'), 1200);
  });

  /* what is folded shut is a preference, not a fact about today */
  root.querySelectorAll('details.t-sec').forEach(d => d.addEventListener('toggle', () => rememberFold(d.id, d.open)));

  /* the two ends of the day — stated plainly, corrected by clicking them */
  $('#wokeAt') && ($('#wokeAt').onclick = () => askClock('What time did you wake?', isoToHM(c.wakeAt), v => {
    const [h, m] = v.split(':').map(Number);
    const d = parseDay(T); d.setHours(h, m, 0, 0);
    c.wakeAt = d.toISOString();
    const r = rhythmDay(T); r.wakeTime = v; rhythmCompute(r); saveNow(); rerender();
  }));
  $('#sleptAt') && ($('#sleptAt').onclick = () => { const r = rhythmDay(T);
    askClock('What time did you close the day?', r.sleepTime, v => { r.sleepTime = v; rhythmCompute(r); saveNow(); rerender(); }); });

  /* habits */
  $('#todayAddHabit') && ($('#todayAddHabit').onclick = () => openHabitModal());
  $('#todayArchHabit') && ($('#todayArchHabit').onclick = () => openArchivedHabits());
  $('#todayHabitGrid') && ($('#todayHabitGrid').onclick = () => openHabitsPanel());
  if(typeof bindReviewsDue === 'function') bindReviewsDue(root);

  /* habits rings */
  const ringsBox = root.querySelector('#todayRings');
  if(ringsBox && typeof habitRingRow === 'function') ringsBox.innerHTML = habitRingRow(T);
  if(ringsBox && typeof bindHabitRings === 'function') bindHabitRings(ringsBox);

  /* morning flow tracker */
  root.querySelectorAll('.mf-check').forEach(cb => cb.onchange = () => {
    const key = cb.dataset.mfkey;
    if(cb.checked){
      c[key] = new Date().toISOString();
      if(key === 'theatreAt' && !S.rehearsal.days.includes(T)){
        S.rehearsal.days.push(T);
        if(!S.rehearsal.cycleStart) S.rehearsal.cycleStart = T;
      }
    } else { c[key] = null; }
    saveNow(); rerender();
  });

  /* check-in bindings */
  root.querySelectorAll('.dots i').forEach(i => i.onclick = () => { c.energy = c.energy||{}; c.energy[i.dataset.dim] = +i.dataset.n; saveNow(); const dim = i.closest('.energy-dim'); dim.querySelectorAll('i').forEach(x=>x.classList.toggle('on', +x.dataset.n <= +i.dataset.n)); dim.querySelector('.lbl .mono').textContent = i.dataset.n+'/5'; });
  root.querySelectorAll('[data-mood]').forEach(b => b.onclick = () => { c.mood = b.dataset.mood; saveNow(); root.querySelectorAll('[data-mood]').forEach(x => x.classList.toggle('on', x === b)); });
  const sp = $('#setpoint'); if(sp){ sp.oninput = () => { $('#spName').textContent = hicksName(+sp.value); $('#spNum').textContent = sp.value; }; sp.onchange = () => { c.setpoint = +sp.value; saveNow(); sound('save'); }; }

  /* morning theatre */
  $('#markTheatre').onclick = () => { if(!S.rehearsal.days.includes(T)){ S.rehearsal.days.push(T); if(!S.rehearsal.cycleStart) S.rehearsal.cycleStart = T; saveNow(); sound('chime'); toast('Practice marked. The nervous system takes care of the rest, in time.'); rerender(); } };
  $('#newCycle').onclick = () => confirmDlg('Start a fresh 21-day cycle from today? Past days stay in your history.', () => { S.rehearsal.cycleStart = T; saveNow(); rerender(); });
  root.querySelectorAll('.tracker i').forEach(i => i.onclick = () => { const d = i.dataset.td; if(d > T) return; const idx = S.rehearsal.days.indexOf(d); if(idx>=0) S.rehearsal.days.splice(idx,1); else S.rehearsal.days.push(d); saveNow(); rerender(); });

  const redraw = () => rerender();
  bindTimeUse(root, redraw);
  bindUnfinished(root, redraw);

  /* the night before */
  $('#planTomorrow') && ($('#planTomorrow').onclick = () => { if(typeof planMyDay === 'function') planMyDay(tomorrow); });
  $('#planNextWeek') && ($('#planNextWeek').onclick = () => { if(typeof openWeeklyPlan === 'function') openWeeklyPlan(addDays(T, 1)); });
  $('#eveningReview') && ($('#eveningReview').onclick = () => { if(typeof flowEvening === 'function') flowEvening(); });

  /* tasks */
  $('#pullTask').onclick = () => openTaskPicker(T, rerender);
  if($('#carryAll')) $('#carryAll').onclick = () => { carried.forEach(r => r.task.day = T); saveNow(); sound('success'); rerender(); };
  bindTaskRows(root); bindDayDrop(root); bindQuickTask(root); bindDayListFilter(root);

  /* letters & decisions */
  bindSealedLetters(root);
  $$('[data-dopen]',root).forEach(b => b.onclick = () => openDecisionPanel(b.dataset.dopen));


  reveal(root);
};
