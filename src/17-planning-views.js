/* ============================================================
   PLANNING — the same work, read four other ways.

   A list answers "what is next". A calendar answers "when". A board
   answers "how far along". A matrix answers "does this deserve today
   at all". A timeline answers "how long, and against what else". They
   are not decoration: each is a different question, and the same
   tasks answer all five.
   ============================================================ */

/* ---------- shared: the card used by the board and the matrix ----------
   `tail` is anything that belongs inside the card but is not part of it —
   the tray's width handle is the only caller so far. Passed explicitly,
   never by .map, because .map would hand it the index. */
function planCardHTML(t, tail){
  const pr = planPriority(t.priority), sub = planSubProgress(t), late = planIsLate(t);
  return `<div class="pk-card${t.done ? ' done' : ''}${late ? ' late' : ''}${S._planPick?.has(t.id) ? ' picked' : ''}"
      data-ptcard="${t.id}" draggable="true" style="${pr.color ? `--pc:${pr.color}` : ''}">
    <div class="pk-top">
      <button class="pt-box sm" data-ptdone="${t.id}" role="checkbox" aria-checked="${t.done}"
        style="${pr.color ? `--pc:${pr.color}` : ''}"><svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
      <span class="pk-text" title="open this task">${esc(t.text || 'Untitled task')}</span>
      <button class="task-pen" data-tedit="${t.id}" title="rename it here" aria-label="rename">✎</button>
      ${taskEstHTML(t.id, t, {sm:true})}
      <!-- the same caret a list row has, so steps fold here too rather than
           being permanently open on a card -->
      ${subCaretHTML(t.id, t, 'task-caret pk-caret')}</div>
    ${sub ? `<button class="pk-bar" data-tsubs="${t.id}" title="${sub.done} of ${sub.total} steps — ${subsOpen(t.id, t) ? 'hide them' : 'show them'}"><i style="width:${Math.round(sub.done / sub.total * 100)}%"></i></button>` : ''}
    <!-- the matrix is the view this page opens on, so steps have to be legible
         here too, not only in the list -->
    ${subsOpen(t.id, t) ? subBlockHTML(t.id, t) : ''}
    <div class="pk-meta">
      ${t.day ? `<span class="mono${late ? ' late' : ''}">${late ? '⚠ ' : ''}${esc(fmtDate(t.day, 'short'))}</span>` : ''}
      ${t.duration ? `<span class="mono">${t.duration >= 60 ? (t.duration / 60).toFixed(t.duration % 60 ? 1 : 0) + 'h' : t.duration + 'm'}</span>` : ''}
      ${t.tags.map(x => `<span class="pt-tag" style="--c:${planTagColor(x)}">${esc(x)}</span>`).join('')}
    </div>${tail || ''}</div>`;
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
      <div class="pc-allday" data-ptgroup>${allday.map(t => `<button class="pc-pill${t.done ? ' done' : ''}" data-ptcard="${t.id}" draggable="true"
        title="${esc(t.text)}" style="--c:${planPriority(t.priority).color || planListColor(t.listId)}">${esc(t.text)}</button>`).join('')}</div>
      <div class="pc-timed" data-ptgroup>${timed.map(t => `<button class="pc-pill timed${t.done ? ' done' : ''}" data-ptcard="${t.id}" draggable="true"
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
      <div class="pc-loosebox" data-pcunsched data-ptgroup>${loose.map(t => `<button class="pc-pill" data-ptcard="${t.id}" draggable="true"
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
/* The Board and the Timeline used to live here — 106 lines of column
   dragging and Gantt bars. Both are gone: the Board arranged tasks by a
   status the matrix already arranges them by, and the Timeline drew bars
   against dates the milestone strip draws above every view. Their drop
   handlers, the column modal and the bar-drag maths went with them. */
/* ---------- matrix ----------
   The quadrants are a grid and size themselves; the tray underneath is a
   wrapping row, so its cards need a width given to them. 210px was narrow
   enough that anything but a short title wrapped to four lines, so: wider
   by default, and dragged from a card's right edge like a board column. */
const PE_TRAY_W = 320, PE_TRAY_MIN = 170, PE_TRAY_MAX = 720;
function peTrayWidth(){ return clamp(+planState().prefs.trayW || PE_TRAY_W, PE_TRAY_MIN, PE_TRAY_MAX); }
function peSetTrayWidth(w){ planState().prefs.trayW = Math.round(clamp(w, PE_TRAY_MIN, PE_TRAY_MAX)); }
const peTrayGripHTML = () => `<div class="pe-grip" data-petraygrip title="drag to widen · double-click to reset"
  role="separator" aria-label="width of the cards waiting here" tabindex="0"></div>`;
function planMatrixHTML(tasks){
  const loose = tasks.filter(t => !t.quadrant);
  return `<div class="pe-grid">${PLAN_QUADRANTS.map(q => {
    const ts = tasks.filter(t => t.quadrant === q.n);
    return `<div class="pe-quad" data-pequad="${q.n}" style="--c:${q.color}">
      <div class="pe-head"><span class="pe-name">${esc(q.name)}</span><span class="pe-act">${esc(q.act)}</span>
        <span class="mono">${ts.length}</span></div>
      <div class="pe-cards" data-ptgroup>${ts.map(t => planCardHTML(t)).join('') || '<div class="pk-empty">Empty. That is allowed.</div>'}</div>
      <input class="inp pk-add" data-pqadd='${esc(JSON.stringify({quadrant: q.n}))}' placeholder="＋ add here">
    </div>`; }).join('')}</div>
    <details class="pe-tray"${loose.length ? ' open' : ''}><summary><span class="sc">Not yet placed</span><span class="mono">${loose.length}</span></summary>
      <div class="pe-traybox" data-pequad="0" data-ptgroup style="--pew:${peTrayWidth()}px">${
        loose.map(t => planCardHTML(t, peTrayGripHTML())).join('')
        || '<div class="pk-empty">Everything has been placed.</div>'}</div></details>`;
}

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

  /* matrix — the tray card's right edge sets how wide every card in the tray
     is. Written straight to the box while dragging so the cards follow the
     pointer; a re-render per pointermove would fight the drag. */
  const trayBox = $('.pe-traybox', root);
  if(trayBox) $$('[data-petraygrip]', trayBox).forEach(grip => {
    const apply = w => { peSetTrayWidth(w); trayBox.style.setProperty('--pew', peTrayWidth() + 'px'); };
    grip.addEventListener('pointerdown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const x0 = ev.clientX, w0 = peTrayWidth();
      grip.setPointerCapture(ev.pointerId); trayBox.classList.add('sizing');
      const move = e => apply(w0 + (e.clientX - x0));
      const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up);
        grip.removeEventListener('pointercancel', up); trayBox.classList.remove('sizing'); saveNow(); };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
      grip.addEventListener('pointercancel', up);
    });
    grip.addEventListener('dblclick', ev => { ev.stopPropagation(); apply(PE_TRAY_W); saveNow(); sound('click'); });
    grip.addEventListener('click', ev => ev.stopPropagation());
    grip.addEventListener('keydown', ev => {
      const d = ev.key === 'ArrowRight' ? 24 : ev.key === 'ArrowLeft' ? -24 : 0;
      if(!d) return; ev.preventDefault(); ev.stopPropagation(); apply(peTrayWidth() + d); saveNow();
    });
  });

  $$('[data-pequad]', root).forEach(q => {
    q.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); q.classList.add('over'); } });
    q.addEventListener('dragleave', () => q.classList.remove('over'));
    q.addEventListener('drop', ev => { ev.preventDefault(); q.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      t.quadrant = +q.dataset.pequad || null; t.updatedAt = new Date().toISOString();
      saveNow(); sound('click'); rerender(); });
  });

}

