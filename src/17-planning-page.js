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
  /* There are two ways to name the Inbox — the smart view and the list that
     actually holds the tasks — and they answer almost but not quite the same
     way. The list is the real one: it has sections, a view of its own, and it
     obeys "show done". Anything asking for the Inbox gets that one, so the
     button at the top lights up whichever way you arrived. */
  if(sel.kind === 'smart' && sel.id === 'inbox') return {kind:'list', id:'inbox'};
  return sel;
}
function planSetSel(kind, id){
  /* A filter belongs to the thing it was set on. Carrying it to the next list
     meant opening a list and finding it half empty, or empty, for a reason
     three clicks away at the foot of the sidebar — the list looked wrong
     rather than narrowed. Changing what you are looking at clears it.
     (The search box on the top line stays: its text is on the screen, so a
     narrowed list there says why it is narrowed.) */
  const changed = !S._planSel || S._planSel.kind !== kind || S._planSel.id !== id;
  if(changed && typeof planFilterCount === 'function' && planFilterCount(S._planFilter)) S._planFilter = {};
  S._planSel = {kind, id};
  planState().prefs.lastView = `${kind}:${id}`;
  /* Every selection opens on the matrix. Picking a list is asking "what is in
     here, and what should I touch first" — the second half of that is what the
     matrix answers, and carrying over whichever view happened to be open last
     answered it by accident. A list that has deliberately been given a view of
     its own still gets it. */
  /* Except the three that are a date. Today, Tomorrow and the next seven days
     are not asking "what should I touch first" — the answer to that is the
     order they are already in. They are asking "what is there", and the matrix
     sorts a day into four boxes when what you wanted was the day. */
  const l = kind === 'list' ? planList(id) : null;
  S._planView = (kind === 'smart' && PLAN_SPANS.includes(id)) ? 'list'
    : (l?.defaultView || PLAN_VIEW_DEFAULT);
  saveNow(); rerender();
}
function planView(){
  /* Arriving at the page with a date already chosen has to agree with
     pressing that date: both are "show me the day". _planView is only set by
     a deliberate switch or a fresh selection this session, so its absence is
     exactly the case where the saved preference would otherwise decide, and
     the saved preference is a memory of some other list. */
  const sel = typeof planSel === 'function' ? planSel() : null;
  if(!S._planView && sel && sel.kind === 'smart' && PLAN_SPANS.includes(sel.id)) return 'list';
  const v = S._planView || planState().prefs.view || PLAN_VIEW_DEFAULT;
  /* Board and Timeline are gone. A list that still remembers one of them —
     or a saved preference from before — must not leave the workspace blank. */
  return PLAN_VIEWS.some(x => x.id === v) ? v : PLAN_VIEW_DEFAULT;
}
function planSetView(v){ S._planView = v; planState().prefs.view = v; saveNow(); rerender(); }

/* ---------- sidebar ---------- */
function planSidebarHTML(){
  const p = planState(), sel = planSel();
  const on = (k, i) => sel.kind === k && sel.id === i ? ' on' : '';
  const listRow = l => `<button class="pl-item${on('list', l.id)}" data-plsel="list:${l.id}" draggable="true" data-pldrag="${l.id}"
      title="${esc(l.name)}${planListCount(l.id) ? ` · ${planListCount(l.id)} open` : ''}">
    <span class="pl-dot" style="background:${esc(l.color)}"></span><span class="pl-name">${esc(l.name)}</span>
    <span class="pl-n mono">${planListCount(l.id) || ''}</span></button>`;
  /* The Inbox is not one list among the lists. It is the place a task goes
     when you have not said where it goes, so it belongs on the line that puts
     things there — up beside the box you type into — not filed in the middle
     of the column of the lists you made on purpose. */
  const loose = planLists().filter(l => !l.folderId && l.id !== 'inbox');
  return `<aside class="pl-side${p.prefs.sidebarCollapsed ? ' collapsed' : ''}" id="plSide">
    <button class="pl-collapse" id="plCollapse" title="${p.prefs.sidebarCollapsed ? 'show the sidebar' : 'collapse the sidebar'}">${p.prefs.sidebarCollapsed ? '›' : '‹'}</button>
    <div class="pl-scroll">
      <!-- "All" is gone: a list of every task in the house is the one view
           that never answers a question, and it was standing between the
           search and the lists. The search has gone too, up onto the line the
           new-task button is on, where the two things you do before you have
           chosen a list sit together — so the lists now start at the top of
           this column, level with the content beside them. -->
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
/* the window a dated selection draws, stretched to hold whatever falls in it */
function planDatedSpan(id, items){
  const w = planSpanWindow(id), T = today();
  const ds = items.map(x => x.m.date).filter(Boolean).concat([w.from || T, w.to]).sort();
  let lo = ds[0], hi = ds[ds.length - 1];
  const pad = Math.max(1, Math.round(Math.abs(daysBetween(lo, hi)) * 0.12));
  return {from: addDays(lo, -pad), to: addDays(hi, pad)};
}
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
/* ---------- keeping the names off each other ----------
   Pins are placed by date, so two dates a few days apart put two names on top
   of one another and neither can be read. The old rule alternated each pin
   with the one before it, which fails the moment three fall together: the
   third goes back to the first row, straight underneath the first name.

   So the names are laid out properly. Each pin is given a lane, and a lane is
   only reused once the last name in it has ended — lane 0 sits just under the
   rail, lane 1 just above it, then further down and further up, so a cluster
   opens outwards from the line rather than stacking on one side. */
const MS_LANES = 6;
/* a name occupies roughly this much of the strip. Measured properly it would
   vary with the name, but the strip's pixel width is not known at render and
   a fixed, slightly generous guess keeps names apart at every width. */
const MS_LABEL_PCT = 13;
function planMilestoneLanes(items, at){
  const ends = new Array(MS_LANES).fill(-Infinity);
  return items.map(x => {
    const left = at(x.m.date || today());
    let lane = ends.findIndex(e => left - e >= MS_LABEL_PCT);
    /* everything is crowded: put it in the lane with the most room and let
       the ellipsis handle what is left */
    if(lane < 0) lane = ends.indexOf(Math.min(...ends));
    ends[lane] = left;
    return {...x, left, lane};
  });
}
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
  const dated = !!sel && sel.kind === 'smart' && PLAN_SPANS.includes(sel.id);
  if(!sel || (sel.kind !== 'list' && sel.kind !== 'folder' && !dated)) return '';
  const items = planMilestonesFor(sel);
  const host = planMilestoneList(sel);
  const add = host ? `<button class="pl-mini" id="plMsAdd" title="a date that matters for this list">＋ milestone</button>` : '';
  /* A milestone could be made and then never got rid of: pressing one filters
     the list, and the only door to the thing itself was a pencil four pixels
     wide that appeared on hover, inside the button that filters. So there is
     a plain way in now, named for what it does. */
  const manage = items.length ? `<button class="pl-mini" id="plMsManage" title="rename, re-date or remove these">manage</button>` : '';
  if(!items.length) return `<div class="pl-ms empty-strip">
    <span class="k mono">Milestones</span>
    <span class="faint">${dated
      ? `Nothing falls ${sel.id === 'today' ? 'today, and nothing is overdue' : sel.id === 'tomorrow' ? 'tomorrow' : 'in the next seven days'}.`
      : `No dates set for this ${sel.kind === 'folder' ? 'folder' : 'list'} yet — a shipping date, a hearing, the day a deposit is due.`}</span>
    ${add}</div>`;
  /* A dated selection draws the period it names, not just the spread of what
     happens to fall in it: seven days should look like seven days even when
     both dates in them are on the Thursday. */
  const {from, to} = dated ? planDatedSpan(sel.id, items) : planMilestoneSpan(items);
  const total = Math.max(1, daysBetween(from, to));
  const at = d => clamp(daysBetween(from, d) / total * 100, 0, 100);
  const T = today();
  /* one tick a month if the run is long, one a week if it is short */
  const weeks = total / 7;
  const step = weeks <= 8 ? 7 : weeks <= 30 ? 14 : 30;
  const ticks = [];
  for(let d = from; d <= to; d = addDays(d, step)) ticks.push(d);
  /* the strip is only as tall as the tiers it actually uses — a list with
     three well-spaced dates should not reserve room for eighteen */
  const laid = planMilestoneLanes(items, at);
  const upT = Math.max(0, ...laid.filter(x => x.lane % 2 === 1).map(x => Math.floor(x.lane / 2)));
  const downT = Math.max(0, ...laid.filter(x => x.lane % 2 === 0).map(x => Math.floor(x.lane / 2)));
  return `<div class="pl-ms">
    <div class="row between" style="align-items:baseline">
      <span class="k mono">Milestones</span>
      <span class="mono faint">${dated
        ? `${items.length} ${sel.id === 'today' ? 'today or overdue' : sel.id === 'tomorrow' ? 'tomorrow' : 'in the next seven days'}`
        : `${items.filter(x => !x.m.done).length} ahead · ${items.length} in all`}</span>
      <span class="row" style="gap:6px">${manage}${add}</span>
    </div>
    <div class="pl-msline" role="list" style="--up:${upT};--down:${downT}">
      <div class="pl-msaxis">${ticks.map(d => `<span class="pl-mstick" style="left:${at(d)}%">${esc(fmtDate(d, 'short'))}</span>`).join('')}</div>
      <div class="pl-msrail"></div>
      <div class="pl-msnow" style="left:${at(T)}%"><span class="mono">today</span></div>
      ${laid.map(({m, list, left, lane}) => { const late = !m.done && m.date && m.date < T;
        /* even lanes hang below the rail, odd ones stand above it */
        const up = lane % 2 === 1, tier = Math.floor(lane / 2);
        /* Pressing a date narrows the list to the work that is for it — the
           question a milestone asks is "what is left before this", and the
           answer is a filter, not a dialog. Pressing it again lets go. The
           pencil is the way into the milestone itself. */
        const on = S._planFilter?.milestone === m.id;
        const prog = typeof planMilestoneProgress === 'function' ? planMilestoneProgress(m.id) : {total:0, done:0};
        return `<button class="pl-mspin${m.done ? ' done' : ''}${late ? ' late' : ''}${up ? ' up' : ''}${on ? ' on' : ''}"
          data-plmsfilter="${m.id}" aria-pressed="${on}"
          style="left:${left}%;--c:${esc(list.color)};--tier:${tier}" role="listitem"
          title="${esc(m.name)} · ${m.date ? esc(fmtDate(m.date, 'med')) + ' · ' + esc(planWhenAway(m.date)) : 'no date'}${
            prog.total ? ` · ${prog.done} of ${prog.total} done` : ' · nothing under it yet'} — ${
            on ? 'press to show everything again' : 'press to see only its work'}${m.note ? ' · ' + esc(m.note) : ''}">
          <i class="pl-msdot"></i><i class="pl-msstem"></i><span class="pl-mslabel">${esc(m.name)}</span>
          ${prog.total ? `<span class="pl-mscount mono">${prog.done}/${prog.total}</span>` : ''}
          ${m.date ? `<span class="pl-msaway mono">${esc(m.done ? fmtDate(m.date, 'short') : planWhenAway(m.date))}</span>` : ''}
          <i class="pl-msedit" data-plms="${m.id}" role="button" tabindex="0" title="open this milestone">✎</i></button>`; }).join('')}
    </div>
  </div>`;
}
function bindPlanMilestones(root, sel){
  const mgb = root.querySelector('#plMsManage');
  if(mgb) mgb.onclick = () => openPlanMilestoneManager(sel);
  const addb = root.querySelector('#plMsAdd');
  if(addb) addb.onclick = () => { const host = planMilestoneList(sel); if(!host) return;
    const m = planAddMilestone(host.id); sound('click'); rerender();
    setTimeout(() => openPlanMilestone(m.id), 60); };
  root.querySelectorAll('[data-plmsfilter]').forEach(b => b.onclick = ev => {
    if(ev.target.closest('[data-plms]')) return;   /* the pencil is its own door */
    const id = b.dataset.plmsfilter;
    const f = Object.assign({}, S._planFilter || {});
    if(f.milestone === id) delete f.milestone; else f.milestone = id;
    S._planFilter = f; sound('click'); rerender(); });
  root.querySelectorAll('[data-plms]').forEach(b => {
    const go = ev => { ev.stopPropagation(); openPlanMilestone(b.dataset.plms); };
    b.onclick = go;
    b.onkeydown = ev => { if(ev.key === 'Enter' || ev.key === ' ') go(ev); };
  });
}
/* Every date this list or folder is running towards, in one place, where each
   one can be renamed, re-dated, marked met or taken away. Deliberately plain:
   this is the room you come to when a milestone is wrong or over, and the
   answer to both is usually one press. */
function openPlanMilestoneManager(sel){
  const draw = () => {
    const items = planMilestonesFor(sel);
    const T = today();
    if(!items.length) return `<div class="empty" style="margin:0">Nothing left. Every date has been taken away.</div>`;
    return `<div class="ms-manage">${items.map(({m, list}) => {
      const late = !m.done && m.date && m.date < T;
      const prog = typeof planMilestoneProgress === 'function' ? planMilestoneProgress(m.id) : {total:0, done:0};
      return `<div class="ms-mrow${m.done ? ' done' : ''}${late ? ' late' : ''}" data-msrow="${esc(m.id)}" style="--c:${esc(list.color)}">
        <button class="task-check sm${m.done ? ' on' : ''}" data-msmet="${esc(m.id)}" role="checkbox"
          aria-checked="${!!m.done}" title="${m.done ? 'not met after all' : 'this one has been met'}">${m.done ? '✓' : ''}</button>
        <input class="inp ms-mname" data-msname="${esc(m.id)}" value="${esc(m.name)}" placeholder="What it is">
        <div class="dp-field ms-mdate"><input class="inp mono" id="msmd-${esc(m.id)}" data-msdate="${esc(m.id)}" data-dp
          value="${esc(m.date || '')}" placeholder="no date">${dpButtonHTML('msmd-' + m.id)}</div>
        <span class="mono faint ms-mwhen">${m.date ? esc(m.done ? fmtDate(m.date, 'short') : planWhenAway(m.date)) : '—'}</span>
        <span class="mono faint ms-mprog" title="${prog.total ? prog.done + ' of ' + prog.total + ' done' : 'nothing points at it yet'}">${
          prog.total ? `${prog.done}/${prog.total}` : '—'}</span>
        <span class="mono faint ms-mlist">${esc(list.name)}</span>
        <button class="btn sm ghost" data-msopen="${esc(m.id)}" title="open it on its own">open</button>
        <button class="del-x inline" data-msdrop="${esc(m.id)}" title="remove this date">×</button>
      </div>`; }).join('')}</div>`;
  };
  const host = planMilestoneList(sel);
  const mo = openModal(`<h2>The dates this is running towards</h2>
    <p class="muted" style="font-size:.85rem">Rename one, move it, mark it met, or take it away. Nothing here touches the tasks under it — a date removed leaves its work exactly where it was.</p>
    <div id="msMgBody">${draw()}</div>
    <div class="row between" style="margin-top:12px">
      ${host ? `<button class="btn sm ghost" id="msMgAdd">＋ another date</button>` : '<span></span>'}
      <button class="btn primary" id="msMgDone">Done</button></div>`, 'wide');

  const refresh = () => { mo.querySelector('#msMgBody').innerHTML = draw(); wire(); rerender(); };
  function wire(){
    /* the calendar is delegated at the document, so a redrawn row needs no
       remounting — only its own handlers back */
    mo.querySelectorAll('[data-msname]').forEach(i => i.onchange = () => {
      const hit = planFindMilestone(i.dataset.msname); if(!hit) return;
      hit.m.name = i.value.trim() || 'A date that matters'; saveNow(); rerender(); });
    mo.querySelectorAll('[data-msdate]').forEach(i => i.onchange = () => {
      const hit = planFindMilestone(i.dataset.msdate); if(!hit) return;
      hit.m.date = i.value.trim(); saveNow(); refresh(); });
    mo.querySelectorAll('[data-msmet]').forEach(b => b.onclick = () => {
      const hit = planFindMilestone(b.dataset.msmet); if(!hit) return;
      hit.m.done = !hit.m.done; saveNow(); sound('click'); refresh(); });
    mo.querySelectorAll('[data-msopen]').forEach(b => b.onclick = () => {
      const id = b.dataset.msopen; mo.remove(); openPlanMilestone(id); });
    /* removal goes through requestDelete like everything else, so it can be
       undone from the same banner as any other deletion */
    mo.querySelectorAll('[data-msdrop]').forEach(b => b.onclick = () => {
      const hit = planFindMilestone(b.dataset.msdrop); if(!hit) return;
      const row = b.closest('.ms-mrow');
      requestDelete({label: hit.m.name || 'Milestone', node: row,
        after: () => { refresh(); }, remove: () => planDeleteMilestone(hit.m.id)}); });
  }
  wire();
  const addb = mo.querySelector('#msMgAdd');
  if(addb) addb.onclick = () => { const h = planMilestoneList(sel); if(!h) return;
    planAddMilestone(h.id); sound('click'); refresh(); };
  mo.querySelector('#msMgDone').onclick = () => { mo.remove(); rerender(); };
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
      <!-- A date is only as real as the work under it, so opening one shows
           that work rather than asking you to go and look for it. -->
      ${(() => {
        const ts = typeof planMilestoneTasks === 'function' ? planMilestoneTasks(m.id) : [];
        const left = ts.filter(t => !t.done);
        return `<div class="field"><label>The work that is for it${
          ts.length ? ` <span class="mono faint" style="text-transform:none;letter-spacing:0">· ${ts.length - left.length} of ${ts.length} done</span>` : ''}</label>
          ${ts.length ? `<div class="ms-tasks">${planSortTasks(ts, 'dueDate').map(t =>
            `<div class="ms-task${t.done ? ' done' : ''}">
              <button class="task-check sm${t.done ? ' on' : ''}" data-mstick="${esc(t.id)}" role="checkbox"
                aria-checked="${!!t.done}" title="${t.done ? 'not done after all' : 'mark done'}">${t.done ? '✓' : ''}</button>
              <span class="ms-task-t">${esc(t.text)}</span>
              <span class="mono faint">${t.day ? esc(fmtDate(t.day, 'short')) : 'no date'}</span>
            </div>`).join('')}</div>`
          : `<div class="empty" style="margin:0">Nothing points at this date yet. Open a task and name this milestone on it, or press the date on the strip to work with only its tasks.</div>`}
          ${ts.length ? `<button class="btn sm ghost" id="msOnly" style="margin-top:8px">show only its work →</button>` : ''}
        </div>`; })()}
      <label class="toggle ${m.done ? 'on' : ''}" id="msDone"><span class="sw"></span><span>this one has been met</span></label>
      <div class="row between"><button class="btn sm ghost danger" id="msDel">remove</button>
        <button class="btn primary" id="msSave">Save</button></div>
    </div>`, 'narrow');
  let done = !!m.done;
  mo.querySelector('#msDone').onclick = function(){ done = !done; this.classList.toggle('on', done); };
  /* ticking a task off from here is the same act as ticking it in the list */
  mo.querySelectorAll('[data-mstick]').forEach(b => b.onclick = () => {
    const t = planTaskById(b.dataset.mstick); if(!t) return;
    planSetDone(t, !t.done); mo.remove(); rerender(); setTimeout(() => openPlanMilestone(id), 60); });
  const only = mo.querySelector('#msOnly');
  if(only) only.onclick = () => {
    S._planFilter = Object.assign({}, S._planFilter || {}, {milestone: m.id});
    mo.remove(); sound('click'); rerender(); };
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
  if(f.milestone){ const hit = planFindMilestone(f.milestone);
    chips.push(`<span class="pf-chip on" data-pfclear="milestone">◆ ${esc(hit ? hit.m.name : 'a milestone')}<i>×</i></span>`); }
  if(f.tags?.length) chips.push(`<span class="pf-chip on" data-pfclear="tags">${f.tags.map(x => '#' + esc(x)).join(' ')}<i>×</i></span>`);
  if(f.priorities?.length) chips.push(`<span class="pf-chip on" data-pfclear="priorities">${f.priorities.map(n => planPriority(n).name).join(', ')}<i>×</i></span>`);
  if(f.dateRange) chips.push(`<span class="pf-chip on" data-pfclear="dateRange">${esc(RANGE_SAID[f.dateRange] || String(f.dateRange))}<i>×</i></span>`);
  if(f.completion && f.completion !== 'any') chips.push(`<span class="pf-chip on" data-pfclear="completion">${f.completion === 'active' ? 'not done' : 'done'}<i>×</i></span>`);
  if(f.hasSubtasks === true || f.hasSubtasks === false) chips.push(`<span class="pf-chip on" data-pfclear="hasSubtasks">${f.hasSubtasks ? 'has steps' : 'no steps'}<i>×</i></span>`);
  if(f.search) chips.push(`<span class="pf-chip on" data-pfclear="search">“${esc(f.search)}”<i>×</i></span>`);
  const special = sel.kind === 'smart' && sel.id === 'stats';
  return `<div class="pl-header">
    <!-- Writing a task down and looking for one are the two things you do
         before you have decided what you are looking at, so they share the top
         line, and the sidebar starts level with it rather than a search box
         lower down.

         Adding used to be a button that opened the whole task panel — a form
         with a dozen fields for a sentence you already know how to write. It is
         a line now: type it, press return, it is in the Inbox. The parse is the
         same one the quadrants and the list use, so "friday 2pm !high ~1h"
         still means what it means, and the Inbox is beside it because that is
         where the line puts things and where you go to deal with them. -->
    <div class="pl-top">
      <div class="pq-wrap pl-add">
        <input class="inp pq-input pl-add-input" data-pqadd="${esc(JSON.stringify({listId:'inbox', fixed:true}))}"
          placeholder="＋ new task — it waits in the Inbox">
        <div class="pq-preview"></div>
      </div>
      ${(() => { const ib = planList('inbox'), n = planListCount('inbox');
        return `<button class="pl-inbox${sel.kind === 'list' && sel.id === 'inbox' ? ' on' : ''}"
          data-plsel="list:inbox" title="everything written down and not yet placed${n ? ` · ${n} open` : ''}">
          <span class="pl-dot" style="background:${esc(ib ? ib.color : '#a89f94')}"></span>Inbox
          ${n ? `<span class="pl-n mono">${n}</span>` : ''}</button>`; })()}
      <input class="inp mono pl-search" id="plSearch" placeholder="search tasks…"
        value="${esc(S._planQ || '')}">
    </div>
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
    ${taskEstHTML(t.id, t)}
    <span class="pt-meta">
      ${taskIsInProgress(t.id) && !t.done ? `<span class="pt-wip mono" title="${fmtHM(taskFocusMinutes(t.id))} sat with so far">in progress</span>` : ''}
      ${sub ? `<button class="pt-sub mono" data-tsubs="${t.id}" title="${sub.done} of ${sub.total} steps done">${sub.done}/${sub.total}</button>` : ''}
      ${t.recurrence ? `<span class="pt-rep" title="repeats ${esc(t.recurrence.pattern)}">↻</span>` : ''}
      <!-- the length now lives on the chip beside the name, which is also the way into the timer -->
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
  /* No contextual Add button here. The top line is the add: one field, one
     return, into the Inbox. A button that opened a panel of empty fields was
     the long way round to the same sentence, and having both would have meant
     two answers to the same question sitting next to each other. */

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
    : v === 'eisenhower' ? planMatrixHTML(tasks, sel)
    : planListViewHTML(sel, tasks);

  const room = planRoom();
  if(room === 'habits' || room === 'stats'){
    root.innerHTML = `<div class="page plan-page">
      ${planRoomsHTML()}
      <div class="pl-habits-room${room === 'stats' ? ' pl-stats-room' : ''}">${room === 'habits' ? habRoomHTML() : planStatsHTML()}</div>
    </div>`;
    bindPlanRooms(root);
    if(room === 'habits') bindHabRoom(root);
    return;
  }

  root.innerHTML = `<div class="page plan-page">
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
