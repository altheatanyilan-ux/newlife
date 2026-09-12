/* ============================================================
   PLANNING — one task, opened.
   Everything here writes on change. There is no save button, the
   way there is none anywhere else in the house.
   ============================================================ */

const PLAN_REMINDER_OFFSETS = [
  ['at_time', 'at the time'], ['5min','5 min before'], ['15min','15 min before'], ['30min','30 min before'],
  ['1hr','1 hour before'], ['1day','1 day before'], ['2days','2 days before'], ['1week','1 week before'],
];
const PLAN_DURATIONS = [[15,'15m'],[30,'30m'],[45,'45m'],[60,'1h'],[120,'2h'],[240,'4h'],[480,'a day']];

function openPlanTask(id){
  const t = id ? planTaskById(id) : null;
  if(id && !t) return;
  if(!t){                                          // a brand new one, made where you are
    const sel = planSel();
    const fresh = newPlanTask('', sel.kind === 'smart' && sel.id === 'today' ? today() : '',
      {listId: sel.kind === 'list' ? sel.id : 'inbox', tags: sel.kind === 'tag' ? [sel.id] : []});
    S.tasks.push(fresh); saveNow();
    return openPlanTask(fresh.id);
  }
  const p = openPanel(planDetailHTML(t), 'plan-detail');
  bindPlanDetail(p, t);
  setTimeout(() => { const ti = p.querySelector('#pdTitle'); if(ti && !t.text) ti.focus(); }, 120);
  return p;
}

function planDetailHTML(t){
  const pr = planPriority(t.priority), sub = planSubProgress(t);
  const sessions = planState().focusSessions.filter(s => s.taskId === t.id && s.type === 'focus');
  return `<div class="pd">
    <div class="pd-head">
      <button class="pt-box lg${t.done ? ' on' : ''}" id="pdDone" role="checkbox" aria-checked="${t.done}"
        style="${pr.color ? `--pc:${pr.color}` : ''}"><svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
      <!-- A one-line input cannot show a long task name at any width, and the
           name is the one thing the panel exists to show. A textarea that grows
           to its content wraps instead of hiding the end of the sentence. -->
      <textarea class="inp pd-title${t.done ? ' struck' : ''}" id="pdTitle" rows="1"
        placeholder="What needs doing?">${esc(t.text)}</textarea>
    </div>
    <div class="pd-prios">${PLAN_PRIORITY.map(x => `<button class="pd-prio${t.priority === x.n ? ' on' : ''}"
      data-pdprio="${x.n}" title="${esc(x.name)} priority" style="${x.color ? `--c:${x.color}` : '--c:var(--line-2)'}"></button>`).join('')}
      <span class="mono faint">${esc(pr.name.toLowerCase())}</span></div>

    <div class="pd-quick">
      <label class="pd-q"><span class="k">due</span><input type="date" class="inp" id="pdDay" value="${esc(t.day || '')}"></label>
      <label class="pd-q"><span class="k">at</span><input type="time" class="inp" id="pdTime" value="${esc(t.dueTime || '')}"></label>
      <label class="pd-q"><span class="k">starts</span><input type="date" class="inp" id="pdStart" value="${esc(t.startDate || '')}"></label>
      <label class="pd-q"><span class="k">list</span><select class="sel" id="pdList">
        ${planLists().map(l => `<option value="${l.id}" ${t.listId === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
    </div>

    <div class="pd-sec"><div class="k mono">how long</div><div class="chip-row">
      ${PLAN_DURATIONS.map(([v, n]) => `<button class="chip click${t.duration === v ? ' on' : ''}" data-pddur="${v}">${n}</button>`).join('')}
      ${t.duration ? `<button class="chip click" data-pddur="0">clear</button>` : ''}</div></div>

    <div class="pd-sec"><div class="k mono">tags</div><div class="chip-row" id="pdTags">
      ${planState().tags.map(x => `<button class="chip click${t.tags.includes(x.name) ? ' on' : ''}" data-pdtag="${esc(x.name)}" style="--c:${x.color}">${esc(x.name)}</button>`).join('')}
      <button class="chip click" id="pdNewTag" style="--c:var(--page-accent)">＋ tag</button></div></div>

    <div class="pd-sec"><div class="k mono">notes</div>
      <textarea class="ta" id="pdDesc" placeholder="Anything the title does not carry. Markdown welcome.">${esc(t.desc)}</textarea></div>

    <div class="pd-sec"><div class="row between"><span class="k mono">subtasks</span>
      <span class="mono faint">${sub ? `${sub.done}/${sub.total}` : ''}</span></div>
      ${sub ? `<div class="pd-bar"><i style="width:${Math.round(sub.done / sub.total * 100)}%"></i></div>` : ''}
      <div class="pd-subs" id="pdSubs">${t.subtasks.map((s, i) => `<div class="pd-sub${s.isCompleted ? ' done' : ''}" data-pdsub="${s.id}" draggable="true">
        <button class="pt-box sm" data-pdsubdone="${s.id}" role="checkbox" aria-checked="${s.isCompleted}"><svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.2" class="pt-ring"/><path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
        <input class="inp" data-pdsubtext="${s.id}" value="${esc(s.title)}" placeholder="a step">
        <button class="del-x inline" data-pdsubdel="${s.id}">×</button></div>`).join('')}</div>
      <input class="inp pd-subadd" id="pdSubAdd" placeholder="＋ add a step, Enter for another"></div>

    <div class="pd-sec"><div class="k mono">repeats</div>
      <div class="chip-row">${[['','never'],['daily','daily'],['weekly','weekly'],['monthly','monthly'],['yearly','yearly'],['after_completion','after it is done']]
        .map(([v, n]) => `<button class="chip click${(t.recurrence?.pattern || '') === v ? ' on' : ''}" data-pdrec="${v}">${n}</button>`).join('')}</div>
      ${t.recurrence ? `<div class="row" style="gap:8px;margin-top:8px;align-items:center">
        <span class="mono faint">every</span><input class="inp mono" id="pdRecN" style="width:64px" value="${t.recurrence.interval || 1}">
        <span class="mono faint">${t.recurrence.pattern === 'after_completion' ? 'days after it is done' : t.recurrence.pattern.replace(/ly$/, '') + 's'}</span>
        <span class="mono faint" style="margin-left:auto">next: ${planNextDue(t) ? esc(fmtDate(planNextDue(t), 'med')) : '—'}</span></div>` : ''}</div>

    <div class="pd-sec"><div class="k mono">reminders</div>
      <div class="chip-row">${PLAN_REMINDER_OFFSETS.map(([v, n]) =>
        `<button class="chip click${t.reminders.some(r => r.type === v) ? ' on' : ''}" data-pdrem="${v}">${n}</button>`).join('')}</div>
      ${!t.day ? '<div class="faint" style="font-size:.74rem;margin-top:5px">A reminder needs a due date to count from.</div>' : ''}</div>

    <div class="pd-sec"><div class="row between"><span class="k mono">focus</span>
      <span class="mono">${t.focusTime ? `${Math.floor(t.focusTime / 60)}h ${t.focusTime % 60}m logged` : 'nothing logged'}</span></div>
      <button class="btn sm" id="pdFocus">◔ start a focus session</button>
      ${sessions.length ? `<div class="pd-fsess">${sessions.slice(-6).reverse().map(s =>
        `<div class="mono"><span>${esc(fmtDate(s.startedAt.slice(0, 10), 'short'))}</span><span>${s.duration}m</span></div>`).join('')}</div>` : ''}</div>

    <div class="pd-sec"><div class="k mono">connects to</div>
      <div class="chip-row">${(S.projects || []).map(x => `<button class="chip click${t.links.projects.includes(x.id) ? ' on' : ''}" data-pdlk="projects:${x.id}" style="--c:var(--terra)">${esc(x.name)}</button>`).join('')}</div>
      <div class="chip-row" style="margin-top:6px">${(S.skills || []).filter(s => !s.planned).map(x => `<button class="chip click${t.links.skills.includes(x.id) ? ' on' : ''}" data-pdlk="skills:${x.id}" style="--c:var(--ment)">${esc(x.name)}</button>`).join('')}</div>
      ${typeof incomeStreamList === 'function' && incomeStreamList().length ? `<div class="chip-row" style="margin-top:6px">${incomeStreamList().map(s =>
        `<button class="chip click${t.streamId === s.id ? ' on' : ''}" data-pdstream="${esc(s.id)}" style="--c:var(--gold)">${esc(s.name)}</button>`).join('')}</div>` : ''}</div>

    <div class="pd-meta mono">
      <div>added ${esc(fmtDate((t.createdAt || '').slice(0, 10), 'med'))}</div>
      ${t.doneAt ? `<div>finished ${esc(fmtDate(t.doneAt, 'med'))}</div>` : ''}
      <div>in ${esc(planListName(t.listId))}</div></div>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn sm ghost" id="pdDup">duplicate</button>
      <button class="btn sm ghost danger" id="pdDel">delete</button></div>
  </div>`;
}

function bindPlanDetail(p, t){
  const touch = () => { t.updatedAt = new Date().toISOString(); saveNow(); };
  const redraw = () => { const np = openPanel(planDetailHTML(planTaskById(t.id)), 'plan-detail');
    bindPlanDetail(np, planTaskById(t.id)); rerenderPlanBody(); };

  /* It always saved as you typed, but said nothing and ignored Return, which
     reads exactly like a field that has not saved. Now it answers: a pulse
     when the text settles, and Return means "done" rather than nothing. */
  const pdT = p.querySelector('#pdTitle');
  /* grow to fit, now and after every change, so the whole name is always on
     screen — including at the widest the panel goes */
  const fitTitle = () => { pdT.style.height = 'auto'; pdT.style.height = pdT.scrollHeight + 'px'; };
  fitTitle(); pdT.addEventListener('input', fitTitle);
  addEventListener('resize', fitTitle);
  const pulse = () => { if(!pdT.isConnected) return;
    const s = el('<span class="saved-pulse">saved</span>');
    pdT.parentNode.appendChild(s); setTimeout(() => s.remove(), 1200); };
  pdT.oninput = debounce(function(){ t.text = this.value; touch(); pulse(); rerenderPlanBody(); }, 350);
  pdT.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); t.text = pdT.value; touch(); pulse(); rerenderPlanBody(); pdT.blur(); } };
  p.querySelector('#pdDone').onclick = () => { planSetDone(t, !t.done); sound(t.done ? 'success' : 'click'); redraw(); };
  p.querySelectorAll('[data-pdprio]').forEach(b => b.onclick = () => { t.priority = +b.dataset.pdprio; touch(); redraw(); });
  p.querySelector('#pdDay').onchange = function(){ t.day = this.value; planSyncReminders(t); touch(); rerenderPlanBody(); };
  p.querySelector('#pdTime').onchange = function(){ t.dueTime = this.value; planSyncReminders(t); touch(); rerenderPlanBody(); };
  p.querySelector('#pdStart').onchange = function(){ t.startDate = this.value; touch(); };
  p.querySelector('#pdList').onchange = function(){ t.listId = this.value; t.sectionId = null; touch(); rerenderPlanBody(); };
  p.querySelectorAll('[data-pddur]').forEach(b => b.onclick = () => { const v = +b.dataset.pddur;
    t.duration = v || null; touch(); redraw(); });
  p.querySelectorAll('[data-pdtag]').forEach(b => b.onclick = () => { const n = b.dataset.pdtag;
    const i = t.tags.indexOf(n); i < 0 ? t.tags.push(n) : t.tags.splice(i, 1);
    b.classList.toggle('on'); touch(); rerenderPlanBody(); });
  p.querySelector('#pdNewTag').onclick = () => { const n = prompt('Tag name'); if(!n || !n.trim()) return;
    const tag = planEnsureTag(n); if(tag && !t.tags.includes(tag.name)) t.tags.push(tag.name); touch(); redraw(); };
  p.querySelector('#pdDesc').oninput = debounce(function(){ t.desc = this.value; touch(); }, 400);

  /* subtasks */
  p.querySelectorAll('[data-pdsubdone]').forEach(b => b.onclick = () => {
    const s = t.subtasks.find(x => x.id === b.dataset.pdsubdone); if(!s) return;
    s.isCompleted = !s.isCompleted; s.completedAt = s.isCompleted ? new Date().toISOString() : null;
    sound(s.isCompleted ? 'click' : 'nav'); touch(); redraw(); });
  p.querySelectorAll('[data-pdsubtext]').forEach(i => i.oninput = debounce(function(){
    const s = t.subtasks.find(x => x.id === i.dataset.pdsubtext); if(s){ s.title = this.value; touch(); } }, 350));
  p.querySelectorAll('[data-pdsubdel]').forEach(b => b.onclick = () => {
    spliceOut(t.subtasks, x => x.id === b.dataset.pdsubdel); touch(); redraw(); });
  const sa = p.querySelector('#pdSubAdd');
  sa.onkeydown = ev => { if(ev.key !== 'Enter') return; ev.preventDefault();
    const v = sa.value.trim(); if(!v) return;
    t.subtasks.push({id:uid(), title:v, isCompleted:false, completedAt:null, sortOrder:t.subtasks.length});
    touch(); sound('click'); sa.value = '';
    const np = openPanel(planDetailHTML(t), 'plan-detail'); bindPlanDetail(np, t); rerenderPlanBody();
    setTimeout(() => np.querySelector('#pdSubAdd')?.focus(), 60); };

  /* recurrence */
  p.querySelectorAll('[data-pdrec]').forEach(b => b.onclick = () => {
    const v = b.dataset.pdrec;
    t.recurrence = v ? Object.assign({pattern:v, interval:1, daysOfWeek:[], dayOfMonth:null,
      monthOfYear:null, endDate:null, endAfter:null}, t.recurrence?.pattern === v ? t.recurrence : {}) : null;
    if(t.recurrence) t.recurrence.pattern = v;
    touch(); redraw(); });
  const rn = p.querySelector('#pdRecN');
  if(rn) rn.oninput = debounce(function(){ if(t.recurrence) t.recurrence.interval = Math.max(1, parseInt(this.value, 10) || 1); touch(); }, 400);

  /* reminders */
  p.querySelectorAll('[data-pdrem]').forEach(b => b.onclick = () => {
    const v = b.dataset.pdrem, i = t.reminders.findIndex(r => r.type === v);
    i < 0 ? t.reminders.push({type:v}) : t.reminders.splice(i, 1);
    planSyncReminders(t); touch(); b.classList.toggle('on');
    if(i < 0 && typeof planAskNotifyPermission === 'function') planAskNotifyPermission(); });

  /* links */
  p.querySelectorAll('[data-pdlk]').forEach(b => b.onclick = () => {
    const [k, id] = b.dataset.pdlk.split(':'); const arr = t.links[k];
    const i = arr.indexOf(id); i < 0 ? arr.push(id) : arr.splice(i, 1);
    b.classList.toggle('on'); touch(); });
  p.querySelectorAll('[data-pdstream]').forEach(b => b.onclick = () => {
    t.streamId = t.streamId === b.dataset.pdstream ? null : b.dataset.pdstream;
    p.querySelectorAll('[data-pdstream]').forEach(x => x.classList.toggle('on', x.dataset.pdstream === t.streamId));
    touch(); });

  p.querySelector('#pdFocus').onclick = () => { closePanel(); openFocusTimer(t.id); };
  p.querySelector('#pdDup').onclick = () => {
    const c = newPlanTask(t.text + ' (copy)', t.day, JSON.parse(JSON.stringify({listId:t.listId, sectionId:t.sectionId,
      priority:t.priority, dueTime:t.dueTime, duration:t.duration, desc:t.desc, tags:t.tags,
      subtasks:t.subtasks, quadrant:t.quadrant, kanbanColumn:t.kanbanColumn, links:t.links})));
    c.subtasks.forEach(s => { s.id = uid(); s.isCompleted = false; s.completedAt = null; });
    S.tasks.push(c); saveNow(); closePanel(); sound('success'); rerender(); };
  p.querySelector('#pdDel').onclick = () => { closePanel();
    requestDelete({label:t.text || 'Task', after:planRedraw, remove: () => spliceOut(S.tasks, x => x.id === t.id)}); };
}

/* Repainting the whole page would close this panel. Only the workspace needs
   to change while a task is being edited, so only the workspace is redrawn. */
function rerenderPlanBody(){
  if(parseHash().name !== 'planning') return;
  const main = $('#main'); if(!main) return;
  const keep = $('#panel');
  const y = window.scrollY;
  const body = $('#plBody'); if(!body) return;
  const sel = planSel();
  let tasks = planSelectionTasks(sel);
  const p = planState();
  tasks = planSortTasks(tasks, p.prefs.sort, p.prefs.sortDir);
  const v = planView();
  const special = sel.kind === 'smart' && (sel.id === 'habits' || sel.id === 'stats');
  body.innerHTML = special ? (sel.id === 'habits' ? planHabitsHTML() : planStatsHTML())
    : v === 'calendar' ? planCalendarHTML(tasks) : v === 'kanban' ? planKanbanHTML(sel, tasks)
    : v === 'eisenhower' ? planMatrixHTML(tasks) : v === 'timeline' ? planTimelineHTML(tasks)
    : planListViewHTML(sel, tasks);
  bindPlanning(main, sel, tasks);
  if(keep && !$('#panel')) document.body.appendChild(keep);
  window.scrollTo({top:y});
}
