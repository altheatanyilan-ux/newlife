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
function tasksForDay(day){ return allTaskRefs().filter(r => r.day === day).sort((a,b)=> (a.done?1:0)-(b.done?1:0) || a.text.localeCompare(b.text)); }
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
/* ---------- one row, used by Today and by the Planner ---------- */
function taskRowHTML(r, {showDay=false}={}){
  const late = r.day && !r.done && r.day < today();
  return `<div class="task-row ${r.done?'done':''} ${late?'late':''}" data-taskrow="${r.id}" draggable="true">
    <button class="task-check" data-tcheck="${r.id}" role="checkbox" aria-checked="${r.done}" title="${r.done?'mark not done':'mark done'}">${r.done?'✓':''}</button>
    <span class="task-text">${esc(r.text || 'Untitled task')}</span>
    ${r.where?`<a class="task-where" href="${r.go}" title="${esc(r.where)}">${esc(r.where)}</a>`:''}
    ${showDay && r.day?`<span class="mono task-day">${late?'⚠ ':''}${fmtDate(r.day,'short')}</span>`:''}
    <button class="del-x inline" data-tdel="${r.id}" title="delete task">×</button>
  </div>`;
}
function bindTaskRows(root, after){
  const redraw = after || rerender;
  $$('[data-tcheck]', root).forEach(b => b.onclick = () => { const r = findTaskRef(b.dataset.tcheck); if(!r) return; setTaskDone(r.id, !r.done); sound(r.done ? 'click' : 'success'); redraw(); });
  $$('[data-tdel]', root).forEach(b => b.onclick = e => { e.stopPropagation(); deleteTaskRef(b.dataset.tdel, b.closest('.task-row'), redraw); });
  $$('[data-taskrow]', root).forEach(row => {
    row.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', row.dataset.taskrow); ev.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging'); window._taskDrag = row.dataset.taskrow; });
    row.addEventListener('dragend', () => { row.classList.remove('dragging'); window._taskDrag = null; });
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
/* ---------- pull existing work onto a day ---------- */
function openTaskPicker(day, after){
  const redraw = after || rerender;
  const draw = (q='') => {
    const needle = q.toLowerCase();
    const pool = allTaskRefs().filter(r => !r.done && r.day !== day && (!needle || (r.text+' '+r.where).toLowerCase().includes(needle)));
    return pool.length ? pool.slice(0,60).map(r => `<button class="choice" data-pick="${r.id}"><span class="ico">${r.kind==='project'?'🎨':'▫'}</span><span><b>${esc(r.text||'Untitled task')}</b>${r.where?`<div class="d">${esc(r.where)}</div>`:''}${r.day?`<div class="d mono">currently ${fmtDate(r.day,'med')}</div>`:'<div class="d mono">unscheduled</div>'}</span></button>`).join('')
      : `<div class="empty">Nothing to pull in. Tasks made inside a project appear here, and so does anything you add below.</div>`;
  };
  const m = openModal(`<h2>Plan work for ${fmtDate(day,'med')}</h2>
    <input class="inp" id="tpQ" placeholder="Search tasks from projects and your own list" autofocus>
    <div class="stack" id="tpList" style="gap:8px;margin-top:12px;max-height:44vh;overflow:auto">${draw()}</div>
    <div class="row" style="margin-top:16px;gap:8px"><input class="inp" id="tpNew" placeholder="…or write a new task for this day"><button class="btn primary" id="tpAdd">Add</button></div>`, 'narrow');
  const list = m.querySelector('#tpList');
  const bind = () => list.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { setTaskDay(b.dataset.pick, day); m.remove(); sound('success'); redraw(); });
  bind();
  m.querySelector('#tpQ').oninput = e => { list.innerHTML = draw(e.target.value.trim()); bind(); };
  const add = () => { const v = m.querySelector('#tpNew').value.trim(); if(!v) return; S.tasks.push(newTask(v, day)); saveNow(); m.remove(); sound('success'); redraw(); };
  m.querySelector('#tpAdd').onclick = add;
  m.querySelector('#tpNew').onkeydown = e => { if(e.key === 'Enter') add(); };
}
/* quick capture: one input that makes a task for a given day */
function quickTaskInput(day, id){ return `<input class="inp quick-task" data-qtask="${day}" id="${id||''}" placeholder="＋ add a task and press Enter">`; }
function bindQuickTask(root, after){
  const redraw = after || rerender;
  $$('[data-qtask]', root).forEach(inp => inp.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return; const v = inp.value.trim(); if(!v) return;
    S.tasks.push(newTask(v, inp.dataset.qtask)); saveNow(); sound('click'); redraw();
  }));
}
