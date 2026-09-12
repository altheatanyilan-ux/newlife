/* ============================================================
   PLANNING — the same work, read four other ways.

   A list answers "what is next". A calendar answers "when". A board
   answers "how far along". A matrix answers "does this deserve today
   at all". A timeline answers "how long, and against what else". They
   are not decoration: each is a different question, and the same
   tasks answer all five.
   ============================================================ */

/* ---------- shared: the card used by the board and the matrix ---------- */
function planCardHTML(t){
  const pr = planPriority(t.priority), sub = planSubProgress(t), late = planIsLate(t);
  return `<div class="pk-card${t.done ? ' done' : ''}${late ? ' late' : ''}${S._planPick?.has(t.id) ? ' picked' : ''}"
      data-ptcard="${t.id}" draggable="true" style="${pr.color ? `--pc:${pr.color}` : ''}">
    <div class="pk-top">
      <button class="pt-box sm" data-ptdone="${t.id}" role="checkbox" aria-checked="${t.done}"
        style="${pr.color ? `--pc:${pr.color}` : ''}"><svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
      <span class="pk-text">${esc(t.text || 'Untitled task')}</span></div>
    ${sub ? `<button class="pk-bar" data-tsubs="${t.id}" title="${sub.done} of ${sub.total} steps — ${subsOpen(t.id, t) ? 'hide them' : 'show them'}"><i style="width:${Math.round(sub.done / sub.total * 100)}%"></i></button>` : ''}
    <!-- the matrix is the view this page opens on, so steps have to be legible
         here too, not only in the list -->
    ${subsOpen(t.id, t) ? subBlockHTML(t.id, t) : ''}
    <div class="pk-meta">
      ${t.day ? `<span class="mono${late ? ' late' : ''}">${late ? '⚠ ' : ''}${esc(fmtDate(t.day, 'short'))}</span>` : ''}
      ${t.duration ? `<span class="mono">${t.duration >= 60 ? (t.duration / 60).toFixed(t.duration % 60 ? 1 : 0) + 'h' : t.duration + 'm'}</span>` : ''}
      ${t.tags.map(x => `<span class="pt-tag" style="--c:${planTagColor(x)}">${esc(x)}</span>`).join('')}
    </div></div>`;
}
const planTimeToMin = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const planMinToTime = n => `${pad(Math.floor(n / 60) % 24)}:${pad(Math.round(n) % 60)}`;

/* ---------- calendar ---------- */
function planCalCursor(){ return S._planCal || (S._planCal = today()); }
function planCalendarHTML(tasks){
  const mode = planState().prefs.calMode || 'month';
  const cur = planCalCursor();
  const label = mode === 'month' ? fmtDate(cur, 'long').replace(/^\w+,?\s*/, '').replace(/^\d+\s+/, '')
    : mode === 'week' ? `week of ${fmtDate(planWeekStart(cur), 'med')}` : fmtDate(cur, 'long');
  return `<div class="pc-wrap">
    <div class="pc-head">
      <button class="pl-mini" data-pcnav="-1">‹</button>
      <span class="pc-label serif">${esc(mode === 'month' ? planMonthLabel(cur) : label)}</span>
      <button class="pl-mini" data-pcnav="1">›</button>
      <button class="pf-chip" data-pcnav="0">today</button>
      <span style="margin-left:auto"></span>
      ${[['month','Month'],['week','Week'],['day','Day']].map(([k, n]) =>
        `<button class="pf-chip${mode === k ? ' on' : ''}" data-pcmode="${k}">${n}</button>`).join('')}
    </div>
    ${mode === 'day' ? planCalDayHTML(cur, tasks)
      : `<div class="pc-scroll">${mode === 'month' ? planCalMonthHTML(cur, tasks) : planCalWeekHTML(cur, tasks)}</div>`}
  </div>`;
}
function planMonthLabel(d){ const x = parseDay(d); return `${MONTHS[x.getMonth()]} ${x.getFullYear()}`; }
function planWeekStart(d){ const x = parseDay(d); const back = (x.getDay() + 6) % 7; return addDays(d, -back); }
function planCalMonthHTML(cur, tasks){
  const c = parseDay(cur), y = c.getFullYear(), m = c.getMonth();
  const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const byDay = new Map();
  tasks.forEach(t => { if(!t.day) return; if(!byDay.has(t.day)) byDay.set(t.day, []); byDay.get(t.day).push(t); });
  const cells = [];
  for(let i = 0; i < lead; i++) cells.push('<div class="pc-cell blank"></div>');
  for(let d = 1; d <= days; d++){
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    const ts = byDay.get(iso) || [];
    const late = ts.some(planIsLate);
    cells.push(`<div class="pc-cell${iso === today() ? ' now' : ''}${late ? ' late' : ''}" data-pcday="${iso}">
      <div class="pc-n"><span>${d}</span><button class="pc-add" data-pcadd="${iso}" title="add on this day">＋</button></div>
      ${ts.slice(0, 3).map(t => `<button class="pc-pill${t.done ? ' done' : ''}" data-ptcard="${t.id}" draggable="true"
        title="${esc(t.text)}${t.dueTime ? ' · ' + esc(t.dueTime) : ''}"
        style="--c:${planPriority(t.priority).color || planListColor(t.listId)}">${esc(t.text)}</button>`).join('')}
      ${ts.length > 3 ? `<button class="pc-more" data-pcopen="${iso}">+${ts.length - 3} more</button>` : ''}</div>`);
  }
  return `<div class="pc-dow">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="pc-grid">${cells.join('')}</div>`;
}
function planCalWeekHTML(cur, tasks){
  const start = planWeekStart(cur);
  const days = Array.from({length:7}, (_, i) => addDays(start, i));
  return `<div class="pc-week">${days.map(d => {
    const ts = tasks.filter(t => t.day === d);
    const timed = ts.filter(t => t.dueTime).sort((a, b) => a.dueTime.localeCompare(b.dueTime));
    const allday = ts.filter(t => !t.dueTime);
    return `<div class="pc-col${d === today() ? ' now' : ''}" data-pcday="${d}">
      <div class="pc-colh"><span class="mono">${['Mo','Tu','We','Th','Fr','Sa','Su'][(parseDay(d).getDay() + 6) % 7]}</span>
        <span class="serif">${parseDay(d).getDate()}</span>
        <button class="pc-add" data-pcadd="${d}">＋</button></div>
      <div class="pc-allday">${allday.map(t => `<button class="pc-pill${t.done ? ' done' : ''}" data-ptcard="${t.id}" draggable="true"
        title="${esc(t.text)}" style="--c:${planPriority(t.priority).color || planListColor(t.listId)}">${esc(t.text)}</button>`).join('')}</div>
      <div class="pc-timed">${timed.map(t => `<button class="pc-pill timed${t.done ? ' done' : ''}" data-ptcard="${t.id}" draggable="true"
        title="${esc(t.dueTime)} · ${esc(t.text)}" style="--c:${planPriority(t.priority).color || planListColor(t.listId)}"><span class="mono">${esc(t.dueTime)}</span> ${esc(t.text)}</button>`).join('')}</div>
    </div>`; }).join('')}</div>`;
}
const PC_DAY_H = 46;                              // pixels per hour on the day timeline
function planCalDayHTML(cur, tasks){
  const ts = tasks.filter(t => t.day === cur);
  const timed = ts.filter(t => t.dueTime), loose = ts.filter(t => !t.dueTime);
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  return `<div class="pc-daywrap">
    <div class="pc-loose"><div class="k mono">unscheduled on this day</div>
      <div class="pc-loosebox" data-pcunsched>${loose.map(t => `<button class="pc-pill" data-ptcard="${t.id}" draggable="true"
        title="${esc(t.text)}" style="--c:${planPriority(t.priority).color || planListColor(t.listId)}">${esc(t.text)}</button>`).join('')
        || '<span class="faint mono">nothing loose — drag a block up here to unschedule it</span>'}</div></div>
    <div class="pc-day" data-pcdayline="${cur}" style="height:${24 * PC_DAY_H}px">
      ${Array.from({length:24}, (_, h) => `<div class="pc-hour" style="top:${h * PC_DAY_H}px"><span class="mono">${pad(h)}:00</span></div>`).join('')}
      ${cur === today() ? `<div class="pc-now" style="top:${(nowMin / 60) * PC_DAY_H}px"><span class="mono">${pad(now.getHours())}:${pad(now.getMinutes())}</span></div>` : ''}
      ${timed.map(t => { const start = planTimeToMin(t.dueTime) || 0;
        const dur = t.duration || 30;
        return `<div class="pc-block${t.done ? ' done' : ''}" data-ptcard="${t.id}" draggable="true" data-pcblock="${t.id}"
          style="top:${(start / 60) * PC_DAY_H}px;height:${Math.max(20, (dur / 60) * PC_DAY_H)}px;--c:${planPriority(t.priority).color || planListColor(t.listId)}">
          <span class="pc-btext">${esc(t.text)}</span><span class="mono">${esc(t.dueTime)}</span>
          <span class="pc-grip" data-pcgrip="${t.id}" title="drag to change how long"></span></div>`; }).join('')}
    </div></div>`;
}

/* ---------- board ---------- */
function planKanbanHTML(sel, tasks){
  const l = sel.kind === 'list' ? planList(sel.id) : null;
  const cols = (l ? l.kanbanColumns : DEFAULT_KANBAN()).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  return `<div class="pk-board">${cols.map(c => {
    const ts = tasks.filter(t => (t.kanbanColumn || 'todo') === c.id);
    const over = c.wipLimit != null && ts.filter(t => !t.done).length > c.wipLimit;
    return `<div class="pk-col${over ? ' over-wip' : ''}" data-pkcol="${c.id}" style="--c:${c.color}">
      <div class="pk-colh"><span class="pk-cname">${esc(c.name)}</span>
        <span class="mono">${ts.length}${c.wipLimit != null ? ` / ${c.wipLimit}` : ''}</span>
        ${l ? `<button class="pl-mini" data-pkedit="${c.id}" title="rename, limit, remove">⋯</button>` : ''}</div>
      <div class="pk-cards">${ts.map(planCardHTML).join('') || '<div class="pk-empty">Nothing here yet. Drag a task in, or add one.</div>'}</div>
      <input class="inp pk-add" data-pqadd='${esc(JSON.stringify({listId: l?.id, kanbanColumn: c.id}))}' placeholder="＋ add">
    </div>`; }).join('')}
    ${l ? `<button class="pk-newcol" id="pkNewCol">＋ column</button>` : ''}</div>`;
}

/* ---------- matrix ---------- */
function planMatrixHTML(tasks){
  const loose = tasks.filter(t => !t.quadrant);
  return `<div class="pe-grid">${PLAN_QUADRANTS.map(q => {
    const ts = tasks.filter(t => t.quadrant === q.n);
    return `<div class="pe-quad" data-pequad="${q.n}" style="--c:${q.color}">
      <div class="pe-head"><span class="pe-name">${esc(q.name)}</span><span class="pe-act">${esc(q.act)}</span>
        <span class="mono">${ts.length}</span></div>
      <div class="pe-cards">${ts.map(planCardHTML).join('') || '<div class="pk-empty">Empty. That is allowed.</div>'}</div>
      <input class="inp pk-add" data-pqadd='${esc(JSON.stringify({quadrant: q.n}))}' placeholder="＋ add here">
    </div>`; }).join('')}</div>
    <details class="pe-tray"${loose.length ? ' open' : ''}><summary><span class="sc">Not yet placed</span><span class="mono">${loose.length}</span></summary>
      <div class="pe-traybox" data-pequad="0">${loose.map(planCardHTML).join('')
        || '<div class="pk-empty">Everything has been placed.</div>'}</div></details>`;
}

/* ---------- timeline ---------- */
const PL_SCALES = {day:{n:14, w:64, step:1}, week:{n:12, w:56, step:7}, month:{n:12, w:64, step:30}};
function planTimelineHTML(tasks){
  const scale = planState().prefs.tlScale || 'week';
  const sc = PL_SCALES[scale];
  const start = addDays(today(), -sc.step * 2);
  const total = sc.n * sc.step;
  const px = d => (daysBetween(start, d) / total) * (sc.n * sc.w);
  const W = sc.n * sc.w;
  const dated = tasks.filter(t => t.day || t.startDate);
  const rows = dated.map(t => {
    const s = t.startDate || t.day, e = t.day || t.startDate;
    const x0 = clamp(px(s), 0, W), x1 = clamp(px(e), 0, W);
    return {t, x0: Math.min(x0, x1), w: Math.max(8, Math.abs(x1 - x0) || 14)};
  });
  const ticks = Array.from({length: sc.n + 1}, (_, i) => addDays(start, i * sc.step));
  return `<div class="pl-tl">
    <div class="pl-tlbar">${Object.keys(PL_SCALES).map(k =>
      `<button class="pf-chip${scale === k ? ' on' : ''}" data-tlscale="${k}">${k}</button>`).join('')}
      <span class="faint mono" style="margin-left:auto">drag a bar to move it · drag its right edge to change the due date</span></div>
    <div class="pl-tlscroll"><div class="pl-tlinner" style="width:${W + 190}px">
      <div class="pl-tlaxis" style="margin-left:190px;width:${W}px">
        ${ticks.map((d, i) => `<span class="pl-tick" style="left:${(i / sc.n) * W}px">${esc(fmtDate(d, 'short'))}</span>`).join('')}
        <div class="pl-tlnow" style="left:${px(today())}px"></div></div>
      <div class="pl-tlrows">${rows.map(({t, x0, w}) => `<div class="pl-tlrow">
        <span class="pl-tlname" title="${esc(t.text)}">${esc(t.text)}</span>
        <div class="pl-tltrack" style="width:${W}px">
          <div class="pl-gbar${t.done ? ' done' : ''}" data-ptcard="${t.id}" data-tlbar="${t.id}" draggable="true"
            style="left:${x0}px;width:${w}px;--c:${planPriority(t.priority).color || planListColor(t.listId)}"
            title="${esc(t.text)} · ${t.startDate ? esc(fmtDate(t.startDate, 'short')) + ' → ' : ''}${t.day ? esc(fmtDate(t.day, 'med')) : 'no date'}">
            <span class="pl-gbaredge" data-tledge="${t.id}"></span></div></div></div>`).join('')
        || '<div class="empty">Nothing here carries a date yet. A timeline needs one to draw against.</div>'}</div>
    </div></div></div>`;
}

/* ---------- bindings for all four ---------- */
function bindPlanViews(root, sel, tasks){
  const p = planState();

  /* calendar */
  $$('[data-pcmode]', root).forEach(b => b.onclick = () => { p.prefs.calMode = b.dataset.pcmode; saveNow(); rerender(); });
  $$('[data-pcnav]', root).forEach(b => b.onclick = () => {
    const n = +b.dataset.pcnav, mode = p.prefs.calMode || 'month';
    if(!n){ S._planCal = today(); }
    else if(mode === 'month'){ const d = parseDay(planCalCursor()); d.setDate(1); d.setMonth(d.getMonth() + n); S._planCal = isoDay(d); }
    else S._planCal = addDays(planCalCursor(), n * (mode === 'week' ? 7 : 1));
    rerender(); });
  $$('[data-pcadd]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const t = newPlanTask('New task', b.dataset.pcadd, {listId: sel.kind === 'list' ? sel.id : 'inbox'});
    S.tasks.push(t); saveNow(); sound('click'); rerender(); setTimeout(() => openPlanTask(t.id), 80); });
  $$('[data-pcopen]', root).forEach(b => b.onclick = () => { S._planCal = b.dataset.pcopen;
    p.prefs.calMode = 'day'; saveNow(); rerender(); });
  /* a day cell, a week column and the unscheduled tray all take a dropped task */
  $$('[data-pcday]', root).forEach(cell => {
    cell.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); cell.classList.add('over'); } });
    cell.addEventListener('dragleave', () => cell.classList.remove('over'));
    cell.addEventListener('drop', ev => { ev.preventDefault(); cell.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      t.day = cell.dataset.pcday; planSyncReminders(t); saveNow(); sound('click'); rerender(); });
  });
  const unsched = root.querySelector('[data-pcunsched]');
  if(unsched){
    unsched.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); unsched.classList.add('over'); } });
    unsched.addEventListener('dragleave', () => unsched.classList.remove('over'));
    unsched.addEventListener('drop', ev => { ev.preventDefault(); unsched.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      t.dueTime = ''; planSyncReminders(t); saveNow(); sound('click'); rerender(); });
  }
  /* the day timeline: dropping anywhere on it sets the hour, and the grip
     at the bottom of a block sets how long it runs */
  const line = root.querySelector('[data-pcdayline]');
  if(line){
    line.addEventListener('dragover', ev => { if(window._plTaskDrag) ev.preventDefault(); });
    line.addEventListener('drop', ev => { ev.preventDefault();
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      const y = ev.clientY - line.getBoundingClientRect().top;
      const mins = clamp(Math.round((y / PC_DAY_H) * 60 / 15) * 15, 0, 23 * 60 + 45);
      t.day = line.dataset.pcdayline; t.dueTime = planMinToTime(mins);
      planSyncReminders(t); saveNow(); sound('click'); rerender(); });
    line.addEventListener('click', ev => {
      if(ev.target.closest('.pc-block')) return;
      const y = ev.clientY - line.getBoundingClientRect().top;
      const mins = clamp(Math.round((y / PC_DAY_H) * 60 / 30) * 30, 0, 23 * 60 + 30);
      const t = newPlanTask('New task', line.dataset.pcdayline, {dueTime: planMinToTime(mins), duration:30,
        listId: sel.kind === 'list' ? sel.id : 'inbox'});
      S.tasks.push(t); saveNow(); sound('click'); rerender(); setTimeout(() => openPlanTask(t.id), 80); });
    $$('[data-pcgrip]', root).forEach(g => g.addEventListener('mousedown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const t = planTaskById(g.dataset.pcgrip); if(!t) return;
      const block = g.closest('.pc-block'), y0 = ev.clientY, h0 = block.offsetHeight;
      const move = e2 => { const h = Math.max(20, h0 + (e2.clientY - y0));
        block.style.height = h + 'px'; };
      const up = e2 => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
        const mins = Math.max(15, Math.round((block.offsetHeight / PC_DAY_H) * 60 / 15) * 15);
        t.duration = mins; saveNow(); sound('click'); rerender(); };
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    }));
  }

  /* board */
  $$('[data-pkcol]', root).forEach(col => {
    col.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); col.classList.add('over'); } });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      const to = col.dataset.pkcol;
      t.kanbanColumn = to;
      /* the Done column means done — the board and the checkbox cannot disagree */
      if(to === 'done' && !t.done) planSetDone(t, true);
      else if(to !== 'done' && t.done) planSetDone(t, false);
      t.updatedAt = new Date().toISOString(); saveNow(); sound('click'); rerender(); });
  });
  $$('[data-pkedit]', root).forEach(b => b.onclick = () => openPlanColumnModal(sel, b.dataset.pkedit));
  const nc = $('#pkNewCol'); if(nc) nc.onclick = () => {
    const l = planList(sel.id); if(!l) return;
    const name = prompt('Name the column'); if(!name || !name.trim()) return;
    l.kanbanColumns.push({id:uid(), name:name.trim(), color:PLAN_COLORS[l.kanbanColumns.length % PLAN_COLORS.length],
      wipLimit:null, sortOrder:l.kanbanColumns.length});
    saveNow(); sound('click'); rerender(); };

  /* matrix */
  $$('[data-pequad]', root).forEach(q => {
    q.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); q.classList.add('over'); } });
    q.addEventListener('dragleave', () => q.classList.remove('over'));
    q.addEventListener('drop', ev => { ev.preventDefault(); q.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      t.quadrant = +q.dataset.pequad || null; t.updatedAt = new Date().toISOString();
      saveNow(); sound('click'); rerender(); });
  });

  /* timeline */
  $$('[data-tlscale]', root).forEach(b => b.onclick = () => { p.prefs.tlScale = b.dataset.tlscale; saveNow(); rerender(); });
  const sc = PL_SCALES[p.prefs.tlScale || 'week'];
  const perPx = (sc.n * sc.step) / (sc.n * sc.w);            // days per pixel
  $$('[data-tlbar]', root).forEach(bar => {
    const t = planTaskById(bar.dataset.tlbar); if(!t) return;
    const grab = (ev, edge) => {
      ev.preventDefault(); ev.stopPropagation();
      const x0 = ev.clientX, left0 = bar.offsetLeft, w0 = bar.offsetWidth;
      const move = e2 => { const dx = e2.clientX - x0;
        if(edge){ bar.style.width = Math.max(8, w0 + dx) + 'px'; }
        else bar.style.left = Math.max(0, left0 + dx) + 'px'; };
      const up = e2 => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
        const dDays = Math.round((e2.clientX - x0) * perPx);
        if(!dDays){ rerender(); return; }
        if(edge){ if(t.day) t.day = addDays(t.day, dDays); }
        else { if(t.day) t.day = addDays(t.day, dDays); if(t.startDate) t.startDate = addDays(t.startDate, dDays); }
        planSyncReminders(t); saveNow(); sound('click'); rerender(); };
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    };
    bar.addEventListener('mousedown', ev => { if(ev.target.closest('[data-tledge]')) return; grab(ev, false); });
    bar.querySelector('[data-tledge]')?.addEventListener('mousedown', ev => grab(ev, true));
  });
}

function openPlanColumnModal(sel, colId){
  const l = planList(sel.id); if(!l) return;
  const c = l.kanbanColumns.find(x => x.id === colId); if(!c) return;
  const m = openModal(`<h2>Column</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp" id="pkName" value="${esc(c.name)}"></div>
    <div class="field"><label>Colour</label><div class="pl-swatches">${PLAN_COLORS.map(x =>
      `<button class="pl-sw${c.color === x ? ' on' : ''}" data-pkc="${x}" style="background:${x}"></button>`).join('')}</div></div>
    <div class="field"><label>Work-in-progress limit</label>
      <input class="inp mono" id="pkWip" value="${c.wipLimit == null ? '' : c.wipLimit}" placeholder="leave blank for none">
      <div class="faint" style="font-size:.74rem;margin-top:4px">Past the limit the column warns rather than blocks — it is a question, not a gate.</div></div>
    <div class="row between"><button class="btn sm ghost danger" id="pkDel">remove column</button>
      <button class="btn primary" id="pkSave">Save</button></div></div>`, 'narrow');
  let color = c.color;
  m.querySelectorAll('[data-pkc]').forEach(b => b.onclick = () => { color = b.dataset.pkc;
    m.querySelectorAll('[data-pkc]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#pkSave').onclick = () => {
    c.name = m.querySelector('#pkName').value.trim() || 'Column'; c.color = color;
    const w = parseInt(m.querySelector('#pkWip').value, 10); c.wipLimit = isNaN(w) ? null : Math.max(1, w);
    saveNow(); m.remove(); rerender(); };
  m.querySelector('#pkDel').onclick = () => { m.remove();
    if(l.kanbanColumns.length < 2) return toast('A board needs at least one column.');
    requestDelete({label:c.name, after:planRedraw, remove: () => {
      const first = l.kanbanColumns.find(x => x.id !== c.id).id;
      const moved = (S.tasks || []).filter(t => t.kanbanColumn === c.id);
      moved.forEach(t => t.kanbanColumn = first);
      const back = spliceOut(l.kanbanColumns, x => x.id === c.id);
      return () => { back(); moved.forEach(t => t.kanbanColumn = c.id); }; }}); };
}
