/* ============================================================
   1. TODAY — the entryway
   ============================================================ */
function checkin(day=today()){ if(!S.checkins[day]) S.checkins[day] = {mood:0, sentence:'', energy:{}, setpoint:0, intention:''}; return S.checkins[day]; }
routes.today = function(root){
  const T = today(); const c = checkin(T); const moon = moonPhase();
  registerPageEntry({pageName:'Today', addLabel:'New note', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'▫', label:'Task for today', desc:'Something to finish before the day closes.', run:()=>openTaskPicker(T, rerender)},
    {icon:'✎', label:'Note', desc:'One honest line, kept as a reflection.', run:()=>EntryActions.quickNote()},
    {icon:'◎', label:'Intention', desc:'The one thing to give attention to today.', run:()=>EntryActions.dailyIntention()}]});
  const otd = onThisDay(); const cycleDay = S.rehearsal.cycleStart ? daysBetween(S.rehearsal.cycleStart, T) : 0;
  const sig = signals(); const rows = tasksForDay(T); const carried = allTaskRefs().filter(r => r.day && !r.done && r.day < T);
  const doneN = rows.filter(r=>r.done).length; const evening = new Date().getHours() >= 17;
  const trend = lastDays(30).map(d => dayState(d));
  const hasState = trend.some(v => v !== null);
  root.innerHTML = `<div class="page narrow">
    <header class="rv page-head">
      <div class="today-date">${fmtDate(T)}</div>
      <div class="moon">${moonSVG(moon.p)} <span>${moon.name}</span><span class="mono" style="margin-left:6px">· day ${Math.round(moon.age)} of the cycle</span></div>
    </header>

    <!-- 1. morning: what today is for -->
    <section class="section rv intention-block">
      <span class="sc">The one thing</span>
      <div class="intention-card">${ed(`checkins.${T}.intention`, {ph:'One thing to give attention to today. Click to set it.', cls:'serif-lg'})}</div>
    </section>

    <!-- 2. morning: the rehearsal -->
    <details class="rv rehearsal-wrap" ${rehearsalDoneToday()?'':'open'} style="margin-top:8px">
      <summary><span class="sc lg">Morning Rehearsal</span><span class="mono">${rehearsalDoneToday()?'practised today':'30 minutes'}</span></summary>
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

    ${(()=>{ const ready = lettersOpeningNow(); return ready.length ? `<section class="section rv"><div class="card ready-letter"><div class="sc">A letter from you has come due</div>${ready.map(e=>`<div class="row between" style="margin-top:8px"><span><b class="serif">${esc(e.title||'To myself')}</b><div class="mono">sealed ${fmtDate((e.createdAt||'').slice(0,10),'med')} · ${daysBetween((e.createdAt||'').slice(0,10), today())} days ago</div></span><button class="btn sm primary" data-lopen="${e.id}">Open it</button></div>`).join('')}</div></section>` : ''; })()}
    ${(()=>{ const due = decisionsDue(); return due.length ? `<section class="section rv"><div class="card"><div class="row between"><span class="sc" style="margin:0">Decisions ready to grade</span><a class="mono" href="#/journals/decision">all decisions →</a></div>${due.map(e=>`<div class="row between" style="margin-top:8px"><span><b class="serif">${esc(e.title)}</b><div class="mono">decided ${fmtDate((e.createdAt||'').slice(0,10),'med')} · you were ${esc(e.extra.confidence||'unsure')}</div></span><button class="btn sm" data-dopen="${e.id}">Look back</button></div>`).join('')}</div></section>` : ''; })()}

    <!-- 3. the day's work -->
    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">Today's tasks</span><span class="mono">${rows.length?`${doneN} of ${rows.length} done`:'nothing parked yet'}</span></div>
      <div class="card" data-daydrop="${T}" style="margin-top:10px">
        <div class="stack" style="gap:2px">${rows.map(r=>taskRowHTML(r)).join('')||`<div class="empty">Park work here from a project, or write one below.</div>`}</div>
        <div class="row" style="margin-top:10px;gap:8px">${quickTaskInput(T)}<button class="btn sm ghost" id="pullTask">pull in ↓</button><a class="btn sm ghost" href="#/plan">plan the week →</a></div>
        ${carried.length?`<div class="row" style="margin-top:10px"><span class="mono" style="color:#d08080">${carried.length} carried over from earlier days</span><button class="btn sm ghost" id="carryAll">bring to today</button></div>`:''}
      </div></section>

    ${(()=>{ const pr = practicesDueToday(); return pr.length ? `<section class="section rv"><div class="row between"><span class="sc" style="margin:0">Today's practices</span><a class="mono" href="#/values">the compass →</a></div>
      <div class="card" style="margin-top:10px"><div class="prac-today">${pr.map(({v,p,done,doneThisWeek})=>`<button class="prac-chip ${done?'on':''}" data-practoday="${v.id}:${p.id}" style="--c:${v.color}"><span class="pc-tick">${done?'✓':'○'}</span><span class="pc-text">${esc(p.text)}</span><span class="pc-val mono">${esc(v.name)} · ${doneThisWeek}/${p.perWeek}</span></button>`).join('')}</div></div></section>` : ''; })()}

    ${(()=>{ const due = milestonesDueSoon(30); return due.length ? `<section class="section rv"><span class="sc">Skill milestones within 30 days</span><div class="card" style="border-left:3px solid var(--ment)">${due.map(({skill,m,days})=>`<a href="#/skills/${skill.id}" class="row between" style="text-decoration:none;color:inherit;padding:8px 0;border-top:1px dashed var(--line);gap:12px"><span><b class="serif">${esc(skill.name)}</b> <span class="muted">→ ${esc(skillLevelLabel(skill,m.levelTarget))} (L${m.levelTarget})</span>${m.note?`<div class="quote" style="font-size:.85rem">${esc(m.note)}</div>`:''}</span><span class="status-pill ${days<0?'due':'ahead'}">${days<0?`⚠ ${-days}d overdue`:days===0?'today':`in ${days}d`}</span></a>`).join('')}</div></section>` : ''; })()}

    <!-- 4. evening: how it actually went -->
    <details class="rv" ${evening && !c.setpoint ? 'open' : ''} style="margin-top:8px">
      <summary><span class="sc lg">Evening check-in</span><span class="mono">${c.setpoint||Object.keys(c.energy||{}).length?'logged':'at the end of the day'}</span></summary>
      <div class="body stack" style="gap:22px">
        <div class="field"><label>In one sentence, how was today?</label>${ed(`checkins.${T}.sentence`, {ph:'One honest sentence.', cls:'serif-lg'})}</div>
        <div class="field"><label>Energy — four dimensions</label><div class="energy-row">${DIMS.map(d=>`<div class="energy-dim" style="--c:${d.c}"><div class="lbl"><span>${d.name}</span><span class="mono">${c.energy?.[d.id]||'–'}/5</span></div><div class="dots">${[1,2,3,4,5].map(n=>`<i class="${(c.energy?.[d.id]||0)>=n?'on':''}" data-dim="${d.id}" data-n="${n}"></i>`).join('')}</div></div>`).join('')}</div></div>
        <div class="field setpoint"><label>Emotional set-point (Hicks' guidance scale)</label>
          <input type="range" class="slider" min="1" max="22" value="${c.setpoint||14}" id="setpoint" style="--c:var(--rose)">
          <div class="lbls"><span>1 · Fear / Despair</span><span>11 · Disappointment</span><span>22 · Joy / Freedom / Love</span></div>
          <div class="cur"><span id="spName">${c.setpoint?hicksName(c.setpoint):'<span class="faint">place yourself on the scale</span>'}</span><span class="mono" id="spNum">${c.setpoint||''}</span></div>
        </div>
      </div>
    </details>

    <section class="section rv"><span class="sc">Signals</span>
      <div class="signals">${sig.map(s=>`<div class="signal" data-go="${s.go}"><div class="k">${s.k}</div><div class="v">${esc(s.v)}</div><div class="d">${esc(s.d)}</div></div>`).join('')}
        <div class="signal" data-go="#/reviews"><div class="k">Days since weekly review</div><div class="v">${daysSince(S.reviews.lastWeekly)}</div><div class="d">${daysSince(S.reviews.lastWeekly)>7?'a review is due':'on rhythm'}</div></div>
        <div class="signal" data-go="#/today"><div class="k">Morning Rehearsal streak</div><div class="v">${rehearsalStreak()} days</div><div class="d">of the current 21-day cycle</div></div>
      </div>
    </section>

    <section class="section rv"><span class="sc">This day, in the years behind it</span>
      ${onThisDayHTML()}
    </section>

    <section class="section rv"><span class="sc">A gentle prompt</span>
      <div class="prompt-card"><div class="quote" id="promptText">${gentlePrompt()}</div><div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn sm ghost" id="anotherPrompt">another</button><button class="btn sm" data-quick="reflection">respond ✎</button></div></div>
    </section>

    <section class="section rv"><span class="sc">How you have been, these thirty days</span>
      <div class="card">${hasState ? `${sparkline(trend,{h:74,min:0,max:100,color:'var(--page-accent)',dots:true,labels:lastDays(30).map(d=>`${fmtDate(d,'short')}: ${dayState(d)===null?'—':dayState(d)+'/100'}${S.checkins[d]?.sentence?' · '+S.checkins[d].sentence:''}`)})}
        <div class="row between" style="margin-top:10px"><span class="mono">${stateBlurb(trend)}</span><span class="mono">one line: energy and set-point together</span></div>`
        : `<div class="empty">Check in for a few evenings and one honest line will appear here — your overall state, not five charts to decode.</div>`}</div>
    </section>
  </div>`;

  root.querySelectorAll('.dots i').forEach(i => i.onclick = () => { c.energy = c.energy||{}; c.energy[i.dataset.dim] = +i.dataset.n; saveNow(); const dim = i.closest('.energy-dim'); dim.querySelectorAll('i').forEach(x=>x.classList.toggle('on', +x.dataset.n <= +i.dataset.n)); dim.querySelector('.lbl .mono').textContent = i.dataset.n+'/5'; });
  const sp = $('#setpoint'); sp.oninput = () => { $('#spName').textContent = hicksName(+sp.value); $('#spNum').textContent = sp.value; }; sp.onchange = () => { c.setpoint = +sp.value; saveNow(); sound('save'); };
  $('#markTheatre').onclick = () => { if(!S.rehearsal.days.includes(T)){ S.rehearsal.days.push(T); if(!S.rehearsal.cycleStart) S.rehearsal.cycleStart = T; saveNow(); sound('chime'); toast('Practice marked. The nervous system takes care of the rest, in time.'); rerender(); } };
  $('#newCycle').onclick = () => confirmDlg('Start a fresh 21-day cycle from today? Past days stay in your history.', () => { S.rehearsal.cycleStart = T; saveNow(); rerender(); });
  root.querySelectorAll('.tracker i').forEach(i => i.onclick = () => { const d = i.dataset.td; if(d > T) return; const idx = S.rehearsal.days.indexOf(d); if(idx>=0) S.rehearsal.days.splice(idx,1); else S.rehearsal.days.push(d); saveNow(); rerender(); });
  $('#anotherPrompt').onclick = () => { S._promptShift = (S._promptShift||0)+1; $('#promptText').innerHTML = gentlePrompt(); };
  root.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => { const t = b.dataset.quick; if(t==='nod') openNodModal(); else openEntryModal({type:t}); });
  $('#pullTask').onclick = () => openTaskPicker(T, rerender);
  if($('#carryAll')) $('#carryAll').onclick = () => { carried.forEach(r => r.task.day = T); saveNow(); sound('success'); rerender(); };
  bindTaskRows(root); bindDayDrop(root); bindQuickTask(root);
  bindSealedLetters(root); bindOnThisDay(root);
  $$('[data-dopen]',root).forEach(b => b.onclick = () => openDecisionPanel(b.dataset.dopen));
  $$('[data-practoday]',root).forEach(b => b.onclick = () => { const [vid,pid] = b.dataset.practoday.split(':'); const v = byId(S.values,vid); const p = byId(v.practices,pid); togglePractice(v,p); sound(practiceDone(p)?'success':'click'); rerender(); });
};

