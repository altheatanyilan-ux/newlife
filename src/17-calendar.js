/* ============================================================
   CALENDAR — the year as a surface you can look across.
   A month of days, each carrying the colour of how that day
   actually went. Open one and it becomes a page: the intention,
   the rehearsal, what you finished, what you wrote.
   ============================================================ */
function monthDays(y, m){                       // full weeks, Monday first
  const first = new Date(y, m, 1), last = new Date(y, m+1, 0);
  const lead = (first.getDay()+6)%7, out = [];
  for(let i=0;i<lead;i++) out.push({d:isoDay(new Date(y, m, 1-(lead-i))), out:true});
  for(let i=1;i<=last.getDate();i++) out.push({d:isoDay(new Date(y, m, i)), out:false});
  while(out.length % 7) out.push({d:isoDay(new Date(y, m+1, out.length-lead-last.getDate()+1)), out:true});
  return out;
}
/* everything that happened on one day, gathered once */
function dayRecord(d){
  const c = S.checkins[d] || null;
  const entries = S.entries.filter(e => (e.occurredAt||'').slice(0,10) === d || (e.createdAt||'').slice(0,10) === d);
  const tasks = allTaskRefs().filter(r => r.day === d);
  const habits = S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d));
  const habitsDone = habits.filter(h => habitDone(h,d));
  const nods = S.nods.filter(n => (n.date||'').slice(0,10) === d);
  return {d, c, entries, tasks, habits, habitsDone, nods,
    state: dayState(d), rehearsed: (S.rehearsal.days||[]).includes(d),
    weight: entries.length + tasks.filter(t=>t.done).length + nods.length + habitsDone.length};
}
function stateColor(v){
  if(v === null || v === undefined) return null;
  return v >= 70 ? 'var(--sage)' : v >= 45 ? 'var(--page-accent)' : v >= 25 ? 'var(--gold)' : '#b0616a';
}
routes.calendar = function(root, params){
  registerPageEntry({pageName:'Calendar', addLabel:'Note for a day', defaultEntryType:'reflection', prefilledFields:{}, options:[
    {icon:'✎', label:'Note for today', desc:'A line filed on today.', run:()=>EntryActions.quickNote()},
    {icon:'▫', label:'Task for a day', desc:'Pick the day, then the work.', run:()=>pickDayThenTask()}]});
  const T = today(); const now = parseDay(T);
  const y = S._calY ?? now.getFullYear(), m = S._calM ?? now.getMonth();
  const cells = monthDays(y, m);
  const inMonth = cells.filter(c => !c.out).map(c => c.d);
  const recs = {}; cells.forEach(c => recs[c.d] = dayRecord(c.d));
  const states = inMonth.map(d => recs[d].state).filter(v => v !== null);
  const logged = inMonth.filter(d => S.checkins[d] && (recs[d].state !== null || S.checkins[d].sentence));
  const best = [...inMonth].filter(d=>recs[d].state!==null).sort((a,b)=>recs[b].state-recs[a].state)[0];
  const worst = [...inMonth].filter(d=>recs[d].state!==null).sort((a,b)=>recs[a].state-recs[b].state)[0];
  const entriesN = inMonth.reduce((n,d)=>n+recs[d].entries.length,0);
  const monthName = `${MONTHS[m]} ${y}`;
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>Calendar</h1><div class="sub">A month at a glance, coloured by how the days actually went. Open one and it becomes a page you can read.</div></div>
      <div class="row"><button class="btn sm ghost" id="calPrev">‹</button><span class="serif" style="min-width:10em;text-align:center;font-size:1.15rem">${esc(monthName)}</span><button class="btn sm ghost" id="calNext">›</button>${(y!==now.getFullYear()||m!==now.getMonth())?'<button class="btn sm ghost" id="calNow">this month</button>':''}</div></div>

    <div class="card rv" style="margin-bottom:20px"><div class="income-strip">
      <div><div class="k">days logged</div><div class="num">${logged.length}</div><div class="mono">of ${inMonth.length}</div></div>
      <div><div class="k">average state</div><div class="num" style="color:${stateColor(states.length?avg(states):null)||'var(--muted)'}">${states.length?Math.round(avg(states)):'—'}</div><div class="mono">${states.length?'out of 100':'nothing logged yet'}</div></div>
      <div><div class="k">entries written</div><div class="num">${entriesN}</div></div>
      <div><div class="k">rehearsals</div><div class="num">${inMonth.filter(d=>recs[d].rehearsed).length}</div><div class="mono">mornings practised</div></div>
    </div></div>

    <div class="cal-grid rv">
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
      ${cells.map(c => { const r = recs[c.d]; const col = stateColor(r.state); const isT = c.d === T;
        return `<button class="cal-day ${c.out?'out':''} ${isT?'today':''} ${r.state!==null?'has':''}" data-calday="${c.d}" style="${col?`--dc:${col}`:''}" title="${fmtDate(c.d,'med')}">
          <span class="cd-num">${parseDay(c.d).getDate()}</span>
          ${r.state!==null?`<span class="cd-state" style="--h:${Math.max(6, r.state*0.34)}px"></span>`:''}
          <span class="cd-marks">${r.rehearsed?'<i class="m-reh" title="rehearsed"></i>':''}${r.entries.length?`<i class="m-ent" title="${r.entries.length} entries"></i>`:''}${r.tasks.some(t=>t.done)?'<i class="m-task" title="tasks finished"></i>':''}${r.habitsDone.length?'<i class="m-hab" title="habits kept"></i>':''}${r.nods.length?'<i class="m-nod" title="nods"></i>':''}</span>
          ${r.c?.intention?`<span class="cd-line">${esc(r.c.intention)}</span>`:r.c?.sentence?`<span class="cd-line">${esc(r.c.sentence)}</span>`:''}
        </button>`; }).join('')}
    </div>

    <div class="row between rv" style="margin-top:14px;flex-wrap:wrap;gap:14px">
      <div class="cal-legend"><span><i style="background:#b0616a"></i>heavy</span><span><i style="background:var(--gold)"></i>low</span><span><i style="background:var(--page-accent)"></i>level</span><span><i style="background:var(--sage)"></i>bright</span><span class="faint">bar height is that day's overall state</span></div>
      <div class="cal-legend"><span><i class="m-reh"></i>rehearsal</span><span><i class="m-ent"></i>entry</span><span><i class="m-task"></i>task</span><span><i class="m-hab"></i>habit</span><span><i class="m-nod"></i>nod</span></div>
    </div>

    ${states.length>1?`<section class="section rv"><span class="sc">The month as a line</span>
      <div class="card">${sparkline(inMonth.map(d=>recs[d].state),{h:70,min:0,max:100,color:'var(--page-accent)',dots:true,labels:inMonth.map(d=>`${fmtDate(d,'short')}: ${recs[d].state===null?'—':recs[d].state+'/100'}${recs[d].c?.sentence?' · '+recs[d].c.sentence:''}`)})}
        <div class="row between" style="margin-top:10px"><span class="mono">${best?`brightest ${fmtDate(best,'med')} (${recs[best].state})`:''}</span><span class="mono">${worst?`heaviest ${fmtDate(worst,'med')} (${recs[worst].state})`:''}</span></div></div></section>`:''}
  </div>`;
  $('#calPrev').onclick = () => { const d = new Date(y, m-1, 1); S._calY = d.getFullYear(); S._calM = d.getMonth(); rerender(); };
  $('#calNext').onclick = () => { const d = new Date(y, m+1, 1); S._calY = d.getFullYear(); S._calM = d.getMonth(); rerender(); };
  if($('#calNow')) $('#calNow').onclick = () => { S._calY = now.getFullYear(); S._calM = now.getMonth(); rerender(); };
  $$('[data-calday]',root).forEach(b => b.onclick = () => openDayPage(b.dataset.calday));
  if(params[0]) openDayPage(params[0]);
};
/* ---------- one day, written out as a page ---------- */
function openDayPage(d){
  const r = dayRecord(d); const c = r.c; const T = today(); const isT = d === T;
  const col = stateColor(r.state);
  const sec = (title, body) => body ? `<div class="vp-sec"><span class="sc">${title}</span>${body}</div>` : '';
  const p = openPanel(`<div class="mono">${isT?'today':daysBetween(d,T)>0?`${daysBetween(d,T)} days ago`:`in ${-daysBetween(d,T)} days`}</div>
    <h2 style="margin-bottom:2px">${esc(fmtDate(d))}</h2>
    <div class="row" style="gap:10px;margin:8px 0 18px;flex-wrap:wrap">
      ${r.state!==null?`<span class="status-pill" style="border-color:${col};color:${col}">state ${r.state}/100</span>`:'<span class="faint mono">no check-in</span>'}
      ${r.rehearsed?'<span class="status-pill">rehearsed</span>':''}
      ${r.habits.length?`<span class="mono">${r.habitsDone.length}/${r.habits.length} habits</span>`:''}
      ${r.tasks.length?`<span class="mono">${r.tasks.filter(t=>t.done).length}/${r.tasks.length} tasks</span>`:''}
    </div>
    ${c?.intention?`<div class="intention-card" style="font-size:1.12rem;margin-bottom:16px">${esc(c.intention)}</div>`:''}
    ${c?.sentence?`<blockquote class="rehearsal-epigraph" style="font-size:.98rem">${esc(c.sentence)}<cite>how the day was, in one line</cite></blockquote>`:''}
    ${sec('Energy', c?.energy && Object.keys(c.energy).length ? `<div class="energy-row">${DIMS.map(x=>`<div class="energy-dim" style="--c:${x.c}"><div class="lbl"><span>${x.name}</span><span class="mono">${c.energy[x.id]||'–'}/5</span></div><div class="dots">${[1,2,3,4,5].map(n=>`<i class="${(c.energy[x.id]||0)>=n?'on':''}"></i>`).join('')}</div></div>`).join('')}</div>${c.setpoint?`<div class="mono" style="margin-top:8px">set-point ${c.setpoint} · ${esc(hicksName(c.setpoint))}</div>`:''}` : '')}
    ${sec('Tasks', r.tasks.length ? `<div class="stack" style="gap:2px">${r.tasks.map(t=>`<div class="task-row ${t.done?'done':''}"><span class="task-check" style="pointer-events:none">${t.done?'✓':''}</span><span class="task-text">${esc(t.text)}</span>${t.where?`<span class="task-where">${esc(t.where)}</span>`:''}</div>`).join('')}</div>` : '')}
    ${sec('Habits', r.habits.length ? `<div class="row" style="flex-wrap:wrap;gap:6px">${r.habits.map(h=>{ const done = habitDone(h,d); const dim = DIMS.find(x=>x.id===h.dimension); return `<span class="chip ${done?'on':''}" style="--c:${dim?dim.c:'var(--muted)'}">${done?(done.level==='min'?'½':'✓'):'○'} ${esc(h.name)}</span>`; }).join('')}</div>` : '')}
    ${sec('Nods', r.nods.length ? r.nods.map(n=>`<div class="nod"><span class="mono">${esc(byId(S.projects,n.projectId)?.name||'')}</span><span>${esc(n.text)}</span></div>`).join('') : '')}
    ${sec(`Written that day${r.entries.length?` · ${r.entries.length}`:''}`, r.entries.length ? sortEntries(r.entries).map(e=>entryCard(e,{clamp:false})).join('') : '<div class="empty">Nothing written on this day.</div>')}
    <div class="row" style="margin-top:20px;gap:8px;flex-wrap:wrap">
      ${isT?`<a class="btn sm primary" href="#/today">open Today</a>`:''}
      <button class="btn sm ghost" id="dpNote">write a note for this day</button>
      <button class="btn sm ghost" id="dpTask">plan a task for this day</button>
      <button class="btn sm ghost" id="dpPrev">‹ ${fmtDate(addDays(d,-1),'short')}</button>
      <button class="btn sm ghost" id="dpNext">${fmtDate(addDays(d,1),'short')} ›</button>
    </div>`, 'day-page');
  p.querySelector('#dpNote').onclick = () => openEntryModal({type:'reflection', allowedTypes:['reflection','memory','gratitude','dream'], occurredAt:d, heading:`A note for ${fmtDate(d,'med')}`});
  p.querySelector('#dpTask').onclick = () => openTaskPicker(d, () => { rerender(); openDayPage(d); });
  p.querySelector('#dpPrev').onclick = () => openDayPage(addDays(d,-1));
  p.querySelector('#dpNext').onclick = () => openDayPage(addDays(d,1));
}
