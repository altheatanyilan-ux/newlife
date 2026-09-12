/* ============================================================
   TASKS — one list, many sources.
   A task is either its own thing (S.tasks) or a task that already
   lives inside a project phase. Both can be given a day, which is
   what "planning" means here: deciding when, not making new work.
   ============================================================ */
function newTask(text='', day=''){ return {id:uid(), text, day, done:false, doneAt:null, notes:'', order:Date.now(), createdAt:new Date().toISOString(), links:{projects:[],skills:[]}}; }
function migrateTasks(){
  S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
  S.tasks.forEach(t => { t.links = t.links || {projects:[],skills:[]}; if(t.day === undefined) t.day = ''; if(t.done === undefined) t.done = false; });
  // reminders were dated one-liners: the same thing, so fold them in once
  if(Array.isArray(S.reminders) && S.reminders.length){
    S.reminders.forEach(r => { if(!S.tasks.some(t => t.id === r.id)) S.tasks.push(Object.assign(newTask(r.text || '', r.date || ''), {id:r.id, done:!!r.done, doneAt:r.doneAt||null})); });
    S.reminders = [];
  }
}
/* a uniform view over both kinds, so the planner does not care where a task lives */
function taskRef(t){ return {kind:'own', id:t.id, text:t.text, day:t.day||'', done:!!t.done, task:t, where:'', color:'var(--page-accent)', go:''}; }
function projectTaskRefs(){
  const out = [];
  (S.projects||[]).forEach(p => (p.phases||[]).forEach(ph => (ph.tasks||[]).forEach(t => {
    out.push({kind:'project', id:`${p.id}:${ph.id}:${t.id}`, text:t.text, day:t.day||'', done:!!t.done, task:t, project:p, phase:ph, where:`${p.name} · ${ph.name}`, color:'var(--terra)', go:`#/projects/${p.id}`});
  })));
  return out;
}
function allTaskRefs(){ return [...(S.tasks||[]).map(taskRef), ...projectTaskRefs()]; }
function findTaskRef(id){ return allTaskRefs().find(r => r.id === id); }
/* Alphabetical was a stand-in for an order nobody had chosen. Now that a row
   can be dragged up and down, the chosen order is the order — done work still
   sinks, and anything never dragged keeps the sequence it was written in,
   because that is what `order` already held. */
const taskOrder = r => (r.task.order == null ? 0 : +r.task.order);
function tasksForDay(day){ return allTaskRefs().filter(r => r.day === day)
  .sort((a,b)=> (a.done?1:0)-(b.done?1:0) || taskOrder(a) - taskOrder(b) || a.text.localeCompare(b.text)); }
/* Dropping one row onto another rewrites the whole day's sequence rather than
   nudging two numbers: cheap at this size, and it cannot drift. */
function reorderTaskInDay(day, dragId, targetId, before){
  const rows = tasksForDay(day);
  const from = rows.findIndex(r => r.id === dragId);
  if(from < 0) return false;
  const moved = rows.splice(from, 1)[0];
  let at = rows.findIndex(r => r.id === targetId);
  if(at < 0) at = rows.length; else if(!before) at += 1;
  rows.splice(at, 0, moved);
  rows.forEach((r, i) => { r.task.order = i; });
  saveNow();
  return true;
}
function tasksDueBy(day){ return allTaskRefs().filter(r => r.day && r.day <= day && !r.done).sort((a,b)=> a.day.localeCompare(b.day)); }
function unscheduledTasks(){ return allTaskRefs().filter(r => !r.day && !r.done); }
function setTaskDay(id, day){ const r = findTaskRef(id); if(!r) return; r.task.day = day || ''; saveNow(); }
function setTaskDone(id, done){ const r = findTaskRef(id); if(!r) return; r.task.done = !!done; r.task.doneAt = done ? today() : null; saveNow(); }
function deleteTaskRef(id, node, after){
  const r = findTaskRef(id); if(!r) return;
  requestDelete({label:r.text || 'Task', node, after, remove: () => r.kind === 'own'
    ? spliceOut(S.tasks, x => x.id === r.task.id)
    : spliceOut(r.phase.tasks, x => x.id === r.task.id)});
}
/* ---------- subtasks ----------
   The shape already existed on a planner task — {id, title, isCompleted} —
   and only the detail panel ever showed it. A task broken into steps is most
   useful on the day you are doing it, so the same list is here too.

   A task made inside a project never went through planTaskDefaults, so it can
   reach this point with no subtasks array at all. Create it on demand rather
   than guarding at twenty call sites. */
function taskSubs(task){
  if(!Array.isArray(task.subtasks)) task.subtasks = [];
  return task.subtasks;
}
function taskSubCount(task){
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  return subs.length ? {done: subs.filter(s => s.isCompleted).length, total: subs.length} : null;
}
/* Steps are visible on the row itself, in both rooms, without opening anything
   — the whole point of writing them down is seeing them next to the task. So
   the default is open whenever a task has any, and this set records only the
   departures from that: a populated row someone collapsed, or an empty one
   someone opened to write the first step. It is deliberately not saved. */
const taskSubsToggled = new Set();
function subsOpen(id, task){
  const has = (Array.isArray(task && task.subtasks) ? task.subtasks : []).length > 0;
  return taskSubsToggled.has(id) ? !has : has;
}

function subRowHTML(rid, s){
  return `<div class="sub-row${s.isCompleted ? ' done' : ''}" data-subrow="${esc(s.id)}">
    <button class="task-check sm" data-subcheck="${esc(rid)}|${esc(s.id)}" role="checkbox"
      aria-checked="${!!s.isCompleted}" title="${s.isCompleted ? 'mark not done' : 'mark done'}">${s.isCompleted ? '✓' : ''}</button>
    <span class="sub-text" data-subedit="${esc(rid)}|${esc(s.id)}" title="click to rewrite">${esc(s.title || '')}</span>
    <button class="del-x inline" data-subdel="${esc(rid)}|${esc(s.id)}" title="remove this step">×</button>
  </div>`;
}
/* The same block under a Today row and under a Planning row, so the two rooms
   cannot drift into showing steps differently. */
function subBlockHTML(rid, task){
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  return `<div class="sub-wrap" data-subwrap="${esc(rid)}">
    ${subs.map(s => subRowHTML(rid, s)).join('')}
    <div class="sub-add"><input class="inp sm" data-subnew="${esc(rid)}" placeholder="＋ add a step and press Enter"></div>
  </div>`;
}
function subCaretHTML(rid, task, cls = 'task-caret'){
  const open = subsOpen(rid, task);
  return `<button class="${cls}${open ? ' on' : ''}" data-tsubs="${esc(rid)}" aria-expanded="${open}"
    title="${open ? 'hide the steps' : 'break this into steps'}">›</button>`;
}

/* ---------- one row ---------- */
function taskRowHTML(r, {showDay=false}={}){
  const late = r.day && !r.done && r.day < today();
  const prog = taskSubCount(r.task);
  const open = subsOpen(r.id, r.task);
  return `<div class="task-row ${r.done?'done':''} ${late?'late':''}${open?' subs-open':''}" data-taskrow="${r.id}" draggable="true">
    <span class="task-grip" title="drag to reorder" aria-hidden="true">⠿</span>
    ${subCaretHTML(r.id, r.task)}
    <button class="task-check" data-tcheck="${r.id}" role="checkbox" aria-checked="${r.done}" title="${r.done?'mark not done':'mark done'}">${r.done?'✓':''}</button>
    <!-- The name opens the task, because the name is the biggest thing on the
         row and opening it is what you mostly want. Renaming has its own small
         button rather than the whole middle of the row: it used to be the other
         way round, and reaching the task's own page meant hunting for the few
         pixels that were not an edit target. -->
    <span class="task-text" data-topen="${r.id}" title="open this task">${esc(r.text || 'Untitled task')}</span>
    <button class="task-pen" data-tedit="${r.id}" title="rename it here" aria-label="rename">✎</button>
    ${taskTimerBtnHTML(r.id)}
    ${prog?`<button class="task-subcount${prog.done===prog.total?' all':''}" data-tsubs="${r.id}"
      title="${prog.done} of ${prog.total} steps done">${prog.done}/${prog.total}</button>`:''}
    ${r.where?`<a class="task-where" href="${r.go}" title="${esc(r.where)}">${esc(r.where)}</a>`:''}
    ${showDay && r.day?`<span class="mono task-day">${late?'⚠ ':''}${fmtDate(r.day,'short')}</span>`:''}
    <!-- Taking something off a day is not the same as deciding never to do it.
         This clears the day and keeps the task, so it comes back in the pull-in
         list for any other day; the × beside it still deletes, with its undo. -->
    ${r.day?`<button class="task-defer" data-tdefer="${r.id}" title="not today — keep it for another day">not today</button>`:''}
    <button class="del-x inline" data-tdel="${r.id}" title="delete this task for good">×</button>
  </div>
  ${open ? subBlockHTML(r.id, r.task) : ''}`;
}

/* ---------- rewriting a task, or a step, where it sits ----------
   A row is draggable, and a draggable ancestor swallows the text selection its
   own child input needs, so the row gives up being draggable for as long as
   the field is open. */
function inlineTaskEdit(node, current, commit, redraw){
  if(node.dataset.editing) return;
  node.dataset.editing = '1';
  const row = node.closest('[data-taskrow],[data-ptrow],[data-ptcard]');
  const wasDraggable = row && row.getAttribute('draggable');
  if(row) row.setAttribute('draggable', 'false');
  const inp = el(`<input class="inp task-inline" value="${esc(current)}">`);
  node.replaceWith(inp);
  inp.focus(); inp.select();
  let closed = false;
  const finish = save => {
    if(closed) return; closed = true;
    if(row) row.setAttribute('draggable', wasDraggable === null ? 'true' : wasDraggable);
    const v = inp.value.trim();
    if(save && v && v !== current){ commit(v); saveNow(); sound('save'); }
    redraw();
  };
  inp.addEventListener('keydown', ev => {
    ev.stopPropagation();
    if(ev.key === 'Enter'){ ev.preventDefault(); finish(true); }
    if(ev.key === 'Escape'){ ev.preventDefault(); finish(false); }
  });
  inp.addEventListener('blur', () => finish(true));
}

/* the subtask bindings, shared by Today and the Planner */
function bindSubtasks(root, after){
  const redraw = after || rerender;
  $$('[data-tsubs]', root).forEach(b => b.onclick = e => {
    e.stopPropagation();
    const id = b.dataset.tsubs;
    taskSubsToggled.has(id) ? taskSubsToggled.delete(id) : taskSubsToggled.add(id);
    sound('click'); redraw();
  });
  $$('[data-subcheck]', root).forEach(b => b.onclick = e => {
    e.stopPropagation();
    const [rid, sid] = b.dataset.subcheck.split('|');
    const r = findTaskRef(rid); if(!r) return;
    const s = taskSubs(r.task).find(x => x.id === sid); if(!s) return;
    s.isCompleted = !s.isCompleted; s.completedAt = s.isCompleted ? today() : null;
    saveNow(); sound(s.isCompleted ? 'success' : 'click'); redraw();
  });
  $$('[data-subdel]', root).forEach(b => b.onclick = e => {
    e.stopPropagation();
    const [rid, sid] = b.dataset.subdel.split('|');
    const r = findTaskRef(rid); if(!r) return;
    spliceOut(taskSubs(r.task), x => x.id === sid);
    saveNow(); redraw();
  });
  $$('[data-subedit]', root).forEach(n => n.onclick = e => {
    e.stopPropagation();
    const [rid, sid] = n.dataset.subedit.split('|');
    const r = findTaskRef(rid); if(!r) return;
    const s = taskSubs(r.task).find(x => x.id === sid); if(!s) return;
    inlineTaskEdit(n, s.title || '', v => { s.title = v; }, redraw);
  });
  /* The field keeps the caret after each step, the way the day planner does:
     breaking a task down is several lines in a row, not one. */
  $$('[data-subnew]', root).forEach(i => i.addEventListener('keydown', ev => {
    ev.stopPropagation();
    if(ev.key !== 'Enter') return;
    const v = i.value.trim(); if(!v) return;
    const rid = i.dataset.subnew;
    const r = findTaskRef(rid); if(!r) return;
    const subs = taskSubs(r.task);
    subs.push({id: uid(), title: v, isCompleted: false, completedAt: null, sortOrder: subs.length});
    /* the first step flips this row's default to open — drop the exception, or
       adding a step to an empty row would immediately fold it away again */
    taskSubsToggled.delete(rid);
    saveNow(); sound('save');
    i.value = '';
    redraw();
    const again = document.querySelector(`[data-subnew="${rid}"]`);
    if(again) again.focus();
  }));
}
function bindTaskRows(root, after){
  const redraw = after || rerender;
  bindTaskTimers(root);
  $$('[data-tcheck]', root).forEach(b => b.onclick = () => { const r = findTaskRef(b.dataset.tcheck); if(!r) return; setTaskDone(r.id, !r.done); sound(r.done ? 'click' : 'success'); redraw(); });
  $$('[data-tdel]', root).forEach(b => b.onclick = e => { e.stopPropagation(); deleteTaskRef(b.dataset.tdel, b.closest('.task-row'), redraw); });
  $$('[data-tdefer]', root).forEach(b => b.onclick = e => {
    e.stopPropagation();
    const r = findTaskRef(b.dataset.tdefer); if(!r) return;
    const was = r.day;
    setTaskDay(r.id, '');
    sound('click');
    toast('Off today. It is waiting in the unscheduled list, and “pull in” will find it on any day.', 6000,
      {label: 'put it back', fn: () => { setTaskDay(r.id, was); redraw(); }});
    redraw();
  });
  /* the pencil renames the name beside it, not itself */
  $$('[data-tedit]', root).forEach(n => n.onclick = e => {
    e.stopPropagation();
    const r = findTaskRef(n.dataset.tedit); if(!r) return;
    const label = n.parentElement.querySelector('[data-topen]') || n;
    inlineTaskEdit(label, r.task.text || '', v => { r.task.text = v; }, redraw);
  });
  /* Today never had a way to open a task at all; the row's own page is where
     the description, the dates and the links live. A task that belongs to a
     project has no page of its own, so it goes to the project. */
  $$('[data-topen]', root).forEach(n => n.onclick = e => {
    e.stopPropagation();
    const r = findTaskRef(n.dataset.topen); if(!r) return;
    if(r.kind === 'own' && typeof openPlanTask === 'function') openPlanTask(r.id);
    else if(r.go) navigate(r.go);
  });


  bindSubtasks(root, redraw);
  bindTaskReorder(root, redraw);

  $$('[data-taskrow]', root).forEach(row => {
    /* The name opened the task and the rest of the row did nothing, so a
       click a few pixels wide of it fell through — on the Planning row the
       whole row has always opened it, and there is no reason Today should
       behave differently. The controls are excluded, and so is the subtask
       block, which has its own rows to click. */
    row.addEventListener('click', ev => {
      if(ev.target.closest('button, a, input, select, .ed, .sub-wrap, [data-topen]')) return;
      const r = findTaskRef(row.dataset.taskrow); if(!r) return;
      if(r.kind === 'own' && typeof openPlanTask === 'function') openPlanTask(r.id);
      else if(r.go) navigate(r.go);
    });
    row.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', row.dataset.taskrow); ev.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging'); window._taskDrag = row.dataset.taskrow; });
    row.addEventListener('dragend', () => { row.classList.remove('dragging'); window._taskDrag = null;
      $$('.task-row.drop-above, .task-row.drop-below', root).forEach(x => x.classList.remove('drop-above','drop-below')); });
  });
}

/* ---------- dragging a row up or down its own list ----------
   The same drag already means "move to another day" when it lands on a day
   column. Landing on a sibling row means order instead, so the row handler
   stops the event before the column sees it — otherwise one drop would be read
   as both, and the day-drop would win by being outermost. */
function bindTaskReorder(root, after){
  const redraw = after || rerender;
  const clear = () => $$('.task-row.drop-above, .task-row.drop-below', root)
    .forEach(x => x.classList.remove('drop-above', 'drop-below'));
  $$('[data-taskrow]', root).forEach(row => {
    row.addEventListener('dragover', ev => {
      const id = window._taskDrag;
      if(!id || id === row.dataset.taskrow) return;
      const dragged = findTaskRef(id), target = findTaskRef(row.dataset.taskrow);
      /* only within one day: across days the drop means rescheduling, and the
         column behind this row is the thing that knows how to do that */
      if(!dragged || !target || !target.day || dragged.day !== target.day) return;
      ev.preventDefault(); ev.stopPropagation();
      const box = row.getBoundingClientRect();
      const before = ev.clientY < box.top + box.height / 2;
      clear();
      row.classList.add(before ? 'drop-above' : 'drop-below');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drop-above', 'drop-below'));
    row.addEventListener('drop', ev => {
      const id = window._taskDrag || ev.dataTransfer.getData('text/plain');
      if(!id || id === row.dataset.taskrow) return;
      const dragged = findTaskRef(id), target = findTaskRef(row.dataset.taskrow);
      if(!dragged || !target || !target.day || dragged.day !== target.day) return;
      ev.preventDefault(); ev.stopPropagation();
      const before = row.classList.contains('drop-above');
      clear();
      if(reorderTaskInDay(target.day, id, row.dataset.taskrow, before)){ sound('click'); redraw(); }
    });
  });
}
function bindDayDrop(root, after){
  const redraw = after || rerender;
  $$('[data-daydrop]', root).forEach(col => {
    col.addEventListener('dragover', ev => { ev.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over'); const id = window._taskDrag || ev.dataTransfer.getData('text/plain'); if(!id) return; setTaskDay(id, col.dataset.daydrop); sound('click'); redraw(); });
  });
}
/* ---------- narrowing a day to one list ----------
   A day can carry work from several lists at once, and reading it as one
   undifferentiated column is the problem. The choice is deliberately not
   saved: a filter that survives a reload is a filter that quietly hides work
   and gets blamed on the app. */
function taskListKey(r){ return r.kind === 'project' ? 'projects' : (r.task.listId || 'inbox'); }
function taskListLabel(key){
  if(key === 'projects') return 'Projects';
  return typeof planListName === 'function' ? planListName(key) : 'Inbox';
}
function dayListBuckets(rows){
  const seen = new Map();
  rows.forEach(r => { const k = taskListKey(r); seen.set(k, (seen.get(k) || 0) + 1); });
  return [...seen.entries()].map(([id, n]) => ({id, n, name: taskListLabel(id)}))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function filterRowsByList(rows){
  const pick = S._todayList;
  return (!pick || pick === 'all') ? rows : rows.filter(r => taskListKey(r) === pick);
}
function dayListFilterHTML(rows){
  const buckets = dayListBuckets(rows);
  if(buckets.length < 2) return '';            // one list is not a choice
  const pick = S._todayList || 'all';
  return `<div class="task-lists" role="group" aria-label="show one list">
    <button class="tl-chip${pick === 'all' ? ' on' : ''}" data-tlist="all">all <i>${rows.length}</i></button>
    ${buckets.map(b => `<button class="tl-chip${pick === b.id ? ' on' : ''}" data-tlist="${esc(b.id)}"
      style="--c:${b.id === 'projects' ? 'var(--terra)' : (typeof planListColor === 'function' ? planListColor(b.id) : 'var(--faint)')}">${esc(b.name)} <i>${b.n}</i></button>`).join('')}
  </div>`;
}
function bindDayListFilter(root, after){
  const redraw = after || rerender;
  $$('[data-tlist]', root).forEach(b => b.onclick = () => {
    S._todayList = b.dataset.tlist === 'all' ? null : b.dataset.tlist;
    sound('click'); redraw();
  });
}

/* ---------- pull existing work onto a day ---------- */
function openTaskPicker(day, after){
  const redraw = after || rerender;
  const draw = (q='') => {
    const needle = q.toLowerCase();
    const pool = allTaskRefs().filter(r => !r.done && r.day !== day && (!needle || (r.text+' '+r.where).toLowerCase().includes(needle)));
    return pool.length ? pool.slice(0,60).map(r => `<button class="choice" data-pick="${r.id}"><span class="ico">${r.kind==='project'?'🎨':'▫'}</span><span><b>${esc(r.text||'Untitled task')}</b>${r.where?`<div class="d">${esc(r.where)}</div>`:''}${r.day?`<div class="d mono">currently ${fmtDate(r.day,'med')}</div>`:'<div class="d mono">unscheduled</div>'}</span></button>`).join('')
      : `<div class="empty">Nothing to pull in. Tasks made inside a project appear here, and so does anything you add below.</div>`;
  };
  /* Planning a day is not one task, it is several. The dialog stays open and
     keeps taking them — the field clears and holds focus, what you have added
     so far is listed underneath, and the pull-in list drops whatever you just
     took. Closing it is a deliberate act. */
  const m = openModal(`<h2>Plan work for ${fmtDate(day,'med')}</h2>
    <input class="inp" id="tpQ" placeholder="Search tasks from projects and your own list" autofocus>
    <div class="stack" id="tpList" style="gap:8px;margin-top:12px;max-height:36vh;overflow:auto">${draw()}</div>
    <div class="row" style="margin-top:16px;gap:8px"><input class="inp" id="tpNew" placeholder="…or write a new task for this day"><button class="btn primary" id="tpAdd">Add</button></div>
    <div class="tp-added" id="tpAdded"></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn sm ghost" id="tpDone">Done</button></div>`, 'narrow');
  const list = m.querySelector('#tpList');
  const added = [];
  const note = () => { m.querySelector('#tpAdded').innerHTML = added.length
    ? `<div class="sc" style="margin:14px 0 4px">On ${esc(fmtDate(day,'short'))} · ${added.length}</div>
       <ul class="tsk-list">${added.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''; };
  const refresh = () => { list.innerHTML = draw(m.querySelector('#tpQ').value.trim()); bind(); };
  const bind = () => list.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    const ref = allTaskRefs().find(r => r.id === b.dataset.pick);
    setTaskDay(b.dataset.pick, day); added.push(ref?.text || 'a task');
    sound('success'); note(); refresh(); redraw(); });
  bind(); note();
  m.querySelector('#tpQ').oninput = () => refresh();
  const add = () => { const inp = m.querySelector('#tpNew'); const v = inp.value.trim(); if(!v) return;
    S.tasks.push(newTask(v, day)); added.push(v); saveNow(); sound('success');
    inp.value = ''; inp.focus(); note(); refresh(); redraw(); };
  m.querySelector('#tpAdd').onclick = add;
  m.querySelector('#tpNew').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } };
  m.querySelector('#tpDone').onclick = () => m.remove();
}
/* quick capture: one input that makes a task for a given day */
function quickTaskInput(day, id){ return `<input class="inp quick-task" data-qtask="${day}" id="${id||''}" placeholder="＋ add a task and press Enter">`; }
function bindQuickTask(root, after){
  const redraw = after || rerender;
  $$('[data-qtask]', root).forEach(inp => inp.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return; const v = inp.value.trim(); if(!v) return;
    S.tasks.push(newTask(v, inp.dataset.qtask)); saveNow(); sound('click');
    const id = inp.id, day = inp.dataset.qtask;
    redraw();
    /* the redraw replaces this very input, so the caret has to be put back on
       its replacement — otherwise a second task means reaching for the mouse */
    requestAnimationFrame(() => {
      const next = (id && document.getElementById(id)) || document.querySelector(`[data-qtask="${day}"]`);
      if(next){ next.value = ''; next.focus(); }
    });
  }));
}
