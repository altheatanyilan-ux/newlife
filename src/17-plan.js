/* ============================================================
   PLAN — tomorrow, and the week after it
   Planning is deciding when, so this page only moves existing
   work around. Drag a card to a day; drop it back on Unscheduled
   to let it go quiet again.
   ============================================================ */
function weekStart(d=today()){ const x = parseDay(d); const dow = (x.getDay()+6)%7; return addDays(d, -dow); }
function planDays(offsetWeeks=0){ const s = addDays(weekStart(), offsetWeeks*7); return Array.from({length:7},(_,i)=>addDays(s,i)); }
routes.plan = function(root){
  registerPageEntry({pageName:'Plan', addLabel:'New task', defaultEntryType:'task', prefilledFields:{}, options:[
    {icon:'▫', label:'Task for tomorrow', desc:'One thing to do tomorrow.', run:()=>openTaskPicker(addDays(today(),1), rerender)},
    {icon:'▤', label:'Task for a day', desc:'Pick the day, then the work.', run:()=>pickDayThenTask()}]});
  const off = S._planWeek || 0; const days = planDays(off); const T = today();
  const un = unscheduledTasks(); const overdue = allTaskRefs().filter(r => r.day && !r.done && r.day < T);
  const load = d => tasksForDay(d);
  const weekLabel = off === 0 ? 'This week' : off === 1 ? 'Next week' : off === -1 ? 'Last week' : `${fmtDate(days[0],'med')} – ${fmtDate(days[6],'med')}`;
  root.innerHTML = `<div class="page">
    <div class="page-head row between"><div><h1>Plan</h1><div class="sub">Deciding when, not making more. Drag a task onto a day; drag it back to the shelf to let it wait.</div></div>
      <div class="row"><button class="btn sm ghost" id="pwPrev">‹</button><span class="mono" style="min-width:9em;text-align:center">${esc(weekLabel)}</span><button class="btn sm ghost" id="pwNext">›</button>${off?`<button class="btn sm ghost" id="pwNow">this week</button>`:''}</div></div>

    ${overdue.length?`<div class="card rv late-card" data-daydrop="${T}"><div class="row between"><span class="sc" style="margin:0">Carried over</span><span class="mono">${overdue.length} past their day</span></div>
      <div class="stack" style="gap:2px;margin-top:8px">${overdue.map(r=>taskRowHTML(r,{showDay:true})).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="pullToday">Move all to today</button></div></div>`:''}

    <div class="week-grid rv">
      ${days.map(d => { const rows = load(d); const done = rows.filter(r=>r.done).length; const isT = d===T; const past = d < T;
        return `<div class="day-col ${isT?'today':''} ${past?'past':''}" data-daydrop="${d}">
          <div class="day-h"><span class="dnum">${parseDay(d).getDate()}</span><span class="dname">${DOW[parseDay(d).getDay()].slice(0,3)}</span>${isT?'<span class="mono tdy">today</span>':''}<span class="mono cnt">${rows.length?`${done}/${rows.length}`:''}</span></div>
          <div class="day-body">${rows.map(r=>taskRowHTML(r)).join('')||'<div class="day-empty">—</div>'}</div>
          <div class="day-foot">${quickTaskInput(d)}<button class="tbtn" data-pickday="${d}" title="pull in existing work">pull in ↓</button></div>
        </div>`; }).join('')}
    </div>

    <section class="section rv"><div class="row between"><span class="sc" style="margin:0">The shelf — unscheduled</span><span class="mono">${un.length} waiting</span></div>
      <p class="muted" style="font-size:.85rem">Everything you have written down but not yet given a day. Tasks made inside a project live here too.</p>
      <div class="card shelf-drop" data-daydrop=""><div class="stack" style="gap:2px">${un.map(r=>taskRowHTML(r)).join('')||'<div class="empty">Nothing waiting. Rare and good.</div>'}</div>
        <div style="margin-top:10px">${quickTaskInput('')}</div></div></section>
  </div>`;
  $('#pwPrev').onclick = () => { S._planWeek = off-1; rerender(); };
  $('#pwNext').onclick = () => { S._planWeek = off+1; rerender(); };
  if($('#pwNow')) $('#pwNow').onclick = () => { S._planWeek = 0; rerender(); };
  if($('#pullToday')) $('#pullToday').onclick = () => { overdue.forEach(r => r.task.day = T); saveNow(); sound('success'); rerender(); };
  $$('[data-pickday]',root).forEach(b => b.onclick = () => openTaskPicker(b.dataset.pickday, rerender));
  bindTaskRows(root); bindDayDrop(root); bindQuickTask(root);
};
function pickDayThenTask(){
  const m = openModal(`<h2>Which day?</h2><input class="inp" type="date" id="pdDay" value="${addDays(today(),1)}"><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="pdGo">Continue</button></div>`,'narrow');
  m.querySelector('#pdGo').onclick = () => { const d = m.querySelector('#pdDay').value || addDays(today(),1); m.remove(); openTaskPicker(d, rerender); };
}
/* ---------- every entry that carries a hashtag ---------- */
routes.tag = function(root, params){
  const t = decodeURIComponent(params[0]||''); const es = sortEntries(entriesWithTag(t));
  const co = {}; es.forEach(e => entryTags(e).forEach(x => { if(x !== t) co[x] = (co[x]||0)+1; }));
  root.innerHTML = `<div class="page narrow">
    <div class="page-head"><h1>#${esc(t)}</h1><div class="sub">${es.length} ${es.length===1?'entry':'entries'} carry this tag${Object.keys(co).length?' — and travel with the tags below':''}.</div></div>
    ${Object.keys(co).length?`<div class="tag-cloud rv" style="margin-bottom:20px">${Object.entries(co).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([x,n])=>`<a class="tag" href="#/tag/${encodeURIComponent(x)}" style="--n:${Math.min(n,5)}">#${esc(x)}<span class="n">${n}</span></a>`).join('')}</div>`:''}
    <section class="section rv">${es.map(e=>entryCard(e)).join('')||'<div class="empty">Nothing carries this tag yet.</div>'}</section>
    <div class="row" style="margin-top:24px"><a class="btn sm ghost" href="#/journals">All journals</a><a class="btn sm ghost" href="#/writing">Write from this tag →</a></div>
  </div>`;
};
