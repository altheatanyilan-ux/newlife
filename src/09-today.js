/* ============================================================
   1. TODAY — the entryway (lean ritual space, ≤640px column)
   ============================================================ */
function checkin(day=today()){ if(!S.checkins[day]) S.checkins[day] = {mood:0, sentence:'', energy:{}, setpoint:0, intention:''}; return S.checkins[day]; }
routes.today = function(root){
  const T = today(); const c = checkin(T); const moon = moonPhase();
  const yesterday = addDays(T, -1); const cyest = S.checkins?.[yesterday];
  const cycleDay = S.rehearsal.cycleStart ? daysBetween(S.rehearsal.cycleStart, T) : 0;
  const rows = tasksForDay(T); const carried = allTaskRefs().filter(r => r.day && !r.done && r.day < T);
  const doneN = rows.filter(r=>r.done).length;
  const ready = lettersOpeningNow();
  const due = decisionsDue();
  const milestones = milestonesDueSoon(30);
  const pr = practicesDueToday();

  if(!c.wakeAt){ c.wakeAt = new Date().toISOString(); saveNow(); }

  const _ft = iso => { if(!iso) return ''; const d = new Date(iso); let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + String(m).padStart(2,'0') + ap; };
  const _dur = (a, b) => { if(!a||!b) return ''; const mins = Math.round((new Date(b) - new Date(a)) / 60000); if(mins < 1) return '<1m'; if(mins < 60) return mins + 'm'; return Math.floor(mins/60) + 'h ' + (mins%60) + 'm'; };

  const flowSteps = [
    {key:'checkinAt', label:'Check-in'},
    {key:'theatreAt', label:'Morning Theatre'},
    {key:'tasksAt',   label:'Tasks reviewed'},
  ];

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
    {icon:'◎', label:'Intention', desc:'The one thing to give attention to today.', run:()=>EntryActions.dailyIntention()}]});

  const MOODS = [
    {v:'open',    icon:'◯', label:'Open'},
    {v:'tender',  icon:'◌', label:'Tender'},
    {v:'charged', icon:'◉', label:'Charged'},
    {v:'settled', icon:'●', label:'Settled'},
    {v:'flat',    icon:'—', label:'Flat'},
  ];

  const seasonName = (()=>{ if(typeof season === 'function'){ const s = season(parseDay(T)); return {winter:'Winter',spring:'Spring',summer:'Summer',autumn:'Autumn'}[s]||''; } return ''; })();

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
    </header>

    <!-- morning flow tracker -->
    <section class="section rv morning-flow">
      <div class="row between"><span class="sc lg">Morning flow</span><span class="mono">${c.wakeAt ? 'woke ' + _ft(c.wakeAt) : ''}</span></div>
      <div class="card" style="margin-top:8px">
        ${flowSteps.map((s, i) => `<div class="row between" style="padding:7px 0;${i < flowSteps.length - 1 ? 'border-bottom:1px dashed var(--line)' : ''}">
          <label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" class="mf-check" data-mfkey="${s.key}" ${c[s.key] ? 'checked' : ''}><span>${s.label}</span></label>
          <span class="mono">${c[s.key] ? _ft(c[s.key]) + ' <span class="faint">+' + _dur(c.wakeAt, c[s.key]) + '</span>' : '—'}</span>
        </div>`).join('')}
        ${totalDur ? `<div class="mono" style="margin-top:8px;text-align:right;color:var(--sage)">total morning routine: ${totalDur}</div>` : ''}
      </div>
    </section>

    <!-- sealed letters (prominent) -->
    ${ready.length ? `<section class="section rv ready-letters">
      <div class="sc">A letter from you has come due</div>
      ${ready.map(e=>`<div class="card ready-letter" style="margin-top:8px"><div class="row between"><span><b class="serif">${esc(e.title||'To myself')}</b><div class="mono faint">${daysBetween((e.createdAt||'').slice(0,10), T)} days ago</div></span><button class="btn sm primary" data-lopen="${e.id}">Open it</button></div></div>`).join('')}
    </section>` : ''}

    <!-- the plan, made last night -->
    <section class="section rv today-plan">
      <div class="row between"><span class="sc" style="margin:0">Today's plan</span>
        <span class="mono faint">${planT.planned ? 'set last night' : 'not planned in advance'}</span></div>
      ${three.length ? `<ol class="today-three">${three.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`
        : `<div class="empty" style="margin-top:8px">Nothing was named for today. Plan tomorrow at the foot of this page — a day decided the night before starts already moving.</div>`}
    </section>

    <!-- today's tasks (up front) -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Today's tasks</span><span class="mono">${rows.length?`${doneN} of ${rows.length} done`:'nothing parked yet'}</span></div>
      <div class="card" data-daydrop="${T}" style="margin-top:10px">
        <div class="stack" style="gap:2px">${rows.map(r=>taskRowHTML(r)).join('')||`<div class="empty">Park work here from a project, or write one below.</div>`}</div>
        <div class="row" style="margin-top:10px;gap:8px">${quickTaskInput(T)}<button class="btn sm ghost" id="pullTask">pull in ↓</button></div>
        ${carried.length?`<div class="row" style="margin-top:10px"><span class="mono" style="color:#d08080">${carried.length} carried over from earlier days</span><button class="btn sm ghost" id="carryAll">bring to today</button></div>`:''}
      </div></section>

    <!-- daily check-in (intention + mood + energy + setpoint) -->
    <details class="rv today-checkin" ${!c.intention||(!c.setpoint && !c.mood) ? 'open' : ''}>
      <summary><span class="sc lg">Daily check-in</span><span class="mono">${c.intention ? esc(c.intention.slice(0,40)) : 'not yet set'}</span></summary>
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
    <details class="rv rehearsal-wrap" ${rehearsalDoneToday()?'':'open'} style="margin-top:8px">
      <summary><span class="sc lg">Morning Theatre</span><span class="mono">${rehearsalDoneToday()?'practised today':'30 minutes · Maltz'}</span></summary>
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

    <!-- habit rings -->
    <section class="section rv" style="margin-top:8px">
      <span class="sc lg">Today's habits</span>
      <div id="todayRings" style="margin-top:10px"></div>
    </section>

    ${due.length ? `<section class="section rv"><div class="card"><div class="row between"><span class="sc" style="margin:0">Decisions ready to grade</span><a class="mono" href="#/journals/decision">all →</a></div>${due.map(e=>`<div class="row between" style="margin-top:8px"><span><b class="serif">${esc(e.title)}</b><div class="mono">${fmtDate((e.createdAt||'').slice(0,10),'med')}</div></span><button class="btn sm" data-dopen="${e.id}">Look back</button></div>`).join('')}</div></section>` : ''}
    ${pr.length ? `<section class="section rv"><div class="row between"><span class="sc" style="margin:0">Today's practices</span><a class="mono" href="#/values">compass →</a></div>
      <div class="card" style="margin-top:10px"><div class="prac-today">${pr.map(({v,p,done,doneThisWeek})=>`<button class="prac-chip ${done?'on':''}" data-practoday="${v.id}:${p.id}" style="--c:${v.color}"><span class="pc-tick">${done?'✓':'○'}</span><span class="pc-text">${esc(p.text)}</span><span class="pc-val mono">${esc(v.name)} · ${doneThisWeek}/${p.perWeek}</span></button>`).join('')}</div></div></section>` : ''}
    ${milestones.length ? `<section class="section rv"><span class="sc">Skill milestones within 30 days</span><div class="card" style="border-left:3px solid var(--ment)">${milestones.map(({skill,m,days})=>`<a href="#/skills/${skill.id}" class="row between" style="text-decoration:none;color:inherit;padding:8px 0;border-top:1px dashed var(--line);gap:12px"><span><b class="serif">${esc(skill.name)}</b> <span class="muted">→ ${esc(skillLevelLabel(skill,m.levelTarget))}</span></span><span class="status-pill ${days<0?'due':'ahead'}">${days<0?'⚠ ' + (-days) + 'd overdue':days===0?'today':'in ' + days + 'd'}</span></a>`).join('')}</div></section>` : ''}

    <!-- gentle prompt -->
    <section class="section rv"><span class="sc">A gentle prompt</span>
      <div class="prompt-card"><div class="quote" id="promptText">${gentlePrompt()}</div><div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn sm ghost" id="anotherPrompt">another</button><button class="btn sm" data-quick="reflection">respond ✎</button></div></div>
    </section>

    <!-- quick add row -->
    <section class="section rv">
      <span class="sc">Quick add</span>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">
        ${[['reflection','✎','Reflection'],['gratitude','♡','Gratitude'],['synchronicity','∞','Synchronicity'],['visualization','◉','Vision'],['memory','◌','Memory'],['nod','·','Nod'],['interaction','☺','Interaction'],['dream','☾','Dream']].map(([t,ic,lb]) =>
          `<button class="btn sm ghost" data-quick="${t}">${ic} ${lb}</button>`).join('')}
        <button class="btn sm ghost" data-quick="snippet">✐ Snippet</button>
      </div>
    </section>

    <!-- before you sleep: the day after this one gets decided here -->
    <section class="section rv tomorrow-block ${evening ? 'is-evening' : ''}">
      <div class="row between" style="align-items:baseline">
        <span class="sc" style="margin:0">Before you sleep</span>
        <span class="mono faint">${esc(fmtDate(tomorrow, 'med'))}</span>
      </div>
      <div class="card" style="margin-top:10px">
        <p class="muted" style="font-size:.86rem;margin:0 0 10px">A day decided the night before starts already moving. Name tomorrow's three now, while today is still fresh enough to judge it.</p>
        ${threeTom.length ? `<ol class="today-three" style="margin-bottom:10px">${threeTom.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn sm ${threeTom.length ? 'ghost' : 'primary'}" id="planTomorrow">${threeTom.length ? '↻ Replan tomorrow' : '◑ Plan tomorrow'}</button>
          ${isSunday ? `<button class="btn sm ${evening ? 'primary' : 'ghost'}" id="planNextWeek">🗓 Plan next week</button>` : ''}
          <button class="btn sm ghost" id="eveningReview">☾ Evening review</button>
        </div>
      </div>
    </section>

  </div>`;

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

  /* the night before */
  $('#planTomorrow') && ($('#planTomorrow').onclick = () => { if(typeof planMyDay === 'function') planMyDay(tomorrow); });
  $('#planNextWeek') && ($('#planNextWeek').onclick = () => { if(typeof openWeeklyPlan === 'function') openWeeklyPlan(addDays(T, 1)); });
  $('#eveningReview') && ($('#eveningReview').onclick = () => { if(typeof flowEvening === 'function') flowEvening(); });

  /* gentle prompt */
  $('#anotherPrompt').onclick = () => { S._promptShift = (S._promptShift||0)+1; $('#promptText').innerHTML = gentlePrompt(); };

  /* quick add */
  root.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => { const t = b.dataset.quick; if(t==='nod') openNodModal(); else if(t==='snippet') { if(typeof openWritingModal==='function') openWritingModal({type:'snippet'}); } else openEntryModal({type:t}); });

  /* tasks */
  $('#pullTask').onclick = () => openTaskPicker(T, rerender);
  if($('#carryAll')) $('#carryAll').onclick = () => { carried.forEach(r => r.task.day = T); saveNow(); sound('success'); rerender(); };
  bindTaskRows(root); bindDayDrop(root); bindQuickTask(root);

  /* letters & decisions */
  bindSealedLetters(root);
  $$('[data-dopen]',root).forEach(b => b.onclick = () => openDecisionPanel(b.dataset.dopen));

  /* practices */
  $$('[data-practoday]',root).forEach(b => b.onclick = () => { const [vid,pid] = b.dataset.practoday.split(':'); const v = byId(S.values,vid); const p = byId(v.practices,pid); togglePractice(v,p); sound(practiceDone(p)?'success':'click'); rerender(); });

  reveal(root);
};
