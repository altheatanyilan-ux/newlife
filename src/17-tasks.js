/* ============================================================
   TASKS — one list, many sources.
   A task is either its own thing (S.tasks) or a task that already
   lives inside a project phase. Both can be given a day, which is
   what "planning" means here: deciding when, not making new work.
   ============================================================ */
function newTask(text='', day=''){ return {id:uid(), text, day, done:false, doneAt:null, notes:'', order:Date.now(), createdAt:new Date().toISOString(), links:{projects:[],skills:[]}}; }
function migrateTasks(){
  S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
  S.tasks.forEach(t => { t.links = t.links || {projects:[],skills:[]};
    if(t.day === undefined) t.day = ''; if(t.doDay === undefined) t.doDay = '';
    if(t.done === undefined) t.done = false; });
  // reminders were dated one-liners: the same thing, so fold them in once
  if(Array.isArray(S.reminders) && S.reminders.length){
    S.reminders.forEach(r => { if(!S.tasks.some(t => t.id === r.id)) S.tasks.push(Object.assign(newTask(r.text || '', r.date || ''), {id:r.id, done:!!r.done, doneAt:r.doneAt||null})); });
    S.reminders = [];
  }
}
/* a uniform view over both kinds, so the planner does not care where a task lives */
function taskRef(t){ return {kind:'own', id:t.id, text:t.text, day:t.day||'', doDay:t.doDay||'', done:!!t.done, task:t, where:'', color:'var(--page-accent)', go:''}; }
function projectTaskRefs(){
  const out = [];
  (S.projects||[]).forEach(p => (p.phases||[]).forEach(ph => (ph.tasks||[]).forEach(t => {
    out.push({kind:'project', id:`${p.id}:${ph.id}:${t.id}`, text:t.text, day:t.day||'', doDay:t.doDay||'', done:!!t.done, task:t, project:p, phase:ph, where:`${p.name} · ${ph.name}`, color:'var(--terra)', go:`#/projects/${p.id}`});
  })));
  return out;
}
function allTaskRefs(){ return [...(S.tasks||[]).map(taskRef), ...projectTaskRefs()]; }
/* A thing to buy or a thing to be reminded of, written straight onto the
   shopping list or the reminders, is kept aside from the tasks: it has its own
   place, and a day's work is not "milk" or "the dentist rings at three". A task
   from a real list that is also on one of them is still a task. */
const taskIsAside = t => !!t && (t.shop || t.remind) && (t.listId || 'inbox') === 'inbox';
function findTaskRef(id){ return allTaskRefs().find(r => r.id === id); }
/* Alphabetical was a stand-in for an order nobody had chosen. Now that a row
   can be dragged up and down, the chosen order is the order — done work still
   sinks, and anything never dragged keeps the sequence it was written in,
   because that is what `order` already held. */
const taskOrder = r => (r.task.order == null ? 0 : +r.task.order);
/* A day's work is what was put on that day — plus whatever was actually
   finished on it. Some of what you do is never scheduled: you think of it, you
   do it, you tick it. Counting only the dated ones meant a day where you
   cleared six unplanned things read as "0 of 0 done", which is both wrong and
   dispiriting. A task finished on this day belongs to it, whatever date it
   carried, and says so on its row. */
/* Which of a task's two dates land on a given day, or null if neither does.
   The deadline puts it on the day it is owed; the do date puts it on the day
   you said you would sit down with it. Both can be the same day, and usually
   are for work that is only ever a day's worth. */
function taskDatesOn(t, day){
  if(!t || !day) return null;
  const due = (t.day || '') === day, plan = (t.doDay || '') === day;
  return due || plan ? {due, plan} : null;
}
const taskOnDay = (t, day) => !!taskDatesOn(t, day);
function tasksForDay(day){
  const own = allTaskRefs().filter(r => taskOnDay(r.task, day) && !taskIsAside(r.task));
  const seen = new Set(own.map(r => r.id));
  const finished = allTaskRefs().filter(r =>
    !seen.has(r.id) && r.done && (r.task.doneAt || '') === day && !taskIsAside(r.task))
    .map(r => Object.assign({}, r, {elsewhere: true}));
  return own.concat(finished)
    .sort((a,b)=> (a.done?1:0)-(b.done?1:0) || taskOrder(a) - taskOrder(b) || a.text.localeCompare(b.text));
}
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
function tasksDueBy(day){ return allTaskRefs().filter(r => r.day && r.day <= day && !r.done && !taskIsAside(r.task)).sort((a,b)=> a.day.localeCompare(b.day)); }
function unscheduledTasks(){ return allTaskRefs().filter(r => !r.day && !r.doDay && !r.done && !taskIsAside(r.task)); }
function setTaskDay(id, day){ const r = findTaskRef(id); if(!r) return; r.task.day = day || ''; saveNow(); }
function setTaskDoDay(id, day){ const r = findTaskRef(id); if(!r) return; r.task.doDay = day || ''; saveNow(); }
function setTaskDone(id, done){ const r = findTaskRef(id); if(!r) return;
  r.task.done = !!done; r.task.doneAt = done ? today() : null; saveNow();
  if(done) try { RewardFX.check(); } catch(e){}
  /* crossing off the thing the clock is running on ends the sitting */
  if(typeof taskCrossedOff === 'function') taskCrossedOff(id, done);
}
/* Ticking a step goes through here from every room, for the same reason
   setTaskDone exists: the clock has to hear about it. Returns whether it was
   the step being timed, so the caller can leave the cheer to make the noise. */
function findSub(rid, sid){
  const r = findTaskRef(rid); if(!r) return null;
  return taskSubs(r.task).find(x => x.id === sid) || null;
}
function setSubDone(rid, sid, done){
  const s = findSub(rid, sid); if(!s) return false;
  s.isCompleted = !!done; s.completedAt = done ? today() : null; saveNow();
  return typeof subCrossedOff === 'function' ? subCrossedOff(rid, sid, done) : false;
}
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
    <!-- a step is the unit you actually sit down with, so it carries its own
         length and its own way into the timer -->
    <span class="est-wrap sm">
      <button class="task-est sm${+s.minutes ? '' : ' none'}${subSpentOn(rid, s.id) >= 1 ? ' spent' : ''}${
          +s.minutes && subSpentOn(rid, s.id) > +s.minutes ? ' over' : ''}" data-subest="${esc(rid)}|${esc(s.id)}"
        title="${subSpentOn(rid, s.id) >= 1
          ? `${fmtEst(subSpentOn(rid, s.id))} sat with so far${+s.minutes ? `, of ${fmtEst(s.minutes)} estimated` : ''}${
              +s.minutes ? ` — press to sit down with ${focusLeftOn(rid, +s.minutes, s.id) >= 1
                ? `the ${fmtEst(focusLeftOn(rid, +s.minutes, s.id))} left` : 'it again; the estimate is spent, so it counts up'}` : ''}`
          : +s.minutes ? `${fmtEst(s.minutes)} — press to sit down with just this step` : 'how long will this step take?'}">${
        subSpentOn(rid, s.id) >= 1
          ? `<span class="te-spent">${esc(fmtEst(subSpentOn(rid, s.id)))}</span>${+s.minutes ? `<span class="te-of">of</span>${esc(fmtEst(s.minutes))}` : ''}`
          : +s.minutes ? esc(fmtEst(s.minutes)) : '<span class="te-set">＋</span>'}</button>
      ${+s.minutes ? `<button class="est-pen" data-subestedit="${esc(rid)}|${esc(s.id)}" title="change the length" aria-label="change the length">✎</button>` : ''}
    </span>
    <button class="del-x inline" data-subdel="${esc(rid)}|${esc(s.id)}" title="remove this step">×</button>
  </div>`;
}
/* The same block under a Today row and under a Planning row, so the two rooms
   cannot drift into showing steps differently. */
function subBlockHTML(rid, task, hideDone){
  const all = Array.isArray(task.subtasks) ? task.subtasks : [];
  const subs = hideDone ? all.filter(s => !s.isCompleted) : all;
  const gone = all.length - subs.length;
  return `<div class="sub-wrap" data-subwrap="${esc(rid)}">
    ${subs.map(s => subRowHTML(rid, s)).join('')}
    ${gone ? `<div class="sub-gone mono">${gone} finished step${gone === 1 ? '' : 's'} hidden</div>` : ''}
    <div class="sub-add"><input class="inp sm" data-subnew="${esc(rid)}" placeholder="＋ add a step and press Enter"></div>
  </div>`;
}
function subCaretHTML(rid, task, cls = 'task-caret'){
  const open = subsOpen(rid, task);
  return `<button class="${cls}${open ? ' on' : ''}" data-tsubs="${esc(rid)}" aria-expanded="${open}"
    title="${open ? 'hide the steps' : 'break this into steps'}">›</button>`;
}

/* ---------- one row ---------- */
function taskRowHTML(r, {showDay=false, hideDone=false, onDay=''}={}){
  const late = r.day && !r.done && r.day < today();
  /* Which of the two dates put this row on this day. When they are the same
     day there is nothing to explain, and when only one is set the row is
     already about that one — the pill is for the case that used to be
     impossible: a thing owed on Friday that you sat down with on Tuesday. */
  const on = onDay ? taskDatesOn(r.task, onDay) : null;
  const why = on && on.plan && !on.due && r.day
    ? `<span class="mono task-day task-when" title="you planned to do it today; it is owed ${esc(fmtDate(r.day, 'med'))}">due ${esc(fmtDate(r.day, 'short'))}</span>`
    : on && on.due && !on.plan && r.doDay
    ? `<span class="mono task-day task-when" title="it is owed today; you planned to sit down with it ${esc(fmtDate(r.doDay, 'med'))}">to do ${esc(fmtDate(r.doDay, 'short'))}</span>`
    : '';
  const prog = taskSubCount(r.task);
  const open = subsOpen(r.id, r.task);
  return `<div class="task-row ${r.done?'done':''} ${late?'late':''}${open?' subs-open':''}${taskIsBonus(r)?' bonus':''}" data-taskrow="${r.id}" draggable="true">
    <span class="task-grip" title="drag to reorder" aria-hidden="true">⠿</span>
    ${subCaretHTML(r.id, r.task)}
    <button class="task-check" data-tcheck="${r.id}" role="checkbox" aria-checked="${r.done}" title="${r.done?'mark not done':'mark done'}">${r.done?'✓':''}</button>
    <!-- The name opens the task, because the name is the biggest thing on the
         row and opening it is what you mostly want. Renaming has its own small
         button rather than the whole middle of the row: it used to be the other
         way round, and reaching the task's own page meant hunting for the few
         pixels that were not an edit target. -->
    <!-- The name gets a line to itself and the eight controls get the one
         under it. They were all on one line, and since a control that is
         invisible until the row is hovered still takes up its width, the name
         was left with what they did not want — in half of a compartment on
         Today that was seventy pixels, and "Reply to opposing counsel" read
         as "Reply to oppos…". A step keeps its single button on the line
         with its name; one button was never the problem. -->
    <div class="task-body">
    <span class="task-text" data-topen="${r.id}" title="open this task">${esc(r.text || 'Untitled task')}</span>
    <div class="task-tools">
    <button class="task-pen" data-tedit="${r.id}" title="rename it here" aria-label="rename">✎</button>
    ${taskEstHTML(r.id, r.task)}
    ${prog?`<button class="task-subcount${prog.done===prog.total?' all':''}" data-tsubs="${r.id}"
      title="${prog.done} of ${prog.total} steps done">${prog.done}/${prog.total}</button>`:''}
    ${r.where?`<a class="task-where" href="${r.go}" title="${esc(r.where)}">${esc(r.where)}</a>`:''}
    ${showDay && r.day?`<span class="mono task-day">${late?'⚠ ':''}${fmtDate(r.day,'short')}</span>`:''}
    ${why}
    <!-- it was not on this day's list; it was finished on this day -->
    ${r.elsewhere?`<span class="mono task-day task-elsewhere" title="${r.day ? 'set for ' + esc(fmtDate(r.day,'med')) + ', finished today' : 'never given a day — finished today'}">${r.day ? esc(fmtDate(r.day,'short')) : 'unplanned'}</span>`:''}
    <!-- Taking something off a day is not the same as deciding never to do it.
         This clears the day and keeps the task, so it comes back in the pull-in
         list for any other day; the × beside it still deletes, with its undo. -->
    <!-- which of the two lists it belongs to, changed from the row itself
         because the difference is a judgement you make while looking at the
         day, not something you go into a panel to set -->
    <button class="task-bonus${taskIsBonus(r) ? ' on' : ''}" data-tbonus="${r.id}"
      title="${taskIsBonus(r) ? 'a bonus — leaving it is not a miss. Press to make it compulsory.' : 'compulsory today. Press to make it a bonus.'}"
      aria-label="compulsory or bonus">${taskIsBonus(r) ? '✧' : '✦'}</button>
    ${r.day || r.doDay?`<button class="task-defer" data-tdefer="${r.id}" data-tdeferday="${esc(onDay || today())}" title="not today — keep it for another day">not today</button>`:''}
    <button class="del-x inline" data-tdel="${r.id}" title="delete this task for good">×</button>
    </div></div>
  </div>
  ${open ? subBlockHTML(r.id, r.task, hideDone) : ''}`;
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
    if(save && v && v !== current){ commit(v); saveNow(); sound('save');
      try { RewardFX.savedAt(inp, 'var(--sage)'); } catch(e){} }
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
    const s = findSub(rid, sid); if(!s) return;
    const timed = setSubDone(rid, sid, !s.isCompleted);
    if(!timed) sound(s.isCompleted ? 'success' : 'click');
    redraw();
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
  $$('[data-tgroup]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const k = b.dataset.tgroup;
    S.settings.todayGroupShut = S.settings.todayGroupShut || {};
    S.settings.todayGroupShut[k] = !S.settings.todayGroupShut[k];
    saveNow(); redraw(); });
  $$('[data-tbonus]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const r = findTaskRef(b.dataset.tbonus); if(!r) return;
    setTaskBonus(r.id, !taskIsBonus(r)); sound('click');
    toast(taskIsBonus(r) ? 'Bonus — no failure if it waits.' : 'Compulsory — this one has to be finished today.');
    redraw(); });
  $$('[data-tcheck]', root).forEach(b => b.onclick = () => { const r = findTaskRef(b.dataset.tcheck); if(!r) return;
    const wasTimed = typeof FocusTimer !== 'undefined' && !FocusTimer.state().idle && FocusTimer.state().taskId === r.id;
    setTaskDone(r.id, !r.done);
    /* the celebration plays its own sound; two at once is a mess */
    if(!(wasTimed && !r.done)) sound(r.done ? 'click' : 'success');
    redraw(); });
  $$('[data-tdel]', root).forEach(b => b.onclick = e => { e.stopPropagation(); deleteTaskRef(b.dataset.tdel, b.closest('.task-row'), redraw); });
  $$('[data-tdefer]', root).forEach(b => b.onclick = e => {
    e.stopPropagation();
    const r = findTaskRef(b.dataset.tdefer); if(!r) return;
    /* a task can be on this day for either of two reasons, so taking it off
       has to let go of both, and putting it back has to restore both */
    const day = b.dataset.tdeferday || today();
    const was = {day: r.task.day, doDay: r.task.doDay};
    if(r.task.day === day)   setTaskDay(r.id, '');
    if(r.task.doDay === day) setTaskDoDay(r.id, '');
    sound('click');
    toast('Off today. It is waiting in the unscheduled list, and “pull in” will find it on any day.', 6000,
      {label: 'put it back', fn: () => { setTaskDay(r.id, was.day); setTaskDoDay(r.id, was.doDay); redraw(); }});
    redraw();
  });
  /* The pencil renames the name beside it, not itself. It used to look for the
     name in its own parent, which held while the two were siblings and stopped
     the day the row's buttons were wrapped in .task-tools to stop them eating
     the name's width: the pencil's parent no longer contains the name, the
     lookup fell through to `|| n`, and pressing rename replaced the PENCIL
     with the input while the name sat there unchanged. It asks the row now,
     which is true however the row is arranged. */
  $$('[data-tedit]', root).forEach(n => n.onclick = e => {
    e.stopPropagation();
    const r = findTaskRef(n.dataset.tedit); if(!r) return;
    const scope = n.closest('.task-body') || n.closest('[data-taskrow]') || n.parentElement;
    const label = scope.querySelector(`[data-topen="${CSS.escape(n.dataset.tedit)}"]`)
      || scope.querySelector('[data-topen]') || n;
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
/* which day a row is being shown under, read off the column it sits in */
function dayOfRow(row){ const col = row.closest('[data-daydrop]'); return col ? col.dataset.daydrop : ''; }
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
         column behind this row is the thing that knows how to do that. The day
         is the column's, not either task's own date — two rows can sit on the
         same day for different reasons, one owed on it and one planned for it,
         and comparing their dates to each other would refuse the drop. */
      if(!dragged || !target || !dayOfRow(row)) return;
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
      const day = dayOfRow(row);
      if(!dragged || !target || !day) return;
      ev.preventDefault(); ev.stopPropagation();
      const before = row.classList.contains('drop-above');
      clear();
      if(reorderTaskInDay(day, id, row.dataset.taskrow, before)){ sound('click'); redraw(); }
    });
  });
}
function bindDayDrop(root, after){
  const redraw = after || rerender;
  $$('[data-daydrop]', root).forEach(col => {
    col.addEventListener('dragover', ev => { ev.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    /* Dropping a task on a day says when you will do it. It used to move the
       due date, which is a different and much stronger claim: dragging a thing
       onto Thursday should not tell your client it is now owed on Thursday.
       The deadline is set where the word "due" is written next to the box. */
    col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('over'); const id = window._taskDrag || ev.dataTransfer.getData('text/plain'); if(!id) return; setTaskDoDay(id, col.dataset.daydrop); sound('click'); redraw(); });
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
/* ---------- compulsory and bonus ----------
   Not everything parked on a day has the same weight. Some of it has to be
   finished today; the rest would be good to reach and costs nothing if it
   waits. Counting both against one total makes a day with eleven things on
   it read as a failure at eight, when eight was the whole of what was
   actually required — so they are two lists, tallied separately, and the
   bonus one says outright that leaving it is not a miss. */
const taskIsBonus = r => !!(r.task && r.task.bonus);
function setTaskBonus(id, on){
  const r = findTaskRef(id); if(!r) return;
  r.task.bonus = !!on; r.task.updatedAt = new Date().toISOString(); saveNow();
}

/* ---------- grouped by the list each one lives in ----------
   Today's rows were a flat run whose only clue to where a task came from was
   a small label at the end. Grouped under the list, each group folds and
   counts what is left in it, and the busiest group is at the top: the list
   with six things outstanding is the one the day is really about. */
function dayGroups(rows){
  const by = new Map();
  rows.forEach(r => { const k = taskListKey(r);
    if(!by.has(k)) by.set(k, {id:k, name: taskListLabel(k), rows: []});
    by.get(k).rows.push(r); });
  return [...by.values()].map(g => ({...g,
    left: g.rows.filter(r => !r.done).length, total: g.rows.length}))
    .sort((a, b) => b.left - a.left || b.total - a.total || a.name.localeCompare(b.name));
}
function dayGroupOpen(kind, id){
  const shut = S.settings.todayGroupShut || {};
  return !shut[`${kind}:${id}`];
}
function dayGroupColor(id){
  return id === 'projects' ? 'var(--terra)'
    : (typeof planListColor === 'function' ? planListColor(id) : 'var(--faint)');
}
/* `left` and `total` are counted on everything in the group, not on what is
   drawn: a heading that says "2 left · 5" while hiding the three that are
   done is telling the truth, and one that said "2 left · 2" would not. */
function dayGroupsHTML(rows, kind, hideDone, day = today()){
  const gs = dayGroups(rows)
    .map(g => ({...g, shown: hideDone ? g.rows.filter(r => !r.done) : g.rows}))
    .filter(g => g.shown.length);
  if(!gs.length) return '';
  const row = r => taskRowHTML(r, {hideDone, onDay: day});
  /* one list is not a grouping — draw the rows plainly */
  if(gs.length === 1) return `<div class="stack" style="gap:2px">${gs[0].shown.map(row).join('')}</div>`;
  return gs.map(g => { const open = dayGroupOpen(kind, g.id);
    return `<div class="tg${open ? ' open' : ''}" style="--c:${dayGroupColor(g.id)}">
      <button class="tg-head" data-tgroup="${esc(kind)}:${esc(g.id)}" aria-expanded="${open}">
        <span class="tg-caret">›</span>
        <span class="tg-name">${esc(g.name)}</span>
        <span class="tg-n mono">${g.left ? `${g.left} left` : 'all done'}${g.total !== g.left ? ` · ${g.total}` : ''}</span>
      </button>
      ${open ? `<div class="tg-rows stack" style="gap:2px">${g.shown.map(row).join('')}</div>` : ''}
    </div>`; }).join('');
}
/* ---------- what is finished is out of the way ----------
   A day's list is a list of what is left. Once something is ticked it has
   stopped being work and started being a receipt, and a receipt sitting in
   the middle of the day's list costs a line of attention every time the eye
   passes it. So a ticked task leaves the list, and so does a ticked step
   inside one; the count in the section heading still says how many of how
   many, because that is what the tick was for.

   It is hidden rather than deleted, and the chip that hides it says how many
   are behind it, so "where did that go" has an answer that is one press away
   and visible before you ask. */
const todayShowDone = () => !!S._todayDone;

/* Compulsory first, then bonus. The bonus heading carries its own sentence,
   because the whole point of the split is what it means not to finish. */
function dayTaskListHTML(rows, day = today()){
  const shown = filterRowsByList(rows);
  if(!shown.length) return '';
  const hideDone = !todayShowDone();
  const must = shown.filter(r => !taskIsBonus(r)), extra = shown.filter(taskIsBonus);
  const band = (label, note, list, kind) => { if(!list.length) return '';
    const left = list.filter(r => !r.done).length;
    return `<div class="tband tband-${kind}">
      <div class="tband-head">
        <span class="tband-name">${esc(label)}</span>
        <span class="mono tband-n">${left ? `${left} of ${list.length} left` : `all ${list.length} done`}</span>
      </div>
      <div class="tband-note">${esc(note)}</div>
      ${dayGroupsHTML(list, kind, hideDone, day)}
    </div>`; };
  /* with nothing marked bonus there is nothing to contrast, so the day is
     just a list and the headings would be noise */
  if(!extra.length){
    const body = dayGroupsHTML(must, 'must', hideDone, day);
    /* everything on the day is done and put away. Saying so is better than
       falling through to "nothing in that list today", which is what the
       caller says when the list filter has excluded everything. */
    return body || (hideDone && must.length
      ? `<div class="empty tasks-all-done">All ${must.length} done. <button class="tbtn" data-tdone="1">show them</button></div>`
      : '');
  }
  return band('Compulsory', 'Finish these today.', must, 'must')
       + band('Bonus', 'Good to reach. Leaving them is not a miss.', extra, 'bonus');
}
function filterRowsByList(rows){
  const pick = S._todayList;
  return (!pick || pick === 'all') ? rows : rows.filter(r => taskListKey(r) === pick);
}
function dayListFilterHTML(rows){
  const buckets = dayListBuckets(rows);
  const pick = S._todayList || 'all';
  /* one list is not a choice, so the list chips come and go; the done chip
     does not depend on how many lists there are */
  const lists = buckets.length < 2 ? ''
    : `<button class="tl-chip${pick === 'all' ? ' on' : ''}" data-tlist="all">all <i>${rows.length}</i></button>`
      + buckets.map(b => `<button class="tl-chip${pick === b.id ? ' on' : ''}" data-tlist="${esc(b.id)}"
      style="--c:${b.id === 'projects' ? 'var(--terra)' : (typeof planListColor === 'function' ? planListColor(b.id) : 'var(--faint)')}">${esc(b.name)} <i>${b.n}</i></button>`).join('');
  const nDone = rows.filter(r => r.done).length
    + rows.reduce((n, r) => n + ((r.task && r.task.subtasks) || []).filter(s => s.isCompleted && !r.done).length, 0);
  const done = nDone ? `<button class="tl-chip tl-done${todayShowDone() ? ' on' : ''}" data-tdone="1"
      title="${todayShowDone() ? 'put what is finished away again' : 'show what has been finished today'}"
      aria-pressed="${todayShowDone()}">show done <i>${nDone}</i></button>` : '';
  if(!lists && !done) return '';
  return `<div class="task-lists" role="group" aria-label="show one list">${lists}${done}</div>`;
}
function bindDayListFilter(root, after){
  const redraw = after || rerender;
  $$('[data-tlist]', root).forEach(b => b.onclick = () => {
    S._todayList = b.dataset.tlist === 'all' ? null : b.dataset.tlist;
    sound('click'); redraw();
  });
  $$('[data-tdone]', root).forEach(b => b.onclick = () => {
    S._todayDone = !S._todayDone; sound('click'); redraw();
  });
}

/* ---------- pull existing work onto a day ---------- */
function openTaskPicker(day, after){
  const redraw = after || rerender;
  const draw = (q='') => {
    const needle = q.toLowerCase();
    const pool = allTaskRefs().filter(r => !r.done && !taskOnDay(r.task, day) && (!needle || (r.text+' '+r.where).toLowerCase().includes(needle)));
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
    setTaskDoDay(b.dataset.pick, day); added.push(ref?.text || 'a task');
    sound('success'); note(); refresh(); redraw(); });
  bind(); note();
  m.querySelector('#tpQ').oninput = () => refresh();
  const add = () => { const inp = m.querySelector('#tpNew'); const v = inp.value.trim(); if(!v) return;
    S.tasks.push(Object.assign(newTask(v), {doDay: day})); added.push(v); saveNow(); sound('success');
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
