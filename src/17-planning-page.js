/* ============================================================
   PLANNING — the page: a sidebar of where work lives, and one
   workspace that can be read five different ways.
   ============================================================ */

function planSel(){ return S._planSel = planFixSel(S._planSel || {kind:'smart', id:'today'}); }
/* "All" no longer has a row in the sidebar, so a remembered selection on it
   would leave nothing lit and no way back to it. Send it to the dated view,
   which is what the top of the sidebar now opens with. */
function planFixSel(sel){
  if(sel.kind === 'smart' && sel.id === 'all') return {kind:'smart', id: planSpan()};
  return sel;
}
function planSetSel(kind, id){
  S._planSel = {kind, id};
  planState().prefs.lastView = `${kind}:${id}`;
  /* Every selection opens on the matrix. Picking a list is asking "what is in
     here, and what should I touch first" — the second half of that is what the
     matrix answers, and carrying over whichever view happened to be open last
     answered it by accident. A list that has deliberately been given a view of
     its own still gets it. */
  const l = kind === 'list' ? planList(id) : null;
  S._planView = l?.defaultView || PLAN_VIEW_DEFAULT;
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
      <!-- "All" is gone: a list of every task in the house is the one view
           that never answers a question, and it was standing between the
           search and the lists. The lists come up to meet the search instead,
           and the filter goes to the foot with Completed — both are things
           you reach for after you have decided what you are looking at. -->
      <div class="pl-group">
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

      <!-- The saved-filter list used to sit here, a second filter with its own
           builder. There is one filter now, at the top, and it asks everything
           that builder asked. Saved filters are left in the data untouched. -->
    </div>
    <div class="pl-foot">
      ${(() => { const n = planFilterCount(S._planFilter);
        return `<button class="pl-item pl-filter${n ? ' on' : ''}" id="plSideFilter" title="narrow what is shown — lists, tags, priority, dates, steps">
          <span class="pl-ico">⚟</span><span class="pl-name">Filter</span>
          ${n ? `<span class="pl-n mono">${n}</span>` : ''}</button>`; })()}
      <!-- The focus timer is no longer a place. Every task carries its own
           timer now, wherever the task is, so there is nothing here to go to. -->
      <!-- last, because finished work is what you look at last -->
      ${(() => { const v = PLAN_SMART_VIEWS.find(x => x.id === 'done');
        return `<button class="pl-item pl-done-item${on('smart','done')}" data-plsel="smart:done" title="${esc(v.hint)}">
          <span class="pl-ico">${v.icon}</span><span class="pl-name">${esc(v.name)}</span>
          <span class="pl-n mono">${planSmartCount('done') || ''}</span></button>`; })()}
    </div>
  </aside>`;
}

/* ---------- the milestone strip ----------
   One line of time, from the first date that matters to the last, with today
   marked on it. It is drawn above the workspace rather than inside a view,
   because the run a list is on does not change with how you happen to be
   reading the tasks.

   The scale is fitted to the dates it has, with a little air either side, and
   today is always inside it — a strip whose window excludes the present is a
   strip you cannot read your position off. */
function planMilestoneSpan(items){
  const ds = items.map(x => x.m.date).filter(Boolean).sort();
  const T = today();
  let lo = ds[0] || T, hi = ds[ds.length - 1] || T;
  if(T < lo) lo = T;
  if(T > hi) hi = T;
  /* a single date, or several on one day, would divide by zero */
  let pad = Math.max(3, Math.round(Math.abs(daysBetween(lo, hi)) * 0.12));
  return {from: addDays(lo, -pad), to: addDays(hi, pad)};
}
/* carried outside the map because a template literal cannot hold a running
   value, and the choice for one pin depends on what the pin before it did */
const planMilestoneRowState = {last: false};
/* How far away a date is, said the way a person would say it. A number of
   days stops being legible somewhere around a fortnight — "in 34 days" has to
   be divided before it means anything — so from a week out it is weeks and
   days. Past dates are counted the same way, backwards. */
function planWhenAway(date, from = today()){
  if(!date) return '';
  const d = daysBetween(from, date);
  if(d === 0) return 'today';
  const n = Math.abs(d), past = d < 0;
  let said;
  if(n === 1) said = past ? 'yesterday' : 'tomorrow';
  else if(n < 7) said = `${n} days`;
  else {
    const w = Math.floor(n / 7), r = n % 7;
    said = `${w} week${w === 1 ? '' : 's'}${r ? ` ${r} day${r === 1 ? '' : 's'}` : ''}`;
  }
  if(n === 1) return said;
  return past ? `${said} ago` : `in ${said}`;
}
function planMilestoneStripHTML(sel){
  if(!sel || (sel.kind !== 'list' && sel.kind !== 'folder')) return '';
  const items = planMilestonesFor(sel);
  const host = planMilestoneList(sel);
  planMilestoneRowState.last = false;
  const add = host ? `<button class="pl-mini" id="plMsAdd" title="a date that matters for this list">＋ milestone</button>` : '';
  if(!items.length) return `<div class="pl-ms empty-strip">
    <span class="k mono">Milestones</span>
    <span class="faint">No dates set for this ${sel.kind === 'folder' ? 'folder' : 'list'} yet — a shipping date, a hearing, the day a deposit is due.</span>
    ${add}</div>`;
  const {from, to} = planMilestoneSpan(items);
  const total = Math.max(1, daysBetween(from, to));
  const at = d => clamp(daysBetween(from, d) / total * 100, 0, 100);
  const T = today();
  /* one tick a month if the run is long, one a week if it is short */
  const weeks = total / 7;
  const step = weeks <= 8 ? 7 : weeks <= 30 ? 14 : 30;
  const ticks = [];
  for(let d = from; d <= to; d = addDays(d, step)) ticks.push(d);
  return `<div class="pl-ms">
    <div class="row between" style="align-items:baseline">
      <span class="k mono">Milestones</span>
      <span class="mono faint">${items.filter(x => !x.m.done).length} ahead · ${items.length} in all</span>
      ${add}
    </div>
    <div class="pl-msline" role="list">
      <div class="pl-msaxis">${ticks.map(d => `<span class="pl-mstick" style="left:${at(d)}%">${esc(fmtDate(d, 'short'))}</span>`).join('')}</div>
      <div class="pl-msrail"></div>
      <div class="pl-msnow" style="left:${at(T)}%"><span class="mono">today</span></div>
      ${items.map(({m, list}, i) => { const late = !m.done && m.date && m.date < T;
        /* a name printed under a neighbour four days away is unreadable, so
           every other pin hangs its name lower on a stem */
        const near = i > 0 && Math.abs(daysBetween(items[i - 1].m.date || T, m.date || T)) / total < 0.09;
        const low = near && !(planMilestoneRowState.last);
        planMilestoneRowState.last = low;
        return `<button class="pl-mspin${m.done ? ' done' : ''}${late ? ' late' : ''}${low ? ' low' : ''}" data-plms="${m.id}"
          style="left:${at(m.date || T)}%;--c:${esc(list.color)}" role="listitem"
          title="${esc(m.name)} · ${m.date ? esc(fmtDate(m.date, 'med')) + ' · ' + esc(planWhenAway(m.date)) : 'no date'}${m.note ? ' · ' + esc(m.note) : ''}">
          <i class="pl-msdot"></i><span class="pl-mslabel">${esc(m.name)}</span>
          ${m.date ? `<span class="pl-msaway mono">${esc(m.done ? fmtDate(m.date, 'short') : planWhenAway(m.date))}</span>` : ''}</button>`; }).join('')}
    </div>
  </div>`;
}
function bindPlanMilestones(root, sel){
  const addb = root.querySelector('#plMsAdd');
  if(addb) addb.onclick = () => { const host = planMilestoneList(sel); if(!host) return;
    const m = planAddMilestone(host.id); sound('click'); rerender();
    setTimeout(() => openPlanMilestone(m.id), 60); };
  root.querySelectorAll('[data-plms]').forEach(b => b.onclick = () => openPlanMilestone(b.dataset.plms));
}
function openPlanMilestone(id){
  const hit = planFindMilestone(id); if(!hit) return;
  const {m, list} = hit;
  const mo = openModal(`<h2>A date that matters</h2>
    <p class="muted" style="font-size:.85rem">In ${esc(list.name)}. Not a task — a date the work is running towards.</p>
    <div class="stack">
      <div class="field"><label>What it is</label><input class="inp serif-lg" id="msName" value="${esc(m.name)}" placeholder="Ship it · the hearing · deposit due"></div>
      <div class="field"><label>When</label><div class="dp-field"><input class="inp mono" id="msDate" data-dp value="${esc(m.date || '')}" placeholder="${esc(today())}">${dpButtonHTML('msDate')}</div></div>
      <div class="field"><label>Anything to remember about it</label><textarea class="ta" id="msNote" style="min-height:60px" placeholder="optional">${esc(m.note || '')}</textarea></div>
      <label class="toggle ${m.done ? 'on' : ''}" id="msDone"><span class="sw"></span><span>this one has been met</span></label>
      <div class="row between"><button class="btn sm ghost danger" id="msDel">remove</button>
        <button class="btn primary" id="msSave">Save</button></div>
    </div>`, 'narrow');
  let done = !!m.done;
  mo.querySelector('#msDone').onclick = function(){ done = !done; this.classList.toggle('on', done); };
  mo.querySelector('#msSave').onclick = () => {
    m.name = mo.querySelector('#msName').value.trim() || 'A date that matters';
    m.date = mo.querySelector('#msDate').value.trim();
    m.note = mo.querySelector('#msNote').value.trim();
    m.done = done;
    saveNow(); mo.remove(); sound('success'); rerender();
  };
  mo.querySelector('#msDel').onclick = () => { mo.remove();
    requestDelete({label: m.name || 'Milestone', after: rerender, remove: () => planDeleteMilestone(m.id)}); };
}

/* ---------- the header over the workspace ---------- */
function planHeaderHTML(sel){
  const p = planState(), v = planView();
  const f = S._planFilter || {};
  /* what the filter is doing, said in the header and clearable one axis at a
     time — the filter itself is set in one place, at the top of the sidebar */
  const RANGE_SAID = {overdue:'overdue', today:'today', tomorrow:'tomorrow', next7days:'next 7 days', noDate:'no date'};
  const chips = [];
  if(f.lists?.length) chips.push(`<span class="pf-chip on" data-pfclear="lists">${f.lists.map(planListName).join(', ')}<i>×</i></span>`);
  if(f.tags?.length) chips.push(`<span class="pf-chip on" data-pfclear="tags">${f.tags.map(x => '#' + esc(x)).join(' ')}<i>×</i></span>`);
  if(f.priorities?.length) chips.push(`<span class="pf-chip on" data-pfclear="priorities">${f.priorities.map(n => planPriority(n).name).join(', ')}<i>×</i></span>`);
  if(f.dateRange) chips.push(`<span class="pf-chip on" data-pfclear="dateRange">${esc(RANGE_SAID[f.dateRange] || String(f.dateRange))}<i>×</i></span>`);
  if(f.completion && f.completion !== 'any') chips.push(`<span class="pf-chip on" data-pfclear="completion">${f.completion === 'active' ? 'not done' : 'done'}<i>×</i></span>`);
  if(f.hasSubtasks === true || f.hasSubtasks === false) chips.push(`<span class="pf-chip on" data-pfclear="hasSubtasks">${f.hasSubtasks ? 'has steps' : 'no steps'}<i>×</i></span>`);
  if(f.search) chips.push(`<span class="pf-chip on" data-pfclear="search">“${esc(f.search)}”<i>×</i></span>`);
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
    <span class="pt-text" title="open this task">${esc(t.text || 'Untitled task')}</span>
    <button class="task-pen" data-tedit="${t.id}" title="rename it here" aria-label="rename">✎</button>
    ${taskTimerBtnHTML(t.id)}
    <span class="pt-meta">
      ${taskIsInProgress(t.id) && !t.done ? `<span class="pt-wip mono" title="${fmtHM(taskFocusMinutes(t.id))} sat with so far">in progress</span>` : ''}
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
  /* An address naming a room or a view is where you arrived, not a standing
     instruction. Applied on every render it became one: the page re-read the
     hash each time, so clicking a list set the selection and the very next
     redraw put it straight back — the page looked stuck on Today and no other
     list could be opened. It is consumed instead, the way the Skills and
     Projects pages already consume the id of a panel they were asked to open. */
  if(params[0]){
    if(params[0] === 'habits' || params[0] === 'stats') S._planRoom = params[0];
    else { S._planRoom = 'tasks'; S._planSel = {kind:'smart', id:params[0]};
      if(PLAN_SPANS.includes(params[0])){ S._planSpan = params[0]; planState().prefs.span = params[0]; } }
    consumeHashParam('#/planning');
  }
  const sel = planSel();
  registerPageEntry({pageName:'Planning', addLabel:'New task', defaultEntryType:'task', prefilledFields:{},
    hint:'or type it straight into a quadrant, or the line at the top of the list',
    options:[{label:'New task', run:() => openPlanTask(null)}]});

  let tasks = planSelectionTasks(sel);
  if(planFilterCount(S._planFilter)) tasks = tasks.filter(t => planFilterKeep(S._planFilter, t));
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
    : v === 'timeline'   ? planTimelineHTML(tasks, sel)
    : planListViewHTML(sel, tasks);

  const room = planRoom();
  if(room === 'habits' || room === 'stats'){
    root.innerHTML = `<div class="page plan-page">
      <div class="page-head"><h1>Planning</h1></div>
      ${planRoomsHTML()}
      <div class="pl-habits-room${room === 'stats' ? ' pl-stats-room' : ''}">${room === 'habits' ? habRoomHTML() : planStatsHTML()}</div>
    </div>`;
    bindPlanRooms(root);
    if(room === 'habits') bindHabRoom(root);
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
        ${special ? '' : planMilestoneStripHTML(sel)}
        <div class="pl-body" id="plBody">${body}</div>
        ${planBatchBarHTML()}
      </section>
    </div>
  </div>`;
  const count = $('#plCount'); if(count) count.textContent = `${tasks.filter(t => !t.done).length} open`;
  bindPlanRooms(root);
  bindPlanning(root, sel, tasks);
  bindPlanMilestones(root, sel);
};
ROUTE_ALIASES.plan = 'planning';

function bindPlanRooms(root){
  $$('[data-plroom]', root).forEach(b => b.onclick = () => { sound('nav'); planSetRoom(b.dataset.plroom); });
}
