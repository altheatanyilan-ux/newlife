/* ============================================================
   RHYTHM — one surface for the day.
   Calendar, the day's plan, the habits, and the review that
   closes it. They were four rooms; they are one cognitive mode,
   so they are one page sharing one data layer.
   ============================================================ */
function weekStart(d=today()){ const x = parseDay(d); const dow = (x.getDay()+6)%7; return addDays(d, -dow); }

function planDays(offsetWeeks=0){ const s = addDays(weekStart(), offsetWeeks*7); return Array.from({length:7},(_,i)=>addDays(s,i)); }

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
  p.querySelector('#dpTask').onclick = () => openTaskPicker(d, () => reopenPanel(() => { rerender(); openDayPage(d); }));
  p.querySelector('#dpPrev').onclick = () => openDayPage(addDays(d,-1));
  p.querySelector('#dpNext').onclick = () => openDayPage(addDays(d,1));
}

/* ---------- events: the only new store this page needs ---------- */
const LIFE_DOMAINS_DEFAULT = [
  {id:'work',   name:'Work',   color:'#6b7f8e'},
  {id:'growth', name:'Growth', color:'#7f916a'},
  {id:'health', name:'Health', color:'#c47832'},
  {id:'social', name:'Social', color:'#a0727e'},
  {id:'home',   name:'Home',   color:'#b08968'},
  {id:'rest',   name:'Rest',   color:'#8a8d8f'},
];
function domains(){ if(!Array.isArray(S.settings.domains) || !S.settings.domains.length) S.settings.domains = JSON.parse(JSON.stringify(LIFE_DOMAINS_DEFAULT)); return S.settings.domains; }
const domainColor = id => (domains().find(d => d.id === id) || {}).color || 'var(--page-accent)';
const domainName  = id => (domains().find(d => d.id === id) || {}).name || '';
function migrateRhythm(){
  S.events = Array.isArray(S.events) ? S.events : [];
  S.events.forEach(e => { e.day = e.day || today(); e.start = e.start ?? 9; e.dur = e.dur ?? 1; e.domain = e.domain || ''; e.note = e.note || ''; });
  S.plans = S.plans && typeof S.plans === 'object' ? S.plans : {};
  S.reviewLog = S.reviewLog && typeof S.reviewLog === 'object' ? S.reviewLog : {};
  S.runLog = S.runLog && typeof S.runLog === 'object' ? S.runLog : {};
  domains();
  (S.habits||[]).forEach(h => { if(h.at === undefined) h.at = null; if(!h.icon) h.icon = ''; if(!h.linkedSkill) h.linkedSkill = null; if(!Array.isArray(h.celebrated)) h.celebrated = []; });
}
function dayPlan(d = today()){
  migrateRhythm();
  if(!S.plans[d]) S.plans[d] = {intentions:['','',''], items:[], planned:false, capacity:8};
  const p = S.plans[d]; p.intentions = p.intentions || ['','','']; p.items = p.items || []; p.capacity = p.capacity || 8;
  return p;
}
function dayReview(d = today()){
  migrateRhythm();
  if(!S.reviewLog[d]) S.reviewLog[d] = {energy:0, moods:[], note:'', closedAt:''};
  return S.reviewLog[d];
}
const MOOD_TAGS = ['Focused','Scattered','Energised','Drained','Grateful','Stressed','Calm','Restless'];
const fmtHour = h => { const H = Math.floor(h), m = Math.round((h-H)*60); return `${String(H).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
const EST_OPTIONS = [[0,'—'],[0.25,'15m'],[0.5,'30m'],[1,'1h'],[1.5,'1½h'],[2,'2h'],[3,'3h'],[4,'4h']];

/* everything that lands on one day, from all three sources */
function dayBlocks(d){
  const out = [];
  S.events.filter(e => e.day === d).forEach(e => out.push({kind:'event', id:e.id, title:e.title, start:+e.start, dur:+e.dur, color:domainColor(e.domain) , ref:e}));
  allTaskRefs().filter(r => r.day === d).forEach(r => { const at = r.task.at; if(at == null) return;
    out.push({kind:'task', id:r.id, title:r.text, start:+at, dur:+(r.task.est || 1), color:'var(--terra)', done:r.done, ref:r}); });
  S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d) && h.at != null).forEach(h => {
    const dim = DIMS.find(x => x.id === h.dimension);
    out.push({kind:'habit', id:h.id, title:`${h.icon||''} ${h.name}`.trim(), start:+h.at, dur:+(h.dur || 0.5), color:dim ? dim.c : 'var(--sage)', done:!!habitDone(h,d), ref:h});
  });
  return out.sort((a,b) => a.start - b.start);
}
function moveBlock(kind, id, day, start){
  if(kind === 'event'){ const e = byId(S.events, id); if(e){ e.day = day; e.start = start; } }
  else if(kind === 'task'){ const r = findTaskRef(id); if(r){ r.task.day = day; r.task.at = start; } }
  else if(kind === 'habit'){ const h = byId(S.habits, id); if(h) h.at = start; }
  saveNow();
}

/* ---------- the page ---------- */
routes.rhythm = function(root, params){
  migrateRhythm();
  const T = today();
  const tab = ['plan','habits','review'].includes(params[0]) ? params[0] : (S._rhyTab || 'plan');
  S._rhyTab = tab;
  const view = S._rhyView || 'week';
  const focus = S._rhyDay && /^\d{4}-\d{2}-\d{2}$/.test(S._rhyDay) ? S._rhyDay : T;
  registerPageEntry({pageName:'Rhythm', addLabel:'Add to the day', defaultEntryType:'event', prefilledFields:{}, options:[
    {icon:'▦', label:'Event', desc:'A block of time with a name.', run:()=>openEventModal({day:focus})},
    {icon:'▫', label:'Task for today', desc:'Something to finish before the day closes.', run:()=>openTaskPicker(focus, rerender)},
    {icon:'◎', label:'Plan my day', desc:'The three-step morning ritual.', run:()=>planMyDay(focus)}]});
  root.innerHTML = `<div class="page rhythm-page">
    <div class="page-head row between"><div><h1>${esc(S.settings.rhythmName || 'Rhythm')}</h1><div class="sub">The day in one place: what is on it, what you meant to do, what you keep doing, and how it actually went.</div></div>
      <div class="row"><div class="view-toggle">${[['day','Day'],['week','Week'],['month','Month']].map(([k,l])=>`<button class="${view===k?'on':''}" data-rview="${k}">${l}</button>`).join('')}</div>
        <button class="btn sm ghost" id="rhyPrev">‹</button><button class="btn sm ghost" id="rhyToday">today</button><button class="btn sm ghost" id="rhyNext">›</button></div></div>
    <div class="rhythm-grid">
      <div class="rhy-cal" id="rhyCal"></div>
      <aside class="rhy-side">
        <div class="seg">${[['plan','Plan'],['habits','Habits'],['review','Review']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-rtab="${k}">${l}</button>`).join('')}</div>
        <div id="rhySide"></div>
      </aside>
    </div>
  </div>`;
  drawRhythmCalendar($('#rhyCal'), view, focus);
  const side = $('#rhySide');
  if(tab === 'plan') renderPlanPanel(side, focus);
  else if(tab === 'habits') renderHabitsPanel(side, focus);
  else renderReviewPanel(side, focus);
  window._bloomHabit = null; window._pulseHabitId = null;
  $$('[data-rtab]',root).forEach(b => b.onclick = () => { S._rhyTab = b.dataset.rtab; navigate('#/rhythm/' + b.dataset.rtab); if(location.hash === '#/rhythm/' + b.dataset.rtab) rerender(); });
  $$('[data-rview]',root).forEach(b => b.onclick = () => { S._rhyView = b.dataset.rview; rerender(); });
  const step = n => { S._rhyDay = addDays(focus, view === 'day' ? n : view === 'week' ? n*7 : n*30); rerender(); };
  $('#rhyPrev').onclick = () => step(-1); $('#rhyNext').onclick = () => step(1);
  $('#rhyToday').onclick = () => { S._rhyDay = T; rerender(); };
  reveal(root);
};

/* ---------- panel 1: the time grid ---------- */
const HOUR0 = 6, HOUR1 = 24, HOUR_PX = 34;
function drawRhythmCalendar(box, view, focus){
  const T = today();
  const days = view === 'day' ? [focus] : view === 'week' ? planDaysFrom(focus) : null;
  if(view === 'month') return drawRhythmMonth(box, focus);
  const hours = Array.from({length:HOUR1-HOUR0}, (_,i) => HOUR0+i);
  const showLog = view === 'day';
  box.innerHTML = `<div class="cal-head"><div class="cal-gutter"></div>${days.map(d => { const n = runLogDay(d).length;
      return `<div class="cal-dayh ${d===T?'today':''} ${d===focus?'focus':''}" data-calfocus="${d}"><span class="dn">${DOW[parseDay(d).getDay()].slice(0,3)}</span><span class="dd">${parseDay(d).getDate()}</span>${(!showLog && n) ? `<span class="rl-badge mono" title="${n} running-log line${n===1?'':'s'}">${n}⌇</span>` : ''}</div>`; }).join('')}</div>
    ${habitRingsRow(days, view==='day'?56:34)}
    <div class="cal-with-log">
    <div class="cal-body" style="--hpx:${HOUR_PX}px">
      <div class="cal-gutter">${hours.map(h => `<div class="cal-hour"><span>${String(h).padStart(2,'0')}</span></div>`).join('')}</div>
      ${days.map(d => { const blocks = dayBlocks(d); const lanes = layoutBlocks(blocks);
        return `<div class="cal-col ${d===T?'today':''}" data-calday="${d}">
          ${hours.map(h => `<div class="cal-slot" data-slot="${d}:${h}"></div>`).join('')}
          ${blocks.map((b,i) => { const L = lanes[i];
            return `<div class="cal-ev k-${b.kind} ${b.done?'done':''}" draggable="true" data-evk="${b.kind}" data-evid="${b.id}"
              style="--c:${b.color};top:${((b.start-HOUR0)*HOUR_PX).toFixed(1)}px;height:${Math.max(18,(b.dur*HOUR_PX)-2).toFixed(1)}px;left:${(L.i*100/L.n).toFixed(2)}%;width:${(100/L.n).toFixed(2)}%">
              <span class="ev-t">${esc(b.title)}</span>${b.dur >= .75 ? `<span class="ev-h mono">${fmtHour(b.start)}</span>` : ''}</div>`; }).join('')}
          ${d===T ? `<div class="now-line" style="top:${((nowHour()-HOUR0)*HOUR_PX).toFixed(1)}px"></div>` : ''}
        </div>`; }).join('')}
    </div>
    ${showLog ? runLogTrackHTML(days[0]) : ''}
    </div>
    <div class="cal-legend" style="margin-top:10px"><span><i style="background:var(--page-accent)"></i>events</span><span><i style="background:var(--terra)"></i>tasks</span><span><i style="background:var(--sage)"></i>habits</span><span class="faint">drag on empty space to make an event · drag a block to move it · rings above are today's habits, one tap to log</span></div>`;
  bindCalendar(box, days);
  bindHabitRings(box);
  if(showLog) bindRunLog(box, days[0]);
}
function nowHour(){ const d = new Date(); return d.getHours() + d.getMinutes()/60; }
function planDaysFrom(d){ const s = weekStart(d); return Array.from({length:7},(_,i)=>addDays(s,i)); }
/* overlapping blocks share the column */
function layoutBlocks(blocks){
  const lanes = blocks.map(() => ({i:0, n:1}));
  blocks.forEach((b,i) => {
    const overlapping = blocks.map((x,j)=>({x,j})).filter(({x}) => !(x.start + x.dur <= b.start || x.start >= b.start + b.dur));
    const n = overlapping.length;
    overlapping.forEach(({j}, k) => { if(lanes[j].n < n) lanes[j].n = n; if(j === i) lanes[i].i = k; });
  });
  return lanes;
}
function bindCalendar(box, days){
  $$('[data-calfocus]',box).forEach(h => h.onclick = () => { S._rhyDay = h.dataset.calfocus; rerender(); });
  $$('.cal-ev',box).forEach(el_ => {
    el_.addEventListener('click', e => { e.stopPropagation();
      const k = el_.dataset.evk, id = el_.dataset.evid;
      if(k === 'event') openEventModal({id});
      else if(k === 'task'){ const r = findTaskRef(id); if(r) openTaskSidePanel(r); }
      else openHabitModal(id);
    });
    el_.addEventListener('dragstart', ev => { ev.dataTransfer.effectAllowed = 'move'; window._calDrag = {k:el_.dataset.evk, id:el_.dataset.evid}; el_.classList.add('dragging'); });
    el_.addEventListener('dragend', () => { el_.classList.remove('dragging'); window._calDrag = null; });
  });
  $$('.cal-slot',box).forEach(s => {
    s.addEventListener('dragover', ev => { ev.preventDefault(); s.classList.add('over'); });
    s.addEventListener('dragleave', () => s.classList.remove('over'));
    s.addEventListener('drop', ev => { ev.preventDefault(); s.classList.remove('over');
      const d = window._calDrag; if(!d) return; const [day, hour] = s.dataset.slot.split(':');
      moveBlock(d.k, d.id, day, +hour); sound('click'); rerender(); });
  });
  // drag on empty space to carve out a block
  $$('.cal-col',box).forEach(col => {
    let anchor = null, ghost = null;
    col.addEventListener('pointerdown', ev => {
      if(ev.target.closest('.cal-ev')) return;
      const r = col.getBoundingClientRect(); anchor = HOUR0 + Math.floor((ev.clientY - r.top) / HOUR_PX * 2) / 2;
      ghost = el(`<div class="cal-ghost" style="top:${((anchor-HOUR0)*HOUR_PX).toFixed(1)}px;height:${HOUR_PX/2}px"></div>`);
      col.appendChild(ghost); try { col.setPointerCapture(ev.pointerId); } catch(e){}
    });
    col.addEventListener('pointermove', ev => {
      if(!anchor || !ghost) return; const r = col.getBoundingClientRect();
      const cur = HOUR0 + Math.ceil((ev.clientY - r.top) / HOUR_PX * 2) / 2;
      const top = Math.min(anchor, cur), h = Math.max(.5, Math.abs(cur - anchor));
      ghost.style.top = ((top-HOUR0)*HOUR_PX).toFixed(1)+'px'; ghost.style.height = (h*HOUR_PX).toFixed(1)+'px';
    });
    const finish = ev => {
      if(!anchor || !ghost) return; const r = col.getBoundingClientRect();
      const cur = HOUR0 + Math.ceil((ev.clientY - r.top) / HOUR_PX * 2) / 2;
      const start = Math.min(anchor, cur), dur = Math.max(.5, Math.abs(cur - anchor));
      ghost.remove(); ghost = null; anchor = null;
      openEventModal({day: col.dataset.calday, start, dur, inline: true});
    };
    col.addEventListener('pointerup', finish); col.addEventListener('pointercancel', () => { ghost?.remove(); ghost = null; anchor = null; });
  });
}
function drawRhythmMonth(box, focus){
  const T = today(); const d0 = parseDay(focus); const y = d0.getFullYear(), m = d0.getMonth();
  const cells = monthDays(y, m);
  box.innerHTML = `<div class="row between" style="margin-bottom:10px"><span class="serif" style="font-size:1.15rem">${MONTHS[m]} ${y}</span><span class="mono">click a day to open it</span></div>
    <div class="cal-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div class="cal-dow">${x}</div>`).join('')}
    ${cells.map(c => { const r = dayRecord(c.d); const bl = dayBlocks(c.d); const col = stateColor(r.state); const pl = S.plans?.[c.d];
      return `<button class="cal-day ${c.out?'out':''} ${c.d===T?'today':''} ${r.state!==null?'has':''}" data-calopen="${c.d}" style="${col?`--dc:${col}`:''}">
        <span class="cd-num">${parseDay(c.d).getDate()}</span>
        ${r.state!==null?`<span class="cd-state" style="--h:${Math.max(6, r.state*.3)}px"></span>`:''}
        ${bl.length?`<span class="cd-blocks">${bl.slice(0,3).map(b=>`<i style="background:${b.color}"></i>`).join('')}${bl.length>3?`<span class="mono">+${bl.length-3}</span>`:''}</span>`:''}
        ${pl?.intentions?.filter(Boolean).length?`<span class="cd-line">${esc(pl.intentions.filter(Boolean)[0])}</span>`:''}
      </button>`; }).join('')}</div>`;
  $$('[data-calopen]',box).forEach(b => b.onclick = () => { S._rhyDay = b.dataset.calopen; S._rhyView = 'day'; rerender(); });
}
function openEventModal({id = null, day = today(), start = 9, dur = 1, inline = false} = {}){
  const ex = id ? byId(S.events, id) : null;
  const e = ex || {id:uid(), title:'', day, start, dur, domain:'', note:''};
  const m = openModal(`<h2>${ex ? 'Event' : 'New event'}</h2><div class="stack">
    <input class="inp serif-lg" id="evTitle" value="${esc(e.title)}" placeholder="What is this block for?" autofocus>
    <div class="grid c3" style="gap:8px">
      <div class="field"><label>Day</label><input class="inp" type="date" id="evDay" value="${e.day}"></div>
      <div class="field"><label>Start</label><select class="sel" id="evStart">${Array.from({length:(HOUR1-HOUR0)*2},(_,i)=>HOUR0+i/2).map(h=>`<option value="${h}" ${+e.start===h?'selected':''}>${fmtHour(h)}</option>`).join('')}</select></div>
      <div class="field"><label>Length</label><select class="sel" id="evDur">${[.5,1,1.5,2,3,4,6,8].map(h=>`<option value="${h}" ${+e.dur===h?'selected':''}>${h<1?'30m':h+'h'}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Life domain</label><div class="deps" id="evDom">${domains().map(d=>`<span class="chip click ${e.domain===d.id?'on':''}" style="--c:${d.color}" data-dom="${d.id}">${esc(d.name)}</span>`).join('')}<button type="button" class="chip click" id="evDomEdit" style="--c:var(--muted)">⚙ edit domains</button></div></div>
    <div class="field"><label>Note</label><input class="inp" id="evNote" value="${esc(e.note)}" placeholder="optional"></div>
    <div class="row between">${ex?`<button class="btn sm ghost danger" id="evDel">Delete</button>`:'<span></span>'}<button class="btn primary" id="evSave">${ex?'Save':'Add to the day'}</button></div>
  </div>`, inline ? 'narrow' : 'narrow');
  let dom = e.domain;
  m.querySelectorAll('[data-dom]').forEach(c => c.onclick = () => { dom = dom === c.dataset.dom ? '' : c.dataset.dom; m.querySelectorAll('[data-dom]').forEach(x => x.classList.toggle('on', x.dataset.dom === dom)); });
  m.querySelector('#evDomEdit').onclick = () => { m.remove(); openDomainsModal(); };
  m.querySelector('#evSave').onclick = () => {
    const title = m.querySelector('#evTitle').value.trim(); if(!title){ toast('Give the block a name.'); return; }
    Object.assign(e, {title, day:m.querySelector('#evDay').value || day, start:+m.querySelector('#evStart').value, dur:+m.querySelector('#evDur').value, domain:dom, note:m.querySelector('#evNote').value.trim()});
    if(!ex) S.events.push(e);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  if(ex) m.querySelector('#evDel').onclick = () => { m.remove(); requestDelete({label:e.title, remove:()=>spliceOut(S.events, x=>x.id===e.id)}); };
}
function openDomainsModal(){
  const draw = () => domains().map((d,i)=>`<div class="row" style="gap:8px;align-items:center"><input type="color" value="${d.color}" data-domc="${i}" style="width:32px;height:26px;border:none;background:none;padding:0;cursor:pointer"><input class="inp" value="${esc(d.name)}" data-domn="${i}" style="flex:1"><button class="del-x inline" data-domd="${i}">×</button></div>`).join('');
  const m = openModal(`<h2>Life domains</h2><p class="muted" style="font-size:.86rem">The handful of areas a block of time can belong to. Colour-coded on the calendar.</p><div class="stack" id="domList" style="gap:6px">${draw()}</div><div class="row between" style="margin-top:14px"><button class="btn sm ghost" id="domAdd">＋ domain</button><button class="btn primary" id="domDone">Done</button></div>`, 'narrow');
  const rebind = () => {
    m.querySelectorAll('[data-domn]').forEach(i => i.onchange = () => { domains()[+i.dataset.domn].name = i.value; saveNow(); });
    m.querySelectorAll('[data-domc]').forEach(i => i.onchange = () => { domains()[+i.dataset.domc].color = i.value; saveNow(); });
    m.querySelectorAll('[data-domd]').forEach(b => b.onclick = () => { domains().splice(+b.dataset.domd,1); saveNow(); m.querySelector('#domList').innerHTML = draw(); rebind(); });
  };
  rebind();
  m.querySelector('#domAdd').onclick = () => { domains().push({id:uid(), name:'New domain', color:'#8a8d8f'}); saveNow(); m.querySelector('#domList').innerHTML = draw(); rebind(); };
  m.querySelector('#domDone').onclick = () => { m.remove(); rerender(); };
}
function openTaskSidePanel(r){
  const p = openPanel(`<div class="mono">task${r.where?` · ${esc(r.where)}`:''}</div><h2>${esc(r.text)}</h2>
    <div class="row" style="gap:10px;margin:10px 0 18px;flex-wrap:wrap">
      <button class="btn sm ${r.done?'ghost':'primary'}" id="tsDone">${r.done?'mark not done':'mark done'}</button>
      ${r.go?`<a class="btn sm ghost" href="${r.go}">open ${r.kind==='project'?'the project':'it'}</a>`:''}</div>
    <div class="grid c2" style="gap:10px">
      <div class="field"><label>Day</label><input class="inp" type="date" id="tsDay" value="${r.day||''}"></div>
      <div class="field"><label>Time on the calendar</label><select class="sel" id="tsAt"><option value="">unscheduled</option>${Array.from({length:(HOUR1-HOUR0)*2},(_,i)=>HOUR0+i/2).map(h=>`<option value="${h}" ${+r.task.at===h?'selected':''}>${fmtHour(h)}</option>`).join('')}</select></div>
    </div>
    <div class="field" style="margin-top:10px"><label>Estimate</label><select class="sel" id="tsEst">${EST_OPTIONS.map(([v,l])=>`<option value="${v}" ${+(r.task.est||0)===v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="vp-sec"><span class="sc">Notes</span><textarea class="ta" id="tsNote" placeholder="anything worth remembering about it">${esc(r.task.notes||'')}</textarea></div>
    <div class="row" style="margin-top:14px"><button class="btn sm ghost danger" id="tsDel">Delete this task</button></div>`, 'task-panel');
  p.querySelector('#tsDone').onclick = () => { setTaskDone(r.id, !r.done); sound(r.done?'click':'success'); closePanel(); rerender(); };
  p.querySelector('#tsDay').onchange = e => { r.task.day = e.target.value; saveNow(); rerender(); };
  p.querySelector('#tsAt').onchange = e => { r.task.at = e.target.value === '' ? null : +e.target.value; saveNow(); rerender(); };
  p.querySelector('#tsEst').onchange = e => { r.task.est = +e.target.value; saveNow(); rerender(); };
  const tsN = p.querySelector('#tsNote'); tsN.addEventListener('input', debounce(() => { r.task.notes = tsN.value; saveNow(); }, 500));
  p.querySelector('#tsDel').onclick = () => { closePanel(); deleteTaskRef(r.id, null, rerender); };
  attachDictationIn(p);
}

/* ---------- the running log: a spoken-aloud, append-only narration of the day ---------- */
const RUNLOG_TYPES = [
  ['start',    'Starting',   '▶', '#7f916a'],
  ['switch',   'Switching',  '⇄', '#6b7f8e'],
  ['pause',    'Pausing',    '⏸', '#b08968'],
  ['drop',     'Dropping',   '⨯', '#b0616a'],
  ['complete', 'Completing', '✓', '#7f916a'],
  ['reflect',  'Reflecting', '◔', '#8a8d8f'],
  ['energy',   'Energy note','⚡', '#c47832'],
];
function runLogDay(d){ S.runLog = S.runLog || {}; S.runLog[d] = S.runLog[d] || []; return S.runLog[d]; }
function detectRunLogType(text){
  const t = text.toLowerCase();
  if(/^(start|starting|beginning|begin)\b/.test(t)) return 'start';
  if(/^(switch|switching|now on|moving to|onto)\b/.test(t)) return 'switch';
  if(/^(pause|pausing|stepping away|break|back in)\b/.test(t)) return 'pause';
  if(/^(drop|dropping|abandon|giving up on|shelving)\b/.test(t)) return 'drop';
  if(/^(done|finished|complete|completing|completed|wrapped)\b/.test(t)) return 'complete';
  if(/energy|tired|drained|wired|energi[sz]ed|foggy|caffeinat/.test(t)) return 'energy';
  return 'reflect';
}
function addRunLogEntry(d, text, type){
  const log = runLogDay(d);
  log.push({id:uid(), at: new Date().toTimeString().slice(0,5), type: type || detectRunLogType(text), text: text.trim()});
  saveNow();
}
/* a line of what the day added up to, generated from its own log — no separate write required */
function runLogSummaryHTML(d){
  const log = runLogDay(d);
  if(log.length < 2) return '';
  const counts = {}; log.forEach(e => counts[e.type] = (counts[e.type]||0)+1);
  const order = RUNLOG_TYPES.map(x=>x[0]).filter(k => counts[k]);
  const parts = order.map(k => { const t = RUNLOG_TYPES.find(x=>x[0]===k); const n = counts[k]; return `${n} ${t[1].toLowerCase()}${n>1?'s':''}`; });
  return `<div class="runlog-summary faint">${esc(parts.join(' · '))}${log.length?` · first line at ${log[0].at}`:''}</div>`;
}
/* pinned to the same hour scale as the calendar's blocks, so a glance across both lines up */
function runLogTrackHTML(d){
  const log = runLogDay(d).slice().sort((a,b) => a.at.localeCompare(b.at));
  const trackH = (HOUR1-HOUR0)*HOUR_PX;
  const pins = log.map(e => {
    const [hh,mm] = e.at.split(':').map(Number); const frac = hh + (mm||0)/60;
    const top = clamp((frac-HOUR0)*HOUR_PX, 0, Math.max(0,trackH-22));
    const t = RUNLOG_TYPES.find(x=>x[0]===e.type) || RUNLOG_TYPES[5];
    return `<div class="rl-pin" style="top:${top.toFixed(1)}px;--c:${t[3]}" data-rlid="${e.id}" title="${esc(e.at)}">
      <span class="rl-ico">${t[2]}</span><span class="rl-at mono">${e.at}</span><span class="rl-text">${esc(e.text)}</span><button class="del-x inline" data-rldel="${e.id}">×</button></div>`;
  }).join('');
  return `<div class="runlog-wrap">
    <div class="runlog-head"><span class="sc" style="margin:0">Running log</span></div>
    <input class="inp sm runlog-quick" data-rlday="${d}" placeholder="＋ starting / switching / done / feeling…">
    <div class="runlog-track" style="height:${trackH}px">${pins || '<div class="empty" style="font-size:.78rem;position:static">Nothing narrated yet today.</div>'}</div>
    ${runLogSummaryHTML(d)}
  </div>`;
}
function bindRunLog(box, d){
  const inp = box.querySelector('[data-rlday]');
  if(inp) inp.addEventListener('keydown', e => { if(e.key !== 'Enter') return; const v = e.target.value.trim(); if(!v) return;
    addRunLogEntry(d, v); sound('click'); rerender(); });
  $$('[data-rldel]', box).forEach(b => b.onclick = () => { const log = runLogDay(d); const i = log.findIndex(x => x.id === b.dataset.rldel); if(i < 0) return;
    requestDelete({label: log[i].text || 'Log line', node: b.closest('.rl-pin'), remove: () => { const g = log.splice(i,1)[0]; return () => log.splice(i,0,g); }}); });
}

/* ---------- panel 2: the day's plan ---------- */
function renderPlanPanel(box, d){
  const p = dayPlan(d); const T = today();
  const rows = tasksForDay(d); const carried = allTaskRefs().filter(r => r.day && !r.done && r.day < d);
  const planned = sum(p.items.map(i => +i.est || 0)) + sum(rows.filter(r => !p.items.some(i => i.ref === r.id)).map(r => +r.task.est || 0));
  const doneN = p.items.filter(i => i.done).length + rows.filter(r => r.done).length;
  const totalN = p.items.length + rows.length;
  box.innerHTML = `
    <div class="row between"><span class="sc" style="margin:0">${d === T ? 'Today' : fmtDate(d,'med')}</span><span class="mono">${totalN ? `${doneN}/${totalN} done` : 'nothing planned'}</span></div>
    ${p.planned ? '' : `<button class="btn primary" id="planStart" style="width:100%;margin-top:10px">◎ Plan my day</button>`}
    ${p.intentions.some(Boolean) ? `<div class="intentions">${p.intentions.map((t,i)=> t ? `<div class="intention"><span class="in-n">${i+1}</span><span>${esc(t)}</span></div>` : '').join('')}</div>` : ''}

    <div class="plan-cap"><span class="mono">${planned.toFixed(1)} h planned</span><span class="cap-bar"><i style="width:${clamp(planned/(p.capacity||8)*100,0,100)}%"></i></span><span class="mono">of ${p.capacity} h</span></div>

    <div class="plan-list">
      ${rows.map(r => `<div class="plan-item ${r.done?'done':''}" data-ptask="${r.id}">
        <button class="task-check" data-tcheck="${r.id}">${r.done?'✓':''}</button>
        <span class="pi-text">${esc(r.text)}</span>
        ${r.where?`<span class="task-where">${esc(r.where)}</span>`:''}
        <select class="sel pi-est" data-testref="${r.id}">${EST_OPTIONS.map(([v,l])=>`<option value="${v}" ${+(r.task.est||0)===v?'selected':''}>${l}</option>`).join('')}</select>
      </div>`).join('')}
      ${p.items.map((it,i) => `<div class="plan-item ${it.done?'done':''}">
        <button class="task-check" data-pcheck="${i}">${it.done?'✓':''}</button>
        <span class="pi-text">${esc(it.text)}${it.doneAt?`<span class="mono pi-when"> ${esc(it.doneAt)}</span>`:''}</span>
        <select class="sel pi-est" data-pest="${i}">${EST_OPTIONS.map(([v,l])=>`<option value="${v}" ${+(it.est||0)===v?'selected':''}>${l}</option>`).join('')}</select>
        <button class="del-x inline" data-pdel2="${i}">×</button>
      </div>`).join('')}
      ${!totalN ? '<div class="empty">Nothing on the day yet.</div>' : ''}
    </div>
    <input class="inp quick-task" id="planQuick" placeholder="＋ add to the plan and press Enter">
    <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="btn sm ghost" id="planPull">pull from projects</button>
      <button class="btn sm ghost" id="planEvent">＋ event</button>
      ${p.planned ? `<button class="btn sm ghost" id="planRedo">re-plan</button>` : ''}
    </div>
    ${carried.length ? `<div class="carried"><span class="mono">${carried.length} carried over</span><button class="btn sm ghost" id="planCarry">bring forward</button></div>` : ''}
    ${nudgesHTML(d)}`;
  $('#planStart') && ($('#planStart').onclick = () => planMyDay(d));
  $('#planRedo') && ($('#planRedo').onclick = () => planMyDay(d));
  $('#planPull').onclick = () => openTaskPicker(d, rerender);
  $('#planEvent').onclick = () => openEventModal({day:d});
  $('#planCarry') && ($('#planCarry').onclick = () => { carried.forEach(r => r.task.day = d); saveNow(); sound('success'); rerender(); });
  $('#planQuick').addEventListener('keydown', e => { if(e.key !== 'Enter') return; const v = e.target.value.trim(); if(!v) return;
    p.items.push({id:uid(), text:v, est:0, done:false, doneAt:''}); saveNow(); sound('click'); rerender(); });
  bindTaskRows(box);
  $$('[data-pcheck]',box).forEach(b => b.onclick = () => { const it = p.items[+b.dataset.pcheck]; it.done = !it.done; it.doneAt = it.done ? new Date().toTimeString().slice(0,5) : ''; saveNow(); sound(it.done?'success':'click'); rerender(); });
  $$('[data-pdel2]',box).forEach(b => b.onclick = () => { const i = +b.dataset.pdel2; requestDelete({label:p.items[i].text, node:b.closest('.plan-item'), remove:()=>{ const g = p.items.splice(i,1)[0]; return () => p.items.splice(i,0,g); }}); });
  $$('[data-pest]',box).forEach(s => s.onchange = () => { p.items[+s.dataset.pest].est = +s.value; saveNow(); rerender(); });
  $$('[data-testref]',box).forEach(s => s.onchange = () => { const r = findTaskRef(s.dataset.testref); if(r){ r.task.est = +s.value; saveNow(); rerender(); } });
  bindNudges(box);
}
/* the morning ritual, in three steps */
function planMyDay(d = today()){
  const p = dayPlan(d); let step = 0;
  const overdue = allTaskRefs().filter(r => !r.done && r.day && r.day <= d);
  const unscheduled = unscheduledTasks();
  const pool = [...overdue, ...unscheduled.slice(0, 20)];
  const habits = S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d));
  const chosen = new Set(overdue.filter(r => r.day === d).map(r => r.id));
  const chosenH = new Set(habits.filter(h => h.at != null).map(h => h.id));
  const m = openModal('', 'narrow');
  const draw = () => {
    const body = [
      `<h2>What are today's three?</h2><p class="muted" style="font-size:.88rem">Not a task list — the three things that would make today count. One is allowed to be empty.</p>
       <div class="stack" style="gap:8px">${[0,1,2].map(i=>`<div class="row" style="gap:8px"><span class="in-n">${i+1}</span><input class="inp serif-lg" data-int="${i}" value="${esc(p.intentions[i]||'')}" placeholder="${['the one that matters most','the one you keep postponing','the small one'][i]}"></div>`).join('')}</div>`,
      `<h2>Anything waiting?</h2><p class="muted" style="font-size:.88rem">Tasks from your projects and your own list. Tick what belongs to today; the rest keeps waiting without nagging.</p>
       <div class="stack" style="gap:4px;max-height:44vh;overflow:auto">${pool.length ? pool.map(r=>`<label class="pick-row ${chosen.has(r.id)?'on':''}"><input type="checkbox" data-pick2="${r.id}" ${chosen.has(r.id)?'checked':''}><span><b>${esc(r.text)}</b>${r.where?`<span class="d">${esc(r.where)}</span>`:''}${r.day && r.day < d ?'<span class="d" style="color:#d08080">carried over</span>':''}</span></label>`).join('') : '<div class="empty">Nothing waiting. Add work as you go.</div>'}</div>`,
      `<h2>And the habits?</h2><p class="muted" style="font-size:.88rem">The ones due today. Ticking one puts it on the calendar at the time you choose.</p>
       <div class="stack" style="gap:4px;max-height:44vh;overflow:auto">${habits.length ? habits.map(h=>`<label class="pick-row ${chosenH.has(h.id)?'on':''}"><input type="checkbox" data-pickh="${h.id}" ${chosenH.has(h.id)?'checked':''}><span><b>${h.icon||''} ${esc(h.name)}</b><span class="d">${esc(habitFreqLabel(h))} · ${esc(h.timeOfDay)}</span></span><select class="sel" data-hat="${h.id}" style="width:auto"><option value="">no time</option>${Array.from({length:(HOUR1-HOUR0)*2},(_,i)=>HOUR0+i/2).map(x=>`<option value="${x}" ${+h.at===x?'selected':''}>${fmtHour(x)}</option>`).join('')}</select></label>`).join('') : '<div class="empty">No habits due today.</div>'}</div>`,
    ][step];
    m.querySelector('.modal').innerHTML = `<button class="close">×</button>${body}
      <div class="row between" style="margin-top:18px"><span class="mono">step ${step+1} of 3</span>
      <span class="row">${step?'<button class="btn sm ghost" id="pmBack">back</button>':''}<button class="btn primary" id="pmNext">${step===2?'Start the day':'Next'}</button></span></div>`;
    m.querySelector('.close').onclick = () => m.remove();
    m.querySelectorAll('[data-int]').forEach(i => i.onchange = () => p.intentions[+i.dataset.int] = i.value.trim());
    m.querySelectorAll('[data-pick2]').forEach(c => c.onchange = () => { c.checked ? chosen.add(c.dataset.pick2) : chosen.delete(c.dataset.pick2); c.closest('.pick-row').classList.toggle('on', c.checked); });
    m.querySelectorAll('[data-pickh]').forEach(c => c.onchange = () => { c.checked ? chosenH.add(c.dataset.pickh) : chosenH.delete(c.dataset.pickh); c.closest('.pick-row').classList.toggle('on', c.checked); });
    m.querySelectorAll('[data-hat]').forEach(s => s.onchange = () => { const h = byId(S.habits, s.dataset.hat); h.at = s.value === '' ? null : +s.value; });
    if(m.querySelector('#pmBack')) m.querySelector('#pmBack').onclick = () => { step--; draw(); };
    m.querySelector('#pmNext').onclick = () => {
      if(step === 0) m.querySelectorAll('[data-int]').forEach(i => p.intentions[+i.dataset.int] = i.value.trim());
      if(step < 2){ step++; draw(); return; }
      pool.forEach(r => { if(chosen.has(r.id)) r.task.day = d; });
      habits.forEach(h => { if(!chosenH.has(h.id)) h.at = null; });
      p.planned = true; saveNow(); m.remove(); sound('success');
      toast(`${p.intentions.filter(Boolean).length ? 'Three named. ' : ''}${chosen.size} task${chosen.size===1?'':'s'} on the day.`);
      rerender();
    };
  };
  draw();
}
/* gentle nudges the day should know about */
function nudgesHTML(d){
  const out = [];
  if(typeof lettersOpeningNow === 'function') lettersOpeningNow().forEach(e => out.push({icon:'✉', text:`A sealed letter is ready: <b>${esc(e.title||'To myself')}</b>`, go:'#/today'}));
  if(typeof decisionsDue === 'function') decisionsDue().forEach(e => out.push({icon:'⚖', text:`Look back on <b>${esc(e.title)}</b>`, go:'#/journals/decision'}));
  if(typeof peopleNeedingAttention === 'function') peopleNeedingAttention().slice(0,3).forEach(({p, days, want}) => out.push({icon:'☺', text:`You have not written about <b>${esc(p.name)}</b> in ${days === Infinity ? 'a while' : days + ' days'} (you meant ${esc(want)})`, go:'#/people/'+p.id}));
  if(typeof birthdaysSoon === 'function') birthdaysSoon(7).forEach(({p, days}) => out.push({icon:'✿', text:`<b>${esc(p.name)}</b>'s birthday ${days===0?'is today':`in ${days} days`}`, go:'#/people/'+p.id}));
  if(typeof milestonesDueSoon === 'function') milestonesDueSoon(14).slice(0,2).forEach(({skill,m,days}) => out.push({icon:'▲', text:`<b>${esc(skill.name)}</b> → L${m.levelTarget} ${days<0?`${-days}d overdue`:`in ${days}d`}`, go:'#/skills/'+skill.id}));
  const energyDip = recentEnergyDip();
  if(energyDip) out.push({icon:'◔', text:`Your energy has been low for ${energyDip} weeks. A congruence snapshot may say why.`, go:'#/values'});
  if(!out.length) return '';
  return `<div class="nudges"><div class="sc">Worth knowing</div>${out.slice(0,6).map(n=>`<a class="nudge" href="${n.go}"><span class="nu-ico">${n.icon}</span><span>${n.text}</span></a>`).join('')}</div>`;
}
function bindNudges(){}
function recentEnergyDip(){
  const weeks = [0,1,2].map(w => { const vals = Array.from({length:7},(_,i)=>addDays(today(), -(w*7+i))).map(d => dayState(d)).filter(v => v !== null); return vals.length ? avg(vals) : null; });
  if(weeks.some(v => v === null)) return 0;
  return (weeks[0] < 45 && weeks[1] < 45) ? (weeks[2] < 45 ? 3 : 2) : 0;
}

/* ---------- panel 3: habits ---------- */
const STREAK_MARKS = [7, 30, 100];
/* one shared place that mutates a habit's log for a day — used by the grid cells and the rings alike */
function habitDayToggle(h, d){
  S.habitLog[d] = S.habitLog[d] || {};
  const cur = S.habitLog[d][h.id];
  let justCompleted = false;
  if(!cur){ S.habitLog[d][h.id] = {level:'full', note:''}; justCompleted = true; }
  else if(cur.level === 'full') S.habitLog[d][h.id] = {level:'min', note:''};
  else delete S.habitLog[d][h.id];
  saveNow(); sound(S.habitLog[d][h.id] ? 'success' : 'click');
  const st = habitStreak(h);
  const mark = STREAK_MARKS.find(x => st.cur === x && !(h.celebrated||[]).includes(x));
  if(mark){ h.celebrated = [...(h.celebrated||[]), mark]; saveNow(); celebrateStreak(h, mark); }
  if(h.linkedSkill && S.habitLog[d][h.id]){ const sk = byId(S.skills, h.linkedSkill); if(sk) toast(`Logged — ${esc(sk.name)} felt that.`); }
  justCompleted = justCompleted && !!S.habitLog[d][h.id];
  if(justCompleted && h.relational){
    S._pplView = h.relational === 'ringreview' ? 'circles' : S._pplView;
    if(h.relational === 'reachout') reachOutRitual(()=>{});
    else if(h.relational === 'gratitude') gratitudeRitual(()=>{});
    else if(h.relational === 'ringreview'){ toast('Open the constellation — has anyone moved? Should anyone?', 6000); navigate('#/people'); }
  }
  return {justCompleted, streak: st};
}
function checkAllHabitsDone(d){
  const due = S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d));
  if(!due.length || !due.every(h => habitDone(h,d))) return;
  S._habitsCelebrated = S._habitsCelebrated || {};
  if(S._habitsCelebrated[d]) return;
  S._habitsCelebrated[d] = true; saveNow();
  toast('Every habit, today. That is the whole game.', 5000);
  if(typeof levelUpBurst === 'function' && !reduced()) levelUpBurst(innerWidth/2, innerHeight/2, 'var(--gold)');
}
/* a line or two, right where a habit with a prompt just closed */
function microJournalPrompt(h, d){
  const m = openModal(`<h2>${esc(h.icon||'')} ${esc(h.prompt)}</h2>
    <textarea class="ta" id="mjText" placeholder="A line or two." autofocus style="min-height:80px"></textarea>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn sm ghost" id="mjSkip">skip</button><button class="btn primary" id="mjSave">Save</button></div>`, 'narrow');
  m.querySelector('#mjSkip').onclick = () => m.remove();
  m.querySelector('#mjSave').onclick = () => {
    const body = m.querySelector('#mjText').value.trim();
    if(body){
      S.entries.push({id:uid(), type:'reflection', title:h.prompt, body, occurredAt:d, createdAt:new Date().toISOString(), media:[],
        links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:h.links?.skills?[...h.links.skills]:[],projects:[],people:[]},
        people:[], places:[], emotions:[], tags:[h.name.toLowerCase().replace(/[^a-z0-9]+/g,'')].filter(Boolean), confidence:'', extra:{}});
      saveNow(); sound('success'); toast('Noted.');
    }
    m.remove();
  };
  attachDictationIn(m);
}
/* four small arcs — how each energy dimension's habits are going today */
function energyBalanceArcsHTML(d){
  const due = S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d));
  if(!due.length) return '';
  const arcs = DIMS.map(dim => { const hs = due.filter(h => h.dimension === dim.id); if(!hs.length) return ''; const n = hs.filter(h => habitDone(h,d)).length;
    return `<div class="earc">${ringSVG(n/hs.length, {size:48, stroke:5, color:dim.c})}<span class="mono">${dim.name}</span></div>`; }).filter(Boolean);
  return arcs.length ? `<div class="energy-arcs">${arcs.join('')}</div>` : '';
}
/* the rings row that sits above the calendar body — a lighter, prettier face on the same log as the grid */
function habitRingsRow(days, size){
  const bloomKey = window._bloomHabit, pulseId = window._pulseHabitId;
  const T = today();
  const cols = days.map(d => {
    const due = S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d));
    if(!due.length) return `<div class="cal-rings-col"></div>`;
    return `<div class="cal-rings-col">${due.map(h => {
      const done = habitDone(h,d); const pct = done ? (done.level==='min'?0.5:1) : 0; const future = d > T;
      const dim = DIMS.find(x => x.id === h.dimension); const st = habitStreak(h);
      const cls = [future?'future':'', bloomKey === `${h.id}:${d}` ? 'bloom' : '', (pulseId === h.id && d === T) ? 'pulse-once' : ''].filter(Boolean).join(' ');
      return `<button class="hring-btn ${cls}" data-hring="${h.id}:${d}" ${future?'disabled':''} title="${esc(h.name)}${st.cur?` · ${st.cur}d streak`:''}${future?' · not yet':''}">
        ${ringSVG(pct, {size, color: dim?dim.c:'var(--sage)', stroke: Math.max(3, Math.round(size/9))})}
        ${st.cur ? `<span class="hring-streak mono">${st.cur}</span>` : ''}</button>`;
    }).join('')}</div>`;
  });
  return `<div class="cal-rings-row"><div class="cal-gutter"></div>${cols.join('')}</div>`;
}
function bindHabitRings(box){
  $$('[data-hring]', box).forEach(b => b.onclick = () => {
    const [id, d] = b.dataset.hring.split(':'); const h = byId(S.habits, id);
    const stacked = S.habits.find(x => x.stackAfter === h.id && !x.archived && habitDue(x,d) && !habitDone(x,d));
    const res = habitDayToggle(h, d);
    if(res.justCompleted){ window._bloomHabit = `${id}:${d}`; if(stacked) window._pulseHabitId = stacked.id; checkAllHabitsDone(d); }
    rerender();
    if(res.justCompleted && h.prompt) microJournalPrompt(h, d);
  });
}
function renderHabitsPanel(box, focus){
  const T = today(); const week = planDaysFrom(focus);
  const list = S.habits.filter(h => !h.archived && !h.negative).sort((a,b) => TOD.indexOf(a.timeOfDay) - TOD.indexOf(b.timeOfDay) || (a.order||0) - (b.order||0));
  const neg = S.habits.filter(h => h.negative && !h.archived);
  const rates = list.map(h => { const r = habitWeekRates(h, 1)[0]; return r ? r.done / Math.max(r.due,1) : 0; });
  const weekRate = rates.length ? Math.round(avg(rates) * 100) : null;
  const worst = list.length ? list[rates.indexOf(Math.min(...rates))] : null;
  const best = list.reduce((b,h) => habitStreak(h).best > (b ? habitStreak(b).best : 0) ? h : b, null);
  const bloomKey = window._bloomHabit;
  box.innerHTML = `
    <div class="row between"><span class="sc" style="margin:0">The grid</span><span class="mono">${weekRate === null ? '' : `${weekRate}% this week`}</span></div>
    ${energyBalanceArcsHTML(T)}
    ${list.length ? `<div class="habit-grid" style="--cols:${week.length}">
      <div class="hg-corner"></div>${week.map(d=>`<div class="hg-dow ${d===T?'today':''}">${DOW[parseDay(d).getDay()][0]}<span class="mono">${parseDay(d).getDate()}</span></div>`).join('')}
      ${list.map(h => { const st = habitStreak(h); const dim = DIMS.find(x=>x.id===h.dimension);
        return `<div class="hg-name" data-hopen="${h.id}" style="--c:${dim?dim.c:'var(--page-accent)'}"><span class="hg-ico">${h.icon||'○'}</span><span class="hg-t">${esc(h.name)}</span>${st.cur?`<span class="hg-streak mono">${st.cur}d</span>`:''}</div>
        ${week.map(d => { const done = habitDone(h,d); const due = habitDue(h,d); const past = d < T; const future = d > T; const bloom = bloomKey === `${h.id}:${d}` ? 'bloom' : '';
          return `<button class="hg-cell ${done?(done.level==='min'?'half':'full'):past&&due?'miss':''} ${future?'future':''} ${due?'':'off'} ${bloom}" data-hcell="${h.id}:${d}" ${future?'disabled':''} style="--c:${dim?dim.c:'var(--page-accent)'}" title="${fmtDate(d,'med')}${due?'':' · not due'}"></button>`; }).join('')}`; }).join('')}
    </div>` : `<div class="empty">No habits yet. One is enough to start — the grid is more persuasive than any argument.</div>`}
    <div class="row" style="gap:6px;margin-top:10px"><button class="btn sm primary" id="hNew">＋ Habit</button>${S.habits.some(h=>h.archived)?'<button class="btn sm ghost" id="hArch">archived</button>':''}</div>

    ${list.length ? `<div class="hab-stats">
      <div class="sc">This week</div>
      <div class="stack" style="gap:5px;margin-top:8px">${list.map((h,i)=>`<div class="row between"><span class="hs-n">${esc(h.name)}</span><span class="bar" style="flex:1;--c:${(DIMS.find(x=>x.id===h.dimension)||{}).c||'var(--page-accent)'}"><i style="width:${Math.round(rates[i]*100)}%"></i></span><span class="mono">${Math.round(rates[i]*100)}%</span></div>`).join('')}</div>
      <div class="row between mono" style="margin-top:10px"><span>${best?`best streak · ${esc(best.name)} ${habitStreak(best).best}d`:''}</span><span>${worst && Math.min(...rates) < .6 ? `most missed · ${esc(worst.name)}` : ''}</span></div>
    </div>` : ''}

    ${neg.length ? `<div class="hab-stats"><div class="sc">Days since</div><div class="stack" style="gap:5px;margin-top:8px">${neg.map(h=>`<div class="row between"><span>${esc(h.name)}</span><span class="row"><b class="serif">${daysSince(S.negLast?.[h.id])===Infinity?'–':daysSince(S.negLast?.[h.id])}</b><button class="btn sm ghost" data-relapse="${h.id}">it happened</button></span></div>`).join('')}</div></div>` : ''}`;
  $('#hNew').onclick = () => openHabitModal();
  $('#hArch') && ($('#hArch').onclick = () => openArchivedHabits());
  $$('[data-hopen]',box).forEach(b => b.onclick = () => openHabitModal(b.dataset.hopen));
  $$('[data-relapse]',box).forEach(b => b.onclick = () => { S.negLast = S.negLast||{}; S.negLast[b.dataset.relapse] = today(); saveNow(); sound('error'); rerender(); });
  $$('[data-hcell]',box).forEach(c => c.onclick = () => {
    const [id, d] = c.dataset.hcell.split(':'); const h = byId(S.habits, id);
    const stacked = S.habits.find(x => x.stackAfter === h.id && !x.archived && habitDue(x,d) && !habitDone(x,d));
    const res = habitDayToggle(h, d);
    if(res.justCompleted){ window._bloomHabit = `${id}:${d}`; if(stacked) window._pulseHabitId = stacked.id; checkAllHabitsDone(d); }
    rerender();
    if(res.justCompleted && h.prompt) microJournalPrompt(h, d);
  });
}
function celebrateStreak(h, n){
  toast(`${h.icon||'✦'} ${h.name} — ${n} days.`, 5000);
  if(typeof levelUpBurst === 'function' && !reduced()) levelUpBurst(innerWidth/2, innerHeight/3, (DIMS.find(x=>x.id===h.dimension)||{}).c || 'var(--gold)');
  else sound('success');
}
function openArchivedHabits(){
  const arch = S.habits.filter(h => h.archived);
  const m = openModal(`<h2>Archived habits</h2><div class="stack" style="gap:6px">${arch.map(h=>`<div class="row between"><span class="muted">${esc(h.name)}</span><button class="btn sm ghost" data-hun="${h.id}">restore</button></div>`).join('')||'<div class="empty">None.</div>'}</div>`, 'narrow');
  m.querySelectorAll('[data-hun]').forEach(b => b.onclick = () => { byId(S.habits, b.dataset.hun).archived = false; saveNow(); m.remove(); rerender(); });
}

/* ---------- panel 4: the review that closes the day ---------- */
function renderReviewPanel(box, d){
  const T = today(); const r = dayReview(d); const p = dayPlan(d);
  const rows = tasksForDay(d); const done = rows.filter(x=>x.done).length + p.items.filter(i=>i.done).length;
  const total = rows.length + p.items.length;
  const habits = S.habits.filter(h => !h.archived && !h.negative && habitDue(h,d));
  const hDone = habits.filter(h => habitDone(h,d)).length;
  const isWeekEnd = parseDay(d).getDay() === 0;
  box.innerHTML = `
    <div class="row between"><span class="sc" style="margin:0">Close the day</span><span class="mono">${r.closedAt ? `closed ${esc(r.closedAt)}` : fmtDate(d,'med')}</span></div>
    <div class="rev-summary">${total || habits.length ? `You finished <b>${done} of ${total}</b> planned item${total===1?'':'s'} and <b>${hDone} of ${habits.length}</b> habit${habits.length===1?'':'s'}.${p.intentions.filter(Boolean).length?` You named ${p.intentions.filter(Boolean).length} intention${p.intentions.filter(Boolean).length===1?'':'s'} this morning.`:''}` : 'Nothing was planned for this day.'}</div>
    ${p.intentions.filter(Boolean).length ? `<div class="rev-intentions">${p.intentions.filter(Boolean).map((t,i)=>`<label class="pick-row ${(r.metIntentions||[]).includes(i)?'on':''}"><input type="checkbox" data-revint="${i}" ${(r.metIntentions||[]).includes(i)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div>` : ''}

    <div class="field" style="margin-top:14px"><label>How was your energy?</label>
      <div class="energy-faces">${[1,2,3,4,5].map(n=>`<button class="ef ${r.energy===n?'on':''}" data-renergy="${n}" title="${['drained','low','level','good','full'][n-1]}">${n}</button>`).join('')}</div></div>

    <div class="field"><label>How did it feel?</label>
      <div class="chip-row">${MOOD_TAGS.map(t=>`<button class="chip click ${(r.moods||[]).includes(t)?'on':''}" data-rmood="${t}">${t}</button>`).join('')}</div></div>

    <div class="field"><label>Anything worth saying</label><textarea class="ta" id="revNote" placeholder="What went well? What would you change?">${esc(r.note||'')}</textarea></div>

    <div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" id="revClose">${r.closedAt?'Update':'Close the day'}</button><button class="btn sm ghost" id="revWeek">Weekly review${isWeekEnd?' ·  due':''}</button></div>

    ${recentEnergyDip() ? `<div class="nudges" style="margin-top:14px"><a class="nudge" href="#/values"><span class="nu-ico">◔</span><span>Your energy has been low for a couple of weeks. A congruence snapshot might show which value is going unpaid.</span></a></div>` : ''}`;
  $$('[data-renergy]',box).forEach(b => b.onclick = () => { r.energy = r.energy === +b.dataset.renergy ? 0 : +b.dataset.renergy; saveNow(); sound('click'); rerender(); });
  $$('[data-rmood]',box).forEach(b => b.onclick = () => { r.moods = r.moods || []; const t = b.dataset.rmood;
    r.moods = r.moods.includes(t) ? r.moods.filter(x=>x!==t) : [...r.moods, t]; saveNow(); b.classList.toggle('on'); });
  $$('[data-revint]',box).forEach(c => c.onchange = () => { r.metIntentions = r.metIntentions || []; const i = +c.dataset.revint;
    r.metIntentions = c.checked ? [...new Set([...r.metIntentions, i])] : r.metIntentions.filter(x=>x!==i); saveNow(); c.closest('.pick-row').classList.toggle('on', c.checked); });
  const revN = $('#revNote'); revN.addEventListener('input', debounce(() => { r.note = revN.value; saveNow(); }, 500));
  $('#revClose').onclick = () => {
    r.note = revN.value; r.closedAt = new Date().toTimeString().slice(0,5);
    const c = checkin(d); if(r.energy) c.setpoint = c.setpoint || Math.round(1 + (r.energy-1)/4*21);
    if(r.note && !c.sentence) c.sentence = r.note.split('\n')[0].slice(0,160);
    saveNow(); sound('success'); toast('Day closed.'); rerender();
  };
  $('#revWeek').onclick = () => openWeeklyReview(d);
  attachDictationIn(box);
}
function openWeeklyReview(d = today()){
  const days = planDaysFrom(d); const T = today();
  const tasks = days.flatMap(x => tasksForDay(x)); const tDone = tasks.filter(t=>t.done).length;
  const plans = days.map(x => S.plans?.[x]).filter(Boolean);
  const planned = plans.flatMap(p => p.items || []); const pDone = planned.filter(i=>i.done).length;
  const revs = days.map(x => S.reviewLog?.[x]).filter(r => r && (r.energy || r.moods?.length));
  const energies = revs.map(r => r.energy).filter(Boolean);
  const moodCount = {}; revs.forEach(r => (r.moods||[]).forEach(m => moodCount[m] = (moodCount[m]||0)+1));
  const habitsAll = S.habits.filter(h => !h.archived && !h.negative);
  const hDue = sum(days.map(x => habitsAll.filter(h => habitDue(h,x)).length));
  const hDone = sum(days.map(x => habitsAll.filter(h => habitDue(h,x) && habitDone(h,x)).length));
  const intentions = plans.flatMap(p => (p.intentions||[]).filter(Boolean));
  const m = openModal(`<h2>The week of ${fmtDate(days[0],'med')}</h2>
    <div class="income-strip" style="margin:12px 0 18px">
      <div><div class="k">tasks finished</div><div class="num">${tDone}<span class="mono"> / ${tasks.length}</span></div></div>
      <div><div class="k">plan items</div><div class="num">${pDone}<span class="mono"> / ${planned.length}</span></div></div>
      <div><div class="k">habits kept</div><div class="num">${hDue?Math.round(hDone/hDue*100):0}<span class="mono">%</span></div></div>
      <div><div class="k">average energy</div><div class="num">${energies.length?avg(energies).toFixed(1):'—'}<span class="mono"> / 5</span></div></div>
    </div>
    <div class="grid c2" style="gap:14px;align-items:start">
      <div><span class="sc">Planned versus done</span>
        <div class="stack" style="gap:4px;margin-top:8px;max-height:30vh;overflow:auto">${
          [...tasks, ...planned.map(i=>({text:i.text, done:i.done}))].map(x=>`<div class="row between"><span class="${x.done?'':'faint'}" style="${x.done?'text-decoration:line-through':''}">${esc(x.text)}</span><span class="mono">${x.done?'✓':'—'}</span></div>`).join('') || '<div class="empty">Nothing was planned.</div>'}</div></div>
      <div><span class="sc">How it felt</span>
        ${Object.keys(moodCount).length ? `<div class="mood-bars">${Object.entries(moodCount).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<div class="row between"><span>${esc(t)}</span><span class="bar" style="flex:1;--c:var(--page-accent)"><i style="width:${Math.round(n/revs.length*100)}%"></i></span><span class="mono">${n}</span></div>`).join('')}</div>` : '<div class="empty">No days were closed this week.</div>'}
        ${intentions.length ? `<div class="sc" style="margin-top:14px">What you said mattered</div><ul class="ch-goals">${intentions.slice(0,8).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </div>
    </div>
    <div class="field" style="margin-top:16px"><label>What is the focus for next week?</label><textarea class="ta" id="wkFocus" placeholder="One sentence. It becomes the first thing you see when you plan Monday.">${esc(S.reviews.nextWeekFocus||'')}</textarea></div>
    <div class="row between" style="margin-top:14px"><span class="faint" style="font-size:.78rem">${daysSince(S.reviews.lastWeekly)===Infinity?'first weekly review':`last one ${relDays(daysSince(S.reviews.lastWeekly))}`}</span><button class="btn primary" id="wkSave">Mark the week reviewed</button></div>`, 'wide');
  attachDictationIn(m);
  m.querySelector('#wkSave').onclick = () => {
    S.reviews.nextWeekFocus = m.querySelector('#wkFocus').value.trim();
    S.reviews.lastWeekly = today(); saveNow(); m.remove(); sound('success'); toast('Week reviewed.'); rerender();
  };
}
