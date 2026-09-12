/* ============================================================
   PLANNING — the page: a sidebar of where work lives, and one
   workspace that can be read five different ways.
   ============================================================ */

function planSel(){ return S._planSel || (S._planSel = {kind:'smart', id:'today'}); }
function planSetSel(kind, id){
  S._planSel = {kind, id};
  planState().prefs.lastView = `${kind}:${id}`;
  /* a list that prefers a board opens as a board */
  if(kind === 'list'){ const l = planList(id); if(l?.defaultView) S._planView = l.defaultView; }
  saveNow(); rerender();
}
function planView(){ return S._planView || planState().prefs.view || PLAN_VIEW_DEFAULT; }
function planSetView(v){ S._planView = v; planState().prefs.view = v; saveNow(); rerender(); }

/* ---------- sidebar ---------- */
function planSidebarHTML(){
  const p = planState(), sel = planSel();
  const on = (k, i) => sel.kind === k && sel.id === i ? ' on' : '';
  const listRow = l => `<button class="pl-item${on('list', l.id)}" data-plsel="list:${l.id}" draggable="true" data-pldrag="${l.id}"
      title="${esc(l.name)}${planListCount(l.id) ? ` · ${planListCount(l.id)} open` : ''}">
    <span class="pl-dot" style="background:${esc(l.color)}"></span><span class="pl-name">${esc(l.name)}</span>
    <span class="pl-n mono">${planListCount(l.id) || ''}</span></button>`;
  const loose = planLists().filter(l => !l.folderId);
  return `<aside class="pl-side${p.prefs.sidebarCollapsed ? ' collapsed' : ''}" id="plSide">
    <button class="pl-collapse" id="plCollapse" title="${p.prefs.sidebarCollapsed ? 'show the sidebar' : 'collapse the sidebar'}">${p.prefs.sidebarCollapsed ? '›' : '‹'}</button>
    <div class="pl-scroll">
      <input class="inp mono pl-search" id="plSearch" placeholder="search tasks…" value="${esc(S._planQ || '')}">
      <button class="pl-item pl-filter${S._planFilter && Object.keys(S._planFilter).length ? ' on' : ''}" id="plSideFilter" title="narrow what is shown">
        <span class="pl-ico">⚟</span><span class="pl-name">Filter</span>
        ${(() => { const n = Object.keys(S._planFilter || {}).length; return n ? `<span class="pl-n mono">${n}</span>` : ''; })()}</button>

      <div class="pl-group">
        ${(() => { const v = PLAN_SMART_VIEWS.find(x => x.id === 'all');
          return `<button class="pl-item${on('smart', 'all')}" data-plsel="smart:all" title="${esc(v.hint)}">
            <span class="pl-ico">${v.icon}</span><span class="pl-name">${esc(v.name)}</span>
            <span class="pl-n mono">${planSmartCount('all') || ''}</span></button>`; })()}

        <!-- one dated row, with the span chosen on it: the same question over
             three lengths of time, not three separate places -->
        ${(() => { const sp = planSpan(), v = PLAN_SMART_VIEWS.find(x => x.id === sp);
          const picked = PLAN_SPANS.includes(sel.id) && sel.kind === 'smart';
          return `<div class="pl-dated${picked ? ' on' : ''}">
            <button class="pl-item${picked ? ' on' : ''}" data-plsel="smart:${sp}" title="${esc(v.hint)}">
              <span class="pl-ico">${v.icon}</span><span class="pl-name">${esc(v.name)}</span>
              <span class="pl-n mono">${planSmartCount(sp) || ''}</span></button>
            <div class="pl-spans" role="group" aria-label="which span">
              ${PLAN_SPANS.map(id => { const w = PLAN_SMART_VIEWS.find(x => x.id === id);
                return `<button class="pl-span${sp === id ? ' on' : ''}" data-plspan="${id}" title="${esc(w.hint)}">${esc(w.name)}</button>`; }).join('')}
            </div></div>`; })()}
      </div>

      <div class="pl-head"><span>Lists</span><button class="pl-mini" id="plNewList" title="new list">＋</button></div>
      <div class="pl-group" id="plLists">
        ${p.folders.slice().sort((a,b)=>a.sortOrder-b.sortOrder).map(f => {
          const kids = planLists().filter(l => l.folderId === f.id);
          return `<div class="pl-folder${f.isCollapsed ? ' shut' : ''}" data-plfolder="${f.id}">
            <div class="pl-frow" draggable="true" data-plfdrag="${f.id}">
              <!-- the arrow folds, the name selects: a folder is a place to
                   look at as well as a place to keep things in -->
              <button class="pl-fold" data-plfold="${f.id}" aria-expanded="${!f.isCollapsed}"
                title="${f.isCollapsed ? 'show its lists' : 'hide its lists'}">${f.isCollapsed ? '▸' : '▾'}</button>
              <button class="pl-item pl-fhead${on('folder', f.id)}" data-plsel="folder:${f.id}"
                title="everything in ${esc(f.name)}">
                <span class="pl-name">${esc(f.name)}</span><span class="pl-n mono">${planFolderCount(f.id) || ''}</span></button>
              <!-- the folder is implied by where you asked, so there is nothing
                   to pick afterwards -->
              <button class="pl-mini pl-fadd" data-plnewin="${f.id}" title="new list in ${esc(f.name)}">＋</button>
            </div>
            <div class="pl-fkids">${kids.map(listRow).join('') || '<div class="pl-empty mono">drop a list here</div>'}</div></div>`;
        }).join('')}
        ${loose.map(listRow).join('')}
      </div>
      <button class="pl-mini-row" id="plNewFolder">＋ folder</button>

      ${p.tags.length ? `<div class="pl-head"><span>Tags</span></div>
      <div class="pl-group pl-tags">${p.tags.map(t => `<button class="pl-item${on('tag', t.name)}" data-plsel="tag:${t.name}" title="#${esc(t.name)}">
        <span class="pl-dot" style="background:${esc(t.color)}"></span><span class="pl-name">${esc(t.name)}</span>
        <span class="pl-n mono">${planTagCount(t.name) || ''}</span></button>`).join('')}</div>` : ''}

      <div class="pl-head"><span>Filters</span><button class="pl-mini" id="plNewFilter" title="new saved filter">＋</button></div>
      <div class="pl-group">${p.smartLists.map(sl => `<button class="pl-item${on('smartlist', sl.id)}" data-plsel="smartlist:${sl.id}" title="${esc(sl.name)}">
        <span class="pl-ico">${esc(sl.icon || '⌗')}</span><span class="pl-name">${esc(sl.name)}</span>
        <span class="pl-n mono">${planApplySmartList(sl).length || ''}</span></button>`).join('')
        || '<div class="pl-empty mono">no saved filters yet</div>'}</div>
    </div>
    <div class="pl-foot">
      <button class="pl-item" id="plFocusBtn" title="The focus timer is on Today"><span class="pl-ico">◔</span><span class="pl-name">Focus timer ↗</span></button>
      <!-- last, because finished work is what you look at last -->
      ${(() => { const v = PLAN_SMART_VIEWS.find(x => x.id === 'done');
        return `<button class="pl-item pl-done-item${on('smart','done')}" data-plsel="smart:done" title="${esc(v.hint)}">
          <span class="pl-ico">${v.icon}</span><span class="pl-name">${esc(v.name)}</span>
          <span class="pl-n mono">${planSmartCount('done') || ''}</span></button>`; })()}
    </div>
  </aside>`;
}

/* ---------- the header over the workspace ---------- */
function planHeaderHTML(sel){
  const p = planState(), v = planView();
  const f = S._planFilter || {};
  const chips = [];
  if(f.priority != null) chips.push(`<span class="pf-chip on" data-pfclear="priority">${planPriority(f.priority).name}<i>×</i></span>`);
  if(f.tag) chips.push(`<span class="pf-chip on" data-pfclear="tag">#${esc(f.tag)}<i>×</i></span>`);
  if(f.range) chips.push(`<span class="pf-chip on" data-pfclear="range">${esc(f.range)}<i>×</i></span>`);
  const special = sel.kind === 'smart' && sel.id === 'stats';
  return `<div class="pl-header">
    <div class="row between" style="align-items:baseline;gap:12px">
      <h2 class="pl-title">${esc(planSelectionTitle(sel))}</h2>
      ${special ? '' : `<div class="pl-viewsw">${PLAN_VIEWS.map((x, i) => `<button class="${v === x.id ? 'on' : ''}" data-plview="${x.id}" title="${esc(x.name)} view (${i + 1})">${x.icon}</button>`).join('')}</div>`}
    </div>
    ${typeof shortcutHintHTML === 'function' ? shortcutHintHTML('planning') : ''}
    ${special ? '' : `<div class="pl-bar">
      <div class="pl-sortwrap"><select class="sel" id="plSort" style="width:auto;padding-right:22px;font-size:.78rem">
        ${PLAN_SORTS.map(([k, n]) => `<option value="${k}" ${p.prefs.sort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="pf-chips">
        ${chips.join('')}
        <button class="pf-chip" id="plFilterBtn">filter…</button>
        <button class="pf-chip${p.prefs.showCompleted ? ' on' : ''}" id="plShowDone">done</button>
      </div>
      <span class="pl-count mono" id="plCount"></span>
    </div>`}
  </div>`;
}

/* ---------- one task row ---------- */
function planRowHTML(t, {showList = false, showDate = true} = {}){
  const pr = planPriority(t.priority), sub = planSubProgress(t), late = planIsLate(t);
  return `<div class="pt-row${t.done ? ' done' : ''}${late ? ' late' : ''}${S._planPick?.has(t.id) ? ' picked' : ''}"
      data-ptrow="${t.id}" data-prio="${t.priority}" draggable="true">
    ${subCaretHTML(t.id, t, 'task-caret pt-caret')}
    <button class="pt-box" data-ptdone="${t.id}" role="checkbox" aria-checked="${t.done}"
      style="${pr.color ? `--pc:${pr.color}` : ''}" title="${t.done ? 'not done after all' : 'done'}">
      <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" class="pt-ring"/>
        <path d="M5.6 10.3 L8.7 13.3 L14.4 6.9" class="pt-tick"/></svg></button>
    ${t.priority ? `<span class="pt-prio" style="background:${pr.color}" title="${pr.name} priority"></span>` : ''}
    <span class="pt-text" data-tedit="${t.id}" title="click to rewrite">${esc(t.text || 'Untitled task')}</span>
    <span class="pt-meta">
      ${sub ? `<button class="pt-sub mono" data-tsubs="${t.id}" title="${sub.done} of ${sub.total} steps done">${sub.done}/${sub.total}</button>` : ''}
      ${t.recurrence ? `<span class="pt-rep" title="repeats ${esc(t.recurrence.pattern)}">↻</span>` : ''}
      ${t.duration ? `<span class="pt-dur mono">${t.duration >= 60 ? (t.duration / 60).toFixed(t.duration % 60 ? 1 : 0) + 'h' : t.duration + 'm'}</span>` : ''}
      ${t.tags.map(x => `<span class="pt-tag" style="--c:${planTagColor(x)}">${esc(x)}</span>`).join('')}
      ${showList && t.listId !== 'inbox' ? `<span class="pt-list" style="--c:${planListColor(t.listId)}">${esc(planListName(t.listId))}</span>` : ''}
      ${showDate && t.day ? `<span class="pt-day mono${late ? ' late' : ''}">${late ? '⚠ ' : ''}${esc(fmtDate(t.day, 'short'))}${t.dueTime ? ' ' + esc(t.dueTime) : ''}</span>` : ''}
    </span>
    <button class="del-x inline" data-ptdel="${t.id}" title="delete">×</button>
  </div>
  ${subsOpen(t.id, t) ? subBlockHTML(t.id, t) : ''}`;
}

/* ---------- list view ---------- */
function planGroupTasks(tasks, sel){
  const p = planState(), T = today();
  const mode = p.prefs.group === 'auto'
    ? (sel.kind === 'smart' && ['today','next7','all','tomorrow'].includes(sel.id) ? 'date' : 'section')
    : p.prefs.group;
  if(mode === 'date'){
    const g = new Map();
    tasks.forEach(t => {
      const k = !t.day ? 'No date' : t.day < T ? 'Overdue' : t.day === T ? 'Today'
        : t.day === addDays(T, 1) ? 'Tomorrow' : fmtDate(t.day, 'med');
      if(!g.has(k)) g.set(k, []); g.get(k).push(t);
    });
    const order = ['Overdue','Today','Tomorrow'];
    return [...g.entries()].sort((a, b) => {
      const ai = order.indexOf(a[0]), bi = order.indexOf(b[0]);
      if(ai > -1 || bi > -1) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      if(a[0] === 'No date') return 1; if(b[0] === 'No date') return -1;
      return (a[1][0].day || '').localeCompare(b[1][0].day || '');
    });
  }
  if(mode === 'list'){
    const g = new Map();
    tasks.forEach(t => { const k = planListName(t.listId); if(!g.has(k)) g.set(k, []); g.get(k).push(t); });
    return [...g.entries()];
  }
  if(mode === 'priority'){
    const g = new Map();
    [3,2,1,0].forEach(n => { const ts = tasks.filter(t => t.priority === n); if(ts.length) g.set(planPriority(n).name, ts); });
    return [...g.entries()];
  }
  return null;                                   // section mode is handled by the list view itself
}
function planListViewHTML(sel, tasks){
  const p = planState();
  const grouped = planGroupTasks(tasks, sel);
  const live = tasks.filter(t => !t.done), doneT = tasks.filter(t => t.done);
  const quick = ctx => `<div class="pq-wrap"><input class="inp pq-input" data-pqadd="${esc(JSON.stringify(ctx))}"
      placeholder="＋ add a task — try “report friday 2pm #work !high ~1h”"><div class="pq-preview"></div></div>`;

  if(grouped){
    return `${quick({})}
      ${grouped.map(([name, ts]) => `<div class="pt-group"><div class="pt-ghead">${esc(name)}<span class="mono">${ts.length}</span></div>
        <div class="pt-gbody" data-ptgroup>${ts.map(t => planRowHTML(t, {showList: true})).join('')}</div></div>`).join('')
      || `<div class="empty">${esc(planEmptyLine(sel))}</div>`}`;
  }
  /* a real list: its own sections, each of them a place to add to */
  const l = sel.kind === 'list' ? planList(sel.id) : null;
  const secs = l ? l.sections.slice().sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const loose = live.filter(t => !t.sectionId || !secs.some(s => s.id === t.sectionId));
  return `${quick({listId: l?.id})}
    <div class="pt-loose" data-ptgroup>${loose.map(t => planRowHTML(t)).join('')}</div>
    ${secs.map(sc => { const ts = live.filter(t => t.sectionId === sc.id);
      return `<div class="pt-section${sc.isCollapsed ? ' shut' : ''}" data-plsec="${sc.id}">
        <div class="pt-shead"><button class="pt-stog" data-plsectog="${sc.id}">${sc.isCollapsed ? '▸' : '▾'}</button>
          <span class="pt-sname">${esc(sc.name)}</span><span class="mono">${ts.length}</span>
          <button class="pl-mini" data-plsecdel="${sc.id}" title="remove section">×</button></div>
        <div class="pt-sbody"><div class="pt-secrows" data-ptgroup>${ts.map(t => planRowHTML(t)).join('') || '<div class="pl-empty mono">nothing in this section</div>'}</div>
          ${quick({listId: l?.id, sectionId: sc.id})}</div></div>`; }).join('')}
    ${l ? `<button class="pl-mini-row" id="plNewSection">＋ section</button>` : ''}
    ${!live.length && !doneT.length ? `<div class="empty">${esc(planEmptyLine(sel))}</div>` : ''}
    ${doneT.length ? `<details class="pt-done"${p.prefs.showCompleted ? ' open' : ''}><summary><span class="sc">Completed</span><span class="mono">${doneT.length}</span></summary>
      <div data-ptgroup>${doneT.map(t => planRowHTML(t)).join('')}</div></details>` : ''}`;
}
function planEmptyLine(sel){
  if(sel.kind === 'smart'){
    if(sel.id === 'inbox')  return 'Nothing unprocessed. A clear inbox is a clear mind.';
    if(sel.id === 'today')  return 'Nothing due today. A day with no obligations is either very good or very avoidant.';
    if(sel.id === 'done')   return 'Nothing finished in the last month. That is either rest or drift — you know which.';
    if(sel.id === 'next7')  return 'The week ahead is empty. Either it is genuinely clear, or it has not been thought about yet.';
  }
  if(sel.kind === 'tag') return 'Nothing carries this tag right now.';
  return 'This list is waiting for its first task.';
}

/* ---------- the page ---------- */
/* ---------- two rooms, not one room with habits filed inside it ----------
   Habits were an item in the sidebar, sitting among the smart task views, so
   the daily practice you are trying to keep was one line below "next 7 days".
   They are not a way of looking at tasks; they are the other half of what this
   page is for, so they are a peer of the whole task side rather than a sibling
   of one of its layouts. */
const PLAN_ROOMS = [
  {id:'tasks',  name:'Tasks',  icon:'▤'},
  {id:'habits', name:'Habits', icon:'◍'},
  {id:'stats',  name:'Statistics', icon:'◫'},
];
function planRoom(){ const r = S._planRoom || planState().prefs.room || 'tasks';
  return PLAN_ROOMS.some(x => x.id === r) ? r : 'tasks'; }
function planSetRoom(id){
  S._planRoom = id; planState().prefs.room = id; saveNow(); rerender();
}
function planRoomsHTML(){
  const cur = planRoom();
  const due = (S.habits || []).filter(h => !h.archived && !h.negative && habitDue(h, today()) && !habitDone(h, today())).length;
  return `<div class="pl-rooms" role="tablist" aria-label="Tasks or habits">
    ${PLAN_ROOMS.map(r => `<button class="pl-room${cur === r.id ? ' on' : ''}" role="tab"
      aria-selected="${cur === r.id}" data-plroom="${r.id}">
      <span class="pl-ico">${r.icon}</span>${esc(r.name)}${r.id === 'habits' && due ? `<i class="pl-n mono">${due}</i>` : ''}</button>`).join('')}
  </div>`;
}

routes.planning = function(root, params){
  migratePlanning();
  /* an address still naming habits opens the habits room rather than a
     selection inside the task room that no longer exists */
  if(params[0] === 'habits' || params[0] === 'stats'){ S._planRoom = params[0]; }
  else if(params[0]) { S._planRoom = 'tasks'; S._planSel = {kind:'smart', id:params[0]}; }
  const sel = planSel();
  registerPageEntry({pageName:'Planning', addLabel:'New task', defaultEntryType:'task', prefilledFields:{},
    hint:'or type it straight into a quadrant, or the line at the top of the list',
    options:[{label:'New task', run:() => openPlanTask(null)}]});

  let tasks = planSelectionTasks(sel);
  const f = S._planFilter || {};
  if(f.priority != null) tasks = tasks.filter(t => t.priority === f.priority);
  if(f.tag)   tasks = tasks.filter(t => t.tags.includes(f.tag));
  if(f.range === 'overdue') tasks = tasks.filter(planIsLate);
  if(f.range === 'no date') tasks = tasks.filter(t => !t.day);
  if(S._planQ) { const q = S._planQ.toLowerCase();
    tasks = tasks.filter(t => (t.text + ' ' + t.desc + ' ' + t.tags.join(' ') + ' ' +
      t.subtasks.map(s => s.title).join(' ')).toLowerCase().includes(q)); }
  const p = planState();
  tasks = planSortTasks(tasks, p.prefs.sort, p.prefs.sortDir);

  const v = planView();
  const special = sel.kind === 'smart' && sel.id === 'stats';
  const body = special
    ? planStatsHTML()
    : v === 'calendar'   ? planCalendarHTML(tasks)
    : v === 'kanban'     ? planKanbanHTML(sel, tasks)
    : v === 'eisenhower' ? planMatrixHTML(tasks)
    : v === 'timeline'   ? planTimelineHTML(tasks)
    : planListViewHTML(sel, tasks);

  const room = planRoom();
  if(room === 'habits' || room === 'stats'){
    root.innerHTML = `<div class="page plan-page">
      <div class="page-head"><h1>Planning</h1></div>
      ${planRoomsHTML()}
      <div class="pl-habits-room">${room === 'habits' ? planHabitsHTML() : planStatsHTML()}</div>
    </div>`;
    bindPlanRooms(root);
    if(room === 'habits' && typeof bindPlanHabits === 'function') bindPlanHabits(root);
    return;
  }

  root.innerHTML = `<div class="page plan-page">
    <div class="page-head"><h1>Planning</h1></div>
    ${planRoomsHTML()}
    ${planReminderBannerHTML()}
    <div class="plan-shell${planState().prefs.sidebarCollapsed ? ' shut' : ''}">
      ${planSidebarHTML()}
      <section class="pl-main" id="plMain">
        ${planHeaderHTML(sel)}
        <div class="pl-body" id="plBody">${body}</div>
        ${planBatchBarHTML()}
      </section>
    </div>
  </div>`;
  const count = $('#plCount'); if(count) count.textContent = `${tasks.filter(t => !t.done).length} open`;
  bindPlanRooms(root);
  bindPlanning(root, sel, tasks);
};
ROUTE_ALIASES.plan = 'planning';

function bindPlanRooms(root){
  $$('[data-plroom]', root).forEach(b => b.onclick = () => { sound('nav'); planSetRoom(b.dataset.plroom); });
}
