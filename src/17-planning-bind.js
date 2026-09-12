/* ============================================================
   PLANNING — everything the page does when it is touched.
   ============================================================ */

function planTaskById(id){ return (S.tasks || []).find(t => t.id === id) || null; }
function planRedraw(){ rerender(); }

/* completing a task is a small ceremony: the box fills, the line draws itself
   through the title, and only then does the row leave */
function planCompleteRow(row, t, done){
  const rolled = planSetDone(t, done);
  sound(done ? 'success' : 'click');
  if(!row){ planRedraw(); return; }
  row.classList.toggle('done', done);
  if(done){
    row.classList.add('leaving');
    setTimeout(() => { planRedraw(); if(rolled) toast(`Repeats — next one ${fmtDate(rolled.day, 'med')}.`); }, 420);
  } else planRedraw();
  if(done && typeof planOfferReflection === 'function') planOfferReflection(t);
}

function bindPlanning(root, sel, tasks){
  const p = planState();
  /* every task row and card carries its own timer, wherever it is drawn */
  bindTaskTimers(root);

  /* --- sidebar --- */
  $$('[data-plsel]', root).forEach(b => b.onclick = () => {
    const [k, ...rest] = b.dataset.plsel.split(':'); planSetSel(k, rest.join(':')); });
  $$('[data-plfold]', root).forEach(b => b.onclick = () => {
    const f = p.folders.find(x => x.id === b.dataset.plfold); if(!f) return;
    f.isCollapsed = !f.isCollapsed; saveNow(); rerender(); });
  const collapse = $('#plCollapse'); if(collapse) collapse.onclick = () => {
    p.prefs.sidebarCollapsed = !p.prefs.sidebarCollapsed; saveNow(); rerender(); };
  const nl = $('#plNewList'); if(nl) nl.onclick = () => openPlanListModal(null);
  /* asked from inside a folder, so the folder comes pre-chosen */
  $$('[data-plnewin]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation(); openPlanListModal(null, {folderId: b.dataset.plnewin});
  });
  const nf = $('#plNewFolder'); if(nf) nf.onclick = () => {
    const f = planNewFolder('New folder'); saveNow(); rerender();
    setTimeout(() => openPlanFolderRename(f.id), 60); };
  const nfil = $('#plNewFilter'); if(nfil) nfil.onclick = () => openPlanFilterModal(null);
  $$('[data-plfolder] .pl-fhead', root).forEach(h => h.addEventListener('contextmenu', ev => {
    ev.preventDefault(); openPlanFolderRename(h.closest('[data-plfolder]').dataset.plfolder); }));
  /* the span on the one dated row */
  $$('[data-plspan]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation(); sound('click'); planSetSpan(b.dataset.plspan); });
  const sf = $('#plSideFilter'); if(sf) sf.onclick = () => openPlanQuickFilter();

  /* ---- dragging lists and folders into an order ----
     A list dropped on a list takes its place in the order (and its folder). A
     list dropped on a folder's own row joins that folder, which is what that
     drop already meant. A folder dropped on a folder reorders the folders. */
  const clearDrop = () => $$('.pl-item.drop-above, .pl-item.drop-below, .pl-frow.drop-above, .pl-frow.drop-below', root)
    .forEach(x => x.classList.remove('drop-above', 'drop-below'));
  const edge = (el, ev) => { const r = el.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; };

  $$('[data-pldrag]', root).forEach(b => {
    b.addEventListener('dragstart', ev => { ev.stopPropagation();
      window._plListDrag = b.dataset.pldrag; window._plFolderDrag = null;
      ev.dataTransfer.effectAllowed = 'move'; });
    b.addEventListener('dragend', () => { window._plListDrag = null; clearDrop(); });
    b.addEventListener('contextmenu', ev => { ev.preventDefault(); openPlanListModal(b.dataset.pldrag); });
    b.addEventListener('dragover', ev => {
      if(!window._plListDrag || window._plListDrag === b.dataset.pldrag) return;
      ev.preventDefault(); ev.stopPropagation();
      clearDrop(); b.classList.add(edge(b, ev) ? 'drop-above' : 'drop-below');
    });
    b.addEventListener('drop', ev => {
      const id = window._plListDrag;
      if(!id || id === b.dataset.pldrag) return;
      ev.preventDefault(); ev.stopPropagation();
      const before = b.classList.contains('drop-above');
      clearDrop(); window._plListDrag = null;
      if(planReorderLists(id, b.dataset.pldrag, before)){ sound('click'); rerender(); }
    });
  });

  $$('[data-plfdrag]', root).forEach(fr => {
    fr.addEventListener('dragstart', ev => { ev.stopPropagation();
      window._plFolderDrag = fr.dataset.plfdrag; window._plListDrag = null;
      ev.dataTransfer.effectAllowed = 'move'; });
    fr.addEventListener('dragend', () => { window._plFolderDrag = null; clearDrop(); });
    fr.addEventListener('dragover', ev => {
      const f = window._plFolderDrag;
      if(!f || f === fr.dataset.plfdrag) return;
      ev.preventDefault(); ev.stopPropagation();
      clearDrop(); fr.classList.add(edge(fr, ev) ? 'drop-above' : 'drop-below');
    });
    fr.addEventListener('drop', ev => {
      const f = window._plFolderDrag;
      if(!f || f === fr.dataset.plfdrag) return;
      ev.preventDefault(); ev.stopPropagation();
      const before = fr.classList.contains('drop-above');
      clearDrop(); window._plFolderDrag = null;
      if(planReorderFolders(f, fr.dataset.plfdrag, before)){ sound('click'); rerender(); }
    });
  });

  /* a list dropped anywhere else inside a folder still just joins it */
  $$('[data-plfolder]', root).forEach(fd => {
    fd.addEventListener('dragover', ev => { if(window._plListDrag){ ev.preventDefault(); fd.classList.add('over'); } });
    fd.addEventListener('dragleave', () => fd.classList.remove('over'));
    fd.addEventListener('drop', ev => { fd.classList.remove('over');
      const l = planList(window._plListDrag); window._plListDrag = null; if(!l) return;
      ev.preventDefault();
      l.folderId = fd.dataset.plfolder; saveNow(); sound('click'); rerender(); });
  });

  const search = $('#plSearch');
  if(search) search.oninput = debounce(() => { S._planQ = search.value.trim(); rerender();
    requestAnimationFrame(() => { const s = $('#plSearch'); if(s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }); }, 280);

  /* --- header --- */
  $$('[data-plview]', root).forEach(b => b.onclick = () => planSetView(b.dataset.plview));
  const sort = $('#plSort'); if(sort) sort.onchange = () => { p.prefs.sort = sort.value; saveNow(); rerender(); };
  const showDone = $('#plShowDone'); if(showDone) showDone.onclick = () => { p.prefs.showCompleted = !p.prefs.showCompleted; saveNow(); rerender(); };
  $$('[data-pfclear]', root).forEach(c => c.onclick = () => {
    S._planFilter = Object.assign({}, S._planFilter); delete S._planFilter[c.dataset.pfclear]; rerender(); });

  /* --- rows --- */
  /* the same steps, the same handlers, as on Today — one implementation, so
     the two rooms cannot drift into behaving differently */
  bindSubtasks(root, planRedraw);
  /* The pencil renames the name beside it; the name itself opens the task,
     which the row's own click handler already does. There is deliberately no
     double-click-to-rename: the single click that opens would always fire
     first, and the only way to let both live is to delay every open by a
     quarter of a second waiting for a second click that almost never comes. */
  $$('[data-tedit]', root).forEach(n => n.onclick = ev => {
    ev.stopPropagation();
    const t = planTaskById(n.dataset.tedit); if(!t) return;
    const label = n.parentElement.querySelector('.pt-text, .pk-text') || n;
    inlineTaskEdit(label, t.text || '', v => { t.text = v; t.updatedAt = new Date().toISOString(); }, planRedraw);
  });

  $$('[data-ptdone]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const t = planTaskById(b.dataset.ptdone); if(!t) return;
    planCompleteRow(b.closest('.pt-row, .pk-card'), t, !t.done); });
  $$('[data-ptdel]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const t = planTaskById(b.dataset.ptdel); if(!t) return;
    requestDelete({label:t.text || 'Task', node:b.closest('.pt-row, .pk-card'),
      remove: () => spliceOut(S.tasks, x => x.id === t.id), after: planRedraw}); });
  $$('[data-ptrow], [data-ptcard]', root).forEach(row => {
    const id = row.dataset.ptrow || row.dataset.ptcard;
    row.addEventListener('click', ev => {
      if(ev.target.closest('button, a, input')) return;
      if(ev.shiftKey || ev.metaKey || ev.ctrlKey){ planTogglePick(id); return; }
      openPlanTask(id);
    });
    row.addEventListener('contextmenu', ev => { ev.preventDefault(); openPlanRowMenu(ev, id); });
    row.addEventListener('dragstart', ev => { window._plTaskDrag = id; row.classList.add('dragging');
      ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', id); } catch(e){} });
    row.addEventListener('dragend', () => { row.classList.remove('dragging'); window._plTaskDrag = null; });
  });
  /* the timeline's bar already means "move the dates", so there the name is
     the handle for rearranging the rows */
  $$('[data-ptgrip]', root).forEach(g => {
    const id = g.dataset.ptgrip;
    g.addEventListener('dragstart', ev => { window._plTaskDrag = id;
      g.closest('[data-ptunit]')?.classList.add('dragging');
      ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', id); } catch(e){} });
    g.addEventListener('dragend', () => { g.closest('[data-ptunit]')?.classList.remove('dragging');
      window._plTaskDrag = null; });
  });
  bindPlanTaskReorder(root, planRedraw);

  /* --- sections --- */
  $$('[data-plsectog]', root).forEach(b => b.onclick = () => {
    const l = planList(sel.id); const sc = l?.sections.find(s => s.id === b.dataset.plsectog);
    if(!sc) return; sc.isCollapsed = !sc.isCollapsed; saveNow(); rerender(); });
  $$('[data-plsecdel]', root).forEach(b => b.onclick = () => {
    const l = planList(sel.id); const sc = l?.sections.find(s => s.id === b.dataset.plsecdel); if(!sc) return;
    requestDelete({label:sc.name || 'Section', node:b.closest('.pt-section'), after:planRedraw,
      remove: () => { const back = spliceOut(l.sections, x => x.id === sc.id);
        const moved = (S.tasks || []).filter(t => t.sectionId === sc.id);
        moved.forEach(t => t.sectionId = null);
        return () => { back(); moved.forEach(t => t.sectionId = sc.id); }; }}); });
  const ns = $('#plNewSection'); if(ns) ns.onclick = () => {
    const l = planList(sel.id); if(!l) return;
    const name = prompt('Name this section'); if(!name || !name.trim()) return;
    l.sections.push({id:uid(), name:name.trim(), sortOrder:l.sections.length, isCollapsed:false});
    saveNow(); sound('click'); rerender(); };
  /* a row dropped on a section header joins that section */
  $$('[data-plsec]', root).forEach(sc => {
    sc.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); sc.classList.add('over'); } });
    sc.addEventListener('dragleave', () => sc.classList.remove('over'));
    sc.addEventListener('drop', ev => { ev.preventDefault(); sc.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      t.sectionId = sc.dataset.plsec; t.updatedAt = new Date().toISOString(); saveNow(); sound('click'); rerender(); });
  });
  /* dropping a task on a list in the sidebar moves it there */
  $$('[data-plsel^="list:"]', root).forEach(b => {
    b.addEventListener('dragover', ev => { if(window._plTaskDrag){ ev.preventDefault(); b.classList.add('over'); } });
    b.addEventListener('dragleave', () => b.classList.remove('over'));
    b.addEventListener('drop', ev => { ev.preventDefault(); b.classList.remove('over');
      const t = planTaskById(window._plTaskDrag); window._plTaskDrag = null; if(!t) return;
      t.listId = b.dataset.plsel.split(':')[1]; t.sectionId = null; saveNow(); sound('click'); rerender(); });
  });

  /* --- quick add, with the parse shown before it is committed --- */
  $$('[data-pqadd]', root).forEach(inp => {
    let ctx = {}; try { ctx = JSON.parse(inp.dataset.pqadd); } catch(e){}
    const prev = inp.parentElement.querySelector('.pq-preview');
    const draw = () => { const v = inp.value.trim();
      prev.innerHTML = v ? quickParsePreviewHTML(parseQuickTask(v)) : ''; };
    inp.addEventListener('input', draw);
    inp.addEventListener('keydown', ev => {
      if(ev.key !== 'Enter') return; ev.preventDefault();
      const v = inp.value.trim(); if(!v) return;
      const merged = Object.assign({}, ctx);
      if(sel.kind === 'list') merged.listId = merged.listId || sel.id;
      if(sel.kind === 'tag')  merged.tag = sel.id;
      if(sel.kind === 'smart' && sel.id === 'today')    merged.day = today();
      if(sel.kind === 'smart' && sel.id === 'tomorrow') merged.day = addDays(today(), 1);
      const t = commitQuickTask(v, merged);
      if(!t) return;
      if(merged.tag && !t.tags.includes(merged.tag)){ t.tags.push(merged.tag); planEnsureTag(merged.tag); saveNow(); }
      sound('success');
      const mark = inp.dataset.pqadd;
      rerender();
      /* the redraw replaces this input, so the caret goes to its replacement */
      requestAnimationFrame(() => { const next = document.querySelector(`[data-pqadd='${CSS.escape(mark)}']`);
        if(next){ next.value = ''; next.focus(); } });
    });
  });

  if(typeof bindPlanViews === 'function') bindPlanViews(root, sel, tasks);
  if(typeof bindHabRoom === 'function') bindHabRoom(root);
  if(typeof bindPlanBatch === 'function') bindPlanBatch(root);
  if(typeof bindPlanReminderBanner === 'function') bindPlanReminderBanner(root);
}

/* ---------- multi-select ---------- */
function planTogglePick(id){
  S._planPick = S._planPick || new Set();
  S._planPick.has(id) ? S._planPick.delete(id) : S._planPick.add(id);
  if(!S._planPick.size) S._planPick = null;
  rerender();
}
function planBatchBarHTML(){
  const n = S._planPick?.size || 0; if(!n) return '';
  return `<div class="pl-batch"><span class="mono">${n} selected</span>
    <button class="btn sm" data-pb="done">complete</button>
    <button class="btn sm ghost" data-pb="move">move…</button>
    <button class="btn sm ghost" data-pb="prio">priority…</button>
    <button class="btn sm ghost" data-pb="day">due date…</button>
    <button class="btn sm ghost" data-pb="tag">tag…</button>
    <button class="btn sm ghost" data-pb="quad">matrix…</button>
    <button class="btn sm ghost danger" data-pb="del">delete</button>
    <button class="pl-mini" data-pb="clear" title="clear selection">×</button></div>`;
}
function bindPlanBatch(root){
  const picked = () => [...(S._planPick || [])].map(planTaskById).filter(Boolean);
  $$('[data-pb]', root).forEach(b => b.onclick = () => {
    const ts = picked(); const k = b.dataset.pb;
    if(k === 'clear'){ S._planPick = null; rerender(); return; }
    if(!ts.length) return;
    if(k === 'done'){ ts.forEach(t => planSetDone(t, true)); S._planPick = null; sound('success'); rerender(); return; }
    if(k === 'del'){ requestDelete({label:`${ts.length} tasks`, after:planRedraw,
      remove: () => { const ids = new Set(ts.map(t => t.id)); const kept = S.tasks.filter(t => !ids.has(t.id));
        const gone = S.tasks.filter(t => ids.has(t.id)); S.tasks = kept; S._planPick = null;
        return () => { S.tasks.push(...gone); }; }}); return; }
    if(k === 'move'){ planChoose('Move to list', planLists().map(l => [l.id, l.name]),
      v => { ts.forEach(t => { t.listId = v; t.sectionId = null; }); done(); }); return; }
    if(k === 'prio'){ planChoose('Set priority', PLAN_PRIORITY.map(x => [String(x.n), x.name]),
      v => { ts.forEach(t => t.priority = +v); done(); }); return; }
    if(k === 'quad'){ planChoose('Move to quadrant', [...PLAN_QUADRANTS.map(q => [String(q.n), `${q.name} — ${q.act}`]), ['0','Unassigned']],
      v => { ts.forEach(t => t.quadrant = +v || null); done(); }); return; }
    if(k === 'tag'){ planChoose('Add tag', planState().tags.map(t => [t.name, t.name]),
      v => { planEnsureTag(v); ts.forEach(t => { if(!t.tags.includes(v)) t.tags.push(v); }); done(); }, true); return; }
    if(k === 'day'){ planChoose('Due date', [['', 'No date'], [today(), 'Today'], [addDays(today(),1), 'Tomorrow'],
      [addDays(today(),7), 'In a week']], v => { ts.forEach(t => { t.day = v; planSyncReminders(t); }); done(); }); return; }
    function done(){ S._planPick = null; saveNow(); sound('click'); rerender(); }
  });
}
/* one small chooser, used by every batch action */
function planChoose(title, opts, fn, allowNew){
  const m = openModal(`<h2>${esc(title)}</h2>
    ${allowNew ? `<input class="inp" id="pcNew" placeholder="${esc(allowNew === true ? 'or write a new one' : allowNew)}"><div class="row" style="justify-content:flex-end;margin:8px 0"><button class="btn sm" id="pcAdd">use it</button></div>` : ''}
    <div class="stack" style="gap:6px;max-height:50vh;overflow:auto">
      ${opts.map(([v, n]) => `<button class="choice" data-pc="${esc(v)}"><span><b>${esc(n)}</b></span></button>`).join('')
        || '<div class="empty">Nothing to choose from yet.</div>'}</div>`, 'narrow');
  m.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { m.remove(); fn(b.dataset.pc); });
  const add = m.querySelector('#pcAdd');
  if(add) add.onclick = () => { const v = m.querySelector('#pcNew').value.trim(); if(!v) return; m.remove(); fn(v); };
}

/* ---------- right-click on a row ---------- */
function openPlanRowMenu(ev, id){
  const t = planTaskById(id); if(!t) return;
  const m = openModal(`<h2>${esc(t.text || 'Task')}</h2><div class="stack" style="gap:6px">
    <button class="choice" data-rm="open"><span class="ico">▤</span><span><b>Open</b></span></button>
    <button class="choice" data-rm="today"><span class="ico">◉</span><span><b>Due today</b></span></button>
    <button class="choice" data-rm="tomorrow"><span class="ico">◐</span><span><b>Due tomorrow</b></span></button>
    <button class="choice" data-rm="week"><span class="ico">◇</span><span><b>Due in a week</b></span></button>
    <button class="choice" data-rm="nodate"><span class="ico">○</span><span><b>No date</b></span></button>
    <button class="choice" data-rm="prio"><span class="ico">◆</span><span><b>Priority…</b></span></button>
    <button class="choice" data-rm="move"><span class="ico">▸</span><span><b>Move to list…</b></span></button>
    <button class="choice" data-rm="dup"><span class="ico">⧉</span><span><b>Duplicate</b></span></button>
    <button class="choice" data-rm="del"><span class="ico">×</span><span><b>Delete</b></span></button>
  </div>`, 'narrow');
  m.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    const k = b.dataset.rm; m.remove();
    if(k === 'open') return openPlanTask(id);
    if(k === 'prio') return planChoose('Priority', PLAN_PRIORITY.map(x => [String(x.n), x.name]),
      v => { t.priority = +v; saveNow(); rerender(); });
    if(k === 'move') return planChoose('Move to list', planLists().map(l => [l.id, l.name]),
      v => { t.listId = v; t.sectionId = null; saveNow(); rerender(); });
    if(k === 'del') return requestDelete({label:t.text || 'Task', after:planRedraw,
      remove: () => spliceOut(S.tasks, x => x.id === t.id)});
    if(k === 'dup'){ const c = newPlanTask(t.text + ' (copy)', t.day, JSON.parse(JSON.stringify(
      {listId:t.listId, sectionId:t.sectionId, priority:t.priority, dueTime:t.dueTime, duration:t.duration,
       desc:t.desc, tags:t.tags, subtasks:t.subtasks, quadrant:t.quadrant, kanbanColumn:t.kanbanColumn})));
      c.subtasks.forEach(s => { s.id = uid(); s.isCompleted = false; }); S.tasks.push(c); }
    else t.day = k === 'today' ? today() : k === 'tomorrow' ? addDays(today(), 1)
      : k === 'week' ? addDays(today(), 7) : '';
    if(k !== 'dup') planSyncReminders(t);
    saveNow(); sound('click'); rerender();
  });
}

/* ---------- list / folder / filter editing ---------- */
function openPlanListModal(id, {folderId = null} = {}){
  const p = planState(), l = id ? planList(id) : null;
  /* a new list asked for from inside a folder already knows its folder */
  const preFolder = l ? l.folderId : folderId;
  const m = openModal(`<h2>${l ? 'Edit list' : 'New list'}</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp" id="plnName" value="${esc(l?.name || '')}" placeholder="Work, Health, Japan…"></div>
    <div class="field"><label>Colour</label><div class="pl-swatches" id="plnColors">
      ${PLAN_COLORS.map(c => `<button class="pl-sw${(l?.color || PLAN_COLORS[0]) === c ? ' on' : ''}" data-plc="${c}" style="background:${c}"></button>`).join('')}</div></div>
    <div class="field"><label>Folder</label><select class="sel" id="plnFolder">
      <option value="">— none —</option>${p.folders.map(f => `<option value="${f.id}" ${preFolder === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Opens as</label><select class="sel" id="plnView">
      ${PLAN_VIEWS.map(v => `<option value="${v.id}" ${(l?.defaultView || PLAN_VIEW_DEFAULT) === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
    <div class="row between" style="margin-top:8px">
      ${l && !l.isDefault ? `<button class="btn sm ghost danger" id="plnDel">delete list</button>` : '<span></span>'}
      <button class="btn primary" id="plnSave">${l ? 'Save' : 'Create'}</button></div></div>`, 'narrow');
  let color = l?.color || PLAN_COLORS[p.lists.length % PLAN_COLORS.length];
  m.querySelectorAll('[data-plc]').forEach(b => b.onclick = () => { color = b.dataset.plc;
    m.querySelectorAll('[data-plc]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#plnSave').onclick = () => {
    const name = m.querySelector('#plnName').value.trim() || 'New list';
    const folderId = m.querySelector('#plnFolder').value || null;
    const view = m.querySelector('#plnView').value;
    if(l){ l.name = name; l.color = color; l.folderId = folderId; l.defaultView = view; }
    else { const nl = planNewList(name, {folderId, color}); nl.defaultView = view; S._planSel = {kind:'list', id:nl.id}; }
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const del = m.querySelector('#plnDel');
  if(del) del.onclick = () => { m.remove();
    requestDelete({label:l.name, after:planRedraw, remove: () => {
      const moved = (S.tasks || []).filter(t => t.listId === l.id);
      moved.forEach(t => t.listId = 'inbox');
      const back = spliceOut(p.lists, x => x.id === l.id);
      if(planSel().id === l.id) S._planSel = {kind:'smart', id:'today'};
      return () => { back(); moved.forEach(t => t.listId = l.id); }; }}); };
}
function openPlanFolderRename(id){
  const f = planState().folders.find(x => x.id === id); if(!f) return;
  const m = openModal(`<h2>Folder</h2><div class="stack">
    <div class="field"><label>Name</label><input class="inp" id="pfName" value="${esc(f.name)}"></div>
    <div class="row between"><button class="btn sm ghost danger" id="pfDel">delete folder</button>
      <button class="btn primary" id="pfSave">Save</button></div></div>`, 'narrow');
  m.querySelector('#pfSave').onclick = () => { f.name = m.querySelector('#pfName').value.trim() || 'Folder';
    saveNow(); m.remove(); rerender(); };
  m.querySelector('#pfDel').onclick = () => { m.remove();
    requestDelete({label:f.name, after:planRedraw, remove: () => {
      const kids = planLists().filter(l => l.folderId === f.id); kids.forEach(l => l.folderId = null);
      const back = spliceOut(planState().folders, x => x.id === f.id);
      return () => { back(); kids.forEach(l => l.folderId = f.id); }; }}); };
}
/* The one filter. It used to be a cut-down thing — one priority, one tag, two
   date words — sitting beside a much more capable builder for saved filters,
   which meant the quick way to narrow a list could not ask most of the
   questions worth asking. This asks all of them, in the shape the saved
   filters already used, and every choice is a multiple: three lists, two tags
   and high priority is a reasonable question and used not to be expressible.

   Nothing is applied until Apply, so a filter with several parts is set in one
   go rather than redrawing the page after each chip. */
function openPlanQuickFilter(){
  const p = planState();
  const cur = Object.assign({lists:[], tags:[], priorities:[], dateRange:'', completion:'active',
    hasSubtasks:null, search:''}, S._planFilter || {});
  const f = {lists:[...(cur.lists||[])], tags:[...(cur.tags||[])], priorities:[...(cur.priorities||[])],
    dateRange: cur.dateRange || '', completion: cur.completion || 'active',
    hasSubtasks: cur.hasSubtasks == null ? null : cur.hasSubtasks, search: cur.search || ''};
  const m = openModal(`<h2>Filter</h2>
    <p class="muted" style="font-size:.85rem">Narrows whatever is open — a list, a folder, a span, all of it. Pick as many as you like in each row.</p>
    <div class="stack">
      <div class="field"><label>Text</label>
        <input class="inp" id="pfSearch" value="${esc(f.search)}" placeholder="words in the name or the note"></div>
      <div class="field"><label>Lists</label><div class="chip-row">${planLists().map(l =>
        `<button type="button" class="chip click${f.lists.includes(l.id) ? ' on' : ''}" data-fl="${l.id}" style="--c:${l.color}">${esc(l.name)}</button>`).join('')}</div></div>
      <div class="field"><label>Tags</label><div class="chip-row">${p.tags.map(t =>
        `<button type="button" class="chip click${f.tags.includes(t.name) ? ' on' : ''}" data-ft="${esc(t.name)}" style="--c:${t.color}">${esc(t.name)}</button>`).join('') || '<span class="faint">no tags yet</span>'}</div></div>
      <div class="field"><label>Priority</label><div class="chip-row">${PLAN_PRIORITY.map(x =>
        `<button type="button" class="chip click${f.priorities.includes(x.n) ? ' on' : ''}" data-fp="${x.n}">${esc(x.name)}</button>`).join('')}</div></div>
      <div class="field"><label>When</label><div class="chip-row">${
        [['','any time'],['overdue','overdue'],['today','today'],['tomorrow','tomorrow'],['next7days','next 7 days'],['noDate','no date']]
        .map(([v, n]) => `<button type="button" class="chip click${f.dateRange === v ? ' on' : ''}" data-fr="${v}">${n}</button>`).join('')}</div></div>
      <div class="field"><label>Done or not</label><div class="chip-row">${
        [['active','not done'],['completed','done'],['any','either']]
        .map(([v, n]) => `<button type="button" class="chip click${f.completion === v ? ' on' : ''}" data-fc="${v}">${n}</button>`).join('')}</div></div>
      <div class="field"><label>Steps</label><div class="chip-row">${
        [['','either'],['yes','has steps'],['no','no steps']]
        .map(([v, n]) => `<button type="button" class="chip click${(v === '' ? f.hasSubtasks == null : (v === 'yes') === f.hasSubtasks) ? ' on' : ''}" data-fs="${v}">${n}</button>`).join('')}</div></div>
      <div class="row between" style="margin-top:6px">
        <button class="btn sm ghost" id="pfClear">clear all</button>
        <button class="btn primary" id="pfApply">Apply</button></div>
    </div>`, 'narrow');

  const one = (sel, set) => m.querySelectorAll(sel).forEach(b => b.onclick = () => {
    m.querySelectorAll(sel).forEach(x => x.classList.toggle('on', x === b)); set(b); });
  const many = (sel, arr, read) => m.querySelectorAll(sel).forEach(b => b.onclick = () => {
    const v = read(b), i = arr.indexOf(v);
    i < 0 ? arr.push(v) : arr.splice(i, 1);
    b.classList.toggle('on', i < 0); });
  many('[data-fl]', f.lists, b => b.dataset.fl);
  many('[data-ft]', f.tags,  b => b.dataset.ft);
  many('[data-fp]', f.priorities, b => +b.dataset.fp);
  one('[data-fr]', b => { f.dateRange = b.dataset.fr; });
  one('[data-fc]', b => { f.completion = b.dataset.fc; });
  one('[data-fs]', b => { f.hasSubtasks = b.dataset.fs === '' ? null : b.dataset.fs === 'yes'; });
  m.querySelector('#pfApply').onclick = () => {
    f.search = m.querySelector('#pfSearch').value.trim();
    S._planFilter = f; m.remove(); sound('click'); rerender();
  };
  m.querySelector('#pfClear').onclick = () => { S._planFilter = {}; m.remove(); rerender(); };
}
function openPlanFilterModal(id){
  const p = planState(), sl = id ? p.smartLists.find(x => x.id === id) : null;
  const f = sl?.filters || {lists:[], tags:[], priorities:[], dateRange:null, completion:'active', hasSubtasks:null, search:''};
  const m = openModal(`<h2>${sl ? 'Edit filter' : 'New saved filter'}</h2>
    <p class="muted" style="font-size:.85rem">A filter is a question you keep asking. It stays in the sidebar and answers itself as things change.</p>
    <div class="stack">
      <div class="field"><label>Name</label><input class="inp" id="sfName" value="${esc(sl?.name || '')}" placeholder="This week, high only…"></div>
      <div class="field"><label>Lists</label><div class="chip-row">${planLists().map(l =>
        `<button class="chip click${f.lists?.includes(l.id) ? ' on' : ''}" data-sfl="${l.id}" style="--c:${l.color}">${esc(l.name)}</button>`).join('')}</div></div>
      <div class="field"><label>Tags</label><div class="chip-row">${p.tags.map(t =>
        `<button class="chip click${f.tags?.includes(t.name) ? ' on' : ''}" data-sft="${esc(t.name)}" style="--c:${t.color}">${esc(t.name)}</button>`).join('') || '<span class="faint">no tags yet</span>'}</div></div>
      <div class="field"><label>Priority</label><div class="chip-row">${PLAN_PRIORITY.map(x =>
        `<button class="chip click${f.priorities?.includes(x.n) ? ' on' : ''}" data-sfp="${x.n}">${esc(x.name)}</button>`).join('')}</div></div>
      <div class="field"><label>When</label><select class="sel" id="sfRange">
        ${[['','any time'],['overdue','overdue'],['today','today'],['tomorrow','tomorrow'],['next7days','next 7 days'],['noDate','no date']]
          .map(([v, n]) => `<option value="${v}" ${f.dateRange === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Show</label><select class="sel" id="sfDone">
        ${[['active','unfinished'],['completed','finished'],['all','both']].map(([v, n]) =>
          `<option value="${v}" ${f.completion === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="row between" style="margin-top:8px">
        ${sl ? '<button class="btn sm ghost danger" id="sfDel">delete</button>' : '<span></span>'}
        <button class="btn primary" id="sfSave">${sl ? 'Save' : 'Create'}</button></div>
    </div>`, 'narrow');
  const pick = (attr, arr, cast = x => x) => m.querySelectorAll(`[${attr}]`).forEach(b => b.onclick = () => {
    const v = cast(b.getAttribute(attr)); const i = arr.indexOf(v);
    i < 0 ? arr.push(v) : arr.splice(i, 1); b.classList.toggle('on'); });
  const lists = (f.lists || []).slice(), tags = (f.tags || []).slice(), prios = (f.priorities || []).slice();
  pick('data-sfl', lists); pick('data-sft', tags); pick('data-sfp', prios, Number);
  m.querySelector('#sfSave').onclick = () => {
    const filters = {lists, tags, priorities:prios, dateRange:m.querySelector('#sfRange').value || null,
      completion:m.querySelector('#sfDone').value, hasSubtasks:null, search:''};
    const name = m.querySelector('#sfName').value.trim() || 'Filter';
    if(sl){ sl.name = name; sl.filters = filters; }
    else { const n = {id:uid(), name, icon:'⌗', filters, sortBy:'dueDate', sortOrder:'asc', defaultView:'list'};
      p.smartLists.push(n); S._planSel = {kind:'smartlist', id:n.id}; }
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const d = m.querySelector('#sfDel');
  if(d) d.onclick = () => { m.remove(); requestDelete({label:sl.name, after:planRedraw,
    remove: () => { if(planSel().id === sl.id) S._planSel = {kind:'smart', id:'today'};
      return spliceOut(p.smartLists, x => x.id === sl.id); }}); };
}

/* ---------- dropping a task between two others, in any view ----------
   A drag in Planning has always meant "put this somewhere else" — another day,
   another column, another quadrant. It never meant "put this above that", so
   an order arranged by hand was possible only on Today.

   What a drop means is decided by where it lands, and the marker for that is
   the parent: a container marked data-ptgroup holds one run of tasks read in
   order, and two tasks in the same run are siblings whose relative order is
   the only thing a drop between them could be about. A task dropped into a
   different run is changing what it belongs to, and the run's own handler,
   sitting behind this one, is the thing that knows how to do that — so this
   handler simply does not call preventDefault and stands out of its way.

   The unit that moves is not always the draggable element: on the timeline the
   draggable is a name and the thing that moves is the whole row. So the unit
   is whichever ancestor is a direct child of the group, which is the element
   itself everywhere else. */
function planGroupOf(node){ return node ? node.closest('[data-ptgroup]') : null; }
function planUnitIn(group, node){
  let e = node;
  while(e && e.parentElement !== group) e = e.parentElement;
  return e;
}
function bindPlanTaskReorder(root, redraw){
  const SEL = '[data-ptrow], [data-ptcard], [data-ptgrip]';
  const idOf = n => n.dataset.ptrow || n.dataset.ptcard || n.dataset.ptgrip;
  const nodeFor = id => $$(SEL, root).find(n => idOf(n) === id);
  const clear = () => $$('.pt-dropat', root).forEach(n => n.classList.remove('pt-dropat', 'above', 'below'));
  /* every task on screen, once, in the order it is read in */
  const visible = () => { const out = [];
    $$(SEL, root).forEach(n => { const id = idOf(n); if(id && !out.includes(id)) out.push(id); });
    return out; };

  $$(SEL, root).forEach(node => {
    const id = idOf(node);
    const group = planGroupOf(node);
    if(!group) return;                       // a run that is not ordered, such as a month cell
    const unit = planUnitIn(group, node);
    if(!unit) return;
    /* returns true for "above", false for "below", null for "not my business" */
    const where = ev => {
      const drag = window._plTaskDrag;
      if(!drag || drag === id) return null;
      const src = nodeFor(drag);
      if(!src || planGroupOf(src) !== group) return null;
      const box = unit.getBoundingClientRect();
      return ev.clientY < box.top + box.height / 2;
    };
    unit.addEventListener('dragover', ev => {
      const before = where(ev);
      if(before == null) return;
      ev.preventDefault(); ev.stopPropagation();
      ev.dataTransfer.dropEffect = 'move';
      clear();
      unit.classList.add('pt-dropat', before ? 'above' : 'below');
    });
    unit.addEventListener('dragleave', () => unit.classList.remove('pt-dropat', 'above', 'below'));
    unit.addEventListener('drop', ev => {
      const before = where(ev);
      if(before == null) return;
      ev.preventDefault(); ev.stopPropagation();
      clear();
      const drag = window._plTaskDrag; window._plTaskDrag = null;
      if(planReorderVisible(visible(), drag, id, before)){ sound('click'); (redraw || rerender)(); }
    });
  });
}
